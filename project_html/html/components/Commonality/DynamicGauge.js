/*
created by Mengting ZHONG
23/03/2018

基于D3的可复用的仪表盘组件.
圆弧从一个数值变化到一个新数值时，有渐变的特效。
---------------
自定义一个仪表盘的使用示例:
<DynamicGauge 
svgid="gaugeIO" 
title="IO读写" 
unity="KB/s" 
value={this.state.systemInfo && (parseFloat(this.state.systemInfo.disk_read) + parseFloat(this.state.systemInfo.disk_write)).toFixed(2)} 
percentage={this.state.systemInfo && (this.state.systemInfo.disk_read/1024/5 + this.state.systemInfo.disk_write/1024/5)}
svgWidth={150}
svgHeight={150}
arcMin={-Math.PI/2}
arcMax={Math.PI/2}
innerRadius={30}
outerRadius={50}
tickLength={30}
colorFill="red"
titleToCenter={-70}
valueToCenter={20}
unityToCenter={35}
/>
                    
- 参数说明：
1. svgid 必须
2. title 仪表盘标题，默认为空
3. unity 单位，默认为空
4. value 显示的数值,默认为0
5. percentage 数值相对整个数据范围的百分比，0到1，默认为0

- 其他可自定义的参数：
6. svgWidth svg元素的宽度，默认80px
7. svgHeight svg元素的高度，默认108px
8. arcMin 圆弧的起始角度，默认-Math.PI*2/3
9. arcMax 圆弧的终止角度，默认Math.PI*2/3
10. colorBackground 圆弧的底色，默认"#444851"
11. colorFill 动态圆弧的颜色，默认"#f28321"
12. innerRadius 圆弧的内圈半径，默认22px
13. outerRadius 圆弧的外圈半径，默认30px
14. tickLength 动态圆弧末端的指针长度，默认12px
15. tickColor 动态圆弧末端的指针颜色，默认"#A1A6AD"
16. titleToCenter 仪表盘标题距离圆弧中心的距离，默认-45
17. valueToCenter 仪表盘标题距离圆弧中心的距离，默认25
18. unityToCenter 仪表盘数值的单位距离圆弧中心的距离，默认40

- 其他自定义样式：
在 ../../styles/common.less 中定义了此仪表盘的通用样式。
比如，".dynamic-gauge .gauge-title"定义了仪表盘标题的样式。
可以另外自定义样式覆盖掉默认的。

*/
import React from "react"
import $ from "jquery";
import * as d3 from "d3";   //引入d3组件

/* 向外暴露仪表盘组件 */
export default class DynamicGauge extends React.Component {
    constructor(props) {
        super(props);
        this.state={
            percentage: this.props.percentage?this.formatDecimalRange(this.props.percentage):0,  //数值相对整个数据范围的百分比，默认为0
            title: this.props.title || "",  //仪表盘标题，默认为空
            value: this.props.value || this.props.percentage || 0,  //显示的数值,默认为0
            unity: this.props.unity || "",  //单位，默认为空
        }
        this.width = this.props.svgWidth||80,  //svg元素的宽度，默认80px
        this.height = this.props.svgHeight||108,    //svg元素的高度，默认108px
        this.arcMin=this.props.arcMin || -Math.PI*2/3   //圆弧的起始角度，默认-Math.PI*2/3
        this.arcMax=this.props.arcMax || Math.PI*2/3    //圆弧的终止角度，默认Math.PI*2/3
        this.colorBackground=this.props.colorBackground || "#444851"    //圆弧的底色，默认"#444851"
        this.colorFill=this.props.colorFill || "#f28321",   //动态圆弧的颜色，默认"#f28321"
        this.innerRadius=this.props.innerRadius || 22   //圆弧的内圈半径，默认22px
        this.outerRadius=this.props.outerRadius || 30   //圆弧的外圈半径，默认30px
        this.tickLength=this.props.tickLength || 12     //动态圆弧末端的指针长度，默认12px
        this.tickColor=this.props.tickColor || "#A1A6AD"    //动态圆弧末端的指针颜色，默认"#A1A6AD"
        this.titleToCenter=this.props.titleToCenter || -45    //仪表盘标题距离圆弧中心的距离，默认-45
        this.valueToCenter=this.props.valueToCenter || 25    //仪表盘标题距离圆弧中心的距离，默认25
        this.unityToCenter=this.props.unityToCenter || 40    //仪表盘数值的单位距离圆弧中心的距离，默认40
    }

    //组件加载之后的操作
    componentDidMount() {
        this.init() //初始化仪表盘
    }

    /** 
     * 初始化仪表盘
     */
    init(){
        // An arc function with all values bound except the endAngle. So, to compute an
        // SVG path string for a given angle, we pass an object with an endAngle
        // property to the `arc` function, and it will return the corresponding string.
        // 创建一个 arc 方法，并设置所有的属性，除了 endAngle。
        // 在创建圆弧的时候，传递一个包含 endAngle 属性的对象到这个方法，就可以计算出一个给定角度的 SVG path。
        this.arc = d3.arc()
            .innerRadius(this.innerRadius)
            .outerRadius(this.outerRadius)
            .startAngle(this.arcMin)

        //如果父组件传递的宽度是百分比，获取实际的像素值
        if(typeof this.width === "string" && this.width.indexOf('%') != -1){
            this.width = document.getElementById(this.props.svgid).clientWidth
        }
        //如果父组件传递的高度是百分比，获取实际的像素值        
        if(typeof this.height === "string" && this.height.indexOf('%') != -1){
            this.height = document.getElementById(this.props.svgid).clientHeight
        }

        // Get the SVG, and apply a transform such that the origin is the
        // center of the canvas. This way, we don’t need to position arcs individually.
        // 获取 SVG 元素，并且转换原点到画布的中心，这样我们在之后创建圆弧时就不需要再单独指定它们的位置了
        var svg = d3.select("#" + this.props.svgid)
        var g = svg.append("g").attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")");
        
        //添加仪表盘的标题
        g.append("text").attr("class", "gauge-title")
            .style("alignment-baseline", "central") //相对父元素对齐方式
            .style("text-anchor", "middle") //文本锚点，居中
            .attr("y", this.titleToCenter)   //到中心的距离
            .text(this.state.title);
        //添加仪表盘显示的数值
        this.valueLabel = g.append("text").attr("class", "gauge-value")
            .style("alignment-baseline", "central") //相对父元素对齐方式
            .style("text-anchor", "middle") //文本锚点，居中
            .attr("y", this.valueToCenter)    //到中心的距离
            .text(this.state.value);
        //添加仪表盘显示数值的单位            
        g.append("text").attr("class", "gauge-unity")
            .style("alignment-baseline", "central") //相对父元素对齐方式
            .style("text-anchor", "middle") //文本锚点，居中
            .attr("y", this.unityToCenter)    //到中心的距离
            .text(this.state.unity);

        //添加背景圆弧
        g.append("path")
            .datum({endAngle:this.arcMax})
            .style("fill", this.colorBackground)
            .attr("d", this.arc);
        
        this.currentAngle = this.formatDecimalRange(this.state.percentage)*(this.arcMax-this.arcMin) +this.arcMin //当前圆弧结束角度
        //添加另一层圆弧，用于表示百分比
        this.foreground = g.append("path")
            .datum({endAngle:this.currentAngle})
            .style("fill", this.colorFill)
            .attr("d", this.arc);

        //在圆弧末尾添加一个指针标记
        this.tick = g.append("line")
            .attr('class', 'gauge-tick')
            .attr("x1", 0)
            .attr("y1", -this.innerRadius)
            .attr("x2", 0)
            .attr("y2", -(this.innerRadius + this.tickLength))  //定义line位置，默认是在圆弧正中间
            .style("stroke", this.tickColor)
            .attr('transform', 'rotate('+ this.angleToDegree(this.currentAngle) +')')
    }

    /**
     * 控制小数值在[0,1]范围内
     * @param {*} d 小数
     */
    formatDecimalRange(d){
        if(d<0){
            return 0
        }else if(d>1){
            return 1
        }else{
            return d
        }
    }

    /**
     * 转换 Math.PI的角度到度数，用于rotate()中的参数
     * @param {*} angle 
     */
    angleToDegree(angle){
        return angle*180/Math.PI
    }
    /**
     * 更新仪表盘
     * @param {*} newPct 新的百分比值
     * @param {*} newValue 要显示的新的数值
     */
    updateTo(newPct,newValue){
        let self=this      
        let angle=newPct*(this.arcMax-this.arcMin) +this.arcMin //获取新的圆弧angle
        // let oldAngle = self.currentAngle    //获取当前圆弧的angle，作为渐变动画的起点
        let oldAngle = self.arcMin       //动画每次都从圆弧起点开始
        //更新圆弧，并且设置渐变动效
        this.foreground.transition()
            .duration(750)
            .ease(d3.easeElastic)   //设置来回弹动的效果
            .attrTween("d", this.arcTween(angle));
        //更新圆弧末端的指针标记，并且设置渐变动效            
        this.tick.transition()
            .duration(750)
            .ease(d3.easeElastic)   //设置来回弹动的效果
            .attrTween('transform', function(){ //原理同下面的arcTween方法，设置“transform”属性的渐变
                var i = d3.interpolate(self.angleToDegree(oldAngle), self.angleToDegree(angle));    //取插值，此处的oldAngle不能替换成self.currentAngle
                return function(t) {
                    return 'rotate('+ i(t) +')'
                };
            })
        this.valueLabel.text(newValue); //更新数值的显示
        self.currentAngle = angle   //更新当前圆弧的angle
    }

    /**
     * Returns a tween for a transition’s "d" attribute, transitioning any selected
     * arcs from their current angle to the specified new angle.
     * 返回一个“d”属性的补间（渐变）动画方法，使一个圆弧从当前的角度渐变到另一个新的角度。
     * @param {*} newAngle 新角度
     */
    arcTween(newAngle) {
        let self=this
        return function(d) {
            var interpolate = d3.interpolate(d.endAngle, newAngle); //在两个值间找一个插值,动画从上一个值开始
            return function(t) {
                d.endAngle = interpolate(t);    //根据 transition 的时间 t 计算插值并赋值给endAngle
                return self.arc(d); //返回新的“d”属性值
            };  
        };
    }
    
    //当组件将要接收新的props时执行，初始化render时不执行
    componentWillReceiveProps (nextProps) {   
        //如果props发生变化了
        if(this.props.percentage != nextProps.percentage || this.props.value != nextProps.value){
            this.updateTo(this.formatDecimalRange(nextProps.percentage),nextProps.value)     //更新仪表盘
        }               
    }

    render(){

        return (
            <svg
            id={this.props.svgid}
            className="dynamic-gauge"
            width={this.width} 
            height={this.height}
            ></svg>
            
        )
    }
}