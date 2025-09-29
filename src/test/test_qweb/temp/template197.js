async function* template197(self, values, log={}) {
    let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;
    try {
        // _debug(String(template197.name)); // detail code
    log["lastPathNode"] = "/t";
    log["lastPathNode"] = "/t/html";
    attrs = {};
    attrs["lang"] = values['lang'] && values['lang'].replace('_', '-');
    attrs["data-report-margin-top"] = values['dataReportMarginTop'];
    attrs["data-report-header-spacing"] = values['dataReportHeaderSpacing'];
    attrs["data-report-dpi"] = values['dataReportDpi'];
    attrs["data-report-landscape"] = values['dataReportLandscape'];
    attrs["web-base-url"] = values['webBaseUrl'];
    tagName = "html";
    yield `<!DOCTYPE html>
        <html`;
    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
    for (const [name, value] of Object.entries(attrs)) {
          if (value || typeof(value) === 'string') {
                yield ' ' + String(name) + '="' + String(value) + '"'
          }
    }
    log["lastPathNode"] = "/t/html/head/title/t";
    yield `>
            <head>
                <meta charset="utf-8"/>
                <meta name="viewport" content="initial-scale=1"/>
                <title>`;
    content = values['title'] || 'Verp Report';
    forceDisplay = null;
    if (content != null && bool(content) !== false) {
        yield String(content);
    }
    else {
    }
    log["lastPathNode"] = "/t/html/head/t[0]";
    yield `</title>
                `;
    tCallAssetsNodes = await self._getAssetNodes("web.reportAssetsCommon", {request: values["request"], css: true, js: false, debug: values["debug"], asyncLoad: false, deferLoad: false, lazyLoad: false, media: false});        for (const [index, value] of enumerate(tCallAssetsNodes)) {          let [tagName, attrs, content] = value;          if (index) {            yield ''          }          yield '<';          yield tagName;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        if (! content && self._voidElements.has(tagName)) {          yield '/>';        }        else {          yield '>';          if (content) {            yield content;          }          yield '</';          yield tagName;          yield '>';        }
        }
    log["lastPathNode"] = "/t/html/head/t[1]";
    yield `
                
                
                <script type="text/javascript">
                    window.verp = {};
                    window.verp.__session_info__ = {isReport: true};
                </script>
                `;
    tCallAssetsNodes = await self._getAssetNodes("web.assetsCommon", {request: values["request"], css: false, js: true, debug: values["debug"], asyncLoad: false, deferLoad: false, lazyLoad: false, media: false});        for (const [index, value] of enumerate(tCallAssetsNodes)) {          let [tagName, attrs, content] = value;          if (index) {            yield ''          }          yield '<';          yield tagName;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        if (! content && self._voidElements.has(tagName)) {          yield '/>';        }        else {          yield '>';          if (content) {            yield content;          }          yield '</';          yield tagName;          yield '>';        }
        }
    log["lastPathNode"] = "/t/html/head/t[2]";
    yield `
                `;
    tCallAssetsNodes = await self._getAssetNodes("web.reportAssetsCommon", {request: values["request"], css: false, js: true, debug: values["debug"], asyncLoad: false, deferLoad: false, lazyLoad: false, media: false});        for (const [index, value] of enumerate(tCallAssetsNodes)) {          let [tagName, attrs, content] = value;          if (index) {            yield ''          }          yield '<';          yield tagName;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        if (! content && self._voidElements.has(tagName)) {          yield '/>';        }        else {          yield '>';          if (content) {            yield content;          }          yield '</';          yield tagName;          yield '>';        }
        }
    log["lastPathNode"] = "/t/html/body";
    attrs = {};
    attrs["class"] = ! values['fullWidth'] ? 'container' : 'container-fluid';
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
    log["lastPathNode"] = "/t/html/body/div/main/t";
    yield `>
                <div id="wrapwrap">
                    <main>
                        `;
    if (typeof values['0'] === 'string') yield values['0']; else { for (const str of Array.from(val || [])) str };
    yield `
                    </main>
                </div>
            </body>
        </html>
    `;
    } catch(e) {
        _debug('Error in %s at %s: %s', 'template197', log["lastPathNode"], e);
        _debug(String(template197)); // detail code
        throw e;
    }
}