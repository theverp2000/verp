verp.define('event.fieldIconSelection', function (require) {
"use strict";

var core = require('web.core');
var registry = require('web.fieldRegistry');
var AbstractField = require('web.AbstractField');
var QWeb = core.qweb;

var IconSelection = AbstractField.extend({
    supportedFieldTypes: ['char', 'text', 'selection'],

    /**
    * @override
    * @private
    */
    _render: function () {
        this._super.apply(this, arguments);
        this.icon = this.nodeOptions[this.value];
        this.title = this.value.charAt(0).toUpperCase() + this.value.slice(1);
        this.$el.empty().append(QWeb.render('event.IconSelection', {'widget': this}));
    },

});

registry.add('iconSelection', IconSelection);

return IconSelection;

});
