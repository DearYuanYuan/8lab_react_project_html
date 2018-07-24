
import React from "react";                                  //引入react
import { Modal, Button } from 'react-bootstrap';
import { isUrl } from "../../utils/utils";　　　             //引入用到的工具函数
import DropdownList from "../Commonality/DropdownList";     //下拉列表的组件
import MessageBox from "../Commonality/MessageBox"          //消息提示框组件

export default class Addserver extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            addIP: '',                           //新增主机用户输入的Ip
            addTag: '',                          //新增主机用户输入的主机标签
            addRemark: '',                       //新增主机用户输入的备注信息
            //提示框
            showMsgBox: false,                   //不显示消息提示框
            msgContent: '',                      //提示框的提示消息
            msgButtonState: false,               //提示框中的按钮状态
            msgButtonName: "",                   //提示框中的按钮名称
        }
    }

    /**
    * ip连接测试
    * @param {any} ip　需要连接测试的ip
    * @memberof VirusScan
    */
    linkTest(ip) {
        var self = this;
        $.ajax({
            url: '/api/machinelist/link_test/',
            type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: {                         //表单数据
                hostip: ip,
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            traditional: true,          //阻止JQuery深度序列化对象
            success: function (result) {
                if (result.code == 200) {
                    self.setState({
                        showMsgBox: true,
                        msgContent: result.message,
                        msgButtonState: true,
                        msgButtonName: '确认',
                    })
                } else {
                    self.setState({     //显示提示消息
                        showMsgBox: true,
                        msgContent: result.message,
                        msgButtonState: true,
                        msgButtonName: '确认',
                    });
                }
            }
        })
    }
    /**
      * 消息弹出框的按钮点击事件的监听
      */
    handleConfirmMsgBox() {
        this.setState({     //隐藏消息提示框
            showMsgBox: false,
        })
    }

    /**
    * 新增主机
    * hostip：　新增主机ip
    * hostname :  新增主机的标签
    * remark：　　　新增主机的备注
    * @memberof VirusScan
    */
    addServer() {
        var self = this;
        $.ajax({
            url: '/api/machinelist/add/',
            type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: {                         //表单数据
                hostip: self.state.addIP,
                hostname: self.state.addTag,
                remark: self.state.addRemark,
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            traditional: true,          //阻止JQuery深度序列化对象
            success: function (result) {
                if (result.code == 200) {
                    self.props.hide();                //关闭弹窗
                    self.props.getHostList();      //重新获取数据
                } else {
                    self.setState({     //显示提示消息
                        showMsgBox: true,
                        msgContent: result.message,
                        msgButtonState: true,
                        msgButtonName: '确认',
                    });
                }
            }
        })
    }

    render() {
        return (
            <div>
                <Modal id="add-servers" bsSize="lg" aria-labelledby="contained-modal-title-sm" show={this.props.show}
                    onHide={this.props.hide}>
                    <form >
                        <Modal.Header closeButton>
                            <Modal.Title >新增主机</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <label>主机 IP
                                <input placeholder='192.168.1.1' type='text ' className='form-control' value={this.state.addIP} onChange={(e) => this.setState({ addIP: e.target.value })} />
                            </label>
                            <label>主机标签
                                <input placeholder='Tag' type='text' className='form-control' value={this.state.addTag} onChange={(e) => this.setState({ addTag: e.target.value })} />
                            </label>
                            <label>备注信息
                                <textarea placeholder='Detail' type='text' value={this.state.addRemark} onChange={(e) => this.setState({ addRemark: e.target.value })} />
                            </label>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button className="btn btn-xs btn-default" onClick={this.linkTest.bind(this, this.state.addIP)}>连接测试</Button>
                            <Button className="btn btn-xs  btn-default" onClick={this.props.hide}>取消</Button>
                            <Button className="btn btn-xs btn-primary" onClick={this.addServer.bind(this)}>确认</Button>
                        </Modal.Footer>
                    </form>
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
        )
    }
}
