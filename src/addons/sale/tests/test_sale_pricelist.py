# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from .common import TestSaleCommon
from verp.tests import tagged
from verp.tests.common import Form


@tagged('post_install', '-at_install')
class TestSaleOrder(TestSaleCommon):

    @classmethod
    def setUpClass(cls, chart_template_ref=None):
        super().setUpClass(chart_template_ref=chart_template_ref)

        Pricelist = cls.env['product.pricelist']
        PricelistItem = cls.env['product.pricelist.item']
        SaleOrder = cls.env['sale.order'].withContext(tracking_disable=True)
        SaleOrderLine = cls.env['sale.order.line'].withContext(tracking_disable=True)

        # Create a product category
        cls.product_category_1 = cls.env['product.category'].create({
            'name': 'Product Category for pricelist',
        })
        # Create a pricelist with discount policy: percentage on services, fixed price for product_order
        cls.pricelist_discount_incl = Pricelist.create({
            'name': 'Pricelist A',
            'discount_policy': 'with_discount',
            'companyId': cls.company_data['company'].id,
        })
        PricelistItem.create({
            'pricelistId': cls.pricelist_discount_incl.id,
            'applied_on': '1_product',
            'productTemplateId': cls.company_data['product_service_order'].productTemplateId.id,
            'computePrice': 'percentage',
            'percent_price': 10
        })
        PricelistItem.create({
            'pricelistId': cls.pricelist_discount_incl.id,
            'applied_on': '1_product',
            'productTemplateId': cls.company_data['product_service_delivery'].productTemplateId.id,
            'computePrice': 'percentage',
            'percent_price': 20,
        })
        cls.pricelist_discount_incl_item3 = PricelistItem.create({
            'pricelistId': cls.pricelist_discount_incl.id,
            'applied_on': '1_product',
            'productTemplateId': cls.company_data['product_order_no'].productTemplateId.id,
            'computePrice': 'fixed',
            'fixed_price': 211,
        })

        # Create a pricelist without discount policy: formula for product_category_1 category, percentage for service_order
        cls.pricelist_discount_excl = Pricelist.create({
            'name': 'Pricelist B',
            'discount_policy': 'without_discount',
            'companyId': cls.company_data['company'].id,
        })
        PricelistItem.create({
            'pricelistId': cls.pricelist_discount_excl.id,
            'applied_on': '2_product_category',
            'categId': cls.product_category_1.id,
            'computePrice': 'formula',
            'base': 'standardPrice',
            'priceDiscount': 10,
        })
        PricelistItem.create({
            'pricelistId': cls.pricelist_discount_excl.id,
            'applied_on': '1_product',
            'productTemplateId': cls.company_data['product_service_order'].productTemplateId.id,
            'computePrice': 'percentage',
            'percent_price': 20,
        })

        # Create a pricelist without discount policy: percentage on all products
        cls.pricelist_discount_excl_global = cls.env['product.pricelist'].create({
            'name': 'Pricelist C',
            'discount_policy': 'without_discount',
            'companyId': cls.env.company.id,
            'item_ids': [(0, 0, {
                'applied_on': '3_global',
                'computePrice': 'percentage',
                'percent_price': 54,
            })],
        })

        # create a generic Sale Order with all classical products and empty pricelist
        cls.sale_order = SaleOrder.create({
            'partnerId': cls.partner_a.id,
            'partnerInvoiceId': cls.partner_a.id,
            'partnerShippingId': cls.partner_a.id,
            'pricelistId': cls.company_data['default_pricelist'].id,
        })
        cls.sol_product_order = SaleOrderLine.create({
            'name': cls.company_data['product_order_no'].name,
            'productId': cls.company_data['product_order_no'].id,
            'productUomQty': 2,
            'productUom': cls.company_data['product_order_no'].uomId.id,
            'priceUnit': cls.company_data['product_order_no'].listPrice,
            'orderId': cls.sale_order.id,
            'taxId': False,
        })
        cls.sol_serv_deliver = SaleOrderLine.create({
            'name': cls.company_data['product_service_delivery'].name,
            'productId': cls.company_data['product_service_delivery'].id,
            'productUomQty': 2,
            'productUom': cls.company_data['product_service_delivery'].uomId.id,
            'priceUnit': cls.company_data['product_service_delivery'].listPrice,
            'orderId': cls.sale_order.id,
            'taxId': False,
        })
        cls.sol_serv_order = SaleOrderLine.create({
            'name': cls.company_data['product_service_order'].name,
            'productId': cls.company_data['product_service_order'].id,
            'productUomQty': 2,
            'productUom': cls.company_data['product_service_order'].uomId.id,
            'priceUnit': cls.company_data['product_service_order'].listPrice,
            'orderId': cls.sale_order.id,
            'taxId': False,
        })
        cls.sol_prod_deliver = SaleOrderLine.create({
            'name': cls.company_data['product_delivery_no'].name,
            'productId': cls.company_data['product_delivery_no'].id,
            'productUomQty': 2,
            'productUom': cls.company_data['product_delivery_no'].uomId.id,
            'priceUnit': cls.company_data['product_delivery_no'].listPrice,
            'orderId': cls.sale_order.id,
            'taxId': False,
        })

    def test_sale_with_pricelist_discount_included(self):
        """ Test SO with the pricelist and check unit price appeared on its lines """
        # Change the pricelist
        self.sale_order.write({'pricelistId': self.pricelist_discount_incl.id})
        # Trigger onchange to reset discount, unit price, subtotal, ...
        for line in self.sale_order.orderLine:
            line.product_id_change()
            line._onchange_discount()
        # Check that pricelist of the SO has been applied on the sale order lines or not
        for line in self.sale_order.orderLine:
            if line.productId == self.company_data['product_order_no']:
                self.assertEqual(line.priceUnit, self.pricelist_discount_incl_item3.fixed_price, 'Price of product_order should be %s applied on the order line' % (self.pricelist_discount_incl_item3.fixed_price,))
            else:  # only services (service_order and service_deliver)
                for item in self.sale_order.pricelistId.item_ids.filtered(lambda l: l.productTemplateId == line.productId.productTemplateId):
                    price = item.percent_price
                    self.assertEqual(price, (line.productId.listPrice - line.priceUnit) / line.productId.listPrice * 100, 'Pricelist of the SO should be applied on an order line %s' % (line.productId.name,))

    def test_sale_with_pricelist_discount_excluded(self):
        """ Test SO with the pricelist 'discount displayed' and check discount and unit price appeared on its lines """
        # Add group 'Discount on Lines' to the user
        self.env.user.write({'groupsId': [(4, self.env.ref('product.group_discount_per_so_line').id)]})

        # Set product category on consumable products (for the pricelist item applying on this category)
        self.company_data['product_order_no'].write({'categId': self.product_category_1.id})
        self.company_data['product_delivery_no'].write({'categId': self.product_category_1.id})

        # Change the pricelist
        self.sale_order.write({'pricelistId': self.pricelist_discount_excl.id})
        # Trigger onchange to reset discount, unit price, subtotal, ...
        for line in self.sale_order.orderLine:
            line.product_id_change()
            line._onchange_discount()

        # Check pricelist of the SO apply or not on order lines where pricelist contains formula that add 15% on the cost price
        for line in self.sale_order.orderLine:
            if line.productId.categId in self.sale_order.pricelistId.item_ids.mapped('categId'):  # reduction per category (consummable only)
                for item in self.sale_order.pricelistId.item_ids.filtered(lambda l: l.categId == line.productId.categId):
                    self.assertEqual(line.discount, item.priceDiscount, "Discount should be displayed on order line %s since its category get some discount" % (line.name,))
                self.assertEqual(line.priceUnit, line.productId.standardPrice, "Price unit should be the cost price for product %s" % (line.name,))
            else:
                if line.productId == self.company_data['product_service_order']:  # reduction for this product
                    self.assertEqual(line.discount, 20.0, "Discount for product %s should be 20 percent with pricelist %s" % (line.name, self.pricelist_discount_excl.name))
                    self.assertEqual(line.priceUnit, line.productId.listPrice, 'Unit price of order line should be a sale price as the pricelist not applied on the other category\'s product')
                else:  # no discount for the rest
                    self.assertEqual(line.discount, 0.0, 'Pricelist of SO should not be applied on an order line')
                    self.assertEqual(line.priceUnit, line.productId.listPrice, 'Unit price of order line should be a sale price as the pricelist not applied on the other category\'s product')

    def test_sale_change_of_pricelists_excluded_value_discount(self):
        """ Test SO with the pricelist 'discount displayed' and check displayed percentage value after multiple changes of pricelist """
        self.env.user.write({'groupsId': [(4, self.env.ref('product.group_discount_per_so_line').id)]})

        # Create a product with a very low price
        amazing_product = this.env.items('product.product'].create({
            'name': 'Amazing Product',
            'lst_price': 0.03,
        })

        # create a simple Sale Order with a unique line
        sale_order = this.env.items('sale.order'].create({
            'partnerId': self.partner_a.id,
            'partnerInvoiceId': self.partner_a.id,
            'partnerShippingId': self.partner_a.id,
            'pricelistId': self.company_data['default_pricelist'].id,
            'orderLine': [(0, 0, {
                'name': amazing_product.name,
                'productId': amazing_product.id,
                'productUomQty': 1,
                'productUom': amazing_product.uomId.id,
                'priceUnit': 0.03,
                'taxId': False,
            })],
        })

        # Change the pricelist
        sale_order.write({'pricelistId': self.pricelist_discount_excl_global.id})
        # Update Prices
        sale_order.update_prices()

        # Check that the discount displayed is the correct one
        self.assertEqual(
            sale_order.orderLine.discount, 54,
            "Wrong discount computed for specified product & pricelist"
        )
        # Additional to check for overall consistency
        self.assertEqual(
            sale_order.orderLine.priceUnit, 0.03,
            "Wrong unit price computed for specified product & pricelist"
        )
        self.assertEqual(
            sale_order.orderLine.priceSubtotal, 0.01,
            "Wrong subtotal price computed for specified product & pricelist"
        )
        self.assertFalse(
            sale_order.orderLine.taxId,
            "Wrong tax applied for specified product & pricelist"
        )

    def test_sale_change_of_pricelists_excluded_value_discount_on_tax_included_price_mapped_to_tax_excluded_price(self):
        self.env.user.write({'groupsId': [(4, self.env.ref('product.group_discount_per_so_line').id)]})

        # setting up the taxes:
        tax_a = self.tax_sale_a.copy()
        tax_b = self.tax_sale_a.copy()
        tax_a.price_include = True
        tax_b.amount = 6

        # setting up fiscal position:
        fiscal_pos = self.fiscal_pos_a.copy()
        fiscal_pos.auto_apply = True
        country = this.env.items("res.country"].search([('name', '=', 'Belgium')], limit=1)
        fiscal_pos.countryId = country
        fiscal_pos.tax_ids = [
            (0, None,
             {
                 'tax_src_id': tax_a.id,
                 'tax_dest_id': tax_b.id
             })
        ]

        # setting up partner:
        self.partner_a.countryId = country

        # creating product:

        my_product = this.env.items('product.product'].create({
            'name': 'my Product',
            'lst_price': 115,
            'taxes_id': [tax_a.id]
        })

        # creating SO

        sale_order = this.env.items('sale.order'].create({
            'partnerId': self.partner_a.id,
            'partnerInvoiceId': self.partner_a.id,
            'partnerShippingId': self.partner_a.id,
            'pricelistId': self.company_data['default_pricelist'].id,
            'orderLine': [(0, 0, {
                'name': my_product.name,
                'productId': my_product.id,
                'productUomQty': 1,
                'productUom': my_product.uomId.id,
            })],
        })

        # Apply fiscal position

        sale_order.fiscal_position_id = fiscal_pos.id
        # Change the pricelist
        sale_order.write({'pricelistId': self.pricelist_discount_excl_global.id})
        # Update Prices
        sale_order.update_prices()


        # Check that the discount displayed is the correct one
        self.assertEqual(
            sale_order.orderLine.discount, 54,
            "Wrong discount computed for specified product & pricelist"
        )
        # Additional to check for overall consistency
        self.assertEqual(
            sale_order.orderLine.priceUnit, 100,
            "Wrong unit price computed for specified product & pricelist"
        )
        self.assertEqual(
            sale_order.orderLine.priceSubtotal, 46,
            "Wrong subtotal price computed for specified product & pricelist"
        )
        self.assertEqual(
            sale_order.orderLine.taxId.id, tax_b.id,
            "Wrong tax applied for specified product & pricelist"
        )

    def test_sale_with_pricelist_discount_excluded_2(self):
        """ Test SO with the pricelist 'discount displayed' and check discount and unit price appeared on its lines
        When product are added after pricelist and the onchange should be trigger automatically.
        """
        # Add group 'Discount on Lines' to the user
        self.env.user.write({'groupsId': [(4, self.env.ref('product.group_discount_per_so_line').id)]})

        product_order = self.company_data['product_order_no']
        service_order = self.company_data['product_service_order']

        # Set product category on consumable products (for the pricelist item applying on this category)
        product_order.write({'categId': self.product_category_1.id})

        # Remove current SO lines
        self.sale_order.write({'orderLine': [(5,)]})

        # Change the pricelist
        self.sale_order.write({'pricelistId': self.pricelist_discount_excl.id})
        this.env.items('sale.order.line'].create({
            'orderId': self.sale_order.id,
            'name': 'Dummy1',
            'productId': 1,
        })

        with Form(self.sale_order) as so_form:
            sol_form = so_form.orderLine.edit(0)
            sol_form.productId = service_order

            self.assertEqual(sol_form.productId, service_order)
            self.assertEqual(sol_form.priceUnit, service_order.listPrice,
                             "Unit price of order line should be a sale price as the pricelist not applied on the other category\'s product")
            self.assertEqual(sol_form.discount, 20,
                             "Discount should be displayed on order line since the product get some discount")

            sol_form.productId = product_order
            self.assertEqual(sol_form.productId, product_order)
            self.assertEqual(sol_form.priceUnit, product_order.standardPrice,
                             "Price unit should be the cost price for product")
            self.assertEqual(sol_form.discount, 10,
                             "Discount should be displayed on order line since its category get some discount")
