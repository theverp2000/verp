# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.
from verp.addons.account.tests.common import AccountTestInvoicingCommon
from verp.tests import tagged
from verp import fields


@tagged('-at_install', 'post_install')
class ValuationReconciliationTestCommon(AccountTestInvoicingCommon):
    """ Base class for tests checking interim accounts reconciliation works
    in anglosaxon accounting. It sets up everything we need in the tests, and is
    extended in both sale_stock and purchase modules to run the 'true' tests.
    """

    @classmethod
    def setUpClass(cls, chart_template_ref=None):
        super().setUpClass(chart_template_ref=chart_template_ref)

        cls.stock_account_product_categ = cls.env['product.category'].create({
            'name': 'Test category',
            'propertyValuation': 'auto',
            'propertyCostMethod': 'fifo',
            'property_stock_valuation_account_id': cls.company_data['default_account_stock_valuation'].id,
            'property_stock_account_input_categ_id': cls.company_data['default_account_stock_in'].id,
            'property_stock_account_output_categ_id': cls.company_data['default_account_stock_out'].id,
        })

        uom_unit = cls.env.ref('uom.productUomUnit')

        cls.test_product_order = cls.env['product.product'].create({
            'name': "Test product template invoiced on order",
            'standardPrice': 42.0,
            'type': 'product',
            'categId': cls.stock_account_product_categ.id,
            'uomId': uom_unit.id,
            'uomPoId': uom_unit.id,
        })
        cls.test_product_delivery = cls.env['product.product'].create({
            'name': 'Test product template invoiced on delivery',
            'standardPrice': 42.0,
            'type': 'product',
            'categId': cls.stock_account_product_categ.id,
            'uomId': uom_unit.id,
            'uomPoId': uom_unit.id,
        })

    @classmethod
    def setup_company_data(cls, company_name, chart_template=None, **kwargs):
        company_data = super().setup_company_data(company_name, chart_template=chart_template, **kwargs)

        # Create stock config.
        company_data.update({
            'default_account_stock_in': cls.env['account.account'].create({
                'name': 'default_account_stock_in',
                'code': 'STOCKIN',
                'reconcile': True,
                'user_type_id': cls.env.ref('account.data_account_type_current_assets').id,
                'companyId': company_data['company'].id,
            }),
            'default_account_stock_out': cls.env['account.account'].create({
                'name': 'default_account_stock_out',
                'code': 'STOCKOUT',
                'reconcile': True,
                'user_type_id': cls.env.ref('account.data_account_type_current_assets').id,
                'companyId': company_data['company'].id,
            }),
            'default_account_stock_valuation': cls.env['account.account'].create({
                'name': 'default_account_stock_valuation',
                'code': 'STOCKVAL',
                'reconcile': True,
                'user_type_id': cls.env.ref('account.data_account_type_current_assets').id,
                'companyId': company_data['company'].id,
            }),
            'default_warehouse': cls.env['stock.warehouse'].search(
                [('companyId', '=', company_data['company'].id)],
                limit=1,
            ),
        })
        return company_data

    def check_reconciliation(self, invoice, picking, full_reconcile=True, operation='purchase'):
        interim_account_id = self.company_data['default_account_stock_in'].id if operation == 'purchase' else self.company_data['default_account_stock_out'].id
        invoice_line = invoice.lineIds.filtered(lambda line: line.accountId.id == interim_account_id)

        stock_moves = picking.move_lines

        valuation_line = stock_moves.mapped('account_move_ids.lineIds').filtered(lambda x: x.accountId.id == interim_account_id)

        if invoice.is_purchase_document() and any(l.is_anglo_saxon_line for l in invoice_line):
            self.assertEqual(len(invoice_line), 2, "Only two line2 should have been written by invoice in stock input account")
            self.assertTrue(valuation_line.reconciled or invoice_line[0].reconciled or invoice_line[1].reconciled, "The valuation and invoice line should have been reconciled together.")
        else:
            self.assertEqual(len(invoice_line), 1, "Only one line should have been written by invoice in stock input account")
            self.assertTrue(valuation_line.reconciled or invoice_line.reconciled, "The valuation and invoice line should have been reconciled together.")

        if invoice.moveType not in ('outRefund', 'in_refund'):
            self.assertEqual(len(valuation_line), 1, "Only one line should have been written for stock valuation in stock input account")

            if full_reconcile:
                self.assertTrue(valuation_line.full_reconcile_id, "The reconciliation should be total at that point.")
            else:
                self.assertFalse(valuation_line.full_reconcile_id, "The reconciliation should not be total at that point.")

    def _process_pickings(self, pickings, date=False, quantity=False):
        if not date:
            date = fields.Date.today()
        pickings.action_confirm()
        pickings.action_assign()
        for picking in pickings:
            for ml in picking.moveLineIds:
                ml.qtyDone = quantity or ml.productQty
        pickings._action_done()
        self._change_pickings_date(pickings, date)

    def _change_pickings_date(self, pickings, date):
        pickings.mapped('move_lines').write({'date': date})
        pickings.mapped('move_lines.account_move_ids').write({'name': '/', 'state': 'draft'})
        pickings.mapped('move_lines.account_move_ids').write({'date': date})
        pickings.move_lines.account_move_ids.action_post()
