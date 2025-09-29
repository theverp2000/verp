# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp.tests.common import Form
from verp.addons.stock.tests.test_report import TestReportsCommon


class TestSaleStockReports(TestReportsCommon):
    def test_report_forecast_1_mo_count(self):
        """ Creates and configures a product who could be produce and could be a component.
        Plans some producing and consumming MO and check the report values.
        """
        # Create a variant attribute.
        product_chocolate = self.env['product.product'].create({
            'name': 'Chocolate',
            'type': 'consu',
        })
        product_chococake = self.env['product.product'].create({
            'name': 'Choco Cake',
            'type': 'product',
        })
        product_double_chococake = self.env['product.product'].create({
            'name': 'Double Choco Cake',
            'type': 'product',
        })

        # Creates two BOM: one creating a regular slime, one using regular slimes.
        bom_chococake = self.env['mrp.bom'].create({
            'productId': product_chococake.id,
            'productTemplateId': product_chococake.productTemplateId.id,
            'productUomId': product_chococake.uomId.id,
            'productQty': 1.0,
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': product_chocolate.id, 'productQty': 4}),
            ],
        })
        bom_double_chococake = self.env['mrp.bom'].create({
            'productId': product_double_chococake.id,
            'productTemplateId': product_double_chococake.productTemplateId.id,
            'productUomId': product_double_chococake.uomId.id,
            'productQty': 1.0,
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': product_chococake.id, 'productQty': 2}),
            ],
        })

        # Creates two MO: one for each BOM.
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = product_chococake
        mo_form.bomId = bom_chococake
        mo_form.productQty = 10
        mo_1 = mo_form.save()
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = product_double_chococake
        mo_form.bomId = bom_double_chococake
        mo_form.productQty = 2
        mo_2 = mo_form.save()

        report_values, docs, lines = self.get_report_forecast(product_template_ids=product_chococake.productTemplateId.ids)
        draft_picking_qty = docs['draft_picking_qty']
        draft_production_qty = docs['draft_production_qty']
        self.assertEqual(len(lines), 0, "Must have 0 line.")
        self.assertEqual(draft_picking_qty['in'], 0)
        self.assertEqual(draft_picking_qty['out'], 0)
        self.assertEqual(draft_production_qty['in'], 10)
        self.assertEqual(draft_production_qty['out'], 4)

        # Confirms the MO and checks the report lines.
        mo_1.action_confirm()
        mo_2.action_confirm()
        report_values, docs, lines = self.get_report_forecast(product_template_ids=product_chococake.productTemplateId.ids)
        draft_picking_qty = docs['draft_picking_qty']
        draft_production_qty = docs['draft_production_qty']
        self.assertEqual(len(lines), 2, "Must have two line.")
        line_1 = lines[0]
        line_2 = lines[1]
        self.assertEqual(line_1['document_in'].id, mo_1.id)
        self.assertEqual(line_1['quantity'], 4)
        self.assertEqual(line_1['document_out'].id, mo_2.id)
        self.assertEqual(line_2['document_in'].id, mo_1.id)
        self.assertEqual(line_2['quantity'], 6)
        self.assertEqual(line_2['document_out'], False)
        self.assertEqual(draft_picking_qty['in'], 0)
        self.assertEqual(draft_picking_qty['out'], 0)
        self.assertEqual(draft_production_qty['in'], 0)
        self.assertEqual(draft_production_qty['out'], 0)

    def test_report_forecast_2_production_backorder(self):
        """ Creates a manufacturing order and produces half the quantity.
        Then creates a backorder and checks the report.
        """
        # Configures the warehouse.
        warehouse = self.env.ref('stock.warehouse0')
        warehouse.manufactureSteps = 'pbmSam'
        # Configures a product.
        product_apple_pie = self.env['product.product'].create({
            'name': 'Apple Pie',
            'type': 'product',
        })
        product_apple = self.env['product.product'].create({
            'name': 'Apple',
            'type': 'consu',
        })
        bom = self.env['mrp.bom'].create({
            'productId': product_apple_pie.id,
            'productTemplateId': product_apple_pie.productTemplateId.id,
            'productUomId': product_apple_pie.uomId.id,
            'productQty': 1.0,
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': product_apple.id, 'productQty': 5}),
            ],
        })
        # Creates a MO and validates the pick components.
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = product_apple_pie
        mo_form.bomId = bom
        mo_form.productQty = 4
        mo_1 = mo_form.save()
        mo_1.action_confirm()
        pick = mo_1.moveRawIds.move_orig_ids.pickingId
        pick_form = Form(pick)
        with pick_form.move_line_ids_without_package.edit(0) as moveLine:
            moveLine.qtyDone = 20
        pick = pick_form.save()
        pick.button_validate()
        # Produces 3 products then creates a backorder for the remaining product.
        mo_form = Form(mo_1)
        mo_form.qtyProducing = 3
        mo_1 = mo_form.save()
        action = mo_1.button_mark_done()
        backorder_form = Form(self.env['mrp.production.backorder'].withContext(**action['context']))
        backorder = backorder_form.save()
        backorder.action_backorder()

        mo_2 = (mo_1.procurementGroupId.mrpProductionIds - mo_1)
        # Checks the forecast report.
        report_values, docs, lines = self.get_report_forecast(product_template_ids=product_apple_pie.productTemplateId.ids)
        self.assertEqual(len(lines), 1, "Must have only one line about the backorder")
        self.assertEqual(lines[0]['document_in'].id, mo_2.id)
        self.assertEqual(lines[0]['quantity'], 1)
        self.assertEqual(lines[0]['document_out'], False)

        # Produces the last unit.
        mo_form = Form(mo_2)
        mo_form.qtyProducing = 1
        mo_2 = mo_form.save()
        mo_2.button_mark_done()
        # Checks the forecast report.
        report_values, docs, lines = self.get_report_forecast(product_template_ids=product_apple_pie.productTemplateId.ids)
        self.assertEqual(len(lines), 0, "Must have no line")

    def test_report_forecast_3_report_line_corresponding_to_mo_highlighted(self):
        """ When accessing the report from a MO, checks if the correct MO is highlighted in the report
        """
        product_banana = self.env['product.product'].create({
            'name': 'Banana',
            'type': 'product',
        })
        product_chocolate = self.env['product.product'].create({
            'name': 'Chocolate',
            'type': 'consu',
        })

        # We create 2 identical MO
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = product_banana
        mo_form.productQty = 10
        with mo_form.moveRawIds.new() as move:
            move.productId = product_chocolate

        mo_1 = mo_form.save()
        mo_2 = mo_1.copy()
        (mo_1 | mo_2).action_confirm()

        # Check for both MO if the highlight (is_matched) corresponds to the correct MO
        for mo in [mo_1, mo_2]:
            context = mo.action_product_forecast_report()['context']
            _, _, lines = self.get_report_forecast(product_template_ids=product_banana.productTemplateId.ids, context=context)
            for line in lines:
                if line['document_in'] == mo:
                    self.assertTrue(line['is_matched'], "The corresponding MO line should be matched in the forecast report.")
                else:
                    self.assertFalse(line['is_matched'], "A line of the forecast report not linked to the MO shoud not be matched.")

    def test_subkit_in_delivery_slip(self):
        """
        Suppose this structure:
        Super Kit --|- Compo 01 x1
                    |- Sub Kit x1 --|- Compo 02 x1
                    |               |- Compo 03 x1

        This test ensures that, when delivering one Super Kit, one Sub Kit, one Compo 01 and one Compo 02,
        and when putting in pack the third component of the Super Kit, the delivery report is correct.
        """
        compo01, compo02, compo03, subkit, superkit = self.env['product.product'].create([{
            'name': n,
            'type': 'consu',
        } for n in ['Compo 01', 'Compo 02', 'Compo 03', 'Sub Kit', 'Super Kit']])

        self.env['mrp.bom'].create([{
            'productTemplateId': subkit.productTemplateId.id,
            'productQty': 1,
            'type': 'phantom',
            'bom_line_ids': [
                (0, 0, {'productId': compo02.id, 'productQty': 1}),
                (0, 0, {'productId': compo03.id, 'productQty': 1}),
            ],
        }, {
            'productTemplateId': superkit.productTemplateId.id,
            'productQty': 1,
            'type': 'phantom',
            'bom_line_ids': [
                (0, 0, {'productId': compo01.id, 'productQty': 1}),
                (0, 0, {'productId': subkit.id, 'productQty': 1}),
            ],
        }])

        picking_form = Form(self.env['stock.picking'])
        picking_form.pickingTypeId = self.picking_type_out
        picking_form.partner_id = self.partner
        with picking_form.move_ids_without_package.new() as move:
            move.productId = superkit
            move.productUomQty = 1
        with picking_form.move_ids_without_package.new() as move:
            move.productId = subkit
            move.productUomQty = 1
        with picking_form.move_ids_without_package.new() as move:
            move.productId = compo01
            move.productUomQty = 1
        with picking_form.move_ids_without_package.new() as move:
            move.productId = compo02
            move.productUomQty = 1
        picking = picking_form.save()
        picking.action_confirm()

        picking.move_lines.quantityDone = 1
        move = picking.move_lines.filtered(lambda m: m.name == "Super Kit" and m.productId == compo03)
        move.moveLineIds.result_package_id = self.env['stock.quant.package'].create({'name': 'Package0001'})
        picking.button_validate()

        report = self.env['ir.actions.report']._get_report_from_name('stock.report_deliveryslip')
        html_report = report._render_qweb_html(picking.ids)[0].decode('utf-8').split('\n')
        keys = [
            "Package0001", "Compo 03",
            "Products with no package assigned", "Compo 01", "Compo 02",
            "Super Kit", "Compo 01",
            "Sub Kit", "Compo 02", "Compo 03",
        ]
        for line in html_report:
            if not keys:
                break
            if keys[0] in line:
                keys = keys[1:]
        self.assertFalse(keys, "All keys should be in the report with the defined order")
