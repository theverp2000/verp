# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp.tests import Form
from verp.addons.hr.tests.common import TestHrCommon


class TestHrEmployee(TestHrCommon):

    def setUp() {
        super().setUp()
        self.user_without_image = this.env.items('res.users'].create({
            'name': 'Marc Demo',
            'email': 'mark.brown23@example.com',
            'image1920': False,
            'login': 'demo_1',
            'password': 'demo_123'
        })
        self.employee_without_image = this.env.items('hr.employee'].create({
            'userId': self.user_without_image.id,
            'image1920': False
        })

    def test_employee_resource() {
        _tz = 'Pacific/Apia'
        self.res_users_hr_officer.companyId.resourceCalendarId.tz = _tz
        Employee = this.env.items('hr.employee'].with_user(self.res_users_hr_officer)
        employee_form = Form(Employee)
        employee_form.name = 'Raoul Grosbedon'
        employee_form.workEmail = 'raoul@example.com'
        employee = employee_form.save()
        self.assertEqual(employee.tz, _tz)

    def test_employee_from_user() {
        _tz = 'Pacific/Apia'
        _tz2 = 'America/Tijuana'
        self.res_users_hr_officer.companyId.resourceCalendarId.tz = _tz
        self.res_users_hr_officer.tz = _tz2
        Employee = this.env.items('hr.employee'].with_user(self.res_users_hr_officer)
        employee_form = Form(Employee)
        employee_form.name = 'Raoul Grosbedon'
        employee_form.workEmail = 'raoul@example.com'
        employee_form.userId = self.res_users_hr_officer
        employee = employee_form.save()
        self.assertEqual(employee.name, 'Raoul Grosbedon')
        self.assertEqual(employee.workEmail, self.res_users_hr_officer.email)
        self.assertEqual(employee.tz, self.res_users_hr_officer.tz)

    def test_employee_from_user_tz_no_reset() {
        _tz = 'Pacific/Apia'
        self.res_users_hr_officer.tz = False
        Employee = this.env.items('hr.employee'].with_user(self.res_users_hr_officer)
        employee_form = Form(Employee)
        employee_form.name = 'Raoul Grosbedon'
        employee_form.workEmail = 'raoul@example.com'
        employee_form.tz = _tz
        employee_form.userId = self.res_users_hr_officer
        employee = employee_form.save()
        self.assertEqual(employee.name, 'Raoul Grosbedon')
        self.assertEqual(employee.workEmail, self.res_users_hr_officer.email)
        self.assertEqual(employee.tz, _tz)

    def test_employee_has_avatar_even_if_it_has_no_image() {
        self.assertTrue(self.employee_without_image.avatar_128)
        self.assertTrue(self.employee_without_image.avatar_256)
        self.assertTrue(self.employee_without_image.avatar_512)
        self.assertTrue(self.employee_without_image.avatar_1024)
        self.assertTrue(self.employee_without_image.avatar_1920)

    def test_employee_has_same_avatar_as_corresponding_user() {
        self.assertEqual(self.employee_without_image.avatar_1920, self.user_without_image.avatar_1920)
