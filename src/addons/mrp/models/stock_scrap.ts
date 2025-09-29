import { api, Fields } from "../../../core";
import { _super, MetaModel, Model } from "../../../core/models"
import { bool, update } from "../../../core/tools";

@MetaModel.define()
class StockScrap extends Model {
    static _module = module;
    static _parents = 'stock.scrap';

    static productionId = Fields.Many2one('mrp.production', {string: 'Manufacturing Order',
        states: {'done': [['readonly', true]]}, checkCompany: true});
    static workorderId = Fields.Many2one('mrp.workorder', {string: 'Work Order',
        states: {'done': [['readonly', true]]},
        help: 'Not to restrict or prefer quants, but informative.', checkCompany: true});

    @api.onchange('workorderId')
    async _onchangeWorkorderId() {
        const workorder = await this['workorderId'];
        if (workorder.ok) {
            await this.set('locationId', (await (await workorder.productionId).locationSrcId).id);
        }
    }

    @api.onchange('productionId')
    async _onchangeProductionId() {
        const production = await this['productionId'];
        if (production.ok) {
            await this.set('locationId', bool(await (await production.moveRawIds).filtered(async (x) => !['done', 'cancel'].includes(await x.state))) && (await production.locationSrcId).id || (await production.locationDestId).id);
        }
    }

    async _prepareMoveValues() {
        const vals = await _super(StockScrap, this)._prepareMoveValues();
        const production = await this['productionId'];
        if (production.ok) {
            vals['origin'] = vals['origin'] || await production.label;
            if ((await (await production.moveFinishedIds).mapped('productId')).includes(await this['productId'])) {
                update(vals, {'productionId': production.id});
            }
            else {
                update(vals, {'rawMaterialProductionId': production.id});
            }
        }
        return vals;
    }

    @api.onchange('lotId')
    async _onchangeSerialNumber() {
        const [productId, lotId] = await this('productId', 'lotId');
        if (await productId.tracking == 'serial' && lotId.ok) {
            if (bool(await this['productionId'])) {
                const [message, recommendedLocation] = await this.env.items('stock.quant')._checkSerialNumber(productId,
                                                                                             lotId,
                                                                                             await this['companyId'],
                                                                                             await this['locationId'],
                                                                                             await (await this['productionId']).locationDestId);
                if (message) {
                    if (recommendedLocation) {
                        await this.set('locationId', recommendedLocation);
                    }
                    return {'warning': {'title': await this._t('Warning'), 'message': message}}
                }
            }
            else {
                return _super(StockScrap, this)._onchangeSerialNumber();
            }
        }
    }
}