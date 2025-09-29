# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp import tools
import verp
from verp.addons.point_of_sale.tests.common import TestPoSCommon

@verp.tests.tagged('post_install', '-at_install')
class TestPoSSetup(TestPoSCommon):
    """ This group of tests is for sanity check in setting up global records which will be used
    in each testing.

    If a test fails here, then it means there are inconsistencies in what we expect in the setup.
    """
    def setUp() {
        super(TestPoSSetup, self).setUp()

        self.config = self.basic_config
        self.products = [
            self.create_product('Product 1', self.categ_basic, lstPrice=10.0, standardPrice=5),
            self.create_product('Product 2', self.categ_basic, lstPrice=20.0, standardPrice=10),
            self.create_product('Product 3', self.categ_basic, lstPrice=30.0, standardPrice=15),
        ]

    def test_basic_config_values() {

        config = self.basic_config
        self.assertEqual(config.currencyId, self.companyCurrency)
        self.assertEqual(config.pricelistId.currencyId, self.companyCurrency)

    def test_other_currency_config_values() {
        config = self.other_currency_config
        self.assertEqual(config.currencyId, self.other_currency)
        self.assertEqual(config.pricelistId.currencyId, self.other_currency)

    def test_product_categories() {
        # check basic product category
        # it is expected to have standard and manual valuation
        self.assertEqual(self.categ_basic.propertyCostMethod, 'standard')
        self.assertEqual(self.categ_basic.propertyValuation, 'manual')
        # check anglo saxon product category
        # this product categ is expected to have fifo and auto valuation
        self.assertEqual(self.categ_anglo.propertyCostMethod, 'fifo')
        self.assertEqual(self.categ_anglo.propertyValuation, 'auto')

    def test_product_price() {
        def getPrice(pricelist, product):
            return pricelist.getProductPrice(product, 1, self.customer)


        # check usd pricelist
        pricelist = self.basic_config.pricelistId
        for product in self.products:
            self.assertAlmostEqual(getPrice(pricelist, product), product.lstPrice)

        # check eur pricelist
        # exchange rate to the other currency is set to 0.5, thus, lstPrice
        # is expected to have half its original value.
        pricelist = self.other_currency_config.pricelistId
        for product in self.products:
            self.assertAlmostEqual(getPrice(pricelist, product), product.lstPrice * 0.5)

    def test_taxes() {
        tax7 = self.taxes['tax7']
        self.assertEqual(tax7.name, 'Tax 7%')
        self.assertAlmostEqual(tax7.amount, 7)
        self.assertEqual(tax7.invoice_repartition_line_ids.mapped('accountId').id, self.tax_received_account.id)
        tax10 = self.taxes['tax10']
        self.assertEqual(tax10.name, 'Tax 10%')
        self.assertAlmostEqual(tax10.amount, 10)
        self.assertEqual(tax10.priceInclude, True)
        self.assertEqual(tax10.invoice_repartition_line_ids.mapped('accountId').id, self.tax_received_account.id)
        tax_group_7_10 = self.taxes['tax_group_7_10']
        self.assertEqual(tax_group_7_10.name, 'Tax 7+10%')
        self.assertEqual(tax_group_7_10.amountType, 'group')
        self.assertEqual(sorted(tax_group_7_10.childrenTaxIds.ids), sorted((tax7 | tax10).ids))
