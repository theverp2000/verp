const result = {
  "jsonrpc":"2.0",
  "id":2,
  "result":{
    "fieldsViews":{
      "kanban":{
        "model":"res.users.apikeys",
        "fieldParent":false,
        "arch":"<kanban string=\"res.users.apikeys\"><templates><t t-name=\"kanban-box\"><div t-attf-class=\"oe_kanban_card oe_kanban_global_click\"><div class=\"o_kanban_card_content\"><field name=\"label\"/></div></div></t></templates></kanban>",
        "type":"kanban",
        "label":"default",
        "fields":{}
      }
    },
    "fields":{
      "label":{"type":"char","changeDefault":false,"companyDependent":false,"manual":false,"readonly":true,"required":true,"size":255,"store":true,"trim":true,"name":"label"},
      "userId":{"type":"many2one","changeDefault":false,"companyDependent":false,"context":{},"manual":false,"readonly":true,"relation":"res.users","required":true,"store":true,"name":"userId"},
      "scope":{"type":"char","changeDefault":false,"companyDependent":false,"manual":false,"readonly":true,"required":false,"size":255,"store":true,"trim":true,"name":"scope"},
      "createdAt":{"type":"datetime","changeDefault":false,"companyDependent":false,"manual":false,"readonly":true,"required":false,"store":true,"name":"createdAt"},
      "id":{"type":"integer","changeDefault":false,"companyDependent":false,"manual":false,"readonly":true,"required":false,"store":true,"name":"id"},
      "__lastUpdate":{"type":"datetime","changeDefault":false,"companyDependent":false,"manual":false,"readonly":true,"required":false,"store":false,"name":"__lastUpdate"},
      "displayName":{"type":"char","changeDefault":false,"companyDependent":false,"manual":false,"readonly":true,"required":false,"size":255,"store":false,"trim":true,"name":"displayName"}
    }
  }
}