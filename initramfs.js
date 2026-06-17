var fs = require('fs');
var files = fs.readdirSync('initramfs', {recursive: true, withFileTypes: true}).filter(e => e.isFile()).map(e => e.name);
var rfs = {};
function Uint8Str(uint8) {
    return Array.from(uint8).map(e => e.toString(16)).join(';');
}
for(var i = 0; i < files.length; i++) {
    rfs[files[i]] = Uint8Str(new Uint8Array(fs.readFileSync('initramfs/' + files[i])));
}
fs.writeFileSync('temp/ramfs.js', 'export var ramfs = ' + JSON.stringify(rfs));