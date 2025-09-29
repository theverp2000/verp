import assert from "assert";
import * as fs from 'fs';
import * as path from "path";
import * as xpath from 'xpath';
import * as core from '../../core';
import { Dict } from "../../core/helper/collections";
import * as help from '../../core/tools/save_eval';
import * as xml from '../../core/tools/xml';

function str2bool(value: string) {
  return !['0', 'false', 'off'].includes(value.toLowerCase());
}

function nodeattr2bool(node: Element, attr: string, defaultValue=false) {
  if (! node.getAttribute(attr))
    return defaultValue;
  const val = node.getAttribute(attr)?.trim();
  if (!val)
    return defaultValue;
  return str2bool(val);
}

function _getIdref(self, env, modelStr, idref) {
  const idref2 = {...idref,
                // Command: core.fields.Command,
                // time:time,
                // DateTime:datetime,
                // datetime:datetime,
                // timedelta:timedelta,                relativedelta:relativedelta,
                // version:core.release.major_version,
                // ref:self.id_get,
                // pytz:pytz
              }
  if (modelStr)
    idref2['obj'] = env[modelStr].browse
  return idref2
}

export class XmlImport {
  DATA_ROOTS = ['verp', 'data'];

  mode: any;
  module: string;
  envs: any[];
  idref: {};
  _noupdate: boolean[];
  xmlFilename: string;
  _tags: Record<string, Function>;

  private constructor() {}

  private async _init(cr, module, idref:{}, mode, noupdate=false, xmlFilename:string) {
    this.mode = mode
    this.module = module
    this.idref = idref ? idref : {}
    this._noupdate = [noupdate]
    this.xmlFilename = xmlFilename
    this._tags = {
      'record': this._tagRecord,
      'delete': this._tagDelete,
      'function': this._tagFunction,
      'menuitem': this._tagMenuitem,
      'template': this._tagTemplate,
      'report': this._tagReport,
      'actwindow': this._tagActwindow,
      ...Dict.fromKeys(this.DATA_ROOTS, this._tagRoot)
    }
    this.envs = [true];//[await Environment.new(cr, .global.SUPERUSER_ID)];
  }

  static async new(cr, module, idref:{}, mode, noupdate=false, xmlFilename: string) {
    const obj = new XmlImport();
    obj._init(cr, module, idref, mode, noupdate, xmlFilename);
    return obj;
  }

  getEnv(node: Element, evalContext={}) {
    const uid = node.getAttribute('uid')
    const context = node.getAttribute('context')
    if (uid || context) {

    }
    return this.env;
  }

  makeXmlid(xmlid: string|undefined) {
    if (!xmlid || xmlid.includes('.'))
      return xmlid;
    return `${this.module}.${xmlid}`;
  }

  async _testXmlid(xmlid: string|undefined) {
    if (xmlid && xmlid.includes('.')) {
      const index = xmlid.indexOf('.');
      const [module, id] = [xmlid.slice(0, index), xmlid.slice(index+1, xmlid.length)];
      assert(id.includes('.') != true, `The ID reference "${xmlid}" must contain maximum one dot. They are used to refer to other modules ID, in the form: module.recordId`);
      if (module !== this.module) {
        const modcnt = await this.env.items('ir.module.module').searchCount([['label', '=', module], ['state', '=', 'installed']]);
        assert(modcnt == 1, `The ID "${xmlid}" refers to an uninstalled module`)
      }
    }
  }

  _tagDelete(rec) {}

  _tagReport(rec) {}

  _tagFunction(rec) {}

  _tagActwindow(rec) {}

  _tagMenuitem(rec, parent) {}

  async _tagRecord(rec: Element, extraVals) {
    const recModel = rec.getAttribute("model") || '';
    const env = this.getEnv(rec);
    const recId = rec.getAttribute("id") || '';

    const model = env.items(recModel);

    await this._testXmlid(recId)
    const xid = this.makeXmlid(recId);

    if (this.noupdate && this.mode !== 'init') {
      if (!recId) {
        return null;
      }
      const record = env.items('ir.model.data')._loadXmlid(xid);
      if (record.ok) {
        this.idref[recId] = [record.id, record._name];
        return null;
      }
      else if (nodeattr2bool(rec, 'forcecreate', true)) {
        return null;
      }
    }

    if (xid && xid.split('.')[0] !== this.module) {
      const record = this.env.items('ir.model.data')._loadXmlid(xid);
      if (!record.ok) {
        if (this.noupdate && !nodeattr2bool(rec, 'forcecreate', true)) {
          return null;
        }
        throw new Error(`Cannot update missing record ${xid}`);
      }
    }
    
    const res = {}
    const subRecords: any[] = [];
    const nodes: any[] = xpath.select('./field', rec);
    for (const field of nodes) {
      const f_name = field.getAttibute("name");
      const f_ref = field.getAttibute("ref");
      const f_search = field.getAttibute("search");
      let f_model = field.getAttibute("model");
      if (!f_model && f_name in model._fields) {
        f_model= model._fields[f_name].comodelName;
      }
      const f_use = field.getAttibute('use') ?? 'id';
      let f_val: any = false;

      if (f_search) {
        const idref2 = _getIdref(this, env, f_model, this.idref);
        const q = help.safeEval(f_search, idref2);
        assert(f_model, 'Define an attribute model="..." in your .XML file !');
        // browse the objects searched
        const s = await env.items(f_model).search(q)
        // column definitions of the "local" object
        const _fields = env.models[recModel]._fields
        // if the current field is many2many
        if ((f_name in _fields) && _fields[f_name].type == 'many2many') {
          f_val = [core.Command.set(s.map(x=>x[f_use]))]
        }
        else if (s._length) {
          // otherwise (we are probably in a many2one field),
          // take the first element of the search
          f_val = s[0][f_use]
        }
      }
      else if (f_ref) {
        if (f_name in model._fields && model._fields[f_name].type == 'reference') {
          const val = this.modelIdGet(f_ref);
          f_val = `${val[0]},${val[1]}`;
        }
        else {
          f_val = this.idGet(f_ref);
        }
      }
      else {
        f_val = _evalXml(self, field, env);
        if (f_name in model._fields) {
          let fieldType = model._fields[f_name].type
          if (fieldType === 'many2one') {
            f_val = f_val ? parseInt(f_val) : false
          }
          else if (fieldType === 'integer')
            f_val = parseInt(f_val);
          else if (['float', 'monetary'].includes(fieldType))
            f_val = parseFloat(f_val);
          else if (fieldType === 'boolean' && typeof f_val === 'string')
            f_val = str2bool(f_val)
          else if (fieldType === 'one2many') {
            const nodes: any[] = xpath.select('//record', field);
            for (const child of nodes) {
              subRecords.push([child, model._fields[f_name].relationField])
            }
            if (typeof f_val === 'string') {
              // We do not want to write on the field since we will write
              // on the childrens' parents later
              continue
            }
          }
          else if (fieldType === 'html') {
            if (field.getAttibute('type')?.valueOf() === 'xml') {
              console.warn('HTML field "%s" is declared as type="xml"', f_name);
            }
          }
        }
      }
    }
  }

  _tagTemplate(el) {}

  idGet(idStr, raiseIfNotFound=true) {}

  modelIdGet(idStr, raiseIfNotFound=true) {}

  async _tagRoot(el) {
    for (const rec of Object.values<any>(el.childNodes)) {
      const f = this._tags[rec.tagName]
      if (!f) {
        continue
      }

      this.envs.push(this.getEnv(el));
      this._noupdate.push(nodeattr2bool(el, 'noupdate', this.noupdate));
      try {
        await f(rec)
      } catch(e) {

      } finally {
        this._noupdate.pop()
        this.envs.pop()
      }
    }
  }

  get env() {
    return this.envs[this.envs.length-1];
  }

  get noupdate() {
    return this._noupdate[this._noupdate.length-1];
  }

  async parse(de: Element) {
    assert(this.DATA_ROOTS.includes(de.tagName), "Root xml tag must be <verp> or <data>.");
    await this._tagRoot(de);
  }
}

function getroot(de) {
  const nodes = xpath.select("//data", de);
  if (!nodes[0]) {
    throw new Error("Object is not XML data document");
  }
  return nodes[0] as Element;
}

export async function convertXmlImport(cr, module: string, xmlfile: string|path.ParsedPath, idref: {}, mode: string, noupdate: boolean) {
  const xmlFilename = typeof xmlfile === 'string' ? xmlfile : xmlfile.name;
  const data = fs.readFileSync(xmlFilename);
  const doc = xml.parseXml(data.toString());

  const obj = await XmlImport.new(cr, module, idref, mode, noupdate, xmlFilename);
  await obj.parse(getroot(doc));
}

function _evalXml(self: any, node: Element, env: any): any {
  return '';
}

