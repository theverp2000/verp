import { _Date, api, Fields } from "../../../core";
import { _super, MetaModel, Model } from "../../../core/models"
import { bool, some } from "../../../core/tools";

@MetaModel.define()
class StockPickingType extends Model {
    static _module = module;
    static _parents = 'stock.picking.type';

    static code = Fields.Selection({selectionAdd: [
        ['mrpOperation', 'Manufacturing']
    ], ondelete: {'mrpOperation': 'CASCADE'}});
    static countMoTodo = Fields.Integer({string: "Number of Manufacturing Orders to Process",
        compute: '_getMoCount'});
    static countMoWaiting = Fields.Integer({string: "Number of Manufacturing Orders Waiting",
        compute: '_getMoCount'});
    static countMoLate = Fields.Integer({string: "Number of Manufacturing Orders Late",
        compute: '_getMoCount'});
    static useCreateComponentsLots = Fields.Boolean({
        string: "Create New Lots/Serial Numbers for Components",
        help: "Allow to create new lot/serial numbers for the components",
        default: false,
    });

    async _getMoCount() {
        const mrpPickingTypes = await this.filtered(async (picking) => await picking.code == 'mrpOperation');
        if (!bool(mrpPickingTypes)) {
            await this.set('countMoWaiting', false);
            await this.set('countMoTodo', false);
            await this.set('countMoLate', false);
            return;
        }
        const domains = {
            'countMoWaiting': [['reservationState', '=', 'waiting']],
            'countMoTodo': ['|', ['state', 'in', ['confirmed', 'draft', 'progress', 'toClose']], ['isPlanned', '=', true]],
            'countMoLate': [['datePlannedStart', '<', _Date.today()], ['state', '=', 'confirmed']],
        }
        for (const field of Object.keys(domains)) {
            const data = await this.env.items('mrp.production').readGroup(domains[field].concat(
                [['state', 'not in', ['done', 'cancel']], ['pickingTypeId', 'in', this.ids]]),
                ['pickingTypeId'], ['pickingTypeId']);
            const count = Object.fromEntries(data.map(x => 
                [x['pickingTypeId'] && x['pickingTypeId'][0], x['pickingTypeId_count']]
            ));
            for (const record of mrpPickingTypes) {
                record[field] = count[record.id] ?? 0;
            }
        }
        const remaining = this.sub(mrpPickingTypes);
        if (bool(remaining)) {
            await remaining.set('countMoWaiting', false);
            await remaining.set('count_mo_todo', false);
            await remaining.set('count_mo_late', false);
        }
    }

    async getMrpStockPickingActionPickingType() {
        const action = await this.env.items("ir.actions.actions")._forXmlid('mrp.mrpProductionActionPickingDeshboard');
        if (this.ok) {
            action['displayName'] = await this['displayName'];
        }
        return action;
    }

    @api.onchange('code')
    async _onchangeCode() {
        if (await this['code'] == 'mrpOperation') {
            await this.set('useCreateLots', true);
            await this.set('useExistingLots', true);
        }
    }
}

@MetaModel.define()
class StockPicking extends Model {
    static _module = module;
    static _parents = 'stock.picking';

    static hasKits = Fields.Boolean({compute: '_computeHasKits'});

    @api.depends('moveLines')
    async _computeHasKits() {
        for (const picking of this) {
            await picking.set('hasKits', some(await (await picking.moveLines).mapped('bomLineId')))
        }
    }

    async _lessQuantitiesThanExpectedAddDocuments(moves, documents) {
        documents = await _super(StockPicking, this)._lessQuantitiesThanExpectedAddDocuments(moves, documents);

        /**
         * sort by picking and the responsible for the product the move.
         * @param move 
         * @returns 
         */
        async function _keysInSorted(move) {
            return [(await move.rawMaterialProductionId).id, (await (await move.productId).responsibleId).id];
        }

        /**
         * group by picking and the responsible for the product the
            move.
         */
        async function _keysInGroupby(move) {
            return [await move.rawMaterialProductionId, await (await move.productId).responsibleId];
        }

        const productionDocuments = await (this as any)._logActivityGetDocuments(moves, 'moveDestIds', 'DOWN', _keysInSorted, _keysInGroupby);
        return {...documents, ...productionDocuments}
    }
}
