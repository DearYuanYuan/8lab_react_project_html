import React from "react";
import VersionMsg from './SVNBlockChain/VersionMsg'
import FileManage from './SVNBlockChain/FileManage'
import TamperStatus from './SVNBlockChain/TamperStatus'
import UserData from './SVNBlockChain/UserData'
import ClientData from './SVNBlockChain/ClientData'
import UserManage from './SVNBlockChain/UserManage'
import TamperLogin from './SVNBlockChain/TamperLogin'
import LoadingText from "./Commonality/LoadingText";
export default class SVNBlockChain extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tabKey: 1,
            tamperUsrName: 'admin',
            tamperUsrToken: '',
            tamperIsSuper: 1,
            tamperErrorMsg: '',
            tamperLoginBox: true,
            tamperRegisterBox: false,
        }
    };
    handleToggleTab(index) {
        this.setState({
            tabKey: index
        })
    }
    handleToggleLogin() {
        this.setState({
            tamperLoginBox: !this.state.tamperLoginBox,
            tamperRegisterBox: !this.state.tamperRegisterBox,
            tamperErrorMsg: '',
        })
    }
    /*
     * todo 1、进入页面时，请求后台，判断是否是登录状态 2、登录与注册实现
     * */
    /*
     * 登录
     * */
    tamperLoginConfirm() {
        var self = this;
        var username = $.trim($('.tamper-user-name').val())
        var password = $.trim($('.tamper-usr-pwd').val())
        if (username == '') {
            self.setState({
                tamperErrorMsg: '请输入用户名!'
            })
        }
        else if (password == '') {
            self.setState({
                tamperErrorMsg: '请输入密码!'
            })
        }
        else {
            $.ajax({
                url: '/api/tamper_proof/log_in/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                data: {
                    "username": username,
                    "password": password,
                    "service_type": "svn"
                },
                success: function (data) {
                    // console.log(data[0].result.is_super)
                    if (data[0].status == 'SUCCESS') {
                        self.setState({
                            tamperUsrName: username,
                            tamperUsrToken: data[0].result.token,
                            // tamperIsSuper:data[0].result.is_super, 暂时未返回
                            tabKey: 1,
                            tamperIsSuper: data[0].result.is_super,
                            tamperErrorMsg: ''
                        })
                    } else {
                        self.setState({
                            tamperErrorMsg: '登录失败，请检查您所填的信息'
                        })
                    }
                },
                error: function () {
                    self.setState({
                        tamperErrorMsg: '登录失败!'
                    })
                }
            })
        }
    }
    /*
     * 注册
     * */
    tamperRegisterConfirm() {
        var self = this;
        var username = $('.tamper-user-name-register').val();
        var password = $('.tamper-user-pwd-register').val();
        var repassword = $('.tamper-user-pwd2-register').val();
        var position = $('.tamper-user-position-register').val();
        var department = $('.tamper-user-department-register').val();
        var email = $('.tamper-user-email-register').val();
        var phone = $('.tamper-user-phone-register').val();
        var rePwd = /^[0-9A-Za-z_]{6,18}$/;
        var reName = /^[\u4e00-\u9fa5a-zA-Z0-9]{2,18}/
        var rePhone = /^1[3|4|5|7|8][0-9]{9}$/
        var reEmail = /^[A-Za-z\d]+([-_.][A-Za-z\d]+)*@([A-Za-z\d]+[-.])+[A-Za-z\d]{2,4}$/
        if (username == '') {
            self.setState({
                tamperErrorMsg: '请输入用户名!'
            })
        }
        else if (position == '') {
            self.setState({
                tamperErrorMsg: '请输入职位!'
            })
        }
        else if (department == '') {
            self.setState({
                tamperErrorMsg: '请输入部门!'
            })
        }
        else if (email == '') {
            self.setState({
                tamperErrorMsg: '请输入邮箱!'
            })
        }
        else if (phone == '') {
            self.setState({
                tamperErrorMsg: '请输入手机号码!'
            })
        }
        else if (password == '') {
            self.setState({
                tamperErrorMsg: '请输入密码!'
            })
        }
        else if (repassword == '') {
            self.setState({
                tamperErrorMsg: '请再次输入密码!'
            })
        }
        else if (!reEmail.test(email)) {
            self.setState({
                tamperErrorMsg: '请输入正确的邮箱!'
            })
        }
        else if (!rePhone.test(phone)) {
            self.setState({
                tamperErrorMsg: '请输入正确的手机号码!'
            })
        }
        else if (!reName.test(username)) {
            self.setState({
                tamperErrorMsg: '用户名规则：2-18为数字字母汉字!'
            })
        }
        else if (!rePwd.test(password)) {
            self.setState({
                tamperErrorMsg: '密码规则：6-18为数字字母下划线!'
            })
        }
        else if (password != repassword) {
            self.setState({
                tamperErrorMsg: '两次输入密码不一致!'
            })
        }
        else {
            $.ajax({
                url: '/api/tamper_proof/register/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                data: {
                    "username": username,
                    "password": password,
                    "position": position,
                    "department": department,
                    "email": email,
                    "phone": phone,
                    "service_type": "svn"
                },
                success: function (data) {
                    // console.log(JSON.stringify(data))
                    self.setState({
                        tamperUsrName: username,
                        tamperUsrToken: data[0].result.token,
                        tamperIsSuper: data[0].result.is_super,
                        tamperLoginBox: true,
                        tamperRegisterBox: false,
                        tamperErrorMsg: ''
                    })
                },
                error: function () {
                    self.setState({
                        tamperErrorMsg: '注册失败!'
                    })
                }
            })
        } 
        // else {
        //     self.setState({
        //         tamperErrorMsg: '两次密码输入不一致!'
        //     })
        // }
    }
    /*
     * 注销
     * */
    tamperCancelLogin() {
        var self = this;
        $.ajax({
            url: '/api/tamper_proof/log_out/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data: {
                "username": self.state.tamperUsrName,
                "service_type": "svn"
            },
            success: function (data) {
                // console.log(data)
                self.setState({
                    tamperUsrName: '',
                    tabKey: 0,
                })
            },
            error: function () {
            }
        })
    }
    componentWillMount() {
    }
    componentDidMount(){
        //修改页面title
        document.title = '区块链代码仓库'
    }
    render() {
        return (
            <div className="tamper databaseCover" >
                <div className="topPluginAction tamper-head">
                    <h2 style={{ marginBottom: this.state.tabKey == 0 ? '40px' : '10px' }}>区块链代码仓库
                        {   //todo 登录注册实现
                            this.state.tabKey !== 0 &&
                            <b className="tamperUsrName">当前账号：{this.state.tamperUsrName} <a onClick={this.tamperCancelLogin.bind(this)}>注销</a></b>
                        }
                    </h2>
                    {
                        this.state.tabKey !== 0 &&
                        <ul className="tab-tamper clearfix">
                            <li className={this.state.tabKey == 1 ? "tab-active" : ""} onClick={this.handleToggleTab.bind(this, 1)}>版本信息维护</li>
                            <li className={this.state.tabKey == 2 ? "tab-active" : ""} onClick={this.handleToggleTab.bind(this, 2)}>文件管理</li>
                            <li className={this.state.tabKey == 3 ? "tab-active" : ""} onClick={this.handleToggleTab.bind(this, 3)}>状态监控</li>
                            <li className={this.state.tabKey == 4 ? "tab-active" : ""} onClick={this.handleToggleTab.bind(this, 4)}>用户操作日志</li>
                            <li className={this.state.tabKey == 5 ? "tab-active" : ""} onClick={this.handleToggleTab.bind(this, 5)}>客户端同步日志</li>
                            <li className={this.state.tabKey == 6 ? "tab-active" : ""} onClick={this.handleToggleTab.bind(this, 6)}>用户管理</li>
                        </ul>
                    }
                </div>
                <div className="database-content tamper-content">
                    {
                        this.state.tabKey == -1 &&
                        <LoadingText />
                    }
                    {this.state.tabKey == 0 &&
                        <TamperLogin
                            tabKey={this.state.tabKey}
                            tamperLoginBox={this.state.tamperLoginBox}
                            tamperRegisterBox={this.state.tamperRegisterBox}
                            tamperErrorMsg={this.state.tamperErrorMsg}
                            handleToggleLogin={this.handleToggleLogin.bind(this)}
                            tamperLoginConfirm={this.tamperLoginConfirm.bind(this)}
                            tamperRegisterConfirm={this.tamperRegisterConfirm.bind(this)}
                        />
                    }
                    {this.state.tabKey == 1 &&
                        <VersionMsg
                            tamperUsrName={this.state.tamperUsrName}
                            tamperUsrToken={this.state.tamperUsrToken}
                            tamperIsSuper={this.state.tamperIsSuper}
                            tabKey={this.state.tabKey} />}
                    {this.state.tabKey == 2 &&
                        <FileManage
                            tamperUsrName={this.state.tamperUsrName}
                            tamperUsrToken={this.state.tamperUsrToken}
                            tamperIsSuper={this.state.tamperIsSuper}
                            tabKey={this.state.tabKey} />}
                    {this.state.tabKey == 3 &&
                        <TamperStatus
                            tamperUsrName={this.state.tamperUsrName}
                            tamperUsrToken={this.state.tamperUsrToken}
                            tamperIsSuper={this.state.tamperIsSuper}
                            tabKey={this.state.tabKey} />}
                    {this.state.tabKey == 4 &&
                        <UserData
                            tamperUsrName={this.state.tamperUsrName}
                            tamperUsrToken={this.state.tamperUsrToken}
                            tamperIsSuper={this.state.tamperIsSuper}
                            tabKey={this.state.tabKey} />}
                    {this.state.tabKey == 5 &&
                        <ClientData
                            tamperUsrName={this.state.tamperUsrName}
                            tamperUsrToken={this.state.tamperUsrToken}
                            tamperIsSuper={this.state.tamperIsSuper}
                            tabKey={this.state.tabKey} />}
                    {this.state.tabKey == 6 &&
                        <UserManage
                            tamperUsrName={this.state.tamperUsrName}
                            tamperUsrToken={this.state.tamperUsrToken}
                            tamperIsSuper={this.state.tamperIsSuper}
                            tabKey={this.state.tabKey} />}
                </div>
            </div>
        )
    }
}