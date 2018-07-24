import React from "react";
export default class ShowFilePath extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    };
    render() {
        return (
        <div className="BackVersionBox" style={{display:this.props.showFileBox?"block":'none'}}>
            <div className="back-version-content">
                <h2 className="back-v-title clearfix">文件 <b>xxx</b>所在路径 <i className="close-icon" onClick={this.props.handleCloseFileConform.bind(this)}>×</i></h2>
                <h3 className="pathName">Path : all folders/sample folder/sample subfolder/sample subfolder/</h3>
                <div className="zTreeDemoBackground left versionFileChangeList">
                    {
                        this.props.versionFilePathChange.map((list,index)=>{
                            return(
                                <p key={index}>{list}</p>
                                )
                        })
                    }
                </div>
                <div className="version-action">
                    <button className="plugAction back-v-btn back-v-btn-cancel" onClick={this.props.handleCloseFileConform.bind(this)}>确定</button>
                </div>
            </div>
        </div>
        )
    }
}