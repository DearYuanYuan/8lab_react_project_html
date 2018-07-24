/**
 * 数据库审计页面柱状图
 * Created by ZHONG Mengting
 * on 2017/04/21
 */
import React from "react";                            //引入react
import echarts from "echarts";                       // 引入echarts

// 向外暴露BarChart模块
export default class BarChart extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            option: null
        }
    }

    // 组件渲染完成后
    componentDidMount() {
        var self=this;
        setTimeout(function () {
            self.setState({
                option: {
                    // 鼠标悬停tip
                    tooltip: {
                        trigger: 'item',
                        axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                            type: 'shadow',        // 默认为直线，可选为：'line' | 'shadow'
                            axis: 'y'
                        },
                        formatter: function (params) {
                            //根据数据大小,提示相应的内容
                            var isNormal = (params.value > 100) ? 0 : 1;
                            var tips = ['过多', '正常'];
                            return '危险操作次数:' + tips[isNormal] + '<br />' + params.name + ' : ' + params.value;
                        }
                    },
                    xAxis: [
                        {
                            type: 'category',  //'category' 类目轴，适用于离散的类目数据，为该类型时必须通过 data 设置类目数据。
                            data: (function () {//默认时间轴为最近12天的日期
                                var now = new Date();
                                var res = [];
                                var len = 12;
                                while (len--) {
                                    res.unshift(now.getMonth() + 1 + '月' + now.getDate());
                                    now = new Date(now - 1000 * 60 * 60 * 24);
                                }
                                return res;
                            })(),
                            splitLine: {        //分割x轴的线条
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
                            }
                        }

                    ],
                    yAxis: [
                        {
                            type: 'value',
                            splitLine: {        //分割y轴的线条
                                show: true,
                                lineStyle: {
                                    color: "#444851"
                                }
                            },
                            axisLine: {          //y轴线
                                lineStyle: {
                                    color: '#444851'
                                }
                            },
                            axisLabel: {         //轴标签
                                textStyle: {
                                    color: '#fff'
                                }
                            }
                        }
                    ],
                    series: [
                        {
                            name: '正常危险操作次数',
                            type: 'bar',
                            data: [147, 78, 108, 50, 60, 120, 78, 90, 50, 60, 156, 78],
                            barCategoryGap: '60%',
                            itemStyle: {
                                normal: {
                                    barBorderRadius: 200,
                                    color: function (params) {
                                        //根据数据大小设定图形的颜色
                                        var color1 = new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                            offset: 0,
                                            color: 'rgba(159,134,255,1)'
                                        }, {
                                            offset: 1,
                                            color: 'rgba(71,41,125,1)'
                                        }])
                                        var color2 = new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                            offset: 0,
                                            color: 'rgba(0,122,225,1)'
                                        }, {
                                            offset: 1,
                                            color: 'rgba(16,50,142,1)'
                                        }])
                                        var colorList = [color1, color2];

                                        return colorList[params.data > 100 ? 0 : 1]
                                    }
                                }
                            },
                        }
                    ]
                }
            })
            var chart = echarts.init(document.getElementById('first-barchart'));
            // 设置数据
            chart.setOption(self.state.option, true);
        }, 1000);
    }

    render() {
        return (
            <section>
                <div><p>每日危险操作次数</p><hr /></div>
                {/*自定义图例*/}
                <div className='legends-group'>
                    <div className="legend-one"></div><p style={{marginTop:0}}>危险操作次数过多</p>
                    <div className="legend-two"></div><p style={{marginTop:0}}>危险操作次数正常</p>
                </div>
                <div id="first-barchart"></div>
            </section>
        )
    }
}