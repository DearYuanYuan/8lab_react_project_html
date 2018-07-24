import React from "react";
import $ from 'jquery';
import echarts from "echarts"
import DynamicGauge from "./Commonality/DynamicGauge"
import MessageBox from "./Commonality/MessageBox"       //消息提示框组件
import ToggleButton from "./Commonality/ToggleButton.js" //开关组件

/* 攻防靶场*/
export default class TargetRange extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            protectedHosts:[],  //被保护主机的列表
            msgProtectedHost:"暂无被保护主机的信息",  //被保护主机的列表的提示信息
            allHosts:[],    //所有主机的列表
            healthyHost:[], //正常的主机
            unhealthyHost:[],   //异常的主机
            msgAllHost:"暂无主机信息",    //所有主机的列表的提示信息
            systemInfo:null,    //运行ctf靶场服务的主机的信息
            // msgSystemInfo:"",   //运行ctf靶场服务的主机的信息数据的提示信息      
            selectedHost:null,  //右侧面板中展示的一个主机的详细信息。如果选中上方列表中的主机，这里也显示对应的信息。
            // tooltipsContent:[], //用于显示在tooltip中的主机列表
            detailLog:[],   //右侧面板显示的主机系统日志
            msgDetailLog:"暂无日志",  //右侧面板显示的主机系统日志部分的提示信息

            showMsgBox:false,                   //不显示消息提示框
            msgContent:'',                      //提示框的提示消息
            msgButtonState:false,               //提示框中的按钮状态
            msgButtonName:"",                   //提示框中的按钮名称
        }
        this.formerSystemInfo=null  //上一次获取的运行ctf靶场服务的主机的信息
        this.unhealthPercentage=0   //正常主机所占的比例
        this.logIsPaused = false    //日志轮播效果是否暂停
        this.isTooltipHovered=false //鼠标是否悬停在显示主机信息的tooltip窗口
    };

    /**
     * 组件已经加载后的操作
     */
    componentDidMount(){  
        window.requestAnimFrame = (function(){
          return  window.requestAnimationFrame       ||
                  window.webkitRequestAnimationFrame ||
                  window.mozRequestAnimationFrame    ||
                  function( callback ){
                    window.setTimeout(callback, 1000 / 60);
                  };
        })();
  
        document.title="攻防态势"    
        this.initCharts()     //初始化echarts图表  
        //获取数据
        this.getAllHosts()  //获取右侧面板中的所有主机的列表    
        this.allHostsInterval=setInterval(this.getAllHosts.bind(this),5000) //获取右侧面板中的所有主机的列表，每5s刷新     
        this.getProtectedHost() //获取左侧面板中的被保护主机的列表
        this.protectedHostInterval=setInterval(this.getProtectedHost.bind(this),5000) //获取左侧面板中的被保护主机的列表，每5s刷新     
        this.getSystemInfo()    //获取运行ctf服务的主机的系统信息
        this.systemInfoInterval=setInterval(this.getSystemInfo.bind(this),5000) //获取运行ctf服务的主机的系统信息，每5s刷新
        this.getHostDetail()    //随机获取右侧面板中单个主机的信息
        this.hostDetailInterval = setInterval(this.getHostDetail.bind(this),3000)    //随机获取右侧面板中单个主机的信息,每3s刷新
        // this.getUnhealthyHost() //获取中间互动区域的tooltip窗口显示的异常主机信息
        this.getLogNum()
        //绘制粒子动画
        //引入粒子动画所需js文件
        require("../utils/CanvasRenderer")
        require("../utils/Projector")
        this.initThreejs() //初始化粒子动画的属性        
        this.drawParticles()   
        this.animateParticles()

        this.addAllListeners()   //添加页面中的事件监听 
    }

    /** 
     * 添加页面中的事件监听 
     * 由于通过 onMouseEnter 属性添加事件监听在IE上出现问题，因此统一都改成 addEventListener 的方式添加事件监听
     */
    addAllListeners(){
        //添加事件监听器
        document.getElementsByClassName("interaction-area")[0].addEventListener("mouseenter", this.onEnterInteractionArea.bind(this))
        document.getElementsByClassName("interaction-area")[0].addEventListener("mouseleave", this.onLeaveInteractionArea.bind(this))
        document.getElementById("customTooltip").addEventListener("mouseenter", ()=> this.isTooltipHovered=true)
        document.getElementById("customTooltip").addEventListener("mouseleave", ()=> this.isTooltipHovered=false)

        //当鼠标悬停在主机信息上时，停止每3s随机显示一个主机的定时器，便于操作“可信防护”“可信阻断”的操作
        document.getElementById("hostInfoBox").addEventListener("mouseenter", ()=> {    //取消定时器
            if(this.hostDetailInterval){
                this.hostDetailInterval =clearInterval(this.hostDetailInterval)
            } 
        })
        let self = this
        document.getElementById("hostInfoBox").addEventListener("mouseleave", ()=> {    //恢复定时器
            //去除当前延时器
            if(self.hostDetailTimeout){
                self.hostDetailTimeout = clearTimeout(self.hostDetailTimeout)
            }
            self.hostDetailTimeout = setTimeout(function(){
                self.hostDetailInterval = setInterval(self.getHostDetail.bind(self),3000)    //随机获取右侧面板中单个主机的信息,每3s刷新
            }, 5000)            
        })
    }

    /**
     * 组件即将卸载时的操作
     */
    componentWillUnmount(){
        cancelAnimationFrame(this.requestID)    //取消动画的重绘
        //去除当前定时器
        if(this.allHostsInterval){
            this.allHostsInterval=clearInterval(this.allHostsInterval)
        } 
        //去除当前定时器
        if(this.protectedHostInterval){
            this.protectedHostInterval=clearInterval(this.protectedHostInterval)
        } 
        //去除当前定时器
        if(this.hostDetailInterval){
            this.hostDetailInterval=clearInterval(this.hostDetailInterval)
        }  
        //去除当前延时器
        if(this.hostDetailTimeout){
            clearTimeout(this.hostDetailTimeout)
        } 
        //去除当前定时器
        if(this.systemInfoInterval){
            this.systemInfoInterval=clearInterval(this.systemInfoInterval)
        }         
    }

    /* =======================================获取面板中显示的数据 START============================================= */

    /** 
     * 右侧面板获取主机详情
     * 如果一切主机都正常，每3秒随机显示一个主机的信息;
     * 如果有异常的主机，则每3秒随机显示一个异常主机的信息
     */
    getHostDetail(){
        var self=this
        if(self.state.allHosts && self.state.allHosts.length>0){
            let randomList = self.state.allHosts
            if(self.state.unhealthyHost && self.state.unhealthyHost.length>0){
                randomList = self.state.unhealthyHost
            }
            let random = Math.floor(Math.random()*randomList.length)
            if(!self.state.selectedHost || randomList[random].ip != self.state.selectedHost.ip){    //如果要显示的主机不同于正在显示的主机，请求新的数据
                self.setState({
                    selectedHost: randomList[random],
                    isProtectOn: randomList[random].is_protect==0,  //is_protect： 0表示受到防护，1表示未受到防护
                    isBlockOn:  randomList[random].is_block==0  //is_block：0表示阻断，1表示未阻断
                })
                self.getDetailLog(randomList[random].ip)
            }            
        }
    }

    /**
     * 根据IP获取主机详细日志
     * @param  ip
     * @return {[type]}
     */
    getDetailLog(ip){
        let self=this
        $.ajax({
            url: '/api/ctf/detail_log/',
            type: 'GET',                   //POST方式时,表单数据作为 HTTP 消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为 URL 地址的参数进行传递
            data: {                         //表单数据
                ip:ip
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            success: function (data) {
                if(data && data.code==200 && data.data.length>0){
                    self.setState({
                        msgDetailLog:null,
                        detailLog:data.data
                    })
                    self.initLogAnimation() //初始化日志轮播动画                        
                }else{
                    self.setState({
                        detailLog:[],
                        msgDetailLog:"暂无日志"
                    })
                }
            },
            error: function(){
                self.setState({
                    detailLog:[],
                    msgDetailLog:"服务繁忙，暂无日志"
                })
            }
        })
    }

    /**
     * 在所有主机的列表中选中某一个主机时的操作
     * @param {*} host 主机
     */
    onSelectHost(host){
        let self=this
        if(!self.state.selectedHost || host.ip != self.state.selectedHost.ip){    //如果要显示的主机不同于正在显示的主机，则请求新的数据
            this.setState({
                selectedHost: host,
                isProtectOn: host.is_protect==0,    //is_protect： 0表示受到防护，1表示未受到防护
                isBlockOn: host.is_block==0     //is_block：0表示阻断，1表示未阻断
            })
            this.getDetailLog(host.ip)
        }
        //去除当前定时器
        if(this.hostDetailInterval){
            this.hostDetailInterval = clearInterval(this.hostDetailInterval)
        }  
        //去除当前获取所有主机列表的定时器
        if(this.allHostsInterval){
            this.allHostsInterval = clearInterval(this.allHostsInterval)
        }  
        //去除当前延时器
        if(this.hostDetailTimeout){
            this.hostDetailTimeout = clearTimeout(this.hostDetailTimeout)
        }  
        //设置延时器，7s后重新开始定时器，每3s刷新单个主机详情，每5s刷新所有主机列表
        this.hostDetailTimeout = setTimeout(function(){
            self.hostDetailInterval = setInterval(self.getHostDetail.bind(self),3000)    //随机获取右侧面板中单个主机的信息,每3s刷新
            self.allHostsInterval=setInterval(self.getAllHosts.bind(self),5000) //获取右侧面板中的所有主机的列表，每5s刷新     
        },7000)      
    }

    /** 
     * 初始化日志轮播的动画
     * 只有在第一次加载日志数据时，初始化轮播动画
     */
    initLogAnimation(){
        var self=this   
        var interval = 6000 //轮播动画的循环间隔
        let scrollBox = $(".log-box")    
        //只有在第一次加载日志数据时，设置轮播动画
        //this.logIsPaused 用于避免在动画暂停时（此时满足 !this.logAnimeInterval），重新又设置了动画
        if(!this.logAnimeInterval && !this.logIsPaused){ 
            scroll()    //开始滚动
            this.logAnimeInterval = setInterval(scroll,interval)    //循环的轮播日志
            scrollBox.mouseenter(pause).mouseleave(restart)
        }
        //向上滚动
        function scroll(){            
            scrollBox.animate(
                {marginTop:-scrollBox.height()+$('#scrollHostLog').height()<0?-scrollBox.height()+$('#scrollHostLog').height():-scrollBox.height()}, 
                interval, 
                "linear", 
                function(){scrollBox.css({marginTop:0})}  //动画结束时回到其实位置
            )
        }
        //暂停动画
        function pause(){   
            if(self.logAnimeInterval){
                self.logAnimeInterval=window.clearInterval(self.logAnimeInterval)    //取消定时器
                scrollBox.stop()  //停止动画
                self.logIsPaused = true
            }
        }
        //重新开始动画
        function restart(){ 
            if(!self.logAnimeInterval){
                scroll()    //开始滚动
                self.logAnimeInterval = setInterval(scroll,interval)    //重新开始定时器
                self.logIsPaused = false
            }
        }
    }

    /** 
     * 获取运行CTF靶场服务的主机信息
     */
    getSystemInfo(){
        var self=this
        $.ajax({
            url: '/api/ctf/run_ctf_host_info/',
            type: 'POST',                   //POST方式时,表单数据作为 HTTP 消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为 URL 地址的参数进行传递
            data: {                         //表单数据
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            success: function (data) {
                if(data && data.code == 200){                   
                    self.formerSystemInfo = self.state.systemInfo   //保留这次数据，用于比较                    
                    self.setState({
                        systemInfo:data.data
                    });
                }else{
                    self.setState({
                        systemInfo:null
                        // msgSystemInfo:"服务繁忙，请稍候。"
                    });
                }             
            },
            error: function(){
                self.setState({
                    systemInfo:null
                    // msgSystemInfo:"服务繁忙，请稍候。"
                });
            }
        })
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
        if(num<1000){   //小数点前有3位
            temp = num
            if(this.isInterger(temp)){   //如果是整数
                return temp
            }else{
                return temp.toFixed(4-this.numsBeforeDecimal(temp))  
            }
        }else if(num>=1000 && num<1000000){ //小数点前有4-6位
            temp=num/1000
            if(this.isInterger(temp)){   //如果是整数
                return temp + "K"
            }else{
                return temp.toFixed(3-this.numsBeforeDecimal(temp)) + "K"
            }            
        }else if(num>1000000 && num<1000000000){    //小数点前有6-9位
            temp=num/1000000
            if(this.isInterger(temp)){   //如果是整数
                return temp + "M"
            }else{
                return temp.toFixed(3-this.numsBeforeDecimal(temp)) + "M"
            }            
        }else { //小数点前多于9位
            temp=num/1000000000
            if(this.isInterger(temp)){   //如果是整数
                return temp + "B" 
            }else{
                return temp.toFixed(3-this.numsBeforeDecimal(temp)) + "B" 
            }            
        }
    }
    /** 
     * 获取所有主机的列表
     */
    getAllHosts(){
        var self=this
        $.ajax({
            url: '/api/ctf/all_host/',
            type: 'POST',                   //POST方式时,表单数据作为 HTTP 消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为 URL 地址的参数进行传递
            data: {                         //表单数据
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            success: function (data) {
                if(data && data.code == 200){                    
                    if(data.all_total>0){
                        //如果异常主机占比发生变化，重绘粒子动画。
                        if((data.unhealth_total/data.all_total).toFixed(3) != self.unhealthPercentage){
                            self.unhealthPercentage = (data.unhealth_total/data.all_total).toFixed(3)
                            //根据可信主机占比，绘制动画
                            self.drawParticles()
                            self.animateParticles()
                        }                         

                        if(data.unhealth_total>0){  //如果存在异常主机
                            let unhealthy = new Array()
                            let healthy = new Array()
                            for (let i=0;i<data.data.length;i++){
                                if(data.data[i].status===0){//正常
                                    healthy.push(data.data[i])
                                }else if(data.data[i].status===1){//异常
                                    unhealthy.push(data.data[i])                                    
                                }
                            }
                            let selectedHost = data.unhealth_total ? unhealthy[0] : data.data[0]
                            self.setState({
                                selectedHost: selectedHost,
                                isProtectOn: selectedHost.is_protect==0,  //is_protect： 0表示受到防护，1表示未受到防护
                                isBlockOn:  selectedHost.is_block==0,  //is_block：0表示阻断，1表示未阻断
                                msgAllHost:null,                                
                                allHosts:data.data,
                                healthyHost:healthy,
                                unhealthyHost:unhealthy,
                            });                            
                        }else{
                            self.setState({
                                msgAllHost:null, 
                                allHosts:data.data,
                                healthyHost:data.data,
                                unhealthyHost:[],                                
                            });
                        }                        
                    }else{
                        self.setState({
                            msgAllHost:"暂无主机信息。",
                            allHosts:[],
                            healthyHost:[],
                            unhealthyHost:[] 
                        });
                    }                    
                }else{
                    self.setState({
                        msgAllHost:"服务繁忙，请稍候。",
                        allHosts:[],
                        healthyHost:[],
                        unhealthyHost:[] 
                    });
                }             
            },
            error: function(){
                self.setState({
                    msgAllHost:"服务繁忙，请稍候。",
                    allHosts:[],
                    healthyHost:[],
                    unhealthyHost:[]
                });
            }
        })
    }


    /** 
     * 获取被保护主机的列表
    */
    getProtectedHost(){
        var self=this
        $.ajax({
            url: '/api/ctf/protected_host/',
            type: 'POST',                   //POST方式时,表单数据作为 HTTP 消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为 URL 地址的参数进行传递
            data: {                         //表单数据
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            success: function (data) {
                if(data && data.code == 200){
                    if(data.total>0){
                        self.setState({
                            msgProtectedHost:null,
                            protectedHosts:data.data
                        });
                    }else{
                        self.setState({
                            msgProtectedHost:"暂无被保护的主机。",
                            protectedHosts:[]
                        });
                    }                    
                }else{
                    self.setState({
                        msgProtectedHost:"服务繁忙，请稍候。",
                        protectedHosts:[]
                    });
                }             
            },
            error:function(){
               self.setState({
                    msgProtectedHost:"服务繁忙，请稍候。",
                    protectedHosts:[]
                }); 
            }
        })
    }

    /** 
     * 初始化Echarts图表
     */
    initCharts(){        
        var lineOption = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    lineStyle: {
                        color: '#F28321'
                    }
                },
                textStyle: {
                    color: '#fff',
                },
            },
            grid:{
                left:50,
                top:5,
                bottom:20,
                right:2
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                splitLine: {
                    show: true,
                    interval: 0,
                    lineStyle: {
                        color: ['#444851']
                    }
                },
                axisTick: {
                    show: false
                },
                axisLine: {
                    lineStyle: {
                        color: '#444851'
                    }
                },
                axisLabel: {
                    margin: 10,
                    textStyle: {
                        fontSize: 8,
                        color:"#FFFFFF"
                    }
                }
            },
            yAxis: {
                name:"日志数量",
                nameLocation:"middle",
                nameTextStyle:{
                    color:"#fff",
                    fontSize:8
                },
                nameGap:40,
                type: 'value',
                splitLine: {
                    lineStyle: {
                        color: ['#444851']
                    }
                },
                axisTick: {
                    show: false
                },
                axisLine: {
                    lineStyle: {
                        color: '#444851'
                    }
                },
                axisLabel: {
                    margin: 10,
                    textStyle: {
                        fontSize: 8,
                        color:"#FFFFFF"
                    }
                }
            },
            series: [{
                name: '日志数量',
                type: 'line',
                smooth: true,
                showSymbol: false,
                symbol: 'circle',
                symbolSize: 6,
                areaStyle: {
                    normal: {
                        color: "rgba(242,131,33,0.20)"
                    }
                },
                itemStyle: {
                    normal: {
                        color: '#F28321'
                    }
                },
                lineStyle: {
                    normal: {
                        width: 1
                    }
                }
            }]
        };        
        this.lineChart = echarts.init(document.getElementById('linechart'))
        this.lineChart.setOption(lineOption);    
    }

    /** 
     * 获取折线图对应的日志数量
     */
    getLogNum(){
        let self= this
        $.ajax({
            url:"/api/ctf/syslog_incr_count/",
            type:"POST",
            dataType:'json',
            cache: false,
            success: function(data){
                if(data && data.code === 200){
                    let logtime=new Array(),
                        lognum=new Array()
                    for (let i=0;i<data.total.length;i++){
                        for(let key in data.total[i]){
                            logtime.push(data.total[i][key][1])
                            lognum.push(key)
                        }
                    }                  
                    self.lineChart.setOption({
                        xAxis: {
                            data: logtime.reverse()
                        },
                        series:{
                            data: lognum.reverse(),
                        }
                    });  
                }else{
                    self.lineChart.setOption({
                        xAxis: {
                            data: []
                        },
                        series:{
                            data: [],
                        }
                    });
                }
            },
            error: function(){
                self.lineChart.setOption({
                    xAxis: {
                        data: []
                    },
                    series:{
                        data: [],
                    }
                }); 
            }
        })
    }

    /**
     * 可信防护开关
     * @param  {String}  checkboxID  开关按钮中包含的checkbox的ID
     * @param  {Object}  host        操作的主机
     * @param  {Boolean} isInTooltip 此开关是否在中间区域的弹窗中
     * @return {Boolean}             操作是否成功
     */
    changeProtectState(checkboxID,host,isInTooltip){
        let self = this
        let on = $('#'+checkboxID).is(':checked')    //true打开，false关闭
        let success = false  //是否成功开启或关闭
        if(on){ //打开可信防护
            $.ajax({
                url: "/api/blackbox/start_protection/",
                type: "POST",
                dataType: "json",
                data: {
                    ip: host.ip
                },
                cache: false,
                success: function(data){
                    if(data && data.status){
                        success = true
                        if(!isInTooltip){    //如果是在右侧面板中操作
                            self.setState({
                                isProtectOn: !self.state.isProtectOn,
                            })
                        }else{  //如果是在动画区域的弹出框中操作
                            self.setState({
                                isTooltipProtectOn: !self.state.isTooltipProtectOn,
                            })
                        }
                        self.setState({     //显示提示消息
                            showMsgBox:true,
                            msgContent: '可信防护已成功开启！',
                            msgButtonState:true,
                            msgButtonName:'确认',
                        }); 
                    }else{
                        self.setState({     //显示提示消息
                            showMsgBox:true,
                            msgContent: '可信防护开启失败！',
                            msgButtonState:true,
                            msgButtonName:'确认',
                        }); 
                    }
                },
                error: function(){
                    self.setState({     //显示提示消息
                        showMsgBox:true,
                        msgContent: '服务器繁忙，请稍候再试。',
                        msgButtonState:true,
                        msgButtonName:'确认',
                    }); 
                }
            })
        }else{  //关闭可信防护
            $.ajax({
                url: "/api/blackbox/stop_protection/",
                type: "POST",
                dataType: "json",
                data: {
                    ip: host.ip
                },
                cache: false,
                success: function(data){
                    if(data && data.status){
                        success = true
                        if(!isInTooltip){    //如果是在右侧面板中操作
                            self.setState({
                                isProtectOn: !self.state.isProtectOn,
                            })
                        }else{  //如果是在动画区域的弹出框中操作
                            self.setState({
                                isTooltipProtectOn: !self.state.isTooltipProtectOn,
                            })
                        }
                        self.setState({     //显示提示消息
                            showMsgBox:true,
                            msgContent: '可信防护已成功关闭！',
                            msgButtonState:true,
                            msgButtonName:'确认',
                        }); 
                    }else{
                        self.setState({     //显示提示消息
                            showMsgBox:true,
                            msgContent: '可信防护关闭失败！',
                            msgButtonState:true,
                            msgButtonName:'确认',
                        }); 
                    }
                },
                error: function(){
                    self.setState({     //显示提示消息
                        showMsgBox:true,
                        msgContent: '服务器繁忙，请稍候再试。',
                        msgButtonState:true,
                        msgButtonName:'确认',
                    }); 
                }
            })
        }
        return success
    }

    /**
     * 可信阻断开关
     * @param  {String}  checkboxID  开关按钮中包含的checkbox的ID
     * @param  {Object}  host        操作的主机
     * @param  {Boolean} isInTooltip 此开关是否在中间区域的弹窗中
     * @return {Boolean}             操作是否成功
     */
    changeBlockState(checkboxID, host, isInTooltip){
        let self = this
        let on = $('#'+checkboxID).is(':checked')      //true打开，false关闭
        let success = false
        if(on){ //打开可信阻断
            $.ajax({
                url: "/api/blackbox/start_senior_block/",
                type: "POST",
                dataType: "json",
                data: {
                    ip: host.ip
                },
                cache: false,
                success: function(data){
                    if(data && data.status){
                        success = true
                        if(!isInTooltip){    //如果是在右侧面板中操作
                            self.setState({
                                isBlockOn: !self.state.isBlockOn,
                            })
                        }else{  //如果是在动画区域的弹出框中操作
                            self.setState({
                                isTooltipBlockOn: !self.state.isTooltipBlockOn,
                            })
                        }
                        self.setState({     //显示提示消息
                            showMsgBox:true,
                            msgContent: '可信阻断已成功开启！',
                            msgButtonState:true,
                            msgButtonName:'确认',
                        }); 
                    }else{
                        self.setState({     //显示提示消息
                            showMsgBox:true,
                            msgContent: '可信阻断开启失败！',
                            msgButtonState:true,
                            msgButtonName:'确认',
                        }); 
                    }
                },
                error: function(){
                    self.setState({     //显示提示消息
                        showMsgBox:true,
                        msgContent: '服务器繁忙，请稍候再试。',
                        msgButtonState:true,
                        msgButtonName:'确认',
                    }); 
                }
            })
        }else{  //关闭可信阻断
            $.ajax({
                url: "/api/blackbox/stop_senior_block/",
                type: "POST",
                dataType: "json",
                data: {
                    ip: host.ip
                },
                cache: false,
                success: function(data){
                    if(data && data.status){
                        success = true
                        if(!isInTooltip){    //如果是在右侧面板中操作
                            self.setState({
                                isBlockOn: !self.state.isBlockOn,
                            })
                        }else{  //如果是在动画区域的弹出框中操作
                            self.setState({
                                isTooltipBlockOn: !self.state.isTooltipBlockOn,
                            })
                        }
                        self.setState({     //显示提示消息
                            showMsgBox:true,
                            msgContent: '可信阻断已成功关闭！',
                            msgButtonState:true,
                            msgButtonName:'确认',
                        }); 
                    }else{
                        self.setState({     //显示提示消息
                            showMsgBox:true,
                            msgContent: '可信阻断关闭失败！',
                            msgButtonState:true,
                            msgButtonName:'确认',
                        }); 
                    }
                },
                error: function(){
                    self.setState({     //显示提示消息
                        showMsgBox:true,
                        msgContent: '服务器繁忙，请稍候再试。',
                        msgButtonState:true,
                        msgButtonName:'确认',
                    }); 
                }
            })
        }
        return success
    }

    /**
     * 标为误报
     */
    markWarning(){
        let self = this
        $.ajax({
            url:"/api/ctf/warn_handle/",
            type: "POST",
            dataType: "json",
            data:{
                ip: self.state.selectedHost.ip
            },
            cache: false,
            success: function(data){
                if(data){
                    self.setState({     //显示提示消息
                        showMsgBox:true,
                        msgContent:data.message,
                        msgButtonState:true,
                        msgButtonName:'确认',
                    }); 
                }else{
                    self.setState({     //显示提示消息
                        showMsgBox:true,
                        msgContent: '服务器繁忙，请稍候再试。',
                        msgButtonState:true,
                        msgButtonName:'确认',
                    }); 
                }
            },
            error: function(){
                self.setState({     //显示提示消息
                    showMsgBox:true,
                    msgContent: '服务器繁忙，请稍候再试。',
                    msgButtonState:true,
                    msgButtonName:'确认',
                }); 
            }
        })
    }
    /* =======================================获取面板中显示的数据 END============================================= */

    /* =======================================粒子动画 START============================================= */

    /**
     * 初始化一些全局变量
     * 在重绘粒子动画时这些变量不回到初始状态，这样可以做到重绘前后的动画“无缝”衔接。
     * 比如相机位置，鼠标位置，等
     */
    initThreejs(){
        this.SEPARATION = 100;    //粒子的间距
        this.AMOUNTX = 50;   //x轴粒子个数
        this.AMOUNTY = 50;   //y轴粒子个数        

        this.count = 0;     //用于控制动画中粒子的位置和大小，
        
        //初始时鼠标位置,决定相机角度
        this.mouseX = 285;
        this.mouseY = -342;

        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;     
        
        //创建透视投影相机
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);//参数：视角，宽高比等。
        this.camera.position.z = 1000;   //设置相机位置

        //创建渲染器
        this.renderer = new THREE.CanvasRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio); //设置设备像素比例,这通常用于HiDPI设备以防止模糊输出画布。
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor("#202129"); //设置粒子动图的背景色
        
        //创建粒子的材质（Material）
        var PI2 = Math.PI * 2;
        this.material = new THREE.SpriteCanvasMaterial ({

            color: 0xe1e1e1,    //粒子的颜色
            program: function(context) {    //用于绘制粒子的方法
                context.beginPath();
                context.arc(0, 0, 0.003, 0, PI2, true);    //绘制一个圆圈
                context.fill();
            }

        });        

        //设置动画的鼠标和触摸等事件监听
        document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false);
        document.addEventListener('touchstart', this.onDocumentTouchStart.bind(this), false);
        document.addEventListener('touchmove', this.onDocumentTouchMove.bind(this), false);
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    /**
     * 初始化THREEjs的相机，场景，渲染器等
     */
    drawParticles(){  
        let self=this
        //取消动画的重绘
        //不取消的话，重覆调用animateParticles 方法时，动画会变快。
        if(this.requestID){
            cancelAnimationFrame(this.requestID)
        }    
        //创建一个新的场景
        this.scene = new THREE.Scene();

        //按照百分比生成随机的粒子光柱的索引数组
        //处理一下光柱的个数。避免橙色光柱太密集，影响体验
        var num =  Math.floor(this.unhealthPercentage * this.AMOUNTX * this.AMOUNTY /5);
        num = num>150?150:num;  //最多150个光柱   

        if(num > 0){
            //橙色光柱的动画时由以下图片连接而成
            this.lightbars = []
            for (var i = 8; i >= 1; i--) {
                this.lightbars[i-1] = new Image()
                this.lightbars[i-1].src = "/static/img/lightbars/"+i+".png"
            }

            //橙色光柱的绘制
            this.materialLight = new THREE.SpriteCanvasMaterial ({

                color: '#F28321',    //粒子的颜色
                program: function(context) {    //用于绘制粒子的方法

                    var img = new Image()
                    img.src="/static/img/lightbars/1.png"
                    context.drawImage(self.lightbars[0],-0.045,0,0.09,0.42)

                    // context.beginPath();       
                    // var lGrd = context.createLinearGradient(-0.008,0.25,0.016,-0.25);  
                    // lGrd.addColorStop(0, '#F28321');  
                    // lGrd.addColorStop(1, 'transparent');  
                    // context.fillStyle = lGrd;  
                    // context.fillRect(-0.008,0.25,0.016,-0.25);  //光柱中间的渐变长方形
                    
                    // context.fillStyle = "#F28321";
                    // context.arc(0, 0, 0.008, 0, PI2, true);    //绘制光柱底部的实心圆
                    // context.arc(0, 0.25, 0.008, 0, PI2, true);    //绘制光柱顶部的实心圆
                    // context.fill();  
                    
                    // context.closePath();    //不能少
                    
                    // var rGrd = context.createRadialGradient(0, 0.25, 0, 0, 0.25, 0.025);
                    // rGrd.addColorStop(0, 'transparent');  
                    // rGrd.addColorStop(1, 'rgba(242,131,33,0.28)');  
                    // context.fillStyle = rGrd; 
                    // context.arc(0, 0.25, 0.025, 0, PI2, true);    //绘制光柱顶部的渐变光圈
                    // context.fill();
                                                 
                }

            });

            this.indices = [];   //光柱的索引列表
            for (let i = 0;i<num;i++){
                var temp = Math.floor(Math.random() * this.AMOUNTX * this.AMOUNTY )
                if ( this.indices.indexOf(temp) == -1){
                    this.indices[i] = temp;
                }
            }
        }else{
            this.materialLight = null
            this.lightbars = []
            this.indices = [];   //光柱的索引列表
        }

        //创建粒子，并添加到新场景中
        this.particles = new Array();
        //初始化粒子的位置和材质
        let index = 0;
        let particle;
        for (var ix = 0; ix < this.AMOUNTX; ix++) {

            for (var iy = 0; iy < this.AMOUNTY; iy++) {

                if (this.indices.length && this.indices.indexOf(index) !== -1){ //创建代表异常的橙色光柱
                    particle = this.particles[index++] = new THREE.Sprite(this.materialLight);
                }else{  //创建代表正常的白色粒子
                    particle = this.particles[index++] = new THREE.Sprite(this.material);                    
                }
                particle.position.x = ix * this.SEPARATION - ((this.AMOUNTX * this.SEPARATION) / 2);
                particle.position.z = iy * this.SEPARATION - ((this.AMOUNTY * this.SEPARATION) / 2);
                this.scene.add(particle);   //将粒子添加到场景中
            }
        }

        this.container = document.getElementById('particlesContainer');
        this.container.innerHTML = ""   //清空元素子节点，清除旧的canvas    
        
        //将要渲染的元素节点添加到container节点中
        this.container.appendChild(this.renderer.domElement);        
    }

    /**
     * 窗口大小改变时 
     */
    onWindowResize() {
        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * 鼠标移动时
     * @param {*} event 
     */
    onDocumentMouseMove(event) {
        this.mouseX = event.clientX - this.windowHalfX;
        this.mouseY = event.clientY - this.windowHalfY;
    }

    /**
     * 移动端触屏开始事件
     * @param {*} event 
     */
    onDocumentTouchStart(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            this.mouseX = event.touches[0].pageX - this.windowHalfX;
            this. mouseY = event.touches[0].pageY - this.windowHalfY;
        }
    }

    /**
     * 移动端触屏结束事件
     * @param {*} event 
     */
    onDocumentTouchMove(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            this.mouseX = event.touches[0].pageX - this.windowHalfX;
            this.mouseY = event.touches[0].pageY - this.windowHalfY;
        }
    }

    /**
     * 开始动画
     * 不断绘制图像
     */
    animateParticles() {
        this.requestID = requestAnimationFrame(this.animateParticles.bind(this));
        this.renderAnimation();
    }

    /**
     * 更新橙色光束的绘制方法
     */
    updateLightbar(){
        let self=this
        this.materialLight = new THREE.SpriteCanvasMaterial({
            color: '#F28321',    //粒子的颜色
            program: function(context) {    //用于绘制粒子的方法
                context.drawImage(self.lightbars[Math.floor(self.count*10%self.lightbars.length)],-0.045,0,0.09,0.42)  
            }
        })
    }

    /**
     * 重复调用以渲染出粒子动画。绘制下一帧中粒子位置和大小。
     */
    renderAnimation() {
        //调整相机位置
        this.camera.position.x += (this.mouseX - this.camera.position.x) * .05;
        this.camera.position.y += (-this.mouseY - this.camera.position.y) * .05;
        this.camera.lookAt(this.scene.position);


        let self=this
        let i = 0;
        let particle;
        if(this.indices.length){    //如果存在橙色光束
            this.updateLightbar()   //修改橙色光束动画对应图片
        }

        //设置粒子新的位置和大小
        for (var ix = 0; ix < this.AMOUNTX; ix++) {
            for (var iy = 0; iy < this.AMOUNTY; iy++) {
                particle = this.particles[i];

                if (self.indices.length && self.indices.indexOf(i) !== -1){ //如果是橙色光束
                    particle.material = self.materialLight  //改变material，即改变绘制的图片
                }                              

                //更新粒子位置
                particle.position.y = (Math.sin((ix + this.count) * 0.3) * 50) + (Math.sin((iy + this.count) * 0.5) * 50);
                //更新粒子大小
                particle.scale.x =  particle.scale.y = particle.scale.z  = ( (Math.sin((ix + this.count) * 0.3) + 1) * 4 + (Math.sin((iy + this.count) * 0.5) + 1) * 4 )*100;

                i++;  
            }

        }
        this.renderer.render(this.scene, this.camera);  //渲染粒子动画
        //根据此参数调节粒子位置和大小。
        this.count += 0.1;
    }

    /* =======================================粒子动画 END============================================= */

    /* =======================================页面中间鼠标悬停触发tooltip START============================================= */

    /**
     * 判断新的坐标生成的触发区域是否会跟已创建的坐标有交集
     * @param {*} coordinate 要判断的坐标
     * @param {*} coordinates 已创建的坐标
     * @param {*} rectWidth 区域宽度
     * @param {*} rectHeight 区域高度
     */
    isAreaIntersected(coordinate,coordinates,rectWidth,rectHeight){
        //避免生成的区域有交集
        for (let i=0;i<coordinates.length;i++){
            if(coordinate.x >= coordinates[i].x-rectWidth && coordinate.x <= coordinates[i].x+rectWidth && coordinate.y >= coordinates[i].y-rectHeight && coordinate.y <= coordinates[i].y+rectHeight){   //如果跟已生成的区域有交集
                return true
            }
        }
        return false    //无交集
    }

    /**
     * 当鼠标进入面板中央的互动区域时的操作
     * 随机生成鼠标悬停触发区
     */
    onEnterInteractionArea(){  
        if(this.state.unhealthyHost){ //如果存在非正常主机
            //获取互动区域的宽高。
            var width = parseInt($(".interaction-area").css("width"))
            var height = parseInt($(".interaction-area").css("height"))/2   //显示在上半部分区域

            //随机生成鼠标悬停事件触发区
            var rectWidth = 66,rectHeight = 66 //触发区域大小
            //个数随机，但不多于5个
            var numRect
            if(this.state.unhealthyHost.length <5){
                numRect = Math.ceil(Math.random()*this.state.unhealthyHost.length) //1～5个
            }else{
                numRect = Math.ceil(Math.random()*5) //1～5个
            }
            //位置随机
            var coordinates = new Array()
            for (var i=0;i<numRect;i++){
                var coor = {
                    x:Math.floor(Math.random()*(width - rectWidth)),
                    y:Math.floor(Math.random()*(height - rectHeight))
                }
                while(this.isAreaIntersected(coor,coordinates,rectWidth,rectHeight)){   //如果跟已创建的区域会有交集，重新生成随机坐标
                    coor = {
                        x:Math.floor(Math.random()*(width - rectWidth)),
                        y:Math.floor(Math.random()*(height - rectHeight))
                    }
                }
                coordinates.push(coor)
            }

            //根据生成的随机坐标，创建触发区节点
            for (var j=0;j<numRect;j++){
                let dom = document.createElement("div")
                dom.setAttribute("id","area"+j)
                dom.setAttribute("class","hover-area")
                dom.setAttribute("style","position:absolute;"
                + "width:"+rectWidth+"px;" 
                + "height:"+rectHeight+"px;" 
                + "left:"+coordinates[j].x+"px;" 
                + "top:"+coordinates[j].y+"px;"
                + "background:transparent url(static/img/ring.gif) no-repeat center;"
                + "background-size:"+rectWidth+"px;"
                + "display:none;" )    //先隐藏，之后再淡入

                //添加元素节点到所属父节点
                dom.appendChild(document.createElement("div"))
                $(".interaction-area").append(dom)  //添加到互动区域 

                //淡入显示触发区
                $("#area"+j).fadeIn()   
            }       
            
            //选取对应随机个数的数据显示到tooltip窗口中
            var self = this
            let randomIndex = new Array()   //随机生成的在this.state.unhealthyHost中的索引
            for (let r=0;r<numRect;r++){
                let temp=Math.floor(Math.random * self.state.unhealthyHost.length)
                while(randomIndex.indexOf(temp)!=-1){
                    temp=Math.floor(Math.random * self.state.unhealthyHost.length)
                }
                randomIndex.push(temp)
            }
            //添加触发区的hover事件监听
            $(".hover-area").each(function(index,ele){
                let tooltipEl = document.getElementById("customTooltip")            
                $(this).hover(function(){   //鼠标进入时显示tooltip
                    //显示对应的数据
                    self.setState({
                        tooltip:self.state.unhealthyHost[index],
                        isTooltipProtectOn: self.state.unhealthyHost[index].is_protect==0,    //is_protect： 0表示受到防护，1表示未受到防护
                        isTooltipBlockOn: self.state.unhealthyHost[index].is_block==0     //is_block：0表示阻断，1表示未阻断
                    })

                    //设置tooltip窗口的位置
                    let tooltipHeight = tooltipEl.clientHeight  //获得tooltip窗口的实际高度
                    tooltipEl.style.zIndex=1000      //恢复层级              
                    tooltipEl.style.left = coordinates[index].x+"px"
                    //默认tooltip显示在触发区下方，空间不足时显示在上方
                    // if(coordinates[index].y + rectHeight + tooltipHeight > height){ //如果触发区下方空间不足够显示完整的tooltip
                    //     tooltipEl.style.top = coordinates[index].y-tooltipHeight+"px"
                    // }else{  //正常情况下tooltip显示在触发区下方
                        tooltipEl.style.top = coordinates[index].y+rectHeight+"px"               
                    // }
                    //显示tooltip窗口（默认opacity为0,能通过clientHeight获取实际高度。display:none时，无法通过clientHeight获取实际高度）
                    tooltipEl.style.opacity=1   
                },function(){   //鼠标离开触发区时
                    //判断鼠标离开触发方块后，是否进入了tooltip窗口
                    //不使用$("#customTooltip").is(":hover")，因为IE和firefox不兼容。
                    //因此使用全局变量 this.isTooltipHovered，并结合tooltip窗口的 onmouseenter 和 onmouseleave 事件，
                    //来判断鼠标是否悬停在tooltip窗口，并
                    setTimeout(() => {
                        if(self.isTooltipHovered){  //如果鼠标悬停在tooltip窗口上
                            $("#customTooltip").mouseleave(function(){  //设置tooltip窗口对mouseleave事件的监听
                                tooltipEl.style.opacity=0
                                tooltipEl.style.zIndex=-1   //隐藏时修改窗口的层级。避免挡在触发区前，使得无法触发hover事件。
                            })
                        }else{  //如果没有悬停子啊tooltip窗口，则隐藏tooltip
                            tooltipEl.style.opacity=0
                            tooltipEl.style.zIndex=-1   //隐藏时修改窗口的层级。避免挡在触发区前，使得无法触发hover事件。                  
                        }  
                    }, 1);  //设置延时的目的，让$("#customTooltip")窗口的 onmouseenter 事件处理方法执行完。否则 self.isTooltipHovered 来不及修改。
                                      
                })
            }) 
        }     
    }
    
    /**
     * 当鼠标离开面板中央的互动区域时的操作
     * 移除鼠标悬停触发区域
     */
    onLeaveInteractionArea(){
        $(".hover-area").each(function(){   //移除鼠标悬停触发区域
            $(this).remove();
        })
    }

    /* =======================================页面中间鼠标悬停触发tooltip END============================================= */

    /* =====================================================提示信息弹框============================================= */
    /**
     * 消息弹出框的按钮点击事件的监听
     */
    handleConfirmMsgBox(){
        this.setState({     
            showMsgBox:false,
        })
    }

    render() {
        let self=this
        let alarmType=["waf","audit","trustlog","eagle","杀毒"]
        return (
            <div className="target-range clearfix" >
                <div id="particlesContainer"></div>                                
                <div className="left-content-container">
                    {/*<div className="company">*/}
                        {/*<img src={require("../img/small-logo.png")} alt="" className="small-logo"/>*/}
                        {/*<p className="copyright">© 2014-2020 Octa Innovations. All rights reserved.</p>*/}
                    {/*</div>*/}
                    <section className="parameters">
                        <div className="parameter">
                            <div className="corner-box">
                                <div>
                                    <div className="title">
                                        <p>IPV4流入流量</p>
                                    </div>
                                    <div className="value">
                                        <div>{this.state.systemInfo && this.formatNumber(parseFloat(this.state.systemInfo.network_in))}</div>
                                        <div>
                                            <p className="unity">KB/s</p>
                                            {this.formerSystemInfo && this.state.systemInfo ?                               
                                                this.state.systemInfo.network_in-this.formerSystemInfo.network_in>=0?
                                                    <p className="percentage">
                                                        <i className="fa fa-arrow-alt-circle-up"></i>
                                                        {this.formatNumber(this.state.systemInfo.network_in-this.formerSystemInfo.network_in)}
                                                    </p>
                                                    :
                                                    <p className="percentage">
                                                        <i className="fa fa-arrow-alt-circle-down"></i>
                                                        {this.formatNumber(this.formerSystemInfo.network_in-this.state.systemInfo.network_in)}
                                                    </p>
      
                                                :<p className="percentage"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                            }                                           
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="parameter">
                            <div className="corner-box">
                                <div>
                                    <div className="title">
                                        <p>IPV4流出流量</p>
                                    </div>
                                    <div className="value">
                                        <div>{this.state.systemInfo && this.formatNumber(parseFloat(this.state.systemInfo.network_out))}</div>
                                        <div>
                                            <p className="unity">KB/s</p>
                                            {this.formerSystemInfo && this.state.systemInfo?                               
                                                this.state.systemInfo.network_out-this.formerSystemInfo.network_out>=0?
                                                    <p className="percentage">
                                                        <i className="fa fa-arrow-alt-circle-up"></i>
                                                        {this.formatNumber(this.state.systemInfo.network_out-this.formerSystemInfo.network_out)}
                                                    </p>
                                                    :
                                                    <p className="percentage">
                                                        <i className="fa fa-arrow-alt-circle-down"></i>
                                                        {this.formatNumber(this.formerSystemInfo.network_out-this.state.systemInfo.network_out)}
                                                    </p>
      
                                                :<p className="percentage"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                            } 
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="parameter">
                            <div className="corner-box">
                                <div>
                                    <div className="title">
                                        <p>SWAP利用率</p>
                                    </div>
                                    <div className="value">
                                        <div>{this.state.systemInfo && this.formatNumber(this.state.systemInfo.used_swap_pct*100)}</div>
                                        <div>
                                            <p className="unity">%</p>
                                            {this.formerSystemInfo && this.state.systemInfo?                               
                                                this.state.systemInfo.used_swap_pct-this.formerSystemInfo.used_swap_pct>=0?
                                                    <p className="percentage">
                                                        <i className="fa fa-arrow-alt-circle-up"></i>
                                                        {this.formatNumber(this.state.systemInfo.used_swap_pct*100-this.formerSystemInfo.used_swap_pct*100)}
                                                    </p>
                                                    :
                                                    <p className="percentage">
                                                        <i className="fa fa-arrow-alt-circle-down"></i>
                                                        {this.formatNumber(this.formerSystemInfo.used_swap_pct*100-this.state.systemInfo.used_swap_pct*100)}
                                                    </p>
      
                                                :<p className="percentage"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="parameter">
                            <div className="corner-box">
                                <div>
                                    <div className="title">
                                        <p>进程总数</p>
                                    </div>
                                    <div className="value">
                                        <div>{this.state.systemInfo && this.formatNumber(parseInt(this.state.systemInfo.process_nums))}</div>
                                        <div>
                                            <p className="unity">个</p>
                                            {this.formerSystemInfo && this.state.systemInfo?                               
                                                this.state.systemInfo.process_nums-this.formerSystemInfo.process_nums>=0?
                                                    <p className="percentage">
                                                        <i className="fa fa-arrow-alt-circle-up"></i>
                                                        {this.formatNumber(this.state.systemInfo.process_nums-this.formerSystemInfo.process_nums)}
                                                    </p>
                                                    :
                                                    <p className="percentage">
                                                        <i className="fa fa-arrow-alt-circle-down"></i>
                                                        {this.formatNumber(this.formerSystemInfo.process_nums-this.state.systemInfo.process_nums)}
                                                    </p>
      
                                                :<p className="percentage"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="parameter">
                            <div className="corner-box">
                                <div>
                                    <div className="title">
                                        <p>读写数量</p>
                                    </div>
                                    <div className="value">
                                        <div>{this.state.systemInfo && this.formatNumber(this.state.systemInfo.read_write_count)}</div>
                                        <div>
                                            <p className="unity">个/s</p>
                                            {this.formerSystemInfo && this.state.systemInfo?                               
                                                this.state.systemInfo.read_write_count-this.formerSystemInfo.read_write_count>=0?
                                                    <p className="percentage">
                                                        <i className="fa fa-arrow-alt-circle-up"></i>
                                                        {this.formatNumber(this.state.systemInfo.read_write_count-this.formerSystemInfo.read_write_count)}
                                                    </p>
                                                    :
                                                    <p className="percentage">
                                                        <i className="fa fa-arrow-alt-circle-down"></i>
                                                        {this.formatNumber(this.formerSystemInfo.read_write_count-this.state.systemInfo.read_write_count)}
                                                    </p>
      
                                                :<p className="percentage"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="parameter">
                            <div className="corner-box">
                                <div>
                                    <div className="title">
                                        <p>vda</p>
                                    </div>
                                    <div className="value">
                                        <div>{this.state.systemInfo && this.formatNumber(parseFloat(this.state.systemInfo.vda))}</div>
                                        <div>
                                            <p className="unity">KB/s</p>
                                            {this.formerSystemInfo && this.state.systemInfo?                               
                                                this.state.systemInfo.vda-this.formerSystemInfo.vda>=0?
                                                    <p className="percentage">
                                                        <i className="fa fa-arrow-alt-circle-up"></i>
                                                        {this.formatNumber(this.state.systemInfo.vda-this.formerSystemInfo.vda)}
                                                    </p>
                                                    :
                                                    <p className="percentage">
                                                        <i className="fa fa-arrow-alt-circle-down"></i>
                                                        {this.formatNumber(this.formerSystemInfo.vda-this.state.systemInfo.vda)}
                                                    </p>
      
                                                :<p className="percentage"><i className="fa fa-arrow-alt-circle-up"></i>0</p>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="corner-box">
                        <div className="scroll-table">                            
                            {/* 固定表头 */}
                            <table>
                                <thead>
                                <tr>
                                    <th>主机名</th>
                                    <th>IP地址</th>
                                    <th>状态</th>
                                    <th>描述</th>
                                </tr>
                                </thead>
                            </table>
                            {/* 可滚动的表身 */}
                            {
                                this.state.msgProtectedHost? 
                                <p className="hint-message">{this.state.msgProtectedHost}</p>
                                :
                                <div className="scroll-box">
                                    <table>
                                        <tbody>
                                        {
                                            
                                            // this.state.protectedHosts &&
                                            this.state.protectedHosts.map(function(data,index){
                                                return (

                                                    <tr key={"scroll-table-1-"+index}>
                                                        <td>{data.hostname}</td>
                                                        <td>{data.hostip}</td>
                                                        <td>{data.status===0?"保护中":"暂未保护"}</td>
                                                        <td>{data.description}</td>
                                                    </tr>
                                                )
                                            })
                                        }
                                        </tbody>
                                    </table>
                                </div>
                            }
                        </div>
                    </section>  
                </div>  
                <div className="healthy-percentage">
                    <p className="title">{this.state.unhealthyHost && this.state.unhealthyHost.length?"异常主机个数":"当前状态"}</p>
                    <p className="value">{this.state.unhealthyHost && this.state.unhealthyHost.length? (this.state.unhealthyHost.length): "正常" }</p>
                </div>                            
                <div className="background-container-header"></div>
                <div className="background-container-bottom">
                    <div className="left"></div>
                    <div className="center"></div>
                    <div className="right"></div>
                </div>
                <div className="background-container-right-top"></div>
                <div className="background-container-right-mid"></div>
                <div className="background-container-right-bottom"></div>
                <div className="right-content-container">
                    <section className="corner-box table">
                        <div className="scroll-table">
                            
                            {/* 固定表头 */}
                            <table>
                                <thead>
                                <tr>
                                    <th>主机名</th>
                                    <th>IP地址</th>                                  
                                </tr>
                                </thead>
                            </table>
                            {/* 可滚动的表身 */}
                            {
                                this.state.msgAllHost ? <p className="hint-message" >{this.state.msgAllHost}</p> :                           
                                <div className="scroll-box">
                                    <table>
                                        <tbody>
                                        {
                                            this.state.unhealthyHost && this.state.unhealthyHost.map(function(data,index,arr){
                                                if(index == arr.length-1){
                                                    return (                                                
                                                        <tr className="problem-log last" onClick={self.onSelectHost.bind(self,data)} key={"scroll-table-2-problem-"+index}>
                                                            <td>{data.name}</td>
                                                            <td>{data.ip}</td>
                                                        </tr>
                                                    )  
                                                }
                                                return (                                                
                                                    <tr className="problem-log" onClick={self.onSelectHost.bind(self,data)} key={"scroll-table-2-problem-"+index}>
                                                        <td>{data.name}</td>
                                                        <td>{data.ip}</td>
                                                    </tr>
                                                )
                                            })
                                        }
                                        {
                                            this.state.healthyHost.map(function(data,index){
                                                return (
                                                    <tr onClick={self.onSelectHost.bind(self,data)} key={"scroll-table-2-"+index}>
                                                        <td>{data.name}</td>
                                                        <td>{data.ip}</td>
                                                    </tr>
                                                )
                                            })
                                        }
                                        </tbody>
                                    </table>
                                </div>
                            }
                        </div>
                    </section>  
                    <section className="charts">
                        <div id="hostInfoBox" className="host-info">
                            <div className="corner-box">
                                <div>
                                    <img src={require("../img/server.png")} alt=""/> 
                                    <div className="host-detail">
                                        <p className="host-name">{this.state.selectedHost && this.state.selectedHost.name}</p>
                                        <div className="host-ip"><p>{this.state.selectedHost && this.state.selectedHost.ip}</p></div>
                                        <div className="label-btn">
                                            <label>可信防护：</label>
                                            <ToggleButton 
                                            checkboxID="protectBtn" 
                                            isOn={this.state.isProtectOn} 
                                            handleChange={this.changeProtectState.bind(this,"protectBtn",this.state.selectedHost,false)} />
                                        </div>
                                        <div className="label-btn">
                                            <label>可信阻断：</label>
                                            <ToggleButton 
                                            checkboxID="blockBtn" 
                                            isOn={this.state.isBlockOn} 
                                            handleChange={this.changeBlockState.bind(this,"blockBtn",this.state.selectedHost,false)} />
                                        </div>                                        
                                    </div>                                   
                                </div>
                            </div>
                        </div>
                        <div className="host-info-extra">
                            <div className="title">
                                <p>异常问题</p>                            
                            </div>
                            <div className="content">
                                <dl>
                                    <dt>异常ip：</dt>
                                    {
                                        this.state.selectedHost &&
                                        <dd>{this.state.selectedHost.status==0 ? "无异常": this.state.selectedHost.ip}</dd>
                                    }
                                </dl>
                                <dl>
                                    <dt>异常进程或文件：</dt>
                                    {
                                        this.state.selectedHost &&
                                        (
                                            this.state.selectedHost.status==0 ? 
                                            <dd>无异常</dd>: 
                                            <dd title={this.state.selectedHost.file_error_path} >{this.state.selectedHost.file_error_path}</dd>
                                        )
                                    }
                                </dl>
                                <dl>
                                    <dt>异常哈希：</dt>
                                    {
                                        this.state.selectedHost &&
                                        <dd>{this.state.selectedHost.status==0 ? "无异常": this.state.selectedHost.file_error_hash}</dd>
                                    }
                                </dl>
                            </div>
                            <button className="btn btn-default btn-mark" onClick={this.markWarning.bind(this)}>标为误报</button>
                        </div>
                        <div id="linechart" className="line-chart"></div>
                        <div className="gauge-1" >
                            <DynamicGauge 
                            svgid="gaugeCPU" 
                            title="CPU占用率" 
                            unity="%" 
                            svgWidth={75}
                            value={this.state.systemInfo?(this.state.systemInfo.used_cpu_pct*100).toFixed(2):0} 
                            percentage={this.state.systemInfo ?this.state.systemInfo.used_cpu_pct:0} />
                        </div>
                        <div className="gauge-2">
                            <DynamicGauge 
                            svgid="gaugeMem" 
                            title="内存占用率" 
                            unity="%" 
                            svgWidth={75}
                            
                            value={this.state.systemInfo?(this.state.systemInfo.used_mem_pct*100).toFixed(2):0} 
                            percentage={this.state.systemInfo ? this.state.systemInfo.used_mem_pct:0} />                        
                        </div>
                        <div className="gauge-3">
                            <DynamicGauge 
                            svgid="gaugeIO" 
                            title="IO读写" 
                            unity="KB/s"
                            svgWidth={75}                            
                            value={this.state.systemInfo?(parseFloat(this.state.systemInfo.disk_read) + parseFloat(this.state.systemInfo.disk_write)).toFixed(2):0} 
                            percentage={this.state.systemInfo?(this.state.systemInfo.disk_read/1024/5 + this.state.systemInfo.disk_write/1024/5):0}/>                        
                        </div>
                    </section> 
                    <div className="information">
                        <div className="corner-box">
                            <div id="scrollHostLog">
                            {
                                    this.state.msgDetailLog?<p>{this.state.msgDetailLog}</p>:
                                    <div className="log-box">
                                    {this.state.detailLog.map(function(log,index){
                                        return <p key={"log-"+index}>{log}</p>
                                    })}
                                    </div>  
                                }
                            </div>
                        </div>
                    </div>                
                </div>  
                <div className="interaction-area">
                    {/* 鼠标悬停在触发区时显示的信息 */}
                    <div id="customTooltip" className="tooltip-box" >
                        <div className="host-info">
                            <div className="corner-box">
                                <div>
                                    <img src={require("../img/server.png")} alt=""/> 
                                    <div className="host-detail">
                                        <p className="host-name">{this.state.tooltip&&this.state.tooltip.name}</p>
                                        <div className="host-ip"><p>{this.state.tooltip&&this.state.tooltip.ip}</p></div>
                                        <div className="label-btn">
                                            <label>可信防护：</label>
                                            <ToggleButton 
                                            checkboxID="protectBtnInTooltip" 
                                            isOn={this.state.isTooltipProtectOn} 
                                            handleChange={this.changeProtectState.bind(this,'protectBtnInTooltip',this.state.tooltip,true)} />
                                        </div>
                                        <div className="label-btn">
                                            <label>可信阻断：</label>
                                            <ToggleButton 
                                            checkboxID="blockBtnInTooltip" 
                                            isOn={this.state.isTooltipBlockOn} 
                                            handleChange={this.changeBlockState.bind(this,'blockBtnInTooltip',this.state.tooltip,true)} />
                                        </div>
                                    </div>                                   
                                </div>
                            </div>
                        </div>
                        <div className="host-info-extra">
                            <div className="title">
                                <p>异常问题</p>                            
                            </div>
                            <div className="content">
                                <dl>
                                    <dt>异常ip：</dt>
                                    <dd>{this.state.tooltip && this.state.tooltip.ip}</dd>
                                </dl>
                                <dl>
                                    <dt>异常进程或文件：</dt>
                                    {
                                        this.state.tooltip &&
                                            <dd title={this.state.tooltip.file_error_path}>{this.state.tooltip.file_error_path}</dd>
                                    }
                                </dl>
                                <dl>
                                    <dt>异常哈希：</dt>
                                    <dd>{this.state.tooltip && this.state.tooltip.file_error_hash}</dd>
                                </dl>
                            </div>
                            <button className="btn btn-default btn-mark" onClick={this.markWarning.bind(this)}>标为误报</button>
                        </div>
                    </div>
                </div> 
                {/*消息提示框*/}
                <MessageBox
                    showMsgBox = { this.state.showMsgBox }
                    msgContent = { this.state.msgContent }
                    msgButtonState = { this.state.msgButtonState }
                    msgButtonName = { this.state.msgButtonName }
                    handleConfirmMsgBox = { this.handleConfirmMsgBox.bind(this)}
                />          
            </div>
        )
    }
}