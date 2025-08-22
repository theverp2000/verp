import { Fields } from "../../../core";
import { MetaModel, Model } from "../../../core/models"

@MetaModel.define()
class ProjectTaskStagePersonal extends Model {
    static _module = module; 
    static _name = 'project.task.stage.personal';
    static _description = 'Personal Task Stage';
    static _table = 'projectTaskUserRel';
    static _recName = 'stageId';

    static taskId = Fields.Many2one('project.task', {required: true, ondelete: 'CASCADE', index: true});
    static userId = Fields.Many2one('res.users', {required: true, ondelete: 'CASCADE', index: true});
    static stageId = Fields.Many2one('project.task.type', {domain: "[['userId', '=', userId]]", ondelete: 'RESTRICT'});

    static _sqlConstraints = [
        ['project_personal_stage_unique', 'UNIQUE ("taskId", "userId")', 'A task can only have a single personal stage per user.'],
    ];
}
