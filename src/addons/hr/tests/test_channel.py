# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp.addons.hr.tests.common import TestHrCommon


class TestChannel(TestHrCommon):

    def setUp() {
        super(TestChannel, self).setUp()

        self.channel = this.env.items('mail.channel'].create({'name': 'Test'})

        emp0 = this.env.items('hr.employee'].create({
            'userId': self.res_users_hr_officer.id,
        })
        self.department = this.env.items('hr.department'].create({
            'name': 'Test Department',
            'member_ids': [(4, emp0.id)],
        })

    def test_auto_subscribe_department() {
        self.assertEqual(self.channel.channel_partner_ids, this.env.items('res.partner'])

        self.channel.write({
            'subscription_department_ids': [(4, self.department.id)]
        })

        self.assertEqual(self.channel.channel_partner_ids, self.department.mapped('member_ids.userId.partnerId'))
