var path = require("path");
var webpack = require('webpack');
var BundleTracker = require('webpack-bundle-tracker');
var ip = 'localhost';
var config = require('./webpack.base.config.js');
config.devtool = "source-map";
config.entry.app = [
        'webpack-dev-server/client?http://' + ip + ':3000',
        'webpack/hot/only-dev-server',  //dev-server reloads when applying HMR fails, only-dev-server doesn't.
        'react-hot-loader/patch',
        './html/app',
];
config.output.publicPath = 'http://' + ip + ':3000' + '/assets/bundles/';
config.plugins = config.plugins.concat([
    new webpack.NamedModulesPlugin(),   //当开启 HMR 的时候使用该插件会显示模块的相对路径
    new webpack.HotModuleReplacementPlugin(),   //开启模块热替换（HMR）
    new webpack.NoEmitOnErrorsPlugin(),
    new BundleTracker({filename: './webpack-stats-local.json'}),
    // new webpack.DefinePlugin({
    //     'process.env': {
    //         'NODE_ENV': JSON.stringify('development'),
    //         'BASE_API_URL': JSON.stringify('https://'+ ip +':8000/api/v1/'),
    //     }}),
]);
module.exports = config;