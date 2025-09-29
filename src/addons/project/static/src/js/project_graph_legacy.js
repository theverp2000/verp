/** @verp-module **/

import GraphView from 'web.GraphView';
import { ProjectControlPanel } from '@project/js/project_control_panel';
import viewRegistry from 'web.viewRegistry';

export const ProjectGraphView = GraphView.extend({
  config: Object.assign({}, GraphView.prototype.config, {
    ControlPanel: ProjectControlPanel,
  }),
});

viewRegistry.add('projectGraph', ProjectGraphView);
