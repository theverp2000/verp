import _ from "lodash";
import { api, Fields } from "../../../core";
import { Counter, MapKey, UserError } from "../../../core/helper";
import { MetaModel, TransientModel } from "../../../core/models"
import { bool, len } from "../../../core/tools";

@MetaModel.define()
class StockAssignSerialNumbers extends TransientModel{
    static _module = module;
    static _parents = 'stock.assign.serial';

    static productionId = Fields.Many2one('mrp.production', {string: 'Production'});
    static expectedQty = Fields.Float('Expected Quantity', {digits: 'Product Unit of Measure'});
    static serialNumbers = Fields.Text('Produced Serial Numbers');
    static producedQty = Fields.Float('Produced Quantity', {digits: 'Product Unit of Measure'});
    static showApply = Fields.Boolean({help: "Technical field to show the Apply button"});
    static showBackorders = Fields.Boolean({help: "Technical field to show the Create Backorder and No Backorder buttons"});

    async generateSerialNumbersProduction() {
        if (await this['nextSerialNumber'] && await this['nextSerialCount']) {
            const generatedSerialNumbers = (this.env.items('stock.production.lot').generateLotNames(await this['nextSerialNumber'], await this['nextSerialCount'])).join('\n');
            await this.set('serialNumbers', await this['serialNumbers'] ? ([await this['serialNumbers'], generatedSerialNumbers]).join('\n') : generatedSerialNumbers);
            this._onchangeSerialNumbers();
        }
        const action = await this.env.items("ir.actions.actions")._forXmlid("mrp.actAssignSerialNumbersProduction");
        action['resId'] = this.id;
        return action;
    }

    async _getSerialNumbers() {
        if (await this['serialNumbers']) {
            return (await this['serialNumbers']).split('\n').filter(async (serialNumber) => len(serialNumber.trim()) > 0);
        }
        return [];
    }

    @api.onchange('serialNumbers')
    async _onchangeSerialNumbers() {
        await this.set('showApply', false);
        await this.set('showBackorders', false);
        const serialNumbers = await this._getSerialNumbers();
        const duplicateSerialNumbers = [];
        for (const [serialNumber, counter] of new Counter(serialNumbers)) {
            if (counter > 1) {
                duplicateSerialNumbers.push(serialNumber);
            }
        }
        if (duplicateSerialNumbers.length) {
            await this.set('serialNumbers', "");
            await this.set('producedQty', 0);
            throw new UserError(await this._t('Duplicate Serial Numbers (%s)', duplicateSerialNumbers.join(',')))
        }
        const production = await this['productionId'];
        const existingSerialNumbers = await this.env.items('stock.production.lot').search([
            ['companyId', '=', (await production.companyId).id],
            ['productId', '=', (await production.productId).id],
            ['label', 'in', serialNumbers],
        ]);
        if (bool(existingSerialNumbers)) {
            await this.set('serialNumbers', "");
            await this.set('producedQty', 0);
            throw new UserError(await this._t('Existing Serial Numbers (%s)', (await existingSerialNumbers.mapped('displayName')).join(',')));
        }
        if (len(serialNumbers) > await this['expectedQty']) {
            await this.set('serialNumbers', "");
            await this.set('producedQty', 0);
            throw new UserError(await this._t('There are more Serial Numbers than the Quantity to Produce'));
        }
        await this.set('producedQty', len(serialNumbers));
        await this.set('showApply', await this['producedQty'] == await this['expectedQty']);
        await this.set('showBackorders', await this['producedQty'] > 0 && await this['producedQty'] < await this['expectedQty']);
    }

    async _assignSerialNumbers(cancelRemainingQuantity=false) {
        const serialNumbers = await this._getSerialNumbers();
        const production = await this['productionId'];
        const productions = await production._splitProductions(
            MapKey.fromEntries([[production, Array(len(serialNumbers)).fill(1)]]), cancelRemainingQuantity, true);
        const productionLotsVals = [];
        for (const serialName of serialNumbers) {
            productionLotsVals.push({
                'productId': (await production.productId).id,
                'companyId': (await production.companyId).id,
                'label': serialName,
            });
        }
        const productionLots = await this.env.items('stock.production.lot').create(productionLotsVals);
        for (const [production, productionLot] of _.zip([...productions], [...productionLots])) {
            await production.set('lotProducingId', productionLot.id);
            await production.set('qtyProducing', await production.productQty);
            for (const workorder of await production.workorder_idsC) {
                await workorder.set('qtyProduced', await workorder.qtyProducing);
            }
        }

        if (bool(productions) && len(productionLots) < len(productions)) {
            await (await (await productions[-1].moveRawIds).moveLineIds).write({'qtyDone': 0});
            await productions[-1].set('state', "confirmed");
        }
    }

    async apply() {
        await this._assignSerialNumbers();
    }

    async createBackorder() {
        await this._assignSerialNumbers(false);
    }

    async noBackorder() {
        await this._assignSerialNumbers(true);
    }
}