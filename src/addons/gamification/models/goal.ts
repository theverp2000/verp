import { DateTime } from "luxon";
import { format } from "node:util";
import { _Date, api, Fields } from "../../../core";
import { Dict, KeyError, MapKey, UserError } from "../../../core/helper";
import { _super, MetaModel, Model } from "../../../core/models";
import { _f2, bool, floatRound, isInstance, len, subDate, today, update } from "../../../core/tools";
import { literalEval } from "../../../core/tools/ast";
import { unsafeAsync, unsafeEval } from "../../../core/tools/save_eval";

const DOMAIN_TEMPLATE = "[['store', '=', true], '|', ['modelId', '=', modelId], ['modelId', 'in', modelInheritedIds]%s]"

/**
 *  Goal definition

    A goal definition contains the way to evaluate an objective
    Each module wanting to be able to set goals to the users needs to create
    a new gamificationGoalDefinition

 */
@MetaModel.define()
class GoalDefinition extends Model {
    static _module = module;
    static _name = 'gamification.goal.definition';
    static _description = 'Gamification Goal Definition';

    static label = Fields.Char("Goal Definition", { required: true, translate: true });
    static description = Fields.Text("Goal Description");
    static monetary = Fields.Boolean("Monetary Value", { default: false, help: "The target and current value are defined in the company currency." });
    static suffix = Fields.Char("Suffix", { help: "The unit of the target and current values", translate: true });
    static fullSuffix = Fields.Char("Full Suffix", { compute: '_computeFullSuffix', help: "The currency and suffix field" });
    static computationMode = Fields.Selection([
        ['manually', "Recorded manually"],
        ['count', "Automatic: number of records"],
        ['sum', "Automatic: sum on a field"],
        ['javascript', "Automatic: execute a specific Javascript code"],
    ], {
        default: 'manually', string: "Computation Mode", required: true,
        help: "Define how the goals will be computed. The result of the operation will be stored in the field 'Current'."
    });
    static displayMode = Fields.Selection([
        ['progress', "Progressive (using numerical values)"],
        ['boolean', "Exclusive (done or not-done)"],
    ], { default: 'progress', string: "Displayed as", required: true });
    static modelId = Fields.Many2one('ir.model', { string: 'Model', help: 'The model object for the field to evaluate' });
    static modelInheritedIds = Fields.Many2many('ir.model', { related: 'modelId.inheritedModelIds' });
    static fieldId = Fields.Many2one(
        'ir.model.fields', {
            string: 'Field to Sum', help: 'The field containing the value to evaluate',
        domain: format(DOMAIN_TEMPLATE, '')
    }
    );
    static fieldDateId = Fields.Many2one(
        'ir.model.fields', {
            string: 'Date Field', help: 'The date to use for the time period evaluated',
        domain: format(DOMAIN_TEMPLATE, ", ['ttype', 'in', ['date', 'datetime']]")
    }
    );
    static domain = Fields.Char(
        "Filter Domain", {
            required: true, default: "[]",
        help: ["Domain for filtering records. General rule, not user depending,",
            " e.g. [['state', '=', 'done']]. The expression can contain",
            " reference to 'user' which is a browse record of the current",
            " user if not in batch mode."].join('')
    });

    static batchMode = Fields.Boolean("Batch Mode", { help: "Evaluate the expression in batch instead of once for each user" });
    static batchDistinctiveField = Fields.Many2one('ir.model.fields', { string: "Distinctive field for batch user", help: "In batch mode, this indicates which field distinguishes one user from the other, e.g. userId, partner_id..." });
    static batchUserExpression = Fields.Char("Evaluated expression for batch mode", { help: "The value to compare with the distinctive field. The expression can contain reference to 'user' which is a browse record of the current user, e.g. user.id, user.partnerId.id..." });
    static computeCode = Fields.Text("Javascript Code", { help: "Javascript code to be executed for each user. 'result' should contains the new current value. Evaluated user can be access through object.userId." });
    static condition = Fields.Selection([
        ['higher', "The higher the better"],
        ['lower', "The lower the better"]
    ], {
        default: 'higher', required: true, string: "Goal Performance",
        help: "A goal is considered as completed when the current value is compared to the value to reach"
    });
    static actionId = Fields.Many2one('ir.actions.actwindow', { string: "Action", help: "The action that will be called to update the goal value." });
    static resIdField = Fields.Char("ID Field of user", { help: "The field name on the user profile (res.users) containing the value for resId for action." });

    @api.depends('suffix', 'monetary')  // also depends of user...
    async _computeFullSuffix() {
        for (const goal of this) {
            const items = [];

            if (await goal.monetary) {
                items.push(await (await (await this.env.company()).currencyId).symbol || '¤');
            }
            if (await goal.suffix) {
                items.push(await goal.suffix);
            }

            await goal.set('fullSuffix', items.join(' '));
        }
    }

    async _checkDomainValidity() {
        // take admin as should always be present
        for (const definition of this) {
            if (!['count', 'sum'].includes(await definition.computationMode)) {
                continue;
            }

            const Obj = this.env.items(await (await definition.modelId).model);
            try {
                const user = await this.env.user();
                const domain = unsafeEval(await definition.domain, {
                    'user': await user.withUser(user)
                });
                // dummy search to make sure the domain is valid
                await Obj.searchCount(domain);
            }
            catch (e) { // ValueError, SyntaxError
                let msg = e.message;
                if (isInstance(e, SyntaxError)) {
                    msg = e.stack;
                }
                throw new UserError(await this._t("The domain for the definition %s seems incorrect, please check it.\n\n%s", definition.label, msg));
            }
        }
        return true;
    }

    /**
     * make sure the selected field and model are usable
     * @returns 
     */
    async _checkModelValidity() {
        for (const definition of this) {
            try {
                if (!(bool(await definition.modelId) && bool(await definition.fieldId))) {
                    continue;
                }

                const model = this.env.items(await (await definition.modelId).model);
                const field = model._fields.get(await (await definition.fieldId).label);
                if (!(field && field.store)) {
                    throw new UserError(_f2(await this._t(
                        "The model configuration for the definition %(name)s seems incorrect, please check it.\n\n%(fieldName)s not stored"), {
                        name: await definition.label,
                        fieldName: await (await definition.fieldId).label
                    }
                    ));
                }
            }
            catch (e) {
                if (isInstance(e, KeyError)) {
                    throw new UserError(_f2(await this._t(
                        "The model configuration for the definition %(name)s seems incorrect, please check it.\n\n%(error)s not found"), {
                        name: await definition.label,
                        error: e.message
                    }
                    ));
                } else {
                    throw e;
                }
            }
        }
    }

    @api.modelCreateMulti()
    async create(valsList) {
        const definitions = await _super(GoalDefinition, this).create(valsList);
        await (await definitions.filteredDomain([
            ['computationMode', 'in', ['count', 'sum']],
        ]))._checkDomainValidity();
        await (await definitions.filteredDomain([
            ['fieldId', '=', 'true'],
        ]))._checkModelValidity();
        return definitions;
    }

    async write(vals) {
        const res = await _super(GoalDefinition, this).write(vals);
        if (['count', 'sum'].includes(vals['computationMode'] ?? 'count') && (vals['domain'] || vals['modelId'])) {
            await this._checkDomainValidity();
        }
        if (vals['fieldId'] || vals['modelId'] || vals['batchMode']) {
            await this._checkModelValidity();
        }
        return res;
    }
}

/**
 * Goal instance for a user

    An individual goal for a user on a specified time period
 */
@MetaModel.define()
class Goal extends Model {
    static _module = module;
    static _name = 'gamification.goal';
    static _description = 'Gamification Goal';
    static _recName = 'definitionId';
    static _order = 'startDate desc, endDate desc, definitionId, id';

    static definitionId = Fields.Many2one('gamification.goal.definition', { string: "Goal Definition", required: true, ondelete: "CASCADE" });
    static userId = Fields.Many2one('res.users', { string: "User", required: true, autojoin: true, ondelete: "CASCADE" });
    static lineId = Fields.Many2one('gamification.challenge.line', { string: "Challenge Line", ondelete: "CASCADE" });
    static challengeId = Fields.Many2one({
        related: 'lineId.challengeId', store: true, readonly: true, index: true,
        help: "Challenge that generated the goal, assign challenge to users to generate goals with a value in this field."
    });
    static startDate = Fields.Date("Start Date", { default: () => _Date.today() });
    static endDate = Fields.Date("End Date");  // no start and end = always active
    static targetGoal = Fields.Float('To Reach', { required: true });
    // no goal = global index
    static current = Fields.Float("Current Value", { required: true, default: 0 });
    static completeness = Fields.Float("Completeness", { compute: '_getCompletion' });
    static state = Fields.Selection([
        ['draft', "Draft"],
        ['inprogress', "In progress"],
        ['reached', "Reached"],
        ['failed', "Failed"],
        ['canceled', "Canceled"],
    ], { default: 'draft', string: 'State', required: true });
    static toUpdate = Fields.Boolean('To update');
    static closed = Fields.Boolean('Closed goal', { help: "These goals will not be recomputed." });

    static computationMode = Fields.Selection({ related: 'definitionId.computationMode', readonly: false });
    static remindUpdateDelay = Fields.Integer(
        "Remind delay", {
            help: ["The number of days after which the user ",
                "assigned to a manual goal will be reminded. ",
                "Never reminded if no value is specified."].join('')
    });
    static lastUpdate = Fields.Date(
        "Last Update",
        {
            help: ["In case of manual goal, reminders are sent if the goal as not ",
                "been updated for a while (defined in challenge). Ignored in ",
                "case of non-manual goal or goal not linked to a challenge."].join('')
        });

    static definitionDescription = Fields.Text("Definition Description", { related: 'definitionId.description', readonly: true });
    static definitionCondition = Fields.Selection({ string: "Definition Condition", related: 'definitionId.condition', readonly: true });
    static definitionSuffix = Fields.Char("Suffix", { related: 'definitionId.fullSuffix', readonly: true });
    static definitionDisplay = Fields.Selection({ string: "Display Mode", related: 'definitionId.displayMode', readonly: true });

    /**
     * Return the percentage of completeness of the goal, between 0 and 100
     */
    @api.depends('current', 'targetGoal', 'definitionId.condition')
    async _getCompletion() {
        for (const goal of this) {
            const [current, targetGoal] = await goal('current', 'targetGoal');
            let completeness;
            if (await goal.definitionCondition === 'higher') {
                if (current >= targetGoal) {
                    completeness = 100.0;
                }
                else {
                    completeness = targetGoal ? floatRound(100.0 * current / targetGoal, 2) : 0;
                }
            }
            else if (current < targetGoal) {
                // a goal 'lower than' has only two values possible: 0 or 100%
                completeness = 100.0;
            }
            else {
                completeness = 0.0;
            }
            await goal.set('completeness', completeness);
        }
    }

    /**
     * Verify if a goal has not been updated for some time and send a
        reminder message of needed.

     * @returns data to write on the goal object
     */
    async _checkRemindDelay() {
        if (!(await this['remindUpdateDelay'] && await this['lastUpdate'])) {
            return {};
        }

        const deltaMax = { days: await this['remindUpdateDelay'] };
        const lastUpdate = _Date.toDate(await this['lastUpdate']) as Date;
        if (subDate(today(), deltaMax) < lastUpdate) {
            return {};
        }

        // generate a reminder report
        const bodyHtml = (await (await this.env.ref('gamification.emailTemplateGoalReminder'))._renderField('bodyHtml', this.ids, { computeLang: true }))[this.id];
        await this.messageNotify({
            body: bodyHtml,
            partnerIds: [(await (await this['userId']).partnerId).id],
            subtypeXmlid: 'mail.mtComment',
            emailLayoutXmlid: 'mail.mailNotificationLight',
        });

        return { 'toUpdate': true };
    }

    /**
     * Generate values to write after recomputation of a goal score
     * @param newValue 
     * @returns 
     */
    async _getWriteValues(newValue) {
        const result = new MapKey();;
        if (newValue == await this['current']) {
            // avoid useless write if the new value is the same as the old one
            return result;
        }
        const values = { 'current': newValue };
        if ((await (await this['definitionId']).condition === 'higher' && newValue >= await this['targetGoal'])
            || (await (await this['definitionId']).condition === 'lower' && newValue <= await this['targetGoal'])) {
            // success, do no set closed as can still change
            values['state'] = 'reached';
        }
        else if (await this['endDate'] && _Date.today() > await this['endDate']) {
            // check goal failure
            values['state'] = 'failed';
            values['closed'] = true;
        }
        return result.set(this, values);
    }

    /**
     * Update the goals to recomputes values and change of states

        If a manual goal is not updated for enough time, the user will be
        reminded to do so (done only once, in 'inprogress' state).
        If a goal reaches the target value, the status is set to reached
        If the end date is passed (at least +1 day, time not considered) without
        the target value being reached, the goal is set as failed.
     */
    async updateGoal() {
        const goalsByDefinition = new MapKey();
        for (const goal of await this.withContext({ prefetchFields: false })) {
            goalsByDefinition.setdefault(await goal.definitionId, []).push(goal);
        }

        for (const [definition, goals] of goalsByDefinition.items()) {
            const goalsToWrite = new MapKey();
            if (await definition.computationMode === 'manually') {
                for (const goal of goals) {
                    goalsToWrite.set(goal, await goal._checkRemindDelay());
                }
            }
            else if (await definition.computationMode === 'javascript') {
                // TODO batch execution
                for (const goal of goals) {
                    // execute the chosen method
                    const cxt = {
                        object: goal,
                        env: this.env,
                        time: DateTime,
                        datetime: DateTime,
                    }
                    const code = (await definition.computeCode).trim();
                    console.warn('Check hear....');
                    const result = await unsafeAsync(code, cxt, { mode: "exec", return: true });//, nocopy: true});
                    // the result of the evaluated codeis put in the 'result' local variable, propagated to the context
                    // const result = cxt['result'];
                    if (typeof result === 'number') {
                        update(goalsToWrite, await goal._getWriteValues(result));
                    }
                    else {
                        console.error("Invalid return content '%s' from the evaluation of code for definition %s, expected a number", result, await definition.label);
                    }
                }
            }

            else if (['count', 'sum'].includes(await definition.computationMode)) {  // count or sum
                const Obj = this.env.items(await (await definition.modelId).model);

                const fieldDateName = await (await definition.fieldDateId).label;
                if (await definition.batchMode) {
                    // batch mode, trying to do as much as possible in one request
                    const generalDomain = literalEval(await definition.domain);
                    const fieldName = await (await definition.batchDistinctiveField).label;
                    const subqueries = new MapKey(([s, e]) => String([s, e]));
                    for (const goal of goals) {
                        const startDate = fieldDateName && await goal.startDate || false;
                        const endDate = fieldDateName && await goal.endDate || false;
                        subqueries.setdefault([startDate, endDate], new Dict()).update({ [goal.id]: await unsafeAsync(await definition.batchUserExpression, { 'user': await goal.userId }) });
                    }

                    // the global query should be split by time periods (especially for recurrent goals)
                    for (const [[startDate, endDate], queryGoals] of subqueries.items()) {
                        const subqueryDomain = Array.from(generalDomain);
                        subqueryDomain.push([fieldName, 'in', Array.from(new Set(queryGoals.values()))]);
                        if (startDate) {
                            subqueryDomain.push([fieldDateName, '>=', startDate]);
                        }
                        if (endDate) {
                            subqueryDomain.push([fieldDateName, '<=', endDate]);
                        }

                        let valueFieldName, userValues;
                        if (await definition.computationMode === 'count') {
                            valueFieldName = fieldName + '_count';
                            if (fieldName == 'id') {
                                // grouping on id does not work and is similar to search anyway
                                const users = await Obj.search(subqueryDomain);
                                userValues = await users.map(user => ({ id: user.id, [valueFieldName]: 1 }));
                            }
                            else {
                                userValues = await Obj.readGroup(subqueryDomain, [fieldName], [fieldName]);
                            }
                        }

                        else {  // sum
                            valueFieldName = await (await definition.fieldId).label;
                            if (fieldName == 'id') {
                                userValues = await Obj.searchRead(subqueryDomain, ['id', valueFieldName]);
                            }
                            else {
                                userValues = await Obj.readGroup(subqueryDomain, [fieldName, format('%s:sum', valueFieldName)], [fieldName]);
                            }
                        }

                        // user_values has format of read_group: [{'partner_id': 42, 'partner_id_count': 3},...]
                        for (const goal of await goals.filter(g => g.id in queryGoals)) {
                            for (const userValue of userValues) {
                                let queriedValue = fieldName in userValue && userValue[fieldName] || false;
                                if (Array.isArray(queriedValue) && len(queriedValue) == 2 && typeof (queriedValue[0]) === 'number') {
                                    queriedValue = queriedValue[0];
                                }
                                if (queriedValue == queryGoals[goal.id]) {
                                    const newValue = userValue[valueFieldName] ?? await goal.current;
                                    update(goalsToWrite, await goal._getWriteValues(newValue));
                                }
                            }
                        }
                    }
                }
                else {
                    for (const goal of goals) {
                        // eval the domain with user replaced by goal user object
                        const domain = await unsafeAsync(await definition.domain, { 'user': await goal.userId });

                        // add temporal clause(s) to the domain if fields are filled on the goal
                        if (await goal.startDate && fieldDateName) {
                            domain.push([fieldDateName, '>=', await goal.startDate]);
                        }
                        if (await goal.endDate && fieldDateName) {
                            domain.push([fieldDateName, '<=', await goal.endDate]);
                        }

                        let newValue;
                        if (await definition.computationMode == 'sum') {
                            const fieldName = await (await definition.fieldId).label;
                            const res = await Obj.readGroup(domain, [fieldName], []);
                            newValue = res && res[0][fieldName] || 0.0;
                        }
                        else {  // computation mode = count
                            newValue = await Obj.searchCount(domain);
                        }

                        update(goalsToWrite, await goal._getWriteValues(newValue));
                    }
                }
            }
            else {
                console.error(
                    "Invalid computation mode '%s' in definition %s",
                    await definition.computationMode, await definition.label);
            }

            for (const [goal, values] of goalsToWrite.items()) {
                if (!bool(values)) {
                    continue;
                }
                await goal.write(values);
            }
            if (this.env.context['commitGamification']) {
                await this.env.cr.commit();
            }
        }
        return true;
    }

    /**
     * Mark a goal as started.

        This should only be used when creating goals manually (in draft state)
     * @returns 
     */
    async actionStart() {
        await this.write({ 'state': 'inprogress' });
        return this.updateGoal();
    }

    /**
     * Mark a goal as reached.

        If the target goal condition is not met, the state will be reset to In
        Progress at the next goal update until the end date.
     * @returns 
     */
    async actionReach() {
        return this.write({ 'state': 'reached' });
    }

    /**
     * Set the state of the goal to failed.

        A failed goal will be ignored in future checks.
     * @returns 
     */
    async actionFail() {
        return this.write({ 'state': 'failed' });
    }

    /**
     * Reset the completion after setting a goal as reached or failed.

        This is only the current state, if the date and/or target criteria
        match the conditions for a change of state, this will be applied at the
        next goal update.
     * @returns 
     */
    async actionCancel() {
        return this.write({ 'state': 'inprogress' });
    }

    @api.modelCreateMulti()
    async create(valsList) {
        return _super(Goal, await (await this.withContext({ noRemindGoal: true }))).create(valsList);
    }

    /**
     * Overwrite the write method to update the last_update field to today

        If the current value is changed and the report frequency is set to On
        change, a report is generated
     * @param vals 
     * @returns 
     */
    async write(vals) {
        vals['lastUpdate'] = await _Date.contextToday(this);
        const result = await _super(Goal, this).write(vals);
        for (const goal of this) {
            if (await goal.state != "draft" && ('definitionId' in vals || 'userId' in vals)) {
                // avoid drag&drop in kanban view
                throw new UserError(await this._t('Can not modify the configuration of a started goal'));
            }

            if (vals['current'] && !('noRemindGoal' in this.env.context)) {
                if (await (await goal.challengeId).reportMessageFrequency === 'onchange') {
                    await (await (await goal.challengeId).sudo()).reportProgress({ users: await goal.userId });
                }
            }
        }
        return result;
    }

    /**
     * Get the ir.action related to update the goal

        In case of a manual goal, should return a wizard to update the value
     * @returns action description in a dictionary
     */
    async getAction() {
        const definition = await this['definitionId'];
        if (bool(await definition.actionId)) {
            // open a the action linked to the goal
            const action = await (await definition.actionId).readOne();

            if (await definition.resIdField) {
                const currentUser = await (await this.env.user()).withUser(await this.env.user());
                action['resId'] = await unsafeAsync(await definition.resIdField, {
                    'user': currentUser
                });

                // if one element to display, should see it in form mode if possible
                const views = action['views'].filter(([viewId, mode]) => mode == 'form');
                if (views.length) {
                    action['views'] = views;
                }
            }
            return action;
        }
        if (await this['computationMode'] === 'manually') {
            // open a wizard window to update the value manually
            const action = {
                'label': await this._t("Update %s", await definition.label),
                'id': this.id,
                'type': 'ir.actions.actwindow',
                'views': [[false, 'form']],
                'target': 'new',
                'context': { 'default_goalId': this.id, 'default_current': await this['current'] },
                'resModel': 'gamification.goal.wizard'
            }
            return action;
        }
        return false;
    }
}