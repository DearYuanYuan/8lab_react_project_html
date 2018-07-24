import React from "react";
import $ from 'jquery';
import TamperLoading from './TamperLoading.js'
export default class NewFile extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            newFileName:'',
            errorTipMsg:'' //错误提示
        }
    };
    handleNewFile(e){
        var re = /^[0-9A-Za-z_]{1,20}$/;
        var value = $(e.target).val();
        if(!re.test(value)){
            this.setState({
                errorTipMsg:'文件夹命名规则：长度1~20的字符、数字和下划线'
            })
        }else{
            this.setState({
                newFileName:$(e.target).val(),
                errorTipMsg:''
            })
        }
    }
 
    render() {
        return (
            <div className="BackVersionBox">
                <div className="back-version-content">
                    <h2 className="back-v-title clearfix">新建文件夹确认<i className="close-icon" onClick={this.props.handleCancelNew.bind(this)}>×</i></h2>
                    <h3 className="back-v-list">文件夹：
                        <input className="newFileName" onKeyUp={this.handleNewFile.bind(this)}/>
                    </h3>
                    <h3 className="back-v-list">路径：<b>{this.props.operationPath}/{this.state.newFileName}</b></h3>
                    {/*<div className="usrMsgFill">*/}
                        {/*<ul>*/}
                            {/*<li>用户名 <br/>*/}
                                {/*<input type="text" style={{display:'none'}}/>*/}
                                {/*<input type="text"/></li>*/}
                            {/*<li>密码 <br/>*/}
                                {/*<input type="password" style={{display:'none'}}/>*/}
                                {/*<input type="password"/></li>*/}
                        {/*</ul>*/}
                    {/*</div>*/}
                    <div className="version-action">
                        <button className="plugAction back-v-btn back-v-btn-back" onClick={this.props.handleCancelNew.bind(this)}>取消</button>
                        <button className="plugAction back-v-btn back-v-btn-cancel" onClick={this.props.handleConformNew.bind(this)}>确认</button>
                    </div>
                    <p className="errorMsg">{this.state.errorTipMsg}{this.props.fileActionError}</p>
                </div>
                {
                    this.props.tamperLoadingBox &&
                    <TamperLoading progressTime = {this.props.progressTime}/>
                }
            </div>
        )
    }
}