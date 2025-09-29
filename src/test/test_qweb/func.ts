async function* template195(self, values, log={}) {
    //_debug('compiling template %s', 'template195');
    let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;
    try {
    log["lastPathNode"] = "/t";
    log["lastPathNode"] = "/t/t";
    yield `
    `;
    {
    async function* tCallContent(self, values, log) {
        log["lastPathNode"] = "/t/t/t[0]";
        yield `
      `;
        async function* qwebTSet__t_t_t_0_() {
            log["lastPathNode"] = "/t/t/t[0]/script/t";
            yield `
        <script type="text/javascript">
          verp.__session_info__ = `;
            content = JSON.stringify(values["sessionInfo"]);
            forceDisplay = null;
            if (content != null && content !== false) {
                yield String(content);
            }
            else {
            }
            log["lastPathNode"] = "/t/t/t[0]/t[0]";
            yield `
          verp.reloadMenus = () => fetch(\`/web/webclient/loadMenus/\x24{verp.__session_info__.cacheHashes.loadMenus}\`).then(res => res.json());
          verp.loadMenusPromise = verp.reloadMenus();
          verp.loadTemplatesPromise = fetch(\`/web/webclient/qweb/\x24{verp.__session_info__.cacheHashes.qweb}?bundle=web.assetsQweb\`).then(doc => doc.text());
          // Block to avoid leaking variables in the script scope
          {
              const { userContext,  cacheHashes } = verp.__session_info__;
              // Prefetch translations to speedup webclient. This is done in JS because link rel="prefetch"
              // is not yet supported on safari.
              fetch(\`/web/webclient/translations/\x24{cacheHashes.translations}?lang=\x24{userContext.lang}\`);
          }
        </script>
        `;
            tCallAssetsNodes = await self._getAssetNodes("web.assetsCommon", {request: values["request"], css: true, js: false, debug: values["debug"], asyncLoad: false, deferLoad: false, lazyLoad: false, media: false});                for (const [index, value] of enumerate(tCallAssetsNodes)) {                  let [tagName, attrs, content] = value;                  if (index) {                    yield ''                  }                  yield '<';                  yield tagName;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                if (! content && self._voidElements.has(tagName)) {                  yield '/>';                }                else {                  yield '>';                  if (content) {                    yield content;                  }                  yield '</';                  yield tagName;                  yield '>';                }
                }
            log["lastPathNode"] = "/t/t/t[0]/t[1]";
            yield `
        `;
            tCallAssetsNodes = await self._getAssetNodes("web.assetsBackend", {request: values["request"], css: true, js: false, debug: values["debug"], asyncLoad: false, deferLoad: false, lazyLoad: false, media: false});                for (const [index, value] of enumerate(tCallAssetsNodes)) {                  let [tagName, attrs, content] = value;                  if (index) {                    yield ''                  }                  yield '<';                  yield tagName;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                if (! content && self._voidElements.has(tagName)) {                  yield '/>';                }                else {                  yield '>';                  if (content) {                    yield content;                  }                  yield '</';                  yield tagName;                  yield '>';                }
                }
            log["lastPathNode"] = "/t/t/t[0]/t[2]";
            yield `
        `;
            tCallAssetsNodes = await self._getAssetNodes("web.assetsCommon", {request: values["request"], css: false, js: true, debug: values["debug"], asyncLoad: false, deferLoad: false, lazyLoad: false, media: false});                for (const [index, value] of enumerate(tCallAssetsNodes)) {                  let [tagName, attrs, content] = value;                  if (index) {                    yield ''                  }                  yield '<';                  yield tagName;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                if (! content && self._voidElements.has(tagName)) {                  yield '/>';                }                else {                  yield '>';                  if (content) {                    yield content;                  }                  yield '</';                  yield tagName;                  yield '>';                }
                }
            log["lastPathNode"] = "/t/t/t[0]/t[3]";
            yield `
        `;
            tCallAssetsNodes = await self._getAssetNodes("web.assetsBackend", {request: values["request"], css: false, js: true, debug: values["debug"], asyncLoad: false, deferLoad: false, lazyLoad: false, media: false});                for (const [index, value] of enumerate(tCallAssetsNodes)) {                  let [tagName, attrs, content] = value;                  if (index) {                    yield ''                  }                  yield '<';                  yield tagName;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                if (! content && self._voidElements.has(tagName)) {                  yield '/>';                }                else {                  yield '>';                  if (content) {                    yield content;                  }                  yield '</';                  yield tagName;                  yield '>';                }
                }
            log["lastPathNode"] = "/t/t/t[0]/t[4]";
            yield `
        `;
            tCallAssetsNodes = await self._getAssetNodes("web.assetsBackendProdOnly", {request: values["request"], css: false, js: true, debug: values["debug"], asyncLoad: false, deferLoad: false, lazyLoad: false, media: false});                for (const [index, value] of enumerate(tCallAssetsNodes)) {                  let [tagName, attrs, content] = value;                  if (index) {                    yield ''                  }                  yield '<';                  yield tagName;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                if (! content && self._voidElements.has(tagName)) {                  yield '/>';                }                else {                  yield '>';                  if (content) {                    yield content;                  }                  yield '</';                  yield tagName;                  yield '>';                }
                }
            yield `
        
        
      `;
        }
        let qwebTSet__t_t_t_0__value = '';
        for await (const val of qwebTSet__t_t_t_0_()) qwebTSet__t_t_t_0__value += val;
        values["headWeb"] = markup(qwebTSet__t_t_t_0__value);;
        log["lastPathNode"] = "/t/t/t[1]";
        yield `
      `;
        values["head"] = values["headWeb"] + (values["head"] || '');
        log["lastPathNode"] = "/t/t/t[2]";
        yield `
      `;
        values["bodyClassname"] = 'o-web-client';
        yield `
    `;
    }
    tCallValues = Object.assign({},  values);
    let res = '';
    for await (const str of tCallContent(self, tCallValues, log)) 
        res = res + str;
    tCallValues['0'] = markup(res)
    }
    tCallOptions = Object.assign({}, compileOptions);    Object.assign(tCallOptions, {'callerTemplate': "195", 'lastPathNode': "/t/t" })
    for await (const val of (await self._compile("web.layout", tCallOptions))(self, tCallValues)) {            yield val;          }
    yield `
  `;
    } catch(e) {
        _debug(e);
        _debug(String(template195));
        throw e;
    }
}