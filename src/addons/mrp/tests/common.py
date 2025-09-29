# -*- coding: utf-8 -*-

from verp.tests import Form
from verp.addons.mail.tests.common import mail_new_test_user
from verp.addons.stock.tests import common2


class TestMrpCommon(common2.TestStockCommon):

    @classmethod
    def generate_mo(self, tracking_final='none', tracking_base_1='none', tracking_base_2='none', qty_final=5, qty_base_1=4, qty_base_2=1, pickingTypeId=False, consumption=False):
        """ This function generate a manufacturing order with one final
        product and two consumed product. Arguments allows to choose
        the tracking/qty for each different products. It returns the
        MO, used bom and the tree products.
        """
        product_to_build = self.env['product.product'].create({
            'name': 'Young Tom',
            'type': 'product',
            'tracking': tracking_final,
        })
        product_to_use_1 = self.env['product.product'].create({
            'name': 'Botox',
            'type': 'product',
            'tracking': tracking_base_1,
        })
        product_to_use_2 = self.env['product.product'].create({
            'name': 'Old Tom',
            'type': 'product',
            'tracking': tracking_base_2,
        })
        bom_1 = self.env['mrp.bom'].create({
            'productId': product_to_build.id,
            'productTemplateId': product_to_build.productTemplateId.id,
            'productUomId': self.uom_unit.id,
            'productQty': 1.0,
            'type': 'normal',
            'consumption': consumption if consumption else 'flexible',
            'bom_line_ids': [
                (0, 0, {'productId': product_to_use_2.id, 'productQty': qty_base_2}),
                (0, 0, {'productId': product_to_use_1.id, 'productQty': qty_base_1})
            ]})
        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = product_to_build
        if pickingTypeId:
            mo_form.pickingTypeId = pickingTypeId
        mo_form.bomId = bom_1
        mo_form.productQty = qty_final
        mo = mo_form.save()
        mo.action_confirm()
        return mo, bom_1, product_to_build, product_to_use_1, product_to_use_2

    @classmethod
    def setUpClass(cls):
        super(TestMrpCommon, cls).setUpClass()

        # Update demo products
        (cls.product_2 | cls.product_3 | cls.product_4 | cls.product_5 | cls.product_6 | cls.product_7_3 | cls.product_8).write({
            'type': 'product',
        })

        # User Data: mrp user and mrp manager
        cls.user_mrp_user = mail_new_test_user(
            cls.env,
            name='Hilda Ferachwal',
            login='hilda',
            email='h.h@example.com',
            notification_type='inbox',
            groups='mrp.groupMrpUser, stock.groupStockUser, mrp.group_mrp_byproducts',
        )
        cls.user_mrp_manager = mail_new_test_user(
            cls.env,
            name='Gary Youngwomen',
            login='gary',
            email='g.g@example.com',
            notification_type='inbox',
            groups='mrp.groupMrpManager, stock.groupStockUser, mrp.group_mrp_byproducts',
        )

        cls.workcenter_1 = cls.env['mrp.workcenter'].create({
            'name': 'Nuclear Workcenter',
            'capacity': 2,
            'time_start': 10,
            'time_stop': 5,
            'time_efficiency': 80,
        })
        cls.workcenter_2 = cls.env['mrp.workcenter'].create({
            'name': 'Simple Workcenter',
            'capacity': 1,
            'time_start': 0,
            'time_stop': 0,
            'time_efficiency': 100,
        })
        cls.workcenter_3 = cls.env['mrp.workcenter'].create({
            'name': 'Double Workcenter',
            'capacity': 2,
            'time_start': 0,
            'time_stop': 0,
            'time_efficiency': 100,
        })

        cls.bom_1 = cls.env['mrp.bom'].create({
            'productId': cls.product_4.id,
            'productTemplateId': cls.product_4.productTemplateId.id,
            'productUomId': cls.uom_unit.id,
            'productQty': 4.0,
            'consumption': 'flexible',
            'operationIds': [
            ],
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': cls.product_2.id, 'productQty': 2}),
                (0, 0, {'productId': cls.product_1.id, 'productQty': 4})
            ]})
        cls.bom_2 = cls.env['mrp.bom'].create({
            'productId': cls.product_5.id,
            'productTemplateId': cls.product_5.productTemplateId.id,
            'productUomId': cls.product_5.uomId.id,
            'consumption': 'flexible',
            'productQty': 1.0,
            'operationIds': [
                (0, 0, {'name': 'Gift Wrap Maching', 'workcenterId': cls.workcenter_1.id, 'timeCycle': 15, 'sequence': 1}),
            ],
            'type': 'phantom',
            'sequence': 2,
            'bom_line_ids': [
                (0, 0, {'productId': cls.product_4.id, 'productQty': 2}),
                (0, 0, {'productId': cls.product_3.id, 'productQty': 3})
            ]})
        cls.bom_3 = cls.env['mrp.bom'].create({
            'productId': cls.product_6.id,
            'productTemplateId': cls.product_6.productTemplateId.id,
            'productUomId': cls.uom_dozen.id,
            'ready_to_produce': 'asap',
            'consumption': 'flexible',
            'productQty': 2.0,
            'operationIds': [
                (0, 0, {'name': 'Cutting Machine', 'workcenterId': cls.workcenter_1.id, 'timeCycle': 12, 'sequence': 1}),
                (0, 0, {'name': 'Weld Machine', 'workcenterId': cls.workcenter_1.id, 'timeCycle': 18, 'sequence': 2}),
            ],
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': cls.product_5.id, 'productQty': 2}),
                (0, 0, {'productId': cls.product_4.id, 'productQty': 8}),
                (0, 0, {'productId': cls.product_2.id, 'productQty': 12})
            ]})
        cls.bom_4 = cls.env['mrp.bom'].create({
            'productId': cls.product_6.id,
            'productTemplateId': cls.product_6.productTemplateId.id,
            'consumption': 'flexible',
            'productQty': 1.0,
            'operationIds': [
                (0, 0, {'name': 'Rub it gently with a cloth', 'workcenterId': cls.workcenter_2.id,
                        'time_mode_batch': 1, 'time_mode': "auto", 'sequence': 1}),
            ],
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': cls.product_1.id, 'productQty': 1}),
            ]})
        cls.bom_5 = cls.env['mrp.bom'].create({
            'productId': cls.product_6.id,
            'productTemplateId': cls.product_6.productTemplateId.id,
            'consumption': 'flexible',
            'productQty': 1.0,
            'operationIds': [
                (0, 0, {'name': 'Rub it gently with a cloth two at once', 'workcenterId': cls.workcenter_3.id,
                        'time_mode_batch': 2, 'time_mode': "auto", 'sequence': 1}),
            ],
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': cls.product_1.id, 'productQty': 1}),
            ]})
        cls.bom_6 = cls.env['mrp.bom'].create({
            'productId': cls.product_6.id,
            'productTemplateId': cls.product_6.productTemplateId.id,
            'consumption': 'flexible',
            'productQty': 1.0,
            'operationIds': [
                (0, 0, {'name': 'Rub it gently with a cloth two at once', 'workcenterId': cls.workcenter_3.id,
                        'time_mode_batch': 1, 'time_mode': "auto", 'sequence': 1}),
            ],
            'type': 'normal',
            'bom_line_ids': [
                (0, 0, {'productId': cls.product_1.id, 'productQty': 1}),
            ]})

        cls.stock_location_14 = cls.env['stock.location'].create({
            'name': 'Shelf 2',
            'locationId': cls.env.ref('stock.warehouse0').lot_stock_id.id,
        })
        cls.stock_location_components = cls.env['stock.location'].create({
            'name': 'Shelf 1',
            'locationId': cls.env.ref('stock.warehouse0').lot_stock_id.id,
        })
        cls.laptop = cls.env['product.product'].create({
            'name': 'Acoustic Bloc Screens',
            'uomId': cls.env.ref("uom.productUomUnit").id,
            'uomPoId': cls.env.ref("uom.productUomUnit").id,
            'type': 'product',
            'tracking': 'none',
            'categId': cls.env.ref('product.product_category_all').id,
        })
        cls.graphics_card = cls.env['product.product'].create({
            'name': 'Individual Workplace',
            'uomId': cls.env.ref("uom.productUomUnit").id,
            'uomPoId': cls.env.ref("uom.productUomUnit").id,
            'type': 'product',
            'tracking': 'none',
            'categId': cls.env.ref('product.product_category_all').id,
        })

    @classmethod
    def make_prods(cls, n):
        return [
            cls.env["product.product"].create(
                {"name": f"p{k + 1}", "type": "product"}
            )
            for k in range(n)
        ]

    @classmethod
    def make_bom(cls, p, *cs):
        return cls.env["mrp.bom"].create(
            {
                "productTemplateId": p.productTemplateId.id,
                "productId": p.id,
                "productQty": 1,
                "type": "phantom",
                "productUomId": cls.uom_unit.id,
                "bom_line_ids": [
                    (0, 0, {
                        "productId": c.id,
                        "productQty": 1,
                        "productUomId": cls.uom_unit.id
                    })
                    for c in cs
                ],
            }
        )
