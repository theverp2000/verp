import { api, Fields, MetaModel, TransientModel } from "../../../core";

@MetaModel.define()
class ResConfigSettings extends TransientModel {
    static _module = module;
    static _parents = 'res.config.settings';

    static moduleEventSale = Fields.Boolean("Tickets");
    static moduleWebsiteEventMeet = Fields.Boolean("Discussion Rooms");
    static moduleWebsiteEventTrack = Fields.Boolean("Tracks and Agenda");
    static moduleWebsiteEventTrackLive = Fields.Boolean("Live Mode");
    static moduleWebsiteEventTrackQuiz = Fields.Boolean("Quiz on Tracks");
    static moduleWebsiteEventExhibitor = Fields.Boolean("Advanced Sponsors");
    static moduleWebsiteEventQuestions = Fields.Boolean("Registration Survey");
    static moduleEventBarcode = Fields.Boolean("Barcode");
    static moduleWebsiteEventSale = Fields.Boolean("Online Ticketing");
    static moduleEventBooth = Fields.Boolean("Booth Management");

    /**
     * Reset sub-modules, otherwise you may have track to False but still
        have trackLive or trackQuiz to True, meaning track will come back due
        to dependencies of modules.
     */
    @api.onchange('moduleWebsiteEventTrack')
    async _onchangeModuleWebsiteEventTrack() {
        for (const config of this) {
            if (!await config.moduleWebsiteEventTrack) {
                await config.set('moduleWebsiteEventTrackLive', false);
                await config.set('moduleWebsiteEventTrackQuiz', false);
            }
        }
    }
}