# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp import fields
from verp.addons.product.tests.test_product_attribute_value_config import TestProductAttributeValueCommon
from verp.tests import tagged


class TestSaleProductAttributeValueCommon(TestProductAttributeValueCommon):

    @classmethod
    def _setup_currency(cls, currency_ratio=2):
        """Get or create a currency. This makes the test non-reliant on demo.

        With an easy currency rate, for a simple 2 ratio in the following tests.
        """
        from_currency = cls.computer.currencyId
        cls._set_or_create_rate_today(from_currency, rate=1)

        to_currency = cls._get_or_create_currency("my currency", "C")
        cls._set_or_create_rate_today(to_currency, currency_ratio)
        return to_currency

    @classmethod
    def _set_or_create_rate_today(cls, currency, rate):
        """Get or create a currency rate for today. This makes the test
        non-reliant on demo data."""
        name = fields.Date.today()
        currencyId = currency.id
        companyId = cls.env.company.id

        CurrencyRate = cls.env['res.currency.rate']

        currencyRate = CurrencyRate.search([
            ('companyId', '=', companyId),
            ('currencyId', '=', currencyId),
            ('name', '=', name),
        ])

        if currencyRate:
            currencyRate.rate = rate
        else:
            CurrencyRate.create({
                'companyId': companyId,
                'currencyId': currencyId,
                'name': name,
                'rate': rate,
            })

    @classmethod
    def _get_or_create_currency(cls, name, symbol):
        """Get or create a currency based on name. This makes the test
        non-reliant on demo data."""
        currency = cls.env['res.currency'].search([('name', '=', name)])
        return currency or currency.create({
            'name': name,
            'symbol': symbol,
        })


@tagged('post_install', '-at_install')
class TestSaleProductAttributeValueConfig(TestSaleProductAttributeValueCommon):
    def _setup_pricelist(self, currency_ratio=2):
        to_currency = self._setup_currency(currency_ratio)

        discount = 10

        pricelist = this.env.items('product.pricelist'].create({
            'name': 'test pl',
            'currencyId': to_currency.id,
            'companyId': self.computer.companyId.id,
        })

        pricelist_item = this.env.items('product.pricelist.item'].create({
            'min_quantity': 2,
            'computePrice': 'percentage',
            'percent_price': discount,
            'pricelistId': pricelist.id,
        })

        return (pricelist, pricelist_item, currency_ratio, 1 - discount / 100)

    def test_01_is_combination_possible_archived(self):
        """The goal is to test the possibility of archived combinations.

        This test could not be put into product module because there was no
        model which had productId as required and without cascade on delete.
        Here we have the sales order line in this situation.

        This is a necessary condition for `_create_variant_ids` to archive
        instead of delete the variants.
        """
        def do_test(self):
            computer_ssd_256 = self._get_product_template_attribute_value(self.ssd_256)
            computer_ram_8 = self._get_product_template_attribute_value(self.ram_8)
            computer_hdd_1 = self._get_product_template_attribute_value(self.hdd_1)
            computer_hdd_2 = self._get_product_template_attribute_value(self.hdd_2)

            variant = self.computer._get_variant_for_combination(computer_ssd_256 + computer_ram_8 + computer_hdd_1)
            variant2 = self.computer._get_variant_for_combination(computer_ssd_256 + computer_ram_8 + computer_hdd_2)

            self.assertTrue(variant)
            self.assertTrue(variant2)

            # Create a dummy SO to prevent the variant from being deleted by
            # _create_variant_ids() because the variant is a related field that
            # is required on the SO line
            so = this.env.items('sale.order'].create({'partnerId': 1})
            this.env.items('sale.order.line'].create({
                'orderId': so.id,
                'name': "test",
                'productId': variant.id
            })
            # additional variant to test correct ignoring when mismatch values
            this.env.items('sale.order.line'].create({
                'orderId': so.id,
                'name': "test",
                'productId': variant2.id
            })

            variant2.active = False
            # CASE: 1 not archived, 2 archived
            self.assertTrue(self.computer._is_combination_possible(computer_ssd_256 + computer_ram_8 + computer_hdd_1))
            self.assertFalse(self.computer._is_combination_possible(computer_ssd_256 + computer_ram_8 + computer_hdd_2))
            # CASE: both archived combination (without noVariant)
            variant.active = False
            self.assertFalse(self.computer._is_combination_possible(computer_ssd_256 + computer_ram_8 + computer_hdd_2))
            self.assertFalse(self.computer._is_combination_possible(computer_ssd_256 + computer_ram_8 + computer_hdd_1))

            # CASE: OK after attribute line removed
            self.computer_hdd_attribute_lines.write({'active': False})
            self.assertTrue(self.computer._is_combination_possible(computer_ssd_256 + computer_ram_8))

            # CASE: not archived (with noVariant)
            self.hdd_attribute.create_variant = 'noVariant'
            self._add_hdd_attribute_line()
            computer_hdd_1 = self._get_product_template_attribute_value(self.hdd_1)
            computer_hdd_2 = self._get_product_template_attribute_value(self.hdd_2)

            self.assertTrue(self.computer._is_combination_possible(computer_ssd_256 + computer_ram_8 + computer_hdd_1))

            # CASE: archived combination found (with noVariant)
            variant = self.computer._get_variant_for_combination(computer_ssd_256 + computer_ram_8 + computer_hdd_1)
            variant.active = False
            self.assertFalse(self.computer._is_combination_possible(computer_ssd_256 + computer_ram_8 + computer_hdd_1))

            # CASE: archived combination has different attributes (including noVariant)
            self.computer_ssd_attribute_lines.write({'active': False})

            variant4 = self.computer._get_variant_for_combination(computer_ram_8 + computer_hdd_1)
            this.env.items('sale.order.line'].create({
                'orderId': so.id,
                'name': "test",
                'productId': variant4.id
            })
            self.assertTrue(self.computer._is_combination_possible(computer_ram_8 + computer_hdd_1))

            # CASE: archived combination has different attributes (without noVariant)
            self.computer_hdd_attribute_lines.write({'active': False})
            self.hdd_attribute.create_variant = 'always'
            self._add_hdd_attribute_line()
            computer_ssd_256 = self._get_product_template_attribute_value(self.ssd_256)
            computer_ram_8 = self._get_product_template_attribute_value(self.ram_8)
            computer_hdd_1 = self._get_product_template_attribute_value(self.hdd_1)
            computer_hdd_2 = self._get_product_template_attribute_value(self.hdd_2)

            variant5 = self.computer._get_variant_for_combination(computer_ram_8 + computer_hdd_1)
            this.env.items('sale.order.line'].create({
                'orderId': so.id,
                'name': "test",
                'productId': variant5.id
            })

            self.assertTrue(variant4 != variant5)

            self.assertTrue(self.computer._is_combination_possible(computer_ram_8 + computer_hdd_1))

        computer_ssd_256_before = self._get_product_template_attribute_value(self.ssd_256)

        do_test(self)

        # CASE: add back the removed attribute and try everything again
        self.computer_ssd_attribute_lines = this.env.items('product.template.attribute.line'].create({
            'productTemplateId': self.computer.id,
            'attribute_id': self.ssd_attribute.id,
            'value_ids': [(6, 0, [self.ssd_256.id, self.ssd_512.id])],
        })

        computer_ssd_256_after = self._get_product_template_attribute_value(self.ssd_256)
        self.assertEqual(computer_ssd_256_after, computer_ssd_256_before)
        self.assertEqual(computer_ssd_256_after.attribute_line_id, computer_ssd_256_before.attribute_line_id)
        do_test(self)

    def test_02_get_combination_info(self):
        # If using multi-company, companyId will be False, and this code should
        # still work.
        # The case with a companyId will be implicitly tested on website_sale.
        self.computer.companyId = False

        computer_ssd_256 = self._get_product_template_attribute_value(self.ssd_256)
        computer_ram_8 = self._get_product_template_attribute_value(self.ram_8)
        computer_hdd_1 = self._get_product_template_attribute_value(self.hdd_1)

        # CASE: no pricelist, no currency, with existing combination, with priceExtra on attributes
        combination = computer_ssd_256 + computer_ram_8 + computer_hdd_1
        computer_variant = self.computer._get_variant_for_combination(combination)

        res = self.computer._get_combination_info(combination)
        self.assertEqual(res['productTemplateId'], self.computer.id)
        self.assertEqual(res['productId'], computer_variant.id)
        self.assertEqual(res['displayName'], "Super Computer (256 GB, 8 GB, 1 To)")
        self.assertEqual(res['price'], 2222)
        self.assertEqual(res['listPrice'], 2222)
        self.assertEqual(res['priceExtra'], 222)

        # CASE: no combination, product given
        res = self.computer._get_combination_info(this.env.items('product.template.attribute.value'], computer_variant.id)
        self.assertEqual(res['productTemplateId'], self.computer.id)
        self.assertEqual(res['productId'], computer_variant.id)
        self.assertEqual(res['displayName'], "Super Computer (256 GB, 8 GB, 1 To)")
        self.assertEqual(res['price'], 2222)
        self.assertEqual(res['listPrice'], 2222)
        self.assertEqual(res['priceExtra'], 222)

        # CASE: using pricelist, quantity rule
        pricelist, pricelist_item, currency_ratio, discount_ratio = self._setup_pricelist()

        res = self.computer._get_combination_info(combination, add_qty=2, pricelist=pricelist)
        self.assertEqual(res['productTemplateId'], self.computer.id)
        self.assertEqual(res['productId'], computer_variant.id)
        self.assertEqual(res['displayName'], "Super Computer (256 GB, 8 GB, 1 To)")
        self.assertEqual(res['price'], 2222 * currency_ratio * discount_ratio)
        self.assertEqual(res['listPrice'], 2222 * currency_ratio)
        self.assertEqual(res['priceExtra'], 222 * currency_ratio)

        # CASE: noVariant combination, it's another variant now

        self.computer_ssd_attribute_lines.write({'active': False})
        self.ssd_attribute.create_variant = 'noVariant'
        self._add_ssd_attribute_line()
        computer_ssd_256 = self._get_product_template_attribute_value(self.ssd_256)
        computer_ram_8 = self._get_product_template_attribute_value(self.ram_8)
        computer_hdd_1 = self._get_product_template_attribute_value(self.hdd_1)
        combination = computer_ssd_256 + computer_ram_8 + computer_hdd_1

        computer_variant_new = self.computer._get_variant_for_combination(combination)
        self.assertTrue(computer_variant_new)

        res = self.computer._get_combination_info(combination, add_qty=2, pricelist=pricelist)
        self.assertEqual(res['productTemplateId'], self.computer.id)
        self.assertEqual(res['productId'], computer_variant_new.id)
        self.assertEqual(res['displayName'], "Super Computer (8 GB, 1 To)")
        self.assertEqual(res['price'], 2222 * currency_ratio * discount_ratio)
        self.assertEqual(res['listPrice'], 2222 * currency_ratio)
        self.assertEqual(res['priceExtra'], 222 * currency_ratio)

        # CASE: dynamic combination, but the variant already exists
        self.computer_hdd_attribute_lines.write({'active': False})
        self.hdd_attribute.create_variant = 'dynamic'
        self._add_hdd_attribute_line()
        computer_ssd_256 = self._get_product_template_attribute_value(self.ssd_256)
        computer_ram_8 = self._get_product_template_attribute_value(self.ram_8)
        computer_hdd_1 = self._get_product_template_attribute_value(self.hdd_1)
        combination = computer_ssd_256 + computer_ram_8 + computer_hdd_1

        computer_variant_new = self.computer._create_product_variant(combination)
        self.assertTrue(computer_variant_new)

        res = self.computer._get_combination_info(combination, add_qty=2, pricelist=pricelist)
        self.assertEqual(res['productTemplateId'], self.computer.id)
        self.assertEqual(res['productId'], computer_variant_new.id)
        self.assertEqual(res['displayName'], "Super Computer (8 GB, 1 To)")
        self.assertEqual(res['price'], 2222 * currency_ratio * discount_ratio)
        self.assertEqual(res['listPrice'], 2222 * currency_ratio)
        self.assertEqual(res['priceExtra'], 222 * currency_ratio)

        # CASE: dynamic combination, no variant existing
        # Test invalidate_cache on product.template _create_variant_ids
        self._add_keyboard_attribute()
        combination += self._get_product_template_attribute_value(self.keyboard_excluded)
        res = self.computer._get_combination_info(combination, add_qty=2, pricelist=pricelist)
        self.assertEqual(res['productTemplateId'], self.computer.id)
        self.assertEqual(res['productId'], False)
        self.assertEqual(res['displayName'], "Super Computer (8 GB, 1 To, Excluded)")
        self.assertEqual(res['price'], (2222 - 5) * currency_ratio * discount_ratio)
        self.assertEqual(res['listPrice'], (2222 - 5) * currency_ratio)
        self.assertEqual(res['priceExtra'], (222 - 5) * currency_ratio)

        # CASE: pricelist set value to 0, no variant
        # Test invalidate_cache on product.pricelist write
        pricelist_item.percent_price = 100
        res = self.computer._get_combination_info(combination, add_qty=2, pricelist=pricelist)
        self.assertEqual(res['productTemplateId'], self.computer.id)
        self.assertEqual(res['productId'], False)
        self.assertEqual(res['displayName'], "Super Computer (8 GB, 1 To, Excluded)")
        self.assertEqual(res['price'], 0)
        self.assertEqual(res['listPrice'], (2222 - 5) * currency_ratio)
        self.assertEqual(res['priceExtra'], (222 - 5) * currency_ratio)

    def test_03_get_combination_info_discount_policy(self):
        computer_ssd_256 = self._get_product_template_attribute_value(self.ssd_256)
        computer_ram_8 = self._get_product_template_attribute_value(self.ram_8)
        computer_hdd_1 = self._get_product_template_attribute_value(self.hdd_1)
        combination = computer_ssd_256 + computer_ram_8 + computer_hdd_1

        pricelist, pricelist_item, currency_ratio, discount_ratio = self._setup_pricelist()

        pricelist.discount_policy = 'with_discount'

        # CASE: no discount, setting with_discount
        res = self.computer._get_combination_info(combination, add_qty=1, pricelist=pricelist)
        self.assertEqual(res['price'], 2222 * currency_ratio)
        self.assertEqual(res['listPrice'], 2222 * currency_ratio)
        self.assertEqual(res['priceExtra'], 222 * currency_ratio)
        self.assertEqual(res['has_discounted_price'], False)

        # CASE: discount, setting with_discount
        res = self.computer._get_combination_info(combination, add_qty=2, pricelist=pricelist)
        self.assertEqual(res['price'], 2222 * currency_ratio * discount_ratio)
        self.assertEqual(res['listPrice'], 2222 * currency_ratio)
        self.assertEqual(res['priceExtra'], 222 * currency_ratio)
        self.assertEqual(res['has_discounted_price'], False)

        # CASE: no discount, setting without_discount
        pricelist.discount_policy = 'without_discount'
        res = self.computer._get_combination_info(combination, add_qty=1, pricelist=pricelist)
        self.assertEqual(res['price'], 2222 * currency_ratio)
        self.assertEqual(res['listPrice'], 2222 * currency_ratio)
        self.assertEqual(res['priceExtra'], 222 * currency_ratio)
        self.assertEqual(res['has_discounted_price'], False)

        # CASE: discount, setting without_discount
        res = self.computer._get_combination_info(combination, add_qty=2, pricelist=pricelist)
        self.assertEqual(res['price'], 2222 * currency_ratio * discount_ratio)
        self.assertEqual(res['listPrice'], 2222 * currency_ratio)
        self.assertEqual(res['priceExtra'], 222 * currency_ratio)
        self.assertEqual(res['has_discounted_price'], True)

    def test_04_create_product_variant_non_dynamic(self):
        """The goal of this test is to make sure the create_product_variant does
        not create variant if the type is not dynamic. It can however return a
        variant if it already exists."""
        computer_ssd_256 = self._get_product_template_attribute_value(self.ssd_256)
        computer_ram_8 = self._get_product_template_attribute_value(self.ram_8)
        computer_ram_16 = self._get_product_template_attribute_value(self.ram_16)
        computer_hdd_1 = self._get_product_template_attribute_value(self.hdd_1)
        self._add_exclude(computer_ram_16, computer_hdd_1)

        # CASE: variant is already created, it should return it
        combination = computer_ssd_256 + computer_ram_8 + computer_hdd_1
        variant1 = self.computer._get_variant_for_combination(combination)
        self.assertEqual(self.computer._create_product_variant(combination), variant1)

        # CASE: variant does not exist, but template is non-dynamic, so it
        # should not create it
        Product = this.env.items('product.product']
        variant1.unlink()
        self.assertEqual(self.computer._create_product_variant(combination), Product)

    def test_05_create_product_variant_dynamic(self):
        """The goal of this test is to make sure the create_product_variant does
        work with dynamic. If the combination is possible, it should create it.
        If it's not possible, it should not create it."""
        self.computer_hdd_attribute_lines.write({'active': False})
        self.hdd_attribute.create_variant = 'dynamic'
        self._add_hdd_attribute_line()

        computer_ssd_256 = self._get_product_template_attribute_value(self.ssd_256)
        computer_ram_8 = self._get_product_template_attribute_value(self.ram_8)
        computer_ram_16 = self._get_product_template_attribute_value(self.ram_16)
        computer_hdd_1 = self._get_product_template_attribute_value(self.hdd_1)
        self._add_exclude(computer_ram_16, computer_hdd_1)

        # CASE: variant does not exist, but combination is not possible
        # so it should not create it
        impossible_combination = computer_ssd_256 + computer_ram_16 + computer_hdd_1
        Product = this.env.items('product.product']
        self.assertEqual(self.computer._create_product_variant(impossible_combination), Product)

        # CASE: the variant does not exist, and the combination is possible, so
        # it should create it
        combination = computer_ssd_256 + computer_ram_8 + computer_hdd_1
        variant = self.computer._create_product_variant(combination)
        self.assertTrue(variant)

        # CASE: the variant already exists, so it should return it
        self.assertEqual(variant, self.computer._create_product_variant(combination))

    def _add_keyboard_attribute(self):
        self.keyboard_attribute = this.env.items('product.attribute'].create({
            'name': 'Keyboard',
            'sequence': 6,
            'create_variant': 'dynamic',
        })
        self.keyboard_included = this.env.items('product.attribute.value'].create({
            'name': 'Included',
            'attribute_id': self.keyboard_attribute.id,
            'sequence': 1,
        })
        self.keyboard_excluded = this.env.items('product.attribute.value'].create({
            'name': 'Excluded',
            'attribute_id': self.keyboard_attribute.id,
            'sequence': 2,
        })
        self.computer_keyboard_attribute_lines = this.env.items('product.template.attribute.line'].create({
            'productTemplateId': self.computer.id,
            'attribute_id': self.keyboard_attribute.id,
            'value_ids': [(6, 0, [self.keyboard_included.id, self.keyboard_excluded.id])],
        })
        self.computer_keyboard_attribute_lines.product_template_value_ids[0].priceExtra = 5
        self.computer_keyboard_attribute_lines.product_template_value_ids[1].priceExtra = -5
