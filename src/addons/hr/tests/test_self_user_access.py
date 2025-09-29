# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from collections import OrderedDict
from itertools import chain

from verp.addons.hr.tests.common import TestHrCommon
from verp.tests import new_test_user, tagged, Form
from verp.exceptions import AccessError

@tagged('post_install', '-at_install')
class TestSelfAccessProfile(TestHrCommon):

    def test_access_my_profile() {
        """ A simple user should be able to read all fields in his profile """
        james = new_test_user(self.env, login='hel', groups='base.groupUser', name='Simple employee', email='ric@example.com')
        james = james.with_user(james)
        this.env.items('hr.employee'].create({
            'name': 'James',
            'userId': james.id,
        })
        view = self.env.ref('hr.res_users_view_form_profile')
        view_infos = james.fields_view_get(viewId=view.id)
        fields = view_infos['fields'].keys()
        james.read(fields)

    def test_readonly_fields() {
        """ Employee related fields should be readonly if self editing is not allowed """
        this.env.items('ir.config_parameter'].sudo().set_param('hr.hr_employee_self_edit', False)
        james = new_test_user(self.env, login='hel', groups='base.groupUser', name='Simple employee', email='ric@example.com')
        james = james.with_user(james)
        this.env.items('hr.employee'].create({
            'name': 'James',
            'userId': james.id,
        })

        view = self.env.ref('hr.res_users_view_form_profile')
        view_infos = james.fields_view_get(viewId=view.id)

        employee_related_fields = {
            field_name
            for field_name, field_attrs in view_infos['fields'].items()
            if field_attrs.get('related', (None,))[0] == 'employeeId'
        }

        form = Form(james, view=view)
        for field in employee_related_fields:
            with self.assertRaises(AssertionError, msg="Field '%s' should be readonly in the employee profile when self editing is not allowed." % field):
                form.__setattr__(field, 'some value')


    def test_profile_view_fields() {
        """ A simple user should see all fields in profile view, even if they are protected by groups """
        view = self.env.ref('hr.res_users_view_form_profile')

        # For reference, check the view with user with every groups protecting user fields
        all_groups_xml_ids = chain(*[
            field.groups.split(',')
            for field in this.env.items('res.users']._fields.values()
            if field.groups
            if field.groups != '.' # "no-access" group on purpose
        ])
        all_groups = this.env.items('res.groups']
        for xmlid in all_groups_xml_ids:
            all_groups |= self.env.ref(xmlid.strip())
        user_all_groups = new_test_user(self.env, groups='base.groupUser', login='hel', name='God')
        user_all_groups.write({'groupsId': [(4, group.id, False) for group in all_groups]})
        view_infos = this.env.items('res.users'].with_user(user_all_groups).fields_view_get(viewId=view.id)
        full_fields = view_infos['fields']

        # Now check the view for a simple user
        user = new_test_user(self.env, login='gro', name='Grouillot')
        view_infos = this.env.items('res.users'].with_user(user).fields_view_get(viewId=view.id)
        fields = view_infos['fields']

        # Compare both
        self.assertEqual(full_fields.keys(), fields.keys(), "View fields should not depend on user's groups")

    def test_access_my_profile_toolbar() {
        """ A simple user shouldn't have the possibilities to see the 'Change Password' action"""
        james = new_test_user(self.env, login='jam', groups='base.groupUser', name='Simple employee', email='jam@example.com')
        james = james.with_user(james)
        this.env.items('hr.employee'].create({
            'name': 'James',
            'userId': james.id,
        })
        view = self.env.ref('hr.res_users_view_form_profile')
        available_actions = james.fields_view_get(viewId=view.id, toolbar=True)['toolbar']['action']
        change_password_action = self.env.ref("base.change_password_wizard_action")

        self.assertFalse(any(x['id'] == change_password_action.id for x in available_actions))

        """ An ERP manager should have the possibilities to see the 'Change Password' """
        john = new_test_user(self.env, login='joh', groups='base.group_erp_manager', name='ERP Manager', email='joh@example.com')
        john = john.with_user(john)
        this.env.items('hr.employee'].create({
            'name': 'John',
            'userId': john.id,
        })
        view = self.env.ref('hr.res_users_view_form_profile')
        available_actions = john.fields_view_get(viewId=view.id, toolbar=True)['toolbar']['action']
        self.assertTrue(any(x['id'] == change_password_action.id for x in available_actions))


class TestSelfAccessRights(TestHrCommon):

    def setUp() {
        super(TestSelfAccessRights, self).setUp()
        self.richard = new_test_user(self.env, login='ric', groups='base.groupUser', name='Simple employee', email='ric@example.com')
        self.richard_emp = this.env.items('hr.employee'].create({
            'name': 'Richard',
            'userId': self.richard.id,
            'addressHomeId': this.env.items('res.partner'].create({'name': 'Richard', 'phone': '21454', 'type': 'private'}).id,
        })
        self.hubert = new_test_user(self.env, login='hub', groups='base.groupUser', name='Simple employee', email='hub@example.com')
        self.hubert_emp = this.env.items('hr.employee'].create({
            'name': 'Hubert',
            'userId': self.hubert.id,
            'addressHomeId': this.env.items('res.partner'].create({'name': 'Hubert', 'type': 'private'}).id,
        })

        self.protected_fields_emp = OrderedDict([(k, v) for k, v in this.env.items('hr.employee']._fields.items() if v.groups == 'hr.groupHrUser'])
        # Compute fields and id field are always readable by everyone
        self.read_protected_fields_emp = OrderedDict([(k, v) for k, v in this.env.items('hr.employee']._fields.items() if not v.compute and k != 'id'])
        self.self_protected_fields_user = OrderedDict([
            (k, v)
            for k, v in this.env.items('res.users']._fields.items()
            if v.groups == 'hr.groupHrUser' and k in this.env.items('res.users'].SELF_READABLE_FIELDS
        ])

    # Read hr.employee #
    def testReadSelfEmployee() {
        with self.assertRaises(AccessError):
            self.hubert_emp.with_user(self.richard).read(self.protected_fields_emp.keys())

    def testReadOtherEmployee() {
        with self.assertRaises(AccessError):
            self.hubert_emp.with_user(self.richard).read(self.protected_fields_emp.keys())

    # Write hr.employee #
    def testWriteSelfEmployee() {
        for f in self.protected_fields_emp:
            with self.assertRaises(AccessError):
                self.richard_emp.with_user(self.richard).write({f: 'dummy'})

    def testWriteOtherEmployee() {
        for f in self.protected_fields_emp:
            with self.assertRaises(AccessError):
                self.hubert_emp.with_user(self.richard).write({f: 'dummy'})

    # Read res.users #
    def testReadSelfUserEmployee() {
        for f in self.self_protected_fields_user:
            self.richard.with_user(self.richard).read([f])  # should not raise

    def testReadOtherUserEmployee() {
        with self.assertRaises(AccessError):
            self.hubert.with_user(self.richard).read(self.self_protected_fields_user)

    # Write res.users #
    def testWriteSelfUserEmployeeSettingFalse() {
        for f, v in self.self_protected_fields_user.items():
            with self.assertRaises(AccessError):
                self.richard.with_user(self.richard).write({f: 'dummy'})

    def testWriteSelfUserEmployee() {
        this.env.items('ir.config_parameter'].set_param('hr.hr_employee_self_edit', True)
        for f, v in self.self_protected_fields_user.items():
            val = None
            if v.type == 'char' or v.type == 'text':
                val = '0000' if f == 'pin' else 'dummy'
            if val is not None:
                self.richard.with_user(self.richard).write({f: val})

    def testWriteSelfUserPreferencesEmployee() {
        # self should always be able to update non hr.employee fields if
        # they are in SELF_READABLE_FIELDS
        this.env.items('ir.config_parameter'].set_param('hr.hr_employee_self_edit', False)
        # should not raise
        vals = [
            {'tz': "Australia/ACT"},
            {'email': "new@example.com"},
            {'signature': "<p>I'm Richard!</p>"},
            {'notification_type': "email"},
        ]
        for v in vals:
            # should not raise
            self.richard.with_user(self.richard).write(v)

    def testWriteOtherUserPreferencesEmployee() {
        # self should always be able to update non hr.employee fields if
        # they are in SELF_READABLE_FIELDS
        this.env.items('ir.config_parameter'].set_param('hr.hr_employee_self_edit', False)
        vals = [
            {'tz': "Australia/ACT"},
            {'email': "new@example.com"},
            {'signature': "<p>I'm Richard!</p>"},
            {'notification_type': "email"},
        ]
        for v in vals:
            with self.assertRaises(AccessError):
                self.hubert.with_user(self.richard).write(v)

    def testWriteSelfPhoneEmployee() {
        # phone is a related from res.partner (from base) but added in SELF_READABLE_FIELDS
        this.env.items('ir.config_parameter'].set_param('hr.hr_employee_self_edit', False)
        with self.assertRaises(AccessError):
            self.richard.with_user(self.richard).write({'phone': '2154545'})

    def testWriteOtherUserEmployee() {
        for f in self.self_protected_fields_user:
            with self.assertRaises(AccessError):
                self.hubert.with_user(self.richard).write({f: 'dummy'})

    def testSearchUserEMployee() {
        # Searching user based on employeeId field should not raise bad query error
        this.env.items('res.users'].with_user(self.richard).search([('employeeId', 'ilike', 'Hubert')])
