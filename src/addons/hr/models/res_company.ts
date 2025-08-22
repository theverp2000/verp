import { Fields, MetaModel, Model } from "../../../core";

@MetaModel.define()
class Company extends Model {
    static _module = module;
    static _parents = 'res.company';

    static hrPresenceControlEmailAmount = Fields.Integer({string: "# emails to send"});
    static hrPresenceControlIpList = Fields.Char({string: "Valid IP addresses"});
}