import { api, Fields } from "../../../core";
import { MetaModel, TransientModel } from "../../../core/models"
import { all, len, objectToText } from "../../../core/tools";
import { literalEval } from "../../../core/tools/ast";

@MetaModel.define()
class ProjectTaskTypeDelete extends TransientModel {
    static _module = module;
    static _name = 'project.task.type.delete.wizard';
    static _description = 'Project Stage Delete Wizard';

    static projectIds = Fields.Many2many('project.project', {domain: "['|', ['active', '=', false], ['active', '=', true]]", string: 'Projects', ondelete: 'cascade'});
    static stageIds = Fields.Many2many('project.task.type', {string: 'Stages To Delete', ondelete: 'cascade'});
    static tasksCount = Fields.Integer('Number of Tasks', {compute: '_computeTasksCount'});
    static stagesActive = Fields.Boolean({compute: '_computeStagesActive'});

    @api.depends('projectIds')
    async _computeTasksCount() {
        for (const wizard of this) {
            await wizard.set('tasksCount', await (await this.withContext({activeTest: false})).env.items('project.task').searchCount([['stageId', 'in', (await wizard.stageIds).ids]]));
        }
    }

    @api.depends('stageIds')
    async _computeStagesActive() {
        for (const wizard of this) {
            await wizard.set('stagesActive', all(await (await wizard.stageIds).mapped('active')));
        }
    }

    async actionArchive() {
        if (len(await this['projectIds']) <= 1){
            return this.actionConfirm();
        }

        return {
            'label': await this._t('Confirmation'),
            'viewMode': 'form',
            'resModel': 'project.task.type.delete.wizard',
            'views': [[await this.env.refId('project.viewProjectTaskTypeDeleteConfirmationWizard'), 'form']],
            'type': 'ir.actions.actwindow',
            'resId': this.id,
            'target': 'new',
            'context': this.env.context,
        }
    }

    async actionConfirm() {
        const tasks = await (await this.withContext({activeTest: false})).env.items('project.task').search([['stageId', 'in', (await this['stageIds']).ids]]);
        await tasks.write({'active': false});
        await (await this['stageIds']).write({'active': false});
        return this._getAction();
    }

    async actionUnlink() {
        await (await this['stageIds']).unlink();
        return this._getAction();
    }

    async _getAction() {
        const projectId = this.env.context['default_projectId'];

        let action;
        if (projectId) {
            action = await this.env.items("ir.actions.actions")._forXmlid("project.actionViewTask");
            action['domain'] = [['projectId', '=', projectId]];
            action['context'] = objectToText({
                'pivotRowGroupby': ['userIds'],
                'default_projectId': projectId,
            });
        }
        else if (this.env.context['stageView']) {
            action = await this.env.items("ir.actions.actions")._forXmlid("project.openTaskTypeForm");
        }
        else {
            action = await this.env.items("ir.actions.actions")._forXmlid("project.actionViewAllTask");
        }

        const context = Object.assign({}, literalEval(action['context']), {activeTest: true});
        action['context'] = context;
        action['target'] = 'main';
        return action;
    }
}
