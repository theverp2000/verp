# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.
from verp.addons.account.tests.common import AccountTestInvoicingCommon
from verp.addons.base.tests.common import TransactionCase


class TestSaleCommonBase(TransactionCase):
    ''' Setup with sale test configuration. '''

    @classmethod
    def setup_sale_configuration_for_company(cls, company):
        Users = cls.env['res.users'].withContext(no_reset_password=True)

        company_data = {
            # Sales Team
            'default_sale_team': cls.env['crm.team'].withContext(tracking_disable=True).create({
                'name': 'Test Channel',
                'companyId': company.id,
            }),

            # Users
            'default_user_salesman': Users.create({
                'name': 'default_user_salesman',
                'login': 'default_user_salesman.comp%s' % company.id,
                'email': 'default_user_salesman@example.com',
                'signature': '--\nMark',
                'notification_type': 'email',
                'groupsId': [(6, 0, cls.env.ref('sales_team.groupSaleSalesman').ids)],
                'companyIds': [(6, 0, company.ids)],
                'companyId': company.id,
            }),
            'default_user_portal': Users.create({
                'name': 'default_user_portal',
                'login': 'default_user_portal.comp%s' % company.id,
                'email': 'default_user_portal@gladys.portal',
                'groupsId': [(6, 0, [cls.env.ref('base.groupPortal').id])],
                'companyIds': [(6, 0, company.ids)],
                'companyId': company.id,
            }),
            'default_user_employee': Users.create({
                'name': 'default_user_employee',
                'login': 'default_user_employee.comp%s' % company.id,
                'email': 'default_user_employee@example.com',
                'groupsId': [(6, 0, [cls.env.ref('base.groupUser').id])],
                'companyIds': [(6, 0, company.ids)],
                'companyId': company.id,
            }),

            # Pricelist
            'default_pricelist': cls.env['product.pricelist'].with_company(company).create({
                'name': 'default_pricelist',
                'currencyId': company.currencyId.id,
            }),

            # Product category
            'product_category': cls.env['product.category'].with_company(company).create({
                'name': 'Test category',
            }),
        }

        company_data.update({
            # Products
            'product_service_delivery': cls.env['product.product'].with_company(company).create({
                'name': 'product_service_delivery',
                'categId': company_data['product_category'].id,
                'standardPrice': 200.0,
                'listPrice': 180.0,
                'type': 'service',
                'uomId': cls.env.ref('uom.productUomUnit').id,
                'uomPoId': cls.env.ref('uom.productUomUnit').id,
                'default_code': 'SERV_DEL',
                'invoicePolicy': 'delivery',
                'taxes_id': [(6, 0, [])],
                'supplier_taxes_id': [(6, 0, [])],
            }),
            'product_service_order': cls.env['product.product'].with_company(company).create({
                'name': 'product_service_order',
                'categId': company_data['product_category'].id,
                'standardPrice': 40.0,
                'listPrice': 90.0,
                'type': 'service',
                'uomId': cls.env.ref('uom.product_uom_hour').id,
                'uomPoId': cls.env.ref('uom.product_uom_hour').id,
                'description': 'Example of product to invoice on order',
                'default_code': 'PRE-PAID',
                'invoicePolicy': 'order',
                'taxes_id': [(6, 0, [])],
                'supplier_taxes_id': [(6, 0, [])],
            }),
            'product_order_cost': cls.env['product.product'].with_company(company).create({
                'name': 'product_order_cost',
                'categId': company_data['product_category'].id,
                'standardPrice': 235.0,
                'listPrice': 280.0,
                'type': 'consu',
                'weight': 0.01,
                'uomId': cls.env.ref('uom.productUomUnit').id,
                'uomPoId': cls.env.ref('uom.productUomUnit').id,
                'default_code': 'FURN_9999',
                'invoicePolicy': 'order',
                'expense_policy': 'cost',
                'taxes_id': [(6, 0, [])],
                'supplier_taxes_id': [(6, 0, [])],
            }),
            'product_delivery_cost': cls.env['product.product'].with_company(company).create({
                'name': 'product_delivery_cost',
                'categId': company_data['product_category'].id,
                'standardPrice': 55.0,
                'listPrice': 70.0,
                'type': 'consu',
                'weight': 0.01,
                'uomId': cls.env.ref('uom.productUomUnit').id,
                'uomPoId': cls.env.ref('uom.productUomUnit').id,
                'default_code': 'FURN_7777',
                'invoicePolicy': 'delivery',
                'expense_policy': 'cost',
                'taxes_id': [(6, 0, [])],
                'supplier_taxes_id': [(6, 0, [])],
            }),
            'product_order_sales_price': cls.env['product.product'].with_company(company).create({
                'name': 'product_order_sales_price',
                'categId': company_data['product_category'].id,
                'standardPrice': 235.0,
                'listPrice': 280.0,
                'type': 'consu',
                'weight': 0.01,
                'uomId': cls.env.ref('uom.productUomUnit').id,
                'uomPoId': cls.env.ref('uom.productUomUnit').id,
                'default_code': 'FURN_9999',
                'invoicePolicy': 'order',
                'expense_policy': 'salesPrice',
                'taxes_id': [(6, 0, [])],
                'supplier_taxes_id': [(6, 0, [])],
            }),
            'product_delivery_sales_price': cls.env['product.product'].with_company(company).create({
                'name': 'product_delivery_sales_price',
                'categId': company_data['product_category'].id,
                'standardPrice': 55.0,
                'listPrice': 70.0,
                'type': 'consu',
                'weight': 0.01,
                'uomId': cls.env.ref('uom.productUomUnit').id,
                'uomPoId': cls.env.ref('uom.productUomUnit').id,
                'default_code': 'FURN_7777',
                'invoicePolicy': 'delivery',
                'expense_policy': 'salesPrice',
                'taxes_id': [(6, 0, [])],
                'supplier_taxes_id': [(6, 0, [])],
            }),
            'product_order_no': cls.env['product.product'].with_company(company).create({
                'name': 'product_order_no',
                'categId': company_data['product_category'].id,
                'standardPrice': 235.0,
                'listPrice': 280.0,
                'type': 'consu',
                'weight': 0.01,
                'uomId': cls.env.ref('uom.productUomUnit').id,
                'uomPoId': cls.env.ref('uom.productUomUnit').id,
                'default_code': 'FURN_9999',
                'invoicePolicy': 'order',
                'expense_policy': 'no',
                'taxes_id': [(6, 0, [])],
                'supplier_taxes_id': [(6, 0, [])],
            }),
            'product_delivery_no': cls.env['product.product'].with_company(company).create({
                'name': 'product_delivery_no',
                'categId': company_data['product_category'].id,
                'standardPrice': 55.0,
                'listPrice': 70.0,
                'type': 'consu',
                'weight': 0.01,
                'uomId': cls.env.ref('uom.productUomUnit').id,
                'uomPoId': cls.env.ref('uom.productUomUnit').id,
                'default_code': 'FURN_7777',
                'invoicePolicy': 'delivery',
                'expense_policy': 'no',
                'taxes_id': [(6, 0, [])],
                'supplier_taxes_id': [(6, 0, [])],
            }),
        })

        return company_data


class TestSaleCommon(AccountTestInvoicingCommon, TestSaleCommonBase):
    ''' Setup to be used post-install with sale and accounting test configuration.'''

    @classmethod
    def setup_company_data(cls, company_name, chart_template=None, **kwargs):
        company_data = super().setup_company_data(company_name, chart_template=chart_template, **kwargs)

        company_data.update(cls.setup_sale_configuration_for_company(company_data['company']))

        company_data['product_category'].write({
            'property_account_income_categ_id': company_data['default_account_revenue'].id,
            'property_account_expense_categ_id': company_data['default_account_expense'].id,
        })

        return company_data
