import React from "react";
import $ from 'jquery';
import echarts from "echarts"
import LoadingText from "../Commonality/LoadingText";
export default class BlockchainChart extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            actualDeal:false,
            topPx:true,
            isIE11:false, //是否是IE11
        }
    };
    isIE11(){
        if((!!window.ActiveXObject || "ActiveXObject" in window) && navigator.userAgent.indexOf('rv:11.0')>-1){
            this.setState({
                isIE11:true,
            })
            return true
        }else{
            this.setState({
                isIE11:false,
            })
            return false
        }
    }
    loadChain(){
        var dataLines = [];//echart中ｄａｔａ来源
        var dataLinks = [];//echart中ｌｉｎｋ来源
        // var categories = [{name:'区块链'}]//echart中categories来源
        var myChart = echarts.init(document.getElementById('chain_box'));
        var rootSymbol = '';
        if(this.state.isIE11){
            rootSymbol = 'circle';
        }else{
            rootSymbol = 'image://static/img/blockChain/nodeicon.svg'
        }
        $.ajax({
            url: '/api/chain/node_ips/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function (data) {
                // console.log(JSON.stringify(data.members))

                /*测试多条数据
                 var data = {};
                 data.members = ['192.168.1.1','192.168.1.2','192.168.1.3','192.168.1.4','192.168.1.5','192.168.1.6','192.168.1.7',
                 '192.168.1.8','192.168.1.9','192.168.1.10','192.168.1.11','192.168.1.12','192.168.1.13','192.168.1.14',
                 '192.168.2.8','192.168.2.9','192.168.2.10','192.168.2.11','192.168.2.12','192.168.2.13','192.168.2.14']
                 */
                // 循环生成ｄａｔａ
                data.members.map(function(arr,i){
                    dataLines[i]={
                        id:i+1,
                        name:arr,
                        value:arr
                    }

                })
                // 循环生成ｌｉｎｋｓ
                function setLink(){
                    for(var i=0;i<data.members.length;i++){
                        for(var j = data.members.length-1;j>=0;j--){
                            if(i!=j){
                                dataLinks.push({"source": j,"target": i});
                            }
                        }
                    }
                    // console.log(dataLinks)
                }
                setLink();

                //echarts参数设置
                this.option = {
                    // title: {
                    //     text: '区块链拓扑图',
                    //     subtext: '区块链拓扑图',
                    //     top: 'bottom',
                    //     left: 'right'
                    // },
                    tooltip: {
                        // trigger: 'item',
                        // backgroundColor: '#444851'
                    },
                    legend: [{
                        // selectedMode: 'single',
                        // data: categories.map(function(a) {
                        //     return a.name;
                        // })
                    }],

                    animationDurationUpdate: 15000,
                    animationEasingUpdate: 'quinticInOut',
                    series: [{
                        name: '区块链拓扑图',
                        type: 'graph',
                        layout: 'circular',
                        circular: {
                            rotateLabel: true
                        },
                        grid:{
                            x:100,
                            y:20,
                            x2:20,
                            y2:20
                        },
                        // hoverAnimation:true,
                        focusNodeAdjacency:true,
                        "itemStyle": {
                            normal: {
                                color: '#979797',
                            }
                        },
                        "symbolSize": 40,

                        symbol: rootSymbol,
                        data:dataLines,
                        links:dataLinks,
                        roam: false,

                        label: {
                            normal: {
                                show: false, //控制图标数据不展示
                                position: 'left'
                            }
                        },
                        lineStyle: {
                            normal: {
                                color: 'source',
                                curveness: 0.3
                            }
                        }
                    }]
                };
                myChart.setOption(this.option);

            }
        })
    }
    changeList(){

        var self  = this;
        $.ajax({
            url: '/api/chain/query_trans_cu/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data:{
                page:1,
                page_size:10
            },
            success: function (data) {
                // console.log(JSON.stringify(data.data))
                var list = data.data||[]; //获取交易信息
                var arr = []; //初始化最终可以使用的数组
                list.forEach((result,index)=>{
                    //遍历每一组建议信息
                    var dealUsr = []; //初始化需要添加的项
                    if(result.detail.length>1){
                        //当交易项大于一条时，处理数组，形成发起方、终止方的数组
                        result.detail.map((deal,num)=>{
                            //循环每一个交易项的 detail
                            var trans = {}; //初始化需要加入数组的项
                            if(num == result.detail.length-1){
                                //当循环到最后一项时 跳出
                                return;
                                // trans.time = result.time;
                                // trans.start = deal.username;
                                // trans.end = result.detail[num-1].username;
                            }else{
                                //不是最后一项
                                trans.time = result.time;
                                trans.start = result.detail[num+1].username;
                                trans.end = deal.username;
                            }
                                //加入处理的对象
                            dealUsr.push(trans)

                        })
                    }else{
                        //当只有一个交易列表
                        //return;
                        dealUsr.push({
                            time : result.time,
                            start:result.detail[0].username,
                            end:'暂无转让'
                        })
                    }
                    //将处理后形成的数组加入到arr
                    arr.push(dealUsr)

                })

                // console.log(JSON.stringify(arr))

                var topPx = self.state.topPx

                self.setState({
                    actualDeal:arr,
                    topPx:!topPx
                })
            }
        })
    }
    componentWillMount(){
        this.isIE11()
    }
    componentDidMount(){
        this.loadChain();
        this.changeList();
        $(window).resize(function () {
            var myChart = echarts.init(document.getElementById('chain_box'));
            myChart.resize({
                width:myChart.clientWidth
            })
        })
    }
    componentWillUnmount(){
    }

    render() {

        return (
            <div className="clearfix">
                <div id="chain_box" style={{width:'60%',height:'600px',margin:'40px 0'}}>
                </div>
                <div className="actualTime">
                    <table>
                        <thead>
                        <tr>
                            <th>时间</th>
                            <th>发起方</th>
                            <th>接收方</th>
                        </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                    <div className="dealList-cover">
                        {
                            !this.state.actualDeal &&
                            <LoadingText/>
                        }
                        {
                            this.state.actualDeal && this.state.actualDeal.map(function(data,index){
                                // console.log(data)
                                return(
                                    <div key={index} className="dealUsrListMsg">
                                        {
                                            data.map(function(list,num){
                                                return(
                                                    <p key={num} className="clearfix">
                                                        <i>{list.time} </i>
                                                        <i>{list.start} </i>
                                                        <i>{list.end} </i>
                                                    </p>
                                                )

                                            })
                                        }
                                    </div>
                                )

                            })
                        }
                    </div>

                </div>
            </div>
        )
    }
}

// require('../../utils/dataTool.js')
/*区块链页面中的拓扑图组件*/
