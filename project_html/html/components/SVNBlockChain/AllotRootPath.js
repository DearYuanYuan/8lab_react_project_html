import React from "react";
import $ from 'jquery';
import DropdownList from "../Commonality/DropdownList.js"                       //下拉列表组件
import MessageBox from "../Commonality/MessageBox"
import Loading from '../Commonality/LoadingText.js'
class AllotRootPath extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            newFileName: '',

            nameRootPath: '',
            absoluteRootPath: '',
            hostSelector: [],

            hostServer: '',

            isLoading: true,

            showMsgBox: false,                   //不显示消息提示框
            msgContent: '',                      //提示框的提示消息
            msgButtonState: false,               //提示框中的按钮状态
            msgButtonName: "",                   //提示框中的按钮名称
            isShowedBadBehaveSetting: false,     //恶意行为弹出框

        };

    };


    /**
 * 消息弹出框的按钮点击事件的监听
 */
    handleConfirmMsgBox() {
        this.setState({
            showMsgBox: false,
        })
    }

    /**
  * 获取下拉框搜索类别
  * 
  * @param {any} e 
  * 
  * @memberof WhiteList
  */
    searchItem(item) {
        this.setState({ hostServer: item })
    }


    newFileChange(e) {
        this.setState({
            newFileName: e.target.value
        })
    }
    changeNameRootPath(e) {
        this.setState({
            nameRootPath: e.target.value
        })
    }
    changeAbsoluteRootPath(e) {
        this.setState({
            absoluteRootPath: e.target.value
        })
    }

    newRootPath() {
        // var winpath = /^[a-zA-Z];[\\/]((?! )(?![^\\/]*\s+[\\/])[\w -]+[\\/])*(?! )(?![^.]+\s+\.)[\w -]+$/;
        // var lnxPath = /^([\/] [\w-]+)*$/;
        
        var self = this;
        self.setState({
            isLoading: true
        })
        var submitData = {
            token: this.props.tamperUsrToken,
            host_name: this.state.hostServer.toString(),
            root_path: this.state.absoluteRootPath,
            root_mark: this.state.nameRootPath,
            username: this.props.username,
            password: this.state.password,
            "service_type": "svn"
        }
        $.ajax({
            url: "/api/tamper_proof/new_user_root_path/",
            type: "POST",
            dataType: "json",
            data: submitData,
            success(data) {
                if (data[0].status == 'FAILURE') {
                    self.setState({
                        showMsgBox: true,
                        msgContent: '新建根目录失败',
                        msgButtonState: true,
                        msgButtonName: '确认',
                        isLoading: false
                    })
                }
                if (data[0].status == 'SUCCESS') {
                    self.setState({
                        isLoading: false
                    })
                    self.props.hideAllotRootPath()
                    self.props.userDetailList(self.props.username, self.props.is_super, self.props.status, self.props.position, self.props.phone, self.props.email, self.props.department)
                }
            },
        })
    }

    getHostList() {
        var self = this;
        $.ajax({
            url: "/api/tamper_proof/get_host_list/",
            type: "POST",
            dataType: "json",
            data: {
                token: this.props.tamperUsrToken,
                "service_type": "svn"
            },
            success(data) {
                self.setState({
                    hostSelector: data[0].result
                })
            },
        })
    }

    componentWillMount() {
        this.setState({
            isLoading: false
        })
        this.getHostList()
    }
    render() {
        //显示在当前ip的下拉列表中的项
        var itemsIP = [{
            name: '选择主机',         //显示在下拉列表中
            value: 'clientname'      //选中时传递的值
        }]


        this.state.hostSelector.map(function (item, index) {
            itemsIP.push({
                name: item.host_name,        //显示在列表中的项
                value: item.host_name        //选中时传递的值
            })
        })
        return (
            this.props.showAllotRootPath == true &&
            <div style={{ width: "100%", height: '100%' }}>

                <div className='addRootPath'>
                    <div className='AllotRootPath'>
                        <div className='header'>
                            新建根目录
                    </div>


                        {this.state.isLoading && <Loading />}
                        {!this.state.isLoading &&
                            <div>
                                <DropdownList
                                    listID="whitelist-type-list"
                                    itemsToSelect={itemsIP}
                                    onSelect={(item) => this.searchItem(item)} />

                                <div className='nameDic'>
                                    命名该根目录<br />
                                    <input placeholder='请命名该根目录' value={this.state.nameRootPath} onChange={(e) => this.changeNameRootPath(e)} />
                                </div>

                                <div className='rootName'>
                                    根目录绝对地址<br />
                                    <input placeholder='请输入根目录绝对地址' value={this.state.absoluteRootPath} onChange={(e) => this.changeAbsoluteRootPath(e)} />
                                </div>
                                <div className='line'></div>


                                <div className='AllotOpration'>
                                    <button className='cancelOpration' onClick={this.props.hideAllotRootPath.bind(this)}>取消</button>
                                    <button onClick={this.newRootPath.bind(this)}>新建根目录</button>
                                </div></div>
                        }

                    </div>
                </div>
                <div className='addRootPathMask'></div>


                <MessageBox
                    showMsgBox={this.state.showMsgBox}
                    msgContent={this.state.msgContent}
                    msgButtonState={this.state.msgButtonState}
                    msgButtonName={this.state.msgButtonName}
                    handleConfirmMsgBox={this.handleConfirmMsgBox.bind(this)}
                />
            </div>
        )
    }
}
export default AllotRootPath
