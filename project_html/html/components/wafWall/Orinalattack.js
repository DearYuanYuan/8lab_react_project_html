import React from "react"
import echarts from "echarts"   
// echarts 攻击来源占比
export default class Orinalattack extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }
    componentWillReceiveProps(nextProps){
        //  if(JSON.stringify(nextProps.attackNumCity)!=JSON.stringify(this.props.attackNumCity)){
        //      console.log(JSON.stringify(nextProps.attackNumCity))
        //
        // }
        var dataCity = [];
        nextProps.attackNumCity && nextProps.attackNumCity.name.map(function(arr,index){
            dataCity[index] = {
                value:nextProps.attackNumCity.count[index],
                name:arr
            }
        })
        //  console.log(JSON.stringify(dataCity))
        this.option = {
            // 默认色板
            color: [
                '#9F86FF','#A26EEC','#0081B3','#1CA8DD','#007AE1',
                '#9F86FF','#A26EEC','#0081B3','#1CA8DD','#007AE1'
            ],
            // backgroundColor: 'rgba(225,225,225,0.05)',
            // title : {
            //     text: "常规操作",
            //     x:'left',
            //     textStyle: {
            //         color: '#A3A3A3'          // 主标题文字颜色
            //     }
            // },
            tooltip : {
                trigger: 'item',
                backgroundColor: 'rgba(0,0,0,0.5)',
                formatter: "{a} <br/>{b} : {c} ({d}%)"
            },
            series: [
                {
                    name:'攻击来源',
                    type:'pie',
                    center:['50%','55%'],
                    radius: ['35%', '70%'],
                    // avoidLabelOverlap: true,
                    label: {
                        normal: {
                            show: true,
                            formatter: '{b}\n{d}%',
                            textStyle:{
                                fontSize: '12',
                                color:'#A3A3A3'

                            }
                        },
                    },
                    labelLine: {
                        normal: {
                            show: true
                        }
                    },
                    data:dataCity
                }
            ]
        };
        var chart = echarts.init(document.getElementById('first-chart'));
        chart.setOption(this.option, true);
    }

    // 组件将要被渲染
    // componentWillMount(){
        
    // }
    //组件已经成功被渲染
    componentDidMount() {

    }
    render() {
        return (
            <div id="first-chart" style={{width:"100%",height:"300px"}}></div>            
        )
    }
}