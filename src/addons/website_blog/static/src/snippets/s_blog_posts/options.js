verp.define('website_blog.sBlogPostsOptions', function (require) {
'use strict';

const options = require('web_editor.snippets.options');
const dynamicSnippetOptions = require('website.sDynamicSnippetOptions');

var wUtils = require('website.utils');

const dynamicSnippetBlogPostsOptions = dynamicSnippetOptions.extend({
    /**
     *
     * @override
     */
    init: function () {
        this._super.apply(this, arguments);
        this.modelNameFilter = 'blog.post';
        this.blogs = {};
    },
    /**
     * @override
     */
    onBuilt() {
        this._super.apply(this, arguments);
        // TODO Remove in master.
        this.$target[0].dataset['snippet'] = 'sBlogPosts';
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     *
     * @override
     * @private
     */
    _computeWidgetVisibility: function (widgetName, params) {
        if (widgetName === 'hoverEffectOpt') {
            return this.$target.get(0).dataset.templateKey === 'website_blog.dynamicFilterTemplateBlogPostBigPicture';
        }
        return this._super.apply(this, arguments);
    },
    /**
     * Fetches blogs.
     * @private
     * @returns {Promise}
     */
    _fetchBlogs: function () {
        return this._rpc({
            model: 'blog.blog',
            method: 'searchRead',
            kwargs: {
                domain: wUtils.websiteDomain(this),
                fields: ['id', 'label'],
            }
        });
    },
    /**
     *
     * @override
     * @private
     */
    _renderCustomXML: async function (uiFragment) {
        await this._super.apply(this, arguments);
        await this._renderBlogSelector(uiFragment);
    },
    /**
     * Renders the blog option selector content into the provided uiFragment.
     * @private
     * @param {HTMLElement} uiFragment
     */
    _renderBlogSelector: async function (uiFragment) {
        if (!Object.keys(this.blogs).length) {
            const blogsList = await this._fetchBlogs();
            this.blogs = {};
            for (let index in blogsList) {
                this.blogs[blogsList[index].id] = blogsList[index];
            }
        }
        const blogSelectorEl = uiFragment.querySelector('[data-name="blogOpt"]');
        return this._renderSelectUserValueWidgetButtons(blogSelectorEl, this.blogs);
    },
    /**
     * Sets default options values.
     * @override
     * @private
     */
    _setOptionsDefaultValues: function () {
        this._setOptionValue('numberOfElements', 3);
        this._setOptionValue('filterByBlogId', -1);
        this._super.apply(this, arguments);
    },
});

options.registry.dynamicSnippetBlogPosts = dynamicSnippetBlogPostsOptions;

return dynamicSnippetBlogPostsOptions;
});
