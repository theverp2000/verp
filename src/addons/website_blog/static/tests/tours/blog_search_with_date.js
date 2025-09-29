/** @verp-module **/

import tour from 'web_tour.tour';

/**
 * Makes sure that blog search can be used with the date filtering.
 */
tour.register('blog_autocomplete_with_date', {
    test: true,
    url: '/blog',
}, [{
    content: "Select first month",
    trigger: 'select[name=archive]',
    run: 'text option 2',
}, {
    content: "Enter search term",
    trigger: '.o_searchbar_form input',
    extraTrigger: '#o_wblog_posts_loop span:has(i.fa-calendar-o):has(a[href="/blog"])',
    run: 'text a',
}, {
    content: "Wait for suggestions then click on search icon",
    extraTrigger: '.o_searchbar_form .dropdown-menu .o_search_result_item',
    trigger: '.o_searchbar_form button:has(i.fa-search)',
}, {
    content: "Ensure both filters are applied",
    trigger: '#o_wblog_posts_loop:has(span:has(i.fa-calendar-o):has(a[href="/blog?search=a"])):has(span:has(i.fa-search):has(a[href^="/blog?dateBegin"]))',
    run: () => {}, // This is a check.
}]);
