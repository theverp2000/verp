import { api, Fields, MetaModel, Model } from "../../../core";
import { floatRound } from "../../../core/tools";

@MetaModel.define()
class MrpRoutingWorkcenter extends Model {
    static _module = module;
    static _name = 'mrp.routing.workcenter';
    static _description = 'Work Center Usage';
    static _order = 'bomId, sequence, id';
    static _checkCompanyAuto = true;

    static label = Fields.Char('Operation', {required: true});
    static active = Fields.Boolean({default: true});
    static workcenterId = Fields.Many2one('mrp.workcenter', {string: 'Work Center', required: true, checkCompany: true});
    static sequence = Fields.Integer('Sequence', {default: 100,
        help: "Gives the sequence order when displaying a list of routing Work Centers."});
    static bomId = Fields.Many2one('mrp.bom', {string: 'Bill of Material',
        index: true, ondelete: 'CASCADE', required: true, checkCompany: true,
        help: "The Bill of Material this operation is linked to"});
    static companyId = Fields.Many2one('res.company', {string: 'Company', related: 'bomId.companyId'});
    static worksheetType = Fields.Selection([
        ['pdf', 'PDF'], ['googleSlide', 'Google Slide'], ['text', 'Text']],
        {string: "Work Sheet", default: "text",
        help: "Defines if you want to use a PDF or a Google Slide as work sheet."}
    );
    static note = Fields.Html('Description', {help: "Text worksheet description"});
    static worksheet = Fields.Binary('PDF');
    static worksheetGoogleSlide = Fields.Char('Google Slide', {help: "Paste the url of your Google Slide. Make sure the access to the document is public."});
    static timeMode = Fields.Selection([
        ['auto', 'Compute based on tracked time'],
        ['manual', 'Set duration manually']], {string: 'Duration Computation',
        default: 'manual'});
    static timeModeBatch = Fields.Integer('Based on', {default: 10});
    static timeComputedOn = Fields.Char('Computed on last', {compute: '_computeTimeComputedOn'});
    static timeCycleManual = Fields.Float('Manual Duration', {default: 60,
        help: "Time in minutes: \
        - In manual mode, time used \
        - In automatic mode, supposed first time when there aren't any work orders yet"});
    static timeCycle = Fields.Float('Duration', {compute: "_computeTimeCycle"});
    static workorderCount = Fields.Integer("# Work Orders", {compute: "_computeWorkorderCount"});
    static workorderIds = Fields.One2many('mrp.workorder', 'operationId', {string: "Work Orders"});
    static possibleBomProductTemplateAttributeValueIds = Fields.Many2many({related: 'bomId.possibleProductTemplateAttributeValueIds'});
    static bomProductTemplateAttributeValueIds = Fields.Many2many(
        'product.template.attribute.value', {string: "Apply on Variants", ondelete: 'RESTRICT',
        domain: "[['id', 'in', possibleBomProductTemplateAttributeValueIds]]",
        help: "BOM Product Variants needed to apply this line."});

    @api.depends('timeMode', 'timeModeBatch')
    async _computeTimeComputedOn() {
        for (const operation of this) {
            await operation.set('timeComputedOn', await this._t('%s work orders', await operation.timeMode != 'manual' ? operation.timeModeBatch : false));
        }
    }

    @api.depends('timeCycleManual', 'timeMode', 'workorderIds')
    async _computeTimeCycle() {
        const manualOps = await this.filtered(async (operation) => await operation.timeMode == 'manual');
        for (const operation of manualOps) {
            operation.set('timeCycle', await operation.timeCycleManual);
        }
        for (const operation of this.sub(manualOps)) {
            const data = await this.env.items('mrp.workorder').search([
                ['operationId', '=', operation.id],
                ['qtyProduced', '>', 0],
                ['state', '=', 'done']],
                {limit: await operation.timeModeBatch,
                order: "dateFinished desc, id desc"});
            // To compute the timeCycle, we can take the total duration of previous operations
            // but for the quantity, we will take in consideration the qtyProduced like if the capacity was 1.
            // So producing 50 in 00:10 with capacity 2, for the timeCycle, we assume it is 25 in 00:10
            // When recomputing the expected duration, the capacity is used again to divide the qty to produce
            // so that if we need 50 with capacity 2, it will compute the expected of 25 which is 00:10
            let totalDuration = 0,  // Can be 0 since it's not an invalid duration for BoM
            cycleNumber = 0;  // Never 0 unless infinite item['workcenterId'].capacity
            for (const item of data) {
                totalDuration += await item['duration'];
                cycleNumber += floatRound((await item['qtyProduced'] / await (await item['workcenterId']).capacity || 1.0), {precisionDigits: 0, roundingMethod: 'UP'});
            }
            if (cycleNumber) {
                await operation.set('timeCycle', totalDuration / cycleNumber);
            }
            else {
                await operation.set('timeCycle', await operation.timeCycleManual);
            }
        }
    }

    async _computeWorkorderCount() {
        const data = await this.env.items('mrp.workorder').readGroup([
            ['operationId', 'in', this.ids],
            ['state', '=', 'done']], ['operationId'], ['operationId']);
        const countData = Object.fromEntries(data.map(item => [item['operationId'][0], item['operationId_count']]));
        for (const operation of this) {
            await operation.set('workorderCount', countData[operation.id] ?? 0);
        }
    }

    async copyToBom() {
        if ('bomId' in this.env.context) {
            const bomId = this.env.context['bomId'];
            for (const operation of this) {
                await operation.copy({'bomId': bomId});
            }
            return {
                'viewMode': 'form',
                'resModel': 'mrp.bom',
                'views': [[false, 'form']],
                'type': 'ir.actions.actwindow',
                'resId': bomId,
            }
        }
    }

    /**
     * Control if a operation should be processed, can be inherited to add
        custom control.
     * @param product 
     * @returns 
     */
    async _skipOperationLine(product) {
        this.ensureOne();
        if (product._name == 'product.template') {
            return false;
        }
        return ! await product._matchAllVariantValues(await this['bomProductTemplateAttributeValueIds']);
    }

    async _getComparisonValues() {
        if (! this.ok) {
            return false;
        }
        this.ensureOne();
        return Promise.all(['label', 'companyId', 'workcenterId', 'timeMode', 'timeCycleManual', 'bomProductTemplateAttributeValueIds'].map(async key => await this[key]));
    }
}
