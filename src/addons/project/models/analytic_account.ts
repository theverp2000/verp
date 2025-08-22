import { api, Fields } from "../../../core";
import { UserError } from "../../../core/helper";
import { MetaModel, Model } from "../../../core/models"
import { len } from "../../../core/tools";

@MetaModel.define()
class AccountAnalyticAccount extends Model {
    static _module = module;
    static _parents = 'account.analytic.account';
    static _description = 'Analytic Account';

    static projectIds = Fields.One2many('project.project', 'analyticAccountId', {string: 'Projects'});
    static projectCount = Fields.Integer("Project Count", {compute: '_computeProjectCount'});

    @api.depends('projectIds')
    async _computeProjectCount() {
        const projectData = await this.env.items('project.project').readGroup([['analyticAccountId', 'in', this.ids]], ['analyticAccountId'], ['analyticAccountId']);
        const mapping = Object.fromEntries(projectData.map(m => [m['analyticAccountId'][0], m['analyticAccountId_count']]));
        for (const account of this) {
            await account.set('projectCount', mapping[account.id] ?? 0);
        }
    }

    @api.constrains('companyId')
    async _checkCompanyId() {
        for (const record of this) {
            const company = await record.companyId;
            if (company.ok && !await (await (await record.projectIds).mapped('companyId')).every(c => company.eq(c))) {
                throw new UserError(await this._t('You cannot change the company of an analytic account if it is related to a project.'));
            }
        }
    }

    @api.ondelete(false)
    async _unlinkExceptExistingTasks() {
        const projects = await this.env.items('project.project').search([['analyticAccountId', 'in', this.ids]]);
        const hasTasks = await this.env.items('project.task').searchCount([['projectId', 'in', projects.ids]]);
        if (hasTasks) {
            throw new UserError(await this._t('Please remove existing tasks in the project linked to the accounts you want to delete.'));
        }
    }

    async actionViewProjects() {
        const kanbanViewId = await this.env.refId('project.viewProjectKanban');
        const result = {
            "type": "ir.actions.actwindow",
            "resModel": "project.project",
            "views": [[kanbanViewId, "kanban"], [false, "form"]],
            "domain": [['analyticAccountId', '=', this.id]],
            "context": {"create": false},
            "label": "Projects",
        }
        if (len(await this['projectIds']) == 1) {
            result['views'] = [[false, "form"]];
            result['resId'] = (await this['projectIds']).id;
        }
        return result;
    }
}
