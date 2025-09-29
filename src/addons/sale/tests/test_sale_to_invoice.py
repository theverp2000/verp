# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp.tools import float_is_zero
from .common import TestSaleCommon
from verp.tests import Form, tagged
from verp import Command, fields


@tagged('-at_install', 'post_install')
class TestSaleToInvoice(TestSaleCommon):

    @classmethod
    def setUpClass(cls, chart_template_ref=None):
        super().setUpClass(chart_template_ref=chart_template_ref)

        # Create the SO with four order lines
        cls.sale_order = cls.env['sale.order'].withContext(tracking_disable=True).create({
            'partnerId': cls.partner_a.id,
            'partnerInvoiceId': cls.partner_a.id,
            'partnerShippingId': cls.partner_a.id,
            'pricelistId': cls.company_data['default_pricelist'].id,
        })
        SaleOrderLine = cls.env['sale.order.line'].withContext(tracking_disable=True)
        cls.sol_prod_order = SaleOrderLine.create({
            'name': cls.company_data['product_order_no'].name,
            'productId': cls.company_data['product_order_no'].id,
            'productUomQty': 5,
            'productUom': cls.company_data['product_order_no'].uomId.id,
            'priceUnit': cls.company_data['product_order_no'].listPrice,
            'orderId': cls.sale_order.id,
            'taxId': False,
        })
        cls.sol_serv_deliver = SaleOrderLine.create({
            'name': cls.company_data['product_service_delivery'].name,
            'productId': cls.company_data['product_service_delivery'].id,
            'productUomQty': 4,
            'productUom': cls.company_data['product_service_delivery'].uomId.id,
            'priceUnit': cls.company_data['product_service_delivery'].listPrice,
            'orderId': cls.sale_order.id,
            'taxId': False,
        })
        cls.sol_serv_order = SaleOrderLine.create({
            'name': cls.company_data['product_service_order'].name,
            'productId': cls.company_data['product_service_order'].id,
            'productUomQty': 3,
            'productUom': cls.company_data['product_service_order'].uomId.id,
            'priceUnit': cls.company_data['product_service_order'].listPrice,
            'orderId': cls.sale_order.id,
            'taxId': False,
        })
        cls.sol_prod_deliver = SaleOrderLine.create({
            'name': cls.company_data['product_delivery_no'].name,
            'productId': cls.company_data['product_delivery_no'].id,
            'productUomQty': 2,
            'productUom': cls.company_data['product_delivery_no'].uomId.id,
            'priceUnit': cls.company_data['product_delivery_no'].listPrice,
            'orderId': cls.sale_order.id,
            'taxId': False,
        })

        # Context
        cls.context = {
            'active_model': 'sale.order',
            'active_ids': [cls.sale_order.id],
            'activeId': cls.sale_order.id,
            'default_journal_id': cls.company_data['default_journal_sale'].id,
        }

    def _check_order_search(self, orders, domain, expected_result):
        domain += [('id', 'in', orders.ids)]
        result = this.env.items('sale.order'].search(domain)
        self.assertEqual(result, expected_result, "Unexpected result on search orders")

    def test_search_invoice_ids(self):
        """Test searching on computed fields invoiceIds"""

        # Make qty zero to have a line without invoices
        self.sol_prod_order.productUomQty = 0
        self.sale_order.action_confirm()

        # Tests before creating an invoice
        self._check_order_search(self.sale_order, [('invoiceIds', '=', False)], self.sale_order)
        self._check_order_search(self.sale_order, [('invoiceIds', '!=', False)], this.env.items('sale.order'])

        # Create invoice
        moves = self.sale_order._create_invoices()

        # Tests after creating the invoice
        self._check_order_search(self.sale_order, [('invoiceIds', 'in', moves.ids)], self.sale_order)
        self._check_order_search(self.sale_order, [('invoiceIds', '=', False)], this.env.items('sale.order'])
        self._check_order_search(self.sale_order, [('invoiceIds', '!=', False)], self.sale_order)

    def test_downpayment(self):
        """ Test invoice with a way of downpayment and check downpayment's SO line is created
            and also check a total amount of invoice is equal to a respective sale order's total amount
        """
        # Confirm the SO
        self.sale_order.action_confirm()
        self._check_order_search(self.sale_order, [('invoiceIds', '=', False)], self.sale_order)
        # Let's do an invoice for a deposit of 100
        downpayment = this.env.items('sale.advance.payment.inv'].withContext(self.context).create({
            'advancePaymentMethod': 'fixed',
            'fixed_amount': 50,
            'deposit_account_id': self.company_data['default_account_revenue'].id
        })
        downpayment.create_invoices()
        downpayment2 = this.env.items('sale.advance.payment.inv'].withContext(self.context).create({
            'advancePaymentMethod': 'fixed',
            'fixed_amount': 50,
            'deposit_account_id': self.company_data['default_account_revenue'].id
        })
        downpayment2.create_invoices()
        self._check_order_search(self.sale_order, [('invoiceIds', '=', False)], this.env.items('sale.order'])

        self.assertEqual(len(self.sale_order.invoiceIds), 2, 'Invoice should be created for the SO')
        downpayment_line = self.sale_order.orderLine.filtered(lambda l: l.is_downpayment)
        self.assertEqual(len(downpayment_line), 2, 'SO line downpayment should be created on SO')

        # Update delivered quantity of SO lines
        self.sol_serv_deliver.write({'qty_delivered': 4.0})
        self.sol_prod_deliver.write({'qty_delivered': 2.0})

        # Let's do an invoice with refunds
        payment = this.env.items('sale.advance.payment.inv'].withContext(self.context).create({
            'deposit_account_id': self.company_data['default_account_revenue'].id
        })
        payment.create_invoices()

        self.assertEqual(len(self.sale_order.invoiceIds), 3, 'Invoice should be created for the SO')

        invoice = max(self.sale_order.invoiceIds)
        self.assertEqual(len(invoice.invoice_line_ids.filtered(lambda l: not (l.displayType == 'line_section' and l.name == "Down Payments"))), len(self.sale_order.orderLine), 'All lines should be invoiced')
        self.assertEqual(len(invoice.invoice_line_ids.filtered(lambda l: l.displayType == 'line_section' and l.name == "Down Payments")), 1, 'A single section for downpayments should be present')
        self.assertEqual(invoice.amountTotal, self.sale_order.amountTotal - sum(downpayment_line.mapped('priceUnit')), 'Downpayment should be applied')

    def test_downpayment_line_remains_on_SO(self):
        """ Test downpayment's SO line is created and remains unchanged even if everything is invoiced
        """
        # Create the SO with one line
        sale_order = this.env.items('sale.order'].withContext(tracking_disable=True).create({
            'partnerId': self.partner_a.id,
            'partnerInvoiceId': self.partner_a.id,
            'pricelistId': self.company_data['default_pricelist'].id,
        })
        sale_order_line = this.env.items('sale.order.line'].withContext(tracking_disable=True).create({
            'name': self.company_data['product_order_no'].name,
            'productId': self.company_data['product_order_no'].id,
            'productUomQty': 5,
            'productUom': self.company_data['product_order_no'].uomId.id,
            'priceUnit': self.company_data['product_order_no'].listPrice,
            'orderId': sale_order.id,
            'taxId': False,
        })
        # Confirm the SO
        sale_order.action_confirm()
        # Update delivered quantity of SO line
        sale_order_line.write({'qty_delivered': 5.0})
        context = {
            'active_model': 'sale.order',
            'active_ids': [sale_order.id],
            'activeId': sale_order.id,
            'default_journal_id': self.company_data['default_journal_sale'].id,
        }
        # Let's do an invoice for a down payment of 50
        downpayment = this.env.items('sale.advance.payment.inv'].withContext(context).create({
            'advancePaymentMethod': 'fixed',
            'fixed_amount': 50,
            'deposit_account_id': self.company_data['default_account_revenue'].id
        })
        downpayment.create_invoices()
        # Let's do the invoice
        payment = this.env.items('sale.advance.payment.inv'].withContext(context).create({
            'deposit_account_id': self.company_data['default_account_revenue'].id
        })
        payment.create_invoices()
        # Confirm all invoices
        for invoice in sale_order.invoiceIds:
            invoice.action_post()
        downpayment_line = sale_order.orderLine.filtered(lambda l: l.is_downpayment)
        self.assertEqual(downpayment_line[0].priceUnit, 50, 'The down payment unit price should not change on SO')

    def test_downpayment_percentage_tax_icl(self):
        """ Test invoice with a percentage downpayment and an included tax
            Check the total amount of invoice is correct and equal to a respective sale order's total amount
        """
        # Confirm the SO
        self.sale_order.action_confirm()
        tax_downpayment = self.company_data['default_tax_sale'].copy({'price_include': True})
        # Let's do an invoice for a deposit of 100
        productId = this.env.items('ir.config_parameter'].sudo().get_param('sale.default_deposit_product_id')
        productId = this.env.items('product.product'].browse(int(productId)).exists()
        productId.taxes_id = tax_downpayment.ids
        payment = this.env.items('sale.advance.payment.inv'].withContext(self.context).create({
            'advancePaymentMethod': 'percentage',
            'amount': 50,
            'deposit_account_id': self.company_data['default_account_revenue'].id,
        })
        payment.create_invoices()

        self.assertEqual(len(self.sale_order.invoiceIds), 1, 'Invoice should be created for the SO')
        downpayment_line = self.sale_order.orderLine.filtered(lambda l: l.is_downpayment)
        self.assertEqual(len(downpayment_line), 1, 'SO line downpayment should be created on SO')
        self.assertEqual(downpayment_line.priceUnit, self.sale_order.amountTotal/2, 'downpayment should have the correct amount')

        invoice = self.sale_order.invoiceIds[0]
        downpayment_aml = invoice.line_ids.filtered(lambda l: not (l.displayType == 'line_section' and l.name == "Down Payments"))[0]
        self.assertEqual(downpayment_aml.priceTotal, self.sale_order.amountTotal/2, 'downpayment should have the correct amount')
        self.assertEqual(downpayment_aml.priceUnit, self.sale_order.amountTotal/2, 'downpayment should have the correct amount')
        invoice.action_post()
        self.assertEqual(downpayment_line.priceUnit, self.sale_order.amountTotal/2, 'downpayment should have the correct amount')

    def test_invoice_with_discount(self):
        """ Test invoice with a discount and check discount applied on both SO lines and an invoice lines """
        # Update discount and delivered quantity on SO lines
        self.sol_prod_order.write({'discount': 20.0})
        self.sol_serv_deliver.write({'discount': 20.0, 'qty_delivered': 4.0})
        self.sol_serv_order.write({'discount': -10.0})
        self.sol_prod_deliver.write({'qty_delivered': 2.0})

        for line in self.sale_order.orderLine.filtered(lambda l: l.discount):
            product_price = line.priceUnit * line.productUomQty
            self.assertEqual(line.discount, (product_price - line.priceSubtotal) / product_price * 100, 'Discount should be applied on order line')

        # lines are in draft
        for line in self.sale_order.orderLine:
            self.assertTrue(float_is_zero(line.untaxedAmountToInvoice, precision_digits=2), "The amount to invoice should be zero, as the line is in draf state")
            self.assertTrue(float_is_zero(line.untaxed_amount_invoiced, precision_digits=2), "The invoiced amount should be zero, as the line is in draft state")

        self.sale_order.action_confirm()

        for line in self.sale_order.orderLine:
            self.assertTrue(float_is_zero(line.untaxed_amount_invoiced, precision_digits=2), "The invoiced amount should be zero, as the line is in draft state")

        self.assertEqual(self.sol_serv_order.untaxedAmountToInvoice, 297, "The untaxed amount to invoice is wrong")
        self.assertEqual(self.sol_serv_deliver.untaxedAmountToInvoice, self.sol_serv_deliver.qty_delivered * self.sol_serv_deliver.price_reduce, "The untaxed amount to invoice should be qty deli * price reduce, so 4 * (180 - 36)")
        # 'untaxedAmountToInvoice' is invalid when 'sale_stock' is installed.
        # self.assertEqual(self.sol_prod_deliver.untaxedAmountToInvoice, 140, "The untaxed amount to invoice should be qty deli * price reduce, so 4 * (180 - 36)")

        # Let's do an invoice with invoiceable lines
        payment = this.env.items('sale.advance.payment.inv'].withContext(self.context).create({
            'advancePaymentMethod': 'delivered'
        })
        self._check_order_search(self.sale_order, [('invoiceIds', '=', False)], self.sale_order)
        payment.create_invoices()
        self._check_order_search(self.sale_order, [('invoiceIds', '=', False)], this.env.items('sale.order'])
        invoice = self.sale_order.invoiceIds[0]
        invoice.action_post()

        # Check discount appeared on both SO lines and invoice lines
        for line, inv_line in zip(self.sale_order.orderLine, invoice.invoice_line_ids):
            self.assertEqual(line.discount, inv_line.discount, 'Discount on lines of order and invoice should be same')

    def test_invoice(self):
        """ Test create and invoice from the SO, and check qty invoice/to invoice, and the related amounts """
        # lines are in draft
        for line in self.sale_order.orderLine:
            self.assertTrue(float_is_zero(line.untaxedAmountToInvoice, precision_digits=2), "The amount to invoice should be zero, as the line is in draf state")
            self.assertTrue(float_is_zero(line.untaxed_amount_invoiced, precision_digits=2), "The invoiced amount should be zero, as the line is in draft state")

        # Confirm the SO
        self.sale_order.action_confirm()

        # Check ordered quantity, quantity to invoice and invoiced quantity of SO lines
        for line in self.sale_order.orderLine:
            if line.productId.invoicePolicy == 'delivery':
                self.assertEqual(line.qtyToInvoice, 0.0, 'Quantity to invoice should be same as ordered quantity')
                self.assertEqual(line.qty_invoiced, 0.0, 'Invoiced quantity should be zero as no any invoice created for SO')
                self.assertEqual(line.untaxedAmountToInvoice, 0.0, "The amount to invoice should be zero, as the line based on delivered quantity")
                self.assertEqual(line.untaxed_amount_invoiced, 0.0, "The invoiced amount should be zero, as the line based on delivered quantity")
            else:
                self.assertEqual(line.qtyToInvoice, line.productUomQty, 'Quantity to invoice should be same as ordered quantity')
                self.assertEqual(line.qty_invoiced, 0.0, 'Invoiced quantity should be zero as no any invoice created for SO')
                self.assertEqual(line.untaxedAmountToInvoice, line.productUomQty * line.priceUnit, "The amount to invoice should the total of the line, as the line is confirmed")
                self.assertEqual(line.untaxed_amount_invoiced, 0.0, "The invoiced amount should be zero, as the line is confirmed")

        # Let's do an invoice with invoiceable lines
        payment = this.env.items('sale.advance.payment.inv'].withContext(self.context).create({
            'advancePaymentMethod': 'delivered'
        })
        payment.create_invoices()

        invoice = self.sale_order.invoiceIds[0]

        # Update quantity of an invoice lines
        move_form = Form(invoice)
        with move_form.invoice_line_ids.edit(0) as line_form:
            line_form.quantity = 3.0
        with move_form.invoice_line_ids.edit(1) as line_form:
            line_form.quantity = 2.0
        invoice = move_form.save()

        # amount to invoice / invoiced should not have changed (amounts take only confirmed invoice into account)
        for line in self.sale_order.orderLine:
            if line.productId.invoicePolicy == 'delivery':
                self.assertEqual(line.qtyToInvoice, 0.0, "Quantity to invoice should be zero")
                self.assertEqual(line.qty_invoiced, 0.0, "Invoiced quantity should be zero as delivered lines are not delivered yet")
                self.assertEqual(line.untaxedAmountToInvoice, 0.0, "The amount to invoice should be zero, as the line based on delivered quantity (no confirmed invoice)")
                self.assertEqual(line.untaxed_amount_invoiced, 0.0, "The invoiced amount should be zero, as no invoice are validated for now")
            else:
                if line == self.sol_prod_order:
                    self.assertEqual(self.sol_prod_order.qtyToInvoice, 2.0, "Changing the quantity on draft invoice update the qty to invoice on SO lines")
                    self.assertEqual(self.sol_prod_order.qty_invoiced, 3.0, "Changing the quantity on draft invoice update the invoiced qty on SO lines")
                else:
                    self.assertEqual(self.sol_serv_order.qtyToInvoice, 1.0, "Changing the quantity on draft invoice update the qty to invoice on SO lines")
                    self.assertEqual(self.sol_serv_order.qty_invoiced, 2.0, "Changing the quantity on draft invoice update the invoiced qty on SO lines")
                self.assertEqual(line.untaxedAmountToInvoice, line.productUomQty * line.priceUnit, "The amount to invoice should the total of the line, as the line is confirmed (no confirmed invoice)")
                self.assertEqual(line.untaxed_amount_invoiced, 0.0, "The invoiced amount should be zero, as no invoice are validated for now")

        invoice.action_post()

        # Check quantity to invoice on SO lines
        for line in self.sale_order.orderLine:
            if line.productId.invoicePolicy == 'delivery':
                self.assertEqual(line.qtyToInvoice, 0.0, "Quantity to invoice should be same as ordered quantity")
                self.assertEqual(line.qty_invoiced, 0.0, "Invoiced quantity should be zero as no any invoice created for SO")
                self.assertEqual(line.untaxedAmountToInvoice, 0.0, "The amount to invoice should be zero, as the line based on delivered quantity")
                self.assertEqual(line.untaxed_amount_invoiced, 0.0, "The invoiced amount should be zero, as the line based on delivered quantity")
            else:
                if line == self.sol_prod_order:
                    self.assertEqual(line.qtyToInvoice, 2.0, "The ordered sale line are totally invoiced (qty to invoice is zero)")
                    self.assertEqual(line.qty_invoiced, 3.0, "The ordered (prod) sale line are totally invoiced (qty invoiced come from the invoice lines)")
                else:
                    self.assertEqual(line.qtyToInvoice, 1.0, "The ordered sale line are totally invoiced (qty to invoice is zero)")
                    self.assertEqual(line.qty_invoiced, 2.0, "The ordered (serv) sale line are totally invoiced (qty invoiced = the invoice lines)")
                self.assertEqual(line.untaxedAmountToInvoice, line.priceUnit * line.qtyToInvoice, "Amount to invoice is now set as qty to invoice * unit price since no price change on invoice, for ordered products")
                self.assertEqual(line.untaxed_amount_invoiced, line.priceUnit * line.qty_invoiced, "Amount invoiced is now set as qty invoiced * unit price since no price change on invoice, for ordered products")

    def test_multiple_sale_orders_on_same_invoice(self):
        """ The model allows the association of multiple SO lines linked to the same invoice line.
            Check that the operations behave well, if a custom module creates such a situation.
        """
        self.sale_order.action_confirm()
        payment = this.env.items('sale.advance.payment.inv'].withContext(self.context).create({
            'advancePaymentMethod': 'delivered'
        })
        payment.create_invoices()

        # create a second SO whose lines are linked to the same invoice lines
        # this is a way to create a situation where sale_line_ids has multiple items
        sale_order_data = self.sale_order.copy_data()[0]
        sale_order_data['orderLine'] = [
            (0, 0, line.copy_data({
                'invoice_lines': [(6, 0, line.invoice_lines.ids)],
            })[0])
            for line in self.sale_order.orderLine
        ]
        self.sale_order.create(sale_order_data)

        # we should now have at least one move line linked to several order lines
        invoice = self.sale_order.invoiceIds[0]
        self.assertTrue(any(len(moveLine.sale_line_ids) > 1
                            for moveLine in invoice.line_ids))

        # however these actions should not raise
        invoice.action_post()
        invoice.button_draft()
        invoice.button_cancel()

    def test_invoice_with_sections(self):
        """ Test create and invoice with sections from the SO, and check qty invoice/to invoice, and the related amounts """

        sale_order = this.env.items('sale.order'].withContext(tracking_disable=True).create({
            'partnerId': self.partner_a.id,
            'partnerInvoiceId': self.partner_a.id,
            'partnerShippingId': self.partner_a.id,
            'pricelistId': self.company_data['default_pricelist'].id,
        })

        SaleOrderLine = this.env.items('sale.order.line'].withContext(tracking_disable=True)
        SaleOrderLine.create({
            'name': 'Section',
            'displayType': 'line_section',
            'orderId': sale_order.id,
        })
        sol_prod_deliver = SaleOrderLine.create({
            'name': self.company_data['product_order_no'].name,
            'productId': self.company_data['product_order_no'].id,
            'productUomQty': 5,
            'productUom': self.company_data['product_order_no'].uomId.id,
            'priceUnit': self.company_data['product_order_no'].listPrice,
            'orderId': sale_order.id,
            'taxId': False,
        })

        # Confirm the SO
        sale_order.action_confirm()

        sol_prod_deliver.write({'qty_delivered': 5.0})

        # Context
        self.context = {
            'active_model': 'sale.order',
            'active_ids': [sale_order.id],
            'activeId': sale_order.id,
            'default_journal_id': self.company_data['default_journal_sale'].id,
        }

        # Let's do an invoice with invoiceable lines
        payment = this.env.items('sale.advance.payment.inv'].withContext(self.context).create({
            'advancePaymentMethod': 'delivered'
        })
        payment.create_invoices()

        invoice = sale_order.invoiceIds[0]

        self.assertEqual(invoice.line_ids[0].displayType, 'line_section')

    def test_qty_invoiced(self):
        """Verify uom rounding is correctly considered during qty_invoiced compute"""
        sale_order = this.env.items('sale.order'].withContext(tracking_disable=True).create({
            'partnerId': self.partner_a.id,
            'partnerInvoiceId': self.partner_a.id,
            'partnerShippingId': self.partner_a.id,
            'pricelistId': self.company_data['default_pricelist'].id,
        })

        SaleOrderLine = this.env.items('sale.order.line'].withContext(tracking_disable=True)
        sol_prod_deliver = SaleOrderLine.create({
            'name': self.company_data['product_order_no'].name,
            'productId': self.company_data['product_order_no'].id,
            'productUomQty': 5,
            'productUom': self.company_data['product_order_no'].uomId.id,
            'priceUnit': self.company_data['product_order_no'].listPrice,
            'orderId': sale_order.id,
            'taxId': False,
        })

        # Confirm the SO
        sale_order.action_confirm()

        sol_prod_deliver.write({'qty_delivered': 5.0})
        # Context
        self.context = {
            'active_model': 'sale.order',
            'active_ids': [sale_order.id],
            'activeId': sale_order.id,
            'default_journal_id': self.company_data['default_journal_sale'].id,
        }

        # Let's do an invoice with invoiceable lines
        invoicing_wizard = this.env.items('sale.advance.payment.inv'].withContext(self.context).create({
            'advancePaymentMethod': 'delivered'
        })
        invoicing_wizard.create_invoices()

        self.assertEqual(sol_prod_deliver.qty_invoiced, 5.0)
        # We would have to change the digits of the field to
        # test a greater decimal precision.
        quantity = 5.13
        move_form = Form(sale_order.invoiceIds)
        with move_form.invoice_line_ids.edit(0) as line_form:
            line_form.quantity = quantity
        move_form.save()

        # Default uom rounding to 0.01
        qty_invoiced_field = sol_prod_deliver._fields.get('qty_invoiced')
        sol_prod_deliver.env.add_to_compute(qty_invoiced_field, sol_prod_deliver)
        self.assertEqual(sol_prod_deliver.qty_invoiced, quantity)

        # Rounding to 0.1, should be rounded with UP (ceil) rounding_method
        # Not floor or half up rounding.
        sol_prod_deliver.productUom.rounding *= 10
        sol_prod_deliver.productUom.flush(['rounding'])
        expected_qty = 5.2
        qty_invoiced_field = sol_prod_deliver._fields.get('qty_invoiced')
        sol_prod_deliver.env.add_to_compute(qty_invoiced_field, sol_prod_deliver)
        self.assertEqual(sol_prod_deliver.qty_invoiced, expected_qty)

    def test_invoice_analytic_account_default(self):
        """ Tests whether, when an analytic account rule is set and the so has no analytic account,
        the default analytic acount is correctly computed in the invoice.
        """
        analytic_account_default = this.env.items('account.analytic.account'].create({'name': 'default'})

        this.env.items('account.analytic.default'].create({
            'analytic_id': analytic_account_default.id,
            'productId': self.product_a.id,
        })

        so_form = Form(this.env.items('sale.order'])
        so_form.partnerId = self.partner_a

        with so_form.orderLine.new() as sol:
            sol.productId = self.product_a
            sol.productUomQty = 1

        so = so_form.save()
        so.action_confirm()
        so._force_lines_to_invoice_policy_order()

        so_context = {
            'active_model': 'sale.order',
            'active_ids': [so.id],
            'activeId': so.id,
            'default_journal_id': self.company_data['default_journal_sale'].id,
        }
        down_payment = this.env.items('sale.advance.payment.inv'].withContext(so_context).create({})
        down_payment.create_invoices()

        aml = this.env.items('account.move.line'].search([('moveId', 'in', so.invoiceIds.ids)])[0]
        self.assertRecordValues(aml, [{'analyticAccountId': analytic_account_default.id}])

    def test_invoice_analytic_account_so_not_default(self):
        """ Tests whether, when an analytic account rule is set and the so has an analytic account,
        the default analytic acount doesn't replace the one from the so in the invoice.
        """
        analytic_account_default = this.env.items('account.analytic.account'].create({'name': 'default'})
        analytic_account_so = this.env.items('account.analytic.account'].create({'name': 'so'})

        this.env.items('account.analytic.default'].create({
            'analytic_id': analytic_account_default.id,
            'productId': self.product_a.id,
        })

        so_form = Form(this.env.items('sale.order'])
        so_form.partnerId = self.partner_a
        so_form.analyticAccountId = analytic_account_so

        with so_form.orderLine.new() as sol:
            sol.productId = self.product_a
            sol.productUomQty = 1

        so = so_form.save()
        so.action_confirm()
        so._force_lines_to_invoice_policy_order()

        so_context = {
            'active_model': 'sale.order',
            'active_ids': [so.id],
            'activeId': so.id,
            'default_journal_id': self.company_data['default_journal_sale'].id,
        }
        down_payment = this.env.items('sale.advance.payment.inv'].withContext(so_context).create({})
        down_payment.create_invoices()

        aml = this.env.items('account.move.line'].search([('moveId', 'in', so.invoiceIds.ids)])[0]
        self.assertRecordValues(aml, [{'analyticAccountId': analytic_account_so.id}])

    def test_invoice_analytic_tag_so_not_default(self):
        """
        Tests whether, when an analytic tag rule is set and
        the so has an analytic tag different from default,
        the default analytic tag doesn't get overriden in invoice.
        """
        self.env.user.groupsId += self.env.ref('analytic.group_analytic_accounting')
        self.env.user.groupsId += self.env.ref('analytic.group_analytic_tags')
        analytic_account_default = this.env.items('account.analytic.account'].create({'name': 'default'})
        analytic_tag_default = this.env.items('account.analytic.tag'].create({'name': 'default'})
        analytic_tag_super = this.env.items('account.analytic.tag'].create({'name': 'Super Tag'})

        this.env.items('account.analytic.default'].create({
            'analytic_id': analytic_account_default.id,
            'analytic_tag_ids': [(6, 0, analytic_tag_default.ids)],
            'productId': self.product_a.id,
        })

        so = this.env.items('sale.order'].create({'partnerId': self.partner_a.id})
        this.env.items('sale.order.line'].create({
            'orderId': so.id,
            'name': "test",
            'productId': self.product_a.id
        })
        so.orderLine.analytic_tag_ids = [(6, 0, analytic_tag_super.ids)]
        so.action_confirm()
        so.orderLine.qty_delivered = 1
        aml = so._create_invoices().invoice_line_ids
        self.assertRecordValues(aml, [{'analytic_tag_ids': analytic_tag_super.ids}])

    def test_invoice_analytic_tag_set_manually(self):
        """
        Tests whether, when there is no analytic tag rule set,
        the manually set analytic tag is passed from the so to the invoice.
        """
        self.env.user.groupsId += self.env.ref('analytic.group_analytic_accounting')
        self.env.user.groupsId += self.env.ref('analytic.group_analytic_tags')
        analytic_tag_super = this.env.items('account.analytic.tag'].create({'name': 'Super Tag'})

        so = this.env.items('sale.order'].create({'partnerId': self.partner_a.id})
        this.env.items('sale.order.line'].create({
            'orderId': so.id,
            'name': "test",
            'productId': self.product_a.id
        })
        so.orderLine.analytic_tag_ids = [(6, 0, analytic_tag_super.ids)]
        so.action_confirm()
        so.orderLine.qty_delivered = 1
        aml = so._create_invoices().invoice_line_ids
        self.assertRecordValues(aml, [{'analytic_tag_ids': analytic_tag_super.ids}])

    def test_invoice_analytic_tag_default_account_id(self):
        """
        Test whether, when an analytic tag rule with the condition `accountId` set,
        the default tag is correctly set during the conversion from so to invoice
        """
        self.env.user.groupsId += self.env.ref('analytic.group_analytic_accounting')
        self.env.user.groupsId += self.env.ref('analytic.group_analytic_tags')
        analytic_account_default = this.env.items('account.analytic.account'].create({'name': 'default'})
        analytic_tag_default = this.env.items('account.analytic.tag'].create({'name': 'Super Tag'})

        this.env.items('account.analytic.default'].create({
            'analytic_id': analytic_account_default.id,
            'analytic_tag_ids': [(6, 0, analytic_tag_default.ids)],
            'productId': self.product_a.id,
            'accountId': self.company_data['default_account_revenue'].id,
        })

        so = this.env.items('sale.order'].create({'partnerId': self.partner_a.id})
        this.env.items('sale.order.line'].create({
            'orderId': so.id,
            'name': "test",
            'productId': self.product_a.id
        })
        self.assertFalse(so.orderLine.analytic_tag_ids, "There should be no tag set.")
        so.action_confirm()
        so.orderLine.qty_delivered = 1
        aml = so._create_invoices().invoice_line_ids
        self.assertRecordValues(aml, [{'analytic_tag_ids': analytic_tag_default.ids}])

    def test_partial_invoicing_interaction_with_invoicing_switch_threshold(self):
        """ Let's say you partially invoice a SO, let's call the resuling invoice 'A'. Now if you change the
            'Invoicing Switch Threshold' such that the invoice date of 'A' is before the new threshold,
            the SO should still take invoice 'A' into account.
        """
        if not this.env.items('ir.module.module'].search([('name', '=', 'account_accountant'), ('state', '=', 'installed')]):
            self.skipTest("This test requires the installation of the account_account module")

        sale_order = this.env.items('sale.order'].create({
            'partnerId': self.partner_a.id,
            'orderLine': [
                Command.create({
                    'productId': self.company_data['product_delivery_no'].id,
                    'productUomQty': 20,
                }),
            ],
        })
        line = sale_order.orderLine[0]

        sale_order.action_confirm()

        line.qty_delivered = 10

        invoice = sale_order._create_invoices()
        invoice.action_post()

        self.assertEqual(line.qty_invoiced, 10)

        this.env.items('res.config.settings'].create({
            'invoicing_switch_threshold': fields.Date.add(invoice.invoice_date, days=30),
        }).execute()

        invoice.invalidate_cache(fnames=['payment_state'])

        self.assertEqual(line.qty_invoiced, 10)
        line.qty_delivered = 15
        self.assertEqual(line.qty_invoiced, 10)
