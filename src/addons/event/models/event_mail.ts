import { _Datetime, api, Fields, MetaModel, Model } from "../../../core";
import { getattr } from "../../../core/api";
import { ValidationError } from "../../../core/helper";
import { _f2, addDate, bool, f, len } from "../../../core/tools";

const _INTERVALS = {
    'hours': (interval: number) => ({ hours: interval }),
    'days': (interval: number) => ({ days: interval }),
    'weeks': (interval: number) => ({ days: 7 * interval }),
    'months': (interval: number) => ({ months: interval }),
    'now': () => ({ hours: 0 }),
}

/**
 * Template of event.mail to attach to event.type. Those will be copied
    upon all events created in that type to ease event creation.
 */
@MetaModel.define()
class EventTypeMail extends Model {
    static _module = module;
    static _name = 'event.type.mail';
    static _description = 'Mail Scheduling on Event Category';

    @api.model()
    async _selectionTemplateModel() {
        return [['mail.template', 'Mail']];
    }

    static eventTypeId = Fields.Many2one(
        'event.type', {
            string: 'Event Type',
        ondelete: 'cascade', required: true
    });
    static notificationType = Fields.Selection([['mail', 'Mail']], { string: 'Send', default: 'mail', required: true })
    static intervalNbr = Fields.Integer('Interval', { default: 1 });
    static intervalUnit = Fields.Selection([
        ['now', 'Immediately'],
        ['hours', 'Hours'], ['days', 'Days'],
        ['weeks', 'Weeks'], ['months', 'Months']],
        { string: 'Unit', default: 'hours', required: true });
    static intervalType = Fields.Selection([
        ['afterSub', 'After each registration'],
        ['beforeEvent', 'Before the event'],
        ['afterEvent', 'After the event']],
        { string: 'Trigger', default: "beforeEvent", required: true });
    static templateModelId = Fields.Many2one('ir.model', { string: 'Template Model', compute: '_computeTemplateModelId', computeSudo: true });
    static templateRef = Fields.Reference({ string: 'Template', selection: '_selectionTemplateModel', required: true });

    @api.depends('notificationType')
    async _computeTemplateModelId() {
        const mailModel = await this.env.items('ir.model')._get('mail.template');
        for (const mail of this) {
            await mail.set('templateModelId', await mail.notificationType == 'mail' ? mailModel : false);
        }
    }

    async _prepareEventMailValues() {
        this.ensureOne();
        return {
            'notificationType': await this['notificationType'],
            'intervalNbr': await this['intervalNbr'],
            'intervalUnit': await this['intervalUnit'],
            'intervalType': await this['intervalType'],
            'templateRef': f('%s,%s', (await this['templateRef'])._name, (await this['templateRef']).id)
        }
    }
}

/**
 * Event automated mailing. This model replaces all existing fields and
    configuration allowing to send emails on events since Verp 9. A cron exists
    that periodically checks for mailing to run.
 */
@MetaModel.define()
class EventMailScheduler extends Model {
    static _module = module;
    static _name = 'event.mail';
    static _recName = 'eventId';
    static _description = 'Event Automated Mailing';

    @api.model()
    async _selectionTemplateModel() {
        return [['mail.template', 'Mail']];
    }

    async _selectionTemplateModelGetMapping() {
        return { 'mail': 'mail.template' }
    }

    @api.onchange('notificationType')
    async setTemplateRefModel() {
        const mailModel = this.env.items('mail.template');
        if (await this['notificationType'] == 'mail') {
            const record = await mailModel.search([['model', '=', 'event.registration']], { limit: 1 });
            await this.set('templateRef', bool(record) ? `mail.template,${record.id}` : false);
        }
    }

    static eventId = Fields.Many2one('event.event', { string: 'Event', required: true, ondelete: 'cascade' });
    static sequence = Fields.Integer('Display order');
    static notificationType = Fields.Selection([['mail', 'Mail']], { string: 'Send', default: 'mail', required: true });
    static intervalNbr = Fields.Integer('Interval', { default: 1 });
    static intervalUnit = Fields.Selection([
        ['now', 'Immediately'],
        ['hours', 'Hours'], ['days', 'Days'],
        ['weeks', 'Weeks'], ['months', 'Months']],
        { string: 'Unit', default: 'hours', required: true });
    static intervalType = Fields.Selection([
        ['afterSub', 'After each registration'],
        ['beforeEvent', 'Before the event'],
        ['afterEvent', 'After the event']],
        { string: 'Trigger ', default: "beforeEvent", required: true });
    static scheduledDate = Fields.Datetime('Schedule Date', { compute: '_computeScheduledDate', store: true });
    // contact and status
    static mailRegistrationIds = Fields.One2many(
        'event.mail.registration', 'schedulerId',
        { help: 'Communication related to event registrations' });
    static mailDone = Fields.Boolean("Sent", { copy: false, readonly: true });
    static mailState = Fields.Selection(
        [['running', 'Running'], ['scheduled', 'Scheduled'], ['sent', 'Sent']],
        { string: 'Global communication Status', compute: '_computeMailState' });
    static mailCountDone = Fields.Integer('# Sent', { copy: false, readonly: true });
    static templateModelId = Fields.Many2one('ir.model', { string: 'Template Model', compute: '_computeTemplateModelId', computeSudo: true });
    static templateRef = Fields.Reference({ string: 'Template', selection: '_selectionTemplateModel', required: true });

    @api.depends('notificationType')
    async _computeTemplateModelId() {
        const mailModel = await this.env.items('ir.model')._get('mail.template');
        for (const mail of this) {
            await mail.set('templateModelId', await mail.notificationType == 'mail' ? mailModel : false);
        }
    }

    @api.depends('eventId.dateBegin', 'eventId.dateEnd', 'intervalType', 'intervalUnit', 'intervalNbr')
    async _computeScheduledDate() {
        for (const scheduler of this) {
            let date, sign;
            if (await scheduler.intervalType == 'afterSub') {
                [date, sign] = [await (await scheduler.eventId).createdAt, 1];
            }
            else if (await scheduler.intervalType == 'beforeEvent') {
                [date, sign] = [await (await scheduler.eventId).dateBegin, -1];
            }
            else {
                [date, sign] = [await (await scheduler.eventId).dateEnd, 1];
            }

            await scheduler.set('scheduledDate', date ? addDate(date, _INTERVALS[await scheduler.intervalUnit](sign * await scheduler.intervalNbr)) : false);
        }
    }

    @api.depends('intervalType', 'scheduledDate', 'mailDone')
    async _computeMailState() {
        for (const scheduler of this) {
            // registrations based
            if (await scheduler.intervalType == 'afterSub') {
                await scheduler.set('mailState', 'running');
            }
            // global event based
            else if (await scheduler.mailDone) {
                await scheduler.set('mailState', 'sent');
            }
            else if (await scheduler.scheduledDate) {
                await scheduler.set('mailState', 'scheduled');
            }
            else {
                await scheduler.set('mailState', 'running');
            }
        }
    }

    @api.constrains('notificationType', 'templateRef')
    async _checkTemplateRefModel() {
        const modelMap = await this._selectionTemplateModelGetMapping();
        for (const record of await this.filtered('templateRef')) {
            const model = modelMap[await record.notificationType];
            if ((await record.templateRef)._name != model) {
                throw new ValidationError(_f2(await this._t('The template which is referenced should be coming from %(modelName)s model.'), { modelName: model }));
            }
        }
    }

    async execute() {
        for (const scheduler of this) {
            const now = _Datetime.now();
            const event = await scheduler.eventId
            if (await scheduler.intervalType == 'afterSub') {
                const mailRegistrationIds = await scheduler.mailRegistrationIds;
                const newRegistrations = (await (await event.registrationIds).filteredDomain(
                    [['state', 'not in', ['cancel', 'draft']]]
                )).sub(await mailRegistrationIds.registrationId);
                await scheduler._createMissingMailRegistrations(newRegistrations);

                // execute scheduler on registrations
                mailRegistrationIds.execute()
                const totalSent = len(await mailRegistrationIds.filtered(reg => reg.mailSent));
                await scheduler.update({
                    'mailDone': totalSent >= (await event.seatsReserved + await event.seatsUsed),
                    'mailCountDone': totalSent,
                });
            }
            else {
                // before or after event -> one shot email
                if (await scheduler.mailDone || await scheduler.notificationType != 'mail') {
                    continue;
                }
                // no template -> ill configured, skip and avoid crash
                if (! await scheduler.templateRef) {
                    continue;
                }
                // do not send emails if the mailing was scheduled before the event but the event is over
                if (await scheduler.scheduledDate <= now && (await scheduler.intervalType != 'beforeEvent' || await event.dateEnd > now)) {
                    await event.mailAttendees((await scheduler.templateRef).id);
                    await scheduler.update({
                        'mailDone': true,
                        'mailCountDone': await event.seatsReserved + await event.seatsUsed,
                    });
                }
            }
        }
        return true;
    }

    async _createMissingMailRegistrations(registrations) {
        let newReg = [];
        for (const scheduler of this) {
            newReg = newReg.concat(await registrations.map(registration => ({
                'registrationId': registration.id,
                'schedulerId': scheduler.id,
            })));
        }
        if (newReg.length) {
            return this.env.items('event.mail.registration').create(newReg);
        }
        return this.env.items('event.mail.registration');
    }

    @api.model()
    async _warnTemplateError(scheduler, exception) {
        // We warn ~ once by hour ~ instead of every 10 min if the interval unit is more than 'hours'.
        if (Math.random() < 0.1666 || ['now', 'hours'].includes(await scheduler.intervalUnit)) {
            const ex = String(exception);
            try {
                const [event, template] = [await scheduler.eventId, await scheduler.templateRef];
                const emails = [...new Set([await (await event.organizerId).email, await (await event.userId).email, await (await template.updatedUid).email])];
                const subject = await this._t("WARNING: Event Scheduler Error for event: %s", await event.label);
                const body = _f2(await this._t(`Event Scheduler for:
  - Event: %(eventName)s (%(eventId)s)
  - Scheduled: %(date)s
  - Template: %(templateName)s (%(templateId)s)

Failed with error:
  - %(error)s

You receive this email because you are:
  - the organizer of the event,
  - or the responsible of the event,
  - or the last writer of the template.
`), {
                    eventName: await event.label,
                    eventId: event.id,
                    date: await scheduler.scheduledDate,
                    templateName: await template.label,
                    templateId: template.id,
                    error: ex
                });
                const email = await this.env.items('ir.mail.server').buildEmail({
                    emailFrom: await (await this.env.user()).email,
                    emailTo: emails,
                    subject, body,
                });
                await this.env.items('ir.mail.server').sendEmail(email);
            } catch (e) {
                console.error("Exception while sending traceback by email: %s.\n Original Traceback:\n%s", e, exception);
                // pass
            }
        }
    }

    /**
     * Backward compatible method, notably if crons are not updated when
        migrating for some reason.
     * @param autocommit 
     * @returns 
     */
    @api.model()
    async run(autocommit = false) {
        return this.scheduleCommunications(autocommit);
    }

    @api.model()
    async scheduleCommunications(autocommit = false) {
        const schedulers = await this.search([
            ['eventId.active', '=', true],
            ['mailDone', '=', false],
            ['scheduledDate', '<=', _Datetime.now()]
        ]);

        for (const scheduler of schedulers) {
            let err;
            try {
                // Prevent a mega prefetch of the registration ids of all the events of all the schedulers
                await this.browse(scheduler.id).execute();
            } catch (e) {
                err = e;
                console.error(e);
                this.invalidateCache();
                await this._warnTemplateError(scheduler, e);
            }
            if (!err) {
                if (autocommit && !getattr(this.env, 'testing', false)) {
                    await this.env.cr.commit();
                }
            }
        }
        return true;
    }
}

@MetaModel.define()
class EventMailRegistration extends Model {
    static _module = module;
    static _name = 'event.mail.registration';
    static _description = 'Registration Mail Scheduler';
    static _recName = 'schedulerId';
    static _order = 'scheduledDate DESC';

    static schedulerId = Fields.Many2one('event.mail', 'Mail Scheduler', { required: true, ondelete: 'cascade' });
    static registrationId = Fields.Many2one('event.registration', 'Attendee', { required: true, ondelete: 'cascade' });
    static scheduledDate = Fields.Datetime('Scheduled Time', { compute: '_computeScheduledDate', store: true });
    static mailSent = Fields.Boolean('Mail Sent');

    async execute() {
        const now = _Datetime.now();
        const todo = await this.filtered(async (regMail) =>
            !await regMail.mailSent &&
            ['open', 'done'].includes(await (await regMail.registrationId).state) &&
            (await regMail.scheduledDate && await regMail.scheduledDate <= now) &&
            await (await regMail.schedulerId).notificationType == 'mail'
        );
        for (const regMail of todo) {
            const organizer = await (await (await regMail.schedulerId).eventId).organizerId;
            const company = await this.env.company();
            let author = await this.env.ref('base.userRoot');
            if (await organizer.email) {
                author = organizer;
            }
            else if (await company.email) {
                author = await company.partnerId;
            }
            else if (await (await this.env.user()).email) {
                author = await this.env.user();
            }

            const emailValues = {
                'authorId': author.id,
            }
            if (!await (await (await regMail.schedulerId).templateRef).emailFrom) {
                emailValues['emailFrom'] = await author.emailFormatted;
            }
            await (await (await regMail.schedulerId).templateRef).sendMail((await regMail.registrationId).id, { emailValues });
        }
        await todo.write({ 'mailSent': true });
    }

    @api.depends('registrationId', 'schedulerId.intervalUnit', 'schedulerId.intervalType')
    async _computeScheduledDate() {
        for (const mail of this) {
            if ((await mail.registrationId).ok) {
                const dateOpen = await (await mail.registrationId).dateOpen;
                const dateOpenDatetime = dateOpen || _Datetime.now();
                await mail.set('scheduledDate', addDate(dateOpenDatetime, _INTERVALS[await (await mail.schedulerId).intervalUnit](await (await mail.schedulerId).intervalNbr)));
            }
            else {
                await mail.set('scheduledDate', false);
            }
        }
    }
}
