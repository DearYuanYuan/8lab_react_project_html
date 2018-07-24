import React from "react";
import $ from 'jquery';
import {Pagination} from 'react-bootstrap';
import BackVersionBox from './BackVersionBox.js';
import ShowFilePath from './ShowFilePath.js';
import SVNVersionDetail from './SVNVersionDetail.js';
import LoadingText from "../Commonality/LoadingText";
export default class VersionMsg extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hostLists:false,//主机和根目录列表---左侧列表
            versionMsg: [],//主机根目录下所有版本信息---右侧列表
            versionPageMsg:false,//某一页主机根目录下的版本信息---右侧列表
            backVersionState: { version: '', time: '', action: '', filePath: '', mark: '' },//初始化版本信息
            showVersionBox: false, //版本回滚确认弹框
            backVersionParams:{"token": '', "username":'',"host_name":'',"root_path":'',"org_version_tx_id": ''},//版本回滚确定时向后台传参
            currentListPageNum: 1,
            dataListAllPage: 1,
            showFileBox: false, //查看版本信息弹框
            versionFilePathChange:[],//查看版本信息列表
            tamperLoadingBox:false,//ajax请求时，结果未返回时，显示loading效果
            showVersionDetailBox: false, //版本详情弹框
            versionDetailItem: {},
            versionDetailId: 0,
        }
    };
    /*
    * 点击主机，主机下拉列表展开或者收起
    * */
    handleToggleRootFile(index){
        $('.left-root-list-container').eq(index).find('.detail-toggle').slideToggle();
    }
    /*
     * 获取某一个主机下的某一个根目录下的版本信息列表
     * host_name--主机名
     * root_path---实际路径
     * */
    ajaxGetVersionMsg(host_name,root_path,fontPage,endPage){
        var self = this;
        self.setState({
            versionPageMsg:false,
        })
        $.ajax({
            url: '/api/tamper_proof/get_version_info/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data:{
                "service_type": "svn",
                'host_name': host_name,
                'root_path': root_path,
                token:this.props.tamperUsrToken
            },
            error:function () {
                self.setState({
                    versionPageMsg:[],
                })
            },
            success: function (data) {
                //console.log(data[0].result.length/10)
                self.setState({
                    versionMsg:data[0].result, //获取列表所有值
                    versionPageMsg:data[0].result.slice(fontPage,endPage), //获取第一页列表
                    dataListAllPage:(data[0].result.length % 10==0)?data[0].result.length/10:parseInt(data[0].result.length/10)+1,//获取页码数，每页10组数据
                })
            }
        })
    }
    /*
    * 获取主机以及根目录
    * */
    ajaxGetRootPath(){
        var self = this;
        $.ajax({
            url: '/api/tamper_proof/get_hosts_and_rootpaths/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data:{
                "service_type": "svn",
                username:this.props.tamperUsrName,
                is_super:this.props.tamperIsSuper,
                token:this.props.tamperUsrToken
            },
            error:function () {
                self.setState({
                    hostLists:[],
                    dataListAllPage:0,
                })
            },
            success: function (data) {
                //console.log(JSON.stringify(data))
                if(data.length==0||data[0].status=='FAILURE'){
                    self.setState({
                        hostLists:[],
                        versionMsg:[], //获取列表所有值
                        versionPageMsg:[], //获取第一页列表
                        dataListAllPage:0,
                    })
                }else{
                    self.setState({
                        hostLists:data
                    })
                    if(data[0].root_paths.length==0){
                        self.setState({
                            versionPageMsg:[],
                            dataListAllPage:0,
                        })
                        return;
                    }else{
                        self.ajaxGetVersionMsg(data[0].host,data[0].root_paths[0].protect_root_path,0,10) //获取第一个个主机根目录，根目录下的版本信息列表
                        $('.left-root-list-container').eq(0).find('p').eq(0).addClass('select-root')
                    }

                }

            }
        })
    }
    /*
    * 点击左侧主机下的根目录
    * */
    handleToggleRootFileVersion(index,rIndex,host,path){
        $('.left-root-list-container').eq(index).find('p').eq(rIndex).addClass('select-root')
        $('.left-root-list-container').eq(index).siblings().find('p').removeClass('select-root')
        $('.left-root-list-container').eq(index).find('p').eq(rIndex).siblings().removeClass('select-root')
        this.ajaxGetVersionMsg(host,path,0,10) //获取选择的主机根目录，根目录下的版本信息列表
    }
    /*
    * 点击列表，显示下拉内容
    * 传入index为列表的序号
    * */
    handleToggleMsg(index) {
        $('.dataList-content').eq(index).find('div.versionMsg').slideToggle(200)
    }
    /*
        *点击回滚到此版本
        ×传入的参数，版本编号、时间、类型、路径、备注信息
         "token": "trust2",//暂无
         "username": data.operate_username,
         "host_name": data.protect_host_name,
         "root_path": data.protect_root_path,
         "org_version_tx_id": data.version_txid
    */
    handleBackVersion(version, time, action, filePath, mark,token,username,host_name,tx_id) {
        //console.log([version,time,action,filePath,mark])
        this.setState({
            showVersionBox: true,
            backVersionState: { version: version, time: time, action: action, filePath: filePath, mark: mark },
            backVersionParams:{
                "token": token,//暂无
                "username":username,
                "host_name":host_name,
                "root_path":filePath,
                "org_version_tx_id": tx_id
            }
        })
    }
    //点击回滚版本弹框关闭按钮
    handleCloseVersionConform() {
        this.setState({
            showVersionBox: false
        })
    }
    handleCloseFileConform() {
        this.setState({
            showFileBox: false,
        })
    }
    //点击版本详情按钮
    showVersionDetail(commit, id) {
        this.setState({
            showVersionDetailBox: true,
            versionDetailItem: commit,
            versionDetailId: id,
        })
        // console.log("父页面"+this.state.versionDetailItem);
        // console.log(commit);
    }
    //点击版本详情关闭按钮
    handleCloseVersionDetail() {
        this.setState({
            showVersionDetailBox: false,
        })
    }
    /*确认版本回滚
     ×传入的参数
     "token": "trust2",//暂无
     "username": data.operate_username,//用户名
     "host_name": data.protect_host_name,//主机名
     "root_path": data.protect_root_path,//根目录路径
     "org_version_tx_id": data.version_txid //返回id
    *
    * */
    handleVersionConformBack(){
        //console.log(this.state.backVersionParams)
        var self = this;
        self.setState({
            tamperLoadingBox:true,
        })
        $.ajax({
            url: '/api/tamper_proof/rollback_version/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data:{
                "service_type": "svn",
                token:this.props.tamperUsrToken,
                username:this.props.tamperUsrName,
                host_name:this.state.backVersionParams.host_name,
                root_path:this.state.backVersionParams.root_path,
                org_version_tx_id:this.state.backVersionParams.org_version_tx_id
            },
            success: function (data) {
                //console.log(JSON.stringify(data))
                self.setState({
                    showVersionBox: false, //隐藏弹框
                    tamperLoadingBox:false,
                })
            },
            error:function (data) {
                //console.log(JSON.stringify(data))
            }
        })
    }
    /*
    * 页码点击以及翻页
    * */
    handleChangePage(eventKey){
        this.setState({
            currentListPageNum:eventKey,
            versionPageMsg:this.state.versionMsg.slice((eventKey-1)*10,eventKey*10) //根据当前页码数，截取根目录版本信息列表的某一页
        })
    }
    /*
    * 点击展示版本信息列表
    * 传入对应的某一版本的信息变更列表数据
    * */
    handleShowPathFile(versionFilePathChange,e) {
        e.stopPropagation();
        // console.log(versionFilePathChange)
        this.setState({
            showFileBox: true,
            versionFilePathChange:versionFilePathChange
        })
        // return false; //也可以
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
                versionPageMsg:this.state.versionMsg.slice((indexCurrent-1)*10,indexCurrent*10) //根据当前页码数，截取根目录版本信息列表的某一页
            })
            $(e.target).val('') //清空所填写的页码
        }
    }
    /*
    * 点击页码跳转按钮
    * */
    handleJumpPage(){
        var indexCurrent = parseInt($('.versionPageNum').val())
        this.setState({
            currentListPageNum: indexCurrent,
            versionPageMsg:this.state.versionMsg.slice((indexCurrent-1)*10,indexCurrent*10) //根据当前页码数，截取根目录版本信息列表的某一页
        })
        $('.versionPageNum').val('') //清空所填写的页码
    }
    componentWillMount() {
        this.ajaxGetRootPath() //页面加载时，获取主机以及根目录列表
    }
    componentDidMount() {
    }
    render() {
        return (
            this.props.tabKey == 1 &&
            <div>
                <div className="tamper-list-li">  版本信息列表 </div>
                <div className="version-msg-list clearfix">
                    <div className="left-file-list">
                        <div className="list-detail-cover">
                            <h3>总目录</h3>
                            <div className="border-cover">
                                {
                                    !this.state.hostLists&&
                                    <LoadingText/>
                                }
                                {
                                    this.state.hostLists&&this.state.hostLists.map((data,index)=>{
                                        return(
                                            <div key={index} className="left-root-list-container">
                                                <h4 onClick={this.handleToggleRootFile.bind(this,index)}><i className="iconfont icon-db_icon file-icon"></i>{data.host}</h4>
                                                <div className="detail-toggle" style={{display:index==0?'block':'none'}}>
                                                {
                                                    data.root_paths.map((root,rIndex)=>{
                                                        return (
                                                            <p key={rIndex} onClick={this.handleToggleRootFileVersion.bind(this,index,rIndex,data.host,root.protect_root_path)}><b>{root.protect_path_mark}</b><br/>{root.protect_root_path}</p>
                                                        )
                                                    })
                                                }
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    </div>
                    <div className="right-file-list">
                        <h3>版本变化信息</h3>
                        <div className="border-cover">
                            {
                                !this.state.versionPageMsg &&
                                <LoadingText/>
                            }
                            {
                                this.state.versionPageMsg && this.state.versionPageMsg.map(function (data, index) {
                                    // console.log(data);
                                    // console.log(index);                                    
                                    return (
                                        <div className="dataList-content" key={index}>
                                            <table className="svn-db-host-list databaseHostList" onClick={this.handleToggleMsg.bind(this, index)}>
                                                {
                                                    index==0&&  //列表第一项展示表头
                                                    <thead>
                                                        <tr>

                                                            <th>版本编号</th>
                                                            <th>版本生成时间</th>
                                                            <th>变更类型</th>
                                                            <th>查看变更文件路径</th>
                                                            <th>备注信息</th>
                                                        </tr>
                                                    </thead>
                                                }

                                                <tbody>
                                                    <tr>
                                                        <td>{data.id}</td>
                                                        <td>{data.timestamp}</td>
                                                        <td>{data.operate_type}</td>
                                                        <td onClick={this.handleShowPathFile.bind(this,data.changed_objects)}>{data.protect_root_path}</td>
                                                        <td>{data.remark}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <div className="showDatabaseHostList versionMsg">
                                                <h3 className="versionMsgTitle">备注信息：{data.remark}</h3>
                                                {/*
                                                * "token": "trust2",//暂无
                                                  "username": data.operate_username,
                                                  "host_name": data.protect_host_name,
                                                  "root_path": data.protect_root_path,
                                                  "org_version_tx_id": data.version_txid
                                                * */}
                                                <button className="backToVersion svnBackToVersion plugAction"
                                                    onClick={this.handleBackVersion.bind(this,
                                                        data.id,data.timestamp,data.operate_type,data.protect_root_path,data.remark,
                                                        'token',data.operate_username,data.protect_host_name,data.version_txid
                                                    )}>
                                                    回滚到此版本
                                                </button>
                                                <button className="svnVersionDetail plugAction"
                                                    onClick={this.showVersionDetail.bind(this, data.commits_info, data.id)}>
                                                    版本详情
                                                </button>
                                            </div>

                                        </div>
                                    )
                                }.bind(this))
                            }
                            <div className="pagination-all">
                                <Pagination prev={true} next={true} first={false} last={false} ellipsis={true} boundaryLinks={true}
                                            items={this.state.dataListAllPage} onSelect={this.handleChangePage.bind(this)}
                                            activePage={this.state.currentListPageNum} maxButtons={7} />
                                <div className="pageCount">
                                    <input className="pageNum versionPageNum" placeholder="输入" onChange={this.handleEnterPage.bind(this)}  />
                                    <img className="searchNum" 　src='/static/img/skip.svg' onClick={this.handleJumpPage.bind(this)}/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <BackVersionBox
                        tamperLoadingBox = {this.state.tamperLoadingBox}
                        showVersionBox={this.state.showVersionBox}
                        handleVersionConformBack={this.handleVersionConformBack.bind(this)}
                        handleCloseVersionConform={this.handleCloseVersionConform.bind(this)}
                        backVersionState={this.state.backVersionState} />
                    {  
                        this.state.showFileBox &&
                        <ShowFilePath
                            showFileBox={this.state.showFileBox}
                            versionFilePathChange={this.state.versionFilePathChange}
                            handleCloseFileConform={this.handleCloseFileConform.bind(this)} />
                    }
                    {  
                        // 版本详情
                        this.state.showVersionDetailBox &&
                        <SVNVersionDetail
                            showVersionDetailBox = {this.state.showVersionDetailBox}
                            versionDetailItem = {this.state.versionDetailItem}
                            versionDetailId = {this.state.versionDetailId}
                            // tamperLoadingBox = {this.state.tamperLoadingBox}
                            handleCloseVersionDetail = {this.handleCloseVersionDetail.bind(this)}
                        />
                    }
                </div>
            </div>
        )
    }
}