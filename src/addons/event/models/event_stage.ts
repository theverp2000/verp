import { Fields, MetaModel, Model } from "../../../core";

@MetaModel.define()
class EventStage extends Model {
    static _module = module;
    static _name = 'event.stage';
    static _description = 'Event Stage';
    static _order = 'sequence, label';

    static label = Fields.Char({string: 'Stage Name', required: true, translate: true});
    static description = Fields.Text({string: 'Stage description', translate: true});
    static sequence = Fields.Integer('Sequence', {default: 1});
    static fold = Fields.Boolean({string: 'Folded in Kanban', default: false});
    static pipeEnd = Fields.Boolean(
        {string: 'End Stage', default: false,
        help: 'Events will automatically be moved into this stage when they are finished. The event moved into this stage will automatically be set as green.'});
    static legendBlocked = Fields.Char(
        'Red Kanban Label', {default: self => self._t('Blocked'), translate: true, required: true,
        help: 'Override the default value displayed for the blocked state for kanban selection.'});
    static legendDone = Fields.Char(
        'Green Kanban Label', {default: self => self._t('Ready for Next Stage'), translate: true, required: true,
        help: 'Override the default value displayed for the done state for kanban selection.'});
    static legendNormal = Fields.Char(
        'Grey Kanban Label', {default: self => self._t('In Progress'), translate: true, required: true,
        help: 'Override the default value displayed for the normal state for kanban selection.'});
}
