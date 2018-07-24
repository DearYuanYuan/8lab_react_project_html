import React from "react"
import echarts from "echarts"

/**
 * 三个柱状图的共用组件
 */
export default class RightLine extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };

    }
    componentWillReceiveProps(nextProps) {
        //初始化折线图最后点
        var rangeLine = 0;
        
        if (JSON.stringify(nextProps.AttackNumLine) != JSON.stringify(this.props.AttackNumLine)) {
            rangeLine = nextProps.AttackNumLine
        }else{
            rangeLine = this.props.AttackNumLine
        }

        // 用传入的值，生成一个此值倍数的数组，随机排序，这样，画出来的6个折线图趋势不一样
        function randomsort(a, b) {
            return Math.random()>.5 ? -1 : 1;
        }
        var arr = [rangeLine*0.5, rangeLine*0.8, rangeLine*0.9, rangeLine*0.7, rangeLine*0.85, rangeLine*0.8];
        arr.sort(randomsort);
        // 数组最后一个值是真实传递过来的值
        arr.push(rangeLine);

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
            visualMap: {
                show: false,
                pieces: [ {lte: 6,
                    color: '#F28321'
                },{
                    gt: 17,
                    color: '#F28321'
                }]
            },
            series: [{
                data: arr,
                type: 'line',
                hoverAnimation:true
            }]
        };
        let myChart = echarts.init(this.ID) //初始化echarts
        //设置options
        myChart.setOption(this.optionLine)
    }

    initPie() {
        let myChart = echarts.init(this.ID) //初始化echarts

        //设置options
        myChart.setOption(this.optionLine)
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
        const { width="100%", height="60px" } = this.props;
        return <div ref={ID => this.ID = ID}  style={{width, height}}></div>
    }
}




