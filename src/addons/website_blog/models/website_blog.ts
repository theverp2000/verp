import _ from "lodash";
import { textFromHtml } from "../../website/tools";
import { _Datetime, api, Fields } from "../../../core";
import { _super, MetaModel, Model } from "../../../core/models"
import { bool, f, htmlTranslate, jsonParse, len, strip, unslug } from "../../../core/tools";

@MetaModel.define()
class Blog extends Model {
    static _module = module;
    static _name = 'blog.blog';
    static _description = 'Blog';
    static _parents = [
        'mail.thread',
        'website.seo.metadata',
        'website.multi.mixin',
        'website.cover.properties.mixin',
        'website.searchable.mixin',
    ];
    static _order = 'label';

    static label = Fields.Char('Blog Name', {required: true, translate: true});
    static subtitle = Fields.Char('Blog Subtitle', {translate: true});
    static active = Fields.Boolean('Active', {default: true});
    static content = Fields.Html('Content', {translate: htmlTranslate, sanitize: false});
    static blogPostIds = Fields.One2many('blog.post', 'blogId', {string: 'Blog Posts'});
    static blogPostCount = Fields.Integer("Posts", {compute: '_computeBlogPostCount'});

    @api.depends('blogPostIds')
    async _computeBlogPostCount() {
        for (const record of this) {
            await record.set('blogPostCount', len(await record.blogPostIds));
        }
    }

    async write(vals) {
        const res = await _super(Blog, this).write(vals);
        if ('active' in vals) {
            // archiving/unarchiving a blog does it on its posts, too
            const postIds = await (await this.env.items('blog.post').withContext({activeTest: false})).search([
                ['blogId', 'in', this.ids]
            ]);
            for (const blogPost of postIds) {
                await blogPost.set('active', vals['active']);
            }
        }
        return res;
    }

    /**
     * Temporary workaround to avoid spam. If someone replies on a channel
        through the 'Presentation Published' email, it should be considered as a
        note as we don't want all channel followers to be notified of this answer.
     * @param opts 
     * @returns 
     */
    @api.returns('mail.message', (value) => value.id)
    async messagePost(opts: {parentId?: any, subtypeId?: any}={}) {
        let {parentId=false, subtypeId=false} = opts;
        this.ensureOne();
        if (bool(parentId)) {
            const parentMessage = (await this.env.items('mail.message').sudo()).browse(parentId);
            if (bool(await parentMessage.subtypeId) && (await parentMessage.subtypeId).eq(await this.env.ref('website_blog.mtBlogBlogPublished'))) {
                subtypeId = (await this.env.ref('mail.mtNote')).id;
            }
        }
        return _super(Blog, this).messagePost({...opts, parentId, subtypeId});
    }

    async allTags(join=false, minLimit=1) {
        const BlogTag = this.env.items('blog.tag');
        const sql = `
            SELECT
                p."blogId", count(*), r."blogTagId"
            FROM
                "blogPostBlogTagRel" r
                    join "blogPost" p on r."blogPostId"=p.id
            WHERE
                p."blogId" in (%s)
            GROUP BY
                p."blogId",
                r."blogTagId"
            ORDER BY
                count(*) DESC
        `;
        const result = await this._cr.execute(sql, [String(this.ids) || 'NULL']);
        const tagByBlog = Object.fromEntries(await this.map(i => [i.id, []]));
        const allTags = new Set();
        for (const [blogId, freq, tagId] of result) {
            if (freq >= minLimit) {
                if (join) {
                    allTags.add(tagId);
                }
                else {
                    tagByBlog[blogId].push(tagId);
                }
            }
        }
        if (join) {
            return BlogTag.browse(allTags);
        }

        for (const blogId of Object.keys(tagByBlog)) {
            tagByBlog[blogId] = BlogTag.browse(tagByBlog[blogId]);
        }
        return tagByBlog;
    }

    @api.model()
    async _searchGetDetail(website, order, options) {
        let withDescription = options['displayDescription'];
        let searchFields = ['label'];
        let fetchFields = ['id', 'label'];
        const mapping = {
            'label': {'label': 'label', 'type': 'text', 'match': true},
            'websiteUrl': {'label': 'url', 'type': 'text', 'truncate': false},
        }
        if (withDescription) {
            searchFields.push('subtitle');
            fetchFields.push('subtitle');
            mapping['description'] = {'label': 'subtitle', 'type': 'text', 'match': true}
        }
        return {
            'model': 'blog.blog',
            'baseDomain': [website.website_domain()],
            'searchFields': searchFields,
            'fetchFields': fetchFields,
            'mapping': mapping,
            'icon': 'fa-rss-square',
            'order': order.inludes('label desc') ? 'label desc, id desc' : 'label asc, id desc',
        }
    }

    async _searchRenderResults(fetchFields, mapping, icon, limit) {
        const result = await _super(Blog, this)._searchRenderResults(fetchFields, mapping, icon, limit);
        for (const data of result) {
            data['url'] = f('/blog/%s', data['id']);
        }
        return result;
    }
}

@MetaModel.define()
class BlogTagCategory extends Model {
    static _module = module;
    static _name = 'blog.tag.category';
    static _description = 'Blog Tag Category';
    static _order = 'label';

    static label = Fields.Char('Name', {required: true, translate: true});
    static tagIds = Fields.One2many('blog.tag', 'categoryId', {string: 'Tags'});

    static _sqlConstraints = [
        ['label_uniq', 'unique (label)', "Tag category already exists !"],
    ];
}

@MetaModel.define()
class BlogTag extends Model {
    static _module = module;
    static _name = 'blog.tag';
    static _description = 'Blog Tag';
    static _parents = ['website.seo.metadata'];
    static _order = 'label';

    static label = Fields.Char('Name', {required: true, translate: true});
    static categoryId = Fields.Many2one('blog.tag.category', {string: 'Category', index: true});
    static postIds = Fields.Many2many('blog.post', {string: 'Posts'});

    static _sqlConstraints = [
        ['label_uniq', 'unique (label)', "Tag label already exists !"],
    ];
}

@MetaModel.define()
class BlogPost extends Model {
    static _module = module;
    static _name = "blog.post";
    static _description = "Blog Post";
    static _parents = ['mail.thread', 'website.seo.metadata', 'website.published.multi.mixin',
        'website.cover.properties.mixin', 'website.searchable.mixin'];
    static _order = 'id DESC';

    get _mailPostAccess() { return 'read' };

    async _computeWebsiteUrl() {
        await _super(BlogPost, this)._computeWebsiteUrl();
        for (const blogPost of this) {
            await blogPost.set('websiteUrl', f("/blog/%s/%s", await (await blogPost.blogId).slug(), await blogPost.slug()));
        }
    }

    async _defaultContent() {
        return `
            <p class="o-default-snippet-text">` + await this._t("Start writing here...") + `</p>
        `;
    }

    static label = Fields.Char('Title', {required: true, translate: true, default: ''});
    static subtitle = Fields.Char('Sub Title', {translate: true});
    static authorId = Fields.Many2one('res.partner', {string: 'Author', default: async (self) => (await self.env.user()).partnerId});
    static authorAvatar = Fields.Binary({related: 'authorId.image128', string: "Avatar", readonly: false});
    static authorName = Fields.Char({related: 'authorId.displayName', string: "Author Name", readonly: false, store: true});
    static active = Fields.Boolean('Active', {default: true});
    static blogId = Fields.Many2one('blog.blog', {string: 'Blog', required: true, ondelete: 'CASCADE'});
    static tagIds = Fields.Many2many('blog.tag', {string: 'Tags'});
    static content = Fields.Html('Content', {default: self => self._defaultContent(), translate: htmlTranslate, sanitize: false});
    static teaser = Fields.Text('Teaser', {compute: '_computeTeaser', inverse: '_setTeaser'});
    static teaserManual = Fields.Text({string: 'Teaser Content'});

    static websiteMessageIds = Fields.One2many({domain: self => [['model', '=', self._name], ['messageType', '=', 'comment']]});

    // creation / update stuff
    static createdAt = Fields.Datetime('Created on', {index: true, readonly: true});
    static publishedDate = Fields.Datetime('Published Date');
    static postDate = Fields.Datetime('Publishing date', {compute: '_computePostDate', inverse: '_setPostDate', store: true,
                                help: "The blog post will be visible for your visitors as of this date on the website if it is set as published."});
    static createdUid = Fields.Many2one('res.users', {string: 'Created by', index: true, readonly: true});
    static updatedAt = Fields.Datetime('Last Updated on', {index: true, readonly: true});
    static updatedUid = Fields.Many2one('res.users', {string: 'Last Contributor', index: true, readonly: true});
    static visits = Fields.Integer('No of Views', {copy: false, default: 0});
    static websiteId = Fields.Many2one({related: 'blogId.websiteId', readonly: true, store: true});

    @api.depends('content', 'teaserManual')
    async _computeTeaser() {
        for (const blogPost of this) {
            if (await blogPost.teaserManual) {
                await blogPost.set('teaser', await blogPost.teaserManual);
            }
            else {
                let content = textFromHtml(await blogPost.content);
                content = content.replace(/\\s+/g, ' ').trim();
                await blogPost.set('teaser', content.slice(0, 200) + '...');
            }
        }
    }

    async _setTeaser() {
        for (const blogPost of this) {
            await blogPost.set('teaserManual', await blogPost.teaser);
        }
    }

    @api.depends('createdAt', 'publishedDate')
    async _computePostDate() {
        for (const blogPost of this) {
            if (blogPost.publishedDate) {
                await blogPost.set('postDate', await blogPost.publishedDate);
            }
            else {
                await blogPost.set('postDate', await blogPost.createdAt);
            }
        }
    }

    async _setPostDate() {
        for (const blogPost of this) {
            await blogPost.set('publishedDate', await blogPost.postDate);
            if (! await blogPost.publishedDate) {
                await blogPost._write({postDate: await blogPost.createdAt}); // dont trigger inverse function
            }
        }
    }

    async _checkForPublication(vals) {
        if (vals['isPublished']) {
            for (const post of await this.filtered(p => p.active)) {
                await (await post.blogId).messagePostWithView(
                    'website_blog.blogPostTemplateNewPost',
                    {
                        subject: await post.label,
                        values: {'post': post},
                        subtypeId: await this.env.items('ir.model.data')._xmlidToResId('website_blog.mtBlogBlogPublished')
                    }
                );
            }
            return true;
        }
        return false;
    }

    @api.model()
    async create(vals) {
        const postId = await (await _super(BlogPost, await this.withContext({mailCreateNolog: true}))).create(vals);
        await postId._checkForPublication(vals);
        return postId;
    }

    async write(vals) {
        let result = true;
        // archiving a blog post, unpublished the blog post
        if ('active' in vals && !vals['active']) {
            vals['isPublished'] = false;
        }
        for (const post of this) {
            const copyVals = Object.assign({}, vals);
            const publishedInVals = _.intersection(Object.keys(vals), ['isPublished', 'websitePublished']);
            if (publishedInVals && !('publishedDate' in vals) &&
                    (!await post.publishedDate || await post.publishedDate <= _Datetime.now())) {
                copyVals['publishedDate'] = vals[publishedInVals[0]] && _Datetime.now() || false;
            }
            result = result && await _super(BlogPost, post).write(copyVals);
        }
        await this._checkForPublication(vals);
        return result;
    }

    @api.returns('self', value => value.id)
    async copyData(defaultValue?: any) {
        this.ensureOne();
        const label = await this._t("%s (copy)", await this['label']);
        defaultValue = Object.assign(defaultValue ?? {}, {label});
        return _super(BlogPost, this).copyData(defaultValue);
    }

    /**
     * Instead of the classic form view, redirect to the post on website
        directly if user is an employee or if the post is published.
     * @param accessUid 
     * @returns 
     */
    async getAccessAction(accessUid?: any) {
        this.ensureOne();
        const user = accessUid && (await this.env.items('res.users').sudo()).browse(accessUid) || await this.env.user();
        if (await user.share && !await (await this.sudo()).websitePublished) {
            return _super(BlogPost, this).getAccessAction(accessUid);
        }
        return {
            'type': 'ir.actions.acturl',
            'url': await this['websiteUrl'],
            'target': 'self',
            'targetType': 'public',
            'resId': this.id,
        }
    }

    /**
     * Add access button to everyone if the document is published.
     * @param msgVals 
     * @returns 
     */
    async _notifyGetGroups(msgVals?: any) {
        const groups = await _super(BlogPost, this)._notifyGetGroups(msgVals);

        if (await this['websitePublished']) {
            for (const [groupName, groupMethod, groupData] of groups) {
                groupData['hasButtonAccess'] = true;
            }
        }

        return groups;
    }

    /**
     * Override to avoid keeping all notified recipients of a comment.
        We avoid tracking needaction on post comments. Only emails should be
        sufficient.
     * @param message 
     * @param recipientsData 
     * @param msgVals 
     * @param opts 
     * @returns 
     */
    async _notifyRecordByInbox(message, recipientsData, msgVals=false, opts) {
        if ((msgVals['messageType'] ?? await message.messageType) === 'comment') {
            return;
        }
        return _super(BlogPost, this)._notifyRecordByInbox(message, recipientsData, msgVals, opts);
    }

    async _defaultWebsiteMeta() {
        const res = await _super(BlogPost, this)._defaultWebsiteMeta();
        res['defaultOpengraph']['og:description'] = res['defaultTwitter']['twitter:description'] = await this['subtitle'];
        res['defaultOpengraph']['og:type'] = 'article';
        res['defaultOpengraph']['article:publishedTime'] = await this['postDate'];
        res['defaultOpengraph']['article:modifiedTime'] = await this['updatedAt'];
        res['defaultOpengraph']['article:tag'] = await (await this['tagIds']).mapped('label');
        // background-image might contain single quotes eg `url('/my/url')`
        res['defaultOpengraph']['og:image'] = res['defaultTwitter']['twitter:image'] = strip((jsonParse(await this['coverProperties'])['background-image'] ?? 'none').slice(4,-1), "'");
        res['defaultOpengraph']['og:title'] = res['defaultTwitter']['twitter:title'] = await this['label'];
        res['defaultMetaDescription'] = await this['subtitle'];
        return res;
    }

    @api.model()
    async _searchGetDetail(website, order, options) {
        const withDescription = options['displayDescription'],
        withDate = options['displayDetail'],
        blog = options['blog'],
        tags = options['tag'],
        dateBegin = options['dateBegin'],
        dateEnd = options['dateEnd'],
        state = options['state'],
        domain = [await website.websiteDomain()];
        if (bool(blog)) {
            domain.push([['blogId', '=', unslug(blog)[1]]]);
        }
        if (tags) {
            let activeTagIds = tags.split(',').map(tag => unslug(tag)[1]);
            activeTagIds = activeTagIds.length ? activeTagIds : [];
            if (activeTagIds.length) {
                domain.push([['tagIds', 'in', activeTagIds]]);
            }
        }
        if (dateBegin && dateEnd) {
            domain.push([["postDate", ">=", dateBegin], ["postDate", "<=", dateEnd]]);
        }
        if (await (await this.env.user()).hasGroup('website.groupWebsiteDesigner')) {
            if (state === "published") {
                domain.push([["websitePublished", "=", true], ["postDate", "<=", _Datetime.now()]]);
            }
            else if (state === "unpublished") {
                domain.push(['|', ["websitePublished", "=", false], ["postDate", ">", _Datetime.now()]]);
            }
        }
        else {
            domain.push([["postDate", "<=", _Datetime.now()]]);
        }
        const searchFields = ['label', 'authorName'];
        
        async function searchInTags(env, searchTerm) {
            const tagsLikeSearch = await env.items('blog.tag').search([['label', 'ilike', searchTerm]]);
            return [['tagIds', 'in', tagsLikeSearch.ids]];
        }
        
        const fetchFields = ['label', 'websiteUrl'];
        const mapping = {
            'label': {'label': 'label', 'type': 'text', 'match': true},
            'websiteUrl': {'label': 'websiteUrl', 'type': 'text', 'truncate': false},
        }
        if (withDescription) {
            searchFields.push('content');
            fetchFields.push('content');
            mapping['description'] = {'label': 'content', 'type': 'text', 'html': true, 'match': true}
        }
        if (withDate) {
            fetchFields.push('publishedDate');
            mapping['detail'] = {'label': 'publishedDate', 'type': 'date'}
        }
        return {
            'model': 'blog.post',
            'baseDomain': domain,
            'searchFields': searchFields,
            'searchExtra': searchInTags,
            'fetchFields': fetchFields,
            'mapping': mapping,
            'icon': 'fa-rss',
        }
    }
}
