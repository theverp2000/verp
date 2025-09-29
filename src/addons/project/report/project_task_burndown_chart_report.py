# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from psycopg2 import sql

from verp import api, fields, models, tools
from verp.osv import expression
from verp.tools import OrderedSet


class ReportProjectTaskBurndownChart(models.Model):
    _name = 'project.task.burndown.chart.report'
    _description = 'Burndown Chart'
    _auto = False
    _order = 'date'

    projectId = fields.Many2one('project.project', readonly=True)
    display_project_id = fields.Many2one('project.project', readonly=True)
    stageId = fields.Many2one('project.task.type', readonly=True)
    date = fields.Datetime('Date', readonly=True)
    user_ids = fields.Many2many('res.users', relation='project_task_user_rel', column1='taskId', column2='userId',
                                string='Assignees', readonly=True)
    date_assign = fields.Datetime(string='Assignment Date', readonly=True)
    date_deadline = fields.Date(string='Deadline', readonly=True)
    partnerId = fields.Many2one('res.partner', string='Customer', readonly=True)
    nb_tasks = fields.Integer('# of Tasks', readonly=True, group_operator="sum")
    date_group_by = fields.Selection(
        [
            ('day', 'By Day'),
            ('month', 'By Month'),
            ('quarter', 'By quarter'),
            ('year', 'By Year')
        ], string="Date Group By", readonly=True)

    @api.model
    def read_group(self, domain, fields, groupby, offset=0, limit=None, orderby=False, lazy=True):
        date_group_bys = []
        groupby = [groupby] if isinstance(groupby, str) else list(OrderedSet(groupby))
        for gb in groupby:
            if gb.startswith('date:'):
                date_group_bys.append(gb.split(':')[-1])

        date_domains = []
        for gb in date_group_bys:
            date_domains = expression.OR([date_domains, [('date_group_by', '=', gb)]])
        domain = expression.AND([domain, date_domains])

        res = super().read_group(domain, fields, groupby, offset=offset, limit=limit, orderby=orderby, lazy=lazy)
        return res

    def init(self):
        query = """
WITH all_moves_stage_task AS (
    -- Here we compute all previous stage in tracking values
    -- We're missing the last reached stage
    -- And the tasks without any stage change (which, by definition, are at the last stage)
    SELECT pt.projectId,
           pt.id as taskId,
           pt.display_project_id,
           COALESCE(LAG(mm.date) OVER (PARTITION BY mm.res_id ORDER BY mm.id), pt.create_date) as dateBegin,
           mm.date as dateEnd,
           mtv.old_value_integer as stageId,
           pt.date_assign,
           pt.date_deadline,
           pt.partnerId
      FROM project_task pt
      JOIN mail_message mm ON mm.res_id = pt.id
                          AND mm.message_type = 'notification'
                          AND mm.model = 'project.task'
      JOIN mail_tracking_value mtv ON mm.id = mtv.mail_message_id
      JOIN ir_model_fields imf ON mtv.field = imf.id
                              AND imf.model = 'project.task'
                              AND imf.name = 'stageId'
      JOIN project_task_type_rel pttr ON pttr.type_id = mtv.old_value_integer
                              AND pttr.projectId = pt.projectId
     WHERE pt.active

    --We compute the last reached stage
    UNION ALL

    SELECT pt.projectId,
           pt.id as taskId,
           pt.display_project_id,
           COALESCE(md.date, pt.create_date) as dateBegin,
           (CURRENT_DATE + interval '1 month')::date as dateEnd,
           pt.stageId,
           pt.date_assign,
           pt.date_deadline,
           pt.partnerId
      FROM project_task pt
      LEFT JOIN LATERAL (SELECT mm.date
                      FROM mail_message mm
                      JOIN mail_tracking_value mtv ON mm.id = mtv.mail_message_id
                      JOIN ir_model_fields imf ON mtv.field = imf.id
                                              AND imf.model = 'project.task'
                                              AND imf.name = 'stageId'
                     WHERE mm.res_id = pt.id
                       AND mm.message_type = 'notification'
                       AND mm.model = 'project.task'
                  ORDER BY mm.id DESC
                     FETCH FIRST ROW ONLY) md ON TRUE
     WHERE pt.active
)
SELECT (taskId*10^7 + 10^6 + to_char(d, 'YYMMDD')::integer)::bigint as id,
       projectId,
       taskId,
       display_project_id,
       stageId,
       d as date,
       date_assign,
       date_deadline,
       partnerId,
       'day' AS date_group_by,
       1 AS nb_tasks
  FROM all_moves_stage_task t
  JOIN LATERAL generate_series(t.dateBegin, t.dateEnd-interval '1 day', '1 day') d ON TRUE

UNION ALL

SELECT (taskId*10^7 + 2*10^6 + to_char(d, 'YYMMDD')::integer)::bigint as id,
       projectId,
       taskId,
       display_project_id,
       stageId,
       date_trunc('week', d) as date,
       date_assign,
       date_deadline,
       partnerId,
       'week' AS date_group_by,
       1 AS nb_tasks
  FROM all_moves_stage_task t
  JOIN LATERAL generate_series(t.dateBegin, t.dateEnd, '1 week') d ON TRUE
 WHERE date_trunc('week', t.dateBegin) <= date_trunc('week', d)
   AND date_trunc('week', t.dateEnd) > date_trunc('week', d)

UNION ALL

SELECT (taskId*10^7 + 3*10^6 + to_char(d, 'YYMMDD')::integer)::bigint as id,
       projectId,
       taskId,
       display_project_id,
       stageId,
       date_trunc('month', d) as date,
       date_assign,
       date_deadline,
       partnerId,
       'month' AS date_group_by,
       1 AS nb_tasks
  FROM all_moves_stage_task t
  JOIN LATERAL generate_series(t.dateBegin, t.dateEnd, '1 month') d ON TRUE
 WHERE date_trunc('month', t.dateBegin) <= date_trunc('month', d)
   AND date_trunc('month', t.dateEnd) > date_trunc('month', d)

UNION ALL

SELECT (taskId*10^7 + 4*10^6 + to_char(d, 'YYMMDD')::integer)::bigint as id,
       projectId,
       taskId,
       display_project_id,
       stageId,
       date_trunc('quarter', d) as date,
       date_assign,
       date_deadline,
       partnerId,
       'quarter' AS date_group_by,
       1 AS nb_tasks
  FROM all_moves_stage_task t
  JOIN LATERAL generate_series(t.dateBegin, t.dateEnd, '3 month') d ON TRUE
 WHERE date_trunc('quarter', t.dateBegin) <= date_trunc('quarter', d)
   AND date_trunc('quarter', t.dateEnd) > date_trunc('quarter', d)

UNION ALL

SELECT (taskId*10^7 + 5*10^6 + to_char(d, 'YYMMDD')::integer)::bigint as id,
       projectId,
       taskId,
       display_project_id,
       stageId,
       date_trunc('year', d) as date,
       date_assign,
       date_deadline,
       partnerId,
       'year' AS date_group_by,
       1 AS nb_tasks
  FROM all_moves_stage_task t
  JOIN LATERAL generate_series(t.dateBegin, t.dateEnd, '1 year') d ON TRUE
 WHERE date_trunc('year', t.dateBegin) <= date_trunc('year', d)
   AND date_trunc('year', t.dateEnd) > date_trunc('year', d)
        """

        tools.drop_view_if_exists(self.env.cr, self._table)
        self.env.cr.execute(
            sql.SQL("CREATE or REPLACE VIEW {} as ({})").format(
                sql.Identifier(self._table),
                sql.SQL(query)
            )
        )
