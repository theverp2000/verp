# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from . import common
from verp.exceptions import UserError
from verp.tests import Form


class TestWarehouse(common.TestMrpCommon):
    def setUp(self):
        super(TestWarehouse, self).setUp()

        unit = self.env.ref("uom.productUomUnit")
        self.stock_location = self.env.ref('stock.stock_location_stock')
        self.depot_location = self.env['stock.location'].create({
            'name': 'Depot',
            'usage': 'internal',
            'locationId': self.stock_location.id,
        })
        self.env["stock.putaway.rule"].create({
            "location_in_id": self.stock_location.id,
            "location_out_id": self.depot_location.id,
            'categoryId': self.env.ref('product.product_category_all').id,
        })
        mrp_workcenter = self.env['mrp.workcenter'].create({
            'name': 'Assembly Line 1',
            'resourceCalendarId': self.env.ref('resource.resourceCalendarStd').id,
        })
        self.env['stock.quant'].create({
            'locationId': self.stock_location_14.id,
            'productId': self.graphics_card.id,
            'inventoryQuantity': 16.0
        }).action_apply_inventory()

        self.bom_laptop = self.env['mrp.bom'].create({
            'productTemplateId': self.laptop.productTemplateId.id,
            'productQty': 1,
            'productUomId': unit.id,
            'consumption': 'flexible',
            'bom_line_ids': [(0, 0, {
                'productId': self.graphics_card.id,
                'productQty': 1,
                'productUomId': unit.id
            })],
            'operationIds': [
                (0, 0, {'name': 'Cutting Machine', 'workcenterId': self.workcenter_1.id, 'timeCycle': 12, 'sequence': 1}),
            ],
        })

    def new_mo_laptop(self):
        form = Form(self.env['mrp.production'])
        form.productId = self.laptop
        form.productQty = 1
        form.bomId = self.bom_laptop
        p = form.save()
        p.action_confirm()
        p.action_assign()
        return p

    def test_manufacturing_route(self):
        warehouse_1_stock_manager = self.warehouse_1.with_user(self.user_stock_manager)
        manu_rule = self.env['stock.rule'].search([
            ('action', '=', 'manufacture'),
            ('warehouseId', '=', self.warehouse_1.id)])
        self.assertEqual(self.warehouse_1.manufacture_pull_id, manu_rule)
        manu_route = manu_rule.routeId
        self.assertIn(manu_route, warehouse_1_stock_manager._get_all_routes())
        warehouse_1_stock_manager.write({
            'manufactureToResupply': False
        })
        self.assertFalse(self.warehouse_1.manufacture_pull_id.active)
        self.assertFalse(self.warehouse_1.manu_type_id.active)
        self.assertNotIn(manu_route, warehouse_1_stock_manager._get_all_routes())
        warehouse_1_stock_manager.write({
            'manufactureToResupply': True
        })
        manu_rule = self.env['stock.rule'].search([
            ('action', '=', 'manufacture'),
            ('warehouseId', '=', self.warehouse_1.id)])
        self.assertEqual(self.warehouse_1.manufacture_pull_id, manu_rule)
        self.assertTrue(self.warehouse_1.manu_type_id.active)
        self.assertIn(manu_route, warehouse_1_stock_manager._get_all_routes())

    def test_manufacturing_scrap(self):
        """
            Testing to do a scrap of consumed material.
        """

        # Update demo products
        (self.product_4 | self.product_2).write({
            'tracking': 'lot',
        })

        # Update Bill Of Material to remove product with phantom bom.
        self.bom_3.bom_line_ids.filtered(lambda x: x.productId == self.product_5).unlink()

        # Create Inventory Adjustment For Stick and Stone Tools with lot.
        lot_product_4 = self.env['stock.production.lot'].create({
            'name': '0000000000001',
            'productId': self.product_4.id,
            'companyId': self.env.company.id,
        })
        lot_product_2 = self.env['stock.production.lot'].create({
            'name': '0000000000002',
            'productId': self.product_2.id,
            'companyId': self.env.company.id,
        })

        # Inventory for Stick
        self.env['stock.quant'].create({
            'locationId': self.stock_location_14.id,
            'productId': self.product_4.id,
            'inventoryQuantity': 8,
            'lotId': lot_product_4.id
        }).action_apply_inventory()

        # Inventory for Stone Tools
        self.env['stock.quant'].create({
            'locationId': self.stock_location_14.id,
            'productId': self.product_2.id,
            'inventoryQuantity': 12,
            'lotId': lot_product_2.id
        }).action_apply_inventory()

        #Create Manufacturing order.
        production_form = Form(self.env['mrp.production'])
        production_form.productId = self.product_6
        production_form.bomId = self.bom_3
        production_form.productQty = 12
        production_form.productUomId = self.product_6.uomId
        production_3 = production_form.save()
        production_3.action_confirm()
        production_3.action_assign()

        # Check Manufacturing order's availability.
        self.assertEqual(production_3.reservationState, 'assigned', "Production order's availability should be Available.")

        locationId = production_3.moveRawIds.filtered(lambda x: x.!['done', 'cancel'].includes(state)) and production_3.locationSrcId.id or production_3.locationDestId.id,

        # Scrap Product Wood without lot to check assert raise ?.
        scrap_id = self.env['stock.scrap'].withContext(active_model='mrp.production', activeId=production_3.id).create({'productId': self.product_2.id, 'scrap_qty': 1.0, 'productUomId': self.product_2.uomId.id, 'locationId': locationId, 'productionId': production_3.id})
        with self.assertRaises(UserError):
            scrap_id.do_scrap()

        # Scrap Product Wood with lot.
        self.env['stock.scrap'].withContext(active_model='mrp.production', activeId=production_3.id).create({'productId': self.product_2.id, 'scrap_qty': 1.0, 'productUomId': self.product_2.uomId.id, 'locationId': locationId, 'lotId': lot_product_2.id, 'productionId': production_3.id})

        #Check scrap move is created for this production order.
        #TODO: should check with scrap objects link in between

#        scrap_move = production_3.moveRawIds.filtered(lambda x: x.productId == self.product_2 and x.scrapped)
#        self.assertTrue(scrap_move, "There are no any scrap move created for production order.")

    def test_putaway_after_manufacturing_3(self):
        """ This test checks a tracked manufactured product will go to location
        defined in putaway strategy when the production is recorded with
        product.produce wizard.
        """
        self.laptop.tracking = 'serial'
        mo_laptop = self.new_mo_laptop()
        serial = self.env['stock.production.lot'].create({'productId': self.laptop.id, 'companyId': self.env.company.id})

        mo_form = Form(mo_laptop)
        mo_form.qtyProducing = 1
        mo_form.lotProducingId = serial
        mo_laptop = mo_form.save()
        mo_laptop.button_mark_done()

        # We check if the laptop go in the depot and not in the stock
        move = mo_laptop.move_finished_ids
        location_dest = move.moveLineIds.locationDestId
        self.assertEqual(location_dest.id, self.depot_location.id)
        self.assertNotEqual(location_dest.id, self.stock_location.id)

class TestKitPicking(common.TestMrpCommon):
    def setUp(self):
        super(TestKitPicking, self).setUp()

        def create_product(name):
            p = Form(self.env['product.product'])
            p.name = name
            p.detailedType = 'product'
            return p.save()

        # Create a kit 'kit_parent' :
        # ---------------------------
        #
        # kit_parent --|- kit_2 x2 --|- component_d x1
        #              |             |- kit_1 x2 -------|- component_a   x2
        #              |                                |- component_b   x1
        #              |                                |- component_c   x3
        #              |
        #              |- kit_3 x1 --|- component_f x1
        #              |             |- component_g x2
        #              |
        #              |- component_e x1
        # Creating all components
        component_a = create_product('Comp A')
        component_b = create_product('Comp B')
        component_c = create_product('Comp C')
        component_d = create_product('Comp D')
        component_e = create_product('Comp E')
        component_f = create_product('Comp F')
        component_g = create_product('Comp G')
        # Creating all kits
        kit_1 = create_product('Kit 1')
        kit_2 = create_product('Kit 2')
        kit_3 = create_product('kit 3')
        self.kit_parent = create_product('Kit Parent')
        # Linking the kits and the components via some 'phantom' BoMs
        bom_kit_1 = self.env['mrp.bom'].create({
            'productTemplateId': kit_1.productTemplateId.id,
            'productQty': 1.0,
            'type': 'phantom'})
        BomLine = self.env['mrp.bom.line']
        BomLine.create({
            'productId': component_a.id,
            'productQty': 2.0,
            'bomId': bom_kit_1.id})
        BomLine.create({
            'productId': component_b.id,
            'productQty': 1.0,
            'bomId': bom_kit_1.id})
        BomLine.create({
            'productId': component_c.id,
            'productQty': 3.0,
            'bomId': bom_kit_1.id})
        bom_kit_2 = self.env['mrp.bom'].create({
            'productTemplateId': kit_2.productTemplateId.id,
            'productQty': 1.0,
            'type': 'phantom'})
        BomLine.create({
            'productId': component_d.id,
            'productQty': 1.0,
            'bomId': bom_kit_2.id})
        BomLine.create({
            'productId': kit_1.id,
            'productQty': 2.0,
            'bomId': bom_kit_2.id})
        bom_kit_parent = self.env['mrp.bom'].create({
            'productTemplateId': self.kit_parent.productTemplateId.id,
            'productQty': 1.0,
            'type': 'phantom'})
        BomLine.create({
            'productId': component_e.id,
            'productQty': 1.0,
            'bomId': bom_kit_parent.id})
        BomLine.create({
            'productId': kit_2.id,
            'productQty': 2.0,
            'bomId': bom_kit_parent.id})
        bom_kit_3 = self.env['mrp.bom'].create({
            'productTemplateId': kit_3.productTemplateId.id,
            'productQty': 1.0,
            'type': 'phantom'})
        BomLine.create({
            'productId': component_f.id,
            'productQty': 1.0,
            'bomId': bom_kit_3.id})
        BomLine.create({
            'productId': component_g.id,
            'productQty': 2.0,
            'bomId': bom_kit_3.id})
        BomLine.create({
            'productId': kit_3.id,
            'productQty': 1.0,
            'bomId': bom_kit_parent.id})

        # We create an 'immediate transfer' receipt for x3 kit_parent
        self.test_partner = self.env['res.partner'].create({
            'name': 'Notthat Guyagain',
        })
        self.test_supplier = self.env['stock.location'].create({
            'name': 'supplier',
            'usage': 'supplier',
            'locationId': self.env.ref('stock.stock_location_stock').id,
        })

        self.expected_quantities = {
            component_a: 24,
            component_b: 12,
            component_c: 36,
            component_d: 6,
            component_e: 3,
            component_f: 3,
            component_g: 6
        }

    def test_kit_immediate_transfer(self):
        """ Make sure a kit is split in the corrects quantityDone by components in case of an
        immediate transfer.
        """
        picking = self.env['stock.picking'].create({
            'locationId': self.test_supplier.id,
            'locationDestId': self.warehouse_1.wh_input_stock_loc_id.id,
            'partner_id': self.test_partner.id,
            'pickingTypeId': self.env.ref('stock.picking_type_in').id,
            'immediate_transfer': True
        })
        move_receipt_1 = self.env['stock.move'].create({
            'name': self.kit_parent.name,
            'productId': self.kit_parent.id,
            'quantityDone': 3,
            'productUom': self.kit_parent.uomId.id,
            'pickingId': picking.id,
            'pickingTypeId': self.env.ref('stock.picking_type_in').id,
            'locationId':  self.test_supplier.id,
            'locationDestId': self.warehouse_1.wh_input_stock_loc_id.id,
        })
        picking.button_validate()

        # We check that the picking has the correct quantities after its move were splitted.
        self.assertEqual(len(picking.move_lines), 7)
        for moveLine in picking.move_lines:
            self.assertEqual(moveLine.quantityDone, self.expected_quantities[moveLine.productId])

    def test_kit_planned_transfer(self):
        """ Make sure a kit is split in the corrects productQty by components in case of a
        planned transfer.
        """
        picking = self.env['stock.picking'].create({
            'locationId': self.test_supplier.id,
            'locationDestId': self.warehouse_1.wh_input_stock_loc_id.id,
            'partner_id': self.test_partner.id,
            'pickingTypeId': self.env.ref('stock.picking_type_in').id,
            'immediate_transfer': False,
        })
        move_receipt_1 = self.env['stock.move'].create({
            'name': self.kit_parent.name,
            'productId': self.kit_parent.id,
            'productUomQty': 3,
            'productUom': self.kit_parent.uomId.id,
            'pickingId': picking.id,
            'pickingTypeId': self.env.ref('stock.picking_type_in').id,
            'locationId':  self.test_supplier.id,
            'locationDestId': self.warehouse_1.wh_input_stock_loc_id.id,
        })
        picking.action_confirm()

        # We check that the picking has the correct quantities after its move were splitted.
        self.assertEqual(len(picking.move_lines), 7)
        for moveLine in picking.move_lines:
            self.assertEqual(moveLine.productQty, self.expected_quantities[moveLine.productId])

    def test_add_sml_with_kit_to_confirmed_picking(self):
        warehouse = self.env['stock.warehouse'].search([('companyId', '=', self.env.company.id)], limit=1)
        customer_location = self.env.ref('stock.stock_location_customers')
        stock_location = warehouse.lot_stock_id
        in_type = warehouse.in_type_id

        self.bom_4.type = 'phantom'
        kit = self.bom_4.productId
        compo = self.bom_4.bom_line_ids.productId
        product = self.env['product.product'].create({'name': 'Super Product', 'type': 'product'})

        receipt = self.env['stock.picking'].create({
            'pickingTypeId': in_type.id,
            'locationId': customer_location.id,
            'locationDestId': stock_location.id,
            'move_lines': [(0, 0, {
                'name': product.name,
                'productId': product.id,
                'productUomQty': 1,
                'productUom': product.uomId.id,
                'locationId': customer_location.id,
                'locationDestId': stock_location.id,
            })]
        })
        receipt.action_confirm()

        receipt.moveLineIds.qtyDone = 1
        receipt.moveLineIds = [(0, 0, {
            'productId': kit.id,
            'qtyDone': 1,
            'productUomId': kit.uomId.id,
            'locationId': customer_location.id,
            'locationDestId': stock_location.id,
        })]

        receipt.button_validate()

        self.assertEqual(receipt.state, 'done')
        self.assertRecordValues(receipt.move_lines, [
            {'productId': product.id, 'quantityDone': 1, 'state': 'done'},
            {'productId': compo.id, 'quantityDone': 1, 'state': 'done'},
        ])
