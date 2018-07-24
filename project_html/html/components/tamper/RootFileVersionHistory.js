import React from "react";
import {Pagination} from 'react-bootstrap';
import $ from 'jquery';
import TamperLoading from './TamperLoading.js'
import LoadingText from "../Commonality/LoadingText";
export default class RootFileVersionHistory extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentListPageNum:1,//当前页码
            dataListAllPage:1,//总页码
            versionHistoryList:false,//初始化版本历史信息列表
        }
    };
    componentWillMount() {
        let len = this.props.versionHistoryMsg.data.length
        let pageNum = (len % 6 == 0)?len/6:(parseInt(len/6)+1)
        this.setState({
            dataListAllPage:pageNum,//设置页码
            versionHistoryList:this.props.versionHistoryMsg.data.slice(0,6)//截取前6组数据，写入页面
        })
    }
    /*
    点击页码
    * */
    handleChangePage(eventKey){
        this.setState({
            currentListPageNum:eventKey,
            versionHistoryList:this.props.versionHistoryMsg.data.slice((eventKey-1)*6,eventKey*6) //根据当前页码数，截取根目录版本信息列表的某一页
        })
    }
    //页码输入处理
    handleEnterPage(e) {
        var re = /^[0-9]+$/;
        var indexCurrent = parseInt($(e.target).val())
        if (!re.test($(e.target).val())) {
            $(e.target).val('')
        }
        if (indexCurrent > this.state.dataListAllPage) {
            $(e.target).val(this.state.dataListAllPage)
        }
        if (indexCurrent <= 0) {
            $(e.target).val('')
        }
        if (e.keyCode == 13 && re.test($(e.target).val())) {    // 分页input回车
            this.setState({
                currentListPageNum: indexCurrent,
                versionHistoryList:this.props.versionHistoryMsg.data.slice((indexCurrent-1)*6,indexCurrent*6) //根据当前页码数，截取根目录版本信息列表的某一页
            })
            $(e.target).val('') //清空所填写的页码
        }
    }
    /*
     * 点击页码跳转按钮
     * */
    handleJumpPage(){
        var indexCurrent = parseInt($('.versionHistoryPageNum').val())
        this.setState({
            currentListPageNum: indexCurrent,
            versionHistoryList:this.props.versionHistoryMsg.data.slice((indexCurrent-1)*6,indexCurrent*6) //根据当前页码数，截取根目录版本信息列表的某一页
        })
        $('.versionHistoryPageNum').val('') //清空所填写的页码
    }
    componentDidMount() {
    }
    render() {
        return (
        <div className="BackVersionBox version-msg-list">
            <div className="back-version-content" style={{height:'610px',margin: '-305px 0 0 -330px'}}>
                <h2 className="back-v-title clearfix">根目录<b>{this.props.versionHistoryMsg.name}</b>
                    <i className="close-icon" onClick={this.props.handleCloseVersionHistory.bind(this)}>×</i></h2>
                {/*<h3 className="pathName">Path : {this.props.versionHistoryMsg.path}</h3>*/}
                <div className="versionTabContainer">
                    <table className="databaseHostList ">
                        <thead>
                        <tr>
                            <th>版本编号</th>
                            <th>变更类型</th>
                            <th>版本生成时间</th>
                            <th>操作用户</th>
                            <th>回滚</th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                            !this.state.versionHistoryList&&
                            <LoadingText/>
                        }
                        {
                            this.props.versionHistoryBox&&
                            this.state.versionHistoryList.map((data,index)=>{
                                return(
                                    <tr key={index}>
                                        <td className="singleTab">{data.id}</td>
                                        <td>{data.operate_type}</td>
                                        <td>{data.timestamp}</td>
                                        <td>{data.operate_username}</td>
                                        <td><button className="plugAction showHistoryVersion"
                                                    onClick={this.props.backThisVersion.bind(this,
                                                        'token',data.operate_username,data.protect_host_name,data.protect_root_path,data.version_txid
                                                    )}>回滚到此版本</button></td>
                                    </tr>
                                )
                            })
                        }
                        </tbody>
                    </table>
                </div>
                <div className="pagination-all">
                    <Pagination prev={true} next={true} first={false} last={false} ellipsis={true} boundaryLinks={true}
                                items={this.state.dataListAllPage}
                                activePage={this.state.currentListPageNum} maxButtons={7}
                                onSelect={this.handleChangePage.bind(this)}
                    />
                    <div className="pageCount">
                        <input className="pageNum versionHistoryPageNum" placeholder="输入"
                               onKeyUp={this.handleEnterPage.bind(this)} onKeyDown={this.handleEnterPage.bind(this)}
                        />
                        <img className="searchNum"　src='/static/img/skip.svg' onClick={this.handleJumpPage.bind(this)}/>
                    </div>
                </div>
                <p className="errorMsg">{this.props.errorMsg}</p>
            </div>
            {
                this.props.tamperLoadingBox &&
                <TamperLoading progressTime = {this.props.progressTime}/>
            }
        </div>
        )
    }
}