/** @verp-module */

import tour from 'web_tour.tour';

tour.register('personalStageTour', {
    test: true,
    url: '/web',
},
[tour.stepUtils.showAppsMenuItem(), {
    trigger: '.o-app[data-menu-xmlid="project.menuMainPm"]',
}, {
    content: "Open Pig Project",
    trigger: '.o-kanban-record:contains("Pig")',
}, {
    // Default is grouped by stage, user should not be able to create/edit a column
    content: "Check that there is no create column",
    trigger: "body:not(.o-column-quick-create)",
    run: function () {},
}, {
    content: "Check that there is no create column",
    trigger: "body:not(.o-column-edit)",
    run: function () {},
}, {
    content: "Check that there is no create column",
    trigger: "body:not(.o-column-delete)",
    run: function () {},
}, {
    content: "Go to my tasks", // My tasks is grouped by personal stage by default
    trigger: 'a[data-menu-xmlid="project.menuProjectManagement"]',
}, {
    content: "Check that we can create a new stage",
    trigger: '.o-column-quick-create .o-quick-create-folded'
}, {
    content: "Create a new personal stage",
    trigger: 'input[placeholder="Column title"]',
    run: 'text Never',
}, {
    content: "Confirm create",
    trigger: '.o-kanban-add',
}, {
    content: "Check that column exists",
    trigger: '.o-kanban-header:contains("Never")',
    run: function () {},
}, {
    content: 'Open column edit dropdown',
    trigger: '.o-kanban-header:eq(0)',
    run: function () {
        $('.o-kanban-config.dropdown .dropdown-toggle').eq(0).click();
    },
}, {
    content: "Try editing inbox",
    trigger: ".dropdown-item.o-column-edit",
}, {
    content: "Change title",
    trigger: 'input.o-field-char[name="label"]',
    run: 'text  (Todo)',
}, {
    content: "Save changes",
    trigger: '.btn-primary:contains("Save")',
}, {
    content: "Check that column was updated",
    trigger: '.o-kanban-header:contains("Todo")',
}]);
