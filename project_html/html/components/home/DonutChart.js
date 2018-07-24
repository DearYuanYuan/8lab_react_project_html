import React from "react"
import echarts from "echarts"

/**
 * 六个环形图的共用组件
 * 传入参数：
 *   props.detail，显示的数值
 *   props.comparison，一个百分比，用于显示空心圆的占比
 */
export default class DonutChart extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
        
        this.optionDonut = {
            // 默认色板
            color: [
             '#007AE1','#444851'
            ],
            series: [
                {
                    name:'访问来源',
                    type:'pie',
                    radius: ['45%', '70%'],
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
                        {value:40, },
                        {value:50, }
                    ]
                }
            ]
        };

        // this.initPie = this.initPie.bind(this);
    }
    componentWillReceiveProps(nextProps) {
        // 判断属性值是否有变化
        if (JSON.stringify(nextProps.detail) != JSON.stringify(this.props.detail)) {
            // 重绘空心圆
            this.myChart.setOption({
                series: [{               
                    data:[
                        {value: nextProps.detail},
                        {value: nextProps.comparison}
                    ]
                }]
            });
        }
    }
    componentWillMount() {
    }
    initPie() {
        let myChart = echarts.init(this.ID) //初始化echarts
        this.myChart = myChart;
        //设置options
        this.myChart.setOption(this.optionDonut)

        window.addEventListener("resize",function(){
            myChart.resize();
        });
    }
      
    componentDidMount() {
        this.initPie()
    }
    
    componentDidUpdate() {
        // this.initPie()
    }
   
    render() {
        const { width="82px", height="82px" } = this.props;
        return <div ref={ID => this.ID = ID}  className="right-pie-chart" style={{width, height}}></div>
    }
}




