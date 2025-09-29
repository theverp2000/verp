# -*- coding: utf-8 -*-

from verp import Command
from verp.tests import HttpCase, tagged


@tagged('post_install', '-at_install')
class TestProjectSharingUi(HttpCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        user = cls.env['res.users'].with_context({'no_reset_password': True, 'mail_create_nolog': True}).create({
            'name': 'Georges',
            'login': 'georges1',
            'password': 'georges1',
            'email': 'georges@project.portal',
            'signature': 'SignGeorges',
            'notification_type': 'email',
            'groups_id': [Command.set([cls.env.ref('base.groupPortal').id])],
        })

        cls.partner_portal = cls.env['res.partner'].with_context({'mail_create_nolog': True}).create({
            'name': 'Georges',
            'email': 'georges@project.portal',
            'company_id': False,
            'user_ids': [user.id],
        })
        cls.project_portal = cls.env['project.project'].with_context({'mail_create_nolog': True}).create({
            'name': 'Project Sharing',
            'privacyVisibility': 'portal',
            'aliasName': 'project+sharing',
            'partner_id': cls.partner_portal.id,
            'typeIds': [
                Command.create({'name': 'To Do', 'sequence': 1}),
                Command.create({'name': 'Done', 'sequence': 10})
            ],
        })

    def test_01_project_sharing(self):
        """ Test Project Sharing UI with an internal user """
        self.start_tour("/web", 'project_sharing_tour', login="admin")

    def test_02_project_sharing(self):
        """ Test project sharing ui with a portal user.

            The additional data created here are the data created in the first test with the tour js.

            Since a problem to logout Mitchell Admin to log in as Georges user, this test is created
            to launch a tour with portal user.
        """
        project_share_wizard = self.env['project.share.wizard'].create({
            'access_mode': 'edit',
            'resModel': 'project.project',
            'resId': self.project_portal.id,
            'partner_ids': [
                Command.link(self.partner_portal.id),
            ],
        })
        project_share_wizard.action_send_mail()

        self.project_portal.write({
            'task_ids': [Command.create({
                'name': "Test Project Sharing",
                'stageId': self.project_portal.typeIds.filtered(lambda stage: stage.sequence == 10)[:1].id,
            })],
        })
        self.start_tour("/my/projects", 'portal_project_sharing_tour', login='georges1')
