Verp (Very-easy Enterprise Resource Planning) is an ERP server platform running on Nodejs written in Typescript/Javascript, and the webclient side follows the standard of the trio of frontend development: JavaScript, HTML, and CSS.

The author's point of view is that needs a platform which can run as a multi-purpose ERP platform to serve small and medium-sized organizations and businesses with the following requirements:

1) only written in a programming language (Javascript/Typescript),
2) allows running on any operating system platform (Linux/Windows/MacOS),
3) easy to use (private server/cloud, web client/smartdevice),
4) easy to extend (install/uninstall modules on runtime).

Through the aproaching of existing open source platforms, with my limitations, I has not found any software that fully meets my requirements. The author has also combined various platforms and supporting software packages but found that those implementations are still limited.

Odoo/OpenERP, is an interesting inspiration, however it is written in Python for the server-side, so the webclient needs to use some hybrid techniques to process the language for some specifications defined on the server and client side. In some aspects, Python is a great programming language for the server and Javascript is also great but it is difficult to completely replace Python.

Through the efforts of applying, learning, inheriting and referencing Odoo/OpenERP and some other supporting packages of the community available on NPM, the author has tried to create the Verp platform to serve the above purpose and hopes that many people, especially the SME community, support with this idea. 

In the early stages, many source codes are taken and converted from Python for the main purpose of easy experience, reference and bug fixing. In the near future, when the platform is stable enough, the architecture will be converted as appropriately as possible. Most of the web client packages are adopted from Odoo/OpenErp platform with compatibility tweaks to work smoothly with Nodejs server-side architecture. New improvements may need to be updated to utilize the power of Nodejs as well as Javascript/Typescript.

This is the first version, which will be continuously updated. I hope people are interested in experiencing and contributing positive comments to help the Verp become more complete.

Bug patches, technical specifications and detailed instructions will be updated in the near future.

** Installation instructions:

1) Get the Verp 1.0

  git clone https://github.com/tonyluong2025/verp.git

2) Install nodejs 20.15.1

  https://nodejs.org/en/download/prebuilt-installer

3) Install typescript 5.3.3

  https://www.typescriptlang.org/download/

4) Install postgres 12.20
  
  https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
> Create user with permission create/remove database: \
    user: verp \
    pass: verp

5) Install Chrome to make report pdf

  > https://www.google.com/chrome

6) Config verp .\src\config.json

  > "addonsPath": "./src/core/addons,./src/addons",\
  "chromePath": "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",\
  "dataDir": "C:\\Users\\Admin\\AppData\\Local\\Verp",\
  "dbHost": "localhost",\
  "dbDialect": "postgres",\
  "dbPort": 5432,\
  "dbUser": "verp",\
  "dbPassword": "verp",\
  "httpHostname": "localhost",\
  "httpPort": 7979,\
  "langCodes": [["vi_VN", "Tiếng Việt"], ["en_US", "English"]],\
  "smtpServer": "smtp.ethereal.email",\
  "smtpPort": 587,\
  "smtpSsl": "STARTTLS",\
  "smtpUser": "???@ethereal.email",\
  "smtpPassword": "???",\

7) Run

  > ts-node ./src/index.ts

8) Access

  > http://localhost:7979 \
  (default password of master: admin)



7/29/2022: đọc file config.json ánh xạ vào config.options

* Verp (only 1 Pool for many database):
có 1 _Pool (ConnectionPool) toàn cục duy nhất quản lý tất cả Connection (default max=64).
Mỗi conn có thể kết nối với 1 DB postgres khác nhau (w/ dbname, user, pass, host, port, sslmode).
=> _Pool toàn cục cho nhiều DB 
ConnectionPool {
  _connections = (PostgresConnection, Boolean)[]
  _maxconn = 64
}
* Sequelize (one instance per database): 
Mỗi Sequelize kết nối 1 DB duy nhất và có 1 conn pool cho riêng DB này (default max=5).
=> Pool cục bộ trên từng DB.

=> Kết hợp 2 cơ chế => Giải pháp:
- Nhiều DB sẽ cần nhiều Seq. Tạo 1 pool toàn cục quản lý (nhiều conn cho) tất cả Seq/DB, gọi là ConnectionManPool (có ý nghĩa là SequelizePool/hay DB):
Mỗi DB phân biệt bởi: dbName (kèm theo: host, port, user/pass, ssl)
var _Pool: ConnectionPool {
  _db[dbName] = new Sequelize(..., pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },)
  _connections = (Connection, Boolean)[]
  _maxconn = 64
}

- Mỗi 1 Seq có 1 pool cục bộ quản lý các conn trên DB đó.
- Tổng số Conn cần có cho sys là tổng 

* Merge master:
git checkout master
git pull
git checkout fixing_fields
git merge -s ours master
git checkout master
git merge fixing_fields

Class:
this => {
	length: number of arguments of constructor,
	name: of class,
	prototype: parent class,
	static properties and functions
}
constructure => {
	length
	name
	prototype
}
prototype => {
	constructor,
	instance properties and functions
}

*****
Trong javascript
class A:
	@classmethod
	def testA(cls):
		print('testA')

class B(A):

a = A()
b = B()
B.testA() #=> OK
b.testA() #=> OK

***** 
Trong Javascript
class A {
	static testA() {
		print('testA')
	}
}

class B extends A {}

b = new B()
B.testA() #=> OK
b.testA() #=> ERROR: Not a function

*****
Quy trinh loading
loading
	registry.builModels()
		module_to_models.forEach((cls) => cls._buildModel(registry, cr))
		// Lay tat ca model (goc) co trong cac module luu vao registry.models
	registry.setupModels()
		env['ir.model']._prepareSetup()
		for model in models:
			model._prepareSetup()

			model._setupBase()

			model._setupFields()

			model._setupComplete()

			for field in model._fields.values():


Process flow:
* server
main
start
run
preload_registries
registry.new
loadModules
loadModuleGraph
init_models
_autoInit
update_db
update_db_notnull
_init_column
convert_to_column
convert_to_cache
get_values
_tx_get

* webclient:
startWebClient
startServices
_startServices
actionService
makeActionManager: 
	_getActionParams()
	@web/core/browser/router_service
_loadAction
/web/action/load

webclient->setup
loadRouterState
_loadDefaultApp
selectMenu
doAction
_loadAction

class:
default: async (self) => self.f()
selection: f(self)

instance:
compute: async f(), '_functionName'
functions...

Webclient:
_viewwRef
default_
search_
searchDefault_
_value
_index
_first
_last
_odd
_even
_parity

Must fix:
\src\core\addons\web\static\lib\vj.js\lib\*.js
\src\core\addons\web\static\src\legacy\js\core\vj_utils.js


* Frontend webite editor
web_editor.assetsWysiwyg.min.js: 			web_editor.VerpEditor.constructor()
web_editor.assetsWysiwyg.min.js: 			web_editor.wysiwyg._createSnippetsMenuInstance()
website.assetsWysiwyg.min.js:     		website.wysiwyg.init()
web_editor.assetsWysiwyg.min.js:      web_editor.snippet.editor.init()
website.assetsWysiwyg.min.js:   			website.snippet.editor.start()
web_editor.assetsWysiwyg.min.js:      web_editor.snippet.editor.start()

mariadb/mysql:
lower_case_table_names=2

date.toISOString() to postgres

There vj.js in 3 locations:
\web\static:
	\lib\vj.js\lib\
	\src\core\ast\
	\src\core\domain.js
	\src\legacy\js\core\vj_utils.js

/**
 * localhost:8069/web
  service > server > ThreadServer.http_thread.app
    this.httpd.serve_foreever()
  service > wsgi_server > application
    application_unproxied()
    rerult = http.root(env, start_response)
  http > Root.__call__
    this.dispatch()
  http > DisableCacheMIddleware.__call__
    return this.app()
  http > Root > dispatch()
    request.dispatch()
  http > HttpRequest.dispatch
    this._call_function(...)
  http > WebRequest._call_function
    return this.endpont(..)
  http > Endpoint.run
    return this.method(...)
  http > route.decorator.response_wrap
    response = f(...)
  addons > web > controllers > main > Home.index();//web
**************
  MainThread
  core.service.httpd
  core.seevice.cron.cron0
  core.seevice.cron.cron1
  +core.service.http.request.10040
 */


Must check .label or .name in static/src/**/*.xml

Notes: assign context
const ctx = Object.assign(this.env.context ?? {});
=>
const ctx = Object.assign({}, this.env.context ?? {});

report template (xmlId): <reportTemplateName>
reportName (refId): <package_name>.<reportTemplateName>
reportModel: => report.<reportName> => report.<package.name>.<report.template.name>


***
Because we use Proxy:
'this' in get property() if difference with 'this' in function
- 'this' in get property() => prototype
- 'this' in function => instance

class A:

static __testPro_class = 'IrFactory';
get __testPro_class() {
  return this.constructor['__testPro_class'];
  // OK bc found '__testPro_class2' in 'IrFactory' => return 'IrFactory' 

  return this.cls?.__testPro_class; 
  // 'cls' (=undefined) is not available right now because the property 'cls' call by prototype (by _super), not by instance 'this' (Proxy);
}

class B extends A:
static __testPro_class = 'Overide IrFactory';

_testPro() {
  const headline = `***** _testPro: ${this._name} *****`; 
  console.log(headline);
  console.log(`* __testPro_class = ${this.cls.__testPro_class}`); // is Ok if class has the prop; undefined if not
  console.log(`* __testPro_class = ${this.constructor['__testPro_class']}`); // the same above
  console.log(`* __testPro_class = ${this.__testPro_class}`); // OK
  console.log('*'.repeat(headline.length));
}

static __testPro_class = 'IrFactory';
get __testPro_class() {
  return this.constructor['__testPro_class'];
}
__testPro_class2() {
  return this.cls['__testPro_class'];
}

_testPro() {
  console.log(`**** ${this._name}.__testPro_class = "${this.__testPro_class}"`); // Chi lay duy nhat 'IrFactory'
  console.log(`**** ${this._name}.__testPro_class = "${this.__testPro_class2()}"`); // Neu co class pro thi OK, khong thi undefined
  console.log(`**** ${this._name}.__testPro_class = ${this.constructor['__testPro_class']}`); // Neu co class pro thi OK, khong thi undefined
}

=> Solution:
1) get prop() { return <<CONSTANT>> } // prefer
or
2) static __prop_class = 'IrMode'; 
  get __prop() {
    return this.constructor['__prop_class'];
  }

**
Gap Error: MissingError: UserId#2 acceses a record does not exist or has been deleted when get value of res.users(2).partnerId.
Can check ham truy xuat thuoc tinh 'partnerId' co get truoc su co nhat quan khong!


***
willStart: function () {
    const superPromise = this._super.apply(this, arguments);

    const isProjectManager = this.getSession().userHasGroup('project.groupProjectManager').then((hasGroup) => {
        this.isProjectManager = hasGroup;
        this._setState();
        return Promise.resolve();
    });

    return Promise.all([superPromise, isProjectManager]);
},