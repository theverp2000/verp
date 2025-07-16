import { _super, AbstractModel, MetaModel } from "../../../core/models"
import { sum } from "../../../core/tools";

@MetaModel.define()
class ReplenishmentReport extends AbstractModel {
    static _module = module;
    static _parents = 'report.stock.product.replenishment';

    async _moveDraftDomain(productTemplateIds, productVariantIds, whLocationIds) {
        let [inDomain, outDomain] = await _super(ReplenishmentReport, this)._moveDraftDomain(productTemplateIds, productVariantIds, whLocationIds);
        inDomain = inDomain.concat([['productionId', '=', false]]);
        outDomain = outDomain.concat([['rawMaterialProductionId', '=', false]]);
        return [inDomain, outDomain];
    }

    async _computeDraftQuantityCount(productTemplateIds, productVariantIds, whLocationIds) {
        const result = await _super(ReplenishmentReport, this)._computeDraftQuantityCount(productTemplateIds, productVariantIds, whLocationIds);
        result['draftProductionQty'] = {}
        let domain = await (this as any)._productDomain(productTemplateIds, productVariantIds);
        domain = domain.concat([['state', '=', 'draft']]);

        // Pending incoming quantity.
        const moDomain = domain.concat([['locationDestId', 'in', whLocationIds]]);
        const groupedMo = await this.env.items('mrp.production').readGroup(moDomain, ['productQty:sum'], 'productId');
        result['draftProductionQty']['in'] = sum(groupedMo.map(mo => mo['productQty']));

        // Pending outgoing quantity.
        const moveDomain = domain.concat([
            ['rawMaterialProductionId', '!=', false],
            ['locationId', 'in', whLocationIds],
        ]);
        const groupedMoves = await this.env.items('stock.move').readGroup(moveDomain, ['productQty:sum'], 'productId');
        result['draftProductionQty']['out'] = sum(groupedMoves.map(move => move['productQty']));
        result['qty']['in'] += result['draftProductionQty']['in'];
        result['qty']['out'] += result['draftProductionQty']['out'];

        return result;
    }
}
