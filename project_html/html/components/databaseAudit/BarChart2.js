/**
 * 数据库审计页面柱状图
 */
import React from "react";                            //引入react
import echarts from "echarts";                       // 引入echarts

// 向外暴露BarChart2模块
export default class BarChart2 extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            option1: null
        }
    }

    // 组件渲染完成后
    componentDidMount() {
        var self = this;

        setTimeout(function () {
            self.setState({
                option1: {
                    color: ['transparent', new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                        offset: 0,
                        color: 'rgba(0,122,225,1)'
                    }, {
                        offset: 1,
                        color: 'rgba(16,50,142,1)'
                    }])],
                    // tooltip : {
                    //     trigger: 'axis',
                    //     axisPointer : {            // 坐标轴指示器，坐标轴触发有效
                    //         type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
                    //     }
                    // },
                    // legend: {
                    //     data:['直接访问','邮件营销','联盟广告','视频广告']
                    // },
                    grid: {
                        left: '3%',
                        right: '4%',
                        bottom: '3%',
                        containLabel: true
                    },
                    xAxis: [
                        {
                            type: 'category',
                            splitLine: {
                                show: true,
                                lineStyle: {
                                    color: "#444851"
                                }
                            },
                            axisLine: {          //x轴线
                                // 横坐标的颜色控制
                                lineStyle: {
                                    color: '#444851'
                                }
                            },
                            axisLabel: {         //x轴标签
                                textStyle: {
                                    color: '#fff'
                                }
                            },
                            data: (function () {    //默认时间轴为最近12天的日期
                                var now = new Date();
                                var res = [];
                                var len = 12;
                                while (len--) {
                                    res.unshift(now.getMonth() + 1 + '月' + now.getDate());
                                    now = new Date(now - 1000 * 60 * 60 * 24);
                                }
                                return res;
                            })()
                        }
                    ],
                    yAxis: [
                        {
                            type: 'value',
                            splitNumber: 12,
                            splitLine: {
                                show: true,
                                lineStyle: {
                                    color: "#444851"
                                }
                            },
                            axisLine: {          //y轴线
                                // 横坐标的颜色控制
                                lineStyle: {
                                    color: '#444851'
                                }
                            },
                            axisLabel: {         //y轴标签
                                textStyle: {
                                    color: '#fff'
                                }
                            },
                        }
                    ],
                    series: [
                        {
                            name: '非常规',
                            type: 'bar',
                            stack: '1',
                            1: '60%',
                            data: [11, 1, 5, 11, 17, 7, 1, 5, 16, 3, 8, 3],
                            itemStyle: {
                                normal: {
                                    barBorderRadius: 83
                                }
                            }

                        },
                        {
                            name: '常规',
                            type: 'bar',
                            stack: '1',
                            barCategoryGap: '60%',
                            data: [5, 2, 2, 1, 3, 10, 5, 9, 4, 3, 4, 5],
                            itemStyle: {
                                normal: {
                                    barBorderRadius: 83
                                }
                            }
                        },
                        {
                            name: '非常规',
                            type: 'bar',
                            stack: '1',
                            barCategoryGap: '60%',
                            data: [0, 10, 8, 9, 0, 3, 7, 0, 1, 4, 7, 12],
                            itemStyle: {
                                normal: {
                                    barBorderRadius: 83
                                }
                            }
                        },
                        {
                            name: '常规',
                            type: 'bar',
                            stack: '1',
                            data: [0, 8, 3, 2, 0, 4, 2, 0, 3, 0, 2, 3],
                            itemStyle: {
                                normal: {
                                    barBorderRadius: 83
                                }
                            }
                        }
                    ]
                }
            })
            var chart = echarts.init(document.getElementById('second-barchart'));
            // 设置数据
            chart.setOption(self.state.option1, true);
        }, 1000);
        // 初始化Echart
    
    }

    render() {
        return (
            <section>
                <div><p>用户操作时间分布</p><hr /></div>
                {/*自定义图例*/}
                <div className='legends-group'>
                    <div className="legend-one"></div><p style={{marginTop:0}}>非常规操作时间</p>
                    <div className="legend-two"></div><p style={{marginTop:0}}>常规操作时间</p>
                </div>
                <div className="description-center">
                    {/*<p>Donec facilisis tortor ut augue lacinia,at viverra eset semper.Sed sapien metus, scelerisque nec pharetra</p>
                     <p>    id, tempor a tortor ,Pellentesque non dignissim neque, Ut porta viverra est, ut dignisssim elit elementum ut. </p> */}
                </div>
                <div id="second-barchart"></div>
            </section>
        )
    }
}