verp.define('website_profile.websiteProfile', function (require) {
'use strict';

var publicWidget = require('web.public.widget');
var wysiwygLoader = require('web_editor.loader');

publicWidget.registry.websiteProfile = publicWidget.Widget.extend({
    selector: '.o-wprofile-email-validation-container',
    readEvents: {
        'click .send-validation-email': '_onSendValidationEmailClick',
        'click .validated-email-close': '_onCloseValidatedEmailClick',
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------
    /**
     * @private
     * @param {Event} ev
     */
    _onSendValidationEmailClick: function (ev) {
        ev.preventDefault();
        var self = this;
        var $element = $(ev.currentTarget);
        this._rpc({
            route: '/profile/sendValidationEmail',
            params: {'redirectUrl': $element.data('redirectUrl')},
        }).then(function (data) {
            if (data) {
                self.$('button.validationEmailClose').click();
            }
        });
    },

    /**
     * @private
     */
    _onCloseValidatedEmailClick: function () {
        this._rpc({
            route: '/profile/validateEmail/close',
        });
    },
});

publicWidget.registry.websiteProfileEditor = publicWidget.Widget.extend({
    selector: '.o-wprofile-editor-form',
    readEvents: {
        'click .o-forum-profile-pic-edit': '_onEditProfilePicClick',
        'change .o-forum-file-upload': '_onFileUploadChange',
        'click .o-forum-profile-pic-clear': '_onProfilePicClearClick',
    },

    /**
     * @override
     */
    start: async function () {
        var def = this._super.apply(this, arguments);
        if (this.editableMode) {
            return def;
        }

        var $textarea = this.$('textarea.o-wysiwyg-loader');

        this._wysiwyg = await wysiwygLoader.loadFromTextarea(this, $textarea[0], {
            recordInfo: {
                context: this._getContext(),
                resModel: 'res.users',
                resId: parseInt(this.$('input[name=userId]').val()),
            },
            resizable: true,
            userGeneratedContent: true,
        });

        return Promise.all([def]);
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     * @param {Event} ev
     */
    _onEditProfilePicClick: function (ev) {
        ev.preventDefault();
        $(ev.currentTarget).closest('form').find('.o-forum-file-upload').trigger('click');
    },
    /**
     * @private
     * @param {Event} ev
     */
    _onFileUploadChange: function (ev) {
        if (!ev.currentTarget.files.length) {
            return;
        }
        var $form = $(ev.currentTarget).closest('form');
        var reader = new window.FileReader();
        reader.readAsDataURL(ev.currentTarget.files[0]);
        reader.onload = function (ev) {
            $form.find('.o-forum-avatar-img').attr('src', ev.target.result);
        };
        $form.find('#forumClearImage').remove();
    },
    /**
     * @private
     * @param {Event} ev
     */
    _onProfilePicClearClick: function (ev) {
        var $form = $(ev.currentTarget).closest('form');
        $form.find('.o-forum-avatar-img').attr('src', '/web/static/img/placeholder.png');
        $form.append($('<input/>', {
            name: 'clearImage',
            id: 'forumClearImage',
            type: 'hidden',
        }));
    },
});

return publicWidget.registry.websiteProfile;

});
