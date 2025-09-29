async function* template(self, values, log={}) {
    let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;
    try {
        _debug(String(template.name)); // detail code
    log["lastPathNode"] = "/div/body/table/tr[0]/td/table/tbody/t";
    yield `<div><body>
    <table border="0" cellpadding="0" cellspacing="0" style="padding-top: 16px; background-color: #F1F1F1; font-family:Verdana, Arial,sans-serif; color: #454748; width: 100%; border-collapse:separate;"><tr><td align="center">
    <table border="0" cellpadding="0" cellspacing="0" width="590" style="padding: 16px; background-color: white; color: #454748; border-collapse:separate;">
    <tbody>
    
    `;
    values["companyId"] = await values['object'].companyId;
    log["lastPathNode"] = "/div/body/table/tr[0]/td/table/tbody/tr[0]/td/table/tr[0]/td[0]/span[1]/t";
    yield `
    <tr>
        <td align="center" style="min-width: 590px;">
            <table border="0" cellpadding="0" cellspacing="0" width="590" style="min-width: 590px; background-color: white; padding: 0px 8px 0px 8px; border-collapse:separate;">
                <tr><td valign="middle">
                    <span style="font-size: 10px;">Welcome to Verp</span><br/>
                    <span style="font-size: 20px; font-weight: bold;">
                        `;
    content = await values['object'].label || '';
    forceDisplay = null;
    if (content != null && bool(content) !== false) {
        yield String(content);
    }
    else {
        yield `Marc Demo`;
    }
    log["lastPathNode"] = "/div/body/table/tr[0]/td/table/tbody/tr[0]/td/table/tr[0]/td[1]/img";
    attrs = {};
    attrs["style"] = "padding: 0px; margin: 0px; height: auto; width: 80px;";
    attrs["src"] = format("/logo.png?company=%s", await self._compileToStr( (await values['object'].companyId).id ));
    attrs["alt"] = await values['companyId'].label;
    tagName = "img";
    yield `
                    </span>
                </td><td valign="middle" align="right">
                    <img`;
    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
    for (const [name, value] of Object.entries(attrs)) {
          if (value || typeof(value) === 'string') {
                yield ' ' + String(name) + '="' + String(value) + '"'
          }
    }
    log["lastPathNode"] = "/div/body/table/tr[0]/td/table/tbody/tr[1]/td/table/tr[0]/td/div/t[0]";
    yield `/>
                </td></tr>
                <tr><td colspan="2" style="text-align:center;">
                  <hr width="100%" style="background-color:rgb(204,204,204);border:medium none;clear:both;display:block;font-size:0px;min-height:1px;line-height:0; margin: 16px 0px 16px 0px;"/>
                </td></tr>
            </table>
        </td>
    </tr>
    
    <tr>
        <td align="center" style="min-width: 590px;">
            <table border="0" cellpadding="0" cellspacing="0" width="590" style="min-width: 590px; background-color: white; padding: 0px 8px 0px 8px; border-collapse:separate;">
                <tr><td valign="top" style="font-size: 13px;">
                    <div>
                        Dear `;
    content = await values['object'].label || '';
    forceDisplay = null;
    if (content != null && bool(content) !== false) {
        yield String(content);
    }
    else {
        yield `Marc Demo`;
    }
    log["lastPathNode"] = "/div/body/table/tr[0]/td/table/tbody/tr[1]/td/table/tr[0]/td/div/t[1]";
    yield `,<br/><br/>
                        You have been invited by `;
    content = await (await values['object'].createdUid).label || '';
    forceDisplay = null;
    if (content != null && bool(content) !== false) {
        yield String(content);
    }
    else {
        yield `VerpBot`;
    }
    log["lastPathNode"] = "/div/body/table/tr[0]/td/table/tbody/tr[1]/td/table/tr[0]/td/div/t[2]";
    yield ` of `;
    content = await values['companyId'].label || '';
    forceDisplay = null;
    if (content != null && bool(content) !== false) {
        yield String(content);
    }
    else {
        yield `YourCompany`;
    }
    log["lastPathNode"] = "/div/body/table/tr[0]/td/table/tbody/tr[1]/td/table/tr[0]/td/div/div/a";
    attrs = {};
    attrs["style"] = "background-color: #875A7B; padding: 8px 16px 8px 16px; text-decoration: none; color: #fff; border-radius: 5px; font-size:13px;";
    attrs["href"] = await values['object'].signupUrl;
    tagName = "a";
    yield ` to connect on Verp.
                        <div style="margin: 16px 0px 16px 0px;">
                            <a`;
    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
    for (const [name, value] of Object.entries(attrs)) {
          if (value || typeof(value) === 'string') {
                yield ' ' + String(name) + '="' + String(value) + '"'
          }
    }
    log["lastPathNode"] = "/div/body/table/tr[0]/td/table/tbody/tr[1]/td/table/tr[0]/td/div/t[3]";
    yield `>
                                Accept invitation
                            </a>
                        </div>
                        `;
    values["websiteUrl"] = await values['object'].getBaseUrl();
    log["lastPathNode"] = "/div/body/table/tr[0]/td/table/tbody/tr[1]/td/table/tr[0]/td/div/b[0]/a";
    yield `
                        Your Verp domain is: <b>`;
    content = values['websiteUrl'] || '';
    forceDisplay = null;
    if (content != null && bool(content) !== false) {
        attrs = {};
        attrs["href"] = values['websiteUrl'];
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
        attrs = {};
        attrs["href"] = values['websiteUrl'];
        tagName = "a";
        yield `<a`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        yield `>`;
        yield `http://yourcompany.theverp.com</a>`;
    }
    log["lastPathNode"] = "/div/body/table/tr[0]/td/table/tbody/tr[1]/td/table/tr[0]/td/div/b[1]/a";
    yield `</b><br/>
                        Your sign in email is: <b>`;
    content = await values['object'].email || '';
    forceDisplay = null;
    if (content != null && bool(content) !== false) {
        attrs = {};
        attrs["target"] = "_blank";
        attrs["href"] = format("/web/login?login=%s", await self._compileToStr( await values['object'].email ));
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
        attrs = {};
        attrs["target"] = "_blank";
        attrs["href"] = format("/web/login?login=%s", await self._compileToStr( await values['object'].email ));
        tagName = "a";
        yield `<a`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        yield `>`;
        yield `mark.brown23@example.com</a>`;
    }
    log["lastPathNode"] = "/div/body/table/tr[0]/td/table/tbody/tr[1]/td/table/tr[0]/td/div/t[4]";
    yield `</b><br/><br/>
                        Never heard of Verp? It’s an all-in-one business software loved by 7+ million users. It will considerably improve your experience at work and increase your productivity.
                        <br/><br/>
                        Have a look at the <a href="https://www.theverp.com/page/tour?utmSource=db&amp;utmMedium=auth" style="color: #875A7B;">Verp Tour</a> to discover the tool.
                        <br/><br/>
                        Enjoy Verp!<br/>
                        --<br/>The `;
    content = await values['companyId'].label || '';
    forceDisplay = null;
    if (content != null && bool(content) !== false) {
        yield String(content);
    }
    else {
        yield `YourCompany`;
    }
    log["lastPathNode"] = "/div/body/table/tr[0]/td/table/tbody/tr[2]/td/table/tr[0]/td/t";
    yield ` Team
                    </div>
                </td></tr>
                <tr><td style="text-align:center;">
                  <hr width="100%" style="background-color:rgb(204,204,204);border:medium none;clear:both;display:block;font-size:0px;min-height:1px;line-height:0; margin: 16px 0px 16px 0px;"/>
                </td></tr>
            </table>
        </td>
    </tr>
    
    <tr>
        <td align="center" style="min-width: 590px;">
            <table border="0" cellpadding="0" cellspacing="0" width="590" style="min-width: 590px; background-color: white; font-size: 11px; padding: 0px 8px 0px 8px; border-collapse:separate;">
                <tr><td valign="middle" align="left">
                    `;
    content = await values['companyId'].label || '';
    forceDisplay = null;
    if (content != null && bool(content) !== false) {
        yield String(content);
    }
    else {
        yield `YourCompany`;
    }
    log["lastPathNode"] = "/div/body/table/tr[0]/td/table/tbody/tr[2]/td/table/tr[1]/td/t[0]";
    yield `
                </td></tr>
                <tr><td valign="middle" align="left" style="opacity: 0.7;">
                    `;
    content = await values['companyId'].phone || '';
    forceDisplay = null;
    if (content != null && bool(content) !== false) {
        yield String(content);
    }
    else {
        yield `+1 650-123-4567`;
    }
    log["lastPathNode"] = "/div/body/table/tr[0]/td/table/tbody/tr[2]/td/table/tr[1]/td/t[1]";
    yield `
                    `;
    if (await values['companyId'].email) {
        log["lastPathNode"] = "/div/body/table/tr[0]/td/table/tbody/tr[2]/td/table/tr[1]/td/t[1]/a";
        yield `
                        | `;
        content = await values['companyId'].email || '';
        forceDisplay = null;
        if (content != null && bool(content) !== false) {
            attrs = {};
            attrs["style"] = "text-decoration:none; color: #454748;";
            attrs["href"] = format('mailto:%s', await values['companyId'].email);
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
            attrs = {};
            attrs["style"] = "text-decoration:none; color: #454748;";
            attrs["href"] = format('mailto:%s', await values['companyId'].email);
            tagName = "a";
            yield `<a`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            yield `>`;
            yield `info@yourcompany.com</a>`;
        }
        yield `
                    `;
    }
    log["lastPathNode"] = "/div/body/table/tr[0]/td/table/tbody/tr[2]/td/table/tr[1]/td/t[2]";
    yield `
                    `;
    if (await values['companyId'].website) {
        log["lastPathNode"] = "/div/body/table/tr[0]/td/table/tbody/tr[2]/td/table/tr[1]/td/t[2]/a";
        yield `
                        | `;
        content = await values['companyId'].website || '';
        forceDisplay = null;
        if (content != null && bool(content) !== false) {
            attrs = {};
            attrs["style"] = "text-decoration:none; color: #454748;";
            attrs["href"] = format('%s', await values['companyId'].website);
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
            attrs = {};
            attrs["style"] = "text-decoration:none; color: #454748;";
            attrs["href"] = format('%s', await values['companyId'].website);
            tagName = "a";
            yield `<a`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            yield `>`;
            yield `http://www.example.com</a>`;
        }
        yield `
                    `;
    }
    yield `
                </td></tr>
            </table>
        </td>
    </tr>
    </tbody>
    </table>
    </td></tr>
    
    <tr><td align="center" style="min-width: 590px;">
    <table border="0" cellpadding="0" cellspacing="0" width="590" style="min-width: 590px; background-color: #F1F1F1; color: #454748; padding: 8px; border-collapse:separate;">
      <tr><td style="text-align: center; font-size: 13px;">
        Powered by <a target="_blank" href="https://www.theverp.com?utmSource=db&amp;utmMedium=auth" style="color: #875A7B;">Verp</a>
      </td></tr>
    </table>
    </td></tr>
    </table></body></div>`;
    } catch(e) {
        // _debug('Error in %s at %s: %s', 'template', log["lastPathNode"], e);
        _debug(String(template)); // detail code
        throw e;
    }
  }