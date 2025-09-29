async function* template404(self, values, log={}) {
    let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;
    try {
        // _debug(String(template404.name)); // detail code
    log["lastPathNode"] = "/t";
    log["lastPathNode"] = "/t/t[0]";
    yield `
    `;
    values["cleanUrl"] = await values['submenu'].cleanUrl();
    log["lastPathNode"] = "/t/t[1]";
    yield `
    `;
    values["showDropdown"] = (await values['submenu'].isMegaMenu && await values['submenu'].isVisible) || await (await values['submenu'].childId).filtered((menu) => menu.isVisible);
    log["lastPathNode"] = "/t/li[0]";
    yield `
    `;
    if (await values['submenu'].isVisible && ! (bool(await values['submenu'].childId) || await values['submenu'].isMegaMenu)) {
        attrs = {};
        attrs["role"] = "presentation";
        attrs["data-oe-model"] = "ir.ui.view";
        attrs["data-oe-id"] = "404";
        attrs["data-oe-field"] = "arch";
        attrs["data-oe-xpath"] = "/t[1]/li[1]";
        attrs["class"] = format("%s", await self._compileToStr(values['itemClass'] || ''));
        tagName = "li";
        yield `<li`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        log["lastPathNode"] = "/t/li[0]/a";
        attrs = {};
        attrs["role"] = "menuitem";
        attrs["href"] = values['cleanUrl'];
        attrs["class"] = format("%s %s", await self._compileToStr(values['linkClass'] || ''), await self._compileToStr(values['cleanUrl'] && values['unslugUrl'](values['request'].uri.pathname) == values['unslugUrl'](values['cleanUrl']) ? 'active' : ''));
        attrs["target"] = await values['submenu'].newWindow ? '_blank' : null;
        tagName = "a";
        yield `>
        <a`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        log["lastPathNode"] = "/t/li[0]/a/span";
        tFieldTOptions = {};
        result = await self._getField(values['submenu'], "label", "submenu.label", "span", tFieldTOptions, compileOptions, values);
        [attrs, content, forceDisplay] = result;
        if (content != null && bool(content) !== false) {
            content = await self._compileToStr(content);
        }
        yield `>
            `;
        if (content != null && bool(content) !== false) {
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
        yield `
        </a>
    </li>`;
    }
    else {
        log["lastPathNode"] = "/t/li[1]";
        if (values['showDropdown']) {
            attrs = {};
            attrs["data-oe-model"] = "ir.ui.view";
            attrs["data-oe-id"] = "404";
            attrs["data-oe-field"] = "arch";
            attrs["data-oe-xpath"] = "/t[1]/li[2]";
            attrs["class"] = format("%s dropdown %s %s", 
              await self._compileToStr(values['itemClass'] || ''), 
              await self._compileToStr((values['cleanUrl'] && values['cleanUrl'] !== '/' && await (await values['submenu'].childId).some(async child => await child.url && values['request'].uri.pathname === await child.url) || (values['cleanUrl'] && values['request'].uri.pathname == values['cleanUrl'])) && 'active'), 
              await self._compileToStr(await values['submenu'].isMegaMenu && 'position-static')
            );
            tagName = "li";
            yield `<li`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            log["lastPathNode"] = "/t/li[1]/a";
            attrs = {};
            attrs["data-toggle"] = "dropdown";
            attrs["href"] = "#";
            attrs["class"] = format("%s dropdown-toggle %s", await self._compileToStr(values['linkClass'] || ''), await self._compileToStr(await values['submenu'].isMegaMenu && 'o-mega-menu-toggle'));
            tagName = "a";
            yield `>
        <a`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            log["lastPathNode"] = "/t/li[1]/a/span";
            tFieldTOptions = {};
            result = await self._getField(await values['submenu'], "label", "await submenu.label", "span", tFieldTOptions, compileOptions, values);
            [attrs, content, forceDisplay] = result;
            if (content != null && bool(content) !== false) {
                content = await self._compileToStr(content);
            }
            yield `>
            `;
            if (content != null && bool(content) !== false) {
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
            log["lastPathNode"] = "/t/li[1]/div";
            yield `
        </a>
        `;
            if (await values['submenu'].isMegaMenu) {
                tFieldTOptions = {};
                result = await self._getField(values['submenu'], "megaMenuContent", "submenu.megaMenuContent", "div", tFieldTOptions, compileOptions, values);
                [attrs, content, forceDisplay] = result;
                if (content != null && bool(content) !== false) {
                    content = await self._compileToStr(content);
                }
                if (content != null && bool(content) !== false) {
                    attrs["data-name"] = "Mega Menu";
                    attrs["class"] = format("dropdown-menu o-mega-menu %s", await self._compileToStr(await values['submenu'].megaMenuClasses));
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
                    attrs["data-name"] = "Mega Menu";
                    attrs["class"] = format("dropdown-menu o-mega-menu %s", await self._compileToStr(await values['submenu'].megaMenuClasses));
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
            }
            else {
                log["lastPathNode"] = "/t/li[1]/ul";
                log["lastPathNode"] = "/t/li[1]/ul/t";
                yield `<ul class="dropdown-menu" role="menu">
            `;
                let size_25;                let t_foreach_24 = await values['submenu'].childId ?? [];                if (typeof(t_foreach_24) === 'number') {                  size_25 = t_foreach_24;                  values["submenu_size"] = size_25;                  t_foreach_24 = range(size_25);                }                else if ('_length' in t_foreach_24) {                  size_25 = t_foreach_24._length;                  values["submenu_size"] = size_25;                }                else if ('length' in t_foreach_24) {                  size_25 = t_foreach_24.length;                  values["submenu_size"] = size_25;                }                else if ('size' in t_foreach_24) {                  size_25 = t_foreach_24.size;                  values["submenu_size"] = size_25;                }                else {                  size_25 = null;                }                let hasValue_26 = false;                if (t_foreach_24 instanceof Map || t_foreach_24 instanceof MapKey) {                  t_foreach_24 = t_foreach_24.entries();                  hasValue_26 = true;                }                if (typeof t_foreach_24 === 'object' && !isIterable(t_foreach_24)) {                  t_foreach_24 = Object.entries(t_foreach_24);                  hasValue_26 = true;                }
                for (const [index, item] of enumerate(t_foreach_24)) {                  values["submenu_index"] = index;                  if (hasValue_26) {                    [values["submenu"], values["submenu_value"]] = item;                  }                  else {                    values["submenu"] = item;                    values["submenu_value"] = item;                  }                  values["submenu_first"] = values["submenu_index"] == 0;                  if (size_25 != null) {                    values["submenu_last"] = index + 1 === size_25;                  }                  values["submenu_odd"] = index % 2;                  values["submenu_even"] = ! values["submenu_odd"];                  values["submenu_parity"] = values["submenu_odd"] ? 'odd' : 'even';
                    log["lastPathNode"] = "/t/li[1]/ul/t";
                    log["lastPathNode"] = "/t/li[1]/ul/t/t";
                    yield `
                `;
                    {
                    async function* tCallContent(self, values, log) {
                        log["lastPathNode"] = "/t/li[1]/ul/t/t/t[0]";
                        yield `
                    `;
                        values["itemClass"] = null;
                        log["lastPathNode"] = "/t/li[1]/ul/t/t/t[1]";
                        yield `
                    `;
                        values["linkClass"] = "dropdown-item";
                        yield `
                `;
                    }
                    tCallValues = Object.assign({},  values);
                    let res = '';
                    for await (const str of tCallContent(self, tCallValues, log)) 
                        res = res + str;
                    tCallValues['0'] = markup(res)
                    }
                    tCallOptions = Object.assign({}, compileOptions);                    Object.assign(tCallOptions, {'callerTemplate': "website.submenu", 'lastPathNode': "/t/li[1]/ul/t/t" })
                    for await (const val of (await self._compile("website.submenu", tCallOptions))(self, tCallValues)) {                            yield val;                          }
                    yield `
            `;
                }
                yield `
        </ul>`;
            }
            log["lastPathNode"] = "/t/li[1]/ul";
            yield `
        
    </li>`;
        }
    }
    log["lastPathNode"] = "/t/li[1]";
    yield `
    
`;
    } catch(e) {
        _debug('Error in %s at %s: %s', 'template404', log["lastPathNode"], e);
        _debug(String(template404)); // detail code
        throw e;
    }
}