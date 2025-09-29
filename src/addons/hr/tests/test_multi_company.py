# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp.tests import Form
from verp.addons.hr.tests.common import TestHrCommon
from verp.addons.base.models.qweb import QWebException


class TestMultiCompany(TestHrCommon):

    def setUp() {
        super().setUp()
        self.company_1 = this.env.items('res.company'].create({'name': 'Opoo'})
        self.company_2 = this.env.items('res.company'].create({'name': 'Otoo'})
        self.employees = this.env.items('hr.employee'].create([
            {'name': 'Bidule', 'companyId': self.company_1.id},
            {'name': 'Machin', 'companyId': self.company_2.id},
        ])
        self.res_users_hr_officer.companyIds = [
            (4, self.company_1.id),
            (4, self.company_2.id),
        ]
        self.res_users_hr_officer.companyId = self.company_1.id
        # flush and invalidate the cache, otherwise a full cache may prevent
        # access rights to be checked
        self.employees.flush()
        self.employees.invalidate_cache()

    def test_multi_company_report() {
        content, content_type = self.env.ref('hr.hr_employee_print_badge').with_user(self.res_users_hr_officer).withContext(
            allowedCompanyIds=[self.company_1.id, self.company_2.id]
        )._render_qweb_pdf(resIds=self.employees.ids)
        self.assertIn(b'Bidule', content)
        self.assertIn(b'Machin', content)

    def test_single_company_report() {
        with self.assertRaises(QWebException):  # CacheMiss followed by AccessError
            content, content_type = self.env.ref('hr.hr_employee_print_badge').with_user(self.res_users_hr_officer).with_company(
                self.company_1
            )._render_qweb_pdf(resIds=self.employees.ids)
