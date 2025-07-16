import { _Date } from "../../../core";
import { _super, MetaModel, Model } from "../../../core/models"
import { len, range, subDate } from "../../../core/tools";

@MetaModel.define()
class WebsiteSnippetFilter extends Model {
    static _module = module;
    static _parents = 'website.snippet.filter';

    async _getHardcodedSample(model) {
        let samples = await _super(WebsiteSnippetFilter, this)._getHardcodedSample(model);
        if (model._name === 'blog.post') {
            const data = [{
                'coverProperties': '{"background-image": "url(\'/website_blog/static/src/img/cover_2.jpg\')", "resizeClass": "o-record-has-cover o-half-screen-height", "opacity": "0"}',
                'label': await this._t('Islands'),
                'subtitle': await this._t('Alone in the ocean'),
                'postDate': subDate(_Date.today(),{days: 1}),
                'websiteUrl': "",
            }, {
                'coverProperties': '{"background-image": "url(\'/website_blog/static/src/img/cover_3.jpg\')", "resizeClass": "o-record-has-cover o-half-screen-height", "opacity": "0"}',
                'label': await this._t('With a View'),
                'subtitle': await this._t('Awesome hotel rooms'),
                'postDate': subDate(_Date.today(), {days: 2}),
                'website_url': "",
            }, {
                'coverProperties': '{"background-image": "url(\'/website_blog/static/src/img/cover_4.jpg\')", "resizeClass": "o-record-has-cover o-half-screen-height", "opacity": "0"}',
                'label': await this._t('Skies'),
                'subtitle': await this._t('Taking pictures in the dark'),
                'postDate': subDate(_Date.today(),{days: 3}),
                'websiteUrl': "",
            }, {
                'coverProperties': '{"background-image": "url(\'/website_blog/static/src/img/cover_5.jpg\')", "resizeClass": "o-record-has-cover o-half-screen-height", "opacity": "0"}',
                'label': await this._t('Satellites'),
                'subtitle': await this._t('Seeing the world from above'),
                'postDate': subDate(_Date.today(), {days: 4}),
                'websiteUrl': "",
            }, {
                'coverProperties': '{"background-image": "url(\'/website_blog/static/src/img/cover_6.jpg\')", "resizeClass": "o-record-has-cover o-half-screen-height", "opacity": "0"}',
                'label': await this._t('Viewpoints'),
                'subtitle': await this._t('Seaside vs mountain side'),
                'postDate': subDate(_Date.today(), {days: 5}),
                'websiteUrl': "",
            }, {
                'coverProperties': '{"background-image": "url(\'/website_blog/static/src/img/cover_7.jpg\')", "resizeClass": "o-record-has-cover o-half-screen-height", "opacity": "0"}',
                'label': await this._t('Jungle'),
                'subtitle': await this._t('Spotting the fauna'),
                'postDate': subDate(_Date.today(), {days: 6}),
                'websiteUrl': "",
            }]
            const merged = [];
            for (const index of range(0, Math.max(len(samples), len(data)))) {
                merged.push({...samples[index % len(samples)], ...data[index % len(data)]});
                // merge definitions
            }
            samples = merged;
        }
        return samples;
    }
}