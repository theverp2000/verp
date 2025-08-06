import fs from "fs";
import fsPro from "fs/promises";
import * as _ from 'lodash';
import { DateTime } from 'luxon';
import { PDFCatalog, PDFDict, PDFDocument, PDFName } from "pdf-lib";
import puppeteer from 'puppeteer';
import temp from 'temp';
import { encode } from 'utf8';
import xpath from "xpath";
import { api, models, tools } from "../../..";
import { setdefault } from '../../../api';
import { Fields, _Datetime } from "../../../fields";
import { AccessError, OrderedDict, UserError, ValueError } from '../../../helper';
import { MetaModel, Model, _super } from "../../../models";
import { FALSE_DOMAIN, NEGATIVE_TERM_OPERATORS } from "../../../osv/expression";
import { UpCamelCase, _f, b64decode, base64ToImage, bool, camelCaseToDot, config, enumerate, equal, extend, f, isHtmlEmpty, isInstance, isIterable, len, parseInt, pop, range, toFormat, update } from "../../../tools";
import { unsafeAsync } from '../../../tools/save_eval';
import { E, childNodes, getAttributes, getrootXml, markup, parseXml, serializeHtml } from '../../../tools/xml';

const chromiumState = 'ok';
const dpiZoomRatio = false;

@MetaModel.define()
class IrActionsReport extends Model {
    static _module = module;
    static _name = 'ir.actions.report';
    static _description = 'Report Action';
    static _parents = 'ir.actions.mixin';
    static _inherits = { 'ir.actions.actions': 'actionId' };
    static _table = 'irActReportXml';
    static _order = 'label';

    static actionId = Fields.Many2one('ir.actions.actions', { string: 'Action', autojoin: true, index: true, ondelete: "CASCADE", required: true });
    static label = Fields.Char({ translate: true });
    static type = Fields.Char({ default: 'ir.actions.report' });
    static model = Fields.Char({ required: true, string: 'Model Name' });
    static modelId = Fields.Many2one('ir.model', { string: 'Model', compute: '_computeModelId', search: '_searchModelId' })

    static reportType = Fields.Selection([
        ['qweb-html', 'HTML'],
        ['qweb-pdf', 'PDF'],
        ['qweb-text', 'Text'],
    ], { required: true, default: 'qweb-pdf', help: 'The type of the report that will be rendered, each one having its own rendering method. HTML means the report will be opened directly in your browser PDF means the report will be rendered using HtmltoPdf and downloaded by the user.' });
    static reportName = Fields.Char({ string: 'Template Name', required: true });
    static reportModel = Fields.Char({ string: 'Report Model', required: false, store: true, help: "Model of report in registry" });
    static reportFile = Fields.Char({ string: 'Report File', required: false, readonly: false, store: true, help: "The path to the main report file (depending on Report Type) or empty if the content is in another field" })
    static groupsId = Fields.Many2many('res.groups', { relation: 'resGroupsReportRel', column1: 'uid', column2: 'gid', string: 'Groups' })
    static multi = Fields.Boolean({ string: 'On Multiple Doc.', help: "If set to true, the action will not be displayed on the right toolbar of a form view." })

    static paperformatId = Fields.Many2one('report.paperformat', { string: 'Paper Format' })
    static printReportName = Fields.Char('Printed Report Name', { translate: true, help: "This is the filename of the report going to download. Keep empty to not change the report filename. You can use a javascript expression with the 'object' and 'time' variables." })
    static attachmentUse = Fields.Boolean({ string: 'Reload from Attachment', help: 'If enabled, then the second time the user prints with same attachment name, it returns the previous report.' })
    static attachment = Fields.Char({
        string: 'Save as Attachment Prefix',
        help: 'This is the filename of the attachment used to store the printing result. Keep empty to not save the printed reports. You can use a c expression with the object and time variables.'
    });

    @api.depends('model')
    async _computeModelId() {
        for (const action of this) {
            await action.set('modelId', await this.env.items('ir.model')._get(await action.model).id);
        }
    }

    async _searchModelId(operator, value) {
        let irModelIds;
        if (typeof (value) === 'string') {
            const names = await this.env.items('ir.model').nameSearch(value, { operator: operator });
            irModelIds = names.map(n => n[0]);
        }

        else if (isIterable(value)) {
            irModelIds = value;
        }

        else if ((typeof (value) === 'number') && (typeof (value) !== 'boolean'))
            irModelIds = [value];

        if (bool(irModelIds)) {
            operator = operator in NEGATIVE_TERM_OPERATORS ? 'not in' : 'in'
            const irModel = this.env.items('ir.model').browse(irModelIds)
            return [['model', operator, await irModel.mapped('model')]]
        }
        else if ((typeof (value) === 'boolean') || value == null)
            return [['model', operator, value]]
        else
            return FALSE_DOMAIN
    }

    _getReadableFields() {
        return _.union(_super(IrActionsReport, this)._getReadableFields(), [
            "reportName", "reportType", "target",
            // these two are not real fields of ir.actions.report but are
            // expected in the route /report/<converter>/<reportname> and must
            // not be removed by clean_action
            "context", "data",
            // and this one is used by the frontend later on.
            "closeOnReportDownload",
        ]);
    }

    _validFieldParameter(field, name) {
        // allow specifying rendering options directly from field when using the render mixin
        return (name === 'modelField'
            || _super(IrActionsReport, this)._validFieldParameter(field, name)
        );
    }


    /**
     * Used in the ir.actions.report form view in order to search naively after the view(s)
             used in the rendering.
     * @returns 
     */
    async associatedView() {
        this.ensureOne();
        const actionRef = await this.env.ref('base.actionUiView');
        if (!actionRef || len((await this['reportName']).split('.')) < 2) {
            return false;
        }
        const actionData = await actionRef.readOne();
        actionData['domain'] = [['label', 'ilike', (await this['reportName']).split('.')[1]], ['type', '=', 'qweb']];
        return actionData;
    }

    /**
     * Create a contextual action for each report.
     * @returns 
     */
    async createAction() {
        for (const report of this) {
            const model = await this.env.items('ir.model')._get(await report.model);
            await report.write({ 'bindingModelId': model.id, 'bindingType': 'report' });
        }
        return true;
    }

    /**
     * Remove the contextual actions created for the reports.
     * @returns 
     */
    async unlinkAction() {
        await this.checkAccessRights('write', true);
        await (await this.filtered('bindingModelId')).write({ 'bindingModelId': false });
        return true;
    }

    //--------------------------------------------------------------------------
    // Main report methods
    //--------------------------------------------------------------------------
    async _retrieveStreamFromAttachment(attachment) {
        const buffer = b64decode(await attachment.datas);
        if ((await attachment.mimetype).startsWith('image')) {
            const img = base64ToImage(buffer);
            return img.toColorspace("rgb").toBuffer();
        }
        return buffer;
    }

    /**
     * Retrieve an attachment for a specific record.
 
     * @param record The record owning of the attachment.
     * @returns A recordset of length <=1 or None
     */
    async retrieveAttachment(record) {
        const attachment = await this['attachment'];
        const attachmentName = attachment ? await unsafeAsync(attachment, { 'object': record, 'time': DateTime }) : '';
        if (!attachmentName) {
            return null;
        }
        return this.env.items('ir.attachment').search([
            ['label', '=', attachmentName],
            ['resModel', '=', await this['model']],
            ['resId', '=', record.id]
        ], { limit: 1 });
    }

    /**
     * Hook to handle post processing during the pdf report generation.
        The basic behavior consists to create a new attachment containing the pdf
        base64 encoded.
 
     * @param record The record that will own the attachment.
     * @param buffer The optional name content of the file to avoid reading both times.
     * @returns A modified buffer if the previous one has been modified, None otherwise.
     */
    async _postprocessPdfReport(record, buffer: Uint8Array): Promise<Uint8Array | null> {
        const attachment = await this['attachment'];
        const attachmentName = await unsafeAsync(attachment, { 'object': record, 'time': Date });
        if (!attachmentName) {
            return null;
        }
        const attachmentVals = {
            'label': attachmentName,
            'raw': buffer,
            'resModel': await this['model'],
            'resId': record.id,
            'type': 'binary',
        }
        try {
            await this.env.items('ir.attachment').create(attachmentVals);
        } catch (e) {
            if (isInstance(e, AccessError)) {
                console.info("Cannot save PDF report %s as attachment", attachmentVals['label']);
            }
            else {
                console.info('The PDF document %s is now saved in the database', attachmentVals['label']);
            }
        }
        return buffer;
    }

    /**
     * Get the current state of chromium: install, ok, upgrade, workers or broken.
        * install: Starting state.
        * upgrade: The binary is an older version (< 0.12.0).
        * ok: A binary was found with a recent version (>= 0.12.0).
        * workers: Not enough workers found to perform the pdf rendering process (< 2 workers).
        * broken: A binary was found but not responding.
     * @returns chromiumState
     */
    @api.model()
    getChromiumState() {
        return chromiumState;
    }

    async getPaperformat() {
        const paperformatId = await this['paperformatId'];
        return bool(paperformatId) ? paperformatId : (await this.env.company()).paperformatId;
    }

    /**
     * Build arguments understandable by PDF options.
 
     * @param paperformatId A report.paperformat record.
     * @param landscape Force the report orientation to be landscape.
     * @param specificPaperformatArgs A dictionary containing prioritized htmltoPdf arguments.
     * @param setViewportSize Enable a viewport sized '1024x1280' or '1280x1024' depending of landscape arg.
     * @returns A list of string representing the htmltoPdf process command args.
    **/
    @api.model()
    async _buildPDFOptions(
        paperformatId,
        landscape,
        specificPaperformatArgs?: any,
        setViewportSize = false) {
        if (landscape == null && specificPaperformatArgs && specificPaperformatArgs['data-report-landscape']) {
            landscape = specificPaperformatArgs['data-report-landscape'];
        }
        const options = {}
        const commandArgs = ['--disable-local-file-access']
        if (setViewportSize) {
            options['landscape'] = landscape;
        }

        // Passing the cookie to htmltoPdf in order to resolve internal links.
        try {
            if (this.env.req) {
                options['cookie'] = options['cookie'] ?? {};
                options['cookie']['session_id'] = this.env.req.session.sid;
            }
        } catch (e) {
            // pass
        }

        // Less verbose error messages
        extend(commandArgs, ['--quiet']);

        // Build paperformat args
        if (bool(paperformatId)) {
            const format = await paperformatId.format;
            if (format && format !== 'custom') {
                options['format'] = format;
            }
            const [height, width] = await paperformatId('pageHeight', 'pageWidth');
            if (height && width && format === 'custom') {
                options['width'] = width + 'mm';
                options['height'] = height + 'mm';
            }
            if (bool(specificPaperformatArgs) && specificPaperformatArgs['data-report-margin-top']) {
                options['margin'] = { top: specificPaperformatArgs['data-report-margin-top'] }
            }
            else {
                options['margin'] = { top: await paperformatId.marginTop }
            }
            let dpi;
            if (bool(specificPaperformatArgs) && specificPaperformatArgs['data-report-dpi']) {
                dpi = parseInt(specificPaperformatArgs['data-report-dpi']);
            }
            else if (await paperformatId.dpi) {
                if (process.platform == 'win32' && parseInt(await paperformatId.dpi) <= 95) {
                    console.info("Generating PDF on Windows platform require DPI >= 96. Using 96 instead.")
                    dpi = 96;
                }
                else {
                    dpi = await paperformatId.dpi;
                }
            }
            if (dpi) {
                extend(commandArgs, ['--dpi', String(dpi)]);
                if (dpiZoomRatio) {
                    extend(commandArgs, ['--zoom', String(96.0 / dpi)]);
                }
            }

            if (bool(specificPaperformatArgs) && specificPaperformatArgs['data-report-header-spacing']) {
                extend(commandArgs, ['--header-spacing', String(specificPaperformatArgs['data-report-header-spacing'])]);
            }
            else if (await paperformatId.headerSpacing) {
                extend(commandArgs, ['--header-spacing', String(await paperformatId.headerSpacing)]);
            }

            extend(commandArgs, ['--margin-left', String(await paperformatId.marginLeft)]);
            extend(commandArgs, ['--margin-bottom', String(await paperformatId.marginBottom)]);
            extend(commandArgs, ['--margin-right', String(await paperformatId.marginRight)]);
            if (!landscape && await paperformatId.orientation) {
                extend(commandArgs, ['--orientation', String(await paperformatId.orientation)]);
            }
            if (await paperformatId.headerLine) {
                extend(commandArgs, ['--header-line']);
            }
            if (await paperformatId.disableShrinking) {
                extend(commandArgs, ['--disable-smart-shrinking']);
            }
        }

        // Add extra time to allow the page to render
        const delay = await (await this.env.items('ir.config.parameter').sudo()).getParam('report.printDelay', '1000');
        extend(commandArgs, ['--javascript-delay', delay]);

        if (landscape) {
            extend(commandArgs, ['--orientation', 'landscape']);
        }
        return commandArgs;
    }

    /**
     * Divide and recreate the header/footer html by merging all found in html.
        The bodies are extracted and added to a list. Then, extract the specificPaperformatArgs.
        The idea is to put all headers/footers together. Then, we will use a javascript trick
        (see minimalLayout template) to set the right header/footer during the processing of htmltoPdf.
        This allows the computation of multiple reports in a single call to htmltoPdf.
 
     * @param html The html rendered by renderQwebHtml.
     * @returns [bodies, header, footer, specificPaperformatArgs]
        bodies: list of string representing each one a html body.
        header: string representing the html header.
        footer: string representing the html footer.
        specificPaperformatArgs: dictionary of prioritized paperformat values.
     */
    async _prepareHtml(html) {
        const IrConfig = await this.env.items('ir.config.parameter').sudo();

        // Return empty dictionary if 'web.minimalLayout' not found.
        let layout = await this.env.ref('web.minimalLayout', false);
        if (!bool(layout)) {
            return {};
        }
        layout = this.env.items('ir.ui.view').browse(await this.env.items('ir.ui.view').getViewId('web.minimalLayout'));
        const baseUrl = await IrConfig.getParam('report.url') || await layout.getBaseUrl();

        const root = getrootXml(parseXml(html));
        const matchKlass = '//div[contains(concat(" ", normalize-space(@class), " "), " {elem} ")]';

        const headerNode = E.div({ id: 'minimalLayoutReportHeaders' }),
            footerNode = E.div({ id: 'minimalLayoutReportFooters' }),
            bodies = [],
            resIds = [];

        let bodyParent: any = xpath.select1('//main', root) as any as Element;
        // Retrieve headers
        for (const node of xpath.select(_f(matchKlass, { elem: 'header' }), root) as Element[]) {
            bodyParent = node.parentNode;
            bodyParent.removeChild(node);
            headerNode.appendChild(node);
        }

        // Retrieve footers
        for (const node of xpath.select(_f(matchKlass, { elem: 'footer' }), root) as Element[]) {
            bodyParent = node.parentNode;
            bodyParent.removeChild(node);
            footerNode.appendChild(node);
        }

        // Retrieve bodies
        let layoutSections;
        for (const node of xpath.select(_f(matchKlass, { elem: 'article' }), root) as Element[]) {
            let layoutWithLang = layout;
            if (node.hasAttribute('data-oe-lang')) {
                // context language to body language
                layoutWithLang = await layoutWithLang.withContext({ lang: node.getAttribute('data-oe-lang') });
                // set header/lang to body lang prioritizing current user language
                if (!bool(layoutSections) || node.getAttribute('data-oe-lang') === this.env.lang) {
                    layoutSections = layoutWithLang;
                }
            }
            const body = await layoutWithLang._render({
                'subst': false,
                'body': markup(serializeHtml(node, 'unicode')),
                'baseUrl': baseUrl,
                'reportXmlid': await this['xmlid']
            });
            bodies.push(body);
            if (node.getAttribute('data-oe-model') === await this['model']) {
                resIds.push(parseInt(node.getAttribute('data-oe-id') ?? 0));
            }
            else {
                resIds.push(null);
            }
        }

        if (!bodies.length) {
            const body = childNodes(bodyParent, _.isElement).map(c => serializeHtml(c, 'unicode')).join('');
            bodies.push(body);
        }
        // Get paperformat arguments set in the root html tag. They are prioritized over
        // paperformat-record arguments.
        const specificPaperformatArgs = {};
        for (const attribute of getAttributes(root)) {
            if (attribute.name.startsWith('data-report-')) {
                specificPaperformatArgs[attribute.name] = attribute.value;
            }
        }
        const header = await (bool(layoutSections) ? layoutSections : layout)._render({
            'subst': true,
            'body': markup(serializeHtml(headerNode, 'unicode')),
            'baseUrl': baseUrl
        });
        const footer = await (bool(layoutSections) ? layoutSections : layout)._render({
            'subst': true,
            'body': markup(serializeHtml(footerNode, 'unicode')),
            'baseUrl': baseUrl
        });

        return [bodies, resIds, header, footer, specificPaperformatArgs];
    }

    /**
     * Execute htmltoPdf as a subprocess in order to convert html given in input into a pdf
        document.
 
     * @param bodies The html bodies of the report, one per page.
     * @param header The html header of the report containing all headers.
     * @param footer The html footer of the report containing all footers.
     * @param landscape Force the pdf to be rendered under a landscape format.
     * @param specificPaperformatArgs dict of prioritized paperformat arguments.
     * @param setViewportSize Enable a viewport sized '1024x1280' or '1280x1024' depending of landscape arg.
     * @returns Content of the pdf as bytes
     */
    @api.model()
    async _runPrintPdf(bodies: string[], opts: { header?: string, footer?: string, landscape?: boolean, specificPaperformatArgs?: {}, setViewportSize?: boolean } = {}): Promise<Uint8Array> {
        const { header, footer, landscape, specificPaperformatArgs, setViewportSize } = opts;

        const paperformatId = await this.getPaperformat();

        // Build the base command args for htmltoPdf bin
        const commandArgs = await this._buildPDFOptions(
            paperformatId,
            landscape,
            specificPaperformatArgs,
            setViewportSize);

        let pdfContent;
        try {
            const browser = await puppeteer.launch({
                executablePath: tools.config.options['chromePath'],
                headless: true,
                args: ["--fast-start", "--disable-extensions", "--no-sandbox"],
            });
            const page = await browser.newPage();
            await page.setContent(bodies[0]);
            pdfContent = await page.pdf({
                format: 'A4',
                displayHeaderFooter: true,
                headerTemplate: header.replace(/text\/css/gm, 'text/scss').replace(/loading="lazy"/g, 'loading="auto"'), // fix bug with pupperteer
                footerTemplate: footer.replace(/text\/css/gm, 'text/scss').replace(/loading="lazy"/g, 'loading="auto"'), // fix bug with pupperteer
                margin: {
                    top: "80px",
                    bottom: "50px",
                    left: "10px",
                    right: "10px"
                },
                printBackground: true,
            });
            await browser.close();
        } catch (e) {
            console.error(e);
            throw e;
        }
        return pdfContent;
    }
    /**
     * Get the first record of ir.actions.report having the ``reportName`` as value for
        the field reportName.
     * @param reportName 
     * @returns 
     */
    @api.model()
    async _getReportFromName(reportName) {
        const reportObj = this.env.items('ir.actions.report');
        const conditions = [['reportName', '=', reportName]];
        const context = await this.env.items('res.users').contextGet();
        return (await (await reportObj.withContext(context)).sudo()).search(conditions, { limit: 1 });
    }

    /**
     * Computes and returns the barcode check digit. The used algorithm
        follows the GTIN specifications and can be used by all compatible
        barcode nomenclature, like as EAN-8, EAN-12 (UPC-A) or EAN-13.
 
        https://www.gs1.org/sites/default/files/docs/barcodes/GS1_General_Specifications.pdf
        https://www.gs1.org/services/how-calculate-check-digit-manually
 
     * @param numericBarcode the barcode to verify/recompute the check digit
     * @returns the number corresponding to the right check digit
     */
    @api.model()
    getBarcodeCheckDigit(numericBarcode: string) {
        // Multiply value of each position by
        // N1  N2  N3  N4  N5  N6  N7  N8  N9  N10 N11 N12 N13 N14 N15 N16 N17 N18
        // x3  X1  x3  x1  x3  x1  x3  x1  x3  x1  x3  x1  x3  x1  x3  x1  x3  CHECKSUM
        let oddsum = 0, evensum = 0;
        const code = _.reverse(numericBarcode).slice(1);  // Remove the check digit and reverse the barcode.
        // The CHECKSUM digit is removed because it will be recomputed and it must not interfer with
        // the computation. Also, the barcode is inverted, so the barcode length doesn't matter.
        // Otherwise, the digits' group (even or odd) could be different according to the barcode length.
        for (const [i, digit] of enumerate(code)) {
            if (i % 2 == 0) {
                evensum += parseInt(digit);
            }
            else {
                oddsum += parseInt(digit);
            }
        }
        const total = evensum * 3 + oddsum;
        return (10 - total % 10) % 10;
    }

    /**
     * Checks if the given barcode is correctly encoded.
 
     * @param barcode 
     * @param encoding 
     * @returns true if the barcode string is encoded with the provided encoding.
     */
    @api.model()
    checkBarcodeEncoding(barcode, encoding) {
        if (encoding == "any") {
            return true;
        }
        const barcodeSizes = {
            'ean8': 8,
            'ean13': 13,
            'upca': 12,
        }
        const barcodeSize = barcodeSizes[encoding];
        return (encoding !== 'ean13' || barcode[0] !== '0')
            && len(barcode) == barcodeSize
            && /^\d+$/.test(barcode)
            && this.getBarcodeCheckDigit(barcode) == parseInt(barcode.slice(-1)[0]);
    }

    @api.model()
    barcode(barcodeType, value, kwargs: {} = {}) {
        const defaults = {
            'width': [600, parseInt],
            'height': [100, parseInt],
            'humanreadable': [false, (x) => bool(parseInt(x))],
            'quiet': [true, (x) => bool(parseInt(x))],
            'mask': [null, (x) => x],
            'barBorder': [4, parseInt],
            // The QR code can have different layouts depending on the Error Correction Level
            // See: https://en.wikipedia.org/wiki/QR_code#Error_correction
            // Level 'L' – up to 7% damage   (default)
            // Level 'M' – up to 15% damage  (i.e. required by l10n_ch QR bill)
            // Level 'Q' – up to 25% damage
            // Level 'H' – up to 30% damage
            'barLevel': ['L', (x) => ['L', 'M', 'Q', 'H'].includes(x) && x || 'L'],
        }
        kwargs = Object.fromEntries(Object.entries<any>(defaults).map(([k, [v, validator]]) => [k, validator(kwargs[k] ?? v)]));
        kwargs['humanReadable'] = pop(kwargs, 'humanreadable');

        if (barcodeType == 'UPCA' && [11, 12, 13].includes(len(value))) {
            barcodeType = 'EAN13';
            if ([11, 12].includes(len(value))) {
                value = f('0%s', value);
            }
        }
        else if (barcodeType === 'auto') {
            const symbologyGuess = { 8: 'EAN8', 13: 'EAN13' }
            barcodeType = symbologyGuess[len(value)] ?? 'Code128';
        }
        else if (barcodeType === 'QR') {
            // for `QR` type, `quiet` is not supported. And is simply ignored.
            // But we can use `barBorder` to get a similar behaviour.
            if (kwargs['quiet']) {
                kwargs['barBorder'] = 0;
            }
        }
        if (['EAN8', 'EAN13'].includes(barcodeType) && !this.checkBarcodeEncoding(value, barcodeType.toLocaleLowerCase())) {
            // If the barcode does not respect the encoding specifications, convert its type into Code128.
            // Otherwise, the report-lab method may return a barcode different from its value. For instance,
            // if the barcode type is EAN-8 and the value 11111111, the report-lab method will take the first
            // seven digits and will compute the check digit, which gives: 11111115 -> the barcode does not
            // match the expected value.
            barcodeType = 'Code128';
        }
        try {
            const barcode = createBarcodeDrawing(barcodeType, value, 'png', kwargs);

            // If a mask is asked and it is available, call its function to
            // post-process the generated QR-code image
            if (kwargs['mask']) {
                const availableMasks = this.getAvailableBarcodeMasks();
                const maskToApply = availableMasks[kwargs['mask']];
                if (maskToApply) {
                    maskToApply(kwargs['width'], kwargs['height'], barcode);
                }
            }
            return barcode.valueOf();//'png');
        } catch (e) {
            // except (ValueError, AttributeError):
            if (barcodeType === 'Code128') {
                throw new ValueError("Cannot convert into barcode.");
            }
            else if (barcodeType === 'QR') {
                throw new ValueError("Cannot convert into QR code.");
            }
            else {
                return this.barcode('Code128', value, kwargs);
            }
        }
    }

    /**
     * Hook for extension.
        This function returns the available QR-code masks, in the form of a
        list of (code, mask_function) elements, where code is a string identifying
        the mask uniquely, and mask_function is a function returning a reportlab
        Drawing object with the result of the mask, and taking as parameters:
            - width of the QR-code, in pixels
            - height of the QR-code, in pixels
            - reportlab Drawing object containing the barcode to apply the mask on
     * @returns 
     */
    @api.model()
    getAvailableBarcodeMasks() {
        return {}
    }


    /**
     * Allow to render a QWeb template sevrer-side. This function returns the 'ir.ui.view'
        render but embellish it with some variables/methods used in reports.

     * @param template 
     * @param values additional methods/variables used in the rendering
     * @returns html representation of the template
     */
    async _renderTemplate(template, values?: any) {
        if (values == null) {
            values = {};
        }

        let context = Object.assign({}, this.env.context, { inheritBranding: false });

        // Browse the user instead of using the sudo self.env.user
        const user = this.env.items('res.users').browse(this.env.uid);
        const req = this.env.req;
        let website;
        if (req && req.params.has('website')) {
            if (req.params['website'] != null) {
                website = req.params['website'];
                context = Object.assign(context, { translatable: context['lang'] !== await (await this.env.items('ir.http')._getDefaultLang(req)).code });
            }
        }
        const viewObj = await (await this.env.items('ir.ui.view').sudo()).withContext(context);
        const self = await this.withContext({ tz: await user.tz });
        update(values, {
            'toFormat': toFormat,
            'contextTimestamp': (date: Date) => _Datetime.contextTimestamp(self, date),
            'user': user,
            'resCompany': await this.env.company(),
            'website': website,
            'webBaseUrl': await (await this.env.items('ir.config.parameter').sudo()).getParam('web.base.url', ''),
        })
        return viewObj._renderTemplate(template, values);
    }

    /**
    Merge the existing attachments by adding one by one the content of the attachments
        and then, we add the pdfContent if exists. Create the attachments for each record individually
        if required.
 
    * @param saveInAttachment The retrieved attachments as map record.id -> attachmentId.
    * @param pdfContent The pdf content newly generated by htmltoPdf.
    * @param resIds the ids of record to allow postprocessing.
    * @returns The pdf content of the merged pdf.
    */
    async _postPdf(saveInAttachment: OrderedDict<Uint8Array>, pdfContent?: Uint8Array, resIds?: any) {
        function closeStreams(streams) {
            for (const stream of streams) {
                try {
                    stream.close();
                } catch (e) {
                }
            }
        }

        // Check special case having only one record with existing attachment.
        // In that case, return directly the attachment content.
        // In that way, we also ensure the embedded files are well preserved.
        if (len(saveInAttachment) == 1 && !pdfContent) {
            return Object.values<any>(saveInAttachment)[0].getvalue();
        }
        // Create a list of streams representing all sub-reports part of the final result
        // in order to append the existing attachments and the potentially modified sub-reports
        // by the _postprocess_pdf_report calls.
        const streams = [];

        // In htmltoPdf has been called, we need to split the pdf in order to call the postprocess method.
        if (bool(pdfContent)) {
            let pdfContentStream = pdfContent;
            // Build a record_map mapping id -> record
            const recordMap = Object.fromEntries(await this.env.items(await this['model']).browse(resIds.filter(resId => bool(resId))).map(r => [r.id, r]));

            // If no value in attachment or no record specified, only append the whole pdf.
            if (!bool(recordMap) || !bool(await this['attachment'])) {
                streams.push(pdfContentStream);
            }
            else {
                if (len(resIds) == 1) {
                    // Only one record, so postprocess directly and append the whole pdf.
                    if (resIds[0] in recordMap && !(resIds[0] in saveInAttachment)) {
                        const newStream = await this._postprocessPdfReport(recordMap[resIds[0]], pdfContentStream);
                        // If the buffer has been modified, mark the old buffer to be closed as well.
                        if (newStream && !equal(newStream, pdfContentStream)) {
                            closeStreams([pdfContentStream]);
                            pdfContentStream = newStream;
                        }
                    }
                    streams.push(pdfContentStream);
                }
                else {
                    // In case of multiple docs, we need to split the pdf according the records.
                    // To do so, we split the pdf based on top outlines computed by htmltoPdf.
                    // An outline is a <h?> html tag found on the document. To retrieve this table,
                    // we look on the pdf structure using pypdf to compute the outlines_pages from
                    // the top level heading in /Outlines.
                    const reader = await PDFDocument.load(pdfContentStream);
                    const root: PDFCatalog = reader.catalog;
                    const outlinesPages = [];
                    const outlines = root.lookup(PDFName.of('Outlines')) as PDFDict;
                    if (outlines && outlines.has(PDFName.of('First'))) {
                        let node = outlines.get(PDFName.of('First')) as PDFDict;
                        while (true) {
                            const dests = root.lookup(PDFName.of('Dests')) as PDFDict;
                            const dest = node.get(PDFName.of('Dest'))
                            outlinesPages.push(dests.get(PDFName.of(dest.toString()))[0]);
                            if (!node.has(PDFName.of('Next'))) {
                                break;
                            }
                            node = node.get(PDFName.of('Next')) as PDFDict;
                        }
                        outlinesPages.sort();
                    }
                    // There should be only one top-level heading by document
                    // There should be a top-level heading on first page
                    if (outlinesPages.length == len(resIds) && outlinesPages[0] == 0) {
                        for (const [i, num] of enumerate(outlinesPages)) {
                            const to = i + 1 < outlinesPages.length ? outlinesPages[i + 1] : reader.getPageCount();
                            const attachmentWriter = await PDFDocument.create();
                            for (const j of range(num, to)) {
                                attachmentWriter.addPage(reader.getPage(j));
                            }
                            let stream = await attachmentWriter.save();
                            if (resIds[i] && !(resIds[i] in saveInAttachment)) {
                                const newStream = await this._postprocessPdfReport(recordMap[resIds[i]], stream);
                                // If the buffer has been modified, mark the old buffer to be closed as well.
                                if (newStream && !equal(newStream, stream)) {
                                    closeStreams([stream]);
                                    stream = newStream;
                                }
                            }
                            streams.push(stream);
                        }
                        closeStreams([pdfContentStream]);
                    }
                    else {
                        // We can not generate separate attachments because the outlines
                        // do not reveal where the splitting points should be in the pdf.
                        console.info('The PDF report can not be saved as attachment.')
                        streams.push(pdfContentStream);
                    }
                }
            }
        }
        // If attachment_use is checked, the records already having an existing attachment
        // are not been rendered by htmltoPdf. So, create a new stream for each of them.
        if (await this['attachmentUse']) {
            for (const stream of Object.values(saveInAttachment)) {
                streams.push(stream);
            }
        }

        // Build the final pdf.
        // If only one stream left, no need to merge them (and then, preserve embedded files).
        let result;
        if (streams.length == 1) {
            result = streams[0].valueOf();
        }
        else {
            try {
                result = await this._mergePdfs(streams);
            } catch (e) {
                // except utils.PdfReadError:
                throw new UserError(await this._t("One of the documents you are trying to merge is encrypted"))
            }
        }
        // We have to close the streams after PdfFileWriter's call to write()
        closeStreams(streams);
        return result;
    }

    async _getUnreadablePdfs(streams) {
        const unreadableStreams = [];

        for (const stream of streams) {
            /* ex:const { Readable } = require("stream")
             const readable = Readable.from(["input string"]);

             readable.on("data", (chunk) => {
                console.log(chunk) // will be called once with `"input string"`
             })
            */
            // const writer = new PdfFileWriter();
            // const resultStream = new Buffer();
            // try {
            //     const reader = new PdfFileReader(stream);
            //     writer.appendPagesFromReader(reader);
            //     writer.write(resultStream);
            // } catch(e) {
            //     unreadableStreams.push(stream);
            // }
        }
        return unreadableStreams;
    }

    async _raiseOnUnreadablePdfs(streams, streamRecord: Map<any, any>) {
        const unreadablePdfs = await this._getUnreadablePdfs(streams);
        if (bool(unreadablePdfs)) {
            const records = await Promise.all(unreadablePdfs.filter(s => streamRecord.has(s)).map(async (s) => streamRecord.get(s).label));
            throw new UserError(await this._t(
                "Verp is unable to merge the PDFs attached to the following records:\n \
                %s\n\n \
                Please exclude them from the selection to continue. It's possible to \
                still retrieve those PDFs by selecting each of the affected records \
                individually, which will avoid merging."), records.join('\n'));
        }
    }

    async _mergePdfs(streams: Uint8Array[]) {
        const writer = await PDFDocument.create();
        for (const stream of streams) {
            const reader = await PDFDocument.load(stream);
            const copiedPagesA = await writer.copyPages(reader, reader.getPageIndices());
            copiedPagesA.forEach((page) => writer.addPage(page));
        }
        const resultStream = await writer.save();
        streams.push(resultStream);
        return resultStream.valueOf();
    }

    /**
     * @param resIds 
     * @param data 
     * @returns 
     */
    async _renderQwebPdf(resIds?: any, data?: any) {
        if (!data) {
            data = {}
        }
        setdefault(data, 'reportType', 'pdf');

        // access the report details with sudo() but evaluation context as sudo(false)
        const selfSudo = await this.sudo();

        // In case of test environment without enough workers to perform calls to htmltoPdf,
        // fallback to renderHtml.
        if ((config.get('testEnable') || config.get('testFile')) && !this.env.context['forceReportRendering']) {
            return selfSudo._renderQwebHtml(resIds, data);
        }

        // As the assets are generated during the same transaction as the rendering of the
        // templates calling them, there is a scenario where the assets are unreachable: when
        // you make a request to read the assets while the transaction creating them is not done.
        // Indeed, when you make an asset request, the controller has to read the `ir.attachment`
        // table.
        // This scenario happens when you want to print a PDF report for the first time, as the
        // assets are not in cache and must be generated. To workaround this issue, we manually
        // commit the writes in the `ir.attachment` table. It is done thanks to a key in the context.
        const context = Object.assign({}, this.env.context);
        if (!config.get('testEnable') && !('commitAssetsbundle' in context)) {
            context['commitAssetsbundle'] = true;
        }
        // Disable the debug mode in the PDF rendering in order to not split the assets bundle
        // into separated files to load. This is done because of an issue in htmltoPdf
        // failing to load the CSS/Javascript resources in time.
        // Without this, the header/footer of the reports randomly disappear
        // because the resources files are not loaded in time.
        // https://github.com/htmltoPdf/htmltoPdf/issues/2083
        context['debug'] = false;

        const saveInAttachment = new OrderedDict();
        // Maps the streams in `save_in_attachment` back to the records they came from
        const streamRecord = new Map<any, any>();
        if (bool(resIds)) {
            // Dispatch the records by ones having an attachment and ones requesting a call to
            // htmltoPdf.
            const model = this.env.items(await selfSudo.model);
            const recordIds = model.browse(resIds);
            let wkRecordIds = model;
            if (await selfSudo.attachment) {
                for (const recordId of recordIds) {
                    const attachment = await selfSudo.retrieveAttachment(recordId);
                    if (bool(attachment)) {
                        const stream = await selfSudo._retrieveStreamFromAttachment(attachment);
                        saveInAttachment[recordId.id] = stream;
                        streamRecord.set(stream, recordId);
                    }
                    if (! await selfSudo.attachmentUse || !bool(attachment)) {
                        wkRecordIds = wkRecordIds.add(recordId);
                    }
                }
            }
            else {
                wkRecordIds = recordIds;
            }
            resIds = wkRecordIds.ids;
        }
        // A call to htmltoPdf is mandatory in 2 cases:
        // - The report is not linked to a record.
        // - The report is not fully present in attachments.
        if (bool(saveInAttachment) && !bool(resIds)) {
            console.info('The PDF report has been generated from attachments.');
            if (len(saveInAttachment) > 1) {
                await this._raiseOnUnreadablePdfs(Object.values(saveInAttachment), streamRecord);
            }
            return [await selfSudo._postPdf(saveInAttachment), 'pdf'];
        }

        if (this.getChromiumState() === 'install') {
            // htmltoPdf is not installed
            // the call should be catched before (cf /report/checkHtmltoPdf) but
            // if get_pdf is called manually (email template), the check could be
            // bypassed
            // throw new UserError(await this._t("Unable to find HtmltoPdf on this system. The PDF can not be created."));
        }

        const html = (await (await selfSudo.withContext(context))._renderQwebHtml(resIds, data))[0];

        const [bodies, htmlIds, header, footer, specificPaperformatArgs] = await (await selfSudo.withContext(context))._prepareHtml(html);

        if (bool(await selfSudo.attachment) && !_.intersection(resIds ?? [], htmlIds ?? []).length) {
            throw new UserError(await this._t(["The report's template '%s' is wrong, please contact your administrator.",
                "Can not separate file to save as attachment because the report's template does not contains the attributes 'data-oe-model' and 'data-oe-id' on the div with 'article' classname."].join('\n'), await this['label']));
        }

        const pdfContent = await this._runPrintPdf(bodies, { header, footer, landscape: context['landscape'], specificPaperformatArgs, setViewportSize: context['setViewportSize'] });
        if (bool(resIds)) {
            await this._raiseOnUnreadablePdfs(Object.values(saveInAttachment), streamRecord);
            console.info('The PDF report has been generated for model: %s, records %s.', await selfSudo.model, String(resIds));
            return [await selfSudo._postPdf(saveInAttachment, pdfContent, htmlIds), 'pdf'];
        }
        return [pdfContent, 'pdf'];
    }

    @api.model()
    async _renderQwebText(docids, data?: any) {
        if (!data) {
            data = {}
        }
        setdefault(data, 'reportType', 'text');
        setdefault(data, '__keepEmptyLines', true);
        data = await this._getRenderingContext(docids, data);
        return [await this._renderTemplate(await this['reportName'], data), 'text'];
    }

    /**
     * This method generates and returns html version of a report.
     * @param docids 
     * @param data 
     * @returns 
     */
    @api.model()
    async _renderQwebHtml(docids, data?: any) {
        if (!data) {
            data = {}
        }
        setdefault(data, 'reportType', 'html');
        data = await this._getRenderingContext(docids, data);
        return [await this._renderTemplate(await this['reportName'], data), 'html'];
    }

    async _getRenderingContextModel() {
        const reportModel = await this['reportModel'] || f('report.%s', camelCaseToDot(await this['reportName']));
        return this.env.items(reportModel);
    }

    async _getRenderingContext(docids, data) {
        // If the report is using a custom model to render its html, we must use it.
        // Otherwise, fallback on the generic html rendering.
        let reportModel = await this._getRenderingContextModel();

        data = Object.assign({}, data);

        if (reportModel != null) {
            // _render_ may be executed in sudo but evaluation context as real user
            reportModel = await reportModel.sudo(false);
            update(data, await reportModel._getReportValues(docids, data));
        }
        else {
            // _render_ may be executed in sudo but evaluation context as real user
            const docs = (await this.env.items(await this['model']).sudo(false)).browse(docids);
            update(data, {
                'docIds': docids,
                'docModel': await this['model'],
                'docs': docs,
            });
        }
        data['isHtmlEmpty'] = isHtmlEmpty;
        return data;
    }

    async _render(resIds, data?: any) {
        const reportType = (await this['reportType']).toLowercase().replace('-', '_');
        const renderFunc = this['_render' + UpCamelCase(reportType)];
        if (!renderFunc) {
            return null;
        }
        return renderFunc(resIds, data);
    }

    /**
     * Return an action of type ir.actions.report.
  
     * @param docIds id/ids/browse record of the records to print (if not used, pass an empty list)
     * @param data 
     * @param config 
     * @returns 
     */
    async reportAction(docIds, data?: any, config = true) {
        let context = this.env.context;
        let activeIds;
        if (docIds) {
            if (isInstance(docIds, models.Model)) {
                activeIds = docIds.ids;
            }
            else if (typeof (docIds) === 'number') {
                activeIds = [docIds];
            }
            else if (Array.isArray(docIds)) {
                activeIds = docIds;
            }
            context = Object.assign({}, this.env.context, { activeIds: activeIds });
        }

        const [reportName, reportType, reportFile, label] = await this('reportName', 'reportType', 'reportFile', 'label');
        const reportAction = {
            'context': context,
            'data': data,
            'type': 'ir.actions.report',
            'reportName': reportName,
            'reportType': reportType,
            'reportFile': reportFile,
            'label': label,
        }

        const discardLogoCheck = this.env.context['discardLogoCheck'];
        if (await this.env.isAdmin() && ! await (await this.env.company()).externalReportLayoutId && config && !discardLogoCheck) {
            return this._actionConfigureExternalReportLayout(reportAction);
        }

        return reportAction;
    }

    async _actionConfigureExternalReportLayout(reportAction) {
        const action = this.env.items("ir.actions.actions")._forXmlid("web.actionBaseDocumentLayoutConfigurator");
        const ctx = JSON.parse(action['context'] ?? '{}');
        reportAction['closeOnReportDownload'] = true;
        ctx['reportAction'] = reportAction;
        action['context'] = ctx;
        return action;
    }
}

function createBarcodeDrawing(barcodeType: any, value: any, format: string, opts: {} = {}) {
    console.warn('Function not implemented.');
    return '';
}

const logo = `data:image/png;base64,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`;