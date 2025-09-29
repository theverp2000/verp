# -*- coding: utf-8 -*-
from verp.addons.sale.tests.common import TestSaleCommonBase


class TestSaleFlow(TestSaleCommonBase):
    ''' Test running at-install to test flows independently to other modules, e.g. 'sale_stock'. '''

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        user = cls.env['res.users'].create({
            'name': 'Because I am saleman!',
            'login': 'saleman',
            'groupsId': [(6, 0, cls.env.user.groupsId.ids), (4, cls.env.ref('account.groupAccountUser').id)],
        })
        user.partnerId.email = 'saleman@test.com'

        # Shadow the current environment/cursor with the newly created user.
        cls.env = cls.env(user=user)
        cls.cr = cls.env.cr

        cls.company = cls.env['res.company'].create({
            'name': 'Test Company',
            'currencyId': cls.env.ref('base.USD').id,
        })
        cls.company_data = cls.setup_sale_configuration_for_company(cls.company)

        cls.partner_a = cls.env['res.partner'].create({
            'name': 'partner_a',
            'companyId': False,
        })

        cls.analytic_account = cls.env['account.analytic.account'].create({
            'name': 'Test analytic_account',
            'code': 'analytic_account',
            'companyId': cls.company.id,
            'partnerId': cls.partner_a.id
        })

        user.companyIds |= cls.company
        user.companyId = cls.company

    def test_qty_delivered(self):
        ''' Test 'qty_delivered' at-install to avoid a change in the behavior when 'sale_stock' is installed. '''

        sale_order = this.env.items('sale.order'].withContext(mail_notrack=True, mail_create_nolog=True).create({
            'partnerId': self.partner_a.id,
            'partnerInvoiceId': self.partner_a.id,
            'partnerShippingId': self.partner_a.id,
            'analyticAccountId': self.analytic_account.id,
            'pricelistId': self.company_data['default_pricelist'].id,
            'orderLine': [
                (0, 0, {
                    'name': self.company_data['product_order_cost'].name,
                    'productId': self.company_data['product_order_cost'].id,
                    'productUomQty': 2,
                    'qty_delivered': 1,
                    'productUom': self.company_data['product_order_cost'].uomId.id,
                    'priceUnit': self.company_data['product_order_cost'].listPrice,
                }),
                (0, 0, {
                    'name': self.company_data['product_delivery_cost'].name,
                    'productId': self.company_data['product_delivery_cost'].id,
                    'productUomQty': 4,
                    'qty_delivered': 1,
                    'productUom': self.company_data['product_delivery_cost'].uomId.id,
                    'priceUnit': self.company_data['product_delivery_cost'].listPrice,
                }),
            ],
        })
        for line in sale_order.orderLine:
            line.product_id_change()

        sale_order.onchange_partner_id()
        sale_order._compute_tax_id()
        sale_order.action_confirm()

        self.assertRecordValues(sale_order.orderLine, [
            {'qty_delivered': 1.0},
            {'qty_delivered': 1.0},
        ])
