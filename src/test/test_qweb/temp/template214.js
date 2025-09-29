async function* template214(self, values, log={}) {
    let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;
    try {
        _debug(String(template214.name)); // detail code
    log["lastPathNode"] = "/t";
    log["lastPathNode"] = "/t/t";
    yield `
        `;
    let size_1;    let t_foreach_0 = values['companyIds'] ?? [];    if (typeof(t_foreach_0) === 'number') {      size_1 = t_foreach_0;      values["company_size"] = size_1;      t_foreach_0 = range(size_1);    }    else if ('_length' in t_foreach_0) {      size_1 = t_foreach_0._length;      values["company_size"] = size_1;    }    else if ('length' in t_foreach_0) {      size_1 = t_foreach_0.length;      values["company_size"] = size_1;    }    else if ('size' in t_foreach_0) {      size_1 = t_foreach_0.size;      values["company_size"] = size_1;    }    else {      size_1 = null;    }    let hasValue_2 = false;    if (t_foreach_0 instanceof Map || t_foreach_0 instanceof MapKey) {      t_foreach_0 = t_foreach_0.entries();      hasValue_2 = true;    }    if (typeof t_foreach_0 === 'object' && !isIterable(t_foreach_0)) {      t_foreach_0 = Object.entries(t_foreach_0);      hasValue_2 = true;    }
    for (const [index, item] of enumerate(t_foreach_0)) {      values["company_index"] = index;      if (hasValue_2) {        [values["company"], values["company_value"]] = item;      }      else {        values["company"] = item;        values["company_value"] = item;      }      values["company_first"] = values["company_index"] == 0;      if (size_1 != null) {        values["company_last"] = index + 1 === size_1;      }      values["company_odd"] = index % 2;      values["company_even"] = ! values["company_odd"];      values["company_parity"] = values["company_odd"] ? 'odd' : 'even';
        log["lastPathNode"] = "/t/t";
        log["lastPathNode"] = "/t/t/t[0]";
        yield `
            `;
        values["font"] = await values['company'].font || 'Lato';
        log["lastPathNode"] = "/t/t/t[1]";
        yield `
            `;
        values["primary"] = await values['company'].primaryColor || 'black';
        log["lastPathNode"] = "/t/t/t[2]";
        yield `
            `;
        values["secondary"] = await values['company'].secondaryColor || 'black';
        log["lastPathNode"] = "/t/t/t[3]";
        yield `
            `;
        values["externalReportLayoutId"] = await values['company'].externalReportLayoutId;
        log["lastPathNode"] = "/t/t/t[4]";
        yield `
            `;
        values["layout"] = await values['externalReportLayoutId'].key || 'web.externalLayoutStandard';
        log["lastPathNode"] = "/t/t/t[5]";
        yield `
                .o-company-`;
        content = values['company'].id.valueOf();
        forceDisplay = null;
        if (content != null && content !== false) {
            yield String(content);
        }
        else {
        }
        log["lastPathNode"] = "/t/t/t[6]";
        yield `-layout {
                font-family: `;
        content = values['font'].valueOf();
        forceDisplay = null;
        if (content != null && content !== false) {
            yield String(content);
        }
        else {
        }
        log["lastPathNode"] = "/t/t/t[7]";
        yield `;
            `;
        if (values['layout'] === 'web.externalLayoutStriped') {
            log["lastPathNode"] = "/t/t/t[7]/t[0]";
            yield `
                &.o-report-layout-striped {
                   strong {
                        color: `;
            content = values['secondary'].valueOf();
            forceDisplay = null;
            if (content != null && content !== false) {
                yield String(content);
            }
            else {
            }
            log["lastPathNode"] = "/t/t/t[7]/t[1]";
            yield `;
                    }
                    h2 {
                        color: `;
            content = values['primary'].valueOf();
            forceDisplay = null;
            if (content != null && content !== false) {
                yield String(content);
            }
            else {
            }
            log["lastPathNode"] = "/t/t/t[7]/t[2]";
            yield `;
                    }
                    thead tr th {
                        color: `;
            content = values['secondary'].valueOf();
            forceDisplay = null;
            if (content != null && content !== false) {
                yield String(content);
            }
            else {
            }
            log["lastPathNode"] = "/t/t/t[7]/t[3]";
            yield `;
                    }
                }
                .row > div > table,
                div#total table {
                    &:first-child,
                    &:last-child,
                    &.o-subtotal,
                    &.o-total {
                        strong {
                            color: `;
            content = values['primary'].valueOf();
            forceDisplay = null;
            if (content != null && content !== false) {
                yield String(content);
            }
            else {
            }
            yield `;
                        }
                    }
                }
            `;
        }
        else {
            log["lastPathNode"] = "/t/t/t[8]";
            if (values['layout'] === 'web.externalLayoutBoxed') {
                log["lastPathNode"] = "/t/t/t[8]/t[0]";
                yield `
                &.o-report-layout-boxed {
                    #total strong {
                        color: `;
                content = values['primary'].valueOf();
                forceDisplay = null;
                if (content != null && content !== false) {
                    yield String(content);
                }
                else {
                }
                log["lastPathNode"] = "/t/t/t[8]/t[1]";
                yield `;
                    }
                    #informations strong {
                        color: `;
                content = values['secondary'].valueOf();
                forceDisplay = null;
                if (content != null && content !== false) {
                    yield String(content);
                }
                else {
                }
                log["lastPathNode"] = "/t/t/t[8]/t[2]";
                yield `;
                    }
                    h2 span {
                        color: `;
                content = values['primary'].valueOf();
                forceDisplay = null;
                if (content != null && content !== false) {
                    yield String(content);
                }
                else {
                }
                log["lastPathNode"] = "/t/t/t[8]/t[3]";
                yield `;
                    }
                    table {
                        thead {
                            tr th {
                                color: `;
                content = values['secondary'].valueOf();
                forceDisplay = null;
                if (content != null && content !== false) {
                    yield String(content);
                }
                else {
                }
                log["lastPathNode"] = "/t/t/t[8]/t[4]";
                yield `;
                            }
                        }
                        tbody tr td {
                            &.o-line-section td {
                                    background-color: rgba(`;
                content = values['primary'].valueOf();
                forceDisplay = null;
                if (content != null && content !== false) {
                    yield String(content);
                }
                else {
                }
                log["lastPathNode"] = "/t/t/t[8]/t[5]";
                yield `, 0.7);
                                }
                            &.is-subtotal,
                                td.o-price-total {
                                    background-color: rgba(`;
                content = values['secondary'].valueOf();
                forceDisplay = null;
                if (content != null && content !== false) {
                    yield String(content);
                }
                else {
                }
                log["lastPathNode"] = "/t/t/t[8]/t[6]";
                yield `, 0.1);
                                }
                        }
                    }
                }
                .row > div > table,
                div#total table {
                    tr {
                        &.o-total td {
                            background-color: rgba(`;
                content = values['primary'].valueOf();
                forceDisplay = null;
                if (content != null && content !== false) {
                    yield String(content);
                }
                else {
                }
                yield `, 0.9);
                        }
                    }
                }
            `;
            }
            else {
                log["lastPathNode"] = "/t/t/t[9]";
                if (values['layout'] === 'web.externalLayoutBold') {
                    log["lastPathNode"] = "/t/t/t[9]/t[0]";
                    yield `
                &.o-clean-footer {
                    border-top: 3px solid `;
                    content = values['secondary'].valueOf();
                    forceDisplay = null;
                    if (content != null && content !== false) {
                        yield String(content);
                    }
                    else {
                    }
                    log["lastPathNode"] = "/t/t/t[9]/t[1]";
                    yield `;
                    h4 {
                        color: `;
                    content = values['secondary'].valueOf();
                    forceDisplay = null;
                    if (content != null && content !== false) {
                        yield String(content);
                    }
                    else {
                    }
                    log["lastPathNode"] = "/t/t/t[9]/t[2]";
                    yield `;
                    }
                    .pagenumber {
                        border: 3px solid `;
                    content = values['primary'].valueOf();
                    forceDisplay = null;
                    if (content != null && content !== false) {
                        yield String(content);
                    }
                    else {
                    }
                    log["lastPathNode"] = "/t/t/t[9]/t[3]";
                    yield `;
                        background-color: `;
                    content = values['secondary'].valueOf();
                    forceDisplay = null;
                    if (content != null && content !== false) {
                        yield String(content);
                    }
                    else {
                    }
                    log["lastPathNode"] = "/t/t/t[9]/t[4]";
                    yield `;
                    }
                }
                &.o-report-layout-bold {
                    h1, h2, h3 {
                        color: `;
                    content = values['primary'].valueOf();
                    forceDisplay = null;
                    if (content != null && content !== false) {
                        yield String(content);
                    }
                    else {
                    }
                    log["lastPathNode"] = "/t/t/t[9]/t[5]";
                    yield `;
                    }
                    strong {
                        color: `;
                    content = values['secondary'].valueOf();
                    forceDisplay = null;
                    if (content != null && content !== false) {
                        yield String(content);
                    }
                    else {
                    }
                    log["lastPathNode"] = "/t/t/t[9]/t[6]";
                    yield `;
                    }
                    table {
                       thead {
                           color: `;
                    content = values['secondary'].valueOf();
                    forceDisplay = null;
                    if (content != null && content !== false) {
                        yield String(content);
                    }
                    else {
                    }
                    log["lastPathNode"] = "/t/t/t[9]/t[7]";
                    yield `;
                           tr th {
                                border-top: 3px solid `;
                    content = values['secondary'].valueOf();
                    forceDisplay = null;
                    if (content != null && content !== false) {
                        yield String(content);
                    }
                    else {
                    }
                    log["lastPathNode"] = "/t/t/t[9]/t[8]";
                    yield ` !important;
                            }
                        }
                        tbody {
                            tr:last-child td {
                                border-bottom: 3px solid `;
                    content = values['secondary'].valueOf();
                    forceDisplay = null;
                    if (content != null && content !== false) {
                        yield String(content);
                    }
                    else {
                    }
                    log["lastPathNode"] = "/t/t/t[9]/t[9]";
                    yield `;
                            }
                        }
                    }
                    #total {
                        strong {
                            color: `;
                    content = values['secondary'].valueOf();
                    forceDisplay = null;
                    if (content != null && content !== false) {
                        yield String(content);
                    }
                    else {
                    }
                    yield `;
                        }
                    }
                }
            `;
                }
                else {
                    log["lastPathNode"] = "/t/t/t[10]";
                    if (values['layout'] === 'web.externalLayoutStandard') {
                        log["lastPathNode"] = "/t/t/t[10]/t[0]";
                        yield `
                &.o-report-layout-standard {
                    h2 {
                        color: `;
                        content = values['primary'].valueOf();
                        forceDisplay = null;
                        if (content != null && content !== false) {
                            yield String(content);
                        }
                        else {
                        }
                        log["lastPathNode"] = "/t/t/t[10]/t[1]";
                        yield `;
                    }
                    #informations strong {
                        color: `;
                        content = values['secondary'].valueOf();
                        forceDisplay = null;
                        if (content != null && content !== false) {
                            yield String(content);
                        }
                        else {
                        }
                        log["lastPathNode"] = "/t/t/t[10]/t[2]";
                        yield `;
                    }
                    #total strong {
                        color: `;
                        content = values['primary'].valueOf();
                        forceDisplay = null;
                        if (content != null && content !== false) {
                            yield String(content);
                        }
                        else {
                        }
                        log["lastPathNode"] = "/t/t/t[10]/t[3]";
                        yield `;
                    }
                    table {
                        thead {
                            color: `;
                        content = values['secondary'].valueOf();
                        forceDisplay = null;
                        if (content != null && content !== false) {
                            yield String(content);
                        }
                        else {
                        }
                        yield `;
                        }
                    }
                }
            `;
                    }
                }
            }
        }
        log["lastPathNode"] = "/t/t/t[8]";
        log["lastPathNode"] = "/t/t/t[9]";
        log["lastPathNode"] = "/t/t/t[10]";
        yield `
            
            
            
            }
        `;
    }
    yield `
    `;
    } catch(e) {
        // _debug('Error in %s at %s: %s', 'template214', log["lastPathNode"], e);
        _debug(String(template214)); // detail code
        throw e;
    }
}