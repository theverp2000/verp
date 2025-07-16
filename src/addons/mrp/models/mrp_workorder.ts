import { _Date, _Datetime, api, Fields } from "../../../core";
import { DefaultDict, MapKey, UserError } from "../../../core/helper";
import { _super, MetaModel, Model } from "../../../core/models"
import { _f2, addDate, bool, f, floatCompare, floatRound, formatDatetime, len, stringify, subDate, sum, update } from "../../../core/tools";

@MetaModel.define()
class MrpWorkorder extends Model {
    static _module = module;
    static _name = 'mrp.workorder';
    static _description = 'Work Order';

    async _readGroupWorkcenterId(workcenters, domain, order) {
        let workcenterIds = this.env.context['default_workcenterId'];
        if (!bool(workcenterIds)) {
            workcenterIds = await workcenters._search([], {order: order, accessRightsUid: global.SUPERUSER_ID});
        }
        return workcenters.browse(workcenterIds);
    }
    
    static label = Fields.Char('Work Order', {required: true, states: {'done': [['readonly', true]], 'cancel': [['readonly', true]]}});
    static workcenterId = Fields.Many2one('mrp.workcenter', {string: 'Work Center', required: true,
        states: {'done': [['readonly', true]], 'cancel': [['readonly', true]], 'progress': [['readonly', true]]},
        groupExpand: '_readGroupWorkcenterId', checkCompany: true});
    static workingState = Fields.Selection({string: 'Workcenter Status', related: 'workcenterId.workingState',
        help: 'Technical: used in views only'});
    static productId = Fields.Many2one({related: 'productionId.productId', readonly: true, store: true, checkCompany: true});
    static productTracking = Fields.Selection({related: "productId.tracking"});
    static productUomId = Fields.Many2one('uom.uom', {string: 'Unit of Measure', required: true, readonly: true});
    static productionId = Fields.Many2one('mrp.production', {string: 'Manufacturing Order', required: true, checkCompany: true, readonly: true});
    static productionAvailability = Fields.Selection({string: 'Stock Availability', readonly: true, related: 'productionId.reservationState', store: true, help: 'Technical: used in views and domains only.'});
    static productionState = Fields.Selection({string: 'Production State', readonly: true, related: 'productionId.state',
        help: 'Technical: used in views only.'});
    static productionBomId = Fields.Many2one('mrp.bom', {related: 'productionId.bomId'});
    static qtyProduction = Fields.Float('Original Production Quantity', {readonly: true, related: 'productionId.productQty'});
    static companyId = Fields.Many2one({related: 'productionId.companyId'});
    static qtyProducing = Fields.Float({compute: '_computeQtyProducing', inverse: '_setQtyProducing',
        string: 'Currently Produced Quantity', digits: 'Product Unit of Measure'});
    static qtyRemaining = Fields.Float('Quantity To Be Produced', {compute: '_computeQtyRemaining', digits: 'Product Unit of Measure'});
    static qtyProduced = Fields.Float('Quantity', {default: 0.0, readonly: true, digits: 'Product Unit of Measure',copy: false, help: "The number of products already handled by this work order"});
    static isProduced = Fields.Boolean({string: "Has Been Produced", compute: '_computeIsProduced'});
    static state = Fields.Selection([
        ['pending', 'Waiting for another WO'],
        ['waiting', 'Waiting for components'],
        ['ready', 'Ready'],
        ['progress', 'In Progress'],
        ['done', 'Finished'],
        ['cancel', 'Cancelled']], 
        {string: 'Status', compute: '_computeState', store: true,
        default: 'pending', copy: false, readonly: true, index: true});
    static leaveId = Fields.Many2one('resource.calendar.leaves', {help: 'Slot into workcenter calendar once planned',
        checkCompany: true, copy: false});
    static datePlannedStart = Fields.Datetime('Scheduled Start Date', {compute: '_computeDatesPlanned', inverse: '_setDatesPlanned', states: {'done': [['readonly', true]], 'cancel': [['readonly', true]]}, store: true, copy: false});
    static datePlannedFinished = Fields.Datetime('Scheduled End Date', {compute: '_computeDatesPlanned', inverse: '_setDatesPlanned', states: {'done': [['readonly', true]], 'cancel': [['readonly', true]]}, store: true, copy: false});
    static dateStart = Fields.Datetime('Start Date', {copy: false, states: {'done': [['readonly', true]], 'cancel': [['readonly', true]]}});
    static dateFinished = Fields.Datetime('End Date', {copy: false, states: {'done': [['readonly', true]], 'cancel': [['readonly', true]]}});

    static durationExpected = Fields.Float('Expected Duration', {digits: [16, 2], default: 60.0, states: {'done': [['readonly', true]], 'cancel': [['readonly', true]]}, help: "Expected duration (in minutes)"});
    static duration = Fields.Float('Real Duration', {compute: '_computeDuration', inverse: '_setDuration', readonly: false, store: true, copy: false});
    static durationUnit = Fields.Float('Duration Per Unit', {compute: '_computeDuration', groupOperator: "avg", readonly: true, store: true});
    static durationPercent = Fields.Integer('Duration Deviation (%)', {compute: '_computeDuration',
        groupOperator: "avg", readonly: true, store: true});
    static progress = Fields.Float('Progress Done (%)', {digits: [16, 2], compute: '_computeProgress'});

    static operationId = Fields.Many2one('mrp.routing.workcenter', {string: 'Operation', checkCompany: true});
        // Should be used differently as BoM can change in the meantime
    static worksheet = Fields.Binary('Worksheet', {related: 'operationId.worksheet', readonly: true});
    static worksheetType = Fields.Selection({string: 'Worksheet Type', related: 'operationId.worksheetType', readonly: true});
    static worksheetGoogleSlide = Fields.Char('Worksheet URL', {related: 'operationId.worksheetGoogleSlide', readonly: true});
    static operationNote = Fields.Html("Description", {related: 'operationId.note', readonly: true});
    static moveRawIds = Fields.One2many('stock.move', 'workorderId', {string: 'Raw Moves',
        domain: [['rawMaterialProductionId', '!=', false], ['productionId', '=', false]]});
    static moveFinishedIds = Fields.One2many('stock.move', 'workorderId', {string: 'Finished Moves',
        domain: [['rawMaterialProductionId', '=', false], ['productionId', '!=', false]]});
    static moveLineIds = Fields.One2many('stock.move.line', 'workorderId', {string: 'Moves to Track',
        help: "Inventory moves for which you must scan a lot number at this work order"});
    static finishedLotId = Fields.Many2one('stock.production.lot', {string: 'Lot/Serial Number', compute: '_computeFinishedLotId', inverse: '_setFinishedLotId', domain: "[['productId', '=', productId], ['companyId', '=', companyId]]", checkCompany: true, search: '_searchFinishedLotId'});
    static timeIds = Fields.One2many('mrp.workcenter.productivity', 'workorderId', {copy: false});
    static isUserWorking = Fields.Boolean('Is the Current User Working', {compute: '_computeWorkingUsers',
        help: "Technical field indicating whether the current user is working."});
    static workingUserIds = Fields.One2many('res.users', {string: 'Working user on this work order.', compute: '_computeWorkingUsers'});
    static lastWorkingUserId = Fields.One2many('res.users', {string: 'Last user that worked on this work order.', compute: '_computeWorkingUsers'});
    static costsHour = Fields.Float({string: 'Cost per hour', help: 'Technical field to store the hourly cost of workcenter at time of work order completion (i.e. to keep a consistent cost).', default: 0.0, groupOperator: "avg"});

    static nextWorkOrderId = Fields.Many2one('mrp.workorder', {string: "Next Work Order", checkCompany: true});
    static scrapIds = Fields.One2many('stock.scrap', 'workorderId');
    static scrapCount = Fields.Integer({compute: '_computeScrapMoveCount', string: 'Scrap Move'});
    static productionDate = Fields.Datetime('Production Date', {related: 'productionId.datePlannedStart', store: true});
    static jsonPopover = Fields.Char('Popover Data JSON', {compute: '_computeJsonPopover'});
    static showJsonPopover = Fields.Boolean('Show Popover?', {compute: '_computeJsonPopover'});
    static consumption = Fields.Selection({related: 'productionId.consumption'});

    @api.depends('productionAvailability')
    async _computeState() {
        // Force the flush of the production_availability, the wo state is modify in the _compute_reservation_state
        // It is a trick to force that the state of workorder is computed as the end of the
        // cyclic depends with the mo.state, mo.reservationState and wo.state
        for (const workorder of this) {
            if (!['waiting', 'ready'].includes(workorder.state)) {
                continue;
            }
            const production = await workorder.productionId;
            if (!['waiting', 'confirmed', 'assigned'].includes(await production.reservationState)) {
                continue;
            }
            if (await production.reservationState == 'assigned' && await workorder.state == 'waiting') {
                await workorder.set('state', 'ready');
            }
            else if (await production.reservationState != 'assigned' && await workorder.state == 'ready') {
                await workorder.set('state', 'waiting');
            }
        }
    }

    @api.depends('productionState', 'datePlannedStart', 'datePlannedFinished')
    async _computeJsonPopover() {
        const previousWoData = await this.env.items('mrp.workorder').readGroup(
            [['nextWorkOrderId', 'in', this.ids]],
            ['ids:array_agg(id)', 'datePlannedStart:max', 'datePlannedFinished:max'],
            ['nextWorkOrderId']);
        const previousWoDict = Object.fromEntries(previousWoData.map(x => [x['nextWorkOrderId'][0], {
            'id': x['ids'][0],
            'datePlannedStart': x['datePlannedStart'],
            'datePlannedFinished': x['datePlannedFinished']
        }]));
        let conflictedDict;
        if (bool(this.ids)) {
            conflictedDict = await this._getConflictedWorkorderIds();
        }
        for (const wo of this) {
            const infos = [];
            if (!await wo.datePlannedStart || !await wo.datePlannedFinished || !bool(wo.ids)) {
                await wo.set('showJsonPopover', false);
                await wo.set('jsonPopover', false);
                continue;
            }
            if (['pending', 'waiting', 'ready'].includes(wo.state)) {
                const previousWo = previousWoDict[wo.id];
                const prevStart = previousWo && previousWo['datePlannedStart'] || false;
                const prevFinished = previousWo && previousWo['datePlannedFinished'] || false;
                if (await wo.state == 'pending' && prevStart && !(prevStart > await wo.datePlannedStart)) {
                    infos.push({
                        'color': 'text-primary',
                        'msg': _f2(await this._t("Waiting the previous work order, planned from %(start)s to %(end)s"), {
                            start: await formatDatetime(this.env, prevStart), //, null, false),
                            end: await formatDatetime(this.env, prevFinished), // null, false)
                        })
                    });
                }
                if (await wo.datePlannedFinished < _Datetime.now()) {
                    infos.push({
                        'color': 'text-warning',
                        'msg': await this._t("The work order should have already been processed.")
                    });
                }
                if (prevStart && prevStart > await wo.datePlannedStart) {
                    infos.push({
                        'color': 'text-danger',
                        'msg': _f2(await this._t("Scheduled before the previous work order, planned from %(start)s to %(end)s"), {
                            start: await formatDatetime(this.env, prevStart), //, null, false),
                            end: await formatDatetime(this.env, prevFinished) //, null, false)
                        })
                    });
                }
                if (conflictedDict[wo.id]) {
                    infos.push({
                        'color': 'text-danger',
                        'msg': await this._t("Planned at the same time as other workorder(s) at %s", await (await wo.workcenterId).displayName)
                    });
                }
            }
            const colorIcon = bool(infos) && infos.slice(-1)[0]['color'] || false;
            await wo.set('showJsonPopover', bool(colorIcon));
            await wo.set('jsonPopover', stringify({
                'infos': infos,
                'color': colorIcon,
                'icon': ['text-warning', 'text-danger'].includes(colorIcon) ? 'fa-exclamation-triangle' : 'fa-info-circle',
                'replan': ![false, 'text-primary'].includes(colorIcon)
            }));
        }
    }

    @api.depends('productionId.lotProducingId')
    async _computeFinishedLotId() {
        for (const workorder of this) {
            await workorder.set('finishedLotId', await (await workorder.productionId).lotProducingId);
        }
    }

    async _searchFinishedLotId(operator, value) {
        return [['productionId.lotProducingId', operator, value]];
    }

    async _setFinishedLotId() {
        for (const workorder of this) {
            await (await workorder.productionId).set('lotProducingId', await workorder.finishedLotId);
        }
    }

    @api.depends('productionId.qtyProducing')
    async _computeQtyProducing() {
        for (const workorder of this) {
            await workorder.set('qtyProducing', await (await workorder.productionId).qtyProducing);
        }
    }

    async _setQtyProducing() {
        for (const workorder of this) {
            const [production, qtyProducing] = await workorder('productionId', 'qtyProducing');
            if (qtyProducing != 0 && await production.qtyProducing != qtyProducing) {
                await production.set('qtyProducing', qtyProducing);
                await production._setQtyProducing();
            }
        }
    }

    // Both `datePlannedStart` and `datePlannedFinished` are related fields on `leaveId`. Let's say
    // we slide a workorder on a gantt view, a single call to write is made with both
    // fields Changes. As the ORM doesn't batch the write on related fields and instead
    // makes multiple call, the constraint checkDates() is raised.
    // That's why the compute and set methods are needed. to ensure the dates are updated
    // in the same time.
    @api.depends('leaveId')
    async _computeDatesPlanned() {
        for (const workorder of this) {
            await workorder.set('datePlannedStart', await (await workorder.leaveId).dateFrom);
            await workorder.set('datePlannedFinished', await (await workorder.leaveId).dateTo);
        }
    }

    async _setDatesPlanned() {
        if (!await this[0].datePlannedStart || ! await this[0].datePlannedFinished) {
            if (!bool(await this['leaveId'])) {
                return;
            }
            throw new UserError(await this._t("It is not possible to unplan one single Work Order. \
                              You should unplan the Manufacturing Order instead in order to unplan all the linked operations."));
        }
        let dateFrom = await this[0].datePlannedStart,
        dateTo = await this[0].datePlannedFinished,
        toWrite = this.env.items('mrp.workorder');
        for (const wo of await this.sudo()) {
            if (bool(await wo.leaveId)) {
                toWrite = toWrite.or(wo);
            }
            else {
                await wo.set('leaveId', await wo.env.items('resource.calendar.leaves').create({
                    'label': await wo.displayName,
                    'calendarId': (await (await wo.workcenterId).resourceCalendarId).id,
                    'dateFrom': dateFrom,
                    'dateTo': dateTo,
                    'resourceId': (await (await wo.workcenterId).resourceId).id,
                    'timeType': 'other',
                }));
            }
        }
        await (await toWrite.leaveId).write({
            'dateFrom': dateFrom,
            'dateTo': dateTo,
        });
    }

    async nameGet() {
        const res = [];
        for (const wo of this) {
            const production = await wo.productionId;
            if (len(await production.workorderIds) == 1) {
                res.push([wo.id, f("%s - %s - %s", await production.label, await (await wo.productId).label, await wo.label)]);
            }
            else {
                res.push([wo.id, f("%s - %s - %s - %s", (await production.workorderIds).ids.indexOf(wo._origin.id) + 1, await production.label, await (await wo.productId).label, await wo.label)]);
            }
        }
        return res;
    }

    async unlink() {
        // Removes references to workorder to avoid Validation Error
        await (await this.mapped('moveRawIds')).or(await this.mapped('moveFinishedIds')).write({'workorderId': false});
        await (await this.mapped('leaveId')).unlink();
        const moDirty = await (await this['productionId']).filtered(async (mo) => ["confirmed", "progress", "toClose"].includes(await mo.state));

        const previousWos = await this.env.items('mrp.workorder').search([
            ['nextWorkOrderId', 'in', this.ids],
            ['id', 'not in', this.ids]
        ]);
        for (const pw of previousWos) {
            const nextWorkOrder = await pw.nextWorkOrderId;
            while (bool(nextWorkOrder) && this.includes(nextWorkOrder)) {
                await pw.set('nextWorkOrderId', await nextWorkOrder.nextWorkOrderId);
            }
        }
        const res = await _super(MrpWorkorder, this).unlink();
        // We need to go through `_actionConfirm` for all workorders of the current productions to
        // make sure the links between them are correct (`nextWorkOrderId` could be obsolete now).
        await (await moDirty.workorderIds)._actionConfirm();
        return res;
    }

    @api.depends('productionId.productQty', 'qtyProduced', 'productionId.productUomId')
    async _computeIsProduced() {
        await this.set('isProduced', false);
        for (const order of await this.filtered(async (p) => bool(await p.productionId) && bool(await (await p.productionId).productUomId))) {
            const rounding = await (await (await order.productionId).productUomId).rounding;
            await order.set('isProduced', floatCompare(await order.qtyProduced, await (await order.productionId).productQty, {precisionRounding: rounding}) >= 0);
        }
    }

    @api.depends('timeIds.duration', 'qtyProduced')
    async _computeDuration() {
        for (const order of this) {
            await order.set('duration', sum(await (await order.timeIds).mapped('duration')));
            await order.set('durationUnit', floatRound(await order.duration / Math.max(await order.qtyProduced, 1), 2));  // rounding 2 because it is a time
            if (await order.durationExpected) {
                await order.set('durationPercent', Math.max(-2147483648, Math.min(2147483647, 100 * (await order.durationExpected - await order.duration) / await order.durationExpected)));
            }
            else {
                await order.set('durationPercent', 0);
            }
        }
    }

    async _setDuration() {

        function _floatDurationToSecond(duration) {
            const minutes = Math.floor(duration),
            seconds = (duration % 1) * 60;
            return minutes * 60 + seconds;
        }

        for (const order of this) {
            const oldOrderDuation = sum(await (await order.timeIds).mapped('duration'));
            const newOrderDuration = await order.duration;
            if (newOrderDuration == oldOrderDuation) {
                continue;
            }

            const deltaDuration = newOrderDuration - oldOrderDuation;

            if (deltaDuration > 0) {
                const dateStart = subDate(new Date(), {seconds: _floatDurationToSecond(deltaDuration)});
                await this.env.items('mrp.workcenter.productivity').create(
                    await order._prepareTimelineVals(deltaDuration, dateStart, new Date())
                );
            }
            else {
                let durationToRemove = Math.abs(deltaDuration);
                const timelines = await (await order.timeIds).sorted(t => t.dateStart);
                let timelinesToUnlink = this.env.items('mrp.workcenter.productivity');
                for (const timeline of timelines) {
                    if (durationToRemove <= 0.0) {
                        break;
                    }
                    if (await timeline.duration <= durationToRemove) {
                        durationToRemove -= await timeline.duration;
                        timelinesToUnlink = timelinesToUnlink.or(timeline);
                    }
                    else {
                        const newTimeLineDuration = await timeline.duration - durationToRemove;
                        await timeline.set('dateStart', subDate(await timeline.dateEnd, {seconds: _floatDurationToSecond(newTimeLineDuration)}));
                        break;
                    }
                }
                await timelinesToUnlink.unlink();
            }
        }
    }

    @api.depends('duration', 'durationExpected', 'state')
    async _computeProgress() {
        for (const order of this) {
            if (await order.state == 'done') {
                await order.set('progress', 100);
            }
            else if (await order.durationExpected) {
                await order.set('progress', await order.duration * 100 / await order.duration_expectedC);
            }
            else {
                await order.set('progress', 0);
            }
        }
    }

    /**
     * Checks whether the current user is working, all the users currently working and the last user that worked.
     */
    async _computeWorkingUsers() {
        for (const order of this) {
            await order.set('workingUserIds', await (await (await (await (await order.timeIds).filtered(async (time) => ! await time.dateEnd)).sorted('dateStart')).mapped('userId')).map(order => [4, order.id]));
            if (bool(await order.workingUserIds)) {
                await order.set('lastWorkingUserId', (await order.workingUserIds)[-1]);
            }
            else if (bool(await order.timeIds)) {
                await order.set('lastWorkingUserId', bool(await (await order.timeIds).filtered('dateEnd')) ? await (await (await (await (await order.timeIds).filtered('dateEnd')).sorted('dateEnd'))[-1]).userId : await (await order.timeIds)[-1].userId);
            }
            else {
                await order.set('lastWorkingUserId', false);
            }
            if (bool(await (await order.timeIds).filtered(async (x) => ((await x.userId).id == (await this.env.user()).id) && (! await x.dateEnd) && (['productive', 'performance'].includes(await x.lossType))))) {
                await order.set('isUserWorking', true);
            }
            else {
                await order.set('isUserWorking', false);
            }
        }
    }

    async _computeScrapMoveCount() {
        const data = await this.env.items('stock.scrap').readGroup([['workorderId', 'in', this.ids]], ['workorderId'], ['workorderId']);
        const countData = Object.fromEntries(data.map(item => [item['workorderId'][0], item['workorderId_count']]));
        for (const workorder of this) {
            await workorder.set('scrapCount', countData[workorder.id] ?? 0);
        }
    }

    @api.onchange('operationId')
    async _onchangeOperationId() {
        const operation = await this['operationId'];
        if (bool(operation)) {
            await this.set('label', await operation.label);
            await this.set('workcenterId', (await operation.workcenterId).id);
        }
    }

    @api.onchange('datePlannedStart', 'durationExpected', 'workcenterId')
    async _onchangeDatePlannedStart() {
        if (await this['datePlannedStart'] && await this['durationExpected'] && bool(await this['workcenterId'])) {
            await this.set('datePlannedFinished', await this._calculateDatePlannedFinished());
        }
    }

    async _calculateDatePlannedFinished(datePlannedStart: any=false) {
        return (await (await this['workcenterId']).resourceCalendarId).planHours(
            await this['durationExpected'] / 60.0, datePlannedStart || await this['datePlannedStart'],
            {computeLeaves: true, domain: [['timeType', 'in', ['leave', 'other']]]}
        );
    }

    @api.onchange('datePlannedFinished')
    async _onchangeDatePlannedFinished() {
        if (await this['datePlannedStart'] && await this['datePlannedFinished'] && bool(await this['workcenterId'])) {
            await this.set('durationExpected', await this._calculateDurationExpected());
        }
    }

    async _calculateDurationExpected(datePlannedStart=false, datePlannedFinished=false) {
        const interval = await (await (await this['workcenterId']).resourceCalendarId).getWorkDurationData(
            datePlannedStart || await this['datePlannedStart'], datePlannedFinished || await this['datePlannedFinished'],
            [['timeType', 'in', ['leave', 'other']]]
        )
        return interval['hours'] * 60;
    }

    @api.onchange('operationId', 'workcenterId', 'qtyProduction')
    async _onchangeExpectedDuration() {
        await this.set('durationExpected', await this._getDurationExpected());
    }

    @api.onchange('finishedLotId')
    async _onchangeFinishedLotId() {
        const res = await (await this['productionId'])._canProduceSerialNumber(await this['finishedLotId']);
        if (res != true) {
            return res;
        }
    }

    async write(values) {
        if ('productionId' in values) {
            throw new UserError(await this._t('You cannot link this work order to another manufacturing order.'));
        }
        if ('workcenterId' in values) {
            for (const workorder of this) {
                if ((await workorder.workcenterId).id != values['workcenterId']) {
                    if (['progress', 'done', 'cancel'].includes(await workorder.state)) {
                        throw new UserError(await this._t('You cannot change the workcenter of a work order that is in progress or done.'));
                    }
                    await (await workorder.leaveId).set('resourceId', await this.env.items('mrp.workcenter').browse(values['workcenterId']).resourceId);
                }
            }
        }
        if ('datePlannedStart' in values || 'datePlannedFinished' in values) {
            for (const workorder of this) {
                const startDate = _Datetime.toDatetime(values['datePlannedStart'] ?? await workorder.datePlannedStart);
                const endDate = _Datetime.toDatetime(values['datePlannedFinished'] ?? await workorder.datePlannedFinished);
                if (startDate && endDate && startDate > endDate) {
                    throw new UserError(await this._t('The planned end date of the work order cannot be prior to the planned start date, please correct this to save the work order.'));
                }
                if (!('durationExpected' in values) && ! this.env.context['bypassDurationCalculation']) {
                    if (values['datePlannedStart'] && values['datePlannedFinished']) {
                        const computedFinishedTime = await workorder._calculateDatePlannedFinished(startDate);
                        values['datePlannedFinished'] = computedFinishedTime;
                    }
                    else if (startDate && endDate) {
                        const computedDuration = await workorder._calculateDurationExpected(startDate, endDate);
                        values['durationExpected'] = computedDuration;
                    }
                }
                // Update MO dates if the start date of the first WO or the
                // finished date of the last WO is update.
                const production = await workorder.productionId;
                if (workorder.eq((await production.workorderIds)[0]) && 'datePlannedStart' in values) {
                    if (values['datePlannedStart']) {
                        await (await production.withContext({forceDate: true})).write({
                            'datePlannedStart': _Datetime.toDatetime(values['datePlannedStart'])
                        });
                    }
                }
                if (workorder.eq((await production.workorderIds)[-1]) && 'datePlannedFinished' in values) {
                    if (values['datePlannedFinished']) {
                        await (await production.withContext({forceDate: true})).write({
                            'datePlannedFinished': _Datetime.toDatetime(values['datePlannedFinished'])
                        });
                    }
                }
            }
        }
        return _super(MrpWorkorder, this).write(values);
    }

    @api.modelCreateMulti()
    async create(values) {
        const res = await _super(MrpWorkorder, this).create(values);
        // Auto-confirm manually added workorders.
        // We need to go through `_actionConfirm` for all workorders of the current productions to
        // make sure the links between them are correct.
        if (this.env.context['skipConfirm']) {
            return res;
        }
        let toConfirm = await res.filtered(async (wo) => ["confirmed", "progress", "toClose"].includes(await (await wo.productionId).state));
        toConfirm = await (await toConfirm.productionId).workorderIds;
        await toConfirm._actionConfirm();
        return res;
    }

    async _actionConfirm() {
        const workordersByProduction = new DefaultDict(() => this.env.items('mrp.workorder'));
        for (const workorder of this) {
            const production = await workorder.productionId;
            workordersByProduction.set(production, workordersByProduction.get(production).or(workorder));
        }

        for (const [production, workorders] of workordersByProduction.items()) {
            const workordersByBom = new DefaultDict(() => this.env.items('mrp.workorder'));
            let bom = this.env.items('mrp.bom');
            const moves = (await production.moveRawIds).or(await production.moveFinishedIds);

            for (const workorder of workorders) {
                bom = await (await workorder.operationId).bomId;
                bom = bool(bom) ? bom : await (await workorder.productionId).bomId;
                const previousWorkorder = workordersByBom.get(bom).slice(-1);
                await previousWorkorder.set('nextWorkOrderId', workorder.id);
                workordersByBom.set(bom, workordersByBom.get(bom).or(workorder));

                await (await moves.filtered(async (m) => (await m.operationId).eq(await workorder.operationId))).write({
                    'workorderId': workorder.id
                });
            }

            const [explodedBoms,] = await (await production.bomId).explode(await production.productId, 1, {pickingType: await (await production.bomId).pickingTypeId});
            const boms = new MapKey();
            for (const b of explodedBoms) {
                boms.set(b[0], b[1]);
            }
            for (const move of moves) {
                if (bool(await move.workorderId)) {
                    continue;
                }
                bom = await (await move.bomLineId).bomId;
                while (bool(bom) && !workordersByBom.has(bom)) {
                    const bomData = boms.get(bom, {});
                    bom = bomData['parentLine'] && await bomData['parentLine'].bomId || false;
                }
                if (workordersByBom.has(bom)) {
                    await move.write({
                        'workorderId': workordersByBom.get(bom).slice(-1).id
                    });
                }
                else {
                    await move.write({
                        'workorderId': workordersByBom.get(await production.bomId).slice(-1).id
                    });
                }
            }

            for (const workorders of workordersByBom.values()) {
                if (bool(workorders)) {
                    continue;
                }
                if (await workorders[0].state == 'pending') {
                    await workorders[0].set('state', await workorders[0].productionAvailability == 'assigned' ? 'ready' : 'waiting');
                }
                for (const workorder of workorders) {
                    await workorder._startNextworkorder();
                }
            }
        }
    }

    async _getByproductMoveToUpdate() {
        const production = await this['productionId'];
        return (await production.moveFinishedIds).filtered(async (x) => ((await x.productId).id != (await production.productId).id) && (!['done', 'cancel'].includes(x.state)));
    }

    async _startNextworkorder() {
        if (await this['state'] == 'done') {
            let nextOrder = await this['nextWorkOrderId'];
            while (bool(nextOrder) && await nextOrder.state == 'cancel') {
                nextOrder = await nextOrder.nextWorkOrderId;
            }
            if (await nextOrder.state == 'pending') {
                await nextOrder.set('state', await nextOrder.productionAvailability == 'assigned' ? 'ready' : 'waiting');
            }
        }
    }

    /**
     * Get unavailabilities data to display in the Gantt view.
     * @param startDate 
     * @param endDate 
     * @param scale 
     * @param groupBys 
     * @param rows 
     * @returns 
     */
    @api.model()
    async ganttUnavailability(startDate, endDate, scale, groupBys?: any, rows?: any) {
        const workcenterIds = new Set();

        function traverseInplace(func, row, opts: {}={}) {
            const res = func(row, opts);
            if (bool(res)) {
                update(opts, res);
            }
            for (row of row['rows']) {
                traverseInplace(func, row, opts);
            }
        }

        function searchWorkcenterIds(row) {
            if (row['groupedBy'] && row['groupedBy'][0] == 'workcenterId' && row['resId']) {
                workcenterIds.add(row['resId']);
            }
        }

        for (const row in rows) {
            traverseInplace(searchWorkcenterIds, row);
        }

        const startDatetime = _Datetime.toDatetime(startDate),
        endDatetime = _Datetime.toDatetime(endDate),
        workcenters = this.env.items('mrp.workcenter').browse(workcenterIds);
        const unavailabilityMapping = await workcenters._getUnavailabilityIntervals(startDatetime, endDatetime);

        // Only notable interval (more than one case) is send to the front-end (avoid sending useless information)
        const cellDt = (['day', 'week'].includes(scale) && {hours: 1}) || (scale == 'month' && {days: 1}) || {days: 28};

        function addUnavailability(row, opts: {workcenterId?: any}={}) {
            if (row['groupedBy'] && row['groupedBy'][0] == 'workcenterId' && row['resId']) {
                opts.workcenterId = row['resId'];
            }
            if (bool(opts.workcenterId)) {
                const notableIntervals = unavailabilityMapping[opts.workcenterId].filter(interval => interval[1].sub(interval[0]).ge(cellDt));
                row['unavailabilities'] = notableIntervals.map(interval => {return {'start': interval[0], 'stop': interval[1]}});
                return {'workcenterId': opts.workcenterId}
            }
        }

        for (const row of rows) {
            traverseInplace(addUnavailability, row);
        }
        return rows;
    }

    async buttonStart() {
        this.ensureOne();
        const userId = (await this.env.user()).id;
        if (await (await (await this['timeIds']).filtered(async (t) => (await t.userId).id == userId)).some(async (time) => ! await time.dateEnd)) {
            return true;
        }
        // As button_start is automatically called in the new view
        if (['done', 'cancel'].includes(await this['state'])) {
            return true;
        }

        const production = await this['productionId']
        if (await production.state != 'progress') {
            await production.write({
                'dateStart': new Date(),
            });
        }

        if (await this['productTracking'] == 'serial') {
            await this.set('qtyProducing', 1.0);
        }
        else if (await this['qtyProducing'] == 0) {
            await this.set('qtyProducing', await this['qtyRemaining']);
        }

        await this.env.items('mrp.workcenter.productivity').create(
            await this._prepareTimelineVals(await this['duration'], new Date())
        )
        if (await this['state'] == 'progress') {
            return true;
        }
        let startDate = new Date();
        const vals = {
            'state': 'progress',
            'dateStart': startDate,
        }
        if (!bool(await this['leaveId'])) {
            const leave = await this.env.items('resource.calendar.leaves').create({
                'label': await this['displayName'],
                'calendarId': (await (await this['workcenterId']).resourceCalendarId).id,
                'dateFrom': startDate,
                'dateTo': addDate(startDate, {minutes: await this['durationExpected']}),
                'resourceId': (await (await this['workcenterId']).resourceId).id,
                'timeType': 'other'
            })
            vals['leaveId'] = leave.id
            return this.write(vals);
        }
        else {
            if (! await this['datePlannedStart'] || await this['datePlannedStart'] > startDate) {
                vals['datePlannedStart'] = startDate;
                vals['datePlannedFinished'] = await this._calculateDatePlannedFinished(startDate);
            }
            if (await this['datePlannedFinished'] && await this['datePlannedFinished'] < startDate) {
                vals['datePlannedFinished'] = startDate;
            }
            return (await this.withContext({bypassDurationCalculation: true})).write(vals);
        }
    }

    async buttonFinish() {
        const endDate = new Date();
        for (const workorder of this) {
            if (['done', 'cancel'].includes(await workorder.state)) {
                continue;
            }
            await workorder.endAll();
            const vals = {
                'qtyProduced': await workorder.qtyProduced || await workorder.qtyProducing || await workorder.qtyProduction,
                'state': 'done',
                'dateFinished': endDate,
                'datePlannedFinished': endDate,
                'costsHour': await (await workorder.workcenterId).costsHour
            }
            if (! await workorder.dateStart) {
                vals['dateStart'] = endDate;
            }
            if (! await workorder.datePlannedStart || endDate < await workorder.datePlannedStart) {
                vals['datePlannedStart'] = endDate;
            }
            await (await workorder.withContext({bypassDurationCalculation: true})).write(vals);

            await workorder._startNextworkorder();
        }
        return true;
    }

    /**
     * @param doall:  This will close all open time lines on the open work orders when doall = True, otherwise
        only the one of the current user
     */
    async endPrevious(doall=false) {
        // TDE CLEANME
        const timelineObj = this.env.items('mrp.workcenter.productivity');
        const domain = [['workorderId', 'in', this.ids], ['dateEnd', '=', false]];
        if (!doall) {
            domain.push(['userId', '=', (await this.env.user()).id]);
        }
        let notProductiveTimelines = timelineObj.browse();
        for (const timeline of await timelineObj.search(domain, {limit: doall ? null : 1})) {
            const wo = await timeline.workorderId;
            if (await wo.durationExpected <= await wo.duration) {
                if (await timeline.lossType == 'productive') {
                    notProductiveTimelines = notProductiveTimelines.add(timeline);
                }
                await timeline.write({'dateEnd': _Datetime.now()});
            }
            else {
                const maxdate = addDate(_Datetime.toDatetime(await timeline.dateStart) as Date, {minutes: await wo.durationExpected - await wo.duration});
                const enddate = new Date();
                if (maxdate > enddate) {
                    await timeline.write({'dateEnd': enddate});
                }
                else {
                    await timeline.write({'dateEnd': maxdate});
                    notProductiveTimelines = notProductiveTimelines.add(await timeline.copy({'dateStart': maxdate, 'dateEnd': enddate}));
                }
            }
        }
        if (notProductiveTimelines.ok) {
            const lossId = await this.env.items('mrp.workcenter.productivity.loss').search([['lossType', '=', 'performance']], {limit: 1});
            if (!len(lossId)) {
                throw new UserError(await this._t("You need to define at least one unactive productivity loss in the category 'Performance'. Create one from the Manufacturing app, menu: Configuration / Productivity Losses."));
            }
            await notProductiveTimelines.write({'lossId': lossId.id});
        }
        return true;
    }

    async endAll() {
        return this.endPrevious(true);
    }

    async buttonPending() {
        this.endPrevious();
        return true;
    }

    async buttonUnblock() {
        for (const order of this) {
            await (await order.workcenterId).unblock();
        }
        return true;
    }

    async actionCancel() {
        await (await this['leaveId']).unlink();
        await this.endAll();
        return this.write({'state': 'cancel'});
    }

    /**
     * Replan a work order.
        It actually replans every  "ready" or "pending"
        work orders of the linked manufacturing orders.
     * @returns 
     */
    async actionReplan() {
        for (const production of await this['productionId']) {
            await production._planWorkorders(true);
        }
        return true;
    }

    async buttonDone() {
        if (await this.some(async (x) => ['done', 'cancel'].includes(await x.state))) {
            throw new UserError(await this._t('A Manufacturing Order is already done or cancelled.'));
        }
        await this.endAll();
        const endDate = new Date();
        return this.write({
            'state': 'done',
            'dateFinished': endDate,
            'datePlannedFinished': endDate,
            'costsHour': await (await this['workcenterId']).costsHour
        });
    }

    async buttonScrap() {
        this.ensureOne();
        const production = await this['productionId'];
        return {
            'label': await this._t('Scrap'),
            'viewMode': 'form',
            'resModel': 'stock.scrap',
            'viewId': (await this.env.ref('stock.stockScrapFormView2')).id,
            'type': 'ir.actions.actwindow',
            'context': {
                'default_companyId': (await production.companyId).id,
                'default_workorderId': this.id,
                'default_productionId': production.id,
                'productIds': (await (await (await production.moveRawIds).filtered(async (x) => !['done', 'cancel'].includes(await x.state))).or(await (await production.moveFinishedIds).filtered(async (x) => await x.state == 'done')).mapped('productId')).ids
                },
            'target': 'new',
        }
    }

    async actionSeeMoveScrap() {
        this.ensureOne();
        const action = await this.env.items("ir.actions.actions")._forXmlid("stock.actionStockScrap");
        action['domain'] = [['workorderId', '=', this.id]];
        return action;
    }

    async actionOpenWizard() {
        this.ensureOne();
        const action = await this.env.items("ir.actions.actions")._forXmlid("mrp.mrpWorkorderMrpProductionForm");
        action['resId'] = this.id;
        return action;
    }

    @api.depends('qtyProduction', 'qtyProduced')
    async _computeQtyRemaining() {
        for (const wo of this) {
            await wo.set('qtyRemaining', Math.max(floatRound(await wo.qtyProduction - await wo.qtyProduced, {precisionRounding: await (await (await wo.productionId).productUomId).rounding}), 0));
        }
    }

    async _getDurationExpected(alternativeWorkcenter: any=false, ratio=1) {
        this.ensureOne();
        const [workcenter, durationExpected, production, operation] = await this('workcenterId', 'durationExpected', 'productionId', 'operationId');
        if (!bool(workcenter)) {
            return durationExpected;
        }
        if (!bool(operation)) {
            let durationExpectedWorking = (durationExpected - await workcenter.timeStart - await workcenter.timeStop) * await workcenter.timeEfficiency / 100.0;
            if (durationExpectedWorking < 0) {
                durationExpectedWorking = 0;
            }
            return await workcenter.timeStart + await workcenter.timeStop + durationExpectedWorking * ratio * 100.0 / await workcenter.timeEfficiency;
        }
        const qtyProduction = await (await production.productUomId)._computeQuantity(await this['qtyProduction'], await (await production.productId).uomId);
        const cycleNumber = floatRound(qtyProduction / await workcenter.capacity, {precisionDigits: 0, roundingMethod: 'UP'});
        if (bool(alternativeWorkcenter)) {
            // TODO : find a better alternative : the settings of workcenter can change
            let durationExpectedWorking = (durationExpected - await workcenter.timeStart - await workcenter.timeStop) * await workcenter.timeEfficiency / (100.0 * cycleNumber);
            if (durationExpectedWorking < 0) {
                durationExpectedWorking = 0;
            }
            const alternativeWcCycleNb = floatRound(qtyProduction / await alternativeWorkcenter.capacity, {precisionDigits: 0, roundingMethod: 'UP'});
            return await alternativeWorkcenter.timeStart + await alternativeWorkcenter.timeStop + alternativeWcCycleNb * durationExpectedWorking * 100.0 / await alternativeWorkcenter.timeEfficiency;
        }
        const timeCycle = await operation.timeCycle;
        return await workcenter.timeStart + await workcenter.timeStop + cycleNumber * timeCycle * 100.0 / await workcenter.timeEfficiency;
    }

    /**
     * Get conlicted workorder(s) with this.
        Conflict means having two workorders in the same time in the same workcenter.
     * @returns DefaultDict with key as workorder id of self and value as related conflicted workorder
     */
    async _getConflictedWorkorderIds() {
        await this.flush(['state', 'datePlannedStart', 'datePlannedFinished', 'workcenterId']);
        const sql = `
            SELECT wo1.id as id1, wo2.id as id2
            FROM "mrpWorkorder" wo1, "mrpWorkorder" wo2
            WHERE
                wo1.id IN (%s)
                AND wo1.state IN ('pending', 'waiting', 'ready')
                AND wo2.state IN ('pending', 'waiting', 'ready')
                AND wo1.id != wo2.id
                AND wo1."workcenterId" = wo2."workcenterId"
                AND (DATE_TRUNC('second', wo2."datePlannedStart"), DATE_TRUNC('second', wo2."datePlannedFinished"))
                    OVERLAPS (DATE_TRUNC('second', wo1."datePlannedStart"), DATE_TRUNC('second', wo1."datePlannedFinished"))
        `;
        const rows = await this.env.cr.execute(sql, [String(this.ids) ?? 'null'])
        const res = {};
        for (const {id1, id2} of rows) {
            if (!(id1 in res)) {
                res[id1] = [];
            }
            res[id1].push(id2);
        }
        return res;
    }

    /**
     * helper that computes quantity to consume (or to create in case of byproduct)
        depending on the quantity producing and the move's unit factor
     * @param move 
     * @param qtyProducing 
     * @returns 
     */
    @api.model()
    async _prepareComponentQuantity(move, qtyProducing) {
        const [product, productUom] = await move('productId', 'productUom');
        let uom;
        if (await product.tracking == 'serial') {
            uom = await product.uomId;
        }
        else {
            uom = productUom;
        }
        return productUom._computeQuantity(qtyProducing * await move.unitFactor, uom, {round: false});
    }

    async _prepareTimelineVals(duration, dateStart, dateEnd: any=false) {
        // Need a loss in case of the real time exceeding the expected
        const durationExpected = await this['durationExpected'];
        let lossId;
        if (!durationExpected || duration < durationExpected) {
            lossId = await this.env.items('mrp.workcenter.productivity.loss').search([['lossType', '=', 'productive']], {limit: 1});
            if (!len(lossId)) {
                throw new UserError(await this._t("You need to define at least one productivity loss in the category 'Productivity'. Create one from the Manufacturing app, menu: Configuration / Productivity Losses."));
            }
        }
        else {
            lossId = await this.env.items('mrp.workcenter.productivity.loss').search([['lossType', '=', 'performance']], {limit: 1});
            if (!len(lossId)) {
                throw new UserError(await this._t("You need to define at least one productivity loss in the category 'Performance'. Create one from the Manufacturing app, menu: Configuration / Productivity Losses."));
            }
        }
        const user = await this.env.user();
        return {
            'workorderId': this.id,
            'workcenterId': (await this['workcenterId']).id,
            'description': _f2(await this._t('Time Tracking: %(user)s'), {user: await user.label}),
            'lossId': lossId[0].id,
            'dateStart': dateStart,
            'dateEnd': dateEnd,
            'userId': user.id,  // FIXME sle: can be inconsistent with companyId
            'companyId': (await this['companyId']).id,
        }
    }

    /**
     * Update the finished move & move lines in order to set the finished
        product lot on it as well as the produced quantity. This method get the
        information either from the last workorder or from the Produce wizard.
     * @returns 
     */
    async _updateFinishedMove() {
        const [product, qtyProducing, finishedLot, productUom] = await this('productId', 'qtyProducing', 'finishedLotId', 'productUomId');
        const productionMove = await (await (await this['productionId']).moveFinishedIds).filtered(
            async (move) => (await move.productId).eq(await this['productId']) &&
            !['done', 'cancel'].includes(await move.state)
        );
        
        if (!bool(productionMove)) {
            return;
        }
        if (await (await productionMove.productId).tracking != 'none') {
            if (!bool(finishedLot)) {
                throw new UserError(await this._t('You need to provide a lot for the finished product.'));
            }
            const moveLine = (await productionMove.moveLineIds).filtered(
                async (line) => (await line.lotId).id == finishedLot.id
            );
            if (bool(moveLine)) {
                if (await product.tracking == 'serial') {
                    throw new UserError(await this._t('You cannot produce the same serial number twice.'));
                }
                await moveLine.set('productUomQty', await moveLine.productUomQty + qtyProducing);
                await moveLine.set('qtyDone', await moveLine.qtyDone + qtyProducing);
            }
            else {
                const quantity = await productUom._computeQuantity(qtyProducing, await product.uomId, {roundingMethod: 'HALF-UP'});
                const putawayLocation = await (await productionMove.locationDestId)._getPutawayStrategy(product, quantity);
                await moveLine.create({
                    'moveId': productionMove.id,
                    'productId': (await productionMove.productId).id,
                    'lotId': finishedLot.id,
                    'productUomQty': qtyProducing,
                    'productUomId': productUom.id,
                    'qtyDone': qtyProducing,
                    'locationId': (await productionMove.locationId).id,
                    'locationDestId': putawayLocation.id,
                });
            }
        }
        else {
            const rounding = await (await productionMove.productUom).rounding;
            await productionMove._setQuantityDone(
                floatRound(qtyProducing, {precisionRounding: rounding})
            );
        }
    }

    async _checkSnUniqueness() {
        // todo master: remove
        //pass;
    }

    async _updateQtyProducing(quantity) {
        this.ensureOne();
        if (bool(await this['qtyProducing'])) {
            await this.set('qtyProducing', quantity);
        }
    }
}