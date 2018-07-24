import React from "react";    //引入react
import $ from 'jquery';         //引入jquery
import { Tabs, Tab, Pagination, ButtonToolbar, Button } from 'react-bootstrap';　  //引入bootstrap组件
import { isMounted, sqltest, currentTime, isInt, myClearInterval } from "../utils/utils.js";　　　//自定义工具函数
import LoadingText from "./Commonality/LoadingText";  //loading组件
import MessageBox from "./Commonality/MessageBox";     //消息提示组件
import DropdownList from "./Commonality/DropdownList" //下拉列表组件
//图表显示的组件
import ChartPie from "./environment/ChartPie";  //所有日志信息统计
import ChartLive from "./environment/ChartLive";  //历史实时变化折线图模块
import LiveLogs from "./environment/LiveLogs";  // 实时展示
import ChartTodayLive from "./environment/ChartTodayLive";  //今日变化曲线图
//列表显示的组件
import AllLogs from "./environment/AllLogs";  //列表显示的全部日志
//ML显示的组件
import MlTable from "./environment/MlTable"          //ML表格展示部分
import ProtectControl from './ProtectControl'
import WhiteList from "./environment/WhiteList"
import Affirm from './environment/Affirm'
/* 可信审计 */
export default class Environment extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showMsgBox: false,//不显示ajax加载提示框
            msgContent: '正在请求',//ajax请求弹框信息
            msgButtonState: false,//ajax请求弹框按钮状态
            msgButtonName: "请稍后...",//ajax请求按钮button提示内容
            isLoading: true,                    //是否正在获取消息
            loadError: false,                     //是否获取失败
            // 可信审计 图表显示和列表显示的默认值
            type: "local",           //参数type
            source: "assassin",      //参数source
            level: "INFO",          //参数level
            listPageIndex: 1,        //list的当前页
            listPageCount: 0,        //页码总数
            allLogs: null,
            // 可信审计ml的state
            mllistItem: 'pcr',             //Ml默认类型为pcr
            mlPageCount: 0,                //Ml的总页数
            mlPageIndex: 1,                 //Ml的当前页
        };
        this.isGraph = true; //是否显示图片
        this.isMl = false;//当前页面是否为ml页面
        this.page = 1;//当前页码,由于.setState为异步操作,不能实时更新页码,所以使用this.page
        this.hostTypes = [      //搜索时可选的类型
            {
                name: 'Master',         //显示在下拉列表中
                value: 'local'      //选中时传递的值
            }
        ]
        this.sourceTypes = [      //搜索时源的类型
            {
                name: 'Web backend',         //显示在下拉列表中
                value: 'app'      //选中时传递的值
            }, {
                name: 'REST API',
                value: 'api'
            }, {
                name: 'RPC consumer',
                value: 'receiverd'
            }, {
                name: 'Astute',
                value: 'astute'
            }, {
                name: 'SkyNet',
                value: 'assassin'
            }, {
                name: 'HealthCheck',
                value: 'ostf'
            }
        ]
        this.levelTypes = [      //搜索时可选的等级
            {
                name: 'DEBUG',         //显示在下拉列表中
                value: 'DEBUG'      //选中时传递的值
            }, {
                name: 'INFO',
                value: 'INFO'
            }, {
                name: 'WARNING',
                value: 'WARNING'
            }, {
                name: 'ERROR',
                value: 'ERROR'
            }, {
                name: 'CRITICAL',
                value: 'CRITICAL'
            }
        ]
        this.mlTypes = [      //搜索ml时可选的类型
            {
                name: 'PCR',         //显示在下拉列表中
                value: 'pcr'      //选中时传递的值
            }, {
                name: '模板哈希',
                value: 'templatehash'
            }, {
                name: '类型',
                value: 'tmptype'
            }, {
                name: '文件（数据）哈希',
                value: 'filedata'
            }, {
                name: '文件路径',
                value: 'filerouter'
            }
        ]
    }
    /**
     * Message消息组件相关函数
     * 组件渲染之前设置数据
     * @param {any} val 消息组件是否显示的Boole值
     *
     * @memberof HomeHeader
     */
    handleConfirmMsgBox() {
        this.setState({
            showMsgBox: false
        })
    }
    /** isGraph isMl 的boole值来确定当前的是哪个tab
     *  Tab切换
     *
     * @param {any} key  Tab组件传入的 eventKey
     *                   根据eventKey来显示对应的tab页
     * @memberof Environment
     */
    handleTabSelect(key) {
        if (key == 2) {//页面1        切换页面1的时候清除页面2和页面3的全部定时请求
            this.isGraph = true;
            this.isMl = false;
            this.initLogs();
        }
        if (key == 3) {//页面2         切换页面2的时候清除页面1和页面3的全部定时请求
            myClearInterval(this.chartPieInterval);
            myClearInterval(this.chartLiveInterval);
            myClearInterval(this.liveLogsInterval);
            myClearInterval(this.chartTodayLiveInterval);
            this.isGraph = false;
            this.isMl = false;
            this.initLogs();
        }
        if (key == 4) {//页面3        切换页面3的时候清除页面1和页面2的全部定时请求
            myClearInterval(this.chartPieInterval);
            myClearInterval(this.chartLiveInterval);
            myClearInterval(this.liveLogsInterval);
            myClearInterval(this.chartTodayLiveInterval);
            this.isGraph = false;
            this.isMl = true;
            this.getML()
            $("#mllistKey").val('');        //清空输入框的文字
        }
    }
    //Tab1图表显示 ---------------------------------------------------------start
    /**
     * 根据目标元素的value值设置参数type
     *
     * @param {any} e
     *
     * @memberof Environment
     */
    handleTypeChange(value) {
        this.setState({ type: value });
    }
    /**
     *  根据目标元素的value值设置source的值
     *
     * @param {any} e
     *
     * @memberof Environment
     */
    handleSourceChange(value) {
        this.setState({ source: value });
    }
    /**
     * 根据目标元素的value值设置参数tlevel
     *
     * @param {any} e
     *
     * @memberof Environment
     */
    handleLevelChange(value) {
        this.setState({ level: value });
    }
    /**
     * 初始化日志根据eventKey不同
     *
     * @param {any} eventKey  是当上下翻页时操作需要传入的
     *
     * @memberof Environment
     */
    initLogs(eventKey) {
        var self = this;
        this.setState({
            isLoading: true,
            loadError: false
        });
        // 如果error先检测组件是否被卸载
        function error() {
            if (isMounted(self)) {
                // 重新设置状态
                self.setState({
                    isLoading: false,
                    loadError: true,
                });
            }
        }
        //当前tab为第一页时,需要有图表显示
        if (this.isGraph && !this.isMl) {
            // 需要发送的数据
            var data = {
                flag: 0,
                type: this.state.type,
                source: this.state.source,
                level: this.state.level,
                isFirst: "true"
            }
            /* 获取全部的不同级别的日志信息,渲染饼图 */
            var ajax0 = $.ajax({
                url: '/api/loginfo/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                data: data
            })
            //请求成功
                .success(function (data) {
                    // 判断请求的date是否是空对象和检测是否存在这个组件
                    if (!$.isEmptyObject(data) && isMounted(self)) {
                        // 设置第一个图标数据
                        self.setState({ chartPie: data });
                    } else {
                        error();
                    }
                })
                .error(error);
            /* 获取一周全部的日志,渲染折线图 */
            data.flag = 1;
            var ajax1 = $.ajax({
                url: '/api/loginfo/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                data: data
            })
                .success(function (data) {
                    if (!$.isEmptyObject(data) && isMounted(self)) {
                        self.setState({ chartLive: data });
                    } else {
                        error();
                    }
                })
                .error(error);
            /* 获取最新的五条日志,显示成列表 */
            data.flag = 2;
            var ajax2 = $.ajax({
                url: '/api/loginfo/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                data: data
            })
                .success(function (data) {
                    if (!$.isEmptyObject(data) && isMounted(self)) {
                        self.setState({ liveLogs: data.logs });
                    } else {
                        error();
                    }
                })
                .error(error);
            /* 获取当天日志,显示成动态折线图 */
            data.flag = 3;
            data.isFirst = "true";
            var ajax3 = $.ajax({
                url: '/api/loginfo/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                data: data
            })
                .success(function (data) {
                    if (!$.isEmptyObject(data) && isMounted(self)) {
                        self.setState({ chartTodayLive: data });
                    } else {
                        error();
                    }
                })
                .error(error);
            // 当这些请求都完成时
            $.when(ajax0, ajax1, ajax2, ajax3).done(function (data0, data1, data2, data3) {
                if ($.isEmptyObject(data0[0]) || $.isEmptyObject(data1[0]) || $.isEmptyObject(data2[0]) || $.isEmptyObject(data3[0])) {
                    error();
                } else {
                    // 设置状态
                    setTimeout(function () {
                        self.setState({
                            isLoading: false,
                            loadError: false
                        });
                    }, 1000)
                }
            });
        }
        /* 列表显示页面 */
        // 因为InitLogs涉及到很多函数 eventKey 只有在使用到<Pagination />组件的时候才用到，所以
        //对没有传入参数的初始化
        var listPageIndex = eventKey || this.state.listPageIndex;
        if (!this.isGraph && !this.isMl) {
            /* 根据不同情况分页获取全部日志 */
            var listData = {
                flag: 4,
                type: this.state.type,
                source: this.state.source,
                level: this.state.level,
                page: listPageIndex,
                size: 20
            };
            $.ajax({
                url: '/api/loginfo/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                data: listData
            })
                .success(function (data) {
                    if (!$.isEmptyObject(data) && data.pageCount != 0 && isMounted(self)) {
                        self.setState({
                            allLogs: data.logs,
                            listPageCount: data.pageCount,
                            isLoading: false,
                            loadError: false,
                            listPageIndex: listPageIndex
                        });
                    } else {
                        error();
                    }
                })
                .error(error);
        }
    }
    /**
     * 更新第一个图时的操作
     *
     *
     * @memberof Environment
     */
    getChartPie() {
        var self = this;
        $.ajax({
            url: '/api/loginfo/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data: {
                flag: 0,
                type: self.state.type,
                source: self.state.source,
                level: self.state.level
            }
        })
            .success(function (data) {
                if (isMounted(self)) {
                    //请求成功后，将ｄata赋值给chartPie传入子组件
                    self.setState({ chartPie: data });
                }
            })
    }
    /**
     * 更新第二个图时的操作
     *
     *
     * @memberof Environment
     */
    getChartLive() {
        var self = this;
        $.ajax({
            url: '/api/loginfo/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data: {
                flag: 1,
                type: self.state.type,
                source: self.state.source,
                level: self.state.level
            }
        })
            .success(function (data) {
                if (isMounted(self)) {
                    //请求成功后，将ｄata赋值给chartLive传入子组件
                    self.setState({ chartLive: data });
                }
            })
    }
    /**
     *
     *  更新最新五条日志的操作
     *
     * @memberof Environment
     */
    getLiveLogs() {
        var self = this;
        $.ajax({
            url: '/api/loginfo/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data: {
                flag: 2,
                type: self.state.type,
                source: self.state.source,
                level: self.state.level
            }
        })
            .success(function (data) {
                if (isMounted(self)) {
                    //请求成功后，将ｄata赋值给liveLogs传入子组件
                    self.setState({ liveLogs: data.logs });
                }
            })
    }
    /**
     *
     * 更新当天实时日志的操作
     *
     * @memberof Environment
     */
    getChartTodayLive() {
        var self = this;
        $.ajax({
            url: '/api/loginfo/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data: {
                flag: 3,
                type: self.state.type,
                source: self.state.source,
                level: self.state.level,
                isFirst: "false"
            }
        })
            .success(function (data) {
                if (isMounted(self)) {
                    //请求成功后，将ｄata赋值给chartTodayLive传入子组件
                    self.setState({ chartTodayLive: data });
                }
            })
    }
    //Tab1图表显示 ---------------------------------------------------------end
    /**
     * Tab第二页List数据 输入具体页码
     *
     * @param {any}
     *
     * @memberof Environment
     */
    listHandlePageChange() {
        //列表显示用户输入的页码值
        var listPageIndex = $('#listPageIndex').val();
        if (!isInt(listPageIndex) || listPageIndex <= 0 || listPageIndex > this.state.listPageCount) {
            $('#listPageIndex').val(this.state.pageCount);
        }
    }
    /**
     *
     * list输入页码后点击确认跳转
     *
     * @memberof Environment
     */
    listConfirm() {
        //列表显示用户输入的页码值
        var listPageIndex = parseInt($("#listPageIndex").val())
        var self = this;
        if (!listPageIndex) {      //页码框为空
            self.setState({
                showMsgBox: true,
                msgContent: '请输入页码',
                msgButtonState: true,
                msgButtonName: '确定'
            });
        } else {
            //发送的data
            var listData = {
                flag: 4,
                type: this.state.type,
                source: this.state.source,
                level: this.state.level,
                page: listPageIndex,
                size: 20
            };
            $.ajax({
                url: '/api/loginfo/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                data: listData,
                success: function (data) {
                    if (!$.isEmptyObject(data) && data.pageCount != 0 && isMounted(self)) {
                        self.setState({
                            allLogs: data.logs,
                            listPageCount: data.pageCount,
                            isLoading: false,
                            loadError: false,
                            listPageIndex: listPageIndex
                        });
                        //清空用户输入框，方便用户体验
                        $("#listPageIndex").val('')
                    }
                }
            })
        }
    }
    /**
     * /Ml获取下拉框搜索类别
     *
     * @param {any} e
     *
     * @memberof Environment
     */
    mlSearchItem(value) {
        this.setState({
            mllistItem: value
        })
    }
    /**
     *  ml页面的关键Ａｊａｘ按关键字搜索时与后台交互数据
     *
     * @param {any} itemKey PRC关键字
     * @param {any} searchkeyWord  之前是正序反序的参数新版可能被移除
     * @param {any} mlPageIndex   Ml的当前页
     * @returns
     *
     * @memberof Environment
     */
    mlSearchAjax(itemKey, searchkeyWord, mlPageIndex) {
        var self = this;
        //SQL语句过滤
        if (sqltest($(":text"))) {
            this.setState({
                showMsgBox: true,
                msgContent: '检测到非法字符',
                msgButtonState: true,
                msgButtonName: '确定'
            });
            return false;
        }
        $.ajax({
            url: '/api/mlSearch/',
            dataType: 'json',
            type: 'POST',
            data: {   //发送的数据包括搜索类别与关键字
                itemKey: itemKey,
                searchkeyWord: searchkeyWord,
                pageIndex: mlPageIndex
            },
            cache: false,
            //ajax成功时，数据渲染表格
            success: function (data) {
                var len = data.length;
                if (isMounted(self)) {
                    if (len > 1) {
                        self.setState({
                            isLoading: false,
                            loadError: false,
                            mlPageCount: data[len - 1].totalpages,
                            mllist: data.slice(0, len - 1),
                            mlPageIndex: parseInt(mlPageIndex)
                        });
                    } else {
                        //返回数据长度为0 ，暂无数据提示
                        self.setState({
                            isLoading: false,
                            loadError: true,
                        });
                    }
                }
            },
            //查询失败，给予弹框提示
            error: function () {
                if (isMounted(self)) {
                    self.setState({
                        isLoading: false,
                        loadError: true,
                    });
                }
            }
        });
    }
    /**
     * 因为获取itemＫey，查询关键字，和当前页码值，在很多地方都有用到
     　　　* 所以写了这个函数，统一处理
     * @param {any} pageIndex 可以省略不传，ml的当前页码值，
     * 　　　　　　　　　　　　　　　不传的话，时state页码值，传入的话时用户输入的页码
     * @memberof Environment
     */
    getML(pageIndex) {
        //prc关键字
        var itemKey = this.state.mllistItem;
        //用户手动输入的查询关键字
        var keyWord = $("#mllistKey").val();
        //ml当前页码值，
        var mlPageIndex = pageIndex || this.state.mlPageIndex;
        //loading动画
        this.setState({
            isLoading: true,
            loadError: false
        });
        //发送请求
        this.mlSearchAjax(itemKey, keyWord, mlPageIndex);
    }
    /**
     * Ml输入页码操作 限制输入页码不超过总页数-
     *
     * @param {any}
     *
     * @memberof Environment
     */
    mlHandlePageChange() {
        var mlPageNum = $('#mlPageNum').val();
        if (!isInt(mlPageNum) || mlPageNum <= 0 || mlPageNum > this.state.mlPageCount) {
            $('#mlPageNum').val(this.state.mlPageCount);
        }
    }
    /**
     * Tab 　Ml上下翻页
     *
     * @param {any} eventKey 是Pagination组件改变需要传入的页码
     *
     * @memberof Environment
     */
    mlHandleHrefClick(eventKey) {
        //prc关键字
        var itemKey = this.state.mllistItem;
        //用户手动输入查询关键字
        var searchKey = $('#mllistKey').val();
        //改变pageIndex的值
        this.setState({
            mlPageIndex: eventKey
        });
        //ML搜索Ajax
        this.mlSearchAjax(itemKey, searchKey, eventKey)
    }
    /**
     * Tab ---Ml确认按钮
     *
     *
     * @memberof Environment
     */
    mlConfirm() {
        //ml显示用户输入的页码值
        var mlPageIndex = parseInt($("#mlPageNum").val());
        //如果未输入页码的情况
        if (!mlPageIndex) {
            this.setState({
                showMsgBox: true,
                msgContent: '请输入页码',
                msgButtonState: true,
                msgButtonName: '确定'
            });
        } else {
            //改变pageIndex的值
            this.setState({
                mlPageIndex: mlPageIndex
            });
            this.getML(mlPageIndex);
        }
        //清空用户输入框，方便用户体验
        $("#mlPageNum").val('');
    }
    componentWillMount() {
        this.initLogs();
    }
    /* 组件渲染完成 分别设置定时刷新 */
    componentDidMount() {
        //修改页面title
        document.title = '可信防护'
        //设置全局定时器变量,便于清除（更新第一个图时的操作 ）
        this.chartPieInterval = setInterval(this.getChartPie.bind(this), 5000);
        //设置全局定时器变量,便于清除（最近五条日志）
        this.liveLogsInterval = setInterval(this.getLiveLogs.bind(this), 10000);
        //设置全局定时器变量,便于清除（更新当天实时日志的操作）
        this.chartTodayLiveInterval = setInterval(this.getChartTodayLive.bind(this), 10000);
    }
    /* 组件将要移除 离开当前页面时清除所有的计时器,清除定时 */
    componentWillUnmount() {
        //清除第一个图时的操作的定时请求
        myClearInterval(this.chartPieInterval);
        //清除最近五条日志的定时请求
        myClearInterval(this.liveLogsInterval);
        //清除更新当天实时日志的定时请求
        myClearInterval(this.chartTodayLiveInterval);
    }
    //  页面渲染
    render() {
        //通过下拉列表选项要传递的值获取数组中对应的对象。
        //此方法用于下拉列表设置 itemDefault
        var getItemByValue = function (value, itemList) {
            for (var i = 0; i < itemList.length; i++) {
                if (itemList[i].value == value) {
                    return itemList[i]
                }
            }
        }
        return (
            <div className="home-main environment">
                <MessageBox
                    showMsgBox={this.state.showMsgBox}
                    msgContent={this.state.msgContent}
                    msgButtonState={this.state.msgButtonState}
                    msgButtonName={this.state.msgButtonName}
                    handleConfirmMsgBox={this.handleConfirmMsgBox.bind(this)}
                />
                <header>
                    <div className='environment-title'>可信防护</div>
                </header>
                <Tabs defaultActiveKey={1} id="tabs" onSelect={this.handleTabSelect.bind(this)}>
                    <Tab eventKey={1} title="防护控制">
                        <ProtectControl/>
                    </Tab>
                    <Tab eventKey={2} title="图表统计">
                        <div className="graphicDisplay">
                            <div className="sticker">
                                <Button bsStyle="primary" className="graphicSaerch" bsSize="sm" onClick={this.initLogs.bind(this)}>搜索</Button>
                                <div className="logs-select">
                                    <DropdownList
                                        listID="chart-select-source"
                                        itemsToSelect={this.sourceTypes}
                                        onSelect={(value) => this.handleSourceChange(value)}
                                        itemDefault={getItemByValue(this.state.source, this.sourceTypes)} />
                                </div>
                                <div className="logs-select">
                                    <DropdownList
                                        listID="chart-select-host"
                                        itemsToSelect={this.hostTypes}
                                        onSelect={(value) => this.handleTypeChange(value)}
                                        itemDefault={getItemByValue(this.state.type, this.hostTypes)} />
                                </div>
                            </div>
                            {this.state.isLoading && this.isGraph && !this.isMl && <LoadingText />}
                            {this.state.loadError && this.isGraph && !this.isMl && <div>暂时没有日志</div>}
                            {!this.state.isLoading && !this.state.loadError && this.isGraph &&
                            <div>
                                <div className="Tab1-up clearfix">
                                    <div className="first-left">
                                        <div className="first-left-tip">
                                            所有日志信息统计
                                        </div>
                                        <ChartPie
                                            data={this.state.chartPie}
                                            isGraph={this.isGraph}
                                            series_name="来源"
                                            levelClass={{ 'DEBUG': '调试', 'INFO': '信息', 'WARNING': '警告', 'ERROR': '错误', 'CRITICAL': '严重' }}
                                        />
                                    </div>
                                    <div className="first-right">
                                        <div className="first-right-tip">
                                            历史数据折线图
                                        </div>
                                        <ChartLive
                                            data={this.state.chartLive}
                                            isGraph={this.isGraph}
                                            levelClass={{ 'DEBUG': '调试', 'INFO': '信息', 'WARNING': '警告', 'ERROR': '错误', 'CRITICAL': '严重' }}
                                            id='chartsOnline'
                                        />
                                    </div>
                                </div>
                                <div className="Tab1-center clearfix">
                                    <LiveLogs data={this.state.liveLogs} isGraph={this.isGraph} />
                                    <div className="second-right" >
                                        <div className="second-right-title">今日变化曲线图</div>
                                        <ChartTodayLive
                                            data={this.state.chartTodayLive}
                                            isGraph={this.isGraph}
                                            series_name="个数"
                                            id='chartsToday' />
                                    </div>
                                </div>
                            </div>
                            }
                        </div>
                    </Tab>
                    <Tab eventKey={3} title="详细日志">
                        <div className="sticker">
                            <Button bsStyle="primary" bsSize="sm" className="listSaerch" onClick={() => this.initLogs(1)}>搜索</Button>
                            <div className="logs-select">
                                <div className="select-img"></div>
                                <DropdownList
                                    listID="table-select-level"
                                    itemsToSelect={this.levelTypes}
                                    onSelect={(value) => this.handleLevelChange(value)}
                                    itemDefault={getItemByValue(this.state.level, this.levelTypes)} />
                            </div>
                            <div className="logs-select">
                                <DropdownList
                                    listID="table-select-source"
                                    itemsToSelect={this.sourceTypes}
                                    onSelect={(value) => this.handleSourceChange(value)}
                                    itemDefault={getItemByValue(this.state.source, this.sourceTypes)} />
                            </div>
                            <div className="logs-select">
                                <DropdownList
                                    listID="table-select-host"
                                    itemsToSelect={this.hostTypes}
                                    onSelect={(value) => this.handleTypeChange(value)}
                                    itemDefault={getItemByValue(this.state.type, this.hostTypes)} />
                            </div>
                        </div>
                        {this.state.isLoading && !this.isGraph && !this.isMl && <LoadingText />}
                        {this.state.loadError && !this.isGraph && !this.isMl && <div>暂时没有日志</div>}
                        {!this.state.isLoading && !this.state.loadError && !this.isGraph && !this.isMl &&
                        <AllLogs
                            data={this.state.allLogs}
                            isGraph={this.isGraph}
                        />}
                        {!this.state.isLoading && !this.state.loadError && !this.isGraph &&
                        <div className="pagination-all">
                            <Pagination
                                prev={true}
                                next={true}
                                first={false}
                                last={false}
                                ellipsis={true}
                                boundaryLinks={true}
                                items={this.state.listPageCount}
                                maxButtons={3}
                                activePage={this.state.listPageIndex}
                                onSelect={this.initLogs.bind(this)}
                            />
                            <div className="pageCount">
                                <input className="pageNum" id="listPageIndex" placeholder="输入" onChange={this.listHandlePageChange.bind(this)} />
                                <img className="searchNum" onClick={this.listConfirm.bind(this)} src='/static/img/skip.svg' />
                            </div>
                        </div>}
                    </Tab>
                    <Tab eventKey={4} title="机器属性">
                        <div className="ml">
                            <div className="sticker">
                                <Button bsStyle="primary" className="mlSearch" bsSize="sm" onClick={() => this.getML()}>搜索</Button>
                                <div className="logs-select">
                                    <input id="mllistKey" name="mllistKey" className="form-control" placeholder="请输入关键字" />
                                </div>
                                <div className="logs-select">
                                    <DropdownList
                                        listID="ml-select-ml"
                                        itemsToSelect={this.mlTypes}
                                        onSelect={(value) => this.mlSearchItem(value)}
                                        itemDefault={getItemByValue(this.state.mllistItem, this.mlTypes)} />
                                </div>
                            </div>
                            {this.state.isLoading && this.isMl && <LoadingText />}
                            {this.state.loadError && this.isMl && <div>暂时没有日志</div>}
                            {!this.state.isLoading && !this.state.loadError && this.isMl &&
                            <div>
                                <MlTable
                                    mllist={this.state.mllist}
                                />
                                {/*分页公共样式 所有用到的分页都可以使用 ------------------------------------------------------------ start              参数肯定要改                                 */}
                                <div className="pagination-all">
                                    <Pagination
                                        prev={true}
                                        next={true}
                                        first={false}
                                        last={false}
                                        ellipsis={true}
                                        boundaryLinks={true}
                                        items={this.state.mlPageCount}
                                        maxButtons={3}
                                        activePage={this.state.mlPageIndex}
                                        onSelect={this.mlHandleHrefClick.bind(this)} />
                                    <div className="pageCount">
                                        <input className="pageNum" id="mlPageNum" placeholder="输入" onChange={this.mlHandlePageChange.bind(this)} />
                                        <img className="searchNum" onClick={this.mlConfirm.bind(this)} src='/static/img/skip.svg' />
                                    </div>
                                </div>
                                {/*分页公共样式，所有用到的分页都可以使用 ------------------------------------------------------------  end                                              */}
                            </div>}
                        </div>
                    </Tab>

                    <Tab eventKey={5} title="可信白名单">
                        <div className="">
                            <WhiteList/>
                        </div>
                    </Tab>
                    <Tab eventKey={6} title="异常确认">
                    <Affirm />
                </Tab>
                </Tabs>
            </div>
        )
    }
}