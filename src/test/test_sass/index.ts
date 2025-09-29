
import libsass from 'node-sass';
import path from 'path';

const source = `
// $myfont: Georgia 1.1em;
// $table_head_col: #ccc;
// $table_row_col: #eee;
// $table_bor_col: #eee;
// $container_width: 700px;
// $first_col_width: 150px;

// @import 'index.scss';

div.container {
    margin: auto; 
    font: $myfont;
    width: $container_width;
}

// table {

//     tr:nth-child(odd) {background: $table_row_col}

//     td:first-child {width: $first_col_width}
  
//     th {
//         background-color: $table_head_col;
//     }

//     border: 1px solid $table_bor_col;
// }
`
const result = libsass.renderSync({
  // file: __dirname + path.sep + 'source.scss',
  data: source,
  includePaths: [
    __dirname + path.sep + 'includes' + path.sep
  ],
  error: function(err) {
    console.log(this.includePaths)
    // throw err;
  }
});

const compiled = result.css.toString();
console.log(compiled);