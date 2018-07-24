import React from "react";
import $ from 'jquery';
import TamperLoading from './TamperLoading.js'
export default class MoveFile extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            moveToPath:false,
        }
    };
    zTrees(){
        function zTreeOnClick(event, treeId, treeNode) {
            var path = treeNode.path
            this.setState({
                moveToPath:path
            })
        };

        var setting = {
            view: {
                showLine: false
            },
            data: {
                simpleData: {
                    enable: true
                }
            },
            callback: {
                onClick: zTreeOnClick.bind(this)
            }
        };
        var ztree= window.$.fn.zTree
        ztree.init($("#treeDemo"), setting, this.props.fileTree);
    }

    componentDidMount() {
        this.zTrees()
    }
    render() {
        return (
            <div className="BackVersionBox">
                <div className="back-version-content" style={{height:"500px",margin:"-250px 0 0 -330px"}}>
                    <h2 className="back-v-title clearfix">移动文件<i className="close-icon" onClick={this.props.handleCancelMove.bind(this)}>×</i></h2>
                    <div className="zTreeDemoBackground left">
                        <ul id="treeDemo" className="ztree">
                        </ul>
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
                            <button className="plugAction back-v-btn back-v-btn-back" onClick={this.props.handleCancelMove.bind(this)}>取消</button>
                            <button className="plugAction back-v-btn back-v-btn-cancel"
                                        onClick={this.props.handleConformMove.bind(this, this.state.moveToPath)}>确认</button>
                        </div>
                    <p className="errorMsg">{this.props.fileActionError}</p>
                </div>
                {
                    this.props.tamperLoadingBox &&
                    <TamperLoading progressTime = {this.props.progressTime}/>
                }
            </div>
        )
    }
}