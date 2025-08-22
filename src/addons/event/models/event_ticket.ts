import { _Datetime, _super, api, Fields, MetaModel, Model } from "../../../core";
import { setdefault } from "../../../core/api";
import { UserError, ValidationError } from "../../../core/helper";
import { bool, f } from "../../../core/tools";

@MetaModel.define()
class EventTemplateTicket extends Model {
    static _module = module;
    static _name = 'event.type.ticket';
    static _description = 'Event Template Ticket';

    // description
    static label = Fields.Char(
        {string: 'Name', default: self => self._t('Registration'),
        required: true, translate: true});
    static description = Fields.Text(
        'Description', {translate: true,
        help: "A description of the ticket that you want to communicate to your customers."});
    static eventTypeId = Fields.Many2one(
        'event.type', {string: 'Event Category', ondelete: 'cascade', required: true});
    // seats
    static seatsLimited = Fields.Boolean({string: 'Seats Limit', readonly: true, store: true,
                                   compute: '_computeSeatsLimited'});
    static seatsMax = Fields.Integer(
        {string: 'Maximum Seats',
        help: ["Define the number of available tickets. If you have too many registrations you will ",
             "not be able to sell tickets anymore. Set 0 to ignore this rule set as unlimited."].join()});

    @api.depends('seatsMax')
    async _computeSeatsLimited() {
        for (const ticket of this) {
            await ticket.set('seatsLimited', await ticket.seatsMax);
        }
    }

    /*
    * Whitelist of fields that are copied from eventTypeTicketIds to eventTicketIds when
    *   changing the eventTypeId field of event.event
    */
    @api.model()
    async _getEventTicketFieldsWhitelist() {
        return ['label', 'description', 'seatsMax'];
    }
}

/**
 * Ticket model allowing to have differnt kind of registrations for a given
    event. Ticket are based on ticket type as they share some common fields
    and behavior. Both concept: tickets for event templates, and tickets for events.
 */
@MetaModel.define()
class EventTicket extends Model {
    static _module = module;
    static _name = 'event.event.ticket';
    static _parents = 'event.type.ticket';
    static _description = 'Event Ticket';

    @api.model()
    async defaultGet(fields) {
        const res = await _super(EventTicket, this).defaultGet(fields);
        if ('label' in fields && (!res['label'] || res['label'] == await this._t('Registration')) && this.env.context['default_eventName']) {
            res['label'] = await this._t('Registration for %s', this.env.context['default_eventName']);
        }
        return res;
    }

    // description
    static eventTypeId = Fields.Many2one({ondelete: 'set null', required: false});
    static eventId = Fields.Many2one(
        'event.event', {string: "Event",
        ondelete: 'cascade', required: true});
    static companyId = Fields.Many2one('res.company', {related: 'eventId.companyId'});
    // sale
    static startSaleDatetime = Fields.Datetime({string: "Registration Start"});
    static endSaleDatetime = Fields.Datetime({string: "Registration End"});
    static isExpired = Fields.Boolean({string: 'Is Expired', compute: '_computeIsExpired'});
    static saleAvailable = Fields.Boolean({string: 'Is Available', compute: '_computeSaleAvailable', computeSudo: true});
    static registrationIds = Fields.One2many('event.registration', 'eventTicketId', {string: 'Registrations'});
    // seats
    static seatsReserved = Fields.Integer({string: 'Reserved Seats', compute: '_computeSeats', store: true});
    static seatsAvailable = Fields.Integer({string: 'Available Seats', compute: '_computeSeats', store: true});
    static seatsUnconfirmed = Fields.Integer({string: 'Unconfirmed Seats', compute: '_computeSeats', store: true});
    static seatsUsed = Fields.Integer({string: 'Used Seats', compute: '_computeSeats', store: true});

    @api.depends('endSaleDatetime', 'eventId.dateTz')
    async _computeIsExpired() {
        for (let ticket of this) {
            ticket = await ticket._setTzContext();
            const currentDatetime = await _Datetime.contextTimestamp(ticket, _Datetime.now());
            if (await ticket.endSaleDatetime) {
                const endSaleDatetime = await _Datetime.contextTimestamp(ticket, await ticket.endSaleDatetime);
                await ticket.set('isExpired', endSaleDatetime < currentDatetime);
            }
            else {
                await ticket.set('isExpired', false);
            }
        }
    }

    @api.depends('isExpired', 'startSaleDatetime', 'eventId.dateTz', 'seatsAvailable', 'seatsMax')
    async _computeSaleAvailable() {
        for (const ticket of this) {
            if (!await ticket.isLaunched() || await ticket.isExpired || (await ticket.seatsMax && await ticket.seatsAvailable <= 0)) {
                await ticket.set('saleAvailable', false);
            }
            else {
                await ticket.set('saleAvailable', true);
            }
        }
    }

    /**
     * Determine reserved, available, reserved but unconfirmed and used seats.
     * @returns 
     */
    @api.depends('seatsMax', 'registrationIds.state')
    async _computeSeats() {
        // initialize fields to 0 + compute seats availability
        for (const ticket of this) {
            await ticket.set('seatsUnconfirmed', 0);
            await ticket.set('seatsReserved', 0);
            await ticket.set('seatsUsed', 0);
            await ticket.set('seatsAvailable', 0);
        }
        // aggregate registrations by ticket and by state
        const results = {};
        if (bool(this.ids)) {
            const stateField = {
                'draft': 'seatsUnconfirmed',
                'open': 'seatsReserved',
                'done': 'seatsUsed',
            };
            const query = `SELECT "eventTicketId", state, count("eventId") as num
                        FROM "eventRegistration"
                        WHERE "eventTicketId" IN (%s) AND state IN ('draft', 'open', 'done')
                        GROUP BY "eventTicketId", state
                    `;
            await this.env.items('event.registration').flush(['eventId', 'eventTicketId', 'state']);
            const res = await this.env.cr.execute(query, [String(this.ids) || 'NULL']);
            for (const {eventTicketId, state, num} of res) {
                setdefault(results, eventTicketId, {})[stateField[state]] = num;
            }
        }

        // compute seats_available
        for (const ticket of this) {
            await ticket.update(results[ticket._origin.id || ticket.id] ?? {});
            if (await ticket.seatsMax > 0) {
                await ticket.set('seatsAvailable', await ticket.seatsMax - (await ticket.seatsReserved + await ticket.seatsUsed));
            }
        }
    }

    @api.constrains('startSaleDatetime', 'endSaleDatetime')
    async _constrainsDatesCoherency() {
        for (const ticket of this) {
            const [start, end] = await ticket('startSaleDatetime', 'endSaleDatetime')
            if (start && end && start > end) {
                throw new UserError(await this._t('The stop date cannot be earlier than the start date.'));
            }
        }
    }

    @api.constrains('seatsAvailable', 'seatsMax')
    async _constrainsSeatsAvailable() {
        if (await this.some(async (record) => await record.seatsMax && await record.seatsAvailable < 0)) {
            throw new ValidationError(await this._t('No more available seats for this ticket.'));
        }
    }

    /**
     * Compute a multiline description of this ticket. It is used when ticket
        description are necessary without having to encode it manually, like sales
        information.
     * @returns 
     */
    async _getTicketMultilineDescription() {
        return f('%s\n%s', await this['displayName'], await (await this['eventId']).displayName);
    }

    async _setTzContext() {
        this.ensureOne();
        return this.withContext({tz: await (await this['eventId']).dateTz || 'UTC'});
    }

    async isLaunched() {
        this.ensureOne();
        if (await this['startSaleDatetime']) {
            const ticket = await this._setTzContext();
            const currentDatetime = await _Datetime.contextTimestamp(ticket, _Datetime.now());
            const startSaleDatetime = await _Datetime.contextTimestamp(ticket, await ticket.startSaleDatetime);
            return startSaleDatetime <= currentDatetime;
        }
        else {
            return true;
        }
    }

    @api.ondelete(false)
    async _unlinkExceptIfRegistrations() {
        if ((await this['registrationIds']).ok) {
            throw new UserError(await this._t(
                "The following tickets cannot be deleted while they have one or more registrations linked to them:\n- %s",
                (await this.mapped('label')).join('\n- ')
            ));
        }
    }
}
