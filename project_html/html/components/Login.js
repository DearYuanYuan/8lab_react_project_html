import React from "react";
import $ from "jquery";
import LoginForm from  "./login/LoginForm"
import RegisterForm from  "./login/RegisterForm"

/* 登录注册页 */
export default class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoginVisible: false,          //控制登陆模块的显示影藏
            isRegisterVisible: false,       //控制注册模块的显示影藏
            buttonIsVisible: true,          //登陆注册组合按钮的显示影藏
            isVisible: false              //控制波浪背景和文字的两种显示样式
        }
    }

    // 点击登陆按钮，显示登录窗口
    loginClick() {
        this.setState({
            isLoginVisible: !this.state.isLoginVisible,
            buttonIsVisible: !this.state.buttonIsVisible,
            isVisible: !this.state.isVisible,
            isRegisterVisible: !this.state.isRegisterVisible,
        })
    }
    //点击注册按钮，显示注册窗口
    registerClick() {
        this.setState({
            isRegisterVisible: !this.state.isRegisterVisible,
            buttonIsVisible: !this.state.buttonIsVisible,
            isVisible: !this.state.isVisible,
            isLoginVisible:!this.state.isLoginVisible
        })
    }

    //在 componentDidMount里面取到dom对象了
    componentDidMount() {
        setTimeout(function(){
            $('.login-video-start video').animate({zIndex:'-2',opacity:'0'},1000)
        },3000)
        setTimeout(function(){
            // $('.login-video-start').hide()
            $('.login-video-start video').fadeOut()            
        },4500)


        setTimeout(function(){
            $('.toggleLoginShow').css({ opacity:"1"});
            $('.toggleLoginHide').css({ opacity:"1"});
            $('.homeIDlogin').css({ opacity:"1"});
            $('#loginUsername, #loginPassword, #username, #password, #confirmpassword, .userTooltip, .pwTooltip').css({
                width:"270px",
                opacity:"1"
            })
            $('.verificationForm').css({
                opacity:"1"
            })
            $('.loginAnimate').css({
                opacity:1
            })
        },4000)

    //     setTimeout(function(){
    //         $('.homeIDlogin').animate({
    //             opacity:"1"
    //         },500)            
    //     },5000)
  
    //    setTimeout(function(){
    //        $('#loginUsername, #loginPassword, #username, #password, #confirmpassword, .userTooltip, .pwTooltip').animate({
    //             width:"270px",
    //             opacity:"1"
    //         },500)
    //    },4000)
    //    setTimeout(function(){
    //        $('.verificationForm').animate({
    //             opacity:"1"
    //         },500)
    //    },4500)
    //    setTimeout(function(){
    //        $('.loginAnimate').animate({
    //             opacity:1
    //         },500)
    //    },5000)
    }

    render() {
       
        return (
            <div className='login-page'>
                <div className='loginHeader'>
                    {/*<span className='loginLogo'></span>*/}
                    {/*<img src="/static/img/shandong-logo.png" alt="" className='loginLogo-shandong' />*/}
                    {/*<h4 className="homeIDlogin">八分量信息科技有限公司</h4>*/}
                </div>                
                <div id='loginContainer' className='clearfix'>
                    <div className='buttonBox'>
                        <div className={!this.state.isLoginVisible?'inputBox toggleLoginShow':'inputBox toggleLoginHide'} >
                            <div className='box-background'>
                                <div className='box' id='login-box'>
                                    <div className='fields-box'>
                                        <LoginForm />
                                        <button className='button1 first-register-btn common-login-style loginAnimate' onClick={this.registerClick.bind(this)}>还没有账号？<span style={{color:'#32A1FF'}}>立即注册</span></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={this.state.isRegisterVisible?'inputBox toggleLoginShow':'inputBox toggleLoginHide'} >
                            <div className='box-background regis'>
                                <div className='box regis-box' id='register-box'>
                                    <div className='fields-box'>
                                        <RegisterForm />
                                        <button className='button2 first-login-btn common-login-style' onClick={this.loginClick.bind(this)}>已有账号？<span style={{color:'#32A1FF'}}>立即登录</span></button>
                                    </div>
                                </div>
                            </div>
                        </div>                        
                    </div>
                </div>
                <div className="login-video-start" >
                    <video src="/static/img/video/intro01.mp4" autoPlay loop preload="auto">
                    your browser does not support the video tag
                    </video>
                </div>
                <div className="login-video" >
                    <video src="/static/img/video/intro02.mp4" autoPlay loop preload="auto">
                    your browser does not support the video tag
                    </video>
                </div>               
            </div>
        );
    }
}

