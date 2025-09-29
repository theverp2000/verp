# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp.tests import Form
from verp.tests import common
from verp.exceptions import ValidationError


class TestMrpByProduct(common.TransactionCase):

    def setUp(self):
        super(TestMrpByProduct, self).setUp()
        self.MrpBom = self.env['mrp.bom']
        self.warehouse = self.env.ref('stock.warehouse0')
        route_manufacture = self.warehouse.manufacture_pull_id.routeId.id
        route_mto = self.warehouse.mto_pull_id.routeId.id
        self.uom_unit_id = self.ref('uom.productUomUnit')
        def create_product(name, routeIds=[]):
            return self.env['product.product'].create({
                'name': name,
                'type': 'product',
                'routeIds': routeIds})

        # Create product A, B, C.
        # --------------------------
        self.product_a = create_product('Product A', routeIds=[(6, 0, [route_manufacture, route_mto])])
        self.product_b = create_product('Product B', routeIds=[(6, 0, [route_manufacture, route_mto])])
        self.product_c_id = create_product('Product C', routeIds=[]).id
        self.bom_byproduct = self.MrpBom.create({
            'productTemplateId': self.product_a.productTemplateId.id,
            'productQty': 1.0,
            'type': 'normal',
            'productUomId': self.uom_unit_id,
            'bom_line_ids': [(0, 0, {'productId': self.product_c_id, 'productUomId': self.uom_unit_id, 'productQty': 2})],
            'byproduct_ids': [(0, 0, {'productId': self.product_b.id, 'productUomId': self.uom_unit_id, 'productQty': 1})]
            })

    def test_00_mrp_byproduct(self):
        """ Test by product with production order."""
        # Create BOM for product B
        # ------------------------
        bom_product_b = self.MrpBom.create({
            'productTemplateId': self.product_b.productTemplateId.id,
            'productQty': 1.0,
            'type': 'normal',
            'productUomId': self.uom_unit_id,
            'bom_line_ids': [(0, 0, {'productId': self.product_c_id, 'productUomId': self.uom_unit_id, 'productQty': 2})]
            })

        # Create production order for product A
        # -------------------------------------

        mnf_product_a_form = Form(self.env['mrp.production'])
        mnf_product_a_form.productId = self.product_a
        mnf_product_a_form.bomId = self.bom_byproduct
        mnf_product_a_form.productQty = 2.0
        mnf_product_a = mnf_product_a_form.save()
        mnf_product_a.action_confirm()

        # I confirm the production order.
        self.assertEqual(mnf_product_a.state, 'confirmed', 'Production order should be in state confirmed')

        # Now I check the stock moves for the byproduct I created in the bill of material.
        # This move is created automatically when I confirmed the production order.
        moves = mnf_product_a.moveRawIds | mnf_product_a.move_finished_ids
        self.assertTrue(moves, 'No moves are created !')

        # I consume and produce the production of products.
        # I create record for selecting mode and quantity of products to produce.
        mo_form = Form(mnf_product_a)
        mnf_product_a.move_byproduct_ids.quantityDone = 2
        mo_form.qtyProducing = 2.00
        mnf_product_a = mo_form.save()
        # I finish the production order.
        self.assertEqual(len(mnf_product_a.moveRawIds), 1, "Wrong consume move on production order.")
        consume_move_c = mnf_product_a.moveRawIds
        by_product_move = mnf_product_a.move_finished_ids.filtered(lambda x: x.productId.id == self.product_b.id)
        # Check sub production produced quantity...
        self.assertEqual(consume_move_c.productUomQty, 4, "Wrong consumed quantity of product c.")
        self.assertEqual(by_product_move.productUomQty, 2, "Wrong produced quantity of sub product.")

        mnf_product_a._post_inventory()

        # I see that stock moves of External Hard Disk including Headset USB are done now.
        self.assertFalse(any(move.state != 'done' for move in moves), 'Moves are not done!')

    def test_01_mrp_byproduct(self):
        self.env["stock.quant"].create({
            "productId": self.product_c_id,
            "locationId": self.warehouse.lot_stock_id.id,
            "quantity": 4,
        })
        bom_product_a = self.MrpBom.create({
            'productTemplateId': self.product_a.productTemplateId.id,
            'productQty': 1.0,
            'type': 'normal',
            'productUomId': self.uom_unit_id,
            'bom_line_ids': [(0, 0, {'productId': self.product_c_id, 'productUomId': self.uom_unit_id, 'productQty': 2})]
            })
        mnf_product_a_form = Form(self.env['mrp.production'])
        mnf_product_a_form.productId = self.product_a
        mnf_product_a_form.bomId = bom_product_a
        mnf_product_a_form.productQty = 2.0
        mnf_product_a = mnf_product_a_form.save()
        mnf_product_a.action_confirm()
        self.assertEqual(mnf_product_a.state, "confirmed")
        mnf_product_a.moveRawIds._action_assign()
        mnf_product_a.moveRawIds.quantityDone = mnf_product_a.moveRawIds.productUomQty
        mnf_product_a.moveRawIds._action_done()
        self.assertEqual(mnf_product_a.state, "progress")
        mnf_product_a.qtyProducing = 2
        mnf_product_a.button_mark_done()
        self.assertTrue(mnf_product_a.move_finished_ids)
        self.assertEqual(mnf_product_a.state, "done")

    def test_change_product(self):
        """ Create a production order for a specific product with a BoM. Then change the BoM and the finished product for
        other ones and check the finished product of the first mo did not became a byproduct of the second one."""
        # Create BOM for product A with product B as component
        bom_product_a = self.MrpBom.create({
            'productTemplateId': self.product_a.productTemplateId.id,
            'productQty': 1.0,
            'type': 'normal',
            'productUomId': self.uom_unit_id,
            'bom_line_ids': [(0, 0, {'productId': self.product_b.id, 'productUomId': self.uom_unit_id, 'productQty': 2})],
            })

        bom_product_a_2 = self.MrpBom.create({
            'productTemplateId': self.product_b.productTemplateId.id,
            'productQty': 1.0,
            'type': 'normal',
            'productUomId': self.uom_unit_id,
            'bom_line_ids': [(0, 0, {'productId': self.product_c_id, 'productUomId': self.uom_unit_id, 'productQty': 2})],
            })
        # Create production order for product A
        # -------------------------------------

        mnf_product_a_form = Form(self.env['mrp.production'])
        mnf_product_a_form.productId = self.product_a
        mnf_product_a_form.bomId = bom_product_a
        mnf_product_a_form.productQty = 1.0
        mnf_product_a = mnf_product_a_form.save()
        mnf_product_a_form = Form(mnf_product_a)
        mnf_product_a_form.bomId = bom_product_a_2
        mnf_product_a = mnf_product_a_form.save()
        self.assertEqual(mnf_product_a.moveRawIds.productId.id, self.product_c_id)
        self.assertFalse(mnf_product_a.move_byproduct_ids)

    def test_byproduct_putaway(self):
        """
        Test the byproducts are dispatched correctly with putaway rules. We have
        a byproduct P and two sublocations L01, L02 with a capacity constraint:
        max 2 x P by location. There is already 1 x P at L01. Process a MO with
        2 x P as byproducts. They should be redirected to L02
        """

        self.stock_location = self.env.ref('stock.stock_location_stock')
        stor_category = self.env['stock.storage.category'].create({
            'name': 'Super Storage Category',
            'max_weight': 1000,
            'product_capacity_ids': [(0, 0, {
                'productId': self.product_b.id,
                'quantity': 2,
            })]
        })
        shelf1_location = self.env['stock.location'].create({
            'name': 'shelf1',
            'usage': 'internal',
            'locationId': self.stock_location.id,
            'storage_category_id': stor_category.id,
        })
        shelf2_location = self.env['stock.location'].create({
            'name': 'shelf2',
            'usage': 'internal',
            'locationId': self.stock_location.id,
            'storage_category_id': stor_category.id,
        })
        self.env['stock.putaway.rule'].create({
            'productId': self.product_b.id,
            'location_in_id': self.stock_location.id,
            'location_out_id': self.stock_location.id,
            'storage_category_id': stor_category.id,
        })
        self.env['stock.putaway.rule'].create({
            'productId': self.product_a.id,
            'location_in_id': self.stock_location.id,
            'location_out_id': shelf2_location.id,
        })

        self.env['stock.quant']._update_available_quantity(self.product_b, shelf1_location, 1)

        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = self.product_a
        mo_form.bomId = self.bom_byproduct
        mo_form.productQty = 2.0
        mo = mo_form.save()
        mo.action_confirm()
        mo_form = Form(mo)
        with mo_form.move_byproduct_ids.edit(0) as move:
            move.quantityDone = 2
        mo_form.qtyProducing = 2.00
        mo = mo_form.save()

        mo._post_inventory()
        byproduct_move_line = mo.move_byproduct_ids.moveLineIds
        finished_move_line = mo.move_finished_ids.filtered(lambda m: m.productId == self.product_a).moveLineIds
        self.assertEqual(byproduct_move_line.locationDestId, shelf2_location)
        self.assertEqual(finished_move_line.locationDestId, shelf2_location)

    def test_check_byproducts_cost_share(self):
        """
        Test that byproducts with total costShare > 100% or a costShare < 0%
        will throw a ValidationError
        """
        # Create new MO
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = self.product_a
        mo_form.productQty = 2.0
        mo = mo_form.save()

        # Create product
        self.product_d = self.env['product.product'].create({
                'name': 'Product D',
                'type': 'product'})
        self.product_e = self.env['product.product'].create({
                'name': 'Product E',
                'type': 'product'})

        # Create byproduct
        byproduct_1 = self.env['stock.move'].create({
            'name': 'By Product 1',
            'productId': self.product_d.id,
            'productUom': self.ref('uom.productUomUnit'),
            'productionId': mo.id,
            'locationId': self.ref('stock.stock_location_stock'),
            'locationDestId': self.ref('stock.stock_location_output'),
            'productUomQty': 0,
            'quantityDone': 0
            })
        byproduct_2 = self.env['stock.move'].create({
            'name': 'By Product 2',
            'productId': self.product_e.id,
            'productUom': self.ref('uom.productUomUnit'),
            'productionId': mo.id,
            'locationId': self.ref('stock.stock_location_stock'),
            'locationDestId': self.ref('stock.stock_location_output'),
            'productUomQty': 0,
            'quantityDone': 0
            })

        # Update byproduct has cost share > 100%
        with self.assertRaises(ValidationError), self.cr.savepoint():
            byproduct_1.costShare = 120
            mo.write({'move_byproduct_ids': [(4, byproduct_1.id)]})

        # Update byproduct has cost share < 0%
        with self.assertRaises(ValidationError), self.cr.savepoint():
            byproduct_1.costShare = -10
            mo.write({'move_byproduct_ids': [(4, byproduct_1.id)]})

        # Update byproducts have total cost share > 100%
        with self.assertRaises(ValidationError), self.cr.savepoint():
            byproduct_1.costShare = 60
            byproduct_2.costShare = 70
            mo.write({'move_byproduct_ids': [(6, 0, [byproduct_1.id, byproduct_2.id])]})
