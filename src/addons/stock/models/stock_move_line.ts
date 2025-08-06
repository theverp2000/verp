import _ from "lodash";
import { api, tools } from "../../../core";
import { Fields, _Datetime } from "../../../core/fields";
import { DefaultDict, Dict, OrderedSet, OrderedSet2 } from "../../../core/helper/collections";
import { UserError, ValidationError } from "../../../core/helper/errors";
import { MetaModel, Model, _super } from "../../../core/models";
import { bool } from "../../../core/tools/bool";
import { floatCompare, floatIsZero, floatRound } from "../../../core/tools/float_utils";
import { len, sortedAsync, sum } from "../../../core/tools/iterable";
import { groupbyAsync, pop, setOptions } from "../../../core/tools/misc";
import { _f } from "../../../core/tools/string";
import { isInstance } from "../../../core/tools";

function Counter(word) {
    const counter = new Dict<any>();

    for (const letter of word) {
        if (!(letter in counter)) {
            counter[letter] = 0;
        }
        counter[letter] += 1;
    }

    return counter;
}

@MetaModel.define()
class StockMoveLine extends Model {
    static _module = module;
    static _name = 'stock.move.line';
    static _description = 'Product Moves (Stock Move Line)';
    static _recName = 'productId';
    static _order = 'resultPackageId desc, id';

    static pickingId = Fields.Many2one(
        'stock.picking', {
        string: 'Transfer', autojoin: true,
        checkCompany: true, index: true, help: 'The stock operation where the packing has been made'
    })
    static moveId = Fields.Many2one(
        'stock.move', {
        string: 'Stock Move', checkCompany: true,
        help: "Change to a better name", index: true
    });
    static companyId = Fields.Many2one('res.company', { string: 'Company', readonly: true, required: true, index: true });
    static productId = Fields.Many2one('product.product', { string: 'Product', ondelete: "CASCADE", checkCompany: true, domain: "[['type', '!=', 'service'], '|', ['companyId', '=', false], ['companyId', '=', companyId]]" });
    static productUomId = Fields.Many2one('uom.uom', { string: 'Unit of Measure', required: true, domain: "[['categoryId', '=', productUomCategoryId]]" });
    static productUomCategoryId = Fields.Many2one({ related: 'productId.uomId.categoryId' });
    static productQty = Fields.Float(
        'Real Reserved Quantity', {
        digits: 0, copy: false,
        compute: '_computeProductQty', inverse: '_setProductQty', store: true
    });
    static productUomQty = Fields.Float(
        'Reserved', { default: 0.0, digits: 'Product Unit of Measure', required: true, copy: false });
    static qtyDone = Fields.Float('Done', { default: 0.0, digits: 'Product Unit of Measure', copy: false });
    static packageId = Fields.Many2one(
        'stock.quant.package', { string: 'Source Package', ondelete: 'RESTRICT', checkCompany: true, domain: "[['locationId', '=', locationId]]" });
    static packageLevelId = Fields.Many2one('stock.package.level', { string: 'Package Level', checkCompany: true });
    static lotId = Fields.Many2one(
        'stock.production.lot', {
        string: 'Lot/Serial Number',
        domain: "[['productId', '=', productId], ['companyId', '=', companyId]]", checkCompany: true
    });
    static lotName = Fields.Char('Lot/Serial Number Name');
    static resultPackageId = Fields.Many2one(
        'stock.quant.package', {
        string: 'Destination Package',
        ondelete: 'RESTRICT', required: false, checkCompany: true,
        domain: "['|', '|', ['locationId', '=', false], ['locationId', '=', locationDestId], ['id', '=', packageId]]",
        help: "If set, the operations are packed into this package"
    });
    static date = Fields.Datetime('Date', { default: () => _Datetime.now(), required: true });
    static ownerId = Fields.Many2one(
        'res.partner', {
        string: 'From Owner', checkCompany: true,
        help: "When validating the transfer, the products will be taken from this owner."
    });
    static locationId = Fields.Many2one('stock.location', { string: 'From', domain: "[['usage', '!=', 'view']]", checkCompany: true, required: true });
    static locationDestId = Fields.Many2one('stock.location', { string: 'To', domain: "[['usage', '!=', 'view']]", checkCompany: true, required: true });
    static lotsVisible = Fields.Boolean({ compute: '_computeLotsVisible' });
    static pickingPartnerId = Fields.Many2one({ related: 'pickingId.partnerId', readonly: true });
    static pickingCode = Fields.Selection({ related: 'pickingId.pickingTypeId.code', readonly: true });
    static pickingTypeId = Fields.Many2one(
        'stock.picking.type', { string: 'Operation type', compute: '_computePickingTypeId', search: '_searchPickingTypeId' });
    static pickingTypeUseCreateLots = Fields.Boolean({ related: 'pickingId.pickingTypeId.useCreateLots', readonly: true });
    static pickingTypeUseExistingLots = Fields.Boolean({ related: 'pickingId.pickingTypeId.useExistingLots', readonly: true });
    static pickingTypeEntirePacks = Fields.Boolean({ related: 'pickingId.pickingTypeId.showEntirePacks', readonly: true });
    static state = Fields.Selection({ related: 'moveId.state', store: true, relatedSudo: false });
    static isInitialDemandEditable = Fields.Boolean({ related: 'moveId.isInitialDemandEditable' });
    static isInventory = Fields.Boolean({ related: 'moveId.isInventory' });
    static isLocked = Fields.Boolean({ related: 'moveId.isLocked', readonly: true });
    static consumeLineIds = Fields.Many2many('stock.move.line', { relation: 'stockMoveLineConsumeRel', column1: 'consumeLineId', column2: 'produceLineId', help: "Technical link to see who consumed what. " });
    static produceLineIds = Fields.Many2many('stock.move.line', { relation: 'stockMoveLineConsumeRel', column1: 'produceLineId', column2: 'consumeLineId', help: "Technical link to see which line was produced with this. " });
    static reference = Fields.Char({ related: 'moveId.reference', store: true, relatedSudo: false, readonly: false });
    static tracking = Fields.Selection({ related: 'productId.tracking', readonly: true });
    static origin = Fields.Char({ related: 'moveId.origin', string: 'Source' });
    static descriptionPicking = Fields.Text({ string: "Description picking" });

    @api.depends('pickingId.pickingTypeId', 'productId.tracking')
    async _computeLotsVisible() {
        for (const line of this) {
            const picking = await line.pickingId;
            const pickingTypeId = await picking.pickingTypeId;
            if (bool(pickingTypeId) && await (await line.productId).tracking !== 'none') {  // TDE FIXME: not sure correctly migrated
                await line.set('lotsVisible', await pickingTypeId.useExistingLots || await pickingTypeId.useCreateLots);
            }
            else {
                await line.set('lotsVisible', await (await line.productId).tracking !== 'none');
            }
        }
    }

    @api.depends('pickingId')
    async _computePickingTypeId() {
        await this.set('pickingTypeId', false);
        for (const line of this) {
            const pickingId = await line.pickingId;
            if (bool(pickingId)) {
                await line.set('pickingTypeId', await pickingId.pickingTypeId);
            }
        }
    }

    async _searchPickingTypeId(operator, value) {
        return [['pickingId.pickingTypeId', operator, value]]
    }

    @api.depends('productId', 'productUomId', 'productUomQty')
    async _computeProductQty() {
        for (const line of this) {
            await line.set('productQty', await (await line.productUomId)._computeQuantity(await line.productUomQty, await (await line.productId).uomId, { roundingMethod: 'HALF-UP' }));
        }
    }

    /**
     * The meaning of productQty field changed lately and is now a functional field computing the quantity in the default product UoM. This code has been added to raise an error if a write is made given a value for `productQty`, where the same write should set the `productUomQty` field instead, in order to detect errors.
     */
    async _setProductQty() {
        throw new UserError(await this._t('The requested operation cannot be processed because of a programming error setting the `productQty` field instead of the `productUomQty`.'));
    }

    @api.constrains('lotId', 'productId')
    async _checkLotProduct() {
        for (const line of this) {
            const lotId = await line.lotId;
            if (bool(lotId)) {
                const lineProduct = await line.productId;
                const lotProduct = await (await lotId.sudo()).productId;
                if (lineProduct.ne(lotProduct)) {
                    throw new ValidationError(_f(await this._t(
                        'This lot {lotName} ({lotProductId}) is incompatible with this product ({productId}) {productName}'),
                        {
                            lotName: await lotId.label,
                            lotProductId: lotProduct.id,
                            productName: await lineProduct.displayName,
                            productId: lineProduct.id
                        }));
                }
            }
        }
    }

    @api.constrains('productUomQty')
    async _checkReservedDoneQuantity() {
        for (const moveLine of this) {
            if (await moveLine.state === 'done' && !floatIsZero(await moveLine.productUomQty, { precisionDigits: await this.env.items('decimal.precision').precisionGet('Product Unit of Measure') })) {
                throw new ValidationError(await this._t('A done move line should never have a reserved quantity.'));
            }
        }
    }

    @api.constrains('qtyDone')
    async _checkPositiveQtyDone() {
        if (await this.some(async ml => await ml.qtyDone < 0)) {
            throw new ValidationError(await this._t('You can not enter negative quantities.'));
        }
    }

    @api.onchange('productId', 'productUomId')
    async _onchangeProductId() {
        const productId = await this['productId']
        if (bool(productId)) {
            const pickingId = await this['pickingId'];
            if (bool(pickingId)) {
                const product = await productId.withContext({ lang: await (await pickingId.partnerId).lang || await (await this.env.user()).lang });
                await this.set('descriptionPicking', await product._getDescription(await pickingId.pickingTypeId));
            }
            await this.set('lotsVisible', await productId.tracking !== 'none');
            const productUomId = await this['productUomId'];
            if (!bool(productUomId) || (await productUomId.categoryId).ne(await (await productId.uomId).categoryId)) {
                const moveId = await this['moveId'];
                if ((await moveId.productUom).ok) {
                    await this.set('productUomId', (await moveId.productUom).id);
                }
                else {
                    await this.set('productUomId', (await productId.uomId).id);
                }
            }
        }
    }

    /** 
     * When the user is encoding a move line for a tracked product, we apply some logic to help him. This includes:
            - automatically switch `qtyDone` to 1.0
            - warn if he has already encoded `lotName` in another move line
            - warn (and update if appropriate) if the SN is in a different source location than selected
    */
    @api.onchange('lotName', 'lotId')
    async _onchangeSerialNumber() {
        const res = {};
        const productId = await this['productId'];
        if (await productId.tracking === 'serial') {
            if (! await this['qtyDone']) {
                await this.set('qtyDone', 1);
            }
            let message, recommendedLocation;
            const [lotName, lotId] = await this('lotName', 'lotId');
            if (lotName || bool(lotId)) {
                const moveLinesToCheck = (await this._getSimilarMoveLines()).sub(this);
                if (lotName) {
                    const counter = Counter(await Promise.all([...moveLinesToCheck].map(async (line) => line.lotName)));
                    if (counter.get(lotName) && counter[lotName] > 1) {
                        message = await this._t('You cannot use the same serial number twice. Please correct the serial numbers encoded.');
                    }
                    else if (!bool(lotId)) {
                        const lots = await this.env.items('stock.production.lot').search([
                            ['productId', '=', (await this['productId']).id], ['label', '=', await this['lotName']], ['companyId', '=', (await this['companyId']).id]
                        ])
                        const quants = await (await lots.quantIds).filtered(async (q) => await q.quantity != 0 && ['customer', 'internal', 'transit'].includes(await (await q.locationId).usage));
                        if (bool(quants)) {
                            message = await this._t('Serial number (%s) already exists in location(s): %s. Please correct the serial number encoded.', lotName, (await (await quants.locationId).mapped('displayName')).join(', '));
                        }
                    }
                }
                else if (bool(lotId)) {
                    const counter = Counter(await Promise.all([...moveLinesToCheck].map(async (line) => (await line.lotId).id)));
                    if (counter.get(lotId.id) && counter[lotId.id] > 1) {
                        message = await this._t('You cannot use the same serial number twice. Please correct the serial numbers encoded.');
                    }
                    else {
                        // check if in correct source location
                        [message, recommendedLocation] = await this.env.items['stock.quant']._checkSerialNumber([
                            await this['productId'],
                            await this['lotId'],
                            await this['companyId'],
                            await this['locationId'],
                            await (await this['pickingId']).locationId
                        ]);
                        if (bool(recommendedLocation)) {
                            await this.set('locationId', recommendedLocation);
                        }
                    }
                }
            }
            if (message) {
                res['warning'] = { 'title': await this._t('Warning'), 'message': message }
            }
        }
        return res;
    }

    /**
     * When the user is encoding a move line for a tracked product, we apply some logic to help him. This onchange will warn him if he set `qtyDone` to a non-supported value.
     * @returns 
     */
    @api.onchange('qtyDone', 'productUomId')
    async _onchangeQtyDone() {
        const res = {};
        let [qtyDone, productId, productUomId] = await this('qtyDone', 'productId', 'productUomId');
        if (qtyDone && await productId.tracking === 'serial') {
            qtyDone = await productUomId._computeQuantity(qtyDone, await productId.uomId);
            if (floatCompare(qtyDone, 1.0, { precisionRounding: await (await productId.uomId).rounding }) != 0) {
                const message = await this._t('You can only process 1.0 %s of products with unique serial number.', await (await productId.uomId).label);
                res['warning'] = { 'title': await this._t('Warning'), 'message': message };
            }
        }
        return res;
    }

    @api.onchange('resultPackageId', 'productId', 'productUomId', 'qtyDone')
    async _onchangePutawayLocation() {
        if (!bool(this.id) && await this.userHasGroups('stock.groupStockMultiLocations') && bool(await this['productId']) && await this['qtyDone']) {
            const qtyDone = await (await this['productUomId'])._computeQuantity(await this['qtyDone'], await (await this['productId']).uomId);
            const defaultDestLocation = await this._getDefaultDestLocation();
            await this.set('locationDestId', await (await defaultDestLocation.withContext({ excludeSmlIds: this.ids }))._getPutawayStrategy(
                await this['productId'], {
                    quantity: qtyDone, 
                    pack: await this['resultPackageId'],
                    packaging: await (await this['moveId']).productPackagingId
                }
            ));
        }
    }

    async _applyPutawayStrategy() {
        if (this._context['avoidPutawayRules']) {
            return;
        }
        let self = await this.withContext({ doNotUnreserve: true });
        for (let [pack, smls] of await groupbyAsync(self, async (sml) => sml.resultPackageId)) {
            smls = self.env.items('stock.move.line').concat(...smls);
            let excludedSmls = smls;
            if (bool(await pack.packageTypeId)) {
                const bestLoc = await (await (await (await smls.moveId).locationDestId).withContext({ excludeSmlIds: excludedSmls.ids, products: await smls.productId }))._getPutawayStrategy(self.env.items('product.product'), { pack });
                await smls.set('locationDestId', bestLoc);
                await (await smls.packageLevelId).set('locationDestId', bestLoc);
            }
            else if (bool(pack)) {
                const usedLocations = new Set<any>();
                for (const sml of smls) {
                    if (usedLocations.size > 1) {
                        break;
                    }
                    await sml.set('locationDestId', await (await (await (await sml.moveId).locationDestId).withContext({ excludeSmlIds: excludedSmls.ids }))._getPutawayStrategy(await sml.productId, { quantity: await sml.productUomQty }));
                    excludedSmls = excludedSmls.sub(sml);
                    usedLocations.add((await sml.locationDestId).id);
                }
                if (usedLocations.size > 1) {
                    await smls.set('locationDestId', await (await smls.moveId).locationDestId);
                }
                else {
                    await (await smls.packageLevelId).set('locationDestId', await smls.locationDestId);
                }
            }
            else {
                for (const sml of smls) {
                    let qty = Math.max(await sml.productUomQty, await sml.qtyDone);
                    const putawayLocId = await (await (await (await sml.moveId).locationDestId).withContext({ excludeSmlIds: excludedSmls.ids }))._getPutawayStrategy(await sml.productId, { 
                        quantity: qty, 
                        packaging: await (await sml.moveId).productPackagingId 
                    });
                    if (putawayLocId.ne(await sml.locationDestId)) {
                        await sml.set('locationDestId', putawayLocId);
                    }
                    excludedSmls = excludedSmls.sub(sml);
                }
            }
        }
    }

    async _getDefaultDestLocation() {
        if (! await this.userHasGroups('stock.groupStockStorageCategories')) {
            return (await this['locationDestId']).slice(0, 1);
        }
        if (this.env.context['default_locationDestId']) {
            return this.env.items('stock.location').browse([this.env.context['default_locationDestId']]);
        }
        let destId = await (await this['moveId']).locationDestId;
        destId = bool(destId) ? destId : await (await this['pickingId']).locationDestId;
        destId = bool(destId) ? destId : await this['locationDestId'];
        return destId[0];
    }

    async _getPutawayAdditionalQty() {
        const addtionalQty = new Dict();
        for (const ml of this._origin) {
            const qty = Math.max(await (await ml.productUomId)._computeQuantity(await ml.qtyDone, await (await ml.productId).uomId), await ml.productUomQty);
            addtionalQty[(await ml.locationDestId).id] = addtionalQty.get((await ml.locationDestId).id, 0) - qty;
        }
        return addtionalQty;
    }

    async init() {
        if (!tools.indexExists(this._cr, 'stock_move_line_free_reservation_index')) {
            await this._cr.execute(`
                CREATE INDEX stock_move_line_free_reservation_index
                ON
                    "stockMoveLine" (id, "companyId", "productId", "lotId", "locationId", "ownerId", "packageId")
                WHERE
                    (state IS NULL OR state NOT IN ('cancel', 'done')) AND "productQty" > 0`);
        }
    }

    @api.modelCreateMulti()
    async create(valsList) {
        for (const vals of valsList) {
            if (vals['moveId']) {
                vals['companyId'] = (await this.env.items('stock.move').browse(vals['moveId']).companyId).id;
            }
            else if (vals['pickingId']) {
                vals['companyId'] = (await this.env.items('stock.picking').browse(vals['pickingId']).companyId).id;
            }
        }

        const mls = await _super(StockMoveLine, this).create(valsList);

        const self = this;
        async function createMove(moveLine) {
            const newMove = await self.env.items('stock.move').create(await moveLine._prepareStockMoveVals());
            await moveLine.set('moveId', newMove.id);
        }

        // If the move line is directly create on the picking view.
        // If this picking is already done we should generate an
        // associated done move.
        for (const moveLine of mls) {
            const pickingId = await moveLine.pickingId;
            if (bool(await moveLine.moveId) || !bool(pickingId)) {
                continue;
            }
            if (await pickingId.state !== 'done') {
                let moves = await (await pickingId.moveLines).filtered(async (x) => (await x.productId).eq(await moveLine.productId));
                moves = await sortedAsync(moves, async (m) => await m.quantityDone < await m.productQty, true);
                if (len(moves)) {
                    await moveLine.set('moveId', moves[0].id);
                }
                else {
                    await createMove(moveLine);
                }
            }
            else {
                await createMove(moveLine);
            }
        }

        const movesToUpdate = await (await mls.filtered(
            async (ml) => {
                const moveId = await ml.moveId;
                return bool(moveId) &&
                    await ml.qtyDone && (
                    await moveId.state == 'done' || (
                        bool(await moveId.pickingId) &&
                        await (await moveId.pickingId).immediateTransfer
                    ));
            }
        )).moveId;
        for (const move of movesToUpdate) {
            await (await move.withContext({ avoidPutawayRules: true })).set('productUomQty', await move.quantityDone);
        }
        for (const [ml, vals] of _.zip<any>([...mls], valsList)) {
            if (this.env.context['importFile'] && await ml.productUomQty && ! await (await ml.moveId)._shouldBypassReservation()) {
                throw new UserError(await this._t("It is not allowed to import reserved quantity, you have to use the quantity directly."));
            }

            if (await ml.state === 'done') {
                if (await (await ml.productId).type == 'product') {
                    const [productId, lotId, packageId, ownerId, locationId, locationDestId, resultPackageId] = await ml('productId', 'lotId', 'packageId', 'ownerId', 'locationId', 'locationDestId', 'resultPackageId');

                    const Quant = this.env.items('stock.quant');
                    const quantity = await (await ml.productUomId)._computeQuantity(await ml.qtyDone, await (await (await ml.moveId).productId).uomId, { roundingMethod: 'HALF-UP' });
                    let inDate, availableQty;
                    [availableQty, inDate] = await Quant._updateAvailableQuantity(productId, await ml.locationId, -quantity, { lotId, packageId, ownerId });
                    if (availableQty < 0 && lotId.ok) {
                        // see if we can compensate the negative quants with some untracked quants
                        const untrackedQty = await Quant._getAvailableQuantity(productId, locationId, { lotId: false, packageId, ownerId, strict: true });
                        if (untrackedQty) {
                            const takenFromUntrackedQty = Math.min(untrackedQty, Math.abs(quantity));
                            await Quant._updateAvailableQuantity(productId, locationId, -takenFromUntrackedQty, { lotId: false, packageId, ownerId });
                            await Quant._updateAvailableQuantity(productId, locationId, takenFromUntrackedQty, { lotId, packageId, ownerId });
                        }
                    }
                    await Quant._updateAvailableQuantity(productId, locationDestId, quantity, { lotId, packageId: resultPackageId, ownerId, inDate });
                }
                const nextMoves = await (await (await ml.moveId).moveDestIds).filtered(async (move) => !['done', 'cancel'].includes(await move.state));
                await nextMoves._doUnreserve();
                await nextMoves._actionAssign();

            }
            return mls;
        }
    }

    async write(vals) {
        if (this.env.context['bypassReservationUpdate']) {
            return _super(StockMoveLine, this).write(vals);
        }

        let some;
        for (const ml of this) {
            if ((vals['state'] ?? await ml.state) !== 'draft' && vals['productId'] !== (await ml.productId).id) {
                some = true;
                break;
            }
        }
        if ('productId' in vals && some) {
            throw new UserError(await this._t("Changing the product is only allowed in 'Draft' state."));
        }

        let movesToRecomputeState = this.env.items('stock.move');
        const Quant = this.env.items('stock.quant');
        const precision = await this.env.items('decimal.precision').precisionGet('Product Unit of Measure');
        const triggers = [
            ['locationId', 'stock.location'],
            ['locationDestId', 'stock.location'],
            ['lotId', 'stock.production.lot'],
            ['packageId', 'stock.quant.package'],
            ['resultPackageId', 'stock.quant.package'],
            ['ownerId', 'res.partner'],
            ['productUomId', 'uom.uom']
        ];
        const updates = {};
        for (const [key, model] of triggers) {
            if (key in vals) {
                updates[key] = this.env.items(model).browse(vals[key]);
            }
        }
        if ('resultPackageId' in updates) {
            for (const ml of await this.filtered(async (ml) => bool(ml.packageLevelId))) {
                if (updates['resultPackageId']) {
                    const packageLevelId = await ml.packageLevelId;
                    await packageLevelId.set('packageId', updates['resultPackageId']);
                }
                else {
                    // TODO: make package levels less of a pain and fix this
                    const packageLevel = await ml.packageLevelId;
                    await ml.set('packageLevelId', false);
                    await packageLevel.unlink();
                }
            }
        }
        // When we try to write on a reserved move line any fields from `triggers` or directly
        // `productUomQty` (the actual reserved quantity), we need to make sure the associated
        // quants are correctly updated in order to not make them out of sync (i.e. the sum of the
        // move lines `productUomQty` should always be equal to the sum of `reservedQuantity` on
        // the quants). If the new charateristics are not available on the quants, we chose to
        // reserve the maximum possible.
        if (bool(updates) || 'productUomQty' in vals) {
            for (const ml of await this.filtered(async (ml) => ['partiallyAvailable', 'assigned'].includes(await ml.state) && await (await ml.productId).type === 'product')) {
                const [productId, productUomId, productQty, moveId, locationId, packageId, lotId, ownerId] = await ml('productId', 'productUomId', 'productQty', 'moveId', 'locationId', 'packageId', 'lotId', 'ownerId');
                let newProductUomQty;
                const uomId = await productId.uomId;
                if ('productUomQty' in vals) {
                    newProductUomQty = await productUomId._computeQuantity(vals['productUomQty'], uomId, { roundingMethod: 'HALF-UP' });
                    // Make sure `productUomQty` is not negative.
                    if (floatCompare(newProductUomQty, 0, { precisionRounding: await uomId.rounding }) < 0) {
                        throw new UserError(await this._t('Reserving a negative quantity is not allowed.'));
                    }
                }
                else {
                    newProductUomQty = productQty;
                }
                // Unreserve the old charateristics of the move line.
                if (! await moveId._shouldBypassReservation(locationId)) {
                    try {
                        await Quant._updateReservedQuantity(productId, locationId, -productQty, { lotId, packageId, ownerId, strict: true });
                    } catch (e) {
                        // except UserError:
                        // If we were not able to unreserve on tracked quants, we can use untracked ones.
                        if (bool(lotId)) {
                            await Quant._updateReservedQuantity(productId, locationId, -productQty, { lotId: false, packageId, ownerId, strict: true });
                        }
                        else {
                            throw e;
                        }
                    }
                }
                // Reserve the maximum available of the new charateristics of the move line.
                if (! await moveId._shouldBypassReservation(updates['locationId'] ?? locationId)) {
                    let reservedQty = 0;
                    try {
                        const q = await Quant._updateReservedQuantity(productId, updates['locationId'] ?? locationId, newProductUomQty, { lotId: updates['lotId'] ?? lotId, packageId: updates['packageId'] ?? packageId, ownerId: updates['ownerId'] ?? ownerId, strict: true });
                        reservedQty = sum(q.map(x => x[1]));
                    } catch (e) {
                        if (!isInstance(e, UserError)) {
                            throw e;
                        }
                    }
                    if (reservedQty != newProductUomQty) {
                        newProductUomQty = await uomId._computeQuantity(reservedQty, productUomId, { roundingMethod: 'HALF-UP' });
                        movesToRecomputeState = movesToRecomputeState.or(await ml.moveId);
                        await (await ml.withContext({ bypassReservationUpdate: true })).set('productUomQty', newProductUomQty);
                        // we don't want to override the new reserved quantity
                        pop(vals, 'productUomQty', null);
                    }
                }
            }
        }
        // When editing a done move line, the reserved availability of a potential chained move is impacted. Take care of running again `_action_assign` on the concerned moves.
        let nextMoves = this.env.items('stock.move');
        if (bool(updates) || 'qtyDone' in vals) {
            let mls = await this.filtered(async (ml) => await (await ml.moveId).state === 'done' && await (await ml.productId).type === 'product');
            if (!bool(updates)) {  // we can skip those where qtyDone is already good up to UoM rounding
                mls = await mls.filtered(async (ml) => !floatIsZero(await ml.qtyDone - vals['qtyDone'], { precisionRounding: await (await ml.productUomId).rounding }));
            }
            for (const ml of mls) {
                let [productId, productUomId, productQty, moveId, locationId, locationDestId, packageId, lotId, ownerId, qtyDone, resultPackageId] = await ml('productId', 'productUomId', 'productQty', 'moveId', 'locationId', 'locationDestId', 'packageId', 'lotId', 'ownerId', 'qtyDone', 'resultPackageId');
                // undo the original move line
                const qtyDoneOrig = await productUomId._computeQuantity(qtyDone, await (await moveId.productId).uomId, { roundingMethod: 'HALF-UP' });
                const inDate = (await Quant._updateAvailableQuantity(productId, locationDestId, -qtyDoneOrig, { lotId, packageId: resultPackageId, ownerId }))[1];
                await Quant._updateAvailableQuantity(productId, locationId, qtyDoneOrig, { lotId, packageId, ownerId, inDate });

                // move what's been actually done
                productId = await ml.productId;
                locationId = updates['locationId'] ?? locationId;
                locationDestId = updates['locationDestId'] ?? locationDestId;
                qtyDone = vals['qtyDone'] ?? qtyDone;
                lotId = updates['lotId'] ?? lotId;
                packageId = updates['packageId'] ?? packageId;
                resultPackageId = updates['resultPackageId'] ?? resultPackageId;
                ownerId = updates['ownerId'] ?? ownerId;
                productUomId = updates['productUomId'] ?? productUomId;
                const quantity = await productUomId._computeQuantity(qtyDone, await (await moveId.productId).uomId, { roundingMethod: 'HALF-UP' });
                if (! await moveId._shouldBypassReservation(locationId)) {
                    await ml._freeReservation(productId, locationId, quantity, { lotId, packageId, ownerId });
                }
                if (!floatIsZero(quantity, { precisionDigits: precision })) {
                    const [availableQty, inDate] = await Quant._updateAvailableQuantity(productId, locationId, -quantity, { lotId, packageId, ownerId });
                    if (availableQty < 0 && bool(lotId)) {
                        // see if we can compensate the negative quants with some untracked quants
                        const untrackedQty = await Quant._getAvailableQuantity(productId, locationId, { lotId: false, packageId, ownerId, strict: true });
                        if (untrackedQty) {
                            const takenFromUntrackedQty = Math.min(untrackedQty, Math.abs(availableQty));
                            await Quant._updateAvailableQuantity(productId, locationId, -takenFromUntrackedQty, { lotId: false, packageId, ownerId });
                            await Quant._updateAvailableQuantity(productId, locationId, takenFromUntrackedQty, { lotId, packageId, ownerId });
                            if (! await moveId._shouldBypassReservation(locationId)) {
                                await ml._freeReservation(await ml.productId, locationId, untrackedQty, { lotId: false, packageId, ownerId });
                            }
                        }
                    }
                    await Quant._updateAvailableQuantity(productId, locationDestId, quantity, { lotId, packageId: resultPackageId, ownerId, inDate });
                }

                // Unreserve and reserve following move in order to have the real reserved quantity on moveLine.
                nextMoves = nextMoves.or(await (await (await ml.moveId).moveDestIds).filtered(async (move) => !['done', 'cancel'].includes(await move.state)));

                // Log a note
                if (bool(await ml.pickingId)) {
                    await ml._logMessage(await ml.pickingId, ml, 'stock.trackMoveTemplate', vals);
                }
            }
        }
        const res = await _super(StockMoveLine, this).write(vals);

        // Update scrap object linked to move_lines to the new quantity.
        if ('qtyDone' in vals) {
            for (const move of await this.mapped('moveId')) {
                if (await move.scrapped) {
                    await (await move.scrapIds).write({ 'scrapQty': await move.quantityDone });
                }
            }
        }
        // As stock_account values according to a move's `productUomQty`, we consider that any
        // done stock move should have its `quantityDone` equals to its `productUomQty`, and
        // this is what move's `action_done` will do. So, we replicate the behavior here.
        if (bool(updates) || 'qtyDone' in vals) {
            let moves = await (await this.filtered(async (ml) => await (await ml.moveId).state === 'done')).mapped('moveId');
            moves = moves.or(await (await this.filtered(async (ml) => !['done', 'cancel'].includes(await (await ml.moveId).state) && await (await (await ml.moveId).pickingId).immediateTransfer && ! await ml.productUomQty)).mapped('moveId'));
            for (const move of moves) {
                await move.set('productUomQty', await move.quantityDone);
            }
            await nextMoves._doUnreserve();
            await nextMoves._actionAssign();
        }
        if (bool(movesToRecomputeState)) {
            await movesToRecomputeState._recomputeState();
        }

        return res;
    }

    @api.ondelete(false)
    async _unlinkExceptDoneOrCancel() {
        for (const ml of this) {
            if (['done', 'cancel'].includes(await ml.state)) {
                throw new UserError(await this._t('You can not delete product moves if the picking is done. You can only correct the done quantities.'));
            }
        }
    }

    async unlink() {
        const precision = await this.env.items('decimal.precision').precisionGet('Product Unit of Measure');
        for (const ml of this) {
            const [productId, productQty, moveId, locationId, lotId, packageId, ownerId] = await ml('productId', 'productQty', 'moveId', 'locationId', 'lotId', 'packageId', 'ownerId');
            // Unlinking a move line should unreserve.
            if (await productId.type === 'product' && ! await moveId._shouldBypassReservation(locationId) && !floatIsZero(productQty, { precisionDigits: precision })) {
                await this.env.items('stock.quant')._updateReservedQuantity(productId, locationId, -productQty, { lotId, packageId, ownerId, strict: true });
            }
        }
        const moves = await this.mapped('moveId');
        const res = await _super(StockMoveLine, this).unlink();
        if (bool(moves)) {
            // Add with_prefetch() to set the _prefecht_ids = _ids
            // because _prefecht_ids generator look lazily on the cache of moveId
            // which is clear by the unlink of move line
            await (await moves.withPrefetch())._recomputeState();
        }
        return res;
    }

    /**
     * This method is called during a move's `action_done`. It'll actually move a quant from the source location to the destination location, and unreserve if needed in the source location.

        This method is intended to be called on all the move lines of a move. This method is not intended to be called when editing a `done` move (that's what the override of `write` here is done.
     */
    async _actionDone() {
        const Quant = this.env.items('stock.quant');

        // First, we loop over all the move lines to do a preliminary check: `qtyDone` should not be negative and, according to the presence of a picking type or a linked inventory adjustment, enforce some rules on the `lotId` field. If `qtyDone` is null, we unlink the line. It is mandatory in order to free the reservation and correctly apply `actionDone` on the next move lines.
        const mlIdsTrackedWithoutLot = new OrderedSet2();
        const mlIdsToDelete = new OrderedSet2();
        const mlIdsToCreateLot = new OrderedSet();
        for (const ml of this) {
            // Check here if `ml.qtyDone` respects the rounding of `ml.productUomId`.
            const uomQty = floatRound(await ml.qtyDone, { precisionRounding: await (await ml.productUomId).rounding, roundingMethod: 'HALF-UP' });
            const precisionDigits = await this.env.items('decimal.precision').precisionGet('Product Unit of Measure');
            const qtyDone = floatRound(await ml.qtyDone, { precisionDigits, roundingMethod: 'HALF-UP' });
            if (floatCompare(uomQty, qtyDone, { precisionDigits }) != 0) {
                throw new UserError(await this._t(`The quantity done for the product "%s" doesn't respect the rounding precision defined on the unit of measure "%s". Please change the quantity done or the rounding precision of your unit of measure.`, await (await ml.productId).displayName, await (await ml.productUomId).label));
            }
            const qtyDoneFloatCompared = floatCompare(await ml.qtyDone, 0, { precisionRounding: await (await ml.productUomId).rounding });
            if (qtyDoneFloatCompared > 0) {
                if (await (await ml.productId).tracking !== 'none') {
                    const pickingTypeId = await (await ml.moveId).pickingTypeId;
                    if (bool(pickingTypeId)) {
                        if (await pickingTypeId.useCreateLots) {
                            // If a picking type is linked, we may have to create a production lot on the fly before assigning it to the move line if the user checked both `useCreateLots` and `useExistingLots`.
                            if (await ml.lotName && !bool(await ml.lotId)) {
                                const lot = await this.env.items('stock.production.lot').search([
                                    ['companyId', '=', (await ml.companyId).id],
                                    ['productId', '=', (await ml.productId).id],
                                    ['label', '=', await ml.lotName],
                                ], { limit: 1 });
                                if (bool(lot)) {
                                    await ml.set('lotId', lot.id);
                                }
                                else {
                                    mlIdsToCreateLot.add(ml.id);
                                }
                            }
                        }
                        else if (! await pickingTypeId.useCreateLots && ! await pickingTypeId.useExistingLots) {
                            // If the user disabled both `useCreateLots` and `useExistingLots` checkboxes on the picking type, he's allowed to enter tracked
                            // products without a `lotId`.
                            continue;
                        }
                    }
                    else if (await ml.isInventory) {
                        // If an inventory adjustment is linked, the user is allowed to enter tracked products without a `lotId`.
                        continue;
                    }

                    if (!bool(await ml.lotId) && !mlIdsToCreateLot.has(ml.id)) {
                        mlIdsTrackedWithoutLot.add(ml.id);
                    }
                }
            }
            else if (qtyDoneFloatCompared < 0) {
                throw new UserError(await this._t('No negative quantities allowed'));
            }
            else if (! await ml.isInventory) {
                mlIdsToDelete.add(ml.id);
            }
        }

        if (bool(mlIdsTrackedWithoutLot)) {
            const mlsTrackedWithoutLot = this.env.items('stock.move.line').browse(mlIdsTrackedWithoutLot);
            throw new UserError(await this._t('You need to supply a Lot/Serial Number for product: \n - ') +
                (await mlsTrackedWithoutLot.mapped('productId.displayName')).join('\n - '));
        }
        const mlToCreateLot = this.env.items('stock.move.line').browse(mlIdsToCreateLot);
        await mlToCreateLot._createAndAssignProductionLot();

        const mlsToDelete = this.env.items('stock.move.line').browse(mlIdsToDelete);
        await mlsToDelete.unlink();

        const mlsTodo = this.sub(mlsToDelete);
        await mlsTodo._checkCompany()

        // Now, we can actually move the quant.
        const mlIdsToIgnore = new OrderedSet2();
        for (const ml of mlsTodo) {
            if (await (await ml.productId).type === 'product') {
                const rounding = await (await ml.productUomId).rounding;

                const [productId, productQty, moveId, locationId, lotId, packageId, ownerId, qtyDone, productUomQty, productUomId, locationDestId] = await ml('productId', 'productQty', 'moveId', 'locationId', 'lotId', 'packageId', 'ownerId', 'qtyDone', 'productUomQty', 'productUomId', 'locationDestId');

                // if this move line is force assigned, unreserve elsewhere if needed
                if (! await moveId._shouldBypassReservation(locationId) && floatCompare(qtyDone, productUomQty, { precisionRounding: rounding }) > 0) {
                    const qtyDoneProductUom = await productUomId._computeQuantity(qtyDone, await productId.uomId, { roundingMethod: 'HALF-UP' });
                    const extraQty = qtyDoneProductUom - productQty;
                    await ml._freeReservation(productId, locationId, extraQty, { lotId, packageId, ownerId, mlIdsToIgnore });
                }
                // unreserve what's been reserved
                if (! await moveId._shouldBypassReservation(locationId) && await productId.type === 'product' && productQty) {
                    await Quant._updateReservedQuantity(productId, locationId, -productQty, { lotId, packageId, ownerId, strict: true });
                }
                // move what's been actually done
                const quantity = await productUomId._computeQuantity(qtyDone, await (await moveId.productId).uomId, { roundingMethod: 'HALF-UP' });
                const [availableQty, inDate] = await Quant._updateAvailableQuantity(productId, locationId, -quantity, { lotId, packageId, ownerId });
                if (availableQty < 0 && bool(lotId)) {
                    // see if we can compensate the negative quants with some untracked quants
                    const untrackedQty = await Quant._getAvailableQuantity(productId, locationId, { lotId: false, packageId, ownerId, strict: true });
                    if (untrackedQty) {
                        const takenFromUntrackedQty = Math.min(untrackedQty, Math.abs(quantity));
                        await Quant._updateAvailableQuantity(productId, locationId, -takenFromUntrackedQty, { lotId: false, packageId, ownerId });
                        await Quant._updateAvailableQuantity(productId, locationId, takenFromUntrackedQty, { lotId, packageId, ownerId });
                    }
                }
                await Quant._updateAvailableQuantity(productId, locationDestId, quantity, { lotId, packageId: await ml.resultPackageId, ownerId, inDate });
            }
            mlIdsToIgnore.add(ml.id);
        }
        // Reset the reserved quantity as we just moved it to the destination location.
        await (await mlsTodo.withContext({ bypassReservationUpdate: true })).write({
            'productUomQty': 0.00,
            'date': _Datetime.now(),
        });
    }

    async _getSimilarMoveLines() {
        this.ensureOne();
        let lines = this.env.items('stock.move.line');
        const moveId = await this['moveId'];
        const pickingId = moveId.ok ? await moveId.pickingId : await this['pickingId'];
        if (pickingId.ok) {
            lines = lines.or(await (await pickingId.moveLineIds).filtered(async (ml) => (await ml.productId).eq(await this['productId']) && (bool(await ml.lotId) || await ml.lotName)));
        }
        return lines;
    }

    async _getValueProductionLot() {
        this.ensureOne();
        return {
            'companyId': (await this['companyId']).id,
            'label': await this['lotName'],
            'productId': (await this['productId']).id
        }
    }

    /**
     * Creates and assign new production lots for move lines.
     */
    async _createAndAssignProductionLot() {
        const lotVals = [];
        // It is possible to have multiple time the same lot to create & assign,
        // so we handle the case with 2 dictionaries.
        const keyToIndex = {};  // key to index of the lot
        const keyToMls = new DefaultDict(() => this.env.items('stock.move.line'));  // key to all mls
        for (const ml of this) {
            const key = String([(await ml.companyId).id, (await ml.productId).id, await ml.lotName]);
            keyToMls[key] = keyToMls[key].or(ml);
            if (await ml.tracking !== 'lot' || !(key in keyToIndex)) {
                keyToIndex[key] = len(lotVals);
                lotVals.push(await ml._getValueProductionLot());
            }
        }

        const lots = await this.env.items('stock.production.lot').create(lotVals);
        for (const [key, mls] of keyToMls.items()) {
            await mls._assignProductionLot(await lots[keyToIndex[key]].withPrefetch(lots._ids));  // With prefetch to reconstruct the ones broke by accessing by index
        }
    }

    async _assignProductionLot(lot) {
        await this.write({ 'lotId': lot.id });
    }

    async _reservationIsUpdatable(quantity, reservedQuant) {
        this.ensureOne();
        if (await (await this['productId']).tracking !== 'serial' &&
            (await this['locationId']).id == (await reservedQuant.locationId).id &&
            this['lotId'].id === (await reservedQuant.lotId).id &&
            (await this['packageId']).id === (await reservedQuant.packageId).id &&
            (await this['ownerId']).id === (await reservedQuant.ownerId).id) {
            return true;
        }
        return false;
    }

    async _logMessage(record, move, template, vals) {
        const data = Object.assign({}, vals);
        if ('lotId' in vals && vals['lotId'] !== (await move.lotId).id) {
            data['lotName'] = await this.env.items('stock.production.lot').browse(vals['lotId']).label;
        }
        if ('locationId' in vals) {
            data['locationName'] = await this.env.items('stock.location').browse(vals['locationId']).label;
        }
        if ('locationDestId' in vals) {
            data['locationDestName'] = await this.env.items('stock.location').browse(vals['locationDestId']).label;
        }
        if ('packageId' in vals && vals['packageId'] !== (await move.packageId).id) {
            data['packageName'] = await this.env.items('stock.quant.package').browse(vals['packageId']).label;
        }
        if ('packageResultId' in vals && vals['packageResultId'] !== (await move.packageResultId).id) {
            data['resultPackageName'] = await this.env.items('stock.quant.package').browse(vals['resultPackageId']).label;
        }
        if ('ownerId' in vals && vals['ownerId'] !== (await move.ownerId).id) {
            data['ownerName'] = await this.env.items('res.partner').browse(vals['ownerId']).label;
        }
        await record.messagePostWithView(template, { values: { 'move': move, 'vals': setOptions(vals, data) }, subtypeId: (await this.env.ref('mail.mtNote')).id });
    }

    /**
     * When editing a done move line or validating one with some forced quantities, it is possible to impact quants that were not reserved. It is therefore necessary to edit or unlink the move lines that reserved a quantity now unavailable.
        :param mlIdsToIgnore: OrderedSet of `stock.move.line` ids that should NOT be unreserved
     * @param productId 
     * @param locationId 
     * @param quantity 
     * @param options 
     */
    async _freeReservation(productId, locationId, quantity, options: { lotId?: any, packageId?: any, ownerId?: any, mlIdsToIgnore?: any } = {}) {
        this.ensureOne();

        let { lotId, packageId, ownerId, mlIdsToIgnore } = options;
        if (mlIdsToIgnore == null) {
            mlIdsToIgnore = new OrderedSet2();
        }
        mlIdsToIgnore = _.union(mlIdsToIgnore, this.ids);

        // Check the available quantity, with the `strict` kw set to `true`. If the available
        // quantity is greather than the quantity now unavailable, there is nothing to do.
        const availableQuantity = await this.env.items('stock.quant')._getAvailableQuantity(
            productId, locationId, { lotId, packageId, ownerId, strict: true }
        );
        if (quantity > availableQuantity) {
            quantity = quantity - availableQuantity;
            // We now have to find the move lines that reserved our now unavailable quantity. We take care to exclude ourselves and the move lines were work had already been done.
            const outdatedMoveLinesDomain = [
                ['state', 'not in', ['done', 'cancel']],
                ['productId', '=', productId.id],
                ['lotId', '=', bool(lotId) ? lotId.id : false],
                ['locationId', '=', locationId.id],
                ['ownerId', '=', bool(ownerId) ? ownerId.id : false],
                ['packageId', '=', bool(packageId) ? packageId.id : false],
                ['productQty', '>', 0.0],
                ['id', 'not in', mlIdsToIgnore],
            ]

            // We take the current picking first, then the pickings with the latest scheduled date
            const currentPickingFirst = async (cand) => {
                const [pickingId, moveId] = await cand('pickingId', 'moveId');
                return [
                    !pickingId.eq(await (await this['moveId']).pickingId), bool(pickingId) || bool(moveId) ? -(await pickingId.scheduledDate || await moveId.date).getMilliseconds()
                        : -cand.id,
                ];
            }
            const outdatedCandidates = await (await this.env.items('stock.move.line').search(outdatedMoveLinesDomain)).sorted(currentPickingFirst);

            // As the move's state is not computed over the move lines, we'll have to manually recompute the moves which we adapted their lines.
            let moveToRecomputeState = this.env.items('stock.move');
            const toUnlinkCandidateIds = new Set<any>();

            const rounding = await (await this['productUomId']).rounding;
            for (const candidate of outdatedCandidates) {
                if (floatCompare(await candidate.productQty, quantity, { precisionRounding: rounding }) <= 0) {
                    quantity -= await candidate.productQty;
                    if (await candidate.qtyDone) {
                        moveToRecomputeState = moveToRecomputeState.or(await candidate.moveId);
                        await candidate.set('productUomQty', 0.0);
                    }
                    else {
                        toUnlinkCandidateIds.add(candidate.id);
                    }
                    if (floatIsZero(quantity, { precisionRounding: rounding })) {
                        break;
                    }
                }
                else {
                    // split this move line and assign the new part to our extra move
                    const quantitySplit = floatRound(
                        await candidate.productQty - quantity,
                        {
                            precisionRounding: await (await this['productUomId']).rounding,
                            roundingMethod: 'UP'
                        });
                    await candidate.set('productUomQty', await (await (await this['productId']).uomId)._computeQuantity(quantitySplit, await candidate.productUomId, { roundingMethod: 'HALF-UP' }));
                    moveToRecomputeState = moveToRecomputeState.or(await candidate.moveId);
                    break;
                }
            }
            await this.env.items('stock.move.line').browse(toUnlinkCandidateIds).unlink();
            await moveToRecomputeState._recomputeState();
        }
    }

    /**
     * Returns a dictionary of products (key = id+label+description+uom) and corresponding values of interest.

        Allows aggregation of data across separate move lines for the same product. This is expected to be useful
        in things such as delivery reports. Dict key is made as a combination of values we expect to want to group
        the products by (i.e. so data is not lost). This function purposely ignores lots/SNs because these are
        expected to already be properly grouped by line.

        returns: dictionary {productId+label+description+uom: {product, label, description, qtyDone, productUom}, ...}
     * @param kwargs 
     * @returns 
     */
    async _getAggregatedProductQuantities(kwargs: {} = {}) {
        const aggregatedMoveLines = {}

        async function getAggregatedProperties(moveLine?: any, move?: any) {
            move = bool(move) ? move : await moveLine.moveId;
            const productId = await move.productId;
            const uom = bool(moveLine) ? await moveLine.productUomId : await move.productUom;
            const label = await productId.displayName;
            let description = await move.descriptionPicking;
            if (description === label || description === await productId.label) {
                description = false;
            }
            const lineKey = `${productId.id}_${label}_${description || ""}_${uom.id}`;
            return [lineKey, label, description, uom];
        }

        // Loops to get backorders, backorders' backorders, and so and so...
        let backorders = this.env.items('stock.picking');
        let pickings = await this['pickingId'];
        let backorderIds = await pickings.backorderIds;
        while (bool(backorderIds)) {
            backorders = backorders.or(backorderIds);
            pickings = await pickings.backorderIds;
            backorderIds = await pickings.backorderIds;
        }

        for (const moveLine of this) {
            if (kwargs['exceptPackage'] && bool(await moveLine.resultPackageId)) {
                continue;
            }
            const [lineKey, label, description, uom] = await getAggregatedProperties(moveLine);

            let qtyDone = await (await moveLine.productUomId)._computeQuantity(await moveLine.qtyDone, uom);
            if (!(lineKey in aggregatedMoveLines)) {
                let qtyOrdered;
                if (bool(backorders) && !kwargs['strict']) {
                    // Filters on the aggregation key (product, description and uom) to add the
                    // quantities delayed to backorders to retrieve the original ordered qty.
                    const followingMoveLines = await (await backorders.moveLineIds).filtered(
                        async (ml) => (await getAggregatedProperties(null, await ml.moveId))[0] === lineKey
                    )
                    qtyOrdered += sum(await (await followingMoveLines.moveId).mapped('productUomQty'));
                    const previousMoveLines = await (await (await moveLine.moveId).moveLineIds).filtered(
                        async (ml) => (await getAggregatedProperties(null, await ml.moveId))[0] == lineKey && ml.id != moveLine.id
                    )
                    qtyOrdered -= sum(await previousMoveLines.map(async (m) => await (await m.productUomId)._computeQuantity(await m.qtyDone, uom)));
                }
                aggregatedMoveLines[lineKey] = {
                    'label': label,
                    'description': description,
                    'qtyDone': await moveLine.qtyDone,
                    'qtyOrdered': qtyOrdered || qtyDone,
                    'productUom': await uom.label,
                    'productUomRec': uom,
                    'product': await moveLine.productId
                }
            }
            else {
                aggregatedMoveLines[lineKey]['qtyOrdered'] += qtyDone;
                aggregatedMoveLines[lineKey]['qtyDone'] += await moveLine.qtyDone;
            }
        }
        // Does the same for empty move line to retrieve the ordered qty. for partially done moves
        // (as they are splitted when the transfer is done and empty moves don't have move lines).
        if (kwargs['strict']) {
            return aggregatedMoveLines;
        }
        pickings = (await this['pickingId']).or(backorders);
        for (const emptyMove of await (await pickings.moveLines).filtered(
            async (m) => await m.state === "cancel" && await m.productUomQty
                && floatIsZero(await m.quantityDone, { precisionRounding: await (await m.productUom).rounding })
        )) {
            const [lineKey, label, description, uom] = await getAggregatedProperties(null, emptyMove);

            if (!(lineKey in aggregatedMoveLines)) {
                const [qtyOrdered, productId] = await emptyMove('productUomQty', 'productId');
                aggregatedMoveLines[lineKey] = {
                    'label': label,
                    'description': description,
                    'qtyDone': false,
                    'qtyOrdered': qtyOrdered,
                    'productUom': uom.label,
                    'product': productId,
                }
            }
            else {
                aggregatedMoveLines[lineKey]['qtyOrdered'] += await emptyMove.productUomQty;
            }
        }
        return aggregatedMoveLines;
    }

    async _computeSalePrice() {
        // To Override
        // pass
    }

    @api.model()
    async _prepareStockMoveVals() {
        this.ensureOne();
        const [productId, pickingId, productUomId] = await this('productId', 'pickingId', 'productUomId');
        return {
            'label': await this._t('New Move:') + await productId.displayName,
            'productId': productId.id,
            'productUomQty': bool(pickingId) && await pickingId.state !== 'done' ? 0 : await this['qtyDone'],
            'productUom': productUomId.id,
            'descriptionPicking': await this['descriptionPicking'],
            'locationId': (await pickingId.locationId).id,
            'locationDestId': (await pickingId.locationDestId).id,
            'pickingId': pickingId.id,
            'state': await pickingId.state,
            'pickingTypeId': (await pickingId.pickingTypeId).id,
            'restrictPartnerId': (await pickingId.ownerId).id,
            'companyId': (await pickingId.companyId).id,
        }
    }
}