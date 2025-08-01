/** @verp-module **/

import { _t, qweb } from 'web.core';
import fileUploadMixin from 'web.fileUploadMixin';
import DocumentViewer from '@mrp/js/mrp_documents_document_viewer';

const MrpDocumentsControllerMixin = Object.assign({}, fileUploadMixin, {
    events: {
        'click .o-mrp-documents-kanban-upload': '_onClickMrpDocumentsUpload',
    },
    customEvents: Object.assign({}, fileUploadMixin.customEvents, {
        kanbanImageClicked: '_onKanbanPreview',
        uploadFile: '_onUploadFile',
    }),

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Called right after the reload of the view.
     */
    async reload() {
        await this._renderFileUploads();
    },

    /**
     * @override
     * @param {jQueryElement} $node
     */
    renderButtons($node) {
        if (this.isActionEnabled('edit')) {
            this.$buttons = $(qweb.render('MrpDocumentsKanbanView.buttons'));
            this.$buttons.appendTo($node);
        }
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    _getFileUploadRoute() {
        return '/mrp/uploadAttachment';
    },

    /**
     * @override
     * @param {integer} param0.recordId
     */
    _makeFileUploadFormDataKeys() {
        const context = this.model.get(this.handle, { raw: true }).getContext();
        return {
            resId: context.default_resId,
            resModel: context.default_resModel,
        };
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     */
    _onClickMrpDocumentsUpload() {
        const $uploadInput = $('<input>', {
            type: 'file',
            name: 'files[]',
            multiple: 'multiple'
        });
        $uploadInput.on('change', async ev => {
            await this._uploadFiles(ev.target.files);
            $uploadInput.remove();
        });
        $uploadInput.click();
    },

    /**
     * Handles custom event to display the document viewer.
     *
     * @private
     * @param {VerpEvent} ev
     * @param {integer} ev.data.recordID
     * @param {Array<Object>} ev.data.recordList
     */
    _onKanbanPreview(ev) {
        ev.stopPropagation();
        const documents = ev.data.recordList;
        const documentID = ev.data.recordID;
        const documentViewer = new DocumentViewer(this, documents, documentID);
        documentViewer.appendTo(this.$('.o-mrp-documents-kanban-view'));
    },

    /**
     * Specially created to call `_uploadFiles` method from tests.
     *
     * @private
     * @param {VerpEvent} ev
     */
    async _onUploadFile(ev) {
        await this._uploadFiles(ev.data.files);
    },

    /**
     * @override
     * @param {Object} param0
     * @param {XMLHttpRequest} param0.xhr
     */
    _onUploadLoad({ xhr }) {
        const result = xhr.status === 200
            ? JSON.parse(xhr.response)
            : {
                error: _.str.sprintf(_t("status code: %s, message: %s"), xhr.status, xhr.response)
            };
        if (result.error) {
            this.displayNotification({ title: _t("Error"), message: result.error, sticky: true });
        }
        fileUploadMixin._onUploadLoad.apply(this, arguments);
    },
});

export default MrpDocumentsControllerMixin;
