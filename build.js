import { spawnSync } from 'child_process';
import { join } from 'path';
import { copyFileSync, unlinkSync, readdirSync, readFileSync } from 'fs';

var skuRoot = join(import.meta.dirname, 'skus');

function build(sku) {
    console.log('Building Amethyst ' + sku)
    var skuPath = join(skuRoot, sku + '.json');
    var buildPath = join(import.meta.dirname, 'dist');
    copyFileSync(skuPath, join(import.meta.dirname, 'sku.json'));
    spawnSync('npx webpack', {
        shell: true
    });
    var manifest = JSON.parse(readFileSync(skuPath, 'utf8'));
    copyFileSync(join(buildPath, 'amethyst.js'), join(buildPath, 'amethyst.' + manifest.name + '.js'));
    unlinkSync(join(buildPath, 'amethyst.js'));
}

var skus = readdirSync(skuRoot);
for(var i = 0; i < skus.length; i++) {
    build(skus[i].slice(0, -5));
}