async function* template1161(self, values, log={}) {
    let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;
    try {
        // _debug(String(template1161.name)); // detail code
    log["lastPathNode"] = "/t";
    log["lastPathNode"] = "/t/t[0]";
    yield `

        `;
    values["combination"] = await values['product']._getFirstPossibleCombination();
    log["lastPathNode"] = "/t/t[1]";
    yield `
        `;
    values["combinationInfo"] = await values['product']._getCombinationInfo({'combination': values['combination'], 'addQty': values['addQty'] || 1, 'pricelist': values['pricelist']});
    log["lastPathNode"] = "/t/t[2]";
    yield `
        `;
    values["productVariant"] = values['product'].env.items('product.product').browse(values['combinationInfo']['productId']);
    log["lastPathNode"] = "/t/t[3]";
    yield `

        `;
    {
    async function* tCallContent(self, values, log) {
        log["lastPathNode"] = "/t/t[3]/t";
        yield `
            `;
        values["additionalTitle"] = await values['product'].label;
        log["lastPathNode"] = "/t/t[3]/div/section";
        attrs = {};
        attrs["id"] = "productDetail";
        attrs["class"] = format("container py-4 oe-website-sale %s", await self._compileToStr(values['combinationInfo']['hasDiscountedPrice'] ? 'discount' : ''));
        attrs["data-view-track"] = values['viewTrack'] && '1' || '0';
        attrs["data-product-tracking-info"] = escape(JSON.stringify(await values['env'].items('product.template').getGoogleAnalyticsData(values['combinationInfo'])));
        tagName = "section";
        yield `
            <div itemscope="itemscope" itemtype="http://schema.org/Product" id="wrap" class="ecom-zoomable zoomverp-next" data-oe-model="ir.ui.view" data-oe-id="1161" data-oe-field="arch" data-oe-xpath="/t[1]/t[4]/div[1]">
                <div class="oe-structure oe-empty oe-structure-not-nearest" id="oeStructureWebsiteSaleProduct1" data-editor-message="DROP BUILDING BLOCKS HERE TO MAKE THEM AVAILABLE ACROSS ALL PRODUCTS"></div>
                <section`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        log["lastPathNode"] = "/t/t[3]/div/section/div[0]/div[0]/ol/li[0]/a";
        attrs = {};
        attrs["href"] = await values['keep']('', {'category':0});
        tagName = "a";
        yield `>
                    <div class="row">
                        <div class="col-lg-6">
                            <ol class="breadcrumb mb-2">
                                <li class="breadcrumb-item o-not-editable">
                                    <a`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        log["lastPathNode"] = "/t/t[3]/div/section/div[0]/div[0]/ol/li[1]";
        yield `>All Products</a>
                                </li>
                                `;
        if (bool(values['category'])) {
            log["lastPathNode"] = "/t/t[3]/div/section/div[0]/div[0]/ol/li[1]/a";
            tFieldTOptions = {};
            result = await self._getField(values['category'], "label", "category.label", "a", tFieldTOptions, compileOptions, values);
            [attrs, content, forceDisplay] = result;
            if (content != null && bool(content) !== false) {
                content = await self._compileToStr(content);
            }
            yield `<li class="breadcrumb-item">
                                    `;
            if (content != null && bool(content) !== false) {
                attrs["href"] = await values['keep'](format('/shop/category/%s', await values['category'].slug(), {'category':0}));
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
                attrs["href"] = await values['keep'](format('/shop/category/%s', await values['category'].slug(), {'category':0}));
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
        log["lastPathNode"] = "/t/t[3]/div/section/div[0]/div[0]/ol/li[2]/span";
        tFieldTOptions = {};
        result = await self._getField(values['product'], "label", "product.label", "span", tFieldTOptions, compileOptions, values);
        [attrs, content, forceDisplay] = result;
        if (content != null && bool(content) !== false) {
            content = await self._compileToStr(content);
        }
        yield `
                                <li class="breadcrumb-item active">
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
        log["lastPathNode"] = "/t/t[3]/div/section/div[0]/div[1]/div/t[0]";
        yield `
                                </li>
                            </ol>
                        </div>
                        <div class="col-lg-6">
                            <div class="d-sm-flex justify-content-between mb-2">
                                `;
        {
        async function* tCallContent(self, values, log) {
            log["lastPathNode"] = "/t/t[3]/div/section/div[0]/div[1]/div/t[0]/t[0]";
            yield `
                                    `;
            values["search"] = false;
            log["lastPathNode"] = "/t/t[3]/div/section/div[0]/div[1]/div/t[0]/t[1]";
            yield `
                                    `;
            values["_classes"] = 'mb-2 mr-sm-2';
            yield `
                                `;
        }
        tCallValues = Object.assign({},  values);
        let res = '';
        for await (const str of tCallContent(self, tCallValues, log)) 
            res = res + str;
        tCallValues['0'] = markup(res)
        }
        tCallOptions = Object.assign({}, compileOptions);        Object.assign(tCallOptions, {'callerTemplate': "1161", 'lastPathNode': "/t/t[3]/div/section/div[0]/div[1]/div/t[0]" })
        for await (const val of (await self._compile("website_sale.search", tCallOptions))(self, tCallValues)) {                yield val;              }
        log["lastPathNode"] = "/t/t[3]/div/section/div[0]/div[1]/div/t[1]";
        yield `
                                `;
        {
        async function* tCallContent(self, values, log) {
            log["lastPathNode"] = "/t/t[3]/div/section/div[0]/div[1]/div/t[1]/t";
            yield `
                                    `;
            values["_classes"] = "ml-1 mb-2 float-right";
            yield `
                                `;
        }
        tCallValues = Object.assign({},  values);
        let res = '';
        for await (const str of tCallContent(self, tCallValues, log)) 
            res = res + str;
        tCallValues['0'] = markup(res)
        }
        tCallOptions = Object.assign({}, compileOptions);        Object.assign(tCallOptions, {'callerTemplate': "1161", 'lastPathNode': "/t/t[3]/div/section/div[0]/div[1]/div/t[1]" })
        for await (const val of (await self._compile("website_sale.pricelistList", tCallOptions))(self, tCallValues)) {                yield val;              }
        log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[0]/t";
        yield `
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mt-md-4">
                            `;
        tCallValues = Object.assign({}, values);
        tCallValues['0'] = markup('');
        tCallOptions = Object.assign({}, compileOptions);        Object.assign(tCallOptions, {'callerTemplate': "1161", 'lastPathNode': "/t/t[3]/div/section/div[1]/div[0]/t" })
        for await (const val of (await self._compile("website_sale.shopProductCarousel", tCallOptions))(self, tCallValues)) {                yield val;              }
        log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/t[0]";
        yield `
                        </div>
                        <div class="col-md-6 mt-md-4" id="productDetails">
                            `;
        values["baseUrl"] = await values['product'].getBaseUrl();
        log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/h1";
        tFieldTOptions = {};
        result = await self._getField(values['product'], "label", "product.label", "h1", tFieldTOptions, compileOptions, values);
        [attrs, content, forceDisplay] = result;
        if (content != null && bool(content) !== false) {
            content = await self._compileToStr(content);
        }
        yield `
                            `;
        if (content != null && bool(content) !== false) {
            attrs["itemprop"] = "label";
            tagName = "h1";
            yield `<h1`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            yield `>`;
            yield String(content);
            yield `</h1>`;
        }
        else {
            attrs["itemprop"] = "label";
            tagName = "h1";
            yield `<h1`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            yield `>`;
            yield `Product Name</h1>`;
        }
        log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/span[0]";
        yield `
                            `;
        content = values['baseUrl'] + await values['product'].websiteUrl;
        forceDisplay = null;
        if (content != null && bool(content) !== false) {
            attrs = {};
            attrs["itemprop"] = "url";
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
            attrs["itemprop"] = "url";
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
        log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/span[1]";
        yield `
                            `;
        content = values['baseUrl'] + await values['website'].imageUrl(values['product'], 'image1920');
        forceDisplay = null;
        if (content != null && bool(content) !== false) {
            attrs = {};
            attrs["itemprop"] = "image";
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
            attrs["itemprop"] = "image";
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
        log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/t[1]";
        yield `
                            `;
        if (await values['isViewActive']('website_sale.productComment')) {
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/t[1]/a/t";
            yield `
                                <a href="#oProductPageReviews" class="o-product-page-reviews-link text-decoration-none">
                                    `;
            {
            async function* tCallContent(self, values, log) {
                log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/t[1]/a/t/t[0]";
                yield `
                                        `;
                values["ratingAvg"] = values['product'].ratingAvg;
                log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/t[1]/a/t/t[1]";
                yield `
                                        `;
                async function* qwebTSet__t_t_3__div_section_div_1__div_1__t_1__a_t_t_1_() {
                    yield `%s reviews`;
                }
                let qwebTSet__t_t_3__div_section_div_1__div_1__t_1__a_t_t_1__value = '';
                for await (const val of qwebTSet__t_t_3__div_section_div_1__div_1__t_1__a_t_t_1_()) qwebTSet__t_t_3__div_section_div_1__div_1__t_1__a_t_t_1__value += val;
                values["transTextPlural"] = markup(qwebTSet__t_t_3__div_section_div_1__div_1__t_1__a_t_t_1__value);;
                log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/t[1]/a/t/t[2]";
                yield `
                                        `;
                async function* qwebTSet__t_t_3__div_section_div_1__div_1__t_1__a_t_t_2_() {
                    yield `%s review`;
                }
                let qwebTSet__t_t_3__div_section_div_1__div_1__t_1__a_t_t_2__value = '';
                for await (const val of qwebTSet__t_t_3__div_section_div_1__div_1__t_1__a_t_t_2_()) qwebTSet__t_t_3__div_section_div_1__div_1__t_1__a_t_t_2__value += val;
                values["transTextSingular"] = markup(qwebTSet__t_t_3__div_section_div_1__div_1__t_1__a_t_t_2__value);;
                log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/t[1]/a/t/t[3]";
                yield `
                                        `;
                values["ratingCount"] = (await values['product'].ratingCount > 1 ? values['transTextPlural'] : values['transTextSingular']) % await values['product'].ratingCount;
                yield `
                                    `;
            }
            tCallValues = Object.assign({},  values);
            let res = '';
            for await (const str of tCallContent(self, tCallValues, log)) 
                res = res + str;
            tCallValues['0'] = markup(res)
            }
            tCallOptions = Object.assign({}, compileOptions);            Object.assign(tCallOptions, {'callerTemplate': "1161", 'lastPathNode': "/t/t[3]/div/section/div[1]/div[1]/t[1]/a/t" })
            for await (const val of (await self._compile("portal_rating.ratingWidgetStarsStatic", tCallOptions))(self, tCallValues)) {                    yield val;                  }
            yield `
                                </a>
                            `;
        }
        log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/p[0]";
        tFieldTOptions = {};
        result = await self._getField(values['product'], "descriptionSale", "product.descriptionSale", "p", tFieldTOptions, compileOptions, values);
        [attrs, content, forceDisplay] = result;
        if (content != null && bool(content) !== false) {
            content = await self._compileToStr(content);
        }
        yield `
                            `;
        if (content != null && bool(content) !== false) {
            attrs["class"] = "text-muted my-2";
            attrs["placeholder"] = "A short description that will also appear on documents.";
            tagName = "p";
            yield `<p`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            yield `>`;
            yield String(content);
            yield `</p>`;
        }
        else {
            attrs["class"] = "text-muted my-2";
            attrs["placeholder"] = "A short description that will also appear on documents.";
            tagName = "p";
            yield `<p`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            yield `>`;
            yield `</p>`;
        }
        log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/form";
        yield `
                            `;
        if (await values['product']._isAddToCartPossible()) {
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/form/input";
            attrs = {};
            attrs["type"] = "hidden";
            attrs["name"] = "csrfToken";
            attrs["value"] = await values['request'].csrfToken();
            tagName = "input";
            yield `<form action="/shop/cart/update" method="POST">
                                <input`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/form/div/div[0]/t";
            yield `/>
                                <div class="js-product js-main-product mb-3">
                                    <div>
                                        `;
            tCallValues = Object.assign({}, values);
            tCallValues['0'] = markup('');
            tCallOptions = Object.assign({}, compileOptions);            Object.assign(tCallOptions, {'callerTemplate': "1161", 'lastPathNode': "/t/t[3]/div/section/div[1]/div[1]/form/div/div[0]/t" })
            for await (const val of (await self._compile("website_sale.productPrice", tCallOptions))(self, tCallValues)) {                    yield val;                  }
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/form/div/div[0]/small";
            yield `
                                        `;
            if (await self.userHasGroups("website_sale.groupShowUomPrice")) {
                log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/form/div/div[0]/small/t";
                yield `<small class="ml-1 text-muted o-base-unit-price-wrapper d-none">
                                            `;
                tCallValues = Object.assign({}, values);
                tCallValues['0'] = markup('');
                tCallOptions = Object.assign({}, compileOptions);                Object.assign(tCallOptions, {'callerTemplate': "1161", 'lastPathNode': "/t/t[3]/div/section/div[1]/div[1]/form/div/div[0]/small/t" })
                for await (const val of (await self._compile("website_sale.baseUnitPrice", tCallOptions))(self, tCallValues)) {                        yield val;                      }
                yield `
                                        </small>`;
            }
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/form/div/t";
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/form/div/t/input[0]";
            attrs = {};
            attrs["type"] = "hidden";
            attrs["class"] = "productId";
            attrs["name"] = "productId";
            attrs["value"] = values['productVariant'].id;
            tagName = "input";
            yield `
                                    </div>
                                    
                                        <input`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/form/div/t/input[1]";
            attrs = {};
            attrs["type"] = "hidden";
            attrs["class"] = "productTemplateId";
            attrs["name"] = "productTemplateId";
            attrs["value"] = values['product'].id;
            tagName = "input";
            yield `/>
                                        <input`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/form/div/t/input[2]";
            yield `/>
                                        `;
            if (bool((await values['product'].publicCategIds).ids)) {
                attrs = {};
                attrs["type"] = "hidden";
                attrs["class"] = "product-category-id";
                attrs["name"] = "productCategoryId";
                attrs["value"] = (await values['product'].publicCategIds).ids[0];
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
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/form/div/t/t[0]";
            yield `
                                        `;
            if (values['combination']) {
                {
                async function* tCallContent(self, values, log) {
                    log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/form/div/t/t[0]/t[0]";
                    yield `
                                            `;
                    values["ulClass"] = "flex-column";
                    log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/form/div/t/t[0]/t[1]";
                    yield `
                                            `;
                    values["parentCombination"] = null;
                    yield `
                                        `;
                }
                tCallValues = Object.assign({},  values);
                let res = '';
                for await (const str of tCallContent(self, tCallValues, log)) 
                    res = res + str;
                tCallValues['0'] = markup(res)
                }
                tCallOptions = Object.assign({}, compileOptions);                Object.assign(tCallOptions, {'callerTemplate': "1161", 'lastPathNode': "/t/t[3]/div/section/div[1]/div[1]/form/div/t/t[0]" })
                for await (const val of (await self._compile("sale.variants", tCallOptions))(self, tCallValues)) {                        yield val;                      }
            }
            else {
                log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/form/div/t/t[1]";
                log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/form/div/t/t[1]/ul";
                attrs = {};
                attrs["class"] = "d-none js-add-cart-variants";
                attrs["data-attribute-exclusions"] = {'exclusions': []};
                tagName = "ul";
                yield `
                                            <ul`;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                yield `></ul>
                                        `;
            }
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/form/div/t/t[1]";
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/form/div/p";
            yield `
                                        
                                    
                                    `;
            if (true) {
                yield `<p class="css-not-available-msg alert alert-warning">This combination does not exist.</p>`;
            }
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/form/div/div[1]/div[0]/a";
            attrs = {};
            attrs["class"] = "btn btn-primary js-add-cart-json";
            attrs["aria-label"] = "Remove one";
            attrs["title"] = "Remove one";
            attrs["href"] = "#";
            tagName = "a";
            yield `
        <div class="css-quantity input-group d-inline-flex mr-2 my-1 align-middle" contenteditable="false" data-oe-id="1168" data-oe-xpath="/data/xpath/div" data-oe-model="ir.ui.view" data-oe-field="arch">
            <div class="input-group-prepend">
                <a`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/form/div/div[1]/input";
            attrs = {};
            attrs["type"] = "text";
            attrs["class"] = "form-control quantity";
            attrs["data-min"] = "1";
            attrs["name"] = "addQty";
            attrs["value"] = values['addQty'] || 1;
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
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/form/div/div[1]/div[1]/a";
            attrs = {};
            attrs["class"] = "btn btn-primary float-left js-add-cart-json";
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
        </div>
      
                                    <div id="addToCartWrap" class="d-inline">
                                        <a data-animation-selector=".o-wsale-product-images" role="button" id="addToCart" class="btn btn-primary btn-lg js-check-product a-submit my-1 mr-1 px-5 font-weight-bold flex-grow-1" href="#"><i class="fa fa-shopping-cart mr-2"></i>ADD TO CART</a>
                                        <div id="productOptionBlock" class="d-inline-block align-middle"></div>
                                    </div>
                                </div>
                            </form>`;
        }
        else {
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/p[1]";
            if (! await values['product'].active) {
                yield `<p class="alert alert-warning">This product is no longer available.</p>`;
            }
            else {
                log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/p[2]";
                yield `<p class="alert alert-warning">This product has no valid combination.</p>`;
            }
        }
        log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/p[1]";
        log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/p[2]";
        log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/div[0]/t";
        yield `
                            
                            
                            <div id="productAttributesSimple">
                                `;
        values["singleValueAttributes"] = await (await values['product'].validProductTemplateAttributeLineIds)._prepareSingleValueForDisplay();
        log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/div[0]/table";
        attrs = {};
        attrs["class"] = format("table table-sm text-muted %s", await self._compileToStr(bool(values['singleValueAttributes']) ? '' : 'd-none'));
        tagName = "table";
        yield `
                                <table`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/div[0]/table/t";
        yield `>
                                    `;
        let size_4;        let t_foreach_3 = values['singleValueAttributes'] ?? [];        if (typeof(t_foreach_3) === 'number') {          size_4 = t_foreach_3;          values["attribute_size"] = size_4;          t_foreach_3 = range(size_4);        }        else if ('_length' in t_foreach_3) {          size_4 = t_foreach_3._length;          values["attribute_size"] = size_4;        }        else if ('length' in t_foreach_3) {          size_4 = t_foreach_3.length;          values["attribute_size"] = size_4;        }        else if ('size' in t_foreach_3) {          size_4 = t_foreach_3.size;          values["attribute_size"] = size_4;        }        else {          size_4 = null;        }        let hasValue_5 = false;        if (t_foreach_3 instanceof Map || t_foreach_3 instanceof MapKey) {          t_foreach_3 = t_foreach_3.entries();          hasValue_5 = true;        }        if (typeof t_foreach_3 === 'object' && !isIterable(t_foreach_3)) {          t_foreach_3 = Object.entries(t_foreach_3);          hasValue_5 = true;        }
        for (const [index, item] of enumerate(t_foreach_3)) {          values["attribute_index"] = index;          if (hasValue_5) {            [values["attribute"], values["attribute_value"]] = item;          }          else {            values["attribute"] = item;            values["attribute_value"] = item;          }          values["attribute_first"] = values["attribute_index"] == 0;          if (size_4 != null) {            values["attribute_last"] = index + 1 === size_4;          }          values["attribute_odd"] = index % 2;          values["attribute_even"] = ! values["attribute_odd"];          values["attribute_parity"] = values["attribute_odd"] ? 'odd' : 'even';
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/div[0]/table/t";
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/div[0]/table/t/tr/td/span";
            tFieldTOptions = {};
            result = await self._getField(values['attribute'], "label", "attribute.label", "span", tFieldTOptions, compileOptions, values);
            [attrs, content, forceDisplay] = result;
            if (content != null && bool(content) !== false) {
                content = await self._compileToStr(content);
            }
            yield `
                                        <tr>
                                            <td>
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
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/div[0]/table/t/tr/td/t";
            yield `:
                                                `;
            let size_1;            let t_foreach_0 = values['singleValueAttributes'].get(values['attribute']) ?? [];            if (typeof(t_foreach_0) === 'number') {              size_1 = t_foreach_0;              values["ptal_size"] = size_1;              t_foreach_0 = range(size_1);            }            else if ('_length' in t_foreach_0) {              size_1 = t_foreach_0._length;              values["ptal_size"] = size_1;            }            else if ('length' in t_foreach_0) {              size_1 = t_foreach_0.length;              values["ptal_size"] = size_1;            }            else if ('size' in t_foreach_0) {              size_1 = t_foreach_0.size;              values["ptal_size"] = size_1;            }            else {              size_1 = null;            }            let hasValue_2 = false;            if (t_foreach_0 instanceof Map || t_foreach_0 instanceof MapKey) {              t_foreach_0 = t_foreach_0.entries();              hasValue_2 = true;            }            if (typeof t_foreach_0 === 'object' && !isIterable(t_foreach_0)) {              t_foreach_0 = Object.entries(t_foreach_0);              hasValue_2 = true;            }
            for (const [index, item] of enumerate(t_foreach_0)) {              values["ptal_index"] = index;              if (hasValue_2) {                [values["ptal"], values["ptal_value"]] = item;              }              else {                values["ptal"] = item;                values["ptal_value"] = item;              }              values["ptal_first"] = values["ptal_index"] == 0;              if (size_1 != null) {                values["ptal_last"] = index + 1 === size_1;              }              values["ptal_odd"] = index % 2;              values["ptal_even"] = ! values["ptal_odd"];              values["ptal_parity"] = values["ptal_odd"] ? 'odd' : 'even';
                log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/div[0]/table/t/tr/td/t";
                log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/div[0]/table/t/tr/td/t/span";
                tFieldTOptions = {};
                result = await self._getField((await (await values['ptal'].productTemplateValueIds)._onlyActive()), "label", "ptal.productTemplateValueIds._onlyActive().label", "span", tFieldTOptions, compileOptions, values);
                [attrs, content, forceDisplay] = result;
                if (content != null && bool(content) !== false) {
                    content = await self._compileToStr(content);
                }
                yield `
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
                log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/div[0]/table/t/tr/td/t/t";
                if (!bool(values['ptal_last'])) {
                    yield `, `;
                }
                yield `
                                                `;
            }
            yield `
                                            </td>
                                        </tr>
                                    `;
        }
        log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/div[1]/div/t";
        yield `
                                </table>
                            </div>
                            <div id="oProductTermsAndShare">
                            
            
            <p class="text-muted h6 mt-3" data-oe-id="1162" data-oe-xpath="/data/xpath/p" data-oe-model="ir.ui.view" data-oe-field="arch">
                <a href="/terms" class="text-muted">Terms && Conditions</a><br/>
                30-day money-back guarantee<br/>
                Shipping: 2-3 Business Days
            </p>
        
            
            <div class="h4 mt-3 d-flex justify-content-end" contenteditable="false" data-oe-id="1163" data-oe-xpath="/data/xpath/div" data-oe-model="ir.ui.view" data-oe-field="arch">
                `;
        tCallTOptions = {'snippet-key': 'website.sShare'}
        {
        async function* tCallContent(self, values, log) {
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/div[1]/div/t/t[0]";
            yield `
                    `;
            values["_excludeShareLinks"] = ['whatsapp', 'linkedin'];
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/div[1]/div/t/t[1]";
            yield `
                    `;
            values["_noTitle"] = true;
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/div[1]/div/t/t[2]";
            yield `
                    `;
            values["_classes"] = "text-lg-right";
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/div[1]/div/t/t[3]";
            yield `
                    `;
            values["_linkClasses"] = "mx-1 my-0";
            yield `
                `;
        }
        tCallValues = Object.assign({},  values);
        let res = '';
        for await (const str of tCallContent(self, tCallValues, log)) 
            res = res + str;
        tCallValues['0'] = markup(res)
        }
        tCallOptions = Object.assign({}, compileOptions);        Object.assign(tCallOptions, {'callerTemplate': "1161", 'lastPathNode': "/t/t[3]/div/section/div[1]/div[1]/div[1]/div/t" })
        Object.assign(tCallOptions, tCallTOptions);
        if (compileOptions['lang'] !== tCallOptions['lang']) {          const selfLang = await self.withContext({lang: tCallOptions['lang']});          for await (const val of (await selfLang._compile(request, "website.sShare", tCallOptions))(selfLang, tCallValues)) {            yield val;          }        }        else {          for await (const val of (await self._compile("website.sShare", tCallOptions))(self, tCallValues)) {            yield val;          }        }
        log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/t[2]";
        yield `
            </div>
        </div>
                        
            
            `;
        if (await (await values['website'].shopExtraFieldIds).some(async (field) => values['product'][await field.label])) {
            log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/t[2]/p/t";
            yield `
                <hr/>
                <p class="text-muted">
                    `;
            let size_7;            let t_foreach_6 = await values['website'].shopExtraFieldIds ?? [];            if (typeof(t_foreach_6) === 'number') {              size_7 = t_foreach_6;              values["field_size"] = size_7;              t_foreach_6 = range(size_7);            }            else if ('_length' in t_foreach_6) {              size_7 = t_foreach_6._length;              values["field_size"] = size_7;            }            else if ('length' in t_foreach_6) {              size_7 = t_foreach_6.length;              values["field_size"] = size_7;            }            else if ('size' in t_foreach_6) {              size_7 = t_foreach_6.size;              values["field_size"] = size_7;            }            else {              size_7 = null;            }            let hasValue_8 = false;            if (t_foreach_6 instanceof Map || t_foreach_6 instanceof MapKey) {              t_foreach_6 = t_foreach_6.entries();              hasValue_8 = true;            }            if (typeof t_foreach_6 === 'object' && !isIterable(t_foreach_6)) {              t_foreach_6 = Object.entries(t_foreach_6);              hasValue_8 = true;            }
            for (const [index, item] of enumerate(t_foreach_6)) {              values["field_index"] = index;              if (hasValue_8) {                [values["field"], values["field_value"]] = item;              }              else {                values["field"] = item;                values["field_value"] = item;              }              values["field_first"] = values["field_index"] == 0;              if (size_7 != null) {                values["field_last"] = index + 1 === size_7;              }              values["field_odd"] = index % 2;              values["field_even"] = ! values["field_odd"];              values["field_parity"] = values["field_odd"] ? 'odd' : 'even';
                log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/t[2]/p/t";
                if (bool(await values['product'][await values['field'].label])) {
                    log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/t[2]/p/t/b/t";
                    yield `
                        <b>`;
                    content = await values['field'].description;
                    forceDisplay = null;
                    if (content != null && bool(content) !== false) {
                        yield String(content);
                    }
                    else {
                    }
                    log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/t[2]/p/t/t[0]";
                    yield `: </b>
                        `;
                    if (await (await values['field'].fieldId).ttype != "binary") {
                        log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/t[2]/p/t/t[0]/span";
                        yield `
                            `;
                        tOutTOptions = {'widget': await (await values['field'].fieldId).ttype}
                        content = await values['product'][await values['field'].label];
                        result = await self._getWidget(content, "await product[await field.label]", "span", tOutTOptions, compileOptions, values);
                        [attrs, content, forceDisplay] = result;
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
                        `;
                    }
                    else {
                        log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/t[2]/p/t/t[1]";
                        log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/t[2]/p/t/t[1]/a";
                        attrs = {};
                        attrs["target"] = "_blank";
                        attrs["href"] = format("/web/content/product.template/%s/%s?download=1", await self._compileToStr(values['product'].id), await self._compileToStr(await values['field'].label));
                        tagName = "a";
                        yield `
                            <a`;
                        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                        for (const [name, value] of Object.entries(attrs)) {
                              if (value || typeof(value) === 'string') {
                                    yield ' ' + String(name) + '="' + String(value) + '"'
                              }
                        }
                        yield `>
                                <i class="fa fa-file"></i>
                            </a>
                        `;
                    }
                    log["lastPathNode"] = "/t/t[3]/div/section/div[1]/div[1]/t[2]/p/t/t[1]";
                    yield `
                        
                        <br/>
                    `;
                }
            }
            yield `
                </p>
            `;
        }
        log["lastPathNode"] = "/t/t[3]/div/div[1]";
        tFieldTOptions = {};
        result = await self._getField(values['product'], "websiteDescription", "product.websiteDescription", "div", tFieldTOptions, compileOptions, values);
        [attrs, content, forceDisplay] = result;
        if (content != null && bool(content) !== false) {
            content = await self._compileToStr(content);
        }
        yield `
        </div>
                    </div>
                </section>
                `;
        if (content != null && bool(content) !== false) {
            attrs["itemprop"] = "description";
            attrs["class"] = "oe-structure oe-empty mt16";
            attrs["id"] = "productFullDescription";
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
            attrs["itemprop"] = "description";
            attrs["class"] = "oe-structure oe-empty mt16";
            attrs["id"] = "productFullDescription";
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
        log["lastPathNode"] = "/t/t[3]/div/t";
        yield `
                
            `;
        values["alternativeProducts"] = await values['product']._getWebsiteAlternativeProduct();
        log["lastPathNode"] = "/t/t[3]/div/div[2]";
        yield `
            `;
        if (bool(values['alternativeProducts'])) {
            log["lastPathNode"] = "/t/t[3]/div/div[2]/div/t";
            yield `<div class="container mt32" data-oe-id="1166" data-oe-xpath="/data/xpath/div" data-oe-model="ir.ui.view" data-oe-field="arch">
                <h3>Alternative Products:</h3>
                <div class="row mt16" style="">
                    `;
            let size_10;            let t_foreach_9 = values['alternativeProducts'] ?? [];            if (typeof(t_foreach_9) === 'number') {              size_10 = t_foreach_9;              values["altProduct_size"] = size_10;              t_foreach_9 = range(size_10);            }            else if ('_length' in t_foreach_9) {              size_10 = t_foreach_9._length;              values["altProduct_size"] = size_10;            }            else if ('length' in t_foreach_9) {              size_10 = t_foreach_9.length;              values["altProduct_size"] = size_10;            }            else if ('size' in t_foreach_9) {              size_10 = t_foreach_9.size;              values["altProduct_size"] = size_10;            }            else {              size_10 = null;            }            let hasValue_11 = false;            if (t_foreach_9 instanceof Map || t_foreach_9 instanceof MapKey) {              t_foreach_9 = t_foreach_9.entries();              hasValue_11 = true;            }            if (typeof t_foreach_9 === 'object' && !isIterable(t_foreach_9)) {              t_foreach_9 = Object.entries(t_foreach_9);              hasValue_11 = true;            }
            for (const [index, item] of enumerate(t_foreach_9)) {              values["altProduct_index"] = index;              if (hasValue_11) {                [values["altProduct"], values["altProduct_value"]] = item;              }              else {                values["altProduct"] = item;                values["altProduct_value"] = item;              }              values["altProduct_first"] = values["altProduct_index"] == 0;              if (size_10 != null) {                values["altProduct_last"] = index + 1 === size_10;              }              values["altProduct_odd"] = index % 2;              values["altProduct_even"] = ! values["altProduct_odd"];              values["altProduct_parity"] = values["altProduct_odd"] ? 'odd' : 'even';
                log["lastPathNode"] = "/t/t[3]/div/div[2]/div/t";
                log["lastPathNode"] = "/t/t[3]/div/div[2]/div/t/div";
                attrs = {};
                attrs["class"] = "col-lg-2";
                attrs["style"] = "width: 170px; height:130px; float:left; display:inline; margin-right: 10px; overflow:hidden;";
                attrs["data-publish"] = bool(await values['altProduct'].websitePublished) && 'on' || 'off';
                tagName = "div";
                yield `
                        <div`;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                log["lastPathNode"] = "/t/t[3]/div/div[2]/div/t/div/div/t[0]";
                yield `>
                            <div class="mt16 text-center" style="height: 100%;">
                                `;
                values["combinationInfo"] = await values['altProduct']._getCombinationInfo();
                log["lastPathNode"] = "/t/t[3]/div/div[2]/div/t/div/div/t[1]";
                yield `
                                `;
                values["productVariant"] = values['altProduct'].env.items('product.product').browse(values['combinationInfo']['productId']);
                log["lastPathNode"] = "/t/t[3]/div/div[2]/div/t/div/div/div[0]";
                yield `
                                `;
                if (bool(values['productVariant'])) {
                    tFieldTOptions = {'widget': 'image', 'qwebImgResponsive': false, 'class': 'rounded shadow o-alternative-product o-image-64-max' }
                    result = await self._getField(values['productVariant'], "image128", "productVariant.image128", "div", tFieldTOptions, compileOptions, values);
                    [attrs, content, forceDisplay] = result;
                    if (content != null && bool(content) !== false) {
                        content = await self._compileToStr(content);
                    }
                    if (content != null && bool(content) !== false) {
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
                }
                else {
                    log["lastPathNode"] = "/t/t[3]/div/div[2]/div/t/div/div/div[1]";
                    tFieldTOptions = {'widget': 'image', 'qwebImgResponsive': false, 'class': 'rounded shadow o-alternative-product o-image-64-max' }
                    result = await self._getField(values['altProduct'], "image128", "altProduct.image128", "div", tFieldTOptions, compileOptions, values);
                    [attrs, content, forceDisplay] = result;
                    if (content != null && bool(content) !== false) {
                        content = await self._compileToStr(content);
                    }
                    if (content != null && bool(content) !== false) {
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
                }
                log["lastPathNode"] = "/t/t[3]/div/div[2]/div/t/div/div/h6/a";
                attrs = {};
                attrs["style"] = "display: block";
                attrs["href"] = await values['altProduct'].websiteUrl;
                tagName = "a";
                yield `
                                
                                <h6>
                                    <a`;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                log["lastPathNode"] = "/t/t[3]/div/div[2]/div/t/div/div/h6/a/span";
                tFieldTOptions = {};
                result = await self._getField(values['altProduct'], "label", "altProduct.label", "span", tFieldTOptions, compileOptions, values);
                [attrs, content, forceDisplay] = result;
                if (content != null && bool(content) !== false) {
                    content = await self._compileToStr(content);
                }
                yield `>
                                        `;
                if (content != null && bool(content) !== false) {
                    attrs["class"] = "o-text-overflow";
                    attrs["style"] = "display: block;";
                    attrs["title"] = await values['altProduct'].label;
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
                    attrs["class"] = "o-text-overflow";
                    attrs["style"] = "display: block;";
                    attrs["title"] = await values['altProduct'].label;
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
                                </h6>
                            </div>
                        </div>
                    `;
            }
            yield `
                </div>
            </div>`;
        }
        yield `
        <div class="oe-structure oe-empty oe-structure-not-nearest mt16" id="oeStructureWebsiteSaleProduct2" data-editor-message="DROP BUILDING BLOCKS HERE TO MAKE THEM AVAILABLE ACROSS ALL PRODUCTS"></div>
            </div>
        `;
    }
    tCallValues = Object.assign({},  values);
    let res = '';
    for await (const str of tCallContent(self, tCallValues, log)) 
        res = res + str;
    tCallValues['0'] = markup(res)
    }
    tCallOptions = Object.assign({}, compileOptions);    Object.assign(tCallOptions, {'callerTemplate': "1161", 'lastPathNode': "/t/t[3]" })
    for await (const val of (await self._compile("website.layout", tCallOptions))(self, tCallValues)) {            yield val;          }
    yield `
    `;
    } catch(e) {
        _debug('Error in %s at %s: %s', 'template1161', log["lastPathNode"], e);
        _debug(String(template1161)); // detail code
        throw e;
    }
}