import React from "react";
import TamperLoading from './TamperLoading.js'
export default class DeleteFile extends React.Component {
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
                    <h2 className="back-v-title clearfix">删除确认<i className="close-icon" onClick={this.props.handleCancelDelete.bind(this)}>×</i></h2>
                    <div style={{height:'158px',overflowY:'auto'}}>
                    {
                        this.props.deleteList&&
                        this.props.deleteList.map((list,index)=>{
                            return(
                                <h3 className="back-v-list" key={index}>路径：<b>{list.path}</b></h3>
                            )
                        })
                    }
                    </div>
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
                        <button className="plugAction back-v-btn back-v-btn-back" onClick={this.props.handleCancelDelete.bind(this)}>取消</button>
                        <button className="plugAction back-v-btn back-v-btn-cancel" onClick={this.props.handleConformDelete.bind(this)}>确认</button>
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