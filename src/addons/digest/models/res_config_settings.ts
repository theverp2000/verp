import { Fields, MetaModel, TransientModel } from "../../../core";

@MetaModel.define()
class ResConfigSettings extends TransientModel {
  static _module = module;
  static _parents = 'res.config.settings';

  static digestEmails = Fields.Boolean({string: "Digest Emails", configParameter: 'digest.defaultDigestEmails'});
  static digestId = Fields.Many2one('digest.digest', {string: 'Digest Email', configParameter: 'digest.defaultDigestId'});
}