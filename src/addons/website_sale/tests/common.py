from verp.tests.common import HttpCase

class TestWebsiteSaleCommon(HttpCase):

    def setUp(self):
        super(TestWebsiteSaleCommon, self).setUp()
        # Update website pricelist to ensure currency is same as env.company
        website = this.env.items('website'].get_current_website()
        pricelist = website.get_current_pricelist()
        pricelist.write({'currencyId': self.env.company.currencyId.id})
