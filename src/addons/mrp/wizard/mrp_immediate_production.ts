import { api, Fields } from "../../../core";
import { UserError } from "../../../core/helper";
import { _super, MetaModel, TransientModel } from "../../../core/models"
import { bool, f, floatCompare, len } from "../../../core/tools";

@MetaModel.define()
class MrpImmediateProductionLine extends TransientModel {
    static _module = module;
    static _name = 'mrp.immediate.production.line';
    static _description = 'Immediate Production Line';

    static immediateProductionId = Fields.Many2one('mrp.immediate.production', {string: 'Immediate Production', required: true});
    static productionId = Fields.Many2one('mrp.production', {string: 'Production', required: true});
    static toImmediate = Fields.Boolean('To Process');
}

@MetaModel.define()
class MrpImmediateProduction extends TransientModel {
    static _module = module;
    static _name = 'mrp.immediate.production';
    static _description = 'Immediate Production';

    @api.model()
    async defaultGet(fields) {
        const result = await _super(MrpImmediateProduction, this).defaultGet(fields);
        if (fields.includes('immediateProductionLineIds')) {
            if (this.env.context['default_moIds']) {
                result['moIds'] = this.env.context['default_moIds'];
                result['immediateProductionLineIds'] = result['moIds'].map(moId => [0, 0, {'toImmediate': true, 'productionId': moId[1]}]);
            }
        }
        return result;
    }

    static moIds = Fields.Many2many('mrp.production', {relation: 'mrpProductionProductionRel'});
    static showProductions = Fields.Boolean({compute: '_computeShowProduction'});
    static immediateProductionLineIds = Fields.One2many('mrp.immediate.production.line', 'immediateProductionId',
        {string: "Immediate Production Lines"});

    @api.depends('immediateProductionLineIds')
    async _computeShowProduction() {
        for (const wizard of this) {
            await wizard.set('showProductions', len(await (await wizard.immediateProductionLineIds).productionId) > 1);
        }
    }

    async process() {
        let productionsToDo = this.env.items('mrp.production');
        let productionsNotToDo = this.env.items('mrp.production');
        for (const line of await this['immediateProductionLineIds']) {
            if (await line.toImmediate == true) {
                productionsToDo = productionsToDo.or(await line.productionId);
            }
            else {
                productionsNotToDo = productionsNotToDo.or(await line.productionId);
            }
        }

        for (const production of productionsToDo) {
            let errorMsg = "";
            if (['lot', 'serial'].includes(await production.productTracking) && !bool(await production.lotProducingId)) {
                await production.actionGenerateSerial();
            }
            if (await production.productTracking == 'serial' && floatCompare(await production.qtyProducing, 1, {precisionRounding: await (await production.productUomId).rounding}) == 1) {
                await production.set('qtyProducing', 1);
            }
            else {
                await production.set('qtyProducing', await production.productQty - await production.qtyProduced);
            }
            await production._setQtyProducing();
            for (const move of await (await production.moveRawIds).filtered(async (m) => !['done', 'cancel'].includes(await m.state))) {
                let rounding = await (await move.productUom).rounding;
                for (const moveLine of await move.moveLineIds) {
                    if (await moveLine.productUomQty) {
                        await moveLine.set('qtyDone', Math.min(await moveLine.productUomQty, await (await moveLine.moveId).shouldConsumeQty));
                    }
                    if (floatCompare(await move.quantityDone, await move.shouldConsumeQty, {precisionRounding: rounding}) >= 0) {
                        break;
                    }
                }
                if (floatCompare(await move.productUomQty, await move.quantityDone, {precisionRounding: await (await move.productUom).rounding}) == 1) {
                    if (['serial', 'lot'].includes(await move.hasTracking)) {
                        errorMsg += f("\n  - %s", await (await move.productId).displayName);
                    }
                }
            }

            if (errorMsg) {
                errorMsg = await this._t('You need to supply Lot/Serial Number for products:') + errorMsg;
                throw new UserError(errorMsg);
            }
        }

        let productionsToValidate = this.env.context['buttonMarkDoneProductionIds'];
        if (bool(productionsToValidate)) {
            productionsToValidate = this.env.items('mrp.production').browse(productionsToValidate);
            productionsToValidate = productionsToValidate.sub(productionsNotToDo);
            return (await productionsToValidate.withContext({skipImmediate: true})).buttonMarkDone();
        }
        return true;
    }
}
