import { Fields, MetaModel, TransientModel } from "../../../core";

@MetaModel.define()
class ResConfigSettings extends TransientModel {
    static _module = module;
    static _parents = 'res.config.settings';

    static unsplashAccessKey = Fields.Char("Access Key", {configParameter: 'unsplash.accessKey'});
}
