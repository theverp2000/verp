import { _super, MetaModel, Model } from "../../../core/models"

@MetaModel.define()
class IrUiMenu extends Model {
    static _module = module;
    static _parents = 'ir.ui.menu';

    async _loadMenusBlacklist() {
        const res = await _super(IrUiMenu, this)._loadMenusBlacklist();
        if (await (await this.env.user()).hasGroup('hr_timesheet.groupHrTimesheetApprover')) {
            res.push(await this.env.refId('hr_timesheet.timesheetMenuActivityUser'));
        }
        return res;
    }
}
