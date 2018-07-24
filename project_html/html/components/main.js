import React from "react"
import { Route, Switch, Redirect } from 'react-router-dom'
import Loadable from 'react-loadable';
import { request } from "../utils/utils"
import Home from "./Home"
import BigData from './BigData'
import InfoCenter from './InfoCenter'
import Honey from './Honey';
import Headline from "./Headline"   //顶部和左侧导航栏
import DMapModal from "./home/DMapModal.js"; //3D地图
import ES6Promise from 'es6-promise'
ES6Promise.polyfill() //关键代码,让ie识别promise对象!

/** 根模块 */
export default class Main extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loggedin: false,
            username: "",
            // nav: props.location.pathname,
        }
    }

    /**
     * 获取当前登录用户信息
     * 并将用户名显示在顶部当航栏上
     */
    setLogInfo() {
        var url = "/api/logstatus/";
        var self = this;
        var navigation = function (json) {
            if (json.code == 200) {
                self.setState({
                    loggedin: true,
                    username: json.result.username,
                    // nav: props.location.pathname
                });
            } else {
                self.setState({
                    loggedin: false,
                    username: "",
                    // nav: props.location.pathname
                });
                /*delete homepage sessionStorage and cookie*/
                if (sessionStorage && sessionStorage.getItem("loadCount")) {
                    sessionStorage.removeItem("loadCount");
                }
                if (self.getCookie("loadCount") != "") {
                    self.deleteCookie("loadCount");
                }
                self.props.history.push('/login', null)
            }
        }
        request(url, {}, navigation);
    }

    getCookie(name) {
        var strCookie = document.cookie;
        var arrCookie = strCookie.split("; ");
        for (var i = 0; i < arrCookie.length; i++) {
            var arr = arrCookie[i].split("=");
            if (arr[0] == name) {
                return arr[1];
            }
        }
        return "";
    }
    deleteCookie(name) {
        var date = new Date();
        date.setTime(date.getTime() - 10000);
        document.cookie = name + "=v; expires=" + date.toGMTString();
    }

    //登录超时时使用别的账户登录后的操作
    changeAccount() {
        this.setLogInfo()   //重新获取并显示登录信息
    }

    /**
     * 组件将要加载时的操作
     */
    componentWillMount() {
        this.setLogInfo()   //获取并显示登录用户的信息
    }

    /**
     * 组件加载完成时的操作
     */
    componentDidMount() {
    }


    render() {
        const Loading = () => (<div>Loading</div>)

        return (
            <div id="fuzhou">
                <Headline
                    // history={this.props.history}
                    username={this.state.username}
                    changeAccount={() => this.changeAccount()} />

                {/* 此处使用import()和 React Loadable 插件 实现动态加载模块。
                可参考 React Router v4 文档： https://reacttraining.com/react-router/web/guides/code-splitting
                以及 Webpack 文档： https://webpack.js.org/guides/code-splitting/
                 */}
                <Switch>
                    <Route exact path="/home" component={Home} />
                    <Route exact path="/environment"
                        component={Loadable({
                            loader: () => import(/* webpackChunkName: "Environment" */ './Environment'),
                            loading: Loading
                        })}
                    />
                    <Route exact path="/plugin"
                        component={Loadable({
                            loader: () => import(/* webpackChunkName: "Plugin" */ './Plugin'),
                            loading: Loading
                        })}
                    />
                    {/*        <Route exact path="/database"
                        component={Loadable({
                            loader: () => import( './Database'),
                            loading:Loading                            
                        })}
                    />
                    */}
                    <Route exact path="/systemCheck"
                        component={Loadable({
                            loader: () => import(/* webpackChunkName: "Plugin" */ './SystemCheck.js'),
                            loading: Loading
                        })}
                    />



                    <Route exact path="/wafWall"
                        component={Loadable({
                            loader: () => import(/* webpackChunkName: "WafWall" */ './WafWall'),
                            loading: Loading
                        })}
                    />
                    {/*      <Route exact path="/databaseAudit"
                        component={Loadable({
                            loader: () => import( './DatabaseAudit'),
                            loading:Loading                            
                        })}
                    />   */}
                    <Route exact path="/mapAttack"
                        component={Loadable({
                            loader: () => import(/* webpackChunkName: "MapAttack" */ './MapAttack'),
                            loading: Loading
                        })}
                    />
                    <Route exact path="/blockchain"
                        component={Loadable({
                            loader: () => import(/* webpackChunkName: "Blockchain" */ './Blockchain'),
                            loading: Loading
                        })}
                    />
                    <Route exact path="/bigData" component={BigData} />
                    <Route exact path="/infoCenter" component={InfoCenter} />
                    <Route exact path="/blockchain/tamper"
                        component={Loadable({
                            loader: () => import(/* webpackChunkName: "Tamper" */ './Tamper'),
                            loading: Loading
                        })}
                    />
                    <Route exact path="/blockchain/svnBlockChain"
                        component={Loadable({
                            loader: () => import(/* webpackChunkName: "SVNBlockChain" */ './SVNBlockChain'),
                            loading: Loading
                        })}
                    />
                    <Route exact path="/targetRange"
                        component={Loadable({
                            loader: () => import(/* webpackChunkName: "TargetRange" */ './TargetRange'),
                            loading: Loading
                        })}
                    />
                    <Route exact path="/honey" component={Honey} />

                    <Route exact path="/3DMap"
                        component={Loadable({
                            loader: () => import(/* webpackChunkName: "DMap" */ './home/DMap.js'),
                            loading: Loading

                        })}
                    />
                    <Route exact path="/settings"
                        component={Loadable({
                            loader: () => import(/* webpackChunkName: "Settings" */ './Settings.js'),
                            loading: Loading
                        })}
                    />
                    <Route exact path="/alarm"
                        component={Loadable({
                            loader: () => import(/* webpackChunkName: "Settings" */ './Alarm.js'),
                            loading: Loading
                        })}
                    />
                    <Redirect to="/home" /> {/*当以上Route均不匹配时，重定向到 home */}
                </Switch>
                {/*  <DMapModal /> 3D地图 ---start*/}
               
                {/* 3D地图 ---end*/}
            </div>
        )
    }
}