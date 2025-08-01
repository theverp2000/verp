verp.define('web.KanbanRenderer', function (require) {
"use strict";

var BasicRenderer = require('web.BasicRenderer');
var ColumnQuickCreate = require('web.kanbanColumnQuickCreate');
var config = require('web.config');
var core = require('web.core');
var KanbanColumn = require('web.KanbanColumn');
var KanbanRecord = require('web.KanbanRecord');
var QWeb = require('web.QWeb');
var session = require('web.session');
var utils = require('web.utils');
var viewUtils = require('web.viewUtils');

var qweb = core.qweb;
var _t = core._t;

function findInNode(node, predicate) {
    if (predicate(node)) {
        return node;
    }
    if (!node.children) {
        return undefined;
    }
    for (var i = 0; i < node.children.length; i++) {
        if (findInNode(node.children[i], predicate)) {
            return node.children[i];
        }
    }
}

function qwebAddIf(node, condition) {
    if (node.attrs[qweb.prefix + '-if']) {
        condition = _.str.sprintf("(%s) and (%s)", node.attrs[qweb.prefix + '-if'], condition);
    }
    node.attrs[qweb.prefix + '-if'] = condition;
}

function transformQwebTemplate(node, fields) {
    // Process modifiers
    if (node.tag && node.attrs.modifiers) {
        var modifiers = node.attrs.modifiers || {};
        if (modifiers.invisible) {
            qwebAddIf(node, _.str.sprintf("!kanbanComputeDomain(%s)", JSON.stringify(modifiers.invisible)));
        }
    }
    switch (node.tag) {
        case 'button':
        case 'a':
            var type = node.attrs.type || '';
            if (_.indexOf('action,object,edit,open,delete,url,setCover'.split(','), type) !== -1) {
                _.each(node.attrs, function (v, k) {
                    if (_.indexOf('icon,type,name,args,string,context,states,kanbanStates'.split(','), k) !== -1) {
                        node.attrs['data-' + k] = v;
                        delete(node.attrs[k]);
                    }
                });
                if (node.attrs['data-string']) {
                    node.attrs.title = node.attrs['data-string'];
                }
                if (node.tag === 'a' && node.attrs['data-type'] !== "url") {
                    node.attrs.href = '#';
                } else {
                    node.attrs.type = 'button';
                }

                var actionClasses = " oe-kanban-action oe-kanban-action-" + node.tag;
                if (node.attrs['t-attf-class']) {
                    node.attrs['t-attf-class'] += actionClasses;
                } else if (node.attrs['t-att-class']) {
                    node.attrs['t-att-class'] += " + '" + actionClasses + "'";
                } else {
                    node.attrs['class'] = (node.attrs['class'] || '') + actionClasses;
                }
            }
            break;
    }
    if (node.children) {
        for (var i = 0, ii = node.children.length; i < ii; i++) {
            transformQwebTemplate(node.children[i], fields);
        }
    }
}

var KanbanRenderer = BasicRenderer.extend({
    className: 'o-kanban-view',
    config: { // the KanbanRecord and KanbanColumn classes to use (may be overridden)
        KanbanColumn: KanbanColumn,
        KanbanRecord: KanbanRecord,
    },
    customEvents: _.extend({}, BasicRenderer.prototype.customEvents || {}, {
        closeQuickCreate: '_onCloseQuickCreate',
        cancelQuickCreate: '_onCancelQuickCreate',
        setProgressBarState: '_onSetProgressBarState',
        startQuickCreate: '_onStartQuickCreate',
        quickCreateColumnUpdated: '_onQuickCreateColumnUpdated',
    }),
    events:_.extend({}, BasicRenderer.prototype.events || {}, {
        'keydown .o-kanban-record' : '_onRecordKeyDown'
    }),
    sampleDataTargets: [
        '.o-kanban-counter',
        '.o-kanban-record',
        '.o-kanban-toggle-fold',
        '.o-column-folded',
        '.o-column-archive-records',
        '.o-column-unarchive-records',
    ],

    /**
     * @override
     * @param {Object} params
     * @param {boolean} params.quickCreateEnabled set to false to disable the
     *   quick create feature
     */
    init: function (parent, state, params) {
        this._super.apply(this, arguments);

        this.widgets = [];
        this.qweb = new QWeb(config.isDebug(), {_s: session.origin}, false);
        var templates = findInNode(this.arch, function (n) { return n.tag === 'templates';});
        transformQwebTemplate(templates, state.fields);
        this.qweb.addTemplate(utils.jsonNodeToXml(templates));
        this.examples = params.examples;
        this.recordOptions = _.extend({}, params.recordOptions, {
            qweb: this.qweb,
            viewType: 'kanban',
        });
        this.columnOptions = _.extend({KanbanRecord: this.config.KanbanRecord}, params.columnOptions);
        if (this.columnOptions.hasProgressBar) {
            this.columnOptions.progressBarStates = {};
        }
        this.quickCreateEnabled = params.quickCreateEnabled;
        if (!params.readOnlyMode) {
            var handleField = _.findWhere(this.state.fieldsInfo.kanban, {widget: 'handle'});
            this.handleField = handleField && handleField.name;
        }
        this._setState(state);
    },
    /**
     * Called each time the renderer is attached into the DOM.
     */
    onAttachCallback: function () {
        this._super(...arguments);
        if (this.quickCreate) {
            this.quickCreate.onAttachCallback();
        }
    },

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Displays the quick create record in the requested column (first one by
     * default)
     *
     * @params {string} [groupId] local id of the group in which the quick create
     *   must be inserted
     * @returns {Promise}
     */
    addQuickCreate: function (groupId) {
        let kanbanColumn;
        if (groupId) {
            kanbanColumn = this.widgets.find(column => column.dbId === groupId);
        }
        kanbanColumn = kanbanColumn || this.widgets[0];
        return kanbanColumn.addQuickCreate();
    },
    /**
     * Focuses the first kanban record
     */
    giveFocus: function () {
        this.$('.o-kanban-record:first').focus();
    },
    /**
     * Toggle fold/unfold the Column quick create widget
     */
    quickCreateToggleFold: function () {
        this.quickCreate.toggleFold();
        this._toggleNoContentHelper();
    },
    /**
     * Updates a given column with its new state.
     *
     * @param {string} localID the column id
     * @param {Object} columnState
     * @param {Object} [options]
     * @param {Object} [options.state] if set, this represents the new state
     * @param {boolean} [options.openQuickCreate] if true, directly opens the
     *   QuickCreate widget in the updated column
     *
     * @returns {Promise}
     */
    updateColumn: function (localID, columnState, options) {
        var self = this;
        var KanbanColumn = this.config.KanbanColumn;
        var newColumn = new KanbanColumn(this, columnState, this.columnOptions, this.recordOptions);
        var index = _.findIndex(this.widgets, {dbId: localID});
        var column = this.widgets[index];
        this.widgets[index] = newColumn;
        if (options && options.state) {
            this._setState(options.state);
        }
        return newColumn.appendTo(document.createDocumentFragment()).then(function () {
            var def;
            if (options && options.openQuickCreate) {
                def = newColumn.addQuickCreate();
            }
            return Promise.resolve(def).then(function () {
                newColumn.$el.insertAfter(column.$el);
                self._toggleNoContentHelper();
                // When a record has been quick created, the new column directly
                // renders the quick create widget (to allow quick creating several
                // records in a row). However, as we render this column in a
                // fragment, the quick create widget can't be correctly focused. So
                // we manually call onAttachCallback to focus it once in the DOM.
                newColumn.onAttachCallback();
                column.destroy();
            });
        });
    },
    /**
     * Updates a given record with its new state.
     *
     * @param {Object} recordState
     * @returns {Promise}
     */
    updateRecord: function (recordState) {
        var isGrouped = !!this.state.groupedBy.length;
        var record;

        if (isGrouped) {
            // if grouped, this.widgets are kanban columns so we need to find
            // the kanban record inside
            _.each(this.widgets, function (widget) {
                record = record || _.findWhere(widget.records, {
                    dbId: recordState.id,
                });
            });
        } else {
            record = _.findWhere(this.widgets, {dbId: recordState.id});
        }

        if (record) {
            return record.update(recordState);
        }
        return Promise.resolve();
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @private
     * @param {DOMElement} currentColumn
     */
    _focusOnNextCard: function (currentCardElement) {
        var nextCard = currentCardElement.nextElementSibling;
        if (nextCard) {
            nextCard.focus();
        }
    },
    /**
     * Tries to give focus to the previous card, and returns true if successful
     *
     * @private
     * @param {DOMElement} currentColumn
     * @returns {boolean}
     */
    _focusOnPreviousCard: function (currentCardElement) {
        var previousCard = currentCardElement.previousElementSibling;
        if (previousCard && previousCard.classList.contains("o-kanban-record")) { //previous element might be column title
            previousCard.focus();
            return true;
        }
    },
    /**
     * Returns the default columns for the kanban view example background.
     * You can override this method to easily customize the column names.
     *
     * @private
     */
    _getGhostColumns: function () {
        if (this.examples && this.examples.ghostColumns) {
            return this.examples.ghostColumns;
        }
        return _.map(_.range(1, 5), function (num) {
            return _.str.sprintf(_t("Column %s"), num);
        });
    },
    /**
     * Render the Example Ghost Kanban card on the background
     *
     * @private
     * @param {DocumentFragment} fragment
     */
    _renderExampleBackground: function (fragment) {
        var $background = $(qweb.render('KanbanView.ExamplesBackground', {ghostColumns: this._getGhostColumns()}));
        $background.appendTo(fragment);
    },
    /**
     * Renders empty invisible divs in a document fragment.
     *
     * @private
     * @param {DocumentFragment} fragment
     * @param {integer} nbDivs the number of divs to append
     * @param {Object} [options]
     * @param {string} [options.inlineStyle]
     */
    _renderGhostDivs: function (fragment, nbDivs, options) {
        var ghostDefs = [];
        for (var $ghost, i = 0; i < nbDivs; i++) {
            $ghost = $('<div>').addClass('o-kanban-record o-kanban-ghost');
            if (options && options.inlineStyle) {
                $ghost.attr('style', options.inlineStyle);
            }
            var def = $ghost.appendTo(fragment);
            ghostDefs.push(def);
        }
        return Promise.all(ghostDefs);
    },
    /**
     * Renders an grouped kanban view in a fragment.
     *
     * @private
     * @param {DocumentFragment} fragment
     */
    _renderGrouped: function (fragment) {
        var self = this;

        // Render columns
        var KanbanColumn = this.config.KanbanColumn;
        _.each(this.state.data, function (group) {
            var column = new KanbanColumn(self, group, self.columnOptions, self.recordOptions);
            var def;
            if (!group.value) {
                def = column.prependTo(fragment); // display the 'Undefined' group first
                self.widgets.unshift(column);
            } else {
                def = column.appendTo(fragment);
                self.widgets.push(column);
            }
            self.defs.push(def);
        });

        // remove previous sorting
        if(this.$el.sortable('instance') !== undefined) {
            this.$el.sortable('destroy');
        }
        if (this.groupedByM2O) {
            // Enable column sorting
            this.$el.sortable({
                axis: 'x',
                items: '> .o-kanban-group',
                handle: '.o-column-title',
                cursor: 'move',
                revert: 150,
                delay: 100,
                tolerance: 'pointer',
                forcePlaceholderSize: true,
                stop: function () {
                    var ids = [];
                    self.$('.o-kanban-group').each(function (index, u) {
                        // Ignore 'Undefined' column
                        if (_.isNumber($(u).data('id'))) {
                            ids.push($(u).data('id'));
                        }
                    });
                    self.triggerUp('resequenceColumns', {ids: ids});
                },
            });

            if (this.createColumnEnabled) {
                this.quickCreate = new ColumnQuickCreate(this, {
                    applyExamplesText: this.examples && this.examples.applyExamplesText,
                    examples: this.examples && this.examples.examples,
                    isFirstColumn: !self.state.data.length,
                });
                this.defs.push(this.quickCreate.appendTo(fragment).then(function () {
                    // Open it directly if there is no column yet
                    if (!self.state.data.length) {
                        self.quickCreate.toggleFold();
                        self._renderExampleBackground(fragment);
                    }
                }));
            }
        }
    },
    /**
     * Renders an ungrouped kanban view in a fragment.
     *
     * @private
     * @param {DocumentFragment} fragment
     */
    _renderUngrouped: function (fragment) {
        var self = this;
        var KanbanRecord = this.config.KanbanRecord;
        var kanbanRecord;
        _.each(this.state.data, function (record) {
            kanbanRecord = new KanbanRecord(self, record, self.recordOptions);
            self.widgets.push(kanbanRecord);
            var def = kanbanRecord.appendTo(fragment);
            self.defs.push(def);
        });

        // enable record resequencing if there is a field with widget='handle'
        // and if there is no orderby (in this case we assume that the widget
        // has been put on the first default order field of the model), or if
        // the first orderby field is the one with widget='handle'
        var orderedBy = this.state.orderedBy;
        var hasHandle = this.handleField &&
                        (orderedBy.length === 0 || orderedBy[0].name === this.handleField);
        if (hasHandle) {
            this.$el.sortable({
                items: '.o-kanban-record:not(.o-kanban-ghost)',
                cursor: 'move',
                revert: 0,
                delay: 0,
                tolerance: 'pointer',
                forcePlaceholderSize: true,
                stop: function (event, ui) {
                    self._moveRecord(ui.item.data('record').dbId, ui.item.index());
                },
            });
        }

        // append ghost divs to ensure that all kanban records are left aligned
        var prom = Promise.all(self.defs).then(function () {
            var options = {};
            if (kanbanRecord) {
                options.inlineStyle = kanbanRecord.$el.attr('style');
            }
            return self._renderGhostDivs(fragment, 6, options);
        });
        this.defs.push(prom);
    },
    /**
     * @override
     * @private
     */
    _renderView: function () {
        var self = this;

        // render the kanban view
        var isGrouped = !!this.state.groupedBy.length;
        var fragment = document.createDocumentFragment();
        var defs = [];
        this.defs = defs;
        if (isGrouped) {
            this._renderGrouped(fragment);
        } else {
            this._renderUngrouped(fragment);
        }
        delete this.defs;

        return this._super.apply(this, arguments).then(function () {
            return Promise.all(defs).then(function () {
                self.$el.empty();
                self.$el.toggleClass('o-kanban-grouped', isGrouped);
                self.$el.toggleClass('o-kanban-ungrouped', !isGrouped);
                self.$el.append(fragment);
                self._toggleNoContentHelper();
            });
        });
    },
    /**
     * @param {boolean} [remove] if true, the nocontent helper is always removed
     * @private
     */
    _toggleNoContentHelper: function (remove) {
        var displayNoContentHelper =
            !remove &&
            !this._hasContent() &&
            !!this.noContentHelp &&
            !(this.quickCreate && !this.quickCreate.folded) &&
            !this.state.isGroupedByM2ONoColumn;

        var $noContentHelper = this.$('.o-view-nocontent');

        if (displayNoContentHelper && !$noContentHelper.length) {
            this._renderNoContentHelper();
        }
        if (!displayNoContentHelper && $noContentHelper.length) {
            $noContentHelper.remove();
        }
    },
    /**
     * Sets the current state and updates some internal attributes accordingly.
     *
     * @override
     */
    _setState() {
        this._super(...arguments);
        const groupedBy = this.state.groupedBy[0];
        const groupByFieldName = viewUtils.getGroupByField(groupedBy);
        const field = this.state.fields[groupByFieldName] || {};
        const fieldInfo = this.state.fieldsInfo.kanban[groupByFieldName] || {};

        const groupByTooltip = fieldInfo.options && fieldInfo.options.groupByTooltip;
        const groupedByDate = ["date", "datetime"].includes(field.type);
        const groupedByM2m = field.type === "many2many";
        const groupedByM2o = field.type === "many2one";
        const readonly = !!field.readonly || !!fieldInfo.readonly;
        const relation = (groupedByM2o || groupedByM2m) && field.relation;
        const quickCreate = this.quickCreateEnabled && viewUtils.isQuickCreateEnabled(this.state);

        // Deactivate the drag'n'drop either:
        // - if the groupedBy field is readonly (on the field attrs or in the view)
        // - if the groupedBy field is of type many2many
        // - for date and datetime if :
        //   - allowGroupRangeValue is not true
        const draggable = !readonly && !groupedByM2m &&
            (!groupedByDate || fieldInfo.allowGroupRangeValue);

        Object.assign(this.columnOptions, {
            draggable,
            groupedBy,
            groupedByDate,
            groupedByM2o,
            groupedByM2m,
            groupByTooltip,
            quickCreate,
            relation,
        });

        this.createColumnEnabled = groupedByM2o && this.columnOptions.groupCreatable;
        this.groupedByM2O = groupedByM2o;
    },
    /**
     * Moves the focus on the first card of the next column in a given direction
     * This ignores the folded columns and skips over the empty columns.
     * In ungrouped kanban, moves the focus to the next/previous card
     *
     * @param {DOMElement} eventTarget  the target of the keydown event
     * @param {string} direction  contains either 'LEFT' or 'RIGHT'
     */
    _focusOnCardInColumn: function(eventTarget, direction) {
        var currentColumn = eventTarget.parentElement;
        var hasSelectedACard = false;
        var cannotSelectAColumn = false;
        while (!hasSelectedACard && !cannotSelectAColumn) {
            var candidateColumn = direction === 'LEFT' ?
                                    currentColumn.previousElementSibling :
                                    currentColumn.nextElementSibling ;
            currentColumn = candidateColumn;
            if (candidateColumn) {
                var allCardsOfCandidateColumn =
                    candidateColumn.getElementsByClassName('o-kanban-record');
                if (allCardsOfCandidateColumn.length) {
                    allCardsOfCandidateColumn[0].focus();
                    hasSelectedACard = true;
                }
            }
            else { // either there are no more columns in the direction or
                   // this is not a grouped kanban
                direction === 'LEFT' ?
                    this._focusOnPreviousCard(eventTarget) :
                    this._focusOnNextCard(eventTarget);
                cannotSelectAColumn = true;
            }
        }
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     */
    _onCancelQuickCreate: function () {
        this._toggleNoContentHelper();
    },
    /**
     * Closes the opened quick create widgets in columns
     *
     * @private
     */
    _onCloseQuickCreate: function () {
        if (this.state.groupedBy.length) {
            _.invoke(this.widgets, 'cancelQuickCreate');
        }
        this._toggleNoContentHelper();
    },
    /**
     * @private
     * @param {VerpEvent} ev
     */
    _onQuickCreateColumnUpdated: function (ev) {
        ev.stopPropagation();
        this._toggleNoContentHelper();
        this._updateExampleBackground();
    },
    /**
     * @private
     * @param {KeyboardEvent} e
     */
    _onRecordKeyDown: function(e) {
        switch(e.which) {
            case $.ui.keyCode.DOWN:
                this._focusOnNextCard(e.currentTarget);
                e.stopPropagation();
                e.preventDefault();
                break;
            case $.ui.keyCode.UP:
                const previousFocused = this._focusOnPreviousCard(e.currentTarget);
                if (!previousFocused) {
                    this.triggerUp('navigationMove', { direction: 'up' });
                }
                e.stopPropagation();
                e.preventDefault();
                break;
            case $.ui.keyCode.RIGHT:
                this._focusOnCardInColumn(e.currentTarget, 'RIGHT');
                e.stopPropagation();
                e.preventDefault();
                break;
            case $.ui.keyCode.LEFT:
                this._focusOnCardInColumn(e.currentTarget, 'LEFT');
                e.stopPropagation();
                e.preventDefault();
                break;
        }
    },
    /**
     * Updates progressbar internal states (necessary for animations) with
     * received data.
     *
     * @private
     * @param {VerpEvent} ev
     */
    _onSetProgressBarState: function (ev) {
        if (!this.columnOptions.progressBarStates[ev.data.columnID]) {
            this.columnOptions.progressBarStates[ev.data.columnID] = {};
        }
        _.extend(this.columnOptions.progressBarStates[ev.data.columnID], ev.data.values);
    },
    /**
     * Closes the opened quick create widgets in columns
     *
     * @private
     */
    _onStartQuickCreate: function () {
        this._toggleNoContentHelper(true);
    },
    /**
     * Hide or display the background example:
     *  - displayed when quick create column is display and there is no column else
     *  - hidden otherwise
     *
     * @private
     **/
    _updateExampleBackground: function () {
        var $elem = this.$('.o-kanban-example-background-container');
        if (!this.state.data.length && !$elem.length) {
            this._renderExampleBackground(this.$el);
        } else {
            $elem.remove();
        }
    },
});

return KanbanRenderer;

});
