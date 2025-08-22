import { Fields, MetaModel, Model } from "../../../core";

@MetaModel.define()
class Website extends Model {
    static _module = module;
    static _parents = 'website';

    static karmaProfileMin = Fields.Integer({string: "Minimal karma to see other user''s profile", default: 150});
}
