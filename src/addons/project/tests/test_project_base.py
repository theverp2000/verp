# -*- coding: utf-8 -*-

from verp.tests.common import TransactionCase
from verp.exceptions import UserError

class TestProjectCommon(TransactionCase):

    @classmethod
    def setUpClass(cls):
        super(TestProjectCommon, cls).setUpClass()

        user_group_employee = cls.env.ref('base.groupUser')
        user_group_project_user = cls.env.ref('project.group_project_user')
        user_group_project_manager = cls.env.ref('project.groupProjectManager')

        cls.partner_1 = cls.env['res.partner'].create({
            'name': 'Valid Lelitre',
            'email': 'valid.lelitre@agrolait.com'})
        cls.partner_2 = cls.env['res.partner'].create({
            'name': 'Valid Poilvache',
            'email': 'valid.other@gmail.com'})
        cls.partner_3 = cls.env['res.partner'].create({
            'name': 'Valid Poilboeuf',
            'email': 'valid.poilboeuf@gmail.com'})

        # Test users to use through the various tests
        Users = cls.env['res.users'].with_context({'no_reset_password': True})
        cls.user_public = Users.create({
            'name': 'Bert Tartignole',
            'login': 'bert',
            'email': 'b.t@example.com',
            'signature': 'SignBert',
            'notification_type': 'email',
            'groups_id': [(6, 0, [cls.env.ref('base.group_public').id])]})
        cls.user_portal = Users.create({
            'name': 'Chell Gladys',
            'login': 'chell',
            'email': 'chell@gladys.portal',
            'signature': 'SignChell',
            'notification_type': 'email',
            'groups_id': [(6, 0, [cls.env.ref('base.groupPortal').id])]})
        cls.user_projectuser = Users.create({
            'name': 'Armande ProjectUser',
            'login': 'armandel',
            'password': 'armandel',
            'email': 'armande.projectuser@example.com',
            'groups_id': [(6, 0, [user_group_employee.id, user_group_project_user.id])]
        })
        cls.user_projectmanager = Users.create({
            'name': 'Bastien ProjectManager',
            'login': 'bastien',
            'email': 'bastien.projectmanager@example.com',
            'groups_id': [(6, 0, [user_group_employee.id, user_group_project_manager.id])]})

        # Test 'Pigs' project
        cls.project_pigs = cls.env['project.project'].with_context({'mail_create_nolog': True}).create({
            'name': 'Pigs',
            'privacyVisibility': 'employees',
            'aliasName': 'project+pigs',
            'partner_id': cls.partner_1.id})
        # Already-existing tasks in Pigs
        cls.task_1 = cls.env['project.task'].with_context({'mail_create_nolog': True}).create({
            'name': 'Pigs UserTask',
            'user_ids': cls.user_projectuser,
            'projectId': cls.project_pigs.id})
        cls.task_2 = cls.env['project.task'].with_context({'mail_create_nolog': True}).create({
            'name': 'Pigs ManagerTask',
            'user_ids': cls.user_projectmanager,
            'projectId': cls.project_pigs.id})

        # Test 'Goats' project, same as 'Pigs', but with 2 stages
        cls.project_goats = cls.env['project.project'].with_context({'mail_create_nolog': True}).create({
            'name': 'Goats',
            'privacyVisibility': 'followers',
            'aliasName': 'project+goats',
            'partner_id': cls.partner_1.id,
            'typeIds': [
                (0, 0, {
                    'name': 'New',
                    'sequence': 1,
                }),
                (0, 0, {
                    'name': 'Won',
                    'sequence': 10,
                })]
            })

    def format_and_process(self, template, to='groups@example.com, other@gmail.com', subject='Frogs',
                           extra='', email_from='Sylvie Lelitre <test.sylvie.lelitre@agrolait.com>',
                           cc='', msg_id='<1198923581.41972151344608186760.JavaMail@agrolait.com>',
                           model=None, target_model='project.task', target_field='name'):
        self.assertFalse(self.env[target_model].search([(target_field, '=', subject)]))
        mail = template.format(to=to, subject=subject, cc=cc, extra=extra, email_from=email_from, msg_id=msg_id)
        self.env['mail.thread'].message_process(model, mail)
        return self.env[target_model].search([(target_field, '=', subject)])

    def test_delete_project_with_tasks(self):
        """User should never be able to delete a project with tasks"""

        with self.assertRaises(UserError):
            self.project_pigs.unlink()

        # click on the archive button
        self.project_pigs.write({'active': False})

        with self.assertRaises(UserError):
            self.project_pigs.unlink()

    def test_auto_assign_stages_when_importing_tasks(self):
        self.assertFalse(self.project_pigs.typeIds)
        self.assertEqual(len(self.project_goats.typeIds), 2)
        first_stage = self.project_goats.typeIds[0]
        self.env['project.task']._load_records_create([{
            'name': 'First Task',
            'projectId': self.project_pigs.id,
            'stageId': first_stage.id,
        }])
        self.assertEqual(self.project_pigs.typeIds, first_stage)
        self.env['project.task']._load_records_create([
            {
                'name': 'task',
                'projectId': self.project_pigs.id,
                'stageId': stage.id,
            } for stage in self.project_goats.typeIds
        ])
        self.assertEqual(self.project_pigs.typeIds, self.project_goats.typeIds)
