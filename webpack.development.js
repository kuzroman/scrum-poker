const merge = require('webpack-merge');
const path = require('path');
const baseConfig = require('./webpack.common');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const ip = require("ip");

const mergeUnique = merge({
    customizeArray: merge.unique(
        'plugins',
        ['HtmlWebpackPlugin'],
        plugin => plugin.constructor && plugin.constructor.name
    )
});

const devConfig = {
    mode: 'development',
    devtool: 'source-map',
    devServer: {
        host: '0.0.0.0',
        port: 9001,
        publicPath: '/'
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'src/index.html'),
            chunks: ['main']
        }),
        new webpack.DefinePlugin({
            IP: JSON.stringify(ip.address()),
        })
    ],
};

module.exports = mergeUnique(devConfig, baseConfig);