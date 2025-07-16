import { http } from "../../../core";
import { bool, unslug } from "../../../core/tools";

@http.define()
class WebsitePartnerPage extends http.Controller {
    static _module = module;

    // Do not use semantic controller due to SUPERUSER_ID
    @http.route(['/partners/<partnerId>'], { type: 'http', auth: "public", website: true })
    async partnersDetail(req, res, post: { partnerId?: any } = {}) {
        const [, partnerId] = unslug(post.partnerId);
        if (partnerId) {
            const env = await req.getEnv();
            const partnerSudo = (await env.items('res.partner').sudo()).browse(partnerId);
            const isWebsitePublisher = await env.items('res.users').hasGroup('website.groupWebsitePublisher');
            if (bool(await partnerSudo.exists()) && (await partnerSudo.websitePublished || isWebsitePublisher)) {
                const values = {
                    'mainObject': partnerSudo,
                    'partner': partnerSudo,
                    'editPage': false
                }
                return req.render(res, "website_partner.partnerPage", values);
            }
        }
        return req.notFound(res);
    }
}