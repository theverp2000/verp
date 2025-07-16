/** @verp-module **/

import { FieldOne2Many } from 'web.relationalFields';
import ListRenderer from 'web.ListRenderer';
import fieldRegistry from 'web.fieldRegistry';
import {_t} from 'web.core';

//----------------------------------------------------

var MrpFieldOne2ManyWithCopyListRenderer = ListRenderer.extend({

    /**
     * @override
     */
    init: function (parent, state, params) {
        this._super.apply(this, arguments);
        this.creates.push({
            string: parent.nodeOptions.copyText,
            context: '',
        });
    },
});

var MrpFieldOne2ManyWithCopy = FieldOne2Many.extend({

    /**
     * @override
     */
    init: function (parent, name, record, options) {
        this._super.apply(this, arguments);
        this.nodeOptions = _.defaults(this.nodeOptions, {
            copyText: _t('Copy Existing Operations'),
        });
    },
    /**
     * @override
     */
    _getRenderer: function () {
        if (this.view.arch.tag === 'tree') {
            return MrpFieldOne2ManyWithCopyListRenderer;
        }
        return this._super.apply(this, arguments);
    },
    /**
     * @override
     */
    _openFormDialog: function (params) {
        if (params.context === undefined) {
            return this._super.apply(this, arguments);
        }
        const parent = this.getParent();
        const parentIsNew = parent.state.resId === undefined;
        const parentHasChanged = parent.state.isDirty();
        if (parentIsNew || parentHasChanged) {
            this.displayNotification({ message: _t('Please click on the "save" button first'), type: 'danger' });
            return;
        }
        this.doAction({
            name: _t('Select Operations to Copy'),
            type: 'ir.actions.actwindow',
            resModel: 'mrp.routing.workcenter',
            views: [[false, 'list'], [false, 'form']],
            domain: ['|', ['bomId', '=', false], ['bomId.active', '=', true]],
            context: {
                treeViewRef: 'mrp.mrpRoutingWorkcenterCopyToBomTreeView',
                bomId: this.recordData.id,
            },
        });

    },
});

fieldRegistry.add('mrpOne2manyWithCopy', MrpFieldOne2ManyWithCopy);

export default MrpFieldOne2ManyWithCopy;
