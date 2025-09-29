const str = `http://localhost:7979/web#cids=1&menuId=5&action=37&model=ir.module.module&viewType=kanban&-_.!~*'()&:;=?@`;

console.log('START')
const _encodeURI = encodeURI(str);
const _decodeURI = decodeURI(_encodeURI);
console.log(_encodeURI, _decodeURI);
// "http://localhost:7979/web#cids=1&menuId=5&action=37&model=ir.module.module&viewType=kanban&-_.!~*'()&:;=?@"
// "http://localhost:7979/web#cids=1&menuId=5&action=37&model=ir.module.module&viewType=kanban&-_.!~*'()&:;=?@" 

const _encodeURIComponent = encodeURIComponent(str);
const _decodeURIComponent = decodeURIComponent(_encodeURI);
console.log(_encodeURIComponent, _decodeURIComponent);
// "http%3A%2F%2Flocalhost%3A7979%2Fweb%23cids%3D1%26menuId%3D5%26action%3D37%26model%3Dir.module.module%26viewType%3Dkanban%26-_.!~*'()%26%3A%3B%3D%3F%40"
// "http://localhost:7979/web#cids=1&menuId=5&action=37&model=ir.module.module&viewType=kanban&-_.!~*'()&:;=?@"

const _encode = encode(str);
const _decode = decode(_encode);
console.log(_encode, _decode);
// "http%3A%2F%2Flocalhost%3A7979%2Fweb%23cids%3D1%26menuId%3D5%26action%3D37%26model%3Dir%2Emodule%2Emodule%26viewType%3Dkanban%26%2D%5F%2E%21%7E%2A%27%28%29%26%3A%3B%3D%3F%40"
// "http://localhost:7979/web#cids=1&menuId=5&action=37&model=ir.module.module&viewType=kanban&-_.!~*'()&:;=?@" 

const arr = Array(256)
    .fill(0)
    .map((_, i) => String.fromCharCode(i))
    .filter((c) => encodeURI(c) != encodeURIComponent(c));

arr.forEach((c) => console.log(c, encodeURI(c), encodeURIComponent(c)));
/*
"#",  "#",  "%23" 
"$",  "$",  "%24" 
"&",  "&",  "%26" 
"+",  "+",  "%2B" 
",",  ",",  "%2C" 
"/",  "/",  "%2F" 
":",  ":",  "%3A" 
";",  ";",  "%3B" 
"=",  "=",  "%3D" 
"?",  "?",  "%3F" 
"@",  "@",  "%40" 
*/

function encode(str: string) {
    return encodeURIComponent(str)
        .replace(/\-/g, '%2D')
        .replace(/\_/g, '%5F')
        .replace(/\./g, '%2E')
        .replace(/\!/g, '%21')
        .replace(/\~/g, '%7E')
        .replace(/\*/g, '%2A')
        .replace(/\'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29');
}

function decode(str: string) {
    return decodeURIComponent(
        str
            .replace(/\\%2D/g, '-')
            .replace(/\\%5F/g, '_')
            .replace(/\\%2E/g, '.')
            .replace(/\\%21/g, '!')
            .replace(/\\%7E/g, '~')
            .replace(/\\%2A/g, '*')
            .replace(/\\%27/g, "'")
            .replace(/\\%28/g, '(')
            .replace(/\\%29/g, ')')
    );
}

export {}