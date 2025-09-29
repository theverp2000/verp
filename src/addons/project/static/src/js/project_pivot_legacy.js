/** @verp-module **/

import PivotView from 'web.PivotView';
import { ProjectControlPanel } from '@project/js/project_control_panel';
import viewRegistry from 'web.viewRegistry';

export const ProjectPivotView = PivotView.extend({
  config: Object.assign({}, PivotView.prototype.config, {
    ControlPanel: ProjectControlPanel,
  }),
});

viewRegistry.add('projectPivot', ProjectPivotView);
