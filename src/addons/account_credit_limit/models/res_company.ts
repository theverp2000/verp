import { Fields, MetaModel, Model } from "../../../core";

@MetaModel.define()
class ResCompany extends Model {
    static _module = module;
    static _parents = 'res.company';

    static accountCreditLimit = Fields.Boolean();
    static accountDefaultCreditLimit = Fields.Monetary();
    static creditLimitType = Fields.Selection([['warning', 'Warning'], ['block', 'Block']]);
}