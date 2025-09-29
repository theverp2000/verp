# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

import verp

from verp import tools
from verp.addons.point_of_sale.tests.common import TestPoSCommon


@verp.tests.tagged('post_install', '-at_install')
class TestPoSBasicConfig(TestPoSCommon):
    """ Test PoS with basic configuration

    The tests contain base scenarios in using pos.
    More specialized cases are tested in other tests.
    """

    def setUp() {
        super(TestPoSBasicConfig, self).setUp()
        self.config = self.basic_config
        self.product0 = self.create_product('Product 0', self.categ_basic, 0.0, 0.0)
        self.product1 = self.create_product('Product 1', self.categ_basic, 10.0, 5)
        self.product2 = self.create_product('Product 2', self.categ_basic, 20.0, 10)
        self.product3 = self.create_product('Product 3', self.categ_basic, 30.0, 15)
        self.product4 = self.create_product('Product_4', self.categ_basic, 9.96, 4.98)
        self.product99 = self.create_product('Product_99', self.categ_basic, 99, 50)
        self.adjust_inventory([self.product1, self.product2, self.product3], [100, 50, 50])

    def test_orders_no_invoiced() {
        """ Test for orders without invoice

        3 orders
        - first 2 orders with cash payment
        - last order with bank payment

        Orders
        ======
        +---------+----------+-----------+----------+-----+-------+
        | order   | payments | invoiced? | product  | qty | total |
        +---------+----------+-----------+----------+-----+-------+
        | order 1 | cash     | no        | product1 |  10 |   100 |
        |         |          |           | product2 |   5 |   100 |
        +---------+----------+-----------+----------+-----+-------+
        | order 2 | cash     | no        | product2 |   7 |   140 |
        |         |          |           | product3 |   1 |    30 |
        +---------+----------+-----------+----------+-----+-------+
        | order 3 | bank     | no        | product1 |   1 |    10 |
        |         |          |           | product2 |   3 |    60 |
        |         |          |           | product3 |   5 |   150 |
        +---------+----------+-----------+----------+-----+-------+

        Expected Result
        ===============
        +---------------------+---------+
        | account             | balance |
        +---------------------+---------+
        | sale                |    -590 |
        | pos receivable cash |     370 |
        | pos receivable bank |     220 |
        +---------------------+---------+
        | Total balance       |     0.0 |
        +---------------------+---------+
        """
        start_qty_available = {
            self.product1: self.product1.qty_available,
            self.product2: self.product2.qty_available,
            self.product3: self.product3.qty_available,
        }

        def _before_closing_cb():
            # check values before closing the session
            self.assertEqual(3, self.posSession.order_count)
            orders_total = sum(order.amountTotal for order in self.posSession.orderIds)
            self.assertAlmostEqual(orders_total, self.posSession.total_payments_amount, msg='Total order amount should be equal to the total payment amount.')

            # check product qty_available after syncing the order
            self.assertEqual(
                self.product1.qty_available + 11,
                start_qty_available[self.product1],
            )
            self.assertEqual(
                self.product2.qty_available + 15,
                start_qty_available[self.product2],
            )
            self.assertEqual(
                self.product3.qty_available + 6,
                start_qty_available[self.product3],
            )

            # picking and stock moves should be in done state
            for order in self.posSession.orderIds:
                self.assertEqual(
                    order.pickingIds[0].state,
                    'done',
                    'Picking should be in done state.'
                )
                move_lines = order.pickingIds[0].move_lines
                self.assertEqual(
                    move_lines.mapped('state'),
                    ['done'] * len(move_lines),
                    'Move Lines should be in done state.'
                )

        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product1, 10), (self.product2, 5)], 'uid': '00100-010-0001'},
                {'pos_order_lines_ui_args': [(self.product2, 7), (self.product3, 1)], 'uid': '00100-010-0002'},
                {'pos_order_lines_ui_args': [(self.product1, 1), (self.product3, 5), (self.product2, 3)], 'payments': [(self.bank_pm1, 220)], 'uid': '00100-010-0003'},
            ],
            'before_closing_cb': _before_closing_cb,
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 590, 'reconciled': False},
                        {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 220, 'credit': 0, 'reconciled': True},
                        {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 370, 'credit': 0, 'reconciled': True},
                    ],
                },
                'cash_statement': [
                    ((370, ), {
                        'lineIds': [
                            {'accountId': self.cash_pm1.journalId.default_account_id.id, 'partnerId': False, 'debit': 370, 'credit': 0, 'reconciled': False},
                            {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 370, 'reconciled': True},
                        ]
                    }),
                ],
                'bank_payments': [
                    ((220, ), {
                        'lineIds': [
                            {'accountId': self.bank_pm1.outstanding_account_id.id, 'partnerId': False, 'debit': 220, 'credit': 0, 'reconciled': False},
                            {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 220, 'reconciled': True},
                        ]
                    }),
                ],
            },
        })

    def test_orders_with_invoiced() {
        """ Test for orders: one with invoice

        3 orders
        - order 1, paid by cash
        - order 2, paid by bank
        - order 3, paid by bank, invoiced

        Orders
        ======
        +---------+----------+---------------+----------+-----+-------+
        | order   | payments | invoiced?     | product  | qty | total |
        +---------+----------+---------------+----------+-----+-------+
        | order 1 | cash     | no            | product1 |   6 |    60 |
        |         |          |               | product2 |   3 |    60 |
        |         |          |               | product3 |   1 |    30 |
        +---------+----------+---------------+----------+-----+-------+
        | order 2 | bank     | no            | product1 |   1 |    10 |
        |         |          |               | product2 |  20 |   400 |
        +---------+----------+---------------+----------+-----+-------+
        | order 3 | bank     | yes, customer | product1 |  10 |   100 |
        |         |          |               | product3 |   1 |    30 |
        +---------+----------+---------------+----------+-----+-------+

        Expected Result
        ===============
        +---------------------+---------+
        | account             | balance |
        +---------------------+---------+
        | sale                |    -560 |
        | pos receivable cash |     150 |
        | pos receivable bank |     540 |
        | receivable          |    -130 |
        +---------------------+---------+
        | Total balance       |     0.0 |
        +---------------------+---------+
        """
        start_qty_available = {
            self.product1: self.product1.qty_available,
            self.product2: self.product2.qty_available,
            self.product3: self.product3.qty_available,
        }

        def _before_closing_cb():
            # check values before closing the session
            self.assertEqual(3, self.posSession.order_count)
            orders_total = sum(order.amountTotal for order in self.posSession.orderIds)
            self.assertAlmostEqual(orders_total, self.posSession.total_payments_amount, msg='Total order amount should be equal to the total payment amount.')

            # check product qty_available after syncing the order
            self.assertEqual(
                self.product1.qty_available + 17,
                start_qty_available[self.product1],
            )
            self.assertEqual(
                self.product2.qty_available + 23,
                start_qty_available[self.product2],
            )
            self.assertEqual(
                self.product3.qty_available + 2,
                start_qty_available[self.product3],
            )

            # picking and stock moves should be in done state
            # no exception for invoiced orders
            for order in self.posSession.orderIds:
                self.assertEqual(
                    order.pickingIds[0].state,
                    'done',
                    'Picking should be in done state.'
                )
                move_lines = order.pickingIds[0].move_lines
                self.assertEqual(
                    move_lines.mapped('state'),
                    ['done'] * len(move_lines),
                    'Move Lines should be in done state.'
                )

            # check account move in the invoiced order
            invoiced_order = self.posSession.orderIds.filtered(lambda order: order.accountMove)
            self.assertEqual(1, len(invoiced_order), 'Only one order is invoiced in this test.')

            # check state of orders before validating the session.
            self.assertEqual('invoiced', invoiced_order.state, msg="state should be 'invoiced' for invoiced orders.")
            uninvoiced_orders = self.posSession.orderIds - invoiced_order
            self.assertTrue(
                all([order.state == 'paid' for order in uninvoiced_orders]),
                msg="state should be 'paid' for uninvoiced orders before validating the session."
            )

        def _after_closing_cb():
            # check state of orders after validating the session.
            uninvoiced_orders = self.posSession.orderIds.filtered(lambda order: not order.is_invoiced)
            self.assertTrue(
                all([order.state == 'done' for order in uninvoiced_orders]),
                msg="State should be 'done' for uninvoiced orders after validating the session."
            )

        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product1, 6), (self.product2, 3), (self.product3, 1), ], 'payments': [(self.cash_pm1, 150)], 'uid': '00100-010-0001'},
                {'pos_order_lines_ui_args': [(self.product1, 1), (self.product2, 20), ], 'payments': [(self.bank_pm1, 410)], 'uid': '00100-010-0002'},
                {'pos_order_lines_ui_args': [(self.product1, 10), (self.product3, 1), ], 'payments': [(self.bank_pm1, 130)], 'is_invoiced': True, 'customer': self.customer, 'uid': '00100-010-0003'},
            ],
            'before_closing_cb': _before_closing_cb,
            'journal_entries_before_closing': {
                '00100-010-0003': {
                    'invoice': {
                        'lineIds': [
                            {'accountId': self.sales_account.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                            {'accountId': self.sales_account.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 30, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 130, 'credit': 0, 'reconciled': True},
                        ]
                    },
                    'payments': [
                        ((self.bank_pm1, 130), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 130, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 130, 'credit': 0, 'reconciled': False},
                            ]
                        }),
                    ],
                }
            },
            'after_closing_cb': _after_closing_cb,
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 560, 'reconciled': False},
                        {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 540, 'credit': 0, 'reconciled': True},
                        {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 150, 'credit': 0, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 130, 'reconciled': True},
                    ],
                },
                'cash_statement': [
                    ((150, ), {
                        'lineIds': [
                            {'accountId': self.cash_pm1.journalId.default_account_id.id, 'partnerId': False, 'debit': 150, 'credit': 0, 'reconciled': False},
                            {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 150, 'reconciled': True},
                        ]
                    }),
                ],
                'bank_payments': [
                    ((540, ), {
                        'lineIds': [
                            {'accountId': self.bank_pm1.outstanding_account_id.id, 'partnerId': False, 'debit': 540, 'credit': 0, 'reconciled': False},
                            {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 540, 'reconciled': True},
                        ]
                    }),
                ],
            },
        })

    def test_orders_with_zero_valued_invoiced() {
        """One invoiced order but with zero receivable line balance."""
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product0, 1)], 'payments': [(self.bank_pm1, 0)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {
                '00100-010-0001': {
                    'invoice': {
                        'lineIds': [
                            {'accountId': self.sales_account.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 0, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 0, 'reconciled': False},
                        ]
                    },
                    'payments': [
                        ((self.bank_pm1, 0), False),
                    ],
                }
            },
            'journal_entries_after_closing': {
                'session_journal_entry': False,
                'cash_statement': [],
                'bank_payments': [],
            },
        })

    def test_return_order_invoiced() {

        def _before_closing_cb():
            order = self.posSession.orderIds.filtered(lambda order: '666-666-666' in order.posReference)

            # refund
            order.refund()
            refund_order = self.posSession.orderIds.filtered(lambda order: order.state == 'draft')

            # pay the refund
            context_make_payment = {"activeIds": [refund_order.id], "activeId": refund_order.id}
            make_payment = this.env.items('pos.make.payment'].withContext(context_make_payment).create({
                'paymentMethodId': self.cash_pm1.id,
                'amount': -100,
            })
            make_payment.check()

            # invoice refund
            refund_order.actionPosOrderInvoice()

        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product1, 10)], 'payments': [(self.cash_pm1, 100)], 'customer': self.customer, 'is_invoiced': True, 'uid': '666-666-666'},
            ],
            'before_closing_cb': _before_closing_cb,
            'journal_entries_before_closing': {
                '666-666-666': {
                    'invoice': {
                        'lineIds': [
                            {'accountId': self.sales_account.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                        ]
                    },
                    'payments': [
                        ((self.cash_pm1, 100), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': False},
                            ]
                        }),
                    ],
                }
            },
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 0, 'reconciled': True},
                    ],
                },
                'cash_statement': [],
                'bank_payments': [],
            },
        })

    def test_return_order() {
        """ Test return order

        2 orders
        - 2nd order is returned

        Orders
        ======
        +------------------+----------+-----------+----------+-----+-------+
        | order            | payments | invoiced? | product  | qty | total |
        +------------------+----------+-----------+----------+-----+-------+
        | order 1          | bank     | no        | product1 |   1 |    10 |
        |                  |          |           | product2 |   5 |   100 |
        +------------------+----------+-----------+----------+-----+-------+
        | order 2          | cash     | no        | product1 |   3 |    30 |
        |                  |          |           | product2 |   2 |    40 |
        |                  |          |           | product3 |   1 |    30 |
        +------------------+----------+-----------+----------+-----+-------+
        | order 3 (return) | cash     | no        | product1 |  -3 |   -30 |
        |                  |          |           | product2 |  -2 |   -40 |
        |                  |          |           | product3 |  -1 |   -30 |
        +------------------+----------+-----------+----------+-----+-------+

        Expected Result
        ===============
        +---------------------+---------+
        | account             | balance |
        +---------------------+---------+
        | sale (sales)        |    -210 |
        | sale (refund)       |     100 |
        | pos receivable bank |     110 |
        +---------------------+---------+
        | Total balance       |     0.0 |
        +---------------------+---------+
        """
        start_qty_available = {
            self.product1: self.product1.qty_available,
            self.product2: self.product2.qty_available,
            self.product3: self.product3.qty_available,
        }

        def _before_closing_cb():
            # check values before closing the session
            self.assertEqual(2, self.posSession.order_count)
            orders_total = sum(order.amountTotal for order in self.posSession.orderIds)
            self.assertAlmostEqual(orders_total, self.posSession.total_payments_amount, msg='Total order amount should be equal to the total payment amount.')

            # return order
            order_to_return = self.posSession.orderIds.filtered(lambda order: '12345-123-1234' in order.posReference)
            order_to_return.refund()
            refund_order = self.posSession.orderIds.filtered(lambda order: order.state == 'draft')

            # check if amount to pay
            self.assertAlmostEqual(refund_order.amountTotal - refund_order.amountPaid, -100)

            # pay the refund
            context_make_payment = {"activeIds": [refund_order.id], "activeId": refund_order.id}
            make_payment = this.env.items('pos.make.payment'].withContext(context_make_payment).create({
                'paymentMethodId': self.cash_pm1.id,
                'amount': -100,
            })
            make_payment.check()
            self.assertEqual(refund_order.state, 'paid', 'Payment is registered, order should be paid.')
            self.assertAlmostEqual(refund_order.amountPaid, -100.0, msg='Amount paid for return order should be negative.')

            # check product qty_available after syncing the order
            self.assertEqual(
                self.product1.qty_available + 1,
                start_qty_available[self.product1],
            )
            self.assertEqual(
                self.product2.qty_available + 5,
                start_qty_available[self.product2],
            )
            self.assertEqual(
                self.product3.qty_available,
                start_qty_available[self.product3],
            )

            # picking and stock moves should be in done state
            # no exception of return orders
            for order in self.posSession.orderIds:
                self.assertEqual(
                    order.pickingIds[0].state,
                    'done',
                    'Picking should be in done state.'
                )
                move_lines = order.pickingIds[0].move_lines
                self.assertEqual(
                    move_lines.mapped('state'),
                    ['done'] * len(move_lines),
                    'Move Lines should be in done state.'
                )

        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product1, 1), (self.product2, 5)], 'payments': [(self.bank_pm1, 110)], 'uid': '00100-010-0001'},
                {'pos_order_lines_ui_args': [(self.product1, 3), (self.product2, 2), (self.product3, 1)], 'payments': [(self.cash_pm1, 100)], 'uid': '12345-123-1234'},
            ],
            'before_closing_cb': _before_closing_cb,
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 210, 'reconciled': False},
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': False},
                        {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 110, 'credit': 0, 'reconciled': True},
                    ],
                },
                'cash_statement': [],
                'bank_payments': [
                    ((110, ), {
                        'lineIds': [
                            {'accountId': self.bank_pm1.outstanding_account_id.id, 'partnerId': False, 'debit': 110, 'credit': 0, 'reconciled': False},
                            {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 110, 'reconciled': True},
                        ]
                    }),
                ],
            },
        })

    def test_split_cash_payments() {
        self._run_test({
            'paymentMethods': self.cash_split_pm1 | self.bank_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product1, 10), (self.product2, 5)], 'payments': [(self.cash_split_pm1, 100), (self.bank_pm1, 100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
                {'pos_order_lines_ui_args': [(self.product2, 7), (self.product3, 1)], 'payments': [(self.cash_split_pm1, 70), (self.bank_pm1, 100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0002'},
                {'pos_order_lines_ui_args': [(self.product1, 1), (self.product3, 5), (self.product2, 3)], 'payments': [(self.cash_split_pm1, 120), (self.bank_pm1, 100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0003'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 590, 'reconciled': False},
                        {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 300, 'credit': 0, 'reconciled': True},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 70, 'credit': 0, 'reconciled': True},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 120, 'credit': 0, 'reconciled': True},
                    ],
                },
                'cash_statement': [
                    ((100, ), {
                        'lineIds': [
                            {'accountId': self.cash_split_pm1.journalId.default_account_id.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': True},
                        ]
                    }),
                    ((70, ), {
                        'lineIds': [
                            {'accountId': self.cash_split_pm1.journalId.default_account_id.id, 'partnerId': self.customer.id, 'debit': 70, 'credit': 0, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 70, 'reconciled': True},
                        ]
                    }),
                    ((120, ), {
                        'lineIds': [
                            {'accountId': self.cash_split_pm1.journalId.default_account_id.id, 'partnerId': self.customer.id, 'debit': 120, 'credit': 0, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 120, 'reconciled': True},
                        ]
                    }),
                ],
                'bank_payments': [
                    ((300, ), {
                        'lineIds': [
                            {'accountId': self.bank_pm1.outstanding_account_id.id, 'partnerId': False, 'debit': 300, 'credit': 0, 'reconciled': False},
                            {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 300, 'reconciled': True},
                        ]
                    })
                ],
            },
        })

    def test_rounding_method() {
        # set the cash rounding method
        self.config.cashRounding = True
        self.config.roundingMethod = this.env.items('account.cash.rounding'].create({
            'name': 'add_invoice_line',
            'rounding': 0.05,
            'strategy': 'add_invoice_line',
            'profit_account_id': self.company['default_cash_difference_income_account_id'].copy().id,
            'loss_account_id': self.company['default_cash_difference_expense_account_id'].copy().id,
            'roundingMethod': 'HALF-UP',
        })

        self.open_new_session()

        """ Test for orders: one with invoice

        3 orders
        - order 1, paid by cash
        - order 2, paid by bank
        - order 3, paid by bank, invoiced

        Orders
        ======
        +---------+----------+---------------+----------+-----+-------+
        | order   | payments | invoiced?     | product  | qty | total |
        +---------+----------+---------------+----------+-----+-------+
        | order 1 | bank     | no            | product1 |   6 |    60 |
        |         |          |               | product4 |   4 | 39.84 |
        +---------+----------+---------------+----------+-----+-------+
        | order 2 | bank     | yes           | product4 |   3 | 29.88 |
        |         |          |               | product2 |  20 |   400 |
        +---------+----------+---------------+----------+-----+-------+

        Expected Result
        ===============
        +---------------------+---------+
        | account             | balance |
        +---------------------+---------+
        | sale                | -596,56 |
        | pos receivable bank |  516,64 |
        | Rounding applied    |   -0,01 |
        +---------------------+---------+
        | Total balance       |     0.0 |
        +---------------------+---------+
        """

        # create orders
        orders = []

        # create orders
        orders = []
        orders.append(self.create_ui_order_data(
            [(self.product4, 3), (self.product2, 20)],
            payments=[(self.bank_pm1, 429.90)]
        ))

        orders.append(self.create_ui_order_data(
            [(self.product1, 6), (self.product4, 4)],
            payments=[(self.bank_pm1, 99.85)]
        ))

        # sync orders
        order = this.env.items('pos.order'].createFromUi(orders)

        self.assertEqual(orders[0]['data']['amountReturn'], 0, msg='The amount return should be 0')
        self.assertEqual(orders[1]['data']['amountReturn'], 0, msg='The amount return should be 0')

        # close the session
        self.posSession.action_pos_session_validate()

        # check values after the session is closed
        session_account_move = self.posSession.moveId

        rounding_line = session_account_move.lineIds.filtered(lambda line: line.name == 'Rounding line')
        self.assertAlmostEqual(rounding_line.credit, 0.03, msg='The credit should be equals to 0.03')

    def test_correct_partner_on_invoice_receivables() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.cash_split_pm1 | self.bank_pm1 | self.bank_split_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product1, 10)], 'payments':[(self.cash_pm1, 100)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0001'},
                {'pos_order_lines_ui_args': [(self.product1, 10)], 'payments':[(self.bank_pm1, 100)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0002'},
                {'pos_order_lines_ui_args': [(self.product1, 10)], 'payments':[(self.cash_split_pm1, 100)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0003'},
                {'pos_order_lines_ui_args': [(self.product1, 10)], 'payments':[(self.bank_split_pm1, 100)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0004'},
                {'pos_order_lines_ui_args': [(self.product1, 10)], 'payments':[(self.cash_pm1, 100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0005'},
                {'pos_order_lines_ui_args': [(self.product1, 10)], 'payments':[(self.bank_pm1, 100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0006'},
                {'pos_order_lines_ui_args': [(self.product99, 1)], 'payments':[(self.cash_split_pm1, 99)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0007'},
                {'pos_order_lines_ui_args': [(self.product99, 1)], 'payments':[(self.bank_split_pm1, 99)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0008'},
                {'pos_order_lines_ui_args': [(self.product1, 10)], 'payments':[(self.bank_pm1, 100)], 'customer': self.other_customer, 'is_invoiced': True, 'uid': '00100-010-0009'},
                {'pos_order_lines_ui_args': [(self.product1, 10)], 'payments':[(self.bank_pm1, 100)], 'customer': self.other_customer, 'is_invoiced': True, 'uid': '00100-010-0010'},
                {'pos_order_lines_ui_args': [(self.product1, 10)], 'payments':[(self.bank_pm1, 100)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0011'},
            ],
            'journal_entries_before_closing': {
                '00100-010-0001': {
                    'invoice': {
                        'lineIds': [
                            {'accountId': self.sales_account.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                        ]
                    },
                    'payments': [
                        ((self.cash_pm1, 100), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': False},
                            ]
                        }),
                    ],
                },
                '00100-010-0002': {
                    'invoice': {
                        'lineIds': [
                            {'accountId': self.sales_account.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                        ]
                    },
                    'payments': [
                        ((self.bank_pm1, 100), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': False},
                            ]
                        }),
                    ],
                },
                '00100-010-0003': {
                    'invoice': {
                        'lineIds': [
                            {'accountId': self.sales_account.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                        ]
                    },
                    'payments': [
                        ((self.cash_split_pm1, 100), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': False},
                            ]
                        }),
                    ],
                },
                '00100-010-0004': {
                    'invoice': {
                        'lineIds': [
                            {'accountId': self.sales_account.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                        ]
                    },
                    'payments': [
                        ((self.bank_split_pm1, 100), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': False},
                            ]
                        }),
                    ],
                },
                '00100-010-0009': {
                    'invoice': {
                        'lineIds': [
                            {'accountId': self.sales_account.id, 'partnerId': self.other_customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                            {'accountId': self.other_receivable_account.id, 'partnerId': self.other_customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                        ]
                    },
                    'payments': [
                        ((self.bank_pm1, 100), {
                            'lineIds': [
                                {'accountId': self.other_receivable_account.id, 'partnerId': self.other_customer.id, 'debit': 0, 'credit': 100, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': False},
                            ]
                        }),
                    ],
                },
                '00100-010-0010': {
                    'invoice': {
                        'lineIds': [
                            {'accountId': self.sales_account.id, 'partnerId': self.other_customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                            {'accountId': self.other_receivable_account.id, 'partnerId': self.other_customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                        ]
                    },
                    'payments': [
                        ((self.bank_pm1, 100), {
                            'lineIds': [
                                {'accountId': self.other_receivable_account.id, 'partnerId': self.other_customer.id, 'debit': 0, 'credit': 100, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': False},
                            ]
                        }),
                    ],
                },
                '00100-010-0011': {
                    'invoice': {
                        'lineIds': [
                            {'accountId': self.sales_account.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                        ]
                    },
                    'payments': [
                        ((self.bank_pm1, 100), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': False},
                            ]
                        }),
                    ],
                },
            },
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 398, 'reconciled': False},
                        {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 500, 'credit': 0, 'reconciled': True},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 99, 'credit': 0, 'reconciled': True},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 99, 'credit': 0, 'reconciled': True},
                        {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 200, 'credit': 0, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 400, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': True},
                    ],
                },
                'cash_statement': [
                    ((100, ), {
                        'lineIds': [
                            {'accountId': self.cash_split_pm1.journalId.default_account_id.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': True},
                        ]
                    }),
                    ((99, ), {
                        'lineIds': [
                            {'accountId': self.cash_split_pm1.journalId.default_account_id.id, 'partnerId': self.customer.id, 'debit': 99, 'credit': 0, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 99, 'reconciled': True},
                        ]
                    }),
                    ((200, ), {
                        'lineIds': [
                            {'accountId': self.cash_pm1.journalId.default_account_id.id, 'partnerId': False, 'debit': 200, 'credit': 0, 'reconciled': False},
                            {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 200, 'reconciled': True},
                        ]
                    }),
                ],
                'bank_payments': [
                    ((100, ), {
                        'lineIds': [
                            {'accountId': self.bank_split_pm1.outstanding_account_id.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': True},
                        ]
                    }),
                    ((99, ), {
                        'lineIds': [
                            {'accountId': self.bank_split_pm1.outstanding_account_id.id, 'partnerId': self.customer.id, 'debit': 99, 'credit': 0, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 99, 'reconciled': True},
                        ]
                    }),
                    ((500, ), {
                        'lineIds': [
                            {'accountId': self.bank_pm1.outstanding_account_id.id, 'partnerId': False, 'debit': 500, 'credit': 0, 'reconciled': False},
                            {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 500, 'reconciled': True},
                        ]
                    }),
                ],
            },
        })

    def test_cash_register_if_no_order() {
        # Process one order with product3
        self.open_new_session(0)
        session = self.posSession
        order_data = self.create_ui_order_data([(self.product3, 1)])
        amountPaid = order_data['data']['amountPaid']
        this.env.items('pos.order'].createFromUi([order_data])
        session.post_closing_cash_details(amountPaid)
        session.close_session_from_ui()

        cash_register = session.cashRegisterId
        self.assertEqual(cash_register.balanceStart, 0)
        self.assertEqual(cash_register.balanceEndReal, amountPaid)

        # Open/Close session without any order in cash control
        self.open_new_session(amountPaid)
        session = self.posSession
        session.post_closing_cash_details(amountPaid)
        session.close_session_from_ui()
        cash_register = session.cashRegisterId
        self.assertEqual(cash_register.balanceStart, amountPaid)
        self.assertEqual(cash_register.balanceEndReal, amountPaid)
        self.assertEqual(self.config.last_session_closing_cash, amountPaid)

    def test_start_balance_with_two_pos() {
        """ When having several POS with cash control, this tests ensures that each POS has its correct opening amount """

        def open_and_check(pos_data):
            self.config = pos_data['config']
            self.open_new_session()
            session = self.posSession
            session.set_cashbox_pos(pos_data['amountPaid'], False)
            self.assertEqual(session.cashRegisterId.balanceStart, pos_data['amountPaid'])

        pos01_config = self.config
        pos02_config = pos01_config.copy()
        pos01_data = {'config': pos01_config, 'p_qty': 1, 'amountPaid': 0}
        pos02_data = {'config': pos02_config, 'p_qty': 3, 'amountPaid': 0}

        for pos_data in [pos01_data, pos02_data]:
            open_and_check(pos_data)
            session = self.posSession

            order_data = self.create_ui_order_data([(self.product3, pos_data['p_qty'])])
            pos_data['amountPaid'] += order_data['data']['amountPaid']
            this.env.items('pos.order'].createFromUi([order_data])

            session.post_closing_cash_details(pos_data['amountPaid'])
            session.close_session_from_ui()

        open_and_check(pos01_data)
        open_and_check(pos02_data)
