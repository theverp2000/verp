import { _super, Fields, MetaModel, Model } from "../../../core";
import { f, htmlTranslate } from "../../../core/tools";

@MetaModel.define()
class WebsiteResPartner extends Model {
    static _module = module;
    static _name = 'res.partner';
    static _parents = ['res.partner', 'website.seo.metadata'];

    static websiteDescription = Fields.Html('Website Partner Full Description', {stripStyle: true, translate: htmlTranslate});
    static websiteShortDescription = Fields.Text('Website Partner Short Description', {translate: true});

    async _computeWebsiteUrl() {
        await _super(WebsiteResPartner, this)._computeWebsiteUrl();
        for (const partner of this) {
            await partner.set('websiteUrl', f("/partners/%s", await partner.slug()));
        }
    }
}