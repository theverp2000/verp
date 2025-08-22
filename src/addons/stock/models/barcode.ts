import { Fields, MetaModel, Model } from "../../../core";

@MetaModel.define()
class BarcodeRule extends Model {
  static _module = module;
  static _parents = 'barcode.rule';

  static type = Fields.Selection({selectionAdd: [
    ['weight', 'Weighted Product'],
    ['location', 'Location'],
    ['lot', 'Lot'],
    ['package', 'Package']
  ], ondelete: {
    'weight': 'SET DEFAULT',
    'location': 'SET DEFAULT',
    'lot': 'SET DEFAULT',
    'package': 'SET DEFAULT',
  }});
}