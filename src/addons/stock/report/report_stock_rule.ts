import { MetaModel, AbstractModel } from "../../../core/models"

@MetaModel.define()
class ReportStockRule extends AbstractModel {
    static _module = module;
    static _name = 'report.stock.stockrule';
    static _description = 'Stock rule report';
}