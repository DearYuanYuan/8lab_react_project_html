
// waf防火墙--网络流量显示模块
import React from "react"
import echarts from 'echarts';
import $ from 'jquery';

export default class NetChart extends React.Component {
    constructor(props) {
        super(props);  
        this.state = {
            quantityData : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            connectData :  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        }  
    }    
        
    getNetChart(){
        var self = this;
        $.ajax({
            url: '/api/netinfo/',
            type: 'GET',
            dataType: 'json',
            cache: false,
            success: succFunction //成功执行方法
        });

        function succFunction(data) {
            var quantity = data.downloadSpeed;
            var connect = data.uploadSpeed;
            var quantityData = self.state.quantityData;
            var connectData = self.state.connectData;
            quantityData.shift();
            connectData.shift();
            quantityData.push(quantity);
            connectData.push(connect);
            self.setState({
                quantityData:  quantityData,
                connectData:  connectData
            });
        }
    }
    componentWillMount(){
        this.option = {
            tooltip: {
                trigger: 'axis',
                position: function (pt) {
                    return [pt[0], '10%'];//划过时位置
                }

            },
            legend: {//标注样式
                data: this.props.seriesName,//
                bottom: 10,
                itemGap:5,//位置

                itemWidth: 15,
                itemHeight: 6//大小
            },
            title: {                            // 主标题文字
                text: this.props.title,
                textStyle: {
                    color: '#fff'
                }
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: [0,'','','','','','','','','','','','','',60],
                axisLabel: {
                    textStyle: { //设置标签的样式
                        color: 'rgba(255, 255, 255, 0)'
                    },
                    interval:0
                },
                axisLine: {//x轴、y轴的深色轴线，如图2
                    show: true,
                    lineStyle: {
                        color: 'rgba(221,221,221,0.1)'
                    }
                },
                axisTick: {//xy焦点
                    show:  true
                },
                splitLine: {//背景图的内置表格中“边框”的颜色线条  这个是x跟y轴轴的线
                    show: true,
                    lineStyle: {
                        color: "rgba(221,221,221,0.1)",
                        type: "solid"
                    }
                }
            },
            yAxis: {
                type: 'value',
                boundaryGap: ['0', '60%'],
                axisLabel: {
                    textStyle: { //设置标签的样式
                        color: 'rgba(255, 255, 255, 0.4)'
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
                splitLine: {//背景图的内置表格中“边框”的颜色线条  这个是x跟y轴的线
                    show: true,
                    lineStyle: {
                        color: "rgba(221,221,221,0.1)",
                        type: "solid"
                    }
                }
            },
            series: [
                {
                    name: this.props.seriesname[0],
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    sampling: 'average',
                    itemStyle: {
                        normal: {
                            color: 'rgb(67, 162, 20)'
                        }
                    },
                    data:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    areaStyle: {
                        normal: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                offset: 0,
                                color: 'rgb(67, 162, 20)'
                            }, {
                                offset: 1,
                                color:'rgb(217, 242, 204)'
                            }])
                        }
                    }
                },

                {
                    name: this.props.seriesname[1],
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    sampling: 'average',
                    itemStyle: {
                        normal: {
                            color: 'rgb(251, 81, 81)'
                        }
                    },
                    data:[0,0,0,0,0,0,0,0,0,0,0,0,0,3],
                    areaStyle: {
                        normal: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                offset: 0,
                                color: 'rgb(251, 81, 81)'
                            }, {
                                offset: 1,
                                color:   'rgb(248, 220, 220)'
                            }])
                        }
                    }
                }
            ]
        }

    }
    componentDidMount(){
        var chart3 = echarts.init(document.getElementById('chartLog'));
        chart3.setOption(this.option);
        var self = this;
        this.timeTicket = setInterval(function (){
            chart3.setOption(self.option);
            self.getNetChart();
        },500);
    }
    componentWillUpdate(){
        this.option.title.text = this.props.title;
        this.option.series[0].name = this.props.seriesname[0];
        this.option.series[0].data = this.state.quantityData;
        this.option.series[1].name = this.props.seriesname[1];
        this.option.series[1].data = this.state.connectData;
    }
    componentWillUnmount() {
        //离开页面时，去掉分数刷新的定时器
        if (this.timeTicket) {
            clearInterval(this.timeTicket);
        }
    }
    render(){
        return (
            <div id="chartLog"></div>
        );
    }
}