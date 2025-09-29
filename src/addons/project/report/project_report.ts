import { Fields } from "../../../core";
import { MetaModel, Model } from "../../../core/models";
import { dropViewIfExists } from "../../../core/tools";

@MetaModel.define()
class ReportProjectTaskUser extends Model {
    static _module = module;
    static _name = 'report.project.task.user';
    static _description = 'Tasks Analysis';
    static _order = 'label desc, projectId';
    static _auto = false;

    static label = Fields.Char({string: 'Task', readonly: true});
    static userIds = Fields.Many2many('res.users', {relation: 'projectTaskUserRel', column1: 'taskId', column2: 'userId', string: 'Assignees', readonly: true});
    static createdAt = Fields.Datetime("Create Date", {readonly: true});
    static dateAssign = Fields.Datetime({string: 'Assignment Date', readonly: true});
    static dateEnd = Fields.Datetime({string: 'Ending Date', readonly: true});
    static dateDeadline = Fields.Date({string: 'Deadline', readonly: true});
    static dateLastStageUpdate = Fields.Datetime({string: 'Last Stage Update', readonly: true});
    static projectId = Fields.Many2one('project.project', {string: 'Project', readonly: true});
    static workingDaysClose = Fields.Float({string: 'Working Days to Close',
        digits: [16,2], readonly: true, groupOperator: "avg",
        help: "Number of Working Days to close the task"});
    static workingDaysOpen = Fields.Float({string: 'Working Days to Assign',
        digits: [16,2], readonly: true, groupOperator: "avg",
        help: "Number of Working Days to open the task"});
    static delayEndingsDays = Fields.Float({string: 'Days to Deadline', digits: [16, 2], groupOperator: "avg", readonly: true});
    static nbr = Fields.Integer('# of Tasks', {readonly: true});  // TDE FIXME master: rename into nbrTasks
    static workingHoursOpen = Fields.Float({string: 'Working Hours to Assign', digits: [16, 2], readonly: true, groupOperator: "avg", help: "Number of Working Hours to open the task"});
    static workingHoursClose = Fields.Float({string: 'Working Hours to Close', digits: [16, 2], readonly: true, groupOperator: "avg", help: "Number of Working Hours to close the task"});
    static ratingLastValue = Fields.Float('Rating Value (/5)', {groupOperator: "avg", readonly: true, groups: "project.groupProjectRating"});
    static priority = Fields.Selection([
        ['0', 'Low'],
        ['1', 'Normal'],
        ['2', 'High']
        ], {readonly: true, string: "Priority"});
    static state = Fields.Selection([
            ['normal', 'In Progress'],
            ['blocked', 'Blocked'],
            ['done', 'Ready for Next Stage']
        ], {string: 'Kanban State', readonly: true});
    static companyId = Fields.Many2one('res.company', {string: 'Company', readonly: true});
    static partnerId = Fields.Many2one('res.partner', {string: 'Customer', readonly: true});
    static stageId = Fields.Many2one('project.task.type', {string: 'Stage', readonly: true});
    static taskId = Fields.Many2one('project.task', {string: 'Tasks', readonly: true});

    async _select() {
        const selectStr = `
             SELECT
                    (select 1 ) AS nbr,
                    t.id as id,
                    t.id as "taskId",
                    t."createdAt" as "createdAt",
                    t."dateAssign" as "dateAssign",
                    t."dateEnd" as "dateEnd",
                    t."dateLastStageUpdate" as "dateLastStageUpdate",
                    t."dateDeadline" as "dateDeadline",
                    t."projectId",
                    t.priority,
                    t.label as label,
                    t."companyId",
                    t."partnerId",
                    t."stageId" as "stageId",
                    t."kanbanState" as state,
                    NULLIF(t."ratingLastValue", 0) as "ratingLastValue",
                    t."workingDaysClose" as "workingDaysClose",
                    t."workingDaysOpen" as "workingDaysOpen",
                    t."workingHoursOpen" as "workingHoursOpen",
                    t."workingHoursClose" as "workingHoursClose",
                    (extract('epoch' from (t."dateDeadline"-(now() at time zone 'UTC'))))/(3600*24)  as "delayEndingsDays"
        `;
        return selectStr;
    }

    async _groupby() {
        const groupByStr = `
                GROUP BY
                    t.id,
                    t."createdAt",
                    t."updatedAt",
                    t."dateAssign",
                    t."dateEnd",
                    t."dateDeadline",
                    t."dateLastStageUpdate",
                    t."projectId",
                    t.priority,
                    t.label,
                    t."companyId",
                    t."partnerId",
                    t."stageId"
        `;
        return groupByStr;
    }

    async init() {
        await dropViewIfExists(this._cr, this.cls._table);
        await this._cr.execute(`
            CREATE view "%s" as
              %s
              FROM "projectTask" t
              LEFT JOIN "projectTaskUserRel" tu on t.id=tu."taskId"
                WHERE t.active = 'true'
                AND t."projectId" IS NOT NULL
                %s
        `, [this.cls._table, await this._select(), await this._groupby()]);
    }
}
