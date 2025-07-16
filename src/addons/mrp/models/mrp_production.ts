import _ from "lodash";
import { PROCUREMENT_PRIORITIES } from "../../stock";
import { _Date, _Datetime, api, Fields } from "../../../core";
import { DefaultDict, MapKey, OrderedSet2, UserError, ValidationError } from "../../../core/helper";
import { _super, MetaModel, Model } from "../../../core/models";
import { _f2, addDate, bool, dateMax, enumerate, f, floatCompare, floatIsZero, floatRound, formatDate, formatDatetime, groupbyAsync, isInstance, len, map, parseInt, stringify, sum, update } from "../../../core/tools";

const SIZE_BACK_ORDER_NUMERING = 3;

/**
 * Manufacturing Orders
 */
@MetaModel.define()
class MrpProduction extends Model {
    static _module = module;
    static _name = 'mrp.production';
    static _description = 'Production Order';
    static _dateName = 'datePlannedStart';
    static _parents = ['mail.thread', 'mail.activity.mixin'];
    static _order = 'priority desc, datePlannedStart asc,id';

    @api.model()
    async _getDefaultPickingType() {
        const companyId = this.env.context['default_companyId'] ?? (await this.env.company()).id;
        return (await this.env.items('stock.picking.type').search([
            ['code', '=', 'mrpOperation'],
            ['warehouseId.companyId', '=', companyId],
        ], { limit: 1 })).id;
    }

    @api.model()
    async _getDefaultLocationSrcId() {
        let location: any = false;
        const companyId = this.env.context['default_companyId'] ?? (await this.env.company()).id;
        if (this.env.context['default_pickingTypeId']) {
            location = await this.env.items('stock.picking.type').browse(this.env.context['default_pickingTypeId']).defaultLocationSrcId;
        }
        if (!bool(location)) {
            location = await (await this.env.items('stock.warehouse').search([['companyId', '=', companyId]], { limit: 1 })).lotStockId;
        }
        return bool(location) && location.id || false;
    }

    @api.model()
    async _getDefaultLocationDestId() {
        let location: any = false;
        const companyId = this.env.context['default_companyId'] ?? (await this.env.company()).id;
        if (this._context['default_pickingTypeId']) {
            location = await this.env.items('stock.picking.type').browse(this.env.context['default_pickingTypeId']).defaultLocationDestId;
        }
        if (!bool(location)) {
            location = await (await this.env.items('stock.warehouse').search([['companyId', '=', companyId]], { limit: 1 })).lotStockId;
        }
        return bool(location) && location.id || false;
    }

    @api.model()
    async _getDefaultDatePlannedFinished() {
        if (this.env.context['default_datePlannedStart']) {
            return addDate(_Datetime.toDatetime(this.env.context['default_datePlannedStart']) as Date, { hours: 1 });
        }
        return addDate(new Date(), { hours: 1 });
    }

    @api.model()
    async _getDefaultDatePlannedStart() {
        if (this.env.context['default_dateDeadline']) {
            return _Datetime.toDatetime(this.env.context['default_dateDeadline']);
        }
        return new Date();
    }

    @api.model()
    async _getDefaultIsLocked() {
        return ! await this.userHasGroups('mrp.groupUnlockedByDefault');
    }

    static label = Fields.Char('Reference', { copy: false, readonly: true, default: x => x._t('New') });
    static priority = Fields.Selection(PROCUREMENT_PRIORITIES, {
        string: 'Priority', default: '0',
        help: "Components will be reserved first for the MO with the highest priorities."
    });
    static backorderSequence = Fields.Integer("Backorder Sequence", { default: 0, copy: false, help: "Backorder sequence, if equals to 0 means there is not related backorder" });
    static origin = Fields.Char('Source', {
        copy: false,
        states: { 'done': [['readonly', true]], 'cancel': [['readonly', true]] },
        help: "Reference of the document that generated this production order request."
    });

    static productId = Fields.Many2one('product.product', {
        string: 'Product',
        domain: `[
            ['type', 'in', ['product', 'consu']],
            '|',
                ['companyId', '=', false],
                ['companyId', '=', companyId]
        ]`,
        readonly: true, required: true, checkCompany: true,
        states: { 'draft': [['readonly', false]] }
    });
    static productTracking = Fields.Selection({ related: 'productId.tracking' });
    static productTemplateId = Fields.Many2one('product.template', { string: 'Product Template', related: 'productId.productTemplateId' });
    static productQty = Fields.Float('Quantity To Produce',
        {
            default: 1.0, digits: 'Product Unit of Measure',
            readonly: true, required: true, tracking: true,
            states: { 'draft': [['readonly', false]] }
        });
    static productUomId = Fields.Many2one('uom.uom', {
        string: 'Product Unit of Measure',
        readonly: true, required: true,
        states: { 'draft': [['readonly', false]] }, domain: "[['categoryId', '=', productUomCategoryId]]"
    });
    static lotProducingId = Fields.Many2one('stock.production.lot', {
        string: 'Lot/Serial Number', copy: false,
        domain: "[['productId', '=', productId], ['companyId', '=', companyId]]", checkCompany: true
    });
    static qtyProducing = Fields.Float({ string: "Quantity Producing", digits: 'Product Unit of Measure', copy: false });
    static productUomCategoryId = Fields.Many2one({ related: 'productId.uomId.categoryId' });
    static productUomQty = Fields.Float({ string: 'Total Quantity', compute: '_computeProductUomQty', store: true });
    static pickingTypeId = Fields.Many2one('stock.picking.type', {
        string: 'Operation Type',
        domain: "[['code', '=', 'mrpOperation'], ['companyId', '=', companyId]]",
        default: self => self._getDefaultPickingType(), required: true, checkCompany: true,
        readonly: true, states: { 'draft': [['readonly', false]] }
    });
    static useCreateComponentsLots = Fields.Boolean({ related: 'pickingTypeId.useCreateComponentsLots' });
    static locationSrcId = Fields.Many2one('stock.location', {
        string: 'Components Location',
        default: self => self._getDefaultLocationSrcId(),
        readonly: true, required: true,
        domain: "[['usage','=','internal'], '|', ['companyId', '=', false], ['companyId', '=', companyId]]",
        states: { 'draft': [['readonly', false]] }, checkCompany: true,
        help: "Location where the system will look for components."
    });
    static locationDestId = Fields.Many2one('stock.location', {
        string: 'Finished Products Location',
        default: self => self._getDefaultLocationDestId(),
        readonly: true, required: true,
        domain: "[['usage','=','internal'], '|', ['companyId', '=', false], ['companyId', '=', companyId]]",
        states: { 'draft': [['readonly', false]] }, checkCompany: true,
        help: "Location where the system will stock the finished products."
    });
    static datePlannedStart = Fields.Datetime('Scheduled Date', {
        copy: false, default: self => self._getDefaultDatePlannedStart(),
        help: "Date at which you plan to start the production.",
        index: true, required: true
    });
    static datePlannedFinished = Fields.Datetime('Scheduled End Date',
        {
            default: self => self._getDefaultDatePlannedFinished(),
            help: "Date at which you plan to finish the production.",
            copy: false
        });
    static dateDeadline = Fields.Datetime('Deadline', {
        copy: false, store: true, readonly: true, compute: '_computeDateDeadline', inverse: '_setDateDeadline',
        help: "Informative date allowing to define when the manufacturing order should be processed at the latest to fulfill delivery on time."
    });
    static dateStart = Fields.Datetime('Start Date', { copy: false, readonly: true, help: "Date of the WO" });
    static dateFinished = Fields.Datetime('End Date', { copy: false, readonly: true, help: "Date when the MO has been close" });

    static productionDurationExpected = Fields.Float("Expected Duration", { help: "Total expected duration (in minutes)", compute: '_computeProductionDurationExpected' });
    static productionRealDuration = Fields.Float("Real Duration", { help: "Total real duration (in minutes)", compute: '_computeProductionRealDuration' });

    static bomId = Fields.Many2one('mrp.bom', {
        string: 'Bill of Material',
        readonly: true, states: { 'draft': [['readonly', false]] },
        domain: `[
        '&',
            '|',
                ['companyId', '=', false],
                ['companyId', '=', companyId],
            '&',
                '|',
                    ['productId','=',productId],
                    '&',
                        ['productTemplateId.productVariantIds','=',productId],
                        ['productId','=',false],
        ['type', '=', 'normal']]`,
        checkCompany: true,
        help: "Bill of Materials allow you to define the list of required components to make a finished product."
    });

    static state = Fields.Selection([
        ['draft', 'Draft'],
        ['confirmed', 'Confirmed'],
        ['progress', 'In Progress'],
        ['toClose', 'To Close'],
        ['done', 'Done'],
        ['cancel', 'Cancelled']], {
            string: 'State',
        compute: '_computeState', copy: false, index: true, readonly: true,
        store: true, tracking: true,
        help: " * Draft: The MO is not confirmed yet.\n \
              * Confirmed: The MO is confirmed, the stock rules and the reordering of the components are trigerred.\n \
              * In Progress: The production has started (on the MO or on the WO).\n \
              * To Close: The production is done, the MO has to be closed.\n \
              * Done: The MO is closed, the stock moves are posted. \n \
              * Cancelled: The MO has been cancelled, can't be confirmed anymore."});
    static reservationState = Fields.Selection([
        ['confirmed', 'Waiting'],
        ['assigned', 'Ready'],
        ['waiting', 'Waiting Another Operation']],
        {
            string: 'MO Readiness',
            compute: '_computeReservationState', copy: false, index: true, readonly: true,
            store: true, tracking: true,
            help: "Manufacturing readiness for this MO, as per bill of material configuration:\n \
            * Ready: The material is available to start the production.\n \
            * Waiting: The material is not available to start the production.\n"});

    static moveRawIds = Fields.One2many('stock.move', 'rawMaterialProductionId', {
        string: 'Components',
        copy: false, states: { 'done': [['readonly', true]], 'cancel': [['readonly', true]] },
        domain: [['scrapped', '=', false]]
    });
    static moveFinishedIds = Fields.One2many('stock.move', 'productionId', {
        string: 'Finished Products',
        copy: false, states: { 'done': [['readonly', true]], 'cancel': [['readonly', true]] },
        domain: [['scrapped', '=', false]]
    });
    static moveByproductIds = Fields.One2many('stock.move', { compute: '_computeMoveByproductIds', inverse: '_setMoveByproductIds' });
    static finishedMoveLineIds = Fields.One2many('stock.move.line', { compute: '_computeLines', inverse: '_inverseLines', string: "Finished Product" });
    static workorderIds = Fields.One2many('mrp.workorder', 'productionId', { string: 'Work Orders', copy: true });
    static moveDestIds = Fields.One2many('stock.move', 'createdProductionId', { string: "Stock Movements of Produced Goods" });

    static unreserveVisible = Fields.Boolean('Allowed to Unreserve Production', {
        compute: '_computeUnreserveVisible',
        help: 'Technical field to check when we can unreserve'
    });
    static reserveVisible = Fields.Boolean('Allowed to Reserve Production', {
        compute: '_computeUnreserveVisible',
        help: 'Technical field to check when we can reserve quantities'
    });
    static userId = Fields.Many2one('res.users', {
        string: 'Responsible', default: self => self.env.user(),
        states: { 'done': [['readonly', true]], 'cancel': [['readonly', true]] },
        domain: async (self) => [['groupsId', 'in', (await self.env.ref('mrp.groupMrpUser')).id]]
    });
    static companyId = Fields.Many2one('res.company', {
        string: 'Company', default: self => self.env.company(),
        index: true, required: true
    });

    static qtyProduced = Fields.Float({ compute: "_getProducedQty", string: "Quantity Produced" });
    static procurementGroupId = Fields.Many2one('procurement.group', {
        string: 'Procurement Group',
        copy: false
    });
    static productDescriptionVariants = Fields.Char('Custom Description');
    static orderpointId = Fields.Many2one('stock.warehouse.orderpoint', { string: 'Orderpoint', index: true, copy: false });
    static propagateCancel = Fields.Boolean('Propagate cancel and split',
        { help: 'If checked, when the previous move of the move (which was generated by a next procurement) is cancelled or split, the move generated by this move will too' });
    static delayAlertDate = Fields.Datetime('Delay Alert Date', { compute: '_computeDelayAlertDate', search: '_searchDelayAlertDate' });
    static jsonPopover = Fields.Char('JSON data for the popover widget', { compute: '_computeJsonPopover' });
    static scrapIds = Fields.One2many('stock.scrap', 'productionId', { string: 'Scraps' });
    static scrapCount = Fields.Integer({ compute: '_computeScrapMoveCount', string: 'Scrap Move' });
    static isLocked = Fields.Boolean('Is Locked', { default: self => self._getDefaultIsLocked(), copy: false });
    static isPlanned = Fields.Boolean('Its Operations are Planned', { compute: "_computeIsPlanned", store: true });

    static showFinalLots = Fields.Boolean('Show Final Lots', { compute: '_computeShowLots' });
    static productionLocationId = Fields.Many2one('stock.location', { string: "Production Location", compute: "_computeProductionLocation", store: true });
    static pickingIds = Fields.Many2many('stock.picking', { compute: '_computePickingIds', string: 'Picking associated to this manufacturing order' });
    static deliveryCount = Fields.Integer({ string: 'Delivery Orders', compute: '_computePickingIds' });
    static confirmCancel = Fields.Boolean({ compute: '_computeConfirmCancel' });
    static consumption = Fields.Selection([
        ['flexible', 'Allowed'],
        ['warning', 'Allowed with warning'],
        ['strict', 'Blocked']],
        {
            required: true,
            readonly: true,
            default: 'flexible'
        },
    );

    static mrpProductionChildCount = Fields.Integer("Number of generated MO", { compute: '_computeMrpProductionChildCount' });
    static mrpProductionSourceCount = Fields.Integer("Number of source MO", { compute: '_computeMrpProductionSourceCount' });
    static mrpProductionBackorderCount = Fields.Integer("Count of linked backorder", { compute: '_computeMrpProductionBackorder' });
    static showLock = Fields.Boolean('Show Lock/unlock buttons', { compute: '_computeShowLock' });
    static componentsAvailability = Fields.Char({
        string: "Component Status", compute: '_computeComponentsAvailability',
        help: "Latest component availability status for this MO. If green, then the MO's readiness status is ready, as per BOM configuration."
    });
    static componentsAvailabilityState = Fields.Selection([
        ['available', 'Available'],
        ['expected', 'Expected'],
        ['late', 'Late']], { compute: '_computeComponentsAvailability' });
    static showLotIds = Fields.Boolean('Display the serial number shortcut on the moves', { compute: '_computeShowLotIds' });
    static forecastedIssue = Fields.Boolean({ compute: '_computeForecastedIssue' });
    static showSerialMassProduce = Fields.Boolean('Display the serial mass product wizard action moves', { compute: '_computeShowSerialMassProduce' });

    @api.depends('procurementGroupId.stockMoveIds.createdProductionId.procurementGroupId.mrpProductionIds',
        'procurementGroupId.stockMoveIds.moveOrigIds.createdProductionId.procurementGroupId.mrpProductionIds')
    async _computeMrpProductionChildCount() {
        for (const production of this) {
            await production.set('mrpProductionChildCount', len(await production._getChildren()));
        }
    }

    @api.depends('procurementGroupId.mrpProductionIds.moveDestIds.groupId.mrpProductionIds',
        'procurementGroupId.stockMoveIds.moveDestIds.groupId.mrpProductionIds')
    async _computeMrpProductionSourceCount() {
        for (const production of this) {
            await production.set('mrpProductionSourceCount', len(await production._getSources()));
        }
    }

    @api.depends('procurementGroupId.mrpProductionIds')
    async _computeMrpProductionBackorder() {
        for (const production of this) {
            await production.set('mrpProductionBackorderCount', len(await (await production.procurementGroupId).mrpProductionIds));
        }
    }

    @api.depends('state', 'reservationState', 'datePlannedStart', 'moveRawIds', 'moveRawIds.forecastAvailability', 'moveRawIds.forecastExpectedDate')
    async _computeComponentsAvailability() {
        const productions = await this.filtered(async (mo) => !['cancel', 'done', 'draft'].includes(await mo.state));
        await productions.set('componentsAvailabilityState', 'available');
        await productions.set('componentsAvailability', await this._t('Available'));

        const otherProductions = this.sub(productions);
        await otherProductions.set('componentsAvailability', false);
        await otherProductions.set('componentsAvailabilityState', false);

        const allRawMoves = await productions.moveRawIds;
        // Force to prefetch more than 1000 by 1000
        await allRawMoves._fields['forecastAvailability'].computeValue(allRawMoves);
        for (const production of productions) {
            if (await (await production.moveRawIds).some(async (move) => floatCompare(await move.forecastAvailability, await move.state == 'draft' ? 0 : await move.productQty, { precisionRounding: await (await (await move.productId).uomId).rounding }) == -1)) {
                await production.set('componentsAvailability', await this._t('Not Available'));
                await production.set('componentsAvailabilityState', 'late');
            }
            else {
                const forecastDate = Math.max(...(await (await (await production.moveRawIds).filtered('forecastExpectedDate')).mapped('forecastExpectedDate')), 0);
                if (forecastDate) {
                    await production.set('componentsAvailability', await this._t('Exp %s', await formatDate(this.env, forecastDate)));
                    if (await production.datePlannedStart) {
                        await production.set('componentsAvailabilityState', forecastDate > await production.datePlannedStart ? 'late' : 'expected');
                    }
                }
            }
        }
    }

    @api.depends('moveFinishedIds.dateDeadline')
    async _computeDateDeadline() {
        for (const production of this) {
            await production.set('dateDeadline', Math.min(...(await (await (await production.moveFinishedIds).filtered('dateDeadline')).mapped('dateDeadline')), await production.dateDeadline) || false);
        }
    }

    async _setDateDeadline() {
        for (const production of this) {
            await (await production.moveFinishedIds).set('dateDeadline', await production.dateDeadline);
        }
    }

    @api.depends('workorderIds.durationExpected')
    async _computeProductionDurationExpected() {
        for (const production of this) {
            await production.set('productionDurationExpected', sum(await (await production.workorderIds).mapped('durationExpected')));
        }
    }

    @api.depends('workorderIds.duration')
    async _computeProductionRealDuration() {
        for (const production of this) {
            await production.set('productionRealDuration', sum(await (await production.workorderIds).mapped('duration')));
        }
    }

    @api.depends("workorderIds.datePlannedStart", "workorderIds.datePlannedFinished")
    async _computeIsPlanned() {
        for (const production of this) {
            const workorderIds = await production.workorderIds;
            if (bool(workorderIds)) {
                await production.set('isPlanned', await workorderIds.some(async (wo) => await wo.datePlannedStart && await wo.datePlannedFinished));
            }
            else {
                await production.set('isPlanned', false);
            }
        }
    }

    @api.depends('moveRawIds.delayAlertDate')
    async _computeDelayAlertDate() {
        let delayAlertDateData = await this.env.items('stock.move').readGroup([['id', 'in', (await this['moveRawIds']).ids], ['delayAlertDate', '!=', false]], ['delayAlertDate:max'], 'rawMaterialProductionId');
        delayAlertDateData = Object.fromEntries(delayAlertDateData.map(data => [data['rawMaterialProductionId'][0], data['delayAlertDate']]));
        for (const production of this) {
            await production.set('delayAlertDate', delayAlertDateData[production.id] ?? false);
        }
    }

    async _computeJsonPopover() {
        const productionNoAlert = await this.filtered(async (m) => ['done', 'cancel'].includes(await m.state) || ! await m.delayAlertDate);
        await productionNoAlert.set('jsonPopover', false);
        for (const production of this.sub(productionNoAlert)) {
            await production.set('jsonPopover', stringify({
                'popoverTemplate': 'stock.PopoverStockRescheduling',
                'delayAlertDate': await formatDatetime(this.env, await production.delayAlertDate),
                'lateElements': (await (await (await (await production.moveRawIds).filtered(m => m.delayAlertDate)).moveOrigIds)._delayAlertGetDocuments()).map(async (lateDocument) => {
                    return {
                        'id': lateDocument.id,
                        'label': await lateDocument.displayName,
                        'model': lateDocument._name,
                    }
                })
            }));
        }
    }

    /**
     * If the manufacturing order contains some done move (via an intermediate
        post inventory), the user has to confirm the cancellation.
     */
    @api.depends('moveRawIds.state', 'moveFinishedIds.state')
    async _computeConfirmCancel() {
        const domain = [
            ['state', '=', 'done'],
            '|',
            ['productionId', 'in', this.ids],
            ['rawMaterialProductionId', 'in', this.ids]
        ];
        const res = await this.env.items('stock.move').readGroup(domain, ['state', 'productionId', 'rawMaterialProductionId'], ['productionId', 'rawMaterialProductionId'], { lazy: false });
        const productionsWithDoneMove = {}
        for (const rec of res) {
            const productionRecord = rec['productionId'] || rec['rawMaterialProductionId'];
            if (productionRecord) {
                productionsWithDoneMove[productionRecord[0]] = true;
            }
        }
        for (const production of this) {
            await production.set('confirmCancel', productionsWithDoneMove[production.id] ?? false);
        }
    }

    @api.depends('procurementGroupId')
    async _computePickingIds() {
        for (const order of this) {
            await order.set('pickingIds', await this.env.items('stock.picking').search([
                ['groupId', '=', (await order.procurementGroupId).id], ['groupId', '!=', false],
            ]));
            await order.set('deliveryCount', len(await order.pickingIds));
        }
    }

    /**
     * This function returns an action that display picking related to
        manufacturing order orders. It can either be a in a list or in a form
        view, if there is only one picking to show.
     */
    async actionViewMoDelivery() {
        this.ensureOne()
        const action = await this.env.items("ir.actions.actions")._forXmlid("stock.actionPickingTreeAll");
        const pickings = await this.mapped('pickingIds');
        if (len(pickings) > 1) {
            action['domain'] = [['id', 'in', pickings.ids]];
        }
        else if (bool(pickings)) {
            const formView = [[(await this.env.ref('stock.viewPickingForm')).id, 'form']];
            if ('views' in action) {
                action['views'] = formView.concat(action['views'].filter(([state, view]) => view != 'form'));
            }
            else {
                action['views'] = formView;
            }
            action['resId'] = pickings.id;
        }
        action['context'] = Object.assign({}, this._context, { default_origin: await this['label'], create: false });
        return action;
    }

    @api.depends('productUomId', 'productQty', 'productId.uomId')
    async _computeProductUomQty() {
        for (const production of this) {
            if ((await (await production.productId).uomId).ne(await production.productUomId)) {
                await production.set('productUomQty', await (await production.productUomId)._computeQuantity(await production.productQty, await (await production.productId).uomId));
            }
            else {
                await production.set('productUomQty', await production.productQty);
            }
        }
    }

    @api.depends('productId', 'companyId')
    async _computeProductionLocation() {
        const company = await this['companyId'];
        if (!bool(company)) {
            return;
        }
        let locationByCompany = await this.env.items('stock.location').readGroup([
            ['companyId', 'in', company.ids],
            ['usage', '=', 'production']
        ], ['companyId', 'ids:array_agg(id)'], ['companyId']);
        locationByCompany = Object.fromEntries(locationByCompany.map(lbc => [lbc['companyId'][0], lbc['ids']]));
        for (const production of this) {
            if (bool(await production.productId)) {
                await production.set('productionLocationId', await (await (await production.productId).withCompany(await production.companyId)).propertyStockProduction);
            }
            else {
                await production.set('productionLocationId', locationByCompany[(await production.companyId).id][0]);
            }
        }
    }

    @api.depends('productId.tracking')
    async _computeShowLots() {
        for (const production of this) {
            await production.set('showFinalLots', await (await production.productId).tracking != 'none');
        }
    }

    /**
     * Little hack to make sure that when you change something on these objects, it gets saved
     */
    async _inverseLines() {
        //pass
    }

    @api.depends('moveFinishedIds.moveLineIds')
    async _computeLines() {
        for (const production of this) {
            await production.set('finishedMoveLineIds', await (await production.moveFinishedIds).mapped('moveLineIds'));
        }
    }

    /**
     * Compute the production state. This uses a similar process to stock
        picking, but has been adapted to support having no moves. This adaption
        includes some state changes outside of this compute.

        There exist 3 extra steps for production:
        - progress: At least one item is produced or consumed.
        - toClose: The quantity produced is greater than the quantity to
        produce and all work orders has been finished.
     */
    @api.depends(
        'moveRawIds.state', 'moveRawIds.quantityDone', 'moveFinishedIds.state',
        'workorderIds.state', 'productQty', 'qtyProducing')
    async _computeState() {
        for (const production of this) {
            const [productUomId, workorderIds] = await production('productUomId', 'workorderIds');
            if (! await production.state || !bool(productUomId)) {
                await production.set('state', 'draft');
            }
            else if (await production.state == 'cancel' || (bool(await production.moveFinishedIds) && await (await production.moveFinishedIds).every(async (move) => await move.state == 'cancel'))) {
                await production.set('state', 'cancel');
            }
            else if (
                await production.state == 'done'
                || (bool(await production.moveRawIds) && await (await production.moveRawIds).every(async (move) => ['cancel', 'done'].includes(await move.state)))
                && await (await production.moveFinishedIds).every(async (move) => ['cancel', 'done'].includes(await move.state))
            ) {
                await production.set('state', 'done');
            }
            else if (workorderIds.ok && (await workorderIds.mapped('state')).every(woState => ['done', 'cancel'].includes(woState))) {
                await production.set('state', 'toClose');
            }
            else if (!workorderIds.ok && floatCompare(await production.qtyProducing, await production.productQty, { precisionRounding: await productUomId.rounding }) >= 0) {
                await production.set('state', 'toClose');
            }
            else if ((await workorderIds.mapped('state')).some(woState => ['progress', 'done'].includes(woState))) {
                await production.set('state', 'progress');
            }
            else if (productUomId.ok && !floatIsZero(await production.qtyProducing, { precisionRounding: await productUomId.rounding })) {
                await production.set('state', 'progress');
            }
            else if (await (await (await production.moveRawIds).filter(move => move.productId)).some(async (move) => !floatIsZero(await move.quantityDone, { precisionRounding: await (await move.productUom).rounding || await (await (move.productId).uomId).rounding }))) {
                await production.set('state', 'progress');
            }
        }
    }

    @api.depends('state', 'moveRawIds.state')
    async _computeReservationState() {
        await this.set('reservationState', false);
        for (const production of this) {
            if (['draft', 'done', 'cancel'].includes(await production.state)) {
                continue;
            }
            const relevantMoveState = await (await production.moveRawIds)._getRelevantStateAmongMoves();
            // Compute reservation state according to its component's moves.
            if (relevantMoveState == 'partiallyAvailable') {
                if (bool(await (await production.workorderIds).operationId) && await (await production.bomId).readyToProduce == 'asap') {
                    await production.set('reservationState', await production._getReadyToProduceState());
                }
                else {
                    await production.set('reservationState', 'confirmed');
                }
            }
            else if (relevantMoveState != 'draft') {
                await production.set('reservationState', relevantMoveState);
            }
        }
    }

    @api.depends('moveRawIds', 'state', 'moveRawIds.productUomQty')
    async _computeUnreserveVisible() {
        for (const order of this) {
            const alreadyReserved = !['done', 'cancel'].includes(await order.state) && bool(await order.mapped('moveRawIds.moveLineIds'));
            const moveRawIds = await order.moveRawIds;
            const anyQuantityDone = await moveRawIds.some(async (m) => await m.quantityDone > 0);

            await order.set('unreserveVisible', !anyQuantityDone && alreadyReserved);
            await order.set('reserveVisible', ['confirmed', 'progress', 'toClose'].includes(await order.state) && await moveRawIds.some(async (move) => await move.productUomQty && ['confirmed', 'partiallyAvailable'].includes(await move.state)));
        }
    }

    @api.depends('workorderIds.state', 'moveFinishedIds', 'moveFinishedIds.quantityDone')
    async _getProducedQty() {
        for (const production of this) {
            const doneMoves = await (await production.moveFinishedIds).filtered(async (x) => await x.state != 'cancel' && (await x.productId).id == (await production.productId).id);
            const qtyProduced = sum(await doneMoves.mapped('quantityDone'));
            await production.set('qtyProduced', qtyProduced);
        }
        return true;
    }

    async _computeScrapMoveCount() {
        const data = await this.env.items('stock.scrap').readGroup([['productionId', 'in', this.ids]], ['productionId'], ['productionId']);
        const countData = Object.fromEntries(data.map(item => [item['productionId'][0], item['productionId_count']]));
        for (const production of this) {
            await production.set('scrapCount', countData[production.id] ?? 0);
        }
    }

    @api.depends('moveFinishedIds')
    async _computeMoveByproductIds() {
        for (const order of this) {
            await order.set('moveByproductIds', await (await order.moveFinishedIds).filtered(async (m) => (await m.productId).ne(await order.productId)));
        }
    }

    async _setMoveByproductIds() {
        const moveFinishedIds = await (await this['moveFinishedIds']).filtered(async (m) => (await m.productId).eq(await this['productId']));
        await this.set('moveFinishedIds', moveFinishedIds.or(await this['moveByproductIds']));
    }

    @api.depends('state')
    async _computeShowLock() {
        for (const order of this) {
            await order.set('showLock', await order.state == 'done' || (
                ! await (await this.env.user()).hasGroup('mrp.groupUnlockedByDefault')
                && order.id != false
                && !['cancel', 'draft'].includes(await order.state)
            ));
        }
    }

    @api.depends('state', 'moveRawIds')
    async _computeShowLotIds() {
        for (const order of this) {
            await order.set('showLotIds', await order.state != 'draft' && await (await order.moveRawIds).some(async (m) => await (await m.productId).tracking == 'serial'));
        }
    }

    @api.depends('state', 'moveRawIds')
    async _computeShowSerialMassProduce() {
        await this.set('showSerialMassProduce', false);
        for (const order of this) {
            const rounding = await (await order.productUomId).rounding;
            if (await order.state == 'confirmed' && await (await order.productId).tracking == 'serial' &&
                floatCompare(await order.productQty, 1, { precisionRounding: rounding }) > 0 &&
                floatCompare(await order.qtyProducing, await order.productQty, { precisionRounding: rounding }) < 0) {
                const [haveSerialComponents,] = await order._checkSerialMassProduceComponents();
                if (!bool(haveSerialComponents)) {
                    await order.set('showSerialMassProduce', true);
                }
            }
        }
    }

    static _sqlConstraints = [
        ['labelUniq', 'unique(label, "companyId")', 'Reference must be unique per Company!'],
        ['qtyPositive', 'check ("productQty" > 0)', 'The quantity to produce must be positive!'],
    ];

    @api.depends('productUomQty', 'datePlannedStart')
    async _computeForecastedIssue() {
        for (const order of this) {
            const warehouse = await (await order.locationDestId).warehouseId;
            await order.set('forecastedIssue', false);
            if (bool(await order.productId)) {
                let virtualAvailable = await (await (await order.productId).withContext({ warehouse: warehouse.id, toDate: await order.datePlannedStart })).virtualAvailable;
                if (await order.state == 'draft') {
                    virtualAvailable += await order.productUomQty;
                }
                if (virtualAvailable < 0) {
                    await order.set('forecastedIssue', true);
                }
            }
        }
    }

    @api.model()
    async _searchDelayAlertDate(operator, value) {
        const lateStockMoves = await this.env.items('stock.move').search([['delayAlertDate', operator, value]]);
        return ['|', ['moveRawIds', 'in', lateStockMoves.ids], ['moveFinishedIds', 'in', lateStockMoves.ids]];
    }

    @api.onchange('companyId')
    async _onchangeCompanyId() {
        const [company, moveRawIds, pickingType] = await this('companyId', 'moveRawIds', 'pickingTypeId');
        if (company.ok) {
            if (moveRawIds.ok) {
                await moveRawIds.update({ 'companyId': company });
            }
            if (pickingType.ok && (await pickingType.companyId).ne(company)) {
                await this.set('pickingTypeId', (await this.env.items('stock.picking.type').search([
                    ['code', '=', 'mrpOperation'],
                    ['warehouseId.companyId', '=', company.id],
                ], { limit: 1 })).id);
            }
        }
    }

    /**
     * Finds UoM of changed product.
     */
    @api.onchange('productId', 'pickingTypeId', 'companyId')
    async _onchangeProductId() {
        const [product, bom] = await this('productId', 'bomId');
        if (!product.ok) {
            await this.set('bomId', false);
        }
        else if (!bom.ok || (await bom.productTemplateId).ne(await this['productTemplateId']) || (bool(await bom.productId) && (await bom.productId).ne(product))) {
            const pickingTypeId = this._context['default_pickingTypeId'];
            const pickingType = pickingTypeId && this.env.items('stock.picking.type').browse(pickingTypeId);
            const boms = (await this.env.items('mrp.bom')._bomFind(product, { pickingType: pickingType, companyId: (await this['companyId']).id, bomType: 'normal' })).get(product);
            if (bool(boms)) {
                await this.set('bomId', boms.id);
                await this.set('productQty', await (await this['bomId']).productQty);
                await this.set('productUomId', (await (await this['bomId']).productUomId).id);
            }
            else {
                await this.set('bomId', false);
                await this.set('productUomId', (await product.uomId).id);
            }
        }
    }

    @api.onchange('productQty', 'productUomId')
    async _onchangeProductQty() {
        for (const workorder of await this['workorderIds']) {
            await workorder.set('productUomId', await this['productUomId']);
            if (await this._origin.productQty) {
                await workorder.set('durationExpected', await workorder._getDurationExpected({ ratio: await this['productQty'] / await this._origin.productQty }));
            }
            else {
                await workorder.set('durationExpected', await workorder._getDurationExpected());
            }
            if (await workorder.datePlannedStart && await workorder.durationExpected) {
                await workorder.set('datePlannedFinished', addDate(await workorder.datePlannedStart, { minutes: await workorder.durationExpected }));
            }
        }
    }

    @api.onchange('bomId')
    async _onchangeBomId() {
        if (!bool(await this['productId']) && bool(await this['bomId'])) {
            const product = await (await this['bomId']).productId;
            await this.set('productId', product.ok ? product : (await (await (await this['bomId']).productTemplateId).productVariantIds).slcie(0, 1));
        }
        await this.set('productQty', await (await this['bomId']).productQty || 1.0);
        await this.set('productUomId', bool(await this['bomId']) && (await (await this['bomId']).productUomId).id || (await (await this['productId']).uomId).id);
        await this.set('moveRawIds', await (await (await this['moveRawIds']).filtered(async (m) => bool(await m.bomLineId))).map(move => [2, move.id]));
        await this.set('moveFinishedIds', await (await this['moveFinishedIds']).map(move => [2, move.id]));
        const pickingTypeId = this._context['default_pickingTypeId'];
        let pickingType = pickingTypeId && this.env.items('stock.picking.type').browse(pickingTypeId);
        pickingType = pickingType ? pickingType : await (await this['bomId']).pickingTypeId;
        pickingType = pickingType ? pickingType : await this['pickingTypeId'];
        await this.set('pickingTypeId', pickingType);
    }

    @api.onchange('datePlannedStart', 'productId')
    async _onchangeDatePlannedStart() {
        if (await this['datePlannedStart'] && ! await this['isPlanned']) {
            let datePlannedFinished = addDate(await this['datePlannedStart'], { days: await (await this['productId']).produceDelay });
            datePlannedFinished = addDate(datePlannedFinished, { days: await (await this['companyId']).manufacturingLead });
            if (datePlannedFinished == await this['datePlannedStart']) {
                datePlannedFinished = addDate(datePlannedFinished, { hours: 1 });
            }
            await this.set('datePlannedFinished', datePlannedFinished);
            await this.set('moveRawIds', await (await this['moveRawIds']).map(async (m) => [1, m.id, { 'date': await this['datePlannedStart'] }]));
            await this.set('moveFinishedIds', await (await this['moveFinishedIds']).map(async (m) => [1, m.id, { 'date': datePlannedFinished }]));
        }
    }

    @api.onchange('bomId', 'productId', 'productQty', 'productUomId')
    async _onchangeMoveRaw() {
        if (!bool(await this['bomId']) && !bool(await this._origin.productId)) {
            return;
        }
        // Clear move raws if we are changing the product. In case of creation (this._origin is empty),
        // we need to avoid keeping incorrect lines, so clearing is necessary too.
        if ((await this['productId']).ne(await this._origin.productId)) {
            await this.set('moveRawIds', [[5,]]);
        }
        if (bool(await this['bomId']) && bool(await this['productId']) && await this['productQty'] > 0) {
            // keep manual entries
            let listMoveRaw = await (await (await this['moveRawIds']).filtered(async (move) => !bool(await move.bomLineId))).map(move => [4, move.id]);
            const movesRawValues = await this._getMovesRawValues();
            const moveRawDict = Object.fromEntries(await (await (await this['moveRawIds']).filtered(async (move) => bool(await move.bomLineId))).map(async (move) => [(await move.bomLineId).id, move]));
            for (const moveRawValues of movesRawValues) {
                if (moveRawValues['bomLineId'] in moveRawDict) {
                    // update existing entries
                    listMoveRaw = listMoveRaw.concat([[1, moveRawDict[moveRawValues['bomLineId']].id, moveRawValues]]);
                }
                else {
                    // add new entries
                    listMoveRaw = listMoveRaw.concat([[0, 0, moveRawValues]]);
                }
            }
            await this.set('moveRawIds', listMoveRaw);
        }
        else {
            await this.set('moveRawIds', await (await (await this['moveRawIds']).filtered(async (move) => bool(await move.bomLineId))).map(move => [2, move.id]));
        }
    }

    @api.onchange('productId')
    async _onchangeMoveFinishedProduct() {
        await this.set('moveFinishedIds', [[5,]]);
        if (bool(await this['productId'])) {
            await this._createUpdateMoveFinished();
        }
    }

    @api.onchange('bomId', 'productQty', 'productUomId')
    async _onchangeMoveFinished() {
        if (bool(await this['productId']) && await this['productQty'] > 0) {
            await this._createUpdateMoveFinished();
        }
        else {
            await this.set('moveFinishedIds', await (await (await this['moveFinishedIds']).filtered(async (m) => bool(await m.bomLineId))).map(move => [2, move.id]));
        }
    }

    @api.onchange('locationSrcId', 'moveRawIds', 'bomId')
    async _onchangeLocation() {
        const sourceLocation = await this['locationSrcId'];
        await (await this['moveRawIds']).update({
            'warehouseId': (await sourceLocation.warehouseId).id,
            'locationId': sourceLocation.id,
        });
    }

    @api.onchange('locationDestId', 'moveFinishedIds', 'bomId')
    async _onchangeLocationDest() {
        const destinationLocation = await this['locationDestId'];
        let updateValueList = [];
        for (const move of await this['moveFinishedIds']) {
            updateValueList = updateValueList.concat([[1, move.id, [{
                'warehouseId': (await destinationLocation.warehouseId).id,
                'locationDestId': destinationLocation.id,
            }]]]);
        }
        await this.set('moveFinishedIds', updateValueList);
    }

    @api.onchange('pickingTypeId')
    async _onchangePickingType() {
        const [pickingType, company] = await this('pickingTypeId', 'companyId');
        let fallbackLoc;
        if (!bool(await pickingType.defaultLocationSrcId) || !(await pickingType.defaultLocationDestId).id) {
            const companyId = company.ok && (await this.env.companies()).includes(company) ? company.id : (await this.env.company()).id;
            fallbackLoc = await (await this.env.items('stock.warehouse').search([['companyId', '=', companyId]], { limit: 1 })).lotStockId;
        }
        await this.set('locationSrcId', (await pickingType.defaultLocationSrcId).id || fallbackLoc.id);
        await this.set('locationDestId', (await pickingType.defaultLocationDestId).id || fallbackLoc.id);
    }

    @api.onchange('qtyProducing', 'lotProducingId')
    async _onchangeProducing() {
        await this._setQtyProducing();
    }

    @api.onchange('lotProducingId')
    async _onchangeLotProducing() {
        const res = await this._canProduceSerialNumber();
        if (res != true) {
            return res;
        }
    }

    async _canProduceSerialNumber(sn?: any) {
        this.ensureOne();
        sn = bool(sn) ? sn : await this['lotProducingId'];
        if (await (await this['productId']).tracking == 'serial' && bool(sn)) {
            const [message,] = await this.env.items('stock.quant')._checkSerialNumber(await this['productId'], sn, await this['companyId']);
            if (message) {
                return { 'warning': { 'title': await this._t('Warning'), 'message': message } };
            }
        }
        return true;
    }

    @api.onchange('bomId', 'productId')
    async _onchangeWorkorderIds() {
        if (bool(await this['bomId']) && bool(await this['productId'])) {
            await this._createWorkorder();
        }
        else {
            await this.set('workorderIds', false);
        }
    }

    @api.constrains('moveFinishedIds')
    async _checkByproducts() {
        for (const order of this) {
            const moveByproductIds = await order.moveByproductIds;
            if (await moveByproductIds.some(async (move) => await move.acostShare < 0)) {
                throw new ValidationError(await this._t("By-products cost shares must be positive."));
            }
            if (sum(await moveByproductIds.mapped('costShare')) > 100) {
                throw new ValidationError(await this._t("The total cost share for a manufacturing order's by-products cannot exceed 100."));
            }
        }
    }

    @api.constrains('productId', 'moveRawIds')
    async _checkProductionLines() {
        for (const production of this) {
            const product = await production.productId;
            for (const move of await production.moveRawIds) {
                if (product.eq(await move.productId)) {
                    throw new ValidationError(await this._t("The component %s should not be the same as the product to produce.", await product.displayName));
                }
            }
        }
    }

    async write(vals) {
        if ('moveByproductIds' in vals && !('moveFinishedIds' in vals)) {
            vals['moveFinishedIds'] = vals['moveByproductIds'];
            delete vals['moveByproductIds'];
        }
        let productionToReplan;
        if ('workorderIds' in this._fields) {
            productionToReplan = await this.filtered(p => p.isPlanned);
        }
        const res = await _super(MrpProduction, this).write(vals);

        for (const production of this) {
            if ('datePlannedStart' in vals && !(this.env.context['forceDate'] ?? false)) {
                if (['done', 'cancel'].includes(await production.state)) {
                    throw new UserError(await this._t('You cannot move a manufacturing order once it is cancelled or done.'));
                }
                if (await production.isPlanned) {
                    await production.buttonUnplan();
                }
            }
            const [datePlannedStart, datePlannedFinished] = await production('datePlannedStart', 'datePlannedFinished');
            if (vals['datePlannedStart']) {
                await (await production.moveRawIds).write({ 'date': datePlannedStart, 'dateDeadline': datePlannedStart });
            }
            if (vals['datePlannedFinished']) {
                await (await production.moveFinishedIds).write({ 'date': datePlannedFinished });
            }
            if (Object.keys(vals).some(field => ['moveRawIds', 'moveFinishedIds', 'workorderIds'].includes(field)) && await production.state != 'draft') {
                if (await production.state == 'done') {
                    // for some reason moves added after state = 'done' won't save groupId, reference if added in
                    // "stockMove.defaultGet()"

                    await (await (await production.moveRawIds).filtered(async (move) => await move.additional && await move.date > datePlannedStart)).write({
                        'groupId': (await production.procurementGroupId).id,
                        'reference': await production.label,
                        'date': datePlannedStart,
                        'dateDeadline': datePlannedStart
                    });
                    await (await (await production.moveFinishedIds).filtered(async (move) => await move.additional && await move.date > datePlannedFinished)).write({
                        'reference': production.name,
                        'date': datePlannedFinished,
                        'dateDeadline': await production.dateDeadline
                    });
                }
                await production._autoconfirmProduction();
                if (productionToReplan.includes(production)) {
                    await production._planWorkorders(true);
                }
            }
            if (await production.state == 'done' && ('lotProducingId' in vals || 'qtyProducing' in vals)) {
                const finishedMoveLines = await (await (await production.moveFinishedIds).filtered(
                    async (move) => (await move.productId).eq(await production.productId) && await move.state == 'done')).mapped('moveLineIds');
                if ('lotProducingId' in vals) {
                    await finishedMoveLines.write({ 'lotId': vals['lotProducingId'] });
                }
                if ('qtyProducing' in vals) {
                    await finishedMoveLines.write({ 'qtyDone': vals['qtyProducing'] });
                }
            }
            else if (!['draft', 'done', 'cancel'].includes(await production.state) && 'lotProducingId' in vals) {
                await (await (await (await production.moveFinishedIds).filtered(async (m) => (await m.productId).eq(await production.productId))).moveLineIds).write({ 'lotId': (await production.lotProducingId).id });
            }

            if (!bool(await (await production.workorderIds).operationId) && vals['datePlannedStart'] && !vals['datePlannedFinished']) {
                const newDatePlannedStart = _Datetime.toDatetime(vals['datePlannedStart']) as Date;
                if (!datePlannedFinished || newDatePlannedStart >= datePlannedFinished) {
                    await production.set('datePlannedFinished', addDate(newDatePlannedStart, { hours: 1 }));
                }
            }
        }
        return res;
    }

    @api.model()
    async create(values) {
        // Remove from `moveFinishedIds` the by-product moves and then move `moveByproductIds`
        // into `moveFinishedIds` to avoid duplicate and inconsistency.
        if (values['moveFinishedIds'] ?? false) {
            values['moveFinishedIds'] = Array.from(values['moveFinishedIds'].filter(move => (move[2]['byproductId'] ?? false) == false));
        }
        if (values['moveByproductIds'] ?? false) {
            values['moveFinishedIds'] = (values['moveFinishedIds'] ?? []).concat(values['moveByproductIds']);
            delete values['moveByproductIds'];
        }
        if (!(values['label'] ?? false) || values['label'] == await this._t('New')) {
            let pickingTypeId = values['pickingTypeId'] || await this._getDefaultPickingType();
            pickingTypeId = this.env.items('stock.picking.type').browse(pickingTypeId);
            if (bool(pickingTypeId)) {
                values['label'] = await (await pickingTypeId.sequenceId).nextById();
            }
            else {
                values['label'] = await this.env.items('ir.sequence').nextByCode('mrp.production') || await this._t('New');
            }
        }
        if (!values['procurementGroupId']) {
            const procurementGroupVals = await this._prepareProcurementGroupVals(values);
            values['procurementGroupId'] = (await this.env.items("procurement.group").create(procurementGroupVals)).id;
        }
        const production = await _super(MrpProduction, this).create(values);
        await (await production.moveRawIds).or(await production.moveFinishedIds).write({
            'groupId': (await production.procurementGroupId).id,
            'origin': await production.label
        });
        await (await production.moveRawIds).write({ 'date': await production.datePlannedStart });
        await (await production.moveFinishedIds).write({ 'date': await production.datePlannedFinished });
        // Trigger SM & WO creation when importing a file
        if ('importFile' in this.env.context) {
            await production._onchangeMoveRaw();
            await production._onchangeMoveFinished();
            await production._onchangeWorkorderIds();
        }
        return production;
    }

    @api.ondelete(false)
    async _unlinkExceptDone() {
        if (await this.some(async (production) => await production.state == 'done')) {
            throw new UserError(await this._t('Cannot delete a manufacturing order in done state.'));
        }
        const notCancel = await this.filtered(async (m) => await m.state != 'cancel');
        if (bool(notCancel)) {
            const productionsName = (await notCancel.map(prop => prop.displayName)).join(', ');
            throw new UserError(await this._t('%s cannot be deleted. Try to cancel them before.', productionsName));
        }
    }

    async unlink() {
        await this.actionCancel();
        const workordersToDelete = await (await this['workorderIds']).filtered(async (wo) => await wo.state != 'done');
        if (bool(workordersToDelete)) {
            await workordersToDelete.unlink();
        }
        return _super(MrpProduction, this).unlink();
    }

    async copyData(defaultValue: {} = {}) {
        // covers at least 2 cases: backorders generation (follow default logic for moves copying)
        // and copying a done MO via the form (i.e. copy only the non-cancelled moves since no backorder = cancelled finished moves)
        if (!bool(defaultValue) || !('moveFinishedIds' in defaultValue)) {
            let moveFinishedIds = await this['moveFinishedIds'];
            if (await this['state'] != 'cancel') {
                moveFinishedIds = await (await this['moveFinishedIds']).filtered(async (m) => await m.state != 'cancel' && await m.productQty != 0.0);
            }
            defaultValue['moveFinishedIds'] = await moveFinishedIds.map(async (move) => [0, 0, (await move.copyData())[0]]);
        }
        if (!bool(defaultValue) || !('moveRawIds' in defaultValue)) {
            defaultValue['moveRawIds'] = await (await (await this['moveRawIds']).filtered(async (m) => await m.productQty != 0.0)).map(async (m) => [0, 0, (await m.copyData())[0]]);
        }
        return _super(MrpProduction, this).copyData(defaultValue);
    }

    async actionToggleIsLocked() {
        this.ensureOne();
        await this.set('isLocked', ! await this['isLocked']);
        return true;
    }

    async actionProductForecastReport() {
        this.ensureOne();
        const product = await this['productId'];
        const action = await product.actionProductForecastReport();
        action['context'] = {
            'activeId': product.id,
            'activeModel': 'product.product',
            'moveToMatchIds': (await (await this['moveFinishedIds']).filtered(async (m) => (await m.productId).eq(product))).ids
        }
        const warehouse = await (await this['pickingTypeId']).warehouseId;
        if (bool(warehouse)) {
            action['context']['warehouse'] = warehouse.id;
        }
        return action;
    }

    async _createWorkorder() {
        for (const production of this) {
            const [bomId, productId] = await production('bomId', 'productId');
            if (!bool(bomId) || !bool(productId)) {
                continue;
            }
            let workordersValues = [];

            const productQty = await (await production.productUomId)._computeQuantity(await production.productQty, await bomId.productUomId);
            const [explodedBoms,] = await bomId.explode(productId, productQty / await bomId.productQty, { pickingType: await bomId.pickingTypeId });

            for (const [bom, bomData] of explodedBoms) {
                const operationIds = await bom.operationIds;
                // If the operations of the parent BoM and phantom BoM are the same, don't recreate work orders.
                if (!(bool(operationIds) && (!bool(bomData['parentLine']) || (await (await bomData['parentLine'].bomId).operationIds).ne(operationIds)))) {
                    continue;
                }
                for (const operation of operationIds) {
                    if (await operation._skipOperationLine(bomData['product'])) {
                        continue;
                    }
                    workordersValues = workordersValues.concat([{
                        'label': await operation.label,
                        'productionId': production.id,
                        'workcenterId': (await operation.workcenterId).id,
                        'productUomId': (await production.productUomId).id,
                        'operationId': operation.id,
                        'state': 'pending',
                    }]);
                }
            }
            await production.set('workorderIds', [[5, 0]].concat(workordersValues.map(value => [0, 0, value])));
            for (const workorder of await production.workorderIds) {
                await workorder.set('durationExpected', await workorder._getDurationExpected());
            }
        }
    }

    async _getMoveFinishedValues(productId, productUomQty, productUom, operationId: any = false, byproductId: any = false, costShare = 0) {
        const groupOrders = await (await this['procurementGroupId']).mrpProductionIds;
        let moveDestIds = await this['moveDestIds'];
        if (len(groupOrders) > 1) {
            moveDestIds = moveDestIds.or(await (await (await groupOrders[0].moveFinishedIds).filtered(async (m) => (await m.productId).eq(await this['productId']))).moveDestIds);
        }
        let datePlannedFinished = addDate(await this['datePlannedStart'], { days: await (await this['productId']).produceDelay });
        datePlannedFinished = addDate(datePlannedFinished, { days: await (await this['companyId']).manufacturingLead });
        if (datePlannedFinished == await this['datePlannedStart']) {
            datePlannedFinished = addDate(datePlannedFinished, { hours: 1 });
        }
        return {
            'productId': productId,
            'productUomQty': productUomQty,
            'productUom': productUom,
            'operationId': operationId,
            'byproductId': byproductId,
            'label': await this['label'],
            'date': datePlannedFinished,
            'dateDeadline': await this['dateDeadline'],
            'pickingTypeId': (await this['pickingTypeId']).id,
            'locationId': (await (await (await this['productId']).withCompany(await this['companyId'])).propertyStockProduction).id,
            'locationDestId': (await this['locationDestId']).id,
            'companyId': (await this['companyId']).id,
            'productionId': this.id,
            'warehouseId': (await (await this['locationDestId']).warehouseId).id,
            'origin': await this['label'],
            'groupId': (await this['procurementGroupId']).id,
            'propagateCancel': await this['propagateCancel'],
            'moveDestIds': !byproductId ? await (await this['moveDestIds']).map(x => [4, x.id]) : [],
            'costShare': costShare,
        }
    }

    async _getMovesFinishedValues() {
        const moves = [];
        for (const production of this) {
            const [product, bom] = await production('productId', 'bomId');
            if ((await (await bom.byproductIds).mapped('productId')).includes(product)) {
                throw new UserError(await this._t("You cannot have %s  as the finished product and in the Byproducts", await product.label));
            }
            moves.push(await production._getMoveFinishedValues(product.id, await production.productQty, (await production.productUomId).id));
            for (const byproduct of await bom.byproductIds) {
                if (await byproduct._skipByproductLine(product)) {
                    continue;
                }
                const productUomFactor = await (await production.productUomId)._computeQuantity(await production.productQty, await bom.productUomId);
                const qty = await byproduct.productQty * (productUomFactor / await bom.productQty);
                moves.push(await production._getMoveFinishedValues(
                    (await byproduct.productId).id, qty, (await byproduct.productUomId).id,
                    (await byproduct.operationId).id, byproduct.id, await byproduct.costShare));
            }
        }
        return moves;
    }

    /**
     * This is a helper function to support complexity of onchange logic for MOs.
        It is important that the special *2Many commands used here remain as long as function
        is used within onchanges.
     */
    async _createUpdateMoveFinished() {
        const [moveFinishedIds, productId] = await this('moveFinishedIds', 'productId');
        // keep manual entries
        let listMoveFinished = await (await moveFinishedIds.filtered(
            async (m) => !bool(await m.byproductId) && (await m.productId).ne(productId))).map(move => [4, move.id]);
        listMoveFinished = [];
        const movesFinishedValues = await this._getMovesFinishedValues();
        const movesByproductDict = Object.fromEntries(await (await moveFinishedIds.filtered(m => m.byproductId)).map(async (move) => [(await move.byproductId).id, move]));
        const moveFinished = await moveFinishedIds.filtered(async (m) => (await m.productId).eq(productId));
        for (const moveFinishedValues of movesFinishedValues) {
            if (moveFinishedValues['byproductId'] in movesByproductDict) {
                // update existing entries
                listMoveFinished = listMoveFinished.concat([[1, movesByproductDict[moveFinishedValues['byproductId']].id, moveFinishedValues]]);
            }
            else if (moveFinishedValues['productId'] == productId.id && bool(moveFinished)) {
                listMoveFinished = listMoveFinished.concat([[1, moveFinished.id, moveFinishedValues]]);
            }
            else {
                // add new entries
                listMoveFinished = listMoveFinished.concat([[0, 0, moveFinishedValues]]);
            }
        }
        await this.set('moveFinishedIds', listMoveFinished);
    }

    async _getMovesRawValues() {
        const moves = [];
        for (const production of this) {
            const bom = await production.bomId;
            if (!bom.ok) {
                continue;
            }
            const factor = await (await production.productUomId)._computeQuantity(await production.productQty, await bom.productUomId) / await bom.productQty;
            const [boms, lines] = await bom.explode(await production.productId, factor, { pickingType: await bom.pickingTypeId });
            for (const [bomLine, lineData] of lines) {
                if (bool(await bomLine.childBomId) && await (await bomLine.childBomId).type == 'phantom' ||
                    !['product', 'consu'].includes(await (await bomLine.productId).type)) {
                    continue;
                }
                const operation = (await bomLine.operationId).id || bool(lineData['parentLine']) && (await lineData['parentLine'].operationId).id;
                moves.push(await production._getMoveRawValues(
                    await bomLine.productId,
                    lineData['qty'],
                    await bomLine.productUomId,
                    operation,
                    bomLine
                ));
            }
        }
        return moves;
    }

    async _getMoveRawValues(productId, productUomQty, productUom, operationId: any = false, bomLine: any = false) {
        const [sourceLocation, label] = await this('locationSrcId', 'label');
        let origin = label;
        if (bool(await this['orderpointId']) && await this['origin']) {
            origin = (await this['origin']).replace(f('%s - ', await (await this['orderpointId']).displayName), '');
            origin = f('%s,%s', origin, label);
        }
        const data = {
            'sequence': bool(bomLine) ? await bomLine.sequence : 10,
            'label': label,
            'date': await this['datePlannedStart'],
            'dateDeadline': await this['datePlannedStart'],
            'bomLineId': bool(bomLine) ? bomLine.id : false,
            'pickingTypeId': (await this['pickingTypeId']).id,
            'productId': productId.id,
            'productUomQty': productUomQty,
            'productUom': productUom.id,
            'locationId': sourceLocation.id,
            'locationDestId': (await (await (await this['productId']).withCompany(await this['companyId'])).propertyStockProduction).id,
            'rawMaterialProductionId': this.id,
            'companyId': (await this['companyId']).id,
            'operationId': operationId,
            'priceUnit': await productId.standardPrice,
            'procureMethod': 'makeToStock',
            'origin': origin,
            'state': 'draft',
            'warehouseId': (await sourceLocation.warehouseId).id,
            'groupId': (await this['procurementGroupId']).id,
            'propagateCancel': await this['propagateCancel'],
        }
        return data;
    }

    async _setQtyProducing() {
        const [product, productUom] = await this('productId', 'productUomId');
        if (await product.tracking == 'serial') {
            const qtyProducingUom = await productUom._computeQuantity(await this['qtyProducing'], await product.uomId, { roundingMethod: 'HALF-UP' });
            if (qtyProducingUom != 1) {
                await this.set('qtyProducing', await (await product.uomId)._computeQuantity(1, productUom, { roundingMethod: 'HALF-UP' }));
            }
        }
        for (const move of (await this['moveRawIds']).or(await (await this['moveFinishedIds']).filtered(async (m) => (await m.productId).eq(product)))) {
            if (await move._shouldBypassSetQtyProducing() || !bool(await move.productUom)) {
                continue;
            }
            const newQty = floatRound((await this['qtyProducing'] - await this['qtyProduced']) * await move.unitFactor, { precisionRounding: await (await move.productUom).rounding });
            await (await (await move.moveLineIds).filtered(async (ml) => !['done', 'cancel'].includes(await ml.state))).set('qtyDone', 0);
            await move._setQuantityDone(newQty);
        }
    }

    async _updateRawMoves(factor) {
        this.ensureOne();
        const updateInfo = [];
        let movesToAssign = this.env.items('stock.move');
        for (const move of await (await this['moveRawIds']).filtered(async (m) => !['done', 'cancel'].includes(await m.state))) {
            const oldQty = await move.productUomQty;
            let newQty = floatRound(oldQty * factor, { precisionRounding: await (await move.productUom).rounding, roundingMethod: 'UP' });
            if (newQty > 0) {
                await move.write({ 'productUomQty': newQty });
                if (await move._shouldBypassReservation()
                    || await (await move.pickingTypeId).reservationMethod == 'atConfirm'
                    || (await move.reservationDate && await move.reservationDate <= _Date.today())) {
                    movesToAssign = movesToAssign.or(move);
                }
                updateInfo.push([move, oldQty, newQty]);
            }
        }
        await movesToAssign._actionAssign();
        return updateInfo;
    }

    /**
     * returns 'assigned' if enough components are reserved in order to complete
        the first operation of the bom. If not returns 'waiting'
     * @returns 
     */
    async _getReadyToProduceState() {
        this.ensureOne();
        const operations = await (await this['workorderIds']).operationId;
        let movesInFirstOperation;
        if (len(operations) == 1) {
            movesInFirstOperation = await this['moveRawIds'];
        }
        else {
            const firstOperation = operations[0];
            movesInFirstOperation = await (await this['moveRawIds']).filtered(async (move) => (await move.operationId).eq(firstOperation));
        }
        movesInFirstOperation = await movesInFirstOperation.filtered(
            async (move) => bool(await move.bomLineId) &&
                ! await (await move.bomLineId)._skipBomLine(await this['productId'])
        );

        if (await movesInFirstOperation.every(async (move) => await move.state == 'assigned')) {
            return 'assigned';
        }
        return 'confirmed';
    }

    /**
     * Automatically run `actionConfirm` on `self`.

        If the production has one of its move was added after the initial call
        to `actionConfirm`.
     * @returns 
     */
    async _autoconfirmProduction() {
        let movesToConfirm = this.env.items('stock.move');
        for (const production of this) {
            if (['done', 'cancel'].includes(await production.state)) {
                continue;
            }
            const additionalMoves = await (await production.moveRawIds).filtered(
                async (move) => await move.state == 'draft'
            );
            await additionalMoves.write({
                'groupId': (await production.procurementGroupId).id,
            });
            await additionalMoves._adjustProcureMethod();
            movesToConfirm = movesToConfirm.or(additionalMoves);
            const additionalByproducts = await (await production.moveFinishedIds).filtered(
                async (move) => await move.state == 'draft'
            );
            movesToConfirm = movesToConfirm.or(additionalByproducts);
        }
        if (bool(movesToConfirm)) {
            movesToConfirm = await movesToConfirm._actionConfirm();
            // run scheduler for moves forecasted to not have enough in stock
            await movesToConfirm._triggerScheduler();
        }

        await (await (await this['workorderIds']).filtered(async (w) => !['done', 'cancel'].includes(await w.state)))._actionConfirm();
    }

    async _getChildren() {
        this.ensureOne();
        const procurementMoves = await (await this['procurementGroupId']).stockMoveIds;
        const childMoves = await procurementMoves.moveOrigIds;
        return (await (await (await (await procurementMoves.or(childMoves).createdProductionId).procurementGroupId).mrpProductionIds).filtered(async (p) => (await p.origin).ne(await this['origin']))).sub(this);
    }

    async _getSources() {
        this.ensureOne();
        const destMoves = await (await (await this['procurementGroupId']).mrpProductionIds).moveDestIds;
        const parentMoves = await (await (await this['procurementGroupId']).stockMoveIds).moveDestIds;
        return (await (await (await destMoves.or(parentMoves).groupId).mrpProductionIds).filtered(async (p) => (await p.origin).ne(await this['origin']))).sub(this);
    }

    async actionViewMrpProductionChilds() {
        this.ensureOne();
        const mrpProductionIds = (await this._getChildren()).ids;
        const action = {
            'resModel': 'mrp.production',
            'type': 'ir.actions.actwindow',
        }
        if (len(mrpProductionIds) == 1) {
            update(action, {
                'viewMode': 'form',
                'resId': mrpProductionIds[0],
            });
        }
        else {
            update(action, {
                'label': await this._t("%s Child MO's", await this['label']),
                'domain': [['id', 'in', mrpProductionIds]],
                'viewMode': 'tree,form',
            });
        }
        return action;
    }

    async actionViewMrpProductionSources() {
        this.ensureOne();
        const mrpProductionIds = (await this._getSources()).ids;
        const action = {
            'resModel': 'mrp.production',
            'type': 'ir.actions.actwindow',
        }
        if (len(mrpProductionIds) == 1) {
            update(action, {
                'viewMode': 'form',
                'resId': mrpProductionIds[0],
            });
        }
        else {
            update(action, {
                'label': await this._t("MO Generated by %s", await this['lable']),
                'domain': [['id', 'in', mrpProductionIds]],
                'viewMode': 'tree,form',
            });
        }
        return action;
    }

    async actionViewMrpProductionBackorders() {
        const backorderIds = (await (await this['procurementGroupId']).mrpProductionIds).ids;
        return {
            'resModel': 'mrp.production',
            'type': 'ir.actions.actwindow',
            'label': await this._t("Backorder MO's"),
            'domain': [['id', 'in', backorderIds]],
            'viewMode': 'tree,form',
        }
    }

    async actionGenerateSerial() {
        this.ensureOne();
        const [product, company] = await this('productId', 'companyId');
        if (await product.tracking == 'none') {
            return;
        }
        const label = await this.env.items('stock.production.lot')._getNewSerial(company, product);
        await this.set('lotProducingId', await this.env.items('stock.production.lot').create({
            'productId': product.id,
            'companyId': company.id,
            'label': label,
        }));
        if (await product.tracking == 'serial') {
            await this._setQtyProducing();
        }
    }

    async _actionGenerateImmediateWizard() {
        const view = await this.env.ref('mrp.viewImmediateProduction');
        return {
            'label': await this._t('Immediate Production?'),
            'type': 'ir.actions.actwindow',
            'viewMode': 'form',
            'resModel': 'mrp.immediate.production',
            'views': [[view.id, 'form']],
            'viewId': view.id,
            'target': 'new',
            'context': Object.assign({}, this.env.context, { defaultMoIds: await this.map(mo => [4, mo.id]) }),
        }
    }

    async actionConfirm() {
        await this._checkCompany();
        for (const production of this) {
            if (bool(await production.bomId)) {
                await production.set('consumption', await (await production.bomId).consumption);
            }
            // In case of Serial number tracking, force the UoM to the UoM of product
            if (await production.productTracking == 'serial' && (await production.productUomId).ne(await (await production.productId).uomId)) {
                await production.write({
                    'productQty': await (await production.productUomId)._computeQuantity(await production.productQty, await (await production.productId).uomId),
                    'productUomId': await (await production.productId).uomId
                });
                for (const moveFinish of await (await production.moveFinishedIds).filtered(async (m) => (await m.productId).eq(await production.productId))) {
                    await moveFinish.write({
                        'productUomQty': await (await moveFinish.productUom)._computeQuantity(await moveFinish.productUomQty, await (await moveFinish.productId).uomId),
                        'productUom': await (await moveFinish.productId).uomId
                    });
                }
            }
            await (await production.moveRawIds)._adjustProcureMethod();
            await (await production.moveRawIds).or(await production.moveFinishedIds)._actionConfirm(false);
            await (await production.workorderIds)._actionConfirm();
        }
        // run scheduler for moves forecasted to not have enough in stock
        await (await this['moveRawIds'])._triggerScheduler();
        await (await (await this['pickingIds']).filtered(
            async (p) => !['cancel', 'done'].includes(await p.state))).actionConfirm();
        // Force confirm state only for draft production not for more advanced state like
        // 'progress' (in case of backorders with some qtyProducing)
        await (await this.filtered(async (mo) => await mo.state == 'draft')).set('state', 'confirmed');
        return true;
    }

    async actionAssign() {
        for (const production of this) {
            await (await production.moveRawIds)._actionAssign();
        }
        return true;
    }

    /**
     * Create work orders. And probably do stuff, like things.
     * @returns 
     */
    async buttonPlan() {
        const ordersToPlan = await this.filtered(async (order) => ! await order.isPlanned);
        const ordersToConfirm = await ordersToPlan.filtered(async (mo) => await mo.state == 'draft');
        await ordersToConfirm.actionConfirm();
        for (const order of ordersToPlan) {
            await order._planWorkorders();
        }
        return true;
    }

    /**
     * Plan all the production's workorders depending on the workcenters
        work schedule.
     * @param replan If it is a replan, only ready and pending workorder will be taken into account
     * @returns 
     */
    async _planWorkorders(replan = false) {
        this.ensureOne();
        let workorderIds = await this['workorderIds'];
        if (!bool(workorderIds)) {
            return;
        }
        // Schedule all work orders (new ones and those already created)
        let qtyToProduce = Math.max(await this['productQty'] - await this['qtyProduced'], 0);
        qtyToProduce = await (await this['productUomId'])._computeQuantity(qtyToProduce, await (await this['productId']).uomId);
        let startDate = dateMax(await this['datePlannedStart'], new Date());
        if (replan) {
            workorderIds = await workorderIds.filtered(async (wo) => ['pending', 'waiting', 'ready'].includes(await wo.state));
            // We plan the manufacturing order according to its `datePlannedStart`, but if
            // `datePlannedStart` is in the past, we plan it as soon as possible.
            await (await workorderIds.leaveId).unlink();
        }
        else {
            workorderIds = await workorderIds.filtered(async (wo) => ! await wo.datePlannedStart);
        }
        for (const workorder of workorderIds) {
            const workcenters = (await workorder.workcenterId).or(await (await workorder.workcenterId).alternativeWorkcenterIds);

            let bestStartDate, bestWorkcenter;
            let bestFinishedDate = _Date.max;
            let vals = {}
            for (const workcenter of workcenters) {
                // compute theoretical duration
                let durationExpected;
                if ((await workorder.workcenterId).eq(workcenter)) {
                    durationExpected = await workorder.durationExpected;
                }
                else {
                    durationExpected = await workorder._getDurationExpected(workcenter);
                }

                const [fromDate, toDate] = await workcenter._getFirstAvailableSlot(startDate, durationExpected);
                // If the workcenter is unavailable, try planning on the next one
                if (!fromDate) {
                    continue;
                }
                // Check if this workcenter is better than the previous ones
                if (toDate && toDate < bestFinishedDate) {
                    bestStartDate = fromDate;
                    bestFinishedDate = toDate;
                    bestWorkcenter = workcenter;
                    vals = {
                        'workcenterId': workcenter.id,
                        'durationExpected': durationExpected,
                    }
                }
            }

            // If none of the workcenter are available, throw new
            if (bestFinishedDate == _Date.max) {
                throw new UserError(await this._t('Impossible to plan the workorder. Please check the workcenter availabilities.'));
            }

            // Instantiate startDate for the next workorder planning
            if (bool(await workorder.nextWorkOrderId)) {
                startDate = bestFinishedDate;
            }

            // Create leave on chosen workcenter calendar
            const leave = await this.env.items('resource.calendar.leaves').create({
                'label': await workorder.displayName,
                'calendarId': (await bestWorkcenter.resourceCalendarId).id,
                'dateFrom': bestStartDate,
                'dateTo': bestFinishedDate,
                'resourceId': (await bestWorkcenter.resourceId).id,
                'timeType': 'other'
            });
            vals['leaveId'] = leave.id;
            await workorder.write(vals);
        }
        await (await this.withContext({ forceDate: true })).write({
            'datePlannedStart': await (await this['workorderIds'])[0].datePlannedStart,
            'datePlannedFinished': await (await this['workorderIds'])[-1].datePlannedFinished
        });
    }

    async buttonUnplan() {
        const workorderIds = await this['workorderIds'];
        if (await workorderIds.some(async (wo) => await wo.state == 'done')) {
            throw new UserError(await this._t("Some work orders are already done, you cannot unplan this manufacturing order."));
        }
        else if (await workorderIds.some(async (wo) => await wo.state == 'progress')) {
            throw new UserError(await this._t("Some work orders have already started, you cannot unplan this manufacturing order."));
        }

        await (await workorderIds.leaveId).unlink();
        await workorderIds.write({
            'datePlannedStart': false,
            'datePlannedFinished': false,
        });
    }

    /**
     * Compare the quantity consumed of the components, the expected quantity
        on the BoM and the consumption parameter on the order.

     * @returns list of tuples [orderId, productId, consumedQty, expectedQty] where the
            consumption isn't honored. orderId and productId are recordset of mrp.production
            and product.product respectively
     */
    async _getConsumptionIssues() {
        const issues = [];
        if ((this.env.context['skipConsumption'] ?? false) || (this.env.context['skipImmediate'] ?? false)) {
            return issues;
        }
        for (const order of this) {
            if (await order.consumption == 'flexible' || !bool(await order.bomId) || !bool(await (await order.bomId).bomLineIds)) {
                continue;
            }
            const expectedMoveValues = await order._getMovesRawValues();
            const expectedQtyByProduct = new DefaultDict(() => 0.0);// (float)
            for (const moveValues of expectedMoveValues) {
                const moveProduct = this.env.items('product.product').browse(moveValues['productId']);
                const moveUom = this.env.items('uom.uom').browse(moveValues['productUom']);
                const moveProductQty = await moveUom._computeQuantity(moveValues['productUomQty'], await moveProduct.uomId);
                expectedQtyByProduct.set(moveProduct, expectedQtyByProduct.get(moveProduct, moveProductQty * await order.qtyProducing / await order.productQty));
            }

            const doneQtyByProduct = new DefaultDict(() => 0.0);
            for (const move of await order.moveRawIds) {
                const product = await move.productId;
                const qtyDone = await (await move.productUom)._computeQuantity(await move.quantityDone, await product.uomId);
                const rounding = await (await product.uomId).rounding;
                if (!(expectedQtyByProduct.has(product) || floatIsZero(qtyDone, { precisionRounding: rounding }))) {
                    issues.push([order, product, qtyDone, 0.0]);
                    continue;
                }
                doneQtyByProduct.set(product, doneQtyByProduct.get(product) + qtyDone);
            }

            for (const [product, qtyToConsume] of expectedQtyByProduct.items()) {
                const qtyDone = doneQtyByProduct.get(product, 0.0);
                if (floatCompare(qtyToConsume, qtyDone, { precisionRounding: await (await product.uomId).rounding }) != 0) {
                    issues.push([order, product, qtyDone, qtyToConsume]);
                }
            }
        }

        return issues;
    }

    async _actionGenerateConsumptionWizard(consumptionIssues) {
        const ctx = Object.assign({}, this.env.context);
        const lines = [];
        for (const [order, productId, consumedQty, expectedQty] of consumptionIssues) {
            lines.push([0, 0, {
                'mrpProductionId': order.id,
                'productId': productId.id,
                'consumption': await order.consumption,
                'productUomId': (await productId.uomId).id,
                'productConsumedQtyUom': consumedQty,
                'productExpectedQtyUom': expectedQty
            }]);
        }
        update(ctx, {
            'default_mrpProductionIds': this.ids,
            'default_mrpConsumptionWarningLineIds': lines,
            'formViewRef': false
        });
        const action = await this.env.items("ir.actions.actions")._forXmlid("mrp.actionMrpConsumptionWarning");
        action['context'] = ctx;
        return action;
    }

    async _getQuantityProducedIssues() {
        const quantityIssues = [];
        if (this.env.context['skipBackorder'] ?? false) {
            return quantityIssues;
        }
        for (const order of this) {
            if (!floatIsZero(await order._getQuantityToBackorder(), { precisionRounding: await (await order.productUomId).rounding })) {
                quantityIssues.push(order);
            }
        }
        return quantityIssues;
    }

    async _actionGenerateBackorderWizard(quantityIssues) {
        const ctx = Object.assign({}, this.env.context);
        const lines = [];
        for (const order of quantityIssues) {
            lines.push([0, 0, {
                'mrpProductionId': order.id,
                'toBackorder': true
            }]);
        }
        update(ctx, { 'default_mrpProductionIds': this.ids, 'default_mrpProductionBackorderLineIds': lines });
        const action = await this.env.items("ir.actions.actions")._forXmlid("mrp.actionMrpProductionBackorder");
        action['context'] = ctx;
        return action;
    }

    /**
     * Cancels production order, unfinished stock moves and set procurement
        orders in exception
     * @returns 
     */
    async actionCancel() {
        await this._actionCancel();
        return true;
    }

    async _actionCancel() {
        const documentsByProduction = new MapKey();
        for (const production of this) {
            const documents = new DefaultDict(() => []);
            for (const moveRawId of await (await this['moveRawIds']).filtered(async (m) => !['done', 'cancel'].includes(m.state))) {
                const iterateKey = await this._getDocumentIterateKey(moveRawId);
                if (iterateKey) {
                    const document = await this.env.items('stock.picking')._logActivityGetDocuments(MapKey.fromEntries([[moveRawId, [await moveRawId.productUomQty, 0]]]), iterateKey, 'UP');
                    for (const [key, value] of document.items()) {
                        documents.set(key, documents.get(key).concat([value]));
                    }
                }
            }
            if (documents.size) {
                documentsByProduction.set(production, documents);
            }
            // log an activity on Parent MO if child MO is cancelled.
            const finishMoves = await (await production.moveFinishedIds).filtered(async (x) => !['done', 'cancel'].includes(await x.state));
            if (bool(finishMoves)) {
                const productUomQty = await production.productUomQty;
                await production._logDownsideManufacturedQuantity(MapKey.fromEntries(await finishMoves.map(finishMove => [finishMove, [productUomQty, 0.0]])), true);
            }
        }
        await (await (await this['workorderIds']).filtered(async (x) => !['done', 'cancel'].includes(await x.state))).actionCancel();
        const finishMoves = await (await this['moveFinishedIds']).filtered(async (x) => !['done', 'cancel'].includes(await x.state));
        const rawMoves = await (await this['moveRawIds']).filtered(async (x) => !['done', 'cancel'].includes(await x.state));

        await finishMoves.or(rawMoves)._actionCancel();
        const pickingIds = await (await this['pickingIds']).filtered(async (x) => !['done', 'cancel'].includes(await x.state));
        await pickingIds.actionCancel();

        for (const [production, documents] of documentsByProduction.items()) {
            const filteredDocuments = new MapKey();
            for (const [[parent, responsible], renderingContext] of documents.items()) {
                if (!bool(parent) || parent._name == 'stock.picking' && await parent.state == 'cancel' || parent.eq(production)) {
                    continue;
                }
                filteredDocuments.set([parent, responsible].join('@'), renderingContext);
            }
            await production._logManufactureException(filteredDocuments, true);
        }
        // In case of a flexible BOM, we don't know from the state of the moves if the MO should
        // remain in progress or done. Indeed, if all moves are done/cancel but the quantity produced
        // is lower than expected, it might mean:
        // - we have used all components but we still want to produce the quantity expected
        // - we have used all components and we won't be able to produce the last units
        //
        // However, if the user clicks on 'Cancel', it is expected that the MO is either done or
        // canceled. If the MO is still in progress at this point, it means that the move raws
        // are either all done or a mix of done / canceled => the MO should be done.
        await (await this.filtered(async (p) => !['done', 'cancel'].includes(await p.state) && await (await p.bomId).consumption == 'flexible')).write({ 'state': 'done' });

        return true;
    }

    async _getDocumentIterateKey(moveRawId) {
        return bool(await moveRawId.moveOrigIds) && 'moveOrigIds' || false;
    }

    async _calPrice(consumedMoves) {
        this.ensureOne();
        return true;
    }

    async _postInventory(cancelBackorder = false) {
        let movesToDo: any = new Set(),
            movesNotToDo = new Set();
        for (const move of await this['moveRawIds']) {
            if (await move.state == 'done') {
                movesNotToDo.add(move.id);
            }
            else if (await move.state != 'cancel') {
                movesToDo.add(move.id);
                if (await move.productQty == 0.0 && await move.quantityDone > 0) {
                    await move.set('productUomQty', await move.quantityDone);
                }
            }
        }
        await this.env.items('stock.move').browse(movesToDo)._actionDone(cancelBackorder);
        movesToDo = (await (await this['moveRawIds']).filtered(async (x) => await x.state == 'done')).sub(this.env.items('stock.move').browse(movesNotToDo));
        // Create a dict to avoid calling filtered inside for loops.
        const movesToDoByOrder = new DefaultDict(() => this.env.items('stock.move'));
        for (const [key, values] of map(await groupbyAsync(movesToDo, null, async (m) => (await m.rawMaterialProductionId).id), ([key, values]) => [key, this.env.items('stock.move').concat([...values])])) {
            movesToDoByOrder.set(key, values);
        }
        for (const order of this) {
            const finishMoves = await (await order.moveFinishedIds).filtered(async (m) => (await m.productId).eq(await order.productId) && !['done', 'cancel'].includes(await m.state));
            // the finish move can already be completed by the workorder.
            if (bool(finishMoves) && ! await finishMoves.quantityDone) {
                await finishMoves._setQuantityDone(floatRound(await order.qtyProducing - await order.qtyProduced, { precisionRounding: await (await order.productUomId).rounding, roundingMethod: 'HALF-UP' }));
                await (await finishMoves.moveLineIds).set('lotId', await order.lotProducingId);
            }
            await order._calPrice(movesToDoByOrder[order.id]);
        }
        let movesToFinish = await (await this['moveFinishedIds']).filtered(async (x) => !['done', 'cancel'].includes(await x.state));
        movesToFinish = await movesToFinish._actionDone(cancelBackorder);
        await this.actionAssign();
        for (const order of this) {
            const consumeMoveLines = await movesToDoByOrder[order.id].mapped('moveLineIds');
            await (await (await order.moveFinishedIds).moveLineIds).set('consumeLineIds', [[6, 0, consumeMoveLines.ids]]);
        }
        return true;
    }

    @api.model()
    async _getNameBackorder(name, sequence) {
        if (!sequence) {
            return name;
        }
        const seqBack = "-" + "0".repeat(SIZE_BACK_ORDER_NUMERING - 1 - parseInt(Math.log10(sequence))) + String(sequence);
        const regex = /-\d+$/;
        if (regex.test(name) && sequence > 1) {
            return name.replace(regex, seqBack);
        }
        return name + seqBack;
    }

    async _getBackorderMoVals() {
        this.ensureOne();
        const [label, procurementGroupId] = await this('label', 'procurementGroupId');
        if (!bool(procurementGroupId)) {
            // in the rare case that the procurement group has been removed somehow, create a new one
            await this.set('procurementGroupId', await this.env.items("procurement.group").create({ 'label': label }));
        }
        const nextSeq = Math.max(...await (await (await this['procurementGroupId']).mrpProductionIds).mapped("backorderSequence")) ?? 1;
        return {
            'label': await this._getNameBackorder(await this['label'], nextSeq + 1),
            'backorderSequence': nextSeq + 1,
            'procurementGroupId': (await this['procurementGroupId']).id,
            'moveRawIds': null,
            'moveFinishedIds': null,
            'productQty': await this._getQuantityToBackorder(),
            'lotProducingId': false,
            'origin': await this['origin']
        }
    }

    async _generateBackorderProductions(closeMo = true) {
        let backorders = this.env.items('mrp.production'),
            boToAssign = this.env.items('mrp.production');
        for (const production of this) {
            if (await production.backorderSequence == 0) {  // Activate backorder naming
                await production.set('backorderSequence', 1);
            }
            await production.set('label', await this._getNameBackorder(await production.label, await production.backorderSequence));
            const backorderMo = await production.copy(await production._getBackorderMoVals());
            if (closeMo) {
                await (await (await production.moveRawIds).filtered(async (m) => !['done', 'cancel'].includes(await m.state))).write({
                    'rawMaterialProductionId': backorderMo.id,
                });
                await (await (await production.moveFinishedIds).filtered(async (m) => !['done', 'cancel'].includes(await m.state))).write({
                    'productionId': backorderMo.id,
                });
            }
            else {
                const newMovesVals = [];
                for (const move of (await production.moveRawIds).or(await production.moveFinishedIds)) {
                    if (! await move.additional) {
                        let qtyToSplit = await move.productUomQty - await move.unitFactor * await production.qtyProducing;
                        qtyToSplit = await (await move.productUom)._computeQuantity(qtyToSplit, await (await move.productId).uomId, { roundingMethod: 'HALF-UP' });
                        const moveVals = await move._split(qtyToSplit);
                        if (!bool(moveVals)) {
                            continue;
                        }
                        if (bool(await move.rawMaterialProductionId)) {
                            moveVals[0]['rawMaterialProductionId'] = backorderMo.id;
                        }
                        else {
                            moveVals[0]['productionId'] = backorderMo.id;
                        }
                        newMovesVals.push(moveVals[0]);
                    }
                }
                await this.env.items('stock.move').create(newMovesVals);
            }
            backorders = backorders.or(backorderMo);
            if (await (await backorderMo.pickingTypeId).reservationMethod == 'atConfirm') {
                boToAssign = boToAssign.or(backorderMo);
            }

            // We need to adapt `durationExpected` on both the original workorders and their
            // backordered workorders. To do that, we use the original `durationExpected` and the
            // ratio of the quantity really produced and the quantity to produce.
            const ratio = await production.qtyProducing / await production.productQty;
            for (const workorder of await production.workorderIds) {
                await workorder.set('durationExpected', await workorder.durationExpected * ratio);
            }
            for (const workorder of await backorderMo.workorderIds) {
                await workorder.set('durationExpected', await workorder.durationExpected * (1 - ratio));
            }
        }

        // As we have split the moves before validating them, we need to 'remove' the excess reservation
        if (!closeMo) {
            const rawMoves = await (await this['moveRawIds']).filtered(async (m) => ! await m.additional);
            await rawMoves._doUnreserve();
            for (const sml of await rawMoves.moveLineIds) {
                let reservedQty
                try {
                    const q = await this.env.items('stock.quant')._updateReservedQuantity(await sml.productId, await sml.locationId, await sml.qtyDone, { lotId: await sml.lotId, packageId: await sml.packageId, ownerId: await sml.ownerId, strict: true });
                    reservedQty = await q.sum(x => x[1]);
                    reservedQty = await (await (await sml.productId).uomId)._computeQuantity(reservedQty, await sml.productUomId);
                } catch (e) {
                    if (isInstance(e, UserError)) {
                        reservedQty = 0;
                    }
                    else {
                        throw e;
                    }
                }
                await (await sml.withContext({ bypassReservationUpdate: true })).set('productUomQty', reservedQty);
            }
            await rawMoves._recomputeState();
        }
        await backorders.actionConfirm();
        await boToAssign.actionAssign();

        // Remove the serial move line without reserved quantity. Post inventory will assigned all the non done moves
        // So those move lines are duplicated.
        await (await (await (await backorders.moveRawIds).moveLineIds).filtered(async (ml) => await (await ml.productId).tracking == 'serial' && await ml.productQty == 0)).unlink();

        let woToCancel = this.env.items('mrp.workorder'),
            woToUpdate = this.env.items('mrp.workorder');
        for (const [oldWo, wo] of _.zip([...await this['workorderIds']], [...await backorders.workorderIds])) {
            if (await oldWo.qtyRemaining == 0) {
                woToCancel = woToCancel.add(wo);
                continue;
            }
            if (!bool(woToUpdate) || (await woToUpdate[-1].productionId).ne(await wo.productionId)) {
                woToUpdate = woToUpdate.add(wo);
            }
            await wo.set('qtyProduced', Math.max(await oldWo.qtyProduced - await oldWo.qtyProducing, 0));
            if (await wo.productTracking == 'serial') {
                await wo.set('qtyProducing', 1);
            }
            else {
                await wo.set('qtyProducing', await wo.qtyRemaining);
            }
        }
        await woToCancel.actionCancel();
        for (const wo of woToUpdate) {
            await wo.set('state', await (await wo.nextWorkOrderId).productionAvailability == 'assigned' ? 'ready' : 'waiting');
        }

        return backorders;
    }

    /**
     * Splits productions into productions smaller quantities to produce, i.e. creates
        its backorders.
     * @param amounts a dict with a production as key and a list value containing
        the amounts each production split should produce including the original production,
        e.g. {mrp.production(1,): [3, 2]} will result in mrp.production(1,) having a productQty=3
        and a new backorder with productQty=2.
     * @param cancelRemaningQty 
     * @param setConsumedQty 
     * @returns mrp.production records in order of [orig_prod_1, backorder_prod_1,
        backorder_prod_2, orig_prod_2, backorder_prod_2, etc.]
     */
    async _splitProductions(amounts: any = false, cancelRemaningQty = false, setConsumedQty = false) {
        async function _defaultAmounts(production) {
            return [await production.qtyProducing, await production._getQuantityToBackorder()];
        }

        if (!bool(amounts)) {
            amounts = new MapKey();
        }
        for (const production of this) {
            const moAmounts = amounts.get(production);
            if (!bool(moAmounts)) {
                amounts.set(production, await _defaultAmounts(production));
                continue;
            }
            const totalAmount = sum(moAmounts);
            const diff = floatCompare(await production.productQty, totalAmount, { precisionRounding: await (await production.productUomId).rounding });
            if (diff > 0 && !cancelRemaningQty) {
                amounts.get(production).push(await production.productQty - totalAmount);
            }
            else if (diff < 0 || ['done', 'cancel'].includes(await production.state)) {
                throw new UserError(await this._t("Unable to split with more than the quantity to produce."));
            }
        }

        const backorderValsList = [],
            initialQtyByProduction = new MapKey();

        // Create the backorders.
        for (const production of this) {
            initialQtyByProduction.set(production, await production.productQty);
            if (await production.backorderSequence == 0) { // Activate backorder naming
                await production.set('backorderSequence', 1);
            }
            await production.set('label', await this._getNameBackorder(await production.label, await production.backorderSequence));
            await production.set('productQty', amounts.get(production)[0]);
            const backorderVals = (await production.copyData(await production._getBackorderMoVals()))[0];
            const backorderQtys = amounts.get(production).slice(1);

            let nextSeq = Math.max(...await (await (await production.procurementGroupId).mrpProductionIds).mapped("backorderSequence")) ?? 1;

            for (const qtyToBackorder of backorderQtys) {
                nextSeq += 1;
                backorderValsList.push({
                    ...backorderVals,
                    productQty: qtyToBackorder,
                    label: await production._getNameBackorder(await production.label, nextSeq),
                    backorderSequence: nextSeq,
                    state: 'confirmed'
                });
            }
        }

        const backorders = await (await this.env.items('mrp.production').withContext({ skipConfirm: true })).create(backorderValsList);

        let index = 0;
        const productionToBackorders = new MapKey();
        const productionIds = new OrderedSet2();
        for (const production of this) {
            const numberOfBackorderCreated = len(amounts.get(production, await _defaultAmounts(production))) - 1;
            const productionBackorders = backorders.slice(index, index + numberOfBackorderCreated);
            productionToBackorders.set(production, productionBackorders);
            productionIds.update(production.ids);
            productionIds.update(productionBackorders.ids);
            index += numberOfBackorderCreated;
        }

        // Split the `stock.move` among new backorders.
        const newMovesVals = [],
            moves = [];
        for (const production of this) {
            for (const move of (await production.moveRawIds).or(await production.moveFinishedIds)) {
                if (await move.additional) {
                    continue;
                }
                const unitFactor = await move.productUomQty / initialQtyByProduction.get(production);
                const initialMoveVals = (await move.copyData(await move._getBackorderMoveVals()))[0];
                await (await move.withContext({ doNotUnreserve: true })).set('productUomQty', await production.productQty * unitFactor);

                for (const backorder of productionToBackorders.get(production)) {
                    const moveVals = {
                        ...initialMoveVals,
                        productUomQty: await backorder.productQty * unitFactor
                    };
                    if (bool(await move.rawMaterialProductionId)) {
                        moveVals['rawMaterialProductionId'] = backorder.id;
                    }
                    else {
                        moveVals['productionId'] = backorder.id;
                    }
                    newMovesVals.push(moveVals);
                    moves.push(move);
                }
            }
        }

        const backorderMoves = await this.env.items('stock.move').create(newMovesVals);
        // Split `stock.move.line`s. 2 options for this:
        // - doUnreserve -> actionAssign
        // - Split the reserved amounts manually
        // The first option would be easier to maintain since it's less code
        // However it could be slower (due to `stock.quant` update) and could
        // create inconsistencies in mass production if a new lot higher in a
        // FIFO strategy arrives between the reservation and the backorder creation
        const moveToBackorderMoves = new DefaultDict(() => this.env.items('stock.move'));
        for (const [move, backorderMove] of _.zip([...moves], [...backorderMoves])) {
            moveToBackorderMoves.set(move, moveToBackorderMoves.get(move).or(backorderMove));
        }

        const moveLinesVals = [],
            assignedMoves = new Set(),
            partiallyAssignedMoves = new Set(),
            moveLinesToUnlink = new Set();

        for (const [initialMove, backorderMoves] of moveToBackorderMoves.items()) {
            const mlByMove = [];
            const productUom = await (await initialMove.productId).uomId;
            for (const moveLine of await initialMove.moveLineIds) {
                const availableQty = await (await moveLine.productUomId)._computeQuantity(await moveLine.productUomQty, productUom);
                if (floatCompare(availableQty, 0, { precisionRounding: await (await moveLine.productUomId).rounding }) <= 0) {
                    continue;
                }
                mlByMove.push([availableQty, moveLine, (await moveLine.copyData())[0]]);
            }

            await (await (await initialMove.moveLineIds).withContext({ bypassReservationUpdate: true })).write({ 'productUomQty': 0 });
            const moves: any[] = [...initialMove.or(backorderMoves)];

            let move = bool(moves) && moves.splice(0, 1)[0];
            let moveQtyToReserve = await move.productQty;
            for (let [quantity, moveLine, mlVals] of mlByMove) {
                while (floatCompare(quantity, 0, { precisionRounding: await productUom.rounding }) > 0 && bool(move)) {
                    // Do not create `stock.move.line` if there is no initial demand on `stock.move`
                    const takenQty = Math.min(moveQtyToReserve, quantity);
                    const takenQtyUom = await productUom._computeQuantity(takenQty, await moveLine.productUomId);
                    if (move.eq(initialMove)) {
                        await (moveLine.withContext({ bypassReservationUpdate: true })).set('productUomQty', takenQtyUom);
                        if (setConsumedQty) {
                            await moveLine.set('qtyDone', takenQtyUom);
                        }
                    }
                    else if (!floatIsZero(takenQtyUom, { precisionRounding: await (await moveLine.productUomId).rounding })) {
                        const newMlVals = {
                            ...mlVals,
                            productUomQty: takenQtyUom,
                            moveId: move.id
                        }
                        if (setConsumedQty) {
                            newMlVals['qtyDone'] = takenQtyUom;
                        }
                        moveLinesVals.push(newMlVals);
                    }
                    quantity -= takenQty;
                    moveQtyToReserve -= takenQty;

                    if (floatCompare(moveQtyToReserve, 0, { precisionRounding: await (await move.productUom).rounding }) <= 0) {
                        assignedMoves.add(move.id);
                        move = bool(moves) && moves.splice(0, 1)[0];
                        moveQtyToReserve = bool(move) && await move.productQty || 0;
                    }
                }
                // Unreserve the quantity removed from initial `stock.move.line` and
                // not assigned to a move anymore. In case of a split smaller than initial
                // quantity and fully reserved
                if (quantity) {
                    await this.env.items('stock.quant')._updateReservedQuantity(
                        await moveLine.productId, await moveLine.locationId, -quantity,
                        {
                            lotId: await moveLine.lotId, 
                            packageId: await moveLine.packageId,
                            ownerId: await moveLine.ownerId, 
                            strict: true
                        });
                }
            }

            if (bool(move) && moveQtyToReserve != await move.productQty) {
                partiallyAssignedMoves.add(move.id);
            }

            ((await (await initialMove.moveLineIds).filtered(
                async (ml) => !await ml.productUomQty && !await ml.qtyDone)).ids).forEach(e => moveLinesToUnlink.add(e));
        }

        await this.env.items('stock.move').browse(assignedMoves).write({ 'state': 'assigned' });
        await this.env.items('stock.move').browse(partiallyAssignedMoves).write({ 'state': 'partiallyAvailable' });
        // Avoid triggering a useless _recomputeState
        await this.env.items('stock.move.line').browse(moveLinesToUnlink).write({ 'moveId': false });
        await this.env.items('stock.move.line').browse(moveLinesToUnlink).unlink();
        await this.env.items('stock.move.line').create(moveLinesVals);

        // We need to adapt `durationExpected` on both the original workorders and their
        // backordered workorders. To do that, we use the original `durationExpected` and the
        // ratio of the quantity produced and the quantity to produce.
        for (const production of this) {
            const initialQty = initialQtyByProduction.get(production),
                initialWorkorderRemainingQty = [],
                bo = productionToBackorders.get(production);

            // Adapt duration
            for (const workorder of await production.or(bo).workorderIds) {
                await workorder.set('durationExpected', await workorder.durationExpected * await (await workorder.productionId).productQty / initialQty);
            }

            // Adapt quantities produced
            for (const workorder of await production.workorderIds) {
                initialWorkorderRemainingQty.push(Math.max(await workorder.qtyProduced - await workorder.qtyProduction, 0));
                await workorder.set('qtyProduced', Math.min(await workorder.qtyProduced, await workorder.qtyProduction));
            }
            const workordersLen = len(await bo.workorderIds);
            for (const [index, workorder] of enumerate(await bo.workorderIds)) {
                const remainingQty = initialWorkorderRemainingQty[Math.floor(index / workordersLen)];
                if (remainingQty) {
                    await workorder.set('qtyProduced', Math.max(await workorder.qtyProduction, remainingQty));
                    initialWorkorderRemainingQty[index % workordersLen] = Math.max(remainingQty - await workorder.qtyProduced, 0);
                }
            }
        }
        await backorders._actionConfirmMoBackorders();
        return this.env.items('mrp.production').browse(productionIds);
    }

    async _actionConfirmMoBackorders() {
        await (await this['workorderIds'])._actionConfirm();
    }

    async buttonMarkDone() {
        await this._buttonMarkDoneSanityChecks();
        let self = this;
        if (!this.env.context['buttonMarkDoneProductionIds']) {
            self = await self.withContext({ buttonMarkDoneProductionIds: self.ids });
        }
        const res = await self._preButtonMarkDone();
        if (res != true) {
            return res;
        }

        let closeMo, productionsNotToBackorder, productionsToBackorder;
        if (self.env.context['moIdsToBackorder']) {
            productionsToBackorder = self.browse(self.env.context['moIdsToBackorder']);
            productionsNotToBackorder = self.sub(productionsToBackorder);
            closeMo = false;
        }
        else {
            productionsNotToBackorder = self;
            productionsToBackorder = self.env.items('mrp.production');
            closeMo = true;
        }

        await (await self['workorderIds']).buttonFinish();

        const backorders = await productionsToBackorder._generateBackorderProductions(closeMo);
        await productionsNotToBackorder._postInventory(true);
        await productionsToBackorder._postInventory(true);

        // if completed products make other confirmed/partially_available moves available, assign them
        const doneMoveFinishedIds = await (await productionsToBackorder.moveFinishedIds).or(await productionsNotToBackorder.moveFinishedIds).filtered(async (m) => await m.state == 'done');
        await doneMoveFinishedIds._triggerAssign();

        // Moves without quantity done are not posted => set them as done instead of canceling. In
        // case the user edits the MO later on and sets some consumed quantity on those, we do not
        // want the move lines to be canceled.
        await (await (productionsNotToBackorder.moveRawIds).or(await productionsNotToBackorder.moveFinishedIds).filtered(async (x) => !['done', 'cancel'].includes(await x.state))).write({
            'state': 'done',
            'productUomQty': 0.0,
        });

        for (const production of self) {
            await production.write({
                'dateFinished': new Date(),
                'productQty': await production.qtyProduced,
                'priority': '0',
                'isLocked': true,
                'state': 'done',
            });
        }

        for (const workorder of await (await self['workorderIds']).filtered(async (w) => !['done', 'cancel'].includes(await w.state))) {
            await workorder.set('durationExpected', await workorder._getDurationExpected());
        }
        if (!bool(backorders)) {
            if (self.env.context['fromWorkorder']) {
                return {
                    'type': 'ir.actions.actwindow',
                    'resModel': 'mrp.production',
                    'views': [[(await self.env.ref('mrp.mrpProductionFormView')).id, 'form']],
                    'resId': self.id,
                    'target': 'main',
                }
            }
            return true;
        }
        let context = Object.assign({}, self.env.context);
        context = Object.fromEntries(Object.entries(context).filter(([k, v]) => !k.startsWith('default_')));
        for (const [k, v] of Object.entries(context)) {
            if (k.startsWith('skip')) {
                context[k] = false;
            }
        }
        const action = {
            'resModel': 'mrp.production',
            'type': 'ir.actions.actwindow',
            'context': { ...context, moIdsToBackorder: null, buttonMarkDoneProductionIds: null }
        }
        if (len(backorders) == 1) {
            update(action, {
                'viewMode': 'form',
                'resId': backorders[0].id,
            });
        }
        else {
            update(action, {
                'label': await self._t("Backorder MO"),
                'domain': [['id', 'in', backorders.ids]],
                'viewMode': 'tree,form',
            });
        }
        return action;
    }

    async _preButtonMarkDone() {
        const productionsToImmediate = await this._checkImmediate();
        if (bool(productionsToImmediate)) {
            return productionsToImmediate._actionGenerateImmediateWizard();
        }

        for (const production of this) {
            if (floatIsZero(await production.qtyProducing, { precisionRounding: await (await production.productUomId).rounding })) {
                throw new UserError(await this._t('The quantity to produce must be positive!'));
            }
            if (bool(await production.moveRawIds) && !(await (await production.moveRawIds).mapped('quantityDone')).some(x => x)) {
                throw new UserError(await this._t("You must indicate a non-zero amount consumed for at least one of your components"));
            }
        }

        const consumptionIssues = await this._getConsumptionIssues();
        if (bool(consumptionIssues)) {
            return this._actionGenerateConsumptionWizard(consumptionIssues);
        }

        const quantityIssues = await this._getQuantityProducedIssues();
        if (bool(quantityIssues)) {
            return this._actionGenerateBackorderWizard(quantityIssues);
        }
        return true;
    }

    async _buttonMarkDoneSanityChecks() {
        await this._checkCompany();
        for (const order of this) {
            await order._checkSnUniqueness();
        }
    }

    async doUnreserve() {
        await (await (await this['moveRawIds']).filtered(async (x) => !['done', 'cancel'].includes(await x.state)))._doUnreserve();
    }

    async buttonScrap() {
        this.ensureOne();
        return {
            'label': await this._t('Scrap'),
            'viewMode': 'form',
            'resModel': 'stock.scrap',
            'viewId': (await this.env.ref('stock.stockScrapFormView2')).id,
            'type': 'ir.actions.actwindow',
            'context': {
                'default_productionId': this.id,
                'productIds': (await (await (await this['moveRawIds']).filtered(async (x) => !['done', 'cancel'].includes(await x.state))).or(await (await this['moveFinishedIds']).filtered(async (x) => await x.state == 'done')).mapped('productId')).ids,
                'default_companyId': (await this['companyId']).id
            },
            'target': 'new',
        }
    }

    async actionSeeMoveScrap() {
        this.ensureOne();
        const action = await this.env.items("ir.actions.actions")._forXmlid("stock.actionStockScrap");
        action['domain'] = [['productionId', '=', this.id]];
        action['context'] = { ...this._context, defaultOrigin: await this['label'] };
        return action;
    }

    @api.model()
    async getEmptyListHelp(help) {
        const self = await this.withContext({
            emptyListHelpDocumentName: await this._t("manufacturing order"),
        });
        return _super(MrpProduction, self).getEmptyListHelp(help);
    }

    async _logDownsideManufacturedQuantity(movesModification: MapKey, cancel = false) {
        /**
         * sort by picking and the responsible for the product the move.
         * @param move 
         * @returns 
         */
        async function _keysInSorted(move) {
            return [(await move.pickingId).id, (await (await move.productId).responsibleId).id];
        }

        /**
         * group by picking and the responsible for the product the move.
         * @param move 
         * @returns 
         */
        async function _keysInGroupby(move) {
            return [await move.pickingId, await (await move.productId).responsibleId];
        }

        const self = this;
        async function _renderNoteExceptionQuantityMo(renderingContext) {
            const values = {
                'productionOrder': self,
                'orderExceptions': renderingContext,
                'impacted_pickings': false,
                'cancel': cancel
            }
            return (await self.env.ref('mrp.exceptionOnMo'))._render(values);
        }

        let documents = await this.env.items('stock.picking')._logActivityGetDocuments(movesModification, 'moveDestIds', 'DOWN', _keysInSorted, _keysInGroupby);
        documents = await this.env.items('stock.picking')._lessQuantitiesThanExpectedAddDocuments(movesModification, documents);
        await this.env.items('stock.picking')._logActivity(_renderNoteExceptionQuantityMo, documents);
    }

    async _logManufactureException(documents, cancel = false) {
        const self = this;
        async function _renderNoteExceptionQuantityMo(renderingContext) {
            let visitedObjects: any = [],
                orderExceptions = {}
            for (const exception of renderingContext) {
                const [orderException, visited] = exception;
                update(orderExceptions, orderException);
                visitedObjects = visitedObjects.concat(visited);
            }
            visitedObjects = visitedObjects.filter(sm => sm._name == 'stock.move');
            let impactedObject = [];
            if (visitedObjects.length) {
                visitedObjects = this.env.items(visitedObjects[0]._name).concat(visitedObjects);
                visitedObjects = visitedObjects.or(await visitedObjects.mapped('moveOrigIds'));
                impactedObject = await (await visitedObjects.filtered(async (m) => !['done', 'cancel'].includes(await m.state))).mapped('pickingId');
            }
            const values = {
                'productionOrder': self,
                'orderExceptions': orderExceptions,
                'impactedObject': impactedObject,
                'cancel': cancel
            }
            return (await self.env.ref('mrp.exceptionOnMo'))._render(values);
        }

        await this.env.items('stock.picking')._logActivity(_renderNoteExceptionQuantityMo, documents);
    }

    async buttonUnbuild() {
        this.ensureOne();
        return {
            'label': await this._t('Unbuild: %s', await (await this['productId']).displayName),
            'viewMode': 'form',
            'resModel': 'mrp.unbuild',
            'viewId': (await this.env.ref('mrp.mrpUnbuildFormViewSimplified')).id,
            'type': 'ir.actions.actwindow',
            'context': {
                'default_productId': (await this['productId']).id,
                'default_moId': this.id,
                'default_companyId': (await this['companyId']).id,
                'default_locationId': (await this['locationDestId']).id,
                'default_locationDestId': (await this['locationSrcId']).id,
                'create': false, 'edit': false
            },
            'target': 'new',
        }
    }

    async actionSerialMassProduceWizard() {
        this.ensureOne();
        await this._checkCompany();
        if (await this['state'] != 'confirmed') {
            return;
        }
        if (await (await this['productId']).tracking != 'serial') {
            return;
        }
        const [, , missingComponents, multipleLotComponents] = await this._checkSerialMassProduceComponents();
        let message = "";
        if (bool(missingComponents)) {
            message += await this._t("Make sure enough quantities of these components are reserved to carry on production:\n");
            message += (await Promise.all(Array.from<any>(missingComponents as any).map(async (component) => await component.label))).join('\n');
        }
        if (bool(multipleLotComponents)) {
            if (message) {
                message += "\n";
            }
            message += await this._t("Component Lots must be unique for mass production. Please review reservation for:\n");
            message += (await Promise.all(Array.from<any>(multipleLotComponents as any).map(async (component) => await component.label))).join('\n');
        }
        if (message) {
            throw new UserError(message);
        }
        const nextSerial = await this.env.items('stock.production.lot')._getNextSerial(await this['companyId'], await this['productId']);
        const action = await this.env.items("ir.actions.actions")._forXmlid("mrp.actAssignSerialNumbersProduction");
        action['context'] = {
            'default_productionId': this.id,
            'default_expectedQty': await this['productQty'],
            'default_nextSerialNumber': nextSerial,
            'default_nextSerialCount': await this['productQty'] - await this['qtyProduced'],
        }
        return action;
    }

    @api.model()
    async _prepareProcurementGroupVals(values) {
        return { 'label': values['label'] };
    }

    async _getQuantityToBackorder() {
        this.ensureOne();
        return Math.max(await this['productQty'] - await this['qtyProducing'], 0);
    }

    /**
     * Alert the user if the serial number as already been consumed/produced
     * @returns 
     */
    async _checkSnUniqueness() {
        if (await this['productTracking'] == 'serial' && bool(await this['lotProducingId'])) {
            if (await this._isFinishedSnAlreadyProduced(await this['lotProducingId'])) {
                throw new UserError(await this._t('This serial number for product %s has already been produced', await (await this['productId']).label));
            }
        }

        for (const move of await this['moveFinishedIds']) {
            if (await move.hasTracking != 'serial' || (await move.productId).eq(await this['productId'])) {
                continue;
            }
            for (const moveLine of await move.moveLineIds) {
                if (await this._isFinishedSnAlreadyProduced(await moveLine.lotId, moveLine)) {
                    throw new UserError(_f2(await this._t('The serial number %(number)s used for byproduct %(productName)s has already been produced'), { number: await (await moveLine.lotId).label, productName: await (await moveLine.productId).label }));
                }
            }
        }

        for (const move of await this['moveRawIds']) {
            if (await move.hasTracking != 'serial') {
                continue;
            }
            for (const moveLine of await move.moveLineIds) {
                const lot = await moveLine.lotId;
                if (floatIsZero(await moveLine.qtyDone, { precisionRounding: await (await moveLine.productUomId).rounding })) {
                    continue;
                }
                let message = _f2(await this._t('The serial number %(number)s used for component %(component)s has already been consumed'), { number: await lot.label, component: await (await moveLine.productId).label });
                const coProdMoveLines = await (await this['moveRawIds']).moveLineIds;

                // Check presence of same sn in previous productions
                let duplicates = await this.env.items('stock.move.line').searchCount([
                    ['lotId', '=', lot.id],
                    ['qtyDone', '=', 1],
                    ['state', '=', 'done'],
                    ['locationDestId.usage', '=', 'production'],
                    ['productionId', '!=', false],
                ]);
                if (duplicates) {
                    // Maybe some move lines have been compensated by unbuild
                    const duplicatesReturned = await (await move.productId)._countReturnedSnProducts(lot);
                    const removed = await this.env.items('stock.move.line').searchCount([
                        ['lotId', '=', lot.id],
                        ['state', '=', 'done'],
                        ['locationDestId.scrapLocation', '=', true]
                    ]);
                    const unremoved = await this.env.items('stock.move.line').searchCount([
                        ['lotId', '=', lot.id],
                        ['state', '=', 'done'],
                        ['locationId.scrapLocation', '=', true],
                        ['locationDestId.scrapLocation', '=', false],
                    ]);
                    // Either removed or unbuild
                    if (!((duplicatesReturned || removed) && duplicates - duplicatesReturned - removed + unremoved == 0)) {
                        throw new UserError(message);
                    }
                }
                // Check presence of same sn in current production
                duplicates = (await coProdMoveLines.filtered(async (ml) => await ml.qtyDone && (await ml.lotId).eq(await moveLine.lotId))).sub(moveLine);
                if (duplicates) {
                    throw new UserError(message);
                }
            }
        }
    }

    async _isFinishedSnAlreadyProduced(lot, excludedSml?: any) {
        excludedSml = bool(excludedSml) ? excludedSml : this.env.items('stock.move.line');
        const domain = [
            ['lotId', '=', lot.id],
            ['qtyDone', '=', 1],
            ['state', '=', 'done']
        ];
        const coProdMoveLines = (await (await this['moveFinishedIds']).moveLineIds).sub(excludedSml);
        const domainUnbuild = domain.concat([
            ['productionId', '=', false],
            ['locationDestId.usage', '=', 'production']
        ]);
        // Check presence of same sn in previous productions
        let duplicates = await this.env.items('stock.move.line').searchCount(domain.concat([
            ['locationId.usage', '=', 'production']
        ]));
        if (duplicates) {
            // Maybe some move lines have been compensated by unbuild
            const duplicatesUnbuild = await this.env.items('stock.move.line').searchCount(domainUnbuild.concat([
                ['moveId.unbuildId', '!=', false]
            ]));
            const removed = await this.env.items('stock.move.line').searchCount([
                ['lotId', '=', lot.id],
                ['state', '=', 'done'],
                ['locationDestId.scrapLocation', '=', true]
            ]);
            // Either removed or unbuild
            if (!((duplicatesUnbuild || removed) && duplicates - duplicatesUnbuild - removed == 0)) {
                return true;
            }
        }
        // Check presence of same sn in current production
        duplicates = await coProdMoveLines.filtered(async (ml) => await ml.qtyDone && (await ml.lotId).eq(lot));
        return bool(duplicates);
    }

    async _checkImmediate() {
        let immediateProductions = this.browse();
        if (this.env.context['skipImmediate']) {
            return immediateProductions;
        }
        const pd = await this.env.items('decimal.precision').precisionGet('Product Unit of Measure');
        for (const production of this) {
            if (await (await (await (await production.moveRawIds).moveLineIds).filtered(async (m) => !['done', 'cancel'].includes(await m.state))).every(async (ml) => floatIsZero(await ml.qtyDone, { precisionDigits: pd }))
                && floatIsZero(await production.qtyProducing, { precisionDigits: pd })) {
                immediateProductions = immediateProductions.or(production);
            }
        }
        return immediateProductions;
    }

    async _checkSerialMassProduceComponents() {
        let haveSerialComponents = false,
            haveLotComponents = false,
            missingComponents = new Set(),
            multipleLotComponents = new Set();
        for (const production of this) {
            haveSerialComponents ||= await (await production.moveRawIds).some(async (move) => await (await move.productId).tracking == 'serial');
            haveLotComponents ||= await (await production.moveRawIds).some(async (move) => await (await move.productId).tracking == 'lot');
            for (const move of await production.moveRawIds) {
                if (floatCompare(await move.reservedAvailability, await move.productUomQty, { precisionRounding: await (await move.productUom).rounding }) < 0) {
                    missingComponents.add(await move.productId);
                }
            }
            const components = new MapKey();
            for (const move of await production.moveRawIds) {
                if (await (await move.productId).tracking != 'lot') {
                    continue;
                }
                const lotIds = await move.mapped('moveLineIds.lotId.id');
                if (!bool(lotIds)) {
                    continue;
                }
                const component = components.setdefault(await move.productId, new Set());
                lotIds.forEach(id => component.add(id));
            }
            for (const [p, l] of components.items()) {
                if (len(l) != 1) {
                    multipleLotComponents.add(p);
                }
            }
        }
        return [haveSerialComponents, haveLotComponents, missingComponents, multipleLotComponents];
    }

    async _generateBackorderProductionsMulti(serialNumbers, cancelRemainingQuantities = false) {
        console.warn("Method '_generateBackorderProductionsMulti()' is deprecated, use _splitProductions() instead.", 'DeprecationWarning');
        await this._splitProductions(MapKey.fromEntries([[this, _.fill(Array(len(serialNumbers)), 1)]]), cancelRemainingQuantities);
    }
}
