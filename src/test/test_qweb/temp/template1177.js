async function* template1177(self, values, log={}) {
    let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;
    try {
        _debug(String(template1177.name)); // detail code
    log["lastPathNode"] = "/t";
    log["lastPathNode"] = "/t/div";
    yield `
        `;
    if (! bool(values['websiteSaleOrder']) || !bool(await values['websiteSaleOrder'].websiteOrderLine)) {
        yield `<div class="js-cart-lines alert alert-info">
          Your cart is empty!
        </div>`;
    }
    log["lastPathNode"] = "/t/table[0]";
    yield `
        `;
    if (bool(values['websiteSaleOrder']) && bool(await values['websiteSaleOrder'].websiteOrderLine)) {
        log["lastPathNode"] = "/t/table[0]/thead/tr/th[2]/t[0]";
        yield `<table class="mb16 table table-striped table-sm js-cart-lines" id="cartProducts">
            <thead>
                <tr>
                    <th class="td-img">Product</th>
                    <th></th>
                    <th class="text-center td-qty">
                        `;
        values["showQty"] = await values['isViewActive']('website_sale.productQuantity');
        log["lastPathNode"] = "/t/table[0]/thead/tr/th[2]/t[1]";
        yield `
                        `;
        if (values['showQty']) {
            yield `
                            Quantity
                        `;
        }
        log["lastPathNode"] = "/t/table[0]/tbody/t";
        yield `
                    </th>
                    <th class="text-center td-price">Price</th>
                    <th class="text-center td-action"></th>
                </tr>
            </thead>
            <tbody>
                `;
        let size_1;        let t_foreach_0 = await values['websiteSaleOrder'].websiteOrderLine ?? [];        if (typeof(t_foreach_0) === 'number') {          size_1 = t_foreach_0;          values["line_size"] = size_1;          t_foreach_0 = range(size_1);        }        else if ('_length' in t_foreach_0) {          size_1 = t_foreach_0._length;          values["line_size"] = size_1;        }        else if ('length' in t_foreach_0) {          size_1 = t_foreach_0.length;          values["line_size"] = size_1;        }        else if ('size' in t_foreach_0) {          size_1 = t_foreach_0.size;          values["line_size"] = size_1;        }        else {          size_1 = null;        }        let hasValue_2 = false;        if (t_foreach_0 instanceof Map || t_foreach_0 instanceof MapKey) {          t_foreach_0 = t_foreach_0.entries();          hasValue_2 = true;        }        if (typeof t_foreach_0 === 'object' && !isIterable(t_foreach_0)) {          t_foreach_0 = Object.entries(t_foreach_0);          hasValue_2 = true;        }
        for (const [index, item] of enumerate(t_foreach_0)) {          values["line_index"] = index;          if (hasValue_2) {            [values["line"], values["line_value"]] = item;          }          else {            values["line"] = item;            values["line_value"] = item;          }          values["line_first"] = values["line_index"] == 0;          if (size_1 != null) {            values["line_last"] = index + 1 === size_1;          }          values["line_odd"] = index % 2;          values["line_even"] = ! values["line_odd"];          values["line_parity"] = values["line_odd"] ? 'odd' : 'even';
            log["lastPathNode"] = "/t/table[0]/tbody/t";
            log["lastPathNode"] = "/t/table[0]/tbody/t/tr";
            attrs = {};
            attrs["class"] = bool(await values['line'].linkedLineId) ? 'optional-product info' : null;
            tagName = "tr";
            yield `
                    <tr`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[0]";
            yield `>
                        `;
            if (! bool(await (await values['line'].productId).productTemplateId)) {
                yield `<td colspan="2" class="td-img"></td>`;
            }
            log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[1]";
            yield `
                        `;
            if (bool(await (await values['line'].productId).productTemplateId)) {
                log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[1]/span[0]";
                yield `<td align="center" class="td-img">
                            `;
                if (await values['line']._isNotSellableLine() && await (await values['line'].productId).image128) {
                    log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[1]/span[0]/img";
                    attrs = {};
                    attrs["class"] = "img o-image-64-max rounded";
                    attrs["src"] = await values['imageDataUri'](await (await values['line'].productId).image128);
                    attrs["alt"] = await values['line'].nameShort;
                    tagName = "img";
                    yield `<span>
                                <img`;
                    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                    for (const [name, value] of Object.entries(attrs)) {
                          if (value || typeof(value) === 'string') {
                                yield ' ' + String(name) + '="' + String(value) + '"'
                          }
                    }
                    yield `/>
                            </span>`;
                }
                else {
                    log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[1]/span[1]";
                    tFieldTOptions = {'widget': 'image', 'qwebImgResponsive': false, 'class': 'rounded o-image-64-max'}
                    result = await self._getField((await values['line'].productId), "image128", "line.productId.image128", "span", tFieldTOptions, compileOptions, values);
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
                yield `
                            
                        </td>`;
            }
            log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[2]";
            yield `
                        `;
            if (bool(await (await values['line'].productId).productTemplateId)) {
                log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[2]/div/t";
                yield `<td class="td-product-name">
                            <div>
                                `;
                {
                async function* tCallContent(self, values, log) {
                    log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[2]/div/t/strong";
                    tFieldTOptions = {};
                    result = await self._getField(values['line'], "nameShort", "line.nameShort", "strong", tFieldTOptions, compileOptions, values);
                    [attrs, content, forceDisplay] = result;
                    if (content != null && content !== false) {
                        content = await self._compileToStr(content);
                    }
                    yield `
                                    `;
                    if (content != null && content !== false) {
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
                    yield `
                                `;
                }
                tCallValues = Object.assign({},  values);
                let res = '';
                for await (const str of tCallContent(self, tCallValues, log)) 
                    res = res + str;
                tCallValues['0'] = markup(res)
                }
                tCallOptions = Object.assign({}, compileOptions);                Object.assign(tCallOptions, {'callerTemplate': "1177", 'lastPathNode': "/t/table[0]/tbody/t/tr/td[2]/div/t" })
                for await (const val of (await self._compile("website_sale.cartLineProductLink", tCallOptions))(self, tCallValues)) {                        yield val;                      }
                log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[2]/t";
                yield `
                            </div>
                            `;
                {
                async function* tCallContent(self, values, log) {
                    log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[2]/t/t";
                    yield `
                                `;
                    values["divClass"] = 'd-none d-md-block';
                    yield `
                            `;
                }
                tCallValues = Object.assign({},  values);
                let res = '';
                for await (const str of tCallContent(self, tCallValues, log)) 
                    res = res + str;
                tCallValues['0'] = markup(res)
                }
                tCallOptions = Object.assign({}, compileOptions);                Object.assign(tCallOptions, {'callerTemplate': "1177", 'lastPathNode': "/t/table[0]/tbody/t/tr/td[2]/t" })
                for await (const val of (await self._compile("website_sale.cartLineDescriptionFollowingLines", tCallOptions))(self, tCallValues)) {                        yield val;                      }
                yield `
                        </td>`;
            }
            log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[3]/div/t[0]";
            yield `
                        <td class="text-center td-qty">
                            <div class="css-quantity input-group mx-auto justify-content-center">
                                `;
            if (! await values['line']._isNotSellableLine()) {
                log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[3]/div/t[0]/t[0]";
                yield `
                                    `;
                if (values['showQty']) {
                    log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[3]/div/t[0]/t[0]/div[0]/a";
                    attrs = {};
                    attrs["class"] = "btn btn-link js-add-cart-json d-none d-md-inline-block";
                    attrs["aria-label"] = "Remove one";
                    attrs["title"] = "Remove one";
                    attrs["href"] = "#";
                    tagName = "a";
                    yield `
                                        <div class="input-group-prepend">
                                            <a`;
                    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                    for (const [name, value] of Object.entries(attrs)) {
                          if (value || typeof(value) === 'string') {
                                yield ' ' + String(name) + '="' + String(value) + '"'
                          }
                    }
                    log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[3]/div/t[0]/t[0]/input";
                    attrs = {};
                    attrs["type"] = "text";
                    attrs["class"] = "js-quantity form-control quantity";
                    attrs["data-line-id"] = values['line'].id;
                    attrs["data-product-id"] = (await values['line'].productId).id;
                    attrs["value"] = parseInt(await values['line'].productUomQty) == await values['line'].productUomQty && parseInt(await values['line'].productUomQty) || await values['line'].productUomQty;
                    tagName = "input";
                    yield `>
                                                <i class="fa fa-minus"></i>
                                            </a>
                                        </div>
                                        <input`;
                    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                    for (const [name, value] of Object.entries(attrs)) {
                          if (value || typeof(value) === 'string') {
                                yield ' ' + String(name) + '="' + String(value) + '"'
                          }
                    }
                    log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[3]/div/t[0]/t[0]/div[1]/a";
                    attrs = {};
                    attrs["class"] = "btn btn-link float-left js-add-cart-json d-none d-md-inline-block";
                    attrs["aria-label"] = "Add one";
                    attrs["title"] = "Add one";
                    attrs["href"] = "#";
                    tagName = "a";
                    yield `/>
                                        <div class="input-group-append">
                                            <a`;
                    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                    for (const [name, value] of Object.entries(attrs)) {
                          if (value || typeof(value) === 'string') {
                                yield ' ' + String(name) + '="' + String(value) + '"'
                          }
                    }
                    yield `>
                                                <i class="fa fa-plus"></i>
                                            </a>
                                        </div>
                                    `;
                }
                else {
                    log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[3]/div/t[0]/t[1]";
                    log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[3]/div/t[0]/t[1]/input";
                    attrs = {};
                    attrs["type"] = "hidden";
                    attrs["class"] = "js-quantity form-control quantity";
                    attrs["data-line-id"] = values['line'].id;
                    attrs["data-product-id"] = (await values['line'].productId).id;
                    attrs["value"] = parseInt(await values['line'].productUomQty) == await values['line'].productUomQty && parseInt(await values['line'].productUomQty) || await values['line'].productUomQty;
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
                log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[3]/div/t[0]/t[1]";
                yield `
                                    
                                `;
            }
            else {
                log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[3]/div/t[1]";
                log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[3]/div/t[1]/span";
                yield `
                                    `;
                content = parseInt(await values['line'].productUomQty);
                forceDisplay = null;
                if (content != null && content !== false) {
                    attrs = {};
                    attrs["class"] = "text-muted w-100";
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
                    attrs = {};
                    attrs["class"] = "text-muted w-100";
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
                log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[3]/div/t[1]/input";
                attrs = {};
                attrs["type"] = "hidden";
                attrs["class"] = "js-quantity form-control quantity";
                attrs["data-line-id"] = values['line'].id;
                attrs["data-product-id"] = (await values['line'].productId).id;
                attrs["value"] = await values['line'].productUomQty;
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
            log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[3]/div/t[1]";
            log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[4]/t[0]";
            yield `
                                
                            </div>
                        </td>
                        <td class="text-center td-price" name="price">
                            `;
            values["combination"] = (await (await values['line'].productId).productTemplateAttributeValueIds).add(await values['line'].productNoVariantAttributeValueIds);
            log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[4]/t[1]";
            yield `
                            `;
            values["combinationInfo"] = await (await (await values['line'].productId).productTemplateId)._getCombinationInfo({'combination': values['combination'], 'pricelist': await values['websiteSaleOrder'].pricelistId, 'addQty': await values['line'].productUomQty});
            log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[4]/t[2]";
            yield `
                            `;
            values["currency"] = await values['websiteSaleOrder'].currencyId;
            log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[4]/t[3]";
            yield `
                            `;
            values["listPriceConverted"] = await (await values['website'].currencyId)._convert(values['combinationInfo']['listPrice'], values['currency'], await values['websiteSaleOrder'].companyId, values['date']);
            log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[4]/t[4]";
            yield `
                            `;
            if (await self.userHasGroups("account.groupShowLineSubtotalsTaxExcluded")) {
                if ((await (await values['websiteSaleOrder'].pricelistId).discountPolicy == 'withoutDiscount' && await values['currency'].compareAmounts(values['listPriceConverted'], await values['line'].priceReduceTaxexcl) == values['1']) || await values['currency'].compareAmounts(await values['line'].priceUnit, await values['line'].priceReduce) == values['1']) {
                    log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[4]/t[4]/del";
                    yield `
                                `;
                    tOutTOptions = {'widget': 'monetary', 'displayCurrency': values['currency']}
                    content = values['listPriceConverted'];
                    result = await self._getWidget(content, "listPriceConverted", "del", tOutTOptions, compileOptions, values);
                    [attrs, content, forceDisplay] = result;
                    if (content != null && content !== false) {
                        attrs["style"] = "white-space: nowrap;";
                        attrs["class"] = format("%s", await self._compileToStr('text-danger mr8'));
                        tagName = "del";
                        yield `<del`;
                        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                        for (const [name, value] of Object.entries(attrs)) {
                              if (value || typeof(value) === 'string') {
                                    yield ' ' + String(name) + '="' + String(value) + '"'
                              }
                        }
                        yield `>`;
                        yield String(content);
                        yield `</del>`;
                    }
                    else {
                        attrs["style"] = "white-space: nowrap;";
                        attrs["class"] = format("%s", await self._compileToStr('text-danger mr8'));
                        tagName = "del";
                        yield `<del`;
                        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                        for (const [name, value] of Object.entries(attrs)) {
                              if (value || typeof(value) === 'string') {
                                    yield ' ' + String(name) + '="' + String(value) + '"'
                              }
                        }
                        yield `>`;
                        yield `</del>`;
                    }
                    yield `
                            `;
                }
            }
            log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[4]/span[0]";
            yield `
                            `;
            if (await self.userHasGroups("account.groupShowLineSubtotalsTaxExcluded")) {
                tFieldTOptions = {'widget': 'monetary', 'displayCurrency': values['currency']}
                result = await self._getField(values['line'], "priceReduceTaxexcl", "line.priceReduceTaxexcl", "span", tFieldTOptions, compileOptions, values);
                [attrs, content, forceDisplay] = result;
                if (content != null && content !== false) {
                    content = await self._compileToStr(content);
                }
                if (content != null && content !== false) {
                    attrs["style"] = "white-space: nowrap;";
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
                    attrs["style"] = "white-space: nowrap;";
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
            log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[4]/t[5]";
            yield `
                            `;
            if (await self.userHasGroups("account.groupShowLineSubtotalsTaxIncluded")) {
                if ((await (await values['websiteSaleOrder'].pricelistId).discountPolicy == 'withoutDiscount' && await values['currency'].compareAmounts(values['listPriceConverted'], values['line'].priceReduceTaxinc) == values['1']) || await values['currency'].compareAmounts(await values['line'].priceUnit, await values['line'].priceReduce) == values['1']) {
                    log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[4]/t[5]/del";
                    yield `
                                `;
                    tOutTOptions = {'widget': 'monetary', 'displayCurrency': values['currency']}
                    content = values['listPriceConverted'];
                    result = await self._getWidget(content, "listPriceConverted", "del", tOutTOptions, compileOptions, values);
                    [attrs, content, forceDisplay] = result;
                    if (content != null && content !== false) {
                        attrs["style"] = "white-space: nowrap;";
                        attrs["class"] = format("%s", await self._compileToStr('text-danger mr8'));
                        tagName = "del";
                        yield `<del`;
                        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                        for (const [name, value] of Object.entries(attrs)) {
                              if (value || typeof(value) === 'string') {
                                    yield ' ' + String(name) + '="' + String(value) + '"'
                              }
                        }
                        yield `>`;
                        yield String(content);
                        yield `</del>`;
                    }
                    else {
                        attrs["style"] = "white-space: nowrap;";
                        attrs["class"] = format("%s", await self._compileToStr('text-danger mr8'));
                        tagName = "del";
                        yield `<del`;
                        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                        for (const [name, value] of Object.entries(attrs)) {
                              if (value || typeof(value) === 'string') {
                                    yield ' ' + String(name) + '="' + String(value) + '"'
                              }
                        }
                        yield `>`;
                        yield `</del>`;
                    }
                    yield `
                            `;
                }
            }
            log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[4]/span[1]";
            yield `
                            `;
            if (await self.userHasGroups("account.groupShowLineSubtotalsTaxIncluded")) {
                tFieldTOptions = {'widget': 'monetary', 'displayCurrency': values['currency']}
                result = await self._getField(values['line'], "priceReduceTaxinc", "line.priceReduceTaxinc", "span", tFieldTOptions, compileOptions, values);
                [attrs, content, forceDisplay] = result;
                if (content != null && content !== false) {
                    content = await self._compileToStr(content);
                }
                if (content != null && content !== false) {
                    attrs["style"] = "white-space: nowrap;";
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
                    attrs["style"] = "white-space: nowrap;";
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
            log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[4]/small";
            yield `
                            `;
            if (await self.userHasGroups("website_sale.groupShowUomPrice")) {
                if (! await values['line']._isNotSellableLine() && await (await values['line'].productId).baseUnitPrice) {
                    log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[4]/small/t";
                    yield `<small class="cart-product-base-unit-price d-block text-muted">
                                `;
                    {
                    async function* tCallContent(self, values, log) {
                        log["lastPathNode"] = "/t/table[0]/tbody/t/tr/td[4]/small/t/t";
                        values["product"] = await values['line'].productId;
                    }
                    tCallValues = Object.assign({},  values);
                    let res = '';
                    for await (const str of tCallContent(self, tCallValues, log)) 
                        res = res + str;
                    tCallValues['0'] = markup(res)
                    }
                    tCallOptions = Object.assign({}, compileOptions);                    Object.assign(tCallOptions, {'callerTemplate': "1177", 'lastPathNode': "/t/table[0]/tbody/t/tr/td[4]/small/t" })
                    for await (const val of (await self._compile("website_sale.baseUnitPrice", tCallOptions))(self, tCallValues)) {                            yield val;                          }
                    yield `
                            </small>`;
                }
            }
            yield `
                        </td>
                        <td class="td-action">
                            <a href="#" aria-label="Remove from cart" title="Remove from cart" class="js-delete-product no-decoration"> <small><i class="fa fa-trash-o"></i></small></a>
                        </td>
                    </tr>
                `;
        }
        yield `
            </tbody>
        </table>`;
    }
    log["lastPathNode"] = "/t/h5";
    yield `
            `;
    if (bool(values['suggestedProducts'])) {
        yield `<h5 class="text-muted js-cart-lines">Suggested Accessories:</h5>`;
    }
    log["lastPathNode"] = "/t/table[1]";
    yield `
            `;
    if (bool(values['suggestedProducts'])) {
        log["lastPathNode"] = "/t/table[1]/tbody/tr";
        yield `<table id="suggestedProducts" class="js-cart-lines table table-striped table-sm">
                <tbody>
                    `;
        let size_4;        let t_foreach_3 = values['suggestedProducts'] ?? [];        if (typeof(t_foreach_3) === 'number') {          size_4 = t_foreach_3;          values["product_size"] = size_4;          t_foreach_3 = range(size_4);        }        else if ('_length' in t_foreach_3) {          size_4 = t_foreach_3._length;          values["product_size"] = size_4;        }        else if ('length' in t_foreach_3) {          size_4 = t_foreach_3.length;          values["product_size"] = size_4;        }        else if ('size' in t_foreach_3) {          size_4 = t_foreach_3.size;          values["product_size"] = size_4;        }        else {          size_4 = null;        }        let hasValue_5 = false;        if (t_foreach_3 instanceof Map || t_foreach_3 instanceof MapKey) {          t_foreach_3 = t_foreach_3.entries();          hasValue_5 = true;        }        if (typeof t_foreach_3 === 'object' && !isIterable(t_foreach_3)) {          t_foreach_3 = Object.entries(t_foreach_3);          hasValue_5 = true;        }
        for (const [index, item] of enumerate(t_foreach_3)) {          values["product_index"] = index;          if (hasValue_5) {            [values["product"], values["product_value"]] = item;          }          else {            values["product"] = item;            values["product_value"] = item;          }          values["product_first"] = values["product_index"] == 0;          if (size_4 != null) {            values["product_last"] = index + 1 === size_4;          }          values["product_odd"] = index % 2;          values["product_even"] = ! values["product_odd"];          values["product_parity"] = values["product_odd"] ? 'odd' : 'even';
            log["lastPathNode"] = "/t/table[1]/tbody/tr";
            attrs = {};
            attrs["data-publish"] = bool(await values['product'].websitePublished) && 'on' || 'off';
            tagName = "tr";
            yield `<tr`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            log["lastPathNode"] = "/t/table[1]/tbody/tr/t";
            yield `>
                        `;
            values["combinationInfo"] = await values['product']._getCombinationInfoVariant(1, await values['websiteSaleOrder'].pricelistId);
            log["lastPathNode"] = "/t/table[1]/tbody/tr/td[0]/a";
            attrs = {};
            attrs["href"] = await values['product'].websiteUrl;
            tagName = "a";
            yield `
                        <td class="td-img text-center">
                            <a`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            log["lastPathNode"] = "/t/table[1]/tbody/tr/td[0]/a/span";
            tFieldTOptions = {'widget': 'image', 'qwebImgResponsive': false, 'class': 'rounded o-image-64-max'}
            result = await self._getField(values['product'], "image128", "product.image128", "span", tFieldTOptions, compileOptions, values);
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
            log["lastPathNode"] = "/t/table[1]/tbody/tr/td[1]/div[0]/a";
            attrs = {};
            attrs["href"] = await values['product'].websiteUrl;
            tagName = "a";
            yield `
                            </a>
                        </td>
                        <td class="td-product-name">
                            <div>
                                <a`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            log["lastPathNode"] = "/t/table[1]/tbody/tr/td[1]/div[0]/a/strong";
            yield `>
                                    `;
            content = values['combinationInfo']['displayName'];
            forceDisplay = null;
            if (content != null && content !== false) {
                yield `<strong>`;
                yield String(content);
                yield `</strong>`;
            }
            else {
                yield `<strong>`;
                yield `</strong>`;
            }
            log["lastPathNode"] = "/t/table[1]/tbody/tr/td[1]/div[1]";
            tFieldTOptions = {};
            result = await self._getField(values['product'], "descriptionSale", "product.descriptionSale", "div", tFieldTOptions, compileOptions, values);
            [attrs, content, forceDisplay] = result;
            if (content != null && content !== false) {
                content = await self._compileToStr(content);
            }
            yield `
                                </a>
                            </div>
                            `;
            if (content != null && content !== false) {
                attrs["class"] = "text-muted d-none d-md-block";
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
                attrs["class"] = "text-muted d-none d-md-block";
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
            log["lastPathNode"] = "/t/table[1]/tbody/tr/td[2]/del";
            yield `
                        </td>
                        <td class="td-price">
                            `;
            tOutTOptions = {'widget': 'monetary', 'displayCurrency': await values['website'].currencyId}
            content = values['combinationInfo']['listPrice'];
            result = await self._getWidget(content, "combinationInfo['listPrice']", "del", tOutTOptions, compileOptions, values);
            [attrs, content, forceDisplay] = result;
            if (content != null && content !== false) {
                attrs["style"] = "white-space: nowrap;";
                attrs["class"] = format("text-danger mr8 %s", await self._compileToStr(values['combinationInfo']['hasDiscountedPrice'] ? '' : 'd-none'));
                tagName = "del";
                yield `<del`;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                yield `>`;
                yield String(content);
                yield `</del>`;
            }
            else {
                attrs["style"] = "white-space: nowrap;";
                attrs["class"] = format("text-danger mr8 %s", await self._compileToStr(values['combinationInfo']['hasDiscountedPrice'] ? '' : 'd-none'));
                tagName = "del";
                yield `<del`;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                yield `>`;
                yield `</del>`;
            }
            log["lastPathNode"] = "/t/table[1]/tbody/tr/td[2]/span";
            yield `
                            `;
            tOutTOptions = {'widget': 'monetary','displayCurrency': await values['website'].currencyId}
            content = values['combinationInfo']['price'];
            result = await self._getWidget(content, "combinationInfo['price']", "span", tOutTOptions, compileOptions, values);
            [attrs, content, forceDisplay] = result;
            if (content != null && content !== false) {
                attrs["style"] = "white-space: nowrap;";
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
                attrs["style"] = "white-space: nowrap;";
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
            log["lastPathNode"] = "/t/table[1]/tbody/tr/td[3]/input";
            attrs = {};
            attrs["class"] = "js-quantity";
            attrs["name"] = "productId";
            attrs["type"] = "hidden";
            attrs["data-product-id"] = values['product'].id;
            tagName = "input";
            yield `
                        </td>
                        <td class="w-25 text-center">
                            <input`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            yield `/>
                            <a role="button" class="btn btn-link js-add-suggested-products">
                                <strong>Add to Cart</strong>
                            </a>
                        </td>
                    </tr>`;
        }
        yield `
                </tbody>
            </table>`;
    }
    yield `
        
    
    `;
    } catch(e) {
        _debug('Error in %s at %s: %s', 'template1177', log["lastPathNode"], e);
        _debug(String(template1177)); // detail code
        throw e;
    }
  }