import { api, Fields } from "../../../core";
import { UserError } from "../../../core/helper";
import { _super, MetaModel, Model } from "../../../core/models";
import { Query } from "../../../core/osv";
import { bool, setDate } from "../../../core/tools";

/**
 * User having received a badge
 */
@MetaModel.define()
class BadgeUser extends Model {
    static _module = module;
    static _name = 'gamification.badge.user';
    static _description = 'Gamification User Badge';
    static _order = "createdAt desc";
    static _recName = "badgeName";

    static userId = Fields.Many2one('res.users', { string: "User", required: true, ondelete: "CASCADE", index: true });
    static senderId = Fields.Many2one('res.users', { string: "Sender", help: "The user who has send the badge" });
    static badgeId = Fields.Many2one('gamification.badge', { string: 'Badge', required: true, ondelete: "CASCADE", index: true });
    static challengeId = Fields.Many2one('gamification.challenge', { string: 'Challenge originating', help: "If this badge was rewarded through a challenge" });
    static comment = Fields.Text('Comment');
    static badgeName = Fields.Char({ related: 'badgeId.label', string: "Badge Name", readonly: false });
    static level = Fields.Selection({ string: 'Badge Level', related: "badgeId.level", store: true, readonly: true });

    /**
     * Send a notification to a user for receiving a badge

        Does not verify constrains on badge granting.
        The users are added to the ownerIds (create badgeUser if needed)
        The stats counters are incremented
        @param {number[]} ids of badge users that will receive the badge
     */
    async _sendBadge() {
        const template = await this.env.ref('gamification.emailTemplateBadgeReceived');

        for (const badgeUser of this) {
            await this.env.items('mail.thread').messagePostWithTemplate(
                template.id, {
                model: badgeUser._name,
                resId: badgeUser.id,
                compositionMode: 'massMail',
                // `websiteForum` triggers `_cronUpdate` which triggers this method for template `Received Badge`
                // for which `badgeUser.userId.partnerId.ids` equals `[8]`, which is then passed to  `this.env.items('mail.compose.message').create(...)`
                // which expects a command list and not a list of ids. In master, this wasn't doing anything, at the end composer.partnerIds was [] and not [8]
                // I believe this line is useless, it will take the partners to which the template must be send from the template itself (`partnerTo`)
                // The below line was therefore pointless.
                // partnerIds=badgeUser.userId.partnerId.ids,
            });
        }
        return true;
    }

    @api.modelCreateMulti()
    async create(valsList) {
        for (const vals of valsList) {
            await this.env.items('gamification.badge').browse(vals['badgeId']).checkGranting();
        }
        return _super(BadgeUser, this).create(valsList);
    }
}

const CAN_GRANT = 1;
const NOBODY_CAN_GRANT = 2;
const USER_NOT_VIP = 3;
const BADGE_REQUIRED = 4;
const TOO_MANY = 5;

/**
 * Badge object that users can send and receive
 */
@MetaModel.define()
class GamificationBadge extends Model {
    static _module = module;
    static _name = 'gamification.badge';
    static _description = 'Gamification Badge';
    static _parents = ['mail.thread', 'image.mixin'];

    static label = Fields.Char('Badge', { required: true, translate: true });
    static active = Fields.Boolean('Active', { default: true });
    static description = Fields.Html('Description', { translate: true, sanitizeAttributes: false });
    static level = Fields.Selection([
        ['bronze', 'Bronze'], ['silver', 'Silver'], ['gold', 'Gold']],
        { string: 'Forum Badge Level', default: 'bronze' });

    static ruleAuth = Fields.Selection([
        ['everyone', 'Everyone'],
        ['users', 'A selected list of users'],
        ['having', 'People having some badges'],
        ['nobody', 'No one, assigned through challenges'],
    ], {
        default: 'everyone',
        string: "Allowance to Grant", help: "Who can grant this badge", required: true
    });
    static ruleAuthUserIds = Fields.Many2many(
        'res.users', {
            relation: 'relBadgeAuthUsers',
        string: 'Authorized Users',
        help: "Only these people can give this badge"
    });
    static ruleAuthBadgeIds = Fields.Many2many(
        'gamification.badge', {
            relation: 'gamificationBadgeRuleBadgeRel', column1: 'badge1Id', column2: 'badge2Id',
        string: 'Required Badges',
        help: "Only the people having these badges can give this badge"
    });

    static ruleMax = Fields.Boolean('Monthly Limited Sending', { help: "Check to set a monthly limit per person of sending this badge" });
    static ruleMaxNumber = Fields.Integer('Limitation Number', { help: "The maximum number of time this badge can be sent per month per person." });
    static challengeIds = Fields.One2many('gamification.challenge', 'rewardId', { string: "Reward of Challenges" });

    static goalDefinitionIds = Fields.Many2many(
        'gamification.goal.definition', {
            relation: 'badgeUnlockedDefinitionRel',
        string: 'Rewarded by', help: "The users that have succeeded theses goals will receive automatically the badge."
    });

    static ownerIds = Fields.One2many(
        'gamification.badge.user', 'badgeId',
        { string: 'Owners', help: 'The list of instances of this badge granted to users' });

    static grantedCount = Fields.Integer("Total", { compute: '_getOwnersInfo', help: "The number of time this badge has been received." });
    static grantedUsersCount = Fields.Integer("Number of users", { compute: '_getOwnersInfo', help: "The number of time this badge has been received by unique users." });
    static uniqueOwnerIds = Fields.Many2many(
        'res.users', {
            string: "Unique Owners", compute: '_getOwnersInfo',
        help: "The list of unique users having received this badge."
    });

    static statThisMonth = Fields.Integer(
        "Monthly total", {
            compute: '_getBadgeUserStats',
        help: "The number of time this badge has been received this month."
    });
    static statMy = Fields.Integer(
        "My Total", {
            compute: '_getBadgeUserStats',
        help: "The number of time the current user has received this badge."
    });
    static statMyThisMonth = Fields.Integer(
        "My Monthly Total", {
            compute: '_getBadgeUserStats',
        help: "The number of time the current user has received this badge this month."
    });
    static statMyMonthlySending = Fields.Integer(
        'My Monthly Sending Total',
        {
            compute: '_getBadgeUserStats',
            help: "The number of time the current user has sent this badge this month."
        });

    static remainingSending = Fields.Integer(
        "Remaining Sending Allowed", {
            compute: '_remainingSendingCalc',
        help: "If a maximum is set"
    });

    /**
     * @returns
            the list of unique res.users ids having received this badge
            the total number of time this badge was granted
            the total number of users this badge was granted to
     */
    @api.depends('ownerIds')
    async _getOwnersInfo() {
        const defaults = {
            'grantedCount': 0,
            'grantedUsersCount': 0,
            'uniqueOwnerIds': [],
        }
        if (!bool(this.ids)) {
            await this.update(defaults);
            return;
        }

        const Users = this.env.items("res.users");
        const query: Query = await Users._whereCalc([]);
        await Users._applyIrRules(query);
        const badgeAlias = query.join("resUsers", "id", "gamificationBadgeUser", "userId", "badges");

        const [tables, whereClauses, whereParams] = query.getSql();

        const result = await this._cr.execute(
            `
              SELECT "{badgeAlias}"."badgeId", count("resUsers".id) as "statCount",
                     count(distinct("resUsers".id)) as "statCountDistinct",
                     array_agg(distinct("resUsers".id)) as "uniqueOwnerIds"
                FROM "${tables}"
               WHERE ${whereClauses}
                 AND "${badgeAlias}"."badgeId" IN (%s)
            GROUP BY "${badgeAlias}"."badgeId"
            `, [...whereParams, String(this.ids) || 'NULL']
        );

        const mapping = {}
        for (const { badgeId, statCount, statCountDistinct, uniqueOwnerIds } of result) {
            mapping[badgeId] = {
                'grantedCount': statCount,
                'grantedUsersCount': statCountDistinct,
                'uniqueOwnerIds': uniqueOwnerIds,
            }
        }
        for (const badge of this) {
            await badge.update(mapping[badge.id] ?? defaults);
        }
    }

    /**
     * Return stats related to badge users
     */
    @api.depends('ownerIds.badgeId', 'ownerIds.createdAt', 'ownerIds.userId')
    async _getBadgeUserStats() {
        const firstMonthDay = setDate(new Date(), { day: 1 });
        const user = await this.env.user();
        for (const badge of this) {
            const owners = await badge.ownerIds;
            let statMy = 0, statThisMonth = 0, statMyThisMonth = 0, statMyMonthlySending = 0;
            for (const owner of owners) {
                const [ownerUser, ownerCreatedAt, ownerCreatedUid] = await owner('userId', 'createdAt', 'createdUid');
                if (ownerUser.eq(user)) {
                    statMy++;
                }
                if (ownerCreatedAt.getDate() >= firstMonthDay) {
                    statThisMonth++;
                    if (ownerUser.eq(user)) {
                        statMyThisMonth++;
                    }
                    if (ownerCreatedUid.eq(user)) {
                        statMyMonthlySending++;
                    }
                }
            }
            await badge.update({ statMy, statThisMonth, statMyThisMonth, statMyMonthlySending });
        }
    }

    /**
     * Computes the number of badges remaining the user can send

        0 if not allowed or no remaining
        integer if limited sending
        -1 if infinite (should not be displayed)
     */
    @api.depends(
        'ruleAuth',
        'ruleAuthUserIds',
        'ruleAuthBadgeIds',
        'ruleMax',
        'ruleMaxNumber',
        'statMyMonthlySending',
    )
    async _remainingSendingCalc() {
        for (const badge of this) {
            if (await badge._canGrantBadge() != CAN_GRANT) {
                // if the user cannot grant this badge at all, result is 0
                await badge.set('remainingSending', 0);
            }
            else if (!await badge.ruleMax) {
                // if there is no limitation, -1 is returned which means 'infinite'
                await badge.set('remainingSending', -1);
            }
            else {
                await badge.set('remainingSending', await badge.ruleMaxNumber - await badge.statMyMonthlySending);
            }
        }
    }

    /**
     * Check the user 'uid' can grant the badge 'badgeId' and raise the appropriate exception
        if not
        Do not check for SUPERUSER_ID
     * @returns 
     */
    async checkGranting() {
        const statusCode = await this._canGrantBadge();
        if (statusCode == CAN_GRANT) {
            return true;
        }
        else if (statusCode == NOBODY_CAN_GRANT) {
            throw new UserError(await this._t('This badge can not be sent by users.'));
        }
        else if (statusCode == USER_NOT_VIP) {
            throw new UserError(await this._t('You are not in the user allowed list.'));
        }
        else if (statusCode == BADGE_REQUIRED) {
            throw new UserError(await this._t('You do not have the required badges.'));
        }
        else if (statusCode == TOO_MANY) {
            throw new UserError(await this._t('You have already sent this badge too many time this month.'));
        }
        else {
            console.error("Unknown badge status code: %s", statusCode);
        }
        return false;
    }

    /**
     * Check if a user can grant a badge to another user

        @param uid the id of the res.users trying to send the badge
        @param badgeId the granted badge id
        @returns integer representing the permission.
     */
    async _canGrantBadge() {
        if (await this.env.isAdmin()) {
            return CAN_GRANT;
        }
        if (await this['ruleAuth'] == 'nobody') {
            return NOBODY_CAN_GRANT;
        }
        else if (await this['ruleAuth'] == 'users' && !(await this['ruleAuthUserIds']).includes(await this.env.user())) {
            return USER_NOT_VIP;
        }
        else if (await this['ruleAuth'] == 'having') {
            const allUserBadges = await (await this.env.items('gamification.badge.user').search([['userId', '=', this.env.uid]])).mapped('badgeId');
            if ((await this['ruleAuthBadgeIds']).sub(allUserBadges).ok) {
                return BADGE_REQUIRED;
            }
        }

        if (await this['ruleMax'] && await this['statMyMonthlySending'] >= await this['ruleMaxNumber']) {
            return TOO_MANY;
        }

        // badge.ruleAuth == 'everyone' -> no check
        return CAN_GRANT;
    }
}