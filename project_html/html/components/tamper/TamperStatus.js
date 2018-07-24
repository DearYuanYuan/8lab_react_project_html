import React from "react";　　　　　　　　　　　　　　　　　　　　　　　　//react
import $ from 'jquery';                                           //jquery
import { Pagination } from 'react-bootstrap';                     //分页组件    
import LoadingText from "../Commonality/LoadingText";           　//loading组件
require('../../styles/ClientData.less')                         　//样式


// 防篡改状态监视
export default class TamperStatus extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            clientData: [],            //客户端管理所有数据
            isLoading: false,          //loading状态默认关闭
            isError: false,            //error状态默认关闭
            pageIndex: 1,              //当前页码
            pageCount: 1,              //总页码
            AllStatus: false,          //全选按钮
        }
    };


   
    /**
     *  改变页码上下翻页操作
     * 
     * @param {any} eventKey 
     * @memberof TamperStatus
     */
    handleChange(eventKey) {
        this.setState({
            pageIndex: eventKey,
        });
        //根据新传入的页码重新获取数据
        this.getClientData(eventKey)    
    }


    // AllCheckStatus(e) {
    //     var Allchecked = $("#tamperStatusAll").prop("checked");
    //     var checkList = $(":checkbox").not($("#tamperStatusAll"))
    //     if (Allchecked) {
    //         for (var i = 0; i < checkList.length; i++) {
    //             checkList[i].checked = false;
    //         }
    //     }
    //     else {
    //         for (var i = 0; i < checkList.length; i++) {
    //             checkList[i].checked = true;
    //         }
    //     }
    // }


    /**
     * 用户改变input输入框页码
     * 
     * @param {any} e 
     * @memberof TamperStatus
     */
    handleInputValue(e) {
        var re = /^[0-9]+$/;
        var indexCurrent = parseInt($(e.target).val())
        if (!re.test($(e.target).val())) {
            $(e.target).val('')
        }
        if (indexCurrent > this.state.pageCount) {
            $(e.target).val(this.state.pageCount)
        }
        if (indexCurrent <= 0) {
            $(e.target).val('')
        }
        // 分页input回车
        if (e.keyCode == 13 && re.test($(e.target).val())) {    
            this.setState({
                pageIndex: indexCurrent,
            })
            //清空所填写的页码
            $(e.target).val('') 
        }
    }

    /**
     * 获取防篡改状态监视数据
     * 
     * @param {any} pageIndex 需要获取的对应页数据
     * @memberof TamperStatus
     */
    getClientData(pageIndex) {
        //先设定为loading状态
        this.setState({
            isLoading: true
        })
        var self = this;
        // 模拟数据
        // var dataList = [
        //     { id: '0', username: "octa-tmp-001", time: "192.168.9.8", type: '受到保护', status: "red" },
        //     { id: '2', username: "octa-tmp-996", time: "127.0.0.1", type: '心跳超时', status: "red" },
        //     { id: '3', username: "octa-tmp-055", time: "186.145.415.4", type: '未受到保护', status: "blue" },
        //     { id: '1', username: "octa-tmp-018", time: "999.999.999.99", type: 'upload', status: "yellow" },
        // ]
        $.ajax({
            url: "/api/tamper_proof/get_user_host_detail/",
            type: "POST",
            dataType: "json",
            data: {
                "service_type": "web",                   //service_type 分为 web 和 svn
                pageIndex: pageIndex,                    //请求的页码
                username: this.props.tamperUsrName,　　　 //用户名
                token: this.props.tamperUsrToken,　　　　 //token
                is_super: this.props.tamperIsSuper,      //是否是管理员
            },
            success(data) {
                if (data[0].status == 'FAILURE') {
                    self.setState({
                        isLoading: false,
                        isError: true,
                    })
                }
                if (data[0].status == 'SUCCESS') {
                    self.setState({
                        clientData: data[0].result,
                        isLoading: false,
                        isError: false,
                    })
                }

            },
            error() {
                self.setState({
                    isLoading: false,
                    isError: true,
                })
            }
        })
    }



    /**
     * 删除客户端操作
     * 
     * @memberof TamperStatus
     */
    // deleteServer() {
    //     //得到当前用户选中的要操作的客户端
    //     var deleteList = $("input:checked").not($("#tamperStatusAll"))
    //     var data = '';
    //     // 根据自定义属性，找到当前项的唯一标示
    //     for (var i = 0; i < deleteList.length; i++) {
    //         data += '#' + ($(deleteList[i]).parent().parent().data("info"))
    //     }
    //     $.ajax({
    //         url: 'deleteServer',
    //         data: data,
    //         dataType: "json",
    //         type: "POST",
    //         success() {
    //         }
    //     })
    // }

　　//组件渲染前
    componentWillMount() {
        this.getClientData(1)　　//获取状态监视数据
    }

    //渲染函数
    render() {
        return (
            this.props.tabKey == 3 &&
            <div>
                <div className="tamper-list-li">客户端管理 </div>
                <div className="version-msg-list tamperStatus">
                    {/* 
                    <form className="searchServer" action>
                        <input type="text" placeholder='搜索用户或主机' />
                        <input type="text" value='搜索' />
                    </form>
                    <div className="operation">
                        <button className='deleteServer' onClick={() => this.deleteServer()}>删除客户端</button>
                        <button className='addServer'>新增客户端</button>
                    </div>  */}
                    {this.state.isError && <div className="ClientError">加载失败！</div>}
                    {this.state.isLoading && <LoadingText />}

                    {this.state.clientData && !this.state.isLoading && !this.state.isError &&
                        <div>
                            <table>
                                <thead>
                                    <tr>
                                        {/* <th> <input type="checkbox" id="tamperStatusAll" className="custom-checkbox" /><label className="tamperCheckbox" htmlFor="tamperStatusAll" onClick={(e) => this.AllCheckStatus(e)}></label>客户端标签</th>*/}
                                        <th>IP地址      </th>
                                        <th>备注</th>
                                        <th>当前状态     </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.clientData.map(function (item, index) {
                                        return (
                                            <tr key={index} data-info={item.id} >
                                                 {/*<td><input type="checkbox" name='singleSelect' id={`tamperStatus${index}`} className="custom-checkbox" /><label className="tamperCheckbox" htmlFor={`tamperStatus${index}`}></label>{item.protect_host_name}</td>*/}
                                                <td>{item.protect_host_addr}</td>
                                                <td>{item.remark}</td>
                                                {/* <td><span className={`watchStatus  ${item.status}`}></span>{item.type}</td>*/}
                                                <td><span className={`watchStatus  ${item.status}`}></span>{item.status}</td>
                                            </tr>
                                        )
                                    })
                                    }
                                </tbody>
                            </table>
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
                                    <input className="pageNum" placeholder="输入" onChange={this.handleInputValue.bind(this)} />
                                    <img className="searchNum" onClick={() => this.getClientData(this.state.pageIndex)} src='/static/img/skip.svg' />
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </div>
        )
    }
}