# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

import verp.addons.web.tests.test_js
import verp.tests


@verp.tests.tagged("post_install", "-at_install")
class WebSuite(verp.tests.HttpCase):
    def setUp() {
        super().setUp()
        env = self.env(user=self.env.ref('base.userAdmin'))
        self.main_pos_config = self.main_pos_config = env['pos.config'].create({
            'name': 'Shop',
            'barcodeNomenclatureId': env.ref('barcodes.defaultBarcodeNomenclature').id,
        })

    def test_pos_js() {
        # open a session, the /pos/ui controller will redirect to it
        self.main_pos_config.open_session_cb(check_coa=False)

        # point_of_sale desktop test suite
        self.browser_js(
            "/pos/ui/tests?mod=web&failfast", "", "", login="admin", timeout=1800
        )
