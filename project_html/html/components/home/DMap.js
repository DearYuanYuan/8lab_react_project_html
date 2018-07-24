import React from 'react';
import echarts from "echarts"                                                   //react
import { Row} from 'react-bootstrap';         //bootstrap组件
import $ from 'jquery';                                                           //jquery
import { myClearInterval, currentTime } from "../../utils/utils.js";                //工具函数
import DynamicGauge from "../Commonality/DynamicGauge";
import Pie1 from './DMap/Pie1';
import Pie2 from './DMap/Pie2';
import Pie3 from './DMap/Pie3';
import Pie4 from './DMap/Pie4';
import Pie5 from './DMap/Pie5';
import Line from './DMap/Line'
require("../../utils/jquery.animateNumber.js");    //引入jquery的animateNumber插件，用于数字的由小到大增加的动画效果

//地图页面
export default class DMap extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            logsMap: [],                //全局日志的列表
            logsError: false,           //全局日志加载失败
            isTypeClicked: ["", "", "", "", ""],//地图控制栏按钮状态，点击时未"clicked"，未点击时为""
            logsLoading: true,          //全局日志加载flag
            mapLoading: true,           //地图加载flag
            refreshTime: currentTime().slice(11, 21),  //记录当前时间

            todayAttackNum: currentTime().slice(1, 11),


            typeCountState: null,
            // vda:'',
            dataAttackPointMsg:[],//初始化地图上攻击点的信息，点击时弹出的右侧弹框

        };
        this.switchMode = false;        //记录模式切换状态，若为true时正在切换中，若为false时为未切换或者切换已完成
        this.searchMode = false;        //记录搜索状态，若为true时正在搜索中，若为false时为未搜索或者搜索已经完成
        this.mouseIn = false;           //鼠标移动的记录
        this.rotateInterval = null;     //地球旋转定时器
        this.detailClicked = false;     //true时，地图上的点被点击
        this.logsInterval = null;       //全局日志定时器
        this.detailInterval = null;     //点击地图上的点时展开详情的
        this.countInterval = null;      //类型条数的定时器
        this.dataInterval = null;       //获取地球上点线数据的定时器   
        this.attackTypes = [        //记录所有的攻击类型名称
            "http-defense",
            "dos-attack",
            "web-attack",
            "sensitive-data-tracking",
            "identification-error"
        ];
        this.pointLineSources = {          //记录所有攻击类型的数据源，用于点击类型图标时控制地图上数据的显示与隐藏
            "http-defense": null,               //值有三种情况：
            "dos-attack": null,                 //如果此攻击类型有数据，且展示在地图中，则为这个数据的Datasource实例在viewer.datasources中的index值;
            "web-attack": null,                 //如果此攻击类型有数据，但在地图中隐藏，则为这个数据的Datasource实例;
            "sensitive-data-tracking": null,    //如果此攻击类型没有数据，则为null.
            "identification-error": null
        };
        this.nodeSources = {       //用于保存地图上的坐标点的数据.
            "http-defense": null,   //每一项的entities用于记录地图上的点的位置，后面用于判断点击的点是否有详情可以查询.
            "dos-attack": null,     //值有两种情况：没有坐标点数据时，为null;有坐标点数据时，为这个坐标点数据的Datasource实例.
            "web-attack": null,
            "sensitive-data-tracking": null,
            "identification-error": null
        };
        this.viewer = null;     //设置cesium的viewer     
        this.typeCount = {      //记录每次取得的各种攻击类型的数目，用于显示到页面上
            "http-defense": 0,
            "dos-attack": 0,
            "web-attack": 0,
            "sensitive-data-tracking": 0,
            "identification-error": 0
        };
        this.mapOption = null;  //存储地球配置信息
        this.detailList = null; //存储查询到的详情list
        this.detailIndex = -1;  //详情页展示的信息的序号

        this.rightDataInfo = null;
        this.logIsPaused = false    //日志轮播效果是否暂停

    }


    initLogAnimation() {
        var self = this
        var interval = 30000    //轮播动画的循环间隔
        let scrollBox = $(".displayContainer")
        //只有在第一次加载日志数据时，设置轮播动画
        //this.logIsPaused 用于避免在动画暂停时（此时满足 !this.logAnimeInterval），重新又设置了动画
        if (!this.logAnimeInterval && !this.logIsPaused) {
            scroll()    //开始滚动
            this.logAnimeInterval = setInterval(scroll, interval)    //循环的轮播日志
            scrollBox.mouseenter(pause).mouseleave(restart)
        }
        //向上滚动
        function scroll() {
            scrollBox.animate(
                { marginTop: -scrollBox.height() + $('#scrollDisplay').height()<0?-scrollBox.height() + $('#scrollDisplay').height():-scrollBox.height() },
                interval,
                "linear",
                function () { scrollBox.css({ marginTop: 0 }) }  //动画结束时回到其实位置
            )
        }
        //暂停动画
        function pause() {            
            if (self.logAnimeInterval) {
                self.logAnimeInterval = window.clearInterval(self.logAnimeInterval)    //取消定时器
                scrollBox.stop()  //停止动画
                self.logIsPaused = true
            }
        }
        //重新开始动画
        function restart() {
            if (!self.logAnimeInterval) {           
                scroll()    //开始滚动
                self.logAnimeInterval = setInterval(scroll, interval)    //重新开始定时器
                self.logIsPaused = false
            }
        }
    }
    /**
     * 取得全局攻击日志
     * @param {*} data ajax请求的表单数据，例如{time: 5, limit: 50}
     */
    getLogs(data) {
        var self = this;
        $.ajax({
            url: '/api/get_details/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data: data,
            success: function (data) {
                self.setState(
                    {
                        logsLoading: false,
                        logsMap: data,
                        refreshTime: currentTime().slice(11, 21)
                    }, function () {
                        self.initLogAnimation()       //初始化日志轮播动画
                        if (data && data.length == 0) {//如果没有数据，将定时器时间调整为5s
                            //更新日志信息的定时器
                            self.logsInterval = myClearInterval(self.logsInterval);
                            if (!self.logsInterval) {        //limit 数据最多加载的条数;time表示最近五分钟内
                                self.logsInterval = setInterval(self.getLogs.bind(self, { time: 5, limit: 50 }), 5000);
                            }
                            //更新地图上点线数据的定时器
                            self.dataInterval = myClearInterval(self.dataInterval);
                            if (!self.dataInterval) {       //count为2表示为最近5分钟
                                self.dataInterval = setInterval(self.getData.bind(self, { count: "2", limit: 50 }), 5000);
                            }
                        } else { //如果有数据，将定时器时间设置为72s（36s为地球自转一周）
                            self.logsInterval = myClearInterval(self.logsInterval);
                            //更新日志信息的定时器
                            if (!self.logsInterval) {
                                self.logsInterval = setInterval(self.getLogs.bind(self, { time: 5, limit: 50 }), 72000);
                            }
                            //更新地图上点线数据的定时器
                            self.dataInterval = myClearInterval(self.dataInterval);
                            if (!self.dataInterval) {
                                self.dataInterval = setInterval(self.getData.bind(self, { count: "2", limit: 50 }), 72000);
                            }
                        }
                    })
            },
            error: function () {
                self.setState({ logsLoading: false, logsError: true, refreshTime: currentTime().slice(11, 21) });   //显示错误信息
            }
        })
    }

    /**
     * 设置所有的定时器，用于初始化
     */
    setAllIntervals() {
        this.getCount();   //获取攻击类型的个数
        if (!this.countInterval) {  //设置定时器
            this.countInterval = setInterval(this.getCount.bind(this), 5000);
        }
        this.getLogs({ limit: 50 }); //全局日志列表展示，无时间限制
        if (!this.logsInterval) {   //设置定时器
            this.logsInterval = setInterval(this.getLogs.bind(this, { time: 5, limit: 50 }), 72000); //最近50条数据，且在最近五分钟内
        }
        this.getData({ count: "1", limit: 50 }); //取回原始的数据源,用于地图上的点和线的展示;count为1表示没有时间限制，2表示为最近5分钟
        if (!this.dataInterval) {   //设置定时器
            this.dataInterval = setInterval(this.getData.bind(this, { count: "2", limit: 50 }), 10000);//地球上展示最近50条且是最近5分钟内的数据
        }
        if (!this.RightChartsData) {
            this.RightChartsData = setInterval(this.getRightChartsData.bind(this), 5000) //获取右侧面板中的所有主机的列表，每5s刷新   
        }
        if (!this.watcherlab_daily) {
            this.watcherlab_daily = setInterval(this.get_watcherlab_daily.bind(this), 5000) //获取右侧面板中的所有主机的列表，每5s刷新   
        }
    }

    /**
     * 获取每个攻击类型的攻击个数
     */
    getCount() {
        var self = this;
        $.ajax({
            url: '/api/get_type_count/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function (data) {
                if (data != null) {

                    self.typeCountInfo = self.state.typeCountState;
                    //当数据有效时设置动画，并保存数据作为下一次动画的起始数据
                    self.setState({
                        typeCountState: data,
                    })

                    // for (var i = 0; i < 5; i++) {
                    //     var str = '#count' + i;
                    //     var type = self.attackTypes[i];
                    //     //使用增加动画显示数字，示例:http://www.jqueryfuns.com/resource/1148
                    //     $(str).prop('number', self.typeCount[type]).animateNumber({ number: data[type] }, 1500);
                    //     self.typeCount[type] = data[type];  //保存数据作为下一次动画的起始数据

                    // }
                }
            }
        });
    }

    /**
     * 图例的控制事件，点击取消显示曲线，再次点击显示曲线
     * 这个方法中用到 this.pointLineSources 变量，对于每个攻击类型，this.pointLineSources中的值有两种情况：
     * 图标被点击选中后（地图上的线条隐藏），this.pointLineSources保存的是攻击类型对应的 Viewer.Datasource 实例;
     * 图标再次被点击变成未选中的状态时（地图上的线条恢复显示），this.pointLineSources保存的是这个攻击类型的实例在Viewer.DatasourceCollection中的index
     * @param {*} index 被点击的图例的在 isTypeClicked 列表中的index
     */
    showData(index) {
        var clickedList = this.state.isTypeClicked;     //获取攻击类型的图标是否被点击
        var type = this.attackTypes[index];             //获取点击的攻击类型名称
        //获取被点击的攻击类型在this.pointLineSources中的数据
        //index值或者对应的dataSource实例;为null时，表示地图上没有这个攻击类型的数据
        var pointLineSource = this.pointLineSources[type];

        //初次点击时改变点击状态，移出点击的攻击类型        
        if (clickedList[index] == "") {   //如果点击的图标当前是没有被点击的状态  
            clickedList[index] = "clicked"; //将图标的状态设置为已点击            
            //在修改之前把其他的未点击的图标对应的攻击类型的索引更新 

            if (pointLineSource) {//如果点击的攻击类型数据在地图中存在，此时pointLineSource为index    
                for (var typename in this.pointLineSources) {
                    //在Viewer.DatasourceCollection中，再将要被移除的攻击类型之后的实例，将this.pointLineSources中保存的索引值减一
                    //对于所有图标未被选中且有数据的攻击类型（此时pointLineSource为index数值），如果索引在当前选中的攻击类型之后
                    if (typeof this.pointLineSources[typename] == 'number' && this.pointLineSources[typename] > this.pointLineSources[type]) {
                        this.pointLineSources[typename]--
                    }
                }
                //将要移除的攻击类型数据暂时保存到pointLineSources全局变量，以便再次点击图标时显示出来   
                this.pointLineSources[type] = this.viewer.dataSources.get(pointLineSource);  //通过index获取viewer中的Datasource实例,并更新全局变量pointLineSources               
                this.viewer.dataSources.remove(this.pointLineSources[type]); //从viewer中移除所选中的攻击类型数据对应的Datasource实例，以便隐藏地图上的线条     
            }
        } else {//如果点击的图标当前是已经被点击的状态            
            clickedList[index] = "";        //再次点击时恢复图标状态添加选择的攻击类型
            if (pointLineSource) {//如果点击的攻击类型数据在地图中存在，此时pointLineSource为Datasource实例
                this.viewer.dataSources.add(pointLineSource);   //在viewer中添加所选中的攻击类型数据，以便恢复显示地图上的线条
                //将要显示的攻击类型对应的pointLineSources全局变量重新设置为viewer数据中的index，以便再次点击图标时隐藏地图上的线条
                this.pointLineSources[type] = this.viewer.dataSources.indexOf(pointLineSource);
            }
        }
        this.setState({ isTypeClicked: clickedList });
    }

    /**
     * 地球上的坐标点以及它们之间连线的攻击效果。
     * 使用Cesium.CzmlDataSource。API文档：https://cesiumjs.org/Cesium/Build/Documentation/CzmlDataSource.html 。
     * 此方法获取坐标点以及连线的数据。
     * @param {*} params ajax请求的表单数据，比如{count: "2", limit: 50}
     */
    getData(params) {
        var self = this
        $.ajax({
            url: '/api/get_all_info/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data: params,
            success: function (data) {
                // console.log(JSON.stringify(data))
                //初始化地图上点的信息
                var dataAttack = []
                function addPointsource(dataSource) {
                    self.viewer.dataSources.add(dataSource);  //把实例添加到viewer中显示出来
                    self.nodeSources[type] = dataSource;     //把实例添加到全局变量中nodeSources
                }
                function addLinesource(dataSource) {
                    dataSource.clock.multiplier = 180;        //设置时钟的快进程度（canAnimate和shouldAnimate为true时设置时钟快进才有效）
                    dataSource.clock.canAnimate = true;       //是否允许时钟快进
                    dataSource.clock.shouldAnimate = true;    //是否时钟快进
                    self.viewer.dataSources.add(dataSource);  //把实例添加到viewer中显示出来
                    //设置全局变量pointLineSources。默认为数据的实例在viewer.dataSources中的index
                    self.pointLineSources[type] = self.viewer.dataSources.indexOf(dataSource);
                }
                
                //清除展示数据
                self.viewer.entities.removeAll()
                self.viewer.dataSources.removeAll()

                for (var i = 0; i < 5; i++) {
                    var type = self.attackTypes[i];
                    //除第一次外，每次获取值时均将上一次的展示数据清空
                    if (params["count"] != "1") {
                        self.pointLineSources[type] = null;    //重置此类型的pointLineSources
                        self.nodeSources[type] = null; //重置此类型的nodeSources
                    }
                    //如果有值时，才取值展示
                    if (data[type]) {
                        var node = data[type]["node"];
                        var point_line = data[type]["point_line"];
                        if (node.length != 0 || point_line.length != 0) {
                            //CzmlDataSource的load方法：为加载到CZML数据里的新实例创建一个Promise对象
                            //把地图上的坐标点的数据加载到Cesium中
                            Cesium.CzmlDataSource.load(node).then(addPointsource);
                            //把地图上的线条的数据加载到Cesium中
                            Cesium.CzmlDataSource.load(point_line).then(addLinesource);
                            //将地图上的点的信息提取出来
                            //首先获取被攻击的地点信息
                            dataAttack.push(
                                {
                                    "occur_time": node[2].occur_time,
                                    "des_ip": node[2].des_ip,
                                    "attack_type": node[2].attack_type,
                                    "source_ip": node[2].source_ip,
                                    'source_lat':node[2].position.cartographicDegrees[1],
                                    "source_lng":node[2].position.cartographicDegrees[0],
                                    "des_lat": node[2].position.cartographicDegrees[1],
                                    "des_lng": node[2].position.cartographicDegrees[0],
                                    "type":'',
                                }
                            )
                            for(var nodeList = 1; nodeList < node.length; nodeList++){
                                var position = node[nodeList].position
                                //去掉重复的被攻击地点的信息
                                if( position.cartographicDegrees[1] != node[2].position.cartographicDegrees[1] &&
                                    position.cartographicDegrees[0] != node[2].position.cartographicDegrees[1]){
                                    dataAttack.push(
                                        {
                                            "occur_time": node[nodeList].occur_time,
                                            "des_ip": node[nodeList].des_ip,
                                            "attack_type": node[nodeList].attack_type,
                                            "source_ip": node[nodeList].source_ip,
                                            'source_lat':position.cartographicDegrees[1],
                                            "source_lng":position.cartographicDegrees[0],
                                            "des_lat": "26.0614",
                                            "des_lng": "119.3061",
                                            "type":"source"
                                        }
                                    )
                                }

                            }


                        }

                    }
                }
                //将地图上的点的信息加到state中，在点击的时候查询相关点的信息
                self.setState({
                    dataAttackPointMsg:dataAttack
                })
                // console.log(JSON.stringify(dataAttack))
            } //成功执行方法
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


    getRightChartsData() {
        var self = this
        $.ajax({
            url: '/api/get_server_status/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function (data) {

                self.rightDataInfo = self.state.rightData
                self.setState({
                    rightData: data,
                    // vda: data.vda,
                    // disk_read: data.disk_read,
                    // network_in: data.network_in,
                    // process_nums: data.process_nums,
                    // used_swap_pct: data.used_swap_pct,
                    // used_cpu_pct: data.used_cpu_pct,
                    // disk_write: data.disk_write,
                    // network_out: data.network_out,
                    // data_second: data.data_second,
                    // used_mem_pct: data.used_mem_pct,
                    // used_disk_pct: data.used_disk_pct
                })
            }
        })
    }
    get_watcherlab_daily() {
        var self = this;
        $.ajax({
            url: '/api/get_watcherlab_daily/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function (data) {
                self.todayAttackInfo = self.state.todayAttck
                self.setState({
                    watcherlab_daily: data,
                    todayAttck: data[self.state.todayAttackNum]
                })
            }
        })
    }
    /**
     * 关闭详情页
     */
    closeDetail() {
        //设置点击状态
        this.detailClicked = false;
        //移出显示详情页面
        $('.ItemsDetailBlocker').css('display', 'none');
        //移出点击的billboard
        if (this.billboard) {
            this.viewer.entities.remove(this.billboard);
        }
        this.billboard = null;
        var scene = this.viewer.scene;
        this.detailList = null;
        this.detailIndex = -1;
        //设置页面可放大、可旋转
        scene.screenSpaceCameraController.enableRotate = true;
        scene.screenSpaceCameraController.enableZoom = true;
        //设置地图上点线数据的定时器
        if (!this.dataInterval) {
            this.dataInterval = setInterval(this.getData.bind(this, { count: "2", limit: 50 }), 72000);
        }
        //设置日志信息的定时器
        if (!this.logsInterval) {
            this.logsInterval = setInterval(this.getLogs.bind(this, { time: 5, limit: 50 }), 72000);
        }
        //清除详情页的定时器
        this.detailInterval = myClearInterval(this.detailInterval);
    }

    /**
     * 详情页的展示部分
     */
    displayDetail() {
        var detailData = this.detailList; //获取攻击详情的数据
        var typeName = {    //攻击类型名称
            "http-defense": "HTTP防御",
            "dos-attack": "DOS攻击防护",
            "web-attack": "Web攻击",
            "sensitive-data-tracking": "敏感数据跟踪",
            "identification-error": "缺陷鉴定和错误检测"
        };
        //设置当前位置的类型
        if (detailData["type"] == "source") {   //如果当前位置是攻击源
            $('.detail1').html("攻击源(当前位置)：");
            $('.detail3').html("攻击目标：");
            $('.source-ip').html("<span class='detail2'>" + detailData["source_ip"] + "</span>");
        } else {
            $('.detail1').html("攻击源：");     //如果当前位置是攻击目标
            $('.detail3').html("攻击目标(当前位置)：");
            $('.source-ip').html("<span class='detail2'>" + "..." + "</span>");
        }
        // console.log(detailData)
        //设置其他信息

        $('.target-ip').html("<span class='detail4'>" + detailData["des_ip"] + "</span>");
        $('.attack-type').html("<span class='detail6 " + detailData["attack_type"] + "'><i></i><span>" + typeName[detailData["attack_type"]] + "</span></span>");
        $('.occur_time').html("<span class='detail7'>" + detailData["occur_time"] + "</span>");
    }

    /**
     * 详情页的数据获取
     */
    showDetail(longitude, latitude) {
        // var self = this
        // $.ajax({
        //     url: '/api/get_ip_by_coordinate/',
        //     type: 'POST',
        //     dataType: 'json',
        //     cache: false,
        //     data: {
        //         lng: longitude,     //被点击的点的经度
        //         lat: latitude       //被点击的点的纬度
        //     },
        //     success: function (data) {
        //         console.log(JSON.stringify(data))
        //         if (data != null) {
        //             self.detailList = data;     //把跟此坐标点相关的攻击信息保存到全局变量detailList 中
        //             self.displayDetail();       //显示详情
        //             self.detailInterval = setInterval(self.displayDetail.bind(self), 5000); //设置详情信息的定时器
        //         }
        //     } //成功执行方法
        // });
        var dataAttack = this.state.dataAttackPointMsg
        var clickPointMsg = [];
        for(var i = 0;i<dataAttack.length;i++){
            if( latitude== dataAttack[i].source_lat && longitude == dataAttack[i].source_lng){
                clickPointMsg = dataAttack[i]
            }
        }
        this.detailList = clickPointMsg;     //把跟此坐标点相关的攻击信息保存到全局变量detailList 中
        this.displayDetail();       //显示详情
        this.detailInterval = setInterval(this.displayDetail.bind(this), 5000); //设置详情信息的定时器

    }

    /**
     * 查找点击的点是否是所包含的节点
     * @param {*} obj 点击的坐标点的实例
     */
    isEntityContains(obj) {
        for (var index in this.nodeSources) {   //遍历 nodeSource 中的所有实例
            if (this.nodeSources[index] && this.nodeSources[index].entities.contains(obj)) { //如果实例不为空，且包含点击的坐标点数据
                return true;
            }
        }
        return false;
    }

    /**
     * 设置地球自转或者取消自转
     * 参数为true时使地球开始自转;false时取消自转
     * @param {*} shouldSet 是否应该设置自转
     */
    setRotateInterval(shouldSet) {
        var camera = this.viewer.scene.camera;
        if (shouldSet) {
            if (!this.rotateInterval) {   //设置地球自转
                this.rotateInterval = setInterval(function () {
                    camera.rotateRight(Math.PI / 720);
                }, 50);
            }
        } else {
            this.rotateInterval = myClearInterval(this.rotateInterval); //清除自转的定时器
        }
    }

    /**
     * 加载地图及相关资源
     */
    afterMapLoading() {
        this.viewer = new Cesium.Viewer('cesiumContainerCanvas', this.mapOption);
        this.setAllIntervals();
        var scene = this.viewer.scene;
        var self = this;
        //模式切换暂停地球旋转
        var morphStart = function () {
            self.switchMode = true;
            self.setRotateInterval(false);
        };
        //模式切换完成时若切换后的状态为3D时，开启地球自转
        var morphComplete = function () {
            if (scene.mode == Cesium.SceneMode.SCENE3D)
                self.setRotateInterval(true);
            self.switchMode = false;
        };
        //绑定监听器
        var eventHelper = new Cesium.EventHelper();
        eventHelper.add(scene.morphStart, morphStart);
        eventHelper.add(scene.morphComplete, morphComplete);
        //开始搜索时停止自转
        var beforeSearch = function () {
            var searchStr = self.viewer.geocoder.viewModel.searchText;
            if (searchStr != "") {
                self.searchMode = true;
                self.setRotateInterval(false);
            }
        }
        //执行搜索后，此时不等于执行结束，即此时查询字符串为“searching...”
        var afterSearch = function () {
            self.searchMode = false;
        }
        var searchCommand = this.viewer.geocoder.viewModel.search;
        eventHelper.add(searchCommand.beforeExecute, beforeSearch);
        eventHelper.add(searchCommand.afterExecute, afterSearch);
        //当搜索字符时报错或者not found后地球仍自转
        var obj = this.viewer.geocoder.viewModel;
        Object.defineProperty(obj, 'isSearchInProgress', {
            get: function () {
                var searchStr = obj.searchText;
                if (searchStr.indexOf("not found") != -1 || searchStr.indexOf("error") != -1) {
                    self.setRotateInterval(true);
                    self.viewer.geocoder.viewModel.searchText = "";
                }
            }
        });
        //添加一个图层，Bing地图。
        var brightBing = this.viewer.imageryLayers.addImageryProvider(new Cesium.BingMapsImageryProvider({
            url: 'https://dev.virtualearth.net',
            key: 'AjJQofO7Rd4STCLgel-aXwlT9yA3d6fDgLbMEaNPKoqMQDDEXTPOeBYkaSRqOZ2B',
            mapStyle: Cesium.BingMapsStyle.ROAD
        }));
        brightBing.alpha = 0.3; //设置图层的透明度


        // //消除地球外边框
        // // exapmle: http://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Atmosphere%20Color.html&label=All
        // var skyAtmosphere = scene.skyAtmosphere;
        // skyAtmosphere["brightnessShift"] = -1;

        //加载天地图中文注释
        var url = "http://{s}.tianditu.com/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default.jpg";
        this.viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
            url: url,
            layer: "tdtAnnoLayer",
            style: "default",
            format: "tiles",
            subdomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"], //使用多服务器域名优化下载
            tileMatrixSetID: "GoogleMapsCompatible",
            show: false
        }));
        var canvas = this.viewer.canvas;
        var camera = scene.camera;
        //设置中国为显示中心{west:73,south:3,east:135,north:53}
        Cesium.Camera.DEFAULT_VIEW_RECTANGLE = new Cesium.Rectangle(Cesium.Math.toRadians(0), Cesium.Math.toRadians(0), Cesium.Math.toRadians(180), Cesium.Math.toRadians(90));
        camera.flyHome();
        //绑定鼠标事件,若点击到地图上的点时，放大并显示详情
        this.handler = new Cesium.ScreenSpaceEventHandler(canvas);
        this.handler.setInputAction(function (movement) {
            if (!self.detailClicked) {
                var pickedObject = scene.pick(movement.position);
                if (Cesium.defined(pickedObject) && (self.isEntityContains(pickedObject.id))) {
                    //设置点击状态
                    self.detailClicked = true;
                    //清除全局定时器（logs、data）
                    self.dataInterval = myClearInterval(self.dataInterval);
                    self.logsInterval = myClearInterval(self.logsInterval);
                    //禁用当前视野的旋转和缩放
                    scene.screenSpaceCameraController.enableRotate = true;
                    scene.screenSpaceCameraController.enableZoom = true;
                    var cartesian = pickedObject.id.position._value;
                    var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                    //在点击位置上添加图标，显示为被点击位置。全局变量以便移除。
                    self.billboard = self.viewer.entities.add({
                        position: Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)),
                        billboard: {    //坐标点的图标
                            image: '/static/img/mapImg/sink.svg'
                        }
                    });
                    //将点击位置显示为位置中心，并显示右侧详情页
                    //让镜头飞到制定位置和方向
                    camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude), 1000),
                        complete: function () {
                            //显示详情页，并准备加载对应的数据
                            $('.ItemsDetailBlocker').css('display', 'block');
                            $('.location').text("当前位置:[" + Cesium.Math.toDegrees(cartographic.longitude).toFixed(4) + "," + Cesium.Math.toDegrees(cartographic.latitude).toFixed(4) + "]")
                            self.showDetail(Cesium.Math.toDegrees(cartographic.longitude).toFixed(4), Cesium.Math.toDegrees(cartographic.latitude).toFixed(4))

                        }
                    });
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        //自转，鼠标移动上去时暂停旋转，移除时继续旋转
        this.setRotateInterval(true);
        this.handler.setInputAction(function (movement) {
            if (!self.switchMode && !self.searchMode && (scene.mode == Cesium.SceneMode.SCENE3D)) {
                //监听键盘事件，用于平移或者旋转镜头
                var ellipsoid = scene.globe.ellipsoid;
                //通过指定的椭球或者地图对应的坐标系，将鼠标的二维坐标转换为对应三维坐标
                var cartesian = camera.pickEllipsoid(movement.endPosition, ellipsoid);
                if (cartesian) {
                    //鼠标滑入地球的时候取消地球自转
                    if (!self.mouseIn) {
                        self.mouseIn = true;
                        self.setRotateInterval(false); //停止自转
                    }
                } else {
                    //鼠标滑出地球时，地球自转
                    if (self.mouseIn) {
                        self.mouseIn = false;
                        self.setRotateInterval(true); //开始自转
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }

    componentWillMount(){       
    }
    /**
     * 组件加载之后的操作
     */
    componentDidMount() {
        //修改页面title
        document.title = '3D地球'
        var self = this;
        this.mapOption = {  //地图配置
            animation: false, //动画控制,左侧时钟不显示
            imageryProvider: null,
            baseLayerPicker: false, //图层控制显示
            infoBox: false,//不显示默认的提示框
            timeline: false,//时间线不显示
            //sceneModePicker:false,//投影方式不显示
            navigationHelpButton: false,//不显示帮助按钮
            showRenderLoopErrors: false,//如果设为true，将在一个HTML面板中显示错误信息
            selectionIndicator: false,//点击时的默认选择框
            geocoder: true,//默认显示搜索框，使用离线地图时设置为false，不显示搜索框
            // fullscreenElement: 'cesiumContainerCanvas',//设置为全屏
            clock: new Cesium.Clock({//设置时钟
                clockStep: 1,   //advances the current time by the amount of system time elapsed since the previous call multiplied by Clock.multiplier
                clockRange: 2,
                multiplier: 0.1 * 60 * 60   //加快时钟的运行
            }),
            skyBox: new Cesium.SkyBox({//设置skybox，即太空的背景
                sources: {
                    positiveX: '/static/img/sky/Stars++.png',
                    negativeX: '/static/img/sky/Stars++.png',
                    positiveY: '/static/img/sky/Stars++.png',
                    negativeY: '/static/img/sky/Stars++.png',
                    positiveZ: '/static/img/sky/Stars++.png',
                    negativeZ: '/static/img/sky/Stars++.png',
                }
                // sources : {
                // positiveX : '/static/Cesium/Build/Cesium/Assets/Textures/sky/sL.png',
                // negativeX : '/static/Cesium/Build/Cesium/Assets/Textures/sky/sR.png',
                // positiveY : '/static/Cesium/Build/Cesium/Assets/Textures/sky/sD.png',
                // negativeY :'/static/Cesium/Build/Cesium/Assets/Textures/sky/sU.png',
                // positiveZ :'/static/Cesium/Build/Cesium/Assets/Textures/sky/sF.png',
                // negativeZ : '/static/Cesium/Build/Cesium/Assets/Textures/sky/sB.png',
                // }
                // sources : {
                //     positiveX : '/static/Cesium/Build/Cesium/Assets/Textures/sky/galaxy-X.png',
                //     negativeX : '/static/Cesium/Build/Cesium/Assets/Textures/sky/galaxy+X.png',
                //     positiveY : '/static/Cesium/Build/Cesium/Assets/Textures/sky/galaxy+Y.png',
                //     negativeY :'/static/Cesium/Build/Cesium/Assets/Textures/sky/galaxy-Y.png',
                //     positiveZ :'/static/Cesium/Build/Cesium/Assets/Textures/sky/galaxy+Z.png',
                //     negativeZ : '/static/Cesium/Build/Cesium/Assets/Textures/sky/galaxy-Z.png',
                // }
            })
        };
        //使用bing的地图资源
        var map = new Cesium.BingMapsImageryProvider({
            url: 'https://dev.virtualearth.net',
            key: 'AjJQofO7Rd4STCLgel-aXwlT9yA3d6fDgLbMEaNPKoqMQDDEXTPOeBYkaSRqOZ2B',
            mapStyle: Cesium.BingMapsStyle.AERIAL
        });
        //使用ArcGis地图资源
        // var map=new Cesium.ArcGisMapServerImageryProvider({
        //             url : 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
        // });
        map.readyPromise.then(function () {
            //在线地图资源加载成功时使用在线地图资源
            self.mapOption.imageryProvider = map;
            //开始加载时刷新，显示地图
            self.setState({ mapLoading: false }, function () {
                self.afterMapLoading();
            });
        }, function () {
            //失败时使用本地地图资源
            self.mapOption.imageryProvider = Cesium.createTileMapServiceImageryProvider({
                url: '/static/Cesium/Build/Cesium/Assets/Textures/NaturalEarthII'
            });
            self.setState({ mapLoading: false }, function () {
                self.afterMapLoading();
            });
        });

        //使用本地google地图资源
        // this.mapOption.imageryProvider = Cesium.createOpenStreetMapImageryProvider({
        //     url: '/static/googlemaps/roadmap',
        //     cedit: 'Google_DEM',
        // });
        // this.setState({ mapLoading: false }, function () {
        //     self.afterMapLoading();
        // });

        this.getRightChartsData();
        this.get_watcherlab_daily();
    }
    //获取cookie
    getCookie(name) {
        var strCookie = document.cookie;
        var arrCookie = strCookie.split("; ");
        for (let i = 0; i < arrCookie.length; i++) {
            var arr = arrCookie[i].split("=");
            if (arr[0] == name) {
                return arr[1];
            }
        }
        return "";
    }
    /**
     * 组件将要被移除时的操作
     */
    componentWillUnmount() {
        //清空所有定时器设置
        this.logsInterval = myClearInterval(this.logsInterval);
        this.detailInterval = myClearInterval(this.detailInterval);
        this.countInterval = myClearInterval(this.countInterval);
        this.dataInterval = myClearInterval(this.dataInterval);
        this.rotateInterval = myClearInterval(this.rotateInterval);
        this.RightChartsData = myClearInterval(this.RightChartsData);
        this.watcherlab_daily = myClearInterval(this.watcherlab_daily);

        this.handler = this.handler && this.handler.destroy()
        this.viewer.entities.removeAll()
        this.viewer.dataSources.removeAll()
        this.viewer.destroy();  //Destroys the widget. Should be called if permanently removing the widget from layout.
        console.log("isdestroyed:"+this.viewer.isDestroyed())
        window.location.reload()
    }

    render() {
        // var memory = this.getCookie('userSystemSetType')


        var logsList;     //日志信息面板中的内容  
        if (this.state.logsLoading) { //如果日志信息仍在加载
            logsList = (
                <tbody>
                    <tr className="logs-map-list">
                        <td className="logs-time">Loading...</td>
                    </tr>
                </tbody>
            )
        } else if (this.state.logsError || this.state.logsMap == null) {   //如果获取日志信息失败失败
            logsList = (
                <div className='logs-alert'>加载出现错误</div>
            )
        } else if (this.state.logsMap.length == 0) {   //如果获取的日志信息为空
            logsList = (
                <div className='logs-info'>最近无攻击发生</div>
            )
        } else {  //如果日志信息正常，显示在表格中
            logsList = (

                <tbody className='animationList'>
                    {this.state.logsMap.map(function (logs, index) {
                        return (
                            <tr className="logs-map-list" key={index}>
                                <td className="logs-time">{logs["occur_time"].slice(10, 19)}</td>
                                <td className="logs-type">{logs["attack_type"]}</td>
                                <td className="logs-source-ip" >{logs["source_ip"]}</td>
                                <td className="logs-des-ip">{logs["des_ip"]}</td>
                            </tr>
                        )
                    })
                    }
                </tbody>

            )
        }

        return (


            <div id="dmap">
                <div className="canvas-map" id="cesiumContainer">
                    <div id="cesiumContainerCanvas">
                    </div>

                    <i className="fa fa-times closeDMap" aria-hidden="true" onClick={() => window.history.go(-1)}></i>
                    <Row className='displayWrapper'>
                        <div className='displayDecoration' ></div>
                        <div className='displayRightPie'>
                            <div className='displayRightPieTop clearfix'>
                                <div className='displayRightCount'>
                                    <Row className='RightCount-left'>
                                        <div style={{ fontSize: '10px' }}>总攻击数量</div>
                                        <div style={{ color: ' #F28321', fontSize: '10px' }}>
                                            {this.todayAttackInfo ?
                                                this.state.todayAttck - this.todayAttackInfo > 0 ?
                                                    <div style={{ color: '#F28321' }}>
                                                        <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>
                                                        {this.formatNumber(parseFloat(this.state.todayAttck - this.todayAttackInfo))}
                                                    </div> :
                                                    <div style={{ color: '#F28321' }}>
                                                        <i className="fa fa-arrow-alt-circle-down" style={{ marginRight: '3px' }}></i>
                                                        {this.formatNumber(parseFloat(this.state.todayAttck - this.todayAttackInfo))}
                                                    </div> :
                                                <div style={{ color: '#F28321' }}>
                                                    <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>
                                                    0
                                        </div>
                                            }
                                        </div>
                                        <div style={{ fontSize: '10px' }}>个/今日</div>
                                    </Row>

                                    <Row className='RightCount-right'>
                                        {this.state.todayAttck ? `${this.formatNumber(parseFloat(this.state.todayAttck))}K` : 0}
                                    </Row>
                                </div>
                                <div className='displayRightFirstPie' >

                                    <DynamicGauge
                                        svgid="DMap-pie1"
                                        title="流量实时统计"
                                        unity="KB/s"
                                        svgWidth="91.9"
                                        svgHeight="114"
                                        colorFill="#F28321"
                                        value={this.state.rightData && (this.state.rightData.data_second)}
                                        percentage={this.state.rightData && (this.state.rightData.data_second / 1024).toFixed(2)} />
                                </div>
                                {/*<div id="DMap-pie1" style={{ width: "80px", height: "80px", position: 'absolute', right: '0', top: '0' }}></div>*/}
                            </div>
                            <div className='displayRightPieBottm'>
                                <div className='displayRightFirstPie' >
                                    <DynamicGauge
                                        svgid="DMap-pie2"
                                        title="磁盘写入"
                                        unity="KB/s"
                                        svgWidth="91.9"
                                        svgHeight="114"
                                        colorFill="#F28321"
                                        value={this.state.rightData && (this.state.rightData.disk_write)}
                                        percentage={this.state.rightData && (this.state.rightData.disk_write / 500).toFixed(2)} />
                                </div>

                                <div className='displayRightFirstPie' >
                                    <DynamicGauge
                                        svgid="DMap-pie3"
                                        title="磁盘读取"
                                        unity="KB/s"
                                        svgWidth="91.9"
                                        svgHeight="114"
                                        colorFill="#F28321"
                                        value={this.state.rightData && (this.state.rightData.disk_read)}
                                        percentage={this.state.rightData && (this.state.rightData.disk_read / 500).toFixed(2)} />
                                </div>

                                <div className='displayRightFirstPie' >
                                    <DynamicGauge
                                        svgid="DMap-pie4"
                                        title="ipv4流入"
                                        unity="KB/s"
                                        svgWidth="91.9"
                                        svgHeight="114"
                                        colorFill="#F28321"
                                        value={this.state.rightData && (this.state.rightData.network_in)}
                                        percentage={this.state.rightData && (this.state.rightData.network_in / 1024).toFixed(2)} />
                                </div>

                                <div className='displayRightFirstPie' >
                                    <DynamicGauge
                                        svgid="DMap-pie5"
                                        title="ipv4流出"
                                        unity="KB/s"
                                        svgWidth="91.9"
                                        svgHeight="114"
                                        colorFill="#F28321"
                                        value={this.state.rightData && (this.state.rightData.network_out)}
                                        percentage={this.state.rightData && (this.state.rightData.network_out / 1024).toFixed(2)} />
                                </div>
                            </div>
                        </div>

                        <div className='displayRightCenterNum clearfix'>
                            <div className='displayRightCenterNum1 displayRightCenterPie'>
                                <div className='displayCenterTitle clearfix'>
                                    <div className='titleName'>RAM</div>
                                    <div className='titleNameBg'></div>
                                </div>
                                <div className='clearfix'>
                                    <div className='titleNameBigNum'>
                                        {this.state.rightData ? this.formatNumber(parseFloat(this.state.rightData.used_mem_pct)) : 0}
                                    </div>
                                    <div className='titleNameBigNubRight'>
                                        <div className='titleNameKB'>KB/s</div>
                                        {this.rightDataInfo ?
                                            this.state.rightData.used_mem_pct - this.rightDataInfo.used_mem_pct > 0 ?
                                                <div className='titleNameKBPer'>
                                                    <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>

                                                    {this.formatNumber(parseFloat(this.state.rightData.used_mem_pct - this.rightDataInfo.used_mem_pct))}
                                                </div> :
                                                <div className='titleNameKBPer'>
                                                    <i className="fa fa-arrow-alt-circle-down" style={{ marginRight: '3px' }}></i>

                                                    {this.formatNumber(parseFloat(this.state.rightData.used_mem_pct - this.rightDataInfo.used_mem_pct))}
                                                </div> :
                                            <div className='titleNameKBPer'>
                                                <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>
                                                0
                                            </div>
                                        }

                                    </div>
                                </div>
                                <Row className='displayCenterTitleLine'></Row>
                            </div>
                            <div className='displayRightCenterNum2 displayRightCenterPie'>
                                <div className='displayCenterTitle clearfix'>
                                    <div className='titleName'>SWAP</div>
                                    <div className='titleNameBg'></div>
                                </div>
                                <div className='clearfix'>
                                    <div className='titleNameBigNum'>
                                        {this.state.rightData ? this.formatNumber(parseFloat(this.state.rightData.used_swap_pct)) : 0}
                                    </div>
                                    <div className='titleNameBigNubRight'>
                                        <div className='titleNameKB'>KB/s</div>

                                        {this.rightDataInfo ?
                                            this.state.rightData.used_swap_pct - this.rightDataInfo.used_swap_pct > 0 ?
                                                <div className='titleNameKBPer'>
                                                    <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>

                                                    {this.formatNumber(parseFloat(this.state.rightData.used_swap_pct - this.rightDataInfo.used_swap_pct))}
                                                </div> :
                                                <div className='titleNameKBPer'>
                                                    <i className="fa fa-arrow-alt-circle-down" style={{ marginRight: '3px' }}></i>

                                                    {this.formatNumber(parseFloat(this.state.rightData.used_swap_pct - this.rightDataInfo.used_swap_pct))}
                                                </div> :
                                            <div className='titleNameKBPer'>
                                                <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>
                                                0
                                            </div>
                                        }
                                    </div>
                                </div>
                                <Row className='displayCenterTitleLine'></Row>
                            </div>
                            <div className='displayRightCenterNum3 displayRightCenterPie'>

                                <div className='displayCenterTitle clearfix'>
                                    <div className='titleName'>进程总数</div>
                                    <div className='titleNameBg'></div>
                                </div>
                                <div className='clearfix'>
                                    <div className='titleNameBigNum'>
                                        {this.state.rightData ? this.formatNumber(parseFloat(this.state.rightData.process_nums)) : 0}
                                    </div>
                                    <div className='titleNameBigNubRight'>
                                        <div className='titleNameKB'>KB/s</div>
                                        {this.rightDataInfo ?
                                            this.state.rightData.process_nums - this.rightDataInfo.process_nums > 0 ?
                                                <div className='titleNameKBPer'>
                                                    <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>

                                                    {this.formatNumber(parseFloat(this.state.rightData.process_nums - this.rightDataInfo.process_nums))}
                                                </div> :
                                                <div className='titleNameKBPer'>
                                                    <i className="fa fa-arrow-alt-circle-down" style={{ marginRight: '3px' }}></i>

                                                    {this.formatNumber(parseFloat(this.state.rightData.process_nums - this.rightDataInfo.process_nums))}
                                                </div> :
                                            <div className='titleNameKBPer'>
                                                <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>
                                                0
                                            </div>
                                        }
                                    </div>
                                </div>
                                <Row className='displayCenterTitleLine'></Row></div>
                            <div className='displayRightCenterNum4 displayRightCenterPie'>
                                <div className='displayCenterTitle clearfix'>
                                    <div className='titleName'>CPU占有率</div>
                                    <div className='titleNameBg'></div>
                                </div>
                                <div className='clearfix'>
                                    <div className='titleNameBigNum'>
                                        {this.state.rightData ? this.formatNumber(parseFloat(this.state.rightData.used_cpu_pct)) : 0}
                                    </div>
                                    <div className='titleNameBigNubRight'>
                                        <div className='titleNameKB'>KB/s</div>
                                        {this.rightDataInfo ?
                                            this.state.rightData.used_cpu_pct - this.rightDataInfo.used_cpu_pct > 0 ?
                                                <div className='titleNameKBPer'>
                                                    <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>

                                                    {this.formatNumber(parseFloat(this.state.rightData.used_cpu_pct - this.rightDataInfo.used_cpu_pct))}
                                                </div> :
                                                <div className='titleNameKBPer'>
                                                    <i className="fa fa-arrow-alt-circle-down" style={{ marginRight: '3px' }}></i>

                                                    {this.formatNumber(parseFloat(this.state.rightData.used_cpu_pct - this.rightDataInfo.used_cpu_pct))}
                                                </div> :
                                            <div className='titleNameKBPer'>
                                                <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>
                                                0
                                            </div>
                                        }
                                    </div>
                                </div>
                                <Row className='displayCenterTitleLine'></Row>
                            </div>
                            <div className='displayRightCenterNum5 displayRightCenterPie'>
                                <div className='displayCenterTitle clearfix'>
                                    <div className='titleName'>读写个数</div>
                                    <div className='titleNameBg'></div>
                                </div>
                                <div className='clearfix'>
                                    <div className='titleNameBigNum'>
                                        {this.state.rightData ? this.formatNumber(parseFloat(this.state.rightData.read_write_count)) : 0}
                                    </div>
                                    <div className='titleNameBigNubRight'>
                                        <div className='titleNameKB'>个/s</div>
                                        {this.rightDataInfo ?
                                            this.state.rightData.read_write_count - this.rightDataInfo.read_write_count > 0 ?
                                                <div className='titleNameKBPer'>
                                                    <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>

                                                    {this.formatNumber(parseFloat(this.state.rightData.read_write_count - this.rightDataInfo.read_write_count))}
                                                </div> :
                                                <div className='titleNameKBPer'>
                                                    <i className="fa fa-arrow-alt-circle-down" style={{ marginRight: '3px' }}></i>

                                                    {this.formatNumber(parseFloat(this.state.rightData.read_write_count - this.rightDataInfo.read_write_count))}
                                                </div> :
                                            <div className='titleNameKBPer'>
                                                <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>
                                                0
                                            </div>
                                        }
                                    </div>
                                </div>
                                <Row className='displayCenterTitleLine'></Row>
                            </div>
                            <div className='displayRightCenterNum6 displayRightCenterPie'>
                                <div className='displayCenterTitle clearfix'>
                                    <div className='titleName'>vda</div>
                                    <div className='titleNameBg'></div>
                                </div>
                                <div className='clearfix'>
                                    <div className='titleNameBigNum'>
                                        {this.state.rightData ? this.formatNumber(parseFloat(this.state.rightData.vda)) : 0}
                                    </div>
                                    <div className='titleNameBigNubRight'>
                                        <div className='titleNameKB'>KB/s</div>
                                        {this.rightDataInfo ?
                                            this.state.rightData.vda - this.rightDataInfo.vda > 0 ?
                                                <div className='titleNameKBPer'>
                                                    <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>

                                                    {this.formatNumber(parseFloat(this.state.rightData.vda - this.rightDataInfo.vda))}
                                                </div> :
                                                <div className='titleNameKBPer'>
                                                    <i className="fa fa-arrow-alt-circle-down" style={{ marginRight: '3px' }}></i>

                                                    {this.formatNumber(parseFloat(this.state.rightData.vda - this.rightDataInfo.vda))}
                                                </div> :
                                            <div className='titleNameKBPer'>
                                                <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>
                                                0
                                            </div>
                                        }
                                    </div>
                                </div>
                                <Row className='displayCenterTitleLine'></Row>
                            </div>
                        </div>


                        <Row className='DMap-LineWarpper'>
                            <div className='titleName'>威胁情报数</div>
                            <Line watcherlab_daily={this.state.watcherlab_daily} />
                        </Row>

                        <div className='displayContainer-title'>
                            <div>时间</div>
                            <div>攻击类型</div>
                            <div>攻击者 IP</div>
                            <div>被攻击 IP</div>
                        </div>



                        <div id='scrollDisplay'>
                            <div className={"displayContainer " + (this.state.logsMap != null && this.state.logsMap.length > 0 ? "animation" : "")}>
                                <div className="displayPanel">
                                    <table className="logs-content-table">
                                        <thead>
                                            <tr>
                                                <th>时间</th>
                                                <th>类型</th>
                                                <th>攻击来源</th>
                                                <th>攻击目标</th>
                                            </tr>
                                        </thead>
                                        {logsList}
                                    </table>
                                </div>
                            </div>
                        </div>
                    </Row>


                    <div className='Dmap-title'>
                        <Row className='Dmap-title-number'>全球网络安全状态监控</Row>
                        <Row className='Dmap-title-time'>
                            <div style={{ fontSize: '10px', marginTop: '5px' }}>最后更新时间</div>
                            <div style={{ fontSize: '24px', color: '#F28321', marginTop: '6px' }}>{this.state.refreshTime}</div>
                        </Row>
                        <Row className='Dmap-title-line'></Row>
                    </div>

                    <div className='DmaptitleHypotenuse'>
                    </div>

                    <div className='DmapCopyRight'>
                        {/*<div style={{ marginTop: '16px', marginLeft: '10px', color: '#A1A6AD' }}>  ©-2020 Octa Innovations. All rights reserved.</div>*/}
                    </div>

                    <div className='DmaptitleRightHypotenuse'>
                    </div>



                    <div className='displayHypotenuse'>
                    </div>

                    {/*攻击类型图例，点击可控制地图上点和线的显示与隐藏*/}
                    <div className="AttackContainer">
                        <div style={{ height: '1px', width: '100%', marginTop: '6px', background: '#F28321' }}></div>

                        <div className={"http-defense type " + this.state.isTypeClicked[0]}>

                            <Row className="type-icons" onClick={this.showData.bind(this, 0)}>
                                <div className='http-defense-left'></div>
                                <div className='http-defense-right'>
                                    <div className='http-defense-title'>
                                        <div style={{ background: '#444851', width: '60%', float: 'left', height: '18px' }}>HTTP防御</div>
                                        <div className='type-icons-bg'></div>
                                    </div>
                                    <div style={{ marginTop: '5%' }}>
                                        <div style={{ float: 'left', fontSize: '30px', marginTop: '5%' }}>
                                            {this.state.typeCountState ? this.formatNumber(parseFloat(this.state.typeCountState[this.attackTypes[0]])) : 0}
                                        </div>
                                        <div style={{ float: 'right', }}>
                                            <div style={{ color: '#A1A6AD', textAlign: 'right' }}>{this.state.refreshTime}</div>
                                            <div>

                                                {this.typeCountInfo ?
                                                    this.state.typeCountState[this.attackTypes[0]] - this.typeCountInfo > 0 ?
                                                        <div style={{ color: '#F28321' }}>
                                                            <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>
                                                            {this.formatNumber(parseFloat(this.state.typeCountState[this.attackTypes[0]] - this.typeCountInfo[this.attackTypes[0]]))}
                                                        </div> :
                                                        <div style={{ color: '#F28321' }}>
                                                            <i className="fa fa-arrow-alt-circle-down" style={{ marginRight: '3px' }}></i>
                                                            {this.formatNumber(parseFloat(this.state.typeCountState[this.attackTypes[0]] - this.typeCountInfo[this.attackTypes[0]]))}
                                                        </div> :
                                                    <div style={{ color: '#F28321' }}>
                                                        <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>
                                                        0
                                                    </div>
                                                }

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Row>
                            <Row className='type-icons-bottom'>
                            </Row>
                            {/* */}

                            {/* <Row>HTTP防御</Row>
                          <Row><span className="count" id="count0">{this.typeCount[this.attackTypes[0]]}</span></Row> */}

                        </div>
                        <div className={"dos-attack type " + this.state.isTypeClicked[1]}>

                            <Row className={"type-icons"} onClick={this.showData.bind(this, 1)}>
                                <div className='dos-attack-left'></div>
                                <div className='http-defense-right'>
                                    <div className='http-defense-title'>
                                        <div style={{ background: '#444851', width: '60%', float: 'left', height: '18px' }}>DOS攻击防护</div>
                                        <div className='type-icons-bg'></div>
                                    </div>
                                    <div style={{ marginTop: '5%' }}>
                                        <div style={{ float: 'left', fontSize: '30px', marginTop: '5%' }}>
                                            {this.state.typeCountState ? this.formatNumber(parseFloat(this.state.typeCountState[this.attackTypes[1]])) : 0}
                                        </div>
                                        <div style={{ float: 'right', }}>
                                            <div style={{ color: '#A1A6AD', textAlign: 'right' }}>{this.state.refreshTime}</div>
                                            <div style={{ color: '#F28321' }}>
                                                {this.typeCountInfo ?
                                                    this.state.typeCountState[this.attackTypes[1]] - this.typeCountInfo > 0 ?
                                                        <div style={{ color: '#F28321' }}>
                                                            <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>
                                                            {this.formatNumber(parseFloat(this.state.typeCountState[this.attackTypes[1]] - this.typeCountInfo[this.attackTypes[1]]))}
                                                        </div> :
                                                        <div style={{ color: '#F28321' }}>
                                                            <i className="fa fa-arrow-alt-circle-down" style={{ marginRight: '3px' }}></i>
                                                            {this.formatNumber(parseFloat(this.state.typeCountState[this.attackTypes[1]] - this.typeCountInfo[this.attackTypes[1]]))}
                                                        </div> :
                                                    <div style={{ color: '#F28321' }}>
                                                        <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>
                                                        0
                                                </div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Row>
                            <Row className='type-icons-bottom'>
                            </Row>

                            {/*  <Row>DOS攻击防护</Row> <Row><span className="count" id="count1">{this.typeCount[this.attackTypes[1]]}</span></Row>*/}

                        </div>

                        <div className={"web-attack type " + this.state.isTypeClicked[2]}>

                            <Row className={"type-icons"} onClick={this.showData.bind(this, 2)}>



                                <div className='web-attack-left'></div>
                                <div className='http-defense-right'>
                                    <div className='http-defense-title'>
                                        <div style={{ background: '#444851', width: '60%', float: 'left', height: '18px' }}>Web攻击</div>
                                        <div className='type-icons-bg'></div>
                                    </div>
                                    <div style={{ marginTop: '5%' }}>
                                        <div style={{ float: 'left', fontSize: '30px', marginTop: '5%' }}>
                                            {this.state.typeCountState ? this.formatNumber(parseFloat(this.state.typeCountState[this.attackTypes[3]])) : 0}
                                        </div>
                                        <div style={{ float: 'right', }}>
                                            <div style={{ color: '#A1A6AD', textAlign: 'right' }}>{this.state.refreshTime}</div>
                                            <div style={{ color: '#F28321' }}>
                                                {this.typeCountInfo ?
                                                    this.state.typeCountState[this.attackTypes[2]] - this.typeCountInfo > 0 ?
                                                        <div style={{ color: '#F28321' }}>
                                                            <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>
                                                            {this.formatNumber(parseFloat(this.state.typeCountState[this.attackTypes[2]] - this.typeCountInfo[this.attackTypes[2]]))}
                                                        </div> :
                                                        <div style={{ color: '#F28321' }}>
                                                            <i className="fa fa-arrow-alt-circle-down" style={{ marginRight: '3px' }}></i>
                                                            {this.formatNumber(parseFloat(this.state.typeCountState[this.attackTypes[2]] - this.typeCountInfo[this.attackTypes[2]]))}
                                                        </div> :
                                                    <div style={{ color: '#F28321' }}>
                                                        <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>
                                                        0
                                                </div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </Row>
                            <Row className='type-icons-bottom'>
                            </Row>

                            {/*  <Row>Web攻击</Row>   <Row><span className="count" id="count2">{this.typeCount[this.attackTypes[2]]}</span></Row> */}

                        </div>


                        <div className={"sensitive-data-tracking type " + this.state.isTypeClicked[3]}>

                            <Row className={"type-icons"} onClick={this.showData.bind(this, 3)}>
                                <div className='sensitive-data-tracking-left'></div>
                                <div className='http-defense-right'>
                                    <div className='http-defense-title'>
                                        <div style={{ background: '#444851', width: '60%', float: 'left', height: '18px' }}>敏感数据跟踪</div>
                                        <div className='type-icons-bg'></div>
                                    </div>
                                    <div style={{ marginTop: '5%' }}>
                                        <div style={{ float: 'left', fontSize: '30px', marginTop: '5%' }}>
                                            {this.state.typeCountState ? this.formatNumber(parseFloat(this.state.typeCountState[this.attackTypes[3]])) : 0}
                                        </div>
                                        <div style={{ float: 'right', }}>
                                            <div style={{ color: '#A1A6AD', textAlign: 'right' }}>{this.state.refreshTime}</div>
                                            <div style={{ color: '#F28321' }}>
                                                {this.typeCountInfo ?
                                                    this.state.typeCountState[this.attackTypes[3]] - this.typeCountInfo > 0 ?
                                                        <div style={{ color: '#F28321' }}>
                                                            <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>
                                                            {this.formatNumber(parseFloat(this.state.typeCountState[this.attackTypes[3]] - this.typeCountInfo[this.attackTypes[3]]))}
                                                        </div> :
                                                        <div style={{ color: '#F28321' }}>
                                                            <i className="fa fa-arrow-alt-circle-down" style={{ marginRight: '3px' }}></i>
                                                            {this.formatNumber(parseFloat(this.state.typeCountState[this.attackTypes[3]] - this.typeCountInfo[this.attackTypes[3]]))}
                                                        </div> :
                                                    <div style={{ color: '#F28321' }}>
                                                        <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>
                                                        0
                                                </div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Row>
                            <Row className='type-icons-bottom'>
                            </Row>

                            {/*  <Row>敏感数据跟踪</Row>  <Row><span className="count" id="count3">{this.typeCount[this.attackTypes[3]]}</span></Row>*/}
                        </div>
                        <div className={"identification-error type " + this.state.isTypeClicked[4]}>

                            <Row className={"type-icons"} onClick={this.showData.bind(this, 4)}>
                                <div className='identification-error-left'></div>
                                <div className='http-defense-right'>
                                    <div className='http-defense-title'>
                                        <div style={{ background: '#444851', width: '60%', float: 'left', height: '18px' }}>缺陷鉴定</div>
                                        <div className='type-icons-bg'></div>
                                    </div>
                                    <div style={{ marginTop: '5%' }}>
                                        <div style={{ float: 'left', fontSize: '30px', marginTop: '5%' }}>
                                            {this.state.typeCountState ? this.formatNumber(parseFloat(this.state.typeCountState[this.attackTypes[4]])) : 0}
                                        </div>
                                        <div style={{ float: 'right', }}>
                                            <div style={{ color: '#A1A6AD', textAlign: 'right' }}>{this.state.refreshTime}</div>
                                            <div style={{ color: '#F28321' }}>
                                                {this.typeCountInfo ?
                                                    this.state.typeCountState[this.attackTypes[4]] - this.typeCountInfo > 0 ?
                                                        <div style={{ color: '#F28321' }}>
                                                            <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>
                                                            {this.formatNumber(parseFloat(this.state.typeCountState[this.attackTypes[4]] - this.typeCountInfo[this.attackTypes[4]]))}
                                                        </div> :
                                                        <div style={{ color: '#F28321' }}>
                                                            <i className="fa fa-arrow-alt-circle-down" style={{ marginRight: '3px' }}></i>
                                                            {this.formatNumber(parseFloat(this.state.typeCountState[this.attackTypes[4]] - this.typeCountInfo[this.attackTypes[4]]))}
                                                        </div> :
                                                    <div style={{ color: '#F28321' }}>
                                                        <i className="fa fa-arrow-alt-circle-up" style={{ marginRight: '3px' }}></i>
                                                        0
                                                </div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Row>
                            <Row className='type-icons-bottom'>
                            </Row>

                            {/*  <Row>缺陷鉴定</Row> <Row><span className="count" id="count4">{this.typeCount[this.attackTypes[4]]}</span></Row> */}
                        </div>
                    </div>
                    {/*点击坐标点后显示的攻击详情窗口*/}
                    <div className="ItemsDetailBlocker">
                        <div className="ItemsDetail">
                            <div className="location"></div>
                            <div className="itemsPanel">
                                <input className="btn-close" type="button" value="X" onClick={this.closeDetail.bind(this)} />
                                <div className="inner-list">
                                    <div className="inner-title detail1">攻击源：</div>
                                    <div className="inner-text source-ip">
                                        <span className='detail2'>数据初始化中...</span>
                                    </div>
                                </div>
                                <div className="inner-list">
                                    <div className="inner-title detail3">攻击目标：</div>
                                    <div className="inner-text target-ip">
                                        <span className='detail4'>数据初始化中...</span>
                                    </div>
                                </div>
                                <div className="inner-list">
                                    <div className="inner-title">攻击类型：</div>
                                    <div className="inner-text attack-type">
                                        <span className='detail6'>数据初始化中...</span>
                                    </div>
                                </div>
                                <div className="inner-list">
                                    <div className="inner-title">攻击时间：</div>
                                    <div className="inner-text occur_time">
                                        <span className='detail7'>数据初始化中...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        )
    }
}