import { api, Fields } from "../../../core";
import { DefaultDict, UserError, ValidationError } from "../../../core/helper";
import { _super, MetaModel, Model } from "../../../core/models"
import { bool, f, floatCompare, floatRound } from "../../../core/tools";

@MetaModel.define()
class MrpUnbuild extends Model {
    static _module = module;
    static _name = "mrp.unbuild";
    static _description = "Unbuild Order";
    static _parents = ['mail.thread', 'mail.activity.mixin'];
    static _order = 'id desc';

    static label = Fields.Char('Reference', {copy: false, readonly: true, default: x => x._t('New')});
    static productId = Fields.Many2one('product.product', {string: 'Product', checkCompany: true,
        domain: "[['type', 'in', ['product', 'consu']], '|', ['companyId', '=', false], ['companyId', '=', companyId]]",
        required: true, states: {'done': [['readonly', true]]}});
    static companyId = Fields.Many2one('res.company', {string: 'Company', default: s => s.env.company(),
        required: true, index: true, states: {'done': [['readonly', true]]}});
    static productQty = Fields.Float('Quantity', {default: 1.0, required: true, states: {'done': [['readonly', true]]}});
    static productUomId = Fields.Many2one('uom.uom', {string: 'Unit of Measure', required: true, states: {'done': [['readonly', true]]}});
    static bomId = Fields.Many2one('mrp.bom', {string: 'Bill of Material',
        domain: `[
            '|',
                ['productId', '=', productId],
                '&',
                    ['productTemplateId.productVariantIds', '=', productId],
                    ['productId','=',false],
            ['type', '=', 'normal'],
            '|',
                ['companyId', '=', companyId],
                ['companyId', '=', false]
            ]
        `,
        states: {'done': [['readonly', true]]}, checkCompany: true});
    static moId = Fields.Many2one('mrp.production', {string: 'Manufacturing Order',
        domain: "[['state', '=', 'done'], ['companyId', '=', companyId], ['productId', '=?', productId], ['bomId', '=?', bomId]]", states: {'done': [['readonly', true]]}, checkCompany: true});
    static moBomId = Fields.Many2one('mrp.bom', {string: 'Bill of Material used on the Production Order', related: 'moId.bomId'});
    static lotId = Fields.Many2one('stock.production.lot', {string: 'Lot/Serial Number',
        domain: "[['productId', '=', productId], ['companyId', '=', companyId]]", checkCompany: true,
        states: {'done': [['readonly', true]]}, help: "Lot/Serial Number of the product to unbuild."});
    static hasTracking = Fields.Selection({related: 'productId.tracking', readonly: true});
    static locationId = Fields.Many2one('stock.location', {string: 'Source Location',
        domain: "[['usage','=','internal'], '|', ['companyId', '=', false], ['companyId', '=', companyId]]",
        checkCompany: true, required: true, states: {'done': [['readonly', true]]}, help: "Location where the product you want to unbuild is."});
    static locationDestId = Fields.Many2one('stock.location', {string: 'Destination Location',
        domain: "[['usage','=','internal'], '|', ['companyId', '=', false], ['companyId', '=', companyId]]",
        checkCompany: true, required: true, states: {'done': [['readonly', true]]}, help: "Location where you want to send the components resulting from the unbuild order."});
    static consumeLineIds = Fields.One2many('stock.move', 'consumeUnbuildId', {readonly: true,
        string: 'Consumed Disassembly Lines'});
    static produceLineIds = Fields.One2many('stock.move', 'unbuildId', {readonly: true,
        string: 'Processed Disassembly Lines'});
    static state = Fields.Selection([
        ['draft', 'Draft'],
        ['done', 'Done']], {string: 'Status', default: 'draft'});

    @api.onchange('companyId')
    async _onchangeCompanyId() {
        const company = await this['companyId'];
        if (company.ok) {
            const warehouse = await this.env.items('stock.warehouse').search([['companyId', '=', company.id]], {limit: 1});
            if ((await (await this['locationId']).companyId).ne(company)) {
                await this.set('locationId', await warehouse.lotStockId);
            }
            if ((await (await this['locationDestId']).companyId).ne(company)) {
                await this.set('locationDestId', await warehouse.lotStockId);
            }
        }
        else {
            await this.set('locationId', false);
            await this.set('locationDestId', false);
        }
    }

    @api.onchange('moId')
    async _onchangeMoId() {
        const mo = await this['moId'];
        if (mo.ok) {
            await this.set('productId', (await mo.productId).id);
            await this.set('bomId', await mo.bomId);
            await this.set('productUomId', await mo.productUomId);
            if (await this['hasTracking'] == 'serial') {
                await this.set('productQty', 1);
            }
            else {
                await this.set('productQty', await mo.productQty);
            }
            if (bool(await this['lotId']) && ! (await (await (mo.moveFinishedIds).moveLineIds).lotId).includes(await this['lotId'])) {
                return {'warning': {
                    'title': await this._t("Warning"),
                    'message': await this._t("The selected serial number does not correspond to the one used in the manufacturing order, please select another one.")
                }}
            }
        }
    }

    @api.onchange('lotId')
    async _onchangeLotId() {
        if (bool(await this['moId']) && bool(await this['lotId']) && !(await (await (await (await this['moId']).moveFinishedIds).moveLineIds).lotId).includes(await this['lotId'])) {
            return {'warning': {
                'title': await this._t("Warning"),
                'message': await this._t("The selected serial number does not correspond to the one used in the manufacturing order, please select another one.")
            }}
        }
    }

    @api.onchange('productId')
    async _onchangeProductId() {
        const product = await this['productId'];
        if (product.ok) {
            await this.set('bomId', (await this.env.items('mrp.bom')._bomFind(product, {companyId: (await this['companyId']).id})).get(product));
            await this.set('productUomId', (await (await this['moId']).productId).eq(product) && (await (await this['moId']).productUomId).id || (await product.uomId).id);
        }
    }

    @api.constrains('productQty')
    async _checkQty() {
        for (const unbuild of this) {
            if (await unbuild.productQty <= 0) {
                throw new ValidationError(await this._t('Unbuild Order product quantity has to be strictly positive.'));
            }
        }
    }

    @api.model()
    async create(vals) {
        if (!vals['label'] || vals['label'] == await this._t('New')) {
            vals['label'] = await this.env.items('ir.sequence').nextByCode('mrp.unbuild') || await this._t('New');
        }
        return _super(MrpUnbuild, this).create(vals);
    }

    @api.ondelete(false)
    async _unlinkExceptDone() {
        if ((await this.mapped('state')).includes('done')) {
            throw new UserError(await this._t("You cannot delete an unbuild order if the state is 'Done'."));
        }
    }

    async actionUnbuild() {
        this.ensureOne();
        await this._checkCompany();
        if (await (await this['productId']).tracking != 'none' && !(await this['lotId']).id) {
            throw new UserError(await this._t('You should provide a lot number for the final product.'));
        }

        if (bool(await this['moId'])) {
            if (await (await this['moId']).state != 'done') {
                throw new UserError(await this._t('You cannot unbuild a undone manufacturing order.'));
            }
        }

        let consumeMoves = await this._generateConsumeMoves();
        await consumeMoves._actionConfirm();
        const produceMoves = await this._generateProduceMoves();
        await produceMoves._actionConfirm();

        const finishedMoves = await consumeMoves.filtered(async (m)=> (await m.productId).eq(await this['productId']));
        consumeMoves = consumeMoves.sub(finishedMoves);

        if (await produceMoves.some(async (produceMove) => await produceMove.hasTracking != 'none' && !bool(await this['moId']))) {
            throw new UserError(await this._t('Some of your components are tracked, you have to specify a manufacturing order in order to retrieve the correct components.'))
        }

        if (await consumeMoves.some(async (consumeMove) => await consumeMove.hasTracking != 'none' && !bool(await this['moId']))) {
            throw new UserError(await this._t('Some of your byproducts are tracked, you have to specify a manufacturing order in order to retrieve the correct byproducts.'));
        }
        for (const finishedMove of finishedMoves) {
            if (await finishedMove.hasTracking != 'none') {
                await this.env.items('stock.move.line').create({
                    'moveId': finishedMove.id,
                    'lotId': (await this['lotId']).id,
                    'qtyDone': await finishedMove.productUomQty,
                    'productId': (await finishedMove.productId).id,
                    'productUomId': (await finishedMove.productUom).id,
                    'locationId': (await finishedMove.locationId).id,
                    'locationDestId': (await finishedMove.locationDestId).id,
                });
            }
            else {
                await finishedMove.set('quantityDone', await finishedMove.productUomQty);
            }
        }

        // TODO: Will fail if user do more than one unbuild with lot on the same MO. Need to check what other unbuild has aready took
        const qtyAlreadyUsed = new DefaultDict(() => 0.0);
        for (const move of produceMoves.or(consumeMoves)) {
            if (await move.hasTracking != 'none') {
                let originalMove = produceMoves.includes(move) && await (await this['moId']).moveRawIds;
                originalMove = bool(originalMove) ? originalMove : await (await this['moId']).moveFinishedIds;
                originalMove = await originalMove.filtered(async (m) => (await m.productId).eq(await move.productId));
                let neededQuantity = await move.productUomQty;
                let movesLines = await originalMove.mapped('moveLineIds');
                if (produceMoves.includes(move) && bool(await this['lotId'])) {
                    movesLines = await movesLines.filtered(async (ml) => (await (await ml.produceLineIds).lotId).includes(await this['lotId']));  // FIXME sle: double check with arm
                }
                for (const moveLine of movesLines) {
                    // Iterate over all move_lines until we unbuilded the correct quantity.
                    const takenQuantity = Math.min(neededQuantity, await moveLine.qtyDone - qtyAlreadyUsed.get(moveLine));
                    if (takenQuantity) {
                        await this.env.items('stock.move.line').create({
                            'moveId': move.id,
                            'lotId': (await moveLine.lotId).id,
                            'qtyDone': takenQuantity,
                            'productId': (await move.productId).id,
                            'productUomId': (await moveLine.productUomId).id,
                            'locationId': (await move.locationId).id,
                            'locationDestId': (await move.locationDestId).id,
                        });
                        neededQuantity -= takenQuantity;
                        qtyAlreadyUsed.set(moveLine, qtyAlreadyUsed.get(moveLine) + takenQuantity);
                    }
                }
            }
            else {
                await move.set('quantityDone', floatRound(await move.productUomQty, {precisionRounding: await (await move.productUom).rounding}));
            }
        }
        await finishedMoves._actionDone();
        await consumeMoves._actionDone();
        await produceMoves._actionDone();
        const producedMoveLineIds = await (await produceMoves.mapped('moveLineIds')).filtered(async (ml) => await ml.qtyDone > 0);
        await (await consumeMoves.mapped('moveLineIds')).write({'produceLineIds': [[6, 0, producedMoveLineIds.ids]]});
        if (bool(await this['moId'])) {
            const unbuildMsg = await this._t(
                "%s %s unbuilt in", await this['productQty'], await (await this['productUomId']).label) + f(" <a href=# data-oe-model=mrp.unbuild data-oe-id=%s>%s</a>", this.id, await this['displayName']);
            await (await this['moId']).messagePost({
                body: unbuildMsg,
                subtypeId: (await this.env.ref('mail.mtNote')).id});
        }
        return this.write({'state': 'done'});
    }

    async _generateConsumeMoves() {
        let moves = this.env.items('stock.move');
        for (const unbuild of this) {
            const [mo, productQty, bom] = await unbuild('moId', 'productQty', 'bomId');
            if (bool(mo)) {
                const finishedMoves = await (await mo.moveFinishedIds).filtered(async (move) => await move.state == 'done');
                const factor = productQty / await (await mo.productUomId)._computeQuantity(await mo.productQty, await unbuild.productUomId);
                for (const finishedMove of finishedMoves) {
                    moves = moves.add(await unbuild._generateMoveFromExistingMove(finishedMove, factor, await unbuild.locationId, await finishedMove.locationId));
                }
            }
            else {
                const factor = await (await unbuild.productUomId)._computeQuantity(productQty, await bom.productUomId) / await bom.productQty
                moves = moves.add(await unbuild._generateMoveFromBomLine(await this['productId'], await this['productUomId'], productQty));
                for (const byproduct of await bom.byproductIds) {
                    if (await byproduct._skipByproductLine(await unbuild.productId)) {
                        continue;
                    }
                    const quantity = await byproduct.productQty * factor;
                    moves = moves.add(await unbuild._generateMoveFromBomLine(await byproduct.productId, await byproduct.productUomId, quantity, {byproductId: byproduct.id}));
                }
            }
        }
        return moves;
    }

    async _generateProduceMoves() {
        let moves = this.env.items('stock.move');
        for (const unbuild of this) {
            const [mo, productUom, bom] = await unbuild('moId', 'productUomId', 'bomId'); 
            if (mo.ok) {
                const rawMoves = await (await mo.moveRawIds).filtered(async (move) => await move.state == 'done');
                const factor = await unbuild.productQty / await (await mo.productUomId)._computeQuantity(await mo.productQty, productUom)
                for (const rawMove of rawMoves) {
                    moves = moves.add(await unbuild._generateMoveFromExistingMove(rawMove, factor, await rawMove.locationDestId, await this['locationDestId']));
                }
            }
            else {
                const factor = await productUom._computeQuantity(await unbuild.productQty, await bom.productUomId) / await bom.productQty;
                const [boms, lines] = await bom.explode(await unbuild.productId, factor, {pickingType: await bom.pickingTypeId});
                for (const [line, lineData] of lines) {
                    moves = moves.add(await unbuild._generateMoveFromBomLine(await line.productId, await line.productUomId, lineData['qty'], {bomLineId: line.id}));
                }
            }
        }
        return moves;
    }

    async _generateMoveFromExistingMove(move, factor, locationId, locationDestId) {
        return this.env.items('stock.move').create({
            'label': await this['label'],
            'date': await this['createdAt'],
            'productId': (await move.productId).id,
            'productUomQty': await move.productUomQty * factor,
            'productUom': (await move.productUom).id,
            'procureMethod': 'makeToStock',
            'locationDestId': locationDestId.id,
            'locationId': locationId.id,
            'warehouseId': (await locationDestId.warehouseId).id,
            'unbuildId': this.id,
            'companyId': (await move.companyId).id,
            'originReturnedMoveId': move.id,
        });
    }

    async _generateMoveFromBomLine(product, productUom, quantity, opts: {bomLineId?: any, byproductId?: any}={}) {
        const productProdLocation = await (await product.withCompany(await this['companyId'])).propertyStockProduction;
        let locationId = bool(opts.bomLineId) && productProdLocation;
        locationId = bool(locationId) ? locationId : await this['locationId'];
        let locationDestId = bool(opts.bomLineId) && await this['locationDestId'];
        locationDestId = bool(locationDestId) ? locationDestId : productProdLocation;
        const warehouse = await locationDestId.warehouseId;
        return this.env.items('stock.move').create({
            'label': await this['label'],
            'date': await this['createdAt'],
            'bomLineId': opts.bomLineId || false,
            'byproductId': opts.byproductId || false,
            'productId': product.id,
            'productUomQty': quantity,
            'productUom': productUom.id,
            'procureMethod': 'makeToStock',
            'locationDestId': locationDestId.id,
            'locationId': locationId.id,
            'warehouseId': warehouse.id,
            'unbuildId': this.id,
            'companyId': (await this['companyId']).id,
        });
    }

    async actionValidate() {
        this.ensureOne();
        const precision = await this.env.items('decimal.precision').precisionGet('Product Unit of Measure');
        const [product, location]= await this('productId', 'locationId');
        const availableQty = await this.env.items('stock.quant')._getAvailableQuantity(product, location, {lotId: await this['lotId'], strict: true});
        const unbuildQty = await (await this['productUomId'])._computeQuantity(await this['productQty'], await product.uomId);
        if (floatCompare(availableQty, unbuildQty, {precisionDigits: precision}) >= 0) {
            return this.actionUnbuild();
        }
        else {
            return {
                'label': await product.displayName + await this._t(': Insufficient Quantity To Unbuild'),
                'viewMode': 'form',
                'resModel': 'stock.warn.insufficient.qty.unbuild',
                'viewId': (await this.env.ref('mrp.stockWarnInsufficientQtyUnbuildFormView')).id,
                'type': 'ir.actions.actwindow',
                'context': {
                    'default_productId': product.id,
                    'default_locationId': location.id,
                    'default_unbuildId': this.id,
                    'default_quantity': unbuildQty,
                    'default_productUomName': await product.uomName
                },
                'target': 'new'
            }
        }
    }
}
