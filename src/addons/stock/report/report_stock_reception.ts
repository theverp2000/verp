import { MetaModel, AbstractModel } from "../../../core/models"

@MetaModel.define()
class ReceptionReport extends AbstractModel {
    static _module = module;
    static _name = 'report.stock.reception';
    static _description = "Stock Reception Report";
}