# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

import verp

from verp import tools
from verp.tests.common import Form
from verp.addons.point_of_sale.tests.common import TestPoSCommon

@verp.tests.tagged('post_install', '-at_install')
class TestPoSOtherCurrencyConfig(TestPoSCommon):
    """ Test PoS with basic configuration
    """

    def setUp() {
        super(TestPoSOtherCurrencyConfig, self).setUp()

        self.config = self.other_currency_config
        self.product1 = self.create_product('Product 1', self.categ_basic, 10.0, 5)
        self.product2 = self.create_product('Product 2', self.categ_basic, 20.0, 10)
        self.product3 = self.create_product('Product 3', self.categ_basic, 30.0, 15)
        self.product4 = self.create_product('Product 4', self.categ_anglo, 100, 50)
        self.product5 = self.create_product('Product 5', self.categ_anglo, 200, 70)
        self.product6 = self.create_product('Product 6', self.categ_anglo, 45.3, 10.73)
        self.product7 = self.create_product('Product 7', self.categ_basic, 7, 7, taxIds=self.taxes['tax7'].ids)
        self.adjust_inventory(
            [self.product1, self.product2, self.product3, self.product4, self.product5, self.product6, self.product7],
            [100, 50, 50, 100, 100, 100, 100]
        )
        # change the price of product2 to 12.99 fixed. No need to convert.
        pricelist_item = this.env.items('product.pricelist.item'].create({
            'productTemplateId': self.product2.productTemplateId.id,
            'fixedPrice': 12.99,
        })
        self.config.pricelistId.write({'item_ids': [(6, 0, (self.config.pricelistId.item_ids | pricelist_item).ids)]})

        self.output_account = self.categ_anglo.property_stock_account_output_categ_id
        self.expense_account = self.categ_anglo.property_account_expense_categ_id

    def test_01_check_product_cost() {
        # Product price should be half of the original price because currency rate is 0.5.
        # (see `self._create_other_currency_config` method)
        # Except for product2 where the price is specified in the pricelist.

        self.assertAlmostEqual(self.config.pricelistId.getProductPrice(self.product1, 1, self.customer), 5.00)
        self.assertAlmostEqual(self.config.pricelistId.getProductPrice(self.product2, 1, self.customer), 12.99)
        self.assertAlmostEqual(self.config.pricelistId.getProductPrice(self.product3, 1, self.customer), 15.00)
        self.assertAlmostEqual(self.config.pricelistId.getProductPrice(self.product4, 1, self.customer), 50)
        self.assertAlmostEqual(self.config.pricelistId.getProductPrice(self.product5, 1, self.customer), 100)
        self.assertAlmostEqual(self.config.pricelistId.getProductPrice(self.product6, 1, self.customer), 22.65)
        self.assertAlmostEqual(self.config.pricelistId.getProductPrice(self.product7, 1, self.customer), 3.50)

    def test_02_orders_without_invoice() {
        """ orders without invoice

        Orders
        ======
        +---------+----------+-----------+----------+-----+-------+
        | order   | payments | invoiced? | product  | qty | total |
        +---------+----------+-----------+----------+-----+-------+
        | order 1 | cash     | no        | product1 |  10 |    50 |
        |         |          |           | product2 |  10 | 129.9 |
        |         |          |           | product3 |  10 |   150 |
        +---------+----------+-----------+----------+-----+-------+
        | order 2 | cash     | no        | product1 |   5 |    25 |
        |         |          |           | product2 |   5 | 64.95 |
        +---------+----------+-----------+----------+-----+-------+
        | order 3 | bank     | no        | product2 |   5 | 64.95 |
        |         |          |           | product3 |   5 |    75 |
        +---------+----------+-----------+----------+-----+-------+

        Expected Result
        ===============
        +---------------------+---------+-----------------+
        | account             | balance | amount_currency |
        +---------------------+---------+-----------------+
        | sale_account        | -1119.6 |         -559.80 |
        | pos receivable bank |   279.9 |          139.95 |
        | pos receivable cash |   839.7 |          419.85 |
        +---------------------+---------+-----------------+
        | Total balance       |     0.0 |            0.00 |
        +---------------------+---------+-----------------+
        """

        def _before_closing_cb():
            # check values before closing the session
            self.assertEqual(3, self.posSession.order_count)
            orders_total = sum(order.amountTotal for order in self.posSession.orderIds)
            self.assertAlmostEqual(orders_total, self.posSession.total_payments_amount, msg='Total order amount should be equal to the total payment amount.')

        self._run_test({
            'paymentMethods': self.cash_pm2 | self.bank_pm2,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product1, 10), (self.product2, 10), (self.product3, 10)], 'uid': '00100-010-0001'},
                {'pos_order_lines_ui_args': [(self.product1, 5), (self.product2, 5)], 'uid': '00100-010-0002'},
                {'pos_order_lines_ui_args': [(self.product2, 5), (self.product3, 5)], 'payments': [(self.bank_pm2, 139.95)], 'uid': '00100-010-0003'},
            ],
            'before_closing_cb': _before_closing_cb,
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 1119.6, 'reconciled': False, 'amount_currency': -559.80},
                        {'accountId': self.bank_pm2.receivable_account_id.id, 'partnerId': False, 'debit': 279.9, 'credit': 0, 'reconciled': True, 'amount_currency': 139.95},
                        {'accountId': self.cash_pm2.receivable_account_id.id, 'partnerId': False, 'debit': 839.7, 'credit': 0, 'reconciled': True, 'amount_currency': 419.85},
                    ],
                },
                'cash_statement': [
                    ((419.85, ), {
                        'lineIds': [
                            {'accountId': self.cash_pm2.journalId.default_account_id.id, 'partnerId': False, 'debit': 839.7, 'credit': 0, 'reconciled': False, 'amount_currency': 419.85},
                            {'accountId': self.cash_pm2.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 839.7, 'reconciled': True, 'amount_currency': -419.85},
                        ]
                    }),
                ],
                'bank_payments': [
                    ((139.95, ), {
                        'lineIds': [
                            {'accountId': self.bank_pm2.outstanding_account_id.id, 'partnerId': False, 'debit': 279.9, 'credit': 0, 'reconciled': False, 'amount_currency': 139.95},
                            {'accountId': self.bank_pm2.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 279.9, 'reconciled': True, 'amount_currency': -139.95},
                        ]
                    }),
                ],
            },
        })

    def test_03_orders_with_invoice() {
        """ orders with invoice

        Orders
        ======
        +---------+----------+---------------+----------+-----+-------+
        | order   | payments | invoiced?     | product  | qty | total |
        +---------+----------+---------------+----------+-----+-------+
        | order 1 | cash     | no            | product1 |  10 |    50 |
        |         |          |               | product2 |  10 | 129.9 |
        |         |          |               | product3 |  10 |   150 |
        +---------+----------+---------------+----------+-----+-------+
        | order 2 | cash     | yes, customer | product1 |   5 |    25 |
        |         |          |               | product2 |   5 | 64.95 |
        +---------+----------+---------------+----------+-----+-------+
        | order 3 | bank     | yes, customer | product2 |   5 | 64.95 |
        |         |          |               | product3 |   5 |    75 |
        +---------+----------+---------------+----------+-----+-------+

        Expected Result
        ===============
        +---------------------+---------+-----------------+
        | account             | balance | amount_currency |
        +---------------------+---------+-----------------+
        | sale_account        |  -659.8 |         -329.90 |
        | pos receivable bank |   279.9 |          139.95 |
        | pos receivable cash |   839.7 |          419.85 |
        | invoice receivable  |  -179.9 |          -89.95 |
        | invoice receivable  |  -279.9 |         -139.95 |
        +---------------------+---------+-----------------+
        | Total balance       |     0.0 |            0.00 |
        +---------------------+---------+-----------------+
        """

        def _before_closing_cb():
            # check values before closing the session
            self.assertEqual(3, self.posSession.order_count)
            orders_total = sum(order.amountTotal for order in self.posSession.orderIds)
            self.assertAlmostEqual(orders_total, self.posSession.total_payments_amount, msg='Total order amount should be equal to the total payment amount.')

        self._run_test({
            'paymentMethods': self.cash_pm2 | self.bank_pm2,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product1, 10), (self.product2, 10), (self.product3, 10)], 'uid': '00100-010-0001'},
                {'pos_order_lines_ui_args': [(self.product1, 5), (self.product2, 5)], 'is_invoiced': True, 'customer': self.customer, 'uid': '00100-010-0002'},
                {'pos_order_lines_ui_args': [(self.product2, 5), (self.product3, 5)], 'payments': [(self.bank_pm2, 139.95)], 'is_invoiced': True, 'customer': self.customer, 'uid': '00100-010-0003'},
            ],
            'before_closing_cb': _before_closing_cb,
            'journal_entries_before_closing': {
                '00100-010-0002': {
                    'payments': [
                        ((self.cash_pm2, 89.95), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 179.90, 'reconciled': True, 'amount_currency': -89.95},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 179.90, 'credit': 0, 'reconciled': False, 'amount_currency': 89.95},
                            ]
                        }),
                    ],
                },
                '00100-010-0003': {
                    'payments': [
                        ((self.bank_pm2, 139.95), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 279.9, 'reconciled': True, 'amount_currency': -139.95},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 279.9, 'credit': 0, 'reconciled': False, 'amount_currency': 139.95},
                            ]
                        }),
                    ],
                },
            },
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 659.8, 'reconciled': False, 'amount_currency': -329.90},
                        {'accountId': self.bank_pm2.receivable_account_id.id, 'partnerId': False, 'debit': 279.9, 'credit': 0, 'reconciled': True, 'amount_currency': 139.95},
                        {'accountId': self.cash_pm2.receivable_account_id.id, 'partnerId': False, 'debit': 839.7, 'credit': 0, 'reconciled': True, 'amount_currency': 419.85},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 179.90, 'reconciled': True, 'amount_currency': -89.95},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 279.9, 'reconciled': True, 'amount_currency': -139.95},
                    ],
                },
                'cash_statement': [
                    ((419.85, ), {
                        'lineIds': [
                            {'accountId': self.cash_pm2.journalId.default_account_id.id, 'partnerId': False, 'debit': 839.7, 'credit': 0, 'reconciled': False, 'amount_currency': 419.85},
                            {'accountId': self.cash_pm2.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 839.7, 'reconciled': True, 'amount_currency': -419.85},
                        ]
                    }),
                ],
                'bank_payments': [
                    ((139.95, ), {
                        'lineIds': [
                            {'accountId': self.bank_pm2.outstanding_account_id.id, 'partnerId': False, 'debit': 279.9, 'credit': 0, 'reconciled': False, 'amount_currency': 139.95},
                            {'accountId': self.bank_pm2.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 279.9, 'reconciled': True, 'amount_currency': -139.95},
                        ]
                    }),
                ],
            },
        })

    def test_04_anglo_saxon_products() {
        """
        ======
        Orders
        ======
        +---------+----------+-----------+----------+-----+----------+------------+
        | order   | payments | invoiced? | product  | qty |    total | total cost |
        |         |          |           |          |     |          |            |
        +---------+----------+-----------+----------+-----+----------+------------+
        | order 1 | cash     | no        | product4 |   7 |      700 |        350 |
        |         |          |           | product5 |   7 |     1400 |        490 |
        +---------+----------+-----------+----------+-----+----------+------------+
        | order 2 | cash     | no        | product5 |   6 |     1200 |        420 |
        |         |          |           | product4 |   6 |      600 |        300 |
        |         |          |           | product6 |  49 |   2219.7 |     525.77 |
        +---------+----------+-----------+----------+-----+----------+------------+
        | order 3 | cash     | no        | product5 |   2 |      400 |        140 |
        |         |          |           | product6 |  13 |    588.9 |     139.49 |
        +---------+----------+-----------+----------+-----+----------+------------+
        | order 4 | cash     | no        | product6 |   1 |     45.3 |      10.73 |
        +---------+----------+-----------+----------+-----+----------+------------+

        ===============
        Expected Result
        ===============
        +---------------------+------------+-----------------+
        | account             |    balance | amount_currency |
        +---------------------+------------+-----------------+
        | sale_account        |   -7153.90 |        -3576.95 |
        | pos_receivable-cash |    7153.90 |         3576.95 |
        | expense_account     |    2375.99 |         2375.99 |
        | output_account      |   -2375.99 |        -2375.99 |
        +---------------------+------------+-----------------+
        | Total balance       |       0.00 |            0.00 |
        +---------------------+------------+-----------------+
        """

        self._run_test({
            'paymentMethods': self.cash_pm2,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product4, 7), (self.product5, 7)], 'uid': '00100-010-0001'},
                {'pos_order_lines_ui_args': [(self.product5, 6), (self.product4, 6), (self.product6, 49)], 'uid': '00100-010-0002'},
                {'pos_order_lines_ui_args': [(self.product5, 2), (self.product6, 13)], 'uid': '00100-010-0003'},
                {'pos_order_lines_ui_args': [(self.product6, 1)], 'uid': '00100-010-0004'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 7153.90, 'reconciled': False, 'amount_currency': -3576.95},
                        {'accountId': self.expense_account.id, 'partnerId': False, 'debit': 2375.99, 'credit': 0, 'reconciled': False, 'amount_currency': 2375.99},
                        {'accountId': self.cash_pm2.receivable_account_id.id, 'partnerId': False, 'debit': 7153.90, 'credit': 0, 'reconciled': True, 'amount_currency': 3576.95},
                        {'accountId': self.output_account.id, 'partnerId': False, 'debit': 0, 'credit': 2375.99, 'reconciled': True, 'amount_currency': -2375.99},
                    ],
                },
                'cash_statement': [
                    ((3576.95, ), {
                        'lineIds': [
                            {'accountId': self.cash_pm2.journalId.default_account_id.id, 'partnerId': False, 'debit': 7153.90, 'credit': 0, 'reconciled': False, 'amount_currency': 3576.95},
                            {'accountId': self.cash_pm2.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 7153.90, 'reconciled': True, 'amount_currency': -3576.95},
                        ]
                    }),
                ],
                'bank_payments': [],
            },
        })

    def test_05_tax_base_amount() {
        self._run_test({
            'paymentMethods': self.cash_pm2,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product7, 7)], 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.tax_received_account.id, 'partnerId': False, 'debit': 0, 'credit': 3.43, 'reconciled': False, 'amount_currency': -1.715, 'taxBaseAmount': 49},
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 49, 'reconciled': False, 'amount_currency': -24.5, 'taxBaseAmount': 0},
                        {'accountId': self.cash_pm2.receivable_account_id.id, 'partnerId': False, 'debit': 52.43, 'credit': 0, 'reconciled': True, 'amount_currency': 26.215, 'taxBaseAmount': 0},
                    ],
                },
                'cash_statement': [
                    ((26.215, ), {
                        'lineIds': [
                            {'accountId': self.cash_pm2.journalId.default_account_id.id, 'partnerId': False, 'debit': 52.43, 'credit': 0, 'reconciled': False, 'amount_currency': 26.215},
                            {'accountId': self.cash_pm2.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 52.43, 'reconciled': True, 'amount_currency': -26.215},
                        ]
                    }),
                ],
                'bank_payments': [],
            },
        })
