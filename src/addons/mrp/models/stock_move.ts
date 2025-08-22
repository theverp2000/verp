import { _super, api, Command, Fields, MetaModel, Model } from "../../../core";
import { OrderedSet2 } from "../../../core/helper";
import { expression } from "../../../core/osv";
import { bool, extend, f, floatCompare, floatIsZero, floatRound, len, pop, sum } from "../../../core/tools";

@MetaModel.define()
class StockMoveLine extends Model {
    static _module = module;
    static _parents = 'stock.move.line';

    static workorderId = Fields.Many2one('mrp.workorder', {string: 'Work Order', checkCompany: true});
    static productionId = Fields.Many2one('mrp.production', {string: 'Production Order', checkCompany: true});
    static descriptionBomLine = Fields.Char({related: 'moveId.descriptionBomLine'});

    @api.depends('productionId')
    async _computePickingTypeId() {
        let lineToRemove = this.env.items('stock.move.line');
        for (const line of this) {
            if (!bool(await line.productionId)) {
                continue;
            }
            await line.set('pickingTypeId', await (await line.productionId).pickingTypeId);
            lineToRemove = lineToRemove.or(line);
        }
        return _super(StockMoveLine, this.sub(lineToRemove))._computePickingTypeId();
    }

    async _searchPickingTypeId(operator, value) {
        const result = await _super(StockMoveLine, this)._searchPickingTypeId(operator, value);
        if (['not in', '!=', 'not ilike'].includes(operator)) {
            if (value == false) {
                return expression.OR([[['productionId.pickingTypeId', operator, value]], result]);
            }
            else {
                return expression.AND([[['productionId.pickingTypeId', operator, value]], result]);
            }
        }
        else {
            if (value == false) {
                return expression.AND([[['productionId.pickingTypeId', operator, value]], result]);
            }
            else {
                return expression.OR([[['productionId.pickingTypeId', operator, value]], result]);
            }
        }
    }

    @api.modelCreateMulti()
    async create(values) {
        const result = await _super(StockMoveLine, this).create(values);
        for (const line of result) {
            // If the line is added in a done production, we need to map it
            // manually to the produced move lines in order to see them in the
            // traceability report
            const mo = await (await line.moveId).rawMaterialProductionId;
            if (bool(mo) && await line.state == 'done') {
                let finishedLots = await mo.lotProducingId;
                finishedLots = finishedLots.or(await (await (await (await mo.moveFinishedIds).filtered(async (m) => (await m.productId).ne(await mo.productId))).moveLineIds).lotId);
                if (bool(finishedLots)) {
                    const producedMoveLines = await (await (await mo.moveFinishedIds).moveLineIds).filtered(async (sml) => finishedLots.includes(await sml.lotId));
                    await line.set('produceLineIds', [[6, 0, producedMoveLines.ids]]);
                }
                else {
                    const producedMoveLines = await (await mo.moveFinishedIds).moveLineIds;
                    await line.set('produceLineIds', [[6, 0, producedMoveLines.ids]]);
                }
            }
        }
        return result;
    }

    async _getSimilarMoveLines() {
        let lines = await _super(StockMoveLine, this)._getSimilarMoveLines();
        const move = await this['moveId'];
        const [production, rawMaterialProduction] = await move('productionId', 'rawMaterialProductionId');
        if (bool(production)) {
            const finishedMoves = await production.moveFinishedIds;
            const finishedMoveLines = await finishedMoves.mapped('moveLineIds');
            lines = lines.or(await finishedMoveLines.filtered(async (ml) => (await ml.productId).eq(await this['productId']) && (bool(await ml.lotId) || await ml.lotName)));
        }
        if (bool(rawMaterialProduction)) {
            const rawMoves = await rawMaterialProduction.moveRawIds;
            const rawMovesLines = await rawMoves.mapped('moveLineIds');
            lines = lines.or(await rawMovesLines.filtered(async (ml) => (await ml.productId).eq(await this['productId']) && (bool(await ml.lotId) || await ml.lotName)));
        }
        return lines;
    }

    async _reservationIsUpdatable(quantity, reservedQuant) {
        this.ensureOne();
        if (bool(await (await this['produceLineIds']).lotId)) {
            let mlRemainingQty = await this['qtyDone'] - await this['productUomQty'];
            mlRemainingQty = await (await this['productUomId'])._computeQuantity(mlRemainingQty, await (await this['productId']).uomId, {roundingMethod: "HALF-UP"});
            if (floatCompare(mlRemainingQty, quantity, {precisionRounding: await (await (await this['productId']).uomId).rounding}) < 0) {
                return false;
            }
        }
        return _super(StockMoveLine, this)._reservationIsUpdatable(quantity, reservedQuant);
    }

    async write(vals) {
        for (const moveLine of this) {
            const move = await moveLine.moveId;
            const production = bool(await move.productionId) ? await move.productionId : await move.rawMaterialProductionId;
            if (bool(production) && await moveLine.state == 'done' && ['lotId', 'locationId', 'qtyDone'].some(field => field in vals)) {
                await moveLine._logMessage(production, moveLine, 'mrp.trackProductionMoveTemplate', vals);
            }
        }
        return _super(StockMoveLine, this).write(vals);
    }

    /**
     * Returns dictionary of products and corresponding values of interest grouped by optional kit_name

        Removes descriptions where description == kitName. kit_name is expected to be passed as a
        kwargs value because this is not directly stored in moveLineIds. Unfortunately because we
        are working with aggregated data, we have to loop through the aggregation to do this removal.

        arguments: kitName (optional): string value of a kit name passed as a kwarg
        returns: dictionary {sameKeyAsSuper: {sameValuesAsSuper, ...}
     * @param opts 
     * @returns 
     */
    async _getAggregatedProductQuantities(opts: {}={}) {
        const aggregatedMoveLines = _super(StockMoveLine, this)._getAggregatedProductQuantities(opts);
        const kitName = opts['kitName'];
        if (kitName) {
            for (const aggregatedMoveLine of aggregatedMoveLines) {
                if (aggregatedMoveLines[aggregatedMoveLine]['description'] == kitName) {
                    aggregatedMoveLines[aggregatedMoveLine]['description'] = "";
                }
            }
        }
        return aggregatedMoveLines;
    }
}

@MetaModel.define()
class StockMove extends Model {
    static _module = module;
    static _parents = 'stock.move';

    static createdProductionId = Fields.Many2one('mrp.production', {string: 'Created Production Order', checkCompany: true, index: true});
    static productionId = Fields.Many2one('mrp.production', {string: 'Production Order for finished products', checkCompany: true, index: true});
    static rawMaterialProductionId = Fields.Many2one('mrp.production', {string: 'Production Order for components', checkCompany: true, index: true});
    static unbuildId = Fields.Many2one('mrp.unbuild', {string: 'Disassembly Order', checkCompany: true});
    static consumeUnbuildId = Fields.Many2one('mrp.unbuild', {string: 'Consumed Disassembly Order', checkCompany: true});
    static allowedOperationIds = Fields.One2many('mrp.routing.workcenter', {related: 'rawMaterialProductionId.bomId.operationIds'});
    static operationId = Fields.Many2one('mrp.routing.workcenter', {string: 'Operation To Consume', checkCompany: true,
        domain: "[['id', 'in', allowedOperationIds]]"});
    static workorderId = Fields.Many2one('mrp.workorder', {string: 'Work Order To Consume', copy: false, checkCompany: true});
    // Quantities to process, in normalized UoMs
    static bomLineId = Fields.Many2one('mrp.bom.line', {string: 'BoM Line', checkCompany: true});
    static byproductId = Fields.Many2one('mrp.bom.byproduct', {string: 'By-products', checkCompany: true,
        help: "By-product line that generated the move in a manufacturing order"});
    static unitFactor = Fields.Float('Unit Factor', {compute: '_computeUnitFactor', store: true});
    static isDone = Fields.Boolean('Done', {compute: '_computeIsDone', store: true, help: 'Technical Field to order moves'});
    static orderFinishedLotIds = Fields.Many2many('stock.production.lot', {string: "Finished Lot/Serial Number", compute: '_computeOrderFinishedLotIds'});
    static shouldConsumeQty = Fields.Float('Quantity To Consume', {compute: '_computeShouldConsumeQty', digits: 'Product Unit of Measure'});
    static costShare = Fields.Float("Cost Share (%)", {digits: [5, 2],  // decimal = 2 is important for rounding calculations!!
        help: "The percentage of the final production cost for this by-product. The total of all by-products' cost share must be smaller or equal to 100."});
    static productQtyAvailable = Fields.Float('Product On Hand Quantity', {related: 'productId.qtyAvailable', depends: ['productId']});
    static productVirtualAvailable = Fields.Float('Product Forecasted Quantity', {related: 'productId.virtualAvailable', depends: ['productId']});
    static descriptionBomLine = Fields.Char('Kit', {compute: '_computeDescriptionBomLine'});

    @api.depends('bomLineId')
    async _computeDescriptionBomLine() {
        const bomLineDescription = {}
        for (const bom of await (await this['bomLineId']).bomId) {
            if (await bom.type != 'phantom') {
                continue;
            }
            const lineIds: any[] = (await bom.bomLineIds).ids;
            const total = len(lineIds);
            const name = await bom.displayName;
            lineIds.forEach((id, i) => bomLineDescription[id] = f('%s - %s/%s', name, i+1, total));
        }
        for (const move of this) {
            await move.set('descriptionBomLine', bomLineDescription[(await move.bomLineId).id]);
        }
    }

    @api.depends('rawMaterialProductionId.priority')
    async _computePriority() {
        await _super(StockMove, this)._computePriority();
        for (const move of this) {
            await move.set('priority', await (await move.rawMaterialProductionId).priority || await move.priority || '0');
        }
    }

    @api.depends('rawMaterialProductionId.pickingTypeId', 'productionId.pickingTypeId')
    async _computePickingTypeId() {
        await _super(StockMove, this)._computePickingTypeId();
        for (const move of this) {
            if (bool(await move.rawMaterialProductionId) || bool(await move.productionId)) {
                await move.set('pickingTypeId', await (bool(await move.rawMaterialProductionId) ? await move.rawMaterialProductionId : await move.productionId).pickingTypeId);
            }
        }
    }

    @api.depends('rawMaterialProductionId.lotProducingId')
    async _computeOrderFinishedLotIds() {
        for (const move of this) {
            await move.set('orderFinishedLotIds', await (await move.rawMaterialProductionId).lotProducingId);
        }
    }

    @api.depends('rawMaterialProductionId', 'productionId')
    async _computeIsLocked() {
        await _super(StockMove, this)._computeIsLocked();
        for (const move of this) {
            if (bool(await move.rawMaterialProductionId)) {
                await move.set('isLocked', await (await move.rawMaterialProductionId).isLocked);
            }
            if (bool(await move.productionId)) {
                await move.set('isLocked', await (await move.productionId).isLocked);
            }
        }
    }

    @api.depends('state')
    async _computeIsDone() {
        for (const move of this) {
            await move.set('isDone', ['done', 'cancel'].includes(await move.state));
        }
    }

    @api.depends('productUomQty',
        'rawMaterialProductionId', 'rawMaterialProductionId.productQty', 'rawMaterialProductionId.qtyProduced',
        'productionId', 'productionId.productQty', 'productionId.qtyProduced')
    async _computeUnitFactor() {
        for (const move of this) {
            const mo = bool(await move.rawMaterialProductionId) ? await move.rawMaterialProductionId : await move.productionId;
            if (bool(mo)) {
                await move.set('unitFactor', await move.productUomQty / ((await mo.productQty - await mo.qtyProduced) || 1));
            }
            else {
                await move.set('unitFactor', 1.0);
            }
        }
    }

    @api.depends('rawMaterialProductionId', 'rawMaterialProductionId.label', 'productionId', 'productionId.label')
    async _computeReference() {
        let movesWithReference = this.env.items('stock.move');
        for (const move of this) {
            const [rawMaterialProduction, production] = await move('rawMaterialProductionId', 'productionId')
            if (bool(rawMaterialProduction) && await rawMaterialProduction.label) {
                await move.set('reference', await rawMaterialProduction.label);
                movesWithReference = movesWithReference.or(move);
            }
            if (bool(production) && await production.label) {
                await move.set('reference', await production.label);
                movesWithReference = movesWithReference.or(move);
            }
        }
        await _super(StockMove, this.sub(movesWithReference))._computeReference();
    }

    @api.depends('rawMaterialProductionId.qtyProducing', 'productUomQty', 'productUom')
    async _computeShouldConsumeQty() {
        for (const move of this) {
            const mo = await move.rawMaterialProductionId;
            if (!bool(mo) || !bool(await move.productUom)) {
                await move.set('shouldConsumeQty', 0);
                continue;
            }
            await move.set('shouldConsumeQty', floatRound((await mo.qtyProducing - await mo.qtyProduced) * await move.unitFactor, {precisionRounding: await (await move.productUom).rounding}));
        }
    }

    @api.onchange('productUomQty')
    async _onchangeProductUomQty() {
        const mo = await this['rawMaterialProductionId'];
        if (bool(mo) && await this['hasTracking'] == 'none') {
            await this._updateQuantityDone(mo);
        }
    }

    @api.model()
    async defaultGet(fieldsList) {
        const defaults = await _super(StockMove, this).defaultGet(fieldsList);
        if (this.env.context['default_rawMaterialProductionId'] || this.env.context['default_productionId']) {
            const productionId = this.env.items('mrp.production').browse(this.env.context['default_rawMaterialProductionId'] ? this.env.context['default_rawMaterialProductionId'] : this.env.context['default_productionId']);
            if (!['draft', 'cancel'].includes(await productionId.state)) {
                if (await productionId.state != 'done') {
                    defaults['state'] = 'draft';
                }
                else {
                    defaults['state'] = 'done';
                    defaults['additional'] = true;
                }
                defaults['productUomQty'] = 0.0;
            }
            else if (await productionId.state == 'draft') {
                defaults['groupId'] = (await productionId.procurementGroupId).id;
                defaults['reference'] = await productionId.label;
            }
        }
        return defaults;
    }

    async write(vals) {
        if ('productUomQty' in vals) {
            if ('moveLineIds' in vals) {
                // first update lines then productUomQty as the later will unreserve
                // so possibly unlink lines
                const moveLineVals = pop(vals, 'moveLineIds');
                await _super(StockMove, this).write({'moveLineIds': moveLineVals});
            }
            const procurementRequests = [];
            for (const move of this) {
                if (await (await move.rawMaterialProductionId).state != 'confirmed'
                        || ! floatIsZero(await move.productUomQty, {precisionRounding: await (await move.productUom).rounding})
                        || await move.procureMethod != 'makeToOrder') {
                    continue;
                }
                const values = await move._prepareProcurementValues();
                const origin = await move._prepareProcurementOrigin();
                procurementRequests.push(this.env.items('procurement.group').Procurement(
                    await move.productId, vals['productUomQty'], await move.productUom,
                    await move.locationId, bool(await move.ruleId) && await (await move.ruleId).label || "/",
                    origin, await move.companyId, values));
            }
            await this.env.items('procurement.group').run(procurementRequests);
        }
        return _super(StockMove, this).write(vals);
    }

    async _actionAssign() {
        const result = await _super(StockMove, this)._actionAssign();
        for (const move of await this.filtered(async (x) => bool(await x.productionId) ? await x.productionId : await x.rawMaterialProductionId)) {
            if (bool(await move.moveLineIds)) {
                await (await move.moveLineIds).write({'productionId': (await move.rawMaterialProductionId).id,
                                               'workorderId': (await move.workorderId).id,});
            }
        }
        return result;
    }

    async _actionConfirm(merge=true, mergeInto: any=false) {
        const moves = await this.actionExplode();
        mergeInto = bool(mergeInto) && await mergeInto.actionExplode();
        // we go further with the list of ids potentially changed by actionExplode
        return _super(StockMove, moves)._actionConfirm(merge, mergeInto);
    }

    /**
     * Explodes pickings
     */
    async actionExplode() {
        // in order to explode a move, we must have a pickingTypeId on that move because otherwise the move
        // won't be assigned to a picking and it would be weird to explode a move into several if they aren't
        // all grouped in the same picking.
        let movesIdsToReturn = new OrderedSet2(),
        movesIdsToUnlink = new OrderedSet2(),
        phantomMovesValsList = [];
        for (const move of this) {
            const [product, production, productUom] = await move('productId', 'productionId', 'productUom');
            if (! bool(await move.pickingTypeId) || (bool(production) && (await production.productId).eq(product))) {
                movesIdsToReturn.add(move.id);
                continue;
            }
            const bom = (await (await this.env.items('mrp.bom').sudo())._bomFind(product, {companyId: (await move.companyId).id, bomType: 'phantom'})).get(product);
            if (!bool(bom)) {
                movesIdsToReturn.add(move.id);
                continue;
            }
            let factor;
            if (await (await move.pickingId).immediateTransfer || floatIsZero(await move.productUomQty, {precisionRounding: await productUom.rounding})) {
                factor = await productUom._computeQuantity(await move.quantityDone, await bom.productUomId) / await bom.productQty;
            }
            else {
                factor = await productUom._computeQuantity(await move.productUomQty, await bom.productUomId) / await bom.productQty;
            }
            const [boms, lines] = await (await bom.sudo()).explode(product, factor, {pickingType: await bom.pickingTypeId});
            for (const [bomLine, lineData] of lines) {
                if (await (await move.pickingId).immediateTransfer || floatIsZero(await move.productUomQty, {precisionRounding: await productUom.rounding})) {
                    extend(phantomMovesValsList, await move._generateMovePhantom(bomLine, 0, lineData['qty']));
                }
                else {
                    extend(phantomMovesValsList, await move._generateMovePhantom(bomLine, lineData['qty'], 0));
                }
            }
            // delete the move with original product which is not relevant anymore
            movesIdsToUnlink.add(move.id);
        }

        const moveToUnlink = await this.env.items('stock.move').browse(movesIdsToUnlink).sudo();
        await moveToUnlink.set('quantityDone', 0);
        await moveToUnlink._actionCancel();
        await moveToUnlink.unlink();
        if (phantomMovesValsList.length) {
            const phantomMoves = await this.env.items('stock.move').create(phantomMovesValsList);
            await phantomMoves._adjustProcureMethod();
            movesIdsToReturn.update((await phantomMoves.actionExplode()).ids);
        }
        return this.env.items('stock.move').browse(movesIdsToReturn);
    }

    async actionShowDetails() {
        this.ensureOne();
        const action = await _super(StockMove, this).actionShowDetails();
        const [rawMaterialProduction, production] = await this('rawMaterialProductionId', 'productionId');
        if (rawMaterialProduction.ok) {
            action['views'] = [[(await this.env.ref('mrp.viewStockMoveOperationsRaw')).id, 'form']];
            action['context']['showDestinationLocation'] = false;
            action['context']['activeMoId'] = rawMaterialProduction.id;
        }
        else if (production.ok) {
            action['views'] = [[(await this.env.ref('mrp.viewStockMoveOperationsFinished')).id, 'form']];
            action['context']['showSourceLocation'] = false;
            action['context']['showReservedQuantity'] = false;
        }
        return action;
    }

    async _actionCancel() {
        const result = await _super(StockMove, this)._actionCancel();
        const moToCancel = await (await this.mapped('rawMaterialProductionId')).filtered(async (p) => (await p.moveRawIds).all(async m => await m.state == 'cancel'));
        if (bool(moToCancel)) {
            await moToCancel._actionCancel();
        }
        return result;
    }

    async _prepareMoveSplitVals(qty) {
        const defaults = await _super(StockMove, this)._prepareMoveSplitVals(qty);
        defaults['workorderId'] = false;
        return defaults;
    }

    async _prepareProcurementOrigin() {
        this.ensureOne();
        if (bool(await this['rawMaterialProductionId']) && bool(await (await this['rawMaterialProductionId']).orderpointId)) {
            return this['origin'];
        }
        return _super(StockMove, this)._prepareProcurementOrigin();
    }

    async _preparePhantomMoveValues(bomLine, productQty, quantityDone) {
        return {
            'pickingId': bool(await this['pickingId']) ? (await this['pickingId']).id : false,
            'productId': (await bomLine.productId).id,
            'productUom': (await bomLine.productUomId).id,
            'productUomQty': productQty,
            'quantityDone': quantityDone,
            'state': 'draft',  // will be confirmed below
            'label': await this['label'],
            'bomLineId': bomLine.id,
        }
    }

    async _generateMovePhantom(bomLine, productQty, quantityDone) {
        let vals = [];
        if (['product', 'consu'].includes(await (await bomLine.productId).type)) {
            vals = await this.copyData(await this._preparePhantomMoveValues(bomLine, productQty, quantityDone));
            if (await this['state'] == 'assigned') {
                for (const v of vals) {
                    v['state'] = 'assigned';
                }
            }
        }
        return vals;
    }

    @api.model()
    async _consumingPickingTypes() {
        const result = await _super(StockMove, this)._consumingPickingTypes();
        result.push('mrpOperation');
        return result;
    }

    async _filterByProduct(prod) {
        let result = await _super(StockMove, this)._filterByProduct(prod);
        for (const sm of this) {
            const bom = await (await sm.bomLineId).bomId;
            if (await bom.type == 'phantom' && ((await bom.productId).eq(prod) || (!bool(await bom.productId) && (await bom.productTemplateId).eq(await prod.productTemplateId)))) {
                result = result.or(sm);
            }
        }
        return result;
    }

    async _getBackorderMoveVals() {
        this.ensureOne();
        return {
            'state': 'confirmed',
            'reservationDate': await this['reservationDate'],
            'moveOrigIds': await (await this.mapped('moveOrigIds')).map(m => Command.link(m.id)),
            'moveDestIds': await (await this.mapped('moveDestIds')).map(m => Command.link(m.id))
        }
    }

    async _getSourceDocument() {
        let result = await _super(StockMove, this)._getSourceDocument();
        result = bool(result) ? result : await this['productionId'];
        result = bool(result) ? result : await this['rawMaterialProductionId'];
        return result;
    }

    async _getUpstreamDocumentsAndResponsibles(visited) {
        const production = await this['productionId'];
        if (production.ok && !['done', 'cancel'].includes(await production.state)) {
            return [[production, await production.userId, visited]];
        }
        else {
            return _super(StockMove, this)._getUpstreamDocumentsAndResponsibles(visited);
        }
    }

    async _delayAlertGetDocuments() {
        let result = await _super(StockMove, this)._delayAlertGetDocuments();
        const productions = (await this['rawMaterialProductionId']).or(await this['productionId']);
        return result.concat([...productions]);
    }

    async _shouldBeAssigned() {
        const result = await _super(StockMove, this)._shouldBeAssigned();
        return bool(result && !(bool(await this['productionId']) || bool(await this['rawMaterialProductionId'])));
    }

    async _shouldBypassSetQtyProducing() {
        if (['done', 'cancel'].includes(await this['state'])) {
            return true;
        }
        // Do not update extra product quantities
        if (floatIsZero(await this['productUomQty'], {precisionRounding: await (await this['productUom']).rounding})) {
            return true;
        }
        if (await this['hasTracking'] != 'none' || await this['state'] == 'done') {
            return true;
        }
        return false;
    }

    async _shouldBypassReservation(forcedLocation=false) {
        const result = await _super(StockMove, this)._shouldBypassReservation(forcedLocation);
        return bool(result && !bool(await this['productionId']));
    }

    async _keyAssignPicking() {
        const keys = await _super(StockMove, this)._keyAssignPicking();
        return keys.concat([await this['createdProductionId']]);
    }

    @api.model()
    async _prepareMergeMovesDistinctFields() {
        let result = await _super(StockMove, this)._prepareMergeMovesDistinctFields();
        result = result.concat(['createdProductionId', 'costShare']);
        if (bool(await this['bomLineId']) && (await (await (await this['bomLineId']).bomId).mapped('type')).includes("phantom")) {
            result.push('bomLineId');
        }
        return result;
    }

    @api.model()
    async _prepareMergeNegativeMovesExcludedDistinctFields() {
        return (await _super(StockMove, this)._prepareMergeNegativeMovesExcludedDistinctFields()).concat(['createdProductionId']);
    }

    /**
     * Computes the quantity delivered or received when a kit is sold or purchased.
        A ratio 'qtyProcessed/qtyNeeded' is computed for each component, and the lowest one is kept
        to define the kit's quantity delivered or received.
        @param productId The kit itself a.k.a. the finished product
        @param kitQty The quantity from the order line
        @param kitBom The kit's BoM
        @param filters Dict of lambda expression to define the moves to consider and the ones to ignore
        @returns The quantity delivered or received
     */
    async _computeKitQuantities(productId, kitQty, kitBom, filters) {
        const qtyRatios = [];
        const [boms, bomSubLines] = await kitBom.explode(productId, kitQty);
        for (const [bomLine, bomLineData] of bomSubLines) {
            // skip service since we never deliver them
            if (await (await bomLine.productId).type == 'service') {
                continue;
            }
            if (floatIsZero(bomLineData['qty'], {precisionRounding: await (await bomLine.productUomId).rounding})) {
                // As BoMs allow components with 0 qty, a.k.a. optionnal components, we simply skip those
                // to avoid a division by zero.
                continue;
            }
            const bomLineMoves = await this.filtered(async (m)=> (await m.bomLineId).eq(bomLine));
            if (bool(bomLineMoves)) {
                // We compute the quantities needed of each components to make one kit.
                // Then, we collect every relevant moves related to a specific component
                // to know how many are considered delivered.
                const uomQtyPerKit = bomLineData['qty'] / bomLineData['originalQty'];
                const qtyPerKit = await (await bomLine.productUomId)._computeQuantity(uomQtyPerKit, await (await bomLine.productId).uomId, {round: false});
                if (! qtyPerKit) {
                    continue;
                }
                const incomingMoves = await bomLineMoves.filtered(filters['incomingMoves']);
                const outgoingMoves = await bomLineMoves.filtered(filters['outgoingMoves']);
                const qtyProcessed = sum(await incomingMoves.mapped('productQty')) - sum(await outgoingMoves.mapped('productQty'));
                // We compute a ratio to know how many kits we can produce with this quantity of that specific component
                qtyRatios.push(floatRound(qtyProcessed / qtyPerKit, {precisionRounding: await (await (await bomLine.productId).uomId).rounding}));
            }
            else {
                return 0.0;
            }
        }

        if (qtyRatios.length) {
            // Now that we have every ratio by components, we keep the lowest one to know how many kits we can produce
            // with the quantities delivered of each component. We use the floor division here because a 'partial kit'
            // doesn't make sense.
            return Math.floor(Math.min(...qtyRatios));
        }
        else {
            return 0.0;
        }
    }

    async _showDetailsInDraft() {
        this.ensureOne();
        let production = (await this['rawMaterialProductionId']);
        production = bool(production) ? production : await this['productionId'];
        if (bool(production) && (await this['state'] != 'draft' || await production.state != 'draft')) {
            return true;
        }
        else if (bool(production)) {
            return false;
        }
        else {
            return _super(StockMove, this)._showDetailsInDraft();
        }
    }

    async _updateQuantityDone(mo) {
        this.ensureOne();
        const newQty = floatRound((await mo.qtyProducing - await mo.qtyProduced) * await this['unitFactor'], {precisionRounding: await (await this['productUom']).rounding});
        if (! await this['isQuantityDoneEditable']) {
            await (await (await this['moveLineIds']).filtered(async (ml) => !['done', 'cancel'].includes(await ml.state))).set('qtyDone', 0);
            await this.set('moveLineIds', await (this as any)._setQuantityDonePrepareVals(newQty));
        }
        else {
            await this.set('quantityDone', newQty);
        }
    }

    async _updateCandidateMovesList(candidateMovesList) {
        await _super(StockMove, this)._updateCandidateMovesList(candidateMovesList);
        for (const production of await this.mapped('rawMaterialProductionId')) {
            candidateMovesList.push(await (await production.moveRawIds).filtered(async (m) => (await this['productId']).includes(await m.productId)));
        }
        for (const production of await this.mapped('productionId')) {
            candidateMovesList.push(await (await production.moveFinishedIds).filtered(async (m) => (await this['productId']).includes(await m.productId)));
        }
    }

    async _multiLineQuantityDoneSet(quantityDone) {
        if (bool(await this['rawMaterialProductionId'])) {
            await (await (await this['moveLineIds']).filtered(async (ml)=> !['done', 'cancel'].includes(await ml.state))).set('qtyDone', 0);
            await this.set('moveLineIds', await (this as any)._setQuantityDonePrepareVals(quantityDone));
        }
        else {
            await _super(StockMove, this)._multiLineQuantityDoneSet(quantityDone);
        }
    }

    async _prepareProcurementValues() {
        const result = await _super(StockMove, this)._prepareProcurementValues();
        result['bomLineId'] = (await this['bomLineId']).id;
        return result;
    }
}
