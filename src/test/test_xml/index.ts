import xml2js from 'xml2js';
import * as prettier from 'prettier';
// import { applyInheritanceSpecs } from '../../core/tools/template_inheritance';
import { getrootXml, parseXml, serializeXml } from '../../core/tools/xml';

const source = `<?xml version="1.0" encoding="UTF-8"?>
    <html t-att="htmlData ?? {}">
        <head>
            <meta charset="utf-8"/>
            <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"/>

            <title t-esc="title ?? 'Verp'"/>
            <link type="image/x-icon" rel="shortcut icon" t-att-href="xIcon ?? '/web/static/img/favicon.ico'"/>

            <script id="web.layout.verpscript" type="text/javascript">
            var verp = {
                csrfToken: "<t t-esc="await request.csrfToken()"/>",
                debug: "<t t-esc="debug"/>",
            };
            </script>

            <t t-out="head || ''"/>
        </head>
        <body t-att-class="bodyClassname">
            <t t-out="0"/>
        </body>
    </html>
`;

const arch = `<?xml version="1.0" encoding="UTF-8"?><data>
    <xpath expr="//head/meta[last()]" position="after">
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
    </xpath>
    <xpath expr="//head/link[last()]" position="after">
        <link rel="preload" href="/web/static/lib/fontawesome/fonts/fontawesome-webfont.woff2?v=4.7.0" as="font" crossorigin=""/>
        <t t-call-assets="web.assets_common" t-js="false"/>
        <t t-call-assets="web.assetsFrontend" t-js="false"/>
    </xpath>
    <xpath expr="//head/script[@id='web.layout.verpscript']" position="after">
    </xpath>
    <xpath expr="//t[@t-out='0']" position="replace">
        <div id="wrapwrap" t-attf-class="#{pageName or ''}">
            <header t-if="not no_header" id="top" data-anchor="true">
                <img class="img-responsive d-block mx-auto"
                    t-attf-src="/web/binary/companyLogo"
                    alt="Logo"/>
            </header>
            <main>
                <t t-out="0"/>
            </main>
            <footer t-if="not noFooter" id="bottom" data-anchor="true" t-attf-class="bg-light o-footer">
                <div id="footer"/>
                <div t-if="not noCopyright" class="o_footer_copyright">
                    <div class="container py-3">
                        <div class="row">
                            <div class="col-sm text-center text-sm-left text-muted">
                                <t t-call="web.debug_icon"/>
                                <span class="o_footer_copyright_name mr-2">Copyright &amp;copy; <span t-field="res_company.name" itemprop="name">Company name</span></span>
                            </div>
                            <div class="col-sm text-center text-sm-right">
                                <t t-call="web.brandPromotion"/>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    </xpath></data>
`;
const dirtyHtml = `
          var verp = {
            csrfToken: "4075b06733ba28c2fc80cf1bc6b824e7f2d0ffado1707089377",
            debug: "",
          };
        verp.__session_info__ = {"isAdmin":false,"isSystem":false,"isWebsiteUser":false,"userId":false,"isFrontend":true,"showEffect":false};
        if (!/(^|;s)tz=/.test(document.cookie)) {
          var userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
          document.cookie = "";
        }; close();`;

const dirtyHtml1 = `<!DOCTYPE html>
      <html><head><meta charset="utf-8"/><meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Verp</title><link type="image/x-icon" rel="shortcut icon" href="/web/static/img/favicon.ico"/><link rel="preload" href="/web/static/lib/fontawesome/fonts/fontawesome-webfont.woff2?v=4.7.0" as="font" crossorigin=""/><script id="web.layout.verpscript" type="text/javascript">
            var verp = {
              csrfToken: "4075b06733ba28c2fc80cf1bc6b824e7f2d0ffado1707089377",
              debug: "",
            };
          </script><script type="text/javascript">
          verp.__session_info__ = {"isAdmin":false,"isSystem":false,"isWebsiteUser":false,"userId":false,"isFrontend":true,"showEffect":false};
          if (!/(^|;s)tz=/.test(document.cookie)) {
            var userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
            document.cookie = "";
          }
        </script></head><body class="bg-100"><image src="/web/static/img/logo_white.png"></image></body></html>`;

const dirtyHtml2 = `<!DOCTYPE html>
    <html><head><meta charset="utf-8"/><meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Verp</title><link type="image/x-icon" rel="shortcut icon" href="/web/static/img/favicon.ico"/><link rel="preload" href="/web/static/lib/fontawesome/fonts/fontawesome-webfont.woff2?v=4.7.0" as="font" crossorigin=""/><script id="web.layout.verpscript" type="text/javascript">
          var verp = {
            csrfToken: "4075b06733ba28c2fc80cf1bc6b824e7f2d0ffado1707089377",
            debug: "",
          };
        </script><script type="text/javascript">
        verp.__session_info__ = {"isAdmin":false,"isSystem":false,"isWebsiteUser":false,"userId":false,"isFrontend":true,"showEffect":false};
        if (!/(^|;s)tz=/.test(document.cookie)) {
          var userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
          document.cookie = "";
        }
      </script></head><body class="bg-100"><image src="/web/static/img/logo_white.png"></image><div id="wrapwrap" class=""""><main><div class="container py-5"><div style="max-width: 300px;" class=""card border-0 mx-auto bg-100  o-database-list""><div class="card-body"><div class=""text-center pb-3 border-bottom mb-4""><img alt="Logo" style="max-height:120px; max-width: 100%; width:auto" src=""/web/binary/companyLogo""/></div><form class="oe-login-form" role="form" method="post" onsubmit="this.action = '/web/login' + location.hash" action="/web/login"><input type="hidden" name="csrfToken" value="4075b06733ba28c2fc80cf1bc6b824e7f2d0ffado1707089377"/><div class="form-group field-login"><label for="login">Email</label><input type="text" placeholder="Email" name="login" id="login" required="required" autofocus="autofocus" autocapitalize="off" class=""form-control ""/></div><div class="form-group field-password"><label for="password">Password</label><input type="password" placeholder="Password" name="password" id="password" required="required" autocomplete="current-password" maxlength="4096" class=""form-control ""/></div><div class=""clearfix oe-login-buttons text-center mb-1 pt-3""><button type="submit" class="btn btn-primary btn-block">Log in</button><div class="o-login-auth"></div></div><input type="hidden" name="redirect"/></form><div class="text-center small mt-4 pt-3 border-top"><a class="border-right pr-2 mr-1" href="/web/database/manager">Manage Databases</a><a href="https://www.theverp.com?utmSource=db&amp;utmMedium=auth" target="_blank">Powered by <span>Verp</span></a></div></div></div></div></main></div></body></html>`;


async function testXml2Js() {
    // const parser = new xml2js.Parser();
    // const builder = new xml2js.Builder();
    const doc = await (new xml2js.Parser()).parseStringPromise(source);
    const xml = new xml2js.Builder().buildObject(doc);
    console.log(xml);
}

// async function main() {
//     const domSource = getrootXml(parseXml(source));
//     const domArch = getrootXml(parseXml(arch));
//     const out = await applyInheritanceSpecs(domSource, domArch);
//     console.log(serializeXml(domArch));
// }

async function test() {
    var res = await prettier.format(dirtyHtml, { parser: 'babel' });
    console.log(res);
}

test();
// main();
// testXml2Js();

export { };


