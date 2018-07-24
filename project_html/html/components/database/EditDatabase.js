import React from "react";
import LoadingAction from "../Commonality/LoadingAction";
export default class EditDatabase extends React.Component{
    constructor(props) {
        super(props);
        this.state = {

        }
    }

    render(){
        return (
            <div className="editDatabaseCover" style={{display:this.props.editShow?'block':'none'}}>
                {/*  编辑数据库*/ }
                <div className="editDatabase">
                    <h2>编辑数据库{this.props.editDataName}</h2>
                    <p className="editDatabaseList clearfix"><span>名称</span> <input type="text" placeholder="" className="editDatabaseName"/></p>
                    <p className="editDatabaseList clearfix"><span>数据库用户名</span> <input type="text" placeholder="" className="editDatabaseUser"/></p>
                    <p className="editDatabaseList clearfix"><span>数据库密码</span> <input type="password" placeholder="" className="editDatabasePwd"/></p>
                    <h3 className="editDatabaseList clearfix">
                        {this.props.editTipsMsg}
                    </h3>
                    <p className="editDatabaseList clearfix">
                        <button className="editBtnCancle plugAction" onClick = {this.props.handleCancalEdit.bind(this)}>取消</button>
                        <button className="editBtnConform plugAction" onClick = {this.props.handleConformEdit.bind(this)}>确定</button>
                    </p>
                    {
                        this.props.showActionLoading  &&
                        <LoadingAction/>
                    }
                </div>

            </div>
        )
    }
}