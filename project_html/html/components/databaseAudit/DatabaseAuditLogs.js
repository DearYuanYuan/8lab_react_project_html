/**
 * 数据库审计标签页的审计日志模块
 * created by ZHONG Mengting
 * on 2017/04/21
 */
import React from "react";
import $ from "jquery";
import {isInt} from "../../utils/utils.js";
import 'bootstrap-datepicker';  //引入bootstrap-datepicker日期选择器
import LoadingText from "../Commonality/LoadingText";
import {Form, FormGroup, FormControl, Button, Table} from 'react-bootstrap';     //引入react-bootstrap中的组件
import CustomPagination from "../Commonality/CustomPagination.js"

//数据库审计日记的组件
export default class DatabaseAuditLogs extends React.Component{
    constructor(props) {
        super(props);
        this.state={
            logsDetailList: this.props.logsDetailList,      //审计日志列表
            currentIP: this.props.currentIP,                //当前ip
            pageCount: this.props.pageCount,                //日志总共的页数
        }
    }

    /**
     * 当组件将要接收新的props时执行，初始化render时不执行
     * @param {*} nextProps 新的props
     */
    componentWillReceiveProps (nextProps) {
        //如果props没有发生变化，直接返回
        if(JSON.stringify(this.props.logsDetailList) == JSON.stringify(nextProps.logsDetailList) &&
            this.props.currentIP == nextProps.currentIP &&
            this.props.pageCount == nextProps.pageCount) return;
        //如果props发生变化了，将获取的props设置为组件的state
        this.setState({
            logsDetailList: nextProps.logsDetailList,
            currentIP: nextProps.currentIP,
            pageCount: nextProps.pageCount,
        });
    }
    
    /**
     * 组件加载之后的操作
     * 启用日期选择器
     */
    componentDidMount() {
        /*日历选中器添加中文 */
        $.fn.datepicker.dates['zh-CN'] = {
            days: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
            daysShort: ["日", "一", "二", "三", "四", "五", "六"],
            daysMin: ["日", "一", "二", "三", "四", "五", "六"],
            months: ["一月","二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
            monthsShort: ["一","二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"],
            today: "今天",
            clear: "清空",
            format: "yyyy/mm/dd",
            titleFormat: "yyyy MM", /* Leverages same syntax as 'format' */
            weekStart: 1
        };
        /*启用日历选择器*/
        $('.datepicker .form-control').datepicker({
            autoclose: true,    //选中一个日期之后选择器自动隐藏
            format:"yyyy-mm-dd",//日期字符串的格式
            weekStart: 1, //0为周日，1为周一
            todayBtn: "linked", //显示‘今天’的按钮
            clearBtn: true,     //显示‘清空’的按钮
            language: "zh-CN",  //语言为中文
            endDate: "today",   //截止为今天
            orientation: "auto",    //弹出的选择器显示的方位
            todayHighlight: true,   //突出显示‘今天’
        });
    }
    
    /**
     * 当页码输入框中有按键事件时的操作
     * @param {*} e 事件
     */
    jumpPageKeyDown(e){
        if(e.keyCode === 13){           //当按下的键是回车键
            this.props.handleJumpPage() //调用父组件的方法，实现页码跳转
        }
    }

    /**
     * 当页码输入框的内容发生改变时的操作
     * @param {*} e 事件
     */
    onChangeInputPage(e) {
        var auditLogsPage = e.target.value      //获取输入的页码
        //如果输入的页码不为空,并且如果输入的页码不符合规范(不是正整数，或者大于最大页码)
        if ( auditLogsPage != "" && (!isInt(auditLogsPage) || auditLogsPage == 0 || auditLogsPage > this.state.pageCount)) {
            $('#auditLogsPage').val('');   //清空输入框的内容                       
        }
    }

    /**
     * 当搜索日志输入框中有按键事件时的操作
     * @param {*} e 事件
     */
    searchKeyDown(e){
        if(e.keyCode === 13){               //如果按下的键是回车键
            this.props.searchByKeyword()    //调用父组件的搜索日志的方法
        }
    }

    render(){
        return (
            <section>
                {/*审计日志模块的顶部，包含按钮等*/}
                <header><p>审计日志</p><hr/></header>
                <div className="dblogs-bt-group clearfix">
                    <div className="group-left">
                        <Button bsStyle="default" bsSize="sm" onClick={this.props.exportLogs.bind(this)}>导出日志</Button>
                    </div>                    
                    <div className="group-right">                        
                        <FormGroup>  
                            {/*日期选择器*/}
                            <div className="input-group datepicker" data-provide="datepicker">
                                <input type="text" placeholder="请选择日期..." className="form-control"/>
                            </div>
                            <FormControl id="auditlogs-keyword" type="text" placeholder="输入关键字搜索日志" className="input-text"
                                onKeyDown={this.searchKeyDown.bind(this)}/>
                            <Button bsStyle="primary" bsSize="sm" onClick={this.props.searchByKeyword.bind(this)}>搜索</Button>
                        </FormGroup>                          
                    </div>
                </div>
                {/*审计日志的表格*/}
                <table>
                    <thead>
                    <tr>
                        <th className="logslist-date">时间</th>
                        <th className="logslist-user">用户</th>
                        <th className="logslist-host">Host</th>
                        <th className="logslist-db">数据库</th>
                        <th className="logslist-name">表</th>
                        <th className="logslist-query">请求指令</th>
                    </tr>
                    </thead>
                    <tbody>
                        {this.state.logsDetailList&&this.state.logsDetailList.map(function(logsDetail,index){
                            return (
                                <tr className="logsDetail" key={index}>
                                    <td className="logslist-date">{logsDetail.date}</td>
                                    <td className="logslist-user">{logsDetail.user}</td>
                                    <td className="logslist-host">{logsDetail.host}</td>
                                    <td className="logslist-db">{logsDetail.db}</td>
                                    <td className="logslist-name">{logsDetail.name}</td>
                                    <td className="logslist-query">{logsDetail.query}</td>
                                </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
                {
                    !this.state.logsDetailList&&
                    <LoadingText/>

                }
                {/*审计日志的页码*/}
                <CustomPagination
                    from={this.props.currentPage?(this.props.currentPage-1)*this.props.rowsPerPage : 0 }
                    to={this.props.currentPage? (this.props.currentPage-1)*this.props.rowsPerPage + this.state.logsDetailList.length : 0}
                    totalItemsCount={this.props.totalLogsCount}
                    totalPagesCount={this.props.pageCount}
                    currentPage={this.props.currentPage}
                    onChangeRowsPerPage={(num)=>this.props.setRowsPerPage(num)}
                    onSelectPage={(e)=>this.props.handleSelectLogsPage(e)}
                    onChangePageInput={(e)=>this.onChangeInputPage(e)}
                    onPageInputKeyDown={(e)=>this.jumpPageKeyDown(e)}
                    onClickJumpButton={()=>this.props.handleJumpPage()}
                    pageNumInputId="auditLogsPage"
                />
            </section>
        )
    }
}