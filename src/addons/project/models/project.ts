import assert from "node:assert";
import { randomInt } from "node:crypto";
import { _Datetime, Command, Fields } from "../../../core";
import { MetaModel, Model } from "../../../core/models";
import { _f2, _format2, addDate, bool, f, formatAmount, map, pop, range, stringify, sum, toFormat, update } from "../../../core/tools";
import { DefaultDict, DefaultMapKey } from "../../../core/helper";
import { STATUS_COLOR } from "./project_update";
import { literalEval } from "../../../core/tools/save_eval";
import { getattr } from "../../../core/api";

// from verp import api, Command, fields, models, tools, SUPERUSER_ID, _, _lt
// from verp.addons.web_editor.controllers.main import handle_history_divergence
// from verp.exceptions import UserError, ValidationError, AccessError
// from verp.tools import format_amount
// from verp.osv.expression import OR, TRUE_LEAF, FALSE_LEAF

// from .project_update import STATUS_COLOR
// from verp.tools.misc import get_lang

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
        default_projectId = this.env.context['default_projectId'];
        return default_projectId ? [default_projectId] : null;
    }

    static active = Fields.Boolean('Active', {default: true});
    static label = Fields.Char({string: 'Name', required: true, translate: true});
    static description = Fields.Text({translate: true});
    static sequence = Fields.Integer({default: 1});
    static projectIds = Fields.Many2many('project.project', {relation: 'projectTaskTypeRel', column1: 'typeId', column2:  'projectId', string: 'Projects', default: self => self._getDefaultProjectIds()});
    static legendBlocked = Fields.Char(
        'Red Kanban Label', {default: s => s._t('Blocked'), translate: true, required: true,
        help: 'Override the default value displayed for the blocked state for kanban selection when the task or issue is in that stage.'});
    static legendDone = Fields.Char(
        'Green Kanban Label', {default: s => s._t('Ready'), translate: true, required: true,
        help: 'Override the default value displayed for the done state for kanban selection when the task or issue is in that stage.'});
    static legendNormal = Fields.Char(
        'Grey Kanban Label', {default: s => s._t('In Progress'), translate: true, required: true,
        help: 'Override the default value displayed for the normal state for kanban selection when the task or issue is in that stage.'});
    static mailTemplateId = Fields.Many2one(
        'mail.template',
        {string: 'Email Template',
        domain: [['model', '=', 'project.task']],
        help: "If set, an email will be sent to the customer when the task or issue reaches this step."});
    static fold = Fields.Boolean({string: 'Folded in Kanban',
        help: 'This stage is folded in the kanban view when there are no records in that stage to display.'});
    static ratingTemplateId = Fields.Many2one(
        'mail.template',
        {string: 'Rating Email Template',
        domain: [['model', '=', 'project.task']],
        help: "If set and if the project's rating configuration is 'Rating when changing stage', then an email will be sent to the customer when the task reaches this step."});
    static autoValidationKanbanState = Fields.Boolean('Automatic kanban status', {default: false,
        help: ["Automatically modify the kanban state when the customer replies to the feedback for this stage.\n",
            " * Good feedback from the customer will update the kanban state to 'ready for the new stage' (green bullet).\n",
            " * Neutral or bad feedback will set the kanban state to 'blocked' (red bullet)."].join()});
    static isClosed = Fields.Boolean('Closing Stage', {help: "Tasks in this stage are considered as closed."});
    static disabledRatingWarning = Fields.Text({compute: '_computeDisabledRatingWarning'});

    static userId = Fields.Many2one('res.users', 'Stage Owner', {index: true});

    async unlinkWizard(stageView=false) {
        const self = await this.withContext({activeTest: false});
        // retrieves all the projects with a least 1 task in that stage
        // a task can be in a stage even if the project is not assigned to the stage
        const readgroup = await (await self.withContext({activeTest: false})).env.items('project.task').readGroup([['stageId', 'in', self.ids]], ['projectId'], ['projectId']);
        const projectIds = [...new Set(readgroup.map(project => project['projectId'][0]).concat((await self.projectIds).ids))];

        const wizard = await (await self.withContext({projectIds})).env.items('project.task.type.delete.wizard').create({
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
            await (await this.env.items('project.task').search([['stageId', 'in', this.ids]])).write({'active': false});
        }
        return _super(ProjectTaskType, this).write(vals);
    }

    @api.depends('projectIds', 'projectIds.ratingActive')
    async _computeDisabledRatingWarning() {
        for (const stage of this) {
            const disabledProjects = await (await stage.projectIds).filtered(async (p) => !await p.ratingActive);
            if (bool(disabledProjects)) {
                await stage.set('disabledRatingWarning', (await disabledProjects.map(async (p) => format('- %s', await p.label))).join('\n'));
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
            .search([['userId', '=', (await this['userId']).id]], {order: 'sequence DESC'});
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
        const res = await this.env.cr.execute(_format(`
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
            {"projectIds": String(this.ids) || 'NULL'}
        ));
        const docCounts = Object.fromEntries(res.map(row => [row.id, row.count]));
        for (const project of this) {
            await project.set('docCount', docCounts[project.id] || 0);
        }
    }

    async _computeTaskCount() {
        const taskData = this.env.items('project.task').readGroup(
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
        return this.env.items('project.project.stage').search([], {limit: 1});
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
        await notFavProjects.write({'favoriteUserIds': [[4, this.env.uid]]});
        await favoriteProjects.write({'favoriteUserIds': [[3, this.env.uid]]});
    }

    async _getDefaultFavoriteUserIds() {
        return [[6, 0, [this.env.uid]]];
    }

    @api.model()
    async _readGroupStageIds(stages, domain, order) {
        return this.env.items('project.project.stage').search([], {order});
    }

    static label = Fields.Char("Name", {index: true, required: true, tracking: true, translate: true});
    static description = Fields.Html();
    static active = Fields.Boolean({default: true,
        help: "If the active field is set to false, it will allow you to hide the project without removing it."});
    static sequence = Fields.Integer({default: 10, help: "Gives the sequence order when displaying a list of Projects."});
    static partnerId = Fields.Many2one('res.partner', {string: 'Customer', autojoin: true, tracking: true, domain: "['|', ['companyId', '=', false], ['companyId', '=', companyId]]"});
    static partnerEmail = Fields.Char({
        compute: '_computePartnerEmail', inverse: '_inversePartnerEmail',
        string: 'Email', readonly: false, store: true, copy: false});
    static partnerPhone = Fields.Char({
        compute: '_computePartnerPhone', inverse: '_inversePartnerPhone',
        string: "Phone", readonly: false, store: true, copy: false});
    static commercialPartnerId = Fields.Many2one({related: "partnerId.commercialPartnerId"});
    static companyId = Fields.Many2one('res.company', {string: 'Company', required: true, default: self => self.env.company()});
    static currencyId = Fields.Many2one('res.currency', {related: "companyId.currencyId", string: "Currency", readonly: true});
    static analyticAccountId = Fields.Many2one('account.analytic.account', {string: "Analytic Account", copy: false, ondelete: 'SET NULL',
        domain: "['|', ['companyId', '=', false], ['companyId', '=', companyId]]", checkCompany: true,
        help: ["Analytic account to which this project is linked for financial management. ",
             "Use an analytic account to record cost and revenue on your project."].join()});
    static analyticAccountBalance = Fields.Monetary({related: "analyticAccountId.balance"});

    static favoriteUserIds = Fields.Many2many(
        'res.users', {relation: 'projectFavoriteUserRel', column1: 'projectId', column2: 'userId',
        default: self => self._getDefaultFavoriteUserIds(),
        string: 'Members'});
    static isFavorite = Fields.Boolean({compute: '_computeIsFavorite', inverse: '_inverseIsFavorite',
        string: 'Show Project on Dashboard',
        help: "Whether this project should be displayed on your dashboard."});
    static labelTasks = Fields.Char({string: 'Use Tasks as', default: 'Tasks', help: "Label used for the tasks of the project.", translate: true});
    static tasks = Fields.One2many('project.task', 'projectId', {string: "Task Activities"});
    static resourceCalendarId = Fields.Many2one(
        'resource.calendar', {string: 'Working Time',
        related: 'companyId.resourceCalendarId'});
    static typeIds = Fields.Many2many('project.task.type', {relation: 'projectTaskTypeRel', column1: 'projectId', column2: 'typeId', string: 'Tasks Stages'});
    static taskCount = Fields.Integer({compute: '_computeTaskCount', string: "Task Count"});
    static taskCountWithSubtasks = Fields.Integer({compute: '_computeTaskCount'});
    static taskIds = Fields.One2many('project.task', 'projectId', {string: 'Tasks',
                               domain: ['|', ['stageId.fold', '=', false], ['stageId', '=', false]]});
    static color = Fields.Integer({string: 'Color Index'});
    static userId = Fields.Many2one('res.users', {string: 'Project Manager', default: self => self.env.user(), tracking: true});
    static aliasEnabled = Fields.Boolean({string: 'Use Email Alias', compute: '_computeAliasEnabled', readonly: false});
    static aliasId = Fields.Many2one('mail.alias', {string: 'Alias', ondelete: "RESTRICT", required: true,
        help: ["Internal email associated with this project. Incoming emails are automatically synchronized ",
             "with Tasks (or optionally Issues if the Issue Tracker module is installed)."].join()});
    static aliasValue = Fields.Char({string: 'Alias email', compute: '_computeAliasValue'});
    static privacyVisibility = Fields.Selection([
            ['followers', 'Invited employees'],
            ['employees', 'All employees'],
            ['portal', 'Invited portal users and all employees'],
        ],
        {string: 'Visibility', required: true,
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
            "provided that they are given the corresponding URL (and that they are part of the followers if the project is private)."].join()});
    static docCount = Fields.Integer({compute: '_computeAttachedDocsCount', string: "Number of documents attached"});
    static dateStart = Fields.Date({string: 'Start Date'});
    static date = Fields.Date({string: 'Expiration Date', index: true, tracking: true});
    static allowSubtasks = Fields.Boolean('Sub-tasks', {default: async (self) => (await self.env.user()).hasGroup('project.groupSubtaskProject')});
    static allowRecurringTasks = Fields.Boolean('Recurring Tasks', {default: async (self) => (await self.env.user()).hasGroup('project.groupProjectRecurringTasks')});
    static allowTaskDependencies = Fields.Boolean('Task Dependencies', {default: async (self) => (await self.env.user()).hasGroup('project.groupProjectTaskDependencies')});
    static tagIds = Fields.Many2many('project.tags', {relation: 'projectProjectProjectTagsRel', string: 'Tags'});

    // Project Sharing fields
    static collaboratorIds = Fields.One2many('project.collaborator', 'projectId', {string: 'Collaborators', copy: false});
    static collaboratorCount = Fields.Integer('# Collaborators', {compute: '_computeCollaboratorCount', computeSudo: true});

    // rating fields
    static ratingRequestDeadline = Fields.Datetime({compute: '_computeRatingRequestDeadline', store: true});
    static ratingActive = Fields.Boolean('Customer Ratings', {default: async (self) => (await self.env.user()).hasGroup('project.groupProjectRating')});
    static ratingStatus = Fields.Selection(
        [['stage', 'Rating when changing stage'],
         ['periodic', 'Periodic rating']
        ], {string: 'Customer Ratings Status', default: "stage", required: true,
        help: ["How to get customer feedback?\n",
             "- Rating when changing stage: an email will be sent when a task is pulled to another stage.\n",
             "- Periodic rating: an email will be sent periodically.\n\n",
             "Don't forget to set up the email templates on the stages for which you want to get customer feedback."].join()});
    static ratingStatusPeriod = Fields.Selection([
        ['daily', 'Daily'],
        ['weekly', 'Weekly'],
        ['bimonthly', 'Twice a Month'],
        ['monthly', 'Once a Month'],
        ['quarterly', 'Quarterly'],
        ['yearly', 'Yearly']], {string: 'Rating Frequency', required: true, default: 'monthly'});

    // Not `required` since this is an option to enable in project settings.
    static stageId = Fields.Many2one('project.project.stage', {string: 'Stage', ondelete: 'RESTRICT', groups: "project.groupProjectStages",
        tracking: true, index: true, copy: false, default: self => self._defaultStageId(), groupExpand: '_readGroupStageIds'});

    static updateIds = Fields.One2many('project.update', 'projectId');
    static lastUpdateId = Fields.Many2one('project.update', {string: 'Last Update', copy: false});
    static lastUpdateStatus = Fields.Selection({selection: [
        ['onTrack', 'On Track'],
        ['atRisk', 'At Risk'],
        ['offTrack', 'Off Track'],
        ['onHold', 'On Hold']
    ], default: 'onTrack', compute: '_computeLastUpdateStatus', store: true});
    static lastUpdateColor = Fields.Integer({compute: '_computeLastUpdateColor'});
    static milestoneIds = Fields.One2many('project.milestone', 'projectId');
    static milestoneCount = Fields.Integer({compute: '_computeMilestoneCount'});

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
        const periods = {'daily': 1, 'weekly': 7, 'bimonthly': 15, 'monthly': 30, 'quarterly': 90, 'yearly': 365}
        for (const project of this) {
            await project.set('ratingRequestDeadline', addDate(_Datetime.now(), {days: periods[await project.ratingStatusPeriod] ?? 0}));
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
        // We want to copy archived task, but do not propagate an active_test context key
        let taskIds = (await (await this.env.items('project.task').withContext({activeTest: false})).search([['projectId', '=', this.id]], {order: 'parentId'})).ids;
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
            await tasks.browse(newChildIds).write({'parentId': newTask.id});
            oldToNewTasks[task.id] = newTask.id;
            if (await task.allowTaskDependencies) {
                const dependOnIds = await (await task.dependOnIds).map(t => !allTasks.includes(t) ? t.id : oldToNewTasks[t.id]);
                await newTask.write({'dependOnIds': dependOnIds.filter(tid => bool(tid)).map(tid => Command.link(tid))});
                dependentIds = (await task.dependentIds).map(t => !allTasks.includes(t) ? t.id : oldToNewTasks[t.id]);
                await newTask.write({'dependentIds': dependentIds.filter(tid => bool(tid)).map(tid => Command.link(tid))});
            }
            tasks = tasks.add(newTask);
        }

        return project.write({'tasks': [[6, 0, tasks.ids]]});
    }

    @api.returns('self', value => value.id)
    async copy(defaultValue=null) {
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
        let self = await this.withContext({mailCreateNosubscribe: true});
        const project = await _super(Project, self).create(vals);
        if (await project.privacyVisibility == 'portal' && (await project.partnerId).ok) {
            await project.messageSubscribe((await project.partnerId).ids);
        }
        return project;
    }

    async write(vals) {
        // directly compute is_favorite to dodge allow write access right
        if ('isFavorite' in vals) {
            pop(vals, 'isFavorite');
            this._fields['isFavorite'].determineInverse(this);
        }
        const res = bool(vals) ? await _super(Project, this).write(vals) : true;

        if ('allowRecurringTasks' in vals && !vals['allowRecurringTasks']) {
            await (await this.env.items('project.task').search([['projectId', 'in', this.ids], ['recurringTask', '=', true]])).write({'recurringTask': false});
        }

        if ('active' in vals) {
            // archiving/unarchiving a project does it on its tasks, too
            await (await (await this.withContext({activeTest: false})).mapped('tasks')).write({'active': vals['active']});
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
                projectsReadGroup.filter(res => res['analyticAccountId'] && res['analyticAccountId_count'] == 1).map(res => res['analytic_account_id'][0])
            );
            await analyticAccountToUpdate.write({'label': await this['label']});
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
        for (const project of await this.withContext({activeTest: false})) {
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
        taskSubtypes = bool(projectSubtypes) ? (await projectSubtypes.mapped('parentId')).or(await projectSubtypes.filtered(async (sub) => await sub.internal || await sub.default)).ids : null;
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
    async messageUnsubscribe(partnerIds=null) {
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
        await notFavProjects.write({'favoriteUserIds': [[4, this.env.uid]]});
        await favoriteProjects.write({'favoriteUserIds': [[3, this.env.uid]]});
    }

    async actionViewTasks() {
        const action = await (await (await (await this.withContext({activeId: this.id, activeIds: this.ids}))
            .env.ref('project.act_project_project_2_project_task_all'))
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
        return Object.assign(action, {context: actionContext});
    }

    /**
     * return the action to see the tasks analysis report of the project
     * @returns 
     */
    async actionViewTasksAnalysis() {
        const action = await this.env.items('ir.actions.actions')._forXmlid('project.actionProjectTaskUserTree');
        actionContext = action['context'] ? literalEval(action['context']) : {};
        actionContext['searchDefault_projectId'] = this.id;
        return Object.assign(action, {context: actionContext});
    }

    @api.model()
    async _actionOpenAllProjects() {
        const action = await this.env.items('ir.actions.actions')._forXmlid(
            !await this.userHasGroups('project.group_project_stages') ?
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
            'context': {'searchDefault_groupDate': 1, 'default_accountId': (await this['analyticAccountId']).id}
        }
    }

    // ---------------------------------------------
    //  PROJECT UPDATES
    // ---------------------------------------------

    async getLastUpdateOrDefault() {
        this.ensureOne();
        const labels = Object.fromEntries(await this._fields['lastUpdateStatus']._descriptionSelection(this.env));
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
        buttons = [{
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
            await project.write({'analyticAccountId': analyticAccount.id});
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
        await this.write({'collaboratorIds':
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
    async _getDefaultPartnerId(project=null, parent=null) {
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
        if (! projectId) {
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
        let searchDomain = [['id', 'in', stages.ids]];
        if ('default_projectId' in this.env.context) {
            searchDomain = ['|', ['projectIds', '=', this.env.context['default_projectId']]].concat(searchDomain);
        }

        const stageIds = await stages._search(searchDomain, {order, accessRightsUid: global.SUPERUSER_ID});
        return stages.browse(stageIds);
    }

    @api.model()
    async _readGroupPersonalStageTypeIds(stages, domain, order) {
        return stages.search(['|', ['id', 'in', stages.ids], ['userId', '=', (await this.env.user()).id]]);
    }

    static active = Fields.Boolean({default: true});
    static label = Fields.Char({string: 'Title', tracking: true, required: true, index: true});
    static description = Fields.Html({string: 'Description', sanitizeAttributes: false});
    static priority = Fields.Selection([
        ['0', 'Normal'],
        ['1', 'Important'],
    ], {default: '0', index: true, string: "Starred", tracking: true});
    static sequence = Fields.Integer({string: 'Sequence', index: true, default: 10,
        help: "Gives the sequence order when displaying a list of tasks."});
    static stageId = Fields.Many2one('project.task.type', {string: 'Stage', compute: '_computeStageId',
        store: true, readonly: false, ondelete: 'RESTRICT', tracking: true, index: true,
        default: self => self._getDefaultStageId(), groupExpand: '_readGroupStageIds',
        domain: "[['projectIds', '=', projectId]]", copy: false, taskDependencyTracking: true});
    static tagIds = Fields.Many2many('project.tags', {string: 'Tags'});
    static kanbanState = Fields.Selection([
        ['normal', 'In Progress'],
        ['done', 'Ready'],
        ['blocked', 'Blocked']], {string: 'Status',
        copy: false, default: 'normal', required: true});
    static kanbanStateLabel = Fields.Char({compute: '_computeKanbanStateLabel', string: 'Kanban State Label', tracking: true, taskDependencyTracking: true});
    static createdAt = Fields.Datetime("Created On", {readonly: true, index: true});
    static updatedAt = Fields.Datetime("Last Updated On", {readonly: true, index: true});
    static dateEnd = Fields.Datetime({string: 'Ending Date', index: true, copy: false});
    static dateAssign = Fields.Datetime({string: 'Assigning Date', index: true, copy: false, readonly: true});
    static dateDeadline = Fields.Date({string: 'Deadline', index: true, copy: false, tracking: true, taskDependencyTracking: true});
    static dateLastStageUpdate = Fields.Datetime({string: 'Last Stage Update',
        index: true,
        copy: false,
        readonly: true});
    static projectId = Fields.Many2one('project.project', {string: 'Project',
        compute: '_computeProjectId', recursive: true, store: true, readonly: false,
        index: true, tracking: true, checkCompany: true, changeDefault: true});
    // Defines in which project the task will be displayed / taken into account in statistics.
    // Example: 1 task A with 1 subtask B in project P
    // A -> projectId=P, displayProjectId=P
    // B -> projectId=P (to inherit from ACL/security rules), displayProjectId: false
    static displayProjectId = Fields.Many2one('project.project', {index: true});
    static plannedHours = Fields.Float("Initially Planned Hours", {help: 'Time planned to achieve this task (including its sub-tasks).', tracking: true});
    static subtaskPlannedHours = Fields.Float("Sub-tasks Planned Hours", {compute: '_computeSubtaskPlannedHours',
        help: "Sum of the time planned of all the sub-tasks linked to this task. Usually less than or equal to the initially planned time of this task."});
    // Tracking of this field is done in the write function
    static userIds = Fields.Many2many('res.users', {relation: 'projectTaskUserRel', column1: 'taskId', column2: 'userId',
        string: 'Assignees', default: async (self) => !await (await self.env.user()).share && await self.env.user(), context: {'activeTest': false}, tracking: true});
    // User names displayed in project sharing views
    static portalUserNames = Fields.Char({compute: '_computePortalUserNames', computeSudo: true, search: '_searchPortalUserNames'});
    // Second Many2many containing the actual personal stage for the current user
    // See project_task_stage_personal.py for the model defininition
    static personalStageTypeIds = Fields.Many2many('project.task.type', {relation: 'projectTaskUserRel', column1: 'taskId', column2: 'stageId', ondelete: 'RESTRICT', groupExpand: '_readGroupPersonalStageTypeIds', copy: false,
        domain: "[['userId', '=', user.id]]", depends: ['userIds'], string: 'Personal Stage'});
    // Personal Stage computed from the user
    static personalStageId = Fields.Many2one('project.task.stage.personal', {string: 'Personal Stage State', computeSudo: false, compute: '_computePersonalStageId', help: "The current user's personal stage."});
    // This field is actually a related field on personal_stage_id.stageId
    // However due to the fact that personal_stage_id is computed, the orm throws out errors
    // saying the field cannot be searched.
    static personalStageTypeId = Fields.Many2one('project.task.type', {string: 'Personal User Stage',
        compute: '_computePersonalStageTypeId', inverse: '_inversePersonalStageTypeId', store: false,
        search: '_searchPersonalStageTypeId',
        help: "The current user's personal task stage."});
    static partnerId = Fields.Many2one('res.partner',
        {string: 'Customer',
        compute: '_computePartnerId', recursive: true, store: true, readonly: false, tracking: true,
        domain: "['|', ['companyId', '=', false], ['companyId', '=', companyId]]"});
    static partnerIsCompany = Fields.Boolean({related: 'partnerId.isCompany', readonly: true});
    static commercialPartnerId = Fields.Many2one({related: 'partnerId.commercialPartnerId'});
    static partnerEmail = Fields.Char({
        compute: '_computePartnerEmail', inverse: '_inversePartnerEmail',
        string: 'Email', readonly: false, store: true, copy: false});
    static partnerPhone = Fields.Char({
        compute: '_computePartnerPhone', inverse: '_inversePartnerPhone',
        string: "Phone", readonly: false, store: true, copy: false});
    static partnerCity = Fields.Char({related: 'partnerId.city', readonly: false});
    static managerId = Fields.Many2one('res.users', {string: 'Project Manager', related: 'projectId.userId', readonly: true});
    static companyId = Fields.Many2one(
        'res.company', {string: 'Company', compute: '_computeCompanyId', store: true, readonly: false,
        required: true, copy: true, default: self => self._defaultCompanyId()});
    static color = Fields.Integer({string: 'Color Index'});
    static attachmentIds = Fields.One2many('ir.attachment', {compute: '_computeAttachmentIds', string: "Main Attachments",
        help: "Attachments that don't come from a message."});
    // In the domain of displayedImageId, we couln't use attachment_ids because a one2many is represented as a list of commands so we used resModel & resId
    static displayedImageId = Fields.Many2one('ir.attachment', {domain: "[['resModel', '=', 'project.task'], ['resId', '=', id], ['mimetype', 'ilike', 'image']]", string: 'Cover Image'});
    static legendBlocked = Fields.Char({related: 'stageId.legendBlocked', string: 'Kanban Blocked Explanation', readonly: true, relatedSudo: false});
    static legendDone = Fields.Char({related: 'stageId.legendDone', string: 'Kanban Valid Explanation', readonly: true, relatedSudo: false});
    static legendNormal = Fields.Char({related: 'stageId.legendNormal', string: 'Kanban Ongoing Explanation', readonly: true, relatedSudo: false});
    static isClosed = Fields.Boolean({related: "stageId.isClosed", string: "Closing Stage", readonly: true, relatedSudo: false});
    static parentId = Fields.Many2one('project.task', {string: 'Parent Task', index: true});
    static childIds = Fields.One2many('project.task', 'parentId', {string: "Sub-tasks"});
    static childText = Fields.Char({compute: "_computeChildText"});
    static allowSubtasks = Fields.Boolean({string: "Allow Sub-tasks", related: "projectId.allowSubtasks", readonly: true});
    static subtaskCount = Fields.Integer("Sub-task Count", {compute: '_computeSubtaskCount'});
    static emailFrom = Fields.Char({string: 'Email From', help: "These people will receive email.", index: true,
        compute: '_computeEmailFrom', recursive: true, store: true, readonly: false, copy: false});
    static projectPrivacyVisibility = Fields.Selection({related: 'projectId.privacyVisibility', string: "Project Visibility"});
    // Computed field about working time elapsed between record creation and assignation/closing.
    static workingHoursOpen = Fields.Float({compute: '_computeElapsed', string: 'Working Hours to Assign', digits: [16, 2], store: true, groupOperator: "avg"});
    static workingHoursClose = Fields.Float({compute: '_computeElapsed', string: 'Working Hours to Close', digits: [16, 2], store: true, groupOperator: "avg"});
    static workingDaysOpen = Fields.Float({compute: '_computeElapsed', string: 'Working Days to Assign', store: true, groupOperator: "avg"});
    static workingDaysClose = Fields.Float({compute: '_computeElapsed', string: 'Working Days to Close', store: true, groupOperator: "avg"});
    // customer portal: include comment and incoming emails in communication history
    static websiteMessageIds = Fields.One2many({domain: self => [['model', '=', self._name], ['messageType', 'in', ['email', 'comment']]]});
    static isPrivate = Fields.Boolean({compute: '_computeIsPrivate'});

    // Task Dependencies fields
    static allowTaskDependencies = Fields.Boolean({related: 'projectId.allowTaskDependencies'});
    // Tracking of this field is done in the write function
    static dependOnIds = Fields.Many2many('project.task', {relation: "taskDependenciesRel", column1: "taskId",
                                     column2: "dependsOnId", string: "Blocked By", tracking: true, copy: false,
                                     domain: "[['allowTaskDependencies', '=', true], ['id', '!=', id]]"});
    static dependentIds = Fields.Many2many('project.task', {relation: "taskDependenciesRel", column1: "dependsOnId",
                                     column2: "taskId", string: "Block", copy: false,
                                     domain: "[['allowTaskDependencies', '=', true], ['id', '!=', id]]"});
    static dependentTasksCount = Fields.Integer({string: "Dependent Tasks", compute: '_computeDependentTasksCount'});

    // recurrence fields
    static allowRecurringTasks = Fields.Boolean({related: 'projectId.allowRecurringTasks'});
    static recurringTask = Fields.Boolean({string: "Recurrent"});
    static recurringCount = Fields.Integer({string: "Tasks in Recurrence", compute: '_computeRecurringCount'});
    static recurrenceId = Fields.Many2one('project.task.recurrence', {copy: false});
    static recurrenceUpdate = Fields.Selection([
        ['this', 'This task'],
        ['subsequent', 'This and following tasks'],
        ['all', 'All tasks'],
    ], {default: 'this', store: false});
    static recurrenceMessage = Fields.Char({string: 'Next Recurrencies', compute: '_computeRecurrenceMessage'});

    static repeatInterval = Fields.Integer({string: 'Repeat Every', default: 1, compute: '_computeRepeat', readonly: false});
    static repeatUnit = Fields.Selection([
        ['day', 'Days'],
        ['week', 'Weeks'],
        ['month', 'Months'],
        ['year', 'Years'],
    ], {default: 'week', compute: '_computeRepeat', readonly: false});
    static repeatType = Fields.Selection([
        ['forever', 'Forever'],
        ['until', 'End Date'],
        ['after', 'Number of Repetitions'],
    ], {default: "forever", string: "Until", compute: '_computeRepeat', readonly: false});
    static repeatUntil = Fields.Date({string: "End Date", compute: '_computeRepeat', readonly: false});
    static repeatNumber = Fields.Integer({string: "Repetitions", default: 1, compute: '_computeRepeat', readonly: false});

    static repeatOnMonth = Fields.Selection([
        ['date', 'Date of the Month'],
        ['day', 'Day of the Month'],
    ], {default: 'date', compute: '_computeRepeat', readonly: false});

    static repeatOnYear = Fields.Selection([
        ['date', 'Date of the Year'],
        ['day', 'Day of the Year'],
    ], {default: 'date', compute: '_computeRepeat', readonly: false});

    static mon = Fields.Boolean({string: "Mon", compute: '_computeRepeat', readonly: false});
    static tue = Fields.Boolean({string: "Tue", compute: '_computeRepeat', readonly: false});
    static wed = Fields.Boolean({string: "Wed", compute: '_computeRepeat', readonly: false});
    static thu = Fields.Boolean({string: "Thu", compute: '_computeRepeat', readonly: false});
    static fri = Fields.Boolean({string: "Fri", compute: '_computeRepeat', readonly: false});
    static sat = Fields.Boolean({string: "Sat", compute: '_computeRepeat', readonly: false});
    static sun = Fields.Boolean({string: "Sun", compute: '_computeRepeat', readonly: false});

    static repeatDay = Fields.Selection(
        Array.from(range(1, 32)).map(i => [String(i), String(i)]), {compute: '_computeRepeat', readonly: false});
    static repeatWeek = Fields.Selection([
        ['first', 'First'],
        ['second', 'Second'],
        ['third', 'Third'],
        ['last', 'Last'],
    ], {default: 'first', compute: '_computeRepeat', readonly: false});
    static repeatWeekday = Fields.Selection([
        ['mon', 'Monday'],
        ['tue', 'Tuesday'],
        ['wed', 'Wednesday'],
        ['thu', 'Thursday'],
        ['fri', 'Friday'],
        ['sat', 'Saturday'],
        ['sun', 'Sunday'],
    ], {string: 'Day Of The Week', compute: '_computeRepeat', readonly: false});
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
    ], {compute: '_computeRepeat', readonly: false});

    static repeatShowDow = Fields.Boolean({compute: '_computeRepeatVisibility'});
    static repeatShowDay = Fields.Boolean({compute: '_computeRepeatVisibility'});
    static repeatShowWeek = Fields.Boolean({compute: '_computeRepeatVisibility'});
    static repeatShowMonth = Fields.Boolean({compute: '_computeRepeatVisibility'});

    // Account analytic
    static analyticAccountId = Fields.Many2one('account.analytic.account', {ondelete: 'SET NULL',
        domain: "['|', ['companyId', '=', false], ['companyId', '=', companyId]]", checkCompany: true,
        help: ["Analytic account to which this task is linked for financial management. ",
             "Use an analytic account to record cost and revenue on your task. ",
             "If empty, the analytic account of the project will be used."].join()});
    static projectAnalyticAccountId = Fields.Many2one('account.analytic.account', {string: 'Project Analytic Account', related: 'projectId.analyticAccountId'});
    static analyticTagIds = Fields.Many2many('account.analytic.tag',
        {domain: "['|', ['companyId', '=', false], ['companyId', '=', companyId]]", checkCompany: true});

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
            {'sequence': 1, 'label': this._t('Inbox'), 'userId': userId, 'fold': false},
            {'sequence': 2, 'label': this._t('Today'), 'userId': userId, 'fold': false},
            {'sequence': 3, 'label': this._t('This Week'), 'userId': userId, 'fold': false},
            {'sequence': 4, 'label': this._t('This Month'), 'userId': userId, 'fold': false},
            {'sequence': 5, 'label': this._t('Later'), 'userId': userId, 'fold': false},
            {'sequence': 6, 'label': this._t('Done'), 'userId': userId, 'fold': true},
            {'sequence': 7, 'label': this._t('Canceled'), 'userId': userId, 'fold': true},
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
                let stage = await (await this.env.items('project.task.type').sudo()).search([['userId', '=', userId.id]], {limit: 1});
                // In the case no stages have been found, we create the default stages for the user
                if (!bool(stage)) {
                    const lang = await (await userId.partnerId).lang;
                    const stages = await (await (await this.env.items('project.task.type').sudo()).withContext({lang, default_projectIds: false})).create(
                        await (await this.withContext({lang}))._getDefaultPersonalStageCreateVals(userId.id)
                    );
                    stage = stages[0];
                }
                await (await personalStageByUser.get(userId).sudo()).write({'stageId': stage.id});
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
                    await task.set(f, await task.recurringTask ? defaults[f]: false);
                }
            }
        }
    }

    async _getWeekdays(n=1) {
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
                addDate(date, {days: delta}),
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
                {count: numberOccurrences});
            const dateFormat = await (await this.env.items('res.lang')._langGet(await (await this.env.user()).lang)).dateFormat || await (await getLang(this.env)).dateFormat;
            if (recurrenceLeft == 0) {
                recurrenceTitle = await this._t('There are no more occurrences.');
            }
            else {
                recurrenceTitle = await this._t('Next Occurrences:');
            }
            let recurrenceMessage = f('<p><span class="fa fa-check-circle"></span> %s</p><ul>', recurrenceTitle);
            recurrenceMessage += recurringDates.slice(0,5).map(date => f('<li>%s</li>', toFormat(date, dateFormat))).join('');
            if (await task.repeatType == 'after' && recurrenceLeft > 5 || await task.repeatType == 'forever' || recurringDates.length > 5) {
                recurrenceMessage += '<li>...</li>';
            }
            recurrenceMessage += '</ul>';
            if (await task.repeatType == 'until') {
                recurrenceMessage += _f2(await this._t('<p><em>Number of tasks: %(tasksCount)s</em></p>'), {'tasksCount': recurringDates.length});
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
            const dtCreatedAt = _Datetime.fromString(await task.createdAt);

            if (await task.dateAssign) {
                const dtDateAssign = _Datetime.fromString(await task.dateAssign);
                const durationData = await (await (await task.projectId).resourceCalendarId).getWorkDurationData(dtCreatedAt, dtDateAssign, {computeLeaves: true});
                await task.set('workingHoursOpen', durationData['hours']);
                await task.set('workingDaysOpen', durationData['days']);
            }
            else {
                await task.set('workingHoursOpen', 0.0);
                await task.set('workingDaysOpen', 0.0);
            }

            if (await task.dateEnd) {
                const dtDateEnd = _Datetime.fromString(await task.dateEnd);
                const durationData = await (await (await task.projectId).resourceCalendarId).getWorkDurationData(dtCreatedAt, dtDateEnd, {computeLeaves: true});
                await task.set('workingHoursClose', durationData['hours']);
                await task.set('workingDaysClose', durationData['days']);
            }
            else {
                await task.set('workingHoursClose', 0.0);
                await task.set('workingDaysClose', 0.0);
            }
        }

        await this.sub(taskLinkedToCalendar).update(Dict.fromkeys(
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
            await task.set('subtaskPlannedHours', sum(await (await task.childIds).map(childTask => await childTask.plannedHours + await childTask.subtaskPlannedHours)));
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
                childText = _f2(await this._t("(+ %(childCount)s tasks)"), {childCount: await task.subtaskCount});
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
        for (const task of await this.withContext({prefetchFields: false})) {
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
            const label = (await this.env.items('project.project').browse(projectId)).labelTasks;
            if (label) tname = label.toLowerCase();
        }
        const self = await this.withContext({
            emptyListHelpId: this.env.context['default_projectId'],
            emptyListHelpModel: 'project.project',
            emptyListHelpDocumentName: tname,
        });
        return _super(Task, self).getEmptyListHelp(help);
    }

    async _validFieldParameter(field, name) {
        // If the field has `taskDependencyTracking` on we track the changes made in the dependent task on the parent task
        return name == 'taskDependencyTracking' || await _super(Task, this)._validFieldParameter(field, name);
    }

    /**
     * Returns the set of tracked field names for the current model.
        Those fields are the ones tracked in the parent task when using task dependencies.

        See method `mail.models.MailThread._getTrackedFields`
     * @returns 
     */
    @tools.ormcache('self.env.uid', 'self.env.su')
    async _getDependsTrackedFields() {
        const fields = this._fields.entries().filter(([,field]) => getattr(field, 'taskDependencyTracking', null)).map(([name,]) => name);
        return fields.length && Object.keys(await this.fieldsGet(fields));
    }

    # ----------------------------------------
    # Case management
    # ----------------------------------------

    def stage_find(self, section_id, domain: [], order='sequence, id'):
        """ Override of the base.stage method
            Parameter of the stage search taken from the lead:
            - section_id: if set, stages must belong to this section or
              be a default stage; if not set, stages must be default
              stages
        """
        # collect all section_ids
        section_ids = []
        if section_id:
            section_ids.push(section_id)
        section_ids.extend(self.mapped('projectId').ids)
        search_domain = []
        if section_ids:
            search_domain = [('|')] * (len(section_ids) - 1)
            for section_id in section_ids:
                search_domain.push(('project_ids', '=', section_id))
        search_domain += list(domain)
        # perform search, return the first found
        return this.env.items('project.task.type'].search(search_domain, order=order, limit=1).id

    # ------------------------------------------------
    # CRUD overrides
    # ------------------------------------------------
    @api.model
    def fields_get(self, allfields=None, attributes=None):
        fields = super().fields_get(allfields=allfields, attributes=attributes)
        if not self.env.user.has_group('base.group_portal'):
            return fields
        readable_fields = self.SELF_READABLE_FIELDS
        public_fields = {field_name: description for field_name, description in Fields.items() if field_name in readable_fields}

        writable_fields = self.SELF_WRITABLE_FIELDS
        for field_name, description in public_fields.items():
            if field_name not in writable_fields and not description.get('readonly', false):
                # If the field is not in Writable fields and it is not readonly then we force the readonly to true
                description['readonly'] = true

        return public_fields

    @api.model
    def default_get(self, default_fields):
        vals = super(Task, self).default_get(default_fields)

        days = list(DAYS.keys())
        week_start = Fields.Datetime.today().weekday()

        if all(d in default_fields for d in days):
            vals[days[week_start]] = true
        if 'repeat_day' in default_fields:
            vals['repeat_day'] = str(Fields.Datetime.today().day)
        if 'repeat_month' in default_fields:
            vals['repeat_month'] = self._fields.get('repeat_month').selection[Fields.Datetime.today().month - 1][0]
        if 'repeat_until' in default_fields:
            vals['repeat_until'] = Fields.Date.today() + timedelta(days=7)
        if 'repeat_weekday' in default_fields:
            vals['repeat_weekday'] = self._fields.get('repeat_weekday').selection[week_start][0]

        if 'partnerId' in vals and not vals['partnerId']:
            # if the default_partner_id: false or no default_partner_id then we search the partner based on the project and parent
            projectId = vals.get('projectId')
            parentId = vals.get('parentId', self.env.context.get('default_parent_id'))
            if projectId or parentId:
                partnerId = self._get_default_partner_id(
                    projectId and this.env.items('project.project'].browse(projectId),
                    parentId and this.env.items('project.task'].browse(parentId)
                )
                if partnerId:
                    vals['partnerId'] = partnerId

        return vals

    def _ensure_fields_are_accessible(self, fields, operation='read', check_group_user: true):
        """" ensure all fields are accessible by the current user

            This method checks if the portal user can access to all fields given in parameter.
            By default, it checks if the current user is a portal user and then checks if all fields are accessible for this user.

            :param fields: list of fields to check if the current user can access.
            :param operation: contains either 'read' to check readable fields or 'write' to check writable Fields.
            :param check_group_user: contains boolean value.
                - true, if the method has to check if the current user is a portal one.
                - false if we are sure the user is a portal user,
        """
        assert operation in ('read', 'write'), 'Invalid operation'
        if fields and (not check_group_user or self.env.user.has_group('base.group_portal')) and not self.env.su:
            unauthorized_fields = set(fields) - (self.SELF_READABLE_FIELDS if operation == 'read' else self.SELF_WRITABLE_FIELDS)
            if unauthorized_fields:
                if operation == 'read':
                    error_message = _('You cannot read %s fields in task.', ', '.join(unauthorized_fields))
                else:
                    error_message = _('You cannot write on %s fields in task.', ', '.join(unauthorized_fields))
                raise AccessError(error_message)

    def read(self, fields=None, load='_classic_read'):
        self._ensure_fields_are_accessible(fields)
        return super(Task, self).read(fields=fields, load=load)

    @api.model
    def read_group(self, domain, fields, groupby, offset=0, limit=None, orderby: false, lazy: true):
        fields_list = ([f.split(':')[0] for f in fields] or [])
        if groupby:
            fields_groupby = [groupby] if isinstance(groupby, str) else groupby
            # only take field name when having ':' e.g 'date_deadline:week' => 'date_deadline'
            fields_list += [f.split(':')[0] for f in fields_groupby]
        if domain:
            fields_list += [term[0].split('.')[0] for term in domain if isinstance(term, (tuple, list)) and term not in [TRUE_LEAF, FALSE_LEAF]]
        self._ensure_fields_are_accessible(fields_list)
        return super(Task, self).read_group(domain, fields, groupby, offset=offset, limit=limit, orderby=orderby, lazy=lazy)

    @api.model
    def _search(self, args, offset=0, limit=None, order=None, count: false, access_rights_uid=None):
        fields_list = {term[0] for term in args if isinstance(term, (tuple, list)) and term not in [TRUE_LEAF, FALSE_LEAF]}
        self._ensure_fields_are_accessible(fields_list)
        return super(Task, self)._search(args, offset=offset, limit=limit, order=order, count=count, access_rights_uid=access_rights_uid)

    def mapped(self, func):
        # Note: This will protect the filtered method too
        if func and isinstance(func, str):
            fields_list = func.split('.')
            self._ensure_fields_are_accessible(fields_list)
        return super(Task, self).mapped(func)

    def filtered_domain(self, domain):
        fields_list = [term[0] for term in domain if isinstance(term, (tuple, list)) and term not in [TRUE_LEAF, FALSE_LEAF]]
        self._ensure_fields_are_accessible(fields_list)
        return super(Task, self).filtered_domain(domain)

    def copy_data(self, default=None):
        defaults = super().copy_data(default=default)
        if self.env.user.has_group('project.group_project_user'):
            return defaults
        return [{k: v for k, v in default.items() if k in self.SELF_READABLE_FIELDS} for default in defaults]

    @api.model
    def _ensure_portal_user_can_write(self, fields):
        for field in fields:
            if field not in self.SELF_WRITABLE_FIELDS:
                raise AccessError(_('You have not write access of %s field.') % field)

    def _load_records_create(self, vals_list):
        projects_with_recurrence = this.env.items('project.project'].search([('allow_recurring_tasks', '=', true)])
        for vals in vals_list:
            if vals.get('recurring_task'):
                if vals.get('projectId') in projects_with_recurrence.ids and not vals.get('recurrenceId'):
                    default_val = self.default_get(self._get_recurrence_fields())
                    vals.update(**default_val)
                else:
                    for field_name in self._get_recurrence_fields() + ['recurring_task']:
                        vals.pop(field_name, None)
        tasks = super()._load_records_create(vals_list)
        stage_ids_per_project = defaultdict(list)
        for task in tasks:
            if task.stageId and task.stageId not in task.projectId.type_ids and task.stageId.id not in stage_ids_per_project[task.projectId]:
                stage_ids_per_project[task.projectId].push(task.stageId.id)

        for project, stage_ids in stage_ids_per_project.items():
            project.write({'type_ids': [Command.link(stageId) for stageId in stage_ids]})

        return tasks

    @api.model_create_multi
    def create(self, vals_list):
        is_portal_user = self.env.user.has_group('base.group_portal')
        if is_portal_user:
            self.check_access_rights('create')
        default_stage = dict()
        for vals in vals_list:
            if is_portal_user:
                self._ensure_fields_are_accessible(vals.keys(), operation='write', check_group_user: false)

            projectId = vals.get('projectId') or self.env.context.get('default_project_id')
            if not vals.get('parentId'):
                # 1) We must initialize display_project_id to follow projectId if there is no parentId
                vals['display_project_id'] = projectId
            if projectId and not "companyId" in vals:
                vals["companyId"] = this.env.items("project.project"].browse(
                    projectId
                ).companyId.id or self.env.company.id
            if projectId and "stageId" not in vals:
                # 1) Allows keeping the batch creation of tasks
                # 2) Ensure the defaults are correct (and computed once by project),
                # by using default get (instead of _get_default_stage_id or _stage_find),
                if projectId not in default_stage:
                    default_stage[projectId] = self.withContext(
                        default_project_id=projectId
                    ).default_get(['stageId']).get('stageId')
                vals["stageId"] = default_stage[projectId]
            # user_ids change: update date_assign
            if vals.get('user_ids'):
                vals['date_assign'] = Fields.Datetime.now()
            # Stage change: Update dateEnd if folded stage and date_last_stage_update
            if vals.get('stageId'):
                vals.update(self.update_date_end(vals['stageId']))
                vals['date_last_stage_update'] = Fields.Datetime.now()
            # recurrence
            rec_fields = vals.keys() & self._get_recurrence_fields()
            if rec_fields and vals.get('recurring_task') is true:
                rec_values = {rec_field: vals[rec_field] for rec_field in rec_fields}
                rec_values['next_recurrence_date'] = Fields.Datetime.today()
                recurrence = this.env.items('project.task.recurrence'].create(rec_values)
                vals['recurrenceId'] = recurrence.id
        # The sudo is required for a portal user as the record creation
        # requires the read access on other models, as mail.template
        # in order to compute the field tracking
        was_in_sudo = self.env.su
        if is_portal_user:
            ctx = {
                key: value for key, value in self.env.context.items()
                if key == 'default_project_id' \
                    or not key.startswith('default_') \
                    or key[8:] in self.SELF_WRITABLE_FIELDS
            }
            self = self.withContext(ctx).sudo()
        tasks = super(Task, self).create(vals_list)
        tasks._populate_missing_personal_stages()
        self._task_message_auto_subscribe_notify({task: task.user_ids - self.env.user for task in tasks})

        # in case we were already in sudo, we don't check the rights.
        if is_portal_user and not was_in_sudo:
            # since we use sudo to create tasks, we need to check
            # if the portal user could really create the tasks based on the ir rule.
            tasks.with_user(self.env.user).check_access_rule('create')
        for task in tasks:
            if task.projectId.privacyVisibility == 'portal':
                task._portal_ensure_token()
        return tasks

    def write(self, vals):
        if len(self) == 1:
            handle_history_divergence(self, 'description', vals)
        portal_can_write = false
        if self.env.user.has_group('base.group_portal') and not self.env.su:
            # Check if all fields in vals are in SELF_WRITABLE_FIELDS
            self._ensure_fields_are_accessible(vals.keys(), operation='write', check_group_user: false)
            self.check_access_rights('write')
            self.check_access_rule('write')
            portal_can_write = true

        now = Fields.Datetime.now()
        if 'parentId' in vals and vals['parentId'] in self.ids:
            raise UserError(_("Sorry. You can't set a task as its parent task."))
        if 'active' in vals and not vals.get('active') and any(self.mapped('recurrenceId')):
            # TODO: show a dialog to stop the recurrence
            raise UserError(_('You cannot archive recurring tasks. Please disable the recurrence first.'))
        if 'recurrenceId' in vals and vals.get('recurrenceId') and any(not task.active for task in self):
            raise UserError(_('Archived tasks cannot be recurring. Please unarchive the task first.'))
        # stage change: update date_last_stage_update
        if 'stageId' in vals:
            vals.update(self.update_date_end(vals['stageId']))
            vals['date_last_stage_update'] = now
            # reset kanban state when changing stage
            if 'kanban_state' not in vals:
                vals['kanban_state'] = 'normal'
        # user_ids change: update date_assign
        if vals.get('user_ids') and 'date_assign' not in vals:
            vals['date_assign'] = now

        # recurrence fields
        rec_fields = vals.keys() & self._get_recurrence_fields()
        if rec_fields:
            rec_values = {rec_field: vals[rec_field] for rec_field in rec_fields}
            for task of this) {
                if task.recurrenceId:
                    task.recurrenceId.write(rec_values)
                elif vals.get('recurring_task'):
                    rec_values['next_recurrence_date'] = Fields.Datetime.today()
                    recurrence = this.env.items('project.task.recurrence'].create(rec_values)
                    task.recurrenceId = recurrence.id

        if not vals.get('recurring_task', true) and self.recurrenceId:
            tasks_in_recurrence = self.recurrenceId.task_ids
            self.recurrenceId.unlink()
            tasks_in_recurrence.write({'recurring_task': false})

        tasks = self
        recurrence_update = vals.pop('recurrence_update', 'this')
        if recurrence_update != 'this':
            recurrence_domain = []
            if recurrence_update == 'subsequent':
                for task of this) {
                    recurrence_domain = OR([recurrence_domain, ['&', ('recurrenceId', '=', task.recurrenceId.id), ('create_date', '>=', task.create_date)]])
            else:
                recurrence_domain = [('recurrenceId', 'in', self.recurrenceId.ids)]
            tasks |= this.env.items('project.task'].search(recurrence_domain)

        # The sudo is required for a portal user as the record update
        # requires the write access on others models, as rating.rating
        # in order to keep the same name than the task.
        if portal_can_write:
            tasks = tasks.sudo()

        # Track user_ids to send assignment notifications
        old_user_ids = {t: t.user_ids for t in self}

        result = super(Task, tasks).write(vals)

        self._task_message_auto_subscribe_notify({task: task.user_ids - old_user_ids[task] - self.env.user for task in self})

        if 'user_ids' in vals:
            tasks._populate_missing_personal_stages()

        # rating on stage
        if 'stageId' in vals and vals.get('stageId'):
            tasks.filtered(lambda x: x.projectId.rating_active and x.projectId.rating_status == 'stage')._send_task_rating_mail(force_send: true)
        for task of this) {
            if task.display_project_id != task.projectId and not task.parentId:
                # We must make the display_project_id follow the projectId if no parentId set
                task.display_project_id = task.projectId
        return result

    def update_date_end(self, stageId):
        project_task_type = this.env.items('project.task.type'].browse(stageId)
        if project_task_type.fold or project_task_type.is_closed:
            return {'dateEnd': Fields.Datetime.now()}
        return {'dateEnd': false}

    @api.ondelete(at_uninstall: false)
    def _unlink_except_recurring(self):
        if any(self.mapped('recurrenceId')):
            # TODO: show a dialog to stop the recurrence
            raise UserError(_('You cannot delete recurring tasks. Please disable the recurrence first.'))

    # ---------------------------------------------------
    # Subtasks
    # ---------------------------------------------------

    @api.depends('parentId', 'projectId', 'display_project_id')
    def _compute_partner_id(self):
        """ Compute the partnerId when the tasks have no partnerId.

            Use the project partnerId if any, or else the parent task partnerId.
        """
        for task in self.filtered(lambda task: not task.partnerId):
            # When the task has a parent task, the display_project_id can be false or the project choose by the user for this task.
            project = task.display_project_id if task.parentId and task.display_project_id else task.projectId
            task.partnerId = self._get_default_partner_id(project, task.parentId)

    @api.depends('partnerId.email', 'parentId.emailFrom')
    def _compute_email_from(self):
        for task of this) {
            task.emailFrom = task.partnerId.email or ((task.partnerId or task.parentId) and task.emailFrom) or task.parentId.emailFrom

    @api.depends('parentId.projectId', 'display_project_id')
    def _compute_project_id(self):
        for task of this) {
            if task.parentId:
                task.projectId = task.display_project_id or task.parentId.projectId

    # ---------------------------------------------------
    # Mail gateway
    # ---------------------------------------------------

    @api.model
    def _task_message_auto_subscribe_notify(self, users_per_task):
        # Utility method to send assignation notification upon writing/creation.
        template_id = this.env.items('ir.model.data']._xmlid_to_res_id('project.project_message_user_assigned', raise_if_not_found: false)
        if not template_id:
            return
        view = this.env.items('ir.ui.view'].browse(template_id)
        task_model_description = this.env.items('ir.model']._get(self._name).display_name
        for task, users in users_per_task.items():
            if not users:
                continue
            values = {
                'object': task,
                'model_description': task_model_description,
                'access_link': task._notify_get_action_link('view'),
            }
            for user in users:
                values.update(assignee_name=user.sudo().name)
                assignation_msg = view._render(values, engine='ir.qweb', minimal_qcontext: true)
                assignation_msg = this.env.items('mail.render.mixin']._replace_local_links(assignation_msg)
                task.message_notify(
                    subject=_('You have been assigned to %s', task.display_name),
                    body=assignation_msg,
                    partner_ids=user.partnerId.ids,
                    record_name=task.display_name,
                    email_layout_xmlid='mail.mail_notification_light',
                    model_description=task_model_description,
                )

    def _message_auto_subscribe_followers(self, updated_values, default_subtype_ids):
        if 'user_ids' not in updated_values:
            return []
        # Since the changes to user_ids becoming a m2m, the default implementation of this function
        #  could not work anymore, override the function to keep the functionality.
        new_followers = []
        # Normalize input to tuple of ids
        value = self._fields['user_ids'].convert_to_cache(updated_values.get('user_ids', []), this.env.items('project.task'], validate: false)
        users = this.env.items('res.users'].browse(value)
        for user in users:
            try:
                if user.partnerId:
                    # The you have been assigned notification is handled separately
                    new_followers.push((user.partnerId.id, default_subtype_ids, false))
            except:
                pass
        return new_followers

    def _mail_track(self, tracked_fields, initial_values):
        changes, tracking_value_ids  = super()._mail_track(tracked_fields, initial_values)
        # Many2many tracking
        if len(changes) > len(tracking_value_ids):
            for changed_field in changes:
                if tracked_fields[changed_field]['type'] in ['one2many', 'many2many']:
                    field = this.env.items('ir.model.fields']._get(self._name, changed_field)
                    vals = {
                        'field': field.id,
                        'field_desc': field.field_description,
                        'field_type': field.ttype,
                        'tracking_sequence': field.tracking,
                        'old_value_char': ', '.join(initial_values[changed_field].mapped('name')),
                        'new_value_char': ', '.join(self[changed_field].mapped('name')),
                    }
                    tracking_value_ids.push(Command.create(vals))
        # Track changes on depending tasks
        depends_tracked_fields = self._get_depends_tracked_fields()
        depends_changes = changes & depends_tracked_fields
        if depends_changes and self.allow_task_dependencies and self.user_has_groups('project.group_project_task_dependencies'):
            parent_ids = self.dependent_ids
            if parent_ids:
                fields_to_ids = this.env.items('ir.model.fields']._get_ids('project.task')
                field_ids = [fields_to_ids.get(name) for name in depends_changes]
                depends_tracking_value_ids = [
                    tracking_values for tracking_values in tracking_value_ids
                    if tracking_values[2]['field'] in field_ids
                ]
                subtype = this.env.items('ir.model.data']._xmlid_to_res_id('project.mt_task_dependency_change')
                # We want to include the original subtype message coming from the child task
                # for example when the stage changes the message in the chatter starts with 'Stage Changed'
                child_subtype = self._track_subtype(dict((col_name, initial_values[col_name]) for col_name in changes))
                child_subtype_info = child_subtype.description or child_subtype.name if child_subtype else false
                # NOTE: the subtype does not have a description on purpose, otherwise the description would be put
                #  at the end of the message instead of at the top, we use the name here
                body = this.env.items('ir.qweb']._render('project.task_track_depending_tasks', {
                    'child': self,
                    'child_subtype': child_subtype_info,
                })
                for p in parent_ids:
                    p.message_post(body=body, subtype_id=subtype, tracking_value_ids=depends_tracking_value_ids)
        return changes, tracking_value_ids

    def _track_template(self, changes):
        res = super(Task, self)._track_template(changes)
        test_task = self[0]
        if 'stageId' in changes and test_task.stageId.mail_template_id:
            res['stageId'] = (test_task.stageId.mail_template_id, {
                'auto_delete_message': true,
                'subtype_id': this.env.items('ir.model.data']._xmlid_to_res_id('mail.mt_note'),
                'email_layout_xmlid': 'mail.mail_notification_light'
            })
        return res

    def _creation_subtype(self):
        return self.env.ref('project.mt_task_new')

    def _track_subtype(self, init_values):
        self.ensure_one()
        if 'kanban_state_label' in init_values and self.kanban_state == 'blocked':
            return self.env.ref('project.mt_task_blocked')
        elif 'kanban_state_label' in init_values and self.kanban_state == 'done':
            return self.env.ref('project.mt_task_ready')
        elif 'stageId' in init_values:
            return self.env.ref('project.mt_task_stage')
        return super(Task, self)._track_subtype(init_values)

    def _mail_get_message_subtypes(self):
        res = super()._mail_get_message_subtypes()
        if len(self) == 1:
            dependency_subtype = self.env.ref('project.mt_task_dependency_change')
            if ((self.projectId and not self.projectId.allow_task_dependencies)\
                or (not self.projectId and not self.user_has_groups('project.group_project_task_dependencies')))\
                and dependency_subtype in res:
                res -= dependency_subtype
        return res

    def _notify_get_groups(self, msg_vals=None):
        """ Handle project users and managers recipients that can assign
        tasks and create new one directly from notification emails. Also give
        access button to portal users and portal customers. If they are notified
        they should probably have access to the document. """
        groups = super(Task, self)._notify_get_groups(msg_vals=msg_vals)
        local_msg_vals = dict(msg_vals or {})
        self.ensure_one()

        project_user_group_id = self.env.ref('project.group_project_user').id
        new_group = ('group_project_user', lambda pdata: pdata['type'] == 'user' and project_user_group_id in pdata['groups'], {})
        groups = [new_group] + groups

        if self.project_privacy_visibility == 'portal':
            groups.insert(0, (
                'allowed_portal_users',
                lambda pdata: pdata['type'] == 'portal',
                {}
            ))
        portal_privacy = self.projectId.privacyVisibility == 'portal'
        for group_name, group_method, group_data in groups:
            if group_name in ('customer', 'user') or group_name == 'portal_customer' and not portal_privacy:
                group_data['has_button_access'] = false
            elif group_name == 'portal_customer' and portal_privacy:
                group_data['has_button_access'] = true

        return groups

    def _notify_get_reply_to(self, default=None, records=None, company=None, doc_names=None):
        """ Override to set alias of tasks to their project if any. """
        aliases = self.sudo().mapped('projectId')._notify_get_reply_to(default=default, records=None, company=company, doc_names=None)
        res = {task.id: aliases.get(task.projectId.id) for task in self}
        leftover = self.filtered(lambda rec: not rec.projectId)
        if leftover:
            res.update(super(Task, leftover)._notify_get_reply_to(default=default, records=None, company=company, doc_names=doc_names))
        return res

    def email_split(self, msg):
        email_list = tools.email_split((msg.get('to') or '') + ',' + (msg.get('cc') or ''))
        # check left-part is not already an alias
        aliases = self.mapped('projectId.alias_name')
        return [x for x in email_list if x.split('@')[0] not in aliases]

    @api.model
    def message_new(self, msg, custom_values=None):
        """ Overrides mail_thread message_new that is called by the mailgateway
            through message_process.
            This override updates the document according to the email.
        """
        # remove default author when going through the mail gateway. Indeed we
        # do not want to explicitly set userId to false; however we do not
        # want the gateway user to be responsible if no other responsible is
        # found.
        create_context = dict(self.env.context or {})
        create_context['default_user_ids'] = false
        if custom_values is None:
            custom_values = {}
        defaults = {
            'name': msg.get('subject') or _("No Subject"),
            'emailFrom': msg.get('from'),
            'planned_hours': 0.0,
            'partnerId': msg.get('author_id')
        }
        defaults.update(custom_values)

        task = super(Task, self.withContext(create_context)).message_new(msg, custom_values=defaults)
        email_list = task.email_split(msg)
        partner_ids = [p.id for p in this.env.items('mail.thread']._mail_find_partner_from_emails(email_list, records=task, force_create: false) if p]
        task.message_subscribe(partner_ids)
        return task

    def message_update(self, msg, update_vals=None):
        """ Override to update the task according to the email. """
        email_list = self.email_split(msg)
        partner_ids = [p.id for p in this.env.items('mail.thread']._mail_find_partner_from_emails(email_list, records=self, force_create: false) if p]
        self.message_subscribe(partner_ids)
        return super(Task, self).message_update(msg, update_vals=update_vals)

    def _message_get_suggested_recipients(self):
        recipients = super(Task, self)._message_get_suggested_recipients()
        for task of this) {
            if task.partnerId:
                reason = _('Customer Email') if task.partnerId.email else _('Customer')
                task._message_add_suggested_recipient(recipients, partner=task.partnerId, reason=reason)
            elif task.emailFrom:
                task._message_add_suggested_recipient(recipients, email=task.emailFrom, reason=_('Customer Email'))
        return recipients

    def _notify_email_header_dict(self):
        headers = super(Task, self)._notify_email_header_dict()
        if self.projectId:
            current_objects = [h for h in headers.get('X-Verp-Objects', '').split(',') if h]
            current_objects.insert(0, 'project.project-%s, ' % self.projectId.id)
            headers['X-Verp-Objects'] = ','.join(current_objects)
        if self.tagIds:
            headers['X-Verp-Tags'] = ','.join(self.tagIds.mapped('name'))
        return headers

    def _message_post_after_hook(self, message, msg_vals):
        if message.attachment_ids and not self.displayed_image_id:
            image_attachments = message.attachment_ids.filtered(lambda a: a.mimetype == 'image')
            if image_attachments:
                self.displayed_image_id = image_attachments[0]

        if self.emailFrom and not self.partnerId:
            # we consider that posting a message with a specified recipient (not a follower, a specific one)
            # on a document without customer means that it was created through the chatter using
            # suggested recipients. This heuristic allows to avoid ugly hacks in JS.
            email_normalized = tools.email_normalize(self.emailFrom)
            new_partner = message.partner_ids.filtered(
                lambda partner: partner.email == self.emailFrom or (email_normalized and partner.email_normalized == email_normalized)
            )
            if new_partner:
                if new_partner[0].email_normalized:
                    email_domain = ('emailFrom', 'in', [new_partner[0].email, new_partner[0].email_normalized])
                else:
                    email_domain = ('emailFrom', '=', new_partner[0].email)
                self.search([
                    ('partnerId', '=', false), email_domain, ('stageId.fold', '=', false)
                ]).write({'partnerId': new_partner[0].id})
        return super(Task, self)._message_post_after_hook(message, msg_vals)

    def action_assign_to_me(self):
        self.write({'user_ids': [(4, self.env.user.id)]})

    def action_unassign_me(self):
        self.write({'user_ids': [Command.unlink(self.env.uid)]})

    # If depth == 1, return only direct children
    # If depth == 3, return children to third generation
    # If depth <= 0, return all children without depth limit
    def _get_all_subtasks(self, depth=0):
        children = self.mapped('childIds')
        if not children:
            return this.env.items('project.task']
        if depth == 1:
            return children
        return children + children._get_all_subtasks(depth - 1)

    def action_open_parent_task(self):
        return {
            'label': this._t('Parent Task'),
            'viewMode': 'form',
            'resModel': 'project.task',
            'res_id': self.parentId.id,
            'type': 'ir.actions.actwindow',
            'context': self._context
        }

    # ------------
    # Actions
    # ------------

    def action_open_task(self):
        return {
            'viewMode': 'form',
            'resModel': 'project.task',
            'res_id': self.id,
            'type': 'ir.actions.actwindow',
            'context': self._context
        }

    def action_dependent_tasks(self):
        self.ensure_one()
        action = {
            'resModel': 'project.task',
            'type': 'ir.actions.actwindow',
            'context': {**self._context, 'default_depend_on_ids': [Command.link(self.id)], 'show_project_update': false},
            'domain': [('dependOnIds', '=', self.id)],
        }
        if self.dependent_tasks_count == 1:
            action['viewMode'] = 'form'
            action['res_id'] = self.dependent_ids.id
            action['views'] = [(false, 'form')]
        else:
            action['name'] = _('Dependent Tasks')
            action['viewMode'] = 'tree,form,kanban,calendar,pivot,graph,activity'
        return action

    def action_recurring_tasks(self):
        return {
            'name': 'Tasks in Recurrence',
            'type': 'ir.actions.actwindow',
            'resModel': 'project.task',
            'viewMode': 'tree,form,kanban,calendar,pivot,graph,activity',
            'domain': [('recurrenceId', 'in', self.recurrenceId.ids)],
        }

    def action_stop_recurrence(self):
        tasks = this.env.items('project.task'].withContext(active_test: false).search([('recurrenceId', 'in', self.recurrenceId.ids)])
        tasks.write({'recurring_task': false})
        self.recurrenceId.unlink()

    def action_continue_recurrence(self):
        self.recurrenceId = false
        self.recurring_task = false

    # ---------------------------------------------------
    # Rating business
    # ---------------------------------------------------

    def _send_task_rating_mail(self, force_send: false):
        for task of this) {
            rating_template = task.stageId.rating_template_id
            if rating_template:
                task.rating_send_request(rating_template, lang=task.partnerId.lang, force_send=force_send)

    def rating_get_partner_id(self):
        res = super(Task, self).rating_get_partner_id()
        if not res and self.projectId.partnerId:
            return self.projectId.partnerId
        return res

    def rating_apply(self, rate, token=None, feedback=None, subtype_xmlid=None):
        return super(Task, self).rating_apply(rate, token=token, feedback=feedback, subtype_xmlid="project.mt_task_rating")

    def _rating_get_parent_field_name(self):
        return 'projectId'

    def rating_get_rated_partner_id(self):
        """ Overwrite since we have user_ids and not userId """
        tasks_with_one_user = self.filtered(lambda task: len(task.user_ids) == 1 and task.user_ids.partnerId)
        return tasks_with_one_user.user_ids.partnerId or this.env.items('res.partner']

    # ---------------------------------------------------
    # Privacy
    # ---------------------------------------------------
    def _change_project_privacy_visibility(self):
        for task in self.filtered(lambda t: t.project_privacy_visibility != 'portal'):
            portal_users = task.message_partner_ids.user_ids.filtered('share')
            task.message_unsubscribe(partner_ids=portal_users.partnerId.ids)

    # ---------------------------------------------------
    # Analytic accounting
    # ---------------------------------------------------
    def _get_task_analytic_account_id(self):
        self.ensure_one()
        return self.analytic_account_id or self.project_analytic_account_id
*/

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

    static label = Fields.Char('Label', {required: true});
    static color = Fields.Integer({string: 'Color', default: self => self._getDefaultColor()});

    static _sqlConstraints = [
        ['label_uniq', 'unique (label)', "Tag label already exists!"],
    ];
}