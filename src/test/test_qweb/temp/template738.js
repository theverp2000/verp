async function* template738(self, values, log = {}) {
  let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;
  try {
    // _debug(String(template738.name)); // detail code
    log["lastPathNode"] = "/t";
    log["lastPathNode"] = "/t/t";
    yield `
            `;
    {
      async function* tCallContent(self, values, log) {
        log["lastPathNode"] = "/t/t/t";
        yield `
                `;
        let size_1; let t_foreach_0 = values['docs'] ?? []; if (typeof (t_foreach_0) === 'number') { size_1 = t_foreach_0; values["o_size"] = size_1; t_foreach_0 = range(size_1); } else if ('_length' in t_foreach_0) { size_1 = t_foreach_0._length; values["o_size"] = size_1; } else if ('length' in t_foreach_0) { size_1 = t_foreach_0.length; values["o_size"] = size_1; } else if ('size' in t_foreach_0) { size_1 = t_foreach_0.size; values["o_size"] = size_1; } else { size_1 = null; } let hasValue_2 = false; if (t_foreach_0 instanceof Map || t_foreach_0 instanceof MapKey) { t_foreach_0 = t_foreach_0.entries(); hasValue_2 = true; } if (typeof t_foreach_0 === 'object' && !isIterable(t_foreach_0)) { t_foreach_0 = Object.entries(t_foreach_0); hasValue_2 = true; }
        for (const [index, item] of enumerate(t_foreach_0)) {
          values["o_index"] = index; if (hasValue_2) { [values["o"], values["o_value"]] = item; } else { values["o"] = item; values["o_value"] = item; } values["o_first"] = values["o_index"] == 0; if (size_1 != null) { values["o_last"] = index + 1 === size_1; } values["o_odd"] = index % 2; values["o_even"] = !values["o_odd"]; values["o_parity"] = values["o_odd"] ? 'odd' : 'even';
          log["lastPathNode"] = "/t/t/t";
          log["lastPathNode"] = "/t/t/t/t[0]";
          yield `
                    `;
          values["lang"] = ['inInvoice', 'inRefund'].includes(await values['o'].moveType) ? await (await (await values['o'].invoiceUserId).sudo()).lang : await (await values['o'].partnerId).lang;
          log["lastPathNode"] = "/t/t/t/t[1]";
          yield `
                    `;
          values["printWithPayments"] = true;
          log["lastPathNode"] = "/t/t/t/t[2]";
          yield `
                    `;
          if (await values['o']._getNameInvoiceReport() == 'account.reportInvoiceDocument') {
            tCallValues = Object.assign({}, values);
            tCallValues['0'] = markup('');
            tCallOptions = Object.assign({}, compileOptions); Object.assign(tCallOptions, { 'callerTemplate': "738", 'lastPathNode': "/t/t/t/t[2]" })
            for await (const val of (await self._compile("account.reportInvoiceDocument", tCallOptions))(self, tCallValues)) { yield val; }
          }
          yield `
                `;
        }
        yield `
            `;
      }
      tCallValues = Object.assign({}, values);
      let res = '';
      for await (const str of tCallContent(self, tCallValues, log))
        res = res + str;
      tCallValues['0'] = markup(res)
    }
    tCallOptions = Object.assign({}, compileOptions); Object.assign(tCallOptions, { 'callerTemplate': "738", 'lastPathNode': "/t/t" })
    for await (const val of (await self._compile("web.htmlContainer", tCallOptions))(self, tCallValues)) { yield val; }
    yield `
        `;
  } catch (e) {
    _debug('Error in %s at %s: %s', 'template738', log["lastPathNode"], e);
    _debug(String(template738)); // detail code
    throw e;
  }
}