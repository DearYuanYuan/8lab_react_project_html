import React from "react";　　　　　　　　　　　　　　　   //react
import $ from 'jquery';                               //jquery
import MessageBox from "../Commonality/MessageBox"    //消息提示


//分配根目录
class AllotRootPath extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rootPathListName: [],   　　　　　　　　//所有根目录名字
            treeStructureList: [],               //分配跟目录列表
            treeStructure: [],      　　　　　　　　//所有的内容

            isLoading: true,                       //loading
            showMsgBox: false,                   //不显示消息提示框
            msgContent: '',                      //提示框的提示消息
            msgButtonState: false,               //提示框中的按钮状态
            msgButtonName: "",                   //提示框中的按钮名称
            isShowedBadBehaveSetting: false,     //恶意行为弹出框
        }
    }

    　　
    /*
     *
     * 消息弹出框的按钮点击事件的监听
     */
    handleConfirmMsgBox() {
        this.setState({
            showMsgBox: false,
        })
    }
    //组件即将加载
    componentWillMount() {
        var self = this;
        //请求所有主机路径
        $.ajax({
            url: '/api/tamper_proof/get_all_host_path/',
            dataType: "json",
            type: "POST",
            data: {
                token: this.props.tamperUsrToken,
                "service_type": "web"
            },
            success(data) {
                if (data[0].status == 'FAILURE') {
                    self.setState({
                        showMsgBox: true,
                        msgContent: '获取根目录列表失败',
                        msgButtonState: true,
                        msgButtonName: '确认',
                        isLoading: false
                    })
                }
                if (data[0].status == 'SUCCESS') {
                    //所有根目录主机名称
                    var rootPathListName = [];　　　　
                    for (var key in data[0].result) {
                        rootPathListName.push(key);
                    }
                    self.setState({
                        rootPathListName: rootPathListName,
                        treeStructure: data[0].result,
                        isLoading: false
                    })
                }
            }
        })
    }

    /**
     * 选择要分配的根目录
     * 
     * @param {any} rootPath 　　根目录
     * @param {any} host_name 　主机名
     * @param {any} e       
     * @memberof AllotRootPath
     */
    checkSingle(rootPath, host_name, e) {
        if ($(e.target).hasClass('cancel')) {
            $(e.target).addClass('slector').removeClass('cancel')
        } else {
            $(e.target).addClass('cancel').removeClass('slector')
        }
    }


    /**
     * 提交修改分配
     * 
     * @memberof AllotRootPath
     */
    submitChange() {
        var submit = [];
        var self = this;
        self.setState({
            isLoading: true
        })
        for (var i = 0; i < $('.checkSingle').length; i++) {
            var obj = $('.checkSingle')[i]
            if ($(obj).is('.slector')) {
                var submitobj = {}
                submitobj.host = $(obj).attr('title')
                submitobj.path = $(obj).attr('name')
                submit.push(submitobj)
            }
        }
        var data = {
            token: this.props.tamperUsrToken,
            userName: this.props.username,
            password: this.state.password,
            assignRootPath: JSON.stringify(submit),
            "service_type": "web"
        }
        $.ajax({
            url: '/api/tamper_proof/assign_user_root_path/',
            dataType: "json",
            type: "POST",
            data: data,
            success: function(data) {
                if (data[0]["status"] == "FAILURE") {
                    self.setState({
                        showMsgBox: true,
                        msgContent: '分配根目录失败',
                        msgButtonState: true,
                        msgButtonName: '确认',
                        isLoading: false
                    })
                }
                if (data[0]["status"] == "SUCCESS") {
                    //分配成功后关闭窗口
                    self.setState({
                        isLoading: false
                    })
                    self.props.hideAddRootPath();
                    self.props.userDetailList(self.props.username, self.props.is_super, self.props.status, self.props.position, self.props.phone, self.props.email, self.props.department)
                }

            },
            error: function() {
                self.setState({
                    showMsgBox: true,
                    msgContent: '分配根目录失败',
                    msgButtonState: true,
                    msgButtonName: '确认',
                    isLoading: false
                })
            }
        })
    }


    /**
     * 选中主机展示闭合列表
     * 
     * @param {any} rootName 　主机名称
     * @param {any} StringHost 选中主机的所有可分配根目录
     * @param {any} index      根据index确认当前需要展示动画的主机
     * @param {any} e 
     * @memberof AllotRootPath
     */
    changeRootList(rootName, StringHost, index, e) {
        if ($(e.target).hasClass('showAllFile')) {
            $(e.target).removeClass('showAllFile').addClass('hideAllFile')
            $('.rootPath-content').eq(index).find('.showRootList').slideUp(200)
        } else {
            $(e.target).removeClass('hideAllFile').addClass('showAllFile')
            $('.rootPath-content').eq(index).find('.showRootList').slideDown(200)
        }
        this.setState({
            treeStructureList: JSON.parse(StringHost),
        })
    }

    //渲染函数
    render() {
        return (
            this.props.showAddRootPath &&
            <div className='addRootPath' >
                <div className='content'>
                    <div className='header'>分配已有根目录</div>
                    <div className='search'>
                        <input placeholder='搜索现有根目录' />
                        <button>搜索</button>
                    </div>
                    <div className='fileDirectory'>
                        {this.state.rootPathListName && this.state.rootPathListName.map(function (rootName, index) {
                            var StringHost = this.state.treeStructure[rootName];
                            StringHost = JSON.stringify(StringHost)
                            return (
                                <div key={index} className='rootPath-content' >
                                    <div className='colFileDir clearfix'>
                                        <div className='hideAllFile' onClick={(e) => this.changeRootList(rootName, StringHost, index, e)} >
                                        </div>
                                        <i className="fa fa-server" aria-hidden="true"></i>
                                        <div className='fileName'>
                                            {rootName}
                                        </div>
                                    </div>
                                    <div className='showRootList'>
                                        <div className='thead clearfix'>
                                            <div>分配</div>
                                            <div>根目录别名</div>
                                            <div>绝对路径</div>
                                        </div>
                                        <div className='line'></div>
                                        <div className='tboady'>
                                            {
                                                this.state.treeStructureList.map(function (name, index) {
                                                    return (
                                                        <div key={index} className='rootSingleRow clearfix'>
                                                            <div className='checkSingle cancel' title={rootName} name={name.protect_root_path} onClick={(e) => this.checkSingle(name.protect_root_path, rootName, e)}>&nbsp;</div>
                                                            <div className='rootAlias' title={name.protect_path_mark}><i className="fa fa-folder fl" aria-hidden="true"></i>{name.protect_path_mark}</div>
                                                            <div className='absoluteRoot' title={name.protect_root_path}>{name.protect_root_path}</div>
                                                        </div>
                                                    )
                                                }.bind(this))
                                            }
                                        </div>
                                    </div>
                                </div>
                            )
                        }.bind(this))}
                    </div>
                    <div className='pathOperation'>
                        <button className='pathCancel' onClick={this.props.hideAddRootPath.bind(this)}>取消</button>
                        <button className='pathSave' onClick={this.submitChange.bind(this)}>保存修改</button>
                    </div>
                </div>
                <MessageBox
                    showMsgBox={this.state.showMsgBox}
                    msgContent={this.state.msgContent}
                    msgButtonState={this.state.msgButtonState}
                    msgButtonName={this.state.msgButtonName}
                    handleConfirmMsgBox={this.handleConfirmMsgBox.bind(this)}
                    isLarge={this.state.isMsgBoxLarge}                   //默认为false,小尺寸
                />
            </div>
        )
    }
}
export default AllotRootPath
