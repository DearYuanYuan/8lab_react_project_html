import fetch from "isomorphic-fetch"
import ReactDom from "react-dom"
import _ from "lodash"
import $ from "jquery"

export function request(url, options) {
    var success = arguments[2] ? arguments[2] : function (json) { console.log(json) };
    var error400 = arguments[3] ? arguments[3] : function (json) { console.log(json) };
    var error = arguments[4] ? arguments[4] : function (json) { console.log(json) };
    var failure = arguments[5] ? arguments[5] : function (json) { console.log(json) };
    var defaultoptions = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    }
    _.assignIn(defaultoptions, options);
    return fetch(url, defaultoptions)
        .then(res => {
            if (res.status >= 200 && res.status < 300) {
                // for anything in 200-299 we expect our API to return a JSON response
                res.json().then(json => { return success(json) })
            } else if (res.status === 400) {
                // even for 400 we expect a JSON response with form errors
                res.json().then(json => { return error400(json) })
            } else {
                // For all other errors we are not sure if the response is JSON,
                // so we just want to display a generic error modal
                return error(res)
            }
        }).catch((ex) => { return failure(ex) })
}

// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
Date.prototype.Format = function (fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

//检查组件是否已卸载
export let isMounted = (component) => {
    // exceptions for flow control :(
    try {
        ReactDom.findDOMNode(component);
        return true;
    } catch (e) {
        // Error: Invariant Violation: Component (with keys: props,context,state,refs,_reactInternalInstance) contains `render` method but is not mounted in the DOM
        return false;
    }
}

export let getRandow = (low, high) => {
    return Math.floor(Math.random() * (high - low) + low);
}

//简单的sql语句过滤
export let sqltest = (text) => {
    // console.log(text)
    // console.log("222");
    // var self = this;
    var textval = text.val();
    // console.log(textval);
    // console.log("333")
    const re = /select|update|delete|truncate|join|union|exec|insert|drop|count|'|"|;|>|</i;
    const sqltest = re.test(textval);
    // console.log(sqltest);
    if (sqltest) {
        // console.log("44");
        text.val("");
        // self.setState({
        //   modalBody:"检测到非法字符"
        // });
        // self.changeModal();
        return true;
    }

}
// 简单的xss转码
export let toXss = (inputword) => {
    inputword = inputword.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")//小于号
        .replace(/>/g, "&gt;")//大于号
        .replace(/"/g, "&quot;")//双引号
        .replace(/'/g, "&#x27;")//单引号
        .replace(/\//g, "&#x2f;");//单斜线
    return inputword;
}

//通过绑定使得可以查询定时器是否存在   如果存在清除定时器　返回ｆａｌｓｅ
export let myClearInterval = (interval) => {
    if (interval) clearInterval(interval);
    return false;
}

//获取当前时间
export let currentTime = () => {
    var time = ' ';
    var date = new Date();// 获取当前时间
    var Y = date.getFullYear() + '-';//年
    var M = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1 + '-') : date.getMonth() + 1 + '-';//月
    var D = date.getDate() < 10 ? '0' + (date.getDate() + ' ') : date.getDate() + ' ';//日
    var h = date.getHours() < 10 ? '0' + date.getHours() + ':' : date.getHours() + ':';//时
    var m = date.getMinutes() < 10 ? '0' + date.getMinutes() + ':' : date.getMinutes() + ':';//分
    var s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();//秒
    time += (Y + M + D + h + m + s);
    return time;

}
////////////////////////////////////使用正则表达式验证字符串合法性/////////////////////////////////

//检查输入是否为整数
export let isInt = (n) => {
    var re = /^[0-9]+$/;
    return re.test(n);
}
//文件路径正则验证
export let isUrl = (url) => {
    var winpath = /^[a-zA-Z];[\\/]((?! )(?![^\\/]*\s+[\\/])[\w -]+[\\/])*(?! )(?![^.]+\s+\.)[\w -]+$/; 
    var lnxPath = /^([\/] [\w-]+)*$/; 
    var re = /[a-zA-Z]:(\\([0-9a-zA-Z]+))+|(\/([0-9a-zA-Z]+))+|\//
    return re.test(url);
}
//正则验证：字母开头，包含数字，字母，下划线_，连字符-
export let isName = (name) => {
    var re = /^[A-Za-z][0-9A-Za-z_-]{0,256}$/;
    return re.test(name);
}

//是否符合mysql数据库字段命名规范
//正则验证：包含数字，字母，下划线_，长度0～30
export let isMySQLName = (mySQLname) => {
    var re = /^[0-9A-Za-z_]{0,30}$/;
    return re.test(mySQLname);
}

//文件哈希验证
export let isHash = (hash) => {
    var re = /^[0-9A-Za-z_]{40}$/;
    return re.test(hash);
}

//长度为6-20之间，字母或数字
export let isPassword = (password) => {
    var re = /^[0-9A-Za-z]{6,20}$/;
    return re.test(password);
}

//端口号的正则验证
export let isPort = (port) => {
    var re = /^([0-9]|[1-9]\d|[1-9]\d{2}|[1-9]\d{3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/;
    return re.test(port);
}

//ip地址的正则验证
export let isIP = (ip) => {
    var re = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
    return re.test(ip);
}

/*
* 由于返回有两种形式，故需要判断是否是数组
* 所有与数据库有关的操作，返回均是数组
* 其他情况（如用户登陆信息过期），返回是对象（JSON）
* */
export let isArray = (o) => {
    return Object.prototype.toString.call(o) === '[object Array]';
}


//注册时用户获取uuid作为后台验证唯一凭证
export let getUUID = () => {

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}


export let getParmam = (name) => {
    var after = window.location.hash.split("?")[1];
    if (after) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = after.match(reg);
        if (r != null) {
            return decodeURIComponent(r[2]);
        }
        else {
            return null;
        }
    }
}
