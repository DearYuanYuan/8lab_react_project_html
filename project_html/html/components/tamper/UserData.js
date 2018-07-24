



import React from "react";                               //react
import $ from 'jquery';                                  //jquery
import { Pagination } from 'react-bootstrap';            //bottstrap的分页组件
import LoadingText from "../Commonality/LoadingText";    //loading组件
require('../../styles/ClientData.less')

//用户操作日志展示
export default class ＵserData extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            clientData: null,       //用户操作日志数据
            isLoading: false,       //loading状态
            isError: false,         //error状态
            pageIndex: 1,　　　　　　 //当前页
            pageCount: 10,          //总页码
        }
    };

    /**
     *  改变页码上下翻页操作
     * 
     * @param {any} eventKey 
     * @memberof ＵserData
     */
    handleChange(eventKey) {
        this.setState({
            pageIndex: eventKey,

        });
        //重新获取用户操作日志
        this.getClientData(eventKey)　
    }



     /**
     * 用户改变input输入框页码
     * 
     * @param {any} e 
     * @memberof TamperStatus
     */
    handleInputValue(e) {
        //页码检测正则
        var re = /^[0-9]+$/;
        //获取当前用户输入页码
        var indexCurrent = parseInt($(e.target).val())
        if (!re.test($(e.target).val())) {
            $(e.target).val('')
        }
        //用户输入页码不能超过总页码
        if (indexCurrent > this.state.pageCount) {
            $(e.target).val(this.state.pageCount)
        }
        if (indexCurrent <= 0) {
            $(e.target).val('')
        }
        // 分页input回车
        if (e.keyCode == 13 && re.test($(e.target).val())) {    
             //重新获取用户操作日志
            this.getClientData(indexCurrent)
        }
    }

    /**
     * 输入页码后，点击跳转操作
     * 
     * @memberof ClientDatag
     */
    iconClickGetData() {
        //获取用户输入页码
        var pageIndex = parseInt($("#userDataIndex").val());
        if(!pageIndex){
            return
        }
        //重新获取用户操作日志
        this.getClientData(pageIndex)
    }


    /**
     * 获取用户操作日志数据
     * 
     * @param {any} pageIndex 需要获取的对应页数据
     * @memberof TamperStatus
     */
    getClientData(pageIndex) {
        this.setState({
            isLoading: true
        })
        var self = this;
        $.ajax({
            url: "/api/tamper_proof/get_user_operation_log/",
            type: "POST",
            dataType: "json",
            data: {
                "service_type": "web",　　　　　　　　　　　　//service_type 分为 web 和 svn
                pagenum: pageIndex,                       //请求的页码
                pagesize: 20,                             //每页的数据数量
                username: this.props.tamperUsrName,　　　 　//用户名
                token: this.props.tamperUsrToken,　　　　 　//token
                is_super: this.props.tamperIsSuper,      　//是否是管理员
            },
            success(data) {
                self.setState({
                    pageIndex: pageIndex,
                    clientData: data.content,
                    isLoading: false,
                    isError: false,
                    pageCount: parseInt(Math.ceil(data.total / 20))
                })
            },
            error(data) {
                self.setState({
                    isLoading: false,
                    isError: true,
                })
            }
        })
    }
    //组件即将渲染
    componentWillMount() {
        //获取用户操作日志
        this.getClientData(1)
    }

    //渲染函数
    render() {
        return (
            this.props.tabKey == 4 &&
            <div className="version-msg-list userDataList">

                {this.state.isLoading && <LoadingText />}

                {this.state.isError && <div className="ClientError">加载失败！</div>}

                {this.state.clientData && !this.state.isLoading && !this.state.isError &&
                    <div>
                        <div className="userDataTable" >
                            <div className='thead clearfix'>
                                <div>用户名称</div>
                                <div>操作时间</div>
                                <div>操作类型</div>
                                <div>所属机器</div>
                                <div>所属目录</div>
                                <div>变更文件</div>
                                <div>版本ID</div>
                            </div>

                            <div className='tbody'>
                                {this.state.clientData.map(function (item, index) {
                                    var loop = JSON.parse(item._source.message)
                                    return (
                                        <div className="clearfix tbodyRow" key={index}>
                                            <div title={loop.username}>{loop.username}</div>
                                            <div title={loop.timestamp}>{loop.timestamp}</div>
                                            <div title={loop.operate_type}>{loop.operate_type}</div>
                                            <div title={loop.protect_host_name}>{loop.protect_host_name}</div>
                                            <div title={loop.protect_root_path}>{loop.protect_root_path}</div>
                                            <div title={loop.changed_objects}>{loop.changed_objects}</div>
                                            <div title={loop.version_txid}>{loop.version_txid}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="pagination-all">
                            <Pagination
                                prev={true}
                                next={true}
                                first={false}
                                last={false}
                                ellipsis={true}
                                boundaryLinks={true}
                                items={this.state.pageCount}
                                maxButtons={7}
                                activePage={this.state.pageIndex}
                                onSelect={this.handleChange.bind(this)} />
                            <div className="pageCount">
                                <input className="pageNum" id='userDataIndex' placeholder="输入" onChange={this.handleInputValue.bind(this)}  />
                                <img className="searchNum" onClick={() => this.iconClickGetData()} src='/static/img/skip.svg' />
                            </div>
                        </div>
                    </div>
                }
            </div>
        )
    }
}
