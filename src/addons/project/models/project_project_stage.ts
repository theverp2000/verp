import { Fields } from "../../../core";
import { MetaModel, Model } from "../../../core/models"

@MetaModel.define()
class ProjectProjectStage extends Model {
    static _module = module;
    static _name = 'project.project.stage';
    static _description = 'Project Stage';
    static _order = 'sequence, id';

    static active = Fields.Boolean({default: true});
    static sequence = Fields.Integer({default: 50});
    static label = Fields.Char({required: true, translate: true});
    static mailTemplateId = Fields.Many2one('mail.template', {string: 'Email Template', domain: [['model', '=', 'project.project']],
        help: "If set, an email will be sent to the customer when the project reaches this step."});
    static fold = Fields.Boolean('Folded in Kanban', {help: "This stage is folded in the kanban view."});
}
