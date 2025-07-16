/** @verp-module **/

import AbstractField from 'web.AbstractField';
import { _t } from 'web.core';
import fields from 'web.basicFields';
import fieldUtils from 'web.fieldUtils';
import fieldRegistry from 'web.fieldRegistry';
import time from 'web.time';

/**
 * This widget is used to display the availability on a workorder.
 */
var SetBulletStatus = AbstractField.extend({
    // as this widget is based on hardcoded values, use it in another context
    // probably won't work
    // supportedFieldTypes: ['selection'],
    /**
     * @override
     */
    init: function () {
        this._super.apply(this, arguments);
        this.classes = this.nodeOptions && this.nodeOptions.classes || {};
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @private
     * @override
     */
    _renderReadonly: function () {
        this._super.apply(this, arguments);
        var bulletClass = this.classes[this.value] || 'default';
        if (this.value) {
            var title = this.value === 'waiting' ? _t('Waiting Materials') : '';
            this.$el.attr({'title': title, 'style': 'display:inline'});
            this.$el.removeClass('text-success text-danger text-default');
            this.$el.html($('<span>' + title + '</span>').addClass('badge badge-' + bulletClass));
        }
    }
});

var TimeCounter = fields.FieldFloatTime.extend({

    init: function () {
        this._super.apply(this, arguments);
        this.duration = this.record.data.duration;
    },

    willStart: function () {
        var self = this;
        var def = this._rpc({
            model: 'mrp.workcenter.productivity',
            method: 'searchRead',
            domain: [
                ['workorderId', '=', this.record.data.id],
                ['dateEnd', '=', false],
            ],
        }).then(function (result) {
            var currentDate = new Date();
            var duration = 0;
            if (result.length > 0) {
                duration += self._getDateDifference(time.autoStrToDate(result[0].dateStart), currentDate);
            }
            var minutes = duration / 60 >> 0;
            var seconds = duration % 60;
            self.duration += minutes + seconds / 60;
            if (self.mode === 'edit') {
                self.value = self.duration;
            }
        });
        return Promise.all([this._super.apply(this, arguments), def]);
    },

    destroy: function () {
        this._super.apply(this, arguments);
        clearTimeout(this.timer);
    },

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    isSet: function () {
        return true;
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Compute the difference between two dates.
     *
     * @private
     * @param {string} dateStart
     * @param {string} dateEnd
     * @returns {integer} the difference in millisecond
     */
    _getDateDifference: function (dateStart, dateEnd) {
        return moment(dateEnd).diff(moment(dateStart), 'seconds');
    },
    /**
     * @override
     */
    _renderReadonly: function () {
        if (this.record.data.isUserWorking) {
            this._startTimeCounter();
        } else {
            this._super.apply(this, arguments);
        }
    },
    /**
     * @private
     */
    _startTimeCounter: function () {
        var self = this;
        clearTimeout(this.timer);
        if (this.record.data.isUserWorking) {
            this.timer = setTimeout(function () {
                self.duration += 1/60;
                self._startTimeCounter();
            }, 1000);
        } else {
            clearTimeout(this.timer);
        }
        this.$el.text(fieldUtils.format.floatTime(this.duration));
    },
});

var FieldEmbedURLViewer = fields.FieldChar.extend({

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    init: function () {
        this._super.apply(this, arguments);
        this.page = 1;
        this.srcDirty = false;
    },

    /**
     * force to set 'src' for embed iframe viewer when its value has changed
     *
     * @override
     *
     */
    reset: function () {
        this._super.apply(this, arguments);
        this._updateIframePreview();
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Initializes and returns an iframe for the viewer
     *
     * @private
     * @returns {jQueryElement}
     */
    _prepareIframe: function () {
        return $('<iframe>', {
            class: 'o-embed-iframe d-none',
            allowfullscreen: true,
        });
    },

    /**
     * @override
     * @private
     */
    _renderEdit: function () {
        if (!this.$('iframe.o-embed-iframe').length) {
            this.$input = this.$el;
            this.setElement(this.$el.wrap('<div class="o-embed-url-viewer o-field-widget"/>').parent());
            this.$el.append(this._prepareIframe());
        }
        this._prepareInput(this.$input);

        // Do not set iframe src if widget is invisible
        if (!this.record.evalModifiers(this.attrs.modifiers).invisible) {
            this._updateIframePreview();
        } else {
            this.srcDirty = true;
        }
    },
    /**
     * @override
     * @private
     */
    _renderReadonly: function () {
        if (!this.$('iframe.o-embed-iframe').length) {
            this.$el.addClass('o-embed-url-viewer');
            this.$el.append(this._prepareIframe());
        }
        this._updateIframePreview();
    },
    /**
     * Set the associated src for embed iframe viewer
     *
     * @private
     * @returns {string} source of the google slide
     */
    _getEmbedSrc: function () {
        var src = false;
        if (this.value) {
            // check given google slide url is valid or not
            var googleRegExp = /(^https:\/\/docs.google.com).*(\/d\/e\/|\/d\/)([A-Za-z0-9-_]+)/;
            var google = this.value.match(googleRegExp);
            if (google && google[3]) {
                src = 'https://docs.google.com/presentation' + google[2] + google[3] + '/preview?slide=' + this.page;
            }
        }
        return src || this.value;
    },
    /**
     * update iframe attrs
     *
     * @private
     */
    _updateIframePreview: function () {
        var $iframe = this.$('iframe.o-embed-iframe');
        var src = this._getEmbedSrc();
        $iframe.toggleClass('d-none', !src);
        if (src) {
            $iframe.attr('src', src);
        } else {
            $iframe.removeAttr('src');
        }
    },
    /**
     * Listen to modifiers updates to and only render iframe when it is necessary
     *
     * @override
     */
    updateModifiersValue: function () {
        this._super.apply(this, arguments);
        if (!this.attrs.modifiersValue.invisible && this.srcDirty) {
            this._updateIframePreview();
            this.srcDirty = false;
        }
    },
});


fieldRegistry
    .add('bulletState', SetBulletStatus)
    .add('mrpTimeCounter', TimeCounter)
    .add('embedViewer', FieldEmbedURLViewer);

fieldUtils.format.mrpTimeCounter = fieldUtils.format.floatTime;

export default FieldEmbedURLViewer;
