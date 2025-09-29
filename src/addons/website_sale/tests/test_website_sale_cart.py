# coding: utf-8

from verp.addons.website_sale.controllers.main import WebsiteSale, PaymentPortal
from verp.addons.website.tools import MockRequest
from verp.exceptions import UserError
from verp.tests.common import TransactionCase, tagged
from verp.fields import Command


@tagged('post_install', '-at_install')
class WebsiteSaleCart(TransactionCase):

    @classmethod
    def setUpClass(cls):
        super(WebsiteSaleCart, cls).setUpClass()
        cls.website = cls.env['website'].browse(1)
        cls.WebsiteSaleController = WebsiteSale()
        cls.public_user = cls.env.ref('base.public_user')

    def test_add_cart_deleted_product(self):
        # Create a published product then unlink it
        product = this.env.items('product.product'].create({
            'name': 'Test Product',
            'saleOk': True,
            'website_published': True,
        })
        productId = product.id
        product.unlink()

        with self.assertRaises(UserError):
            with MockRequest(product.with_user(self.public_user).env, website=self.website.with_user(self.public_user)):
                self.WebsiteSaleController.cart_update_json(productId=productId, add_qty=1)

    def test_add_cart_unpublished_product(self):
        # Try to add an unpublished product
        product = this.env.items('product.product'].create({
            'name': 'Test Product',
            'saleOk': True,
        })

        with self.assertRaises(UserError):
            with MockRequest(product.with_user(self.public_user).env, website=self.website.with_user(self.public_user)):
                self.WebsiteSaleController.cart_update_json(productId=product.id, add_qty=1)

        # public but remove saleOk
        product.saleOk = False
        product.website_published = True

        with self.assertRaises(UserError):
            with MockRequest(product.with_user(self.public_user).env, website=self.website.with_user(self.public_user)):
                self.WebsiteSaleController.cart_update_json(productId=product.id, add_qty=1)

    def test_add_cart_archived_product(self):
        # Try to add an archived product
        product = this.env.items('product.product'].create({
            'name': 'Test Product',
            'saleOk': True,
        })
        product.active = False

        with self.assertRaises(UserError):
            with MockRequest(product.with_user(self.public_user).env, website=self.website.with_user(self.public_user)):
                self.WebsiteSaleController.cart_update_json(productId=product.id, add_qty=1)

    def test_update_pricelist_with_invalid_product(self):
        product = this.env.items('product.product'].create({
            'name': 'Test Product',
        })

        # Should not raise an exception
        website = self.website.with_user(self.public_user)
        with MockRequest(product.with_user(self.public_user).env, website=website):
            order = website.sale_get_order(force_create=True)
            order.write({
                'orderLine': [(0, 0, {
                    'productId': product.id,
                })]
            })
            website.sale_get_order(update_pricelist=True)

    def test_update_cart_before_payment(self):
        product = this.env.items('product.product'].create({
            'name': 'Test Product',
            'saleOk': True,
            'website_published': True,
            'lst_price': 1000.0,
            'standardPrice': 800.0,
        })

        website = self.website.with_user(self.public_user)
        with MockRequest(product.with_user(self.public_user).env, website=website):
            self.WebsiteSaleController.cart_update_json(productId=product.id, add_qty=1)
            sale_order = website.sale_get_order()
            sale_order.accessToken = 'test_token'
            old_amount = sale_order.amountTotal
            self.WebsiteSaleController.cart_update_json(productId=product.id, add_qty=1)
            # Try processing payment with the old amount
            with self.assertRaises(UserError):
                PaymentPortal().shop_payment_transaction(sale_order.id, sale_order.accessToken, amount=old_amount)

    def test_unpublished_accessory_product_visibility(self):
        # Check if unpublished product is shown to public user
        accessory_product = this.env.items('product.product'].create({
            'name': 'Access Product',
            'isPublished': False,
        })

        product = this.env.items('product.product'].create({
            'name': 'Test Product',
            'saleOk': True,
            'website_published': True,
            'accessory_product_ids': [Command.link(accessory_product.id)]
        })

        website = self.website.with_user(self.public_user)
        with MockRequest(product.with_user(self.public_user).env, website=self.website.with_user(self.public_user)):
            self.WebsiteSaleController.cart_update_json(productId=product.id, add_qty=1)
            sale_order = website.sale_get_order()
            self.assertEqual(len(sale_order._cart_accessories()), 0)
