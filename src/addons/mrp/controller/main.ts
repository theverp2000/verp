import { WebRequest } from '../../../core/http';
import { encodebytes, parseInt, stringify } from '../../../core/tools';
import { http } from '../../../core'; 

@http.define()
class MrpDocumentRoute extends http.Controller {
    static _module = module;

    @http.route('/mrp/uploadAttachment', {type: 'http', methods: ['POST'], auth: "user"})
    async uploadDocument(req: WebRequest, res, opts: any={}) {
        const files = req.params.getlist('ufile');
        let result: {} = {'success': await this._t("All files uploaded")};
        const env = await req.getEnv();
        for (const ufile of files) {
            try {
                const mimetype = ufile.contentType;
                await env.items('mrp.document').create({
                    'label': ufile.filename,
                    'resModel': opts['resModel'],
                    'resId': parseInt(opts['resId']),
                    'mimetype': mimetype,
                    'datas': encodebytes(ufile.read()),
                });
            } catch(e) {
                console.error("Fail to upload document %s", ufile.filename);
                result = {'error': String(e)};
            }
        }
        return stringify(result);
    }
}