/** @verp-module **/

import tour from 'web_tour.tour';

tour.register('projectSharingTour', {
    test: true,
    url: '/web',
}, [...tour.stepUtils.goToAppSteps("project.menuMainPm", 'Go to the Project App.'), {
    // an invisible element cannot be used as a trigger so this small hack is mandatory for the next step
    trigger: '.o-kanban-record:contains("Project Sharing")',
    run: function () {
        this.$anchor.find('.o-dropdown-kanban').css('visibility', 'visible');
    },
}, {
    trigger: '.oe-kanban-global-click :contains("Project Sharing") .o-dropdown-kanban',
    content: 'Open the project dropdown.'
}, {
    trigger: '.o-kanban-record:contains("Project Sharing") .dropdown-menu a:contains("Share")',
    content: 'Start editing the project.',
}, {
    trigger: 'div.o-field-radio[name="accessMode"] > div.o-radio-item > input[data-value="edit"]',
    content: 'Select "Edit" as Access mode in the "Share Project" wizard.',
}, {
    trigger: '.o-field-many2one[name="partnerIds"]',
    content: 'Select the user portal as collaborator to the "Project Sharing" project.',
    run: function (actions) {
        actions.text('Georges', this.$anchor.find('input'));
    },
}, {
    trigger: '.ui-autocomplete a:contains("Georges")',
    inModal: false,
}, {
    trigger: 'footer > button[name="actionSendMail"]',
    content: 'Confirm the project sharing with this portal user.',
}, {
    trigger: '.o-web-client',
    content: 'Go to project portal view to select the "Project Sharing" project',
    run: function () {
        window.location.href = window.location.origin + '/my/projects';
    },
}, {
    trigger: 'table > tbody > tr a:has(span:contains(Project Sharing))',
    content: 'Select "Project Sharing" project to go to project sharing feature for this project.',
}, {
    trigger: '.o-project-sharing',
    content: 'Wait the project sharing feature be loaded',
    run: function () {},
}, {
    trigger: 'button.o-kanban-button-new',
    content: 'Click "Create" button',
    run: 'click',
}, {
    trigger: '.o-kanban-quick-create .o-field-widget[name="label"]',
    content: 'Create Task',
    run: 'text Test Create Task',
}, {
    trigger: '.o-kanban-quick-create .o-kanban-edit',
    content: 'Go to the form view of this new task',
}, {
    trigger: 'div.o-statusbar-status[name="stageId"] button[aria-checked="false"]:contains(Done)',
    content: 'Change the stage of the task.',
}, {
    trigger: '.o-portal-chatter-composer-input .o-portal-chatter-composer-body textarea[name="message"]',
    content: 'Write a message in the chatter of the task',
    run: 'text I create a new task for testing purpose.',
}, {
    trigger: '.o-portal-chatter-composer-input .o-portal-chatter-composer-body button[data-action="/mail/chatterPost"]',
    content: 'Send the message',
}, {
    trigger: 'ol.breadcrumb > li.o-back-button > a:contains(Project Sharing)',
    content: 'Go back to the kanban view',
}, {
    trigger: '.o-filter-menu > button',
    content: 'click on filter menu in the search view',
}, {
    trigger: '.o-filter-menu > .dropdown-menu > .dropdown-item:first-child',
    content: 'click on the first item in the filter menu',
}, {
    trigger: '.o-group-by-menu > button',
    content: 'click on group by menu in the search view',
}, {
    trigger: '.o-group-by-menu > .dropdown-menu > .dropdown-item:first-child',
    content: 'click on the first item in the group by menu',
}, {
    trigger: '.o-favorite-menu > button',
    content: 'click on the favorite menu in the search view',
}, {
    trigger: '.o-favorite-menu .o-add-favorite > button',
    content: 'click to "save current search" button in favorite menu',
}, {
    trigger: 'button.o-switch-view.o-list',
    content: 'Go to the list view',
    run: 'click',
}]);

tour.register('portalProjectSharingTour', {
    test: true,
    url: '/my/projects',
}, [{
    trigger: 'table > tbody > tr a:has(span:contains(Project Sharing))',
    content: 'Select "Project Sharing" project to go to project sharing feature for this project.',
}, {
    trigger: '.o-project-sharing',
    content: 'Wait the project sharing feature be loaded',
    run: function () {},
}, {
    trigger: 'button.o-kanban-button-new',
    content: 'Click "Create" button',
    run: 'click',
}, {
    trigger: '.o-kanban-quick-create .o-field-widget[name="label"]',
    content: 'Create Task',
    run: 'text Test Create Task',
}, {
    trigger: '.o-kanban-quick-create .o-kanban-edit',
    content: 'Go to the form view of this new task',
}, {
    trigger: 'div.o-statusbar-status[name="stageId"] button[aria-checked="false"]:contains(Done)',
    content: 'Change the stage of the task.',
}, {
    trigger: '.o-portal-chatter-composer-input .o-portal-chatter-composer-body textarea[name="message"]',
    content: 'Write a message in the chatter of the task',
    run: 'text I create a new task for testing purpose.',
}, {
    trigger: '.o-portal-chatter-composer-input .o-portal-chatter-composer-body button[data-action="/mail/chatterPost"]',
    content: 'Send the message',
}, {
    trigger: 'ol.breadcrumb > li.o-back-button > a:contains(Project Sharing)',
    content: 'Go back to the kanban view',
}, {
    trigger: '.o-filter-menu > button',
    content: 'click on filter menu in the search view',
}, {
    trigger: '.o-filter-menu > .dropdown-menu > .dropdown-item:first-child',
    content: 'click on the first item in the filter menu',
}, {
    trigger: '.o-group-by-menu > button',
    content: 'click on group by menu in the search view',
}, {
    trigger: '.o-group-by-menu > .dropdown-menu > .dropdown-item:first-child',
    content: 'click on the first item in the group by menu',
}, {
    trigger: '.o-favorite-menu > button',
    content: 'click on the favorite menu in the search view',
}, {
    trigger: '.o-favorite-menu .o-add-favorite > button',
    content: 'click to "save current search" button in favorite menu',
}, {
    trigger: 'button.o-switch-view.o-list',
    content: 'Go to the list view',
    run: 'click',
}]);
