# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp.tests import Form
from datetime import datetime, timedelta
from freezegun import freeze_time

from verp import fields
from verp.exceptions import UserError
from verp.addons.mrp.tests.common import TestMrpCommon
from verp.tools.misc import format_date

class TestMrpOrder(TestMrpCommon):

    def test_access_rights_manager(self):
        """ Checks an MRP manager can create, confirm and cancel a manufacturing order. """
        man_order_form = Form(self.env['mrp.production'].with_user(self.user_mrp_manager))
        man_order_form.productId = self.product_4
        man_order_form.productQty = 5.0
        man_order_form.bomId = self.bom_1
        man_order_form.locationSrcId = self.location_1
        man_order_form.locationDestId = self.warehouse_1.wh_output_stock_loc_id
        man_order = man_order_form.save()
        man_order.action_confirm()
        man_order.action_cancel()
        self.assertEqual(man_order.state, 'cancel', "Production order should be in cancel state.")
        man_order.unlink()

    def test_access_rights_user(self):
        """ Checks an MRP user can create, confirm and cancel a manufacturing order. """
        man_order_form = Form(self.env['mrp.production'].with_user(self.user_mrp_user))
        man_order_form.productId = self.product_4
        man_order_form.productQty = 5.0
        man_order_form.bomId = self.bom_1
        man_order_form.locationSrcId = self.location_1
        man_order_form.locationDestId = self.warehouse_1.wh_output_stock_loc_id
        man_order = man_order_form.save()
        man_order.action_confirm()
        man_order.action_cancel()
        self.assertEqual(man_order.state, 'cancel', "Production order should be in cancel state.")
        man_order.unlink()

    def test_basic(self):
        """ Checks a basic manufacturing order: no routing (thus no workorders), no lot and
        consume strictly what's needed. """
        self.product_1.type = 'product'
        self.product_2.type = 'product'
        self.env['stock.quant'].create({
            'locationId': self.warehouse_1.lot_stock_id.id,
            'productId': self.product_1.id,
            'inventoryQuantity': 500
        }).action_apply_inventory()
        self.env['stock.quant'].create({
            'locationId': self.warehouse_1.lot_stock_id.id,
            'productId': self.product_2.id,
            'inventoryQuantity': 500
        }).action_apply_inventory()

        test_date_planned = fields.Datetime.now() - timedelta(days=1)
        test_quantity = 3.0
        man_order_form = Form(self.env['mrp.production'].with_user(self.user_mrp_user))
        man_order_form.productId = self.product_4
        man_order_form.bomId = self.bom_1
        man_order_form.productUomId = self.product_4.uomId
        man_order_form.productQty = test_quantity
        man_order_form.datePlannedStart = test_date_planned
        man_order_form.locationSrcId = self.location_1
        man_order_form.locationDestId = self.warehouse_1.wh_output_stock_loc_id
        man_order = man_order_form.save()

        self.assertEqual(man_order.state, 'draft', "Production order should be in draft state.")
        man_order.action_confirm()
        self.assertEqual(man_order.state, 'confirmed', "Production order should be in confirmed state.")

        # check production move
        production_move = man_order.move_finished_ids
        self.assertAlmostEqual(production_move.date, test_date_planned + timedelta(hours=1), delta=timedelta(seconds=10))
        self.assertEqual(production_move.productId, self.product_4)
        self.assertEqual(production_move.productUom, man_order.productUomId)
        self.assertEqual(production_move.productQty, man_order.productQty)
        self.assertEqual(production_move.locationId, self.product_4.property_stock_production)
        self.assertEqual(production_move.locationDestId, man_order.locationDestId)

        # check consumption moves
        for move in man_order.moveRawIds:
            self.assertEqual(move.date, test_date_planned)
        first_move = man_order.moveRawIds.filtered(lambda move: move.productId == self.product_2)
        self.assertEqual(first_move.productQty, test_quantity / self.bom_1.productQty * self.product_4.uomId.factor_inv * 2)
        first_move = man_order.moveRawIds.filtered(lambda move: move.productId == self.product_1)
        self.assertEqual(first_move.productQty, test_quantity / self.bom_1.productQty * self.product_4.uomId.factor_inv * 4)

        # produce product
        mo_form = Form(man_order)
        mo_form.qtyProducing = 2.0
        man_order = mo_form.save()

        action = man_order.button_mark_done()
        self.assertEqual(man_order.state, 'progress', "Production order should be open a backorder wizard, then not done yet.")

        quantity_issues = man_order._get_consumption_issues()
        action = man_order._action_generate_consumption_wizard(quantity_issues)
        backorder = Form(self.env['mrp.production.backorder'].withContext(**action['context']))
        backorder.save().action_close_mo()
        self.assertEqual(man_order.state, 'done', "Production order should be done.")

        # check that copy handles moves correctly
        mo_copy = man_order.copy()
        self.assertEqual(mo_copy.state, 'draft', "Copied production order should be draft.")
        self.assertEqual(len(mo_copy.moveRawIds), 4,
                         "Incorrect number of component moves [i.e. all non-0 (even cancelled) moves should be copied].")
        self.assertEqual(len(mo_copy.move_finished_ids), 1, "Incorrect number of moves for products to produce [i.e. cancelled moves should not be copied")
        self.assertEqual(mo_copy.move_finished_ids.productUomQty, 2, "Incorrect qty of products to produce")

        # check that a cancelled MO is copied correctly
        mo_copy.action_cancel()
        self.assertEqual(mo_copy.state, 'cancel')
        mo_copy_2 = mo_copy.copy()
        self.assertEqual(mo_copy_2.state, 'draft', "Copied production order should be draft.")
        self.assertEqual(len(mo_copy_2.moveRawIds), 4, "Incorrect number of component moves.")
        self.assertEqual(len(mo_copy_2.move_finished_ids), 1, "Incorrect number of moves for products to produce [i.e. copying a cancelled MO should copy its cancelled moves]")
        self.assertEqual(mo_copy_2.move_finished_ids.productUomQty, 2, "Incorrect qty of products to produce")

    def test_production_availability(self):
        """ Checks the availability of a production order through mutliple calls to `action_assign`.
        """
        self.bom_3.bom_line_ids.filtered(lambda x: x.productId == self.product_5).unlink()
        self.bom_3.bom_line_ids.filtered(lambda x: x.productId == self.product_4).unlink()
        self.bom_3.ready_to_produce = 'all_available'

        production_form = Form(self.env['mrp.production'])
        production_form.productId = self.product_6
        production_form.bomId = self.bom_3
        production_form.productQty = 5.0
        production_form.productUomId = self.product_6.uomId
        production_2 = production_form.save()

        production_2.action_confirm()
        production_2.action_assign()

        # check sub product availability state is waiting
        self.assertEqual(production_2.reservationState, 'confirmed', 'Production order should be availability for waiting state')

        # Update Inventory
        self.env['stock.quant'].withContext(inventory_mode=True).create({
            'productId': self.product_2.id,
            'inventoryQuantity': 2.0,
            'locationId': self.stock_location_14.id
        }).action_apply_inventory()

        production_2.action_assign()
        # check sub product availability state is partially available
        self.assertEqual(production_2.reservationState, 'confirmed', 'Production order should be availability for partially available state')

        # Update Inventory
        self.env['stock.quant'].withContext(inventory_mode=True).create({
            'productId': self.product_2.id,
            'inventoryQuantity': 5.0,
            'locationId': self.stock_location_14.id
        }).action_apply_inventory()

        production_2.action_assign()
        # check sub product availability state is assigned
        self.assertEqual(production_2.reservationState, 'assigned', 'Production order should be availability for assigned state')

    def test_over_consumption(self):
        """ Consume more component quantity than the initial demand. No split on moves.
        """
        mo, _bom, _p_final, _p1, _p2 = self.generate_mo(qty_base_1=10, qty_final=1, qty_base_2=1)
        mo.action_assign()
        # check is_quantity_done_editable
        mo_form = Form(mo)
        mo_form.qtyProducing = 1
        mo = mo_form.save()
        details_operation_form = Form(mo.moveRawIds[0], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.edit(0) as ml:
            ml.qtyDone = 2
        details_operation_form.save()
        details_operation_form = Form(mo.moveRawIds[1], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.edit(0) as ml:
            ml.qtyDone = 11
        details_operation_form.save()

        self.assertEqual(len(mo.moveRawIds), 2)
        self.assertEqual(len(mo.moveRawIds.mapped('moveLineIds')), 2)
        self.assertEqual(mo.moveRawIds[0].moveLineIds.mapped('qtyDone'), [2])
        self.assertEqual(mo.moveRawIds[1].moveLineIds.mapped('qtyDone'), [11])
        self.assertEqual(mo.moveRawIds[0].quantityDone, 2)
        self.assertEqual(mo.moveRawIds[1].quantityDone, 11)
        mo.button_mark_done()
        self.assertEqual(len(mo.moveRawIds), 2)
        self.assertEqual(len(mo.moveRawIds.mapped('moveLineIds')), 2)
        self.assertEqual(mo.moveRawIds.mapped('quantityDone'), [2, 11])
        self.assertEqual(mo.moveRawIds.mapped('moveLineIds.qtyDone'), [2, 11])

    def test_under_consumption(self):
        """ Consume less component quantity than the initial demand.
            Before done:
                p1, to consume = 1, consumed = 0
                p2, to consume = 10, consumed = 5
            After done:
                p1, to consume = 1, consumed = 0, state = cancel
                p2, to consume = 5, consumed = 5, state = done
                p2, to consume = 5, consumed = 0, state = cancel
        """
        mo, _bom, _p_final, _p1, _p2 = self.generate_mo(qty_base_1=10, qty_final=1, qty_base_2=1)
        mo.action_assign()
        # check is_quantity_done_editable
        mo_form = Form(mo)
        mo_form.qtyProducing = 1
        mo = mo_form.save()
        details_operation_form = Form(mo.moveRawIds[0], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.edit(0) as ml:
            ml.qtyDone = 0
        details_operation_form.save()
        details_operation_form = Form(mo.moveRawIds[1], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.edit(0) as ml:
            ml.qtyDone = 5
        details_operation_form.save()

        self.assertEqual(len(mo.moveRawIds), 2)
        self.assertEqual(len(mo.moveRawIds.mapped('moveLineIds')), 2)
        self.assertEqual(mo.moveRawIds[0].moveLineIds.mapped('qtyDone'), [0])
        self.assertEqual(mo.moveRawIds[1].moveLineIds.mapped('qtyDone'), [5])
        self.assertEqual(mo.moveRawIds[0].quantityDone, 0)
        self.assertEqual(mo.moveRawIds[1].quantityDone, 5)
        mo.button_mark_done()
        self.assertEqual(len(mo.moveRawIds), 3)
        self.assertEqual(len(mo.moveRawIds.mapped('moveLineIds')), 1)
        self.assertEqual(mo.moveRawIds.mapped('quantityDone'), [0, 5, 0])
        self.assertEqual(mo.moveRawIds.mapped('productUomQty'), [1, 5, 5])
        self.assertEqual(mo.moveRawIds.mapped('state'), ['cancel', 'done', 'cancel'])
        self.assertEqual(mo.moveRawIds.mapped('moveLineIds.qtyDone'), [5])

    def test_update_quantity_1(self):
        """ Build 5 final products with different consumed lots,
        then edit the finished quantity and update the Manufacturing
        order quantity. Then check if the produced quantity do not
        change and it is possible to close the MO.
        """
        self.stock_location = self.env.ref('stock.stock_location_stock')
        mo, bom, p_final, p1, p2 = self.generate_mo(tracking_base_1='lot')
        self.assertEqual(len(mo), 1, 'MO should have been created')

        lot_1 = self.env['stock.production.lot'].create({
            'name': 'lot1',
            'productId': p1.id,
            'companyId': self.env.company.id,
        })
        lot_2 = self.env['stock.production.lot'].create({
            'name': 'lot2',
            'productId': p1.id,
            'companyId': self.env.company.id,
        })

        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 10, lotId=lot_1)
        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 10, lotId=lot_2)

        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 5)
        mo.action_assign()

        mo_form = Form(mo)
        mo_form.qtyProducing = 1
        mo = mo_form.save()

        details_operation_form = Form(mo.moveRawIds[1], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.lotId = lot_1
            ml.qtyDone = 20
        details_operation_form.save()
        update_quantity_wizard = self.env['change.production.qty'].create({
            'moId': mo.id,
            'productQty': 4,
        })
        update_quantity_wizard.change_prod_qty()

        self.assertEqual(mo.moveRawIds.filtered(lambda m: m.productId == p1).quantityDone, 20, 'Update the produce quantity should not impact already produced quantity.')
        self.assertEqual(mo.move_finished_ids.productUomQty, 4)
        mo.button_mark_done()

    def test_update_quantity_2(self):
        """ Build 5 final products with different consumed lots,
        then edit the finished quantity and update the Manufacturing
        order quantity. Then check if the produced quantity do not
        change and it is possible to close the MO.
        """
        self.stock_location = self.env.ref('stock.stock_location_stock')
        mo, bom, p_final, p1, p2 = self.generate_mo(qty_final=3)
        self.assertEqual(len(mo), 1, 'MO should have been created')

        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 20)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 5)
        mo.action_assign()

        mo_form = Form(mo)
        mo_form.qtyProducing = 2
        mo = mo_form.save()

        mo._post_inventory()

        update_quantity_wizard = self.env['change.production.qty'].create({
            'moId': mo.id,
            'productQty': 5,
        })
        update_quantity_wizard.change_prod_qty()
        mo_form = Form(mo)
        mo_form.qtyProducing = 5
        mo = mo_form.save()
        mo.button_mark_done()

        self.assertEqual(sum(mo.moveRawIds.filtered(lambda m: m.productId == p1).mapped('quantityDone')), 20)
        self.assertEqual(sum(mo.move_finished_ids.mapped('quantityDone')), 5)

    def test_update_quantity_3(self):
        bom = self.env['mrp.bom'].create({
            'productId': self.product_6.id,
            'productTemplateId': self.product_6.productTemplateId.id,
            'productQty': 1,
            'productUomId': self.product_6.uomId.id,
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': self.product_2.id, 'productQty': 2.03}),
                (0, 0, {'productId': self.product_8.id, 'productQty': 4.16})
            ],
            'operationIds': [
                (0, 0, {'name': 'Gift Wrap Maching', 'workcenterId': self.workcenter_1.id, 'timeCycle': 15, 'sequence': 1}),
            ]
        })
        production_form = Form(self.env['mrp.production'])
        production_form.productId = self.product_6
        production_form.bomId = bom
        production_form.productQty = 1
        production_form.productUomId = self.product_6.uomId
        production = production_form.save()
        self.assertEqual(production.workorderIds.durationExpected, 90)
        mo_form = Form(production)
        mo_form.productQty = 3
        production = mo_form.save()
        self.assertEqual(production.workorderIds.durationExpected, 165)

    def test_update_quantity_4(self):
        bom = self.env['mrp.bom'].create({
            'productId': self.product_6.id,
            'productTemplateId': self.product_6.productTemplateId.id,
            'productQty': 1,
            'productUomId': self.product_6.uomId.id,
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': self.product_2.id, 'productQty': 2.03}),
                (0, 0, {'productId': self.product_8.id, 'productQty': 4.16})
            ],
        })
        production_form = Form(self.env['mrp.production'])
        production_form.productId = self.product_6
        production_form.bomId = bom
        production_form.productQty = 1
        production_form.productUomId = self.product_6.uomId
        production = production_form.save()
        production_form = Form(production)
        with production_form.workorderIds.new() as wo:
            wo.name = 'OP1'
            wo.workcenterId = self.workcenter_1
            wo.durationExpected = 40
        production = production_form.save()
        self.assertEqual(production.workorderIds.durationExpected, 40)
        mo_form = Form(production)
        mo_form.productQty = 3
        production = mo_form.save()
        self.assertEqual(production.workorderIds.durationExpected, 90)

    def test_qty_producing(self):
        """Qty producing should be the qty remain to produce, instead of 0"""
        bom = self.env['mrp.bom'].create({
            'productId': self.product_6.id,
            'productTemplateId': self.product_6.productTemplateId.id,
            'productQty': 1,
            'productUomId': self.product_6.uomId.id,
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': self.product_2.id, 'productQty': 2.00}),
            ],
        })
        production_form = Form(self.env['mrp.production'])
        production_form.productId = self.product_6
        production_form.bomId = bom
        production_form.productQty = 5
        production_form.productUomId = self.product_6.uomId
        production = production_form.save()
        production_form = Form(production)
        with production_form.workorderIds.new() as wo:
            wo.name = 'OP1'
            wo.workcenterId = self.workcenter_1
            wo.durationExpected = 40
        production = production_form.save()
        production.action_confirm()
        production.button_plan()

        wo = production.workorderIds[0]
        wo.button_start()
        self.assertEqual(wo.qtyProducing, 5, "Wrong quantity is suggested to produce.")

        # Simulate changing the qtyProducing in the frontend
        wo.qtyProducing = 4
        wo.button_pending()
        wo.button_start()
        self.assertEqual(wo.qtyProducing, 4, "Changing the qtyProducing in the frontend is not persisted")

    def test_update_quantity_5(self):
        bom = self.env['mrp.bom'].create({
            'productId': self.product_6.id,
            'productTemplateId': self.product_6.productTemplateId.id,
            'productQty': 1,
            'productUomId': self.product_6.uomId.id,
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': self.product_2.id, 'productQty': 3}),
            ],
        })
        production_form = Form(self.env['mrp.production'])
        production_form.productId = self.product_6
        production_form.bomId = bom
        production_form.productQty = 1
        production_form.productUomId = self.product_6.uomId
        production = production_form.save()
        production.action_confirm()
        production.action_assign()
        production.is_locked = False
        production_form = Form(production)
        # change the quantity producing and the initial demand
        # in the same transaction
        production_form.qtyProducing = 10
        with production_form.moveRawIds.edit(0) as move:
            move.productUomQty = 2
        production = production_form.save()
        production.button_mark_done()

    def test_update_plan_date(self):
        """Editing the scheduled date after planning the MO should unplan the MO, and adjust the date on the stock moves"""
        planned_date = datetime(2023, 5, 15, 9, 0)
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = self.product_4
        mo_form.bomId = self.bom_1
        mo_form.productQty = 1
        mo_form.datePlannedStart = planned_date
        mo = mo_form.save()
        self.assertEqual(mo.move_finished_ids[0].date, datetime(2023, 5, 15, 10, 0))
        mo.action_confirm()
        mo.button_plan()
        with Form(mo) as frm:
            frm.datePlannedStart = datetime(2024, 5, 15, 9, 0)
        self.assertEqual(mo.move_finished_ids[0].date, datetime(2024, 5, 15, 10, 0))

    def test_rounding(self):
        """ Checks we round up when bringing goods to produce and round half-up when producing.
        This implementation allows to implement an efficiency notion (see rev 347f140fe63612ee05e).
        """
        self.product_6.uomId.rounding = 1.0
        bom_eff = self.env['mrp.bom'].create({
            'productId': self.product_6.id,
            'productTemplateId': self.product_6.productTemplateId.id,
            'productQty': 1,
            'productUomId': self.product_6.uomId.id,
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': self.product_2.id, 'productQty': 2.03}),
                (0, 0, {'productId': self.product_8.id, 'productQty': 4.16})
            ]
        })
        production_form = Form(self.env['mrp.production'])
        production_form.productId = self.product_6
        production_form.bomId = bom_eff
        production_form.productQty = 20
        production_form.productUomId = self.product_6.uomId
        production = production_form.save()
        production.action_confirm()
        #Check the production order has the right quantities
        self.assertEqual(production.moveRawIds[0].productQty, 41, 'The quantity should be rounded up')
        self.assertEqual(production.moveRawIds[1].productQty, 84, 'The quantity should be rounded up')

        # produce product
        mo_form = Form(production)
        mo_form.qtyProducing = 8
        production = mo_form.save()
        self.assertEqual(production.moveRawIds[0].quantityDone, 16, 'Should use half-up rounding when producing')
        self.assertEqual(production.moveRawIds[1].quantityDone, 34, 'Should use half-up rounding when producing')

    def test_product_produce_1(self):
        """ Checks the production wizard contains lines even for untracked products. """
        self.stock_location = self.env.ref('stock.stock_location_stock')
        mo, bom, p_final, p1, p2 = self.generate_mo()
        self.assertEqual(len(mo), 1, 'MO should have been created')

        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 100)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 5)

        mo.action_assign()

        # change the quantity done in one line
        details_operation_form = Form(mo.moveRawIds[0], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.edit(0) as ml:
            ml.qtyDone = 1
        details_operation_form.save()

        # change the quantity producing
        mo_form = Form(mo)
        mo_form.qtyProducing = 3

        # check than all quantities are update correctly
        self.assertEqual(mo_form.moveRawIds._records[0]['productUomQty'], 5, "Wrong quantity to consume")
        self.assertEqual(mo_form.moveRawIds._records[0]['quantityDone'], 3, "Wrong quantity done")
        self.assertEqual(mo_form.moveRawIds._records[1]['productUomQty'], 20, "Wrong quantity to consume")
        self.assertEqual(mo_form.moveRawIds._records[1]['quantityDone'], 12, "Wrong quantity done")

    def test_product_produce_2(self):
        """ Checks that, for a BOM where one of the components is tracked by serial number and the
        other is not tracked, when creating a manufacturing order for two finished products and
        reserving, the produce wizards proposes the corrects lines when producing one at a time.
        """
        self.stock_location = self.env.ref('stock.stock_location_stock')
        mo, bom, p_final, p1, p2 = self.generate_mo(tracking_base_1='serial', qty_base_1=1, qty_final=2)
        self.assertEqual(len(mo), 1, 'MO should have been created')

        lot_p1_1 = self.env['stock.production.lot'].create({
            'name': 'lot1',
            'productId': p1.id,
            'companyId': self.env.company.id,
        })
        lot_p1_2 = self.env['stock.production.lot'].create({
            'name': 'lot2',
            'productId': p1.id,
            'companyId': self.env.company.id,
        })

        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 1, lotId=lot_p1_1)
        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 1, lotId=lot_p1_2)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 5)

        mo.action_assign()

        self.assertEqual(len(mo.moveRawIds.moveLineIds), 3, 'You should have 3 stock move lines. One for each serial to consume and for the untracked product.')
        mo_form = Form(mo)
        mo_form.qtyProducing = 1
        mo = mo_form.save()

        # get the proposed lot
        details_operation_form = Form(mo.moveRawIds.filtered(lambda move: move.productId == p1), view=self.env.ref('stock.view_stock_move_operations'))
        self.assertEqual(len(details_operation_form.moveLineIds), 2)
        with details_operation_form.moveLineIds.edit(0) as ml:
            consumed_lots = ml.lotId
            ml.qtyDone = 1
        details_operation_form.save()

        remaining_lot = (lot_p1_1 | lot_p1_2) - consumed_lots
        remaining_lot.ensure_one()
        action = mo.button_mark_done()
        backorder = Form(self.env['mrp.production.backorder'].withContext(**action['context']))
        backorder.save().action_backorder()

        # Check MO backorder
        mo_backorder = mo.procurementGroupId.mrpProductionIds[-1]

        mo_form = Form(mo_backorder)
        mo_form.qtyProducing = 1
        mo_backorder = mo_form.save()
        details_operation_form = Form(mo_backorder.moveRawIds.filtered(lambda move: move.productId == p1), view=self.env.ref('stock.view_stock_move_operations'))
        self.assertEqual(len(details_operation_form.moveLineIds), 1)
        with details_operation_form.moveLineIds.edit(0) as ml:
            self.assertEqual(ml.lotId, remaining_lot)

    def test_product_produce_3(self):
        """ Checks that, for a BOM where one of the components is tracked by lot and the other is
        not tracked, when creating a manufacturing order for 1 finished product and reserving, the
        reserved lines are displayed. Then, over-consume by creating new line.
        """
        self.stock_location = self.env.ref('stock.stock_location_stock')
        self.stock_shelf_1 = self.stock_location_components

        self.stock_shelf_2 = self.stock_location_14
        mo, _, p_final, p1, p2 = self.generate_mo(tracking_base_1='lot', qty_base_1=10, qty_final=1)
        self.assertEqual(len(mo), 1, 'MO should have been created')

        first_lot_for_p1 = self.env['stock.production.lot'].create({
            'name': 'lot1',
            'productId': p1.id,
            'companyId': self.env.company.id,
        })
        second_lot_for_p1 = self.env['stock.production.lot'].create({
            'name': 'lot2',
            'productId': p1.id,
            'companyId': self.env.company.id,
        })

        final_product_lot = self.env['stock.production.lot'].create({
            'name': 'lot1',
            'productId': p_final.id,
            'companyId': self.env.company.id,
        })

        self.env['stock.quant']._update_available_quantity(p1, self.stock_shelf_1, 3, lotId=first_lot_for_p1)
        self.env['stock.quant']._update_available_quantity(p1, self.stock_shelf_2, 3, lotId=first_lot_for_p1)
        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 8, lotId=second_lot_for_p1)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 5)

        mo.action_assign()
        mo_form = Form(mo)
        mo_form.qtyProducing = 1.0
        mo_form.lotProducingId = final_product_lot
        mo = mo_form.save()
        # p2
        details_operation_form = Form(mo.moveRawIds[0], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.edit(0) as line:
            line.qtyDone = line.productUomQty
        with details_operation_form.moveLineIds.new() as line:
            line.qtyDone = 1
        details_operation_form.save()

        # p1
        details_operation_form = Form(mo.moveRawIds[1], view=self.env.ref('stock.view_stock_move_operations'))
        for i in range(len(details_operation_form.moveLineIds)):
            # reservation in shelf1: 3 lot1, shelf2: 3 lot1, stock: 4 lot2
            with details_operation_form.moveLineIds.edit(i) as line:
                line.qtyDone = line.productUomQty
        with details_operation_form.moveLineIds.new() as line:
            line.qtyDone = 2
            line.lotId = first_lot_for_p1
        with details_operation_form.moveLineIds.new() as line:
            line.qtyDone = 1
            line.lotId = second_lot_for_p1
        details_operation_form.save()

        move_1 = mo.moveRawIds.filtered(lambda m: m.productId == p1)
        # qtyDone/productUomQty lot
        # 3/3 lot 1 shelf 1
        # 1/1 lot 1 shelf 2
        # 2/2 lot 1 shelf 2
        # 2/0 lot 1 other
        # 5/4 lot 2
        ml_to_shelf_1 = move_1.moveLineIds.filtered(lambda ml: ml.lotId == first_lot_for_p1 and ml.locationId == self.stock_shelf_1)
        ml_to_shelf_2 = move_1.moveLineIds.filtered(lambda ml: ml.lotId == first_lot_for_p1 and ml.locationId == self.stock_shelf_2)

        self.assertEqual(sum(ml_to_shelf_1.mapped('qtyDone')), 3.0, '3 units should be took from shelf1 as reserved.')
        self.assertEqual(sum(ml_to_shelf_2.mapped('qtyDone')), 3.0, '3 units should be took from shelf2 as reserved.')
        self.assertEqual(move_1.quantityDone, 13, 'You should have used the tem units.')

        mo.button_mark_done()
        self.assertEqual(mo.state, 'done', "Production order should be in done state.")

    def test_product_produce_4(self):
        """ Possibility to produce with a given raw material in multiple locations. """
        # FIXME sle: how is it possible to consume before producing in the interface?
        self.stock_location = self.env.ref('stock.stock_location_stock')
        self.stock_shelf_1 = self.stock_location_components
        self.stock_shelf_2 = self.stock_location_14
        mo, _, p_final, p1, p2 = self.generate_mo(qty_final=1, qty_base_1=5)

        self.env['stock.quant']._update_available_quantity(p1, self.stock_shelf_1, 2)
        self.env['stock.quant']._update_available_quantity(p1, self.stock_shelf_2, 3)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 1)

        mo.action_assign()
        ml_p1 = mo.moveRawIds.filtered(lambda x: x.productId == p1).mapped('moveLineIds')
        ml_p2 = mo.moveRawIds.filtered(lambda x: x.productId == p2).mapped('moveLineIds')
        self.assertEqual(len(ml_p1), 2)
        self.assertEqual(len(ml_p2), 1)

        # Add some quantity already done to force an extra move line to be created
        ml_p1[0].qtyDone = 1.0

        # Produce baby!
        mo_form = Form(mo)
        mo_form.qtyProducing = 1
        mo = mo_form.save()

        m_p1 = mo.moveRawIds.filtered(lambda x: x.productId == p1)
        ml_p1 = m_p1.mapped('moveLineIds')
        self.assertEqual(len(ml_p1), 2)
        self.assertEqual(sorted(ml_p1.mapped('qtyDone')), [2.0, 3.0], 'Quantity done should be 1.0, 2.0 or 3.0')
        self.assertEqual(m_p1.quantityDone, 5.0, 'Total qty done should be 6.0')
        self.assertEqual(sum(ml_p1.mapped('productUomQty')), 5.0, 'Total qty reserved should be 5.0')

        mo.button_mark_done()
        self.assertEqual(mo.state, 'done', "Production order should be in done state.")

    def test_product_produce_6(self):
        """ Plan 5 finished products, reserve and produce 3. Post the current production.
        Simulate an unlock and edit and, on the opened moves, set the consumed quantity
        to 3. Now, try to update the quantity to mo2 to 3. It should fail since there
        are consumed quantities. Unlock and edit, remove the consumed quantities and
        update the quantity to produce to 3."""
        self.stock_location = self.env.ref('stock.stock_location_stock')
        mo, bom, p_final, p1, p2 = self.generate_mo()
        self.assertEqual(len(mo), 1, 'MO should have been created')

        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 20)

        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 5)
        mo.action_assign()

        mo_form = Form(mo)
        mo_form.qtyProducing = 3
        mo = mo_form.save()

        mo._post_inventory()
        self.assertEqual(len(mo.moveRawIds), 4)

        mo.moveRawIds.filtered(lambda m: m.state != 'done')[0].quantityDone = 3

        update_quantity_wizard = self.env['change.production.qty'].create({
            'moId': mo.id,
            'productQty': 3,
        })

        mo.moveRawIds.filtered(lambda m: m.state != 'done')[0].quantityDone = 0
        update_quantity_wizard.change_prod_qty()

        self.assertEqual(len(mo.moveRawIds), 4)

        mo.button_mark_done()
        self.assertTrue(all(s in ['done', 'cancel'] for s in mo.moveRawIds.mapped('state')))
        self.assertEqual(sum(mo.moveRawIds.mapped('moveLineIds.productUomQty')), 0)

    def test_consumption_strict_1(self):
        """ Checks the constraints of a strict BOM without tracking when playing around
        quantities to consume."""
        self.stock_location = self.env.ref('stock.stock_location_stock')
        mo, bom, p_final, p1, p2 = self.generate_mo(consumption='strict', qty_final=1)
        self.assertEqual(len(mo), 1, 'MO should have been created')

        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 100)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 5)

        mo.action_assign()

        mo_form = Form(mo)

        # try adding another line for a bom product to increase the quantity
        mo_form.qtyProducing = 1
        with mo_form.moveRawIds.new() as line:
            line.productId = p1
        mo = mo_form.save()
        details_operation_form = Form(mo.moveRawIds[-1], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.qtyDone = 1
        details_operation_form.save()
        # Won't accept to be done, instead return a wizard
        mo.button_mark_done()
        self.assertEqual(mo.state, 'toClose')
        consumption_issues = mo._get_consumption_issues()
        action = mo._action_generate_consumption_wizard(consumption_issues)
        warning = Form(self.env['mrp.consumption.warning'].withContext(**action['context']))
        warning = warning.save()

        self.assertEqual(len(warning.mrp_consumption_warning_line_ids), 1)
        self.assertEqual(warning.mrp_consumption_warning_line_ids[0].product_consumed_qty_uom, 5)
        self.assertEqual(warning.mrp_consumption_warning_line_ids[0].product_expected_qty_uom, 4)
        # Force the warning (as a manager)
        warning.action_confirm()
        self.assertEqual(mo.state, 'done')

    def test_consumption_warning_1(self):
        """ Checks the constraints of a strict BOM without tracking when playing around
        quantities to consume."""
        self.stock_location = self.env.ref('stock.stock_location_stock')
        mo, bom, p_final, p1, p2 = self.generate_mo(consumption='warning', qty_final=1)
        self.assertEqual(len(mo), 1, 'MO should have been created')

        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 100)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 5)

        mo.action_assign()

        mo_form = Form(mo)

        # try adding another line for a bom product to increase the quantity
        mo_form.qtyProducing = 1
        with mo_form.moveRawIds.new() as line:
            line.productId = p1
        mo = mo_form.save()
        details_operation_form = Form(mo.moveRawIds[-1], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.qtyDone = 1
        details_operation_form.save()

        # Won't accept to be done, instead return a wizard
        mo.button_mark_done()
        self.assertEqual(mo.state, 'toClose')

        consumption_issues = mo._get_consumption_issues()
        action = mo._action_generate_consumption_wizard(consumption_issues)
        warning = Form(self.env['mrp.consumption.warning'].withContext(**action['context']))
        warning = warning.save()

        self.assertEqual(len(warning.mrp_consumption_warning_line_ids), 1)
        self.assertEqual(warning.mrp_consumption_warning_line_ids[0].product_consumed_qty_uom, 5)
        self.assertEqual(warning.mrp_consumption_warning_line_ids[0].product_expected_qty_uom, 4)
        # Force the warning (as a manager or employee)
        warning.action_confirm()
        self.assertEqual(mo.state, 'done')

    def test_consumption_flexible_1(self):
        """ Checks the constraints of a strict BOM without tracking when playing around
        quantities to consume."""
        self.stock_location = self.env.ref('stock.stock_location_stock')
        mo, bom, p_final, p1, p2 = self.generate_mo(consumption='flexible', qty_final=1)
        self.assertEqual(len(mo), 1, 'MO should have been created')

        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 100)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 5)

        mo.action_assign()

        mo_form = Form(mo)

        # try adding another line for a bom product to increase the quantity
        mo_form.qtyProducing = 1
        with mo_form.moveRawIds.new() as line:
            line.productId = p1
        mo = mo_form.save()
        details_operation_form = Form(mo.moveRawIds[-1], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.qtyDone = 1
        details_operation_form.save()

        # Won't accept to be done, instead return a wizard
        mo.button_mark_done()
        self.assertEqual(mo.state, 'done')

    def test_consumption_flexible_2(self):
        """ Checks the constraints of a strict BOM only apply to the product of the BoM. """
        self.stock_location = self.env.ref('stock.stock_location_stock')
        mo, bom, p_final, p1, p2 = self.generate_mo(consumption='flexible', qty_final=1)
        self.assertEqual(len(mo), 1, 'MO should have been created')

        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 100)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 5)
        add_product = self.env['product.product'].create({
            'name': 'additional',
            'type': 'product',
        })
        mo.action_assign()

        mo_form = Form(mo)

        # try adding another line for a bom product to increase the quantity
        mo_form.qtyProducing = 1
        with mo_form.moveRawIds.new() as line:
            line.productId = p1
        with mo_form.moveRawIds.new() as line:
            line.productId = add_product
        mo = mo_form.save()
        details_operation_form = Form(mo.moveRawIds[-1], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.qtyDone = 1
        details_operation_form.save()

        # Won't accept to be done, instead return a wizard
        mo.button_mark_done()
        self.assertEqual(mo.state, 'done')

    def test_product_produce_9(self):
        """ Checks the production wizard contains lines even for untracked products. """
        serial = self.env['product.product'].create({
            'name': 'S1',
            'tracking': 'serial',
        })
        self.stock_location = self.env.ref('stock.stock_location_stock')
        mo, bom, p_final, p1, p2 = self.generate_mo()
        self.assertEqual(len(mo), 1, 'MO should have been created')

        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 100)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 5)

        mo.action_assign()
        mo_form = Form(mo)

        # change the quantity done in one line
        with self.assertRaises(AssertionError):
            with mo_form.moveRawIds.new() as move:
                move.productId = serial
                move.quantityDone = 2
            mo_form.save()

    def test_product_produce_10(self):
        """ Produce byproduct with serial, lot and not tracked.
        byproduct1 serial 1.0
        byproduct2 lot    2.0
        byproduct3 none   1.0 dozen
        Check qty producing update and moves finished values.
        """
        dozen = self.env.ref('uom.product_uom_dozen')
        self.byproduct1 = self.env['product.product'].create({
            'name': 'Byproduct 1',
            'type': 'product',
            'tracking': 'serial'
        })
        self.serial_1 = self.env['stock.production.lot'].create({
            'productId': self.byproduct1.id,
            'name': 'serial 1',
            'companyId': self.env.company.id,
        })
        self.serial_2 = self.env['stock.production.lot'].create({
            'productId': self.byproduct1.id,
            'name': 'serial 2',
            'companyId': self.env.company.id,
        })

        self.byproduct2 = self.env['product.product'].create({
            'name': 'Byproduct 2',
            'type': 'product',
            'tracking': 'lot',
        })
        self.lot_1 = self.env['stock.production.lot'].create({
            'productId': self.byproduct2.id,
            'name': 'Lot 1',
            'companyId': self.env.company.id,
        })
        self.lot_2 = self.env['stock.production.lot'].create({
            'productId': self.byproduct2.id,
            'name': 'Lot 2',
            'companyId': self.env.company.id,
        })

        self.byproduct3 = self.env['product.product'].create({
            'name': 'Byproduct 3',
            'type': 'product',
            'tracking': 'none',
        })

        with Form(self.bom_1) as bom:
            bom.productQty = 1.0
            with bom.byproduct_ids.new() as bp:
                bp.productId = self.byproduct1
                bp.productQty = 1.0
            with bom.byproduct_ids.new() as bp:
                bp.productId = self.byproduct2
                bp.productQty = 2.0
            with bom.byproduct_ids.new() as bp:
                bp.productId = self.byproduct3
                bp.productQty = 2.0
                bp.productUomId = dozen

        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = self.product_4
        mo_form.bomId = self.bom_1
        mo_form.productQty = 2
        mo = mo_form.save()

        mo.action_confirm()
        move_byproduct_1 = mo.move_finished_ids.filtered(lambda l: l.productId == self.byproduct1)
        self.assertEqual(len(move_byproduct_1), 1)
        self.assertEqual(move_byproduct_1.productUomQty, 2.0)
        self.assertEqual(move_byproduct_1.quantityDone, 0)
        self.assertEqual(len(move_byproduct_1.moveLineIds), 0)

        move_byproduct_2 = mo.move_finished_ids.filtered(lambda l: l.productId == self.byproduct2)
        self.assertEqual(len(move_byproduct_2), 1)
        self.assertEqual(move_byproduct_2.productUomQty, 4.0)
        self.assertEqual(move_byproduct_2.quantityDone, 0)
        self.assertEqual(len(move_byproduct_2.moveLineIds), 0)

        move_byproduct_3 = mo.move_finished_ids.filtered(lambda l: l.productId == self.byproduct3)
        self.assertEqual(move_byproduct_3.productUomQty, 4.0)
        self.assertEqual(move_byproduct_3.quantityDone, 0)
        self.assertEqual(move_byproduct_3.productUom, dozen)
        self.assertEqual(len(move_byproduct_3.moveLineIds), 0)

        mo_form = Form(mo)
        mo_form.qtyProducing = 1.0
        mo = mo_form.save()
        move_byproduct_1 = mo.move_finished_ids.filtered(lambda l: l.productId == self.byproduct1)
        self.assertEqual(len(move_byproduct_1), 1)
        self.assertEqual(move_byproduct_1.productUomQty, 2.0)
        self.assertEqual(move_byproduct_1.quantityDone, 0)

        move_byproduct_2 = mo.move_finished_ids.filtered(lambda l: l.productId == self.byproduct2)
        self.assertEqual(len(move_byproduct_2), 1)
        self.assertEqual(move_byproduct_2.productUomQty, 4.0)
        self.assertEqual(move_byproduct_2.quantityDone, 0)

        move_byproduct_3 = mo.move_finished_ids.filtered(lambda l: l.productId == self.byproduct3)
        self.assertEqual(move_byproduct_3.productUomQty, 4.0)
        self.assertEqual(move_byproduct_3.quantityDone, 2.0)
        self.assertEqual(move_byproduct_3.productUom, dozen)

        details_operation_form = Form(move_byproduct_1, view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.lotId = self.serial_1
            ml.qtyDone = 1
        details_operation_form.save()
        details_operation_form = Form(move_byproduct_2, view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.lotId = self.lot_1
            ml.qtyDone = 2
        details_operation_form.save()
        action = mo.button_mark_done()
        backorder = Form(self.env['mrp.production.backorder'].withContext(**action['context']))
        backorder.save().action_backorder()
        mo2 = mo.procurementGroupId.mrpProductionIds[-1]

        mo_form = Form(mo2)
        mo_form.qtyProducing = 1
        mo2 = mo_form.save()

        move_byproduct_1 = mo2.move_finished_ids.filtered(lambda l: l.productId == self.byproduct1)
        self.assertEqual(len(move_byproduct_1), 1)
        self.assertEqual(move_byproduct_1.productUomQty, 1.0)
        self.assertEqual(move_byproduct_1.quantityDone, 0)

        move_byproduct_2 = mo2.move_finished_ids.filtered(lambda l: l.productId == self.byproduct2)
        self.assertEqual(len(move_byproduct_2), 1)
        self.assertEqual(move_byproduct_2.productUomQty, 2.0)
        self.assertEqual(move_byproduct_2.quantityDone, 0)

        move_byproduct_3 = mo2.move_finished_ids.filtered(lambda l: l.productId == self.byproduct3)
        self.assertEqual(move_byproduct_3.productUomQty, 2.0)
        self.assertEqual(move_byproduct_3.quantityDone, 2.0)
        self.assertEqual(move_byproduct_3.productUom, dozen)

        details_operation_form = Form(move_byproduct_1, view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.lotId = self.serial_2
            ml.qtyDone = 1
        details_operation_form.save()
        details_operation_form = Form(move_byproduct_2, view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.lotId = self.lot_2
            ml.qtyDone = 2
        details_operation_form.save()
        details_operation_form = Form(move_byproduct_3, view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.edit(0) as ml:
            ml.qtyDone = 3
        details_operation_form.save()

        mo2.button_mark_done()
        move_lines_byproduct_1 = (mo | mo2).move_finished_ids.filtered(lambda l: l.productId == self.byproduct1).mapped('moveLineIds')
        move_lines_byproduct_2 = (mo | mo2).move_finished_ids.filtered(lambda l: l.productId == self.byproduct2).mapped('moveLineIds')
        move_lines_byproduct_3 = (mo | mo2).move_finished_ids.filtered(lambda l: l.productId == self.byproduct3).mapped('moveLineIds')
        self.assertEqual(move_lines_byproduct_1.filtered(lambda ml: ml.lotId == self.serial_1).qtyDone, 1.0)
        self.assertEqual(move_lines_byproduct_1.filtered(lambda ml: ml.lotId == self.serial_2).qtyDone, 1.0)
        self.assertEqual(move_lines_byproduct_2.filtered(lambda ml: ml.lotId == self.lot_1).qtyDone, 2.0)
        self.assertEqual(move_lines_byproduct_2.filtered(lambda ml: ml.lotId == self.lot_2).qtyDone, 2.0)
        self.assertEqual(sum(move_lines_byproduct_3.mapped('qtyDone')), 5.0)
        self.assertEqual(move_lines_byproduct_3.mapped('productUomId'), dozen)

    def test_product_produce_11(self):
        """ Checks that, for a BOM with two components, when creating a manufacturing order for one
        finished products and without reserving, the produce wizards proposes the corrects lines
        even if we change the quantity to produce multiple times.
        """
        self.stock_location = self.env.ref('stock.stock_location_stock')
        mo, bom, p_final, p1, p2 = self.generate_mo(qty_final=1)
        self.assertEqual(len(mo), 1, 'MO should have been created')

        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 4)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 1)

        mo.bomId.consumption = 'flexible'  # Because we'll over-consume with a product not defined in the BOM
        mo.action_assign()
        mo.is_locked = False

        mo_form = Form(mo)
        mo_form.qtyProducing = 3
        self.assertEqual(sum([x['quantityDone'] for x in mo_form.moveRawIds._records]), 15, 'Update the produce quantity should change the components quantity.')
        mo = mo_form.save()
        self.assertEqual(sum(mo.moveRawIds.mapped('reserved_availability')), 5, 'Update the produce quantity should not change the components reserved quantity.')
        mo_form = Form(mo)
        mo_form.qtyProducing = 4
        self.assertEqual(sum([x['quantityDone'] for x in mo_form.moveRawIds._records]), 20, 'Update the produce quantity should change the components quantity.')
        mo = mo_form.save()
        self.assertEqual(sum(mo.moveRawIds.mapped('reserved_availability')), 5, 'Update the produce quantity should not change the components reserved quantity.')
        mo_form = Form(mo)
        mo_form.qtyProducing = 1
        self.assertEqual(sum([x['quantityDone'] for x in mo_form.moveRawIds._records]), 5, 'Update the produce quantity should change the components quantity.')
        mo = mo_form.save()
        self.assertEqual(sum(mo.moveRawIds.mapped('reserved_availability')), 5, 'Update the produce quantity should not change the components reserved quantity.')
        # try adding another product that doesn't belong to the BoM
        with mo_form.moveRawIds.new() as move:
            move.productId = self.product_4
        mo = mo_form.save()
        details_operation_form = Form(mo.moveRawIds[-1], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.qtyDone = 10
        details_operation_form.save()
        # Check that this new product is not updated by qtyProducing
        mo_form = Form(mo)
        mo_form.qtyProducing = 2
        for move in mo_form.moveRawIds._records:
            if move['productId'] == self.product_4.id:
                self.assertEqual(move['quantityDone'], 10)
                break
        mo = mo_form.save()
        mo.button_mark_done()

    def test_product_produce_duplicate_1(self):
        """ produce a finished product tracked by serial number 2 times with the
        same SN. Check that an error is raised the second time"""
        mo1, bom, p_final, p1, p2 = self.generate_mo(tracking_final='serial', qty_final=1, qty_base_1=1,)

        mo_form = Form(mo1)
        mo_form.qtyProducing = 1
        mo1 = mo_form.save()
        mo1.action_generate_serial()
        sn = mo1.lotProducingId
        mo1.button_mark_done()

        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = p_final
        mo_form.bomId = bom
        mo_form.productQty = 1
        mo2 = mo_form.save()
        mo2.action_confirm()

        mo_form = Form(mo2)
        with self.assertLogs(level="WARNING"):
            mo_form.lotProducingId = sn
        mo2 = mo_form.save()
        with self.assertRaises(UserError):
            mo2.button_mark_done()

    def test_product_produce_duplicate_2(self):
        """ produce a finished product with component tracked by serial number 2
        times with the same SN. Check that an error is raised the second time"""
        mo1, bom, p_final, p1, p2 = self.generate_mo(tracking_base_2='serial', qty_final=1, qty_base_1=1,)
        sn = self.env['stock.production.lot'].create({
            'name': 'sn used twice',
            'productId': p2.id,
            'companyId': self.env.company.id,
        })
        mo_form = Form(mo1)
        mo_form.qtyProducing = 1
        mo1 = mo_form.save()
        details_operation_form = Form(mo1.moveRawIds[0], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.lotId = sn
        details_operation_form.save()
        mo1.button_mark_done()

        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = p_final
        mo_form.bomId = bom
        mo_form.productQty = 1
        mo2 = mo_form.save()
        mo2.action_confirm()

        mo_form = Form(mo2)
        mo_form.qtyProducing = 1
        mo2 = mo_form.save()
        details_operation_form = Form(mo2.moveRawIds[0], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.lotId = sn
        details_operation_form.save()
        with self.assertRaises(UserError):
            mo2.button_mark_done()

    def test_product_produce_duplicate_3(self):
        """ produce a finished product with by-product tracked by serial number 2
        times with the same SN. Check that an error is raised the second time"""
        finished_product = self.env['product.product'].create({'name': 'finished product'})
        byproduct = self.env['product.product'].create({'name': 'byproduct', 'tracking': 'serial'})
        component = self.env['product.product'].create({'name': 'component'})
        bom = self.env['mrp.bom'].create({
            'productId': finished_product.id,
            'productTemplateId': finished_product.productTemplateId.id,
            'productUomId': finished_product.uomId.id,
            'productQty': 1.0,
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': component.id, 'productQty': 1}),
            ],
            'byproduct_ids': [
                (0, 0, {'productId': byproduct.id, 'productQty': 1, 'productUomId': byproduct.uomId.id})
            ]})
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = finished_product
        mo_form.bomId = bom
        mo_form.productQty = 1
        mo = mo_form.save()
        mo.action_confirm()

        sn = self.env['stock.production.lot'].create({
            'name': 'sn used twice',
            'productId': byproduct.id,
            'companyId': self.env.company.id,
        })

        mo_form = Form(mo)
        mo_form.qtyProducing = 1
        mo = mo_form.save()
        move_byproduct = mo.move_finished_ids.filtered(lambda m: m.productId != mo.productId)
        details_operation_form = Form(move_byproduct, view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.lotId = sn
        details_operation_form.save()
        mo.button_mark_done()

        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = finished_product
        mo_form.bomId = bom
        mo_form.productQty = 1
        mo2 = mo_form.save()
        mo2.action_confirm()

        mo_form = Form(mo2)
        mo_form.qtyProducing = 1
        mo2 = mo_form.save()
        move_byproduct = mo2.move_finished_ids.filtered(lambda m: m.productId != mo.productId)
        details_operation_form = Form(move_byproduct, view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.lotId = sn
        details_operation_form.save()
        with self.assertRaises(UserError):
            mo2.button_mark_done()

    def test_product_produce_duplicate_4(self):
        """ Consuming the same serial number two times should not give an error if
        a repair order of the first production has been made before the second one"""
        mo1, bom, p_final, p1, p2 = self.generate_mo(tracking_base_2='serial', qty_final=1, qty_base_1=1,)
        sn = self.env['stock.production.lot'].create({
            'name': 'sn used twice',
            'productId': p2.id,
            'companyId': self.env.company.id,
        })
        mo_form = Form(mo1)
        mo_form.qtyProducing = 1
        mo1 = mo_form.save()
        details_operation_form = Form(mo1.moveRawIds[0], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.lotId = sn
        details_operation_form.save()
        mo1.button_mark_done()

        unbuild_form = Form(self.env['mrp.unbuild'])
        unbuild_form.productId = p_final
        unbuild_form.bomId = bom
        unbuild_form.productQty = 1
        unbuild_form.moId = mo1
        unbuild_order = unbuild_form.save()
        unbuild_order.action_unbuild()

        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = p_final
        mo_form.bomId = bom
        mo_form.productQty = 1
        mo2 = mo_form.save()
        mo2.action_confirm()

        mo_form = Form(mo2)
        mo_form.qtyProducing = 1
        mo2 = mo_form.save()
        details_operation_form = Form(mo2.moveRawIds[0], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.lotId = sn
        details_operation_form.save()
        mo2.button_mark_done()

    def test_product_produce_12(self):
        """ Checks that, the production is robust against deletion of finished move."""

        self.stock_location = self.env.ref('stock.stock_location_stock')
        mo, bom, p_final, p1, p2 = self.generate_mo(qty_final=1)
        self.assertEqual(len(mo), 1, 'MO should have been created')

        mo_form = Form(mo)
        mo_form.qtyProducing = 1
        mo = mo_form.save()
        # remove the finished move from the available to be updated
        mo.move_finished_ids._action_done()
        mo.button_mark_done()

    def test_product_produce_13(self):
        """ Check that the production cannot be completed without any consumption."""
        product = self.env['product.product'].create({
            'name': 'Product no BoM',
            'type': 'product',
        })
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = product
        mo = mo_form.save()
        move = self.env['stock.move'].create({
            'name': 'mrp_move',
            'productId': self.product_2.id,
            'productUom': self.ref('uom.productUomUnit'),
            'productionId': mo.id,
            'locationId': self.ref('stock.stock_location_stock'),
            'locationDestId': self.ref('stock.stock_location_output'),
            'productUomQty': 0,
            'quantityDone': 0,
        })
        mo.moveRawIds |= move
        mo.action_confirm()

        mo.qtyProducing = 1
        # can't produce without any consumption (i.e. components w/ 0 consumed)
        with self.assertRaises(UserError):
            mo.button_mark_done()

        mo.moveRawIds.quantityDone = 1
        mo.button_mark_done()
        self.assertEqual(mo.state, 'done')

    def test_product_produce_14(self):
        """ Check two component move with the same product are not merged."""
        product = self.env['product.product'].create({
            'name': 'Product no BoM',
            'type': 'product',
        })
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = product
        mo = mo_form.save()
        for i in range(2):
            move = self.env['stock.move'].create({
                'name': 'mrp_move',
                'productId': self.product_2.id,
                'productUom': self.ref('uom.productUomUnit'),
                'productionId': mo.id,
                'locationId': self.ref('stock.stock_location_stock'),
                'locationDestId': self.ref('stock.stock_location_output'),
                'productUomQty': 0,
                'quantityDone': 0,
            })
            mo.moveRawIds |= move
        mo.action_confirm()
        self.assertEqual(len(mo.moveRawIds), 2)

    def test_product_produce_uom(self):
        """ Produce a finished product tracked by serial number. Set another
        UoM on the bom. The produce wizard should keep the UoM of the product (unit)
        and quantity = 1."""
        dozen = self.env.ref('uom.product_uom_dozen')
        unit = self.env.ref('uom.productUomUnit')
        plastic_laminate = self.env['product.product'].create({
            'name': 'Plastic Laminate',
            'type': 'product',
            'uomId': unit.id,
            'uomPoId': unit.id,
            'tracking': 'serial',
        })
        ply_veneer = self.env['product.product'].create({
            'name': 'Ply Veneer',
            'type': 'product',
            'uomId': unit.id,
            'uomPoId': unit.id,
        })
        bom = self.env['mrp.bom'].create({
            'productTemplateId': plastic_laminate.productTemplateId.id,
            'productUomId': unit.id,
            'sequence': 1,
            'bom_line_ids': [(0, 0, {
                'productId': ply_veneer.id,
                'productQty': 1,
                'productUomId': unit.id,
                'sequence': 1,
            })]
        })

        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = plastic_laminate
        mo_form.bomId = bom
        mo_form.productUomId = dozen
        mo_form.productQty = 1
        mo = mo_form.save()

        final_product_lot = self.env['stock.production.lot'].create({
            'name': 'lot1',
            'productId': plastic_laminate.id,
            'companyId': self.env.company.id,
        })

        mo.action_confirm()
        mo.action_assign()
        self.assertEqual(mo.moveRawIds.productQty, 12, '12 units should be reserved.')

        # produce product
        mo_form = Form(mo)
        mo_form.qtyProducing = 1/12.0
        mo_form.lotProducingId = final_product_lot
        mo = mo_form.save()

        move_line_raw = mo.moveRawIds.mapped('moveLineIds').filtered(lambda m: m.qtyDone)
        self.assertEqual(move_line_raw.qtyDone, 1)
        self.assertEqual(move_line_raw.productUomId, unit, 'Should be 1 unit since the tracking is serial.')

        mo._post_inventory()
        move_line_finished = mo.move_finished_ids.mapped('moveLineIds').filtered(lambda m: m.qtyDone)
        self.assertEqual(move_line_finished.qtyDone, 1)
        self.assertEqual(move_line_finished.productUomId, unit, 'Should be 1 unit since the tracking is serial.')

    def test_product_type_service_1(self):
        # Create finished product
        finished_product = self.env['product.product'].create({
            'name': 'Geyser',
            'type': 'product',
        })

        # Create service type product
        product_raw = self.env['product.product'].create({
            'name': 'raw Geyser',
            'type': 'service',
        })

        # Create bom for finish product
        bom = self.env['mrp.bom'].create({
            'productId': finished_product.id,
            'productTemplateId': finished_product.productTemplateId.id,
            'productUomId': self.env.ref('uom.productUomUnit').id,
            'productQty': 1.0,
            'type': 'normal',
            'bom_line_ids': [(5, 0), (0, 0, {'productId': product_raw.id})]
        })

        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = finished_product
        mo_form.bomId = bom
        mo_form.productUomId = self.env.ref('uom.productUomUnit')
        mo_form.productQty = 1
        mo = mo_form.save()

        # Check Mo is created or not
        self.assertTrue(mo, "Mo is created")

    def test_immediate_validate_1(self):
        """ In a production with a single available move raw, clicking on mark as done without filling any
        quantities should open a wizard asking to process all the reservation (so, the whole move).
        """
        mo, bom, p_final, p1, p2 = self.generate_mo(qty_final=1, qty_base_1=1, qty_base_2=1)
        self.env['stock.quant']._update_available_quantity(p1, self.stock_location_components, 5.0)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location_components, 5.0)
        mo.action_assign()
        res_dict = mo.button_mark_done()
        self.assertEqual(res_dict.get('resModel'), 'mrp.immediate.production')
        wizard = Form(self.env[res_dict['resModel']].withContext(res_dict['context'])).save()
        wizard.process()
        self.assertEqual(mo.moveRawIds.mapped('state'), ['done', 'done'])
        self.assertEqual(mo.moveRawIds.mapped('quantityDone'), [1, 1])
        self.assertEqual(mo.move_finished_ids.state, 'done')
        self.assertEqual(mo.move_finished_ids.quantityDone, 1)

    def test_immediate_validate_2(self):
        """ In a production with a single available move raw, clicking on mark as done after filling quantity
        for a stock move only will trigger an error as qtyProducing is left to 0."""
        mo, bom, p_final, p1, p2 = self.generate_mo(qty_final=1, qty_base_1=1, qty_base_2=1)
        self.env['stock.quant']._update_available_quantity(p1, self.stock_location_components, 5.0)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location_components, 5.0)
        mo.action_assign()
        details_operation_form = Form(mo.moveRawIds[0], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.qtyDone = 1
        details_operation_form.save()
        with self.assertRaises(UserError):
            res_dict = mo.button_mark_done()

    def test_immediate_validate_3(self):
        """ In a production with a serial number tracked product. Check that the immediate production only creates
        one unit of finished product. Test with reservation."""
        mo, bom, p_final, p1, p2 = self.generate_mo(tracking_final='serial', qty_final=2, qty_base_1=1, qty_base_2=1)
        self.env['stock.quant']._update_available_quantity(p1, self.stock_location_components, 5.0)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location_components, 5.0)
        mo.action_assign()
        action = mo.button_mark_done()
        self.assertEqual(action.get('resModel'), 'mrp.immediate.production')
        wizard = Form(self.env[action['resModel']].withContext(action['context'])).save()
        action = wizard.process()
        self.assertEqual(action.get('resModel'), 'mrp.production.backorder')
        wizard = Form(self.env[action['resModel']].withContext(action['context'])).save()
        action = wizard.action_backorder()
        self.assertEqual(mo.qtyProducing, 1)
        self.assertEqual(mo.moveRawIds.mapped('quantityDone'), [1, 1])
        self.assertEqual(len(mo.procurementGroupId.mrpProductionIds), 2)
        mo_backorder = mo.procurementGroupId.mrpProductionIds[-1]
        self.assertEqual(mo_backorder.productQty, 1)
        self.assertEqual(mo_backorder.moveRawIds.mapped('productUomQty'), [1, 1])

    def test_immediate_validate_4(self):
        """ In a production with a serial number tracked product. Check that the immediate production only creates
        one unit of finished product. Test without reservation."""
        mo, bom, p_final, p1, p2 = self.generate_mo(tracking_final='serial', qty_final=2, qty_base_1=1, qty_base_2=1)
        self.env['stock.quant']._update_available_quantity(p1, self.stock_location_components, 5.0)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location_components, 5.0)
        action = mo.button_mark_done()
        self.assertEqual(action.get('resModel'), 'mrp.immediate.production')
        wizard = Form(self.env[action['resModel']].withContext(action['context'])).save()
        action = wizard.process()
        self.assertEqual(action.get('resModel'), 'mrp.production.backorder')
        wizard = Form(self.env[action['resModel']].withContext(action['context'])).save()
        action = wizard.action_backorder()
        self.assertEqual(mo.qtyProducing, 1)
        self.assertEqual(mo.moveRawIds.mapped('quantityDone'), [1, 1])
        self.assertEqual(len(mo.procurementGroupId.mrpProductionIds), 2)
        mo_backorder = mo.procurementGroupId.mrpProductionIds[-1]
        self.assertEqual(mo_backorder.productQty, 1)
        self.assertEqual(mo_backorder.moveRawIds.mapped('productUomQty'), [1, 1])

    def test_immediate_validate_5(self):
        """Validate three productions at once."""
        mo1, bom, p_final, p1, p2 = self.generate_mo(qty_final=1, qty_base_1=1, qty_base_2=1)
        self.env['stock.quant']._update_available_quantity(p1, self.stock_location_components, 5.0)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location_components, 5.0)
        mo1.action_assign()
        mo2_form = Form(self.env['mrp.production'])
        mo2_form.productId = p_final
        mo2_form.bomId = bom
        mo2_form.productQty = 1
        mo2 = mo2_form.save()
        mo2.action_confirm()
        mo2.action_assign()
        mo3_form = Form(self.env['mrp.production'])
        mo3_form.productId = p_final
        mo3_form.bomId = bom
        mo3_form.productQty = 1
        mo3 = mo3_form.save()
        mo3.action_confirm()
        mo3.action_assign()
        mos = mo1 | mo2 | mo3
        res_dict = mos.button_mark_done()
        self.assertEqual(res_dict.get('resModel'), 'mrp.immediate.production')
        wizard = Form(self.env[res_dict['resModel']].withContext(res_dict['context'])).save()
        wizard.process()
        self.assertEqual(mos.moveRawIds.mapped('state'), ['done'] * 6)
        self.assertEqual(mos.moveRawIds.mapped('quantityDone'), [1] * 6)
        self.assertEqual(mos.move_finished_ids.mapped('state'), ['done'] * 3)
        self.assertEqual(mos.move_finished_ids.mapped('quantityDone'), [1] * 3)

    def test_components_availability(self):
        self.bom_2.unlink()  # remove the kit bom of product_5 
        now = fields.Datetime.now()
        mo_form = Form(self.env['mrp.production'])
        mo_form.bomId = self.bom_3  # product_5 (2), product_4 (8), product_2 (12)
        mo_form.datePlannedStart = now
        mo = mo_form.save()
        self.assertEqual(mo.components_availability, False)  # no compute for draft
        mo.action_confirm()
        self.assertEqual(mo.components_availability, 'Not Available')

        tommorrow = fields.Datetime.now() + timedelta(days=1)
        after_tommorrow = fields.Datetime.now() + timedelta(days=2)
        warehouse = self.env.ref('stock.warehouse0')
        move1 = self._create_move(
            self.product_5, self.env.ref('stock.stock_location_suppliers'), warehouse.lot_stock_id,
            productUomQty=2, date=tommorrow
        )
        move2 = self._create_move(
            self.product_4, self.env.ref('stock.stock_location_suppliers'), warehouse.lot_stock_id,
            productUomQty=8, date=tommorrow
        )
        move3 = self._create_move(
            self.product_2, self.env.ref('stock.stock_location_suppliers'), warehouse.lot_stock_id,
            productUomQty=12, date=tommorrow
        )
        (move1 | move2 | move3)._action_confirm()

        mo.invalidate_cache(['components_availability', 'componentsAvailabilityState'], mo.ids)
        self.assertEqual(mo.components_availability, f'Exp {format_date(self.env, tommorrow)}')
        self.assertEqual(mo.componentsAvailabilityState, 'late')

        mo.datePlannedStart = after_tommorrow

        self.assertEqual(mo.components_availability, f'Exp {format_date(self.env, tommorrow)}')
        self.assertEqual(mo.componentsAvailabilityState, 'expected')

        (move1 | move2 | move3)._set_quantities_to_reservation()
        (move1 | move2 | move3)._action_done()

        mo.invalidate_cache(['components_availability', 'componentsAvailabilityState'], mo.ids)
        self.assertEqual(mo.components_availability, 'Available')
        self.assertEqual(mo.componentsAvailabilityState, 'available')

        mo.action_assign()

        self.assertEqual(mo.reservationState, 'assigned')
        self.assertEqual(mo.components_availability, 'Available')
        self.assertEqual(mo.componentsAvailabilityState, 'available')


    def test_immediate_validate_6(self):
        """In a production for a tracked product, clicking on mark as done without filling any quantities should
        pop up the immediate transfer wizard. Processing should choose a new lot for the finished product. """
        mo, bom, p_final, p1, p2 = self.generate_mo(qty_final=1, qty_base_1=1, qty_base_2=1, tracking_final='lot')
        self.env['stock.quant']._update_available_quantity(p1, self.stock_location_components, 5.0)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location_components, 5.0)
        mo.action_assign()
        res_dict = mo.button_mark_done()
        self.assertEqual(res_dict.get('resModel'), 'mrp.immediate.production')
        wizard = Form(self.env[res_dict['resModel']].withContext(res_dict['context'])).save()
        wizard.process()
        self.assertEqual(mo.moveRawIds.mapped('state'), ['done'] * 2)
        self.assertEqual(mo.moveRawIds.mapped('quantityDone'), [1] * 2)
        self.assertEqual(mo.move_finished_ids.state, 'done')
        self.assertEqual(mo.move_finished_ids.quantityDone, 1)
        self.assertTrue(mo.move_finished_ids.moveLineIds.lotId != False)

    def test_immediate_validate_uom(self):
        """In a production with a different uom than the finished product one, the
        immediate production wizard should fill the correct quantities. """
        p_final = self.env['product.product'].create({
            'name': 'final',
            'type': 'product',
        })
        component = self.env['product.product'].create({
            'name': 'component',
            'type': 'product',
        })
        bom = self.env['mrp.bom'].create({
            'productId': p_final.id,
            'productTemplateId': p_final.productTemplateId.id,
            'productUomId': self.uom_unit.id,
            'productQty': 1.0,
            'type': 'normal',
            'consumption': 'flexible',
            'bom_line_ids': [(0, 0, {'productId': component.id, 'productQty': 1})]
        })
        self.env['stock.quant']._update_available_quantity(component, self.stock_location_components, 25.0)
        mo_form = Form(self.env['mrp.production'])
        mo_form.bomId = bom
        mo_form.productUomId = self.uom_dozen
        mo_form.productQty = 1
        mo = mo_form.save()
        mo.action_confirm()
        mo.action_assign()
        res_dict = mo.button_mark_done()
        self.assertEqual(res_dict.get('resModel'), 'mrp.immediate.production')
        wizard = Form(self.env[res_dict['resModel']].withContext(res_dict['context'])).save()
        wizard.process()
        self.assertEqual(mo.moveRawIds.state, 'done')
        self.assertEqual(mo.moveRawIds.quantityDone, 12)
        self.assertEqual(mo.move_finished_ids.state, 'done')
        self.assertEqual(mo.move_finished_ids.quantityDone, 1)
        self.assertEqual(component.qty_available, 13)

    def test_immediate_validate_uom_2(self):
        """The rounding precision of a component should be based on the UoM used in the MO for this component,
        not on the produced product's UoM nor the default UoM of the component"""
        uom_units = self.env.ref('uom.productUomUnit')
        uom_L = self.env.ref('uom.product_uom_litre')
        uom_cL = self.env['uom.uom'].create({
            'name': 'cL',
            'categoryId': uom_L.categoryId.id,
            'uom_type': 'smaller',
            'factor': 100,
            'rounding': 1,
        })
        uom_units.rounding = 1
        uom_L.rounding = 0.01

        product = self.env['product.product'].create({
            'name': 'SuperProduct',
            'uomId': uom_units.id,
        })
        consumable_component = self.env['product.product'].create({
            'name': 'Consumable Component',
            'type': 'consu',
            'uomId': uom_cL.id,
            'uomPoId': uom_cL.id,
        })
        storable_component = self.env['product.product'].create({
            'name': 'Storable Component',
            'type': 'product',
            'uomId': uom_cL.id,
            'uomPoId': uom_cL.id,
        })
        self.env['stock.quant']._update_available_quantity(storable_component, self.env.ref('stock.stock_location_stock'), 100)

        for component in [consumable_component, storable_component]:
            bom = self.env['mrp.bom'].create({
                'productTemplateId': product.productTemplateId.id,
                'bom_line_ids': [(0, 0, {
                    'productId': component.id,
                    'productQty': 0.2,
                    'productUomId': uom_L.id,
                })],
            })

            mo_form = Form(self.env['mrp.production'])
            mo_form.bomId = bom
            mo = mo_form.save()
            mo.action_confirm()
            action = mo.button_mark_done()
            self.assertEqual(action.get('resModel'), 'mrp.immediate.production')
            wizard = Form(self.env[action['resModel']].withContext(action['context'])).save()
            action = wizard.process()

            self.assertEqual(mo.moveRawIds.productUomQty, 0.2)
            self.assertEqual(mo.moveRawIds.quantityDone, 0.2)

    def test_copy(self):
        """ Check that copying a done production, create all the stock moves"""
        mo, bom, p_final, p1, p2 = self.generate_mo(qty_final=1, qty_base_1=1, qty_base_2=1)
        mo.action_confirm()
        mo_form = Form(mo)
        mo_form.qtyProducing = 1
        mo = mo_form.save()
        mo.button_mark_done()
        self.assertEqual(mo.state, 'done')
        mo_copy = mo.copy()
        self.assertTrue(mo_copy.moveRawIds)
        self.assertTrue(mo_copy.move_finished_ids)
        mo_copy.action_confirm()
        mo_form = Form(mo_copy)
        mo_form.qtyProducing = 1
        mo_copy = mo_form.save()
        mo_copy.button_mark_done()
        self.assertEqual(mo_copy.state, 'done')

    def test_product_produce_different_uom(self):
        """ Check that for products tracked by lots,
        with component product UOM different from UOM used in the BOM,
        we do not create a new move line due to extra reserved quantity
        caused by decimal rounding conversions.
        """

        # the overall decimal accuracy is set to 3 digits
        precision = self.env.ref('product.decimal_product_uom')
        precision.digits = 3

        # define L and ml, L has rounding .001 but ml has rounding .01
        # when producing e.g. 187.5ml, it will be rounded to .188L
        categ_test = self.env['uom.category'].create({'name': 'Volume Test'})

        uom_L = self.env['uom.uom'].create({
            'name': 'Test Liters',
            'categoryId': categ_test.id,
            'uom_type': 'reference',
            'rounding': 0.001
        })

        uom_ml = self.env['uom.uom'].create({
            'name': 'Test ml',
            'categoryId': categ_test.id,
            'uom_type': 'smaller',
            'rounding': 0.01,
            'factor_inv': 0.001,
        })

        # create a product component and the final product using the component
        product_comp = self.env['product.product'].create({
            'name': 'Product Component',
            'type': 'product',
            'tracking': 'lot',
            'categId': self.env.ref('product.product_category_all').id,
            'uomId': uom_L.id,
            'uomPoId': uom_L.id,
        })

        product_final = self.env['product.product'].create({
            'name': 'Product Final',
            'type': 'product',
            'tracking': 'lot',
            'categId': self.env.ref('product.product_category_all').id,
            'uomId': uom_L.id,
            'uomPoId': uom_L.id,
        })

        # the products are tracked by lot, so we go through _generate_consumed_move_line
        lot_final = self.env['stock.production.lot'].create({
            'name': 'Lot Final',
            'productId': product_final.id,
            'companyId': self.env.company.id,
        })

        lot_comp = self.env['stock.production.lot'].create({
            'name': 'Lot Component',
            'productId': product_comp.id,
            'companyId': self.env.company.id,
        })

        # update the quantity on hand for Component, in a lot
        self.stock_location = self.env.ref('stock.stock_location_stock')
        self.env['stock.quant']._update_available_quantity(product_comp, self.stock_location, 1, lotId=lot_comp)

        # create a BOM for Final, using Component
        test_bom = self.env['mrp.bom'].create({
            'productId': product_final.id,
            'productTemplateId': product_final.productTemplateId.id,
            'productUomId': uom_L.id,
            'productQty': 1.0,
            'type': 'normal',
            'bom_line_ids': [(0, 0, {
                'productId': product_comp.id,
                'productQty': 375.00,
                'productUomId': uom_ml.id
            })],
        })

        # create a MO for this BOM
        mo_product_final_form = Form(self.env['mrp.production'])
        mo_product_final_form.productId = product_final
        mo_product_final_form.productUomId = uom_L
        mo_product_final_form.bomId = test_bom
        mo_product_final_form.productQty = 0.5
        mo_product_final_form = mo_product_final_form.save()

        mo_product_final_form.action_confirm()
        mo_product_final_form.action_assign()
        self.assertEqual(mo_product_final_form.reservationState, 'assigned')

        # produce
        res_dict = mo_product_final_form.button_mark_done()
        self.assertEqual(res_dict.get('resModel'), 'mrp.immediate.production')
        wizard = Form(self.env[res_dict['resModel']].withContext(res_dict['context'])).save()
        wizard.process()

        # check that in _generate_consumed_move_line,
        # we do not create an extra move line because
        # of a conversion 187.5ml = 0.188L
        # thus creating an extra line with 'productUomQty': 0.5
        self.assertEqual(len(mo_product_final_form.moveRawIds.moveLineIds), 1, 'One move line should exist for the MO.')

    def test_mo_sn_warning(self):
        """ Checks that when a MO where the final product is tracked by serial, a warning pops up if
        the `lot_producting_id` has previously been used already (i.e. dupe SN). Also checks if a
        scrap linked to a MO has its sn warning correctly pop up.
        """
        self.stock_location = self.env.ref('stock.stock_location_stock')
        mo, _, p_final, _, _ = self.generate_mo(tracking_final='serial', qty_base_1=1, qty_final=1)
        self.assertEqual(len(mo), 1, 'MO should have been created')

        sn1 = self.env['stock.production.lot'].create({
            'name': 'serial1',
            'productId': p_final.id,
            'companyId': self.env.company.id,
        })

        self.env['stock.quant']._update_available_quantity(p_final, self.stock_location, 1, lotId=sn1)
        mo.lotProducingId = sn1

        warning = False
        warning = mo._onchange_lot_producing()
        self.assertTrue(warning, 'Reuse of existing serial number not detected')
        self.assertEqual(list(warning.keys())[0], 'warning', 'Warning message was not returned')

        mo.action_generate_serial()
        sn2 = mo.lotProducingId
        mo.button_mark_done()

        # scrap linked to MO but with wrong SN location
        scrap = self.env['stock.scrap'].create({
            'productId': p_final.id,
            'productUomId': self.uom_unit.id,
            'productionId': mo.id,
            'locationId': self.stock_location_14.id,
            'lotId': sn2.id
        })

        warning = False
        warning = scrap._onchange_serial_number()
        self.assertTrue(warning, 'Use of wrong serial number location not detected')
        self.assertEqual(list(warning.keys())[0], 'warning', 'Warning message was not returned')
        self.assertEqual(scrap.locationId, mo.locationDestId, 'Location was not auto-corrected')

    def test_a_multi_button_plan(self):
        """ Test batch methods (confirm/validate) of the MO with the same bom """
        self.bom_2.type = "normal"  # avoid to get the operation of the kit bom

        mo_3 = Form(self.env['mrp.production'])
        mo_3.bomId = self.bom_3
        mo_3 = mo_3.save()

        self.assertEqual(len(mo_3.workorderIds), 2)

        mo_3.button_plan()
        self.assertEqual(mo_3.state, 'confirmed')
        self.assertEqual(mo_3.workorderIds[0].state, 'waiting')

        mo_1 = Form(self.env['mrp.production'])
        mo_1.bomId = self.bom_3
        mo_1 = mo_1.save()

        mo_2 = Form(self.env['mrp.production'])
        mo_2.bomId = self.bom_3
        mo_2 = mo_2.save()

        self.assertEqual(mo_1.productId, self.product_6)
        self.assertEqual(mo_2.productId, self.product_6)
        self.assertEqual(len(self.bom_3.operationIds), 2)
        self.assertEqual(len(mo_1.workorderIds), 2)
        self.assertEqual(len(mo_2.workorderIds), 2)

        (mo_1 | mo_2).button_plan()  # Confirm and plan in the same "request"
        self.assertEqual(mo_1.state, 'confirmed')
        self.assertEqual(mo_2.state, 'confirmed')
        self.assertEqual(mo_1.workorderIds[0].state, 'waiting')
        self.assertEqual(mo_2.workorderIds[0].state, 'waiting')

        # produce
        res_dict = (mo_1 | mo_2).button_mark_done()
        self.assertEqual(res_dict.get('resModel'), 'mrp.immediate.production')
        wizard = Form(self.env[res_dict['resModel']].withContext(res_dict['context'])).save()
        wizard.process()
        self.assertEqual(mo_1.state, 'done')
        self.assertEqual(mo_2.state, 'done')

    def test_workcenter_timezone(self):
        # Workcenter is based in Bangkok
        # Possible working hours are Monday to Friday, from 8:00 to 12:00 and from 13:00 to 17:00 (UTC+7)
        workcenter = self.workcenter_1
        workcenter.resourceCalendarId.tz = 'Asia/Bangkok'

        bom = self.env['mrp.bom'].create({
            'productTemplateId': self.product_1.productTemplateId.id,
            'bom_line_ids': [(0, 0, {
                'productId': self.product_2.id,
            })],
            'operationIds': [(0, 0, {
                'name': 'SuperOperation01',
                'workcenterId': workcenter.id,
            }), (0, 0, {
                'name': 'SuperOperation01',
                'workcenterId': workcenter.id,
            })],
        })

        # Next Monday at 6:00 am UTC
        date_planned = (fields.Datetime.now() + timedelta(days=7 - fields.Datetime.now().weekday())).replace(hour=6, minute=0, second=0)
        mo_form = Form(self.env['mrp.production'])
        mo_form.bomId = bom
        mo_form.datePlannedStart = date_planned
        mo = mo_form.save()

        mo.workorderIds[0].durationExpected = 240
        mo.workorderIds[1].durationExpected = 60

        mo.action_confirm()
        mo.button_plan()

        # Asia/Bangkok is UTC+7 and the start date is on Monday at 06:00 UTC (i.e., 13:00 UTC+7).
        # So, in Bangkok, the first workorder uses the entire Monday afternoon slot 13:00 - 17:00 UTC+7 (i.e., 06:00 - 10:00 UTC)
        # The second job uses the beginning of the Tuesday morning slot: 08:00 - 09:00 UTC+7 (i.e., 01:00 - 02:00 UTC)
        self.assertEqual(mo.workorderIds[0].datePlannedStart, date_planned)
        self.assertEqual(mo.workorderIds[0].datePlannedFinished, date_planned + timedelta(hours=4))
        tuesday = date_planned + timedelta(days=1)
        self.assertEqual(mo.workorderIds[1].datePlannedStart, tuesday.replace(hour=1))
        self.assertEqual(mo.workorderIds[1].datePlannedFinished, tuesday.replace(hour=2))

    def test_backorder_with_overconsumption(self):
        """ Check that the components of the backorder have the correct quantities
        when there is overconsumption in the initial MO
        """
        mo, _, _, _, _ = self.generate_mo(qty_final=30, qty_base_1=2, qty_base_2=3)
        mo.action_confirm()
        mo.qtyProducing = 10
        mo.moveRawIds[0].quantityDone = 90
        mo.moveRawIds[1].quantityDone = 70
        action = mo.button_mark_done()
        backorder = Form(self.env['mrp.production.backorder'].withContext(**action['context']))
        backorder.save().action_backorder()
        mo_backorder = mo.procurementGroupId.mrpProductionIds[-1]

        # Check quantities of the original MO
        self.assertEqual(mo.productUomQty, 10.0)
        self.assertEqual(mo.qty_produced, 10.0)
        move_prod_1 = self.env['stock.move'].search([
            ('productId', '=', mo.bomId.bom_line_ids[0].productId.id),
            ('raw_material_production_id', '=', mo.id)])
        move_prod_2 = self.env['stock.move'].search([
            ('productId', '=', mo.bomId.bom_line_ids[1].productId.id),
            ('raw_material_production_id', '=', mo.id)])
        self.assertEqual(sum(move_prod_1.mapped('quantityDone')), 90.0)
        self.assertEqual(sum(move_prod_1.mapped('productUomQty')), 90.0)
        self.assertEqual(sum(move_prod_2.mapped('quantityDone')), 70.0)
        self.assertEqual(sum(move_prod_2.mapped('productUomQty')), 70.0)

        # Check quantities of the backorder MO
        self.assertEqual(mo_backorder.productUomQty, 20.0)
        move_prod_1_bo = self.env['stock.move'].search([
            ('productId', '=', mo.bomId.bom_line_ids[0].productId.id),
            ('raw_material_production_id', '=', mo_backorder.id)])
        move_prod_2_bo = self.env['stock.move'].search([
            ('productId', '=', mo.bomId.bom_line_ids[1].productId.id),
            ('raw_material_production_id', '=', mo_backorder.id)])
        self.assertEqual(sum(move_prod_1_bo.mapped('productUomQty')), 60.0)
        self.assertEqual(sum(move_prod_2_bo.mapped('productUomQty')), 40.0)

    def test_backorder_with_underconsumption(self):
        """ Check that the components of the backorder have the correct quantities
        when there is underconsumption in the initial MO
        """
        mo, _, _, p1, p2 = self.generate_mo(qty_final=20, qty_base_1=1, qty_base_2=1)
        mo.action_confirm()
        mo.qtyProducing = 10
        mo.moveRawIds.filtered(lambda m: m.productId == p1).quantityDone = 5
        mo.moveRawIds.filtered(lambda m: m.productId == p2).quantityDone = 10
        action = mo.button_mark_done()
        backorder = Form(self.env['mrp.production.backorder'].withContext(**action['context']))
        backorder.save().action_backorder()
        mo_backorder = mo.procurementGroupId.mrpProductionIds[-1]

        # Check quantities of the original MO
        self.assertEqual(mo.productUomQty, 10.0)
        self.assertEqual(mo.qty_produced, 10.0)
        move_prod_1_done = mo.moveRawIds.filtered(lambda m: m.productId == p1 and m.state == 'done')
        self.assertEqual(sum(move_prod_1_done.mapped('quantityDone')), 5)
        self.assertEqual(sum(move_prod_1_done.mapped('productUomQty')), 5)
        move_prod_1_cancel = mo.moveRawIds.filtered(lambda m: m.productId == p1 and m.state == 'cancel')
        self.assertEqual(sum(move_prod_1_cancel.mapped('quantityDone')), 0)
        self.assertEqual(sum(move_prod_1_cancel.mapped('productUomQty')), 5)
        move_prod_2 = mo.moveRawIds.filtered(lambda m: m.productId == p2)
        self.assertEqual(sum(move_prod_2.mapped('quantityDone')), 10)
        self.assertEqual(sum(move_prod_2.mapped('productUomQty')), 10)

        # Check quantities of the backorder MO
        self.assertEqual(mo_backorder.productUomQty, 10.0)
        move_prod_1_bo = mo_backorder.moveRawIds.filtered(lambda m: m.productId == p1)
        move_prod_2_bo = mo_backorder.moveRawIds.filtered(lambda m: m.productId == p2)
        self.assertEqual(sum(move_prod_1_bo.mapped('productUomQty')), 10.0)
        self.assertEqual(sum(move_prod_2_bo.mapped('productUomQty')), 10.0)

    def test_state_workorders(self):
        bom = self.env['mrp.bom'].create({
            'productId': self.product_4.id,
            'productTemplateId': self.product_4.productTemplateId.id,
            'productUomId': self.uom_unit.id,
            'productQty': 1.0,
            'consumption': 'flexible',
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': self.product_2.id, 'productQty': 1})
            ],
            'operationIds': [
                (0, 0, {'name': 'amUgbidhaW1lIHBhcyBsZSBKUw==', 'workcenterId': self.workcenter_1.id, 'timeCycle': 15, 'sequence': 1}),
                (0, 0, {'name': '137 Python', 'workcenterId': self.workcenter_1.id, 'timeCycle': 1, 'sequence': 2}),
            ],
        })

        self.env['stock.quant'].create({
            'locationId': self.stock_location_components.id,
            'productId': self.product_2.id,
            'inventoryQuantity': 10
        }).action_apply_inventory()

        mo = Form(self.env['mrp.production'])
        mo.bomId = bom
        mo = mo.save()

        self.assertEqual(list(mo.workorderIds.mapped("state")), ["pending", "pending"])

        mo.action_confirm()
        mo.action_assign()
        self.assertEqual(mo.moveRawIds.state, "assigned")
        self.assertEqual(list(mo.workorderIds.mapped("state")), ["ready", "pending"])
        mo.do_unreserve()

        self.assertEqual(list(mo.workorderIds.mapped("state")), ["waiting", "pending"])

        mo.workorderIds[0].unlink()

        self.assertEqual(list(mo.workorderIds.mapped("state")), ["waiting"])
        mo.action_assign()
        self.assertEqual(list(mo.workorderIds.mapped("state")), ["ready"])

        res_dict = mo.button_mark_done()
        self.assertEqual(res_dict.get('resModel'), 'mrp.immediate.production')
        wizard = Form(self.env[res_dict['resModel']].withContext(res_dict['context'])).save()
        wizard.process()
        self.assertEqual(list(mo.workorderIds.mapped("state")), ["done"])

    def test_products_with_variants(self):
        """Check for product with different variants with same bom"""
        product = self.env['product.template'].create({
            "attribute_line_ids": [
                [0, 0, {"attribute_id": 2, "value_ids": [[6, 0, [3, 4]]]}]
            ],
            "name": "Product with variants",
        })

        variant_1 = product.productVariantIds[0]
        variant_2 = product.productVariantIds[1]

        component = self.env['product.template'].create({
            "name": "Component",
        })

        self.env['mrp.bom'].create({
            'productId': False,
            'productTemplateId': product.id,
            'bom_line_ids': [
                (0, 0, {'productId': component.product_variant_id.id, 'productQty': 1})
            ]
        })

        # First behavior to check, is changing the product (same product but another variant) after saving the MO a first time.
        mo_form_1 = Form(self.env['mrp.production'])
        mo_form_1.productId = variant_1
        mo_1 = mo_form_1.save()
        mo_form_1 = Form(self.env['mrp.production'].browse(mo_1.id))
        mo_form_1.productId = variant_2
        mo_1 = mo_form_1.save()
        mo_1.action_confirm()
        mo_1.action_assign()
        mo_form_1 = Form(self.env['mrp.production'].browse(mo_1.id))
        mo_form_1.qtyProducing = 1
        mo_1 = mo_form_1.save()
        mo_1.button_mark_done()

        move_lines_1 = self.env['stock.move.line'].search([("reference", "=", mo_1.name)])
        move_finished_ids_1 = self.env['stock.move'].search([("productionId", "=", mo_1.id)])
        self.assertEqual(len(move_lines_1), 2, "There should only be 2 move lines: the component line and produced product line")
        self.assertEqual(len(move_finished_ids_1), 1, "There should only be 1 produced product for this MO")
        self.assertEqual(move_finished_ids_1.productId, variant_2, "Incorrect variant produced")

        # Second behavior is changing the product before saving the MO
        mo_form_2 = Form(self.env['mrp.production'])
        mo_form_2.productId = variant_1
        mo_form_2.productId = variant_2
        mo_2 = mo_form_2.save()
        mo_2.action_confirm()
        mo_2.action_assign()
        mo_form_2 = Form(self.env['mrp.production'].browse(mo_2.id))
        mo_form_2.qtyProducing = 1
        mo_2 = mo_form_2.save()
        mo_2.button_mark_done()

        move_lines_2 = self.env['stock.move.line'].search([("reference", "=", mo_2.name)])
        move_finished_ids_2 = self.env['stock.move'].search([("productionId", "=", mo_2.id)])
        self.assertEqual(len(move_lines_2), 2, "There should only be 2 move lines: the component line and produced product line")
        self.assertEqual(len(move_finished_ids_2), 1, "There should only be 1 produced product for this MO")
        self.assertEqual(move_finished_ids_2.productId, variant_2, "Incorrect variant produced")

        # Third behavior is changing the product before saving the MO, then another time after
        mo_form_3 = Form(self.env['mrp.production'])
        mo_form_3.productId = variant_1
        mo_form_3.productId = variant_2
        mo_3 = mo_form_3.save()
        mo_form_3 = Form(self.env['mrp.production'].browse(mo_3.id))
        mo_form_3.productId = variant_1
        mo_3 = mo_form_3.save()
        mo_3.action_confirm()
        mo_3.action_assign()
        mo_form_3 = Form(self.env['mrp.production'].browse(mo_3.id))
        mo_form_3.qtyProducing = 1
        mo_3 = mo_form_3.save()
        mo_3.button_mark_done()

        move_lines_3 = self.env['stock.move.line'].search([("reference", "=", mo_3.name)])
        move_finished_ids_3 = self.env['stock.move'].search([("productionId", "=", mo_3.id)])
        self.assertEqual(len(move_lines_3), 2, "There should only be 2 move lines: the component line and produced product line")
        self.assertEqual(len(move_finished_ids_3), 1, "There should only be 1 produced product for this MO")
        self.assertEqual(move_finished_ids_3.productId, variant_1, "Incorrect variant produced")

    def test_manufacturing_order_with_work_orders(self):
        """Test the behavior of a manufacturing order when opening the workorder related to it,
           as well as the behavior when a backorder is created
           """
        # create a few work centers
        work_center_1 = self.env['mrp.workcenter'].create({"name": "WC1"})
        work_center_2 = self.env['mrp.workcenter'].create({"name": "WC2"})
        work_center_3 = self.env['mrp.workcenter'].create({"name": "WC3"})

        # create a product, a bom related to it with 3 components and 3 operations
        product = self.env['product.template'].create({"name": "Product"})
        component_1 = self.env['product.template'].create({"name": "Component 1", "type": "product"})
        component_2 = self.env['product.template'].create({"name": "Component 2", "type": "product"})
        component_3 = self.env['product.template'].create({"name": "Component 3", "type": "product"})

        self.env['stock.quant'].create({
            "productId": component_1.product_variant_id.id,
            "locationId": 8,
            "quantity": 100
        })
        self.env['stock.quant'].create({
            "productId": component_2.product_variant_id.id,
            "locationId": 8,
            "quantity": 100
        })
        self.env['stock.quant'].create({
            "productId": component_3.product_variant_id.id,
            "locationId": 8,
            "quantity": 100
        })

        self.env['mrp.bom'].create({
            "productTemplateId": product.id,
            "productId": False,
            "productQty": 1,
            "bom_line_ids": [
                [0, 0, {"productId": component_1.product_variant_id.id, "productQty": 1}],
                [0, 0, {"productId": component_2.product_variant_id.id, "productQty": 1}],
                [0, 0, {"productId": component_3.product_variant_id.id, "productQty": 1}]
            ],
            "operationIds": [
                [0, 0, {"name": "Operation 1", "workcenterId": work_center_1.id}],
                [0, 0, {"name": "Operation 2", "workcenterId": work_center_2.id}],
                [0, 0, {"name": "Operation 3", "workcenterId": work_center_3.id}]
            ]
        })

        # create a manufacturing order with 10 product to produce
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = product.product_variant_id
        mo_form.productQty = 10
        mo = mo_form.save()

        self.assertEqual(mo.state, 'draft')
        mo.action_confirm()

        wo_1 = mo.workorderIds[0]
        wo_2 = mo.workorderIds[1]
        wo_3 = mo.workorderIds[2]
        self.assertEqual(mo.state, 'confirmed')
        self.assertEqual(wo_1.state, 'ready')

        durationExpected = wo_1.durationExpected
        wo_1.button_start()
        wo_1.qtyProducing = 10
        self.assertEqual(mo.state, 'progress')
        wo_1.button_finish()
        self.assertEqual(durationExpected, wo_1.durationExpected)

        durationExpected = wo_2.durationExpected
        wo_2.button_start()
        wo_2.qtyProducing = 8
        wo_2.button_finish()
        self.assertEqual(durationExpected, wo_2.durationExpected)

        durationExpected = wo_3.durationExpected
        wo_3.button_start()
        wo_3.qtyProducing = 8
        wo_3.button_finish()
        self.assertEqual(durationExpected, wo_3.durationExpected)

        self.assertEqual(mo.state, 'toClose')
        mo.button_mark_done()

        bo = self.env['mrp.production.backorder'].create({
            "mrp_production_backorder_line_ids": [
                [0, 0, {"mrp_production_id": mo.id, "to_backorder": True}]
            ]
        })
        bo.action_backorder()

        self.assertEqual(mo.state, 'done')

        mo_2 = self.env['mrp.production'].browse(mo.id + 1)
        self.assertEqual(mo_2.state, 'progress')
        wo_4, wo_5, wo_6 = mo_2.workorderIds

        self.assertEqual(wo_4.state, 'cancel')

        wo_5.button_start()
        self.assertEqual(mo_2.state, 'progress')
        wo_5.button_finish()

        wo_6.button_start()
        wo_6.button_finish()
        self.assertEqual(mo_2.state, 'toClose')
        mo_2.button_mark_done()
        self.assertEqual(mo_2.state, 'done')

    def test_move_finished_onchanges(self):
        """ Test that move_finished_ids (i.e. produced products) are still correct even after
        multiple onchanges have changed the the moves
        """

        product1 = self.env['product.product'].create({
            'name': 'Oatmeal Cookie',
        })
        product2 = self.env['product.product'].create({
            'name': 'Chocolate Chip Cookie',
        })

        # ===== productId onchange checks ===== #
        # check productId onchange without saving
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = product1
        mo_form.productId = product2
        mo = mo_form.save()
        self.assertEqual(len(mo.move_finished_ids), 1, 'Wrong number of finished product moves created')
        self.assertEqual(mo.move_finished_ids.productId, product2, 'Wrong product to produce in finished product move')
        # check productId onchange after saving
        mo_form = Form(self.env['mrp.production'].browse(mo.id))
        mo_form.productId = product1
        mo = mo_form.save()
        self.assertEqual(len(mo.move_finished_ids), 1, 'Wrong number of finish product moves created')
        self.assertEqual(mo.move_finished_ids.productId, product1, 'Wrong product to produce in finished product move')
        # check productId onchange when mo._origin.productId is unchanged
        mo_form = Form(self.env['mrp.production'].browse(mo.id))
        mo_form.productId = product2
        mo_form.productId = product1
        mo = mo_form.save()
        self.assertEqual(len(mo.move_finished_ids), 1, 'Wrong number of finish product moves created')
        self.assertEqual(mo.move_finished_ids.productId, product1, 'Wrong product to produce in finished product move')

        # ===== productQty onchange checks ===== #
        # check productQty onchange without saving
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = product1
        mo_form.productQty = 5
        mo_form.productQty = 10
        mo2 = mo_form.save()
        self.assertEqual(len(mo2.move_finished_ids), 1, 'Wrong number of finished product moves created')
        self.assertEqual(mo2.move_finished_ids.productQty, 10, 'Wrong qty to produce for the finished product move')

        # check productQty onchange after saving
        mo_form = Form(self.env['mrp.production'].browse(mo2.id))
        mo_form.productQty = 5
        mo2 = mo_form.save()
        self.assertEqual(len(mo2.move_finished_ids), 1, 'Wrong number of finish product moves created')
        self.assertEqual(mo2.move_finished_ids.productQty, 5, 'Wrong qty to produce for the finished product move')

        # check productQty onchange when mo._origin.productId is unchanged
        mo_form = Form(self.env['mrp.production'].browse(mo2.id))
        mo_form.productQty = 10
        mo_form.productQty = 5
        mo2 = mo_form.save()
        self.assertEqual(len(mo2.move_finished_ids), 1, 'Wrong number of finish product moves created')
        self.assertEqual(mo2.move_finished_ids.productQty, 5, 'Wrong qty to produce for the finished product move')

        # ===== productUomId onchange checks ===== #
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = product1
        mo_form.productQty = 1
        mo_form.productUomId = self.env['uom.uom'].browse(self.ref('uom.product_uom_dozen'))
        mo3 = mo_form.save()
        self.assertEqual(len(mo3.move_finished_ids), 1, 'Wrong number of finish product moves created')
        self.assertEqual(mo3.move_finished_ids.productQty, 12, 'Wrong qty to produce for the finished product move')

        # ===== bomId onchange checks ===== #
        component = self.env['product.product'].create({
            "name": "Sugar",
        })

        bom1 = self.env['mrp.bom'].create({
            'productId': False,
            'productTemplateId': product1.productTemplateId.id,
            'bom_line_ids': [
                (0, 0, {'productId': component.id, 'productQty': 1})
            ]
        })

        bom2 = self.env['mrp.bom'].create({
            'productId': False,
            'productTemplateId': product1.productTemplateId.id,
            'bom_line_ids': [
                (0, 0, {'productId': component.id, 'productQty': 10})
            ]
        })
        # check bomId onchange before product change
        mo_form = Form(self.env['mrp.production'])
        mo_form.bomId = bom1
        mo_form.bomId = bom2
        mo_form.productId = product2
        mo4 = mo_form.save()
        self.assertFalse(mo4.bomId, 'BoM should have been removed')
        self.assertEqual(len(mo4.move_finished_ids), 1, 'Wrong number of finished product moves created')
        self.assertEqual(mo4.move_finished_ids.productId, product2, 'Wrong product to produce in finished product move')
        # check bomId onchange after product change
        mo_form = Form(self.env['mrp.production'].browse(mo4.id))
        mo_form.productId = product1
        mo_form.bomId = bom1
        mo_form.bomId = bom2
        mo4 = mo_form.save()
        self.assertEqual(len(mo4.move_finished_ids), 1, 'Wrong number of finish product moves created')
        self.assertEqual(mo4.move_finished_ids.productId, product1, 'Wrong product to produce in finished product move')
        # check productId onchange when mo._origin.productId is unchanged
        mo_form = Form(self.env['mrp.production'].browse(mo4.id))
        mo_form.bomId = bom2
        mo_form.bomId = bom1
        mo4 = mo_form.save()
        self.assertEqual(len(mo4.move_finished_ids), 1, 'Wrong number of finish product moves created')
        self.assertEqual(mo4.move_finished_ids.productId, product1, 'Wrong product to produce in finished product move')

    def test_compute_tracked_time_1(self):
        """
        Checks that the Duration Computation (`time_mode` of mrp.routing.workcenter) with value `auto` with Based On
        (`time_mode_batch`) set to 1 actually compute the time based on the last 1 operation, and not more.
        Create a first production in 15 minutes (expected should go from 60 to 15
        Create a second one in 10 minutes (expected should NOT go from 15 to 12.5, it should go from 15 to 10)
        """
        # First production, the default is 60 and there is 0 productions of that operation
        production_form = Form(self.env['mrp.production'])
        production_form.bomId = self.bom_4
        production = production_form.save()
        self.assertEqual(production.workorderIds[0].durationExpected, 60.0, "Default duration is 0+0+1*60.0")
        production.action_confirm()
        production.button_plan()
        # Production planned, time to start, I produce all the 1 product
        production_form.qtyProducing = 1
        with production_form.workorderIds.edit(0) as wo:
            wo.duration = 15 # in 15 minutes
        production = production_form.save()
        production.button_mark_done()
        # It is saved and done, registered in the db. There are now 1 productions of that operation

        # Same production, let's see what the durationExpected is, last prod was 15 minutes for 1 item
        production_form = Form(self.env['mrp.production'])
        production_form.bomId = self.bom_4
        production = production_form.save()
        self.assertEqual(production.workorderIds[0].durationExpected, 15.0, "Duration is now 0+0+1*15")
        production.action_confirm()
        production.button_plan()
        # Production planned, time to start, I produce all the 1 product
        production_form.qtyProducing = 1
        with production_form.workorderIds.edit(0) as wo:
            wo.duration = 10  # In 10 minutes this time
        production = production_form.save()
        production.button_mark_done()
        # It is saved and done, registered in the db. There are now 2 productions of that operation

        # Same production, let's see what the durationExpected is, last prod was 10 minutes for 1 item
        # Total average time would be 12.5 but we compute the duration based on the last 1 item
        production_form = Form(self.env['mrp.production'])
        production_form.bomId = self.bom_4
        production = production_form.save()
        self.assertNotEqual(production.workorderIds[0].durationExpected, 12.5, "Duration expected is based on the last 1 production, not last 2")
        self.assertEqual(production.workorderIds[0].durationExpected, 10.0, "Duration is now 0+0+1*10")

    def test_compute_tracked_time_2_under_capacity(self):
        """
        Test that when tracking the 2 last production, if we make one with under capacity, and one with normal capacity,
        the two are equivalent (1 done with capacity 2 in 10mn = 2 done with capacity 2 in 10mn)
        """
        production_form = Form(self.env['mrp.production'])
        production_form.bomId = self.bom_5
        production = production_form.save()
        production.action_confirm()
        production.button_plan()

        # Production planned, time to start, I produce all the 1 product
        production_form.qtyProducing = 1
        with production_form.workorderIds.edit(0) as wo:
            wo.duration = 10  # in 10 minutes
        production = production_form.save()
        production.button_mark_done()
        # It is saved and done, registered in the db. There are now 1 productions of that operation

        # Same production, let's see what the durationExpected is, last prod was 10 minutes for 1 item
        production_form = Form(self.env['mrp.production'])
        production_form.bomId = self.bom_5
        production_form.productQty = 2  # We want to produce 2 items (the capacity) now
        production = production_form.save()
        self.assertNotEqual(production.workorderIds[0].durationExpected, 20.0, "We made 1 item with capacity 2 in 10mn -> so 2 items shouldn't be double that")
        self.assertEqual(production.workorderIds[0].durationExpected, 10.0, "Producing 1 or 2 items with capacity 2 is the same duration")
        production.action_confirm()
        production.button_plan()
        # Production planned, time to start, I produce all the 2 product
        production_form.qtyProducing = 2
        with production_form.workorderIds.edit(0) as wo:
            wo.duration = 10  # In 10 minutes this time
        production = production_form.save()
        production.button_mark_done()
        # It is saved and done, registered in the db. There are now 2 productions of that operation but they have the same duration

        production_form = Form(self.env['mrp.production'])
        production_form.bomId = self.bom_5
        production = production_form.save()
        self.assertNotEqual(production.workorderIds[0].durationExpected, 15, "Producing 1 or 2 in 10mn with capacity 2 take the same amount of time : 10mn")
        self.assertEqual(production.workorderIds[0].durationExpected, 10.0, "Duration is indeed (10+10)/2")

    def test_capacity_duration_expected(self):
        """
        Test that the duration expected is correctly computed when dealing with below or above capacity
        1 -> 10mn
        2 -> 10mn
        3 -> 20mn
        4 -> 20mn
        5 -> 30mn
        ...
        """
        production_form = Form(self.env['mrp.production'])
        production_form.bomId = self.bom_6
        production = production_form.save()
        production.action_confirm()
        production.button_plan()

        # Production planned, time to start, I produce all the 1 product
        production_form.qtyProducing = 1
        with production_form.workorderIds.edit(0) as wo:
            wo.duration = 10  # in 10 minutes
        production = production_form.save()
        production.button_mark_done()

        production_form = Form(self.env['mrp.production'])
        production_form.bomId = self.bom_6
        production = production_form.save()
        # production_form.productQty = 1 [BY DEFAULT]
        self.assertEqual(production.workorderIds[0].durationExpected, 10.0, "Produce 1 with capacity 2, expected is 10mn for each run -> 10mn")
        production_form.productQty = 2
        production = production_form.save()
        self.assertEqual(production.workorderIds[0].durationExpected, 10.0, "Produce 2 with capacity 2, expected is 10mn for each run -> 10mn")

        production_form.productQty = 3
        production = production_form.save()
        self.assertEqual(production.workorderIds[0].durationExpected, 20.0, "Produce 3 with capacity 2, expected is 10mn for each run -> 20mn")

        production_form.productQty = 4
        production = production_form.save()
        self.assertEqual(production.workorderIds[0].durationExpected, 20.0, "Produce 4 with capacity 2, expected is 10mn for each run -> 20mn")

        production_form.productQty = 5
        production = production_form.save()
        self.assertEqual(production.workorderIds[0].durationExpected, 30.0, "Produce 5 with capacity 2, expected is 10mn for each run -> 30mn")

    def test_planning_workorder(self):
        """
            Check that the fastest work center is used when planning the workorder.

            - create two work centers with similar production capacity
                but the work_center_2 with a longer start and stop time.

            1:/ produce 2 units > work_center_1 faster because
                it does not need much time to start and to finish the production.

            2/ - update the production capacity of the work_center_2 to 4
                - produce 4 units > work_center_2 faster because
                it must do a single cycle while the work_center_1 have to do two cycles.
        """
        workcenter_1 = self.env['mrp.workcenter'].create({
            'name': 'wc1',
            'capacity': 2,
            'time_start': 1,
            'time_stop': 1,
            'time_efficiency': 100,
        })

        workcenter_2 = self.env['mrp.workcenter'].create({
            'name': 'wc2',
            'capacity': 2,
            'time_start': 10,
            'time_stop': 5,
            'time_efficiency': 100,
            'alternative_workcenter_ids': [workcenter_1.id]
        })

        product_to_build = self.env['product.product'].create({
            'name': 'final product',
            'type': 'product',
        })

        product_to_use = self.env['product.product'].create({
            'name': 'component',
            'type': 'product',
        })

        bom = self.env['mrp.bom'].create({
            'productId': product_to_build.id,
            'productTemplateId': product_to_build.productTemplateId.id,
            'productUomId': self.uom_unit.id,
            'productQty': 1.0,
            'type': 'normal',
            'consumption': 'flexible',
            'operationIds': [
                (0, 0, {'name': 'Test', 'workcenterId': workcenter_2.id, 'timeCycle': 60, 'sequence': 1}),
            ],
            'bom_line_ids': [
                (0, 0, {'productId': product_to_use.id, 'productQty': 1}),
            ]})

        #MO_1
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = product_to_build
        mo_form.bomId = bom
        mo_form.productQty = 2
        mo = mo_form.save()
        mo.action_confirm()
        mo.button_plan()
        self.assertEqual(mo.workorderIds[0].workcenterId.id, workcenter_1.id, 'workcenter_1 is faster than workcenter_2 to manufacture 2 units')
        # Unplan the mo to prevent the first workcenter from being busy
        mo.button_unplan()

        # Update the production capcity
        workcenter_2.capacity = 4

        #MO_2
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = product_to_build
        mo_form.bomId = bom
        mo_form.productQty = 4
        mo_2 = mo_form.save()
        mo_2.action_confirm()
        mo_2.button_plan()
        self.assertEqual(mo_2.workorderIds[0].workcenterId.id, workcenter_2.id, 'workcenter_2 is faster than workcenter_1 to manufacture 4 units')

    def test_timers_after_cancelling_mo(self):
        """
            Check that the timers in the workorders are stopped after the cancellation of the MO
        """
        mo_form = Form(self.env['mrp.production'])
        mo_form.bomId = self.bom_2
        mo_form.productQty = 1
        mo = mo_form.save()
        mo.action_confirm()
        mo.button_plan()

        wo = mo.workorderIds
        wo.button_start()
        mo.action_cancel()
        self.assertEqual(mo.state, 'cancel', 'Manufacturing order should be cancelled.')
        self.assertEqual(wo.state, 'cancel', 'Workorders should be cancelled.')
        self.assertTrue(mo.workorderIds.timeIds.dateEnd, 'The timers must stop after the cancellation of the MO')

    def test_starting_wo_twice(self):
        """
            Check that the work order is started only once when clicking the start button several times.
        """
        production_form = Form(self.env['mrp.production'])
        production_form.bomId = self.bom_2
        production_form.productQty = 1
        production = production_form.save()
        production_form = Form(production)
        with production_form.workorderIds.new() as wo:
            wo.name = 'OP1'
            wo.workcenterId = self.workcenter_1
            wo.durationExpected = 40
        production = production_form.save()
        production.action_confirm()
        production.button_plan()
        production.workorderIds[0].button_start()
        production.workorderIds[0].button_start()
        self.assertEqual(len(production.workorderIds[0].timeIds.filtered(lambda t: t.dateStart and not t.dateEnd)), 1)

    def test_qty_update_and_method_reservation(self):
        """
        When the reservation method of Manufacturing is 'manual', updating the
        quantity of a confirmed MO shouldn't trigger the reservation of the
        components
        """
        warehouse = self.env['stock.warehouse'].search([('companyId', '=', self.env.company.id)], order='id', limit=1)
        warehouse.manu_type_id.reservation_method = 'manual'

        for product in self.product_1 + self.product_2:
            product.type = 'product'
            self.env['stock.quant']._update_available_quantity(product, warehouse.lot_stock_id, 10)

        mo_form = Form(self.env['mrp.production'])
        mo_form.bomId = self.bom_1
        mo = mo_form.save()
        mo.action_confirm()

        self.assertFalse(mo.moveRawIds.moveLineIds)

        wizard = self.env['change.production.qty'].create({
            'moId': mo.id,
            'productQty': 5,
        })
        wizard.change_prod_qty()

        self.assertFalse(mo.moveRawIds.moveLineIds)

    def test_source_and_child_mo(self):
        """
        Suppose three manufactured products A, B and C. C is a component of B
        and B is a component of A. If B and C have the routes MTO + Manufacture,
        when producing one A, it should generate a MO for B and C. Moreover,
        starting from one of the MOs, we should be able to find the source/child
        MO.
        (The test checks the flow in 1-step, 2-steps and 3-steps manufacturing)
        """
        warehouse = self.env['stock.warehouse'].search([('companyId', '=', self.env.company.id)], limit=1)
        mto_route = warehouse.mto_pull_id.routeId
        manufacture_route = warehouse.manufacture_pull_id.routeId
        mto_route.active = True

        grandparent, parent, child = self.env['product.product'].create([{
            'name': n,
            'type': 'product',
            'routeIds': [(6, 0, mto_route.ids + manufacture_route.ids)],
        } for n in ['grandparent', 'parent', 'child']])
        component = self.env['product.product'].create({
            'name': 'component',
            'type': 'consu',
        })

        self.env['mrp.bom'].create([{
            'productTemplateId': finished_product.productTemplateId.id,
            'productQty': 1,
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': compo.id, 'productQty': 1}),
            ],
        } for finished_product, compo in [(grandparent, parent), (parent, child), (child, component)]])

        none_production = self.env['mrp.production']
        for steps, case_description, in [('mrpOneStep', '1-step Manufacturing'), ('pbm', '2-steps Manufacturing'), ('pbmSam', '3-steps Manufacturing')]:
            warehouse.manufactureSteps = steps

            grandparent_production_form = Form(self.env['mrp.production'])
            grandparent_production_form.productId = grandparent
            grandparent_production = grandparent_production_form.save()
            grandparent_production.action_confirm()

            child_production, parent_production = self.env['mrp.production'].search([('productId', 'in', (parent + child).ids)], order='id desc', limit=2)

            for source_mo, mo, product, child_mo in [(none_production, grandparent_production, grandparent, parent_production),
                                                     (grandparent_production, parent_production, parent, child_production),
                                                     (parent_production, child_production, child, none_production)]:

                self.assertEqual(mo.productId, product, '[%s] There should be a MO for product %s' % (case_description, product.display_name))
                self.assertEqual(mo.mrp_production_source_count, len(source_mo), '[%s] Incorrect value for product %s' % (case_description, product.display_name))
                self.assertEqual(mo.mrp_production_child_count, len(child_mo), '[%s] Incorrect value for product %s' % (case_description, product.display_name))

                source_action = mo.action_view_mrp_production_sources()
                child_action = mo.action_view_mrp_production_childs()
                self.assertEqual(source_action.get('resId', False), source_mo.id, '[%s] Incorrect value for product %s' % (case_description, product.display_name))
                self.assertEqual(child_action.get('resId', False), child_mo.id, '[%s] Incorrect value for product %s' % (case_description, product.display_name))

    @freeze_time('2022-06-28 08:00')
    def test_replan_workorders01(self):
        """
        Create two MO, each one with one WO. Set the same scheduled start date
        to each WO during the creation of the MO. A warning will be displayed.
        -> The user replans one of the WO: the warnings should disappear and the
        WO should be postponed.
        """
        mos = self.env['mrp.production']
        for _ in range(2):
            mo_form = Form(self.env['mrp.production'])
            mo_form.bomId = self.bom_4
            with mo_form.workorderIds.edit(0) as wo_line:
                wo_line.datePlannedStart = datetime.now()
            mos += mo_form.save()
        mos.action_confirm()

        mo_01, mo_02 = mos
        wo_01 = mo_01.workorderIds
        wo_02 = mo_02.workorderIds

        self.assertTrue(wo_01.showJsonPopover)
        self.assertTrue(wo_02.showJsonPopover)

        wo_02.action_replan()

        self.assertFalse(wo_01.showJsonPopover)
        self.assertFalse(wo_02.showJsonPopover)
        self.assertEqual(wo_01.datePlannedFinished, wo_02.datePlannedStart)

    @freeze_time('2022-06-28 08:00')
    def test_replan_workorders02(self):
        """
        Create two MO, each one with one WO. Set the same scheduled start date
        to each WO after the creation of the MO. A warning will be displayed.
        -> The user replans one of the WO: the warnings should disappear and the
        WO should be postponed.
        """
        mos = self.env['mrp.production']
        for _ in range(2):
            mo_form = Form(self.env['mrp.production'])
            mo_form.bomId = self.bom_4
            mos += mo_form.save()
        mos.action_confirm()
        mo_01, mo_02 = mos

        for mo in mos:
            with Form(mo) as mo_form:
                with mo_form.workorderIds.edit(0) as wo_line:
                    wo_line.datePlannedStart = datetime.now()

        wo_01 = mo_01.workorderIds
        wo_02 = mo_02.workorderIds
        self.assertTrue(wo_01.showJsonPopover)
        self.assertTrue(wo_02.showJsonPopover)

        wo_02.action_replan()

        self.assertFalse(wo_01.showJsonPopover)
        self.assertFalse(wo_02.showJsonPopover)
        self.assertEqual(wo_01.datePlannedFinished, wo_02.datePlannedStart)

    def test_move_raw_uom_rounding(self):
        """Test that the correct rouding is applied on move_raw in
        manufacturing orders"""

        self.box250 = self.env['uom.uom'].create({
            'name': 'box250',
            'categoryId': self.env.ref('uom.product_uom_categ_unit').id,
            'ratio': 250.0,
            'uom_type': 'bigger',
            'rounding': 1.0,
        })

        test_bom = self.env['mrp.bom'].create({
            'productTemplateId': self.product_7_template.id,
            'productUomId': self.uom_unit.id,
            'productQty': 250.0,
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': self.product_2.id, 'productQty': 1.0, 'productUomId': self.box250.id}),
            ]
        })

        mo_form = Form(self.env['mrp.production'])
        mo_form.bomId = test_bom
        mo = mo_form.save()
        mo.action_confirm()

        update_quantity_wizard = self.env['change.production.qty'].create({
            'moId': mo.id,
            'productQty': 300,
        })
        update_quantity_wizard.change_prod_qty()

        self.assertEqual(mo.moveRawIds[0].productUomQty, 2)

    def test_update_qty_to_consume_of_component(self):
        """
        The UoM of the finished product has a rounding precision equal to 1.0
        and the UoM of the component has a decimal one. When the producing qty
        is set, an onchange autocomplete the consumed quantity of the component.
        Then, when updating the 'to consume' quantity of the components, their
        consumed quantity is updated again. The test ensures that this update
        respects the rounding precisions
        """
        self.uom_dozen.rounding = 1
        self.bom_4.productUomId = self.uom_dozen

        mo_form = Form(self.env['mrp.production'])
        mo_form.bomId = self.bom_4
        mo = mo_form.save()
        mo.action_confirm()

        mo.action_toggle_is_locked()
        with Form(mo) as mo_form:
            mo_form.qtyProducing = 1
            with mo_form.moveRawIds.edit(0) as raw:
                raw.productUomQty = 1.25

        self.assertEqual(mo.moveRawIds.quantityDone, 1.25)

    def test_onchange_bom_ids_and_picking_type(self):
        warehouse01 = self.env['stock.warehouse'].search([('companyId', '=', self.env.company.id)], limit=1)
        warehouse02, warehouse03 = self.env['stock.warehouse'].create([
            {'name': 'Second Warehouse', 'code': 'WH02'},
            {'name': 'Third Warehouse', 'code': 'WH03'},
        ])

        finished_product = self.env['product.product'].create({'name': 'finished product'})
        bom_wh01, bom_wh02 = self.env['mrp.bom'].create([{
            'productId': finished_product.id,
            'productTemplateId': finished_product.productTemplateId.id,
            'productUomId': self.uom_unit.id,
            'productQty': 1.0,
            'bom_line_ids': [(0, 0, {'productId': self.product_0.id, 'productQty': 1})],
            'pickingTypeId': wh.manu_type_id.id,
            'sequence': wh.id,
        } for wh in [warehouse01, warehouse02]])

        # Prioritize BoM of WH02
        bom_wh01.sequence = bom_wh02.sequence + 1

        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = finished_product
        self.assertEqual(mo_form.bomId, bom_wh02, 'Should select the first BoM in the list, whatever the picking type is')
        self.assertEqual(mo_form.pickingTypeId, warehouse02.manu_type_id)

        mo_form.bomId = bom_wh01
        self.assertEqual(mo_form.pickingTypeId, warehouse01.manu_type_id, 'Should be adapted because of the found BoM')

        mo_form.bomId = bom_wh02
        self.assertEqual(mo_form.pickingTypeId, warehouse02.manu_type_id, 'Should be adapted because of the found BoM')

        mo_form.pickingTypeId = warehouse01.manu_type_id
        self.assertEqual(mo_form.bomId, bom_wh02, 'Should not change')
        self.assertEqual(mo_form.pickingTypeId, warehouse01.manu_type_id, 'Should not change')

        mo_form.pickingTypeId = warehouse03.manu_type_id
        mo_form.bomId = bom_wh01
        self.assertEqual(mo_form.pickingTypeId, warehouse01.manu_type_id, 'Should be adapted because of the found BoM '
                                                                            '(the selected picking type should be ignored)')

        mo_form = Form(self.env['mrp.production'].withContext(default_pickingTypeId=warehouse03.manu_type_id.id))
        mo_form.productId = finished_product
        self.assertFalse(mo_form.bomId, 'Should not find any BoM, because of the defined picking type')
        self.assertEqual(mo_form.pickingTypeId, warehouse03.manu_type_id)

        mo_form = Form(self.env['mrp.production'].withContext(default_pickingTypeId=warehouse01.manu_type_id.id))
        mo_form.productId = finished_product
        self.assertEqual(mo_form.bomId, bom_wh01, 'Should select the BoM that matches the default picking type')
        self.assertEqual(mo_form.pickingTypeId, warehouse01.manu_type_id, 'Should be the default one')

        mo_form.bomId = bom_wh02
        self.assertEqual(mo_form.pickingTypeId, warehouse01.manu_type_id, 'Should not change, because of default value')

        mo_form.pickingTypeId = warehouse02.manu_type_id
        self.assertEqual(mo_form.bomId, bom_wh02, 'Should not change')
        self.assertEqual(mo_form.pickingTypeId, warehouse02.manu_type_id, 'Should not change')

        mo_form.pickingTypeId = warehouse02.manu_type_id
        mo_form.bomId = bom_wh02
        self.assertEqual(mo_form.pickingTypeId, warehouse01.manu_type_id, 'Should be adapted because of the default value')

    def test_exceeded_consumed_qty_and_duplicated_lines_01(self):
        """
        Two components C01, C02. C01 has the MTO route.
        MO with 1 x C01, 1 x C02, 1 x C02.
        Process the MO and set a high consumed qty for C01.
        Ensure that the MO can still be processed and that the consumed quantities
        are correct.
        """
        warehouse = self.env['stock.warehouse'].search([('companyId', '=', self.env.company.id)], limit=1)
        mto_route = warehouse.mto_pull_id.routeId
        manufacture_route = warehouse.manufacture_pull_id.routeId
        mto_route.active = True

        product01, product02, product03 = self.env['product.product'].create([{
            'name': 'Product %s' % (i + 1),
            'type': 'product',
        } for i in range(3)])

        product02.routeIds = [(6, 0, (mto_route | manufacture_route).ids)]

        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = product01
        mo_form.productQty = 1
        for component in (product02, product03, product03):
            with mo_form.moveRawIds.new() as line:
                line.productId = component
        mo = mo_form.save()
        mo.action_confirm()

        mo_form = Form(mo)
        mo_form.qtyProducing = 1.0
        mo = mo_form.save()

        mo.moveRawIds[0].moveLineIds.qtyDone = 1.5
        mo.button_mark_done()

        self.assertEqual(mo.state, 'done')

        p02_raws = mo.moveRawIds.filtered(lambda m: m.productId == product02)
        p03_raws = mo.moveRawIds.filtered(lambda m: m.productId == product03)
        self.assertEqual(sum(p02_raws.mapped('quantityDone')), 1.5)
        self.assertEqual(sum(p03_raws.mapped('quantityDone')), 2)

    def test_exceeded_consumed_qty_and_duplicated_lines_02(self):
        """
        One component C01, 2-steps manufacturing
        MO with 1 x C01, 1 x C01
        Process the MO and set a higher consumed qty for the first C01.
        Ensure that the MO can still be processed and that the consumed quantities
        are correct.
        """
        warehouse = self.env['stock.warehouse'].search([('companyId', '=', self.env.company.id)], limit=1)
        warehouse.manufactureSteps = 'pbm'

        finished, component = self.env['product.product'].create([{
            'name': 'Product %s' % (i + 1),
            'type': 'product',
        } for i in range(2)])

        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = finished
        mo_form.productQty = 1
        for product in (component, component):
            with mo_form.moveRawIds.new() as line:
                line.productId = product
        mo = mo_form.save()
        mo.action_confirm()

        mo_form = Form(mo)
        mo_form.qtyProducing = 1.0
        mo = mo_form.save()

        mo.moveRawIds[0].moveLineIds.qtyDone = 1.5
        mo.button_mark_done()

        self.assertEqual(mo.state, 'done')

        compo_raws = mo.moveRawIds.filtered(lambda m: m.productId == component)
        self.assertEqual(sum(compo_raws.mapped('quantityDone')), 2.5)
