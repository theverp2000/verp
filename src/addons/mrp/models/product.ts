import { _Datetime, Fields } from "../../../core";
import { DefaultDict, MapKey } from "../../../core/helper";
import { _super, MetaModel, Model } from "../../../core/models"
import { bool, floatIsZero, floatRound, len, pop, subDate, sum, update } from "../../../core/tools";

const OPERATORS = {
    '<': (a,b) => a < b,
    '>': (a,b) => a > b,
    '<=': (a,b) => a <= b,
    '>=': (a,b) => a >= b,
    '=': (a,b) => a == b,
    '!=': (a,b) => a != b
}

@MetaModel.define()
class ProductTemplate extends Model {
    static _module = module;
    static _parents = "product.template";

    static bomLineIds = Fields.One2many('mrp.bom.line', 'productTemplateId', {string: 'BoM Components'});
    static bomIds = Fields.One2many('mrp.bom', 'productTemplateId', {string: 'Bill of Materials'});
    static bomCount = Fields.Integer('# Bill of Material', {compute: '_computeBomCount', computeSudo: false});
    static usedInBomCount = Fields.Integer('# of BoM Where is Used', {compute: '_computeUsedInBomCount', computeSudo: false});
    static mrpProductQty = Fields.Float('Manufactured', {compute: '_computeMrpProductQty', computeSudo: false});
    static produceDelay = Fields.Float('Manufacturing Lead Time', {default: 0.0, help: "Average lead time in days to manufacture this product. In the case of multi-level BOM, the manufacturing lead times of the components will be added."});
    static isKits = Fields.Boolean({compute: '_computeIsKits', computeSudo: false});

    async _computeBomCount() {
        for (const product of this) {
            await product.set('bomCount', await this.env.items('mrp.bom').searchCount(['|', ['productTemplateId', '=', product.id], ['byproductIds.productId.productTemplateId', '=', product.id]]));
        }
    }

    async _computeIsKits() {
        const domain = [['productTemplateId', 'in', this.ids], ['type', '=', 'phantom']];
        const bomMapping = await this.env.items('mrp.bom').searchRead(domain, ['productTemplateId']);
        const kitsIds = bomMapping.map(b => b['productTemplateId'][0]);
        for (const template of this) {
            await template.set('isKits', kitsIds.includes(template.id));
        }
    }

    async _computeShowQtyStatusButton() {
        await _super(ProductTemplate, this)._computeShowQtyStatusButton();
        for (const template of this) {
            if (await template.isKits) {
                await template.set('showOnHandQtyStatusButton', await template.productVariantCount <= 1);
                await template.set('showForecastedQtyStatusButton', false);
            }
        }
    }

    async _computeUsedInBomCount() {
        for (const template of this) {
            await template.set('usedInBomCount', await this.env.items('mrp.bom').searchCount(
                [['bomLineIds.productTemplateId', '=', template.id]]));
        }
    }

    async write(values) {
        if ('active' in values) {
            await (await (await (await this.filtered(async (p) => await p.active != values['active'])).withContext({activeTest: false})).bomIds).write({
                'active': values['active']
            });
        }
        return _super(ProductTemplate, this).write(values);
    }

    async actionUsedInBom() {
        this.ensureOne();
        const action = await this.env.items("ir.actions.actions")._forXmlid("mrp.mrpBomFormAction");
        action['domain'] = [['bomLineIds.productTemplateId', '=', this.id]];
        return action;
    }

    async _computeMrpProductQty() {
        for (const template of this) {
            await template.set('mrpProductQty', floatRound(sum(await (await template.mapped('productVariantIds')).mapped('mrpProductQty')), {precisionRounding: await (await template.uom_idC).rounding}));
        }
    }

    async actionViewMos() {
        const action = await this.env.items("ir.actions.actions")._forXmlid("mrp.mrpProductionReport");
        action['domain'] = [['state', '=', 'done'], ['productTemplateId', 'in', this.ids]];
        action['context'] = {
            'graphMeasure': 'productUomQty',
            'searchDefault_filterPlanDate': 1,
        }
        return action;
    }

    async actionArchive() {
        const filteredProducts = await (await (await this.env.items('mrp.bom.line').search([['productId', 'in', (await this['productVariantIds']).ids]])).productId).mapped('displayName');
        const result = await _super(ProductTemplate, this).actionArchive();
        if (bool(filteredProducts)) {
            return {
                'type': 'ir.actions.client',
                'tag': 'displayNotification',
                'params': {
                    'title': await this._t("Note that product(s): '%s' is/are still linked to active Bill of Materials, \
                                which means that the product can still be used on it/them.", filteredProducts),
                    'type': 'warning',
                    'sticky': true,  // true/false will display for few seconds if false
                    'next': {'type': 'ir.actions.actwindow.close'},
                },
            }
        }
        return result;
    }
}

@MetaModel.define()
class ProductProduct extends Model {
    static _module = module;
    static _parents = "product.product";

    static variantBomIds = Fields.One2many('mrp.bom', 'productId', {string: 'BOM Product Variants'});
    static bomLineIds = Fields.One2many('mrp.bom.line', 'productId', {string: 'BoM Components'});
    static bomCount = Fields.Integer('# Bill of Material', {compute: '_computeBomCount', computeSudo: false});
    static usedInBomCount = Fields.Integer('# BoM Where Used', {compute: '_computeUsedInBomCount', computeSudo: false});
    static mrpProductQty = Fields.Float('Manufactured',{compute: '_computeMrpProductQty', computeSudo: false});
    static isKits = Fields.Boolean({compute: "_computeIsKits", computeSudo: false});

    async _computeBomCount() {
        for (const product of this) {
            await product.set('bomCount', await this.env.items('mrp.bom').searchCount(['|', '|', ['byproductIds.productId', '=', product.id], ['productId', '=', product.id], '&', ['productId', '=', false], ['productTemplateId', '=', (await product.productTemplateId).id]]));
        }
    }

    async _computeIsKits() {
        const domain = ['&', ['type', '=', 'phantom'],
                       '|', ['productId', 'in', this.ids],
                            '&', ['productId', '=', false],
                                 ['productTemplateId', 'in', (await this['productTemplateId']).ids]];
        const bomMapping = await this.env.items('mrp.bom').searchRead(domain, ['productTemplateId', 'productId']);
        const kitsTemplateIds = new Set(),
        kitsProductIds = new Set();
        for (const bomData of bomMapping) {
            if (bomData['productId']) {
                kitsProductIds.add(bomData['productId'][0]);
            }
            else {
                kitsTemplateIds.add(bomData['productTemplateId'][0]);
            }
        }
        for (const product of this) {
            await product.set('isKits', kitsProductIds.has(product.id) || kitsTemplateIds.has((await product.productTemplateId).id));
        }
    }

    async _computeShowQtyStatusButton() {
        await _super(ProductProduct, this)._computeShowQtyStatusButton();
        for (const product of this) {
            if (await product.isKits) {
                await product.set('showOnHandQtyStatusButton', true);
                await product.set('showForecastedQtyStatusButton', false);
            }
        }
    }

    async _computeUsedInBomCount() {
        for (const product of this) {
            await product.set('usedInBomCount', await this.env.items('mrp.bom').searchCount([['bomLineIds.productId', '=', product.id]]));
        }
    }

    async write(values) {
        if ('active' in values) {
            await (await (await (await this.filtered(async (p) => await p.active != values['active'])).withContext({activeTest: false})).variantBomIds).write({
                'active': values['active']
            });
        }
        return _super(ProductProduct, this).write(values);
    }

    /**
     * Return the components list ids in case of kit product.
        Return the product itself otherwise
     * @returns 
     */
    async getComponents() {
        this.ensureOne();
        const bomKit = (await this.env.items('mrp.bom')._bomFind(this, {bomType: 'phantom'})).get(this);
        if (bool(bomKit)) {
            const [boms, bomSubLines] = await bomKit.explode(this, 1);
            const result = [];
            for (const [bomLine, data] of bomSubLines) {
                if (await (await bomLine.productId).type == 'product') {
                    result.push((await bomLine.productId).id);
                }
            }
            return result;
        }
        else {
            return _super(ProductProduct, this).getComponents();
        }
    }

    async actionUsedInBom() {
        this.ensureOne();
        const action = await this.env.items("ir.actions.actions")._forXmlid("mrp.mrpBomFormAction");
        action['domain'] = [['bomLineIds.productId', '=', this.id]];
        return action;
    }

    async _computeMrpProductQty() {
        const dateFrom = _Datetime.toString(subDate(_Datetime.now(), {days: 365}));
        //TODO: state = done?
        const domain = [['state', '=', 'done'], ['productId', 'in', this.ids], ['datePlannedStart', '>', dateFrom]];
        const readGroupRes = await this.env.items('mrp.production').readGroup(domain, ['productId', 'productUomQty'], ['productId']);
        const mappedData = Object.fromEntries(readGroupRes.map(data => [data['productId'][0], data['productUomQty']]));
        for (const product of this) {
            if (!bool(product.id)) {
                await product.set('mrpProductQty', 0.0);
                continue;
            }
            await product.set('mrpProductQty', floatRound(mappedData[product.id] ?? 0, {precisionRounding: await (await product.uomId).rounding}));
        }
    }

    /**
     * When the product is a kit, this override computes the fields :
         - 'virtualAvailable'
         - 'qtyAvailable'
         - 'incomingQty'
         - 'outgoingQty'
         - 'freeQty'

        This override is used to get the correct quantities of products
        with 'phantom' as BoM type.
     * @param lotId 
     * @param ownerId 
     * @param packageId 
     * @param fromDate 
     * @param toDate 
     */
    async _computeQuantitiesDict(lotId, ownerId, packageId, fromDate=false, toDate=false) {
        const bomKits = await this.env.items('mrp.bom')._bomFind(this, {bomType: 'phantom'});
        const kits = await this.filtered(p => bomKits.has(p) && bool(bomKits.get(p)));
        const regularProducts = this.sub(kits);
        const result = bool(regularProducts) ? await _super(ProductProduct, regularProducts)._computeQuantitiesDict(lotId, ownerId, packageId, fromDate, toDate) : {}
        const qties = this.env.context["mrpComputeQuantities"] ?? {};
        update(qties, result);
        // pre-compute bom lines and identify missing kit components to prefetch
        const bomSubLinesPerKit = new MapKey();
        const prefetchComponentIds = new Set();
        for (const product of bomKits) {
            const [, bomSubLines] = await bomKits.get(product).explode(product, 1);
            bomSubLinesPerKit.set(product, bomSubLines);
            for (const [bomLine, ] of bomSubLines) {
                if (!((await bomLine.productId).id in qties)) {
                    prefetchComponentIds.add((await bomLine.productId).id);
                }
            }
        }
        // compute kit quantities
        for (const product of bomKits) {
            const bomSubLines = bomSubLinesPerKit.get(product);
            // group lines by component
            const bomSubLinesGrouped = new DefaultDict(() => []);
            for (const info of bomSubLines) {
                bomSubLinesGrouped.get(await info[0].productId).push(info);
            }
            const ratiosVirtualAvailable = [],
            ratiosQtyAvailable = [],
            ratiosIncomingQty = [],
            ratiosOutgoingQty = [],
            ratiosFreeQty = [];

            for (let [component, bomSubLines] of bomSubLinesGrouped.items()) {
                component = await (await component.withContext({mrpComputeQuantities: qties})).withPrefetch(prefetchComponentIds);
                let qtyPerKit = 0;
                for (const [bomLine, bomLineData] of bomSubLines) {
                    if (await component.type != 'product' || floatIsZero(bomLineData['qty'], {precisionRounding: await (await bomLine.productUomId).rounding})) {
                        // As BoMs allow components with 0 qty, a.k.a. optionnal components, we simply skip those
                        // to avoid a division by zero. The same logic is applied to non-storable products as those
                        // products have 0 qty available.
                        continue;
                    }
                    const uomQtyPerKit = bomLineData['qty'] / bomLineData['originalQty'];
                    qtyPerKit += await (await bomLine.productUomId)._computeQuantity(uomQtyPerKit, await (await bomLine.productId).uomId, {round: false, raiseIfFailure: false});
                }
                if (!qtyPerKit) {
                    continue;
                }
                const rounding = await (await component.uomId).rounding;
                const componentRes = component.id in qties ? qties[component.id] : {
                    "virtualAvailable": floatRound(await component.virtualAvailable, {precisionRounding: rounding}),
                    "qtyAvailable": floatRound(await component.qtyAvailable, {precisionRounding: rounding}),
                    "incomingQty": floatRound(await component.incomingQty, {precisionRounding: rounding}),
                    "outgoingQty": floatRound(await component.outgoingQty, {precisionRounding: rounding}),
                    "freeQty": floatRound(await component.freeQty, {precisionRounding: rounding}),
                }
                
                ratiosVirtualAvailable.push(componentRes["virtualAvailable"] / qtyPerKit);
                ratiosQtyAvailable.push(componentRes["qtyAvailable"] / qtyPerKit);
                ratiosIncomingQty.push(componentRes["incomingQty"] / qtyPerKit);
                ratiosOutgoingQty.push(componentRes["outgoingQty"] / qtyPerKit);
                ratiosFreeQty.push(componentRes["freeQty"] / qtyPerKit);
            }
            if (bool(bomSubLines) && bool(ratiosVirtualAvailable)) { // Guard against all cnsumable bom: at least one ratio should be present.
                const productQty = await bomKits.get(product).productQty;
                result[product.id] = {
                    'virtualAvailable': Math.floor(Math.min(...ratiosVirtualAvailable) * productQty),
                    'qtyAvailable': Math.floor(Math.min(...ratiosQtyAvailable) * productQty),
                    'incomingQty': Math.floor(Math.min(...ratiosIncomingQty) * productQty),
                    'outgoingQty': Math.floor(Math.min(...ratiosOutgoingQty) * productQty),
                    'freeQty': Math.floor(Math.min(...ratiosFreeQty) * productQty),
                }
            }
            else {
                result[product.id] = {
                    'virtualAvailable': 0,
                    'qtyAvailable': 0,
                    'incomingQty': 0,
                    'outgoingQty': 0,
                    'freeQty': 0,
                }
            }
        }

        return result;
    }

    async actionViewBom() {
        const action = await this.env.items("ir.actions.actions")._forXmlid("mrp.productOpenBom");
        const templateIds = (await this.mapped('productTemplateId')).ids;
        // bom specific to this variant or global to template or that contains the product as a byproduct
        action['context'] = {
            'default_productTemplateId': templateIds[0],
            'default_productId': this.ids[0],
        }
        action['domain'] = ['|', '|', ['byproductIds.productId', 'in', this.ids], ['productId', 'in', this.ids], '&', ['productId', '=', false], ['productTemplateId', 'in', templateIds]];
        return action;
    }

    async actionViewMos() {
        const action = await (await this['productTemplateId']).actionViewMos();
        action['domain'] = [['state', '=', 'done'], ['productId', 'in', this.ids]];
        return action;
    }

    async actionOpenQuants() {
        const bomKits = await this.env.items('mrp.bom')._bomFind(this, {bomType: 'phantom'});
        let components = this.sub(this.env.items('product.product').concat(bomKits.keys()));
        for (const product of bomKits) {
            const [boms, bomSubLines] = await bomKits.get(product).explode(product, 1);
            components = components.or(this.env.items('product.product').concat(await Promise.all(bomSubLines.map(async (l) => await l[0].productId))));
        }
        const result = await _super(ProductProduct, components).actionOpenQuants();
        if (bool(bomKits)) {
            result['context']['singleProduct'] = false;
            pop(result['context'], 'default_productTemplateId', null);
        }
        return result;
    }

    /**
     * It currently checks that all variant values (`productTemplateAttributeValueIds`)
        are in the product (`this`).

        If multiple values are encoded for the same attribute line, only one of
        them has to be found on the variant.
     * @param productTemplateAttributeValueIds 
     * @returns 
     */
    async _matchAllVariantValues(productTemplateAttributeValueIds) {
        this.ensureOne();
        // The intersection of the values of the product and those of the line satisfy:
        // * the number of items equals the number of attributes (since a product cannot
        //   have multiple values for the same attribute),
        // * the attributes are a subset of the attributes of the line.
        return len((await this['productTemplateAttributeValueIds']).and(productTemplateAttributeValueIds)) == len(await productTemplateAttributeValueIds.attributeId);
    }

    async _countReturnedSnProducts(snLot) {
        const result = await this.env.items('stock.move.line').searchCount([
            ['lotId', '=', snLot.id],
            ['qtyDone', '=', 1],
            ['state', '=', 'done'],
            ['productionId', '=', false],
            ['locationId.usage', '=', 'production'],
            ['moveId.unbuildId', '!=', false],
        ]);
        return _super(ProductProduct, this)._countReturnedSnProducts(snLot) + result;
    }

    /**
     * extending the method in stock.product to take into account kits
     * @param operator 
     * @param value 
     * @param lotId 
     * @param ownerId 
     * @param packageId 
     * @returns 
     */
    async _searchQtyAvailableNew(operator, value, lotId=false, ownerId=false, packageId=false) {
        const productIds = await _super(ProductProduct, this)._searchQtyAvailableNew(operator, value, lotId, ownerId, packageId);
        const kitBoms = await this.env.items('mrp.bom').search([['type', "=", 'phantom']]);
        let kitProducts = this.env.items('product.product');
        for (const kit of kitBoms) {
            if (bool(await kit.productId)) {
                kitProducts = kitProducts.or(await kit.productId);
            }
            else {
                kitProducts = kitProducts.or(await (await kit.productTemplateId).productVariantIds);
            }
        }
        for (const product of kitProducts) {
            if (OPERATORS[operator](await product.qtyAvailable, value)) {
                productIds.push(product.id);
            }
        }
        return Array.from(new Set(productIds));
    }

    async actionArchive() {
        const filteredProducts = await (await (await this.env.items('mrp.bom.line').search([['productId', 'in', this.ids]])).productId).mapped('displayName');
        const result = await _super(ProductProduct, this).actionArchive();
        if (bool(filteredProducts)) {
            return {
                'type': 'ir.actions.client',
                'tag': 'displayNotification',
                'params': {
                    'title': await this._t("Note that product(s): '%s' is/are still linked to active Bill of Materials, \
                                which means that the product can still be used on it/them.", filteredProducts),
                    'type': 'warning',
                    'sticky': true,  //True/False will display for few seconds if false
                    'next': {'type': 'ir.actions.actwindow.close'},
                    },
            }
        }
        return result;
    }
}