import _ from "lodash";
import { _super, api, MetaModel, Model } from "../../../core";
import { LRU } from "../../../core/helper";
import { childNodes, getrootXml, NodeType, parseXml, range, ZipFile } from "../../../core/tools";

const FTYPES = ['docx', 'pptx', 'xlsx', 'opendoc', 'pdf'];

const indexContentCache = new LRU(1);

function textToString(element: Element) {
    let str = '';
    for (const node of childNodes<Element>(element)) {
        if (node.nodeType == NodeType.TEXT_NODE) {
            str += node.nodeValue;
        }
        else if (node.nodeType == NodeType.ELEMENT_NODE) {
            str += textToString(node);
        }
    }
    return str;
}

function getStringByTags(content: Element, listtag: string[]) {
    let str = '';
    for (const val of listtag) {
        for (const element of Array.from<Element>(content.getElementsByTagName(val))) {
            str += textToString(element) + "\n";
        }
    }
    return str;
}

@MetaModel.define()
class IrAttachment extends Model {
    static _module = module;
    static _parents = 'ir.attachment';

    /**
     * Index Microsoft .docx documents
     * @param binData 
     * @returns 
     */
    async _indexDocx(binData) {
        let str = '';
        if (ZipFile.isZip(binData)) {
            try {
                const content: Element = getrootXml(parseXml((await ZipFile.findZipEntry(binData, "word/document.xml")).toString('utf-8')));
                str = getStringByTags(content, ["w:p", "w:h", "text:list"]);
            }
            catch(e) {
                // pass
            }
        }
        return str;
    }

    /**
     * Index Microsoft .pptx documents
     * @param binData 
     * @returns 
     */
    async _indexPptx(binData) {
        let str = "";
        if (ZipFile.isZip(binData)) { 
            try {
                const zf = await ZipFile.new(binData);
                const zfFilelist = zf.filelist.filter(x => x.fileName.startsWith('ppt/slides/slide'));
                for (const i of range(1, zfFilelist.length + 1)) {
                    const content = getrootXml(parseXml((await zf.findZipEntry(`ppt/slides/slide${i}.xml`)).toString('utf-8')));
                    str = getStringByTags(content, ["a:t"]);
                }
            }
            catch(e) {
                // pass
            }
        }
        return str;
    }

    /**
     * Index Microsoft .xlsx documents
     * @param binData 
     * @returns 
     */
    async _indexXlsx(binData) {
        let str = '';
        if (ZipFile.isZip(binData)) {
            try {
                const zf = await ZipFile.new(binData);
                const content: Element = getrootXml(parseXml((await zf.findZipEntry("xl/sharedStrings.xml")).toString('utf-8')));
                str = getStringByTags(content, ["t"]);
            }
            catch(e) {
                // pass
            }
        }
        return str;
    }

    /**
     * Index OpenDocument documents (.odt, .ods...)
     * @param binData 
     * @returns 
     */
    async _indexOpendoc(binData) {
        let str = '';
        if (ZipFile.isZip(binData)) {
            try {
                const zf = await ZipFile.new(binData);
                const content: Element = getrootXml(parseXml((await zf.findZipEntry("content.xml")).toString('utf-8')));
                str = getStringByTags(content, ["text:p", "text:h", "text:list"]);
            }
            catch(e) {
                // pass
            }
        }
        return str;
    }

    /**
     * Index PDF documents
     * @param binData 
     * @returns 
     */
    async _indexPdf(binData) {
        // console.warn('Not Implemented');
        return '';
    }

    @api.model()
    async _index(binData, mimetype, checksum?: any) {
        if (checksum) {
            const cachedContent = indexContentCache.get(checksum);
            if (cachedContent) {
                return cachedContent;
            }
        }
        let res;
        for (const ftype of FTYPES) {
            const str = await this[`_index${_.upperFirst(ftype)}`](binData);
            if (str) {
                res = str.replaceAll('\x00', '');
                break;
            }
        }

        res = res || await _super(IrAttachment, this)._index(binData, mimetype, checksum);
        if (checksum) {
            indexContentCache.set(checksum, res);
        }
        return res;
    }
}
