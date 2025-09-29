/** @verp-module **/

import { qweb } from 'web.core';
import fieldRegistry from 'web.fieldRegistry';
import { FieldSelection } from 'web.relationalFields';

/**
 * options :
 * `colorField` : The field that must be use to color the bubble. It must be in the view. (from 0 to 11). Default : grey.
 */
export const StatusWithColor = FieldSelection.extend({
    _template: 'project.statusWithColor',

    /**
     * @override
     */
    init: function () {
        this._super.apply(this, arguments);
        this.color = this.recordData[this.nodeOptions.colorField];
        if (this.nodeOptions.noQuickEdit) {
            this._canQuickEdit = false;
        }
    },

    /**
     * @override
     */
    _renderReadonly() {
        this._super.apply(this, arguments);
        if (this.value) {
            this.$el.addClass('o-status-with-color');
            this.$el.prepend(qweb.render(this._template, {
                color: this.color,
            }));
        }
    },
});

fieldRegistry.add('statusWithColor', StatusWithColor);
