async function* template334(self, values, log={}) {
    let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;
    try {
        _debug(String(template334.name)); // detail code
    log["lastPathNode"] = "/t";
    log["lastPathNode"] = "/t/t";
    yield `
        `;
    {
    async function* tCallContent(self, values, log) {
        log["lastPathNode"] = "/t/t/t";
        yield `
            `;
        values["isPortal"] = true;
        log["lastPathNode"] = "/t/t/div[0]";
        yield `
    
            `;
        if (! values['noBreadcrumbs'] && ! values['myDetails'] && ! values['breadcrumbsSearchbar']) {
            log["lastPathNode"] = "/t/t/div[0]/div/div[0]/t";
            yield `<div class="o-portal container mt-3" data-oe-model="ir.ui.view" data-oe-id="334" data-oe-field="arch" data-oe-xpath="/t[1]/t[1]/div[1]">
                <div class="row align-items-center bg-white no-gutters border rounded">
                    <div class="col-10">
                        `;
            tCallValues = Object.assign({}, values);
            tCallValues['0'] = markup('');
            tCallOptions = Object.assign({}, compileOptions);            Object.assign(tCallOptions, {'callerTemplate': "portal.portalLayout", 'lastPathNode': "/t/t/div[0]/div/div[0]/t" })
            for await (const val of (await self._compile("portal.portalBreadcrumbs", tCallOptions))(self, tCallValues)) {                    yield val;                  }
            log["lastPathNode"] = "/t/t/div[0]/div/div[1]";
            yield `
                    </div>
                    `;
            if (values['prevRecord'] || values['nextRecord']) {
                log["lastPathNode"] = "/t/t/div[0]/div/div[1]/t";
                yield `<div class="col-2 flex-grow-0 text-center">
                        `;
                tCallValues = Object.assign({}, values);
                tCallValues['0'] = markup('');
                tCallOptions = Object.assign({}, compileOptions);                Object.assign(tCallOptions, {'callerTemplate': "portal.portalLayout", 'lastPathNode': "/t/t/div[0]/div/div[1]/t" })
                for await (const val of (await self._compile("portal.recordPager", tCallOptions))(self, tCallValues)) {                        yield val;                      }
                yield `
                    </div>`;
            }
            yield `
                </div>
            </div>`;
        }
        log["lastPathNode"] = "/t/t/div[1]/div/t[0]";
        yield `
            <div id="wrap" class="o-portal-wrap" data-oe-model="ir.ui.view" data-oe-id="334" data-oe-field="arch" data-oe-xpath="/t[1]/t[1]/div[2]">
                <div class="container mb64">
                    `;
        if (values['myDetails']) {
            log["lastPathNode"] = "/t/t/div[1]/div/t[0]/div/div[0]";
            attrs = {};
            attrs["class"] = "col-12 col-md col-lg-6";
            tagName = "div";
            yield `
                        <div class="row justify-content-between mt-4">
                            <div`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            log["lastPathNode"] = "/t/t/div[1]/div/t[0]/div/div[0]/t";
            yield `>
                                `;
            for (const str of Array.from(values['0'] || [])) yield str;
            log["lastPathNode"] = "/t/t/div[1]/div/t[0]/div/div[1]/div[0]";
            yield `
                            </div>
                            <div id="oMySidebar" class="pt-3 pt-lg-0 col-12 col-md col-lg-4 col-xl-3 o-my-sidebar">
                                `;
            if (values['salesUser']) {
                log["lastPathNode"] = "/t/t/div[1]/div/t[0]/div/div[1]/div[0]/t";
                yield `<div class="o-my-contact">
                                    `;
                tCallValues = Object.assign({}, values);
                tCallValues['0'] = markup('');
                tCallOptions = Object.assign({}, compileOptions);                Object.assign(tCallOptions, {'callerTemplate': "portal.portalLayout", 'lastPathNode': "/t/t/div[1]/div/t[0]/div/div[1]/div[0]/t" })
                for await (const val of (await self._compile("portal.portalContact", tCallOptions))(self, tCallValues)) {                        yield val;                      }
                yield `
                                </div>`;
            }
            log["lastPathNode"] = "/t/t/div[1]/div/t[0]/div/div[1]/div[1]/div[0]";
            tFieldTOptions = {"widget": "contact", "fields": ["email", "phone", "address", "label"]}
            result = await self._getField(values['userId'], "partnerId", "userId.partnerId", "div", tFieldTOptions, compileOptions, values);
            [attrs, content, forceDisplay] = result;
            if (content != null && content !== false) {
                content = await self._compileToStr(content);
            }
            yield `
                                <div class="o-portal-my-details">
                                    <h4>Details <a role="button" href="/my/account" class="btn btn-sm btn-link"><i class="fa fa-pencil"></i> Edit</a></h4>
                                    <hr class="mt-1 mb-0"/>
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
            log["lastPathNode"] = "/t/t/div[1]/div/t[0]/div/div[1]/div[1]/t[0]";
            yield `
                                
            
            `;
            values["partnerId"] = await (await values['env'].user()).partnerId;
            log["lastPathNode"] = "/t/t/div[1]/div/t[0]/div/div[1]/div[1]/t[1]";
            yield `
            `;
            values["acquirersAllowingTokenization"] = await (await values['env'].items('payment.acquirer').sudo())._getCompatibleAcquirers((await values['env'].company()).id, values['partner'].id, {'forceTokenization': true, 'isValidation': true});
            log["lastPathNode"] = "/t/t/div[1]/div/t[0]/div/div[1]/div[1]/t[2]";
            yield `
            `;
            values["existingTokens"] = (await values['partner'].paymentTokenIds).concat(await (await (await values['partner'].commercialPartnerId).sudo()).paymentTokenIds);
            log["lastPathNode"] = "/t/t/div[1]/div/t[0]/div/div[1]/div[1]/div[1]";
            yield `
            
            `;
            if (values['acquirersAllowingTokenization'] || values['existingTokens']) {
                yield `<div class="manage-payment-method mt16" data-oe-id="958" data-oe-xpath="/data/xpath/div" data-oe-model="ir.ui.view" data-oe-field="arch">
                <a href="/my/paymentMethod">Manage payment methods</a>
            </div>`;
            }
            yield `
        </div>
                                <div class="o-portal-my-security mt-3">
                                    <h4>Account Security </h4>
                                    <hr class="mt-1 mb-1"/>
                                    <a href="/my/security"><i class="fa fa-pencil mx-1"></i>Edit Security Settings</a>
                                </div>
                            </div>
                        </div>
                    `;
        }
        else {
            log["lastPathNode"] = "/t/t/div[1]/div/t[1]";
            log["lastPathNode"] = "/t/t/div[1]/div/t[1]/t";
            yield `
                        `;
            for (const str of Array.from(values['0'] || [])) yield str;
            yield `
                    `;
        }
        log["lastPathNode"] = "/t/t/div[1]/div/t[1]";
        yield `
                    
                </div>
            </div>
        `;
    }
    tCallValues = Object.assign({},  values);
    let res = '';
    for await (const str of tCallContent(self, tCallValues, log)) 
        res = res + str;
    tCallValues['0'] = markup(res)
    }
    tCallOptions = Object.assign({}, compileOptions);    Object.assign(tCallOptions, {'callerTemplate': "portal.portalLayout", 'lastPathNode': "/t/t" })
    for await (const val of (await self._compile("portal.frontendLayout", tCallOptions))(self, tCallValues)) {            yield val;          }
    yield `
    `;
    } catch(e) {
        // _debug('Error in %s at %s: %s', 'template334', log["lastPathNode"], e);
        _debug(String(template334)); // detail code
        throw e;
    }
  }