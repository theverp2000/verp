import { api, Fields, MetaModel, TransientModel } from "../../../core";

@MetaModel.define()
class ResConfigSettings extends TransientModel {
    static _module = module;
    static _parents = 'res.config.settings';

    static manufacturingLead = Fields.Float({related: 'companyId.manufacturingLead', string: "Manufacturing Lead Time", readonly: false});
    static useManufacturingLead = Fields.Boolean({string: "Default Manufacturing Lead Time", configParameter: 'mrp.useManufacturingLead'});
    static groupMrpByproducts = Fields.Boolean("By-Products", {impliedGroup: 'mrp.groupMrpByproducts'});
    static moduleMrpMps = Fields.Boolean("Master Production Schedule");
    static moduleMrpPlm = Fields.Boolean("Product Lifecycle Management (PLM)");
    static moduleMrpWorkorder = Fields.Boolean("Work Orders");
    static moduleQualityControl = Fields.Boolean("Quality");
    static moduleQualityControlWorksheet = Fields.Boolean("Quality Worksheet");
    static moduleMrpSubcontracting = Fields.Boolean("Subcontracting");
    static groupMrpRoutings = Fields.Boolean("MRP Work Orders", {impliedGroup: 'mrp.groupMrpRoutings'});
    static groupUnlockedByDefault = Fields.Boolean("Unlock Manufacturing Orders", {impliedGroup: 'mrp.groupUnlockedByDefault'});

    @api.onchange('useManufacturingLead')
    async _onchangeUseManufacturingLead() {
        if (! await this['useManufacturingLead']) {
            await this.set('manufacturingLead', 0.0);
        }
    }

    @api.onchange('groupMrpRoutings')
    async _onchangeGroupMrpRoutings() {
        // If we activate 'MRP Work Orders', it means that we need to install 'mrp_workorder'.
        // The opposite is not always true: other modules (such as 'quality_mrp_workorder') may
        // depend on 'mrp_workorder', so we should not automatically uninstall the module if 'MRP
        // Work Orders' is deactivated.
        // Long story short: if 'mrp_workorder' is already installed, we don't uninstall it based on
        // groupMrpRoutings
        if (await this['groupMrpRoutings']) {
            await this.set('moduleMrpWorkorder', true);
        } else {
            await this.set('moduleMrpWorkorder', false);
        }
    }

    /**
     * When changing this setting, we want existing MOs to automatically update to match setting.
     */
    @api.onchange('groupUnlockedByDefault')
    async _onchangeGroupUnlockedByDefault() {
        if (await this['groupUnlockedByDefault']) {
            await (await this.env.items('mrp.production').search([['state', 'not in', ['cancel', 'done']], ['isLocked', '=', true]])).set('isLocked', false);
        }
        else {
            await (await this.env.items('mrp.production').search([['state', 'not in', ['cancel', 'done']], ['isLocked', '=', false]])).set('isLocked', true);
        }
    }
}
