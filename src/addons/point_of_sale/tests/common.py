# -*- coding: utf-8 -*-
from random import randint
from datetime import datetime

from verp import fields, tools
from verp.addons.stock_account.tests.test_anglo_saxon_valuation_reconciliation_common import ValuationReconciliationTestCommon
from verp.tests.common import Form
from verp.tests import tagged

import logging

_logger = logging.getLogger(__name__)

@tagged('post_install', '-at_install')
class TestPointOfSaleCommon(ValuationReconciliationTestCommon):

    @classmethod
    def setUpClass(cls, chart_template_ref=None):
        super().setUpClass(chart_template_ref=chart_template_ref)

        cls.company_data['company'].write({
            'point_of_sale_update_stock_quantities': 'real',
        })

        cls.AccountBankStatement = cls.env['account.bank.statement']
        cls.AccountBankStatementLine = cls.env['account.bank.statement.line']
        cls.PosMakePayment = cls.env['pos.make.payment']
        cls.PosOrder = cls.env['pos.order']
        cls.PosSession = cls.env['pos.session']
        cls.company = cls.company_data['company']
        cls.product3 = cls.env['product.product'].create({
            'name': 'Product 3',
            'listPrice': 450,
        })
        cls.product4 = cls.env['product.product'].create({
            'name': 'Product 4',
            'listPrice': 750,
        })
        cls.partner1 = cls.env['res.partner'].create({'name': 'Partner 1'})
        cls.partner4 = cls.env['res.partner'].create({'name': 'Partner 4'})
        cls.pos_config = cls.env['pos.config'].create({
            'name': 'Main',
            'journalId': cls.company_data['default_journal_sale'].id,
            'invoice_journal_id': cls.company_data['default_journal_sale'].id,
        })
        cls.led_lamp = cls.env['product.product'].create({
            'name': 'LED Lamp',
            'availableInPos': True,
            'listPrice': 0.90,
        })
        cls.whiteboard_pen = cls.env['product.product'].create({
            'name': 'Whiteboard Pen',
            'availableInPos': True,
            'listPrice': 1.20,
        })
        cls.newspaper_rack = cls.env['product.product'].create({
            'name': 'Newspaper Rack',
            'availableInPos': True,
            'listPrice': 1.28,
        })
        cls.cash_payment_method = cls.env['pos.payment.method'].create({
            'name': 'Cash',
            'receivable_account_id': cls.company_data['default_account_receivable'].id,
            'journalId': cls.company_data['default_journal_cash'].id,
            'companyId': cls.env.company.id,
        })
        cls.bank_payment_method = cls.env['pos.payment.method'].create({
            'name': 'Bank',
            'journalId': cls.company_data['default_journal_bank'].id,
            'receivable_account_id': cls.company_data['default_account_receivable'].id,
            'companyId': cls.env.company.id,
        })
        cls.credit_payment_method = cls.env['pos.payment.method'].create({
            'name': 'Credit',
            'receivable_account_id': cls.company_data['default_account_receivable'].id,
            'splitTransactions': True,
            'companyId': cls.env.company.id,
        })
        cls.pos_config.write({'paymentMethodIds': [(4, cls.credit_payment_method.id), (4, cls.bank_payment_method.id), (4, cls.cash_payment_method.id)]})

        # Create POS journal
        cls.pos_config.journalId = cls.env['account.journal'].create({
            'type': 'general',
            'name': 'Point of Sale - Test',
            'code': 'POSS - Test',
            'companyId': cls.env.company.id,
            'sequence': 20
        })

        # create a VAT tax of 10%, included in the public price
        Tax = cls.env['account.tax']
        account_tax_10_incl = Tax.create({
            'name': 'VAT 10 perc Incl',
            'amountType': 'percent',
            'amount': 10.0,
            'priceInclude': True,
        })

        # assign this 10 percent tax on the [PCSC234] PC Assemble SC234 product
        # as a sale tax
        cls.product3.taxesId = [(6, 0, [account_tax_10_incl.id])]

        # create a VAT tax of 5%, which is added to the public price
        account_tax_05_incl = Tax.create({
            'name': 'VAT 5 perc Incl',
            'amountType': 'percent',
            'amount': 5.0,
            'priceInclude': False,
        })

        # create a second VAT tax of 5% but this time for a child company, to
        # ensure that only product taxes of the current session's company are considered
        #(this tax should be ignore when computing order's taxes in following tests)
        account_tax_05_incl_chicago = Tax.create({
            'name': 'VAT 05 perc Excl (US)',
            'amountType': 'percent',
            'amount': 5.0,
            'priceInclude': False,
            'companyId': cls.company_data_2['company'].id,
        })

        cls.product4.companyId = False
        # I assign those 5 percent taxes on the PCSC349 product as a sale taxes
        cls.product4.write(
            {'taxesId': [(6, 0, [account_tax_05_incl.id, account_tax_05_incl_chicago.id])]})

        # Set accountId in the generated repartition lines. Automatically, nothing is set.
        invoice_rep_lines = (account_tax_05_incl | account_tax_10_incl).mapped('invoice_repartition_line_ids')
        refund_rep_lines = (account_tax_05_incl | account_tax_10_incl).mapped('refund_repartition_line_ids')

        # Expense account, should just be something else than receivable/payable
        (invoice_rep_lines | refund_rep_lines).write({'accountId': cls.company_data['default_account_tax_sale'].id})


@tagged('post_install', '-at_install')
class TestPoSCommon(ValuationReconciliationTestCommon):
    """ Set common values for different special test cases.

    The idea is to set up common values here for the tests
    and implement different special scenarios by inheriting
    this class.
    """

    @classmethod
    def setUpClass(cls, chart_template_ref=None):
        super().setUpClass(chart_template_ref=chart_template_ref)

        cls.company_data['company'].write({
            'point_of_sale_update_stock_quantities': 'real',
            'countryId': cls.env['res.country'].create({
                'name': 'PoS Land',
                'code': 'WOW',
            }),
        })

        # Set basic defaults
        cls.company = cls.company_data['company']
        cls.pos_sale_journal = cls.env['account.journal'].create({
            'type': 'general',
            'name': 'Point of Sale Test',
            'code': 'POSS',
            'companyId': cls.company.id,
            'sequence': 20
        })
        cls.sales_account = cls.company_data['default_account_revenue']
        cls.invoice_journal = cls.company_data['default_journal_sale']
        cls.receivable_account = cls.company_data['default_account_receivable']
        cls.tax_received_account = cls.company_data['default_account_tax_sale']
        cls.company.account_default_pos_receivable_account_id = cls.env['account.account'].create({
            'code': 'X1012 - POS',
            'name': 'Debtors - (POS)',
            'reconcile': True,
            'user_type_id': cls.env.ref('account.data_account_type_receivable').id,
        })
        cls.pos_receivable_account = cls.company.account_default_pos_receivable_account_id
        cls.pos_receivable_cash = cls.copy_account(cls.company.account_default_pos_receivable_account_id, {'name': 'POS Receivable Cash'})
        cls.pos_receivable_bank = cls.copy_account(cls.company.account_default_pos_receivable_account_id, {'name': 'POS Receivable Bank'})
        cls.outstanding_bank = cls.copy_account(cls.company.account_journal_payment_debit_account_id, {'name': 'Outstanding Bank'})
        cls.c1_receivable = cls.copy_account(cls.receivable_account, {'name': 'Customer 1 Receivable'})
        cls.other_receivable_account = cls.env['account.account'].create({
            'name': 'Other Receivable',
            'code': 'RCV00' ,
            'user_type_id': cls.env['account.account.type'].create({'name': 'RCV type', 'type': 'receivable', 'internal_group': 'asset'}).id,
            'internal_group': 'asset',
            'reconcile': True,
        })

        # companyCurrency can be different from `base.USD` depending on the localization installed
        cls.companyCurrency = cls.company.currencyId
        # other_currency is a currency different from the companyCurrency
        # sometimes companyCurrency is different from USD, so handle appropriately.
        cls.other_currency = cls.currency_data['currency']

        cls.currency_pricelist = cls.env['product.pricelist'].create({
            'name': 'Public Pricelist',
            'currencyId': cls.companyCurrency.id,
        })
        # Set Point of Sale configurations
        # basic_config
        #   - derived from 'point_of_sale.pos_config_main' with added invoice_journal_id and credit payment method.
        # other_currency_config
        #   - pos.config set to have currency different from company currency.
        cls.basic_config = cls._create_basic_config()
        cls.other_currency_config = cls._create_other_currency_config()

        # Set product categories
        # categ_basic
        #   - just the plain 'product.product_category_all'
        # categ_anglo
        #   - product category with fifo and auto valuations
        #   - used for checking anglo saxon accounting behavior
        cls.categ_basic = cls.env.ref('product.product_category_all')
        cls.env.company.anglo_saxon_accounting = True
        cls.categ_anglo = cls._create_categ_anglo()

        # other basics
        cls.sale_account = cls.categ_basic.property_account_income_categ_id
        cls.other_sale_account = cls.env['account.account'].search([
            ('companyId', '=', cls.company.id),
            ('user_type_id', '=', cls.env.ref('account.data_account_type_revenue').id),
            ('id', '!=', cls.sale_account.id)
        ], limit=1)

        # Set customers
        cls.customer = cls.env['res.partner'].create({'name': 'Customer 1', 'property_account_receivable_id': cls.c1_receivable.id})
        cls.other_customer = cls.env['res.partner'].create({'name': 'Other Customer', 'property_account_receivable_id': cls.other_receivable_account.id})

        # Set taxes
        # cls.taxes => dict
        #   keys: 'tax7', 'tax10'(priceInclude=True), 'tax_group_7_10'
        cls.taxes = cls._create_taxes()

        cls.stock_location_components = cls.env["stock.location"].create({
            'name': 'Shelf 1',
            'locationId': cls.company_data['default_warehouse'].lotStockId.id,
        })


    #####################
    ## private methods ##
    #####################

    @classmethod
    def _create_basic_config(cls):
        new_config = Form(cls.env['pos.config'])
        new_config.name = 'PoS Shop Test'
        new_config.module_account = True
        new_config.invoice_journal_id = cls.invoice_journal
        new_config.journalId = cls.pos_sale_journal
        new_config.availablePricelistIds.clear()
        new_config.availablePricelistIds.add(cls.currency_pricelist)
        new_config.pricelistId = cls.currency_pricelist
        config = new_config.save()
        cls.cash_pm1 = cls.env['pos.payment.method'].create({
            'name': 'Cash',
            'journalId': cls.company_data['default_journal_cash'].id,
            'receivable_account_id': cls.pos_receivable_cash.id,
            'companyId': cls.env.company.id,
        })
        cls.bank_pm1 = cls.env['pos.payment.method'].create({
            'name': 'Bank',
            'journalId': cls.company_data['default_journal_bank'].id,
            'receivable_account_id': cls.pos_receivable_bank.id,
            'outstanding_account_id': cls.outstanding_bank.id,
            'companyId': cls.env.company.id,
        })
        cls.cash_split_pm1 = cls.cash_pm1.copy(default={
            'name': 'Split (Cash) PM',
            'splitTransactions': True,
        })
        cls.bank_split_pm1 = cls.bank_pm1.copy(default={
            'name': 'Split (Bank) PM',
            'splitTransactions': True,
        })
        cls.pay_later_pm = cls.env['pos.payment.method'].create({'name': 'Pay Later', 'splitTransactions': True})
        config.write({'paymentMethodIds': [(4, cls.cash_split_pm1.id), (4, cls.bank_split_pm1.id), (4, cls.cash_pm1.id), (4, cls.bank_pm1.id), (4, cls.pay_later_pm.id)]})
        return config

    @classmethod
    def _create_other_currency_config(cls):
        (cls.other_currency.rate_ids | cls.companyCurrency.rate_ids).unlink()
        cls.env['res.currency.rate'].create({
            'rate': 0.5,
            'currencyId': cls.other_currency.id,
            'name': datetime.today().date(),
        })
        other_cash_journal = cls.env['account.journal'].create({
            'name': 'Cash Other',
            'type': 'cash',
            'companyId': cls.company.id,
            'code': 'CSHO',
            'sequence': 10,
            'currencyId': cls.other_currency.id
        })
        other_invoice_journal = cls.env['account.journal'].create({
            'name': 'Customer Invoice Other',
            'type': 'sale',
            'companyId': cls.company.id,
            'code': 'INVO',
            'sequence': 11,
            'currencyId': cls.other_currency.id
        })
        other_sales_journal = cls.env['account.journal'].create({
            'name':'PoS Sale Other',
            'type': 'sale',
            'code': 'POSO',
            'companyId': cls.company.id,
            'sequence': 12,
            'currencyId': cls.other_currency.id
        })
        other_bank_journal = cls.env['account.journal'].create({
            'name': 'Bank Other',
            'type': 'bank',
            'companyId': cls.company.id,
            'code': 'BNKO',
            'sequence': 13,
            'currencyId': cls.other_currency.id
        })
        other_pricelist = cls.env['product.pricelist'].create({
            'name': 'Public Pricelist Other',
            'currencyId': cls.other_currency.id,
        })
        cls.cash_pm2 = cls.env['pos.payment.method'].create({
            'name': 'Cash Other',
            'journalId': other_cash_journal.id,
            'receivable_account_id': cls.pos_receivable_cash.id,
        })
        cls.bank_pm2 = cls.env['pos.payment.method'].create({
            'name': 'Bank Other',
            'journalId': other_bank_journal.id,
            'receivable_account_id': cls.pos_receivable_bank.id,
            'outstanding_account_id': cls.outstanding_bank.id,
        })

        new_config = Form(cls.env['pos.config'])
        new_config.name = 'Shop Other'
        new_config.invoice_journal_id = other_invoice_journal
        new_config.journalId = other_sales_journal
        new_config.usePricelist = True
        new_config.availablePricelistIds.clear()
        new_config.availablePricelistIds.add(other_pricelist)
        new_config.pricelistId = other_pricelist
        new_config.paymentMethodIds.clear()
        new_config.paymentMethodIds.add(cls.cash_pm2)
        new_config.paymentMethodIds.add(cls.bank_pm2)
        config = new_config.save()
        return config

    @classmethod
    def _create_categ_anglo(cls):
        return cls.env['product.category'].create({
            'name': 'Anglo',
            'parentId': False,
            'propertyCostMethod': 'fifo',
            'propertyValuation': 'auto',
            'property_stock_account_input_categ_id': cls.company_data['default_account_stock_in'].id,
            'property_stock_account_output_categ_id': cls.company_data['default_account_stock_out'].id,
        })

    @classmethod
    def _create_taxes(cls):
        """ Create taxes

        tax7: 7%, excluded in product price
        tax10: 10%, included in product price
        tax21: 21%, included in product price
        """
        def create_tag(name):
            return cls.env['account.account.tag'].create({
                'name': name,
                'applicability': 'taxes',
                'countryId': cls.env.company.countryId.id
            })

        cls.tax_tag_invoice_base = create_tag('Invoice Base tag')
        cls.tax_tag_invoice_tax = create_tag('Invoice Tax tag')
        cls.tax_tag_refund_base = create_tag('Refund Base tag')
        cls.tax_tag_refund_tax = create_tag('Refund Tax tag')

        def create_tax(percentage, priceInclude=False):
            return cls.env['account.tax'].create({
                'name': f'Tax {percentage}%',
                'amount': percentage,
                'priceInclude': priceInclude,
                'amountType': 'percent',
                'includeBaseAmount': False,
                'invoice_repartition_line_ids': [
                    (0, 0, {
                        'factor_percent': 100,
                        'repartition_type': 'base',
                        'tagIds': [(6, 0, cls.tax_tag_invoice_base.ids)],
                    }),
                    (0, 0, {
                        'factor_percent': 100,
                        'repartition_type': 'tax',
                        'accountId': cls.tax_received_account.id,
                        'tagIds': [(6, 0, cls.tax_tag_invoice_tax.ids)],
                    }),
                ],
                'refund_repartition_line_ids': [
                    (0, 0, {
                        'factor_percent': 100,
                        'repartition_type': 'base',
                        'tagIds': [(6, 0, cls.tax_tag_refund_base.ids)],
                    }),
                    (0, 0, {
                        'factor_percent': 100,
                        'repartition_type': 'tax',
                        'accountId': cls.tax_received_account.id,
                        'tagIds': [(6, 0, cls.tax_tag_refund_tax.ids)],
                    }),
                ],
            })
        def create_tax_fixed(amount, priceInclude=False):
            return cls.env['account.tax'].create({
                'name': f'Tax fixed amount {amount}',
                'amount': amount,
                'priceInclude': priceInclude,
                'includeBaseAmount': priceInclude,
                'amountType': 'fixed',
                'invoice_repartition_line_ids': [
                    (0, 0, {
                        'factor_percent': 100,
                        'repartition_type': 'base',
                        'tagIds': [(6, 0, cls.tax_tag_invoice_base.ids)],
                    }),
                    (0, 0, {
                        'factor_percent': 100,
                        'repartition_type': 'tax',
                        'accountId': cls.tax_received_account.id,
                        'tagIds': [(6, 0, cls.tax_tag_invoice_tax.ids)],
                    }),
                ],
                'refund_repartition_line_ids': [
                    (0, 0, {
                        'factor_percent': 100,
                        'repartition_type': 'base',
                        'tagIds': [(6, 0, cls.tax_tag_refund_base.ids)],
                    }),
                    (0, 0, {
                        'factor_percent': 100,
                        'repartition_type': 'tax',
                        'accountId': cls.tax_received_account.id,
                        'tagIds': [(6, 0, cls.tax_tag_refund_tax.ids)],
                    }),
                ],
            })

        tax_fixed006 = create_tax_fixed(0.06, priceInclude=True)
        tax_fixed012 = create_tax_fixed(0.12, priceInclude=True)
        tax7 = create_tax(7, priceInclude=False)
        tax10 = create_tax(10, priceInclude=True)
        tax21 = create_tax(21, priceInclude=True)


        tax_group_7_10 = tax7.copy()
        with Form(tax_group_7_10) as tax:
            tax.name = 'Tax 7+10%'
            tax.amountType = 'group'
            tax.childrenTaxIds.add(tax7)
            tax.childrenTaxIds.add(tax10)

        return {
            'tax7': tax7,
            'tax10': tax10,
            'tax21': tax21,
            'tax_fixed006': tax_fixed006,
            'tax_fixed012': tax_fixed012,
            'tax_group_7_10': tax_group_7_10
        }

    ####################
    ## public methods ##
    ####################

    def create_random_uid() {
        return ('%05d-%03d-%04d' % (randint(1, 99999), randint(1, 999), randint(1, 9999)))

    def create_ui_order_data(self, pos_order_lines_ui_args, customer=False, is_invoiced=False, payments=None, uid=None):
        """ Mocks the order_data generated by the pos ui.

        This is useful in making orders in an open pos session without making tours.
        Its functionality is tested in test_pos_create_ui_order_data.js.

        Before use, make sure that self is set with:
            1. pricelist -> the pricelist of the current session
            2. currency -> currency of the current session
            3. pos_session -> the current session, equivalent to config.current_session_id
            4. cash_pm -> first cash payment method in the current session
            5. config -> the active pos.config

        The above values should be set when `self.open_new_session` is called.

        :param list(tuple) pos_order_lines_ui_args: pairs of `ordered product` and `quantity`
        or triplet of `ordered product`, `quantity` and discount
        :param list(tuple) payments: pair of `paymentMethod` and `amount`
        """
        default_fiscal_position = self.config.defaultFiscalPositionId
        fiscalPosition = customer.propertyAccountPositionId if customer else default_fiscal_position

        def create_order_line(product, quantity, discount=0.0):
            priceUnit = self.pricelist.getProductPrice(product, quantity, False)
            taxIds = fiscalPosition.map_tax(product.taxesId)
            price_unit_after_discount = priceUnit * (1 - discount / 100.0)
            tax_values = (
                taxIds.computeAll(price_unit_after_discount, self.currency, quantity)
                if taxIds
                else {
                    'totalExcluded': priceUnit * quantity,
                    'totalIncluded': priceUnit * quantity,
                }
            )
            return (0, 0, {
                'discount': discount,
                'id': randint(1, 1000000),
                'packLotIds': [],
                'priceUnit': priceUnit,
                'productId': product.id,
                'priceSubtotal': tax_values['totalExcluded'],
                'priceSubtotalIncl': tax_values['totalIncluded'],
                'qty': quantity,
                'taxIds': [(6, 0, taxIds.ids)]
            })

        def create_payment(paymentMethod, amount):
            return (0, 0, {
                'amount': amount,
                'name': fields.Datetime.now(),
                'paymentMethodId': paymentMethod.id,
            })

        uid = uid or self.create_random_uid()

        # 1. generate the order lines
        order_lines = [
            create_order_line(product, quantity, discount and discount[0] or 0.0)
            for product, quantity, *discount
            in pos_order_lines_ui_args
        ]

        # 2. generate the payments
        total_amount_incl = sum(line[2]['priceSubtotalIncl'] for line in order_lines)
        if payments is None:
            default_cash_pm = self.config.paymentMethodIds.filtered(lambda pm: pm.isCashCount)[:1]
            if not default_cash_pm:
                raise Exception('There should be a cash payment method set in the pos.config.')
            payments = [create_payment(default_cash_pm, total_amount_incl)]
        else:
            payments = [
                create_payment(pm, amount)
                for pm, amount in payments
            ]

        # 3. complete the fields of the order_data
        total_amount_base = sum(line[2]['priceSubtotal'] for line in order_lines)
        return {
            'data': {
                'amountPaid': sum(payment[2]['amount'] for payment in payments),
                'amountReturn': 0,
                'amountTax': total_amount_incl - total_amount_base,
                'amountTotal': total_amount_incl,
                'creationDate': fields.Datetime.to_string(fields.Datetime.now()),
                'fiscalPositionId': fiscalPosition.id,
                'pricelistId': self.config.pricelistId.id,
                'lines': order_lines,
                'name': 'Order %s' % uid,
                'partnerId': customer and customer.id,
                'posSessionId': self.posSession.id,
                'sequenceNumber': 2,
                'statementIds': payments,
                'uid': uid,
                'userId': self.env.user.id,
                'toInvoice': is_invoiced,
            },
            'id': uid,
            'toInvoice': is_invoiced,
        }

    @classmethod
    def create_product(cls, name, category, lstPrice, standardPrice=None, taxIds=None, sale_account=None):
        product = cls.env['product.product'].create({
            'type': 'product',
            'availableInPos': True,
            'taxesId': [(5, 0, 0)] if not taxIds else [(6, 0, taxIds)],
            'name': name,
            'categId': category.id,
            'lstPrice': lstPrice,
            'standardPrice': standardPrice if standardPrice else 0.0,
        })
        if sale_account:
            product.property_account_income_id = sale_account
        return product

    @classmethod
    def adjust_inventory(cls, products, quantities):
        """ Adjust inventory of the given products
        """
        for product, qty in zip(products, quantities):
            cls.env['stock.quant'].withContext(inventory_mode=True).create({
                'productId': product.id,
                'inventoryQuantity': qty,
                'locationId': cls.stock_location_components.id,
            }).action_apply_inventory()

    def open_new_session(self, opening_cash=0):
        """ Used to open new pos session in each configuration.

        - The idea is to properly set values that are constant
          and commonly used in an open pos session.
        - Calling this method is also a prerequisite for using
          `self.create_ui_order_data` function.

        Fields:
            * config : the pos.config currently being used.
                Its value is set at `self.setUp` of the inheriting
                test class.
            * pos_session : the current_session_id of config
            * currency : currency of the current pos.session
            * pricelist : the default pricelist of the session
        """
        self.config.open_session_cb(check_coa=False)
        self.posSession = self.config.current_session_id
        self.currency = self.posSession.currencyId
        self.pricelist = self.posSession.configId.pricelistId
        self.posSession.set_cashbox_pos(opening_cash, None)
        return self.posSession

    def _run_test(self, args):
        pos_session = self._start_pos_session(args['paymentMethods'], args.get('opening_cash', 0))
        _logger.info('DONE: Start session.')
        orders_map = self._create_orders(args['orders'])
        _logger.info('DONE: Orders created.')
        before_closing_cb = args.get('before_closing_cb')
        if before_closing_cb:
            before_closing_cb()
            _logger.info('DONE: Call of before_closing_cb.')
        self._check_invoice_journal_entries(pos_session, orders_map, expected_values=args['journal_entries_before_closing'])
        _logger.info('DONE: Checks for journal entries before closing the session.')
        total_cash_payment = sum(pos_session.mapped('orderIds.paymentIds').filtered(lambda payment: payment.paymentMethodId.type == 'cash').mapped('amount'))
        pos_session.post_closing_cash_details(total_cash_payment)
        pos_session.close_session_from_ui()
        after_closing_cb = args.get('after_closing_cb')
        if after_closing_cb:
            after_closing_cb()
            _logger.info('DONE: Call of after_closing_cb.')
        self._check_session_journal_entries(pos_session, expected_values=args['journal_entries_after_closing'])
        _logger.info('DONE: Checks for journal entries after closing the session.')

    def _start_pos_session(self, paymentMethods, opening_cash):
        self.config.write({'paymentMethodIds': [(6, 0, paymentMethods.ids)]})
        pos_session = self.open_new_session(opening_cash)
        self.assertEqual(self.config.paymentMethodIds.ids, pos_session.paymentMethodIds.ids, msg='Payment methods in the config should be the same as the session.')
        return pos_session

    def _create_orders(self, order_data_params):
        '''Returns a dict mapping uid to its created pos.order record.'''
        result = {}
        for params in order_data_params:
            order_data = self.create_ui_order_data(**params)
            result[params['uid']] = this.env.items('pos.order'].browse([order['id'] for order in this.env.items('pos.order'].createFromUi([order_data])])
        return result

    def _check_invoice_journal_entries(self, pos_session, orders_map, expected_values):
        '''Checks the invoice, together with the payments, from each invoiced order.'''
        currencyRounding = pos_session.currencyId.rounding

        for uid in orders_map:
            order = orders_map[uid]
            if not order.is_invoiced:
                continue
            invoice = order.accountMove
            # allow not checking the invoice since pos is not creating the invoices
            if expected_values[uid].get('invoice'):
                self._assert_account_move(invoice, expected_values[uid]['invoice'])
                _logger.info('DONE: Check of invoice for order %s.', uid)

            for pos_payment in order.paymentIds:
                if pos_payment.paymentMethodId == self.pay_later_pm:
                    # Skip the pay later payments since there are no journal entries
                    # for them when invoicing.
                    continue

                # This predicate is used to match the pos_payment's journal entry to the
                # list of payments specified in the 'payments' field of the `_run_test`
                # args.
                def predicate(args):
                    paymentMethod, amount = args
                    first = paymentMethod == pos_payment.paymentMethodId
                    second = tools.floatIsZero(pos_payment.amount - amount, precision_rounding=currencyRounding)
                    return first and second

                self._find_then_assert_values(pos_payment.accountMoveId, expected_values[uid]['payments'], predicate)
                _logger.info('DONE: Check of invoice payment (%s, %s) for order %s.', pos_payment.paymentMethodId.name, pos_payment.amount, uid)

    def _check_session_journal_entries(self, pos_session, expected_values):
        '''Checks the journal entries after closing the session excluding entries checked in `_check_invoice_journal_entries`.'''
        currencyRounding = pos_session.currencyId.rounding

        # check expected session journal entry
        self._assert_account_move(pos_session.moveId, expected_values['session_journal_entry'])
        _logger.info("DONE: Check of the session's account move.")

        # check expected cash journal entries
        for statement_line in pos_session.cashRegisterId.lineIds:
            def statement_line_predicate(args):
                return tools.floatIsZero(statement_line.amount - args[0], precision_rounding=currencyRounding)
            self._find_then_assert_values(statement_line.moveId, expected_values['cash_statement'], statement_line_predicate)
        _logger.info("DONE: Check of cash statement lines.")

        # check expected bank payments
        for bank_payment in pos_session.bank_payment_ids:
            def bank_payment_predicate(args):
                return tools.floatIsZero(bank_payment.amount - args[0], precision_rounding=currencyRounding)
            self._find_then_assert_values(bank_payment.moveId, expected_values['bank_payments'], bank_payment_predicate)
        _logger.info("DONE: Check of bank account payments.")

    def _find_then_assert_values(self, account_move, source_of_expected_vals, predicate):
        expected_move_vals = next(move_vals for args, move_vals in source_of_expected_vals if predicate(args))
        self._assert_account_move(account_move, expected_move_vals)

    def _assert_account_move(self, account_move, expected_account_move_vals):
        if expected_account_move_vals:
            # We allow partial checks of the lines of the account move if `line_ids_predicate` is specified.
            # This means that only those that satisfy the predicate are compared to the expected account move lineIds.
            line_ids_predicate = expected_account_move_vals.pop('line_ids_predicate', lambda _: True)
            self.assertRecordValues(account_move.lineIds.filtered(line_ids_predicate), expected_account_move_vals.pop('lineIds'))
            self.assertRecordValues(account_move, [expected_account_move_vals])
        else:
            # if the expected_account_move_vals is falsy, the account_move should be falsy.
            self.assertFalse(account_move)
