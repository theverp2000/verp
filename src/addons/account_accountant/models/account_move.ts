import { api, MetaModel, Model } from "../../../core";

@MetaModel.define()
class AccountMove extends Model {
    static _module = module;
    static _parents = "account.move";

    @api.model()
    async _getInvoiceInPaymentState() {
        return 'inPayment';
    }
}
