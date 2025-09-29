// # -*- coding: utf-8 -*-
// # Part of Verp. See LICENSE file for full copyright and licensing details.

import { http } from "../../../core"
import { Dict } from "../../../core/helper";
import { setSafeImageHeaders } from "../../../core/http";
import { getModulePath, getResourcePath } from "../../../core/modules";
import { expression } from "../../../core/osv";
import { Forbidden } from "../../../core/service";
import { BaseResponse } from "../../../core/service/middleware/base_response";
import { b64decode, b64encode, bool, f, fileClose, fileOpen, fileRead, imageGuessSizeFromFieldName, imageProcess, itemgetter, len, pop, sorted, subDate, today, update } from "../../../core/tools";

// import base64
// import werkzeug
// import werkzeug.exceptions
// import werkzeug.urls
// import werkzeug.wrappers
// import math

// from dateutil.relativedelta import relativedelta
// from operator import itemgetter

// from verp import fields, http, modules, tools
// from verp.http import request
// from verp.osv import expression

@http.define()
class WebsiteProfile extends http.Controller {
    static _module = module;

    _usersPerPage = 30;
    _pagerMaxPages = 5;

    // Profile
    // ---------------------------------------------------
    /**
     * Base condition to see user avatar independently form access rights
        is to see published users having karma, meaning they participated to
        frontend applications like forum or elearning.
     * @param userId 
     * @param post 
     * @returns 
     */
    async _checkAvatarAccess(req, userId, post: {}={}) {
        let user;
        try {
            user = await (await (await req.getEnv()).items('res.users').sudo()).browse(userId).exists();
        }
        catch(e) {
            return false;
        }
        if (bool(user)) {
            return await user.websitePublished && await user.karma > 0
        }
        return false;
    }

    async _getDefaultAvatar() {
        const imgPath = getResourcePath('web', 'static/img', 'placeholder.png');
        const f = fileOpen(imgPath, 'rb').fd;
        const data = fileRead(f);
        fileClose(f);
        return data.length && b64encode(data);
    }

    async _checkUserProfileAccess(req, userId) {
        const env = await req.getEnv();
        const user = await env.user();
        const userSudo = (await env.items('res.users').sudo()).browse(userId);
        // User can access - no matter what - his own profile
        if (userSudo.id == user.id) {
            return userSudo;
        }
        if (await userSudo.karma == 0 || ! await userSudo.websitePublished ||
            (userSudo.id != req.session.uid && await user.karma < await req.website.karmaProfileMin)) {
            return false;
        }
        return userSudo;
    }

    async _prepareUserValues(req, opts: {}={}) {
        pop(opts, 'editTranslations', null); // avoid nuking editTranslations
        const values = {
            'user': await (await req.getEnv()).user,
            'isPublicUser': await req.website.isPublicUser(),
            'validationEmailSent': req.session.get('validationEmailSent', false),
            'validationEmailDone': req.session.get('validationEmailDone', false),
        }
        update(values, opts);
        return values;
    }

    async _prepareUserProfileParameters(req, post={}) {
        return post;
    }

    async _prepareUserProfileValues(req, user, post={}) {
        return {
            'uid': (await (await req.getEnv()).user).id,
            'user': user,
            'mainObject': user,
            'isProfilePage': true,
            'editButtonUrlParam': '',
        }
    }

    @http.route([
        '/profile/avatar/<int:userId>',
    ], {type: 'http', auth: "public", website: true, sitemap: false})
    async getUserProfileAvatar(req, res, opts: {userId?: any, field?: string, width?: number, height?: number, crop?: boolean}={}) {
        let {userId, field='avatar256', width=0, height=0, crop=false} = opts;
        if (!['image128', 'image256', 'avatar128', 'avatar256'].includes(field)) {
            return new Forbidden();
        }

        const env = await req.getEnv();
        const canSudo = await this._checkAvatarAccess(req, userId, opts);
        let status, headers, imageBase64;
        if (bool(canSudo)) {
            [status, headers, imageBase64] = await (await env.items('ir.http').sudo()).binaryContent(req, 
                {model: 'res.users', id: userId, field: field,
                defaultMimetype: 'image/png'});
        }
        else {
            [status, headers, imageBase64] = await env.items('ir.http').binaryContent(req, 
                {model: 'res.users', id: userId, field: field,
                defaultMimetype: 'image/png'});
        }
        if (status == 301) {
            return env.items('ir.http')._responseByStatus(req, res, status, headers, imageBase64);
        }
        if (status == 304) {
            return new BaseResponse(req, res, null, {status: 304});
        }

        if (!bool(imageBase64)) {
            imageBase64 = await this._getDefaultAvatar();
            if (!(width || height)) {
                [width, height] = imageGuessSizeFromFieldName(field);
            }
        }

        imageBase64 = imageProcess(imageBase64, {size: [Number(width), Number(height)], crop});

        const content = b64decode(imageBase64);
        headers = setSafeImageHeaders(headers, content);
        const response = req.makeResponse(res, content, headers);
        response.statusCode = status;
        return response;
    }

    @http.route(['/profile/user/<int:userId>'], {type: 'http', auth: "public", website: true})
    async viewUserProfile(req, res, opts: {userId?: any}={}) {
        const user = await this._checkUserProfileAccess(res, opts.userId);
        if (!bool(user)) {
            return req.render(res, "website_profile.privateProfile");
        }
        const values = await this._prepareUserValues(res, opts);
        const params = await this._prepareUserProfileParameters(req, opts);
        update(values, await this._prepareUserProfileValues(req, user, params));
        return req.render(res, "website_profile.userProfileMain", values);
    }

    // Edit Profile
    // ---------------------------------------------------
    @http.route('/profile/edit', {type: 'http', auth: "user", website: true})
    async viewUserProfileEdition(req, res, opts={}) {
        const userId = Number(opts['userId'] ?? 0);
        const env = await req.getEnv();
        const countries = await env.items('res.country').search([]);
        let user = await env.user();
        let values;
        if (userId && user.id != userId && await user._isAdmin()) {
            user = env.items('res.users').browse(userId);
            values = await this._prepareUserValues(req, {searches: opts, user, isPublicUser: false});
        }
        else {
            values = await this._prepareUserValues(req, {searches: opts});
        }
        update(values, {
            'emailRequired': opts['emailRequired'],
            'countries': countries,
            'urlParam': opts['urlParam'],
        });
        return req.render(res, "website_profile.userProfileEditMain", values);
    }

    async _profileEditionPreprocessValues(req, user, opts={}) {
        const values = {
            'label': opts['label'],
            'website': opts['website'],
            'email': opts['email'],
            'city': opts['city'],
            'countryId': opts['country'] ? Number(opts['country']) : false,
            'websiteDescription': opts['description'],
        }

        if ('clearImage' in opts) {
            values['image1920'] = false;
        }
        else if (opts['ufile']) {
            const image = await opts['ufile'].read();
            values['image1920'] = b64encode(image);
        }
        if (req.uid == user.id) { // the controller allows to edit only its own privacy settings; use partner management for other cases
            values['websitePublished'] = opts['websitePublished'] == 'true';
        }
        return values;
    }

    @http.route('/profile/user/save', {type: 'http', auth: "user", methods: ['POST'], website: true})
    async saveEditedProfile(req, res, opts={}) {
        const env = await req.getEnv();
        let user = await env.user(); 
        const userId = Number(opts['userId'] ?? 0);
        if (userId && user.id != userId && await user._isAdmin()) {
            user = env.items('res.users').browse(userId);
        }
        const values = await this._profileEditionPreprocessValues(req, user, opts);
        const whitelistedValues = Object.fromEntries(user.SELF_WRITEABLE_FIELDS().filter(key => key in values).map(key => [key, values[key]]));
        await user.write(whitelistedValues);
        if (opts['urlParam']) {
            return req.redirect(res, f("/profile/user/%s?%s", user.id, opts['urlParam']));
        }
        else {
            return req.redirect(res, f("/profile/user/%s", user.id));
        }
    }

    // Ranks and Badges
    // ---------------------------------------------------
    /**
     * Hook for other modules to restrict the badges showed on profile page, depending of the context
     * @param req 
     * @param opts 
     * @returns 
     */
    async _prepareBadgesDomain(opts={}) {
        let domain = [['websitePublished', '=', true]];
        if ('badgeCategory' in opts) {
            domain = expression.AND([[['challengeIds.challengeCategory', '=', opts['badgeCategory']]], domain]);
        }
        return domain;
    }

    async _prepareRanksBadgesValues(req, opts={}) {
        const env = await req.getEnv();
        let ranks = [];
        if (!('badgeCategory' in opts)) {
            const Rank = env.items('gamification.karma.rank');
            ranks = await (await Rank.sudo()).search([], {order: 'karmaMin DESC'});
        }

        const Badge = env.items('gamification.badge');
        let badges = await (await Badge.sudo()).search(await this._prepareBadgesDomain(opts));
        badges = await badges.sorted("grantedUsersCount", true);
        const values = await this._prepareUserValues({searches: {'badges': true}});

        update(values, {
            'ranks': ranks,
            'badges': badges,
            'user': await env.user(),
        });
        return values;
    }

    @http.route('/profile/ranksBadges', {type: 'http', auth: "public", website: true, sitemap: true})
    async viewRanksBadges(req, res, opts={}) {
        const values = await this._prepareRanksBadgesValues(req, opts);
        return req.render(res, "website_profile.rankBadgeMain", values);
    }

    // All Users Page
    // ---------------------------------------------------
    async _prepareAllUsersValues(users) {
        const userValues = [];
        for (const user of users) {
            userValues.push({
                'id': user.id,
                'label': await user.label,
                'companyName': await (await user.companyId).label,
                'rank': await (await user.rankId).label,
                'karma': await user.karma,
                'badgeCount': len(await user.badgeIds),
                'websitePublished': await user.websitePublished
            });
        }
        return userValues;
    }

    @http.route(['/profile/users',
                 '/profile/users/page/<int:page>'], {type: 'http', auth: "public", website: true, sitemap: true})
    async viewAllUsersPage(req, res, opts: {page?: number}={}) {
        const {page=1}= opts;
        const env = await req.getEnv();
        const User = env.items('res.users');
        let dom = [['karma', '>', 1], ['websitePublished', '=', true]];

        // Searches
        const searchTerm = opts['search'];
        const groupby = opts['groupby'] ?? false;
        const renderValues = {
            'search': searchTerm,
            'groupby': groupby || 'all',
        }
        if (searchTerm) {
            dom = expression.AND([['|', ['label', 'ilike', searchTerm], ['partnerId.commercialCompanyName', 'ilike', searchTerm]], dom]);
        }

        const userCount = await (await User.sudo()).searchCount(dom);
        const myUser = await env.user();
        let currentUserValues = false;
        let userValues, pager;
        if (userCount) {
            const pageCount = Math.ceil(userCount / this._usersPerPage);
            pager = await req.website.pager({url: "/profile/users", total: userCount, page: page, step: this._usersPerPage, scope: Math.min(pageCount, this._pagerMaxPages), urlArgs: opts});

            const users = await (await User.sudo()).search(dom, {limit: this._usersPerPage, offset: pager['offset'], order: 'karma DESC'});
            userValues = await this._prepareAllUsersValues(users);

            // Get karma position for users (only websitePublished)
            const positionDomain = [['karma', '>', 1], ['websitePublished', '=', true]];
            const positionMap = await this._getPositionMap(positionDomain, users, groupby);

            const maxPosition = Math.max(...positionMap.values().map(userData => userData['karmaPosition'])) || 1;
            for (const user of userValues) {
                const userData = positionMap.get(user['id'], {});
                user['position'] = userData['karmaPosition'] ?? maxPosition + 1;
                user['karmaGain'] = userData['karmaGainTotal'] ?? 0;
            }
            userValues = sorted(userValues, itemgetter(['position']));

            if (await myUser.websitePublished && await myUser.karma && !users.ids.includes(myUser.id)) {
                // Need to keep the dom to search only for users that appear in the ranking page
                const currentUser = await (await User.sudo()).search(expression.AND([[['id', '=', myUser.id]], dom]));
                if (bool(currentUser)) {
                    const currentUserValues = (await this._prepareAllUsersValues(currentUser))[0];

                    const userData = (await this._getPositionMap(positionDomain, currentUser, groupby)).get(currentUser.id, {});
                    currentUserValues['position'] = userData['karmaPosition'] ?? 0;
                    currentUserValues['karmaGain'] = userData['karmaGainTotal'] ?? 0;
                }
            }
        }
        else {
            userValues = [];
            pager = {'pageCount': 0};
        }
        update(renderValues, {
            'top3Users': !searchTerm && page == 1 ? userValues.slice(0,3) : [],
            'users': userValues,
            'myUser': currentUserValues,
            'pager': pager,
        })
        return req.render(res, "website_profile.usersPageMain", renderValues);
    }

    async _getPositionMap(positionDomain, users, groupby) {
        let positionMap: Dict;
        if (groupby) {
            positionMap = await this._getUserTrackingKarmaGainPosition(users, positionDomain, users.ids, groupby);
        }
        else {
            const positionResults = await users._getKarmaPosition(positionDomain);
            positionMap = Dict.from(positionResults.map(userData => [userData['userId'], userData]));
        }
        return positionMap;
    }

    /**
     * Helper method computing boundaries to give to _getTrackingKarmaGainPosition.
        See that method for more details.
     * @param domain 
     * @param userIds 
     * @param groupby 
     */
    async _getUserTrackingKarmaGainPosition(users, domain, userIds, groupby) {
        let fromDate, toDate = today();
        if (groupby == 'week') {
            fromDate = subDate(toDate, {weeks: 1});
        }
        else if (groupby == 'month') {
            fromDate = subDate(toDate, {months: 1});
        }
        else {
            fromDate = null;
        }
        const results = await users.browse(userIds)._getTrackingKarmaGainPosition(domain, fromDate, toDate);
        return Dict.from(results.map(item => [item['userId'], item]));
    }

    // User and validation
    // --------------------------------------------------

    @http.route('/profile/sendValidationEmail', {type: 'json', auth: 'user', website: true})
    async sendValidationEmail(req, res, opts={}) {
        const env = await req.getEnv();
        if (env.uid != (await req.website.userId).id) {
            await (await env.user())._sendProfileValidationEmail(opts);
        }
        req.session.set('validationEmailSent', true);
        return true;
    }

    @http.route('/profile/validateEmail', {type: 'http', auth: 'public', website: true, sitemap: false})
    async validateEmail(req, res, opts: {token?: string, userId?: number, email?: string}={}) {
        const done = await (await (await req.getEnv()).items('res.users').sudo()).browse(Number(opts.userId))._processProfileValidationToken(opts.token, opts.email);
        if (done) {
            req.session.set('validationEmailDone', true);
        }
        const url = opts['redirectUrl'] ?? '/';
        return req.redirect(res, url);
    }

    @http.route('/profile/validateEmail/close', {type: 'json', auth: 'public', website: true})
    async validateEmailDone(req, res, opts) {
        req.session.set('validationEmailDone', false);
        return true;
    }
}
