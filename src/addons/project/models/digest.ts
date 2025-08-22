import { format } from "util";
import { Fields } from "../../../core";
import { AccessError } from "../../../core/helper";
import { _super, MetaModel, Model } from "../../../core/models"

@MetaModel.define()
class Digest extends Model {
    static _module = module;
    static _parents = 'digest.digest';

    static kpiProjectTaskOpened = Fields.Boolean('Open Tasks');
    static kpiProjectTaskOpenedValue = Fields.Integer({compute: '_computeProjectTaskOpenedValue'});

    async _computeProjectTaskOpenedValue() {
        if (!await (await this.env.user()).hasGroup('project.groupProjectUser')) {
            throw new AccessError(await this._t("Do not have access, skip this data for user's digest email"));
        }
        const Tasks= this.env.items('project.task');
        for (const record of this) {
            const [start, end, company] = await record._getKpiComputeParameters();
            await record.set('kpiProjectTaskOpenedValue', await Tasks.searchCount([
                ['stageId.fold', '=', false],
                ['createdAt', '>=', start],
                ['createdAt', '<', end],
                ['companyId', '=', company.id],
                ['displayProjectId', '!=', false],
            ]));
        }
    }

    async _computeKpisActions(company, user) {
        const res = await _super(Digest, this)._computeKpisActions(company, user);
        res['kpiProjectTaskOpened'] = format('project.openViewProjectAll&menuId=%s', await this.env.refId('project.menuMainPm'));
        return res;
    }
}
