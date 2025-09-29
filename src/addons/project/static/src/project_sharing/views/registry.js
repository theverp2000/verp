/** @verp-module **/

import ViewRegistry from 'web.viewRegistry';

import FormView from './form/view';
import ListView from './list/view';

ViewRegistry
    .add('form', FormView)
    .add('list', ListView);
