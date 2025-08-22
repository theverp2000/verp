import { _super, api, MetaModel, TransientModel } from "../../../core";
import { bool } from "../../../core/tools";

@MetaModel.define()
class MrpStockReport extends TransientModel {
    static _module = module;
    static _parents = 'stock.traceability.report';

    @api.model()
    async _getReference(moveLine) {
        let [resModel, resId, ref] = await _super(MrpStockReport, this)._getReference(moveLine);
        const move = await moveLine.moveId;
        if (bool(await move.productionId) && ! await move.scrapped) {
            resModel = 'mrp.production';
            resId = (await move.productionId).id;
            ref = await (await move.productionId).label;
        }
        if (bool(await move.rawMaterialProductionId) && ! await move.scrapped) {
            resModel = 'mrp.production';
            resId = (await move.rawMaterialProductionId).id;
            ref = await (await move.rawMaterialProductionId).label;
        }
        if (bool(await move.unbuildId)) {
            resModel = 'mrp.unbuild';
            resId = (await move.unbuildId).id;
            ref = await (move.unbuildId).label;
        }
        if (bool(await move.consumeUnbuildId)) {
            resModel = 'mrp.unbuild';
            resId = (await move.consumeUnbuildId).id;
            ref = await (await move.consumeUnbuildId).label;
        }
        return [resModel, resId, ref];
    }

    @api.model()
    async _getLinkedMoveLines(moveLine) {
        let [moveLines, isUsed] = await _super(MrpStockReport, this)._getLinkedMoveLines(moveLine);
        const [move, produceLineIds] = await moveLine('moveId', 'produceLineIds');
        if (!bool(moveLines)) {
            moveLines = (bool(await move.consumeUnbuildId) && bool(produceLineIds)) || (bool(await move.productionId) && bool(await moveLine.consumeLineIds));
        }
        if (!isUsed) {
            isUsed = (bool(await move.unbuildId) && bool(await moveLine.consumeLineIds)) || (bool(await move.rawMaterialProductionId) && bool(produceLineIds));
        }
        return [moveLines, isUsed];
    }
}