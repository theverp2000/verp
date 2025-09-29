async function* template1142(self, values, log={}) {
    let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;
    try {
        _debug(String(template1142)); // detail code
    log["lastPathNode"] = "/t";
    log["lastPathNode"] = "/t/t[0]";
    yield `
        `;
    values["productHref"] = await values['keep'](await values['product'].websiteUrl, {'page': values['pager']['page']['num']>1 ? values['pager']['page']['num'] : null});
    log["lastPathNode"] = "/t/t[1]";
    yield `

        `;
    values["combinationInfo"] = await values['product']._getCombinationInfo({'onlyTemplate': true, 'addQty': values['addQty'] || 1, 'pricelist': values['pricelist']});
    log["lastPathNode"] = "/t/form";
    attrs = {};
    attrs["action"] = "/shop/cart/update";
    attrs["method"] = "post";
    attrs["class"] = "card oe-product-cart";
    attrs["itemscope"] = "itemscope";
    attrs["itemtype"] = "http://schema.org/Product";
    attrs["data-oe-model"] = "ir.ui.view";
    attrs["data-oe-id"] = "1142";
    attrs["data-oe-field"] = "arch";
    attrs["data-oe-xpath"] = "/t[1]/form[1]";
    attrs["data-publish"] = values['product'].websitePublished && 'on' || 'off';
    tagName = "form";
    yield `

        <form`;
    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
    for (const [name, value] of Object.entries(attrs)) {
          if (value || typeof(value) === 'string') {
                yield ' ' + String(name) + '="' + String(value) + '"'
          }
    }
    log["lastPathNode"] = "/t/form/a";
    attrs = {};
    attrs["class"] = "o-product-link css-editable-mode-hidden";
    attrs["href"] = values['productHref'];
    tagName = "a";
    yield `>
            <a`;
    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
    for (const [name, value] of Object.entries(attrs)) {
          if (value || typeof(value) === 'string') {
                yield ' ' + String(name) + '="' + String(value) + '"'
          }
    }
    log["lastPathNode"] = "/t/form/div[0]/input";
    attrs = {};
    attrs["type"] = "hidden";
    attrs["name"] = "csrfToken";
    attrs["value"] = await values['request'].csrfToken();
    tagName = "input";
    yield `></a>
            <div class="card-body p-1 oe-product-image">
                <input`;
    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
    for (const [name, value] of Object.entries(attrs)) {
          if (value || typeof(value) === 'string') {
                yield ' ' + String(name) + '="' + String(value) + '"'
          }
    }
    log["lastPathNode"] = "/t/form/div[0]/a";
    attrs = {};
    attrs["class"] = "d-block h-100";
    attrs["itemprop"] = "url";
    attrs["href"] = values['productHref'];
    tagName = "a";
    yield `/>
                <a`;
    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
    for (const [name, value] of Object.entries(attrs)) {
          if (value || typeof(value) === 'string') {
                yield ' ' + String(name) + '="' + String(value) + '"'
          }
    }
    log["lastPathNode"] = "/t/form/div[0]/a/t";
    yield `>
                    `;
    values["imageHolder"] = await values['product']._getImageHolder();
    log["lastPathNode"] = "/t/form/div[0]/a/span";
    tFieldTOptions = {'widget': 'image', 'previewImage': values['productImageBig'] ? 'image1024' : 'image256', 'itemprop': 'image'}
    result = await self._getField(values['imageHolder'], "image1920", "imageHolder.image1920", "span", tFieldTOptions, compileOptions, values);
    [attrs, content, forceDisplay] = result;
    if (content != null && content !== false) {
        content = await self._compileToStr(content);
    }
    yield `
                    `;
    if (content != null && content !== false) {
        attrs["class"] = "d-flex h-100 justify-content-center align-items-center";
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
        attrs["class"] = "d-flex h-100 justify-content-center align-items-center";
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
    log["lastPathNode"] = "/t/form/div[1]/div[0]/h6/a[0]";
    tFieldTOptions = {};
    result = await self._getField(values['product'], "label", "product.label", "a", tFieldTOptions, compileOptions, values);
    [attrs, content, forceDisplay] = result;
    if (content != null && content !== false) {
        content = await self._compileToStr(content);
    }
    yield `
                </a>
            </div>
            <div class="card-body p-0 o-wsale-product-information">
                <div class="p-2 o-wsale-product-information-text">
                    <h6 class="o-wsale-products-item-title mb-1">
                        `;
    if (content != null && content !== false) {
        attrs["class"] = "text-primary text-decoration-none";
        attrs["itemprop"] = "label";
        attrs["href"] = values['productHref'];
        attrs["content"] = values['product'].label;
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
        attrs["class"] = "text-primary text-decoration-none";
        attrs["itemprop"] = "label";
        attrs["href"] = values['productHref'];
        attrs["content"] = values['product'].label;
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
    log["lastPathNode"] = "/t/form/div[1]/div[0]/h6/a[1]";
    yield `
                        `;
    if (!await values['product'].websitePublished) {
        attrs = {};
        attrs["role"] = "button";
        attrs["class"] = "btn btn-sm btn-danger";
        attrs["title"] = "This product is unpublished.";
        attrs["href"] = values['productHref'];
        tagName = "a";
        yield `<a`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        yield `>Unpublished</a>`;
    }
    log["lastPathNode"] = "/t/form/div[1]/div[0]/div/span[0]";
    yield `
                    </h6>
                    <div class="product-price mb-1" itemprop="offers" itemscope="itemscope" itemtype="http://schema.org/Offer">
                        `;
    if (values['combinationInfo']['price']) {
        tOutTOptions = {'widget': 'monetary', 'displayCurrency': await values['website'].currencyId}
        content = values['combinationInfo']['price'];
        result = await self._getWidget(content, "combinationInfo['price']", "span", tOutTOptions, compileOptions, values);
        [attrs, content, forceDisplay] = result;
        if (content != null && content !== false) {
            attrs["class"] = "h5";
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
            attrs["class"] = "h5";
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
    log["lastPathNode"] = "/t/form/div[1]/div[0]/div/del";
    yield `
                        `;
    tOutTOptions = {'widget': 'monetary', 'displayCurrency': await values['website'].currencyId}
    content = values['combinationInfo']['listPrice'];
    result = await self._getWidget(content, "combinationInfo['listPrice']", "del", tOutTOptions, compileOptions, values);
    [attrs, content, forceDisplay] = result;
    if (content != null && content !== false) {
        attrs["style"] = "white-space: nowrap;";
        attrs["class"] = format("text-danger ml-1 h6 %s", await self._compileToStr(values['combinationInfo']['hasDiscountedPrice'] ? '' : 'd-none'));
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
        attrs["class"] = format("text-danger ml-1 h6 %s", await self._compileToStr(values['combinationInfo']['hasDiscountedPrice'] ? '' : 'd-none'));
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
    log["lastPathNode"] = "/t/form/div[1]/div[0]/div/span[1]";
    yield `
                        `;
    content = values['combinationInfo']['price'];
    forceDisplay = null;
    if (content != null && content !== false) {
        attrs = {};
        attrs["itemprop"] = "price";
        attrs["style"] = "display:none;";
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
        attrs["itemprop"] = "price";
        attrs["style"] = "display:none;";
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
    log["lastPathNode"] = "/t/form/div[1]/div[0]/div/span[2]";
    yield `
                        `;
    content = await (await values['website'].currencyId).label;
    forceDisplay = null;
    if (content != null && content !== false) {
        attrs = {};
        attrs["itemprop"] = "priceCurrency";
        attrs["style"] = "display:none;";
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
        attrs["itemprop"] = "priceCurrency";
        attrs["style"] = "display:none;";
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
    log["lastPathNode"] = "/t/form/t[0]";
    yield `
                    </div>
                </div>
                <div class="o-wsale-product-btn pl-2"></div>
            </div>
            `;
    values["bgcolor"] = values['tdProduct']['ribbon']['bgcolor'] || '';
    log["lastPathNode"] = "/t/form/t[1]";
    yield `
            `;
    values["textColor"] = values['tdProduct']['ribbon']['textColor'];
    log["lastPathNode"] = "/t/form/t[2]";
    yield `
            `;
    values["bgclass"] = values['tdProduct']['ribbon']['htmlClass'];
    log["lastPathNode"] = "/t/form/span";
    yield `
            `;
    content = values['tdProduct']['ribbon']['html'] || '';
    forceDisplay = null;
    if (content != null && content !== false) {
        attrs = {};
        attrs["class"] = format("o-ribbon %s", await self._compileToStr(values['bgclass']));
        attrs["style"] = format("%s%s", await self._compileToStr(values['textColor'] && format('color: %s; ', values['textColor'])), await self._compileToStr(values['bgcolor'] && 'background-color:' + values['bgcolor']));
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
        attrs["class"] = format("o-ribbon %s", await self._compileToStr(values['bgclass']));
        attrs["style"] = format("%s%s", await self._compileToStr(values['textColor'] && format('color: %s; ', values['textColor'])), await self._compileToStr(values['bgcolor'] && 'background-color:' + values['bgcolor']));
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
        </form>
    `;
    } catch(e) {
        _debug('Error in %s at %s: %s', 'template1142', log["lastPathNode"], e);
        // _debug(String(template1142)); // detail code
        throw e;
    }
}