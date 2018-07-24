import React from "react";
import $ from "jquery";

/*向外暴露提示消息弹窗组件.
包含提示信息,和一个按钮.
使用示例:
<MessageBox
showMsgBox = {true}                 //是否显示消息框
msgContent = {"请输入正确的关键字"}    //提示信息
msgButtonState = {true}             //按钮是否可点击
msgButtonName = {"确定"}             //按钮的名称
handleConfirmMsgBox = { this.handleConfirmMsgBox.bind(this) } //点击按钮事件的监听
/>
*/
export default class MessageBox extends React.Component {

    constructor(props) {
        super(props);
        this.state={      
        }
    }

    /**
     * 当组件将要接收新的props时执行，初始化render时不执行
     */
    componentWillReceiveProps (nextProps) {        
             
    }

    /**
     * 当组件更新完时的操作
     */
    componentDidUpdate(){
        //如果此消息提示框已显示，并且当前页面获取焦点的是一个文本输入框，则让这个输入框失去焦点
        if(this.props.showMsgBox && $(':focus').length!=0 && $(':focus')[0].tagName=="INPUT" && $(':focus').prop('type')=="text"){
            $(':focus').blur()
        }    
    }

    render(){
        return (
            /*根据 this.props.showMsgBox ,控制消息弹窗的显示与隐藏.*/
        <div className={this.props.showMsgBox?"messageBox-container":"hide messageBox-container"}>
            <div className="messageBox">
                <div className="msgContent">
                    {/*提示信息.当提示信息为'正在请求时,使用 LoadingText 组件代替提示信息.*/}
                    {this.props.msgContent==='正在请求...'? <LoadingTexts /> :this.props.msgContent}
                </div>
                <button 
                    //根据提示信息,改变按钮的状态:禁用,或可点击.
                    className={this.props.msgButtonState?"btnOkMsgBox btnMsgBox":"btnMsgBox"}
                    disabled={!this.props.msgButtonState?true:false}
                    /*点击确认按钮时,调用父组件的 handleConfirmMsgBox 方法,通过bind传参,改变父组件的 state, 从而隐藏消息弹窗*/
                    onClick={this.props.handleConfirmMsgBox.bind(this)}
                    >   
                    {/*按钮的名称*/}
                    {this.props.msgButtonName}
                </button>
            </div>
        </div>
        )
    }
}


class LoadingTexts  extends  React.Component{

    constructor(props){
        super(props);
    }


    render(){
        return(

                <div className="loadingText" style={{margin:"0"}}>
                   <span> 正在请求&nbsp;&nbsp;</span>
                    <div className="bounce1"></div>
                    <div className="bounce2"></div>
                    <div className="bounce3"></div>
                </div>

        )
    }
}