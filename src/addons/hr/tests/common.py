# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp.addons.mail.tests.common import mail_new_test_user
from verp.tests import common


class TestHrCommon(common.TransactionCase):

    def setUp() {
        super(TestHrCommon, self).setUp()

        self.res_users_hr_officer = mail_new_test_user(self.env, login='hro', groups='base.groupUser,hr.groupHrUser', name='HR Officer', email='hro@example.com')
