import React from 'react'
import { Pagination, Modal, Col, Button, Table, Form, FieldGroup, ControlLabel, FormControl, FormGroup, HelpBlock, Tabs, Tab } from 'react-bootstrap';
import { isInt, isIP, isPort, isUrl } from "../../utils/utils";　　　//引入用到的工具函数} 
import DropdownList from "../Commonality/DropdownList";     //下拉列表的组件
import AddTaskPlan from "./AddTaskPlan"
import CustomPagination from "../Commonality/CustomPagination.js"
export default class Schtasks extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            key: 0,
            hostlist: [],                        //主机列表数据
            addtaskPlan: false,

            currentPage: 1,
            schtasksPageCount: 0,
            sysSelectAllText: '选择全部',

            totalItemsCount: 0,
            pageCount: 0,
        }
        this.sysSelectAll = '0';   //０代表当前是未选择状态　　１代表当前是已经选择全部的状态

        this.sortByIP = '';         //hostip,-hostip 按照主机Ip排序
        this.sortByHostname = '';   //id -id,       按照主机别名排序
        this.sortByStatus = '';     //is_scan -is_scan 按照是否查杀排序


        this.checkArr = [];     　//选中需要删除的主机数组
        this.searchItem = null; 　//搜索输入框中的内容

        this.rowsPerPage = 10       //列表最多显示行数
        this.currentPage = 1;       //当前页码，默认为1
    }

    /**
      * 选择页码的监听
      */
    handleSelectPage(eventkey) {
        this.currentPage = eventkey
        this.getSchtasksList();
    }

    /**
     * 点击跳转按钮的监听
     */
    handleJumpPage() {
        this.currentPage = parseInt($('#schtasksPage').val())
        this.getSchtasksList();

    }

    /**
     * 跳转输入框的onChange监听
     */
    onChangeInputPage(e) {
        var hostlistPage = e.target.value      //获取输入的页码
        //如果输入的页码不为空,并且如果输入的页码不符合规范(不是正整数，或者大于最大页码)
        if (hostlistPage != "" && (!isInt(hostlistPage) || hostlistPage == 0 || hostlistPage > this.pageCount)) {
            $('#schtasksPage').val('');   //清空输入框的内容                       
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
    checkSelectAll(who, e) {
        var checkedNum = $(`.${who} .hostlist-detail .hostlist-hostname .custom-checkbox:checked`).length;
        var allcheckedNum = $(`.${who} .hostlist-detail .hostlist-hostname .custom-checkbox`).length;
        //如果当前点击的复选框是已经被选中的，点击之后被选中的复选框个数-1;否则，+1
        checkedNum += $(e.target).siblings('.custom-checkbox:checked').length ? -1 : 1;
        if (checkedNum < 1) {
            $(".schtasks-action .btn-pause-protection").addClass('not-allowed')
        } else {
            $(".schtasks-action .btn-pause-protection").removeClass('not-allowed')
        }
        if (checkedNum == allcheckedNum) {
            $(`.${who}>thead .hostlist-hostname .custom-checkbox`).prop('checked', true)
        } else {
            $(`.${who}>thead .hostlist-hostname .custom-checkbox`).prop('checked', false)
        }
    }
    /**
     * 点击“全选”复选框时的操作
     */
    toggleSelectAll(who) {
        $(`.${who} .hostlist-detail .hostlist-hostname input`).prop('checked', !$(`.${who}>thead .hostlist-hostname input`).prop('checked'))
        var checkedNum = $(`.${who} .hostlist-detail .hostlist-hostname .custom-checkbox:checked`).length;
        if (checkedNum < 1) {
            $(".schtasks-action .btn-pause-protection").addClass('not-allowed')
        } else {
            $(".schtasks-action .btn-pause-protection").removeClass('not-allowed')
        }
    }
    // 点击选择全部之后所有页面的checkbox都被勾选
    sysSelect() {
        if (this.state.sysSelectAllText == '选择全部') {
            this.sysSelectAll = '1'
            $('.schtasksTable .hostlist-detail .hostlist-hostname .custom-checkbox').prop('checked', true)
            $('.schtasksTable>thead .hostlist-hostname .custom-checkbox').prop('checked', true)
            this.setState({
                sysSelectAllText: '取消选择'
            })
        } else if (this.state.sysSelectAllText == '取消选择') {
            this.sysSelectAll = '0'
            $('.schtasksTable .hostlist-detail .hostlist-hostname .custom-checkbox').prop('checked', false)
            $('.schtasksTable>thead .hostlist-hostname .custom-checkbox').prop('checked', false)
            this.setState({
                sysSelectAllText: '选择全部'
            })
        }
        var checkedNum = $('.schtasksTable .hostlist-detail .hostlist-hostname .custom-checkbox:checked').length;
        if (checkedNum < 1) {
            $(".schtasks-action .btn-pause-protection").addClass('not-allowed')
        } else {
            $(".schtasks-action .btn-pause-protection").removeClass('not-allowed')
        }
    }
    /**
     * 恢复所有复选框到未选中状态
     */
    initialAllCheckbox() {
        $('.hostlist-hostname input').prop('checked', false);
    }
    /**
        * 按照某一列给表格排序
        * @param {string} sortCol 排序的列名 
        */
    sortTable(sortCol) {
        switch (sortCol) {
            case 'hostname':
                this.sortByHostname = (this.sortByHostname == 'id' ? '-id' : 'id');
                this.sortField = this.sortByHostname;
                break;
            case 'ip':
                this.sortByIP = (this.sortByIP == 'hostip' ? '-hostip' : 'hostip');
                this.sortField = this.sortByIP;
                break;
            case 'status':
                this.sortByStatus = (this.sortByStatus == 'is_scan' ? '-is_scan' : 'is_scan');
                this.sortField = this.sortByStatus;
                break;
            default:
                this.sortField = '';
        }
        this.getSchtasksList()

    }
    /*====================== 主机列表的操作（搜索） ====================== */


    /**
     * 搜索输入框内容变化时的监听
     */
    onChangeSearchInput() {
        this.searchItem = $('#schtasks-search').val();
    }

    // 页码框改变
    onChangeCurrentPage(e) {
        if (e.target.value > this.state.schtasksPageCount) {
            this.setState({ currentPage: this.state.schtasksPageCount })
            this.currentPage = this.state.schtasksPageCount;
            return
        }
        this.setState({ currentPage: e.target.value })
        this.currentPage = e.target.value;
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
        this.getSchtasksList();
    }


    getSchtasksList() {
        var self = this;
        $.ajax({
            url: '/api/machinelist/show/',
            type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: {                         //表单数据
                page: self.currentPage,        //当前时第几页
                condition: self.searchItem,    //搜索关键字
                sort: self.sortField,          //排序方式
            },
            success: function (result) {
                if (result) {
                    self.setState({
                        schtasksPageCount: result.pages_num,
                        hostlist: result.data,
                    })
                    if (self.currentPage == 1) {
                        $('.pagination-previous').addClass('not-allowed')
                    } else {
                        $('.pagination-previous').removeClass('not-allowed')
                    }
                    if (self.state.schtasksPageCount == self.currentPage) {
                        $('.pagination-next').addClass('not-allowed')
                    } else {
                        $('.pagination-next').removeClass('not-allowed')
                    }
                }
            }
        })
        this.initialAllCheckbox(); //恢复所有复选框到未选中状态
    }


    showAddTaskPlan(type) {
        this.taskPlanType=type;
        this.setState({
            addtaskPlan: true,
        })
    }

    hideAddTaskPlan() {
        this.setState({
            addtaskPlan: false,
        })
    }


    componentDidMount() {
        this.getSchtasksList()
    }

    /**
     * 设置列表每页最多显示行数
     * @param {int} num 行数 
     */
    setRowsPerPage(num) {
        this.rowsPerPage = num
        this.getHostList()
    }


    render() {
        return (
            <div className="protectControl-content schtastks">
                <h2 className="content-title">
                    任务计划列表
                </h2>
                <div className="schtasks-ctl clearfix">
                    <form onSubmit={this.handleSearchHost}>
                        <input
                            id="schtasks-search"
                            type="text"
                            placeholder="搜索任务"
                            className="form-control input-search"
                            onChange={this.onChangeSearchInput.bind(this)}
                        />
                        <button className="btn-search  btn btn-icon 　 btn-icon-blue" onClick={this.handleSearchHost}>
                            <i className="fa fa-search" aria-hidden="true"></i>
                        </button>
                        <div className='sys-select-all' onClick={this.sysSelect.bind(this)}> {this.state.sysSelectAllText} </div>
                    </form>
                    <div className="schtasks-action">
                        操作：
                        <button className="btn-apply-protection btn btn-icon" onClick={() => this.showAddTaskPlan('plus')}>
                            <i className="fa fa-plus" aria-hidden="true"></i>
                        </button>
                        <button className="btn-pause-protection btn btn-icon not-allowed" >
                            <i className="fa fa-trash" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>

                {/*主机列表的表格*/}
                <table className="hostlist-table schtasksTable">
                    <thead>
                        <tr>
                            <th className="hostlist-hostname">
                                <input type="checkbox" id="hostlist-checkbox-all" className="custom-checkbox"  ></input>
                                <label htmlFor="hostlist-checkbox-all" onClick={this.toggleSelectAll.bind(this, 'schtasksTable')}></label>{/*自定义的复选框样式*/}
                                任务名称
                                    <i className={this.sortByHostname == 'id' ? "fa fa-angle-up" : "fa fa-angle-down"} aria-hidden="true" onClick={this.sortTable.bind(this, 'hostname')}> </i>
                            </th>
                            <th className="hostlist-hostip">
                                备注
                                     <i className={this.sortByIP == 'hostip' ? "fa fa-angle-up" : "fa fa-angle-down"} aria-hidden="true" onClick={this.sortTable.bind(this, 'ip')}></i>
                            </th>
                            <th className="hostlist-details"></th>
                        </tr>
                    </thead>

                    <tbody>
                        {this.state.hostlist && this.state.hostlist.map(function (hostDetail, index) {
                            return (
                                <tr className="hostlist-detail" key={index}>
                                    <td className="hostlist-hostname">
                                        <input type="checkbox" id={"hostlist-checkbox-" + index} title={hostDetail.hostip} className="custom-checkbox"></input>
                                        <label htmlFor={"hostlist-checkbox-" + index} onClick={this.checkSelectAll.bind(self, 'schtasksTable')}></label>{/*自定义的复选框样式*/}
                                        {hostDetail.hostname}
                                    </td>
                                    <td className="hostlist-remark">{hostDetail.remark}</td>
                                    <th className="hostlist-details"  onClick={() => this.showAddTaskPlan('updata')}>详细信息 > </th>
                                </tr>
                            )
                        }.bind(this))}

                        {
                            !this.state.hostlist.length && <tr className="hostlist-detail" style={{ width: '100%', height: '70px', lineHeight: '70px', background: 'transparent', border: 'none', }}><td style={{ paddingLeft: '40px' }}>当前没有匹配的数据。</td></tr>
                        }
                    </tbody>
                </table>



                {this.state.addtaskPlan &&
                    <AddTaskPlan
                        show={this.state.addtaskPlan}
                        hide={() => this.hideAddTaskPlan()}
                        type={this.taskPlanType}
                        hostlist={this.state.hostlist}
                    />

                }
                <CustomPagination
                    from={(this.currentPage - 1) * this.state.rowsPerPage}
                    to={this.currentPage * this.state.rowsPerPage}
                    totalItemsCount={this.state.totalItemsCount}
                    totalPagesCount={this.state.pageCount}
                    currentPage={this.currentPage}
                    onChangeRowsPerPage={(num) => this.setRowsPerPage(num)}
                    onSelectPage={(e) => this.handleSelectPage(e)}
                    onChangePageInput={(e) => this.onChangeInputPage(e)}
                    onPageInputKeyDown={(e) => this.jumpPageKeyDown(e)}
                    onClickJumpButton={() => this.handleJumpPage()}
                    pageNumInputId="logsPage"
                    dropdownListId="rowsPerPageList"
                />
                {/*--------------------------------------------新建任务计划配置---------------------------------*/}

            </div>
        )
    }
}
