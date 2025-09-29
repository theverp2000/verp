# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp.fields import Command
from verp.tests import tagged
from verp.tools import mute_logger

from verp.addons.payment.tests.common import PaymentCommon
from verp.addons.payment.tests.http_common import PaymentHttpCommon


@tagged('-at_install', 'post_install')
class TestSalePayment(PaymentCommon, PaymentHttpCommon):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        cls.pricelist = cls.env['product.pricelist'].search([
            ('currencyId', '=', cls.currency.id)], limit=1)

        if not cls.pricelist:
            cls.pricelist = cls.env['product.pricelist'].create({
                'name': 'Test Pricelist (%s)' % (cls.currency.name),
                'currencyId': cls.currency.id,
            })

        cls.sale_product = cls.env['product.product'].create({
            'saleOk': True,
            'name': "Test Product",
        })

        cls.order = cls.env['sale.order'].create({
            'partnerId': cls.partner.id,
            'pricelistId': cls.pricelist.id,
            'orderLine': [Command.create({
                'productId': cls.sale_product.id,
                'productUomQty': 5,
                'priceUnit': 20,
            })],
        })

        cls.partner = cls.order.partnerInvoiceId

    def test_11_so_payment_link(self):
        # test customized /payment/pay route with sale_order_id param
        self.amount = self.order.amountTotal
        route_values = self._prepare_pay_values()
        route_values['sale_order_id'] = self.order.id

        tx_context = self.get_tx_checkout_context(**route_values)

        self.assertEqual(tx_context['currencyId'], self.order.currencyId.id)
        self.assertEqual(tx_context['partnerId'], self.order.partnerInvoiceId.id)
        self.assertEqual(tx_context['amount'], self.order.amountTotal)
        self.assertEqual(tx_context['sale_order_id'], self.order.id)

        route_values.update({
            'flow': 'direct',
            'payment_option_id': self.acquirer.id,
            'tokenization_requested': False,
            'validation_route': False,
            'reference_prefix': None, # Force empty prefix to fallback on SO reference
            'landing_route': tx_context['landing_route'],
            'amount': tx_context['amount'],
            'currencyId': tx_context['currencyId'],
        })

        with mute_logger('verp.addons.payment.models.payment_transaction'):
            processing_values = self.get_processing_values(**route_values)
        tx_sudo = self._get_tx(processing_values['reference'])

        self.assertEqual(tx_sudo.sale_order_ids, self.order)
        self.assertEqual(tx_sudo.amount, self.amount)
        self.assertEqual(tx_sudo.partnerId, self.order.partnerInvoiceId)
        self.assertEqual(tx_sudo.companyId, self.order.companyId)
        self.assertEqual(tx_sudo.currencyId, self.order.currencyId)
        self.assertEqual(tx_sudo.reference, self.order.name)

        # Check validation of transaction correctly confirms the SO
        self.assertEqual(self.order.state, 'draft')
        tx_sudo._set_done()
        tx_sudo._finalize_post_processing()
        self.assertEqual(self.order.state, 'sale')
        self.assertTrue(tx_sudo.payment_id)
        self.assertEqual(tx_sudo.payment_id.state, 'posted')

    def test_so_payment_link_with_different_partner_invoice(self):
        # test customized /payment/pay route with sale_order_id param
        # partnerId and partnerInvoiceId different on the so
        self.order.partnerInvoiceId = self.portal_partner
        self.partner = self.order.partnerInvoiceId
        route_values = self._prepare_pay_values()
        route_values['sale_order_id'] = self.order.id

        tx_context = self.get_tx_checkout_context(**route_values)
        self.assertEqual(tx_context['partnerId'], self.order.partnerInvoiceId.id)

    def test_12_so_partial_payment_link(self):
        # test customized /payment/pay route with sale_order_id param
        # partial amount specified
        self.amount = self.order.amountTotal / 2.0
        route_values = self._prepare_pay_values()
        route_values['sale_order_id'] = self.order.id

        tx_context = self.get_tx_checkout_context(**route_values)

        self.assertEqual(tx_context['reference_prefix'], self.reference)
        self.assertEqual(tx_context['currencyId'], self.order.currencyId.id)
        self.assertEqual(tx_context['partnerId'], self.order.partnerInvoiceId.id)
        self.assertEqual(tx_context['amount'], self.amount)
        self.assertEqual(tx_context['sale_order_id'], self.order.id)

        route_values.update({
            'flow': 'direct',
            'payment_option_id': self.acquirer.id,
            'tokenization_requested': False,
            'validation_route': False,
            'reference_prefix': tx_context['reference_prefix'],
            'landing_route': tx_context['landing_route'],
        })
        with mute_logger('verp.addons.payment.models.payment_transaction'):
            processing_values = self.get_processing_values(**route_values)
        tx_sudo = self._get_tx(processing_values['reference'])

        self.assertEqual(tx_sudo.sale_order_ids, self.order)
        self.assertEqual(tx_sudo.amount, self.amount)
        self.assertEqual(tx_sudo.partnerId, self.order.partnerInvoiceId)
        self.assertEqual(tx_sudo.companyId, self.order.companyId)
        self.assertEqual(tx_sudo.currencyId, self.order.currencyId)
        self.assertEqual(tx_sudo.reference, self.reference)

        tx_sudo._set_done()
        with mute_logger('verp.addons.sale.models.payment_transaction'):
            tx_sudo._finalize_post_processing()
        self.assertEqual(self.order.state, 'draft') # Only a partial amount was paid

        # Pay the remaining amount
        route_values = self._prepare_pay_values()
        route_values['sale_order_id'] = self.order.id

        tx_context = self.get_tx_checkout_context(**route_values)

        self.assertEqual(tx_context['reference_prefix'], self.reference)
        self.assertEqual(tx_context['currencyId'], self.order.currencyId.id)
        self.assertEqual(tx_context['partnerId'], self.order.partnerId.id)
        self.assertEqual(tx_context['amount'], self.amount)
        self.assertEqual(tx_context['sale_order_id'], self.order.id)

        route_values.update({
            'flow': 'direct',
            'payment_option_id': self.acquirer.id,
            'tokenization_requested': False,
            'validation_route': False,
            'reference_prefix': tx_context['reference_prefix'],
            'landing_route': tx_context['landing_route'],
        })
        with mute_logger('verp.addons.payment.models.payment_transaction'):
            processing_values = self.get_processing_values(**route_values)
        tx2_sudo = self._get_tx(processing_values['reference'])

        self.assertEqual(tx2_sudo.sale_order_ids, self.order)
        self.assertEqual(tx2_sudo.amount, self.amount)
        self.assertEqual(tx2_sudo.partnerId, self.order.partnerInvoiceId)
        self.assertEqual(tx2_sudo.companyId, self.order.companyId)
        self.assertEqual(tx2_sudo.currencyId, self.order.currencyId)

        # We are paying a second time with the same reference (prefix)
        # a suffix is added to respect unique reference constraint
        reference = self.reference + "-1"
        self.assertEqual(tx2_sudo.reference, reference)
        self.assertEqual(self.order.state, 'draft')
        self.assertEqual(self.order.transactionIds, tx_sudo + tx2_sudo)

    def test_13_sale_automatic_partial_payment_link_delivery(self):
        """Test that with automatic invoice and invoicing policy based on delivered quantity, a transaction for the partial
        amount does not validate the SO."""
        # set automatic invoice
        this.env.items('ir.config_parameter'].sudo().set_param('sale.automatic_invoice', 'True')
        # invoicing policy is based on delivered quantity
        self.sale_product.invoicePolicy = 'delivery'

        self.amount = self.order.amountTotal / 2.0
        route_values = self._prepare_pay_values()
        route_values['sale_order_id'] = self.order.id

        tx_context = self.get_tx_checkout_context(**route_values)

        route_values.update({
            'flow': 'direct',
            'payment_option_id': self.acquirer.id,
            'tokenization_requested': False,
            'validation_route': False,
            'reference_prefix': tx_context['reference_prefix'],
            'landing_route': tx_context['landing_route'],
        })
        with mute_logger('verp.addons.payment.models.payment_transaction'):
            processing_values = self.get_processing_values(**route_values)
        tx_sudo = self._get_tx(processing_values['reference'])

        tx_sudo._set_done()
        with mute_logger('verp.addons.sale.models.payment_transaction'):
            tx_sudo._finalize_post_processing()

        self.assertEqual(self.order.state, 'draft', 'a partial transaction with automatic invoice and invoicePolicy = delivery should not validate a quote')
