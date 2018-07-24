import React from "react";                   //引入react
import $ from "jquery";                      //引入jquery
import { Col, Form, FormGroup, HelpBlock, Pagination, ControlLabel, FormControl, Button,  Modal,  ButtonToolbar } from 'react-bootstrap';     //引入bootstrap组件
import { isMounted, sqltest,  isInt, isArray, isUrl, isName, isHash, isIP } from "../../utils/utils.js";     //引入用到的工具函数
import LoadingText from "../Commonality/LoadingText";                          //引入loading组件
import MessageBox from "../Commonality/MessageBox";                           //消息提示框组件
import DropdownList from "../Commonality/DropdownList"                       //下拉列表组件

import WhitelistTable from "./whitelist/WhitelistTable";                    //引入白名单表格组件


/* 白名单页 */
export default class WhiteList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showMsgBox: false,//不显示ajax加载提示框
            msgContent: '正在请求',//ajax请求弹框信息
            msgButtonState: false,//ajax请求弹框按钮状态
            msgButtonName: "请稍后...",//ajax请求按钮button提示内容

            isLoading: true,             //初始正在加载状态开启
            loadErr: false,              //错误
            whitelist: null,             //初始白名单为空
            pageCount: 0,                //总页数
            pageIndex: 0,                //当前页
            whitelistItem: 'clientname', //当前主机名
            modificationModal: false,    //弹框初始设为无
        };
        this.searchTypes = [      //搜索时可选的类型
            {
                name: '主机名',         //显示在下拉列表中
                value: 'clientname'      //选中时传递的值
            }, {
                name: '文件哈希',
                value: 'filedata'
            }, {
                name: '文件路径',
                value: 'filerouter'
            }
        ]
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
     * 翻页操作
     * 
     * @param {any} eventKey 
     * 
     * @memberof WhiteList
     */
    handlePageAdd(eventKey) {
        var searchkeyWord = $("#whitelistKey").val();　　　　//搜索关键字
        var itemKey = this.state.whitelistItem;            //type
        this.setState({
            pageIndex: eventKey,
            isLoading: true
        });
        //全选框设置
        if ($('#checkbox').hasClass('white-checked')) {
            $('#checkbox').removeClass('white-checked');
            $('#checkbox').addClass('select-all');
        }
        //根据用户是否输入关键字提供不同搜索
        searchkeyWord ? this.searchAjax(eventKey, itemKey, searchkeyWord) : this.searchAjax(eventKey);
    }

    /**
     * 页面改变　　
     * 用户手动输入对用户输入内容的过滤
     * 
     * @memberof WhiteList
     */
    handlePageChange() {
        var whitelistKey = $('#whitelistNum').val(); //搜索关键字
        if (!isInt(whitelistKey) || whitelistKey <= 0 || whitelistKey > this.state.pageCount) {
            $('#whitelistNum').val(this.state.pageCount);
        }
    }


    /**
     * 输入页面跳转
     * 
     * 
     * @memberof WhiteList
     */
    handleHrefClick() {
        var searchkeyWord = $('#whitelistKey').val();//搜索关键字
        var searchNum = $('#whitelistNum').val();   //用户输入页码
        this.setState({ isLoading: true });
        if (searchNum > 0 && searchNum <= this.state.pageCount) {
            var itemKey = this.state.whitelistItem; //ｔｙｐｅ
            if ($('#checkbox').hasClass('white-checked')) {//全选框设置
                $('#checkbox').removeClass('white-checked');
                $('#checkbox').addClass('select-all');
            }
            searchkeyWord ? this.searchAjax(searchNum, itemKey, searchkeyWord) : this.searchAjax(parseInt(searchNum));
            $('#pageNum').val(''); //清空用户输入
        } else {
            this.setState({
                isLoading: false, showMsgBox: true,//不显示ajax加载提示框
                msgContent: '请输入页码',//ajax请求弹框信息
                msgButtonState: true,//ajax请求弹框按钮状态
                msgButtonName: "确定",//ajax请求按钮button提示内容 })
            })
        }
    }


    /**
     * 获取下拉框搜索类别
     * 
     * @param {any} e 
     * 
     * @memberof WhiteList
     */
    searchItem(item) {
        this.setState({ whitelistItem: item })
    }


    /**
     * input输入框按下enter，支持搜索
     * 
     * @param {any} e 
     * 
     * @memberof WhiteList
     */
    searchKeyDown(e) {
        if (e.keyCode === 13) {//keyCode==13，表明按下enter
            this.whitelistSearch();
        }
    }


    /**
     * 按关键字搜索时与后台交互数据
     * 
     * @param {any} itemKey    ：类型关键字
     * @param {any} searchkeyWord ：搜索关键字
     * @param {any} pageIndex ： 当前页码
     * @returns 
     * 
     * @memberof WhiteList
     */
    searchAjax(pageIndex, itemKey, searchkeyWord) {
        var self = this;
        if (sqltest($(":text"))) {
            this.setState({
                showMsgBox: true,
                msgContent: '检测到非法字符',
                msgButtonState: true,
                msgButtonName: '确定'
            })
            return false;
        }
        $.ajax({
            url: '/api/whitelistSearch/',
            dataType: 'json',
            type: 'POST',
            data: {   //发送的数据包括搜索类别与关键字
                itemKey: itemKey,
                searchkeyWord: searchkeyWord,
                pageIndex: pageIndex
            },
            cache: false,
            error: function () {//发送错误
                if (isMounted(self)) {
                    self.setState({ isLoading: false, loadErr: true });
                }
            },
            //ajax成功时，数据渲染表格
            success: function (data) {
                var len = data.length;//数据长度
                // 页面失效关闭弹窗
                if (isMounted(self)) {
                    if (len > 1) {
                        self.setState({
                            isLoading: false,
                            loadErr: false,
                            pageCount: data[len - 1].totalpages,
                            whitelist: data.slice(0, len - 1),
                            pageIndex: parseInt(pageIndex)
                        })
                    } else {
                        //返回数据长度为0 ，暂无数据提示
                        self.setState({
                            isLoading: false,
                            loadErr: true
                        })
                    }
                }
            },
        });
    }


    /**
     * 白名单搜索，
     * 
     * 
     * @memberof WhiteList
     */
    whitelistSearch() {
        var itemKey = this.state.whitelistItem;//获取搜索类型
        var searchkeyWord = $("#whitelistKey").val();//获取搜索关键字
        var pageIndex = 1;
        this.setState({ isLoading: true });
        this.searchAjax(pageIndex, itemKey, searchkeyWord);
    }



    /**
     * 
     * 添加白名单－－添加白名单显示弹出框
     * 
     * @memberof WhiteList
     */
    showModificationModal() {
        this.setState({ modificationModal: true });
    }

    /**
     * 添加白名单－－隐藏弹出框
     * 
     * 
     * @memberof WhiteList
     */
    hideModificationModal() {
        this.setState({ modificationModal: false });
    }

    //设置可以拖动
    setDraggable(id) {
        require('../../utils/jquery-ui.min.js'); //在jquery-ui官网自定义的压缩文件，只包含实现draggable功能所需内容。
        $('#' + id).draggable(); //调用jquery-ui的draggable方法，jquery在文件开头被引入。
    }

    /**
     * 判断验证栏是否有错误提示
     * 
     * @returns 
     * 
     * @memberof WhiteList
     */
    checkForUpdate() {
        return $('.checkUpdate').text() == '' ? false : true;
    }

    /**
     * 判断主机名是否正确
     * 
     * @param {any} id 目标元素的id
     * @param {any} e 
     * 
     * @memberof WhiteList
     */
    checkName(id, e) {
        var name = e.target.value;
        if (!isName(name)) {
            $('#' + id).css('color', '#32a1ff');
            $('#' + id).text('字母,数字,‘-’或‘_’组成,开头为字母');
        } else {
            $('#' + id).text('');
        }
    }

    /**
     * 判断文件路径是否正确
     * 
     * @param {any} id  目标元素的id
     * @param {any} e 
     * 
     * @memberof WhiteList
     */
    checkUrl(id, e) {
        if (!isUrl(e.target.value)) {
            $('#' + id).css('color', '#32a1ff');
            $('#' + id).text('文件路径格式错误');
        } else {
            $('#' + id).text('');
        }
    }

    /**
     * 判断文件（数据）哈希格式是否正确
     * 
     * @param {any} id 
     * @param {any} e 
     * 
     * @memberof WhiteList
     */
    checkHash(id, e) {
        if (!isHash(e.target.value)) {
            $('#' + id).css('color', '#32a1ff');
            $('#' + id).text('文件（数据）哈希格式错误');
        } else {
            $('#' + id).text('');
        }
    }

    /**
     * 判断文件IP是否正确
     * 
     * @param {any} id 
     * @param {any} e 
     * 
     * @memberof WhiteList
     */
    checkIP(id, e) {
        if (!isIP(e.target.value)) {
            $('#' + id).css('color', '#32a1ff');
            $('#' + id).text('IP地址格式错误');
        } else {
            $('#' + id).text('');
        }
    }

    /**
     * 添加白名单操作
     * 
     * @returns 
     * 
     * @memberof WhiteList
     */
    addWL() {
        var self = this;
        if (this.checkForUpdate()) {
            self.setState({
                showMsgBox: true,
                msgContent: '请检查您输入的内容是否完整！',
                msgButtonState: true,
                msgButtonName: '确定'
            })
            return;
        } else {
            var wlName = $('#newName').val();//获取用户输入内容
            var wlText = $('#newText').val();
            var wlUrl = $('#newUrl').val();
            var wlIP = $('#newIP').val();

            if (wlName && wlText && wlUrl && wlIP) {
                $.ajax({
                    url: '/api/addwl/',
                    type: 'POST',
                    dataType: 'json',
                    cache: false,
                    data: {//ajax发送用户输入数据
                        "wlName": wlName,
                        "wlText": wlText,
                        "wlUrl": wlUrl,
                        "wlIP": wlIP
                    },
                    error: function (error) {//错误执行方法
                        if (isArray(error)) {
                            self.setState({
                                showMsgBox: true,
                                msgContent: '添加失败',
                                msgButtonState: true,
                                msgButtonName: '确定'
                            })

                        }
                    },
                    success: function (data) {
                        if (data.code == '201') {
                            self.hideModificationModal();
                            self.setState({
                                showMsgBox: true,
                                msgContent: '添加失败: 请勿重复添加！',
                                msgButtonState: true,
                                msgButtonName: '确定'
                            })
                        }
                        if (data.code == '200') {
                            self.hideModificationModal();//成功时弹框消失
                            var old_whitelist = self.state.whitelist;
                            old_whitelist.slice(0, data.length - 1);
                            self.setState({
                                showMsgBox: true,
                                msgContent: '添加成功',
                                msgButtonState: true,
                                msgButtonName: '确定'
                            })
                        } else {
                            self.setState({
                                showMsgBox: true,
                                msgContent: '服务器繁忙，请稍后在试',
                                msgButtonState: true,
                                msgButtonName: '确定'
                            })
                        }

                    }
                });
            }
        }
    }

    /**
     * 全选删除功能
     * 
     * 
     * @memberof WhiteList
     */
    deleteAllModal() {

        var deletes = [];
        var deleteWhole = $(".white-tr");
        for (var i = 0; i <= deleteWhole.length; i++) {
            if ($(".checkedAll1").eq(i).hasClass('white-checked')) {
                var ids = deleteWhole.eq(i).attr("id");
                deletes.push(ids);//将要删除的id存入数组中            
            }
        }
        if (!deletes.length) {
            this.setState({
                showMsgBox: true,
                msgContent: '请选择要删除的内容',
                msgButtonState: true,
                msgButtonName: '确定'
            })

        } else {
            var string = "";
            for (var j = 0; j < deletes.length; j++) {
                string += "WL";
                string += deletes[j];
            }
            this.deleteAjax(string);//调用删除ajax

        }
    }

    /**
     * 删除Ajax
     * 
     * @param {any} jsonIds 
     * 
     * @memberof WhiteList
     */
    deleteAjax(jsonIds) {

        var self = this;
        $.ajax({
            url: "/api/deletemlall/",
            data: {
                ids: jsonIds
            },
            type: "POST",
            dataType: "json",
            error: function () {//错误执行方法
                self.setState({
                    showMsgBox: true,
                    msgContent: '删除失败',
                    msgButtonState: true,
                    msgButtonName: '确定'
                })
            },
            success: function (data) {
                //发送成功重新渲染页面
                var code = data.code;
                //如果当前页==总页数的话,说明是最后一页的数据,
                if (code == '200') {
                    var old_whitelist = self.state.whitelist;
                    self.searchAjax(1);
                    self.setState({
                        showMsgBox: true,
                        msgContent: '删除成功',
                        msgButtonState: true,
                        msgButtonName: '确定'
                    })
                    self.setState({ whitelist: old_whitelist });
                    if ($('.wl-select').hasClass('white-checked')) {
                        $('.wl-select').removeClass('white-checked');
                        $('.wl-select').addClass('select-all');
                    }
                } else {
                    self.setState({
                        showMsgBox: true,
                        msgContent: '服务器繁忙，请稍后在试',
                        msgButtonState: true,
                        msgButtonName: '确定'
                    })
                }

            }
        });

    }


    //页面加载之前
    componentWillMount() {
        //请求第一页的数据
        this.searchAjax(1);
    }


    //页面渲染
    render() {
        return (
            <div className="whiteList-content clearfix">
                {/*添加白名单*/}
                <Modal
                    id='modifyWLModal'
                    show={this.state.modificationModal}
                    onEntered={this.setDraggable.bind(this, 'modifyWLModal')}
                    onHide={this.hideModificationModal.bind(this)}
                    backdrop='static'>
                    <Modal.Header closeButton >
                        <Modal.Title id="header">添加白名单</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form horizontal>
                            <FormGroup controlId="newName">
                                <Col componentClass={ControlLabel} sm={3}>
                                    主机名
                                </Col>
                                <Col sm={4}>
                                    <FormControl
                                        type="text"
                                        onBlur={this.checkName.bind(this, "hostName")}
                                    />
                                </Col>
                                <Col sm={5}>
                                    <HelpBlock id="hostName" className="checkUpdate"> </HelpBlock>
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="newText">
                                <Col componentClass={ControlLabel} sm={3}>
                                    文件哈希
                                </Col>
                                <Col sm={4}>
                                    <FormControl
                                        type="text"
                                        onBlur={this.checkHash.bind(this, "hashName")}
                                    />
                                </Col>
                                <Col sm={5}>
                                    <HelpBlock id="hashName" className="checkUpdate"></HelpBlock>
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="newUrl">
                                <Col componentClass={ControlLabel} sm={3}>
                                    文件路径
                                </Col>
                                <Col sm={4}>
                                    <FormControl
                                        type="text"
                                        onBlur={this.checkUrl.bind(this, "urlName")}
                                    />
                                </Col>
                                <Col sm={5}>
                                    <HelpBlock id="urlName" className="checkUpdate"></HelpBlock>
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="newIP">
                                <Col componentClass={ControlLabel} sm={3}>
                                    IP
                                </Col>
                                <Col sm={4}>
                                    <FormControl
                                        type="text"
                                        onBlur={this.checkIP.bind(this, "ipName")}
                                    />
                                </Col>
                                <Col sm={5}>
                                    <HelpBlock id="ipName" className="checkUpdate"></HelpBlock>
                                </Col>
                            </FormGroup>

                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className="modalCancelBtn" bsSize="xs" onClick={this.hideModificationModal.bind(this)}>取消</Button>
                        <Button className="modalSubmitBtn" bsSize="xs" bsStyle="primary" onClick={this.addWL.bind(this)}>确定</Button>
                        <Col sm={12}>
                            <HelpBlock id="deleMsg"></HelpBlock>
                        </Col>
                    </Modal.Footer>
                </Modal>
                {/*/*/}


                <div className="wl-header">
                    <h2 className="block-chain-sec-title">白名单</h2>
                    <ButtonToolbar bsClass="whiteListButton">
                        <Button bsStyle="primary" bsSize="sm" id="whiteListTitle" onClick={this.showModificationModal.bind(this)}>添加</Button>
                        <Button bsSize="sm" onClick={this.deleteAllModal.bind(this)}>删除</Button>
                        <Button bsStyle="primary" bsSize="sm" className="whiteListSearch" onClick={this.whitelistSearch.bind(this)}>搜索</Button>
                        <span className="search-img" onClick={this.whitelistSearch.bind(this)}></span>
                        <div className="logs-select">
                            <input id="whitelistKey" name="whitelistKey" className="form-control" placeholder="请输入关键字" onKeyDown={this.searchKeyDown.bind(this)} />
                        </div>
                        <div className="logs-select">
                            <DropdownList
                                listID="whitelist-type-list"
                                itemsToSelect={this.searchTypes}
                                onSelect={(item) => this.searchItem(item)} />
                        </div>
                    </ButtonToolbar>

                </div>

                <div className="whitelist">

                    {this.state.isLoading && !this.state.loadErr && <LoadingText />}
                    {this.state.loadErr && !this.state.isLoading && <div className="whiteError">暂无数据</div>}
                    {!this.state.isLoading && !this.state.loadErr &&
                        <div>
                            <WhitelistTable
                                whitelist={this.state.whitelist}
                                searchAjax={this.searchAjax.bind(this)}
                                pageIndex={this.state.pageIndex}
                                itemKey={this.state.whitelistItem}
                            />
                            <div className="pagination-all">
                                <Pagination
                                    prev={true}
                                    next={true}
                                    first={false}
                                    last={false}
                                    ellipsis={true}
                                    boundaryLinks={true}
                                    items={this.state.pageCount}
                                    maxButtons={7}
                                    activePage={this.state.pageIndex}
                                    onSelect={this.handlePageAdd.bind(this)} />
                                <div className="pageCount">
                                    <input className="pageNum" id="whitelistNum" placeholder="输入" onChange={this.handlePageChange.bind(this)} />
                                    <img className="searchNum" onClick={this.handleHrefClick.bind(this)} src='/static/img/skip.svg' />
                                </div>
                            </div>
                        </div>}



                </div>



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





