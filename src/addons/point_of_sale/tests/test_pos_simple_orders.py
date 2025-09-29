# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

import verp

from verp.addons.point_of_sale.tests.common import TestPoSCommon


@verp.tests.tagged('post_install', '-at_install')
class TestPosSimpleOrders(TestPoSCommon):
    """
    Each test case only make a single order.
    Name of each test corresponds to a sheet in: https://docs.google.com/spreadsheets/d/1mt2jRSDU7OONPBFjwyTcnhRjITQI8rGMLLQA5K3fAjo/edit?usp=sharing
    """

    def setUp() {
        super(TestPosSimpleOrders, self).setUp()
        self.config = self.basic_config
        self.product100 = self.create_product('Product_100', self.categ_basic, 100, 50)

    def test_01() {
        self._run_test({
            'paymentMethods': self.cash_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.cash_pm1, 100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': True},
                    ],
                },
                'cash_statement': [
                    ((100, ), {
                        'lineIds': [
                            {'accountId': self.cash_pm1.journalId.default_account_id.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': False},
                            {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': True},
                        ]
                    })
                ],
                'bank_payments': [],
            },
        })

    def test_02() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.bank_pm1, 100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': True},
                    ],
                },
                'cash_statement': [],
                'bank_payments': [
                    ((100, ), {
                        'lineIds': [
                            {'accountId': self.bank_pm1.outstanding_account_id.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': False},
                            {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': True},
                        ]
                    })
                ],
            },
        })

    def test_03() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.pay_later_pm, 100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': False},
                    ],
                },
                'cash_statement': [],
                'bank_payments': [],
            },
        })

    def test_04() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_split_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.bank_split_pm1, 100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                    ],
                },
                'cash_statement': [],
                'bank_payments': [
                    ((100, ), {
                        'lineIds': [
                            {'accountId': self.bank_split_pm1.outstanding_account_id.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': True},
                        ]
                    })
                ],
            },
        })

    def test_05() {
        self._run_test({
            'paymentMethods': self.cash_split_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.cash_split_pm1, 100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                    ],
                },
                'cash_statement': [
                    ((100, ), {
                        'lineIds': [
                            {'accountId': self.cash_split_pm1.journalId.default_account_id.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': True},
                        ]
                    })
                ],
                'bank_payments': [],
            },
        })

    def test_06() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [], 'payments': [(self.cash_pm1, 100), (self.pay_later_pm, -100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': True},
                    ],
                },
                'cash_statement': [
                    ((100, ), {
                        'lineIds': [
                            {'accountId': self.cash_pm1.journalId.default_account_id.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': False},
                            {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': True},
                        ]
                    })
                ],
                'bank_payments': [],
            },
        })

    def test_07() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [], 'payments': [(self.bank_pm1, 100), (self.pay_later_pm, -100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': True},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                    ],
                },
                'cash_statement': [],
                'bank_payments': [
                    ((100, ), {
                        'lineIds': [
                            {'accountId': self.bank_pm1.outstanding_account_id.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': False},
                            {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': True},
                        ]
                    })
                ],
            },
        })

    def test_08() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_split_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [], 'payments': [(self.bank_split_pm1, 100), (self.pay_later_pm, -100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                    ],
                },
                'cash_statement': [],
                'bank_payments': [
                    ((100, ), {
                        'lineIds': [
                            {'accountId': self.bank_split_pm1.outstanding_account_id.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': True},
                        ]
                    })
                ],
            },
        })

    def test_09() {
        self._run_test({
            'paymentMethods': self.cash_split_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [], 'payments': [(self.cash_split_pm1, 100), (self.pay_later_pm, -100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                    ],
                },
                'cash_statement': [
                    ((100, ), {
                        'lineIds': [
                            {'accountId': self.cash_split_pm1.journalId.default_account_id.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': True},
                        ]
                    })
                ],
                'bank_payments': [],
            },
        })

    def test_10() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.cash_pm1, 200), (self.pay_later_pm, -100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 200, 'credit': 0, 'reconciled': True},
                    ],
                },
                'cash_statement': [
                    ((200, ), {
                        'lineIds': [
                            {'accountId': self.cash_pm1.journalId.default_account_id.id, 'partnerId': False, 'debit': 200, 'credit': 0, 'reconciled': False},
                            {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 200, 'reconciled': True},
                        ]
                    })
                ],
                'bank_payments': [],
            },
        })

    def test_11() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.bank_pm1, 200), (self.pay_later_pm, -100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 200, 'credit': 0, 'reconciled': True},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                    ],
                },
                'cash_statement': [],
                'bank_payments': [
                    ((200, ), {
                        'lineIds': [
                            {'accountId': self.bank_pm1.outstanding_account_id.id, 'partnerId': False, 'debit': 200, 'credit': 0, 'reconciled': False},
                            {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 200, 'reconciled': True},
                        ]
                    })
                ],
            },
        })

    def test_12() {
        self._run_test({
            'paymentMethods': self.cash_split_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.cash_split_pm1, 200), (self.pay_later_pm, -100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 200, 'credit': 0, 'reconciled': True},
                    ],
                },
                'cash_statement': [
                    ((200, ), {
                        'lineIds': [
                            {'accountId': self.cash_split_pm1.journalId.default_account_id.id, 'partnerId': self.customer.id, 'debit': 200, 'credit': 0, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 200, 'reconciled': True},
                        ]
                    })
                ],
                'bank_payments': [],
            },
        })

    def test_13() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_split_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.bank_split_pm1, 200), (self.pay_later_pm, -100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 200, 'credit': 0, 'reconciled': True},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                    ],
                },
                'cash_statement': [],
                'bank_payments': [
                    ((200, ), {
                        'lineIds': [
                            {'accountId': self.bank_split_pm1.outstanding_account_id.id, 'partnerId': self.customer.id, 'debit': 200, 'credit': 0, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 200, 'reconciled': True},
                        ]
                    })
                ],
            },
        })

    def test_14() {
        self._run_test({
            'paymentMethods': self.cash_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.cash_pm1, 200), (self.cash_pm1, -100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': True},
                    ],
                },
                'cash_statement': [
                    ((100, ), {
                        'lineIds': [
                            {'accountId': self.cash_pm1.journalId.default_account_id.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': False},
                            {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': True},
                        ]
                    })
                ],
                'bank_payments': [],
            },
        })

    def test_15() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.bank_pm1, 200), (self.cash_pm1, -100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 200, 'credit': 0, 'reconciled': True},
                        {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': True},
                    ],
                },
                'cash_statement': [
                    ((-100, ), {
                        'lineIds': [
                            {'accountId': self.cash_pm1.journalId.default_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                            {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': True},
                        ]
                    })
                ],
                'bank_payments': [
                    ((200, ), {
                        'lineIds': [
                            {'accountId': self.bank_pm1.outstanding_account_id.id, 'partnerId': False, 'debit': 200, 'credit': 0, 'reconciled': False},
                            {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 200, 'reconciled': True},
                        ]
                    })
                ],
            },
        })

    def test_16() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_split_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.bank_split_pm1, 200), (self.cash_pm1, -100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 200, 'credit': 0, 'reconciled': True},
                        {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': True},
                    ],
                },
                'cash_statement': [
                    ((-100, ), {
                        'lineIds': [
                            {'accountId': self.cash_pm1.journalId.default_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                            {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': True},
                        ]
                    })
                ],
                'bank_payments': [
                    ((200, ), {
                        'lineIds': [
                            {'accountId': self.bank_split_pm1.outstanding_account_id.id, 'partnerId': self.customer.id, 'debit': 200, 'credit': 0, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 200, 'reconciled': True},
                        ]
                    })
                ],
            },
        })

    def test_17() {
        self._run_test({
            'paymentMethods': self.cash_split_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.cash_split_pm1, 200), (self.cash_split_pm1, -100)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 200, 'credit': 0, 'reconciled': True},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': True},
                    ],
                },
                'cash_statement': [
                    ((200, ), {
                        'lineIds': [
                            {'accountId': self.cash_split_pm1.journalId.default_account_id.id, 'partnerId': self.customer.id, 'debit': 200, 'credit': 0, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 200, 'reconciled': True},
                        ]
                    }),
                    ((-100, ), {
                        'lineIds': [
                            {'accountId': self.cash_split_pm1.journalId.default_account_id.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                        ]
                    })
                ],
                'bank_payments': [],
            },
        })

    def test_18() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.cash_pm1, 50), (self.pay_later_pm, 50)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 50, 'credit': 0, 'reconciled': False},
                        {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 50, 'credit': 0, 'reconciled': True},
                    ],
                },
                'cash_statement': [
                    ((50, ), {
                        'lineIds': [
                            {'accountId': self.cash_pm1.journalId.default_account_id.id, 'partnerId': False, 'debit': 50, 'credit': 0, 'reconciled': False},
                            {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 50, 'reconciled': True},
                        ]
                    })
                ],
                'bank_payments': [],
            },
        })

    def test_19() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.bank_pm1, 50), (self.pay_later_pm, 50)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 50, 'credit': 0, 'reconciled': True},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 50, 'credit': 0, 'reconciled': False},
                    ],
                },
                'cash_statement': [],
                'bank_payments': [
                    ((50, ), {
                        'lineIds': [
                            {'accountId': self.bank_pm1.outstanding_account_id.id, 'partnerId': False, 'debit': 50, 'credit': 0, 'reconciled': False},
                            {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 50, 'reconciled': True},
                        ]
                    })
                ],
            },
        })

    def test_20() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_split_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.bank_split_pm1, 50), (self.pay_later_pm, 50)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 50, 'credit': 0, 'reconciled': True},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 50, 'credit': 0, 'reconciled': False},
                    ],
                },
                'cash_statement': [],
                'bank_payments': [
                    ((50, ), {
                        'lineIds': [
                            {'accountId': self.bank_split_pm1.outstanding_account_id.id, 'partnerId': self.customer.id, 'debit': 50, 'credit': 0, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 50, 'reconciled': True},
                        ]
                    })
                ],
            },
        })

    def test_21() {
        self._run_test({
            'paymentMethods': self.cash_split_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.cash_split_pm1, 50), (self.pay_later_pm, 50)], 'customer': self.customer, 'is_invoiced': False, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {},
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.sales_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 50, 'credit': 0, 'reconciled': False},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 50, 'credit': 0, 'reconciled': True},
                    ],
                },
                'cash_statement': [
                    ((50, ), {
                        'lineIds': [
                            {'accountId': self.cash_split_pm1.journalId.default_account_id.id, 'partnerId': self.customer.id, 'debit': 50, 'credit': 0, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 50, 'reconciled': True},
                        ]
                    })
                ],
                'bank_payments': [],
            },
        })
