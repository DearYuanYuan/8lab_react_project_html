
import React from "react";                                //引入react  
import { Link } from "react-router-dom"                           
import Message from "../Commonality/MessageBox";          //引入Meaage消息组件

// 向外暴露HomeHeader模块
export default class HomeHeader extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            showMsgBox: false,                  //不显示ajax加载提示框
            msgContent: '欢迎进行升级服务购买。',   //ajax请求弹框信息
            msgButtonState: true,               //ajax请求弹框按钮状态
            msgButtonName: "确定",               //ajax请求按钮button提示内容
        }
    }

    /**
     * Message消息组件相关函数
     * 组件渲染之前设置数据
     * @param {any} val 消息组件是否显示的Boole值
     * 
     * @memberof HomeHeader
     */
    handleConfirmMsgBox() {
        this.setState({ showMsgBox: false })
    }

    /**
     * 温馨提示消息
     * 
     * 
     * @memberof HomeHeader
     */
    showMessage() {
        this.setState({
            showMsgBox: true,//不显示ajax加载提示框
        })
    }

    // 页面渲染
    render() {
        return (
            <div className="homeHeader">
                {/*
                <div className="headerInit">
                    <div className="welcome">欢迎进入安全管理平台！</div>
                    <div className="headerItem">
                        <div className="repair">
                            <img src="/static/img/home/repair.svg" alt="可信修复" />
                            <a href="/systemCheck">
                                <Button bsStyle="primary" bsSize="sm" >可信修复</Button>
                            </a>
                        </div>
                        <div className="optimize">
                            <img src="/static/img/home/optimize.svg" alt="可信优化" />
                            <Button bsStyle="primary" bsSize="sm" onClick={() => this.showMessage()}>可信优化</Button>
                        </div>
                        <div className="loophole">
                            <img src="/static/img/home/loophole.svg" alt="修复漏洞" />
                            <Button bsStyle="primary" bsSize="sm" onClick={() => this.showMessage()} >修复漏洞</Button>
                        </div>
                    </div>
                </div>
            */}
                <div className="pullHeader">
                    <div className="content">
                        <span className="welcome">欢迎进入安全管理平台！</span>
                        <div className="href-group" >
                            <Link to="/environment"><span className="protect" ></span><span>可信防护</span></Link>
                            <Link to="/infoCenter"><span className="info" ></span><span>信息中心</span></Link>
                            <Link to="/3Dmap"><span className="global" ></span><span>全球态势感知</span></Link>
                            <Link to="/blockchain"><span className="block" ></span><span>区块链服务</span></Link>
                            <Link to="/bigData"><span className="bigdata" ></span><span>大数据用户行为分析</span></Link>
                        </div>
                    </div>
                    {/* <div className='shortcutSection'>
                        <Shortcut src='/static/img/topbar/defence.png' txtDes='可信防护' href='/environment' />
                        <Shortcut src='/static/img/topbar/dataCenter.png' txtDes='信息中心' href='/infoCenter' />
                        <Shortcut src='/static/img/topbar/globle.png' txtDes='全球态势感知' href='/mapAttack' />
                        <Shortcut src='/static/img/topbar/blockchain.png' txtDes='区块链存证' href='/blockchain' />
                        <Shortcut src='/static/img/topbar/UEBA.png' txtDes='大数据用户行为分析' href='/bigData' />
                    </div> */}

                </div>

                {/* 消息组件-----start*/}
                <Message
                    showMsgBox={this.state.showMsgBox}
                    msgContent={this.state.msgContent}
                    msgButtonState={this.state.msgButtonState}
                    msgButtonName={this.state.msgButtonName}
                    handleConfirmMsgBox={this.handleConfirmMsgBox.bind(this)}
                />
                {/* 消息组件-----end*/}
            </div>
        )
    }
}




