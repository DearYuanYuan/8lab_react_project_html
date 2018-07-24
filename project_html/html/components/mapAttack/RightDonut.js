import React from "react"
import echarts from "echarts"

/**
 * 三个柱状图的共用组件
 */
export default class RightDonut extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            AttackNumPie:0,//初始化拦截数
        };

    }
    componentWillReceiveProps(nextProps) {
        if (JSON.stringify(nextProps.AttackNumPie) != JSON.stringify(this.props.AttackNumPie)) {
            this.setState({
                AttackNumPie:nextProps.AttackNumPie
            })
        }else{
            this.setState({
                AttackNumPie:this.props.AttackNumPie
            })
        }
        this.optionDonut = {
            // 默认色板
            color: [
                '#F28321','#444851'
            ],
            series: [
                {
                    // name:'访问来源',
                    type:'pie',
                    radius: ['35%', '70%'],
                    hoverAnimation: false,   //是否开启 hover 在扇区上的放大动画效果。是否开启 hover 在扇区上的放大动画效果。
                    avoidLabelOverlap: false,
                    label: {
                        normal: {
                            show: true,
                            textStyle:{
                                fontSize: '12',
                                color:'#fff'

                            }
                        },
                    },
                    labelLine: {
                        normal: {
                            show: false
                        }
                    },
                    data:[
                        {value:this.state.AttackNumPie, },
                        {value:1000, }
                    ]
                }
            ]
        };

        let myChart = echarts.init(this.ID) //初始化echarts

        //设置options
        myChart.setOption(this.optionDonut)

    }
    componentDidMount(){
        var myChart = echarts.init(this.ID)
        window.addEventListener("resize",function(){
            myChart.resize({
                width:myChart.clientWidth
            });
        });
    }

    render() {
        const { width="82px", height="82px" } = this.props;
        return <div ref={ID => this.ID = ID}  className="right-pie-chart" style={{width, height}}></div>
         
    }
}




