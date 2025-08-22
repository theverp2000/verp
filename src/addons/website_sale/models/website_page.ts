import { _super, AbstractModel, MetaModel } from "../../../core";

@MetaModel.define()
class WebsitePage extends AbstractModel {
    static _module = module;
    static _parents = 'website.page';

    async _getCacheKey(req) {
        const cart = await req.website.saleGetOrder();
        let cacheKey = [cart && await cart.cartQuantity || 0];
        cacheKey = cacheKey.concat(await _super(WebsitePage, this)._getCacheKey(req));
        return cacheKey;
    }
}