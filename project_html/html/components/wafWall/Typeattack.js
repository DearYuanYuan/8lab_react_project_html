import React from "react"
import echarts from "echarts"   
// echarts 攻击类型(动态)
export default class Typeattack extends React.Component{
    constructor(props) {
        super(props);
        this.state={

        }
     }
    componentWillReceiveProps(nextProps){
        // if(JSON.stringify(nextProps.attackNumWeek)!=JSON.stringify(this.props.attackNumWeek)){
        //     console.log(JSON.stringify(nextProps.attackNumWeek))
        //
        // }
        var maxTotal  = [];
        nextProps.attackNumWeek.map(function(arr,index){
            maxTotal.push(parseInt(Math.max.apply(null,arr)))
        })
        // console.log( parseInt(Math.max.apply(null,maxTotal)*1.5 ) )
        this.option = {
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
            legend: {
                data:['http攻击', 'Dos攻击','web攻击','敏感数据','应用程序鉴定'],
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
                            color:"#444851"
                        }
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#a1a6ad'
                        }
                    },
                    data: (function (){
                        var now = new Date();
                        var res = [];
                        var len = 7;
                        while (len--) {
                            res.unshift(now.getMonth()+1+'-'+now.getDate());
                            now = new Date(now - 1000*60*60*24);
                        }
                        return res;
                    })()
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    scale: true,
                    name: '',
                    max:parseInt(Math.max.apply(null,maxTotal)*1.5 ),
                    min: 0,
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
                    boundaryGap: [0.2, 0.2]
                }
            ],
            series: [
                {
                    name:'http攻击',
                    type:'line',
                    symbol: 'none',
                    smooth: true,
                    itemStyle: {
                        normal: {
                            color: "#007AE1 "
                        }
                    },
                    lineStyle: {
                        normal: {
                            color: "#007AE1 "
                        }
                    },
                    areaStyle: {
                        normal: {
                            color: "#007AE1 ",
                            opacity: 0.1
                        }
                    },
                    data:nextProps.attackNumWeek[0]
                },
                {
                    name:'Dos攻击',
                    type:'line',
                    symbol: 'none',
                    smooth: true,
                    itemStyle: {
                        normal: {
                            color: "#9F86FF"
                        }
                    },
                    lineStyle: {
                        normal: {
                            color: "#9F86FF"
                        }
                    },
                    areaStyle: {
                        normal: {
                            color: "#9F86FF",
                            opacity: 0.1
                        }
                    },
                    data:nextProps.attackNumWeek[1]
                },
                {
                    name:'web攻击',
                    type:'line',
                    symbol: 'none',
                    smooth: true,
                    itemStyle: {
                        normal: {
                            color: "#4ACDEC"
                        }
                    },
                    lineStyle: {
                        normal: {
                            color: "#4ACDEC"
                        }
                    },
                    areaStyle: {
                        normal: {
                            color: "#4ACDEC",
                            opacity: 0.1
                        }
                    },
                    data:nextProps.attackNumWeek[2]
                },
                {
                    name:'敏感数据',
                    type:'line',
                    symbol: 'none',
                    smooth: true,
                    itemStyle: {
                        normal: {
                            color: "#A26EEC"
                        }
                    },
                    lineStyle: {
                        normal: {
                            color: '#A26EEC'
                        }
                    },
                    areaStyle: {
                        normal: {
                            color: '#A26EEC',
                            opacity: 0.1
                        }
                    },
                    data:nextProps.attackNumWeek[3]
                },
                {
                    name:'应用程序鉴定',
                    type:'line',
                    symbol: 'none',
                    smooth: true,
                    itemStyle: {
                        normal: {
                            color: '#1CA8DD'
                        }
                    },
                    lineStyle: {
                        normal: {
                            color: '#1CA8DD'
                        }
                    },
                    areaStyle: {
                        normal: {
                            color: '#1CA8DD',
                            opacity: 0.1
                        }
                    },
                    data:nextProps.attackNumWeek[4]
                }
            ]
        };
        var myChartType = echarts.init(document.getElementById('typeAttack'));
        myChartType.setOption(this.option);
    }
//    componentWillMount(){ 
       
//    }
    componentDidMount(){

    }
    render(){
        return (
            <div id="typeAttack" style={{width:"100%",height:"300px"}}></div>
        )
    }
}