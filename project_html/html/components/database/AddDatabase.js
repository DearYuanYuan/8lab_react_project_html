import React from "react";
import $ from 'jquery';
import LoadingAction from "../Commonality/LoadingAction";
export default class AddDatabase extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showIpInput:false,
            showTypeInput:false,
            setIp:'',
            setType:'MySQL',
            dataIpList:[],//获取的ip列表
        }
    }
    // showList(){
    //     // bug map方法不能在render里使用,确定功能暂时不能使用
    //     JSON.stringify(this.props.listData.map(function(list){
    //         console.log(list)
    //     }))
    // }
    getDataIpList() {
        //获取database信息,发送ajax请求
        var self = this;
        $.ajax({
            url: '/api/get_host_db_details/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function(data) { //成功执行方法
                // console.log(JSON.stringify(data.ip))
                self.setState({
                    dataIpList:data.ip
                })
            }})
    }
    handleShowIp(e){
        this.setState({
            showIpInput:!this.state.showIpInput,
            showTypeInput:false
        })
        e.stopPropagation();
    }
    handleShowType(e){
        this.setState({
            showTypeInput:!this.state.showTypeInput,
            showIpInput:false
        })
        e.stopPropagation();
    }
    handleWriteIP(e){
        this.setState({
            showIpInput:false,
            setIp:$(e.target).text()
        })
         
    }
    handleWriteType(e){
        this.setState({
            showTypeInput:false,
            setType:$(e.target).text()
        })
         
    }
    handleHideIP(){
        this.setState({
            showIpInput:false,
            showTypeInput:false
        })
    }
    componentWillMount(){
        this.getDataIpList();
    }
    render() {
        return (
            <div className="addNewDatabase editDatabaseCover" style={{display:!this.props.showAddDBbox?'none':'block'}} onClick = {this.handleHideIP.bind(this)}>
                <div className="editDatabase" >
                    <h2>增加数据库</h2>
                    <p className="editDatabaseList clearfix"><span>名称</span> <input type="text" placeholder="" className="addDatabaseName" onBlur={this.props.handleCheckName.bind(this)}/></p>
                    <div className="editDatabaseList clearfix" ><span>类型</span> <input type="text" placeholder="" value = {this.state.setType} className="addDatabaseType" readOnly onClick = {this.handleShowType.bind(this)}/>
                        <div className={this.state.showTypeInput?'showExitMsg':'showExitMsg hide'} onClick = {this.handleWriteType.bind(this)}>
                            <p>MySQL</p>
                            <p>PostgreSQL</p>
                        </div>
                    </div>
                    <div className="editDatabaseList clearfix" ><span>IP</span> <input type="text" placeholder="" value = {this.state.setIp} className="addDatabaseIp" readOnly onClick = {this.handleShowIp.bind(this)}/>
                        <div className={this.state.showIpInput?'showExitMsg':'showExitMsg hide'} onClick = {this.handleWriteIP.bind(this)}>
                            {
                                this.state.dataIpList.map(function(ipList,index){
                                    return (
                                        <p key = {index}>{ipList}</p>
                                    )
                                })
                            }
                        </div>
                    </div>
                    <p className="editDatabaseList clearfix"><span>端口号</span> <input type="text" placeholder="" className="addDatabasePort"/></p>
                    <p className="editDatabaseList clearfix"><span>数据库用户名</span> <input type="text" placeholder="" className="addDatabaseUser"/></p>
                    <p className="editDatabaseList clearfix"><span>数据库密码</span> <input type="password" placeholder="" className="addDatabasePwd"/></p>
                    <h3 className="editDatabaseList clearfix addDatabaseList">
                    {this.props.addTipsMsg}
                    </h3>
                    <p className="editDatabaseList clearfix">
                        <button className="editBtnCancle plugAction" onClick={this.props.handleCancleAdd.bind(this)}>取消</button>
                        <button className="editBtnConform plugAction" onClick={this.props.handleAddDbMore.bind(this)}>确定</button>
                    </p>
                    {
                        this.props.showLoadingAction &&
                        <LoadingAction/>
                    }
                </div>

            </div>
        );
    }
}




