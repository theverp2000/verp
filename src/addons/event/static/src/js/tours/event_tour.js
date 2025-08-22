verp.define('event.eventSteps', function (require) {
"use strict";

var core = require('web.core');

var EventAdditionalTourSteps = core.Class.extend({

    _getWebsiteEventSteps: function () {
        return [false];
    },

});

return EventAdditionalTourSteps;

});

verp.define('event.eventTour', function (require) {
"use strict";

const {_t} = require('web.core');
const {Markup} = require('web.utils');

var tour = require('web_tour.tour');
var EventAdditionalTourSteps = require('event.eventSteps');

tour.register('eventTour', {
    url: '/web',
    rainbowManMessage: _t("Great! Now all you have to do is wait for your attendees to show up!"),
    sequence: 210,
}, [tour.stepUtils.showAppsMenuItem(), {
    trigger: '.o-app[data-menu-xmlid="event.eventMainMenu"]',
    content: Markup(_t("Ready to <b>organize events</b> in a few minutes? Let's get started!")),
    position: 'bottom',
    edition: 'enterprise',
}, {
    trigger: '.o-app[data-menu-xmlid="event.eventMainMenu"]',
    content: Markup(_t("Ready to <b>organize events</b> in a few minutes? Let's get started!")),
    edition: 'community',
}, {
    trigger: '.o-kanban-button-new',
    extraTrigger: '.o-event-kanban-view',
    content: Markup(_t("Let's create your first <b>event</b>.")),
    position: 'bottom',
    width: 175,
}, {
    trigger: '.o-event-form-view input[name="label"]',
    content: Markup(_t("This is the <b>name</b> your guests will see when registering.")),
    run: 'text Verp Experience 2020',
}, {
    trigger: '.o-event-form-view input[name="dateEnd"]',
    content: Markup(_t("When will your event take place? <b>Select</b> the start and end dates <b>and click Apply</b>.")),
    run: function () {
        $('input[name="dateBegin"]').val('09/30/2020 08:00:00').change();
        $('input[name="dateEnd"]').val('10/02/2020 23:00:00').change();
    },
}, {
    trigger: '.o-event-form-view div[name="eventTicketIds"] .o-field-x2many-list-row-add a',
    content: Markup(_t("Ticket types allow you to distinguish your attendees. Let's <b>create</b> a new one.")),
}, ...new EventAdditionalTourSteps()._getWebsiteEventSteps(), {
    trigger: '.o-event-form-view div[name="stageId"]',
    extraTrigger: 'div.o-form-buttons-view:not(.o-hidden)',
    content: _t("Now that your event is ready, click here to move it to another stage."),
    position: 'bottom',
}, {
    trigger: 'ol.breadcrumb li.breadcrumb-item:first',
    extraTrigger: '.o-event-form-view div[name="stageId"]',
    content: Markup(_t("Use the <b>breadcrumbs</b> to go back to your kanban overview.")),
    position: 'bottom',
    run: 'click',
}].filter(Boolean));

});
