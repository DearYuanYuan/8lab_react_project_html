import React from "react"
import $ from "jquery";
import { Tabs, Tab, Pagination, ButtonToolbar, Button, Grid, Row, Col } from 'react-bootstrap';　  //引入bootstrap组件



export default class WarningMode extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            enabledSys: null,
            disableSys: null,
        }
    }
    //全局系统设置
    showGlobalSystem() {
        var self = this;
        $.ajax({
            type: "POST",
            dataType: "json",
            url: "/api/settings/get_warninglist/",
            error() {
            },
            success(data) {
                var enabledSys = [];
                var disableSys = [];
                data.filter(function (item, index) {
                    if (item.enabled == 1) {
                        enabledSys.push(item)
                        return enabledSys
                    }
                    if (item.enabled == 0) {
                        disableSys.push(item)
                        return disableSys
                    }
                })
                self.setState({
                    enabledSys: enabledSys,
                    disableSys: disableSys
                })
            }
        })
    }

    // RUD
    RUDwarninglist(type) {
        var self = this;
        var data = '';
        var RUDlis = [];
        //type==2是启用
        if (type == 2) {
            RUDlis = $(".disable-communication tbody  tr td a.onSelect")

        } else {
            RUDlis = $(".enabled-communication tbody  tr td a.onSelect")
        }
        for (var i = 0; i < RUDlis.length; i++) {
            data += $(RUDlis[i]).attr("title") + '#'
        }
        $.ajax({
            url: "/api/settings/update_warninglist/",
            dataType: "json",
            type: "POST",
            data: { type: type, data: data },
            beforeSend() {
                // console.log(data)
                if (!data.length) {
                    return false;
                }
            },
            success() {
                $(".communicationStyle  a").removeClass('onSelect')
                self.showGlobalSystem()
            },
            error() {
                self.showGlobalSystem()
            },
        })
    }
    addWarningList() {
        var self = this;
        var tbody = document.querySelector(".enabled-content tbody");
        var tr = document.createElement("tr");
        tbody.appendChild(tr);

        var td = document.createElement("td");
        td.innerHTML = "<input type='text'　name='enabledAdd' autoFocus placeholder=请输入新增电话  style='width:120px; height: 24px; border-radius: 4px;background: transparent; border: 1px solid #ccc; padding: 6px 10px;'>";
        tr.appendChild(td);
        var td = document.createElement("td");
        td.innerHTML = "<input type='text'　name='enabledAdd' placeholder=请输入新增邮箱  style='width:120px; height: 24px; border-radius: 4px;background: transparent; border: 1px solid #ccc; padding: 6px 10px;'>";
        tr.appendChild(td);

        td = document.createElement("td");
        // 创建一个确认和一个取消按钮
        td.innerHTML = "<span style='color:#32a1ff'>确定</span>&nbsp;<span style='color:#CB4B4B'>取消</span>";
        tr.appendChild(td);

        // 给确定和取消按钮添加事件
        //取消按钮
        var cancel = td.children[1];
        cancel.onclick = function () {
            //删除当前行，也不需要去考虑数据
            tbody.removeChild(this.parentNode.parentNode);
        };

        // 确认按钮事件
        // console.log(addPhone.children[0])

        var yes = td.children[0];
        yes.onclick = function () {
            // 在点击确认按钮的时候，我们想要把数据添加为datas中的新项
            // 第一步，我们需要获取input中的内容
            var phone = tr.children[0].children[0].value;
            var email = tr.children[1].children[0].value;
            var block = this;



            // 邮箱和手机验证

            var testEmail = /^([0-9A-Za-z\-_\.]+)@([0-9a-z]+\.[a-z]{2,3}(\.[a-z]{2})?)$/g;
            if (!testEmail.test(email)) {
                $.toast({
                    text: '请检查您输入的邮箱',                 //内容
                    showHideTransition: 'fade', //出现和消失的动画效果
                    allowToastClose: true,      //是否允许用户关闭弹窗
                    hideAfter: 5000,            //在设定时间之后自动消失
                    loader: false,              //是否显示加载进度
                    stack: false,                //最多同时显示的提示框的个数
                    position: 'top-center',      //位置
                    textAlign: 'center',          //文字对齐方式
                })
                return;
            }
            var testPhone = /((\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)/
            if (!testPhone.test(phone)) {
                $.toast({
                    text: '请检查您输入的手机号',                 //内容
                    showHideTransition: 'fade', //出现和消失的动画效果
                    allowToastClose: true,      //是否允许用户关闭弹窗
                    hideAfter: 5000,            //在设定时间之后自动消失
                    loader: false,              //是否显示加载进度
                    stack: false,                //最多同时显示的提示框的个数
                    position: 'top-center',      //位置
                    textAlign: 'center',          //文字对齐方式
                })
                return;
            }


            // console.log(`${phone}---${email}---`)
            $.ajax({
                url: '/api/settings/add_warninglist/',
                type: 'POST',
                dataType: 'json',
                data: {
                    phone: phone,
                    email: email
                },
                error() {
                    self.showGlobalSystem()
                    // console.log(block)
                    tbody.removeChild(block.parentNode.parentNode);

                },
                success() {
                    self.showGlobalSystem()
                    tbody.removeChild(block.parentNode.parentNode);
                }
            })
        }
    }
    //启用警告通讯方式全选
    enabledSelecAll(e, father) {
        if ($(e.target).is('.onSelect')) {
            $(e.target).removeClass('onSelect')
            var enabledArr = $(`.${father}  .enabled-content tbody tr td a`);
            for (var i = 0; i < enabledArr.length; i++) {
                $(enabledArr[i]).removeClass('onSelect')
            }
        } else {
            $(e.target).addClass('onSelect')
            var enabledArr = $(`.${father}  .enabled-content tbody tr td a`);
            for (var i = 0; i < enabledArr.length; i++) {
                $(enabledArr[i]).addClass('onSelect')
            }
        }
    }

    enabledSingle(e, who) {
        $(e.target).toggleClass('onSelect');
        this.allchk(who);
    }

    componentDidMount() {
        this.showGlobalSystem();
    }
    //单选判断
    allchk(who) {
        var chknum = $(`.${who} tbody  tr td a`).size();//选项总个数
        var chk = 0;
        $(`.${who} tbody  tr td a`).each(function () {
            if ($(this).hasClass("onSelect") == true) {
                chk++;
            }
        });
        if (chknum == chk) {//全选
            $(`.${who}   th  a`).addClass('onSelect')
        } else {//不全选
            $(`.${who}   th  a`).removeClass('onSelect')
        }
    }
    render() {
        return (
            <div className='warning-mode settings-mode'>
                <h2 className="content-title">
                    警告通讯方式
                 </h2>


                <div className="communicationStyle">


                    <Grid>
                        <h4>警告通讯方式</h4>
                        <Row className="show-grid">
                            <Col xs={12} md={6}> <div className="enabled-communication ">
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

                            </div></Col>
                            <Col xs={12} md={6}>
                                <div className="disable-communication">

                                    <div className="clearfix">
                                        <h6>停用的警告通讯方式</h6>
                                        {/*   <div className="enabled-del">删除</div>  */}
                                        <div className="enabled-dis" onClick={() => this.RUDwarninglist(2)}>启用</div>
                                        {/*   <div className="enabled-add">新增</div> */}

                                    </div>
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
                            </Col>
                        </Row>
                    </Grid>




                </div>
            </div>
        )
    }
}