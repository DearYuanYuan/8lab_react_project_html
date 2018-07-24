import React from "react";
import TamperLoading from './TamperLoading.js'
export default class BackVersionBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    };

    render() {
        return (
            <div className="BackVersionBox" style={{display:this.props.showVersionBox?"block":'none'}}>
                <div className="back-version-content">
                    <h2 className="back-v-title clearfix">版本回滚确认 <i className="close-icon" onClick={this.props.handleCloseVersionConform.bind(this)}>×</i></h2>
                    <h3 className="back-v-list">版本编号：<b>{this.props.backVersionState.version}</b></h3>
                    <h3 className="back-v-list">版本生成时间：<b>{this.props.backVersionState.time}</b></h3>
                    <h3 className="back-v-list">变更类型：<b>{this.props.backVersionState.action}</b></h3>
                    <h3 className="back-v-list">变更的文件路径：<b>{this.props.backVersionState.filePath}</b></h3>
                    <h3 className="back-v-list">备注信息：<b>{this.props.backVersionState.mark}</b></h3>
                    <div className="usrMsgFill">
                        <ul>
                            <li>用户名 <br/><input type="text"/></li>
                            <li>密码 <br/><input type="password"/></li>
                        </ul>
                    </div>
                    <div className="version-action">
                        <button className="plugAction back-v-btn back-v-btn-back" onClick={this.props.handleVersionConformBack.bind(this)}>开始回滚</button>
                        <button className="plugAction back-v-btn back-v-btn-cancel" onClick={this.props.handleCloseVersionConform.bind(this)}>取消</button>
                    </div>
                    <p className="errorMsg">{this.props.errorMsg}</p>
                </div>
                {
                    this.props.tamperLoadingBox &&
                    <TamperLoading progressTime = {this.props.progressTime}/>
                }
            </div>
        )
    }
}