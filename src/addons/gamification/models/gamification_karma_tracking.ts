import { DateTime } from "luxon";
import { _Date, api, Fields } from "../../../core";
import { MetaModel, Model } from "../../../core/models";
import { _f, setDate } from "../../../core/tools";
import { monthrange } from "../../../core/tools/calendar";

@MetaModel.define()
class KarmaTracking extends Model {
    static _module = module;
    static _name = 'gamification.karma.tracking';
    static _description = 'Track Karma Changes';
    static _recName = 'userId';
    static _order = 'trackingDate DESC';

    static userId = Fields.Many2one('res.users', { string: 'User', index: true, readonly: true, required: true, ondelete: 'CASCADE' });
    static oldValue = Fields.Integer('Old Karma Value', { required: true, readonly: true });
    static newValue = Fields.Integer('New Karma Value', { required: true, readonly: true });
    static consolidated = Fields.Boolean('Consolidated');
    static trackingDate = Fields.Date({ default: self => _Date.contextToday(self) });

    /**
     * Consolidate last month. Used by a cron to cleanup tracking records.
     * @returns 
     */
    @api.model()
    async _consolidateLastMonth() {
        const previousMonthStart = DateTime.fromJSDate(_Date.today()).plus({ months: -1 }).set({ day: 1 }).toJSDate();
        return this._processConsolidate(previousMonthStart);
    }

    /**
     * Consolidate trackings into a single record for a given month, starting
        at a from_date (included). End date is set to last day of current month
        using a smart calendar.monthrange construction.
     * @param fromDate 
     * @returns 
     */
    async _processConsolidate(fromDate: Date) {
        const endDate = setDate(fromDate, { day: monthrange(fromDate.getFullYear(), fromDate.getMonth() + 1)[1] });
        const selectQuery = `
SELECT "userId",
(
    SELECT "oldValue" from "gamificationKarmaTracking" "oldTracking"
    WHERE "oldTracking"."userId" = "gamificationKarmaTracking"."userId"
        AND "trackingDate"::timestamp BETWEEN {fromDate} AND {toDate}
        AND consolidated IS NOT TRUE
        ORDER BY "trackingDate" ASC LIMIT 1
), (
    SELECT "newValue" from "gamificationKarmaTracking" "newTracking"
    WHERE "newTracking"."userId" = "gamificationKarmaTracking"."userId"
        AND "trackingDate"::timestamp BETWEEN {fromDate} AND {toDate}
        AND consolidated IS NOT TRUE
        ORDER BY "trackingDate" DESC LIMIT 1
)
FROM "gamificationKarmaTracking"
WHERE "trackingDate"::timestamp BETWEEN {fromDate} AND {toDate}
AND consolidated IS NOT TRUE
GROUP BY "userId"`;
        const results = await this._cr.execute(_f(selectQuery, {
            'fromDate': fromDate.toISOString(),
            'toDate': endDate.toISOString(),
        }));
        if (results.length) {
            for (const result of results) {
                result['consolidated'] = true;
                result['trackingDate'] = _Date.toString(fromDate);
            }
            await this.create(results);

            await (await this.search([
                ['trackingDate', '>=', fromDate],
                ['trackingDate', '<=', endDate],
                ['consolidated', '!=', true]]
            )).unlink();
        }
        return true;
    }
}