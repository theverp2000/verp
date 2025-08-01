verp.define('website_sale.tour_shop_list_view_b2c', function (require) {
'use strict';

var tour = require('web_tour.tour');
const tourUtils = require('website_sale.tour_utils');

tour.register('shop_list_view_b2c', {
    test: true,
    url: '/shop?search=Test Product',
},
    [
        {
            content: "check price on /shop",
            trigger: '.oe_product_cart .oe-currency-value:contains("825.00")',
            run: function () {},
        },
        {
            content: "select product",
            trigger: '.oe_product_cart a:contains("Test Product")',
        },
        {
            content: "check list view of variants is disabled initially (when on /product page)",
            trigger: 'body:not(:has(.js-product-change))',
            extraTrigger: '#product_details',
            run: function () {},
        },
        {
            content: "open customize menu",
            trigger: '#customizeMenu > a',
            extraTrigger: 'body:not(.notReady)',
        },
        {
            content: "click on 'List View of Variants'",
            trigger: '#customizeMenu label:contains(List View of Variants)',
        },
        {
            content: "check page loaded after list of variant customization enabled",
            trigger: '.js-product-change',
            run: function () {},
        },
        {
            context: "check variant price",
            trigger: '.custom-radio:contains("Aluminium") .badge:contains("+") .oe-currency-value:contains("55.44")',
            run: function () {},
        },
        {
            content: "check price is 825",
            trigger: '.product_price .oe-price .oe-currency-value:containsExact("825.00")',
            run: function () {},
        },
        {
            content: "switch to another variant",
            trigger: '.js-product label:contains("Aluminium")',
        },
        {
            content: "verify that price has changed when changing variant",
            trigger: '.product_price .oe-price .oe-currency-value:containsExact("880.44")',
            run: function () {},
        },
        {
            content: "click on 'Add to Cart' button",
            trigger: 'a:contains(ADD TO CART)',
        },
            tourUtils.goToCart(),
        {
            content: "check price on /cart",
            trigger: '#cart_products .oe-currency-value:containsExact("880.44")',
            run: function () {},
        },
    ]
);

});
