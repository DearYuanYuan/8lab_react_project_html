import React from "react"
import echarts from "echarts"
// echarts 
export default class MapAttackRightPie extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }
    componentWillReceiveProps(nextProps) {
        // if (JSON.stringify(nextProps.echartsPie) != JSON.stringify(this.props.echartsPie)) {
        //     this.option = {
        //         series: [
        //             {
        //                 name: '半径模式',
        //                 type: 'pie',
        //                 radius: [20, 30],
        //                 center: ['25%', '50%'],
        //                 roseType: 'radius',
        //                 hoverAnimation:false,
        //                 label: {
        //                     normal: {
        //                         show: false
        //                     },
        //                     emphasis: {
        //                         show: true
        //                     }
        //                 },
        //                 lableLine: {
        //                     normal: {
        //                         show: false
        //                     },
        //                     emphasis: {
        //                         show: true
        //                     }
        //                 },
        //                 data: nextProps.echartsPie
        //             },
        //         ]
        //     };
        //     var chart = echarts.init(document.getElementById('echartsPie'));
        //     chart.setOption(this.option, true);
        // }
    }


    //组件已经成功被渲染
    componentDidMount() {
        // 右边饼图配置
        this.optionRightPie = {
            // 默认色板
            color: [
             '#F28321','#444851'
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
                name:'访问来源',
                type:'pie',
                radius: ['35%', '70%'],
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
                    {value:40, name:'删除核心进程'},
                    {value:50, name:'远程关机'}
                ]
            }
        ]
        };

        // 绘制右边内容的饼图
        // var pie_chart1 = echarts.init(document.getElementById('right-pie-chart'));
        var pie_chart1 = echarts.init(document.getElementsByClassName('right-pie-chart')[0]);
        pie_chart1.setOption(this.optionRightPie, true);
    }
    render() {
        return (
            <div id="right-pie-chart" className="right-pie-chart"></div>
        )
    }
}




