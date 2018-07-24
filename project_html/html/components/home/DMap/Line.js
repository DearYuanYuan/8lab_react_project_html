import React from "react"
import echarts from "echarts"
import { Row } from 'react-bootstrap';         //bootstrap组件
export default class Line extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }
    componentWillReceiveProps(nextProps) {
        if (JSON.stringify(nextProps.watcherlab_daily) != JSON.stringify(this.props.watcherlab_daily)) {
            var category = [];
            var data=[];
            for (var key in nextProps.watcherlab_daily) {
                category.push(key.slice(5,11))
                data.push(nextProps.watcherlab_daily[key])
            }
            // category=category.slice(1,8)
            // data=data.slice(1,8)
          
            this.optionLine = {
                tooltip: {
                    trigger: 'axis'
                },
                calculable: true,
                grid: {
                    x: 45,
                    y: 25,
                    x2: 45,
                    y2: 40
                },
                xAxis: [
                    {
                        type: 'category',
                        splitLine: {
                            show: true,
                            lineStyle: {
                                color: "#444851"
                            }
                        },
                        axisLine: {
                            lineStyle: {
                                color: '#a1a6ad'
                            }
                        },
                        data: category
                    }
                ],
                yAxis: [
                    {
                        type: 'value',
                        splitLine: {
                            show: true,
                            lineStyle: {
                                color: "#444851"
                            }
                        },
                        min: 0,
                        axisLine: {
                            lineStyle: {
                                color: '#a1a6ad'
                            }
                        },
                    }
                ],
                series: [
                    {
                        name: '威胁次数',
                        type: 'bar',
                        barCategoryGap: '80%',
                        data: data,
                        itemStyle: {
                            normal: {
                                color: '#F28321'
                            }
                        }
                    },
    
                ]
            };
            var chartLine = echarts.init(document.getElementById('DMap-Line'));
            chartLine.setOption(this.optionLine, true);
        }
    }


    //组件已经成功被渲染
    componentDidMount() {


       
    }
    render() {
        return (
            <Row id="DMap-Line" style={{ width: "360px", height: "178px" }}></Row>
        )
    }
}




