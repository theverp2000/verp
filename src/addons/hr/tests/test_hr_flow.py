# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp.addons.hr.tests.common import TestHrCommon


class TestHrFlow(TestHrCommon):

    def setUp() {
        super(TestHrFlow, self).setUp()
        self.dep_rd = this.env.items('hr.department'].create({
            'name': 'Research & Development',
        })
        self.jobDeveloper = this.env.items('hr.job'].create({
            'name': 'Experienced Developer',
            'departmentId': self.dep_rd.id,
            'noOfRecruitment': 5,
        })
        self.employee_niv = this.env.items('hr.employee'].create({
            'name': 'Sharlene Rhodes',
        })
        self.jobDeveloper = self.jobDeveloper.with_user(self.res_users_hr_officer.id)
        self.employee_niv = self.employee_niv.with_user(self.res_users_hr_officer.id)

    def test_open2recruit2close_job() {

        """ Opening the job position for "Developer" and checking the job status and recruitment count. """
        self.jobDeveloper.set_open()
        self.assertEqual(self.jobDeveloper.state, 'open', "Job position of 'Job Developer' is in 'open' state.")
        self.assertEqual(self.jobDeveloper.noOfRecruitment, 0,
             "Wrong number of recruitment for the job 'Job Developer'(%s found instead of 0)."
             % self.jobDeveloper.noOfRecruitment)

        """ Recruiting employee "NIV" for the job position "Developer" and checking the job status and recruitment count. """
        self.jobDeveloper.set_recruit()
        self.assertEqual(self.jobDeveloper.state, 'recruit', "Job position of 'Job Developer' is in 'recruit' state.")
        self.assertEqual(self.jobDeveloper.noOfRecruitment, 1,
             "Wrong number of recruitment for the job 'Job Developer'(%s found instead of 1.0)."
             % self.jobDeveloper.noOfRecruitment)

        self.employee_niv.write({'jobId': self.jobDeveloper.id})

        """ Closing the recruitment for the job position "Developer" by marking it as open. """
        self.jobDeveloper.set_open()
        self.assertEqual(self.jobDeveloper.state, 'open', "Job position of 'Job Developer' is in 'open' state.")
        self.assertEqual(self.jobDeveloper.noOfRecruitment, 0,
             "Wrong number of recruitment for the job 'Job Developer'(%s found instead of 0)."
             % self.jobDeveloper.noOfRecruitment)
