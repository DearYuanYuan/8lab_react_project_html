
import React from "react"                           //引入react
import echarts from "echarts"                       //引入echarts
require("../../utils/world");　　　　　　　　　　　　　 //引入echarts提供的世界地图数据

// 向外暴露WorldMap模块
export default class WorldMap extends React.Component {
    constructor(props) {
        super(props);
    }

    drawWorldMap(data, dom) {
        let liveChart = echarts.init(dom);
        this.liveChart = liveChart;
        // 设置数据
        this.option = {
            // 鼠标悬停tip
            tooltip: {
                // trigger: 'item',
                formatter: function (params) {
                    var value = params.value ? params.value+'万次攻击' : '暂无数据';
                    return params.name + ' : ' + value;
                }
            },
            // 左下角的拖拽    visualMapContinuous中，可以通过 visualMap.calculable 来显示或隐藏手柄（手柄能拖拽改变值域）。
            visualMap: [
                {
                    //设定区间
                    pieces: [
                        {gt: 1001,lte:9999},            // (1500, Infinity]
                        {gt: 201, lte: 1000},           // (900, 1500]
                        {gt: 101, lte: 200},            // (310, 1000]
                        {gt: 51, lte: 100},             // (200, 300]
                        {gt: 6, lte: 50},               // (10, 200]
                        {lt: 5}                         // (-Infinity, 5)
                    ],
                    color: ['#AD42CB', '#0C6BAF', '#79ECEB'],    //颜色过度
                    textStyle: {
                        color: '#fff'                   //文本颜色
                    },
                    left: '10%',
                    bottom: '10%',
                    itemWidth: 10,                      //图形的宽度，即长条的宽度。defult 20
                    //默认的图形。可选值为： 'circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow'。
                },

            ],

      
            series: [
                {
                    name: '福州可信云',
                    type: 'map',
                    mapType: 'world',
                    selectedMode : 'single',
                    // roam: true,     s                //是否可放大缩小
                    itemStyle: {
                        //鼠标悬停在地图某个位置的时候的状态
                        emphasis: {
                            label: { show: false },
                            color: '#fff'
                            // areaColor: '#000',
                        },
                        //正常状态下的颜色
                        normal: {
                            areaColor: '#323c48',
                            borderColor: '#111',
                            color: '#fff'
                        },
                    },
                    data: this.props.data
                },
            ]
        };

        this.liveChart.setOption(this.option, true);

        window.addEventListener("resize",function(){
            liveChart.resize();
        });
    }
    // 组件渲染完成后
    componentDidMount() {
        // 初始化Echart
        var chart = document.getElementById('worldMap')
        // 设置数据
        this.drawWorldMap(this.props.data, chart)

        
    }
    // 组件是否需要更新前
    componentWillUpdate() {
        this.option.series[0].data = this.props.data;
        this.liveChart.setOption(this.option, true);
    }
    //渲染函数
    render() {
        return (
            <section id="worldMap"></section>
        )
    }
}