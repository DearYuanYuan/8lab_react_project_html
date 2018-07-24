
import React from "react";                     //react
import $ from "jquery";                        //jquery
require('../../utils/jquery.countTo.js');      //加载countTo插件


//全球云健康分数
export default class TotalScoreBox extends React.Component {
    //从后端第一次加载分数时调用
    loadScoreFromServer() {
        $.ajax({
            url: '/api/globalscore/',
            type: 'GET',
            dataType: 'json',
            cache: false,
            timeout: 1000,
            success: succFunction 
        });
        //全球云健康分数成功执行方法
        function succFunction(totalScore) {
            //获取总分数
            var score = totalScore.score;
            $('.totalScore').countTo({
                to: score
            });
        }
    }

     //更新分数Ajax
    updateScore() {
        $.ajax({
            url: '/api/globalscore/',
            type: 'GET',
            dataType: 'json',
            timeout: 1000,
            cache: false,
            //成功执行方法
            success: function(totalScore) {
                //获取score
                var score = totalScore.score; 
                //启动定时器
                setTimeout(function(){$('.totalScore').countTo({
                    from: score,
                    to: score
                })},1000)
            } 
        });        
    }

    //组件将要渲染前
    componentWillMount() {
        //调用从后端第一次加载分数时的Ajax
        this.loadScoreFromServer();
    }

    //在 componentDidMount里面取到dom对象了，再和原生js一样的操作
    componentDidMount() {
        //设置定时器不断更新分数  5s一次
        this.scoreInterval = setInterval(this.updateScore.bind(this), 5000); //设置全局定时器变量,便于清除
    }

    //组件将要移除时调用
    componentWillUnmount() {
        //离开页面时，去掉分数刷新的定时器
        if (this.scoreInterval) {
            clearInterval(this.scoreInterval);
        }
    }

    // 渲染页面
    render() {
        return (
            <div className="systemScore">
                <svg className='circleBox' xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="circle" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#007AE1', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#9F86FF', stopOpacity: 1 }} />
                        </linearGradient>
                        <linearGradient id="number" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#fff', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#fff', stopOpacity: 1 }} />
                        </linearGradient>
                        <linearGradient id="text" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{ stopColor: '#fff', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#fff', stopOpacity: 1 }} />
                        </linearGradient>
                    </defs>
                    <circle cx="50%" cy="50%" r="95" style={{ stroke: 'url(#circle)', strokeWidth: 6, fill: 'transparent' }} />
                    <text x="50%" y="42%" dx="0" dy="43" style={{fill: 'url(#number)', textAnchor: "middle"}} className="totalScore"></text>
                    <text x="50%" y="53%" dx="0" dy="43" style={{fill: 'url(#text)', textAnchor: "middle"}} className="scoreStatement">系统可信指数</text>
                </svg>
            </div>
        )
    }
}