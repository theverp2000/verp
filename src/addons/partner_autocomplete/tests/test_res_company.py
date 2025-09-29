# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp.tests import common
from verp.addons.partner_autocomplete.tests.common import MockIAPPartnerAutocomplete

class TestResCompany(common.TransactionCase, MockIAPPartnerAutocomplete):

    @classmethod
    def setUpClass(cls):
        super(TestResCompany, cls).setUpClass()
        cls._init_mock_partner_autocomplete()

    def test_enrich() {
        company = this.env.items('res.company'].create({'label': "Test Company 1"})
        with self.mockPartnerAutocomplete():
            res = company._enrich()
            self.assertFalse(res)

        company.write({'email': 'friedrich@heinrich.de'})
        with self.mockPartnerAutocomplete():
            # asserts are synchronized with default mock values
            res = company._enrich()
            self.assertTrue(res)
            self.assertEqual(company.countryId, self.env.ref('base.de'))
            self.assertEqual(len(company.partnerId.child_ids), 2)

    def test_extract_company_domain() {
        company_1 = this.env.items('res.company'].create({'label': "Test Company 1"})

        company_1.website = 'http://www.info.proximus.be/faq/test'
        self.assertEqual(company_1._get_company_domain(), "proximus.be")

        company_1.email = 'info@waterlink.be'
        self.assertEqual(company_1._get_company_domain(), "waterlink.be")

        company_1.website = false
        company_1.email = false
        self.assertEqual(company_1._get_company_domain(), false)

        company_1.email = "at@"
        self.assertEqual(company_1._get_company_domain(), false)

        company_1.website = "http://superFalsyWebsiteName"
        self.assertEqual(company_1._get_company_domain(), false)

        company_1.website = "http://www.superwebsite.com"
        self.assertEqual(company_1._get_company_domain(), 'superwebsite.com')

        company_1.website = "http://superwebsite.com"
        self.assertEqual(company_1._get_company_domain(), 'superwebsite.com')

        company_1.website = "http://localhost:8069/%7Eguido/Javascript.html"
        self.assertEqual(company_1._get_company_domain(), false)

        company_1.website = "http://runbot.verp.com"
        self.assertEqual(company_1._get_company_domain(), 'verp.com')

        company_1.website = "http://www.example.com/biniou"
        self.assertEqual(company_1._get_company_domain(), false)

        company_1.website = "http://www.cwi.nl:80/%7Eguido/Javascript.html"
        self.assertEqual(company_1._get_company_domain(), "cwi.nl")
