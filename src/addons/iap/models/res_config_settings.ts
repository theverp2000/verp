import { api, MetaModel, TransientModel } from "../../../core";

@MetaModel.define()
class ResConfigSettings extends TransientModel {
    static _module = module;
    static _parents = 'res.config.settings';

    @api.model()
    async _redirectToIapAccount() {
        return {
            'type': 'ir.actions.acturl',
            'url': await this.env.items('iap.account').getAccountUrl(),
        }
    }
}