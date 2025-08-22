// export * from './controllers';
// export * from './models';
// export * from './report';
// export * from './wizard';
// export * from './populate';

import { api } from '../../core';

/**
 * Check if it exists at least a collaborator in a shared project

    If it is the case we need to active the portal rules added only for this feature.
 * @param env 
 */
export async function checkExistsCollaboratorsForProjectSharing(env) {
    const collaborator = await env.items('project.collaborator').search([], {limit: 1});
    if (collaborator.ok) {
        // Then we need to enable the access rights linked to project sharing for the portal user
        await env.items('project.collaborator')._toggleProjectSharingPortalRules(true);
    }
}

async function _projectPostInit(cr, registry) {
    const env = await api.Environment.new(cr, global.SUPERUSER_ID);
    checkExistsCollaboratorsForProjectSharing(env);
}