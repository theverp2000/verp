import { Routing } from "../../stock";
import { api, Fields } from "../../../core";
import { UserError, ValidationError } from "../../../core/helper";
import { _super, MetaModel, Model } from "../../../core/models"
import { bool, update } from "../../../core/tools";

@MetaModel.define()
class StockWarehouse extends Model {
    static _module = module;
    static _parents = 'stock.warehouse';

    static manufactureToResupply = Fields.Boolean('Manufacture to Resupply', {default: true,
        help: "When products are manufactured, they can be manufactured in this warehouse."});
    static manufacturePullId = Fields.Many2one('stock.rule', 'Manufacture Rule');
    static manufactureMtoPullId = Fields.Many2one('stock.rule', 'Manufacture MTO Rule');
    static pbmMtoPullId = Fields.Many2one('stock.rule', 'Picking Before Manufacturing MTO Rule');
    static samRuleId = Fields.Many2one('stock.rule', 'Stock After Manufacturing Rule');
    static manuTypeId = Fields.Many2one('stock.picking.type', {string: 'Manufacturing Operation Type',
        domain: "[['code', '=', 'mrpOperation'], ['companyId', '=', companyId]]", checkCompany: true});

    static pbmTypeId = Fields.Many2one('stock.picking.type', {string: 'Picking Before Manufacturing Operation Type', checkCompany: true});
    static samTypeId = Fields.Many2one('stock.picking.type', {string: 'Stock After Manufacturing Operation Type', checkCompany: true});

    static manufactureSteps = Fields.Selection([
        ['mrpOneStep', 'Manufacture (1 step)'],
        ['pbm', 'Pick components and then manufacture (2 steps)'],
        ['pbmSam', 'Pick components, manufacture and then store products (3 steps)']], {string: 'Manufacture', default: 'mrpOneStep', required: true, help: "Produce : Move the components to the production location \
        directly and start the manufacturing process.\nPick / Produce : Unload \
        the components from the Stock to Input location first, and then \
        transfer it to the Production location."});

    static pbmRouteId = Fields.Many2one('stock.location.route', {string: 'Picking Before Manufacturing Route', ondelete: 'RESTRICT'});

    static pbmLocId = Fields.Many2one('stock.location', {string: 'Picking before Manufacturing Location', checkCompany: true});
    static samLocId = Fields.Many2one('stock.location', {string: 'Stock after Manufacturing Location', checkCompany: true});

    async getRulesDict() {
        const result = await _super(StockWarehouse, this).getRulesDict();
        const productionLocationId = await this._getProductionLocation();
        for (const warehouse of this) {
            update(result[warehouse.id], {
                'mrpOneStep': [],
                'pbm': [
                    Routing(await warehouse.lotStockId, await warehouse.pbmLocId, await warehouse.pbmTypeId, 'pull'),
                    Routing(await warehouse.pbmLocId, productionLocationId, await warehouse.manuTypeId, 'pull'),
                ],
                'pbmSam': [
                    Routing(await warehouse.lotStockId, await warehouse.pbmLocId, await warehouse.pbmTypeId, 'pull'),
                    Routing(await warehouse.pbmLocId, productionLocationId, await warehouse.manuTypeId, 'pull'),
                    Routing(await warehouse.samLocId, await warehouse.lotStockId, await warehouse.samTypeId, 'push'),
                ],
            })
            update(result[warehouse.id], await warehouse._getReceiveRulesDict());
        }
        return result;
    }

    @api.model()
    async _getProductionLocation() {
        const location = await this.env.items('stock.location').search([['usage', '=', 'production'], ['companyId', '=', (await this['companyId']).id]], {limit: 1});
        if (!bool(location)) {
            throw new UserError(await this._t('Can\'t find any production location.'));
        }
        return location;
    }

    async _getRoutesValues(): Promise<any> {
        const routes = await _super(StockWarehouse, this)._getRoutesValues();
        const manufactureSteps = await this['manufactureSteps'];
        update(routes, {
            'pbmRouteId': {
                'routingKey': manufactureSteps,
                'depends': ['manufactureSteps', 'manufactureToResupply'],
                'routeUpdateValues': {
                    'label': await (this as any)._formatRoutename('', manufactureSteps),
                    'active': manufactureSteps != 'mrpOneStep',
                },
                'routeCreateValues': {
                    'productCategSelectable': true,
                    'warehouseSelectable': true,
                    'productSelectable': false,
                    'companyId': (await this['companyId']).id,
                    'sequence': 10,
                },
                'rulesValues': {
                    'active': true,
                }
            }
        })
        update(routes, await (this as any)._getReceiveRoutesValues('manufactureToResupply'));
        return routes;
    }

    async _getRouteName(routeType) {
        const names = {
            'mrpOneStep': await this._t('Manufacture (1 step)'),
            'pbm': await this._t('Pick components and then manufacture'),
            'pbmSam': await this._t('Pick components, manufacture and then store products (3 steps)'),
        }
        if (routeType in names) {
            return names[routeType];
        }
        else {
            return _super(StockWarehouse, this)._getRouteName(routeType);
        }
    }

    async _getGlobalRouteRulesValues() {
        const [manufactureSteps, company, lotStock, pbmLoc, samLoc] = await this('manufactureSteps', 'companyId', 'lotStockId', 'pbmLocId', 'samLocId');
        const rules = await _super(StockWarehouse, this)._getGlobalRouteRulesValues();
        let locationSrc = manufactureSteps == 'mrpOneStep' && lotStock;
        locationSrc = bool(locationSrc) ? locationSrc : pbmLoc;
        const productionLocation = await this._getProductionLocation();
        let locationId = manufactureSteps == 'pbmSam' && samLoc;
        locationId = bool(locationId) ? locationId : lotStock;
        update(rules, {
            'manufacturePullId': {
                'depends': ['manufactureSteps', 'manufactureToResupply'],
                'createValues': {
                    'action': 'manufacture',
                    'procureMethod': 'makeToOrder',
                    'companyId': company.id,
                    'pickingTypeId': (await this['manuTypeId']).id,
                    'routeId': (await (this as any)._findGlobalRoute('mrp.routeWarehouse0Manufacture', await this._t('Manufacture'))).id
                },
                'updateValues': {
                    'active': await this['manufactureToResupply'],
                    'label': await (this as any)._formatRulename(locationId, false, 'Production'),
                    'locationId': locationId.id,
                    'propagateCancel': manufactureSteps == 'pbmSam'
                },
            },
            'manufactureMtoPullId': {
                'depends': ['manufactureSteps', 'manufactureToResupply'],
                'createValues': {
                    'procureMethod': 'mtsElseMto',
                    'companyId': company.id,
                    'action': 'pull',
                    'auto': 'manual',
                    'routeId': (await (this as any)._findGlobalRoute('stock.routeWarehouse0Mto', await this._t('Make To Order'))).id,
                    'locationId': productionLocation.id,
                    'locationSrcId': locationSrc.id,
                    'pickingTypeId': (await this['manuTypeId']).id
                },
                'updateValues': {
                    'label': await (this as any)._formatRulename(locationSrc, productionLocation, 'MTO'),
                    'active': await this['manufactureToResupply'],
                },
            },
            'pbmMtoPullId': {
                'depends': ['manufactureSteps', 'manufactureToResupply'],
                'createValues': {
                    'procureMethod': 'makeToOrder',
                    'companyId': company.id,
                    'action': 'pull',
                    'auto': 'manual',
                    'routeId': (await (this as any)._findGlobalRoute('stock.routeWarehouse0Mto', await this._t('Make To Order'))).id,
                    'label': await (this as any)._formatRulename(lotStock, pbmLoc, 'MTO'),
                    'locationId': pbmLoc.id,
                    'locationSrcId': lotStock.id,
                    'pickingTypeId': (await this['pbmTypeId']).id
                },
                'updateValues': {
                    'active': manufactureSteps != 'mrpOneStep' && await this ['manufactureToResupply'],
                }
            },
            // The purpose to move sam rule in the manufacture route instead of
            // pbm_route_id is to avoid conflict with receipt in multiple
            // step. For example if the product is manufacture and receipt in two
            // step it would conflict in WH/Stock since product could come from
            // WH/post-prod or WH/input. We do not have this conflict with
            // manufacture route since it is set on the product.
            'samRuleId': {
                'depends': ['manufactureSteps', 'manufactureToResupply'],
                'createValues': {
                    'procureMethod': 'makeToOrder',
                    'companyId': company.id,
                    'action': 'pull',
                    'auto': 'manual',
                    'routeId': (await (this as any)._findGlobalRoute('mrp.routeWarehouse0Manufacture', await this._t('Manufacture'))).id,
                    'label': await (this as any)._formatRulename(samLoc, lotStock, false),
                    'locationId': lotStock.id,
                    'locationSrcId': samLoc.id,
                    'pickingTypeId': (await this['samTypeId']).id
                },
                'updateValues': {
                    'active': manufactureSteps == 'pbmSam' && await this['manufactureToResupply'],
                }
            }

        })
        return rules;
    }

    async _getLocationsValues(vals, code: any=false) {
        const values = await _super(StockWarehouse, this)._getLocationsValues(vals, code);
        const defValues = await this.defaultGet(['companyId', 'manufactureSteps']);
        const manufactureSteps = vals['manufactureSteps'] ?? defValues['manufactureSteps'];
        code = vals['code'] || code || '';
        code = code.replaceAll(' ', '').toUpperCase();
        const companyId = vals['companyId'] ?? defValues['companyId'];
        update(values, {
            'pbmLocId': {
                'label': await this._t('Pre-Production'),
                'active': ['pbm', 'pbmSam'].includes(manufactureSteps),
                'usage': 'internal',
                'barcode': await (this as any)._validBarcode(code + '-PREPRODUCTION', companyId)
            },
            'samLocId': {
                'label': await this._t('Post-Production'),
                'active': manufactureSteps == 'pbmSam',
                'usage': 'internal',
                'barcode': await (this as any)._validBarcode(code + '-POSTPRODUCTION', companyId)
            },
        })
        return values;
    }

    async _getSequenceValues() {
        const values = await _super(StockWarehouse, this)._getSequenceValues();
        const [label, code, company] = await this('label', 'code', 'companyId'); 
        update(values, {
            'pbmTypeId': {'label': label + ' ' + await this._t('Sequence picking before manufacturing'), 'prefix': code + '/PC/', 'padding': 5, 'companyId': company.id},
            'samTypeId': {'label': label + ' ' + await this._t('Sequence stock after manufacturing'), 'prefix': code + '/SFP/', 'padding': 5, 'companyId': company.id},
            'manuTypeId': {'label': label + ' ' + await this._t('Sequence production'), 'prefix': code + '/MO/', 'padding': 5, 'companyId': company.id},
        })
        return values;
    }

    async _getPickingTypeCreateValues(maxSequence) {
        const [data, nextSequence] = await _super(StockWarehouse, this)._getPickingTypeCreateValues(maxSequence);
        update(data, {
            'pbmTypeId': {
                'label': await this._t('Pick Components'),
                'code': 'internal',
                'useCreateLots': true,
                'useExistingLots': true,
                'defaultLocationSrcId': (await this['lotStockId']).id,
                'defaultLocationDestId': (await this['pbmLocId']).id,
                'sequence': nextSequence + 1,
                'sequenceCode': 'PC',
                'companyId': (await this['companyId']).id,
            },
            'samTypeId': {
                'label': await this._t('Store Finished Product'),
                'code': 'internal',
                'useCreateLots': true,
                'useExistingLots': true,
                'defaultLocationSrcId': (await this['samLocId']).id,
                'defaultLocationDestId': (await this['lotStockId']).id,
                'sequence': nextSequence + 3,
                'sequenceCode': 'SFP',
                'companyId': (await this['companyId']).id,
            },
            'manuTypeId': {
                'label': await this._t('Manufacturing'),
                'code': 'mrpOperation',
                'useCreateLots': true,
                'useExistingLots': true,
                'sequence': nextSequence + 2,
                'sequenceCode': 'MO',
                'companyId': (await this['companyId']).id,
            },
        })
        return [data, maxSequence + 4];
    }

    async _getPickingTypeUpdateValues() {
        const data = await _super(StockWarehouse, this)._getPickingTypeUpdateValues();
        const [manufactureToResupply, manufactureSteps, active, code] = await this('manufactureToResupply', 'manufactureSteps', 'active', 'code');
        update(data, {
            'pbmTypeId': {
                'active': manufactureToResupply && ['pbm', 'pbmSam'].includes(manufactureSteps) && active,
                'barcode': code.replaceAll(" ", "").toUpperCase() + "-PC",
            },
            'samTypeId': {
                'active': manufactureToResupply && manufactureSteps == 'pbmSam' && active,
                'barcode': code.replaceAll(" ", "").toUpperCase() + "-SFP",
            },
            'manuTypeId': {
                'active': manufactureToResupply && active,
                'defaultLocationSrcId': ['pbm', 'pbmSam'].includes(manufactureSteps) && (await this['pbmLocId']).id || (await this['lotStockId']).id,
                'defaultLocationDestId': manufactureSteps == 'pbmSam' && (await this['samLocId']).id || (await this['lotStockId']).id,
            },
        })
        return data;
    }

    async _createMissingLocations(vals) {
        await _super(StockWarehouse, this)._createMissingLocations(vals);
        for (const company of await this['companyId']) {
            const location = await this.env.items('stock.location').search([['usage', '=', 'production'], ['companyId', '=', company.id]], {limit: 1});
            if (bool(location)) {
                await company._createProductionLocation();
            }
        }
    }

    async write(vals) {
        if (['manufactureSteps', 'manufactureToResupply'].some(field => field in vals)) {
            for (const warehouse of this) {
                await warehouse._updateLocationManufacture(vals['manufactureSteps'] ?? await warehouse.manufactureSteps);
            }
        }
        return _super(StockWarehouse, this).write(vals);
    }

    async _getAllRoutes() {
        let routes = await _super(StockWarehouse, this)._getAllRoutes();
        routes = routes.or(await (await (await this.filtered(async (route) => await route.manufactureToResupply && await route.manufacturePullId && bool(await (await route.manufacturePullId).routeId))).mapped('manufacturePullId')).mapped('routeId'));
        return routes;
    }

    async _updateLocationManufacture(newManufactureStep) {
        await (await this.mapped('pbmLocId')).write({'active': newManufactureStep != 'mrpOneStep'});
        await (await this.mapped('samLocId')).write({'active': newManufactureStep == 'pbmSam'});
    }

    async _updateNameAndCode(label=false, code=false) {
        const res = await _super(StockWarehouse, this)._updateNameAndCode(label, code);
        // change the manufacture stock rule name
        for (const warehouse of this) {
            if (bool(await warehouse.manufacturePullId) && label) {
                await (await warehouse.manufacturePullId).write({'label': (await (await warehouse.manufacturePullId).label).replaceAll(await warehouse.label, label)});
            }
        }
        return res;
    }
}

@MetaModel.define()
class Orderpoint extends Model {
    static _module = module;
    static _parents = "stock.warehouse.orderpoint";

    @api.constrains('productId')
    async checkProductIsNotKit() {
        if (bool(await this.env.items('mrp.bom').search(['|', ['productId', 'in', (await this['productId']).ids],
                                            '&', ['productId', '=', false], ['productTemplateId', 'in', (await (await this['productId']).productTemplateId).ids],
                                       ['type', '=', 'phantom']], {count: true}))) {
            throw new ValidationError(await this._t("A product with a kit-type bill of materials can not have a reordering rule."));
        }
    }
}