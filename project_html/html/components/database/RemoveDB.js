import React from "react";
import $ from 'jquery';
import LoadingAction from "../Commonality/LoadingAction";
export default class RemoveDB extends React.Component{
    constructor(props) {
        super(props);
        this.state = {

        }
    }
    render(){
        return (
            <div className="editDatabaseCover" style={{display:this.props.removeDB?'block':'none'}}>
                <div className="editDatabase">
                    <h2>删除数据库{this.props.removeDBname}</h2>
                    <p className="editDatabaseList clearfix"><span>数据库用户名</span> <input type="text" placeholder="" className="delDatabaseUser"/></p>
                    <p className="editDatabaseList clearfix"><span>数据库密码</span> <input type="password" placeholder="" className="delDatabasePwd"/></p>
                    <h3 className="editDatabaseList clearfix">
                        {this.props.removeDBMsg}
                    </h3>
                    <p className="editDatabaseList clearfix">
                        <button className="editBtnCancle plugAction" onClick = {this.props.handleCancalDel.bind(this)}>取消</button>
                        <button className="editBtnConform plugAction" onClick = {this.props.handleConformRemove.bind(this)}>确定</button>
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