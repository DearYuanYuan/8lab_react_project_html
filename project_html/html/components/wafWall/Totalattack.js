import React from "react"
import echarts from "echarts"   
// echarts 每日拦截威胁总数
export default class Totalattack extends React.Component{
    constructor(props){
        super(props)
        this.state = {

        }
    }
    componentWillReceiveProps(nextProps){
        // if(JSON.stringify(nextProps.attackNumDays)!=JSON.stringify(this.props.attackNumDays)){
        //
        //     // console.log(nextProps.attackNumDays)
        //
        // }
        var maxTotal  = parseInt(Math.max.apply(null,nextProps.attackNumDays[0])*1.4);
        this.option = {
            tooltip : {
                trigger: 'axis'
            },
            calculable : true,
            grid:{
                x:45,
                y:25,
                x2:45,
                y2:40
            },
            xAxis : [
                {
                    type : 'category',
                    splitLine: {
                        show: true,
                        lineStyle:{
                            color:"#444851"
                        }
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#a1a6ad'
                        }
                    },
                    data : nextProps.attackNumDays[2]
                }
            ],
            yAxis : [
                {
                    type : 'value',
                    splitLine: {
                        show: true,
                        lineStyle:{
                            color:"#444851"
                        }
                    },
                    max: maxTotal,
                    min: 0,
                    axisLine: {
                        lineStyle: {
                            color: '#a1a6ad'
                        }
                    },
                }
            ],
            series : [
                {
                    name:'威胁次数',
                    type:'bar',
                    barCategoryGap:'60%',
                    data:nextProps.attackNumDays[0],
                    itemStyle: {

                        normal: {
                            barBorderRadius:200,
                            color: function(params) {
                                // build a color map as your need.
                                var num = params.data>nextProps.attackNumDays[1]?0:1;
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
                                return colorList[num]
                            }
                        }
                    }
                }
            ]
        };
        var myChartType = echarts.init(document.getElementById('Totalattack'));
        myChartType.setOption(this.option);
          
    }
    componentDidMount(){

    }
    render(){
        return(
            <div id="Totalattack" style={{width:"100%",height:"260px"}}></div>
        )
    }
}