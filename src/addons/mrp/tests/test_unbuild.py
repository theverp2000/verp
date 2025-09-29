# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp.tests import Form
from verp.addons.mrp.tests.common import TestMrpCommon
from verp.exceptions import UserError


class TestUnbuild(TestMrpCommon):
    def setUp(self):
        super(TestUnbuild, self).setUp()
        self.stock_location = self.env.ref('stock.stock_location_stock')
        self.env.ref('base.groupUser').write({
            'impliedIds': [(4, self.env.ref('stock.group_production_lot').id)]
        })

    def test_unbuild_standart(self):
        """ This test creates a MO and then creates 3 unbuild
        orders for the final product. None of the products for this
        test are tracked. It checks the stock state after each order
        and ensure it is correct.
        """
        mo, bom, p_final, p1, p2 = self.generate_mo()
        self.assertEqual(len(mo), 1, 'MO should have been created')

        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 100)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 5)
        mo.action_assign()

        mo_form = Form(mo)
        mo_form.qtyProducing = 5.0
        mo = mo_form.save()
        mo.button_mark_done()
        self.assertEqual(mo.state, 'done', "Production order should be in done state.")

        # Check quantity in stock before unbuild.
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location), 5, 'You should have the 5 final product in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p1, self.stock_location), 80, 'You should have 80 products in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location), 0, 'You should have consumed all the 5 product in stock')

        # ---------------------------------------------------
        #       unbuild
        # ---------------------------------------------------

        x = Form(self.env['mrp.unbuild'])
        x.productId = p_final
        x.bomId = bom
        x.productQty = 3
        x.save().action_unbuild()


        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location), 2, 'You should have consumed 3 final product in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p1, self.stock_location), 92, 'You should have 80 products in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location), 3, 'You should have consumed all the 5 product in stock')

        x = Form(self.env['mrp.unbuild'])
        x.productId = p_final
        x.bomId = bom
        x.productQty = 2
        x.save().action_unbuild()

        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location), 0, 'You should have 0 finalproduct in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p1, self.stock_location), 100, 'You should have 80 products in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location), 5, 'You should have consumed all the 5 product in stock')

        x = Form(self.env['mrp.unbuild'])
        x.productId = p_final
        x.bomId = bom
        x.productQty = 5
        x.save().action_unbuild()

        # Check quantity in stock after last unbuild.
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location, allow_negative=True), -5, 'You should have negative quantity for final product in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p1, self.stock_location), 120, 'You should have 80 products in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location), 10, 'You should have consumed all the 5 product in stock')

    def test_unbuild_with_final_lot(self):
        """ This test creates a MO and then creates 3 unbuild
        orders for the final product. Only the final product is tracked
        by lot. It checks the stock state after each order
        and ensure it is correct.
        """
        mo, bom, p_final, p1, p2 = self.generate_mo(tracking_final='lot')
        self.assertEqual(len(mo), 1, 'MO should have been created')

        lot = self.env['stock.production.lot'].create({
            'name': 'lot1',
            'productId': p_final.id,
            'companyId': self.env.company.id,
        })

        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 100)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 5)
        mo.action_assign()

        mo_form = Form(mo)
        mo_form.qtyProducing = 5.0
        mo_form.lotProducingId = lot
        mo = mo_form.save()

        mo.button_mark_done()
        self.assertEqual(mo.state, 'done', "Production order should be in done state.")

        # Check quantity in stock before unbuild.
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location, lotId=lot), 5, 'You should have the 5 final product in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p1, self.stock_location), 80, 'You should have 80 products in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location), 0, 'You should have consumed all the 5 product in stock')

        # ---------------------------------------------------
        #       unbuild
        # ---------------------------------------------------

        # This should fail since we do not choose a lot to unbuild for final product.
        with self.assertRaises(AssertionError):
            x = Form(self.env['mrp.unbuild'])
            x.productId = p_final
            x.bomId = bom
            x.productQty = 3
            unbuild_order = x.save()

        x = Form(self.env['mrp.unbuild'])
        x.productId = p_final
        x.bomId = bom
        x.productQty = 3
        x.lotId = lot
        x.save().action_unbuild()

        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location, lotId=lot), 2, 'You should have consumed 3 final product in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p1, self.stock_location), 92, 'You should have 80 products in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location), 3, 'You should have consumed all the 5 product in stock')

        x = Form(self.env['mrp.unbuild'])
        x.productId = p_final
        x.bomId = bom
        x.productQty = 2
        x.lotId = lot
        x.save().action_unbuild()

        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location, lotId=lot), 0, 'You should have 0 finalproduct in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p1, self.stock_location), 100, 'You should have 80 products in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location), 5, 'You should have consumed all the 5 product in stock')

        x = Form(self.env['mrp.unbuild'])
        x.productId = p_final
        x.bomId = bom
        x.productQty = 5
        x.lotId = lot
        x.save().action_unbuild()

        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location, lotId=lot, allow_negative=True), -5, 'You should have negative quantity for final product in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p1, self.stock_location), 120, 'You should have 80 products in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location), 10, 'You should have consumed all the 5 product in stock')

    def test_unbuild_with_comnsumed_lot(self):
        """ This test creates a MO and then creates 3 unbuild
        orders for the final product. Only once of the two consumed
        product is tracked by lot. It checks the stock state after each
        order and ensure it is correct.
        """
        mo, bom, p_final, p1, p2 = self.generate_mo(tracking_base_1='lot')
        self.assertEqual(len(mo), 1, 'MO should have been created')

        lot = self.env['stock.production.lot'].create({
            'name': 'lot1',
            'productId': p1.id,
            'companyId': self.env.company.id,
        })

        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 100, lotId=lot)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 5)
        mo.action_assign()
        for ml in mo.moveRawIds.mapped('moveLineIds'):
            if ml.productId.tracking != 'none':
                self.assertEqual(ml.lotId, lot, 'Wrong reserved lot.')

        # FIXME sle: behavior change
        mo_form = Form(mo)
        mo_form.qtyProducing = 5.0
        mo = mo_form.save()
        details_operation_form = Form(mo.moveRawIds[1], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.edit(0) as ml:
            ml.lotId = lot
            ml.qtyDone = 20
        details_operation_form.save()

        mo.button_mark_done()
        self.assertEqual(mo.state, 'done', "Production order should be in done state.")
        # Check quantity in stock before unbuild.
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location), 5, 'You should have the 5 final product in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p1, self.stock_location, lotId=lot), 80, 'You should have 80 products in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location), 0, 'You should have consumed all the 5 product in stock')

        # ---------------------------------------------------
        #       unbuild
        # ---------------------------------------------------

        x = Form(self.env['mrp.unbuild'])
        x.productId = p_final
        x.bomId = bom
        x.productQty = 3
        unbuild_order = x.save()

        # This should fail since we do not provide the MO that we wanted to unbuild. (without MO we do not know which consumed lot we have to restore)
        with self.assertRaises(UserError):
            unbuild_order.action_unbuild()

        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location), 5, 'You should have consumed 3 final product in stock')

        unbuild_order.moId = mo.id
        unbuild_order.action_unbuild()

        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location), 2, 'You should have consumed 3 final product in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p1, self.stock_location, lotId=lot), 92, 'You should have 92 products in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location), 3, 'You should have consumed all the 5 product in stock')

        x = Form(self.env['mrp.unbuild'])
        x.productId = p_final
        x.bomId = bom
        x.moId = mo
        x.productQty = 2
        x.save().action_unbuild()

        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location), 0, 'You should have 0 finalproduct in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p1, self.stock_location, lotId=lot), 100, 'You should have 80 products in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location), 5, 'You should have consumed all the 5 product in stock')

        x = Form(self.env['mrp.unbuild'])
        x.productId = p_final
        x.bomId = bom
        x.moId = mo
        x.productQty = 5
        x.save().action_unbuild()

        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location, allow_negative=True), -5, 'You should have negative quantity for final product in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p1, self.stock_location, lotId=lot), 120, 'You should have 80 products in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location), 10, 'You should have consumed all the 5 product in stock')

    def test_unbuild_with_everything_tracked(self):
        """ This test creates a MO and then creates 3 unbuild
        orders for the final product. All the products for this
        test are tracked. It checks the stock state after each order
        and ensure it is correct.
        """
        mo, bom, p_final, p1, p2 = self.generate_mo(tracking_final='lot', tracking_base_2='lot', tracking_base_1='lot')
        self.assertEqual(len(mo), 1, 'MO should have been created')

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

        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 100, lotId=lot_1)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 5, lotId=lot_2)
        mo.action_assign()

        # FIXME sle: behavior change
        mo_form = Form(mo)
        mo_form.qtyProducing = 5.0
        mo_form.lotProducingId = lot_final
        mo = mo_form.save()
        details_operation_form = Form(mo.moveRawIds[0], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.edit(0) as ml:
            ml.qtyDone = 5
        details_operation_form.save()
        details_operation_form = Form(mo.moveRawIds[1], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.edit(0) as ml:
            ml.qtyDone = 20
        details_operation_form.save()

        mo.button_mark_done()
        self.assertEqual(mo.state, 'done', "Production order should be in done state.")
        # Check quantity in stock before unbuild.
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location, lotId=lot_final), 5, 'You should have the 5 final product in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p1, self.stock_location, lotId=lot_1), 80, 'You should have 80 products in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location, lotId=lot_2), 0, 'You should have consumed all the 5 product in stock')

        # ---------------------------------------------------
        #       unbuild
        # ---------------------------------------------------

        x = Form(self.env['mrp.unbuild'])
        with self.assertRaises(AssertionError):
            x.productId = p_final
            x.bomId = bom
            x.productQty = 3
            x.save()

        with self.assertRaises(AssertionError):
            x.productId = p_final
            x.bomId = bom
            x.productQty = 3
            x.save()

        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location, lotId=lot_final), 5, 'You should have consumed 3 final product in stock')

        with self.assertRaises(AssertionError):
            x.productId = p_final
            x.bomId = bom
            x.moId = mo
            x.productQty = 3
            x.save()

        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location, lotId=lot_final), 5, 'You should have consumed 3 final product in stock')

        x = Form(self.env['mrp.unbuild'])
        x.productId = p_final
        x.bomId = bom
        x.moId = mo
        x.productQty = 3
        x.lotId = lot_final
        x.save().action_unbuild()

        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location, lotId=lot_final), 2, 'You should have consumed 3 final product in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p1, self.stock_location, lotId=lot_1), 92, 'You should have 92 products in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location, lotId=lot_2), 3, 'You should have consumed all the 5 product in stock')

        x = Form(self.env['mrp.unbuild'])
        x.productId = p_final
        x.bomId = bom
        x.moId = mo
        x.productQty = 2
        x.lotId = lot_final
        x.save().action_unbuild()

        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location, lotId=lot_final), 0, 'You should have 0 finalproduct in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p1, self.stock_location, lotId=lot_1), 100, 'You should have 80 products in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location, lotId=lot_2), 5, 'You should have consumed all the 5 product in stock')

        x = Form(self.env['mrp.unbuild'])
        x.productId = p_final
        x.bomId = bom
        x.moId = mo
        x.productQty = 5
        x.lotId = lot_final
        x.save().action_unbuild()

        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location, lotId=lot_final, allow_negative=True), -5, 'You should have negative quantity for final product in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p1, self.stock_location, lotId=lot_1), 120, 'You should have 80 products in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location, lotId=lot_2), 10, 'You should have consumed all the 5 product in stock')

    def test_unbuild_with_duplicate_move(self):
        """ This test creates a MO from 3 different lot on a consumed product (p2).
        The unbuild order should revert the correct quantity for each specific lot.
        """
        mo, bom, p_final, p1, p2 = self.generate_mo(tracking_final='none', tracking_base_2='lot', tracking_base_1='none')
        self.assertEqual(len(mo), 1, 'MO should have been created')

        lot_1 = self.env['stock.production.lot'].create({
            'name': 'lot_1',
            'productId': p2.id,
            'companyId': self.env.company.id,
        })
        lot_2 = self.env['stock.production.lot'].create({
            'name': 'lot_2',
            'productId': p2.id,
            'companyId': self.env.company.id,
        })
        lot_3 = self.env['stock.production.lot'].create({
            'name': 'lot_3',
            'productId': p2.id,
            'companyId': self.env.company.id,
        })
        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 100)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 1, lotId=lot_1)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 3, lotId=lot_2)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 2, lotId=lot_3)
        mo.action_assign()

        mo_form = Form(mo)
        mo_form.qtyProducing = 5.0
        mo = mo_form.save()
        details_operation_form = Form(mo.moveRawIds.filtered(lambda ml: ml.productId == p2), view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.edit(0) as ml:
            ml.qtyDone = ml.productUomQty
        with details_operation_form.moveLineIds.edit(1) as ml:
            ml.qtyDone = ml.productUomQty
        with details_operation_form.moveLineIds.edit(2) as ml:
            ml.qtyDone = ml.productUomQty
        details_operation_form.save()

        mo.button_mark_done()
        self.assertEqual(mo.state, 'done', "Production order should be in done state.")
        # Check quantity in stock before unbuild.
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location), 5, 'You should have the 5 final product in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p1, self.stock_location), 80, 'You should have 80 products in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location, lotId=lot_1), 0, 'You should have consumed all the 1 product for lot 1 in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location, lotId=lot_2), 0, 'You should have consumed all the 3 product for lot 2 in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location, lotId=lot_3), 1, 'You should have consumed only 1 product for lot3 in stock')

        x = Form(self.env['mrp.unbuild'])
        x.productId = p_final
        x.bomId = bom
        x.moId = mo
        x.productQty = 5
        x.save().action_unbuild()

        self.assertEqual(self.env['stock.quant']._get_available_quantity(p_final, self.stock_location), 0, 'You should have no more final product in stock after unbuild')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p1, self.stock_location), 100, 'You should have 80 products in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location, lotId=lot_1), 1, 'You should have get your product with lot 1 in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location, lotId=lot_2), 3, 'You should have the 3 basic product for lot 2 in stock')
        self.assertEqual(self.env['stock.quant']._get_available_quantity(p2, self.stock_location, lotId=lot_3), 2, 'You should have get one product back for lot 3')

    def test_production_links_with_non_tracked_lots(self):
        """ This test produces an MO in two times and checks that the move lines are linked in a correct way
        """
        mo, bom, p_final, p1, p2 = self.generate_mo(tracking_final='lot', tracking_base_1='none', tracking_base_2='lot')
        # Young Tom
        #    \ Botox - 4 - p1
        #    \ Old Tom - 1 - p2
        lot_1 = self.env['stock.production.lot'].create({
            'name': 'lot_1',
            'productId': p2.id,
            'companyId': self.env.company.id,
        })

        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 3, lotId=lot_1)
        lot_finished_1 = self.env['stock.production.lot'].create({
            'name': 'lot_finished_1',
            'productId': p_final.id,
            'companyId': self.env.company.id,
        })

        self.assertEqual(mo.productQty, 5)
        mo_form = Form(mo)
        mo_form.qtyProducing = 3.0
        mo_form.lotProducingId = lot_finished_1
        mo = mo_form.save()
        self.assertEqual(mo.moveRawIds[1].quantityDone, 12)
        details_operation_form = Form(mo.moveRawIds[0], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.qtyDone = 3
            ml.lotId = lot_1
        details_operation_form.save()
        action = mo.button_mark_done()
        backorder = Form(self.env[action['resModel']].withContext(**action['context']))
        backorder.save().action_backorder()

        lot_2 = self.env['stock.production.lot'].create({
            'name': 'lot_2',
            'productId': p2.id,
            'companyId': self.env.company.id,
        })

        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 4, lotId=lot_2)
        lot_finished_2 = self.env['stock.production.lot'].create({
            'name': 'lot_finished_2',
            'productId': p_final.id,
            'companyId': self.env.company.id,
        })

        mo = mo.procurementGroupId.mrpProductionIds[1]
        # FIXME sle: issue in backorder?
        mo.moveRawIds.moveLineIds.unlink()
        self.assertEqual(mo.productQty, 2)
        mo_form = Form(mo)
        mo_form.qtyProducing = 2
        mo_form.lotProducingId = lot_finished_2
        mo = mo_form.save()
        details_operation_form = Form(mo.moveRawIds[0], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.qtyDone = 2
            ml.lotId = lot_2
        details_operation_form.save()
        action = mo.button_mark_done()

        mo1 = mo.procurementGroupId.mrpProductionIds[0]
        ml = mo1.finished_move_line_ids[0].consume_line_ids.filtered(lambda m: m.productId == p1 and lot_finished_1 in m.produce_line_ids.lotId)
        self.assertEqual(sum(ml.mapped('qtyDone')), 12.0, 'Should have consumed 12 for the first lot')
        ml = mo.finished_move_line_ids[0].consume_line_ids.filtered(lambda m: m.productId == p1 and lot_finished_2 in m.produce_line_ids.lotId)
        self.assertEqual(sum(ml.mapped('qtyDone')), 8.0, 'Should have consumed 8 for the second lot')

    def test_unbuild_with_routes(self):
        """ This test creates a MO of a stockable product (Table). A new route for rule QC/Unbuild -> Stock
        is created with Warehouse -> True.
        The unbuild order should revert the consumed components into QC/Unbuild location for quality check
        and then a picking should be generated for transferring components from QC/Unbuild location to stock.
        """
        StockQuant = self.env['stock.quant']
        ProductObj = self.env['product.product']
        # Create new QC/Unbuild location
        warehouse = self.env.ref('stock.warehouse0')
        unbuild_location = self.env['stock.location'].create({
            'name': 'QC/Unbuild',
            'usage': 'internal',
            'locationId': warehouse.view_location_id.id
        })

        # Create a product route containing a stock rule that will move product from QC/Unbuild location to stock
        product_route = self.env['stock.location.route'].create({
            'name': 'QC/Unbuild -> Stock',
            'warehouse_selectable': True,
            'warehouse_ids': [(4, warehouse.id)],
            'rule_ids': [(0, 0, {
                'name': 'Send Matrial QC/Unbuild -> Stock',
                'action': 'push',
                'pickingTypeId': self.ref('stock.picking_type_internal'),
                'locationSrcId': unbuild_location.id,
                'locationId': self.stock_location.id,
            })],
        })

        # Create a stockable product and its components
        finshed_product = ProductObj.create({
            'name': 'Table',
            'type': 'product',
        })
        component1 = ProductObj.create({
            'name': 'Table head',
            'type': 'product',
        })
        component2 = ProductObj.create({
            'name': 'Table stand',
            'type': 'product',
        })

        # Create bom and add components
        bom = self.env['mrp.bom'].create({
            'productId': finshed_product.id,
            'productTemplateId': finshed_product.productTemplateId.id,
            'productUomId': self.uom_unit.id,
            'productQty': 1.0,
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': component1.id, 'productQty': 1}),
                (0, 0, {'productId': component2.id, 'productQty': 1})
            ]})

        # Set on hand quantity
        StockQuant._update_available_quantity(component1, self.stock_location, 1)
        StockQuant._update_available_quantity(component2, self.stock_location, 1)

        # Create mo
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = finshed_product
        mo_form.bomId = bom
        mo_form.productUomId = finshed_product.uomId
        mo_form.productQty = 1.0
        mo = mo_form.save()
        self.assertEqual(len(mo), 1, 'MO should have been created')
        mo.action_confirm()
        mo.action_assign()

        # Produce the final product
        mo_form = Form(mo)
        mo_form.qtyProducing = 1.0
        produce_wizard = mo_form.save()

        mo.button_mark_done()
        self.assertEqual(mo.state, 'done', "Production order should be in done state.")

        # Check quantity in stock before unbuild
        self.assertEqual(StockQuant._get_available_quantity(finshed_product, self.stock_location), 1, 'Table should be available in stock')
        self.assertEqual(StockQuant._get_available_quantity(component1, self.stock_location), 0, 'Table head should not be available in stock')
        self.assertEqual(StockQuant._get_available_quantity(component2, self.stock_location), 0, 'Table stand should not be available in stock')

        # ---------------------------------------------------
        #       Unbuild
        # ---------------------------------------------------

        # Create an unbuild order of the finished product and set the destination loacation = QC/Unbuild
        x = Form(self.env['mrp.unbuild'])
        x.productId = finshed_product
        x.bomId = bom
        x.moId = mo
        x.productQty = 1
        x.locationId = self.stock_location
        x.locationDestId = unbuild_location
        x.save().action_unbuild()

        # Check the available quantity of components and final product in stock
        self.assertEqual(StockQuant._get_available_quantity(finshed_product, self.stock_location), 0, 'Table should not be available in stock as it is unbuild')
        self.assertEqual(StockQuant._get_available_quantity(component1, self.stock_location), 0, 'Table head should not be available in stock as it is in QC/Unbuild location')
        self.assertEqual(StockQuant._get_available_quantity(component2, self.stock_location), 0, 'Table stand should not be available in stock as it is in QC/Unbuild location')

        # Find new generated picking
        picking = self.env['stock.picking'].search([('productId', 'in', [component1.id, component2.id])])
        self.assertEqual(picking.locationId.id, unbuild_location.id, 'Wrong source location in picking')
        self.assertEqual(picking.locationDestId.id, self.stock_location.id, 'Wrong destination location in picking')

        # Transfer it
        for ml in picking.move_ids_without_package:
            ml.quantityDone = 1
        picking._action_done()

        # Check the available quantity of components and final product in stock
        self.assertEqual(StockQuant._get_available_quantity(finshed_product, self.stock_location), 0, 'Table should not be available in stock')
        self.assertEqual(StockQuant._get_available_quantity(component1, self.stock_location), 1, 'Table head should be available in stock as the picking is transferred')
        self.assertEqual(StockQuant._get_available_quantity(component2, self.stock_location), 1, 'Table stand should be available in stock as the picking is transferred')

    def test_unbuild_decimal_qty(self):
        """
        Use case:
        - decimal accuracy of Product UoM > decimal accuracy of Units
        - unbuild a product with a decimal quantity of component
        """
        self.env['decimal.precision'].search([('name', '=', 'Product Unit of Measure')]).digits = 4
        self.uom_unit.rounding = 0.001

        self.bom_1.productQty = 3
        self.bom_1.bom_line_ids.productQty = 5
        self.env['stock.quant']._update_available_quantity(self.product_2, self.stock_location, 3)

        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = self.bom_1.productId
        mo_form.bomId = self.bom_1
        mo = mo_form.save()
        mo.action_confirm()
        mo.action_assign()

        mo_form = Form(mo)
        mo_form.qtyProducing = 3
        mo_form.save()
        mo.button_mark_done()

        uo_form = Form(self.env['mrp.unbuild'])
        uo_form.moId = mo
        # Unbuilding one product means a decimal quantity equal to 1 / 3 * 5 for each component
        uo_form.productQty = 1
        uo = uo_form.save()
        uo.action_unbuild()
        self.assertEqual(uo.state, 'done')

    def test_unbuild_similar_tracked_components(self):
        """
        Suppose a MO with, in the components, two lines for the same tracked-by-usn product
        When unbuilding such an MO, all SN used in the MO should be back in stock
        """
        compo, finished = self.env['product.product'].create([{
            'name': 'compo',
            'type': 'product',
            'tracking': 'serial',
        }, {
            'name': 'finished',
            'type': 'product',
        }])

        lot01, lot02 = self.env['stock.production.lot'].create([{
            'name': n,
            'productId': compo.id,
            'companyId': self.env.company.id,
        } for n in ['lot01', 'lot02']])
        self.env['stock.quant']._update_available_quantity(compo, self.stock_location, 1, lotId=lot01)
        self.env['stock.quant']._update_available_quantity(compo, self.stock_location, 1, lotId=lot02)

        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = finished
        with mo_form.moveRawIds.new() as line:
            line.productId = compo
            line.productUomQty = 1
        with mo_form.moveRawIds.new() as line:
            line.productId = compo
            line.productUomQty = 1
        mo = mo_form.save()

        mo.action_confirm()
        mo_form = Form(mo)
        mo_form.qtyProducing = 1
        mo = mo_form.save()
        mo.action_assign()

        details_operation_form = Form(mo.moveRawIds[0], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.edit(0) as ml:
            ml.qtyDone = 1
        details_operation_form.save()
        details_operation_form = Form(mo.moveRawIds[1], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.edit(0) as ml:
            ml.qtyDone = 1
        details_operation_form.save()
        mo.button_mark_done()

        uo_form = Form(self.env['mrp.unbuild'])
        uo_form.moId = mo
        uo_form.productQty = 1
        uo = uo_form.save()
        uo.action_unbuild()

        self.assertEqual(uo.produce_line_ids.filtered(lambda sm: sm.productId == compo).lot_ids, lot01 + lot02)

    def test_unbuild_and_multilocations(self):
        """
        Basic flow: produce p_final, transfer it to a sub-location and then
        unbuild it. The test ensures that the source/destination locations of an
        unbuild order are applied on the stock moves
        """
        grp_multi_loc = self.env.ref('stock.group_stock_multi_locations')
        self.env.user.write({'groupsId': [(4, grp_multi_loc.id, 0)]})
        warehouse = self.env['stock.warehouse'].search([('companyId', '=', self.env.user.id)], limit=1)
        prod_location = self.env['stock.location'].search([('usage', '=', 'production'), ('companyId', '=', self.env.user.id)])
        subloc01, subloc02, = self.stock_location.child_ids[:2]

        mo, _, p_final, p1, p2 = self.generate_mo(qty_final=1, qty_base_1=1, qty_base_2=1)

        self.env['stock.quant']._update_available_quantity(p1, self.stock_location, 1)
        self.env['stock.quant']._update_available_quantity(p2, self.stock_location, 1)
        mo.action_assign()

        mo_form = Form(mo)
        mo_form.qtyProducing = 1.0
        mo = mo_form.save()
        mo.button_mark_done()

        # Transfer the finished product from WH/Stock to `subloc01`
        internal_form = Form(self.env['stock.picking'])
        internal_form.pickingTypeId = warehouse.int_type_id
        internal_form.locationId = self.stock_location
        internal_form.locationDestId = subloc01
        with internal_form.move_ids_without_package.new() as move:
            move.productId = p_final
            move.productUomQty = 1.0
        internal_transfer = internal_form.save()
        internal_transfer.action_confirm()
        internal_transfer.action_assign()
        internal_transfer.moveLineIds.qtyDone = 1.0
        internal_transfer.button_validate()

        unbuild_order_form = Form(self.env['mrp.unbuild'])
        unbuild_order_form.moId = mo
        unbuild_order_form.locationId = subloc01
        unbuild_order_form.locationDestId = subloc02
        unbuild_order = unbuild_order_form.save()
        unbuild_order.action_unbuild()

        self.assertRecordValues(unbuild_order.produce_line_ids, [
            # pylint: disable=bad-whitespace
            {'productId': p_final.id,  'locationId': subloc01.id,         'locationDestId': prod_location.id},
            {'productId': p2.id,       'locationId': prod_location.id,    'locationDestId': subloc02.id},
            {'productId': p1.id,       'locationId': prod_location.id,    'locationDestId': subloc02.id},
        ])

    def test_use_unbuilt_sn_in_mo(self):
        """
            use an unbuilt serial number in manufacturing order:
            produce a tracked product, unbuild it and then use it as a component with the same SN in a mo.
        """
        product_1 = self.env['product.product'].create({
            'name': 'Product tracked by sn',
            'type': 'product',
            'tracking': 'serial',
        })
        product_1_sn = self.env['stock.production.lot'].create({
            'productId': product_1.id,
            'companyId': self.env.company.id})
        component = self.env['product.product'].create({
            'name': 'Product component',
            'type': 'product',
        })
        bom_1 = self.env['mrp.bom'].create({
            'productId': product_1.id,
            'productTemplateId': product_1.productTemplateId.id,
            'productUomId': self.env.ref('uom.productUomUnit').id,
            'productQty': 1.0,
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': component.id, 'productQty': 1}),
            ],
        })
        product_2 = self.env['product.product'].create({
            'name': 'finished Product',
            'type': 'product',
        })
        self.env['mrp.bom'].create({
            'productId': product_2.id,
            'productTemplateId': product_2.productTemplateId.id,
            'productUomId': self.env.ref('uom.productUomUnit').id,
            'productQty': 1.0,
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': product_1.id, 'productQty': 1}),
            ],
        })
        # mo1
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = product_1
        mo_form.bomId = bom_1
        mo_form.productQty = 1.0
        mo = mo_form.save()
        mo.action_confirm()

        mo_form = Form(mo)
        mo_form.qtyProducing = 1.0
        mo_form.lotProducingId = product_1_sn
        mo = mo_form.save()
        mo.button_mark_done()
        self.assertEqual(mo.state, 'done', "Production order should be in done state.")

        #unbuild order
        unbuild_form = Form(self.env['mrp.unbuild'])
        unbuild_form.moId = mo
        unbuild_form.lotId = product_1_sn
        unbuild_form.save().action_unbuild()

        #mo2
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = product_2
        mo2 = mo_form.save()
        mo2.action_confirm()
        details_operation_form = Form(mo2.moveRawIds[0], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.lotId = product_1_sn
            ml.qtyDone = 1
        details_operation_form.save()
        mo_form = Form(mo2)
        mo_form.qtyProducing = 1
        mo2 = mo_form.save()
        mo2.button_mark_done()
        self.assertEqual(mo2.state, 'done', "Production order should be in done state.")
