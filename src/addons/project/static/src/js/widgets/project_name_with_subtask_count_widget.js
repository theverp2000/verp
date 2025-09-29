/** @verp-module **/

import fieldRegistry from 'web.fieldRegistry';
import { FieldChar } from 'web.basicFields';

export const FieldNameWithSubTaskCount = FieldChar.extend({
    /**
     * @override
     */
    init() {
        this._super(...arguments);
        if (this.viewType === 'kanban') {
            // remove click event handler
            const {click, ...events} = this.events;
            this.events = events;
        }
    },

    _render: function () {
        let result = this._super.apply(this, arguments);
        if (this.recordData.allowSubtasks && this.recordData.childText) {
            this.$el.append($('<span>')
                    .addClass("text-muted ml-2")
                    .text(this.recordData.childText)
                    .css('font-weight', 'normal'));
        }
        return result;
    }
});

fieldRegistry.add('nameWithSubtaskCount', FieldNameWithSubTaskCount);
