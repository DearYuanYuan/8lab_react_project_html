import React from "react"; //引入react
import $ from "jquery";  //引入jquery
import {
    Col, Form, FormGroup, HelpBlock,
    ControlLabel, FormControl, Button, Modal, OverlayTrigger, Tooltip
} from 'react-bootstrap'; //引入bootstrap组件
import { isArray, isName, isUrl, isHash, isIP } from "../../../utils/utils";     //引入用到的工具函数

import MessageBox from "../../Commonality/MessageBox"      //消息提示框组件


//白名单表格模块
export default class WhitelistTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showMsgBox: false,//不显示ajax加载提示框
            msgContent: '正在请求',//ajax请求弹框信息
            msgButtonState: false,//ajax请求弹框按钮状态
            msgButtonName: "请稍后...",//ajax请求按钮button提示内容
            modificationModal: false,           //编辑白名单模块的显示影藏
            whitelist: this.props.whitelist,     //数据列表
            deleteModal: false,                 //用于控制删除白名单的弹出页
            pageIndex: this.props.pageIndex,     //当前页
            loading: false
        };
    }

    /**
      * Message消息组件相关函数
      * 组件渲染之前设置数据
      * @param {any} val 消息组件是否显示的Boole值
      * 
      * @memberof HomeHeader
      */
    handleConfirmMsgBox() {
        this.setState({
            showMsgBox: false
        })
    }


    /**
     * 单选   
     * 
     * @param {any} index 
     * @param {any} id  选中的id
     * 
     * @memberof WhitelistTable
     */
    showSeleteAll(index, id) {
        this.state.id = id;
        var checkdAll = $(".checkedAll");    //获得checkdAll的jquery对象
        if (checkdAll.eq(index + 1).hasClass('white-checked')) {
            checkdAll.eq(index + 1).addClass('select-all');
            checkdAll.eq(index + 1).removeClass('white-checked');
        } else {
            checkdAll.eq(index + 1).removeClass('select-all');
            checkdAll.eq(index + 1).addClass('white-checked');
        }
    }

    /**
     * 显示白名单弹框
     * 
     * @param {any} wl 
     * @param {any} index 
     * @param {any} id 
     * 
     * @memberof WhitelistTable
     */
    showModificationModal(wl, index, id) {
        this.setState({ modificationModal: true });
        this.wl = wl;
        this.index = index;
        this.state.id = id;
    }


    /**
     * 隐藏编辑白名单弹出框
     * 
     * 
     * @memberof WhitelistTable
     */
    hideModificationModal() {
        this.setState({ modificationModal: false });
    }

    /**
     * 设置窗口可拖动
     * @param {*} id 要设置可拖动的元素的id
     */
    setDraggable(id) {
        require('../../../utils/jquery-ui.min.js'); //在jquery-ui官网自定义的压缩文件，只包含实现draggable功能所需内容。
        $('#' + id).draggable(); //调用jquery-ui的draggable方法，jquery在文件开头被引入。
    }

    /**
     * 检验文件名是否合法
     * @param {*} id 显示提示信息的元素的id
     * @param {*} e 
     */
    checkName(id, e) {
        var name = e.target.value;
        var whole = $('#' + id);    //获取显示提示信息的元素
        if (!isName(name)) {        //如果不符合命名规范
            whole.css('color', '#32a1ff');
            whole.text('字母,数字或‘-’组成,开头为字母');
        } else {
            whole.text('');
        }
    }

    /**
     * 检验文件路径格式是否合法
     * @param {*} id 显示提示信息的元素的id
     * @param {*} e 
     */
    checkUrl(id, e) {
        var whole = $('#' + id);    //获取显示提示信息的元素
        if (!isUrl(e.target.value)) {//如果不符合规范
            whole.css('color', '#32a1ff');
            whole.text('文件路径格式错误');
        } else {
            whole.text('');
        }
    }

    /**
     * 检验文件（数据）哈希格式是否合法
     * @param {*} id 显示提示信息的元素的id
     * @param {*} e 
     */
    checkHash(id, e) {
        var whole = $('#' + id);    //获取显示提示信息的元素
        if (!isHash(e.target.value)) {//如果不符合规范
            whole.css('color', '#32a1ff');
            whole.text('文件（数据）哈希格式错误');
        } else {
            whole.text('');
        }
    }

    /**
     * ip格式是否合法
     * @param {*} id 显示提示信息的元素的id
     * @param {*} e 
     */
    checkIP(id, e) {
        var whole = $('#' + id);    //获取显示提示信息的元素
        if (!isIP(e.target.value)) {//如果不符合规范
            whole.css('color', '#32a1ff');
            whole.text('IP地址格式错误');
        } else {
            whole.text('');
        }
    }

    /**
     * 单条编辑
     *  
     * @param {any} id 编辑的ＩＤ
     * @returns 
     * 
     * @memberof WhitelistTable
     */
    writeModal(id) {
        //获取数据newWLName  newWLText   newWLUrl
        if (!$('.single-help').text() == '') {       //如果表单中有错误提示信息
            return;
        } else {
            $('#' + id).text('');           //清空底部的错误信息栏的内容
            //获取输入框的内容
            var newWLName = $('#newWLName').val();
            var newWLText = $('#newWLText').val();
            var newWLUrl = $('#newWLUrl').val();
            var newWLIP = $('#newWLIP').val();
            var writeId = this.state.id;
            var self = this;
            if (newWLName && newWLText && newWLUrl) {   //如果输入内容完整
                var searchkeyWord = $("#whitelistKey").val();//获取搜索关键字
                var itemKey = self.props.itemKey;
                var pageIndex = self.props.pageIndex;
                $.ajax({
                    url: '/api/updatewl/',
                    type: 'POST',
                    dataType: 'json',
                    cache: false,
                    data: {
                        "id": writeId,
                        "wlName": newWLName,
                        "wlText": newWLText,
                        "wlUrl": newWLUrl,
                        "wlIP": newWLIP
                    },
                    error: function (error) {//错误执行方法
                        if (isArray(error)) {
                            self.setState({         //显示消息提示弹窗
                                showMsgBox: true,
                                msgContent: '编辑失败,服务器端错误',
                                msgButtonState: true,
                                msgButtonName: '确定'
                            })
                        }
                    },
                    success: function (data) {
                        var code = data.code;
                        if (code == '200') {    //如果编辑成功
                            self.setState({     //显示消息提示弹窗
                                showMsgBox: true,
                                msgContent: '编辑成功',
                                msgButtonState: true,
                                msgButtonName: '确定'
                            })
                            self.hideModificationModal();   //隐藏编辑弹窗
                            //编辑后重新获取数据并渲染白名单表格
                            self.props.searchAjax(pageIndex, itemKey, searchkeyWord);
                        }
                    }
                })
            } else {    //输入内容不完整
                self.setState({     //显示消息提示弹窗
                    showMsgBox: true,
                    msgContent: '请检查内容是否填写完整',
                    msgButtonState: true,
                    msgButtonName: '确定'
                })

            }
        }
    }

    /**
     * 单条删除
     * @param {any} id 
     * 
     * @memberof WhitelistTable
     */
    deleteWL(id) {
        var self = this;
        var searchkeyWord = $("#whitelistKey").val();//获取搜索关键字
        var itemKey = self.props.itemKey;
        var pageIndex = self.props.pageIndex;
        this.setState({
            loading: true
        })
        $.ajax({
            url: '/api/deletewl/',
            type: "POST",
            dataType: "json",
            data: {
                ids: id
            },
            error: function () {//错误执行方法
                self.setState({     //显示消息提示弹窗
                    showMsgBox: true,
                    msgContent: '删除失败,服务器端错误',
                    msgButtonState: true,
                    msgButtonName: '确定'
                })
            },
            success: function (data) {
                var code = data.code;
                if (code == '200') {    //如果删除成功
                    self.setState({     //显示消息提示弹窗
                        showMsgBox: true,
                        msgContent: '删除成功',
                        msgButtonState: true,
                        msgButtonName: '确定'
                    })
                    //删除后重新获取数据并渲染白名单表格
                    self.props.searchAjax(pageIndex, itemKey,searchkeyWord);
                }
            }
        });
    }


    /**
     * 全选
     * 
     * 
     * @memberof WhitelistTable
     */
    SeleteAll() {//带有对勾切图时，删除对勾切图
        if ($(".checkedAll").hasClass('white-checked')) {
            $(".checkedAll").addClass('select-all');
            $(".checkedAll").removeClass('white-checked');
        } else {
            $(".checkedAll").removeClass('select-all');
            $(".checkedAll").addClass('white-checked');
        }
    }



    //页面渲染
    render() {
        return (
            <div className="table whiteListTable" style={{'marginTop':'0'}}>
                {/*白名单列表*/}
                <div className="thead">
                    <div className="wl-select select-all checkedAll " onClick={this.SeleteAll.bind(this)}></div>
                    <div className="wl-index">序号</div>
                    <div className="wl-type">主机名</div>
                    <div className="wl-filedata-num">文件（数据）哈希</div>
                    <div className="wl-filename-hint">文件路径</div>
                    <div className="wl-filename-ip">IP</div>
                    <div className="wl-filename-operate">操作</div>
                </div>
                <div className="tbody clearfix">
                    {this.props.whitelist && this.props.whitelist.map(function (wl, index) {
                        return (
                            <div className="tr white-tr" key={wl.id} id={wl.id}>
                                <div className="wl-select select-all checkedAll checkedAll1" onClick={this.showSeleteAll.bind(this, index, wl.id)}  ></div>
                                <div className="wl-index">{index}</div>
                                <div className="wl-type" >
                                    {wl.clientname}
                                    {/*  <MlTooltip
                                        value={wl.clientname}
                                        id={wl.clientname}
                                    />*/}
                                </div>
                                <div className="wl-filedata-num" title={wl.filedata}>
                                    {wl.filedata}
                                    {/*  <MlTooltip
                                   value={wl.filedata}
                                        id={wl.filedata}
                                    />*/}
                                </div>
                                <div className="wl-filename-hint" title={wl.filerouter}>
                                    {wl.filerouter}
                                    {/*  <MlTooltip
                                      value={wl.filerouter}
                                        id={wl.filerouter}
                                    />*/}

                                </div>
                                <div className="wl-ip">{wl.ip}</div>
                                <div className="wl-filename-operate">
                                    <div className="img-write" onClick={this.showModificationModal.bind(this, wl, index, wl.id)} ></div>
                                    <div className="img-delete" onClick={this.deleteWL.bind(this, wl.id, index)}></div>
                                </div>

                            </div>
                        );
                    }, this)}
                </div>
                {/*编辑白名单的弹窗*/}
                <Modal
                    id='modifyWLModal'
                    show={this.state.modificationModal}
                    onEntered={this.setDraggable.bind(this, 'modifyWLModal')}
                    onHide={this.hideModificationModal.bind(this)}
                    backdrop='static'>
                    <Modal.Header closeButton >
                        <Modal.Title id="header">编辑白名单</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form horizontal>
                            <FormGroup controlId="newWLName">
                                <Col componentClass={ControlLabel} sm={3}>
                                    主机名
                                </Col>
                                <Col sm={4}>
                                    <FormControl
                                        type="text"
                                        defaultValue={this.wl == null ? null : this.wl.clientname}
                                        onBlur={this.checkName.bind(this, "single-hostName")}
                                    />
                                </Col>
                                <Col sm={4}>
                                    <HelpBlock id="single-hostName" className="single-help" />
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="newWLText">
                                <Col componentClass={ControlLabel} sm={3}>
                                    文件哈希
                                </Col>
                                <Col sm={4}>
                                    <FormControl
                                        type="text"
                                        defaultValue={this.wl == null ? null : this.wl.filedata}
                                        onBlur={this.checkHash.bind(this, "single-hashName")}
                                    />
                                </Col>
                                <Col sm={4}>
                                    <HelpBlock id="single-hashName" className="single-help" />
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="newWLUrl">
                                <Col componentClass={ControlLabel} sm={3}>
                                    文件路径
                                </Col>
                                <Col sm={4}>
                                    <FormControl
                                        type="text"
                                        defaultValue={this.wl == null ? null : this.wl.filerouter}
                                        onBlur={this.checkUrl.bind(this, "single-urlName")}
                                    />
                                </Col>
                                <Col sm={4}>
                                    <HelpBlock id="single-urlName" className="single-help" />
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="newWLIP">
                                <Col componentClass={ControlLabel} sm={3}>
                                    IP
                                </Col>
                                <Col sm={4}>
                                    <FormControl
                                        type="text"
                                        defaultValue={this.wl == null ? null : this.wl.ip}
                                        onBlur={this.checkIP.bind(this, "single-ipName")}
                                    />
                                </Col>
                                <Col sm={4}>
                                    <HelpBlock id="single-ipName" className="single-help" />
                                </Col>
                            </FormGroup>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className="modalCancelBtn" bsSize="xs" onClick={this.hideModificationModal.bind(this)}>取消</Button>
                        <Button className="modalSubmitBtn" bsSize="xs" bsStyle="primary" onClick={this.writeModal.bind(this, 'deleMsg')}>确定</Button>
                        <Col sm={12}>
                            <HelpBlock id="deleMsg"></HelpBlock>
                        </Col>
                    </Modal.Footer>
                </Modal>
                {/*消息提示框*/}
                <MessageBox
                    showMsgBox={this.state.showMsgBox}
                    msgContent={this.state.msgContent}
                    msgButtonState={this.state.msgButtonState}
                    msgButtonName={this.state.msgButtonName}
                    handleConfirmMsgBox={this.handleConfirmMsgBox.bind(this)}
                />
            </div>
        );
    }
}


