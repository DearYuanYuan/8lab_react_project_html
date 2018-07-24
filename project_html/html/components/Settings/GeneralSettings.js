import React from "react"
import $ from "jquery";
import { Tabs, Tab, Pagination, ButtonToolbar, Button, Grid, Row, Col } from 'react-bootstrap';　  //引入bootstrap组件



export default class GeneralSettings extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userSelectSet: false,//用户设置通用设置选择下拉框默认不显示
            userSelectValue: '',//用户选择首页或者5个页面
            userSelectIndex: false,//用户选择首页或者5个页面的index后台传值
            userSelectErrorMsg: '',//用户通用设置点击确定发生错误信息提示
        }
    }    //通用设置选择打开首页或五个页面
    handleUserSelectSet(e) {
        //判断点击的是否是p标签，将p的text赋值给input

        if (/^P$/i.test(e.target.tagName)) {
            this.setState({
                userSelectValue: $(e.target).text(),//设置input的值
                userSelectIndex: $(e.target).index().toString(),//设置后台传值，下次打开是首页或者5个页面
            })
        }
        //点击下拉组件，下拉框显示或隐藏
        this.setState({
            userSelectSet: !this.state.userSelectSet
        })
    }

    //用户设置有效时长正则
    putInTimeSet(e) {
        var re = /^[0-9]+$/;
        var minute = parseInt($(e.target).val())
        if (!re.test($(e.target).val())) {
            $(e.target).val('')
        }
        if (minute <= 0) {
            $(e.target).val('')
        }
        if (minute >= 240 * 60) {
            $(e.target).val(240 * 60)
        }
    }
    //用户设置cookie
    //memory:是否有上次设置记录未过期的cookie设置 默认值false，若有，则从cookie中取出替代this.state.userSelectIndex初始值
    userSetCookieTime(memory) {
        //获取用户填写的有效时长
        var minute = $('#userSetMinute').val();
        //设置有效时长
        var date = new Date()
        date.setTime(date.getTime() + minute * 60 * 1000);
        // console.log(date.toGMTString())
        //添加cookie，记录下用户设置下次打开页面是首页还是5个页面
        document.cookie = "userSystemSetType=" + (memory ? memory : this.state.userSelectIndex) + ";expires=" + date.toGMTString();
        // this.deleteCookie('userSystemSetType')
        // console.log(document.cookie)
    }

    //通用设置确定，发起请求
    systemSetConfirmAjax() {
        if ($('#userSetMinute').val() == '') {
            this.setState({
                userSelectErrorMsg: '请填写账户在线时长'
            })
        } else if (this.state.userSelectValue == '') {
            this.setState({
                userSelectErrorMsg: '请选择登录打开页面的方式'
            })
        } else {
            //重新设置cookie，则清除上次设置
            this.userSetCookieTime(false);

            var self = this;
            $.ajax({
                url: '/api/settings/set_session_timeout/',
                type: 'POST',
                dataType: 'json',
                data: {
                    timeout: $('#userSetMinute').val(),
                },
                cache: false,
                success: function (data) {
                    if (data.code == 200 || data.code == 203) {
                        self.setState({
                            userSelectErrorMsg: '设置成功',
                        })
                        //200ms after,关闭用户设置弹框
                        setTimeout(function () {
                            self.setState({
                                userSelectErrorMsg: '',
                            })
                        }, 200)
                    } else {
                        self.setState({
                            userSelectErrorMsg: data.message
                        })
                    }

                    // console.log(data)
                },
                error: function () {
                    self.setState({
                        userSelectErrorMsg: '服务繁忙，请稍后重试～'
                    })
                },
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
    componentWillMount() {
        //获取系统超时时间
        //get_session_timeout
        var self = this;
        $.ajax({
            url: '/api/settings/get_session_timeout/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function (data) {
                console.log(data.timeout)
                if (data.code == 200 || data.code == 203) {
                    // console.log(data)
                    //设置用户在线时长
                    $('#userSetMinute').val(data.timeout)
                    console.log($('#userSetMinute').val())
                    //重新设置cookie过期时长，默认60分钟
                    //获取cookie，若存在上次设置
                    //并设置用户设置打开首页或者五个多页
                    if (self.getCookie('userSystemSetType') != '') {
                        var memory = self.getCookie('userSystemSetType')
                        self.userSetCookieTime(memory);
                        //上次设置cookie未过期
                        self.setState({
                            userSelectValue: memory == 0 ? '仅打开首页' : '自动开启首页、信息中心、攻防态势、全球态势感知、3D地球共 5 个页面',//设置input的值
                            userSelectIndex: memory,//设置后台传值，下次打开是首页或者5个页面
                        })
                    } else {
                        return;
                        // self.userSetCookieTime(false);
                    }
                } else {
                    //发生错误，则删除cookie
                    self.deleteCookie('userSystemSetType')
                    $('#userSetMinute').val('')
                }
                // console.log(data)
            },
            error: function () {
                //发生错误，则删除cookie
                self.deleteCookie('userSystemSetType')
                $('#userSetMinute').val('')
            },
        })
    }

    render() {
        return (
            <div className='generalS-sttings settings-mode'>
                <h2 className="content-title">
                    通用设置
                 </h2>


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
                        <button className="userSetConfirm  btn btn-sm btn-primary" onClick={() => this.systemSetConfirmAjax()} >确认</button>
                    </div>
                </div>
            </div>



        )

    }

}