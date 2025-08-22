import { Fields, MetaModel, TransientModel } from "../../../core";
import { update } from "../../../core/tools";

@MetaModel.define()
class AccountCommonJournalReport extends TransientModel {
    static _module = module;
    static _name = 'account.common.journal.report';
    static _description = 'Common Journal Report';
    static _parents = "account.common.report";

    static amountCurrency = Fields.Boolean('With Currency', {help: "Print Report with the currency column if the currency differs from the company currency."});

    async prePrintReport(data) {
        update(data['form'], {'amountCurrency': await this['amountCurrency']});
        return data;
    }
}