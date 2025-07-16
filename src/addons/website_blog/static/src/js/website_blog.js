verp.define('website_blog.websiteBlog', function (require) {
'use strict';
var core = require('web.core');

const dom = require('web.dom');
const publicWidget = require('web.public.widget');

publicWidget.registry.websiteBlog = publicWidget.Widget.extend({
    selector: '.website-blog',
    events: {
        'click #oWblogNextContainer': '_onNextBlogClick',
        'click #oWblogPostContentJump': '_onContentAnchorClick',
        'click .o-twitter, .o-facebook, .o-linkedin, .o-google, .o-twitter-complete, .o-facebook-complete, .o-linkedin-complete, .o-google-complete': '_onShareArticle',
    },

    /**
     * @override
     */
    start: function () {
        $('.js-tweet, .js-comment').share({});
        return this._super.apply(this, arguments);
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     * @param {Event} ev
     */
    _onNextBlogClick: function (ev) {
        ev.preventDefault();
        var self = this;
        var $el = $(ev.currentTarget);
        var nexInfo = $el.find('#oWblogNextPostInfo').data();
        $el.find('.o-record-cover-container').addClass(nexInfo.size + ' ' + nexInfo.text).end()
           .find('.o-wblog-toggle').toggleClass('d-none');
        // Appending a placeholder so that the cover can scroll to the top of the
        // screen, regardless of its height.
        const placeholder = document.createElement('div');
        placeholder.style.minHeight = '100vh';
        this.$('#oWblogNextContainer').append(placeholder);

        // Use _.defer to calculate the 'offset()'' only after that size classes
        // have been applyed and that $el has been resized.
        _.defer(function () {
            self._forumScrollAction($el, 300, function () {
                window.location.href = nexInfo.url;
            });
        });
    },
    /**
     * @private
     * @param {Event} ev
     */
    _onContentAnchorClick: function (ev) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        var $el = $(ev.currentTarget.hash);

        this._forumScrollAction($el, 500, function () {
            window.location.hash = 'blogContent';
        });
    },
    /**
     * @private
     * @param {Event} ev
     */
    _onShareArticle: function (ev) {
        ev.preventDefault();
        var url = '';
        var $element = $(ev.currentTarget);
        var blogPostTitle = $('#oWblogPostName').html() || '';
        var articleURL = window.location.href;
        if ($element.hasClass('o-twitter')) {
            var twitterText = core._t("Amazing blog article: %s! Check it live: %s");
            var tweetText = _.string.sprintf(twitterText, blogPostTitle, articleURL);
            url = 'https://twitter.com/intent/tweet?tw_p=tweetbutton&text=' + encodeURIComponent(tweetText);
        } else if ($element.hasClass('o-facebook')) {
            url = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(articleURL);
        } else if ($element.hasClass('o-linkedin')) {
            url = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(articleURL);
        }
        window.open(url, '', 'menubar=no, width=500, height=400');
    },

    //--------------------------------------------------------------------------
    // Utils
    //--------------------------------------------------------------------------

    /**
     * @private
     * @param {JQuery} $el - the element we are scrolling to
     * @param {Integer} duration - scroll animation duration
     * @param {Function} callback - to be executed after the scroll is performed
     */
    _forumScrollAction: function ($el, duration, callback) {
        dom.scrollTo($el[0], {duration: duration}).then(() => callback());
    },
});
});
