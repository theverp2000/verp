import { Fields, MetaModel, Model } from "../../../core";

@MetaModel.define()
class AccountAnalyticAccount extends Model {
    static _module = module;
    static _parents = "account.analytic.account";

    static crossoveredBudgetLine = Fields.One2many('crossovered.budget.lines', 'analyticAccountId', { string: 'Budget Lines'});
}