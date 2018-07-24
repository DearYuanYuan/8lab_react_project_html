import React from "react";
import $ from 'jquery';
import echarts from "echarts"
import BottomPie1 from './mapAttack/Bottom-pie1'
import BottomPie2 from './mapAttack/Bottom-pie2'
import BottomPie3 from './mapAttack/Bottom-pie3'
import BottomPie4 from './mapAttack/Bottom-pie4'
import BottomPie5 from './mapAttack/Bottom-pie5'
import BottomRightPie from './mapAttack/BottomRightPie'
import MapAttackRightPie from './MapAttackRightPie'
import CornerBorder from './home/CornerBorder'
import RightLine from './mapAttack/RightLine'
import RightDonut from './mapAttack/RightDonut'

export default class MapAttack extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showAttackBox: true,//弹框显示隐藏
            attactRange: false,//攻击来源列表
            todayAttactNum: false,//今日拦截数
            todayInterceptNum: false,//今日警告数
            cityAttackRange: [],//攻击排行

            BottomPieHttp: 0,//初始化http防御
            BottomPieWeb:0,//初始化web防御
            BottomPieDos:0,//初始化dos攻击
            BottomPieSensitive:0,//初始化敏感数据攻击
            BottomPieError:0,//初始化错误

            dos_attackList:[0,0,0,0,0,0,0],//一周内dos攻击列表
            http_defenseList:[0,0,0,0,0,0,0],//一周内http攻击列表
            week_defenseTime:['周一','周二','周三','周四','周五','周六','周日'],//获取最近一周的时间

            todayAttackNumPie:0,//今日拦截数
            yesterdayAttackNumPie:0,//昨日拦截数
            thisWeekAttackNumPie:0,//本周拦截数
            lastWeekAttackNumPie:0,//上周拦截数
            thisMounthAttackNumPie:0,//本月拦截数
            lastMounthAttackNumPie:0,//上月拦截数

            todayAverageMinute:0,//今日每分钟平均拦截
            mounthTodayAverageMinute:0,//本月每日每分钟平均拦截
            mounthAverageMinute:0,//本月每分钟平均拦截
        }

    };
    //今日拦截威胁数
    gerAttrackDate() {
        var self = this;
        $.ajax({
            url: '/api/get_attack_map/get_watcherlab_statics/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function (data) {
                self.setState({
                    todayAttactNum: data.intercepted,
                    todayInterceptNum: '试用版'
                })
                // console.log(data)
            }
        })
    }

    //入侵来源地排序
    getAcctactCityRange() {
        var self = this;
        $.ajax({
            url: '/api/get_attack_map/get_watcherlab_top_percent/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function (data) {
                self.setState({
                    cityAttackRange: data,
                })
                // console.log(data)
            }
        })
    }
    //关闭弹框
    closeThisBox() {
        // this.setState({
        //      showAttackBox:false
        // });
        window.history.go(-1)
    }
    formtGCData(geoData, data, srcNam, dest) {
        var tGeoDt = [];
        if (dest) {
            for (var i = 0; i < data.length; i++) {
                if (srcNam != data[i].name) {
                    tGeoDt.push({
                        coords: [geoData[srcNam], geoData[data[i].name]]
                    });
                }
            }
        } else {
            for (var j = 0; j < data.length; j++) {
                if (srcNam != data[j].name) {
                    tGeoDt.push({
                        coords: [geoData[data[j].name], geoData[srcNam]]
                    });
                }
            }
        }
        return tGeoDt;
    }
    formtVData(geoData, data, srcNam) {
        var tGeoDt = [];
        for (var i = 0, len = data.length; i < len; i++) {
            var tNam = data[i].name
            if (srcNam != tNam) {
                tGeoDt.push({
                    name: tNam,
                    value: geoData[tNam]
                });
            }

        }
        tGeoDt.push({
            name: srcNam,
            value: geoData[srcNam],
            symbolSize: 0,
            itemStyle: {
                normal: {
                    color: '#000',
                    borderColor: '#fff'
                }
            }
        });
        return tGeoDt;
    }
    //攻击地图参数配置
    attackMapOptionSet(){
        //引入世界地图
        require("../utils/world");
        //初始化攻击地点的经纬度
        var geoCoordMap = {
            '北京': [116.4551, 40.2539]
        };
        //初始化攻击地点：北京
        var data = [{
            name: '北京',
        }];
        //中间地图配置
        this.option = {

            backgroundColor: '#252830',
            tooltip: {
                trigger: 'item',
                formatter: function (params) {
                    if (params.name == '') {
                        return;
                    } else {
                        return "入侵IP：" + params.name + "<br/>入侵坐标：" + params.data.value;
                    }
                }
            },
            geo: {
                map: 'world',
                silent: true,
                top: 10,
                left: 10,
                right: 10,
                bottom: 30,
                //roam: true,//缩放
                itemStyle: {
                    normal: {
                        opacity: 0.8,
                        borderWidth: 1,
                        borderColor: '#444851',
                        color: '#2E323C'
                    },
                    emphasis: {
                        areaColor: '#2a333d'
                    }
                }
            },
            series: [{
                name: '',
                type: 'lines',
                coordinateSystem: 'geo',
                zlevel: 2,
                large: true,
                rippleEffect: {
                    brushType: 'stroke'
                },

                effect: {
                    show: true,
                    constantSpeed: 50,
                    symbol: 'arrow',//ECharts 提供的标记类型包括 'circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow'
                    symbolSize: 8,
                    trailLength: 0,
                },
                lineStyle: {
                    normal: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            offset: 0, color: '#58B3CC'
                        }, {
                            offset: 1, color: '#F5A623'
                        }], false),
                        width: 2,
                        opacity: 0.8,
                        curveness: 0.2
                    }
                },
                data: this.formtGCData(geoCoordMap, data, '北京', false)
            }, {
                name: '',
                type: 'effectScatter',
                coordinateSystem: 'geo',
                zlevel: 2,
                rippleEffect: {
                    brushType: 'stroke',
                    period: 7,
                    scale: 4
                },
                label: {
                    normal: {
                        show: false,
                        position: 'right',
                        formatter: '{b}'
                    },
                    emphasis: {
                        show: true,
                        position: 'right',
                        formatter: '{b}'
                    }
                },
                symbolSize: 8,
                showEffectOn: 'render',
                itemStyle: {
                    normal: {
                        color: '#F5A623',
                        borderColor: '#F5A623'
                    }
                },
                data: this.formtVData(geoCoordMap, data, '北京')
            }]
        };
    }
    //后台请求获取攻击数据来源
    getAttrackDate() {
        var self = this;
        $.ajax({
            url: '/api/get_attack_map/get_watcher_info/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function (data) {
                // console.log(JSON.stringify(data))
                var geoCoordMap = { '北京': [116.4551, 40.2539] }
                var geoData = [{ name: '北京' }]
                var arr
                var brr
                var attactRange = []
                for (var i = 0; i < data.length; i++) {
                    //处理获得地图数据
                    geoCoordMap[data[i].location + data[i].source_ip] = [Number(data[i].source_lng), Number(data[i].source_lat)];
                    geoData.push({ name: data[i].location + data[i].source_ip })

                    //处理获得攻击列表数据
                    attactRange[i] = {
                        time: data[i].occur_time,
                        location: data[i].location,
                        source_ip: data[i].source_ip,
                        des_ip: data[i].des_ip,
                        attack_type: data[i].attack_type
                    }

                    if (i == data.length - 1) {
                        arr = self.formtGCData(geoCoordMap, geoData, '北京', false);
                        brr = self.formtVData(geoCoordMap, geoData, '北京')
                        self.option.series[0].data = arr;
                        self.option.series[1].data = brr;
                        var chart = echarts.init(document.getElementById('mapAttack'));
                        chart.setOption(self.option);

                        self.setState({
                            attactRange: attactRange
                        })
                    }


                }
                var centerScrollContent = $(".center-scroll-content");
                self.initCenterAnimation(centerScrollContent);
                var topScrollContent = $(".top-scroll-content");
                self.initTopAnimation(topScrollContent);
            }
        })

    }

    /** 
     * 初始化日志轮播的动画
     * 只有在第一次加载日志数据时，初始化轮播动画
     */
    initCenterAnimation(ele){
        var self=this   
        let scrollBox = ele   
        //只有在第一次加载日志数据时，设置轮播动画
        //this.logIsPaused 用于避免在动画暂停时（此时满足 !this.logAnimeInterval），重新又设置了动画
        if(!this.logAnimeInterval && !this.logIsPaused){ 
            scroll()    //开始滚动
            this.logAnimeInterval = setInterval(scroll,6000)    //循环的轮播日志
            scrollBox.mouseenter(pause).mouseleave(restart)
        }
        //向上滚动
        function scroll(){       
            if ( -scrollBox.height()+$('.center-list').height() < 0 ) {
                scrollBox.animate(
                    {marginTop:-scrollBox.height()+$('.center-list').height()}, 
                    6000, 
                    "linear", 
                    function(){scrollBox.css({marginTop:0})}  //动画结束时回到其实位置
                )
            } else {
                scrollBox.animate(
                    {marginTop:-scrollBox.height()}, 
                    6000, 
                    "linear", 
                    function(){scrollBox.css({marginTop:0})}  //动画结束时回到其实位置
                )
            } 
        }
        //暂停动画
        function pause(){   
            if(self.logAnimeInterval){
                self.logAnimeInterval=window.clearInterval(self.logAnimeInterval)    //取消定时器
                scrollBox.stop()  //停止动画
                self.logIsPaused = true
            }
        }
        //重新开始动画
        function restart(){ 
            if(!self.logAnimeInterval){
                scroll()    //开始滚动
                self.logAnimeInterval = setInterval(scroll,6000)    //重新开始定时器
                self.logIsPaused = false
            }
        }
    }

    initTopAnimation(ele){
        var self=this   
        let topScrollBox = ele   
        //只有在第一次加载日志数据时，设置轮播动画
        //this.logIsPaused 用于避免在动画暂停时（此时满足 !this.logAnimeInterval），重新又设置了动画
        if(!this.topAnimeInterval && !this.topIsPaused){ 
            scroll()    //开始滚动
            this.topAnimeInterval = setInterval(scroll,6000)    //循环的轮播日志
            topScrollBox.mouseenter(pause).mouseleave(restart)
        }
        //向上滚动
        function scroll(){   
            if (-topScrollBox.height()+$('.top-list').height() < 0 ) {
                topScrollBox.animate(
                    {marginTop:-topScrollBox.height()+$('.top-list').height()}, 
                    6000, 
                    "linear", 
                    function(){topScrollBox.css({marginTop:0})}  //动画结束时回到其实位置
                )
            } else {
                topScrollBox.animate(
                    {marginTop:-topScrollBox.height()}, 
                    6000, 
                    "linear", 
                    function(){topScrollBox.css({marginTop:0})}  //动画结束时回到其实位置
                )
            }      
           
        }
        //暂停动画
        function pause(){   
            if(self.topAnimeInterval){
                self.topAnimeInterval=window.clearInterval(self.topAnimeInterval)    //取消定时器
                topScrollBox.stop()  //停止动画
                self.topIsPaused = true
            }
        }
        //重新开始动画
        function restart(){ 
            if(!self.topAnimeInterval){
                scroll()    //开始滚动
                self.topAnimeInterval = setInterval(scroll,6000)    //重新开始定时器
                self.topIsPaused = false
            }
        }
    }

    // 左边折线图配置
    leftLineOptionSet(){
        this.optionLeftLine = {
            animation: true,
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    label: {
                        backgroundColor: '#283b56'
                    }
                }
            },
            legend: {
                data:['http攻击', 'Dos攻击','web攻击','敏感数据','应用程序鉴定'],
                top:10,
                left:24,
                textStyle:{
                    color:"#fff"
                }
            },
            calculable : false,
            xAxis: [
                {
                    type: 'category',
                    boundaryGap: false,//坐标轴留白
                    splitLine: {
                        show: true,
                        lineStyle:{
                            color:"#444851"
                        }
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#a1a6ad'
                        }
                    },
                    data: ['周一','周二','周三','周四','周五','周六','周日'],
                    // axisLine: {
                    //     show: false,

                    // },
                    // axisLabel: {
                    //     show: false,
                    // },
                    axisTick: {
                        show: false,
                    }
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    scale: true,
                    name: '',
                    // max:parseInt(Math.max.apply(null,maxTotal)*1.5 ),
                    min: 0,
                    splitLine: {
                        show: true,
                        lineStyle:{
                            color:"#444851"
                        }
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#a1a6ad'
                        }
                    },
                    boundaryGap: [0.2, 0.2],
                    // axisLine: {
                    //     show: false,

                    // },
                    // axisLabel: {
                    //     show: false,
                    // },
                    axisTick: {
                        show: false,
                    }
                }
            ],
            series: [
                {
                    name:'http攻击',
                    type:'line',
                    symbol: 'none',
                    smooth: true,
                    itemStyle: {
                        normal: {
                            color: "#A1A6AD"
                        }
                    },
                    lineStyle: {
                        normal: {
                            color: "#A1A6AD"
                        }
                    },
                    areaStyle: {
                        normal: {
                            color: "#A1A6AD",
                            opacity: 0.1
                        }
                    },
                    data:[0,0,0,0,0,0,0]
                },
                {
                    name:'Dos攻击',
                    type:'line',
                    symbol: 'none',
                    smooth: true,
                    itemStyle: {
                        normal: {
                            color: "#F28321"
                        }
                    },
                    lineStyle: {
                        normal: {
                            color: "#F28321"
                        }
                    },
                    areaStyle: {
                        normal: {
                            color: "#F28321",
                            opacity: 0.1
                        }
                    },
                    data:[0,0,0,0,0,0,0]
                }
            ]
        };
    }
    //获取左侧折线图，一周内的攻击趋势图
    getWeekAttractList(){
        var self = this;
        $.ajax({
            url: '/api/attack_week_detail/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function (data) {

                self.setState({
                    dos_attackList:data.dos_count,//一周内dos攻击列表
                    http_defenseList:data.http_count,//一周内http攻击列表
                    week_defenseTime:data.time, //一周内日期
                })


                // 绘制左边内容的线图
                self.optionLeftLine.xAxis[0].data = data.time
                self.optionLeftLine.series[0].data = data.http_count
                self.optionLeftLine.series[1].data = data.dos_count


                var line_chart = echarts.init(document.getElementById('left-line-chart'));
                line_chart.setOption(self.optionLeftLine, true);

            },

            error:function(){

            }
        })
    }
    //获取今日，昨日，一周，上周，一个月，上个月的攻击次数占比
    getAttackListPercent(){
        var self = this;
        $.ajax({
            url: '/api/get_watcherlab_statistic/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function (data) {
                self.setState({
                    todayAttackNumPie:data.today || 0,//今日拦截数
                    yesterdayAttackNumPie:data.yesterday || 0,//昨日拦截数
                    thisWeekAttackNumPie:data.present_week || 0,//本周拦截数
                    lastWeekAttackNumPie:data.last_week || 0,//上周拦截数
                    thisMounthAttackNumPie:data.present_month || 0,//本月拦截数
                    lastMounthAttackNumPie:data.last_month || 0,//上月拦截数
                })

                // console.log(JSON.stringify(data))
            },
            error:function(){
                self.setState({
                    todayAttackNumPie:0,//今日拦截数
                    yesterdayAttackNumPie:0,//昨日拦截数
                    thisWeekAttackNumPie:0,//本周拦截数
                    lastWeekAttackNumPie:0,//上周拦截数
                    thisMounthAttackNumPie:0,//本月拦截数
                    lastMounthAttackNumPie:0,//上月拦截数
                })
            }
        })
    }
    //获取web，http，dos等攻击占比
    getAttackFiveList(){
        var self = this;
        $.ajax({
            url: '/api/get_attack_pct/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function (data) {
                self.setState({
                    BottomPieHttp: parseInt(data['http-defense']*100) || 0,//http防御
                    BottomPieWeb:parseInt(data['web-attack']*100) || 0,//web防御
                    BottomPieDos:parseInt(data['dos-attack']*100) || 0,//dos攻击
                    BottomPieError:parseInt(data['identification-error']*100) || 0,//error
                    BottomPieSensitive:parseInt(data['sensitive-data-tracking']*100) || 0,//敏感数据攻击
                })


                // console.log(JSON.stringify(data))
            },
            error:function(){
                self.setState({
                    BottomPieHttp: 0,//http防御
                    BottomPieWeb:0,//web防御
                    BottomPieDos:0,//dos攻击
                    BottomPieSensitive:0,//敏感数据攻击
                    BottomPieError:0,//错误
                })
            }
        })
    }
    //获取每日每周每月拦截数
    getDefenseNum(){
        var self = this;
        $.ajax({
            url: '/api/get_watherlab_average/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function (data) {
                //             todayAverageMinute:0,//今日每分钟平均拦截
                // mounthTodayAverageMinute:0,//本月每日每分钟平均拦截
                // mounthAverageMinute:0,//本月每分钟平均拦截
                self.setState({
                    todayAverageMinute:data.pre_minute_of_today || 0,//今日每分钟平均拦截
                    mounthTodayAverageMinute:data.pre_day || 0,//本月每日每分钟平均拦截
                    mounthAverageMinute:data.pre_minute_of_month || 0,//本月每分钟平均拦截
                })
                // console.log(JSON.stringify(data))
            },
            error:function(){

            }
        })
    }

    componentWillMount() {
        //攻击地图参数配置
        this.attackMapOptionSet()

        //获取攻击地点来源，绘制echarts
        this.getAttrackDate()

        //获取攻击地点排行
        this.getAcctactCityRange()

        // 左边折线图配置
        this.leftLineOptionSet()

        //获取左侧折线图，一周内的攻击趋势图
        this.getWeekAttractList()

        //获取今日，昨日，一周，上周，一个月，上个月的攻击次数占比
        this.getAttackListPercent()

        //获取web，http，dos等攻击占比
        this.getAttackFiveList()

        //获取每日每周每月拦截数
        this.getDefenseNum()

        //获取今日拦截数
        this.gerAttrackDate();
        
        
        
    }


    componentDidMount() {
        //修改页面title
        document.title = '全球态势感知'
        //定时15s刷新地球攻击数据
        this.changeRelate = setInterval(this.getAttrackDate.bind(this),15000)

        //绘制中间地图
        var chart = echarts.init(document.getElementById('mapAttack'));
        chart.setOption(this.option);

        // 绘制左边内容的线图
        var line_chart = echarts.init(document.getElementById('left-line-chart'));
        line_chart.setOption(this.optionLeftLine, true);

        //自适应改变图表大小
        $(window).resize(function() {
            //重置容器高宽
            //地图
            chart.resize({
                width:chart.clientWidth
            })
            //左侧折线图
            line_chart.resize({
                width:line_chart.clientWidth
            })
            //底部饼图
            //底部折线图
            var bottomLine1 = echarts.init(document.getElementById('Bottom-Line1'))
            bottomLine1.resize({
                width:bottomLine1.clientWidth
            })
            var bottomPie1 = echarts.init(document.getElementById('Bottom-pie1'))
            bottomPie1.resize({
                width:bottomPie1.clientWidth
            })
            var bottomLine2 = echarts.init(document.getElementById('Bottom-Line2'))
            bottomLine2.resize({
                width:bottomLine2.clientWidth
            })
            var bottomPie2 = echarts.init(document.getElementById('Bottom-pie2'))
            bottomPie2.resize({
                width:bottomPie2.clientWidth
            })
            var bottomLine3 = echarts.init(document.getElementById('Bottom-Line3'))
            bottomLine3.resize({
                width:bottomLine3.clientWidth
            })
            var bottomPie3 = echarts.init(document.getElementById('Bottom-pie3'))
            bottomPie3.resize({
                width:bottomPie3.clientWidth
            })
            var bottomLine4 = echarts.init(document.getElementById('Bottom-Line4'))
            bottomLine4.resize({
                width:bottomLine4.clientWidth
            })
            var bottomPie4 = echarts.init(document.getElementById('Bottom-pie4'))
            bottomPie4.resize({
                width:bottomPie4.clientWidth
            })
            var bottomLine5 = echarts.init(document.getElementById('Bottom-Line5'))
            bottomLine5.resize({
                width:bottomLine5.clientWidth
            })
            var bottomPie5 = echarts.init(document.getElementById('Bottom-pie5'))
            bottomPie5.resize({
                width:bottomPie5.clientWidth
            })
            //底部线图
            var chartLine1 = echarts.init(document.getElementById('hijackAttack-Line1'));
            chartLine1.resize({
                width:bottomPie5.clientWidth
            })
            var chartLine2 = echarts.init(document.getElementById('hijackAttack-Line2'));
            chartLine2.resize({
                width:bottomPie5.clientWidth
            })
            var chartLine3 = echarts.init(document.getElementById('hijackAttack-Line3'));
            chartLine3.resize({
                width:bottomPie5.clientWidth
            })
        });
    }

    componentWillUnmount() {
        clearInterval(this.changeRelate)    //清除定时器
        //去除当前定时器
        if(this.logAnimeInterval){
            clearInterval(this.logAnimeInterval)
        } 
        //去除当前定时器
        if(this.topAnimeInterval){
            clearInterval(this.topAnimeInterval)
        } 
    }

    render() {
        return (
            <div className="MapFeel clearfix" style={{ display: this.state.showAttackBox ? 'block' : 'none' }}>
                <p className="closeMapAttack" onClick={this.closeThisBox.bind(this)}>×</p>
                <div className="left-attack-content clearfix">
                    <p className="attack-compony clearfix">安全防御系统正在工作 <span className="right-time">运行时间:72d 11:12:52</span></p>
                    <h1>系统安全</h1>
                    <div className="clearfix">
                        <div className="cont-num-attack clearfix">
                            <p>今日拦截威胁数</p>
                            <h2>{this.state.todayAttactNum}</h2>
                            <div className="left-num-list">
                                <p>较昨日拦截数</p>
                                <h3>{this.state.todayInterceptNum}</h3>
                            </div>
                            <div className="right-num-list clearfix">
                                <p className="current-num-attack" style={{ height: '80px' }} ></p>
                                <p className="normal-num-attack" style={{ height: '120px' }}></p>
                            </div>
                        </div>
                        <div className="cont-num-attack clearfix">
                            <p>今日告警数</p>
                            <h2>{this.state.todayInterceptNum}</h2>
                            <div className="left-num-list">
                                <p>较昨日警告数</p>
                                <h3>{this.state.todayInterceptNum}</h3>
                            </div>
                            <div className="right-num-list clearfix">
                                <p className="current-num-attack" style={{ height: '126px' }} ></p>
                                <p className="normal-num-attack" style={{ height: '120px' }}></p>
                            </div>
                        </div>
                    </div>
                    <ul className="attack-list-type">
                        <li><p className="clearfix">Dos 攻击防护 <button>已激活</button> <span className="type-state">运行正常</span> </p> </li>
                        <li><p className="clearfix">Http 防御 <button>已激活</button> <span className="type-state">运行正常</span> </p> </li>
                        <li><p className="clearfix">Web 攻击防护 <button>已激活</button> <span className="type-state">运行正常</span> </p> </li>
                        <li><p className="clearfix">敏感数据追踪 <button>已激活</button> <span className="type-state">运行正常</span> </p> </li>
                        <li><p className="clearfix">应用程序鉴定和检测<button>已激活</button> <span className="type-state">运行正常</span> </p> </li>
                    </ul>
                    <h3 className="attck-range">入侵排行</h3>
                    <div className="attck-city-range">
                        <h4>入侵来源地排序</h4>
                        <ul>
                            {
                                this.state.cityAttackRange &&
                                this.state.cityAttackRange.map((data, index) => {
                                    return (
                                        <li key={index}>{data.name}
                                            <p className="range-bar-cover"><span className="range-bar-over" style={{ width: data.percent + '%' }}></span></p>
                                            <span className="range-percent-over"> {data.percent}%</span>
                                        </li>
                                    )
                                })
                            }

                        </ul>
                    </div>
                    <section className="left-line-group">
                        <CornerBorder />
                        <div id="left-line-chart"></div>
                    </section>
                </div>
                <div className="right-attack-content">
                    <section className="top-list-container">
                        <CornerBorder />
                        <div className="mapAttackLsit top-list">
                            <table>
                                <thead>
                                <tr>
                                    <th width="35%">时间</th>
                                    <th width="20%">类型</th>
                                    <th width="25%">攻击来源IP</th>
                                    <th width="25%">攻击目标IP</th>
                                </tr>
                                </thead>
                                {/* <tbody>
                                    <tr>
                                        <td>2018-03-23 19:32:32</td>
                                        <td>http-defense</td>
                                        <td>60.23.46.24</td>
                                        <td>223.72.98.253</td>
                                    </tr>
                                </tbody> */}
                            </table>
                            <table className="top-scroll-content" >   
                                <tbody>
                                {
                                    this.state.attactRange &&
                                    this.state.attactRange.map(function(data,index){
                                        return (

                                            <tr key={index}>
                                                <td width="35%">{data.time}</td>
                                                <td width="20%">{data.attack_type}</td>
                                                <td width="25%">{data.source_ip}</td>
                                                <td width="25%">{data.des_ip}</td>
                                            </tr>

                                        )
                                    })
                                }
                                </tbody>
                            </table>
                        </div>
                    </section>
                    
                    <div className="right-charts-group">
                        <div className="right-part-charts clearfix">
                            <CornerBorder />
                            <p className="charts-title"><span>今日拦截威胁数</span></p>
                            <div className="pie-container">
                                {/* <div id="right-pie-chart1" className="right-pie-chart"></div> */}
                                <RightDonut AttackNumPie = {this.state.todayAttackNumPie}/>
                            </div>
                            {/* <MapAttackRightPie echartsPie={this.state.echartsPie} /> */}
                            <div className="charts-info clearfix">
                                <p className="index1">{this.state.todayAttackNumPie}</p>
                                {/* <div id="right-line-chart1" className="right-line-chart"></div> */}
                                <RightLine AttackNumLine = {this.state.todayAttackNumPie}/>
                                {
                                    this.state.todayAttackNumPie !=0 &&
                                    <p className="index2">{((this.state.yesterdayAttackNumPie-this.state.todayAttackNumPie)*100/this.state.todayAttackNumPie).toFixed(2)}%</p>
                                }

                            </div>
                        </div>
                        <div className="right-part-charts clearfix">
                            <CornerBorder />
                            <p className="charts-title"><span>昨日拦截威胁数</span></p>
                            <div className="pie-container">
                                {/* <div id="right-pie-chart2" className="right-pie-chart"></div> */}
                                <RightDonut AttackNumPie = {this.state.yesterdayAttackNumPie} />
                            </div>
                            {/* <MapAttackRightPie echartsPie={this.state.echartsPie} /> */}
                            <div className="charts-info clearfix">
                                <p className="index1">{this.state.yesterdayAttackNumPie}</p>
                                {/* <div id="right-line-chart2" className="right-line-chart"></div> */}
                                <RightLine AttackNumLine = {this.state.yesterdayAttackNumPie} />
                                {/*<p className="index2">0.3%</p>*/}
                            </div>
                        </div>
                    </div>
                    <hr />
                    <div className="right-charts-group">
                        <div className="right-part-charts clearfix">
                            <CornerBorder />
                            <p className="charts-title"><span>本周拦截威胁数</span></p>
                            <div className="pie-container">
                                {/* <div id="right-pie-chart3" className="right-pie-chart"></div> */}
                                <RightDonut AttackNumPie = {this.state.thisWeekAttackNumPie} />
                            </div>
                            {/* <MapAttackRightPie echartsPie={this.state.echartsPie} /> */}
                            <div className="charts-info clearfix">
                                <p className="index1">{this.state.thisWeekAttackNumPie}</p>
                                {/* <div id="right-line-chart3" className="right-line-chart"></div> */}
                                <RightLine AttackNumLine = {this.state.thisWeekAttackNumPie} />
                                {
                                    this.state.thisWeekAttackNumPie !=0 &&
                                    <p className="index2">{((this.state.lastWeekAttackNumPie-this.state.thisWeekAttackNumPie)*100/this.state.thisWeekAttackNumPie).toFixed(2)}%</p>
                                }
                            </div>
                        </div>
                        <div className="right-part-charts clearfix">
                            <CornerBorder />
                            <p className="charts-title"><span>上周拦截威胁数</span></p>
                            <div className="pie-container">
                                {/* <div id="right-pie-chart4" className="right-pie-chart"></div> */}
                                <RightDonut AttackNumPie = {this.state.lastWeekAttackNumPie}/>
                            </div>
                            {/* <MapAttackRightPie echartsPie={this.state.echartsPie} /> */}
                            <div className="charts-info clearfix">
                                <p className="index1">{this.state.lastWeekAttackNumPie}</p>
                                {/* <div id="right-line-chart4" className="right-line-chart"></div> */}
                                <RightLine AttackNumLine = {this.state.lastWeekAttackNumPie} />
                            </div>
                        </div>
                    </div>
                    <hr />
                    <div className="right-charts-group">
                        <div className="right-part-charts clearfix">
                            <CornerBorder />
                            <p className="charts-title"><span>本月拦截威胁数</span></p>
                            <div className="pie-container">
                                {/* <div id="right-pie-chart5" className="right-pie-chart"></div> */}
                                <RightDonut AttackNumPie = {this.state.thisMounthAttackNumPie} />
                            </div>
                            {/* <MapAttackRightPie echartsPie={this.state.echartsPie} /> */}
                            <div className="charts-info clearfix">
                                <p className="index1">{this.state.thisMounthAttackNumPie}</p>
                                {/* <div id="right-line-chart5" className="right-line-chart"></div> */}
                                <RightLine AttackNumLine = {this.state.thisMounthAttackNumPie} />
                                {
                                    this.state.thisMounthAttackNumPie !=0 &&
                                    <p className="index2">{((this.state.lastMounthAttackNumPie-this.state.thisMounthAttackNumPie)*100/this.state.thisMounthAttackNumPie).toFixed(2)}%</p>
                                }
                            </div>
                        </div>
                        <div className="right-part-charts clearfix">
                            <CornerBorder />
                            <p className="charts-title"><span>上月拦截威胁数</span></p>
                            <div className="pie-container">
                                {/* <div id="right-pie-chart6" className="right-pie-chart"></div> */}
                                <RightDonut AttackNumPie = {this.state.lastMounthAttackNumPie}/>
                            </div>
                            {/* <MapAttackRightPie echartsPie={this.state.echartsPie} /> */}
                            <div className="charts-info clearfix">
                                <p className="index1">{this.state.lastMounthAttackNumPie}</p>
                                {/* <div id="right-line-chart6" className="right-line-chart"></div> */}
                                <RightLine AttackNumLine = {this.state.lastMounthAttackNumPie} />
                            </div>
                        </div>
                    </div>
                   <p className="bottom-border"></p>
                </div>
                <div className="mapAttackCover">
                    <div id="mapAttack" style={{ width: '100%', height: '568px' }}>
                    </div>

                    
                    <div className="mapAttackLsit center-list">
                        <table>
                            <thead>
                                <tr>
                                    <th width="20%">时间</th>
                                    <th width="12%">类型</th>
                                    <th width="20%">攻击来源IP</th>
                                    <th width="12%">攻击地点</th>
                                    <th width="20%">攻击目标IP</th>
                                    <th width="16%">目标地点</th>
                                </tr>
                            </thead>
                        </table>
                        <table className="center-scroll-content" >
                            <tbody>
                                {
                                    this.state.attactRange &&
                                    this.state.attactRange.map(function (data, index) {
                                        return (

                                            <tr key={index}>
                                                <td width="20%">{data.time}</td>
                                                <td width="12%">{data.attack_type}</td>
                                                <td width="20%">{data.source_ip}</td>
                                                <td width="12%">{data.location}</td>
                                                <td width="20%">{data.des_ip}</td>
                                                <td width="16%">试用版，暂无</td>
                                            </tr>

                                        )
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="bottom-attack-content">

                    <BottomPie1 BottomPieHttp={this.state.BottomPieHttp} />
                    <BottomPie2 BottomPieWeb={this.state.BottomPieWeb} />
                    <BottomPie3 BottomPieDos={this.state.BottomPieDos} />
                    <BottomPie4 BottomPieSensitive={this.state.BottomPieSensitive} />
                    <BottomPie5 BottomPieError={this.state.BottomPieError} />

                 
                            <BottomRightPie
                                todayAverageMinute = {this.state.todayAverageMinute}
                                mounthTodayAverageMinute = {this.state.mounthTodayAverageMinute}
                                mounthAverageMinute = {this.state.mounthAverageMinute}
                            />
                </div>
            </div>
        )
    }
}