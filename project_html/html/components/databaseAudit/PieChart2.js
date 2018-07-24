/**
 * 数据库审计标签页的饼状图
 * created by ZHONG Mengting
 * on 2017/04/21
 */
import React from "react";
import echarts from "echarts";

/*据库审计标签页的饼状图*/
export default class PieChart2 extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            option: null
        }
    }


    //组件已经成功被渲染
    componentDidMount() {
        var self = this;
        setTimeout(function() {
            self.setState({
                option:{
                    // 默认色板
                     color: [
                     '#9f86ff','#a16eeb','#0081b2',
                     '#1ca8dd','#007ae1'
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
                            {value:40, name:'Tom'},
                            {value:50, name:'Tommas'},
                            {value:80, name:'Jerry'},
                            {value:120, name:'Mary'},
                            {value:160, name:'John'}
                        ]
                    }
                ]
                }
            })
            var chart = echarts.init(document.getElementById('second-piechart'));
            chart.setOption(self.state.option, true);
        }, 1000);

    }

    render() {
        return (
            <section>
                <div><p>常用用户</p><hr/></div>
                <div id="second-piechart"></div> 
                <div className="description-bottom">
                {/*<p>Donec facilisis tortor ut augue lacinia,at viverra eset sempelerisque nec pharetra</p>                   */}
                </div>           
            </section>
        )
    }
}