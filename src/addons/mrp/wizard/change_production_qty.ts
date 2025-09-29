import { api, Fields } from "../../../core";
import { MapKey, UserError } from "../../../core/helper";
import { _super, MetaModel, TransientModel } from "../../../core/models"
import { _format2, bool, floatIsZero, sum } from "../../../core/tools";

@MetaModel.define()
class ChangeProductionQty extends TransientModel {
    static _module = module;
    static _name = 'change.production.qty';
    static _description = 'Change Production Qty';

    static moId = Fields.Many2one('mrp.production', {string: 'Manufacturing Order', required: true, ondelete: 'CASCADE'});
    static productQty = Fields.Float('Quantity To Produce', {digits: 'Product Unit of Measure', required: true});

    @api.model()
    async defaultGet(fields) {
        const result = await _super(ChangeProductionQty, this).defaultGet(fields);
        if (fields.includes('moId') && !result['moId'] && this._context['activeModel'] == 'mrp.production' && this._context['activeId']) {
            result['moId'] = this._context['activeId'];
        }
        if (fields.includes('productQty') && !result['productQty'] && result['moId']) {
            result['productQty'] = await this.env.items('mrp.production').browse(result['moId']).productQty;
        }    
        return result;
    }

    /**
     * Update finished product and its byproducts. This method only update
        the finished moves not done or cancel and just increase or decrease
        their quantity according the unit_ratio. It does not use the BoM, BoM
        modification during production would not be taken into consideration.
     * @param production 
     * @param newQty 
     * @param oldQty 
     */
    @api.model()
    async _updateFinishedMoves(production, newQty, oldQty) {
        const modification = new MapKey();
        for (const move of await production.moveFinishedIds) {
            if (['done', 'cancel'].includes(await move.state)) {
                continue;
            }
            const doneQty = sum(await (await (await production.moveFinishedIds).filtered(
                async (r) =>
                    (await r.productId).eq(await move.productId) &&
                    await r.state == 'done'
                )).mapped('productUomQty')
            )
            const qty = (newQty - oldQty) * (await move.unitFactor) + doneQty;
            modification.set(move, [await move.productUomQty + qty, await move.productUomQty]);
            if ((await move.productUomQty + qty) > 0) {
                await move.write({'productUomQty': await move.productUomQty + qty});
            }
            else {
                await move._actionCancel();
            }
        }

        return modification;
    }

    async changeProdQty() {
        let precision = await this.env.items('decimal.precision').precisionGet('Product Unit of Measure');
        for (const wizard of this) {
            const production = await wizard.moId;
            const produced: number = sum(await (await (await production.moveFinishedIds).filtered(async (m) => (await m.productId).eq(await production.productId))).mapped('quantityDone'));
            if (await wizard.productQty < produced) {
                const formatQty = produced.toFixed(precision);
                throw new UserError(_format2(await this._t(
                    "You have already processed %(quantity)s. Please input a quantity higher than %(minimum)s "),
                    {quantity: formatQty, minimum: formatQty})
                );
            }
            const oldProductionQty = await production.productQty,
            newProductionQty = await wizard.productQty;
            const doneMoves = await (await production.moveFinishedIds).filtered(async (x) => await x.state == 'done' && (await x.productId).eq(await production.productId));
            const qtyProduced = await (await (await production.productId).uomId)._computeQuantity(sum(await doneMoves.mapped('productQty')), production.productUomId);

            const factor = (newProductionQty - qtyProduced) / (oldProductionQty - qtyProduced);
            const updateInfo = await production._updateRawMoves(factor);
            const documents = new MapKey();
            for (const [move, oldQty, newQty] of updateInfo) {
                const iterateKey = await production._getDocumentIterateKey(move);
                if (iterateKey) {
                    const document = await this.env.items('stock.picking')._logActivityGetDocuments(MapKey.fromEntries([[move, [newQty, oldQty]]]), iterateKey, 'UP');
                    for (const [key, value] of document.items()) {
                        if (documents.has(key)) {
                            documents.set(key, documents.get(key).concat([value]));
                        }
                        else {
                            documents.set(key, [value]);
                        }
                    }
                }
            }
            await production._logManufactureException(documents);
            const finishedMovesModification = await this._updateFinishedMoves(production, newProductionQty - qtyProduced, oldProductionQty - qtyProduced);
            if (bool(finishedMovesModification)) {
                await production._logDownsideManufacturedQuantity(finishedMovesModification);
            }
            await production.write({'productQty': newProductionQty});

            for (const wo of await production.workorderIds) {
                const operation = await wo.operationId;
                await wo.set('durationExpected', await wo._getDurationExpected({ratio: newProductionQty / oldProductionQty}));
                let quantity = await wo.qtyProduction - await wo.qtyProduced;
                if (await (await production.productId).tracking == 'serial') {
                    quantity = !floatIsZero(quantity, {precisionDigits: precision}) ? 1.0 : 0.0;
                }
                else {
                    quantity = (quantity > 0 && !floatIsZero(quantity, {precisionDigits: precision})) ? quantity : 0;
                }
                await wo._updateQtyProducing(quantity);
                if (await wo.qtyProduced < await wo.qtyProduction && await wo.state == 'done') {
                    await wo.set('state', 'progress');
                }
                if (await wo.qtyProduced == await wo.qtyProduction && await wo.state == 'progress') {
                    await wo.set('state', 'done');
                    if (await (await wo.nextWorkOrderId).state == 'pending') {
                        await (await wo.nextWorkOrderId).set('state', 'ready');
                    }
                }
                // assign moves; last operation receive all unassigned moves
                // TODO: following could be put in a function as it is similar as code in _workordersCreate
                // TODO: only needed when creating new moves
                let movesRaw = await (await production.moveRawIds).filtered(async (move) => (await move.operationId).eq(operation) && !['done', 'cancel'].includes(await move.state));
                if (wo.eq((await production.workorderIds)(-1))) {
                    movesRaw = movesRaw.or(await (await production.moveRawIds).filtered(async (move) => !bool(await move.operationId)));
                }
                const movesFinished = await (await production.moveFinishedIds).filtered(async (move) => (await move.operationId).eq(operation)) // TODO: code does nothing, unless maybe byProducts?
                await (await movesRaw.mapped('moveLineIds')).write({'workorderId': wo.id});
                await movesFinished.add(movesRaw).write({'workorderId': wo.id});
            }
        }
        // run scheduler for moves forecasted to not have enough in stock
        await (await (await (await this['moId']).filtered(async (mo) => ['confirmed', 'progress'].includes(await mo.state))).moveRawIds)._triggerScheduler();

        return {};
    }
}