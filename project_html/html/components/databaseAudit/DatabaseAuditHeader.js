/**
 * 数据库审计标签页的头部
 */
import React from "react";
import {
    Col, Form, FormGroup, HelpBlock, Pagination,
    ControlLabel, FormControl, Button, Image, Modal, OverlayTrigger, Tooltip, Accordion, Panel, Table, ButtonToolbar, DropdownButton, MenuItem
} from 'react-bootstrap';
import DropdownList from "../Commonality/DropdownList";     //下拉列表的组件

/*导出数据库审计页面的头部模块*/
export default class DatabaseAuditHeader extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {

        //显示在当前ip的下拉列表中的项
        var itemsIP =[]
        this.props.listOfIP.map(function(ip){
            itemsIP.push({
                name:ip,        //显示在列表中的项
                value:ip        //选中时传递的值
            })
        })

        var itemsSQL =[]
        this.props.listOfSQL.map(function(sql){
            itemsSQL.push({
                name:sql,        //显示在列表中的项
                value:sql        //选中时传递的值
            })
        })
        return (
            <div className="dbAudit-header clearfix">
                <div className="dbAudit-header-logo"></div>
                <div className="dbAudit-header-status">
                    <div className="status-discrip">状态正常({this.props.time_status_days}天{this.props.time_status_hours}小时{this.props.time_status_minutes}分)</div>		                   
                    <p>最近一次扫描：{this.props.last_update_time}</p>
                </div>                               
                <div className="button-group">
                    <span>当前ip：</span>
                    <ButtonToolbar>
                        <DropdownList
                        listID="shenjiIP-list"
                        itemsToSelect={itemsIP}
                        itemDefault={{name:this.props.currentIP, value:this.props.currentIP}}
                        onSelect={(item)=> this.props.onChangeIP(item)}
                        />
                    </ButtonToolbar>
                    <span>&nbsp;&nbsp;当前数据库：</span>
                    <ButtonToolbar>
                        <DropdownList
                            listID="shenjiIP-list"
                            itemsToSelect={itemsSQL}
                            onSelect={(item)=> this.props.onChangeSQL(item)}
                            itemDefault={{name:this.props.currentSQL, value:this.props.currentSQL}}
                        />
                    </ButtonToolbar>
                    <br/>

                    <Button bsStyle="primary" bsSize="sm" className="button-whitelist" onClick={this.props.showWhitelistSetting.bind(this)} >白名单操作</Button>
                    <Button bsStyle="primary" bsSize="sm" className="button-whitelist" onClick={this.props.showBadBehaveSetting.bind(this)} >恶意行为操作</Button>
                </div>
                {/*<div className="bt-label"><p>当前ip:</p></div>*/}
            </div>
        )
    }
}