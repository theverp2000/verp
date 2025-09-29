import URL from 'node:url';
import { _Datetime, http } from "../../../core"
import { OrderedDict } from "../../../core/helper";
import { WebRequest, WebResponse } from "../../../core/http";
import { NotFound } from "../../../core/service";
import { bool, f, getLang, groupby, html2Text, incrementFieldSkiplock, isInstance, len, parseInt, remove, setOptions, slug, sortedAsync, stringPart, timezone, toFormat, unslug, URI } from "../../../core/tools";
import { QueryURL, queryURL } from '../../website';
import { buildUrlWParams } from '../../portal';

@http.define()
class WebsiteBlog extends http.Controller {
    static _module = module;
    
    static _blogPostPerPage = 12;  // multiple of 2,3,4
    static _postCommentPerPage = 10;

    get _blogPostPerPage() {
        return WebsiteBlog._blogPostPerPage;
    }

    get _postCommentPerPage() {
        return WebsiteBlog._postCommentPerPage;
    }

    async tagsList(req, tagIds, currentTag) {
        tagIds = Array.from(tagIds);  // required to avoid using the same list
        if (tagIds.includes(currentTag)) {
            remove(tagIds, currentTag);
        }
        else {
            tagIds.push(currentTag);
        }
        tagIds = (await req.getEnv()).items('blog.tag').browse(tagIds);
        return (await Promise.all(tagIds.map(async (tag) => tag.slug()))).join(',');
    }

    async navList(req, res, blog?: any) {
        let dom = blog && [['blogId', '=', blog.id]] || [];
        const env = await req.getEnv();
        if (!await (await env.user()).hasGroup('website.groupWebsiteDesigner')) {
            dom = dom.concat([['postDate', '<=', _Datetime.now()]]);
        }
        const groups = await env.items('blog.post')._readGroupRaw(
            dom,
            ['label', 'postDate'],
            ["postDate"], {orderby: "postDate desc"});
        for (const group of groups) {
            const [r, label] = await group['postDate'];
            let [start, end] = r.split('/');
            group['postDate'] = label;
            group['dateBegin'] = start;
            group['dateEnd'] = end;

            const locale = (await (await getLang(env)).code).replace(/_/g, '-');
            start = _Datetime.toDatetime(start);
            const tz = timezone(req.context['tz'] ?? 'utc') || 'utc';

            group['month'] = toFormat(start, 'MMMM', {zone: tz, locale: locale});
            group['year'] = toFormat(start, 'yyyy', {zone: tz, locale: locale});
        }
        return new OrderedDict(Array.from(groupby(groups, g => g['year'])).map(([year, months]) => [year, [...months]]));
    }

    /**
     * Prepare all values to display the blogs index page or one specific blog
     * @param blogs 
     * @param blog 
     * @param dateBegin 
     * @param dateEnd 
     * @param tags 
     * @param state 
     * @param page 
     * @param search 
     */
    async _prepareBlogValues(req: WebRequest, res, opts: {blogs?: any, blog?: any, dateBegin?: any, dateEnd?: any, tags?: any, state?: any, page?: any, search?: any}={}) {
        const {blogs, blog=false, dateBegin=false, dateEnd=false, tags=false, state=false, page=false, search} = opts;
        const env = await req.getEnv()
        const BlogPost = env.items('blog.post');
        const BlogTag = env.items('blog.tag');

        // prepare domain
        let domain = await req.website.websiteDomain();

        if (bool(blog)) {
            domain = domain.concat([['blogId', '=', blog.id]]);
        }

        if (dateBegin && dateEnd) {
            domain = domain.concat([["postDate", ">=", dateBegin], ["postDate", "<=", dateEnd]]);
        }
        const activeTagIds = tags && tags.split(',').map(tag => unslug(tag)[1]) || [];
        let activeTags = BlogTag;
        if (bool(activeTagIds)) {
            activeTags = await BlogTag.browse(activeTagIds).exists();
            const fixedTagSlug = (await Promise.all(activeTags.map(async (tag) => slug([tag.id, await tag.seoName || await tag.displayName])))).join(',');
            if (fixedTagSlug != tags) {
                const path = req.httpRequest.path;
                const newUrl = path.replaceAll(f("/tag/%s", tags), fixedTagSlug && f("/tag/%s", fixedTagSlug) || "");
                if (newUrl != path) {  // check that really replaced and avoid loop
                    return req.redirect(res, newUrl, 301);
                }
            }
            domain = domain.concat([['tagIds', 'in', activeTags.ids]]);
        }

        let publishedCount, unpublishedCount;
        if (await (await env.user()).hasGroup('website.groupWebsiteDesigner')) {
            const countDomain = domain.concat([["websitePublished", "=", true], ["postDate", "<=", _Datetime.now()]]);
            publishedCount = await BlogPost.searchCount(countDomain);
            unpublishedCount = (await BlogPost.searchCount(domain)).sub(publishedCount);

            if (state === "published") {
                domain = domain.concat([["websitePublished", "=", true], ["postDate", "<=", _Datetime.now()]]);
            }
            else if (state === "unpublished") {
                domain = domain.concat(['|', ["websitePublished", "=", false], ["postDate", ">", _Datetime.now()]]);
            }
        }
        else {
            domain = domain.concat([["postDate", "<=", _Datetime.now()]]);
        }

        const useCover = await req.website.isViewActive('website_blog.optBlogCoverPost');
        const fullwidthCover = await req.website.isViewActive('website_blog.optBlogCoverPostFullwidthDesign');

        // if blog, we show blog title, if use_cover and not fullwidth_cover we need pager + latest always
        let offset = (page - 1) * this._blogPostPerPage
        if (!blog && useCover && !fullwidthCover && !tags && !dateBegin && !dateEnd && !search) {
            offset += 1;
        }

        const options = {
            'displayDescription': true,
            'displayDetail': false,
            'displayExtraDetail': false,
            'displayExtraLink': false,
            'displayImage': false,
            'allowFuzzy': !req.params['noFuzzy'],
            'blog': blog ? String(blog.id) : null,
            'tag': activeTags.ids.map(id => String(id)).join(','),
            'dateBegin': dateBegin,
            'dateEnd': dateEnd,
            'state': state,
        }
        const [total, details, fuzzySearchTerm] = await req.website._searchWithFuzzy("blogPostsOnly", search,
            {limit: page * this._blogPostPerPage, order: "isPublished desc, postDate desc, id asc", options: options});
        let posts = details[0]['results'] ?? BlogPost;
        let firstPost = BlogPost;
        // TODO adapt next line in master.
        if (bool(posts) && !bool(blog) && await posts[0].websitePublished && !search) {
            firstPost = posts[0];
        }
        posts = posts.slice(offset, offset + this._blogPostPerPage);

        const urlArgs = {}
        if (search) {
            urlArgs["search"] = search;
        }

        if (dateBegin && dateEnd) {
            urlArgs["dateBegin"] = dateBegin;
            urlArgs["dateEnd"] = dateEnd;
        }

        const pager = await req.website.pager({
            url: stringPart(req.httpRequest.pathname, '/page/')[0],
            total: total,
            page: page,
            step: this._blogPostPerPage,
            urlArgs: urlArgs,
        });

        let allTags;
        if (!bool(blogs)) {
            allTags = env.items('blog.tag');
        }
        else {
            allTags = !bool(blog) ? await blogs.allTags(true) : ((await blogs.allTags())[blog.id] ?? env.items('blog.tag'));
        }
        const tagCategory = await sortedAsync(await allTags.mapped('categoryId'), async (category) => (await category.label).toUpperCase());
        const otherTags = await sortedAsync(await allTags.filtered(async x => !bool(await x.categoryId)), async (tag) => (await tag.label).toUpperCase());

        // for performance prefetch the first post with the others
        const postIds = firstPost.or(posts).ids;
        // and avoid accessing related blogs one by one
        const blogId = await posts.blogId;

        return {
            'dateBegin': dateBegin,
            'dateEnd': dateEnd,
            'firstPost': firstPost.withPrefetch(postIds),
            'otherTags': otherTags,
            'tagCategory': tagCategory,
            'navList': await this.navList(req, res),
            'tagsList': this.tagsList,
            'pager': pager,
            'posts': posts.withPrefetch(postIds),
            'tag': tags,
            'activeTagIds': activeTags.ids,
            'domain': domain,
            'stateInfo': state && {"state": state, "published": publishedCount, "unpublished": unpublishedCount},
            'blogs': blogs,
            'blog': blog,
            'search': fuzzySearchTerm || search,
            'searchCount': total,
            'originalSearch': fuzzySearchTerm && search,
        }
    }

    @http.route([
        '/blog',
        '/blog/page/<int:page>',
        '/blog/tag/<string:tag>',
        '/blog/tag/<string:tag>/page/<int:page>',
        '/blog/<model("blog.blog"):blog>',
        '/blog/<model("blog.blog"):blog>/page/<int:page>',
        '/blog/<model("blog.blog"):blog>/tag/<string:tag>',
        '/blog/<model("blog.blog"):blog>/tag/<string:tag>/page/<int:page>',
    ], {type: 'http', auth: "public", website: true, sitemap: true})
    async blog(req: WebRequest, res, opts: {blog?: any, tag?: any, page?: number, search?: any, dateBegin?: any, dateEnd?: any, state?: any}={}) {
        let {blog, tag, page=1, search} = opts;
        const env = await req.getEnv();
        const Blog = env.items('blog.blog');

        // This is a fix for templates wrongly using the
        // 'blog_url' QueryURL which is defined below. Indeed, in the case where
        // we are rendering a blog page where no specific blog is selected we
        // define(d) that as `QueryURL('/blog', ['tag'], ...)` but then some
        // parts of the template used it like this: `blog_url(blog=XXX)` thus
        // generating an URL like "/blog?blog=blog.blog(2,)". Adding "blog" to
        // the list of params would not be right as would create "/blog/blog/2"
        // which is still wrong as we want "/blog/2". And of course the "/blog"
        // prefix in the QueryURL definition is needed in case we only specify a
        // tag via `blogUrl(tab=X)` (we expect /blog/tag/X). Patching QueryURL
        // or making blogUrl a custom function instead of a QueryURL instance
        // could be a solution but it was judged not stable enough. We'll do that
        // in master. Here we only support "/blog?blog=blog.blog(2,)" URLs.
        if (typeof blog === 'string') {
            blog = Blog.browse(parseInt(blog.match(/\d+/)[0]));
            if (!bool(await blog.exists())) {
                throw new NotFound(res);
            }
        }
        const blogs = await Blog.search(await req.website.websiteDomain(), {order: "createdAt asc, id asc"});

        if (!bool(blog) && len(blogs) == 1) {
            const url = await queryURL(f('/blog/%s', await blogs[0].slug()), opts);
            return req.redirect(res, url, 302);
        }
        const {dateBegin, dateEnd, state} = opts;

        if (tag && req.httpRequest.method === 'GET') {
            // redirect get tag-1,tag-2 -> get tag-1
            const tags = tag.split(',');
            if (tags.length > 1) {
                const url = await queryURL(blog ? '' : '/blog', ['blog', 'tag'], {blog, tag: tags[0], dateBegin, dateEnd, search: opts.search});
                return req.redirect(res, url, 302);
            }
        }
        const values = await this._prepareBlogValues(req, res, {blogs, blog, dateBegin, dateEnd, tags: tag, state, page, search});

        // in case of a redirection need by `_prepareBlogValues` we follow it
        if (isInstance(values, WebResponse)) {
            return values;
        }

        if (bool(blog)) {
            values['mainObject'] = blog;
            values['editInBackend'] = true;
            values['blogUrl'] = new QueryURL('', ['blog', 'tag'], {blog, tag, dateBegin, dateEnd, search});
        }
        else {
            values['blogUrl'] = new QueryURL('/blog', ['tag'], {dateBegin, dateEnd, search});
        }

        return req.render(res, "website_blog.blogPostShort", values);
    }

    @http.route(['/blog/<model("blog.blog"):blog>/feed'], {type: 'http', auth: "public", website: true, sitemap: true})
    async blogFeed(req: WebRequest, res, opts: {blog?: any, limit?: any}={}) {
        const {blog, limit='15'} = opts;
        const values = {};
        values['blog'] = blog;
        values['baseUrl'] = await blog.getBaseUrl();
        values['posts'] = await (await req.getEnv()).items('blog.post').search([['blogId', '=', blog.id]], {limit: Math.min(parseInt(limit), 50), order:"postDate DESC"});
        values['html2Text'] = html2Text;
        return req.render(res, "website_blog.blogFeed", values, true, {headers: [['Content-Type', 'application/atom+xml']]});
    }

    @http.route([
        `/blog/<model("blog.blog"):blog>/post/<model("blog.post", "[['blogId','=',blog.id]]"):blog_post>`,
    ], {type: 'http', auth: "public", website: true, sitemap: false})
    async oldBlogPost(req, res, opts: {blog?: any, blogPost?: any, tagId?: any, page?: number, enableEditor?: any}={}) {
        const {blog, blogPost, tagId, page=1, enableEditor} = opts;
        return req.redirect(req, buildUrlWParams(f("/blog/%s/%s", await blog.slug(), await blogPost.slug()), req.params), 301);
    }

    /**
     * Prepare all values to display the blog.

        @returns dict values values for the templates, containing
         - 'blogPost': browse of the current post
         - 'blog': browse of the current blog
         - 'blogs': list of browse records of blogs
         - 'tag': current tag, if tag_id in parameters
         - 'tags': all tags, for tag-based navigation
         - 'pager': a pager on the comments
         - 'navList': a dict [year][month] for archives navigation
         - 'nextPost': next blog post, to direct the user towards the next interesting post
     */
    @http.route([
        `/blog/<model("blog.blog"):blog>/<model("blog.post", "[['blogId','=',blog.id]]"):blogPost>`,
    ], {type: 'http', auth: "public", website: true, sitemap: true})
    async blogPost(req: WebRequest, res, post: {blog?: any, blogPost?: any, tagId?: any, page?: any, enableEditor?: any}={}) {
        const {blog, blogPost, tagId, page=1, enableEditor} = post;
        const env = await req.getEnv();
        const BlogPost = env.items('blog.post');
        const [dateBegin, dateEnd] = [post['dateBegin'], post['dateEnd']];

        const domain = await req.website.websiteDomain();
        const blogs = await blog.search(domain, {order: "createdAt, id asc"});

        let tag;
        if (tagId) {
            tag = env.items('blog.tag').browse(parseInt(tagId));
        }
        const blogUrl = new QueryURL('', ['blog', 'tag'], {blog: await blogPost.blogId, tag, dateBegin, dateEnd});

        if (!(await blogPost.blogId).id == blog.id) {
            return req.redirect(res, f("/blog/%s/%s", await (await blogPost.blogId).slug(), await blogPost.slug()), 301);
        }

        let tags = await env.items('blog.tag').search([]);

        // Find next Post
        let blogPostDomain = [['blogId', '=', blog.id]];
        if (! await (await env.user()).hasGroup('website.groupWebsiteDesigner')) {
            blogPostDomain = blogPostDomain.concat([['postDate', '<=', _Datetime.now()]]);
        }

        const allPost = await BlogPost.search(blogPostDomain);

        if (!allPost.includes(blogPost)) {
            return req.redirect(res, f("/blog/%s", await (await blogPost.blogId).slug()));
        }

        // should always return at least the current post
        const allPostIds: any[] = allPost.ids;
        const currentBlogPostIndex = allPostIds.indexOf(blogPost.id);
        const nbPosts = len(allPostIds);
        const nextPostId = nbPosts > 1 ? allPostIds[(currentBlogPostIndex + 1) % nbPosts] : null;
        const nextPost = nextPostId && BlogPost.browse(nextPostId) || false;

        const values = {
            'tags': tags,
            'tag': tag,
            'blog': blog,
            'blogPost': blogPost,
            'blogs': blogs,
            'mainObject': blogPost,
            'navList': await this.navList(req, res, blog),
            'enableEditor': enableEditor,
            'nextPost': nextPost,
            'date': dateBegin,
            'blogUrl': blogUrl,
        }
        const result = await req.render(res, "website_blog.blogPostComplete", values);

        if (!req.session.get('postsViewed', []).includes(blogPost.id)) {
            if (await incrementFieldSkiplock(blogPost, 'visits')) {
                if (!req.session.get('postsViewed')) {
                    req.session['postsViewed'] = [];
                }
                req.session['postsViewed'].push(blogPost.id);
                req.session.modified = true;
            }
        }
        return result;
    }

    @http.route('/blog/<int:blogId>/post/new', {type: 'http', auth: "user", website: true})
    async blogPostCreate(req, res, post: {blogId?: any}={}) {
        // Use sudo so this line prevents both editor and admin to access blog from another website
        // as browse() will return the record even if forbidden by security rules but editor won't
        // be able to access it
        const env = await req.getEnv(); 
        if (!await (await env.items('blog.blog').browse(post.blogId).sudo()).canAccessFromCurrentWebsite()) {
            throw new NotFound(res);
        }

        const newBlogPost = await env.items('blog.post').create({
            'blogId': post.blogId,
            'isPublished': false,
        });
        return req.redirect(res, f("/blog/%s/%s?enableEditor=1", await (await newBlogPost.blogId).slug(), await newBlogPost.slug()));
    }

    /**
     * Duplicate a blog.
        @params blogPostId id of the blog post currently browsed.
        @returns redirect to the new blog created
     */
    @http.route('/blog/postDuplicate', {type: 'http', auth: "user", website: true, methods: ['POST']})
    async blogPostCopy(req, res, post: {blogPostId?: any}={}) {
        const newBlogPost = await (await (await req.getEnv()).items('blog.post').withContext({mailCreateNosubscribe: true})).browse(parseInt(post.blogPostId)).copy();
        return req.redirect(res, f("/blog/%s/%s?enableEditor=1", await (await newBlogPost.blogId).slug(), await newBlogPost.slug()));
    }
}
