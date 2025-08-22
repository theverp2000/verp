import { Fields, MetaModel, TransientModel } from "../../../core";
import { UserError } from "../../../core/helper";

/**
 * Wizard allowing to grant a badge to a user
 */
@MetaModel.define()
class grantBadgeWizard extends TransientModel {
    static _module = module;
    static _name = 'gamification.badge.user.wizard';
    static _description = 'Gamification User Badge Wizard';

    static userId = Fields.Many2one("res.users", {string: 'User', required: true});
    static badgeId = Fields.Many2one("gamification.badge", {string: 'Badge', required: true});
    static comment = Fields.Text('Comment');

    /**
     * Wizard action for sending a badge to a chosen user
     * @returns 
     */
    async actionGrantBadge() {
        const BadgeUser = this.env.items('gamification.badge.user');

        const uid = this.env.uid;
        for (const wiz of this) {
            if (uid == (await wiz.userId).id) {
                throw new UserError(await this._t('You can not grant a badge to yourself.'));
            }

            // create the badge
            await (await BadgeUser.create({
                userId: (await wiz.userId).id,
                senderId: uid,
                badgeId: (await wiz.badgeId).id,
                comment: await wiz.comment,
            }))._sendBadge();
        }
        return true;
    }
}
