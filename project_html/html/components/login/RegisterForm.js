
import React from "react";
import $ from "jquery";
import sha1 from "sha1";
import { Button, Collapse } from 'react-bootstrap';　  //引入bootstrap组件
import { getUUID } from '../../../html/utils/utils.js'
/* 注册form */
export default class RegisterForm extends React.Component {

    constructor(props) {
        super(props);  
        this.state = {
            actionInProgress: false,
            error: null,              //error 为空
            usererror: null,//登录名错误提示
            pwderror: null,//登录密码错误提示
            phonecodeError: null,//短信验证码
            phoneError: null,//手机号错误提示
    
            open1: true,
            open2: false,
            open3: false,
            phoneCodeText: '获取验证码',//获取验证码文字
            trackingText: '请您直视摄像头，正在识别中….',//人脸识别描述文字
            UUID: getUUID()//获取传入后台的唯一值；
    
        }  
    }
    
    // 组件已经成功被渲染
    componentDidMount() {
        // this.refs获取真实的DOM元素 ()
        // 登陆form模块出现的时候用户输入框获得焦点
        $(this.refs.username).focus();
    }
    

    //当用户在有输入操作的时候  当Input输入框发生change时
    onChange = () =>{
        this.setState({
            error: null,    //error 为空
            usererror: null,//登录名错误提示
            pwderror: null,//登录密码错误提示
            phonecodeError: null,//短信验证码
            phoneError: null,//手机号错误提示

        });
    }
    // 注册弹窗账户获得焦点
    onBlur = (e) => {
        // 如果值不为空的情况下
        if (e.target.value != '') {
            var checkUser = $('.checkuser');
            if (!this.isPass(e.target.value) || e.target.value.length > 18) {
                checkUser.text('长度6~18的字符、数字和下划线');
            } else {
                checkUser.text('');
            }
        }
    }
    // 第一次输入密码获得焦点
    onBlur2 = (e) => {
        if (e.target.value != '') {
            var checkPass = $('.checkpass');

            if (!this.isPass(e.target.value) || e.target.value.length > 18) {
                checkPass.text('长度6~18的字符、数字和下划线');
            } else {
                checkPass.text('');
            }
        }
    }
    // 正则匹配
    isPass(password) {
        var re = /^[0-9A-Za-z_]{6,18}$/;
        return re.test(password);
    }


    /*验证用户名主要是防止该用户名已经被注册

       参数　flag=0　　　　　后台需要
          　username　　　　用户输入用户名
            password　　　　用户输入密码
            uuid_var　　　　后台识别唯一凭证
   */
    verifyUserName = (e) => {
        //登录先检查用户名密码是否为空和两次密码是否一样,如果成功校验就向后台传输
        e.preventDefault();
        var username = this.refs.username.value;   //获取用户输入用户名
        var password = this.refs.password.value;    // 获取用户输入密码
        var confirmpassword = this.refs.confirmpassword.value;  //获取用户第二次输入密码

        this.setState({ actionInProgress: true });

        if (username == "" || !this.isPass(username) || username.length > 18) {// 对用户输入名字长度进行限制
            $(this.refs.username).focus();
            this.setState({ actionInProgress: false });
        } else if (password == "" || !this.isPass(password)) { // 如果第一次密码为空
            $(this.refs.password).focus();
            this.setState({ actionInProgress: false });
        } else if (confirmpassword == "") {  //第二次输入密码为空
            $(this.refs.confirmpassword).focus();
            this.setState({ actionInProgress: false });
        } else if (password != confirmpassword) {    // 如果两次输入密码不相同
            this.setState({ actionInProgress: false });
        } else {
            var block = this;
            $.ajax({
                url: "/api/verify_user_info/",
                type: 'POST',
                dataType: 'json',
                cache: false,
                data: {
                    flag: 0,
                    uuid_var: this.state.UUID,
                    username: username,
                    password: sha1(password),       //对用户输入密码进行sha1处理
                    password2: sha1(confirmpassword)
                }
            })
            .success(function (data) {
                block.setState({
                    isLoading: false,
                });
                if (data.code == 200) {
                    block.setState({ open1: !block.state.open1, open2: !block.state.open2 });
                }
                else {
                    $('.checkuser').text(data.message);
                    block.setState({
                        actionInProgress: false,
                        isLoading: false,
                    });
                }
            })
            .error(function () {
                block.setState({
                    error: "服务繁忙，请稍候。",
                    actionInProgress: false,
                    isLoading: false,
                });
            });
        }
    }

    //获取手机短信验证码
    getPhoneCode = (e) => {
        e.preventDefault();　　　　　　　　　            　//阻止from表单默认操作　例如按enter提交后会刷新页面
        var block = this;
        var phone = block.refs.phone.value;   　　　　　　//获取用户手机号
        var code = $('.register-getPhoneCode');　　　　　//获取短信验证码div　方便获取后修改样式
        if (code.hasClass("disabled")) {
            return false;
        }

        var rePhone = /^[0-9A-Za-z_]{6,18}$/;
        if(phone==''||!rePhone.test(phone)){
            this.setState({
                phoneError: '请检查您输入的手机号!',//手机号错误提示
            });
        }
        $.ajax({
            url: "/api/send_verify_code/",
            type: 'POST',
            dataType: 'json',
            cache: false,
            data: {
                flag: 0,
                phone: phone,　　　　　　　　　　　　　　　　　//用户输入手机号
            },
            success: function (data) {
                //data.code是200则成功，其他则失败
                if (data.code == 200) {
                    //提示用户　　　　　　　　　　
                    block.setState({
                        phoneError: '验证码已发送至您的手机，请注意查收。'
                    })

                    // 获取验证码，倒计时60秒，避免用户频繁发送验证码
                    var second = 60;
                    var t = setInterval(function () {
                        block.setState({
                            phoneCodeText: second--
                        })
                        code.addClass('disabled')
                        if (second < 0) {
                            clearInterval(t);
                            block.setState({
                                phoneCodeText: '获取验证码'
                            })
                            code.removeClass('disabled')
                        }
                    }, 1000)
                } else {
                    block.setState({
                        phoneError: data.message
                    })
                }

            },
            error: function () {
                block.setState({
                    phoneError: '服务器异常，请检查您的网络状态！'
                })
            }
        })
    }


    verifyPhoneCode = (e) => {
        e.preventDefault();
        var block = this;
        var phone = block.refs.phone.value;
        var verify_code = block.refs.phonecode.value;

        $.ajax({
            url: "/api/verify_user_info/",
            type: 'POST',
            dataType: 'json',
            cache: false,
            data: {
                flag: 1,
                uuid_var: this.state.UUID,
                phone: phone,
                verify_code: verify_code
            }
        })
        .success(function (data) {
            block.setState({
                isLoading: false,
            });
            if (data.code == 200) {
                block.setState({ open2: !block.state.open2, open3: !block.state.open3 });
                var video = document.getElementById('video');
                var canvas = document.getElementById('canvas');
                var context = canvas.getContext('2d');
                var websocket = null;
                //判断当前浏览器是否支持WebSocket    
                if ('WebSocket' in window) {
                    var adress = window.location.host;
                    websocket = new WebSocket(`wss:${adress}/api/face_recognition/`);
                } else { alert("对不起！你的浏览器不支持webSocket") }
                //连接发生错误的回调方法      
                websocket.onerror = function () {
                    setMessageInnerHTML("error");
                };
                //连接成功建立的回调方法      
                websocket.onopen = function (event) {
                    setMessageInnerHTML("加入连接");
                };

                //连接关闭的回调方法      
                websocket.onclose = function () {
                    setMessageInnerHTML("断开连接");
                };
                //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，     
                // 防止连接还没断开就关闭窗口，server端会抛异常。     
                window.onbeforeunload = function () {
                    var is = confirm("确定关闭窗口？");
                    if (is) {
                        websocket.close();
                    }
                };
                //将消息显示在网页上     
                function setMessageInnerHTML(innerHTML) {
                    console.log(innerHTML)
                };
                //关闭连接      
                function closeWebSocket() {
                    websocket.close();
                }


                websocket.onmessage = function (evt) {
                    setMessageInnerHTML(evt.data);
                    //后台已经取到人脸数据可以断开连接了
                    if (evt.data == 200) {
                        setTimeout(function () {
                            context.clearRect(0, 0, canvas.width, canvas.height);
                            block.setState({ trackingText: '采集完成！点击按钮完成注册！' })
                            trackingTask.stop();　　　//停止前端的canvas绘制人脸，否者只要对准镜头就会一直绘制
                            websocket.close();　　　　//关闭websocket请求
                            setTimeout(function () { trackingTask.stop(); video.pause(); video.srcObject.getVideoTracks()[0].stop(); }, 100);
                        }, 500);
                    }
                    if(evt.data==202){
                        context.clearRect(0, 0, canvas.width, canvas.height);
                        block.setState({ trackingText: '人脸检测超时！' })
                        trackingTask.stop();　　　//停止前端的canvas绘制人脸，否者只要对准镜头就会一直绘制
                        websocket.close();　　　　//
                        setTimeout(function () { trackingTask.stop(); video.pause(); video.srcObject.getVideoTracks()[0].stop(); }, 100);
                    }
                };

                var tracker = new tracking.ObjectTracker('face');
                tracker.setInitialScale(4);
                tracker.setStepSize(2);
                tracker.setEdgesDensity(0.1);
                const trackingTask = tracking.track('#video', tracker, { camera: true });
                trackingTask.run();
                tracker.on('track', function (event) {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    event.data.forEach(function (rect) {
                        context.drawImage(video, 0, 0, canvas.width, canvas.height);
                        context.strokeStyle = '#a64ceb';　　　　　　//人脸框边颜色
                        context.strokeRect(rect.x, rect.y, rect.width, rect.height);
                        var imageData = context.getImageData(0, 0, 270, 212);
                        var pxData = imageData.data;
                        //canvas区域的长为1000，宽为667
                        for(var i = 0; i < 270 * 212; i++) {
                        
                            //分别获取rgb的值(a代表透明度，在此处用不上)
                            var r = pxData[4 * i];
                            var g = pxData[4 * i + 1];
                            var b = pxData[4 * i + 2];
                        
                            //运用图像学公式，设置灰度值
                            var grey = r * 0.3 + g * 0.59 + b * 0.11;
                            //将rgb的值替换为灰度值
                            pxData[4 * i] = grey;
                            pxData[4 * i + 1] = grey;
                            pxData[4 * i + 2] = grey;
                        }
                        //将改变后的数据重新展现在canvas上
                        context.putImageData(imageData, 0, 0, 0, 0, 270, 212);
                        var data = canvas.toDataURL('image/jpeg', 1.0);
                        // var newblob = dataURItoBlob(data);         
                        websocket.send(`${data}:#:${block.state.UUID}`);
                        //接收到消息的回调方法      
                    });
                });
            }

        })
    }

    // phoneCodeSubmit = (e)=> {
    //     e.preventDefault();
    //     var block = this;
    //     var phone = block.refs.phone.value;   　　　　　　//获取用户手机号

    //     //如果用户点击过发送验证码了就阻止操作
    //     $.ajax({
    //         url: "/api/send_verify_code/",
    //         type: 'POST',
    //         dataType: 'json',
    //         cache: false,
    //         data: {
    //             phone: phone,
    //             uuid_var: this.state.UUID    //对用户输入密码进行sha1处理
    //         },
    //         success: function () {

    //         }
    //     })
    // }

    //完成注册
    completeRegistration = (e) => {
        e.preventDefault();
        var block = this;
        var username = block.refs.username.value;   //获取用户输入用户名
        var password = block.refs.password.value;    // 获取用户输入密码
        var confirmpassword = block.refs.confirmpassword.value;  //获取用户第二次输入密码
        var phone = block.refs.phone.value;   　　　　　　//获取用户手机号
        var verify_code = block.refs.phonecode.value;   //短信验证码
        $.ajax({
            url: "/api/new_register/",
            type: 'POST',
            dataType: 'json',
            cache: false,
            data: {
                username: username,
                password: sha1(password),
                password2: sha1(confirmpassword),
                verify_code: verify_code,
                phone: phone,
                uuid_var: block.state.UUID    //对用户输入密码进行sha1处理
            },
            success: function (data) {
                if (data.code == 200) {
                    block.setState({
                        open3: false
                    })
                    $('.login-open-contrl').removeClass('login-open-gray')
                } else {
                    block.setState({
                        open3: false
                    })
                    $('.login-open-contrl').removeClass('login-open-gray')
                }
            },
            error: function () {

            }
        })
    }
    render() {
        return (
            <div>
                <div className='login-open-contrl'>
                    <div className='login-contrl-num'>
                        1
                    </div>
                    <span>账户信息</span>
                </div>
                <Collapse in={this.state.open1}>
                    <form className='form-horizontal login-open-form-two' onSubmit={this.verifyUserName}>
                        <div className='user'>
                            <span className="userTooltip">用户名</span>
                            <input className='loginForm' type='text' name='username' ref='username' placeholder="请输入用户名" style={{ display: "none" }} />
                            <input id="username" className='loginForm' type='text' name='username' ref='username' placeholder="请输入用户名" onChange={this.onChange}
                                onBlur={this.onBlur} autoComplete="off" />
                        </div>
                        <div className="checkuser">
                        </div>
                        <div className='pwd'>
                            <span className="pwTooltip">密码</span>
                            <input className='loginForm' type='password' name='password' ref='password' placeholder="请输入密码" style={{ display: "none" }} />
                            <input id="password" className='loginForm' type='password' name='password' ref='password' placeholder="请输入密码" onChange={this.onChange}
                                onBlur={this.onBlur2} autoComplete="off" onFocus={()=> {this.type='password'}} />
                        </div>
                        <div className="checkpass">

                        </div>
                        <div className='pwd'>
                            <span className="pwTooltip">再次输入密码</span>
                            <input className='loginForm' type='password' name='confirmpassword' ref='confirmpassword' placeholder="请重复输入密码" style={{ display: "none" }} />
                            <input id="confirmpassword" className='loginForm' type='password' name='confirmpassword' ref='confirmpassword' placeholder="请重复输入密码" onChange={this.onChange}
                                onBlur={this.onBlur3} autoComplete="off" onFocus={()=> {this.type='password'}} />
                        </div>
                        <div className="checkpassagin">
                        </div>
                
                        <button
                            type='submit'
                            className="button4 login-btn first-register-btn"
                            disabled={this.state.actionInProgress}
                        >
                            下一步
                         </button>
                    </form>
                </Collapse>



                <div className='login-open-contrl' className={this.state.open2 || this.state.open3 ? 'login-open-contrl' : 'login-open-contrl login-open-gray'}>
                    <div className='login-contrl-num'>
                        2
                 </div>
                    <span>手机验证</span>
                </div>

                <Collapse in={this.state.open2}>
                    <form className='login-open-form-two' onSubmit={this.verifyPhoneCode}>
                        <div className='user'>
                            <span className="userTooltip">手机号（用于短信验证）</span>
                            <input className='loginForm' type='text' name='username' ref='phone' placeholder="请输入手机号" style={{ display: "none" }} />
                            <input className='loginForm loginInput' type='text' name='username' ref='phone' placeholder="请输入手机号" onChange={this.onChange} autoComplete="off" >

                            </input>
                            <div className='register-getPhoneCode' onClick={this.getPhoneCode}>{this.state.phoneCodeText}</div>
                        </div>
                        <div className="checkusers">{this.state.phoneError}</div>
                        <div className='pwd'>
                            <span className="pwTooltip">短信验证码</span>
                            <input className='loginForm' type='password' name='password' ref='phonecode' placeholder="请输入短信验证码" style={{ display: "none" }} autoComplete="off" />
                            <input className='loginForm loginInput' type='password' name='password' ref='phonecode' placeholder="请输入短信验证码" onChange={this.onChange} autoComplete="off" />
                        </div>
                        <div className="checkpasses">{this.state.phonecodeError}</div>
                        {this.state.error &&
                            <div className='http-warning'>
                                <i className='glyphicon glyphicon-warning-sign'></i>
                                {this.state.error}
                                <br />s
                            </div>
                        }

                        <button
                            type='submit'
                            className="button3 login-btn first-login-btn loginAnimate"
                            // disabled={this.state.actionInProgress}
                            disabled={this.state.isLoading}
                            style={this.state.isLoading ? { cursor: "wait" } : { cursor: "pointer" }}
                        >
                            下一步
                 </button>

                    </form>
                </Collapse>






                <div className='login-open-contrl login-open-gray' >
                    <div className='login-contrl-num'　>
                        ３
                            </div>
                    <span>面部识别</span>
                </div>
                <Collapse in={this.state.open3}>

                    <form className='login-open-form-two' onSubmit={this.completeRegistration} >
                        <div style={{ color: '#fff', fontSize: '12px' }}>人脸信息采集</div>
                        <div className='face-container'>
                            <video id="video" width="270" height="212" preload="true" autoPlay loop muted></video>
                            <canvas id="canvas" width="270" height="212"></canvas>
                        </div>

                        <div className='http-warning'>
                            {this.state.trackingText}
                            <br />
                        </div>

                        <button
                            type='submit'
                            className="button3 login-btn first-login-btn loginAnimate"
                            // disabled={this.state.actionInProgress}
                            disabled={this.state.isLoading}
                            style={this.state.isLoading ? { cursor: "wait" } : { cursor: "pointer" }}
                        >
                            完成
             </button>
                    </form>
                </Collapse>
            </div>
        );
    }
}