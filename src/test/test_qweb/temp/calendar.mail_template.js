async function* template(self, values, log={}) {
    let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;
    try {
    log["lastPathNode"] = "/div/body/div/t[0]";
    yield `<div><body>
<div>
    `;
    values["eventId"] = await values['object'].eventId;
    log["lastPathNode"] = "/div/body/div/t[1]";
    yield `
    `;
    values["partnerId"] = await values['object'].partnerId;
    log["lastPathNode"] = "/div/body/div/t[2]";
    yield `
    `;
    values["accessToken"] = await values['object'].accessToken;
    log["lastPathNode"] = "/div/body/div/t[3]";
    yield `
    `;
    values["colors"] = {'needsAction': 'grey', 'accepted': 'green', 'tentative': '#FFFF00', 'declined': 'red'};
    log["lastPathNode"] = "/div/body/div/t[4]";
    yield `
    `;
    values["isOnline"] = 'appointmentTypeId' in values['eventId']._fields && bool(await values['eventId'].appointmentTypeId);
    log["lastPathNode"] = "/div/body/div/t[5]";
    yield `
    `;
    values["appointmentType"] = values['isOnline'] && await values['eventId'].appointmentTypeId;
    log["lastPathNode"] = "/div/body/div/t[6]";
    yield `
    `;
    values["customer"] = await values['eventId'].findPartnerCustomer();
    log["lastPathNode"] = "/div/body/div/t[7]";
    yield `
    `;
    values["targetResponsible"] = values['partnerId'].eq(await values['eventId'].partnerId);
    log["lastPathNode"] = "/div/body/div/t[8]";
    yield `
    `;
    values["targetCustomer"] = values['partnerId'].eq(values['customer']);
    log["lastPathNode"] = "/div/body/div/t[9]";
    yield `
    `;
    values["recurrent"] = bool(await values['object'].recurrenceId) && !values['ctx']['calendarTemplateIgnoreRecurrence'];
    log["lastPathNode"] = "/div/body/div/p/t[0]";
    yield `

    <p>
        Hello `;
    content = await values['object'].commonName || '';
    forceDisplay = null;
    if (content != null && content !== false) {
        yield String(content);
    }
    else {
        yield `Wood Corner`;
    }
    log["lastPathNode"] = "/div/body/div/p/t[1]";
    yield `,<br/><br/>
        `;
    if (values['isOnline'] && values['targetCustomer']) {
        log["lastPathNode"] = "/div/body/div/p/t[1]/strong";
        yield `
            Your appointment `;
        content = await values['appointmentType'].label || '';
        forceDisplay = null;
        if (content != null && content !== false) {
            yield `<strong>`;
            yield String(content);
            yield `</strong>`;
        }
        else {
            yield `<strong>`;
            yield `Schedule a Demo</strong>`;
        }
        log["lastPathNode"] = "/div/body/div/p/t[1]/t";
        yield ` `;
        if (await values['appointmentType'].category !== 'custom') {
            log["lastPathNode"] = "/div/body/div/p/t[1]/t/t";
            yield ` with `;
            content = await (await values['eventId'].userId).label || '';
            forceDisplay = null;
            if (content != null && content !== false) {
                yield String(content);
            }
            else {
                yield `Ready Mat`;
            }
        }
        yield ` has been booked.
        `;
    }
    else {
        log["lastPathNode"] = "/div/body/div/p/t[2]";
        if (values['isOnline'] && values['targetResponsible']) {
            log["lastPathNode"] = "/div/body/div/p/t[2]/t[0]";
            yield `
            `;
            if (values['customer'].ok) {
                log["lastPathNode"] = "/div/body/div/p/t[2]/t[0]/t";
                yield `
                `;
                content = await values['customer'].label || '';
                forceDisplay = null;
                if (content != null && content !== false) {
                    yield String(content);
                }
                else {
                }
                log["lastPathNode"] = "/div/body/div/p/t[2]/t[0]/strong";
                yield ` scheduled the following appointment `;
                content = await values['appointmentType'].label || '';
                forceDisplay = null;
                if (content != null && content !== false) {
                    yield `<strong>`;
                    yield String(content);
                    yield `</strong>`;
                }
                else {
                    yield `<strong>`;
                    yield `Schedule a Demo</strong>`;
                }
                yield ` with you.
            `;
            }
            else {
                log["lastPathNode"] = "/div/body/div/p/t[2]/t[1]";
                log["lastPathNode"] = "/div/body/div/p/t[2]/t[1]/strong";
                yield `
                Your appointment `;
                content = await values['appointmentType'].label || '';
                forceDisplay = null;
                if (content != null && content !== false) {
                    yield `<strong>`;
                    yield String(content);
                    yield `</strong>`;
                }
                else {
                    yield `<strong>`;
                    yield `Schedule a Demo</strong>`;
                }
                yield ` has been booked.
            `;
            }
            log["lastPathNode"] = "/div/body/div/p/t[2]/t[1]";
            yield `
            
        `;
        }
        else {
            log["lastPathNode"] = "/div/body/div/p/t[3]";
            if (! values['targetResponsible']) {
                log["lastPathNode"] = "/div/body/div/p/t[3]/t";
                yield `
            `;
                content = await (await (await values['eventId'].userId).partnerId).label || '';
                forceDisplay = null;
                if (content != null && content !== false) {
                    yield String(content);
                }
                else {
                    yield `Colleen Diaz`;
                }
                log["lastPathNode"] = "/div/body/div/p/t[3]/strong";
                yield ` invited you for the `;
                content = await values['eventId'].label || '';
                forceDisplay = null;
                if (content != null && content !== false) {
                    yield `<strong>`;
                    yield String(content);
                    yield `</strong>`;
                }
                else {
                    yield `<strong>`;
                    yield `Follow-up for Project proposal</strong>`;
                }
                yield ` meeting.
        `;
            }
            else {
                log["lastPathNode"] = "/div/body/div/p/t[4]";
                log["lastPathNode"] = "/div/body/div/p/t[4]/strong";
                yield `
            Your meeting `;
                content = await values['eventId'].label || '';
                forceDisplay = null;
                if (content != null && content !== false) {
                    yield `<strong>`;
                    yield String(content);
                    yield `</strong>`;
                }
                else {
                    yield `<strong>`;
                    yield `Follow-up for Project proposal</strong>`;
                }
                yield ` has been booked.
        `;
            }
        }
    }
    log["lastPathNode"] = "/div/body/div/p/t[2]";
    log["lastPathNode"] = "/div/body/div/p/t[3]";
    log["lastPathNode"] = "/div/body/div/p/t[4]";
    log["lastPathNode"] = "/div/body/div/div/t";
    yield `
        
        
        

    </p>
    <div style="text-align: center; padding: 16px 0px 16px 0px;">
        `;
    if (! values['isOnline'] || await values['object'].state !== 'accepted') {
        log["lastPathNode"] = "/div/body/div/div/t/a[0]";
        attrs = {};
        attrs["style"] = "padding: 5px 10px; color: #FFFFFF; text-decoration: none; background-color: #875A7B; border: 1px solid #875A7B; border-radius: 3px";
        attrs["href"] = format("/calendar/meeting/accept?token=%s&id=%s", await self._compileToStr(await values['object'].accessToken), await self._compileToStr((await values['object'].eventId).id));
        tagName = "a";
        yield `
            <a`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        log["lastPathNode"] = "/div/body/div/div/t/a[1]";
        attrs = {};
        attrs["style"] = "padding: 5px 10px; color: #FFFFFF; text-decoration: none; background-color: #875A7B; border: 1px solid #875A7B; border-radius: 3px";
        attrs["href"] = format("/calendar/meeting/decline?token=%s&id=%s", await self._compileToStr(await values['object'].accessToken), await self._compileToStr((await values['object'].eventId).id));
        tagName = "a";
        yield `>
                Accept</a>
            <a`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        yield `>
                Decline</a>
        `;
    }
    log["lastPathNode"] = "/div/body/div/div/a";
    attrs = {};
    attrs["style"] = "padding: 5px 10px; color: #FFFFFF; text-decoration: none; background-color: #875A7B; border: 1px solid #875A7B; border-radius: 3px";
    attrs["href"] = format("/calendar/meeting/view?token=%s&id=%s", await self._compileToStr(await values['object'].accessToken), await self._compileToStr((await values['object'].eventId).id));
    tagName = "a";
    yield `
        <a`;
    attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
    for (const [name, value] of Object.entries(attrs)) {
          if (value || typeof(value) === 'string') {
                yield ' ' + String(name) + '="' + String(value) + '"'
          }
    }
    log["lastPathNode"] = "/div/body/div/div/a/t";
    yield `>`;
    content = values['isOnline'] && values['targetCustomer'] ? 'Reschedule' : 'View';
    forceDisplay = null;
    if (content != null && content !== false) {
        yield String(content);
    }
    else {
        yield `View`;
    }
    log["lastPathNode"] = "/div/body/div/table/tr/td[0]/div[0]/t";
    yield `</a>
    </div>
    <table border="0" cellpadding="0" cellspacing="0"><tr>
        <td width="130px;">
            <div style="border-top-left-radius: 3px; border-top-right-radius: 3px; font-size: 12px; border-collapse: separate; text-align: center; font-weight: bold; color: #ffffff; min-height: 18px; background-color: #875A7B; border: 1px solid #875A7B;">
                `;
    content = values['formatDatetime'](await values['eventId'].start, ! await values['eventId'].allday ? await values['object'].mailTz : null, 'EEEE', values['object'].env.lang) || '';
    forceDisplay = null;
    if (content != null && content !== false) {
        yield String(content);
    }
    else {
        yield `Tuesday`;
    }
    log["lastPathNode"] = "/div/body/div/table/tr/td[0]/div[1]/t";
    yield `
            </div>
            <div style="font-size: 48px; min-height: auto; font-weight: bold; text-align: center; color: #5F5F5F; background-color: #F8F8F8; border: 1px solid #875A7B;">
                `;
    content = values['formatDatetime'](await values['eventId'].start, ! await values['eventId'].allday ? await values['object'].mailTz : null, 'd', values['object'].env.lang) || '';
    forceDisplay = null;
    if (content != null && content !== false) {
        yield String(content);
    }
    else {
        yield `4`;
    }
    log["lastPathNode"] = "/div/body/div/table/tr/td[0]/div[2]/t";
    yield `
            </div>
            <div style="font-size: 12px; text-align: center; font-weight: bold; color: #ffffff; background-color: #875A7B;">
                `;
    content = values['formatDatetime'](await values['eventId'].start, ! await values['eventId'].allday ? await values['object'].mailTz : null, 'MMMM y', values['object'].env.lang) || '';
    forceDisplay = null;
    if (content != null && content !== false) {
        yield String(content);
    }
    else {
        yield `May 2021`;
    }
    log["lastPathNode"] = "/div/body/div/table/tr/td[0]/div[3]/t";
    yield `
            </div>
            <div style="border-collapse: separate; color: #5F5F5F; text-align: center; font-size: 12px; border-bottom-right-radius: 3px; font-weight: bold ; border: 1px solid #875A7B; border-bottom-left-radius: 3px;">
                `;
    if (! values['eventId'].allday) {
        log["lastPathNode"] = "/div/body/div/table/tr/td[0]/div[3]/t/div/t";
        yield `
                    <div>
                        `;
        content = values['formatTime'](await values['eventId'].start, await values['object'].mailTz, 'short', values['object'].env.lang) || '';
        forceDisplay = null;
        if (content != null && content !== false) {
            yield String(content);
        }
        else {
            yield `11:00 AM`;
        }
        log["lastPathNode"] = "/div/body/div/table/tr/td[0]/div[3]/t/t";
        yield `
                    </div>
                    `;
        if (await values['object'].mailTz) {
            log["lastPathNode"] = "/div/body/div/table/tr/td[0]/div[3]/t/t/div/t";
            yield `
                        <div style="font-size: 10px; font-weight: normal">
                            (`;
            content = await values['object'].mailTz || '';
            forceDisplay = null;
            if (content != null && content !== false) {
                yield String(content);
            }
            else {
                yield `Europe/Brussels`;
            }
            yield `)
                        </div>
                    `;
        }
        yield `
                `;
    }
    log["lastPathNode"] = "/div/body/div/table/tr/td[2]/ul/t[0]";
    yield `
            </div>
        </td>
        <td width="20px;"></td>
        <td style="padding-top: 5px;">
            <p><strong>Details of the event</strong></p>
            <ul>
                `;
    if (values['isOnline']) {
        log["lastPathNode"] = "/div/body/div/table/tr/td[2]/ul/t[0]/li/t";
        yield `
                    <li>Appointment Type: `;
        content = await values['appointmentType'].label || '';
        forceDisplay = null;
        if (content != null && content !== false) {
            yield String(content);
        }
        else {
            yield `Schedule a Demo`;
        }
        yield `</li>
                `;
    }
    log["lastPathNode"] = "/div/body/div/table/tr/td[2]/ul/t[1]";
    yield `
                `;
    if (await values['eventId'].location) {
        log["lastPathNode"] = "/div/body/div/table/tr/td[2]/ul/t[1]/li/t";
        yield `
                    <li>Location: `;
        content = await values['eventId'].location || '';
        forceDisplay = null;
        if (content != null && content !== false) {
            yield String(content);
        }
        else {
            yield `Bruxelles`;
        }
        log["lastPathNode"] = "/div/body/div/table/tr/td[2]/ul/t[1]/li/a";
        attrs = {};
        attrs["target"] = "_blank";
        attrs["href"] = format("http://maps.google.com/maps?oi=map&q=%s", await self._compileToStr(await (await values['object'].eventId).location));
        tagName = "a";
        yield `
                        (<a`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        yield `>View Map</a>)
                    </li>
                `;
    }
    log["lastPathNode"] = "/div/body/div/table/tr/td[2]/ul/t[2]";
    yield `
                `;
    if (values['recurrent']) {
        log["lastPathNode"] = "/div/body/div/table/tr/td[2]/ul/t[2]/li/t";
        yield `
                    <li>When: `;
        content = await (await values['object'].recurrenceId).label || '';
        forceDisplay = null;
        if (content != null && content !== false) {
            yield String(content);
        }
        else {
            yield `Every 1 Weeks, for 3 events`;
        }
        yield `</li>
                `;
    }
    log["lastPathNode"] = "/div/body/div/table/tr/td[2]/ul/t[3]";
    yield `
                `;
    if (! values['eventId'].allday && await values['eventId'].duration) {
        log["lastPathNode"] = "/div/body/div/table/tr/td[2]/ul/t[3]/li/t";
        yield `
                    <li>Duration: `;
        content = f('%sH%s', await values['eventId'].duration, (values['round'](await values['eventId'].duration * 60) % 60).toString().padStart(2,'0') || '');
        forceDisplay = null;
        if (content != null && content !== false) {
            yield String(content);
        }
        else {
            yield `0H30`;
        }
        yield `</li>
                `;
    }
    log["lastPathNode"] = "/div/body/div/table/tr/td[2]/ul/li/ul/li";
    yield `
                <li>Attendees
                <ul>
                    `;
    let size_1;    let t_foreach_0 = await values['eventId'].attendeeIds ?? [];    if ('_length' in t_foreach_0) {      size_1 = t_foreach_0._length;      values["attendee_size"] = size_1;    }    else if ('length' in t_foreach_0) {      size_1 = t_foreach_0.length;      values["attendee_size"] = size_1;    }    else if ('size' in t_foreach_0) {      size_1 = t_foreach_0.size;      values["attendee_size"] = size_1;    }    else if (typeof(t_foreach_0) === 'number') {      size_1 = t_foreach_0;      values["attendee_size"] = size_1;      t_foreach_0 = range(size_1);    }    else {      size_1 = null;    }    let hasValue_2 = false;    if (t_foreach_0 instanceof Map) {      t_foreach_0 = t_foreach_0.entries();      hasValue_2 = true;    }    if (typeof t_foreach_0 === 'object' && !isIterable(t_foreach_0)) {      t_foreach_0 = Object.entries(t_foreach_0);      hasValue_2 = true;    }
    for (const [index, item] of enumerate(t_foreach_0)) {      values["attendee_index"] = index;      if (hasValue_2) {        [values["attendee"], values["attendee_value"]] = item;      }      else {        values["attendee"] = values["attendee_value"] = item;      }      values["attendee_first"] = values["attendee_index"] == 0;      if (size_1 != null) {        values["attendee_last"] = index + 1 === size_1;      }      values["attendee_odd"] = index % 2;      values["attendee_even"] = ! values["attendee_odd"];      values["attendee_parity"] = values["attendee_odd"] ? 'odd' : 'even';
        log["lastPathNode"] = "/div/body/div/table/tr/td[2]/ul/li/ul/li";
        log["lastPathNode"] = "/div/body/div/table/tr/td[2]/ul/li/ul/li/div";
        attrs = {};
        attrs["style"] = format("display: inline-block; border-radius: 50%; width: 10px; height: 10px; background:%s;", await self._compileToStr( values['colors'][await values['attendee'].state] || 'white' ));
        tagName = "div";
        yield `<li>
                        <div`;
        attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
        for (const [name, value] of Object.entries(attrs)) {
              if (value || typeof(value) === 'string') {
                    yield ' ' + String(name) + '="' + String(value) + '"'
              }
        }
        log["lastPathNode"] = "/div/body/div/table/tr/td[2]/ul/li/ul/li/t[0]";
        yield `> </div>
                        `;
        if (await values['attendee'].commonName !== await values['object'].commonName) {
            log["lastPathNode"] = "/div/body/div/table/tr/td[2]/ul/li/ul/li/t[0]/span";
            yield `
                            `;
            content = await values['attendee'].commonName || '';
            forceDisplay = null;
            if (content != null && content !== false) {
                attrs = {};
                attrs["style"] = "margin-left:5px";
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
                attrs["style"] = "margin-left:5px";
                tagName = "span";
                yield `<span`;
                attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
                for (const [name, value] of Object.entries(attrs)) {
                      if (value || typeof(value) === 'string') {
                            yield ' ' + String(name) + '="' + String(value) + '"'
                      }
                }
                yield `>`;
                yield `Mitchell Admin</span>`;
            }
            yield `
                        `;
        }
        else {
            log["lastPathNode"] = "/div/body/div/table/tr/td[2]/ul/li/ul/li/t[1]";
            yield `
                            <span style="margin-left:5px">You</span>
                        `;
        }
        yield `
                        
                    </li>`;
    }
    log["lastPathNode"] = "/div/body/div/table/tr/td[2]/ul/t[4]";
    yield `
                </ul></li>
                `;
    if (await values['eventId'].videocallLocation) {
        log["lastPathNode"] = "/div/body/div/table/tr/td[2]/ul/t[4]/li/a";
        yield `
                    <li>Meeting URL: `;
        content = await values['eventId'].videocallLocation || '';
        forceDisplay = null;
        if (content != null && content !== false) {
            attrs = {};
            attrs["target"] = "_blank";
            attrs["href"] = await values['eventId'].videocallLocation;
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
            attrs["href"] = await values['eventId'].videocallLocation;
            tagName = "a";
            yield `<a`;
            attrs = await self._postProcessingAttr(tagName, attrs, compileOptions);
            for (const [name, value] of Object.entries(attrs)) {
                  if (value || typeof(value) === 'string') {
                        yield ' ' + String(name) + '="' + String(value) + '"'
                  }
            }
            yield `>`;
            yield `https://meet.jit.si/verp-xyz</a>`;
        }
        yield `</li>
                `;
    }
    log["lastPathNode"] = "/div/body/div/table/tr/td[2]/ul/t[5]";
    yield `
                `;
    if (! values['isHtmlEmpty'](await values['eventId'].description)) {
        log["lastPathNode"] = "/div/body/div/table/tr/td[2]/ul/t[5]/li/t";
        yield `
                    <li>Description of the event:
                    `;
        content = await values['eventId'].description;
        forceDisplay = null;
        if (content != null && content !== false) {
            yield String(content);
        }
        else {
            yield `Internal meeting for discussion for new pricing for product && services.`;
        }
        yield `</li>
                `;
    }
    log["lastPathNode"] = "/div/body/div/t[10]";
    yield `
            </ul>
        </td>
    </tr></table>
    <br/>
    Thank you,
    `;
    values["signature"] = await (await values['eventId'].userId).signature;
    log["lastPathNode"] = "/div/body/div/t[11]";
    yield `
    `;
    if (values['signature']) {
        log["lastPathNode"] = "/div/body/div/t[11]/t";
        yield `
        <br/>
        `;
        content = values['signature'] || '';
        forceDisplay = null;
        if (content != null && content !== false) {
            yield String(content);
        }
        else {
            yield `--<br/>Mitchell Admin`;
        }
        yield `
    `;
    }
    yield `
</div>
            </body></div>`;
    } catch(e) {
        _debug('Error in %s at %s: %s', 'template', log["lastPathNode"], e);
        // _debug(String(template)); // detail code
        throw e;
    }
}