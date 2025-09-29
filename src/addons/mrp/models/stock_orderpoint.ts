import { api, Fields } from "../../../core";
import { MapKey } from "../../../core/helper";
import { _super, MetaModel, Model } from "../../../core/models"
import { AND } from "../../../core/osv/expression";
import { bool, floatIsZero } from "../../../core/tools";

@MetaModel.define()
class StockWarehouseOrderpoint extends Model {
    static _module = module;
    static _parents = 'stock.warehouse.orderpoint';

    static showBom = Fields.Boolean('Show BoM column', {compute: '_computeShowBom'});
    static bomId = Fields.Many2one('mrp.bom', {string: 'Bill of Materials', checkCompany: true,
        domain: "[['type', '=', 'normal'], '&', '|', ['companyId', '=', companyId], ['companyId', '=', false], '|', ['productId', '=', productId], '&', ['productId', '=', false], ['productTemplateId', '=', productTemplateId]]"});

    async _getReplenishmentOrderNotification() {
        this.ensureOne();
        let domain = [['orderpointId', 'in', this.ids]];
        if (this.env.context['writtenAfter']) {
            domain = AND([domain, [['updatedAt', '>', this.env.context['writtenAfter']]]]);
        }
        const production = await this.env.items('mrp.production').search(domain, {limit: 1});
        if (bool(production)) {
            const action = await this.env.ref('mrp.actionMrpProductionForm');
            return {
                'type': 'ir.actions.client',
                'tag': 'displayNotification',
                'params': {
                    'title': await this._t('The following replenishment order has been generated'),
                    'message': '%s',
                    'links': [{
                        'label': await production.label,
                        'url': `#action=${action.id}&id=${production.id}&model=mrp.production`
                    }],
                    'sticky': false,
                }
            }
        }
        return _super(StockWarehouseOrderpoint, this)._getReplenishmentOrderNotification();
    }

    @api.depends('routeId')
    async _computeShowBom() {
        const manufactureRoute = [];
        for (const res of await this.env.items('stock.rule').searchRead([['action', '=', 'manufacture']], ['routeId'])) {
            manufactureRoute.push(res['routeId'][0]);
        }
        for (const orderpoint of this) {
            await orderpoint.set('showBom', manufactureRoute.includes((await orderpoint.routeId).id));
        }
    }

    async _quantityInProgress() {
        const bomKits = await this.env.items('mrp.bom')._bomFind(await this['productId'], {bomType: 'phantom'});
        const bomKitOrderpoints = new MapKey();
        for (const orderpoint of this) {
            if (bomKits.has(await orderpoint.productId)) {
                bomKitOrderpoints.set(orderpoint, bomKits.get(await orderpoint.productId));
            }
        }
        const orderpointsWithoutKit = this.sub(this.env.items('stock.warehouse.orderpoint').concat([...bomKitOrderpoints.keys()]));
        const result = await _super(StockWarehouseOrderpoint, orderpointsWithoutKit)._quantityInProgress();
        for (const orderpoint of bomKitOrderpoints) {
            const [dummy, bomSubLines] = await bomKitOrderpoints.get(orderpoint).explode(await orderpoint.productId, 1);
            const ratiosQtyAvailable = [];
            // total = qtyAvailable + inProgress
            const ratiosTotal = [];
            for (const [bomLine, bomLineData] of bomSubLines) {
                const component = await bomLine.productId;
                if (await component.type != 'product' || floatIsZero(bomLineData['qty'], {precisionRounding: await (await bomLine.productUomId).rounding})) {
                    continue;
                }
                const uomQtyPerKit = bomLineData['qty'] / bomLineData['originalQty'];
                const qtyPerKit = await (await bomLine.productUomId)._computeQuantity(uomQtyPerKit, await (await bomLine.productId).uomId, {raiseIfFailure: false});
                if (! qtyPerKit) {
                    continue;
                }
                const [qtyByProductLocation, dummy] = await component._getQuantityInProgress((await orderpoint.locationId).ids);
                const qtyInProgress = qtyByProductLocation.get(`${component.id}@${(await orderpoint.locationId).id}`, 0.0);
                const qtyAvailable = await component.qtyAvailable / qtyPerKit;
                ratiosQtyAvailable.push(qtyAvailable);
                ratiosTotal.push(qtyAvailable + (qtyInProgress / qtyPerKit));
            }
            // For a kit, the quantity in progress is :
            //  (the quantity if we have received all in-progress components) - (the quantity using only available components)
            const productQty = Math.min(...(ratiosTotal.length ? ratiosTotal : [0])) - Math.min(...(ratiosQtyAvailable.length ? ratiosQtyAvailable : [0]));
            result[orderpoint.id] = await (await (await orderpoint.productId).uomId)._computeQuantity(productQty, await orderpoint.productUom, {round: false});
        }

        let bomManufacture = await this.env.items('mrp.bom')._bomFind(await orderpointsWithoutKit.productId, {bomType: 'normal'});
        bomManufacture = this.env.items('mrp.bom').concat([...bomManufacture.values()]);
        const productionsGroup = await this.env.items('mrp.production').readGroup(
            [['bomId', 'in', bomManufacture.ids], ['state', '=', 'draft'], ['orderpointId', 'in', orderpointsWithoutKit.ids]],
            ['orderpointId', 'productQty', 'productUomId'],
            ['orderpointId', 'productUomId'], {lazy: false});
        for (const p of productionsGroup) {
            const uom = this.env.items('uom.uom').browse(p['productUomId'][0]);
            const orderpoint = this.env.items('stock.warehouse.orderpoint').browse(p['orderpointId'][0]);
            result[orderpoint.id] += await uom._computeQuantity(p['productQty'], await orderpoint.productUom, {round: false});
        }
        return result;
    }

    /**
     * Calculates the minimum quantity that can be ordered according to the qty and UoM of the BoM
     * @returns 
     */
    async _getQtyMultipleToOrder() {
        this.ensureOne();
        const qtyMultipleToOrder = await _super(StockWarehouseOrderpoint, this)._getQtyMultipleToOrder();
        if ((await (await this['ruleIds']).mapped('action')).includes('manufacture')) {
            const bom = (await this.env.items('mrp.bom')._bomFind(await this['productId'], {bomType: 'normal'})).get(await this['productId']);
            return (await bom.productUomId)._computeQuantity(await bom.productQty, await this['productUom']);
        }
        return qtyMultipleToOrder;
    }

    async _setDefaultRouteId() {
        const routeId = await (await this.env.items('stock.rule').search([
            ['action', '=', 'manufacture']
        ])).routeId;
        const orderpointWhBom = await this.filtered(async (o) => (await o.productId).bomIds);
        if (bool(routeId) && bool(orderpointWhBom)) {
            await orderpointWhBom.set('routeId', routeId[0].id);
        }
        return _super(StockWarehouseOrderpoint, this)._setDefaultRouteId();
    }

    async _prepareProcurementValues(date=false, group=false) {
        const values = await _super(StockWarehouseOrderpoint, this)._prepareProcurementValues(date, group);
        values['bomId'] = await this['bomId'];
        return values;
    }

    /**
     * Confirm the productions only after all the orderpoints have run their
        procurement to avoid the new procurement created from the production conflict
        with them.
     * @returns 
     */
    async _postProcessScheduler() {
        await (await (await this.env.items('mrp.production').sudo()).search([
            ['orderpointId', 'in', this.ids],
            ['moveRawIds', '!=', false],
            ['state', '=', 'draft'],
        ])).actionConfirm();
        return _super(StockWarehouseOrderpoint, this)._postProcessScheduler();
    }

    async _productExcludeList() {
        // don't create an order point for kit products
        const boms = await this.env.items('mrp.bom').search([['type', '=', 'phantom']]);
        const variantBoms = await boms.filtered(x => x.productId);
        return (await _super(StockWarehouseOrderpoint, this)._productExcludeList()).concat((await variantBoms.productId).ids).concat((await (await boms.sub(variantBoms).productTemplateId).productVariantIds).ids);
    }
}
