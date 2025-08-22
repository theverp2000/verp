import _ from "lodash";
import { _super, api, Fields, MetaModel, Model } from "../../../core";
import { DefaultDict, DefaultMapKey, MapKey, UserError, ValidationError } from "../../../core/helper";
import { Query } from "../../../core/osv";
import { AND, NEGATIVE_TERM_OPERATORS, OR } from "../../../core/osv/expression";
import { _format2, bool, equal, extend, f, floatRound, len, sum, update } from "../../../core/tools";

/**
 * Defines bills of material for a product or a product template
 */
@MetaModel.define()
class MrpBom extends Model {
    static _module = module;
    static _name = 'mrp.bom';
    static _description = 'Bill of Material';
    static _parents = ['mail.thread'];
    static _recName = 'productTemplateId';
    static _order = "sequence, id";
    static _checkCompanyAuto = true;

    async _getDefaultProductUomId() {
        return (await this.env.items('uom.uom').search([], { limit: 1, order: 'id' })).id;
    }

    static code = Fields.Char('Reference');
    static active = Fields.Boolean(
        'Active', {
            default: true,
        help: "If the active field is set to False, it will allow you to hide the bills of material without removing it."
    });
    static type = Fields.Selection([
        ['normal', 'Manufacture this product'],
        ['phantom', 'Kit']], {
            string: 'BoM Type',
        default: 'normal', required: true
    });
    static productTemplateId = Fields.Many2one(
        'product.template', {
            string: 'Product',
        checkCompany: true, index: true,
        domain: "[['type', 'in', ['product', 'consu']], '|', ['companyId', '=', false], ['companyId', '=', companyId]]", required: true
    });
    static productId = Fields.Many2one(
        'product.product', {
            string: 'Product Variant',
        checkCompany: true, index: true,
        domain: "['&', ['productTemplateId', '=', productTemplateId], ['type', 'in', ['product', 'consu']],  '|', ['companyId', '=', false], ['companyId', '=', companyId]]",
        help: "If a product variant is defined the BOM is available only for this product."
    });
    static bomLineIds = Fields.One2many('mrp.bom.line', 'bomId', { string: 'BoM Lines', copy: true });
    static byproductIds = Fields.One2many('mrp.bom.byproduct', 'bomId', { string: 'By-products', copy: true });
    static productQty = Fields.Float(
        'Quantity', {
            default: 1.0,
        digits: 'Unit of Measure', required: true,
        help: "This should be the smallest quantity that this product can be produced in. If the BOM contains operations, make sure the work center capacity is accurate."
    });
    static productUomId = Fields.Many2one(
        'uom.uom', {
            string: 'Unit of Measure',
        default: (self) => self._getDefaultProductUomId(), required: true,
        help: "Unit of Measure (Unit of Measure) is the unit of measurement for the inventory control", domain: "[['categoryId', '=', productUomCategoryId]]"
    });
    static productUomCategoryId = Fields.Many2one({ related: 'productTemplateId.uomId.categoryId' });
    static sequence = Fields.Integer('Sequence', { help: "Gives the sequence order when displaying a list of bills of material." });
    static operationIds = Fields.One2many('mrp.routing.workcenter', 'bomId', { string: 'Operations', copy: true });
    static readyToProduce = Fields.Selection([
        ['allAvailable', ' When all components are available'],
        ['asap', 'When components for 1st operation are available']], {
            string: 'Manufacturing Readiness',
        default: 'allAvailable', help: "Defines when a Manufacturing Order is considered as ready to be started", required: true
    });
    static pickingTypeId = Fields.Many2one(
        'stock.picking.type', {
            string: 'Operation Type', domain: "[['code', '=', 'mrpOperation'], ['companyId', '=', companyId]]",
        checkCompany: true,
        help: ["When a procurement has a ‘produce’ route with a operation type set, it will try to create ",
            "a Manufacturing Order for that product using a BoM of the same operation type. That allows ",
            "to define stock rules which trigger different manufacturing orders with different BoMs."].join()
    });
    static companyId = Fields.Many2one(
        'res.company', {
            string: 'Company', index: true,
        default: (self) => self.env.company()
    });
    static consumption = Fields.Selection([
        ['flexible', 'Allowed'],
        ['warning', 'Allowed with warning'],
        ['strict', 'Blocked']], {
        help: ["Defines if you can consume more or less components than the quantity defined on the BoM:\n",
            "  * Allowed: allowed for all manufacturing users.\n",
            "  * Allowed with warning: allowed for all manufacturing users with summary of consumption differences when closing the manufacturing order.\n",
            "  * Blocked: only a manager can close a manufacturing order when the BoM consumption is not respected."].join(),
        default: 'warning',
        string: 'Flexible Consumption',
        required: true
    }
    );
    static possibleProductTemplateAttributeValueIds = Fields.Many2many(
        'product.template.attribute.value',
        { compute: '_computePossibleProductTemplateAttributeValueIds' });

    static _sqlConstraints = [
        ['qtyPositive', 'check ("productQty" > 0)', 'The quantity to produce must be positive!'],
    ];

    @api.depends(
        'productTemplateId.attributeLineIds.valueIds',
        'productTemplateId.attributeLineIds.attributeId.createVariant',
        'productTemplateId.attributeLineIds.productTemplateValueIds.ptavActive',
    )
    async _computePossibleProductTemplateAttributeValueIds() {
        for (const bom of this) {
            await bom.set('possibleProductTemplateAttributeValueIds', await (await (await (await (await bom.productTemplateId).validProductTemplateAttributeLineIds)._withoutNoVariantAttributes()).productTemplateValueIds)._onlyActive());
        }
    }

    @api.onchange('productId')
    async _onchangeProductId() {
        if (bool(await this['productId'])) {
            await (await this['bomLineIds']).set('bomProductTemplateAttributeValueIds', false);
            await (await this['operationIds']).set('bomProductTemplateAttributeValueIds', false);
            await (await this['byproductIds']).set('bomProductTemplateAttributeValueIds', false);
        }
    }

    @api.constrains('active', 'productId', 'productTemplateId', 'bomLineIds')
    async _checkBomCycle() {
        const bomsDict = new MapKey();

        /**
         * Check whether the components are part of the finished products (-> cycle). Then, if
            these components have a BoM, repeat the operation with the subcomponents (recursion).
            The method will return the list of product variants that creates the cycle
         * @param components 
         * @param finishedProducts 
         */
        async function _checkCycle(components, finishedProducts) {
            let productsToFind = self.env.items('product.product');

            for (const component of components) {
                if (finishedProducts.includes(component)) {
                    const names = await finishedProducts.mapped('displayName');
                    throw new ValidationError(await self._t("The current configuration is incorrect because it would create a cycle between these products: %s."), names.join(', '));
                }
                if (!bomsDict.has(component)) {
                    productsToFind = productsToFind.or(component);
                }
            }

            const bomFindResult = await self._bomFind(productsToFind);
            for (const component of components) {
                let bom;
                if (!bomsDict.has(component)) {
                    // if (!bomFindResult.has(component)) {
                    //     bomFindResult.set(component, self.env.items('mrp.bom'));
                    // }
                    bom = bomFindResult.get(component);
                    bomsDict.set(component, bom);
                }
                bom = bomsDict.get(component);
                const subcomponents = await (await (await bom.bomLineIds).filtered(async (l) => !bool(await l._skipBomLine(component)))).productId;
                if (bool(subcomponents)) {
                    await _checkCycle(subcomponents, finishedProducts.or(component));
                }
            }
        }
        const self = this;
        let bomsToCheck = this;
        let domain = [];
        for (const product of await (await this['bomLineIds']).productId) {
            domain = OR([domain, await this._bomFindDomain(product)]);
        }
        if (domain.length) {
            bomsToCheck = bomsToCheck.or(await this.env.items('mrp.bom').search(domain));
        }

        for (const bom of bomsToCheck) {
            if (! await bom.active) {
                continue;
            }
            let finishedProducts = await bom.productId;
            finishedProducts = bool(finishedProducts) ? finishedProducts : await (await bom.productTemplateId).productVariantIds;
            const bomLineIds = await bom.bomLineIds;
            if (bool(await bomLineIds.bomProductTemplateAttributeValueIds)) {
                const groupedByComponents = new DefaultDict(() => self.env.items('product.product'));
                for (const finished of finishedProducts) {
                    const components = await (await bomLineIds.filtered(async (l) => !await l._skipBomLine(finished))).productId;
                    groupedByComponents.set(components, groupedByComponents.get(components).or(finished));
                }
                for (const [components, finished] of groupedByComponents.items()) {
                    await _checkCycle(components, finished);
                }
            }
            else {
                await _checkCycle(await bomLineIds.productId, finishedProducts);
            }
        }
    }

    async write(vals) {
        const result = await _super(MrpBom, this).write(vals);
        if ('sequence' in vals && this.ok && this[-1].id == this._prefetchIds.slice(-1)[0]) {
            await this.browse(this._prefetchIds)._checkBomCycle();
        }
        return result;
    }

    @api.constrains('productId', 'productTemplateId', 'bomLineIds', 'byproductIds', 'operationIds')
    async _checkBomLines() {
        for (const bom of this) {
            const applyVariants = (await (await bom.bomLineIds).bomProductTemplateAttributeValueIds).or(await (await bom.operationIds).bomProductTemplateAttributeValueIds).or(await (await bom.byproductIds).bomProductTemplateAttributeValueIds);
            if (bool(await bom.productId) && bool(applyVariants)) {
                throw new ValidationError(await this._t("You cannot use the 'Apply on Variant' functionality and simultaneously create a BoM for a specific variant."));
            }
            for (const ptav of applyVariants) {
                if ((await ptav.productTemplateId).ne(await bom.productTemplateId)) {
                    throw new ValidationError(_format2(await this._t(
                        "The attribute value %(attribute)s set on product %(product)s does not match the BoM product %(bomProduct)s."),
                        {
                            attribute: await ptav.displayName,
                            product: await (await ptav.productTemplateId).displayName,
                            bomProduct: await (await bom.productTemplateId).displayName
                        }));
                }
            }
            for (const byproduct of await bom.byproductIds) {
                let sameProduct;
                if (bool(await bom.productId)) {
                    sameProduct = (await bom.productId).eq(await byproduct.productId);
                }
                else {
                    sameProduct = (await bom.productTemplateId).eq(await (await byproduct.productId).productTemplateId);
                }
                if (bool(sameProduct)) {
                    throw new ValidationError(await this._t("By-product %s should not be the same as BoM product.", await bom.displayName));
                }
                if (await byproduct.costShare < 0) {
                    throw new ValidationError(await this._t("By-products cost shares must be positive."));
                }
            }
            if (sum(await (await bom.byproductIds).mapped('costShare')) > 100) {
                throw new ValidationError(await this._t("The total cost share for a BoM's by-products cannot exceed 100."));
            }
        }
    }

    @api.onchange('bomLineIds', 'productQty')
    async onchangeBomStructure() {
        if (await this['type'] == 'phantom' && bool(this._origin) && bool(await this.env.items('stock.move').search([['bomLineId', 'in', (await this._origin.bomLineIds).ids]], { limit: 1 }))) {
            return {
                'warning': {
                    'title': await this._t('Warning'),
                    'message': await this._t(
                        'The product has already been used at least once, editing its structure may lead to undesirable behaviours. \
                        You should rather archive the product and create a new one with a new bill of materials.'),
                }
            }
        }
    }

    @api.onchange('productUomId')
    async onchangeProductUomId() {
        const [productUomId, productTemplateId] = await this('productUomId', 'productTemplateId');
        const result = {}
        if (!bool(productUomId) || !bool(productTemplateId)) {
            return;
        }
        if ((await productUomId.categoryId).id != (await (await productTemplateId.uomId).categoryId).id) {
            await this.set('productUomId', (await productTemplateId.uomId).id);
            result['warning'] = { 'title': await this._t('Warning'), 'message': await this._t('The Product Unit of Measure you chose has a different category than in the product form.') }
        }
        return result;
    }

    @api.onchange('productTemplateId')
    async onchangeProductTemplateId() {
        const productTemplateId = await this['productTemplateId'];
        if (bool(productTemplateId)) {
            await this.set('productUomId', (await productTemplateId.uomId).id);
            if ((await (await this['productId']).productTemplateId).ne(productTemplateId)) {
                await this.set('productId', false);
            }
            await (await this['bomLineIds']).set('bomProductTemplateAttributeValueIds', false);
            await (await this['operationIds']).set('bomProductTemplateAttributeValueIds', false);
            await (await this['byproductIds']).set('bomProductTemplateAttributeValueIds', false);

            const domain = [['productTemplateId', '=', productTemplateId.id]];
            if (this.id.origin) {
                domain.push(['id', '!=', this.id.origin]);
            }
            const numberOfBomOfThisProduct = await this.env.items('mrp.bom').searchCount(domain);
            if (bool(numberOfBomOfThisProduct)) {  // add a reference to the bom if there is already a bom for this product
                await this.set('code', await this._t("%s (new) %s", await productTemplateId.label, numberOfBomOfThisProduct));
            }
            else {
                await this.set('code', false);
            }
        }
    }

    async copy(defaultValue?: any) {
        const result = await _super(MrpBom, this).copy(defaultValue);
        for (const bomLine of await result.bomLineIds) {
            if (bool(await bomLine.operationId)) {
                const operation = await (await result.operationIds).filtered(async (op) => equal(await op._getComparisonValues(), await (await bomLine.operationId)._getComparisonValues()));
                // Two operations could have the same values so we take the first one
                bomLine.set('operationId', operation.slice(0, 1));
            }
        }
        return result;
    }

    @api.model()
    async nameCreate(name) {
        // prevent to use string as productTemplateId
        if (typeof name === 'string') {
            throw new UserError(await this._t("You cannot create a new Bill of Material from here."));
        }
        return _super(MrpBom, this).nameCreate(name);
    }

    async toggleActive() {
        await (await (await this.withContext({ 'activeTest': false })).operationIds).toggleActive();
        return _super(MrpBom, this).toggleActive();
    }

    async nameGet() {
        return this.map(async (bom) => [bom.id, f('%s%s', bom.code && f('%s: ', await bom.code || ''), await (await bom.productTemplateId).displayName)]);
    }

    @api.constrains('productTemplateId', 'productId', 'type')
    async checkKitHasNotOrderpoint() {
        const productIds = [];
        for (const bom of await this.filtered(async (bom) => await bom.type == "phantom")) {
            let ids = (await bom.productId).ids;
            ids = bool(ids) ? ids : (await (await bom.productTemplateId).productVariantIds).ids;
            for (const pid of ids) {
                productIds.push(pid);
            }
        }
        if (bool(await this.env.items('stock.warehouse.orderpoint').search([['productId', 'in', productIds]], { count: true }))) {
            throw new ValidationError(await this._t("You can not create a kit-type bill of materials for products that have at least one reordering rule."));
        }
    }

    @api.ondelete(false)
    async _unlinkExceptRunningMo() {
        if (bool(await this.env.items('mrp.production').search([['bomId', 'in', this.ids], ['state', 'not in', ['done', 'cancel']]], { limit: 1 }))) {
            throw new UserError(await this._t('You can not delete a Bill of Material with running manufacturing orders.\nPlease close or cancel it first.'));
        }
    }

    @api.model()
    async _nameSearch(name: string = '', args?: any, operator: string = 'ilike', opts: { limit?: number, nameGetUid?: any } = {}): Promise<number | any[] | Query> {
        let { limit = 100, nameGetUid = false } = opts;
        args = args ?? [];
        let domain = [];
        if ((name || '').trim()) {
            domain = ['|', [this.cls._recName, operator, name], ['code', operator, name]];
            if (NEGATIVE_TERM_OPERATORS.includes(operator)) {
                domain = domain.slice(1);
            }
        }
        return this._search(AND([domain, args]), { limit, accessRightsUid: nameGetUid });
    }

    @api.model()
    async _bomFindDomain(products, pickingType?: any, companyId: any = false, bomType: any = false) {
        let domain = ['&', '|', ['productId', 'in', products.ids], '&', ['productId', '=', false], ['productTemplateId', 'in', (await products.productTemplateId).ids], ['active', '=', true]];
        if (bool(companyId) || this.env.context['companyId']) {
            domain = AND([domain, ['|', ['companyId', '=', false], ['companyId', '=', bool(companyId) ? companyId : this.env.context['companyId']]]]);
        }
        if (bool(pickingType)) {
            domain = AND([domain, ['|', ['pickingTypeId', '=', pickingType.id], ['pickingTypeId', '=', false]]]);
        }
        if (bomType) {
            domain = AND([domain, [['type', '=', bomType]]]);
        }
        return domain;
    }

    /**
     * Find the first BoM for each products

     * @param products `product.product` recordset
     * @param pickingType 
     * @param companyId 
     * @param bomType 
     * @returns One bom (or empty recordset `mrp.bom` if none find) by product (`product.product` record) 
     * => DefaultDict(() => this.env.items('mrp.bom'))
     */
    @api.model()
    async _bomFind(products, opts: {pickingType?: any, companyId?: any, bomType?: any}={}) {
        const {pickingType, companyId = false, bomType = false} = opts;
        const bomByProduct = new DefaultMapKey(() => this.env.items('mrp.bom'));
        products = await products.filtered(async (p) => await p.type != 'service');
        if (!bool(products)) {
            return bomByProduct; // Why using of DedaultKey be returned long-time??? 
        }
        const domain = await this._bomFindDomain(products, pickingType, companyId, bomType);

        // Performance optimization, allow usage of limit and avoid the for loop `bom.productTemplateId.productVariantIds`
        if (len(products) == 1) {
            const bom = await this.search(domain, { order: 'sequence, productId, id', limit: 1 });
            if (bool(bom)) {
                bomByProduct.set(products, bom);
            }
            return bomByProduct;
        }
        const boms = await this.search(domain, { order: 'sequence, productId, id' });

        const productsIds = new Set(products.ids);
        for (const bom of boms) {
            let productsImplies = await bom.productId;
            productsImplies = bool(productsImplies) ? productsImplies : await (await bom.productTemplateId).productVariantIds;
            for (const product of productsImplies) {
                if (productsIds.has(product.id) && !bomByProduct.has(product)) {
                    bomByProduct.set(product, bom);
                }
            }
        }
        return bomByProduct;
    }

    /**
     * Explodes the BoM and creates two lists with all the information you need: bom_done and line_done
            Quantity describes the number of times you need the BoM: so the quantity divided by the number created by the BoM
            and converted into its UoM
     * @param product 
     * @param quantity 
     * @param pickingType 
     * @returns 
     */
    async explode(product, quantity, pickingType: any = false) {
        const self = this;
        const graph = new DefaultDict(() => []);
        let V = [];

        function checkCycle(v, visited: {}, recStack: {}, graph) {
            visited[v] = true;
            recStack[v] = true;
            for (const neighbour of graph[v]) {
                if (visited[neighbour] == false) {
                    if (checkCycle(neighbour, visited, recStack, graph) == true) {
                        return true;
                    }
                }
                else if (recStack[neighbour] == true) {
                    return true;
                }
            }
            recStack[v] = false;
            return false;
        }

        const productIds = new Set<Number>(),
            productBoms = new MapKey();

        async function updateProductBoms() {
            const products = self.env.items('product.product').browse(productIds);
            update(productBoms, await self._bomFind(products, {pickingType: bool(pickingType) ? pickingType : await self['pickingTypeId'], companyId: (await self['companyId']).id, bomType: 'phantom'}));
            // Set missing keys to default value
            for (const product of products) {
                productBoms.setdefault(product, self.env.items('mrp.bom'));
            }
        }

        const bomsDone = [[this, { 'qty': quantity, 'product': product, 'originalQty': quantity, 'parentLine': false }]],
            linesDone = [];
        V = _.union(V, [(await product.productTemplateId).id]);

        let bomLines = [];
        for (const bomLine of await this['bomLineIds']) {
            const productId = await bomLine.productId;
            V = _.union(V, [(await productId.productTemplateId).id]);
            graph[(await product.productTemplateId).id].push((await productId.productTemplateId).id);
            bomLines.push([bomLine, product, quantity, false]);
            productIds.add(productId.id);
        }
        await updateProductBoms();
        productIds.clear();
        while (bool(bomLines)) {
            const [currentLine, currentProduct, currentQty, parentLine] = bomLines[0];
            bomLines = bomLines.slice(1);

            if (await currentLine._skipBomLine(currentProduct)) {
                continue;
            }

            let lineQuantity = currentQty * await currentLine.productQty;
            if (!productBoms.has(await currentLine.productId)) {
                await updateProductBoms();
                productIds.clear();
            }
            const bom = productBoms.get(await currentLine.productId);
            if (bool(bom)) {
                const convertedLineQuantity = await (await currentLine.productUomId)._computeQuantity(lineQuantity / await bom.productQty, await bom.productUomId);
                for (const line in await bom.bomLineIds) {
                    extend(bomLines, [[line, await currentLine.productId, convertedLineQuantity, currentLine]]);
                }
                for (const bomLine of await bom.bomLineIds) {
                    graph[(await (await currentLine.productId).productTemplateId).id].push((await (await bomLine.productId).productTemplateId).id);
                    if (V.includes((await (await bomLine.productId).productTemplateId).id)
                        && checkCycle((await (await bomLine.productId).productTemplateId).id, Object.fromEntries(V.map(key => [key, false])), Object.fromEntries(V.map(key => [key, false])), graph)) {
                        throw new UserError(await this._t('Recursion error! A product with a Bill of Material should not have itself in its BoM or child BoMs!'));
                    }
                    V = _.union(V, [(await (await bomLine.productId).productTemplateId).id]);
                    if (!productBoms.has(await bomLine.productId)) {
                        productIds.add((await bomLine.productId).id);
                    }
                }
                bomsDone.push([bom, { 'qty': convertedLineQuantity, 'product': currentProduct, 'originalQty': quantity, 'parentLine': currentLine }]);
            }
            else {
                // We round up here because the user expects that if he has to consume a little more, the whole UOM unit
                // should be consumed.
                const rounding = await (await currentLine.productUomId).rounding;
                lineQuantity = floatRound(lineQuantity, { precisionRounding: rounding, roundingMethod: 'UP' });
                linesDone.push([currentLine, { 'qty': lineQuantity, 'product': currentProduct, 'originalQty': quantity, 'parentLine': parentLine }]);
            }
        }
        return [bomsDone, linesDone];
    }

    @api.model()
    async getImportTemplates() {
        return [{
            'label': await this._t('Import Template for Bills of Materials'),
            'template': '/mrp/static/xls/mrp_bom.xls'
        }];
    }
}

@MetaModel.define()
class MrpBomLine extends Model {
    static _module = module;
    static _name = 'mrp.bom.line';
    static _order = "sequence, id";
    static _recName = "productId";
    static _description = 'Bill of Material Line';
    static _checkCompanyAuto = true;

    async _getDefaultProductUomId() {
        return (await this.env.items('uom.uom').search([], { limit: 1, order: 'id' })).id;
    }

    static productId = Fields.Many2one('product.product', { string: 'Component', required: true, checkCompany: true });
    static productTemplateId = Fields.Many2one('product.template', { string: 'Product Template', related: 'productId.productTemplateId', store: true, index: true });
    static companyId = Fields.Many2one({ related: 'bomId.companyId', store: true, index: true, readonly: true });
    static productQty = Fields.Float('Quantity', { default: 1.0, digits: 'Product Unit of Measure', required: true });
    static productUomId = Fields.Many2one('uom.uom', {
        string: 'Product Unit of Measure', default: self => self._getDefaultProductUomId(), required: true,
        help: "Unit of Measure (Unit of Measure) is the unit of measurement for the inventory control", domain: "[['categoryId', '=', productUomCategoryId]]"
    });
    static productUomCategoryId = Fields.Many2one({ related: 'productId.uomId.categoryId' });
    static sequence = Fields.Integer('Sequence', { default: 1, help: "Gives the sequence order when displaying." });
    static bomId = Fields.Many2one('mrp.bom', { string: 'Parent BoM', index: true, ondelete: 'CASCADE', required: true });
    static parentProductTemplateId = Fields.Many2one('product.template', { string: 'Parent Product Template', related: 'bomId.productTemplateId' });
    static possibleBomProductTemplateAttributeValueIds = Fields.Many2many({ related: 'bomId.possibleProductTemplateAttributeValueIds' });
    static bomProductTemplateAttributeValueIds = Fields.Many2many('product.template.attribute.value', {
        string: "Apply on Variants", ondelete: 'RESTRICT', domain: "[['id', 'in', possibleBomProductTemplateAttributeValueIds]]",
        help: "BOM Product Variants needed to apply this line."
    });
    static allowedOperationIds = Fields.One2many('mrp.routing.workcenter', { related: 'bomId.operationIds' });
    static operationId = Fields.Many2one('mrp.routing.workcenter', {
        string: 'Consumed in Operation', checkCompany: true,
        domain: "[['id', 'in', allowedOperationIds]]",
        help: "The operation where the components are consumed, or the finished products created."
    });
    static childBomId = Fields.Many2one('mrp.bom', { string: 'Sub BoM', compute: '_computeChildBomId' });
    static childLineIds = Fields.One2many('mrp.bom.line', {
        string: "BOM lines of the referred bom",
        compute: '_computeChildLineIds'
    });
    static attachmentsCount = Fields.Integer('Attachments Count', { compute: '_computeAttachmentsCount' });

    static _sqlConstraints = [
        ['bomQtyZero', 'CHECK ("productQty">=0)', 'All product quantities must be greater or equal to 0.\n \
            Lines with 0 quantities can be used as optional lines. \n \
            You should install the mrp_byproduct module if you want to manage extra products on BoMs !'],
    ];

    @api.depends('productId', 'bomId')
    async _computeChildBomId() {
        for (const line of this) {
            if (!bool(await line.productId)) {
                await line.set('childBomId', false);
            }
            else {
                await line.set('childBomId', (await this.env.items('mrp.bom')._bomFind(await line.productId)).get(await line.productId));
            }
        }
    }

    @api.depends('productId')
    async _computeAttachmentsCount() {
        for (const line of this) {
            const nbrAttach = await this.env.items('mrp.document').searchCount([
                '|',
                '&', ['resModel', '=', 'product.product'], ['resId', '=', (await line.productId).id],
                '&', ['resModel', '=', 'product.template'], ['resId', '=', (await (await line.productId).productTemplateId).id]]);
            await line.set('attachmentsCount', nbrAttach);
        }
    }

    /**
     * If the BOM line refers to a BOM, return the ids of the child BOM lines
     * @returns 
     */
    @api.depends('childBomId')
    async _computeChildLineIds() {
        for (const line of this) {
            const ids = (await (await line.childBomId).bomLineIds).ids;
            await line.set('childLineIds', bool(ids) ? ids : false);
        }
    }

    @api.onchange('productUomId')
    async onchangeProductUomId() {
        const result = {};
        const [product, productUom] = await this('productId', 'productUomId');
        if (!bool(productUom) || !bool(product)) {
            return result;
        }
        if ((await productUom.categoryId).ne(await (await product.uomId).categoryId)) {
            await this.set('productUomId', (await product.uomId).id);
            result['warning'] = { 'title': await this._t('Warning'), 'message': await this._t('The Product Unit of Measure you chose has a different category than in the product form.') }
        }
        return result;
    }

    @api.onchange('productId')
    async onchangeProductId() {
        const product = await this['productId']
        if (bool(product)) {
            await this.set('productUomId', (await product.uomId).id);
        }
    }

    @api.modelCreateMulti()
    async create(valsList) {
        for (const values of valsList) {
            if ('productId' in values && !('productUomId' in values)) {
                values['productUomId'] = (await this.env.items('product.product').browse(values['productId']).uomId).id;
            }
        }
        return _super(MrpBomLine, this).create(valsList);
    }

    /**
     * Control if a BoM line should be produced, can be inherited to add
        custom control.
     * @param product 
     * @returns 
     */
    async _skipBomLine(product) {
        this.ensureOne();
        if (product._name == 'product.template') {
            return false;
        }
        return ! await product._matchAllVariantValues(await this['bomProductTemplateAttributeValueIds']);
    }

    async actionSeeAttachments() {
        const product = await this['productId'];
        const domain = [
            '|',
            '&', ['resModel', '=', 'product.product'], ['resId', '=', product.id],
            '&', ['resModel', '=', 'product.template'], ['resId', '=', (await product.productTemplateId).id]];
        const attachmentView = await this.env.ref('mrp.viewDocumentFileKanbanMrp');
        return {
            'label': await this._t('Attachments'),
            'domain': domain,
            'resModel': 'mrp.document',
            'type': 'ir.actions.actwindow',
            'viewId': attachmentView.id,
            'views': [[attachmentView.id, 'kanban'], [false, 'form']],
            'viewMode': 'kanban,tree,form',
            'help': await this._t(`<p class="o-view-nocontent-smiling-face">
                        Upload files to your product
                    </p><p>
                        Use this feature to store any files, like drawings or specifications.
                    </p>`),
            'limit': 80,
            'context': f("{'default_resModel': '%s','default_resId': %s, 'default_companyId': %s}", 'product.product', product.id, (await this['companyId']).id)
        }
    }
}

@MetaModel.define()
class MrpByProduct extends Model {
    static _module = module;
    static _name = 'mrp.bom.byproduct';
    static _description = 'Byproduct';
    static _recName = "productId";
    static _checkCompanyAuto = true;
    static _order = 'sequence, id';

    static productId = Fields.Many2one('product.product', { string: 'By-product', required: true, checkCompany: true });
    static companyId = Fields.Many2one({ related: 'bomId.companyId', store: true, index: true, readonly: true });
    static productQty = Fields.Float('Quantity', { default: 1.0, digits: 'Product Unit of Measure', required: true });
    static productUomCategoryId = Fields.Many2one({ related: 'productId.uomId.categoryId' });
    static productUomId = Fields.Many2one('uom.uom', {
        string: 'Unit of Measure', required: true,
        domain: "[['categoryId', '=', productUomCategoryId]]"
    });
    static bomId = Fields.Many2one('mrp.bom', { string: 'BoM', ondelete: 'CASCADE', index: true });
    static allowedOperationIds = Fields.One2many('mrp.routing.workcenter', { related: 'bomId.operationIds' });
    static operationId = Fields.Many2one(
        'mrp.routing.workcenter', {
            string: 'Produced in Operation', checkCompany: true,
        domain: "[['id', 'in', allowedOperationIds]]"
    });
    static possibleBomProductTemplateAttributeValueIds = Fields.Many2many({ related: 'bomId.possibleProductTemplateAttributeValueIds' });
    static bomProductTemplateAttributeValueIds = Fields.Many2many(
        'product.template.attribute.value', {
            string: "Apply on Variants", ondelete: 'RESTRICT',
        domain: "[['id', 'in', possibleBomProductTemplateAttributeValueIds]]",
        help: "BOM Product Variants needed to apply this line."
    });
    static sequence = Fields.Integer("Sequence");
    static costShare = Fields.Float(
        "Cost Share (%)", {
            digits: [5, 2],  // decimal = 2 is important for rounding calculations!!
        help: "The percentage of the final production cost for this by-product line (divided between the quantity produced). \
             The total of all by-products' cost share must be less than or equal to 100."});

    /**
     * Changes UoM if productId changes.
     * @returns 
     */
    @api.onchange('productId')
    async _onchangeProductId() {
        const product = await this['productId'];
        if (bool(product)) {
            await this.set('productUomId', (await product.uomId).id);
        }
    }

    /**
     * Control if a byproduct line should be produced, can be inherited to add
        custom control.
     * @param product 
     * @returns 
     */
    async _skipByproductLine(product) {
        this.ensureOne();
        if (product._name == 'product.template') {
            return false;
        }
        return !await product._matchAllVariantValues(await this['bomProductTemplateAttributeValueIds']);
    }
}
