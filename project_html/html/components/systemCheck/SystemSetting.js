
import React from "react";                                  //引入react
import { Modal, Button } from 'react-bootstrap';
import { isUrl } from "../../utils/utils";　　　             //引入用到的工具函数
import DropdownList from "../Commonality/DropdownList";     //下拉列表的组件
import MessageBox from "../Commonality/MessageBox"          //消息提示框组件

export default class SystemSetting extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            //提示框
            showMsgBox: false,                   //不显示消息提示框
            msgContent: '',                      //提示框的提示消息
            msgButtonState: false,               //提示框中的按钮状态
            msgButtonName: "",                   //提示框中的按钮名称
        }
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
    * 根据获取到的数据进行页面渲染
    * @param {any} data 扫描设置的具体渲染样式
    * @memberof scanSetting
    */
    get_basic_setting(data) {
        $("#second_one").prop("checked", data.pe); //修改是否被选中,下同
        $("#second_two").prop("checked", data.elf);
        $("#second_third").prop("checked", data.ole2);
        $("#second_four").prop("checked", data.pdf);
        $("#second_five").prop("checked", data.swf);
        $("#second_six").prop("checked", data.html);
        $("#second_seven").prop("checked", data.xmldocs);
        $("#second_eight").prop("checked", data.hwp3);
        $("#second_ninth").prop("checked", data.archive);
        $("#second_ten").prop("checked", data.mail);
        $("#third_one").prop("checked", data.setup_update);//修改是否被选中,
        $("#third_two").val(data.per_frequency);
        $(".scanPath").val(data.scanPath);
    }

    //获取扫描设置的具体设置
    scanSetting() {
        var self = this;
        $.ajax({
            url: '/api/get_scan_config/',
            type: 'post',
            dataType: 'json',
            enctype: "multipart/form-data",
            cache: false,
            success: function (data) {
                self.get_basic_setting(data)
            },
        })
    }

    //扫描设置表单提交
    formSubmit() {
        var self = this;
        var second_one = $("#second_one").is(':checked');
        var second_two = $("#second_two").is(':checked');
        var second_three = $("#second_third").is(':checked');
        var second_four = $("#second_four").is(':checked');
        var second_five = $("#second_five").is(':checked');
        var second_six = $("#second_six").is(':checked');
        var second_seven = $("#second_seven").is(':checked');
        var second_eight = $("#second_eight").is(':checked');
        var second_ninth = $("#second_ninth").is(':checked');
        var second_ten = $("#second_ten").is(':checked');
        var third_one = $("#third_one").is(':checked');
        var third_two = $("#third_two").val();
        var scanPath = $('.scanPath').val()
        //打包成json格式
        var msg = {
            host_ip: "127.0.0.1",
            config: {
                pe: second_one,
                elf: second_two,
                ole2: second_three,
                pdf: second_four,
                swf: second_five,
                html: second_six,
                xmldocs: second_seven,
                hwp3: second_eight,
                archive: second_ninth,
                mail: second_ten,
                setup_update: third_one,
                per_frequency: third_two,
                scanPath: scanPath
            }
        };
        var config = JSON.stringify(msg);
        $.ajax({
            url: "/api/set_scan_config/",
            type: 'POST',
            dataType: 'json',
            data: { config },
            beforeSend: function () {
                if (scanPath != '' && !isUrl(scanPath)) {
                    self.setState({
                        showMsgBox: true,
                        msgContent: '请输入正确的扫描路径',
                        msgButtonState: true,
                        msgButtonName: '确定'
                    });
                    return false;
                }
            },
            error: function () {//发送错误
                self.setState({
                    showMsgBox: true,
                    msgContent: '杀毒设置失败',
                    msgButtonState: true,
                    msgButtonName: '确定'
                });
            },
            success: function () {//发送成功
                self.props.hide();
            }
        });
    }

    componentWillMount() {
        this.scanSetting();
    }

    render() {
        var searchRange = [{
            name: "小时",   //显示在列表中的项
            value: -1      //选中时传递的值
        }, {
            name: "分钟",
            value: 0
        }, {
            name: "秒",
            value: 1
        }];
        return (
            <div>
                <Modal id="scan-setting" bsSize="lg" aria-labelledby="contained-modal-title-sm" show={this.props.show}
                    onHide={this.props.hide}
                >
                    <Modal.Header closeButton>
                        <Modal.Title >扫描设置</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="noScan" >
                            <div className="scanTitle">不需要扫描的文件格式</div>
                            <div className="noScanList clearfix">
                                <div className="noScanList-item">
                                    <input type="checkbox" id="second_one" className="custom-checkbox"></input>
                                    <label htmlFor="second_one"></label>pe
                                </div>
                                <div className="noScanList-item">
                                    <input type="checkbox" id="second_two" className="custom-checkbox"></input>
                                    <label htmlFor="second_two"></label>elf
                                </div>
                                <div className="noScanList-item">
                                    <input type="checkbox" id="second_three" className="custom-checkbox"></input>
                                    <label htmlFor="second_three"></label>ole2
                                 </div>
                                <div className="noScanList-item">
                                    <input type="checkbox" id="second_four" className="custom-checkbox"></input>
                                    <label htmlFor="second_four"></label>mail
                                 </div>
                                <div className="noScanList-item">
                                    <input type="checkbox" id="second_five" className="custom-checkbox"></input>
                                    <label htmlFor="second_five"></label>pdf
                                </div>
                                <div className="noScanList-item">
                                    <input type="checkbox" id="second_six" className="custom-checkbox"></input>
                                    <label htmlFor="second_six"></label>swf
                                </div>
                                <div className="noScanList-item">
                                    <input type="checkbox" id="second_seven" className="custom-checkbox"></input>
                                    <label htmlFor="second_seven"></label>html
                                </div>
                                <div className="noScanList-item">
                                    <input type="checkbox" id="second_eight" className="custom-checkbox"></input>
                                    <label htmlFor="second_eight"></label>xmldocs
                                </div>
                                <div className="noScanList-item">
                                    <input type="checkbox" id="second_ninth" className="custom-checkbox"></input>
                                    <label htmlFor="second_ninth"></label>hwp3
                                </div>
                                <div className="noScanList-item">
                                    <input type="checkbox" id="second_ten" className="custom-checkbox"></input>
                                    <label htmlFor="second_ten"></label>archive
                                </div>
                            </div>

                            <div className="updateSetting">
                                <div className="scanTitle">更新设置</div>
                                <p><input type="checkbox" id="third_one" className="custom-checkbox" /><label htmlFor="third_one"></label>自动更新病毒库</p>
                                <div className="updateFrequency">自动检查更新频率
                                    <input type="text" className="form-control" id="third_two" placeholder="频率" />
                                    <DropdownList
                                        listID="slect-frequency"
                                        itemsToSelect={searchRange}
                                        itemDefault={searchRange[0]}
                                    // onSelect={(item) => this.onChangeRange(item)}
                                    />
                                </div>
                                <div className="scanTitle">扫描路径设置</div>
                                <input type="text" className="form-control scanPath" />
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className="btn btn-xs  btn-default" onClick={this.props.hide}>取消</Button>
                        <Button className="btn btn-xs btn-primary" onClick={this.formSubmit.bind(this)}>保存设置</Button>
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
        )
    }
}
