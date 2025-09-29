function func(context, extra) {
   // Template name: "slot_default_template"
   let utils = this.constructor.utils;
   let parent = extra.parent;
   let scope = Object.create(context);
   let h = this.h;
   let c352 = extra.parentNode;
   scope.isCompanySelected = scope['selectedCompanies'].includes(scope['company'].id);
   scope.isCurrent = scope['company'].id === scope['companyService'].currentCompany.id;
   let _354 = { 'd-flex': true };
   let _355 = 'company';
   let _356 = scope['company'].id;
   let c357 = [], p357 = { key: 357, attrs: { "data-menu": _355, "data-company-id": _356 }, class: _354 };
   let vn357 = h('div', p357, c357);
   c352.push(vn357);
   let _358 = 'menuitemcheckbox';
   let _359 = scope.isCompanySelected;
   let _360 = scope['company'].label;
   let _361 = (scope.isCompanySelected ? 'Hide ' : 'Show ') + scope['company'].label + ' content.';
   let _362 = '0';
   let _363 = 'border-right toggle-company o-py ' + (scope.isCurrent ? 'border-primary' : '');
   let c364 = [], p364 = { key: 364, attrs: { role: _358, "aria-checked": _359, "aria-label": _360, title: _361, tabindex: _362, class: _363 }, on: {} };
   let vn364 = h('div', p364, c364);
   c357.push(vn364);
   let args365 = [scope['company'].id];
   p364.on['click'] = function (e) { if (context.__owl__.status === 5) { return } e.stopPropagation(); utils.getComponent(context)['toggleCompany'](...args365, e); };
   let _367 = { 'btn': true, 'btn-light': true, 'border-0': true, 'p-2': true };
   let c368 = [], p368 = { key: 368, class: _367 };
   let vn368 = h('span', p368, c368);
   c364.push(vn368);
   let _370 = { 'fa': true, 'fa-fw': true, 'py-2': true };
   Object.assign(_370, utils.toClassObj(scope.isCompanySelected ? 'fa-check-square text-primary' : 'fa-square-o'))
   let c371 = [], p371 = { key: 371, class: _370 };
   let vn371 = h('i', p371, c371);
   c368.push(vn371);
   let _372 = 'button';
   let _373 = scope.isCurrent;
   let _374 = 'Switch to ' + scope['company'].label;
   let _375 = 'Switch to ' + scope['company'].label;
   let _376 = '0';
   let _378 = { 'd-flex': true, 'flex-grow-1': true, 'align-items-center': true, 'py-0': true, 'log-into': true, 'pl-2': true, 'o-py': true };
   Object.assign(_378, utils.toClassObj(scope.isCurrent ? 'alert-primary ml-1 mr-2' : 'btn btn-light font-weight-normal border-0'))
   let c379 = [], p379 = { key: 379, attrs: { role: _372, "aria-pressed": _373, "aria-label": _374, title: _375, tabindex: _376 }, class: _378, on: {} };
   let vn379 = h('div', p379, c379);
   c357.push(vn379);
   let args380 = [scope['company'].id];
   p379.on['click'] = function (e) { if (context.__owl__.status === 5) { return } utils.getComponent(context)['logIntoCompany'](...args380, e); };
   let _382 = { 'company-label': true, 'pr-3': true };
   Object.assign(_382, utils.toClassObj(scope.isCurrent ? 'text-900 font-weight-bold' : 'ml-1'))
   let c383 = [], p383 = { key: 383, class: _382 };
   let vn383 = h('span', p383, c383);
   c379.push(vn383);
   let _384 = scope['company'].label;
   if (_384 != null) {
      c383.push({ text: _384 });
   }
}