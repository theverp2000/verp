import { api } from "../../../core";
import { _super, MetaModel, Model } from "../../../core/models"
import { bool, enumerate, f, len, parseInt, urlFor } from "../../../core/tools";

@MetaModel.define()
class Website extends Model {
    static _module = module;
    static _parents = "website";

    @api.model()
    async pageSearchDependencies(pageId=false) {
        const dep = await _super(Website, this).pageSearchDependencies(pageId);

        const page = this.env.items('website.page').browse(parseInt(pageId));
        let path = await page.url;

        const dom = [
            ['content', 'ilike', path]
        ];
        const posts = await this.env.items('blog.post').search(dom);
        let pageKey;
        if (bool(posts)) {
            pageKey = await this._t('Blog Post');
            if (len(posts) > 1) {
                pageKey = await this._t('Blog Posts');
            }
            dep[pageKey] = [];
        }
        for (const p of posts) {
            dep[pageKey].push({
                'text': await this._t('Blog Post <b>%s</b> seems to have a link to this page !', await p.label),
                'item': await p.label,
                'link': await p.websiteUrl,
            });
        }

        return dep;
    }

    @api.model()
    async pageSearchKeyDependencies(pageId=false) {
        const dep = await _super(Website, this).pageSearchKeyDependencies(pageId);

        const page = this.env.items('website.page').browse(parseInt(pageId));
        const key = await page.key;

        const dom = [
            ['content', 'ilike', key]
        ];
        const posts = await this.env.items('blog.post').search(dom);
        let pageKey;
        if (bool(posts)) {
            pageKey = await this._t('Blog Post');
            if (len(posts) > 1) {
                pageKey = await this._t('Blog Posts');
            }
            dep[pageKey] = [];
        }
        for (const p of posts) {
            dep[pageKey].push({
                'text': await this._t('Blog Post <b>%s</b> seems to be calling this file !', await p.label),
                'item': await p.label,
                'link': await p.websiteUrl,
            });
        }

        return dep;
    }

    async getSuggestedControllers(req) {
        const suggestedControllers = await _super(Website, this).getSuggestedControllers(req);
        suggestedControllers.push([await this._t('Blog'), urlFor(req, '/blog'), 'website_blog']);
        return suggestedControllers;
    }

    async configuratorSetMenuLinks(menuCompany, moduleData) {
        const blogs = moduleData['#blog'] ?? [];
        for (const [idx, blog] of enumerate(blogs)) {
            const newBlog = await this.env.items('blog.blog').create({
                'label': blog['label'],
                'websiteId': this.id,
            });
            const blogMenuValues = {
                'label': blog['label'],
                'url': f('/blog/%s', newBlog.id),
                'sequence': blog['sequence'],
                'parentId': bool(menuCompany) ? menuCompany.id : (await this['menuId']).id,
                'websiteId': this.id,
            }
            if (idx == 0) {
                const blogMenu = await this.env.items('website.menu').search([['url', '=', '/blog'], ['websiteId', '=', this.id]]);
                await blogMenu.write(blogMenuValues);
            }
            else {
                await this.env.items('website.menu').create(blogMenuValues);
            }
        }
        await _super(Website, this).configuratorSetMenuLinks(menuCompany, moduleData);
    }

    async _searchGetDetails(searchType, order, options) {
        const result = await _super(Website, this)._searchGetDetails(searchType, order, options);
        if (['blogs', 'blogsOnly', 'all'].includes(searchType)) {
            result.push(await this.env.items('blog.blog')._searchGetDetail(this, order, options));
        }
        if (['blogs', 'blogPostsOnly', 'all'].includes(searchType)) {
            result.push(await this.env.items('blog.post')._searchGetDetail(this, order, options));
        }
        return result;
    }
}