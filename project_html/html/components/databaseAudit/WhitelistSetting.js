/**
 * 数据库审计页面中'白名单操作'按钮的弹出框
 * created by ZHONG Mengting
 * on 2017/04/22
 */
import React from "react";
import $ from "jquery";
import {Form, FormControl, FormGroup, Button, Pagination} from 'react-bootstrap';      //导入react-bootstrap中的部分组件
import {isMySQLName} from "../../utils/utils.js";
import MessageBox from "../Commonality/MessageBox"                       //消息提示框组件

//'白名单操作'按钮的弹出框组件
export default class WhitelistSetting extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isShowing: this.props.isShowed, //白名单操作窗口是否显示
            whitelistIP: [],        //白名单用户的列表
            whitelistAction: [],    //白名单行为的列表
            currentIPList:[],       //当前页的用户列表
            currentActionList:[],   //当前页的行为列表
            pageCountIP:0,          //用户列表的页数
            pageCountAction:0,      //行为列表的页数
            currentIPPage:0,        //白名单用户列表的当前页码
            currentActionPage:0,    //白名单行为列表的当前页码
            showMsgBox:false,                   //不显示消息提示框
            msgContent:'',                      //提示框的提示消息
            msgButtonState:false,               //提示框中的按钮状态
            msgButtonName:"",                   //提示框中的按钮名称
        }
        //全局变量
        this.shenjiIP = this.props.shenjiIP,   //当前数据库审计ip
        this.shenjiSQL = this.props.shenjiSQL,  //当前数据库
        this.numItemPerPage = 7         //列表中每页最多显示的条数
        this.userToAdd=''               //要添加的白名单用户名
        this.actionToAdd= ''            //要添加de白名单行为
    }

    /**
     * 当组件将要接收新的props时执行，初始化render时不执行，在这个回调函数里面，
     * 你可以根据属性的变化，通过调用this.setState()来更新你的组件状态，
     * 旧的属性还是可以通过this.props来获取,这里调用更新状态是安全的，并不会触发额外的render调用
     * @param {*} nextProps 新的props
     */
	componentWillReceiveProps (nextProps) {
        //如果显示状态发生变化
        if(this.props.isShowed != nextProps.isShowed){
            this.setState({
                isShowing: nextProps.isShowed,            
            });
        }                
        //如果审计IP发生改变，则更新全局 shenjiIP 和白名单数据
        if(this.props.shenjiIP != nextProps.shenjiIP || this.props.shenjiSQL != nextProps.shenjiSQL){
            this.shenjiIP = nextProps.shenjiIP,
            this.shenjiSQL = nextProps.shenjiSQL,
            this.getWhitelistAjax(nextProps.shenjiIP)
        }        
	}    

    /**
     * 根据当前 ip 获取白名单用户和行为的数据.
     * @param {*} shenji_ip 当前审计ip
     */
    getWhitelistAjax(shenji_ip) {
        var self = this;        
        $.ajax({
            url: '/api/shenji/white_list_status/',
            type: 'POST',                   //POST方式时,表单数据作为 HTTP 消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为 URL 地址的参数进行传递
            data: {                         //表单数据
                shenji_ip: shenji_ip,        //审计IP
                db_type:self.shenjiSQL          //审计数据库
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            success: function (data) {
                if(data.user){
                    //更新页面上的数据
                    //计算新的总页数
                    var newPageCountIP = Math.ceil(data.user.length/self.numItemPerPage)  //重新计算用户列表的页数
                    var newPageCountAction = Math.ceil(data.action.length/self.numItemPerPage) //重新计算用户行为的页数
                    //更新当前页码
                    //如果当前页码超出新的页数（比如，当上一次删除操作将当前页的唯一一项删除了的时候），将当前页码设置为最大页数 
                    var newCurrentIPPage = (self.state.currentIPPage > newPageCountIP) ? newPageCountIP : self.state.currentIPPage
                    var newCurrentActionPage = (self.state.currentActionPage > newPageCountAction) ? newPageCountAction : self.state.currentActionPage
                    if(self.state.currentIPPage==0 && newPageCountIP > 0){//如果白名单用户列表从无到有，将当前页码设置为1.
                        newCurrentIPPage = 1
                    }
                    if(self.state.currentActionPage==0 && newPageCountAction > 0){//如果白名单行为列表从无到有，将当前页码设置为1.
                        newCurrentActionPage = 1
                    }
                    //更新state
                    self.setState({
                        whitelistIP: data.user,
                        whitelistAction: data.action,
                        pageCountIP: newPageCountIP,             
                        pageCountAction: newPageCountAction, 
                        currentIPPage: newCurrentIPPage,
                        currentActionPage: newCurrentActionPage,               
                        currentIPList:data.user.slice(self.numItemPerPage*(newCurrentIPPage-1),self.numItemPerPage*newCurrentIPPage), //重置当前页面的用户列表
                        currentActionList:data.action.slice(self.numItemPerPage*(newCurrentActionPage-1),self.numItemPerPage*newCurrentActionPage),//重置当前页面的行为列表
                    });
                }                
            }
        })
    } 

    /**
     * 添加爱白名单行为的输入框的onChange事件监听器
     * @param {*} e 事件
     */
    onChangeAddAction(e) {
        //更新actionToAdd
        this.actionToAdd = e.target.value
    }

    /**
     * 添加白名单用户的输入框的onChange事件监听器
     * @param {*} e 事件
     */
    onChangeAddUser(e) {
        //更新userToAdd
        this.userToAdd = e.target.value
    }

    /**
     * 添加白名单用户
     */
    addWhiteUser() {
        var self = this;
        if (!this.userToAdd) { //输入的用户名为空
            self.setState({
                showMsgBox:true,
                msgContent:'请输入要添加的白名单用户名',
                msgButtonState:true,
                msgButtonName:'确认'
            });
        }else if(!isMySQLName(this.userToAdd)){   //输入的名称不符合mysql命名规范
            self.setState({
                showMsgBox:true,
                msgContent:'请输入正确的白名单用户名称.白名单用户命名规范为:只能包含英文字母,数字以及下划线,且长度不超过30。',
                msgButtonState:true,
                msgButtonName:'确认'
            });
        }else{
            $.ajax({
                url: '/api/shenji/add/',
                type: 'POST',
                dataType: 'json',
                cache: false,               //不会从浏览器缓存中加载请求信息
                data: {                     //表单数据
                    value: self.userToAdd,
                    ip: self.shenjiIP,
                    db_type:self.shenjiSQL,
                    type: 1                 //1,添加白名单用户.2,添加白名单行为
                },
                success: function (data) {
                    if(data.code==201){             //如果添加失败
                        self.setState({
                            showMsgBox:true,
                            msgContent:'添加白名单用户失败',
                            msgButtonState:true,
                            msgButtonName:'确认'
                        });
                    }else if(data.code==300){       //如果输入的用户已经在列表中
                        self.setState({
                            showMsgBox:true,
                            msgContent:'此白名单用户已经存在',
                            msgButtonState:true,
                            msgButtonName:'确认'
                        });
                    }else if(data.code==200){       //如果添加成功
                        $('#add-white-user').val('')     //清空输入框
                        $('.list-user-name input').prop("checked",false)    //将白名单用户列表中的所有复选框恢复未选中的状态
                        //重置userToAdd
                        self.userToAdd = ''
                        self.getWhitelistAjax(self.shenjiIP);//根据审计ip重新获取白名单用户和行为的数据
                    }                    
                },
                error: function () {
                    self.setState({
                        showMsgBox:true,
                        msgContent:'添加白名单用户失败',
                        msgButtonState:true,
                        msgButtonName:'确认'
                    });
                }
            })
        }
    }

    /**
     * 添加白名单行为
     */
    addWhiteAction() {
        var self = this;
        if (this.actionToAdd) {//当输入的行为名称不为空时
            $.ajax({
                url: '/api/shenji/add/',
                type: 'POST',
                dataType: 'json',
                cache: false,               //不会从浏览器缓存中加载请求信息
                data: {                     //表单数据
                    value: self.actionToAdd,
                    ip: self.shenjiIP,
                    db_type:self.shenjiSQL,
                    type: 2                 //1,添加白名单用户.2,添加白名单行为
                },
                success: function (data) {
                    if(data.code==201){             //如果添加失败
                        self.setState({ //显示消息提示框
                            showMsgBox:true,
                            msgContent:'添加白名单行为失败',
                            msgButtonState:true,
                            msgButtonName:'确认'
                        });
                    // }else if(data.code==202){       //如果输入的行为名称不在允许的行为列表中
                    //     self.setState({ //显示消息提示框
                    //         showMsgBox:true,
                    //         msgContent:'请输入正确的白名单行为。白名单行为包括：create, insert, show, select, update, flush, use, drop, describe, delete, alter, revoke, grant, mysqldump, mysql, mysqladmin, truncat, set。',
                    //         msgButtonState:true,
                    //         msgButtonName:'确认'
                    //     });
                    }else if(data.code==300){       //如果输入的行为名称已经在列表中
                        self.setState({ //显示消息提示框
                            showMsgBox:true,
                            msgContent:'此白名单行为已经存在',
                            msgButtonState:true,
                            msgButtonName:'确认'
                        });
                    }else if(data.code==200){       //如果添加成功
                        $('#add-white-action').val('')                       //清空输入框
                        $('.list-user-action input').prop("checked",false)    //将白名单行为列表中的所有复选框恢复未选中的状态
                        //重置actionToAdd
                        self.actionToAdd = ''
                        self.getWhitelistAjax(self.shenjiIP);//根据审计ip重新获取白名单用户和行为的数据   
                    }             
                },
                error: function(){
                    self.setState({ //显示消息提示框
                        showMsgBox:true,
                        msgContent:'添加白名单行为失败',
                        msgButtonState:true,
                        msgButtonName:'确认'
                    });
                }
            })
        } else {
            self.setState({ //显示消息提示框
                showMsgBox:true,
                msgContent:'请输入要添加的白名单用户行为',
                msgButtonState:true,
                msgButtonName:'确认'
            });
        }
    }

    /**
     * 删除白名单用户
     */
    deleteWhiteUser() {
        /*如何获取所选中的白名单名称:
        例如,一个白名单用户选项所对应的HTML结构如下
        <li key={index}>
            <input type="checkbox" id="checkbox-1-1" className="custom-checkbox"></input>
            <label htmlFor="checkbox-1-1"}></label>
            <span className="whiteName">{whiteName}</span>
        </li>
        首先,获取所有被选中的checkbox的父元素li,
        然后,再获取这些父元素的孩子标签中,类为whiteName的元素的内容,也就是每个复选框所对应的白名单用户名
        */
        var self = this;
        var values = '';        
        //获取被选中的checkbox的父元素
        var deleteName = $('.whitelist-setting .list-user-name input:checked').parent();
        
        for (let i = 0; i < deleteName.length; i++) {       //遍历被选中的checkbox的父元素
            const who = $(deleteName[i]).children('.whiteName').text();//得到对应checkbox的用户名
            values += who + '#';                            //使用#将所有选中的用户名连接
        }
        
        if(values){
            $.ajax({
                url: '/api/shenji/delete/',
                type: 'POST',
                dataType: 'json',
                cache: false,                   //不会从浏览器缓存中加载请求信息
                // traditional: true,           //数组情况下把traditional参数设置成true，是解析成a=1&a=2
                                                //为false时,是解析成a[]=1&a[]=2
                data: {                         //表单内容
                    values: values,             //要删除的白名单用户
                    type: 1,                    //1,删除白名单用户;2.删除白名单行为
                    ip: self.shenjiIP,  //当前审计IP
                    db_type:self.shenjiSQL  //当前数据库
                },
                success: function (data) {                
                    if(data.code==201){         //如果删除失败
                        self.setState({ //显示消息提示框
                            showMsgBox:true,
                            msgContent:'删除白名单用户失败',
                            msgButtonState:true,
                            msgButtonName:'确认'
                        });
                    }else if(data.code==200){       //如果删除成功
                        $('.list-user-name input').prop("checked",false)    //将白名单用户列表中的所有复选框恢复未选中的状态
                        self.getWhitelistAjax(self.shenjiIP);//根据审计ip重新获取白名单用户和行为的数据
                    }
                },
                error: function () {            //请求失败
                    self.setState({ //显示消息提示框
                        showMsgBox:true,
                        msgContent:'删除白名单用户失败',
                        msgButtonState:true,
                        msgButtonName:'确认'
                    });
                }
            })
        }else{
            self.setState({ //显示消息提示框
                showMsgBox:true,
                msgContent:'请选中要删除的白名单用户',
                msgButtonState:true,
                msgButtonName:'确认'
            });
        }        
    }

    /**
     * 删除白名单行为
     * 原理类似上面的deleteWhiteUser方法
     */
    deleteWhiteAction() {
        //用来存放所有选中的用户
        var self = this;
        var values = '';
        //获取到选中checkbox的父元素
        var deleteAction = $('.whitelist-setting .list-user-action input:checked').parent();
        //遍历父元素的这个数组,得到其的用户名
        for (var i = 0; i < deleteAction.length; i++) {
            var who = $(deleteAction[i]).children('.whiteAction').attr('name');
            values += who + '#'
        }
        if(values){
            $.ajax({
                url: '/api/shenji/delete/',
                type: 'POST',
                dataType: 'json',
                cache: false,                   //不会从浏览器缓存中加载请求信息
                data: {                         //表单数据
                    values: values,             //要删除的白名单行为名称
                    type: 2,                    //1,删除白名单用户;2.删除白名单行为
                    ip: self.shenjiIP,   //当前审计IP
                    db_type:self.shenjiSQL
                },
                success: function (data) {
                    if(data.code==201){         //如果删除失败
                        self.setState({ //显示消息提示框
                            showMsgBox:true,
                            msgContent:'删除白名单行为失败',
                            msgButtonState:true,
                            msgButtonName:'确认'
                        });
                    }else if(data.code==200){       //如果添加成功
                        $('.list-user-action input').prop("checked",false)    //将白名单行为列表中的所有复选框恢复未选中的状态
                        self.getWhitelistAjax(self.shenjiIP);//根据审计ip重新获取白名单用户和行为的数据
                    }
                },
                error: function () {
                    self.setState({ //显示消息提示框
                        showMsgBox:true,
                        msgContent:'删除白名单行为失败',
                        msgButtonState:true,
                        msgButtonName:'确认'
                    });
                }
            })
        }else{
            self.setState({ //显示消息提示框
                showMsgBox:true,
                msgContent:'请选中要删除的白名单行为',
                msgButtonState:true,
                msgButtonName:'确认'
            });
        }  
    }

    /**
     * 消息弹出框的按钮点击事件的监听
     */
    handleConfirmMsgBox(){
        this.setState({     //隐藏消息提示框
            showMsgBox:false,
        })
    }

    /**
     * 切换弹窗中的tab
     * @param {*} event 事件
     */
    switchTabs(event){
        var index = $(event.target).index()     //获取被点击的标签的index
        //在被点击标签的类0中添加current.并从其他所有同胞li标签的类中,移除current
        $(event.target).addClass('current').siblings('li').removeClass('current')
        //将被点击的标签所对应的标签页显示出来,并将所有同胞标签页隐藏.
        $('div.tab-content').eq(index).removeClass('hidden-block').siblings('div.tab-content').addClass('hidden-block');
    } 
    
    /**
     * 白名单用户列表的页码改变时的操作
     * @param {*} eventKey 
     */
    handleSelectIPPage(eventKey){
        const fromIndex = this.numItemPerPage*(eventKey-1)                          //当前页中列表的第一个元素索引
        const toIndex = this.numItemPerPage*eventKey                                //当前页中列表的最后一个元素的后一个索引
        this.setState({
            currentIPPage: eventKey,                                                    //更新当前用户列表的页码
            currentIPList: this.state.whitelistIP.slice(fromIndex,toIndex)              //更新当前页的用户列表
        })
        $('.list-user-name input').prop("checked",false)                                 //翻页时将选中状态清空
    }

    /**
     * 白名单行为列表的页码改变时的操作
     * @param {*} eventKey 
     */
    handleSelectActionPage(eventKey){     
        const fromIndex = this.numItemPerPage*(eventKey-1)                          //当前页中列表的第一个元素索引
        const toIndex = this.numItemPerPage*eventKey                                //当前页中列表的最后一个元素的后一个索引
        this.setState({
            currentActionPage: eventKey,                                                //更新当前行为列表的页码
            currentActionList: this.state.whitelistAction.slice(fromIndex,toIndex)      //更新当前页的行为列表
        })
        $('.list-user-action input').prop("checked",false)                              //翻页时将选中状态清空 
    }

    /**
     * 添加白名单用户输入框的按键事件
     * @param {*} e 事件
     */
    userKeyDown(e){
        if(e.keyCode === 13){   //如果按键为回车键
            this.addWhiteUser() //添加白名单用户
        }
    }

    /**
     * 添加白名单行为输入框的按键事件
     * @param {*} e 事件
     */
    actionKeyDown(e){
        if(e.keyCode === 13){   //如果按键为回车键
            this.addWhiteAction()//添加白名单行为
        }
    }

    render() {
        return ( 
            <div>
                {/*根据 isShowed 的值,改变整个区块的类,从而控制白名单操作狂口的隐藏或显示*/}    
                <aside className={this.state.isShowing ? 'whitelist-setting is-showed' : 'whitelist-setting'} >
                    <p className="settingTitle">白名单操作</p>
                    <div className="setting-tabs">
                        <ul className="clearfix">
                            {/* <li onClick = {this.switchTabs.bind(this)} className="current">设置白名单用户</li> */}
                            {/* <li onClick = {this.switchTabs.bind(this)} className="current">设置白名单行为</li> */}
                            <li className="current">设置白名单行为</li>
                        </ul>
                    </div>
                    <div className="tab-content hidden-block">
                        <div>
                            <FormGroup>
                                <FormControl id="add-white-user" type="text" placeholder="输入白名单用户名" className="input-style"
                                onChange={this.onChangeAddUser.bind(this)} onKeyDown={this.userKeyDown.bind(this)}/>
                                <Button bsStyle="primary" bsSize="sm" className="bt-add" onClick={this.addWhiteUser.bind(this)}>添加到白名单</Button>
                            </FormGroup>                        
                        </div>
                        <form>
                            <ul className="list-user-name">
                                <li className="li-title">
                                    <div>                                    
                                        <span>用户名</span>
                                        <Button bsStyle="default" bsSize="xs" className="bt-delete" onClick={this.deleteWhiteUser.bind(this)}>删除</Button>
                                    </div>                                
                                </li>
                                {/*如果当前页的用户列表不为空,则遍历并显示*/
                                    this.state.currentIPList&&this.state.currentIPList.map(function(whiteName,index){
                                    return (                                        
                                        <li key={index}>
                                            <input type="checkbox" id={"checkbox-1-"+index} className="custom-checkbox"></input>
                                            <label htmlFor={"checkbox-1-"+index}></label>{/*自定义的复选框样式*/}
                                            <span className="whiteName">{whiteName}</span>
                                        </li>
                                        )
                                    })
                                }                            
                            </ul>
                            <div className="pagination-all">
                                <Pagination 
                                    prev={true}                 //是否显示'前一页'的按钮
                                    next={true}                 //是否显示'下一页'的按钮
                                    first={false}               //是否显示'最前一页'的按钮
                                    last={false}                //是否显示'最后一页'的按钮
                                    ellipsis={true}                                 //是否显示省略号
                                    boundaryLinks={true}                            //是否显示页码的边界
                                    items={this.state.pageCountIP}                  //页码个数
                                    maxButtons={3}                                  //最多显示按钮的个数
                                    activePage={this.state.currentIPPage}           //当前选中的页码
                                    onSelect={this.handleSelectIPPage.bind(this)}   //分页器被选中时的监听操作
                                    />
                            </div>
                        </form>
                    </div>
                    {/*hidden-block:默认隐藏的标签页*/}
                    <div className="tab-content">
                        <div>
                            <FormGroup>
                                <FormControl type="text" id="add-white-action"  placeholder="输入白名单行为" className="input-style"
                                onChange={this.onChangeAddAction.bind(this)} onKeyDown={this.actionKeyDown.bind(this)}/>
                                <Button bsStyle="primary" bsSize="sm" className="bt-add" onClick={this.addWhiteAction.bind(this)}>添加到白名单</Button>
                            </FormGroup>                        
                        </div>
                        <form>
                            <ul className="list-user-action">
                                <li className="li-title">
                                    <div>
                                        <span>行为</span>
                                        <Button bsStyle="default" bsSize="xs" className="bt-delete" onClick={this.deleteWhiteAction.bind(this)}>删除</Button>
                                    </div>                                
                                </li>
                                {/*如果当前页的行为列表不为空,则遍历并显示*/}
                                {this.state.currentActionList&&this.state.currentActionList.map(function(whiteAction,index){
                                    return (                                        
                                        <li key={index}>
                                            <input type="checkbox" id={"checkbox-2-"+index} className="custom-checkbox"></input>
                                            <label htmlFor={"checkbox-2-"+index}></label>{/*自定义的复选框样式*/}
                                            <span className="whiteAction" name={whiteAction.sid}>{whiteAction.value}</span>
                                        </li>
                                        )
                                    })
                                }                         
                            </ul>                        
                        </form>
                        {/*底部的页码*/}
                        <div className="pagination-all">
                            <Pagination 
                                prev={true} 
                                next={true} 
                                first={false} 
                                last={false} 
                                ellipsis={true} 
                                boundaryLinks={true} 
                                items={this.state.pageCountAction} 
                                maxButtons={3} 
                                activePage={this.state.currentActionPage} 
                                onSelect={this.handleSelectActionPage.bind(this)}/>
                        </div>
                    </div>                 
                </aside>
                {/*消息提示框*/}
                <MessageBox
                    showMsgBox = { this.state.showMsgBox }
                    msgContent = { this.state.msgContent }
                    msgButtonState = { this.state.msgButtonState }
                    msgButtonName = { this.state.msgButtonName }
                    handleConfirmMsgBox = { this.handleConfirmMsgBox.bind(this)}
                />
            </div>
        )
    }
}