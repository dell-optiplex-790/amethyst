const webpack = require('webpack');
const fs = require('fs');
const MinimizerPlugin = require("terser-webpack-plugin");

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
        cfg: JSON.stringify({
            ...JSON.parse(fs.readFileSync('config.json', 'utf8')),
            os_build: parseInt(fs.readFileSync('.osbuild', 'utf8'))
        }),
        sku: JSON.stringify(JSON.parse(fs.readFileSync('sku.json')))
    })
],
optimization: {
    minimize: true,
    minimizer: [new MinimizerPlugin({
        minimizerOptions: {
            parse: {},
            compress: {
                dead_code: true,
                unused: true,
                evaluate: true,
                unsafe: true
            },
            mangle: {
                eval: true
            },
            module: false,
          },
    })],
  }};