/** @verp-module **/

import core from 'web.core';
import framework from 'web.framework';
import stockReportGeneric from 'stock.stockReportGeneric';

var QWeb = core.qweb;
var _t = core._t;

var MrpBomReport = stockReportGeneric.extend({
    events: {
        'click .o-mrp-bom-unfoldable': '_onClickUnfold',
        'click .o-mrp-bom-foldable': '_onClickFold',
        'click .o-mrp-bom-action': '_onClickAction',
        'click .o-mrp-show-attachment-action': '_onClickShowAttachment',
    },
    getHtml: function() {
        var self = this;
        var args = [
            this.givenContext.activeId,
            this.givenContext.searchQty || false,
            this.givenContext.searchVariant,
        ];
        return this._rpc({
                model: 'report.mrp.bomstructure',
                method: 'getHtml',
                args: args,
                context: this.givenContext,
            })
            .then(function (result) {
                self.data = result;
                if (! self.givenContext.searchVariant) {
                    self.givenContext.searchVariant = result.isVariantApplied && Object.keys(result.variants)[0];
                }
            });
    },
    setHtml: function() {
        var self = this;
        return this._super().then(function () {
            self.$('.o-content').html(self.data.lines);
            self.renderSearch();
            self.updateCp();
        });
    },
    renderHtml: function(event, $el, result){
        if (result.indexOf('mrp.document') > 0) {
            if (this.$('.o-mrp-has-attachments').length === 0) {
                var column = $('<th/>', {
                    class: 'o-mrp-has-attachments',
                    title: 'Files attached to the product Attachments',
                    text: 'Attachments',
                });
                this.$('table thead th:last-child').after(column);
            }
        }
        $el.after(result);
        $(event.currentTarget).toggleClass('o-mrp-bom-foldable o-mrp-bom-unfoldable fa-caret-right fa-caret-down');
        this._reloadReportType();
    },
    getBom: function(event) {
      var self = this;
      var $parent = $(event.currentTarget).closest('tr');
      var activeID = $parent.data('id');
      var productID = $parent.data('productId');
      var lineID = $parent.data('line');
      var qty = $parent.data('qty');
      var level = $parent.data('level') || 0;
      return this._rpc({
              model: 'report.mrp.bomstructure',
              method: 'getBom',
              args: [
                  activeID,
                  productID,
                  parseFloat(qty),
                  lineID,
                  level + 1,
              ]
          })
          .then(function (result) {
              self.renderHtml(event, $parent, result);
          });
    },
    getOperations: function(event) {
      var self = this;
      var $parent = $(event.currentTarget).closest('tr');
      var activeID = $parent.data('bom-id');
      var qty = $parent.data('qty');
      var productId = $parent.data('productId');
      var level = $parent.data('level') || 0;
      return this._rpc({
              model: 'report.mrp.bomstructure',
              method: 'getOperations',
              args: [
                  productId,
                  activeID,
                  parseFloat(qty),
                  level + 1
              ]
          })
          .then(function (result) {
              self.renderHtml(event, $parent, result);
          });
    },
    getByproducts: function(event) {
        var self = this;
        var $parent = $(event.currentTarget).closest('tr');
        var activeID = $parent.data('bom-id');
        var qty = $parent.data('qty');
        var level = $parent.data('level') || 0;
        var total = $parent.data('total') || 0;
        return this._rpc({
                model: 'report.mrp.bomstructure',
                method: 'getByproducts',
                args: [
                    activeID,
                    parseFloat(qty),
                    level + 1,
                    parseFloat(total)
                ]
            })
            .then(function (result) {
                self.renderHtml(event, $parent, result);
            });
      },
    updateCp: function () {
        var status = {
            cpContent: {
                $buttons: this.$buttonPrint,
                $searchview: this.$searchView
            },
        };
        return this.updateControlPanel(status);
    },
    renderSearch: function () {
        this.$buttonPrint = $(QWeb.render('mrp.button', {'isVariantApplied': this.data.isVariantApplied}));
        this.$buttonPrint.find('.o-mrp-bom-print').on('click', this._onClickPrint.bind(this));
        this.$buttonPrint.find('.o-mrp-bom-print-all-variants').on('click', this._onClickPrint.bind(this));
        this.$buttonPrint.find('.o-mrp-bom-print-unfolded').on('click', this._onClickPrint.bind(this));
        this.$searchView = $(QWeb.render('mrp.reportBomSearch', _.omit(this.data, 'lines')));
        this.$searchView.find('.o-mrp-bom-report-qty').on('change', this._onChangeQty.bind(this)).change();
        this.$searchView.find('.o-mrp-bom-report-variants').on('change', this._onChangeVariants.bind(this)).change();
        this.$searchView.find('.o-mrp-bom-report-type').on('change', this._onChangeType.bind(this));
    },
    _onClickPrint: function (ev) {
        var childBomIDs = _.map(this.$el.find('.o-mrp-bom-foldable').closest('tr'), function (el) {
            return $(el).data('id');
        });
        this.searchModelConfig.env.services.ui.block();
        var reportname = 'mrp.reportBomStructure?docids=' + this.givenContext.activeId +
                         '&reportType=' + this.givenContext.reportType +
                         '&quantity=' + (this.givenContext.searchQty || 1);
        if (! $(ev.currentTarget).hasClass('o-mrp-bom-print-unfolded')) {
            reportname += '&childs=' + JSON.stringify(childBomIDs);
        }
        if ($(ev.currentTarget).hasClass('o-mrp-bom-print-all-variants')) {
            reportname += '&allVariants=' + 1;
        } else if (this.givenContext.searchVariant) {
            reportname += '&variant=' + this.givenContext.searchVariant;
        }
        var action = {
            'type': 'ir.actions.report',
            'reportType': 'qweb-pdf',
            'reportName': reportname,
            'reportFile': 'mrp.reportBomStructure',
        };
        return this.doAction(action).then(() => {
            this.searchModelConfig.env.services.ui.unblock();
        });
    },
    _onChangeQty: function (ev) {
        var qty = $(ev.currentTarget).val().trim();
        if (qty) {
            this.givenContext.searchQty = parseFloat(qty);
            this._reload();
        }
    },
    _onChangeType: function (ev) {
        var reportType = $("option:selected", $(ev.currentTarget)).data('type');
        this.givenContext.reportType = reportType;
        this._reloadReportType();
    },
    _onChangeVariants: function (ev) {
        this.givenContext.searchVariant = $(ev.currentTarget).val();
        this._reload();
    },
    _onClickUnfold: function (ev) {
        var redirectFunction = $(ev.currentTarget).data('function');
        this[redirectFunction](ev);
    },
    _onClickFold: function (ev) {
        this._removeLines($(ev.currentTarget).closest('tr'));
        $(ev.currentTarget).toggleClass('o-mrp-bom-foldable o-mrp-bom-unfoldable fa-caret-right fa-caret-down');
    },
    _onClickAction: function (ev) {
        ev.preventDefault();
        return this.doAction({
            type: 'ir.actions.actwindow',
            resModel: $(ev.currentTarget).data('model'),
            resId: $(ev.currentTarget).data('res-id'),
            context: {
                'activeId': $(ev.currentTarget).data('res-id')
            },
            views: [[false, 'form']],
            target: 'current'
        });
    },
    _onClickShowAttachment: function (ev) {
        ev.preventDefault();
        var ids = $(ev.currentTarget).data('res-id');
        return this.doAction({
            name: _t('Attachments'),
            type: 'ir.actions.actwindow',
            resModel: $(ev.currentTarget).data('model'),
            domain: [['id', 'in', ids]],
            views: [[false, 'kanban'], [false, 'list'], [false, 'form']],
            viewMode: 'kanban,list,form',
            target: 'current',
        });
    },
    _reload: function () {
        var self = this;
        return this.getHtml().then(function () {
            self.$('.o-content').html(self.data.lines);
            self._reloadReportType();
        });
    },
    _reloadReportType: function () {
        this.$('.o-mrp-bom-cost.o-hidden, .o-mrp-prod-cost.o-hidden').toggleClass('o-hidden');
        if (this.givenContext.reportType === 'bomStructure') {
           this.$('.o-mrp-bom-cost, .o-mrp-prod-cost').toggleClass('o-hidden');
        }
    },
    _removeLines: function ($el) {
        var self = this;
        var activeID = $el.data('id');
        _.each(this.$('tr[parentId='+ activeID +']'), function (parent) {
            var $parent = self.$(parent);
            var $el = self.$('tr[parentId='+ $parent.data('id') +']');
            if ($el.length) {
                self._removeLines($parent);
            }
            $parent.remove();
        });
    },
});

core.actionRegistry.add('mrpBomReport', MrpBomReport);
export default MrpBomReport;
