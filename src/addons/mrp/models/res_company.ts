import { _super, api, Fields, MetaModel, Model } from "../../../core";

@MetaModel.define()
class Company extends Model {
    static _module = module;
    static _parents = 'res.company';

    static manufacturingLead = Fields.Float('Manufacturing Lead Time', {
        default: 0.0, required: true,
        help: "Security days for each manufacturing operation."
    });

    async _createUnbuildSequence() {
        const unbuildVals = [];
        for (const company of this) {
            unbuildVals.push({
                'label': 'Unbuild',
                'code': 'mrp.unbuild',
                'companyId': company.id,
                'prefix': 'UB/',
                'padding': 5,
                'numberNext': 1,
                'numberIncrement': 1
            });
        }
        if (unbuildVals.length) {
            await this.env.items('ir.sequence').create(unbuildVals);
        }
    }

    @api.model()
    async createMissingUnbuildSequences() {
        const companyIds = await this.env.items('res.company').search([]);
        const companyHasUnbuildSeq = await (await this.env.items('ir.sequence').search([['code', '=', 'mrp.unbuild']])).mapped('companyId');
        const companyTodoSequence = companyIds.sub(companyHasUnbuildSeq);
        await companyTodoSequence._createUnbuildSequence();
    }

    async _createPerCompanySequences() {
        await _super(Company, this)._createPerCompanySequences();
        await this._createUnbuildSequence();
    }
}
