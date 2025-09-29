import { http } from "../../../core"
import { Forbidden } from "../../../core/service";
import { bool } from "../../../core/tools";
import { documentCheckAccess, PortalChatter } from "../../portal";

@http.define()
class ProjectSharingChatter extends PortalChatter {
    static _module = module;

    /**
     * Check if the chatter in project sharing can be accessed

            If the portal user is in the project sharing, then we do not have the access token of the task
            but we can have the one of the project (if the user accessed to the project sharing views via the shared link).
            So, we need to check if the chatter is for a task and if the resId is a task
            in the project shared. Then, if we had the project token and this one is the one in the project
            then we return the token of the task to continue the portal chatter process.
            If we do not have any token, then we need to check if the portal user is a follower of the project shared.
            If it is the case, then we give the access token of the task.
     * @param req 
     * @param projectId 
     * @param resModel 
     * @param resId 
     * @param token 
     * @returns 
     */
    async _checkProjectAccessAndGetToken(req, res, projectId, resModel, resId, token) {
        const projectSudo = await documentCheckAccess(req, 'project.project', projectId, token);
        const env = await req.getEnv()
        const canAccess = bool(projectSudo) && resModel == 'project.task' && await (await projectSudo.withUser(await env.user()))._checkProjectSharingAccess();
        let task;
        if (canAccess) {
            task = await (await env.items('project.task').sudo()).search([['id', '=', resId], ['projectId', '=', projectSudo.id]]);
        }
        if (!canAccess || !bool(task)) {
            throw new Forbidden(res);
        }
        return task[task._mailPostTokenField];
    }

    // ============================================================ #
    // Note concerning the methods portalChatter(init/post/fetch)
    // ============================================================ #
    //
    // When the project is shared to a portal user with the edit rights,
    // he has the read/write access to the related tasks. So it could be
    // possible to call directly the message_post method on a task.
    //
    // This change is considered as safe, as we only willingly expose
    // records, for some assumed fields only, and this feature is
    // optional and opt-in. (like the public employee model for example).
    // It doesn't allow portal users to access other models, like
    // a timesheet or an invoice.
    //
    // It could seem odd to use those routes, and converting the project
    // access token into the task access token, as the user has actually
    // access to the records.
    //
    // However, it has been decided that it was the less hacky way to
    // achieve this, as:
    //
    // - We're reusing the existing routes, that convert all the data
    //   into valid arguments for the methods we use (message_post, ...).
    //   That way, we don't have to reinvent the wheel, duplicating code
    //   from mail/portal that surely will lead too desynchronization
    //   and inconsistencies over the time.
    //
    // - We don't define new routes, to do the exact same things than portal,
    //   considering that the portal user can use message_post for example
    //   because he has access to the record.
    //   Let's suppose that we remove this in a future development, those
    //   new routes won't be valid anymore.
    //
    // - We could have reused the mail widgets, as we already reuse the
    //   form/list/kanban views, etc. However, we only want to display
    //   the messages and allow to post. We don't need the next activities
    //   the followers system, etc. This required to override most of the
    //   mail.thread basic methods, without being sure that this would
    //   work with other installed applications or customizations

    @http.route()
    async portalChatterInit(req, res, opts: {resModel?: any, resId?: any, domain?: any, limit?: any}={}) {
        const {resModel, resId, domain=false, limit=false} = opts;
        const projectSharingId = opts['projectSharingId'];
        if (projectSharingId) {
            // if there is a token in `kwargs` then it should be the access_token of the project shared
            const token = await this._checkProjectAccessAndGetToken(req, res, projectSharingId, resModel, resId, opts['token']);
            if (token) {
                delete opts['projectSharingId'];
                opts['token'] = token;
            }
        }
        return super.portalChatterInit(req, res, {...opts, resModel, resId, domain, limit});
    }

    @http.route()
    async portalChatterPost(req, res, opts: {resModel?: any, resId?: any, message?: any, attachmentIds?: any, attachmentTokens?: any}={}) {
        const {resModel, resId, message, attachmentIds, attachmentTokens} = opts;
        const projectSharingId = opts['projectSharingId'];
        if (projectSharingId) {
            const token = await this._checkProjectAccessAndGetToken(req, res, projectSharingId, resModel, resId, opts['token']);
            if (token) {
                delete opts['projectSharingId'];
                opts['token'] = token;
            }
        }
        return super.portalChatterPost(req, res, {...opts, resModel, resId, message, attachmentIds, attachmentTokens});
    }

    @http.route()
    async portalMessageFetch(req, res, opts: {resModel?: any, resId?: any, domain?: any, limit?: any, offset?: any}={}) {
        const {resModel, resId, domain=false, limit=10, offset=0} = opts;
        const projectSharingId = opts['projectSharingId'];
        if (projectSharingId) {
            const token = await this._checkProjectAccessAndGetToken(req, res, projectSharingId, resModel, resId, opts['token']);
            if (token) {
                opts['token'] = token;
            }
        }
        return super.portalMessageFetch(req, res, {...opts, resModel, resId, domain, limit, offset});
    }
}