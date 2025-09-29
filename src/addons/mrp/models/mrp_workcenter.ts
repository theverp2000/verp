import { randomInt } from "crypto";
import { Intervals, makeAware } from "../../resource";
import { _Datetime, api, Fields } from "../../../core";
import { UserError, ValidationError } from "../../../core/helper";
import { _super, MetaModel, Model } from "../../../core/models";
import { addDate, bool, diffDate, floatCompare, floatRound, partial2, range, subDate, sum, timezone, toFormat } from "../../../core/tools";

@MetaModel.define()
class MrpWorkcenter extends Model {
    static _module = module;
    static _name = 'mrp.workcenter';
    static _description = 'Work Center';
    static _order = "sequence, id";
    static _parents = ['resource.mixin'];
    static _checkCompanyAuto = true;

    // resource
    static label = Fields.Char('Work Center', { related: 'resourceId.label', store: true, readonly: false });
    static timeEfficiency = Fields.Float('Time Efficiency', { related: 'resourceId.timeEfficiency', default: 100, store: true, readonly: false });
    static active = Fields.Boolean('Active', { related: 'resourceId.active', default: true, store: true, readonly: false });

    static code = Fields.Char('Code', { copy: false });
    static note = Fields.Html('Description', { help: "Description of the Work Center." });
    static capacity = Fields.Float('Capacity', {
        default: 1.0,
        help: "Number of pieces (in product UoM) that can be produced in parallel (at the same time) at this work center. For example: the capacity is 5 and you need to produce 10 units, then the operation time listed on the BOM will be multiplied by two. However, note that both time before and after production will only be counted once."
    });
    static sequence = Fields.Integer('Sequence', {
        default: 1, required: true,
        help: "Gives the sequence order when displaying a list of work centers."
    });
    static color = Fields.Integer('Color');
    static costsHour = Fields.Float({ string: 'Cost per hour', help: 'Specify cost of work center per hour.', default: 0.0 });
    static timeStart = Fields.Float('Setup Time', { help: "Time in minutes for the setup." });
    static timeStop = Fields.Float('Cleanup Time', { help: "Time in minutes for the cleaning." });
    static routingLineIds = Fields.One2many('mrp.routing.workcenter', 'workcenterId', { string: "Routing Lines" });
    static orderIds = Fields.One2many('mrp.workorder', 'workcenterId', { string: "Orders" });
    static workorderCount = Fields.Integer('# Work Orders', { compute: '_computeWorkorderCount' });
    static workorderReadyCount = Fields.Integer('# Read Work Orders', { compute: '_computeWorkorderCount' });
    static workorderProgressCount = Fields.Integer('Total Running Orders', { compute: '_computeWorkorderCount' });
    static workorderPendingCount = Fields.Integer('Total Pending Orders', { compute: '_computeWorkorderCount' });
    static workorderLateCount = Fields.Integer('Total Late Orders', { compute: '_computeWorkorderCount' });

    static timeIds = Fields.One2many('mrp.workcenter.productivity', 'workcenterId', { string: 'Time Logs' });
    static workingState = Fields.Selection([
        ['normal', 'Normal'],
        ['blocked', 'Blocked'],
        ['done', 'In Progress']], { string: 'Workcenter Status', compute: "_computeWorkingState", store: true });
    static blockedTime = Fields.Float('Blocked Time', {
        compute: '_computeBlockedTime',
        help: 'Blocked hours over the last month', digits: [16, 2]
    });
    static productiveTime = Fields.Float('Productive Time', {
        compute: '_computeProductiveTime',
        help: 'Productive hours over the last month', digits: [16, 2]
    });
    static oee = Fields.Float({ compute: '_computeOee', help: 'Overall Equipment Effectiveness, based on the last month' });
    static oeeTarget = Fields.Float({ string: 'OEE Target', help: "Overall Effective Efficiency Target in percentage", default: 90 });
    static performance = Fields.Integer('Performance', { compute: '_computePerformance', help: 'Performance over the last month' });
    static workcenterLoad = Fields.Float('Work Center Load', { compute: '_computeWorkorderCount' });
    static alternativeWorkcenterIds = Fields.Many2many('mrp.workcenter', { relation: 'mrpWorkcenterAlternativeRel', column1: 'workcenterId', column2: 'alternativeWorkcenterId', domain: "[['id', '!=', id], '|', ['companyId', '=', companyId], ['companyId', '=', false]]", string: "Alternative Workcenters", checkCompany: true, help: "Alternative workcenters that can be substituted to this one in order to dispatch production" });
    static tagIds = Fields.Many2many('mrp.workcenter.tag');

    @api.constrains('alternativeWorkcenterIds')
    async _checkAlternativeWorkcenter() {
        for (const workcenter of this) {
            if ((await workcenter.alternativeWorkcenterIds).includes(workcenter)) {
                throw new ValidationError(await this._t("Workcenter %s cannot be an alternative of itself.", await workcenter.label));
            }
        }
    }

    @api.depends('orderIds.durationExpected', 'orderIds.workcenterId', 'orderIds.state', 'orderIds.datePlannedStart')
    async _computeWorkorderCount() {
        const MrpWorkorder = this.env.items('mrp.workorder');
        const result = Object.fromEntries(this._ids.map(wid => [wid, {}]));
        const resultDurationExpected = Object.fromEntries(this._ids.map(wid => [wid, 0]));
        // Count Late Workorder
        const data = await MrpWorkorder.readGroup(
            [['workcenterId', 'in', this.ids], ['state', 'in', ['pending', 'waiting', 'ready']], ['datePlannedStart', '<', toFormat(new Date(), '%Y-%m-%d')]],
            ['workcenterId'], ['workcenterId']);
        const countData = Object.fromEntries(data.map(item => [item['workcenterId'][0], item['workcenterId_count']]));
        // Count All, Pending, Ready, Progress Workorder
        const res = await MrpWorkorder.readGroup(
            [['workcenterId', 'in', this.ids]],
            ['workcenterId', 'state', 'durationExpected'], ['workcenterId', 'state'],
            { lazy: false });
        for (const resGroup of res) {
            result[resGroup['workcenterId'][0]][resGroup['state']] = resGroup['__count'];
            if (['pending', 'waiting', 'ready', 'progress'].includes(resGroup['state'])) {
                resultDurationExpected[resGroup['workcenterId'][0]] += resGroup['durationExpected'];
            }
        }

        for (const workcenter of this) {
            await workcenter.set('workorderCount', sum(Object.values(Object.entries(result[workcenter.id]).filter(([state]) => !['done', 'cancel'].includes(state)))));
            await workcenter.set('workorderPendingCount', result[workcenter.id]['pending'] ?? 0);
            await workcenter.set('workcenterLoad', resultDurationExpected[workcenter.id]);
            await workcenter.set('workorderReadyCount', result[workcenter.id]['ready'] ?? 0);
            await workcenter.set('workorderProgressCount', result[workcenter.id]['progress'] ?? 0);
            await workcenter.set('workorderLateCount', countData[workcenter.id] ?? 0);
        }
    }

    @api.depends('timeIds', 'timeIds.dateEnd', 'timeIds.lossType')
    async _computeWorkingState() {
        for (const workcenter of this) {
            // We search for a productivity line associated to this workcenter having no `dateEnd`.
            // If we do not find one, the workcenter is not currently being used. If we find one, according
            // to its `typeLoss`, the workcenter is either being used or blocked.
            const timeLog = await this.env.items('mrp.workcenter.productivity').search([
                ['workcenterId', '=', workcenter.id],
                ['dateEnd', '=', false]
            ], { limit: 1 });
            if (!bool(timeLog)) {
                // the workcenter is not being used
                await workcenter.set('workingState', 'normal');
            }
            else if (['productive', 'performance'].includes(timeLog.lossType)) {
                // the productivity line has a `lossType` that means the workcenter is being used
                await workcenter.set('workingState', 'done');
            }
            else {
                // the workcenter is blocked
                await workcenter.set('workingState', 'blocked');
            }
        }
    }

    async _computeBlockedTime() {
        // TDE FIXME: productivity loss type should be only losses, probably count other time logs differently ??
        const data = await this.env.items('mrp.workcenter.productivity').readGroup([
            ['dateStart', '>=', _Datetime.toString(subDate(new Date(), { months: 1 }))],
            ['workcenterId', 'in', this.ids],
            ['dateEnd', '!=', false],
            ['lossType', '!=', 'productive']],
            ['duration', 'workcenterId'], ['workcenterId'], { lazy: false });
        const countData = Object.fromEntries(data.map(item => [item['workcenterId'][0], item['duration']]));
        for (const workcenter of this) {
            await workcenter.set('blockedTime', (countData[workcenter.id] ?? 0.0) / 60.0);
        }
    }

    async _computeProductiveTime() {
        // TDE FIXME: productivity loss type should be only losses, probably count other time logs differently
        const data = await this.env.items('mrp.workcenter.productivity').readGroup([
            ['dateStart', '>=', _Datetime.toString(subDate(new Date(), { months: 1 }))],
            ['workcenterId', 'in', this.ids],
            ['dateEnd', '!=', false],
            ['lossType', '=', 'productive']],
            ['duration', 'workcenterId'], ['workcenterId'], { lazy: false });
        const countData = Object.fromEntries(data.map(item => [item['workcenterId'][0], item['duration']]));
        for (const workcenter of this) {
            await workcenter.set('productiveTime', (countData[workcenter.id] ?? 0.0) / 60.0);
        }
    }

    @api.depends('blockedTime', 'productiveTime')
    async _computeOee() {
        for (const order of this) {
            if (await order.productiveTime) {
                await order.set('oee', floatRound(await order.productiveTime * 100.0 / (await order.productiveTime + await order.blockedTime), 2));
            }
            else {
                await order.set('oee', 0.0);
            }
        }
    }

    async _computePerformance() {
        const woData = await this.env.items('mrp.workorder').readGroup([
            ['dateStart', '>=', _Datetime.toString(subDate(new Date(), { months: 1 }))],
            ['workcenterId', 'in', this.ids],
            ['state', '=', 'done']], ['durationExpected', 'workcenterId', 'duration'], ['workcenterId'], { lazy: false });
        const durationExpected = Object.fromEntries(woData.map(data => [data['workcenterId'][0], data['durationExpected']]));
        const duration = Object.fromEntries(woData.map(data => [data['workcenterId'][0], data['duration']]));
        for (const workcenter of this) {
            if (duration[workcenter.id]) {
                await workcenter.set('performance', 100 * (durationExpected[workcenter.id] ?? 0.0) / duration[workcenter.id]);
            }
            else {
                await workcenter.set('performance', 0.0);
            }
        }
    }

    @api.constrains('capacity')
    async _checkCapacity() {
        if (await this.some(async (workcenter) => await workcenter.capacity <= 0.0)) {
            throw new UserError(await this._t('The capacity must be strictly positive.'));
        }
    }

    async unblock() {
        this.ensureOne();
        if (await this['workingState'] != 'blocked') {
            throw new UserError(await this._t("It has already been unblocked."));
        }
        const times = await this.env.items('mrp.workcenter.productivity').search([['workcenterId', '=', this.id], ['dateEnd', '=', false]]);
        await times.write({ 'dateEnd': _Datetime.now() });
        return { 'type': 'ir.actions.client', 'tag': 'reload' }
    }

    @api.modelCreateMulti()
    async create(valsList) {
        // resource_type is 'human' by default. As we are not living in
        // /r/latestagecapitalism, workcenters are 'material'
        return _super(MrpWorkcenter, await this.withContext({ default_resourceType: 'material' })).create(valsList);
    }

    async write(vals) {
        if ('companyId' in vals) {
            await (await this['resourceId']).set('companyId', vals['companyId']);
        }
        return _super(MrpWorkcenter, this).write(vals);
    }

    async actionShowOperations() {
        this.ensureOne();
        const action = await this.env.items('ir.actions.actions')._forXmlid('mrp.mrpRoutingAction');
        action['domain'] = [['workcenterId', '=', this.id]];
        action['context'] = {
            'default_workcenterId': this.id,
        }
        return action;
    }

    async actionWorkOrder() {
        const action = await this.env.items("ir.actions.actions")._forXmlid("mrp.actionWorkOrders");
        return action;
    }

    /**
     * Get the unavailabilities intervals for the workcenters in `self`.

        Return the list of unavailabilities (a tuple of datetimes) indexed
        by workcenter id.

     * @param startDatetime filter unavailability with only slots after this startDatetime
     * @param endDatetime filter unavailability with only slots before this endDatetime
     * @returns []{}
     */
    async _getUnavailabilityIntervals(startDatetime, endDatetime) {
        const unavailabilityRessources = await (await this['resourceId'])._getUnavailableIntervals(startDatetime, endDatetime);
        const res = {}
        for (const wc of this) {
            res[wc.id] = unavailabilityRessources[(await wc.resourceId).id] ?? [];
        }
        return res;
    }

    /**
     * Get the first available interval for the workcenter in `self`.

        The available interval is disjoinct with all other workorders planned on this workcenter, but
        can overlap the time-off of the related calendar (inverse of the working hours).
        Return the first available interval (start datetime, end datetime) or,
        if there is none before 700 days, a tuple error (False, 'error message').

     * @param startDatetime begin the search at this datetime
     * @param duration minutes needed to make the workorder (float)
     * @returns []
     */
    async _getFirstAvailableSlot(startDatetime, duration) {
        this.ensureOne();
        let revert;
        [startDatetime, revert] = makeAware(startDatetime);

        const [resource, resourceCalendar] = await this('resourceId', 'resourceCalendarId');
        const getAvailableIntervals = partial2(resourceCalendar._workIntervalsBatch.bind(resourceCalendar), resource, [['timeType', 'in', ['other', 'leave']]], timezone(await resourceCalendar.tz));
        const getWorkorderIntervals = partial2(resourceCalendar._leaveIntervalsBatch.bind(resourceCalendar), resource, [['timeType', '=', 'other']], timezone(await resourceCalendar.tz));

        let remaining = duration,
            startInterval = startDatetime,
            delta = { days: 14 }

        for (const n of range(50)) { // 50 * 14 = 700 days in advance (hardcoded)
            const dt = addDate(startDatetime, Object.fromEntries(Object.entries(delta).map(([k, v]) => [k, v * n])));
            const availableIntervals = (await getAvailableIntervals(dt, addDate(dt, delta)))[resource.id];
            const workorderIntervals = (await getWorkorderIntervals(dt, addDate(dt, delta)))[resource.id];
            for (const [start, stop, dummy] of availableIntervals) {
                // Shouldn't loop more than 2 times because the availableIntervals contains the workorderIntervals
                // And remaining == duration can only occur at the first loop and at the interval intersection (cannot happen several time because availableIntervals > workorderIntervals
                for (const i of range(2)) {
                    const intervalMinutes = diffDate(stop, start, 'second').seconds / 60;
                    // If the remaining minutes has never decrease update start_interval
                    if (remaining == duration) {
                        startInterval = start;
                    }
                    // If there is a overlap between the possible available interval and a others WO
                    if (bool((new Intervals([[startInterval, addDate(start, { minutes: Math.min(remaining, intervalMinutes) }), dummy]])).and(workorderIntervals))) {
                        remaining = duration;
                    }
                    else if (floatCompare(intervalMinutes, remaining, { precisionDigits: 3 }) >= 0) {
                        return [revert(startInterval), revert(addDate(start, { minutes: remaining }))];
                    }
                    else {
                        // Decrease a part of the remaining duration
                        remaining -= intervalMinutes;
                        // Go to the next available interval because the possible current interval duration has been used
                        break;
                    }
                }
            }
        }
        return [false, 'Not available slot 700 days after the planned start'];
    }

    async actionArchive() {
        const res = await _super(MrpWorkcenter, this).actionArchive();
        const filteredWorkcenters = ((await this.filtered('routingLineIds')).map(async (workcenter) => workcenter.label)).join(', ');
        if (filteredWorkcenters) {
            return {
                'type': 'ir.actions.client',
                'tag': 'displayNotification',
                'params': {
                    'title': await this._t("Note that archived work center(s): '%s' is/are still linked to active Bill of Materials, which means that operations can still be planned on it/them. \
                           To prevent this, deletion of the work center is recommended instead.", filteredWorkcenters),
                    'type': 'warning',
                    'sticky': true,  // true/false will display for few seconds if false
                    'next': { 'type': 'ir.actions.actwindow.close' },
                },
            }
        }
        return res;
    }
}

@MetaModel.define()
class WorkcenterTag extends Model {
    static _module = module;
    static _name = 'mrp.workcenter.tag';
    static _description = 'Add tag for the workcenter';
    static _order = 'label';

    async _getDefaultColor() {
        return randomInt(1, 11);
    }

    static label = Fields.Char("Tag Name", { required: true });
    static color = Fields.Integer("Color Index", { default: self => self._getDefaultColor() });

    static _sqlConstraints = [
        ['tagLabelUnique', 'unique(label)',
            'The tag label must be unique.'],
    ];
}

@MetaModel.define()
class MrpWorkcenterProductivityLossType extends Model {
    static _module = module;
    static _name = "mrp.workcenter.productivity.loss.type";
    static _description = 'MRP Workorder productivity losses';
    static _recName = 'lossType';

    /**
     * As 'category' field in form view is a Many2one, its value will be in
        lower case. In order to display its value capitalized 'nameGet' is
        overrided.
     * @returns 
     */
    @api.depends('lossType')
    async nameGet() {
        const result = [];
        for (const rec of this) {
            result.push([rec.id, (await rec.lossType).title()]);
        }
        return result;
    }

    static lossType = Fields.Selection([
        ['availability', 'Availability'],
        ['performance', 'Performance'],
        ['quality', 'Quality'],
        ['productive', 'Productive']], { string: 'Category', default: 'availability', required: true });
}

@MetaModel.define()
class MrpWorkcenterProductivityLoss extends Model {
    static _module = module;
    static _name = "mrp.workcenter.productivity.loss";
    static _description = "Workcenter Productivity Losses";
    static _order = "sequence, id";

    static label = Fields.Char('Blocking Reason', { required: true });
    static sequence = Fields.Integer('Sequence', { default: 1 });
    static manual = Fields.Boolean('Is a Blocking Reason', { default: true });
    static lossId = Fields.Many2one('mrp.workcenter.productivity.loss.type', { domain: ([['lossType', 'in', ['quality', 'availability']]]), string: 'Category' });
    static lossType = Fields.Selection({ string: 'Effectiveness Category', related: 'lossId.lossType', store: true, readonly: false });
}

@MetaModel.define()
class MrpWorkcenterProductivity extends Model {
    static _module = module;
    static _name = "mrp.workcenter.productivity";
    static _description = "Workcenter Productivity Log";
    static _order = "id desc";
    static _recName = "lossId";
    static _checkCompanyAuto = true;

    async _getDefaultCompanyId() {
        let companyId: any = false;
        let workorder, workcenter;
        if (this.env.context['default_companyId']) {
            companyId = this.env.context['default_companyId'];
        }
        if (!bool(companyId) && this.env.context['default_workorderId']) {
            workorder = this.env.items('mrp.workorder').browse(this.env.context['default_workorderId']);
            companyId = await workorder.companyId;
        }
        if (!bool(companyId) && this.env.context['default_workcenterId']) {
            workcenter = this.env.items('mrp.workcenter').browse(this.env.context['default_workcenterId']);
            companyId = await workcenter.companyId;
        }
        if (!bool(companyId)) {
            companyId = await this.env.company();
        }
        return companyId;
    }

    static productionId = Fields.Many2one('mrp.production', { string: 'Manufacturing Order', related: 'workorderId.productionId', readonly: true });
    static workcenterId = Fields.Many2one('mrp.workcenter', { string: "Work Center", required: true, checkCompany: true, index: true });
    static companyId = Fields.Many2one('res.company', { required: true, index: true, default: (self) => self._getDefaultCompanyId() });
    static workorderId = Fields.Many2one('mrp.workorder', { string: 'Work Order', checkCompany: true, index: true });
    static userId = Fields.Many2one('res.users', { string: "User", default: (self) => self.env.uid });
    static lossId = Fields.Many2one('mrp.workcenter.productivity.loss', { string: "Loss Reason", ondelete: 'RESTRICT', required: true });
    static lossType = Fields.Selection({ string: "Effectiveness", related: 'lossId.lossType', store: true, readonly: false });
    static description = Fields.Text('Description');
    static dateStart = Fields.Datetime('Start Date', { default: () => _Datetime.now(), required: true });
    static dateEnd = Fields.Datetime('End Date');
    static duration = Fields.Float('Duration', { compute: '_computeDuration', store: true });

    @api.depends('dateEnd', 'dateStart')
    async _computeDuration() {
        for (const blocktime of this) {
            if (await blocktime.dateStart && await blocktime.dateEnd) {
                const d1 = _Datetime.toDatetime(await blocktime.dateStart) as Date;
                const d2 = _Datetime.toDatetime(await blocktime.dateEnd) as Date;
                const diff = diffDate(d2, d1, 'seconds');
                if (!['productive', 'performance'].includes(await blocktime.lossType) && bool(await (await blocktime.workcenterId).resourceCalendarId)) {
                    const r = (await (await blocktime.workcenterId)._getWorkDaysDataBatch(d1, d2))[(await blocktime.workcenterId).id]['hours'];
                    await blocktime.set('duration', floatRound(r * 60, 2));
                }
                else {
                    await blocktime.set('duration', floatRound(diff.seconds / 60.0, 2));
                }
            }
            else {
                await blocktime.set('duration', 0.0);
            }
        }
    }

    @api.constrains('workorderId')
    async _checkOpenTimeIds() {
        for (const workorder of await this['workorderId']) {
            const openTimeIdsByUser = await this.env.items("mrp.workcenter.productivity").readGroup([["id", "in", (await workorder.timeIds).ids], ["dateEnd", "=", false]], ["userId", "openTimeIds_count:count(id)"], ["userId"]);
            if (openTimeIdsByUser.some(data => data["openTimeIds_count"] > 1)) {
                throw new ValidationError(await this._t('The Workorder (%s) cannot be started twice!', await workorder.displayName));
            }
        }
    }

    async buttonBlock() {
        this.ensureOne();
        await (await (await this['workcenterId']).orderIds).endAll();
    }
}
