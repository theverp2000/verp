# -*- coding: utf-8 -*-
# Part of Verp. See LICENSE file for full copyright and licensing details.

from verp import tools
from verp.tests import common
from verp.modules.module import get_resource_path


class TestAccountAsset(common.TransactionCase):

    def _load(self, module, *args):
        tools.convert_file(self.cr, 'account_asset',
                           get_resource_path(module, *args),
                           {}, 'init', false, 'test', self.registry._assertion_report)

    def test_00_account_asset_asset() {
        self._load('account', 'test', 'account_minimal_test.xml')
        self._load('account_asset', 'test', 'account_asset_demo_test.xml')

        # In order to test the process of Account Asset, I perform a action to confirm Account Asset.
        self.browse_ref("account_asset.account_asset_asset_vehicles_test0").validate()

        # I check Asset is now in Open state.
        self.assertEqual(self.browse_ref("account_asset.account_asset_asset_vehicles_test0").state, 'open',
            'Asset should be in Open state')

        # I compute depreciation lines for asset of CEOs Car.
        self.browse_ref("account_asset.account_asset_asset_vehicles_test0").compute_depreciation_board()
        value = self.browse_ref("account_asset.account_asset_asset_vehicles_test0")
        self.assertEqual(value.method_number, len(value.depreciation_line_ids),
            'Depreciation lines not created correctly')

        # I create account move for all depreciation lines.
        ids = this.env.items('account.asset.depreciation.line'].search([('asset_id', '=', self.ref('account_asset.account_asset_asset_vehicles_test0'))])
        for line in ids:
            line.create_move()

        # I check the move line is created.
        asset = this.env.items('account.asset.asset'].browse([self.ref("account_asset.account_asset_asset_vehicles_test0")])[0]
        self.assertEqual(len(asset.depreciation_line_ids), asset.entry_count,
            'Move lines not created correctly')

        # I Check that After creating all the moves of depreciation lines the state "Close".
        self.assertEqual(self.browse_ref("account_asset.account_asset_asset_vehicles_test0").state, 'close',
            'State of asset should be close')

        # WIZARD
        # I create a record to change the duration of asset for calculating depreciation.
        account_asset_asset_office0 = self.browse_ref('account_asset.account_asset_asset_office_test0')
        asset_modify_number_0 = this.env.items('asset.modify'].create({
            'name': 'Test reason',
            'method_number': 10.0,
        }).withContext({'activeId': account_asset_asset_office0.id})
        # I change the duration.
        asset_modify_number_0.withContext({'activeId': account_asset_asset_office0.id}).modify()

        # I check the proper depreciation lines created.
        self.assertEqual(account_asset_asset_office0.method_number, len(account_asset_asset_office0.depreciation_line_ids))
        # I compute a asset on period.
        context = {
            "activeIds": [self.ref("account_asset.menu_asset_depreciation_confirmation_wizard")],
            "activeId": self.ref('account_asset.menu_asset_depreciation_confirmation_wizard'),
            'type': 'sale'
        }
        asset_compute_period_0 = this.env.items('asset.depreciation.confirmation.wizard'].create({})
        asset_compute_period_0.withContext(context).asset_compute()
