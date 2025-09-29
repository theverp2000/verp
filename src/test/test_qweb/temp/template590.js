async function* template590(self, values, log={}) {
    let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;
    try {
        // _debug(String(template590.name)); // detail code
    log["lastPathNode"] = "/t";
    log["lastPathNode"] = "/t/t";
    yield `
            `;
    {
    async function* tCallContent(self, values, log) {
        log["lastPathNode"] = "/t/t/t[0]";
        yield `
                `;
        values["o"] = await values['o'].withContext({'lang': values['lang']});
        log["lastPathNode"] = "/t/t/t[1]";
        yield `
                `;
        values["forcedVat"] = await (await values['o'].fiscalPositionId).foreignVat;
        log["lastPathNode"] = "/t/t/t[2]";
        yield ` 
                `;
        async function* qwebTSet__t_t_t_2_() {
            log["lastPathNode"] = "/t/t/t[2]/t";
            yield `
            `;
            if (await values['o'].partnerShippingId && (await values['o'].partnerShippingId).ne(await values['o'].partnerId)) {
                log["lastPathNode"] = "/t/t/t[2]/t/t";
                yield `
                `;
                async function* qwebTSet__t_t_t_2__t_t() {
                    log["lastPathNode"] = "/t/t/t[2]/t/t/div";
                    yield `
                    `;
                    if (await self.userHasGroups("sale.groupDeliveryInvoiceAddress")) {
                        log["lastPathNode"] = "/t/t/t[2]/t/t/div/div";
                        tFieldTOptions = {"widget": "contact", "fields": ["address", "label"], "noMarker": true}
                        result = await self._getField(values['o'], "partnerShippingId", "o.partnerShippingId", "div", tFieldTOptions, compileOptions, values);
                        [attrs, content, forceDisplay] = result;
                        if (content != null && bool(content) !== false) {
                            content = await self._compileToStr(content);
                        }
                        yield `<div name="shippingAddressBlock">
                        <strong>Shipping Address:</strong>
                        `;
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
                        yield `
                    </div>`;
                    }
                    yield `
                `;
                }
                let qwebTSet__t_t_t_2__t_t_value = '';
                for await (const val of qwebTSet__t_t_t_2__t_t()) qwebTSet__t_t_t_2__t_t_value += val;
                values["informationBlock"] = markup(qwebTSet__t_t_t_2__t_t_value);;
                yield `
            `;
            }
            log["lastPathNode"] = "/t/t/t[2]/div[0]";
            yield `
            `;
            if (await self.userHasGroups("sale.groupDeliveryInvoiceAddress")) {
                tFieldTOptions = {"widget": "contact", "fields": ["address", "label"], "noMarker": true}
                result = await self._getField(values['o'], "partnerId", "o.partnerId", "div", tFieldTOptions, compileOptions, values);
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
            log["lastPathNode"] = "/t/t/t[2]/address";
            yield `
        
                    `;
            if (await self.userHasGroups("!sale.groupDeliveryInvoiceAddress")) {
                tFieldTOptions = {"widget": "contact", "fields": ["address", "label"], "noMarker": true}
                result = await self._getField(values['o'], "partnerId", "o.partnerId", "address", tFieldTOptions, compileOptions, values);
                [attrs, content, forceDisplay] = result;
                if (content != null && bool(content) !== false) {
                    content = await self._compileToStr(content);
                }
                if (content != null && bool(content) !== false) {
                    tagName = "address";
                    yield `<address`;
                    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                    for (const [name, value] of Object.entries(attrs)) {
                          if (value || typeof(value) === 'string') {
                                yield ' ' + String(name) + '="' + String(value) + '"'
                          }
                    }
                    yield `>`;
                    yield String(content);
                    yield `</address>`;
                }
                else {
                    tagName = "address";
                    yield `<address`;
                    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                    for (const [name, value] of Object.entries(attrs)) {
                          if (value || typeof(value) === 'string') {
                                yield ' ' + String(name) + '="' + String(value) + '"'
                          }
                    }
                    yield `>`;
                    yield `</address>`;
                }
            }
            log["lastPathNode"] = "/t/t/t[2]/div[1]";
            yield `
                    `;
            if (await (await values['o'].partnerId).vat) {
                log["lastPathNode"] = "/t/t/t[2]/div[1]/t[0]";
                yield `<div class="mt16">
                        `;
                values["vatLabel"] = await (await (await values['o'].companyId).accountFiscalCountryId).vatLabel;
                log["lastPathNode"] = "/t/t/t[2]/div[1]/t[1]";
                yield `
                        `;
                if (values['vatLabel']) {
                    content = values['vatLabel'];
                    forceDisplay = null;
                    if (content != null && bool(content) !== false) {
                        yield String(content);
                    }
                    else {
                    }
                }
                else {
                    log["lastPathNode"] = "/t/t/t[2]/div[1]/t[2]";
                    yield `Tax ID`;
                }
                log["lastPathNode"] = "/t/t/t[2]/div[1]/span";
                tFieldTOptions = {};
                result = await self._getField((await values['o'].partnerId), "vat", "o.partnerId.vat", "span", tFieldTOptions, compileOptions, values);
                [attrs, content, forceDisplay] = result;
                if (content != null && bool(content) !== false) {
                    content = await self._compileToStr(content);
                }
                yield `
                        : `;
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
                yield `</div>`;
            }
            yield `
                `;
        }
        let qwebTSet__t_t_t_2__value = '';
        for await (const val of qwebTSet__t_t_t_2_()) qwebTSet__t_t_t_2__value += val;
        values["address"] = markup(qwebTSet__t_t_t_2__value);;
        log["lastPathNode"] = "/t/t/div/t[0]";
        yield `
                <div class="page">
                    `;
        values["moveType"] = await values['o'].moveType;
        log["lastPathNode"] = "/t/t/div/t[1]";
        yield `
                    `;
        values["state"] = await values['o'].state;
        log["lastPathNode"] = "/t/t/div/h2/span[0]";
        yield `
                    <h2>
                        `;
        if (values['moveType'] === 'outInvoice' && values['state'] === 'posted') {
            yield `<span>Invoice</span>`;
        }
        log["lastPathNode"] = "/t/t/div/h2/span[1]";
        yield `
                        `;
        if (values['moveType'] === 'outInvoice' && values['state'] === 'draft') {
            yield `<span>Draft Invoice</span>`;
        }
        log["lastPathNode"] = "/t/t/div/h2/span[2]";
        yield `
                        `;
        if (values['moveType'] === 'outInvoice' && values['state'] === 'cancel') {
            yield `<span>Cancelled Invoice</span>`;
        }
        log["lastPathNode"] = "/t/t/div/h2/span[3]";
        yield `
                        `;
        if (values['moveType'] === 'outRefund') {
            yield `<span>Credit Note</span>`;
        }
        log["lastPathNode"] = "/t/t/div/h2/span[4]";
        yield `
                        `;
        if (values['moveType'] === 'inRefund') {
            yield `<span>Vendor Credit Note</span>`;
        }
        log["lastPathNode"] = "/t/t/div/h2/span[5]";
        yield `
                        `;
        if (values['moveType'] === 'inInvoice') {
            yield `<span>Vendor Bill</span>`;
        }
        log["lastPathNode"] = "/t/t/div/h2/span[6]";
        yield `
                        `;
        if (await values['o'].label != '/') {
            tFieldTOptions = {};
            result = await self._getField(values['o'], "label", "o.label", "span", tFieldTOptions, compileOptions, values);
            [attrs, content, forceDisplay] = result;
            if (content != null && bool(content) !== false) {
                content = await self._compileToStr(content);
            }
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
        }
        log["lastPathNode"] = "/t/t/div/div[0]/div[0]";
        yield `
                    </h2>

                    <div id="informations" class="row mt32 mb32">
                        `;
        if (await values['o'].invoiceDate) {
            log["lastPathNode"] = "/t/t/div/div[0]/div[0]/p";
            tFieldTOptions = {};
            result = await self._getField(values['o'], "invoiceDate", "o.invoiceDate", "p", tFieldTOptions, compileOptions, values);
            [attrs, content, forceDisplay] = result;
            if (content != null && bool(content) !== false) {
                content = await self._compileToStr(content);
            }
            yield `<div class="col-auto col-3 mw-100 mb-2" name="invoiceDate">
                            <strong>Invoice Date:</strong>
                            `;
            if (content != null && bool(content) !== false) {
                attrs["class"] = "m-0";
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
                attrs["class"] = "m-0";
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
            yield `
                        </div>`;
        }
        log["lastPathNode"] = "/t/t/div/div[0]/div[1]";
        yield `
                        `;
        if (await values['o'].invoiceDateDue && values['moveType'] === 'outInvoice' && values['state'] === 'posted') {
            log["lastPathNode"] = "/t/t/div/div[0]/div[1]/p";
            tFieldTOptions = {};
            result = await self._getField(values['o'], "invoiceDateDue", "o.invoiceDateDue", "p", tFieldTOptions, compileOptions, values);
            [attrs, content, forceDisplay] = result;
            if (content != null && bool(content) !== false) {
                content = await self._compileToStr(content);
            }
            yield `<div class="col-auto col-3 mw-100 mb-2" name="dueDate">
                            <strong>Due Date:</strong>
                            `;
            if (content != null && bool(content) !== false) {
                attrs["class"] = "m-0";
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
                attrs["class"] = "m-0";
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
            yield `
                        </div>`;
        }
        log["lastPathNode"] = "/t/t/div/div[0]/div[2]";
        yield `
                        `;
        if (await values['o'].invoiceOrigin) {
            log["lastPathNode"] = "/t/t/div/div[0]/div[2]/p";
            tFieldTOptions = {};
            result = await self._getField(values['o'], "invoiceOrigin", "o.invoiceOrigin", "p", tFieldTOptions, compileOptions, values);
            [attrs, content, forceDisplay] = result;
            if (content != null && bool(content) !== false) {
                content = await self._compileToStr(content);
            }
            yield `<div class="col-auto col-3 mw-100 mb-2" name="origin">
                            <strong>Source:</strong>
                            `;
            if (content != null && bool(content) !== false) {
                attrs["class"] = "m-0";
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
                attrs["class"] = "m-0";
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
            yield `
                        </div>`;
        }
        log["lastPathNode"] = "/t/t/div/div[0]/div[3]";
        yield `
                        `;
        if (await (await values['o'].partnerId).ref) {
            log["lastPathNode"] = "/t/t/div/div[0]/div[3]/p";
            tFieldTOptions = {};
            result = await self._getField((await values['o'].partnerId), "ref", "o.partnerId.ref", "p", tFieldTOptions, compileOptions, values);
            [attrs, content, forceDisplay] = result;
            if (content != null && bool(content) !== false) {
                content = await self._compileToStr(content);
            }
            yield `<div class="col-auto col-3 mw-100 mb-2" name="customerCode">
                            <strong>Customer Code:</strong>
                            `;
            if (content != null && bool(content) !== false) {
                attrs["class"] = "m-0";
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
                attrs["class"] = "m-0";
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
            yield `
                        </div>`;
        }
        log["lastPathNode"] = "/t/t/div/div[0]/div[4]";
        yield `
                        `;
        if (await values['o'].ref) {
            log["lastPathNode"] = "/t/t/div/div[0]/div[4]/p";
            tFieldTOptions = {};
            result = await self._getField(values['o'], "ref", "o.ref", "p", tFieldTOptions, compileOptions, values);
            [attrs, content, forceDisplay] = result;
            if (content != null && bool(content) !== false) {
                content = await self._compileToStr(content);
            }
            yield `<div class="col-auto col-3 mw-100 mb-2" name="reference">
                            <strong>Reference:</strong>
                            `;
            if (content != null && bool(content) !== false) {
                attrs["class"] = "m-0";
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
                attrs["class"] = "m-0";
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
            yield `
                        </div>`;
        }
        log["lastPathNode"] = "/t/t/div/t[2]";
        yield `
                    </div>

                    `;
        values["displayDiscount"] = await (await values['o'].invoiceLineIds).some(l => l.discount);
        log["lastPathNode"] = "/t/t/div/table/thead/tr/th[2]";
        attrs = {};
        attrs["name"] = "thPriceunit";
        attrs["class"] = format("text-right %s", await self._compileToStr( values['reportType'] === 'html' ? 'd-none d-md-table-cell' : '' ));
        tagName = "th";
        yield `

                    <table class="table table-sm o-main-table" name="invoiceLineTable">
                        <thead>
                            <tr>
                                <th name="thDescription" class="text-left"><span>Description</span></th>
                                <th name="thQuantity" class="text-right"><span>Quantity</span></th>
                                <th`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        log["lastPathNode"] = "/t/t/div/table/thead/tr/th[3]";
        yield `><span>Unit Price</span></th>
                                `;
        if (values['displayDiscount']) {
            attrs = {};
            attrs["name"] = "thPriceUnit";
            attrs["class"] = format("text-right %s", await self._compileToStr( values['reportType'] === 'html' ? 'd-none d-md-table-cell' : '' ));
            tagName = "th";
            yield `<th`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            yield `>
                                    <span>Disc.%</span>
                                </th>`;
        }
        log["lastPathNode"] = "/t/t/div/table/thead/tr/th[4]";
        attrs = {};
        attrs["name"] = "thTaxes";
        attrs["class"] = format("text-left %s", await self._compileToStr( values['reportType'] === 'html' ? 'd-none d-md-table-cell' : '' ));
        tagName = "th";
        yield `
                                <th`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        log["lastPathNode"] = "/t/t/div/table/thead/tr/th[5]/span[0]";
        yield `><span>Taxes</span></th>
                                <th name="thSubtotal" class="text-right">
                                    `;
        if (await self.userHasGroups("account.groupShowLineSubtotalsTaxExcluded")) {
            yield `<span>Amount</span>`;
        }
        log["lastPathNode"] = "/t/t/div/table/thead/tr/th[5]/span[1]";
        yield `
                                    `;
        if (await self.userHasGroups("account.groupShowLineSubtotalsTaxIncluded")) {
            yield `<span>Total Price</span>`;
        }
        log["lastPathNode"] = "/t/t/div/table/tbody/t[0]";
        yield `
                                </th>
                            </tr>
                        </thead>
                        <tbody class="invoiceTbody">
                            `;
        values["currentSubtotal"] = 0;
        log["lastPathNode"] = "/t/t/div/table/tbody/t[1]";
        yield `
                            `;
        values["lines"] = await (await values['o'].invoiceLineIds).reversed(async (l) => [- await l.sequence, await l.date, await l.moveName, -l.id].join('.'));
        log["lastPathNode"] = "/t/t/div/table/tbody/t[2]";
        yield `

                            `;
        let size_4;        let t_foreach_3 = values['lines'] ?? [];        if (typeof(t_foreach_3) === 'number') {          size_4 = t_foreach_3;          values["line_size"] = size_4;          t_foreach_3 = range(size_4);        }        else if ('_length' in t_foreach_3) {          size_4 = t_foreach_3._length;          values["line_size"] = size_4;        }        else if ('length' in t_foreach_3) {          size_4 = t_foreach_3.length;          values["line_size"] = size_4;        }        else if ('size' in t_foreach_3) {          size_4 = t_foreach_3.size;          values["line_size"] = size_4;        }        else {          size_4 = null;        }        let hasValue_5 = false;        if (t_foreach_3 instanceof Map || t_foreach_3 instanceof MapKey) {          t_foreach_3 = t_foreach_3.entries();          hasValue_5 = true;        }        if (typeof t_foreach_3 === 'object' && !isIterable(t_foreach_3)) {          t_foreach_3 = Object.entries(t_foreach_3);          hasValue_5 = true;        }
        for (const [index, item] of enumerate(t_foreach_3)) {          values["line_index"] = index;          if (hasValue_5) {            [values["line"], values["line_value"]] = item;          }          else {            values["line"] = item;            values["line_value"] = item;          }          values["line_first"] = values["line_index"] == 0;          if (size_4 != null) {            values["line_last"] = index + 1 === size_4;          }          values["line_odd"] = index % 2;          values["line_even"] = ! values["line_odd"];          values["line_parity"] = values["line_odd"] ? 'odd' : 'even';
            log["lastPathNode"] = "/t/t/div/table/tbody/t[2]";
            log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/t[0]";
            yield `
                                `;
            if (await self.userHasGroups("account.groupShowLineSubtotalsTaxExcluded")) {
                values["currentSubtotal"] = values['currentSubtotal'] + await values['line'].priceSubtotal;
            }
            log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/t[1]";
            yield `
                                `;
            if (await self.userHasGroups("account.groupShowLineSubtotalsTaxIncluded")) {
                values["currentSubtotal"] = values['currentSubtotal'] + await values['line'].priceTotal;
            }
            log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/tr";
            attrs = {};
            attrs["class"] = await values['line'].displayType === 'lineSection' ? 'bg-200 font-weight-bold o-line-section' : await values['line'].displayType === 'lineNote' ? 'font-italic o-line-note' : '';
            tagName = "tr";
            yield `

                                <tr`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/tr/t[0]";
            yield `>
                                    `;
            if (! await values['line'].displayType) {
                log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/tr/t[0]/td[0]/span";
                tFieldTOptions = {'widget': 'text'}
                result = await self._getField(values['line'], "label", "line.label", "span", tFieldTOptions, compileOptions, values);
                [attrs, content, forceDisplay] = result;
                if (content != null && bool(content) !== false) {
                    content = await self._compileToStr(content);
                }
                yield `
                                        <td name="accountInvoiceLineName">`;
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
                log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/tr/t[0]/td[1]/span[0]";
                tFieldTOptions = {};
                result = await self._getField(values['line'], "quantity", "line.quantity", "span", tFieldTOptions, compileOptions, values);
                [attrs, content, forceDisplay] = result;
                if (content != null && bool(content) !== false) {
                    content = await self._compileToStr(content);
                }
                yield `</td>
                                        <td class="text-right">
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
                log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/tr/t[0]/td[1]/span[1]";
                yield `
                                            `;
                if (await self.userHasGroups("uom.groupUom")) {
                    tFieldTOptions = {};
                    result = await self._getField(values['line'], "productUomId", "line.productUomId", "span", tFieldTOptions, compileOptions, values);
                    [attrs, content, forceDisplay] = result;
                    if (content != null && bool(content) !== false) {
                        content = await self._compileToStr(content);
                    }
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
                }
                log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/tr/t[0]/td[2]";
                attrs = {};
                attrs["class"] = format("text-right %s", await self._compileToStr( values['reportType'] === 'html' ? 'd-none d-md-table-cell' : '' ));
                tagName = "td";
                yield `
                                        </td>
                                        <td`;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/tr/t[0]/td[2]/span";
                tFieldTOptions = {};
                result = await self._getField(values['line'], "priceUnit", "line.priceUnit", "span", tFieldTOptions, compileOptions, values);
                [attrs, content, forceDisplay] = result;
                if (content != null && bool(content) !== false) {
                    content = await self._compileToStr(content);
                }
                yield `>
                                            `;
                if (content != null && bool(content) !== false) {
                    attrs["class"] = "text-nowrap";
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
                    attrs["class"] = "text-nowrap";
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
                log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/tr/t[0]/td[3]";
                yield `
                                        </td>
                                        `;
                if (values['displayDiscount']) {
                    attrs = {};
                    attrs["class"] = format("text-right %s", await self._compileToStr( values['reportType'] === 'html' ? 'd-none d-md-table-cell' : '' ));
                    tagName = "td";
                    yield `<td`;
                    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                    for (const [name, value] of Object.entries(attrs)) {
                          if (value || typeof(value) === 'string') {
                                yield ' ' + String(name) + '="' + String(value) + '"'
                          }
                    }
                    log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/tr/t[0]/td[3]/span";
                    tFieldTOptions = {};
                    result = await self._getField(values['line'], "discount", "line.discount", "span", tFieldTOptions, compileOptions, values);
                    [attrs, content, forceDisplay] = result;
                    if (content != null && bool(content) !== false) {
                        content = await self._compileToStr(content);
                    }
                    yield `>
                                            `;
                    if (content != null && bool(content) !== false) {
                        attrs["class"] = "text-nowrap";
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
                        attrs["class"] = "text-nowrap";
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
                                        </td>`;
                }
                log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/tr/t[0]/td[4]";
                attrs = {};
                attrs["class"] = format("text-left %s", await self._compileToStr( values['reportType'] === 'html' ? 'd-none d-md-table-cell' : '' ));
                tagName = "td";
                yield `
                                        <td`;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/tr/t[0]/td[4]/span";
                yield `>
                                            `;
                content = (await (await values['line'].taxIds).map(async (x) => (await x.description || await x.label))).join(', ');
                forceDisplay = null;
                if (content != null && bool(content) !== false) {
                    attrs = {};
                    attrs["id"] = "lineTaxIds";
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
                    attrs["id"] = "lineTaxIds";
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
                log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/tr/t[0]/td[5]/span[0]";
                yield `
                                        </td>
                                        <td class="text-right o-price-total">
                                            `;
                if (await self.userHasGroups("account.groupShowLineSubtotalsTaxExcluded")) {
                    tFieldTOptions = {};
                    result = await self._getField(values['line'], "priceSubtotal", "line.priceSubtotal", "span", tFieldTOptions, compileOptions, values);
                    [attrs, content, forceDisplay] = result;
                    if (content != null && bool(content) !== false) {
                        content = await self._compileToStr(content);
                    }
                    if (content != null && bool(content) !== false) {
                        attrs["class"] = "text-nowrap";
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
                        attrs["class"] = "text-nowrap";
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
                log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/tr/t[0]/td[5]/span[1]";
                yield `
                                            `;
                if (await self.userHasGroups("account.groupShowLineSubtotalsTaxIncluded")) {
                    tFieldTOptions = {};
                    result = await self._getField(values['line'], "priceTotal", "line.priceTotal", "span", tFieldTOptions, compileOptions, values);
                    [attrs, content, forceDisplay] = result;
                    if (content != null && bool(content) !== false) {
                        content = await self._compileToStr(content);
                    }
                    if (content != null && bool(content) !== false) {
                        attrs["class"] = "text-nowrap";
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
                        attrs["class"] = "text-nowrap";
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
                                        </td>
                                    `;
            }
            log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/tr/t[1]";
            yield `
                                    `;
            if (await values['line'].displayType === 'lineSection') {
                log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/tr/t[1]/td/span";
                tFieldTOptions = {'widget': 'text'}
                result = await self._getField(values['line'], "label", "line.label", "span", tFieldTOptions, compileOptions, values);
                [attrs, content, forceDisplay] = result;
                if (content != null && bool(content) !== false) {
                    content = await self._compileToStr(content);
                }
                yield `
                                        <td colspan="99">
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
                log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/tr/t[1]/t[0]";
                yield `
                                        </td>
                                        `;
                values["currentSection"] = values['line'];
                log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/tr/t[1]/t[1]";
                yield `
                                        `;
                values["currentSubtotal"] = 0;
                yield `
                                    `;
            }
            log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/tr/t[2]";
            yield `
                                    `;
            if (await values['line'].displayType === 'lineNote') {
                log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/tr/t[2]/td/span";
                tFieldTOptions = {'widget': 'text'}
                result = await self._getField(values['line'], "label", "line.label", "span", tFieldTOptions, compileOptions, values);
                [attrs, content, forceDisplay] = result;
                if (content != null && bool(content) !== false) {
                    content = await self._compileToStr(content);
                }
                yield `
                                        <td colspan="99">
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
                                        </td>
                                    `;
            }
            log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/t[2]";
            yield `
                                </tr>

                                `;
            if (values['currentSection'] && (values['line_last'] || await values['lines'][values['line_index']+1].displayType === 'lineSection')) {
                log["lastPathNode"] = "/t/t/div/table/tbody/t[2]/t[2]/tr/td/span";
                yield `
                                    <tr class="is-subtotal text-right">
                                        <td colspan="99">
                                            <strong class="mr16">Subtotal</strong>
                                            `;
                tOutTOptions = {"widget": "monetary", "displayCurrency": await values['o'].currencyId}
                content = values['currentSubtotal'];
                result = await self._getWidget(content, "currentSubtotal", "span", tOutTOptions, compileOptions, values);
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
                                        </td>
                                    </tr>
                                `;
            }
            yield `
                            `;
        }
        log["lastPathNode"] = "/t/t/div/div[1]/div/div";
        attrs = {};
        attrs["class"] = format("%s ml-auto", await self._compileToStr(values['reportType'] !== 'html' ? 'col-6' : 'col-sm-7 col-md-6'));
        tagName = "div";
        yield `
                        </tbody>
                    </table>

                    <div class="clearfix">
                        <div id="total" class="row">
                            <div`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        log["lastPathNode"] = "/t/t/div/div[1]/div/div/table/t[0]";
        yield `>
                                <table class="table table-sm" style="page-break-inside: avoid;">

                                    
                                    `;
        values["taxTotals"] = JSON.parse(await values['o'].taxTotalsJson);
        log["lastPathNode"] = "/t/t/div/div[1]/div/div/table/t[1]";
        yield `
                                    `;
        tCallValues = Object.assign({}, values);
        tCallValues['0'] = markup('');
        tCallOptions = Object.assign({}, compileOptions);        Object.assign(tCallOptions, {'callerTemplate': "account.reportInvoiceDocument", 'lastPathNode': "/t/t/div/div[1]/div/div/table/t[1]" })
        for await (const val of (await self._compile("account.documentTaxTotals", tCallOptions))(self, tCallValues)) {                yield val;              }
        log["lastPathNode"] = "/t/t/div/div[1]/div/div/table/t[2]";
        yield `

                                    
                                    `;
        if (values['printWithPayments']) {
            log["lastPathNode"] = "/t/t/div/div[1]/div/div/table/t[2]/t";
            yield `
                                        `;
            if (await values['o'].paymentState !== 'invoicingLegacy') {
                log["lastPathNode"] = "/t/t/div/div[1]/div/div/table/t[2]/t/t[0]";
                yield `
                                            `;
                values["paymentsVals"] = await (await values['o'].sudo())._getReconciledInfoJSONValues();
                log["lastPathNode"] = "/t/t/div/div[1]/div/div/table/t[2]/t/t[1]";
                yield `
                                            `;
                let size_7;                let t_foreach_6 = values['paymentsVals'] ?? [];                if (typeof(t_foreach_6) === 'number') {                  size_7 = t_foreach_6;                  values["paymentVals_size"] = size_7;                  t_foreach_6 = range(size_7);                }                else if ('_length' in t_foreach_6) {                  size_7 = t_foreach_6._length;                  values["paymentVals_size"] = size_7;                }                else if ('length' in t_foreach_6) {                  size_7 = t_foreach_6.length;                  values["paymentVals_size"] = size_7;                }                else if ('size' in t_foreach_6) {                  size_7 = t_foreach_6.size;                  values["paymentVals_size"] = size_7;                }                else {                  size_7 = null;                }                let hasValue_8 = false;                if (t_foreach_6 instanceof Map || t_foreach_6 instanceof MapKey) {                  t_foreach_6 = t_foreach_6.entries();                  hasValue_8 = true;                }                if (typeof t_foreach_6 === 'object' && !isIterable(t_foreach_6)) {                  t_foreach_6 = Object.entries(t_foreach_6);                  hasValue_8 = true;                }
                for (const [index, item] of enumerate(t_foreach_6)) {                  values["paymentVals_index"] = index;                  if (hasValue_8) {                    [values["paymentVals"], values["paymentVals_value"]] = item;                  }                  else {                    values["paymentVals"] = item;                    values["paymentVals_value"] = item;                  }                  values["paymentVals_first"] = values["paymentVals_index"] == 0;                  if (size_7 != null) {                    values["paymentVals_last"] = index + 1 === size_7;                  }                  values["paymentVals_odd"] = index % 2;                  values["paymentVals_even"] = ! values["paymentVals_odd"];                  values["paymentVals_parity"] = values["paymentVals_odd"] ? 'odd' : 'even';
                    log["lastPathNode"] = "/t/t/div/div[1]/div/div/table/t[2]/t/t[1]";
                    log["lastPathNode"] = "/t/t/div/div[1]/div/div/table/t[2]/t/t[1]/tr/td[0]/i/t[0]";
                    yield `
                                                <tr>
                                                    <td>
                                                        <i class="oe-form-field text-right oe-payment-label">Paid on `;
                    tOutTOptions = {"widget": "date"}
                    content = values['paymentVals']['date'];
                    result = await self._getWidget(content, "paymentVals['date']", "t", tOutTOptions, compileOptions, values);
                    [attrs, content, forceDisplay] = result;
                    if (content != null && bool(content) !== false) {
                        yield String(content);
                    }
                    else {
                    }
                    log["lastPathNode"] = "/t/t/div/div[1]/div/div/table/t[2]/t/t[1]/tr/td[0]/i/t[1]";
                    yield `
            
            `;
                    if (values['paymentVals']['posPaymentName']) {
                        log["lastPathNode"] = "/t/t/div/div[1]/div/div/table/t[2]/t/t[1]/tr/td[0]/i/t[1]/t";
                        yield `
                using `;
                        content = values['paymentVals']['posPaymentName'];
                        forceDisplay = null;
                        if (content != null && bool(content) !== false) {
                            yield String(content);
                        }
                        else {
                        }
                        yield `
            `;
                    }
                    log["lastPathNode"] = "/t/t/div/div[1]/div/div/table/t[2]/t/t[1]/tr/td[1]/span";
                    yield `
        </i>
                                                    </td>
                                                    <td class="text-right">
                                                        `;
                    tOutTOptions = {"widget": "monetary", "displayCurrency": await values['o'].currencyId}
                    content = values['paymentVals']['amount'];
                    result = await self._getWidget(content, "paymentVals['amount']", "span", tOutTOptions, compileOptions, values);
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
                                                    </td>
                                                </tr>
                                            `;
                }
                log["lastPathNode"] = "/t/t/div/div[1]/div/div/table/t[2]/t/t[2]";
                yield `
                                            `;
                if (len(values['paymentsVals']) > 0) {
                    log["lastPathNode"] = "/t/t/div/div[1]/div/div/table/t[2]/t/t[2]/tr/td[1]/span";
                    tFieldTOptions = {};
                    result = await self._getField(values['o'], "amountResidual", "o.amountResidual", "span", tFieldTOptions, compileOptions, values);
                    [attrs, content, forceDisplay] = result;
                    if (content != null && bool(content) !== false) {
                        content = await self._compileToStr(content);
                    }
                    yield `
                                                <tr class="border-black">
                                                    <td><strong>Amount Due</strong></td>
                                                    <td class="text-right">
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
                                                    </td>
                                                </tr>
                                            `;
                }
                yield `
                                        `;
            }
            yield `
                                    `;
        }
        log["lastPathNode"] = "/t/t/div/div[1]/t";
        yield `
                                </table>
                            </div>
                        </div>
          `;
        if (await self.userHasGroups("stock_account.groupLotOnInvoice")) {
            log["lastPathNode"] = "/t/t/div/div[1]/t/t[0]";
            yield `
            `;
            values["lotValues"] = await values['o']._getInvoicedLotValues();
            log["lastPathNode"] = "/t/t/div/div[1]/t/t[1]";
            yield `
            `;
            if (values['lotValues']) {
                log["lastPathNode"] = "/t/t/div/div[1]/t/t[1]/table/tbody/t";
                yield `
                <br/>
                <table class="table table-sm" style="width: 50%;" name="invoiceSnlnTable">
                    <thead>
                        <tr>
                            <th><span>Product</span></th>
                            <th class="text-right"><span>Quantity</span></th>
                            <th class="text-right"><span>SN/LN</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        `;
                let size_10;                let t_foreach_9 = values['lotValues'] ?? [];                if (typeof(t_foreach_9) === 'number') {                  size_10 = t_foreach_9;                  values["snlnLine_size"] = size_10;                  t_foreach_9 = range(size_10);                }                else if ('_length' in t_foreach_9) {                  size_10 = t_foreach_9._length;                  values["snlnLine_size"] = size_10;                }                else if ('length' in t_foreach_9) {                  size_10 = t_foreach_9.length;                  values["snlnLine_size"] = size_10;                }                else if ('size' in t_foreach_9) {                  size_10 = t_foreach_9.size;                  values["snlnLine_size"] = size_10;                }                else {                  size_10 = null;                }                let hasValue_11 = false;                if (t_foreach_9 instanceof Map || t_foreach_9 instanceof MapKey) {                  t_foreach_9 = t_foreach_9.entries();                  hasValue_11 = true;                }                if (typeof t_foreach_9 === 'object' && !isIterable(t_foreach_9)) {                  t_foreach_9 = Object.entries(t_foreach_9);                  hasValue_11 = true;                }
                for (const [index, item] of enumerate(t_foreach_9)) {                  values["snlnLine_index"] = index;                  if (hasValue_11) {                    [values["snlnLine"], values["snlnLine_value"]] = item;                  }                  else {                    values["snlnLine"] = item;                    values["snlnLine_value"] = item;                  }                  values["snlnLine_first"] = values["snlnLine_index"] == 0;                  if (size_10 != null) {                    values["snlnLine_last"] = index + 1 === size_10;                  }                  values["snlnLine_odd"] = index % 2;                  values["snlnLine_even"] = ! values["snlnLine_odd"];                  values["snlnLine_parity"] = values["snlnLine_odd"] ? 'odd' : 'even';
                    log["lastPathNode"] = "/t/t/div/div[1]/t/t[1]/table/tbody/t";
                    log["lastPathNode"] = "/t/t/div/div[1]/t/t[1]/table/tbody/t/tr/td[0]/t";
                    yield `
                            <tr>
                                <td>`;
                    content = values['snlnLine']['productName'];
                    forceDisplay = null;
                    if (content != null && bool(content) !== false) {
                        yield String(content);
                    }
                    else {
                    }
                    log["lastPathNode"] = "/t/t/div/div[1]/t/t[1]/table/tbody/t/tr/td[1]/t[0]";
                    yield `</td>
                                <td class="text-right">
                                    `;
                    content = values['snlnLine']['quantity'];
                    forceDisplay = null;
                    if (content != null && bool(content) !== false) {
                        yield String(content);
                    }
                    else {
                    }
                    log["lastPathNode"] = "/t/t/div/div[1]/t/t[1]/table/tbody/t/tr/td[1]/t[1]";
                    yield `
                                    `;
                    if (await self.userHasGroups("uom.groupUom")) {
                        content = values['snlnLine']['uomName'];
                        forceDisplay = null;
                        if (content != null && bool(content) !== false) {
                            yield String(content);
                        }
                        else {
                        }
                    }
                    log["lastPathNode"] = "/t/t/div/div[1]/t/t[1]/table/tbody/t/tr/td[2]/t";
                    yield `
                                </td>
                                <td class="text-right">`;
                    content = values['snlnLine']['lotName'];
                    forceDisplay = null;
                    if (content != null && bool(content) !== false) {
                        yield String(content);
                    }
                    else {
                    }
                    yield `</td>
                            </tr>
                        `;
                }
                yield `
                    </tbody>
                </table>
            `;
            }
            yield `
          `;
        }
        log["lastPathNode"] = "/t/t/div/p[0]";
        yield `
        
                    </div>
                    `;
        if (['outInvoice', 'inRefund'].includes(values['moveType']) && await values['o'].paymentReference) {
            log["lastPathNode"] = "/t/t/div/p[0]/b/span";
            tFieldTOptions = {};
            result = await self._getField(values['o'], "paymentReference", "o.paymentReference", "span", tFieldTOptions, compileOptions, values);
            [attrs, content, forceDisplay] = result;
            if (content != null && bool(content) !== false) {
                content = await self._compileToStr(content);
            }
            yield `<p name="paymentCommunication">
                        Please use the following communication for your payment : <b>`;
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
            yield `</b>
                    </p>`;
        }
        log["lastPathNode"] = "/t/t/div/p[1]";
        yield `
                    `;
        if (bool(await values['o'].invoicePaymentTermId)) {
            log["lastPathNode"] = "/t/t/div/p[1]/span";
            tFieldTOptions = {};
            result = await self._getField((await values['o'].invoicePaymentTermId), "note", "o.invoicePaymentTermId.note", "span", tFieldTOptions, compileOptions, values);
            [attrs, content, forceDisplay] = result;
            if (content != null && bool(content) !== false) {
                content = await self._compileToStr(content);
            }
            yield `<p name="paymentTerm">
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
                    </p>`;
        }
        log["lastPathNode"] = "/t/t/div/div[2]";
        yield `
                    `;
        if (! values['isHtmlEmpty'](await values['o'].narration)) {
            log["lastPathNode"] = "/t/t/div/div[2]/span";
            tFieldTOptions = {};
            result = await self._getField(values['o'], "narration", "o.narration", "span", tFieldTOptions, compileOptions, values);
            [attrs, content, forceDisplay] = result;
            if (content != null && bool(content) !== false) {
                content = await self._compileToStr(content);
            }
            yield `<div name="comment">
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
                    </div>`;
        }
        log["lastPathNode"] = "/t/t/div/p[2]";
        yield `
                    `;
        if (! values['isHtmlEmpty'](await (await values['o'].fiscalPositionId).note)) {
            log["lastPathNode"] = "/t/t/div/p[2]/span";
            tFieldTOptions = {};
            result = await self._getField((await values['o'].fiscalPositionId), "note", "o.fiscalPositionId.note", "span", tFieldTOptions, compileOptions, values);
            [attrs, content, forceDisplay] = result;
            if (content != null && bool(content) !== false) {
                content = await self._compileToStr(content);
            }
            yield `<p name="note">
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
                    </p>`;
        }
        log["lastPathNode"] = "/t/t/div/p[3]";
        yield `
                    `;
        if (values['o'].invoiceIncotermId) {
            log["lastPathNode"] = "/t/t/div/p[3]/span[0]";
            tFieldTOptions = {};
            result = await self._getField((await values['o'].invoiceIncotermId), "code", "o.invoiceIncotermId.code", "span", tFieldTOptions, compileOptions, values);
            [attrs, content, forceDisplay] = result;
            if (content != null && bool(content) !== false) {
                content = await self._compileToStr(content);
            }
            yield `<p name="incoterm">
                        <strong>Incoterm: </strong>`;
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
            log["lastPathNode"] = "/t/t/div/p[3]/span[1]";
            tFieldTOptions = {};
            result = await self._getField((await values['o'].invoiceIncotermId), "label", "o.invoiceIncotermId.label", "span", tFieldTOptions, compileOptions, values);
            [attrs, content, forceDisplay] = result;
            if (content != null && bool(content) !== false) {
                content = await self._compileToStr(content);
            }
            yield ` - `;
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
                    </p>`;
        }
        log["lastPathNode"] = "/t/t/div/div[3]";
        yield `
                    `;
        if (await values['o'].displayQrCode) {
            log["lastPathNode"] = "/t/t/div/div[3]/p";
            yield `<div id="qrcode">
                        `;
            if (values['qrCodeUrls'][values['o'].id]) {
                log["lastPathNode"] = "/t/t/div/div[3]/p/img";
                attrs = {};
                attrs["class"] = "border border-dark rounded";
                attrs["src"] = values['qrCodeUrls'][values['o'].id];
                tagName = "img";
                yield `<p>
                            <strong class="text-center">Scan me with your banking app.</strong><br/><br/>
                            <img`;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                yield `/>
                        </p>`;
            }
            yield `
                    </div>`;
        }
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
    tCallOptions = Object.assign({}, compileOptions);    Object.assign(tCallOptions, {'callerTemplate': "account.reportInvoiceDocument", 'lastPathNode': "/t/t" })
    for await (const val of (await self._compile("web.externalLayout", tCallOptions))(self, tCallValues)) {            yield val;          }
    yield `
        `;
    } catch(e) {
        _debug('Error in %s at %s: %s', 'template590', log["lastPathNode"], e);
        _debug(String(template590)); // detail code
        throw e;
    }
}