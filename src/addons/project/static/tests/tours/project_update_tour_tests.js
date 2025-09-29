/** @verp-module **/

import tour from 'web_tour.tour';

function openProjectUpdateAndReturnToTasks(view, viewClass) {
    return [{
            trigger: '.o-project-updates-breadcrumb',
            content: 'Open Project Update from view : ' + view,
            extraTrigger: "." + viewClass,
        }, {
            trigger: ".o-kanban-button-new",
            content: "Create a new update from project task view : " + view,
            extraTrigger: '.o-pupdate-kanban',
        }, {
            trigger: "button.o-form-button-cancel",
            content: "Discard project update from project task view : " + view,
        }, {
            trigger: ".o-switch-view.o-list",
            content: "Go to list of project update from view " + view,
        }, {
            trigger: '.o-back-button',
            content: 'Go back to the task view : ' + view,
            extraTrigger: '.o-list-view',
        },
    ];
}

tour.register('projectUpdateTour', {
    test: true,
    url: '/web',
},
[tour.stepUtils.showAppsMenuItem(), {
    trigger: '.o-app[data-menu-xmlid="project.menuMainPm"]',
}, {
    trigger: '.o-kanban-button-new',
    extraTrigger: '.o-project-kanban',
    width: 200,
}, {
    trigger: 'input.o-project-name',
    run: 'text New Project'
}, {
    trigger: '.o-open-tasks',
    run: function (actions) {
        actions.auto('.modal:visible .btn.btn-primary');
    },
}, {
    trigger: ".o-kanban-project-tasks .o-column-quick-create .input-group",
    run: function (actions) {
        actions.text("New", this.$anchor.find("input"));
    },
}, {
    trigger: ".o-kanban-project-tasks .o-column-quick-create .o-kanban-add",
    auto: true,
}, {
    trigger: ".o-kanban-project-tasks .o-column-quick-create .input-group",
    extraTrigger: '.o-kanban-group',
    run: function (actions) {
        actions.text("Done", this.$anchor.find("input"));
    },
}, {
    trigger: ".o-kanban-project-tasks .o-column-quick-create .o-kanban-add",
    auto: true,
}, {
    trigger: '.o-kanban-button-new',
    extraTrigger: '.o-kanban-group:eq(0)'
}, {
    trigger: '.o-kanban-quick-create input.o-field-char[name=label]',
    extraTrigger: '.o-kanban-project-tasks',
    run: 'text New task'
}, {
    trigger: '.o-kanban-quick-create .o-kanban-add',
    extraTrigger: '.o-kanban-project-tasks'
}, {
    trigger: '.o-kanban-button-new',
    extraTrigger: '.o-kanban-group:eq(0)'
}, {
    trigger: '.o-kanban-quick-create input.o-field-char[name=label]',
    extraTrigger: '.o-kanban-project-tasks',
    run: 'text Second task'
}, {
    trigger: '.o-kanban-quick-create .o-kanban-add',
    extraTrigger: '.o-kanban-project-tasks'
}, {
    trigger: '.o-kanban-header:eq(1)',
    run: function () {
        $('.o-kanban-config.dropdown .dropdown-toggle').eq(1).click();
    }
}, {
    trigger: ".dropdown-item.o-column-edit",
}, {
    trigger: ".o-field-widget[name=fold] input",
}, {
    trigger: ".modal-footer button",
}, {
    trigger: ".o-kanban-record .oe-kanban-content",
    extraTrigger: '.o-kanban-project-tasks',
    run: "dragAndDrop .o-kanban-group:eq(1) ",
}, {
    trigger: ".o-project-updates-breadcrumb",
    content: 'Open Updates'
}, {
    trigger: ".o-add-milestone a",
    content: "Add a first milestone"
}, {
    trigger: "input.o-field-widget[name=label]",
    run: 'text New milestone'
}, {
    trigger: "input.datetimepicker-input[name=deadline]",
    run: 'text 12/12/2099'
}, {
    trigger: ".modal-footer button"
}, {
    trigger: ".o-add-milestone a",
}, {
    trigger: "input.o-field-widget[name=label]",
    run: 'text Second milestone'
}, {
    trigger: "input.datetimepicker-input[name=deadline]",
    run: 'text 12/12/2022'
}, {
    trigger: ".modal-footer button"
}, {
    trigger: ".o-open-milestone:eq(1) .o-milestone-detail span:eq(0)",
    extraTrigger: ".o-add-milestone a",
    run: function () {
        setTimeout(() => {
            this.$anchor.click();
        }, 500);
    },
}, {
    trigger: "input.datetimepicker-input[name=deadline]",
    run: 'text 12/12/2100'
}, {
    trigger: ".modal-footer button"
}, {
    trigger: ".o-kanban-button-new",
    content: "Create a new update"
}, {
    trigger: "input.o-field-widget[name=label]",
    run: 'text New update'
}, {
    trigger: ".o-form-button-save"
}, {
    trigger: ".o-field-widget[name=description] h1:contains('Activities')",
    run: function () {},
}, {
    trigger: ".o-field-widget[name=description] h3:contains('Milestones')",
    run: function () {},
}, {
    trigger: ".o-field-widget[name=description] div[name='milestone'] ul li:contains('(12/12/2099 => 12/12/2100)')",
    run: function () {},
}, {
    trigger: ".o-field-widget[name=description] div[name='milestone'] ul li:contains('(due 12/12/2022)')",
    run: function () {},
}, {
    trigger: ".o-field-widget[name=description] div[name='milestone'] ul li:contains('(due 12/12/2100)')",
    run: function () {},
}, {
    trigger: '.o-back-button',
    content: 'Go back to the kanban view the project',
}, {
    trigger: '.o-switch-view.o-list',
    content: 'Open List View of Project Updates',
}, {
    trigger: '.o-back-button',
    content: 'Go back to the kanban view the project',
    extraTrigger: '.o-list-view',
}, {
    trigger: '.o-switch-view.o-graph',
    content: 'Open Graph View of Tasks',
}, ...openProjectUpdateAndReturnToTasks("Graph", "o-graph-view"), {
    trigger: '.o-switch-view.o-list',
    content: 'Open List View of Tasks',
    extraTrigger: '.o-graph-view',
}, ...openProjectUpdateAndReturnToTasks("List", "o-list-view"), {
    trigger: '.o-switch-view.o-pivot',
    content: 'Open Pivot View of Tasks',
}, ...openProjectUpdateAndReturnToTasks("Pivot", "o-pivot-view"), {
    trigger: '.o-switch-view.o-calendar',
    content: 'Open Calendar View of Tasks',
}, ...openProjectUpdateAndReturnToTasks("Calendar", "o-calendar-view"), {
    trigger: '.o-switch-view.o-activity',
    content: 'Open Activity View of Tasks',
}, ...openProjectUpdateAndReturnToTasks("Activity", "o-activity-view"),
]);
