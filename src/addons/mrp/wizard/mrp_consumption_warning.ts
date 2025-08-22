import { api, Fields, MetaModel, TransientModel } from "../../../core";
import { len, pop } from "../../../core/tools";

@MetaModel.define()
class MrpConsumptionWarning extends TransientModel {
    static _module = module;
    static _name = 'mrp.consumption.warning';
    static _description = "Wizard in case of consumption in warning/strict and more component has been used for a MO (related to the bom)";

    static mrpProductionIds = Fields.Many2many('mrp.production');
    static mrpProductionCount = Fields.Integer({compute: "_computeMrpProductionCount"});

    static consumption = Fields.Selection([
        ['flexible', 'Allowed'],
        ['warning', 'Allowed with warning'],
        ['strict', 'Blocked']], {compute: "_computeConsumption"});
    static mrpConsumptionWarningLineIds = Fields.One2many('mrp.consumption.warning.line', 'mrpConsumptionWarningId');

    @api.depends("mrpProductionIds")
    async _computeMrpProductionCount() {
        for (const wizard of this) {
            await wizard.set('mrpProductionCount', len(await wizard.mrpProductionIds));
        }
    }

    @api.depends("mrpConsumptionWarningLineIds.consumption")
    async _computeConsumption() {
        for (const wizard of this) {
            const consumptionMap = await (await wizard.mrpConsumptionWarningLineIds).mapped("consumption");
            await wizard.set('consumption', consumptionMap.includes("strict") && "strict" || consumptionMap.includes("warning") && "warning" || "flexible");
        }
    }

    async actionConfirm() {
        const ctx = Object.assign({}, this.env.context);
        pop(ctx, 'default_mrpProductionIds', null);
        let actionFromDoFinish = false;
        if (this.env.context['fromWorkorder']) {
            if (this.env.context['activeModel'] == 'mrp.workorder') {
                actionFromDoFinish = await this.env.items('mrp.workorder').browse(this.env.context['activeId']).doFinish();
            }
        }
        const actionFromMarkDone = await (await (await this['mrpProductionIds']).withContext(ctx, {skipConsumption: true})).buttonMarkDone();
        return actionFromDoFinish || actionFromMarkDone;
    }

    async actionCancel() {
        if (this.env.context['fromWorkorder'] && len(await this['mrpProductionIds']) == 1) {
            return {
                'type': 'ir.actions.actwindow',
                'resModel': 'mrp.production',
                'views': [[(await this.env.ref('mrp.mrpProductionFormView')).id, 'form']],
                'resId': (await this['mrpProductionIds']).id,
                'target': 'main',
            }
        }
    }
}

@MetaModel.define()
class MrpConsumptionWarningLine extends TransientModel {
    static _module = module;
    static _name = 'mrp.consumption.warning.line';
    static _description = "Line of issue consumption";

    static mrpConsumptionWarningId = Fields.Many2one('mrp.consumption.warning', {string: "Parent Wizard", readonly: true, required: true, ondelete: "CASCADE"});
    static mrpProductionId = Fields.Many2one('mrp.production', {string: "Manufacturing Order", readonly: true, required: true, ondelete: "CASCADE"});
    static consumption = Fields.Selection({related: "mrpProductionId.consumption"});

    static productId = Fields.Many2one('product.product', {string: "Product", readonly: true, required: true});
    static productUomId = Fields.Many2one('uom.uom', {string: "Unit of Measure", related: "productId.uomId", readonly: true});
    static productConsumedQtyUom = Fields.Float("Consumed", {readonly: true});
    static productExpectedQtyUom = Fields.Float("To Consume", {readonly: true});
}