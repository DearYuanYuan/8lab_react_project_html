
import React from "react"                    //引入react
import echarts from 'echarts';               //引入echarts  
require('../../utils/utils.js');


/*今日变化曲线图*/
export default class ChartTodayLive extends React.Component {
    constructor(props) {
        super(props);   
        this.state = {chartTodayLive: null } 
    }    
    
    // 绘制今日变化曲线图
    drawChartTodayLive(resultToday, dom) {
        var date = resultToday.time;
        var data = resultToday.data;
        var lineColor = resultToday.lineColor;
        var fillColor_from = resultToday.fillColor_from;
        var fillColor_to = resultToday.fillColor_to;
        this.mychartsUpToNow = echarts.init(dom);
        this.optionUpToNow = {
            textStyle: {
                color: '#ffffff'
            },
            tooltip: {
                trigger: 'axis',
                position(pt) {
                    return [pt[0], '10%'];
                }
            },
            grid: {
                y: 20
            },
            title: {
                padding: 0,
                itemGap: 0
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                axisLabel: {
                    textStyle: {
                        color: "#959595"//x轴，y轴的数字颜色，如图1
                    }
                },
                axisLine: {//x轴、y轴的深色轴线，如图2
                    show: true,
                    lineStyle: {
                        color: 'rgba(221,221,221,0.1)'
                    }
                },
                axisTick: {//图3所示
                    show: false
                },
                splitLine: {//终于找到了，背景图的内置表格中“边框”的颜色线条  这个是x跟y轴轴的线
                    show: true,
                    lineStyle: {
                        color: "rgba(221,221,221,0.1)",
                        type: "solid"
                    }
                },
                data: date,
            },
            yAxis: {
                type: 'value',
                boundaryGap: [0, '100%'],
                axisLabel: {
                    textStyle: {
                        color: "#959595"//x轴，y轴的数字颜色，如图1
                    }
                },
                axisLine: {//x轴、y轴的深色轴线，如图2
                    show: true,
                    lineStyle: {
                        color: 'rgba(221,221,221,0.1)'
                    }
                },
                axisTick: {//图3所示
                    show: false
                },
                splitLine: {//终于找到了，背景图的内置表格中“边框”的颜色线条  这个是x跟y轴轴的线
                    show: true,
                    lineStyle: {
                        color: "rgba(221,221,221,0.1)",
                        type: "solid"
                    }
                },
                
            },
            dataZoom: [
                {
                    show: true,
                    realtime: true,
                    start: 90,
                    end: 100,
                    height: 1,
                    dataBackgroundColor: 'rgba(221,221,221,0.1)',
                    fillerColor: 'rgba(221,221,221,0.9)',
                    textStyle: {
                        color: '#fff'
                    }
                },
                {
                    type: 'inside',
                    realtime: true,
                    start: 65,
                    end: 85
                }
            ],
            series: [
                {
                    name: this.props.series_name,
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    sampling: 'average',
                    itemStyle: {
                        normal: {
                            color: lineColor
                        }
                    },
                    areaStyle: {
                        normal: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                offset: 0,
                                color: fillColor_from
                            }, {
                                offset: 1,
                                color: fillColor_to
                            }])
                        }
                    },
                    data: data
                }
            ]
        };
        this.mychartsUpToNow.setOption(this.optionUpToNow, true);
    }

    dataCleanTodayLiveFirst(data) {
        var LineColor = {
            'DEBUG': '#0079E0',
            'INFO': '#9E86FF ',
            'WARNING': '#00B0F5',
            'ERROR': '#9E86FF',
            'CRITICAL': '#9E86FF'
        };
        var FillColor_from = 'rgba(255, 255, 255, 0.7)';
        var FillColor_to = {
            'DEBUG': 'rgba(111, 216, 151, 0.7)',
            'INFO': 'rgba(108,182,208,0.7)',
            'WARNING': 'rgba(234,183,83,0.7)',
            'ERROR': 'rgba(230,89,86,0.7)',
            'CRITICAL': 'rgba(226,67,64,0.7)'
        };
        var TopLevel = 'DEBUG';
        var start = new Date().getTime() - 500 * 1000; //初始添加500个数据
        var newdata = Array.apply(null, Array(500)).map(function () {
            return 0;
        });
        var time = Array.apply(null, Array(500)).map(function (item, index) {
            var second = new Date(start + index * 1000).Format("hh:mm:ss");
            var dataIndex = data.time ? data.time.indexOf(second) : -1;
            if (dataIndex != -1) {
                newdata[index] = data.data[dataIndex];
            }
            return second;
        });
        return {
            time: time,
            data: newdata,
            lineColor: LineColor[TopLevel],
            fillColor_from: FillColor_from,
            fillColor_to: FillColor_to[TopLevel]
        };
    }

    //今日变化曲线图的一些数据
    dataCleanTodayLive(data) {
        var LineColor = {
            'DEBUG': '#0079E0',
            'INFO': '#9E86FF ',
            'WARNING': '#00B0F5',
            'ERROR': '#9E86FF',
            'CRITICAL': '#9E86FF'
        };
        var FillColor_from = 'rgba(255, 255, 255, 0.7)';

        var FillColor_to = {
            'DEBUG': 'rgba(2, 121, 224, 0.7)',
            'INFO': 'rgba(158,134,255,0.7)',
            'WARNING': 'rgba(0,176,245,0.7)',
            'ERROR': 'rgba(158,134,255,0.7)',
            'CRITICAL': 'rgba(158,134,255,0.7)'
        };
        var TopLevel = 'DEBUG';

        return {
            time: data.time,
            data: data.data,
            lineColor: LineColor[TopLevel],
            fillColor_from: FillColor_from,
            fillColor_to: FillColor_to[TopLevel]
        };
    }

    //组件成功渲染后
    componentDidMount() {
    //获取真实dom元素
        var dom = document.getElementById(this.props.id);
        this.drawChartTodayLive(this.dataCleanTodayLiveFirst(this.props.data), dom);
    }

    //组件是否需要更新
    shouldComponentUpdate(nextProps) {
        return (this.props.isGraph && nextProps.data !== this.props.data);
    }

    // 组件更新后
    componentDidUpdate() {
        var resultToday = this.dataCleanTodayLive(this.props.data);
        var date = resultToday.time;
        var data = resultToday.data;
        var lineColor = resultToday.lineColor;
        var fillColor_from = resultToday.fillColor_from;
        var fillColor_to = resultToday.fillColor_to;
        this.optionUpToNow.series[0].name = this.props.series_name;
        var len = date.length;
        if (len > 0) {
            for (var i = 0; i < len; i++) {
                this.optionUpToNow.series[0].data.push(data[i]);
                this.optionUpToNow.xAxis.data.push(date[i]);
            }
            this.optionUpToNow.series[0].itemStyle = {
                normal: {
                    color: lineColor
                }
            };
            this.optionUpToNow.series[0].areaStyle = {
                normal: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                        offset: 0,
                        color: fillColor_from
                    }, {
                        offset: 1,
                        color: fillColor_to
                    }])
                }
            };
        }
        this.mychartsUpToNow.setOption(this.optionUpToNow, true);

    }

    // 渲染页面
    render() {
        return <div id={this.props.id} style = {{ width: "100%", height: "479px","paddingTop": "6%" }}></div>
    }
}