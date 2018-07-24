import React from "react"
import echarts from "echarts"
// echarts 攻击来源占比
export default class BottomRightPie extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            todayAverageMinute:0,//今日每分钟平均拦截
            mounthTodayAverageMinute:0,//本月每日每分钟平均拦截
            mounthAverageMinute:0,//本月每分钟平均拦截
        }

    }
    componentWillReceiveProps(nextProps) {
        var data;
        if (JSON.stringify(nextProps.todayAverageMinute) != JSON.stringify(this.props.todayAverageMinute)||

            JSON.stringify(nextProps.mounthTodayAverageMinute) != JSON.stringify(this.props.mounthTodayAverageMinute) ||

            JSON.stringify(nextProps.mounthAverageMinute) != JSON.stringify(this.props.mounthAverageMinute)
        ) {
            this.setState({
                todayAverageMinute: nextProps.todayAverageMinute,
                mounthTodayAverageMinute: nextProps.mounthTodayAverageMinute,
                mounthAverageMinute: nextProps.mounthAverageMinute
            })
            data = [nextProps.todayAverageMinute, nextProps.mounthTodayAverageMinute, nextProps.mounthAverageMinute]
        }else{
            this.setState({
                todayAverageMinute:this.props.todayAverageMinute,
                mounthTodayAverageMinute:this.props.mounthTodayAverageMinute,
                mounthAverageMinute:this.props.mounthAverageMinute
            })

            data = [this.props.todayAverageMinute,this.props.mounthTodayAverageMinute,this.props.mounthAverageMinute]
        }

        this.optionLine2 = {
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

            series: [{
                data:[data[1]/6+Math.random()*100,
                    data[1]/8+Math.random()*100,
                    data[1]/2+Math.random()*100,
                    data[1]/5+Math.random()*100,
                    data[1]/3+Math.random()*100,
                    data[1]/4+Math.random()*100,
                    data.value],
                type: 'line',
                hoverAnimation: false,
                smooth: true,
                itemStyle:{
                    normal:{
                        color:'#A1A6AD',    //折线中间点的颜色
                        lineStyle:{
                            color:'#A1A6AD'　//折线线条颜色
                        }
                    }
                }
            }]
        };

        this.optionLine3 = {
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

            series: [{
                data:[data[2]/6+Math.random()*100,
                    data[2]/8+Math.random()*100,
                    data[2]/2+Math.random()*100,
                    data[2]/5+Math.random()*100,
                    data[2]/3+Math.random()*100,
                    data[2]/4+Math.random()*100,
                    data.value],
                type: 'line',
                hoverAnimation: false,
                smooth: true,
                itemStyle:{
                    normal:{
                        color:'#A1A6AD',    //折线中间点的颜色
                        lineStyle:{
                            color:'#A1A6AD'　//折线线条颜色
                        }
                    }
                }
            }]
        };

        this.optionLine1 = {
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

            series: [{
                data:[data[0]/6+Math.random()*100,
                    data[0]/8+Math.random()*100,
                    data[0]/2+Math.random()*100,
                    data[0]/5+Math.random()*100,
                    data[0]/3+Math.random()*100,
                    data[0]/4+Math.random()*100,
                    data.value],
                type: 'line',
                hoverAnimation: false,
                smooth: true,
                itemStyle:{
                    normal:{
                        color:'#A1A6AD',    //折线中间点的颜色
                        lineStyle:{
                            color:'#A1A6AD'　//折线线条颜色
                        }
                    }
                }
            }]
        };
        var chartLine1 = echarts.init(document.getElementById('hijackAttack-Line1'));
        chartLine1.setOption(this.optionLine1, true);
        var chartLine2 = echarts.init(document.getElementById('hijackAttack-Line2'));
        chartLine2.setOption(this.optionLine2, true);
        var chartLine3 = echarts.init(document.getElementById('hijackAttack-Line3'));
        chartLine3.setOption(this.optionLine3, true);


    }

    /**
     * 返回数值的小数点前有多少位数
     * @param {*} num
     */
    numsBeforeDecimal(num){
        let count = 1
        let temp = num/10
        while(temp>1){
            temp = temp/10
            count++
        }
        return count
    }

    /**
     * 判断是否为整数
     * @param {*} num
     */
    isInterger(num){
        return num%1===0
    }

    /**
     * 为了展示的时候数字不会过长超出方框处理数字，
     * 小数结果：“000.0”，“00.00”，“0.000”，“000K”，“00.0K”，“0.00K”...
     * 整数结果：“0”，“00”，“000”，“000K”，“00K”...
     * @param {*} num
     */
    formatNumber(num){
        let temp
        if(num<100){
            temp = num
            if(this.isInterger(temp)){   //如果是整数
                return temp
            }else{
                return temp.toFixed(3-this.numsBeforeDecimal(temp))
            }
        }else if(num<1000){   //小数点前有3位
            temp = num
            if(this.isInterger(temp)){   //如果是整数
                return temp
            }else{
                return temp.toFixed(4-this.numsBeforeDecimal(temp))
            }
        }else if(num>=1000 && num<1000000){ //小数点前有4-6位
            temp=num/1000
            if(this.isInterger(temp)){   //如果是整数
                return temp
            }else{
                return temp.toFixed(3-this.numsBeforeDecimal(temp)) + "K"
            }
        }else if(num>1000000 && num<1000000000){    //小数点前有6-9位
            temp=num/1000000
            if(this.isInterger(temp)){   //如果是整数
                return temp
            }else{
                return temp.toFixed(3-this.numsBeforeDecimal(temp)) + "M"
            }
        }else { //小数点前多于9位
            temp=num/1000000000
            if(this.isInterger(temp)){   //如果是整数
                return temp
            }else{
                return temp.toFixed(3-this.numsBeforeDecimal(temp)) + "B"
            }
        }
    }
    //组件已经成功被渲染
    componentDidMount() {

    }
    render() {
        return (
            <div className='BottomRightPie'>
                <div className='hijackAttack'>
                    <div className='hijackAttack-des'>
                        <div className='hijackAttack-title'>今日拦截数</div>
                        <div className='hijackAttack-number'>{this.formatNumber(this.state.todayAverageMinute)}</div>
                        <div className='hijackAttack-per'>个/每分钟</div>
                    </div>

                    <div className='hijackAttack-line'>
                        <div id="hijackAttack-Line1" style={{ width: "100%", height: "100%" }}></div>
                    </div>
                </div>

                <div className='hijackAttack'>
                    <div className='hijackAttack-des'>
                        <div className='hijackAttack-title'>本月每日拦截</div>
                        <div className='hijackAttack-number'>{this.formatNumber(this.state.mounthTodayAverageMinute)}</div>
                        <div className='hijackAttack-per'>个/每分钟</div>
                    </div>

                    <div className='hijackAttack-line'>
                        <div id="hijackAttack-Line2" style={{ width: "100%", height: "100%" }}></div>
                    </div>
                </div>


                <div className='hijackAttack'>
                    <div className='hijackAttack-des'>
                        <div className='hijackAttack-title'>本月</div>
                        <div className='hijackAttack-number'>{this.formatNumber(this.state.mounthAverageMinute)}</div>
                        <div className='hijackAttack-per'>个/每分钟</div>
                    </div>

                    <div className='hijackAttack-line'>
                        <div id="hijackAttack-Line3" style={{ width: "100%", height: "100%" }}></div>
                    </div>
                </div>
            </div>

        )
    }
}




