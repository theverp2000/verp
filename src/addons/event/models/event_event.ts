import _ from "lodash";
import { _Datetime, _super, api, BaseModel, Command, Fields, MetaModel, Model } from "../../../core";
import { _tzGet } from "../../../core/addons/base";
import { ValidationError, ValueError } from "../../../core/helper";
import { all, bool, dateMin, dateSetTz, f, formatDatetime, htmlTranslate, isHtmlEmpty, isInstance, len, some, timezone, today, update } from "../../../core/tools";

let ical;
try {
    ical = require('ical-generator');
} catch(e) {  
    console.warn("`ical-generator` module not found, iCal file generation disabled. Consider installing this module if you want to generate iCal files");
}

@MetaModel.define()
class EventType extends Model {
    static _module = module;
    static _name = 'event.type';
    static _description = 'Event Template';
    static _order = 'sequence, id';

    async _defaultEventMailTypeIds() {
        return [
            [0, 0,
                {'notificationType': 'mail',
                'intervalNbr': 0,
                'intervalUnit': 'now',
                'intervalType': 'afterSub',
                'templateRef': f('mail.template, %s', await this.env.refId('event.eventSubscription')),
                }],
            [0, 0,
                {'notificationType': 'mail',
                'intervalNbr': 1,
                'intervalUnit': 'hours',
                'intervalType': 'beforeEvent',
                'templateRef': f('mail.template, %s', await this.env.refId('event.eventReminder')),
                }],
            [0, 0,
                {'notificationType': 'mail',
                'intervalNbr': 3,
                'intervalUnit': 'days',
                'intervalType': 'beforeEvent',
                'templateRef': f('mail.template, %s', await this.env.refId('event.eventReminder')),
                }]
        ];
    }
    static label = Fields.Char('Event Template', {required: true, translate: true});
    static note = Fields.Html({string: 'Note'});
    static sequence = Fields.Integer();
    // tickets
    static eventTypeTicketIds = Fields.One2many('event.type.ticket', 'eventTypeId', {string: 'Tickets'});
    static tagIds = Fields.Many2many('event.tag', {string: "Tags"});
    // registration
    static hasSeatsLimitation = Fields.Boolean('Limited Seats');
    static seatsMax = Fields.Integer(
        'Maximum Registrations', {compute: '_computeDefaultRegistration',
        readonly: false, store: true,
        help: "It will select this default maximum value when you choose this event"});
    static autoConfirm = Fields.Boolean(
        'Automatically Confirm Registrations', {default: true,
        help: ["Events and registrations will automatically be confirmed ",
             "upon creation, easing the flow for simple events."].join()});
    static defaultTimezone = Fields.Selection(
        _tzGet, {string: 'Timezone', default: async (self) => (await self.env.user()).tz || 'UTC'});
    // communication
    static eventTypeMailIds = Fields.One2many(
        'event.type.mail', 'eventTypeId', {string: 'Mail Schedule',
        default: self=> self._defaultEventMailTypeIds()});
    // ticket reports
    static ticketInstructions = Fields.Html('Ticket Instructions', {translate: true,
        help: "This information will be printed on your tickets."});

    @api.depends('hasSeatsLimitation')
    async _computeDefaultRegistration() {
        for (const template of this) {
            if (!await template.hasSeatsLimitation) {
                await template.set('seatsMax', 0);
            }
        }
    }
}

/**
 * Event
 */
@MetaModel.define()
class EventEvent extends Model {
    static _module = module;
    static _name = 'event.event';
    static _description = 'Event';
    static _parents = ['mail.thread', 'mail.activity.mixin'];
    static _order = 'dateBegin';

    async _getDefaultStageId() {
        return this.env.items('event.stage').search([], {limit: 1});
    }

    /**
     * avoid template branding with renderingBundle: true
     * @returns 
     */
    async _defaultDescription() {
        return (await this.env.items('ir.ui.view').withContext({renderingBundle: true}))
            ._renderTemplate('event.eventDefaultDescripton');
    }

    async _defaultEventMailIds() {
        return this.env.items('event.type')._defaultEventMailTypeIds();
    }

    static label = Fields.Char({string: 'Event', translate: true, required: true});
    static note = Fields.Html({string: 'Note', store: true, compute: "_computeNote", readonly: false});
    static description = Fields.Html({string: 'Description', translate: htmlTranslate, sanitizeAttributes: false, sanitizeForm: false, default: self => self._defaultDescription()});
    static active = Fields.Boolean({default: true});
    static userId = Fields.Many2one(
        'res.users', {string: 'Responsible', tracking: true,
        default: self => self.env.user()});
    static companyId = Fields.Many2one(
        'res.company', {string: 'Company', changeDefault: true,
        default: self => self.env.company(),
        required: false});
    static organizerId = Fields.Many2one(
        'res.partner', {string: 'Organizer', tracking: true,
        default: async (self) => (await self.env.company()).partnerId,
        domain: "['|', ['companyId', '=', false], ['companyId', '=', companyId]]"});
    static eventTypeId = Fields.Many2one('event.type', {string: 'Template', ondelete: 'SET NULL'});
    static eventMailIds = Fields.One2many(
        'event.mail', 'eventId', {string: 'Mail Schedule', copy: true,
        compute: '_computeEventMailIds', readonly: false, store: true});
    static tagIds = Fields.Many2many(
        'event.tag', {string: "Tags", readonly: false,
        store: true, compute: "_computeTagIds"});
    // Kanban fields
    static kanbanState = Fields.Selection([['normal', 'In Progress'], ['done', 'Done'], ['blocked', 'Blocked']], {default: 'normal', copy: false});
    static kanbanStateLabel = Fields.Char(
        {string: 'Kanban State Label', compute: '_computeKanbanStateLabel',
        store: true, tracking: true});
    static stageId = Fields.Many2one(
        'event.stage', {ondelete: 'restrict', default: self => self._getDefaultStageId(),
        groupExpand: '_readGroupStageIds', tracking: true, copy: false});
    static legendBlocked = Fields.Char({related: 'stageId.legendBlocked', string: 'Kanban Blocked Explanation', readonly: true});
    static legendDone = Fields.Char({related: 'stageId.legendDone', string: 'Kanban Valid Explanation', readonly: true});
    static legendNormal = Fields.Char({related: 'stageId.legendNormal', string: 'Kanban Ongoing Explanation', readonly: true});
    // Seats and computation
    static seatsMax = Fields.Integer({
        string: 'Maximum Attendees Number',
        compute: '_computeSeatsMax', readonly: false, store: true,
        help: "For each event you can define a maximum registration of seats(number of attendees), above this numbers the registrations are not accepted."});
    static seatsLimited = Fields.Boolean('Maximum Attendees', {required: true, compute: '_computeSeatsLimited',
                                   readonly: false, store: true});
    static seatsReserved = Fields.Integer({
        string: 'Reserved Seats',
        store: true, readonly: true, compute: '_computeSeats'});
    static seatsAvailable = Fields.Integer({
        string: 'Available Seats',
        store: true, readonly: true, compute: '_computeSeats'});
    static seatsUnconfirmed = Fields.Integer({
        string: 'Unconfirmed Seat Reservations',
        store: true, readonly: true, compute: '_computeSeats'});
    static seatsUsed = Fields.Integer({
        string: 'Number of Participants',
        store: true, readonly: true, compute: '_computeSeats'});
    static seatsExpected = Fields.Integer({
        string: 'Number of Expected Attendees',
        computeSudo: true, readonly: true, compute: '_computeSeatsExpected'});
    // Registration fields
    static autoConfirm = Fields.Boolean({
        string: 'Autoconfirmation', compute: '_computeAutoConfirm', readonly: false, store: true,
        help: 'Autoconfirm Registrations. Registrations will automatically be confirmed upon creation.'});
    static registrationIds = Fields.One2many('event.registration', 'eventId', {string: 'Attendees'});
    static eventTicketIds = Fields.One2many(
        'event.event.ticket', 'eventId', {string: 'Event Ticket', copy: true,
        compute: '_computeEventTicketIds', readonly: false, store: true});
    static eventRegistrationsStarted = Fields.Boolean(
        'Registrations started', {compute: '_computeEventRegistrationsStarted',
        help: "registrations have started if the current datetime is after the earliest starting date of tickets."
    });
    static eventRegistrationsOpen = Fields.Boolean(
        'Registration open', {compute: '_computeEventRegistrationsOpen', computeSudo: true,
        help: ["Registrations are open if:\n",
        "- the event is not ended\n",
        "- there are seats available on event\n",
        "- the tickets are sellable (if ticketing is used)"].join()});
    static eventRegistrationsSoldOut = Fields.Boolean(
        'Sold Out', {compute: '_computeEventRegistrationsSoldOut', computeSudo: true,
        help: 'The event is sold out if no more seats are available on event. If ticketing is used and all tickets are sold out, the event will be sold out.'});
    static startSaleDatetime = Fields.Datetime(
        'Start sale date', {compute: '_computeStartSaleDate',
        help: 'If ticketing is used, contains the earliest starting sale date of tickets.'});

    // Date fields
    static dateTz = Fields.Selection(
        _tzGet, {string: 'Timezone', required: true,
        compute: '_computeDateTz', readonly: false, store: true});
    static dateBegin = Fields.Datetime({string: 'Start Date', required: true, tracking: true});
    static dateEnd = Fields.Datetime({string: 'End Date', required: true, tracking: true});
    static dateBeginLocated = Fields.Char({string: 'Start Date Located', compute: '_computeDateBeginTz'});
    static dateEndLocated = Fields.Char({string: 'End Date Located', compute: '_computeDateEndTz'});
    static isOngoing = Fields.Boolean('Is Ongoing', {compute: '_computeIsOngoing', search: '_searchIsOngoing'});
    static isOneDay = Fields.Boolean({compute: '_computeFieldIsOneDay'});
    static isFinished = Fields.Boolean({compute: '_computeIsFinished', search: '_searchIsFinished'});
    // Location and communication
    static addressId = Fields.Many2one(
        'res.partner', {string: 'Venue', default: async (self) => (await (self.env.company()).partnerId).id,
        tracking: true, domain: "['|', ['companyId', '=', false], ['companyId', '=', companyId]]"});
    static countryId = Fields.Many2one(
        'res.country', 'Country', {related: 'addressId.countryId', readonly: false, store: true});
    // ticket reports
    static ticketInstructions = Fields.Html('Ticket Instructions', {translate: true,
        compute: '_computeTicketInstructions', store: true, readonly: false,
        help: "This information will be printed on your tickets."});

    @api.depends('stageId', 'kanbanState')
    async _computeKanbanStateLabel() {
        for (const event of this) {
            const [kanbanState, stage] = await event('kanbanState', 'stageId');
            if (kanbanState == 'normal') {
                await event.set('kanbanStateLabel', await stage.legendNormal);
            }
            else if (kanbanState == 'blocked') {
                await event.set('kanbanStateLabel', await stage.legendBlocked);
            }
            else {
                await event.set('kanbanStateLabel', await stage.legendDone);
            }
        }
    }

    /**
     * Determine reserved, available, reserved but unconfirmed and used seats.
     */
    @api.depends('seatsMax', 'registrationIds.state')
    async _computeSeats() {
        // initialize fields to 0
        for (const event of this) {
            await event.set('seatsUnconfirmed', 0),
            await event.set('seatsReserved', 0),
            await event.set('seatsUsed', 0),
            await event.set('seatsAvailable', 0);
        }
        // aggregate registrations by event and by state
        const stateField = {
            'draft': 'seatsUnconfirmed',
            'open': 'seatsReserved',
            'done': 'seatsUsed',
        }
        const baseVals = Object.fromEntries(Object.values(stateField).map(fname => [fname, 0]));
        const results = Object.fromEntries(this.ids.map(id => [id, Object.assign({}, baseVals)]));
        if (len(this.ids)) {
            const query = `SELECT "eventId", state, count("eventId") as num
                        FROM "eventRegistration"
                        WHERE "eventId" IN (%s) AND state IN ('draft', 'open', 'done')
                        GROUP BY "eventId", state
                    `;
            await this.env.items('event.registration').flush(['eventId', 'state']);
            const res = await this._cr.execute(query, [String(this.ids) || 'NULL']);
            for (const {eventId, state, num} of res) {
                results[eventId][stateField[state]] = num;
            }
        }

        // compute seats_available
        for (const event of this) {
            await event.update(results[event._origin.id || event.id] ?? baseVals);
            if (await event.seatsMax > 0) {
                await event.set('seatsAvailable', await event.seatsMax - (await event.seatsReserved + await event.seatsUsed));
            }
        }
    }

    @api.depends('seatsUnconfirmed', 'seatsReserved', 'seatsUsed')
    async _computeSeatsExpected() {
        for (const event of this) {
            await event.set('seatsExpected', await event.seatsUnconfirmed + await event.seatsReserved + await event.seatsUsed);
        }
    }

    @api.depends('dateTz', 'startSaleDatetime')
    async _computeEventRegistrationsStarted() {
        for (let event of this) {
            event = await event._setTzContext();
            if (await event.startSaleDatetime) {
                const currentDatetime = await _Datetime.contextTimestamp(event, _Datetime.now());
                const startSaleDatetime = await _Datetime.contextTimestamp(event, await event.startSaleDatetime);
                await event.set('eventRegistrationsStarted', currentDatetime >= startSaleDatetime);
            }
            else {
                await event.set('eventRegistrationsStarted', true);
            }
        }
    }

    /**
     * Compute whether people may take registrations for this event

          * event.dateEnd -> if event is 'done', registrations are not open anymore;
          * event.startSaleDatetime -> lowest start date of tickets (if any; startSaleDatetime
            is 'false' if no ticket are defined, see _computeStartSaleDate);
          * any ticket is available for sale (seats available) if any;
          * seats are unlimited or seats are available;
     */
    @api.depends('dateTz', 'eventRegistrationsStarted', 'dateEnd', 'seatsAvailable', 'seatsLimited', 'eventTicketIds.saleAvailable')
    async _computeEventRegistrationsOpen() {
        for (let event of this) {
            event = await event._setTzContext();
            const currentDatetime = await _Datetime.contextTimestamp(event, _Datetime.now());
            const dateEndTz = await event.dateEnd ? await (await event.dateEnd).astimezone(timezone(await event.dateTz || 'UTC')) : false;
            await event.set('eventRegistrationsOpen', await event.eventRegistrationsStarted &&
                (dateEndTz ? dateEndTz >= currentDatetime : true) &&
                (!await event.seatsLimited || await event.seatsAvailable) &&
                (!bool(await event.eventTicketIds) || await (await event.eventTicketIds).some(ticket => ticket.saleAvailable)));
        }
    }

    /**
     * Compute the start sale date of an event. Currently lowest starting sale
        date of tickets if they are used, of 'false'.
     */
    @api.depends('eventTicketIds.startSaleDatetime')
    async _computeStartSaleDate() {
        for (const event of this) {
            const startDates = await (await (await event.eventTicketIds).filter(async (ticket) => !await ticket.isExpired)).map(ticket => ticket.startSaleDatetime);
            await event.set('startSaleDatetime', startDates && all(startDates) ? dateMin(startDates) : false);
        }
    }

    @api.depends('eventTicketIds.saleAvailable')
    async _computeEventRegistrationsSoldOut() {
        for (const event of this) {
            if (await event.seatsLimited && !await event.seatsAvailable) {
                await event.set('eventRegistrationsSoldOut', true);
            }
            else if (bool(await event.eventTicketIds)) {
                await event.set('eventRegistrationsSoldOut', !some(
                    await (await event.eventTicketIds).map(async (ticket) => await ticket.seatsLimited ? await ticket.seatsAvailable > 0 : true)
                ));
            }
            else {
                await event.set('eventRegistrationsSoldOut',  false);
            }
        }
    }

    @api.depends('dateTz', 'dateBegin')
    async _computeDateBeginTz() {
        for (const event of this) {
            if (await event.dateBegin) {
                await event.set('dateBeginLocated', await formatDatetime(
                    this.env, await event.dateBegin, await event.dateTz, 'medium'));
            }
            else {
                await event.set('dateBeginLocated', false);
            }
        }
    }

    @api.depends('dateTz', 'dateEnd')
    async _computeDateEndTz() {
        for (const event of this) {
            if (await event.dateEnd) {
                await event.set('dateEndLocated', await formatDatetime(
                    this.env, await event.dateEnd, await event.dateTz, 'medium'));
            }
            else {
                await event.set('dateEndLocated', false);
            }
        }
    }

    @api.depends('dateBegin', 'dateEnd')
    async _computeIsOngoing() {
        const now = _Datetime.now();
        for (const event of this) {
            await event.set('isOngoing', await event.dateBegin <= now && now < await event.dateEnd);
        }
    }

    async _searchIsOngoing(operator, value) {
        if (!['=', '!='].includes(operator)) {
            throw new ValueError(await this._t('This operator is not supported'));
        }
        if (typeof value !== 'boolean') {
            throw new ValueError(await this._t('Value should be true or false (not %s)', value));
        }
        let domain;
        const now = _Datetime.now();
        if ((operator == '=' && bool(value)) || (operator == '!=' && !bool(value))) {
            domain = [['dateBegin', '<=', now], ['dateEnd', '>', now]];
        }
        else {
            domain = ['|', ['dateBegin', '>', now], ['dateEnd', '<=', now]];
        }
        const eventIds = await this.env.items('event.event')._search(domain);
        return [['id', 'in', eventIds]];
    }

    @api.depends('dateBegin', 'dateEnd', 'dateTz')
    async _computeFieldIsOneDay() {
        for (let event of this) {
            // Need to localize because it could begin late and finish early in
            // another timezone
            event = await event._setTzContext();
            const beginTz = await _Datetime.contextTimestamp(event, await event.dateBegin);
            const endTz = await _Datetime.contextTimestamp(event, await event.dateEnd);
            await event.set('isOneDay', today(beginTz) == today(endTz));
        }
    }

    @api.depends('dateEnd')
    async _computeIsFinished() {
        for (let event of this) {
            if (!await event.dateEnd) {
                await event.set('isFinished', false);
                continue;
            }
            event = await event._setTzContext();
            const currentDatetime = await _Datetime.contextTimestamp(event, _Datetime.now());
            const datetimeEnd = await _Datetime.contextTimestamp(event, await event.dateEnd);
            await event.set('isFinished', datetimeEnd <= currentDatetime);
        }
    }

    async _searchIsFinished(operator, value) {
        if (!['=', '!='].includes(operator)) {
            throw new ValueError(await this._t('This operator is not supported'));
        }
        if (typeof value !== 'boolean') {
            throw new ValueError(await this._t('Value should be true or false (not %s)', value));
        }
        const now = _Datetime.now();
        let domain;
        if ((operator == '=' && bool(value)) || (operator == '!=' && !bool(value))) {
            domain = [['dateEnd', '<=', now]];
        }
        else {
            domain = [['dateEnd', '>', now]];
        }
        const eventIds = await this.env.items('event.event')._search(domain);
        return [['id', 'in', eventIds]];
    }

    @api.depends('eventTypeId')
    async _computeDateTz() {
        for (const event of this) {
            if (await (await event.eventTypeId).defaultTimezone) {
                await event.set('dateTz', await (await event.eventTypeId).defaultTimezone);
            }
            if (!await event.dateTz) {
                await event.set('dateTz', await (await this.env.user()).tz || 'UTC');
            }
        }
    }

    // seats

    /**
     * Update event configuration from its event type. Depends are set only
        on eventTypeId itself, not its sub fields. Purpose is to emulate an
        onchange: if event type is changed, update event configuration. Changing
        event type content itself should not trigger this method.
     */
    @api.depends('eventTypeId')
    async _computeSeatsMax() {
        for (const event of this) {
            if (!(await event.eventTypeId).ok) {
                await event.set('seatsMax', await event.seatsMax || 0);
            }
            else {
                await event.set('seatsMax', await (await event.eventTypeId).seatsMax || 0)
            }
        }
    }

    /**
     * Update event configuration from its event type. Depends are set only
        on eventTypeId itself, not its sub fields. Purpose is to emulate an
        onchange: if event type is changed, update event configuration. Changing
        event type content itself should not trigger this method.
     * @returns 
     */
    @api.depends('eventTypeId')
    async _computeSeatsLimited() {
        for (const event of this) {
            if (await (await event.eventTypeId).hasSeatsLimitation != await event.seatsLimited) {
                await event.set('seatsLimited', await (await event.eventTypeId).hasSeatsLimitation);
            }
            if (!await event.seatsLimited) {
                await event.set('seatsLimited', false);
            }
        }
    }

    /**
     * Update event configuration from its event type. Depends are set only
        on eventTypeId itself, not its sub fields. Purpose is to emulate an
        onchange: if event type is changed, update event configuration. Changing
        event type content itself should not trigger this method.
     * @returns 
     */
    @api.depends('eventTypeId')
    async _computeAutoConfirm() {
        for (const event of this) {
            await event.set('autoConfirm', await (await event.eventTypeId).autoConfirm);
        }
    }

    /**
     * Update event configuration from its event type. Depends are set only
        on eventTypeId itself, not its sub fields. Purpose is to emulate an
        onchange: if event type is changed, update event configuration. Changing
        event type content itself should not trigger this method.

        When synchronizing mails:

          * lines that are not sent and have no registrations linked are remove;
          * type lines are added;
     * @returns 
     */
    @api.depends('eventTypeId')
    async _computeEventMailIds() {
        for (const event of this) {
            if (!(await event.eventTypeId).ok && !(await event.eventMailIds).ok) {
                await event.set('eventMailIds', await this._defaultEventMailIds());
                continue;
            }

            // lines to keep: those with already sent emails or registrations
            const mailsToRemove = await (await event.eventMailIds).filtered(
                async (mail)=> !(await mail._origin.mailDone) && !(await mail._origin.mailRegistrationIds).ok
            )
            let command = await mailsToRemove.map(mail => Command.unlink(mail.id));
            const eventTypeMailIds = await (await event.eventTypeId).eventTypeMailIds;
            if (eventTypeMailIds.ok) {
                command = command.concat(await eventTypeMailIds.map(async (line) => Command.create(await line._prepareEventMailValues())));
            }
            if (command.length) {
                await event.set('eventMailIds', command);
            }
        }
    }

    /**
     * Update event configuration from its event type. Depends are set only
        on eventTypeId itself, not its sub fields. Purpose is to emulate an
        onchange: if event type is changed, update event configuration. Changing
        event type content itself should not trigger this method.
     * @returns 
     */
    @api.depends('eventTypeId')
    async _computeTagIds() {
        for (const event of this) {
            if (!(await event.tagIds).ok && (await (event.eventTypeId).tagIds)) {
                await event.set('tagIds', await (await event.eventTypeId).tagIds);
            }
        }
    }

    /**
     * Update event configuration from its event type. Depends are set only
        on eventTypeId itself, not its sub fields. Purpose is to emulate an
        onchange: if event type is changed, update event configuration. Changing
        event type content itself should not trigger this method.

        When synchronizing tickets:

          * lines that have no registrations linked are remove;
          * type lines are added;

        Note that updating eventTicketIds triggers _computeStartSaleDate
        (startSaleDatetime computation) so ensure result to avoid cache miss.
     * @returns 
     */
    @api.depends('eventTypeId')
    async _computeEventTicketIds() {
        for (const event of this) {
            if (!(await event.eventTypeId).ok && !(await event.eventTicketIds).ok) {
                await event.set('eventTicketIds', false);
                continue;
            }

            // lines to keep: those with existing registrations
            const ticketsToRemove = await (await event.eventTicketIds).filtered(async (ticket) => !(await ticket._origin.registrationIds).ok);
            let command = await ticketsToRemove.map(ticket => Command.unlink(ticket.id));
            const eventTypeTicketIds = await (await event.eventTypeId).eventTypeTicketIds;
            if ((await (await event.eventTypeId).eventTypeTicketIds).ok) {
                command = command.concat(await eventTypeTicketIds.map(async (line) => 
                    Command.create(Object.fromEntries(
                        await Promise.all((await this.env.items('event.type.ticket')._getEventTicketFieldsWhitelist())
                        .map(async (attributeName) => [attributeName, !isInstance(await line[attributeName], BaseModel) ? await line[attributeName] : line[attributeName].id]))
                    ))
                ));
            }
            await event.set('eventTicketIds', command);
        }
    }

    @api.depends('eventTypeId')
    async _computeNote() {
        for (const event of this) {
            if ((await event.eventTypeId).ok && !isHtmlEmpty(await (await event.eventTypeId).note)) {
                await event.set('note', await (await event.eventTypeId).note);
            }
        }
    }

    @api.depends('eventTypeId')
    async _computeTicketInstructions() {
        for (const event of this) {
            if (isHtmlEmpty(await event.ticketInstructions) && 
                !isHtmlEmpty(await (await event.eventTypeId).ticketInstructions)) {
                await event.set('ticketInstructions', await (await event.eventTypeId).ticketInstructions);
            }
        }
    }

    @api.constrains('seatsMax', 'seatsAvailable', 'seatsLimited')
    async _checkSeatsLimit() {
        if (await this.some(async (event) => await event.seatsLimited && await event.seatsMax && await event.seatsAvailable < 0)) {
            throw new ValidationError(await this._t('No more available seats.'));
        }
    }

    @api.constrains('dateBegin', 'dateEnd')
    async _checkClosingDate() {
        for (const event of this) {
            if (await event.dateEnd < await event.dateBegin) {
                throw new ValidationError(await this._t('The closing date cannot be earlier than the beginning date.'));
            }
        }
    }

    @api.model()
    async _readGroupStageIds(stages, domain, order) {
        return this.env.items('event.stage').search([]);
    }

    @api.modelCreateMulti()
    async create(valsList) {
        for (const vals of valsList) {
            // Temporary fix for ``seatsLimited`` and ``dateTz`` required fields
            update(vals, await this._syncRequiredComputed(vals));
        }

        const events = await _super(EventEvent, this).create(valsList);
        for (const res of events) {
            if ((await res.organizerId).ok) {
                await res.messageSubscribe([(await res.organizerId).id]);
            }
        }
        await events.flush();
        return events;
    }

    async write(vals) {
        if ('stageId' in vals && !('kanbanState' in vals)) {
            // reset kanban state when changing stage
            vals['kanbanState'] = 'normal';
        }
        const res = await _super(EventEvent, this).write(vals);
        if (vals['organizerId']) {
            await this.messageSubscribe([vals['organizerId']]);
        }
        return res;
    }

    @api.returns('self', value => value.id)
    async copy(defaults?: any) {
        this.ensureOne();
        defaults = Object.assign({}, defaults ?? {}, {label: await this._t("%s (copy)", await this['label'])});
        return _super(EventEvent, this).copy(defaults);
    }

    @api.model()
    async _getMailMessageAccess(resIds, operation, modelName?: any) {
        if (
            operation == 'create'
            && await (await this.env.user()).hasGroup('event.groupEventRegistrationDesk')
            && (!modelName || modelName == 'event.event')
        ) {
            // allow the registration desk users to post messages on Event
            // can not be done with "_mail_post_access" otherwise public user will be
            // able to post on published Event (see website_event)
            return 'read';
        }
        return _super(EventEvent, this)._getMailMessageAccess(resIds, operation, modelName);
    }

    /**
     * Call compute fields in cache to find missing values for required fields
        (seatsLimited and dateTz) in case they are not given in values
     * @param values 
     * @returns 
     */
    async _syncRequiredComputed(values) {
        // TODO: See if the change to seatsLimited affects this ?
        const missingFields = _.difference(['seatsLimited', 'dateTz'], Object.keys(values));
        if (missingFields.length && bool(values)) {
            const cacheEvent = await this.new(values);
            await cacheEvent._computeSeatsLimited();
            await cacheEvent._computeDateTz();
            return Object.fromEntries(await Promise.all(missingFields.map(async (fname) => [fname, await cacheEvent[fname]])));
        }
        else {
            return {};
        }
    }

    async _setTzContext() {
        this.ensureOne();
        return this.withContext({tz: await this['dateTz'] || 'UTC'});
    }

    /**
     * Action which will move the events
        into the first next (by sequence) stage defined as "Ended"
        (if they are not already in an ended stage)
     * @returns 
     */
    async actionSetDone() {
        const firstEndedStage = await this.env.items('event.stage').search([['pipeEnd', '=', true]], {limit: 1, order: 'sequence'});
        if (bool(firstEndedStage)) {
            await this.write({'stageId': firstEndedStage.id});
        }
    }

    async mailAttendees(templateId, forceSend: boolean, filterFunc: Function = async (self) => await self.state != 'cancel') {
        for (const event of this) {
            for (const attendee of await (await event.registrationIds).filtered(filterFunc)) {
                await this.env.items('mail.template').browse(templateId).sendMail(attendee.id, {forceSend});
            }
        }
    }

    /**
     * Returns iCalendar file for the event invitation.
     * @returns a dict of .ics file content for each event
     */
    async _getIcsFile() {
        const result = {};
        if (!ical) {
            return result;
        }

        for (const event of this) {
            const cal = ical();
            let calEvent = {};

            calEvent['created'] = dateSetTz(_Datetime.now(), 'UTC');
            calEvent['dtstart'] = dateSetTz(_Datetime.toDatetime(await event.dateBegin) as Date, 'UTC');
            calEvent['dtend'] = dateSetTz(_Datetime.toDatetime(await event.dateEnd) as Date, 'UTC');
            calEvent['summary'] = await event.label;
            if ((await event.addressId).ok) {
                calEvent['location'] = await (await (await event.sudo()).addressId).contactAddress;
            }
            calEvent = cal.createEvent(calEvent);
            result[event.id] = cal.toString();
        }
        return result;
    }

    /**
     * move every ended events in the next 'ended stage'
     */
    @api.autovacuum()
    async _gcMarkEventsDone() {
        const endedEvents = await this.env.items('event.event').search([
            ['dateEnd', '<', _Datetime.now()],
            ['stageId.pipeEnd', '=', false],
        ]);
        if (bool(endedEvents)) {
            await endedEvents.actionSetDone();
        }
    }
}
