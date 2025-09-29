import { api, Fields } from "../../../core";
import { _super, MetaModel, Model } from "../../../core/models"
import { expression } from "../../../core/osv";

// from collections import defaultdict
// from lxml import etree
// import re

// from verp import api, Command, fields, models, _
// from verp.exceptions import UserError, AccessError
// from verp.osv import expression

@MetaModel.define
class AccountAnalyticLine extends Model {
    static _module = module;
    static _parents = 'account.analytic.line';

    @api.model()
    async defaultGet(fieldList) {
        const result = await _super(AccountAnalyticLine, this).defaultGet(fieldList);
        const company = await this.env.company();
        if (fieldList.includes('encodingUomId')) {
            result['encodingUomId'] = (await company.timesheetEncodeUomId).id;
        }
        employeeId = this._context['default_employeeId'];
        if (employeeId) {
            const employee = this.env.items('hr.employee').browse(employeeId);
            if (!('userId' in result) || (await employee.userId).id != result['userId']) {
                result['userId'] = (await employee.userId).id;
            }
        }
        if (!this.env.context['default_employeeId'] && fieldList.includes('employeeId') && result['userId']) {
            result['employeeId'] = (await this.env.items('hr.employee').search([['userId', '=', result['userId']], ['companyId', '=', result.get('companyId', company.id)]], {limit: 1})).id;
        }
        return result;
    }

    async _domainProjectId() {
        const domain = [['allowTimesheets', '=', true]];
        if (!await this.userHasGroups('hr_timesheet.groupTimesheetManager')) {
            return expression.AND([domain,
                ['|', ['privacyVisibility', '!=', 'followers'], ['messagePartnerIds', 'in', [(await (this.env.user()).partnerId).id]]]
            ]);
        }
        return domain;
    }

    async _domainEmployeeId() {
        if (!await this.userHasGroups('hr_timesheet.groupHrTimesheetApprover')) {
            return [['userId', '=', (await this.env.user()).id]];
        }
        return [];
    }

    async _domainTaskId() {
        if (!await this.userHasGroups('hr_timesheet.groupHrTimesheetApprover')) {
            return ['|', ['privacyVisibility', '!=', 'followers'], ['messagePartnerIds', 'in', [(await (await this.env.user()).partnerId).id]]];
        }
        return [];
    }

    static taskId = Fields.Many2one(
        'project.task', {string: 'Task', compute: '_computeTaskId', store: true, readonly: false, index: true,
        domain: "[['projectId.allowTimesheets', '=', true], ['projectId', '=?', projectId]]"});
    static projectId = Fields.Many2one(
        'project.project', {string: 'Project', compute: '_computeProjectId', store: true, readonly: false,
        domain: self => self._domainProjectId()});
    static userId = Fields.Many2one({compute: '_computeUserId', store: true, readonly: false});
    static employeeId = Fields.Many2one('hr.employee', "Employee", domain: _domain_employee_id, context={'active_test': False})
    department_id = Fields.Many2one('hr.department', "Department", compute='_compute_department_id', store: true, compute_sudo: true)
    encoding_uom_id = Fields.Many2one('uom.uom', compute='_compute_encoding_uom_id')
    partnerId = Fields.Many2one(compute='_compute_partner_id', store: true, readonly: false)

    def name_get(self):
        result = super().name_get()
        timesheets_read = self.env[self._name].search_read([('projectId', '!=', False), ('id', 'in', self.ids)], ['id', 'projectId', 'taskId'])
        if not timesheets_read:
            return result
        def _get_display_name(projectId, taskId):
            """ Get the display name of the timesheet based on the project and task
                :param projectId: tuple containing the id and the display name of the project
                :param taskId: tuple containing the id and the display name of the task if a task exists in the timesheet
                              otherwise False.
                :returns: the display name of the timesheet
            """
            if taskId:
                return '%s - %s' % (projectId[1], taskId[1])
            return projectId[1]
        timesheet_dict = {res['id']: _get_display_name(res['projectId'], res['taskId']) for res in timesheets_read}
        return list({**dict(result), **timesheet_dict}.items())

    def _compute_encoding_uom_id(self):
        for analytic_line in self:
            analytic_line.encoding_uom_id = analytic_line.company_id.timesheet_encode_uom_id

    @api.depends('taskId.partnerId', 'projectId.partnerId')
    def _compute_partner_id(self):
        for timesheet in self:
            if timesheet.projectId:
                timesheet.partnerId = timesheet.taskId.partnerId or timesheet.projectId.partnerId

    @api.depends('taskId', 'taskId.projectId')
    def _compute_project_id(self):
        for line in self:
            if not line.taskId.projectId or line.projectId == line.taskId.projectId:
                continue
            line.projectId = line.taskId.projectId

    @api.depends('projectId')
    def _compute_task_id(self):
        for line in self.filtered(lambda line: not line.projectId):
            line.taskId = False

    @api.onchange('projectId')
    def _onchange_project_id(self):
        # TODO KBA in master - check to do it "properly", currently:
        # This onchange is used to reset the taskId when the project changes.
        # Doing it in the compute will remove the taskId when the project of a task changes.
        if self.projectId != self.taskId.projectId:
            self.taskId = False

    @api.depends('employee_id')
    def _compute_user_id(self):
        for line in self:
            line.userId = line.employee_id.userId if line.employee_id else line._default_user()

    @api.depends('employee_id')
    def _compute_department_id(self):
        for line in self:
            line.department_id = line.employee_id.department_id

    @api.model_create_multi
    def create(self, vals_list):
        default_user_id = self._default_user()
        user_ids = list(map(lambda x: x.get('userId', default_user_id), filter(lambda x: not x.get('employee_id') and x.get('projectId'), vals_list)))

        for vals in vals_list:
            # when the name is not provide by the 'Add a line', we set a default one
            if vals.get('projectId') and not vals.get('name'):
                vals['name'] = '/'
            vals.update(self._timesheet_preprocess(vals))

        # Although this make a second loop on the vals, we need to wait the preprocess as it could change the company_id in the vals
        # TODO To be refactored in master
        employees = self.env['hr.employee'].sudo().search([('userId', 'in', user_ids)])
        employee_for_user_company = defaultdict(dict)
        for employee in employees:
            employee_for_user_company[employee.userId.id][employee.company_id.id] = employee.id

        employee_ids = set()
        for vals in vals_list:
            # compute employee only for timesheet lines, makes no sense for other lines
            if not vals.get('employee_id') and vals.get('projectId'):
                employee_for_company = employee_for_user_company.get(vals.get('userId', default_user_id), False)
                if not employee_for_company:
                    continue
                company_id = list(employee_for_company)[0] if len(employee_for_company) == 1 else vals.get('company_id', self.env.company.id)
                vals['employee_id'] = employee_for_company.get(company_id, False)
            elif vals.get('employee_id'):
                employee_ids.add(vals['employee_id'])
        if any(not emp.active for emp in self.env['hr.employee'].browse(list(employee_ids))):
            raise UserError(_('Timesheets must be created with an active employee.'))
        lines = super(AccountAnalyticLine, self).create(vals_list)
        for line, values in zip(lines, vals_list):
            if line.projectId:  # applied only for timesheet
                line._timesheet_postprocess(values)
        return lines

    def write(self, values):
        # If it's a basic user then check if the timesheet is his own.
        if not (self.user_has_groups('hr_timesheet.group_hr_timesheet_approver') or self.env.su) and any(self.env.user.id != analytic_line.userId.id for analytic_line in self):
            raise AccessError(_("You cannot access timesheets that are not yours."))

        values = self._timesheet_preprocess(values)
        if values.get('employee_id'):
            employee = self.env['hr.employee'].browse(values['employee_id'])
            if not employee.active:
                raise UserError(_('You cannot set an archived employee to the existing timesheets.'))
        if 'name' in values and not values.get('name'):
            values['name'] = '/'
        result = super(AccountAnalyticLine, self).write(values)
        # applied only for timesheet
        self.filtered(lambda t: t.projectId)._timesheet_postprocess(values)
        return result

    @api.model
    def fields_view_get(self, view_id=None, view_type='form', toolbar: false, submenu: false):
        """ Set the correct label for `unit_amount`, depending on company UoM """
        result = super(AccountAnalyticLine, self).fields_view_get(view_id=view_id, view_type=view_type, toolbar=toolbar, submenu=submenu)
        # Use of sudo as the portal user doesn't have access to uom
        result['arch'] = self.sudo()._apply_timesheet_label(result['arch'], view_type=view_type)
        return result

    @api.model
    def _apply_timesheet_label(self, view_arch, view_type='form'):
        doc = etree.XML(view_arch)
        encoding_uom = self.env.company.timesheet_encode_uom_id
        # Here, we select only the unit_amount field having no string set to give priority to
        # custom inheretied view stored in database. Even if normally, no xpath can be done on
        # 'string' attribute.
        for node in doc.xpath("//field[@name='unit_amount'][@widget='timesheet_uom'][not(@string)]"):
            node.set('string', _('%s Spent') % (re.sub(r'[\(\)]', '', encoding_uom.name or '')))
        return etree.tostring(doc, encoding='unicode')

    @api.model
    def _apply_time_label(self, view_arch, related_model):
        doc = etree.XML(view_arch)
        Model = self.env[related_model]
        # Just fetch the name of the uom in `timesheet_encode_uom_id` of the current company
        encoding_uom_name = self.env.company.timesheet_encode_uom_id.with_context(prefetch_fields: false).sudo().name
        for node in doc.xpath("//field[@widget='timesheet_uom'][not(@string)] | //field[@widget='timesheet_uom_no_toggle'][not(@string)]"):
            name_with_uom = re.sub(_('Hours') + "|Hours", encoding_uom_name or '', Model._fields[node.get('name')]._description_string(self.env), flags=re.IGNORECASE)
            node.set('string', name_with_uom)

        return etree.tostring(doc, encoding='unicode')

    def _timesheet_get_portal_domain(self):
        if self.env.user.has_group('hr_timesheet.group_hr_timesheet_user'):
            # Then, he is internal user, and we take the domain for this current user
            return self.env['ir.rule']._compute_domain(self._name)
        return [
            '|',
                '&',
                    '|',
                        ('taskId.projectId.message_partner_ids', 'childOf', [self.env.user.partnerId.commercial_partner_id.id]),
                        ('taskId.message_partner_ids', 'childOf', [self.env.user.partnerId.commercial_partner_id.id]),
                    ('taskId.projectId.privacyVisibility', '=', 'portal'),
                '&',
                    ('taskId', '=', False),
                    '&',
                        ('projectId.message_partner_ids', 'childOf', [self.env.user.partnerId.commercial_partner_id.id]),
                        ('projectId.privacyVisibility', '=', 'portal')
        ]

    def _timesheet_preprocess(self, vals):
        """ Deduce other field values from the one given.
            Overrride this to compute on the fly some field that can not be computed Fields.
            :param values: dict values for `create`or `write`.
        """
        # task implies analytic account and tags
        if vals.get('taskId') and not vals.get('account_id'):
            task = self.env['project.task'].browse(vals.get('taskId'))
            task_analytic_account_id = task._get_task_analytic_account_id()
            vals['account_id'] = task_analytic_account_id.id
            vals['company_id'] = task_analytic_account_id.company_id.id or task.company_id.id
            if vals.get('tag_ids'):
                vals['tag_ids'] += [Command.link(tag_id.id) for tag_id in task.analytic_tag_ids]
            else:
                vals['tag_ids'] = [Command.set(task.analytic_tag_ids.ids)]
            if not task_analytic_account_id.active:
                raise UserError(_('You cannot add timesheets to a project or a task linked to an inactive analytic account.'))
        # project implies analytic account
        if vals.get('projectId') and not vals.get('account_id'):
            project = self.env['project.project'].browse(vals.get('projectId'))
            vals['account_id'] = project.analyticAccountId.id
            vals['company_id'] = project.analyticAccountId.company_id.id or project.company_id.id
            if not project.analyticAccountId.active:
                raise UserError(_('You cannot add timesheets to a project linked to an inactive analytic account.'))
        # employee implies user
        if vals.get('employee_id') and not vals.get('userId'):
            employee = self.env['hr.employee'].browse(vals['employee_id'])
            vals['userId'] = employee.userId.id
        # force customer partner, from the task or the project
        if (vals.get('projectId') or vals.get('taskId')) and not vals.get('partnerId'):
            partnerId = False
            if vals.get('taskId'):
                partnerId = self.env['project.task'].browse(vals['taskId']).partnerId.id
            else:
                partnerId = self.env['project.project'].browse(vals['projectId']).partnerId.id
            if partnerId:
                vals['partnerId'] = partnerId
        # set timesheet UoM from the AA company (AA implies uom)
        if not vals.get('product_uom_id') and all(v in vals for v in ['account_id', 'projectId']):  # projectId required to check this is timesheet flow
            analytic_account = self.env['account.analytic.account'].sudo().browse(vals['account_id'])
            uom_id = analytic_account.company_id.project_time_mode_id.id
            if not uom_id:
                company_id = vals.get('company_id', False)
                if not company_id:
                    project = self.env['project.project'].browse(vals.get('projectId'))
                    company_id = project.analyticAccountId.company_id.id or project.company_id.id
                uom_id = self.env['res.company'].browse(company_id).project_time_mode_id.id
            vals['product_uom_id'] = uom_id
        return vals

    def _timesheet_postprocess(self, values):
        """ Hook to update record one by one according to the values of a `write` or a `create`. """
        sudo_self = self.sudo()  # this creates only one env for all operation that required sudo() in `_timesheet_postprocess_values`override
        values_to_write = self._timesheet_postprocess_values(values)
        for timesheet in sudo_self:
            if values_to_write[timesheet.id]:
                timesheet.write(values_to_write[timesheet.id])
        return values

    def _timesheet_postprocess_values(self, values):
        """ Get the addionnal values to write on record
            :param dict values: values for the model's fields, as a dictionary::
                {'field_name': field_value, ...}
            :return: a dictionary mapping each record id to its corresponding
                dictionary values to write (may be empty).
        """
        result = {id_: {} for id_ in self.ids}
        sudo_self = self.sudo()  # this creates only one env for all operation that required sudo()
        # (re)compute the amount (depending on unit_amount, employee_id for the cost, and account_id for currency)
        if any(field_name in values for field_name in ['unit_amount', 'employee_id', 'account_id']):
            for timesheet in sudo_self:
                cost = timesheet._employee_timesheet_cost()
                amount = -timesheet.unit_amount * cost
                amount_converted = timesheet.employee_id.currencyId._convert(
                    amount, timesheet.account_id.currencyId or timesheet.currencyId, self.env.company, timesheet.date)
                result[timesheet.id].update({
                    'amount': amount_converted,
                })
        return result

    def _is_timesheet_encode_uom_day(self):
        company_uom = self.env.company.timesheet_encode_uom_id
        return company_uom == self.env.ref('uom.product_uom_day')

    @api.model
    def _convert_hours_to_days(self, time):
        uom_hour = self.env.ref('uom.product_uom_hour')
        uom_day = self.env.ref('uom.product_uom_day')
        return round(uom_hour._compute_quantity(time, uom_day, raise_if_failure: false), 2)

    def _get_timesheet_time_day(self):
        return self._convert_hours_to_days(self.unit_amount)

    def _employee_timesheet_cost(self):
        self.ensure_one()
        return self.employee_id.timesheet_cost or 0.0
