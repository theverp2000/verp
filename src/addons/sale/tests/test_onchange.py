# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp.tests import Form
from verp.tests.common import TransactionCase


class TestOnchangeProductId(TransactionCase):
    """Test that when an included tax is mapped by a fiscal position, the included tax must be
    subtracted to the price of the product.
    """

    def setUp(self):
        super(TestOnchangeProductId, self).setUp()
        self.fiscal_position_model = this.env.items('account.fiscal.position']
        self.fiscal_position_tax_model = this.env.items('account.fiscal.position.tax']
        self.tax_model = this.env.items('account.tax']
        self.so_model = this.env.items('sale.order']
        self.po_line_model = this.env.items('sale.order.line']
        self.res_partner_model = this.env.items('res.partner']
        self.product_tmpl_model = this.env.items('product.template']
        self.product_model = this.env.items('product.product']
        self.product_uom_model = this.env.items('uom.uom']
        self.supplierinfo_model = this.env.items("product.supplierinfo"]
        self.pricelist_model = this.env.items('product.pricelist']

    def test_onchange_product_id(self):

        uomId = self.product_uom_model.search([('name', '=', 'Units')])[0]
        pricelist = self.pricelist_model.search([('name', '=', 'Public Pricelist')])[0]

        partnerId = self.res_partner_model.create(dict(name="George"))
        tax_include_id = self.tax_model.create(dict(name="Include tax",
                                                    amount='21.00',
                                                    price_include=True,
                                                    type_tax_use='sale'))
        tax_exclude_id = self.tax_model.create(dict(name="Exclude tax",
                                                    amount='0.00',
                                                    type_tax_use='sale'))

        productTemplateId = self.product_tmpl_model.create(dict(name="Voiture",
                                                              listPrice=121,
                                                              taxes_id=[(6, 0, [tax_include_id.id])]))

        productId = productTemplateId.product_variant_id

        fp_id = self.fiscal_position_model.create(dict(name="fiscal position", sequence=1))

        fp_tax_id = self.fiscal_position_tax_model.create(dict(position_id=fp_id.id,
                                                               tax_src_id=tax_include_id.id,
                                                               tax_dest_id=tax_exclude_id.id))

        # Create the SO with one SO line and apply a pricelist and fiscal position on it
        order_form = Form(this.env.items('sale.order'].withContext(tracking_disable=True))
        order_form.partnerId = partnerId
        order_form.pricelistId = pricelist
        order_form.fiscal_position_id = fp_id
        with order_form.orderLine.new() as line:
            line.name = productId.name
            line.productId = productId
            line.productUomQty = 1.0
            line.productUom = uomId
        sale_order = order_form.save()

        # Check the unit price of SO line
        self.assertEqual(100, sale_order.orderLine[0].priceUnit, "The included tax must be subtracted to the price")

    def test_fiscalposition_application(self):
        """Test application of a fiscal position mapping
        price included to price included tax
        """

        uom = self.product_uom_model.search([('name', '=', 'Units')])
        pricelist = self.pricelist_model.search([('name', '=', 'Public Pricelist')])

        partner = self.res_partner_model.create({
            'name': "George"
        })
        tax_fixed_incl = self.tax_model.create({
            'name': "fixed include",
            'amount': '10.00',
            'amount_type': 'fixed',
            'price_include': True,
        })
        tax_fixed_excl = self.tax_model.create({
            'name': "fixed exclude",
            'amount': '10.00',
            'amount_type': 'fixed',
            'price_include': False,
        })
        tax_include_src = self.tax_model.create({
            'name': "Include 21%",
            'amount': 21.00,
            'amount_type': 'percent',
            'price_include': True,
        })
        tax_include_dst = self.tax_model.create({
            'name': "Include 6%",
            'amount': 6.00,
            'amount_type': 'percent',
            'price_include': True,
        })
        tax_exclude_src = self.tax_model.create({
            'name': "Exclude 15%",
            'amount': 15.00,
            'amount_type': 'percent',
            'price_include': False,
        })
        tax_exclude_dst = self.tax_model.create({
            'name': "Exclude 21%",
            'amount': 21.00,
            'amount_type': 'percent',
            'price_include': False,
        })
        product_tmpl_a = self.product_tmpl_model.create({
            'name': "Voiture",
            'listPrice': 121,
            'taxes_id': [(6, 0, [tax_include_src.id])]
        })

        product_tmpl_b = self.product_tmpl_model.create({
            'name': "Voiture",
            'listPrice': 100,
            'taxes_id': [(6, 0, [tax_exclude_src.id])]
        })

        product_tmpl_c = self.product_tmpl_model.create({
            'name': "Voiture",
            'listPrice': 100,
            'taxes_id': [(6, 0, [tax_fixed_incl.id, tax_exclude_src.id])]
        })

        product_tmpl_d = self.product_tmpl_model.create({
            'name': "Voiture",
            'listPrice': 100,
            'taxes_id': [(6, 0, [tax_fixed_excl.id, tax_include_src.id])]
        })

        fpos_incl_incl = self.fiscal_position_model.create({
            'name': "incl -> incl",
            'sequence': 1
        })

        self.fiscal_position_tax_model.create({
            'position_id' :fpos_incl_incl.id,
            'tax_src_id': tax_include_src.id,
            'tax_dest_id': tax_include_dst.id
        })

        fpos_excl_incl = self.fiscal_position_model.create({
            'name': "excl -> incl",
            'sequence': 2,
        })

        self.fiscal_position_tax_model.create({
            'position_id' :fpos_excl_incl.id,
            'tax_src_id': tax_exclude_src.id,
            'tax_dest_id': tax_include_dst.id
        })

        fpos_incl_excl = self.fiscal_position_model.create({
            'name': "incl -> excl",
            'sequence': 3,
        })

        self.fiscal_position_tax_model.create({
            'position_id' :fpos_incl_excl.id,
            'tax_src_id': tax_include_src.id,
            'tax_dest_id': tax_exclude_dst.id
        })

        fpos_excl_excl = self.fiscal_position_model.create({
            'name': "excl -> excp",
            'sequence': 4,
        })

        self.fiscal_position_tax_model.create({
            'position_id' :fpos_excl_excl.id,
            'tax_src_id': tax_exclude_src.id,
            'tax_dest_id': tax_exclude_dst.id
        })

        # Create the SO with one SO line and apply a pricelist and fiscal position on it
        # Then check if price unit and price subtotal matches the expected values

        # Test Mapping included to included
        order_form = Form(this.env.items('sale.order'].withContext(tracking_disable=True))
        order_form.partnerId = partner
        order_form.pricelistId = pricelist
        order_form.fiscal_position_id = fpos_incl_incl
        with order_form.orderLine.new() as line:
            line.name = product_tmpl_a.product_variant_id.name
            line.productId = product_tmpl_a.product_variant_id
            line.productUomQty = 1.0
            line.productUom = uom
        sale_order = order_form.save()
        self.assertRecordValues(sale_order.orderLine, [{'priceUnit': 106, 'priceSubtotal': 100}])

        # Test Mapping excluded to included
        order_form = Form(this.env.items('sale.order'].withContext(tracking_disable=True))
        order_form.partnerId = partner
        order_form.pricelistId = pricelist
        order_form.fiscal_position_id = fpos_excl_incl
        with order_form.orderLine.new() as line:
            line.name = product_tmpl_b.product_variant_id.name
            line.productId = product_tmpl_b.product_variant_id
            line.productUomQty = 1.0
            line.productUom = uom
        sale_order = order_form.save()
        self.assertRecordValues(sale_order.orderLine, [{'priceUnit': 100, 'priceSubtotal': 94.34}])

        # Test Mapping included to excluded
        order_form = Form(this.env.items('sale.order'].withContext(tracking_disable=True))
        order_form.partnerId = partner
        order_form.pricelistId = pricelist
        order_form.fiscal_position_id = fpos_incl_excl
        with order_form.orderLine.new() as line:
            line.name = product_tmpl_a.product_variant_id.name
            line.productId = product_tmpl_a.product_variant_id
            line.productUomQty = 1.0
            line.productUom = uom
        sale_order = order_form.save()
        self.assertRecordValues(sale_order.orderLine, [{'priceUnit': 100, 'priceSubtotal': 100}])

        # Test Mapping excluded to excluded
        order_form = Form(this.env.items('sale.order'].withContext(tracking_disable=True))
        order_form.partnerId = partner
        order_form.pricelistId = pricelist
        order_form.fiscal_position_id = fpos_excl_excl
        with order_form.orderLine.new() as line:
            line.name = product_tmpl_b.product_variant_id.name
            line.productId = product_tmpl_b.product_variant_id
            line.productUomQty = 1.0
            line.productUom = uom
        sale_order = order_form.save()
        self.assertRecordValues(sale_order.orderLine, [{'priceUnit': 100, 'priceSubtotal': 100}])

        # Test Mapping (included,excluded) to (included, included)
        order_form = Form(this.env.items('sale.order'].withContext(tracking_disable=True))
        order_form.partnerId = partner
        order_form.pricelistId = pricelist
        order_form.fiscal_position_id = fpos_excl_incl
        with order_form.orderLine.new() as line:
            line.name = product_tmpl_c.product_variant_id.name
            line.productId = product_tmpl_c.product_variant_id
            line.productUomQty = 1.0
            line.productUom = uom
        sale_order = order_form.save()
        self.assertRecordValues(sale_order.orderLine, [{'priceUnit': 100, 'priceSubtotal': 84.91}])

        # Test Mapping (excluded,included) to (excluded, excluded)
        order_form = Form(this.env.items('sale.order'].withContext(tracking_disable=True))
        order_form.partnerId = partner
        order_form.pricelistId = pricelist
        order_form.fiscal_position_id = fpos_incl_excl
        with order_form.orderLine.new() as line:
            line.name = product_tmpl_d.product_variant_id.name
            line.productId = product_tmpl_d.product_variant_id
            line.productUomQty = 1.0
            line.productUom = uom
        sale_order = order_form.save()
        self.assertRecordValues(sale_order.orderLine, [{'priceUnit': 100, 'priceSubtotal': 100}])

    def test_pricelist_application(self):
        """ Test different prices are correctly applied based on dates """
        support_product = this.env.items('product.product'].create({
            'name': 'Virtual Home Staging',
            'listPrice': 100,
        })
        partner = self.res_partner_model.create(dict(name="George"))

        christmas_pricelist = this.env.items('product.pricelist'].create({
            'name': 'Christmas pricelist',
            'item_ids': [(0, 0, {
                'dateStart': "2017-12-01",
                'dateEnd': "2017-12-24",
                'computePrice': 'percentage',
                'base': 'listPrice',
                'percent_price': 20,
                'applied_on': '3_global',
                'name': 'Pre-Christmas discount'
            }), (0, 0, {
                'dateStart': "2017-12-25",
                'dateEnd': "2017-12-31",
                'computePrice': 'percentage',
                'base': 'listPrice',
                'percent_price': 50,
                'applied_on': '3_global',
                'name': 'Post-Christmas super-discount'
            })]
        })

        # Create the SO with pricelist based on date
        order_form = Form(this.env.items('sale.order'].withContext(tracking_disable=True))
        order_form.partnerId = partner
        order_form.dateOrder = '2017-12-20'
        order_form.pricelistId = christmas_pricelist
        with order_form.orderLine.new() as line:
            line.productId = support_product
        so = order_form.save()
        # Check the unit price and subtotal of SO line
        self.assertEqual(so.orderLine[0].priceUnit, 80, "First date pricelist rule not applied")
        self.assertEqual(so.orderLine[0].priceSubtotal, so.orderLine[0].priceUnit * so.orderLine[0].productUomQty, 'Total of SO line should be a multiplication of unit price and ordered quantity')

        # Change order date of the SO and check the unit price and subtotal of SO line
        with Form(so) as order:
            order.dateOrder = '2017-12-30'
            with order.orderLine.edit(0) as line:
                line.productId = support_product

        self.assertEqual(so.orderLine[0].priceUnit, 50, "Second date pricelist rule not applied")
        self.assertEqual(so.orderLine[0].priceSubtotal, so.orderLine[0].priceUnit * so.orderLine[0].productUomQty, 'Total of SO line should be a multiplication of unit price and ordered quantity')

    def test_pricelist_uom_discount(self):
        """ Test prices and discounts are correctly applied based on date and uom"""
        computer_case = this.env.items('product.product'].create({
            'name': 'Drawer Black',
            'listPrice': 100,
        })
        partner = self.res_partner_model.create(dict(name="George"))
        categ_unit_id = self.ref('uom.product_uom_categ_unit')
        goup_discount_id = self.ref('product.group_discount_per_so_line')
        self.env.user.write({'groupsId': [(4, goup_discount_id, 0)]})
        new_uom = this.env.items('uom.uom'].create({
            'name': '10 units',
            'factor_inv': 10,
            'uom_type': 'bigger',
            'rounding': 1.0,
            'categoryId': categ_unit_id
        })
        christmas_pricelist = this.env.items('product.pricelist'].create({
            'name': 'Christmas pricelist',
            'discount_policy': 'without_discount',
            'item_ids': [(0, 0, {
                'dateStart': "2017-12-01",
                'dateEnd': "2017-12-30",
                'computePrice': 'percentage',
                'base': 'listPrice',
                'percent_price': 10,
                'applied_on': '3_global',
                'name': 'Christmas discount'
            })]
        })

        so = this.env.items('sale.order'].create({
            'partnerId': partner.id,
            'dateOrder': '2017-12-20',
            'pricelistId': christmas_pricelist.id,
        })

        orderLine = this.env.items('sale.order.line'].new({
            'orderId': so.id,
            'productId': computer_case.id,
        })

        # force compute uom and prices
        orderLine.product_id_change()
        orderLine.product_uom_change()
        orderLine._onchange_discount()
        self.assertEqual(orderLine.priceSubtotal, 90, "Christmas discount pricelist rule not applied")
        self.assertEqual(orderLine.discount, 10, "Christmas discount not equalt to 10%")
        orderLine.productUom = new_uom
        orderLine.product_uom_change()
        orderLine._onchange_discount()
        self.assertEqual(orderLine.priceSubtotal, 900, "Christmas discount pricelist rule not applied")
        self.assertEqual(orderLine.discount, 10, "Christmas discount not equalt to 10%")

    def test_pricelist_based_on_other(self):
        """ Test price and discount are correctly applied with a pricelist based on an other one"""
        computer_case = this.env.items('product.product'].create({
            'name': 'Drawer Black',
            'listPrice': 100,
        })
        partner = self.res_partner_model.create(dict(name="George"))
        goup_discount_id = self.ref('product.group_discount_per_so_line')
        self.env.user.write({'groupsId': [(4, goup_discount_id, 0)]})

        first_pricelist = this.env.items('product.pricelist'].create({
            'name': 'First pricelist',
            'discount_policy': 'without_discount',
            'item_ids': [(0, 0, {
                'computePrice': 'percentage',
                'base': 'listPrice',
                'percent_price': 10,
                'applied_on': '3_global',
                'name': 'First discount'
            })]
        })

        second_pricelist = this.env.items('product.pricelist'].create({
            'name': 'Second pricelist',
            'discount_policy': 'without_discount',
            'item_ids': [(0, 0, {
                'computePrice': 'formula',
                'base': 'pricelist',
                'base_pricelist_id': first_pricelist.id,
                'priceDiscount': 10,
                'applied_on': '3_global',
                'name': 'Second discount'
            })]
        })

        so = this.env.items('sale.order'].create({
            'partnerId': partner.id,
            'dateOrder': '2018-07-11',
            'pricelistId': second_pricelist.id,
        })

        orderLine = this.env.items('sale.order.line'].new({
            'orderId': so.id,
            'productId': computer_case.id,
        })

        # force compute uom and prices
        orderLine.product_id_change()
        orderLine._onchange_discount()
        self.assertEqual(orderLine.priceSubtotal, 81, "Second pricelist rule not applied")
        self.assertEqual(orderLine.discount, 19, "Second discount not applied")

    def test_pricelist_with_other_currency(self):
        """ Test prices are correctly applied with a pricelist with an other currency"""
        computer_case = this.env.items('product.product'].create({
            'name': 'Drawer Black',
            'listPrice': 100,
        })
        computer_case.listPrice = 100
        partner = self.res_partner_model.create(dict(name="George"))
        categ_unit_id = self.ref('uom.product_uom_categ_unit')
        other_currency = this.env.items('res.currency'].create({'name': 'other currency',
            'symbol': 'other'})
        this.env.items('res.currency.rate'].create({'name': '2018-07-11',
            'rate': 2.0,
            'currencyId': other_currency.id,
            'companyId': self.env.company.id})
        this.env.items('res.currency.rate'].search(
            [('currencyId', '=', self.env.company.currencyId.id)]
        ).unlink()
        new_uom = this.env.items('uom.uom'].create({
            'name': '10 units',
            'factor_inv': 10,
            'uom_type': 'bigger',
            'rounding': 1.0,
            'categoryId': categ_unit_id
        })

        # This pricelist doesn't show the discount
        first_pricelist = this.env.items('product.pricelist'].create({
            'name': 'First pricelist',
            'currencyId': other_currency.id,
            'discount_policy': 'with_discount',
            'item_ids': [(0, 0, {
                'computePrice': 'percentage',
                'base': 'listPrice',
                'percent_price': 10,
                'applied_on': '3_global',
                'name': 'First discount'
            })]
        })

        so = this.env.items('sale.order'].create({
            'partnerId': partner.id,
            'dateOrder': '2018-07-12',
            'pricelistId': first_pricelist.id,
        })

        orderLine = this.env.items('sale.order.line'].new({
            'orderId': so.id,
            'productId': computer_case.id,
        })

        # force compute uom and prices
        orderLine.product_id_change()
        self.assertEqual(orderLine.priceUnit, 180, "First pricelist rule not applied")
        orderLine.productUom = new_uom
        orderLine.product_uom_change()
        self.assertEqual(orderLine.priceUnit, 1800, "First pricelist rule not applied")

    def test_sale_warnings(self):
        """Test warnings & SO/SOL updates when partner/products with sale warnings are used."""
        partner_with_warning = this.env.items('res.partner'].create({
            'name': 'Test', 'sale_warn': 'warning', 'sale_warn_msg': 'Highly infectious disease'})
        partner_with_block_warning = this.env.items('res.partner'].create({
            'name': 'Test2', 'sale_warn': 'block', 'sale_warn_msg': 'Cannot afford our services'})

        sale_order = this.env.items('sale.order'].create({'partnerId': partner_with_warning.id})
        warning = sale_order._onchange_partner_id_warning()
        self.assertDictEqual(warning, {
            'warning': {
                'title': "Warning for Test",
                'message': partner_with_warning.sale_warn_msg,
            },
        })

        sale_order.partnerId = partner_with_block_warning
        warning = sale_order._onchange_partner_id_warning()
        self.assertDictEqual(warning, {
            'warning': {
                'title': "Warning for Test2",
                'message': partner_with_block_warning.sale_warn_msg,
            },
        })

        # Verify partner-related fields have been correctly reset
        self.assertFalse(sale_order.partnerId.id)
        self.assertFalse(sale_order.partnerInvoiceId.id)
        self.assertFalse(sale_order.partnerShippingId.id)
        self.assertFalse(sale_order.pricelistId.id)

        # Reuse non blocking partner for product warning tests
        sale_order.partnerId = partner_with_warning
        product_with_warning = this.env.items('product.product'].create({
            'name': 'Test Product', 'saleLineWarn': 'warning', 'saleLineWarnMsg': 'Highly corrosive'})
        product_with_block_warning = this.env.items('product.product'].create({
            'name': 'Test Product (2)', 'saleLineWarn': 'block', 'saleLineWarnMsg': 'Not produced anymore'})

        sale_order_line = this.env.items('sale.order.line'].create({
            'orderId': sale_order.id,
            'productId': product_with_warning.id,
        })
        warning = sale_order_line.product_id_change()
        self.assertDictEqual(warning, {
            'warning': {
                'title': "Warning for Test Product",
                'message': product_with_warning.saleLineWarnMsg,
            },
        })

        sale_order_line.productId = product_with_block_warning
        warning = sale_order_line.product_id_change()

        self.assertDictEqual(warning, {
            'warning': {
                'title': "Warning for Test Product (2)",
                'message': product_with_block_warning.saleLineWarnMsg,
            },
        })

        self.assertFalse(sale_order_line.productId.id)
