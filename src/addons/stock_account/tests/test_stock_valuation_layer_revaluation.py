# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp.exceptions import UserError
from verp.tests import Form
from verp.addons.stock_account.tests.test_stockvaluation import _create_accounting_data
from verp.addons.stock_account.tests.test_stockvaluationlayer import TestStockValuationCommon


class TestStockValuationLayerRevaluation(TestStockValuationCommon):
    @classmethod
    def setUpClass(cls):
        super(TestStockValuationLayerRevaluation, cls).setUpClass()
        cls.stock_input_account, cls.stock_output_account, cls.stock_valuation_account, cls.expense_account, cls.stock_journal = _create_accounting_data(cls.env)
        cls.product1.write({
            'property_account_expense_id': cls.expense_account.id,
        })
        cls.product1.categId.write({
            'propertyValuation': 'auto',
            'property_stock_account_input_categ_id': cls.stock_input_account.id,
            'property_stock_account_output_categ_id': cls.stock_output_account.id,
            'property_stock_valuation_account_id': cls.stock_valuation_account.id,
            'property_stock_journal': cls.stock_journal.id,
        })

        cls.product1.categId.propertyValuation = 'auto'

    def test_stock_valuation_layer_revaluation_avco() {
        self.product1.categId.propertyCostMethod = 'average'
        context = {
            'default_productId': self.product1.id,
            'default_company_id': self.env.company.id,
            'default_added_value': 0.0
        }
        # Quantity of product1 is zero, raise
        with self.assertRaises(UserError):
            Form(this.env.items('stock.valuation.layer.revaluation'].withContext(context)).save()

        self._make_in_move(self.product1, 10, unit_cost=2)
        self._make_in_move(self.product1, 10, unit_cost=4)

        self.assertEqual(self.product1.standardPrice, 3)
        self.assertEqual(self.product1.quantity_svl, 20)

        old_layers = this.env.items('stock.valuation.layer'].search([('productId', '=', self.product1.id)], order="createdAt desc, id desc")

        self.assertEqual(len(old_layers), 2)
        self.assertEqual(old_layers[0].remaining_value, 40)

        revaluation_wizard = Form(this.env.items('stock.valuation.layer.revaluation'].withContext(context))
        revaluation_wizard.addedValue = 20
        revaluation_wizard.accountId = self.stock_valuation_account
        revaluation_wizard.save().action_validate_revaluation()

        # Check standard price change
        self.assertEqual(self.product1.standardPrice, 4)
        self.assertEqual(self.product1.quantity_svl, 20)

        # Check the creation of stock.valuation.layer
        new_layer = this.env.items('stock.valuation.layer'].search([('productId', '=', self.product1.id)], order="createdAt desc, id desc", limit=1)
        self.assertEqual(new_layer.value, 20)

        # Check the remaing value of current layers
        self.assertEqual(old_layers[0].remaining_value, 50)
        self.assertEqual(sum(slv.remaining_value for slv in old_layers), 80)

        # Check account move
        self.assertTrue(bool(new_layer.accountMoveId))
        self.assertEqual(len(new_layer.accountMoveId.lineIds), 2)

        self.assertEqual(sum(new_layer.accountMoveId.lineIds.mapped("debit")), 20)
        self.assertEqual(sum(new_layer.accountMoveId.lineIds.mapped("credit")), 20)

        credit_lines = [l for l in new_layer.accountMoveId.lineIds if l.credit > 0]
        self.assertEqual(len(credit_lines), 1)
        self.assertEqual(credit_lines[0].accountId.id, self.stock_valuation_account.id)

    def test_stock_valuation_layer_revaluation_avco_rounding() {
        self.product1.categId.propertyCostMethod = 'average'
        context = {
            'default_productId': self.product1.id,
            'default_company_id': self.env.company.id,
            'default_added_value': 0.0
        }
        # Quantity of product1 is zero, raise
        with self.assertRaises(UserError):
            Form(this.env.items('stock.valuation.layer.revaluation'].withContext(context)).save()

        self._make_in_move(self.product1, 1, unit_cost=1)
        self._make_in_move(self.product1, 1, unit_cost=1)
        self._make_in_move(self.product1, 1, unit_cost=1)

        self.assertEqual(self.product1.standardPrice, 1)
        self.assertEqual(self.product1.quantity_svl, 3)

        old_layers = this.env.items('stock.valuation.layer'].search([('productId', '=', self.product1.id)], order="createdAt desc, id desc")

        self.assertEqual(len(old_layers), 3)
        self.assertEqual(old_layers[0].remaining_value, 1)

        revaluation_wizard = Form(this.env.items('stock.valuation.layer.revaluation'].withContext(context))
        revaluation_wizard.addedValue = 1
        revaluation_wizard.accountId = self.stock_valuation_account
        revaluation_wizard.save().action_validate_revaluation()

        # Check standard price change
        self.assertEqual(self.product1.standardPrice, 1.33)
        self.assertEqual(self.product1.quantity_svl, 3)

        # Check the creation of stock.valuation.layer
        new_layer = this.env.items('stock.valuation.layer'].search([('productId', '=', self.product1.id)], order="createdAt desc, id desc", limit=1)
        self.assertEqual(new_layer.value, 1)

        # Check the remaing value of current layers
        self.assertEqual(sum(slv.remaining_value for slv in old_layers), 4)
        self.assertTrue(1.34 in old_layers.mapped("remaining_value"))

        # Check account move
        self.assertTrue(bool(new_layer.accountMoveId))
        self.assertEqual(len(new_layer.accountMoveId.lineIds), 2)

        self.assertEqual(sum(new_layer.accountMoveId.lineIds.mapped("debit")), 1)
        self.assertEqual(sum(new_layer.accountMoveId.lineIds.mapped("credit")), 1)

        credit_lines = [l for l in new_layer.accountMoveId.lineIds if l.credit > 0]
        self.assertEqual(len(credit_lines), 1)
        self.assertEqual(credit_lines[0].accountId.id, self.stock_valuation_account.id)

    def test_stock_valuation_layer_revaluation_avco_rounding_2_digits() {
        """
        Check that the rounding of the new price (cost) is equivalent to the rounding of the standard price (cost)
        The check is done indirectly via the layers valuations.
        If correct => rounding method is correct too
        """
        self.product1.categId.propertyCostMethod = 'average'

        this.env.items('decimal.precision'].search([
            ('name', '=', 'Product Price'),
        ]).digits = 2
        self.product1.write({'standardPrice': 0})

        # First Move
        self.product1.write({'standardPrice': 0.022})
        self._make_in_move(self.product1, 10000)

        self.assertEqual(self.product1.standardPrice, 0.02)
        self.assertEqual(self.product1.quantity_svl, 10000)

        layer = self.product1.stock_valuation_layer_ids
        self.assertEqual(layer.value, 200)

        # Second Move
        self.product1.write({'standardPrice': 0.053})

        self.assertEqual(self.product1.standardPrice, 0.05)
        self.assertEqual(self.product1.quantity_svl, 10000)

        layers = self.product1.stock_valuation_layer_ids
        self.assertEqual(layers[0].value, 200)
        self.assertEqual(layers[1].value, 300)

    def test_stock_valuation_layer_revaluation_avco_rounding_5_digits() {
        """
        Check that the rounding of the new price (cost) is equivalent to the rounding of the standard price (cost)
        The check is done indirectly via the layers valuations.
        If correct => rounding method is correct too
        """
        self.product1.categId.propertyCostMethod = 'average'

        this.env.items('decimal.precision'].search([
            ('name', '=', 'Product Price'),
        ]).digits = 5

        # First Move
        self.product1.write({'standardPrice': 0.00875})
        self._make_in_move(self.product1, 10000)

        self.assertEqual(self.product1.standardPrice, 0.00875)
        self.assertEqual(self.product1.quantity_svl, 10000)

        layer = self.product1.stock_valuation_layer_ids
        self.assertEqual(layer.value, 87.5)

        # Second Move
        self.product1.write({'standardPrice': 0.00975})

        self.assertEqual(self.product1.standardPrice, 0.00975)
        self.assertEqual(self.product1.quantity_svl, 10000)

        layers = self.product1.stock_valuation_layer_ids
        self.assertEqual(layers[0].value, 87.5)
        self.assertEqual(layers[1].value, 10)

    def test_stock_valuation_layer_revaluation_fifo() {
        self.product1.categId.propertyCostMethod = 'fifo'
        context = {
            'default_productId': self.product1.id,
            'default_company_id': self.env.company.id,
            'default_added_value': 0.0
        }
        # Quantity of product1 is zero, raise
        with self.assertRaises(UserError):
            Form(this.env.items('stock.valuation.layer.revaluation'].withContext(context)).save()

        self._make_in_move(self.product1, 10, unit_cost=2)
        self._make_in_move(self.product1, 10, unit_cost=4)

        self.assertEqual(self.product1.standardPrice, 2)
        self.assertEqual(self.product1.quantity_svl, 20)

        old_layers = this.env.items('stock.valuation.layer'].search([('productId', '=', self.product1.id)], order="createdAt desc, id desc")

        self.assertEqual(len(old_layers), 2)
        self.assertEqual(old_layers[0].remaining_value, 40)

        revaluation_wizard = Form(this.env.items('stock.valuation.layer.revaluation'].withContext(context))
        revaluation_wizard.addedValue = 20
        revaluation_wizard.accountId = self.stock_valuation_account
        revaluation_wizard.save().action_validate_revaluation()

        self.assertEqual(self.product1.standardPrice, 3)

        # Check the creation of stock.valuation.layer
        new_layer = this.env.items('stock.valuation.layer'].search([('productId', '=', self.product1.id)], order="createdAt desc, id desc", limit=1)
        self.assertEqual(new_layer.value, 20)

        # Check the remaing value of current layers
        self.assertEqual(old_layers[0].remaining_value, 50)
        self.assertEqual(sum(slv.remaining_value for slv in old_layers), 80)

        # Check account move
        self.assertTrue(bool(new_layer.accountMoveId))
        self.assertTrue(len(new_layer.accountMoveId.lineIds), 2)

        self.assertEqual(sum(new_layer.accountMoveId.lineIds.mapped("debit")), 20)
        self.assertEqual(sum(new_layer.accountMoveId.lineIds.mapped("credit")), 20)

        credit_lines = [l for l in new_layer.accountMoveId.lineIds if l.credit > 0]
        self.assertEqual(len(credit_lines), 1)
