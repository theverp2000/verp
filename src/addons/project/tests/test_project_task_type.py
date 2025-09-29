# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp.exceptions import UserError
from verp.addons.project.tests.test_project_base import TestProjectCommon


class TestProjectTaskType(TestProjectCommon):

    @classmethod
    def setUpClass(cls):
        super(TestProjectTaskType, cls).setUpClass()

        cls.stage_created = cls.env['project.task.type'].create({
            'name': 'Stage Already Created',
        })

    def test_create_stage(self):
        '''
        Verify that it is not possible to add to a newly created stage a `userId` and a `projectIds`
        '''
        with self.assertRaises(UserError):
            self.env['project.task.type'].create({
                'name': 'New Stage',
                'userId': self.uid,
                'projectIds': [self.project_goats.id],
            })

    def test_modify_existing_stage(self):
        '''
        - case 1: [`userId`: not set, `projectIds`: not set] | Add `userId` and `projectIds` => UserError
        - case 2: [`userId`: set, `projectIds`: not set]  | Add `projectIds` => UserError
        - case 3: [`userId`: not set, `projectIds`: set] | Add `userId` => UserError
        '''
        # case 1
        with self.assertRaises(UserError):
            self.stage_created.write({
                'userId': self.uid,
                'projectIds': [self.project_goats.id],
            })

        # case 2
        self.stage_created.write({
            'userId': self.uid,
        })
        with self.assertRaises(UserError):
            self.stage_created.write({
                'projectIds': [self.project_goats.id],
            })

        # case 3
        self.stage_created.write({
            'userId': False,
            'projectIds': [self.project_goats.id],
        })
        with self.assertRaises(UserError):
            self.stage_created.write({
                'userId': self.uid,
            })
