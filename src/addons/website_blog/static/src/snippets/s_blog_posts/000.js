verp.define('website_blog.sBlogPostsFrontend', function (require) {
'use strict';

var publicWidget = require('web.public.widget');
const DynamicSnippet = require('website.sDynamicSnippet');

const DynamicSnippetBlogPosts = DynamicSnippet.extend({
    selector: '.s-dynamic-snippet-blog-posts',
    disabledInEditableMode: false,

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Method to be overridden in child components in order to provide a search
     * domain if needed.
     * @override
     * @private
     */
    _getSearchDomain: function () {
        const searchDomain = this._super.apply(this, arguments);
        const filterByBlogId = parseInt(this.$el.get(0).dataset.filterByBlogId);
        if (filterByBlogId >= 0) {
            searchDomain.push(['blogId', '=', filterByBlogId]);
        }
        return searchDomain;
    },

});
publicWidget.registry.blogPosts = DynamicSnippetBlogPosts;

return DynamicSnippetBlogPosts;
});
