import { Fields } from "../../../core";
import { MetaModel, TransientModel } from "../../../core/models"

/**
 * Wizard to update a manual goal
 */
@MetaModel.define()
class goalManualWizard extends TransientModel {
    static _module = module;
    static _name = 'gamification.goal.wizard';
    static _description = 'Gamification Goal Wizard';

    static goalId = Fields.Many2one("gamification.goal", {string: 'Goal', required: true});
    static current = Fields.Float('Current');

    /**
     * Wizard action for updating the current value
     * @returns 
     */
    async actionUpdateCurrent() {
        for (const wiz of this) {
            const goal = await wiz.goalId;
            await goal.write({
                current: await wiz.current,
                goalId: goal.id,
                toUpdate: false,
            });
            await goal.updateGoal();
        }

        return false;
    }
}
