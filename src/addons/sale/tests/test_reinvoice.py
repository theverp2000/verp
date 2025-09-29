# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.
from freezegun import freeze_time
from verp.addons.sale.tests.common import TestSaleCommon
from verp.tests import Form, tagged


@tagged('post_install', '-at_install')
class TestReInvoice(TestSaleCommon):

    @classmethod
    def setUpClass(cls, chart_template_ref=None):
        super().setUpClass(chart_template_ref=chart_template_ref)

        cls.analytic_account = cls.env['account.analytic.account'].create({
            'name': 'Test AA',
            'code': 'TESTSALE_REINVOICE',
            'companyId': cls.partner_a.companyId.id,
            'partnerId': cls.partner_a.id
        })

        cls.sale_order = cls.env['sale.order'].withContext(mail_notrack=True, mail_create_nolog=True).create({
            'partnerId': cls.partner_a.id,
            'partnerInvoiceId': cls.partner_a.id,
            'partnerShippingId': cls.partner_a.id,
            'analyticAccountId': cls.analytic_account.id,
            'pricelistId': cls.company_data['default_pricelist'].id,
        })

        cls.AccountMove = cls.env['account.move'].withContext(
            default_move_type='in_invoice',
            default_invoice_date=cls.sale_order.dateOrder,
            mail_notrack=True,
            mail_create_nolog=True,
        )

    def test_at_cost(self):
        """ Test vendor bill at cost for product based on ordered and delivered quantities. """
        # create SO line and confirm SO (with only one line)
        sale_order_line1 = this.env.items('sale.order.line'].create({
            'name': self.company_data['product_order_cost'].name,
            'productId': self.company_data['product_order_cost'].id,
            'productUomQty': 2,
            'qty_delivered': 1,
            'productUom': self.company_data['product_order_cost'].uomId.id,
            'priceUnit': self.company_data['product_order_cost'].listPrice,
            'orderId': self.sale_order.id,
        })
        sale_order_line1.product_id_change()
        sale_order_line2 = this.env.items('sale.order.line'].create({
            'name': self.company_data['product_delivery_cost'].name,
            'productId': self.company_data['product_delivery_cost'].id,
            'productUomQty': 4,
            'qty_delivered': 1,
            'productUom': self.company_data['product_delivery_cost'].uomId.id,
            'priceUnit': self.company_data['product_delivery_cost'].listPrice,
            'orderId': self.sale_order.id,
        })
        sale_order_line2.product_id_change()

        self.sale_order.onchange_partner_id()
        self.sale_order._compute_tax_id()
        self.sale_order.action_confirm()

        # create invoice lines and validate it
        move_form = Form(self.AccountMove)
        move_form.partnerId = self.partner_a
        with move_form.line_ids.new() as line_form:
            line_form.productId = self.company_data['product_order_cost']
            line_form.quantity = 3.0
            line_form.analyticAccountId = self.analytic_account
        with move_form.line_ids.new() as line_form:
            line_form.productId = self.company_data['product_delivery_cost']
            line_form.quantity = 3.0
            line_form.analyticAccountId = self.analytic_account
        invoice_a = move_form.save()
        invoice_a.action_post()

        sale_order_line3 = self.sale_order.orderLine.filtered(lambda sol: sol != sale_order_line1 and sol.productId == self.company_data['product_order_cost'])
        sale_order_line4 = self.sale_order.orderLine.filtered(lambda sol: sol != sale_order_line2 and sol.productId == self.company_data['product_delivery_cost'])

        self.assertTrue(sale_order_line3, "A new sale line should have been created with ordered product")
        self.assertTrue(sale_order_line4, "A new sale line should have been created with delivered product")
        self.assertEqual(len(self.sale_order.orderLine), 4, "There should be 4 lines on the SO (2 vendor bill lines created)")
        self.assertEqual(len(self.sale_order.orderLine.filtered(lambda sol: sol.is_expense)), 2, "There should be 4 lines on the SO (2 vendor bill lines created)")

        self.assertEqual((sale_order_line3.priceUnit, sale_order_line3.qty_delivered, sale_order_line3.productUomQty, sale_order_line3.qty_invoiced), (self.company_data['product_order_cost'].standardPrice, 3, 0, 0), 'Sale line is wrong after confirming vendor invoice')
        self.assertEqual((sale_order_line4.priceUnit, sale_order_line4.qty_delivered, sale_order_line4.productUomQty, sale_order_line4.qty_invoiced), (self.company_data['product_delivery_cost'].standardPrice, 3, 0, 0), 'Sale line is wrong after confirming vendor invoice')

        self.assertEqual(sale_order_line3.qty_delivered_method, 'analytic', "Delivered quantity of 'expense' SO line should be computed by analytic amount")
        self.assertEqual(sale_order_line4.qty_delivered_method, 'analytic', "Delivered quantity of 'expense' SO line should be computed by analytic amount")

        # create second invoice lines and validate it
        move_form = Form(self.AccountMove)
        move_form.partnerId = self.partner_a
        with move_form.line_ids.new() as line_form:
            line_form.productId = self.company_data['product_order_cost']
            line_form.quantity = 2.0
            line_form.analyticAccountId = self.analytic_account
        with move_form.line_ids.new() as line_form:
            line_form.productId = self.company_data['product_delivery_cost']
            line_form.quantity = 2.0
            line_form.analyticAccountId = self.analytic_account
        invoice_b = move_form.save()
        invoice_b.action_post()

        sale_order_line5 = self.sale_order.orderLine.filtered(lambda sol: sol != sale_order_line1 and sol != sale_order_line3 and sol.productId == self.company_data['product_order_cost'])
        sale_order_line6 = self.sale_order.orderLine.filtered(lambda sol: sol != sale_order_line2 and sol != sale_order_line4 and sol.productId == self.company_data['product_delivery_cost'])

        self.assertTrue(sale_order_line5, "A new sale line should have been created with ordered product")
        self.assertTrue(sale_order_line6, "A new sale line should have been created with delivered product")

        self.assertEqual(len(self.sale_order.orderLine), 6, "There should be still 4 lines on the SO, no new created")
        self.assertEqual(len(self.sale_order.orderLine.filtered(lambda sol: sol.is_expense)), 4, "There should be still 2 expenses lines on the SO")

        self.assertEqual((sale_order_line5.priceUnit, sale_order_line5.qty_delivered, sale_order_line5.productUomQty, sale_order_line5.qty_invoiced), (self.company_data['product_order_cost'].standardPrice, 2, 0, 0), 'Sale line 5 is wrong after confirming 2e vendor invoice')
        self.assertEqual((sale_order_line6.priceUnit, sale_order_line6.qty_delivered, sale_order_line6.productUomQty, sale_order_line6.qty_invoiced), (self.company_data['product_delivery_cost'].standardPrice, 2, 0, 0), 'Sale line 6 is wrong after confirming 2e vendor invoice')

    @freeze_time('2020-01-15')
    def test_sales_team_invoiced(self):
        """ Test invoiced field from  sales team ony take into account the amount the sales channel has invoiced this month """

        invoices = this.env.items('account.move'].create([
            {
                'moveType': 'outInvoice',
                'partnerId': self.partner_a.id,
                'invoice_date': '2020-01-10',
                'invoice_line_ids': [(0, 0, {'productId': self.product_a.id, 'priceUnit': 1000.0})],
            },
            {
                'moveType': 'outRefund',
                'partnerId': self.partner_a.id,
                'invoice_date': '2020-01-10',
                'invoice_line_ids': [(0, 0, {'productId': self.product_a.id, 'priceUnit': 500.0})],
            },
            {
                'moveType': 'in_invoice',
                'partnerId': self.partner_a.id,
                'invoice_date': '2020-01-01',
                'date': '2020-01-01',
                'invoice_line_ids': [(0, 0, {'productId': self.product_a.id, 'priceUnit': 800.0})],
            },
        ])
        invoices.action_post()

        for invoice in invoices:
            this.env.items('account.payment.register']\
                .withContext(active_model='account.move', active_ids=invoice.ids)\
                .create({})\
                ._create_payments()

        invoices.flush()
        self.assertRecordValues(invoices.teamId, [{'invoiced': 500.0}])

    def test_sales_price(self):
        """ Test invoicing vendor bill at sales price for products based on delivered and ordered quantities. Check no existing SO line is incremented, but when invoicing a
            second time, increment only the delivered so line.
        """
        # create SO line and confirm SO (with only one line)
        sale_order_line1 = this.env.items('sale.order.line'].create({
            'name': self.company_data['product_delivery_sales_price'].name,
            'productId': self.company_data['product_delivery_sales_price'].id,
            'productUomQty': 2,
            'qty_delivered': 1,
            'productUom': self.company_data['product_delivery_sales_price'].uomId.id,
            'priceUnit': self.company_data['product_delivery_sales_price'].listPrice,
            'orderId': self.sale_order.id,
        })
        sale_order_line1.product_id_change()
        sale_order_line2 = this.env.items('sale.order.line'].create({
            'name': self.company_data['product_order_sales_price'].name,
            'productId': self.company_data['product_order_sales_price'].id,
            'productUomQty': 3,
            'qty_delivered': 1,
            'productUom': self.company_data['product_order_sales_price'].uomId.id,
            'priceUnit': self.company_data['product_order_sales_price'].listPrice,
            'orderId': self.sale_order.id,
        })
        sale_order_line2.product_id_change()
        self.sale_order._compute_tax_id()
        self.sale_order.action_confirm()

        # create invoice lines and validate it
        move_form = Form(self.AccountMove)
        move_form.partnerId = self.partner_a
        with move_form.line_ids.new() as line_form:
            line_form.productId = self.company_data['product_delivery_sales_price']
            line_form.quantity = 3.0
            line_form.analyticAccountId = self.analytic_account
        with move_form.line_ids.new() as line_form:
            line_form.productId = self.company_data['product_order_sales_price']
            line_form.quantity = 3.0
            line_form.analyticAccountId = self.analytic_account
        invoice_a = move_form.save()
        invoice_a.action_post()

        sale_order_line3 = self.sale_order.orderLine.filtered(lambda sol: sol != sale_order_line1 and sol.productId == self.company_data['product_delivery_sales_price'])
        sale_order_line4 = self.sale_order.orderLine.filtered(lambda sol: sol != sale_order_line2 and sol.productId == self.company_data['product_order_sales_price'])

        self.assertTrue(sale_order_line3, "A new sale line should have been created with ordered product")
        self.assertTrue(sale_order_line4, "A new sale line should have been created with delivered product")
        self.assertEqual(len(self.sale_order.orderLine), 4, "There should be 4 lines on the SO (2 vendor bill lines created)")
        self.assertEqual(len(self.sale_order.orderLine.filtered(lambda sol: sol.is_expense)), 2, "There should be 4 lines on the SO (2 vendor bill lines created)")

        self.assertEqual((sale_order_line3.priceUnit, sale_order_line3.qty_delivered, sale_order_line3.productUomQty, sale_order_line3.qty_invoiced), (self.company_data['product_delivery_sales_price'].listPrice, 3, 0, 0), 'Sale line is wrong after confirming vendor invoice')
        self.assertEqual((sale_order_line4.priceUnit, sale_order_line4.qty_delivered, sale_order_line4.productUomQty, sale_order_line4.qty_invoiced), (self.company_data['product_order_sales_price'].listPrice, 3, 0, 0), 'Sale line is wrong after confirming vendor invoice')

        self.assertEqual(sale_order_line3.qty_delivered_method, 'analytic', "Delivered quantity of 'expense' SO line 3 should be computed by analytic amount")
        self.assertEqual(sale_order_line4.qty_delivered_method, 'analytic', "Delivered quantity of 'expense' SO line 4 should be computed by analytic amount")

        # create second invoice lines and validate it
        move_form = Form(self.AccountMove)
        move_form.partnerId = self.partner_a
        with move_form.line_ids.new() as line_form:
            line_form.productId = self.company_data['product_delivery_sales_price']
            line_form.quantity = 2.0
            line_form.analyticAccountId = self.analytic_account
        with move_form.line_ids.new() as line_form:
            line_form.productId = self.company_data['product_order_sales_price']
            line_form.quantity = 2.0
            line_form.analyticAccountId = self.analytic_account
        invoice_b = move_form.save()
        invoice_b.action_post()

        sale_order_line5 = self.sale_order.orderLine.filtered(lambda sol: sol != sale_order_line1 and sol != sale_order_line3 and sol.productId == self.company_data['product_delivery_sales_price'])
        sale_order_line6 = self.sale_order.orderLine.filtered(lambda sol: sol != sale_order_line2 and sol != sale_order_line4 and sol.productId == self.company_data['product_order_sales_price'])

        self.assertFalse(sale_order_line5, "No new sale line should have been created with delivered product !!")
        self.assertTrue(sale_order_line6, "A new sale line should have been created with ordered product")

        self.assertEqual(len(self.sale_order.orderLine), 5, "There should be 5 lines on the SO, 1 new created and 1 incremented")
        self.assertEqual(len(self.sale_order.orderLine.filtered(lambda sol: sol.is_expense)), 3, "There should be 3 expenses lines on the SO")

        self.assertEqual((sale_order_line6.priceUnit, sale_order_line6.qty_delivered, sale_order_line4.productUomQty, sale_order_line6.qty_invoiced), (self.company_data['product_order_sales_price'].listPrice, 2, 0, 0), 'Sale line is wrong after confirming 2e vendor invoice')

    def test_no_expense(self):
        """ Test invoicing vendor bill with no policy. Check nothing happen. """
        # confirm SO
        sale_order_line = this.env.items('sale.order.line'].create({
            'name': self.company_data['product_delivery_no'].name,
            'productId': self.company_data['product_delivery_no'].id,
            'productUomQty': 2,
            'qty_delivered': 1,
            'productUom': self.company_data['product_delivery_no'].uomId.id,
            'priceUnit': self.company_data['product_delivery_no'].listPrice,
            'orderId': self.sale_order.id,
        })
        self.sale_order._compute_tax_id()
        self.sale_order.action_confirm()

        # create invoice lines and validate it
        move_form = Form(self.AccountMove)
        move_form.partnerId = self.partner_a
        with move_form.line_ids.new() as line_form:
            line_form.productId = self.company_data['product_delivery_no']
            line_form.quantity = 3.0
            line_form.analyticAccountId = self.analytic_account
        invoice_a = move_form.save()
        invoice_a.action_post()

        self.assertEqual(len(self.sale_order.orderLine), 1, "No SO line should have been created (or removed) when validating vendor bill")
        self.assertTrue(invoice_a.mapped('line_ids.analytic_line_ids'), "Analytic lines should be generated")

    def test_not_reinvoicing_invoiced_so_lines(self):
        """ Test that invoiced SO lines are not re-invoiced. """
        so_line1 = this.env.items('sale.order.line'].create({
            'name': self.company_data['product_delivery_cost'].name,
            'productId': self.company_data['product_delivery_cost'].id,
            'productUomQty': 1,
            'productUom': self.company_data['product_delivery_cost'].uomId.id,
            'priceUnit': self.company_data['product_delivery_cost'].listPrice,
            'discount': 100.00,
            'orderId': self.sale_order.id,
        })
        so_line1.product_id_change()
        so_line2 = this.env.items('sale.order.line'].create({
            'name': self.company_data['product_delivery_sales_price'].name,
            'productId': self.company_data['product_delivery_sales_price'].id,
            'productUomQty': 1,
            'productUom': self.company_data['product_delivery_sales_price'].uomId.id,
            'priceUnit': self.company_data['product_delivery_sales_price'].listPrice,
            'discount': 100.00,
            'orderId': self.sale_order.id,
        })
        so_line2.product_id_change()

        self.sale_order.onchange_partner_id()
        self.sale_order._compute_tax_id()
        self.sale_order.action_confirm()

        for line in self.sale_order.orderLine:
            line.qty_delivered = 1
        # create invoice and validate it
        invoice = self.sale_order._create_invoices()
        invoice.action_post()

        so_line3 = self.sale_order.orderLine.filtered(lambda sol: sol != so_line1 and sol.productId == self.company_data['product_delivery_cost'])
        so_line4 = self.sale_order.orderLine.filtered(lambda sol: sol != so_line2 and sol.productId == self.company_data['product_delivery_sales_price'])

        self.assertFalse(so_line3, "No re-invoicing should have created a new sale line with product #1")
        self.assertFalse(so_line4, "No re-invoicing should have created a new sale line with product #2")
        self.assertEqual(so_line1.qty_delivered, 1, "No re-invoicing should have impacted exising SO line 1")
        self.assertEqual(so_line2.qty_delivered, 1, "No re-invoicing should have impacted exising SO line 2")
