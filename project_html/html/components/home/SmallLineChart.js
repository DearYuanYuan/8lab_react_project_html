import React from "react"
import echarts from "echarts"

/**
 * 六个小折线图的共用组件
 * 传入参数：
 *   props.detail，纵坐标数据
 */
export default class SmallLineChart extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
        // 折线图配置
        this.optionSmallLine = {
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
                    color: '#007AE1'
                },{
                    gt: 17,
                    color: '#007AE1'
                }]
            },
            series: [{
                data: [820, 932, 901, 934, 1290, 1330, 1320],
                type: 'line',
                hoverAnimation:false
            }]
        };

        // this.initPie = this.initPie.bind(this);
    }
    componentWillReceiveProps(nextProps) {
        // 判断属性值是否有变化
        if (JSON.stringify(nextProps.detail) != JSON.stringify(this.props.detail)) {
            // 用传入的值，生成一个此值倍数的数组，随机排序，这样，画出来的6个折线图趋势不一样
            function randomsort(a, b) {
                return Math.random()>.5 ? -1 : 1;
            }
            var arr = [nextProps.detail*0.5, nextProps.detail*0.8, nextProps.detail*0.9, nextProps.detail*0.7, nextProps.detail*0.85, nextProps.detail*0.8];
            arr.sort(randomsort);
            // 数组最后一个值是真实传递过来的值
            arr.push(nextProps.detail);
            // 折线图重绘
            this.myChart.setOption({
                series: [{               
                    data: arr
                }]
            });
        }
    }
    componentWillMount() {
    }
    initPie() {
        let myChart = echarts.init(this.ID) // 初始化echarts
        this.myChart = myChart;
        // 设置options
        this.myChart.setOption(this.optionSmallLine)

        // 多图表同实例名resize
        window.addEventListener("resize",function(){
            myChart.resize();
        });
    }

    // 组件已经成功被渲染
    componentDidMount() {
        this.initPie()
    }
    
    componentDidUpdate() {
        // this.initPie()
    }

    render() {
            // 设置图形宽高
            const { width="100%", height="60px" } = this.props;
            // 获取ID的方式比较特别
            return <div ref={ID => this.ID = ID} style={{width, height}}></div>
    }
}




