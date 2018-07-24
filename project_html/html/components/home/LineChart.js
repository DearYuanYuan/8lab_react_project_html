import React from "react"
import echarts from "echarts"

/**
 * 两个折线图的共用组件
 * 传入参数：
 *   props.detail，纵坐标数据
 *   props.time，横坐标时间
 */
export default class LineChart extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
        //底部左侧折线图
        this.optionLine = {
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
            // grid控制绘制图形离边框距离
            grid:{
                left:55,
                top:30,
                bottom:30,
                right:20
            },
            legend: {
                data:[ this.props.title ],
                top:10,
                left:24,
                textStyle:{
                    color:"#fff"
                }
            },
            calculable : false,
            xAxis: [
                {
                    type: 'category',
                    boundaryGap: false,//坐标轴留白
                    splitLine: {
                        show: true,
                        lineStyle:{
                            color:"#2E323C"
                        }
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#2E323C'
                        }
                    },
                    axisLabel: {
                        textStyle: {
                            fontSize: 10,
                            color:"#A1A6AD"
                        }
                    },
                    data: ['周一','周二','周三','周四','周五','周六','周日'],
                    axisTick: {
                        show: false,
                    }
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    scale: true,
                    name: '',
                    // max:parseInt(Math.max.apply(null,maxTotal)*1.5 ),
                    min: 0,
                    splitLine: {
                        show: true,
                        lineStyle:{
                            color:"#2E323C"
                        }
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#2E323C'
                        }
                    },
                    boundaryGap: [0.2, 0.2],
                    axisTick: {
                        show: false,
                    },
                    axisLabel: {
                        textStyle: {
                            fontSize: 10,
                            color:"#A1A6AD"
                        }
                    }
                }
            ],
            series: [
                {
                    // name: this.props.title,
                    type:'line',
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
                    data:[820, 932, 901, 934, 1290, 1330, 1320]
                }
            ]
        };
        // this.initPie = this.initPie.bind(this);
    }
    componentWillReceiveProps(nextProps) {
        // 判断属性值是否有变化
        if (JSON.stringify(nextProps.detail) != JSON.stringify(this.props.detail)) {
            // 折线图重绘
            this.myChart.setOption({
                xAxis: [
                    {
                        data: nextProps.time,
                    }
                ],
                series: [{               
                    data: nextProps.detail,
                }]
            });
        }
    }
    componentWillMount() {
    }
    initPie() {
        let myChart = echarts.init(this.ID) //初始化echarts
        this.myChart = myChart;

        // 设置options
        this.myChart.setOption(this.optionLine)

        // 多图表同实例名resize
        window.addEventListener("resize",function(){
            // 用this.myChart会报错
            myChart.resize();
        });
    }
    // 组件已经成功被渲染
    componentDidMount() {
        this.initPie()
    }
    
    componentDidUpdate() {
        // this.initPie()
    }
    render() {
            // 设置图形宽高
            const { width="100%", height="180px" } = this.props;
            return <div ref={ID => this.ID = ID}  style={{width, height}}></div>
    }
}