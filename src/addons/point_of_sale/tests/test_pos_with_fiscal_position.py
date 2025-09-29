# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp import tools
import verp
from verp.addons.point_of_sale.tests.common import TestPoSCommon

@verp.tests.tagged('post_install', '-at_install')
class TestPoSWithFiscalPosition(TestPoSCommon):
    """ Tests to pos orders with fiscal position.

    keywords/phrases: fiscal position
    """

    @classmethod
    def setUpClass(cls):
        super(TestPoSWithFiscalPosition, cls).setUpClass()

        cls.config = cls.basic_config

        cls.new_tax_17 = cls.env['account.tax'].create({'name': 'New Tax 17%', 'amount': 17})
        cls.new_tax_17.invoice_repartition_line_ids.write({'accountId': cls.tax_received_account.id})

        cls.fpos = cls._create_fiscal_position()
        cls.fpos_no_tax_dest = cls._create_fiscal_position_no_tax_dest()

        cls.product1 = cls.create_product(
            'Product 1',
            cls.categ_basic,
            lstPrice=10.99,
            standardPrice=5.0,
            taxIds=cls.taxes['tax7'].ids,
        )
        cls.product2 = cls.create_product(
            'Product 2',
            cls.categ_basic,
            lstPrice=19.99,
            standardPrice=10.0,
            taxIds=cls.taxes['tax10'].ids,
        )
        cls.product3 = cls.create_product(
            'Product 3',
            cls.categ_basic,
            lstPrice=30.99,
            standardPrice=15.0,
            taxIds=cls.taxes['tax7'].ids,
        )
        cls.adjust_inventory([cls.product1, cls.product2, cls.product3], [100, 50, 50])

    @classmethod
    def _create_fiscal_position(cls):
        fpos = cls.env['account.fiscal.position'].create({'name': 'Test Fiscal Position'})

        account_fpos = cls.env['account.fiscal.position.account'].create({
            'position_id': fpos.id,
            'account_src_id': cls.sale_account.id,
            'account_dest_id': cls.other_sale_account.id,
        })
        tax_fpos = cls.env['account.fiscal.position.tax'].create({
            'position_id': fpos.id,
            'taxSrcId': cls.taxes['tax7'].id,
            'taxDestId': cls.new_tax_17.id,
        })
        fpos.write({
            'account_ids': [(6, 0, account_fpos.ids)],
            'taxIds': [(6, 0, tax_fpos.ids)],
        })
        return fpos

    @classmethod
    def _create_fiscal_position_no_tax_dest(cls):
        fpos_no_tax_dest = cls.env['account.fiscal.position'].create({'name': 'Test Fiscal Position'})
        account_fpos = cls.env['account.fiscal.position.account'].create({
            'position_id': fpos_no_tax_dest.id,
            'account_src_id': cls.sale_account.id,
            'account_dest_id': cls.other_sale_account.id,
        })
        tax_fpos = cls.env['account.fiscal.position.tax'].create({
            'position_id': fpos_no_tax_dest.id,
            'taxSrcId': cls.taxes['tax7'].id,
        })
        fpos_no_tax_dest.write({
            'account_ids': [(6, 0, account_fpos.ids)],
            'taxIds': [(6, 0, tax_fpos.ids)],
        })
        return fpos_no_tax_dest

    def test_01_no_invoice_fpos() {
        """ orders without invoice

        Orders
        ======
        +---------+----------+---------------+----------+-----+---------+-----------------+--------+
        | order   | payments | invoiced?     | product  | qty | untaxed | tax             |  total |
        +---------+----------+---------------+----------+-----+---------+-----------------+--------+
        | order 1 | cash     | yes, customer | product1 |  10 |  109.90 | 18.68 [7%->17%] | 128.58 |
        |         |          |               | product2 |  10 |  181.73 | 18.17 [10%]     | 199.90 |
        |         |          |               | product3 |  10 |  309.90 | 52.68 [7%->17%] | 362.58 |
        +---------+----------+---------------+----------+-----+---------+-----------------+--------+
        | order 2 | cash     | yes, customer | product1 |   5 |   54.95 | 9.34 [7%->17%]  |  64.29 |
        |         |          |               | product2 |   5 |   90.86 | 9.09 [10%]      |  99.95 |
        +---------+----------+---------------+----------+-----+---------+-----------------+--------+
        | order 3 | bank     | no            | product2 |   5 |   90.86 | 9.09 [10%]      |  99.95 |
        |         |          |               | product3 |   5 |  154.95 | 10.85 [7%]      |  165.8 |
        +---------+----------+---------------+----------+-----+---------+-----------------+--------+

        Expected Result
        ===============
        +---------------------+---------+
        | account             | balance |
        +---------------------+---------+
        | sale_account        | -154.95 |  (for the 7% base amount)
        | sale_account        |  -90.86 |  (for the 10% base amount)
        | other_sale_account  | -474.75 |  (for the 17% base amount)
        | other_sale_account  | -272.59 |  (for the 10% base amount)
        | tax 17%             |  -80.70 |
        | tax 10%             |  -36.35 |
        | tax 7%              |  -10.85 |
        | pos receivable bank |  265.75 |
        | pos receivable cash |  855.30 |
        +---------------------+---------+
        | Total balance       |     0.0 |
        +---------------------+---------+
        """

        self.customer.write({'propertyAccountPositionId': self.fpos.id})

        def _before_closing_cb():
            # check values before closing the session
            self.assertEqual(3, self.posSession.order_count)
            orders_total = sum(order.amountTotal for order in self.posSession.orderIds)
            self.assertAlmostEqual(orders_total, self.posSession.total_payments_amount, msg='Total order amount should be equal to the total payment amount.')

        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product1, 10), (self.product2, 10), (self.product3, 10)], 'customer': self.customer, 'uid': '00100-010-0001'},
                {'pos_order_lines_ui_args': [(self.product1, 5), (self.product2, 5)], 'customer': self.customer, 'uid': '00100-010-0002'},
                {'pos_order_lines_ui_args': [(self.product2, 5), (self.product3, 5)], 'payments': [(self.bank_pm1, 265.75)], 'uid': '00100-010-0003'},
            ],
            'before_closing_cb': _before_closing_cb,
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.tax_received_account.id, 'partnerId': False, 'debit': 0, 'credit': 80.70, 'reconciled': False},
                        {'accountId': self.tax_received_account.id, 'partnerId': False, 'debit': 0, 'credit': 36.35, 'reconciled': False},
                        {'accountId': self.tax_received_account.id, 'partnerId': False, 'debit': 0, 'credit': 10.85, 'reconciled': False},
                        {'accountId': self.other_sale_account.id, 'partnerId': False, 'debit': 0, 'credit': 474.75, 'reconciled': False},
                        {'accountId': self.other_sale_account.id, 'partnerId': False, 'debit': 0, 'credit': 272.59, 'reconciled': False},
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 90.86, 'reconciled': False},
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 154.95, 'reconciled': False},
                        {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 265.75, 'credit': 0, 'reconciled': True},
                        {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 855.30, 'credit': 0, 'reconciled': True},
                    ],
                },
                'cash_statement': [
                    ((855.30, ), {
                        'lineIds': [
                            {'accountId': self.cash_pm1.journalId.default_account_id.id, 'partnerId': False, 'debit': 855.30, 'credit': 0, 'reconciled': False},
                            {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 855.30, 'reconciled': True},
                        ]
                    }),
                ],
                'bank_payments': [
                    ((265.75, ), {
                        'lineIds': [
                            {'accountId': self.bank_pm1.outstanding_account_id.id, 'partnerId': False, 'debit': 265.75, 'credit': 0, 'reconciled': False},
                            {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 265.75, 'reconciled': True},
                        ]
                    }),
                ],
            },
        })

    def test_02_no_invoice_fpos_no_tax_dest() {
        """ Customer with fiscal position that maps a tax to no tax.

        Orders
        ======
        +---------+----------+---------------+----------+-----+---------+-------------+--------+
        | order   | payments | invoiced?     | product  | qty | untaxed | tax         |  total |
        +---------+----------+---------------+----------+-----+---------+-------------+--------+
        | order 1 | bank     | yes, customer | product1 |  10 |  109.90 | 0           | 109.90 |
        |         |          |               | product2 |  10 |  181.73 | 18.17 [10%] | 199.90 |
        |         |          |               | product3 |  10 |  309.90 | 0           | 309.90 |
        +---------+----------+---------------+----------+-----+---------+-------------+--------+
        | order 2 | cash     | yes, customer | product1 |   5 |   54.95 | 0           |  54.95 |
        |         |          |               | product2 |   5 |   90.86 | 9.09 [10%]  |  99.95 |
        +---------+----------+---------------+----------+-----+---------+-------------+--------+
        | order 3 | bank     | no            | product2 |   5 |   90.86 | 9.09 [10%]  |  99.95 |
        |         |          |               | product3 |   5 |  154.95 | 10.85 [7%]  | 165.80 |
        +---------+----------+---------------+----------+-----+---------+-------------+--------+

        Expected Result
        ===============
        +---------------------+---------+
        | account             | balance |
        +---------------------+---------+
        | sale_account        | -154.95 |  (for the 7% base amount)
        | sale_account        |  -90.86 |  (for the 10% base amount)
        | other_sale_account  | -272.59 |  (for the 10% base amount)
        | other_sale_account  | -474.75 |  (no tax)
        | tax 10%             |  -36.35 |
        | tax 7%              |  -10.85 |
        | pos receivable bank |  885.45 |
        | pos receivable cash |   154.9 |
        +---------------------+---------+
        | Total balance       |     0.0 |
        +---------------------+---------+
        """

        self.customer.write({'propertyAccountPositionId': self.fpos_no_tax_dest.id})

        def _before_closing_cb():
            # check values before closing the session
            self.assertEqual(3, self.posSession.order_count)
            orders_total = sum(order.amountTotal for order in self.posSession.orderIds)
            self.assertAlmostEqual(orders_total, self.posSession.total_payments_amount, msg='Total order amount should be equal to the total payment amount.')

        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product1, 10), (self.product2, 10), (self.product3, 10)], 'payments': [(self.bank_pm1, 619.7)], 'customer': self.customer, 'uid': '00100-010-0001'},
                {'pos_order_lines_ui_args': [(self.product1, 5), (self.product2, 5)], 'customer': self.customer, 'uid': '00100-010-0002'},
                {'pos_order_lines_ui_args': [(self.product2, 5), (self.product3, 5)], 'payments': [(self.bank_pm1, 265.75)], 'uid': '00100-010-0003'},
            ],
            'before_closing_cb': _before_closing_cb,
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.tax_received_account.id, 'partnerId': False, 'debit': 0, 'credit': 36.35, 'reconciled': False},
                        {'accountId': self.tax_received_account.id, 'partnerId': False, 'debit': 0, 'credit': 10.85, 'reconciled': False},
                        {'accountId': self.other_sale_account.id, 'partnerId': False, 'debit': 0, 'credit': 474.75, 'reconciled': False},
                        {'accountId': self.other_sale_account.id, 'partnerId': False, 'debit': 0, 'credit': 272.59, 'reconciled': False},
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 90.86, 'reconciled': False},
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 154.95, 'reconciled': False},
                        {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 885.45, 'credit': 0, 'reconciled': True},
                        {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 154.9, 'credit': 0, 'reconciled': True},
                    ],
                },
                'cash_statement': [
                    ((154.9, ), {
                        'lineIds': [
                            {'accountId': self.cash_pm1.journalId.default_account_id.id, 'partnerId': False, 'debit': 154.9, 'credit': 0, 'reconciled': False},
                            {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 154.9, 'reconciled': True},
                        ]
                    }),
                ],
                'bank_payments': [
                    ((885.45, ), {
                        'lineIds': [
                            {'accountId': self.bank_pm1.outstanding_account_id.id, 'partnerId': False, 'debit': 885.45, 'credit': 0, 'reconciled': False},
                            {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 885.45, 'reconciled': True},
                        ]
                    }),
                ],
            },
        })

    def test_03_invoiced_fpos() {
        """ Invoice 2 orders.

        Orders
        ======
        +---------+----------+---------------------+----------+-----+---------+-----------------+--------+
        | order   | payments | invoiced?           | product  | qty | untaxed | tax             |  total |
        +---------+----------+---------------------+----------+-----+---------+-----------------+--------+
        | order 1 | bank     | yes, customer       | product1 |  10 |  109.90 | 18.68 [7%->17%] | 128.58 |
        |         |          |                     | product2 |  10 |  181.73 | 18.17 [10%]     | 199.90 |
        |         |          |                     | product3 |  10 |  309.90 | 52.68 [7%->17%] | 362.58 |
        +---------+----------+---------------------+----------+-----+---------+-----------------+--------+
        | order 2 | cash     | no, customer        | product1 |   5 |   54.95 | 9.34 [7%->17%]  |  64.29 |
        |         |          |                     | product2 |   5 |   90.86 | 9.09 [10%]      |  99.95 |
        +---------+----------+---------------------+----------+-----+---------+-----------------+--------+
        | order 3 | cash     | yes, other_customer | product2 |   5 |   90.86 | 9.09 [10%]      |  99.95 |
        |         |          |                     | product3 |   5 |  154.95 | 10.85 [7%]      | 165.80 |
        +---------+----------+---------------------+----------+-----+---------+-----------------+--------+

        Expected Result
        ===============
        +---------------------+---------+
        | account             | balance |
        +---------------------+---------+
        | other_sale_account  |  -54.95 |  (for the 17% base amount)
        | other_sale_account  |  -90.86 |  (for the 10% base amount)
        | tax 10%             |   -9.09 |
        | tax 17%             |   -9.34 |
        | pos receivable cash |  429.99 |
        | pos receivable bank |  691.06 |
        | receivable          | -691.06 |
        | other receivable    | -265.75 |
        +---------------------+---------+
        | Total balance       |     0.0 |
        +---------------------+---------+
        """

        self.customer.write({'propertyAccountPositionId': self.fpos.id})

        def _before_closing_cb():
            # check values before closing the session
            self.assertEqual(3, self.posSession.order_count)
            orders_total = sum(order.amountTotal for order in self.posSession.orderIds)
            self.assertAlmostEqual(orders_total, self.posSession.total_payments_amount, msg='Total order amount should be equal to the total payment amount.')

            invoiced_order_1 = self.posSession.orderIds.filtered(lambda order: '00100-010-0001' in order.posReference)
            invoiced_order_2 = self.posSession.orderIds.filtered(lambda order: '00100-010-0003' in order.posReference)

            self.assertTrue(invoiced_order_1, msg='Invoiced order 1 should exist.')
            self.assertTrue(invoiced_order_2, msg='Invoiced order 2 should exist.')
            self.assertTrue(invoiced_order_1.accountMove, msg='Invoiced order 1 should have invoice (account_move).')
            self.assertTrue(invoiced_order_2.accountMove, msg='Invoiced order 2 should have invoice (account_move).')

        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product1, 10), (self.product2, 10), (self.product3, 10)], 'payments': [(self.bank_pm1, 691.06)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0001'},
                {'pos_order_lines_ui_args': [(self.product1, 5), (self.product2, 5)], 'customer': self.customer, 'uid': '00100-010-0002'},
                {'pos_order_lines_ui_args': [(self.product2, 5), (self.product3, 5)], 'customer': self.other_customer, 'is_invoiced': True, 'uid': '00100-010-0003'},
            ],
            'before_closing_cb': _before_closing_cb,
            'journal_entries_before_closing': {
                '00100-010-0001': {
                    'payments': [
                        ((self.bank_pm1, 691.06), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 691.06, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 691.06, 'credit': 0, 'reconciled': False},
                            ]
                        }),
                    ],
                },
                '00100-010-0003': {
                    'payments': [
                        ((self.cash_pm1, 265.75), {
                            'lineIds': [
                                {'accountId': self.other_receivable_account.id, 'partnerId': self.other_customer.id, 'debit': 0, 'credit': 265.75, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 265.75, 'credit': 0, 'reconciled': False},
                            ]
                        }),
                    ],
                },
            },
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.tax_received_account.id, 'partnerId': False, 'debit': 0, 'credit': 9.34, 'reconciled': False},
                        {'accountId': self.tax_received_account.id, 'partnerId': False, 'debit': 0, 'credit': 9.09, 'reconciled': False},
                        {'accountId': self.other_sale_account.id, 'partnerId': False, 'debit': 0, 'credit': 54.95, 'reconciled': False},
                        {'accountId': self.other_sale_account.id, 'partnerId': False, 'debit': 0, 'credit': 90.86, 'reconciled': False},
                        {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 691.06, 'credit': 0, 'reconciled': True},
                        {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 429.99, 'credit': 0, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 691.06, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 265.75, 'reconciled': True},
                    ],
                },
                'cash_statement': [
                    ((429.99, ), {
                        'lineIds': [
                            {'accountId': self.cash_pm1.journalId.default_account_id.id, 'partnerId': False, 'debit': 429.99, 'credit': 0, 'reconciled': False},
                            {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 429.99, 'reconciled': True},
                        ]
                    }),
                ],
                'bank_payments': [
                    ((691.06, ), {
                        'lineIds': [
                            {'accountId': self.bank_pm1.outstanding_account_id.id, 'partnerId': False, 'debit': 691.06, 'credit': 0, 'reconciled': False},
                            {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 691.06, 'reconciled': True},
                        ]
                    }),
                ],
            },
        })
