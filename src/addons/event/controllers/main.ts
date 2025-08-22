import { http } from "../../../core"
import { contentDisposition } from "../../../core/http";
import { NotFound } from "../../../core/service";
import { f, len } from "../../../core/tools";

@http.define()
class EventController extends http.Controller {
    static _module = module;

    @http.route(['/event/<model("event.event"):event>/ics'], {type: 'http', auth: "public"})
    async eventIcsFile(req, res, opts: {event?: any}) {
        const user = await (await req.getEnv()).user();
        let lang = req.context['lang'] ?? await user.lang;
        if (await user._isPublic()) {
            lang = req.cookies['frontend_lang'];
        }
        const event = await opts.event.withContext({lang});
        const files = await event._getIcsFile();
        if (!(event.id in files)) {
            return new NotFound(res);
        }
        const content = files[event.id];
        return req.makeResponse(res, content, [
            ['Content-Type', 'application/octet-stream'],
            ['Content-Length', len(content)],
            ['Content-Disposition', contentDisposition(f('%s.ics', await event.this))]
        ]);
    }
}
