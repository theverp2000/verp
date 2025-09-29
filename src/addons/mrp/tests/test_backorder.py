# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.
from datetime import datetime, timedelta

from verp.addons.mrp.tests.common import TestMrpCommon
from verp.tests import Form
from verp.tests.common import TransactionCase


class TestMrpProductionBackorder(TestMrpCommon):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.stock_location = cls.env.ref('stock.stock_location_stock')

    def setUp(self):
        super().setUp()
        warehouse_form = Form(self.env['stock.warehouse'])
        warehouse_form.name = 'Test Warehouse'
        warehouse_form.code = 'TWH'
        self.warehouse = warehouse_form.save()

    def test_no_tracking_1(self):
        """Create a MO for 4 product. Produce 4. The backorder button should
        not appear and hitting mark as done should not open the backorder wizard.
        The name of the MO should be MO/001.
        """
        mo = self.generate_mo(qty_final=4)[0]

        mo_form = Form(mo)
        mo_form.qtyProducing = 4
        mo = mo_form.save()

        # No backorder is proposed
        self.assertTrue(mo.button_mark_done())
        self.assertEqual(mo._get_quantity_to_backorder(), 0)
        self.assertTrue("-001" not in mo.name)

    def test_no_tracking_2(self):
        """Create a MO for 4 product. Produce 1. The backorder button should
        appear and hitting mark as done should open the backorder wizard. In the backorder
        wizard, choose to do the backorder. A new MO for 3 self.untracked_bom should be
        created.
        The sequence of the first MO should be MO/001-01, the sequence of the second MO
        should be MO/001-02.
        Check that all MO are reachable through the procurement group.
        """
        production, _, _, product_to_use_1, _ = self.generate_mo(qty_final=4, qty_base_1=3)
        self.assertEqual(production.state, 'confirmed')
        self.assertEqual(production.reserve_visible, True)

        # Make some stock and reserve
        for product in production.moveRawIds.productId:
            self.env['stock.quant'].withContext(inventory_mode=True).create({
                'productId': product.id,
                'inventoryQuantity': 100,
                'locationId': production.locationSrcId.id,
            })._apply_inventory()
        production.action_assign()
        self.assertEqual(production.state, 'confirmed')
        self.assertEqual(production.reserve_visible, False)

        mo_form = Form(production)
        mo_form.qtyProducing = 1
        production = mo_form.save()

        action = production.button_mark_done()
        backorder = Form(self.env['mrp.production.backorder'].withContext(**action['context']))
        backorder.save().action_backorder()

        # Two related MO to the procurement group
        self.assertEqual(len(production.procurementGroupId.mrpProductionIds), 2)

        # Check MO backorder
        mo_backorder = production.procurementGroupId.mrpProductionIds[-1]
        self.assertEqual(mo_backorder.productId.id, production.productId.id)
        self.assertEqual(mo_backorder.productQty, 3)
        self.assertEqual(sum(mo_backorder.moveRawIds.filtered(lambda m: m.productId.id == product_to_use_1.id).mapped("productUomQty")), 9)
        self.assertEqual(mo_backorder.reserve_visible, False)  # the reservation of the first MO should've been moved here

    def test_backorder_and_orderpoint(self):
        """ Same as test_no_tracking_2, except one of components also has an orderpoint (i.e. reordering rule)
        and not enough components are in stock (i.e. so orderpoint is triggered)."""
        production, _, product_to_build, product_to_use_1, product_to_use_2 = self.generate_mo(qty_final=4, qty_base_1=1)

        # Make some stock and reserve
        for product in production.moveRawIds.productId:
            self.env['stock.quant'].withContext(inventory_mode=True).create({
                'productId': product.id,
                'inventoryQuantity': 1,
                'locationId': production.locationSrcId.id,
            })
        production.action_assign()

        self.env['stock.warehouse.orderpoint'].create({
            'name': 'product_to_use_1 RR',
            'locationId': production.locationSrcId.id,
            'productId': product_to_use_1.id,
            'product_min_qty': 1,
            'product_max_qty': 5,
        })

        self.env['mrp.bom'].create({
            'productId': product_to_use_1.id,
            'productTemplateId': product_to_use_1.productTemplateId.id,
            'productUomId': product_to_use_1.uomId.id,
            'productQty': 1.0,
            'type': 'normal',
            'consumption': 'flexible',
            'bom_line_ids': [
                (0, 0, {'productId': product_to_use_2.id, 'productQty': 1.0})
            ]})
        product_to_use_1.write({'routeIds': [(4, self.ref('mrp.routeWarehouse0Manufacture'))]})

        mo_form = Form(production)
        mo_form.qtyProducing = 1
        production = mo_form.save()

        action = production.button_mark_done()
        backorder = Form(self.env['mrp.production.backorder'].withContext(**action['context']))
        backorder.save().action_backorder()

        # Two related MO, orig + backorder, in same the procurement group
        mos = self.env['mrp.production'].search([
            ('productId', '=', product_to_build.id),
        ])
        self.assertEqual(len(mos), 2, "Backorder was not created.")
        self.assertEqual(len(production.procurementGroupId.mrpProductionIds), 2, "MO backorder not linked to original MO")

        # Orderpoint MO is NOT part of procurement group
        mo_orderpoint = self.env['mrp.production'].search([
            ('productId', '=', product_to_use_1.id),
        ])
        self.assertEqual(len(mo_orderpoint.procurementGroupId.mrpProductionIds), 1, "Reordering rule MO incorrectly linked to other MOs")

    def test_no_tracking_pbm_1(self):
        """Create a MO for 4 product. Produce 1. The backorder button should
        appear and hitting mark as done should open the backorder wizard. In the backorder
        wizard, choose to do the backorder. A new MO for 3 self.untracked_bom should be
        created.
        The sequence of the first MO should be MO/001-01, the sequence of the second MO
        should be MO/001-02.
        Check that all MO are reachable through the procurement group.
        """
        with Form(self.warehouse) as warehouse:
            warehouse.manufactureSteps = 'pbm'

        production, _, product_to_build, product_to_use_1, product_to_use_2 = self.generate_mo(qty_base_1=4, qty_final=4, pickingTypeId=self.warehouse.manu_type_id)

        moveRawIds = production.moveRawIds
        self.assertEqual(len(moveRawIds), 2)
        self.assertEqual(set(moveRawIds.mapped("productId")), {product_to_use_1, product_to_use_2})

        pbm_move = moveRawIds.move_orig_ids
        self.assertEqual(len(pbm_move), 2)
        self.assertEqual(set(pbm_move.mapped("productId")), {product_to_use_1, product_to_use_2})
        self.assertFalse(pbm_move.move_orig_ids)

        mo_form = Form(production)
        mo_form.qtyProducing = 1
        production = mo_form.save()
        self.assertEqual(sum(pbm_move.filtered(lambda m: m.productId.id == product_to_use_1.id).mapped("productQty")), 16)
        self.assertEqual(sum(pbm_move.filtered(lambda m: m.productId.id == product_to_use_2.id).mapped("productQty")), 4)

        action = production.button_mark_done()
        backorder = Form(self.env['mrp.production.backorder'].withContext(**action['context']))
        backorder.save().action_backorder()

        mo_backorder = production.procurementGroupId.mrpProductionIds[-1]
        self.assertEqual(mo_backorder.delivery_count, 1)

        pbm_move |= mo_backorder.moveRawIds.move_orig_ids
        # Check that quantity is correct
        self.assertEqual(sum(pbm_move.filtered(lambda m: m.productId.id == product_to_use_1.id).mapped("productQty")), 16)
        self.assertEqual(sum(pbm_move.filtered(lambda m: m.productId.id == product_to_use_2.id).mapped("productQty")), 4)

        self.assertFalse(pbm_move.move_orig_ids)

    def test_no_tracking_pbm_sam_1(self):
        """Create a MO for 4 product. Produce 1. The backorder button should
        appear and hitting mark as done should open the backorder wizard. In the backorder
        wizard, choose to do the backorder. A new MO for 3 self.untracked_bom should be
        created.
        The sequence of the first MO should be MO/001-01, the sequence of the second MO
        should be MO/001-02.
        Check that all MO are reachable through the procurement group.
        """
        with Form(self.warehouse) as warehouse:
            warehouse.manufactureSteps = 'pbmSam'
        production, _, product_to_build, product_to_use_1, product_to_use_2 = self.generate_mo(qty_base_1=4, qty_final=4, pickingTypeId=self.warehouse.manu_type_id)

        moveRawIds = production.moveRawIds
        self.assertEqual(len(moveRawIds), 2)
        self.assertEqual(set(moveRawIds.mapped("productId")), {product_to_use_1, product_to_use_2})

        pbm_move = moveRawIds.move_orig_ids
        self.assertEqual(len(pbm_move), 2)
        self.assertEqual(set(pbm_move.mapped("productId")), {product_to_use_1, product_to_use_2})
        self.assertFalse(pbm_move.move_orig_ids)
        self.assertEqual(sum(pbm_move.filtered(lambda m: m.productId.id == product_to_use_1.id).mapped("productQty")), 16)
        self.assertEqual(sum(pbm_move.filtered(lambda m: m.productId.id == product_to_use_2.id).mapped("productQty")), 4)

        sam_move = production.move_finished_ids.moveDestIds
        self.assertEqual(len(sam_move), 1)
        self.assertEqual(sam_move.productId.id, product_to_build.id)
        self.assertEqual(sum(sam_move.mapped("productQty")), 4)

        mo_form = Form(production)
        mo_form.qtyProducing = 1
        production = mo_form.save()

        action = production.button_mark_done()
        backorder = Form(self.env['mrp.production.backorder'].withContext(**action['context']))
        backorder.save().action_backorder()

        mo_backorder = production.procurementGroupId.mrpProductionIds[-1]
        self.assertEqual(mo_backorder.delivery_count, 2)

        pbm_move |= mo_backorder.moveRawIds.move_orig_ids
        self.assertEqual(sum(pbm_move.filtered(lambda m: m.productId.id == product_to_use_1.id).mapped("productQty")), 16)
        self.assertEqual(sum(pbm_move.filtered(lambda m: m.productId.id == product_to_use_2.id).mapped("productQty")), 4)

        sam_move |= mo_backorder.move_finished_ids.move_orig_ids
        self.assertEqual(sum(sam_move.mapped("productQty")), 4)

    def test_tracking_backorder_series_lot_1(self):
        """ Create a MO of 4 tracked products. all component is tracked by lots
        Produce one by one with one bakorder for each until end.
        """
        nb_product_todo = 4
        production, _, p_final, p1, p2 = self.generate_mo(qty_final=nb_product_todo, tracking_final='lot', tracking_base_1='lot', tracking_base_2='lot')
        lot_final = self.env['stock.production.lot'].create({
            'name': 'lot_final',
            'productId': p_final.id,
            'companyId': self.env.company.id,
        })
        lot_1 = self.env['stock.production.lot'].create({
            'name': 'lot_consumed_1',
            'productId': p1.id,
            'companyId': self.env.company.id,
        })
        lot_2 = self.env['stock.production.lot'].create({
            'name': 'lot_consumed_2',
            'productId': p2.id,
            'companyId': self.env.company.id,
        })

        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, nb_product_todo*4, lotId=lot_1)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, nb_product_todo, lotId=lot_2)

        production.action_assign()
        active_production = production
        for i in range(nb_product_todo):

            details_operation_form = Form(active_production.moveRawIds.filtered(lambda m: m.productId == p1), view=self.env.ref('stock.view_stock_move_operations'))
            with details_operation_form.moveLineIds.edit(0) as ml:
                ml.qtyDone = 4
                ml.lotId = lot_1
            details_operation_form.save()
            details_operation_form = Form(active_production.moveRawIds.filtered(lambda m: m.productId == p2), view=self.env.ref('stock.view_stock_move_operations'))
            with details_operation_form.moveLineIds.edit(0) as ml:
                ml.qtyDone = 1
                ml.lotId = lot_2
            details_operation_form.save()

            production_form = Form(active_production)
            production_form.qtyProducing = 1
            production_form.lotProducingId = lot_final
            active_production = production_form.save()

            active_production.button_mark_done()
            if i + 1 != nb_product_todo:  # If last MO, don't make a backorder
                action = active_production.button_mark_done()
                backorder = Form(self.env['mrp.production.backorder'].withContext(**action['context']))
                backorder.save().action_backorder()
            active_production = active_production.procurementGroupId.mrpProductionIds[-1]

        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location, lotId=lot_final), nb_product_todo, f'You should have the {nb_product_todo} final product in stock')
        self.assertEqual(len(production.procurementGroupId.mrpProductionIds), nb_product_todo)

    def test_tracking_backorder_series_serial_1(self):
        """ Create a MO of 4 tracked products (serial) with pbmSam.
        all component is tracked by serial
        Produce one by one with one bakorder for each until end.
        """
        nb_product_todo = 4
        production, _, p_final, p1, p2 = self.generate_mo(qty_final=nb_product_todo, tracking_final='serial', tracking_base_1='serial', tracking_base_2='serial', qty_base_1=1)
        serials_final, serials_p1, serials_p2 = [], [], []
        for i in range(nb_product_todo):
            serials_final.append(self.env['stock.production.lot'].create({
                'name': f'lot_final_{i}',
                'productId': p_final.id,
                'companyId': self.env.company.id,
            }))
            serials_p1.append(self.env['stock.production.lot'].create({
                'name': f'lot_consumed_1_{i}',
                'productId': p1.id,
                'companyId': self.env.company.id,
            }))
            serials_p2.append(self.env['stock.production.lot'].create({
                'name': f'lot_consumed_2_{i}',
                'productId': p2.id,
                'companyId': self.env.company.id,
            }))
            self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 1, lotId=serials_p1[-1])
            self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 1, lotId=serials_p2[-1])

        production.action_assign()
        active_production = production
        for i in range(nb_product_todo):

            details_operation_form = Form(active_production.moveRawIds.filtered(lambda m: m.productId == p1), view=self.env.ref('stock.view_stock_move_operations'))
            with details_operation_form.moveLineIds.edit(0) as ml:
                ml.qtyDone = 1
                ml.lotId = serials_p1[i]
            details_operation_form.save()
            details_operation_form = Form(active_production.moveRawIds.filtered(lambda m: m.productId == p2), view=self.env.ref('stock.view_stock_move_operations'))
            with details_operation_form.moveLineIds.edit(0) as ml:
                ml.qtyDone = 1
                ml.lotId = serials_p2[i]
            details_operation_form.save()

            production_form = Form(active_production)
            production_form.qtyProducing = 1
            production_form.lotProducingId = serials_final[i]
            active_production = production_form.save()

            active_production.button_mark_done()
            if i + 1 != nb_product_todo:  # If last MO, don't make a backorder
                action = active_production.button_mark_done()
                backorder = Form(self.env['mrp.production.backorder'].withContext(**action['context']))
                backorder.save().action_backorder()
            active_production = active_production.procurementGroupId.mrpProductionIds[-1]

        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location), nb_product_todo, f'You should have the {nb_product_todo} final product in stock')
        self.assertEqual(len(production.procurementGroupId.mrpProductionIds), nb_product_todo)

    def test_tracking_backorder_immediate_production_serial_1(self):
        """ Create a MO to build 2 of a SN tracked product.
        Build both the starting MO and its backorder as immediate productions
        (i.e. Mark As Done without setting SN/filling any quantities)
        """
        mo, _, p_final, p1, p2 = self.generate_mo(qty_final=2, tracking_final='serial', qty_base_1=2, qty_base_2=2)
        self.env['stock.quant']._update_available_quantity(p1, self.stock_location_components, 2.0)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location_components, 2.0)
        mo.action_assign()
        res_dict = mo.button_mark_done()
        self.assertEqual(res_dict.get('resModel'), 'mrp.immediate.production')
        immediate_wizard = Form(self.env[res_dict['resModel']].withContext(res_dict['context'])).save()
        res_dict = immediate_wizard.process()
        self.assertEqual(res_dict.get('resModel'), 'mrp.production.backorder')
        backorder_wizard = Form(self.env[res_dict['resModel']].withContext(res_dict['context']))

        # backorder should automatically open
        action = backorder_wizard.save().action_backorder()
        self.assertEqual(action.get('resModel'), 'mrp.production')
        backorder_mo_form = Form(self.env[action['resModel']].withContext(action['context']).browse(action['resId']))
        backorder_mo = backorder_mo_form.save()
        res_dict = backorder_mo.button_mark_done()
        self.assertEqual(res_dict.get('resModel'), 'mrp.immediate.production')
        immediate_wizard = Form(self.env[res_dict['resModel']].withContext(res_dict['context'])).save()
        immediate_wizard.process()

        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location), 2, "Incorrect number of final product produced.")
        self.assertEqual(len(self.env['stock.production.lot'].search([('productId', '=', p_final.id)])), 2, "Serial Numbers were not correctly produced.")

    def test_backorder_name(self):
        def produce_one(mo):
            mo_form = Form(mo)
            mo_form.qtyProducing = 1
            mo = mo_form.save()
            action = mo.button_mark_done()
            backorder = Form(self.env['mrp.production.backorder'].withContext(**action['context']))
            backorder.save().action_backorder()
            return mo.procurementGroupId.mrpProductionIds[-1]

        default_pickingTypeId = self.env['mrp.production']._get_default_picking_type()
        default_picking_type = self.env['stock.picking.type'].browse(default_pickingTypeId)
        mo_sequence = default_picking_type.sequence_id

        mo_sequence.prefix = "WH-MO-"
        initial_mo_name = mo_sequence.prefix + str(mo_sequence.number_next_actual).zfill(mo_sequence.padding)

        production = self.generate_mo(qty_final=5)[0]
        self.assertEqual(production.name, initial_mo_name)

        backorder = produce_one(production)
        self.assertEqual(production.name, initial_mo_name + "-001")
        self.assertEqual(backorder.name, initial_mo_name + "-002")

        backorder.backorder_sequence = 998

        for seq in [998, 999, 1000]:
            new_backorder = produce_one(backorder)
            self.assertEqual(backorder.name, initial_mo_name + "-" + str(seq))
            self.assertEqual(new_backorder.name, initial_mo_name + "-" + str(seq + 1))
            backorder = new_backorder

    def test_backorder_name_without_procurement_group(self):
        production = self.generate_mo(qty_final=5)[0]
        mo_form = Form(production)
        mo_form.qtyProducing = 1
        mo = mo_form.save()

        # Remove pg to trigger fallback on backorder name
        mo.procurementGroupId = False
        action = mo.button_mark_done()
        backorder_form = Form(self.env['mrp.production.backorder'].withContext(**action['context']))
        backorder_form.save().action_backorder()

        # The pg is back
        self.assertTrue(production.procurementGroupId)
        backorder_ids = production.procurementGroupId.mrpProductionIds[1]
        self.assertEqual(production.name.split('-')[0], backorder_ids.name.split('-')[0])
        self.assertEqual(int(production.name.split('-')[1]) + 1, int(backorder_ids.name.split('-')[1]))

    def test_reservation_method_w_mo(self):
        """ Create a MO for 2 units, Produce 1 and create a backorder.
        The MO and the backorder should be assigned according to the reservation method
        defined in the default manufacturing operation type
        """
        def create_mo(datePlannedStart=False):
            mo_form = Form(self.env['mrp.production'])
            mo_form.productId = self.bom_1.productId
            mo_form.bomId = self.bom_1
            mo_form.productQty = 2
            if datePlannedStart:
                mo_form.datePlannedStart = datePlannedStart
            mo = mo_form.save()
            mo.action_confirm()
            return mo

        def produce_one(mo):
            mo_form = Form(mo)
            mo_form.qtyProducing = 1
            mo = mo_form.save()
            action = mo.button_mark_done()
            backorder = Form(self.env['mrp.production.backorder'].withContext(**action['context']))
            backorder.save().action_backorder()
            return mo.procurementGroupId.mrpProductionIds[-1]

        # Make some stock and reserve
        for product in self.bom_1.bom_line_ids.productId:
            product.type = 'product'
            self.env['stock.quant'].withContext(inventory_mode=True).create({
                'productId': product.id,
                'inventoryQuantity': 100,
                'locationId': self.stock_location.id,
            })._apply_inventory()

        default_pickingTypeId = self.env['mrp.production']._get_default_picking_type()
        default_picking_type = self.env['stock.picking.type'].browse(default_pickingTypeId)

        # make sure generated MO will auto-assign
        default_picking_type.reservation_method = 'at_confirm'
        production = create_mo()
        self.assertEqual(production.state, 'confirmed')
        self.assertEqual(production.reserve_visible, False)
        # check whether the backorder follows the same scenario as the original MO
        backorder = produce_one(production)
        self.assertEqual(backorder.state, 'confirmed')
        self.assertEqual(backorder.reserve_visible, False)

        # make sure generated MO will does not auto-assign
        default_picking_type.reservation_method = 'manual'
        production = create_mo()
        self.assertEqual(production.state, 'confirmed')
        self.assertEqual(production.reserve_visible, True)
        backorder = produce_one(production)
        self.assertEqual(backorder.state, 'confirmed')
        self.assertEqual(backorder.reserve_visible, True)

        # make sure generated MO auto-assigns according to scheduled date
        default_picking_type.reservation_method = 'by_date'
        default_picking_type.reservation_days_before = 2
        # too early for scheduled date => don't auto-assign
        production = create_mo(datetime.now() + timedelta(days=10))
        self.assertEqual(production.state, 'confirmed')
        self.assertEqual(production.reserve_visible, True)
        backorder = produce_one(production)
        self.assertEqual(backorder.state, 'confirmed')
        self.assertEqual(backorder.reserve_visible, True)

        # within scheduled date + reservation days before => auto-assign
        production = create_mo()
        self.assertEqual(production.state, 'confirmed')
        self.assertEqual(production.reserve_visible, False)
        backorder = produce_one(production)
        self.assertEqual(backorder.state, 'confirmed')
        self.assertEqual(backorder.reserve_visible, False)


class TestMrpWorkorderBackorder(TransactionCase):
    @classmethod
    def setUpClass(cls):
        super(TestMrpWorkorderBackorder, cls).setUpClass()
        cls.uom_unit = cls.env['uom.uom'].search([
            ('categoryId', '=', cls.env.ref('uom.product_uom_categ_unit').id),
            ('uom_type', '=', 'reference')
        ], limit=1)
        cls.finished1 = cls.env['product.product'].create({
            'name': 'finished1',
            'type': 'product',
        })
        cls.compfinished1 = cls.env['product.product'].create({
            'name': 'compfinished1',
            'type': 'product',
        })
        cls.compfinished2 = cls.env['product.product'].create({
            'name': 'compfinished2',
            'type': 'product',
        })
        cls.workcenter1 = cls.env['mrp.workcenter'].create({
            'name': 'workcenter1',
        })
        cls.workcenter2 = cls.env['mrp.workcenter'].create({
            'name': 'workcenter2',
        })

        cls.bom_finished1 = cls.env['mrp.bom'].create({
            'productId': cls.finished1.id,
            'productTemplateId': cls.finished1.productTemplateId.id,
            'productUomId': cls.uom_unit.id,
            'productQty': 1,
            'consumption': 'flexible',
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': cls.compfinished1.id, 'productQty': 1}),
                (0, 0, {'productId': cls.compfinished2.id, 'productQty': 1}),
            ],
            'operationIds': [
                (0, 0, {'sequence': 1, 'name': 'finished operation 1', 'workcenterId': cls.workcenter1.id}),
                (0, 0, {'sequence': 2, 'name': 'finished operation 2', 'workcenterId': cls.workcenter2.id}),
            ],
        })
        cls.bom_finished1.bom_line_ids[0].operationId = cls.bom_finished1.operationIds[0].id
        cls.bom_finished1.bom_line_ids[1].operationId = cls.bom_finished1.operationIds[1].id
