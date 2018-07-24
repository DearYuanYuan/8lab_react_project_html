import React from "react";
import TamperLoading from './TamperLoading.js'
export default class RenameFile extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    };
    componentWillMount() {
    }
    render() {
        return (
            <div className="BackVersionBox">
                <div className="back-version-content">
                    <h2 className="back-v-title clearfix">重命名<i className="close-icon" onClick={this.props.handleCancelRename.bind(this)}>×</i></h2>
                    <h3 className="back-v-list">文件：<b>{this.props.renameFileNewName}</b></h3>
                    <h3 className="back-v-list">路径：<b>{this.props.renameFilePath}</b></h3>
                    <h3 className="back-v-list">重命名： <input className="newFileName" onKeyUp={this.props.handleNewFileName.bind(this)}/></h3>
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
                        <button className="plugAction back-v-btn back-v-btn-back" onClick={this.props.handleCancelRename.bind(this)}>取消</button>
                        <button className="plugAction back-v-btn back-v-btn-cancel" onClick={this.props.handleConformRename.bind(this)}>确认</button>
                    </div>
                    <p className="errorMsg">{this.props.fileActionError}</p>
                </div>
                {
                    this.props.tamperLoadingBox &&
                    <TamperLoading/>
                }

            </div>
        )
    }
}