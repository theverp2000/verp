import { api, Fields } from "../../../core";
import { MetaModel, moduleXmlid, TransientModel } from "../../../core/models"
import { len, pop } from "../../../core/tools";

@MetaModel.define()
class MrpProductionBackorderLine extends TransientModel {
    static _module = module;
    static _name = 'mrp.production.backorder.line';
    static _description = "Backorder Confirmation Line";

    static mrpProductionBackorderId = Fields.Many2one('mrp.production.backorder', {string: 'MO Backorder', required: true, ondelete: "CASCADE"});
    static mrpProductionId = Fields.Many2one('mrp.production', {string: 'Manufacturing Order', required: true, ondelete: "CASCADE", readonly: true});
    static toBackorder = Fields.Boolean('To Backorder');
}

@MetaModel.define()
class MrpProductionBackorder extends TransientModel {
    static _module = module;
    static _name = 'mrp.production.backorder';
    static _description = "Wizard to mark as done or create back order";

    static mrpProductionIds = Fields.Many2many('mrp.production');

    static mrpProductionBackorderLineIds = Fields.One2many('mrp.production.backorder.line', 'mrpProductionBackorderId',
        {string: "Backorder Confirmation Lines"});
    static showBackorderLines = Fields.Boolean("Show backorder lines", {compute: "_computeShowBackorderLines"});

    @api.depends('mrpProductionBackorderLineIds')
    async _computeShowBackorderLines() {
        for (const wizard of this) {
            await wizard.set('showBackorderLines', len(await wizard.mrpProductionBackorderLineIds) > 1);
        }
    }

    async actionCloseMo() {
        return (await (await this['mrpProductionIds']).withContext({skipBackorder: true})).buttonMarkDone();
    }

    async actionBackorder() {
        const ctx = Object.assign({}, this.env.context);
        pop(ctx, 'default_mrpProductionIds', null);
        const moIdsToBackorder = (await (await (await this['mrpProductionBackorderLineIds']).filtered(async (l) => await l.toBackorder)).mrpProductionId).ids;
        return (await (await this['mrpProductionIds']).withContext(ctx, {skipBackorder: true, moIdsToBackorder: moIdsToBackorder})).buttonMarkDone();
    }
}
