import React from "react"
import echarts from "echarts"   
// echarts 威胁占比
export default class Attackpart extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            emptyMsg:false,//无数据
        }
    }
    componentWillReceiveProps(nextProps){
        // if(JSON.stringify(nextProps.attackNumTotal)!=JSON.stringify(this.props.attackNumTotal)){
        //     console.log(nextProps.attackNumTotal)
        //
        //
        // }else{
        //     this.setState({
        //         emptyMsg:'暂无数据'
        //     })
        // }
        this.option = {
            // 默认色板
            color: ['#9F86FF','#A26EEC','#0081B3','#1CA8DD','#007AE1'],
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
                    radius: ['35%', '70%'],
                    // avoidLabelOverlap: false,
                    label: {
                        normal: {
                            show: true,
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
                    data:[
                        { name: 'DDos攻击防护',value:nextProps.attackNumTotal[0]},
                        { name: 'Web攻击防护',value:nextProps.attackNumTotal[1]},
                        { name: '应用程序鉴定和检测',value:nextProps.attackNumTotal[2]},
                        { name: '敏感数据追踪',value:nextProps.attackNumTotal[3]},
                        { name: 'http防御',value:nextProps.attackNumTotal[4]}
                    ]
                }
            ]
        };
        var chart = echarts.init(document.getElementById('attackchart'));
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
            <div>
                {
                    !this.state.emptyMsg &&
                    <div id="attackchart" style={{width:"100%",height:"300px"}}></div>
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