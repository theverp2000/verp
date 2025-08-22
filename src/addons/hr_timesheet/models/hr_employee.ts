import { Fields } from "../../../core";
import { _super, MetaModel, Model } from "../../../core/models"

@MetaModel.define()
class HrEmployee extends Model {
    static _module = module; 
    static _parents = 'hr.employee';

    static timesheetCost = Fields.Monetary('Timesheet Cost', {currencyField: 'currencyId',
    	groups: "hr.groupHrUser", default: 0.0});
    static currencyId = Fields.Many2one('res.currency', {related: 'companyId.currencyId', readonly: true});
}
