const webpack = require('webpack');
const fs = require('fs');

module.exports={entry:'./temp/index.js',mode:'production',target:['web','es2016'],resolve:{extensions:['.js'],fallback:{url:false}},output:{filename:'amethyst.js'},optimization:{concatenateModules:true,mangleExports:'size',minimizer:[
    new (require('terser-webpack-plugin'))({
        terserOptions: {
            module: true,
            mangle: {
                toplevel: true,
                properties: false
            },
            compress: {
                properties: {
                    regex: /^[a-zA-Z_$][a-zA-Z0-9_$]*$/
                },
                toplevel: true
            }
        }
    })
]}, plugins: [
    new webpack.DefinePlugin({
        cfg: JSON.stringify(JSON.parse(fs.readFileSync('config.json', 'utf8')))
    })
]};