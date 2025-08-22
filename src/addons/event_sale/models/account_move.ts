import { _super, MetaModel, Model } from "../../../core/models"

@MetaModel.define()
class AccountMove extends Model {
    static _module = module;
    static _parents = 'account.move';

    /**
     * When an invoice linked to a sales order selling registrations is
        paid confirm attendees. Attendees should indeed not be confirmed before
        full payment.
     * @returns 
     */
    async actionInvoicePaid() {
        const res = await _super(AccountMove, this).actionInvoicePaid();
        await (await this.mapped('lineIds.saleLineIds'))._updateRegistrations({confirm: true, markAsPaid: true});
        return res;
    }
}
