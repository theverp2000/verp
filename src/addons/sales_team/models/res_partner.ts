import { Fields, MetaModel, Model } from "../../../core";

@MetaModel.define()
class ResPartner extends Model {
  static _module = module;
  static _parents = 'res.partner';

  static teamId = Fields.Many2one(
    'crm.team', {
      string: 'Sales Team',
    help: 'If set, this Sales Team will be used for sales and assignments related to this partner'
  })
}
