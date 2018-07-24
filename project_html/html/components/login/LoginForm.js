
import React from "react";
import $ from "jquery";
import sha1 from "sha1";
import { Button, Collapse } from 'react-bootstrap';　  //引入bootstrap组件
import { getUUID } from '../../../html/utils/utils.js'
/* 登录form */
export default class LoginForm extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            actionInProgress: false,  //输入错误提示  是否显示
            error: null,              //error 为空
            usererror: null,//登录名错误提示
            pwderror: null,//登录密码错误提示
            vererror: null,
            phoneError: null,　　　　//手机号码错误提示
            phonecodeError: null,  　//手机号码验证码错误提示
            isLoading: false,



            type: null,    //用户有几重认证方式　　　0只需要用户名和密码　　　　1用户名+短信　　　2用户名+人脸　　　3全部需要
            safe: 0,

            open1: true,
            open2: false,

            UUID: getUUID(),//获取传入后台的唯一值；
            phoneCodeText: '获取验证码',
        };

        this.username = null;
        this.password = null;
        this.phone = null;
    }
    // 组件已经成功被渲染
    componentDidMount() {
        // this.refs获取真实的DOM元素 ()
        // 登陆form模块出现的时候用户输入框获得焦点
        $(this.refs.username).focus();
        //验证码部分初始化数据
        var container1 = document.getElementById("vCode1");
        this.code1 = new vCode(container1);
        var code1 = this.code1;
        //更换验证码按钮事件绑定
        $('.change-one').click(function () {
            code1.addEvent();
            code1.update();
        })
    }
    
    //当用户在有输入操作的时候  当Input输入框发生change时
    onChange = () => {
        this.setState({
            error: null,
            usererror: null,
            pwderror: null,
            vererror: null,
            phoneError: null,
            phonecodeError: null,
        });
    }

    openwin(url) {
        var a = document.createElement("a"); //创建a对象
        a.setAttribute("href", `${window.location.origin}/${url}`);
        a.setAttribute("target", "_blank");
        a.setAttribute("id", "camnpr");
        document.body.appendChild(a);
        a.click(); //执行当前对象
    }

    //输入密码失去焦点的时候进行认证，判断用户是否设置多重认证　flag是后台需要传的参数
    onBlur = ()=> {
        var block = this;
        var username = this.refs.username.value;   //获取用户输入用户名
        var password = this.refs.password.value;   // 获取用户输入密码
        //如果用户名和密码为空则不发出请求
        if (!username || !password) {
            return;
        }
        $.ajax({
            url: "/api/verify_user_info/",
            type: 'POST',
            dataType: 'json',
            cache: false,
            data: {
                username: username,
                password: sha1(password),  //对用户输入密码进行sha1处理
                flag: 2
            }
        })
        .success(function (data) {
            if (data.code == 200) {

                // flag==0  只需要用户名密码
                // flag==1  需要用户名密码+短信
                // flag==2  需要用户名密码+人脸
                // flag==3  需要用户名密码+短信+人脸
                // { type: data.flag}
                block.setState(
                    { type: data.flag }
                )
                var storage = window.localStorage;
                storage.setItem("flag", data.flag);
            } else {
                block.setState(
                    { pwderror: data.message, type: 0 }
                )
            }

        })
        .error(function (data) {
            block.setState(
                { pwderror: '请检查您的网络状态！' }
            )
        })
    }
    //提交登陆
    onSubmit = (e) => {
        e.preventDefault();
        //登录先检查用户名密码是否为空,如果都不为空就向后台传输
        var username = this.refs.username.value;   //获取用户输入用户名
        var password = this.refs.password.value;   // 获取用户输入密码

        var vercode = this.refs.vercode.value;     //获取用户输入验证码
        var vercode1 = $('#Code1').val().toLowerCase();
        var code1 = this.code1.code.toLowerCase();  //获取验证码生成插件里面随机生成的验证码
        // console.log(vercode, vercode1, this.code1.code, code1);

        this.setState({
            actionInProgress: true,
            isLoading: true
        });
        // 如果用户输入用户名为空
        if (username == "") {
            $(this.refs.username).focus();
            this.setState({ usererror: "请输入用户名" });
            this.setState({
                actionInProgress: false,
                isLoading: false
            });
            return;
        }
        //如果用户输入密码为空
        if (password == "") {
            $(this.refs.password).focus();
            this.setState({ pwderror: "请输入密码" });
            this.setState({
                actionInProgress: false,
                isLoading: false
            });
            return;
        }
        //如果用户输入验证码为空
        if (vercode == "") {
            $(this.refs.vercode).focus();
            this.setState({ vererror: "请输入验证码" });
            this.setState({
                actionInProgress: false,
                isLoading: false
            });
            return;
        }
        //如果用户输入验证码不正确
        // var code1 = this.code1.code;  //获取验证码生成插件里面随机生成的验证码
        if (code1 !== vercode1) {
            this.setState({
                error: "验证码错误",
                actionInProgress: false,
                isLoading: false
            });
            return;
        }


        var block = this;
        //所有用户默认登录方式
        if (block.state.type == 0) {
            $.ajax({
                url: "/api/new_login/",
                type: 'POST',
                dataType: 'json',
                cache: false,
                data: {
                    username: username,
                    password: sha1(password),  //对用户输入密码进行sha1处理
                }
            })
            .success(function (data) {
                if (data.code == 200) {
                    block.setState({
                        isLoading: false,

                    });

                    // window.location.href = "/TrialEdition";
                    //修改新窗口的url
                    var cookieList = document.cookie.split(';')
                    // console.log(cookieList.indexOf('userSystemSetType'))
                    if (cookieList.indexOf('userSystemSetType=0') != -1) {
                        //用户设置只打开首页
                        window.location.href = "/";
                    } else if (cookieList.indexOf('userSystemSetType=1') != -1) {
                        //用户设置打开5个页面
                        window.location.href = "/";
                        block.openwin(`targetRange`);
                        // setTimeout(function () {
                        //     // IE
                        //     if (document.all) {
                        //         document.getElementById("wave").click();
                        //     }
                        //     // 其它浏览器
                        //     else {
                        //         var e = document.createEvent("MouseEvents");
                        //         e.initEvent("click", true, true);
                        //         document.getElementById("wave").dispatchEvent(e);
                        //     }
                        // }, 500);
                        block.openwin(`3DMap`);
                        block.openwin(`infoCenter`);
                        block.openwin(`mapAttack`);
                    } else {
                        window.location.href = "/";
                    }
                } else {
                    block.setState(
                        { pwderror: data.message, isLoading: false, }
                    )
                }

            })
            .error(function (data) {
                block.setState(
                    { pwderror: data.message, isLoading: false, }
                )
            })
        }


        //用户名+短信验证的登录方式
        if (block.state.type == 1) {
            block.setState({
                safe: 1,
                isLoading: false
            })
            block.username = username;   //登录切换视图　通过this.refs获取不到值
            block.password = password;
        }

        //用户名+人脸的登录方式
        if (block.state.type == 2) {
            block.setState({
                safe: 2,
                isLoading: false
            })
            block.username = username;   //登录切换视图　通过this.refs获取不到值
            block.password = password;
            setTimeout(function () {
                var video = document.getElementById('video');
                var canvas = document.getElementById('canvas');
                var context = canvas.getContext('2d');
                var websocket = null;
                //判断当前浏览器是否支持WebSocket    
                if ('WebSocket' in window) {
                    var adress = window.location.host;
                    websocket = new WebSocket(`wss:${adress}/api/find_face/`);
                } else { alert("对不起！你的浏览器不支持webSocket") }
                //连接发生错误的回调方法      
                websocket.onerror = function () {
                    websocket.close();

                };
                //连接成功建立的回调方法      
                websocket.onopen = function (event) {
                    setMessageInnerHTML("加入连接");
                };

                //连接关闭的回调方法      
                websocket.onclose = function () {
                    setMessageInnerHTML("断开连接");
                };
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
                    setMessageInnerHTML(evt);
                    //后台已经取到人脸数据可以断开连接了
                    if (evt.data == 200) {
                        setTimeout(function () {
                            context.clearRect(0, 0, canvas.width, canvas.height);
                            block.setState({ trackingText: '采集完成！点击按钮完成登录！' })
                            trackingTask.stop();　　　//停止前端的canvas绘制人脸，否者只要对准镜头就会一直绘制
                            websocket.close();　　　　//关闭websocket请求
                            //关闭摄像头
                            setTimeout(function () { trackingTask.stop(); video.pause(); video.srcObject.getVideoTracks()[0].stop(); }, 100);
                        }, 500);
                        websocket.close();
                    }
                    if (evt.data == 202) {
                        context.clearRect(0, 0, canvas.width, canvas.height);
                        block.setState({ trackingText: '人脸检测超时！' })
                        trackingTask.stop();　　　//停止前端的canvas绘制人脸，否者只要对准镜头就会一直绘制
                        websocket.close();　
                        　　　//关闭摄像头
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
                        for (var i = 0; i < 270 * 212; i++) {

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
                        // context.font = '11px Helvetica';
                        // context.fillStyle = "#fff";
                        // context.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11);
                        // context.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);
                        var data = canvas.toDataURL('image/jpeg', 1.0);
                        // var newblob = dataURItoBlob(data);         
                        websocket.send(`${data}:#:${block.username}`);
                        //接收到消息的回调方法      
                    });
                });
            }, 500)
        }

        //三重认证　用户名密码　　短信验证　　人脸识别
        if (block.state.type == 3) {
            console.log(333333)
            block.setState({
                safe: 3,
                isLoading: false
            })
            block.username = username;   //登录切换视图　通过this.refs获取不到值
            block.password = password;
        }
    }

    newLogin = (e) => {
        e.preventDefault();
        var block = this;
        var username = block.username;   //获取用户输入用户名
        var password = block.password;  // 获取用户输入密码
        var phone = block.phone;   　　　　　　//获取用户手机号
        //登录先检查用户名密码是否为空,如果都不为空就向后台传输

        $.ajax({
            url: "/api/new_login/",
            type: 'POST',
            dataType: 'json',
            cache: false,
            data: {
                username: username,
                password: sha1(password),
                phone: phone,
            }

        })
            .success(function (data) {
                if (data.code == 200) {
                    block.setState({
                        isLoading: false,

                    });
                    // window.location.href = "/TrialEdition";

                    // 修改新窗口的url
                    var cookieList = document.cookie.split(';')
                    // console.log(cookieList.indexOf('userSystemSetType'))
                    if (cookieList.indexOf('userSystemSetType=0') != -1) {
                        //用户设置只打开首页
                        window.location.href = "/";
                    } else if (cookieList.indexOf('userSystemSetType=1') != -1) {
                        //用户设置打开5个页面
                        window.location.href = "/";
                        block.openwin(`targetRange`);
                        // setTimeout(function () {
                        //     // IE
                        //     if (document.all) {
                        //         document.getElementById("wave").click();
                        //     }
                        //     // 其它浏览器
                        //     else {
                        //         var e = document.createEvent("MouseEvents");
                        //         e.initEvent("click", true, true);
                        //         document.getElementById("wave").dispatchEvent(e);
                        //     }
                        // }, 500);
                        block.openwin(`3DMap`);
                        block.openwin(`infoCenter`);
                        block.openwin(`mapAttack`);
                    } else {
                        window.location.href = "/";
                    }

                } else {
                    block.setState({
                        error: data.message,
                        actionInProgress: false,
                        isLoading: false,
                    });
                }

            })
            .error(function (data) {
                block.setState({
                    error: data.message,
                    actionInProgress: false,
                    isLoading: false,
                });
            });
    }


    verifyPhoneCode = (e) => {
        e.preventDefault();
        var block = this;
        var username = block.username;   //获取用户输入用户名
        var password = block.password;  // 获取用户输入密码
        var phone = block.refs.phone.value;   　　　　　　//获取用户手机号
        var phoneCode = block.refs.phonecode.value;
        //登录先检查用户名密码是否为空,如果都不为空就向后台传输

        if (!phone) {
            $(block.refs.phone).focus();
            block.setState({ phoneError: "请检查输入手机号" });
            block.setState({
                isLoading: false
            });
            return;
        }
        $.ajax({
            url: "/api/verify_user_info/",
            type: 'POST',
            dataType: 'json',
            cache: false,
            data: {
                flag: 1,
                phone: phone,
                verify_code: phoneCode
            }

        })
        .success(function (data) {
            if (data.code == 200) {
                block.setState({
                    open1: !block.state.open1, open2: !block.state.open2
                })
                block.phone = phone;

                var video = document.getElementById('video');
                var canvas = document.getElementById('canvas');
                var context = canvas.getContext('2d');
                var websocket = null;
                //判断当前浏览器是否支持WebSocket    
                if ('WebSocket' in window) {
                    var adress = window.location.host;
                    websocket = new WebSocket(`wss:${adress}/api/find_face/`);
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
                            block.setState({ trackingText: '采集完成！点击按钮完成登录！' })
                            trackingTask.stop();　　　//停止前端的canvas绘制人脸，否者只要对准镜头就会一直绘制
                            websocket.close();　　　　//关闭websocket请求
                            setTimeout(function () { trackingTask.stop(); video.pause(); video.srcObject.getVideoTracks()[0].stop(); }, 100);
                        }, 500);
                    }
                    if (evt.data == 202) {
                        context.clearRect(0, 0, canvas.width, canvas.height);
                        block.setState({ trackingText: '人脸检测超时！' })
                        trackingTask.stop();　　　//停止前端的canvas绘制人脸，否者只要对准镜头就会一直绘制
                        websocket.close();　　　　//
                        setTimeout(function () { trackingTask.stop(); video.pause(); video.srcObject.getVideoTracks()[0].stop(); }, 100); v
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
                        for (var i = 0; i < 270 * 212; i++) {

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
                        websocket.send(`${data}:#:${block.username}`);
                        //接收到消息的回调方法      
                    });
                });
            } else {
                block.setState({
                    error: data.message,
                    actionInProgress: false,
                    isLoading: false,
                });
            }

        })
        .error(function (data) {
            block.setState({
                error: data.message,
                actionInProgress: false,
                isLoading: false,
            });
        });
    }


    onSubmitPhone = (e) => {
        e.preventDefault();
        var block = this;
        var username = block.username;   //获取用户输入用户名
        var password = block.password;  // 获取用户输入密码
        var phone = block.refs.phone.value;   　　　　　　//获取用户手机号
        var phoneCode = block.refs.phonecode.value;
        //登录先检查用户名密码是否为空,如果都不为空就向后台传输

        if (!phone) {
            $(block.refs.phone).focus();
            block.setState({ phoneError: "请检查输入手机号" });
            block.setState({
                isLoading: false
            });
            return;
        }

        $.ajax({
            url: "/api/new_login/",
            type: 'POST',
            dataType: 'json',
            cache: false,
            data: {
                username: username,
                password: sha1(password),
                phone: phone,
                verify: phoneCode
            }
        })
        .success(function (data) {
            if (data.code == 200) {
                block.setState({
                    isLoading: false,
                });
                // window.location.href = "/TrialEdition";
                //修改新窗口的url
                var cookieList = document.cookie.split(';')
                // console.log(cookieList.indexOf('userSystemSetType'))
                if (cookieList.indexOf('userSystemSetType=0') != -1) {
                    //用户设置只打开首页
                    window.location.href = "/";
                } else if (cookieList.indexOf('userSystemSetType=1') != -1) {
                    //用户设置打开5个页面
                    window.location.href = "/";
                    block.openwin(`targetRange`);
                    // setTimeout(function () {
                    //     // IE
                    //     if (document.all) {
                    //         document.getElementById("wave").click();
                    //     }
                    //     // 其它浏览器
                    //     else {
                    //         var e = document.createEvent("MouseEvents");
                    //         e.initEvent("click", true, true);
                    //         document.getElementById("wave").dispatchEvent(e);
                    //     }
                    // }, 500);
                    block.openwin(`3DMap`);
                    block.openwin(`infoCenter`);
                    block.openwin(`mapAttack`);
                } else {
                    window.location.href = "/";
                }
            } else {
                block.setState({
                    error: data.message,
                    actionInProgress: false,
                    isLoading: false,
                });
            }
        })
        .error(function (data) {
            block.setState({
                error: data.message,
                actionInProgress: false,
                isLoading: false,
            });
        });
    }

    getPhoneCode = (flag) => {
        var block = this;
        var phone = block.refs.phone.value;   　　　　　　//获取用户手机号
        var username = block.username;

        var code = $('.getPhoneCode');
        if (code.hasClass("disabled")) {
            return false;
        }
        $.ajax({
            type: "post",
            url: "/api/send_verify_code/",
            data: {
                flag: 1,
                phone: phone,
                username: username
            },
            beforeSend: function () {
                // 03 验证手机格式
                var regMobile = /^1\d{10}$/;
                if (!phone || !regMobile.test(phone)) {
                    $(block.refs.phone).focus();
                    block.setState({ phoneError: "请检查输入手机号", isLoading: false });
                    return;
                }
            },
            success: function (data) {
                if (data.code == 200) {
                    block.setState({ phoneError: "已发送短信至您的手机，请注意查收" });
                    // 04获取验证码，倒计时
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
            error: function (data) {
                block.setState({
                    phoneError: data.message
                })
            }
        })
    }


    completeRegistration = (e) => {
        e.preventDefault();
        var block = this;
        var username = block.username;   //获取用户输入用户名
        var password = block.password;  // 获取用户输入密码
        var phone = block.phone;   　　　　　　//获取用户手机号
        //登录先检查用户名密码是否为空,如果都不为空就向后台传输

        $.ajax({
            url: "/api/new_login/",
            type: 'POST',
            dataType: 'json',
            cache: false,
            data: {
                username: username,
                password: sha1(password),
                phone: phone,
            }

        })
        .success(function (data) {
            if (data.code == 200) {
                block.setState({
                    isLoading: false,

                });
                // window.location.href = "/TrialEdition";
                //修改新窗口的url
                var cookieList = document.cookie.split(';')
                // console.log(cookieList.indexOf('userSystemSetType'))
                if (cookieList.indexOf('userSystemSetType=0') != -1) {
                    //用户设置只打开首页
                    window.location.href = "/";
                } else if (cookieList.indexOf('userSystemSetType=1') != -1) {
                    //用户设置打开5个页面
                    window.location.href = "/";
                    block.openwin(`targetRange`);
                    // setTimeout(function () {
                    //     // IE
                    //     if (document.all) {
                    //         document.getElementById("wave").click();
                    //     }
                    //     // 其它浏览器
                    //     else {
                    //         var e = document.createEvent("MouseEvents");
                    //         e.initEvent("click", true, true);
                    //         document.getElementById("wave").dispatchEvent(e);
                    //     }
                    // }, 500);
                    block.openwin(`3DMap`);
                    block.openwin(`infoCenter`);
                    block.openwin(`mapAttack`);
                } else {
                    window.location.href = "/";
                }

            } else {
                block.setState({
                    error: data.message,
                    actionInProgress: false,
                    isLoading: false,
                });
            }

        })
        .error(function (data) {
            block.setState({
                error: data.message,
                actionInProgress: false,
                isLoading: false,
            });
        });
    }
    render() {
        return (
            <div>

                {this.state.safe == 0 &&
                    <form className='' onSubmit={this.onSubmit}>
                        <div className='user'>
                            <span className="userTooltip">用户名</span>
                            <input className='loginForm' type='text' name='username' ref='username' placeholder="请输入用户名" style={{ display: "none" }} />
                            <input id="loginUsername" className='loginForm' type='text' name='username' ref='username' placeholder="请输入用户名" onChange={this.onChange} autoComplete="off" />
                        </div>
                        <div className="checkusers">{this.state.usererror}</div>
                        <div className='pwd'>
                            <span className="pwTooltip">密码</span>
                            <input className='loginForm' type='password' name='password' ref='password' placeholder="请输入密码" style={{ display: "none" }} autoComplete="off" />
                            <input id="loginPassword" className='loginForm' type='password' name='password' ref='password' placeholder="请输入密码" onChange={this.onChange} onBlur={this.onBlur} onFocus={this.onFocus} autoComplete="off" />
                        </div>
                        <div className="checkpasses">{this.state.pwderror}</div>
                        <div className="verificationForm">
                            <span className="verTooltip">验证码</span>
                            <input type="text" name='vercode' ref='vercode' placeholder="请输入验证码" className="code-write inp" onChange={this.onChange} id="Code1" autoComplete="off" />
                            <span className="imgCode" id="vCode1"></span>
                            <a href="javascript:void(0)" className="change-one">换一张</a>
                        </div>
                        <div className="checkvercode">{this.state.vererror}</div>
                        {this.state.error &&
                            <div className='http-warning'>
                                <i className='glyphicon glyphicon-warning-sign'></i>
                                {this.state.error}
                                <br />
                            </div>
                        }

                        <button
                            type='submit'
                            className="button3 login-btn first-login-btn loginAnimate"
                            // disabled={this.state.actionInProgress}
                            disabled={this.state.isLoading}
                            style={this.state.isLoading ? { cursor: "wait" } : { cursor: "pointer" }}
                        >
                            登录
                        </button>

                    </form>
                }




                {this.state.type == 1 && this.state.safe == 1 &&
                    <form className='login-open-form' onSubmit={this.onSubmitPhone}>
                        <div className='user'>
                            <span className="loginTooltip">手机号（用于短信验证）</span>
                            <input className='loginForm' type='text' name='phone' ref='phone' placeholder="请输入手机号" style={{ display: "none" }} />
                            <input className='loginForm loginInput' type='text' name='phone' ref='phone' placeholder="请输入手机号" onChange={this.onChange} autoComplete="off" >

                            </input>
                            <div className='getPhoneCode' onClick={this.getPhoneCode}>{this.state.phoneCodeText}</div>
                        </div>
                        <div className="checkusers">{this.state.phoneError}</div>
                        <div className='pwd'>
                            <span className="loginTooltip">短信验证码</span>
                            <input className='loginForm' type='password' name='phonecode' ref='phonecode' placeholder="请输入短信验证码" style={{ display: "none" }} autoComplete="off" />
                            <input className='loginForm loginInput' type='password' name='phonecode' ref='phonecode' placeholder="请输入短信验证码" onChange={this.onChange} autoComplete="off" />
                        </div>
                        <div className="checkpasses">{this.state.phonecodeError}</div>
                        {this.state.error &&
                            <div className='http-warning'>
                                <i className='glyphicon glyphicon-warning-sign'></i>
                                {this.state.error}
                                <br />
                            </div>
                        }

                        <button
                            type='submit'
                            className="button3 login-btn first-login-btn"
                            // disabled={this.state.actionInProgress}
                            disabled={this.state.isLoading}
                            style={this.state.isLoading ? { cursor: "wait" } : { cursor: "pointer" }}
                        >
                            登录系统
                              </button>
                    </form>
                }

                {this.state.type == 2 && this.state.safe == 2 &&
                    <form className='login-open-form' onSubmit={this.newLogin}>

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
                            className="button3 login-btn first-login-btn"
                            // disabled={this.state.actionInProgress}
                            disabled={this.state.isLoading}
                            style={this.state.isLoading ? { cursor: "wait" } : { cursor: "pointer" }}
                        >
                            完成
                       </button>


                    </form>
                }




                {this.state.type == 3 && this.state.safe == 3 &&
                    <div >

                        <div className='login-open-contrl' >
                            <div className='login-contrl-num'>
                                1
                       </div>
                            <span>手机验证</span>
                        </div>

                        <Collapse in={this.state.open1}>
                            <form className='login-open-form-two' onSubmit={this.verifyPhoneCode}>
                                <div className='user'>
                                    <span className="loginTooltip">手机号（用于短信验证）</span>
                                    <input className='loginForm' type='text' name='username' ref='phone' placeholder="请输入手机号" style={{ display: "none" }} />
                                    <input className='loginForm loginInput' type='text' name='username' ref='phone' placeholder="请输入手机号" onChange={this.onChange} autoComplete="off" >

                                    </input>
                                    <div className=' getPhoneCode  register-getPhoneCode' onClick={this.getPhoneCode}>{this.state.phoneCodeText}</div>
                                </div>
                                <div className="checkusers">{this.state.phoneError}</div>
                                <div className='pwd'>
                                    <span className="loginTooltip">短信验证码</span>
                                    <input className='loginForm' type='password' name='password' ref='phonecode' placeholder="请输入短信验证码" style={{ display: "none" }} autoComplete="off" />
                                    <input className='loginForm loginInput' type='password' name='password' ref='phonecode' placeholder="请输入短信验证码" onChange={this.onChange} autoComplete="off" />
                                </div>
                                <div className="checkpasses">{this.state.phonecodeError}</div>
                                {this.state.error &&
                                    <div className='http-warning'>
                                        <i className='glyphicon glyphicon-warning-sign'></i>
                                        {this.state.error}
                                        <br />
                            </div>
                                }

                                <button
                                    type='submit'
                                    className="button3 login-btn first-login-btn"
                                    // disabled={this.state.actionInProgress}
                                    disabled={this.state.isLoading}
                                    style={this.state.isLoading ? { cursor: "wait" } : { cursor: "pointer" }}
                                >
                                    下一步
                            </button>

                            </form>
                        </Collapse>






                        <div className='login-open-contrl login-open-gray' className={this.state.open1 ? 'login-open-contrl  login-open-gray' : 'login-open-contrl'}>
                            <div className='login-contrl-num'　>
                                2
                            </div>
                            <span>面部识别</span>
                        </div>
                        <Collapse in={this.state.open2}>

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
                                    className="button3 login-btn first-login-btn"
                                    // disabled={this.state.actionInProgress}
                                    disabled={this.state.isLoading}
                                    style={this.state.isLoading ? { cursor: "wait" } : { cursor: "pointer" }}
                                >
                                    完成
                          </button>
                            </form>
                        </Collapse>


                    </div>
                }
            </div>

        );
    }
}