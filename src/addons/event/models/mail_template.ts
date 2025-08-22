import { _super, api, MetaModel, Model } from "../../../core";
import { expression } from "../../../core/osv";

@MetaModel.define()
class MailTemplate extends Model {
    static _module = module;
    static _parents = 'mail.template';

    /**
     * Context-based hack to filter reference field in a m2o search box to emulate a domain the ORM currently does not support.

        As we can not specify a domain on a reference field, we added a context
        key `filterTemplateOnEvent` on the template reference field. If this
        key is set, we add our domain in the `args` in the `_nameSearch`
        method to filtrate the mail templates.
     * @param name 
     * @param args 
     * @param operator 
     * @param limit 
     * @param nameGetUid 
     * @returns 
     */
    @api.model()
    async _nameSearch(name: string, args?: any, operator='ilike', opts: {limit?: number, nameGetUid?: any}={}) {
        if (this.env.context['filterTemplateOnEvent']) {
            args = expression.AND([[['model', '=', 'event.registration']], args]);
        }
        return _super(MailTemplate, this)._nameSearch(name, args, operator, opts);
    }
}
