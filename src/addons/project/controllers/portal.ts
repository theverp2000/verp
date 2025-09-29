import { http } from "../../../core";
import { HomeStaticTemplateHelpers } from "../../../core/addons/web";
import { serverWideModules } from "../../../core/conf";
import { AccessError, Dict, MissingError } from "../../../core/helper";
import { WebRequest } from "../../../core/http";
import { AND, OR } from "../../../core/osv/expression";
import { bool, f, groupby as groupbyelem, isInstance, itemgetter, len, markup, sorted, sortedAsync, update } from "../../../core/tools";
import { CustomerPortal } from "../../portal";
import { pager as portalPager } from '../../portal/controllers/portal';

@http.define()
export class ProjectCustomerPortal extends CustomerPortal {
    static _module = module;

    async _prepareHomePortalValues(req, counters) {
        const env = await req.getEnv();
        const values = await super._prepareHomePortalValues(req, counters);
        if ('projectCount' in counters) {
            values['projectCount'] = env.items('project.project').checkAccessRights('read', false)
                ? await env.items('project.project').searchCount([]) : 0;
        }
        if ('taskCount' in counters) {
            values['taskCount'] = await env.items('project.task').searchCount([['projectId', '!=', false]])
                ? await env.items('project.task').checkAccessRights('read', false) : 0;
        }
        return values;
    }

    // ------------------------------------------------------------
    // My Project
    // ------------------------------------------------------------
    async _projectGetPageViewValues(req, project, accessToken, opts: { page?: number, dateBegin?: any, dateEnd?: any, sortby?: any, search?: any, searchIn?: string, groupby?: any } = {}) {
        let { page = 1, dateBegin, dateEnd, sortby, search, searchIn = 'content', groupby } = opts;
        // TODO: refactor this because most of this code is duplicated from portal_my_tasks method
        const values = await this._preparePortalLayoutValues(req);
        const searchbarSortings = await this._taskGetSearchbarSortings();

        const searchbarInputs = await this._taskGetSearchbarInputs();
        const searchbarGroupby = await this._taskGetSearchbarGroupby();

        // default sort by value
        if (!sortby) {
            sortby = 'date';
        }
        let order = searchbarSortings[sortby]['order'];

        // default filter by value
        let domain = [['projectId', '=', project.id]];

        // default group by value
        if (!groupby) {
            groupby = 'project';
        }
        if (dateBegin && dateEnd) {
            domain = domain.concat([['createdAt', '>', dateBegin], ['createdAt', '<=', dateEnd]]);
        }

        // search
        if (search && searchIn) {
            domain = domain.concat(await this._taskGetSearchDomain(req, searchIn, search));
        }

        const env = await req.getEnv();
        let Task = env.items('project.task');
        if (accessToken) {
            Task = await Task.sudo();
        }
        else if (!await (await env.user())._isPublic()) {
            domain = AND([domain, await env.items('ir.rule')._computeDomain(Task._name, 'read')]);
            Task = await Task.sudo();
        }
        // task count
        const taskCount = await Task.searchCount(domain);
        // pager
        const url = f("/my/project/%s", project.id);
        const pager = portalPager({
            url: url,
            urlArgs: { dateBegin, dateEnd, sortby, groupby, searchIn, search, accessToken },
            total: taskCount,
            page: page,
            step: this._itemsPerPage
        });
        // content according to pager and archive selected
        order = await this._taskGetOrder(order, groupby);

        const tasks = await Task.search(domain, { order, limit: this._itemsPerPage, offset: pager['offset'] });
        req.session['myProjectTasksHistory'] = tasks.ids.slice(0, 100);

        const groupbyMapping = await this._taskGetGroupbyMapping();
        const group = groupbyMapping[groupby];
        let groupedTasks;
        if (bool(group)) {
            groupedTasks = Array.from(groupbyelem(tasks, itemgetter(group))).map(([k, g]) => Task.concat(...g));
        }
        else {
            groupedTasks = [tasks];
        }
        update(values, {
            date: dateBegin,
            dateEnd: dateEnd,
            groupedTasks: groupedTasks,
            pageName: 'project',
            defaultUrl: url,
            pager: pager,
            searchbarSortings,
            searchbarGroupby,
            searchbarInputs,
            searchIn,
            search,
            sortby,
            groupby,
            project,
        });
        return this._getPageViewValues(req, project, accessToken, values, 'myProjectsHistory', false, opts);
    }

    @http.route(['/my/projects', '/my/projects/page/<int:page>'], { type: 'http', auth: "user", website: true })
    async portalMyProjects(req, res, opts: { page?: number, dateBegin?: any, dateEnd?: any, sortby?: any } = {}) {
        let { page = 1, dateBegin, dateEnd, sortby } = opts;
        const values = await this._preparePortalLayoutValues(req);
        let Project = (await req.getEnv()).items('project.project');
        let domain = [];

        const searchbarSortings = {
            'date': { 'label': await this._t('Newest'), 'order': 'createdAt desc' },
            'label': { 'label': await this._t('Name'), 'order': 'label' },
        }
        if (!sortby || !(sortby in searchbarSortings)) {
            sortby = 'date';
        }
        const order = searchbarSortings[sortby]['order'];

        if (dateBegin && dateEnd) {
            domain = domain.concat([['createdAt', '>', dateBegin], ['createdAt', '<=', dateEnd]]);
        }

        // projects count
        const projectCount = await Project.searchCount(domain);
        // pager
        const pager = portalPager({
            url: "/my/projects",
            urlArgs: { dateBegin, dateEnd, sortby },
            total: projectCount,
            page: page,
            step: this._itemsPerPage
        });

        // content according to pager and archive selected
        const projects = await Project.search(domain, { order, limit: this._itemsPerPage, offset: pager['offset'] });
        req.session['myProjectsHistory'] = projects.ids.slice(0, 100);

        update(values, {
            'date': dateBegin,
            'dateEnd': dateEnd,
            'projects': projects,
            'pageName': 'project',
            'defaultUrl': '/my/projects',
            'pager': pager,
            'searchbarSortings': searchbarSortings,
            'sortby': sortby
        });
        return req.render(res, "project.portalMyProjects", values);
    }

    @http.route(['/my/project/<int:projectId>', '/my/project/<int:projectId>/page/<int:page>'], { type: 'http', auth: "public", website: true })
    async portalMyProject(req, res, opts: { projectId?: any, accessToken?: any, page?: number, dateBegin?: any, dateEnd?: any, sortby?: any, search?: any, searchIn?: any, groupby?: any } = {}) {
        const { projectId, accessToken, page = 1, dateBegin, dateEnd, sortby, search, searchIn = 'content', groupby } = opts;
        let projectSudo;
        try {
            projectSudo = await this._documentCheckAccess(req, 'project.project', projectId, accessToken);
        } catch (e) {
            if (isInstance(e, AccessError, MissingError)) {
                return req.redirect(res, '/my');
            }
            throw e;
        }
        const user = await (await req.getEnv()).user;
        if (await projectSudo.collaboratorCount && await (await projectSudo.withUser(user))._checkProjectSharingAccess()) {
            return req.render(res, "project.projectSharingPortal", { 'projectId': projectId });
        }
        projectSudo = accessToken ? projectSudo : await projectSudo.withUser(user);
        const values = await this._projectGetPageViewValues(req, projectSudo, accessToken, { ...opts, page, dateBegin, dateEnd, sortby, search, searchIn, groupby });
        values['taskUrl'] = f('project/%s/task', projectId);
        return req.render(res, "project.portalMyProject", values);
    }

    async _prepareProjectSharingSessionInfo(req: WebRequest, project) {
        const env = await req.getEnv();
        const sessionInfo = await env.items('ir.http').sessionInfo();
        const userContext = req.session.uid ? await req.session.getContext(req) : new Dict();
        const mods = serverWideModules ?? [];
        const qwebChecksum = await HomeStaticTemplateHelpers.getQwebTemplatesChecksum(req, { debug: req.session.debug, bundle: "project.assetsQweb" });
        let lang;
        if (env.lang) {
            lang = env.lang;
            sessionInfo['userContext']['lang'] = lang;
            // Update Cache
            userContext['lang'] = lang;
        }
        lang = userContext.get("lang");
        const translationHash = await env.items('ir.translation').getWebTranslationsHash(mods, lang);
        const cacheHashes = {
            "qweb": qwebChecksum,
            "translations": translationHash,
        }

        const projectCompany = await project.companyId;
        update(sessionInfo, {
            cacheHashes: cacheHashes,
            actionName: 'project.projectSharingProjectTaskAction',
            projectId: project.id,
            userCompanies: {
                'currentCompany': projectCompany.id,
                'allowedCompanies': {
                    [projectCompany.id]: {
                        'id': projectCompany.id,
                        'label': await projectCompany.label,
                    },
                },
            },
            // FIXME: See if we prefer to give only the currency that the portal user just need to see the correct information in project sharing
            currencies: await env.items('ir.http').getCurrencies(),
        });
        return sessionInfo;
    }

    @http.route("/my/project/<int:projectId>/projectSharing", { type: "http", auth: "user", methods: ['GET'] })
    async renderProjectBackendView(req, res, opts: { projectId?: any } = {}) {
        const env = await req.getEnv();
        const project = (await env.items('project.project').sudo()).browse(opts.projectId);
        if (!bool(await project.exists()) || !await (await project.withUser(await env.user()))._checkProjectSharingAccess()) {
            return req.notFound(res);
        }

        return req.render(res,
            'project.projectSharingEmbed',
            { 'sessionInfo': await this._prepareProjectSharingSessionInfo(req, project) },
        );
    }

    @http.route('/my/project/<int:projectId>/task/<int:taskId>', { type: 'http', auth: 'public', website: true })
    async portalMyProjectTask(req, res, opts: { projectId?: any, taskId?: any, accessToken?: any } = {}) {
        const { projectId, taskId, accessToken } = opts;
        let projectSudo;
        try {
            projectSudo = await this._documentCheckAccess(req, 'project.project', projectId, accessToken);
        } catch (e) {
            if (isInstance(e, AccessError, MissingError)) {
                return req.redirect(res, '/my');
            }
            throw e;
        }
        const env = await req.getEnv();
        let Task = env.items('project.task');
        if (accessToken) {
            Task = await Task.sudo();
        }
        const taskSudo = await (await Task.search([['projectId', '=', projectId], ['id', '=', taskId]], { limit: 1 })).sudo();
        await (await taskSudo.attachmentIds).generateAccessToken();
        const values = await this._taskGetPageViewValues(req, taskSudo, accessToken, { ...opts, project: projectSudo });
        values['project'] = projectSudo;
        return req.render(res, "project.portal_my_task", values);
    }

    // ------------------------------------------------------------
    // My Task
    // ------------------------------------------------------------
    async _taskGetPageViewValues(req, task, accessToken, opts: {} = {}) {
        const project = opts['project'];
        let projectAccessible, pageName, history;
        if (bool(project)) {
            projectAccessible = true;
            pageName = 'projectTask';
            history = 'myProjectTasksHistory';
        }
        else {
            pageName = 'task';
            history = 'myTasksHistory';
            try {
                projectAccessible = bool((await task.projectId).id && await this._documentCheckAccess(req, 'project.project', (await task.projectId).id));
            } catch (e) {
                if (isInstance(e, AccessError, MissingError)) {
                    projectAccessible = false;
                } else {
                    throw e;
                }
            }
        }
        let values = {
            'pageName': pageName,
            'task': task,
            'user': await (await req.getEnv()).user(),
            'projectAccessible': projectAccessible,
        }

        values = await this._getPageViewValues(req, task, accessToken, values, history, false, opts);
        if (bool(project)) {
            const histories = req.session.get('myProjectTasksHistory', []);
            let currentTaskIndex = histories.indexOf(task.id);
            if (currentTaskIndex < 0) {
                return values;
            }
            const totalTask = len(histories);
            const taskUrl = `${await (await task.projectId).accessUrl}/task/%s?model=project.project&resId=${values['user'].id}&accessToken=${accessToken}`;

            values['prevRecord'] = currentTaskIndex != 0 && f(taskUrl, histories[currentTaskIndex - 1]);
            values['nextRecord'] = currentTaskIndex < totalTask - 1 && f(taskUrl, histories[currentTaskIndex + 1]);
        }

        return values;
    }

    async _taskGetSearchbarSortings() {
        return {
            'date': { 'label': await this._t('Newest'), 'order': 'createdAt desc', 'sequence': 1 },
            'label': { 'label': await this._t('Title'), 'order': 'label', 'sequence': 2 },
            'project': { 'label': await this._t('Project'), 'order': 'projectId, stageId', 'sequence': 3 },
            'users': { 'label': await this._t('Assignees'), 'order': 'userIds', 'sequence': 4 },
            'stage': { 'label': await this._t('Stage'), 'order': 'stageId, projectId', 'sequence': 5 },
            'status': { 'label': await this._t('Status'), 'order': 'kanbanState', 'sequence': 6 },
            'priority': { 'label': await this._t('Priority'), 'order': 'priority desc', 'sequence': 7 },
            'dateDeadline': { 'label': await this._t('Deadline'), 'order': 'dateDeadline asc', 'sequence': 8 },
            'update': { 'label': await this._t('Last Stage Update'), 'order': 'dateLastStageUpdate desc', 'sequence': 10 },
        }
    }

    async _taskGetSearchbarGroupby() {
        const values = {
            'none': { 'input': 'none', 'label': await this._t('None'), 'order': 1 },
            'project': { 'input': 'project', 'label': await this._t('Project'), 'order': 2 },
            'stage': { 'input': 'stage', 'label': await this._t('Stage'), 'order': 4 },
            'status': { 'input': 'status', 'label': await this._t('Status'), 'order': 5 },
            'priority': { 'input': 'priority', 'label': await this._t('Priority'), 'order': 6 },
            'customer': { 'input': 'customer', 'label': await this._t('Customer'), 'order': 9 },
        }
        return Object.fromEntries(sorted(Object.entries(values), item => item[1]["order"]));
    }

    async _taskGetGroupbyMapping() {
        return {
            'project': 'projectId',
            'stage': 'stageId',
            'customer': 'partnerId',
            'priority': 'priority',
            'status': 'kanbanState',
        }
    }

    async _taskGetOrder(order, groupby) {
        const groupbyMapping = await this._taskGetGroupbyMapping();
        const fieldName = groupbyMapping[groupby] ?? '';
        if (!fieldName) {
            return order;
        }
        return f('%s, %s', fieldName, order);
    }

    async _taskGetSearchbarInputs() {
        const values = {
            'all': { 'input': 'all', 'label': await this._t('Search in All'), 'order': 1 },
            'content': { 'input': 'content', 'label': markup(await this._t('Search <span class="nolabel"> (in Content)</span>')), 'order': 1 },
            'ref': { 'input': 'ref', 'label': await this._t('Search in Ref'), 'order': 1 },
            'project': { 'input': 'project', 'label': await this._t('Search in Project'), 'order': 2 },
            'users': { 'input': 'users', 'label': await this._t('Search in Assignees'), 'order': 3 },
            'stage': { 'input': 'stage', 'label': await this._t('Search in Stages'), 'order': 4 },
            'status': { 'input': 'status', 'label': await this._t('Search in Status'), 'order': 5 },
            'priority': { 'input': 'priority', 'label': await this._t('Search in Priority'), 'order': 6 },
            'message': { 'input': 'message', 'label': await this._t('Search in Messages'), 'order': 10 },
        }
        return Object.fromEntries(sorted(Object.entries(values), item => item[1]["order"]));
    }

    async _taskGetSearchDomain(req, searchIn, search) {
        const searchDomain = [];
        if (['content', 'all'].includes(searchIn)) {
            searchDomain.push([['label', 'ilike', search]]);
            searchDomain.push([['description', 'ilike', search]]);
        }
        if (['customer', 'all'].includes(searchIn)) {
            searchDomain.push([['partnerId', 'ilike', search]]);
        }
        if (['message', 'all'].includes(searchIn)) {
            searchDomain.push([['messageIds.body', 'ilike', search]]);
        }
        if (['stage', 'all'].includes(searchIn)) {
            searchDomain.push([['stageId', 'ilike', search]]);
        }
        if (['project', 'all'].includes(searchIn)) {
            searchDomain.push([['projectId', 'ilike', search]]);
        }
        if (['ref', 'all'].includes(searchIn)) {
            searchDomain.push([['id', 'ilike', search]]);
        }
        if (['users', 'all'].includes(searchIn)) {
            const userIds = await (await (await req.getEnv()).items('res.users').sudo()).search([['label', 'ilike', search]]);
            searchDomain.push([['userIds', 'in', userIds.ids]]);
        }
        if (['priority', 'all'].includes(searchIn)) {
            searchDomain.push([['priority', 'ilike', search == 'normal' && '0' || '1']]);
        }
        if (['status', 'all'].includes(searchIn)) {
            searchDomain.push([
                ['kanbanState', 'ilike', search == 'In Progress' ? 'normal' :
                    search == 'Ready' ? 'done' :
                        search == 'Blocked' ? 'blocked' : search]
            ]);
        }
        return OR(searchDomain);
    }

    @http.route(['/my/tasks', '/my/tasks/page/<int:page>'], { type: 'http', auth: "user", website: true })
    async portalMyTasks(req, res, opts: { page?: any, dateBegin?: any, dateEnd?: any, sortby?: any, filterby?: any, search?: any, searchIn?: any, groupby?: any } = {}) {
        let { page = 1, dateBegin, dateEnd, sortby, filterby, search, searchIn = 'content', groupby } = opts;
        const values = await this._preparePortalLayoutValues(req);
        let searchbarSortings: {} = await this._taskGetSearchbarSortings();
        searchbarSortings = Object.fromEntries(sorted(Object.entries(await this._taskGetSearchbarSortings()),
            item => item[1]["sequence"]));

        const searchbarFilters = {
            'all': { 'label': await this._t('All'), 'domain': [['projectId', '!=', false]] },
        }

        const searchbarInputs = await this._taskGetSearchbarInputs();
        const searchbarGroupby = await this._taskGetSearchbarGroupby();

        // extends filterby criteria with project the customer has access to
        const env = await req.getEnv();
        const projects = await env.items('project.project').search([]);
        for (const project of projects) {
            update(searchbarFilters, {
                [project.id]: { 'label': await project.label, 'domain': [['projectId', '=', project.id]] }
            });
        }

        // extends filterby criteria with project (criteria name is the project id)
        // Note: portal users can't view projects they don't follow
        const projectGroups = await env.items('project.task').readGroup([['projectId', 'not in', projects.ids]],
            ['projectId'], ['projectId']);
        for (const group of projectGroups) {
            const projId = group['projectId'] ? group['projectId'][0] : false;
            const projName = group['projectId'] ? group['projectId'][1] : await this._t('Others');
            update(searchbarFilters, {
                [projId]: { 'label': projName, 'domain': [['projectId', '=', projId]] }
            });
        }

        // default sort by value
        if (!sortby) {
            sortby = 'date';
        }
        let order = searchbarSortings[sortby]['order'];

        // default filter by value
        if (!filterby) {
            filterby = 'all';
        }
        let domain = (searchbarFilters[filterby] ?? searchbarFilters['all'])['domain'];

        // default group by value
        if (groupby) {
            groupby = 'project';
        }
        if (dateBegin && dateEnd) {
            domain = domain.concat([['createdAt', '>', dateBegin], ['createdAt', '<=', dateEnd]]);
        }

        // search
        if (search && searchIn) {
            domain = domain.concat(await this._taskGetSearchDomain(req, searchIn, search));
        }

        const TaskSudo = await env.items('project.task').sudo();
        domain = AND([domain, await env.items('ir.rule')._computeDomain(TaskSudo._name, 'read')]);

        // task count
        const taskCount = await TaskSudo.searchCount(domain);
        // pager
        const pager = portalPager({
            url: "/my/tasks",
            urlArgs: { dateBegin, dateEnd, sortby, filterby, groupby, searchIn, search },
            total: taskCount,
            page: page,
            step: this._itemsPerPage
        });
        // content according to pager and archive selected
        order = await this._taskGetOrder(order, groupby);

        const tasks = await TaskSudo.search(domain, { order: order, limit: this._itemsPerPage, offset: pager['offset'] });
        req.session['myTasksHistory'] = tasks.ids.slcie(0, 100);

        const groupbyMapping = await this._taskGetGroupbyMapping();
        const group = groupbyMapping[groupby];
        let groupedTasks;
        if (group) {
            groupedTasks = Array.from(groupbyelem(tasks, itemgetter(group))).map(([k, g]) => env.items('project.task').concat(...g));
        }
        else {
            groupedTasks = bool(tasks) ? [tasks] : [];
        }

        const field = env.items('project.task')._fields['kanbanState'];
        const taskStates = Object.fromEntries(await field._descriptionSelection(field, env));
        if (sortby == 'status') {
            if (groupby == 'none' && bool(groupedTasks)) {
                groupedTasks[0] = await sortedAsync(groupedTasks[0], async (tasks) => taskStates[await tasks.kanbanState]);
            }
            else {
                groupedTasks = await sortedAsync(groupedTasks, async (tasks) => taskStates[await tasks[0].kanbanState]);
            }
        }

        update(values, {
            'date': dateBegin,
            'dateEnd': dateEnd,
            'groupedTasks': groupedTasks,
            'pageName': 'task',
            'defaultUrl': '/my/tasks',
            'taskUrl': 'task',
            'pager': pager,
            'searchbarSortings': searchbarSortings,
            'searchbarGroupby': searchbarGroupby,
            'searchbarInputs': searchbarInputs,
            'searchIn': searchIn,
            'search': search,
            'sortby': sortby,
            'groupby': groupby,
            'searchbarFilters': Object.fromEntries(sorted(Object.entries(searchbarFilters), entry => entry[0])),
            'filterby': filterby,
        });
        return req.render(res, "project.portalMyTasks", values);
    }

    @http.route(['/my/task/<int:taskId>'], { type: 'http', auth: "public", website: true })
    async portalMyTask(req, res, opts: { taskId?: any, accessToken?: any } = {}) {
        const { taskId, accessToken } = opts;
        let taskSudo;
        try {
            taskSudo = await this._documentCheckAccess(req, 'project.task', taskId, accessToken);
        } catch (e) {
            if (isInstance(e, AccessError, MissingError)) {
                return req.redirect(res, '/my');
            }
            throw e;
        }

        // ensure attachment are accessible with access token inside template
        for (const attachment of await taskSudo.attachmentIds) {
            await attachment.generateAccessToken();
        }
        const values = await this._taskGetPageViewValues(taskSudo, accessToken, opts);
        return req.render(res, "project.portalMyTask", values);
    }
}
