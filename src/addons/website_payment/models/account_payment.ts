import { Fields, MetaModel, Model } from "../../../core";

@MetaModel.define()
class AccountPayment extends Model {
    static _module = module;
    static _parents = 'account.payment';

    static isDonation = Fields.Boolean({string: "Is Donation", related: "paymentTransactionId.isDonation", help: "Is the payment a donation"});
}
