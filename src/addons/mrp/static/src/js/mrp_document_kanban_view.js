/** @verp-module **/

import KanbanView from 'web.KanbanView';
import MrpDocumentsKanbanController from '@mrp/js/mrp_documents_kanban_controller';
import MrpDocumentsKanbanRenderer from '@mrp/js/mrp_documents_kanban_renderer';
import viewRegistry from 'web.viewRegistry';

const MrpDocumentsKanbanView = KanbanView.extend({
    config: Object.assign({}, KanbanView.prototype.config, {
        Controller: MrpDocumentsKanbanController,
        Renderer: MrpDocumentsKanbanRenderer,
    }),
});

viewRegistry.add('mrpDocumentsKanban', MrpDocumentsKanbanView);

export default MrpDocumentsKanbanView;
