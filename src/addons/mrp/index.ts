export * from './models';
export * from './wizard';
export * from './report';
export * from './controller';
// export * from './populate';

import {api} from '../../core';

/**
 * Allow installing MRP in databases with large stock.move table (>1M records)
        - Creating the computed+stored field stockMove.isDone and
          stockMove.unitFactor is terribly slow with the ORM and leads to "Out of
          Memory" crashes
 * @param cr 
 */
async function _preInitMrp(cr) {
    await cr.execute(`ALTER TABLE "stockMove" ADD COLUMN "isDone" bool;`);
    await cr.execute(`UPDATE "stockMove"
                     SET "isDone"=COALESCE(state in ('done', 'cancel'), FALSE);`);
    await cr.execute(`ALTER TABLE "stockMove" ADD COLUMN "unitFactor" double precision;`);
    await cr.execute(`UPDATE "stockMove"
                     SET "unitFactor"=1;`);
}

/**
 * This hook is used to add a default manufacturePullId, manufacture
    pickingType on every warehouse. It is necessary if the mrp module is
    installed after some warehouses were already created.
 * @param cr 
 * @param registry 
 */
async function _createWarehouseData(cr, registry) {
    const env = await api.Environment.new(cr, global.SUPERUSER_ID, {});
    const warehouseIds = await env.items('stock.warehouse').search([['manufacturePullId', '=', false]]);
    await warehouseIds.write({'manufactureToResupply': true});
}

async function uninstallHook(cr, registry) {
    const env = await api.Environment.new(cr, global.SUPERUSER_ID, {});
    const warehouses = await env.items("stock.warehouse").search([]);
    const pbmRoutes = await warehouses.mapped("pbmRouteId");
    await warehouses.write({"pbmRouteId": false});
    // Fail unlink means that the route is used somewhere (e.g. routeId on stock.rule). In this case
    // we don't try to do anything.
    try {
        await env.cr.savepoint(async () => {
            await pbmRoutes.unlink();
        });
    } catch(e) {
        // pass;
    }
}