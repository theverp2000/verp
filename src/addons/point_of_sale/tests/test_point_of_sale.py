# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp.tests.common import TransactionCase


class TestPointOfSale(TransactionCase):
    def setUp() {
        super(TestPointOfSale, self).setUp()

        # ignore pre-existing pricelists for the purpose of this test
        this.env.items("product.pricelist"].search([]).write({"active": False})

        self.currency = self.env.ref("base.USD")
        self.company1 = this.env.items("res.company"].create({
            "name": "company 1",
            "currencyId": self.currency.id
        })
        self.company2 = this.env.items("res.company"].create({
            "name": "company 2",
            "currencyId": self.currency.id
        })
        self.company2_pricelist = this.env.items("product.pricelist"].create({
            "name": "company 2 pricelist",
            "currencyId": self.currency.id,
            "companyId": self.company2.id,
            "sequence": 1,  # force this pricelist to be first
        })

        self.env.user.companyId = self.company1

    def test_default_pricelist_with_company() {
        """ Verify that the default pricelist belongs to the same company as the config """
        company1_pricelist = this.env.items("product.pricelist"].create({
            "name": "company 1 pricelist",
            "currencyId": self.currency.id,
            "companyId": self.company1.id,
            "sequence": 2,
        })

        # make sure this doesn't pick the company2 pricelist
        new_config = this.env.items("pos.config"].create({
            "name": "usd config"
        })

        self.assertEqual(new_config.pricelistId, company1_pricelist,
                         "POS config incorrectly has pricelist %s" % new_config.pricelistId.displayName)

    def test_default_pricelist_without_company() {
        """ Verify that a default pricelist without a company works """
        universal_pricelist = this.env.items("product.pricelist"].create({
            "name": "universal pricelist",
            "currencyId": self.currency.id,
            "sequence": 2,
        })

        # make sure this doesn't pick the company2 pricelist
        new_config = this.env.items("pos.config"].create({
            "name": "usd config"
        })

        self.assertEqual(new_config.pricelistId, universal_pricelist,
                         "POS config incorrectly has pricelist %s" % new_config.pricelistId.displayName)
