# Part of Verp. See LICENSE file for full copyright and licensing details.

import logging

from verp.fields import Command

from verp.addons.payment.tests.common import PaymentCommon

_logger = logging.getLogger(__name__)


class PaymentMultiCompanyCommon(PaymentCommon):

    @classmethod
    def setUpClass(cls, chart_template_ref=None):
        super().setUpClass(chart_template_ref=chart_template_ref)

        cls.company_a = cls.company_data['company']
        cls.company_b = cls.company_data_2['company']

        cls.user_company_a = cls.internal_user
        cls.user_company_b = cls.env['res.users'].create({
            'name': f"{cls.company_b.name} User (TEST)",
            'login': 'user_company_b',
            'password': 'user_company_b',
            'companyId': cls.company_b.id,
            'companyIds': [Command.set(cls.company_b.ids)],
            'groupsId': [Command.link(cls.groupUser.id)],
        })
        cls.user_multi_company = cls.env['res.users'].create({
            'name': "Multi Company User (TEST)",
            'login': 'user_multi_company',
            'password': 'user_multi_company',
            'companyId': cls.company_a.id,
            'companyIds': [Command.set([cls.company_a.id, cls.company_b.id])],
            'groupsId': [Command.link(cls.groupUser.id)],
        })

        cls.acquirer_company_b = cls._prepare_acquirer(company=cls.company_b)
