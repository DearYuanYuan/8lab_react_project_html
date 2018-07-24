import React from "react"
import $ from "jquery";
import {Pagination} from 'react-bootstrap'; //引入 react-bootstrap 组件

/*WAF页面中的设置弹框组件*/
export default class WafBoxSet extends React.Component{
    constructor(props) {
        super(props);
        this.state={
            setHttp:true,//http防御
            setDDos:true,//doos防御
            setWeb:true,//web防御
            setSensitive:true,//敏感数据防御
            setApplication:true,//应用程序监测
            currentDefensePage:1,//防御设置日志当前页
            defensePageAll:1,//防御设置日志页总数
            searchContent:'',//防御设置搜索关键字
            showMsgBox:false,//不显示ajax加载提示框
            msgContent:'正在请求',//ajax请求弹框信息
            msgButtonState:false,//ajax请求弹框按钮状态
            msgButtonName:"请稍后...",//ajax请求按钮button提示内容
            defenseListData: //ajax请求主机防御数据
            {"currentPage":1,"content":[{}],"allPage":1}//防御设置列表
        }
    }

    /**
     * 页面加载,请求防御设置开关状态
     */
    stateAjax() {
        var self = this;
        $.ajax({
            url:'/api/wf/waf_rule_status',
            type:'POST',
            dataType:'json',
            cache:false,
            success: function (data) {//发送成功
                self.setState({
                    setHttp:data.http=='on'?true:false,//http防御
                    setDDos:data.dos=='on'?true:false,//doos防御
                    setWeb:data.web=='on'?true:false,//web防御
                    setSensitive:data.dataTrack=='on'?true:false,//敏感数据防御
                    setApplication:data.errorCheck=='on'?true:false//应用程序监测
                })
            }
        });
    }

    /**
     * 获取防御日志列表
     * @param {*} keyword 关键字
     * @param {*} page 页码
     */
    waf_SettingsAjax(keyword, page) {
        var self = this;
        $.ajax({
            url: "/api/wf/clientList",
            type: 'POST',
            dataType: 'json',
            data: {
                keyword: keyword,
                page:page,
                size:6
            },
            error:function(){
                // self.setState({
                //     isSettingLoad:false,isSettingError:true
                // });
            },
            cache: false,
            success: function (data) {
                self.setState({
                    currentDefensePage:data.currentPage,//设置WAF高级设置当前页数
                    defenseListData:data,
                    defensePageAll:data.allPage//设置总页数
                });
            }
        })
    }

    /**
     * 操作主机防御设置，需传入服务器名称，ip，选中的按钮，发送选中的状态
     * @param {*} name 服务器名称
     * @param {*} ip ip
     * @param {*} option 选中的按钮对应的类型
     * @param {*} state 选中的状态
     * @param {*} event 事件
     * @param {*} i 索引
     */
    sendSettingIconAjax(name,ip,option,state,event,i){
        var self=this;
        $.ajax({
            url: '/api/wf/switch_status/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data: {
                name: name,//发送服务器名称
                ip: ip, //发送IP名称
                option:option, //送选中哪个按钮
                switch:state //发送选中哪个按钮的状态
            }, 
            error: function () {//发送错误
                // self.setState({loading_wafmodal:true, open_waflog:"请检查您当前的网络状态!"});
                // alert('请检查您当前的网络状态!')
                /**/
                self.setState({
                        showMsgBox:true,
                        msgContent:'请检查您当前的网络状态!',
                        msgButtonState:true,
                        msgButtonName:'确定'
                    })
                
            },
            success:function (data) {
                var code=data.code;
                // 按钮禁用点击
               $(event).attr("disabled","true")
               self.waf_SettingsAjax("",1);//获取页面防御内容数据
                // code==200则轮询
                if(code==200){
                    // alert('ok')
                    /**/
                    self.setState({
                        showMsgBox:true,
                        msgContent:'请求成功',
                        msgButtonState:true,
                        msgButtonName:'确定'
                    })
                    
                    $(event).removeAttr("disabled").toggleClass('selectBtnSet'+i)
                }
                
                // code==201 请求失败！
                if(code==201){
                    // alert('请求失败')
                    /**/
                    self.setState({
                        showMsgBox:true,
                        msgContent:'请求失败',
                        msgButtonState:true,
                        msgButtonName:'确定'
                    })
                    
                    $(event).removeAttr("disabled")
                }
                // code==202 请求成功
                if(code==202){
                    // alert('请求成功')
                    /**/
                    self.setState({
                        showMsgBox:true,
                        msgContent:'请求成功',
                        msgButtonState:true,
                        msgButtonName:'确定'
                    })
                    
                    $(event).removeAttr("disabled")
                }
            }
        })
    }

    /**
     * waf防御设置总开关获取各个防御的状态
     * @param {*} option 选中的按钮类型
     * @param {*} status 按钮状态
     * @param {*} e 按钮元素
     */
    sendManageSetAjax(option,status,e){
        var self = this;
         $.ajax({
            url: '/api/wf/switch_whole_status/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data: {
                option: option,//发送选中哪个按钮
                switch: status//发送按钮状态
            },
            error: function () {//发送错误
                self.setState({
                        showMsgBox:true,
                        msgContent:'请检查您当前的网络状态!',
                        msgButtonState:true,
                        msgButtonName:'确定'
                    })
            },
            success: function (data) {//发送成功
                //console.log(JSON.stringify(data))
                // 状态为201:操作失败
                if(data.code=="201"){
                    self.setState({
                        showMsgBox:true,
                        msgContent:'操作失败',
                        msgButtonState:true,
                        msgButtonName:'确定'
                    })
                    // 给按钮设置交互,后台返回结果,给UI一个明确的表现
                    $(e).removeClass('setOpacityUi')
                }
                // 状态为202:关闭成功
                if(data.code==202){
                   if (option == 'http') {
                        self.setState({
                            setHttp: !self.state.setHttp
                        })
                    }
                    /**
                     * 暂时隐藏其他四种防御
                    if (option == "web") {
                        self.setState({
                            setWeb: !self.state.setWeb
                        })
                    }
                    if (option == "dos") {
                        self.setState({
                            setDDos: !self.state.setDDos
                        })
                    }
                    if (option == "dataTrack") {
                        self.setState({
                            setSensitive: !self.state.setSensitive
                        })
                    }
                    if (option == "errorCheck") {
                        self.setState({
                            setApplication: !self.state.setApplication
                        })
                    }
                     */
                    
                    // 给按钮设置交互,后台返回结果,给UI一个明确的表现
                    $(e).removeClass('setOpacityUi')
                    // alert('close')
                }
                //状态为200：打开成功
                if(data.code==200){

                   if (option == 'http') {
                        self.setState({
                            setHttp: !self.state.setHttp
                        })
                    }
                    /**
                     * 暂时隐藏其他四种防御
                    if (option == "web") {
                        self.setState({
                            setWeb: !self.state.setWeb
                        })
                    }
                    if (option == "dos") {
                        self.setState({
                            setDDos: !self.state.setDDos
                        })
                    }
                    if (option == "dataTrack") {
                        self.setState({
                            setSensitive: !self.state.setSensitive
                        })
                    }
                    if (option == "errorCheck") {
                        self.setState({
                            setApplication: !self.state.setApplication
                        })
                    }
                     */
                    
                    // 给按钮设置交互,后台返回结果,给UI一个明确的表现
                    $(e).removeClass('setOpacityUi')
                    // alert('open')
                }
            }
        });
    }

    /**
     * 点击防御icon开关时的操作
     * @param {*} index icon索引
     * @param {*} name 名称
     * @param {*} ip ip
     * @param {*} state 模式
     * @param {*} i 
     */
    handelToggleHttp(index,name,ip,state,i){
        // 点击防御icon开关，发送请求
        /**
         * on == defense
         * off == alarm
         */
        var onState
        if(state=='defense'){
            onState = 'alarm'
        }else{
            onState = 'defense'
        }
        /**/
        // console.log(state)
        // 请求ajax后，加载模态框
        this.setState({     //显示消息提示框
            showMsgBox:true,
            msgContent:'正在请求...',
            msgButtonState:false,
            msgButtonName:'请稍后...'
        })
        // 获取请求的类型和请求的icon
        var option = $('.checkBtnIcon').eq(index).find('button').eq(i).attr("name");
        var event = $('.checkBtnIcon').eq(index).find('button').eq(i);
        this.sendSettingIconAjax(name,ip,option,onState,event,i)
    }

    /**
     * http防御按钮
     * @param {*} e 事件
     */
    setHttp(e){
        // 给按钮设置交互,后台未返回结果,给UI一个明确的表现
        $(e.target).addClass('setOpacityUi')
        this.sendManageSetAjax('http',!this.state.setHttp?'on':'off',$(e.target));
    }
    /**
     * DoS攻击防护按钮
     * @param {*} e 事件
     */
    setDDos(e){
        // 给按钮设置交互,后台未返回结果,给UI一个明确的表现
         $(e.target).addClass('setOpacityUi')
        this.sendManageSetAjax('dos',!this.state.setDDos?'on':'off',$(e.target));
    }
    /**
     * web攻击防护按钮
     * @param {*} e 事件
     */
    setWeb(e){
        // 给按钮设置交互,后台未返回结果,给UI一个明确的表现
        $(e.target).addClass('setOpacityUi')
        this.sendManageSetAjax('web',!this.state.setWeb?'on':'off',$(e.target));
    }
    /**
     * 敏感数据防御按钮
     * @param {*} e 事件
     */
    setSensitive(e){
        // 给按钮设置交互,后台未返回结果,给UI一个明确的表现
        $(e.target).addClass('setOpacityUi')
        this.sendManageSetAjax('dataTrack',!this.state.setSensitive?'on':'off',$(e.target));
    }
    /**
     * 应用程序监测按钮
     * @param {*} e 事件
     */
    setApplication(e){
        // 给按钮设置交互,后台未返回结果,给UI一个明确的表现
        $(e.target).addClass('setOpacityUi')
        this.sendManageSetAjax('errorCheck',!this.state.setApplication?'on':'off',$(e.target));
    }
    /**
     * 防御设置日志列表选择页码时的操作
     * @param {*} eKey 新的页码
     */
    handleDefensePage(eKey){
        // 防御设置日志列表,分页点击,发送ajax
        this.setState({
            currentDefensePage:eKey
        })
        this.waf_SettingsAjax("",eKey)
    }
    /**
     *  防御设置搜索输入框失去焦点时的操作
     * @param {*} e 事件
     */
    handleSerachFor(e){
        // 防御设置搜索input失去焦点时,搜索关键字更新
        this.setState({
            searchContent:$(e.target).val()
        })  
    }
    /**
     * 防御设置搜索按钮点击事件的监听
     */
    handleDefenseSearch(){
        // 防御设置搜索按钮点击,触发ajax,搜索关键字
        // if($('#serachContent').val()==''){
        //     this.setState({
        //         showMsgBox:true,
        //         msgContent:'请输入关键字',
        //         msgButtonState:true,
        //         msgButtonName:'确定'
        //     })
        //     return;
        // }
        this.waf_SettingsAjax(this.state.searchContent, 1)
    }

    /**
     * 防御设置中搜索服务器输入框中的按键事件监听
     * @param {*} e 事件
     */
    handleEnterFor(e){
        // 防御设置input,当enter键触发,发送ajax
        if(e.keyCode==13){
            this.waf_SettingsAjax($(e.target).val(), 1)
        }
    }
    /**
     * 消息提示弹窗中的确定按钮的点击事件监听
     */
    handleConfirmMsgBox(){
        // 与子组件的弹框 message 通信，点击message中的按钮确定时，控制子组件message的隐藏
        this.setState({
            showMsgBox:false
        })
    }
    /**
     * 组件即将加载时的操作
     */
    componentWillMount(){
        this.stateAjax() ;//获取页面防御开关状态        
        this.waf_SettingsAjax("",1);//获取页面防御内容数据
    }

    render(){
        return (
            <div className={this.props.showBox?'boxPagePart':'hide boxPagePart'}>
            <div className="setBoxCover">
                <h3>防护设置</h3>
                {/*
                <h4>扫描选项</h4>
                <ul>    
                    <li>http防御 <a className={this.state.setHttp?'setProtect':'setProtect setOpen'} onClick = {this.setHttp.bind(this)}></a></li>
                    <li>Dos攻击防护 <a className={this.state.setDDos?'setProtect':'setProtect setOpen'} onClick = {this.setDDos.bind(this)}></a></li>
                    <li>web攻击防护 <a className={this.state.setWeb?'setProtect':'setProtect setOpen'} onClick = {this.setWeb.bind(this)}></a></li>
                    <li>敏感数据追踪 <a className={this.state.setSensitive?'setProtect':'setProtect setOpen'} onClick = {this.setSensitive.bind(this)}></a></li>
                    <li>应用程序鉴定和检测 <a className={this.state.setApplication?'setProtect':'setProtect setOpen'} onClick = {this.setApplication.bind(this)}></a></li>
                </ul>
                */}
                <h4>高级设置</h4>
                <div className="boxSearch">
                    <input type="text" placeholder="搜索服务器" id="serachContent" onBlur={this.handleSerachFor.bind(this)} onKeyUp={this.handleEnterFor.bind(this)}/>
                    <button id="searchContentFor" onClick={this.handleDefenseSearch.bind(this)}>搜索</button>
                </div>
            </div>
               
                <table>
                    <thead>
                        <tr>
                            <td>服务器(主机名)</td>
                            <td>IP</td>
                            <td>设置防御类型</td>
                        </tr>
                    </thead>
                    <tbody>
                       {

                           this.state.defenseListData.content && this.state.defenseListData.content.map(function(content,index){
                              return (
                                  <tr key={index}>
                                        <td>{content.name}</td>
                                        <td>{content.ip}</td>  
                                        <td className="checkBtnIcon">
                                            <button className={content.whole=='defense'?'selectHttpBtn selectBtnSet0':'selectHttpBtn'} name="whole"  onClick={this.handelToggleHttp.bind(this,index,content.name,content.ip,content.whole,0)} title="http防御"></button>
                                            {   /*暂时只有总开关，分开关接口无*/   
                                            /*
                                            <button className={content.web=='on'?'selectWebBtn selectBtnSet1':'selectWebBtn'} name="web" onClick={this.handelToggleHttp.bind(this,index,content.name,content.ip,content.web,1)} title="web防御"></button>
                                            <button className={content.dos=='on'?'selectDosBtn selectBtnSet2':'selectDosBtn'} name="dos" onClick={this.handelToggleHttp.bind(this,index,content.name,content.ip,content.dos,2)} title="dos防御"></button>
                                            <button className={content.dataTrack=='on'?'selectDataBtn selectBtnSet3':'selectDataBtn'} name="dataTrack" onClick={this.handelToggleHttp.bind(this,index,content.name,content.ip,content.dataTrack,3)} title="敏感数据"></button>
                                            <button className={content.errorCheck=='on'?'selectErrorBtn selectBtnSet4':'selectErrorBtn'} name="errorCheck" onClick={this.handelToggleHttp.bind(this,index,content.name,content.ip,content.errorCheck,4)} title="错误检测"></button>
                                            */}
                                        </td>
                                    </tr>
                              )
                       }.bind(this))
                       
                    }
                    </tbody>
                </table>
                <div className="pagination-all">
                    <Pagination prev={true} next={true} first={false} last={false} ellipsis={true} boundaryLinks={true} items={this.state.defensePageAll} maxButtons={1} activePage={this.state.currentDefensePage} onSelect={this.handleDefensePage.bind(this)}/>
                </div>
                <MessageBox
                    showMsgBox = { this.state.showMsgBox }
                    msgContent = { this.state.msgContent }
                    msgButtonState = { this.state.msgButtonState }
                    msgButtonName = { this.state.msgButtonName }
                    handleConfirmMsgBox = { this.handleConfirmMsgBox.bind(this) }
                />
                
            </div>
        )
    }
}


/*向外暴露提示消息弹窗组件.
包含提示信息,和一个按钮.
使用示例:
<MessageBox
showMsgBox = {true}                 //是否显示消息框
msgContent = {"请输入正确的关键字"}    //提示信息
msgButtonState = {true}             //按钮是否可点击
msgButtonName = {"确定"}             //按钮的名称
handleConfirmMsgBox = { this.handleConfirmMsgBox.bind(this,fasle) } //点击按钮事件的监听
/>
*/
class MessageBox extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidUpdate(){
        //如果此消息提示框已显示，并且当前页面获取焦点的是一个文本输入框，则让这个输入框失去焦点
        if(this.props.showMsgBox && $(':focus').length!=0 && $(':focus')[0].tagName=="INPUT" && $(':focus').prop('type')=="text"){
            $(':focus').blur()
        }    
    }

    render(){
        return (
            /*根据 this.props.showMsgBox ,控制消息弹窗的显示与隐藏.*/
        <div className={this.props.showMsgBox?"messageBox-container":"hide messageBox-container"} style={{position:'absolute'}}>
            <div className="messageBox">
                <div className="msgContent">
                    {/*提示信息.当提示信息为'正在请求时,使用 LoadingText 组件代替提示信息.*/}
                    {this.props.msgContent==='正在请求...'? <LoadingTexts /> :this.props.msgContent}
                </div>
                <button 
                    //根据提示信息,改变按钮的状态:禁用,或可点击.
                    className={this.props.msgButtonState?"btnOkMsgBox btnMsgBox":"btnMsgBox"}
                    disabled={!this.props.msgButtonState?true:false}
                    /*点击确认按钮时,调用父组件的 handleConfirmMsgBox 方法,通过bind传参,改变父组件的 state, 从而隐藏消息弹窗*/
                    onClick={this.props.handleConfirmMsgBox.bind(this)}
                    >   
                    {/*按钮的名称*/}
                    {this.props.msgButtonName}
                </button>
            </div>
        </div>
        )
    }
}


class LoadingTexts  extends  React.Component{

    constructor(props){
        super(props);
    }


    render(){
        return(

                <div className="loadingText" style={{margin:"0"}}>
                   <span> 正在请求&nbsp;&nbsp;</span>
                    <div className="bounce1"></div>
                    <div className="bounce2"></div>
                    <div className="bounce3"></div>
                </div>

        )
    }
}