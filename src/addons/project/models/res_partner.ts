import { Fields } from "../../../core";
import { MetaModel, Model } from "../../../core/models"
import { bool } from "../../../core/tools";

/**
 * Inherits partner and adds Tasks information in the partner form
 */
@MetaModel.define()
class ResPartner extends Model {
    static _module = module;
    static _parents = 'res.partner';

    static taskIds = Fields.One2many('project.task', 'partnerId', {string: 'Tasks'});
    static taskCount = Fields.Integer({compute: '_computeTaskCount', string: '# Tasks'});

    async _computeTaskCount() {
        // retrieve all children partners and prefetch 'parent_id' on them
        const allPartners = await (await this.withContext({activeTest: false})).search([['id', 'childOf', this.ids]]);
        await allPartners.read(['parentId']);

        const taskData = await this.env.items('project.task').readGroup(
            [['partnerId', 'in', allPartners.ids]],
            ['partnerId'], ['partnerId']
        );

        await this.set('taskCount', 0);
        for (const group of taskData) {
            let partner = this.browse(group['partnerId'][0]);
            while (bool(partner)) {
                if (this.includes(partner)) {
                    await partner.set('taskCount', await partner.taskCount + group['partnerId_count']);
                }
                partner = await partner.parentId;
            }
        }
    }
}