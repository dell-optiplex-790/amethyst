var fs = require('fs');
if(!fs.existsSync('config.json')) {
    fs.copyFileSync('defaults.json', 'config.json');
}
var files = fs.readdirSync('initramfs', {recursive: true, withFileTypes: true}).filter(e => e.isFile()).map(e => e.name);
var rfs = {};
function Uint8Str(uint8) {
    return Array.from(uint8).map(e => e.toString(16)).join(';');
}
for(var i = 0; i < files.length; i++) {
    rfs[files[i]] = Uint8Str(new Uint8Array(fs.readFileSync('initramfs/' + files[i])));
}
fs.writeFileSync('temp/ramfs.js', 'export var ramfs = ' + JSON.stringify(rfs));
fs.writeFileSync('.osbuild', (parseInt(fs.readFileSync('.osbuild', 'utf8')) + 1).toString(), 'utf8');