import React from "react";
import {Col, Form, FormGroup, HelpBlock, ControlLabel, FormControl, Button,Modal} from 'react-bootstrap';
import $ from 'jquery';
import sha1 from 'sha1';    //sha1加密模块

//页面登录超时模块
export default class LoginToFail extends React.Component {
    constructor(props) {
        super(props);
        this.usernameNow = this.props.username  //当前登录用户的用户名
    }
    //组件将要接收新的props时的操作
    componentWillReceiveProps(nextProps) {
        if(this.props.username != nextProps.username){      //如果登录的账户变了，更新用户名
            this.usernameNow = nextProps.username
        }
    }

    //清除错误提示内容
    clearTips() {
        $('#loginMsg').text('');
    }
    //取消重新登录后的操作
    relogin() {
        //跳转到登录页面
        window.location.href = window.location.origin + '/login';
    }
    // 重新登陆ajax
    // 参数为错误信息提示框的id
    login(id) {
        //获取数据dbname ip port
        var username = $('#login_username').val();  //获取用户输入用户名
        var password = $('#login_Password').val();  //获取用户输入密码
        var promptInformation =$('#' + id);         //获取提示信息的jquery对象（下面会多次使用到）
        var self = this;

        this.clearTips();//清除错误提示内容
        //校验是否填完数据
        if (username && password) { //如果用户名和密码不为空
            //发送ajax请求
            $.ajax({
                url: '/api/login/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                data: {
                    username: username,
                    password: sha1(password) //对用户输入的密码进行sha1处理
                },
                error: function (error) {//错误执行方法
                    if (self.isArray(error)) {
                        var len = error.length;    //得到返回对象的长度
                        promptInformation.css('color', '#9F86FF');           //设置提示的样式
                        promptInformation.text(error[len - 1].message);  //取到后台报错的信息
                    }
                },
                success: function (data) {//成功执行方法
                    var code = data.code;                   
                    if (code == '200') { // 状态码==200  操作成功
                        //隐藏重新登录的窗口
                        self.props.onHide();
                        if(self.usernameNow != username){ //如果当前登录的账户和即将要登录的账户不同
                            self.props.changeAccount()  //重新获取并显示登录用户的信息
                        }
                    } else {
                        //登录失败
                        promptInformation.css('color', '#9F86FF');
                        promptInformation.text(data.message);   //设置错误提示信息
                    }
                }
            });
        } else {
            promptInformation.css('color', '#9F86FF');
            promptInformation.text('请逐项填写所有信息');
        }
    }
    //处理用户名输入框中输入回车的操作
    handleEnterKeyUname(e) {
        if (e.keyCode == 13) {
            $('#login_Password').focus() //密码输入框获取焦点
        }
    }
    //处理密码输入框中输入回车的操作
    handleEnterKeyPwd(e) {  
        if (e.keyCode == 13) {
            this.login("loginMsg")
        }
    }

    render(){
        return(

            <Modal backdrop="static" id='loginModal' show={this.props.show} onHide={this.props.onHide.bind(this)}>
                {/*弹窗顶部*/}
                <Modal.Header closeButton>
                    <Modal.Title>当前网站登陆信息已过期，请重新登陆</Modal.Title>
                </Modal.Header>
                {/*弹窗的主体内容*/}
                <Modal.Body>
                    <Form horizontal>
                        <FormGroup>
                            <Col smOffset={2} sm={8}>
                                <HelpBlock>请验证网站用户信息</HelpBlock>
                            </Col>
                            <Col componentClass={ControlLabel} sm={4}>
                                用户名
                            </Col>
                            <Col sm={7}>                            
                                <input 
                                    id="login_username"
                                    type="text"
                                    className="form-control"
                                    placeholder="请输入用户名"
                                    onKeyDown={this.handleEnterKeyUname.bind(this)}
                                    autoComplete = 'off'
                                />
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={4}>
                                密码
                            </Col>
                            <Col sm={7}>
                                <input
                                    id="login_Password"
                                    type="password"
                                    className="form-control"
                                    placeholder="请输入密码"
                                    onKeyDown={this.handleEnterKeyPwd.bind(this)}
                                    autoComplete = 'new-password'
                                />
                            </Col>
                        </FormGroup>
                    </Form>
                </Modal.Body>
                {/*弹窗底部*/}
                <Modal.Footer>
                    <Button className="modalCancelBtn" bsSize="xs"  onClick={this.relogin.bind(this)}>取消</Button>
                    <Button className="modalSubmitBtn" bsSize="xs" bsStyle="primary" onClick={this.login.bind(this, "loginMsg")}>确定</Button>
                    <Col sm={12}>
                        <HelpBlock id="loginMsg" /> 
                    </Col>
                </Modal.Footer>
            </Modal>
        )
    }
}