import React from "react"
import echarts from "echarts"
// echarts 攻击来源占比
export default class echartsPie extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }
    componentWillReceiveProps(nextProps) {
        var data;
        if (JSON.stringify(nextProps.BottomPieError) != JSON.stringify(this.props.BottomPieError)) {
            this.setState({
                BottomPieHttp:nextProps.BottomPieError
            })
            data={
                "name":'',
                "value":nextProps.BottomPieError
            };
        }else{
            this.setState({
                BottomPieError:this.props.BottomPieError
            })
            data={
                "name":'',
                "value":this.props.BottomPieError
            };
        }
        var colorList =['#F28321', '#6D7276'];

        var create=function(data){
            var result = [];
            result.push({
                name:'',
                center: [
                    '50%',
                    '50%'
                ],
                radius: [
                    '30',
                    '31'
                ],
                type: 'pie',
                hoverAnimation: false,
                labelLine: {
                    normal: {
                        show: false
                    }
                },
                markPoint: {
                    data: [{
                        symbol: 'triangle',
                        symbolSize: 30,
                        symbolRotate: 0,
                        itemStyle: {
                            normal: {
                                color: 'transparent'
                            }
                        },
                        name: '',
                        value: '',
                        x: 0,
                        y: 0,
                        label: {
                            normal: {
                                show: true,
                                position: 'center',
                                formatter: function(params) {
                                    return params.value;
                                },
                                textStyle: {
                                    color: colorList[1]
                                }
                            }
                        },
                    }
                    ]
                },
                data: [{
                    value: data.value,
                    name: '',
                    itemStyle: {
                        normal: {
                            color:colorList[0],
                            borderColor: colorList[0],
                            borderWidth: 5
                        },
                        emphasis: {
                            color: colorList[0],
                            borderColor: colorList[0],
                            borderWidth: 5
                        }
                    },
                    label: {
                        normal: {
                            formatter: '{d} %',
                            position: 'center',
                            show: true,
                            textStyle: {
                                fontSize: '16',
                                fontWeight: 'bold',
                                color:colorList[0],
                            }
                        }
                    }
                }, {
                    value: (100-data.value),
                    name: '',
                    tooltip: {
                        show: false
                    },
                    itemStyle: {
                        normal: {
                            color: colorList[1],
                            borderColor: colorList[1],
                            borderWidth: 1
                        },
                        emphasis: {
                            color: colorList[1],
                            borderColor: colorList[1],
                            borderWidth: 1
                        }
                    },
                    hoverAnimation: false
                }]
            });
            return result;
        };

        this.option = {
            series:create(data)
        };

        var chart = echarts.init(document.getElementById('Bottom-pie5'));
        chart.setOption(this.option, true);


        this.optionLine = {
            xAxis: {
                type: 'category',
                data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                axisLine: {
                    show: false,

                },
                axisLabel: {
                    show: false,
                },
                axisTick: {
                    show: false,
                }
            },
            yAxis: {
                type: 'value',
                axisLine: {
                    show: false,
                },
                axisLabel: {
                    show: false,
                },
                axisTick: {
                    show: false,
                },
                splitLine: {
                    show: false      //是否显示分隔线。默认数值轴显示，类目轴不显示。
                }
            },

            series: [{
                data: [data.value/6+Math.random()*100,
                    data.value/8+Math.random()*100,
                    data.value/2+Math.random()*100,
                    data.value/5+Math.random()*100,
                    data.value/3+Math.random()*100,
                    data.value/4+Math.random()*100,
                    data.value],
                type: 'line',
                hoverAnimation:false,
                smooth: true,
                itemStyle:{
                    normal:{
                        color:'#A1A6AD',    //折线中间点的颜色
                        lineStyle:{
                            color:'#A1A6AD'　//折线线条颜色
                        }
                    }
                }
            }]
        };

        var chartLine = echarts.init(document.getElementById('Bottom-Line5'));
        chartLine.setOption(this.optionLine, true);

    }


    //组件已经成功被渲染
    componentDidMount() {

    }
    render() {
        return (
            <div  className='Bottom-PieStyle'>
                <div id="Bottom-pie5" style={{ width: "80px", height: "80px", position: 'absolute', right: '0', top: '0' }}></div>
                <div style={{ width: "65px", height: "42px", position: 'absolute', top: '46px', background: 'linear-gradient(-1deg,  #2A2D36 30%, #2E323C 70%)' }}>
                    <div style={{ fontSize: '12px', color: '#A1A6AD', textAlign: 'right' }}>应用程序鉴定和检测</div>
                    {/*<div style={{ fontSize: '16px', color: '#F28321', textAlign: 'right' }}>34%</div>*/}
                </div>
                <div id="Bottom-Line5" style={{ width: "100%", height: "100%", position: 'absolute', left: '0', bottom: '-38px', }}></div>
                <div style={{ color: '#fff', position: 'absolute', bottom: '4px', left: '5px', width: '92%', height: '10px', background: 'url(static/img/pattern_chart.png) repeat-x' }}></div>
            </div>
        )
    }
}




