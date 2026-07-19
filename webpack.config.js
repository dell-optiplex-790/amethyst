const webpack = require('webpack');
const fs = require('fs');

module.exports={entry:'./temp/index.js',mode:'production',target:['web','es2016'],resolve:{extensions:['.js'],fallback:{url:false}},output:{filename:'amethyst.js'},optimization:{concatenateModules:true,mangleExports:'size',minimizer:[
    new (require('terser-webpack-plugin'))({
        terserOptions: {
            module: false,
            mangle: {
                toplevel: true,
                properties: false,
                eval: true
            },
            compress: {
                toplevel: true,
                dead_code: true,
                unused: true,
                evaluate: true,
                unsafe: true
            }
        }
    })
]}, plugins: [
    new webpack.DefinePlugin({
        cfg: JSON.stringify({
            ...JSON.parse(fs.readFileSync('config.json', 'utf8')),
            os_build: parseInt(fs.readFileSync('.osbuild', 'utf8'))
        }),
        sku: JSON.stringify(JSON.parse(fs.readFileSync('sku.json')))
    })
]};