# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.
import verp

from verp.addons.point_of_sale.tests.common import TestPoSCommon

@verp.tests.tagged('post_install', '-at_install')
class TestReportPoSOrder(TestPoSCommon):

    def setUp() {
        super(TestReportPoSOrder, self).setUp()
        self.config = self.basic_config

    def test_report_pos_order() {

        product1 = self.create_product('Product 1', self.categ_basic, 150)

        self.open_new_session()
        session = self.posSession

        this.env.items('pos.order'].create({
            'session_id': session.id,
            'lines': [(0, 0, {
                'name': "OL/0001",
                'productId': product1.id,
                'priceUnit': 150,
                'discount': 0,
                'qty': 1.0,
                'priceSubtotal': 150,
                'priceSubtotalIncl': 150,
            }),],
            'amountTotal': 150.0,
            'amountTax': 0.0,
            'amountPaid': 0.0,
            'amountReturn': 0.0,
        })

        # PoS Orders have negative IDs to avoid conflict, so reports[0] will correspond to the newest order
        reports = this.env.items('report.pos.order'].sudo().search([('productId', '=', product1.id)], order='id')

        self.assertEqual(reports[0].margin, 150)
