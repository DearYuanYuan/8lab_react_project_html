import React from "react";
import TamperLoading from './TamperLoading.js'
//树结构，暂时无用
export default class UploadFile extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    };

    componentWillMount() {
    }
    componentDidMount() {
    }
    render() {
        return (
        <div className="BackVersionBox">
            <div className="back-version-content">
                <h2 className="back-v-title clearfix">上传文件<i className="close-icon" onClick={this.props.handleCancelUpload.bind(this)}>×</i></h2>
                <h3 className="back-v-list">路径：<b>{this.props.uploadFileName}</b></h3>

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
                    <button className="plugAction back-v-btn back-v-btn-back" onClick={this.props.handleCancelUpload.bind(this)}>取消</button>
                    <button className="plugAction back-v-btn back-v-btn-cancel" onClick={this.props.handleConformUpload.bind(this)}>确认</button>
                </div>
                <p className="errorMsg">{this.props.uploadFileSizeOut}</p>
            </div>
            {
                this.props.tamperLoadingBox &&
                <TamperLoading/>
            }
        </div>
        )
    }
}