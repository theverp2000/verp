import { Fields, MetaModel, Model } from "../../../core";

@MetaModel.define()
class Company extends Model {
    static _module = module;
    static _parents = "res.company";

    static snailmailColor = Fields.Boolean({string: 'Color', default: true});
    static snailmailCover = Fields.Boolean({string: 'Add a Cover Page', default: false});
    static snailmailDuplex = Fields.Boolean({string: 'Both sides', default: false});
}