# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

import verp

from verp.addons.point_of_sale.tests.common import TestPoSCommon


@verp.tests.tagged('post_install', '-at_install')
class TestPosSimpleInvoicedOrders(TestPoSCommon):
    """
    Each test case only make a single **invoiced** order.
    Name of each test corresponds to a sheet in: https://docs.google.com/spreadsheets/d/1mt2jRSDU7OONPBFjwyTcnhRjITQI8rGMLLQA5K3fAjo/edit?usp=sharing
    """

    def setUp() {
        super(TestPosSimpleInvoicedOrders, self).setUp()
        self.config = self.basic_config
        self.product100 = self.create_product('Product_100', self.categ_basic, 100, 50)

    def test_01b() {
        self._run_test({
            'paymentMethods': self.cash_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.cash_pm1, 100)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0001'},
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
                }
            },
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': True},
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

    def test_02b() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.bank_pm1, 100)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {
                '00100-010-0001': {
                    'invoice': {
                        'journalId': self.config.invoice_journal_id.id,
                        'lineIds': [
                            {'accountId': self.sales_account.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                        ]
                    },
                    'payments': [
                        ((self.bank_pm1, 100), {
                            'journalId': self.config.journalId.id,
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
                    'journalId': self.config.journalId.id,
                    'lineIds': [
                        {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': True},
                    ],
                },
                'cash_statement': [],
                'bank_payments': [
                    ((100, ), {
                        'journalId': self.bank_pm1.journalId.id,
                        'lineIds': [
                            {'accountId': self.bank_pm1.outstanding_account_id.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': False},
                            {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': True},
                        ]
                    })
                ],
            },
        })

    def test_03b() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.pay_later_pm, 100)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {
                '00100-010-0001': {
                    'invoice': {
                        'journalId': self.config.invoice_journal_id.id,
                        'lineIds': [
                            {'accountId': self.sales_account.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': False},
                        ]
                    },
                    'payments': [],
                }
            },
            'journal_entries_after_closing': {
                'session_journal_entry': False,
                'cash_statement': [],
                'bank_payments': [],
            },
        })

    def test_04b() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_split_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.bank_split_pm1, 100)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {
                '00100-010-0001': {
                    'invoice': {
                        'journalId': self.config.invoice_journal_id.id,
                        'lineIds': [
                            {'accountId': self.sales_account.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                        ]
                    },
                    'payments': [
                        ((self.bank_split_pm1, 100), {
                            'journalId': self.config.journalId.id,
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
                    'journalId': self.config.journalId.id,
                    'lineIds': [
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': True},
                    ],
                },
                'cash_statement': [],
                'bank_payments': [
                    ((100, ), {
                        'journalId': self.bank_split_pm1.journalId.id,
                        'lineIds': [
                            {'accountId': self.bank_split_pm1.outstanding_account_id.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': False},
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': True},
                        ]
                    })
                ],
            },
        })

    def test_05b() {
        self._run_test({
            'paymentMethods': self.cash_split_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.cash_split_pm1, 100)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0001'},
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
                        ((self.cash_split_pm1, 100), {
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
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': True},
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

    def test_10b() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.cash_pm1, 200), (self.pay_later_pm, -100)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0001'},
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
                        ((self.cash_pm1, 200), {
                            'lineIds': [
                                # needs to check the residual because it's supposed to be partial reconciled
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 200, 'reconciled': False, 'amount_residual': -100},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 200, 'credit': 0, 'reconciled': False, 'amount_residual': 200},
                            ]
                        }),
                    ],
                }
            },
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 200, 'credit': 0, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 200, 'reconciled': True},
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

    def test_11b() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.bank_pm1, 200), (self.pay_later_pm, -100)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0001'},
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
                        ((self.bank_pm1, 200), {
                            'lineIds': [
                                # needs to check the residual because it's supposed to be partial reconciled
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 200, 'reconciled': False, 'amount_residual': -100},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 200, 'credit': 0, 'reconciled': False, 'amount_residual': 200},
                            ]
                        }),
                    ],
                }
            },
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 200, 'credit': 0, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 200, 'reconciled': True},
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

    def test_12b() {
        self._run_test({
            'paymentMethods': self.cash_split_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.cash_split_pm1, 200), (self.pay_later_pm, -100)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0001'},
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
                        ((self.cash_split_pm1, 200), {
                            'lineIds': [
                                # needs to check the residual because it's supposed to be partial reconciled
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 200, 'reconciled': False, 'amount_residual': -100},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 200, 'credit': 0, 'reconciled': False, 'amount_residual': 200},
                            ]
                        }),
                    ],
                }
            },
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 200, 'credit': 0, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 200, 'reconciled': True},
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

    def test_13b() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_split_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.bank_split_pm1, 200), (self.pay_later_pm, -100)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0001'},
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
                        ((self.bank_split_pm1, 200), {
                            'lineIds': [
                                # needs to check the residual because it's supposed to be partial reconciled
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 200, 'reconciled': False, 'amount_residual': -100},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 200, 'credit': 0, 'reconciled': False, 'amount_residual': 200},
                            ]
                        }),
                    ],
                }
            },
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 200, 'credit': 0, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 200, 'reconciled': True},
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

    def test_14b() {
        self._run_test({
            'paymentMethods': self.cash_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.cash_pm1, 200), (self.cash_pm1, -100)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0001'},
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
                        ((self.cash_pm1, 200), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 200, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 200, 'credit': 0, 'reconciled': False},
                            ]
                        }),
                        ((self.cash_pm1, -100), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                            ]
                        }),
                    ],
                }
            },
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': True},
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

    def test_15b() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.bank_pm1, 200), (self.cash_pm1, -100)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0001'},
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
                        ((self.bank_pm1, 200), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 200, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 200, 'credit': 0, 'reconciled': False},
                            ]
                        }),
                        ((self.cash_pm1, -100), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                            ]
                        }),
                    ],
                }
            },
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 200, 'credit': 0, 'reconciled': True},
                        {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 200, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': True},
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

    def test_16b() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_split_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.bank_split_pm1, 200), (self.cash_pm1, -100)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0001'},
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
                        ((self.bank_split_pm1, 200), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 200, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 200, 'credit': 0, 'reconciled': False},
                            ]
                        }),
                        ((self.cash_pm1, -100), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                            ]
                        }),
                    ],
                }
            },
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 200, 'credit': 0, 'reconciled': True},
                        {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 200, 'reconciled': True},
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

    def test_17b() {
        self._run_test({
            'paymentMethods': self.cash_split_pm1,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.cash_split_pm1, 200), (self.cash_split_pm1, -100)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0001'},
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
                        ((self.cash_split_pm1, 200), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 200, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 200, 'credit': 0, 'reconciled': False},
                            ]
                        }),
                        ((self.cash_split_pm1, -100), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 100, 'reconciled': False},
                            ]
                        }),
                    ],
                }
            },
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 200, 'credit': 0, 'reconciled': True},
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 200, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 100, 'credit': 0, 'reconciled': True},
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

    def test_18b() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.cash_pm1, 50), (self.pay_later_pm, 50)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {
                '00100-010-0001': {
                    'invoice': {
                        'lineIds': [
                            {'accountId': self.sales_account.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False, 'amount_residual': 0},
                            # needs to check the residual because it's supposed to be partial reconciled
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': False, 'amount_residual': 50},
                        ]
                    },
                    'payments': [
                        ((self.cash_pm1, 50), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 50, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 50, 'credit': 0, 'reconciled': False},
                            ]
                        }),
                    ],
                }
            },
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.cash_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 50, 'credit': 0, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 50, 'reconciled': True},
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

    def test_19b() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.bank_pm1, 50), (self.pay_later_pm, 50)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {
                '00100-010-0001': {
                    'invoice': {
                        'lineIds': [
                            {'accountId': self.sales_account.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False, 'amount_residual': 0},
                            # needs to check the residual because it's supposed to be partial reconciled
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': False, 'amount_residual': 50},
                        ]
                    },
                    'payments': [
                        ((self.bank_pm1, 50), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 50, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 50, 'credit': 0, 'reconciled': False},
                            ]
                        }),
                    ],
                }
            },
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.bank_pm1.receivable_account_id.id, 'partnerId': False, 'debit': 50, 'credit': 0, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 50, 'reconciled': True},
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

    def test_20b() {
        self._run_test({
            'paymentMethods': self.cash_pm1 | self.bank_split_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.bank_split_pm1, 50), (self.pay_later_pm, 50)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {
                '00100-010-0001': {
                    'invoice': {
                        'lineIds': [
                            {'accountId': self.sales_account.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False, 'amount_residual': 0},
                            # needs to check the residual because it's supposed to be partial reconciled
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': False, 'amount_residual': 50},
                        ]
                    },
                    'payments': [
                        ((self.bank_split_pm1, 50), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 50, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 50, 'credit': 0, 'reconciled': False},
                            ]
                        }),
                    ],
                }
            },
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 50, 'credit': 0, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 50, 'reconciled': True},
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

    def test_21b() {
        self._run_test({
            'paymentMethods': self.cash_split_pm1 | self.pay_later_pm,
            'orders': [
                {'pos_order_lines_ui_args': [(self.product100, 1)], 'payments': [(self.cash_split_pm1, 50), (self.pay_later_pm, 50)], 'customer': self.customer, 'is_invoiced': True, 'uid': '00100-010-0001'},
            ],
            'journal_entries_before_closing': {
                '00100-010-0001': {
                    'invoice': {
                        'lineIds': [
                            {'accountId': self.sales_account.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 100, 'reconciled': False, 'amount_residual': 0},
                            # needs to check the residual because it's supposed to be partial reconciled
                            {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 100, 'credit': 0, 'reconciled': False, 'amount_residual': 50},
                        ]
                    },
                    'payments': [
                        ((self.cash_split_pm1, 50), {
                            'lineIds': [
                                {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 0, 'credit': 50, 'reconciled': True},
                                {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 50, 'credit': 0, 'reconciled': False},
                            ]
                        }),
                    ],
                }
            },
            'journal_entries_after_closing': {
                'session_journal_entry': {
                    'lineIds': [
                        {'accountId': self.c1_receivable.id, 'partnerId': self.customer.id, 'debit': 50, 'credit': 0, 'reconciled': True},
                        {'accountId': self.pos_receivable_account.id, 'partnerId': False, 'debit': 0, 'credit': 50, 'reconciled': True},
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
