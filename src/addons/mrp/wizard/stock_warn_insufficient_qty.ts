import { Fields, MetaModel, TransientModel } from "../../../core";

@MetaModel.define()
class StockWarnInsufficientQtyUnbuild extends TransientModel {
    static _module = module;
    static _name = 'stock.warn.insufficient.qty.unbuild';
    static _parents = 'stock.warn.insufficient.qty';
    static _description = 'Warn Insufficient Unbuild Quantity';

    static unbuildId = Fields.Many2one('mrp.unbuild', {string: 'Unbuild'});

    async _getReferenceDocumentCompanyId() {
        return (await this['unbuildId']).companyId;
    }

    async actionDone() {
        this.ensureOne();
        return (await this['unbuildId']).actionUnbuild();
    }
}
