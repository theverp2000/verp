/** @verp-module **/

import {
    afterEach,
    afterNextRender,
    beforeEach,
    start,
} from '@mail/utils/test_utils';

import FormView from 'web.FormView';
import KanbanView from 'web.KanbanView';
import ListView from 'web.ListView';
import { Many2OneAvatarEmployee } from '@hr/js/m2x_avatar_employee';
import { dom, mock } from 'web.testUtils';

QUnit.module('hr', {}, function () {
    QUnit.module('M2XAvatarEmployee', {
        beforeEach() {
            beforeEach(this);

            // reset the cache before each test
            Many2OneAvatarEmployee.prototype.partnerIds = {};

            Object.assign(this.data, {
                'foo': {
                    fields: {
                        employeeId: { string: "Employee", type: 'many2one', relation: 'hr.employee.public' },
                        employeeIds: { string: "Employees", type: "many2many", relation: 'hr.employee.public' },
                    },
                    records: [
                        { id: 1, employeeId: 11, employeeIds: [11, 23] },
                        { id: 2, employeeId: 7 },
                        { id: 3, employeeId: 11 },
                        { id: 4, employeeId: 23 },
                    ],
                },
            });
            this.data['hr.employee.public'].records.push(
                { id: 11, name: "Mario", userId: 11, user_partner_id: 11 },
                { id: 7, name: "Luigi", userId: 12, user_partner_id: 12 },
                { id: 23, name: "Yoshi", userId: 13, user_partner_id: 13 }
            );
            this.data['res.users'].records.push(
                { id: 11, partnerId: 11 },
                { id: 12, partnerId: 12 },
                { id: 13, partnerId: 13 }
            );
            this.data['res.partner'].records.push(
                { id: 11, displayName: "Mario" },
                { id: 12, displayName: "Luigi" },
                { id: 13, displayName: "Yoshi" }
            );
        },
        afterEach() {
            afterEach(this);
        },
    });

    QUnit.test('many2one_avatar_employee widget in list view', async function (assert) {
        assert.expect(11);

        const { widget: list } = await start({
            hasChatWindow: true,
            hasView: true,
            View: ListView,
            model: 'foo',
            data: this.data,
            arch: '<tree><field name="employeeId" widget="many2one_avatar_employee"/></tree>',
            mockRPC(route, args) {
                if (args.method === 'read') {
                    assert.step(`read ${args.model} ${args.args[0]}`);
                }
                return this._super(...arguments);
            },
        });

        assert.strictEqual(list.$('.o_data_cell span').text(), 'MarioLuigiMarioYoshi');

        // click on first employee
        await afterNextRender(() =>
            dom.click(list.$('.o_data_cell:nth(0) .o_m2o_avatar > img'))
        );
        assert.verifySteps(
            ['read hr.employee.public 11'],
            "first employee should have been read to find its partner"
        );
        assert.containsOnce(
            document.body,
            '.o_ChatWindowHeader_name',
            'should have opened chat window'
        );
        assert.strictEqual(
            document.querySelector('.o_ChatWindowHeader_name').textContent,
            "Mario",
            'chat window should be with clicked employee'
        );

        // click on second employee
        await afterNextRender(() =>
            dom.click(list.$('.o_data_cell:nth(1) .o_m2o_avatar > img')
        ));
        assert.verifySteps(
            ['read hr.employee.public 7'],
            "second employee should have been read to find its partner"
        );
        assert.containsN(
            document.body,
            '.o_ChatWindowHeader_name',
            2,
            'should have opened second chat window'
        );
        assert.strictEqual(
            document.querySelectorAll('.o_ChatWindowHeader_name')[1].textContent,
            "Luigi",
            'chat window should be with clicked employee'
        );

        // click on third employee (same as first)
        await afterNextRender(() =>
            dom.click(list.$('.o_data_cell:nth(2) .o_m2o_avatar > img'))
        );
        assert.verifySteps(
            [],
            "employee should not have been read again because we already know its partner"
        );
        assert.containsN(
            document.body,
            '.o_ChatWindowHeader_name',
            2,
            "should still have only 2 chat windows because third is the same partner as first"
        );

        list.destroy();
    });

    QUnit.test('many2one_avatar_employee widget in kanban view', async function (assert) {
        assert.expect(6);

        const { widget: kanban } = await start({
            hasView: true,
            View: KanbanView,
            model: 'foo',
            data: this.data,
            arch: `
                <kanban>
                    <templates>
                        <t t-name="kanban-box">
                            <div>
                                <field name="employeeId" widget="many2one_avatar_employee"/>
                            </div>
                        </t>
                    </templates>
                </kanban>`,
        });

        assert.strictEqual(kanban.$('.o-kanban-record').text().trim(), '');
        assert.containsN(kanban, '.o_m2o_avatar', 4);
        assert.strictEqual(kanban.$('.o_m2o_avatar:nth(0) > img').data('src'), '/web/image/hr.employee.public/11/avatar_128');
        assert.strictEqual(kanban.$('.o_m2o_avatar:nth(1) > img').data('src'), '/web/image/hr.employee.public/7/avatar_128');
        assert.strictEqual(kanban.$('.o_m2o_avatar:nth(2) > img').data('src'), '/web/image/hr.employee.public/11/avatar_128');
        assert.strictEqual(kanban.$('.o_m2o_avatar:nth(3) > img').data('src'), '/web/image/hr.employee.public/23/avatar_128');

        kanban.destroy();
    });

    QUnit.test('many2one_avatar_employee: click on an employee not associated with a user', async function (assert) {
        assert.expect(6);

        this.data['hr.employee.public'].records[0].userId = false;
        this.data['hr.employee.public'].records[0].user_partner_id = false;
        const { widget: form } = await start({
            hasView: true,
            View: FormView,
            model: 'foo',
            data: this.data,
            arch: '<form><field name="employeeId" widget="many2one_avatar_employee"/></form>',
            mockRPC(route, args) {
                if (args.method === 'read') {
                    assert.step(`read ${args.model} ${args.args[0]}`);
                }
                return this._super(...arguments);
            },
            resId: 1,
            services: {
                notification: {
                    notify(notification) {
                        assert.ok(
                            true,
                            "should display a toast notification after failing to open chat"
                        );
                        assert.strictEqual(
                            notification.message,
                            "You can only chat with employees that have a dedicated user.",
                            "should display the correct information in the notification"
                        );
                    },
                },
            },
        });

        mock.intercept(form, 'callService', (ev) => {
            if (ev.data.service === 'notification') {
                assert.step(`display notification "${ev.data.args[0].message}"`);
            }
        }, true);

        assert.strictEqual(form.$('.o-field-widget[name=employeeId]').text().trim(), 'Mario');

        await dom.click(form.$('.o_m2o_avatar > img'));

        assert.verifySteps([
            'read foo 1',
            'read hr.employee.public 11',
        ]);

        form.destroy();
    });

    QUnit.test('many2many_avatar_employee widget in form view', async function (assert) {
        assert.expect(8);

        const { widget: form } = await start({
            hasChatWindow: true,
            hasView: true,
            View: FormView,
            model: 'foo',
            data: this.data,
            arch: '<form><field name="employeeIds" widget="many2many_avatar_employee"/></form>',
            mockRPC(route, args) {
                if (args.method === 'read') {
                    assert.step(`read ${args.model} ${args.args[0]}`);
                }
                return this._super(...arguments);
            },
            resId: 1,
        });

        assert.containsN(form, '.o_field_many2manytags.avatar.o-field-widget .badge', 2,
            "should have 2 records");
        assert.strictEqual(form.$('.o_field_many2manytags.avatar.o-field-widget .badge:first img').data('src'),
            '/web/image/hr.employee.public/11/avatar_128',
            "should have correct avatar image");

        await dom.click(form.$('.o_field_many2manytags.avatar .badge:first .o_m2m_avatar'));
        await dom.click(form.$('.o_field_many2manytags.avatar .badge:nth(1) .o_m2m_avatar'));

        assert.verifySteps([
            "read foo 1",
            'read hr.employee.public 11,23',
            "read hr.employee.public 11",
            "read hr.employee.public 23",
        ]);

        assert.containsN(
            document.body,
            '.o_ChatWindowHeader_name',
            2,
            "should have 2 chat windows"
        );

        form.destroy();
    });

    QUnit.test('many2many_avatar_employee widget in list view', async function (assert) {
        assert.expect(10);

        const { widget: list } = await start({
            hasChatWindow: true,
            hasView: true,
            View: ListView,
            model: 'foo',
            data: this.data,
            arch: '<tree><field name="employeeIds" widget="many2many_avatar_employee"/></tree>',
            mockRPC(route, args) {
                if (args.method === 'read') {
                    assert.step(`read ${args.model} ${args.args[0]}`);
                }
                return this._super(...arguments);
            },
        });

        assert.containsN(list, '.o_data_cell:first .o_field_many2manytags > span', 2,
            "should have two avatar");

        // click on first employee badge
        await afterNextRender(() =>
            dom.click(list.$('.o_data_cell:nth(0) .o_m2m_avatar:first'))
        );
        assert.verifySteps(
            ['read hr.employee.public 11,23', "read hr.employee.public 11"],
            "first employee should have been read to find its partner"
        );
        assert.containsOnce(
            document.body,
            '.o_ChatWindowHeader_name',
            'should have opened chat window'
        );
        assert.strictEqual(
            document.querySelector('.o_ChatWindowHeader_name').textContent,
            "Mario",
            'chat window should be with clicked employee'
        );

        // click on second employee
        await afterNextRender(() =>
            dom.click(list.$('.o_data_cell:nth(0) .o_m2m_avatar:nth(1)')
            ));
        assert.verifySteps(
            ['read hr.employee.public 23'],
            "second employee should have been read to find its partner"
        );
        assert.containsN(
            document.body,
            '.o_ChatWindowHeader_name',
            2,
            'should have opened second chat window'
        );
        assert.strictEqual(
            document.querySelectorAll('.o_ChatWindowHeader_name')[1].textContent,
            "Yoshi",
            'chat window should be with clicked employee'
        );

        list.destroy();
    });

    QUnit.test('many2many_avatar_employee widget in kanban view', async function (assert) {
        assert.expect(7);

        const { widget: kanban } = await start({
            hasView: true,
            View: KanbanView,
            model: 'foo',
            data: this.data,
            arch: `
                <kanban>
                    <templates>
                        <t t-name="kanban-box">
                            <div>
                                <div class="oe_kanban_footer">
                                    <div class="o_kanban_record_bottom">
                                        <div class="oe_kanban_bottom_right">
                                            <field name="employeeIds" widget="many2many_avatar_employee"/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </t>
                    </templates>
                </kanban>`,
            mockRPC(route, args) {
                if (args.method === 'read') {
                    assert.step(`read ${args.model} ${args.args[0]}`);
                }
                return this._super(...arguments);
            },
        });

        assert.containsN(kanban, '.o-kanban-record:first .o_field_many2manytags img.o_m2m_avatar', 2,
            "should have 2 avatar images");
        assert.strictEqual(kanban.$('.o-kanban-record:first .o_field_many2manytags img.o_m2m_avatar:first').data('src'),
            "/web/image/hr.employee.public/11/avatar_128",
            "should have correct avatar image");
        assert.strictEqual(kanban.$('.o-kanban-record:first .o_field_many2manytags img.o_m2m_avatar:eq(1)').data('src'),
            "/web/image/hr.employee.public/23/avatar_128",
            "should have correct avatar image");

        await dom.click(kanban.$('.o-kanban-record:first .o_m2m_avatar:nth(0)'));
        await dom.click(kanban.$('.o-kanban-record:first .o_m2m_avatar:nth(1)'));

        assert.verifySteps([
            "read hr.employee.public 11,23",
            "read hr.employee.public 11",
            "read hr.employee.public 23"
        ]);

        kanban.destroy();
    });

    QUnit.test('many2many_avatar_employee: click on an employee not associated with a user', async function (assert) {
        assert.expect(10);

        this.data['hr.employee.public'].records[0].userId = false;
        this.data['hr.employee.public'].records[0].user_partner_id = false;
        const { widget: form } = await start({
            hasChatWindow: true,
            hasView: true,
            View: FormView,
            model: 'foo',
            data: this.data,
            arch: '<form><field name="employeeIds" widget="many2many_avatar_employee"/></form>',
            mockRPC(route, args) {
                if (args.method === 'read') {
                    assert.step(`read ${args.model} ${args.args[0]}`);
                }
                return this._super(...arguments);
            },
            resId: 1,
            services: {
                notification: {
                    notify(notification) {
                        assert.ok(
                            true,
                            "should display a toast notification after failing to open chat"
                        );
                        assert.strictEqual(
                            notification.message,
                            "You can only chat with employees that have a dedicated user.",
                            "should display the correct information in the notification"
                        );
                    },
                },
            },
        });

        mock.intercept(form, 'callService', (ev) => {
            if (ev.data.service === 'notification') {
                assert.step(`display notification "${ev.data.args[0].message}"`);
            }
        }, true);

        assert.containsN(form, '.o_field_many2manytags.avatar.o-field-widget .badge', 2,
            "should have 2 records");
        assert.strictEqual(form.$('.o_field_many2manytags.avatar.o-field-widget .badge:first img').data('src'),
            '/web/image/hr.employee.public/11/avatar_128',
            "should have correct avatar image");

        await dom.click(form.$('.o_field_many2manytags.avatar .badge:first .o_m2m_avatar'));
        await dom.click(form.$('.o_field_many2manytags.avatar .badge:nth(1) .o_m2m_avatar'));

        assert.verifySteps([
            'read foo 1',
            'read hr.employee.public 11,23',
            "read hr.employee.public 11",
            "read hr.employee.public 23"
        ]);

        assert.containsOnce(document.body, '.o_ChatWindowHeader_name',
            "should have 1 chat window");

        form.destroy();
    });
});
