import React from "react"
import echarts from "echarts"

/**
 * 三个柱状图的共用组件
 * 传入参数：
 *   props.detail，纵坐标数据
 *   props.time，横坐标时间
 */
export default class BarChart extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
        this.optionBar = {
            // animation: true,
            tooltip : {
                trigger: 'axis'
            },
            calculable : true,
            grid:{
                left:42,
                top:30,
                bottom:40,
                right:10
            },
            xAxis : [
                {
                    type : 'category',
                    splitLine: {
                        show: true,
                        lineStyle:{
                            color:"#2E323C"
                        }
                    },
                    axisTick: {
                        show: false
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
                    data : ['17:00:00','17:10:00','17:20:00','17:30:00','17:40:00','17:50:00',
                            '18:00:00','18:10:00','18:20:00','18:30:00','18:40:00','18:50:00']
                }
            ],
            yAxis : [
                {
                    type : 'value',
                    splitLine: {
                        show: true,
                        lineStyle:{
                            color: "#2E323C"
                        }
                    },
                    min: 0,
                    axisLine: {
                        lineStyle: {
                            color: '#2E323C'
                        }
                    },
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
            series : [
                {
                    name:'威胁次数',
                    type:'bar',
                    barCategoryGap:'60%',
                    data: [820, 932, 901, 934, 1290, 1330, 1320, 820, 932, 901, 934, 1290],
                    itemStyle: {
                        
                        normal: {
                            barBorderRadius:200,
                            color: function(params) {
                                // build a color map as your need.
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
                                var colorList = [color1,color2];
                                return colorList[1]
                            }
                        }
                    }
                }
            ]
        };
        // this.initPie = this.initPie.bind(this);
    }
    componentWillReceiveProps(nextProps) {
        // 判断属性值是否有变化
        if (JSON.stringify(nextProps.detail) != JSON.stringify(this.props.detail)) {
            // 重绘柱状图
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
        
        //设置options
        this.myChart.setOption(this.optionBar)

        window.addEventListener("resize",function(){
            myChart.resize();
        });
    }
      
    componentDidMount() {
        this.initPie()
    }
    
    componentDidUpdate() {
        // this.initPie()
    }
   
    render() {
        const { width="100%", height="200px",paddingTop="20px"} = this.props;
        return <div ref={ID => this.ID = ID}  style={{width, height, paddingTop}}></div>
    }
}




