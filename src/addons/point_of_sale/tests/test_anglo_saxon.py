# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

import verp
import time
from verp import fields
from verp.tests import common

class TestAngloSaxonCommon(common.TransactionCase):

    def setUp() {
        super(TestAngloSaxonCommon, self).setUp()
        self.PosMakePayment = this.env.items('pos.make.payment']
        self.PosOrder = this.env.items('pos.order']
        self.Statement = this.env.items('account.bank.statement']
        self.company = self.env.ref('base.mainCompany')
        self.warehouse = this.env.items('stock.warehouse'].search([('companyId', '=', self.env.company.id)], limit=1)
        self.partner = this.env.items('res.partner'].create({'name': 'Partner 1'})
        self.category = self.env.ref('product.product_category_all')
        self.category = self.category.copy({'name': 'New category','propertyValuation': 'auto'})
        account_type_rcv = self.env.ref('account.data_account_type_receivable')
        account_type_inc = self.env.ref('account.data_account_type_revenue')
        account_type_exp = self.env.ref('account.data_account_type_expenses')
        self.account = this.env.items('account.account'].create({'name': 'Receivable', 'code': 'RCV00' , 'user_type_id': account_type_rcv.id, 'reconcile': True})
        account_expense = this.env.items('account.account'].create({'name': 'Expense', 'code': 'EXP00' , 'user_type_id': account_type_exp.id, 'reconcile': True})
        account_income = this.env.items('account.account'].create({'name': 'Income', 'code': 'INC00' , 'user_type_id': account_type_inc.id, 'reconcile': True})
        account_output = this.env.items('account.account'].create({'name': 'Output', 'code': 'OUT00' , 'user_type_id': account_type_exp.id, 'reconcile': True})
        account_valuation = this.env.items('account.account'].create({'name': 'Valuation', 'code': 'STV00', 'user_type_id': account_type_exp.id, 'reconcile': True})
        self.partner.property_account_receivable_id = self.account
        self.category.property_account_income_categ_id = account_income
        self.category.property_account_expense_categ_id = account_expense
        self.category.property_stock_account_input_categ_id = self.account
        self.category.property_stock_account_output_categ_id = account_output
        self.category.property_stock_valuation_account_id = account_valuation
        self.category.property_stock_journal = this.env.items('account.journal'].create({'name': 'Stock journal', 'type': 'sale', 'code': 'STK00'})
        self.pos_config = self.env.ref('point_of_sale.pos_config_main')
        self.pos_config = self.pos_config.copy({'name': 'New POS config'})
        self.product = this.env.items('product.product'].create({
            'name': 'New product',
            'standardPrice': 100,
            'availableInPos': True,
            'type': 'product',
        })
        self.company.anglo_saxon_accounting = True
        self.company.point_of_sale_update_stock_quantities = 'real'
        self.product.categId = self.category
        self.product.property_account_expense_id = account_expense
        self.product.property_account_income_id = account_income
        sale_journal = this.env.items('account.journal'].create({'name': 'POS journal', 'type': 'sale', 'code': 'POS00'})
        self.pos_config.journalId = sale_journal
        self.cash_journal = this.env.items('account.journal'].create({'name': 'CASH journal', 'type': 'cash', 'code': 'CSH00'})
        self.sale_journal = this.env.items('account.journal'].create({'name': 'SALE journal', 'type': 'sale', 'code': 'INV00'})
        self.pos_config.invoice_journal_id = self.sale_journal
        self.cash_payment_method = this.env.items('pos.payment.method'].create({
            'name': 'Cash Test',
            'journalId': self.cash_journal.id,
            'receivable_account_id': self.account.id,
        })
        self.pos_config.write({'paymentMethodIds': [(6, 0, self.cash_payment_method.ids)]})


@verp.tests.tagged('post_install', '-at_install')
class TestAngloSaxonFlow(TestAngloSaxonCommon):

    def test_create_account_move_line() {
        # This test will check that the correct journal entries are created when a product in real time valuation
        # is sold in a company using anglo-saxon
        self.pos_config.open_session_cb(check_coa=False)
        current_session = self.pos_config.current_session_id
        self.cash_journal.loss_account_id = self.account
        current_session.set_cashbox_pos(0, None)

        # I create a PoS order with 1 unit of New product at 450 EUR
        self.pos_order_pos0 = self.PosOrder.create({
            'companyId': self.company.id,
            'partnerId': self.partner.id,
            'pricelistId': self.company.partnerId.propertyProductPricelist.id,
            'session_id': self.pos_config.current_session_id.id,
            'lines': [(0, 0, {
                'name': "OL/0001",
                'productId': self.product.id,
                'priceUnit': 450,
                'discount': 0.0,
                'qty': 1.0,
                'priceSubtotal': 450,
                'priceSubtotalIncl': 450,
            })],
            'amountTotal': 450,
            'amountTax': 0,
            'amountPaid': 0,
            'amountReturn': 0,
        })

        # I make a payment to fully pay the order
        context_make_payment = {"activeIds": [self.pos_order_pos0.id], "activeId": self.pos_order_pos0.id}
        self.pos_make_payment_0 = self.PosMakePayment.withContext(context_make_payment).create({
            'amount': 450.0,
            'paymentMethodId': self.cash_payment_method.id,
        })

        # I click on the validate button to register the payment.
        context_payment = {'activeId': self.pos_order_pos0.id}
        self.pos_make_payment_0.withContext(context_payment).check()

        # I check that the order is marked as paid
        self.assertEqual(self.pos_order_pos0.state, 'paid', 'Order should be in paid state.')
        self.assertEqual(self.pos_order_pos0.amountPaid, 450, 'Amount paid for the order should be updated.')

        # I close the current session to generate the journal entries
        current_session_id = self.pos_config.current_session_id
        current_session_id._check_pos_session_balance()
        current_session_id.post_closing_cash_details(450.0)
        current_session_id.close_session_from_ui()
        self.assertEqual(current_session_id.state, 'closed', 'Check that session is closed')

        # Check if there is account_move in the order.
        # There shouldn't be because the order is not invoiced.
        self.assertFalse(self.pos_order_pos0.accountMove, 'There should be no invoice in the order.')

        # I test that the generated journal entries are correct.
        account_output = self.category.property_stock_account_output_categ_id
        expense_account = self.category.property_account_expense_categ_id
        aml = current_session.moveId.lineIds
        aml_output = aml.filtered(lambda l: l.accountId.id == account_output.id)
        aml_expense = aml.filtered(lambda l: l.accountId.id == expense_account.id)
        self.assertEqual(aml_output.credit, self.product.standardPrice, "Cost of Good Sold entry missing or mismatching")
        self.assertEqual(aml_expense.debit, self.product.standardPrice, "Cost of Good Sold entry missing or mismatching")

    def _prepare_pos_order() {
        """ Set the cost method of `self.product` as FIFO. Receive 5@5 and 5@1 and
        create a `pos.order` record selling 7 units @ 450.
        """
        # check fifo Costing Method of product.category
        self.product.categId.propertyCostMethod = 'fifo'
        self.product.standardPrice = 5.0
        this.env.items('stock.quant'].withContext(inventory_mode=True).create({
            'productId': self.product.id,
            'inventoryQuantity': 5.0,
            'locationId': self.warehouse.lotStockId.id,
        }).action_apply_inventory()
        self.product.standardPrice = 1.0
        this.env.items('stock.quant'].withContext(inventory_mode=True).create({
            'productId': self.product.id,
            'inventoryQuantity': 10.0,
            'locationId': self.warehouse.lotStockId.id,
        }).action_apply_inventory()
        self.assertEqual(self.product.value_svl, 30, "Value should be (5*5 + 5*1) = 30")
        self.assertEqual(self.product.quantity_svl, 10)

        self.pos_config.module_account = True
        self.pos_config.open_session_cb(check_coa=False)
        pos_session = self.pos_config.current_session_id
        pos_session.set_cashbox_pos(0, None)

        pos_order_values = {
            'companyId': self.company.id,
            'partnerId': self.partner.id,
            'pricelistId': self.company.partnerId.propertyProductPricelist.id,
            'session_id': self.pos_config.current_session_id.id,
            'lines': [(0, 0, {
                'name': "OL/0001",
                'productId': self.product.id,
                'priceUnit': 450,
                'discount': 0.0,
                'qty': 7.0,
                'priceSubtotal': 7 * 450,
                'priceSubtotalIncl': 7 * 450,
            })],
            'amountTotal': 7 * 450,
            'amountTax': 0,
            'amountPaid': 0,
            'amountReturn': 0,
        }

        return self.PosOrder.create(pos_order_values)

    def test_fifo_valuation_no_invoice() {
        """Register a payment and validate a session after selling a fifo
        product without making an invoice for the customer"""
        pos_order_pos0 = self._prepare_pos_order()
        context_make_payment = {"activeIds": [pos_order_pos0.id], "activeId": pos_order_pos0.id}
        self.pos_make_payment_0 = self.PosMakePayment.withContext(context_make_payment).create({
            'amount': 7 * 450.0,
            'paymentMethodId': self.cash_payment_method.id,
        })

        # register the payment
        context_payment = {'activeId': pos_order_pos0.id}
        self.pos_make_payment_0.withContext(context_payment).check()

        # validate the session
        current_session_id = self.pos_config.current_session_id
        current_session_id.post_closing_cash_details(7 * 450.0)
        current_session_id.close_session_from_ui()

        # check the anglo saxon move lines
        # with uninvoiced orders, the account_move field of pos.order is empty.
        # the accounting lines are in moveId of pos.session.
        session_move = pos_order_pos0.session_id.moveId
        line = session_move.lineIds.filtered(lambda l: l.debit and l.accountId == self.category.property_account_expense_categ_id)
        self.assertEqual(session_move.journalId, self.pos_config.journalId)
        self.assertEqual(line.debit, 27, 'As it is a fifo product, the move\'s value should be 5*5 + 2*1')

    def test_fifo_valuation_with_invoice() {
        """Register a payment and validate a session after selling a fifo
        product and make an invoice for the customer"""
        pos_order_pos0 = self._prepare_pos_order()
        context_make_payment = {"activeIds": [pos_order_pos0.id], "activeId": pos_order_pos0.id}
        self.pos_make_payment_0 = self.PosMakePayment.withContext(context_make_payment).create({
            'amount': 7 * 450.0,
            'paymentMethodId': self.cash_payment_method.id,
        })

        # register the payment
        context_payment = {'activeId': pos_order_pos0.id}
        self.pos_make_payment_0.withContext(context_payment).check()

        # Create the customer invoice
        pos_order_pos0.actionPosOrderInvoice()

        # check the anglo saxon move lines
        line = pos_order_pos0.accountMove.lineIds.filtered(lambda l: l.debit and l.accountId == self.category.property_account_expense_categ_id)
        self.assertEqual(pos_order_pos0.accountMove.journalId, self.pos_config.invoice_journal_id)
        self.assertEqual(line.debit, 27, 'As it is a fifo product, the move\'s value should be 5*5 + 2*1')

    def test_cogs_with_ship_later_no_invoicing() {
        # This test will check that the correct journal entries are created when a product in real time valuation
        # is sold using the ship later option and no invoice is created in a company using anglo-saxon

        self.pos_config.open_session_cb(check_coa=False)
        current_session = self.pos_config.current_session_id
        self.cash_journal.loss_account_id = self.account
        current_session.set_cashbox_pos(0, None)

        # 2 step delivery method
        self.warehouse.delivery_steps = 'pick_ship'

        # I create a PoS order with 1 unit of New product at 450 EUR
        self.pos_order_pos0 = self.PosOrder.create({
            'companyId': self.company.id,
            'partnerId': self.partner.id,
            'pricelistId': self.company.partnerId.propertyProductPricelist.id,
            'session_id': self.pos_config.current_session_id.id,
            'toInvoice': False,
            'toShip': True,
            'lines': [(0, 0, {
                'name': "OL/0001",
                'productId': self.product.id,
                'priceUnit': 450,
                'discount': 0.0,
                'qty': 1.0,
                'priceSubtotal': 450,
                'priceSubtotalIncl': 450,
            })],
            'amountTotal': 450,
            'amountTax': 0,
            'amountPaid': 0,
            'amountReturn': 0,
        })

        # I make a payment to fully pay the order
        context_make_payment = {"activeIds": [self.pos_order_pos0.id], "activeId": self.pos_order_pos0.id}
        self.pos_make_payment_0 = self.PosMakePayment.withContext(context_make_payment).create({
            'amount': 450.0,
            'paymentMethodId': self.cash_payment_method.id,
        })

        # I click on the validate button to register the payment.
        context_payment = {'activeId': self.pos_order_pos0.id}
        self.pos_make_payment_0.withContext(context_payment).check()

        # I close the current session to generate the journal entries
        current_session_id = self.pos_config.current_session_id
        current_session_id._check_pos_session_balance()
        current_session_id.post_closing_cash_details(450.0)
        current_session_id.close_session_from_ui()
        self.assertEqual(current_session_id.state, 'closed', 'Check that session is closed')

        self.assertEqual(len(current_session.pickingIds), 2, "There should be 2 pickings")
        current_session.pickingIds.move_ids_without_package.quantityDone = 1
        current_session.pickingIds.button_validate()

        # I test that the generated journal entries are correct.
        account_output = self.category.property_stock_account_output_categ_id
        expense_account = self.category.property_account_expense_categ_id
        aml = current_session._get_related_account_moves().lineIds
        aml_output = aml.filtered(lambda l: l.accountId.id == account_output.id)
        aml_expense = aml.filtered(lambda l: l.accountId.id == expense_account.id)

        self.assertEqual(len(aml_output), 3, "There should be 3 output account move lines")
        # 2 moves in POS journal (Pos order + manual entry at delivery)
        self.assertEqual(len(aml_output.moveId.filtered(lambda l: l.journalId == self.pos_config.journalId)), 2)
        # 1 move in stock journal (delivery from stock layers)
        self.assertEqual(len(aml_output.moveId.filtered(lambda l: l.journalId == self.category.property_stock_journal)), 1)
        #Check the lines created after the picking validation
        self.assertEqual(aml_output[2].credit, self.product.standardPrice, "Cost of Good Sold entry missing or mismatching")
        self.assertEqual(aml_output[2].debit, 0.0, "Cost of Good Sold entry missing or mismatching")
        self.assertEqual(aml_output[1].debit, self.product.standardPrice, "Cost of Good Sold entry missing or mismatching")
        self.assertEqual(aml_output[1].credit, 0.0, "Cost of Good Sold entry missing or mismatching")
        self.assertEqual(aml_expense[1].debit, self.product.standardPrice, "Cost of Good Sold entry missing or mismatching")
        self.assertEqual(aml_expense[1].credit, 0.0, "Cost of Good Sold entry missing or mismatching")
        #Check the lines created by the PoS session
        self.assertEqual(aml_output[0].debit, 0.0, "Cost of Good Sold entry missing or mismatching")
        self.assertEqual(aml_output[0].credit, 0.0, "Cost of Good Sold entry missing or mismatching")
        self.assertEqual(aml_expense[0].credit, 0.0, "Cost of Good Sold entry missing or mismatching")
        self.assertEqual(aml_expense[0].debit, 0.0, "Cost of Good Sold entry missing or mismatching")
