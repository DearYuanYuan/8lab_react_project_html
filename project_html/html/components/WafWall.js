import React from "react"
import $ from "jquery";
import echarts from "echarts"
import WafBoxSet from "./wafWall/WafBoxSet"
import Typeattack from "./wafWall/Typeattack"
import Radarchart from "./wafWall/Radarchart"
import Totalattack from "./wafWall/Totalattack"
import Typeflow from "./wafWall/Typeflow"
import Orinalattack from "./wafWall/Orinalattack"
import Attackpart from "./wafWall/Attackpart"
import ListDate from "./wafWall/ListDate"
export default class WafWall extends React.Component {

    constructor(props) {
        super(props);
        this.state={
            showBox:false,//弹出框设置,默认不显示
            attackNum:0, //防御攻击的次数
            attackNumTotal:[0,0,0,0,0],//防御次数雷达图数据
            attackNumWeek:[[0,0,0,0,0,0,0,0],
                           [0,0,0,0,0,0,0,0],
                           [0,0,0,0,0,0,0,0]
                          ],//每日防御次数
            attackNumDays:{count:[0, 0, 0, 0, 0, 1550, 0, 0, 0, 0],
                date:["周一", "周二", "周三", "周四", "周五", "周六", "周日", "周一", "周二", "周三"],
                limit:100},//初始化每日攻击次数
            attackNumCity:
                {count: [1], name: ["无"]}//初始化攻击来源
        }
    }
    statePageAjax() {
        var self = this;
        $.ajax({
            url: '/api/statefile/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function (data) {//发送成功
                //data.unrecognized:无法识别的文件
                //data.intercepted:防御攻击的次数
                self.setState({attackNum: data.intercepted});
            }
        });
    }
    wafDataAjax(){
        var self = this;
        $.ajax({
            url: '/api/wf/home/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function (data) {//发送成功
                    // console.log(JSON.stringify(data))
                    
                self.setState({
                    attackNumTotal:[
                                    data.total["dos-attack"],
                                    data.total["web-attack"],
                                    data.total["identification-error"],
                                    data.total["sensitive-data-tracking"],
                                    data.total["http-defense"],
                    ],
                    // attackNumTotal:[
                    //     data.total["dos-attack"]==0?'0':data.total["dos-attack"],
                    //     data.total["web-attack"]==0?'0':data.total["web-attack"],
                    //     data.total["identification-error"]==0?'0':data.total["identification-error"],
                    //     data.total["sensitive-data-tracking"]==0?'0':data.total["sensitive-data-tracking"],
                    //     data.total["http-defense"]==0?'0':data.total["http-defense"]
                    // ],
                    attackNumWeek:[
                                    data.week["http-defense"],
                                    data.week["dos-attack"],
                                    data.week["web-attack"],
                                    data.week["sensitive-data-tracking"],
                                    data.week["identification-error"],
                    ],
                    attackNumDays:[
                                    data.days.count,
                                    data.days.limit,
                                    data.days.date
                    ],
                    attackNumCity:data.city
                })
                
            }
        });
    }
    // 防御设置按钮点击，防御设置box显示
   handleOpenSet(e){
        this.setState({
            showBox:!this.state.showBox
        });
        e.stopPropagation();
   }
    //在防御设置box外的，点击鼠标，防御设置box隐藏   
   handleCloseSet(e){
         this.setState({
            showBox:false
        });
        e.stopPropagation();
    }
    componentWillMount(){
        // 调用，获取页面echarts所需的数据
        this.wafDataAjax()
    }
    componentDidMount(){
        //修改页面title
        document.title = 'waf防火墙'
        // 调用，获取拦截威胁数据
        this.statePageAjax();

        $(window).resize(function(){
            //窗口大小改变，图表自适应
            var chartAttack = echarts.init(document.getElementById('attackchart'));
            chartAttack.resize({
                width:chartAttack.clientWidth
            })
            var chartOrigin = echarts.init(document.getElementById('first-chart'));
            chartOrigin.resize({
                width:chartOrigin.clientWidth
            })
            var chartRadar = echarts.init(document.getElementById('radarChart'));
            chartRadar.resize({
                width:chartRadar.clientWidth
            })
            var chartTotal = echarts.init(document.getElementById('Totalattack'));
            chartTotal.resize({
                width:chartTotal.clientWidth
            })
            var chartType = echarts.init(document.getElementById('typeAttack'));
            chartType.resize({
                width:chartType.clientWidth
            })
            var chartFlow = echarts.init(document.getElementById('typeflow'));
            chartFlow.resize({
                width:chartFlow.clientWidth
            })
        })
    }
   	
     render(){
 
         return(
            <div className="waf-container">
                <div className="waf-content" onClick = {this.handleCloseSet.bind(this)}>
                    <div className="waf-title clearfix">
                            <div className="left-part-icon">
                                <img src="/static/img/databaseAuditStatus.svg" /> 
                            </div>
                            <div className="right-part-msg">
                                <h3>WAF防火墙</h3>
                                <p>状态正常，目前已拦截威胁：<span>{this.state.attackNum}</span>个</p>
                            </div>
                            <button className="setDefense" onClick={this.handleOpenSet.bind(this)}>防护设置</button>
                    </div>
                    <div className="chartpartcover clearfix">
                        <div className="radarPart">
                            <h2 className="attackTitle">防御安全雷达图</h2>
                            <Radarchart attackNumTotal={this.state.attackNumTotal}/>
                        </div>
                        <div className="totalAttack">
                            <h2 className="attackTitle">每日拦截威胁次数</h2>
                            <ul className="attacktitlemenu">
                                <li className="attackMore"><span className="attackspan"></span>威胁数量过多</li>
                                <li className="attackNormal"><span className="attackspan"></span>常规威胁数量</li>
                            </ul>
                            <Totalattack attackNumDays = {this.state.attackNumDays}/>
                        </div>
                        <div className="typeAttack">
                            <h2 className="attackTitle">攻击类型统计</h2>
                            <Typeattack  attackNumWeek={this.state.attackNumWeek}/>
                        </div>
                        <div className="firstChartPart">
                            <h2 className="attackTitle">攻击来源占比</h2>
                            <Orinalattack attackNumCity = {this.state.attackNumCity}/>
                        </div>
                        <div className="attackPart">
                            <h2 className="attackTitle">威胁性占比</h2>
                            <Attackpart  attackNumTotal={this.state.attackNumTotal}/>
                        </div>
                        <div className="typeFlow">
                            <h2 className="attackTitle">网络流量</h2>
                            <Typeflow/>
                        </div>
                    </div>
                    <ListDate/>
                </div>
                <WafBoxSet showBox = {this.state.showBox}/>   
            </div>     
         )
     }
}






