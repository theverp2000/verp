import { _Date, api, Fields } from "../../../core";
import { _super, MetaModel, Model } from "../../../core/models"
import { expression } from "../../../core/osv";
import { _f, addDate, bool, formatLang, len } from "../../../core/tools";

export const STATUS_COLOR = {
    'onTrack': 20,  // green / success
    'atRisk': 2,  // orange
    'offTrack': 23,  // red / danger
    'onHold': 4,  // light blue
    false: 0,  // default grey -- for studio
}

@MetaModel.define()
class ProjectUpdate extends Model {
    static _module = module;
    static _name = 'project.update';
    static _description = 'Project Update';
    static _order = 'date desc';
    static _parents = ['mail.thread.cc', 'mail.activity.mixin'];

    async defaultGet(fields) {
        const result = await _super(ProjectUpdate, this).defaultGet(fields);
        if (fields.includes('projectId') && !result['projectId']) {
            result['projectId'] = this.env.context['activeId'];
        }
        if (result['projectId']) {
            const project = this.env.items('project.project').browse(result['projectId']);
            if (fields.includes('progress') && !result['progress']) {
                result['progress'] = await (await project.lastUpdateId).progress;
            }
            if (fields.includes('description') && !result['description']) {
                result['description'] = await this._buildDescription(project);
            }
            if (fields.includes('status') && !result['status']) {
                result['status'] = await project.lastUpdateStatus;
            }
        }
        return result;
    }

    static label = Fields.Char("Title", {required: true, tracking: true});
    static status = Fields.Selection({selection: [
        ['onTrack', 'On Track'],
        ['atRisk', 'At Risk'],
        ['offTrack', 'Off Track'],
        ['onHold', 'On Hold']
    ], required: true, tracking: true});
    static color = Fields.Integer({compute: '_computeColor'});
    static progress = Fields.Integer({tracking: true});
    static progressPercentage = Fields.Float({compute: '_computeProgressPercentage'});
    static userId = Fields.Many2one('res.users', {string: 'Author', required: true, default: self => self.env.user()});
    static description = Fields.Html();
    static date = Fields.Date({default: self => _Date.contextToday(self), tracking: true});
    static projectId = Fields.Many2one('project.project', {required: true});
    static nameCropped = Fields.Char({compute: "_computeNameCropped"});

    @api.depends('status')
    async _computeColor() {
        for (const update of this) {
            await update.set('color', STATUS_COLOR[await update.status]);
        }
    }

    @api.depends('progress')
    async _computeProgressPercentage() {
        for (const update of this) {
            await update.set('progressPercentage', await update.progress / 100);
        }
    }

    @api.depends('label')
    async _computeNameCropped() {
        for (const update of this) {
            const label = await update.label;
            await update.set('nameCropped', len(label) > 60 ? (label.slice(0, 57) + '...') : label);
        }
    }

    // ---------------------------------
    // ORM Override
    // ---------------------------------
    @api.model()
    async create(vals) {
        const update = await _super(ProjectUpdate, this).create(vals);
        await (await (await update.projectId).sudo()).set('lastUpdateId', update);
        return update;
    }

    async unlink() {
        const projects = await this['projectId'];
        const res = await _super(ProjectUpdate, this).unlink();
        for (const project of projects) {
            await project.set('lastUpdateId', await this.search([['projectId', "=", project.id]], {order: "date desc", limit: 1}));
        }
        return res;
    }

    // ---------------------------------
    // Build default description
    // ---------------------------------
    @api.model()
    async _buildDescription(project) {
        const template = await this.env.ref('project.projectUpdateDefaultDescription');
        return template._render(await this._getTemplateValues(project), 'ir.qweb');
    }

    @api.model()
    async _getTemplateValues(project) {
        const milestones = await this._getMilestoneValues(project);
        return {
            'user': await this.env.user(),
            'project': project,
            'showActivities': milestones['show_section'],
            'milestones': milestones,
            'formatLang': (value, digits) => formatLang(this.env, value, {digits}),
        }
    }

    @api.model()
    async _getMilestoneValues(project) {
        const Milestone = this.env.items('project.milestone');
        const listMilestones = await (await Milestone.search(
            [['projectId', '=', project.id],
             '|', ['deadline', '<', addDate(await _Date.contextToday(this), {years: 1})], ['deadline', '=', false]]))._getDataList();
        const updatedMilestones = await this._getLastUpdatedMilestone(project);
        let domain = [['projectId', '=', project.id]];
        const createdAt = await (await project.lastUpdateId).createdAt;
        if (createdAt) {
            domain = expression.AND([domain, [['createdAt', '>', createdAt]]]);
        }
        const createdMilestones = await (await Milestone.search(domain))._getDataList();
        return {
            'showSection': (bool(listMilestones) || bool(updatedMilestones) || bool(createdMilestones)) && true || false,
            'list': listMilestones,
            'updated': updatedMilestones,
            'lastUpdateDate': createdAt || null,
            'created': createdMilestones,
        }
    }

    @api.model()
    async _getLastUpdatedMilestone(project) {
        let query = `
            SELECT DISTINCT pm.id as "milestoneId",
                            pm.deadline as deadline,
                            FIRST_VALUE("oldValueDatetime"::date) OVER "wPartition" as "oldValue",
                            pm.deadline as "newValue"
                       FROM "mailMessage" mm
                 INNER JOIN "mailTrackingValue" mtv
                         ON mm.id = mtv."mailMessageId"
                 INNER JOIN "irModelFields" imf
                         ON mtv.field = imf.id
                        AND imf.model = 'project.milestone'
                        AND imf.label = 'deadline'
                 INNER JOIN "projectMilestone" pm
                         ON mm."resId" = pm.id
                      WHERE mm.model = 'project.milestone'
                        AND mm."messageType" = 'notification'
                        AND pm."projectId" = {projectId}
        `;
        const createdAt = await (await project.lastUpdateId).createdAt
        if (createdAt) {
            query = query + "AND mm.date > {lastUpdateDate}";
        }
        query = query + `
                     WINDOW "wPartition" AS (
                             PARTITION BY pm.id
                             ORDER BY mm.date ASC
                            )
                   ORDER BY pm.deadline ASC
                   LIMIT 1;
        `;
        const queryParams = {'projectId': project.id}
        if (createdAt) {
            queryParams['lastUpdateDate'] = createdAt;
        }
        const results = await this.env.cr.execute(_f(query, queryParams));
        const mappedResult = Object.fromEntries(results.map(res => [res['milestoneId'], {'newValue': res['newValue'], 'oldValue': res['oldValue']}]))
        const milestones = await this.env.items('project.milestone').search([['id', 'in', Object.keys(mappedResult)]]);
        return milestones.map(async (milestone) => ({
            ...await milestone._getData(),
            'newValue': mappedResult[milestone.id]['newValue'],
            'oldValue': mappedResult[milestone.id]['oldValue'],
        }));
    }
}