/**
 * 
 * 首页
 *
 * Update time (MM/DD YY): 04/03 2018
 * Created by ZHAO Ling
 * 
 * * * * * 按从左往右，从上到下的顺序，依次是 * * * * 
 *  一个雷达图
 *  五个仪表盘
 *  八个index数据
 *  三个柱状图
 *  一个地图
 *  五个指标
 *  一个表格
 *  两个折线图
 *  六个组合图（空心圆和折线图组合）
 * 
 */
import React from "react";
import $ from 'jquery';
import TotalScoreBox from './home/TotalScoreBox';      //全球云健康分数
import WorldMap from "./home/WorldMap";                //地理位置相关图表
import SampleText from './home/SampleText';            //福州数据库可信指数项
import HomeHeader from './home/HomeHeader';　　　　　 　 //首页主体头部
import Totalattack from "./wafWall/Totalattack";       //每日拦截威胁次数
import Typeattack from "./wafWall/Typeattack";         //攻击类型统计
import Radarchart from "./wafWall/Radarchart";       　//防御安全雷达图
import Orinalattack from "./wafWall/Orinalattack";   　//攻击来源占比
import Loading from "./Commonality/LoadingText";
import echarts from "echarts"
import BarChart from './home/BarChart'                 //柱状图
import DonutChart from './home/DonutChart'             //空心圆
import SmallLineChart from './home/SmallLineChart'     //小折线图
import DashboardChart from './home/DashboardChart'     //仪表盘
import LineChart from './home/LineChart'               //折线图
import CornerBorder from './home/CornerBorder'         //边角样式
import DynamicGauge from "./Commonality/DynamicGauge"  //仪表盘2
import { getParmam } from "../utils/utils"
// require('../utils/jquery.cookie.js')                   //jquery-cookie插件

/* 首页 */
export default class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loding: true,            //loding是否开启
            systemIndex: null,
            trust_count: 100,   // 可信日志总数
            defense_count: 12, // 防御日志总数；
            chain_count: 33,  //  区块链节点数；
            pro_node_count: 23,  // 被保护节点数；
            whitelist_count: 30, // 白名单总数；
            shenji_count: 53,//     审计日志总数；
            score: 98,//             全球感知分数；
            nisa_count: 100000,//       大数据分析总数



            // attackNumTotal: [0, 0, 0, 0, 0],//防御次数雷达图数据
            // attackNumWeek: [[0, 0, 0, 0, 0, 0, 0, 0],
            // [0, 0, 0, 0, 0, 0, 0, 0],
            // [0, 0, 0, 0, 0, 0, 0, 0]
            // ],//每日防御次数
            // attackNumDays: [],//每日攻击次数
            // attackNumCity: [],//攻击来源

            worldMapData: [], //世界地图的数据

            system_score: null, //系统分数
            attack_radar: [1, 24, 54, 3, 2], //雷达图数据
            systemInfo: null,    //主机的信息 cpu index
            attackRange: null,   //日志表格数据   
            // logdata: [],

            /** 
             *  三个柱状图数据
             */
            infonum: null,   // info数据
            infotime: null,  // info时间
            warnnum: null,   // warn数据
            warntime: null,  // warn时间
            errornum: null,  // error数据
            errortime: null, // error时间

            /** 
             *  两个折线图数据
             */
            lognum: null,       // 实时日志数据
            logtime: null,      // 实时日志时间
            networknum: null,   // 实时网络流量数据
            networktime: null,  // 实时网络流量时间
        };
        this.formerSystemInfo = null;  //cpu数据更新的前一次数据作保留，用来对比
        this.formerSystemIndex = null; //8个index数据更新的前一次数据作保留，用来对比
    }


    /**
        * 获取当前登录用户信息
        * 并将用户名显示在顶部当航栏上
        */
    setLogInfo() {
        var id = window.location.href.split('=')[1];
        if (id == 'qingyun') {
            $.post('/api/new_login/', { source: id }, (res) => {
                console.log(res)
                window.location.href = 'home'
            })
        }

    }

    // getAllScore() {
    //     var self = this;
    //     $.ajax({
    //         url: '/api/home/statisinfo/',
    //         type: 'GET',
    //         dataType: 'json',
    //         cache: false,
    //         success: function (data) {
    //             // console.log(data)
    //             self.setState({
    //                 chain_count: data.chain_count,
    //                 shenji_count: data.shenji_count,
    //                 pro_node_count: data.pro_node_count,
    //                 trust_count: data.trust_count,
    //                 defense_count: data.defense_count,
    //                 whitelist_count: data.whitelist_count,
    //                 score: data.score,
    //                 nisa_count: data.score,

    //             })
    //         }
    //     })
    // }
    /**
     * 地图数据
     */
    getWorldMap() {
        var self = this;
        $.ajax({
            url: ' /api/new_index/index_watcherlab_info/',
            type: 'GET',
            dataType: 'json',
            cache: false,
            success: function (data) {
                // console.log(JSON.parse(data))
                // console.log(data)
                self.setState({
                    worldMapData: data.data //地图数据
                })
            }
        })
    }

    // wafDataAjax() {
    //     var self = this;
    //     $.ajax({
    //         url: '/api/wf/home/',
    //         type: 'POST',
    //         dataType: 'json',
    //         cache: false,
    //         success: function (data) {//发送成功
    //             // console.log(JSON.stringify(data.city))
    //             if(data.total && data.week ){
    //                 self.setState({
    //                     attackNumTotal: [
    //                         data.total["dos-attack"],
    //                         data.total["web-attack"],
    //                         data.total["identification-error"],
    //                         data.total["sensitive-data-tracking"],
    //                         data.total["http-defense"],
    //                     ],
    //                     attackNumWeek: [
    //                         data.week["http-defense"],
    //                         data.week["dos-attack"],
    //                         data.week["web-attack"],
    //                         data.week["sensitive-data-tracking"],
    //                         data.week["identification-error"],
    //                     ],
    //                     attackNumDays: [
    //                         data.days.count,
    //                         data.days.limit,
    //                         data.days.date
    //                     ],
    //                     attackNumCity: data.city
    //                 })
    //             }               
    //         }
    //     });
    // }

    /**
     * 首页分数
     */
    getSystemScore() {
        var self = this
        $.ajax({
            url: '/api/new_index/index_score/',
            type: 'GET',
            dataType: 'json',
            cache: false,
            success: function (data) {
                // console.log(data.score ,"SystemScore");
                if (data && data.code == 200 && data.score) {
                    self.setState({
                        system_score: data.score
                    })
                }
            }
        })
    }
    /**
     * 雷达图
     */
    getAttackRadar() {
        var self = this;
        $.ajax({
            url: '/api/new_index/attack_radar/',
            type: 'GET',
            dataType: 'json',
            cache: false,
            success: function (data) {
                if (data && data.code == 200 && data.data) {
                    // console.log(data, 'radar');
                    self.setState({
                        attack_radar: [
                            data.data["identification-error"],     // 应用程序鉴定与检测
                            data.data["web-attack"],               // web攻击防护
                            data.data["dos-attack"],               // ddos攻击防护
                            data.data["sensitive-data-tracking"],  // 敏感数据追踪
                            data.data["http-defense"],             // http防御

                        ]
                    });
                    self.updateRadar(); // 雷达图数据更新
                }
            }
        });
    }
    /**
     * 雷达图更新
     */
    updateRadar() {
        this.radar_chart.setOption({
            radar: {
                indicator:
                [
                    { name: '应用程序鉴定和检测', nameLocation: "end", max: this.state.attack_radar[0] * 1.2, nameRotate: 0, },   // 应用程序鉴定与检测
                    { name: 'Web攻击防护', max: this.state.attack_radar[1] * 1.5 },   // web攻击防护
                    { name: 'DDos攻击防护', max: this.state.attack_radar[2] * 1.3 },  // ddos攻击防护
                    { name: '敏感数据追踪', max: this.state.attack_radar[3] * 1.6 },   // 敏感数据追踪
                    { name: 'http防御', max: this.state.attack_radar[4] * 1.5 },      // http防御

                ],
            },
            series: [{
                data: [{
                    value: this.state.attack_radar,
                }]
            }]
        });
    }

    /**
     * 8个index参数
     */
    getIndex() {
        var self = this;
        $.ajax({
            url: '/api/new_index/index_statis_info/',
            type: 'GET',
            dataType: 'json',
            cache: false,
            success: function (data) {
                if (data && data.code == 200 && data.data) {
                    // console.log(data, 'index');
                    self.formerSystemIndex = self.state.systemIndex  //保留这次数据，用于比较                    
                    self.setState({
                        systemIndex: data.data,
                        chain_count: data.data.chain_count,             // 区块链节点数
                        shenji_count: data.data.shenji_count,           // 审计日志总数
                        pro_node_count: data.data.pro_node_count,       // 被保护节点数
                        trust_count: data.data.trust_count,             // 可信日志总数
                        defense_count: data.data.defense_count,         // 防御日志总数
                        whitelist_count: data.data.whitelist_count,     // 白名单总数
                        score: data.data.score,                         // 全球感知分数
                        nisa_count: data.data.nisa_count,               // 大数据分析总数
                    });
                }
            }
        });
    }

    /**
     * 返回数值的小数点前有多少位数
     * @param {*} num 
     */
    numsBeforeDecimal(num) {
        let count = 1
        let temp = num / 10
        while (temp > 1) {
            temp = temp / 10
            count++
        }
        return count
    }

    /**
     * 判断是否为整数
     * @param {*} num 
     */
    isInterger(num) {
        return num % 1 === 0
    }
    /**
     * 为了展示的时候数字不会过长超出方框处理数字，
     * 小数结果：“000.0”，“00.00”，“0.000”，“000K”，“00.0K”，“0.00K”...
     * 整数结果：“0”，“00”，“000”，“000K”，“00K”...
     * @param {*} num 
     */
    formatNumber(num) {
        let temp
        if (num < 1000) {   //小数点前有3位
            temp = num
            if (this.isInterger(temp)) {   //如果是整数
                return temp
            } else {
                return temp.toFixed(4 - this.numsBeforeDecimal(temp))
            }
        } else if (num >= 1000 && num < 1000000) { //小数点前有4-6位
            temp = num / 1000
            if (this.isInterger(temp)) {   //如果是整数
                return temp + "K"
            } else {
                return temp.toFixed(3 - this.numsBeforeDecimal(temp)) + "K"
            }
        } else if (num > 1000000 && num < 1000000000) {    //小数点前有6-9位
            temp = num / 1000000
            if (this.isInterger(temp)) {   //如果是整数
                return temp + "M"
            } else {
                return temp.toFixed(3 - this.numsBeforeDecimal(temp)) + "M"
            }
        } else { //小数点前多于9位
            temp = num / 1000000000
            if (this.isInterger(temp)) {   //如果是整数
                return temp + "B"
            } else {
                return temp.toFixed(3 - this.numsBeforeDecimal(temp)) + "B"
            }
        }
    }

    /** 
     * 获取cpu index
     */
    getSystemInfo() {
        var self = this
        $.ajax({
            url: '/api/new_index/index_host_info/',
            type: 'get',                   //POST方式时,表单数据作为 HTTP 消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为 URL 地址的参数进行传递
            cache: false,                   //不会从浏览器缓存中加载请求信息
            success: function (data) {
                if (data && data.code == 200) {
                    self.formerSystemInfo = self.state.systemInfo   //保留这次数据，用于比较                    
                    self.setState({
                        systemInfo: data.data
                    });
                }
            }
        })
    }
    /**
     * 三个直方图
     */
    getLogCount() {
        let self = this
        $.ajax({
            url: "/api/new_index/log_incr_count/",
            type: "GET",
            dataType: 'json',
            cache: false,
            success: function (data) {
                if (data && data.code === 200) {
                    var infocontent = data.total_list[0];
                    // console.log(infocontent,'infocontent[i]');
                    var warncontent = data.total_list[1];
                    var errorcontent = data.total_list[2];
                    var infonum = [];
                    var infotime = [];
                    var warnnum = [];
                    var warntime = [];
                    var errornum = [];
                    var errortime = [];
                    // 直方图 1 ： INFO
                    for (var i = 0; i < infocontent.length; i++) {
                        infotime.push(infocontent[i].time);
                        infonum.push(infocontent[i].INFO);
                    }
                    // 直方图 2 ： WARN
                    for (var k = 0; k < warncontent.length; k++) {
                        warntime.push(warncontent[k].time);
                        warnnum.push(warncontent[k].WARNING);
                    }
                    // 直方图 3 ： ERROR
                    for (var j = 0; j < errorcontent.length; j++) {
                        errortime.push(errorcontent[j].time);
                        errornum.push(errorcontent[j].ERROR);
                    }
                    // 数据顺序反转
                    self.setState({
                        infonum: infonum.reverse(),
                        infotime: infotime.reverse(),
                        warnnum: warnnum.reverse(),
                        warntime: warntime.reverse(),
                        errornum: errornum.reverse(),
                        errortime: errortime.reverse(),
                    });

                }
            }
        })
    }
    /**
     * 日志表格
     */
    getRealLog() {
        var self = this
        $.ajax({
            url: '/api/new_index/index_real_log/',
            type: 'get',                   //POST方式时,表单数据作为 HTTP 消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为 URL 地址的参数进行传递
            cache: false,                   //不会从浏览器缓存中加载请求信息
            success: function (data) {
                if (data && data.code == 200) {
                    var attackRange = []
                    for (var i = 0; i < data.data.length; i++) {
                        //处理获得攻击列表数据
                        attackRange[i] = {
                            time: data.data[i].occur_time,
                            source_ip: data.data[i].source_ip,
                            des_ip: data.data[i].des_ip,
                            attack_type: data.data[i].attack_type
                        }
                        if (i == data.data.length - 1) {
                            self.setState({
                                attackRange: attackRange
                            })
                        }
                    }

                }
            }
        })
    }
    /**
     * 折线图 1
     */
    getLogPlus() {
        let self = this
        $.ajax({
            url: "/api/new_index/real_log_incr/",
            type: "GET",
            dataType: 'json',
            cache: false,
            success: function (data) {
                if (data && data.code === 200) {
                    var content = data.data;
                    var logtime = [];
                    var lognum = [];
                    for (var k = 0; k < content.length; k++) {
                        logtime.push(content[k].time);
                        lognum.push(content[k].count);
                    }
                    self.setState({
                        lognum: lognum.reverse(),
                        logtime: logtime.reverse()
                    });

                }
            }
        })
    }

    /**
     * 折线图 2
     */
    getRealNetwork() {
        let self = this
        $.ajax({
            url: "/api/new_index/real_network/",
            type: "GET",
            dataType: 'json',
            cache: false,
            success: function (data) {
                if (data && data.code === 200) {
                    var content = data.data;
                    var networktime = [];
                    var networknum = [];
                    for (var k = 0; k < content.length; k++) {
                        networktime.push(content[k].time);
                        networknum.push(content[k].network_all);
                    }
                    self.setState({
                        networknum: networknum.reverse(),
                        networktime: networktime.reverse()
                    });

                }
            }
        })
    }
    /**
     * 五秒定时器
     */
    fiveSeconds() {
        this.getSystemScore();  // 系统分数 
        this.getAttackRadar();  // 雷达图
        this.getIndex(); // 8个参数
        this.getSystemInfo(); //cpu
        this.getRealLog(); //日志 表格数据
    }
    /**
     * 十分钟定时器
     */
    tenMinutes() {
        this.getLogPlus(); // 折线图 1 日志增量
        this.getWorldMap();  // 地圖
        this.getLogCount(); // 三个直方图
    }
    componentWillMount() {
        // 调用，获取页面echarts所需的数据
        // this.wafDataAjax()

        // 雷达图配置
        this.optionRadar = {
            legend: {},
            tooltip: {},
            radar: {
                // shape: 'circle',
                name: {
                    textStyle: {
                        color: '#fff',
                        fontSize: '10px',
                    },
                    formatter: (text) => {  //参数名称太长,显示不全,4个字符后自动换行
                        if (text === "Web攻击防护") {
                            text = text.replace(/\S{4}/g, function (match) {
                                return match + '\n'
                            })
                        }
                        if (text === "DDos攻击防护") { //参数名称太长,显示不全,5个字符后自动换行
                            text = text.replace(/\S{5}/g, function (match) {
                                return match + '\n'
                            })
                        }
                        if (text === "敏感数据追踪") { //参数名称太长,显示不全,3个字符后自动换行
                            text = text.replace(/\S{3}/g, function (match) {
                                return match + '\n'
                            })
                        }
                        if (text === "http防御") {  //参数名称太长,显示不全,4个字符后自动换行
                            text = text.replace(/\S{4}/g, function (match) {
                                return match + '\n'
                            })
                        }
                        return text
                    }
                },

                indicator:
                [
                    { name: '应用程序鉴定和检测', nameLocation: "end", max: this.state.attack_radar[0] * 1.2, nameRotate: 0, },
                    { name: 'Web攻击防护', max: this.state.attack_radar[1] * 1.5 },
                    { name: 'DDos攻击防护', max: this.state.attack_radar[2] * 1.3, },
                    { name: '敏感数据追踪', max: this.state.attack_radar[3] * 1.6, },
                    { name: 'http防御', max: this.state.attack_radar[4] * 1.5 },

                ],
                radius: '70%',
                nameLocation: "start",
                nameGap: 5, // 图中敏感数据追踪等字距离图的距离
                splitArea: {
                    show: false
                },
                splitLine: {
                    lineStyle: {
                        color: "#444851"
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: '#444851'
                    }
                }
            },

            series: [{
                name: '防御安全雷达',
                type: 'radar',
                // areaStyle: {normal: {}},
                lineStyle: {
                    normal: {
                        color: "rgba(0,0,0,0)"
                    }
                },
                areaStyle: {
                    normal: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [{
                                offset: 0, color: 'rgba(0,122,225,0.9)'
                            }, {
                                offset: 1, color: 'rgba(159,134,255,0.9)'
                            }],
                            globalCoord: false // 缺省为 false
                        }
                    }
                },
                data: [
                    {
                        value: this.state.attack_radar,
                        label: {
                            normal: {
                                show: true,
                                // formatter:function(params) {
                                //     return params.value;
                                // },
                                textStyle: {
                                    color: '#999',
                                    fontSize: '10px'
                                }
                            }
                        },
                        name: '安全防御',
                        color: "#fff",
                        symbol: 'roundRect',
                        symbolSize: 1
                    }
                ]
            }]
        };

    }

    componentDidMount() {
        // this.getAllScore();
        //修改页面title
        this.setLogInfo()




        document.title = '首页'

        // 绘制雷达图
        this.radar_chart = echarts.init(document.getElementById('radar-chart'));
        this.radar_chart.setOption(this.optionRadar);

        // 五秒定时器
        this.fiveSeconds();
        this.fiveSecondsInterval = setInterval(this.fiveSeconds.bind(this), 5000) //每5s刷新    
        // 十分钟定时器 
        this.tenMinutes();
        this.tenMinutesInterval = setInterval(this.tenMinutes.bind(this), 600000) //每10min刷新     

        // 绘制第二个折线图
        this.getRealNetwork(); //折线图 2
        this.realNetworkInterval = setInterval(this.getRealNetwork.bind(this), 10000) //每10s刷新  

    }

    componentWillUnmount() {
        //去除当前定时器
        if (this.fiveSecondsInterval) {
            clearInterval(this.fiveSecondsInterval);
        }
        //去除当前定时器
        if (this.tenMinutesInterval) {
            clearInterval(this.tenMinutesInterval);
        }
        //去除当前定时器
        if (this.realNetworkInterval) {
            clearInterval(this.realNetworkInterval);
        }
        //解绑主页监听的scroll事件
        $(window).off()
    }
    // 渲染页面
    render() {
        // //数据库可信指数具体内容
        // var sample_left_texts = [
        //     { scores: this.state.trust_count, text: "可信错误总数" },
        //     { scores: this.state.defense_count, text: "防御日志总数" },
        //     { scores: this.state.chain_count, text: "区块链节点数" },
        //     { scores: this.state.pro_node_count, text: "保护节点数" },
        //     { scores: this.state.whitelist_count, text: "白名单总数" }];
        // //存储遍历完的数据
        // var sampleLeft = [];
        // //遍历数据循环插入sampleText组件 分别赋值
        // sample_left_texts.forEach(function (item, index) {
        //     sampleLeft.push(
        //         <SampleText key={index} score={item.scores} text={item.text} />
        //     )
        // }.bind(this))

        // var sample_right_texts = [
        //     { scores: this.state.shenji_count, text: "审计日志总数" },
        //     { scores: this.state.score, text: "全球感知分数" },
        //     { scores: this.state.nisa_count, text: "大数据分析总数" },
        // ];
        // //存储遍历完的数据
        // var sampleRight = [];
        // //遍历数据循环插入sampleText组件 分别赋值
        // sample_right_texts.forEach(function (item, index) {
        //     sampleRight.push(
        //         <SampleText key={index} score={item.scores} text={item.text} />
        //     )
        // }.bind(this))

        return (
            <section className="home-main"  >
                {/* 首页内容头部 ---start*/}
                <HomeHeader />
                {/* 首页内容头部  ---start*/}



                <div className="homeContent">

                    <div className="clearfix group1">
                        <div className="column1">
                            <section className="row1">
                                <div className="overview-group">
                                    <div className="sys-name">
                                        <p>持续免疫系统</p>
                                        <p className="status">正在运行</p>
                                    </div>
                                    <div className="index-group">
                                        <div className="title">
                                            <p>系统可信指数</p>
                                        </div>
                                        <div className="value clearfix">
                                            <p>{this.state.system_score ? this.state.system_score : '00'}</p>
                                            <p className="unity">系统运行正常</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="radar-group">
                                    <CornerBorder />
                                    <div id="radar-chart"></div>
                                </div>
                            </section>
                            <section className="row2">
                                {/* <DashboardChart title="CPU" detail={this.state.systemInfo && (this.state.systemInfo.used_cpu_pct*100).toFixed(2)} 
                                    percentage={this.state.systemInfo && parseFloat(this.state.systemInfo.used_cpu_pct).toFixed(2)}  unit="%" /> */}
                                <DynamicGauge
                                    svgid="gaugeCpu"
                                    title="CPU"
                                    unity="%"
                                    svgWidth="77"
                                    svgHeight="114"
                                    colorFill="#007AE1"
                                    value={this.state.systemInfo && (this.state.systemInfo.used_cpu_pct * 100).toFixed(2)}
                                    percentage={this.state.systemInfo && parseFloat(this.state.systemInfo.used_cpu_pct).toFixed(2)} />
                                {/* <DashboardChart title="I/O" detail={this.state.systemInfo && this.formatNumber(parseFloat(this.state.systemInfo.disk_write)+parseFloat(this.state.systemInfo.disk_read))}
                                    percentage={this.state.systemInfo && ((parseFloat(this.state.systemInfo.disk_write)+parseFloat(this.state.systemInfo.disk_read))/1024).toFixed(2)} unit="KB/s" /> */}
                                <DynamicGauge
                                    svgid="gaugeIo"
                                    title="I/O"
                                    unity="KB/s"
                                    svgWidth="77"
                                    svgHeight="114"
                                    colorFill="#007AE1"
                                    value={this.state.systemInfo && this.formatNumber(parseFloat(this.state.systemInfo.disk_write) + parseFloat(this.state.systemInfo.disk_read))}
                                    percentage={this.state.systemInfo && ((parseFloat(this.state.systemInfo.disk_write) + parseFloat(this.state.systemInfo.disk_read)) / 1024).toFixed(2)} />
                                {/* <DashboardChart title="内存" detail={this.state.systemInfo && (this.state.systemInfo.used_mem_pct*100).toFixed(2)} 
                                    percentage={this.state.systemInfo && parseFloat(this.state.systemInfo.used_mem_pct).toFixed(2)} unit="%" /> */}
                                <DynamicGauge
                                    svgid="gaugeMemory"
                                    title="内存"
                                    unity="%"
                                    svgWidth="77"
                                    svgHeight="114"
                                    colorFill="#007AE1"
                                    value={this.state.systemInfo && (this.state.systemInfo.used_mem_pct * 100).toFixed(2)}
                                    percentage={this.state.systemInfo && parseFloat(this.state.systemInfo.used_mem_pct).toFixed(2)} />
                                {/* <DashboardChart title="网络流量" detail={this.state.systemInfo && this.formatNumber(parseFloat(this.state.systemInfo.data_second))} 
                                    percentage={this.state.systemInfo && (this.state.systemInfo.data_second/1024).toFixed(2)} unit="KB/s" /> */}
                                <DynamicGauge
                                    svgid="gaugeNet"
                                    title="网络流量"
                                    unity="KB/s"
                                    svgWidth="77"
                                    svgHeight="114"
                                    colorFill="#007AE1"
                                    value={this.state.systemInfo && this.formatNumber(parseFloat(this.state.systemInfo.data_second))}
                                    percentage={this.state.systemInfo && (this.state.systemInfo.data_second / 1024).toFixed(2)} />
                                {/* <DashboardChart title="进程" detail={this.state.systemInfo && this.formatNumber(parseFloat(this.state.systemInfo.process_nums))} 
                                    percentage={this.state.systemInfo && (this.state.systemInfo.process_nums/500).toFixed(2)} unit="个" /> */}
                                <DynamicGauge
                                    svgid="gaugePro"
                                    title="进程"
                                    unity="个"
                                    svgWidth="77"
                                    svgHeight="114"
                                    colorFill="#007AE1"
                                    value={this.state.systemInfo && this.formatNumber(parseFloat(this.state.systemInfo.process_nums))}
                                    percentage={this.state.systemInfo && (this.state.systemInfo.process_nums / 500).toFixed(2)} />
                            </section>
                            <section className="row3">
                                <div className="left-container">
                                    <div className="parameter-box">
                                        <CornerBorder />
                                        <div className="content-box">
                                            <div>
                                                <div className="title">
                                                    <p>可信日志总数</p>
                                                </div>
                                                <div className="value clearfix">
                                                    <div>
                                                        {this.formerSystemIndex ?
                                                            this.state.systemIndex.trust_count - this.formerSystemIndex.trust_count >= 0 ?
                                                                <p className="percentage">
                                                                    <i className="fa fa-arrow-alt-circle-up"></i>
                                                                    {this.formatNumber(parseFloat(this.state.systemIndex.trust_count - this.formerSystemIndex.trust_count))}
                                                                </p>
                                                                :
                                                                <p className="percentage">
                                                                    <i className="fa fa-arrow-alt-circle-down"></i>
                                                                    {this.formatNumber(parseFloat(this.formerSystemIndex.trust_count - this.state.systemIndex.trust_count))}
                                                                </p>

                                                            : <p className="percentage"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                                        }
                                                        <p className="unity">个</p>
                                                    </div>
                                                    <div>{this.formatNumber(parseFloat(this.state.trust_count))}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="parameter-box">
                                        <CornerBorder />
                                        <div className="content-box">
                                            <div>
                                                <div className="title">
                                                    <p>防御日志总数</p>
                                                </div>
                                                <div className="value clearfix">
                                                    <div>
                                                        {this.formerSystemIndex ?
                                                            this.state.systemIndex.defense_count - this.formerSystemIndex.defense_count >= 0 ?
                                                                <p className="percentage">
                                                                    <i className="fa fa-arrow-alt-circle-up"></i>
                                                                    {this.formatNumber(parseFloat(this.state.systemIndex.defense_count - this.formerSystemIndex.defense_count))}
                                                                </p>
                                                                :
                                                                <p className="percentage">
                                                                    <i className="fa fa-arrow-alt-circle-down"></i>
                                                                    {this.formatNumber(parseFloat(this.formerSystemIndex.defense_count - this.state.systemIndex.defense_count))}
                                                                </p>

                                                            : <p className="percentage"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                                        }
                                                        <p className="unity">个</p>
                                                    </div>
                                                    <div>{this.formatNumber(parseFloat(this.state.defense_count))}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="parameter-box">
                                        <CornerBorder />
                                        <div className="content-box">
                                            <div>
                                                <div className="title">
                                                    <p>区块链节点数</p>
                                                </div>
                                                <div className="value clearfix">
                                                    <div>
                                                        {this.formerSystemIndex ?
                                                            this.state.systemIndex.chain_count - this.formerSystemIndex.chain_count >= 0 ?
                                                                <p className="percentage">
                                                                    <i className="fa fa-arrow-alt-circle-up"></i>
                                                                    {this.formatNumber(parseFloat(this.state.systemIndex.chain_count - this.formerSystemIndex.chain_count))}
                                                                </p>
                                                                :
                                                                <p className="percentage">
                                                                    <i className="fa fa-arrow-alt-circle-down"></i>
                                                                    {this.formatNumber(parseFloat(this.formerSystemIndex.chain_count - this.state.systemIndex.chain_count))}
                                                                </p>

                                                            : <p className="percentage"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                                        }
                                                        <p className="unity">个</p>
                                                    </div>
                                                    <div>{this.formatNumber(parseFloat(this.state.chain_count))}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="parameter-box">
                                        <CornerBorder />
                                        <div className="content-box">
                                            <div>
                                                <div className="title">
                                                    <p>保护节点数</p>
                                                </div>
                                                <div className="value clearfix">
                                                    <div>
                                                        {this.formerSystemIndex ?
                                                            this.state.systemIndex.pro_node_count - this.formerSystemIndex.pro_node_count >= 0 ?
                                                                <p className="percentage">
                                                                    <i className="fa fa-arrow-alt-circle-up"></i>
                                                                    {this.formatNumber(parseFloat(this.state.systemIndex.pro_node_count - this.formerSystemIndex.pro_node_count))}
                                                                </p>
                                                                :
                                                                <p className="percentage">
                                                                    <i className="fa fa-arrow-alt-circle-down"></i>
                                                                    {this.formatNumber(parseFloat(this.formerSystemIndex.pro_node_count - this.state.systemIndex.pro_node_count))}
                                                                </p>

                                                            : <p className="percentage"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                                        }
                                                        <p className="unity">个</p>
                                                    </div>
                                                    <div>{this.formatNumber(parseFloat(this.state.pro_node_count))}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="right-container">
                                    <div className="parameter-box">
                                        <CornerBorder />
                                        <div className="content-box">
                                            <div>
                                                <div className="title">
                                                    <p>白名单总数</p>
                                                </div>
                                                <div className="value clearfix">
                                                    <div>
                                                        {this.formerSystemIndex ?
                                                            this.state.systemIndex.whitelist_count - this.formerSystemIndex.whitelist_count >= 0 ?
                                                                <p className="percentage">
                                                                    <i className="fa fa-arrow-alt-circle-up"></i>
                                                                    {this.formatNumber(parseFloat(this.state.systemIndex.whitelist_count - this.formerSystemIndex.whitelist_count))}
                                                                </p>
                                                                :
                                                                <p className="percentage">
                                                                    <i className="fa fa-arrow-alt-circle-down"></i>
                                                                    {this.formatNumber(parseFloat(this.formerSystemIndex.whitelist_count - this.state.systemIndex.whitelist_count))}
                                                                </p>

                                                            : <p className="percentage"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                                        }
                                                        <p className="unity">个</p>
                                                    </div>
                                                    <div>{this.formatNumber(parseFloat(this.state.whitelist_count))}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="parameter-box">
                                        <CornerBorder />
                                        <div className="content-box">
                                            <div>
                                                <div className="title">
                                                    <p>审计日志总数</p>
                                                </div>
                                                <div className="value clearfix">
                                                    <div>
                                                        {this.formerSystemIndex ?
                                                            this.state.systemIndex.shenji_count - this.formerSystemIndex.shenji_count >= 0 ?
                                                                <p className="percentage">
                                                                    <i className="fa fa-arrow-alt-circle-up"></i>
                                                                    {this.formatNumber(parseFloat(this.state.systemIndex.shenji_count - this.formerSystemIndex.shenji_count))}
                                                                </p>
                                                                :
                                                                <p className="percentage">
                                                                    <i className="fa fa-arrow-alt-circle-down"></i>
                                                                    {this.formatNumber(parseFloat(this.formerSystemIndex.shenji_count - this.state.systemIndex.shenji_count))}
                                                                </p>

                                                            : <p className="percentage"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                                        }
                                                        <p className="unity">个</p>
                                                    </div>
                                                    <div>{this.formatNumber(parseFloat(this.state.shenji_count))}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="parameter-box">
                                        <CornerBorder />
                                        <div className="content-box">
                                            <div>
                                                <div className="title">
                                                    <p>全球感知分数</p>
                                                </div>
                                                <div className="value clearfix">
                                                    <div>
                                                        {this.formerSystemIndex ?
                                                            this.state.systemIndex.score - this.formerSystemIndex.score >= 0 ?
                                                                <p className="percentage">
                                                                    <i className="fa fa-arrow-alt-circle-up"></i>
                                                                    {this.formatNumber(parseFloat(this.state.systemIndex.score - this.formerSystemIndex.score))}
                                                                </p>
                                                                :
                                                                <p className="percentage">
                                                                    <i className="fa fa-arrow-alt-circle-down"></i>
                                                                    {this.formatNumber(parseFloat(this.formerSystemIndex.score - this.state.systemIndex.score))}
                                                                </p>

                                                            : <p className="percentage"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                                        }
                                                        <p className="unity">个</p>
                                                    </div>
                                                    <div>{this.formatNumber(parseFloat(this.state.score))}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="parameter-box">
                                        <CornerBorder />
                                        <div className="content-box">
                                            <div>
                                                <div className="title">
                                                    <p>大数据分析总数</p>
                                                </div>
                                                <div className="value clearfix">
                                                    <div>
                                                        {this.formerSystemIndex ?
                                                            this.state.systemIndex.nisa_count - this.formerSystemIndex.nisa_count >= 0 ?
                                                                <p className="percentage">
                                                                    <i className="fa fa-arrow-alt-circle-up"></i>
                                                                    {this.formatNumber(parseFloat(this.state.systemIndex.nisa_count - this.formerSystemIndex.nisa_count))}
                                                                </p>
                                                                :
                                                                <p className="percentage">
                                                                    <i className="fa fa-arrow-alt-circle-down"></i>
                                                                    {this.formatNumber(parseFloat(this.formerSystemIndex.nisa_count - this.state.systemIndex.nisa_count))}
                                                                </p>

                                                            : <p className="percentage"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                                        }
                                                        <p className="unity">个</p>
                                                    </div>
                                                    <div>{this.formatNumber(parseFloat(this.state.nisa_count))}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                        <div className="column2">
                            <section className="left-line-group">
                                <CornerBorder />
                                {/* <div id="bar1"></div> */}
                                <p className="line-title" ><span>INFO</span><span></span></p>
                                <BarChart detail={this.state.infonum} time={this.state.infotime} />
                            </section>
                            <section className="left-line-group">
                                <CornerBorder />
                                <p className="line-title" ><span>WARN</span><span></span></p>
                                {/* <div id="bar2"></div> */}
                                <BarChart detail={this.state.warnnum} time={this.state.warntime} />
                            </section>
                            <section className="left-line-group">
                                <CornerBorder />
                                {/* <div id="bar3"></div> */}
                                <p className="line-title" ><span>ERROR</span><span></span></p>
                                <BarChart detail={this.state.errornum} time={this.state.errortime} />
                            </section>
                        </div>
                        <div className="column3">
                            <section className="top">
                                <div className="four-row-left clearfix" style={{ width: '100%' }}>
                                    {!this.state.worldMapData &&
                                        <Loading />
                                    }
                                    {
                                        this.state.worldMapData &&
                                        <WorldMap
                                            data={this.state.worldMapData}
                                        />
                                    }

                                </div>
                                {/* </div> */}

                            </section>
                            <section className="bottom">
                                <div className="parameter">
                                    <div className="corner-box">
                                        <div>
                                            <div className="title">
                                                <p>IPV4进流量</p>
                                            </div>
                                            <div className="value clearfix">
                                                <div>{this.state.systemInfo ? this.formatNumber(parseFloat(this.state.systemInfo.network_in)) : 60}</div>
                                                <div>
                                                    <p className="unity">KB/s</p>
                                                    {this.formerSystemInfo ?
                                                        this.state.systemInfo.network_in - this.formerSystemInfo.network_in >= 0 ?
                                                            <p className="percentage">
                                                                <i className="fa fa-arrow-alt-circle-up"></i>
                                                                {this.formatNumber(parseFloat(this.state.systemInfo.network_in - this.formerSystemInfo.network_in))}
                                                            </p>
                                                            :
                                                            <p className="percentage">
                                                                <i className="fa fa-arrow-alt-circle-down"></i>
                                                                {this.formatNumber(parseFloat(this.formerSystemInfo.network_in - this.state.systemInfo.network_in))}
                                                            </p>

                                                        : <p className="percentage"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="parameter">
                                    <div className="corner-box">
                                        <div>
                                            <div className="title">
                                                <p>IPV4出流量</p>
                                            </div>
                                            <div className="value clearfix">
                                                <div>{this.state.systemInfo ? this.formatNumber(parseFloat(this.state.systemInfo.network_out)) : 50}</div>
                                                <div>
                                                    <p className="unity">KB/s</p>
                                                    {this.formerSystemInfo ?
                                                        this.state.systemInfo.network_out - this.formerSystemInfo.network_out >= 0 ?
                                                            <p className="percentage">
                                                                <i className="fa fa-arrow-alt-circle-up"></i>
                                                                {this.formatNumber(parseFloat(this.state.systemInfo.network_out - this.formerSystemInfo.network_out))}
                                                            </p>
                                                            :
                                                            <p className="percentage">
                                                                <i className="fa fa-arrow-alt-circle-down"></i>
                                                                {this.formatNumber(parseFloat(this.formerSystemInfo.network_out - this.state.systemInfo.network_out))}
                                                            </p>

                                                        : <p className="percentage"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="parameter">
                                    <div className="corner-box">
                                        <div>
                                            <div className="title">
                                                <p>硬盘读</p>
                                            </div>
                                            <div className="value clearfix">
                                                <div>{this.state.systemInfo ? this.formatNumber(parseFloat(this.state.systemInfo.disk_read)) : 100}</div>
                                                <div>
                                                    <p className="unity">KB/s</p>
                                                    {this.formerSystemInfo ?
                                                        this.state.systemInfo.disk_read - this.formerSystemInfo.disk_read >= 0 ?
                                                            <p className="percentage">
                                                                <i className="fa fa-arrow-alt-circle-up"></i>
                                                                {this.formatNumber(parseFloat(this.state.systemInfo.disk_read - this.formerSystemInfo.disk_read))}
                                                            </p>
                                                            :
                                                            <p className="percentage">
                                                                <i className="fa fa-arrow-alt-circle-down"></i>
                                                                {this.formatNumber(parseFloat(this.formerSystemInfo.disk_read - this.state.systemInfo.disk_read))}
                                                            </p>

                                                        : <p className="percentage"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="parameter">
                                    <div className="corner-box">
                                        <div>
                                            <div className="title">
                                                <p>硬盘写</p>
                                            </div>
                                            <div className="value clearfix">
                                                <div>{this.state.systemInfo ? this.formatNumber(parseFloat(this.state.systemInfo.disk_write)) : 500}</div>
                                                <div>
                                                    <p className="unity">KB/s</p>
                                                    {this.formerSystemInfo ?
                                                        this.state.systemInfo.disk_write - this.formerSystemInfo.disk_write >= 0 ?
                                                            <p className="percentage">
                                                                <i className="fa fa-arrow-alt-circle-up"></i>
                                                                {this.formatNumber(parseFloat(this.state.systemInfo.disk_write - this.formerSystemInfo.disk_write))}
                                                            </p>
                                                            :
                                                            <p className="percentage">
                                                                <i className="fa fa-arrow-alt-circle-down"></i>
                                                                {this.formatNumber(parseFloat(this.formerSystemInfo.disk_write - this.state.systemInfo.disk_write))}
                                                            </p>

                                                        : <p className="percentage"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="parameter">
                                    <div className="corner-box">
                                        <div>
                                            <div className="title">
                                                <p>swap</p>
                                            </div>
                                            <div className="value clearfix">
                                                <div>{this.state.systemInfo ? this.formatNumber(parseFloat(this.state.systemInfo.used_swap_pct) * 100) : 33}</div>
                                                <div>
                                                    <p className="unity">%</p>
                                                    {this.formerSystemInfo ?
                                                        this.state.systemInfo.used_swap_pct - this.formerSystemInfo.used_swap_pct >= 0 ?
                                                            <p className="percentage">
                                                                <i className="fa fa-arrow-alt-circle-up"></i>
                                                                {this.formatNumber(parseFloat(this.state.systemInfo.used_swap_pct - this.formerSystemInfo.used_swap_pct) * 100)}
                                                            </p>
                                                            :
                                                            <p className="percentage">
                                                                <i className="fa fa-arrow-alt-circle-down"></i>
                                                                {this.formatNumber(parseFloat(this.formerSystemInfo.used_swap_pct - this.state.systemInfo.used_swap_pct) * 100)}
                                                            </p>

                                                        : <p className="percentage"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                    <div className="clearfix group2">
                        <div className="column1">
                            <CornerBorder />
                            <div className="mapAttackLsit top-list list-info">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>时间</th>
                                            <th>类型</th>
                                            <th>攻击来源IP</th>
                                            <th>攻击目标IP</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            this.state.attackRange &&
                                            this.state.attackRange.map(function (data, index) {
                                                return (

                                                    <tr key={index}>
                                                        <td>{data.time}</td>
                                                        <td>{data.attack_type}</td>
                                                        <td>{data.source_ip}</td>
                                                        <td>{data.des_ip}</td>
                                                    </tr>

                                                )
                                            })
                                        }
                                    </tbody>
                                </table>
                            </div>

                        </div>
                        <div className="column2">
                            <section className="left-part">
                                <p className="line-title" ><span>实时日志</span></p>
                                <LineChart title="实时日志" detail={this.state.lognum} time={this.state.logtime} />
                                <p className="line-title" ><span>实时网络流量总量</span></p>
                                <LineChart title="实时网络流量总量" detail={this.state.networknum} time={this.state.networktime} />
                            </section>
                            <section className="right-part">
                                <div className="right-charts-group">
                                    <div className="right-part-charts clearfix">
                                        <CornerBorder />
                                        <p className="charts-title"><span>硬盘读</span></p>
                                        <div className="pie-container">
                                            <DonutChart detail={this.state.systemInfo ? this.state.systemInfo.disk_read : 100} comparison="500" />
                                        </div>
                                        <div className="charts-info clearfix">
                                            <p className="index1">{this.state.systemInfo ? this.formatNumber(parseFloat(this.state.systemInfo.disk_read)) : 100} KB/s</p>
                                            <hr />
                                            <SmallLineChart detail={this.state.systemInfo ? this.state.systemInfo.disk_read : 100} />
                                            {this.formerSystemInfo ?
                                                this.state.systemInfo.disk_read - this.formerSystemInfo.disk_read >= 0 ?
                                                    <p className="index2">
                                                        <i className="fa fa-arrow-alt-circle-up"></i>
                                                        {this.formatNumber(parseFloat(this.state.systemInfo.disk_read - this.formerSystemInfo.disk_read))}
                                                    </p>
                                                    :
                                                    <p className="index2">
                                                        <i className="fa fa-arrow-alt-circle-down"></i>
                                                        {this.formatNumber(parseFloat(this.formerSystemInfo.disk_read - this.state.systemInfo.disk_read))}
                                                    </p>

                                                : <p className="index2"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                            }
                                        </div>
                                    </div>
                                    <div className="right-part-charts clearfix">
                                        <CornerBorder />
                                        <p className="charts-title"><span>硬盘写</span></p>
                                        <div className="pie-container">
                                            <DonutChart detail={this.state.systemInfo ? this.state.systemInfo.disk_write : 500} comparison="500" />
                                        </div>
                                        <div className="charts-info clearfix">
                                            <p className="index1">{this.state.systemInfo ? this.formatNumber(parseFloat(this.state.systemInfo.disk_write)) : 500} KB/s</p>
                                            <hr />
                                            <SmallLineChart detail={this.state.systemInfo ? this.state.systemInfo.disk_write : 500} />
                                            {this.formerSystemInfo ?
                                                this.state.systemInfo.disk_write - this.formerSystemInfo.disk_write >= 0 ?
                                                    <p className="index2">
                                                        <i className="fa fa-arrow-alt-circle-up"></i>
                                                        {this.formatNumber(parseFloat(this.state.systemInfo.disk_write - this.formerSystemInfo.disk_write))}
                                                    </p>
                                                    :
                                                    <p className="index2">
                                                        <i className="fa fa-arrow-alt-circle-down"></i>
                                                        {this.formatNumber(parseFloat(this.formerSystemInfo.disk_write - this.state.systemInfo.disk_write))}
                                                    </p>

                                                : <p className="index2"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                            }
                                        </div>
                                    </div>
                                    <div className="right-part-charts clearfix">
                                        <CornerBorder />
                                        <p className="charts-title"><span>vda</span></p>
                                        <div className="pie-container">
                                            <DonutChart detail={this.state.systemInfo ? this.state.systemInfo.vda : 400} comparison="500" />
                                        </div>
                                        <div className="charts-info clearfix">
                                            <p className="index1">{this.state.systemInfo ? this.formatNumber(parseFloat(this.state.systemInfo.vda)) : 400} KB/s</p>
                                            <hr />
                                            <SmallLineChart detail={this.state.systemInfo ? this.state.systemInfo.vda : 400} />
                                            {this.formerSystemInfo ?
                                                this.state.systemInfo.vda - this.formerSystemInfo.vda >= 0 ?
                                                    <p className="index2">
                                                        <i className="fa fa-arrow-alt-circle-up"></i>
                                                        {this.formatNumber(parseFloat(this.state.systemInfo.vda - this.formerSystemInfo.vda))}
                                                    </p>
                                                    :
                                                    <p className="index2">
                                                        <i className="fa fa-arrow-alt-circle-down"></i>
                                                        {this.formatNumber(parseFloat(this.formerSystemInfo.vda - this.state.systemInfo.vda))}
                                                    </p>

                                                : <p className="index2"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className="right-charts-group">
                                    <div className="right-part-charts clearfix">
                                        <CornerBorder />
                                        <p className="charts-title"><span>CPU占有率</span></p>
                                        <div className="pie-container">
                                            <DonutChart detail={this.state.systemInfo ? (this.state.systemInfo.used_cpu_pct * 100).toFixed(2) : 20} comparison="50" />
                                        </div>
                                        <div className="charts-info clearfix">
                                            <p className="index1">{this.state.systemInfo ? (this.state.systemInfo.used_cpu_pct * 100).toFixed(2) : 20} %</p>
                                            <hr />
                                            <SmallLineChart detail={this.state.systemInfo ? (this.state.systemInfo.used_cpu_pct * 1000).toFixed(2) : 20} />
                                            {this.formerSystemInfo ?
                                                this.state.systemInfo.used_cpu_pct - this.formerSystemInfo.used_cpu_pct >= 0 ?
                                                    <p className="index2">
                                                        <i className="fa fa-arrow-alt-circle-up"></i>
                                                        {this.formatNumber(parseFloat(this.state.systemInfo.used_cpu_pct - this.formerSystemInfo.used_cpu_pct) * 100)}
                                                    </p>
                                                    :
                                                    <p className="index2">
                                                        <i className="fa fa-arrow-alt-circle-down"></i>
                                                        {this.formatNumber(parseFloat(this.formerSystemInfo.used_cpu_pct - this.state.systemInfo.used_cpu_pct) * 100)}
                                                    </p>

                                                : <p className="index2"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                            }
                                        </div>
                                    </div>
                                    <div className="right-part-charts clearfix">
                                        <CornerBorder />
                                        <p className="charts-title"><span>I/O变化率</span></p>
                                        <div className="pie-container">
                                            <DonutChart detail={this.state.systemInfo ? (parseFloat(this.state.systemInfo.disk_write) + parseFloat(this.state.systemInfo.disk_read)) : 600} comparison="500" />
                                        </div>
                                        <div className="charts-info clearfix">
                                            <p className="index1">{this.state.systemInfo ? this.formatNumber(parseFloat(this.state.systemInfo.disk_write) + parseFloat(this.state.systemInfo.disk_read)) : 600} KB/s</p>
                                            <hr />
                                            <SmallLineChart detail={this.state.systemInfo ? (parseFloat(this.state.systemInfo.disk_write) + parseFloat(this.state.systemInfo.disk_read)) : 600} />
                                            {this.formerSystemInfo ?
                                                (this.state.systemInfo.disk_write - this.formerSystemInfo.disk_write) + (this.state.systemInfo.disk_read - this.formerSystemInfo.disk_read) >= 0 ?
                                                    <p className="index2">
                                                        <i className="fa fa-arrow-alt-circle-up"></i>
                                                        {this.formatNumber(parseFloat((this.state.systemInfo.disk_write - this.formerSystemInfo.disk_write) + (this.state.systemInfo.disk_read - this.formerSystemInfo.disk_read)))}
                                                    </p>
                                                    :
                                                    <p className="index2">
                                                        <i className="fa fa-arrow-alt-circle-down"></i>
                                                        {this.formatNumber(parseFloat((this.formerSystemInfo.disk_write - this.state.systemInfo.disk_write) + (this.formerSystemInfo.disk_read - this.state.systemInfo.disk_read)))}
                                                    </p>

                                                : <p className="index2"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                            }
                                        </div>
                                    </div>
                                    <div className="right-part-charts clearfix">
                                        <CornerBorder />
                                        <p className="charts-title"><span>内存占有率</span></p>
                                        <div className="pie-container">
                                            <DonutChart detail={this.state.systemInfo ? (this.state.systemInfo.used_mem_pct * 100).toFixed(2) : 10} comparison="50" />
                                        </div>
                                        <div className="charts-info clearfix">
                                            <p className="index1">{this.state.systemInfo ? (this.state.systemInfo.used_mem_pct * 100).toFixed(2) : 10} %</p>
                                            <hr />
                                            <SmallLineChart detail={this.state.systemInfo ? (this.state.systemInfo.used_mem_pct * 100).toFixed(2) : 10} />
                                            {this.formerSystemInfo ?
                                                this.state.systemInfo.used_mem_pct - this.formerSystemInfo.used_mem_pct >= 0 ?
                                                    <p className="index2">
                                                        <i className="fa fa-arrow-alt-circle-up"></i>
                                                        {this.formatNumber(parseFloat(this.state.systemInfo.used_mem_pct - this.formerSystemInfo.used_mem_pct) * 100)}
                                                    </p>
                                                    :
                                                    <p className="index2">
                                                        <i className="fa fa-arrow-alt-circle-down"></i>
                                                        {this.formatNumber(parseFloat(this.formerSystemInfo.used_mem_pct - this.state.systemInfo.used_mem_pct) * 100)}
                                                    </p>

                                                : <p className="index2"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                    {/* <div className='shortcutSection'>
                        <Shortcut src='/static/img/topbar/defence.png' txtDes='可信防护' href='/environment' />
                        <Shortcut src='/static/img/topbar/dataCenter.png' txtDes='信息中心' href='/infoCenter' />
                        <Shortcut src='/static/img/topbar/globle.png' txtDes='全球态势感知' href='/3Dmap' />
                        <Shortcut src='/static/img/topbar/blockchain.png' txtDes='区块链服务' href='/blockchain' />
                        <Shortcut src='/static/img/topbar/UEBA.png' txtDes='大数据用户行为分析' href='/bigData' />
                    </div> */}

                    {/* <div className="databaseScore ">
                        <h2 className="title">系统可信指数</h2>
                        <div className="scoreContent clearfix">
                            <TotalScoreBox />
                            <div className="sampleText">
                                {sampleLeft}
                            </div>
                            <div className="sampleText">
                                {sampleRight}
                            </div>
                        </div>
                    </div>

                    <div className="clearfix">
                        <div className="radarPart">
                            <h2 className="attackTitle">防御安全雷达图</h2>
                            <Radarchart attackNumTotal={this.state.attackNumTotal} />
                        </div>
                        <div className="totalAttack">
                            <h2 className="attackTitle">每日拦截威胁次数</h2>
                            <ul className="attacktitlemenu">
                                <li className="attackMore"><span className="attackspan"></span>威胁数量过多</li>
                                <li className="attackNormal"><span className="attackspan"></span>常规威胁数量</li>
                            </ul>
                            <Totalattack attackNumDays={this.state.attackNumDays} />
                        </div>
                        <div className="typeAttack">
                            <h2 className="attackTitle">攻击类型统计</h2>
                            <Typeattack attackNumWeek={this.state.attackNumWeek} />
                        </div>
                        <div className="firstChartPart">
                            <h2 className="attackTitle">攻击来源占比</h2>
                            <Orinalattack attackNumCity={this.state.attackNumCity} />
                        </div>
                    </div> */}

                    {/* <div className="home-four-row">
                        <div className="four-row-left clearfix" style={{ width: '100%' }}>
                            <h2 className="four-left-tip">地理位置相关图表</h2>
                            {!this.state.worldMapData &&
                                <Loading />
                            }
                            {
                                this.state.worldMapData &&
                                <WorldMap
                                    data={this.state.worldMapData}
                                />
                            }

                        </div>
                    </div> */}

                </div>



                {/* 3D地图 ---start*/}
                {/* <DMapModal /> */}
                {/* 3D地图 ---end*/}
            </section>
        )
    }
}





class Shortcut extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }
    componentWillMount() {
        require('../utils/tilt.jquery')
    }
    componentDidMount() {
        // const tilt = $('.js-tilt').tilt();
    }

    render() {
        return (
            <a className='shorcut js-tilt' href={this.props.href} data-tilt-scale="0.9" >
                <img src={this.props.src} />
                <div>{this.props.txtDes}</div>
            </a>
        )
    }

}