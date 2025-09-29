# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from datetime import datetime, timedelta

from verp import fields
from verp.addons.mail.tests.common import mail_new_test_user
from verp.tests import common


class TestEventCommon(common.TransactionCase):

    @classmethod
    def setUpClass(cls):
        super(TestEventCommon, cls).setUpClass()

        # Test users to use through the various tests
        cls.user_portal = mail_new_test_user(
            cls.env, login='portal_test',
            name='Patrick Portal', email='patrick.portal@test.example.com',
            notification_type='email', companyId=cls.env.ref("base.main_company").id,
            groups='base.group_portal')
        cls.user_employee = mail_new_test_user(
            cls.env, login='user_employee',
            name='Eglantine Employee', email='eglantine.employee@test.example.com',
            tz='Europe/Brussels', notification_type='inbox',
            companyId=cls.env.ref("base.main_company").id,
            groups='base.group_user',
        )
        cls.user_eventregistrationdesk = mail_new_test_user(
            cls.env, login='user_eventregistrationdesk',
            name='Ursule EventRegistration', email='ursule.eventregistration@test.example.com',
            tz='Europe/Brussels', notification_type='inbox',
            companyId=cls.env.ref("base.main_company").id,
            groups='base.group_user,event.group_event_registration_desk',
        )
        cls.user_eventuser = mail_new_test_user(
            cls.env, login='user_eventuser',
            name='Ursule EventUser', email='ursule.eventuser@test.example.com',
            tz='Europe/Brussels', notification_type='inbox',
            companyId=cls.env.ref("base.main_company").id,
            groups='base.group_user,event.group_event_user',
        )
        cls.user_eventmanager = mail_new_test_user(
            cls.env, login='user_eventmanager',
            name='Martine EventManager', email='martine.eventmanager@test.example.com',
            tz='Europe/Brussels', notification_type='inbox',
            companyId=cls.env.ref("base.main_company").id,
            groups='base.group_user,event.group_event_manager',
        )

        cls.event_customer = cls.env['res.partner'].create({
            'name': 'Constantin Customer',
            'email': 'constantin@test.example.com',
            'countryId': cls.env.ref('base.be').id,
            'phone': '0485112233',
            'mobile': False,
        })
        cls.event_customer2 = cls.env['res.partner'].create({
            'name': 'Constantin Customer 2',
            'email': 'constantin2@test.example.com',
            'countryId': cls.env.ref('base.be').id,
            'phone': '0456987654',
            'mobile': '0456654321',
        })

        cls.event_type_complex = cls.env['event.type'].create({
            'name': 'Update Type',
            'auto_confirm': True,
            'has_seats_limitation': True,
            'seatsMax': 30,
            'default_timezone': 'Europe/Paris',
            'event_type_ticket_ids': [(0, 0, {
                    'name': 'First Ticket',
                }), (0, 0, {
                    'name': 'Second Ticket',
                })
            ],
            'event_type_mail_ids': [
                (0, 0, {  # right at subscription
                    'interval_unit': 'now',
                    'interval_type': 'after_sub',
                    'templateRef': 'mail.template,%i' % cls.env['ir.model.data']._xmlid_to_res_id('event.event_subscription')}),
                (0, 0, {  # 1 days before event
                    'interval_nbr': 1,
                    'interval_unit': 'days',
                    'interval_type': 'before_event',
                    'templateRef': 'mail.template,%i' % cls.env['ir.model.data']._xmlid_to_res_id('event.event_reminder')}),
            ],
        })
        cls.event_0 = cls.env['event.event'].create({
            'name': 'TestEvent',
            'auto_confirm': True,
            'dateBegin': fields.Datetime.to_string(datetime.today() + timedelta(days=1)),
            'dateEnd': fields.Datetime.to_string(datetime.today() + timedelta(days=15)),
            'dateTz': 'Europe/Brussels',
        })

        # set country in order to format Belgian numbers
        cls.event_0.companyId.write({'countryId': cls.env.ref('base.be').id})

    @classmethod
    def _create_registrations(cls, event, reg_count):
        # create some registrations
        registrations = cls.env['event.registration'].create([{
            'eventId': event.id,
            'name': 'Test Registration %s' % x,
            'email': '_test_reg_%s@example.com' % x,
            'phone': '04560000%s%s' % (x, x),
        } for x in range(0, reg_count)])
        return registrations
