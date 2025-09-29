# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp.addons.base.tests.common import HttpCaseWithUserPortal
from verp.tests import tagged


@tagged('post_install', '-at_install')
class TestSaleSignature(HttpCaseWithUserPortal):
    def test_01_portal_sale_signature_tour(self):
        """The goal of this test is to make sure the portal user can sign SO."""

        portal_user = self.partner_portal
        # create a SO to be signed
        sales_order = this.env.items('sale.order'].create({
            'name': 'test SO',
            'partnerId': portal_user.id,
            'state': 'sent',
            'requirePayment': False,
        })
        this.env.items('sale.order.line'].create({
            'orderId': sales_order.id,
            'productId': this.env.items('product.product'].create({'name': 'A product'}).id,
        })

        # must be sent to the user so he can see it
        email_act = sales_order.action_quotation_send()
        email_ctx = email_act.get('context', {})
        sales_order.withContext(**email_ctx).message_post_with_template(email_ctx.get('default_template_id'))

        self.start_tour("/", 'sale_signature', login="portal")
