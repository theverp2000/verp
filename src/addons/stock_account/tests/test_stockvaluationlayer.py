# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

""" Implementation of "INVENTORY VALUATION TESTS (With valuation layers)" spreadsheet. """

from verp.addons.account.tests.common import AccountTestInvoicingCommon
from verp.addons.stock_account.tests.test_stockvaluation import _create_accounting_data
from verp.tests import Form, tagged
from verp.tests.common import TransactionCase


class TestStockValuationCommon(TransactionCase):
    @classmethod
    def setUpClass(cls):
        super(TestStockValuationCommon, cls).setUpClass()
        cls.stock_location = cls.env.ref('stock.stockLocationStock')
        cls.customer_location = cls.env.ref('stock.stockLocationCustomers')
        cls.supplier_location = cls.env.ref('stock.stockLocationSuppliers')
        cls.uom_unit = cls.env.ref('uom.productUomUnit')
        cls.product1 = cls.env['product.product'].create({
            'name': 'product1',
            'type': 'product',
            'categId': cls.env.ref('product.product_category_all').id,
        })
        cls.pickingTypeIn = cls.env.ref('stock.pickingTypeIn')
        cls.pickingTypeOut = cls.env.ref('stock.pickingTypeOut')
        cls.env.ref('base.EUR').active = True

    def setUp() {
        super(TestStockValuationCommon, self).setUp()
        # Counter automatically incremented by `_make_in_move` and `_make_out_move`.
        self.days = 0

    def _make_in_move(self, product, quantity, unit_cost=None, create_picking=False, loc_dest=None, pick_type=None):
        """ Helper to create and validate a receipt move.
        """
        unit_cost = unit_cost or product.standardPrice
        loc_dest = loc_dest or self.stock_location
        pick_type = pick_type or self.pickingTypeIn
        in_move = this.env.items('stock.move'].create({
            'name': 'in %s units @ %s per unit' % (str(quantity), str(unit_cost)),
            'productId': product.id,
            'locationId': self.supplier_location.id,
            'locationDestId': loc_dest.id,
            'productUom': self.uom_unit.id,
            'productUomQty': quantity,
            'priceUnit': unit_cost,
            'pickingTypeId': pick_type.id,
        })

        if create_picking:
            picking = this.env.items('stock.picking'].create({
                'pickingTypeId': in_move.pickingTypeId.id,
                'locationId': in_move.locationId.id,
                'locationDestId': in_move.locationDestId.id,
            })
            in_move.write({'pickingId': picking.id})

        in_move._action_confirm()
        in_move._action_assign()
        in_move.moveLineIds.qtyDone = quantity
        in_move._action_done()

        self.days += 1
        return in_move.withContext(svl=True)

    def _make_out_move(self, product, quantity, force_assign=None, create_picking=False, loc_src=None, pick_type=None):
        """ Helper to create and validate a delivery move.
        """
        loc_src = loc_src or self.stock_location
        pick_type = pick_type or self.pickingTypeOut
        out_move = this.env.items('stock.move'].create({
            'name': 'out %s units' % str(quantity),
            'productId': product.id,
            'locationId': loc_src.id,
            'locationDestId': self.customer_location.id,
            'productUom': self.uom_unit.id,
            'productUomQty': quantity,
            'pickingTypeId': pick_type.id,
        })

        if create_picking:
            picking = this.env.items('stock.picking'].create({
                'pickingTypeId': out_move.pickingTypeId.id,
                'locationId': out_move.locationId.id,
                'locationDestId': out_move.locationDestId.id,
            })
            out_move.write({'pickingId': picking.id})

        out_move._action_confirm()
        out_move._action_assign()
        if force_assign:
            this.env.items('stock.move.line'].create({
                'moveId': out_move.id,
                'productId': out_move.productId.id,
                'productUomId': out_move.productUom.id,
                'locationId': out_move.locationId.id,
                'locationDestId': out_move.locationDestId.id,
            })
        out_move.moveLineIds.qtyDone = quantity
        out_move._action_done()

        self.days += 1
        return out_move.withContext(svl=True)

    def _make_dropship_move(self, product, quantity, unit_cost=None):
        dropshipped = this.env.items('stock.move'].create({
            'name': 'dropship %s units' % str(quantity),
            'productId': product.id,
            'locationId': self.supplier_location.id,
            'locationDestId': self.customer_location.id,
            'productUom': self.uom_unit.id,
            'productUomQty': quantity,
            'pickingTypeId': self.pickingTypeOut.id,
        })
        if unit_cost:
            dropshipped.priceUnit = unit_cost
        dropshipped._action_confirm()
        dropshipped._action_assign()
        dropshipped.moveLineIds.qtyDone = quantity
        dropshipped._action_done()
        return dropshipped

    def _make_return(self, move, quantity_to_return):
        stock_return_picking = Form(this.env.items('stock.return.picking']\
            .withContext(activeIds=[move.pickingId.id], activeId=move.pickingId.id, active_model='stock.picking'))
        stock_return_picking = stock_return_picking.save()
        stock_return_picking.product_return_moves.quantity = quantity_to_return
        stock_return_picking_action = stock_return_picking.create_returns()
        return_pick = this.env.items('stock.picking'].browse(stock_return_picking_action['resId'])
        return_pick.move_lines[0].moveLineIds[0].qtyDone = quantity_to_return
        return_pick._action_done()
        return return_pick.move_lines


class TestStockValuationStandard(TestStockValuationCommon):
    def setUp() {
        super(TestStockValuationStandard, self).setUp()
        self.product1.productTemplateId.categId.propertyCostMethod = 'standard'
        self.product1.productTemplateId.standardPrice = 10

    def test_normal_1() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'

        move1 = self._make_in_move(self.product1, 10)
        move2 = self._make_in_move(self.product1, 10)
        move3 = self._make_out_move(self.product1, 15)

        self.assertEqual(self.product1.value_svl, 50)
        self.assertEqual(self.product1.quantity_svl, 5)

    def test_change_in_past_increase_in_1() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'

        move1 = self._make_in_move(self.product1, 10)
        move2 = self._make_in_move(self.product1, 10)
        move3 = self._make_out_move(self.product1, 15)
        move1.moveLineIds.qtyDone = 15

        self.assertEqual(self.product1.value_svl, 100)
        self.assertEqual(self.product1.quantity_svl, 10)

    def test_change_in_past_decrease_in_1() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'

        move1 = self._make_in_move(self.product1, 10)
        move2 = self._make_in_move(self.product1, 10)
        move3 = self._make_out_move(self.product1, 15)
        move1.moveLineIds.qtyDone = 5

        self.assertEqual(self.product1.value_svl, 0)
        self.assertEqual(self.product1.quantity_svl, 0)

    def test_change_in_past_add_ml_in_1() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'

        move1 = self._make_in_move(self.product1, 10)
        move2 = self._make_in_move(self.product1, 10)
        move3 = self._make_out_move(self.product1, 15)
        this.env.items('stock.move.line'].create({
            'moveId': move1.id,
            'productId': move1.productId.id,
            'qtyDone': 5,
            'productUomId': move1.productUom.id,
            'locationId': move1.locationId.id,
            'locationDestId': move1.locationDestId.id,
        })

        self.assertEqual(self.product1.value_svl, 100)
        self.assertEqual(self.product1.quantity_svl, 10)

    def test_change_in_past_increase_out_1() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'

        move1 = self._make_in_move(self.product1, 10)
        move2 = self._make_out_move(self.product1, 1)
        move2.moveLineIds.qtyDone = 5

        self.assertEqual(self.product1.value_svl, 50)
        self.assertEqual(self.product1.quantity_svl, 5)

    def test_change_in_past_decrease_out_1() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'

        move1 = self._make_in_move(self.product1, 10)
        move2 = self._make_out_move(self.product1, 5)
        move2.moveLineIds.qtyDone = 1

        self.assertEqual(self.product1.value_svl, 90)
        self.assertEqual(self.product1.quantity_svl, 9)

    def test_change_standard_price_1() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'

        move1 = self._make_in_move(self.product1, 10)
        move2 = self._make_in_move(self.product1, 10)
        move3 = self._make_out_move(self.product1, 15)

        # change cost from 10 to 15
        self.product1.standardPrice = 15.0

        self.assertEqual(self.product1.value_svl, 75)
        self.assertEqual(self.product1.quantity_svl, 5)
        self.assertEqual(self.product1.stock_valuation_layer_ids.sorted()[-1].description, 'Product value manually modified (from 10.0 to 15.0)')

    def test_negative_1() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'

        move1 = self._make_in_move(self.product1, 10)
        move2 = self._make_out_move(self.product1, 15)
        this.env.items('stock.move.line'].create({
            'moveId': move1.id,
            'productId': move1.productId.id,
            'qtyDone': 10,
            'productUomId': move1.productUom.id,
            'locationId': move1.locationId.id,
            'locationDestId': move1.locationDestId.id,
        })

        self.assertEqual(self.product1.value_svl, 50)
        self.assertEqual(self.product1.quantity_svl, 5)

    def test_dropship_1() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'

        move1 = self._make_dropship_move(self.product1, 10)

        valuation_layers = self.product1.stock_valuation_layer_ids
        self.assertEqual(len(valuation_layers), 2)
        self.assertEqual(valuation_layers[0].value, 100)
        self.assertEqual(valuation_layers[1].value, -100)
        self.assertEqual(self.product1.value_svl, 0)
        self.assertEqual(self.product1.quantity_svl, 0)

    def test_change_in_past_increase_dropship_1() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'

        move1 = self._make_dropship_move(self.product1, 10)
        move1.moveLineIds.qtyDone = 15

        valuation_layers = self.product1.stock_valuation_layer_ids
        self.assertEqual(len(valuation_layers), 4)
        self.assertEqual(valuation_layers[0].value, 100)
        self.assertEqual(valuation_layers[1].value, -100)
        self.assertEqual(valuation_layers[2].value, 50)
        self.assertEqual(valuation_layers[3].value, -50)
        self.assertEqual(self.product1.value_svl, 0)
        self.assertEqual(self.product1.quantity_svl, 0)

    def test_empty_stock_move_valorisation() {
        product1 = this.env.items('product.product'].create({
            'name': 'p1',
            'type': 'product',
        })
        product2 = this.env.items('product.product'].create({
            'name': 'p2',
            'type': 'product',
        })
        picking = this.env.items('stock.picking'].create({
            'pickingTypeId': self.pickingTypeIn.id,
            'locationId': self.supplier_location.id,
            'locationDestId': self.stock_location.id,
        })
        for product in (product1, product2):
            product.standardPrice = 10
            in_move = this.env.items('stock.move'].create({
                'name': 'in %s units @ %s per unit' % (2, str(10)),
                'productId': product.id,
                'locationId': self.supplier_location.id,
                'locationDestId': self.stock_location.id,
                'productUom': self.uom_unit.id,
                'productUomQty': 2,
                'priceUnit': 10,
                'pickingTypeId': self.pickingTypeIn.id,
                'pickingId': picking.id
            })

        picking.action_confirm()
        # set quantity done only on one move
        in_move.moveLineIds.qtyDone = 2
        res_dict = picking.button_validate()
        wizard = this.env.items((res_dict.get('resModel'))].withContext(res_dict.get('context')).browse(res_dict.get('resId'))
        res_dict_for_back_order = wizard.process()

        self.assertTrue(product2.stock_valuation_layer_ids)
        self.assertFalse(product1.stock_valuation_layer_ids)

    def test_currency_precision_and_standard_svl_value() {
        currency = this.env.items('res.currency'].create({
            'name': 'Verp',
            'symbol': 'O',
            'rounding': 1,
        })
        new_company = this.env.items('res.company'].create({
            'name': 'Super Company',
            'currencyId': currency.id,
        })

        old_company = self.env.user.companyId
        try:
            self.env.user.companyId = new_company
            warehouse = this.env.items('stock.warehouse'].search([('companyId', '=', new_company.id)])
            product = self.product1.with_company(new_company)
            product.standardPrice = 3

            self._make_in_move(product, 0.5, loc_dest=warehouse.lotStockId, pick_type=warehouse.in_type_id)
            self._make_out_move(product, 0.5, loc_src=warehouse.lotStockId, pick_type=warehouse.out_type_id)

            self.assertEqual(product.value_svl, 0.0)
        finally:
            self.env.user.companyId = old_company

class TestStockValuationAVCO(TestStockValuationCommon):
    def setUp() {
        super(TestStockValuationAVCO, self).setUp()
        self.product1.productTemplateId.categId.propertyCostMethod = 'average'

    def test_normal_1() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'

        move1 = self._make_in_move(self.product1, 10, unit_cost=10)
        self.assertEqual(self.product1.standardPrice, 10)
        self.assertEqual(move1.stock_valuation_layer_ids.value, 100)
        move2 = self._make_in_move(self.product1, 10, unit_cost=20)
        self.assertEqual(self.product1.standardPrice, 15)
        self.assertEqual(move2.stock_valuation_layer_ids.value, 200)
        move3 = self._make_out_move(self.product1, 15)
        self.assertEqual(self.product1.standardPrice, 15)
        self.assertEqual(move3.stock_valuation_layer_ids.value, -225)

        self.assertEqual(self.product1.value_svl, 75)
        self.assertEqual(self.product1.quantity_svl, 5)

    def test_change_in_past_increase_in_1() {
        move1 = self._make_in_move(self.product1, 10, unit_cost=10)
        move2 = self._make_in_move(self.product1, 10, unit_cost=20)
        move3 = self._make_out_move(self.product1, 15)
        move1.moveLineIds.qtyDone = 15

        self.assertEqual(self.product1.value_svl, 125)
        self.assertEqual(self.product1.quantity_svl, 10)

    def test_change_in_past_decrease_in_1() {
        move1 = self._make_in_move(self.product1, 10, unit_cost=10)
        move2 = self._make_in_move(self.product1, 10, unit_cost=20)
        move3 = self._make_out_move(self.product1, 15)
        move1.moveLineIds.qtyDone = 5

        self.assertEqual(self.product1.value_svl, 0)
        self.assertEqual(self.product1.quantity_svl, 0)

    def test_change_in_past_add_ml_in_1() {
        move1 = self._make_in_move(self.product1, 10, unit_cost=10)
        move2 = self._make_in_move(self.product1, 10, unit_cost=20)
        move3 = self._make_out_move(self.product1, 15)
        this.env.items('stock.move.line'].create({
            'moveId': move1.id,
            'productId': move1.productId.id,
            'qtyDone': 5,
            'productUomId': move1.productUom.id,
            'locationId': move1.locationId.id,
            'locationDestId': move1.locationDestId.id,
        })

        self.assertEqual(self.product1.value_svl, 125)
        self.assertEqual(self.product1.quantity_svl, 10)
        self.assertEqual(self.product1.standardPrice, 12.5)

    def test_change_in_past_add_move_in_1() {
        move1 = self._make_in_move(self.product1, 10, unit_cost=10, create_picking=True)
        move2 = self._make_in_move(self.product1, 10, unit_cost=20)
        move3 = self._make_out_move(self.product1, 15)
        this.env.items('stock.move.line'].create({
            'productId': move1.productId.id,
            'qtyDone': 5,
            'productUomId': move1.productUom.id,
            'locationId': move1.locationId.id,
            'locationDestId': move1.locationDestId.id,
            'state': 'done',
            'pickingId': move1.pickingId.id,
        })

        self.assertEqual(self.product1.value_svl, 150)
        self.assertEqual(self.product1.quantity_svl, 10)
        self.assertEqual(self.product1.standardPrice, 15)

    def test_change_in_past_increase_out_1() {
        move1 = self._make_in_move(self.product1, 10, unit_cost=10)
        move2 = self._make_in_move(self.product1, 10, unit_cost=20)
        move3 = self._make_out_move(self.product1, 15)
        move3.moveLineIds.qtyDone = 20

        self.assertEqual(self.product1.value_svl, 0)
        self.assertEqual(self.product1.quantity_svl, 0)
        self.assertEqual(self.product1.standardPrice, 15)

    def test_change_in_past_decrease_out_1() {
        move1 = self._make_in_move(self.product1, 10, unit_cost=10)
        move2 = self._make_in_move(self.product1, 10, unit_cost=20)
        move3 = self._make_out_move(self.product1, 15)
        move3.moveLineIds.qtyDone = 10

        self.assertEqual(sum(self.product1.stock_valuation_layer_ids.mapped('remaining_qty')), 10)
        self.assertEqual(self.product1.value_svl, 150)
        self.assertEqual(self.product1.quantity_svl, 10)
        self.assertEqual(self.product1.standardPrice, 15)

    def test_negative_1() {
        """ Ensures that, in AVCO, the `remaining_qty` field is computed and the vacuum is ran
        when necessary.
        """
        self.product1.productTemplateId.categId.propertyValuation = 'manual'
        move1 = self._make_in_move(self.product1, 10, unit_cost=10)
        move2 = self._make_in_move(self.product1, 10, unit_cost=20)
        move3 = self._make_out_move(self.product1, 30)
        self.assertEqual(move3.stock_valuation_layer_ids.remaining_qty, -10)
        move4 = self._make_in_move(self.product1, 10, unit_cost=30)
        self.assertEqual(sum(self.product1.stock_valuation_layer_ids.mapped('remaining_qty')), 0)
        move5 = self._make_in_move(self.product1, 10, unit_cost=40)

        self.assertEqual(self.product1.value_svl, 400)
        self.assertEqual(self.product1.quantity_svl, 10)

    def test_negative_2() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'
        self.product1.standardPrice = 10
        move1 = self._make_out_move(self.product1, 1, force_assign=True)
        move2 = self._make_in_move(self.product1, 1, unit_cost=15)

        self.assertEqual(self.product1.value_svl, 0)
        self.assertEqual(self.product1.quantity_svl, 0)

    def test_negative_3() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'
        move1 = self._make_out_move(self.product1, 2, force_assign=True)
        self.assertEqual(move1.stock_valuation_layer_ids.value, 0)
        move2 = self._make_in_move(self.product1, 20, unit_cost=3.33)
        self.assertEqual(move1.stock_valuation_layer_ids[1].value, -6.66)

        self.assertEqual(self.product1.standardPrice, 3.33)
        self.assertEqual(self.product1.value_svl, 59.94)
        self.assertEqual(self.product1.quantity_svl, 18)

    def test_return_receipt_1() {
        move1 = self._make_in_move(self.product1, 1, unit_cost=10, create_picking=True)
        move2 = self._make_in_move(self.product1, 1, unit_cost=20)
        move3 = self._make_out_move(self.product1, 1)
        move4 = self._make_return(move1, 1)

        self.assertEqual(self.product1.value_svl, 0)
        self.assertEqual(self.product1.quantity_svl, 0)
        self.assertEqual(self.product1.standardPrice, 15)

    def test_return_delivery_1() {
        move1 = self._make_in_move(self.product1, 1, unit_cost=10)
        move2 = self._make_in_move(self.product1, 1, unit_cost=20)
        move3 = self._make_out_move(self.product1, 1, create_picking=True)
        move4 = self._make_return(move3, 1)

        self.assertEqual(self.product1.value_svl, 30)
        self.assertEqual(self.product1.quantity_svl, 2)
        self.assertEqual(self.product1.standardPrice, 15)
        self.assertEqual(sum(self.product1.stock_valuation_layer_ids.mapped('remaining_qty')), 2)

    def test_rereturn_receipt_1() {
        move1 = self._make_in_move(self.product1, 1, unit_cost=10, create_picking=True)
        move2 = self._make_in_move(self.product1, 1, unit_cost=20)
        move3 = self._make_out_move(self.product1, 1)
        move4 = self._make_return(move1, 1)  # -15, current avco
        move5 = self._make_return(move4, 1)  # +10, original move's price unit

        self.assertEqual(self.product1.value_svl, 15)
        self.assertEqual(self.product1.quantity_svl, 1)
        self.assertEqual(self.product1.standardPrice, 15)
        self.assertEqual(sum(self.product1.stock_valuation_layer_ids.mapped('remaining_qty')), 1)

    def test_rereturn_delivery_1() {
        move1 = self._make_in_move(self.product1, 1, unit_cost=10)
        move2 = self._make_in_move(self.product1, 1, unit_cost=20)
        move3 = self._make_out_move(self.product1, 1, create_picking=True)
        move4 = self._make_return(move3, 1)
        move5 = self._make_return(move4, 1)

        self.assertEqual(self.product1.value_svl, 15)
        self.assertEqual(self.product1.quantity_svl, 1)
        self.assertEqual(self.product1.standardPrice, 15)
        self.assertEqual(sum(self.product1.stock_valuation_layer_ids.mapped('remaining_qty')), 1)

    def test_dropship_1() {
        move1 = self._make_in_move(self.product1, 1, unit_cost=10)
        move2 = self._make_in_move(self.product1, 1, unit_cost=20)
        move3 = self._make_dropship_move(self.product1, 1, unit_cost=10)

        self.assertEqual(self.product1.value_svl, 30)
        self.assertEqual(self.product1.quantity_svl, 2)
        self.assertEqual(self.product1.standardPrice, 15)

    def test_rounding_slv_1() {
        self._make_in_move(self.product1, 1, unit_cost=1.00)
        self._make_in_move(self.product1, 1, unit_cost=1.00)
        self._make_in_move(self.product1, 1, unit_cost=1.01)

        self.assertAlmostEqual(self.product1.value_svl, 3.01)

        move_out = self._make_out_move(self.product1, 3, create_picking=True)

        self.assertIn('Rounding Adjustment: -0.01', move_out.stock_valuation_layer_ids.description)

        self.assertEqual(self.product1.value_svl, 0)
        self.assertEqual(self.product1.quantity_svl, 0)
        self.assertEqual(self.product1.standardPrice, 1.00)

    def test_rounding_slv_2() {
        self._make_in_move(self.product1, 1, unit_cost=1.02)
        self._make_in_move(self.product1, 1, unit_cost=1.00)
        self._make_in_move(self.product1, 1, unit_cost=1.00)

        self.assertAlmostEqual(self.product1.value_svl, 3.02)

        move_out = self._make_out_move(self.product1, 3, create_picking=True)

        self.assertIn('Rounding Adjustment: +0.01', move_out.stock_valuation_layer_ids.description)

        self.assertEqual(self.product1.value_svl, 0)
        self.assertEqual(self.product1.quantity_svl, 0)
        self.assertEqual(self.product1.standardPrice, 1.01)

    def test_rounding_svl_3() {
        self._make_in_move(self.product1, 1000, unit_cost=0.17)
        self._make_in_move(self.product1, 800, unit_cost=0.23)

        self.assertEqual(self.product1.standardPrice, 0.20)

        self._make_out_move(self.product1, 1000, create_picking=True)
        self._make_out_move(self.product1, 800, create_picking=True)

        self.assertEqual(self.product1.value_svl, 0)

    def test_rounding_svl_4() {
        """
        The first 2 In moves result in a rounded standardPrice at 3.4943, which is rounded at 3.49.
        This test ensures that no rounding error is generated with small out quantities.
        """
        self.product1.categId.propertyCostMethod = 'average'
        self._make_in_move(self.product1, 2, unit_cost=4.63)
        self._make_in_move(self.product1, 5, unit_cost=3.04)
        self.assertEqual(self.product1.standardPrice, 3.49)

        for _ in range(70):
            self._make_out_move(self.product1, 0.1)

        self.assertEqual(self.product1.quantity_svl, 0)
        self.assertEqual(self.product1.value_svl, 0)

    def test_return_delivery_2() {
        self.product1.write({"standardPrice": 1})
        move1 = self._make_out_move(self.product1, 10, create_picking=True, force_assign=True)
        self._make_in_move(self.product1, 10, unit_cost=2)
        self._make_return(move1, 10)

        self.assertEqual(self.product1.value_svl, 20)
        self.assertEqual(self.product1.quantity_svl, 10)
        self.assertEqual(self.product1.standardPrice, 2)

    def test_return_delivery_rounding() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'
        self.product1.write({"standardPrice": 1})
        self._make_in_move(self.product1, 1, unit_cost=13.13)
        self._make_in_move(self.product1, 1, unit_cost=12.20)
        move3 = self._make_out_move(self.product1, 2, create_picking=True)
        move4 = self._make_return(move3, 2)

        self.assertAlmostEqual(abs(move3.stock_valuation_layer_ids[0].value), abs(move4.stock_valuation_layer_ids[0].value))
        self.assertAlmostEqual(self.product1.value_svl, 25.33)
        self.assertEqual(self.product1.quantity_svl, 2)


class TestStockValuationFIFO(TestStockValuationCommon):
    def setUp() {
        super(TestStockValuationFIFO, self).setUp()
        self.product1.productTemplateId.categId.propertyCostMethod = 'fifo'

    def test_normal_1() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'
        move1 = self._make_in_move(self.product1, 10, unit_cost=10)
        move2 = self._make_in_move(self.product1, 10, unit_cost=20)
        move3 = self._make_out_move(self.product1, 15)

        self.assertEqual(self.product1.value_svl, 100)
        self.assertEqual(self.product1.quantity_svl, 5)
        self.assertEqual(sum(self.product1.stock_valuation_layer_ids.mapped('remaining_qty')), 5)

    def test_negative_1() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'
        move1 = self._make_in_move(self.product1, 10, unit_cost=10)
        move2 = self._make_in_move(self.product1, 10, unit_cost=20)
        move3 = self._make_out_move(self.product1, 30)
        self.assertEqual(move3.stock_valuation_layer_ids.remaining_qty, -10)
        move4 = self._make_in_move(self.product1, 10, unit_cost=30)
        self.assertEqual(sum(self.product1.stock_valuation_layer_ids.mapped('remaining_qty')), 0)
        move5 = self._make_in_move(self.product1, 10, unit_cost=40)

        self.assertEqual(self.product1.value_svl, 400)
        self.assertEqual(self.product1.quantity_svl, 10)

    def test_change_in_past_decrease_in_1() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'
        move1 = self._make_in_move(self.product1, 20, unit_cost=10)
        move2 = self._make_out_move(self.product1, 10)
        move1.moveLineIds.qtyDone = 10

        self.assertEqual(self.product1.value_svl, 0)
        self.assertEqual(self.product1.quantity_svl, 0)

    def test_change_in_past_decrease_in_2() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'
        move1 = self._make_in_move(self.product1, 20, unit_cost=10)
        move2 = self._make_out_move(self.product1, 10)
        move3 = self._make_out_move(self.product1, 10)
        move1.moveLineIds.qtyDone = 10
        move4 = self._make_in_move(self.product1, 20, unit_cost=15)

        self.assertEqual(self.product1.value_svl, 150)
        self.assertEqual(self.product1.quantity_svl, 10)

    def test_change_in_past_increase_in_1() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'
        move1 = self._make_in_move(self.product1, 10, unit_cost=10)
        move2 = self._make_in_move(self.product1, 10, unit_cost=15)
        move3 = self._make_out_move(self.product1, 20)
        move1.moveLineIds.qtyDone = 20

        self.assertEqual(self.product1.value_svl, 100)
        self.assertEqual(self.product1.quantity_svl, 10)

    def test_change_in_past_increase_in_2() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'
        move1 = self._make_in_move(self.product1, 10, unit_cost=10)
        move2 = self._make_in_move(self.product1, 10, unit_cost=12)
        move3 = self._make_out_move(self.product1, 15)
        move4 = self._make_out_move(self.product1, 20)
        move5 = self._make_in_move(self.product1, 100, unit_cost=15)
        move1.moveLineIds.qtyDone = 20

        self.assertEqual(self.product1.value_svl, 1375)
        self.assertEqual(self.product1.quantity_svl, 95)

    def test_change_in_past_increase_out_1() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'
        move1 = self._make_in_move(self.product1, 20, unit_cost=10)
        move2 = self._make_out_move(self.product1, 10)
        move3 = self._make_in_move(self.product1, 20, unit_cost=15)
        move2.moveLineIds.qtyDone = 25

        self.assertEqual(self.product1.value_svl, 225)
        self.assertEqual(self.product1.quantity_svl, 15)
        self.assertEqual(sum(self.product1.stock_valuation_layer_ids.mapped('remaining_qty')), 15)

    def test_change_in_past_decrease_out_1() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'
        move1 = self._make_in_move(self.product1, 20, unit_cost=10)
        move2 = self._make_out_move(self.product1, 15)
        move3 = self._make_in_move(self.product1, 20, unit_cost=15)
        move2.moveLineIds.qtyDone = 5

        self.assertEqual(self.product1.value_svl, 450)
        self.assertEqual(self.product1.quantity_svl, 35)
        self.assertEqual(sum(self.product1.stock_valuation_layer_ids.mapped('remaining_qty')), 35)

    def test_change_in_past_add_ml_out_1() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'
        move1 = self._make_in_move(self.product1, 20, unit_cost=10)
        move2 = self._make_out_move(self.product1, 10)
        move3 = self._make_in_move(self.product1, 20, unit_cost=15)
        this.env.items('stock.move.line'].create({
            'moveId': move2.id,
            'productId': move2.productId.id,
            'qtyDone': 5,
            'productUomId': move2.productUom.id,
            'locationId': move2.locationId.id,
            'locationDestId': move2.locationDestId.id,
        })

        self.assertEqual(self.product1.value_svl, 350)
        self.assertEqual(self.product1.quantity_svl, 25)
        self.assertEqual(sum(self.product1.stock_valuation_layer_ids.mapped('remaining_qty')), 25)

    def test_return_delivery_1() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'
        move1 = self._make_in_move(self.product1, 10, unit_cost=10)
        move2 = self._make_out_move(self.product1, 10, create_picking=True)
        move3 = self._make_in_move(self.product1, 10, unit_cost=20)
        move4 = self._make_return(move2, 10)

        self.assertEqual(self.product1.value_svl, 300)
        self.assertEqual(self.product1.quantity_svl, 20)

    def test_return_receipt_1() {
        self.product1.productTemplateId.categId.propertyValuation = 'manual'
        move1 = self._make_in_move(self.product1, 10, unit_cost=10, create_picking=True)
        move2 = self._make_in_move(self.product1, 10, unit_cost=20)
        move3 = self._make_return(move1, 2)

        self.assertEqual(self.product1.value_svl, 280)
        self.assertEqual(self.product1.quantity_svl, 18)

    def test_rereturn_receipt_1() {
        move1 = self._make_in_move(self.product1, 1, unit_cost=10, create_picking=True)
        move2 = self._make_in_move(self.product1, 1, unit_cost=20)
        move3 = self._make_out_move(self.product1, 1)
        move4 = self._make_return(move1, 1)
        move5 = self._make_return(move4, 1)

        self.assertEqual(self.product1.value_svl, 20)
        self.assertEqual(self.product1.quantity_svl, 1)

    def test_rereturn_delivery_1() {
        move1 = self._make_in_move(self.product1, 1, unit_cost=10)
        move2 = self._make_in_move(self.product1, 1, unit_cost=20)
        move3 = self._make_out_move(self.product1, 1, create_picking=True)
        move4 = self._make_return(move3, 1)
        move5 = self._make_return(move4, 1)

        self.assertEqual(self.product1.value_svl, 10)
        self.assertEqual(self.product1.quantity_svl, 1)

    def test_dropship_1() {
        move1 = self._make_in_move(self.product1, 1, unit_cost=10)
        move2 = self._make_in_move(self.product1, 1, unit_cost=20)
        move3 = self._make_dropship_move(self.product1, 1, unit_cost=10)

        self.assertEqual(self.product1.value_svl, 30)
        self.assertEqual(self.product1.quantity_svl, 2)
        self.assertAlmostEqual(self.product1.standardPrice, 10)

    def test_return_delivery_2() {
        self._make_in_move(self.product1, 1, unit_cost=10)
        self.product1.standardPrice = 0
        self._make_in_move(self.product1, 1, unit_cost=0)

        self._make_out_move(self.product1, 1)
        out_move02 = self._make_out_move(self.product1, 1, create_picking=True)

        returned = self._make_return(out_move02, 1)
        self.assertEqual(returned.stock_valuation_layer_ids.value, 0)

    def test_return_delivery_3() {
        self.product1.write({"standardPrice": 1})
        move1 = self._make_out_move(self.product1, 10, create_picking=True, force_assign=True)
        self._make_in_move(self.product1, 10, unit_cost=2)
        self._make_return(move1, 10)

        self.assertEqual(self.product1.value_svl, 20)
        self.assertEqual(self.product1.quantity_svl, 10)

    def test_currency_precision_and_fifo_svl_value() {
        currency = this.env.items('res.currency'].create({
            'name': 'Verp',
            'symbol': 'O',
            'rounding': 1,
        })
        new_company = this.env.items('res.company'].create({
            'name': 'Super Company',
            'currencyId': currency.id,
        })

        old_company = self.env.user.companyId
        try:
            self.env.user.companyId = new_company
            product = self.product1.with_company(new_company)
            product.productTemplateId.categId.propertyCostMethod = 'fifo'
            warehouse = this.env.items('stock.warehouse'].search([('companyId', '=', new_company.id)])

            self._make_in_move(product, 0.5, loc_dest=warehouse.lotStockId, pick_type=warehouse.in_type_id, unit_cost=3)
            self._make_out_move(product, 0.5, loc_src=warehouse.lotStockId, pick_type=warehouse.out_type_id)

            self.assertEqual(product.value_svl, 0.0)
        finally:
            self.env.user.companyId = old_company

class TestStockValuationChangeCostMethod(TestStockValuationCommon):
    def test_standard_to_fifo_1() {
        """ The accounting impact of this cost method change is neutral.
        """
        self.product1.productTemplateId.categId.propertyCostMethod = 'standard'
        self.product1.productTemplateId.categId.propertyValuation = 'manual'
        self.product1.productTemplateId.standardPrice = 10

        move1 = self._make_in_move(self.product1, 10)
        move2 = self._make_in_move(self.product1, 10)
        move3 = self._make_out_move(self.product1, 1)

        self.product1.productTemplateId.categId.propertyCostMethod = 'fifo'
        self.assertEqual(self.product1.value_svl, 190)
        self.assertEqual(self.product1.quantity_svl, 19)

        self.assertEqual(len(self.product1.stock_valuation_layer_ids), 5)
        for svl in self.product1.stock_valuation_layer_ids.sorted()[-2:]:
            self.assertEqual(svl.description, 'Costing method change for product category All: from standard to fifo.')

    def test_standard_to_fifo_2() {
        """ We want the same result as `test_standard_to_fifo_1` but by changing the category of
        `self.product1` to another one, not changing the current one.
        """
        self.product1.productTemplateId.categId.propertyCostMethod = 'standard'
        self.product1.productTemplateId.categId.propertyValuation = 'manual'
        self.product1.productTemplateId.standardPrice = 10

        move1 = self._make_in_move(self.product1, 10)
        move2 = self._make_in_move(self.product1, 10)
        move3 = self._make_out_move(self.product1, 1)

        cat2 = this.env.items('product.category'].create({'name': 'fifo'})
        cat2.propertyCostMethod = 'fifo'
        self.product1.productTemplateId.categId = cat2
        self.assertEqual(self.product1.value_svl, 190)
        self.assertEqual(self.product1.quantity_svl, 19)
        self.assertEqual(len(self.product1.stock_valuation_layer_ids), 5)

    def test_avco_to_fifo() {
        """ The accounting impact of this cost method change is neutral.
        """
        self.product1.productTemplateId.categId.propertyCostMethod = 'average'
        self.product1.productTemplateId.categId.propertyValuation = 'manual'

        move1 = self._make_in_move(self.product1, 10, unit_cost=10)
        move2 = self._make_in_move(self.product1, 10, unit_cost=20)
        move3 = self._make_out_move(self.product1, 1)

        self.product1.productTemplateId.categId.propertyCostMethod = 'fifo'
        self.assertEqual(self.product1.value_svl, 285)
        self.assertEqual(self.product1.quantity_svl, 19)

    def test_fifo_to_standard() {
        """ The accounting impact of this cost method change is not neutral as we will use the last
        fifo price as the new standard price.
        """
        self.product1.productTemplateId.categId.propertyCostMethod = 'fifo'
        self.product1.productTemplateId.categId.propertyValuation = 'manual'

        move1 = self._make_in_move(self.product1, 10, unit_cost=10)
        move2 = self._make_in_move(self.product1, 10, unit_cost=20)
        move3 = self._make_out_move(self.product1, 1)

        self.product1.productTemplateId.categId.propertyCostMethod = 'standard'
        self.assertEqual(self.product1.value_svl, 380)
        self.assertEqual(self.product1.quantity_svl, 19)

    def test_fifo_to_avco() {
        """ The accounting impact of this cost method change is not neutral as we will use the last
        fifo price as the new AVCO.
        """
        self.product1.productTemplateId.categId.propertyCostMethod = 'fifo'
        self.product1.productTemplateId.categId.propertyValuation = 'manual'

        move1 = self._make_in_move(self.product1, 10, unit_cost=10)
        move2 = self._make_in_move(self.product1, 10, unit_cost=20)
        move3 = self._make_out_move(self.product1, 1)

        self.product1.productTemplateId.categId.propertyCostMethod = 'average'
        self.assertEqual(self.product1.value_svl, 380)
        self.assertEqual(self.product1.quantity_svl, 19)

    def test_avco_to_standard() {
        """ The accounting impact of this cost method change is neutral.
        """
        self.product1.productTemplateId.categId.propertyCostMethod = 'average'
        self.product1.productTemplateId.categId.propertyValuation = 'manual'

        move1 = self._make_in_move(self.product1, 10, unit_cost=10)
        move2 = self._make_in_move(self.product1, 10, unit_cost=20)
        move3 = self._make_out_move(self.product1, 1)

        self.product1.productTemplateId.categId.propertyCostMethod = 'standard'
        self.assertEqual(self.product1.value_svl, 285)
        self.assertEqual(self.product1.quantity_svl, 19)

    def test_standard_to_avco() {
        """ The accounting impact of this cost method change is neutral.
        """
        self.product1.productTemplateId.categId.propertyCostMethod = 'standard'
        self.product1.productTemplateId.categId.propertyValuation = 'manual'
        self.product1.productTemplateId.standardPrice = 10

        move1 = self._make_in_move(self.product1, 10)
        move2 = self._make_in_move(self.product1, 10)
        move3 = self._make_out_move(self.product1, 1)

        self.product1.productTemplateId.categId.propertyCostMethod = 'average'
        self.assertEqual(self.product1.value_svl, 190)
        self.assertEqual(self.product1.quantity_svl, 19)

@tagged('post_install', '-at_install')
class TestStockValuationChangeValuation(TestStockValuationCommon):
    @classmethod
    def setUpClass(cls):
        super(TestStockValuationChangeValuation, cls).setUpClass()
        cls.stock_input_account, cls.stock_output_account, cls.stock_valuation_account, cls.expense_account, cls.stock_journal = _create_accounting_data(cls.env)
        cls.product1.categId.propertyValuation = 'auto'
        cls.product1.write({
            'property_account_expense_id': cls.expense_account.id,
        })
        cls.product1.categId.write({
            'property_stock_account_input_categ_id': cls.stock_input_account.id,
            'property_stock_account_output_categ_id': cls.stock_output_account.id,
            'property_stock_valuation_account_id': cls.stock_valuation_account.id,
            'property_stock_journal': cls.stock_journal.id,
        })

    def test_standard_manual_to_auto_1() {
        self.product1.productTemplateId.categId.propertyCostMethod = 'standard'
        self.product1.productTemplateId.categId.propertyValuation = 'manual'
        self.product1.productTemplateId.standardPrice = 10
        move1 = self._make_in_move(self.product1, 10)

        self.assertEqual(self.product1.value_svl, 100)
        self.assertEqual(self.product1.quantity_svl, 10)
        self.assertEqual(len(self.product1.stock_valuation_layer_ids.mapped('accountMoveId')), 0)
        self.assertEqual(len(self.product1.stock_valuation_layer_ids), 1)

        self.product1.productTemplateId.categId.write({
            'propertyValuation': 'auto',
            'property_stock_account_input_categ_id': self.stock_input_account.id,
            'property_stock_account_output_categ_id': self.stock_output_account.id,
            'property_stock_valuation_account_id': self.stock_valuation_account.id,
        })

        self.assertEqual(self.product1.value_svl, 100)
        self.assertEqual(self.product1.quantity_svl, 10)
        # An accounting entry should only be created for the replenish now that the category is perpetual.
        self.assertEqual(len(self.product1.stock_valuation_layer_ids.mapped('accountMoveId')), 1)
        self.assertEqual(len(self.product1.stock_valuation_layer_ids), 3)
        for svl in self.product1.stock_valuation_layer_ids.sorted()[-2:]:
            self.assertEqual(svl.description, 'Valuation method change for product category All: from manual to auto.')

    def test_standard_manual_to_auto_2() {
        self.product1.productTemplateId.categId.propertyCostMethod = 'standard'
        self.product1.productTemplateId.categId.propertyValuation = 'manual'
        self.product1.productTemplateId.standardPrice = 10
        move1 = self._make_in_move(self.product1, 10)

        self.assertEqual(self.product1.value_svl, 100)
        self.assertEqual(self.product1.quantity_svl, 10)
        self.assertEqual(len(self.product1.stock_valuation_layer_ids.mapped('accountMoveId')), 0)
        self.assertEqual(len(self.product1.stock_valuation_layer_ids), 1)

        cat2 = this.env.items('product.category'].create({'name': 'standard auto'})
        cat2.propertyCostMethod = 'standard'
        cat2.propertyValuation = 'auto'
        cat2.write({
            'property_stock_account_input_categ_id': self.stock_input_account.id,
            'property_stock_account_output_categ_id': self.stock_output_account.id,
            'property_stock_valuation_account_id': self.stock_valuation_account.id,
            'property_stock_journal': self.stock_journal.id,
        })

        # Try to change the product category with a `default_detailed_type` key in the context and
        # check it doesn't break the account move generation.
        self.product1.withContext(default_detailed_type='product').categId = cat2
        self.assertEqual(self.product1.categId, cat2)

        self.assertEqual(self.product1.value_svl, 100)
        self.assertEqual(self.product1.quantity_svl, 10)
        # An accounting entry should only be created for the replenish now that the category is perpetual.
        self.assertEqual(len(self.product1.stock_valuation_layer_ids.mapped('accountMoveId')), 1)
        self.assertEqual(len(self.product1.stock_valuation_layer_ids), 3)

    def test_standard_auto_to_manual_1() {
        self.product1.productTemplateId.categId.propertyCostMethod = 'standard'
        self.product1.productTemplateId.categId.propertyValuation = 'auto'
        self.product1.productTemplateId.standardPrice = 10
        move1 = self._make_in_move(self.product1, 10)

        self.assertEqual(self.product1.value_svl, 100)
        self.assertEqual(self.product1.quantity_svl, 10)
        self.assertEqual(len(self.product1.stock_valuation_layer_ids.mapped('accountMoveId')), 1)
        self.assertEqual(len(self.product1.stock_valuation_layer_ids), 1)

        self.product1.productTemplateId.categId.propertyValuation = 'manual'

        self.assertEqual(self.product1.value_svl, 100)
        self.assertEqual(self.product1.quantity_svl, 10)
        # An accounting entry should only be created for the emptying now that the category is manual.
        self.assertEqual(len(self.product1.stock_valuation_layer_ids.mapped('accountMoveId')), 2)
        self.assertEqual(len(self.product1.stock_valuation_layer_ids), 3)

    def test_standard_auto_to_manual_2() {
        self.product1.productTemplateId.categId.propertyCostMethod = 'standard'
        self.product1.productTemplateId.categId.propertyValuation = 'auto'
        self.product1.productTemplateId.standardPrice = 10
        move1 = self._make_in_move(self.product1, 10)

        self.assertEqual(self.product1.value_svl, 100)
        self.assertEqual(self.product1.quantity_svl, 10)
        self.assertEqual(len(self.product1.stock_valuation_layer_ids.mapped('accountMoveId')), 1)
        self.assertEqual(len(self.product1.stock_valuation_layer_ids), 1)

        cat2 = this.env.items('product.category'].create({'name': 'fifo'})
        cat2.propertyCostMethod = 'standard'
        cat2.propertyValuation = 'manual'
        self.product1.withContext(debug=True).categId = cat2

        self.assertEqual(self.product1.value_svl, 100)
        self.assertEqual(self.product1.quantity_svl, 10)
        # An accounting entry should only be created for the emptying now that the category is manual.
        self.assertEqual(len(self.product1.stock_valuation_layer_ids.mapped('accountMoveId')), 2)
        self.assertEqual(len(self.product1.stock_valuation_layer_ids), 3)

@tagged('post_install', '-at_install')
class TestAngloSaxonAccounting(AccountTestInvoicingCommon):
    @classmethod
    def setUpClass(cls, chart_template_ref=None):
        super().setUpClass(chart_template_ref=chart_template_ref)
        cls.env.ref('base.EUR').active = True
        cls.company_data['company'].anglo_saxon_accounting = True
        cls.stock_location = cls.env['stock.location'].create({
            'name': 'stock location',
            'usage': 'internal',
        })
        cls.customer_location = cls.env['stock.location'].create({
            'name': 'customer location',
            'usage': 'customer',
        })
        cls.supplier_location = cls.env['stock.location'].create({
            'name': 'supplier location',
            'usage': 'supplier',
        })
        cls.warehouse_in = cls.env['stock.warehouse'].create({
            'name': 'warehouse in',
            'companyId': cls.company_data['company'].id,
            'code': '1',
        })
        cls.warehouse_out = cls.env['stock.warehouse'].create({
            'name': 'warehouse out',
            'companyId': cls.company_data['company'].id,
            'code': '2',
        })
        cls.pickingTypeIn = cls.env['stock.picking.type'].create({
            'name': 'pick type in',
            'sequence_code': '1',
            'code': 'incoming',
            'companyId': cls.company_data['company'].id,
            'warehouseId': cls.warehouse_in.id,
        })
        cls.pickingTypeOut = cls.env['stock.picking.type'].create({
            'name': 'pick type in',
            'sequence_code': '2',
            'code': 'outgoing',
            'companyId': cls.company_data['company'].id,
            'warehouseId': cls.warehouse_out.id,
        })
        cls.stock_input_account = cls.env['account.account'].create({
            'name': 'Stock Input',
            'code': 'StockIn',
            'user_type_id': cls.env.ref('account.data_account_type_current_assets').id,
            'reconcile': True,
        })
        cls.stock_output_account = cls.env['account.account'].create({
            'name': 'Stock Output',
            'code': 'StockOut',
            'user_type_id': cls.env.ref('account.data_account_type_current_assets').id,
            'reconcile': True,
        })
        cls.stock_valuation_account = cls.env['account.account'].create({
            'name': 'Stock Valuation',
            'code': 'Stock Valuation',
            'user_type_id': cls.env.ref('account.data_account_type_current_assets').id,
            'reconcile': True,
        })
        cls.expense_account = cls.env['account.account'].create({
            'name': 'Expense Account',
            'code': 'Expense Account',
            'user_type_id': cls.env.ref('account.data_account_type_expenses').id,
            'reconcile': True,
        })
        cls.uom_unit = cls.env.ref('uom.productUomUnit')
        cls.product1 = cls.env['product.product'].create({
            'name': 'product1',
            'type': 'product',
            'categId': cls.env.ref('product.product_category_all').id,
            'property_account_expense_id': cls.expense_account.id,
        })
        cls.product1.categId.write({
            'propertyValuation': 'auto',
            'property_stock_account_input_categ_id': cls.stock_input_account.id,
            'property_stock_account_output_categ_id': cls.stock_output_account.id,
            'property_stock_valuation_account_id': cls.stock_valuation_account.id,
            'property_stock_journal': cls.company_data['default_journal_misc'].id,
        })

    def _make_in_move(self, product, quantity, unit_cost=None, create_picking=False, loc_dest=None, pick_type=None):
        """ Helper to create and validate a receipt move.
        """
        unit_cost = unit_cost or product.standardPrice
        loc_dest = loc_dest or self.stock_location
        pick_type = pick_type or self.pickingTypeIn
        in_move = this.env.items('stock.move'].create({
            'name': 'in %s units @ %s per unit' % (str(quantity), str(unit_cost)),
            'productId': product.id,
            'locationId': self.supplier_location.id,
            'locationDestId': loc_dest.id,
            'productUom': self.uom_unit.id,
            'productUomQty': quantity,
            'priceUnit': unit_cost,
            'pickingTypeId': pick_type.id,
        })

        if create_picking:
            picking = this.env.items('stock.picking'].create({
                'pickingTypeId': in_move.pickingTypeId.id,
                'locationId': in_move.locationId.id,
                'locationDestId': in_move.locationDestId.id,
            })
            in_move.write({'pickingId': picking.id})

        in_move._action_confirm()
        in_move._action_assign()
        in_move.moveLineIds.qtyDone = quantity
        in_move._action_done()

        return in_move.withContext(svl=True)

    def _make_dropship_move(self, product, quantity, unit_cost=None):
        dropshipped = this.env.items('stock.move'].create({
            'name': 'dropship %s units' % str(quantity),
            'productId': product.id,
            'locationId': self.supplier_location.id,
            'locationDestId': self.customer_location.id,
            'productUom': self.uom_unit.id,
            'productUomQty': quantity,
            'pickingTypeId': self.pickingTypeOut.id,
        })
        if unit_cost:
            dropshipped.priceUnit = unit_cost
        dropshipped._action_confirm()
        dropshipped._action_assign()
        dropshipped.moveLineIds.qtyDone = quantity
        dropshipped._action_done()
        return dropshipped

    def _make_return(self, move, quantity_to_return):
        stock_return_picking = Form(this.env.items('stock.return.picking']\
            .withContext(activeIds=[move.pickingId.id], activeId=move.pickingId.id, active_model='stock.picking'))
        stock_return_picking = stock_return_picking.save()
        stock_return_picking.product_return_moves.quantity = quantity_to_return
        stock_return_picking_action = stock_return_picking.create_returns()
        return_pick = this.env.items('stock.picking'].browse(stock_return_picking_action['resId'])
        return_pick.move_lines[0].moveLineIds[0].qtyDone = quantity_to_return
        return_pick._action_done()
        return return_pick.move_lines

    def test_avco_and_credit_note() {
        """
        When reversing an invoice that contains some anglo-saxo AML, the new anglo-saxo AML should have the same value
        """
        self.product1.categId.propertyCostMethod = 'average'

        self._make_in_move(self.product1, 2, unit_cost=10)

        invoice_form = Form(this.env.items('account.move'].withContext(default_move_type='outInvoice'))
        invoice_form.partnerId = this.env.items('res.partner'].create({'name': 'Super Client'})
        with invoice_form.invoiceLineIds.new() as invoice_line_form:
            invoice_line_form.productId = self.product1
            invoice_line_form.quantity = 2
            invoice_line_form.priceUnit = 25
            invoice_line_form.accountId = self.company_data['default_journal_purchase'].default_account_id
            invoice_line_form.taxIds.clear()
        invoice = invoice_form.save()
        invoice.action_post()

        self._make_in_move(self.product1, 2, unit_cost=20)
        self.assertEqual(self.product1.standardPrice, 15)

        refund_wizard = this.env.items('account.move.reversal'].withContext(active_model="account.move", activeIds=invoice.ids).create({
            'refund_method': 'refund',
            'journalId': invoice.journalId.id,
        })
        action = refund_wizard.reverse_moves()
        reverse_invoice = this.env.items('account.move'].browse(action['resId'])
        with Form(reverse_invoice) as reverse_invoice_form:
            with reverse_invoice_form.invoiceLineIds.edit(0) as line:
                line.quantity = 1
        reverse_invoice.action_post()

        anglo_lines = reverse_invoice.lineIds.filtered(lambda l: l.is_anglo_saxon_line)
        self.assertEqual(len(anglo_lines), 2)
        self.assertEqual(abs(anglo_lines[0].balance), 10)
        self.assertEqual(abs(anglo_lines[1].balance), 10)

    def test_dropship_return_accounts_1() {
        """
        When returning a dropshipped move, make sure the correct accounts are used
        """
        # pylint: disable=bad-whitespace
        self.product1.categId.propertyCostMethod = 'fifo'

        move1 = self._make_dropship_move(self.product1, 2, unit_cost=10)
        move2 = self._make_return(move1, 2)

        # First: Input -> Valuation
        # Second: Valuation -> Output
        origin_svls = move1.stock_valuation_layer_ids.sorted('quantity', reverse=True)
        # First: Output -> Valuation
        # Second: Valuation -> Input
        return_svls = move2.stock_valuation_layer_ids.sorted('quantity', reverse=True)
        self.assertEqual(len(origin_svls), 2)
        self.assertEqual(len(return_svls), 2)

        acc_in, acc_out, acc_valuation = self.stock_input_account, self.stock_output_account, self.stock_valuation_account

        # Dropshipping should be: Input -> Output
        self.assertRecordValues(origin_svls[0].accountMoveId.lineIds, [
            {'accountId': acc_in.id,        'debit': 0,  'credit': 20},
            {'accountId': acc_valuation.id, 'debit': 20, 'credit': 0},
        ])
        self.assertRecordValues(origin_svls[1].accountMoveId.lineIds, [
            {'accountId': acc_valuation.id, 'debit': 0,  'credit': 20},
            {'accountId': acc_out.id,       'debit': 20, 'credit': 0},
        ])
        # Return should be: Output -> Input
        self.assertRecordValues(return_svls[0].accountMoveId.lineIds, [
            {'accountId': acc_out.id,       'debit': 0,  'credit': 20},
            {'accountId': acc_valuation.id, 'debit': 20, 'credit': 0},
        ])
        self.assertRecordValues(return_svls[1].accountMoveId.lineIds, [
            {'accountId': acc_valuation.id, 'debit': 0,  'credit': 20},
            {'accountId': acc_in.id,        'debit': 20, 'credit': 0},
        ])

    def test_dropship_return_accounts_2() {
        """
        When returning a dropshipped move, make sure the correct accounts are used
        """
        # pylint: disable=bad-whitespace
        self.product1.categId.propertyCostMethod = 'fifo'

        move1 = self._make_dropship_move(self.product1, 2, unit_cost=10)

        # return to WH/Stock
        stock_return_picking = Form(this.env.items('stock.return.picking']\
            .withContext(activeIds=[move1.pickingId.id], activeId=move1.pickingId.id, active_model='stock.picking'))
        stock_return_picking = stock_return_picking.save()
        stock_return_picking.product_return_moves.quantity = 2
        stock_return_picking.locationId = self.stock_location
        stock_return_picking_action = stock_return_picking.create_returns()
        return_pick = this.env.items('stock.picking'].browse(stock_return_picking_action['resId'])
        return_pick.move_lines[0].moveLineIds[0].qtyDone = 2
        return_pick._action_done()
        move2 = return_pick.move_lines

        # First: Input -> Valuation
        # Second: Valuation -> Output
        origin_svls = move1.stock_valuation_layer_ids.sorted('quantity', reverse=True)
        # Only one: Output -> Valuation
        return_svl = move2.stock_valuation_layer_ids
        self.assertEqual(len(origin_svls), 2)
        self.assertEqual(len(return_svl), 1)

        acc_in, acc_out, acc_valuation = self.stock_input_account, self.stock_output_account, self.stock_valuation_account

        # Dropshipping should be: Input -> Output
        self.assertRecordValues(origin_svls[0].accountMoveId.lineIds, [
            {'accountId': acc_in.id,        'debit': 0,  'credit': 20},
            {'accountId': acc_valuation.id, 'debit': 20, 'credit': 0},
        ])
        self.assertRecordValues(origin_svls[1].accountMoveId.lineIds, [
            {'accountId': acc_valuation.id, 'debit': 0,  'credit': 20},
            {'accountId': acc_out.id,       'debit': 20, 'credit': 0},
        ])
        # Return should be: Output -> Valuation
        self.assertRecordValues(return_svl.accountMoveId.lineIds, [
            {'accountId': acc_out.id,       'debit': 0,  'credit': 20},
            {'accountId': acc_valuation.id, 'debit': 20, 'credit': 0},
        ])
