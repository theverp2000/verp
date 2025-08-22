import { Fields } from "../../../core";
import { MetaModel, Model } from "../../../core/models"

@MetaModel.define()
class AccountAnalyticTag extends Model {
    static _module = module;
    static _parents = 'account.analytic.tag';

    static taskIds = Fields.Many2many('project.task', {string: 'Tasks'});
}
