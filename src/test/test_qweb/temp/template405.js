async function* template405(self, values, log={}) {
    let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;
    try {
        _debug(String(template405.name)); // detail code
    log["lastPathNode"] = "/t";
    log["lastPathNode"] = "/t/t[0]";
    yield `
        `;
    values["htmlData"] = {             'lang': values['lang'] && values['lang'].replace('_', '-'),             'data-website-id': bool(values['website']) ? values['website'].id : null,             'data-editable': values['editable'] ? '1' : null,             'data-translatable': values['translatable'] ? '1' : null,             'data-edit-translations': values['editTranslations'] ? '1' : null,             'data-view-xmlid': values['editable'] || values['translatable'] ? values['xmlid'] : null,             'data-viewId': values['editable'] || values['translatable'] ? values['viewId'] : null,             'data-main-object': repr(values['mainObject']),             'data-seo-object': values['seoObject'] ? repr(values['seoObject']) : null,             'data-oe-company-label': await values['resCompany'].label         };
    log["lastPathNode"] = "/t/t[1]";
    yield `
    
            `;
    values["bodyClassname"] = (values['bodyClassname'] ? values['bodyClassname'] : '') + (await values['env'].items('ir.ui.view').userHasGroups('base.groupUser') ? ' o-connected-user' : '');
    log["lastPathNode"] = "/t/t[2]";
    yield `
        
            `;
    values["htmlData"] = {...values['htmlData'], 'data-add2cart-redirect': await values['website'].cartAddOnPage && '1' || '0'};
    log["lastPathNode"] = "/t/html";
    attrs = {};
    const attsValue = values['htmlData'] ?? {};    if (typeof(attsValue) === 'object') {      Dict.fill(attrs, attsValue);    }    else if (Array.isArray(attsValue) && !Array.isArray(attsValue[0])) {      Dict.fill(attrs, [attsValue]);    }    else if (Array.isArray(attsValue)) {      Dict.fill(attrs, attsValue);    }
    tagName = "html";
    yield `
        <!DOCTYPE html>
    <html`;
    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
    for (const [name, value] of Object.entries(attrs)) {
          if (value || typeof(value) === 'string') {
                yield ' ' + String(name) + '="' + String(value) + '"'
          }
    }
    log["lastPathNode"] = "/t/html/t[0]";
    yield `>
        `;
    if (! values['title']) {
        log["lastPathNode"] = "/t/html/t[0]/t[0]";
        yield `
            `;
        if (! values['additionalTitle'] && bool(values['mainObject']) && 'label' in values['mainObject']._fields) {
            log["lastPathNode"] = "/t/html/t[0]/t[0]/t";
            yield `
                `;
            values["additionalTitle"] = await values['mainObject'].label;
            yield `
            `;
        }
        log["lastPathNode"] = "/t/html/t[0]/t[1]";
        yield `
            `;
        async function* qwebTSet__t_html_t_0__t_1_() {
            log["lastPathNode"] = "/t/html/t[0]/t[1]/t[0]";
            yield ` `;
            if (values['additionalTitle']) {
                log["lastPathNode"] = "/t/html/t[0]/t[1]/t[0]/t";
                content = values['additionalTitle'];
                forceDisplay = null;
                if (content != null && content !== false) {
                    yield String(content);
                }
                else {
                }
                yield ` | `;
            }
            log["lastPathNode"] = "/t/html/t[0]/t[1]/t[1]";
            content = await (bool(values['website']) ? values['website'] : values['resCompany']).label;
            forceDisplay = null;
            if (content != null && content !== false) {
                yield String(content);
            }
            else {
            }
            yield ` `;
        }
        let qwebTSet__t_html_t_0__t_1__value = '';
        for await (const val of qwebTSet__t_html_t_0__t_1_()) qwebTSet__t_html_t_0__t_1__value += val;
        values["defaultTitle"] = markup(qwebTSet__t_html_t_0__t_1__value);;
        log["lastPathNode"] = "/t/html/t[0]/t[2]";
        yield `
            `;
        values["seoObject"] = bool(values['seoObject']) ? values['seoObject'] : values['mainObject'];
        log["lastPathNode"] = "/t/html/t[0]/t[3]";
        yield `
            `;
        if (bool(values['seoObject']) && 'websiteMetaTitle' in values['seoObject']._fields && await values['seoObject'].websiteMetaTitle) {
            log["lastPathNode"] = "/t/html/t[0]/t[3]/t";
            yield `
                `;
            values["title"] = await values['seoObject'].websiteMetaTitle;
            yield `
            `;
        }
        else {
            log["lastPathNode"] = "/t/html/t[0]/t[4]";
            log["lastPathNode"] = "/t/html/t[0]/t[4]/t";
            yield `
                `;
            values["title"] = values['defaultTitle'];
            yield `
            `;
        }
        log["lastPathNode"] = "/t/html/t[0]/t[4]";
        yield `
            
        `;
    }
    log["lastPathNode"] = "/t/html/t[1]";
    yield `
        `;
    values["xIcon"] = await values['website'].imageUrl(values['website'], 'favicon');
    log["lastPathNode"] = "/t/html/head/t[0]";
    yield `
    
      <head>
        <meta charset="utf-8"/>
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"/>

        
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
    
        <meta name="generator" content="Verp"/>
        `;
    values["websiteMeta"] = bool(values['seoObject']) && await values['seoObject'].getWebsiteMeta() || {};
    log["lastPathNode"] = "/t/html/head/meta[4]";
    yield `
        `;
    if (await self.userHasGroups("website.groupWebsiteDesigner")) {
        attrs = {};
        attrs["name"] = "defaultTitle";
        attrs["content"] = values['defaultTitle'];
        tagName = "meta";
        yield `<meta`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        yield `/>`;
    }
    log["lastPathNode"] = "/t/html/head/meta[5]";
    yield `
        `;
    if (bool(values['mainObject']) && 'websiteIndexed' in values['mainObject']._fields             && ! await values['mainObject'].websiteIndexed) {
        yield `<meta name="robots" content="noindex"/>`;
    }
    log["lastPathNode"] = "/t/html/head/t[1]";
    yield `
            `;
    values["seoObject"] = bool(values['seoObject']) ? values['seoObject'] : values['mainObject'];
    log["lastPathNode"] = "/t/html/head/t[2]";
    yield `
            `;
    values["metaDescription"] = bool(values['seoObject']) && 'websiteMetaDescription' in values['seoObject']._fields                 && await values['seoObject'].websiteMetaDescription || values['websiteMetaDescription'] || (values['websiteMeta']['metaDescription'] || '');
    log["lastPathNode"] = "/t/html/head/t[3]";
    yield `
            `;
    values["metaKeywords"] = bool(values['seoObject']) && 'websiteMetaKeywords' in values['seoObject']._fields                 && await values['seoObject'].websiteMetaKeywords || values['websiteMetaKeywords'];
    log["lastPathNode"] = "/t/html/head/meta[6]";
    yield `
        `;
    if (values['metaDescription'] || values['editable']) {
        attrs = {};
        attrs["name"] = "description";
        attrs["content"] = values['metaDescription'];
        tagName = "meta";
        yield `<meta`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        yield `/>`;
    }
    log["lastPathNode"] = "/t/html/head/meta[7]";
    yield `
        `;
    if (values['metaKeywords'] || values['editable']) {
        attrs = {};
        attrs["name"] = "keywords";
        attrs["content"] = values['metaKeywords'];
        tagName = "meta";
        yield `<meta`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        yield `/>`;
    }
    log["lastPathNode"] = "/t/html/head/t[4]";
    yield `
        `;
    if (bool(values['seoObject'])) {
        log["lastPathNode"] = "/t/html/head/t[4]/meta";
        yield `
            `;
        if (await self.userHasGroups("website.groupWebsiteDesigner")) {
            attrs = {};
            attrs["name"] = "defaultDescription";
            attrs["content"] = values['websiteMetaDescription'] || values['websiteMeta']['metaDescription'];
            tagName = "meta";
            yield `<meta`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            yield `/>`;
        }
        log["lastPathNode"] = "/t/html/head/t[4]/t[0]";
        yield `
            
            `;
        values["opengraphMeta"] = values['websiteMeta']['opengraphMeta'];
        log["lastPathNode"] = "/t/html/head/t[4]/t[1]";
        yield `
            `;
        if (bool(values['opengraphMeta'])) {
            log["lastPathNode"] = "/t/html/head/t[4]/t[1]/t";
            yield `
                `;
            let size_4;            let t_foreach_3 = Object.keys(values['opengraphMeta']) ?? [];            if (typeof(t_foreach_3) === 'number') {              size_4 = t_foreach_3;              values["property_size"] = size_4;              t_foreach_3 = range(size_4);            }            else if ('_length' in t_foreach_3) {              size_4 = t_foreach_3._length;              values["property_size"] = size_4;            }            else if ('length' in t_foreach_3) {              size_4 = t_foreach_3.length;              values["property_size"] = size_4;            }            else if ('size' in t_foreach_3) {              size_4 = t_foreach_3.size;              values["property_size"] = size_4;            }            else {              size_4 = null;            }            let hasValue_5 = false;            console.log('typeof t_foreach_3 of "property":', t_foreach_3.constructor.name);            if (t_foreach_3 instanceof Map || t_foreach_3 instanceof MapKey) {              t_foreach_3 = t_foreach_3.entries();              hasValue_5 = true;            }            if (typeof t_foreach_3 === 'object' && !isIterable(t_foreach_3)) {              t_foreach_3 = Object.entries(t_foreach_3);              hasValue_5 = true;            }
            for (const [index, item] of enumerate(t_foreach_3)) {              values["property_index"] = index;              if (hasValue_5) {                [values["property"], values["property_value"]] = item;              }              else {                values["property"] = item;                values["property_value"] = item;              }              values["property_first"] = values["property_index"] == 0;              if (size_4 != null) {                values["property_last"] = index + 1 === size_4;              }              values["property_odd"] = index % 2;              values["property_even"] = ! values["property_odd"];              values["property_parity"] = values["property_odd"] ? 'odd' : 'even';
                log["lastPathNode"] = "/t/html/head/t[4]/t[1]/t";
                log["lastPathNode"] = "/t/html/head/t[4]/t[1]/t/t[0]";
                yield `
                    `;
                if (isInstance(values['opengraphMeta'][values['property']], Array)) {
                    log["lastPathNode"] = "/t/html/head/t[4]/t[1]/t/t[0]/t";
                    yield `
                        `;
                    let size_1;                    let t_foreach_0 = values['opengraphMeta'][values['property']] ?? [];                    if (typeof(t_foreach_0) === 'number') {                      size_1 = t_foreach_0;                      values["metaContent_size"] = size_1;                      t_foreach_0 = range(size_1);                    }                    else if ('_length' in t_foreach_0) {                      size_1 = t_foreach_0._length;                      values["metaContent_size"] = size_1;                    }                    else if ('length' in t_foreach_0) {                      size_1 = t_foreach_0.length;                      values["metaContent_size"] = size_1;                    }                    else if ('size' in t_foreach_0) {                      size_1 = t_foreach_0.size;                      values["metaContent_size"] = size_1;                    }                    else {                      size_1 = null;                    }                    let hasValue_2 = false;                    console.log('typeof t_foreach_0 of "metaContent":', t_foreach_0.constructor.name);                    if (t_foreach_0 instanceof Map || t_foreach_0 instanceof MapKey) {                      t_foreach_0 = t_foreach_0.entries();                      hasValue_2 = true;                    }                    if (typeof t_foreach_0 === 'object' && !isIterable(t_foreach_0)) {                      t_foreach_0 = Object.entries(t_foreach_0);                      hasValue_2 = true;                    }
                    for (const [index, item] of enumerate(t_foreach_0)) {                      values["metaContent_index"] = index;                      if (hasValue_2) {                        [values["metaContent"], values["metaContent_value"]] = item;                      }                      else {                        values["metaContent"] = item;                        values["metaContent_value"] = item;                      }                      values["metaContent_first"] = values["metaContent_index"] == 0;                      if (size_1 != null) {                        values["metaContent_last"] = index + 1 === size_1;                      }                      values["metaContent_odd"] = index % 2;                      values["metaContent_even"] = ! values["metaContent_odd"];                      values["metaContent_parity"] = values["metaContent_odd"] ? 'odd' : 'even';
                        log["lastPathNode"] = "/t/html/head/t[4]/t[1]/t/t[0]/t";
                        log["lastPathNode"] = "/t/html/head/t[4]/t[1]/t/t[0]/t/meta";
                        attrs = {};
                        attrs["property"] = values['property'];
                        attrs["content"] = values['metaContent'];
                        tagName = "meta";
                        yield `
                            <meta`;
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
                else {
                    log["lastPathNode"] = "/t/html/head/t[4]/t[1]/t/t[1]";
                    log["lastPathNode"] = "/t/html/head/t[4]/t[1]/t/t[1]/meta";
                    attrs = {};
                    attrs["property"] = values['property'];
                    attrs["content"] = values['opengraphMeta'][values['property']];
                    tagName = "meta";
                    yield `
                        <meta`;
                    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                    for (const [name, value] of Object.entries(attrs)) {
                          if (value || typeof(value) === 'string') {
                                yield ' ' + String(name) + '="' + String(value) + '"'
                          }
                    }
                    yield `/>
                    `;
                }
                log["lastPathNode"] = "/t/html/head/t[4]/t[1]/t/t[1]";
                yield `
                    
                `;
            }
            yield `
            `;
        }
        log["lastPathNode"] = "/t/html/head/t[4]/t[2]";
        yield `
            
            `;
        values["twitterMeta"] = values['websiteMeta']['twitterMeta'];
        log["lastPathNode"] = "/t/html/head/t[4]/t[3]";
        yield `
            `;
        if (bool(values['opengraphMeta'])) {
            log["lastPathNode"] = "/t/html/head/t[4]/t[3]/t";
            yield `
                `;
            let size_7;            let t_foreach_6 = values['twitterMeta'] ?? [];            if (typeof(t_foreach_6) === 'number') {              size_7 = t_foreach_6;              values["tMeta_size"] = size_7;              t_foreach_6 = range(size_7);            }            else if ('_length' in t_foreach_6) {              size_7 = t_foreach_6._length;              values["tMeta_size"] = size_7;            }            else if ('length' in t_foreach_6) {              size_7 = t_foreach_6.length;              values["tMeta_size"] = size_7;            }            else if ('size' in t_foreach_6) {              size_7 = t_foreach_6.size;              values["tMeta_size"] = size_7;            }            else {              size_7 = null;            }            let hasValue_8 = false;            console.log('typeof t_foreach_6 of "tMeta":', t_foreach_6.constructor.name);            if (t_foreach_6 instanceof Map || t_foreach_6 instanceof MapKey) {              t_foreach_6 = t_foreach_6.entries();              hasValue_8 = true;            }            if (typeof t_foreach_6 === 'object' && !isIterable(t_foreach_6)) {              t_foreach_6 = Object.entries(t_foreach_6);              hasValue_8 = true;            }
            for (const [index, item] of enumerate(t_foreach_6)) {              values["tMeta_index"] = index;              if (hasValue_8) {                [values["tMeta"], values["tMeta_value"]] = item;              }              else {                values["tMeta"] = item;                values["tMeta_value"] = item;              }              values["tMeta_first"] = values["tMeta_index"] == 0;              if (size_7 != null) {                values["tMeta_last"] = index + 1 === size_7;              }              values["tMeta_odd"] = index % 2;              values["tMeta_even"] = ! values["tMeta_odd"];              values["tMeta_parity"] = values["tMeta_odd"] ? 'odd' : 'even';
                log["lastPathNode"] = "/t/html/head/t[4]/t[3]/t";
                log["lastPathNode"] = "/t/html/head/t[4]/t[3]/t/meta";
                attrs = {};
                attrs["name"] = values['tMeta'];
                attrs["content"] = values['twitterMeta'][values['tMeta']];
                tagName = "meta";
                yield `
                    <meta`;
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
    log["lastPathNode"] = "/t/html/head/t[5]";
    yield `

        
        `;
    if (values['request'] && values['request'].isFrontendMultilang && bool(values['website']) && values['website'].isPublicUser()) {
        log["lastPathNode"] = "/t/html/head/t[5]/t[0]";
        yield `
            `;
        values["alternateLanguages"] = await values['website']._getAlternateLanguages(values['request'], values['canonicalParams']);
        log["lastPathNode"] = "/t/html/head/t[5]/t[1]";
        yield `
            `;
        let size_10;        let t_foreach_9 = values['alternateLanguages'] ?? [];        if (typeof(t_foreach_9) === 'number') {          size_10 = t_foreach_9;          values["lg_size"] = size_10;          t_foreach_9 = range(size_10);        }        else if ('_length' in t_foreach_9) {          size_10 = t_foreach_9._length;          values["lg_size"] = size_10;        }        else if ('length' in t_foreach_9) {          size_10 = t_foreach_9.length;          values["lg_size"] = size_10;        }        else if ('size' in t_foreach_9) {          size_10 = t_foreach_9.size;          values["lg_size"] = size_10;        }        else {          size_10 = null;        }        let hasValue_11 = false;        console.log('typeof t_foreach_9 of "lg":', t_foreach_9.constructor.name);        if (t_foreach_9 instanceof Map || t_foreach_9 instanceof MapKey) {          t_foreach_9 = t_foreach_9.entries();          hasValue_11 = true;        }        if (typeof t_foreach_9 === 'object' && !isIterable(t_foreach_9)) {          t_foreach_9 = Object.entries(t_foreach_9);          hasValue_11 = true;        }
        for (const [index, item] of enumerate(t_foreach_9)) {          values["lg_index"] = index;          if (hasValue_11) {            [values["lg"], values["lg_value"]] = item;          }          else {            values["lg"] = item;            values["lg_value"] = item;          }          values["lg_first"] = values["lg_index"] == 0;          if (size_10 != null) {            values["lg_last"] = index + 1 === size_10;          }          values["lg_odd"] = index % 2;          values["lg_even"] = ! values["lg_odd"];          values["lg_parity"] = values["lg_odd"] ? 'odd' : 'even';
            log["lastPathNode"] = "/t/html/head/t[5]/t[1]";
            log["lastPathNode"] = "/t/html/head/t[5]/t[1]/link";
            attrs = {};
            attrs["rel"] = "alternate";
            attrs["hreflang"] = values['lg']['hreflang'];
            attrs["href"] = values['lg']['href'];
            tagName = "link";
            yield `
                <link`;
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
    log["lastPathNode"] = "/t/html/head/link[0]";
    yield `
        `;
    if (values['request'] && bool(values['website']) && await values['website'].isPublicUser()) {
        attrs = {};
        attrs["rel"] = "canonical";
        attrs["href"] = await values['website']._getCanonicalUrl(values['request'], values['canonicalParams']);
        tagName = "link";
        yield `<link`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        yield `/>`;
    }
    log["lastPathNode"] = "/t/html/head/title";
    yield `
        
        <link rel="preconnect" href="https://fonts.gstatic.com/" crossorigin=""/>
    `;
    content = values['title'] || 'Verp';
    forceDisplay = null;
    if (content != null && content !== false) {
        yield `<title>`;
        yield String(content);
        yield `</title>`;
    }
    else {
        yield `<title>`;
        yield `</title>`;
    }
    log["lastPathNode"] = "/t/html/head/link[2]";
    attrs = {};
    attrs["type"] = "image/x-icon";
    attrs["rel"] = "shortcut icon";
    attrs["href"] = values['xIcon'] ?? '/web/static/img/favicon.ico';
    tagName = "link";
    yield `
        <link`;
    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
    for (const [name, value] of Object.entries(attrs)) {
          if (value || typeof(value) === 'string') {
                yield ' ' + String(name) + '="' + String(value) + '"'
          }
    }
    log["lastPathNode"] = "/t/html/head/t[6]";
    yield `/>
        <link as="style" rel="stylesheet preload prefetch" type="text/css" href="/web/static/lib/fontawesome/fonts/fontawesome-webfont.woff2?v=4.7.0" crossorigin="anonymous"/>
        
      
      `;
    tCallAssetsNodes = await self._getAssetNodes("web.assetsCommon", {request: values["request"], css: true, js: false, debug: values["debug"], asyncLoad: false, deferLoad: false, lazyLoad: false, media: false});        for (const [index, value] of enumerate(tCallAssetsNodes)) {          let [tagName, attrs, content] = value;          if (index) {            yield ''          }          yield '<';          yield tagName;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        if (! content && self._voidElements.has(tagName)) {          yield '/>';        }        else {          yield '>';          if (content) {            yield content;          }          yield '</';          yield tagName;          yield '>';        }
        }
    log["lastPathNode"] = "/t/html/head/t[7]";
    yield `
      `;
    tCallAssetsNodes = await self._getAssetNodes("web.assetsFrontend", {request: values["request"], css: true, js: false, debug: values["debug"], asyncLoad: false, deferLoad: false, lazyLoad: false, media: false});        for (const [index, value] of enumerate(tCallAssetsNodes)) {          let [tagName, attrs, content] = value;          if (index) {            yield ''          }          yield '<';          yield tagName;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        if (! content && self._voidElements.has(tagName)) {          yield '/>';        }        else {          yield '>';          if (content) {            yield content;          }          yield '</';          yield tagName;          yield '>';        }
        }
    log["lastPathNode"] = "/t/html/head/t[8]";
    yield `
    
        `;
    if (await self.userHasGroups("website.groupWebsitePublisher")) {
        tCallAssetsNodes = await self._getAssetNodes("website.assetsEditor", {request: values["request"], css: true, js: false, debug: values["debug"], asyncLoad: false, deferLoad: false, lazyLoad: false, media: false});            for (const [index, value] of enumerate(tCallAssetsNodes)) {              let [tagName, attrs, content] = value;              if (index) {                yield ''              }              yield '<';              yield tagName;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            if (! content && self._voidElements.has(tagName)) {              yield '/>';            }            else {              yield '>';              if (content) {                yield content;              }              yield '</';              yield tagName;              yield '>';            }
            }
    }
    log["lastPathNode"] = "/t/html/head/script[0]/t[0]";
    yield `
    <script id="web.layout.verpscript" type="text/javascript">
          var verp = {
            csrfToken: "`;
    content = await values['request'].csrfToken();
    forceDisplay = null;
    if (content != null && content !== false) {
        yield String(content);
    }
    else {
    }
    log["lastPathNode"] = "/t/html/head/script[0]/t[1]";
    yield `",
            debug: "`;
    content = values['debug'];
    forceDisplay = null;
    if (content != null && content !== false) {
        yield String(content);
    }
    else {
    }
    log["lastPathNode"] = "/t/html/head/script[1]/t";
    yield `",
          };
        </script>

        
      <script type="text/javascript">
        verp.__session_info__ = `;
    content = JSON.stringify(await values['env'].items('ir.http').getFrontendSessionInfo(values['request']));
    forceDisplay = null;
    if (content != null && content !== false) {
        yield String(content);
    }
    else {
    }
    log["lastPathNode"] = "/t/html/head/t[9]";
    yield `;
        if (!/(^|;\s)tz=/.test(document.cookie)) {
          var userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
          document.cookie = \`tz=\x24{userTZ}; path=/\`;
        }
      </script>
      `;
    tCallAssetsNodes = await self._getAssetNodes("web.assetsCommonMinimal", {request: values["request"], css: false, js: true, debug: values["debug"], asyncLoad: false, deferLoad: true, lazyLoad: false, media: false});        for (const [index, value] of enumerate(tCallAssetsNodes)) {          let [tagName, attrs, content] = value;          if (index) {            yield ''          }          yield '<';          yield tagName;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        if (! content && self._voidElements.has(tagName)) {          yield '/>';        }        else {          yield '>';          if (content) {            yield content;          }          yield '</';          yield tagName;          yield '>';        }
        }
    log["lastPathNode"] = "/t/html/head/t[10]";
    yield `
      `;
    tCallAssetsNodes = await self._getAssetNodes("web.assetsFrontendMinimal", {request: values["request"], css: false, js: true, debug: values["debug"], asyncLoad: false, deferLoad: true, lazyLoad: false, media: false});        for (const [index, value] of enumerate(tCallAssetsNodes)) {          let [tagName, attrs, content] = value;          if (index) {            yield ''          }          yield '<';          yield tagName;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        if (! content && self._voidElements.has(tagName)) {          yield '/>';        }        else {          yield '>';          if (content) {            yield content;          }          yield '</';          yield tagName;          yield '>';        }
        }
    log["lastPathNode"] = "/t/html/head/t[11]";
    yield `
       
      
      `;
    tCallAssetsNodes = await self._getAssetNodes("web.assetsCommonLazy", {request: values["request"], css: false, js: true, debug: values["debug"], asyncLoad: false, deferLoad: false, lazyLoad: true, media: false});        for (const [index, value] of enumerate(tCallAssetsNodes)) {          let [tagName, attrs, content] = value;          if (index) {            yield ''          }          yield '<';          yield tagName;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        if (! content && self._voidElements.has(tagName)) {          yield '/>';        }        else {          yield '>';          if (content) {            yield content;          }          yield '</';          yield tagName;          yield '>';        }
        }
    log["lastPathNode"] = "/t/html/head/t[12]";
    yield `
      `;
    tCallAssetsNodes = await self._getAssetNodes("web.assetsFrontendLazy", {request: values["request"], css: false, js: true, debug: values["debug"], asyncLoad: false, deferLoad: false, lazyLoad: true, media: false});        for (const [index, value] of enumerate(tCallAssetsNodes)) {          let [tagName, attrs, content] = value;          if (index) {            yield ''          }          yield '<';          yield tagName;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        if (! content && self._voidElements.has(tagName)) {          yield '/>';        }        else {          yield '>';          if (content) {            yield content;          }          yield '</';          yield tagName;          yield '>';        }
        }
    log["lastPathNode"] = "/t/html/head/t[13]";
    yield `
    
        `;
    if (await self.userHasGroups("website.groupWebsitePublisher")) {
        tCallAssetsNodes = await self._getAssetNodes("website.assetsEditor", {request: values["request"], css: false, js: true, debug: values["debug"], asyncLoad: false, deferLoad: false, lazyLoad: true, media: false});            for (const [index, value] of enumerate(tCallAssetsNodes)) {              let [tagName, attrs, content] = value;              if (index) {                yield ''              }              yield '<';              yield tagName;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            if (! content && self._voidElements.has(tagName)) {              yield '/>';            }            else {              yield '>';              if (content) {                yield content;              }              yield '</';              yield tagName;              yield '>';            }
            }
    }
    log["lastPathNode"] = "/t/html/head/t[14]";
    yield `
    `;
    content = values['head'] || '';
    forceDisplay = null;
    if (content != null && content !== false) {
        yield String(content);
    }
    else {
    }
    log["lastPathNode"] = "/t/html/head/t[15]";
    yield `
      
        
        `;
    content = await values['website'].customCodeHead;
    forceDisplay = null;
    if (content != null && content !== false) {
        yield String(content);
    }
    else {
    }
    log["lastPathNode"] = "/t/html/body";
    attrs = {};
    attrs["class"] = values['bodyClassname'];
    tagName = "body";
    yield `
    </head>
      <body`;
    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
    for (const [name, value] of Object.entries(attrs)) {
          if (value || typeof(value) === 'string') {
                yield ' ' + String(name) + '="' + String(value) + '"'
          }
    }
    log["lastPathNode"] = "/t/html/body/t[0]";
    yield `>
        
        `;
    if (await self.userHasGroups("website.groupWebsitePublisher")) {
        log["lastPathNode"] = "/t/html/body/t[0]/t";
        yield `
            `;
        let size_13;        let t_foreach_12 = ['headerOverlay', 'headerColor', 'headerVisible', 'footerVisible'] ?? [];        if (typeof(t_foreach_12) === 'number') {          size_13 = t_foreach_12;          values["optionName_size"] = size_13;          t_foreach_12 = range(size_13);        }        else if ('_length' in t_foreach_12) {          size_13 = t_foreach_12._length;          values["optionName_size"] = size_13;        }        else if ('length' in t_foreach_12) {          size_13 = t_foreach_12.length;          values["optionName_size"] = size_13;        }        else if ('size' in t_foreach_12) {          size_13 = t_foreach_12.size;          values["optionName_size"] = size_13;        }        else {          size_13 = null;        }        let hasValue_14 = false;        console.log('typeof t_foreach_12 of "optionName":', t_foreach_12.constructor.name);        if (t_foreach_12 instanceof Map || t_foreach_12 instanceof MapKey) {          t_foreach_12 = t_foreach_12.entries();          hasValue_14 = true;        }        if (typeof t_foreach_12 === 'object' && !isIterable(t_foreach_12)) {          t_foreach_12 = Object.entries(t_foreach_12);          hasValue_14 = true;        }
        for (const [index, item] of enumerate(t_foreach_12)) {          values["optionName_index"] = index;          if (hasValue_14) {            [values["optionName"], values["optionName_value"]] = item;          }          else {            values["optionName"] = item;            values["optionName_value"] = item;          }          values["optionName_first"] = values["optionName_index"] == 0;          if (size_13 != null) {            values["optionName_last"] = index + 1 === size_13;          }          values["optionName_odd"] = index % 2;          values["optionName_even"] = ! values["optionName_odd"];          values["optionName_parity"] = values["optionName_odd"] ? 'odd' : 'even';
            log["lastPathNode"] = "/t/html/body/t[0]/t";
            log["lastPathNode"] = "/t/html/body/t[0]/t/input";
            yield `
                `;
            if (values['optionName'] in values['mainObject']._fields) {
                attrs = {};
                attrs["type"] = "hidden";
                attrs["class"] = "o-page-option-data";
                attrs["name"] = values['optionName'];
                attrs["value"] = await values['mainObject'][values['optionName']];
                tagName = "input";
                yield `<input`;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                yield `/>`;
            }
            yield `
            `;
        }
        yield `
        `;
    }
    log["lastPathNode"] = "/t/html/body/div[0]";
    yield `
    
            `;
    if ('withLoader' in values['request'].params) {
        yield `<div class="o-theme-install-loader-container position-fixed fixed-top fixed-left             h-100 w-100 d-flex flex-column align-items-center text-white font-weight-bold text-center">
                Building your website...
                <div class="o-theme-install-loader"></div>
                <p class="o-theme-install-loader-tip w-25">
                    TIP: Once loaded, follow the
                    <span class="o-tooltip o-tooltip-visible bottom o-animated position-relative"></span>
                    <br/>pointer to build the perfect page in 7 steps.
                </p>
            </div>`;
    }
    log["lastPathNode"] = "/t/html/body/nav";
    yield `
            `;
    if (await self.userHasGroups("base.groupUser")) {
        if (values['website']) {
            log["lastPathNode"] = "/t/html/body/nav/button";
            yield `<nav id="oeMainMenuNavbar" class="o-main-navbar">
                <div id="oeApplications">
                    <div class="dropdown active">
                        <a class="dropdown-toggle full" data-toggle="dropdown" href="#" accesskey="h">
                            <i class="fa fa-th-large mr-2"></i> WEBSITE
                        </a>
                        <div class="dropdown-menu" role="menu">
                            
                        </div>
                    </div>
                </div>

                `;
            if (await self.userHasGroups("website.groupWebsiteDesigner")) {
                yield `<button type="button" class="btn fa fa-bars float-right d-block d-md-none o-mobile-menu-toggle" aria-label="Menu" title="Menu"></button>`;
            }
            log["lastPathNode"] = "/t/html/body/nav/div[1]";
            yield `

                `;
            if (await self.userHasGroups("website.groupWebsiteDesigner")) {
                log["lastPathNode"] = "/t/html/body/nav/div[1]/div[0]";
                yield `<div class="o-menu-sections">
                    
                    `;
                if (values['editable']) {
                    log["lastPathNode"] = "/t/html/body/nav/div[1]/div[0]/div/div";
                    yield `<div class="dropdown" id="content-menu">
                        <a id="content-menu-button" class="dropdown-toggle o-no-caret waves" data-toggle="dropdown" data-display="static" href="#">Pages</a>
                        <div class="dropdown-menu" role="menu">
                            <a role="menuitem" data-action="editMenu" href="#" title="Edit Top Menu" class="dropdown-item">Edit Menu</a>
                            <a role="menuitem" href="/website/pages" title="Manage Your Website Pages" class="dropdown-item">Manage Pages</a>
                            `;
                    if (values['deletable']) {
                        yield `<div role="separator" class="dropdown-divider"></div>`;
                    }
                    log["lastPathNode"] = "/t/html/body/nav/div[1]/div[0]/div/a[2]";
                    yield `
                            `;
                    if (values['deletable']) {
                        yield `<a role="menuitem" href="#" data-action="pageProperties" class="dropdown-item">Page Properties</a>`;
                    }
                    yield `
                        </div>
                    </div>`;
                }
                log["lastPathNode"] = "/t/html/body/nav/div[1]/t";
                yield `
                    
                    <div class="dropdown" id="customizeMenu">
                        <a class="dropdown-toggle o-no-caret waves" data-toggle="dropdown" data-display="static" href="#">Customize</a>
                        <div class="dropdown-menu" role="menu">
                            <a role="menuitem" href="#" data-action="ace" class="dropdown-item" id="htmlEditor">HTML/CSS/JS Editor</a>
                            <a role="menuitem" href="/web#action=website.actionWebsiteAddFeatures" class="dropdown-item" id="installApps">Add Features</a>
                        </div>
                    </div>
                    
                    <div class="dropdown" id="promoteMenu">
                        <a class="dropdown-toggle o-no-caret waves" data-toggle="dropdown" data-display="static" href="#">Promote</a>
                        <div class="dropdown-menu oe-promote-menu" role="menu">
                            <a role="menuitem" data-action="promoteCurrentPage" href="#" title="Promote page on the web" class="dropdown-item">Optimize SEO</a>
                        </div>
                    </div>
                    `;
                {
                async function* tCallContent(self, values, log) {
                    log["lastPathNode"] = "/t/html/body/nav/div[1]/t/t";
                    yield `
                        `;
                    async function* qwebTSet__t_html_body_nav_div_1__t_t() {
                        yield `d-flex d-sm-flex d-md-none`;
                    }
                    let qwebTSet__t_html_body_nav_div_1__t_t_value = '';
                    for await (const val of qwebTSet__t_html_body_nav_div_1__t_t()) qwebTSet__t_html_body_nav_div_1__t_t_value += val;
                    values["extraClasses"] = markup(qwebTSet__t_html_body_nav_div_1__t_t_value);;
                    yield `
                    `;
                }
                tCallValues = Object.assign({},  values);
                let res = '';
                for await (const str of tCallContent(self, tCallValues, log)) 
                    res = res + str;
                tCallValues['0'] = markup(res)
                }
                tCallOptions = Object.assign({}, compileOptions);                Object.assign(tCallOptions, {'callerTemplate': "website.layout", 'lastPathNode': "/t/html/body/nav/div[1]/t" })
                for await (const val of (await self._compile("website.websitePublisher", tCallOptions))(self, tCallValues)) {                        yield val;                      }
                yield `
                </div>`;
            }
            log["lastPathNode"] = "/t/html/body/nav/div[2]";
            yield `

                `;
            if (await self.userHasGroups("website.groupWebsitePublisher")) {
                log["lastPathNode"] = "/t/html/body/nav/div[2]/t[0]";
                yield `<div class="o-menu-systray d-none d-md-flex">
                    `;
                {
                async function* tCallContent(self, values, log) {
                    log["lastPathNode"] = "/t/html/body/nav/div[2]/t[0]/t[0]";
                    yield `
                        `;
                    async function* qwebTSet__t_html_body_nav_div_2__t_0__t_0_() {
                    }
                    let qwebTSet__t_html_body_nav_div_2__t_0__t_0__value = '';
                    for await (const val of qwebTSet__t_html_body_nav_div_2__t_0__t_0_()) qwebTSet__t_html_body_nav_div_2__t_0__t_0__value += val;
                    values["extraClasses"] = markup(qwebTSet__t_html_body_nav_div_2__t_0__t_0__value);;
                    log["lastPathNode"] = "/t/html/body/nav/div[2]/t[0]/t[1]";
                    yield `
                        `;
                    values["desktopNavbar"] = true;
                    yield `
                    `;
                }
                tCallValues = Object.assign({},  values);
                let res = '';
                for await (const str of tCallContent(self, tCallValues, log)) 
                    res = res + str;
                tCallValues['0'] = markup(res)
                }
                tCallOptions = Object.assign({}, compileOptions);                Object.assign(tCallOptions, {'callerTemplate': "website.layout", 'lastPathNode': "/t/html/body/nav/div[2]/t[0]" })
                for await (const val of (await self._compile("website.websitePublisher", tCallOptions))(self, tCallValues)) {                        yield val;                      }
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[1]";
                yield `
                    
                    <div class="o-mobile-preview" id="mobileMenu">
                        <a data-action="show-mobile-preview" href="#" accesskey="v"><span title="Mobile preview" role="img" aria-label="Mobile preview" class="fa fa-mobile"></span></a>
                    </div>
                    `;
                if (await self.userHasGroups("website.groupMultiWebsite")) {
                    if (values['multiWebsiteWebsites']) {
                        log["lastPathNode"] = "/t/html/body/nav/div[2]/div[1]/a/span/t";
                        yield `<div id="websiteSwitcher">
                        <a class="dropdown-toggle" data-toggle="dropdown" href="#" accesskey="w">
                            <i class="fa fa-globe d-lg-none"></i>
                            <span class="d-none d-lg-inline-block">
                                `;
                        content = values['multiWebsiteWebsitesCurrent']['label'];
                        forceDisplay = null;
                        if (content != null && content !== false) {
                            yield String(content);
                        }
                        else {
                        }
                        log["lastPathNode"] = "/t/html/body/nav/div[2]/div[1]/div/div/span";
                        yield `
                            </span>
                        </a>
                        <div class="dropdown-menu" role="menu">
                            <div class="d-lg-none dropdown-item active">
                                `;
                        content = values['multiWebsiteWebsitesCurrent']['label'];
                        forceDisplay = null;
                        if (content != null && content !== false) {
                            yield `<span>`;
                            yield String(content);
                            yield `</span>`;
                        }
                        else {
                            yield `<span>`;
                            yield `</span>`;
                        }
                        log["lastPathNode"] = "/t/html/body/nav/div[2]/div[1]/div/t";
                        yield `
                            </div>
                            `;
                        let size_16;                        let t_foreach_15 = values['multiWebsiteWebsites'] ?? [];                        if (typeof(t_foreach_15) === 'number') {                          size_16 = t_foreach_15;                          values["multiWebsiteWebsite_size"] = size_16;                          t_foreach_15 = range(size_16);                        }                        else if ('_length' in t_foreach_15) {                          size_16 = t_foreach_15._length;                          values["multiWebsiteWebsite_size"] = size_16;                        }                        else if ('length' in t_foreach_15) {                          size_16 = t_foreach_15.length;                          values["multiWebsiteWebsite_size"] = size_16;                        }                        else if ('size' in t_foreach_15) {                          size_16 = t_foreach_15.size;                          values["multiWebsiteWebsite_size"] = size_16;                        }                        else {                          size_16 = null;                        }                        let hasValue_17 = false;                        console.log('typeof t_foreach_15 of "multiWebsiteWebsite":', t_foreach_15.constructor.name);                        if (t_foreach_15 instanceof Map || t_foreach_15 instanceof MapKey) {                          t_foreach_15 = t_foreach_15.entries();                          hasValue_17 = true;                        }                        if (typeof t_foreach_15 === 'object' && !isIterable(t_foreach_15)) {                          t_foreach_15 = Object.entries(t_foreach_15);                          hasValue_17 = true;                        }
                        for (const [index, item] of enumerate(t_foreach_15)) {                          values["multiWebsiteWebsite_index"] = index;                          if (hasValue_17) {                            [values["multiWebsiteWebsite"], values["multiWebsiteWebsite_value"]] = item;                          }                          else {                            values["multiWebsiteWebsite"] = item;                            values["multiWebsiteWebsite_value"] = item;                          }                          values["multiWebsiteWebsite_first"] = values["multiWebsiteWebsite_index"] == 0;                          if (size_16 != null) {                            values["multiWebsiteWebsite_last"] = index + 1 === size_16;                          }                          values["multiWebsiteWebsite_odd"] = index % 2;                          values["multiWebsiteWebsite_even"] = ! values["multiWebsiteWebsite_odd"];                          values["multiWebsiteWebsite_parity"] = values["multiWebsiteWebsite_odd"] ? 'odd' : 'even';
                            log["lastPathNode"] = "/t/html/body/nav/div[2]/div[1]/div/t";
                            log["lastPathNode"] = "/t/html/body/nav/div[2]/div[1]/div/t/a";
                            attrs = {};
                            attrs["role"] = "menuitem";
                            attrs["href"] = "#";
                            attrs["class"] = "dropdown-item oe-menu-text js-multi-website-switch";
                            attrs["domain"] = values['multiWebsiteWebsite']['domain'];
                            attrs["website-id"] = String(values['multiWebsiteWebsite']['websiteId']);
                            tagName = "a";
                            yield `
                                <a`;
                            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                            for (const [name, value] of Object.entries(attrs)) {
                                  if (value || typeof(value) === 'string') {
                                        yield ' ' + String(name) + '="' + String(value) + '"'
                                  }
                            }
                            log["lastPathNode"] = "/t/html/body/nav/div[2]/div[1]/div/t/a/span";
                            yield `>
                                    `;
                            content = values['multiWebsiteWebsite']['label'];
                            forceDisplay = null;
                            if (content != null && content !== false) {
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
                        yield `
                        </div>
                    </div>`;
                    }
                }
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[2]/div/div/div/t[0]";
                yield `

                    
                    <div class="o-new-content-menu" id="newContentMenu">
                        <a href="#" accesskey="c"><span class="fa fa-plus mr-2"></span>New</a>
                        <div id="oNewContentMenuChoices" class="o-hidden">
                            <div class="container pt32 pb32">
                                <div class="row">
                                    `;
                values["isSystem"] = await (await values['env'].user()).hasGroup('base.groupSystem');
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[2]/div/div/div/t[1]";
                yield `
                                    `;
                values["isDesigner"] = await (await values['env'].user()).hasGroup('website.groupWebsiteDesigner');
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[2]/div/div/div/div[0]";
                yield `

                                    `;
                if (values['isDesigner']) {
                    yield `<div class="col-md-4 mb8 o-new-content-element">
                                        <a href="#" data-action="newPage" aria-label="New page" title="New page">
                                            <i class="fa fa-file-o"></i>
                                            <p>Page</p>
                                        </a>
                                    </div>`;
                }
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[2]/div/div/div/t[2]";
                yield `

                                    `;
                values["mod"] = await values['env'].ref('base.module_website_blog');
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[2]/div/div/div/div[1]";
                yield `
                                    `;
                if (values['isSystem']) {
                    attrs = {};
                    attrs["name"] = "moduleWebsiteBlog";
                    attrs["class"] = "col-md-4 mb8 o-new-content-element";
                    attrs["data-module-id"] = values['mod'].id;
                    attrs["data-module-shortdesc"] = await values['mod'].shortdesc;
                    tagName = "div";
                    yield `<div`;
                    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                    for (const [name, value] of Object.entries(attrs)) {
                          if (value || typeof(value) === 'string') {
                                yield ' ' + String(name) + '="' + String(value) + '"'
                          }
                    }
                    yield `>
                                        <a href="#" data-action="newBlogPost">
                                            <i class="fa fa-rss"></i>
                                            <p>Blog Post</p>
                                        </a>
                                    </div>`;
                }
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[2]/div/div/div/t[3]";
                yield `
                                    `;
                values["mod"] = await values['env'].ref('base.module_website_event');
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[2]/div/div/div/div[2]";
                yield `
                                    `;
                if (values['isSystem']) {
                    attrs = {};
                    attrs["name"] = "moduleWebsiteEvent";
                    attrs["class"] = "col-md-4 mb8 o-new-content-element";
                    attrs["data-module-id"] = values['mod'].id;
                    attrs["data-module-shortdesc"] = await values['mod'].shortdesc;
                    tagName = "div";
                    yield `<div`;
                    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                    for (const [name, value] of Object.entries(attrs)) {
                          if (value || typeof(value) === 'string') {
                                yield ' ' + String(name) + '="' + String(value) + '"'
                          }
                    }
                    yield `>
                                        <a href="#" data-action="newEvent">
                                            <i class="fa fa-ticket"></i>
                                            <p>Event</p>
                                        </a>
                                    </div>`;
                }
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[2]/div/div/div/t[4]";
                yield `
                                    `;
                values["mod"] = await values['env'].ref('base.module_website_forum');
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[2]/div/div/div/div[3]";
                yield `
                                    `;
                if (values['isSystem']) {
                    attrs = {};
                    attrs["name"] = "moduleWebsiteForum";
                    attrs["class"] = "col-md-4 mb8 o-new-content-element o-new-content-element-once";
                    attrs["data-module-id"] = values['mod'].id;
                    attrs["data-module-shortdesc"] = await values['mod'].shortdesc;
                    tagName = "div";
                    yield `<div`;
                    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                    for (const [name, value] of Object.entries(attrs)) {
                          if (value || typeof(value) === 'string') {
                                yield ' ' + String(name) + '="' + String(value) + '"'
                          }
                    }
                    yield `>
                                        <a href="#" data-url="/forum" data-action="newForum">
                                            <i class="fa fa-comment"></i>
                                            <p>Forum</p>
                                        </a>
                                    </div>`;
                }
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[2]/div/div/div/t[5]";
                yield `
                                    `;
                values["mod"] = await values['env'].ref('base.module_website_hr_recruitment');
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[2]/div/div/div/div[4]";
                yield `
                                    `;
                if (values['isSystem']) {
                    attrs = {};
                    attrs["name"] = "moduleWebsiteHrRecruitment";
                    attrs["class"] = "col-md-4 mb8 o-new-content-element";
                    attrs["data-module-id"] = values['mod'].id;
                    attrs["data-module-shortdesc"] = await values['mod'].shortdesc;
                    tagName = "div";
                    yield `<div`;
                    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                    for (const [name, value] of Object.entries(attrs)) {
                          if (value || typeof(value) === 'string') {
                                yield ' ' + String(name) + '="' + String(value) + '"'
                          }
                    }
                    yield `>
                                            <a href="#">
                                                <i class="fa fa-briefcase"></i>
                                                <p>Job Offer</p>
                                            </a>
                                    </div>`;
                }
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[2]/div/div/div/t[6]";
                yield `
                                    `;
                values["mod"] = await values['env'].ref('base.module_website_sale');
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[2]/div/div/div/div[5]";
                yield `
                                    `;
                if (await (await values['env'].user()).hasGroup('sales_team.groupSaleManager')) {
                    yield `<div name="moduleWebsiteSale" class="col-md-4 mb8 o-new-content-element">
                                        <a href="#" data-action="newProduct">
                                            <i class="fa fa-shopping-cart"></i>
                                            <p>Product</p>
                                        </a>
                                    </div>`;
                }
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[2]/div/div/div/t[7]";
                yield `
                                    `;
                values["mod"] = await values['env'].ref('base.module_website_slides');
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[2]/div/div/div/div[6]";
                yield `
                                    `;
                if (values['isSystem']) {
                    attrs = {};
                    attrs["name"] = "moduleWebsiteSlides";
                    attrs["class"] = "col-md-4 mb8 o-new-content-element";
                    attrs["data-module-id"] = values['mod'].id;
                    attrs["data-module-shortdesc"] = await values['mod'].shortdesc;
                    tagName = "div";
                    yield `<div`;
                    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                    for (const [name, value] of Object.entries(attrs)) {
                          if (value || typeof(value) === 'string') {
                                yield ' ' + String(name) + '="' + String(value) + '"'
                          }
                    }
                    yield `>
                                        <a href="#" data-action="newSlideChannel">
                                            <i class="fa module-icon" style="background-image: url(&#39;/website/static/src/img/apps_thumbs/website_slide.svg&#39;);                                                 background-repeat: no-repeat; background-position: center;"></i>
                                            <p>Course</p>
                                        </a>
                                    </div>`;
                }
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[2]/div/div/div/t[8]";
                yield `
                                    `;
                values["mod"] = await values['env'].ref('base.module_website_livechat');
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[2]/div/div/div/div[7]";
                yield `
                                    `;
                if (values['isSystem']) {
                    attrs = {};
                    attrs["name"] = "moduleWebsiteLivechat";
                    attrs["class"] = "col-md-4 mb8 o-new-content-element o-new-content-element-once";
                    attrs["data-module-id"] = values['mod'].id;
                    attrs["data-module-shortdesc"] = await values['mod'].shortdesc;
                    tagName = "div";
                    yield `<div`;
                    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                    for (const [name, value] of Object.entries(attrs)) {
                          if (value || typeof(value) === 'string') {
                                yield ' ' + String(name) + '="' + String(value) + '"'
                          }
                    }
                    yield `>
                                        <a href="#" data-url="/livechat" data-action="newChannel">
                                            <i class="fa fa-comments"></i>
                                            <p>Livechat Widget</p>
                                        </a>
                                    </div>`;
                }
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[3]";
                yield `
                                </div>
                            </div>
                        </div>
                    </div>
                    `;
                if (! values['translatable']) {
                    yield `<div id="editPageMenu">
                        <a data-action="edit" href="#" accesskey="a"><span class="fa fa-pencil mr-2"></span>Edit</a>
                    </div>`;
                }
                log["lastPathNode"] = "/t/html/body/nav/div[2]/t[1]";
                yield `
                    
            `;
                if (values['mainObject']._name == 'product.template') {
                    values["action"] = 'website_sale.productTemplateActionWebsite';
                }
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[4]";
                yield `
        `;
                if (values['editInBackend'] || ('websitePublished' in await values['mainObject'].fieldsGet() && values['mainObject']._name !== 'website.page')) {
                    log["lastPathNode"] = "/t/html/body/nav/div[2]/div[4]/div/a";
                    attrs = {};
                    attrs["role"] = "menuitem";
                    attrs["style"] = "text-align: left;";
                    attrs["class"] = "dropdown-item";
                    attrs["title"] = "Edit in backend";
                    attrs["id"] = "edit-in-backend";
                    attrs["href"] = format("/web#viewType=form&model=%s&id=%s&action=%s&menuId=%s", await self._compileToStr(values['mainObject']._name), await self._compileToStr(values['mainObject'].id), await self._compileToStr(values['action']), await self._compileToStr(values['backendMenuId']));
                    tagName = "a";
                    yield `<div>
                        <a role="button" class="btn btn-primary btn-sm dropdown-toggle css-edit-dynamic" data-toggle="dropdown">
                            <span class="sr-only">Toggle Dropdown</span>
                        </a>
                        <div class="dropdown-menu" role="menu">
                            <a`;
                    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                    for (const [name, value] of Object.entries(attrs)) {
                          if (value || typeof(value) === 'string') {
                                yield ' ' + String(name) + '="' + String(value) + '"'
                          }
                    }
                    yield `>Edit in backend</a>
                        </div>
                    </div>`;
                }
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[5]";
                yield `
                    `;
                if (values['translatable']) {
                    yield `<div>
                        <a data-action="translate" href="#">TRANSLATE</a>
                    </div>`;
                }
                log["lastPathNode"] = "/t/html/body/nav/div[2]/div[6]";
                yield `
                    `;
                if (values['translatable']) {
                    yield `<div>
                        <a data-action="editMaster" href="#">or Edit Master</a>
                    </div>`;
                }
                yield `
                </div>`;
            }
            yield `
            </nav>`;
        }
    }
    log["lastPathNode"] = "/t/html/body/div[1]";
    attrs = {};
    attrs["id"] = "wrapwrap";
    attrs["class"] = format("%s", await self._compileToStr('headerOverlay' in values['mainObject']._fields && await values['mainObject'].headerOverlay ? 'o-header-overlay' : ''));
    tagName = "div";
    yield `
        
      <div`;
    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
    for (const [name, value] of Object.entries(attrs)) {
          if (value || typeof(value) === 'string') {
                yield ' ' + String(name) + '="' + String(value) + '"'
          }
    }
    log["lastPathNode"] = "/t/html/body/div[1]/t[0]";
    yield `>
        `;
    values["ctaBtnText"] = false;
    log["lastPathNode"] = "/t/html/body/div[1]/t[1]";
    yield `
        `;
    async function* qwebTSet__t_html_body_div_1__t_1_() {
        yield `/contactus`;
    }
    let qwebTSet__t_html_body_div_1__t_1__value = '';
    for await (const val of qwebTSet__t_html_body_div_1__t_1_()) qwebTSet__t_html_body_div_1__t_1__value += val;
    values["ctaBtnHref"] = markup(qwebTSet__t_html_body_div_1__t_1__value);;
    log["lastPathNode"] = "/t/html/body/div[1]/header";
    yield `
    
        `;
    if (! values['noHeader']) {
        attrs = {};
        attrs["id"] = "top";
        attrs["data-anchor"] = "true";
        attrs["data-name"] = "Header";
        attrs["class"] = "o-header-standard";
        tagName = "header";
        yield `<header`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        log["lastPathNode"] = "/t/html/body/div[1]/header/t";
        yield `>
          
            
        `;
        {
        async function* tCallContent(self, values, log) {
            log["lastPathNode"] = "/t/html/body/div[1]/header/t/t";
            yield `
            `;
            values["_navbarClasses"] = "shadow-sm";
            log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/t[0]";
            yield `
            <div id="topMenuContainer" class="container justify-content-start justify-content-lg-between">
                
                `;
            {
            async function* tCallContent(self, values, log) {
                log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/t[0]/t";
                yield `
                    `;
                values["_linkClass"] = "mr-4";
                yield `
                `;
            }
            tCallValues = Object.assign({},  values);
            let res = '';
            for await (const str of tCallContent(self, tCallValues, log)) 
                res = res + str;
            tCallValues['0'] = markup(res)
            }
            tCallOptions = Object.assign({}, compileOptions);            Object.assign(tCallOptions, {'callerTemplate': "website.layout", 'lastPathNode': "/t/html/body/div[1]/header/t/div/t[0]" })
            for await (const val of (await self._compile("website.placeholderHeaderBrand", tCallOptions))(self, tCallValues)) {                    yield val;                  }
            log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/div/t[0]";
            yield `
                
                <div id="topMenuCollapse" class="collapse navbar-collapse order-last order-lg-0">
                    `;
            {
            async function* tCallContent(self, values, log) {
                log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/div/t[0]/t[0]";
                yield `
                        `;
                values["_navClass"] = "flex-grow-1";
                log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/div/t[0]/t[1]";
                yield `
                        
                        `;
                let size_19;                let t_foreach_18 = values['website'].menuId.childId ?? [];                if (typeof(t_foreach_18) === 'number') {                  size_19 = t_foreach_18;                  values["submenu_size"] = size_19;                  t_foreach_18 = range(size_19);                }                else if ('_length' in t_foreach_18) {                  size_19 = t_foreach_18._length;                  values["submenu_size"] = size_19;                }                else if ('length' in t_foreach_18) {                  size_19 = t_foreach_18.length;                  values["submenu_size"] = size_19;                }                else if ('size' in t_foreach_18) {                  size_19 = t_foreach_18.size;                  values["submenu_size"] = size_19;                }                else {                  size_19 = null;                }                let hasValue_20 = false;                console.log('typeof t_foreach_18 of "submenu":', t_foreach_18.constructor.name);                if (t_foreach_18 instanceof Map || t_foreach_18 instanceof MapKey) {                  t_foreach_18 = t_foreach_18.entries();                  hasValue_20 = true;                }                if (typeof t_foreach_18 === 'object' && !isIterable(t_foreach_18)) {                  t_foreach_18 = Object.entries(t_foreach_18);                  hasValue_20 = true;                }
                for (const [index, item] of enumerate(t_foreach_18)) {                  values["submenu_index"] = index;                  if (hasValue_20) {                    [values["submenu"], values["submenu_value"]] = item;                  }                  else {                    values["submenu"] = item;                    values["submenu_value"] = item;                  }                  values["submenu_first"] = values["submenu_index"] == 0;                  if (size_19 != null) {                    values["submenu_last"] = index + 1 === size_19;                  }                  values["submenu_odd"] = index % 2;                  values["submenu_even"] = ! values["submenu_odd"];                  values["submenu_parity"] = values["submenu_odd"] ? 'odd' : 'even';
                    log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/div/t[0]/t[1]";
                    log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/div/t[0]/t[1]/t";
                    yield `
                            `;
                    {
                    async function* tCallContent(self, values, log) {
                        log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/div/t[0]/t[1]/t/t[0]";
                        yield `
                                `;
                        values["itemClass"] = "nav-item";
                        log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/div/t[0]/t[1]/t/t[1]";
                        yield `
                                `;
                        values["linkClass"] = "nav-link";
                        yield `
                            `;
                    }
                    tCallValues = Object.assign({},  values);
                    let res = '';
                    for await (const str of tCallContent(self, tCallValues, log)) 
                        res = res + str;
                    tCallValues['0'] = markup(res)
                    }
                    tCallOptions = Object.assign({}, compileOptions);                    Object.assign(tCallOptions, {'callerTemplate': "website.layout", 'lastPathNode': "/t/html/body/div[1]/header/t/div/div/t[0]/t[1]/t" })
                    for await (const val of (await self._compile("website.submenu", tCallOptions))(self, tCallValues)) {                            yield val;                          }
                    yield `
                        `;
                }
                log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/div/t[0]/t[2]";
                yield `
                        
            `;
                {
                async function* tCallContent(self, values, log) {
                    log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/div/t[0]/t[2]/t[0]";
                    yield `
                `;
                    values["_icon"] = true;
                    log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/div/t[0]/t[2]/t[1]";
                    yield `
                `;
                    values["_itemClass"] = 'nav-item mx-lg-3';
                    log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/div/t[0]/t[2]/t[2]";
                    yield `
                `;
                    values["_linkClass"] = 'nav-link';
                    yield `
            `;
                }
                tCallValues = Object.assign({},  values);
                let res = '';
                for await (const str of tCallContent(self, tCallValues, log)) 
                    res = res + str;
                tCallValues['0'] = markup(res)
                }
                tCallOptions = Object.assign({}, compileOptions);                Object.assign(tCallOptions, {'callerTemplate': "website.layout", 'lastPathNode': "/t/html/body/div[1]/header/t/div/div/t[0]/t[2]" })
                for await (const val of (await self._compile("website_sale.headerCartLink", tCallOptions))(self, tCallValues)) {                        yield val;                      }
                log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/div/t[0]/t[3]";
                yield `
        
                        `;
                {
                async function* tCallContent(self, values, log) {
                    log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/div/t[0]/t[3]/t[0]";
                    yield `
                            `;
                    values["_itemClass"] = "nav-item ml-lg-auto";
                    log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/div/t[0]/t[3]/t[1]";
                    yield `
                            `;
                    values["_linkClass"] = "nav-link font-weight-bold";
                    yield `
                        `;
                }
                tCallValues = Object.assign({},  values);
                let res = '';
                for await (const str of tCallContent(self, tCallValues, log)) 
                    res = res + str;
                tCallValues['0'] = markup(res)
                }
                tCallOptions = Object.assign({}, compileOptions);                Object.assign(tCallOptions, {'callerTemplate': "website.layout", 'lastPathNode': "/t/html/body/div[1]/header/t/div/div/t[0]/t[3]" })
                for await (const val of (await self._compile("portal.placeholderUserSignIn", tCallOptions))(self, tCallValues)) {                        yield val;                      }
                log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/div/t[0]/t[4]";
                yield `
                        
                        `;
                {
                async function* tCallContent(self, values, log) {
                    log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/div/t[0]/t[4]/t[0]";
                    yield `
                            `;
                    values["_userName"] = true;
                    log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/div/t[0]/t[4]/t[1]";
                    yield `
                            `;
                    values["_itemClass"] = "nav-item dropdown ml-lg-auto";
                    log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/div/t[0]/t[4]/t[2]";
                    yield `
                            `;
                    values["_linkClass"] = "nav-link font-weight-bold";
                    yield `
                        `;
                }
                tCallValues = Object.assign({},  values);
                let res = '';
                for await (const str of tCallContent(self, tCallValues, log)) 
                    res = res + str;
                tCallValues['0'] = markup(res)
                }
                tCallOptions = Object.assign({}, compileOptions);                Object.assign(tCallOptions, {'callerTemplate': "website.layout", 'lastPathNode': "/t/html/body/div[1]/header/t/div/div/t[0]/t[4]" })
                for await (const val of (await self._compile("portal.userDropdown", tCallOptions))(self, tCallValues)) {                        yield val;                      }
                yield `
                    `;
            }
            tCallValues = Object.assign({},  values);
            let res = '';
            for await (const str of tCallContent(self, tCallValues, log)) 
                res = res + str;
            tCallValues['0'] = markup(res)
            }
            tCallOptions = Object.assign({}, compileOptions);            Object.assign(tCallOptions, {'callerTemplate': "website.layout", 'lastPathNode': "/t/html/body/div[1]/header/t/div/div/t[0]" })
            for await (const val of (await self._compile("website.navbarNav", tCallOptions))(self, tCallValues)) {                    yield val;                  }
            log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/div/t[1]";
            yield `

                    
                    `;
            {
            async function* tCallContent(self, values, log) {
                log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/div/t[1]/t";
                yield `
                        `;
                values["_divClasses"] = "my-auto ml-lg-2";
                yield `
                    `;
            }
            tCallValues = Object.assign({},  values);
            let res = '';
            for await (const str of tCallContent(self, tCallValues, log)) 
                res = res + str;
            tCallValues['0'] = markup(res)
            }
            tCallOptions = Object.assign({}, compileOptions);            Object.assign(tCallOptions, {'callerTemplate': "website.layout", 'lastPathNode': "/t/html/body/div[1]/header/t/div/div/t[1]" })
            for await (const val of (await self._compile("website.placeholderHeaderLanguageSelector", tCallOptions))(self, tCallValues)) {                    yield val;                  }
            log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/t[1]";
            yield `
                </div>
                
                `;
            {
            async function* tCallContent(self, values, log) {
                log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/t[1]/t";
                yield `
                    `;
                values["_divClasses"] = "ml-lg-4";
                yield `
                `;
            }
            tCallValues = Object.assign({},  values);
            let res = '';
            for await (const str of tCallContent(self, tCallValues, log)) 
                res = res + str;
            tCallValues['0'] = markup(res)
            }
            tCallOptions = Object.assign({}, compileOptions);            Object.assign(tCallOptions, {'callerTemplate': "website.layout", 'lastPathNode': "/t/html/body/div[1]/header/t/div/t[1]" })
            for await (const val of (await self._compile("website.placeholderHeaderCallToAction", tCallOptions))(self, tCallValues)) {                    yield val;                  }
            log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/t[2]";
            yield `
                
                `;
            {
            async function* tCallContent(self, values, log) {
                log["lastPathNode"] = "/t/html/body/div[1]/header/t/div/t[2]/t";
                yield `
                    `;
                values["_togglerClass"] = "ml-auto";
                yield `
                `;
            }
            tCallValues = Object.assign({},  values);
            let res = '';
            for await (const str of tCallContent(self, tCallValues, log)) 
                res = res + str;
            tCallValues['0'] = markup(res)
            }
            tCallOptions = Object.assign({}, compileOptions);            Object.assign(tCallOptions, {'callerTemplate': "website.layout", 'lastPathNode': "/t/html/body/div[1]/header/t/div/t[2]" })
            for await (const val of (await self._compile("website.navbarToggler", tCallOptions))(self, tCallValues)) {                    yield val;                  }
            yield `
            </div>
        `;
        }
        tCallValues = Object.assign({},  values);
        let res = '';
        for await (const str of tCallContent(self, tCallValues, log)) 
            res = res + str;
        tCallValues['0'] = markup(res)
        }
        tCallOptions = Object.assign({}, compileOptions);        Object.assign(tCallOptions, {'callerTemplate': "website.layout", 'lastPathNode': "/t/html/body/div[1]/header/t" })
        for await (const val of (await self._compile("website.navbar", tCallOptions))(self, tCallValues)) {                yield val;              }
        yield `
    
        
        </header>`;
    }
    log["lastPathNode"] = "/t/html/body/div[1]/main/div";
    yield `
        <main>
            `;
    if (values['oPortalFullwidthAlert']) {
        log["lastPathNode"] = "/t/html/body/div[1]/main/div/div/t";
        yield `<div class="alert alert-info alert-dismissible rounded-0 fade show d-print-none css-editable-mode-hidden">
                <div class="container">
                    `;
        content = values['oPortalFullwidthAlert'];
        forceDisplay = null;
        if (content != null && content !== false) {
            yield String(content);
        }
        else {
        }
        yield `
                </div>
            </div>`;
    }
    log["lastPathNode"] = "/t/html/body/div[1]/main/t";
    yield `
        
          `;
    for (const str of Array.from(values['0'] || [])) yield str;
    log["lastPathNode"] = "/t/html/body/div[1]/footer";
    yield `
        </main>
        `;
    if (! values['noFooter']) {
        attrs = {};
        attrs["id"] = "bottom";
        attrs["data-anchor"] = "true";
        attrs["data-name"] = "Footer";
        attrs["class"] = format("%s", await self._compileToStr('footerVisible' in values['mainObject']._fields && !await values['mainObject'].footerVisible ? 'd-none o-snippet-invisible' : ''));
        tagName = "footer";
        yield `<footer`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        log["lastPathNode"] = "/t/html/body/div[1]/footer/div[0]";
        yield `>
          
        `;
        if (! values['noFooter']) {
            attrs = {};
            attrs["id"] = "footer";
            attrs["class"] = "oe-structure oe-structure-solo";
            tagName = "div";
            yield `<div`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            log["lastPathNode"] = "/t/html/body/div[1]/footer/div[0]/section/div/div/div[0]/ul/t";
            yield `>
            <section class="s-text-block pt40 pb16" data-snippet="sTextBlock" data-name="Text">
                <div class="container">
                    <div class="row">
                        <div class="col-lg-2 pt24 pb24">
                            <h5 class="mb-3">Useful Links</h5>
                            <ul class="list-unstyled">
                                <li><a href="/">Home</a></li>
                                <li><a href="#">About us</a></li>
                                <li><a href="#">Products</a></li>
                                <li><a href="#">Services</a></li>
                                <li><a href="#">Legal</a></li>
                                `;
            values["configuratorFooterLinks"] = [];
            log["lastPathNode"] = "/t/html/body/div[1]/footer/div[0]/section/div/div/div[0]/ul/li[5]";
            yield `
                                `;
            let size_22;            let t_foreach_21 = values['configuratorFooterLinks'] ?? [];            if (typeof(t_foreach_21) === 'number') {              size_22 = t_foreach_21;              values["link_size"] = size_22;              t_foreach_21 = range(size_22);            }            else if ('_length' in t_foreach_21) {              size_22 = t_foreach_21._length;              values["link_size"] = size_22;            }            else if ('length' in t_foreach_21) {              size_22 = t_foreach_21.length;              values["link_size"] = size_22;            }            else if ('size' in t_foreach_21) {              size_22 = t_foreach_21.size;              values["link_size"] = size_22;            }            else {              size_22 = null;            }            let hasValue_23 = false;            console.log('typeof t_foreach_21 of "link":', t_foreach_21.constructor.name);            if (t_foreach_21 instanceof Map || t_foreach_21 instanceof MapKey) {              t_foreach_21 = t_foreach_21.entries();              hasValue_23 = true;            }            if (typeof t_foreach_21 === 'object' && !isIterable(t_foreach_21)) {              t_foreach_21 = Object.entries(t_foreach_21);              hasValue_23 = true;            }
            for (const [index, item] of enumerate(t_foreach_21)) {              values["link_index"] = index;              if (hasValue_23) {                [values["link"], values["link_value"]] = item;              }              else {                values["link"] = item;                values["link_value"] = item;              }              values["link_first"] = values["link_index"] == 0;              if (size_22 != null) {                values["link_last"] = index + 1 === size_22;              }              values["link_odd"] = index % 2;              values["link_even"] = ! values["link_odd"];              values["link_parity"] = values["link_odd"] ? 'odd' : 'even';
                log["lastPathNode"] = "/t/html/body/div[1]/footer/div[0]/section/div/div/div[0]/ul/li[5]";
                log["lastPathNode"] = "/t/html/body/div[1]/footer/div[0]/section/div/div/div[0]/ul/li[5]/a";
                yield `<li>
                                    `;
                content = values['link']['text'];
                forceDisplay = null;
                if (content != null && content !== false) {
                    attrs = {};
                    attrs["href"] = values['link']['href'];
                    tagName = "a";
                    yield `<a`;
                    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                    for (const [name, value] of Object.entries(attrs)) {
                          if (value || typeof(value) === 'string') {
                                yield ' ' + String(name) + '="' + String(value) + '"'
                          }
                    }
                    yield `>`;
                    yield String(content);
                    yield `</a>`;
                }
                else {
                    attrs = {};
                    attrs["href"] = values['link']['href'];
                    tagName = "a";
                    yield `<a`;
                    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                    for (const [name, value] of Object.entries(attrs)) {
                          if (value || typeof(value) === 'string') {
                                yield ' ' + String(name) + '="' + String(value) + '"'
                          }
                    }
                    yield `>`;
                    yield `</a>`;
                }
                yield `
                                </li>`;
            }
            yield `
                                <li><a href="/contactus">Contact us</a></li>
                            </ul>
                        </div>
                        <div class="col-lg-5 pt24 pb24">
                            <h5 class="mb-3">About us</h5>
                            <p>We are a team of passionate people whose goal is to improve everyone's life through disruptive products. We build great products to solve your business problems.
                            <br/><br/>Our products are designed for small to medium size companies willing to optimize their performance.</p>
                        </div>
                        <div id="connect" class="col-lg-4 offset-lg-1 pt24 pb24">
                            <h5 class="mb-3">Connect with us</h5>
                            <ul class="list-unstyled">
                                <li><i class="fa fa-comment fa-fw mr-2"></i><span><a href="/contactus">Contact us</a></span></li>
                                <li><i class="fa fa-envelope fa-fw mr-2"></i><span><a href="mailto:info@yourcompany.example.com">info@yourcompany.example.com</a></span></li>
                                <li><i class="fa fa-phone fa-fw mr-2"></i><span class="o-force-ltr"><a href="tel:+1 (650) 555-0111">+1 (650) 555-0111</a></span></li>
                            </ul>
                            <div class="s-share text-left" data-snippet="sShare" data-name="Social Media">
                                <h5 class="s-share-title d-none">Follow us</h5>
                                <a href="/website/social/facebook" class="s-share-facebook" target="_blank">
                                    <i class="fa fa-facebook rounded-circle shadow-sm"></i>
                                </a>
                                <a href="/website/social/twitter" class="s-share-twitter" target="_blank">
                                    <i class="fa fa-twitter rounded-circle shadow-sm"></i>
                                </a>
                                <a href="/website/social/linkedin" class="s-share-linkedin" target="_blank">
                                    <i class="fa fa-linkedin rounded-circle shadow-sm"></i>
                                </a>
                                <a href="/" class="text-800 float-right">
                                    <i class="fa fa-home rounded-circle shadow-sm"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>`;
        }
        log["lastPathNode"] = "/t/html/body/div[1]/footer/div[1]";
        yield `
    
            `;
        if (! values['noCopyright']) {
            log["lastPathNode"] = "/t/html/body/div[1]/footer/div[1]/div/div/div[0]/t[0]";
            yield `<div class="o-colored-level o-cc" data-name="Copyright">
              <div class="container py-3">
                <div class="row">
                  <div class="col-sm text-center text-sm-left text-muted">
                    `;
            tCallValues = Object.assign({}, values);
            tCallValues['0'] = markup('');
            tCallOptions = Object.assign({}, compileOptions);            Object.assign(tCallOptions, {'callerTemplate': "website.layout", 'lastPathNode': "/t/html/body/div[1]/footer/div[1]/div/div/div[0]/t[0]" })
            for await (const val of (await self._compile("web.debugIcon", tCallOptions))(self, tCallValues)) {                    yield val;                  }
            log["lastPathNode"] = "/t/html/body/div[1]/footer/div[1]/div/div/div[0]/t[1]";
            yield `
                    
        <span class="o-footer-copyright-name mr-2">Copyright &copy; Company name</span>
    
        `;
            values["flags"] = true;
            log["lastPathNode"] = "/t/html/body/div[1]/footer/div[1]/div/div/div[0]/t[2]";
            yield `
    
            `;
            {
            async function* tCallContent(self, values, log) {
                log["lastPathNode"] = "/t/html/body/div[1]/footer/div[1]/div/div/div[0]/t[2]/t";
                yield `
                `;
                values["_divClasses"] = (values['_divClasses'] || '') + ' dropup';
                yield `
            `;
            }
            tCallValues = Object.assign({},  values);
            let res = '';
            for await (const str of tCallContent(self, tCallValues, log)) 
                res = res + str;
            tCallValues['0'] = markup(res)
            }
            tCallOptions = Object.assign({}, compileOptions);            Object.assign(tCallOptions, {'callerTemplate': "website.layout", 'lastPathNode': "/t/html/body/div[1]/footer/div[1]/div/div/div[0]/t[2]" })
            for await (const val of (await self._compile("portal.languageSelector", tCallOptions))(self, tCallValues)) {                    yield val;                  }
            log["lastPathNode"] = "/t/html/body/div[1]/footer/div[1]/div/div/div[1]";
            yield `
        
                  </div>
                  `;
            if (! values['editable']) {
                log["lastPathNode"] = "/t/html/body/div[1]/footer/div[1]/div/div/div[1]/t";
                yield `<div class="o-not-editable">
                    `;
                tCallValues = Object.assign({}, values);
                tCallValues['0'] = markup('');
                tCallOptions = Object.assign({}, compileOptions);                Object.assign(tCallOptions, {'callerTemplate': "website.layout", 'lastPathNode': "/t/html/body/div[1]/footer/div[1]/div/div/div[1]/t" })
                for await (const val of (await self._compile("web.brandPromotion", tCallOptions))(self, tCallValues)) {                        yield val;                      }
                yield `
                  </div>`;
            }
            yield `
                </div>
              </div>
            </div>`;
        }
        yield `
        </footer>`;
    }
    log["lastPathNode"] = "/t/html/body/div[1]/div";
    yield `
        `;
    if (await values['website'].cookiesBar) {
        yield `<div id="websiteCookiesBar" class="s-popup o-snippet-invisible o-no-save" data-name="Cookies Bar" data-vcss="001" data-invisible="1">
            <div class="modal s-popup-bottom s-popup-no-backdrop o-cookies-discrete" data-show-after="500" data-display="afterDelay" data-consents-duration="999" data-focus="false" data-backdrop="false" data-keyboard="false" tabindex="-1" role="dialog">
                <div class="modal-dialog d-flex s-popup-size-full">
                    <div class="modal-content oe-structure">
                        <section class="o-colored-level o-cc o-cc1">
                            <div class="container">
                                <div class="row">
                                    <div class="col-lg-8 pt16">
                                        <p>We use cookies to provide you a better user experience.</p>
                                    </div>
                                    <div class="col-lg-4 pt16 text-right">
                                        <a href="/cookie-policy" class="o-cookies-bar-text-policy btn btn-link btn-sm">Cookie Policy</a>
                                        <a href="#" role="button" class="js-close-popup o-cookies-bar-text-button btn btn-primary btn-sm">I agree</a>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>`;
    }
    log["lastPathNode"] = "/t/html/body/t[1]";
    yield `
    
      </div>
    
        `;
    if (bool(values['website']) && await values['website'].googleAnalyticsKey && !values['editable']) {
        log["lastPathNode"] = "/t/html/body/t[1]/script[0]";
        attrs = {};
        attrs["id"] = "trackingCode";
        attrs["async"] = "1";
        attrs["src"] = format("https://www.googletagmanager.com/gtag/js?id=%s", await self._compileToStr( values['website'].googleAnalyticsKey ));
        tagName = "script";
        yield `
            <script`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        log["lastPathNode"] = "/t/html/body/t[1]/script[1]/t";
        yield `></script>
            <script>
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '`;
        content = await values['website'].googleAnalyticsKey;
        forceDisplay = null;
        if (content != null && content !== false) {
            yield String(content);
        }
        else {
        }
        yield `');
            </script>
        `;
    }
    log["lastPathNode"] = "/t/html/body/t[2]";
    yield `
    
      
        
        `;
    content = await values['website'].customCodeFooter;
    forceDisplay = null;
    if (content != null && content !== false) {
        yield String(content);
    }
    else {
    }
    yield `
    </body>
    </html>
  `;
    } catch(e) {
        _debug('Error in %s at %s: %s', 'template405', log["lastPathNode"], e);
        _debug(String(template405)); // detail code
        throw e;
    }
}