verp.define('website_sale_tour.tour', function (require) {
    'use strict';

    var tour = require("web_tour.tour");
    var rpc = require("web.rpc");
    const tourUtils = require('website_sale.tour_utils');

    tour.register('website_sale_tour', {
        test: true,
        url: '/shop?search=Storage Box Test',
    }, [
    // Testing b2c with Tax-Excluded Prices
    {
        content: "Open product page",
        trigger: '.oe_product_cart a:contains("Storage Box Test")',
    },
    {
        content: "Add one more storage box",
        trigger: '.js-add-cart-json:eq(1)',
    },
    {
        content: "Check b2b Tax-Excluded Prices",
        trigger: '.product_price .oe-price .oe-currency-value:containsExact(79.00)',
        run: function () {}, // it's a check
    },
    {
        content: "Click on add to cart",
        trigger: '#add_to_cart',
    },
        tourUtils.goToCart(2),
    {
        content: "Check for 2 products in cart and proceed to checkout",
        extraTrigger: '#cart_products tr:contains("Storage Box Test") input.js-quantity:propValue(2)',
        trigger: 'a[href*="/shop/checkout"]',
    },
    {
        content: "Check Price b2b subtotal",
        trigger: 'tr#order_total_untaxed .oe-currency-value:containsExact(158.00)',
        run: function () {}, // it's a check
    },
    {
        content: "Check Price b2b Sale Tax(15%)",
        trigger: 'tr#order_total_taxes .oe-currency-value:containsExact(23.70)',
        run: function () {}, // it's a check
    },
    {
        content: "Check Price b2b Total amount",
        trigger: 'tr#order_total .oe-currency-value:containsExact(181.70)',
        run: function () {}, // it's a check
    },
    {
        content: "Fulfill billing address form",
        trigger: 'select[name="countryId"]',
        run: function () {
            $('input[name="label"]').val('abc');
            $('input[name="phone"]').val('99999999');
            $('input[name="email"]').val('abc@theverp.com');
            $('input[name="street"]').val('SO1 Billing Street, 33');
            $('input[name="city"]').val('SO1BillingCity');
            $('input[name="zip"]').val('10000');
            $('#countryId option:eq(1)').attr('selected', true);
        },
    },
    {
        content: "Shipping address is not same as billing address",
        trigger: '#shipping_use_same',
    },
    {
        content: "Click on next button",
        trigger: '.oe-cart .btn:contains("Next")',
    },
    {
        content: "Fulfill shipping address form",
        trigger: 'select[name="countryId"]',
        extraTrigger: 'h2:contains("Shipping Address")',
        run: function () {
            $('input[name="label"]').val('def');
            $('input[name="phone"]').val('8888888888');
            $('input[name="street"]').val('17, SO1 Shipping Road');
            $('input[name="city"]').val('SO1ShippingCity');
            $('input[name="zip"]').val('10000');
            $('#countryId option:eq(1)').attr('selected', true);
        },
    },
    {
        content: "Click on next button",
        trigger: '.oe-cart .btn:contains("Next")',
    },
    {
        content: "Check selected billing address is same as typed in previous step",
        trigger: '#shipping_and_billing:contains(SO1 Billing Street, 33):contains(SO1BillingCity):contains(Afghanistan)',
        run: function () {}, // it's a check
    },
    {
        content: "Check selected shipping address is same as typed in previous step",
        trigger: '#shipping_and_billing:contains(17, SO1 Shipping Road):contains(SO1ShippingCity):contains(Afghanistan)',
        run: function () {}, // it's a check
    },
    {
        content: "Click for edit address",
        trigger: 'a:contains("Edit") i',
    },
    {
        content: "Click for edit billing address",
        trigger: '.js_edit_address:first',
    },
    {
        content: "Change billing address form",
        trigger: 'select[name="countryId"]',
        extraTrigger: 'h2:contains("Your Address")',
        run: function () {
            $('input[name="label"]').val('abcd');
            $('input[name="phone"]').val('11111111');
            $('input[name="street"]').val('SO1 Billing Street Edited, 33');
            $('input[name="city"]').val('SO1BillingCityEdited');
        },
    },
    {
        content: "Click on next button",
        trigger: '.oe-cart .btn:contains("Next")',
    },
    {
        content: "Confirm Address",
        trigger: 'a.btn:contains("Confirm")',
    },
    {
        content: "Check selected billing address is same as typed in previous step",
        trigger: '#shipping_and_billing:contains(SO1 Billing Street Edited, 33):contains(SO1BillingCityEdited):contains(Afghanistan)',
        run: function () {}, // it's a check
    },
    {
        content: "Select `Wire Transfer` payment method",
        trigger: '#payment_method label:contains("Wire Transfer")',
    },
    {
        content: "Pay Now",
        // extraTrigger: '#payment_method label:contains("Wire Transfer") input:checked,#payment_method:not(:has("input:radio:visible"))',
        trigger: 'button[name="o_payment_submit_button"]:visible:not(:disabled)',
    },
    {
        content: "Sign up",
        trigger: '.oe-cart a:contains("Sign Up")',
    },
    {
        content: "Submit login",
        trigger: '.oe_signup_form',
        run: function () {
            $('.oe_signup_form input[name="password"]').val("1admin@admin");
            $('.oe_signup_form input[name="confirm_password"]').val("1admin@admin");
            $('.oe_signup_form').submit();
        },
    },
    {
        content: "See Quotations",
        trigger: '.o_portal_docs a:contains("Quotations")',
    },
    // Sign in as admin change config auth_signup -> b2b, sale_show_tax -> total and Logout
    {
        content: "Open Dropdown for logout",
        trigger: '#topMenu li.dropdown:visible a:contains("abcd")',
    },
    {
        content: "Logout",
        trigger: '#o_logout:contains("Logout")',
    },
    {
        content: "Sign in as admin",
        trigger: 'header a[href="/web/login"]',
    },
    {
        content: "Submit login",
        trigger: '.oe_login_form',
        run: function () {
            $('.oe_login_form input[name="login"]').val("admin");
            $('.oe_login_form input[name="password"]').val("admin");
            $('.oe_login_form input[name="redirect"]').val("/");
            $('.oe_login_form').submit();
        },
    },
    {
        content: "Configuration Settings for 'Tax Included' and sign up 'On Invitation'",
        extraTrigger: '.o_connected_user #wrapwrap',
        trigger: '#wrapwrap',
        run: function () {
            var def1 = rpc.query({
                model: 'res.config.settings',
                method: 'create',
                args: [{
                    'auth_signup_uninvited': 'b2b',
                    'show_line_subtotals_tax_selection': 'tax_included',
                    'group_show_line_subtotals_tax_excluded': false,
                    'group_show_line_subtotals_tax_included': true,
                }],
            });
            var def2 = def1.then(function (resId) {
                return rpc.query({
                    model: 'res.config.settings',
                    method: 'execute',
                    args: [[resId]],
                });
            });
            def2.then(function () {
                window.location.href = '/web/session/logout?redirect=/shop?search=Storage Box Test';
            });
        },
    },
    // Testing b2b with Tax-Included Prices
    {
        content: "Open product page",
        trigger: '.oe_product_cart a:contains("Storage Box Test")',
    },
    {
        content: "Add one more Storage Box Test",
        trigger: '.js-add-cart-json:eq(1)',
    },
    {
        content: "Check b2c Tax-Included Prices",
        trigger: '.product_price .oe-price .oe-currency-value:containsExact(90.85)',
        run: function () {}, // it's a check
    },
    {
        content: "Click on add to cart",
        trigger: '#add_to_cart',
    },
        tourUtils.goToCart(2),
    {
        content: "Check for 2 products in cart and proceed to checkout",
        extraTrigger: '#cart_products tr:contains("Storage Box Test") input.js-quantity:propValue(2)',
        trigger: 'a[href*="/shop/checkout"]',
    },
    {
        content: "Check Price b2c total",
        trigger: 'tr#order_total_untaxed .oe-currency-value:containsExact(158.00)',
        run: function () {}, // it's a check
    },
    {
        content: "Check Price b2c Sale Tax(15%)",
        trigger: 'tr#order_total_taxes .oe-currency-value:containsExact(23.70)',
        run: function () {}, // it's a check
    },
    {
        content: "Check Price b2c Total amount",
        trigger: 'tr#order_total .oe-currency-value:containsExact(181.70)',
        run: function () {}, // it's a check
    },
    {
        content: "Click on Login Button",
        trigger: '.oe-cart a.btn:contains("Log In")',
    },
    {
        content: "Submit login",
        trigger: '.oe_login_form',
        run: function () {
            $('.oe_login_form input[name="login"]').val("abc@theverp.com");
            $('.oe_login_form input[name="password"]').val("1admin@admin");
            $('.oe_login_form').submit();
        },
    },
    {
        content: "Add new shipping address",
        trigger: '.one_kanban form[action^="/shop/address"] .btn',
    },
    {
        content: "Fulfill shipping address form",
        trigger: 'select[name="countryId"]',
        run: function () {
            $('input[name="label"]').val('ghi');
            $('input[name="phone"]').val('7777777777');
            $('input[name="street"]').val('SO2New Shipping Street, 5');
            $('input[name="city"]').val('SO2NewShipping');
            $('input[name="zip"]').val('1200');
            $('#countryId option:eq(1)').attr('selected', true);
        },
    },
    {
        content: "Click on next button",
        trigger: '.oe-cart .btn:contains("Next")',
    },
    {
        content: "Select `Wire Transfer` payment method",
        trigger: '#payment_method label:contains("Wire Transfer")',
    },
    {
        content: "Pay Now",
        extraTrigger: '#payment_method label:contains("Wire Transfer") input:checked,#payment_method:not(:has("input:radio:visible"))',
        trigger: 'button[name="o_payment_submit_button"]:visible:not(:disabled)',
    },
    {
        content: "Open Dropdown for See quotation",
        extraTrigger: '.oe-cart .oe_website_sale_tx_status',
        trigger: '#topMenu li.dropdown:visible a:contains("abc")',
    },
    {
        content: "My account",
        extraTrigger: '#topMenu li.dropdown .js_usermenu.show',
        trigger: '#topMenu .dropdown-menu a[href="/my/home"]:visible',
    },
    {
        content: "See Quotations",
        trigger: '.o_portal_docs a:contains("Quotations") .badge:containsExact(2)',
    },

    // enable extra step on website checkout and check extra step on checkout process
    {
        content: "Open Dropdown for logout",
        trigger: '#topMenu li.dropdown:visible a:contains("abc")',
    },
    {
        content: "Logout",
        trigger: '#o_logout:contains("Logout")',
    },
    {
        content: "Sign in as admin",
        trigger: 'header a[href="/web/login"]',
    },
    {
        content: "Submit login",
        trigger: '.oe_login_form',
        run: function () {
            $('.oe_login_form input[name="login"]').val("admin");
            $('.oe_login_form input[name="password"]').val("admin");
            $('.oe_login_form input[name="redirect"]').val("/shop/cart");
            $('.oe_login_form').submit();
        },
    },
    {
        content: "Open Customize menu",
        trigger: '.o_menu_sections a:contains("Customize")',
    },
    {
        content: "Enable Extra step",
        trigger: 'label.dropdown-item:contains("Extra Step Option")',
    },
    {
        content: "Open Dropdown for logout",
        extraTrigger: '.progress-wizard-step:contains("Extra Info")',
        trigger: '#topMenu li.dropdown:visible a:contains("Mitchell Admin")',
    },
    {
        content: "Logout",
        trigger: '#o_logout:contains("Logout")',
    },
    {
        content: "Sign in as abc",
        trigger: 'header a[href="/web/login"]',
    },
    {
        content: "Submit login",
        trigger: '.oe_login_form',
        run: function () {
            $('.oe_login_form input[name="login"]').val("abc@theverp.com");
            $('.oe_login_form input[name="password"]').val("1admin@admin");
            $('.oe_login_form input[name="redirect"]').val("/shop?search=Storage Box Test");
            $('.oe_login_form').submit();
        },
    },
    {
        content: "Open product page",
        trigger: '.oe_product_cart a:contains("Storage Box Test")',
    },
    {
        content: "Click on add to cart",
        trigger: '#add_to_cart',
    },
        tourUtils.goToCart(),
    {
        content: "Proceed to checkout",
        trigger: 'a[href*="/shop/checkout"]',
    },
    {
        content: "Click on next button",
        trigger: '.oe-cart .btn:contains("Next")',
    },
    {
        content: "Check selected billing address is same as typed in previous step",
        trigger: '#shipping_and_billing:contains(SO1 Billing Street Edited, 33):contains(SO1BillingCityEdited):contains(Afghanistan)',
        run: function () {}, // it's a check
    },
    {
        content: "Check selected shipping address is same as typed in previous step",
        trigger: '#shipping_and_billing:contains(SO2New Shipping Street, 5):contains(SO2NewShipping):contains(Afghanistan)',
        run: function () {}, // it's a check
    },
    {
        content: "Select `Wire Transfer` payment method",
        trigger: '#payment_method label:contains("Wire Transfer")',
    },
    {
        content: "Pay Now",
        extraTrigger: '#payment_method label:contains("Wire Transfer") input:checked,#payment_method:not(:has("input:radio:visible"))',
        trigger: 'button[name="o_payment_submit_button"]:visible',
    }]);
});
