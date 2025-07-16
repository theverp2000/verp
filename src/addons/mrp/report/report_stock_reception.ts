import { _super, AbstractModel, MetaModel } from "../../../core/models"
import { formatDate } from "../../../core/tools";

@MetaModel.define()
class ReceptionReport extends AbstractModel {
    static _module = module;
    static _parents = 'report.stock.reception';

    async _getFormattedScheduledDate(source) {
        if (source._name == 'mrp.production') {
            return formatDate(this.env, source.datePlannedStart);
        }
        return _super(ReceptionReport, this)._getFormattedScheduledDate(source);
    }
}