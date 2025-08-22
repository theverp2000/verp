import { Fields, MetaModel, Model } from "../../../core";

@MetaModel.define()
class ResCompany extends Model {
    static _module = module;
    static _parents = "res.company";
    static _checkCompanyAuto = true;

    static saleOrderTemplateId = Fields.Many2one(
        "sale.order.template", {string: "Default Sale Template",
        domain: "['|', ['companyId', '=', false], ['companyId', '=', id]]",
        checkCompany: true,}
    );
}
