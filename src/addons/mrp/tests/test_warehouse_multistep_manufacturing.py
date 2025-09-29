# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp.tests import Form, tagged
from verp.addons.mrp.tests.common import TestMrpCommon


@tagged('post_install', '-at_install')
class TestMultistepManufacturingWarehouse(TestMrpCommon):

    def setUp(self):
        super(TestMultistepManufacturingWarehouse, self).setUp()
        # Create warehouse
        self.customer_location = self.env['ir.model.data']._xmlid_to_res_id('stock.stock_location_customers')
        warehouse_form = Form(self.env['stock.warehouse'])
        warehouse_form.name = 'Test Warehouse'
        warehouse_form.code = 'TWH'
        self.warehouse = warehouse_form.save()

        self.uom_unit = self.env.ref('uom.productUomUnit')

        # Create manufactured product
        product_form = Form(self.env['product.product'])
        product_form.name = 'Stick'
        product_form.uomId = self.uom_unit
        product_form.uomPoId = self.uom_unit
        product_form.detailedType = 'product'
        product_form.routeIds.clear()
        product_form.routeIds.add(self.warehouse.manufacture_pull_id.routeId)
        product_form.routeIds.add(self.warehouse.mto_pull_id.routeId)
        self.finished_product = product_form.save()

        # Create raw product for manufactured product
        product_form = Form(self.env['product.product'])
        product_form.name = 'Raw Stick'
        product_form.detailedType = 'product'
        product_form.uomId = self.uom_unit
        product_form.uomPoId = self.uom_unit
        self.raw_product = product_form.save()

        # Create bom for manufactured product
        bom_product_form = Form(self.env['mrp.bom'])
        bom_product_form.productId = self.finished_product
        bom_product_form.productTemplateId = self.finished_product.productTemplateId
        bom_product_form.productQty = 1.0
        bom_product_form.type = 'normal'
        with bom_product_form.bom_line_ids.new() as bomLine:
            bomLine.productId = self.raw_product
            bomLine.productQty = 2.0

        self.bom = bom_product_form.save()

    def _check_location_and_routes(self):
        # Check manufacturing pull rule.
        self.assertTrue(self.warehouse.manufacture_pull_id)
        self.assertTrue(self.warehouse.manufacture_pull_id.active, self.warehouse.manufactureToResupply)
        self.assertTrue(self.warehouse.manufacture_pull_id.routeId)
        # Check new routes created or not.
        self.assertTrue(self.warehouse.pbm_route_id)
        # Check location should be created and linked to warehouse.
        self.assertTrue(self.warehouse.pbm_loc_id)
        self.assertEqual(self.warehouse.pbm_loc_id.active, self.warehouse.manufactureSteps != 'mrpOneStep', "Input location must be de-active for single step only.")
        self.assertTrue(self.warehouse.manu_type_id.active)

    def test_00_create_warehouse(self):
        """ Warehouse testing for direct manufacturing """
        with Form(self.warehouse) as warehouse:
            warehouse.manufactureSteps = 'mrpOneStep'
        self._check_location_and_routes()
        # Check locations of existing pull rule
        self.assertFalse(self.warehouse.pbm_route_id.rule_ids, 'only the update of global manufacture route should happen.')
        self.assertEqual(self.warehouse.manufacture_pull_id.locationId.id, self.warehouse.lot_stock_id.id)

    def test_01_warehouse_twostep_manufacturing(self):
        """ Warehouse testing for picking before manufacturing """
        with Form(self.warehouse) as warehouse:
            warehouse.manufactureSteps = 'pbm'
        self._check_location_and_routes()
        self.assertEqual(len(self.warehouse.pbm_route_id.rule_ids), 2)
        self.assertEqual(self.warehouse.manufacture_pull_id.locationId.id, self.warehouse.lot_stock_id.id)

    def test_02_warehouse_twostep_manufacturing(self):
        """ Warehouse testing for picking ans store after manufacturing """
        with Form(self.warehouse) as warehouse:
            warehouse.manufactureSteps = 'pbmSam'
        self._check_location_and_routes()
        self.assertEqual(len(self.warehouse.pbm_route_id.rule_ids), 3)
        self.assertEqual(self.warehouse.manufacture_pull_id.locationId.id, self.warehouse.sam_loc_id.id)

    def test_manufacturing_3_steps(self):
        """ Test MO/picking before manufacturing/picking after manufacturing
        components and move_orig/move_dest. Ensure that everything is created
        correctly.
        """
        with Form(self.warehouse) as warehouse:
            warehouse.manufactureSteps = 'pbmSam'

        production_form = Form(self.env['mrp.production'])
        production_form.productId = self.finished_product
        production_form.pickingTypeId = self.warehouse.manu_type_id
        production = production_form.save()
        production.action_confirm()

        moveRawIds = production.moveRawIds
        self.assertEqual(len(moveRawIds), 1)
        self.assertEqual(moveRawIds.productId, self.raw_product)
        self.assertEqual(moveRawIds.pickingTypeId, self.warehouse.manu_type_id)
        pbm_move = moveRawIds.move_orig_ids
        self.assertEqual(len(pbm_move), 1)
        self.assertEqual(pbm_move.locationId, self.warehouse.lot_stock_id)
        self.assertEqual(pbm_move.locationDestId, self.warehouse.pbm_loc_id)
        self.assertEqual(pbm_move.pickingTypeId, self.warehouse.pbm_type_id)
        self.assertFalse(pbm_move.move_orig_ids)

        move_finished_ids = production.move_finished_ids
        self.assertEqual(len(move_finished_ids), 1)
        self.assertEqual(move_finished_ids.productId, self.finished_product)
        self.assertEqual(move_finished_ids.pickingTypeId, self.warehouse.manu_type_id)
        sam_move = move_finished_ids.moveDestIds
        self.assertEqual(len(sam_move), 1)
        self.assertEqual(sam_move.locationId, self.warehouse.sam_loc_id)
        self.assertEqual(sam_move.locationDestId, self.warehouse.lot_stock_id)
        self.assertEqual(sam_move.pickingTypeId, self.warehouse.sam_type_id)
        self.assertFalse(sam_move.moveDestIds)

    def test_manufacturing_flow(self):
        """ Simulate a pick pack ship delivery combined with a picking before
        manufacturing and store after manufacturing. Also ensure that the MO and
        the moves to stock are created with the generic pull rules.
        In order to trigger the rule we create a picking to the customer with
        the 'make to order' procure method
        """
        with Form(self.warehouse) as warehouse:
            warehouse.manufactureSteps = 'pbmSam'
            warehouse.delivery_steps = 'pick_pack_ship'
        self.warehouse.flush()
        self.env.ref('stock.route_warehouse0_mto').active = True
        self.env['stock.quant']._update_available_quantity(self.raw_product, self.warehouse.lot_stock_id, 4.0)
        picking_customer = self.env['stock.picking'].create({
            'locationId': self.warehouse.wh_output_stock_loc_id.id,
            'locationDestId': self.customer_location,
            'partner_id': self.env['ir.model.data']._xmlid_to_res_id('base.res_partner_4'),
            'pickingTypeId': self.warehouse.out_type_id.id,
        })
        self.env['stock.move'].create({
            'name': self.finished_product.name,
            'productId': self.finished_product.id,
            'productUomQty': 2,
            'productUom': self.uom_unit.id,
            'pickingId': picking_customer.id,
            'locationId': self.warehouse.wh_output_stock_loc_id.id,
            'locationDestId': self.customer_location,
            'procureMethod': 'make_to_order',
            'origin': 'SOURCEDOCUMENT',
            'state': 'draft',
        })
        picking_customer.action_confirm()
        production_order = self.env['mrp.production'].search([('productId', '=', self.finished_product.id)])
        self.assertTrue(production_order)
        self.assertEqual(production_order.origin, 'SOURCEDOCUMENT', 'The MO origin should be the SO name')
        self.assertNotEqual(production_order.name, 'SOURCEDOCUMENT', 'The MO name should not be the origin of the move')

        picking_stock_preprod = self.env['stock.move'].search([
            ('productId', '=', self.raw_product.id),
            ('locationId', '=', self.warehouse.lot_stock_id.id),
            ('locationDestId', '=', self.warehouse.pbm_loc_id.id),
            ('pickingTypeId', '=', self.warehouse.pbm_type_id.id)
        ]).pickingId
        picking_stock_postprod = self.env['stock.move'].search([
            ('productId', '=', self.finished_product.id),
            ('locationId', '=', self.warehouse.sam_loc_id.id),
            ('locationDestId', '=', self.warehouse.lot_stock_id.id),
            ('pickingTypeId', '=', self.warehouse.sam_type_id.id)
        ]).pickingId

        self.assertTrue(picking_stock_preprod)
        self.assertTrue(picking_stock_postprod)
        self.assertEqual(picking_stock_preprod.state, 'assigned')
        self.assertEqual(picking_stock_postprod.state, 'waiting')
        self.assertEqual(picking_stock_preprod.origin, production_order.name, 'The pre-prod origin should be the MO name')
        self.assertEqual(picking_stock_postprod.origin, 'SOURCEDOCUMENT', 'The post-prod origin should be the SO name')

        picking_stock_preprod.action_assign()
        picking_stock_preprod.moveLineIds.qtyDone = 4
        picking_stock_preprod._action_done()

        self.assertFalse(sum(self.env['stock.quant']._gather(self.raw_product, self.warehouse.lot_stock_id).mapped('quantity')))
        self.assertTrue(self.env['stock.quant']._gather(self.raw_product, self.warehouse.pbm_loc_id))

        production_order.action_assign()
        self.assertEqual(production_order.reservationState, 'assigned')
        self.assertEqual(picking_stock_postprod.state, 'waiting')

        produce_form = Form(production_order)
        produce_form.qtyProducing = production_order.productQty
        production_order = produce_form.save()
        production_order.button_mark_done()

        self.assertFalse(sum(self.env['stock.quant']._gather(self.raw_product, self.warehouse.pbm_loc_id).mapped('quantity')))

        self.assertEqual(picking_stock_postprod.state, 'assigned')

        picking_stock_pick = self.env['stock.move'].search([
            ('productId', '=', self.finished_product.id),
            ('locationId', '=', self.warehouse.lot_stock_id.id),
            ('locationDestId', '=', self.warehouse.wh_pack_stock_loc_id.id),
            ('pickingTypeId', '=', self.warehouse.pick_type_id.id)
        ]).pickingId
        self.assertEqual(picking_stock_pick.move_lines.move_orig_ids.pickingId, picking_stock_postprod)

    def test_cancel_propagation(self):
        """ Test cancelling moves in a 'picking before
        manufacturing' and 'store after manufacturing' process. The propagation of
        cancel depends on the default values on each rule of the chain.
        """
        self.warehouse.manufactureSteps = 'pbmSam'
        self.warehouse.flush()
        self.env['stock.quant']._update_available_quantity(self.raw_product, self.warehouse.lot_stock_id, 4.0)
        picking_customer = self.env['stock.picking'].create({
            'locationId': self.warehouse.lot_stock_id.id,
            'locationDestId': self.customer_location,
            'partner_id': self.env['ir.model.data']._xmlid_to_res_id('base.res_partner_4'),
            'pickingTypeId': self.warehouse.out_type_id.id,
        })
        self.env['stock.move'].create({
            'name': self.finished_product.name,
            'productId': self.finished_product.id,
            'productUomQty': 2,
            'pickingId': picking_customer.id,
            'productUom': self.uom_unit.id,
            'locationId': self.warehouse.lot_stock_id.id,
            'locationDestId': self.customer_location,
            'procureMethod': 'make_to_order',
        })
        picking_customer.action_confirm()
        production_order = self.env['mrp.production'].search([('productId', '=', self.finished_product.id)])
        self.assertTrue(production_order)

        move_stock_preprod = self.env['stock.move'].search([
            ('productId', '=', self.raw_product.id),
            ('locationId', '=', self.warehouse.lot_stock_id.id),
            ('locationDestId', '=', self.warehouse.pbm_loc_id.id),
            ('pickingTypeId', '=', self.warehouse.pbm_type_id.id)
        ])
        move_stock_postprod = self.env['stock.move'].search([
            ('productId', '=', self.finished_product.id),
            ('locationId', '=', self.warehouse.sam_loc_id.id),
            ('locationDestId', '=', self.warehouse.lot_stock_id.id),
            ('pickingTypeId', '=', self.warehouse.sam_type_id.id)
        ])

        self.assertTrue(move_stock_preprod)
        self.assertTrue(move_stock_postprod)
        self.assertEqual(move_stock_preprod.state, 'assigned')
        self.assertEqual(move_stock_postprod.state, 'waiting')

        move_stock_preprod._action_cancel()
        self.assertEqual(production_order.state, 'confirmed')
        production_order.action_cancel()
        self.assertTrue(move_stock_postprod.state, 'cancel')

    def test_no_initial_demand(self):
        """ Test MO/picking before manufacturing/picking after manufacturing
        components and move_orig/move_dest. Ensure that everything is created
        correctly.
        """
        with Form(self.warehouse) as warehouse:
            warehouse.manufactureSteps = 'pbmSam'
        production_form = Form(self.env['mrp.production'])
        production_form.productId = self.finished_product
        production_form.pickingTypeId = self.warehouse.manu_type_id
        production = production_form.save()
        production.moveRawIds.productUomQty = 0
        production.action_confirm()
        production.action_assign()
        self.assertFalse(production.moveRawIds.move_orig_ids)
        self.assertEqual(production.state, 'confirmed')
        self.assertEqual(production.reservationState, 'assigned')

    def test_manufacturing_3_steps_flexible(self):
        """ Test MO/picking before manufacturing/picking after manufacturing
        components and move_orig/move_dest. Ensure that additional moves are put
        in picking before manufacturing too.
        """
        with Form(self.warehouse) as warehouse:
            warehouse.manufactureSteps = 'pbmSam'
        bom = self.env['mrp.bom'].search([
            ('productId', '=', self.finished_product.id)
        ])
        new_product = self.env['product.product'].create({
            'name': 'New product',
            'type': 'product',
        })
        bom.consumption = 'flexible'
        production_form = Form(self.env['mrp.production'])
        production_form.productId = self.finished_product
        production_form.pickingTypeId = self.warehouse.manu_type_id
        production = production_form.save()

        production.action_confirm()
        production.is_locked = False
        production_form = Form(production)
        with production_form.moveRawIds.new() as move:
            move.productId = new_product
            move.productUomQty = 2
        production = production_form.save()
        moveRawIds = production.moveRawIds
        self.assertEqual(len(moveRawIds), 2)
        pbm_move = moveRawIds.move_orig_ids
        self.assertEqual(len(pbm_move), 2)
        self.assertTrue(new_product in pbm_move.productId)

    def test_3_steps_and_byproduct(self):
        """ Suppose a warehouse with Manufacture option set to '3 setps' and a product P01 with a reordering rule.
        Suppose P01 has a BoM and this BoM mentions that when some P01 are produced, some P02 are produced too.
        This test ensures that when a MO is generated thanks to the reordering rule, 2 pickings are also
        generated:
            - One to bring the components
            - Another to return the P01 and P02 produced
        """
        warehouse = self.warehouse
        warehouse.manufactureSteps = 'pbmSam'
        warehouse_stock_location = warehouse.lot_stock_id
        pre_production_location = warehouse.pbm_loc_id
        post_production_location = warehouse.sam_loc_id

        one_unit_uom = self.env.ref('uom.productUomUnit')
        [two_units_uom, four_units_uom] = self.env['uom.uom'].create([{
            'name': 'x%s' % i,
            'categoryId': self.ref('uom.product_uom_categ_unit'),
            'uom_type': 'bigger',
            'factor_inv': i,
        } for i in [2, 4]])

        finished_product = self.env['product.product'].create({
            'name': 'Super Product',
            'routeIds': [(4, self.ref('mrp.routeWarehouse0Manufacture'))],
            'type': 'product',
        })
        secondary_product = self.env['product.product'].create({
            'name': 'Secondary',
            'type': 'product',
        })
        component = self.env['product.product'].create({
            'name': 'Component',
            'type': 'consu',
        })

        self.env['mrp.bom'].create({
            'productTemplateId': finished_product.productTemplateId.id,
            'productQty': 1,
            'productUomId': two_units_uom.id,
            'bom_line_ids': [(0, 0, {
                'productId': component.id,
                'productQty': 1,
                'productUomId': one_unit_uom.id,
            })],
            'byproduct_ids': [(0, 0, {
                'productId': secondary_product.id,
                'productQty': 1,
                'productUomId': four_units_uom.id,
            })],
        })

        self.env['stock.warehouse.orderpoint'].create({
            'warehouseId': warehouse.id,
            'locationId': warehouse_stock_location.id,
            'productId': finished_product.id,
            'product_min_qty': 2,
            'product_max_qty': 2,
        })

        self.env['procurement.group'].run_scheduler()
        mo = self.env['mrp.production'].search([('productId', '=', finished_product.id)])
        pickings = mo.pickingIds
        self.assertEqual(len(pickings), 2)

        preprod_picking = pickings[0] if pickings[0].locationId == warehouse_stock_location else pickings[1]
        self.assertEqual(preprod_picking.locationId, warehouse_stock_location)
        self.assertEqual(preprod_picking.locationDestId, pre_production_location)

        postprod_picking = pickings - preprod_picking
        self.assertEqual(postprod_picking.locationId, post_production_location)
        self.assertEqual(postprod_picking.locationDestId, warehouse_stock_location)

        byproduct_postprod_move = self.env['stock.move'].search([
            ('productId', '=', secondary_product.id),
            ('locationId', '=', post_production_location.id),
            ('locationDestId', '=', warehouse_stock_location.id),
        ])
        self.assertEqual(byproduct_postprod_move.state, 'waiting')
        self.assertEqual(byproduct_postprod_move.groupId.name, mo.name)

    def test_manufacturing_3_steps_trigger_reordering_rules(self):
        with Form(self.warehouse) as warehouse:
            warehouse.manufactureSteps = 'pbmSam'

        with Form(self.raw_product) as p:
            p.routeIds.clear()
            p.routeIds.add(self.warehouse.manufacture_pull_id.routeId)

        # Create an additional BoM for component
        product_form = Form(self.env['product.product'])
        product_form.name = 'Wood'
        product_form.detailedType = 'product'
        product_form.uomId = self.uom_unit
        product_form.uomPoId = self.uom_unit
        self.wood_product = product_form.save()

        # Create bom for manufactured product
        bom_product_form = Form(self.env['mrp.bom'])
        bom_product_form.productId = self.raw_product
        bom_product_form.productTemplateId = self.raw_product.productTemplateId
        bom_product_form.productQty = 1.0
        bom_product_form.type = 'normal'
        with bom_product_form.bom_line_ids.new() as bomLine:
            bomLine.productId = self.wood_product
            bomLine.productQty = 1.0

        bom_product_form.save()

        self.env['stock.quant']._update_available_quantity(
            self.finished_product, self.warehouse.lot_stock_id, -1.0)

        rr_form = Form(self.env['stock.warehouse.orderpoint'])
        rr_form.productId = self.wood_product
        rr_form.locationId = self.warehouse.lot_stock_id
        rr_form.save()

        rr_form = Form(self.env['stock.warehouse.orderpoint'])
        rr_form.productId = self.finished_product
        rr_form.locationId = self.warehouse.lot_stock_id
        rr_finish = rr_form.save()

        rr_form = Form(self.env['stock.warehouse.orderpoint'])
        rr_form.productId = self.raw_product
        rr_form.locationId = self.warehouse.lot_stock_id
        rr_form.save()

        self.env['procurement.group'].run_scheduler()

        pickings_component = self.env['stock.picking'].search(
            [('productId', '=', self.wood_product.id)])
        self.assertTrue(pickings_component)
        self.assertTrue(rr_finish.name in pickings_component.origin)

    def test_2_steps_and_additional_moves(self):
        """ Suppose a 2-steps configuration. If a user adds a product to an existing draft MO and then
        confirms it, the associated picking should includes this new product"""
        self.warehouse.manufactureSteps = 'pbm'

        mo_form = Form(self.env['mrp.production'])
        mo_form.productId = self.bom.productId
        mo_form.pickingTypeId = self.warehouse.manu_type_id
        mo = mo_form.save()

        component_move = mo.moveRawIds[0]
        mo.withContext(default_raw_material_production_id=mo.id).moveRawIds = [
            [0, 0, {
                'locationId': component_move.locationId.id,
                'locationDestId': component_move.locationDestId.id,
                'pickingTypeId': component_move.pickingTypeId.id,
                'productId': self.product_2.id,
                'name': self.product_2.display_name,
                'productUomQty': 1,
                'productUom': self.product_2.uomId.id,
                'warehouseId': component_move.warehouseId.id,
                'raw_material_production_id': mo.id,
            }]
        ]

        mo.action_confirm()

        self.assertEqual(self.bom.bom_line_ids.productId + self.product_2, mo.pickingIds.move_lines.productId)

    def test_manufacturing_complex_product_3_steps(self):
        """ Test MO/picking after manufacturing a complex product which uses
        manufactured components. Ensure that everything is created and picked
        correctly.
        """

        self.warehouse.mto_pull_id.routeId.active = True
        # Creating complex product which trigger another manifacture

        routes = self.warehouse.manufacture_pull_id.routeId + self.warehouse.mto_pull_id.routeId
        self.complex_product = self.env['product.product'].create({
            'name': 'Arrow',
            'type': 'product',
            'routeIds': [(6, 0, routes.ids)],
        })

        # Create raw product for manufactured product
        self.raw_product_2 = self.env['product.product'].create({
            'name': 'Raw Iron',
            'type': 'product',
            'uomId': self.uom_unit.id,
            'uomPoId': self.uom_unit.id,
        })

        self.finished_product.routeIds = [(6, 0, routes.ids)]

        # Create bom for manufactured product
        bom_product_form = Form(self.env['mrp.bom'])
        bom_product_form.productId = self.complex_product
        bom_product_form.productTemplateId = self.complex_product.productTemplateId
        with bom_product_form.bom_line_ids.new() as line:
            line.productId = self.finished_product
            line.productQty = 1.0
        with bom_product_form.bom_line_ids.new() as line:
            line.productId = self.raw_product_2
            line.productQty = 1.0

        self.complex_bom = bom_product_form.save()

        with Form(self.warehouse) as warehouse:
            warehouse.manufactureSteps = 'pbmSam'

        production_form = Form(self.env['mrp.production'])
        production_form.productId = self.complex_product
        production_form.pickingTypeId = self.warehouse.manu_type_id
        production = production_form.save()
        production.action_confirm()

        moveRawIds = production.moveRawIds
        self.assertEqual(len(moveRawIds), 2)
        sfp_move_raw_id, raw_move_raw_id = moveRawIds
        self.assertEqual(sfp_move_raw_id.productId, self.finished_product)
        self.assertEqual(raw_move_raw_id.productId, self.raw_product_2)

        for move_raw_id in moveRawIds:
            self.assertEqual(move_raw_id.pickingTypeId, self.warehouse.manu_type_id)

            pbm_move = move_raw_id.move_orig_ids
            self.assertEqual(len(pbm_move), 1)
            self.assertEqual(pbm_move.locationId, self.warehouse.lot_stock_id)
            self.assertEqual(pbm_move.locationDestId, self.warehouse.pbm_loc_id)
            self.assertEqual(pbm_move.pickingTypeId, self.warehouse.pbm_type_id)

        # Check move locations
        move_finished_ids = production.move_finished_ids
        self.assertEqual(len(move_finished_ids), 1)
        self.assertEqual(move_finished_ids.productId, self.complex_product)
        self.assertEqual(move_finished_ids.pickingTypeId, self.warehouse.manu_type_id)
        sam_move = move_finished_ids.moveDestIds
        self.assertEqual(len(sam_move), 1)
        self.assertEqual(sam_move.locationId, self.warehouse.sam_loc_id)
        self.assertEqual(sam_move.locationDestId, self.warehouse.lot_stock_id)
        self.assertEqual(sam_move.pickingTypeId, self.warehouse.sam_type_id)
        self.assertFalse(sam_move.moveDestIds)

        subproduction = self.env['mrp.production'].browse(production.id+1)
        sfp_pickings = subproduction.pickingIds.sorted('id')

        # SFP Production: 2 pickings, 1 group
        self.assertEqual(len(sfp_pickings), 2)
        self.assertEqual(sfp_pickings.mapped('groupId'), subproduction.procurementGroupId)

        # Move Raw Stick - Stock -> Preprocessing
        picking = sfp_pickings[0]
        self.assertEqual(len(picking.move_lines), 1)
        picking.move_lines[0].productId = self.raw_product

        # Move SFP - PostProcessing -> Stock
        picking = sfp_pickings[1]
        self.assertEqual(len(picking.move_lines), 1)
        picking.move_lines[0].productId = self.finished_product

        # Main production 2 pickings, 1 group
        pickings = production.pickingIds.sorted('id')
        self.assertEqual(len(pickings), 2)
        self.assertEqual(pickings.mapped('groupId'), production.procurementGroupId)

        # Move 2 components Stock -> Preprocessing
        picking = pickings[0]
        self.assertEqual(len(picking.move_lines), 2)
        picking.move_lines[0].productId = self.finished_product
        picking.move_lines[1].productId = self.raw_product_2

        # Move FP PostProcessing -> Stock
        picking = pickings[1]
        self.assertEqual(len(picking.move_lines), 1)
        picking.productId = self.complex_product

    def test_child_parent_relationship_on_backorder_creation(self):
        """ Test Child Mo and Source Mo in 2/3-step production for reorder
            rules in backorder using order points with the help of run scheduler """

        with Form(self.warehouse) as warehouse:
            warehouse.manufactureSteps = 'pbmSam'

        rr_form = Form(self.env['stock.warehouse.orderpoint'])
        rr_form.productId = self.finished_product
        rr_form.product_min_qty = 20
        rr_form.product_max_qty = 40
        rr_form.save()

        self.env['procurement.group'].run_scheduler()

        mo = self.env['mrp.production'].search([('productId', '=', self.finished_product.id)])
        mo_form = Form(mo)
        mo_form.qtyProducing = 20
        mo = mo_form.save()

        action = mo.button_mark_done()
        backorder = Form(self.env['mrp.production.backorder'].withContext(**action['context']))
        backorder.save().action_backorder()

        self.assertEqual(mo.mrp_production_child_count, 0, "Children MOs counted as existing where there should be none")
        self.assertEqual(mo.mrp_production_source_count, 0, "Source MOs counted as existing where there should be none")
        self.assertEqual(mo.mrp_production_backorder_count, 2)

    def test_manufacturing_bom_from_reordering_rules(self):
        """
            Check that the manufacturing order is created with the BoM set in the reording rule:
                - Create a product with 2 bill of materials,
                - Create an orderpoint for this product specifying the 2nd BoM that must be used,
                - Check that the MO has been created with the 2nd BoM
        """
        manufacturing_route = self.env['stock.rule'].search([
            ('action', '=', 'manufacture')]).routeId
        with Form(self.warehouse) as warehouse:
            warehouse.manufactureSteps = 'pbmSam'
        finished_product = self.env['product.product'].create({
            'name': 'Product',
            'type': 'product',
            'routeIds': manufacturing_route,
        })
        self.env['mrp.bom'].create({
            'productTemplateId': finished_product.productTemplateId.id,
            'productQty': 1,
            'productUomId': finished_product.uomId.id,
            'type': 'normal',
        })
        bom_2 = self.env['mrp.bom'].create({
            'productTemplateId': finished_product.productTemplateId.id,
            'productQty': 1,
            'productUomId': finished_product.uomId.id,
            'type': 'normal',
        })
        self.env['stock.warehouse.orderpoint'].create({
            'name': 'Orderpoint for P1',
            'productId': self.finished_product.id,
            'product_min_qty': 1,
            'product_max_qty': 1,
            'routeId': manufacturing_route.id,
            'bomId': bom_2.id,
        })
        self.env['procurement.group'].run_scheduler()
        mo = self.env['mrp.production'].search([('productId', '=', self.finished_product.id)])
        self.assertEqual(len(mo), 1)
        self.assertEqual(mo.productQty, 1.0)
        self.assertEqual(mo.bomId, bom_2)
