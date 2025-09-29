/** @verp-module **/

import { ControlPanel } from "@web/search/control_panel/control_panel";
import { useService } from "@web/core/utils/hooks";

export class ProjectControlPanel extends ControlPanel {
    constructor() {
        super(...arguments);
        this.orm = useService("orm");
        this.user = useService("user");
        const { activeId, showProjectUpdate } = this.env.searchModel.globalContext;
        this.showProjectUpdate = this.env.config.viewType === "form" || showProjectUpdate;
        this.projectId = this.showProjectUpdate ? activeId : false;
    }

    async willStart() {
        const proms = [super.willStart(...arguments)];
        if (this.showProjectUpdate) {
            proms.push(this.loadData());
        }
        await Promise.all(proms);
    }

    async willUpdateProps() {
        const proms = [super.willUpdateProps(...arguments)];
        if (this.showProjectUpdate) {
            proms.push(this.loadData());
        }
        await Promise.all(proms);
    }

    async loadData() {
        const [data, isProjectUser] = await Promise.all([
            this.orm.call("project.project", "getLastUpdateOrDefault", [this.projectId]),
            this.user.hasGroup("project.groupProjectUser"),
        ]);
        this.data = data;
        this.isProjectUser = isProjectUser;
    }

    async onStatusClick(ev) {
        ev.preventDefault();
        this.actionService.doAction("project.projectUpdateAllAction", {
            additionalContext: {
                default_projectId: this.projectId,
                activeId: this.projectId,
            },
        });
    }
}

ProjectControlPanel.template = "project.ProjectControlPanel";
