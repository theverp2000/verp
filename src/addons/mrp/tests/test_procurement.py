# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.
from datetime import datetime, timedelta

from verp import fields
from verp.tests import Form
from verp.addons.mrp.tests.common import TestMrpCommon
from verp.exceptions import UserError


class TestProcurement(TestMrpCommon):

    def test_procurement(self):
        """This test case when create production order check procurement is create"""
        # Update BOM
        self.bom_3.bom_line_ids.filtered(lambda x: x.productId == self.product_5).unlink()
        self.bom_1.bom_line_ids.filtered(lambda x: x.productId == self.product_1).unlink()
        # Update route
        self.warehouse = self.env.ref('stock.warehouse0')
        self.warehouse.mto_pull_id.routeId.active = True
        route_manufacture = self.warehouse.manufacture_pull_id.routeId.id
        route_mto = self.warehouse.mto_pull_id.routeId.id
        self.product_4.write({'routeIds': [(6, 0, [route_manufacture, route_mto])]})

        # Create production order
        # -------------------------
        # Product6 Unit 24
        #    Product4 8 Dozen
        #    Product2 12 Unit
        # -----------------------

        production_form = Form(self.env['mrp.production'])
        production_form.productId = self.product_6
        production_form.bomId = self.bom_3
        production_form.productQty = 24
        production_form.productUomId = self.product_6.uomId
        production_product_6 = production_form.save()
        production_product_6.action_confirm()
        production_product_6.action_assign()

        # check production state is Confirmed
        self.assertEqual(production_product_6.state, 'confirmed')

        # Check procurement for product 4 created or not.
        # Check it created a purchase order

        move_raw_product4 = production_product_6.moveRawIds.filtered(lambda x: x.productId == self.product_4)
        produce_product_4 = self.env['mrp.production'].search([('productId', '=', self.product_4.id),
                                                               ('moveDestIds', '=', move_raw_product4[0].id)])
        # produce product
        self.assertEqual(produce_product_4.reservationState, 'confirmed', "Consume material not available")

        # Create production order
        # -------------------------
        # Product 4  96 Unit
        #    Product2 48 Unit
        # ---------------------
        # Update Inventory
        self.env['stock.quant'].withContext(inventory_mode=True).create({
            'productId': self.product_2.id,
            'inventoryQuantity': 48,
            'locationId': self.warehouse.lot_stock_id.id,
        }).action_apply_inventory()
        produce_product_4.action_assign()
        self.assertEqual(produce_product_4.productQty, 8, "Wrong quantity of finish product.")
        self.assertEqual(produce_product_4.productUomId, self.uom_dozen, "Wrong quantity of finish product.")
        self.assertEqual(produce_product_4.reservationState, 'assigned', "Consume material not available")

        # produce product4
        # ---------------

        mo_form = Form(produce_product_4)
        mo_form.qtyProducing = produce_product_4.productQty
        produce_product_4 = mo_form.save()
        # Check procurement and Production state for product 4.
        produce_product_4.button_mark_done()
        self.assertEqual(produce_product_4.state, 'done', 'Production order should be in state done')

        # Produce product 6
        # ------------------

        # Update Inventory
        self.env['stock.quant'].withContext(inventory_mode=True).create({
            'productId': self.product_2.id,
            'inventoryQuantity': 12,
            'locationId': self.warehouse.lot_stock_id.id,
        }).action_apply_inventory()
        production_product_6.action_assign()

        # ------------------------------------

        self.assertEqual(production_product_6.reservationState, 'assigned', "Consume material not available")
        mo_form = Form(production_product_6)
        mo_form.qtyProducing = production_product_6.productQty
        production_product_6 = mo_form.save()
        # Check procurement and Production state for product 6.
        production_product_6.button_mark_done()
        self.assertEqual(production_product_6.state, 'done', 'Production order should be in state done')
        self.assertEqual(self.product_6.qty_available, 24, 'Wrong quantity available of finished product.')

    def test_procurement_2(self):
        """Check that a manufacturing order create the right procurements when the route are set on
        a parent category of a product"""
        # find a child category id
        all_categ_id = self.env['product.category'].search([('parentId', '=', None)], limit=1)
        child_categ_id = self.env['product.category'].search([('parentId', '=', all_categ_id.id)], limit=1)

        # set the product of `self.bom_1` to this child category
        for bomLineId in self.bom_1.bom_line_ids:
            # check that no routes are defined on the product
            self.assertEqual(len(bomLineId.productId.routeIds), 0)
            # set the category of the product to a child category
            bomLineId.productId.categId = child_categ_id

        # set the MTO route to the parent category (all)
        self.warehouse = self.env.ref('stock.warehouse0')
        mto_route = self.warehouse.mto_pull_id.routeId
        mto_route.active = True
        mto_route.product_categ_selectable = True
        all_categ_id.write({'routeIds': [(6, 0, [mto_route.id])]})

        # create MO, but check it raises error as components are in make to order and not everyone has
        with self.assertRaises(UserError):
            production_form = Form(self.env['mrp.production'])
            production_form.productId = self.product_4
            production_form.productUomId = self.product_4.uomId
            production_form.productQty = 1
            production_product_4 = production_form.save()
            production_product_4.action_confirm()

    def test_procurement_3(self):
        warehouse = self.env['stock.warehouse'].search([], limit=1)
        warehouse.write({'reception_steps': 'three_steps'})
        warehouse.mto_pull_id.routeId.active = True
        self.env['stock.location']._parent_store_compute()
        warehouse.reception_route_id.rule_ids.filtered(
            lambda p: p.locationSrcId == warehouse.wh_input_stock_loc_id and
            p.locationId == warehouse.wh_qc_stock_loc_id).write({
                'procureMethod': 'makeToStock'
            })

        finished_product = self.env['product.product'].create({
            'name': 'Finished Product',
            'type': 'product',
        })
        component = self.env['product.product'].create({
            'name': 'Component',
            'type': 'product',
            'routeIds': [(4, warehouse.mto_pull_id.routeId.id)]
        })
        self.env['stock.quant']._update_available_quantity(component, warehouse.wh_input_stock_loc_id, 100)
        bom = self.env['mrp.bom'].create({
            'productId': finished_product.id,
            'productTemplateId': finished_product.productTemplateId.id,
            'productUomId': self.uom_unit.id,
            'productQty': 1.0,
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': component.id, 'productQty': 1.0})
            ]})
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = finished_product
        mo_form.bomId = bom
        mo_form.productQty = 5
        mo_form.productUomId = finished_product.uomId
        mo_form.locationSrcId = warehouse.lot_stock_id
        mo = mo_form.save()
        mo.action_confirm()
        pickings = self.env['stock.picking'].search([('productId', '=', component.id)])
        self.assertEqual(len(pickings), 2.0)
        picking_input_to_qc = pickings.filtered(lambda p: p.locationId == warehouse.wh_input_stock_loc_id)
        picking_qc_to_stock = pickings - picking_input_to_qc
        self.assertTrue(picking_input_to_qc)
        self.assertTrue(picking_qc_to_stock)
        picking_input_to_qc.action_assign()
        self.assertEqual(picking_input_to_qc.state, 'assigned')
        picking_input_to_qc.moveLineIds.write({'qtyDone': 5.0})
        picking_input_to_qc._action_done()
        picking_qc_to_stock.action_assign()
        self.assertEqual(picking_qc_to_stock.state, 'assigned')
        picking_qc_to_stock.moveLineIds.write({'qtyDone': 3.0})
        picking_qc_to_stock.withContext(skip_backorder=True, picking_ids_not_to_backorder=picking_qc_to_stock.ids).button_validate()
        self.assertEqual(picking_qc_to_stock.state, 'done')
        mo.action_assign()
        self.assertEqual(mo.moveRawIds.reserved_availability, 3.0)
        produce_form = Form(mo)
        produce_form.qtyProducing = 3.0
        mo = produce_form.save()
        self.assertEqual(mo.moveRawIds.quantityDone, 3.0)
        picking_qc_to_stock.moveLineIds.qtyDone = 5.0
        self.assertEqual(mo.moveRawIds.reserved_availability, 5.0)
        self.assertEqual(mo.moveRawIds.quantityDone, 3.0)

    def test_link_date_mo_moves(self):
        """ Check link of shedule date for manufaturing with date stock move."""

        # create a product with manufacture route
        product_1 = self.env['product.product'].create({
            'name': 'AAA',
            'routeIds': [(4, self.ref('mrp.routeWarehouse0Manufacture'))]
        })

        component_1 = self.env['product.product'].create({
            'name': 'component',
        })

        self.env['mrp.bom'].create({
            'productId': product_1.id,
            'productTemplateId': product_1.productTemplateId.id,
            'productUomId': self.uom_unit.id,
            'productQty': 1.0,
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': component_1.id, 'productQty': 1}),
            ]})

        # create a move for product_1 from stock to output and reserve to trigger the
        # rule
        move_dest = self.env['stock.move'].create({
            'name': 'move_orig',
            'productId': product_1.id,
            'productUom': self.ref('uom.productUomUnit'),
            'locationId': self.ref('stock.stock_location_stock'),
            'locationDestId': self.ref('stock.stock_location_output'),
            'productUomQty': 10,
            'procureMethod': 'make_to_order'
        })

        move_dest._action_confirm()
        mo = self.env['mrp.production'].search([
            ('productId', '=', product_1.id),
            ('state', '=', 'confirmed')
        ])

        self.assertAlmostEqual(mo.move_finished_ids.date, mo.moveRawIds.date + timedelta(hours=1), delta=timedelta(seconds=1))

        self.assertEqual(len(mo), 1, 'the manufacture order is not created')

        mo_form = Form(mo)
        self.assertEqual(mo_form.productQty, 10, 'the quantity to produce is not good relative to the move')

        mo = mo_form.save()

        # Confirming mo create finished move
        move_orig = self.env['stock.move'].search([
            ('moveDestIds', 'in', move_dest.ids)
        ], limit=1)

        self.assertEqual(len(move_orig), 1, 'the move orig is not created')
        self.assertEqual(move_orig.productQty, 10, 'the quantity to produce is not good relative to the move')

        new_sheduled_date = fields.Datetime.to_datetime(mo.datePlannedStart) + timedelta(days=5)
        mo_form = Form(mo)
        mo_form.datePlannedStart = new_sheduled_date
        mo = mo_form.save()

        self.assertAlmostEqual(mo.moveRawIds.date, mo.datePlannedStart, delta=timedelta(seconds=1))
        self.assertAlmostEqual(mo.move_finished_ids.date, mo.datePlannedFinished, delta=timedelta(seconds=1))

    def test_finished_move_cancellation(self):
        """Check state of finished move on cancellation of raw moves. """
        product_bottle = self.env['product.product'].create({
            'name': 'Plastic Bottle',
            'routeIds': [(4, self.ref('mrp.routeWarehouse0Manufacture'))]
        })

        component_mold = self.env['product.product'].create({
            'name': 'Plastic Mold',
        })

        self.env['mrp.bom'].create({
            'productId': product_bottle.id,
            'productTemplateId': product_bottle.productTemplateId.id,
            'productUomId': self.uom_unit.id,
            'productQty': 1.0,
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': component_mold.id, 'productQty': 1}),
            ]})

        move_dest = self.env['stock.move'].create({
            'name': 'move_bottle',
            'productId': product_bottle.id,
            'productUom': self.ref('uom.productUomUnit'),
            'locationId': self.ref('stock.stock_location_stock'),
            'locationDestId': self.ref('stock.stock_location_output'),
            'productUomQty': 10,
            'procureMethod': 'make_to_order',
        })

        move_dest._action_confirm()
        mo = self.env['mrp.production'].search([
            ('productId', '=', product_bottle.id),
            ('state', '=', 'confirmed')
        ])
        mo.moveRawIds[0]._action_cancel()
        self.assertEqual(mo.state, 'cancel', 'Manufacturing order should be cancelled.')
        self.assertEqual(mo.move_finished_ids[0].state, 'cancel', 'Finished move should be cancelled if mo is cancelled.')
        self.assertEqual(mo.moveDestIds[0].state, 'waiting', 'Destination move should not be cancelled if prapogation cancel is False on manufacturing rule.')

    def test_procurement_with_empty_bom(self):
        """Ensure that a procurement request using a product with an empty BoM
        will create an empty MO in draft state that can be completed afterwards.
        """
        self.warehouse = self.env.ref('stock.warehouse0')
        route_manufacture = self.warehouse.manufacture_pull_id.routeId.id
        route_mto = self.warehouse.mto_pull_id.routeId.id
        product = self.env['product.product'].create({
            'name': 'Clafoutis',
            'routeIds': [(6, 0, [route_manufacture, route_mto])]
        })
        self.env['mrp.bom'].create({
            'productId': product.id,
            'productTemplateId': product.productTemplateId.id,
            'productUomId': self.uom_unit.id,
            'productQty': 1.0,
            'type': 'normal',
        })
        move_dest = self.env['stock.move'].create({
            'name': 'Customer MTO Move',
            'productId': product.id,
            'productUom': self.ref('uom.productUomUnit'),
            'locationId': self.ref('stock.stock_location_stock'),
            'locationDestId': self.ref('stock.stock_location_output'),
            'productUomQty': 10,
            'procureMethod': 'make_to_order',
        })
        move_dest._action_confirm()

        production = self.env['mrp.production'].search([('productId', '=', product.id)])
        self.assertTrue(production)
        self.assertFalse(production.moveRawIds)
        self.assertEqual(production.state, 'draft')

        comp1 = self.env['product.product'].create({
            'name': 'egg',
        })
        move_values = production._get_move_raw_values(comp1, 40.0, self.env.ref('uom.productUomUnit'))
        self.env['stock.move'].create(move_values)

        production.action_confirm()
        produce_form = Form(production)
        produce_form.qtyProducing = production.productQty
        production = produce_form.save()
        production.button_mark_done()

        move_dest._action_assign()
        self.assertEqual(move_dest.reserved_availability, 10.0)

    def test_auto_assign(self):
        """ When auto reordering rule exists, check for when:
        1. There is not enough of a manufactured product to assign (reserve for) a picking => auto-create 1st MO
        2. There is not enough of a manufactured component to assign the created MO => auto-create 2nd MO
        3. Add an extra manufactured component (not in stock) to 1st MO => auto-create 3rd MO
        4. When 2nd MO is completed => auto-assign to 1st MO
        5. When 1st MO is completed => auto-assign to picking
        6. Additionally check that a MO that has component in stock auto-reserves when MO is confirmed (since default setting = 'at_confirm')"""

        self.warehouse = self.env.ref('stock.warehouse0')
        route_manufacture = self.warehouse.manufacture_pull_id.routeId

        product_1 = self.env['product.product'].create({
            'name': 'Cake',
            'type': 'product',
            'routeIds': [(6, 0, [route_manufacture.id])]
        })
        product_2 = self.env['product.product'].create({
            'name': 'Cake Mix',
            'type': 'product',
            'routeIds': [(6, 0, [route_manufacture.id])]
        })
        product_3 = self.env['product.product'].create({
            'name': 'Flour',
            'type': 'consu',
        })

        bom1 = self.env['mrp.bom'].create({
            'productId': product_1.id,
            'productTemplateId': product_1.productTemplateId.id,
            'productUomId': self.uom_unit.id,
            'productQty': 1,
            'consumption': 'flexible',
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': product_2.id, 'productQty': 1}),
            ]})

        self.env['mrp.bom'].create({
            'productId': product_2.id,
            'productTemplateId': product_2.productTemplateId.id,
            'productUomId': self.uom_unit.id,
            'productQty': 1,
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': product_3.id, 'productQty': 1}),
            ]})

        # extra manufactured component added to 1st MO after it is already confirmed
        product_4 = self.env['product.product'].create({
            'name': 'Flavor Enchancer',
            'type': 'product',
            'routeIds': [(6, 0, [route_manufacture.id])]
        })
        product_5 = self.env['product.product'].create({
            'name': 'MSG',
            'type': 'consu',
        })

        self.env['mrp.bom'].create({
            'productId': product_4.id,
            'productTemplateId': product_4.productTemplateId.id,
            'productUomId': self.uom_unit.id,
            'productQty': 1,
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': product_5.id, 'productQty': 1}),
            ]})

        # setup auto orderpoints (reordering rules)
        self.env['stock.warehouse.orderpoint'].create({
            'name': 'Cake RR',
            'locationId': self.warehouse.lot_stock_id.id,
            'productId': product_1.id,
            'product_min_qty': 0,
            'product_max_qty': 5,
        })

        self.env['stock.warehouse.orderpoint'].create({
            'name': 'Cake Mix RR',
            'locationId': self.warehouse.lot_stock_id.id,
            'productId': product_2.id,
            'product_min_qty': 0,
            'product_max_qty': 5,
        })

        self.env['stock.warehouse.orderpoint'].create({
            'name': 'Flavor Enchancer RR',
            'locationId': self.warehouse.lot_stock_id.id,
            'productId': product_4.id,
            'product_min_qty': 0,
            'product_max_qty': 5,
        })

        # create picking output to trigger creating MO for reordering product_1
        pick_output = self.env['stock.picking'].create({
            'name': 'Cake Delivery Order',
            'pickingTypeId': self.ref('stock.picking_type_out'),
            'locationId': self.warehouse.lot_stock_id.id,
            'locationDestId': self.ref('stock.stock_location_customers'),
            'move_lines': [(0, 0, {
                'name': '/',
                'productId': product_1.id,
                'productUom': product_1.uomId.id,
                'productUomQty': 10.00,
                'procureMethod': 'makeToStock',
                'locationId': self.warehouse.lot_stock_id.id,
                'locationDestId': self.ref('stock.stock_location_customers'),
            })],
        })
        pick_output.action_confirm()  # should trigger orderpoint to create and confirm 1st MO
        pick_output.action_assign()

        mo = self.env['mrp.production'].search([
            ('productId', '=', product_1.id),
            ('state', '=', 'confirmed')
        ])

        self.assertEqual(len(mo), 1, "Manufacture order was not automatically created")
        mo.action_assign()
        mo.is_locked = False
        self.assertEqual(mo.moveRawIds.reserved_availability, 0, "No components should be reserved yet")
        self.assertEqual(mo.productQty, 15, "Quantity to produce should be picking demand + reordering rule max qty")

        # 2nd MO for product_2 should have been created and confirmed when 1st MO for product_1 was confirmed
        mo2 = self.env['mrp.production'].search([
            ('productId', '=', product_2.id),
            ('state', '=', 'confirmed')
        ])

        self.assertEqual(len(mo2), 1, 'Second manufacture order was not created')
        self.assertEqual(mo2.productQty, 20, "Quantity to produce should be MO's 'to consume' qty + reordering rule max qty")
        mo2_form = Form(mo2)
        mo2_form.qtyProducing = 20
        mo2 = mo2_form.save()
        mo2.button_mark_done()

        self.assertEqual(mo.moveRawIds.reserved_availability, 15, "Components should have been auto-reserved")

        # add new component to 1st MO
        mo_form = Form(mo)
        with mo_form.moveRawIds.new() as line:
            line.productId = product_4
            line.productUomQty = 1
        mo_form.save()  # should trigger orderpoint to create and confirm 3rd MO

        mo3 = self.env['mrp.production'].search([
            ('productId', '=', product_4.id),
            ('state', '=', 'confirmed')
        ])

        self.assertEqual(len(mo3), 1, 'Third manufacture order for added component was not created')
        self.assertEqual(mo3.productQty, 6, "Quantity to produce should be 1 + reordering rule max qty")

        mo_form = Form(mo)
        mo.moveRawIds.quantityDone = 15
        mo_form.qtyProducing = 15
        mo = mo_form.save()
        mo.button_mark_done()

        self.assertEqual(pick_output.move_ids_without_package.reserved_availability, 10, "Completed products should have been auto-reserved in picking")

        # make sure next MO auto-reserves components now that they are in stock since
        # default reservation_method = 'at_confirm'
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = product_1
        mo_form.bomId = bom1
        mo_form.productQty = 5
        mo_form.productUomId = product_1.uomId
        mo_assign_at_confirm = mo_form.save()
        mo_assign_at_confirm.action_confirm()

        self.assertEqual(mo_assign_at_confirm.moveRawIds.reserved_availability, 5, "Components should have been auto-reserved")

    def test_check_update_qty_mto_chain(self):
        """ Simulate a mto chain with a manufacturing order. Updating the
        initial demand should also impact the initial move but not the
        linked manufacturing order.
        """
        def create_run_procurement(product, productQty, values=None):
            if not values:
                values = {
                    'warehouseId': picking_type_out.warehouseId,
                    'action': 'pull_push',
                    'groupId': procurement_group,
                }
            return self.env['procurement.group'].run([self.env['procurement.group'].Procurement(
                product, productQty, self.uom_unit, vendor.property_stock_customer,
                product.name, '/', self.env.company, values)
            ])

        picking_type_out = self.env.ref('stock.picking_type_out')
        vendor = self.env['res.partner'].create({
            'name': 'Roger'
        })
        # This needs to be tried with MTO route activated
        self.env['stock.location.route'].browse(self.ref('stock.route_warehouse0_mto')).action_unarchive()
        # Define products requested for this BoM.
        product = self.env['product.product'].create({
            'name': 'product',
            'type': 'product',
            'routeIds': [(4, self.ref('stock.route_warehouse0_mto')), (4, self.ref('mrp.routeWarehouse0Manufacture'))],
            'categId': self.env.ref('product.product_category_all').id
        })
        component = self.env['product.product'].create({
            'name': 'component',
            'type': 'product',
            'categId': self.env.ref('product.product_category_all').id
        })
        self.env['mrp.bom'].create({
            'productId': product.id,
            'productTemplateId': product.productTemplateId.id,
            'productUomId': product.uomId.id,
            'productQty': 1.0,
            'consumption': 'flexible',
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': component.id, 'productQty': 1}),
            ]
        })

        procurement_group = self.env['procurement.group'].create({
            'move_type': 'direct',
            'partner_id': vendor.id
        })
        # Create initial procurement that will generate the initial move and its picking.
        create_run_procurement(product, 10, {
            'groupId': procurement_group,
            'warehouseId': picking_type_out.warehouseId,
            'partner_id': vendor
        })
        customer_move = self.env['stock.move'].search([('groupId', '=', procurement_group.id)])
        manufacturing_order = self.env['mrp.production'].search([('productId', '=', product.id)])
        self.assertTrue(manufacturing_order, 'No manufacturing order created.')

        # Check manufacturing order data.
        self.assertEqual(manufacturing_order.productQty, 10, 'The manufacturing order qty should be the same as the move.')

        # Create procurement to decrease quantity in the initial move but not in the related MO.
        create_run_procurement(product, -5.00)
        self.assertEqual(customer_move.productUomQty, 5, 'The demand on the initial move should have been decreased when merged with the procurement.')
        self.assertEqual(manufacturing_order.productQty, 10, 'The demand on the manufacturing order should not have been decreased.')

        # Create procurement to increase quantity on the initial move and should create a new MO for the missing qty.
        create_run_procurement(product, 2.00)
        self.assertEqual(customer_move.productUomQty, 5, 'The demand on the initial move should not have been increased since it should be a new move.')
        self.assertEqual(manufacturing_order.productQty, 10, 'The demand on the initial manufacturing order should not have been increased.')
        manufacturing_orders = self.env['mrp.production'].search([('productId', '=', product.id)])
        self.assertEqual(len(manufacturing_orders), 2, 'A new MO should have been created for missing demand.')

    def test_rr_with_dependance_between_bom(self):
        self.warehouse = self.env.ref('stock.warehouse0')
        route_mto = self.warehouse.mto_pull_id.routeId
        route_mto.active = True
        route_manufacture = self.warehouse.manufacture_pull_id.routeId
        product_1 = self.env['product.product'].create({
            'name': 'Product A',
            'type': 'product',
            'routeIds': [(6, 0, [route_manufacture.id])]
        })
        product_2 = self.env['product.product'].create({
            'name': 'Product B',
            'type': 'product',
            'routeIds': [(6, 0, [route_manufacture.id, route_mto.id])]
        })
        product_3 = self.env['product.product'].create({
            'name': 'Product B',
            'type': 'product',
            'routeIds': [(6, 0, [route_manufacture.id])]
        })
        product_4 = self.env['product.product'].create({
            'name': 'Product C',
            'type': 'consu',
        })

        op1 = self.env['stock.warehouse.orderpoint'].create({
            'name': 'Product A',
            'locationId': self.warehouse.lot_stock_id.id,
            'productId': product_1.id,
            'product_min_qty': 1,
            'product_max_qty': 20,
        })

        op2 = self.env['stock.warehouse.orderpoint'].create({
            'name': 'Product B',
            'locationId': self.warehouse.lot_stock_id.id,
            'productId': product_3.id,
            'product_min_qty': 5,
            'product_max_qty': 50,
        })

        self.env['mrp.bom'].create({
            'productId': product_1.id,
            'productTemplateId': product_1.productTemplateId.id,
            'productUomId': self.uom_unit.id,
            'productQty': 1,
            'consumption': 'flexible',
            'type': 'normal',
            'bom_line_ids': [(0, 0, {'productId': product_2.id, 'productQty': 1})]
        })

        self.env['mrp.bom'].create({
            'productId': product_2.id,
            'productTemplateId': product_2.productTemplateId.id,
            'productUomId': self.uom_unit.id,
            'productQty': 1,
            'consumption': 'flexible',
            'type': 'normal',
            'bom_line_ids': [(0, 0, {'productId': product_3.id, 'productQty': 1})]
        })

        self.env['mrp.bom'].create({
            'productId': product_3.id,
            'productTemplateId': product_3.productTemplateId.id,
            'productUomId': self.uom_unit.id,
            'productQty': 1,
            'consumption': 'flexible',
            'type': 'normal',
            'bom_line_ids': [(0, 0, {'productId': product_4.id, 'productQty': 1})]
        })

        (op1 | op2)._procure_orderpoint_confirm()
        mo1 = self.env['mrp.production'].search([('productId', '=', product_1.id)])
        mo3 = self.env['mrp.production'].search([('productId', '=', product_3.id)])

        self.assertEqual(len(mo1), 1)
        self.assertEqual(len(mo3), 1)
        self.assertEqual(mo1.productQty, 20)
        self.assertEqual(mo3.productQty, 50)

    def test_several_boms_same_finished_product(self):
        """
        Suppose a product with two BoMs, each one based on a different operation type
        This test ensures that, when running the scheduler, the generated MOs are based
        on the correct BoMs
        """
        warehouse = self.env.ref('stock.warehouse0')

        stock_location01 = warehouse.lot_stock_id
        stock_location02 = stock_location01.copy()

        manu_operation01 = warehouse.manu_type_id
        manu_operation02 = manu_operation01.copy()
        with Form(manu_operation02) as form:
            form.name = 'Manufacturing 02'
            form.sequence_code = 'MO2'
            form.default_location_dest_id = stock_location02

        manu_rule01 = warehouse.manufacture_pull_id
        manu_route = manu_rule01.routeId
        manu_rule02 = manu_rule01.copy()
        with Form(manu_rule02) as form:
            form.pickingTypeId = manu_operation02
        manu_route.rule_ids = [(6, 0, (manu_rule01 + manu_rule02).ids)]

        compo01, compo02, finished = self.env['product.product'].create([{
            'name': 'compo 01',
            'type': 'consu',
        }, {
            'name': 'compo 02',
            'type': 'consu',
        }, {
            'name': 'finished',
            'type': 'product',
            'routeIds': [(6, 0, manu_route.ids)],
        }])

        bom01_form = Form(self.env['mrp.bom'])
        bom01_form.productTemplateId = finished.productTemplateId
        bom01_form.code = '01'
        bom01_form.pickingTypeId = manu_operation01
        with bom01_form.bom_line_ids.new() as line:
            line.productId = compo01
        bom01 = bom01_form.save()

        bom02_form = Form(self.env['mrp.bom'])
        bom02_form.productTemplateId = finished.productTemplateId
        bom02_form.code = '02'
        bom02_form.pickingTypeId = manu_operation02
        with bom02_form.bom_line_ids.new() as line:
            line.productId = compo02
        bom02 = bom02_form.save()

        self.env['stock.warehouse.orderpoint'].create([{
            'warehouseId': warehouse.id,
            'locationId': stock_location01.id,
            'productId': finished.id,
            'product_min_qty': 1,
            'product_max_qty': 1,
        }, {
            'warehouseId': warehouse.id,
            'locationId': stock_location02.id,
            'productId': finished.id,
            'product_min_qty': 2,
            'product_max_qty': 2,
        }])

        self.env['procurement.group'].run_scheduler()

        mos = self.env['mrp.production'].search([('productId', '=', finished.id)], order='origin')
        self.assertRecordValues(mos, [
            {'productQty': 1, 'bomId': bom01.id, 'pickingTypeId': manu_operation01.id, 'locationDestId': stock_location01.id},
            {'productQty': 2, 'bomId': bom02.id, 'pickingTypeId': manu_operation02.id, 'location_dest_id': stock_location02.id},
        ])

    def test_pbm_and_additionnal_components(self):
        """
        2-steps manufacturring.
        When adding a new component to a confirmed MO, it should add an SM in
        the PBM picking. Also, it should be possible to define the to-consume
        qty of the new line even if the MO is locked
        """
        warehouse = self.env['stock.warehouse'].search([('companyId', '=', self.env.company.id)], limit=1)
        warehouse.manufactureSteps = 'pbm'

        mo_form = Form(self.env['mrp.production'])
        mo_form.bomId = self.bom_4
        mo = mo_form.save()
        mo.action_confirm()

        if not mo.is_locked:
            mo.action_toggle_is_locked()

        with Form(mo) as mo_form:
            with mo_form.moveRawIds.new() as raw_line:
                raw_line.productId = self.product_2
                raw_line.productUomQty = 2.0

        move_vals = mo._get_move_raw_values(self.product_10, 0, self.product_2.uomId)
        mo.moveRawIds = [(0, 0, move_vals)]
        mo.moveRawIds[-1].productUomQty = 10.0

        expected_vals = [
            {'productId': self.product_1.id, 'productUomQty': 1.0},
            {'productId': self.product_2.id, 'productUomQty': 2.0},
            {'productId': self.product_10.id, 'productUomQty': 10.0},
        ]
        self.assertRecordValues(mo.moveRawIds, expected_vals)
        self.assertRecordValues(mo.pickingIds.move_lines, expected_vals)
