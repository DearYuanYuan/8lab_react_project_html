import React from "react";
import $ from 'jquery';
/* kibana日志中心*/
export default class InfoCenter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            iframeSrc:''
        }
    };

    /**
     * 控制页面高度
     * 将iframe高度直接设置为body的高度
     * 这里存在跨域的问题
     */

    getIframeSrc(){
        var self = this;
        // 区块链节点数
        $.ajax({
            url: '/api/constants/get_iframe_url/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data:{
              t:'k'
            },
            success: function (data) {
                // console.log(JSON.stringify(data))
                self.setState({
                    iframeSrc:data.url+"/app/kibana#/dashboard/ccdb38a0-b256-11e7-9aef-670f77f9a1b3"    //根据ID显示默认的仪表盘
                })
            }
        })
    }
    handleHeight(){
        parent.document.getElementById("iframe").height=0;
        parent.document.getElementById("iframe").height=document.body.scrollHeight;
        parent.document.getElementById("iframe").width = document.body.scrollWidth - 240 + 16;
    }
    componentWillMount() {
        this.getIframeSrc();
    }
    componentDidMount(){
        //修改页面title
        document.title = '信息中心'
    }
    clearIframe(){
        var frame = document.getElementById("iframe");
        frame.src = 'about:blank';
        //frame.contentWindow.document.write( '');//清空frame的内容
        //frame.contentWindow.document.clear();
        frame.contentWindow.close(); //避免frame内存泄漏
        if ((navigator.userAgent.indexOf('MSIE') || navigator.userAgent.indexOf('rv:11.0')) >= 0) {
            if (CollectGarbage) {
                CollectGarbage(); //IE 特有 释放内存
                //删除原有标记
                var tags = document.getElementById("ifrSet");
                tags.removeChild(frame);
                //添加frameset框架
                var _frame = document.createElement('frame');
                tags.appendChild(_frame);
            }
        }
    }
    componentWillUnmount(){
        this.clearIframe()
    }
    render() {
        return (
            <div className="bigData databaseCover" id="ifrSet">
                <iframe id="iframe"
                    frameBorder='0' marginHeight='0' marginWidth='0' scrolling='auto'
                    src={this.state.iframeSrc}
                    onLoad = {this.handleHeight.bind(this)}
                ></iframe>
            </div>
        )
    }
}