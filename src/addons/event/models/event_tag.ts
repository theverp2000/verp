import { randomInt } from "crypto";
import { Fields, MetaModel, Model } from "../../../core";

@MetaModel.define()
class EventTagCategory extends Model {
    static _module = module;
    static _name = "event.tag.category";
    static _description = "Event Tag Category";
    static _order = "sequence";

    static label = Fields.Char("Name", {required: true, translate: true});
    static sequence = Fields.Integer('Sequence', {default: 0});
    static tagIds = Fields.One2many('event.tag', 'categoryId', {string: "Tags"});
}

@MetaModel.define()
class EventTag extends Model {
    static _module = module;
    static _name = "event.tag";
    static _description = "Event Tag";
    static _order = "sequence";

    async _defaultColor() {
        return randomInt(1, 11);
    }

    static label = Fields.Char("Name", {required: true, translate: true});
    static sequence = Fields.Integer('Sequence', {default: 0});
    static categoryId = Fields.Many2one("event.tag.category", {string: "Category", required: true, ondelete: 'cascade'});
    static color = Fields.Integer({
        string: 'Color Index', default: self => self._defaultColor(),
        help: 'Tag color. No color means no display in kanban or front-end, to distinguish internal tags from public categorization tags.'});
}
