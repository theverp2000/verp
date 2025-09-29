async function* template515(self, values, log={}) {
  let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;
  try {
      // _debug(String(template515.name)); // detail code
  log["lastPathNode"] = "/t";
  log["lastPathNode"] = "/t/form";
  attrs = {};
  attrs["method"] = "get";
  attrs["data-oe-id"] = "515";
  attrs["data-oe-xpath"] = "/data/xpath[2]/form";
  attrs["data-oe-model"] = "ir.ui.view";
  attrs["data-oe-field"] = "arch";
  attrs["class"] = format("o-searchbar-form o-wait-lazy-js s-searchbar-input %s", await self._compileToStr(values['_formClasses']));
  attrs["action"] = values['action'];
  attrs["data-snippet"] = "sSearchbarInput";
  tagName = "form";
  yield `
  
      <form`;
  attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
  for (const [name, value] of Object.entries(attrs)) {
        if (value || typeof(value) === 'string') {
              yield ' ' + String(name) + '="' + String(value) + '"'
        }
  }
  log["lastPathNode"] = "/t/form/t[0]";
  log["lastPathNode"] = "/t/form/t[0]/div/t";
  yield `>
          <div role="search">
      `;
  async function* qwebTSet__t_form_t_0__div_t() {
      yield `Search...`;
  }
  let qwebTSet__t_form_t_0__div_t_value = '';
  for await (const val of qwebTSet__t_form_t_0__div_t()) qwebTSet__t_form_t_0__div_t_value += val;
  values["searchPlaceholder"] = markup(qwebTSet__t_form_t_0__div_t_value);;
  log["lastPathNode"] = "/t/form/t[0]/div/input";
  attrs = {};
  attrs["type"] = "search";
  attrs["name"] = "search";
  attrs["class"] = f('search-query form-control oe-search-box %s', values['_input_classes']);
  attrs["placeholder"] = values['placeholder'] ? values['placeholder'] : values['searchPlaceholder'];
  attrs["value"] = values['search'];
  attrs["data-search-type"] = values['searchType'];
  attrs["data-limit"] = values['limit'] || '5';
  attrs["data-display-image"] = values['displayImage'] || 'true';
  attrs["data-display-description"] = values['displayDescription'] || 'true';
  attrs["data-display-extra-link"] = values['displayExtraLink'] || 'true';
  attrs["data-display-detail"] = values['displayDetail'] || 'true';
  attrs["data-order-by"] = values['orderby'] || 'name asc';
  tagName = "input";
  yield `
      <input`;
  attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
  for (const [name, value] of Object.entries(attrs)) {
        if (value || typeof(value) === 'string') {
              yield ' ' + String(name) + '="' + String(value) + '"'
        }
  }
  log["lastPathNode"] = "/t/form/t[0]/div/div/button";
  attrs = {};
  attrs["type"] = "submit";
  attrs["aria-label"] = "Search";
  attrs["title"] = "Search";
  attrs["class"] = f('btn oe-search-button %s', values['_submit_classes'] || 'btn-primary');
  tagName = "button";
  yield `/>
      <div class="input-group-append">
          <button`;
  attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
  for (const [name, value] of Object.entries(attrs)) {
        if (value || typeof(value) === 'string') {
              yield ' ' + String(name) + '="' + String(value) + '"'
        }
  }
  log["lastPathNode"] = "/t/form/input";
  attrs = {};
  attrs["name"] = "order";
  attrs["type"] = "hidden";
  attrs["class"] = "o-search-order-by";
  attrs["value"] = values['orderby'] ? values['orderby'] : 'label asc';
  tagName = "input";
  yield `><i class="fa fa-search"></i></button>
      </div>
  </div>
          <input`;
  attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
  for (const [name, value] of Object.entries(attrs)) {
        if (value || typeof(value) === 'string') {
              yield ' ' + String(name) + '="' + String(value) + '"'
        }
  }
  log["lastPathNode"] = "/t/form/t[1]";
  yield `/>
          `;
  if (typeof values['0'] === 'string') yield values['0']; else { for (const str of Array.from(val || [])) str };
  yield `
      </form>
  
  `;
  } catch(e) {
      _debug('Error in %s at %s: %s', 'template515', log["lastPathNode"], e);
      // console.debug(String(template515)); // detail code
      throw e;
  }
}