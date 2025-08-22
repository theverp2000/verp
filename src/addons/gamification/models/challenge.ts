import _ from "lodash";
import { _Date, _Datetime, _super, api, Fields, MetaModel, Model } from "../../../core";
import { UserError } from "../../../core/helper";
import { _f2, addDate, bool, chain, enumerate, extend, islice, len, literalEval, repeat, sorted, subDate, takewhile, today, update, ustr } from "../../../core/tools";

// display top 3 in ranking, could be db variable
const MAX_VISIBILITY_RANKING = 3;

/**
 * Return the start and end date for a goal period based on today

 * @param period 
 * @param defaultStartDate string date in DEFAULT_SERVER_DATE_FORMAT format
 * @param defaultEndDate string date in DEFAULT_SERVER_DATE_FORMAT format
 * @returns [startDate, endDate], dates in string format, false if the period is
    not defined or unknown
 */
function startEndDateForPeriod(period, defaultStartDate=false, defaultEndDate=false) {
    const td: Date = today();
    let start: Date|boolean, end: Date|boolean;
    if (period === 'daily') {
        start = td;
        end = start;
    }
    else if (period === 'weekly') {
        start = addDate(td, { days: td.getDay() - 1}); // This Monday
        end = addDate(start, {days: 7}); // Next Monday
    }
    else if (period === 'monthly') {
        start = td; start.setDate(1); // 1st of this month
        end = addDate(start, {months: 1, days: -1}); // last day of this month
    }
    else if (period === 'yearly') {
        start = td; start.setMonth(0); start.setDate(1); // This year, Jan 1
        end = td; end.setMonth(11); end.setDate(31); // This year, Dep 31
    }
    else {  // period == 'once':
        start = defaultStartDate;  // for manual goal, start each time
        end = defaultEndDate;
        return [start, end];
    }
    return [_Datetime.toString(start), _Datetime.toString(end)];
}

/**
 * Gamification challenge

    Set of predifined objectives assigned to people with rules for recurrence and
    rewards

    If 'userIds' is defined and 'period' is different than 'one', the set will
    be assigned to the users for each period (eg: every 1st of each month if
    'monthly' is selected)
 */
@MetaModel.define()
class Challenge extends Model {
    static _module = module;
    static _name = 'gamification.challenge';
    static _description = 'Gamification Challenge';
    static _parents = 'mail.thread';
    static _order = 'endDate, startDate, label, id';

    static label = Fields.Char("Challenge Name", {required: true, translate: true});
    static description = Fields.Text("Description", {translate: true});
    static state = Fields.Selection([
            ['draft', "Draft"],
            ['inprogress', "In Progress"],
            ['done', "Done"],
        ], {default: 'draft', copy: false,
        string: "State", required: true, tracking: true});
    static managerId = Fields.Many2one(
        'res.users', {default: self => self.env.uid,
        string: "Responsible", help: "The user responsible for the challenge."});

    static userIds = Fields.Many2many('res.users', 'gamificationChallengeUsersRel', {string: "Users", help: "List of users participating to the challenge"});
    static userDomain = Fields.Char("User domain", {help: "Alternative to a list of users"});

    static period = Fields.Selection([
            ['once', "Non recurring"],
            ['daily', "Daily"],
            ['weekly', "Weekly"],
            ['monthly', "Monthly"],
            ['yearly', "Yearly"]
        ], {default: 'once',
        string: "Periodicity",
        help: "Period of automatic goal assigment. If none is selected, should be launched manually.",
        required: true});
    static startDate = Fields.Date("Start Date", {help: "The day a new challenge will be automatically started. If no periodicity is set, will use this date as the goal start date."});
    static endDate = Fields.Date("End Date", {help: "The day a new challenge will be automatically closed. If no periodicity is set, will use this date as the goal end date."});

    static invitedUserIds = Fields.Many2many('res.users', 'gamificationInvitedUserIdsRel', {string: "Suggest to users"});

    static lineIds = Fields.One2many('gamification.challenge.line', 'challengeId',
                                  {string: "Lines",
                                  help: "List of goals that will be set",
                                  required: true, copy: true});

    static rewardId = Fields.Many2one('gamification.badge', {string: "For Every Succeeding User"});
    static rewardFirstId = Fields.Many2one('gamification.badge', {string: "For 1st user"});
    static rewardSecondId = Fields.Many2one('gamification.badge', {string: "For 2nd user"});
    static rewardThirdId = Fields.Many2one('gamification.badge', {string: "For 3rd user"});
    static rewardFailure = Fields.Boolean("Reward Bests if not Succeeded?");
    static rewardRealtime = Fields.Boolean("Reward as soon as every goal is reached", {default: true, help: "With this option enabled, a user can receive a badge only once. The top 3 badges are still rewarded only at the end of the challenge."});

    static visibilityMode = Fields.Selection([
            ['personal', "Individual Goals"],
            ['ranking', "Leader Board (Group Ranking)"],
        ], {default: 'personal',
        string: "Display Mode", required: true});

    static reportMessageFrequency = Fields.Selection([
            ['never', "Never"],
            ['onchange', "On change"],
            ['daily', "Daily"],
            ['weekly', "Weekly"],
            ['monthly', "Monthly"],
            ['yearly', "Yearly"]
        ], {default: 'never',
        string: "Report Frequency", required: true});
    static reportMessageGroupId = Fields.Many2one('mail.channel', {string: "Send a copy to", help: "Group that will receive a copy of the report in addition to the user"});
    static reportTemplateId = Fields.Many2one('mail.template', {default: self => self._getReportTemplate(), string: "Report Template", required: true});
    static remindUpdateDelay = Fields.Integer("Non-updated manual goals will be reminded after", {help: "Never reminded if no value or zero is specified."});
    static lastReportDate = Fields.Date("Last Report Date", {default: () => _Date.today()});
    static nextReportDate = Fields.Date("Next Report Date", {compute: '_getNextReportDate', store: true});

    static challengeCategory = Fields.Selection([
        ['hr', 'Human Resources / Engagement'],
        ['other', 'Settings / Gamification Tools'],
    ], {string: "Appears in", required: true, default: 'hr',
       help: "Define the visibility of the challenge through menus"});

    REPORT_OFFSETS = {
        'daily': {days: 1},
        'weekly': {days: 7},
        'monthly': {months: 1},
        'yearly': {years: 1},
    }

    /**
     * Return the next report date based on the last report date and
        report period.
     * @returns 
     */
    @api.depends('lastReportDate', 'reportMessageFrequency')
    async _getNextReportDate() {
        for (const challenge of this) {
            const last = await challenge.lastReportDate;
            const offset = this.REPORT_OFFSETS[await challenge.reportMessageFrequency];

            if (offset) {
                await challenge.set('nextReportDate', addDate(last, offset));
            }
            else {
                await challenge.set('nextReportDate', false);
            }
        }
    }

    async _getReportTemplate() {
        const template = await this.env.ref('gamification.simpleReportTemplate', false);

        return bool(template) ? template.id : false;
    }

    /**
     * Overwrite the create method to add the user of groups
     * @param valsList 
     * @returns 
     */
    @api.modelCreateMulti()
    async create(valsList) {
        for (const vals of valsList) {
            if (vals['userDomain']) {
                const users = await this._getChallengerUsers(ustr(vals['userDomain']));

                if (!vals['userIds']) {
                    vals['userIds'] = [];
                }
                extend(vals['userIds'], await users.map(user => [4, user.id]));
            }
        }
        return _super(Challenge, this).create(valsList);
    }

    async write(vals) {
        if (vals['userDomain']) {
            const users = await this._getChallengerUsers(ustr(vals['userDomain']));

            if (!vals['userIds']) {
                vals['userIds'] = [];
            }
            extend(vals['userIds'], await users.map(user => [4, user.id]));
        }

        const writeRes = await _super(Challenge, this).write(vals);

        if (vals['reportMessageFrequency'] ?? 'never' != 'never') {
            // _recompute_challenge_users do not set users for challenges with no reports, subscribing them now
            for (const challenge of this) {
                await challenge.messageSubscribe(await (await challenge.userIds).map(async (user) => (await user.partnerId).id));
            }
        }

        if (vals['state'] === 'inprogress') {
            await this._recomputeChallengeUsers();
            await this._generateGoalsFromChallenge();
        }
        else if (vals['state'] === 'done') {
            await this._checkChallengeReward(true);
        }
        else if (vals['state'] === 'draft') {
            // resetting progress
            if (bool(await this.env.items('gamification.goal').search([['challengeId', 'in', this.ids], ['state', '=', 'inprogress']], {limit: 1}))) {
                throw new UserError(await this._t("You can not reset a challenge with unfinished goals."));
            }
        }

        return writeRes;
    }

    ///// Update /////

    /**
     * Daily cron check.

        - Start planned challenges (in draft and with start_date = today)
        - Create the missing goals (eg: modified the challenge to add lines)
        - Update every running challenge
     * @param ids 
     * @param commit 
     * @returns 
     */
    @api.model() // FIXME: check how cron functions are called to see if decorator necessary
    async _cronUpdate(ids=false, commit=true) {
        // in cron mode, will do intermediate commits
        // cannot be replaced by a parameter because it is intended to impact side-effects of
        // write operations
        let self = await this.withContext({commitGamification: commit});
        // start scheduled challenges
        const plannedChallenges = await self.search([
            ['state', '=', 'draft'],
            ['start_date', '<=', _Date.today()]
        ]);
        if (bool(plannedChallenges)) {
            await plannedChallenges.write({'state': 'inprogress'});
        }

        // close scheduled challenges
        const scheduledChallenges = await self.search([
            ['state', '=', 'inprogress'],
            ['endDate', '<', _Date.today()]
        ]);
        if (bool(scheduledChallenges)) {
            await scheduledChallenges.write({'state': 'done'});
        }

        const records = bool(ids) ? self.browse(ids) : await self.search([['state', '=', 'inprogress']]);

        return records._updateAll();
    }

    /**
     * Update the challenges and related goals.
     * @returns 
     */
    async _updateAll() {
        if (!bool(this)) {
            return true;
        }

        const Goals = this.env.items('gamification.goal');

        // include yesterday goals to update the goals that just ended
        // exclude goals for portal users that did not connect since the last update
        const yesterday = _Date.toString(subDate(today(), {days: 1}));
        const res = await this.env.cr.execute(`SELECT gg.id
                        FROM "gamificationGoal" as gg
                        JOIN "resUsersLog" as log ON gg."userId" = log."createdUid"
                        JOIN "resUsers" ru on log."createdUid" = ru.id
                       WHERE (gg."updatedAt" < log."createdAt" OR ru.share IS NOT TRUE)
                         AND ru.active IS TRUE
                         AND gg.closed IS NOT TRUE
                         AND gg."challengeId" IN (%s)
                         AND (gg.state = 'inprogress'
                              OR (gg.state = 'reached' AND gg."endDate" >= %s))
                      GROUP BY gg.id
        `, [String(this.ids) || 'NULL', yesterday]);

        await Goals.browse(res.map(row => row['id'])).updateGoal();

        await this._recomputeChallengeUsers();
        await this._generateGoalsFromChallenge();

        for (const challenge of this) {
            if (await challenge.lastReportDate != _Date.today()) {
                if (await challenge.nextReportDate && _Date.today() >= await challenge.nextReportDate) {
                    await challenge.reportProgress();
                }
                else {
                    // goals closed but still opened at the last report date
                    const closedGoalsToReport = await Goals.search([
                        ['challengeId', '=', challenge.id],
                        ['startDate', '>=', challenge.lastReportDate],
                        ['endDate', '<=', challenge.lastReportDate]
                    ]);
                    if (bool(closedGoalsToReport)) {
                        // some goals need a final report
                        await challenge.reportProgress(null, closedGoalsToReport);
                    }
                }
            }
        }
        await this._checkChallengeReward();
        return true;
    }

    async _getChallengerUsers(domain) {
        const userDomain = literalEval(domain);
        return this.env.items('res.users').search(userDomain);
    }

    /**
     * Recompute the domain to add new users and remove the one no longer matching the domain
     * @returns 
     */
    async _recomputeChallengeUsers() {
        for (const challenge of await this.filtered(c => c.userDomain)) {
            const currentUsers = await challenge.userIds;
            const newUsers = await this._getChallengerUsers(await challenge.userDomain);

            if (!currentUsers.eq(newUsers)) {
                await challenge.set('userIds', newUsers);
            }
        }

        return true;
    }

    /**
     * Start a challenge
     * @returns 
     */
    async actionStart() {
        return this.write({'state': 'inprogress'});
    }

    /**
     * Check a challenge

        Create goals that haven't been created yet (eg: if added users)
        Recompute the current value for each goal related
     * @returns 
     */
    async actionCheck() {
        await (await this.env.items('gamification.goal').search([
            ['challengeId', 'in', this.ids],
            ['state', '=', 'inprogress']
        ])).unlink();

        return this._updateAll();
    }

    /**
     * Manual report of a goal, does not influence automatic report frequency
     * @returns 
     */
    async actionReportProgress() {
        for (const challenge of this) {
            await challenge.reportProgress();
        }
        return true;
    }

    ///// Automatic actions /////

    /**
     * Generate the goals for each line and user.

        If goals already exist for this line and user, the line is skipped. This
        can be called after each change in the list of users or lines.
     * @returns 
     */
    async _generateGoalsFromChallenge() {
        const Goals = this.env.items('gamification.goal');
        for (const challenge of this) {
            const [startDate, endDate] = startEndDateForPeriod(await challenge.period, await challenge.startDate, await challenge.endDate);
            let toUpdate = Goals.browse();

            for (const line of await challenge.lineIds) {
                // there is potentially a lot of users
                // detect the ones with no goal linked to this line
                let dateClause = '';
                const queryParams = [line.id];
                if (startDate) {
                    dateClause += ' AND g."startDate" = %s';
                    queryParams.push(startDate);
                }
                if (endDate) {
                    dateClause += ' AND g."endDate" = %s';
                    queryParams.push(endDate);
                }

                const query = `
                    SELECT u.id AS "userId"
                    FROM "resUsers" u
                    LEFT JOIN "gamificationGoal" g
                            ON (u.id = g."userId")
                    WHERE "lineId" = %s
                        ${dateClause}
                    `;
                const res = await this.env.cr.execute(query, queryParams);
                const userWithGoalIds = res.map(row => row['userId']);

                const participantUserIds = (await challenge.userIds).ids;
                const userSquatingChallengeIds = _.difference(userWithGoalIds, participantUserIds);
                if (userSquatingChallengeIds.length) {
                    // users that used to match the challenge
                    await (await Goals.search([
                        ['challengeId', '=', challenge.id],
                        ['userId', 'in', userSquatingChallengeIds]
                    ])).unlink();
                }
                const values = {
                    'definitionId': (await line.definitionId).id,
                    'lineId': line.id,
                    'targetGoal': await line.targetGoal,
                    'state': 'inprogress',
                };

                if (startDate) {
                    values['startDate'] = startDate;
                }
                if (endDate) {
                    values['endDate'] = endDate;
                }

                // the goal is initialised over the limit to make sure we will compute it at least once
                if (await line.condition === 'higher') {
                    values['current'] = Math.min(await line.targetGoal - 1, 0);
                }
                else {
                    values['current'] = Math.max(await line.targetGoal + 1, 0);
                }

                if (await challenge.remindUpdateDelay) {
                    values['remindUpdateDelay'] = await challenge.remindUpdateDelay;
                }

                for (const userId of _.difference(participantUserIds, userWithGoalIds)) {
                    values['userId'] = userId;
                    toUpdate = toUpdate.or(await Goals.create(values));
                }
            }
            await toUpdate.updateGoal();

            if (this.env.context['commitGamification']) {
                await this.env.cr.commit();
            }
        }

        return true;
    }

    ///// JS utilities /////

    /**
     * Return a serialised version of the goals information if the user has not completed every goal

     * @param user user retrieving progress (false if no distinction,
                     only for ranking challenges)
     * @param restrictGoals compute only the results for this subset of
                               gamification.goal ids, if False retrieve every
                               goal of current running challenge
     * @param restrictTop for challenge lines where visibility_mode is
                                 ``ranking``, retrieve only the best
                                 ``restrictTop`` results and itself, if 0
                                 retrieve all restrictGoalIds has priority
                                 over restrictTop

        format list
        // if visibilityMode == 'ranking'
        {
            'label': <gamification.goal.description label>,
            'description': <gamification.goal.description description>,
            'condition': <reach condition {lower,higher}>,
            'computationMode': <target computation {manually,count,sum,javascript}>,
            'monetary': <{true,false}>,
            'suffix': <value suffix>,
            'action': <{true,false}>,
            'displayMode': <{progress,boolean}>,
            'target': <challenge line target>,
            'ownGoalId': <gamification.goal id where userId == uid>,
            'goals': [
                {
                    'id': <gamification.goal id>,
                    'rank': <user ranking>,
                    'userId': <res.users id>,
                    'label': <res.users label>,
                    'state': <gamification.goal state {draft,inprogress,reached,failed,canceled}>,
                    'completeness': <percentage>,
                    'current': <current value>,
                }
            ]
        },
        // if visibilityMode == 'personal'
        {
            'id': <gamification.goal id>,
            'label': <gamification.goal.description label>,
            'description': <gamification.goal.description description>,
            'condition': <reach condition {lower,higher}>,
            'computationMode': <target computation {manually,count,sum,javascript}>,
            'monetary': <{true,false}>,
            'suffix': <value suffix>,
            'action': <{true,false}>,
            'displayMode': <{progress,boolean}>,
            'target': <challenge line target>,
            'state': <gamification.goal state {draft,inprogress,reached,failed,canceled}>,
            'completeness': <percentage>,
            'current': <current value>,
        }
     */
    async _getSerializedChallengeLines(user?: any, restrictGoals?: any, restrictTop=0) {
        const Goals = this.env.items('gamification.goal');
        const [startDate, endDate] = startEndDateForPeriod(await this['period']);

        const resLines = [];
        for (const line of await this['lineIds']) {
            const definition = await line.definitionId;
            const lineData = {
                'label': await definition.label,
                'description': await definition.description,
                'condition': await definition.condition,
                'computationMode': await definition.computationMode,
                'monetary': await definition.monetary,
                'suffix': await definition.suffix,
                'action': bool(await definition.actionId) ? true : false,
                'displayMode': await definition.displayMode,
                'target': await line.targetGoal,
            }
            const domain = [
                ['lineId', '=', line.id],
                ['state', '!=', 'draft'],
            ];
            if (bool(restrictGoals)) {
                domain.push(['id', 'in', restrictGoals.ids]);
            }
            else {
                // if no subset goals, use the dates for restriction
                if (startDate) {
                    domain.push(['startDate', '=', startDate]);
                }
                if (endDate) {
                    domain.push(['endDate', '=', endDate]);
                }
            }

            if (await this['visibilityMode'] === 'personal') {
                if (!bool(user)) {
                    throw new UserError(await this._t("Retrieving progress for personal challenge without user information"));
                }

                domain.push(['userId', '=', user.id]);

                const goal = await Goals.search(domain, {limit: 1});
                if (!bool(goal)) {
                    continue;
                }

                if (await goal.state != 'reached') {
                    return [];
                }
                update(lineData, await goal.readOne(['id', 'current', 'completeness', 'state']));
                resLines.push(lineData);
                continue;
            }

            lineData['ownGoalId'] = false;
            lineData['goals'] = [];
            const order = "completeness desc, current " + await line.condition === 'higher' ? "desc" : "asc";
            let goals = await Goals.search(domain, {order: "completeness desc, current desc"});
            if (!bool(goals)) {
                continue;
            }

            for (const [ranking, goal] of enumerate(goals)) {
                if (bool(user) && (await goal.userId).eq(user)) {
                    lineData['ownGoalId'] = goal.id;
                }
                else if (restrictTop && ranking > restrictTop) {
                    // not own goal and too low to be in top
                    continue;
                }

                lineData['goals'].push({
                    'id': goal.id,
                    'userId': (await goal.userId).id,
                    'label': await (await goal.userId).label,
                    'rank': ranking,
                    'current': await goal.current,
                    'completeness': await goal.completeness,
                    'state': await goal.state,
                });
            }
            if (len(goals) < 3) {
                // display at least the top 3 in the results
                const missing = 3 - len(goals);
                for (const [ranking, mockGoal] of enumerate(Array(missing).fill({'id': false,
                                                      'userId': false,
                                                      'label': '',
                                                      'current': 0,
                                                      'completeness': 0,
                                                      'state': false}),
                                                    len(goals))) {
                    mockGoal['rank'] = ranking;
                    lineData['goals'].push(mockGoal);
                }
            }

            resLines.push(lineData);
        }
        return resLines;
    }

    ///// Reporting /////

    /**
     * Post report about the progress of the goals
     * @param users users that are concerned by the report. If False, will
                      send the report to every user concerned (goal users and
                      group that receive a copy). Only used for challenge with
                      a visibility mode set to 'personal'.
     * @param subsetGoals goals to restrict the report
     * @returns 
     */
    async reportProgress(users?: [], subsetGoals=false) {
        users = users ?? [];
        let challenge: any = this;

        if (await challenge.visibilityMode == 'ranking') {
            const linesBoards = await challenge._getSerializedChallengeLines(null, subsetGoals);

            const bodyHtml = (await (await (await challenge.reportTemplateId).withContext({challengeLines: linesBoards}))._renderField('bodyHtml', challenge.ids))[challenge.id];

            // send to every follower and participant of the challenge
            await challenge.messagePost({
                body: bodyHtml,
                partnerIds: await challenge.mapped('userIds.partnerId.id'),
                subtypeXmlid: 'mail.mtComment',
                emailLayoutXmlid: 'mail.mailNotificationLight',
            });
            if (bool(await challenge.reportMessageGroupId)) {
                await (await challenge.reportMessageGroupId).messagePost({
                    body: bodyHtml,
                    subtypeXmlid: 'mail.mtComment'
                });
            }
        }

        else {
            // generate individual reports
            for (const user of (bool(users) ? users : await challenge.userIds)) {
                const lines = await challenge._getSerializedChallengeLines(user, subsetGoals);
                if (!bool(lines)) {
                    continue;
                }

                const bodyHtml = (await (await (await (await challenge.reportTemplateId).withUser(user)).withContext({challengeLines: lines}))._renderField('bodyHtml', challenge.ids))[challenge.id];

                // notify message only to users, do not post on the challenge
                await challenge.messageNotify({
                    body: bodyHtml,
                    partnerIds: [(await user.partnerId).id],
                    subtypeXmlid: 'mail.mtComment',
                    emailLayoutXmlid: 'mail.mailNotificationLight',
                });
                if (bool(await challenge.reportMessageGroupId)) {
                    await (await challenge.reportMessageGroupId).messagePost({
                        body: bodyHtml,
                        subtypeXmlid: 'mail.mtComment',
                        emailLayoutXmlid: 'mail.mailNotificationLight',
                    })
                }
            }
        }
        return challenge.write({'lastReportDate': _Date.today()});
    }

    ///// Challenges /////
    async acceptChallenge() {
        const user = await this.env.user();
        const sudoed = await this.sudo();
        await sudoed.messagePost({body: await this._t("%s has joined the challenge", await user.label)});
        await sudoed.write({'invitedUserIds': [[3, user.id]], 'userIds': [[4, user.id]]});
        return sudoed._generateGoalsFromChallenge();
    }

    /**
     * The user discard the suggested challenge
     * @returns 
     */
    async discardChallenge() {
        const user = await this.env.user()
        const sudoed = await this.sudo();
        await sudoed.messagePost({body: await this._t("%s has refused the challenge", await user.label)});
        return sudoed.write({'invitedUserIds': [3, user.id]});
    }

    /**
     * Actions for the end of a challenge

        If a reward was selected, grant it to the correct users.
        Rewards granted at:
            - the end date for a challenge with no periodicity
            - the end of a period for challenge with periodicity
            - when a challenge is manually closed
        (if no end date, a running challenge is never rewarded)
     * @param force 
     */
    async _checkChallengeReward(force=false) {
        const commit = this.env.context['commitGamification'] && this.env.cr.commit;

        for (const challenge of this) {
            const [startDate, endDate] = startEndDateForPeriod(await challenge.period, await challenge.startDate, await challenge.endDate);
            const yesterday = subDate(today(), {days: 1});

            let rewardedUsers = this.env.items('res.users');
            const challengeEnded = force || endDate == _Date.toString(yesterday);
            if (bool(await challenge.rewardId) && (challengeEnded || await challenge.rewardRealtime)) {
                // not using start_date as intemportal goals have a start date but no end_date
                const reachedGoals = await this.env.items('gamification.goal').readGroup([
                    ['challengeId', '=', challenge.id],
                    ['endDate', '=', endDate],
                    ['state', '=', 'reached']
                ], ['userId'], ['userId']);
                for (const reachGoalsUser of reachedGoals) {
                    if (reachGoalsUser['userIdCount'] == len(await challenge.lineIds)) {
                        // the user has succeeded every assigned goal
                        const user = this.env.items('res.users').browse(reachGoalsUser['userId'][0]);
                        if (await challenge.rewardRealtime) {
                            const badges = await this.env.items('gamification.badge.user').searchCount([
                                ['challengeId', '=', challenge.id],
                                ['badgeId', '=', (await challenge.rewardId).id],
                                ['userId', '=', user.id],
                            ]);
                            if (badges > 0) {
                                // has already recieved the badge for this challenge
                                continue;
                            }
                        }
                        await challenge._rewardUser(user, await challenge.rewardId);
                        rewardedUsers = rewardedUsers.or(user);
                        if (commit) {
                            await commit();
                        }
                    }
                }
            }

            if (challengeEnded) {
                // open chatter message
                let messageBody = await this._t("The challenge %s is finished.", await challenge.label);

                if (bool(rewardedUsers)) {
                    const userNames = await rewardedUsers.nameGet();
                    messageBody += _f2(await this._t(
                        "<br/>Reward (badge %(badgeName)s) for every succeeding user was sent to %(users)s."),
                        {badgeName: await (await challenge.rewardId).label,
                        users: userNames.map(([,name]) => name).join(', ')}
                    );
                }
                else {
                    messageBody += await this._t("<br/>Nobody has succeeded to reach every goal, no badge is rewarded for this challenge.");
                }

                // reward bests
                const rewardMessage = await this._t("<br/> %(rank)d. %(userName)s - %(rewardName)s");
                if (bool(await challenge.rewardFirstId)) {
                    const [firstUser, secondUser, thirdUser] = await challenge._getTopNUsers(MAX_VISIBILITY_RANKING);
                    if (bool(firstUser)) {
                        await challenge._rewardUser(firstUser, await challenge.rewardFirstId);
                        messageBody += await this._t("<br/>Special rewards were sent to the top competing users. The ranking for this challenge is :");
                        messageBody += _f2(rewardMessage, {
                            'rank': 1,
                            'userName': await firstUser.label,
                            'rewardName': await (await challenge.rewardFirstId).label,
                        });
                    }
                    else {
                        messageBody += await this._t("Nobody reached the required conditions to receive special badges.")
                    }

                    if (bool(secondUser) && bool(await challenge.rewardSecondId)) {
                        await challenge._rewardUser(secondUser, await challenge.rewardSecondId);
                        messageBody += _f2(rewardMessage, {
                            'rank': 2,
                            'userName': await secondUser.label,
                            'rewardName': await (await challenge.rewardSecondId).label,
                        });
                    }
                    if (bool(thirdUser) && bool(await challenge.rewardThirdId)) {
                        await challenge._rewardUser(thirdUser, await challenge.rewardThirdId);
                        messageBody += _f2(rewardMessage, {
                            'rank': 3,
                            'userName': await thirdUser.label,
                            'rewardName': await (await challenge.rewardThirdId).label,
                        });
                    }
                }

                await challenge.messagePost({
                    body: messageBody,
                    partnerIds: await (await challenge.userIds).map(async (user) => (await user.partnerId).id),
                });
                if (commit) {
                    await commit();
                }
            }
        }

        return true;
    }

    /**
     * Get the top N users for a defined challenge

        Ranking criterias:
            1. succeed every goal of the challenge
            2. total completeness of each goal (can be over 100)

        Only users having reached every goal of the challenge will be returned
        unless the challenge ``rewardFailure`` is set, in which case any user
        may be considered.
     * @param n 
     * @returns an iterable of exactly N records, either User objects or
                  False if there was no user for the rank. There can be no
                  False between two users (if users[k] = false then
                  users[k+1] = false
     */
    async _getTopNUsers(n) {
        const Goals = this.env.items('gamification.goal');
        const [startDate, endDate] = startEndDateForPeriod(await this['period'], await this['startDate'], await this['endDate']);
        let challengers: any = [];
        for (const user of await this['userIds']) {
            let allReached = true;
            let totalCompleteness = 0;
            // every goal of the user for the running period
            const goalIds = await Goals.search([
                ['challengeId', '=', this.id],
                ['userId', '=', user.id],
                ['startDate', '=', startDate],
                ['endDate', '=', endDate]
            ]);
            for (const goal of goalIds) {
                if (await goal.state != 'reached') {
                    allReached = false;
                }
                if (await goal.definitionCondition == 'higher') {
                    // can be over 100
                    totalCompleteness += goal.targetGoal ? (100.0 * await goal.current / await goal.targetGoal) : 0;
                }
                else if (await goal.state == 'reached') {
                    // for lower goals, can not get percentage so 0 or 100
                    totalCompleteness += 100;
                }
            }

            challengers.push({'user': user, 'allReached': allReached, 'totalCompleteness': totalCompleteness});
        }

        challengers = sorted(challengers, (k) => (k['allReached'], k['totalCompleteness']), true);
        if (! await this['rewardFailure']) {
            // only keep the fully successful challengers at the front, could
            // probably use filter since the successful ones are at the front
            challengers = takewhile(c => c['allReached'], challengers);
        }

        // append a tail of False, then keep the first N
        challengers = islice(
            chain(
                [...challengers].map(c => c['user']),
                repeat(false),
            ), 0, n
        );

        return Array.from(challengers);
    }

    /**
     * Create a badge user and send the badge to him
     * @param user the user to reward
     * @param badge the concerned badge
     * @returns 
     */
    async _rewardUser(user, badge) {
        return (await this.env.items('gamification.badge.user').create({
            'userId': user.id,
            'badgeId': badge.id,
            'challengeId': this.id
        }))._sendBadge();
    }
}

/**
 * Gamification challenge line

    Predefined goal for 'gamificationChallenge'
    These are generic list of goals with only the target goal defined
    Should only be created for the gamification.challenge object
 */
@MetaModel.define()
class ChallengeLine extends Model {
    static _module = module; 
    static _name = 'gamification.challenge.line';
    static _description = 'Gamification generic goal for challenge';
    static _order = "sequence, id";

    static challengeId = Fields.Many2one('gamification.challenge', {string: 'Challenge', required: true, ondelete: "CASCADE"});
    static definitionId = Fields.Many2one('gamification.goal.definition', {string: 'Goal Definition', required: true, ondelete: "CASCADE"});
    static sequence = Fields.Integer('Sequence', {help: 'Sequence number for ordering', default: 1});
    static targetGoal = Fields.Float('Target Value to Reach', {required: true});
    static label = Fields.Char("Label", {related: 'definitionId.label', readonly: false});
    static condition = Fields.Selection({string: "Condition", related: 'definitionId.condition', readonly: true});
    static definitionSuffix = Fields.Char("Unit", {related: 'definitionId.suffix', readonly: true});
    static definitionMonetary = Fields.Boolean("Monetary", {related: 'definitionId.monetary', readonly: true});
    static definitionFullSuffix = Fields.Char("Suffix", {related: 'definitionId.fullSuffix', readonly: true});
}
