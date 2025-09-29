async function* template201(self, values, log={}) {
  let result, attrs, tagName, forceDisplay, content, tCallValues, tCallOptions, renderTemplate, tFieldTOptions, tCallAssetsNodes;
  try {
      _debug(String(template201.name)); // detail code
  log["lastPathNode"] = "/t";
  log["lastPathNode"] = "/t/t";
  yield `
      `;
  {
  async function* tCallContent(self, values, log) {
      log["lastPathNode"] = "/t/t/t";
      yield `
         `;
      {
      async function* tCallContent(self, values, log) {
          yield `
                 <div class="pt-5">
                     <div class="address row">
                         <div name="address" class="col-5" style="margin-left: auto">
                             <address>
                                 <address class="mb-0" itemscope="itemscope" itemtype="http://schema.org/Organization">
                                     <div>
                                         <span itemprop="label">Deco Addict</span>
                                     </div>
                                     <div itemprop="address" itemscope="itemscope" itemtype="http://schema.org/PostalAddress">
                                         <div class="d-flex align-items-baseline">
                                             <span class="w-100 o-force-ltr" itemprop="streetAddress">77 Santa Barbara
                                                 Rd<br/>Pleasant Hill CA 94523<br/>United States</span>
                                         </div>
                                     </div>
                                 </address>
                             </address>
                         </div>
                     </div>
                 </div>
                 <div class="page">
                     <h2>
                         <span>Invoice</span>
                         <span>INV/2020/07/0003</span>
                     </h2>
                     <div id="informations" class="row mt32 mb32">
                         <div class="col-auto mw-100 mb-2" name="invoiceDate">
                             <strong>Invoice Date:</strong>
                             <p class="m-0">07/08/2020</p>
                         </div>
                         <div class="col-auto mw-100 mb-2" name="dueDate">
                             <strong>Due Date:</strong>
                             <p class="m-0">08/07/2020</p>
                         </div>
                     </div>
                     <table class="table table-sm o-main-table" name="invoiceLineTable">
                         <thead>
                             <tr>
                                 <th name="thDescription" class="text-left"><span>Description</span></th>
                                 <th name="thQuantity" class="text-right"><span>Quantity</span></th>
                                 <th name="thPriceunit" class="text-right d-md-table-cell"><span>Unit Price</span></th>
                                 <th name="thTaxes" class="text-left d-md-table-cell"><span>Taxes</span></th>
                                 <th name="thSubtotal" class="text-right">
                                     <span>Amount</span>
                                 </th>
                             </tr>
                         </thead>
                         <tbody class="invoiceTbody">
                             <tr>
                                 <td name="accountInvoiceLineName"><span>[FURN_8999] Three-Seat Sofa<br/>
                                     Three Seater Sofa with Lounger in Steel Grey Colour</span></td>
                                 <td class="text-right">
                                     <span>5.000</span>
                                 </td>
                                 <td class="text-right d-md-table-cell">
                                     <span class="text-nowrap">1,500.00</span>
                                 </td>
                                 <td class="text-left d-md-table-cell">
                                     <span id="lineTaxIds">15.00%</span>
                                 </td>
                                 <td class="text-right o-price-total">
                                     <span class="text-nowrap">$ <span class="oe-currency-value">7,500.00</span></span>
                                 </td>
                             </tr>
                             <tr>
                                 <td name="accountInvoiceLineName"><span>[FURN_8220] Four Person Desk<br/>
                                     Four person modern office workstation</span></td>
                                 <td class="text-right">
                                     <span>5.000</span>
                                 </td>
                                 <td class="text-right d-md-table-cell">
                                     <span class="text-nowrap">2,350.00</span>
                                 </td>
                                 <td class="text-left d-md-table-cell">
                                     <span id="lineTaxIds">15.00%</span>
                                 </td>
                                 <td class="text-right o-price-total">
                                     <span class="text-nowrap">$ <span class="oe-currency-value">11,750.00</span></span>
                                 </td>
                             </tr>
                         </tbody>
                     </table>
                     <div class="clearfix">
                         <div id="total" class="row">
                             <div class="col-7 ml-auto">
                                 <table class="table table-sm" style="page-break-inside: avoid; position:relative;">
                                     <tbody><tr class="border-black o-subtotal" style="">
                                         <td><strong>Subtotal</strong></td>
                                         <td class="text-right">
                                             <span>$ <span class="oe-currency-value">19,250.00</span></span>
                                         </td>
                                     </tr>
                                         <tr style="">
                                             <td><span class="text-nowrap">Tax 15%</span></td>
                                             <td class="text-right o-price-total">
                                                 <span class="text-nowrap">$ 2,887.50</span>
                                             </td>
                                         </tr>
                                         <tr class="border-black o-total">
                                             <td><strong>Total</strong></td>
                                             <td class="text-right">
                                                 <span class="text-nowrap">$ <span class="oe-currency-value">
                                                     22,137.50</span></span>
                                             </td>
                                         </tr>
                                     </tbody></table>
                             </div>
                         </div>
                     </div>
                     <p>
                         Please use the following communication for your payment : <b><span>
                         INV/2020/07/0003</span></b>
                     </p>
                     <p name="paymentTerm">
                         <span>Payment terms: 30 Days</span>
                     </p>
                 </div>
         `;
      }
      tCallValues = Object.assign({},  values);
      let res = '';
      for await (const str of tCallContent(self, tCallValues, log)) 
          res = res + str;
      tCallValues['0'] = markup(res)
      }
      tCallOptions = Object.assign({}, compileOptions);        Object.assign(tCallOptions, {'callerTemplate': "201", 'lastPathNode': "/t/t/t" })
      for await (const val of (await self._compile("web.externalLayout", tCallOptions))(self, tCallValues)) {                yield val;              }
      yield `
      `;
  }
  tCallValues = Object.assign({},  values);
  let res = '';
  for await (const str of tCallContent(self, tCallValues, log)) 
      res = res + str;
  tCallValues['0'] = markup(res)
  }
  tCallOptions = Object.assign({}, compileOptions);    Object.assign(tCallOptions, {'callerTemplate': "201", 'lastPathNode': "/t/t" })
  for await (const val of (await self._compile("web.htmlPreviewContainer", tCallOptions))(self, tCallValues)) {            yield val;          }
  yield `
  `;
  } catch(e) {
      // _debug('Error in %s at %s: %s', 'template201', log["lastPathNode"], e);
      _debug(String(template201)); // detail code
      throw e;
  }
}