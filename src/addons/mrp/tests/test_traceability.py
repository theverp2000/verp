# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp.tests import Form
from verp.addons.mrp.tests.common import TestMrpCommon
import logging

_logger = logging.getLogger(__name__)


class TestTraceability(TestMrpCommon):
    TRACKING_TYPES = ['none', 'serial', 'lot']

    def _create_product(self, tracking):
        return self.env['product.product'].create({
            'name': 'Product %s' % tracking,
            'type': 'product',
            'tracking': tracking,
            'categId': self.env.ref('product.product_category_all').id,
        })

    def test_tracking_types_on_mo(self):
        finished_no_track = self._create_product('none')
        finished_lot = self._create_product('lot')
        finished_serial = self._create_product('serial')
        consumed_no_track = self._create_product('none')
        consumed_lot = self._create_product('lot')
        consumed_serial = self._create_product('serial')
        stock_id = self.env.ref('stock.stock_location_stock').id
        Lot = self.env['stock.production.lot']
        # create inventory
        quants = self.env['stock.quant'].create({
            'locationId': stock_id,
            'productId': consumed_no_track.id,
            'inventoryQuantity': 3
        })
        quants |= self.env['stock.quant'].create({
            'locationId': stock_id,
            'productId': consumed_lot.id,
            'inventoryQuantity': 3,
            'lotId': Lot.create({'name': 'L1', 'productId': consumed_lot.id, 'companyId': self.env.company.id}).id
        })
        quants |= self.env['stock.quant'].create({
            'locationId': stock_id,
            'productId': consumed_serial.id,
            'inventoryQuantity': 1,
            'lotId': Lot.create({'name': 'S1', 'productId': consumed_serial.id, 'companyId': self.env.company.id}).id
        })
        quants |= self.env['stock.quant'].create({
            'locationId': stock_id,
            'productId': consumed_serial.id,
            'inventoryQuantity': 1,
            'lotId': Lot.create({'name': 'S2', 'productId': consumed_serial.id, 'companyId': self.env.company.id}).id
        })
        quants |= self.env['stock.quant'].create({
            'locationId': stock_id,
            'productId': consumed_serial.id,
            'inventoryQuantity': 1,
            'lotId': Lot.create({'name': 'S3', 'productId': consumed_serial.id, 'companyId': self.env.company.id}).id
        })
        quants.action_apply_inventory()

        for finished_product in [finished_no_track, finished_lot, finished_serial]:
            bom = self.env['mrp.bom'].create({
                'productId': finished_product.id,
                'productTemplateId': finished_product.productTemplateId.id,
                'productUomId': self.env.ref('uom.productUomUnit').id,
                'productQty': 1.0,
                'type': 'normal',
                'bom_line_ids': [
                    (0, 0, {'productId': consumed_no_track.id, 'productQty': 1}),
                    (0, 0, {'productId': consumed_lot.id, 'productQty': 1}),
                    (0, 0, {'productId': consumed_serial.id, 'productQty': 1}),
                ],
            })

            mo_form = Form(self.env['mrp.production'])
            mo_form.productId = finished_product
            mo_form.bomId = bom
            mo_form.productUomId = self.env.ref('uom.productUomUnit')
            mo_form.productQty = 1
            mo = mo_form.save()
            mo.action_confirm()
            mo.action_assign()

            # Start MO production
            mo_form = Form(mo)
            mo_form.qtyProducing = 1
            if finished_product.tracking != 'none':
                mo_form.lotProducingId = self.env['stock.production.lot'].create({'name': 'Serial or Lot finished', 'productId': finished_product.id, 'companyId': self.env.company.id})
            mo = mo_form.save()

            details_operation_form = Form(mo.moveRawIds[1], view=self.env.ref('stock.view_stock_move_operations'))
            with details_operation_form.moveLineIds.edit(0) as ml:
                ml.qtyDone = 1
            details_operation_form.save()
            details_operation_form = Form(mo.moveRawIds[2], view=self.env.ref('stock.view_stock_move_operations'))
            with details_operation_form.moveLineIds.edit(0) as ml:
                ml.qtyDone = 1
            details_operation_form.save()

            mo.button_mark_done()
            self.assertEqual(mo.state, 'done', "Production order should be in done state.")

            # Check results of traceability
            context = ({
                'activeId': mo.id,
                'model': 'mrp.production',
            })
            lines = self.env['stock.traceability.report'].withContext(context).get_lines()
            self.assertEqual(len(lines), 1, "Should always return 1 line : the final product")
            final_product = lines[0]
            self.assertEqual(final_product['unfoldable'], True, "Final product should always be unfoldable")

            # Find parts of the final products
            lines = self.env['stock.traceability.report'].get_lines(final_product['id'], **{
                'level': final_product['level'],
                'modelId': final_product['modelId'],
                'model_name': final_product['model'],
            })
            self.assertEqual(len(lines), 3, "There should be 3 lines. 1 for untracked, 1 for lot, and 1 for serial")

            for line in lines:
                tracking = line['columns'][1].split(' ')[1]
                self.assertEqual(
                    line['columns'][-1], "1.00 Units", 'Part with tracking type "%s", should have quantity = 1' % (tracking)
                )
                unfoldable = False if tracking == 'none' else True
                self.assertEqual(
                    line['unfoldable'],
                    unfoldable,
                    'Parts with tracking type "%s", should have be unfoldable : %s' % (tracking, unfoldable)
                )

    def test_tracking_on_byproducts(self):
        product_final = self.env['product.product'].create({
            'name': 'Finished Product',
            'type': 'product',
            'tracking': 'serial',
        })
        product_1 = self.env['product.product'].create({
            'name': 'Raw 1',
            'type': 'product',
            'tracking': 'serial',
        })
        product_2 = self.env['product.product'].create({
            'name': 'Raw 2',
            'type': 'product',
            'tracking': 'serial',
        })
        byproduct_1 = self.env['product.product'].create({
            'name': 'Byproduct 1',
            'type': 'product',
            'tracking': 'serial',
        })
        byproduct_2 = self.env['product.product'].create({
            'name': 'Byproduct 2',
            'type': 'product',
            'tracking': 'serial',
        })
        bom_1 = self.env['mrp.bom'].create({
            'productId': product_final.id,
            'productTemplateId': product_final.productTemplateId.id,
            'productUomId': self.uom_unit.id,
            'productQty': 1.0,
            'consumption': 'flexible',
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': product_1.id, 'productQty': 1}),
                (0, 0, {'productId': product_2.id, 'productQty': 1})
            ],
            'byproduct_ids': [
                (0, 0, {'productId': byproduct_1.id, 'productQty': 1, 'productUomId': byproduct_1.uomId.id}),
                (0, 0, {'productId': byproduct_2.id, 'productQty': 1, 'productUomId': byproduct_2.uomId.id})
            ]})
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = product_final
        mo_form.bomId = bom_1
        mo_form.productQty = 2
        mo = mo_form.save()
        mo.action_confirm()

        mo_form = Form(mo)
        mo_form.lotProducingId = self.env['stock.production.lot'].create({
            'productId': product_final.id,
            'name': 'Final_lot_1',
            'companyId': self.env.company.id,
        })
        mo = mo_form.save()

        details_operation_form = Form(mo.moveRawIds[0], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.lotId = self.env['stock.production.lot'].create({
                'productId': product_1.id,
                'name': 'Raw_1_lot_1',
                'companyId': self.env.company.id,
            })
            ml.qtyDone = 1
        details_operation_form.save()
        details_operation_form = Form(mo.moveRawIds[1], view=self.env.ref('stock.view_stock_move_operations'))
        with details_operation_form.moveLineIds.new() as ml:
            ml.lotId = self.env['stock.production.lot'].create({
                'productId': product_2.id,
                'name': 'Raw_2_lot_1',
                'companyId': self.env.company.id,
            })
            ml.qtyDone = 1
        details_operation_form.save()
        details_operation_form = Form(
            mo.move_finished_ids.filtered(lambda m: m.productId == byproduct_1),
            view=self.env.ref('stock.view_stock_move_operations')
        )
        with details_operation_form.moveLineIds.new() as ml:
            ml.lotId = self.env['stock.production.lot'].create({
                'productId': byproduct_1.id,
                'name': 'Byproduct_1_lot_1',
                'companyId': self.env.company.id,
            })
            ml.qtyDone = 1
        details_operation_form.save()
        details_operation_form = Form(
            mo.move_finished_ids.filtered(lambda m: m.productId == byproduct_2),
            view=self.env.ref('stock.view_stock_move_operations')
        )
        with details_operation_form.moveLineIds.new() as ml:
            ml.lotId = self.env['stock.production.lot'].create({
                'productId': byproduct_2.id,
                'name': 'Byproduct_2_lot_1',
                'companyId': self.env.company.id,
            })
            ml.qtyDone = 1
        details_operation_form.save()

        action = mo.button_mark_done()
        backorder = Form(self.env['mrp.production.backorder'].withContext(**action['context']))
        backorder.save().action_backorder()
        mo_backorder = mo.procurementGroupId.mrpProductionIds[-1]
        mo_form = Form(mo_backorder)
        mo_form.lotProducingId = self.env['stock.production.lot'].create({
            'productId': product_final.id,
            'name': 'Final_lot_2',
            'companyId': self.env.company.id,
        })
        mo_form.qtyProducing = 1
        mo_backorder = mo_form.save()

        details_operation_form = Form(
            mo_backorder.moveRawIds.filtered(lambda m: m.productId == product_1),
            view=self.env.ref('stock.view_stock_move_operations')
        )
        with details_operation_form.moveLineIds.new() as ml:
            ml.lotId = self.env['stock.production.lot'].create({
                'productId': product_1.id,
                'name': 'Raw_1_lot_2',
                'companyId': self.env.company.id,
            })
            ml.qtyDone = 1
        details_operation_form.save()
        details_operation_form = Form(
            mo_backorder.moveRawIds.filtered(lambda m: m.productId == product_2),
            view=self.env.ref('stock.view_stock_move_operations')
        )
        with details_operation_form.moveLineIds.new() as ml:
            ml.lotId = self.env['stock.production.lot'].create({
                'productId': product_2.id,
                'name': 'Raw_2_lot_2',
                'companyId': self.env.company.id,
            })
            ml.qtyDone = 1
        details_operation_form.save()
        details_operation_form = Form(
            mo_backorder.move_finished_ids.filtered(lambda m: m.productId == byproduct_1),
            view=self.env.ref('stock.view_stock_move_operations')
        )
        with details_operation_form.moveLineIds.new() as ml:
            ml.lotId = self.env['stock.production.lot'].create({
                'productId': byproduct_1.id,
                'name': 'Byproduct_1_lot_2',
                'companyId': self.env.company.id,
            })
            ml.qtyDone = 1
        details_operation_form.save()
        details_operation_form = Form(
            mo_backorder.move_finished_ids.filtered(lambda m: m.productId == byproduct_2),
            view=self.env.ref('stock.view_stock_move_operations')
        )
        with details_operation_form.moveLineIds.new() as ml:
            ml.lotId = self.env['stock.production.lot'].create({
                'productId': byproduct_2.id,
                'name': 'Byproduct_2_lot_2',
                'companyId': self.env.company.id,
            })
            ml.qtyDone = 1
        details_operation_form.save()

        mo_backorder.button_mark_done()

        # self.assertEqual(len(mo.moveRawIds.mapped('moveLineIds')), 4)
        # self.assertEqual(len(mo.move_finished_ids.mapped('moveLineIds')), 6)

        mo = mo | mo_backorder
        raw_move_lines = mo.moveRawIds.mapped('moveLineIds')
        raw_line_raw_1_lot_1 = raw_move_lines.filtered(lambda ml: ml.lotId.name == 'Raw_1_lot_1')
        self.assertEqual(set(raw_line_raw_1_lot_1.produce_line_ids.lotId.mapped('name')), set(['Final_lot_1', 'Byproduct_1_lot_1', 'Byproduct_2_lot_1']))
        raw_line_raw_2_lot_1 = raw_move_lines.filtered(lambda ml: ml.lotId.name == 'Raw_2_lot_1')
        self.assertEqual(set(raw_line_raw_2_lot_1.produce_line_ids.lotId.mapped('name')), set(['Final_lot_1', 'Byproduct_1_lot_1', 'Byproduct_2_lot_1']))

        finished_move_lines = mo.move_finished_ids.mapped('moveLineIds')
        finished_move_line_lot_1 = finished_move_lines.filtered(lambda ml: ml.lotId.name == 'Final_lot_1')
        self.assertEqual(finished_move_line_lot_1.consume_line_ids.filtered(lambda l: l.qtyDone), raw_line_raw_1_lot_1 | raw_line_raw_2_lot_1)
        finished_move_line_lot_2 = finished_move_lines.filtered(lambda ml: ml.lotId.name == 'Final_lot_2')
        raw_line_raw_1_lot_2 = raw_move_lines.filtered(lambda ml: ml.lotId.name == 'Raw_1_lot_2')
        raw_line_raw_2_lot_2 = raw_move_lines.filtered(lambda ml: ml.lotId.name == 'Raw_2_lot_2')
        self.assertEqual(finished_move_line_lot_2.consume_line_ids, raw_line_raw_1_lot_2 | raw_line_raw_2_lot_2)

        byproduct_move_line_1_lot_1 = finished_move_lines.filtered(lambda ml: ml.lotId.name == 'Byproduct_1_lot_1')
        self.assertEqual(byproduct_move_line_1_lot_1.consume_line_ids.filtered(lambda l: l.qtyDone), raw_line_raw_1_lot_1 | raw_line_raw_2_lot_1)
        byproduct_move_line_1_lot_2 = finished_move_lines.filtered(lambda ml: ml.lotId.name == 'Byproduct_1_lot_2')
        self.assertEqual(byproduct_move_line_1_lot_2.consume_line_ids, raw_line_raw_1_lot_2 | raw_line_raw_2_lot_2)

        byproduct_move_line_2_lot_1 = finished_move_lines.filtered(lambda ml: ml.lotId.name == 'Byproduct_2_lot_1')
        self.assertEqual(byproduct_move_line_2_lot_1.consume_line_ids.filtered(lambda l: l.qtyDone), raw_line_raw_1_lot_1 | raw_line_raw_2_lot_1)
        byproduct_move_line_2_lot_2 = finished_move_lines.filtered(lambda ml: ml.lotId.name == 'Byproduct_2_lot_2')
        self.assertEqual(byproduct_move_line_2_lot_2.consume_line_ids, raw_line_raw_1_lot_2 | raw_line_raw_2_lot_2)

    def test_reuse_unbuilt_usn(self):
        """
        Produce a SN product
        Unbuilt it
        Produce a new SN product with same lot
        """
        mo, bom, p_final, p1, p2 = self.generate_mo(qty_base_1=1, qty_base_2=1, qty_final=1, tracking_final='serial')
        stock_location = self.env.ref('stock.stock_location_stock')
        self.env['stock.quant']._update_available_quantity(p1, stock_location, 1)
        self.env['stock.quant']._update_available_quantity(p2, stock_location, 1)
        mo.action_assign()

        lot = self.env['stock.production.lot'].create({
            'name': 'lot1',
            'productId': p_final.id,
            'companyId': self.env.company.id,
        })

        mo_form = Form(mo)
        mo_form.qtyProducing = 1.0
        mo_form.lotProducingId = lot
        mo = mo_form.save()
        mo.button_mark_done()

        unbuild_form = Form(self.env['mrp.unbuild'])
        unbuild_form.moId = mo
        unbuild_form.lotId = lot
        unbuild_form.save().action_unbuild()

        mo_form = Form(self.env['mrp.production'])
        mo_form.bomId = bom
        mo = mo_form.save()
        mo.action_confirm()

        with self.assertLogs(level="WARNING") as log_catcher:
            mo_form = Form(mo)
            mo_form.qtyProducing = 1.0
            mo_form.lotProducingId = lot
            mo = mo_form.save()
            _logger.warning('Dummy')
        self.assertEqual(len(log_catcher.output), 1, "Useless warnings: \n%s" % "\n".join(log_catcher.output[:-1]))

        mo.button_mark_done()
        self.assertEqual(mo.state, 'done')

    def test_tracked_and_manufactured_component(self):
        """
        Suppose this structure:
            productA --|- 1 x productB --|- 1 x productC
            with productB tracked by lot
        Ensure that, when we already have some qty of productB (with different lots),
        the user can produce several productA and can then produce some productB again
        """
        stock_location = self.env.ref('stock.stock_location_stock')

        productA, productB, productC = self.env['product.product'].create([{
            'name': 'Product A',
            'type': 'product',
        }, {
            'name': 'Product B',
            'type': 'product',
            'tracking': 'lot',
        }, {
            'name': 'Product C',
            'type': 'consu',
        }])

        lot_B01, lot_B02, lot_B03 = self.env['stock.production.lot'].create([{
            'name': 'lot %s' % i,
            'productId': productB.id,
            'companyId': self.env.company.id,
        } for i in [1, 2, 3]])

        self.env['mrp.bom'].create([{
            'productId': finished.id,
            'productTemplateId': finished.productTemplateId.id,
            'productUomId': self.uom_unit.id,
            'productQty': 1.0,
            'type': 'normal',
            'bom_line_ids': [(0, 0, {'productId': component.id, 'productQty': 1})],
        } for finished, component in [(productA, productB), (productB, productC)]])

        self.env['stock.quant']._update_available_quantity(productB, stock_location, 10, lotId=lot_B01)
        self.env['stock.quant']._update_available_quantity(productB, stock_location, 5, lotId=lot_B02)

        # Produce 15 x productA
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = productA
        mo_form.productQty = 15
        mo = mo_form.save()
        mo.action_confirm()
        action = mo.button_mark_done()
        wizard = Form(self.env[action['resModel']].withContext(action['context'])).save()
        wizard.process()

        # Produce 15 x productB
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = productB
        mo_form.productQty = 15
        mo = mo_form.save()
        mo.action_confirm()
        mo_form = Form(mo)
        mo_form.qtyProducing = 15
        mo_form.lotProducingId = lot_B03
        mo = mo_form.save()
        mo.button_mark_done()

        self.assertEqual(lot_B01.productQty, 0)
        self.assertEqual(lot_B02.productQty, 0)
        self.assertEqual(lot_B03.productQty, 15)
        self.assertEqual(productA.qty_available, 15)

    def test_last_delivery_traceability(self):
        """
        Suppose this structure (-> means 'produces')
        1 x Subcomponent A -> 1 x Component A -> 1 x EndProduct A
        All three tracked by lots. Ensure that after validating Picking A (out)
        for EndProduct A, all three lots' delivery_ids are set to
        Picking A.
        """

        stock_location = self.env.ref('stock.stock_location_stock')
        customer_location = self.env.ref('stock.stock_location_customers')

        # Create the three lot-tracked products.
        subcomponentA = self._create_product('lot')
        componentA = self._create_product('lot')
        endproductA = self._create_product('lot')

        # Create production lots.
        lot_subcomponentA, lot_componentA, lot_endProductA = self.env['stock.production.lot'].create([{
            'name': 'lot %s' % product,
            'productId': product.id,
            'companyId': self.env.company.id,
        } for product in (subcomponentA, componentA, endproductA)])

        # Create two boms, one for Component A and one for EndProduct A
        self.env['mrp.bom'].create([{
            'productId': finished.id,
            'productTemplateId': finished.productTemplateId.id,
            'productUomId': self.uom_unit.id,
            'productQty': 1.0,
            'type': 'normal',
            'bom_line_ids': [(0, 0, {'productId': component.id, 'productQty': 1})],
        } for finished, component in [(endproductA, componentA), (componentA, subcomponentA)]])

        self.env['stock.quant']._update_available_quantity(subcomponentA, stock_location, 1, lotId=lot_subcomponentA)

        # Produce 1 component A
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = componentA
        mo_form.productQty = 1
        mo = mo_form.save()
        mo.action_confirm()
        mo_form = Form(mo)
        mo_form.qtyProducing = 1
        mo_form.lotProducingId = lot_componentA
        mo = mo_form.save()
        mo.moveRawIds[0].quantityDone = 1.0
        mo.button_mark_done()

        # Produce 1 endProduct A
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = endproductA
        mo_form.productQty = 1
        mo = mo_form.save()
        mo.action_confirm()
        mo_form = Form(mo)
        mo_form.qtyProducing = 1
        mo_form.lotProducingId = lot_endProductA
        mo = mo_form.save()
        mo.moveRawIds[0].quantityDone = 1.0
        mo.button_mark_done()

        # Create out picking for EndProduct A
        pickingA_out = self.env['stock.picking'].create({
            'pickingTypeId': self.env.ref('stock.picking_type_out').id,
            'locationId': stock_location.id,
            'locationDestId': customer_location.id})

        moveA = self.env['stock.move'].create({
            'name': 'Picking A move',
            'productId': endproductA.id,
            'productUomQty': 1,
            'productUom': endproductA.uomId.id,
            'pickingId': pickingA_out.id,
            'locationId': stock_location.id,
            'locationDestId': customer_location.id})

        # Confirm and assign pickingA
        pickingA_out.action_confirm()
        pickingA_out.action_assign()

        # Set moveLine lotId to the mrp.production lotProducingId
        moveA.moveLineIds[0].write({
            'qtyDone': 1.0,
            'lotId': lot_endProductA.id,
        })
        # Transfer picking
        pickingA_out._action_done()

        # Use concat so that delivery_ids is computed in batch.
        for lot in lot_subcomponentA.concat(lot_componentA, lot_endProductA):
            self.assertEqual(lot.delivery_ids.ids, pickingA_out.ids)

    def test_unbuild_scrap_and_unscrap_tracked_component(self):
        """
        Suppose a tracked-by-SN component C. There is one C in stock with SN01.
        Build a product P that uses C with SN, unbuild P, scrap SN, unscrap SN
        and rebuild a product with SN in the components
        """
        warehouse = self.env['stock.warehouse'].search([('companyId', '=', self.env.company.id)], limit=1)
        stock_location = warehouse.lot_stock_id

        component = self.bom_4.bom_line_ids.productId
        component.write({
            'type': 'product',
            'tracking': 'serial',
        })
        serial_number = self.env['stock.production.lot'].create({
            'productId': component.id,
            'name': 'Super Serial',
            'companyId': self.env.company.id,
        })
        self.env['stock.quant']._update_available_quantity(component, stock_location, 1, lotId=serial_number)

        # produce 1
        mo_form = Form(self.env['mrp.production'])
        mo_form.bomId = self.bom_4
        mo = mo_form.save()
        mo.action_confirm()
        mo.action_assign()
        self.assertEqual(mo.moveRawIds.moveLineIds.lotId, serial_number)

        with Form(mo) as mo_form:
            mo_form.qtyProducing = 1
        mo.moveRawIds.moveLineIds.qtyDone = 1
        mo.button_mark_done()

        # unbuild
        action = mo.button_unbuild()
        wizard = Form(self.env[action['resModel']].withContext(action['context'])).save()
        wizard.action_validate()

        # scrap the component
        scrap = self.env['stock.scrap'].create({
            'productId': component.id,
            'productUomId': component.uomId.id,
            'scrap_qty': 1,
            'lotId': serial_number.id,
        })
        scrap_location = scrap.scrap_location_id
        scrap.do_scrap()

        # unscrap the component
        internal_move = self.env['stock.move'].create({
            'name': component.name,
            'locationId': scrap_location.id,
            'locationDestId': stock_location.id,
            'productId': component.id,
            'productUom': component.uomId.id,
            'productUomQty': 1.0,
            'moveLineIds': [(0, 0, {
                'productId': component.id,
                'locationId': scrap_location.id,
                'locationDestId': stock_location.id,
                'productUomId': component.uomId.id,
                'qtyDone': 1.0,
                'lotId': serial_number.id,
            })],
        })
        internal_move._action_confirm()
        internal_move._action_done()

        # produce one with the unscrapped component
        mo_form = Form(self.env['mrp.production'])
        mo_form.bomId = self.bom_4
        mo = mo_form.save()
        mo.action_confirm()
        mo.action_assign()
        self.assertEqual(mo.moveRawIds.moveLineIds.lotId, serial_number)

        with Form(mo) as mo_form:
            mo_form.qtyProducing = 1
        mo.moveRawIds.moveLineIds.qtyDone = 1
        mo.button_mark_done()

        self.assertRecordValues((mo.move_finished_ids + mo.moveRawIds).moveLineIds, [
            {'productId': self.bom_4.productId.id, 'lotId': False, 'qtyDone': 1},
            {'productId': component.id, 'lotId': serial_number.id, 'qtyDone': 1},
        ])

    def test_generate_serial_button(self):
        """Test if lot in form "00000dd" is manually created, the generate serial
        button can skip it and create the next one.
        """
        mo, _bom, p_final, _p1, _p2 = self.generate_mo(qty_base_1=1, qty_base_2=1, qty_final=1, tracking_final='lot')

        # generate lot lot_0 on MO
        mo.action_generate_serial()
        lot_0 = mo.lotProducingId.name
        # manually create lot_1 (lot_0 + 1)
        lot_1 = self.env['stock.production.lot'].create({
            'name': str(int(lot_0) + 1).zfill(7),
            'productId': p_final.id,
            'companyId': self.env.company.id,
        }).name
        # generate lot lot_2 on a new MO
        mo = mo.copy()
        mo.action_confirm()
        mo.action_generate_serial()
        lot_2 = mo.lotProducingId.name
        self.assertEqual(lot_2, str(int(lot_1) + 1).zfill(7))
