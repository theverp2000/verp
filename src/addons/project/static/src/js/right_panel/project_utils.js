/** @verp-module **/

import { _lt } from 'web.core';
import fieldUtils from 'web.fieldUtils';
import { ComponentAdapter } from 'web.OwlCompatibility';
import { FormViewDialog } from 'web.viewDialogs';
const { useState, useRef } = owl.hooks;

class MilestoneComponent extends owl.Component {
    constructor() {
        super(...arguments);
        this.contextValue = Object.assign({}, {
            'default_projectId': this.props.context.activeId,
        }, this.props.context);
        this.FormViewDialog = FormViewDialog;
        this.state = useState({
            openDialog: false
        });
        this._dialogRef = useRef('dialog');
        this._isDialogOpen = false;
        this._createContext = this._createContext.bind(this);
        this._onDialogSaved = this._onDialogSaved.bind(this);
    }

    get context() {
        return this.contextValue;
    }

    set context(value) {
        this.contextValue = Object.assign({}, {
            'default_projectId': value.activeId,
        }, value);
    }

    dialogClosed() {
        this._isDialogOpen = false;
        this.state.openDialog = false;
    }

    patched() {
        if (this.state.openDialog && !this._isDialogOpen) {
            this._isDialogOpen = true;
            this._dialogRef.comp.widget.on('closed', this, () => {
                this.dialogClosed();
            });
            this._dialogRef.comp.widget.open();
        }
    }

    _createContext() {
        return Object.assign({}, {
            'default_projectId': this.contextValue.activeId,
        }, this.contextValue);
    }

    async _onDialogSaved() {
        await this.__owl__.parent.willUpdateProps();
    }
}
MilestoneComponent.components = { ComponentAdapter };

export class AddMilestone extends MilestoneComponent {
    get NEW_PROJECT_MILESTONE() {
        return _lt("New Milestone");
    }

    onAddMilestoneClick(event) {
        if (!this._isDialogOpen) {
            event.stopPropagation();
            this.state.openDialog = true;
        }
    }
}
AddMilestone.template = 'project.AddMilestone';

export class OpenMilestone extends MilestoneComponent {

    constructor() {
        super(...arguments);
        this.milestone = useState(this.props.milestone);
        this.state.colorClass = this.milestone.isDeadlineExceeded ? "o-milestone-danger" : "";
        this.state.checkboxIcon = this.milestone.isReached ? "fa-check-square-o" : "fa-square-o";
    }

    get OPEN_PROJECT_MILESTONE() {
        return _lt("Milestone");
    }

    get deadline() {
        return fieldUtils.format.date(moment(this.milestone.deadline));
    }

    willUpdateProps(nextProps) {
        if (nextProps.milestone) {
            this.milestone = nextProps.milestone;
            this.state.colorClass = this.milestone.isDeadlineExceeded ? "o-milestone-danger" : "";
            this.state.checkboxIcon = this.milestone.isReached ? "fa-check-square-o" : "fa-square-o";
        }
        if (nextProps.context) {
            this.contextValue = nextProps.context;
        }
    }

    dialogClosed() {
        super.dialogClosed();
        this.writeMutex = false;
    }

    async onDeleteMilestone() {
        await this.rpc({
            model: 'project.milestone',
            method: 'unlink',
            args: [this.milestone.id]
        });
        await this.__owl__.parent.willUpdateProps();
    }

    onOpenMilestone() {
        if (!this._isDialogOpen && !this.writeMutex) {
            this.writeMutex = true;
            this.state.openDialog = true;
        }
    }

    async onMilestoneClick() {
        if (!this.writeMutex) {
            this.writeMutex = true;
            this.milestone = await this.rpc({
                model: 'project.milestone',
                method: 'toggleIsReached',
                args: [[this.milestone.id], !this.milestone.isReached],
            });
            this.state.colorClass = this.milestone.isDeadlineExceeded ? "o-milestone-danger" : "";
            this.state.checkboxIcon = this.milestone.isReached ? "fa-check-square-o" : "fa-square-o";
            this.writeMutex = false;
        }
    }
}
OpenMilestone.template = 'project.OpenMilestone';
