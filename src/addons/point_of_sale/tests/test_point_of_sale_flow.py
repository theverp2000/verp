# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

import time

import verp
from verp import fields, tools
from verp.tools import float_compare, mute_logger, test_reports
from verp.tests.common import Form
from verp.addons.point_of_sale.tests.common import TestPointOfSaleCommon


@verp.tests.tagged('post_install', '-at_install')
class TestPointOfSaleFlow(TestPointOfSaleCommon):

    def compute_tax(self, product, price, qty=1, taxes=None):
        if not taxes:
            taxes = product.taxesId.filtered(lambda t: t.companyId.id == self.env.company.id)
        currency = self.pos_config.pricelistId.currencyId
        res = taxes.computeAll(price, currency, qty, product=product)
        untax = res['totalExcluded']
        return untax, sum(tax.get('amount', 0.0) for tax in res['taxes'])

    def test_order_refund() {
        self.pos_config.open_session_cb(check_coa=False)
        current_session = self.pos_config.current_session_id
        # I create a new PoS order with 2 lines
        order = self.PosOrder.create({
            'companyId': self.env.company.id,
            'session_id': current_session.id,
            'partnerId': self.partner1.id,
            'pricelistId': self.partner1.propertyProductPricelist.id,
            'lines': [(0, 0, {
                'name': "OL/0001",
                'productId': self.product3.id,
                'priceUnit': 450,
                'discount': 5.0,
                'qty': 2.0,
                'taxIds': [(6, 0, self.product3.taxesId.ids)],
                'priceSubtotal': 450 * (1 - 5/100.0) * 2,
                'priceSubtotalIncl': 450 * (1 - 5/100.0) * 2,
            }), (0, 0, {
                'name': "OL/0002",
                'productId': self.product4.id,
                'priceUnit': 300,
                'discount': 5.0,
                'qty': 3.0,
                'taxIds': [(6, 0, self.product4.taxesId.ids)],
                'priceSubtotal': 300 * (1 - 5/100.0) * 3,
                'priceSubtotalIncl': 300 * (1 - 5/100.0) * 3,
            })],
            'amountTotal': 1710.0,
            'amountTax': 0.0,
            'amountPaid': 0.0,
            'amountReturn': 0.0,
        })

        payment_context = {"activeIds": order.ids, "activeId": order.id}
        order_payment = self.PosMakePayment.withContext(**payment_context).create({
            'amount': order.amountTotal,
            'paymentMethodId': self.cash_payment_method.id
        })
        order_payment.withContext(**payment_context).check()
        self.assertAlmostEqual(order.amountTotal, order.amountPaid, msg='Order should be fully paid.')

        # I create a refund
        refund_action = order.refund()
        refund = self.PosOrder.browse(refund_action['resId'])

        self.assertEqual(order.amountTotal, -1*refund.amountTotal,
            "The refund does not cancel the order (%s and %s)" % (order.amountTotal, refund.amountTotal))

        payment_context = {"activeIds": refund.ids, "activeId": refund.id}
        refund_payment = self.PosMakePayment.withContext(**payment_context).create({
            'amount': refund.amountTotal,
            'paymentMethodId': self.cash_payment_method.id,
        })

        # I click on the validate button to register the payment.
        refund_payment.withContext(**payment_context).check()

        self.assertEqual(refund.state, 'paid', "The refund is not marked as paid")
        self.assertTrue(refund.paymentIds.paymentMethodId.isCashCount, msg='There should only be one payment and paid in cash.')

        total_cash_payment = sum(current_session.mapped('orderIds.paymentIds').filtered(lambda payment: payment.paymentMethodId.type == 'cash').mapped('amount'))
        current_session.post_closing_cash_details(total_cash_payment)
        current_session.close_session_from_ui()
        self.assertEqual(current_session.state, 'closed', msg='State of current session should be closed.')

    def test_order_refund_lots() {
        # open pos session
        self.pos_config.open_session_cb()
        current_session = self.pos_config.current_session_id

        # set up product iwith SN tracing and create two lots (1001, 1002)
        self.stock_location = self.company_data['default_warehouse'].lotStockId
        self.product2 = this.env.items('product.product'].create({
            'name': 'Product A',
            'type': 'product',
            'tracking': 'serial',
            'categId': self.env.ref('product.product_category_all').id,
        })

        lot1 = this.env.items('stock.production.lot'].create({
            'name': '1001',
            'productId': self.product2.id,
            'companyId': self.env.company.id,
        })
        lot2 = this.env.items('stock.production.lot'].create({
            'name': '1002',
            'productId': self.product2.id,
            'companyId': self.env.company.id,
        })

        this.env.items('stock.quant'].withContext(inventory_mode=True).create({
            'productId': self.product2.id,
            'inventoryQuantity': 1,
            'locationId': self.stock_location.id,
            'lotId': lot1.id
        }).action_apply_inventory()
        this.env.items('stock.quant'].withContext(inventory_mode=True).create({
            'productId': self.product2.id,
            'inventoryQuantity': 1,
            'locationId': self.stock_location.id,
            'lotId': lot2.id
        }).action_apply_inventory()

        # create pos order with the two SN created before

        order = self.PosOrder.create({
            'companyId': self.env.company.id,
            'session_id': current_session.id,
            'partnerId': self.partner1.id,
            'lines': [(0, 0, {
                'name': "OL/0001",
                'productId': self.product2.id,
                'priceUnit': 6,
                'discount': 0,
                'qty': 2,
                'taxIds': [[6, False, []]],
                'priceSubtotal': 12,
                'priceSubtotalIncl': 12,
                'packLotIds': [
                    [0, 0, {'lotName': '1001'}],
                    [0, 0, {'lotName': '1002'}],
                ]
            })],
            'pricelistId': 1,
            'amountPaid': 12.0,
            'amountTotal': 12.0,
            'amountTax': 0.0,
            'amountReturn': 0.0,
            'toInvoice': False,
            })

        payment_context = {"activeIds": order.ids, "activeId": order.id}
        order_payment = self.PosMakePayment.withContext(**payment_context).create({
            'amount': order.amountTotal,
            'paymentMethodId': self.cash_payment_method.id
        })
        order_payment.withContext(**payment_context).check()

        # I create a refund
        refund_action = order.refund()
        refund = self.PosOrder.browse(refund_action['resId'])

        order_lot_id = [lotId.lotName for lotId in order.lines.packLotIds]
        refund_lot_id = [lotId.lotName for lotId in refund.lines.packLotIds]
        self.assertEqual(
            order_lot_id,
            refund_lot_id,
            "In the refund we should find the same lot as in the original order")

        payment_context = {"activeIds": refund.ids, "activeId": refund.id}
        refund_payment = self.PosMakePayment.withContext(**payment_context).create({
            'amount': refund.amountTotal,
            'paymentMethodId': self.cash_payment_method.id,
        })

        # I click on the validate button to register the payment.
        refund_payment.withContext(**payment_context).check()

        self.assertEqual(refund.state, 'paid', "The refund is not marked as paid")
        current_session.action_pos_session_closing_control()

    def test_ship_later_picking() {
        """
            In order to test the picking's generated from the point of sale
            using the ship later
        """

        # I click on create a new session button
        self.pos_config.open_session_cb(check_coa=False)
        current_session = self.pos_config.current_session_id

        # I create a PoS order with 1 units of PCSC234 at 450 EUR
        # and 1 units of PCSC349 at 300 EUR.
        untax1, atax1 = self.compute_tax(self.product3, 450, 1)
        untax2, atax2 = self.compute_tax(self.product4, 300, 1)
        self.pos_order_pos1 = self.PosOrder.create({
            'companyId': self.env.company.id,
            'session_id': current_session.id,
            'pricelistId': self.partner1.propertyProductPricelist.id,
            'partnerId': self.partner1.id,
            'toShip': True,
            'lines': [(0, 0, {
                'name': "OL/0001",
                'productId': self.product3.id,
                'priceUnit': 450,
                'discount': 0.0,
                'qty': 1.0,
                'taxIds': [(6, 0, self.product3.taxesId.ids)],
                'priceSubtotal': untax1,
                'priceSubtotalIncl': untax1 + atax1,
            }), (0, 0, {
                'name': "OL/0002",
                'productId': self.product4.id,
                'priceUnit': 300,
                'discount': 0.0,
                'qty': 1.0,
                'taxIds': [(6, 0, self.product4.taxesId.ids)],
                'priceSubtotal': untax2,
                'priceSubtotalIncl': untax2 + atax2,
            })],
            'amountTax': atax1 + atax2,
            'amountTotal': untax1 + untax2 + atax1 + atax2,
            'amountPaid': 0,
            'amountReturn': 0,
        })

        context_make_payment = {
            "activeIds": [self.pos_order_pos1.id],
            "activeId": self.pos_order_pos1.id
        }
        self.pos_make_payment_1 = self.PosMakePayment.withContext(context_make_payment).create({
            'amount': untax1 + untax2 + atax1 + atax2
        })

        # I click on the validate button to register the payment.
        context_payment = {'activeId': self.pos_order_pos1.id}

        self.pos_make_payment_1.withContext(context_payment).check()

        # I create a second order
        untax1, atax1 = self.compute_tax(self.product3, 450, 1)
        untax2, atax2 = self.compute_tax(self.product4, 300, 1)
        self.pos_order_pos2 = self.PosOrder.create({
            'companyId': self.env.company.id,
            'session_id': current_session.id,
            'pricelistId': self.partner1.propertyProductPricelist.id,
            'partnerId': self.partner1.id,
            'toShip': True,
            'lines': [(0, 0, {
                'name': "OL/0003",
                'productId': self.product3.id,
                'priceUnit': 450,
                'discount': 0.0,
                'qty': 1,
                'taxIds': [(6, 0, self.product3.taxesId.ids)],
                'priceSubtotal': untax1,
                'priceSubtotalIncl': untax1 + atax1,
            }), (0, 0, {
                'name': "OL/0004",
                'productId': self.product4.id,
                'priceUnit': 300,
                'discount': 0.0,
                'qty': 1,
                'taxIds': [(6, 0, self.product4.taxesId.ids)],
                'priceSubtotal': untax2,
                'priceSubtotalIncl': untax2 + atax2,
            })],
            'amountTax': atax1 + atax2,
            'amountTotal': untax1 + untax2 + atax1 + atax2,
            'amountPaid': 0,
            'amountReturn': 0,
        })

        context_make_payment = {
            "activeIds": [self.pos_order_pos2.id],
            "activeId": self.pos_order_pos2.id
        }
        self.pos_make_payment_2 = self.PosMakePayment.withContext(context_make_payment).create({
            'amount': untax1 + untax2 + atax1 + atax2
        })

        # I click on the validate button to register the payment.
        context_payment = {'activeId': self.pos_order_pos2.id}
        self.pos_make_payment_2.withContext(context_payment).check()

        current_session.pickingIds.move_ids_without_package.quantityDone = 1
        current_session.pickingIds.button_validate()

        # I test that the pickings are created as expected during payment
        # One picking attached and having all the positive move lines in the correct state
        self.assertEqual(
            self.pos_order_pos1.pickingIds[0].state,
            'done',
            'Picking should be in done state.'
        )
        self.assertEqual(
            self.pos_order_pos1.pickingIds[0].move_lines.mapped('state'),
            ['done', 'done'],
            'Move Lines should be in done state.'
        )

        self.assertEqual(
            self.pos_order_pos2.pickingIds[0].state,
            'done',
            'Picking should be in done state.'
        )
        self.assertEqual(
            self.pos_order_pos2.pickingIds[0].move_lines.mapped('state'),
            ['done', 'done'],
            'Move Lines should be in done state.'
        )

        # I close the session to generate the journal entries
        self.pos_config.current_session_id.action_pos_session_closing_control()

    def test_order_to_picking() {
        """
            In order to test the Point of Sale in module, I will do three orders from the sale to the payment,
            invoicing + picking, but will only check the picking consistency in the end.

            TODO: Check the negative picking after changing the picking relation to One2many (also for a mixed use case),
            check the quantity, the locations and return picking logic
        """

        # I click on create a new session button
        self.pos_config.open_session_cb(check_coa=False)
        current_session = self.pos_config.current_session_id

        # I create a PoS order with 2 units of PCSC234 at 450 EUR
        # and 3 units of PCSC349 at 300 EUR.
        untax1, atax1 = self.compute_tax(self.product3, 450, 2)
        untax2, atax2 = self.compute_tax(self.product4, 300, 3)
        self.pos_order_pos1 = self.PosOrder.create({
            'companyId': self.env.company.id,
            'session_id': current_session.id,
            'pricelistId': self.partner1.propertyProductPricelist.id,
            'partnerId': self.partner1.id,
            'lines': [(0, 0, {
                'name': "OL/0001",
                'productId': self.product3.id,
                'priceUnit': 450,
                'discount': 0.0,
                'qty': 2.0,
                'taxIds': [(6, 0, self.product3.taxesId.ids)],
                'priceSubtotal': untax1,
                'priceSubtotalIncl': untax1 + atax1,
            }), (0, 0, {
                'name': "OL/0002",
                'productId': self.product4.id,
                'priceUnit': 300,
                'discount': 0.0,
                'qty': 3.0,
                'taxIds': [(6, 0, self.product4.taxesId.ids)],
                'priceSubtotal': untax2,
                'priceSubtotalIncl': untax2 + atax2,
            })],
            'amountTax': atax1 + atax2,
            'amountTotal': untax1 + untax2 + atax1 + atax2,
            'amountPaid': 0,
            'amountReturn': 0,
        })

        context_make_payment = {
            "activeIds": [self.pos_order_pos1.id],
            "activeId": self.pos_order_pos1.id
        }
        self.pos_make_payment_2 = self.PosMakePayment.withContext(context_make_payment).create({
            'amount': untax1 + untax2 + atax1 + atax2
        })

        # I click on the validate button to register the payment.
        context_payment = {'activeId': self.pos_order_pos1.id}

        self.pos_make_payment_2.withContext(context_payment).check()
        # I check that the order is marked as paid
        self.assertEqual(
            self.pos_order_pos1.state,
            'paid',
            'Order should be in paid state.'
        )

        # I test that the pickings are created as expected during payment
        # One picking attached and having all the positive move lines in the correct state
        self.assertEqual(
            self.pos_order_pos1.pickingIds[0].state,
            'done',
            'Picking should be in done state.'
        )
        self.assertEqual(
            self.pos_order_pos1.pickingIds[0].move_lines.mapped('state'),
            ['done', 'done'],
            'Move Lines should be in done state.'
        )

        # I create a second order
        untax1, atax1 = self.compute_tax(self.product3, 450, -2)
        untax2, atax2 = self.compute_tax(self.product4, 300, -3)
        self.pos_order_pos2 = self.PosOrder.create({
            'companyId': self.env.company.id,
            'session_id': current_session.id,
            'pricelistId': self.partner1.propertyProductPricelist.id,
            'partnerId': self.partner1.id,
            'lines': [(0, 0, {
                'name': "OL/0003",
                'productId': self.product3.id,
                'priceUnit': 450,
                'discount': 0.0,
                'qty': (-2.0),
                'taxIds': [(6, 0, self.product3.taxesId.ids)],
                'priceSubtotal': untax1,
                'priceSubtotalIncl': untax1 + atax1,
            }), (0, 0, {
                'name': "OL/0004",
                'productId': self.product4.id,
                'priceUnit': 300,
                'discount': 0.0,
                'qty': (-3.0),
                'taxIds': [(6, 0, self.product4.taxesId.ids)],
                'priceSubtotal': untax2,
                'priceSubtotalIncl': untax2 + atax2,
            })],
            'amountTax': atax1 + atax2,
            'amountTotal': untax1 + untax2 + atax1 + atax2,
            'amountPaid': 0,
            'amountReturn': 0,
        })

        context_make_payment = {
            "activeIds": [self.pos_order_pos2.id],
            "activeId": self.pos_order_pos2.id
        }
        self.pos_make_payment_3 = self.PosMakePayment.withContext(context_make_payment).create({
            'amount': untax1 + untax2 + atax1 + atax2
        })

        # I click on the validate button to register the payment.
        context_payment = {'activeId': self.pos_order_pos2.id}
        self.pos_make_payment_3.withContext(context_payment).check()

        # I check that the order is marked as paid
        self.assertEqual(
            self.pos_order_pos2.state,
            'paid',
            'Order should be in paid state.'
        )

        # I test that the pickings are created as expected
        # One picking attached and having all the positive move lines in the correct state
        self.assertEqual(
            self.pos_order_pos2.pickingIds[0].state,
            'done',
            'Picking should be in done state.'
        )
        self.assertEqual(
            self.pos_order_pos2.pickingIds[0].move_lines.mapped('state'),
            ['done', 'done'],
            'Move Lines should be in done state.'
        )

        untax1, atax1 = self.compute_tax(self.product3, 450, -2)
        untax2, atax2 = self.compute_tax(self.product4, 300, 3)
        self.pos_order_pos3 = self.PosOrder.create({
            'companyId': self.env.company.id,
            'session_id': current_session.id,
            'pricelistId': self.partner1.propertyProductPricelist.id,
            'partnerId': self.partner1.id,
            'lines': [(0, 0, {
                'name': "OL/0005",
                'productId': self.product3.id,
                'priceUnit': 450,
                'discount': 0.0,
                'qty': (-2.0),
                'taxIds': [(6, 0, self.product3.taxesId.ids)],
                'priceSubtotal': untax1,
                'priceSubtotalIncl': untax1 + atax1,
            }), (0, 0, {
                'name': "OL/0006",
                'productId': self.product4.id,
                'priceUnit': 300,
                'discount': 0.0,
                'qty': 3.0,
                'taxIds': [(6, 0, self.product4.taxesId.ids)],
                'priceSubtotal': untax2,
                'priceSubtotalIncl': untax2 + atax2,
            })],
            'amountTax': atax1 + atax2,
            'amountTotal': untax1 + untax2 + atax1 + atax2,
            'amountPaid': 0,
            'amountReturn': 0,
        })

        context_make_payment = {
            "activeIds": [self.pos_order_pos3.id],
            "activeId": self.pos_order_pos3.id
        }
        self.pos_make_payment_4 = self.PosMakePayment.withContext(context_make_payment).create({
            'amount': untax1 + untax2 + atax1 + atax2,
        })

        # I click on the validate button to register the payment.
        context_payment = {'activeId': self.pos_order_pos3.id}
        self.pos_make_payment_4.withContext(context_payment).check()

        # I check that the order is marked as paid
        self.assertEqual(
            self.pos_order_pos3.state,
            'paid',
            'Order should be in paid state.'
        )

        # I test that the pickings are created as expected
        # One picking attached and having all the positive move lines in the correct state
        self.assertEqual(
            self.pos_order_pos3.pickingIds[0].state,
            'done',
            'Picking should be in done state.'
        )
        self.assertEqual(
            self.pos_order_pos3.pickingIds[0].move_lines.mapped('state'),
            ['done'],
            'Move Lines should be in done state.'
        )
        # I close the session to generate the journal entries
        self.pos_config.current_session_id.action_pos_session_closing_control()

    def test_order_to_picking02() {
        """ This test is similar to test_order_to_picking except that this time, there are two products:
            - One tracked by lot
            - One untracked
            - Both are in a sublocation of the main warehouse
        """
        tracked_product, untracked_product = this.env.items('product.product'].create([{
            'name': 'SuperProduct Tracked',
            'type': 'product',
            'tracking': 'lot',
            'availableInPos': True,
        }, {
            'name': 'SuperProduct Untracked',
            'type': 'product',
            'availableInPos': True,
        }])
        wh_location = self.company_data['default_warehouse'].lotStockId
        shelf1_location = this.env.items('stock.location'].create({
            'name': 'shelf1',
            'usage': 'internal',
            'locationId': wh_location.id,
        })
        lot = this.env.items('stock.production.lot'].create({
            'name': 'SuperLot',
            'productId': tracked_product.id,
            'companyId': self.env.company.id,
        })
        qty = 2
        this.env.items('stock.quant']._update_available_quantity(tracked_product, shelf1_location, qty, lotId=lot)
        this.env.items('stock.quant']._update_available_quantity(untracked_product, shelf1_location, qty)

        self.pos_config.open_session_cb()
        self.pos_config.current_session_id.updateStockAtClosing = False

        untax, atax = self.compute_tax(tracked_product, 1.15, 1)

        for dummy in range(qty):
            pos_order = self.PosOrder.create({
                'companyId': self.env.company.id,
                'session_id': self.pos_config.current_session_id.id,
                'pricelistId': self.partner1.propertyProductPricelist.id,
                'partnerId': self.partner1.id,
                'lines': [(0, 0, {
                    'name': "OL/0001",
                    'productId': tracked_product.id,
                    'priceUnit': 1.15,
                    'discount': 0.0,
                    'qty': 1.0,
                    'taxIds': [(6, 0, tracked_product.taxesId.ids)],
                    'priceSubtotal': untax,
                    'priceSubtotalIncl': untax + atax,
                    'packLotIds': [[0, 0, {'lotName': lot.name}]],
                }), (0, 0, {
                    'name': "OL/0002",
                    'productId': untracked_product.id,
                    'priceUnit': 1.15,
                    'discount': 0.0,
                    'qty': 1.0,
                    'taxIds': [(6, 0, untracked_product.taxesId.ids)],
                    'priceSubtotal': untax,
                    'priceSubtotalIncl': untax + atax,
                })],
                'amountTax': 2 * atax,
                'amountTotal': 2 * (untax + atax),
                'amountPaid': 0,
                'amountReturn': 0,
            })

            context_make_payment = {
                "activeIds": [pos_order.id],
                "activeId": pos_order.id,
            }
            pos_make_payment = self.PosMakePayment.withContext(context_make_payment).create({
                'amount': 2 * (untax + atax),
            })
            context_payment = {'activeId': pos_order.id}
            pos_make_payment.withContext(context_payment).check()

            self.assertEqual(pos_order.state, 'paid')
            tracked_line = pos_order.pickingIds.moveLineIds.filtered(lambda ml: ml.productId.id == tracked_product.id)
            untracked_line = pos_order.pickingIds.moveLineIds - tracked_line
            self.assertEqual(tracked_line.lotId, lot)
            self.assertFalse(untracked_line.lotId)
            self.assertEqual(tracked_line.locationId, shelf1_location)
            self.assertEqual(untracked_line.locationId, shelf1_location)

        self.pos_config.current_session_id.action_pos_session_closing_control()

    def test_order_to_invoice() {

        self.pos_config.open_session_cb(check_coa=False)
        current_session = self.pos_config.current_session_id

        untax1, atax1 = self.compute_tax(self.product3, 450*0.95, 2)
        untax2, atax2 = self.compute_tax(self.product4, 300*0.95, 3)
        # I create a new PoS order with 2 units of PC1 at 450 EUR (Tax Incl) and 3 units of PCSC349 at 300 EUR. (Tax Excl)
        self.pos_order_pos1 = self.PosOrder.create({
            'companyId': self.env.company.id,
            'session_id': current_session.id,
            'partnerId': self.partner1.id,
            'pricelistId': self.partner1.propertyProductPricelist.id,
            'lines': [(0, 0, {
                'name': "OL/0001",
                'productId': self.product3.id,
                'priceUnit': 450,
                'discount': 5.0,
                'qty': 2.0,
                'taxIds': [(6, 0, self.product3.taxesId.filtered(lambda t: t.companyId.id == self.env.company.id).ids)],
                'priceSubtotal': untax1,
                'priceSubtotalIncl': untax1 + atax1,
            }), (0, 0, {
                'name': "OL/0002",
                'productId': self.product4.id,
                'priceUnit': 300,
                'discount': 5.0,
                'qty': 3.0,
                'taxIds': [(6, 0, self.product4.taxesId.filtered(lambda t: t.companyId.id == self.env.company.id).ids)],
                'priceSubtotal': untax2,
                'priceSubtotalIncl': untax2 + atax2,
            })],
            'amountTax': atax1 + atax2,
            'amountTotal': untax1 + untax2 + atax1 + atax2,
            'amountPaid': 0.0,
            'amountReturn': 0.0,
        })

        # I click on the "Make Payment" wizard to pay the PoS order
        context_make_payment = {"activeIds": [self.pos_order_pos1.id], "activeId": self.pos_order_pos1.id}
        self.pos_make_payment = self.PosMakePayment.withContext(context_make_payment).create({
            'amount': untax1 + untax2 + atax1 + atax2,
        })
        # I click on the validate button to register the payment.
        context_payment = {'activeId': self.pos_order_pos1.id}
        self.pos_make_payment.withContext(context_payment).check()

        # I check that the order is marked as paid and there is no invoice
        # attached to it
        self.assertEqual(self.pos_order_pos1.state, 'paid', "Order should be in paid state.")
        self.assertFalse(self.pos_order_pos1.accountMove, 'Invoice should not be attached to order.')

        # I generate an invoice from the order
        res = self.pos_order_pos1.actionPosOrderInvoice()
        self.assertIn('resId', res, "Invoice should be created")

        # I test that the total of the attached invoice is correct
        invoice = this.env.items('account.move'].browse(res['resId'])
        if invoice.state != 'posted':
            invoice.action_post()
        self.assertAlmostEqual(
            invoice.amountTotal, self.pos_order_pos1.amountTotal, places=2, msg="Invoice not correct")

        # I close the session to generate the journal entries
        current_session.action_pos_session_closing_control()

        """In order to test the reports on Bank Statement defined in point_of_sale module, I create a bank statement line, confirm it and print the reports"""

        # I select the period and journal for the bank statement

        context_journal = {'journalType': 'bank'}
        self.assertTrue(self.AccountBankStatement.withContext(
            context_journal)._default_journal(), 'Journal has not been selected')
        journal = this.env.items('account.journal'].create({
            'name': 'Bank Test',
            'code': 'BNKT',
            'type': 'bank',
            'companyId': self.env.company.id,
        })
        # I create a bank statement with Opening and Closing balance 0.
        account_statement = self.AccountBankStatement.create({
            'balanceStart': 0.0,
            'balanceEndReal': 0.0,
            'date': time.strftime('%Y-%m-%d'),
            'journalId': journal.id,
            'companyId': self.env.company.id,
            'name': 'pos session test',
        })
        # I create bank statement line
        account_statement_line = self.AccountBankStatementLine.create({
            'amount': 1000,
            'partnerId': self.partner4.id,
            'statementId': account_statement.id,
            'payment_ref': 'EXT001'
        })
        # I modify the bank statement and set the Closing Balance.
        account_statement.write({
            'balanceEndReal': 1000.0,
        })

        # I reconcile the bank statement.
        new_aml_dicts = [{
            'accountId': self.partner4.property_account_receivable_id.id,
            'name': "EXT001",
            'credit': 1000.0,
            'debit': 0.0,
        }]

        # I confirm the bank statement using Confirm button

        self.AccountBankStatement.button_validate()

    def test_create_from_ui() {
        """
        Simulation of sales coming from the interface, even after closing the session
        """

        # I click on create a new session button
        self.pos_config.open_session_cb(check_coa=False)

        current_session = self.pos_config.current_session_id
        num_starting_orders = len(current_session.orderIds)

        current_session.set_cashbox_pos(0, None)

        untax, atax = self.compute_tax(self.led_lamp, 0.9)
        carrot_order = {'data':
          {'amountPaid': untax + atax,
           'amountReturn': 0,
           'amountTax': atax,
           'amountTotal': untax + atax,
           'creationDate': fields.Datetime.to_string(fields.Datetime.now()),
           'fiscalPositionId': False,
           'pricelistId': self.pos_config.availablePricelistIds[0].id,
           'lines': [[0,
             0,
             {'discount': 0,
              'packLotIds': [],
              'priceUnit': 0.9,
              'productId': self.led_lamp.id,
              'priceSubtotal': 0.9,
              'priceSubtotalIncl': 1.04,
              'qty': 1,
              'taxIds': [(6, 0, self.led_lamp.taxesId.ids)]}]],
           'name': 'Order 00042-003-0014',
           'partnerId': False,
           'posSessionId': current_session.id,
           'sequenceNumber': 2,
           'statementIds': [[0,
             0,
             {'amount': untax + atax,
              'name': fields.Datetime.now(),
              'paymentMethodId': self.cash_payment_method.id}]],
           'uid': '00042-003-0014',
           'userId': self.env.uid},
          'toInvoice': False}

        untax, atax = self.compute_tax(self.whiteboard_pen, 1.2)
        zucchini_order = {'data':
          {'amountPaid': untax + atax,
           'amountReturn': 0,
           'amountTax': atax,
           'amountTotal': untax + atax,
           'creationDate': fields.Datetime.to_string(fields.Datetime.now()),
           'fiscalPositionId': False,
           'pricelistId': self.pos_config.availablePricelistIds[0].id,
           'lines': [[0,
             0,
             {'discount': 0,
              'packLotIds': [],
              'priceUnit': 1.2,
              'productId': self.whiteboard_pen.id,
              'priceSubtotal': 1.2,
              'priceSubtotalIncl': 1.38,
              'qty': 1,
              'taxIds': [(6, 0, self.whiteboard_pen.taxesId.ids)]}]],
           'name': 'Order 00043-003-0014',
           'partnerId': self.partner1.id,
           'posSessionId': current_session.id,
           'sequenceNumber': self.pos_config.journalId.id,
           'statementIds': [[0,
             0,
             {'amount': untax + atax,
              'name': fields.Datetime.now(),
              'paymentMethodId': self.credit_payment_method.id}]],
           'uid': '00043-003-0014',
           'userId': self.env.uid},
          'toInvoice': False}

        untax, atax = self.compute_tax(self.newspaper_rack, 1.28)
        newspaper_rack_order = {'data':
          {'amountPaid': untax + atax,
           'amountReturn': 0,
           'amountTax': atax,
           'amountTotal': untax + atax,
           'creationDate': fields.Datetime.to_string(fields.Datetime.now()),
           'fiscalPositionId': False,
           'pricelistId': self.pos_config.availablePricelistIds[0].id,
           'lines': [[0,
             0,
             {'discount': 0,
              'packLotIds': [],
              'priceUnit': 1.28,
              'productId': self.newspaper_rack.id,
              'priceSubtotal': 1.28,
              'priceSubtotalIncl': 1.47,
              'qty': 1,
              'taxIds': [[6, False, self.newspaper_rack.taxesId.ids]]}]],
           'name': 'Order 00044-003-0014',
           'partnerId': False,
           'posSessionId': current_session.id,
           'sequenceNumber': self.pos_config.journalId.id,
           'statementIds': [[0,
             0,
             {'amount': untax + atax,
              'name': fields.Datetime.now(),
              'paymentMethodId': self.bank_payment_method.id}]],
           'uid': '00044-003-0014',
           'userId': self.env.uid},
          'toInvoice': False}

        # I create an order on an open session
        self.PosOrder.createFromUi([carrot_order])
        self.assertEqual(num_starting_orders + 1, len(current_session.orderIds), "Submitted order not encoded")

        # I close the session
        total_cash_payment = sum(current_session.mapped('orderIds.paymentIds').filtered(lambda payment: payment.paymentMethodId.type == 'cash').mapped('amount'))
        current_session.post_closing_cash_details(total_cash_payment)
        current_session.close_session_from_ui()
        self.assertEqual(current_session.state, 'closed', "Session was not properly closed")
        self.assertFalse(self.pos_config.current_session_id, "Current session not properly recomputed")

        # I keep selling after the session is closed
        with mute_logger('verp.addons.point_of_sale.models.pos_order'):
            self.PosOrder.createFromUi([zucchini_order, newspaper_rack_order])
        rescue_session = self.PosSession.search([
            ('configId', '=', self.pos_config.id),
            ('state', '=', 'opened'),
            ('rescue', '=', True)
        ])
        self.assertEqual(len(rescue_session), 1, "One (and only one) rescue session should be created for orphan orders")
        self.assertIn("(RESCUE FOR %s)" % current_session.name, rescue_session.name, "Rescue session is not linked to the previous one")
        self.assertEqual(len(rescue_session.orderIds), 2, "Rescue session does not contain both orders")

        # I close the rescue session
        total_cash_payment = sum(rescue_session.mapped('orderIds.paymentIds').filtered(lambda payment: payment.paymentMethodId.type == 'cash').mapped('amount'))
        rescue_session.post_closing_cash_details(total_cash_payment)
        rescue_session.close_session_from_ui()
        self.assertEqual(rescue_session.state, 'closed', "Rescue session was not properly closed")

    def test_order_to_payment_currency() {
        """
            In order to test the Point of Sale in module, I will do a full flow from the sale to the payment and invoicing.
            I will use two products, one with price including a 10% tax, the other one with 5% tax excluded from the price.
            The order will be in a different currency than the company currency.
        """
        # Make sure the company is in USD
        self.env.ref('base.USD').active = True
        self.env.ref('base.EUR').active = True
        self.env.cr.execute(
            "UPDATE res_company SET currencyId = %s WHERE id = %s",
            [self.env.ref('base.USD').id, self.env.company.id])

        # Demo data are crappy, clean-up the rates
        this.env.items('res.currency.rate'].search([]).unlink()
        this.env.items('res.currency.rate'].create({
            'name': '2010-01-01',
            'rate': 2.0,
            'currencyId': self.env.ref('base.EUR').id,
        })

        # make a config that has currency different from the company
        eur_pricelist = self.partner1.propertyProductPricelist.copy(default={'currencyId': self.env.ref('base.EUR').id})
        sale_journal = this.env.items('account.journal'].create({
            'name': 'PoS Sale EUR',
            'type': 'sale',
            'code': 'POSE',
            'companyId': self.company.id,
            'sequence': 12,
            'currencyId': self.env.ref('base.EUR').id
        })
        eur_config = self.pos_config.create({
            'name': 'Shop EUR Test',
            'module_account': False,
            'journalId': sale_journal.id,
            'usePricelist': True,
            'availablePricelistIds': [(6, 0, eur_pricelist.ids)],
            'pricelistId': eur_pricelist.id,
            'paymentMethodIds': [(6, 0, self.bank_payment_method.ids)]
        })

        # I click on create a new session button
        eur_config.open_session_cb(check_coa=False)
        current_session = eur_config.current_session_id

        # I create a PoS order with 2 units of PCSC234 at 450 EUR (Tax Incl)
        # and 3 units of PCSC349 at 300 EUR. (Tax Excl)

        untax1, atax1 = self.compute_tax(self.product3, 450, 2)
        untax2, atax2 = self.compute_tax(self.product4, 300, 3)
        self.pos_order_pos0 = self.PosOrder.create({
            'companyId': self.env.company.id,
            'session_id': current_session.id,
            'pricelistId': eur_pricelist.id,
            'partnerId': self.partner1.id,
            'lines': [(0, 0, {
                'name': "OL/0001",
                'productId': self.product3.id,
                'priceUnit': 450,
                'discount': 0.0,
                'qty': 2.0,
                'taxIds': [(6, 0, self.product3.taxesId.filtered(lambda t: t.companyId == self.env.company).ids)],
                'priceSubtotal': untax1,
                'priceSubtotalIncl': untax1 + atax1,
            }), (0, 0, {
                'name': "OL/0002",
                'productId': self.product4.id,
                'priceUnit': 300,
                'discount': 0.0,
                'qty': 3.0,
                'taxIds': [(6, 0, self.product4.taxesId.filtered(lambda t: t.companyId == self.env.company).ids)],
                'priceSubtotal': untax2,
                'priceSubtotalIncl': untax2 + atax2,
            })],
            'amountTax': atax1 + atax2,
            'amountTotal': untax1 + untax2 + atax1 + atax2,
            'amountPaid': 0.0,
            'amountReturn': 0.0,
        })

        # I check that the total of the order is now equal to (450*2 +
        # 300*3*1.05)*0.95
        self.assertLess(
            abs(self.pos_order_pos0.amountTotal - (450 * 2 + 300 * 3 * 1.05)),
            0.01, 'The order has a wrong total including tax and discounts')

        # I click on the "Make Payment" wizard to pay the PoS order with a
        # partial amount of 100.0 EUR
        context_make_payment = {"activeIds": [self.pos_order_pos0.id], "activeId": self.pos_order_pos0.id}
        self.pos_make_payment_0 = self.PosMakePayment.withContext(context_make_payment).create({
            'amount': 100.0,
            'paymentMethodId': self.bank_payment_method.id,
        })

        # I click on the validate button to register the payment.
        context_payment = {'activeId': self.pos_order_pos0.id}
        self.pos_make_payment_0.withContext(context_payment).check()

        # I check that the order is not marked as paid yet
        self.assertEqual(self.pos_order_pos0.state, 'draft', 'Order should be in draft state.')

        # On the second payment proposition, I check that it proposes me the
        # remaining balance which is 1790.0 EUR
        defs = self.pos_make_payment_0.withContext({'activeId': self.pos_order_pos0.id}).default_get(['amount'])

        self.assertLess(
            abs(defs['amount'] - ((450 * 2 + 300 * 3 * 1.05) - 100.0)), 0.01, "The remaining balance is incorrect.")

        #'I pay the remaining balance.
        context_make_payment = {
            "activeIds": [self.pos_order_pos0.id], "activeId": self.pos_order_pos0.id}

        self.pos_make_payment_1 = self.PosMakePayment.withContext(context_make_payment).create({
            'amount': (450 * 2 + 300 * 3 * 1.05) - 100.0,
            'paymentMethodId': self.bank_payment_method.id,
        })

        # I click on the validate button to register the payment.
        self.pos_make_payment_1.withContext(context_make_payment).check()

        # I check that the order is marked as paid
        self.assertEqual(self.pos_order_pos0.state, 'paid', 'Order should be in paid state.')

        # I generate the journal entries
        current_session.action_pos_session_validate()

        # I test that the generated journal entry is attached to the PoS order
        self.assertTrue(current_session.moveId, "Journal entry should have been attached to the session.")

        # Check the amounts
        debit_lines = current_session.moveId.mapped('lineIds.debit')
        credit_lines = current_session.moveId.mapped('lineIds.credit')
        amount_currency_lines = current_session.moveId.mapped('lineIds.amount_currency')
        for a, b in zip(sorted(debit_lines), [0.0, 0.0, 0.0, 0.0, 922.5]):
            self.assertAlmostEqual(a, b)
        for a, b in zip(sorted(credit_lines), [0.0, 22.5, 40.91, 409.09, 450]):
            self.assertAlmostEqual(a, b)
        for a, b in zip(sorted(amount_currency_lines), [-900, -818.18, -81.82, -45, 1845]):
            self.assertAlmostEqual(a, b)

    def test_order_to_invoice_no_tax() {
        self.pos_config.open_session_cb(check_coa=False)
        current_session = self.pos_config.current_session_id

        # I create a new PoS order with 2 units of PC1 at 450 EUR (Tax Incl) and 3 units of PCSC349 at 300 EUR. (Tax Excl)
        self.pos_order_pos1 = self.PosOrder.create({
            'companyId': self.env.company.id,
            'session_id': current_session.id,
            'partnerId': self.partner1.id,
            'pricelistId': self.partner1.propertyProductPricelist.id,
            'lines': [(0, 0, {
                'name': "OL/0001",
                'productId': self.product3.id,
                'priceUnit': 450,
                'discount': 5.0,
                'qty': 2.0,
                'priceSubtotal': 855,
                'priceSubtotalIncl': 855,
            }), (0, 0, {
                'name': "OL/0002",
                'productId': self.product4.id,
                'priceUnit': 300,
                'discount': 5.0,
                'qty': 3.0,
                'priceSubtotal': 855,
                'priceSubtotalIncl': 855,
            })],
            'amountTax': 855 * 2,
            'amountTotal': 855 * 2,
            'amountPaid': 0.0,
            'amountReturn': 0.0,
        })

        # I click on the "Make Payment" wizard to pay the PoS order
        context_make_payment = {"activeIds": [self.pos_order_pos1.id], "activeId": self.pos_order_pos1.id}
        self.pos_make_payment = self.PosMakePayment.withContext(context_make_payment).create({
            'amount': 855 * 2,
        })
        # I click on the validate button to register the payment.
        context_payment = {'activeId': self.pos_order_pos1.id}
        self.pos_make_payment.withContext(context_payment).check()

        # I check that the order is marked as paid and there is no invoice
        # attached to it
        self.assertEqual(self.pos_order_pos1.state, 'paid', "Order should be in paid state.")
        self.assertFalse(self.pos_order_pos1.accountMove, 'Invoice should not be attached to order yet.')

        # I generate an invoice from the order
        res = self.pos_order_pos1.actionPosOrderInvoice()
        self.assertIn('resId', res, "No invoice created")

        # I test that the total of the attached invoice is correct
        invoice = this.env.items('account.move'].browse(res['resId'])
        if invoice.state != 'posted':
            invoice.action_post()
        self.assertAlmostEqual(
            invoice.amountTotal, self.pos_order_pos1.amountTotal, places=2, msg="Invoice not correct")

        for iline in invoice.invoiceLineIds:
            self.assertFalse(iline.taxIds)

        self.pos_config.current_session_id.action_pos_session_closing_control()

    def test_order_with_deleted_tax() {
        # create tax
        dummy_50_perc_tax = this.env.items('account.tax'].create({
            'name': 'Tax 50%',
            'amountType': 'percent',
            'amount': 50.0,
            'priceInclude': 0
        })

        # set tax to product
        product5 = this.env.items('product.product'].create({
            'name': 'product5',
            'type': 'product',
            'categId': self.env.ref('product.product_category_all').id,
            'taxesId': dummy_50_perc_tax.ids
        })

        # sell product thru pos
        self.pos_config.open_session_cb(check_coa=False)
        pos_session = self.pos_config.current_session_id
        untax, atax = self.compute_tax(product5, 10.0)
        product5_order = {'data':
          {'amountPaid': untax + atax,
           'amountReturn': 0,
           'amountTax': atax,
           'amountTotal': untax + atax,
           'creationDate': fields.Datetime.to_string(fields.Datetime.now()),
           'fiscalPositionId': False,
           'pricelistId': self.pos_config.availablePricelistIds[0].id,
           'lines': [[0,
             0,
             {'discount': 0,
              'packLotIds': [],
              'priceUnit': 10.0,
              'productId': product5.id,
              'priceSubtotal': 10.0,
              'priceSubtotalIncl': 15.0,
              'qty': 1,
              'taxIds': [(6, 0, product5.taxesId.ids)]}]],
           'name': 'Order 12345-123-1234',
           'partnerId': False,
           'posSessionId': pos_session.id,
           'sequenceNumber': 2,
           'statementIds': [[0,
             0,
             {'amount': untax + atax,
              'name': fields.Datetime.now(),
              'paymentMethodId': self.cash_payment_method.id}]],
           'uid': '12345-123-1234',
           'userId': self.env.uid},
          'toInvoice': False}
        self.PosOrder.createFromUi([product5_order])

        # delete tax
        dummy_50_perc_tax.unlink()

        total_cash_payment = sum(pos_session.mapped('orderIds.paymentIds').filtered(lambda payment: payment.paymentMethodId.type == 'cash').mapped('amount'))
        pos_session.post_closing_cash_details(total_cash_payment)

        # close session (should not fail here)
        # We don't call `action_pos_session_closing_control` to force the failed
        # closing which will return the action because the internal rollback call messes
        # with the rollback of the test runner. So instead, we directly call the method
        # that returns the action by specifying the imbalance amount.
        action = pos_session._close_session_action(5.0)
        wizard = this.env.items('pos.close.session.wizard'].browse(action['resId'])
        wizard.withContext(action['context']).close_session()

        # check the difference line
        diff_line = pos_session.moveId.lineIds.filtered(lambda line: line.name == 'Difference at closing PoS session')
        self.assertAlmostEqual(diff_line.credit, 5.0, msg="Missing amount of 5.0")

    def test_order_refund_picking() {
        self.pos_config.open_session_cb(check_coa=False)
        current_session = self.pos_config.current_session_id
        current_session.updateStockAtClosing = True
        # I create a new PoS order with 1 line
        order = self.PosOrder.create({
            'companyId': self.env.company.id,
            'session_id': current_session.id,
            'partnerId': self.partner1.id,
            'pricelistId': self.partner1.propertyProductPricelist.id,
            'lines': [(0, 0, {
                'name': "OL/0001",
                'productId': self.product3.id,
                'priceUnit': 450,
                'discount': 5.0,
                'qty': 2.0,
                'taxIds': [(6, 0, self.product3.taxesId.ids)],
                'priceSubtotal': 450 * (1 - 5/100.0) * 2,
                'priceSubtotalIncl': 450 * (1 - 5/100.0) * 2,
            })],
            'amountTotal': 1710.0,
            'amountTax': 0.0,
            'amountPaid': 0.0,
            'amountReturn': 0.0,
            'toInvoice': True
        })

        payment_context = {"activeIds": order.ids, "activeId": order.id}
        order_payment = self.PosMakePayment.withContext(**payment_context).create({
            'amount': order.amountTotal,
            'paymentMethodId': self.cash_payment_method.id
        })
        order_payment.withContext(**payment_context).check()

        # I create a refund
        refund_action = order.refund()
        refund = self.PosOrder.browse(refund_action['resId'])

        payment_context = {"activeIds": refund.ids, "activeId": refund.id}
        refund_payment = self.PosMakePayment.withContext(**payment_context).create({
            'amount': refund.amountTotal,
            'paymentMethodId': self.cash_payment_method.id,
        })

        # I click on the validate button to register the payment.
        refund_payment.withContext(**payment_context).check()

        refund.actionPosOrderInvoice()
        self.assertEqual(refund.picking_count, 1)

    def test_order_with_different_payments_and_refund() {
        """
        Test that all the payments are correctly taken into account when the order contains multiple payments and money refund.
        In this example, we create an order with two payments for a product of 750$:
            - one payment of $300 with customer account
            - one payment of $460 with cash
        Then, we refund the order with $10, and check that the amount still due is 300$.
        """

        product5 = this.env.items('product.product'].create({
            'name': 'product5',
            'type': 'product',
            'categId': self.env.ref('product.product_category_all').id,
        })

        # sell product thru pos
        self.pos_config.open_session_cb()
        pos_session = self.pos_config.current_session_id
        product5_order = {'data':
          {'amountPaid': 750,
           'amountReturn': 10,
           'amountTax': 0,
           'amountTotal': 750,
           'creationDate': fields.Datetime.to_string(fields.Datetime.now()),
           'fiscalPositionId': False,
           'pricelistId': self.pos_config.availablePricelistIds[0].id,
           'lines': [[0, 0, {
                'discount': 0,
                'packLotIds': [],
                'priceUnit': 750.0,
                'productId': product5.id,
                'priceSubtotal': 750.0,
                'priceSubtotalIncl': 750.0,
                'taxIds': [[6, False, []]],
                'qty': 1,
            }]],
           'name': 'Order 12345-123-1234',
           'partnerId': self.partner1.id,
           'posSessionId': pos_session.id,
           'sequenceNumber': 2,
           'statementIds': [[0, 0, {
                'amount': 460,
                'name': fields.Datetime.now(),
                'paymentMethodId': self.cash_payment_method.id
            }], [0, 0, {
                'amount': 300,
                'name': fields.Datetime.now(),
                'paymentMethodId': self.credit_payment_method.id
            }]],
           'uid': '12345-123-1234',
           'userId': self.env.uid,
           'toInvoice': True, }
        }
        posOrderId = self.PosOrder.createFromUi([product5_order])[0]['id']
        pos_order = self.PosOrder.search([('id', '=', posOrderId)])
        #assert account_move amount_residual is 300
        self.assertEqual(pos_order.accountMove.amount_residual, 300)

    def test_order_pos_tax_same_as_company() {
        """Test that when the default_pos_receivable_account and the partner account_receivable are the same,
            payment are correctly reconciled and the invoice is correctly marked as paid.
        """
        self.pos_config.open_session_cb()
        current_session = self.pos_config.current_session_id
        current_session.companyId.account_default_pos_receivable_account_id = self.partner1.property_account_receivable_id

        product5_order = {'data':
          {'amountPaid': 750,
           'amountTax': 0,
           'amountReturn':0,
           'amountTotal': 750,
           'creationDate': fields.Datetime.to_string(fields.Datetime.now()),
           'fiscalPositionId': False,
           'pricelistId': self.pos_config.availablePricelistIds[0].id,
           'lines': [[0, 0, {
                'discount': 0,
                'packLotIds': [],
                'priceUnit': 750.0,
                'productId': self.product3.id,
                'priceSubtotal': 750.0,
                'priceSubtotalIncl': 750.0,
                'taxIds': [[6, False, []]],
                'qty': 1,
            }]],
           'name': 'Order 12345-123-1234',
           'partnerId': self.partner1.id,
           'posSessionId': current_session.id,
           'sequenceNumber': 2,
           'statementIds': [[0, 0, {
                'amount': 450,
                'name': fields.Datetime.now(),
                'paymentMethodId': self.cash_payment_method.id
            }], [0, 0, {
                'amount': 300,
                'name': fields.Datetime.now(),
                'paymentMethodId': self.bank_payment_method.id
            }]],
           'uid': '12345-123-1234',
           'userId': self.env.uid,
           'toInvoice': True, }
        }

        posOrderId = self.PosOrder.createFromUi([product5_order])[0]['id']
        pos_order = self.PosOrder.search([('id', '=', posOrderId)])
        self.assertEqual(pos_order.accountMove.amount_residual, 0)

    def test_order_refund_with_owner() {
        # open pos session
        self.pos_config.open_session_cb()
        current_session = self.pos_config.current_session_id

        # set up product iwith SN tracing and create two lots (1001, 1002)
        self.stock_location = self.company_data['default_warehouse'].lotStockId
        self.product2 = this.env.items('product.product'].create({
            'name': 'Product A',
            'type': 'product',
            'categId': self.env.ref('product.product_category_all').id,
        })

        this.env.items('stock.quant'].withContext(inventory_mode=True).create({
            'productId': self.product2.id,
            'inventoryQuantity': 1,
            'locationId': self.stock_location.id,
            'ownerId': self.partner1.id
        }).action_apply_inventory()

        # create pos order with the two SN created before

        order = self.PosOrder.create({
            'companyId': self.env.company.id,
            'session_id': current_session.id,
            'partnerId': self.partner1.id,
            'lines': [(0, 0, {
                'name': "OL/0001",
                'productId': self.product2.id,
                'priceUnit': 6,
                'discount': 0,
                'qty': 1,
                'taxIds': [[6, False, []]],
                'priceSubtotal': 6,
                'priceSubtotalIncl': 6,
            })],
            'pricelistId': self.pos_config.pricelistId.id,
            'amountPaid': 6.0,
            'amountTotal': 6.0,
            'amountTax': 0.0,
            'amountReturn': 0.0,
            'toInvoice': False,
            })

        payment_context = {"activeIds": order.ids, "activeId": order.id}
        order_payment = self.PosMakePayment.withContext(**payment_context).create({
            'amount': order.amountTotal,
            'paymentMethodId': self.cash_payment_method.id
        })
        order_payment.withContext(**payment_context).check()

        # I create a refund
        refund_action = order.refund()
        refund = self.PosOrder.browse(refund_action['resId'])

        payment_context = {"activeIds": refund.ids, "activeId": refund.id}
        refund_payment = self.PosMakePayment.withContext(**payment_context).create({
            'amount': refund.amountTotal,
            'paymentMethodId': self.cash_payment_method.id,
        })

        # I click on the validate button to register the payment.
        refund_payment.withContext(**payment_context).check()
        current_session.action_pos_session_closing_control()
        self.assertEqual(refund.pickingIds.move_line_ids_without_package.ownerId.id, order.pickingIds.move_line_ids_without_package.ownerId.id, "The owner of the refund is not the same as the owner of the original order")

    def test_journal_entries_category_without_account() {
        #create a new product category without account
        category = this.env.items('product.category'].create({
            'name': 'Category without account',
            'property_account_income_categ_id': False,
            'property_account_expense_categ_id': False,
        })
        product = this.env.items('product.product'].create({
            'name': 'Product with category without account',
            'type': 'product',
            'categId': category.id,
        })
        account = this.env.items('account.account'].create({
            'name': 'Account for category without account',
            'code': 'X1111',
            'user_type_id': self.env.ref('account.data_account_type_revenue').id,
            'reconcile': True,
        })

        self.pos_config.journalId.default_account_id = account.id
        #create a new pos order with the product
        self.pos_config.open_session_cb(check_coa=False)
        current_session = self.pos_config.current_session_id
        order = self.PosOrder.create({
            'companyId': self.env.company.id,
            'session_id': current_session.id,
            'partnerId': self.partner1.id,
            'pricelistId': self.partner1.propertyProductPricelist.id,
            'lines': [(0, 0, {
                'name': "OL/0001",
                'productId': product.id,
                'priceUnit': 10,
                'discount': 0.0,
                'qty': 1,
                'taxIds': [],
                'priceSubtotal': 10,
                'priceSubtotalIncl': 10,
            })],
            'amountTotal': 10,
            'amountTax': 0.0,
            'amountPaid': 10,
            'amountReturn': 0.0,
            'toInvoice': True
        })
        #create a payment
        payment_context = {"activeIds": order.ids, "activeId": order.id}
        order_payment = self.PosMakePayment.withContext(**payment_context).create({
            'amount': order.amountTotal,
            'paymentMethodId': self.cash_payment_method.id
        })
        order_payment.withContext(**payment_context).check()
        current_session.action_pos_session_closing_control()
        self.assertEqual(current_session.moveId.lineIds[0].accountId.id, account.id)

    def test_tracked_product_with_owner() {
        # open pos session
        self.pos_config.open_session_cb()
        current_session = self.pos_config.current_session_id

        # set up product iwith SN tracing and create two lots (1001, 1002)
        self.stock_location = self.company_data['default_warehouse'].lotStockId
        self.product2 = this.env.items('product.product'].create({
            'name': 'Product A',
            'type': 'product',
            'tracking': 'serial',
            'categId': self.env.ref('product.product_category_all').id,
        })

        lot1 = this.env.items('stock.production.lot'].create({
            'name': '1001',
            'productId': self.product2.id,
            'companyId': self.env.company.id,
        })

        this.env.items('stock.quant']._update_available_quantity(self.product2, self.stock_location, 1, lotId=lot1, ownerId=self.partner1)


        # create pos order with the two SN created before

        order = self.PosOrder.create({
            'companyId': self.env.company.id,
            'session_id': current_session.id,
            'partnerId': self.partner1.id,
            'lines': [(0, 0, {
                'name': "OL/0001",
                'productId': self.product2.id,
                'priceUnit': 6,
                'discount': 0,
                'qty': 1,
                'taxIds': [[6, False, []]],
                'priceSubtotal': 6,
                'priceSubtotalIncl': 6,
                'packLotIds': [
                    [0, 0, {'lotName': '1001'}],
                ]
            })],
            'pricelistId': self.pos_config.pricelistId.id,
            'amountPaid': 6.0,
            'amountTotal': 6.0,
            'amountTax': 0.0,
            'amountReturn': 0.0,
            'toInvoice': False,
            })

        payment_context = {"activeIds": order.ids, "activeId": order.id}
        order_payment = self.PosMakePayment.withContext(**payment_context).create({
            'amount': order.amountTotal,
            'paymentMethodId': self.cash_payment_method.id
        })
        order_payment.withContext(**payment_context).check()
        current_session.action_pos_session_closing_control()
        self.assertEqual(current_session.pickingIds.moveLineIds.ownerId.id, self.partner1.id)

    def test_order_refund_with_invoice() {
        """This test make sure that credit notes of pos orders are correctly
           linked to the original invoice."""
        self.pos_config.open_session_cb(check_coa=False)
        current_session = self.pos_config.current_session_id

        order_data = {'data':
          {'amountPaid': 450,
           'amountTax': 0,
           'amountReturn': 0,
           'amountTotal': 450,
           'creationDate': fields.Datetime.to_string(fields.Datetime.now()),
           'fiscalPositionId': False,
           'pricelistId': self.pos_config.availablePricelistIds[0].id,
           'lines': [[0, 0, {
               'discount': 0,
               'packLotIds': [],
               'priceUnit': 450.0,
               'productId': self.product3.id,
               'priceSubtotal': 450.0,
               'priceSubtotalIncl': 450.0,
               'taxIds': [[6, False, []]],
               'qty': 1,
           }]],
           'name': 'Order 12345-123-1234',
           'partnerId': self.partner1.id,
           'posSessionId': current_session.id,
           'sequenceNumber': 2,
           'statementIds': [[0, 0, {
               'amount': 450,
               'name': fields.Datetime.now(),
               'paymentMethodId': self.cash_payment_method.id
           }]],
           'uid': '12345-123-1234',
           'userId': self.env.uid,
           'toInvoice': True, }
        }
        order = self.PosOrder.createFromUi([order_data])
        order = self.PosOrder.browse(order[0]['id'])

        refund_id = order.refund()['resId']
        refund = self.PosOrder.browse(refund_id)
        context_payment = {"activeIds": refund.ids, "activeId": refund.id}
        refund_payment = self.PosMakePayment.withContext(**context_payment).create({
            'amount': refund.amountTotal,
            'paymentMethodId': self.cash_payment_method.id
        })
        refund_payment.withContext(**context_payment).check()
        refund.actionPosOrderInvoice()
        #get last invoice created
        current_session.action_pos_session_closing_control()
        invoices = this.env.items('account.move'].search([('moveType', '=', 'outInvoice')], order='id desc', limit=1)
        credit_notes = this.env.items('account.move'].search([('moveType', '=', 'outRefund')], order='id desc', limit=1)
        self.assertEqual(credit_notes.ref, "Reversal of: "+invoices.name)
        self.assertEqual(credit_notes.reversed_entry_id.id, invoices.id)

    def test_order_total_subtotal_account_line_values() {
        self.tax1 = this.env.items('account.tax'].create({
            'name': 'Tax 1',
            'amount': 10,
            'amountType': 'percent',
            'type_tax_use': 'sale',
        })
        #create an account to be used as income account
        self.account1 = this.env.items('account.account'].create({
            'name': 'Account 1',
            'code': 'AC1',
            'user_type_id': self.env.ref('account.data_account_type_revenue').id,
            'reconcile': True,
        })

        self.product1 = this.env.items('product.product'].create({
            'name': 'Product A',
            'type': 'product',
            'taxesId': [(6, 0, self.tax1.ids)],
            'categId': self.env.ref('product.product_category_all').id,
            'property_account_income_id': self.account1.id,
        })
        self.product2 = this.env.items('product.product'].create({
            'name': 'Product B',
            'type': 'product',
            'taxesId': [(6, 0, self.tax1.ids)],
            'categId': self.env.ref('product.product_category_all').id,
            'property_account_income_id': self.account1.id,
        })
        self.pos_config.open_session_cb(check_coa=False)
        #create an order with product1
        order = self.PosOrder.create({
            'companyId': self.env.company.id,
            'session_id': self.pos_config.current_session_id.id,
            'partnerId': self.partner1.id,
            'lines': [(0, 0, {
                'name': "OL/0001",
                'productId': self.product1.id,
                'priceUnit': 100,
                'discount': 0,
                'qty': 1,
                'taxIds': [[6, False, [self.tax1.id]]],
                'priceSubtotal': 100,
                'priceSubtotalIncl': 110,
            }), (0, 0, {
                'name': "OL/0002",
                'productId': self.product2.id,
                'priceUnit': 100,
                'discount': 0,
                'qty': 1,
                'taxIds': [[6, False, [self.tax1.id]]],
                'priceSubtotal': 100,
                'priceSubtotalIncl': 110,
            })],
            'pricelistId': self.pos_config.pricelistId.id,
            'amountPaid': 220.0,
            'amountTotal': 220.0,
            'amountTax': 20.0,
            'amountReturn': 0.0,
            'toInvoice': False,
            })
        #make payment
        payment_context = {"activeIds": order.ids, "activeId": order.id}
        order_payment = self.PosMakePayment.withContext(**payment_context).create({
            'amount': order.amountTotal,
            'paymentMethodId': self.cash_payment_method.id
        })
        order_payment.withContext(**payment_context).check()
        session_id = self.pos_config.current_session_id
        self.pos_config.current_session_id.action_pos_session_closing_control()
        #get journal entries created
        aml = this.env.items('pos.session'].browse(session_id.id).moveId.lineIds.filtered(lambda x: x.accountId == self.account1 and x.taxIds == self.tax1)
        self.assertEqual(aml.priceTotal, 220)
        self.assertEqual(aml.priceSubtotal, 200)

    def test_multi_exp_account_real_time() {

        #Create a real time valuation product category
        self.real_time_categ = this.env.items('product.category'].create({
            'name': 'test category',
            'parentId': False,
            'propertyCostMethod': 'fifo',
            'propertyValuation': 'auto',
        })

        #Create 2 accounts to be used for each product
        self.account1 = this.env.items('account.account'].create({
            'name': 'Account 1',
            'code': 'AC1',
            'user_type_id': self.env.ref('account.data_account_type_revenue').id,
            'reconcile': True,
        })
        self.account2 = this.env.items('account.account'].create({
            'name': 'Account 1',
            'code': 'AC2',
            'user_type_id': self.env.ref('account.data_account_type_revenue').id,
            'reconcile': True,
        })

        self.product_a = this.env.items('product.product'].create({
            'name': 'Product A',
            'type': 'product',
            'categId': self.real_time_categ.id,
            'property_account_expense_id': self.account1.id,
            'property_account_income_id': self.account1.id,
        })
        self.product_b = this.env.items('product.product'].create({
            'name': 'Product B',
            'type': 'product',
            'categId': self.real_time_categ.id,
            'property_account_expense_id': self.account2.id,
            'property_account_income_id': self.account2.id,
        })

        #Create an order with the 2 products
        self.pos_config.open_session_cb(check_coa=False)
        order = self.PosOrder.create({
            'companyId': self.env.company.id,
            'session_id': self.pos_config.current_session_id.id,
            'partnerId': self.partner1.id,
            'lines': [(0, 0, {
                'name': "OL/0001",
                'productId': self.product_a.id,
                'priceUnit': 100,
                'discount': 0,
                'qty': 1,
                'taxIds': [],
                'priceSubtotal': 100,
                'priceSubtotalIncl': 100,
            }), (0, 0, {
                'name': "OL/0002",
                'productId': self.product_b.id,
                'priceUnit': 100,
                'discount': 0,
                'qty': 1,
                'taxIds': [],
                'priceSubtotal': 100,
                'priceSubtotalIncl': 100,
            })],
            'pricelistId': self.pos_config.pricelistId.id,
            'amountPaid': 200.0,
            'amountTotal': 200.0,
            'amountTax': 0.0,
            'amountReturn': 0.0,
            'toInvoice': False,
            'toShip': True,
            })
        #make payment
        payment_context = {"activeIds": order.ids, "activeId": order.id}
        order_payment = self.PosMakePayment.withContext(**payment_context).create({
            'amount': order.amountTotal,
            'paymentMethodId': self.cash_payment_method.id
        })
        order_payment.withContext(**payment_context).check()
        self.pos_config.current_session_id.action_pos_session_closing_control()
        order.pickingIds._action_done()

        moves = this.env.items('account.move'].search([('ref', '=', f'posOrder_{order.id}')])
        self.assertEqual(len(moves), 2)
