SAFE_EVAL_948689=
async function* template1034(self, values, log={}) {
    let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;
    try {
        // _debug(String(template1034)); // detail code
    log["lastPathNode"] = "/t";
    log["lastPathNode"] = "/t/t";
    yield `
        `;
    values["attributeExclusions"] = await values['product']._getAttributeExclusions(values['parentCombination'], values['parentName']);
    log["lastPathNode"] = "/t/ul";
    attrs = {};
    attrs["data-oe-model"] = "ir.ui.view";
    attrs["data-oe-id"] = "1034";
    attrs["data-oe-field"] = "arch";
    attrs["data-oe-xpath"] = "/t[1]/ul[1]";
    attrs["class"] = format("list-unstyled js-add-cart-variants %s", await self._compileToStr(values['ulClass']));
    attrs["data-attribute-exclusions"] = JSON.stringify(values['attributeExclusions']);
    tagName = "ul";
    yield `
        <ul`;
    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
    for (const [name, value] of Object.entries(attrs)) {
          if (value || typeof(value) === 'string') {
                yield ' ' + String(name) + '="' + String(value) + '"'
          }
    }
    log["lastPathNode"] = "/t/ul/t";
    yield `>
            `;
    let size_31;    let t_foreach_30 = values['product'].validProductTemplateAttributeLineIds ?? [];    if (typeof(t_foreach_30) === 'number') {      size_31 = t_foreach_30;      values["ptal_size"] = size_31;      t_foreach_30 = range(size_31);    }    else if ('_length' in t_foreach_30) {      size_31 = t_foreach_30._length;      values["ptal_size"] = size_31;    }    else if ('length' in t_foreach_30) {      size_31 = t_foreach_30.length;      values["ptal_size"] = size_31;    }    else if ('size' in t_foreach_30) {      size_31 = t_foreach_30.size;      values["ptal_size"] = size_31;    }    else {      size_31 = null;    }    let hasValue_32 = false;    if (t_foreach_30 instanceof Map) {      t_foreach_30 = t_foreach_30.entries();      hasValue_32 = true;    }    if (typeof t_foreach_30 === 'object' && !isIterable(t_foreach_30)) {      t_foreach_30 = Object.entries(t_foreach_30);      hasValue_32 = true;    }
    for (const [index, item] of enumerate(t_foreach_30)) {      values["ptal_index"] = index;      if (hasValue_32) {        [values["ptal"], values["ptal_value"]] = item;      }      else {        values["ptal"] = values["ptal_value"] = item;      }      values["ptal_first"] = values["ptal_index"] == 0;      if (size_31 != null) {        values["ptal_last"] = index + 1 === size_31;      }      values["ptal_odd"] = index % 2;      values["ptal_even"] = ! values["ptal_odd"];      values["ptal_parity"] = values["ptal_odd"] ? 'odd' : 'even';
        log["lastPathNode"] = "/t/ul/t";
        log["lastPathNode"] = "/t/ul/t/li";
        attrs = {};
        attrs["data-attribute-id"] = (await values['ptal'].attributeId).id;
        attrs["data-attribute-name"] = await (await values['ptal'].attributeId).label;
        attrs["class"] = format("variant-attribute %s", await self._compileToStr(len(await (await values['ptal'].productTemplateValueIds)._onlyActive()) == values['1'] && ! await (await (await values['ptal'].productTemplateValueIds)._onlyActive())[0].isCustom ? 'd-none' : ''));
        tagName = "li";
        yield `
                
                <li`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        log["lastPathNode"] = "/t/ul/t/li/t[0]";
        yield `>

                    
                    `;
        values["single"] = len(await (await values['ptal'].productTemplateValueIds)._onlyActive()) == values['1'];
        log["lastPathNode"] = "/t/ul/t/li/t[1]";
        yield `
                    `;
        values["singleAndCustom"] = values['single'] && await (await (await values['ptal'].productTemplateValueIds)._onlyActive())[0].isCustom;
        log["lastPathNode"] = "/t/ul/t/li/strong";
        tFieldTOptions = {};
        result = await self._getField((await values['ptal'].attributeId), "label", "ptal.attributeId.label", "strong", tFieldTOptions, compileOptions, values);
        [attrs, content, forceDisplay] = result;
        if (content != null && content !== false) {
            content = await self._compileToStr(content);
        }
        yield `
                    `;
        if (content != null && content !== false) {
            attrs["class"] = "attribute-name";
            tagName = "strong";
            yield `<strong`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            yield `>`;
            yield String(content);
            yield `</strong>`;
        }
        else {
            attrs["class"] = "attribute-name";
            tagName = "strong";
            yield `<strong`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            yield `>`;
            yield `</strong>`;
        }
        log["lastPathNode"] = "/t/ul/t/li/t[2]";
        yield `

                    `;
        if (await (await values['ptal'].attributeId).displayType == 'select') {
            log["lastPathNode"] = "/t/ul/t/li/t[2]/select";
            attrs = {};
            attrs["data-attribute-id"] = (await values['ptal'].attributeId).id;
            attrs["class"] = format("custom-select css-attribute-select js-variant-change %s %s", await self._compileToStr(await (await values['ptal'].attributeId).createVariant), await self._compileToStr(values['singleAndCustom'] ? 'd-none' : ''));
            attrs["name"] = f('ptal-%s', values['ptal'].id);
            tagName = "select";
            yield `
                        <select`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            log["lastPathNode"] = "/t/ul/t/li/t[2]/select/t";
            yield `>
                            `;
            let size_19;            let t_foreach_18 = await (await values['ptal'].productTemplateValueIds)._onlyActive() ?? [];            if (typeof(t_foreach_18) === 'number') {              size_19 = t_foreach_18;              values["ptav_size"] = size_19;              t_foreach_18 = range(size_19);            }            else if ('_length' in t_foreach_18) {              size_19 = t_foreach_18._length;              values["ptav_size"] = size_19;            }            else if ('length' in t_foreach_18) {              size_19 = t_foreach_18.length;              values["ptav_size"] = size_19;            }            else if ('size' in t_foreach_18) {              size_19 = t_foreach_18.size;              values["ptav_size"] = size_19;            }            else {              size_19 = null;            }            let hasValue_20 = false;            if (t_foreach_18 instanceof Map) {              t_foreach_18 = t_foreach_18.entries();              hasValue_20 = true;            }            if (typeof t_foreach_18 === 'object' && !isIterable(t_foreach_18)) {              t_foreach_18 = Object.entries(t_foreach_18);              hasValue_20 = true;            }
            for (const [index, item] of enumerate(t_foreach_18)) {              values["ptav_index"] = index;              if (hasValue_20) {                [values["ptav"], values["ptav_value"]] = item;              }              else {                values["ptav"] = values["ptav_value"] = item;              }              values["ptav_first"] = values["ptav_index"] == 0;              if (size_19 != null) {                values["ptav_last"] = index + 1 === size_19;              }              values["ptav_odd"] = index % 2;              values["ptav_even"] = ! values["ptav_odd"];              values["ptav_parity"] = values["ptav_odd"] ? 'odd' : 'even';
                log["lastPathNode"] = "/t/ul/t/li/t[2]/select/t";
                log["lastPathNode"] = "/t/ul/t/li/t[2]/select/t/option";
                attrs = {};
                attrs["value"] = values['ptav'].id;
                attrs["data-value-id"] = values['ptav'].id;
                attrs["data-value-label"] = await values['ptav'].label;
                attrs["data-attribute-name"] = await (await values['ptav'].attributeId).label;
                attrs["data-is-custom"] = await values['ptav'].isCustom;
                attrs["selected"] = values['combination'].includes(values['ptav']);
                attrs["data-is-single"] = values['single'];
                attrs["data-is-single-and-custom"] = values['singleAndCustom'];
                tagName = "option";
                yield `
                                <option`;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                log["lastPathNode"] = "/t/ul/t/li/t[2]/select/t/option/span";
                tFieldTOptions = {};
                result = await self._getField(values['ptav'], "label", "ptav.label", "span", tFieldTOptions, compileOptions, values);
                [attrs, content, forceDisplay] = result;
                if (content != null && content !== false) {
                    content = await self._compileToStr(content);
                }
                yield `>
                                    `;
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
                log["lastPathNode"] = "/t/ul/t/li/t[2]/select/t/option/t";
                yield `
                                    `;
                tCallValues = Object.assign({}, values);
                tCallValues['0'] = markup('');
                tCallOptions = Object.assign({}, compileOptions);                Object.assign(tCallOptions, {'callerTemplate': "sale.variants", 'lastPathNode': "/t/ul/t/li/t[2]/select/t/option/t" })
                for await (const val of (await self._compile("sale.badgeExtraPrice", tCallOptions))(self, tCallValues)) {                        yield val;                      }
                yield `
                                </option>
                            `;
            }
            yield `
                        </select>
                    `;
        }
        log["lastPathNode"] = "/t/ul/t/li/t[3]";
        yield `

                    `;
        if (await (await values['ptal'].attributeId).displayType == 'radio') {
            log["lastPathNode"] = "/t/ul/t/li/t[3]/ul";
            attrs = {};
            attrs["data-attribut-id"] = (await values['ptal'].attributeId).id;
            attrs["class"] = format("list-inline list-unstyled %s", await self._compileToStr(values['singleAndCustom'] ? 'd-none' : ''));
            tagName = "ul";
            yield `
                        <ul`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            log["lastPathNode"] = "/t/ul/t/li/t[3]/ul/t";
            yield `>
                            `;
            let size_22;            let t_foreach_21 = await (await values['ptal'].productTemplateValueIds)._onlyActive() ?? [];            if (typeof(t_foreach_21) === 'number') {              size_22 = t_foreach_21;              values["ptav_size"] = size_22;              t_foreach_21 = range(size_22);            }            else if ('_length' in t_foreach_21) {              size_22 = t_foreach_21._length;              values["ptav_size"] = size_22;            }            else if ('length' in t_foreach_21) {              size_22 = t_foreach_21.length;              values["ptav_size"] = size_22;            }            else if ('size' in t_foreach_21) {              size_22 = t_foreach_21.size;              values["ptav_size"] = size_22;            }            else {              size_22 = null;            }            let hasValue_23 = false;            if (t_foreach_21 instanceof Map) {              t_foreach_21 = t_foreach_21.entries();              hasValue_23 = true;            }            if (typeof t_foreach_21 === 'object' && !isIterable(t_foreach_21)) {              t_foreach_21 = Object.entries(t_foreach_21);              hasValue_23 = true;            }
            for (const [index, item] of enumerate(t_foreach_21)) {              values["ptav_index"] = index;              if (hasValue_23) {                [values["ptav"], values["ptav_value"]] = item;              }              else {                values["ptav"] = values["ptav_value"] = item;              }              values["ptav_first"] = values["ptav_index"] == 0;              if (size_22 != null) {                values["ptav_last"] = index + 1 === size_22;              }              values["ptav_odd"] = index % 2;              values["ptav_even"] = ! values["ptav_odd"];              values["ptav_parity"] = values["ptav_odd"] ? 'odd' : 'even';
                log["lastPathNode"] = "/t/ul/t/li/t[3]/ul/t";
                log["lastPathNode"] = "/t/ul/t/li/t[3]/ul/t/li/label/div/input";
                attrs = {};
                attrs["type"] = "radio";
                attrs["class"] = format("custom-control-input js-variant-change %s", await self._compileToStr(await (await values['ptal'].attributeId).createVariant));
                attrs["checked"] = values['combination'].includes(values['ptav']);
                attrs["name"] = f('ptal-%s', values['ptal'].id);
                attrs["value"] = values['ptav'].id;
                attrs["data-value-id"] = values['ptav'].id;
                attrs["data-value-name"] = await values['ptav'].label;
                attrs["data-attribute-name"] = await (await values['ptav'].attributeId).label;
                attrs["data-is-custom"] = await values['ptav'].isCustom;
                attrs["data-is-single"] = values['single'];
                attrs["data-is-single-and-custom"] = values['singleAndCustom'];
                tagName = "input";
                yield `
                                <li class="list-inline-item form-group js-attribute-value" style="margin: 0;">
                                    <label class="col-form-label">
                                        <div class="custom-control custom-radio">
                                            <input`;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                log["lastPathNode"] = "/t/ul/t/li/t[3]/ul/t/li/label/div/div/span";
                tFieldTOptions = {};
                result = await self._getField(await values['ptav'], "label", "await ptav.label", "span", tFieldTOptions, compileOptions, values);
                [attrs, content, forceDisplay] = result;
                if (content != null && content !== false) {
                    content = await self._compileToStr(content);
                }
                yield `/>
                                            <div class="radio-input-value custom-control-label">
                                                `;
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
                log["lastPathNode"] = "/t/ul/t/li/t[3]/ul/t/li/label/div/div/t";
                yield `
                                                `;
                tCallValues = Object.assign({}, values);
                tCallValues['0'] = markup('');
                tCallOptions = Object.assign({}, compileOptions);                Object.assign(tCallOptions, {'callerTemplate': "sale.variants", 'lastPathNode': "/t/ul/t/li/t[3]/ul/t/li/label/div/div/t" })
                for await (const val of (await self._compile("sale.badgeExtraPrice", tCallOptions))(self, tCallValues)) {                        yield val;                      }
                yield `
                                            </div>
                                        </div>
                                    </label>
                                </li>
                            `;
            }
            yield `
                        </ul>
                    `;
        }
        log["lastPathNode"] = "/t/ul/t/li/t[4]";
        yield `

                    `;
        if (await (await values['ptal'].attributeId).displayType == 'pills') {
            log["lastPathNode"] = "/t/ul/t/li/t[4]/ul";
            attrs = {};
            attrs["data-toggle"] = "buttons";
            attrs["data-attribute-id"] = (await values['ptal'].attributeId).id;
            attrs["class"] = format("btn-group-toggle list-inline list-unstyled %s", await self._compileToStr(values['singleAndCustom'] ? 'd-none' : ''));
            tagName = "ul";
            yield `
                        <ul`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            log["lastPathNode"] = "/t/ul/t/li/t[4]/ul/t";
            yield `>
                            `;
            let size_25;            let t_foreach_24 = await (await values['ptal'].productTemplateValueIds)._onlyActive() ?? [];            if (typeof(t_foreach_24) === 'number') {              size_25 = t_foreach_24;              values["ptav_size"] = size_25;              t_foreach_24 = range(size_25);            }            else if ('_length' in t_foreach_24) {              size_25 = t_foreach_24._length;              values["ptav_size"] = size_25;            }            else if ('length' in t_foreach_24) {              size_25 = t_foreach_24.length;              values["ptav_size"] = size_25;            }            else if ('size' in t_foreach_24) {              size_25 = t_foreach_24.size;              values["ptav_size"] = size_25;            }            else {              size_25 = null;            }            let hasValue_26 = false;            if (t_foreach_24 instanceof Map) {              t_foreach_24 = t_foreach_24.entries();              hasValue_26 = true;            }            if (typeof t_foreach_24 === 'object' && !isIterable(t_foreach_24)) {              t_foreach_24 = Object.entries(t_foreach_24);              hasValue_26 = true;            }
            for (const [index, item] of enumerate(t_foreach_24)) {              values["ptav_index"] = index;              if (hasValue_26) {                [values["ptav"], values["ptav_value"]] = item;              }              else {                values["ptav"] = values["ptav_value"] = item;              }              values["ptav_first"] = values["ptav_index"] == 0;              if (size_25 != null) {                values["ptav_last"] = index + 1 === size_25;              }              values["ptav_odd"] = index % 2;              values["ptav_even"] = ! values["ptav_odd"];              values["ptav_parity"] = values["ptav_odd"] ? 'odd' : 'even';
                log["lastPathNode"] = "/t/ul/t/li/t[4]/ul/t";
                log["lastPathNode"] = "/t/ul/t/li/t[4]/ul/t/li";
                attrs = {};
                attrs["class"] = format("o-variant-pills btn btn-primary mb-1 list-inline-item js-attribute-value %s", await self._compileToStr(values['combination'].includes(values['ptav']) ? 'active' : ''));
                tagName = "li";
                yield `
                                <li`;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                log["lastPathNode"] = "/t/ul/t/li/t[4]/ul/t/li/input";
                attrs = {};
                attrs["type"] = "radio";
                attrs["class"] = format("js-variant-change %s", await self._compileToStr(await (await values['ptal'].attributeId).createVariant));
                attrs["checked"] = values['combination'].includes(values['ptav']);
                attrs["name"] = f('ptal-%s', values['ptal'].id);
                attrs["value"] = values['ptav'].id;
                attrs["data-value-id"] = values['ptav'].id;
                attrs["id"] = values['ptav'].id;
                attrs["data-value-name"] = await values['ptav'].label;
                attrs["data-attribute-name"] = await (await values['ptav'].attributeId).label;
                attrs["data-is-custom"] = await values['ptav'].isCustom;
                attrs["data-is-single-and-custom"] = values['singleAndCustom'];
                attrs["autocomplete"] = values['off'];
                tagName = "input";
                yield `>
                                    <input`;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                log["lastPathNode"] = "/t/ul/t/li/t[4]/ul/t/li/div/span";
                tFieldTOptions = {};
                result = await self._getField(values['ptav'], "name", "ptav.name", "span", tFieldTOptions, compileOptions, values);
                [attrs, content, forceDisplay] = result;
                if (content != null && content !== false) {
                    content = await self._compileToStr(content);
                }
                yield `/>
                                    <div class="radio-input-value o-variant-pills-input-value">
                                        `;
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
                log["lastPathNode"] = "/t/ul/t/li/t[4]/ul/t/li/div/t";
                yield `
                                        `;
                tCallValues = Object.assign({}, values);
                tCallValues['0'] = markup('');
                tCallOptions = Object.assign({}, compileOptions);                Object.assign(tCallOptions, {'callerTemplate': "sale.variants", 'lastPathNode': "/t/ul/t/li/t[4]/ul/t/li/div/t" })
                for await (const val of (await self._compile("sale.badgeExtraPrice", tCallOptions))(self, tCallValues)) {                        yield val;                      }
                yield `
                                    </div>
                                </li>
                            `;
            }
            yield `
                        </ul>
                    `;
        }
        log["lastPathNode"] = "/t/ul/t/li/t[5]";
        yield `

                    `;
        if (await (await values['ptal'].attributeId).displayType == 'color') {
            log["lastPathNode"] = "/t/ul/t/li/t[5]/ul";
            attrs = {};
            attrs["data-attribute-id"] = (await values['ptal'].attributeId).id;
            attrs["class"] = format("list-inline  %s", await self._compileToStr(values['singleAndCustom'] ? 'd-none' : ''));
            tagName = "ul";
            yield `
                        <ul`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            log["lastPathNode"] = "/t/ul/t/li/t[5]/ul/li";
            yield `>
                            `;
            let size_28;            let t_foreach_27 = await (await values['ptal'].productTemplateValueIds)._onlyActive() ?? [];            if (typeof(t_foreach_27) === 'number') {              size_28 = t_foreach_27;              values["ptav_size"] = size_28;              t_foreach_27 = range(size_28);            }            else if ('_length' in t_foreach_27) {              size_28 = t_foreach_27._length;              values["ptav_size"] = size_28;            }            else if ('length' in t_foreach_27) {              size_28 = t_foreach_27.length;              values["ptav_size"] = size_28;            }            else if ('size' in t_foreach_27) {              size_28 = t_foreach_27.size;              values["ptav_size"] = size_28;            }            else {              size_28 = null;            }            let hasValue_29 = false;            if (t_foreach_27 instanceof Map) {              t_foreach_27 = t_foreach_27.entries();              hasValue_29 = true;            }            if (typeof t_foreach_27 === 'object' && !isIterable(t_foreach_27)) {              t_foreach_27 = Object.entries(t_foreach_27);              hasValue_29 = true;            }
            for (const [index, item] of enumerate(t_foreach_27)) {              values["ptav_index"] = index;              if (hasValue_29) {                [values["ptav"], values["ptav_value"]] = item;              }              else {                values["ptav"] = values["ptav_value"] = item;              }              values["ptav_first"] = values["ptav_index"] == 0;              if (size_28 != null) {                values["ptav_last"] = index + 1 === size_28;              }              values["ptav_odd"] = index % 2;              values["ptav_even"] = ! values["ptav_odd"];              values["ptav_parity"] = values["ptav_odd"] ? 'odd' : 'even';
                log["lastPathNode"] = "/t/ul/t/li/t[5]/ul/li";
                log["lastPathNode"] = "/t/ul/t/li/t[5]/ul/li/label";
                attrs = {};
                attrs["style"] = format("background-color:%s", await self._compileToStr(await values['ptav'].htmlColor || ! await values['ptav'].isCustom ? await (await values['ptav'].productAttributeValueId).label : ''));
                attrs["class"] = format("css-attribute-color %s %s", await self._compileToStr(values['combination'].includes(values['ptav']) ? 'active' : ''), await self._compileToStr(await values['ptav'].isCustom ? 'custom-value' : ''));
                tagName = "label";
                yield `<li class="list-inline-item mr-1">
                                <label`;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                log["lastPathNode"] = "/t/ul/t/li/t[5]/ul/li/label/input";
                attrs = {};
                attrs["type"] = "radio";
                attrs["class"] = format("js-variant-change  %s", await self._compileToStr(await (await values['ptal'].attributeId).createVariant));
                attrs["checked"] = values['combination'].includes(values['ptav']);
                attrs["name"] = f('ptal-%s', values['ptal'].id);
                attrs["value"] = values['ptav'].id;
                attrs["title"] = await values['ptav'].label;
                attrs["data-value-id"] = values['ptav'].id;
                attrs["data-value-name"] = await values['ptav'].label;
                attrs["data-attribute-name"] = await (await values['ptav'].attributeId).label;
                attrs["data-is-custom"] = await values['ptav'].isCustom;
                attrs["data-is-single"] = values['single'];
                attrs["data-is-single-and-custom"] = values['singleAndCustom'];
                tagName = "input";
                yield `>
                                    <input`;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                yield `/>
                                </label>
                            </li>`;
            }
            yield `
                        </ul>
                    `;
        }
        yield `
                </li>
            `;
    }
    yield `
        </ul>
    `;
    } catch(e) {
        _debug('Error in %s at %s: %s', 'template1034', log["lastPathNode"], e);
        // _debug(String(template1034)); // detail code
        throw e;
    }
}