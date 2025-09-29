/**
 * Verp
 * Channel > [Thread > AliasMixin] > O2MIdMapper > BaseModel

Partner > O2MIdMapper > BaseModel

/**
 * Verp
mro res.partner: [
  'res.partner',          
    'Partner',
    'ResPartner',           
    'Partner',
  'format.address.mixin', 
    'FormatAddressMixin',
  'base',                 
    'BaseModel',
    'Base',                 
    'O2MIdMapper',
    'Base',                 
  'avatar.mixin',
    'AvatarMixin',          
  'image.mixin',
    'ImageMixin',           
  'mail.activity.mixin',
    'MailActivityMixin',    
  'mail.thread.blacklist',
    'MailBlackListMixin',   
  'mail.thread',
    'MailThread',           
  'base'
]

res.partner,
Partner,
ResPartner,
Partner,
format.address.mixin,
avatar.mixin,
mail.activity.mixin,
mail.thread.blacklist,
base,
FormatAddressMixin,
BaseModel,
Base,
O2MIdMapper,
Base,
AvatarMixin,
image.mixin,
ImageMixin,
MailActivityMixin,
MailBlackListMixin,
'mail.thread', 
'MailThread'

=> Fix:
res.partner,
  Partner,
  ResPartner,
  Partner,
    => Model
format.address.mixin,
  => FormatAddressMixin,
avatar.mixin,
  => AvatarMixin,
    => image.mixin,
      => ImageMixin,
mail.activity.mixin,
  => MailActivityMixin,
mail.thread.blacklist,
  => MailBlackListMixin
    => mail.thread
base,
  Base,
  O2MIdMapper,
  Base,
  BaseModel,
Object

MailBlackListMixin

* Verp:
before: 
<class 'verp.addons.base.models.res_partner.Partner'>, 

after:
<class 'verp.addons.base.models.res_partner.Partner'>, **
[<class 'verp.api.format.address.mixin'>, 
<class 'verp.api.avatar.mixin'>,]
<class 'verp.api.base'>

res.partner:
<class 'verp.api.res.partner'>, 
  <class 'verp.addons.mail.models.res_partner.Partner'>, 
  <class 'verp.addons.bus.models.res_partner.ResPartner'>, 
  <class 'verp.addons.base.models.res_partner.Partner'>, 
    <class 'verp.models.Model'>,
<class 'verp.api.format.address.mixin'>, 
  <class 'verp.addons.base.models.res_partner.FormatAddressMixin'>, 
<class 'verp.api.avatar.mixin'>, 
  <class 'verp.addons.base.models.avatar_mixin.AvatarMixin'>, 
  <class 'verp.api.image.mixin'>, 
    <class 'verp.addons.base.models.image_mixin.ImageMixin'>,
<class 'verp.api.mail.activity.mixin'>, 
  <class 'verp.addons.mail.models.mail_activity_mixin.MailActivityMixin'>, 
<class 'verp.api.mail.thread.blacklist'>, 
  <class 'verp.addons.mail.models.mail_thread_blacklist.MailBlackListMixin'>, 
  <class 'verp.api.mail.thread'>, 
    <class 'verp.addons.mail.models.mail_thread.MailThread'>, 
<class 'verp.api.base'>, 
  <class 'verp.addons.web.models.models.Base'>, 
    <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, 
    <class 'verp.addons.base.models.ir_model.Base'>, 
  <class 'verp.models.BaseModel'>, 
<class 'object'>

res.partner:
<class 'verp.api.res.partner'>, 
<class 'verp.addons.snailmail.models.res_partner.ResPartner'>, 
<class 'verp.addons.sms.models.res_partner.ResPartner'>, 
<class 'verp.api.mail.thread.phone'>, 
<class 'verp.addons.sms.models.mail_thread_phone.PhoneMixin'>, 
<class 'verp.addons.phone_validation.models.mail_thread_phone.PhoneMixin'>, 
<class 'verp.addons.partner_autocomplete.models.res_partner.ResPartner'>, 
<class 'verp.addons.sales_team.models.res_partner.ResPartner'>, 
<class 'verp.addons.phone_validation.models.res_partner.Partner'>, 
<class 'verp.addons.auth_signup.models.res_partner.ResPartner'>, 
<class 'verp.addons.mail.models.res_partner.Partner'>, 
<class 'verp.addons.bus.models.res_partner.ResPartner'>, 
<class 'verp.addons.base.populate.res_partner.Partner'>, 
<class 'verp.addons.base.models.res_partner.Partner'>, 
<class 'verp.models.Model'>,
<class 'verp.api.format.address.mixin'>, 
<class 'verp.addons.base.models.res_partner.FormatAddressMixin'>, 
<class 'verp.api.avatar.mixin'>, 
<class 'verp.addons.base.models.avatar_mixin.AvatarMixin'>, 
<class 'verp.api.image.mixin'>, 
<class 'verp.addons.base.models.image_mixin.ImageMixin'>,
<class 'verp.api.mail.activity.mixin'>, 
<class 'verp.addons.mail.models.mail_activity_mixin.MailActivityMixin'>, 
<class 'verp.api.mail.thread.blacklist'>, 
<class 'verp.addons.mail.models.mail_thread_blacklist.MailBlackListMixin'>, 
<class 'verp.api.mail.thread'>, 
<class 'verp.addons.sms.models.mail_thread.MailThread'>, 
<class 'verp.addons.mail_bot.models.mail_thread.MailThread'>, 
<class 'verp.addons.mail.models.mail_thread.MailThread'>, 
<class 'verp.api.base'>, 
<class 'verp.addons.mail.models.models.BaseModel'>, 
<class 'verp.addons.base_import.models.base_import.Base'>, 
<class 'verp.addons.web.models.models.Base'>, 
<class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, 
<class 'verp.addons.base.models.ir_model.Base'>, 
<class 'verp.models.BaseModel'>, 
<class 'object'>


>>> MRO: _unknown
<class 'verp.api._unknown'>, 
<class 'verp.addons.base.models.ir_model.Unknown'>, 
<class 'verp.api.base'>, 
<class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, 
<class 'verp.addons.base.models.ir_model.Base'>, 
<class 'verp.models.BaseModel'>, 
<class 'object'>

>>> MRO: ir.model
  <class 'verp.api.ir.model'>, 
    <class 'verp.addons.sms.models.ir_model.IrModel'>,
    <class 'verp.addons.mail.models.ir_model.IrModel'>, 
    <class 'verp.addons.base.models.ir_model.IrModel'>, 
    <class 'verp.models.Model'>, 
  <class 'verp.api.base'>,
    <class 'verp.addons.mail.models.models.BaseModel'>,
    <class 'verp.addons.base_import.models.base_import.Base'>, 
    <class 'verp.addons.web.models.models.Base'>, 
    <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, 
    <class 'verp.addons.base.models.ir_model.Base'>, 
    <class 'verp.models.BaseModel'>, 
  <class 'object'>
>>> MRO: ir.model.fields<class 'verp.api.ir.model.fields'>, <class 'verp.addons.mail.models.ir_model_fields.IrModelField'>, <class 'verp.addons.bas
e.models.ir_model.IrModelFields'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <cla
ss 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2
MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.model.fields.selection<class 'verp.api.ir.model.fields.selection'>, <class 'verp.addons.base.models.ir_model.IrModelSelection'>, <class
 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_i
mport.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.mod
els.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.model.constraint<class 'verp.api.ir.model.constraint'>, <class 'verp.addons.base.models.ir_model.IrModelConstraint'>, <class 'verp.mode
ls.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'
>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_mode
l.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.model.relation<class 'verp.api.ir.model.relation'>, <class 'verp.addons.base.models.ir_model.IrModelRelation'>, <class 'verp.models.Mod
el'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <cl
ass 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base
'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.model.access<class 'verp.api.ir.model.access'>, <class 'verp.addons.base.models.ir_model.IrModelAccess'>, <class 'verp.models.Model'>,
<class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'o
doo.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <c
lass 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.model.data<class 'verp.api.ir.model.data'>, <class 'verp.addons.base.models.ir_model.IrModelData'>, <class 'verp.models.Model'>, <class
 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.ad
dons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class '
verp.models.BaseModel'>, <class 'object'>
>>> MRO: wizard.ir.model.menu.create<class 'verp.api.wizard.ir.model.menu.create'>, <class 'verp.addons.base.models.ir_model.WizardModelMenu'>, <cl
ass 'verp.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <cla
ss 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2
MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.sequence<class 'verp.api.ir.sequence'>, <class 'verp.addons.base.models.ir_sequence.IrSequence'>, <class 'verp.models.Model'>, <class '
verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addo
ns.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'od
oo.models.BaseModel'>, <class 'object'>
>>> MRO: ir.sequence.dateRange<class 'verp.api.ir.sequence.dateRange'>, <class 'verp.addons.base.models.ir_sequence.IrSequenceDaterange'>, <class
 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_i
mport.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.mod
els.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.ui.menu<class 'verp.api.ir.ui.menu'>, <class 'verp.addons.web.models.ir_ui_menu.IrUiMenu'>, <class 'verp.addons.base.models.ir_ui_menu.
IrUiMenu'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_im
port.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'od
oo.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.ui.view.custom<class 'verp.api.ir.ui.view.custom'>, <class 'verp.addons.base.models.ir_ui_view.ViewCustom'>, <class 'verp.models.Model'
>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class
 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>,
 <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.ui.view<class 'verp.api.ir.ui.view'>, <class 'verp.addons.mail.models.ir_ui_view.View'>, <class 'verp.addons.web_editor.models.ir_ui_vi
ew.IrUiView'>, <class 'verp.addons.base.models.ir_ui_view.View'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.
models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.
addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: reset.view.arch.wizard<class 'verp.api.reset.view.arch.wizard'>, <class 'verp.addons.base.models.ir_ui_view.ResetViewArchWizard'>, <class
'verp.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class '
verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdM
apper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.asset<class 'verp.api.ir.asset'>, <class 'verp.addons.base.models.ir_asset.IrAsset'>, <class 'verp.models.Model'>, <class 'verp.api.bas
e'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.model
s.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.Ba
seModel'>, <class 'object'>
>>> MRO: ir.actions.actions<class 'verp.api.ir.actions.actions'>, <class 'verp.addons.base.models.ir_actions.IrActions'>, <class 'verp.models.Model
'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <clas
s 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>
, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.actions.actwindow<class 'verp.api.ir.actions.actwindow'>, <class 'verp.addons.base.models.ir_actions.IrActionsActwindow'>, <class 'od
oo.api.ir.actions.actions'>, <class 'verp.addons.base.models.ir_actions.IrActions'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class
 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Ba
se'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>,
<class 'object'>
>>> MRO: ir.actions.actwindow.view<class 'verp.api.ir.actions.actwindow.view'>, <class 'verp.addons.mail.models.irActionActwindow.ActwindowVie
w'>, <class 'verp.addons.web.models.models.IrActionsActwindowView'>, <class 'verp.addons.base.models.ir_actions.IrActionsActwindowView'>, <class
'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_im
port.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.mode
ls.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.actions.actwindow.close<class 'verp.api.ir.actions.actwindow_close'>, <class 'verp.addons.base.models.ir_actions.IrActionsActwindowcl
ose'>, <class 'verp.api.ir.actions.actions'>, <class 'verp.addons.base.models.ir_actions.IrActions'>, <class 'verp.models.Model'>, <class 'verp.a
pi.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web
.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.mod
els.BaseModel'>, <class 'object'>
>>> MRO: ir.actions.act_url<class 'verp.api.ir.actions.act_url'>, <class 'verp.addons.base.models.ir_actions.IrActionsActUrl'>, <class 'verp.api.ir
.actions.actions'>, <class 'verp.addons.base.models.ir_actions.IrActions'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.ad
dons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <cl
ass 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'o
bject'>
>>> MRO: ir.actions.server<class 'verp.api.ir.actions.server'>, <class 'verp.addons.sms.models.ir_actions.ServerActions'>, <class 'verp.addons.mail
.models.ir_actions_server.ServerActions'>, <class 'verp.addons.base.models.ir_actions.IrActionsServer'>, <class 'verp.api.ir.actions.actions'>, <
class 'verp.addons.base.models.ir_actions.IrActions'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.mode
ls.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base
.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.server.object.lines<class 'verp.api.ir.server.object.lines'>, <class 'verp.addons.base.models.ir_actions.IrServerObjectLines'>, <class
'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_im
port.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.mode
ls.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.actions.todo<class 'verp.api.ir.actions.todo'>, <class 'verp.addons.base.models.ir_actions.IrActionsTodo'>, <class 'verp.models.Model'>
, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class
'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>,
<class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.actions.client<class 'verp.api.ir.actions.client'>, <class 'verp.addons.base.models.ir_actions.IrActionsActClient'>, <class 'verp.api.i
r.actions.actions'>, <class 'verp.addons.base.models.ir_actions.IrActions'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.a
ddons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <c
lass 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class '
object'>
>>> MRO: ir.actions.report<class 'verp.api.ir.actions.report'>, <class 'verp.addons.snailmail.models.ir_actions_report.IrActionsReport'>, <class 'o
doo.addons.base.models.ir_actions_report.IrActionsReport'>, <class 'verp.api.ir.actions.actions'>, <class 'verp.addons.base.models.ir_actions.IrA
ctions'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_impo
rt.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp
.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.attachment<class 'verp.api.ir.attachment'>, <class 'verp.addons.mail.models.ir_attachment.IrAttachment'>, <class 'verp.addons.web_edito
r.models.ir_attachment.IrAttachment'>, <class 'verp.addons.base.models.ir_attachment.IrAttachment'>, <class 'verp.models.Model'>, <class 'verp.ap
i.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.
models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.mode
ls.BaseModel'>, <class 'object'>
>>> MRO: ir.cron<class 'verp.api.ir.cron'>, <class 'verp.addons.base.models.ir_cron.ir_cron'>, <class 'verp.models.Model'>, <class 'verp.api.base'>
, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.m
odels.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseM
odel'>, <class 'object'>
>>> MRO: ir.cron.trigger<class 'verp.api.ir.cron.trigger'>, <class 'verp.addons.base.models.ir_cron.ir_cron_trigger'>, <class 'verp.models.Model'>,
 <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class '
verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <
class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.filters<class 'verp.api.ir.filters'>, <class 'verp.addons.base.models.irFilters.IrFilters'>, <class 'verp.models.Model'>, <class 'verp
.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.w
eb.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.m
odels.BaseModel'>, <class 'object'>
>>> MRO: ir.default<class 'verp.api.ir.default'>, <class 'verp.addons.base.models.ir_default.IrDefault'>, <class 'verp.models.Model'>, <class 'verp
.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.w
eb.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.m
odels.BaseModel'>, <class 'object'>
>>> MRO: ir.translation<class 'verp.api.ir.translation'>, <class 'verp.addons.mail.models.ir_translation.IrTranslation'>, <class 'verp.addons.web_e
ditor.models.ir_translation.IrTranslation'>, <class 'verp.addons.base.models.ir_translation.IrTranslation'>, <class 'verp.models.Model'>, <class
'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.add
ons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'o
doo.models.BaseModel'>, <class 'object'>
>>> MRO: ir.exports<class 'verp.api.ir.exports'>, <class 'verp.addons.base.models.ir_exports.IrExports'>, <class 'verp.models.Model'>, <class 'verp
.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.w
eb.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.m
odels.BaseModel'>, <class 'object'>
>>> MRO: ir.exports.line<class 'verp.api.ir.exports.line'>, <class 'verp.addons.base.models.ir_exports.IrExportsLine'>, <class 'verp.models.Model'>
, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class
'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>,
<class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.rule<class 'verp.api.ir.rule'>, <class 'verp.addons.base.models.ir_rule.IrRule'>, <class 'verp.models.Model'>, <class 'verp.api.base'>,
 <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.mo
dels.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseMo
del'>, <class 'object'>
>>> MRO: ir.config.parameter<class 'verp.api.ir.config.parameter'>, <class 'verp.addons.mail.models.ir_config_parameter.IrConfigParameter'>, <class
 'verp.addons.base.models.ir_config_parameter.IrConfigParameter'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail
.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp
.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.autovacuum<class 'verp.api.ir.autovacuum'>, <class 'verp.addons.base.models.ir_autovacuum.AutoVacuum'>, <class 'verp.api.base'>, <class
 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Ba
se'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>,
<class 'object'>
>>> MRO: ir.mail_server<class 'verp.api.ir.mail_server'>, <class 'verp.addons.base.models.ir_mail_server.IrMailServer'>, <class 'verp.models.Model'
>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class
 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>,
 <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.fields.converter<class 'verp.api.ir.fields.converter'>, <class 'verp.addons.base.models.ir_fields.IrFieldsConverter'>, <class 'verp.api
.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.m
odels.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.model
s.BaseModel'>, <class 'object'>
>>> MRO: ir.qweb<class 'verp.api.ir.qweb'>, <class 'verp.addons.web_editor.models.ir_qweb.QWeb'>, <class 'verp.addons.base.models.ir_qweb.IrQWeb'>,
 <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class '
verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <
class 'verp.models.BaseModel'>, <class 'verp.addons.base.models.qweb.QWeb'>, <class 'object'>
>>> MRO: ir.qweb.field<class 'verp.api.ir.qweb.field'>, <class 'verp.addons.web_editor.models.ir_qweb.Field'>, <class 'verp.addons.base.models.ir_q
web_fields.FieldConverter'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.
base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.ba
se.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.qweb.field.integer<class 'verp.api.ir.qweb.field.integer'>, <class 'verp.addons.web_editor.models.ir_qweb.Integer'>, <class 'verp.addon
s.base.models.ir_qweb_fields.IntegerConverter'>, <class 'verp.api.ir.qweb.field'>, <class 'verp.addons.web_editor.models.ir_qweb.Field'>, <class
'verp.addons.base.models.ir_qweb_fields.FieldConverter'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'od
oo.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMap
per'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.qweb.field.float<class 'verp.api.ir.qweb.field.float'>, <class 'verp.addons.web_editor.models.ir_qweb.Float'>, <class 'verp.addons.base
.models.ir_qweb_fields.FloatConverter'>, <class 'verp.api.ir.qweb.field'>, <class 'verp.addons.web_editor.models.ir_qweb.Field'>, <class 'verp.ad
dons.base.models.ir_qweb_fields.FieldConverter'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addon
s.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <
class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.qweb.field.date<class 'verp.api.ir.qweb.field.date'>, <class 'verp.addons.web_editor.models.ir_qweb.Date'>, <class 'verp.addons.base.mo
dels.ir_qweb_fields.DateConverter'>, <class 'verp.api.ir.qweb.field'>, <class 'verp.addons.web_editor.models.ir_qweb.Field'>, <class 'verp.addons
.base.models.ir_qweb_fields.FieldConverter'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.ba
se_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <clas
s 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.qweb.field.datetime<class 'verp.api.ir.qweb.field.datetime'>, <class 'verp.addons.web_editor.models.ir_qweb.DateTime'>, <class 'verp.ad
dons.base.models.ir_qweb_fields.DateTimeConverter'>, <class 'verp.api.ir.qweb.field'>, <class 'verp.addons.web_editor.models.ir_qweb.Field'>, <cl
ass 'verp.addons.base.models.ir_qweb_fields.FieldConverter'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class
 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MI
dMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.qweb.field.text<class 'verp.api.ir.qweb.field.text'>, <class 'verp.addons.web_editor.models.ir_qweb.Text'>, <class 'verp.addons.base.mo
dels.ir_qweb_fields.TextConverter'>, <class 'verp.api.ir.qweb.field'>, <class 'verp.addons.web_editor.models.ir_qweb.Field'>, <class 'verp.addons
.base.models.ir_qweb_fields.FieldConverter'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.ba
se_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <clas
s 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.qweb.field.selection<class 'verp.api.ir.qweb.field.selection'>, <class 'verp.addons.web_editor.models.ir_qweb.Selection'>, <class 'verp
.addons.base.models.ir_qweb_fields.SelectionConverter'>, <class 'verp.api.ir.qweb.field'>, <class 'verp.addons.web_editor.models.ir_qweb.Field'>,
 <class 'verp.addons.base.models.ir_qweb_fields.FieldConverter'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <c
lass 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.
O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.qweb.field.many2one<class 'verp.api.ir.qweb.field.many2one'>, <class 'verp.addons.web_editor.models.ir_qweb.ManyToOne'>, <class 'verp.a
ddons.base.models.ir_qweb_fields.ManyToOneConverter'>, <class 'verp.api.ir.qweb.field'>, <class 'verp.addons.web_editor.models.ir_qweb.Field'>, <
class 'verp.addons.base.models.ir_qweb_fields.FieldConverter'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <cla
ss 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2
MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.qweb.field.many2many<class 'verp.api.ir.qweb.field.many2many'>, <class 'verp.addons.base.models.ir_qweb_fields.ManyToManyConverter'>, <
class 'verp.api.ir.qweb.field'>, <class 'verp.addons.web_editor.models.ir_qweb.Field'>, <class 'verp.addons.base.models.ir_qweb_fields.FieldConve
rter'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <
class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Ba
se'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.qweb.field.html<class 'verp.api.ir.qweb.field.html'>, <class 'verp.addons.web_editor.models.ir_qweb.HTML'>, <class 'verp.addons.base.mo
dels.ir_qweb_fields.HTMLConverter'>, <class 'verp.api.ir.qweb.field'>, <class 'verp.addons.web_editor.models.ir_qweb.Field'>, <class 'verp.addons
.base.models.ir_qweb_fields.FieldConverter'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.ba
se_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <clas
s 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.qweb.field.image<class 'verp.api.ir.qweb.field.image'>, <class 'verp.addons.web_unsplash.models.ir_qweb.Image'>, <class 'verp.addons.we
b_editor.models.ir_qweb.Image'>, <class 'verp.addons.web.models.ir_qweb.Image'>, <class 'verp.addons.base.models.ir_qweb_fields.ImageConverter'>,
 <class 'verp.api.ir.qweb.field'>, <class 'verp.addons.web_editor.models.ir_qweb.Field'>, <class 'verp.addons.base.models.ir_qweb_fields.FieldCon
verter'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>,
 <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.
Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.qweb.field.imageurl<class 'verp.api.ir.qweb.field.imageurl'>, <class 'verp.addons.web.models.ir_qweb.ImageUrlConverter'>, <class 'odo
o.addons.base.models.ir_qweb_fields.ImageUrlConverter'>, <class 'verp.api.ir.qweb.field.image'>, <class 'verp.addons.web_unsplash.models.ir_qweb.
Image'>, <class 'verp.addons.web_editor.models.ir_qweb.Image'>, <class 'verp.addons.web.models.ir_qweb.Image'>, <class 'verp.addons.base.models.i
r_qweb_fields.ImageConverter'>, <class 'verp.api.ir.qweb.field'>, <class 'verp.addons.web_editor.models.ir_qweb.Field'>, <class 'verp.addons.base
.models.ir_qweb_fields.FieldConverter'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_im
port.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'od
oo.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.qweb.field.monetary<class 'verp.api.ir.qweb.field.monetary'>, <class 'verp.addons.web_editor.models.ir_qweb.Monetary'>, <class 'verp.ad
dons.base.models.ir_qweb_fields.MonetaryConverter'>, <class 'verp.api.ir.qweb.field'>, <class 'verp.addons.web_editor.models.ir_qweb.Field'>, <cl
ass 'verp.addons.base.models.ir_qweb_fields.FieldConverter'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class
 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MI
dMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.qweb.field.floatTime<class 'verp.api.ir.qweb.field.floatTime'>, <class 'verp.addons.base.models.ir_qweb_fields.FloatTimeConverter'>,
<class 'verp.api.ir.qweb.field'>, <class 'verp.addons.web_editor.models.ir_qweb.Field'>, <class 'verp.addons.base.models.ir_qweb_fields.FieldConv
erter'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>,
<class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.B
ase'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.qweb.field.duration<class 'verp.api.ir.qweb.field.duration'>, <class 'verp.addons.web_editor.models.ir_qweb.Duration'>, <class 'verp.ad
dons.base.models.ir_qweb_fields.DurationConverter'>, <class 'verp.api.ir.qweb.field'>, <class 'verp.addons.web_editor.models.ir_qweb.Field'>, <cl
ass 'verp.addons.base.models.ir_qweb_fields.FieldConverter'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class
 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MI
dMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.qweb.field.relative<class 'verp.api.ir.qweb.field.relative'>, <class 'verp.addons.web_editor.models.ir_qweb.RelativeDatetime'>, <class
'verp.addons.base.models.ir_qweb_fields.RelativeDatetimeConverter'>, <class 'verp.api.ir.qweb.field'>, <class 'verp.addons.web_editor.models.ir_q
web.Field'>, <class 'verp.addons.base.models.ir_qweb_fields.FieldConverter'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.Bas
eModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.model
s.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.qweb.field.barcode<class 'verp.api.ir.qweb.field.barcode'>, <class 'verp.addons.base.models.ir_qweb_fields.BarcodeConverter'>, <class '
verp.api.ir.qweb.field'>, <class 'verp.addons.web_editor.models.ir_qweb.Field'>, <class 'verp.addons.base.models.ir_qweb_fields.FieldConverter'>,
 <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class '
verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <
class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.qweb.field.contact<class 'verp.api.ir.qweb.field.contact'>, <class 'verp.addons.snailmail.models.ir_qweb_fields.Contact'>, <class 'verp
.addons.web_editor.models.ir_qweb.Contact'>, <class 'verp.addons.base.models.ir_qweb_fields.Contact'>, <class 'verp.api.ir.qweb.field.many2one'>,
 <class 'verp.addons.web_editor.models.ir_qweb.ManyToOne'>, <class 'verp.addons.base.models.ir_qweb_fields.ManyToOneConverter'>, <class 'verp.api
.ir.qweb.field'>, <class 'verp.addons.web_editor.models.ir_qweb.Field'>, <class 'verp.addons.base.models.ir_qweb_fields.FieldConverter'>, <class
'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.add
ons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'o
doo.models.BaseModel'>, <class 'object'>
>>> MRO: ir.qweb.field.qweb<class 'verp.api.ir.qweb.field.qweb'>, <class 'verp.addons.web_editor.models.ir_qweb.QwebView'>, <class 'verp.addons.bas
e.models.ir_qweb_fields.QwebView'>, <class 'verp.api.ir.qweb.field.many2one'>, <class 'verp.addons.web_editor.models.ir_qweb.ManyToOne'>, <class
'verp.addons.base.models.ir_qweb_fields.ManyToOneConverter'>, <class 'verp.api.ir.qweb.field'>, <class 'verp.addons.web_editor.models.ir_qweb.Fie
ld'>, <class 'verp.addons.base.models.ir_qweb_fields.FieldConverter'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'
>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fi
elds.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.http<class 'verp.api.ir.http'>, <class 'verp.addons.partner_autocomplete.models.ir_http.Http'>, <class 'verp.addons.mail_bot.models.ir_
http.Http'>, <class 'verp.addons.auth_signup.models.ir_http.Http'>, <class 'verp.addons.mail.models.ir_http.IrHttp'>, <class 'verp.addons.web_tou
r.models.ir_http.Http'>, <class 'verp.addons.web_editor.models.ir_http.IrHttp'>, <class 'verp.addons.base_setup.models.ir_http.IrHttp'>, <class '
verp.addons.auth_totp.models.ir_http.IrHttp'>, <class 'verp.addons.web.models.ir_http.Http'>, <class 'verp.addons.base.models.ir_http.IrHttp'>, <
class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'od
oo.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <cl
ass 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.logging<class 'verp.api.ir.logging'>, <class 'verp.addons.base.models.ir_logging.IrLogging'>, <class 'verp.models.Model'>, <class 'verp
.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.w
eb.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.m
odels.BaseModel'>, <class 'object'>
>>> MRO: ir.property<class 'verp.api.ir.property'>, <class 'verp.addons.base.models.ir_property.Property'>, <class 'verp.models.Model'>, <class 'od
oo.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons
.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp
.models.BaseModel'>, <class 'object'>
>>> MRO: ir.module.category<class 'verp.api.ir.module.category'>, <class 'verp.addons.base.models.res_users.ModuleCategory'>, <class 'verp.addons.b
ase.models.ir_module.ModuleCategory'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>,
<class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_field
s.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.module.module<class 'verp.api.ir.module.module'>, <class 'verp.addons.base.models.ir_module.Module'>, <class 'verp.models.Model'>, <cla
ss 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.
addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class
 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.module.module.dependency<class 'verp.api.ir.module.module.dependency'>, <class 'verp.addons.base.models.ir_module.ModuleDependency'>, <
class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.b
ase_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.bas
e.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.module.module.exclusion<class 'verp.api.ir.module.module.exclusion'>, <class 'verp.addons.base.models.ir_module.ModuleExclusion'>, <cla
ss 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base
_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.m
odels.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.demo<class 'verp.api.ir.demo'>, <class 'verp.addons.base.models.ir_demo.IrDemo'>, <class 'verp.models.TransientModel'>, <class 'verp.mo
dels.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Bas
e'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_mo
del.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.demo_failure<class 'verp.api.ir.demo_failure'>, <class 'verp.addons.base.models.ir_demo_failure.DemoFailure'>, <class 'verp.models.Tran
sientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_
import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class '
verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.demo_failure.wizard<class 'verp.api.ir.demo_failure.wizard'>, <class 'verp.addons.base.models.ir_demo_failure.DemoFailureWizard'>, <cla
ss 'verp.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <clas
s 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2M
IdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: report.layout<class 'verp.api.report.layout'>, <class 'verp.addons.base.models.report_layout.ReportLayout'>, <class 'verp.models.Model'>,
<class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'o
doo.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <c
lass 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: report.paperformat<class 'verp.api.report.paperformat'>, <class 'verp.addons.base.models.report_paperformat.report_paperformat'>, <class '
verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_imp
ort.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.model
s.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: ir.profile<class 'verp.api.ir.profile'>, <class 'verp.addons.base.models.ir_profile.IrProfile'>, <class 'verp.models.Model'>, <class 'verp
.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.w
eb.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.m
odels.BaseModel'>, <class 'object'>
>>> MRO: base.enable.profiling.wizard<class 'verp.api.base.enable.profiling.wizard'>, <class 'verp.addons.base.models.ir_profile.EnableProfilingWiz
ard'>, <class 'verp.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseMod
el'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir
_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: image.mixin<class 'verp.api.image.mixin'>, <class 'verp.addons.base.models.image_mixin.ImageMixin'>, <class 'verp.api.base'>, <class 'verp
.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>,
<class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class
 'object'>
>>> MRO: avatar.mixin<class 'verp.api.avatar.mixin'>, <class 'verp.addons.base.models.avatar_mixin.AvatarMixin'>, <class 'verp.api.image.mixin'>, <
class 'verp.addons.base.models.image_mixin.ImageMixin'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'odo
o.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapp
er'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: res.country<class 'verp.api.res.country'>, <class 'verp.addons.base.models.res_country.Country'>, <class 'verp.models.Model'>, <class 'odo
o.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.
web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.
models.BaseModel'>, <class 'object'>
>>> MRO: res.country.group<class 'verp.api.res.country.group'>, <class 'verp.addons.base.models.res_country.CountryGroup'>, <class 'verp.models.Mod
el'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <cl
ass 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base
'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: res.country.state<class 'verp.api.res.country.state'>, <class 'verp.addons.base.models.res_country.CountryState'>, <class 'verp.models.Mod
el'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <cl
ass 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base
'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: res.lang<class 'verp.api.res.lang'>, <class 'verp.addons.base.models.res_lang.Lang'>, <class 'verp.models.Model'>, <class 'verp.api.base'>
, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.m
odels.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseM
odel'>, <class 'object'>
>>> MRO: format.address.mixin
  <class 'verp.api.format.address.mixin'>, 
    <class 'verp.addons.base.models.res_partner.FormatAddressMixin'>, 
  <class 'verp.api.base'>, 
    <class 'verp.addons.mail.models.models.BaseModel'>, 
    <class 'verp.addons.base_import.models.base_import.Base'>, 
    <class 'verp.addons.web.models.models.Base'>, 
    <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, 
    <class 'verp.addons.base.models.ir_model.Base'>, 
    <class 'verp.models.BaseModel'>, 
  <class 'object'>
>>> MRO: res.partner.category<class 'verp.api.res.partner.category'>, <class 'verp.addons.base.models.res_partner.PartnerCategory'>, <class 'verp.m
odels.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Ba
se'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_m
odel.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: res.partner.title<class 'verp.api.res.partner.title'>, <class 'verp.addons.base.models.res_partner.PartnerTitle'>, <class 'verp.models.Mod
el'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <cl
ass 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base
'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: res.partner<class 'verp.api.res.partner'>, <class 'verp.addons.snailmail.models.res_partner.ResPartner'>, <class 'verp.addons.sms.models.r
es_partner.ResPartner'>, <class 'verp.api.mail.thread.phone'>, <class 'verp.addons.sms.models.mail_thread_phone.PhoneMixin'>, <class 'verp.addons
.phone_validation.models.mail_thread_phone.PhoneMixin'>, <class 'verp.addons.partner_autocomplete.models.res_partner.ResPartner'>, <class 'verp.a
ddons.sales_team.models.res_partner.ResPartner'>, <class 'verp.addons.phone_validation.models.res_partner.Partner'>, <class 'verp.addons.auth_sig
nup.models.res_partner.ResPartner'>, <class 'verp.addons.mail.models.res_partner.Partner'>, <class 'verp.addons.bus.models.res_partner.ResPartner
'>, <class 'verp.addons.base.populate.res_partner.Partner'>, <class 'verp.addons.base.models.res_partner.Partner'>, <class 'verp.models.Model'>,
<class 'verp.api.format.address.mixin'>, <class 'verp.addons.base.models.res_partner.FormatAddressMixin'>, <class 'verp.api.avatar.mixin'>, <clas
s 'verp.addons.base.models.avatar_mixin.AvatarMixin'>, <class 'verp.api.image.mixin'>, <class 'verp.addons.base.models.image_mixin.ImageMixin'>,
<class 'verp.api.mail.activity.mixin'>, <class 'verp.addons.mail.models.mail_activity_mixin.MailActivityMixin'>, <class 'verp.api.mail.thread.bla
cklist'>, <class 'verp.addons.mail.models.mail_thread_blacklist.MailBlackListMixin'>, <class 'verp.api.mail.thread'>, <class 'verp.addons.sms.mod
els.mail_thread.MailThread'>, <class 'verp.addons.mail_bot.models.mail_thread.MailThread'>, <class 'verp.addons.mail.models.mail_thread.MailThrea
d'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <cla
ss 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'
>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: res.partner.industry<class 'verp.api.res.partner.industry'>, <class 'verp.addons.base.populate.res_partner.ResPartnerIndustry'>, <class 'o
doo.addons.base.models.res_partner.ResPartnerIndustry'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.mo
dels.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.ba
se.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: res.bank<class 'verp.api.res.bank'>, <class 'verp.addons.base.models.res_bank.Bank'>, <class 'verp.models.Model'>, <class 'verp.api.base'>
, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.m
odels.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseM
odel'>, <class 'object'>
>>> MRO: res.partner.bank<class 'verp.api.res.partner.bank'>, <class 'verp.addons.base.models.res_bank.ResPartnerBank'>, <class 'verp.models.Model'
>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class
 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>,
 <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: res.config<class 'verp.api.res.config'>, <class 'verp.addons.base.models.res_config.ResConfigConfigurable'>, <class 'verp.models.Transient
Model'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_impor
t.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.
addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: res.config.installer<class 'verp.api.res.config.installer'>, <class 'verp.addons.base.models.res_config.ResConfigInstaller'>, <class 'verp
.api.res.config'>, <class 'verp.addons.base.models.res_config.ResConfigConfigurable'>, <class 'verp.models.TransientModel'>, <class 'verp.models.
Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>,
<class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.B
ase'>, <class 'verp.models.BaseModel'>, <class 'verp.addons.base.models.res_config.ResConfigModuleInstallationMixin'>, <class 'object'>
>>> MRO: res.config.settings<class 'verp.api.res.config.settings'>, <class 'verp.addons.snailmail.models.res_config_settings.ResConfigSettings'>, <
class 'verp.addons.partner_autocomplete.models.res_config_settings.ResConfigSettings'>, <class 'verp.addons.auth_signup.models.res_config_setting
s.ResConfigSettings'>, <class 'verp.addons.web_unsplash.models.res_config_settings.ResConfigSettings'>, <class 'verp.addons.mail.models.res_confi
g_settings.ResConfigSettings'>, <class 'verp.addons.iap.models.res_config_settings.ResConfigSettings'>, <class 'verp.addons.base_setup.models.res
_config_settings.ResConfigSettings'>, <class 'verp.addons.base.models.res_config.ResConfigSettings'>, <class 'verp.models.TransientModel'>, <clas
s 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_
import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.mo
dels.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'verp.addons.base.models.res_config.ResConfigModuleInstallationMixin'>, <class 'obj
ect'>
>>> MRO: res.currency<class 'verp.api.res.currency'>, <class 'verp.addons.base.models.res_currency.Currency'>, <class 'verp.models.Model'>, <class
'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.add
ons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'o
doo.models.BaseModel'>, <class 'object'>
>>> MRO: res.currency.rate<class 'verp.api.res.currency.rate'>, <class 'verp.addons.base.populate.res_currency.ResCurrencyRate'>, <class 'verp.addo
ns.base.models.res_currency.CurrencyRate'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseMode
l'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_
fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: res.company<class 'verp.api.res.company'>, <class 'verp.addons.snailmail.models.res_company.Company'>, <class 'verp.addons.partner_autocom
plete.models.res_company.ResCompany'>, <class 'verp.addons.mail.models.res_company.Company'>, <class 'verp.addons.web.models.models.ResCompany'>,
 <class 'verp.addons.base.populate.res_company.Partner'>, <class 'verp.addons.base.models.res_company.Company'>, <class 'verp.models.Model'>, <cl
ass 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp
.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <clas
s 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: res.groups<class 'verp.api.res.groups'>, <class 'verp.addons.mail.models.res_groups.ResGroups'>, <class 'verp.addons.base.models.res_users
.GroupsView'>, <class 'verp.addons.base.models.res_users.GroupsImplied'>, <class 'verp.addons.base.models.res_users.Groups'>, <class 'verp.models
.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>,
 <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.
Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: res.users.log<class 'verp.api.res.users.log'>, <class 'verp.addons.base.models.res_users.ResUsersLog'>, <class 'verp.models.Model'>, <clas
s 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.a
ddons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class
'verp.models.BaseModel'>, <class 'object'>
>>> MRO: res.users<class 'verp.api.res.users'>, <class 'verp.addons.sales_team.models.res_users.ResUsers'>, <class 'verp.addons.mail_bot.models.res
_users.Users'>, <class 'verp.addons.auth_totp_mail.models.res_users.Users'>, <class 'verp.addons.auth_signup.models.res_users.ResUsers'>, <class
'verp.addons.web_unsplash.models.res_users.ResUsers'>, <class 'verp.addons.mail.models.res_users.Users'>, <class 'verp.addons.bus.models.res_user
s.ResUsers'>, <class 'verp.addons.base_setup.models.res_users.ResUsers'>, <class 'verp.addons.base_import.models.base_import.ResUsers'>, <class '
verp.addons.auth_totp.models.res_users.Users'>, <class 'verp.addons.base.populate.res_user.Users'>, <class 'verp.addons.base.models.res_users.API
KeysUser'>, <class 'verp.addons.base.models.res_users.UsersView'>, <class 'verp.addons.base.models.res_users.UsersImplied'>, <class 'verp.addons.
base.models.res_users.Users'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class '
verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdM
apper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: res.users.identitycheck<class 'verp.api.res.users.identitycheck'>, <class 'verp.addons.base.models.res_users.CheckIdentity'>, <class 'verp
.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.
addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper
'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: change.password.wizard<class 'verp.api.change.password.wizard'>, <class 'verp.addons.base.models.res_users.ChangePasswordWizard'>, <class
'verp.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class '
verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdM
apper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: change.password.user<class 'verp.api.change.password.user'>, <class 'verp.addons.base.models.res_users.ChangePasswordUser'>, <class 'verp.
models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.a
ddons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'
>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: res.users.apikeys<class 'verp.api.res.users.apikeys'>, <class 'verp.addons.base.models.res_users.APIKeys'>, <class 'verp.models.Model'>, <
class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'od
oo.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <cl
ass 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: res.users.apikeys.description<class 'verp.api.res.users.apikeys.description'>, <class 'verp.addons.base.models.res_users.APIKeyDescription
'>, <class 'verp.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'
>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fi
elds.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: res.users.apikeys.show<class 'verp.api.res.users.apikeys.show'>, <class 'verp.addons.base.models.res_users.APIKeyShow'>, <class 'verp.api.
base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.mo
dels.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models
.BaseModel'>, <class 'object'>
>>> MRO: decimal.precision<class 'verp.api.decimal.precision'>, <class 'verp.addons.base.models.decimal_precision.DecimalPrecision'>, <class 'verp.
models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.B
ase'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_
model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: report.base.report_irmodulereference<class 'verp.api.report.base.report_irmodulereference'>, <class 'verp.addons.base.report.report_base_r
eport_irmodulereference.IrModelReferenceReport'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addon
s.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <
class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base.module.update<class 'verp.api.base.module.update'>, <class 'verp.addons.base.wizard.baseModuleUpdate.BaseModuleUpdate'>, <class 'od
oo.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'odo
o.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapp
er'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base.language.install<class 'verp.api.base.language.install'>, <class 'verp.addons.base.wizard.base_language_install.BaseLanguageInstall'>
, <class 'verp.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>,
 <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fiel
ds.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base.language.import<class 'verp.api.base.language.import'>, <class 'verp.addons.base.wizard.base_import_language.BaseLanguageImport'>, <c
lass 'verp.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <cl
ass 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O
2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base.module.upgrade<class 'verp.api.base.module.upgrade'>, <class 'verp.addons.base.wizard.baseModuleupgrade.BaseModuleUpgrade'>, <class
 'verp.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class
'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MId
Mapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base.module.uninstall<class 'verp.api.base.module.uninstall'>, <class 'verp.addons.mail.wizard.base_module_uninstall.BaseModuleUninstall'>
, <class 'verp.addons.base.wizard.base_module_uninstall.BaseModuleUninstall'>, <class 'verp.models.TransientModel'>, <class 'verp.models.Model'>,
 <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class '
verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <
class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base.language.export<class 'verp.api.base.language.export'>, <class 'verp.addons.base.wizard.base_export_language.BaseLanguageExport'>, <c
lass 'verp.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <cl
ass 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O
2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base.update.translations<class 'verp.api.base.update.translations'>, <class 'verp.addons.base.wizard.base_update_translations.BaseUpdateTr
anslations'>, <class 'verp.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.
BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.mo
dels.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base.partner.merge.line<class 'verp.api.base.partner.merge.line'>, <class 'verp.addons.base.wizard.base_partner_merge.MergePartnerLine'>,
<class 'verp.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <
class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields
.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base.partner.merge.automatic.wizard<class 'verp.api.base.partner.merge.automatic.wizard'>, <class 'verp.addons.mail.wizard.base_partner_me
rge_automatic_wizard.MergePartnerAutomatic'>, <class 'verp.addons.base.wizard.base_partner_merge.MergePartnerAutomatic'>, <class 'verp.models.Tra
nsientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base
_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class
'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base.document.layout<class 'verp.api.base.document.layout'>, <class 'verp.addons.web.models.base_document_layout.BaseDocumentLayout'>, <cl
ass 'verp.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <cla
ss 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2
MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: auth_totp.device<class 'verp.api.auth_totp.device'>, <class 'verp.addons.auth_totp.models.auth_totp.AuthTotpDevice'>, <class 'verp.api.res
.users.apikeys'>, <class 'verp.addons.base.models.res_users.APIKeys'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.
mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class '
verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object
'>
>>> MRO: auth_totp.wizard<class 'verp.api.auth_totp.wizard'>, <class 'verp.addons.auth_totp.wizard.auth_totp_wizard.TOTPWizard'>, <class 'verp.mode
ls.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addon
s.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <
class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base_import.mapping<class 'verp.api.base_import.mapping'>, <class 'verp.addons.base_import.models.base_import.ImportMapping'>, <class 'odo
o.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import
.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.i
r_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base_import.import<class 'verp.api.base_import.import'>, <class 'verp.addons.base_import.models.base_import.Import'>, <class 'verp.models.
TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.b
ase_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <cla
ss 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base_import.tests.models.char<class 'verp.api.base_import.tests.models.char'>, <class 'verp.addons.base_import.models.test_models.Char'>,
<class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.
base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.ba
se.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base_import.tests.models.char.required<class 'verp.api.base_import.tests.models.char.required'>, <class 'verp.addons.base_import.models.te
st_models.CharRequired'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.
addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper
'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base_import.tests.models.char.readonly<class 'verp.api.base_import.tests.models.char.readonly'>, <class 'verp.addons.base_import.models.te
st_models.CharReadonly'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.
addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper
'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base_import.tests.models.char.states<class 'verp.api.base_import.tests.models.char.states'>, <class 'verp.addons.base_import.models.test_m
odels.CharStates'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons
.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <c
lass 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base_import.tests.models.char.noreadonly<class 'verp.api.base_import.tests.models.char.noreadonly'>, <class 'verp.addons.base_import.model
s.test_models.CharNoreadonly'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class
'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MId
Mapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base_import.tests.models.char.stillreadonly<class 'verp.api.base_import.tests.models.char.stillreadonly'>, <class 'verp.addons.base_import
.models.test_models.CharStillreadonly'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>
, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fie
lds.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base_import.tests.models.m2o<class 'verp.api.base_import.tests.models.m2o'>, <class 'verp.addons.base_import.models.test_models.M2o'>, <cl
ass 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.bas
e_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.
models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base_import.tests.models.m2o.related<class 'verp.api.base_import.tests.models.m2o.related'>, <class 'verp.addons.base_import.models.test_m
odels.M2oRelated'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons
.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <c
lass 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base_import.tests.models.m2o.required<class 'verp.api.base_import.tests.models.m2o.required'>, <class 'verp.addons.base_import.models.test
_models.M2oRequired'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.add
ons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>,
 <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base_import.tests.models.m2o.required.related<class 'verp.api.base_import.tests.models.m2o.required.related'>, <class 'verp.addons.base_im
port.models.test_models.M2oRequiredRelated'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseMo
del'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.i
r_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base_import.tests.models.o2m<class 'verp.api.base_import.tests.models.o2m'>, <class 'verp.addons.base_import.models.test_models.O2m'>, <cl
ass 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.bas
e_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.
models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base_import.tests.models.o2m.child<class 'verp.api.base_import.tests.models.o2m.child'>, <class 'verp.addons.base_import.models.test_model
s.O2mChild'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_
import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class '
verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base_import.tests.models.preview<class 'verp.api.base_import.tests.models.preview'>, <class 'verp.addons.base_import.models.test_models.Pr
eviewModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_
import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class '
verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base_import.tests.models.float<class 'verp.api.base_import.tests.models.float'>, <class 'verp.addons.base_import.models.test_models.FloatM
odel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import
.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.a
ddons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: base_import.tests.models.complex<class 'verp.api.base_import.tests.models.complex'>, <class 'verp.addons.base_import.models.test_models.Co
mplexModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_
import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class '
verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: bus.bus<class 'verp.api.bus.bus'>, <class 'verp.addons.bus.models.bus.ImBus'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <clas
s 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.B
ase'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>,
 <class 'object'>
>>> MRO: bus.presence<class 'verp.api.bus.presence'>, <class 'verp.addons.mail.models.bus_presence.BusPresence'>, <class 'verp.addons.bus.models.bu
s_presence.BusPresence'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.
addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper
'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: webeditor.assets<class 'verp.api.webeditor.assets'>, <class 'verp.addons.web_editor.models.assets.Assets'>, <class 'verp.api.base'>, <cl
ass 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models
.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'
>, <class 'object'>
>>> MRO: web_editor.converter.test<class 'verp.api.web_editor.converter.test'>, <class 'verp.addons.web_editor.models.test_models.ConverterTest'>,
<class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.
base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.ba
se.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: web_editor.converter.test.sub<class 'verp.api.web_editor.converter.test.sub'>, <class 'verp.addons.web_editor.models.test_models.Converter
TestSub'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_imp
ort.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'odo
o.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: web_tour.tour<class 'verp.api.web_tour.tour'>, <class 'verp.addons.web_tour.models.tour.Tour'>, <class 'verp.models.Model'>, <class 'verp.
api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.we
b.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.mo
dels.BaseModel'>, <class 'object'>
>>> MRO: iap.account<class 'verp.api.iap.account'>, <class 'verp.addons.iap.models.iap_account.IapAccount'>, <class 'verp.models.Model'>, <class 'o
doo.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addon
s.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'odo
o.models.BaseModel'>, <class 'object'>
>>> MRO: iap.enrich.api<class 'verp.api.iap.enrich.api'>, <class 'verp.addons.iap.models.iap_enrich_api.IapEnrichAPI'>, <class 'verp.api.base'>, <c
lass 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.model
s.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel
'>, <class 'object'>
>>> MRO: mail.alias<class 'verp.api.mail.alias'>, <class 'verp.addons.mail.models.mail_alias.Alias'>, <class 'verp.models.Model'>, <class 'verp.api
.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.m
odels.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.model
s.BaseModel'>, <class 'object'>
>>> MRO: mail.activity.mixin<class 'verp.api.mail.activity.mixin'>, <class 'verp.addons.mail.models.mail_activity_mixin.MailActivityMixin'>, <class
 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.ad
dons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class '
verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.alias.mixin<class 'verp.api.mail.alias.mixin'>, <class 'verp.addons.mail.models.mail_alias_mixin.AliasMixin'>, <class 'verp.api.base'
>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.
models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.Base
Model'>, <class 'object'>
>>> MRO: mail.render.mixin<class 'verp.api.mail.render.mixin'>, <class 'verp.addons.mail.models.mail_render_mixin.MailRenderMixin'>, <class 'verp.a
pi.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web
.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.mod
els.BaseModel'>, <class 'object'>
>>> MRO: mail.composer.mixin<class 'verp.api.mail.composer.mixin'>, <class 'verp.addons.mail.models.mail_composer_mixin.MailComposerMixin'>, <class
 'verp.api.mail.render.mixin'>, <class 'verp.addons.mail.models.mail_render_mixin.MailRenderMixin'>, <class 'verp.api.base'>, <class 'verp.addons
.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class
'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'objec
t'>
>>> MRO: mail.thread<class 'verp.api.mail.thread'>, <class 'verp.addons.sms.models.mail_thread.MailThread'>, <class 'verp.addons.mail_bot.models.ma
il_thread.MailThread'>, <class 'verp.addons.mail.models.mail_thread.MailThread'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models
.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.m
odels.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.thread.blacklist<class 'verp.api.mail.thread.blacklist'>, <class 'verp.addons.mail.models.mail_thread_blacklist.MailBlackListMixin'>,
 <class 'verp.api.mail.thread'>, <class 'verp.addons.sms.models.mail_thread.MailThread'>, <class 'verp.addons.mail_bot.models.mail_thread.MailThr
ead'>, <class 'verp.addons.mail.models.mail_thread.MailThread'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <cl
ass 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O
2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.thread.cc<class 'verp.api.mail.thread.cc'>, <class 'verp.addons.mail.models.mail_thread_cc.MailCCMixin'>, <class 'verp.api.mail.threa
d'>, <class 'verp.addons.sms.models.mail_thread.MailThread'>, <class 'verp.addons.mail_bot.models.mail_thread.MailThread'>, <class 'verp.addons.m
ail.models.mail_thread.MailThread'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import
.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.a
ddons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.notification<class 'verp.api.mail.notification'>, <class 'verp.addons.snailmail.models.mail_notification.Notification'>, <class 'verp
.addons.sms.models.mail_notification.MailNotification'>, <class 'verp.addons.mail.models.mail_notification.MailNotification'>, <class 'verp.model
s.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>
, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model
.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.activity.type<class 'verp.api.mail.activity.type'>, <class 'verp.addons.mail.models.mail_activity_type.MailActivityType'>, <class 'od
oo.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_impor
t.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.
ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.activity<class 'verp.api.mail.activity'>, <class 'verp.addons.mail.models.mail_activity.MailActivity'>, <class 'verp.models.Model'>,
<class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'o
doo.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <c
lass 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.blacklist<class 'verp.api.mail.blacklist'>, <class 'verp.addons.mail.models.mail_blacklist.MailBlackList'>, <class 'verp.models.Model
'>, <class 'verp.api.mail.thread'>, <class 'verp.addons.sms.models.mail_thread.MailThread'>, <class 'verp.addons.mail_bot.models.mail_thread.Mail
Thread'>, <class 'verp.addons.mail.models.mail_thread.MailThread'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>,
<class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_field
s.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.followers<class 'verp.api.mail.followers'>, <class 'verp.addons.sms.models.mail_followers.Followers'>, <class 'verp.addons.mail.model
s.mail_followers.Followers'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'o
doo.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMa
pper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.message.reaction<class 'verp.api.mail.message.reaction'>, <class 'verp.addons.mail.models.mail_message_reaction.MailMessageReaction'>
, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.model
s.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.
base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.message.subtype<class 'verp.api.mail.message.subtype'>, <class 'verp.addons.mail.models.mail_message_subtype.MailMessageSubtype'>, <c
lass 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.ba
se_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base
.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.message<class 'verp.api.mail.message'>, <class 'verp.addons.snailmail.models.mail_message.Message'>, <class 'verp.addons.sms.models.m
ail_message.MailMessage'>, <class 'verp.addons.mail.models.mail_message.Message'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class '
verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base
'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <c
lass 'object'>
>>> MRO: mail.mail<class 'verp.api.mail.mail'>, <class 'verp.addons.fetchmail.models.mail_mail.MailMail'>, <class 'verp.addons.mail.models.mail_mai
l.MailMail'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_
import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class '
verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.tracking.value<class 'verp.api.mail.tracking.value'>, <class 'verp.addons.mail.models.mail_tracking_value.MailTracking'>, <class 'odo
o.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import
.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.i
r_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.template<class 'verp.api.mail.template'>, <class 'verp.addons.mail.models.mail_template.MailTemplate'>, <class 'verp.models.Model'>,
<class 'verp.api.mail.render.mixin'>, <class 'verp.addons.mail.models.mail_render_mixin.MailRenderMixin'>, <class 'verp.api.base'>, <class 'verp.
addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <
class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class
'object'>
>>> MRO: mail.channel.partner<class 'verp.api.mail.channel.partner'>, <class 'verp.addons.mail.models.mail_channel_partner.ChannelPartner'>, <class
 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_i
mport.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.mod
els.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.channel.rtc.session<class 'verp.api.mail.channel.rtc.session'>, <class 'verp.addons.mail.models.mail_channel_rtc_session.MailRtcSessi
on'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.m
odels.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.add
ons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.channel<class 'verp.api.mail.channel'>, <class 'verp.addons.mail_bot.models.mail_channel.Channel'>, <class 'verp.addons.mail.models.m
ail_channel.Channel'>, <class 'verp.models.Model'>, <class 'verp.api.mail.thread'>, <class 'verp.addons.sms.models.mail_thread.MailThread'>, <cla
ss 'verp.addons.mail_bot.models.mail_thread.MailThread'>, <class 'verp.addons.mail.models.mail_thread.MailThread'>, <class 'verp.api.mail.alias.m
ixin'>, <class 'verp.addons.mail.models.mail_alias_mixin.AliasMixin'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'
>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fi
elds.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.guest<class 'verp.api.mail.guest'>, <class 'verp.addons.mail.models.mail_guest.MailGuest'>, <class 'verp.models.Model'>, <class 'verp
.api.avatar.mixin'>, <class 'verp.addons.base.models.avatar_mixin.AvatarMixin'>, <class 'verp.api.image.mixin'>, <class 'verp.addons.base.models.
image_mixin.ImageMixin'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.bas
e_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.
models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.ice.server<class 'verp.api.mail.ice.server'>, <class 'verp.addons.mail.models.mail_ice_server.MailIceServer'>, <class 'verp.models.Mo
del'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <c
lass 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Bas
e'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.shortcode<class 'verp.api.mail.shortcode'>, <class 'verp.addons.mail.models.mail_shortcode.MailShortcode'>, <class 'verp.models.Model
'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <clas
s 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>
, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: res.users.settings<class 'verp.api.res.users.settings'>, <class 'verp.addons.mail.models.res_users_settings.ResUsersSettings'>, <class 'od
oo.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_impor
t.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.
ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: res.users.settings.volumes<class 'verp.api.res.users.settings.volumes'>, <class 'verp.addons.mail.models.res_users_settings_volumes.ResUse
rsSettingsVolumes'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addon
s.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <
class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: publisher_warranty.contract<class 'verp.api.publisher_warranty.contract'>, <class 'verp.addons.mail.models.update.PublisherWarrantyContrac
t'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <cla
ss 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'
>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.blacklist.remove<class 'verp.api.mail.blacklist.remove'>, <class 'verp.addons.mail.wizard.mail_blacklist_remove.MailBlacklistRemove'>
, <class 'verp.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>,
 <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fiel
ds.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.compose.message<class 'verp.api.mail.compose.message'>, <class 'verp.addons.mail.wizard.mail_compose_message.MailComposer'>, <class '
verp.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.mail.composer.mixin'>, <class 'verp.addons.mail.models.mail_composer_
mixin.MailComposerMixin'>, <class 'verp.api.mail.render.mixin'>, <class 'verp.addons.mail.models.mail_render_mixin.MailRenderMixin'>, <class 'odo
o.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.
web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.
models.BaseModel'>, <class 'object'>
>>> MRO: mail.resend.cancel<class 'verp.api.mail.resend.cancel'>, <class 'verp.addons.mail.wizard.mail_resend_cancel.MailResendCancel'>, <class 'od
oo.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'odo
o.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapp
er'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.resend.message<class 'verp.api.mail.resend.message'>, <class 'verp.addons.mail.wizard.mail_resend_message.MailResendMessage'>, <class
 'verp.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class
'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MId
Mapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.resend.partner<class 'verp.api.mail.resend.partner'>, <class 'verp.addons.mail.wizard.mail_resend_message.PartnerResend'>, <class 'od
oo.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'odo
o.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapp
er'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.template.preview<class 'verp.api.mail.template.preview'>, <class 'verp.addons.mail.wizard.mail_template_preview.MailTemplatePreview'>
, <class 'verp.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>,
 <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fiel
ds.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.wizard.invite<class 'verp.api.mail.wizard.invite'>, <class 'verp.addons.mail.wizard.mail_wizard_invite.Invite'>, <class 'verp.models.
TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.b
ase_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <cla
ss 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: fetchmail.server<class 'verp.api.fetchmail.server'>, <class 'verp.addons.fetchmail.models.fetchmail.FetchmailServer'>, <class 'verp.models
.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>,
 <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.
Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.bot<class 'verp.api.mail.bot'>, <class 'verp.addons.mail_bot.models.mail_bot.MailBot'>, <class 'verp.api.base'>, <class 'verp.addons.
mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class '
verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object
'>
>>> MRO: phone.blacklist<class 'verp.api.phone.blacklist'>, <class 'verp.addons.phone_validation.models.phone_blacklist.PhoneBlackList'>, <class 'o
doo.models.Model'>, <class 'verp.api.mail.thread'>, <class 'verp.addons.sms.models.mail_thread.MailThread'>, <class 'verp.addons.mail_bot.models.
mail_thread.MailThread'>, <class 'verp.addons.mail.models.mail_thread.MailThread'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.mode
ls.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base
.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: mail.thread.phone<class 'verp.api.mail.thread.phone'>, <class 'verp.addons.sms.models.mail_thread_phone.PhoneMixin'>, <class 'verp.addons.
phone_validation.models.mail_thread_phone.PhoneMixin'>, <class 'verp.api.mail.thread'>, <class 'verp.addons.sms.models.mail_thread.MailThread'>,
<class 'verp.addons.mail_bot.models.mail_thread.MailThread'>, <class 'verp.addons.mail.models.mail_thread.MailThread'>, <class 'verp.api.base'>,
<class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.mod
els.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseMod
el'>, <class 'object'>
>>> MRO: phone.blacklist.remove<class 'verp.api.phone.blacklist.remove'>, <class 'verp.addons.phone_validation.wizard.phone_blacklist_remove.PhoneB
lacklistRemove'>, <class 'verp.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.mod
els.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.bas
e.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: crm.team.member<class 'verp.api.crm.team.member'>, <class 'verp.addons.sales_team.models.crm_team_member.CrmTeamMember'>, <class 'verp.mod
els.Model'>, <class 'verp.api.mail.thread'>, <class 'verp.addons.sms.models.mail_thread.MailThread'>, <class 'verp.addons.mail_bot.models.mail_th
read.MailThread'>, <class 'verp.addons.mail.models.mail_thread.MailThread'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.Base
Model'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models
.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: crm.team<class 'verp.api.crm.team'>, <class 'verp.addons.sales_team.models.crm_team.CrmTeam'>, <class 'verp.models.Model'>, <class 'verp.a
pi.mail.thread'>, <class 'verp.addons.sms.models.mail_thread.MailThread'>, <class 'verp.addons.mail_bot.models.mail_thread.MailThread'>, <class '
verp.addons.mail.models.mail_thread.MailThread'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addon
s.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <
class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: crm.tag<class 'verp.api.crm.tag'>, <class 'verp.addons.sales_team.models.crm_tag.Tag'>, <class 'verp.models.Model'>, <class 'verp.api.base
'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models
.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.Bas
eModel'>, <class 'object'>
>>> MRO: iap.autocomplete.api<class 'verp.api.iap.autocomplete.api'>, <class 'verp.addons.partner_autocomplete.models.iap_autocomplete_api.IapAutoc
ompleteEnrichAPI'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_impo
rt.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models
.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: res.partner.autocomplete.sync<class 'verp.api.res.partner.autocomplete.sync'>, <class 'verp.addons.partner_autocomplete.models.res_partner
_autocomplete_sync.ResPartnerAutocompleteSync'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.Bas
eModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.model
s.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: sms.api<class 'verp.api.sms.api'>, <class 'verp.addons.sms.models.sms_api.SmsApi'>, <class 'verp.api.base'>, <class 'verp.addons.mail.mode
ls.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addo
ns.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: sms.sms<class 'verp.api.sms.sms'>, <class 'verp.addons.sms.models.sms_sms.SmsSms'>, <class 'verp.models.Model'>, <class 'verp.api.base'>,
<class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.mod
els.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseMod
el'>, <class 'object'>
>>> MRO: sms.template<class 'verp.api.sms.template'>, <class 'verp.addons.sms.models.sms_template.SMSTemplate'>, <class 'verp.models.Model'>, <clas
s 'verp.api.mail.render.mixin'>, <class 'verp.addons.mail.models.mail_render_mixin.MailRenderMixin'>, <class 'verp.api.base'>, <class 'verp.addon
s.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class
 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'obje
ct'>
>>> MRO: sms.cancel<class 'verp.api.sms.cancel'>, <class 'verp.addons.sms.wizard.sms_cancel.SMSCancel'>, <class 'verp.models.TransientModel'>, <cla
ss 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base
_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.m
odels.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: sms.composer<class 'verp.api.sms.composer'>, <class 'verp.addons.sms.wizard.sms_composer.SendSMS'>, <class 'verp.models.TransientModel'>,
<class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.
base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.ba
se.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: sms.resend.recipient<class 'verp.api.sms.resend.recipient'>, <class 'verp.addons.sms.wizard.sms_resend.SMSRecipient'>, <class 'verp.models
.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.
base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <cl
ass 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: sms.resend<class 'verp.api.sms.resend'>, <class 'verp.addons.sms.wizard.sms_resend.SMSResend'>, <class 'verp.models.TransientModel'>, <cla
ss 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base
_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.m
odels.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: sms.template.preview<class 'verp.api.sms.template.preview'>, <class 'verp.addons.sms.wizard.sms_template_preview.SMSTemplatePreview'>, <cl
ass 'verp.models.TransientModel'>, <class 'verp.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <cla
ss 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2
MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: snailmail.letter<class 'verp.api.snailmail.letter'>, <class 'verp.addons.snailmail.models.snailmail_letter.SnailmailLetter'>, <class 'verp
.models.Model'>, <class 'verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.
Base'>, <class 'verp.addons.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir
_model.Base'>, <class 'verp.models.BaseModel'>, <class 'object'>
>>> MRO: snailmail.confirm<class 'verp.api.snailmail.confirm'>, <class 'verp.addons.snailmail.wizard.snailmail_confirm.SnailmailConfirm'>, <class '
verp.api.base'>, <class 'verp.addons.mail.models.models.BaseModel'>, <class 'verp.addons.base_import.models.base_import.Base'>, <class 'verp.addo
ns.web.models.models.Base'>, <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, <class 'verp.addons.base.models.ir_model.Base'>, <class 'od
oo.models.BaseModel'>, <class 'object'>
>>> MRO: snailmail.letter.cancel
  <class 'verp.api.snailmail.letter.cancel'>, 
  <class 'verp.addons.snailmail.wizard.snailmail_letter_cancel.SnailmailLetterCancel'>, 
  <class 'verp.models.TransientModel'>, 
  <class 'verp.models.Model'>, 
  <class 'verp.api.base'>, 
  <class 'verp.addons.mail.models.models.BaseModel'>, 
  <class 'verp.addons.base_import.models.base_import.Base'>, 
  <class 'verp.addons.web.models.models.Base'>, 
  <class 'verp.addons.base.models.ir_fields.O2MIdMapper'>, 
  <class 'verp.addons.base.models.ir_model.Base'>, 
  <class 'verp.models.BaseModel'>, 
  <class 'object'>
 */

import {linearize} from '../../core/api/mro';

class O {
  static __bases;
}

class A extends O {}
class B extends O {}
class C extends O {}
class D extends O {}
class E extends O {}

class K1 extends O {
  static __bases = [A, B, C];
  static _classname = 'classK1';
}

class K2 extends O {
  static __bases = [B, D, E];
  static _classname = 'classK2';
}

class K3 extends O {
  static __bases = [A, B, D, E];
  static _classname = 'classK3';
}

class Z extends O {
  static __bases = [K1, K2, K3];
}

class X extends O {
  static __bases = [K1, K2, K3, Z];
}

function _mro(cls): any[] {
  if (!cls) {
    return [];
  }
  const bases = cls.__bases || [];
  let res = [...bases];
  for (const pro of bases) {
    for (const p of _mro(pro)) {
      if (!res.includes(p))
        res.push(p);
    }
  }
  res.unshift(cls);
  return res;
}

function main () {
  console.log('START');
  
  const graph = new Map<any, any>();
  const list = [A, B, C, D, E, K1, K2, K3, Z, X]; 
  list.forEach(cls => graph.set(cls, cls.__bases));
  console.info('graph:', graph);

  let result = linearize(graph);
  
  console.log('C3:', result);
  for (const [cls, bases]  of result) {
    console.log(cls.name, bases.map(b => b.name))
  }
  console.log('STOP');
}

function main_key () {
  console.log('START');
  
  const graph: any = {};
  const list = [A, B, C, D, E, K1, K2, K3, Z]; 
  for (const c of list) {
    graph[c.name] = c.__bases ?? [];
  };
  console.info('graph:', graph);

  let result = linearize(graph);
  
  // console.info('result:', result);//.map(cls => cls.name).join(','));
  console.log('C3:', result);
  console.log('STOP');
}

main();

export {}