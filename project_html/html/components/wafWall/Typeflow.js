import React from "react"
import $ from "jquery";
import echarts from "echarts";

/*echarts 流量来源图表组件*/
export default class Typeflow extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            selfData: { //监控流量初始化
                uploadSpeed: 0,
                downloadSpeed: 0
            }
        }
    }
    /**
     * ajax请求，获取流量上传与下载值
     */
    getNetChart() {
        var self = this;
        $.ajax({
            url: '/api/netinfo/',
            type: 'GET',
            dataType: 'json',
            cache: false,
            success: function (data) {
                //code为101页面失效
                if (data.code == "101") {
                    return;
                }
                self.setState({
                    selfData: data
                })
            }
        })
    }
    /**
     * 组件将要加载时的操作
     */
    componentWillMount() {
        this.option = {
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
                data: ['上行', '下行'],
                top: 10,
                left: 24,
                textStyle: {
                    color: "#fff"
                }
            },
            dataZoom: {
                show: false,
                start: 40,
                end: 100,
                // filterMode: 'empty'
            },
            xAxis: [{
                type: 'category',
                boundaryGap: 0, //坐标轴留白
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: "#444851"
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: '#a1a6ad'
                    }
                },
                data: (function () {
                    // 生成时间坐标轴
                    var now = new Date();
                    var res = [];
                    var len = 30;
                    while (len--) {
                        res.unshift(now.toLocaleTimeString().replace(/^\D*/, ''));
                        now = new Date(now - 5000);
                    }
                    return res;
                })()
            }],
            yAxis: [{
                type: 'value',
                scale: true,
                name: '',
                max: 100,
                min: 0,
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: "#444851"
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: '#a1a6ad'
                    }
                },
                boundaryGap: [0.2, 0.2]
            }],
            series: [{
                    name: '上行',
                    type: 'line',
                    symbol: 'none',
                    smooth: true,
                    itemStyle: {
                        normal: {
                            color: "#007AE1"
                        }
                    },
                    lineStyle: {
                        normal: {
                            color: "#007AE1"
                        }
                    },
                    areaStyle: {
                        normal: {
                            color: "#007AE1",
                            opacity: 0.1
                        }
                    },
                    data: (function () {
                        // 页面加载时，由于无数据，所以将上传下载值都设置为0
                        var res = [];
                        var len = 0;
                        while (len < 30) {
                            res.push(0);
                            len++;
                        }
                        return res;
                    })()
                },
                {
                    name: '下行',
                    type: 'line',
                    symbol: 'none',
                    smooth: true,
                    itemStyle: {
                        normal: {
                            color: "#A26EEC"
                        }
                    },
                    lineStyle: {
                        normal: {
                            color: "#9F86FF"
                        }
                    },
                    areaStyle: {
                        normal: {
                            color: "#9F86FF",
                            opacity: 0.1
                        }
                    },
                    data: (function () {
                        // 页面加载时，由于无数据，所以将上传下载值都设置为0
                        var res = [];
                        var len = 0;
                        while (len < 30) {
                            res.push(0);
                            len++;
                        }
                        return res;
                    })()
                }
            ]
        };
    }

    /**
     * 组件已经加载时的操作
     */
    componentDidMount() {
        var flowData1 = {
            numData: 0
        }; //初始化浏览上传与下载值--下载
        var flowData2 = {
            numData: 0
        }; //初始化浏览上传与下载值--上传
        var self = this;
        var maxFlow = 100; //设置初始化流量最大值100
        var myChartType = echarts.init(document.getElementById('typeflow'));
        myChartType.setOption(this.option);
        // 定义定时器,定时刷新图标时间,和获取的数据
        this.flowUpdate = setInterval(function () {
            // ajax请求数据
            self.getNetChart();
            //获取当前时间
            var axisData;
            axisData = (new Date()).toLocaleTimeString().replace(/^\D*/, '');
            // 根据接口数据,设置流量的上传与下载值
            flowData1.numData = self.state.selfData.uploadSpeed
            flowData2.numData = self.state.selfData.downloadSpeed
            // 纵坐标最大值暂时先设置为下载速度的1.5倍，比较实时下载与之前一次请求获取的下载值比较，若大于0，则更新流量最大值
            maxFlow = parseInt(self.state.selfData.downloadSpeed * 1.5) > maxFlow ? parseInt(self.state.selfData.downloadSpeed * 1.5) : maxFlow
            self.option.yAxis[0].max = maxFlow
            // 写入第一组数据
            var data0 = self.option.series[0].data;
            data0.shift();
            data0.push(flowData1.numData);
            // 写入第二组数据
            var data1 = self.option.series[1].data;
            data1.shift(); //去掉数组的第一个
            data1.push(flowData2.numData); //在数组末尾增加一个
            // 更新时间
            self.option.xAxis[0].data.shift(); //去掉数组的第一个
            self.option.xAxis[0].data.push(axisData); //在数组末尾增加一个
            // 重新绘制
            myChartType.setOption(self.option);

        }, 5000)

    }
    /**
     * 组件将要卸载时的操作
     */
    componentWillUnmount() {
        //离开页面时，去掉定时器
        clearInterval(this.flowUpdate);
    }
    
    render(){
        return (
            <div id="typeflow" style={{width:"100%",height:"300px"}}></div>
        )
    }
}