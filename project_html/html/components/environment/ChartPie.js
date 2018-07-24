import React from "react";         //引入react
import echarts from 'echarts';    //引入echarts

// 所有日志信息统计   饼状图
export default class ChartPie extends React.Component {
    //初始化state
    state = { chartPie: null }

    //legend的数据
    getLegend() {
        // levelLegend父组件传入的level对象
        var levelLegend = this.props.levelClass;
        // levelClass数组存储level对象
        var levelClass = [];
        for (var i in levelLegend) {
            if(levelLegend.hasOwnProperty(i)){  //过滤掉从原型继承来的属性
                levelClass.push(levelLegend[i]);
            }            
        }
        return levelClass;
    }

    //画饼状图
    drawPieChart(dataToShow, dom) {
        this.piecharts = echarts.init(dom);
        this.pieOption = {
            tooltip: {
                trigger: 'item',
                formatter: "{a}<br/>{b} : {c} ({d}%)"
            },
            legend: {
                orient: 'vertical',
                left: '10%',
                y: 50,
                data: this.getLegend(),
                textStyle: {
                    color: '#cacaca',
                    fontSize: 10
                },
                itemWidth: 6,
                itemHeight: 6
            },
            series: [
                {
                    // 鼠标悬浮显示字样
                    name: this.props.series_name,
                    type: 'pie',
                    //占据视图的比例
                    radius: '55%',
                    // 占据内容的位置
                    center: ['55%', '60%'],
                    data: dataToShow,
                    itemStyle: {
                        emphasis: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ],
            color: ['#0091D5', '#26BCF7 ', '#00B0F5', '#4A90E2', '#5E6DC9']    //设置饼状图的颜色
        };
        this.piecharts.setOption(this.pieOption, true);
    }

    dataSum(data) {
        var dataSet = {
            'DEBUG': data.DEBUG,
            'INFO': data.INFO,
            'WARNING': data.WARNING,
            'ERROR': data.ERROR,
            'CRITICAL': data.CRITICAL
        };
        var levelLegend = this.props.levelClass;
        var dataToShow = [];
        for (var i in dataSet) {
            if(dataSet.hasOwnProperty(i)){  //过滤掉从原型继承来的属性
                dataToShow.push({ value: dataSet[i], name: levelLegend[i] });
            }            
        }
        return dataToShow;
    }

    //组件渲染完成后
    componentDidMount() {
        // 获取到真实dom
        var dom = this.refs.charts;
        this.drawPieChart(this.dataSum(this.props.data), dom);
    }

    // 组件是否需要更新
    shouldComponentUpdate(nextProps) {
        return (this.props.isGraph && nextProps.data !== this.props.data);
    }

    // 组件每次更新时
    componentDidUpdate() {
        this.pieOption.series[0].data = this.dataSum(this.props.data);
        var legend = this.getLegend();
        this.pieOption.legend.data = legend;
        this.pieOption.series[0].name = this.props.series_name;
        this.piecharts.setOption(this.pieOption, true);
    }

    //页面渲染
    render() {
        return <div ref="charts" id="charts" style = {{ width: "100%", height: "300px" }}></div>
    }
}