import * as xpath from 'xpath';
import * as xml from '../../core/tools/xml';

const parent = `
<template>
  <div data-js="SnippetMove" data-selector="section, .accordion > .card, .s-showcase .row:not(.s-col-no-resize) > div" data-noScroll=".accordion > .card">
    <we-button class="fa fa-fw fa-angle-up" data-move-snippet="prev" data-no-preview="true" data-name="moveUpOpt"/>
    <we-button class="fa fa-fw fa-angle-down" data-move-snippet="next" data-no-preview="true" data-name="moveDownOpt"/>
  </div>
</template>`;

const source1 = `<form string="Partners"
                xmlns="http://www.w3.org/1999/xhtml">
                <div class="alert alert-warning oe-edit-only" role="alert" attrs="{'invisible': [['sameVatPartnerId', '=', false]]}" modifiers="{&quot;invisible&quot;:[[&quot;sameVatPartnerId&quot;,&quot;=&quot;,false]]}">
                  A partner with the same <span><span class="o-vat-label">Tax ID</span></span> already exists (<field name="sameVatPartnerId" canCreate="true" canWrite="true" modifiers="{&quot;readonly&quot;:true}"></field>), are you sure to create a new one?
                </div>
                <sheet>
                    <div class="oe-button-box" name="buttonBox">

                        <button class="oe-stat-button" type="object" name="actionViewSaleOrder" icon="fa-usd">
                            <field string="Sales" name="saleOrderCount" widget="statinfo" modifiers="{&quot;readonly&quot;:true}"></field>
                        </button>


                        <button type="object" class="oe-stat-button" icon="fa-pencil-square-o" name="actionViewPartnerInvoices" context="{'default_partnerId': activeId}">
                            <div class="o-form-field o-stat-info">
                                <span class="o-stat-value">
                                    <field name="currencyId" invisible="1" canCreate="true" canWrite="true" modifiers="{&quot;invisible&quot;:true,&quot;readonly&quot;:true}"></field>
                                    <field name="totalInvoiced" widget="monetary" options="{'currencyField': 'currencyId'}" modifiers="{&quot;readonly&quot;:true}"></field>
                                </span>
                                <span class="o-stat-text">Invoiced</span>
                            </div>
                        </button>


                        <button type="action" class="oe-stat-button" icon="fa-credit-card-alt" name="263" context="{'searchDefault_partnerId': activeId, 'create': false, 'edit': false}" attrs="{'invisible': [['paymentTokenCount', '=', 0]]}" modifiers="{&quot;invisible&quot;:[[&quot;paymentTokenCount&quot;,&quot;=&quot;,0]]}">
                            <div class="o-form-field o-stat-info">
                                <span class="o-stat-value">
                                    <field name="paymentTokenCount" widget="statinfo" nolabel="1" modifiers="{&quot;readonly&quot;:true}"></field>
                                </span>
                                <span class="o-stat-text">Saved Payment Methods</span>
                            </div>
                        </button>
                    </div>
                    <widget name="webRibbon" title="Archived" bgcolor="bg-danger" attrs="{'invisible': [['active', '=', true]]}" modifiers="{&quot;invisible&quot;:[[&quot;active&quot;,&quot;=&quot;,true]]}"></widget>
                    <field name="avatar128" invisible="1" modifiers="{&quot;invisible&quot;:true,&quot;readonly&quot;:true}"></field>
                    <field name="image1920" widget="image" class="oe-avatar" options="{&quot;previewImage&quot;: &quot;avatar128&quot;}" modifiers="{}"></field>
                    <div class="oe-title mb24">
                        <field name="isCompany" invisible="1" modifiers="{&quot;invisible&quot;:true}"></field>
                        <field name="commercialPartnerId" invisible="1" canCreate="true" canWrite="true" modifiers="{&quot;invisible&quot;:true,&quot;readonly&quot;:true}"></field>
                        <field name="active" invisible="1" modifiers="{&quot;invisible&quot;:true}"></field>
                        <field name="countryCode" invisible="1" modifiers="{&quot;invisible&quot;:true,&quot;readonly&quot;:true}"></field>
                        <field name="companyType" widget="radio" options="{'horizontal': true}" onchange="1" modifiers="{}"></field>
                        <h1>
                            <field id="company" class="text-break" name="label" defaultFocus="1" placeholder="e.g. Lumber Inc" attrs="{'required' : [['type', '=', 'contact'],['isCompany', '=', true]], 'invisible': [['isCompany','=', false]]}" modifiers="{&quot;invisible&quot;:[[&quot;isCompany&quot;,&quot;=&quot;,false]],&quot;required&quot;:[[&quot;type&quot;,&quot;=&quot;,&quot;contact&quot;],[&quot;isCompany&quot;,&quot;=&quot;,true]]}"></field>
                            <field id="individual" class="text-break" name="label" defaultFocus="1" placeholder="e.g. Brandom Freeman" attrs="{'required' : [['type', '=', 'contact'], ['isCompany', '=', false]], 'invisible': [['isCompany','=', true]]}" modifiers="{&quot;invisible&quot;:[[&quot;isCompany&quot;,&quot;=&quot;,true]],&quot;required&quot;:[[&quot;type&quot;,&quot;=&quot;,&quot;contact&quot;],[&quot;isCompany&quot;,&quot;=&quot;,false]]}"></field>
                        </h1>
                        <div class="o-row">
                            <field name="parentId" widget="resPartnerMany2one" placeholder="Company Name..." domain="[['isCompany', '=', true]]" context="{'default_isCompany': true, 'showVat': true}" attrs="{'invisible': ['|', '&amp;', ['isCompany','=', true],['parentId', '=', false],['companyName', '!=', false],['companyName', '!=', '']]}" onchange="1" canCreate="true" canWrite="true" modifiers="{&quot;invisible&quot;:[&quot;|&quot;,&quot;&amp;&quot;,[&quot;isCompany&quot;,&quot;=&quot;,true],[&quot;parentId&quot;,&quot;=&quot;,false],[&quot;companyName&quot;,&quot;!=&quot;,false],[&quot;companyName&quot;,&quot;!=&quot;,&quot;&quot;]]}"></field>
                            <field name="companyName" attrs="{'invisible': ['|', '|', ['companyName', '=', false], ['companyName', '=', ''], ['isCompany', '=', true]]}" modifiers="{&quot;invisible&quot;:[&quot;|&quot;,&quot;|&quot;,[&quot;companyName&quot;,&quot;=&quot;,false],[&quot;companyName&quot;,&quot;=&quot;,&quot;&quot;],[&quot;isCompany&quot;,&quot;=&quot;,true]]}"></field>
                            <button name="createCompany" icon="fa-plus-square" string="Create company" type="object" class="oe-edit-only btn-link" attrs="{'invisible': ['|', '|', ['isCompany','=', true], ['companyName', '=', ''], ['companyName', '=', false]]}" modifiers="{&quot;invisible&quot;:[&quot;|&quot;,&quot;|&quot;,[&quot;isCompany&quot;,&quot;=&quot;,true],[&quot;companyName&quot;,&quot;=&quot;,&quot;&quot;],[&quot;companyName&quot;,&quot;=&quot;,false]]}"></button>
                        </div>
                    </div>

                    <group>
                        <group>
                            <span class="o-form-label o-td-label" name="addressName">
                                <field name="type" attrs="{'invisible': [['isCompany','=', true]], 'required': [['isCompany','!=', true]], 'readonly': [['userIds', '!=', []]]}" class="font-weight-bold" modifiers="{&quot;invisible&quot;:[[&quot;isCompany&quot;,&quot;=&quot;,true]],&quot;readonly&quot;:[[&quot;userIds&quot;,&quot;!=&quot;,[]]],&quot;required&quot;:[[&quot;isCompany&quot;,&quot;!=&quot;,true]]}"></field>
                                <b attrs="{'invisible': [['isCompany', '=', false]]}" modifiers="{&quot;invisible&quot;:[[&quot;isCompany&quot;,&quot;=&quot;,false]]}">Address</b>
                            </span>
                            <div class="o-address-format">
                                <field name="street" placeholder="Street..." class="o-address-street" attrs="{'readonly': [['type', '=', 'contact'],['parentId', '!=', false]]}" modifiers="{&quot;readonly&quot;:[[&quot;type&quot;,&quot;=&quot;,&quot;contact&quot;],[&quot;parentId&quot;,&quot;!=&quot;,false]]}"></field>
                                <field name="street2" placeholder="Street 2..." class="o-address-street" attrs="{'readonly': [['type', '=', 'contact'],['parentId', '!=', false]]}" modifiers="{&quot;readonly&quot;:[[&quot;type&quot;,&quot;=&quot;,&quot;contact&quot;],[&quot;parentId&quot;,&quot;!=&quot;,false]]}"></field>
                                <field name="city" placeholder="City" class="o-address-city" attrs="{'readonly': [['type', '=', 'contact'],['parentId', '!=', false]]}" modifiers="{&quot;readonly&quot;:[[&quot;type&quot;,&quot;=&quot;,&quot;contact&quot;],[&quot;parentId&quot;,&quot;!=&quot;,false]]}"></field>
                                <field name="stateId" class="o-address-state" placeholder="State" options="{'noOpen': true, 'noQuickCreate': true}" attrs="{'readonly': [['type', '=', 'contact'],['parentId', '!=', false]]}" context="{'countryId': countryId, 'default_countryId': countryId, 'zip': zip}" onchange="1" canCreate="true" canWrite="true" modifiers="{&quot;readonly&quot;:[[&quot;type&quot;,&quot;=&quot;,&quot;contact&quot;],[&quot;parentId&quot;,&quot;!=&quot;,false]]}"></field>
                                <field name="zip" placeholder="ZIP" class="o-address-zip" attrs="{'readonly': [['type', '=', 'contact'],['parentId', '!=', false]]}" onchange="1" modifiers="{&quot;readonly&quot;:[[&quot;type&quot;,&quot;=&quot;,&quot;contact&quot;],[&quot;parentId&quot;,&quot;!=&quot;,false]]}"></field>
                                <field name="countryId" placeholder="Country" class="o-address-country" options="{&quot;noOpen&quot;: true, &quot;noCreate&quot;: true}" attrs="{'readonly': [['type', '=', 'contact'],['parentId', '!=', false]]}" onchange="1" canCreate="true" canWrite="true" modifiers="{&quot;readonly&quot;:[[&quot;type&quot;,&quot;=&quot;,&quot;contact&quot;],[&quot;parentId&quot;,&quot;!=&quot;,false]]}"></field>
                            </div>
                            <field name="vat" placeholder="e.g. BE0477472701" attrs="{'readonly': [['parentId','!=',false]]}" modifiers="{&quot;readonly&quot;:[[&quot;parentId&quot;,&quot;!=&quot;,false]]}"></field>
                        </group>
                        <group>
                            <field name="position" placeholder="e.g. Sales Director" attrs="{'invisible': [['isCompany','=', true]]}" modifiers="{&quot;invisible&quot;:[[&quot;isCompany&quot;,&quot;=&quot;,true]]}"></field>
                            <field name="phone" widget="phone" modifiers="{}"></field>
                            <field name="mobile" widget="phone" modifiers="{}"></field>
                            <field name="userIds" invisible="1" modifiers="{&quot;invisible&quot;:true}"></field>

                            <field name="isBlacklisted" invisible="1" modifiers="{&quot;invisible&quot;:true,&quot;readonly&quot;:true}"></field>
                            <label for="email" class="oe-inline"></label>
                            <div class="o-row o-row-readonly">
                                <button name="mailActionBlacklistRemove" class="fa fa-ban text-danger" title="This email is blacklisted for mass mailings. Click to unblacklist." type="object" context="{'default_email': email}" attrs="{'invisible': [['isBlacklisted', '=', false]]}" modifiers="{&quot;invisible&quot;:[[&quot;isBlacklisted&quot;,&quot;=&quot;,false]]}"></button>
                                <field name="email" widget="email" context="{'gravatarImage': true}" attrs="{'required': [['userIds','!=', []]]}" onchange="1" modifiers="{&quot;required&quot;:[[&quot;userIds&quot;,&quot;!=&quot;,[]]]}"></field>
                            </div>

                            <field name="website" string="Website" widget="url" placeholder="e.g. https://www.theverp.com" modifiers="{}"></field>
                            <field name="title" options="{&quot;noOpen&quot;: true}" placeholder="e.g. Mister" attrs="{'invisible': [['isCompany', '=', true]]}" canCreate="true" canWrite="true" modifiers="{&quot;invisible&quot;:[[&quot;isCompany&quot;,&quot;=&quot;,true]]}"></field>
                            <field name="activeLangCount" invisible="1" modifiers="{&quot;invisible&quot;:true,&quot;readonly&quot;:true}"></field>
                            <label for="lang" attrs="{'invisible': [['activeLangCount', '&lt;=', 1]]}" modifiers="{&quot;invisible&quot;:[[&quot;activeLangCount&quot;,&quot;&lt;=&quot;,1]]}"></label>
                            <div class="o-row" attrs="{'invisible': [['activeLangCount', '&lt;=', 1]]}" modifiers="{&quot;invisible&quot;:[[&quot;activeLangCount&quot;,&quot;&lt;=&quot;,1]]}">
                                <field name="lang" modifiers="{}"></field>
                                <button type="action" name="56" class="btn-sm btn-link mb4 fa fa-globe" aria-label="More languages" title="More languages"></button>
                            </div>
                            <field name="categoryId" widget="many2manyTags" options="{'colorField': 'color', 'noCreateEdit': true}" placeholder="Tags..." canCreate="true" canWrite="true" modifiers="{}"></field>
                        </group>
                    </group>

                    <notebook colspan="4">
                        <page string="Contacts &amp; Addresses" name="contactAddresses" autofocus="autofocus">
                            <field name="childIds" mode="kanban" context="{'default_parentId': activeId, 'default_street': street, 'default_street2': street2, 'default_city': city, 'default_stateId': stateId, 'default_zip': zip, 'default_countryId': countryId, 'default_lang': lang, 'default_userId': userId, 'default_type': 'other'}" modifiers="{}">
                            </field>
                        </page>
                        <page name="salesPurchases" string="Sales &amp; Purchase">
                            <group name="containerRow2">
                                <group string="Sales" name="sale" priority="1">
                                    <field name="userId" domain="[['share', '=', false]]" canCreate="true" canWrite="true" modifiers="{}"></field>

                                    <field name="teamId" canCreate="true" canWrite="true" invisible="1" modifiers="{&quot;invisible&quot;:true}"></field>


                                    <field string="Payment Terms" name="propertyPaymentTermId" options="{'noOpen': true, 'noCreate': true}" canCreate="true" canWrite="true" modifiers="{}"></field>


                                    <field name="propertyProductPricelist" attrs="{'invisible': [['isCompany','=',false],['parentId','!=',false]]}" canCreate="true" canWrite="true" modifiers="{&quot;invisible&quot;:[[&quot;isCompany&quot;,&quot;=&quot;,false],[&quot;parentId&quot;,&quot;!=&quot;,false]]}"></field>
                                    <div name="parentPricelists" colspan="2" attrs="{'invisible': ['|',['isCompany','=',true],['parentId','=',false]]}" modifiers="{&quot;invisible&quot;:[&quot;|&quot;,[&quot;isCompany&quot;,&quot;=&quot;,true],[&quot;parentId&quot;,&quot;=&quot;,false]]}">
                                        <p>Pricelists are managed on <button name="openCommercialEntity" type="object" string="the parent company" class="oe-link"></button>
                                        </p>
                                    </div>
                                </group>
                                <group string="Purchase" name="purchase" priority="2">


                                    <field string="Payment Terms" name="propertySupplierPaymentTermId" options="{'noOpen': true, 'noCreate': true}" canCreate="true" canWrite="true" modifiers="{}"></field>
                                </group>
                                <group string="Fiscal Information" name="fiscalInformation" priority="5">
                                    <field name="propertyAccountPositionId" options="{'noCreate': true, 'noOpen': true}" canCreate="true" canWrite="true" modifiers="{}"></field>
                                </group>

                                <group name="misc" string="Misc">
                                    <field name="ref" string="Reference" modifiers="{}"></field>
                                    <field name="companyId" options="{'noCreate': true}" attrs="{'readonly': [['parentId', '!=', false]]}" forceSave="1" onchange="1" canCreate="true" canWrite="true" modifiers="{&quot;readonly&quot;:[[&quot;parentId&quot;,&quot;!=&quot;,false]]}"></field>
                                    <field name="websiteId" canCreate="true" canWrite="true" modifiers="{}"></field>
                                    <field name="industryId" attrs="{'invisible': [['isCompany', '=', false]]}" options="{'noCreate': true}" canCreate="true" canWrite="true" modifiers="{&quot;invisible&quot;:[[&quot;isCompany&quot;,&quot;=&quot;,false]]}"></field>
                                </group>
                            </group>
                        </page>

                        <page string="Payment Follow-up" name="followupTab">

                            <div class="oe-right" name="followupButton">
                                <button name="doButtonPrint" type="object" string="Print Overdue Payments" help="Print overdue payments report independent of follow-up line" attrs="{'invisible':[['paymentAmountDue', '&lt;=', 0.0]]}" modifiers="{&quot;invisible&quot;:[[&quot;paymentAmountDue&quot;,&quot;&lt;=&quot;,0]]}"></button>
                                <button name="doPartnerMail" type="object" string="Send Overdue Email" help="If not specified by the latest follow-up level, it will send from the default email template" attrs="{'invisible':[['paymentAmountDue', '&lt;=', 0.0]]}" modifiers="{&quot;invisible&quot;:[[&quot;paymentAmountDue&quot;,&quot;&lt;=&quot;,0]]}"></button>
                            </div>

                            <p attrs="{'invisible':[['latestFollowupDate','=', false]]}" modifiers="{&quot;invisible&quot;:[[&quot;latestFollowupDate&quot;,&quot;=&quot;,false]]}">
                                The
                                <field name="latestFollowupDate" class="oe-inline" modifiers="{&quot;readonly&quot;:true}"></field>
                                , the latest payment follow-up was:
                                <field name="latestFollowupLevelId" class="oe-inline" canCreate="true" canWrite="true" modifiers="{&quot;readonly&quot;:true}"></field>
                            </p>
                            <group>
                                <field name="paymentResponsibleId" placeholder="Responsible of credit collection" class="oe-inline" canCreate="true" canWrite="true" modifiers="{}"></field>
                                <label for="paymentNextAction"></label>
                                <div>
                                    <field name="paymentNextActionDate" class="oe-inline" modifiers="{}"></field>
                                    <button name="actionDone" type="object" string="⇾ Mark as Done" help="Click to mark the action as done." class="oe-link" attrs="{'invisible':[['paymentNextActionDate','=', false]]}" modifiers="{&quot;invisible&quot;:[[&quot;paymentNextActionDate&quot;,&quot;=&quot;,false]]}"></button>
                                    <field name="paymentNextAction" placeholder="Action to be taken e.g. Give a phonecall, Check if it's paid, ..." modifiers="{}"></field>
                                </div>
                            </group>
                            <label for="paymentNote" class="oe-edit-only"></label>
                            <field name="paymentNote" placeholder="He said the problem was temporary and promised to pay 50% before 15th of May, balance before 1st of July." modifiers="{}"></field>
                            <p class="oe-grey">
                                Below is the history of the transactions of this
                                customer. You can check "No Follow-up" in
                                order to exclude it from the next follow-up
                                actions.
                            </p>
                            <field name="unreconciledAmlIds" modifiers="{}">

                            </field>
                            <group class="oe-subtotal-footer oe-right">
                                <field name="paymentAmountDue" modifiers="{&quot;readonly&quot;:true}"></field>
                            </group>
                            <div class="oe-clear"></div>
                        </page>

                        <page string="Accounting" name="accounting" attrs="{'invisible': [['isCompany','=',false],['parentId','!=',false]]}" modifiers="{&quot;invisible&quot;:[[&quot;isCompany&quot;,&quot;=&quot;,false],[&quot;parentId&quot;,&quot;!=&quot;,false]]}">
                            <group>
                                <group string="Bank Accounts" name="banks">
                                    <field name="bankIds" nolabel="1" modifiers="{}">

                                    </field>
                                    <button type="action" class="btn-link" name="64" context="{'searchDefault_partnerId': activeId, 'default_partnerId': activeId, 'formViewRef': 'account.viewCompanyPartnerBankForm'}" string="View accounts detail" colspan="2"></button>
                                </group>
                                <group string="Accounting Entries" name="accountingEntries">
                                    <field name="currencyId" invisible="1" canCreate="true" canWrite="true" modifiers="{&quot;invisible&quot;:true,&quot;readonly&quot;:true}"></field>
                                    <field name="propertyAccountReceivableId" canCreate="true" canWrite="true" modifiers="{&quot;required&quot;:true}"></field>
                                    <field name="propertyAccountPayableId" canCreate="true" canWrite="true" modifiers="{&quot;required&quot;:true}"></field>
                                </group>
                                <group string="Credit Limits" name="creditLimits" attrs="{'invisible': [['showCreditLimit', '=', false]]}" modifiers="{&quot;invisible&quot;:[[&quot;showCreditLimit&quot;,&quot;=&quot;,false]]}">
                                    <field name="showCreditLimit" invisible="1" modifiers="{&quot;invisible&quot;:true,&quot;readonly&quot;:true}"></field>
                                    <field name="amountCreditLimit" invisible="1" modifiers="{&quot;invisible&quot;:true}"></field>
                                    <field name="credit" modifiers="{&quot;readonly&quot;:true}"></field>
                                    <label for="creditLimitCompute" string="Credit Limit" attrs="{'invisible': [['amountCreditLimit', '=', -1]]}" modifiers="{&quot;invisible&quot;:[[&quot;amountCreditLimit&quot;,&quot;=&quot;,-1]]}"></label>
                                    <div attrs="{'invisible': [['amountCreditLimit', '=', -1]]}" modifiers="{&quot;invisible&quot;:[[&quot;amountCreditLimit&quot;,&quot;=&quot;,-1]]}">
                                        <field name="creditLimitCompute" modifiers="{}"></field>
                                    </div>
                                    <label for="creditLimitCompute" string="Credit Limit" attrs="{'invisible': [['amountCreditLimit', '!=', -1]]}" modifiers="{&quot;invisible&quot;:[[&quot;amountCreditLimit&quot;,&quot;!=&quot;,-1]]}"></label>
                                    <div style="font-style: italic" attrs="{'invisible': [['amountCreditLimit', '!=', -1]]}" modifiers="{&quot;invisible&quot;:[[&quot;amountCreditLimit&quot;,&quot;!=&quot;,-1]]}">
                                        <field name="creditLimitCompute" modifiers="{}"></field>
                            &amp;nbsp;<i class="fa fa-info-circle" role="img" title="This is the default (company) credit limit."></i>
                                    </div>
                                </group>

                            </group>
                        </page>
                        <page string="Invoicing" name="accountingDisabled" attrs="{'invisible': ['|',['isCompany','=',true],['parentId','=',false]]}" modifiers="{&quot;invisible&quot;:[&quot;|&quot;,[&quot;isCompany&quot;,&quot;=&quot;,true],[&quot;parentId&quot;,&quot;=&quot;,false]]}">
                            <div>
                                <p>Accounting-related settings are managed on <button name="openCommercialEntity" type="object" string="the parent company" class="oe-link"></button>
                                </p>
                            </div>
                        </page>
                        <page name="internalNotes" string="Internal Notes">
                            <field name="comment" placeholder="Internal note..." modifiers="{}"></field>


                            <group colspan="2" col="2" invisible="1" modifiers="{&quot;invisible&quot;:true}">
                                <separator string="Warning on the Sales Order" colspan="4"></separator>
                                <field name="saleWarn" nolabel="1" modifiers="{}"></field>
                                <field name="saleWarnMsg" colspan="3" nolabel="1" attrs="{'required':[['saleWarn','!=', false], ['saleWarn','!=','no-message']], 'invisible':[['saleWarn','in',[false,'no-message']]]}" modifiers="{&quot;invisible&quot;:[[&quot;saleWarn&quot;,&quot;in&quot;,[false,&quot;no-message&quot;]]],&quot;required&quot;:[[&quot;saleWarn&quot;,&quot;!=&quot;,false],[&quot;saleWarn&quot;,&quot;!=&quot;,&quot;no-message&quot;]]}"></field>
                            </group>


                            <group colspan="2" col="2" invisible="1" modifiers="{&quot;invisible&quot;:true}">
                                <separator string="Warning on the Invoice" colspan="4"></separator>
                                <field name="invoiceWarn" nolabel="1" modifiers="{}"></field>
                                <field name="invoiceWarnMsg" colspan="3" nolabel="1" attrs="{'required':[['invoiceWarn','!=', false], ['invoiceWarn','!=','no-message']], 'invisible':[['invoiceWarn','in',[false,'no-message']]]}" modifiers="{&quot;invisible&quot;:[[&quot;invoiceWarn&quot;,&quot;in&quot;,[false,&quot;no-message&quot;]]],&quot;required&quot;:[[&quot;invoiceWarn&quot;,&quot;!=&quot;,false],[&quot;invoiceWarn&quot;,&quot;!=&quot;,&quot;no-message&quot;]]}"></field>
                            </group>
                        </page>
                    </notebook>
                </sheet>
                <div class="oe-chatter">
                    <field name="messageFollowerIds" modifiers="{}"></field>
                    <field name="activityIds" modifiers="{}"></field>
                    <field name="messageIds" modifiers="{}"></field>
                </div>
            </form>`;

const source = `
<form string="Partners"
  xmlns="http://www.w3.org/1999/xhtml">
  <div class="alert alert-warning oe-edit-only" role="alert" attrs="{'invisible': [['sameVatPartnerId', '=', false]]}" modifiers="{&quot;invisible&quot;:[[&quot;sameVatPartnerId&quot;,&quot;=&quot;,false]]}">
    A partner with the same <span><span class="o-vat-label">Tax ID</span></span> already exists (<field name="sameVatPartnerId" canCreate="true" canWrite="true" modifiers="{&quot;readonly&quot;:true}"></field>), are you sure to create a new one?
  </div>
  <sheet>
    <div class="oe-button-box" name="buttonBox"></div>
  </sheet>
</form>`;

const expr = "//*[@name='buttonBox']";
// ok: //*[@name="followupTab"]';

function main() {
  const dom = xml.parseXml(source);
  const node = xpath.select1(expr, dom);
  if (node) {
    console.log('Found in:\n', node.toString());
  } else {
    console.log('Not found', expr);
  }
}

main();