verp.define('website_blog.contentshare', function (require) {
'use strict';

const dom = require('web.dom');

$.fn.share = function (options) {
    var option = $.extend($.fn.share.defaults, options);
    var selectedText = "";
    $.extend($.fn.share, {
        init: function (shareable) {
            var self = this;
            $.fn.share.defaults.shareable = shareable;
            $.fn.share.defaults.shareable.on('mouseup', function () {
                if ($(this).parents('body.editor-enable').length === 0) {
                    self.popOver();
                }
            });
            $.fn.share.defaults.shareable.on('mousedown', function () {
                self.destroy();
            });
        },
        getContent: function () {
            var $popoverContent = $('<div class="h4 m-0"/>');
            if ($('.o-wblog-title, .o-wblog-post-content-field').hasClass('js-comment')) {
                selectedText = this.getSelection('string');
                var $btnCOntent = $('<a class="o-share-comment btn btn-link px-2" href="#"/>').append($('<i class="fa fa-lg fa-comment"/>'));
                $popoverContent.append($btnCOntent);
            }
            if ($('.o-wblog-title, .o-wblog-post-content-field').hasClass('js-tweet')) {
                var tweet = '"%s" - %s';
                var baseLength = tweet.replace(/%s/g, '').length;
                // Shorten the selected text to match the tweet max length
                // Note: all (non-localhost) urls in a tweet have 23 characters https://support.twitter.com/articles/78124
                var selectedText = this.getSelection('string').substring(0, option.maxLength - baseLength - 23);

                var text = window.btoa(encodeURIComponent(_.str.sprintf(tweet, selectedText, window.location.href)));
                $popoverContent.append(_.str.sprintf(
                    "<a onclick=\"window.open('%s' + atob('%s'), '_%s','location=yes,height=570,width=520,scrollbars=yes,status=yes')\"><i class=\"ml4 mr4 fa fa-twitter fa-lg\"/></a>",
                    option.shareLink, text, option.target));
            }
            return $popoverContent;
        },
        commentEdition: function () {
            $(".o-portal-chatter-composer-form textarea").val('"' + selectedText + '" ').focus();
            const commentsEl = $('#oWblogPostComments')[0];
            if (commentsEl) {
                dom.scrollTo(commentsEl).then(() => {
                    window.location.hash = 'blogPostCommentQuote';
                });
            }
        },
        getSelection: function (share) {
            if (window.getSelection) {
                var selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) {
                    return "";
                }
                if (share === 'string') {
                    return String(selection.getRangeAt(0)).replace(/\s{2,}/g, ' ');
                } else {
                    return selection.getRangeAt(0);
                }
            } else if (document.selection) {
                if (share === 'string') {
                    return document.selection.createRange().text.replace(/\s{2,}/g, ' ');
                } else {
                    return document.selection.createRange();
                }
            }
        },
        popOver: function () {
            this.destroy();
            if (this.getSelection('string').length < option.minLength) {
                return;
            }
            var data = this.getContent();
            var range = this.getSelection();

            var newNode = document.createElement("span");
            range.insertNode(newNode);
            newNode.className = option.className;
            var $pop = $(newNode);
            $pop.popover({
                trigger: 'manual',
                placement: option.placement,
                html: true,
                content: function () {
                    return data;
                }
            }).popover('show');
            $('.o-share-comment').on('click', this.commentEdition);
        },
        destroy: function () {
            var $span = $('span.' + option.className);
            $span.popover('hide');
            $span.remove();
        }
    });
    $.fn.share.init(this);
};

$.fn.share.defaults = {
    shareLink: "http://twitter.com/intent/tweet?text=",
    minLength: 5,
    maxLength: 140,
    target: "blank",
    className: "share",
    placement: "top",
};
});
