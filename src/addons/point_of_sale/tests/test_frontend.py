# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp import tools
from verp.api import Environment
from verp.tools import DEFAULT_SERVER_DATE_FORMAT
from verp.addons.account.tests.common import AccountTestInvoicingHttpCommon
from datetime import date, timedelta

import verp.tests


class TestPointOfSaleHttpCommon(AccountTestInvoicingHttpCommon):

    @classmethod
    def setUpClass(cls, chart_template_ref=None):
        super().setUpClass(chart_template_ref=chart_template_ref)

        env = cls.env
        cls.env.user.groupsId += env.ref('point_of_sale.groupPosManager')
        journal_obj = env['account.journal']
        account_obj = env['account.account']
        mainCompany = cls.company_data['company']

        account_receivable = account_obj.create({'code': 'X1012',
                                                 'name': 'Account Receivable - Test',
                                                 'user_type_id': env.ref('account.data_account_type_receivable').id,
                                                 'reconcile': True})
        env.company.account_default_pos_receivable_account_id = account_receivable
        env['ir.property']._set_default('property_account_receivable_id', 'res.partner', account_receivable, mainCompany)
        # Pricelists are set below, do not take demo data into account
        env['ir.property'].sudo().search([('name', '=', 'propertyProductPricelist')]).unlink()

        cls.bank_journal = journal_obj.create({
            'name': 'Bank Test',
            'type': 'bank',
            'companyId': mainCompany.id,
            'code': 'BNK',
            'sequence': 10,
        })

        env['pos.payment.method'].create({
            'name': 'Bank',
            'journalId': cls.bank_journal.id,
        })
        cls.main_pos_config = env['pos.config'].create({
            'name': 'Shop',
            'barcodeNomenclatureId': env.ref('barcodes.defaultBarcodeNomenclature').id,
            'ifaceOrderlineCustomerNotes': True,
        })

        env['res.partner'].create({
            'name': 'Deco Addict',
        })

        cash_journal = journal_obj.create({
            'name': 'Cash Test',
            'type': 'cash',
            'companyId': mainCompany.id,
            'code': 'CSH',
            'sequence': 10,
        })

        # Archive all existing product to avoid noise during the tours
        all_pos_product = env['product.product'].search([('availableInPos', '=', True)])
        discount = env.ref('point_of_sale.product_product_consumable')
        cls.tip = env.ref('point_of_sale.product_product_tip')
        (all_pos_product - discount - cls.tip)._write({'active': False})

        # In DESKS categ: Desk Pad
        pos_categ_desks = env.ref('point_of_sale.pos_category_desks')

        # In DESKS categ: Whiteboard Pen
        pos_categ_misc = env.ref('point_of_sale.posCategoryMiscellaneous')

        # In CHAIR categ: Letter Tray
        pos_categ_chairs = env.ref('point_of_sale.pos_category_chairs')

        # test an extra price on an attribute
        cls.whiteboard_pen = env['product.product'].create({
            'name': 'Whiteboard Pen',
            'availableInPos': True,
            'listPrice': 1.20,
            'taxesId': False,
            'weight': 0.01,
            'toWeight': True,
            'posCategId': pos_categ_misc.id,
        })
        cls.wall_shelf = env['product.product'].create({
            'name': 'Wall Shelf Unit',
            'availableInPos': True,
            'listPrice': 1.98,
            'taxesId': False,
            'barcode': '2100005000000',
        })
        cls.small_shelf = env['product.product'].create({
            'name': 'Small Shelf',
            'availableInPos': True,
            'listPrice': 2.83,
            'taxesId': False,
        })
        cls.magnetic_board = env['product.product'].create({
            'name': 'Magnetic Board',
            'availableInPos': True,
            'listPrice': 1.98,
            'taxesId': False,
            'barcode': '2305000000004',
        })
        cls.monitor_stand = env['product.product'].create({
            'name': 'Monitor Stand',
            'availableInPos': True,
            'listPrice': 3.19,
            'taxesId': False,
            'barcode': '0123456789',  # No pattern in barcode nomenclature
        })
        cls.desk_pad = env['product.product'].create({
            'name': 'Desk Pad',
            'availableInPos': True,
            'listPrice': 1.98,
            'taxesId': False,
            'posCategId': pos_categ_desks.id,
        })
        cls.letter_tray = env['product.product'].create({
            'name': 'Letter Tray',
            'availableInPos': True,
            'listPrice': 4.80,
            'taxesId': False,
            'posCategId': pos_categ_chairs.id,
        })
        cls.desk_organizer = env['product.product'].create({
            'name': 'Desk Organizer',
            'availableInPos': True,
            'listPrice': 5.10,
            'taxesId': False,
        })
        configurable_chair = env['product.product'].create({
            'name': 'Configurable Chair',
            'availableInPos': True,
            'listPrice': 10,
            'taxesId': False,
        })

        attribute = env['product.attribute'].create({
            'name': 'add 2',
        })
        attribute_value = env['product.attribute.value'].create({
            'name': 'add 2',
            'attributeId': attribute.id,
        })
        line = env['product.template.attribute.line'].create({
            'productTemplateId': cls.whiteboard_pen.productTemplateId.id,
            'attributeId': attribute.id,
            'value_ids': [(6, 0, attribute_value.ids)]
        })
        line.product_template_value_ids[0].priceExtra = 2

        chair_color_attribute = env['product.attribute'].create({
            'name': 'Color',
            'displayType': 'color',
            'createVariant': 'noVariant',
        })
        chair_color_red = env['product.attribute.value'].create({
            'name': 'Red',
            'attributeId': chair_color_attribute.id,
            'htmlColor': '#ff0000',
        })
        chair_color_blue = env['product.attribute.value'].create({
            'name': 'Blue',
            'attributeId': chair_color_attribute.id,
            'htmlColor': '#0000ff',
        })
        chair_color_line = env['product.template.attribute.line'].create({
            'productTemplateId': configurable_chair.productTemplateId.id,
            'attributeId': chair_color_attribute.id,
            'value_ids': [(6, 0, [chair_color_red.id, chair_color_blue.id])]
        })
        chair_color_line.product_template_value_ids[0].priceExtra = 1

        chair_legs_attribute = env['product.attribute'].create({
            'name': 'Chair Legs',
            'displayType': 'select',
            'createVariant': 'noVariant',
        })
        chair_legs_metal = env['product.attribute.value'].create({
            'name': 'Metal',
            'attributeId': chair_legs_attribute.id,
        })
        chair_legs_wood = env['product.attribute.value'].create({
            'name': 'Wood',
            'attributeId': chair_legs_attribute.id,
        })
        chair_legs_line = env['product.template.attribute.line'].create({
            'productTemplateId': configurable_chair.productTemplateId.id,
            'attributeId': chair_legs_attribute.id,
            'value_ids': [(6, 0, [chair_legs_metal.id, chair_legs_wood.id])]
        })

        chair_fabrics_attribute = env['product.attribute'].create({
            'name': 'Fabrics',
            'displayType': 'radio',
            'createVariant': 'noVariant',
        })
        chair_fabrics_leather = env['product.attribute.value'].create({
            'name': 'Leather',
            'attributeId': chair_fabrics_attribute.id,
        })
        chair_fabrics_other = env['product.attribute.value'].create({
            'name': 'Other',
            'attributeId': chair_fabrics_attribute.id,
            'isCustom': True,
        })
        chair_fabrics_line = env['product.template.attribute.line'].create({
            'productTemplateId': configurable_chair.productTemplateId.id,
            'attributeId': chair_fabrics_attribute.id,
            'value_ids': [(6, 0, [chair_fabrics_leather.id, chair_fabrics_other.id])]
        })
        chair_color_line.product_template_value_ids[1].isCustom = True

        fixed_pricelist = env['product.pricelist'].create({
            'name': 'Fixed',
            'item_ids': [(0, 0, {
                'computePrice': 'fixed',
                'fixedPrice': 1,
            }), (0, 0, {
                'computePrice': 'fixed',
                'fixedPrice': 2,
                'applied_on': '0_product_variant',
                'productId': cls.wall_shelf.id,
            }), (0, 0, {
                'computePrice': 'fixed',
                'fixedPrice': 13.95,  # test for issues like in 7f260ab517ebde634fc274e928eb062463f0d88f
                'applied_on': '0_product_variant',
                'productId': cls.small_shelf.id,
            })],
        })

        env['product.pricelist'].create({
            'name': 'Percentage',
            'item_ids': [(0, 0, {
                'computePrice': 'percentage',
                'percentPrice': 100,
                'applied_on': '0_product_variant',
                'productId': cls.wall_shelf.id,
            }), (0, 0, {
                'computePrice': 'percentage',
                'percentPrice': 99,
                'applied_on': '0_product_variant',
                'productId': cls.small_shelf.id,
            }), (0, 0, {
                'computePrice': 'percentage',
                'percentPrice': 0,
                'applied_on': '0_product_variant',
                'productId': cls.magnetic_board.id,
            })],
        })

        env['product.pricelist'].create({
            'name': 'Formula',
            'item_ids': [(0, 0, {
                'computePrice': 'formula',
                'priceDiscount': 6,
                'priceSurcharge': 5,
                'applied_on': '0_product_variant',
                'productId': cls.wall_shelf.id,
            }), (0, 0, {
                # .99 prices
                'computePrice': 'formula',
                'priceSurcharge': -0.01,
                'priceRound': 1,
                'applied_on': '0_product_variant',
                'productId': cls.small_shelf.id,
            }), (0, 0, {
                'computePrice': 'formula',
                'priceMinMargin': 10,
                'priceMaxMargin': 100,
                'applied_on': '0_product_variant',
                'productId': cls.magnetic_board.id,
            }), (0, 0, {
                'computePrice': 'formula',
                'priceSurcharge': 10,
                'priceMaxMargin': 5,
                'applied_on': '0_product_variant',
                'productId': cls.monitor_stand.id,
            }), (0, 0, {
                'computePrice': 'formula',
                'priceDiscount': -100,
                'priceMinMargin': 5,
                'priceMaxMargin': 20,
                'applied_on': '0_product_variant',
                'productId': cls.desk_pad.id,
            })],
        })

        env['product.pricelist'].create({
            'name': 'minQuantity ordering',
            'item_ids': [(0, 0, {
                'computePrice': 'fixed',
                'fixedPrice': 1,
                'applied_on': '0_product_variant',
                'minQuantity': 2,
                'productId': cls.wall_shelf.id,
            }), (0, 0, {
                'computePrice': 'fixed',
                'fixedPrice': 2,
                'applied_on': '0_product_variant',
                'minQuantity': 1,
                'productId': cls.wall_shelf.id,
            }), (0, 0, {
                'computePrice': 'fixed',
                'fixedPrice': 2,
                'applied_on': '0_product_variant',
                'minQuantity': 2,
                'productId': env.ref('point_of_sale.product_product_consumable').id,
            })],
        })

        env['product.pricelist'].create({
            'name': 'Product template',
            'item_ids': [(0, 0, {
                'computePrice': 'fixed',
                'fixedPrice': 1,
                'applied_on': '1_product',
                'productTemplateId': cls.wall_shelf.productTemplateId.id,
            }), (0, 0, {
                'computePrice': 'fixed',
                'fixedPrice': 2,
            })],
        })

        product_category_3 = env['product.category'].create({
            'name': 'Services',
            'parentId': env.ref('product.product_category_1').id,
        })

        env['product.pricelist'].create({
            # no category has precedence over category
            'name': 'Category vs no category',
            'item_ids': [(0, 0, {
                'computePrice': 'fixed',
                'fixedPrice': 1,
                'applied_on': '2_product_category',
                'categId': product_category_3.id,  # All / Saleable / Services
            }), (0, 0, {
                'computePrice': 'fixed',
                'fixedPrice': 2,
            })],
        })

        p = env['product.pricelist'].create({
            'name': 'Category',
            'item_ids': [(0, 0, {
                'computePrice': 'fixed',
                'fixedPrice': 2,
                'applied_on': '2_product_category',
                'categId': env.ref('product.product_category_all').id,
            }), (0, 0, {
                'computePrice': 'fixed',
                'fixedPrice': 1,
                'applied_on': '2_product_category',
                'categId': product_category_3.id,  # All / Saleable / Services
            })],
        })

        today = date.today()
        one_week_ago = today - timedelta(weeks=1)
        two_weeks_ago = today - timedelta(weeks=2)
        one_week_from_now = today + timedelta(weeks=1)
        two_weeks_from_now = today + timedelta(weeks=2)

        public_pricelist = env['product.pricelist'].create({
            'name': 'Public Pricelist',
        })

        env['product.pricelist'].create({
            'name': 'Dates',
            'item_ids': [(0, 0, {
                'computePrice': 'fixed',
                'fixedPrice': 1,
                'dateStart': two_weeks_ago.strftime(DEFAULT_SERVER_DATE_FORMAT),
                'dateEnd': one_week_ago.strftime(DEFAULT_SERVER_DATE_FORMAT),
            }), (0, 0, {
                'computePrice': 'fixed',
                'fixedPrice': 2,
                'dateStart': today.strftime(DEFAULT_SERVER_DATE_FORMAT),
                'dateEnd': one_week_from_now.strftime(DEFAULT_SERVER_DATE_FORMAT),
            }), (0, 0, {
                'computePrice': 'fixed',
                'fixedPrice': 3,
                'dateStart': one_week_from_now.strftime(DEFAULT_SERVER_DATE_FORMAT),
                'dateEnd': two_weeks_from_now.strftime(DEFAULT_SERVER_DATE_FORMAT),
            })],
        })

        cost_base_pricelist = env['product.pricelist'].create({
            'name': 'Cost base',
            'item_ids': [(0, 0, {
                'base': 'standardPrice',
                'computePrice': 'percentage',
                'percentPrice': 55,
            })],
        })

        pricelist_base_pricelist = env['product.pricelist'].create({
            'name': 'Pricelist base',
            'item_ids': [(0, 0, {
                'base': 'pricelist',
                'base_pricelist_id': cost_base_pricelist.id,
                'computePrice': 'percentage',
                'percentPrice': 15,
            })],
        })

        env['product.pricelist'].create({
            'name': 'Pricelist base 2',
            'item_ids': [(0, 0, {
                'base': 'pricelist',
                'base_pricelist_id': pricelist_base_pricelist.id,
                'computePrice': 'percentage',
                'percentPrice': 3,
            })],
        })

        env['product.pricelist'].create({
            'name': 'Pricelist base rounding',
            'item_ids': [(0, 0, {
                'base': 'pricelist',
                'base_pricelist_id': fixed_pricelist.id,
                'computePrice': 'percentage',
                'percentPrice': 0.01,
            })],
        })

        excluded_pricelist = env['product.pricelist'].create({
            'name': 'Not loaded'
        })
        res_partner_18 = env['res.partner'].create({
            'name': 'Lumber Inc',
            'is_company': True,
        })
        res_partner_18.propertyProductPricelist = excluded_pricelist

        test_sale_journal = journal_obj.create({'name': 'Sales Journal - Test',
                                                'code': 'TSJ',
                                                'type': 'sale',
                                                'companyId': mainCompany.id})

        all_pricelists = env['product.pricelist'].search([('id', '!=', excluded_pricelist.id)])
        all_pricelists.write(dict(currencyId=mainCompany.currencyId.id))

        src_tax = env['account.tax'].create({'name': "SRC", 'amount': 10})
        dst_tax = env['account.tax'].create({'name': "DST", 'amount': 5})

        cls.letter_tray.taxesId = [(6, 0, [src_tax.id])]

        cls.main_pos_config.write({
            'tax_regime_selection': True,
            'fiscalPositionIds': [(0, 0, {
                                            'name': "FP-POS-2M",
                                            'taxIds': [
                                                (0,0,{'taxSrcId': src_tax.id,
                                                      'taxDestId': src_tax.id}),
                                                (0,0,{'taxSrcId': src_tax.id,
                                                      'taxDestId': dst_tax.id})]
                                            })],
            'journalId': test_sale_journal.id,
            'invoice_journal_id': test_sale_journal.id,
            'paymentMethodIds': [(0, 0, { 'name': 'Cash',
                                            'journalId': cash_journal.id,
                                            'receivable_account_id': account_receivable.id,
            })],
            'usePricelist': True,
            'pricelistId': public_pricelist.id,
            'availablePricelistIds': [(4, pricelist.id) for pricelist in all_pricelists],
            'module_pos_loyalty': False,
        })

        # Change the default sale pricelist of customers,
        # so the js tests can expect deterministically this pricelist when selecting a customer.
        env['ir.property']._set_default("propertyProductPricelist", "res.partner", public_pricelist, mainCompany)


@verp.tests.tagged('post_install', '-at_install')
class TestUi(TestPointOfSaleHttpCommon):
    def test_01_pos_basic_order() {

        self.main_pos_config.write({
            'iface_tipproduct': True,
            'tipProductId': self.tip.id,
        })

        # open a session, the /pos/ui controller will redirect to it
        self.main_pos_config.open_session_cb(check_coa=False)

        # needed because tests are run before the module is marked as
        # installed. In js web will only load qweb coming from modules
        # that are returned by the backend in module_boot. Without
        # this you end up with js, css but no qweb.
        this.env.items('ir.module.module'].search([('name', '=', 'point_of_sale')], limit=1).state = 'installed'

        self.start_tour("/pos/ui?configId=%d" % self.main_pos_config.id, 'pos_pricelist', login="accountman")
        self.start_tour("/pos/ui?configId=%d" % self.main_pos_config.id, 'pos_basic_order', login="accountman")
        self.start_tour("/pos/ui?configId=%d" % self.main_pos_config.id, 'ProductScreenTour', login="accountman")
        self.start_tour("/pos/ui?configId=%d" % self.main_pos_config.id, 'PaymentScreenTour', login="accountman")
        self.start_tour("/pos/ui?configId=%d" % self.main_pos_config.id, 'ReceiptScreenTour', login="accountman")

        for order in this.env.items('pos.order'].search([]):
            self.assertEqual(order.state, 'paid', "Validated order has payment of " + str(order.amountPaid) + " and total of " + str(order.amountTotal))

        # check if email from ReceiptScreenTour is properly sent
        email_count = this.env.items('mail.mail'].search_count([('email_to', '=', 'test@receiptscreen.com')])
        self.assertEqual(email_count, 1)

    def test_02_pos_with_invoiced() {
        self.main_pos_config.open_session_cb(check_coa=False)
        self.start_tour("/pos/ui?configId=%d" % self.main_pos_config.id, 'ChromeTour', login="accountman")
        n_invoiced = this.env.items('pos.order'].search_count([('state', '=', 'invoiced')])
        n_paid = this.env.items('pos.order'].search_count([('state', '=', 'paid')])
        self.assertEqual(n_invoiced, 1, 'There should be 1 invoiced order.')
        self.assertEqual(n_paid, 2, 'There should be 2 paid order.')

    def test_04_product_configurator() {
        self.main_pos_config.write({ 'productConfigurator': True })
        self.main_pos_config.open_session_cb(check_coa=False)
        self.start_tour("/pos/ui?configId=%d" % self.main_pos_config, 'ProductConfiguratorTour', login="accountman")

    def test_05_ticket_screen() {
        self.main_pos_config.open_session_cb(check_coa=False)
        self.start_tour("/pos/ui?configId=%d" % self.main_pos_config.id, 'TicketScreenTour', login="accountman")

    def test_fixed_tax_negative_qty() {
        """ Assert the negative amount of a negative-quantity orderline
            with zero-amount product with fixed tax.
        """

        # setup the zero-amount product
        tax_received_account = this.env.items('account.account'].create({
            'name': 'TAX_BASE',
            'code': 'TBASE',
            'user_type_id': self.env.ref('account.data_account_type_current_assets').id,
            'companyId': self.env.company.id,
        })
        fixed_tax = this.env.items('account.tax'].create({
            'name': 'fixed amount tax',
            'amountType': 'fixed',
            'amount': 1,
            'invoice_repartition_line_ids': [
                (0, 0, {
                    'factor_percent': 100,
                    'repartition_type': 'base',
                }),
                (0, 0, {
                    'factor_percent': 100,
                    'repartition_type': 'tax',
                    'accountId': tax_received_account.id,
                }),
            ],
        })
        zero_amount_product = this.env.items('product.product'].create({
            'name': 'Zero Amount Product',
            'availableInPos': True,
            'listPrice': 0,
            'taxesId': [(6, 0, [fixed_tax.id])],
        })

        # Make an order with the zero-amount product from the frontend.
        # We need to do this because of the fix in the "computeAll" port.
        self.main_pos_config.write({'ifaceTaxIncluded': 'total'})
        self.main_pos_config.open_session_cb(check_coa=False)
        self.start_tour("/pos/ui?configId=%d" % self.main_pos_config.id, 'FixedTaxNegativeQty', login="accountman")
        pos_session = self.main_pos_config.current_session_id

        # Close the session and check the session journal entry.
        pos_session.action_pos_session_validate()

        lines = pos_session.moveId.lineIds.sorted('balance')

        # order in the tour is paid using the bank payment method.
        bank_pm = self.main_pos_config.paymentMethodIds.filtered(lambda pm: pm.name == 'Bank')

        self.assertEqual(lines[0].accountId, bank_pm.receivable_account_id or self.env.company.account_default_pos_receivable_account_id)
        self.assertAlmostEqual(lines[0].balance, -1)
        self.assertEqual(lines[1].accountId, zero_amount_product.categId.property_account_income_categ_id)
        self.assertAlmostEqual(lines[1].balance, 0)
        self.assertEqual(lines[2].accountId, tax_received_account)
        self.assertAlmostEqual(lines[2].balance, 1)

    def test_change_without_cash_method() {
        #create bank payment method
        bank_pm = this.env.items('pos.payment.method'].create({
            'name': 'Bank',
            'receivable_account_id': self.env.company.account_default_pos_receivable_account_id.id,
            'isCashCount': False,
            'splitTransactions': False,
            'companyId': self.env.company.id,
        })
        self.main_pos_config.write({'paymentMethodIds': [(6, 0, bank_pm.ids)]})
        self.main_pos_config.open_session_cb(check_coa=False)
        self.start_tour("/pos/ui?configId=%d" % self.main_pos_config.id, 'PaymentScreenTour2', login="accountman")

    def test_refund_without_cash_method() {
        """ Assert that a refund cannot be made without cash payment method.
        """

        bank_pm = this.env.items('pos.payment.method'].create({
            'name': 'Bank',
            'journalId': self.bank_journal.id,
        })
        self.main_pos_config.write({"paymentMethodIds": [(6, 0, bank_pm.ids)]})
        self.main_pos_config.open_session_cb(check_coa=False)
        self.start_tour("/pos/ui?configId=%d" % self.main_pos_config.id, 'PaymentScreenTour3', login="accountman")

    def test_pos_closing_cash_details() {
        """Test if the cash closing details correctly show the cash difference
           if there is a difference at the opening of the PoS session. This also test if the accounting
           move are correctly created for the opening cash difference.
           e.g. If the previous session was closed with 100$ and the opening count is 50$,
           the closing popup should show a difference of 50$.
        """
        self.main_pos_config.open_session_cb(check_coa=False)
        current_session = self.main_pos_config.current_session_id
        current_session.post_closing_cash_details(100)
        current_session.close_session_from_ui()

        self.main_pos_config.open_session_cb(check_coa=False)
        self.start_tour("/pos/ui?configId=%d" % self.main_pos_config.id, 'CashClosingDetails', login="accountman")
        #check accounting move for the pos opening cash difference
        pos_session = self.main_pos_config.current_session_id
        self.assertEqual(len(pos_session.statementIds.lineIds), 1)
        self.assertEqual(pos_session.statementIds.lineIds[0].amount, -10)

    def test_fiscal_position_no_tax() {
        #create a tax of 15% with price included
        tax = this.env.items('account.tax'].create({
            'name': 'Tax 15%',
            'amount': 15,
            'priceInclude': True,
            'amountType': 'percent',
            'type_tax_use': 'sale',
        })

        #create a product with the tax
        self.product = this.env.items('product.product'].create({
            'name': 'Test Product',
            'taxesId': [(6, 0, [tax.id])],
            'listPrice': 100,
            'availableInPos': True,
        })

        #create a fiscal position that map the tax to no tax
        fiscalPosition = this.env.items('account.fiscal.position'].create({
            'name': 'No Tax',
            'taxIds': [(0, 0, {
                'taxSrcId': tax.id,
                'taxDestId': False,
            })],
        })

        pricelist = this.env.items('product.pricelist'].create({
            'name': 'Test Pricelist',
            'discountPolicy': 'withoutDiscount',
        })

        self.main_pos_config.write({
            'tax_regime_selection': True,
            'fiscalPositionIds': [(6, 0, [fiscalPosition.id])],
            'availablePricelistIds': [(6, 0, [pricelist.id])],
            'pricelistId': pricelist.id,
        })
        self.main_pos_config.open_session_cb(check_coa=False)
        self.start_tour("/pos/ui?configId=%d" % self.main_pos_config.id, 'FiscalPositionNoTax', login="accountman")

    def test_06_pos_discount_display_with_multiple_pricelist() {
        """ Test the discount display on the POS screen when multiple pricelists are used."""
        test_product = this.env.items('product.product'].create({
            'name': 'Test Product',
            'availableInPos': True,
            'listPrice': 10,
        })

        basePricelist = this.env.items('product.pricelist'].create({
            'name': 'basePricelist',
            'discountPolicy': 'withoutDiscount',
        })

        this.env.items('product.pricelist.item'].create({
            'pricelistId': basePricelist.id,
            'productTemplateId': test_product.productTemplateId.id,
            'computePrice': 'fixed',
            'applied_on': '1_product',
            'fixedPrice': 7,
        })

        special_pricelist = this.env.items('product.pricelist'].create({
            'name': 'special_pricelist',
            'discountPolicy': 'withoutDiscount',
        })
        this.env.items('product.pricelist.item'].create({
            'pricelistId': special_pricelist.id,
            'base': 'pricelist',
            'base_pricelist_id': basePricelist.id,
            'computePrice': 'formula',
            'applied_on': '3_global',
            'priceDiscount': 10,
        })

        self.main_pos_config.write({
            'pricelistId': basePricelist.id,
            'availablePricelistIds': [(6, 0, [basePricelist.id, special_pricelist.id])],
        })

        self.main_pos_config.open_session_cb(check_coa=False)
        self.start_tour("/pos/ui?configId=%d" % self.main_pos_config.id, 'ReceiptScreenDiscountWithPricelistTour', login="accountman")

    def test_07_pos_barcodes_scan() {
        barcode_rule = self.env.ref("point_of_sale.barcode_rule_client")
        barcode_rule.pattern = barcode_rule.pattern + "|234"
        # should in theory be changed in the JS code to `|^234`
        # If not, it will fail as it will mistakenly match with the product barcode "0123456789"

        self.main_pos_config.open_session_cb(check_coa=False)
        self.start_tour("/pos/ui?debug=1&configId=%d" % self.main_pos_config.id, 'BarcodeScanningTour', login="accountman")

    def test_08_show_tax_excluded() {

        # define a tax included tax record
        tax = this.env.items('account.tax'].create({
            'name': 'Tax 10% Included',
            'amountType': 'percent',
            'amount': 10,
            'priceInclude': True,
        })

        # define a product record with the tax
        this.env.items('product.product'].create({
            'name': 'Test Product',
            'listPrice': 110,
            'taxesId': [(6, 0, [tax.id])],
            'availableInPos': True,
        })

        # set Tax-Excluded Price
        self.main_pos_config.write({
            'ifaceTaxIncluded': 'subtotal'
        })

        self.main_pos_config.open_session_cb(check_coa=False)
        self.start_tour("/pos/ui?configId=%d" % self.main_pos_config.id, 'ShowTaxExcludedTour', login="accountman")

    def test_refund_order_with_fp_tax_included() {
        #create a tax of 15% tax included
        self.tax1 = this.env.items('account.tax'].create({
            'name': 'Tax 1',
            'amount': 15,
            'amountType': 'percent',
            'type_tax_use': 'sale',
            'priceInclude': True,
        })
        #create a tax of 0%
        self.tax2 = this.env.items('account.tax'].create({
            'name': 'Tax 2',
            'amount': 0,
            'amountType': 'percent',
            'type_tax_use': 'sale',
        })
        #create a fiscal position with the two taxes
        self.fiscalPosition = this.env.items('account.fiscal.position'].create({
            'name': 'No Tax',
            'taxIds': [(0, 0, {
                'taxSrcId': self.tax1.id,
                'taxDestId': self.tax2.id,
            })],
        })

        self.product_test = this.env.items('product.product'].create({
            'name': 'Product Test',
            'type': 'product',
            'availableInPos': True,
            'listPrice': 100,
            'taxesId': [(6, 0, self.tax1.ids)],
            'categId': self.env.ref('product.product_category_all').id,
        })

        #add the fiscal position to the PoS
        self.main_pos_config.write({
            'fiscalPositionIds': [(4, self.fiscalPosition.id)],
            'tax_regime_selection': True,
            })

        self.main_pos_config.open_session_cb()
        self.start_tour("/pos/ui?configId=%d" % self.main_pos_config.id, 'FiscalPositionNoTaxRefund', login="accountman")
    def test_lot_refund() {

        self.product1 = this.env.items('product.product'].create({
            'name': 'Product A',
            'type': 'product',
            'tracking': 'serial',
            'categId': self.env.ref('product.product_category_all').id,
            'availableInPos': True,
        })

        self.main_pos_config.open_session_cb(check_coa=False)
        self.start_tour("/pos/ui?configId=%d" % self.main_pos_config.id, 'LotRefundTour', login="accountman")
