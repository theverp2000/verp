import { _super, MetaModel, Model } from "../../../core";
import { UserError } from "../../../core/helper";
import { bool } from "../../../core/tools";

@MetaModel.define()
class StockProductionLot extends Model {
    static _module = module;
    static _parents = 'stock.production.lot';

    async _checkCreate() {
        const activeMoId = this.env.context['activeMoId'];
        if (bool(activeMoId)) {
            const activeMo = this.env.items('mrp.production').browse(activeMoId);
            if (! bool(await (await activeMo.pickingTypeId).useCreateComponentsLots)) {
                throw new UserError(await this._t('You are not allowed to create or edit a lot or serial number for the components with the operation type "Manufacturing". To change this, go on the operation type and tick the box "Create New Lots/Serial Numbers for Components".'));
            }
        }
        return _super(StockProductionLot, this)._checkCreate();
    }
}