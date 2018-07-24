import React from "react";
import $ from "jquery";
import {isInt} from "../../utils/utils.js";
import {Button} from 'react-bootstrap';  //引入 React-bootstrap 组件
import LoadingText from "../Commonality/LoadingText";
import CustomPagination from "../Commonality/CustomPagination.js"

/*防御日志列表组件*/
export default class ListDate extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            datalogList: false,//防御日志列表
            pageListAllNum: 0,//防御日志总页数
            currentPageNum: 1,//防御日志显示页
            totalLogsCount: 0,//防御日志总条数
            currentDataName: 'wafhttp'//防御日志请求类型
        }
        this.rowsPerPage = 10 //列表每页最多行数
    }

    /**
     * 防御日志请求接口
     * @param {*} pagenum 请求的页码数
     * @param {*} flag 请求的关键字
     */
    logListAjax(pagenum, flag) {
        // 防御日志请求接口
        var self = this;
        $.ajax({
            url: '/api/waflogfile/',
            type: 'POST',
            dataType: 'json',
            data: {
                pagenum: pagenum,//请求的页码数
                flag: flag,//请求关键字
                size: self.rowsPerPage //每页长度
            },
            cache: false,
            error: function () {//发送错误                
            },
            success: function (data) {//发送成功
                var len = data.length;
                self.setState({ //更新state数据
                    datalogList: data,
                    pageListAllNum: data[len - 1].totalpages,
                    currentDataName: flag,
                    totalLogsCount: data[len - 1].totalpages * self.rowsPerPage
                })
                //code为101页面失效
                if (data.code == "101") {
                    return;
                }
            }
        });
    }
    /**
     * 防御类型tab点击切换
     * @param {*} e 事件
     */
    changeTabDate(e) {
        $(e.target).addClass('onShowDate').siblings().removeClass('onShowDate');
        var names = $(e.target).attr("name")
        this.logListAjax(1, names)
        //将分页当前页码重新设置为1
        this.setState({
            currentPageNum: 1,
            datalogList:false,
        })
    }

    /**
     * 防御日志选择页码
     * @param {*} pageIndex 选择的页码
     */
    handleChangePage(pageIndex) {
        this.setState({
            currentPageNum: pageIndex,
            datalogList:false,
        })
        this.logListAjax(pageIndex, this.state.currentDataName) //根据新页码重新获取数据
    }

    /**
     * 防御日志,点击跳转
     */
    handleJumpPage() {
        var indexCurrent = parseInt($('#whitelistKey').val())   //获取当前输入的页码
        // input不为空的时候跳转到响应的页码数，并把input清空，为空时，return
        if ($('#whitelistKey').val() != '') {   //如果输入的页码不为空
            this.setState({
                currentPageNum: indexCurrent,
                datalogList:false,
            })
            this.logListAjax(indexCurrent, this.state.currentDataName) //根据新页码重新获取数据
            $('#whitelistKey').val('')  //清空页码输入框
        } else {
            return;
        }
    }

    /**
     * 防御日志列表的页码输入框中按键事件的监听
     * 处理回车事件
     * @param {*} e 事件
     */
    handleEnterPage(e) {
        e.stopPropagation()
        var re = /^\d+$/;
        var indexCurrent = parseInt($(e.target).val())  //获取页码输入框的内容
        //验证页码格式
        if (!re.test($(e.target).val())) {
            // 正则匹配不正确，则清空input
            $(e.target).val('')
        }
        if (indexCurrent > this.state.pageListAllNum) {
            //输入页码大于最大页码数，则默认设置为最大页码数
            $(e.target).val(this.state.pageListAllNum)
        }
        if (indexCurrent <= 0) {
            // 输入页码数小于等于0,则清空input
            $(e.target).val('')
        }
        if (e.keyCode == 13 && re.test($(e.target).val())) {
            // 当按下enter，且正则匹配正确时，等同于页码跳转的功能
            this.setState({
                currentPageNum: indexCurrent,
                datalogList:false,
            })
            this.logListAjax(indexCurrent, this.state.currentDataName);
            //  清空input
            $(e.target).val('')
        }
    }

    /**
     * 跳转输入框的onChange监听
     */
    onChangeInputPage(e) {
        var pagenum = e.target.value      //获取输入的页码
        //如果输入的页码不为空,并且如果输入的页码不符合规范(不是正整数，或者大于最大页码)
        if (pagenum != "" && (!isInt(pagenum) || pagenum == 0 || pagenum > this.state.pageListAllNum)) {
            $('#whitelistKey').val('');   //清空输入框的内容                       
        }
    }

    /**
     * 设置列表每页最多显示行数
     * @param {int} num 行数 
     */
    setRowsPerPage(num) {
        this.rowsPerPage = num
        this.setState({
            datalogList:false,
        })
        this.logListAjax(this.state.currentPageNum, this.state.currentDataName) //根据新页码重新获取数据
    }
    
    /**
     * 组件已经加载时的操作
     */
    componentDidMount() {
        this.logListAjax(1, "http-defense");//页面加载,获取http防御日志
    }

    render(){
        return (
            <div className="list-date">
                <h2 className="defense-date">防御日志</h2>
                {/*防御日志列表*/}
                <ul className="clearfix tab-date-list">
                    <li className="onShowDate data-list-title" onClick = {this.changeTabDate.bind(this)} name="http-defense">http防御</li>
                    <li className="data-list-title" onClick = {this.changeTabDate.bind(this)} name="dos-attack">Dos攻击防御</li>
                    <li className="data-list-title" onClick = {this.changeTabDate.bind(this)} name="web-attack">Web攻击防御</li>
                    <li className="data-list-title" onClick = {this.changeTabDate.bind(this)} name="sensitive-data-tracking">敏感数据追踪</li>
                    <li className="data-list-title" onClick = {this.changeTabDate.bind(this)} name="identification-error">应用程序鉴定和检测</li>
                </ul>
                <table className="wafWallTable">
                    <thead>
                    <tr>
                        <th>时间</th>
                        <th>类型</th>
                        <th>攻击源IP</th>
                        <th>恶意请求</th>
                        <th>IP</th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        this.state.datalogList && this.state.datalogList.map(function(list,index){
                            return (
                                <tr key={index}>
                                    <td>{list.inter_time}</td>
                                    <td>{list.defend_type}</td>
                                    <td>{list.inter_source}</td>
                                    <td>{list.inter_tool}</td>
                                    <td>{list.inter_ip}</td>
                                </tr>
                            )
                        })
                    }
                   
                    </tbody>
                </table>
                {
                    !this.state.datalogList &&
                    <LoadingText/>
                }
                {/*分页器*/}
                <CustomPagination
                    from={this.state.currentPageNum?(this.state.currentPageNum-1)*this.rowsPerPage : 0 }
                    to={this.state.currentPageNum? (this.state.currentPageNum-1)*this.rowsPerPage + this.state.datalogList.length-1 : 0}
                    totalItemsCount={this.state.totalLogsCount}
                    totalPagesCount={this.state.pageListAllNum}
                    currentPage={this.state.currentPageNum}
                    onChangeRowsPerPage={(num)=>this.setRowsPerPage(num)}
                    onSelectPage={(e)=>this.handleChangePage(e)}
                    onChangePageInput={(e)=>this.onChangeInputPage(e)}
                    onPageInputKeyDown={(e)=>this.handleEnterPage(e)}
                    onClickJumpButton={()=>this.handleJumpPage()}
                    pageNumInputId="whitelistKey"
                />
            </div>
        )
    }
}
