

import React from "react";              //引入react
import $ from "jquery";                   //引入jquery   
import { Pagination, Modal, Col, Button, Table, Form, FieldGroup, ControlLabel, FormControl, FormGroup, HelpBlock } from 'react-bootstrap';
import { isInt } from "../../utils/utils.js";
import DropdownList from "../Commonality/DropdownList";     //下拉列表的组件
import MessageBox from "../Commonality/MessageBox"          //消息提示框组件
import { myClearInterval } from "../../utils/utils";                //工具函数
export default class VirusScan extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            hostlist: [
                {
                    hostname: '11111',
                    hostip: '127.0.0.1',
                    description: '1221212121',
                    status: true,
                    remark: '21321321321',
                    action: true,
                },
                {
                    hostname: '11111',
                    hostip: '127.0.0.1',
                    description: '1221212121',
                    status: true,
                    remark: '21321321321',
                    action: false,
                }
                , {
                    hostname: '222',
                    hostip: '12227.0.0.1',
                    description: '15555512121',
                    status: false,
                    remark: '66666',
                    action: false,
                }
            ],
            showDetails: false,
            selectHost: '',
            showMsgBox: false,                   //不显示消息提示框
            msgContent: '',                      //提示框的提示消息
            msgButtonState: false,               //提示框中的按钮状态
            msgButtonName: "",                   //提示框中的按钮名称

            repairlist: [],                             //人工确认列表信息
            searchItem: null,
            pageCount:0
        }
        this.sortByIP = -1;    //-1表示没有排序;0,表示升序;1表示降序
        this.sortByHostname = -1;
        this.sortByStatus = -1;
        this.sortField = null;  //get_host接口所需的field参数。‘hostname-0’ 表示按照按照主机别名升序;‘hostname-1’ 表示按照按照主机别名降序。
        // this.pageCount = 0;     //总页数
        this.pageSize = 8;      //当前页显示的最多的个数
        this.currentPage = 1;   //当前页码，默认为1
        this.selectedIDs = [];  //复选框选中的主机的ID
        this.searchRange = '-1';    //搜索操作的范围，下拉列表所选的值   

    }

    /**
    * 在组件渲染之前执行的操作
    */
    componentWillMount() {
        this.repairAjax();
    }

    /**
     * 在组件加载之后执行的操作
     */
    componentDidMount() {
        // if(!this.setInterAffirm){
        //     this.setInterAffirm=setInterval(this.repairAjax.bind(this,5000))
        // }
        this.setInterAffirm = setInterval(this.repairAjax.bind(this), 5000);
    }
    componentWillUnmount() {
        //清空所有定时器设置
        this.setInterAffirm = myClearInterval(this.setInterAffirm);

    }



    getHostList() {
        var self = this;
        self.setInterAffirm = myClearInterval(self.setInterAffirm);
        $.ajax({
            url: '/api/search/',
            type: 'POST',
            dataType: 'json',
            data: {
                page: self.currentPage,
                size: self.pageSize,
                keyword: self.searchItem,
            },
            cache: false,
            //与后台交互成功成功
            success: function (data) {
                // self.pageCount = data.totalpage;
                //如果日志数目大于0，设置state
                if (data.logs) {
                    self.setInterAffirm = setInterval(self.repairAjax.bind(self), 5000);
                    self.setState({
                        isLoading: false,
                        loadErr: false,
                        lasttime: parseInt(data.timegap),//确认时间差
                        repairlist: data.logs,//数据
                        pageCount:data.totalpage
                    });
                }
            }
        });
    }
    /**
     *发送AJAX获取logsTable数据渲染
     * 根据page，发送ajax，查询日志
     * @param {any} page :请求的具体页码
     * 
     * @memberof sysCheckMain
     */
    repairAjax() {
        var self = this;
        var sendTime = (new Date()).getTime();
        $.ajax({
            url: '/api/repairlist/',
            type: 'POST',
            dataType: 'json',
            data: {
                level: 'ERROR',
                page: self.currentPage,
                sendTime: sendTime,
                size: self.pageSize,
                keyword: self.searchItem,
            },
            cache: false,
            //与后台交互成功成功
            success: function (data) {
                // self.pageCount = data.totalpage;
                //如果日志数目大于0，设置state
                if (data.logs) {
                    self.setState({
                        isLoading: false,
                        loadErr: false,
                        lasttime: parseInt(data.timegap),//确认时间差
                        repairlist: data.logs,//数据
                        pageCount:data.totalpage                        
                    });
                }
            }
        });
    }



    /*====================== 主机列表的操作（分页） ====================== */

    /**
     * 选择页码的监听
     */
    handleSelectPage(eventkey) {
        this.currentPage = eventkey
        this.repairAjax();
    }

    /**
     * 点击跳转按钮的监听
     */
    handleJumpPage() {
        this.currentPage = parseInt($('#affirmPage').val())
        this.repairAjax();
    }

    /**
     * 跳转输入框的onChange监听
     */
    onChangeInputPage(e) {
        var hostlistPage = e.target.value      //获取输入的页码
        //如果输入的页码不为空,并且如果输入的页码不符合规范(不是正整数，或者大于最大页码)
        if (hostlistPage != "" && (!isInt(hostlistPage) || hostlistPage == 0 || hostlistPage > this.state.pageCount)) {
            $('#affirmPage').val('');   //清空输入框的内容                       
        }
    }

    /**
     * 跳转输入框的按键事件监听
     * @return {[type]} [description]
     */
    jumpPageKeyDown(e) {
        if (e.keyCode === 13) {           //当按下的键是回车键
            this.handleJumpPage()
        }
    }

    /*====================== 主机列表的操作（应用/暂停保护） ====================== */

    /**
     *检查是否所有的复选框都被选中。
     *如果全被选中，“全选”的复选框也该被选中;否则，取消被选中
     */
    checkSelectAll(e) {
        var checkedNum = $('.affirm-detail .hostlist-hostname .custom-checkbox:checked').length;
        //如果当前点击的复选框是已经被选中的，点击之后被选中的复选框个数-1;否则，+1
        checkedNum += $(e.target).siblings('.custom-checkbox:checked').length ? -1 : 1;
        if (checkedNum == this.pageSize) {
            $('.affirm-table>thead .hostlist-hostname .custom-checkbox').prop('checked', true)
        } else {
            $('.affirm-table>thead .hostlist-hostname .custom-checkbox').prop('checked', false)
        }
    }
    /**
     * 点击“全选”复选框时的操作
     */
    toggleSelectAll() {
        $('.affirm-detail .hostlist-hostname input').prop('checked', !$('.affirm-table>thead .hostlist-hostname input').prop('checked'))
    }

    /**
     * 恢复所有复选框到未选中状态
     */
    initialAllCheckbox() {
        $('.hostlist-hostname input').prop('checked', false);
    }



    /*====================== 主机列表的操作（排序） ====================== */

    /**
     * 按照某一列给表格排序
     * @param {string} sortCol 排序的列名 
     */
    sortTable(sortCol) {
    }

    /*====================== 主机列表的操作（搜索） ====================== */
    /**
     * 搜索范围下拉列表内容改变
     * @param {*} 所选中的内容 
     */
    onChangeRange(item) {
        this.searchRange = item;
        this.currentPage = 1;   //默认回到第一页
        this.getHostList()
    }

    /**
     * 搜索输入框内容变化时的监听
     */
    onChangeSearchInput() {
        this.searchItem = $('#searchAffirmInput').val();
    }

    /**
     * 点击搜索按钮的监听
     * 按照输入框中的内容搜索主机
     */
    handleSearchHost = (e) => {
        e.preventDefault();
        //搜索时默认无排序，重置所有的排序选项
        this.sortField = '';
        this.sortByHostname = -1;
        this.sortByIP = -1;
        this.sortByStatus = -1;
        this.currentPage = 1;   //默认回到第一页
        this.getHostList();
    }





    /**
 * 控制弹出页 
 */
    changeModal() {
        this.setState({
            showModal: !this.state.showModal
        });
    }




    /**
    * 设置窗口可拖动
    * @param {*} id 要设置可拖动的元素的id
    */
    setDraggable(id) {
        require('../../utils/jquery-ui.min.js'); //在jquery-ui官网自定义的压缩文件，只包含实现draggable功能所需内容。
        $('#' + id).draggable(); //调用jquery-ui的draggable方法，jquery在文件开头被引入。
    }



    changeHost(host) {
        this.setState({
            showDetails: true,
            selectHost: host
        })
    }

    /**
     * 根据复选框的状态获取被选中的主机的ID
     * @return selectedIDs 被选中的主机ID的列表
     */
    setSelectedIDs() {
        this.selectedIDs = [];
        //获取到选中checkbox的父元素
        var checkedParents = $('.hostlist-detail .hostlist-hostname input:checked').parent().parent();

        //遍历父元素的这个数组,得到其相对于同胞元素的 index 位置,对应到hostlist中的index
        for (var i = 0; i < checkedParents.length; i++) {
            var index = $(checkedParents[i]).index();
            this.selectedIDs.push(this.state.hostlist[index].id);
        }
    }

    /**
     * 立即确认ajax
     * 
     * 
     * @memberof sysCheckMain
     */
    immediatelyAffirm() {
        var check = $(".affirm-detail > .hostlist-hostname >input:checked");
        var checkArr = []
        for (var i = 0; i < check.length; i++) {
            let obj = {
                id: $(check[i]).attr('data-id'),
                ip: $(check[i]).attr('data-ip'),
                host: $(check[i]).attr('data-host'),
                content: JSON.stringify($(check[i]).attr('data-content'))
            }
            checkArr.push(obj)
        }
        //如果没有选中数据
        if (!checkArr.length) {
            this.setState({
                showMsgBox: true,
                msgContent: '请选择您要手动确认的数据',
                msgButtonState: true,
                msgButtonName: '确定'
            })
        } else {
            var jsonIds = { "param": checkArr };
            jsonIds = JSON.stringify(jsonIds)
            this.confirmAjax(jsonIds);
        }
    }


    /**
   * 人工确认ajax
   * 
   * @param {any} 确认的id
   * 
   * @memberof sysCheckMain
   */
    confirmAjax(id) {
        //ajax设置
        this.initialAllCheckbox(); //恢复所有复选框到未选中状态
        var self = this;
        $.ajax({
            url: '/api/repair/',
            type: 'POST',
            dataType: 'json',
            enctype: "multipart/form-data",
            data: {
                repairActivePage: this.state.repairactivePage,
                level: 'ERROR',
                id: id
            },
            success: function () {

                self.setState({
                    showMsgBox: true,
                    msgContent: '确认成功',
                    msgButtonState: true,
                    msgButtonName: '确定'
                });
                //成功再次请求人工确认ajax
                self.repairAjax();

            },
            error: function () {
                self.setState({
                    showMsgBox: true,
                    msgContent: '确认失败',
                    msgButtonState: true,
                    msgButtonName: '确定'
                });
            }
        });
    }

    /*===================================================== 消息弹出框 ============================================== */
    /**
      * Message消息组件相关函数
      * 组件渲染之前设置数据
      * @param {any} val 消息组件是否显示的Boole值
      * 
      * @memberof HomeHeader
      */
    handleConfirmMsgBox() {
        this.setState({
            showMsgBox: false
        })
    }


    render() {
        var self = this;


        return (
            <div>
                <div className="protectControl-content">
                    <h2 className="content-title">
                        待确认问题列表
                     </h2>
                    <div className="btns-group clearfix">
                        <button className="btn-apply-protection btn btn-sm btn-primary" onClick={this.immediatelyAffirm.bind(this)}>
                            确认信息
                         </button>
                        <div className="btn-group-search">
                            <form onSubmit={this.handleSearchHost}>
                                <input
                                    id="searchAffirmInput"
                                    type="text"
                                    placeholder="搜索主机信息"
                                    className="form-control input-search"
                                    onChange={this.onChangeSearchInput.bind(this)} />
                                <input className="btn-search btn btn-sm btn-primary" type="submit" value='搜索'></input>
                            </form>
                        </div>
                    </div>
                    {/*主机列表的表格*/}
                    <table className="affirm-table">
                        <thead>
                            <tr>
                                <th className="hostlist-hostname">
                                    <input type="checkbox" id="affirm-checkbox-all" className="custom-checkbox"></input>
                                    <label htmlFor="affirm-checkbox-all" onClick={this.toggleSelectAll.bind(this)}></label>{/*自定义的复选框样式*/}
                                    时间
                            <i className={this.sortByHostname == 0 ? "fa fa-angle-up" : "fa fa-angle-down"}
                                        aria-hidden="true" onClick={this.sortTable.bind(this, 'hostname')}></i>
                                </th>
                                <th className="hostlist-hostip">
                                    主机标签
                            <i className={this.sortByIP == 0 ? "fa fa-angle-up" : "fa fa-angle-down"}
                                        aria-hidden="true" onClick={this.sortTable.bind(this, 'ip')}></i>
                                </th>
                                <th className="hostlist-description">主机 IP</th>
                                <th className="hostlist-status">
                                    级别
                            <i className={this.sortByStatus == 0 ? "fa fa-angle-up" : "fa fa-angle-down"}
                                        aria-hidden="true" onClick={this.sortTable.bind(this, 'status')}></i>
                                </th>
                                <th className="hostlist-maintenance">文件（数据）哈希</th>
                            </tr>
                        </thead>
                        <tbody>

                            {this.state.repairlist.length ?


                                this.state.repairlist.map(function (rl, index) {
                                    return (
                                        <tr className="affirm-detail" key={index}>
                                            <td className="hostlist-hostname">
                                                <input type="checkbox" id={"affirm-checkbox-" + index} data-id={rl.id} data-ip={rl.ip} data-host={rl.host} data-content={rl.content} className="custom-checkbox"></input>
                                                <label htmlFor={"affirm-checkbox-" + index} onClick={self.checkSelectAll.bind(self)}></label>{/*自定义的复选框样式*/}
                                                {rl.time}
                                            </td>
                                            <td className="hostlist-hostip">{rl.filename}</td>
                                            <td className="hostlist-hostip">{rl.ip}</td>
                                            <td className="hostlist-status">{rl.level}</td>
                                            <td className="hostlist-remark" title={rl.content}>{rl.content}</td>
                                        </tr>
                                    )
                                }.bind(this))
                                 :
                                <tr className="hostlist-detail"><td>当前没有匹配的数据。</td></tr>
                            }

                        </tbody>
                    </table>
                    {/*主机列表的页码*/}
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
                            activePage={this.currentPage}
                            onSelect={this.handleSelectPage.bind(this)}
                        />
                        {/*页码跳转输入框*/}
                        <div className="pageCount">
                            <input
                                className="pageNum"
                                id="affirmPage"
                                placeholder="输入"
                                onChange={this.onChangeInputPage.bind(this)}
                                onKeyDown={this.jumpPageKeyDown.bind(this)}
                            />
                            <img
                                className="searchNum"
                                onClick={this.handleJumpPage.bind(this)} src='/static/img/skip.svg' />
                        </div>
                    </div>
                </div>



                <MessageBox
                    showMsgBox={this.state.showMsgBox}
                    msgContent={this.state.msgContent}
                    msgButtonState={this.state.msgButtonState}
                    msgButtonName={this.state.msgButtonName}
                    handleConfirmMsgBox={this.handleConfirmMsgBox.bind(this)}
                />
            </div>
        )
    }

}

