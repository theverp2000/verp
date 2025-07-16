import { ProcurementException } from "../../stock";
import { _Datetime, api, Fields } from "../../../core";
import { DefaultDict, MapKey, OrderedSet } from "../../../core/helper";
import { _super, MetaModel, Model } from "../../../core/models"
import { AND } from "../../../core/osv/expression";
import { addDate, bool, extend, floatCompare, subDate, update } from "../../../core/tools";

@MetaModel.define()
class StockRule extends Model {
    static _module = module;
    static _parents = 'stock.rule';

    static action = Fields.Selection({selectionAdd: [
        ['manufacture', 'Manufacture']
    ], ondelete: {'manufacture': 'CASCADE'}});

    async _getMessageDict() {
        const messageDict = await _super(StockRule, this)._getMessageDict();
        const [source, destination, operation] = await (this as any)._getMessageValues();
        let manufactureMessage = await this._t('When products are needed in <b>%s</b>, <br/> a manufacturing order is created to fulfill the need.', destination);
        if (bool(await this['locationSrcId'])) {
            manufactureMessage += await this._t(' <br/><br/> The components will be taken from <b>%s</b>.', source);
        }
        update(messageDict, {
            'manufacture': manufactureMessage
        });
        return messageDict;
    }

    @api.depends('action')
    async _computePickingTypeCodeDomain() {
        let remaining = this.browse();
        for (const rule of this) {
            if (await rule.action == 'manufacture') {
                await rule.set('pickingTypeCodeDomain', 'mrpOperation');
            }
            else {
                remaining = remaining.or(rule);
            }
        }
        await _super(StockRule, remaining)._computePickingTypeCodeDomain();
    }

    async _shouldAutoConfirmProcurementMo(p) {
        return (!bool(await p.orderpointId) && bool(await p.moveRawIds)) || (await (await p.moveDestIds).procureMethod != 'makeToOrder' && ! bool(await p.moveRawIds) && ! bool(await p.workorderIds));
    }

    @api.model()
    async _runManufacture(procurements: any[]) {
        const productionsValuesByCompany = new DefaultDict(() => []);
        const errors = [];
        for (const [procurement, rule] of procurements) {
            if (floatCompare(await procurement.productQty, 0, {precisionRounding: await (await procurement.productUom).rounding}) <= 0) {
                // If procurement contains negative quantity, don't create a MO that would be for a negative value.
                continue;
            }
            const bom = await rule._getMatchingBom(await procurement.productId, await procurement.companyId, await procurement.values);

            productionsValuesByCompany[(await procurement.companyId).id].push(await rule._prepareMoVals(...procurement, bom));
        }

        if (errors.length) {
            throw new ProcurementException(errors);
        }
        for (const [companyId, productionsValues] of productionsValuesByCompany.items()) {
            // create the MO as SUPERUSER because the current user may not have the rights to do it (mto product launched by a sale for example)
            const productions = await (await (await (await this.env.items('mrp.production').withUser(global.SUPERUSER_ID)).sudo()).withCompany(companyId)).create(productionsValues);
            await (await this.env.items('stock.move').sudo()).create(await productions._getMovesRawValues());
            await (await this.env.items('stock.move').sudo()).create(await productions._getMovesFinishedValues());
            await productions._createWorkorder();
            await (await productions.filtered(this._shouldAutoConfirmProcurementMo).actionConfirm());

            for (const production of productions) {
                let originProduction = bool(await production.moveDestIds) && await (await production.moveDestIds)[0].rawMaterialProductionId;
                originProduction = bool(originProduction) ? originProduction : false;
                const orderpoint = await production.orderpointId;
                if (bool(orderpoint) && (await orderpoint.createUid).id == global.SUPERUSER_ID && await orderpoint.trigger == 'manual') {
                    await production.messagePost({
                        body: await this._t('This production order has been created from Replenishment Report.'),
                        messageType: 'comment',
                        subtypeXmlid: 'mail.mtNote'});
                }
                else if (bool(orderpoint)) {
                    await production.messagePostWithView(
                        'mail.messageOriginLink',
                        {values: {'self': production, 'origin': orderpoint},
                        subtypeId: (await this.env.ref('mail.mtNote')).id});
                }
                else if (bool(originProduction)) {
                    await production.messagePostWithView(
                        'mail.messageOriginLink',
                        {values: {'self': production, 'origin': originProduction},
                        subtypeId: (await this.env.ref('mail.mtNote')).id});
                }
            }
        }
        return true;
    }

    @api.model()
    async _runPull(procurements: any[]) {
        // Override to correctly assign the move generated from the pull
        // in its production order (pbmSam only)
        for (const [procurement, rule] of procurements) {
            let warehouseId = await rule.warehouseId;
            if (! bool(warehouseId)) {
                warehouseId = await (await rule.locationId).warehouseId;
            }
            if ((await rule.pickingTypeId).eq(await warehouseId.samTypeId)) {
                if (floatCompare(await procurement.productQty, 0, {precisionRounding: await (await procurement.product_uomC).rounding}) < 0) {
                    procurement.values['groupId'] = (await (await (await (await procurement.values['groupId'].stockMoveIds).filtered(async (m) => !['done', 'cancel'].includes(await m.state))).moveOrigIds).groupId).slice(0,1);
                    continue;
                }
                const manuTypeId = await warehouseId.manuTypeId;
                let label;
                if (bool(manuTypeId)) {
                    label = await (await manuTypeId.sequenceId).nextById();
                }
                else {
                    label = await this.env.items('ir.sequence').nextByCode('mrp.production') || await this._t('New');
                }
                // Create now the procurement group that will be assigned to the new MO
                // This ensure that the outgoing move PostProduction -> Stock is linked to its MO
                // rather than the original record (MO or SO)
                const group = procurement.values['groupId'];
                if (bool(group)) {
                    procurement.values['groupId'] = await group.copy({'label': label});
                }
                else {
                    procurement.values['groupId'] = await this.env.items("procurement.group").create({'label': label});
                }
            }
        }
        return _super(StockRule, this)._runPull(procurements);
    }

    async _getCustomMoveFields() {
        let fields = await _super(StockRule, this)._getCustomMoveFields();
        fields = fields.concat(['bomLineId']);
        return fields;
    }

    async _getMatchingBom(productId, companyId, values) {
        if (values['bomId'] ?? false) {
            return values['bomId'];
        }
        if ((values['orderpointId'] ?? false) && (await values['orderpointId'].bomId)) {
            return values['orderpointId'].bomId;
        }
        return (await this.env.items('mrp.bom')._bomFind(productId, {pickingType: await this['pickingTypeId'], bomType: 'normal', companyId: companyId.id})).get(productId);
    }

    async _prepareMoVals(productId, productQty, productUom, locationId, name, origin, companyId, values, bom) {
        const datePlanned = await this._getDatePlanned(productId, companyId, values);
        let dateDeadline = values['dateDeadline'] || addDate(addDate(datePlanned, {days: await companyId.manufacturingLead}), {days: await productId.produceDelay});
        const moValues = {
            'origin': origin,
            'productId': productId.id,
            'productDescriptionVariants': values['productDescriptionVariants'],
            'productQty': productQty,
            'productUomId': productUom.id,
            'locationSrcId': (await this['locationSrcId']).id || (await this['pickingTypeId']).defaultLocationSrcId.id || locationId.id,
            'locationDestId': locationId.id,
            'bomId': bom.id,
            'dateDeadline': dateDeadline,
            'datePlannedStart': datePlanned,
            'datePlannedFinished': _Datetime.toDatetime(values['datePlanned']),
            'procurementGroupId': false,
            'propagateCancel': await this['propagateCancel'],
            'orderpointId': (values['orderpointId'] ?? false) && values['orderpointId'].id,
            'pickingTypeId': (await this['pickingTypeId']).id || (await values['warehouseId'].manuTypeId).id,
            'companyId': companyId.id,
            'moveDestIds': bool(values['moveDestIds']) && values['moveDestIds'].map(x => [4, x.id]) || false,
            'userId': false,
        }
        // Use the procurement group created in _runPull mrp override
        // Preserve the origin from the original stock move, if available
        if (await (await locationId.warehouseId).manufactureSteps == 'pbmSam' && bool(values['moveDestIds']) && bool(values['groupId']) && values['moveDestIds'][0].origin != values['groupId'].label) {
            origin = values['moveDestIds'][0].origin;
            update(moValues, {
                'label': await values['groupId'].label,
                'procurementGroupId': values['groupId'].id,
                'origin': origin,
            });
        }
        return moValues;
    }

    async _getDatePlanned(productId, companyId, values) {
        const formatDatePlanned = _Datetime.toDatetime(values['datePlanned']) as Date;
        let datePlanned = subDate(formatDatePlanned, {days: await productId.produceDelay});
        datePlanned = subDate(datePlanned, {days: await companyId.manufacturingLead});
        if (datePlanned == formatDatePlanned) {
            datePlanned = subDate(datePlanned, {hours: 1});
        }
        return datePlanned;
    }

    /**
     * Add the product and company manufacture delay to the cumulative delay
        and cumulative description.
     * @param product 
     * @param values 
     * @returns 
     */
    async _getLeadDays(product, values) {
        let [delay, delayDescription] = await _super(StockRule, this)._getLeadDays(product, values);
        const bypassDelayDescription = this.env.context['bypassDelayDescription'];
        const manufactureRule = await this.filtered(async (r) => await r.action == 'manufacture');
        if (!bool(manufactureRule)) {
            return [delay, delayDescription];
        }
        manufactureRule.ensureOne();
        const manufactureDelay = await product.produceDelay;
        delay += manufactureDelay;
        if (!bypassDelayDescription) {
            delayDescription.push([await this._t('Manufacturing Lead Time'), await this._t('+ %s day(s)', manufactureDelay)]);
        }
        const securityDelay = await (await (await manufactureRule.pickingTypeId).companyId).manufacturingLead;
        delay += securityDelay;
        if (!bypassDelayDescription) {
            delayDescription.push([await this._t('Manufacture Security Lead Time'), await this._t('+ %s day(s)', securityDelay)]);
        }
        return [delay, delayDescription];
    }

    async _pushPrepareMoveCopyValues(moveToCopy, newDate) {
        const newMoveVals = await _super(StockRule, this)._pushPrepareMoveCopyValues(moveToCopy, newDate);
        newMoveVals['productionId'] = false;
        return newMoveVals;
    }
}

@MetaModel.define()
class ProcurementGroup extends Model {
    static _module = module;
    static _parents = 'procurement.group';

    static mrpProductionIds = Fields.One2many('mrp.production', 'procurementGroupId');

    /**
     * If 'run' is called on a kit, this override is made in order to call
        the original 'run' method with the values of the components of that kit.
     * @param procurements 
     * @param raiseUserError 
     */
    @api.model()
    async run(procurements: any[], raiseUserError = true) {
        const procurementsWithoutKit = [];
        const productByCompany = new DefaultDict(() => new OrderedSet());
        for (const procurement of procurements) {
            productByCompany.get(procurement.companyId).add(procurement.productId.id);
        }
        const kitsByCompany = new MapKey();
        for (const [company, productIds] of productByCompany.items()) {
            kitsByCompany.set(company, await this.env.items('mrp.bom')._bomFind(this.env.items('product.product').browse(productIds), {companyId: company.id, bomType: 'phantom'}));
        }
        for (const procurement of procurements) {
            const bomKit = kitsByCompany.get(procurement.companyId).get(procurement.productId);
            if (bool(bomKit)) {
                const orderQty = await procurement.productUom._computeQuantity(procurement.productQty, bomKit.productUomId, {round: false});
                const qtyToProduce = (orderQty / await bomKit.productQty);
                const [boms, bomSubLines] = await bomKit.explode(procurement.productId, qtyToProduce);
                for (const [bomLine, bomLineData] of bomSubLines) {
                    const bomLineUom = await bomLine.productUomId;
                    const quantUom = await (await bomLine.productId).uomId;
                    // recreate dict of values since each child has its own bomLineId
                    const values = Object.assign({}, procurement.values, {bomLineId: bomLine.id});
                    const [componentQty, procurementUom] = await bomLineUom._adjustUomQuantities(bomLineData['qty'], quantUom);
                    procurementsWithoutKit.push(await this.env.items('procurement.group').Procurement(
                        await bomLine.productId, componentQty, procurementUom,
                        procurement.locationId, procurement.label,
                        procurement.origin, procurement.companyId, values));
                }
            }
            else {
                procurementsWithoutKit.push(procurement);
            }
        }
        return _super(ProcurementGroup, this).run(procurementsWithoutKit, raiseUserError);
    }

    _getMovesToAssignDomain(companyId) {
        let domain = _super(ProcurementGroup, this)._getMovesToAssignDomain(companyId);
        domain = AND([domain, [['productionId', '=', false]]]);
        return domain;
    }
}
