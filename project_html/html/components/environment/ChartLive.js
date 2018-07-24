
import React from "react"         //引入react
import echarts from 'echarts';     //引入echarts  



/*历史实时变化折线图*/
export default class ChartLive extends React.Component {
    constructor(props) {
        super(props);    
        this.state = {chartLive: null}
    }

    //legend的数据
    getLegend() {
        var levelLegend = this.props.levelClass;
        var levelClassLegend = [];
        for (var i in levelLegend) {
            if(levelLegend.hasOwnProperty(i)){  //过滤掉从原型继承来的属性
                levelClassLegend.push(levelLegend[i]);
            }            
        }
        return levelClassLegend;
    }

    // 绘制历史实时变化折线图
    drawChartLive(result, dom) {
        this.liveChart = echarts.init(dom);
        var date = result.date;
        var series_data = result.data;
        var levelClass = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];
        var legendData = this.getLegend();
        var lineColor = {
            'DEBUG': '#0079E0',
            'INFO': '#9E86FF ',
            'WARNING': '#00B0F5',
            'ERROR': '#9E86FF',
            'CRITICAL': '#9E86FF'
        };

        var fillColor_from = 'rgba(255, 255, 255, 0.7)';
        this.option = {
            tooltip: {
                trigger: 'axis',
                position: function (pt) {
                    return [pt[0], '10%'];
                },
                formatter: function (params) {
                    var res = params[0].name;
                    for (var i = 0, l = params.length; i < l; i++) {
                        res += '<br/>' + params[i].seriesName + ' : ' + params[i].value;
                    }
                    return res;
                }
            },
            textStyle: {
                color: '#ffffff',
                fontSize: 12
            },
            grid: {
                x: '15%'
            },
            legend: {
                y: 'bottom',
                x: 'center',
                data: legendData,
                textStyle: {
                    color: '#ffffff',
                    fontSize: 10
                },
                itemWidth: 6,
                itemHeight: 6
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
                data: date
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
                }, axisTick: {//图3所示
                    show: false
                },
                splitLine: {//终于找到了，背景图的内置表格中“边框”的颜色线条  这个是x跟y轴的线
                    show: true,
                    lineStyle: {
                        color: "rgba(221,221,221,0.1)",
                        type: "solid"
                    }
                }
            },
            dataZoom: [{
                type: 'inside',
                start: 0,
                end: 100
            }, {
                start: 0,
                end: 10,
                show: true,
                height: 1,
                dataBackgroundColor: 'rgba(221,221,221,0.1)',
                fillerColor: 'rgba(221,221,221,0.9)',
                textStyle: {
                    color: '#fff'
                }
            }],
            series: [
                {
                    name: legendData[0],
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    sampling: 'average',
                    itemStyle: {
                        normal: {
                            color: lineColor['DEBUG']
                        }
                    },
                    areaStyle: {
                        normal: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                offset: 0,
                                color: fillColor_from
                            }, {
                                offset: 1,
                                color: lineColor['DEBUG']
                            }])
                        }
                    },
                    data: series_data[levelClass[0]]
                },
                {
                    name: legendData[1],
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    sampling: 'average',
                    itemStyle: {
                        normal: {
                            color: lineColor['INFO']
                        }
                    },
                    areaStyle: {
                        normal: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                offset: 0,
                                color: fillColor_from
                            }, {
                                offset: 1,
                                color: lineColor['INFO']
                            }])
                        }
                    },
                    data: series_data[levelClass[1]]
                },
                {
                    name: legendData[2],
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    sampling: 'average',
                    itemStyle: {
                        normal: {
                            color: lineColor['WARNING']
                        }
                    },
                    areaStyle: {
                        normal: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                offset: 0,
                                color: fillColor_from
                            }, {
                                offset: 1,
                                color: lineColor['WARNING']
                            }])
                        }
                    },
                    data: series_data[levelClass[2]]
                }
                ,
                {
                    name: legendData[3],
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    sampling: 'average',
                    itemStyle: {
                        normal: {
                            color: lineColor['ERROR']
                        }
                    },
                    areaStyle: {
                        normal: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                offset: 0,
                                color: fillColor_from
                            }, {
                                offset: 1,
                                color: lineColor['ERROR']
                            }])
                        }
                    },
                    data: series_data[levelClass[3]]
                }
                ,
                {
                    name: legendData[4],
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    sampling: 'average',
                    itemStyle: {
                        normal: {
                            color: lineColor['CRITICAL']
                        }
                    },
                    areaStyle: {
                        normal: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                offset: 0,
                                color: fillColor_from
                            }, {
                                offset: 1,
                                color: lineColor['CRITICAL']
                            }])
                        }
                    },
                    data: series_data[levelClass[4]]
                }
            ]
        };
        this.liveChart.setOption(this.option, true);
    }
    dataClean(data) {
        return {
            date: data.date,
            data: {
                "DEBUG": data.DEBUG,
                'INFO': data.INFO,
                'WARNING': data.WARNING,
                'ERROR': data.ERROR,
                'CRITICAL': data.CRITICAL
            }
        };
    }

    //组件已经成功被渲染
    componentDidMount() {
        var dom = document.getElementById(this.props.id);
        this.drawChartLive(this.dataClean(this.props.data), dom);
    }

    //  组件是否需要更新
    shouldComponentUpdate(nextProps) {
        return (this.props.isGraph&&nextProps.data!==this.props.data);
    }

    // 组件是否需要更新前
    componentWillUpdate() {
        /*更新title、legend、name*/
        var result_new = this.dataClean(this.props.data);
        var data = result_new.data;
        this.option.series[0].data = data.DEBUG;
        this.option.series[1].data = data.INFO;
        this.option.series[2].data = data.WARNING;
        this.option.series[3].data = data.ERROR;
        this.option.series[4].data = data.CRITICAL;
        var levelClass = this.getLegend();
        this.option.legend.data = levelClass;
        for (var i = 0; i < 5; i++) {
            this.option.series[i].name = levelClass[i];
        }
        this.liveChart.setOption(this.option, true);
    }

    //渲染页面
    render() {
        return <div id={this.props.id}  style = {{ width: "100%", height: "300px" }}> </div>
    }
}