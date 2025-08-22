import { _Datetime, _super, api, Fields, MetaModel, Model } from "../../../core";
import { AccessError, ValidationError } from "../../../core/helper";
import { _f2, addDate, bool, diffDate, emailNormalize, emailNormalizeAll, f, formatDatetime, isInstance, today } from "../../../core/tools";

@MetaModel.define()
class EventRegistration extends Model {
    static _module = module;
    static _name = 'event.registration';
    static _description = 'Event Registration';
    static _parents = ['mail.thread', 'mail.activity.mixin'];
    static _order = 'id desc';

    // event
    static eventId = Fields.Many2one(
        'event.event', {
            string: 'Event', required: true,
        readonly: true, states: { 'draft': [['readonly', false]] }
    });
    static eventTicketId = Fields.Many2one(
        'event.event.ticket', {
            string: 'Event Ticket', readonly: true, ondelete: 'restrict',
        states: { 'draft': [['readonly', false]] }
    });
    static active = Fields.Boolean({ default: true });
    // utm informations
    static utmCampaignId = Fields.Many2one('utm.campaign', 'Campaign', { index: true, ondelete: 'set null' });
    static utmSourceId = Fields.Many2one('utm.source', 'Source', { index: true, ondelete: 'set null' });
    static utmMediumId = Fields.Many2one('utm.medium', 'Medium', { index: true, ondelete: 'set null' });
    // attendee
    static partnerId = Fields.Many2one(
        'res.partner', {
            string: 'Booked by',
        states: { 'done': [['readonly', true]] }
    });
    static label = Fields.Char(
        {
            string: 'Attendee Name', index: true,
            compute: '_computeName', readonly: false, store: true, tracking: 10
        });
    static email = Fields.Char({ string: 'Email', compute: '_computeEmail', readonly: false, store: true, tracking: 11 });
    static phone = Fields.Char({ string: 'Phone', compute: '_computePhone', readonly: false, store: true, tracking: 12 });
    static mobile = Fields.Char({ string: 'Mobile', compute: '_computeMobile', readonly: false, store: true, tracking: 13 });
    // organization
    static dateOpen = Fields.Datetime({ string: 'Registration Date', readonly: true, default: self => _Datetime.now() })  // weird crash is directly now
    static dateClosed = Fields.Datetime({
        string: 'Attended Date', compute: '_computeDateClosed',
        readonly: false, store: true
    });
    static eventBeginDate = Fields.Datetime({ string: "Event Start Date", related: 'eventId.dateBegin', readonly: true });
    static eventEndDate = Fields.Datetime({ string: "Event End Date", related: 'eventId.dateEnd', readonly: true });
    static companyId = Fields.Many2one(
        'res.company', {
            string: 'Company', related: 'eventId.companyId',
        store: true, readonly: true, states: { 'draft': [['readonly', false]] }
    });
    static state = Fields.Selection([
        ['draft', 'Unconfirmed'], ['cancel', 'Cancelled'],
        ['open', 'Confirmed'], ['done', 'Attended']],
        { string: 'Status', default: 'draft', readonly: true, copy: false, tracking: true });

    /**
     * Keep an explicit onchange on partnerId. Rationale : if user explicitly
        changes the partner in interface, he want to update the whole customer
        information. If partnerId is updated in code (e.g. updating your personal
        information after having registered in website_event_sale) fields with a
        value should not be reset as we don't know which one is the right one.

        In other words
          * computed fields based on partnerId should only update missing
            information. Indeed automated code cannot decide which information
            is more accurate;
          * interface should allow to update all customer related information
            at once. We consider event users really want to update all fields
            related to the partner;
     * @returns 
     */
    @api.onchange('partnerId')
    async _onchangePartnerId() {
        for (const registration of this) {
            if ((await registration.partnerId).ok) {
                await registration.update(await registration._synchronizePartnerValues(await registration.partnerId));
            }
        }
    }

    async _computeContactField(fname) {
        for (const registration of this) {
            if (!await registration[fname] && (await registration.partnerId).ok) {
                await registration.set(fname, (await registration._synchronizePartnerValues(
                    await registration.partnerId, [fname]
                ))[fname] || false);
            }
        }
    }

    @api.depends('partnerId')
    async _computeName() {
        await this._computeContactField('label');
    }

    @api.depends('partnerId')
    async _computeEmail() {
        await this._computeContactField('email');
    }

    @api.depends('partnerId')
    async _computePhone() {
        await this._computeContactField('phone');
    }

    @api.depends('partnerId')
    async _computeMobile() {
        await this._computeContactField('mobile');
    }

    @api.depends('state')
    async _computeDateClosed() {
        for (const registration of this) {
            if (!await registration.dateClosed) {
                if (await registration.state == 'done') {
                    await registration.set('dateClosed', _Datetime.now());
                }
                else {
                    await registration.set('dateClosed', false);
                }
            }
        }
    }

    @api.constrains('eventId', 'state')
    async _checkSeatsLimit() {
        for (const registration of this) {
            const event = await registration.eventId;
            if (await event.seatsLimited && await event.seatsMax && await event.seatsAvailable < (await registration.state == 'draft' ? 1 : 0)) {
                throw new ValidationError(await this._t('No more seats available for this event.'));
            }
        }
    }

    @api.constrains('eventTicketId', 'state')
    async _checkTicketSeatsLimit() {
        for (const record of this) {
            const eventTicket = await record.eventTicketId;
            if (await eventTicket.seatsMax && await eventTicket.seatsAvailable < 0) {
                throw new ValidationError(await this._t('No more available seats for this ticket'));
            }
        }
    }

    @api.constrains('eventId', 'eventTicketId')
    async _checkEventTicket() {
        if (await this.some(async (registration) => (await registration.eventTicketId).ok && (await registration.eventId).ne(await (await registration.eventTicketId).eventId))) {
            throw new ValidationError(await this._t('Invalid event / ticket choice'));
        }
    }

    async _synchronizePartnerValues(partner, fnames?: string[]) {
        if (fnames == null) {
            fnames = ['label', 'email', 'phone', 'mobile'];
        }
        if (bool(partner)) {
            const contactId = (await partner.addressGet())['contact'] ?? false;
            if (bool(contactId)) {
                const contact = this.env.items('res.partner').browse(contactId);
                const result = {};
                for (const fname of fnames) {
                    if (await contact[fname]) {
                        result[fname] = await contact[fname];
                    }
                }
                return result;
            }
        }
        return {}
    }

    // ------------------------------------------------------------
    // CRUD
    // ------------------------------------------------------------

    @api.modelCreateMulti()
    async create(valsList) {
        const registrations = await _super(EventRegistration, this).create(valsList);

        // autoConfirm if possible; if not automatically confirmed, call mail schedulers in case
        // some were created already open
        if (await registrations._checkAutoConfirmation()) {
            await (await registrations.sudo()).actionConfirm();
        }
        else if (!(this.env.context['installMode'] ?? false)) {
            // running the scheduler for demo data can cause an issue where wkhtmltopdf runs during
            // server start and hangs indefinitely, leading to serious crashes
            // we currently avoid this by not running the scheduler, would be best to find the actual
            // reason for this issue and fix it so we can remove this check
            await registrations._updateMailSchedulers();
        }

        return registrations;
    }

    async write(vals) {
        let preDraft = this.env.items('event.registration');
        if (vals['state'] == 'open') {
            preDraft = await this.filtered(async (registration) => await registration.state == 'draft');
        }

        const ret = await _super(EventRegistration, this).write(vals);

        if (vals['state'] == 'open' && !(this.env.context['installMode'] ?? false)) {
            // running the scheduler for demo data can cause an issue where wkhtmltopdf runs during
            // server start and hangs indefinitely, leading to serious crashes
            // we currently avoid this by not running the scheduler, would be best to find the actual
            // reason for this issue and fix it so we can remove this check
            await preDraft._updateMailSchedulers();
        }

        return ret;
    }

    /**
     * Custom nameGet implementation to better differentiate registrations
        linked to a given partner but with different label (one partner buying
        several registrations)

          * label, partnerId has no label -> take label
          * partnerId has label, label void or same -> take partner label
          * both have label: partner + label
     */
    async nameGet() {
        const retList = [];
        for (const registration of this) {
            const partner = await registration.partnerId;
            let label;
            if (await partner.label) {
                if (await registration.label && await registration.label != await partner.label) {
                    label = f('%s, %s', await partner.label, await registration.label);
                }
                else {
                    label = await partner.label;
                }
            }
            else {
                label = await registration.label;
            }
            retList.push([registration.id, label]);
        }
        return retList;
    }

    async _checkAutoConfirmation() {
        if (await this.some(async (registration) => {
            const event = await registration.eventId;
            return !await event.autoConfirm || (!await event.seatsAvailable && await event.seatsLimited)
        })) {
            return false;
        }
        return true;
    }

    // ------------------------------------------------------------
    // ACTIONS / BUSINESS
    // ------------------------------------------------------------

    async actionSetDraft() {
        await this.write({ 'state': 'draft' });
    }

    async actionConfirm() {
        await this.write({ 'state': 'open' });
    }

    /**
     * Close Registration
     */
    async actionSetDone() {
        await this.write({ 'state': 'done' });
    }

    async actionCancel() {
        await this.write({ 'state': 'cancel' });
    }

    /**
     * Open a window to compose an email, with the template - 'event_badge'
            message loaded by default
     * @returns 
     */
    async actionSendBadgeEmail() {
        this.ensureOne();
        const template = await this.env.ref('event.eventRegistrationMailTemplateBadge', false);
        const composeForm = await this.env.ref('mail.emailComposeMessageWizardForm');
        const ctx = {
            default_model: 'event.registration',
            default_resId: this.id,
            default_useTemplate: bool(template),
            default_templateId: bool(template) && template.id,
            default_compositionMode: 'comment',
            customLayout: "mail.mailNotificationLight",
        };
        return {
            'label': await this._t('Compose Email'),
            'type': 'ir.actions.actwindow',
            'viewMode': 'form',
            'resModel': 'mail.compose.message',
            'views': [[composeForm.id, 'form']],
            'viewId': composeForm.id,
            'target': 'new',
            'context': ctx,
        }
    }

    /**
     * Update schedulers to set them as running again, and cron to be called
        as soon as possible.
     * @returns 
     */
    async _updateMailSchedulers() {
        const openRegistrations = await this.filtered(async (registration) => await registration.state == 'open');
        if (!bool(openRegistrations)) {
            return;
        }

        const onsubscribeSchedulers = await (await this.env.items('event.mail').sudo()).search([
            ['eventId', 'in', (await openRegistrations.eventId).ids],
            ['intervalType', '=', 'afterSub']
        ]);
        if (!bool(onsubscribeSchedulers)) {
            return;
        }

        await onsubscribeSchedulers.update({ 'mailDone': false });
        // we could simply call _create_missing_mail_registrations and let cron do their job
        // but it currently leads to several delays. We therefore call execute until
        // cron triggers are correctly used
        await (await onsubscribeSchedulers.withUser(global.SUPERUSER_ID)).execute();
    }

    // ------------------------------------------------------------
    // MAILING / GATEWAY
    // ------------------------------------------------------------

    async _messageGetSuggestedRecipients() {
        const recipients = await _super(EventRegistration, this)._messageGetSuggestedRecipients();
        let publicUsers = await this.env.items('res.users').sudo();
        const publicGroups = await this.env.ref("base.groupPublic", false);
        if (bool(publicGroups)) {
            publicUsers = await (await (await publicGroups.sudo()).withContext({ activeTest: false })).mapped("users");
        }
        try {
            for (const attendee of this) {
                const isPublic = bool(publicUsers) ? publicUsers.includes(await (await (await (await attendee.sudo()).withContext({ activeTest: false })).partnerId).userIds) : false;
                if ((await attendee.partnerId).ok && !isPublic) {
                    await attendee._messageAddSuggestedRecipient(recipients, { partner: await attendee.partnerId, reason: await this._t('Customer') });
                }
                else if (await attendee.email) {
                    await attendee._messageAddSuggestedRecipient(recipients, { email: await attendee.email, reason: await this._t('Customer Email') });
                }
            }
        } catch (e) {
            if (!isInstance(e, AccessError)) {     // no read access rights -> ignore suggested recipients
                throw e;
            }
        }
        return recipients;
    }

    async _messageGetDefaultRecipients() {
        // Prioritize registration email over partnerId, which may be shared when a single
        // partner booked multiple seats
        const result = {};
        for (const r of this) {
            result[r.id] = {
                'partnerIds': [],
                'emailTo': emailNormalizeAll(await r.email).join(',') || await r.email,
                'emailCc': false,
            }
        }
        return result;
    }

    async _messagePostAfterHook(message, msgVals) {
        if (await this['email'] && !(await this['partnerId']).ok) {
            // we consider that posting a message with a specified recipient (not a follower, a specific one)
            // on a document without customer means that it was created through the chatter using
            // suggested recipients. This heuristic allows to avoid ugly hacks in JS.
            const emailNormalized = emailNormalize(await this['email']);
            const newPartner = await (await message.partnerIds).filtered(
                async (partner) => await partner.email == await this['email'] || (emailNormalized && await partner.emailNormalized == emailNormalized)
            );
            if (bool(newPartner)) {
                let emailDomain;
                if (await newPartner[0].emailNormalized) {
                    emailDomain = ['email', 'in', [await newPartner[0].email, await newPartner[0].emailNormalized]];
                }
                else {
                    emailDomain = ['email', '=', await newPartner[0].email];
                }
                await (await this.search([
                    ['partnerId', '=', false], emailDomain, ['state', 'not in', ['cancel']],
                ])).write({ 'partnerId': newPartner[0].id });
            }
        }
        return _super(EventRegistration, this)._messagePostAfterHook(message, msgVals);
    }

    // ------------------------------------------------------------
    // TOOLS
    // ------------------------------------------------------------

    async getDateRangeStr() {
        this.ensureOne();
        const now = _Datetime.now();
        const eventDate: Date = await this['eventBeginDate'];
        const diff = diffDate(today(eventDate), today(now));
        if (diff.days <= 0) {
            return this._t('today');
        }
        else if (diff.days == 1) {
            return this._t('tomorrow');
        }
        else if (diff.days < 7) {
            return this._t('in %s days', diff.days);
        }
        else if (diff.days < 14) {
            return this._t('next week');
        }
        else if (eventDate.getMonth() == (addDate(now, { months: 1 })).getMonth()) {
            return this._t('next month');
        }
        else {
            return _f2(await this._t('on %(date)s'), { date: await formatDatetime(this.env, await this['eventBeginDate'], await (await this['eventId']).dateTz, 'medium') });
        }
    }

    async _getRegistrationSummary() {
        this.ensureOne();
        const event = await this['eventId'];
        return {
            'id': this.id,
            'label': await this['label'],
            'partnerId': (await this['partnerId']).id,
            'ticketName': await (await this['eventTicketId']).label || await this._t('None'),
            'eventId': event.id,
            'eventDisplayName': await event.displayName,
            'companyName': (await event.companyId).ok && await (await event.companyId).label || false,
        }
    }
}
