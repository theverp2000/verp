// export * from './controllers';
// export * from './models';
// export * from './report';
// export * from './wizard';

import { _Datetime } from '../../core';
import * as api from '../../core/api';
import { _t, today } from '../../core/tools';
import { checkExistsCollaboratorsForProjectSharing } from '../project';

async function _postInitHook(cr, registry) {
    const env = await api.Environment.new(cr, global.SUPERUSER_ID);

    // allowTimesheets is set by default, but erased for existing projects at
    // installation, as there is no analytic account for them.
    await (await env.items('project.project').search([])).write({'allowTimesheets': true});

    const admin = await env.ref('base.userAdmin', false);
    if (!admin) { 
        return;
    }
    const adminCompany = await (await admin.employeeIds).companyId;
    const projectIds = await (await env.items('res.company').search([]))._createInternalProjectTask();
    await env.items('account.analytic.line').create(
        await (await (await projectIds.taskIds).filtered(async (t) => adminCompany.includes(await t.companyId))).map(async (task) => ({
            'label': await _t(env, "Analysis"),
            'userId': admin.id,
            'date': today(),
            'unitAmount': 0,
            'projectId': (await task.projectId).id,
            'taskId': task.id,
        }))
    );
    await checkExistsCollaboratorsForProjectSharing(env);
}

async function _uninstallHook(cr, registry) {
    const env = await api.Environment.new(cr, global.SUPERUSER_ID);
    const xmlIds = [
        'project.openViewProjectAll',
        'project.openViewProjectAllGroupStage'
    ];
    for (const xmlId of xmlIds) {
        const actwindow = await env.ref(xmlId, false);
        if (actwindow && await actwindow.domain && (await actwindow.domain).includes('isInternalProject')) {
            await actwindow.set('domain', []);
        }
    }
    // archive the internal projects
    const projectIds = await (await env.items('res.company').search([['internalProjectId', '!=', false]])).mapped('internalProjectId');
    if (projectIds.ok) {
        await projectIds.write({'active': false});
    }

    await (await env.items('ir.model.data').search([['label', 'ilike', 'internalProjectDefaultStage']])).unlink();
}