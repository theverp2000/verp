async function* template1140(self, values, log={}) {
  let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;
  try {
      // _debug(String(template1140.name)); // detail code
  log["lastPathNode"] = "/t";
  log["lastPathNode"] = "/t/t";
  yield `
      `;
  {
  async function* tCallContent(self, values, log) {
      log["lastPathNode"] = "/t/t/t[0]";
      yield `
          `;
      values["_formClasses"] = "o-wsale-products-searchbar-form w-100 w-md-auto mr-auto mb-2";
      log["lastPathNode"] = "/t/t/t[1]";
      yield `
          `;
      values["_classes"] = "input-group tony-test";
      log["lastPathNode"] = "/t/t/t[2]";
      yield `
          `;
      values["searchType"] = "products";
      log["lastPathNode"] = "/t/t/t[3]";
      yield `
          `;
      values["action"] = await values['keep']('/shop'+ bool(values['category']) ? ('/category/' + await values['category'].slug()) : '', {'search': 0}) || '/shop';
      log["lastPathNode"] = "/t/t/t[4]";
      yield `
          `;
      values["displayImage"] = "true";
      log["lastPathNode"] = "/t/t/t[5]";
      yield `
          `;
      values["displayDescription"] = "true";
      log["lastPathNode"] = "/t/t/t[6]";
      yield `
          `;
      values["displayExtraLink"] = "true";
      log["lastPathNode"] = "/t/t/t[7]";
      yield `
          `;
      values["displayDetail"] = "true";
      log["lastPathNode"] = "/t/t/t[8]";
      yield `
          `;
      if (values['attribValues']) {
          log["lastPathNode"] = "/t/t/t[8]/t";
          yield `
              `;
          let size_16;            let t_foreach_15 = values['attribValues'] ?? [];            if (typeof(t_foreach_15) === 'number') {              size_16 = t_foreach_15;              values["a_size"] = size_16;              t_foreach_15 = range(size_16);            }            else if ('_length' in t_foreach_15) {              size_16 = t_foreach_15._length;              values["a_size"] = size_16;            }            else if ('length' in t_foreach_15) {              size_16 = t_foreach_15.length;              values["a_size"] = size_16;            }            else if ('size' in t_foreach_15) {              size_16 = t_foreach_15.size;              values["a_size"] = size_16;            }            else {              size_16 = null;            }            let hasValue_17 = false;            if (t_foreach_15 instanceof Map || t_foreach_15 instanceof MapKey) {              t_foreach_15 = t_foreach_15.entries();              hasValue_17 = true;            }            if (typeof t_foreach_15 === 'object' && !isIterable(t_foreach_15)) {              t_foreach_15 = Object.entries(t_foreach_15);              hasValue_17 = true;            }
          for (const [index, item] of enumerate(t_foreach_15)) {              values["a_index"] = index;              if (hasValue_17) {                [values["a"], values["a_value"]] = item;              }              else {                values["a"] = item;                values["a_value"] = item;              }              values["a_first"] = values["a_index"] == 0;              if (size_16 != null) {                values["a_last"] = index + 1 === size_16;              }              values["a_odd"] = index % 2;              values["a_even"] = ! values["a_odd"];              values["a_parity"] = values["a_odd"] ? 'odd' : 'even';
              log["lastPathNode"] = "/t/t/t[8]/t";
              log["lastPathNode"] = "/t/t/t[8]/t/input";
              attrs = {};
              attrs["type"] = "hidden";
              attrs["name"] = "attrib";
              attrs["data-oe-model"] = "ir.ui.view";
              attrs["data-oe-id"] = "1140";
              attrs["data-oe-field"] = "arch";
              attrs["data-oe-xpath"] = "/t[1]/t[1]/t[9]/t[1]/input[1]";
              attrs["value"] = format('%s-%s', values['a'][0], values['a'][1]);
              tagName = "input";
              yield `
                  <input`;
              attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
              for (const [name, value] of Object.entries(attrs)) {
                    if (value || typeof(value) === 'string') {
                          yield ' ' + String(name) + '="' + String(value) + '"'
                    }
              }
              yield `/>
              `;
          }
          yield `
          `;
      }
      yield `
      `;
  }
  tCallValues = Object.assign({},  values);
  let res = '';
  for await (const str of tCallContent(self, tCallValues, log)) 
      res = res + str;
  tCallValues['0'] = markup(res)
  }
  tCallOptions = Object.assign({}, compileOptions);    Object.assign(tCallOptions, {'callerTemplate': "website_sale.search", 'lastPathNode': "/t/t" })
  for await (const val of (await self._compile("website.websiteSearchBoxInput", tCallOptions))(self, tCallValues)) {            yield val;          }
  yield `
  `;
  } catch(e) {
      _debug('Error in %s at %s: %s', 'template1140', log["lastPathNode"], e);
      // console.debug(String(template1140)); // detail code
      throw e;
  }
}