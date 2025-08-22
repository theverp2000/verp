import { api, Fields } from "../../../core";
import { _super, MetaModel, TransientModel } from "../../../core/models"

@MetaModel.define()
class ResConfigSettings extends TransientModel {
    static _module = module;
    static _parents = 'res.config.settings';

    static moduleProjectForecast = Fields.Boolean({string: "Planning"});
    static moduleHrTimesheet = Fields.Boolean({string: "Task Logs"});
    static groupSubtaskProject = Fields.Boolean("Sub-tasks", {impliedGroup: "project.groupSubtaskProject"});
    static groupProjectRating = Fields.Boolean("Customer Ratings", {impliedGroup: 'project.groupProjectRating'});
    static groupProjectStages = Fields.Boolean("Project Stages", {impliedGroup: "project.groupProjectStages"});
    static groupProjectRecurringTasks = Fields.Boolean("Recurring Tasks", {impliedGroup: "project.groupProjectRecurringTasks"});
    static groupProjectTaskDependencies = Fields.Boolean("Task Dependencies", {impliedGroup: "project.groupProjectTaskDependencies"});

    @api.model()
    async _getBasicProjectDomain() {
        return [];
    }

    async setValues() {
        // Ensure that settings on existing projects match the above fields
        const projects = await this.env.items("project.project").search;([]);
        const basicProjects = await projects.filteredDomain(await this._getBasicProjectDomain());

        const features = {
            // key: [configFlag, isGlobal], value: projectFlag
            [String(["groupProjectRating", true])]: "rating_aCctive",
            [String(["groupProjectRecurringTasks", true])]: "allowRecurringTasks",
            [String(["groupSubtaskProject", false])]: "allowSubtasks",
            [String(["groupProjectTaskDependencies", false])]: "allowTaskDependencies",
        }

        for (const [key, projectFlag] of Object.entries(features)) {
            const [configFlag, isGlobal] = key.split(',');
            const configFlagGlobal = `project.${configFlag}`;
            const configFeatureEnabled = await this[configFlag];
            if (await this.userHasGroups(configFlagGlobal) != configFeatureEnabled) {
                if (configFeatureEnabled && !isGlobal) {
                    await basicProjects.set(projectFlag, configFeatureEnabled);
                }
                else {
                    await projects.set(projectFlag, configFeatureEnabled);
                }
            }
        }

        // Hide the task dependency changes subtype when the dependency setting is disabled
        const taskDepChangeSubtypeId = await this.env.ref('project.mtTaskDependencyChange');
        const projectTaskDepChangeSubtypeId = await this.env.ref('project.mtProjectTaskDependencyChange');
        if (await taskDepChangeSubtypeId.hidden != (! await this['groupProjectTaskDependencies'])) {
            await taskDepChangeSubtypeId.set('hidden', !await this['groupProjectTaskDependencies']);
            await projectTaskDepChangeSubtypeId.set('hidden', !await this['groupProjectTaskDependencies']);
        }
        // Hide Project Stage Changed mail subtype according to the settings
        const projectStageChangeMailType = await this.env.ref('project.mtProjectStageChange');
        if (await projectStageChangeMailType.hidden == await this['groupProjectStages']) {
            await projectStageChangeMailType.set('hidden', !await this['groupProjectStages']);
        }

        await _super(ResConfigSettings, this).setValues();
    }
}
