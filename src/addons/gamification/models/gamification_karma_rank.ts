import { _super, api, Fields, MetaModel, Model } from "../../../core";
import { equal, htmlTranslate, some } from "../../../core/tools";

@MetaModel.define()
class KarmaRank extends Model {
    static _module = module;
    static _name = 'gamification.karma.rank';
    static _description = 'Rank based on karma';
    static _parents = 'image.mixin';
    static _order = 'karmaMin';

    static label = Fields.Text({string: 'Rank Name', translate: true, required: true});
    static description = Fields.Html({string: 'Description', translate: htmlTranslate, sanitizeAttributes: false});
    static descriptionMotivational = Fields.Html({
        string: 'Motivational', translate: htmlTranslate, sanitizeAttributes: false,
        help: "Motivational phrase to reach this rank"});
    static karmaMin = Fields.Integer({
        string: 'Required Karma', required: true, default: 1,
        help: 'Minimum karma needed to reach this rank'});
    static userIds = Fields.One2many('res.users', 'rankId', {string: 'Users', help: "Users having this rank"});
    static rankUsersCount = Fields.Integer("# Users", {compute: "_computeRankUsersCount"});

    static _sqlConstraints = [
        ['karma_min_check', 'CHECK("karmaMin" > 0)', 'The required karma has to be above 0.']
    ];

    @api.depends('userIds')
    async _computeRankUsersCount() {
        const requestsData = await this.env.items('res.users').readGroup([['rankId', '!=', false]], ['rankId'], ['rankId']);
        const requestsMappedData = Object.fromEntries(requestsData.map(data => [data['rankId'][0], data['rankId_count']]));
        for (const rank of this) {
            await rank.set('rankUsersCount', requestsMappedData[rank.id] ?? 0);
        }
    }

    @api.modelCreateMulti()
    async create(valuesList) {
        const res = await _super(KarmaRank, this).create(valuesList);
        if (some(await res.mapped('karmaMin'))) {
            const users = await (await this.env.items('res.users').sudo()).search([['karma', '>=', Math.max(Math.min(...await res.mapped('karmaMin')), 1)]]);
            if (users.ok) {
                await users._recomputeRank();
            }
        }
        return res;
    }

    async write(vals) {
        let previousRanks, low, high;
        if ('karmaMin' in vals) {
            previousRanks = (await this.env.items('gamification.karma.rank').search([], {order: "karmaMin DESC"})).ids;
            low = Math.min(vals['karmaMin'], Math.min(... await this.mapped('karmaMin')));
            high = Math.max(vals['karmaMin'], Math.max(... await this.mapped('karmaMin')));
        }
        const res = await _super(KarmaRank, this).write(vals);

        if ('karmaMin' in vals) {
            const afterRanks = (await this.env.items('gamification.karma.rank').search([], {order: "karmaMin DESC"})).ids;
            let users;
            if (!equal(previousRanks, afterRanks)) {
                users = await (await this.env.items('res.users').sudo()).search([['karma', '>=', Math.max(low, 1)]]);
            }
            else {
                users = await (await this.env.items('res.users').sudo()).search([['karma', '>=', Math.max(low, 1)], ['karma', '<=', high]]);
            }
            await users._recomputeRank();
        }
        return res;
    }
}
