import { MetaModel, AbstractModel } from "../../../core";

@MetaModel.define()
class ReportStockRule extends AbstractModel {
    static _module = module;
    static _name = 'report.stock.stockrule';
    static _description = 'Stock rule report';
}