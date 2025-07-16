/** @verp-module **/

import PopoverWidget from 'stock.popoverWidget';
import fieldRegistry from 'web.fieldRegistry';
import { _t } from 'web.core';


/**
 * Link to a Char field representing a JSON:
 * {
 *  'replan': <REPLAN_BOOL>, // Show the replan btn
 *  'color': '<COLOR_CLASS>', // Color Class of the icon (d-none to hide)
 *  'infos': [
 *      {'msg' : '<MESSAGE>', 'color' : '<COLOR_CLASS>'},
 *      {'msg' : '<MESSAGE>', 'color' : '<COLOR_CLASS>'},
 *      ... ]
 * }
 */
var MrpWorkorderPopover = PopoverWidget.extend({
    popoverTemplate: 'mrp.workorderPopover',
    title: _t('Scheduling Information'),

    _render: function () {
        this._super.apply(this, arguments);
        if (! this.$popover) {
          return;
        }
        var self = this;
        this.$popover.find('.action-replan-button').click(function (e) {
            self._onReplanClick(e);
        });
    },

    _onReplanClick:function (e) {
        var self = this;
        this._rpc({
            model: 'mrp.workorder',
            method: 'actionReplan',
            args: [[self.resId]]
        }).then(function () {
            self.triggerUp('reload');
        });
    },
});

fieldRegistry.add('mrpWorkorderPopover', MrpWorkorderPopover);

export default MrpWorkorderPopover;
