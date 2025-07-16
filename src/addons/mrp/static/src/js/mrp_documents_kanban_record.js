/** @verp-module **/

/**
 * This file defines the KanbanRecord for the MRP Documents Kanban view.
 */

import KanbanRecord from 'web.KanbanRecord';

const MrpDocumentsKanbanRecord = KanbanRecord.extend({
    events: Object.assign({}, KanbanRecord.prototype.events, {
        'click .o-mrp-download': '_onDownload',
        'click .o-kanban-previewer': '_onImageClicked',
    }),

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * Handles the click on the download link to save the attachment locally.
     *
     * @private
     * @param {MouseEvent} ev
     */
    _onDownload(ev) {
        ev.preventDefault();
        window.location = `/web/content/${this.modelName}/${this.id}/datas?download=true`;
    },

    /**
     * Handles the click on the preview image. Triggers up `_onKanbanPreview` to
     * display `DocumentViewer`.
     *
     * @private
     * @param {MouseEvent} ev
     */
    _onImageClicked(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        this.triggerUp('kanbanImageClicked', {
            recordList: [this.recordData],
            recordID: this.recordData.id
        });
    },
});

export default MrpDocumentsKanbanRecord;
