import { api, Fields } from "../../../core";
import { _super, MetaModel, Model } from "../../../core/models"
import { _f, bool, len, range } from "../../../core/tools";

@MetaModel.define()
class Users extends Model {
    static _module = module;
    static _parents = 'res.users';

    static karma = Fields.Integer('Karma', {default: 0, copy: false});
    static karmaTrackingIds = Fields.One2many('gamification.karma.tracking', 'userId', {string: 'Karma Changes', groups: "base.groupSystem"});
    static badgeIds = Fields.One2many('gamification.badge.user', 'userId', {string: 'Badges', copy: false});
    static goldBadge = Fields.Integer('Gold badges count', {compute: "_getUserBadgeLevel"});
    static silverBadge = Fields.Integer('Silver badges count', {compute: "_getUserBadgeLevel"});
    static bronzeBadge = Fields.Integer('Bronze badges count', {compute: "_getUserBadgeLevel"});
    static rankId = Fields.Many2one('gamification.karma.rank', {string: 'Rank', index: false});
    static nextRankId = Fields.Many2one('gamification.karma.rank', {string: 'Next Rank', index: false});

    /**
     * Return total badge per level of users
        TDE CLEANME: shouldn't check type is forum ?
     * @returns 
     */
    @api.depends('badgeIds')
    async _getUserBadgeLevel() {
        for (const user of this) {
            await user.update({
                goldBadge: 0,
                silverBadge: 0,
                bronzeBadge: 0
            });
        }
        const res = await this.env.cr.execute(`
            SELECT bu."userId", b.level, count(1) as count
            FROM "gamificationBadgeUser" bu, "gamificationBadge" b
            WHERE bu."userId" IN (%s)
              AND bu."badgeId" = b.id
              AND b.level IS NOT NULL
            GROUP BY bu."userId", b.level
            ORDER BY bu."userId";
        `, [String(this.ids) || 'NULL']);

        for (const {userId, level, count} of res) {
            // levels are gold, silver, bronze but fields have 'Badge' postfix
            await this.browse(userId).set(`${level}Badge`, count);
        }
    }

    @api.modelCreateMulti()
    async create(valuesList) {
        const res = await _super(Users, this).create(valuesList);

        const karmaTrackings = [];
        for (const user of res) {
            if (await user.karma) {
                karmaTrackings.push({'userId': user.id, 'oldValue': 0, 'newValue': await user.karma});
            }
        }
        if (karmaTrackings.length) {
            await (await this.env.items('gamification.karma.tracking').sudo()).create(karmaTrackings);
        }

        await res._recomputeRank();
        return res;
    }

    async write(vals) {
        const karmaTrackings = [];
        if ('karma' in vals) {
            for (const user of this) {
                if (await user.karma != vals['karma']) {
                    karmaTrackings.push({'userId': user.id, 'oldValue': await user.karma, 'newValue': vals['karma']});
                }
            }
        }

        const res = await _super(Users, this).write(vals);

        if (karmaTrackings.length) {
            await (await this.env.items('gamification.karma.tracking').sudo()).create(karmaTrackings);
        }
        if ('karma' in vals) {
            await this._recomputeRank();
        }
        return res;
    }

    async addKarma(karma) {
        for (const user of this) {
            await user.set('karma', await user.karma + karma);
        }
        return true;
    }

    /**
     * Get absolute position in term of gained karma for users. First a ranking
        of all users is done given a user_domain; then the position of each user
        belonging to the current record set is extracted.

        Example: in website profile, search users with name containing Norbert. Their
        positions should not be 1 to 4 (assuming 4 results), but their actual position
        in the karma gain ranking (with example user_domain being karma > 1,
        website published True).

     * @param userDomain general domain (i.e. active, karma > 1, website, ...)
          to compute the absolute position of the current record set
     * @param fromDate compute karma gained after this date (included) or from
          beginning of time;
     * @param toDate compute karma gained before this date (included) or until
          end of time;
     * @returns [{
            'userId': userId (belonging to current record set),
            'karmaGainTotal': integer, karma gained in the given timeframe,
            'karmaPosition': integer, ranking position
        }, {..}] ordered by karmaPosition desc
     */
    async _getTrackingKarmaGainPosition(userDomain, fromDate?: any, toDate?: any) {
        if (! bool(this)) {
            return [];
        }

        const whereQuery = await this.env.items('res.users')._whereCalc(userDomain);
        const [userFromClause, userWhereClause, whereClauseParams] = await whereQuery.getSql();

        const params = [];
        let dateFromCondition, dateToCondition;
        if (fromDate) {
            dateFromCondition = 'AND tracking."trackingDate"::timestamp >= timestamp %s';
            params.push(fromDate.toISOString());
        }
        if (toDate) {
            dateToCondition = 'AND tracking."trackingDate"::timestamp <= timestamp %s';
            params.push(toDate.toISOString());
        }
        params.push(Array.from(this.ids));

        const query = _f(`
            SELECT final."userId", final."karmaGainTotal", final."karmaPosition"
            FROM (
                SELECT intermediate."userId", intermediate."karmaGainTotal", row_number() OVER (ORDER BY intermediate."karmaGainTotal" DESC) AS "karmaPosition"
                FROM (
                    SELECT "resUsers".id as "userId", COALESCE(SUM("tracking"."newValue" - "tracking"."oldValue"), 0) as "karmaGainTotal"
                    FROM {userFromClause}
                    LEFT JOIN "gamificationKarmaTracking" as "tracking"
                    ON "resUsers".id = tracking."userId" AND "resUsers".active = TRUE
                    WHERE {userWhereClause} {dateFromCondition} {dateToCondition}
                    GROUP BY "resUsers".id
                    ORDER BY "karmaGainTotal" DESC
                ) intermediate
            ) final
            WHERE final."userId" IN (%%s)`, {
                userFromClause: userFromClause,
                userWhereClause: userWhereClause || (!fromDate && !toDate && 'TRUE') || '',
                dateFromCondition: fromDate ? dateFromCondition : '',
                dateToCondition: toDate ? dateToCondition : ''
            });

        const res = await this.env.cr.execute(query, whereClauseParams.concat(params));
        return res;
    }

    /**
     * Get absolute position in term of total karma for users. First a ranking
        of all users is done given a userDomain; then the position of each user
        belonging to the current record set is extracted.

        Example: in website profile, search users with name containing Norbert. Their
        positions should not be 1 to 4 (assuming 4 results), but their actual position
        in the total karma ranking (with example userDomain being karma > 1,
        website published True).

     * @param userDomain general domain (i.e. active, karma > 1, website, ...)
          to compute the absolute position of the current record set
     * @returns [{
            'userId': userId (belonging to current record set),
            'karmaPosition': integer, ranking position
        }, {..}] ordered by karmaPosition desc
     */
    async _getKarmaPosition(userDomain) {
        if (!bool(this)) {
            return {};
        }

        const whereQuery = await this.env.items('res.users')._whereCalc(userDomain);
        const [userFromClause, userWhereClause, whereClauseParams] = await whereQuery.getSql();

        // we search on every user in the DB to get the real positioning (not the one inside the subset)
        // then, we filter to get only the subset.
        const query = _f(`
            SELECT sub."userId", sub."karmaPosition"
            FROM (
                SELECT "resUsers".id as "userId", row_number() OVER (ORDER BY "resUsers".karma DESC) AS "karmaPosition"
                FROM {userFromClause}
                WHERE {userWhereClause}
            ) sub
            WHERE sub."userId" IN (%%s)`, {
                userFromClause: userFromClause,
                userWhereClause: userWhereClause || 'TRUE',
            });

        const res = await this.env.cr.execute(query, whereClauseParams.concat([String(this.ids) || 'NULL']));
        return res;
    }

    /**
     * Method that can be called on a batch of users with the same new rank
     * @returns 
     */
    async _rankChanged() {
        if (this.env.context['installMode'] ?? false) {
            // avoid sending emails in install mode (prevents spamming users when creating data ranks)
            return;
        }

        const template = await this.env.ref('gamification.mailTemplateDataNewRankReached', false);
        if (template) {
            for (const user of this) {
                if (await (await user.rankId).karmaMin > 0) {
                    await template.sendMail(user.id, {forceSend: false, notifLayout: 'mail.mailNotificationLight'});
                }
            }
        }
    }

    /**
     * The caller should filter the users on karma > 0 before calling this method
        to avoid looping on every single users

        Compute rank of each user by user.
        For each user, check the rank of this user
     * @returns 
     */
    async _recomputeRank() {
        const ranks = await (await this.env.items('gamification.karma.rank').search([], {order: "karmaMin DESC"})).map(async (rank) => ({rank: rank, 'karmaMin': await rank.karmaMin}));

        // 3 is the number of search/requests used by rank in _recompute_rank_bulk()
        if (len(this) > len(ranks) * 3) {
            await this._recomputeRankBulk();
            return;
        }

        for (const user of this) {
            const oldRank = await user.rankId;
            if (await user.karma == 0 && bool(ranks)) {
                await user.write({nextRankId: ranks[-1]['rank'].id});
            }
            else {
                for (const i of range(0, len(ranks))) {
                    if (await user.karma >= ranks[i]['karmaMin']) {
                        await user.write({
                            rankId: ranks[i]['rank'].id,
                            nextRankId: 0 < i ? ranks[i - 1]['rank'].id : false
                        });
                        break;
                    }
                }
            }
            if (oldRank.ne(await user.rank_idC)) {
                await user._rankChanged();
            }
        }
    }

    /**
     * Compute rank of each user by rank.
            For each rank, check which users need to be ranked
     */
    async _recomputeRankBulk() {
        const ranks = await (await this.env.items('gamification.karma.rank').search([], {order: "karmaMin DESC"})).map(async (rank) => ({rank: rank, karmaMin: await rank.karmaMin}));

        let usersTodo = this;

        let nextRankId = false;
        // wtf, nextRankId should be a related on rank_id.next_rank_id and life might get easier.
        // And we only need to recompute next_rank_id on write with min_karma or in the create on rank model.
        for (const r of ranks) {
            const rankId = r['rank'].id;
            const dom = [
                ['karma', '>=', r['karmaMin']],
                ['id', 'in', usersTodo.ids],
                '|',  // noqa
                    '|', ['rankId', '!=', rankId], ['rankId', '=', false],
                    '|', ['nextRankId', '!=', nextRankId], ['nextRankId', '=', nextRankId ? false : -1],
            ];
            const users = await this.env.items('res.users').search(dom);
            if (bool(users)) {
                const usersToNotify = await this.env.items('res.users').search([
                    ['karma', '>=', r['karmaMin']],
                    '|', ['rankId', '!=', rankId], ['rankId', '=', false],
                    ['id', 'in', users.ids],
                ]);
                await users.write({rankId, nextRankId});
                await usersToNotify._rankChanged();
                usersTodo = usersTodo.sub(users);
            }

            const nothingToDoUsers = await this.env.items('res.users').search([
                ['karma', '>=', r['karmaMin']],
                '|', ['rankId', '=', rankId], ['nextRankId', '=', nextRankId],
                ['id', 'in', usersTodo.ids],
            ]);
            usersTodo = usersTodo.sub(nothingToDoUsers);
            nextRankId = r['rank'].id;
        }

        if (bool(ranks)) {
            const lowerRank = ranks[-1]['rank'];
            const users = await this.env.items('res.users').search([
                ['karma', '>=', 0],
                ['karma', '<', await lowerRank.karmaMin],
                '|', ['rankId', '!=', false], ['nextRankId', '!=', lowerRank.id],
                ['id', 'in', usersTodo.ids],
            ]);
            if (bool(users)) {
                await users.write({
                    rankId: false,
                    nextRankId: lowerRank.id,
                });
            }
        }
    }

    /**
     * For fresh users with 0 karma that don't have a rankId and nextRankId yet
        this method returns the first karma rank (by karma ascending). This acts as a
        default value in related views.

        TDE FIXME: make nextRankId a non-stored computed field correctly computed
     * @returns 
     */
    async _getNextRank() {
        if (bool(await this['nextRankId'])) {
            return this['nextRankId'];
        }
        else if (!bool(await this['rankId'])) {
            return this.env.items('gamification.karma.rank').search([], {order: "karmaMin ASC", limit: 1});
        }
        else {
            return this.env.items('gamification.karma.rank');
        }
    }

    /**
     * Hook for other modules to add redirect button(s) in new rank reached mail
        Must return a list of dictionnary including url and label.
        E.g. return [{url: '/forum', label: 'Go to Forum'}]
     * @returns 
     */
    async getGamificationRedirectionData() {
        this.ensureOne();
        return [];
    }
}
