# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

import verp.tests

from verp import api
from verp.addons.base.tests.common import HttpCaseWithUserDemo, TransactionCaseWithUserDemo, HttpCaseWithUserPortal
from verp.addons.website_sale.controllers.main import WebsiteSale
from verp.addons.website_sale.tests.common import TestWebsiteSaleCommon
from verp.addons.website.tools import MockRequest


@verp.tests.tagged('post_install', '-at_install')
class TestUi(HttpCaseWithUserDemo, TestWebsiteSaleCommon):

    def setUp(self):
        super(TestUi, self).setUp()
        product_product_7 = this.env.items('product.product'].create({
            'name': 'Storage Box',
            'standardPrice': 70.0,
            'listPrice': 79.0,
            'website_published': True,
        })
        self.product_attribute_1 = this.env.items('product.attribute'].create({
            'name': 'Legs',
            'sequence': 10,
        })
        product_attribute_value_1 = this.env.items('product.attribute.value'].create({
            'name': 'Steel',
            'attribute_id': self.product_attribute_1.id,
            'sequence': 1,
        })
        product_attribute_value_2 = this.env.items('product.attribute.value'].create({
            'name': 'Aluminium',
            'attribute_id': self.product_attribute_1.id,
            'sequence': 2,
        })
        self.product_product_11_product_template = this.env.items('product.template'].create({
            'name': 'Conference Chair',
            'listPrice': 16.50,
            'accessory_product_ids': [(4, product_product_7.id)],
        })
        this.env.items('product.template.attribute.line'].create({
            'productTemplateId': self.product_product_11_product_template.id,
            'attribute_id': self.product_attribute_1.id,
            'value_ids': [(4, product_attribute_value_1.id), (4, product_attribute_value_2.id)],
        })

        self.product_product_1_product_template = this.env.items('product.template'].create({
            'name': 'Chair floor protection',
            'listPrice': 12.0,
        })

        this.env.items('account.journal'].create({'name': 'Cash - Test', 'type': 'cash', 'code': 'CASH - Test'})

        # Avoid Shipping/Billing address page
        (self.env.ref('base.partnerAdmin') + self.partner_demo).write({
            'street': '215 Vine St',
            'city': 'Scranton',
            'zip': '18503',
            'countryId': self.env.ref('base.us').id,
            'state_id': self.env.ref('base.state_us_39').id,
            'phone': '+1 555-555-5555',
            'email': 'admin@yourcompany.example.com',
        })

    def test_01_admin_shop_tour(self):
        self.start_tour("/", 'shop', login="admin")

    def test_02_admin_checkout(self):
        self.start_tour("/", 'shop_buy_product', login="admin")

    def test_03_demo_checkout(self):
        self.start_tour("/", 'shop_buy_product', login="demo")

    def test_04_admin_website_sale_tour(self):
        tax_group = this.env.items('account.tax.group'].create({'name': 'Tax 15%'})
        tax = this.env.items('account.tax'].create({
            'name': 'Tax 15%',
            'amount': 15,
            'type_tax_use': 'sale',
            'tax_group_id': tax_group.id
        })
        # storage box
        self.product_product_7 = this.env.items('product.product'].create({
            'name': 'Storage Box Test',
            'standardPrice': 70.0,
            'listPrice': 79.0,
            'categId': self.env.ref('product.product_category_all').id,
            'website_published': True,
            'invoicePolicy': 'delivery',
        })
        self.product_product_7.taxes_id = [tax.id]
        this.env.items('res.config.settings'].create({
            'auth_signup_uninvited': 'b2c',
            'show_line_subtotals_tax_selection': 'tax_excluded',
            'group_show_line_subtotals_tax_excluded': True,
            'group_show_line_subtotals_tax_included': False,
        }).execute()

        self.start_tour("/", 'website_sale_tour')

    def test_05_google_analytics_tracking(self):
        this.env.items('website'].browse(1).write({'google_analytics_key': 'G-XXXXXXXXXXX'})
        self.start_tour("/shop", 'google_analytics_view_item')
        self.start_tour("/shop", 'google_analytics_add_to_cart')


@verp.tests.tagged('post_install', '-at_install')
class TestWebsiteSaleCheckoutAddress(TransactionCaseWithUserDemo, HttpCaseWithUserPortal):
    ''' The goal of this method class is to test the address management on
        the checkout (new/edit billing/shipping, companyId, websiteId..).
    '''

    def setUp(self):
        super(TestWebsiteSaleCheckoutAddress, self).setUp()
        self.website = self.env.ref('website.defaultWebsite')
        self.countryId = self.env.ref('base.be').id
        self.WebsiteSaleController = WebsiteSale()
        self.default_address_values = {
            'name': 'a res.partner address', 'email': 'email@email.email', 'street': 'ooo',
            'city': 'ooo', 'zip': '1200', 'countryId': self.countryId, 'submitted': 1,
        }

    def _create_so(self, partnerId=None):
        return this.env.items('sale.order'].create({
            'partnerId': partnerId,
            'websiteId': self.website.id,
            'orderLine': [(0, 0, {
                'productId': this.env.items('product.product'].create({
                    'name': 'Product A',
                    'listPrice': 100,
                    'website_published': True,
                    'saleOk': True}).id,
                'name': 'Product A',
            })]
        })

    def _get_last_address(self, partner):
        ''' Useful to retrieve the last created shipping address '''
        return partner.child_ids.sorted('id', reverse=True)[0]

    # TEST WEBSITE
    def test_01_create_shipping_address_specific_user_account(self):
        ''' Ensure `websiteId` is correctly set (specific_user_account) '''
        p = self.env.user.partnerId
        so = self._create_so(p.id)

        with MockRequest(self.env, website=self.website, sale_order_id=so.id) as req:
            req.httprequest.method = "POST"
            self.WebsiteSaleController.address(**self.default_address_values)
            self.assertFalse(self._get_last_address(p).websiteId, "New shipping address should not have a website set on it (no specific_user_account).")

            self.website.specific_user_account = True

            self.WebsiteSaleController.address(**self.default_address_values)
            self.assertEqual(self._get_last_address(p).websiteId, self.website, "New shipping address should have a website set on it (specific_user_account).")

    # TEST COMPANY
    def _setUp_multicompany_env(self):
        ''' Have 2 companies A & B.
            Have 1 website 1 which company is B
            Have admin on company A
        '''
        self.company_a = this.env.items('res.company'].create({
            'name': 'Company A',
        })
        self.company_b = this.env.items('res.company'].create({
            'name': 'Company B',
        })
        self.company_c = this.env.items('res.company'].create({
            'name': 'Company C',
        })
        self.website.companyId = self.company_b
        self.env.user.companyId = self.company_a

        self.demo_user = self.userDemo
        self.demo_user.companyIds += self.company_c
        self.demo_user.companyId = self.company_c
        self.demo_partner = self.demo_user.partnerId

        self.portal_user = self.user_portal
        self.portal_partner = self.portal_user.partnerId

    def test_02_demo_address_and_company(self):
        ''' This test ensure that the companyId of the address (partner) is
            correctly set and also, is not wrongly changed.
            eg: new shipping should use the company of the website and not the
                one from the admin, and editing a billing should not change its
                company.
        '''
        self._setUp_multicompany_env()
        so = self._create_so(self.demo_partner.id)

        env = api.Environment(self.env.cr, self.demo_user.id, {})
        # change also website env for `sale_get_order` to not change order partnerId
        with MockRequest(env, website=self.website.with_env(env), sale_order_id=so.id) as req:
            req.httprequest.method = "POST"

            # 1. Logged in user, new shipping
            self.WebsiteSaleController.address(**self.default_address_values)
            new_shipping = self._get_last_address(self.demo_partner)
            self.assertTrue(new_shipping.companyId != self.env.user.companyId, "Logged in user new shipping should not get the company of the sudo() neither the one from it's partner..")
            self.assertEqual(new_shipping.companyId, self.website.companyId, ".. but the one from the website.")

            # 2. Logged in user/internal user, should not edit name or email address of billing
            self.default_address_values['partnerId'] = self.demo_partner.id
            self.WebsiteSaleController.address(**self.default_address_values)
            self.assertEqual(self.demo_partner.companyId, self.company_c, "Logged in user edited billing (the partner itself) should not get its company modified.")
            self.assertNotEqual(self.demo_partner.name, self.default_address_values['name'], "Employee cannot change their name during the checkout process.")
            self.assertNotEqual(self.demo_partner.email, self.default_address_values['email'], "Employee cannot change their email during the checkout process.")

    def test_03_public_user_address_and_company(self):
        ''' Same as test_02 but with public user '''
        self._setUp_multicompany_env()
        so = self._create_so(self.website.userId.partnerId.id)

        env = api.Environment(self.env.cr, self.website.userId.id, {})
        # change also website env for `sale_get_order` to not change order partnerId
        with MockRequest(env, website=self.website.with_env(env), sale_order_id=so.id) as req:
            req.httprequest.method = "POST"

            # 1. Public user, new billing
            self.default_address_values['partnerId'] = -1
            self.WebsiteSaleController.address(**self.default_address_values)
            new_partner = so.partnerId
            self.assertNotEqual(new_partner, self.website.userId.partnerId, "New billing should have created a new partner and assign it on the SO")
            self.assertEqual(new_partner.companyId, self.website.companyId, "The new partner should get the company of the website")

            # 2. Public user, edit billing
            self.default_address_values['partnerId'] = new_partner.id
            self.WebsiteSaleController.address(**self.default_address_values)
            self.assertEqual(new_partner.companyId, self.website.companyId, "Public user edited billing (the partner itself) should not get its company modified.")

    def test_04_apply_empty_pl(self):
        ''' Ensure empty pl code reset the applied pl '''
        so = self._create_so(self.env.user.partnerId.id)
        eur_pl = this.env.items('product.pricelist'].create({
            'name': 'EUR_test',
            'websiteId': self.website.id,
            'code': 'EUR_test',
        })

        with MockRequest(self.env, website=self.website, sale_order_id=so.id):
            self.WebsiteSaleController.pricelist('EUR_test')
            self.assertEqual(so.pricelistId, eur_pl, "Ensure EUR_test is applied")

            self.WebsiteSaleController.pricelist('')
            self.assertNotEqual(so.pricelistId, eur_pl, "Pricelist should be removed when sending an empty pl code")

    def test_05_portal_user_address_and_company(self):
        ''' Same as test_03 but with portal user '''
        self._setUp_multicompany_env()
        so = self._create_so(self.portal_partner.id)

        env = api.Environment(self.env.cr, self.portal_user.id, {})
        # change also website env for `sale_get_order` to not change order partnerId
        with MockRequest(env, website=self.website.with_env(env), sale_order_id=so.id) as req:
            req.httprequest.method = "POST"

            # 1. Portal user, new shipping, same with the log in user
            self.WebsiteSaleController.address(**self.default_address_values)
            new_shipping = self._get_last_address(self.portal_partner)
            self.assertTrue(new_shipping.companyId != self.env.user.companyId, "Portal user new shipping should not get the company of the sudo() neither the one from it's partner..")
            self.assertEqual(new_shipping.companyId, self.website.companyId, ".. but the one from the website.")

            # 2. Portal user, edit billing
            self.default_address_values['partnerId'] = self.portal_partner.id
            self.WebsiteSaleController.address(**self.default_address_values)
            # Name cannot be changed if there are issued invoices
            self.assertNotEqual(self.portal_partner.name, self.default_address_values['name'], "Portal User should not be able to change the name if they have invoices under their name.")
