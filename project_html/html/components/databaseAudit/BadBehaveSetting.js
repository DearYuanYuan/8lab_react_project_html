/**
 * 数据库审计页面中'白名单操作'按钮的弹出框
 */
import React from "react";
import $ from "jquery";
import {Form, FormControl, FormGroup, Button, Pagination} from 'react-bootstrap';      //导入react-bootstrap中的部分组件
import MessageBox from "../Commonality/MessageBox"                       //消息提示框组件

//'白名单操作'按钮的弹出框组件
export default class BadBehaveSetting extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            whitelistAction: [],    //恶意行为行为的列表
            currentActionList:[],   //当前页的行为列表
            pageCountAction:0,      //行为列表的页数
            currentActionPage:0,    //恶意行为行为列表的当前页码
            showMsgBox:false,                   //不显示消息提示框
            msgContent:'',                      //提示框的提示消息
            msgButtonState:false,               //提示框中的按钮状态
            msgButtonName:"",                   //提示框中的按钮名称
        }
        //全局变量
        this.shenjiIP = this.props.shenjiIP,   //当前数据库审计ip
        this.numItemPerPage = 7         //列表中每页最多显示的条数
        this.actionToAdd= ''            //要添加de恶意行为行为
    }

    /**
     * 当组件将要接收新的props时执行，初始化render时不执行，在这个回调函数里面，
     * 你可以根据属性的变化，通过调用this.setState()来更新你的组件状态，
     * 旧的属性还是可以通过this.props来获取,这里调用更新状态是安全的，并不会触发额外的render调用
     * @param {*} nextProps 新的props
     */
	componentWillReceiveProps (nextProps) {
        if(this.props.shenjiIP != nextProps.shenjiIP){
            //如果审计IP发生改变，则更新全局 shenjiIP 和恶意行为数据
            //console.log(this.props.shenjiIP +';'+nextProps.shenjiIP)
            this.shenjiIP = nextProps.shenjiIP,
            this.getBadBehaveAjax(nextProps.shenjiIP)
        }        
	}

    /**
     * 根据当前 ip 获取恶意行为用户和行为的数据.
     * @param {*} shenji_ip 当前审计ip
     */
    getBadBehaveAjax(shenji_ip) {
        var self = this;
        $.ajax({
            url: '/api/shenji/black_list_status/',
            type: 'POST',                   //POST方式时,表单数据作为 HTTP 消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为 URL 地址的参数进行传递
            data: {                         //表单数据
                shenji_ip: shenji_ip,        //审计IP
                type:3                      //获取恶意行为列表，type：3
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            success: function (data) {
                // console.log(JSON.stringify(data.action))
                //计算新的总页数
                var newPageCountAction = Math.ceil(data.action.length/self.numItemPerPage) //重新计算用户行为的页数
                //更新当前页码
                //如果当前页码超出新的页数（比如，当上一次删除操作将当前页的唯一一项删除了的时候），将当前页码设置为最大页数
                var newCurrentActionPage = (self.state.currentActionPage > newPageCountAction) ? newPageCountAction : self.state.currentActionPage;
                if(self.state.currentActionPage==0){//如果白名单行为列表从无到有，将当前页码设置为1.
                    newCurrentActionPage = 1
                }
                //更新state
                self.setState({
                    whitelistAction: data.action,
                    pageCountAction: newPageCountAction,
                    currentActionPage: newCurrentActionPage,
                    currentActionList:data.action.slice(self.numItemPerPage*(newCurrentActionPage-1),self.numItemPerPage*newCurrentActionPage),//重置当前页面的行为列表
                });
            }
        })
    }

    /**
     * 添加爱恶意行为行为的输入框的onChange事件监听器
     * @param {*} e 事件
     */
    onChangeAddAction(e) {
        //更新actionToAdd
        this.actionToAdd = e.target.value
    }

    /**
     * 添加恶意行为行为
     */
    addBadBehaveAction() {
        var self = this;
        if (this.actionToAdd) {//当输入的行为名称不为空时
            $.ajax({
                url: '/api/shenji/blacklist_add/',
                type: 'POST',
                dataType: 'json',
                cache: false,               //不会从浏览器缓存中加载请求信息
                data: {                     //表单数据
                    value: self.actionToAdd,
                    ip: self.shenjiIP,
                    type: 3                 //3,添加恶意行为行为
                },
                success: function (data) {
                    if(data.code==201){             //如果添加失败
                        self.setState({ //显示消息提示框
                            showMsgBox:true,
                            msgContent:'添加恶意行为行为失败',
                            msgButtonState:true,
                            msgButtonName:'确认'
                        });
                    }else if(data.code==202){       //如果输入的行为名称不在允许的行为列表中
                        self.setState({ //显示消息提示框
                            showMsgBox:true,
                            msgContent:'请输入正确的恶意行为行为。恶意行为行为包括：create, insert, show, select, update, flush, use, drop, describe, delete, alter, revoke, grant, mysqldump, mysql, mysqladmin。',
                            msgButtonState:true,
                            msgButtonName:'确认'
                        });
                    }else if(data.code==300){       //如果输入的行为名称已经在列表中
                        self.setState({ //显示消息提示框
                            showMsgBox:true,
                            msgContent:'此恶意行为行为已经存在',
                            msgButtonState:true,
                            msgButtonName:'确认'
                        });
                    }else if(data.code==200){       //如果添加成功
                        $('#add-badBehave-action').val('')                       //清空输入框
                        $('.list-user-action input').prop("checked",false)    //将恶意行为行为列表中的所有复选框恢复未选中的状态
                        //重置actionToAdd
                        self.actionToAdd = ''
                        self.getBadBehaveAjax(self.shenjiIP);//根据审计ip重新获取恶意行为用户和行为的数据
                    }             
                },
                error: function(){
                    self.setState({ //显示消息提示框
                        showMsgBox:true,
                        msgContent:'添加恶意行为行为失败',
                        msgButtonState:true,
                        msgButtonName:'确认'
                    });
                }
            })
        } else {
            self.setState({ //显示消息提示框
                showMsgBox:true,
                msgContent:'请输入要添加的恶意行为用户行为',
                msgButtonState:true,
                msgButtonName:'确认'
            });
        }
    }

    /**
     * 删除恶意行为行为
     * 原理类似上面的deleteWhiteUser方法
     */
    deleteBadBehaveAction() {
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
        // console.log(values)
        if(values){
            $.ajax({
                url: '/api/shenji/blacklist_delete/',
                type: 'POST',
                dataType: 'json',
                cache: false,                   //不会从浏览器缓存中加载请求信息
                data: {                         //表单数据
                    values: values,             //要删除的恶意行为行为名称
                    type: 3,                    //3.删除恶意行为行为
                    ip: self.shenjiIP,   //当前审计IP
                },
                success: function (data) {
                    if(data.code==201){         //如果删除失败
                        self.setState({ //显示消息提示框
                            showMsgBox:true,
                            msgContent:'删除恶意行为行为失败',
                            msgButtonState:true,
                            msgButtonName:'确认'
                        });
                    }else if(data.code==200){       //如果添加成功
                        $('.list-user-action input').prop("checked",false)    //将恶意行为行为列表中的所有复选框恢复未选中的状态
                        self.getBadBehaveAjax(self.shenjiIP);//根据审计ip重新获取恶意行为用户和行为的数据
                    }
                },
                error: function () {
                    self.setState({ //显示消息提示框
                        showMsgBox:true,
                        msgContent:'删除恶意行为行为失败',
                        msgButtonState:true,
                        msgButtonName:'确认'
                    });
                }
            })
        }else{
            self.setState({ //显示消息提示框
                showMsgBox:true,
                msgContent:'请选中要删除的恶意行为行为',
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
     * 恶意行为行为列表的页码改变时的操作
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
     * 添加恶意行为行为输入框的按键事件
     * @param {*} e 事件
     */
    actionKeyDown(e){
        if(e.keyCode === 13){   //如果按键为回车键
            this.addBadBehaveAction()//添加恶意行为行为
        }
    }

    render() {
        return ( 
            <div>
                {/*根据 isShowed 的值,改变整个区块的类,从而控制恶意行为操作狂口的隐藏或显示*/}
                <aside className={this.props.isShowed ? 'whitelist-setting is-showed' : 'whitelist-setting'} >
                    <p className="settingTitle">恶意行为操作</p>
                    <div className="setting-tabs">
                        <ul className="clearfix">
                            <li className="current">设置恶意行为行为</li>
                            {/* <li>&nbsp;</li> */}
                        </ul>
                    </div>
                    <div className="tab-content">
                        <div>
                            <FormGroup>
                                <FormControl type="text" id="add-badBehave-action"  placeholder="输入恶意行为行为" className="input-style"
                                onChange={this.onChangeAddAction.bind(this)} onKeyDown={this.actionKeyDown.bind(this)}/>
                                <Button bsStyle="primary" bsSize="sm" className="bt-add" onClick={this.addBadBehaveAction.bind(this)}>添加到恶意行为</Button>
                            </FormGroup>                        
                        </div>
                        <form>
                            <ul className="list-user-action">
                                <li className="li-title">
                                    <div>
                                        <span>行为</span>
                                        <Button bsStyle="default" bsSize="xs" className="bt-delete" onClick={this.deleteBadBehaveAction.bind(this)}>删除</Button>
                                    </div>                                
                                </li>
                                {/*如果当前页的行为列表不为空,则遍历并显示*/}
                                {this.state.currentActionList&&this.state.currentActionList.map(function(Name,index){
                                    return (                                        
                                        <li key={index}>
                                            <input type="checkbox" id={"checkbox-3-"+index} className="custom-checkbox"></input>
                                            <label htmlFor={"checkbox-3-"+index}></label>{/*自定义的复选框样式*/}
                                            <span className="whiteAction" name={Name.sid}>{Name.value}</span>
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