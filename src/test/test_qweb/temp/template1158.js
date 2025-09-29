async function* template1158(self, values, log={}) {
    let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;   
    try {
        // _debug(String(template1158.name)); // detail code
    log["lastPathNode"] = "/t";
    log["lastPathNode"] = "/t/t";
    yield `
        `;
    {
    async function* tCallContent(self, values, log) {
        log["lastPathNode"] = "/t/t/t";
        yield `
            `;
        async function* qwebTSet__t_t_t() {
            yield `Shop`;
        }
        let qwebTSet__t_t_t_value = '';
        for await (const val of qwebTSet__t_t_t()) qwebTSet__t_t_t_value += val;
        values["additionalTitle"] = markup(qwebTSet__t_t_t_value);;
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[0]";
        yield `
            <div id="wrap" class="js-sale" data-oe-model="ir.ui.view" data-oe-id="1158" data-oe-field="arch" data-oe-xpath="/t[1]/t[1]/div[1]">
                <div class="oe-structure oe-empty oe-structure-not-nearest" id="oeStructureWebsiteSaleProducts1"></div>
                <div class="container oe-website-sale pt-2">
                    <div class="row o-wsale-products-main-row">
                        `;
        if (values['enableLeftColumn']) {
            yield `<div id="productsGridBefore" class="col-lg-3 pb-2">
                            <div class="products-categories"></div>
                            <div class="products-attributes-filters"></div>
                        </div>`;
        }
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]";
        attrs = {};
        attrs["id"] = "productsGrid";
        attrs["class"] = format("col %s", await self._compileToStr(values['layoutMode'] == 'list' ? 'o-wsale-layout-list' : ''));     
        tagName = "div";
        yield `
                        <div`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/t[0]";
        yield `>
                            `;
        {
        async function* tCallContent(self, values, log) {
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/t[0]/t";
            yield `
                                `;
            values["_classes"] = "w-100";
            yield `
                            `;
        }
        tCallValues = Object.assign({},  values);
        let res = '';
        for await (const str of tCallContent(self, tCallValues, log))
            res = res + str;
        tCallValues['0'] = markup(res)
        }
        tCallOptions = Object.assign({}, compileOptions);        Object.assign(tCallOptions, {'callerTemplate': "1158", 'lastPathNode': "/t/t/div/div[1]/div/div[1]/t[0]" })
        for await (const val of (await self._compile("website_sale.productsBreadcrumb", tCallOptions))(self, tCallValues)) {
      yield val;              }
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/t[0]";
        yield `
                            <div class="products-header form-inline flex-md-nowrap justify-content-end mb-4">
                                `;
        {
        async function* tCallContent(self, values, log) {
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/t[0]/t[0]";
            yield `
                                    `;
            values["_classes"] = "w-100 w-md-auto mr-auto mb-2";
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/t[0]/t[1]";
            yield `
                                    `;
            values["search"] = values['originalSearch'] || values['search'];
            yield `
                                `;
        }
        tCallValues = Object.assign({},  values);
        let res = '';
        for await (const str of tCallContent(self, tCallValues, log))
            res = res + str;
        tCallValues['0'] = markup(res)
        }
        tCallOptions = Object.assign({}, compileOptions);        Object.assign(tCallOptions, {'callerTemplate': "1158", 'lastPathNode': "/t/t/div/div[1]/div/div[1]/div[0]/t[0]" })
        for await (const val of (await self._compile("website_sale.search", tCallOptions))(self, tCallValues)) {                yield 
val;              }
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/t[1]";
        yield `
                                `;
        {
        async function* tCallContent(self, values, log) {
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/t[1]/t";
            yield `
                                    `;
            values["_classes"] = "ml-3 mb-2";
            yield `
                                `;
        }
        tCallValues = Object.assign({},  values);
        let res = '';
        for await (const str of tCallContent(self, tCallValues, log))
            res = res + str;
        tCallValues['0'] = markup(res)
        }
        tCallOptions = Object.assign({}, compileOptions);        Object.assign(tCallOptions, {'callerTemplate': "1158", 'lastPathNode': "/t/t/div/div[1]/div/div[1]/div[0]/t[1]" })
        for await (const val of (await self._compile("website_sale.pricelistList", tCallOptions))(self, tCallValues)) {
 yield val;              }
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/t[2]";
        yield `
            `;
        async function* qwebTSet__t_t_div_div_1__div_div_1__div_0__t_2_() {
            yield `Price - Low to High`;
        }
        let qwebTSet__t_t_div_div_1__div_div_1__div_0__t_2__value = '';
        for await (const val of qwebTSet__t_t_div_div_1__div_div_1__div_0__t_2_()) qwebTSet__t_t_div_div_1__div_div_1__div_0__t_2__value += val;
        values["listPriceAscLabel"] = markup(qwebTSet__t_t_div_div_1__div_div_1__div_0__t_2__value);;
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/t[3]";
        yield `
            `;
        async function* qwebTSet__t_t_div_div_1__div_div_1__div_0__t_3_() {
            yield `Price - High to Low`;
        }
        let qwebTSet__t_t_div_div_1__div_div_1__div_0__t_3__value = '';
        for await (const val of qwebTSet__t_t_div_div_1__div_div_1__div_0__t_3_()) qwebTSet__t_t_div_div_1__div_div_1__div_0__t_3__value += val;
        values["listPriceDescLabel"] = markup(qwebTSet__t_t_div_div_1__div_div_1__div_0__t_3__value);;
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/t[4]";
        yield `
            `;
        async function* qwebTSet__t_t_div_div_1__div_div_1__div_0__t_4_() {
            yield `Newest arrivals`;
        }
        let qwebTSet__t_t_div_div_1__div_div_1__div_0__t_4__value = '';
        for await (const val of qwebTSet__t_t_div_div_1__div_div_1__div_0__t_4_()) qwebTSet__t_t_div_div_1__div_div_1__div_0__t_4__value += val;
        values["newestArrivalsDescLabel"] = markup(qwebTSet__t_t_div_div_1__div_div_1__div_0__t_4__value);;
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/t[5]";
        yield `
            `;
        async function* qwebTSet__t_t_div_div_1__div_div_1__div_0__t_5_() {
            yield `Name`;
        }
        let qwebTSet__t_t_div_div_1__div_div_1__div_0__t_5__value = '';
        for await (const val of qwebTSet__t_t_div_div_1__div_div_1__div_0__t_5_()) qwebTSet__t_t_div_div_1__div_div_1__div_0__t_5__value += val;
        values["nameAscLabel"] = markup(qwebTSet__t_t_div_div_1__div_div_1__div_0__t_5__value);;
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/t[6]";
        yield `
            `;
        values["websiteSaleSortable"] = [                 [values['listPriceAscLabel'], 'listPrice asc'],                 [values['listPriceDescLabel'], 'listPrice desc'],                 [values['newestArrivalsDescLabel'], 'createdAt desc'],                 [values['nameAscLabel'], 'label asc']             ];
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/t[7]";
        yield `
            `;
        values["websiteSaleSortableCurrent"] = values['websiteSaleSortable'].filter(sort => sort[1]==(values['request'].params['order'] ?? ''));
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/div[0]/a/span/t[0]";
        yield `
            <div class="o-sortby-dropdown dropdown dropdown-sorty-by ml-3 pb-2" data-oe-id="1160" data-oe-xpath="/data/xpath/div" data-oe-model="ir.ui.view" data-oe-field="arch">
                <span class="d-none d-lg-inline font-weight-bold text-muted">Sort By:</span>
                <a role="button" href="#" class="dropdown-toggle btn btn-light border-0 px-0 text-muted align-baseline" data-toggle="dropdown">
                    <span class="d-none d-lg-inline">
                        `;
        if (values['websiteSaleSortableCurrent'].length) {
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/div[0]/a/span/t[0]/t";
            yield `
                            `;
            content = values['websiteSaleSortableCurrent'][0][0];
            forceDisplay = null;
            if (content != null && bool(content) !== false) {
                yield String(content);
            }
            else {
            }
            yield `
                        `;
        }
        else {
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/div[0]/a/span/t[1]";
            yield `
                            Featured
                        `;
        }
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/div[0]/div/t";
        yield `

                    </span>
                    <i class="fa fa-sort-amount-asc d-lg-none"></i>
                </a>
                <div class="dropdown-menu dropdown-menu-right" role="menu">
                    `;
        let size_142;        let t_foreach_141 = values['websiteSaleSortable'] ?? [];        if (typeof(t_foreach_141) === 'number') {          size_142 = t_foreach_141;          values["sortby_size"] = size_142;          t_foreach_141 = range(size_142);        }     
   else if ('_length' in t_foreach_141) {          size_142 = t_foreach_141._length;          values["sortby_size"] = size_142;       
 }        else if ('length' in t_foreach_141) {          size_142 = t_foreach_141.length;          values["sortby_size"] = size_142;  
      }        else if ('size' in t_foreach_141) {          size_142 = t_foreach_141.size;          values["sortby_size"] = size_142; 
       }        else {          size_142 = null;        }        let hasValue_143 = false;        if (t_foreach_141 instanceof Map || 
t_foreach_141 instanceof MapKey) {          t_foreach_141 = t_foreach_141.entries();          hasValue_143 = true;        }        if 
(typeof t_foreach_141 === 'object' && !isIterable(t_foreach_141)) {          t_foreach_141 = Object.entries(t_foreach_141);          hasValue_143 = true;        }
        for (const [index, item] of enumerate(t_foreach_141)) {          values["sortby_index"] = index;          if (hasValue_143) { 
           [values["sortby"], values["sortby_value"]] = item;          }          else {            values["sortby"] = item;
  values["sortby_value"] = item;          }          values["sortby_first"] = values["sortby_index"] == 0;          if (size_142 != null) {            values["sortby_last"] = index + 1 === size_142;          }          values["sortby_odd"] = index % 2;          values["sortby_even"] = ! values["sortby_odd"];          values["sortby_parity"] = values["sortby_odd"] ? 'odd' : 'even';
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/div[0]/div/t";
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/div[0]/div/t/a";
            attrs = {};
            attrs["role"] = "menuitem";
            attrs["rel"] = "noindex,nofollow";
            attrs["class"] = "dropdown-item";
            attrs["href"] = await values['keep']('/shop', {'order': values['sortby'][1]});
            tagName = "a";
            yield `
                        <a`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/div[0]/div/t/a/span";
            yield `>
                            `;
            content = values['sortby'][0];
            forceDisplay = null;
            if (content != null && bool(content) !== false) {
                yield `<span>`;
                yield String(content);
                yield `</span>`;
            }
            else {
                yield `<span>`;
                yield `</span>`;
            }
            yield `
                        </a>
                    `;
        }
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/div[1]/label[0]";
        attrs = {};
        attrs["title"] = "Grid";
        attrs["class"] = format("btn btn-light border-0 %s fa fa-th-large o-wsale-apply-grid", await self._compileToStr(values['layoutMode'] != 'list' ? 'active' : null));
        tagName = "label";
        yield `
                </div>
            </div>



            <div class="btn-group btn-group-toggle ml-3 mb-2 d-none d-sm-inline-flex o-wsale-apply-layout" data-toggle="buttons" data-oe-id="1161" data-oe-xpath="/data/xpath/div" data-oe-model="ir.ui.view" data-oe-field="arch">
                <label`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/div[1]/label[0]/input";
        attrs = {};
        attrs["type"] = "radio";
        attrs["name"] = "wsaleProductsLayout";
        attrs["checked"] = values['layoutMode'] != 'list' ? 'checked' : null;
        tagName = "input";
        yield `>
                    <input`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/div[1]/label[1]";
        attrs = {};
        attrs["title"] = "List";
        attrs["class"] = format("btn btn-light border-0 %s fa fa-th-list o-wsale-apply-list", await self._compileToStr(values['layoutMode'] == 'list' ? 'active' : null));
        tagName = "label";
        yield `/>
                </label>
                <label`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[0]/div[1]/label[1]/input";
        attrs = {};
        attrs["type"] = "radio";
        attrs["name"] = "wsaleProductsLayout";
        attrs["checked"] = values['layoutMode'] == 'list' ? 'checked' : null;
        tagName = "input";
        yield `>
                    <input`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[1]";
        yield `/>
                </label>
            </div>
        </div>
                            `;
        if (values['originalSearch'] && bool(values['bins'])) {
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[1]/span[0]";
            yield `<div class="alert alert-warning mt8">
                                No results found for '`;
            content = values['originalSearch'];
            forceDisplay = null;
            if (content != null && bool(content) !== false) {
                yield `<span>`;
                yield String(content);
                yield `</span>`;
            }
            else {
                yield `<span>`;
                yield `</span>`;
            }
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[1]/span[1]";
            yield `'. Showing results for '`;
            content = values['search'];
            forceDisplay = null;
            if (content != null && bool(content) !== false) {
                yield `<span>`;
                yield String(content);
                yield `</span>`;
            }
            else {
                yield `<span>`;
                yield `</span>`;
            }
            yield `'.
                            </div>`;
        }
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/t[1]";
        yield `
                            `;
        if (bool(values['category'])) {
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/t[1]/t";
            yield `
                                `;
            async function* qwebTSet__t_t_div_div_1__div_div_1__t_1__t() {
                log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/t[1]/t/t";
                yield `Drag building blocks here to customize the header for "`;
                content = await values['category'].label;
                forceDisplay = null;
                if (content != null && bool(content) !== false) {
                    yield String(content);
                }
                else {
                }
                yield `" category.`;
            }
            let qwebTSet__t_t_div_div_1__div_div_1__t_1__t_value = '';
            for await (const val of qwebTSet__t_t_div_div_1__div_div_1__t_1__t()) qwebTSet__t_t_div_div_1__div_div_1__t_1__t_value += 
val;
            values["editorMsg"] = markup(qwebTSet__t_t_div_div_1__div_div_1__t_1__t_value);;
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/t[1]/div";
            tFieldTOptions = {};
            result = await self._getField(values['category'], "websiteDescription", "category.websiteDescription", "div", tFieldTOptions, compileOptions, values);
            [attrs, content, forceDisplay] = result;
            if (content != null && bool(content) !== false) {
                content = await self._compileToStr(content);
            }
            yield `
                                `;
            if (content != null && bool(content) !== false) {
                attrs["class"] = "mb16";
                attrs["id"] = "categoryHeader";
                attrs["data-editor-message"] = values['editorMsg'];
                tagName = "div";
                yield `<div`;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                yield `>`;
                yield String(content);
                yield `</div>`;
            }
            else {
                attrs["class"] = "mb16";
                attrs["id"] = "categoryHeader";
                attrs["data-editor-message"] = values['editorMsg'];
                tagName = "div";
                yield `<div`;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                yield `>`;
                yield `</div>`;
            }
            yield `
                            `;
        }
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[2]";
        yield `
                            `;
        if (bool(values['bins'])) {
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[2]/table";
            attrs = {};
            attrs["class"] = "table table-borderless m-0";
            attrs["data-ppg"] = values['ppg'];
            attrs["data-ppr"] = values['ppr'];
            tagName = "table";
            yield `<div class="o-wsale-products-grid-table-wrapper">
                                <table`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[2]/table/colgroup";
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[2]/table/colgroup/col";
            yield `>
                                    <colgroup>
                                        `;
            let size_145;            let t_foreach_144 = values['ppr'] ?? [];            if (typeof(t_foreach_144) === 'number') {    
          size_145 = t_foreach_144;              values["p_size"] = size_145;              t_foreach_144 = range(size_145);
 }            else if ('_length' in t_foreach_144) {              size_145 = t_foreach_144._length;              values["p_size"] = size_145;            }            else if ('length' in t_foreach_144) {              size_145 = t_foreach_144.length;              values["p_size"] = size_145;            }            else if ('size' in t_foreach_144) {              size_145 = t_foreach_144.size;       
       values["p_size"] = size_145;            }            else {              size_145 = null;            }            let hasValue_146 = false;            if (t_foreach_144 instanceof Map || t_foreach_144 instanceof MapKey) {              t_foreach_144 = t_foreach_144.entries();              hasValue_146 = true;            }            if (typeof t_foreach_144 === 'object' && !isIterable(t_foreach_144)) {              t_foreach_144 = Object.entries(t_foreach_144);              hasValue_146 = true;            }
            for (const [index, item] of enumerate(t_foreach_144)) {              values["p_index"] = index;              if (hasValue_146) {                [values["p"], values["p_value"]] = item;              }              else {                values["p"] = item;  
              values["p_value"] = item;              }              values["p_first"] = values["p_index"] == 0;              if (size_145 != null) {                values["p_last"] = index + 1 === size_145;              }              values["p_odd"] = index % 2;     
         values["p_even"] = ! values["p_odd"];              values["p_parity"] = values["p_odd"] ? 'odd' : 'even';
                log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[2]/table/colgroup/col";
                yield `<col/>`;
            }
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[2]/table/tbody/tr";
            yield `
                                    </colgroup>
                                    <tbody>
                                        `;
            let size_151;            let t_foreach_150 = values['bins'] ?? [];            if (typeof(t_foreach_150) === 'number') {   
           size_151 = t_foreach_150;              values["trProduct_size"] = size_151;              t_foreach_150 = range(size_151);  
          }            else if ('_length' in t_foreach_150) {              size_151 = t_foreach_150._length;              values["trProduct_size"] = size_151;            }            else if ('length' in t_foreach_150) {              size_151 = t_foreach_150.length;  
            values["trProduct_size"] = size_151;            }            else if ('size' in t_foreach_150) {              size_151 = t_foreach_150.size;              values["trProduct_size"] = size_151;            }            else {              size_151 = null;     
       }            let hasValue_152 = false;            if (t_foreach_150 instanceof Map || t_foreach_150 instanceof MapKey) {       
       t_foreach_150 = t_foreach_150.entries();              hasValue_152 = true;            }            if (typeof t_foreach_150 === 'object' && !isIterable(t_foreach_150)) {              t_foreach_150 = Object.entries(t_foreach_150);              hasValue_152 = true;            }
            for (const [index, item] of enumerate(t_foreach_150)) {              values["trProduct_index"] = index;              if (hasValue_152) {                [values["trProduct"], values["trProduct_value"]] = item;              }              else {
   values["trProduct"] = item;                values["trProduct_value"] = item;              }              values["trProduct_first"] 
= values["trProduct_index"] == 0;              if (size_151 != null) {                values["trProduct_last"] = index + 1 === size_151;              }              values["trProduct_odd"] = index % 2;              values["trProduct_even"] = ! values["trProduct_odd"];              values["trProduct_parity"] = values["trProduct_odd"] ? 'odd' : 'even';
                log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[2]/table/tbody/tr";
                log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[2]/table/tbody/tr/t";
                yield `<tr>
                                            `;
                let size_148;                let t_foreach_147 = values['trProduct'] ?? [];                if (typeof(t_foreach_147) === 'number') {                  size_148 = t_foreach_147;                  values["tdProduct_size"] = size_148;                  t_foreach_147 = range(size_148);                }                else if ('_length' in t_foreach_147) {                  size_148 = t_foreach_147._length;                  values["tdProduct_size"] = size_148;                }                else if ('length' in t_foreach_147) {                  size_148 = t_foreach_147.length;                  values["tdProduct_size"] = size_148;                }        
        else if ('size' in t_foreach_147) {                  size_148 = t_foreach_147.size;                  values["tdProduct_size"] 
= size_148;                }                else {                  size_148 = null;                }                let hasValue_149 
= false;                if (t_foreach_147 instanceof Map || t_foreach_147 instanceof MapKey) {                  t_foreach_147 = t_foreach_147.entries();                  hasValue_149 = true;                }                if (typeof t_foreach_147 === 'object' && !isIterable(t_foreach_147)) {                  t_foreach_147 = Object.entries(t_foreach_147);                  hasValue_149 = true;       
         }
                for (const [index, item] of enumerate(t_foreach_147)) {                  values["tdProduct_index"] = index;
       if (hasValue_149) {                    [values["tdProduct"], values["tdProduct_value"]] = item;                  }
     else {                    values["tdProduct"] = item;                    values["tdProduct_value"] = item;                  }    
              values["tdProduct_first"] = values["tdProduct_index"] == 0;                  if (size_148 != null) {
values["tdProduct_last"] = index + 1 === size_148;                  }                  values["tdProduct_odd"] = index % 2;
       values["tdProduct_even"] = ! values["tdProduct_odd"];                  values["tdProduct_parity"] = values["tdProduct_odd"] ? 'odd' : 'even';
                    log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[2]/table/tbody/tr/t";
                    log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[2]/table/tbody/tr/t/t";
                    yield `
                                                `;
                    if (bool(values['tdProduct'])) {
                        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[2]/table/tbody/tr/t/t/t";
                        yield `
                                                    `;
                        values["product"] = values['tdProduct']['product'];
                        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[2]/table/tbody/tr/t/t/td";
                        attrs = {};
                        attrs["colspan"] = values['tdProduct']['x'] != 1 && values['tdProduct']['x'];
                        attrs["rowspan"] = values['tdProduct']['y'] != 1 && values['tdProduct']['y'];
                        attrs["class"] = "oe-product";
                        attrs["data-ribbon-id"] = values['tdProduct']['ribbon'].id;
                        tagName = "td";
                        yield `
                                                    <td`;
                        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                        for (const [name, value] of Object.entries(attrs)) {
                              if (value || typeof(value) === 'string') {
                                    yield ' ' + String(name) + '="' + String(value) + '"'
                              }
                        }
                        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[2]/table/tbody/tr/t/t/td/div";
                        attrs = {};
                        attrs["class"] = format("o-wsale-product-grid-wrapper o-wsale-product-grid-wrapper-%s-%s", await self._compileToStr(values['tdProduct']['x']), await self._compileToStr(values['tdProduct']['y']));
                        tagName = "div";
                        yield `>
                                                        <div`;
                        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                        for (const [name, value] of Object.entries(attrs)) {
                              if (value || typeof(value) === 'string') {
                                    yield ' ' + String(name) + '="' + String(value) + '"'
                              }
                        }
                        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[2]/table/tbody/tr/t/t/td/div/t";
                        yield `>
                                                            `;
                        {
                        async function* tCallContent(self, values, log) {
                            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[2]/table/tbody/tr/t/t/td/div/t/t";
                            yield `
                                                                `;
                            values["productImageBig"] = values['tdProduct']['x'] + values['tdProduct']['y'] > 2;
                            yield `
                                                            `;
                        }
                        tCallValues = Object.assign({},  values);
                        let res = '';
                        for await (const str of tCallContent(self, tCallValues, log))
                            res = res + str;
                        tCallValues['0'] = markup(res)
                        }
                        tCallOptions = Object.assign({}, compileOptions);                        Object.assign(tCallOptions, {'callerTemplate': "1158", 'lastPathNode': "/t/t/div/div[1]/div/div[1]/div[2]/table/tbody/tr/t/t/td/div/t" })
                        for await (const val of (await self._compile("website_sale.productsItem", tCallOptions))(self, tCallValues)) {                                yield val;                              }
                        yield `
                                                        </div>
                                                    </td>
                                                `;
                    }
                    else {
                        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[2]/table/tbody/tr/t/td";
                        yield `<td></td>`;
                    }
                    yield `

                                            `;
                }
                yield `
                                        </tr>`;
            }
            yield `
                                    </tbody>
                                </table>
                            </div>`;
        }
        else {
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/t[2]";
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/t[2]/div/t[0]";
            yield `
                                <div class="text-center text-muted mt128 mb256">
                                    `;
            if (! bool(values['search'])) {
                log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/t[2]/div/t[0]/p";
                yield `
                                        <h3 class="mt8">No product defined</h3>
                                        `;
                if (bool(values['category'])) {
                    log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/t[2]/div/t[0]/p/strong";
                    yield `<p>No product defined in category "`;
                    content = await values['category'].displayName;
                    forceDisplay = null;
                    if (content != null && bool(content) !== false) {
                        yield `<strong>`;
                        yield String(content);
                        yield `</strong>`;
                    }
                    else {
                        yield `<strong>`;
                        yield `</strong>`;
                    }
                    yield `".</p>`;
                }
                yield `
                                    `;
            }
            else {
                log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/t[2]/div/t[1]";
                log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/t[2]/div/t[1]/p/strong";
                yield `
                                        <h3 class="mt8">No results</h3>
                                        <p>No results for "`;
                content = values['search'];
                forceDisplay = null;
                if (content != null && bool(content) !== false) {
                    yield `<strong>`;
                    yield String(content);
                    yield `</strong>`;
                }
                else {
                    yield `<strong>`;
                    yield `</strong>`;
                }
                log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/t[2]/div/t[1]/p/t";
                yield `"`;
                if (bool(values['category'])) {
                    log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/t[2]/div/t[1]/p/t/strong";
                    yield ` in category "`;
                    content = await values['category'].displayName;
                    forceDisplay = null;
                    if (content != null && bool(content) !== false) {
                        yield `<strong>`;
                        yield String(content);
                        yield `</strong>`;
                    }
                    else {
                        yield `<strong>`;
                        yield `</strong>`;
                    }
                    yield `"`;
                }
                yield `.</p>
                                    `;
            }
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/t[2]/div/t[1]";
            log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/t[2]/div/p";
            yield `

                                    `;
            if (await self.userHasGroups("sales_team.groupSaleManager")) {
                yield `<p>Click <i>'New'</i> in the top-right corner to create your first product.</p>`;
            }
            yield `
                                </div>
                            `;
        }
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/t[2]";
        log["lastPathNode"] = "/t/t/div/div[1]/div/div[1]/div[3]/t";
        yield `

                            <div class="products-pager form-inline justify-content-center py-3">
                                `;
        tCallValues = Object.assign({}, values);
        tCallValues['0'] = markup('');
        tCallOptions = Object.assign({}, compileOptions);        Object.assign(tCallOptions, {'callerTemplate': "1158", 'lastPathNode': "/t/t/div/div[1]/div/div[1]/div[3]/t" })
        for await (const val of (await self._compile("website.pager", tCallOptions))(self, tCallValues)) {                yield val;  
            }
        yield `
                            </div>
                        </div>
                    </div>
                </div>
                <div class="oe-structure oe-empty oe-structure-not-nearest" id="oeStructureWebsiteSaleProducts2"></div>
            </div>
        `;
    }
    tCallValues = Object.assign({},  values);
    let res = '';
    for await (const str of tCallContent(self, tCallValues, log))
        res = res + str;
    tCallValues['0'] = markup(res)
    }
    tCallOptions = Object.assign({}, compileOptions);    Object.assign(tCallOptions, {'callerTemplate': "1158", 'lastPathNode': "/t/t" })
    for await (const val of (await self._compile("website.layout", tCallOptions))(self, tCallValues)) {            yield val;
 }
    yield `
    `;
    } catch(e) {
        console.debug('Error in %s at %s: %s', 'template1158', log["lastPathNode"], e);
        _debug(String(template1158)); // detail code
        throw e;
    }
}