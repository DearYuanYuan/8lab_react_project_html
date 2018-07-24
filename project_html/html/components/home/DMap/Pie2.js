import React from "react"
import echarts from "echarts"

export default class Pie2 extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }
    componentWillReceiveProps(nextProps) {
        if (JSON.stringify(nextProps.disk_write) != JSON.stringify(this.props.disk_write)) {
            this.option = {
                title:{
                    show:true,
                    text:"磁盘写入",
                    textStyle:{
                        fontSize: 10,
                        color: "#A1A6AD",
                    },
                    left:"center",
                    right:"center",
                    subtext:"KB/s",
                    subtextStyle:{
                        fontSize: 10,
                        color: "#F28321",
                    },
                    itemGap:73
                    
                },
                tooltip: {
                    formatter: "{a} <br/>{b} : {c}KB/s"
                },
                series: [{
                    name: 'fgdf',
                    type: 'gauge',
                    center: ['50%', '52'], // 默认全局居中
                    radius: '30',
                    startAngle:210, //制作缺口环形
                    endAngle:-30, //制作缺口环形
                    axisLine: {
                        show: true,
                        lineStyle: { // 属性lineStyle控制线条样式
                            color: [
                                [`${nextProps.disk_write/1000}`, "#F28321"],
                                [1, "#444851"]
                            ],
                            width: 8
                        }
                    },
                    splitLine: {
                        show: false
                    },
                    axisTick: {
                        show: false
                    },
                    axisLabel: {
                        show: false
                    },
                    pointer: {
                        show: false,
                        length: '0',
                        width: '0'
                    },
                    detail: {
                        formatter: '{value}',
                        offsetCenter: [0, '80%'],
                        textStyle: {
                            fontSize: 10,
                            color: "#FFFFFF",
                        }
                    },
                    data: [{
                        name:"",
                        value: nextProps.disk_write,
                        label: {
                            textStyle: {
                                fontSize: 12
                            }
                        }
                    }]
                }]
            };


            var chart = echarts.init(document.getElementById('DMap-pie2'));
            chart.setOption(this.option, true);
        }
    }



    //组件已经成功被渲染
    componentDidMount() {
    }
    render() {
        return (
                <div id="DMap-pie2"  style={{  width: "74px", height: "105px" }}></div>
        )
    }
}




