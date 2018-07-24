import React from "react"
import $ from "jquery";
import { Tabs, Tab, Pagination, ButtonToolbar, Button, Grid, Row, Col, Modal } from 'react-bootstrap';　  //引入bootstrap组件
import sha1 from "sha1";
import { getUUID } from '../../../html/utils/utils.js'

export default class AdditionalDocuments extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showSetting: false,                   //扫描设置默认不显示
            showDisableSetting: false,      //停用设置框
            showDisableFaceID: false,
            showFaceID: false,
            error: null,//error 为空
            usererror: null,//登录名错误提示
            pwderror: null,//登录密码错误提示
            phonecodeError: null,//短信验证码
            phoneError: null,//手机号错误提示
            phoneCodeText: '获取验证码',//获取验证码文字

            flag: null,
            trackingText: '请您直视摄像头，正在识别中….',//人脸识别描述文字
            UUID: getUUID()//获取传入后台的唯一值；
        }
    }


    //当用户在有输入操作的时候  当Input输入框发生change时
    onChange() {
        this.setState({
            error: null,    //error 为空
            usererror: null,//登录名错误提示
            pwderror: null,//登录密码错误提示
            phonecodeError: null,//短信验证码
            phoneError: null,//手机号错误提示
        });
    }
    // 正则匹配
    isPass(password) {
        var re = /^[0-9A-Za-z_]{6,18}$/;
        return re.test(password);
    }


    onBlurPhone(e) {
        if (e.target.value != '') {
            if (!this.isPass(e.target.value) || e.target.value.length > 18) {
                this.setState({ phoneError: '长度6~18的字符、数字和下划线' })
            } else {
                this.setState({ phoneError: '' })
            }
        }
    }


    //用户名失去焦点
    onBlurUsr(e) {
        // 如果值不为空的情况下
        if (e.target.value != '') {
            if (!this.isPass(e.target.value) || e.target.value.length > 18) {
                this.setState({ usererror: '长度6~18的字符、数字和下划线' })
            } else {
                this.setState({ usererror: '' })
            }
        }
    }
    // 密码失去焦点
    onBlurPWD(e) {
        if (e.target.value != '') {
            if (!this.isPass(e.target.value) || e.target.value.length > 18) {
                this.setState({ pwderror: '长度6~18的字符、数字和下划线' })
            } else {
                this.setState({ pwderror: '' })
            }
        }
    }




    //扫描设置
    showSetting() {
        this.setState({
            showSetting: true
        });
        this.onChange()
    }
    hideSetting() {
        this.setState({
            showSetting: false
        });
    }

    showDisableSetting() {
        this.setState({
            showDisableSetting: true
        });
        this.onChange()
    }
    hideDisableSetting() {
        this.setState({
            showDisableSetting: false
        });
    }

    showFaceID() {
        this.setState({
            showFaceID: true,
            trackingText: '请您直视摄像头，正在识别中….'
        });
        this.onChange()

        var block = this;
        setTimeout(function () {
            var video = document.getElementById('video');
            var canvas = document.getElementById('canvas');
            var context = canvas.getContext('2d');
            var websocket = null;
            //判断当前浏览器是否支持WebSocket    
            if ('WebSocket' in window) {
                var adress = window.location.host;
                websocket = new WebSocket(`wss:${adress}/api/change_find_face/`);
            } else { alert("对不起！你的浏览器不支持webSocket") }
            //连接发生错误的回调方法      
            websocket.onerror = function () {
                setMessageInnerHTML("error");
                setTimeout(function () { trackingTask.stop(); video.pause(); video.srcObject.getVideoTracks()[0].stop(); }, 100);
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
                    setTimeout(function () { trackingTask.stop(); video.pause(); video.srcObject.getVideoTracks()[0].stop(); }, 100);
                }
            };
            //将消息显示在网页上     
            function setMessageInnerHTML(innerHTML) {
                console.log(innerHTML)
            };
            //关闭连接      
            function closeWebSocket() {
                websocket.close();
                setTimeout(function () { trackingTask.stop(); video.pause(); video.srcObject.getVideoTracks()[0].stop(); }, 100);
            }


            websocket.onmessage = function (evt) {
                setMessageInnerHTML(evt.data);
                //后台已经取到人脸数据可以断开连接了
                console.log(1111)
                if (evt.data == 200) {
                    console.log(22222)
                    setTimeout(function () {
                        context.clearRect(0, 0, canvas.width, canvas.height);
                        block.setState({ trackingText: '采集完成，请输入用户名和密码！' })
                        trackingTask.stop();　　　//停止前端的canvas绘制人脸，否者只要对准镜头就会一直绘制
                        websocket.close();　　　　//关闭websocket请求
                        setTimeout(function () { trackingTask.stop(); video.pause(); video.srcObject.getVideoTracks()[0].stop(); }, 100);
                    }, 500);
                }
                if (evt.data == 201) {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    block.setState({ trackingText: '该人脸已被注册！' })
                    trackingTask.stop();　　　//停止前端的canvas绘制人脸，否者只要对准镜头就会一直绘制
                    websocket.close();　　　　//关闭websocket请求
                    setTimeout(function () { trackingTask.stop(); video.pause(); video.srcObject.getVideoTracks()[0].stop(); }, 100);
                }
                if (evt.data == 202) {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    block.setState({ trackingText: '人脸检测超时！' })
                    trackingTask.stop();　　　//停止前端的canvas绘制人脸，否者只要对准镜头就会一直绘制
                    websocket.close();　　　　//关闭websocket请求
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
                    var data = canvas.toDataURL('image/jpeg', 1.0);
                    // var newblob = dataURItoBlob(data);         
                    websocket.send(`${data}:#:${block.state.UUID}`);
                    //接收到消息的回调方法      
                });
            });
        }, 500)


    }

    hideFaceID() {

        var video = document.getElementById('video');
        var canvas = document.getElementById('canvas');
        setTimeout(function () { video.pause(); video.srcObject.getVideoTracks()[0].stop(); }, 100);
        this.setState({
            showFaceID: false
        });
    }

    showDisableFaceID() {
        this.setState({
            showDisableFaceID: true
        });
        this.onChange()
    }
    hideDisableFaceID() {
        this.setState({
            showDisableFaceID: false
        });
    }
    //获取手机短信验证码
    getPhoneCode(e) {
        e.preventDefault();　　　　　　　　　            　//阻止from表单默认操作　例如按enter提交后会刷新页面
        var block = this;
        var phone = block.refs.phone.value;   　　　　　　//获取用户手机号
        var code = $('.getverificationCode');　　　　　//获取短信验证码div　方便获取后修改样式
        if (code.hasClass("disabled")) {
            return false;
        }
        $.ajax({
            url: "/api/send_verify_code/",
            type: 'POST',
            dataType: 'json',
            cache: false,
            data: {
                flag: 0,
                phone: phone,　　　　　　　　　　　　　　　　　//用户输入手机号
                uuid_var: this.state.UUID    　　　　　　　//指定传入后端的唯一凭证
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

    // 开启关闭手机和人脸验证方式
    openPhoneVerify(e, flag) {
        e.preventDefault();　　　　　　　　　            　//阻止from表单默认操作　例如按enter提交后会刷新页面
        var block = this;
        var phone = block.refs.phone ? block.refs.phone.value : null;
        var phonecode = block.refs.phonecode ? block.refs.phonecode.value : null;
        var password = block.refs.password.value;
        var username = block.refs.username.value;

        $.ajax({
            url: "/api/change_verify_config/",
            type: 'POST',
            dataType: 'json',
            cache: false,
            data: {
                flag: flag,
                phone: phone,　　　　　　　　　　　　　　　　　//用户输入手机号
                username: username,
                verify_code: phonecode,
                password: sha1(password),
            },
            success: function (data) {
                //关闭手机验证
                if (data.code == 200) {
                    if (flag == 0 && block.state.flag == 1) {
                        block.setState({
                            flag: 0
                        })
                        window.localStorage.setItem("flag", 0);
                        return block.hideDisableSetting() //关闭弹窗
                    }
                    if (flag == 0 && block.state.flag == 3) {
                        block.setState({
                            flag: 2
                        })
                        window.localStorage.setItem("flag", 2);
                        return block.hideDisableSetting() //关闭弹窗
                    }

                    if (flag == 1 && block.state.flag == 2) {
                        block.setState({
                            flag: 0,
                        })
                        window.localStorage.setItem("flag", 0);
                        return block.hideDisableFaceID() //关闭弹窗
                    }
                    if (flag == 1 && block.state.flag == 3) {
                        block.setState({
                            flag: 1,
                        })
                        window.localStorage.setItem("flag", 1);
                        return block.hideDisableFaceID() //关闭弹窗
                    }
                    if (flag == 2 && block.state.flag == 0) {
                        block.setState({
                            flag: 1,
                        })
                        window.localStorage.setItem("flag", 1);
                        return block.hideSetting() //关闭弹窗
                    }
                    if (flag == 2 && block.state.flag == 2) {
                        block.setState({
                            flag: 3,
                        })
                        window.localStorage.setItem("flag", 3);
                        return block.hideSetting() //关闭弹窗
                    }

                }
            },
            error: function () {

            }
        })

    }

    //启用人脸验证
    openFaceIDVerify(e) {
        e.preventDefault();　　　　　　　　　            　//阻止from表单默认操作　例如按enter提交后会刷新页面
        var block = this;
        var password = block.refs.facepassword.value;
        var username = block.refs.faceusessname.value;

        $.ajax({
            url: "/api/change_verify_config/",
            type: 'POST',
            dataType: 'json',
            cache: false,
            data: {
                flag: 3,
                uuid: this.state.UUID,　　　　　　　　　　　　　　　　　//用户输入手机号
                username: username,
                password: sha1(password),
            },
            success: function (data) {
                if (data.code == 200) {
                    if (block.state.flag == 0) {
                        block.setState({
                            flag: 2
                        })
                        window.localStorage.setItem("flag", 2);

                        return block.hideFaceID() //关闭弹窗
                    }
                    if (block.state.flag == 1) {
                        block.setState({
                            flag: 3
                        })
                        window.localStorage.setItem("flag", 3);
                        return block.hideFaceID() //关闭弹窗
                    }
                }
            },
            error: function () {
            }
        })
    }

    componentDidMount() {
        var flag = window.localStorage.getItem("flag");
        this.setState({ flag })
    }

    render() {

        return (

            <div className='additional settings-mode'>
                <h2 className="content-title">
                    登录附加凭证
                 </h2>


                <div className='content'>

                    {this.state.flag == 1 || this.state.flag == 3 ?
                        <div className='verification-mobile verification-mobile-disable'>

                            <h5>手机验证</h5>
                            <button className="btn btn-xs btn-default " onClick={this.showDisableSetting.bind(this)}>停用</button>
                        </div>
                        :
                        <div className='verification-mobile'>

                            <h5>手机验证</h5>
                            <button className="btn btn-xs btn-primary " onClick={this.showSetting.bind(this)}>启用</button>
                        </div>

                    }


                    <div className='line'></div>


                    {this.state.flag == 2 || this.state.flag == 3 ?
                        <div className='face-id face-id-disable'>

                            <h5>面部识别</h5>
                            <button className="btn btn-xs btn-default " onClick={this.showDisableFaceID.bind(this)}>停用</button>
                        </div> :
                        <div className='face-id'>

                            <h5>面部识别</h5>
                            <button className="btn btn-xs btn-primary " onClick={this.showFaceID.bind(this)}>启用</button>
                        </div>}


                </div>











                {/*--------------------------------------------启用手机验证---------------------------------*/}

                {this.state.showSetting &&
                    <Modal
                        backdrop='static'
                        id="verification-mobile-modal"
                        className='settings-Modal'
                        {...this.props}
                        show={this.state.showSetting}
                        onHide={() => this.hideSetting()}
                        dialogClassName="custom-modal"
                    >
                        <form >
                            <Modal.Header closeButton>
                                <Modal.Title >变更验证手机号</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <div style={{ position: 'relative' }}>
                                    <label>手机号(用于短信验证)
                                     <input placeholder='请输入您需要绑定的手机号' type='text' name='phone' ref='phone' className='form-control' onChange={() => this.onChange()} onBlur={(e) => this.onBlurPhone(e)} />
                                        <div className='getverificationCode' onClick={(e) => this.getPhoneCode(e)}>{this.state.phoneCodeText}</div>
                                    </label>
                                </div>
                                <div className="checkusers">{this.state.phoneError}</div>


                                <label>短信验证码
                                     <input type='password' name='password' ref='phonecode' placeholder="请输入短信验证码" className='form-control' />
                                </label>
                                <div className="checkusers">{this.state.phonecodeError}</div>

                                <label>用户名
                                     <input placeholder='请输入您的用户名' type='text' name='username' ref='username' className='form-control' onChange={() => this.onChange()} onBlur={(e) => this.onBlurUsr(e)} />
                                </label>
                                <div className="checkusers">{this.state.usererror}</div>


                                <label>密码
                                 <input placeholder='请输入您的密码' type='password' name='password' ref='password' className='form-control' onChange={() => this.onChange()} onBlur={(e) => this.onBlurPWD(e)} />
                                </label>
                                <div className="checkusers ">{this.state.pwderror}</div>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button className="btn btn-xs  btn-default" onClick={() => this.hideSetting()}>取消</Button>
                                <Button className="btn btn-xs btn-primary" onClick={(e) => this.openPhoneVerify(e, 2)}>变更手机号</Button>
                            </Modal.Footer>
                        </form>
                    </Modal>
                }
                {/*--------------------------------------------启用手机验证---------------------------------*/}


                {/*--------------------------------------------停用手机验证---------------------------------*/}


                <Modal
                    backdrop='static'
                    className='settings-Modal'
                    id="verification-mobile-disable-modal"
                    {...this.props}
                    show={this.state.showDisableSetting}
                    onHide={() => this.hideDisableSetting()}
                    dialogClassName="custom-modal"
                >
                    <form >
                        <Modal.Header closeButton>
                            <Modal.Title >停用手机验证</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <label>用户名
                                 <input placeholder='请输入您的用户名' type='text' name='username' ref='username' className='form-control' onChange={() => this.onChange()} onBlur={(e) => this.onBlurUsr(e)} />
                            </label>
                            <div className="checkusers">{this.state.usererror}</div>


                            <label>密码
                                 <input placeholder='请输入您的密码' type='password' name='password' ref='password' className='form-control' onChange={() => this.onChange()} onBlur={(e) => this.onBlurPWD(e)} />
                            </label>
                            <div className="checkusers ">{this.state.pwderror}</div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button className="btn btn-xs  btn-default" onClick={() => this.hideDisableSetting()}>取消</Button>
                            <Button className="btn btn-xs btn-primary" onClick={(e) => this.openPhoneVerify(e, 0)}>停用手机验证</Button>
                        </Modal.Footer>
                    </form>
                </Modal>
                {/*--------------------------------------------停用手机验证---------------------------------*/}


                {/*--------------------------------------------启用面部识别---------------------------------*/}

                {this.state.showFaceID &&
                    <Modal
                        backdrop='static'
                        className='settings-Modal'
                        id="verification-FaceID-modal"
                        {...this.props}
                        show={this.state.showFaceID}
                        onHide={() => this.hideFaceID()}
                        dialogClassName="custom-modal"
                    >
                        <Modal.Header closeButton>
                            <Modal.Title >更新面部识别信息</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <div className='face-container'>
                                <video id="video" width="270" height="212" preload autoPlay loop muted></video>
                                <canvas id="canvas" width="270" height="212"></canvas>
                                <div className='faceIDRight'>
                                    <p style={{ fontSize: '12px', color: '#a1a6ad' }}>人脸信息采集</p>
                                    <div style={{ fontSize: '12px', color: '#fff' }}>{this.state.trackingText}</div>
                                </div>
                            </div>




                            <label>用户名
                                     <input placeholder='请输入您的用户名' type='text' name='username' ref='faceusessname' className='form-control' onChange={() => this.onChange()} onBlur={(e) => this.onBlurUsr(e)} />
                            </label>

                            <div className="checkusers">{this.state.usererror}</div>
                            <label>密码
                                 <input placeholder='请输入您的密码' type='password' name='password' ref='facepassword' className='form-control' onChange={() => this.onChange()} onBlur={(e) => this.onBlurPWD(e)} />
                            </label>
                            <div className="checkusers">{this.state.pwderror}</div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button className="btn btn-xs  btn-default" onClick={() => this.hideFaceID()}>取消</Button>
                            <Button className="btn btn-xs btn-primary" onClick={(e) => this.openFaceIDVerify(e)}>采用新面部信息</Button>
                        </Modal.Footer>
                    </Modal>
                }
                {/*--------------------------------------------启用面部识别---------------------------------*/}





                {/*--------------------------------------------停用面部识别---------------------------------*/}


                <Modal
                    backdrop='static'
                    className='settings-Modal'
                    id="verification-FaceID-disable-modal"
                    {...this.props}
                    show={this.state.showDisableFaceID}
                    onHide={() => this.hideDisableFaceID()}
                    dialogClassName="custom-modal"
                >
                    <form >
                        <Modal.Header closeButton>
                            <Modal.Title >停用面部识别</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <label>用户名
                               <input placeholder='请输入您的用户名' type='text' name='username' ref='username' className='form-control' onChange={() => this.onChange()} onBlur={(e) => this.onBlurUsr(e)} />
                            </label>
                            <div className="checkusers">{this.state.usererror}</div>


                            <label>密码
                               <input placeholder='请输入您的密码' type='password' name='password' ref='password' className='form-control' onChange={() => this.onChange()} onBlur={(e) => this.onBlurPWD(e)} />
                            </label>
                            <div className="checkusers ">{this.state.pwderror}</div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button className="btn btn-xs  btn-default" onClick={() => this.hideDisableFaceID()}>取消</Button>
                            <Button className="btn btn-xs btn-primary" onClick={(e) => this.openPhoneVerify(e, 1)}>停用面部识别</Button>
                        </Modal.Footer>
                    </form>
                </Modal>

                {/*--------------------------------------------停用面部识别---------------------------------*/}
            </div>



        )

    }

}