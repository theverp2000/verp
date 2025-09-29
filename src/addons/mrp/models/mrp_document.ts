import { Fields } from "../../../core";
import { _super, MetaModel, Model } from "../../../core/models"
import { bool } from "../../../core/tools";

/**
 * Extension of ir.attachment only used in MRP to handle archivage
    and basic versioning.
 */
@MetaModel.define()
class MrpDocument extends Model {
    static _module = module;
    static _name = 'mrp.document';
    static _description = "Production Document";
    static _inherits = {
        'ir.attachment': 'irAttachmentId',
    }
    static _order = "priority desc, id desc";

    static irAttachmentId = Fields.Many2one('ir.attachment', { string: 'Related attachment', required: true, ondelete: 'CASCADE' });
    static active = Fields.Boolean('Active', { default: true });
    static priority = Fields.Selection([
        ['0', 'Normal'],
        ['1', 'Low'],
        ['2', 'High'],
        ['3', 'Very High']], { string: "Priority", help: 'Gives the sequence order when displaying a list of MRP documents.' });

    async copy(defaultValue?: any) {
        let irDefault = defaultValue;
        if (bool(irDefault)) {
            const irFields = this.env.models['ir.attachment']._fields;
            irDefault = Object.fromEntries(Object.keys(defaultValue).filter(field => field in irFields).map(field => [field, defaultValue[field]]));
        }
        const newAttach = await (await (await this['irAttachmentId']).withContext({ noDocument: true })).copy(irDefault);
        return _super(this, MrpDocument).copy(Object.assign({}, defaultValue, { irAttachmentId: newAttach.id }));
    }

    async unlink() {
        await (await this.mapped('irAttachmentId')).unlink();
        return _super(MrpDocument, this).unlink();
    }
}