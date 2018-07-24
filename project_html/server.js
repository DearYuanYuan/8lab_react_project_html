var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.local.config');
var path = require("path");
var fs = require('fs');

//自动修改 share.json中的server.ip，以便开发
(function () {
  var pathname = "./app_fuzhou/config/share.json"; //取得share.json的路径
  var strOld = fs.readFileSync(pathname).toString(); //strOld为每次拉取后的内容,

  var strNew = strOld.replace(/139.196.253.89/g, "127.0.0.1") //将server.ip设置为127.0.0.1
  if (strNew === strOld) {
    return;
  }
  fs.writeFileSync(pathname, strNew);
  console.log("server.ip changed 127.0.0.1")
}());

// 注意：webpack配置中的devSever配置项只对在命令行模式有效。
// 关于 HMR 和 react-hot-loader 的问题可查看： https://github.com/gaearon/react-hot-loader/blob/master/docs/Troubleshooting.md
new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,  //enable HMR on the server
  headers:{'Access-Control-Allow-Origin':'*'},
  inline: true,             //inline模式下我们访问的URL不用发生变化,启用这种模式分两种情况:
  historyApiFallback: true, //由于webpack-dev-server的配置中无inline选项,
                            //我们需要添加webpack-dev-server/client?http://«path»:«port»/到webpack配置的entry入口点中.
}).listen(3000, 'localhost', function (err, result) {
  if (err) {
    console.log(err);
  }
  console.log('Listening at localhost:3000');
});