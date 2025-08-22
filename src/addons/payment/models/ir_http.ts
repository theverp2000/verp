import { AbstractModel, MetaModel, _super } from "../../../core";

@MetaModel.define()
class IrHttp extends AbstractModel {
    static _module = module;
    static _parents = 'ir.http';

    async _getTranslationFrontendModulesName(req) {
        const mods = await _super(IrHttp, this)._getTranslationFrontendModulesName(req);
        return mods.concat(['payment']);
    }
}
