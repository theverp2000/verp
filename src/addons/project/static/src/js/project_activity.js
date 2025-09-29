/** @verp-module **/

import ActivityView from '@mail/js/views/activity/activity_view';
import { ProjectControlPanel } from '@project/js/project_control_panel';
import viewRegistry from 'web.viewRegistry';

const ProjectActivityView = ActivityView.extend({
    config: Object.assign({}, ActivityView.prototype.config, {
        ControlPanel: ProjectControlPanel,
    }),
});

viewRegistry.add('projectActivity', ProjectActivityView);
