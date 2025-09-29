import { api } from "../../../core";
import { AbstractModel, MetaModel } from "../../../core/models"
import { bool, extend, floatRound, jsonParse, len, parseFloat, parseInt, sum } from "../../../core/tools";

@MetaModel.define()
class ReportBomStructure extends AbstractModel {
    static _module = module;
    static _name = 'report.mrp.bomstructure';
    static _description = 'BOM Structure Report';

    @api.model()
    async _getReportValues(docids, data?: any) {
        const docs = [];
        for (const bomId of docids) {
            let bom = this.env.items('mrp.bom').browse(bomId);
            const variant = data['variant'];
            let candidates = variant && this.env.items('product.product').browse(parseInt(variant));
            candidates = bool(candidates) ? candidates : await bom.productId;
            candidates = bool(candidates) ? candidates : await (await bom.productTemplateId).productVariantIds;
            const quantity = parseFloat(data['quantity'] ?? await bom.productQty);
            for (const productVariantId of candidates.ids) {
                let doc;
                if (data && data['childs']) {
                    doc = await this._getPdfLine(bomId, {productId: productVariantId, qty: quantity, childBomIds: jsonParse(data['childs'])});
                }
                else {
                    doc = await this._getPdfLine(bomId, {productId: productVariantId, qty: quantity, unfolded: true});
                }
                doc['reportType'] = 'pdf';
                doc['reportStructure'] = data && data['reportType'] || 'all';
                docs.push(doc);
            }
            if (!bool(candidates)) {
                let doc;
                if (data && data['childs']) {
                    doc = await this._getPdfLine(bomId, {qty: quantity, childBomIds: jsonParse(data['childs'])});
                }
                else {
                    doc = await this._getPdfLine(bomId, {qty: quantity, unfolded: true});
                }
                doc['reportType'] = 'pdf';
                doc['reportStructure'] = data && data['reportType'] || 'all';
                docs.push(doc);
            }
        }
        return {
            'docIds': docids,
            'docModel': 'mrp.bom',
            'docs': docs,
        }
    }

    @api.model()
    async getHtml(bomId=false, searchQty=1, searchVariant=false) {
        const result = await this._getReportData({bomId, searchQty, searchVariant});
        result['lines']['reportType'] = 'html';
        result['lines']['reportStructure'] = 'all';
        result['lines']['hasAttachments'] = result['lines']['attachments'] || result['lines']['components'].some(component => bool(component['attachments']));
        result['lines'] = await (await this.env.ref('mrp.reportMrpBom'))._render({'data': result['lines']});
        return result;
    }

    @api.model()
    async getBom(opts: {bomId?: any, productId?: any, lineQty?: any, lineId?: any, level?: any}={}) {
        const lines = await this._getBom(opts);
        return (await this.env.ref('mrp.reportMrpBomLine'))._render({'data': lines});
    }

    @api.model()
    async getOperations(productId=false, bomId=false, qty=0, level=0) {
        const bom = this.env.items('mrp.bom').browse(bomId);
        const product = this.env.items('product.product').browse(productId);
        const lines = await this._getOperationLine(product, bom, floatRound(qty / await bom.productQty, {precisionRounding: 1, roundingMethod: 'UP'}), level);
        const values = {
            'bomId': bomId,
            'currency': await (await this.env.company()).currencyId,
            'operations': lines,
            'extraColumnCount': await this._getExtraColumnCount()
        }
        return (await this.env.ref('mrp.reportMrpOperationLine'))._render({'data': values});
    }

    @api.model()
    async getByproducts(bomId=false, qty=0, level=0, total=0) {
        const bom = this.env.items('mrp.bom').browse(bomId);
        const [lines, dummy] = await this._getByproductsLines(bom, qty, level, total);
        const values = {
            'bomId': bomId,
            'currency': await (await this.env.company()).currencyId,
            'byproducts': lines,
            'extraColumnCount': await this._getExtraColumnCount(),
        }
        return (await this.env.ref('mrp.reportMrpByproductLine'))._render({'data': values});
    }

    @api.model()
    async _getReportData(bomId, searchQty=0, searchVariant=false) {
        let lines = {}
        const bom = this.env.items('mrp.bom').browse(bomId);
        const bomQuantity = searchQty || await bom.productQty || 1;
        const bomProductVariants = {};
        let bomUomName = '';

        if (bom.ok) {
            bomUomName = await (await bom.productUomId).label;

            // Get variants used for search
            if (! bool(await bom.productId)) {
                for (const variant of await (await bom.productTemplateId).productVariantIds) {
                    bomProductVariants[variant.id] = await variant.displayName;
                }
            }
        }

        lines = await this._getBom({bomId, productId: searchVariant, lineQty: bomQuantity, level: 1});
        const user = await this.env.user();
        return {
            'lines': lines,
            'variants': bomProductVariants,
            'bomUomName': bomUomName,
            'bomQty': bomQuantity,
            'isVariantApplied': await user.userHasGroups('product.groupProductVariant') && len(bomProductVariants) > 1,
            'isUomApplied': user.userHasGroups('uom.groupUom'),
            'extraColumnCount': this._getExtraColumnCount()
        }
    }

    async _getBom(opts: {bomId?: any, productId?: any, lineQty?: any, lineId?: any, level?: any}={}) {
        const {bomId=false, productId=false, lineQty=false, lineId=false, level=false} = opts;
        const bom = this.env.items('mrp.bom').browse(bomId);
        const company = bool(await bom.companyId) ? await bom.companyId : await this.env.company();
        let bomQuantity = lineQty;
        if (lineId) {
            const currentLine = this.env.items('mrp.bom.line').browse(parseInt(lineId));
            bomQuantity = await (await currentLine.productUomId)._computeQuantity(lineQty, await bom.productUomId) || 0;
        }
        // Display bom components for current selected product variant
        let product, attachments;
        if (productId) {
            product = this.env.items('product.product').browse(parseInt(productId));
        }
        else {
            product = bool(await bom.productId) ? await bom.productId : await (await bom.productTemplateId).productVariantId;
        }
        if (bool(product)) {
            attachments = await this.env.items('mrp.document').search(['|', '&', ['resModel', '=', 'product.product'],
            ['resId', '=', product.id], '&', ['resModel', '=', 'product.template'], ['resId', '=', (await product.productTemplateId).id]]);
        }
        else {
            // Use the product template instead of the variant
            product = await bom.productTemplateId;
            attachments = await this.env.items('mrp.document').search([['resModel', '=', 'product.template'], ['resId', '=', product.id]]);
        }
        const operations = await this._getOperationLine(product, bom, floatRound(bomQuantity, {precisionRounding: 1, roundingMethod: 'UP'}), 0);
        const lines = {
            'bom': bom,
            'bomQty': bomQuantity,
            'bomProdName': await product.displayName,
            'currency': await company.currencyId,
            'product': product,
            'code': bool(bom) && bom.displayName || '',
            'price': await (await product.uomId)._computePrice(await (await product.withCompany(company)).standardPrice, await bom.productUomId) * bomQuantity,
            'total': sum(operations.map(op => op['total'])),
            'level': level || 0,
            'operations': operations,
            'operationsCost': sum(operations.map(op => op['total'])),
            'attachments': attachments,
            'operationsTime': sum(operations.map(op => op['durationExpected']))
        }
        const [components, total] = await this._getBomLines(bom, bomQuantity, product, lineId, level);
        lines['total'] += total;
        lines['components'] = components;
        const [byproducts, byproductCostPortion] = await this._getByproductsLines(bom, bomQuantity, level, lines['total']);
        lines['byproducts'] = byproducts;
        lines['costShare'] = floatRound(1 - byproductCostPortion, {precisionRounding: 0.0001});
        lines['bomCost'] = lines['total'] * lines['costShare']
        lines['byproductsCost'] = sum(byproducts.map(byproduct => byproduct['bomCost']))
        lines['byproductsTotal'] = sum(byproducts.map(byproduct => byproduct['productQty']))
        lines['extraColumnCount'] = await this._getExtraColumnCount()
        return lines;
    }

    async _getBomLines(bom, bomQuantity, product, lineId, level) {
        const components = [];
        let total = 0;
        for (const line of await bom.bomLineIds) {
            const lineQuantity = (bomQuantity / (await bom.productQty || 1.0)) * await line.productQty;
            if (await line._skipBomLine(product)) {
                continue;
            }
            const company = bool(await bom.companyId) ? await bom.companyId : await this.env.company();
            const [lineProduct, lineChildBom] = await line('productId', 'childBomId');
            const price = await (await lineProduct.uomId)._computePrice(await (await lineProduct.withCompany(company)).standardPrice, await line.productUomId) * lineQuantity;
            let subTotal;
            if (bool(lineChildBom)) {
                const factor = await (await line.productUomId)._computeQuantity(lineQuantity, await lineChildBom.productUomId);
                subTotal = await this._getPrice(lineChildBom, factor, lineProduct);
                const byproductCostShare = sum(await (await lineChildBom.byproductIds).mapped('costShare'));
                if (byproductCostShare) {
                    subTotal *= floatRound(1 - byproductCostShare / 100, {precisionRounding: 0.0001});
                }
            }
            else {
                subTotal = price;
            }
            subTotal = await (await (await this.env.company()).currencyId).round(subTotal);
            components.push({
                'prodId': lineProduct.id,
                'prodName': await lineProduct.displayName,
                'code': bool(lineChildBom) && await lineChildBom.displayName || '',
                'prodQty': lineQuantity,
                'prodUom': await (await line.productUomId).label,
                'prodCost': await (await company.currencyId).round(price),
                'parentId': bom.id,
                'lineId': line.id,
                'level': level || 0,
                'total': subTotal,
                'childBom': lineChildBom.id,
                'phantomBom': bool(lineChildBom) && await lineChildBom.type == 'phantom' || false,
                'attachments': await this.env.items('mrp.document').search(['|', '&',
                    ['resModel', '=', 'product.product'], ['resId', '=', lineProduct.id], '&', ['resModel', '=', 'product.template'], ['resId', '=', (await lineProduct.productTemplateId).id]]),

            });
            total += subTotal;
        }
        return [components, total]
    }

    async _getByproductsLines(bom, bomQuantity, level, total): Promise<any[]> {
        const byproducts = [];
        let byproductCostPortion = 0;
        const company = bool(await bom.companyId) ? await bom.companyId : await this.env.company();
        for (const byproduct of await bom.byproduct_ids) {
            const lineQuantity = (bomQuantity / (await bom.productQty || 1.0)) * await byproduct.productQty;
            const costShare = await byproduct.costShare / 100;
            byproductCostPortion += costShare;
            const product = await byproduct.productId;
            const price = await (await product.uomId)._computePrice(await (await product.withCompany(company)).standardPrice, await byproduct.productUomId) * lineQuantity;
            byproducts.push({
                'productId': product,
                'productName': await product.displayName,
                'productQty': lineQuantity,
                'productUom': await (await byproduct.productUomId).label,
                'productCost': await (await company.currencyId).round(price),
                'parentId': bom.id,
                'level': level || 0,
                'bomCost': await (await company.currencyId).round(total * costShare),
                'costShare': costShare,
            });
        }
        return [byproducts, byproductCostPortion];
    }

    async _getOperationLine(product, bom, qty, level) {
        const operations = [];
        let total = 0.0;
        qty = await (await bom.productUomId)._computeQuantity(qty, await (await bom.productTemplateId).uomId);
        for (const operation of await bom.operationIds) {
            if (await operation._skipOperationLine(product)) {
                continue;
            }
            const workcenter = await operation.workcenterId;
            const operationCycle = floatRound(qty / await workcenter.capacity, {precisionRounding: 1, roundingMethod: 'UP'});
            const durationExpected = (operationCycle * await operation.timeCycle * 100.0 / await workcenter.timeEfficiency) + (await workcenter.timeStop + await workcenter.timeStart);
            total = (durationExpected / 60.0) * await workcenter.costsHour;
            operations.push({
                'level': level || 0,
                'operation': operation,
                'label': await operation.label + ' - ' + await workcenter.label,
                'durationExpected': durationExpected,
                'total': await (await (await this.env.company()).currencyId).round(total),
            });
        }
        return operations;
    }

    async _getPrice(bom, factor, product) {
        let price = 0;
        if (bool(await bom.operationIds)) {
            // routing are defined on a BoM and don't have a concept of quantity.
            // It means that the operation time are defined for the quantity on
            // the BoM (the user produces a batch of products). E.g the user
            // product a batch of 10 units with a 5 minutes operation, the time
            // will be the 5 for a quantity between 1-10, then doubled for
            // 11-20,...
            const operationCycle = floatRound(factor, {precisionRounding: 1, roundingMethod: 'UP'});
            const operations = await this._getOperationLine(product, bom, operationCycle, 0);
            price += sum(operations.map(op => op['total']));
        }

        for (const line of await bom.bomLineIds) {
            if (await line._skipBomLine(product)) {
                continue;
            }
            if (bool(await line.childBomId)) {
                const qty = await (await line.productUomId)._computeQuantity(await line.productQty * (factor / await bom.productQty), await (await line.childBomId).productUomId);
                let subPrice = await this._getPrice(await line.childBomId, qty, await line.productId);
                const byproductCostShare = sum(await (await (await line.childBomId).byproductIds).mapped('costShare'));
                if (byproductCostShare) {
                    subPrice *= floatRound(1 - byproductCostShare / 100, {precisionRounding: 0.0001});
                }
                price += subPrice;
            }
            else {
                const prodQty = await line.productQty * factor / await bom.productQty;
                const company = bool(await bom.companyId) ? await bom.companyId : await this.env.company();
                const notRoundedPrice = await (await (await line.productId).uomId)._computePrice(await (await (await line.productId).withCompany(company)).standardPrice, await line.productUomId) * prodQty;
                price += await (await company.currencyId).round(notRoundedPrice);
            }
        }
        return price;
    }

    async _getSubLines(bom, productId, lineQty, lineId, level, childBomIds, unfolded): Promise<any[]> {
        const data = await this._getBom({bomId: bom.id, productId: productId, lineQty: lineQty, lineId: lineId, level: level});
        const bomLines = data['components'];
        const lines = [];
        for (const bomLine of bomLines) {
            lines.push({
                'label': bomLine['prodName'],
                'type': 'bom',
                'quantity': bomLine['prodQty'],
                'uom': bomLine['prodUom'],
                'prodCost': bomLine['prodCost'],
                'bomCost': bomLine['total'],
                'level': bomLine['level'],
                'code': bomLine['code'],
                'childBom': bomLine['childBom'],
                'prodId': bomLine['prodId']
            });
            if (bomLine['childBom'] && (unfolded || childBomIds.includes(bomLine['childBom']))) {
                const line = this.env.items('mrp.bom.line').browse(bomLine['lineId']);
                extend(lines, await this._getSubLines(await line.childBomId, (await line.productId).id, bomLine['prodQty'], line, level + 1, childBomIds, unfolded));
            }
        }
        if (bool(data['operations'])) {
            lines.push({
                'label': await this._t('Operations'),
                'type': 'operation',
                'quantity': data['operationsTime'],
                'uom': await this._t('minutes'),
                'bomCost': data['operationsCost'],
                'level': level,
            })
            for (const operation of data['operations']) {
                if (unfolded || childBomIds.includes('operation-' + String(bom.id))) {
                    lines.push({
                        'label': operation['label'],
                        'type': 'operation',
                        'quantity': operation['durationExpected'],
                        'uom': await this._t('minutes'),
                        'bomCost': operation['total'],
                        'level': level + 1,
                    });
                }
            }
        }
        if (bool(data['byproducts'])) {
            lines.push({
                'label': await this._t('Byproducts'),
                'type': 'byproduct',
                'uom': false,
                'quantity': data['byproductsTotal'],
                'bomCost': data['byproductsCost'],
                'level': level,
            })
            for (const byproduct of data['byproducts']) {
                if (unfolded || childBomIds.includes('byproduct-' + String(bom.id))) {
                    lines.push({
                        'label': byproduct['productName'],
                        'type': 'byproduct',
                        'quantity': byproduct['productQty'],
                        'uom': byproduct['productUom'],
                        'prodCost': byproduct['productCost'],
                        'bomCost': byproduct['bomCost'],
                        'level': level + 1,
                    });
                }
            }
        }
        return lines;
    }

    async _getPdfLine(bomId, opts: {productId?: any, qty?: number, childBomIds?: any, unfolded?: boolean}={}) {
        let {productId=false, qty=1, childBomIds, unfolded=false} = opts;
        if (childBomIds == null) {
            childBomIds = new Set();
        }

        const bom = this.env.items('mrp.bom').browse(bomId);
        productId = productId || (await bom.productId).id || (await (await bom.productTemplateId).productVariantId).id;
        const data = await this._getBom({bomId, productId, lineQty: qty});
        const pdfLines = await this._getSubLines(bom, productId, qty, false, 1, childBomIds, unfolded);
        data['components'] = [];
        data['lines'] = pdfLines;
        data['extraColumnCount'] = await this._getExtraColumnCount();
        return data;
    }

    async _getExtraColumnCount() {
        return 0;
    }
}
