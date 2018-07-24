import React from "react"
import echarts from "echarts"   
// echarts 防御安全雷达
export default class Radarchart extends React.Component{
    constructor(props) {
        super(props);
        this.state={
            radarValue: [0, 0, 0, 0,0],
            emptyMsg:false,
        }
     }
    componentWillReceiveProps(nextProps){
        var maxTotal= parseInt(Math.max.apply(null,nextProps.attackNumTotal)*1.5);
        // if(JSON.stringify(nextProps.attackNumTotal)!=JSON.stringify(this.props.attackNumTotal)){
        //     console.log(nextProps.attackNumTotal)
        //
        // }else{
        //     this.setState({
        //         emptyMsg:'暂无数据'
        //     })
        // }
        this.option = {
            legend:{},
            tooltip: {},
            radar: {
                // shape: 'circle',
                name: {
                    textStyle: {
                        color: '#fff'
                    }
                },
                indicator: [
                    { name: 'DDos攻击防护',max:maxTotal},
                    { name: 'Web攻击防护',max:maxTotal},
                    { name: '应用程序鉴定和检测',max:maxTotal},
                    { name: '敏感数据追踪',max:maxTotal},
                    { name: 'http防御',max:maxTotal}
                ],
                splitArea: {
                    show: false
                },
                splitLine: {
                    lineStyle: {
                        color:"#444851"
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: '#444851'
                    }
                }
            },

            series: [{
                name: '防御安全雷达',
                type: 'radar',
                // areaStyle: {normal: {}},

                lineStyle:{
                    normal:{
                        color:"rgba(0,0,0,0)"
                    }
                },
                areaStyle: {
                    normal: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [{
                                offset: 0, color: 'rgba(0,122,225,0.9)'
                            }, {
                                offset: 1, color: 'rgba(159,134,255,0.9)'
                            }],
                            globalCoord: false // 缺省为 false
                        }
                    }
                },
                data : [
                    {
                        value :nextProps.attackNumTotal,
                        label: {
                            normal: {
                                show: true,
                                formatter:function(params) {
                                    return params.value;
                                },
                                textStyle:{
                                    color:'#999',
                                    fontSize:'10px'
                                }
                            }
                        },
                        name : '安全防御',
                        color:"#fff",
                        symbol: 'roundRect',
                        symbolSize:1
                    }
                ]
            }]
        };
        var myChartType = echarts.init(document.getElementById('radarChart'));
        myChartType.setOption(this.option);
    }
    componentDidMount(){

        
    }
    render(){
        return (
        <div>
            {
                !this.state.emptyMsg &&
                <div id="radarChart" style={{width:"100%",height:"300px"}}></div>
            }

            {
                this.state.emptyMsg &&
                <div style={{width:"100%",height:"300px",lineHeight:'300px',textAlign:'center'}}>
                    {this.state.emptyMsg}
                </div>
            }
        </div>

        )
    }
}