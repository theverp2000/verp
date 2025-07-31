import { MetaModel, Model } from "../../../core/models"

@MetaModel.define()
class GamificationBadge extends Model {
    static _module = module;
    static _name = 'gamification.badge';
    static _parents = ['gamification.badge', 'website.published.mixin'];
}
