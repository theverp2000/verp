
const str = `<form>
                <div class="row container">
                    <div class="col-12 text-center">
                      <div class="card text-white bg-danger mb-3 w-75 ml64">
                        <div class="card-header">
                                <span class="fa fa-2x fa-warning" t-translation="off">&amp;nbsp;</span>
                                <span class="text-white text-uppercase">Danger Zone</span>
                        </div>
                        <div class="card-body bg-transparent text-center">
                          <p>Demo data should only be used on test databases!
                            Once they are loaded, they cannot be removed!</p>
                          <p>Please confirm that you want to <b>irreversibly</b> make this database a demo database.</p>
                        </div>
                      </div>
                    </div>
                </div>

                <footer>
                    <button special="cancel" data-hotkey="z" string="Oops, no!" class="btn-primary"/>
                    <button name="install_demo" string="Yes, I understand the risks" type="object" class="btn-secondary" data-hotkey="q"/>
                </footer>
              </form>`;

const str2 = `<form string="Server Action">
                  <header>
                      <field name="bindingModelId" invisible="1"/>
                      <button name="create_action" string="Create Contextual Action" type="object" class="btn-primary" attrs="{'invisible':[('bindingModelId','!=',false)]}" help="Display an option in the 'More' top-menu in order to run this action."/>
                      <button name="unlink_action" string="Remove Contextual Action" type="object" attrs="{'invisible':[('bindingModelId','=',false)]}" help="Remove 'More' top-menu contextual action related to this action"/>
                      <button name="run" string="Run" type="object" class="btn-primary" attrs="{'invisible':['|', ('modelId', '!=', %(base.model_ir_actions_server)s), ('state', '!=', 'code')]}" help="Run this action manually."/>
                  </header>
                  <sheet>
                      <div class="oe-title">
                          <label for="name"/>
                          <h1><field name="label" placeholder="e.g. Update order quantity"/></h1>
                      </div>
                      <group name="action_wrapper">
                          <group name="action_content">
                              <field name="modelId" options="{'noCreate': true}"/>
                              <field name="modelName" invisible="1"/>
                          </group>
                          <group>
                              <field name="state"/>
                              <field name="type" invisible="1"/>
                              <field name="crudModelId" options="{'noCreate': true}" attrs="{'invisible': [('state', '!=', 'object_create')], 'required': [('state', '=', 'object_create')]}"/>
                              <field name="crud_model_name" invisible="1"/>
                              <field name="link_field_id" domain="[('modelId', '=', modelId), ('relation', '=', crud_model_name),                                     ('ttype', 'in', ['many2one', 'one2many', 'many2many'])]" options="{'noCreate': true}" attrs="{'invisible': [('state', '!=', 'object_create')]}" context="{'defaultModelId': modelId, 'defaultRelation': crud_model_name}"/>
                          </group>
                      </group>
                      <notebook>
                          <page string="Javascript Code" name="code" autofocus="autofocus" attrs="{'invisible': [('state', '!=', 'code')]}">
                              <field name="code" widget="ace" options="{'mode': 'javascript'}" placeholder="Enter Javascript code here. Help about Javascript expression is available in the help tab of this document."/>
                          </page>

                          <page string="Data to Write" name="page_object" autofocus="autofocus" attrs="{'invisible':[('state', 'not in', ['object_create', 'object_write'])]}">
                              <p attrs="{'invisible': [('modelId', '!=', false)]}">
                                  Please set the Model to Create before choosing values
                              </p>
                              <field name="fields_lines">
                                  <tree string="Field Mappings" editable="bottom">
                                      <field name="col1" options="{'noCreate': true}" domain="['|', ('modelId', '=', parent.crudModelId), ('modelId', '=', parent.modelId)]"/>
                                      <field name="evaluation_type"/>
                                      <field name="resourceRef" options="{'hideModel': true, 'noCreate': true}" attrs="{'readonly': [('evaluation_type', '!=', 'reference')]}"/>
                                      <field name="value" attrs="{'readonly': [('evaluation_type', '=', 'reference')]}" options="{'noCreate': %(user.partnerId)s)}" forceSave="1"/>
                                  </tree>
                              </field>
                          </page>

                          <page name="security" string="Security">
                              <field name="groupsId"/>
                          </page>

                          <page string="Actions" name="actions" autofocus="autofocus" attrs="{'invisible': [('state', '!=', 'multi')]}">
                              <p class="oe_grey">
                                  If several child actions return an action, only the last one will be executed.
                                  This may happen when having server actions executing code that returns an action, or server actions returning a client action.
                              </p>
                              <field name="child_ids" domain="[('modelId', '=', modelId)]"/>
                          </page>

                          <page string="Help" name="help_info" autofocus="autofocus" attrs="{'invisible': [('state', '!=', 'code')]}">
                              <div style="margin-top: 4px;">
                                  <h3>Help with Javascript expressions</h3>
                                  <p>Various fields may use Javascript code or Javascript expressions. The following variables can be used:</p>
                                  <ul>
                                      <li><code>env</code>: Verp Environment on which the action is triggered</li>
                                      <li><code>model</code>: Verp Model of the record on which the action is triggered; is a void recordset</li>
                                      <li><code>record</code>: record on which the action is triggered; may be be void</li>
                                      <li><code>records</code>: recordset of all records on which the action is triggered in multi mode; may be void</li>
                                      <li><code>time</code>, <code>datetime</code>, <code>dateutil</code>, <code>timeZone</code>: useful Javascript libraries</li>
                                      <li><code>log(message, level='info')</code>:logging function to record debug information in <code>ir.logging</code> table</li>
                                      <li><code>UserError</code>: Warning Exception to use with <code>raise</code></li>
                                      <li>To return an action, assign: <code>action = {...}</code></li>
                                  </ul>
                                  <div attrs="{'invisible': [('state', '!=', 'code')]}">
                                      <p>Example of Javascript code</p>
                <code style="white-space: pre-wrap">
                partner_name = record.name + '_code' \

                env['res.partner'].create({'name': partner_name})
                </code>
                                  </div>
                              </div>
                          </page>
                      </notebook>
                  </sheet>
                </form>`;

const regex = new RegExp('([^\\047"\\140\\/\\000-\\040]+)|((?:(?:\\047[^\\047\\\\\\r\\n]*(?:\\\\(?:[^\\r\\n]|\\r?\\n|\\r)[^\\047\\\\\\r\\n]*)*\\047)|(?:"[^"\\\\\\r\\n]*(?:\\\\(?:[^\\r\\n]|\\r?\\n|\\r)[^"\\\\\\r\\n]*)*")|(?:\\140[^\\140\\\\]*(?:\\\\(?:[^\\r\\n]|\\r?\\n|\\r)[^\\140\\\\]*)*\\140))[^\\047"\\140\\/\\000-\\040]*)|(?<=[(,=:\\[!&|?{};\\r\\n+*-])(?:[\\000-\\011\\013\\014\\016-\\040]|(?:\\/\\*[^*]*\\*+(?:[^\\/*][^*]*\\*+)*\\/))*(?:(?:(?:\\/\\/[^\\r\\n]*)?[\\r\\n])(?:[\\000-\\011\\013\\014\\016-\\040]|(?:\\/\\*[^*]*\\*+(?:[^\\/*][^*]*\\*+)*\\/))*)*((?:\\/(?![\\r\\n\\/*])[^\\/\\\\\\[\\r\\n]*(?:(?:\\\\[^\\r\\n]|(?:\\[[^\\\\\\]\\r\\n]*(?:\\\\[^\\r\\n][^\\\\\\]\\r\\n]*)*\\]))[^\\/\\\\\\[\\r\\n]*)*\\/))((?:[\\000-\\011\\013\\014\\016-\\040]|(?:\\/\\*[^*]*\\*+(?:[^\\/*][^*]*\\*+)*\\/))*(?:(?:(?:\\/\\/[^\\r\\n]*)?[\\r\\n])(?:[\\000-\\011\\013\\014\\016-\\040]|(?:\\/\\*[^*]*\\*+(?:[^\\/*][^*]*\\*+)*\\/))*)+(?=[^\\000-\\040&)+,.:;=?\\]|}-]))?|(?<=[\\000-#%-,.\\/:-@\\[-^\\140{-~-]return)(?:[\\000-\\011\\013\\014\\016-\\040]|(?:\\/\\*[^*]*\\*+(?:[^\\/*][^*]*\\*+)*\\/))*(?:((?:(?:\\/\\/[^\\r\\n]*)?[\\r\\n]))(?:[\\000-\\011\\013\\014\\016-\\040]|(?:\\/\\*[^*]*\\*+(?:[^\\/*][^*]*\\*+)*\\/))*)*((?:\\/(?![\\r\\n\\/*])[^\\/\\\\\\[\\r\\n]*(?:(?:\\\\[^\\r\\n]|(?:\\[[^\\\\\\]\\r\\n]*(?:\\\\[^\\r\\n][^\\\\\\]\\r\\n]*)*\\]))[^\\/\\\\\\[\\r\\n]*)*\\/))((?:[\\000-\\011\\013\\014\\016-\\040]|(?:\\/\\*[^*]*\\*+(?:[^\\/*][^*]*\\*+)*\\/))*(?:(?:(?:\\/\\/[^\\r\\n]*)?[\\r\\n])(?:[\\000-\\011\\013\\014\\016-\\040]|(?:\\/\\*[^*]*\\*+(?:[^\\/*][^*]*\\*+)*\\/))*)+(?=[^\\000-\\040&)+,.:;=?\\]|}-]))?|(?<=[^\\000-!#%&(*,.\\/:-@\\[\\\\^{|~])(?:[\\000-\\011\\013\\014\\016-\\040]|(?:\\/\\*[^*]*\\*+(?:[^\\/*][^*]*\\*+)*\\/))*(?:((?:(?:\\/\\/[^\\r\\n]*)?[\\r\\n]))(?:[\\000-\\011\\013\\014\\016-\\040]|(?:\\/\\*[^*]*\\*+(?:[^\\/*][^*]*\\*+)*\\/))*)+(?=[^\\000-\\040"#%-\\047)*,.\\/:-@\\\\-^\\140|-~])|(?<=[^\\000-#%-,.\\/:-@\\[-^\\140{-~-])((?:[\\000-\\011\\013\\014\\016-\\040]|(?:\\/\\*[^*]*\\*+(?:[^\\/*][^*]*\\*+)*\\/)))+(?=[^\\000-#%-,.\\/:-@\\[-^\\140{-~-])|(?<=\\+)((?:[\\000-\\011\\013\\014\\016-\\040]|(?:\\/\\*[^*]*\\*+(?:[^\\/*][^*]*\\*+)*\\/)))+(?=\\+)|(?<=-)((?:[\\000-\\011\\013\\014\\016-\\040]|(?:\\/\\*[^*]*\\*+(?:[^\\/*][^*]*\\*+)*\\/)))+(?=-)|(?:[\\000-\\011\\013\\014\\016-\\040]|(?:\\/\\*[^*]*\\*+(?:[^\\/*][^*]*\\*+)*\\/))+|(?:(?:(?:\\/\\/[^\\r\\n]*)?[\\r\\n])(?:[\\000-\\011\\013\\014\\016-\\040]|(?:\\/\\*[^*]*\\*+(?:[^\\/*][^*]*\\*+)*\\/))*)+', 'gm');


function test() {
    const reg = new RegExp(/[^%]%\((.*?)\)[ds]/, 'g');
    let m;// matches = reg.exec(str2);

    /* case 1
    if (matches !== null) {
        // The result can be accessed through the `m`-variable.
        matches.forEach((match, groupIndex) => {
            console.log(`Found match, group ${groupIndex}: ${match}`);
        });
    }
    */
    /* case 2 */
    while ((m = reg.exec(str2)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === reg.lastIndex) {
            reg.lastIndex++;
        }
        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            console.log(`Found match, groupIndex ${groupIndex}: ${match}`);
        });
    }
  //m = <re.Match object; span=(749, 782), match=' %(base.model_ir_actions_server)s'>
  //m.group() = ' %(base.model_ir_actions_server)s'
  console.log('STOP');
}

function test2() {
    const string = 'This is a STRING of WORDS to search';
    const regexp = /\b[A-Z]+\b/g;///[^%]%\((.*?)\)[ds]/g;///(?:^|\s)format_(.*?)(?:\s|$)/g;
    const matches = string.matchAll(regexp);
        
    for (const m of matches) {
        // const found = m[0];
        console.debug(m.index, m.length);
        for (let i=0; i < m.length; i++) {
            console.log(m[i]);
        }
    }
    console.log('STOP');
}

function *findKeys(str, regex) {
    let m;
    while ((m = regex.exec(str)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        yield m[0];
    }
}

function test3() {
    const regex = new RegExp(/\b[A-Z]+\b/g);
    const str = `This is a STRING of WORDS to search`;
    let m;
    while ((m = regex.exec(str)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            console.log(`Found match, group ${groupIndex}: ${match}`);
        });
    }
}

function test4() {
    const regex = new RegExp(/(\w+)(?::(\w+)(?:\((\w+)\))?)?/g);
    const str = ``;//   name:func(fname)`;

    const match: any = str.match(regex);
    console.log('match:', match); // ['name:func(fname)']
    for (const m of match ?? []) {
        console.log(m); // name:func(fname)
    }

    const matchs = str.matchAll(regex);
    const matchAll = matchs.next().value;
    console.log('matchAll:', matchAll, matchAll?.index, matchAll?.input, matchAll?.groups); 
    // ['name:func(fname)', 'name', 'func'], 'fname', index: 0, input: 'name:func(fname)', groups: undefined
    for (const m of matchAll) {
        console.log(m); // 'name:func(fname)', 'name', 'func', 'fname'
    }
}

function testGroup() {
    const str = '   jon@geekforgeeks.org;admin@geekforgeeks.org'
    let i;
    try {
        i = parseInt('A')
    } catch(e) {
        console.log(e.message)
    }
    const reg = /(?<Username>\w+)@(?<Website>\w+)\.(?<Domain>\w+)/
    // const reg = new RegExp('(?<Username>\\w+)@(?<Website>\\w+)\.(?<Domain>\\w+)') // => Look "\\"
    
    // const result = reg.exec(str) as any;// w or wo flag "g" just only one result or null
    // # String.match() => only one result or null; without flags: "g"
    const reg1 = /(\w+)@(\w+)\.(\w+)/
    const result1 = str.match(reg1); // => Iterator #[] => must call .next() to check; with flags: "g"
    console.log(result1);

    // const result = str.matchAll(reg) as any; // => Iterator #[] => must call .next() to check; with flags: "g"
    // let res
    // while ((res = result.next().value) != null) { // pa1
    // for (const res of result) { // pa2
    //     const list = res.groups;
    //     const { groups: { Username, Website, Domain } } = res;
    //     console.log(res) // ["jon@geekforgeeks.org", "jon", "geekforgeeks", "org"] 
    //     console.log(res[0]) // "jon@geekforgeeks.org"
    //     console.log(Username, Website, Domain) // "jon",  "geekforgeeks",  "org" 
    // }
}

function test5() {
    const regex = /\/?(?<module>\S+)\/([\S/]*\/)?static\/(?<type>src|tests|lib)(?<url>\/[\S/]*)/g;

    // Alternative syntax using RegExp constructor
    // const regex = new RegExp('\\/?(?<module>\\S+)\\/([\\S/]*\\/)?static\\/(?<type>src|tests|lib)(?<url>\\/[\\S/]*)', 'mg')

    const str = [
        `/web/statica/src/legacy/js/core/menu.js`,
        `/web/statica/src/session.js`
    ];
    let m;

    

    for (const s of str) {
        const matches = s.matchAll(regex) as any;
        let found;
        for (const match of matches) {
            console.log(match);
            found = true;
        }
    }
}

test5();

export {}