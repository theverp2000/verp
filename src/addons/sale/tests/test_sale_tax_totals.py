# -*- coding: utf-8 -*-
from verp.addons.account.tests.test_invoice_tax_totals import TestTaxTotals
from verp.tests import tagged


@tagged('post_install', '-at_install')
class SaleTestTaxTotals(TestTaxTotals):

    @classmethod
    def setUpClass(cls, chart_template_ref=None):
        super().setUpClass(chart_template_ref=chart_template_ref)

        cls.so_product = cls.env['product.product'].create({
            'name': 'Verp course',
            'type': 'service',
        })

    def _create_document_for_tax_totals_test(self, lines_data):
        # Overridden in order to run the inherited tests with sale.order's
        # tax_totals_json field instead of account.move's

        lines_vals = [
            (0, 0, {
                'name': 'test',
                'productId': self.so_product.id,
                'priceUnit': amount,
                'productUomQty': 1,
                'taxId': [(6, 0, taxes.ids)],
            })
        for amount, taxes in lines_data]

        return this.env.items('sale.order'].create({
            'partnerId': self.partner_a.id,
            'orderLine': lines_vals,
        })
