import React from "react"
import echarts from "echarts"

/**
 * 五个仪表盘的共用组件
 */
export default class DashboardChart extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
        
        this.optionDashboard = {
            title:{
                show:true,
                text:this.props.title,
                textStyle:{
                    fontSize: 10,
                    color: "#A1A6AD",
                },
                left:"center",
                right:"center",
                subtext: this.props.unit,
                subtextStyle:{
                    fontSize: 10,
                    color: "#007AE1",
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
                            [0.31, "#007AE1"],
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
                    value: 80,
                    label: {
                        textStyle: {
                            fontSize: 12
                        }
                    }
                }]
            }]
        };

        // this.initPie = this.initPie.bind(this);
    }
    componentWillReceiveProps(nextProps) {
        // 判断属性值是否有变化
        if (JSON.stringify(nextProps.detail) != JSON.stringify(this.props.detail)) {
            // 重绘dashboard
            this.myChart.setOption({
                series: [{               
                    axisLine: {
                        lineStyle: { // 属性lineStyle控制线条样式
                            color: [ 
                                [nextProps.percentage, "#007AE1"],
                                [1, "#444851"]
                            ],
                        }
                    },
                    data: [{
                        value: nextProps.detail,
                    }]
                }]
            });
        }
    }
    componentWillMount() {
    }
    initPie() {
        let myChart = echarts.init(this.ID); //初始化echarts
        this.myChart = myChart;
        //设置options
        this.myChart.setOption(this.optionDashboard)

        window.addEventListener("resize",function(){
            myChart.resize(); //用this.myChart会报错
        });
    }
      
    componentDidMount() {
        this.initPie()
    }
    
    componentDidUpdate() {
        // this.initPie()
    }
    render() {
        const { width="20%", height="114px" } = this.props;
        return <div ref={ID => this.ID = ID} className="doughnut-chart" style={{width, height}}></div>
    }
}




