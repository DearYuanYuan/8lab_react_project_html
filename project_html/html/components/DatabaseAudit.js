import React from "react"
import $ from 'jquery';
import DatabaseAuditHeader from "./databaseAudit/DatabaseAuditHeader";  //此标签页的头部模块
import DatabaseAuditMain from "./databaseAudit/DatabaseAuditMain";      //此标签页的主体部分模块
import WhitelistSetting from "./databaseAudit/WhitelistSetting";        //白名单设置
import BadBehaveSetting from "./databaseAudit/BadBehaveSetting";        //恶意行为设置
import MessageBox from "./Commonality/MessageBox"                       //消息提示框组件

/*数据库审计页面*/
export default class DatabaseAudit extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isShowedWhitelistSetting: false,    //白名单操作窗口是否显示
            listOfIP: [],                       //IP列表
            listOfSQL:[],                       //数据库列表
            currentIP: '',                      //当前ip
            currentSQL:'',                      //当前数据库
            keyword: null,                      //搜索关键字
            last_update_time: null,             //最近一次更新状态的时间
            logsDetailList: [],                 //审计日志列表
            pageCount: 0,                       //审计日志的页数
            totalLogsCount:0,                   //审计日志总条数
            currentPage: 1,                     //审计日志的当前页码
            time_status_days: null,             //系统正常运行的时间的天数
            time_status_hours: null,            //系统正常运行的时间的小时数
            time_status_minutes: null,          //系统正常运行的时间的分钟数
            showMsgBox:false,                   //不显示消息提示框
            msgContent:'',                      //提示框的提示消息
            msgButtonState:false,               //提示框中的按钮状态
            msgButtonName:"",                   //提示框中的按钮名称
            isShowedBadBehaveSetting:false,     //恶意行为弹出框
        }
        this.rowsPerPage = 10                   //审计日志列表每页最多显示条数
    }
    componentDidMount(){
        //修改页面title
        document.title = '数据库可信审计'
    }
    /**
     * 在组件渲染之前执行的操作
     */
    componentWillMount() {
        this.getIPListAjax();                  //获取IP列表,并根据第一个ip，发起页面请求，获取相应的日志等数据
    }

    /**
     * 子组件DatabaseAuditHeader中'当前IP'变化的事件监听器
     * 此方法通过props传递到子组件DatabaseAuditHeader中
     * @param {*} newIP 新的审计IP
     */
    onChangeIP(newIP) {
        this.setState({                         //更新当前ip
            currentIP: newIP
        });
        // console.log(newIP)
        //此处添加ajax请求，切换ip同时更换数据库列表
        this.getDataAjax(this.state.keyword, 1, newIP, this.state.currentSQL); //根据当前IP等参数重新获取审计数据，日志回到列表第一页
    }
    onChangeSQL(newSQL) {
        this.setState({                         //更新当前数据库
            currentSQL: newSQL
        });
        // console.log(newSQL)
        this.getDataAjax(this.state.keyword, 1, this.state.currentIP,newSQL);
    }
    //////////////////////////////审计日志模块//////////////////////////////////////////////

    /**
     * 通过props将此方法传递到DatabaseAuditLogs组件中,
     * 作为安关键字搜索日志的按钮的onClick事件监听器
     */
    searchByKeyword() {
        var logsKeyword = $('#auditlogs-keyword').val()     //获取当前输入的关键字
        this.setState({                         //获取审计日志的关键字输入框中的内容,并更新state
            keyword:logsKeyword
        })
        this.getDataAjax(logsKeyword, 1, this.state.currentIP,this.state.currentSQL); //根据当前IP等参数重新获取审计数据，日志回到列表第一页
    }

    /**
     * 审计日志下一页时的操作
     * @param {*} eventkey 
     */
    handleSelectLogsPage(eventkey){
        this.setState({                         //更新当前页码
            currentPage:eventkey                
        })
        this.getDataAjax(this.state.keyword, eventkey, this.state.currentIP,this.state.currentSQL);
    }

    /**
     * 点击跳转按钮时的操作.
     * 根据输入的页码.更新审计日志
     */
    handleJumpPage(){        
        var pageIndex = parseInt($('#auditLogsPage').val()) || 1    //如果没有输入页码则默认为第一页
        this.setState({                         //获取审计日志的页码输入框中的内容,并设置为当前页码
            currentPage: pageIndex
        })
        $('#auditLogsPage').val('')     //清空页码输入框
        this.getDataAjax(this.state.keyword, pageIndex, this.state.currentIP,this.state.currentSQL);  //根据当前IP等参数重新获取审计数据
    }
    
    /**
     * 设置列表每页最多显示行数
     * @param {int} num 行数 
     */
    setRowsPerPage(num) {
        this.rowsPerPage = num
        this.getDataAjax(this.state.keyword, 1, this.state.currentIP,this.state.currentSQL);  //根据当前IP等参数重新获取审计数据
    }

    //备份审计日志
    backupLogs(){
        var self = this
        $.ajax({
            url: '/api/copyDoubleAjax/',
            type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: {                         //表单数据
                type:"1",
                ip: self.state.currentIP
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            success: function () {
                self.setState({     //显示提示消息
                    showMsgBox:true,
                    msgContent:'审计日志备份成功！',
                    msgButtonState:true,
                    msgButtonName:'确认',
                });    
            },
            error:function(){
                self.setState({     //显示提示消息
                    showMsgBox:true,
                    msgContent:'审计日志备份失败！',
                    msgButtonState:true,
                    msgButtonName:'确认',
                });
            }
        })
    }

    /**
     * 导出审计日志
     */
    exportLogs(){
        var self=this
        $.ajax({
            url: '/api/copyDoubleAjax/',
            type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: {                         //表单数据
                type:"2",                   //type为2表示导出日志;1表示为备份日志
                ip: self.state.currentIP
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            success: function (data) {
                self.setState({     //显示提示消息
                    showMsgBox:true,
                    msgContent:'审计日志已成功导出到: '+data.path,    //显示导出路径
                    msgButtonState:true,    
                    msgButtonName:'确认',
                });
            },
            error: function(){
                self.setState({     //显示提示消息
                    showMsgBox:true,
                    msgContent:'审计日志导出失败！',
                    msgButtonState:true,
                    msgButtonName:'确认',
                });
            }
        })
    }

    //////////////////////////////////白名单窗口//////////////////////////////////////////////

    /**
     * 显示白名单操作窗口
     * @param {*} e 事件
     */
    showWhitelistSetting(e) {
        this.setState({         //更新 state,显示白名单操作窗口
            isShowedWhitelistSetting: true
        })
        $('.list-user-name input').prop("checked",false)        //将白名单用户列表中的所有复选框恢复未选中的状态
        $('.list-user-action input').prop("checked",false)      //将白名单行为列表中的所有复选框恢复未选中的状态
        $('#add-white-user').val('')                         //清空白名单用户输入框
        $('#add-white-action').val('')                       //清空白名单行为输入框 
        e.preventDefault();       //通知 Web 浏览器不要执行与事件关联的默认动作
        e.stopPropagation();     //停止事件的传播，阻止它被分派到其他 Document 节点
    }
    /**
     * 显示恶意行为操作窗口
     * @param {*} e 事件
     */
    showBadBehaveSetting(e) {
        this.setState({         //更新 state,显示白名单操作窗口
            isShowedBadBehaveSetting: true
        })
        $('.list-user-action input').prop("checked",false)      //将白名单行为列表中的所有复选框恢复未选中的状态
        $('#add-badBehave-action').val('')                       //清空白名单行为输入框
        e.preventDefault();       //通知 Web 浏览器不要执行与事件关联的默认动作
        e.stopPropagation();     //停止事件的传播，阻止它被分派到其他 Document 节点
    }
    /**
     * 隐藏白名单操作窗口
     * @param {*} e 事件
     */
    hideWhitelistSetting(e) {
        this.setState({
            isShowedWhitelistSetting: false,
            isShowedBadBehaveSetting: false,
        })      //更新 state,隐藏恶意行为操作窗口
        e.stopPropagation();
    }

    //////////////////////////////Ajax请求//////////////////////////////////////////////

    /**
     * 获取IP列表,并根据第一个ip，发起页面请求，获取相应的日志等数据
     */
    getIPListAjax() {
        var self = this;
        $.ajax({
            url: '/api/shenjiIPList/',
            type: 'GET',
            dataType: 'json',
            cache: false,                   //不会从浏览器缓存中加载请求信息
            success: function (data) {                
                //得到了当前的IP之后,再发送请求获取对应IP的数据库审计的数据
                if(data.ip){
                    self.setState({
                        listOfIP: data.ip,      //获取IP列表
                        currentIP: data.ip[0],  //当前ip默认为列表第一个IP
                    });
                    //获取对应IP的数据库审计的数据，日志回到列表第一页
                    self.getDataAjax(self.state.keyword, 1, data.ip[0]);
                }
            }
        })
    }
    /**
     * 根据关键字,页码和当前 ip 获取数据库审计的数据.
     * @param {*} keyword 关键字
     * @param {*} page 页码
     * @param {*} shenji_ip 当前的审计IP
     */
    getDataAjax(keyword, page, shenji_ip, dbType) {
        var self = this; 
        var logsdate= $('.datepicker .form-control').val()       
        $.ajax({
            url: '/api/shenji/status/',
            type: 'POST',                   //POST方式时,表单数据作为 HTTP 消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为 URL 地址的参数进行传递
            data: {                         //表单数据
                keyword: keyword,           //搜索的关键字
                page: page,                 //审计日志的页码
                size: self.rowsPerPage,     //每页最多条数
                shenji_ip: shenji_ip,        //审计IP
                db_type:dbType,
                logsDate: logsdate   //日期
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            success: function (data) {
                // console.log(JSON.stringify((data.db_types[0])));
                self.setState({
                    logsDetailList: data.content,                   //审计日志的内容                 
                    pageCount: data.page,                           //审计日志的页数
                    currentPage: page,                    //当前日志的页码
                    totalLogsCount: data.page * self.rowsPerPage,    //当前数据总数
                    listOfSQL: data.db_types,      //获取数据库列表
                    currentSQL: data.db_types.indexOf(dbType)!= -1 ? dbType :data.db_types[0],   //当前数据库默认为列表第一个数据库
                    last_update_time: data.time,                    //审计日志最近一次更新的时间
                    time_status_days: data.time_status && data.time_status.days,        //系统正常运行的时间的天数
                    time_status_hours: data.time_status && data.time_status.hours,      //系统正常运行的的时间的小时数
                    time_status_minutes: data.time_status && data.time_status.minutes,  //系统正常运行的的时间的小时数
                });
            }
        })
    } 

    //////////////////////////////提示信息弹框模块//////////////////////////////////////////////

    /**
     * 消息弹出框的按钮点击事件的监听
     */
    handleConfirmMsgBox(){
        this.setState({     
            showMsgBox:false,
        })
    }

    render() {        
        /* 在子组件中如何改变父组件的值,都是通过 props 把父组件的方法传递到子组件,然后作为某个事件的监听.
        例如,控制'白名单操作'窗口的显示与隐藏的实现过程:
            -通过 props,把父组件的 shoWhitelistSetting(e) 方法传递到子组件<DatabaseAuditHeader>中,
                在子组件中把 this.props.showWhitelistSetting 设置成'白名单操作'按钮的 onClick 事件监听.
                通过这种方法,在子组件中就可以改变父组件的状态了,从而可以让父组件中的<WhitelistSetting>组件显示;
            -在整个标签页的 section 标签中设置 onClick 事件监听,在hideWhitelistSetting方法中实现只要点击的不是白名单操作弹窗,
                就隐藏白名单操作弹窗.            
        */
        return (
            <section className="" >
                <div onClick={this.hideWhitelistSetting.bind(this)}>
                    {/*数据库审计页面的头部*/}
                    <DatabaseAuditHeader
                        showWhitelistSetting={(e) => this.showWhitelistSetting(e)}
                        showBadBehaveSetting={(e) => this.showBadBehaveSetting(e)}
                        onChangeIP={(item) => this.onChangeIP(item)}
                        onChangeSQL={(item) => this.onChangeSQL(item)}
                        listOfIP={this.state.listOfIP}
                        listOfSQL={this.state.listOfSQL}
                        last_update_time={this.state.last_update_time}
                        time_status_days={this.state.time_status_days}
                        time_status_hours={this.state.time_status_hours}
                        time_status_minutes={this.state.time_status_minutes}
                        currentSQL={this.state.currentSQL}
                        currentIP={this.state.currentIP}
                    />
                    {/*数据库审计页面的主体部分*/}
                    <DatabaseAuditMain
                        searchByKeyword={() => this.searchByKeyword()}
                        handleSelectLogsPage={(e) => this.handleSelectLogsPage(e)}
                        handleJumpPage={() => this.handleJumpPage()}
                        totalLogsCount={this.state.totalLogsCount}
                        rowsPerPage={this.rowsPerPage}
                        setRowsPerPage={(e)=>this.setRowsPerPage(e)}
                        pageCount={this.state.pageCount}
                        //当前页面没有日志时，页码为0（此时不显示任何数字）.
                        currentPage={(this.state.pageCount==0&&this.state.currentPage==1)?0:this.state.currentPage}
                        logsDetailList={this.state.logsDetailList}
                        exportLogs={() => this.exportLogs()}
                    />
                </div>
                {/*数据库审计页面的白名单操作的弹窗*/}
                <WhitelistSetting
                    isShowed={this.state.isShowedWhitelistSetting}
                    shenjiIP={this.state.currentIP}
                    shenjiSQL={this.state.currentSQL}
                />
                <BadBehaveSetting
                    isShowed={this.state.isShowedBadBehaveSetting}
                    shenjiIP={this.state.currentIP}
                    shenjiSQL={this.state.currentSQL}
                />
                {/*消息提示框*/}
                <MessageBox
                    showMsgBox = { this.state.showMsgBox }
                    msgContent = { this.state.msgContent }
                    msgButtonState = { this.state.msgButtonState }
                    msgButtonName = { this.state.msgButtonName }
                    handleConfirmMsgBox = { this.handleConfirmMsgBox.bind(this)}
                />                             
            </section>
        )
    }
}

