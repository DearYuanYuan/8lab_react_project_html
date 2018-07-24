import React from "react";
export default class TamperLogin extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    };
 
    render() {
        return (
            <div className="tamperLogin" >
                <div className="tamper-list-li"> 系统登录 </div>
                {
                    this.props.tamperLoginBox&&
                    <div className="tamperLoginBox">
                        <div>
                            <p>用户名</p>
                            <input style={{display:"none"}} />
                            <input type="text" className="tamper-user-name" autoComplete="off"/>
                        </div>
                        <div>
                            <p>密码</p>
                            <input style={{display:"none"}} />
                            <input type="password" autoComplete="off" className="tamper-usr-pwd"/>
                        </div>
                        <p>
                            <button onClick={this.props.tamperLoginConfirm.bind(this)}>登录</button>
                        </p>
                        <p className="tamper-register-go"><a className="tamper-register" onClick={this.props.handleToggleLogin.bind(this)}>立即注册</a></p>
                    </div>
                }
                {
                    this.props.tamperRegisterBox &&
                    <div className="tamperLoginBox">
                        <div>
                            <p>用户名</p>
                            <input style={{display:"none"}} />
                            <input type="text" className="tamper-user-name-register" autoComplete="off"/>
                        </div>
                        <div>
                            <p>职位</p>
                            <input style={{display:"none"}} />
                            <input type="text" className="tamper-user-position-register" autoComplete="off"/>
                        </div>
                        <div>
                            <p>部门</p>
                            <input style={{display:"none"}} />
                            <input type="text" className="tamper-user-department-register" autoComplete="off"/>
                        </div>
                        <div>
                            <p>邮箱</p>
                            <input style={{display:"none"}} />
                            <input type="text" className="tamper-user-email-register" autoComplete="off"/>
                        </div>
                        <div>
                            <p>手机号码</p>
                            <input style={{display:"none"}} />
                            <input type="text" className="tamper-user-phone-register" autoComplete="off"/>
                        </div>
                        <div>
                            <p>密码</p>
                            <input style={{display:"none"}} />
                            <input type="password" autoComplete="off" className="tamper-user-pwd-register"/>
                        </div>
                        <div>
                            <p>再次输入密码</p>
                            <input style={{display:"none"}} />
                            <input type="password" autoComplete="off" className="tamper-user-pwd2-register"/>
                        </div>
                        <p>
                            <button onClick={this.props.tamperRegisterConfirm.bind(this)}>注册</button>
                        </p>
                        <p className="tamper-register-go"><a className="tamper-register" onClick={this.props.handleToggleLogin.bind(this)}>立即登录</a></p>
                    </div>
                }
                <p className="errorMsg">{this.props.tamperErrorMsg}</p>
            </div>
        )
    }
}