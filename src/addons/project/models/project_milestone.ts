import { _Date, api, Fields } from "../../../core";
import { MetaModel, Model } from "../../../core/models"

@MetaModel.define()
class ProjectMilestone extends Model {
    static _module = module;
    static _name = 'project.milestone';
    static _description = "Project Milestone";
    static _parents = ['mail.thread'];
    static _order = 'deadline, isReached desc, label';

    async _getDefaultProjectId() {
        return this.env.context['default_projectId'] || this.env.context['activeId'];
    }

    static label = Fields.Char({required: true});
    static projectId = Fields.Many2one('project.project', {required: true, default: self => self._getDefaultProjectId()});
    static deadline = Fields.Date({tracking: true});
    static isReached = Fields.Boolean({string: "Reached", default: false});
    static reachedDate = Fields.Date({compute: '_computeReachedDate', store: true});

    // computed non-stored fields
    static isDeadlineExceeded = Fields.Boolean({compute: "_computeIsDeadlineExceeded"});
    static isDeadlineFuture = Fields.Boolean({compute: "_computeIsDeadlineFuture"});

    @api.depends('isReached')
    async _computeReachedDate() {
        for (const ms of this) {
            await ms.set('reachedDate', await ms.isReached && await _Date.contextToday(this));
        }
    }

    @api.depends('isReached', 'deadline')
    async _computeIsDeadlineExceeded() {
        const today = await _Date.contextToday(this);
        for (const ms of this) {
            await ms.set('isDeadlineExceeded', !await ms.isReached && await ms.deadline && await ms.deadline < today);
        }
    }

    @api.depends('deadline')
    async _computeIsDeadlineFuture() {
        for (const ms of this) {
            await ms.set('isDeadlineFuture', await ms.deadline && await ms.deadline > await _Date.contextToday(this));
        }
    }

    async toggleIsReached(isReached) {
        this.ensureOne();
        await this.update({'isReached': isReached});
        return this._getData();
    }

    @api.model()
    _getFieldsToExport() {
        return ['id', 'label', 'deadline', 'isReached', 'reachedDate', 'isDeadlineExceeded', 'isDeadlineFuture'];
    }

    async _getData() {
        this.ensureOne();
        const res = {}
        for (const field of this._getFieldsToExport()) {
            res[field] = await this[field];
        }
        return res;
    }

    async _getDataList() {
        return this.map(ms => ms._getData());
    }
}