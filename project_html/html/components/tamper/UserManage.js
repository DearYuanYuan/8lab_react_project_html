import React from "react";                                     //react
import $ from 'jquery';                                        //jquery
import { Pagination } from 'react-bootstrap';                  //bootstrap分页插件
import LoadingText from "../Commonality/LoadingText";          //加载中组件
import AddRootPath from "./AddRootPath";　　　　　　　　　　　　　　//新增跟目标
import MessageBox from "../Commonality/MessageBox";  　　　　　　//消息提示框
import AllotRootPath from "./AllotRootPath";                   //分配跟目录
require('../../styles/ClientData.less');


//用户管理组件
export default class UserManage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userListShow: true,　　　　　　　　　　//用户列表默认显示
            clientData: null,                  //用户列表数据
            isLoading: false,                  //loading状态
            isError: false,                    //error状态
            pageIndex: 1,                      //当前页
            pageCount: 1,                      //总页码
            userDetailList: [],                //用户详情数据
            userDetailListShow: false,         //用户详情是否显示
            userDetail: '用户列表',             //面包屑
            showAddRootPath: false,            //新增根目录默认不显示
            showAllotRootPath: false,          //分配根目录默认不显示

            rootPathError: false,              //根目录error状态
            rootPathLoading: false,            //根目录loading状态
            username: '',  　　　　　　　　　　　　//用户详情名字　
            status: '',                        //用户详情状态
            position: '',                      //用户详情职位
            phone: '用户暂未填写',               //用户详情电话
            email: '用户暂未填写',               //用户详情邮箱
            department: '',                    //用户详情部门
            host: [],                          //所有的可访问主机
            hostListIndex: 0,                  //默认第一个主机呈高亮
            hostList: [],                      //用户管理根目录分配显示的所有根目录
            currentHost: '',                   //当前选中的主机

            selectUserList: '',                //选中的主机列表



            showMsgBox: false,                   //不显示消息提示框
            msgContent: '',                      //提示框的提示消息
            msgButtonState: false,               //提示框中的按钮状态
            msgButtonName: "",                   //提示框中的按钮名称
            isShowedBadBehaveSetting: false,     //恶意行为弹出框
        }
    };


    /**
    * 消息弹出框的按钮点击事件的监听
    */
    handleConfirmMsgBox() {
        this.setState({
            showMsgBox: false,
        })
    }


    /**
     * 改变页码上下翻页操作
     * 
     * @param {any} eventKey 
     * @memberof UserManage
     */
    handleChange(eventKey) {
        this.setState({
            pageIndex: eventKey,
        });
        this.getClientData(eventKey)
    }



    /**
    * 用户改变input输入框页码
    * 
    * @param {any} e 
    * @memberof UserManage
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
        if (e.keyCode == 13 && re.test($(e.target).val())) {    // 分页input回车
            this.getClientData(indexCurrent)
        }
    }


    /**
     * 获取用户操作日志数据
     * 
     * @param {any} pageIndex 需要获取的对应页数据
     * @memberof UserManage
     */
    getClientData(pageIndex) {
        var self = this;
        //请求之前设置loading状态开启
        this.setState({
            isLoading: true
        })
        $.ajax({
            url: "/api/tamper_proof/get_user_list/",
            type: "POST",
            dataType: "json",
            data: {
                "service_type": "web",
                username: this.props.tamperUsrName,
                token: this.props.tamperUsrToken,
                is_super: this.props.tamperIsSuper,
                pageIndex: pageIndex,
            },
            success(data) {
                //如果有数据则渲染没有则开启error状态
                if (data.length) {
                    self.setState({
                        isLoading: false,
                        isError: false,
                        clientData: data[0].result,
                    })
                }
                if (data[0].status == 'FAILURE') {
                    self.setState({
                        isLoading: false,
                        isError: true,
                    })
                }
            },
            error(data) {
                self.setState({
                    isLoading: false,
                    isError: true,
                })
            }
        })
    }


    /**
     * 
     * @param {any} userName   用户名字
     * @param {any} is_super   是否是超级用户
     * @param {any} status     状态
     * @param {any} position 　职位
     * @param {any} phone 　　　电话
     * @param {any} email      邮箱
     * @param {any} department 部门
     * @param {any} index      当前的用户的index
     * @memberof UserManage
     */
    userDetailList(userName, is_super, status, position, phone, email, department, index) {
        var self = this;
        this.setState({
            userDetailListShow: true,
            userDetail: `用户列表 / ${userName}`,
            userListShow: false,
            rootPathLoading: true,
            username: userName.length ? userName : '用户暂未填写',
            status: status,
            position: position.length ? position : '用户暂未填写',
            phone: phone.length ? phone : '用户暂未填写',
            email: email.length ? email : '用户暂未填写',
            department: department.length ? department : '用户暂未填写',
            is_super: is_super
        })
        //发送的data
        var submitData = {
            "service_type": "web",
            username: userName,
            token: this.props.tamperUsrToken,
            is_super: is_super
        }
        var userIndex = index || 0
        $.ajax({
            url: "/api/tamper_proof/get_user_detail/",
            type: "POST",
            dataType: "json",
            data: submitData,
            success(data) {
                //将所有的主机名字罗列出来
                if (data.length) {
                    $(":checkbox").prop("checked", false)
                    var hostlist = []
                    for (var i = 0; i < data.length; i++) {
                        for (var key in data[i]) {
                            if (key !== 'status')
                                hostlist.push(key)
                        }
                    }

                    //如果有数据则渲染
                    self.setState({
                        username: userName,
                        rootPathLoading: false,                     //Loading状态关闭
                        rootPathError: false,                       //error状态关闭
                        userDetailList: data,                       //数据赋值
                        hostListIndex: userIndex,
                        host: hostlist,                             //所有的Host设置
                        hostList: data[userIndex][hostlist[userIndex]],     //根据Ｉｎｄｅx 传入的值来确定当前List显示的内容
                        currentHost: hostlist[userIndex]                //当前的Host
                    })
                } else {
                    self.setState({
                        rootPathLoading: false,                     //Loading状态关闭
                        rootPathError: false,
                        host: [],
                        hostList: []
                    })
                }
            },
            //没有数据显示error状态
            error() {
                self.setState({
                    rootPathLoading: false,            　　　　　　　　//Loading状态关闭
                    rootPathError: true,
                })
            }
        })
    }


    /**
     * 隐藏用户详情
     * 
     * @memberof UserManage
     */
    userDetailHide() {
        this.setState({
            userDetailListShow: false,
            userDetail: '用户列表',
            userListShow: true,
        })
    }


    /**
     * 全选操作
     * 
     * @memberof UserManage
     */
    AllCheckStatus() {
        var Allchecked = $("#userManageSelAll").prop("checked");
        var checkList = $(":checkbox").not($("#userManageSelAll"))
        if (Allchecked) {
            for (let i = 0; i < checkList.length; i++) {
                checkList[i].checked = false;
            }
        }
        else {
            for (let i = 0; i < checkList.length; i++) {
                checkList[i].checked = true;
            }
        }
    }

    /**
     * 删除根路径操作
     * 
     * @returns 
     * @memberof UserManage
     */
    DeleteRootPath() {
        var self = this;
        var data = [];
        var RUDlis = $("input:checkbox[name='userManageCheckbox']:checked")
        for (var i = 0; i < RUDlis.length; i++) {
            data.push($(RUDlis[i]).attr("title"))
        }
        data = {
            "service_type": "web",
            username: this.state.username,
            token: this.props.tamperUsrToken,
            is_super: this.props.tamperIsSuper,
            host_name: this.state.currentHost,
            root_path: JSON.stringify(data)
        };
        $.ajax({
            url: "/api/tamper_proof/cancel_root_path/",
            dataType: "json",
            type: "POST",
            data: data,
            beforeSend() {
                if (!RUDlis.length) {
                    self.setState({
                        showMsgBox: true,
                        msgContent: `请选择您要删除的根路径`,
                        msgButtonState: true,
                        msgButtonName: '确认',
                    })
                    return false;
                }
            },
            success(data) {
                if (data[0].status == 'FAILURE') {
                    self.setState({
                        showMsgBox: true,
                        msgContent: '删除根路径失败',
                        msgButtonState: true,
                        msgButtonName: '确认',
                    })
                }
                if (data[0].status == 'SUCCESS') {
                    self.userDetailList(self.state.username, self.state.is_super, self.state.status, self.state.position, self.state.phone, self.state.email, self.state.department, self.state.hostListIndex)

                }
            },
            error() {
                self.setState({
                    showMsgBox: true,
                    msgContent: '删除根路径失败',
                    msgButtonState: true,
                    msgButtonName: '确认',
                })
            },
        })
    }

    /**
     * 取消授权
     * 
     * @returns 
     * @memberof UserManage
     */
    cancelAuthorization() {
        var self = this;
        var data = [];
        var RUDlis = $("input:checkbox[name='userManageCheckbox']:checked")
        for (var i = 0; i < RUDlis.length; i++) {
            data.push($(RUDlis[i]).attr("title"))
        }
        data = {
            username: this.state.username,
            token: this.props.tamperUsrToken,
            is_super: this.props.tamperIsSuper,
            host_name: this.state.currentHost,
            root_path: JSON.stringify(data),
            "service_type": "web",
        };
        $.ajax({
            url: "/api/tamper_proof/revoke_user_root_path/",
            dataType: "json",
            type: "POST",
            data: data,
            beforeSend() {
                if (!RUDlis.length) {
                    self.setState({
                        showMsgBox: true,
                        msgContent: `请选择您要取消授权的目录`,
                        msgButtonState: true,
                        msgButtonName: '确认',
                    })
                    return false;
                }
            },
            success(data) {
                if (data[0].status == 'FAILURE') {
                    self.setState({
                        showMsgBox: true,
                        msgContent: '取消授权失败',
                        msgButtonState: true,
                        msgButtonName: '确认',
                    })
                }
                if (data[0].status == 'SUCCESS') {
                    self.userDetailList(self.state.username, self.state.is_super, self.state.status, self.state.position, self.state.phone, self.state.email, self.state.department, self.state.hostListIndex)

                }
            },
            error() {
                self.setState({
                    showMsgBox: true,
                    msgContent: '取消授权失败',
                    msgButtonState: true,
                    msgButtonName: '确认',
                })
            },
        })
    }

    /**
     * 显示新增根目录
     * 
     * @memberof UserManage
     */
    showAddRootPath() {
        this.setState({ showAddRootPath: true })
    }

    /**
     * 显示分配根目录
     * 
     * @memberof UserManage
     */
    showAllotRootPath() {
        this.setState({ showAllotRootPath: true })
    }

    /**
     * 隐藏新增根目录
     * 
     * @memberof UserManage
     */
    hideAddRootPath() {
        this.setState({ showAddRootPath: false })
    }

    /**
     * 隐藏分配根目录
     * 
     * @memberof UserManage
     */
    hideAllotRootPath() {
        this.setState({ showAllotRootPath: false })
    }

    // /**
    //  * 
    //  * 
    //  * @param {any} e 
    //  * @memberof UserManage
    //  */
    // checkSingle(e) {
    //     if ($(e.target).hasClass('cancel')) {
    //         $(e.target).addClass('slector').removeClass('cancel')
    //     } else {
    //         $(e.target).addClass('cancel').removeClass('slector')
    //     }

    // }



    /**
     * 全选操作
     * 
     * @param {any} e 
     * @memberof UserManage
     */
    handleSelectAllOption(e) {
        let userlist = [];
        if ($(e.target).is('.onselect')) {
            $(e.target).removeClass('onselect')
            $('.userDataList td>.select').removeClass('onselect')
            this.setState({
                selectUserList: userlist,
            })
        } else {
            $(e.target).addClass('onselect')
            $('.userDataList td>.select').addClass('onselect')
            $('.userDataList td>.select').each(function () {
                userlist.push($(this).attr('title'))
            });
            userlist = userlist.join("#")

            this.setState({
                selectUserList: userlist,
            })
        }
        //每点击一次选择框，都要做处理，生成新的this.state.selectFileOptions
    }


    /**
     * 单选
     * 
     * @param {any} e 
     * @memberof UserManage
     */
    userManageSelector(e) {
        e.stopPropagation();
        $(e.target).toggleClass('onselect')
        this.allchk()
    }

    /**
     * 检测如果当前页所有的单选框选中状态，则设全选也为选中状态
     * 
     * @memberof UserManage
     */
    allchk() {
        var chknum = $('.userDataList td>.select').size();//选项总个数 
        var chk = 0;

        let userlist = [];
        $('.userDataList td>.select').each(function () {
            if ($(this).hasClass("onselect") == true) {
                chk++;
                userlist.push($(this).attr('title'))
            }

        });
        userlist = userlist.join("#")
        this.setState({
            selectUserList: userlist,
        })
        if (chknum == chk) {//全选 
            $('.userDataList th>.select').addClass('onselect')
        } else {//不全选 
            $('.userDataList th>.select').removeClass('onselect')
        }
    }


    /**
     * 停用启用账号
     * 
     * @param {any} operation 　停用｜｜启用
     * @returns 
     * @memberof UserManage
     */
    controlAccount(operation) {
        var operationStr = operation == 'authorized' ? '启用' : '停用'
        var self = this
        $.ajax({
            url: "/api/tamper_proof/switch_user_status/",
            dataType: "json",
            type: "POST",
            data: {
                "service_type": "web",
                ids: self.state.selectUserList,
                authorized: operation,
                token: this.props.tamperUsrToken,
            },
            beforeSend() {
                if (!self.state.selectUserList.length) {
                    self.setState({
                        showMsgBox: true,
                        msgContent: `请选择您要${operationStr}的账号`,
                        msgButtonState: true,
                        msgButtonName: '确认',
                    })
                    return false;
                }
            },
            success(data) {
                self.getClientData(self.state.pageIndex)
            },
            error() {
                self.setState({
                    showMsgBox: true,
                    msgContent: `${operationStr}账号失败`,
                    msgButtonState: true,
                    msgButtonName: '确认',
                })
            },
        })
    }


    /**
     * 根据当前选中的主机，确定需要展示的列表
     * 
     * @param {any} e 
     * @param {any} index 
     * @memberof UserManage
     */
    changeHostList(e, index) {
        $(e.target).css('background', '#007AE1')
        $(e.target).parent('tr').siblings('tr').find('td').css('background', 'transparent')
        this.userDetailList(this.state.username, this.state.is_super, this.state.status, this.state.position, this.state.phone, this.state.email, this.state.department, index)
    }

    componentWillMount() {
        this.getClientData(1);
    }

    render() {
        return (
            this.props.tabKey == 6 &&
            <div>
                <div className="tamper-list-li tamper-list-li6 " onClick={() => this.userDetailHide()}>{this.state.userDetail}</div>
                <div className="version-msg-list userDataList">
                    {this.state.isLoading && <LoadingText />}

                    {this.state.isError && <div className="ClientError">加载失败!</div>}
                    {this.state.clientData && !this.state.isLoading && !this.state.isError && this.state.userListShow &&
                        <div>

                            <div className='userMangeCtr'>
                                <button className="btn-pause-protection btn btn-sm btn-default" onClick={() => this.controlAccount('unauthorized')} >
                                    停用账号
                                 </button>
                                <button className="btn-pause-protection btn btn-sm btn-default" onClick={() => this.controlAccount('authorized')} >
                                    启用账号
                                </button>

                                {/*
                                <div className='searchPlugin'>
                                    <input placeholder='搜索用户'  className='form-control'/>
                                    <button className='btn btn-sm btn-primary'>搜索</button>
                                </div>*/}
                            </div>

                            <table>
                                <thead>
                                    <tr>
                                        <th><div className='select' onClick={(e) => this.handleSelectAllOption(e)}></div></th>
                                        <th>用户</th>
                                        <th>用户类型 </th>
                                        <th>账号状态 </th>
                                        <th>部门 </th>
                                        <th>职位 </th>
                                        <th>操作 </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.userListShow && this.state.clientData.map(function (item, index) {
                                        return (
                                            <tr key={index} >
                                                <td><div className='select' title={item.id} onClick={(e) => this.userManageSelector(e)}></div></td>
                                                <td>{item.username}</td>
                                                {item.is_super == 0 ? <td>用户</td> : <td style={{ color: '#32A1FF' }}>管理员</td>}
                                                {item.status == 'authorized' ?
                                                    <td ><div className='authorized'>正常</div></td> :
                                                    <td><div className='unauthorized'>已停用</div></td>
                                                }

                                                <td>{item.department}</td>
                                                <td>{item.position}</td>
                                                <td style={{ cursor: "pointer", color: '#32a1ff' }} onClick={() => this.userDetailList(item.username, item.is_super, item.status, item.position, item.phone, item.email, item.department)}>用户详情</td>
                                            </tr>
                                        )
                                    }.bind(this))}
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

                    {this.state.userDetailListShow &&
                        <div className='userDetailManage' >
                            <div className='clearfix'>
                                <img src="/static/img/userImg.jpg" alt="" />
                                <div className="userIntroduce">
                                    <h4>{this.state.username}</h4>
                                    <p>Identification</p>
                                    <div className="userManageLine"></div>
                                    <p>职位 : {this.state.position}</p>
                                    <p>部门 : {this.state.department}</p>
                                    <p>状态 : {this.state.status}</p>
                                </div>
                                <div className="userManageContact">
                                    <div><span className="icon-left"><i className="fa fa-envelope fl" aria-hidden="true"></i></span><span className='userManage-left'>邮箱 : </span>{this.state.email}</div>
                                    <div><span className="icon-left"><i className='fa fa-phone fl' aria-hidden="true"></i></span><span className='userManage-left'>电话 : </span>{this.state.phone}</div>
                                </div>
                            </div>
                            <div className="clearfix  userDetailManage-bottom">
                                <div className="addressableServer">
                                    <p> 可访问主机</p>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>可访问主机</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {this.state.host == 0 &&
                                                <tr><td>暂时没有可访问的主机</td></tr>
                                            }
                                            {this.state.host && this.state.host.map(function (host, index) {
                                                var StringHost = this.state.userDetailList[0][host];
                                                StringHost = JSON.stringify(StringHost)

                                                return (
                                                    <tr key={index}>
                                                        {index == 0 ?
                                                            <td name={StringHost} style={{ backgroundColor: "#007AE1" }} onClick={(e) => this.changeHostList(e, index)}>{host}</td> :
                                                            <td name={StringHost} onClick={(e) => this.changeHostList(e, index)}>{host}</td>}
                                                    </tr>
                                                )
                                            }.bind(this))}


                                        </tbody>
                                    </table>
                                </div>
                                <div className="rootDic clearfix">
                                    <p className='fl' style={{ float: 'left' }}> 根目录分配</p>
                                    {this.state.is_super == 0 && <div className="allotRootDic" onClick={() => this.showAddRootPath()} >分配根目录</div>}
                                    {this.state.is_super == 1 && <div className="allotRootDic" onClick={() => this.DeleteRootPath()} >取消根目录</div>}
                                    <div className="addRootDic" onClick={() => this.showAllotRootPath()} >新建根目录</div>
                                    {this.state.rootPathError && <div className='ClientError'>获取根目录失败</div>}
                                    {this.state.rootPathLoading && <LoadingText />}
                                    {!this.state.rootPathError && !this.state.rootPathLoading && this.state.hostList &&
                                        <div className='clearfix'>

                                            {this.state.is_super == 0 && <div className="deleteRootDic" onClick={() => this.cancelAuthorization()}>取消授权</div>}
                                            <table>

                                                <thead>
                                                    <tr>
                                                        <th><input type="checkbox" id="userManageSelAll" className="custom-checkbox" /><label className="manageCheckbox" htmlFor="userManageSelAll" onClick={() => this.AllCheckStatus()}></label>根目录标签</th>
                                                        <th>实际路径</th>
                                                        <th>分配时间</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {
                                                        this.state.hostList.length == 0 &&
                                                        <tr>
                                                            <td>暂未分配根目录</td>
                                                            <td></td>
                                                            <td></td>
                                                        </tr>
                                                    }
                                                    {this.state.hostList.length != 0 && this.state.hostList.map(function (list, index) {
                                                        return (
                                                            <tr key={index} >
                                                                <td><input type="checkbox" name='userManageCheckbox' id={`userManage${index}`} className="custom-checkbox" title={list.protect_root_path} /><label className="manageCheckbox" htmlFor={`userManage${index}`}></label>{list.protect_path_mark}</td>
                                                                <td>{list.protect_root_path}</td>
                                                                <td>{list.timestamp}</td>
                                                            </tr>
                                                        )
                                                    }.bind(this))}
                                                </tbody>
                                            </table>
                                        </div>
                                    }

                                </div>
                            </div>
                        </div>
                    }

                </div>

                {this.state.showAllotRootPath == true &&
                    <AddRootPath
                        username={this.state.username}
                        status={this.state.status}
                        is_super={this.state.is_super}
                        position={this.state.position}
                        phone={this.state.phone}
                        email={this.state.email}
                        department={this.state.department}
                        tamperUsrToken={this.props.tamperUsrToken}
                        showAllotRootPath={this.state.showAllotRootPath}
                        hideAllotRootPath={this.hideAllotRootPath.bind(this)}
                        userDetailList={this.userDetailList.bind(this)}
                    />
                }

                {this.state.showAddRootPath == true &&
                    <AllotRootPath
                        tamperUsrToken={this.props.tamperUsrToken}
                        username={this.state.username}
                        status={this.state.status}
                        is_super={this.state.is_super}
                        position={this.state.position}
                        phone={this.state.phone}
                        email={this.state.email}
                        department={this.state.department}
                        showAddRootPath={this.state.showAddRootPath}
                        hideAddRootPath={this.hideAddRootPath.bind(this)}
                        userDetailList={this.userDetailList.bind(this)}
                    />}



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