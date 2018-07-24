import React from "react";
import $ from 'jquery';
import echarts from "echarts"
export default class DatabaseRelate extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            databaseData: [],//数据库拓扑图源数据
            errorOrNot: true,
            isIE11:false, //是否是IE11
        }
    }
    isIE11(){
        if((!!window.ActiveXObject || "ActiveXObject" in window) && navigator.userAgent.indexOf('rv:11.0')>-1){
            this.setState({
                isIE11:true,
            })
            return true
        }else{
            this.setState({
                isIE11:false,
            })
            return false
        }
    }
    getDataRelate() {

        var rootSymbol = '';
        var dataBaseSymbol = ''
        var wafSymbol = '';
        var ipsSymbol = '';
        var idsSymbol = '';
        var attactSymbol = ''
        if(this.state.isIE11){
            rootSymbol = 'circle';
            dataBaseSymbol = 'circle';
            ipsSymbol = 'circle';
            wafSymbol = 'circle';
            idsSymbol = 'circle';
            attactSymbol = 'circle' ;
        }else{
            rootSymbol = 'image://static/img/dataBase/dbic.svg'
            dataBaseSymbol = 'image://static/img/dataBase/dbic02.svg'
            wafSymbol = 'image://static/img/dataBase/WAF.svg'
            idsSymbol = 'image://static/img/dataBase/IDS.svg'
            ipsSymbol = 'image://static/img/dataBase/IPS.svg'
            attactSymbol = 'image://static/img/dataBase/attack.svg'
        }

        //获取database信息,发送ajax请求
        var self = this;
        $.ajax({
            url: '/api/get_host_db_details/',
            type: 'POST',
            dataType: 'json',
            data: {
                page: 1,//页码数，暂时只有一页
                size: 10//获取页码的长度
            },
            cache: false,
            success: function(data) { //成功执行方法
                // console.log(JSON.stringify(data.state))
                // 设置拓扑图源数据
                self.setState({
                    databaseData: data.nodes
                })
                //生成假数据，由于后台暂时无功能，当某个主机被攻击时，给这个主机增加三个防护效果
                data.nodes.map(function(arr) {
                    if (arr.hostIP) {
                        if (arr.state == 'error') {
                            self.setState({
                                databaseData: self.state.databaseData.concat([
                                    { "parent": arr.hostIP, "name": arr.hostIP + ":WAF", 'state': 'save-waf' },
                                    { "parent": arr.hostIP, "name": arr.hostIP + ":IPS", 'state': 'save-ips' },
                                    { "parent": arr.hostIP, "name": arr.hostIP + ":IDS", 'state': 'save-ids' }
                                ])
                            })
                        } else if (arr.state == 'safe') {
                            self.setState({
                                databaseData: self.state.databaseData
                            })
                        }
                    }
                })
                // 设置里引导图的默认线长
                var lineLenth = 200;
                var symbolSize = 25;
                // 根据获取数据的长度，即数据库的个数，设置不同的线长---setLine()
                function setLine(){
                    if(data.nodes.length<=200&&data.nodes.length>100){
                        lineLenth = 50
                        symbolSize = 18
                    }
                    if(data.nodes.length>200&&data.nodes.length<=500){
                        lineLenth = 20
                        symbolSize = 12
                    }
                    if(data.nodes.length>500){
                        lineLenth = 10
                        symbolSize = 10
                    }
                }
                setLine();
                //echarts中的线长配置项
                self.option.series[0].force = {
                    repulsion: lineLenth,
                }


                /*
                * 当主机host被攻击时，要给host上面加烟花效果
                * 设置初始化的一个变量，hostSafe 默认为0
                * 获取 data.status = error或者safe
                * 当error的时候就加烟花效果
                * */
                var hostSafe = 0

                if(data.status=='error'){
                    hostSafe = 3;
                    self.option.series[0].data = [
                        {
                            "name": 'host',
                            symbol: attactSymbol,
                            "draggable": "true",
                            "symbolSize": 60,
                            itemStyle:{
                                normal:{
                                    color:'#f00'
                                }
                            }
                        },
                        {
                            name: 'WAF',
                            category:'host',
                            "draggable": "true",
                            "symbolSize": 40,
                            symbol: wafSymbol,
                            itemStyle:{
                                normal:{
                                    color:'#4ACDEC'
                                }
                            }
                        },
                        {
                            name: 'IPS',
                            category:'host',
                            "draggable": "true",
                            "symbolSize": 40,
                            symbol: ipsSymbol,
                            itemStyle:{
                                normal:{
                                    color:'#007ae1'
                                }
                            }
                        },
                        {
                            name: 'IDS',
                            category:'host',
                            "draggable": "true",
                            "symbolSize": 40,
                            symbol: idsSymbol,
                            itemStyle:{
                                normal:{
                                    color:'#A48CFF'
                                }
                            }
                        }
                    ]
                    self.option.series[0].links = [
                        {
                            source: 'host',
                            target: 'WAF',
                        },
                        {
                            source: 'host',
                            target: 'IPS',
                        },
                        {
                            source: 'host',
                            target: 'IDS',
                        },
                    ];
                }else{
                    // 初始化echrats的series中的data、links数据
                    self.option.series[0].data = [{
                        "name": 'host',
                        symbol: rootSymbol,
                        "draggable": "true",
                        "symbolSize": 40,
                    }];
                    self.option.series[0].links = [];
                }

                // navigator.appVersion.split(";")[9].split(')')[0].split(':')[1]=='11.0'
                // 数据map方法循环把ajax获取的data数据push到data和links中
                self.state.databaseData.map(function(arr, i) {
                    // arr项中有hostname，则生成主机项
                    if (arr.hostname) {
                        //根据state的状态，绘制不同的图像icon
                        if (arr.state == 'error') {
                            self.option.series[0].data[i + 1 + hostSafe] = {
                                name: arr.hostIP,
                                category: 'host',
                                "draggable": "true",
                                "symbolSize": 60,
                                symbol: attactSymbol,
                                itemStyle:{
                                    normal:{
                                        color:'#f00'
                                    }
                                }
                            }
                            self.option.series[0].links[i + hostSafe] = {
                                source: 'host',
                                target: arr.hostIP,
                            }
                        } else if (arr.state == 'safe') {
                            self.option.series[0].data[i + 1 + hostSafe] = {
                                name: arr.hostIP,
                                category: 'host',
                                "draggable": "true",
                                "symbolSize": 30,
                                symbol: rootSymbol
                            }
                            self.option.series[0].links[i + hostSafe] = {
                                source: 'host',
                                target: arr.hostIP,
                            }
                        }
                    }
                    // arr项中有parent，则生成数据库项
                    if (arr.parent) {
                        // 判断state的有无，绘制不同的图像icon
                        if (arr.state == 'save-waf') {
                            self.option.series[0].data[i + 1 + hostSafe] = {
                                name: arr.name,
                                category: arr.parent,
                                "draggable": "true",
                                "symbolSize": 40,
                                symbol: wafSymbol,
                                itemStyle:{
                                    normal:{
                                        color:'#4ACDEC'
                                    }
                                }
                            }
                            self.option.series[0].links[i + hostSafe] = {
                                source: arr.parent,
                                target: arr.name,
                            }
                        }
                        if (arr.state == 'save-ips') {
                            self.option.series[0].data[i + 1 + hostSafe] = {
                                name: arr.name,
                                category: arr.parent,
                                "draggable": "true",
                                "symbolSize": 40,
                                symbol: ipsSymbol,
                                itemStyle:{
                                    normal:{
                                        color:'#007ae1'
                                    }
                                }
                            }
                            self.option.series[0].links[i + hostSafe] = {
                                source: arr.parent,
                                target: arr.name,
                            }
                        }
                        if (arr.state == 'save-ids') {
                            self.option.series[0].data[i + 1 + hostSafe] = {
                                name: arr.name,
                                category: arr.parent,
                                "draggable": "true",
                                "symbolSize": 40,
                                symbol: idsSymbol,
                                itemStyle:{
                                    normal:{
                                        color:'#A48CFF'
                                    }
                                }
                            }
                            self.option.series[0].links[i + hostSafe] = {
                                source: arr.parent,
                                target: arr.name,
                            }
                        }
                        if (!arr.state) {
                            self.option.series[0].data[i + 1 + hostSafe] = {
                                name: arr.parent+'：'+arr.name,
                                category: arr.parent,
                                symbolSize:symbolSize,
                                symbol:dataBaseSymbol,
                                "draggable": "true"
                            }
                            self.option.series[0].links[i + hostSafe] = {
                                source: arr.parent,
                                target: arr.parent+'：'+arr.name
                            }
                        }
                    }

                })
                // 绘制echarts
                if(document.getElementById('datase-relation')){
                    var mychart = echarts.init(document.getElementById('datase-relation'));
                    mychart.setOption(self.option);
                }                
            }
        });

    }

    componentWillMount() {
        this.isIE11()
        var rootSymbol = ''
        var dataBaseSymbol = ''
        if(this.state.isIE11){
            rootSymbol = 'circle';
            dataBaseSymbol = 'circle';
        }else{
            rootSymbol = 'image://static/img/dbic.svg'
            dataBaseSymbol = 'image://static/img/dbic02.svg'
        }
        this.option = {
            backgroundColor: '#252830',
            // animationThreshold: 1,
            // animationDuration: 100000,
            // animationEasing: 'cubicOut',
            // animationEasingUpdate: 'quinticInOut',
            layout: 'force',
            animation: false,
            tooltip: {
                trigger: 'item',
                backgroundColor: '#444851',
                formatter: "{b}"
            },
            series: [{
                name: 'host',
                type: 'graph',
                symbol: dataBaseSymbol,
                "symbolSize": 10,
                force: {
                    repulsion: 200
                },
                "itemStyle": {
                    normal: {
                        color: '#979797',
                    }
                },
                data: [{
                    "name": 'host',
                    symbol: rootSymbol,
                    "draggable": "true",
                    "symbolSize": 10,
                }],
                links: [],
                focusNodeAdjacency: true,
                roam: true,
                nodeScaleRatio:0.1,
                layoutAnimation:false,
                label: {
                    normal: {
                        show: false, //控制图标数据不展示
                        position: 'top'
                    }
                },
                lineStyle: {
                    normal: {
                        color: 'source',
                        curveness: 0,
                        type: "solid"
                    }
                }
            }]
        };

        //延迟一秒执行echarts
        var self = this;
        setTimeout(function(){
            self.getDataRelate();
        },1000)
    }
    componentDidMount() {
        var self = this;
        this.changeRelate = setInterval(function() {
            self.getDataRelate();
        }, 20000)
        $(window).resize(function () {
            var myChart = echarts.init(document.getElementById('datase-relation'));
            myChart.resize({
                width:myChart.clientWidth
            })
        })
    }

    componentWillUnmount() {
        clearInterval(this.changeRelate)
    }
    render() {
        return ( 
            <div style = {{ opacity: this.props.selectDatabase ? '0' : '1' }} className={this.props.selectDatabase?'tabDatabaseDetail':''}>
            <div id = "datase-relation" style = {{ width: "100%", height: "720px" }} >
            </div>

            </div>
        )
    }
}