/** @verp-module **/

import { FieldFloat } from 'web.basicFields';
import fieldRegistry from 'web.fieldRegistry';
import fieldUtils from 'web.fieldUtils';
/**
 * This widget is used to display alongside the total quantity to consume of a production order,
 * the exact quantity that the worker should consume depending on the BoM. Ex:
 * 2 components to make 1 finished product.
 * The production order is created to make 5 finished product and the quantity producing is set to 3.
 * The widget will be '3.000 / 5.000'.
 */
const MrpShouldConsume = FieldFloat.extend({
    /**
     * @override
     */
    init: function (parent, name, params) {
        this._super.apply(this, arguments);
        this.displayShouldConsume = !['done', 'draft', 'cancel'].includes(params.data.state);
        this.shouldConsumeQty = fieldUtils.format.float(params.data.shouldConsumeQty, params.fields.shouldConsumeQty, this.nodeOptions);
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Prefix the classic float field (this.$el) by a static value.
     *
     * @private
     * @param {float} [value] quantity to display before the input `el`
     * @param {bool} [edit] whether the field will be editable or readonly
     */
    _addShouldConsume: function (value, edit=false) {
        const $toConsumeContainer = $('<span class="o-should-consume"/>');
        if (edit) {
            $toConsumeContainer.addClass('o-row');
        }
        $toConsumeContainer.text(value + ' / ');
        this.setElement(this.$el.wrap($toConsumeContainer).parent());
    },

    /**
     * @private
     * @override
     */
    _renderEdit: function () {
        if (this.displayShouldConsume) {
            if (!this.$el.text().includes('/')) {
                this.$input = this.$el;
                this._addShouldConsume(this.shouldConsumeQty, true);
            }
            this._prepareInput(this.$input);
        } else {
            this._super.apply(this);
        }
    },
    /**
     * Resets the content to the formated value in readonly mode.
     *
     * @override
     * @private
     */
    _renderReadonly: function () {
        this.$el.text(this._formatValue(this.value));
        if (this.displayShouldConsume) {
            this._addShouldConsume(this.shouldConsumeQty);
        }
    },
});

fieldRegistry.add('mrpShouldConsume', MrpShouldConsume);

export default {
    MrpShouldConsume: MrpShouldConsume,
};
