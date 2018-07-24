/**
 * 
 * 试用版提醒
 * 
 */
import React from "react";
import $ from 'jquery';

/* 首页 */
export default class TrialEdition extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };

    }
    openwin(url) {
        var a = document.createElement("a"); //创建a对象
        a.setAttribute("href", `${window.location.origin}/${url}`);
        a.setAttribute("target", "_blank");
        a.setAttribute("id", "camnpr");
        document.body.appendChild(a);
        a.click(); //执行当前对象
    }
    getInSystem(){
        //修改新窗口的url
        var cookieList = document.cookie.split(';')
        // console.log(cookieList.indexOf('userSystemSetType'))
        if (cookieList.indexOf('userSystemSetType=0') != -1) {
            //用户设置只打开首页
            window.location.href = "/";
        } else if (cookieList.indexOf('userSystemSetType=1') != -1) {
            //用户设置打开5个页面
            window.location.href = "/";
            this.openwin(`targetRange`);
            // setTimeout(function () {
            //     // IE
            //     if (document.all) {
            //         document.getElementById("wave").click();
            //     }
            //     // 其它浏览器
            //     else {
            //         var e = document.createEvent("MouseEvents");
            //         e.initEvent("click", true, true);
            //         document.getElementById("wave").dispatchEvent(e);
            //     }
            // }, 500);
            this.openwin(`3DMap`);
            this.openwin(`infoCenter`);
            this.openwin(`mapAttack`);
        } else {
            window.location.href = "/";
        }
    }
    componentWillMount() {
    
    }
    
    componentDidMount() {


    }

    componentWillUnmount(){

    }
    // 渲染页面
    render() {

        return (
            <div className="TrialEdition"  >
                <div className="TrialEdition-content">
                    <div className="TrialEdition-box">
                        <div className="TrialEdition-msg">
                            <p className="TrialEdition-logo"></p>
                            <h2>试用期结束，<br/>
                                欢迎购买八分量系统正式版</h2>
                            <h3>
                                感谢您对我司产品长期以来的厚爱！如果您对试用版的产品有进一步兴趣，欢迎联系我们购买正式版。
                            </h3>
                            <a href="javascript:void(0)"><i className="fa fa-envelope "></i>info@8lab.cn</a>
                            <a href="javascript:void(0)" className="odd"><i className="fa fa-phone"></i>010-6251-0216</a>

                            <p className="getInSystem" onClick={this.getInSystem.bind(this)}>进入系统</p>
                        </div>


                    </div>
                </div>
            </div>
        )
    }
}

