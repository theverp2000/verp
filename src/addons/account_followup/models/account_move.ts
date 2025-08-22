import { Fields, MetaModel, Model } from "../../../core";

@MetaModel.define()
class AccountMoveLine extends Model {
    static _module = module;
    static _parents = 'account.move.line';

    static followupLineId = Fields.Many2one('followup.line', {string: 'Follow-up Level'});
    static followupDate = Fields.Date('Latest Follow-up');
    static result = Fields.Float({compute: '_getResult', string: "Balance Amount"});

    async _getResult() {
        for (const aml of this) {
            await aml.set('result', await aml.debit - await aml.credit);
        }
    }
}