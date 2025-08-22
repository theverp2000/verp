import { RRule, Weekday } from "rrule"
import { _super, MetaModel, Model } from "../../../core/models"
import { _Date, api, Fields } from "../../../core"
import { addDate, bool, dateMin, extend, len, parseInt, range, range2, setDate, some, subDate } from "../../../core/tools"
import { ValidationError } from "../../../core/helper"
import { monthrange } from "../../../core/tools/calendar"

export const MONTHS = {
    'january': 31,
    'february': 28,
    'march': 31,
    'april': 30,
    'may': 31,
    'june': 30,
    'july': 31,
    'august': 31,
    'september': 30,
    'october': 31,
    'november': 30,
    'december': 31,
}

export const DAYS = {
    'mon': RRule.MO,
    'tue': RRule.TU,
    'wed': RRule.WE,
    'thu': RRule.TH,
    'fri': RRule.FR,
    'sat': RRule.SA,
    'sun': RRule.SU,
}

export const WEEKS = {
    'first': 1,
    'second': 2,
    'third': 3,
    'last': 4,
}

@MetaModel.define()
class ProjectTaskRecurrence extends Model {
    static _module = module;
    static _name = 'project.task.recurrence';
    static _description = 'Task Recurrence';

    static taskIds = Fields.One2many('project.task', 'recurrenceId', {copy: false});
    static nextRecurrenceDate = Fields.Date();
    static recurrenceLeft = Fields.Integer({string: "Number of Tasks Left to Create", copy: false});

    static repeatInterval = Fields.Integer({string: 'Repeat Every', default: 1});
    static repeatUnit = Fields.Selection([
        ['day', 'Days'],
        ['week', 'Weeks'],
        ['month', 'Months'],
        ['year', 'Years'],
    ], {default: 'week'});
    static repeatType = Fields.Selection([
        ['forever', 'Forever'],
        ['until', 'End Date'],
        ['after', 'Number of Repetitions'],
    ], {default: "forever", string: "Until"});
    static repeatUntil = Fields.Date({string: "End Date"});
    static repeatNumber = Fields.Integer({string: "Repetitions"});

    static repeatOnMonth = Fields.Selection([
        ['date', 'Date of the Month'],
        ['day', 'Day of the Month'],
    ]);

    static repeatOnYear = Fields.Selection([
        ['date', 'Date of the Year'],
        ['day', 'Day of the Year'],
    ]);

    static mon = Fields.Boolean({string: "Mon"});
    static tue = Fields.Boolean({string: "Tue"});
    static wed = Fields.Boolean({string: "Wed"});
    static thu = Fields.Boolean({string: "Thu"});
    static fri = Fields.Boolean({string: "Fri"});
    static sat = Fields.Boolean({string: "Sat"});
    static sun = Fields.Boolean({string: "Sun"});

    static repeatDay = Fields.Selection([
        Array.from(range(1, 32)).map(i => [String(i), String(i)])
    ]);
    static repeatWeek = Fields.Selection([
        ['first', 'First'],
        ['second', 'Second'],
        ['third', 'Third'],
        ['last', 'Last'],
    ]);
    static repeatWeekday = Fields.Selection([
        ['mon', 'Monday'],
        ['tue', 'Tuesday'],
        ['wed', 'Wednesday'],
        ['thu', 'Thursday'],
        ['fri', 'Friday'],
        ['sat', 'Saturday'],
        ['sun', 'Sunday'],
    ], {string: 'Day Of The Week', readonly: false});
    static repeatMonth = Fields.Selection([
        ['january', 'January'],
        ['february', 'February'],
        ['march', 'March'],
        ['april', 'April'],
        ['may', 'May'],
        ['june', 'June'],
        ['july', 'July'],
        ['august', 'August'],
        ['september', 'September'],
        ['october', 'October'],
        ['november', 'November'],
        ['december', 'December'],
    ]);

    @api.constrains('repeatUnit', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')
    async _checkRecurrenceDays() {
        for (const project of await this.filtered(async (p) => await p.repeatUnit == 'week')) {
            if (! some(await project('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'))) {
                throw new ValidationError('You should select a least one day');
            }
        }
    }

    @api.constrains('repeatInterval')
    async _checkRepeatInterval() {
        if (bool(await this.filtered(async (t) => await t.repeatInterval <= 0))) {
            throw new ValidationError('The interval should be greater than 0');
        }
    }

    @api.constrains('repeatNumber', 'repeatType')
    async _checkRepeatNumber() {
        if (bool(await this.filtered(async (t) => await t.repeatType == 'after' && await t.repeatNumber <= 0))) {
            throw new ValidationError('Should repeat at least once');
        }
    }

    @api.constrains('repeatType', 'repeatUntil')
    async _checkRepeatUntilDate() {
        const today = _Date.today();
        if (bool(await this.filtered(async (t) => await t.repeatType == 'until' && await t.repeatUntil < today))) {
            throw new ValidationError('The end date should be in the future');
        }
    }

    @api.constrains('repeatUnit', 'repeatOnMonth', 'repeatDay', 'repeatType', 'repeatUntil')
    async _checkRepeatUntilMonth() {
        if (bool(await this.filtered(async (r) => await r.repeatType == 'until' && await r.repeatUnit == 'month' && await r.repeatUntil && await r.repeatOnMonth == 'date' && parseInt(await r.repeatDay) > (await r.repeatUntil).getDate() && monthrange((await r.repeatUntil).getFullYear(), (await r.repeatUntil).getMonth()+1)[1] != (await r.repeatUntil).getDate()))) {
            throw new ValidationError('The end date should be after the day of the month or the last day of the month');
        }
    }

    @api.model()
    _getRecurringFields() {
        return ['messagePartnerIds', 'companyId', 'description', 'displayedImageId', 'emailCc',
            'parentId', 'partnerEmail', 'partnerId', 'partnerPhone', 'plannedHours',
            'projectId', 'displayProjectId', 'projectPrivacyVisibility', 'sequence', 'tagIds', 'recurrenceId',
            'label', 'recurringTask', 'analyticAccountId'];
    }

    async _getWeekdays(n=1) {
        this.ensureOne();
        if (await this['repeatUnit'] == 'week') {
            const res = []
            for (const [day, fn] of Object.entries<Weekday>(DAYS)) {
                if (await this[day]) {
                    res.push(fn.nth(n));
                }
            }
        }
        return [DAYS[await this['repeatWeekday']](n)];
    }

    @api.model()
    async _getNextRecurringDates(dateStart, repeatInterval, repeatUnit, repeatType, repeatUntil, repeatOnMonth, repeatOnYear, weekdays, repeatDay, repeatWeek, repeatMonth, opts={}) {
        let count = opts['count'] ?? 1;
        const rruleOpts = {'interval': repeatInterval || 1, 'dtstart': dateStart};
        repeatDay = parseInt(repeatDay);
        let start: any = false;
        const dates = [];
        if (repeatType == 'until') {
            rruleOpts['until'] = repeatUntil ? repeatUntil : _Date.today();
        }
        else {
            rruleOpts['count'] = count;
        }
        if (repeatUnit == 'week'
            || (repeatUnit == 'month' && repeatOnMonth == 'day')
            || (repeatUnit == 'year' && repeatOnYear == 'day')) {
            rruleOpts['byweekday'] = weekdays;
        }

        if (repeatUnit == 'day') {
            rruleOpts['freq'] = RRule.DAILY;
        }
        else if (repeatUnit == 'month') {
            rruleOpts['freq'] = RRule.MONTHLY;
            if (repeatOnMonth == 'date') {
                start = subDate(dateStart, {days: 1});
                start = setDate(start, {day: Math.min(repeatDay, monthrange(start.getFullYear(), start.getMonth()+1)[1])});
                if (start < dateStart) {
                    // Ensure the next recurrence is in the future
                    start = addDate(start, {months: repeatInterval});
                    start = setDate(start, {day: Math.min(repeatDay, monthrange(start.getFullYear(), start.getMonth()+1)[1])});
                }
                const canGenerateDate = repeatType == 'until' 
                ? () => start <= repeatUntil
                : () => len(dates) < count;
                while (canGenerateDate()) {
                    dates.push(start);
                    start = addDate(start, {months: repeatInterval});
                    start = setDate(start, {day: Math.min(repeatDay, monthrange(start.getFullYear(), start.getMonth()+1)[1])});
                }
                return dates;
            }
        }
        else if (repeatUnit == 'year') {
            rruleOpts['freq'] = RRule.YEARLY;
            const month = repeatMonth ? Object.keys(MONTHS).indexOf(repeatMonth) + 1 : dateStart.getMonth() + 1;
            repeatMonth = repeatMonth || Object.keys(MONTHS)[month - 1];
            rruleOpts['bymonth'] = month;
            if (repeatOnYear == 'date') {
                rruleOpts['bymonthday'] = Math.min(repeatDay, MONTHS[repeatMonth]);
                rruleOpts['bymonth'] = month;
            }
        }
        else {
            rruleOpts['freq'] = RRule.WEEKLY;
        }

        const rules = new RRule(rruleOpts);
        return rules.count() ? rules.all() : [];
    }

    async _newTaskValues(task) {
        this.ensureOne();
        const fieldsToCopy = this._getRecurringFields();
        const taskValues = (await task.read(fieldsToCopy)).pop();
        const createValues = {};
        for (const [field, value] of taskValues.items()) {
            createValues[field] = Array.isArray(value) ? value[0] : value; 
        }
        createValues['stageId'] = bool(await (await task.projectId).typeIds) ? (await (await task.projectId).typeIds)[0].id : (await task.stageId).id;
        createValues['userIds'] = false;
        return createValues;
    }

    async _createSubtasks(task, newTask, depth=3) {
        if (depth == 0 || !(await task.childIds).ok) {
            return;
        }
        const children = [],
        childRecurrence = [];
        // copy the subtasks of the original task
        for (const child of await task.childIds) {
            if ((await child.recurrenceId).ok && childRecurrence.includes((await child.recurrenceId).id)) {
                // The subtask has been generated by another subtask in the childs
                // This subtasks is skipped as it will be meant to be a copy of the first
                // task of the recurrence we just created.
                continue;
            }
            const childValues = await this._newTaskValues(child);
            childValues['parentId'] = newTask.id;
            if ((await child.recurrenceId).ok) {
                // The subtask has a recurrence, the recurrence is thus copied rather than used
                // with raw reference in order to decouple the recurrence of the initial subtask
                // from the recurrence of the copied subtask which will live its own life and generate
                // subsequent tasks.
                childRecurrence.push((await child.recurrenceId).id);
                childValues['recurrenceId'] = (await (await child.recurrenceId).copy()).id;
            }
            if ((await child.childIds).ok && depth > 1) {
                // If child has childs in the following layer and we will have to copy layer, we have to
                // first create the new_child record in order to have a new parent_id reference for the
                // "grandchildren" tasks
                const newChild = await (await this.env.items('project.task').sudo()).create(childValues);
                await this._createSubtasks(child, newChild, depth - 1);
            }
            else {
                children.push(childValues);
            }
        }
        const childrenTasks = await (await this.env.items('project.task').sudo()).create(children);
    }

    async _createNextTask() {
        for (const recurrence of this) {
            const taskIds = await (await recurrence.sudo()).taskIds;
            const maxId = Math.max(...taskIds.ids);
            const createValues = await recurrence._newTaskValues(taskIds[maxId]);
            const newTask = await (await this.env.items('project.task').sudo()).create(createValues);
            await recurrence._createSubtasks(taskIds[maxId], newTask, 3);
        }
    }

    async _setNextRecurrenceDate() {
        const today = _Date.today();
        const tomorrow = addDate(today, {days: 1});
        for (const recurrence of await this.filtered(
            async (r) => {
                const repeatType = await r.repeatType;
                return repeatType == 'after' && await r.recurrenceLeft >= 0
                || repeatType == 'until' && await r.repeatUntil >= today
                || repeatType == 'forever';
            }
        )) {
            if (await recurrence.repeatType == 'after' && await recurrence.recurrenceLeft == 0) {
                await recurrence.set('nextRecurrenceDate', false);
            }
            else {
                const nextDate = await this._getNextRecurringDates(tomorrow, await recurrence.repeatInterval, await recurrence.repeatUnit, await recurrence.repeatType, await recurrence.repeatUntil, await recurrence.repeatOnMonth, await recurrence.repeatOnYear, await recurrence._getWeekdays(), await recurrence.repeatDay, await recurrence.repeatWeek, await recurrence.repeatMonth, {count: 1});
                await recurrence.set('nextRecurrenceDate', nextDate.length ? nextDate[0] : false);
            }
        }
    }

    @api.model()
    async _cronCreateRecurringTasks() {
        if (! await (await this.env.user()).hasGroup('project.groupProjectRecurringTasks')) {
            return;
        }
        const today = _Date.today();
        const recurringToday = await this.search([['nextRecurrenceDate', '<=', today]]);
        await recurringToday._createNextTask();
        for (const recurrence of await recurringToday.filtered(async (r) => await r.repeatType == 'after')) {
            await recurrence.set('recurrenceLeft', await recurrence.recurrenceLeft - 1);
        }
        await recurringToday._setNextRecurrenceDate();
    }

    @api.model()
    async create(vals) {
        if (vals['repeatNumber']) {
            vals['recurrenceLeft'] = vals['repeatNumber'];
        }
        const res = await _super(ProjectTaskRecurrence, this).create(vals);
        await res._setNextRecurrenceDate();
        return res;
    }

    async write(vals) {
        if (vals['repeatNumber']) {
            vals['recurrenceLeft'] = vals['repeatNumber'];
        }
        const res = await _super(ProjectTaskRecurrence, this).write(vals);

        if (!('nextRecurrenceDate' in vals)) {
            await this._setNextRecurrenceDate();
        }
        return res;
    }
}
