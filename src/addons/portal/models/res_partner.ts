import { MetaModel, Model } from "../../../core";
import { bool } from "../../../core/tools";

@MetaModel.define()
class ResPartner extends Model {
  static _module = module;
  static _parents = 'res.partner';

  /**
   * `vat` is a commercial field, synced between the parent (commercial
    entity) and the children. Only the commercial entity should be able to
    edit it (as in backend). 
   * @returns 
   */
  async canEditVat() {
    return ! bool(await this['parentId']);
  }
}