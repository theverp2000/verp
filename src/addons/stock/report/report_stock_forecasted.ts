import { AbstractModel, MetaModel } from "../../../core/models"

@MetaModel.define()
class ReplenishmentReport extends AbstractModel {
    static _module = module;
    static _name = 'report.stock.product.replenishment';
    static _description = "Stock Replenishment Report";
}

@MetaModel.define()
class ReplenishmentTemplateReport extends AbstractModel {
    static _module = module;
    static _name = 'report.stock.template.replenishment';
    static _description = "Stock Replenishment Report";
    static _parents = 'report.stock.product.replenishment';
}