import verp.tests
# Part of Verp. See LICENSE file for full copyright and licensing details.


@verp.tests.tagged('post_install', '-at_install')
class TestUi(verp.tests.HttpCase):

    def test_01_sale_tour(self):
        self.start_tour("/web", 'sale_tour', login="admin", step_delay=100)
