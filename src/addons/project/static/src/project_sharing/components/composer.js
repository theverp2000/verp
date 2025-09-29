/** @verp-module **/

import { PortalComposer } from 'portal.composer';

export default PortalComposer.extend({
    _prepareAttachmentData() {
        const data = this._super.apply(this, arguments);
        const newData = {};
        if (this.options.displayComposer && typeof this.options.displayComposer == 'string') {
            // then we should have the accessToken of the task
            newData.accessToken = this.options.displayComposer;
        } else {
            newData.projectSharingId = this.options.projectSharingId;
        }
        return Object.assign(data, newData);
    },
});
