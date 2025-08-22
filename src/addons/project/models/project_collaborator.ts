import { format } from "util";
import { api, Fields } from "../../../core";
import { _super, MetaModel, Model } from "../../../core/models"
import { bool } from "../../../core/tools";

@MetaModel.define()
class ProjectCollaborator extends Model {
    static _module = module;
    static _name = 'project.collaborator';
    static _description = 'Collaborators in project shared';

    static projectId = Fields.Many2one('project.project', 'Project Shared', {domain: [['privacyVisibility', '=', 'portal']], required: true, readonly: true});
    static partnerId = Fields.Many2one('res.partner', 'Collaborator', {required: true, readonly: true});

    static _sqlConstraints = [
        ['unique_collaborator', 'UNIQUE("projectId", "partnerId")', 'A collaborator cannot be selected more than once in the project sharing access. Please remove duplicate(s) and try again.'],
    ];

    async nameGet() {
        const collaboratorSearchRead = await this.searchRead([['id', 'in', this.ids]], ['id', 'projectId', 'partnerId']);
        return collaboratorSearchRead.map(collaborator => [collaborator['id'], format('%s - %s', collaborator['projectId'][1], collaborator['partnerId'][1])]);
    }

    @api.modelCreateMulti()
    async create(valsList) {
        const collaborator = await this.env.items('project.collaborator').search([], {limit: 1});
        const projectCollaborators = await _super(ProjectCollaborator, this).create(valsList);
        if (!bool(collaborator)) {
            await this._toggleProjectSharingPortalRules(true);
        }
        return projectCollaborators;
    }

    async unlink() {
        const res = await _super(ProjectCollaborator, this).unlink();
        // Check if it remains at least a collaborator in all shared projects.
        const collaborator = await this.env.items('project.collaborator').search([], {limit: 1});
        if (!bool(collaborator)) {  // then disable the project sharing feature
            await this._toggleProjectSharingPortalRules(false);
        }
        return res;
    }

    /**
     * Enable/disable project sharing feature

            When the first collaborator is added in the model then we need to enable the feature.
            In the inverse case, if no collaborator is stored in the model then we disable the feature.
            To enable/disable the feature, we just need to enable/disable the ir.model.access and ir.rule
            added to portal user that we do not want to give when we know the project sharing is unused.
     * @param active contains boolean value, True to enable the project sharing feature, otherwise we disable the feature.
     */
    @api.model()
    async _toggleProjectSharingPortalRules(active) {
        const accessProjectSharingPortal = await (await this.env.ref('project.accessProjectSharingTaskPortal')).sudo();
        if (await accessProjectSharingPortal.active != active) {
            await accessProjectSharingPortal.write({'active': active});
        }

        const taskPortalIrRule = await (await this.env.ref('project.projectTaskRulePortalProjectSharing')).sudo();
        if (await taskPortalIrRule.active != active) {
            await taskPortalIrRule.write({'active': active});
        }
    }
}
