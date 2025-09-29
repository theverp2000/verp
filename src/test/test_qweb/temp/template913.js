async function* template913(self, values, log={}) {
    _debug("compiling template", template913);
    let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;
    log["lastPathNode"] = "/t";
    log["lastPathNode"] = "/t/t";
    yield `
        `;
    {
    async function* tCallContent(self, values, log) {
        log["lastPathNode"] = "/t/t/t[0]";
        yield `
            `;
        values["classes"] = 'o-onboarding-blue';
        log["lastPathNode"] = "/t/t/t[1]";
        yield `
            `;
        values["bgImage"] = '/account/static/src/img/account_invoice_onboarding_bg.jpg';
        log["lastPathNode"] = "/t/t/t[2]";
        yield `
            `;
        values["closeMethod"] = 'actionCloseAccountInvoiceOnboarding';
        log["lastPathNode"] = "/t/t/t[3]";
        yield `
            `;
        values["closeModel"] = 'res.company';
        log["lastPathNode"] = "/t/t/t[4]";
        yield `
            `;
        async function* qwebTSet__t_t_t_4_() {
            yield `Congratulations! You are all set.`;
        }
        let qwebTSet__t_t_t_4__value = '';
        for await (const val of qwebTSet__t_t_t_4_()) qwebTSet__t_t_t_4__value += val;
        values["textCompleted"] = markup(qwebTSet__t_t_t_4__value);;
        log["lastPathNode"] = "/t/t/t[5]";
        yield `

            `;
        tCallValues = Object.assign({}, values);
        tCallValues['0'] = markup('');
        tCallOptions = Object.assign({}, compileOptions);        Object.assign(tCallOptions, {'callerTemplate': "913", 'lastPathNode': "/t/t/t[5]" })
        for await (const val of (await self._compile("base.onboardingCompanyStep", tCallOptions))(self, tCallValues)) {                yield val;              }
        log["lastPathNode"] = "/t/t/t[6]";
        yield `
            `;
        if (! await (await values["env"].user()).hasGroup('account.groupAccountUser')) {
            tCallValues = Object.assign({}, values);
            tCallValues['0'] = markup('');
            tCallOptions = Object.assign({}, compileOptions);            Object.assign(tCallOptions, {'callerTemplate': "913", 'lastPathNode': "/t/t/t[6]" })
            for await (const val of (await self._compile("account.onboardingBankAccountStep", tCallOptions))(self, tCallValues)) {                    yield val;                  }
        }
        log["lastPathNode"] = "/t/t/t[7]";
        yield `
            `;
        tCallValues = Object.assign({}, values);
        tCallValues['0'] = markup('');
        tCallOptions = Object.assign({}, compileOptions);        Object.assign(tCallOptions, {'callerTemplate': "913", 'lastPathNode': "/t/t/t[7]" })
        for await (const val of (await self._compile("account.onboardingInvoiceLayoutStep", tCallOptions))(self, tCallValues)) {                yield val;              }
        log["lastPathNode"] = "/t/t/t[8]";
        yield `
            `;
        tCallValues = Object.assign({}, values);
        tCallValues['0'] = markup('');
        tCallOptions = Object.assign({}, compileOptions);        Object.assign(tCallOptions, {'callerTemplate': "913", 'lastPathNode': "/t/t/t[8]" })
        for await (const val of (await self._compile("account.onboardingCreateInvoiceStep", tCallOptions))(self, tCallValues)) {                yield val;              }
        yield `
        `;
    }
    tCallValues = Object.assign({},  values);
    let res = '';
    for await (const str of tCallContent(self, tCallValues, log)) 
        res = res + str;
    tCallValues['0'] = markup(res)
    }
    tCallOptions = Object.assign({}, compileOptions);    Object.assign(tCallOptions, {'callerTemplate': "913", 'lastPathNode': "/t/t" })
    for await (const val of (await self._compile("base.onboardingContainer", tCallOptions))(self, tCallValues)) {            yield val;          }
    yield `
    `;
}