import React from "react";
import $ from 'jquery';
import LoadingText from "../Commonality/LoadingText";

/* 区块链页面中的列表组件 */
export default class BlockchainList extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            chainListDetail:false//区块链列表数据初始化
        }
    }
    onLoad(ele){
        // 循环生成圆形占比图
        var radialIndicator = window.radialIndicator;
            var len = $(ele).length;
            // console.log(len)
            for(var i = 0;i<len;i++){
                var list = $(ele)[i]
                radialIndicator(
                    $(list),
                    {initValue: $(list).attr('name') }
                )
            }
    }
    loadChainDetail(){
        var self  = this;
        $.ajax({
                url: '/api/chain/node_details/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                success: function (data) {
                    // console.log(JSON.stringify(data.members))
                    self.setState({
                        chainListDetail:data.members//设置区块链列表数据
                    })
                    //绘制cavans,内存,cpu等百分比
                    self.onLoad($('.dataList-content .roundPercent'));
                }
        })
    }
    componentDidMount(){
        this.loadChainDetail()
    }
    render(){
        return (
            <div>

                <div className="datalistTitle">
                    <table className="databaseHostList">
                    <thead>
                    <tr>
                        <th>主机IP</th>
                        {/*<th>运行时间</th>*/}
                        <th>内存占用</th>
                        <th>CPU占用</th>
                        <th>连接数</th>
                        <th>流入</th>
                        <th>流出</th>
                    </tr>
                    </thead>
                    </table>
                </div>

                {
                    !this.state.chainListDetail&&
                    <LoadingText/>
                }
                {
                    this.state.chainListDetail &&
                    this.state.chainListDetail.map(function(data,index){
                        return (
                             <div className="dataList-content" key = {index} >
                                <table className="databaseHostList">
                                <tbody>
                                    <tr>
                                        <td className="singleTab">{data.host_ip}</td>
                                        {/*<td>{data.runtime}</td>*/}
                                        <td>
                                            <div className="roundPercent" name={parseInt(data.mem_pct*100)}></div>
                                        </td>
                                        <td>
                                            <div className="roundPercent" name={parseInt(data.cpu_pct*100)}></div>
                                        </td>
                                        <td>
                                            <div className="roundPercent" name={parseInt(data.connections*100)}></div>
                                        </td>
                                        <td>{data.received} KB</td>
                                        <td>{data.sent} KB</td>
                                    </tr>
                                </tbody>
                                </table>
                             </div>
                        )
                    })
                }
                {/*无页码
                
                <div className="pagination-all">
                    <Pagination prev={true} next={true} first={false} last={false} ellipsis={true} boundaryLinks={true} items={this.state.dataListAllPage} 
                    activePage={this.state.currentListPageNum} maxButtons={3} />
                    <div className="pageCount">
                        <input className="pageNum"  id = "pageJumpNum"placeholder="输入" />
                        <button className="searchNum" >跳转</button>
                    </div>
                </div>
                */}
            </div>
        )
    }
}





