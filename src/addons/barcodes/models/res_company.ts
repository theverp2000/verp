import { Fields, MetaModel, Model } from "../../../core";

@MetaModel.define()
class ResCompany extends Model {
  static _module = module;
  static _parents = 'res.company';

  async _getDefaultNomenclature() {
    return this.env.ref('barcodes.defaultBarcodeNomenclature', false)
  }

  static nomenclatureId = Fields.Many2one(
      'barcode.nomenclature',
      {string: "Nomenclature",
      default: self => self._getDefaultNomenclature()},
  )
}