import { api, Fields } from "../../../core";
import { OrderedSet } from "../../../core/helper";
import { _super, MetaModel, Model } from "../../../core/models"
import { AND, OR } from "../../../core/osv/expression";
import { dropViewIfExists } from "../../../core/tools";

@MetaModel.define()
class ReportProjectTaskBurndownChart extends Model {
    static _module = module;
    static _name = 'project.task.burndown.chart.report';
    static _description = 'Burndown Chart';
    static _auto = false;
    static _order = 'date';

    static projectId = Fields.Many2one('project.project', {readonly: true});
    static displayProjectId = Fields.Many2one('project.project', {readonly: true});
    static stageId = Fields.Many2one('project.task.type', {readonly: true});
    static date = Fields.Datetime('Date', {readonly: true});
    static userIds = Fields.Many2many('res.users', {relation: 'projectTaskUserRel', column1: 'taskId', column2: 'userId', string: 'Assignees', readonly: true});
    static dateAssign = Fields.Datetime({string: 'Assignment Date', readonly: true});
    static dateDeadline = Fields.Date({string: 'Deadline', readonly: true});
    static partnerId = Fields.Many2one('res.partner', {string: 'Customer', readonly: true});
    static nbTasks = Fields.Integer('# of Tasks', {readonly: true, groupOperator: "sum"});
    static dateGroupby = Fields.Selection(
        [
            ['day', 'By Day'],
            ['month', 'By Month'],
            ['quarter', 'By quarter'],
            ['year', 'By Year']
        ], {string: "Date Group By", readonly: true});

    @api.model()
    async readGroup(domain, fields, groupby, opts: {offset?: any, limit?: any, orderby?: any, lazy?: boolean}={}) {
        const {offset=0, limit, orderby=false, lazy=true} = opts;
        const dateGroupbys = [];
        groupby = typeof groupby === 'string' ? [groupby] : [...new OrderedSet(groupby)];
        for (const gb of groupby) {
            if (gb.startsWith('date:')) {
                dateGroupbys.push(gb.split(':').slice(-1)[0]);
            }
        }
        let dateDomains = [];
        for (const gb of dateGroupbys) {
            dateDomains = OR([dateDomains, [['dateGroupby', '=', gb]]]);
        }
        domain = AND([domain, dateDomains]);

        const res = await _super(ReportProjectTaskBurndownChart, this).readGroup(domain, fields, groupby, {offset, limit, orderby, lazy});
        return res;
    }

    async init() {
        const query = `
WITH "allMovesStageTask" AS (
    -- Here we compute all previous stage in tracking values
    -- We're missing the last reached stage
    -- And the tasks without any stage change (which, by definition, are at the last stage)
    SELECT pt."projectId",
           pt.id as "taskId",
           pt."displayProjectId",
           COALESCE(LAG(mm.date) OVER (PARTITION BY mm."resId" ORDER BY mm.id), pt."createdAt") as "dateBegin",
           mm.date as "dateEnd",
           mtv."oldValueInteger" as "stageId",
           pt."dateAssign",
           pt."dateDeadline",
           pt."partnerId"
      FROM "projectTask" pt
      JOIN "mailMessage" mm ON mm."resId" = pt.id
                          AND mm."messageType" = 'notification'
                          AND mm.model = 'project.task'
      JOIN "mailTrackingValue" mtv ON mm.id = mtv."mailMessageId"
      JOIN "irModelFields" imf ON mtv.field = imf.id
                              AND imf.model = 'project.task'
                              AND imf.label = 'stageId'
      JOIN "projectTaskTypeRel" pttr ON pttr."typeId" = mtv."oldValueInteger"
                              AND pttr."projectId" = pt."projectId"
     WHERE pt.active

    --We compute the last reached stage
    UNION ALL

    SELECT pt."projectId",
           pt.id as "taskId",
           pt."displayProjectId",
           COALESCE(md.date, pt."createdAt") as "dateBegin",
           (CURRENT_DATE + interval '1 month')::date as "dateEnd",
           pt."stageId",
           pt."dateAssign",
           pt."dateDeadline",
           pt."partnerId"
      FROM "projectTask" pt
      LEFT JOIN LATERAL (SELECT mm.date
                      FROM "mailMessage" mm
                      JOIN "mailTrackingValue" mtv ON mm.id = mtv."mailMessageId"
                      JOIN "irModelFields" imf ON mtv.field = imf.id
                                              AND imf.model = 'project.task'
                                              AND imf.label = 'stageId'
                     WHERE mm."resId" = pt.id
                       AND mm."messageType" = 'notification'
                       AND mm.model = 'project.task'
                  ORDER BY mm.id DESC
                     FETCH FIRST ROW ONLY) md ON TRUE
     WHERE pt.active
)
SELECT ("taskId"*10^7 + 10^6 + to_char(d, 'YYMMDD')::integer)::bigint as id,
       "projectId",
       "taskId",
       "displayProjectId",
       "stageId",
       d as date,
       "dateAssign",
       "dateDeadline",
       "partnerId",
       'day' AS dateGroupby,
       1 AS "nbTasks"
  FROM "allMovesStageTask" t
  JOIN LATERAL generate_series(t."dateBegin", t."dateEnd"-interval '1 day', '1 day') d ON TRUE

UNION ALL

SELECT ("taskId"*10^7 + 2*10^6 + to_char(d, 'YYMMDD')::integer)::bigint as id,
       "projectId",
       "taskId",
       "displayProjectId",
       "stageId",
       date_trunc('week', d) as date,
       "dateAssign",
       "dateDeadline",
       "partnerId",
       'week' AS "dateGroupby",
       1 AS "nbTasks"
  FROM "allMovesStageTask" t
  JOIN LATERAL generate_series(t."dateBegin", t."dateEnd", '1 week') d ON TRUE
 WHERE date_trunc('week', t."dateBegin") <= date_trunc('week', d)
   AND date_trunc('week', t."dateEnd") > date_trunc('week', d)

UNION ALL

SELECT ("taskId"*10^7 + 3*10^6 + to_char(d, 'YYMMDD')::integer)::bigint as id,
       "projectId",
       "taskId",
       "displayProjectId",
       "stageId",
       date_trunc('month', d) as date,
       "dateAssign",
       "dateDeadline",
       "partnerId",
       'month' AS "dateGroupby",
       1 AS "nbTasks"
  FROM "allMovesStageTask" t
  JOIN LATERAL generate_series(t."dateBegin", t."dateEnd", '1 month') d ON TRUE
 WHERE date_trunc('month', t."dateBegin") <= date_trunc('month', d)
   AND date_trunc('month', t."dateEnd") > date_trunc('month', d)

UNION ALL

SELECT ("taskId"*10^7 + 4*10^6 + to_char(d, 'YYMMDD')::integer)::bigint as id,
       "projectId",
       "taskId",
       "displayProjectId",
       "stageId",
       date_trunc('quarter', d) as date,
       "dateAssign",
       "dateDeadline",
       "partnerId",
       'quarter' AS "dateGroupby",
       1 AS "nbTasks"
  FROM "allMovesStageTask" t
  JOIN LATERAL generate_series(t."dateBegin", t."dateEnd", '3 month') d ON TRUE
 WHERE date_trunc('quarter', t."dateBegin") <= date_trunc('quarter', d)
   AND date_trunc('quarter', t."dateEnd") > date_trunc('quarter', d)

UNION ALL

SELECT ("taskId"*10^7 + 5*10^6 + to_char(d, 'YYMMDD')::integer)::bigint as id,
       "projectId",
       "taskId",
       "displayProjectId",
       "stageId",
       date_trunc('year', d) as date,
       "dateAssign",
       "dateDeadline",
       "partnerId",
       'year' AS "dateGroupby",
       1 AS "nbTasks"
  FROM "allMovesStageTask" t
  JOIN LATERAL generate_series(t."dateBegin", t."dateEnd", '1 year') d ON TRUE
 WHERE date_trunc('year', t."dateBegin") <= date_trunc('year', d)
   AND date_trunc('year', t."dateEnd") > date_trunc('year', d)
        `;

        await dropViewIfExists(this.env.cr, this.cls._table);
        await this.env.cr.execute(`CREATE or REPLACE VIEW "%s" as (%s)`, [this.cls._table, query]);
    }
}
