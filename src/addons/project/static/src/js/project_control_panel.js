/** @verp-module **/

import ControlPanel from 'web.ControlPanel';
import session from 'web.session';

export class ProjectControlPanel extends ControlPanel {

    constructor() {
        super(...arguments);
        this.showProjectUpdate = this.env.view.type === "form" || this.props.action.context.showProjectUpdate;
        this.projectId = this.showProjectUpdate ? this.props.action.context.activeId : false;
    }

    async willStart() {
        const promises = [];
        promises.push(super.willStart(...arguments));
        promises.push(this._loadWidgetData());
        return Promise.all(promises);
    }

    async willUpdateProps() {
        const promises = [];
        promises.push(super.willUpdateProps(...arguments));
        promises.push(this._loadWidgetData());
        return Promise.all(promises);
    }

    async _loadWidgetData() {
        if (this.showProjectUpdate) {
            this.data = await this.rpc({
                model: 'project.project',
                method: 'getLastUpdateOrDefault',
                args: [this.projectId],
            });
            this.isProjectUser = await session.userHasGroup('project.groupProjectUser');
        }
    }

    async onStatusClick(ev) {
        ev.preventDefault();
        await this.trigger('do-action', {
            action: "project.projectUpdateAllAction",
            options: {
                additionalContext: {
                    default_projectId: this.projectId,
                    activeId: this.projectId
                }
            }
        });
    }
}
