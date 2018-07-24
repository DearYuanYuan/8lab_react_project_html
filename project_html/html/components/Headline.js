import React from "react"
import { NavLink } from 'react-router-dom'
import {
    Nav, Navbar,
    NavDropdown, NavItem, MenuItem, Col, Modal, Button, Form, FormGroup, ControlLabel, FormControl, Panel, Accordion,
} from 'react-bootstrap'
import $ from 'jquery';
import sha1 from "sha1";        //sha1加密算法模块
import MessageBox from "./Commonality/MessageBox";      //消息提示框组件
import LoginToFail from "./LoginToFail";                //登录超时,重新登录的弹出框

// require('../utils/jquery.toast')    //消息提醒插件

//页面的头部和导航栏。
//除了登录注册页之外,其余页面都要用到
export default class Headline extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showSubNav: false,
            showModal: false,               //控制修改密码窗口的显示隐藏
            showMsgBox: false,               //控制确认修改密码后的消息提示弹窗的显示隐藏
            error: '',                       //修改密码窗口底部的错误信息
            msgContent: '',                  //消息提示框中的内容
            loginModal: false,              //是否显示重新登录的弹框
            username: this.props.username,    //已经登录的用户的用户名

            systemShow: false,
            enabledSys: null,
            disableSys: null,
            globalSystemSetActive: true,//用户设置，之通用设置和警告设置，默认显示通用设置
            userSelectSet: false,//用户设置通用设置选择下拉框默认不显示
            userSelectValue: '',//用户选择首页或者5个页面
            userSelectIndex: false,//用户选择首页或者5个页面的index后台传值
            userSelectErrorMsg: '',//用户通用设置点击确定发生错误信息提示
        }
    }
    //组件将要接收新的props时的操作
    componentWillReceiveProps(nextProps) {
        if (this.props.username != nextProps.username) {      //如果登录的账户变了，更新页面上显示的用户名
            this.setState({
                username: nextProps.username
            })
        }
    }
    componentWillMount() {
        require.ensure([], function (require) {
            require('../utils/jquery.toast');
        }, 'jquery.toast');

    }
    //组件渲染后执行的操作
    componentDidMount() {
        var self = this
        //设置全局的警告提示信息
        var test = [
            {
                'record_time': '2018-05-09 15:30:55',
                'alarm_type': '异常行为',
                'count': 8111
            },
            {
                'record_time': '2018-05-09 15:30:55',
                'alarm_type': '系统',
                'count': 8111
            }
        ];
        var time_delta = 15                    //检查警告信息的时间间隔，默认是15秒
        this.alarm_timer = setInterval(function () { //设置警告提醒的定时器
            $.ajax({
                url: '/api/alarm/status/',
                type: 'POST',                   //POST方式时,表单数据作为 HTTP 消息的实体内容发送给Web服务器
                dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为 URL 地址的参数进行传递
                cache: false,                   //不会从浏览器缓存中加载请求信息
                data: {
                    time_delta: time_delta     //显示最近的设定时间内的警告提醒.单位为秒.默认是15秒.
                },
                success: function (data) {
                    // data = test
                    //设置全局检查是否登录超时

                    if (data && data.code == '101') {//如果登录超时,显示重新登录的弹窗
                        self.showLoginModal();
                    }

                    if (data.pay_alarm == 1) {
                        var text = ['请尽快购买服务!']  //提示信息第一行
                        $.toast({
                            click: false,
                            heading: '警告!!!',      //标题
                            text: text,                 //内容
                            showHideTransition: 'fade', //出现和消失的动画效果
                            allowToastClose: true,      //是否允许用户关闭弹窗
                            hideAfter: 5000,            //在设定时间之后自动消失
                            position: 'top-right',      //位置
                            textAlign: 'left',          //文字对齐方式
                            icon: 'warning'             //提示框的图标类型
                        })
                    }
                    //设置警告提示弹窗
                    if (data.machine_alarm && data.machine_alarm.length > 0) {
                        data.machine_alarm.forEach(function (el) {
                            var text = ['您在过去的' + time_delta + '秒内收到警告: ' + el.count + '条.']  //提示信息第一行
                            $.toast({
                                click: true,
                                text: text,                 //内容
                                heading: `${el.alarm_type}警告`,      //标题
                                showHideTransition: 'fade', //出现和消失的动画效果
                                allowToastClose: true,      //是否允许用户关闭弹窗
                                hideAfter: 5000,            //在设定时间之后自动消失
                                position: 'top-right',      //位置
                                textAlign: 'left',          //文字对齐方式
                                icon: 'warning'             //提示框的图标类型
                            })
                        }, this);

                    }

                },
                error: function () {

                }
            })
        }, time_delta * 1000);

        //服务过期提示框
        this.server_timer = setInterval(function () {
            $.ajax({
                url: '/api/alarm/get_limit_time',
                type: 'get',                   //POST方式时,表单数据作为 HTTP 消息的实体内容发送给Web服务器
                success: function (data) {
                    if (data.status == 0) {
                        $.toast({
                            click: false,
                            heading: '警告!!!',      //标题
                            text: [data.msg],                 //内容
                            showHideTransition: 'fade', //出现和消失的动画效果
                            allowToastClose: true,      //是否允许用户关闭弹窗
                            hideAfter: 5000,            //在设定时间之后自动消失
                            position: 'top-right',      //位置
                            textAlign: 'left',          //文字对齐方式
                            icon: 'warning'             //提示框的图标类型
                        })
                    }
                },
            })
        }, 15000)
        //获取用户设置的在线时长，并写入新的cookie
        // this.getSystemTimeout()
    }

    //组件将被移除时的操作
    componentWillUnmount() {
        //移除警告提醒的定时器
        if (this.alarm_timer) {
            clearInterval(this.alarm_timer);
        }
    }

    //显示页面登录失效的弹窗 loginTofail
    showLoginModal() {
        this.setState({ loginModal: true });
    }

    // 注销操作
    logout() {
        /* 注销操作*/
        var block = this;
        $.ajax({
            url: "/api/logout/",
            type: 'GET',
            dataType: 'json',
            cache: false
        }).success(function (data) {
            if (data.code == 200) {
                window.location.href = "/login";
                /*delete homepage sessionStorage and cookie*/
                if (sessionStorage && sessionStorage.getItem("loadCount")) {
                    sessionStorage.removeItem("loadCount");
                }
                if (block.getCookie("loadCount") != "") {
                    block.deleteCookie("loadCount");
                }
            }
        });
    }
    //隐藏或显示修改密码的弹窗
    changeModal() {
        this.setState({
            showModal: !this.state.showModal,
            error: ''        //清空错误提示
        });
    }

    //消息提示框的确认按钮被点击后的操作
    confirmMsgBox() {
        this.setState({             //隐藏消息提示窗口
            showMsgBox: false
        });
    }

    //确认修改密码后的操作
    submitChange() {
        /* 修改密码时候的确认, 需要进行密码的简单校验,并传到后台 */
        var password = $("#Password").val();                //获取旧密码
        var newpassword = $("#newPassword").val();          //获取新密码
        var confirmpassword = $("#confirmPassword").val();  //获取重复新密码
        var re = /^[0-9A-Za-z_]{6,18}$/; //验证密码格式的正则表达式
        var self = this;

        if (password == "") {          //如果当前密码未输入
            $("#Password").focus();     //当前密码输入框获取焦点
            this.setState({             //在修改密码窗口底部显示错误信息
                error: "请输入当前密码"
            });
        } else if (newpassword == "") {        //如果新密码未输入
            $("#newPassword").focus();  //新密码输入框获取焦点
            this.setState({             //在修改密码窗口底部显示错误信息
                error: "请输入新密码"
            });
        } else if (!re.test(newpassword)) {    //如果新密码格式不正确
            $("#newPassword").focus();  //新密码输入框获取焦点
            this.setState({             //在修改密码窗口底部显示错误信息
                error: "长度6~18的字符、数字和下划线"
            });
        } else if (newpassword == password) {  //如果新密码与旧密码相同
            $("#newPassword").focus();  //新密码输入框获取焦点
            this.setState({             //在修改密码窗口底部显示错误信息
                error: "新密码与旧密码不能相同"
            });
        } else if (confirmpassword == "") {    //如果重复新密码未输入
            $("#confirmPassword").focus();//重复新密码输入框获取焦点
            this.setState({             //在修改密码窗口底部显示错误信息
                error: "请重复输入密码"
            });
        } else if (newpassword != confirmpassword) {//如果两次输入密码不一致
            $("#confirmPassword").focus();//重复新密码输入框获取焦点
            this.setState({             //在修改密码窗口底部显示错误信息
                error: "两次输入密码不一致"
            });
        } else {
            $.ajax({
                url: "/api/modpass/",
                type: 'POST',
                dataType: 'json',
                cache: false,
                data: {
                    password: sha1(password),
                    newpassword: sha1(newpassword)
                },
                success: function (data) {
                    if (data.code == 200) { //如果修改密码成功
                        self.changeModal();         //隐藏修改密码弹窗
                        self.setState({             //显示消息提示弹窗
                            showMsgBox: true,
                            msgContent: '修改成功！',
                            msgButtonState: true,
                            msgButtonName: '确定'
                        })
                    } else if (data.code == 205) { //如果当前密码输入错误
                        self.setState({
                            showMsgBox: true,
                            msgContent: '当前密码不正确',
                            msgButtonState: true,
                            msgButtonName: '确定'
                        })
                    } else { //如果修改失败
                        self.setState({
                            showMsgBox: true,
                            msgContent: '修改失败',
                            msgButtonState: true,
                            msgButtonName: '确定'
                        })
                    }
                }
            })
        }
    }
    //获取cookie
    getCookie(name) {
        var strCookie = document.cookie;
        var arrCookie = strCookie.split("; ");
        for (let i = 0; i < arrCookie.length; i++) {
            var arr = arrCookie[i].split("=");
            if (arr[0] == name) {
                return arr[1];
            }
        }
        return "";
    }
    //删除cookie
    deleteCookie(name) {
        var date = new Date();
        date.setTime(date.getTime() - 10000);
        document.cookie = name + "=v; expires=" + date.toGMTString();
    }

    //处理当前输入框中输入回车的操作
    handleEnterKeyOldPwd(e) {
        if (e.keyCode == 13) {
            $('#newPassword').focus() //密码输入框获取焦点
        }
    }
    //处理新密码输入框中输入回车的操作
    handleEnterKeyNewPwd(e) {
        if (e.keyCode == 13) {
            $('#confirmPassword').focus() //密码输入框获取焦点
        }
    }
    //处理重复新密码输入框中输入回车的操作
    handleEnterKeyNewPwdAgain(e) {
        if (e.keyCode == 13) {
            this.submitChange()
        }
    }

    //获取导航栏当前选中的标签的key
    // getActiveNavKey() {
    //     if (window.location.hash.indexOf('svnBlockChain') != -1 || window.location.hash.indexOf('tamper') != -1 || window.location.hash.indexOf('blockchain') != -1) { //如果地址栏路径中包含这个key
    //         $('.middle-area .blockChain').addClass('active')
    //     } else {
    //         $('.middle-area .blockChain').removeClass('active')
    //     }
    //     //导航栏的key列表
    //     //对应NavItem中的eventKey
    //     const keyList = ["home", "dataBase", "environment", "systemCheck", "wafWall", "databaseAudit", "mapAttack", "blockchain", "bigData", "infoCenter", "plugin", "tamper", "svnBlockChain", "honey", "targetRange"]
    //     for (var i = 0; i < keyList.length; i++) {
    //         if (window.location.hash.indexOf(keyList[i]) != -1) { //如果地址栏路径中包含这个key
    //             return keyList[i]
    //         }
    //     }
    // }


    //全局系统设置
    // showGlobalSystem() {
    //     this.setState({
    //         systemShow: true,
    //     })
    //     //获取用户设置的在线时长
    //     this.getSystemTimeout()
    //     var self = this;
    //     $.ajax({
    //         type: "POST",
    //         dataType: "json",
    //         url: "/api/settings/get_warninglist/",
    //         error() {
    //         },
    //         success(data) {
    //             var enabledSys = [];
    //             var disableSys = [];
    //             data.filter(function (item, index) {
    //                 if (item.enabled == 1) {
    //                     enabledSys.push(item)
    //                     return enabledSys
    //                 }
    //                 if (item.enabled == 0) {
    //                     disableSys.push(item)
    //                     return disableSys
    //                 }
    //             })
    //             self.setState({
    //                 enabledSys: enabledSys,
    //                 disableSys: disableSys
    //             })
    //         }
    //     })
    // }

    //关闭系统设置
    // systemHide() {
    //     this.setState({ systemShow: false })
    // }


    // enabledSingle(e, who) {
    //     $(e.target).toggleClass('onSelect');
    //     this.allchk(who);
    // }


    //启用警告通讯方式全选
    // enabledSelecAll(e, father) {
    //     if ($(e.target).is('.onSelect')) {
    //         $(e.target).removeClass('onSelect')
    //         var enabledArr = $(`.${father}  .enabled-content tbody tr td a`);
    //         for (var i = 0; i < enabledArr.length; i++) {
    //             $(enabledArr[i]).removeClass('onSelect')
    //         }
    //     } else {
    //         $(e.target).addClass('onSelect')
    //         var enabledArr = $(`.${father}  .enabled-content tbody tr td a`);
    //         for (var i = 0; i < enabledArr.length; i++) {
    //             $(enabledArr[i]).addClass('onSelect')
    //         }
    //     }
    // }

    //单选判断
    // allchk(who) {
    //     var chknum = $(`.${who} tbody  tr td a`).size();//选项总个数
    //     var chk = 0;
    //     $(`.${who} tbody  tr td a`).each(function () {
    //         if ($(this).hasClass("onSelect") == true) {
    //             chk++;
    //         }
    //     });
    //     if (chknum == chk) {//全选
    //         $(`.${who}   th  a`).addClass('onSelect')
    //     } else {//不全选
    //         $(`.${who}   th  a`).removeClass('onSelect')
    //     }
    // }



    // RUD
    // RUDwarninglist(type) {
    //     var self = this;
    //     var data = '';
    //     var RUDlis = [];
    //     //type==2是启用
    //     if (type == 2) {
    //         RUDlis = $(".disable-communication tbody  tr td a.onSelect")

    //     } else {
    //         RUDlis = $(".enabled-communication tbody  tr td a.onSelect")
    //     }
    //     for (var i = 0; i < RUDlis.length; i++) {
    //         data += $(RUDlis[i]).attr("title") + '#'
    //     }
    //     $.ajax({
    //         url: "/api/settings/update_warninglist/",
    //         dataType: "json",
    //         type: "POST",
    //         data: { type: type, data: data },
    //         beforeSend() {
    //             // console.log(data)
    //             if (!data.length) {
    //                 return false;
    //             }
    //         },
    //         success() {
    //             $(".communicationStyle  a").removeClass('onSelect')
    //             self.showGlobalSystem()
    //         },
    //         error() {
    //             self.showGlobalSystem()
    //         },
    //     })
    // }


    // addWarningList() {
    //     var self = this;
    //     var tbody = document.querySelector(".enabled-content tbody");
    //     var tr = document.createElement("tr");
    //     tbody.appendChild(tr);

    //     var td = document.createElement("td");
    //     td.innerHTML = "<input type='text'　name='enabledAdd' autoFocus placeholder=请输入新增电话  style='width:120px; height: 24px; border-radius: 4px;background: transparent; border: 1px solid #ccc; padding: 6px 10px;'>";
    //     tr.appendChild(td);
    //     var td = document.createElement("td");
    //     td.innerHTML = "<input type='text'　name='enabledAdd' placeholder=请输入新增邮箱  style='width:120px; height: 24px; border-radius: 4px;background: transparent; border: 1px solid #ccc; padding: 6px 10px;'>";
    //     tr.appendChild(td);

    //     td = document.createElement("td");
    //     // 创建一个确认和一个取消按钮
    //     td.innerHTML = "<span style='color:#32a1ff'>确定</span>&nbsp;<span style='color:#CB4B4B'>取消</span>";
    //     tr.appendChild(td);

    //     // 给确定和取消按钮添加事件
    //     //取消按钮
    //     var cancel = td.children[1];
    //     cancel.onclick = function () {
    //         //删除当前行，也不需要去考虑数据
    //         tbody.removeChild(this.parentNode.parentNode);
    //     };

    //     // 确认按钮事件
    //     // console.log(addPhone.children[0])

    //     var yes = td.children[0];
    //     yes.onclick = function () {
    //         // 在点击确认按钮的时候，我们想要把数据添加为datas中的新项
    //         // 第一步，我们需要获取input中的内容
    //         var phone = tr.children[0].children[0].value;
    //         var email = tr.children[1].children[0].value;
    //         var block = this;



    //         // 邮箱和手机验证

    //         var testEmail = /^([0-9A-Za-z\-_\.]+)@([0-9a-z]+\.[a-z]{2,3}(\.[a-z]{2})?)$/g;
    //         if (!testEmail.test(email)) {
    //             $.toast({
    //                 text: '请检查您输入的邮箱',                 //内容
    //                 showHideTransition: 'fade', //出现和消失的动画效果
    //                 allowToastClose: true,      //是否允许用户关闭弹窗
    //                 hideAfter: 5000,            //在设定时间之后自动消失
    //                 loader: false,              //是否显示加载进度
    //                 stack: false,                //最多同时显示的提示框的个数
    //                 position: 'top-center',      //位置
    //                 textAlign: 'center',          //文字对齐方式
    //             })
    //             return;
    //         }
    //         var testPhone = /((\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)/
    //         if (!testPhone.test(phone)) {
    //             $.toast({
    //                 text: '请检查您输入的手机号',                 //内容
    //                 showHideTransition: 'fade', //出现和消失的动画效果
    //                 allowToastClose: true,      //是否允许用户关闭弹窗
    //                 hideAfter: 5000,            //在设定时间之后自动消失
    //                 loader: false,              //是否显示加载进度
    //                 stack: false,                //最多同时显示的提示框的个数
    //                 position: 'top-center',      //位置
    //                 textAlign: 'center',          //文字对齐方式
    //             })
    //             return;
    //         }


    //         // console.log(`${phone}---${email}---`)
    //         $.ajax({
    //             url: '/api/settings/add_warninglist/',
    //             type: 'POST',
    //             dataType: 'json',
    //             data: {
    //                 phone: phone,
    //                 email: email
    //             },
    //             error() {
    //                 self.showGlobalSystem()
    //                 // console.log(block)
    //                 tbody.removeChild(block.parentNode.parentNode);

    //             },
    //             success() {
    //                 self.showGlobalSystem()
    //                 tbody.removeChild(block.parentNode.parentNode);
    //             }
    //         })
    //     }
    // }
    //用户通用设置与警报设置切换
    // handleToggleSystemSetting(index) {
    //     this.setState({
    //         globalSystemSetActive: index == 1 ? true : false
    //     })
    // }
    //通用设置选择打开首页或五个页面
    // handleUserSelectSet(e) {
    //     //判断点击的是否是p标签，将p的text赋值给input

    //     if (/^P$/i.test(e.target.tagName)) {
    //         this.setState({
    //             userSelectValue: $(e.target).text(),//设置input的值
    //             userSelectIndex: $(e.target).index().toString(),//设置后台传值，下次打开是首页或者5个页面
    //         })
    //     }
    //     //点击下拉组件，下拉框显示或隐藏
    //     this.setState({
    //         userSelectSet: !this.state.userSelectSet
    //     })
    // }
    // //获取系统超时时间
    // getSystemTimeout() {
    //     //get_session_timeout
    //     var self = this;
    //     $.ajax({
    //         url: '/api/settings/get_session_timeout/',
    //         type: 'POST',
    //         dataType: 'json',
    //         cache: false,
    //         success: function (data) {
    //             if (data.code == 200 || data.code == 203) {
    //                 // console.log(data)
    //                 //设置用户在线时长
    //                 $('#userSetMinute').val(data.timeout)
    //                 //重新设置cookie过期时长，默认60分钟
    //                 //获取cookie，若存在上次设置
    //                 //并设置用户设置打开首页或者五个多页
    //                 if (self.getCookie('userSystemSetType') != '') {
    //                     var memory = self.getCookie('userSystemSetType')
    //                     self.userSetCookieTime(memory);
    //                     //上次设置cookie未过期
    //                     self.setState({
    //                         userSelectValue: memory == 0 ? '仅打开首页' : '自动开启首页、信息中心、攻防态势、全球态势感知、3D地球共 5 个页面',//设置input的值
    //                         userSelectIndex: memory,//设置后台传值，下次打开是首页或者5个页面
    //                     })
    //                 } else {
    //                     return;
    //                     // self.userSetCookieTime(false);
    //                 }
    //             } else {
    //                 //发生错误，则删除cookie
    //                 self.deleteCookie('userSystemSetType')
    //                 $('#userSetMinute').val('')
    //             }
    //             // console.log(data)
    //         },
    //         error: function () {
    //             //发生错误，则删除cookie
    //             self.deleteCookie('userSystemSetType')
    //             $('#userSetMinute').val('')
    //         },
    //     })
    // }
    //用户设置cookie
    //memory:是否有上次设置记录未过期的cookie设置 默认值false，若有，则从cookie中取出替代this.state.userSelectIndex初始值
    // userSetCookieTime(memory) {
    //     //获取用户填写的有效时长
    //     var minute = $('#userSetMinute').val();
    //     //设置有效时长
    //     var date = new Date()
    //     date.setTime(date.getTime() + minute * 60 * 1000);
    //     // console.log(date.toGMTString())
    //     //添加cookie，记录下用户设置下次打开页面是首页还是5个页面
    //     document.cookie = "userSystemSetType=" + (memory ? memory : this.state.userSelectIndex) + ";expires=" + date.toGMTString();
    //     // this.deleteCookie('userSystemSetType')
    //     // console.log(document.cookie)
    // }
    //通用设置确定，发起请求
    // systemSetConfirmAjax() {
    //     if ($('#userSetMinute').val() == '') {
    //         this.setState({
    //             userSelectErrorMsg: '请填写账户在线时长'
    //         })
    //     } else if (this.state.userSelectValue == '') {
    //         this.setState({
    //             userSelectErrorMsg: '请选择登录打开页面的方式'
    //         })
    //     } else {
    //         //重新设置cookie，则清除上次设置
    //         this.userSetCookieTime(false);

    //         var self = this;
    //         $.ajax({
    //             url: '/api/settings/set_session_timeout/',
    //             type: 'POST',
    //             dataType: 'json',
    //             data: {
    //                 timeout: $('#userSetMinute').val(),
    //             },
    //             cache: false,
    //             success: function (data) {
    //                 if (data.code == 200 || data.code == 203) {
    //                     self.setState({
    //                         userSelectErrorMsg: '设置成功',
    //                     })
    //                     //200ms after,关闭用户设置弹框
    //                     setTimeout(function () {
    //                         self.setState({
    //                             userSelectErrorMsg: '',
    //                         })
    //                         self.systemHide()
    //                     }, 200)
    //                 } else {
    //                     self.setState({
    //                         userSelectErrorMsg: data.message
    //                     })
    //                 }

    //                 // console.log(data)
    //             },
    //             error: function () {
    //                 self.setState({
    //                     userSelectErrorMsg: '服务繁忙，请稍后重试～'
    //                 })
    //             },
    //         })
    //     }

    // }
    //用户设置有效时长正则
    // putInTimeSet(e) {
    //     var re = /^[0-9]+$/;
    //     var minute = parseInt($(e.target).val())
    //     if (!re.test($(e.target).val())) {
    //         $(e.target).val('')
    //     }
    //     if (minute <= 0) {
    //         $(e.target).val('')
    //     }
    //     if (minute >= 240 * 60) {
    //         $(e.target).val(240 * 60)
    //     }
    // }



    // enabledCertificate(e) {
    //     $(e.target).toggleClass('onSelect');
    // }
    render() {
        // 关闭重新登录的弹窗
        const Close = () => this.setState({ loginModal: false });

        return (
            <section>
                {/*左侧导航栏*/}
                <div className="fuzhou-nav">
                    <div className="top-area">
                        <a href="javascript:;">
                        </a>
                    </div>

                    <div className="middle-area">
                        <ul>
                            <li><NavLink to="/home" activeClassName="active"><img src="/static/img/sidebar/home.svg" alt="首页" /><span>首页</span></NavLink></li>
                            <li><NavLink to="/infoCenter" activeClassName="active"><img src="/static/img/sidebar/Kibana.svg" alt="信息中心" /><span>信息中心</span></NavLink></li>
                            <li><NavLink to="/environment" activeClassName="active"><img src="/static/img/sidebar/protect_control.svg" alt="可信防护" /><span>可信防护</span></NavLink></li>
                            <li><NavLink to="/targetRange" activeClassName="active"><img src="/static/img/sidebar/targetRange.svg" alt="攻防态势" /><span>攻防态势</span></NavLink></li>
                            <li><NavLink to="/mapAttack" activeClassName="active"><img src="/static/img/sidebar/world.svg" alt="威胁情报" /><span>威胁情报</span></NavLink></li>
                            <li>
                                {/* <a className="blockChain"
                                        onClick={() => {
                                            if(!this.state.showSubNav){
                                                this.props.history.push('/blockchain')  // 需要在父组件Main中显式地传递 history
                                            }
                                            this.setState({ showSubNav: !this.state.showSubNav })
                                        }}> */}
                                <NavLink to="/blockchain" className="blockChain"
                                    onClick={() => {
                                        this.setState({ showSubNav: !this.state.showSubNav })
                                    }}>
                                    <img src="/static/img/sidebar/plugin_copy.svg" alt="区块链服务" />
                                    <span>区块链服务</span>
                                    {this.state.showSubNav ? <i className="fa fa-angle-up" aria-hidden="true"></i> : <i className="fa fa-angle-down" aria-hidden="true"></i>}
                                </NavLink>
                            </li>
                            {this.state.showSubNav &&
                                <ul className="sub-nav">
                                    <li><NavLink exact to="/blockchain" activeClassName="sub-active"><span>区块链存证</span></NavLink></li>
                                    <li><NavLink to="/blockchain/svnBlockChain" activeClassName="sub-active"><span>区块链代码仓库</span></NavLink></li>
                                    <li><NavLink to="/blockchain/tamper" activeClassName="sub-active"><span>区块链防篡改</span></NavLink></li>
                                </ul>
                            }
                            <li><NavLink to="/bigData" activeClassName="active"><img src="/static/img/sidebar/bigdata.svg" alt="大数据用户行为分析" /><span>大数据用户行为分析</span></NavLink></li>
                            <li><NavLink to="/honey" activeClassName="active"><img src="/static/img/sidebar/honeypot.svg" alt="蜜罐网" /><span>蜜罐网</span></NavLink></li>
                            <li><NavLink to="/systemCheck" activeClassName="active"><img src="/static/img/sidebar/defence.svg" alt="系统检测" /><span>系统检测</span></NavLink></li>
                            <li><NavLink to="/wafWall" activeClassName="active"><img src="/static/img/sidebar/firewall.svg" alt="WAF防火墙" /><span>WAF防火墙</span></NavLink></li>
                            {/*<li><NavLink to="/dataBase" activeClassName="active"><img src="/static/img/sidebar/dbStatus.svg" alt="数据库可信状态" /><span>数据库可信状态</span></NavLink></li>
                            <li><NavLink to="/databaseAudit" activeClassName="active"><img src="/static/img/sidebar/dbAudit.svg" alt="数据库可信审计" /><span>数据库可信审计</span></NavLink></li>*/}
                            <li><NavLink to="/plugin" activeClassName="active"><img src="/static/img/sidebar/plugin.svg" alt="插件" /><span>插件</span></NavLink></li>
                        </ul>
                    </div>
                </div>
                {/*顶部导航栏*/}
                <div className="top-banner">
                    {/*<span className='homelogo'></span>*/}
                    {/*<img src="/static/img/shandong-logo.png" alt="" className='homelogo-shandong' />*/}
                    <Nav pullRight>
                        <NavDropdown eventKey={3} title={this.state.username + ", 欢迎您!"} id="basic-nav-dropdown">
                            <MenuItem eventKey={3.1} onClick={this.changeModal.bind(this)}>修改密码</MenuItem>
                            <MenuItem eventKey={3.3} onClick={this.logout.bind(this)}>注销</MenuItem>
                        </NavDropdown>
                    </Nav>
                    <NavLink to="/settings" style={{ float: 'right', height: '100%' }}><i className="fa fa-cog  fa-fw  globalSystem" aria-hidden="true"></i></NavLink>
                    <NavLink to="/alarm" style={{ float: 'right', height: '100%' }}><i className="fa fa-bell globalSystem" aria-hidden="true"></i></NavLink>
                    {/*<i className="fa fa-cog  fa-fw  globalSystem" aria-hidden="true" onClick={() => this.showGlobalSystem()}></i>*/}


                </div>
                {/*修改密码的弹窗*/}
                <Modal
                    show={this.state.showModal}
                    onHide={this.changeModal.bind(this)}
                    backdrop='static'
                    bsSize='sm'>
                    <Modal.Header closeButton>
                        <Modal.Title>修改密码</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form horizontal>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={4}>
                                    当前密码
                                </Col>
                                <Col sm={7}>
                                    <input
                                        id="Password"
                                        className="form-control"
                                        type="password" placeholder="请输入当前密码" ref='Password'
                                        onKeyDown={this.handleEnterKeyOldPwd.bind(this)} />
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={4}>
                                    新密码
                                </Col>
                                <Col sm={7}>
                                    <input
                                        id="newPassword"
                                        className="form-control"
                                        type="password" placeholder="请输入新密码" ref='newPassword'
                                        onKeyDown={this.handleEnterKeyNewPwd.bind(this)} />
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col componentClass={ControlLabel} sm={4}>
                                    重复密码
                                </Col>
                                <Col sm={7}>
                                    <input
                                        id="confirmPassword"
                                        className="form-control"
                                        type="password" placeholder="请重复输入密码" ref='confirmPassword'
                                        onKeyDown={this.handleEnterKeyNewPwdAgain.bind(this)} />
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <Col smOffset={4} sm={7}>
                                    <span id="result" className="text-danger" >{this.state.error}</span>
                                </Col>
                            </FormGroup>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className="modalCancelBtn" onClick={this.changeModal.bind(this)}>取消</Button>
                        <Button className="modalSubmitBtn" onClick={this.submitChange.bind(this)}>确定</Button>
                    </Modal.Footer>
                </Modal>
                {/*消息提示弹窗*/}
                <MessageBox
                    showMsgBox={this.state.showMsgBox}
                    msgContent={this.state.msgContent}
                    msgButtonState={this.state.msgButtonState}
                    msgButtonName={this.state.msgButtonName}
                    handleConfirmMsgBox={this.confirmMsgBox.bind(this)}
                />
                {/*登录超时的弹窗*/}
                <LoginToFail
                    username={this.state.username}
                    show={this.state.loginModal}
                    onHide={Close}
                    changeAccount={() => this.props.changeAccount()} />



                {/*{this.state.systemShow &&*/}
                {/* 
                     <div className="mask" style={{ display: this.state.systemShow ? 'block' : 'none' }}>
                    <div className="globalSysConent">
                        <div className="globalSysConent-header clearfix">
                            <h4>系统设置</h4>
                            <i className="fa fa-window-close fa-2x fa-fw" aria-hidden="true" onClick={() => this.systemHide()}></i>
                        </div>
                        <ul className="globalSystem-tab clearfix" >
                            <li className={this.state.globalSystemSetActive ? "globalSystem-set-active" : ""} onClick={this.handleToggleSystemSetting.bind(this, 1)}>通用设置</li>
                            <li className={!this.state.globalSystemSetActive ? "globalSystem-set-active" : ""} onClick={this.handleToggleSystemSetting.bind(this, 2)}>警告通讯方法</li>
                        </ul>
                        {
                            this.state.globalSystemSetActive &&
                            <div className="globalSystemSetNormal">
                                <h2>连续在线时长</h2>
                                <div className="writeTime">
                                    <h3><input type="text" id="userSetMinute"
                                        onKeyUp={this.putInTimeSet.bind(this)} onKeyDown={this.putInTimeSet.bind(this)} /> 分钟 ( 最高不超过240小时 ) </h3>
                                    <p>为确保安全，您可以设置系统保持登录的时长。超过时限后，系统自动登出。</p>
                                </div>
                                <h2>登陆后打开的窗口</h2>
                                <div className="selectSystemSet" onClick={this.handleUserSelectSet.bind(this)}>
                                    <input className="userSelectSet" type="text" readOnly value={this.state.userSelectValue == '' ? '仅打开首页' : this.state.userSelectValue} />
                                    {
                                        this.state.userSelectSet &&
                                        <div className="selectSetList">
                                            <p>仅打开首页</p>
                                            <p>自动开启首页、信息中心、攻防态势、全球态势感知、3D地球共 5 个页面</p>
                                        </div>
                                    }

                                </div>


                                <p className="errorMsg">{this.state.userSelectErrorMsg}</p>
                                <div className="userSetConfimBtn">
                                    <input className="userSetCancle plugAction" type="button" value="取消" onClick={() => this.systemHide()} />
                                    <input className="userSetConfirm plugAction" type="button" value="确认" onClick={() => this.systemSetConfirmAjax()} />
                                </div>
                            </div>
                        }
                        {
                            !this.state.globalSystemSetActive &&
                            <div className="communicationStyle">
                                <h4>警告通讯方式</h4>
                                <div className="enabled-communication ">
                                    <div className="clearfix">
                                        <h6>已启用的警告通讯方式</h6>
                                        <div className="enabled-del" onClick={() => this.RUDwarninglist(0)}>删除</div>
                                        <div className="enabled-dis" onClick={() => this.RUDwarninglist(1)}>停用</div>
                                        <div className="enabled-add" onClick={() => this.addWarningList()}>新增</div>
                                    </div>
                                    <div className="enabled-content">
                                        <table >
                                            <thead>
                                                <tr>
                                                    <th ><a onClick={(e) => this.enabledSelecAll(e, 'enabled-communication')}></a></th>
                                                    <th>电话</th>
                                                    <th>邮箱</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {this.state.enabledSys && this.state.enabledSys.map(function (item, index) {
                                                    return (
                                                        <tr key={index} >
                                                            <td><a onClick={(e) => this.enabledSingle(e, 'enabled-communication')} title={item.id} > </a></td>
                                                            <td> {item.phone}</td>
                                                            <td>{item.email}</td>
                                                        </tr>
                                                    )
                                                }.bind(this))}
                                            </tbody>
                                        </table>
                                    </div>

                                </div>
                                <div className="disable-communication">
                                    <h6>停用的警告通讯方式</h6>
                                    <div className="enabled-dis" onClick={() => this.RUDwarninglist(2)}>启用</div>
                                    <div className="enabled-content">
                                        <table >
                                            <thead>
                                                <tr>
                                                    <th><a onClick={(e) => this.enabledSelecAll(e, 'disable-communication')}></a> </th>
                                                    <th>电话</th>
                                                    <th>邮箱</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {this.state.disableSys && this.state.disableSys.map(function (item, index) {
                                                    return (
                                                        <tr key={`disableSys${index}`} >
                                                            <td><a onClick={(e) => this.enabledSingle(e, 'disable-communication')} title={item.id}></a></td>
                                                            <td>{item.phone}</td>
                                                            <td>{item.email}</td>
                                                        </tr>
                                                    )
                                                }.bind(this))}
                                            </tbody>
                                        </table>
                                    </div>

                                </div>
                            </div>
                        }


                    </div>
                </div>
              */}
            </section>
        )
    }
}
