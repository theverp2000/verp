import { api, Fields } from "../../../core";
import { _super, MetaModel, TransientModel } from "../../../core/models";
import { f, update } from "../../../core/tools";

@MetaModel.define()
class ProjectShareWizard extends TransientModel {
    static _module = module;
    static _name = 'project.share.wizard';
    static _parents = 'portal.share';
    static _description = 'Project Sharing';

    @api.model()
    async defaultGet(fields) {
        const result = await _super(ProjectShareWizard, this).defaultGet(fields);
        if (!result['accessMode']) {
            update(result, {
                accessMode: 'read',
                displayAccessMode: true,
            });
        }
        return result;
    }

    @api.model()
    async _selectionTargetModel() {
        const projectModel = await this.env.items('ir.model')._get('project.project');
        return [[await projectModel.model, await projectModel.label]];
    }

    static accessMode = Fields.Selection([['read', 'Readonly'], ['edit', 'Edit']]);
    static displayAccessMode = Fields.Boolean();

    @api.depends('resModel', 'resId')
    async _computeResourceRef() {
        for (const wizard of this) {
            if (await wizard.resModel && await wizard.resModel == 'project.project') {
                await wizard.set('resourceRef', f('%s,%s', await wizard.resModel, await wizard.resId || 0));
            }
            else {
                await wizard.set('resourceRef', null);
            }
        }
    }

    async actionSendMail() {
        this.ensureOne();
        if (await this['accessMode'] == 'edit') {
            const self: any = this;
            const partnerIds = await self['partnerIds'];
            const portalPartners = await partnerIds.filtered('userIds');
            const note = await self._getNote();
            await (await self['resourceRef'])._addCollaborators(partnerIds);
            await self._sendPublicLink(note, portalPartners);
            await self._sendSignupLink(note, { partners: partnerIds.sub(portalPartners) });
            await (await self['resourceRef']).messageSubscribe({ partnerIds: partnerIds.ids });
            return { 'type': 'ir.actions.actwindow.close' }
        }
        return _super(ProjectShareWizard, this).actionSendMail();
    }
}
