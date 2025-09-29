import _ from 'lodash';

const result = [[12, 'test_access_rights', 10, 'test of access rights and rules', '', 'Testing of access restrictions', 'Verp S.A.', null, null], [20, 'test_convert', 10, 'test_convert', '', 'Data for xml conversion tests', 'Verp S.A.', null, null], [118, 'microsoft_outlook', 1, 'Microsoft Outlook', '', 'Outlook support for outgoing mail servers', 'Verp S.A.', null, null], [119, 'test_event_full', 10, 'Test Full Event Flow', '', '\nThis module will test the main event flows of Verp, both frontend and backend.\nIt installs sale capabilities, front-end flow, eCommerce, questions and\nautomatic lead generation, full Online support, ...\n', 'Verp S.A.', null, null], [120, 'auth_password_policy_signup', 24, 'Password Policy support for Signup', '', '', 'Verp S.A.', null, null], [121, 'account_fleet', 4, 'Accounting/Fleet bridge', 'Manage accounting with fleets', '', 'Verp S.A.', null, null], [60, 'barcodes', 1, 'Barcode', 'Scan and Parse Barcodes', '', 'Verp S.A.', null, null], [13, 'website_livechat', 1, 'Website Live Chat', 'Chat with your website visitors', '\nAllow website visitors to chat with the collaborators. This module also brings a feedback tool for the livechat and web pages to display your channel with its ratings on the website.\n    ', 'Verp S.A.', null, null], [14, 'test_website_modules', 1, 'Website Modules Test', '', 'This module contains tests related to website modules.\nIt allows to test website business code when another website module is\ninstalled.', 'Verp S.A.', null, null], [17, 'mass_mailing_event_track', 1, 'Mass mailing on track speakers', '', '\nMass mail event track speakers\n==============================\n\nBridge module adding UX requirements to ease mass mailing of event track speakers.\n        ', 'Verp S.A.', null, null], [18, 'mass_mailing_sale', 1, 'Mass mailing on sale orders', 'Add sale order UTM info on mass mailing', 'UTM and mass mailing on sale orders', 'Verp S.A.', null, null], [24, 'test_auth_custom', 1, 'Tests that custom auth works & is not impaired by CORS', '', '', 'Verp S.A.', null, null], [26, 'pos_adyen', 12, 'POS Adyen', 'Integrate your POS with an Adyen payment terminal', '', 'Verp S.A.', null, null], [31, 'test_inherit', 10, 'test-inherit', '', 'A module to verify the inheritance.', 'Verp S.A.', null, null]]

function* iter(items: any) {
  if (!(typeof items === 'object'))
    yield items;
  items = items instanceof Array ? items : Object.keys(items);
  for (const item of items) {
    yield item;
  }
}

const zip = _.zip(...result);
const cols = iter(zip);
const ids = cols.next().value
console.debug(ids);
const values = cols.next().value;
console.debug(values);

export {}