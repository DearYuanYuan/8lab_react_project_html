import React from "react"
import $ from "jquery";

import { Tabs, Tab, Pagination, ButtonToolbar, Button } from 'react-bootstrap';　  //引入bootstrap组件
import { myClearInterval, isInt, isIP } from "../../utils/utils.js";
import DropdownList from "../Commonality/DropdownList" //下拉列表组件

export default class AlarmList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            alarmDetailShow: false,
            alarmTitle: '异常行为历史警告',             //面包屑
        }
        this.sourceTypes = [      //搜索时源的类型
            {
                name: '异常行为警告',         //显示在下拉列表中
                value: '2'                 //选中时传递的值
            }, {
                name: '系统警告',
                value: '3'
            }, {
                name: '用户画像警告',
                value: '4'
            }, {
                name: '显示所有',
                value: '-1'
            }
        ]
        this.pageCount = 0;     //总页数
        this.pageSize = 8;      //当前页显示的最多的个数
        this.currentPage = 1;   //当前页码，默认为1
        this.alarm_type = 2;
        this.searchItem = null;
    }
    /**
     * 选择页码的监听
     */
    handleSelectPage(eventkey) {
        this.currentPage = eventkey
        this.getHostList();
        this.initialAllCheckbox();
    }

    /**
     * 点击跳转按钮的监听
     */
    handleJumpPage() {
        this.currentPage = parseInt($('#hostlistPage').val())
        this.getHostList();
        this.initialAllCheckbox();
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

    /**
     * 跳转输入框的onChange监听
     */
    onChangeInputPage(e) {
        var hostlistPage = e.target.value      //获取输入的页码
        //如果输入的页码不为空,并且如果输入的页码不符合规范(不是正整数，或者大于最大页码)
        if (hostlistPage != "" && (!isInt(hostlistPage) || hostlistPage == 0 || hostlistPage > this.pageCount)) {
            $('#hostlistPage').val('');   //清空输入框的内容                       
        }
    }

    /*===================================================== 主机列表的操作 ============================================== */
    /**
     * 获取主机列表的数据，更新state
     */
    getHostList() {
        var self = this;
        var test= [
            {
                'id': '216883',
                'ip': '192.168.1.235',
                'alarm_type': 2,
                'type_info': '异常行为',
                'hostname': 'vtpm-t2',
                'time': '2018-05-08 15:39:44'
            },
            {
                'id': '216883',
                'ip': '192.168.1.235',
                'alarm_type': 3,
                'type_info': '系统',
                'hostname': 'vtpm-t2',
                'time': '2018-05-08 15:39:44'
            }
        ]

        $.ajax({
            url: '/api/alarm/get_alarm_records_by_count/',
            type: 'GET',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: {                         //表单数据
                page: self.currentPage,
                size: self.pageSize,
                keyword: self.searchItem,
                alarm_type: self.alarm_type,
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            traditional: true,          //阻止JQuery深度序列化对象
            success: function (result) {
                if (result) {
                    self.pageCount = Math.ceil(result.totalpage / self.pageSize);
                    self.setState({
                        hostlist:result.curr_page
                    })
                }
            },
            error: function () {
            }
        })

        // this.initialAllCheckbox(); //恢复所有复选框到未选中状态
    }

    /**
     * 恢复所有复选框到未选中状态
     */
    initialAllCheckbox() {
        $('.hostlist-hostname input').prop('checked', false);
    }

    componentWillMount() {
        this.getHostList();
        this.initialAllCheckbox();
        // this.getLocalIP()        
    }
    /**
     * 搜索输入框内容变化时的监听
     */
    onChangeSearchInput() {
        this.searchItem = $('#searchAlarmInput').val();
    }
    /**
     * 当搜索主机输入框中有按键事件时的操作
     * @param {*} e 事件
     */
    searchKeyDown(e) {
        if (e.keyCode === 13) {               //如果按下的键是回车键
            this.handleSearchHost()
        }
    }

    /**
     * 点击搜索按钮的监听
     * 按照输入框中的内容搜索主机
     */
    handleSearchHost() {
        //搜索时默认无排序，重置所有的排序选项
        this.currentPage = 1;   //默认回到第一页
        this.getHostList();
        this.initialAllCheckbox();
    }
    onChangeRange(item) {
        this.alarm_type = item;
        this.currentPage = 1;   //默认回到第一页
        this.getHostList()
        this.initialAllCheckbox();
    }

    alarmList(id) {
        var self = this;
        this.setState({
            alarmDetailShow: true,
            alarmTitle: `异常行为历史警告 / ${id}`,
        })
        var qqq = [
            {
                'id': '216883',
                'ip': '192.168.1.235',
                'alarm_type': 2,
                'type_info': '异常行为',
                'alarm_info': '{"ip":"","file_error_path":"","file_error_hash":""}',
                'hostname': 'vtpm-t2',
                'time': '2018-05-08 15:39:44'
            },

        ]

        $.ajax({
            url: "/api/alarm/get_alarm_details/",
            type: "GET",
            dataType: "json",
            data: {id:id},
            success(data) {
               self.setState({
                alarmList_ip:data[0]['ip'],
                alarmList_id:data[0]['id'],
                alarmList_hostname:data[0]['hostname'],
                alarmList_time:data[0]['time'],
                alarmList_type:data[0]['type_info'],
                alarmList_info:data[0]['alarm_info'],
               })
            },
        })

    }

    alarmDetailHide() {
        this.setState({
            alarmDetailShow: false,
            alarmTitle: '用户列表',
        })
    }
    render() {
        //通过下拉列表选项要传递的值获取数组中对应的对象。
        //此方法用于下拉列表设置 itemDefault
        var getItemByValue = function (value, itemList) {
            for (var i = 0; i < itemList.length; i++) {
                if (itemList[i].value == value) {
                    return itemList[i]
                }
            }
        }
        return (
            <div className='warning-mode settings-mode'>
                <h2 className="content-title" onClick={() => this.alarmDetailHide()}>

                    {this.state.alarmTitle}
                </h2>

                {!this.state.alarmDetailShow &&
                    <div>
                        <div className="container">
                            <div className='clearfix' style={{ margin: '20px 0' }}>
                                <DropdownList
                                    listID="alarm-list-dropdown"
                                    itemsToSelect={this.sourceTypes}
                                    onSelect={(item) => this.onChangeRange(item)}
                                    itemDefault={getItemByValue(this.state.source, this.sourceTypes)} />

                                <div style={{ float: 'right', }}>

                                    <input style={{ width: '270px', float: 'left' }} id="searchAlarmInput" type="text" placeholder="搜索别名或IP" className="form-control input-search"
                                        onChange={this.onChangeSearchInput.bind(this)} onKeyDown={this.searchKeyDown.bind(this)}
                                    />
                                    <button style={{ float: 'right', marginLeft: '20px' }} className="btn-search btn btn-sm btn-primary" onClick={this.handleSearchHost.bind(this)}>搜索</button>
                                </div>
                            </div>




                        </div>



                        {/*主机列表的表格*/}
                        <table className="hostlist-table">
                            <thead>
                                <tr>
                                    <th className="hostlist-hostname">
                                        {/* <input type="checkbox" id="hostlist-checkbox-all" className="custom-checkbox"></input>
                                        <label htmlFor="hostlist-checkbox-all" ></label>自定义的复选框样式*/}
                                        ID
                           <i className={this.sortByHostname == 0 ? "fa fa-angle-up" : "fa fa-angle-down"}
                                            aria-hidden="true" ></i>
                                    </th>
                                    <th className="hostlist-hostip">
                                        报警类型
                           <i className={this.sortByIP == 0 ? "fa fa-angle-up" : "fa fa-angle-down"}
                                            aria-hidden="true" ></i>
                                    </th>
                                    <th className="hostlist-description">IP</th>
                                    <th className="hostlist-status">
                                        hostname
                           <i className={this.sortByStatus == 0 ? "fa fa-angle-up" : "fa fa-angle-down"}
                                            aria-hidden="true" ></i>
                                    </th>
                                    <th className="hostlist-status">
                                        时间
                           <i className={this.sortByStatus == 0 ? "fa fa-angle-up" : "fa fa-angle-down"}
                                            aria-hidden="true" ></i>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.state.hostlist && this.state.hostlist.map(function (hostDetail, index) {
                                    return (
                                        <tr className="hostlist-detail" key={index} onClick={() => this.alarmList(hostDetail.id)}>
                                            <td className="hostlist-hostname">
                                                {/*  <input type="checkbox" id={"hostlist-checkbox-" + index} className="custom-checkbox"></input>
                                                <label htmlFor={"hostlist-checkbox-" + index} ></label>自定义的复选框样式*/}
                                                {hostDetail.id}
                                            </td>
                                            <td className="hostlist-hostip">{hostDetail.type_info}</td>
                                            <td className="hostlist-description">{hostDetail.ip}</td>
                                            <td className="hostlist-status">{hostDetail.hostname}</td>
                                            <td className="hostlist-status">{hostDetail.time}</td>
                                        </tr>
                                    )
                                }.bind(this))
                                }
                                {
                                    (!this.state.hostlist || !this.state.hostlist.length) && <tr className="hostlist-detail"><td>当前没有匹配的数据。</td></tr>
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
                                items={this.pageCount}
                                maxButtons={7}
                                activePage={this.currentPage}
                                onSelect={this.handleSelectPage.bind(this)} />
                            {/*页码跳转输入框*/}
                            <div className="pageCount">
                                <input
                                    className="pageNum"
                                    id="hostlistPage"
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

                }

                {this.state.alarmDetailShow &&
                    <div className='container' style={{ marginTop: '20px' }}>


                        <table className="alarm-detail-table" >
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>报警类型</th>
                                    <th>IP</th>
                                    <th>hostname</th>
                                    <th>时间</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{this.state.alarmList_id}</td>
                                    <td>{this.state.alarmList_type}</td>
                                    <td>{this.state.alarmList_ip}</td>
                                    <td>{this.state.alarmList_hostname}</td>
                                    <td>{this.state.alarmList_time}</td>
                                </tr>
                            </tbody>
                        </table>


                        <div className="alarm-log">
                            <div className="alarm-log-title">详细日志</div>
                            <pre>{`"${this.state.alarmList_info}"`} </pre>
                        </div>
                    </div>


                }


            </div>
        )
    }

}