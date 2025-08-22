import { _super, AbstractModel, api, MetaModel } from "../../../core";

@MetaModel.define()
class PublisherWarrantyContract extends AbstractModel {
    static _module = module;
    static _parents = "publisher.warranty.contract";

    @api.model()
    async _getMessage() {
        const msg = await _super(PublisherWarrantyContract, this)._getMessage();
        msg['website'] = true;
        return msg;
    }
}
