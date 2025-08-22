import { Fields, MetaModel, Model } from "../../../core";

@MetaModel.define()
class Users extends Model {
    static _module = module;
    static _parents = 'res.users';

    static targetSalesWon = Fields.Integer('Won in Opportunities Target');
    static targetSalesDone = Fields.Integer('Activities Done Target');
}
