async function* template204(self, values, log={}) { // web.externalLayoutStriped
    let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;
    try {
        _debug(String(template204.name)); // detail code
    log["lastPathNode"] = "/t";
    log["lastPathNode"] = "/t/div[0]";
    attrs = {};
    attrs["class"] = format("o-company-%s-layout header", await self._compileToStr(values['company'].id));
    attrs["style"] = values['reportHeaderStyle'];
    tagName = "div";
    yield `
        <div`;
    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
    for (const [name, value] of Object.entries(attrs)) {
          if (value || typeof(value) === 'string') {
                yield ' ' + String(name) + '="' + String(value) + '"'
          }
    }
    log["lastPathNode"] = "/t/div[0]/div/div[0]/h3";
    tFieldTOptions = {};
    result = await self._getField(values['company'], "reportHeader", "company.reportHeader", "h3", tFieldTOptions, compileOptions, values);
    [attrs, content, forceDisplay] = result;
    if (content != null && content !== false) {
        content = await self._compileToStr(content);
    }
    yield `>
            <div class="o-background-header">
            <div class="float-right">
                `;
    if (content != null && content !== false) {
        attrs["class"] = "mt0 text-right";
        tagName = "h3";
        yield `<h3`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        yield `>`;
        yield String(content);
        yield `</h3>`;
    }
    else {
        attrs["class"] = "mt0 text-right";
        tagName = "h3";
        yield `<h3`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        yield `>`;
        yield `</h3>`;
    }
    log["lastPathNode"] = "/t/div[0]/div/img";
    yield `
            </div>
            `;
    if (await values['company'].logo) {
        attrs = {};
        attrs["class"] = "float-left";
        attrs["alt"] = "Logo";
        attrs["src"] = await values['imageDataUri'](await values['company'].logo);
        tagName = "img";
        yield `<img`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        yield `/>`;
    }
    log["lastPathNode"] = "/t/div[0]/div/div[1]/span";
    yield `
            <div class="float-left companyAddress">
                `;
    if (await values['company'].companyDetails) {
        tFieldTOptions = {};
        result = await self._getField(values['company'], "companyDetails", "company.companyDetails", "span", tFieldTOptions, compileOptions, values);
        [attrs, content, forceDisplay] = result;
        if (content != null && content !== false) {
            content = await self._compileToStr(content);
        }
        if (content != null && content !== false) {
            tagName = "span";
            yield `<span`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            yield `>`;
            yield String(content);
            yield `</span>`;
        }
        else {
            tagName = "span";
            yield `<span`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            yield `>`;
            yield `</span>`;
        }
    }
    log["lastPathNode"] = "/t/div[1]";
    attrs = {};
    attrs["class"] = format("o-company-%s-layout article o-report-layout-striped %s", await self._compileToStr(values['company'].id), await self._compileToStr( ['Geometric', 'Custom'].includes(await values['company'].layoutBackground) ?  'o-layout-background' : '' ));
    attrs["style"] = format("background-image: url(%s);", await self._compileToStr( format('data:image/png;base64,%s', bool(await values['company'].layoutBackgroundImage) && await values['company'].layoutBackground === 'Custom' ? values['decode2'](await values['company'].layoutBackgroundImage) : '/base/static/img/bg_background_template.jpg') ));
    attrs["data-oe-model"] = values['o'] && values['o']._name;
    attrs["data-oe-id"] = values['o'] && values['o'].id;
    attrs["data-oe-lang"] = values['o'] && values['o'].env.context['lang'];
    tagName = "div";
    yield `
            </div>
            <div class="clearfix mb8"></div>
            </div>
        </div>

        <div`;
    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
    for (const [name, value] of Object.entries(attrs)) {
          if (value || typeof(value) === 'string') {
                yield ' ' + String(name) + '="' + String(value) + '"'
          }
    }
    log["lastPathNode"] = "/t/div[1]/t[0]";
    yield `>
            `;
    tCallValues = Object.assign({}, values);
    tCallValues['0'] = markup('');
    tCallOptions = Object.assign({}, compileOptions);    Object.assign(tCallOptions, {'callerTemplate': "web.externalLayoutStriped", 'lastPathNode': "/t/div[1]/t[0]" })
    for await (const val of (await self._compile("web.addressLayout", tCallOptions))(self, tCallValues)) {            yield val;          }
    log["lastPathNode"] = "/t/div[1]/t[1]";
    yield `
            `;
    for (const str of Array.from(values['0'] || [])) yield str;
    log["lastPathNode"] = "/t/div[2]";
    attrs = {};
    attrs["class"] = format("o-company-%s-layout footer o-background-footer", await self._compileToStr(values['company'].id));
    tagName = "div";
    yield `
        </div>

        <div`;
    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
    for (const [name, value] of Object.entries(attrs)) {
          if (value || typeof(value) === 'string') {
                yield ' ' + String(name) + '="' + String(value) + '"'
          }
    }
    log["lastPathNode"] = "/t/div[2]/div/ul/div";
    tFieldTOptions = {};
    result = await self._getField(values['company'], "reportFooter", "company.reportFooter", "div", tFieldTOptions, compileOptions, values);
    [attrs, content, forceDisplay] = result;
    if (content != null && content !== false) {
        content = await self._compileToStr(content);
    }
    yield `>
            <div class="text-center">
                <ul class="list-inline">
                    `;
    if (content != null && content !== false) {
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
    log["lastPathNode"] = "/t/div[2]/div/div";
    yield `
                </ul>
                `;
    if (values['reportType'] === 'pdf') {
        yield `<div class="text-muted">
                    Page:
                    <span class="page"></span>
                    of
                    <span class="topage"></span>
                </div>`;
    }
    yield `
            </div>
        </div>
    `;
    } catch(e) {
        // _debug('Error in %s at %s: %s', 'template204', log["lastPathNode"], e);
        _debug(String(template204)); // detail code
        throw e;
    }
}