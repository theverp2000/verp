import _ from "lodash";
import assert from "node:assert";
import { randomInt } from "node:crypto";
import { _Date, _Datetime, api, Command, Fields, tools } from "../../../core";
import { getattr } from "../../../core/api";
import { AccessError, DefaultDict, DefaultMapKey, Dict, MapKey, UserError, ValidationError } from "../../../core/helper";
import { _super, MetaModel, Model } from "../../../core/models";
import { isFalseLeaf, isTrueLeaf, OR } from "../../../core/osv/expression";
import { _f, _f2, addDate, bool, emailNormalize, emailSplit, extend, f, formatAmount, getLang, isArray, len, pop, range, sorted, stringify, sum, toFormat, update } from "../../../core/tools";
import { literalEval } from "../../../core/tools/ast";
import { handleHistoryDivergence } from "../../web_editor";
import { DAYS, WEEKS } from "./project_task_recurrence";
import { STATUS_COLOR } from "./project_update";

const PROJECT_TASK_READABLE_FIELDS = [
    'id',
    'active',
    'description',
    'priority',
    'kanbanStateLabel',
    'projectId',
    'displayProjectId',
    'color',
    'partnerIsCompany',
    'commercialPartnerId',
    'allowSubtasks',
    'subtaskCount',
    'childText',
    'isClosed',
    'emailFrom',
    'createdAt',
    'updatedAt',
    'companyId',
    'displayedImageId',
    'displayName',
    'portalUserNames',
    'legendNormal',
    'legendBlocked',
    'legendDone',
    'userIds',
];

const PROJECT_TASK_WRITABLE_FIELDS = [
    'label',
    'partnerId',
    'dateDeadline',
    'tagIds',
    'sequence',
    'stageId',
    'kanbanState',
    'childIds',
    'parentId',
    'priority',
];

@MetaModel.define()
class ProjectTaskType extends Model {
    static _module = module;
    static _name = 'project.task.type';
    static _description = 'Task Stage';
    static _order = 'sequence, id';

    async _getDefaultProjectIds() {
        const defaultProjectId = this.env.context['default_projectId'];
        return defaultProjectId ? [defaultProjectId] : null;
    }

    static active = Fields.Boolean('Active', { default: true });
    static label = Fields.Char({ string: 'Name', required: true, translate: true });
    static description = Fields.Text({ translate: true });
    static sequence = Fields.Integer({ default: 1 });
    static projectIds = Fields.Many2many('project.project', { relation: 'projectTaskTypeRel', column1: 'typeId', column2: 'projectId', string: 'Projects', default: self => self._getDefaultProjectIds() });
    static legendBlocked = Fields.Char(
        'Red Kanban Label', {
            default: s => s._t('Blocked'), translate: true, required: true,
        help: 'Override the default value displayed for the blocked state for kanban selection when the task or issue is in that stage.'
    });
    static legendDone = Fields.Char(
        'Green Kanban Label', {
            default: s => s._t('Ready'), translate: true, required: true,
        help: 'Override the default value displayed for the done state for kanban selection when the task or issue is in that stage.'
    });
    static legendNormal = Fields.Char(
        'Grey Kanban Label', {
            default: s => s._t('In Progress'), translate: true, required: true,
        help: 'Override the default value displayed for the normal state for kanban selection when the task or issue is in that stage.'
    });
    static mailTemplateId = Fields.Many2one(
        'mail.template',
        {
            string: 'Email Template',
            domain: [['model', '=', 'project.task']],
            help: "If set, an email will be sent to the customer when the task or issue reaches this step."
        });
    static fold = Fields.Boolean({
        string: 'Folded in Kanban',
        help: 'This stage is folded in the kanban view when there are no records in that stage to display.'
    });
    static ratingTemplateId = Fields.Many2one(
        'mail.template',
        {
            string: 'Rating Email Template',
            domain: [['model', '=', 'project.task']],
            help: "If set and if the project's rating configuration is 'Rating when changing stage', then an email will be sent to the customer when the task reaches this step."
        });
    static autoValidationKanbanState = Fields.Boolean('Automatic kanban status', {
        default: false,
        help: ["Automatically modify the kanban state when the customer replies to the feedback for this stage.\n",
            " * Good feedback from the customer will update the kanban state to 'ready for the new stage' (green bullet).\n",
            " * Neutral or bad feedback will set the kanban state to 'blocked' (red bullet)."].join()
    });
    static isClosed = Fields.Boolean('Closing Stage', { help: "Tasks in this stage are considered as closed." });
    static disabledRatingWarning = Fields.Text({ compute: '_computeDisabledRatingWarning' });

    static userId = Fields.Many2one('res.users', 'Stage Owner', { index: true });

    async unlinkWizard(stageView = false) {
        const self = await this.withContext({ activeTest: false });
        // retrieves all the projects with a least 1 task in that stage
        // a task can be in a stage even if the project is not assigned to the stage
        const readgroup = await (await self.withContext({ activeTest: false })).env.items('project.task').readGroup([['stageId', 'in', self.ids]], ['projectId'], ['projectId']);
        const projectIds = [...new Set(readgroup.map(project => project['projectId'][0]).concat((await self.projectIds).ids))];

        const wizard = await (await self.withContext({ projectIds })).env.items('project.task.type.delete.wizard').create({
            'projectIds': projectIds,
            'stageIds': self.ids
        });

        const context = Object.assign({}, self.env.context);
        context['stageView'] = stageView;
        return {
            'label': await self._t('Delete Stage'),
            'viewMode': 'form',
            'resModel': 'project.task.type.delete.wizard',
            'views': [[self.env.refId('project.viewProjectTaskTypeDeleteWizard'), 'form']],
            'type': 'ir.actions.actwindow',
            'resId': wizard.id,
            'target': 'new',
            'context': context,
        };
    }

    async write(vals) {
        if ('active' in vals && !vals['active']) {
            await (await this.env.items('project.task').search([['stageId', 'in', this.ids]])).write({ 'active': false });
        }
        return _super(ProjectTaskType, this).write(vals);
    }

    @api.depends('projectIds', 'projectIds.ratingActive')
    async _computeDisabledRatingWarning() {
        for (const stage of this) {
            const disabledProjects = await (await stage.projectIds).filtered(async (p) => !await p.ratingActive);
            if (bool(disabledProjects)) {
                await stage.set('disabledRatingWarning', (await disabledProjects.map(async (p) => f('- %s', await p.label))).join('\n'));
            }
            else {
                await stage.set('disabledRatingWarning', false);
            }
        }
    }

    @api.constrains('userId', 'projectIds')
    async _checkPersonalStageNotLinkedToProjects() {
        if (await this.some(async (stage) => bool(await stage.userId) && bool(await stage.projectIds))) {
            throw new UserError(await this._t('A personal stage cannot be linked to a project because it is only visible to its corresponding user.'));
        }
    }

    /**
     * Remove a personal stage, tasks using that stage will move to the first
        stage with a lower priority if it exists higher if not.
        This method will not allow to delete the last personal stage.
        Having no personalStageTypeId makes the task not appear when grouping by personal stage.
     */
    async removePersonalStage() {
        this.ensureOne();
        assert((await this['userId']).eq(await this.env.user()) || this.env.su);

        const usersPersonalStages = this.env.items('project.task.type')
            .search([['userId', '=', (await this['userId']).id]], { order: 'sequence DESC' });
        if (len(usersPersonalStages) == 1) {
            throw new ValidationError(await this._t("You should at least have one personal stage. Create a new stage to which the tasks can be transferred after this one is deleted."));
        }

        // Find the most suitable stage, they are already sorted by sequence
        let newStage = this.env.items('project.task.type');
        for (const stage of usersPersonalStages) {
            if (stage.eq(this)) {
                continue;
            }
            if (await stage.sequence > await this['sequence']) {
                newStage = stage;
            }
            else if (await stage.sequence <= await this['sequence']) {
                newStage = stage;
                break;
            }
        }
        await (await this.env.items('project.task.stage.personal').search([['stageId', '=', this.id]])).write({
            'stageId': newStage.id,
        });
        await this.unlink();
    }
}

@MetaModel.define()
class Project extends Model {
    static _module = module;
    static _name = "project.project";
    static _description = "Project";
    static _parents = ['portal.mixin', 'mail.alias.mixin', 'mail.thread', 'mail.activity.mixin', 'rating.parent.mixin'];
    static _order = "sequence, label, id";
    static _ratingSatisfactionDays = false;  // takes all existing ratings
    static _checkCompanyAuto = true;

    async _computeAttachedDocsCount() {
        const res = await this.env.cr.execute(_f(`
            WITH docs AS (
                 SELECT "resId" as id, count(*) as count
                   FROM "irAttachment"
                  WHERE "resModel" = 'project.project'
                    AND "resId" IN ({projectIds})
               GROUP BY "resId"

              UNION ALL

                 SELECT t."projectId" as id, count(*) as count
                   FROM "irAttachment" a
                   JOIN "projectTask" t ON a."resModel" = 'project.task' AND a."resId" = t.id
                  WHERE t."projectId" IN ({projectIds})
               GROUP BY t."projectId"
            )
            SELECT id, sum(count)
              FROM docs
          GROUP BY id
            `,
            { "projectIds": String(this.ids) || 'NULL' }
        ));
        const docCounts = Object.fromEntries(res.map(row => [row.id, row.count]));
        for (const project of this) {
            await project.set('docCount', docCounts[project.id] || 0);
        }
    }

    async _computeTaskCount() {
        const taskData = await this.env.items('project.task').readGroup(
            [['projectId', 'in', this.ids],
                '|',
            ['stageId.fold', '=', false],
            ['stageId', '=', false]],
            ['projectId', 'displayProjectId:count'], ['projectId']);
        const resultWoSubtask = new DefaultDict(() => 0);
        const resultWithSubtasks = new DefaultDict(() => 0);
        for (const data of taskData) {
            resultWoSubtask[data['projectId'][0]] += data['displayProjectId'];
            resultWithSubtasks[data['projectId'][0]] += data['projectId_count'];
        }
        for (const project of this) {
            await project.set('taskCount', resultWoSubtask[project.id]);
            await project.set('taskCountWithSubtasks', resultWithSubtasks[project.id]);
        }
    }

    async attachmentTreeView() {
        const action = await this.env.items('ir.actions.actions')._forXmlid('base.actionAttachment');
        action['domain'] = JSON.stringify([
            '|',
            '&',
            ['resModel', '=', 'project.project'],
            ['resId', 'in', this.ids],
            '&',
            ['resModel', '=', 'project.task'],
            ['resId', 'in', (await this['taskIds']).ids]
        ]);
        action['context'] = f("{'default_resModel': '%s','default_resId': %s}", this._name, this.id);
        return action;
    }

    async _defaultStageId() {
        // Since project stages are order by sequence first, this should fetch the one with the lowest sequence number.
        return this.env.items('project.project.stage').search([], { limit: 1 });
    }

    async _computeIsFavorite() {
        for (const project of this) {
            await project.set('isFavorite', (await project.favoriteUserIds).includes(await this.env.user()));
        }
    }

    async _inverseIsFavorite() {
        const user = await this.env.user();
        let favoriteProjects = await this.env.items('project.project').sudo();
        let notFavProjects = await this.env.items('project.project').sudo();
        for (const project of this) {
            if ((await project.favoriteUserIds).includes(user)) {
                favoriteProjects = favoriteProjects.or(project);
            }
            else {
                notFavProjects = notFavProjects.or(project);
            }
        }
        // Project User has no write access for project.
        await notFavProjects.write({ 'favoriteUserIds': [[4, this.env.uid]] });
        await favoriteProjects.write({ 'favoriteUserIds': [[3, this.env.uid]] });
    }

    async _getDefaultFavoriteUserIds() {
        return [[6, 0, [this.env.uid]]];
    }

    @api.model()
    async _readGroupStageIds(stages, domain, order) {
        return this.env.items('project.project.stage').search([], { order });
    }

    static label = Fields.Char("Name", { index: true, required: true, tracking: true, translate: true });
    static description = Fields.Html();
    static active = Fields.Boolean({
        default: true,
        help: "If the active field is set to false, it will allow you to hide the project without removing it."
    });
    static sequence = Fields.Integer({ default: 10, help: "Gives the sequence order when displaying a list of Projects." });
    static partnerId = Fields.Many2one('res.partner', { string: 'Customer', autojoin: true, tracking: true, domain: "['|', ['companyId', '=', false], ['companyId', '=', companyId]]" });
    static partnerEmail = Fields.Char({
        compute: '_computePartnerEmail', inverse: '_inversePartnerEmail',
        string: 'Email', readonly: false, store: true, copy: false
    });
    static partnerPhone = Fields.Char({
        compute: '_computePartnerPhone', inverse: '_inversePartnerPhone',
        string: "Phone", readonly: false, store: true, copy: false
    });
    static commercialPartnerId = Fields.Many2one({ related: "partnerId.commercialPartnerId" });
    static companyId = Fields.Many2one('res.company', { string: 'Company', required: true, default: self => self.env.company() });
    static currencyId = Fields.Many2one('res.currency', { related: "companyId.currencyId", string: "Currency", readonly: true });
    static analyticAccountId = Fields.Many2one('account.analytic.account', {
        string: "Analytic Account", copy: false, ondelete: 'SET NULL',
        domain: "['|', ['companyId', '=', false], ['companyId', '=', companyId]]", checkCompany: true,
        help: ["Analytic account to which this project is linked for financial management. ",
            "Use an analytic account to record cost and revenue on your project."].join()
    });
    static analyticAccountBalance = Fields.Monetary({ related: "analyticAccountId.balance" });

    static favoriteUserIds = Fields.Many2many(
        'res.users', {
            relation: 'projectFavoriteUserRel', column1: 'projectId', column2: 'userId',
        default: self => self._getDefaultFavoriteUserIds(),
        string: 'Members'
    });
    static isFavorite = Fields.Boolean({
        compute: '_computeIsFavorite', inverse: '_inverseIsFavorite',
        string: 'Show Project on Dashboard',
        help: "Whether this project should be displayed on your dashboard."
    });
    static labelTasks = Fields.Char({ string: 'Use Tasks as', default: 'Tasks', help: "Label used for the tasks of the project.", translate: true });
    static tasks = Fields.One2many('project.task', 'projectId', { string: "Task Activities" });
    static resourceCalendarId = Fields.Many2one(
        'resource.calendar', {
            string: 'Working Time',
        related: 'companyId.resourceCalendarId'
    });
    static typeIds = Fields.Many2many('project.task.type', { relation: 'projectTaskTypeRel', column1: 'projectId', column2: 'typeId', string: 'Tasks Stages' });
    static taskCount = Fields.Integer({ compute: '_computeTaskCount', string: "Task Count" });
    static taskCountWithSubtasks = Fields.Integer({ compute: '_computeTaskCount' });
    static taskIds = Fields.One2many('project.task', 'projectId', {
        string: 'Tasks',
        domain: ['|', ['stageId.fold', '=', false], ['stageId', '=', false]]
    });
    static color = Fields.Integer({ string: 'Color Index' });
    static userId = Fields.Many2one('res.users', { string: 'Project Manager', default: self => self.env.user(), tracking: true });
    static aliasEnabled = Fields.Boolean({ string: 'Use Email Alias', compute: '_computeAliasEnabled', readonly: false });
    static aliasId = Fields.Many2one('mail.alias', {
        string: 'Alias', ondelete: "RESTRICT", required: true,
        help: ["Internal email associated with this project. Incoming emails are automatically synchronized ",
            "with Tasks (or optionally Issues if the Issue Tracker module is installed)."].join()
    });
    static aliasValue = Fields.Char({ string: 'Alias email', compute: '_computeAliasValue' });
    static privacyVisibility = Fields.Selection([
        ['followers', 'Invited employees'],
        ['employees', 'All employees'],
        ['portal', 'Invited portal users and all employees'],
    ],
        {
            string: 'Visibility', required: true,
            default: 'portal',
            help: ["People to whom this project and its tasks will be visible.\n\n",
                "- Invited internal users: when following a project, internal users will get access to all of its tasks without distinction. ",
                "Otherwise, they will only get access to the specific tasks they are following.\n ",
                "A user with the project > administrator access right level can still access this project and its tasks, even if they are not explicitly part of the followers.\n\n",
                "- All internal users: all internal users can access the project and all of its tasks without distinction.\n\n",
                "- Invited portal users and all internal users: all internal users can access the project and all of its tasks without distinction.\n",
                "When following a project, portal users will get access to all of its tasks without distinction. Otherwise, they will only get access to the specific tasks they are following.\n\n",
                "When a project is shared in read-only, the portal user is redirected to their portal. They can view the tasks, but not edit them.\n",
                "When a project is shared in edit, the portal user is redirected to the kanban and list views of the tasks. They can modify a selected number of fields on the tasks.\n\n",
                "In any case, an internal user with no project access rights can still access a task, ",
                "provided that they are given the corresponding URL (and that they are part of the followers if the project is private)."].join()
        });
    static docCount = Fields.Integer({ compute: '_computeAttachedDocsCount', string: "Number of documents attached" });
    static dateStart = Fields.Date({ string: 'Start Date' });
    static date = Fields.Date({ string: 'Expiration Date', index: true, tracking: true });
    static allowSubtasks = Fields.Boolean('Sub-tasks', { default: async (self) => (await self.env.user()).hasGroup('project.groupSubtaskProject') });
    static allowRecurringTasks = Fields.Boolean('Recurring Tasks', { default: async (self) => (await self.env.user()).hasGroup('project.groupProjectRecurringTasks') });
    static allowTaskDependencies = Fields.Boolean('Task Dependencies', { default: async (self) => (await self.env.user()).hasGroup('project.groupProjectTaskDependencies') });
    static tagIds = Fields.Many2many('project.tags', { relation: 'projectProjectProjectTagsRel', string: 'Tags' });

    // Project Sharing fields
    static collaboratorIds = Fields.One2many('project.collaborator', 'projectId', { string: 'Collaborators', copy: false });
    static collaboratorCount = Fields.Integer('# Collaborators', { compute: '_computeCollaboratorCount', computeSudo: true });

    // rating fields
    static ratingRequestDeadline = Fields.Datetime({ compute: '_computeRatingRequestDeadline', store: true });
    static ratingActive = Fields.Boolean('Customer Ratings', { default: async (self) => (await self.env.user()).hasGroup('project.groupProjectRating') });
    static ratingStatus = Fields.Selection(
        [['stage', 'Rating when changing stage'],
        ['periodic', 'Periodic rating']
        ], {
            string: 'Customer Ratings Status', default: "stage", required: true,
        help: ["How to get customer feedback?\n",
            "- Rating when changing stage: an email will be sent when a task is pulled to another stage.\n",
            "- Periodic rating: an email will be sent periodically.\n\n",
            "Don't forget to set up the email templates on the stages for which you want to get customer feedback."].join()
    });
    static ratingStatusPeriod = Fields.Selection([
        ['daily', 'Daily'],
        ['weekly', 'Weekly'],
        ['bimonthly', 'Twice a Month'],
        ['monthly', 'Once a Month'],
        ['quarterly', 'Quarterly'],
        ['yearly', 'Yearly']], { string: 'Rating Frequency', required: true, default: 'monthly' });

    // Not `required` since this is an option to enable in project settings.
    static stageId = Fields.Many2one('project.project.stage', {
        string: 'Stage', ondelete: 'RESTRICT', groups: "project.groupProjectStages",
        tracking: true, index: true, copy: false, default: self => self._defaultStageId(), groupExpand: '_readGroupStageIds'
    });

    static updateIds = Fields.One2many('project.update', 'projectId');
    static lastUpdateId = Fields.Many2one('project.update', { string: 'Last Update', copy: false });
    static lastUpdateStatus = Fields.Selection({
        selection: [
            ['onTrack', 'On Track'],
            ['atRisk', 'At Risk'],
            ['offTrack', 'Off Track'],
            ['onHold', 'On Hold']
        ], default: 'onTrack', compute: '_computeLastUpdateStatus', store: true
    });
    static lastUpdateColor = Fields.Integer({ compute: '_computeLastUpdateColor' });
    static milestoneIds = Fields.One2many('project.milestone', 'projectId');
    static milestoneCount = Fields.Integer({ compute: '_computeMilestoneCount' });

    static _sqlConstraints = [
        ['project_date_greater', 'check(date >= "dateStart")', 'Error! Project start date must be before project end date.']
    ];

    @api.depends('partnerId.email')
    async _computePartnerEmail() {
        for (const project of this) {
            if (bool(await project.partnerId) && await (await project.partnerId).email != await project.partnerEmail) {
                await project.set('partnerEmail', await (await project.partnerId).email);
            }
        }
    }

    async _inversePartnerEmail() {
        for (const project of this) {
            const partner = await project.partnerId;
            if (partner.ok && await project.partnerEmail != await partner.email) {
                await partner.set('email', await project.partnerEmail);
            }
        }
    }

    @api.depends('partnerId.phone')
    async _computePartnerPhone() {
        for (const project of this) {
            const partner = await project.partnerId;
            if (partner.ok && await project.partnerPhone != await partner.phone) {
                await project.set('partnerPhone', await partner.phone);
            }
        }
    }

    async _inversePartnerPhone() {
        for (const project of this) {
            const partner = await project.partnerId;
            if (partner.ok && await project.partnerPhone != await partner.phone) {
                await partner.set('phone', await project.partnerPhone);
            }
        }
    }

    @api.onchange('aliasEnabled')
    async _onchangeAliasName() {
        if (! await this['aliasEnabled']) {
            await this.set('aliasName', false);
        }
    }

    async _computeAliasEnabled() {
        for (const project of this) {
            await project.set('aliasEnabled', await project.aliasDomain && await (await project.aliasId).aliasName);
        }
    }

    async _computeAccessUrl() {
        await _super(Project, this)._computeAccessUrl();
        for (const project of this) {
            await project.set('accessUrl', f('/my/project/%s', project.id));
        }
    }

    async _computeAccessWarning() {
        await _super(Project, this)._computeAccessWarning();
        for (const project of await this.filtered(async (x) => await x.privacyVisibility != 'portal')) {
            await project.set('accessWarning', await this._t(
                "The project cannot be shared with the recipient(s) because the privacy of the project is too restricted. Set the privacy to 'Visible by following customers' in order to make it accessible by the recipient(s)."));
        }
    }

    @api.depends('ratingStatus', 'ratingStatusPeriod')
    async _computeRatingRequestDeadline() {
        const periods = { 'daily': 1, 'weekly': 7, 'bimonthly': 15, 'monthly': 30, 'quarterly': 90, 'yearly': 365 }
        for (const project of this) {
            await project.set('ratingRequestDeadline', addDate(_Datetime.now(), { days: periods[await project.ratingStatusPeriod] ?? 0 }));
        }
    }

    @api.depends('lastUpdateId.status')
    async _computeLastUpdateStatus() {
        for (const project of this) {
            await project.set('lastUpdateStatus', await (await project.lastUpdateId).status || 'onTrack');
        }
    }

    @api.depends('lastUpdateStatus')
    async _computeLastUpdateColor() {
        for (const project of this) {
            await project.set('lastUpdateColor', STATUS_COLOR[await project.lastUpdateStatus]);
        }
    }

    @api.depends('milestoneIds')
    async _computeMilestoneCount() {
        const readGroup = await this.env.items('project.milestone').readGroup([['projectId', 'in', this.ids]], ['projectId'], ['projectId']);
        const mappedCount = Object.fromEntries(readGroup.map(group => [group['projectId'][0], group['projectId_count']]));
        for (const project of this) {
            await project.set('milestoneCount', mappedCount[project.id] ?? 0);
        }
    }

    @api.depends('aliasName', 'aliasDomain')
    async _computeAliasValue() {
        for (const project of this) {
            if (!await project.aliasName || !await project.aliasDomain) {
                await project.set('aliasValue', '');
            }
            else {
                await project.set('aliasValue', f("%s@%s", await project.aliasName, await project.aliasDomain));
            }
        }
    }

    @api.depends('collaboratorIds', 'privacyVisibility')
    async _computeCollaboratorCount() {
        const projectSharings = await this.filtered(async (project) => await project.privacyVisibility == 'portal');
        const collaboratorReadGroup = await this.env.items('project.collaborator').readGroup(
            [['projectId', 'in', projectSharings.ids]],
            ['projectId'],
            ['projectId'],
        );
        const collaboratorCountByProject = Object.fromEntries(collaboratorReadGroup.map(res => [res['projectId'][0], res['projectId_count']]));
        for (const project of this) {
            await project.set('collaboratorCount', collaboratorCountByProject[project.id] ?? 0);
        }
    }

    /**
     * get the default value for the copied task on project duplication
     * @param task 
     * @param project 
     * @returns 
     */
    @api.model()
    async _mapTasksDefaultValeus(task, project) {
        return {
            'stageId': (await task.stageId).id,
            'label': await task.label,
            'companyId': (await project.companyId).id,
        }
    }

    /**
     * copy and map tasks from old to new project
     * @param newProjectId 
     * @returns 
     */
    async mapTasks(newProjectId) {
        this.ensureOne();
        const project = this.browse(newProjectId);
        let tasks = this.env.items('project.task');
        // We want to copy archived task, but do not propagate an activeTest context key
        let taskIds = (await (await this.env.items('project.task').withContext({ activeTest: false })).search([['projectId', '=', this.id]], { order: 'parentId' })).ids;
        const oldToNewTasks = {}
        let allTasks = this.env.items('project.task').browse(taskIds);
        for (const task of allTasks) {
            // preserve task name and stage, normally altered during copy
            const defaults = await this._mapTasksDefaultValeus(task, project);
            if (bool(await task.parentId)) {
                // set the parent to the duplicated task
                const parentId = oldToNewTasks[(await task.parentId).id] ?? false;
                defaults['parentId'] = parentId;
                if (!bool(parentId) || bool(await task.displayProjectId)) {
                    defaults['projectId'] = (await task.displayProjectId).eq(this) ? project.id : false;
                    defaults['displayProjectId'] = (await task.displayProjectId).eq(this) ? project.id : false;
                }
            }
            else if ((await task.displayProjectId).eq(this)) {
                defaults['projectId'] = project.id;
                defaults['displayProjectId'] = project.id;
            }
            const newTask = await task.copy(defaults);
            // If child are created before parent (ex subSubTasks)
            const newChildIds = await (await (await task.childIds).filtered(child => child.id in oldToNewTasks)).map(child => oldToNewTasks[child.id]);
            await tasks.browse(newChildIds).write({ 'parentId': newTask.id });
            oldToNewTasks[task.id] = newTask.id;
            if (await task.allowTaskDependencies) {
                const dependOnIds = await (await task.dependOnIds).map(t => !allTasks.includes(t) ? t.id : oldToNewTasks[t.id]);
                await newTask.write({ 'dependOnIds': dependOnIds.filter(tid => bool(tid)).map(tid => Command.link(tid)) });
                const dependentIds = await (await task.dependentIds).map(t => !allTasks.includes(t) ? t.id : oldToNewTasks[t.id]);
                await newTask.write({ 'dependentIds': await dependentIds.filter(tid => bool(tid)).map(tid => Command.link(tid)) });
            }
            tasks = tasks.add(newTask);
        }

        return project.write({ 'tasks': [[6, 0, tasks.ids]] });
    }

    @api.returns('self', value => value.id)
    async copy(defaultValue = null) {
        if (defaultValue == null) {
            defaultValue = {};
        }
        if (!defaultValue['label']) {
            defaultValue['label'] = f(await this._t("%s (copy)"), await this['label']);
        }
        const project = await _super(Project, this).copy(defaultValue);
        for (const follower of await this['messageFollowerIds']) {
            await project.messageSubscribe((await follower.partnerId).ids, (await follower.subtypeIds).ids);
        }
        if (!('tasks' in defaultValue)) {
            await this.mapTasks(project.id);
        }
        return project;
    }

    @api.model()
    async create(vals) {
        // Prevent double project creation
        let self = await this.withContext({ mailCreateNosubscribe: true });
        const project = await _super(Project, self).create(vals);
        if (await project.privacyVisibility == 'portal' && (await project.partnerId).ok) {
            await project.messageSubscribe((await project.partnerId).ids);
        }
        return project;
    }

    async write(vals) {
        // directly compute isFavorite to dodge allow write access right
        if ('isFavorite' in vals) {
            pop(vals, 'isFavorite');
            this._fields['isFavorite'].determineInverse(this);
        }
        const res = bool(vals) ? await _super(Project, this).write(vals) : true;

        if ('allowRecurringTasks' in vals && !vals['allowRecurringTasks']) {
            await (await this.env.items('project.task').search([['projectId', 'in', this.ids], ['recurringTask', '=', true]])).write({ 'recurringTask': false });
        }

        if ('active' in vals) {
            // archiving/unarchiving a project does it on its tasks, too
            await (await (await this.withContext({ activeTest: false })).mapped('tasks')).write({ 'active': vals['active'] });
        }
        if (vals['partnerId'] || vals['privacyVisibility']) {
            for (const project of await this.filtered(async (project) => await project.privacyVisibility == 'portal')) {
                await project.messageSubscribe((await project.partnerId).ids);
            }
        }
        if (vals['privacyVisibility']) {
            await this._changePrivacyVisibility();
        }
        if ('label' in vals && (await this['analyticAccountId']).ok) {
            const projectsReadGroup = await this.env.items('project.project').readGroup(
                [['analyticAccountId', 'in', (await this['analyticAccountId']).ids]],
                ['analyticAccountId'],
                ['analyticAccountId']
            );
            const analyticAccountToUpdate = this.env.items('account.analytic.account').browse(
                projectsReadGroup.filter(res => res['analyticAccountId'] && res['analyticAccountId_count'] == 1).map(res => res['analyticAccountId'][0])
            );
            await analyticAccountToUpdate.write({ 'label': await this['label'] });
        }
        return res;
    }

    async actionUnlink() {
        const wizard = await this.env.items('project.delete.wizard').create({
            'projectIds': this.ids
        });

        return {
            'label': await this._t('Confirmation'),
            'viewMode': 'form',
            'resModel': 'project.delete.wizard',
            'views': [[await this.env.refId('project.projectDeleteWizardForm'), 'form']],
            'type': 'ir.actions.actwindow',
            'resId': wizard.id,
            'target': 'new',
            'context': this.env.context,
        }
    }

    @api.ondelete(false)
    async _unlinkExceptContainsTasks() {
        // Check project is empty
        for (const project of await this.withContext({ activeTest: false })) {
            if ((await project.tasks).ok) {
                throw new UserError(await this._t('You cannot delete a project containing tasks. You can either archive it or first delete all of its tasks.'));
            }
        }
    }

    async unlink() {
        // Delete the empty related analytic account
        let analyticAccountsToDelete = this.env.items('account.analytic.account');
        for (const project of this) {
            const analyticAccount = await project.analyticAccountId;
            if (analyticAccount.ok && !(await analyticAccount.lineIds).ok) {
                analyticAccountsToDelete = analyticAccountsToDelete.or(analyticAccount);
            }
        }
        const result = await _super(Project, this).unlink();
        await analyticAccountsToDelete.unlink();
        return result;
    }

    /**
     * Subscribe to all existing active tasks when subscribing to a project
     * @param partnerIds 
     * @param subtypeIds 
     * @returns 
     */
    async messageSubscribe(partnerIds?: any, subtypeIds?: any) {
        const res = await _super(Project, this).messageSubscribe(partnerIds, subtypeIds);
        const projectSubtypes = bool(subtypeIds) ? this.env.items('mail.message.subtype').browse(subtypeIds) : null;
        const taskSubtypes = bool(projectSubtypes) ? (await projectSubtypes.mapped('parentId')).or(await projectSubtypes.filtered(async (sub) => await sub.internal || await sub.default)).ids : null;
        if (!bool(subtypeIds) || bool(taskSubtypes)) {
            await (await this.mapped('tasks')).messageSubscribe(partnerIds, taskSubtypes);
        }
        return res;
    }

    /**
     * Unsubscribe from all tasks when unsubscribing from a project
     * @param partnerIds 
     * @returns 
     */
    async messageUnsubscribe(partnerIds = null) {
        await (await this.mapped('tasks')).messageUnsubscribe(partnerIds);
        return _super(Project, this).messageUnsubscribe(partnerIds);
    }

    async _aliasGetCreationValues() {
        const values = await _super(Project, this)._aliasGetCreationValues();
        values['aliasModelId'] = (await this.env.items('ir.model')._get('project.task')).id;
        if (bool(this.id)) {
            const defaults = literalEval(await this['aliasDefaults'] || "{}");
            defaults['projectId'] = this.id;
            values['aliasDefaults'] = defaults;
        }
        return values;
    }

    // ---------------------------------------------------
    // Mail gateway
    // ---------------------------------------------------

    async _trackTemplate(changes) {
        const res = await _super(Project, this)._trackTemplate(changes);
        const project = this[0];
        if (await this.userHasGroups('project.groupProjectStages') && 'stageId' in changes && (await (await project.stageId).mailTemplateId).ok) {
            res['stageId'] = [await (await project.stageId).mailTemplateId, {
                'autoDeleteMessage': true,
                'subtypeId': await this.env.items('ir.model.data')._xmlidToResId('mail.mtNote'),
                'emailLayoutXmlid': 'mail.mailNotificationLight',
            }];
        }
        return res
    }

    async _trackSubtype(initValues) {
        this.ensureOne();
        if ('stageId' in initValues) {
            return this.env.ref('project.mtProjectStageChange');
        }
        return _super(Project, this)._trackSubtype(initValues);
    }

    async _mailGetMessageSubtypes() {
        let res = await _super(Project, this)._mailGetMessageSubtypes();
        if (len(this) == 1) {
            const dependencySubtype = await this.env.ref('project.mtProjectTaskDependencyChange');
            if (! await this['allowTaskDependencies'] && dependencySubtype in res) {
                res = res.sub(dependencySubtype);
            }
        }
        return res;
    }

    // ---------------------------------------------------
    //  Actions
    // ---------------------------------------------------

    async toggleFavorite() {
        let favoriteProjects = await this.env.items('project.project').sudo();
        let notFavProjects = await this.env.items('project.project').sudo();
        const user = await this.env.user();
        for (const project of this) {
            if ((await project.favoriteUserIds).includes(user)) {
                favoriteProjects = favoriteProjects.or(project);
            }
            else {
                notFavProjects = notFavProjects.or(project);
            }
        }

        // Project User has no write access for project.
        await notFavProjects.write({ 'favoriteUserIds': [[4, this.env.uid]] });
        await favoriteProjects.write({ 'favoriteUserIds': [[3, this.env.uid]] });
    }

    async actionViewTasks() {
        const action = await (await (await (await this.withContext({ activeId: this.id, activeIds: this.ids }))
            .env.ref('project.actProjectProject2ProjectTaskAll'))
            .sudo()).readOne();
        action['displayName'] = await this['label'];
        return action;
    }

    /**
     * return the action to see all the rating of the project and activate default filters
     * @returns 
     */
    async actionViewAllRating() {
        const action = await this.env.items('ir.actions.actions')._forXmlid('project.ratingRatingActionViewProjectRating');
        action['label'] = await this._t('Ratings of %s', await this['label']);
        const actionContext = action['context'] ? literalEval(action['context']) : {};
        update(actionContext, this._context);
        actionContext['searchDefault_parentResName'] = await this['label'];
        pop(actionContext, 'groupby', null);
        return Object.assign(action, { context: actionContext });
    }

    /**
     * return the action to see the tasks analysis report of the project
     * @returns 
     */
    async actionViewTasksAnalysis() {
        const action = await this.env.items('ir.actions.actions')._forXmlid('project.actionProjectTaskUserTree');
        const actionContext = action['context'] ? literalEval(action['context']) : {};
        actionContext['searchDefault_projectId'] = this.id;
        return Object.assign(action, { context: actionContext });
    }

    @api.model()
    async _actionOpenAllProjects() {
        const action = await this.env.items('ir.actions.actions')._forXmlid(
            !await this.userHasGroups('project.groupProjectStages') ?
                'project.openViewProjectAll' :
                'project.openViewProjectAllGroupStage');
        return action;
    }

    async actionViewAnalyticAccountEntries() {
        this.ensureOne();
        return {
            'resModel': 'account.analytic.line',
            'type': 'ir.actions.actwindow',
            'label': await this._t("Gross Margin"),
            'domain': [['accountId', '=', (await this['analyticAccountId']).id]],
            'views': [[await this.env.refId('analytic.viewAccountAnalyticLineTree'), 'list'],
            [await this.env.refId('analytic.viewAccountAnalyticLineForm'), 'form'],
            [await this.env.refId('analytic.viewAccountAnalyticLineGraph'), 'graph'],
            [await this.env.refId('analytic.viewAccountAnalyticLinePivot'), 'pivot']],
            'viewMode': 'tree,form,graph,pivot',
            'context': { 'searchDefault_groupDate': 1, 'default_accountId': (await this['analyticAccountId']).id }
        }
    }

    // ---------------------------------------------
    //  PROJECT UPDATES
    // ---------------------------------------------

    async getLastUpdateOrDefault() {
        this.ensureOne();
        const labels = Object.fromEntries(await this._fields['lastUpdateStatus']._descriptionSelection(this._fields['lastUpdateStatus'], this.env));
        return {
            'status': labels[await this['lastUpdateStatus']],
            'color': await this['lastUpdateColor'],
        }
    }

    async getPanelData() {
        this.ensureOne();
        return {
            'user': await this._getUserValues(),
            'milestones': await this._getMilestones(),
            'buttons': sorted(await this._getStatButtons(), k => k['sequence']),
        }
    }

    async _getUserValues() {
        return {
            'isProjectUser': await this.userHasGroups('project.groupProjectUser'),
        }
    }

    async _getMilestones() {
        this.ensureOne();
        return {
            'data': await (await this['milestoneIds'])._getDataList(),
        }
    }

    async _getStatButtons() {
        this.ensureOne();
        const buttons: any[] = [{
            'icon': 'tasks',
            'text': await this._t('Tasks'),
            'number': await this['taskCount'],
            'actionType': 'action',
            'action': 'project.actProjectProject2ProjectTaskAll',
            'additionalContext': stringify({
                'activeId': this.id,
            }),
            'show': true,
            'sequence': 2,
        }];
        if (await this.userHasGroups('project.groupProjectRating')) {
            buttons.push({
                'icon': 'smile-o',
                'text': await this._t('Customer Satisfaction'),
                'number': f('%s %', await this['ratingPercentageSatisfaction']),
                'actionType': 'object',
                'action': 'actionViewAllRating',
                'show': await this['ratingActive'] && await this['ratingPercentageSatisfaction'] > -1,
                'sequence': 5,
            });
        }
        if (await this.userHasGroups('project.groupProjectManager')) {
            buttons.push({
                'icon': 'area-chart',
                'text': await this._t('Burndown Chart'),
                'actionType': 'action',
                'action': 'project.actionProjectTaskBurndownChartReport',
                'additionalContext': stringify({
                    'activeId': this.id,
                }),
                'show': true,
                'sequence': 7,
            });
            buttons.push({
                'icon': 'users',
                'text': await this._t('Collaborators'),
                'number': await this['collaboratorCount'],
                'actionType': 'action',
                'action': 'project.projectCollaboratorAction',
                'additionalContext': stringify({
                    'activeId': this.id,
                }),
                'show': true,
                'sequence': 23,
            });
        }
        if (await this.userHasGroups('analytic.groupAnalyticAccounting')) {
            buttons.push({
                'icon': 'usd',
                'text': await this._t('Gross Margin'),
                'number': await formatAmount(this.env, await this['analyticAccountBalance'], await (await this['companyId']).currencyId),
                'actionType': 'object',
                'action': 'actionViewAnalyticAccountEntries',
                'show': bool(await this['analyticAccountId']),
                'sequence': 18,
            });
        }
        return buttons;
    }

    // ---------------------------------------------------
    //  Business Methods
    // ---------------------------------------------------

    @api.model()
    async _createAnalyticAccountFromValues(values) {
        const analyticAccount = await this.env.items('account.analytic.account').create({
            'label': values['label'] ?? await this._t('Unknown Analytic Account'),
            'companyId': values['companyId'] || (await this.env.company()).id,
            'partnerId': values['partnerId'],
            'active': true,
        });
        return analyticAccount;
    }

    async _createAnalyticAccount() {
        for (const project of this) {
            const analyticAccount = await this.env.items('account.analytic.account').create({
                'label': await project.label,
                'companyId': (await project.companyId).id,
                'partnerId': (await project.partnerId).id,
                'active': true,
            });
            await project.write({ 'analyticAccountId': analyticAccount.id });
        }
    }

    // ---------------------------------------------------
    // Rating business
    // ---------------------------------------------------

    // This method should be called once a day by the scheduler
    @api.model()
    async _sendRatingAll() {
        const projects = await this.search([
            ['ratingActive', '=', true],
            ['ratingStatus', '=', 'periodic'],
            ['ratingRequestDeadline', '<=', _Datetime.now()]
        ]);
        for (const project of projects) {
            await (await project.taskIds)._sendTaskRatingMail();
            await project._computeRatingRequestDeadline();
            await this.env.cr.commit();
        }
    }

    // ---------------------------------------------------
    // Privacy
    // ---------------------------------------------------

    /**
     * Unsubscribe non-internal users from the project and tasks if the project privacy visibility
        goes to a value different than 'portal'
     * @returns 
     */
    async _changePrivacyVisibility() {
        for (const project of await this.filtered(async (p) => await p.privacyVisibility != 'portal')) {
            const portalUsers = await (await (await project.messagePartnerIds).userIds).filtered('share');
            await project.messageUnsubscribe((await portalUsers.partnerId).ids);
            await (await project.mapped('tasks'))._changeProjectPrivacyVisibility();
        }
    }

    // ---------------------------------------------------
    // Project sharing
    // ---------------------------------------------------
    async _checkProjectSharingAccess() {
        this.ensureOne();
        if (await this['privacyVisibility'] != 'portal') {
            return false;
        }
        const user = await this.env.user();
        if (await user.hasGroup('base.groupPortal')) {
            return this.env.items('project.collaborator').search([['projectId', '=', (await this.sudo()).id], ['partnerId', '=', (await user.partnerId).id]]);
        }
        return user.hasGroup('base.groupUser');
    }

    async _addCollaborators(partners) {
        this.ensureOne();
        const userGroupId = await this.env.items('ir.model.data')._xmlidToResId('base.groupUser');
        const allCollaborators = await (await this['collaboratorIds']).partnerId;
        const newCollaborators = await partners.filtered(
            async (partner) =>
                !allCollaborators.includes(partner)
                && (!(await partner.userIds).ok || !(await (await partner.userIds)[0].groupsId).ids.includes(userGroupId))
        );
        if (!bool(newCollaborators)) {
            // Then we have nothing to do
            return;
        }
        await this.write({
            'collaboratorIds':
                await newCollaborators.map(collaborator => Command.create({
                    'partnerId': collaborator.id,
                })),
        });
    }
}

@MetaModel.define()
class Task extends Model {
    static _module = module;
    static _name = "project.task";
    static _description = "Task";
    static _parents = ['portal.mixin', 'mail.thread.cc', 'mail.activity.mixin', 'rating.mixin'];
    static _order = "priority desc, sequence, id desc";
    static _dateName = "dateAssign";
    static _checkCompanyAuto = true;

    get _mailPostAccess() {
        return 'read';
    }

    @api.model()
    async _getDefaultPartnerId(project = null, parent = null) {
        if (bool(parent) && bool(await parent.partnerId)) {
            return (await parent.partnerId).id;
        }
        if (bool(project) && bool(await project.partnerId)) {
            return (await project.partnerId).id;
        }
        return false;
    }

    /**
     * Gives default stageId
     * @returns 
     */
    async _getDefaultStageId() {
        const projectId = this.env.context['default_projectId'];
        if (!projectId) {
            return false;
        }
        return this.stageFind(projectId, [['fold', '=', false], ['isClosed', '=', false]]);
    }

    @api.model()
    async _defaultCompanyId() {
        if (this._context['default_projectId']) {
            return this.env.items('project.project').browse(this._context['default_projectId']).companyId;
        }
        return this.env.company();
    }

    @api.model()
    async _readGroupStageIds(stages, domain, order) {
        let searchDomain: any[] = [['id', 'in', stages.ids]];
        if ('default_projectId' in this.env.context) {
            searchDomain = ['|', ['projectIds', '=', this.env.context['default_projectId']]].concat(searchDomain);
        }

        const stageIds = await stages._search(searchDomain, { order, accessRightsUid: global.SUPERUSER_ID });
        return stages.browse(stageIds);
    }

    @api.model()
    async _readGroupPersonalStageTypeIds(stages, domain, order) {
        return stages.search(['|', ['id', 'in', stages.ids], ['userId', '=', (await this.env.user()).id]]);
    }

    static active = Fields.Boolean({ default: true });
    static label = Fields.Char({ string: 'Title', tracking: true, required: true, index: true });
    static description = Fields.Html({ string: 'Description', sanitizeAttributes: false });
    static priority = Fields.Selection([
        ['0', 'Normal'],
        ['1', 'Important'],
    ], { default: '0', index: true, string: "Starred", tracking: true });
    static sequence = Fields.Integer({
        string: 'Sequence', index: true, default: 10,
        help: "Gives the sequence order when displaying a list of tasks."
    });
    static stageId = Fields.Many2one('project.task.type', {
        string: 'Stage', compute: '_computeStageId',
        store: true, readonly: false, ondelete: 'RESTRICT', tracking: true, index: true,
        default: self => self._getDefaultStageId(), groupExpand: '_readGroupStageIds',
        domain: "[['projectIds', '=', projectId]]", copy: false, taskDependencyTracking: true
    });
    static tagIds = Fields.Many2many('project.tags', { string: 'Tags' });
    static kanbanState = Fields.Selection([
        ['normal', 'In Progress'],
        ['done', 'Ready'],
        ['blocked', 'Blocked']], {
            string: 'Status',
        copy: false, default: 'normal', required: true
    });
    static kanbanStateLabel = Fields.Char({ compute: '_computeKanbanStateLabel', string: 'Kanban State Label', tracking: true, taskDependencyTracking: true });
    static createdAt = Fields.Datetime("Created On", { readonly: true, index: true });
    static updatedAt = Fields.Datetime("Last Updated On", { readonly: true, index: true });
    static dateEnd = Fields.Datetime({ string: 'Ending Date', index: true, copy: false });
    static dateAssign = Fields.Datetime({ string: 'Assigning Date', index: true, copy: false, readonly: true });
    static dateDeadline = Fields.Date({ string: 'Deadline', index: true, copy: false, tracking: true, taskDependencyTracking: true });
    static dateLastStageUpdate = Fields.Datetime({
        string: 'Last Stage Update',
        index: true,
        copy: false,
        readonly: true
    });
    static projectId = Fields.Many2one('project.project', {
        string: 'Project',
        compute: '_computeProjectId', recursive: true, store: true, readonly: false,
        index: true, tracking: true, checkCompany: true, changeDefault: true
    });
    // Defines in which project the task will be displayed / taken into account in statistics.
    // Example: 1 task A with 1 subtask B in project P
    // A -> projectId=P, displayProjectId=P
    // B -> projectId=P (to inherit from ACL/security rules), displayProjectId: false
    static displayProjectId = Fields.Many2one('project.project', { index: true });
    static plannedHours = Fields.Float("Initially Planned Hours", { help: 'Time planned to achieve this task (including its sub-tasks).', tracking: true });
    static subtaskPlannedHours = Fields.Float("Sub-tasks Planned Hours", {
        compute: '_computeSubtaskPlannedHours',
        help: "Sum of the time planned of all the sub-tasks linked to this task. Usually less than or equal to the initially planned time of this task."
    });
    // Tracking of this field is done in the write function
    static userIds = Fields.Many2many('res.users', {
        relation: 'projectTaskUserRel', column1: 'taskId', column2: 'userId',
        string: 'Assignees', default: async (self) => !await (await self.env.user()).share && await self.env.user(), context: { 'activeTest': false }, tracking: true
    });
    // User names displayed in project sharing views
    static portalUserNames = Fields.Char({ compute: '_computePortalUserNames', computeSudo: true, search: '_searchPortalUserNames' });
    // Second Many2many containing the actual personal stage for the current user
    // See project_task_stage_personal.ts for the model defininition
    static personalStageTypeIds = Fields.Many2many('project.task.type', {
        relation: 'projectTaskUserRel', column1: 'taskId', column2: 'stageId', ondelete: 'RESTRICT', groupExpand: '_readGroupPersonalStageTypeIds', copy: false,
        domain: "[['userId', '=', user.id]]", depends: ['userIds'], string: 'Personal Stage'
    });
    // Personal Stage computed from the user
    static personalStageId = Fields.Many2one('project.task.stage.personal', { string: 'Personal Stage State', computeSudo: false, compute: '_computePersonalStageId', help: "The current user's personal stage." });
    // This field is actually a related field on personalStageId.stageId
    // However due to the fact that personalStageId is computed, the orm throws out errors
    // saying the field cannot be searched.
    static personalStageTypeId = Fields.Many2one('project.task.type', {
        string: 'Personal User Stage',
        compute: '_computePersonalStageTypeId', inverse: '_inversePersonalStageTypeId', store: false,
        search: '_searchPersonalStageTypeId',
        help: "The current user's personal task stage."
    });
    static partnerId = Fields.Many2one('res.partner',
        {
            string: 'Customer',
            compute: '_computePartnerId', recursive: true, store: true, readonly: false, tracking: true,
            domain: "['|', ['companyId', '=', false], ['companyId', '=', companyId]]"
        });
    static partnerIsCompany = Fields.Boolean({ related: 'partnerId.isCompany', readonly: true });
    static commercialPartnerId = Fields.Many2one({ related: 'partnerId.commercialPartnerId' });
    static partnerEmail = Fields.Char({
        compute: '_computePartnerEmail', inverse: '_inversePartnerEmail',
        string: 'Email', readonly: false, store: true, copy: false
    });
    static partnerPhone = Fields.Char({
        compute: '_computePartnerPhone', inverse: '_inversePartnerPhone',
        string: "Phone", readonly: false, store: true, copy: false
    });
    static partnerCity = Fields.Char({ related: 'partnerId.city', readonly: false });
    static managerId = Fields.Many2one('res.users', { string: 'Project Manager', related: 'projectId.userId', readonly: true });
    static companyId = Fields.Many2one(
        'res.company', {
            string: 'Company', compute: '_computeCompanyId', store: true, readonly: false,
        required: true, copy: true, default: self => self._defaultCompanyId()
    });
    static color = Fields.Integer({ string: 'Color Index' });
    static attachmentIds = Fields.One2many('ir.attachment', {
        compute: '_computeAttachmentIds', string: "Main Attachments",
        help: "Attachments that don't come from a message."
    });
    // In the domain of displayedImageId, we couln't use attachmentIds because a one2many is represented as a list of commands so we used resModel & resId
    static displayedImageId = Fields.Many2one('ir.attachment', { domain: "[['resModel', '=', 'project.task'], ['resId', '=', id], ['mimetype', 'ilike', 'image']]", string: 'Cover Image' });
    static legendBlocked = Fields.Char({ related: 'stageId.legendBlocked', string: 'Kanban Blocked Explanation', readonly: true, relatedSudo: false });
    static legendDone = Fields.Char({ related: 'stageId.legendDone', string: 'Kanban Valid Explanation', readonly: true, relatedSudo: false });
    static legendNormal = Fields.Char({ related: 'stageId.legendNormal', string: 'Kanban Ongoing Explanation', readonly: true, relatedSudo: false });
    static isClosed = Fields.Boolean({ related: "stageId.isClosed", string: "Closing Stage", readonly: true, relatedSudo: false });
    static parentId = Fields.Many2one('project.task', { string: 'Parent Task', index: true });
    static childIds = Fields.One2many('project.task', 'parentId', { string: "Sub-tasks" });
    static childText = Fields.Char({ compute: "_computeChildText" });
    static allowSubtasks = Fields.Boolean({ string: "Allow Sub-tasks", related: "projectId.allowSubtasks", readonly: true });
    static subtaskCount = Fields.Integer("Sub-task Count", { compute: '_computeSubtaskCount' });
    static emailFrom = Fields.Char({
        string: 'Email From', help: "These people will receive email.", index: true,
        compute: '_computeEmailFrom', recursive: true, store: true, readonly: false, copy: false
    });
    static projectPrivacyVisibility = Fields.Selection({ related: 'projectId.privacyVisibility', string: "Project Visibility" });
    // Computed field about working time elapsed between record creation and assignation/closing.
    static workingHoursOpen = Fields.Float({ compute: '_computeElapsed', string: 'Working Hours to Assign', digits: [16, 2], store: true, groupOperator: "avg" });
    static workingHoursClose = Fields.Float({ compute: '_computeElapsed', string: 'Working Hours to Close', digits: [16, 2], store: true, groupOperator: "avg" });
    static workingDaysOpen = Fields.Float({ compute: '_computeElapsed', string: 'Working Days to Assign', store: true, groupOperator: "avg" });
    static workingDaysClose = Fields.Float({ compute: '_computeElapsed', string: 'Working Days to Close', store: true, groupOperator: "avg" });
    // customer portal: include comment and incoming emails in communication history
    static websiteMessageIds = Fields.One2many({ domain: self => [['model', '=', self._name], ['messageType', 'in', ['email', 'comment']]] });
    static isPrivate = Fields.Boolean({ compute: '_computeIsPrivate' });

    // Task Dependencies fields
    static allowTaskDependencies = Fields.Boolean({ related: 'projectId.allowTaskDependencies' });
    // Tracking of this field is done in the write function
    static dependOnIds = Fields.Many2many('project.task', {
        relation: "taskDependenciesRel", column1: "taskId",
        column2: "dependsOnId", string: "Blocked By", tracking: true, copy: false,
        domain: "[['allowTaskDependencies', '=', true], ['id', '!=', id]]"
    });
    static dependentIds = Fields.Many2many('project.task', {
        relation: "taskDependenciesRel", column1: "dependsOnId",
        column2: "taskId", string: "Block", copy: false,
        domain: "[['allowTaskDependencies', '=', true], ['id', '!=', id]]"
    });
    static dependentTasksCount = Fields.Integer({ string: "Dependent Tasks", compute: '_computeDependentTasksCount' });

    // recurrence fields
    static allowRecurringTasks = Fields.Boolean({ related: 'projectId.allowRecurringTasks' });
    static recurringTask = Fields.Boolean({ string: "Recurrent" });
    static recurringCount = Fields.Integer({ string: "Tasks in Recurrence", compute: '_computeRecurringCount' });
    static recurrenceId = Fields.Many2one('project.task.recurrence', { copy: false });
    static recurrenceUpdate = Fields.Selection([
        ['this', 'This task'],
        ['subsequent', 'This and following tasks'],
        ['all', 'All tasks'],
    ], { default: 'this', store: false });
    static recurrenceMessage = Fields.Char({ string: 'Next Recurrencies', compute: '_computeRecurrenceMessage' });

    static repeatInterval = Fields.Integer({ string: 'Repeat Every', default: 1, compute: '_computeRepeat', readonly: false });
    static repeatUnit = Fields.Selection([
        ['day', 'Days'],
        ['week', 'Weeks'],
        ['month', 'Months'],
        ['year', 'Years'],
    ], { default: 'week', compute: '_computeRepeat', readonly: false });
    static repeatType = Fields.Selection([
        ['forever', 'Forever'],
        ['until', 'End Date'],
        ['after', 'Number of Repetitions'],
    ], { default: "forever", string: "Until", compute: '_computeRepeat', readonly: false });
    static repeatUntil = Fields.Date({ string: "End Date", compute: '_computeRepeat', readonly: false });
    static repeatNumber = Fields.Integer({ string: "Repetitions", default: 1, compute: '_computeRepeat', readonly: false });

    static repeatOnMonth = Fields.Selection([
        ['date', 'Date of the Month'],
        ['day', 'Day of the Month'],
    ], { default: 'date', compute: '_computeRepeat', readonly: false });

    static repeatOnYear = Fields.Selection([
        ['date', 'Date of the Year'],
        ['day', 'Day of the Year'],
    ], { default: 'date', compute: '_computeRepeat', readonly: false });

    static mon = Fields.Boolean({ string: "Mon", compute: '_computeRepeat', readonly: false });
    static tue = Fields.Boolean({ string: "Tue", compute: '_computeRepeat', readonly: false });
    static wed = Fields.Boolean({ string: "Wed", compute: '_computeRepeat', readonly: false });
    static thu = Fields.Boolean({ string: "Thu", compute: '_computeRepeat', readonly: false });
    static fri = Fields.Boolean({ string: "Fri", compute: '_computeRepeat', readonly: false });
    static sat = Fields.Boolean({ string: "Sat", compute: '_computeRepeat', readonly: false });
    static sun = Fields.Boolean({ string: "Sun", compute: '_computeRepeat', readonly: false });

    static repeatDay = Fields.Selection(
        _.range(1, 32).map(i => [String(i), String(i)]), { compute: '_computeRepeat', readonly: false });
    static repeatWeek = Fields.Selection([
        ['first', 'First'],
        ['second', 'Second'],
        ['third', 'Third'],
        ['last', 'Last'],
    ], { default: 'first', compute: '_computeRepeat', readonly: false });
    static repeatWeekday = Fields.Selection([
        ['mon', 'Monday'],
        ['tue', 'Tuesday'],
        ['wed', 'Wednesday'],
        ['thu', 'Thursday'],
        ['fri', 'Friday'],
        ['sat', 'Saturday'],
        ['sun', 'Sunday'],
    ], { string: 'Day Of The Week', compute: '_computeRepeat', readonly: false });
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
    ], { compute: '_computeRepeat', readonly: false });

    static repeatShowDow = Fields.Boolean({ compute: '_computeRepeatVisibility' });
    static repeatShowDay = Fields.Boolean({ compute: '_computeRepeatVisibility' });
    static repeatShowWeek = Fields.Boolean({ compute: '_computeRepeatVisibility' });
    static repeatShowMonth = Fields.Boolean({ compute: '_computeRepeatVisibility' });

    // Account analytic
    static analyticAccountId = Fields.Many2one('account.analytic.account', {
        ondelete: 'SET NULL',
        domain: "['|', ['companyId', '=', false], ['companyId', '=', companyId]]", checkCompany: true,
        help: ["Analytic account to which this task is linked for financial management. ",
            "Use an analytic account to record cost and revenue on your task. ",
            "If empty, the analytic account of the project will be used."].join()
    });
    static projectAnalyticAccountId = Fields.Many2one('account.analytic.account', { string: 'Project Analytic Account', related: 'projectId.analyticAccountId' });
    static analyticTagIds = Fields.Many2many('account.analytic.tag',
        { domain: "['|', ['companyId', '=', false], ['companyId', '=', companyId]]", checkCompany: true });

    SELF_READABLE_FIELDS() {
        return PROJECT_TASK_READABLE_FIELDS.concat(this.SELF_WRITABLE_FIELDS());
    }

    SELF_WRITABLE_FIELDS() {
        return PROJECT_TASK_WRITABLE_FIELDS;
    }

    @api.depends('projectId', 'parentId')
    async _computeIsPrivate() {
        // Modify accordingly, this field is used to display the lock on the task's kanban card
        for (const task of this) {
            await task.set('isPrivate', !bool(await task.projectId) && !bool(await task.parentId));
        }
    }

    @api.dependsContext('uid')
    @api.depends('userIds')
    async _computePersonalStageId() {
        // An user may only access his own 'personal stage' and there can only be one pair (user, taskId)
        const personalStages = await this.env.items('project.task.stage.personal').search([['userId', '=', this.env.uid], ['taskId', 'in', this.ids]]);
        await this.set('personalStageId', false);
        for (const personalStage of personalStages) {
            await (await personalStage.taskId).set('personalStageId', personalStage);
        }
    }

    @api.depends('personalStageId')
    async _computePersonalStageTypeId() {
        for (const task of this) {
            await task.set('personalStageTypeId', await (await task.personalStageId).stageId);
        }
    }

    async _inversePersonalStageTypeId() {
        for (const task of this) {
            await (await task.personalStageId).set('stageId', await task.personalStageTypeId);
        }
    }

    @api.model()
    async _searchPersonalStageTypeId(operator, value) {
        return [['personalStageTypeIds', operator, value]];
    }

    @api.model()
    async _getDefaultPersonalStageCreateVals(userId) {
        return [
            { 'sequence': 1, 'label': this._t('Inbox'), 'userId': userId, 'fold': false },
            { 'sequence': 2, 'label': this._t('Today'), 'userId': userId, 'fold': false },
            { 'sequence': 3, 'label': this._t('This Week'), 'userId': userId, 'fold': false },
            { 'sequence': 4, 'label': this._t('This Month'), 'userId': userId, 'fold': false },
            { 'sequence': 5, 'label': this._t('Later'), 'userId': userId, 'fold': false },
            { 'sequence': 6, 'label': this._t('Done'), 'userId': userId, 'fold': true },
            { 'sequence': 7, 'label': this._t('Canceled'), 'userId': userId, 'fold': true },
        ]
    }

    async _populateMissingPersonalStages() {
        // Assign the default personal stage for those that are missing
        const personalStagesWithoutStage = await (await this.env.items('project.task.stage.personal').sudo()).search([['taskId', 'in', this.ids], ['stageId', '=', false]]);
        if (bool(personalStagesWithoutStage)) {
            const userIds = await personalStagesWithoutStage.userId;
            const personalStageByUser = new DefaultMapKey(() => this.env.items('project.task.stage.personal'));
            for (const personalStage of personalStagesWithoutStage) {
                personalStageByUser.set(await personalStage.userId, personalStageByUser.get(await personalStage.userId).or(personalStage));
            }
            for (const userId of userIds) {
                let stage = await (await this.env.items('project.task.type').sudo()).search([['userId', '=', userId.id]], { limit: 1 });
                // In the case no stages have been found, we create the default stages for the user
                if (!bool(stage)) {
                    const lang = await (await userId.partnerId).lang;
                    const stages = await (await (await this.env.items('project.task.type').sudo()).withContext({ lang, default_projectIds: false })).create(
                        await (await this.withContext({ lang }))._getDefaultPersonalStageCreateVals(userId.id)
                    );
                    stage = stages[0];
                }
                await (await personalStageByUser.get(userId).sudo()).write({ 'stageId': stage.id });
            }
        }
    }

    @api.constrains('dependOnIds')
    async _checkNoCyclicDependencies() {
        if (! await this._checkM2mRecursion('dependOnIds')) {
            throw new ValidationError(await this._t("You cannot create cyclic dependency."));
        }
    }

    @api.model()
    _getRecurrenceFields() {
        return ['repeatInterval', 'repeatUnit', 'repeatType', 'repeatUntil', 'repeatNumber',
            'repeatOnMonth', 'repeatOnYear', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat',
            'sun', 'repeatDay', 'repeatWeek', 'repeatMonth', 'repeatWeekday'];
    }

    @api.depends('recurringTask', 'repeatUnit', 'repeatOnMonth', 'repeatOnYear')
    async _computeRepeatVisibility() {
        for (const task of this) {
            const [repeatUnit, recurringTask, repeatOnMonth, repeatOnYear] = await task('repeatUnit', 'recurringTask', 'repeatOnMonth', 'repeatOnYear');
            await task.set('repeatShowDay', await recurringTask && (repeatUnit == 'month' && repeatOnMonth == 'date') || (repeatUnit == 'year' && repeatOnYear == 'date'));
            await task.set('repeatShowWeek', recurringTask && (repeatUnit == 'month' && repeatOnMonth == 'day') || (repeatUnit == 'year' && repeatOnYear == 'day'));
            await task.set('repeatShowDow', recurringTask && repeatUnit == 'week');
            await task.set('repeatShowMonth', recurringTask && repeatUnit == 'year');
        }
    }

    @api.depends('recurringTask')
    async _computeRepeat() {
        const recFields = this._getRecurrenceFields();
        const defaults = await this.defaultGet(recFields);
        for (const task of this) {
            const recurrence = await task.recurrenceId;
            for (const f of recFields) {
                if (recurrence.ok) {
                    await task.set(f, await recurrence[f]);
                }
                else {
                    await task.set(f, await task.recurringTask ? defaults[f] : false);
                }
            }
        }
    }

    async _getWeekdays(n = 1) {
        this.ensureOne()
        if (await this['repeatUnit'] == 'week') {
            const result = [];
            for (const [day, fn] of Object.entries(DAYS)) {
                if (await this[day]) {
                    result.push(fn.nth(n));
                }
            }
            return result;
        }
        return [DAYS[await this['repeatWeekday']].nth(n)];
    }

    async _getRecurrenceStartDate() {
        return _Date.today();
    }

    @api.depends(
        'recurringTask', 'repeatInterval', 'repeatUnit', 'repeatType', 'repeatUntil',
        'repeatNumber', 'repeatOnMonth', 'repeatOnYear', 'mon', 'tue', 'wed', 'thu', 'fri',
        'sat', 'sun', 'repeatDay', 'repeatWeek', 'repeatMonth', 'repeatWeekday')
    async _computeRecurrenceMessage() {
        await this.set('recurrenceMessage', false);
        for (const task of await this.filtered(async (t) => await t.recurringTask && await t._isRecurrenceValid())) {
            const date = await task._getRecurrenceStartDate();
            const recurrenceLeft = (await task.recurrenceId).ok ? await (await task.recurrenceId).recurrenceLeft : await task.repeatNumber;
            const numberOccurrences = Math.min(5, await task.repeatType == 'after' ? recurrenceLeft : 5);
            const delta = await task.repeatUnit == 'day' ? await task.repeatInterval : 1;
            const recurringDates = await this.env.items('project.task.recurrence')._getNextRecurringDates(
                addDate(date, { days: delta }),
                await task.repeatInterval,
                await task.repeatUnit,
                await task.repeatType,
                await task.repeatUntil,
                await task.repeatOnMonth,
                await task.repeatOnYear,
                await task._getWeekdays(WEEKS[await task.repeatWeek]),
                await task.repeatDay,
                await task.repeatWeek,
                await task.repeatMonth,
                { count: numberOccurrences });
            const dateFormat = await (await this.env.items('res.lang')._langGet(await (await this.env.user()).lang)).dateFormat || await (await getLang(this.env)).dateFormat;
            let recurrenceTitle;
            if (recurrenceLeft == 0) {
                recurrenceTitle = await this._t('There are no more occurrences.');
            }
            else {
                recurrenceTitle = await this._t('Next Occurrences:');
            }
            let recurrenceMessage = f('<p><span class="fa fa-check-circle"></span> %s</p><ul>', recurrenceTitle);
            recurrenceMessage += recurringDates.slice(0, 5).map(date => f('<li>%s</li>', toFormat(date, dateFormat))).join('');
            if (await task.repeatType == 'after' && recurrenceLeft > 5 || await task.repeatType == 'forever' || recurringDates.length > 5) {
                recurrenceMessage += '<li>...</li>';
            }
            recurrenceMessage += '</ul>';
            if (await task.repeatType == 'until') {
                recurrenceMessage += _f2(await this._t('<p><em>Number of tasks: %(tasksCount)s</em></p>'), { 'tasksCount': recurringDates.length });
            }
            await task.set('recurrenceMessage', recurrenceMessage);
        }
    }

    async _isRecurrenceValid() {
        this.ensureOne();
        return await this['repeatInterval'] > 0 &&
            (!await this['repeatShowDow'] || bool(await this._getWeekdays())) &&
            (await this['repeatType'] != 'after' || await this['repeatNumber']) &&
            (await this['repeatType'] != 'until' || await this['repeatUntil'] && await this['repeatUntil'] > _Date.today());
    }

    @api.depends('recurrenceId')
    async _computeRecurringCount() {
        await this.set('recurringCount', 0);
        const recurringTasks = await this.filtered(l => l.recurrenceId);
        const count = await this.env.items('project.task').readGroup([['recurrenceId', 'in', (await recurringTasks.recurrenceId).ids]], ['id'], 'recurrenceId');
        const tasksCount = Object.fromEntries(count.map(c => [c['recurrenceId'][0], c['recurrenceId_count']]));
        for (const task of recurringTasks) {
            await task.set('recurringCount', tasksCount[(await task.recurrenceId).id] ?? 0);
        }
    }

    @api.depends('dependentIds')
    async _computeDependentTasksCount() {
        const tasksWithDependency = await this.filtered('allowTaskDependencies');
        await this.sub(tasksWithDependency).set('dependentTasksCount', 0);
        if (bool(tasksWithDependency)) {
            const groupDependent = await this.env.items('project.task').readGroup([
                ['dependOnIds', 'in', tasksWithDependency.ids],
            ], ['dependOnIds'], ['dependOnIds']);
            const dependentTasksCountDict = Object.fromEntries(groupDependent.map(group => [group['dependOnIds'][0], group['dependOnIds_count']]));
            for (const task of tasksWithDependency) {
                await task.set('dependentTasksCount', dependentTasksCountDict[task.id] ?? 0);
            }
        }
    }

    @api.depends('partnerId.email')
    async _computePartnerEmail() {
        for (const task of this) {
            const partner = await task.partnerId;
            if (partner.ok && await partner.email != await task.partnerEmail) {
                await task.set('partnerEmail', await partner.email);
            }
        }
    }

    async _inversePartnerEmail() {
        for (const task of this) {
            const partner = await task.partnerId;
            if (partner.ok && await task.partnerEmail != await partner.email) {
                await partner.set('email', await task.partnerEmail);
            }
        }
    }

    @api.depends('partnerId.phone')
    async _computePartnerPhone() {
        for (const task of this) {
            const partner = await task.partnerId;
            if (partner.ok && await task.partnerPhone != await partner.phone) {
                await task.set('partnerPhone', await partner.phone);
            }
        }
    }

    async _inversePartnerPhone() {
        for (const task of this) {
            const partner = await task.partnerId;
            if (partner.ok && await task.partnerPhone != await partner.phone) {
                await partner.set('phone', await task.partnerPhone);
            }
        }
    }

    @api.constrains('parentId')
    async _checkParentId() {
        if (!await this._checkRecursion()) {
            throw new ValidationError(await this._t('Error! You cannot create a recursive hierarchy of tasks.'));
        }
    }

    async _computeAttachmentIds() {
        for (const task of this) {
            const attachmentIds = (await this.env.items('ir.attachment').search([['resId', '=', task.id], ['resModel', '=', 'project.task']])).ids;
            const messageAttachmentIds = (await task.mapped('messageIds.attachmentIds')).ids;  // from mail_thread
            await task.set('attachmentIds', [[6, 0, _.difference(attachmentIds, messageAttachmentIds)]]);
        }
    }

    @api.depends('createdAt', 'dateEnd', 'dateAssign')
    async _computeElapsed() {
        const taskLinkedToCalendar = await this.filtered(
            async (task) => await (await task.projectId).resourceCalendarId && await task.createdAt
        )
        for (const task of taskLinkedToCalendar) {
            const dtCreatedAt = _Datetime.toDatetime(await task.createdAt);

            if (await task.dateAssign) {
                const dtDateAssign = _Datetime.toDatetime(await task.dateAssign);
                const durationData = await (await (await task.projectId).resourceCalendarId).getWorkDurationData(dtCreatedAt, dtDateAssign, { computeLeaves: true });
                await task.set('workingHoursOpen', durationData['hours']);
                await task.set('workingDaysOpen', durationData['days']);
            }
            else {
                await task.set('workingHoursOpen', 0.0);
                await task.set('workingDaysOpen', 0.0);
            }

            if (await task.dateEnd) {
                const dtDateEnd = _Datetime.toDatetime(await task.dateEnd);
                const durationData = await (await (await task.projectId).resourceCalendarId).getWorkDurationData(dtCreatedAt, dtDateEnd, { computeLeaves: true });
                await task.set('workingHoursClose', durationData['hours']);
                await task.set('workingDaysClose', durationData['days']);
            }
            else {
                await task.set('workingHoursClose', 0.0);
                await task.set('workingDaysClose', 0.0);
            }
        }

        await this.sub(taskLinkedToCalendar).update(Dict.fromKeys(
            ['workingHoursOpen', 'workingHoursClose', 'workingDaysOpen', 'workingDaysClose'], 0.0));
    }

    @api.depends('stageId', 'kanbanState')
    async _computeKanbanStateLabel() {
        for (const task of this) {
            let kanbanStateLabel;
            if (await task.kanbanState == 'normal') {
                kanbanStateLabel = await task.legendNormal;
            }
            else if (await task.kanbanState == 'blocked') {
                kanbanStateLabel = await task.legendBlocked;
            }
            else {
                kanbanStateLabel = await task.legendDone;
            }
            await task.set('kanbanStateLabel', kanbanStateLabel);
        }
    }

    async _computeAccessUrl() {
        await _super(Task, this)._computeAccessUrl();
        for (const task of this) {
            await task.set('accessUrl', f('/my/task/%s', task.id));
        }
    }

    async _computeAccessWarning() {
        await _super(Task, this)._computeAccessWarning();
        for (const task of await this.filtered(async (x) => await (await x.projectId).privacyVisibility != 'portal')) {
            await task.set('accessWarning', await this._t(
                "The task cannot be shared with the recipient(s) because the privacy of the project is too restricted. Set the privacy of the project to 'Visible by following customers' in order to make it accessible by the recipient(s)."));
        }
    }

    @api.depends('childIds.plannedHours')
    async _computeSubtaskPlannedHours() {
        for (const task of this) {
            await task.set('subtaskPlannedHours', sum(await (await task.childIds).map(async (childTask) => await childTask.plannedHours + await childTask.subtaskPlannedHours)));
        }
    }

    @api.depends('childIds')
    async _computeChildText() {
        for (const task of this) {
            let childText;
            if (!await task.subtaskCount) {
                childText = false;
            }
            else if (await task.subtaskCount == 1) {
                childText = await this._t("(+ 1 task)");
            }
            else {
                childText = _f2(await this._t("(+ %(childCount)s tasks)"), { childCount: await task.subtaskCount });
            }
            await task.set('childText', childText);
        }
    }

    @api.depends('childIds')
    async _computeSubtaskCount() {
        for (const task of this) {
            await task.set('subtaskCount', len(await task._getAllSubtasks()));
        }
    }

    @api.onchange('companyId')
    async _onchangeTaskCompany() {
        if ((await (await this['projectId']).companyId).ne(await this['companyId'])) {
            await this.set('projectId', false);
        }
    }

    @api.depends('projectId.companyId')
    async _computeCompanyId() {
        for (const task of await this.filtered(task => task.projectId)) {
            await task.set('companyId', await (await task.projectId).companyId);
        }
    }

    @api.depends('projectId')
    async _computeStageId() {
        for (const task of this) {
            const project = await task.projectId;
            if (project.ok) {
                if (!(await (task.stageId).projectIds).includes(project)) {
                    await task.set('stageId', await task.stageFind(project.id, [
                        ['fold', '=', false], ['isClosed', '=', false]]));
                }
            }
            else {
                await task.set('stageId', false);
            }
        }
    }

    /**
     * This compute method allows to see all the names of assigned users to each task contained in `this`.

            When we are in the project sharing feature, the `userIds` contains only the users if we are a portal user.
            That is, only the users in the same company of the current user.
            So this compute method is a related of `userIds.label` but with more records that the portal user
            can normally see.
            (In other words, this compute is only used in project sharing views to see all assignees for each task)
     * @returns 
     */
    @api.depends('userIds')
    async _computePortalUserNames() {
        if (bool(this.ids)) {
            // fetch 'userIds' in superuser mode (and override value in cache
            // browse is useful to avoid miscache because of the newIds contained in this
            await this.browse(this.ids)._read(['userIds']);
        }
        for (const task of await this.withContext({ prefetchFields: false })) {
            await task.set('portalUserNames', (await (await task.userIds).mapped('label')).join(', '));
        }
    }

    async _searchPortalUserNames(operator, value) {
        if (operator != 'ilike' && typeof value !== 'string') {
            throw new ValidationError('Not Implemented.');
        }

        const query = `
            SELECT "taskUser"."taskId"
              FROM "projectTaskUserRel" "taskUser"
        INNER JOIN "resUsers" users ON "taskUser"."userId" = users.id
        INNER JOIN "resPartner" partners ON partners.id = users."partnerId"
             WHERE partners.label ILIKE %s
        `;
        return [['id', 'inselect', [query, [`%${value}%`]]]];
    }

    @api.returns('self', value => value.id)
    async copy(defaults?: any) {
        if (defaults == null) {
            defaults = {};
        }
        if (!defaults['label']) {
            defaults['label'] = await this._t("%s (copy)", await this['label']);
        }
        if ((await this['recurrenceId']).ok) {
            defaults['recurrenceId'] = (await (await this['recurrenceId']).copy()).id;
        }
        return _super(Task, this).copy(defaults);
    }

    @api.model()
    async getEmptyListHelp(help) {
        let tname = await this._t("task");
        const projectId = this.env.context['default_projectId'] ?? false;
        if (projectId) {
            const label = await (await this.env.items('project.project').browse(projectId)).labelTasks;
            if (label) tname = label.toLowerCase();
        }
        const self = await this.withContext({
            emptyListHelpId: this.env.context['default_projectId'],
            emptyListHelpModel: 'project.project',
            emptyListHelpDocumentName: tname,
        });
        return _super(Task, self).getEmptyListHelp(help);
    }

    _validFieldParameter(field, name) {
        // If the field has `taskDependencyTracking` on we track the changes made in the dependent task on the parent task
        return name == 'taskDependencyTracking' || _super(Task, this)._validFieldParameter(field, name);
    }

    /**
     * Returns the set of tracked field names for the current model.
        Those fields are the ones tracked in the parent task when using task dependencies.

        See method `mail.models.MailThread._getTrackedFields`
     * @returns 
     */
    @tools.ormcache('self.env.uid', 'self.env.su')
    async _getDependsTrackedFields() {
        const fields = this._fields.entries().filter(([, field]) => getattr(field, 'taskDependencyTracking', null)).map(([name,]) => name);
        return fields.length && Object.keys(await this.fieldsGet(fields));
    }

    // ----------------------------------------
    // Case management
    // ----------------------------------------

    /**
     * Override of the base.stage method
            Parameter of the stage search taken from the lead:
            - sectionId: if set, stages must belong to this section or
              be a default stage; if not set, stages must be default
              stages
     * @param sectionId 
     * @param domain 
     * @param order 
     * @returns 
     */
    async stageFind(sectionId, domain: any[], order = 'sequence, id') {
        // collect all sectionIds
        const sectionIds = [];
        if (sectionId) {
            sectionIds.push(sectionId);
        }
        extend(sectionIds, (await this.mapped('projectId')).ids);
        let searchDomain = [];
        if (sectionIds.length) {
            searchDomain = Array(sectionIds.length - 1).fill(['|']);
            for (const sectionId of sectionIds) {
                searchDomain.push(['projectIds', '=', sectionId]);
            }
        }
        searchDomain = searchDomain.concat(domain);
        // perform search, return the first found
        return (await this.env.items('project.task.type').search(searchDomain, { order, limit: 1 })).id;
    }

    // ------------------------------------------------
    // CRUD overrides
    // ------------------------------------------------
    @api.model()
    async fieldsGet(allfields?: any, attributes?: any) {
        const fields = await _super(Task, this).fieldsGet(allfields, attributes);
        if (!await (await this.env.user()).hasGroup('base.groupPortal')) {
            return fields;
        }
        const readableFields = this.SELF_READABLE_FIELDS();
        const publicFields = Object.fromEntries(Object.entries(fields).filter(([fname]) => readableFields.includes(fname)));

        const writableFields = this.SELF_WRITABLE_FIELDS();
        for (const [fname, description] of Object.entries(publicFields)) {
            if (!writableFields.includes(fname) && !(description['readonly'] ?? false)) {
                // If the field is not in Writable fields and it is not readonly then we force the readonly to true
                description['readonly'] = true;
            }
        }

        return publicFields;
    }

    @api.model()
    async defaultGet(defaultFields) {
        const vals = await _super(Task, this).defaultGet(defaultFields);

        const days = Object.keys(DAYS);
        const weekStart = _Date.today().getDay();

        if (days.every(d => defaultFields.includes(d))) {
            vals[days[weekStart]] = true;
        }
        if (defaultFields.includes('repeatDay')) {
            vals['repeatDay'] = String(_Date.today().getDate());
        }
        if (defaultFields.includes('repeatMonth')) {
            vals['repeatMonth'] = this._fields.get('repeatMonth').selection[_Date.today().getMonth()][0];
        }
        if (defaultFields.includes('repeatUntil')) {
            vals['repeatUntil'] = addDate(_Date.today(), { days: 7 });
        }
        if (defaultFields.includes('repeatWeekday')) {
            vals['repeatWeekday'] = this._fields.get('repeatWeekday').selection[weekStart][0];
        }
        if ('partnerId' in vals && !vals['partnerId']) {
            // if the default_partnerId: false or no default_partnerId then we search the partner based on the project and parent
            let projectId = vals['projectId'];
            let parentId = vals['parentId'] ?? this.env.context['default_parentId'];
            if (projectId || parentId) {
                const partnerId = await this._getDefaultPartnerId(
                    projectId && this.env.items('project.project').browse(projectId),
                    parentId && this.env.items('project.task').browse(parentId)
                );
                if (partnerId) {
                    vals['partnerId'] = partnerId;
                }
            }
        }

        return vals;
    }

    /**
     * ensure all fields are accessible by the current user

            This method checks if the portal user can access to all fields given in parameter.
            By default, it checks if the current user is a portal user and then checks if all fields are accessible for this user.
     * @param fields list of fields to check if the current user can access.
     * @param operation contains either 'read' to check readable fields or 'write' to check writable Fields.
     * @param checkGroupUser contains boolean value.
            - true, if the method has to check if the current user is a portal one.
            - false if we are sure the user is a portal user,
     * @returns 
     */
    async _ensureFieldsAreAccessible(fields, operation = 'read', checkGroupUser = true) {
        assert(['read', 'write'].includes(operation), 'Invalid operation');
        if (bool(fields) && (!checkGroupUser || await (await this.env.user()).hasGroup('base.groupPortal')) && !this.env.su) {
            const unauthorizedFields = _.difference(fields, (operation == 'read' ? this.SELF_READABLE_FIELDS() : this.SELF_WRITABLE_FIELDS()));
            if (unauthorizedFields.length) {
                let errorMessage;
                if (operation == 'read') {
                    errorMessage = await this._t('You cannot read %s fields in task.', unauthorizedFields.join(', '));
                }
                else {
                    errorMessage = await this._t('You cannot write on %s fields in task.', unauthorizedFields.join(', '));
                }
                throw new AccessError(errorMessage);
            }
        }
    }

    async read(fields?: any, load = '_classicRead') {
        await this._ensureFieldsAreAccessible(fields);
        return _super(Task, this).read(fields, load);
    }

    @api.model()
    async readGroup(domain, fields, groupby, opts: { offset?: number, limit?: any, orderby?: any, lazy?: any } = {}) {
        let fieldsList = fields.map(f => f.split(':')[0]);
        if (bool(groupby)) {
            const fieldsGroupby = typeof groupby === 'string' ? [groupby] : groupby;
            // only take field name when having ':' e.g 'dateDeadline:week' => 'dateDeadline'
            fieldsList = fieldsList.concat(fieldsGroupby.map(f => f.split(':')[0]));
        }
        if (bool(domain)) {
            fieldsList = fieldsList.concat(domain.filter(term => isArray(term) && !(isTrueLeaf(term) || isFalseLeaf(term))).map(term => term[0].split('.')[0]));
        }
        this._ensureFieldsAreAccessible(fieldsList);
        return _super(Task, this).readGroup(domain, fields, groupby, opts);
    }

    @api.model()
    async _search(args, opts: { offset?: number, limit?: any, order?: any, count?: boolean, accessRightsUid?: any } = {}) {
        const fieldsList = args.filter(term => isArray(term) && !(isTrueLeaf(term) || isFalseLeaf(term))).map(term => term[0]);
        await this._ensureFieldsAreAccessible(fieldsList);
        return _super(Task, this)._search(args, opts);
    }

    async mapped(func) {
        // Note: This will protect the filtered method too
        if (typeof func === 'string') {
            const fieldsList = func.split('.');
            await this._ensureFieldsAreAccessible(fieldsList);
        }
        return _super(Task, this).mapped(func);
    }

    async filteredDomain(domain) {
        const fieldsList = domain.filter(term => isArray(term) && !(isTrueLeaf(term) || isFalseLeaf(term))).map(term => term[0]);
        await this._ensureFieldsAreAccessible(fieldsList);
        return _super(Task, this).filteredDomain(domain);
    }

    async copyData(defaults?: any) {
        defaults = await _super(Task, this).copyData(defaults);
        if (await (await this.env.user()).hasGroup('project.groupProjectUser')) {
            return defaults;
        }
        return Object.fromEntries(Object.entries(defaults).filter(([k, v]) => this.SELF_READABLE_FIELDS().includes(k)));
    }

    @api.model()
    async _ensurePortalUserCanWrite(fields) {
        for (const field of fields) {
            if (!this.SELF_WRITABLE_FIELDS().includes(field)) {
                throw new AccessError(await this._t('You have not write access of %s field.', field));
            }
        }
    }

    async _loadRecordsCreate(valsList) {
        const projectsWithRecurrence = await this.env.items('project.project').search([['allowRecurringTasks', '=', true]]);
        for (const vals of valsList) {
            if (vals['recurringTask']) {
                if (projectsWithRecurrence.ids.includes(vals['projectId']) && !vals['recurrenceId']) {
                    const defaultVal = await this.defaultGet(this._getRecurrenceFields());
                    update(vals, defaultVal);
                }
                else {
                    for (const fieldName of this._getRecurrenceFields().concat(['recurringTask'])) {
                        pop(vals, fieldName, null);
                    }
                }
            }
        }
        const tasks = await _super(Task, this)._loadRecordsCreate(valsList);
        const stageIdsPerProject = new MapKey();
        for (const task of tasks) {
            const [stage, project] = await task('stageId', 'projectId');
            if (stage.ok && !(await project.typeIds).includes(stage) && !stageIdsPerProject.get(project).includes(stage.id)) {
                if (!stageIdsPerProject.has(project)) {
                    stageIdsPerProject.set(stageIdsPerProject, []);
                }
                stageIdsPerProject.get(project).push(stage.id);
            }
        }

        for (const [project, stageIds] of stageIdsPerProject.items()) {
            await project.write({ 'typeIds': stageIds.map(stageId => Command.link(stageId)) });
        }
        return tasks;
    }

    @api.modelCreateMulti()
    async create(valsList) {
        const isPortalUser = await (await this.env.user()).hasGroup('base.groupPortal');
        if (isPortalUser) {
            await this.checkAccessRights('create');
        }
        const defaultStage = {}
        for (const vals of valsList) {
            if (isPortalUser) {
                await this._ensureFieldsAreAccessible(Object.keys(vals), 'write', false);
            }

            const projectId = vals['projectId'] || this.env.context['default_projectId'];
            if (!vals['parentId']) {
                // 1) We must initialize displayProjectId to follow projectId if there is no parentId
                vals['displayProjectId'] = projectId;
            }
            if (projectId && !('companyId' in vals)) {
                vals['companyId'] = (await this.env.items("project.project").browse(
                    projectId
                ).companyId).id || (await this.env.company()).id;
            }
            if (projectId && !('stageId' in vals)) {
                // 1) Allows keeping the batch creation of tasks
                // 2) Ensure the defaults are correct (and computed once by project),
                // by using default get (instead of _getDefaultStageId or _stageFind),
                if (!(projectId in defaultStage)) {
                    defaultStage[projectId] = (await (await this.withContext(
                        { default_projectId: projectId }
                    )).defaultGet(['stageId']))['stageId'];
                }
                vals["stageId"] = defaultStage[projectId];
            }
            // userIds change: update dateAssign
            if (vals['userIds']) {
                vals['dateAssign'] = _Datetime.now();
            }
            // Stage change: Update dateEnd if folded stage and dateLastStageUpdate
            if (vals['stageId']) {
                update(vals, await this.updateDateEnd(vals['stageId']));
                vals['dateLastStageUpdate'] = _Datetime.now();
            }
            // recurrence
            const recFields = _.intersection(Object.keys(vals), this._getRecurrenceFields());
            if (recFields.length && vals['recurringTask'] === true) {
                const recValues = Object.fromEntries(recFields.map(recField => [recField, vals[recField]]));
                recValues['nextRecurrenceDate'] = _Date.today();
                const recurrence = await this.env.items('project.task.recurrence').create(recValues);
                vals['recurrenceId'] = recurrence.id;
            }
        }
        // The sudo is required for a portal user as the record creation
        // requires the read access on other models, as mail.template
        // in order to compute the field tracking
        const wasInSudo = this.env.su;
        let self = this;
        if (isPortalUser) {
            const ctx = Object.fromEntries(Object.entries(this.env.context).filter(([key, val]) =>
                key == 'default_projectId'
                || !key.startsWith('default_')
                || this.SELF_WRITABLE_FIELDS().includes(key.slice(8))));
            self = await (await self.withContext(ctx)).sudo();
        }
        const tasks = await _super(Task, self).create(valsList);
        await tasks._populateMissingPersonalStages();
        const user = await self.env.user();
        await self._taskMessageAutoSubscribeNotify(MapKey.fromEntries(await tasks.map(async (task) => [task, (await task.userIds).sub(user)])));

        // in case we were already in sudo, we don't check the rights.
        if (isPortalUser && !wasInSudo) {
            // since we use sudo to create tasks, we need to check
            // if the portal user could really create the tasks based on the ir rule.
            await (await tasks.withUser(user)).checkAccessRule('create');
        }
        for (const task of tasks) {
            if (await (await task.projectId).privacyVisibility == 'portal') {
                await task._portalEnsureToken();
            }
        }
        return tasks;
    }

    async write(vals) {
        if (len(this) == 1) {
            await handleHistoryDivergence(this, 'description', vals);
        }
        let portalCanWrite = false;
        if (await (await this.env.user()).hasGroup('base.groupPortal') && !this.env.su) {
            // Check if all fields in vals are in SELF_WRITABLE_FIELDS
            await this._ensureFieldsAreAccessible(Object.keys(vals), 'write', false);
            await this.checkAccessRights('write');
            await this.checkAccessRule('write');
            portalCanWrite = true;
        }

        const now = _Datetime.now();
        if ('parentId' in vals && this.ids.includes(vals['parentId'])) {
            throw new UserError(await this._t("Sorry. You can't set a task as its parent task."));
        }
        if ('active' in vals && !vals['active'] && await (await this.mapped('recurrenceId')).some(id => id)) {
            // TODO: show a dialog to stop the recurrence
            throw new UserError(await this._t('You cannot archive recurring tasks. Please disable the recurrence first.'));
        }
        if ('recurrenceId' in vals && vals['recurrenceId'] && await this.some(async (task) => !await task.active)) {
            throw new UserError(await this._t('Archived tasks cannot be recurring. Please unarchive the task first.'));
        }
        // stage change: update dateLastStageUpdate
        if ('stageId' in vals) {
            update(vals, await this.updateDateEnd(vals['stageId']));
            vals['dateLastStageUpdate'] = now;
            // reset kanban state when changing stage
            if (!('kanbanState' in vals)) {
                vals['kanbanState'] = 'normal';
            }
        }
        // userIds change: update dateAssign
        if (vals['userIds'] && !('dateAssign' in vals)) {
            vals['dateAssign'] = now;
        }

        // recurrence fields
        const recFields = _.intersection(Object.keys(vals), this._getRecurrenceFields());
        if (recFields.length) {
            const recValues = Object.fromEntries(recFields.map(recField => [recField, vals[recField]]));
            for (const task of this) {
                if ((await task.recurrenceId).ok) {
                    await (await task.recurrenceId).write(recValues);
                }
                else if (vals['recurringTask']) {
                    recValues['nextRecurrenceDate'] = _Date.today();
                    const recurrence = await this.env.items('project.task.recurrence').create(recValues);
                    await task.set('recurrenceId', recurrence.id);
                }
            }
        }

        const recurrence = await this['recurrenceId'];
        if (!(vals['recurringTask'] ?? true) && recurrence.ok) {
            const tasksInRecurrence = await recurrence.taskIds;
            await recurrence.unlink();
            await tasksInRecurrence.write({ 'recurringTask': false });
        }

        let tasks = this;
        const recurrenceUpdate = pop(vals, 'recurrenceUpdate', 'this');
        if (recurrenceUpdate !== 'this') {
            let recurrenceDomain = [];
            if (recurrenceUpdate == 'subsequent') {
                for (const task of this) {
                    recurrenceDomain = OR([recurrenceDomain, ['&', ['recurrenceId', '=', (await task.recurrenceId).id], ['createdAte', '>=', await task.createdAt]]]);
                }
            }
            else {
                recurrenceDomain = [['recurrenceId', 'in', (await this['recurrenceId']).ids]];
            }
            tasks = tasks.or(await this.env.items('project.task').search(recurrenceDomain));
        }

        // The sudo is required for a portal user as the record update
        // requires the write access on others models, as rating.rating
        // in order to keep the same name than the task.
        if (portalCanWrite) {
            tasks = await tasks.sudo();
        }

        // Track userIds to send assignment notifications
        const oldUserIds = MapKey.fromEntries(await this.map(async (task) => [task, await task.userIds]));

        const result = await _super(Task, tasks).write(vals);

        await this._taskMessageAutoSubscribeNotify(MapKey.fromEntries(await this.map(async (task) => [task, (await task.userIds).sub(oldUserIds.get(task)).sub(await this.env.user())])));

        if ('userIds' in vals) {
            await tasks._populateMissingPersonalStages();
        }

        // rating on stage
        if ('stageId' in vals && vals['stageId']) {
            await (await tasks.filtered(async (x) => await (await x.projectId).ratingActive && await (await x.projectId).ratingStatus == 'stage'))._sendTaskRatingMail(true);
        }
        for (const task of this) {
            if ((await task.displayProjectId).ne(await task.projectId) && !(await task.parentId).ok) {
                // We must make the displayProjectId follow the projectId if no parentId set
                await task.set('displayProjectId', await task.projectId);
            }
        }
        return result;
    }

    async updateDateEnd(stageId) {
        const projectTaskType = this.env.items('project.task.type').browse(stageId);
        if (await projectTaskType.fold || await projectTaskType.isClosed) {
            return { 'dateEnd': _Datetime.now() }
        }
        return { 'dateEnd': false }
    }

    @api.ondelete(false)
    async _unlinkExceptRecurring() {
        if (await (await this.mapped('recurrenceId')).some(id => id)) {
            // TODO: show a dialog to stop the recurrence
            throw new UserError(await this._t('You cannot delete recurring tasks. Please disable the recurrence first.'));
        }
    }

    // ---------------------------------------------------
    // Subtasks
    // ---------------------------------------------------

    /**
     * Compute the partnerId when the tasks have no partnerId.

        Use the project partnerId if any, or else the parent task partnerId.
     */
    @api.depends('parentId', 'projectId', 'displayProjectId')
    async _computePartnerId() {
        for (const task of await this.filtered(async (task) => !(await task.partnerId).ok)) {
            // When the task has a parent task, the displayProjectId can be false or the project choose by the user for this task.
            const project = (await task.parentId).ok && (await task.displayProjectId).ok ? await task.displayProjectId : await task.projectId;
            await task.set('partnerId', await this._getDefaultPartnerId(project, await task.parentId));
        }
    }

    @api.depends('partnerId.email', 'parentId.emailFrom')
    async _computeEmailFrom() {
        for (const task of this) {
            const [parent, partner] = await task('parentId', 'partnerId');
            await task.set('emailFrom', await partner.email || ((partner.ok ? partner : parent).ok && await task.emailFrom) || await parent.emailFrom);
        }
    }

    @api.depends('parentId.projectId', 'displayProjectId')
    async _computeProjectId() {
        for (const task of this) {
            const parent = await task.parentId;
            if (parent.ok) {
                await task.set('projectId', (await task.displayProjectId).ok ? await task.displayProjectId : await parent.projectId);
            }
        }
    }

    // ---------------------------------------------------
    // Mail gateway
    // ---------------------------------------------------

    @api.model()
    async _taskMessageAutoSubscribeNotify(usersPerTask) {
        // Utility method to send assignation notification upon writing/creation.
        const templateId = await this.env.items('ir.model.data')._xmlidToResId('project.projectMessageUserAssigned', false);
        if (!bool(templateId)) {
            return;
        }
        const view = this.env.items('ir.ui.view').browse(templateId);
        const taskModelDescription = await (await this.env.items('ir.model')._get(this._name)).displayName;
        for (const [task, users] of usersPerTask.items()) {
            if (!bool(users)) {
                continue;
            }
            const values = {
                'object': task,
                'modelDescription': taskModelDescription,
                'accessLink': await task._notifyGetActionLink('view'),
            }
            for (const user of users) {
                update(values, { assigneeName: await (await user.sudo()).label });
                let assignationMsg = await view._render(values, 'ir.qweb', true);
                assignationMsg = await this.env.items('mail.render.mixin')._replaceLocalLinks(assignationMsg);
                await task.messageNotify({
                    subject: await this._t('You have been assigned to %s', await task.displayName),
                    body: assignationMsg,
                    partnerIds: (await user.partnerId).ids,
                    recordName: await task.displayName,
                    emailLayoutXmlid: 'mail.mailNotificationLight',
                    modelDescription: taskModelDescription,
                });
            }
        }
    }

    async _messageAutoSubscribeFollowers(updatedValues, defaultSubtypeIds) {
        if (!('userIds' in updatedValues)) {
            return [];
        }
        // Since the changes to userIds becoming a m2m, the default implementation of this function
        //  could not work anymore, override the function to keep the functionality.
        const newFollowers = [];
        // Normalize input to tuple of ids
        const value = await this._fields['userIds'].convertToCache(updatedValues['userIds'] ?? [], this.env.items('project.task'), false);
        const users = this.env.items('res.users').browse(value);
        for (const user of users) {
            try {
                if ((await user.partnerId).ok) {
                    // The you have been assigned notification is handled separately
                    newFollowers.push([(await user.partnerId).id, defaultSubtypeIds, false]);
                }
            }
            catch (e) {
                // pass;
            }
        }
        return newFollowers;
    }

    async _mailTrack(trackedFields, initialValues) {
        const [changes, trackingValueIds] = await _super(Task, this)._mailTrack(trackedFields, initialValues);
        // Many2many tracking
        if (len(changes) > len(trackingValueIds)) {
            for (const changedField of changes) {
                if (['one2many', 'many2many'].includes(trackedFields[changedField]['type'])) {
                    const field = await this.env.items('ir.model.fields')._get(this._name, changedField);
                    const vals = {
                        'field': field.id,
                        'fieldDesc': await field.fieldDescription,
                        'fieldType': await field.ttype,
                        'trackingSequence': await field.tracking,
                        'oldValueChar': (await (await initialValues[changedField]).mapped('label')).join(', '),
                        'newValueChar': (await (await this[changedField]).mapped('label')).join(', '),
                    }
                    trackingValueIds.push(Command.create(vals));
                }
            }
        }
        // Track changes on depending tasks
        const dependsTrackedFields = await this._getDependsTrackedFields();
        const dependsChanges = _.intersection(changes, dependsTrackedFields);
        if (dependsChanges.length && await this['allowTaskDependencies'] && await this.userHasGroups('project.groupProjectTaskDependencies')) {
            const parentIds = await this['dependentIds'];
            if (parentIds.ok) {
                const fieldsToIds = await this.env.items('ir.model.fields')._getIds('project.task');
                const fieldIds = dependsChanges.map(name => fieldsToIds.get(name));
                const dependsTrackingValueIds = trackingValueIds.filter(trackingValues => fieldIds.includes(trackingValues[2]['field']));
                const subtype = await this.env.items('ir.model.data')._xmlidToResId('project.mtTaskDependencyChange');
                // We want to include the original subtype message coming from the child task
                // for example when the stage changes the message in the chatter starts with 'Stage Changed'
                const childSubtype = await this._trackSubtype(Object.fromEntries(changes.map(colName => [colName, initialValues[colName]])));
                const childSubtypeInfo = bool(childSubtype) ? await childSubtype.description || await childSubtype.label : false;
                // NOTE: the subtype does not have a description on purpose, otherwise the description would be put
                //  at the end of the message instead of at the top, we use the name here
                const body = await this.env.items('ir.qweb')._render('project.taskTrackDependingTasks', {
                    'child': this,
                    'childSubtype': childSubtypeInfo,
                });
                for (const p of parentIds) {
                    await p.messagePost({ body, subtypeId: subtype, trackingValueIds: dependsTrackingValueIds });
                }
            }
        }
        return [changes, trackingValueIds];
    }

    async _trackTemplate(changes) {
        const res = await _super(Task, this)._trackTemplate(changes);
        const testTask = this[0];
        if ('stageId' in changes && (await (await testTask.stageId).mailTemplateId).ok) {
            res['stageId'] = [await (await testTask.stageId).mailTemplateId, {
                'autoDeleteMessage': true,
                'subtypeId': await this.env.items('ir.model.data')._xmlidToResId('mail.mtNote'),
                'emailLayoutXmlid': 'mail.mailNotificationLight'
            }];
        }
        return res;
    }

    async _creationSubtype() {
        return this.env.ref('project.mtTaskNew');
    }

    async _trackSubtype(initValues) {
        this.ensureOne();
        if ('kanbanStateLabel' in initValues && await this['kanbanState'] == 'blocked') {
            return this.env.ref('project.mtTaskBlocked');
        }
        else if ('kanbanStateLabel' in initValues && await this['kanbanState'] == 'done') {
            return this.env.ref('project.mtTaskReady');
        }
        else if ('stageId' in initValues) {
            return this.env.ref('project.mtTaskStage');
        }
        return _super(Task, this)._trackSubtype(initValues);
    }

    async _mailGetMessageSubtypes() {
        let res = await _super(Task, this)._mailGetMessageSubtypes();
        if (len(this) == 1) {
            const dependencySubtype = await this.env.ref('project.mtTaskDependencyChange');
            const project = await this['projectId'];
            if (((project.ok && !await project.allowTaskDependencies)
                || (!project.ok && !await this.userHasGroups('project.groupProjectTaskDependencies')))
                && res.includes(dependencySubtype)) {
                res = res.sub(dependencySubtype);
            }
        }
        return res;
    }

    /**
     * Handle project users and managers recipients that can assign
        tasks and create new one directly from notification emails. Also give
        access button to portal users and portal customers. If they are notified
        they should probably have access to the document.
     * @param msgVals 
     * @returns 
     */
    async _notifyGetGroups(msgVals?: any) {
        let groups: any[] = await _super(Task, this)._notifyGetGroups(msgVals);
        const localMsgVals = Object.assign({}, msgVals ?? {});
        this.ensureOne();

        const projectUserGroupId = await this.env.refId('project.groupProjectUser');
        const newGroup = ['groupProjectUser', pdata => pdata['type'] == 'user' && projectUserGroupId.includes(pdata['groups']), {}];
        groups = [newGroup].concat(groups);

        if (await this['projectPrivacyVisibility'] == 'portal') {
            groups.splice(0, 0, [
                'allowedPortalUsers',
                pdata => pdata['type'] == 'portal',
                {}
            ]);
        }
        const portalPrivacy = await (await this['projectId']).privacyVisibility == 'portal';
        for (const [groupName, groupMethod, groupData] of groups) {
            if (['customer', 'user'].includes(groupName) || groupName == 'portalCustomer' && !portalPrivacy) {
                groupData['hasButtonAccess'] = false;
            }
            else if (groupName == 'portalCustomer' && portalPrivacy) {
                groupData['hasButtonAccess'] = true;
            }
        }

        return groups;
    }

    /**
     * Override to set alias of tasks to their project if any.
     * @param defaults 
     * @param records 
     * @param company 
     * @param docNames 
     */
    async _notifyGetReplyTo(defaults?: any, records?: any, company?: any, docNames?: any) {
        const aliases = await (await (await this.sudo()).mapped('projectId'))._notifyGetReplyTo(defaults, null, company, null);
        const res: Dict = Dict.from(await this.map(async (task) => [task.id, aliases.get((await task.projectId).id)]));
        const leftover = await this.filtered(async (rec) => !(await rec.projectId).ok);
        if (bool(leftover)) {
            res.updateFrom(await _super(Task, leftover)._notifyGetReplyTo(defaults, null, company, docNames));
        }
        return res;
    }

    async emailSplit(msg) {
        const emailList = emailSplit((msg['to'] || '') + ',' + (msg['cc'] || ''));
        // check left-part is not already an alias
        const aliases = await this.mapped('projectId.aliasName');
        return emailList.filter(x => !aliases.includes(x.split('@')[0]));
    }

    /**
     * Overrides mailThread messageNew that is called by the mailgateway
            through messageProcess.
            This override updates the document according to the email.
     * @param msg 
     * @param customValues 
     */
    @api.model()
    async messageNew(msg, customValues?: any) {
        // remove default author when going through the mail gateway. Indeed we
        // do not want to explicitly set userId to false; however we do not
        // want the gateway user to be responsible if no other responsible is
        // found.
        const createContext = Object.assign({}, this.env.context ?? {});
        createContext['default_userIds'] = false;
        if (customValues == null) {
            customValues = {};
        }
        const defaults = {
            'label': msg['subject'] || await this._t("No Subject"),
            'emailFrom': msg['from'],
            'plannedHours': 0.0,
            'partnerId': msg['authorId']
        }
        update(defaults, customValues);

        const task = await _super(Task, await this.withContext(createContext)).messageNew(msg, defaults);
        const emailList = await task.emailSplit(msg);
        const partnerIds = (await this.env.items('mail.thread')._mailFindPartnerFromEmails(emailList, { records: task, forceCreate: false })).filter(p => p).map(p => p.id);
        await task.messageSubscribe(partnerIds);
        return task;
    }

    /**
     * Override to update the task according to the email.
     * @param msg 
     * @param updateVals 
     * @returns 
     */
    async messageUpdate(msg, updateVals?: any) {
        const emailList = await this.emailSplit(msg);
        const partnerIds = (await this.env.items('mail.thread')._mailFindPartnerFromEmails(emailList, { records: this, forceCreate: false })).filter(p => p).map(p => p.id);
        await this.messageSubscribe(partnerIds);
        return _super(Task, this).messageUpdate(msg, updateVals);
    }

    async _messageGetSuggestedRecipients() {
        const recipients = await _super(Task, this)._messageGetSuggestedRecipients();
        for (const task of this) {
            if ((await task.partnerId).ok) {
                const reason = await (await task.partnerId).email ? await this._t('Customer Email') : await this._t('Customer');
                await task._messageAddSuggestedRecipient(recipients, { partner: await task.partnerId, reason: reason });
            }
            else if (await task.emailFrom) {
                await task._messageAddSuggestedRecipient(recipients, { email: await task.emailFrom, reason: await this._t('Customer Email') });
            }
        }
        return recipients;
    }

    async _notifyEmailHeaderDict() {
        const headers = await _super(Task, this)._notifyEmailHeaderDict();
        if ((await this['projectId']).ok) {
            const currentObjects = (headers['X-Verp-Objects'] ?? '').split(',').filter(h => h);
            currentObjects.splice(0, 0, f('project.project-%s, ', (await this['projectId']).id));
            headers['X-Verp-Objects'] = currentObjects.join(',');
        }
        if ((await this['tagIds']).ok) {
            headers['X-Verp-Tags'] = (await (await this['tagIds']).mapped('label')).join(',');
        }
        return headers;
    }

    async _messagePostAfterHook(message, msgVals) {
        if ((await message.attachmentIds).ok && !(await this['displayedImageId']).ok) {
            const imageAttachments = await (await message.attachmentIds).filtered(async (a) => await a.mimetype == 'image');
            if (bool(imageAttachments)) {
                await this.set('displayedImageId', imageAttachments[0]);
            }
        }

        if (await this['emailFrom'] && !(await this['partnerId']).ok) {
            // we consider that posting a message with a specified recipient (not a follower, a specific one)
            // on a document without customer means that it was created through the chatter using
            // suggested recipients. This heuristic allows to avoid ugly hacks in JS.
            const emailNormalized = emailNormalize(await this['emailFrom']);
            const newPartner = await (await message.partnerIds).filtered(
                async (partner) => await partner.email == await this['emailFrom'] || (emailNormalized && await partner.emailNormalized == emailNormalized)
            );
            if (bool(newPartner)) {
                let emailDomain;
                if (await newPartner[0].emailNormalized) {
                    emailDomain = ['emailFrom', 'in', [await newPartner[0].email, await newPartner[0].emailNormalized]];
                }
                else {
                    emailDomain = ['emailFrom', '=', await newPartner[0].email];
                }
                await (await this.search([
                    ['partnerId', '=', false], emailDomain, ['stageId.fold', '=', false]
                ])).write({ 'partnerId': newPartner[0].id });
            }
        }
        return _super(Task, this)._messagePostAfterHook(message, msgVals);
    }

    async actionAssignToMe() {
        await this.write({ 'userIds': [[4, (await this.env.user()).id]] });
    }

    async actionUnassignMe() {
        await this.write({ 'userIds': [Command.unlink(this.env.uid)] });
    }

    // If depth == 1, return only direct children
    // If depth == 3, return children to third generation
    // If depth <= 0, return all children without depth limit
    async _getAllSubtasks(depth = 0) {
        const children = await this.mapped('childIds');
        if (!bool(children)) {
            return this.env.items('project.task');
        }
        if (depth == 1) {
            return children;
        }
        return children.add(await children._getAllSubtasks(depth - 1));
    }

    async actionOpenParentTask() {
        return {
            'label': this._t('Parent Task'),
            'viewMode': 'form',
            'resModel': 'project.task',
            'resId': (await this['parentId']).id,
            'type': 'ir.actions.actwindow',
            'context': this._context
        }
    }

    // ------------
    // Actions
    // ------------

    async actionOpenTask() {
        return {
            'viewMode': 'form',
            'resModel': 'project.task',
            'resId': this.id,
            'type': 'ir.actions.actwindow',
            'context': this._context
        }
    }

    async actionDependentTasks() {
        this.ensureOne();
        const action = {
            'resModel': 'project.task',
            'type': 'ir.actions.actwindow',
            'context': { ...this._context, 'default_dependOnIds': [Command.link(this.id)], 'showProjectUpdate': false },
            'domain': [['dependOnIds', '=', this.id]],
        }
        if (await this['dependentTasksCount'] == 1) {
            action['viewMode'] = 'form';
            action['resId'] = (await this['dependentIds']).id;
            action['views'] = [[false, 'form']];
        }
        else {
            action['label'] = await this._t('Dependent Tasks');
            action['viewMode'] = 'tree,form,kanban,calendar,pivot,graph,activity';
        }
        return action;
    }

    async actionRecurringTasks() {
        return {
            'label': 'Tasks in Recurrence',
            'type': 'ir.actions.actwindow',
            'resModel': 'project.task',
            'viewMode': 'tree,form,kanban,calendar,pivot,graph,activity',
            'domain': [['recurrenceId', 'in', (await this['recurrenceId']).ids]],
        }
    }

    async actionStopRecurrence() {
        const tasks = await (await this.env.items('project.task').withContext({ activeTest: false })).search([['recurrenceId', 'in', (await this['recurrenceId']).ids]]);
        await tasks.write({ 'recurringTask': false });
        await (await this['recurrenceId']).unlink();
    }

    async actionContinueRecurrence() {
        await this.set('recurrenceId', false);
        await this.set('recurringTask', false);
    }

    // ---------------------------------------------------
    // Rating business
    // ---------------------------------------------------

    async _sendTaskRatingMail(forceSend = false) {
        for (const task of this) {
            const ratingTemplate = await (await task.stageId).ratingTemplateId;
            if (bool(ratingTemplate)) {
                await task.ratingSendRequest(ratingTemplate, { lang: await (await task.partnerId).lang, forceSend: forceSend });
            }
        }
    }

    async ratingGetPartnerId() {
        const res = await _super(Task, this).ratingGetPartnerId();
        if (!bool(res) && (await (await this['projectId']).partnerId).ok) {
            return (await this['projectId']).partnerId;
        }
        return res;
    }

    async ratingApply(rate, token?: any, feedback?: any, subtypeXmlid?: any) {
        return _super(Task, this).ratingApply(rate, token, feedback, "project.mtTaskRating");
    }

    async _ratingGetParentFieldName() {
        return 'projectId';
    }

    /**
     * Overwrite since we have userIds and not userId
     * @returns 
     */
    async ratingGetRatedPartnerId() {
        const tasksWithOneUser = await this.filtered(async (task) => len(await task.userIds) == 1 && (await (await task.userIds).partnerId).ok);
        const partner = await (await tasksWithOneUser.userIds).partnerId;
        return partner.ok ? partner : this.env.items('res.partner');
    }

    // ---------------------------------------------------
    // Privacy
    // ---------------------------------------------------
    async _changeProjectPrivacyVisibility() {
        for (const task of await this.filtered(async (t) => await t.projectPrivacyVisibility != 'portal')) {
            const portalUsers = await (await (await task.messagePartnerIds).userIds).filtered('share');
            await task.messageUnsubscribe({ partnerIds: (await portalUsers.partnerId).ids });
        }
    }

    // ---------------------------------------------------
    // Analytic accounting
    // ---------------------------------------------------
    async _getTaskAnalyticAccountId() {
        this.ensureOne();
        return (await this['analyticAccountId']).ok ? await this['analyticAccountId'] : await this['projectAnalyticAccountId'];
    }
}

/**
 * Tags of project's tasks
 */
@MetaModel.define()
class ProjectTags extends Model {
    static _module = module;
    static _name = "project.tags";
    static _description = "Project Tags";

    async _getDefaultColor() {
        return randomInt(1, 11);
    }

    static label = Fields.Char('Label', { required: true });
    static color = Fields.Integer({ string: 'Color', default: self => self._getDefaultColor() });

    static _sqlConstraints = [
        ['label_uniq', 'unique (label)', "Tag label already exists!"],
    ];
}