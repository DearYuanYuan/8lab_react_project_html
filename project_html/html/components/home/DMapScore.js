
import React from "react";　　　　　　　　　 //react
import $ from "jquery";                   //jquery
require('../../utils/jquery.countTo.js'); //加载countTo插件

//可信云总体分数
export default class DMapScore extends React.Component {
    constructor(props) {
        super(props);  
        this.state = {
            from: 0,                //三个分数从左到右对应的起始值
            to: 0,                  //对应的终止值
            description: "",        //对应的描述
            level: 3                //分数的三个等级。[0,70):level3;[70,90):level2;[90,100]:level1
        }  
    }    

    //在 componentDidMount里面取到dom对象了，再和原生js一样的操作
    componentDidMount() {
        this.loadScoreFromServer(); //加载数据，仅一次
        this.scoreInterval = setInterval(this.updateScore.bind(this), 3000); //设置全局定时器变量,便于清除
        // 创建canvas对象
        var canvas = document.getElementById("totalScoreBox");
        var context = canvas.getContext("2d");
        //定义颜色
        var colorTransparent = this.rgba([255, 0, 0], 0); //透明填充色
        // 创建渐变，用于绘制分数外围的圆圈
        // createLinearGradient(x,y,x1,y1) - 创建线条渐变
        var defultColor = [[9, 106, 232],[6, 234, 221]]
        var grd = context.createLinearGradient(0, 100, 0, 300);
        grd.addColorStop(0.1, this.rgba(defultColor[0], 1));
        grd.addColorStop(0.9, this.rgba(defultColor[1], 1));
        //圆中心
        this.origin = [[50],[50]];
        // 绘制最外层圆
        this.drawCricle(context, this.origin, 48, colorTransparent, grd, 2.2);
    }

    // 组件将要被移除
    componentWillUnmount() {
        //离开页面时，去掉分数刷新的定时器
        if (this.scoreInterval) {
            clearInterval(this.scoreInterval);
        }
    }

    //canvas画圆
    drawCricle(context,origin,r,fillStyle,strokeStyle,lineWidth,shadowColor,shadowBlur) {
        context.strokeStyle = strokeStyle;
        context.fillStyle=fillStyle;      //填充颜色
        context.lineWidth = lineWidth;    //设置线宽
        context.shadowBlur = shadowBlur;
        context.shadowColor = shadowColor;
        context.beginPath();
        context.arc(origin[0], origin[1], r, 0, Math.PI * 2, true);
        //不关闭路径路径会一直保留下去，
        context.closePath();
        context.stroke();
        context.fill();
    }
    //更新分数
    updateScore() {
        var self = this;
        $.ajax({ //使用Ajax获取后台数据，对应的Url: http://localhost:8000/api/globalhome
            url: '/api/globalscore/',
            type: 'GET',
            dataType: 'json',
            timeout: 1000,  //超时限制
            cache: false,
            success: function (totalScore) {
                var score = totalScore.score; //获取score  
                self.setState({ //更新state
                    from: score,
                    to: score
                });
                if (self.shouldUpdateStyle(score)) { //如果需要改变分数和波浪的样式
                    self.setScoreStyle(score); //根据分数的大小设置分数的样式
                    self.wave(score, false).start() //更新波浪，false：不需要升起效果
                }
                //设定计数器，from，to相同，没有计数的动态效果
                $('.totalScoreBox .timer').countTo({
                    from: score,
                    to: score
                });
            } //成功执行方法
        });
    }
    //从后端第一次加载分数时调用
    loadScoreFromServer() {
        var self = this
        $.ajax({
            url: '/api/globalscore/',
            type: 'GET',
            dataType: 'json',
            cache: false,
            timeout: 1000, //设置超时
            success: function (totalScore) { //成功执行方法
                var score = totalScore.score;
                self.setState({
                    to: score
                });
                self.setScoreStyle(score); //根据分数的大小设置分数的样式
                $('.totalScoreBox .timer').countTo({    //设置分数由小变大的效果
                    to: score
                })
                self.wave(score, true).start() //第一次加载的时候波浪有从圆圈底部升起的效果，之后分数改变只是变色而不从底部升起
            }
        });
    }
    //转换颜色的格式
    //第一个参数为包含RGB值的数组，第二个参数为透明度
    rgba (e, t) {
        return "rgba(" + e[0] + "," + e[1] + "," + e[2] + "," + t + ")"
    }
    //绘制波浪，根据分数score大小不同而使用不同颜色的波浪，根据goUp是true/false来决定波浪是否有自下而上的升起效果
    wave(score, goUp) {
        var ctx;
        var waveImage;
        var canvasWidth;
        var canvasHeight;
        var needAnimate = false;
        //初始化 canvas画布    callback作为回调函数传入   canvas init画布后，调用start()
        function init(callback) {
            var wave = document.getElementById('wave');
            var canvas = document.getElementById('wave-canvas');
            if (!canvas || !canvas.getContext) {
                return;
            }
            ctx = canvas.getContext('2d');
            canvasWidth = wave.offsetWidth; //wave元素内可见区域的宽度 + 元素边框宽度（如果有滚动条还要包括滚动条的宽度）   offsetWidth=border+padding+width
            canvasHeight = wave.offsetHeight; //wave元素内可见区域的高度 + 元素边框高度（如果有滚动条还要包括滚动条的度）
            canvas.setAttribute('width', canvasWidth); //设置canvas宽度
            canvas.setAttribute('height', canvasHeight); //设置canvas高度
            wave.appendChild(canvas);
            waveImage = new Image(); //建立一个图像对象
            waveImage.onload = function () { //onload 事件会在页面或图像加载完成后立即发生
                waveImage.onload = null;
                callback() //防止图片没加载完成就开始动画
            };
            if (score >= 90) {
                waveImage.src = require('../../img/wave_smallBlue.png'); //引用已完成的波浪背景图片，给浏览器缓存了一张图片。
            } else if (score >= 70) {
                waveImage.src = require('../../img/wave_smallOrange.png'); //引用已完成的波浪背景图片，给浏览器缓存了一张图片。
            } else {
                waveImage.src = require('../../img/wave_smallRed.png'); //引用已完成的波浪背景图片，给浏览器缓存了一张图片。
            }
        }
        //设置波浪的动态效果
        function animate() {
            var waveX = 0;
            var waveX_min = -100; //控制x的最小显示范围
            var waveY_max = canvasHeight * 0.6; //控制Y的最大显示范围
            var waveY;
            if (goUp) { //如果需要有上升效果
                waveY = 0;
            } else { //不需要上升效果
                waveY = waveY_max
            }
            var requestAnimationFrame;  //requestAnimationFrame()函数是针对动画效果的API
            if (window.requestAnimationFrame) {
                requestAnimationFrame = window.requestAnimationFrame
            } else if (window.mozRequestAnimationFrame) {
                requestAnimationFrame = window.mozRequestAnimationFrame
            } else if (window.webkitRequestAnimationFrame) {
                requestAnimationFrame = window.webkitRequestAnimationFrame
            } else if (window.msRequestAnimationFrame) {
                requestAnimationFrame = window.msRequestAnimationFrame
            } else {
                requestAnimationFrame = function (callback) {
                    window.setTimeout(callback, 1000 / 60);  //setTimeout() 方法用于在指定的毫秒数后调用函数或计算表达式
                }
            }

            function loop() {
                ctx.clearRect(0, 0, canvasWidth, canvasHeight); //clearRect() 方法清空给定矩形内的指定像素
                if (!needAnimate) { //如果动画关闭状态
                    return;
                }
                if (waveY < waveY_max) { //如果waveY小于最大Y  不断+1.5这样就有了一种水慢慢升高的感觉~
                    waveY += 0.8; //到达最高点时候保持不动，只移动X
                }
                if (waveX < waveX_min) { //如果waveX小于 最小距离  重置waveX=0
                    waveX = 0;
                } else {
                    waveX -= 1.8; //否则不断-3
                }
                ctx.globalCompositeOperation = 'source-over'; //在目标图像上显示源图像     默认,相交部分由后绘制图形的填充(颜色,渐变,纹理)覆盖,全部浏览器通过
                ctx.beginPath(); //beginPath() 方法开始一条路径，或重置当前的路径
                ctx.arc(canvasWidth / 2, canvasHeight / 2, canvasHeight / 2, 0, Math.PI * 2, true);
                ctx.closePath(); //closePath() 方法创建从当前点到开始点的路径。
                ctx.fill(); //如果路径未关闭，那么 fill() 方法会从路径结束点到开始点之间添加一条线，以关闭该路径，然后填充该路径
                ctx.globalCompositeOperation = 'source-in'; //在目标图像中显示源图像。只有目标图像内的源图像部分会显示，目标图像是透明的;即隐藏在原外的图像部分
                ctx.drawImage(waveImage, waveX, canvasHeight - waveY); //向画布上面绘制图片，参数依次为规定要使用的图像、在画布上放置图像的 x 坐标位置、在画布上放置图像的 y 坐标位置
                requestAnimationFrame(loop);
            }
            loop();
        }

        //开始动画
        function start() {
            if (!ctx) {
                return init(start);
            }
            //needAnimate变量用来控制动画的开启和关闭
            needAnimate = true;
            setTimeout(function () {
                if (needAnimate) {
                    animate();
                }
            }, 2000);
        }
        //结束动画
        function stop() {
            needAnimate = false;
        }
        //将两个函数作为对象return出去
        return {
            start: start,
            stop: stop
        };
    }
    //是否需要更新波浪和分数的颜色样式
    //分数等级未改变时，不需要改变分数和波浪样式
    shouldUpdateStyle(newScore) {
        //如果新的分数在当前的等级，则表示不需要改变
        return !((this.state.level == 1 && newScore != 100 && newScore >= 90) ||
            (this.state.level == 2 && newScore < 90 && newScore >= 70) ||
            (this.state.level == 3 && newScore < 70 && newScore >= 0))     
    }
    
    //根据分数大小设置分数的样式,并更新分数等级
    setScoreStyle(score) {
        if (score == 100) { // 如果分数为100，改变分数文字大小，避免超出球体
            $('.totalScoreBox .map-score .count-title').css({
                "font-size": "40px",
                'color': '#0868e0'
            });
            this.setState({ //更新分数等级
                level: 1
            })
        } else if (score >= 90) { //根据分数变化改变分数的样式
            $('.totalScoreBox .map-score .count-title').css({
                "font-size": "42px",
                'color': '#0868e0'
            })
            this.setState({ //更新分数等级
                level: 1
            })
        } else if (score >= 70) {
            $('.totalScoreBox .map-score .count-title').css({
                "font-size": "42px",
                'color': '#c4711c'
            })
            this.setState({ //更新分数等级
                level: 2
            })
        } else {
            $('.totalScoreBox .map-score .count-title').css({
                "font-size": "42px",
                'color': '#cf4642'
            })
            this.setState({ //更新分数等级
                level: 3
            })
        }
    }
    render() {
        return ( 
            <div className = "totalScoreBox" >
                <div id = "wave" className = "wave"><span></span><canvas id="wave-canvas"></canvas></div> 
                <canvas id = "totalScoreBox" width = "120px" height = "120px" > </canvas> 
                <div className = "map-score">
                    <div className = "timer count-title" data-from = {this.state.from} data-to = {this.state.to} ></div> 
                    <span > 全球云健康 </span> 
                </div> 
            </div>
        )
    }
}