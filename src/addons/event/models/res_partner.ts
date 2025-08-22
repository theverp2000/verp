import { Fields, MetaModel, Model } from "../../../core";

@MetaModel.define()
class ResPartner extends Model {
    static _module = module;
    static _parents = 'res.partner';

    static eventCount = Fields.Integer(
        '# Events', {compute: '_computeEventCount', groups: 'event.groupEventRegistrationDesk',
        help: 'Number of events the partner has participated.'});

    async _computeEventCount() {
        await this.set('eventCount', 0);
        for (const partner of this) {
            await partner.set('eventCount', await this.env.items('event.event').searchCount([['registrationIds.partnerId', 'childOf', partner.ids]]));
        }
    }

    async actionEventView() {
        const action = await this.env.items("ir.actions.actions")._forXmlid("event.actionEventView");
        action['context'] = {}
        action['domain'] = [['registrationIds.partnerId', 'childOf', this.ids]];
        return action;
    }
}
