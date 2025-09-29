# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp.addons.account.tests.common import AccountTestInvoicingCommon
from verp.addons.stock_account.tests.test_stockvaluation import _create_accounting_data
from verp.tests.common import tagged, Form
from verp import fields


@tagged("post_install", "-at_install")
class TestAccountMove(AccountTestInvoicingCommon):
    @classmethod
    def setUpClass(cls, chart_template_ref=None):
        super().setUpClass(chart_template_ref=chart_template_ref)

        (
            cls.stock_input_account,
            cls.stock_output_account,
            cls.stock_valuation_account,
            cls.expense_account,
            cls.stock_journal,
        ) = _create_accounting_data(cls.env)

        # `all_categ` should not be altered, so we can test the `post_init` hook of `stock_account`
        cls.all_categ = cls.env.ref('product.product_category_all')

        cls.auto_categ = cls.env['product.category'].create({
            'name': 'child_category',
            'parentId': cls.all_categ.id,
            "property_stock_account_input_categ_id": cls.stock_input_account.id,
            "property_stock_account_output_categ_id": cls.stock_output_account.id,
            "property_stock_valuation_account_id": cls.stock_valuation_account.id,
            "property_stock_journal": cls.stock_journal.id,
            "propertyValuation": "auto",
            "propertyCostMethod": "standard",
        })
        cls.product_A = cls.env["product.product"].create(
            {
                "name": "Product A",
                "type": "product",
                "default_code": "prda",
                "categId": cls.auto_categ.id,
                "taxesId": [(5, 0, 0)],
                "supplier_taxes_id": [(5, 0, 0)],
                "lstPrice": 100.0,
                "standardPrice": 10.0,
                "property_account_income_id": cls.company_data["default_account_revenue"].id,
                "property_account_expense_id": cls.company_data["default_account_expense"].id,
            }
        )

    def test_standard_perpetual_01_mc_01() {
        rate = self.currency_data["rates"].sorted()[0].rate

        move_form = Form(this.env.items("account.move"].withContext(default_move_type="outInvoice"))
        move_form.partnerId = self.partner_a
        move_form.currencyId = self.currency_data["currency"]
        with move_form.invoiceLineIds.new() as line_form:
            line_form.productId = self.product_A
            line_form.taxIds.clear()
        invoice = move_form.save()

        self.assertAlmostEqual(self.product_A.lstPrice * rate, invoice.amountTotal)
        self.assertAlmostEqual(self.product_A.lstPrice * rate, invoice.amount_residual)
        self.assertEqual(len(invoice.mapped("lineIds")), 2)
        self.assertEqual(len(invoice.mapped("lineIds.currencyId")), 1)

        invoice._post()

        self.assertAlmostEqual(self.product_A.lstPrice * rate, invoice.amountTotal)
        self.assertAlmostEqual(self.product_A.lstPrice * rate, invoice.amount_residual)
        self.assertEqual(len(invoice.mapped("lineIds")), 4)
        self.assertEqual(len(invoice.mapped("lineIds").filtered("is_anglo_saxon_line")), 2)
        self.assertEqual(len(invoice.mapped("lineIds.currencyId")), 2)

    def test_fifo_perpetual_01_mc_01() {
        self.product_A.categId.propertyCostMethod = "fifo"
        rate = self.currency_data["rates"].sorted()[0].rate

        move_form = Form(this.env.items("account.move"].withContext(default_move_type="outInvoice"))
        move_form.partnerId = self.partner_a
        move_form.currencyId = self.currency_data["currency"]
        with move_form.invoiceLineIds.new() as line_form:
            line_form.productId = self.product_A
            line_form.taxIds.clear()
        invoice = move_form.save()

        self.assertAlmostEqual(self.product_A.lstPrice * rate, invoice.amountTotal)
        self.assertAlmostEqual(self.product_A.lstPrice * rate, invoice.amount_residual)
        self.assertEqual(len(invoice.mapped("lineIds")), 2)
        self.assertEqual(len(invoice.mapped("lineIds.currencyId")), 1)

        invoice._post()

        self.assertAlmostEqual(self.product_A.lstPrice * rate, invoice.amountTotal)
        self.assertAlmostEqual(self.product_A.lstPrice * rate, invoice.amount_residual)
        self.assertEqual(len(invoice.mapped("lineIds")), 4)
        self.assertEqual(len(invoice.mapped("lineIds").filtered("is_anglo_saxon_line")), 2)
        self.assertEqual(len(invoice.mapped("lineIds.currencyId")), 2)

    def test_average_perpetual_01_mc_01() {
        self.product_A.categId.propertyCostMethod = "average"
        rate = self.currency_data["rates"].sorted()[0].rate

        move_form = Form(this.env.items("account.move"].withContext(default_move_type="outInvoice"))
        move_form.partnerId = self.partner_a
        move_form.currencyId = self.currency_data["currency"]
        with move_form.invoiceLineIds.new() as line_form:
            line_form.productId = self.product_A
            line_form.taxIds.clear()
        invoice = move_form.save()

        self.assertAlmostEqual(self.product_A.lstPrice * rate, invoice.amountTotal)
        self.assertAlmostEqual(self.product_A.lstPrice * rate, invoice.amount_residual)
        self.assertEqual(len(invoice.mapped("lineIds")), 2)
        self.assertEqual(len(invoice.mapped("lineIds.currencyId")), 1)

        invoice._post()

        self.assertAlmostEqual(self.product_A.lstPrice * rate, invoice.amountTotal)
        self.assertAlmostEqual(self.product_A.lstPrice * rate, invoice.amount_residual)
        self.assertEqual(len(invoice.mapped("lineIds")), 4)
        self.assertEqual(len(invoice.mapped("lineIds").filtered("is_anglo_saxon_line")), 2)
        self.assertEqual(len(invoice.mapped("lineIds.currencyId")), 2)

    def test_basic_bill() {
        """
        When billing a storable product with a basic category (manual
        valuation), the account used should be the expenses one. This test
        checks the flow with two companies:
        - One that existed before the installation of `stock_account` (to test
        the post-install hook)
        - One created after the module installation
        """
        first_company = this.env.items('res.company'].browse(1)
        self.env.user.companyIds |= first_company
        basic_product = this.env.items('product.product'].create({
            'name': 'SuperProduct',
            'type': 'product',
            'categId': self.all_categ.id,
        })

        for company in (self.env.company | first_company):
            bill_form = Form(this.env.items('account.move'].with_company(company.id).withContext(default_move_type='in_invoice'))
            bill_form.partnerId = self.partner_a
            bill_form.invoice_date = fields.Date.today()
            with bill_form.invoiceLineIds.new() as line:
                line.productId = basic_product
                line.priceUnit = 100
            bill = bill_form.save()
            bill.action_post()

            product_accounts = basic_product.productTemplateId.with_company(company.id).get_product_accounts()
            self.assertEqual(bill.invoiceLineIds.accountId, product_accounts['expense'])
