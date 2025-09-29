/** @verp-module **/

import KanbanController from 'web.KanbanController';
import KanbanRenderer from 'web.KanbanRenderer';
import KanbanView from 'web.KanbanView';
import KanbanColumn from 'web.KanbanColumn';
import KanbanRecord from 'web.KanbanRecord';
import KanbanModel from 'web.KanbanModel';
import viewRegistry from 'web.viewRegistry';
import { ProjectControlPanel } from '@project/js/project_control_panel';
import viewUtils from 'web.viewUtils';
import { Domain } from '@web/core/domain';
import viewDialogs from 'web.viewDialogs';
import core from 'web.core';

const _t = core._t;

// PROJECTS

const ProjectProjectKanbanRecord = KanbanRecord.extend({
    /**
     * @override
     * @private
     */
    _openRecord: function () {
        const kanbanBoxesElement = this.el.querySelectorAll('.o-project-kanban-boxes a');
        if (this.selectionMode !== true && kanbanBoxesElement.length) {
            kanbanBoxesElement[0].click();
        } else {
            this._super.apply(this, arguments);
        }
    },
    /**
     * @override
     * @private
     */
    _onManageTogglerClicked: function (event) {
        this._super.apply(this, arguments);
        const thisSettingToggle = this.el.querySelector('.o-kanban-manage-toggle-button');
        this.el.parentNode.querySelectorAll('.o-kanban-manage-toggle-button.show').forEach(el => {
            if (el !== thisSettingToggle) {
                el.classList.remove('show');
            }
        });
        thisSettingToggle.classList.toggle('show');
    },
});

const ProjectProjectKanbanRenderer = KanbanRenderer.extend({
    config: _.extend({}, KanbanRenderer.prototype.config, {
        KanbanRecord: ProjectProjectKanbanRecord,
    }),
});

const ProjectProjectKanbanView = KanbanView.extend({
    config: Object.assign({}, KanbanView.prototype.config, {
        Renderer: ProjectProjectKanbanRenderer,
    })
});

viewRegistry.add('projectProjectKanban', ProjectProjectKanbanView);

// TASKS

const ProjectTaskKanbanColumn = KanbanColumn.extend({
    /**
     * @override
     * @private
     */
    _onDeleteColumn: function (event) {
        if (this.groupedBy === 'stageId') {
            event.preventDefault();
            this.triggerUp('kanbanColumnDeleteWizard');
        } else {
            this._super(...arguments);
        }
    },

    /**
     * Open alternative view when editing personal stages.
     *
     * @private
     * @override
     */
    _onEditColumn: function (event) {
        if (this.groupedBy !== 'personalStageTypeIds') {
            this._super(...arguments);
            return;
        }
        event.preventDefault();
        const context = Object.assign({}, this.getSession().userContext, {
            formViewRef: 'project.personalTaskTypeEdit',
        });
        new viewDialogs.FormViewDialog(this, {
            resModel: this.relation,
            resId: this.id,
            context: context,
            title: _t("Edit Personal Stage"),
            onSaved: this.triggerUp.bind(this, 'reload'),
        }).open();
    },
});

const ProjectTaskKanbanRenderer = KanbanRenderer.extend({
    config: Object.assign({}, KanbanRenderer.prototype.config, {
        KanbanColumn: ProjectTaskKanbanColumn,
    }),

    init: function () {
        this._super.apply(this, arguments);
        this.isProjectManager = false;
    },

    willStart: function () {
        const superPromise = this._super.apply(this, arguments);

        const isProjectManager = this.getSession().userHasGroup('project.groupProjectManager').then((hasGroup) => {
            this.isProjectManager = hasGroup;
            this._setState();
            return Promise.resolve();
        });

        return Promise.all([superPromise, isProjectManager]);
    },

    /**
     * Allows record drag when grouping by `personalStageTypeIds`
     *
     * @override
     */
    _setState() {
        this._super(...arguments);
        const groupedBy = this.state.groupedBy[0];
        const groupByFieldName = viewUtils.getGroupByField(groupedBy);
        const field = this.state.fields[groupByFieldName] || {};
        const fieldInfo = this.state.fieldsInfo.kanban[groupByFieldName] || {};

        const groupedByDate = ["date", "datetime"].includes(field.type);
        const groupedByM2m = field.type === "many2many";
        const readonly = !!field.readonly || !!fieldInfo.readonly;
        const groupedByPersonalStage = (groupByFieldName === 'personalStageTypeIds');

        const draggable = !readonly && (!groupedByM2m || groupedByPersonalStage) &&
            (!groupedByDate || fieldInfo.allowGroupRangeValue);

        // When grouping by personal stage we allow any project user to create
        let editable = this.columnOptions.editable;
        let deletable = this.columnOptions.deletable;
        if (['stageId', 'personalStageTypeIds'].includes(groupByFieldName)) {
            this.groupedByM2O = groupedByPersonalStage || this.groupedByM2O;
            const allowCrud = this.isProjectManager || groupedByPersonalStage;
            this.createColumnEnabled = editable = deletable = allowCrud;
        }

        Object.assign(this.columnOptions, {
            draggable,
            groupedByM2o: this.groupedByM2O,
            editable: editable,
            deletable: deletable,
        });
    }
});

export const ProjectKanbanController = KanbanController.extend({
    customEvents: Object.assign({}, KanbanController.prototype.customEvents, {
        'kanbanColumnDeleteWizard': '_onDeleteColumnWizard',
    }),

    _onDeleteColumnWizard: function (ev) {
        ev.stopPropagation();
        const self = this;
        const columnId = ev.target.id;
        const state = this.model.get(this.handle, {raw: true});
        this._rpc({
            model: 'project.task.type',
            method: 'unlinkWizard',
            args: [columnId],
            context: state.getContext(),
        }).then(function (res) {
            self.doAction(res);
        });
    },

    /**
     * @override
     */
    _onDeleteColumn: function (ev) {
        const state = this.model.get(this.handle, {raw: true});
        const groupedByFieldname = state.groupedBy[0];
        if (groupedByFieldname !== 'personalStageTypeIds') {
            this._super(...arguments);
            return;
        }
        const column = ev.target;
        this._rpc({
            model: 'project.task.type',
            method: 'removePersonalStage',
            args: [[column.id]],
        }).then(this.update.bind(this, {}, {}));
    },
});

const ProjectTaskKanbanModel = KanbanModel.extend({

    /**
     * Upon updating `personalStageTypeIds` we actually want to update the `personalStageTypeId` field.
     *
     * @override
     * @private
     */
    moveRecord: function (recordID, groupID, parentID) {
        const self = this;
        const parent = this.localData[parentID];
        const newGroup = this.localData[groupID];
        const changes = {};
        const groupedFieldName = viewUtils.getGroupByField(parent.groupedBy[0]);
        const groupedField = parent.fields[groupedFieldName];
        // for a date/datetime field, we take the last moment of the group as the group value
        if (['date', 'datetime'].includes(groupedField.type)) {
            changes[groupedFieldName] = viewUtils.getGroupValue(newGroup, groupedFieldName);
        } else if (groupedField.type === 'many2one') {
            changes[groupedFieldName] = {
                id: newGroup.resId,
                displayName: newGroup.value,
            };
        } else if (groupedField.type === 'selection') {
            const value = _.findWhere(groupedField.selection, {1: newGroup.value});
            changes[groupedFieldName] = value && value[0] || false;
        } else if (groupedField.type == 'many2many' && groupedFieldName == 'personalStageTypeIds') {
            changes['personalStageTypeId'] = {
                id: newGroup.resId,
                displayName: newGroup.value,
            }
        } else {
            changes[groupedFieldName] = newGroup.value;
        }

        // Manually updates groups data. Note: this is done before the actual
        // save as it might need to perform a read group in some cases so those
        // updated data might be overridden again.
        const record = self.localData[recordID];
        const resID = record.resId;
        // Remove record from its current group
        let oldGroup;
        for (let i = 0; i < parent.data.length; i++) {
            oldGroup = self.localData[parent.data[i]];
            const index = _.indexOf(oldGroup.data, recordID);
            if (index >= 0) {
                oldGroup.data.splice(index, 1);
                oldGroup.count--;
                if (!oldGroup.activeFilter || oldGroup.activeFilter.value === record.data[parent.progressBar.field]) {
                    // Here, the record leaving the old group matches its domain,
                    // so we must decrease the domainCount too.
                    oldGroup.domainCount--;
                }
                oldGroup.resIds = _.without(oldGroup.resIds, resID);
                self._updateParentResIDs(oldGroup);
                break;
            }
        }
        // Add record to its new group
        newGroup.data.push(recordID);
        newGroup.resIds.push(resID);
        newGroup.count++;

        return this.notifyChanges(recordID, changes).then(function () {
            return self.save(recordID);
        }).then(function () {
            record.parentID = newGroup.id;
            return [oldGroup.id, newGroup.id];
        });
    },

    /**
     * When grouped by personal stage create a new personal stage instead of
     * a regular stage.
     * Meaning setting `userId` on the stage.
     *
     * @override
     */
    createGroup: function (name, parentID) {
        const parent = this.localData[parentID];
        const groupedFieldName = viewUtils.getGroupByField(parent.groupedBy[0]);
        if (groupedFieldName !== 'personalStageTypeIds') {
            return this._super(...arguments);
        }
        const groupBy = parent.groupedBy[0];
        const context = Object.assign({}, parent.context, {
            default_userId: this.getSession().uid,
        });
        // In case it's a personal stage we don't want to assign it to the project.
        delete context.default_projectId;
        return this._rpc({
                model: 'project.task.type',
                method: 'nameCreate',
                args: [name],
                context: context,
            })
            .then((result) => {
                const createGroupDataPoint = (model, parent) => {
                    const newGroup = model._makeDataPoint({
                        modelName: parent.model,
                        context: parent.context,
                        domain: parent.domain.concat([[groupBy, "=", result[0]]]),
                        fields: parent.fields,
                        fieldsInfo: parent.fieldsInfo,
                        isOpen: true,
                        limit: parent.limit,
                        parentID: parent.id,
                        openGroupByDefault: true,
                        orderedBy: parent.orderedBy,
                        value: result,
                        viewType: parent.viewType,
                    });
                    if (parent.progressBar) {
                        newGroup.progressBarValues = _.extend({
                            counts: {},
                        }, parent.progressBar);
                    }
                    return newGroup;
                };
                const newGroup = createGroupDataPoint(this, parent);
                parent.data.push(newGroup.id);
                if (this.isInSampleMode()) {
                    // in sample mode, create the new group in both models (main + sample)
                    const sampleParent = this.sampleModel.localData[parentID];
                    const newSampleGroup = createGroupDataPoint(this.sampleModel, sampleParent);
                    sampleParent.data.push(newSampleGroup.id);
                }
                return newGroup.id;
            });
    },

    /**
     * Force tasks assigned to the user when grouping by personal stage.
     *
     * @override
     * @private
     */
    _readGroup: function (list) {
        const groupedBy = list.groupedBy[0];
        if (groupedBy === 'personalStageTypeIds') {
            list.domain = Domain.and([
                [['userIds', 'in', this.getSession().uid]],
                list.domain
            ]).toList();
        }
        return this._super(...arguments);
    },
})

const ProjectKanbanView = KanbanView.extend({
    config: _.extend({}, KanbanView.prototype.config, {
        Model: ProjectTaskKanbanModel,
        Controller: ProjectKanbanController,
        Renderer: ProjectTaskKanbanRenderer,
        ControlPanel: ProjectControlPanel,
    }),
});

viewRegistry.add('projectTaskKanban', ProjectKanbanView);
