import { Fields } from "../../../core";
import { MetaModel, TransientModel } from "../../../core/models"
import { sum } from "../../../core/tools";

@MetaModel.define()
class ProjectDelete extends TransientModel {
    static _module = module;
    static _name = 'project.delete.wizard';
    static _description = 'Project Delete Wizard';

    static projectIds = Fields.Many2many('project.project', {string: 'Projects'});
    static taskCount = Fields.Integer({compute: '_computeTaskCount'});
    static projectsArchived = Fields.Boolean({compute: '_computeProjectsArchived'});

    async _computeProjectsArchived() {
        for (const wizard of await this.withContext({activeTest: false})) {
            await wizard.set('projectsArchived', await (await wizard.projectIds).every(async (p) => !(await p.active)));
        }
    }

    async _computeTaskCount() {
        for (const wizard of this) {
            await wizard.set('taskCount', sum(await (await (await wizard.withContext({activeTest: false})).projectIds).mapped('taskCount')));
        }
    }

    async actionArchive() {
        await (await this['projectIds']).write({'active': false});
    }

    async confirmDelete() {
        await (await (await this.withContext({activeTest: false})).projectIds).unlink();
        return this.env.items("project.project")._actionOpenAllProjects();
    }
}
