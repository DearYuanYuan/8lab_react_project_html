import React from "react";                      //react
import {Link} from "react-router-dom"
import { Modal } from "react-bootstrap";        //Modal组件
// import DMap from "./DMap";                      //加载地图组件
import DMapScore from "./DMapScore";          　//加载分数组件

//3d地图的弹框
export default class DMapModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            //首次加载时加入webGL支持的情况
            //showMap: props.showMap&&this.webgl_detect(), //用于控制地图弹出页
            //showInfo:props.showMap&&!this.webgl_detect()//用于控制webGL不支持的弹出页
            showMap: false,                  //地图组件 默认不显示
            showInfo: false                  //浏览器不支持3D地图消息提示 默认不显示
        }
    }

   
    /**
     * 点击时判断是否支持webGL
     * 支持:显示地图组件
     * 不支持:显示提示消息
     * @memberof DMapModal
     */
    // showMap() {
    //     if (!this.webgl_detect()) {
    //         this.setState({ showMap: true });
    //     } else {
    //         this.setState({ showInfo: true });
    //     }
    // }

    /**
     * 检测浏览器是否全屏，全屏时退出全屏,目前没有使用
     * @memberof DMapModal
     */
    exitFullScreen() {
        var el = document,
            cfs = el.cancelFullScreen || el.webkitCancelFullScreen || el.mozCancelFullScreen || el.exitFullScreen,
            wscript;
        if (typeof cfs != "undefined" && cfs) {
            cfs.call(el);
            return;
        }
        if (typeof window.ActiveXObject != "undefined") {
            wscript = new ActiveXObject("WScript.Shell");
            wscript.SendKeys("{F11}");
        }
    }

    /**
     * 隐藏地图模块 
     * 将showMap和showInfo的state状态改变为false
     * @memberof DMapModal
     */
    hideMapModal() {
        this.exitFullScreen();              //如果没有退出全屏,退出全屏
        this.setState({ showMap: false });
    }

    /**
     * 关闭提示消息
     * @memberof DMapModal
     */
    hideInfo() {
        this.setState({ showInfo: false });
    }

    /**
     *  检测是否支持webGL
     * @param {any} return_context 
     * @returns true 支持
     *          false 不支持
     * @memberof DMapModal
     */
    webgl_detect(return_context) {
        if (!window.WebGLRenderingContext) { //如果null/undefined/0/""/等值
            return false    // WebGL not supported`
        }
        var canvas = document.createElement("canvas"),
            names = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"],
            context;

        for (var i = 0; i < names.length; i++) {
            // try {
            context = canvas.getContext(names[i]);
            if (context && typeof context.getParameter == "function") {
                // WebGL is enabled
                if (return_context) {
                    // return WebGL object if the function's argument is present
                    return { name: names[i], gl: context };
                }
                // else, return just true
                return true;
            }
            // } catch (e) { }
        }
        //WebGL is supported, but disabled
        return false;
    }

    // 渲染页面
    render() {
        return (
            <div className="mapContainer">
                {/*3D地球弹窗的入口*/}
                {
                    this.webgl_detect()?
                    <div id="open_map" onClick={()=> this.setState({showMap:true})}>
                        <Link to="/3DMap"><DMapScore /></Link>
                    </div>:
                    <div id="open_map" onClick={()=> this.setState({showInfo:true})}>
                        <DMapScore />
                    </div>
                }
                {/*3d地图显示窗口
                {
                    this.state.showMap &&
                    <Modal
                        id="dmap"
                        animation={false}
                        show={this.state.showMap}
                        onHide={this.hideMapModal.bind(this)}
                        backdrop="static">  
                        {memory == 0 ?
                            <Modal.Header closeButton >
                            </Modal.Header> :
                            <Modal.Header>
                            </Modal.Header>
                        }
                        <Modal.Body>
                            <DMap />
                        </Modal.Body>
                    </Modal>
                }
                */}
                {/*3d地图无法正常显示时的提示信息窗口*/}
                <Modal
                    id="dmap-notSupport"
                    animation={false}
                    show={this.state.showInfo}
                    onHide={this.hideInfo.bind(this)}
                    backdrop="static">
                    <Modal.Header closeButton >
                        <Modal.Title id="contained-modal-title-sm">温馨提示</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>当前环境不支持webGL或者webGL被禁用，无法显示3d地图，请更换环境体验(升级使用最新的浏览器Chrome，或者检查显卡驱动)。详情：<a>https://browserleaks.com/webgl#howto-detect-webgl</a></p>
                    </Modal.Body>
                </Modal>
            </div>
        );
    }
}
