import { _super, AbstractModel, api, MetaModel } from "../../../core";

@MetaModel.define()
class ReportStockRule extends AbstractModel {
    static _module = module;
    static _parents = 'report.stock.stockrule';

    /**
     * We override this method to handle manufacture rule which do not have a locationSrcId.
     * @param rule 
     * @param productId 
     * @returns 
     */
    @api.model()
    async _getRuleLoc(rule, productId) {
        const result = await _super(ReportStockRule, this)._getRuleLoc(rule, productId);
        if (await rule.action == 'manufacture') {
            result['source'] = await productId.propertyStockProduction;
        }
        return result;
    }
}