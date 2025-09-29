/** @verp-module **/

import time from 'web.time';
import publicWidget from 'web.public.widget';

publicWidget.registry.ProjectRatingImage = publicWidget.Widget.extend({
    selector: '.o-portal-project-rating .o-rating-image',

    /**
     * @override
     */
    start: function () {
        this.$el.popover({
            placement: 'bottom',
            trigger: 'hover',
            html: true,
            content: function () {
                var $elem = $(this);
                var id = $elem.data('id');
                var ratingDate = $elem.data('rating-date');
                var baseDate = time.autoStrToDate(ratingDate);
                var duration = moment(baseDate).fromNow();
                var $rating = $('#rating_' + id);
                $rating.find('.rating-timeduration').text(duration);
                return $rating.html();
            },
        });
        return this._super.apply(this, arguments);
    },
});
