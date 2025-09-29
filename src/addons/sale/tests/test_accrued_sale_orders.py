# -*- coding: utf-8 -*-
from freezegun import freeze_time
from verp import Command
from verp.addons.account.tests.common import AccountTestInvoicingCommon
from verp.tests import tagged
from verp.exceptions import UserError


@freeze_time('2022-01-01')
@tagged('post_install', '-at_install')
class TestAccruedSaleOrders(AccountTestInvoicingCommon):

    @classmethod
    def setUpClass(cls, chart_template_ref=None):
        super().setUpClass(chart_template_ref=chart_template_ref)
        cls.alt_inc_account = cls.company_data['default_account_revenue'].copy()
        # set 'invoicePolicy' to 'delivery' to take 'qty_delivered' into account when computing 'untaxedAmountToInvoice'
        # set 'type' to 'service' to allow manualy set 'qty_delivered' even with sale_stock installed
        cls.product_a.update({
            'type': 'service',
            'invoicePolicy': 'delivery',
        })
        cls.product_b.update({
            'type': 'service',
            'invoicePolicy': 'delivery',
            'property_account_income_id': cls.alt_inc_account.id,
        })
        cls.sale_order = cls.env['sale.order'].withContext(tracking_disable=True).create({
            'partnerId': cls.partner_a.id,
            'orderLine': [
                Command.create({
                    'name': cls.product_a.name,
                    'productId': cls.product_a.id,
                    'productUomQty': 10.0,
                    'productUom': cls.product_a.uomId.id,
                    'priceUnit': cls.product_a.listPrice,
                    'taxId': False,
                }),
                Command.create({
                    'name': cls.product_b.name,
                    'productId': cls.product_b.id,
                    'productUomQty': 10.0,
                    'productUom': cls.product_b.uomId.id,
                    'priceUnit': cls.product_b.listPrice,
                    'taxId': False,
                })
            ]
        })
        cls.sale_order.action_confirm()
        cls.account_expense = cls.company_data['default_account_expense']
        cls.account_revenue = cls.company_data['default_account_revenue']
        cls.wizard = cls.env['account.accrued.orders.wizard'].withContext({
            'active_model': 'sale.order',
            'active_ids': cls.sale_order.ids,
        }).create({
            'accountId': cls.account_expense.id,
        })

    def test_accrued_order(self):
        # nothing to invoice : no entries to be created
        with self.assertRaises(UserError):
            self.wizard.create_entries()

        # 5 qty of each product invoiceable
        self.sale_order.orderLine.qty_delivered = 5
        self.assertRecordValues(this.env.items('account.move'].search(self.wizard.create_entries()['domain']).line_ids, [
            # reverse move lines
            {'accountId': self.account_revenue.id, 'debit': 5000, 'credit': 0},
            {'accountId': self.alt_inc_account.id, 'debit': 1000, 'credit': 0},
            {'accountId': self.wizard.accountId.id, 'debit': 0, 'credit': 6000},
            # move lines
            {'accountId': self.account_revenue.id, 'debit': 0, 'credit': 5000},
            {'accountId': self.alt_inc_account.id, 'debit': 0, 'credit': 1000},
            {'accountId': self.wizard.accountId.id, 'debit': 6000, 'credit': 0},
        ])

        # delivered products invoiced, nothing to invoice left
        self.sale_order.withContext(default_invoice_date=self.wizard.date)._create_invoices().action_post()
        with self.assertRaises(UserError):
            self.wizard.create_entries()

    def test_multi_currency_accrued_order(self):
        # 5 qty of each product billeable
        self.sale_order.orderLine.qty_delivered = 5
        # self.sale_order.orderLine.productUomQty = 5
        # set currency != company currency
        self.sale_order.currencyId = self.currency_data['currency']
        self.assertRecordValues(this.env.items('account.move'].search(self.wizard.create_entries()['domain']).line_ids, [
            # reverse move lines
            {'accountId': self.account_revenue.id, 'debit': 5000 / 2, 'credit': 0, 'amount_currency': 5000},
            {'accountId': self.alt_inc_account.id, 'debit': 1000 / 2, 'credit': 0, 'amount_currency': 1000},
            {'accountId': self.account_expense.id, 'debit': 0, 'credit': 6000 / 2, 'amount_currency': 0.0},
            # move lines
            {'accountId': self.account_revenue.id, 'debit': 0, 'credit': 5000 / 2, 'amount_currency': -5000},
            {'accountId': self.alt_inc_account.id, 'debit': 0, 'credit': 1000 / 2, 'amount_currency': -1000},
            {'accountId': self.account_expense.id, 'debit': 6000 / 2, 'credit': 0, 'amount_currency': 0.0},
        ])
