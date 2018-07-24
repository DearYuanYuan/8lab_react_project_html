/**
* 可信保护控制页面
* created by ZHONG Mengting
* on 2017/09/12
*/
import React from "react"
import $ from 'jquery';
import {myClearInterval,isInt,isIP} from "../utils/utils.js";
import {Pagination, Modal, Col, Button, Table, ButtonToolbar, Form, FormControl, FormGroup, HelpBlock} from 'react-bootstrap';     //引入react-bootstrap中的组件
import DropdownList from "./Commonality/DropdownList";     //下拉列表的组件
import MessageBox from "./Commonality/MessageBox"          //消息提示框组件
import EditHost from "./environment/EditHost"

/*可信保护控制页面*/
export default class ProtectControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hostlist:[],    //主机列表
            // pageCount: 0,   //总页数
            // currentPage: 1, //当前页数
            // sortByIP:-1,    //-1表示没有排序;0,表示升序;1表示降序
            // sortByHostname: -1,
            // sortByStatus: -1,
            showMsgBox:false,                   //不显示消息提示框
            msgContent:'',                      //提示框的提示消息
            msgButtonState:false,               //提示框中的按钮状态
            msgButtonName:"",                   //提示框中的按钮名称
            maintainLoginModal: false,   //运维登录的弹窗            
            port: 22,  //运维登录中输入的用户名
            username:'',  //运维登录中输入的用户名
            password:'',  //运维登录中输入的密码
            showDownloadListBlock:false,    //是否展开运维下载的列表

            maintainSettingModal: false,   //运维配置的弹窗
            filename: '',   //运维配置弹窗中选中的运维程序
            localIP:'',//运维配置弹窗的当前主机IP

            listGroup: 1,//显示全部主机或者主机组
            showEditHost: false, //显示主机组编辑框
            grouplist:[],
            operateHost:'', //新增或者编辑主机
            operateHostId:false,//编辑主机的id
            operateHostName:'',//编辑主机名称
            operateHostRemark:'',//编辑主机备注
            sysSelectAllText: '选择全部',          //主机列表选择全部按钮
            sysGroupSelectAllText: '选择全部',          //主机列表选择全部按钮

            selectedConnection:0, //选中的在线上的数据
            selectedGroupConnection:0, //选中的在线上的数据

        }
        this.sortByIP = -1;    //-1表示没有排序;0,表示升序;1表示降序
        this.sortByHostname = -1;
        this.sortByStatus = -1;
        this.sortField = null;  //get_host接口所需的field参数。‘hostname-0’ 表示按照按照主机别名升序;‘hostname-1’ 表示按照按照主机别名降序。
        this.pageCount = 0;     //总页数
        this.pageSize = 8;      //当前页显示的最多的个数
        this.group_pageSize = 8;      //当前页显示的最多的个数
        this.currentPage = 1;   //当前页码，默认为1
        this.group_currentPage = 1;   //当前页码，默认为1
        this.loginHostID = null;    //运维登录主机的ID
        this.hostname = null;       //运维登录的主机名
        this.hostip = null;         //运维登录的主机IP
        this.description = null;    //运维登录的主机备注
        this.selectedIDs = [];  //复选框选中的主机的ID
        this.selectedGroupIDs = [];  //复选框选中的主机的ID
        this.searchItem = null; //搜索输入框中的内容
        this.group_searchItem = null; //搜索输入框中的内容
        this.searchRange = '-1';    //搜索操作的范围，下拉列表所选的值   
        this.os=this.detectOS() //当前操作系统（windows/linux）    
        this.sysSelectAll = '0';    //０代表当前是未选择状态　　１代表当前是已经选择全部的状态
        this.sysGroupSelectAll ='0' //０代表当前是未选择状态　　１代表当前是已经选择全部的状态 
        this.allDatabaseHost = []; //主机列表全部选择
        this.allDatabaseGroup = []; //主机组全部选择
    }

    /**
     * 在组件渲染之前执行的操作
     */
    componentWillMount() {
        this.getHostList();
        this.initialAllCheckbox();
        // this.getLocalIP()        
    }

    /**
     * 在组件加载之后执行的操作
     */
    componentDidMount() {
        this.autoHideDownloadList()  
        
        /* 组件渲染完成 分别设置定时刷新 */
        //设置全局定时器变量,便于清除（更新主机状态）
        if (this.state.listGroup == 1) {
            this.getHostListInterval = setInterval( this.getHostList.bind(this), 3000);
        } 
    }
    componentDidUpdate(prevProps,prevState) {
        // console.log('nextState.hostlist != this.state.hostlist',prevState.hostlist, this.state.hostlist);
        
        if (this.state.listGroup == 1) {
            if (this.getGroupListInterval) {
                myClearInterval(this.getGroupListInterval);
            }
            myClearInterval(this.getHostListInterval);
            myClearInterval(this.getGroupListInterval);
            this.getHostListInterval = setInterval( this.getHostList.bind(this), 3000);

            if (this.sysSelectAll == '1'){
                if ( prevState.hostlist != this.state.hostlist) {
                    var inputSet = $('.hostlist-detail .hostlist-hostname input');
                    // console.log('111112222',this.allDatabaseHost.length)
                    for ( var k = 0; k < inputSet.length; k++) {
                        let item = inputSet.eq(k).attr('data-ip');
                        let itemIndex = $.inArray(item, this.allDatabaseHost)
                        // console.log('itemIndex/////',item , itemIndex, inputSet.eq(k) );
                        if (itemIndex != -1) {
                            inputSet.eq(k).prop('checked',true)
                        } else {
                            inputSet.eq(k).prop('checked',false)
                        }
                        
                    }
                }
                
                var checkedNum = $('.hostlist-detail .hostlist-hostname .custom-checkbox:checked').length;
                var inputNum = $('.hostlist-detail .hostlist-hostname .custom-checkbox').length;
                //如果当前点击的复选框是已经被选中的，点击之后被选中的复选框个数-1;否则，+1
                // checkedNum += $(e.target).siblings('.custom-checkbox:checked').length?-1:1;    
                if(checkedNum==inputNum){
                    $('.hostlist-table>thead .hostlist-hostname .custom-checkbox').prop('checked',true);
                }else {
                    $('.hostlist-table>thead .hostlist-hostname .custom-checkbox').prop('checked',false);
                }
                
               
            } 
    
        } else if (this.state.listGroup == 2) {
            myClearInterval(this.getHostListInterval);
            // myClearInterval(this.getGroupListInterval);
            this.getHostListInterval = setInterval( this.getGroupList.bind(this), 3000);

            if (this.sysGroupSelectAll == '1'){
                if ( prevState.grouplist != this.state.grouplist) {
                    var inputGroupSet = $('.grouplist-table .hostlist-detail .hostlist-hostname input');
                    // console.log('111112222',this.allDatabaseGroup.length)
                    for ( var k = 0; k < inputGroupSet.length; k++) {
                        let item = parseInt(inputGroupSet.eq(k).attr('data-id'));
                        let itemIndex = $.inArray(item, this.allDatabaseGroup)
                        // console.log('itemIndex/////',item , itemIndex, inputGroupSet.eq(k) ,this.allDatabaseGroup, typeof(item),typeof(this.allDatabaseGroup[0]));
                        if (itemIndex != -1) {
                            inputGroupSet.eq(k).prop('checked',true)
                        } else {
                            inputGroupSet.eq(k).prop('checked',false)
                        }
                        
                    }
                }
                
                var checkedNum = $('.grouplist-table .hostlist-detail .hostlist-hostname .custom-checkbox:checked').length;
                var inputNum = $('.grouplist-table .hostlist-detail .hostlist-hostname .custom-checkbox').length;
                //如果当前点击的复选框是已经被选中的，点击之后被选中的复选框个数-1;否则，+1
                // checkedNum += $(e.target).siblings('.custom-checkbox:checked').length?-1:1;    
                if(checkedNum==inputNum){
                    $('.grouplist-table > thead .hostlist-hostname .custom-checkbox').prop('checked',true);
                }else {
                    $('.grouplist-table > thead .hostlist-hostname .custom-checkbox').prop('checked',false);
                }
                
               
            } 
    
        }


         // console.log('nextState.hostlist != this.state.hostlist',nextState.hostlist, this.state.hostlist);
        

        
    }
    /* 组件将要移除 离开当前页面时清除所有的计时器,清除定时 */
    componentWillUnmount() {
        //清除更新主机状态的操作的定时请求
        myClearInterval(this.getHostListInterval);
        myClearInterval(this.getGroupListInterval);
    }
    
    /**
     * 设置“下拉列表的点击事件”
     * 使得点击下拉列表以外的区域时，下拉列表自动折叠
     */
    autoHideDownloadList(){
        var self=this
        $(document).bind('click',function(e){
            if(self.state.showDownloadListBlock){ //如果下拉列表已经展开
                var event = e || window.event; //浏览器兼容性 
                var elem = event.target || event.srcElement; 
                while (elem) { //循环判断至跟节点，防止点击的是div子元素 
                    if (elem.id && elem.id=="maintenance-download"){  //如果点击的是下拉列表区域，退出循环
                        return; 
                    } 
                    elem = elem.parentNode; 
                } 
                self.setState({ //折叠下拉列表
                    showDownloadListBlock:false
                })
            }            
        });
    }
    /*===================================================== 主机列表的操作 ============================================== */
    /**
     * 获取主机列表的数据，更新state
     */
    getHostList() {
        var self = this;
        $.ajax({
            url: '/api/blackbox/get_hosts/',
            type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: {                         //表单数据
                page_num: self.currentPage,
                page_size: self.pageSize,
                condition: self.searchItem,
                field: self.sortField,
                type: self.searchRange,
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            // async:false,  //同步方式发起请求
            traditional: true,          //阻止JQuery深度序列化对象
            success: function(result){
                if(result){
                    self.pageCount = Math.ceil(result.total/self.pageSize);
                    self.setState({
                        hostlist: result.data,                        
                    })
                }        
                
                // 根据sysSelectAll ０代表当前是未选择状态　　１代表当前是已经选择全部的状态
                // 如果已经时选中的状态,翻到那一页复选框都是被选中状态
                // if (self.sysSelectAll == '0') {
                //     $('.hostaListTable .hostlist-detail .hostlist-hostname .custom-checkbox').prop('checked', false)
                //     $('.hostlist-table>thead .hostlist-hostname .custom-checkbox').prop('checked', false)
                // } else 
                // if (self.sysSelectAll == '1') {
                //     $('.hostaListTable .hostlist-detail .hostlist-hostname .custom-checkbox').prop('checked', true)
                //     $('.hostlist-table>thead .hostlist-hostname .custom-checkbox').prop('checked', true)
                // }
        },
            error: function(){
            }
        })
        
        // this.initialAllCheckbox(); //恢复所有复选框到未选中状态
    }

    /**
     * 根据IP获取主机列表的数据，更新state
     */
    getIPHost() {
        var self = this;
        $.ajax({
            url: '/api/blackbox/get_blackbox_ip_hosts/',
            type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: {                         //表单数据
                ip: self.state.selectIP,
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            traditional: true,          //阻止JQuery深度序列化对象
            success: function(result){
                if(result){
                    self.setState({
                        // listGroup: 3,       //是否展示详情页面
                        selectHost: result.hostname,        //获取选中的主机别名
                        // selectIP: ip,            //获取选中的ip
                        selectDescription: result.description, //获取选中的主机的备注
                        selectStatus: result.status,    //获取选中的主机的状态
                        selectId: result.id,    //获取选中的主机的id
                    })

                   
                }                
            },
            error: function(){
            }
        })
    }
     /*===================================================== 主机组的操作 ============================================== */
    /**
     * 获取主机组列表的数据，更新state
     */
    getGroupList() {
        var self = this;
        // console.log('---=====',self.group_currentPage,self.group_pageSize,self.group_searchItem)
        $.ajax({
            url: '/api/blackbox/get_group_list/',
            type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: {                         //表单数据
                page: self.group_currentPage,
                size: self.group_pageSize,
                keyword: self.group_searchItem,
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            traditional: true,          //阻止JQuery深度序列化对象
            success: function(result){
                if(result){
                    // self.group_pageCount = Math.ceil(result.total/self.group_pageSize);
                    self.group_pageCount = result.totalpage;
                    self.setState({
                        grouplist: result.data,                        
                    })
                }                
            },
            error: function(){
            }
        })
        
        // this.initialAllCheckbox(); //恢复所有复选框到未选中状态
    }

    /*====================== 主机列表的操作（分页） ====================== */

    /**
     * 选择页码的监听
     */
    handleSelectPage(eventkey) {   
        this.currentPage = eventkey
        this.getHostList();
        // setTimeout(,)
        console.log('this.sysSelectAll',this.sysSelectAll)
        if (this.sysSelectAll == '0'){
            this.initialAllCheckbox();
            this.setSelectedIDs(1,1);
        }   
    }

    /**
     * 点击跳转按钮的监听
     */
    handleJumpPage() {
        this.currentPage = parseInt($('#hostlistPage').val())
        this.getHostList();
        if (this.sysSelectAll == '0'){
            this.initialAllCheckbox();
            this.setSelectedIDs(1,1);
        } 
        // this.initialAllCheckbox();
    }

    /**
     * 跳转输入框的onChange监听
     */
    onChangeInputPage(e) {
        var hostlistPage = e.target.value      //获取输入的页码
        //如果输入的页码不为空,并且如果输入的页码不符合规范(不是正整数，或者大于最大页码)
        if ( hostlistPage != "" && (!isInt(hostlistPage) || hostlistPage == 0 || hostlistPage > this.pageCount)) {
            $('#hostlistPage').val('');   //清空输入框的内容                       
        }
    }

    /**
     * 跳转输入框的按键事件监听
     * @return {[type]} [description]
     */
    jumpPageKeyDown(e) {
        if(e.keyCode === 13){           //当按下的键是回车键
            this.handleJumpPage()
        }
    }


    /*====================== 主机组的操作（分页） ====================== */

    /**
     * 选择页码的监听
     */
    handleGroupSelectPage(eventkey) {   
        this.group_currentPage = eventkey
        this.getGroupList();
        console.log('this.sysSelectAll',this.sysSelectAll)
        if (this.sysGroupSelectAll == '0'){
            this.initialAllCheckbox();
            this.setSelectedIDs(1,2);

        }
    }

    /**
     * 点击跳转按钮的监听
     */
    handleGroupJumpPage() {
        this.group_currentPage = parseInt($('#grouplistPage').val())
        this.getGroupList();
        if (self.sysGroupSelectAll == '0'){
            this.initialAllCheckbox();
            this.setSelectedIDs(1,2);
        }
    }

    /**
     * 跳转输入框的onChange监听
     */
    onGroupChangeInputPage(e) {
        var grouplistPage = e.target.value      //获取输入的页码
        //如果输入的页码不为空,并且如果输入的页码不符合规范(不是正整数，或者大于最大页码)
        if ( grouplistPage != "" && (!isInt(grouplistPage) || grouplistPage == 0 || grouplistPage > this.group_pageCount)) {
            $('#grouplistPage').val('');   //清空输入框的内容                       
        }
    }

    /**
     * 跳转输入框的按键事件监听
     * @return {[type]} [description]
     */
    jumpGroupPageKeyDown(e) {
        if(e.keyCode === 13){           //当按下的键是回车键
            this.handleGroupJumpPage()
        }
    }

    /*====================== 主机列表的操作（应用/暂停保护 打开关/闭阻断） ====================== */
     /**
     * 根据复选框的状态获取被选中的主机的ID
     * @return selectedIDs 被选中的主机ID的列表
     */
    setSelectedIDs(index,type) {
        if (type==1) {
            this.selectedGroupIDs = [];  //复选框选中的主机的ID
            this.selectedIDs = [];
            var checkedParents = $('.hostlist-detail .hostlist-hostname input:checked').parent().parent();
            if(index==1) {
                //获取到选中checkbox的父元素
                // var checkedNum = $('.hostlist-detail .hostlist-hostname .custom-checkbox:checked').length;
                // var checkedParents = $('.hostlist-detail .hostlist-hostname input.is-selected').parent().parent();
                //遍历父元素的这个数组,得到其相对于同胞元素的 index 位置,对应到hostlist中的index
                for (var i = 0; i < checkedParents.length; i++) {
                    var index = $(checkedParents[i]).index();
                        if (this.state.hostlist[index].connection == 1) {
                            this.selectedIDs.push(this.state.hostlist[index].hostip);
                            // console.log('aaaaaaaaaaaaaaaa',this.state.hostlist[index].hostip);
                        }
                }
            } else if (index==2) {
                this.selectedIDs.push(this.state.selectIP);
            } else if (index==3) {
                this.selectedIDs = this.allDatabaseHost;
                // console.log('//////////////////--------------------',this.selectedIDs,this.allDatabaseHost)
            }

            if (checkedParents.length > 0) {
                this.setState({
                    selectedConnection: 1
                })
                if ( this.selectedIDs.length > 0 ) {
                    this.setState({
                        selectedConnection: 2
                    })
                }
            } else {
                this.setState({
                    selectedConnection: 0
                })
            }
            
        }
        else if (type==2) {
            var checkedGroupParents = $('.grouplist-detail .hostlist-hostname input:checked').parent().parent();
            if(index==1) {
                this.selectedIDs = [];
                this.selectedGroupIDs = [];  //复选框选中的主机的ID
                //获取到选中checkbox的父元素

                //遍历父元素的这个数组,得到其相对于同胞元素的 index 位置,对应到hostlist中的index
                for (var i = 0; i < checkedGroupParents.length; i++) {
                    var index = $(checkedGroupParents[i]).index();
                    this.selectedGroupIDs.push(this.state.grouplist[index].id);
                }
            } else if (index==2) {
                this.selectedGroupIDs = this.allDatabaseGroup;
                console.log('this.selectedGroupIDs',this.allDatabaseGroup,this.selectedGroupIDs);
                
            }

            if (checkedGroupParents.length > 0) {
                this.setState({
                    selectedGroupConnection: 1
                })
            } else {
                this.setState({
                    selectedGroupConnection: 0
                })
            }
        }
        
    }
    /*====================== 主机列表的选择操作 ====================== */
    /**
     *检查是否所有的复选框都被选中。
     *如果全被选中，“全选”的复选框也该被选中;否则，取消被选中
     */
    checkSelectAll( type,e ){ 
        var self = this;
        // $(e.target).toggleClass('is-selected');  //判断类

        var checkedNum = $('.hostlist-detail .hostlist-hostname .custom-checkbox:checked').length;
        var inputNum = $('.hostlist-detail .hostlist-hostname .custom-checkbox').length;
        //如果当前点击的复选框是已经被选中的，点击之后被选中的复选框个数-1;否则，+1
        // checkedNum += $(e.target).siblings('.custom-checkbox:checked').length?-1:1;    
        if(checkedNum==inputNum){
            $('.hostlist-table>thead .hostlist-hostname .custom-checkbox').prop('checked',true);
        }else {
            $('.hostlist-table>thead .hostlist-hostname .custom-checkbox').prop('checked',false);
        }
        // console.log('checkedNum',type)

        if (type==1) {
            if (this.sysSelectAll == '1') {
                var ip = $(e.target).attr('data-ip');
                var index = $.inArray(ip,this.allDatabaseHost);
                console.log('$(e.target)/////',$(e.target).prop('checked'),this.allDatabaseHost.length );
                if ($(e.target).prop('checked')==false) {
                    if (index != -1) {
                        this.allDatabaseHost.splice(index,1);
                    } 
                } else {
                    this.allDatabaseHost.push(ip);
                }
                console.log('$(e.target)/////',$(e.target).prop('checked'),this.allDatabaseHost.length );
                
                self.setSelectedIDs(3,1);
                
            } else {
                self.setSelectedIDs(1,1);
            }
        } else {
            if (this.sysGroupSelectAll == '1') {
                var id = parseInt($(e.target).attr('data-id'));
                var index = $.inArray(id,this.allDatabaseGroup);
                console.log('$(e.target)/////',$(e.target).prop('checked'),this.allDatabaseGroup.length );
                if ($(e.target).prop('checked')==false) {
                    if (index != -1) {
                        this.allDatabaseGroup.splice(index,1);
                    } 
                } else {
                    this.allDatabaseGroup.push(id);
                }
                console.log('$(e.target)/////',$(e.target).prop('checked'),this.allDatabaseGroup.length );
                
                self.setSelectedIDs(2,2);
                
            } else {
                self.setSelectedIDs(1,2);
            }
        }
        // console.log('self.selectedIDs', self.selectedIDs)
    }
    /**
     * 点击“全选”复选框时的操作
     */
    toggleSelectAll(type){
        $('.hostlist-detail .hostlist-hostname input').prop('checked', !$('.hostlist-table>thead .hostlist-hostname input').prop('checked'));
        if (type==1) {
            this.setSelectedIDs(1,1);
        } else {
            this.setSelectedIDs(1,2);
        }
        
    }

    /**
     * 恢复所有复选框到未选中状态
     */
    initialAllCheckbox(){
        $('.hostlist-hostname input').prop('checked',false);
    }

    /*====================== 主机列表的全部选择操作 ====================== */
    // 点击选择全部之后所有页面的checkbox都被勾选
    selectTotal() {
        this.allDatabaseGroup = [];
        this.allDatabaseHost = [];
        if (this.state.sysSelectAllText == '选择全部') {
            this.sysSelectAll = '1'
            $(' .hostaListTable .hostlist-detail .hostlist-hostname .custom-checkbox').prop('checked', true)
            $('.hostaListTable>thead .hostlist-hostname .custom-checkbox').prop('checked', true)
            this.setState({
                sysSelectAllText: '取消选择'
            })
            var self = this;
            $.ajax({
                url: '/api/blackbox/get_all_hosts/',
                type: 'GET',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
                dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
                // data: {                         //表单数据
                //     ip: self.selectedIDs?self.selectedIDs.join(','):[],
                //     type: type,
                //     group_ids: self.selectedGroupIDs?self.selectedGroupIDs.join(','):[],
                // },
                cache: false,                   //不会从浏览器缓存中加载请求信息
                traditional: true,          //阻止JQuery深度序列化对象
                success: function (result) {
                    self.allDatabaseHost = result;
                    self.setSelectedIDs(3,1);
                    // console.log('t+++++self.allDatabaseHost',self.allDatabaseHost,self.selectedIDs);
                },
                error:function(){
                  
                }
            })
        } else if (this.state.sysSelectAllText == '取消选择') {
            this.sysSelectAll = '0';
            $('.hostaListTable .hostlist-detail .hostlist-hostname .custom-checkbox').prop('checked', false)
            $('.hostaListTable>thead .hostlist-hostname .custom-checkbox').prop('checked', false)
            this.setState({
                sysSelectAllText: '选择全部'
            })
            this.setSelectedIDs(1,1);
            
        // console.log('-------',this.selectedIDs);
            
        }
        // this.setSelectedIDs(3,1);
        
        // console.log('this.selectedIDs',this.selectedIDs);
        
        var checkedNum = $('.hostaListTable .hostlist-detail .hostlist-hostname .custom-checkbox:checked').length;
        if (checkedNum < 1) {
            $(".btn-all-ctl").addClass('not-allowed')
        } else {
            $(".btn-all-ctl").removeClass('not-allowed')
        }
    }

    /*====================== 主机组的全部选择操作 ====================== */
     // 点击选择全部之后所有页面的checkbox都被勾选
    selectGroupTotal() {
        this.allDatabaseGroup = [];
        this.allDatabaseHost = [];
        if (this.state.sysGroupSelectAllText == '选择全部') {
            this.sysGroupSelectAll = '1'
            $(' .grouplist-table .hostlist-detail .hostlist-hostname .custom-checkbox').prop('checked', true)
            $('.grouplist-table>thead .hostlist-hostname .custom-checkbox').prop('checked', true)
            this.setState({
                sysGroupSelectAllText: '取消选择'
            })
            var self = this;
            $.ajax({
                url: '/api/blackbox/get_all_group/',
                type: 'GET',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
                dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
                // data: {                         //表单数据
                //     ip: self.selectedIDs?self.selectedIDs.join(','):[],
                //     type: type,
                //     group_ids: self.selectedGroupIDs?self.selectedGroupIDs.join(','):[],
                // },
                cache: false,                   //不会从浏览器缓存中加载请求信息
                traditional: true,          //阻止JQuery深度序列化对象
                success: function (result) {
                    self.allDatabaseGroup = result.ids;
                    self.setSelectedIDs(2,2);
                    console.log('t+++++self.selectedGroupIDs',self.allDatabaseGroup,self.selectedGroupIDs);
                },
                error:function(){
                  
                }
            })
        } else if (this.state.sysGroupSelectAllText == '取消选择') {
            this.sysGroupSelectAll = '0';
            $('.grouplist-table .hostlist-detail .hostlist-hostname .custom-checkbox').prop('checked', false)
            $('.grouplist-table>thead .hostlist-hostname .custom-checkbox').prop('checked', false)
            this.setState({
                sysGroupSelectAllText: '选择全部'
            })
            this.setSelectedIDs(1,2);
            
        // console.log('-------',this.selectedIDs);
            
        }
        // this.setSelectedIDs(3,1);
        
        console.log('this.selectedGroupIDs',this.selectedIDs);
        
        var checkedNum = $('.grouplist-table .hostlist-detail .hostlist-hostname .custom-checkbox:checked').length;
        if (checkedNum < 1) {
            $(".btn-all-ctl").addClass('not-allowed')
        } else {
            $(".btn-all-ctl").removeClass('not-allowed')
        }
    }


    /**
     * 应用保护
     */
    applyProtection(index,type) {
        var self = this;
        self.setSelectedIDs(index,type);
        console.log('+++appply===============',self.selectedGroupIDs)
        if( self.selectedIDs.length>0 || self.selectedGroupIDs.length>0 ) {
            $.ajax({
                url: '/api/blackbox/start_protection/',
                type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
                dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
                data: {                         //表单数据
                    ip: self.selectedIDs?self.selectedIDs.join(','):[],
                    type: type,
                    group_ids: self.selectedGroupIDs?self.selectedGroupIDs.join(','):[],
                },
                cache: false,                   //不会从浏览器缓存中加载请求信息
                traditional: true,          //阻止JQuery深度序列化对象
                success: function (result) {
                    if(result.status){
                        self.setState({     //显示提示消息
                            showMsgBox:true,
                            msgContent:'应用保护成功！',
                            msgButtonState:true,
                            msgButtonName:'确认',
                        }); 
                        self.getHostList();
                        self.initialAllCheckbox();
                    } else {
                        self.setState({     //显示提示消息
                            showMsgBox:true,
                            msgContent:'应用保护失败！',
                            msgButtonState:true,
                            msgButtonName:'确认',
                        });
                    }                       
                },
                error:function(){
                    self.setState({     //显示提示消息
                        showMsgBox:true,
                        msgContent:'应用保护失败！',
                        msgButtonState:true,
                        msgButtonName:'确认',
                    });
                }
            })
        } else {
            self.setState({     //显示提示消息
                showMsgBox:true,
                msgContent:'请选择要保护的主机！',
                msgButtonState:true,
                msgButtonName:'确认',
            });
        }
        
    }

    /**
     * 暂停保护
     */
    pauseProtection(index,type) {
        var self = this;
        self.setSelectedIDs(index,type);
        if(self.selectedIDs.length>0 || self.selectedGroupIDs.length>0) {
            $.ajax({
                url: '/api/blackbox/stop_protection/',
                type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
                dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
                data: {                         //表单数据
                    ip: self.selectedIDs?self.selectedIDs.join(','):[],
                    type: type,
                    group_ids: self.selectedGroupIDs?self.selectedGroupIDs.join(','):[],
                },
                cache: false,                   //不会从浏览器缓存中加载请求信息
                success: function (result) {
                    if(result.status){
                        self.setState({     //显示提示消息
                            showMsgBox:true,
                            msgContent:'暂停保护成功！',
                            msgButtonState:true,
                            msgButtonName:'确认',
                        });
                        self.getHostList(); 
                        self.initialAllCheckbox();
                    } else {
                        self.setState({     //显示提示消息
                            showMsgBox:true,
                            msgContent:'暂停保护失败！',
                            msgButtonState:true,
                            msgButtonName:'确认',
                        });
                    }     
                },
                error:function(){
                    self.setState({     //显示提示消息
                        showMsgBox:true,
                        msgContent:'暂停保护失败！',
                        msgButtonState:true,
                        msgButtonName:'确认',
                    });
                }
            })
        } else {
            self.setState({     //显示提示消息
                showMsgBox:true,
                msgContent:'请选择要暂停保护的主机！',
                msgButtonState:true,
                msgButtonName:'确认',
            });
        }
    }

    /**
     * 打开阻断
     */
    applyBlocking(index,type) {
        var self = this;
        self.setSelectedIDs(index,type);
        if(self.selectedIDs.length>0 || self.selectedGroupIDs.length>0) {
            $.ajax({
                url: '/api/blackbox/start_senior_block/',
                type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
                dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
                data: {                         //表单数据
                    ip: self.selectedIDs?self.selectedIDs.join(','):[],
                    type: type,
                    group_ids: self.selectedGroupIDs?self.selectedGroupIDs.join(','):[],
                },
                cache: false,                   //不会从浏览器缓存中加载请求信息
                traditional: true,          //阻止JQuery深度序列化对象
                success: function (result) {
                    if(result.status){
                        self.setState({     //显示提示消息
                            showMsgBox:true,
                            msgContent:'打开阻断成功！',
                            msgButtonState:true,
                            msgButtonName:'确认',
                        }); 
                        self.getHostList();
                        self.initialAllCheckbox();
                    } else {
                        self.setState({     //显示提示消息
                            showMsgBox:true,
                            msgContent:'打开阻断失败！',
                            msgButtonState:true,
                            msgButtonName:'确认',
                        });
                    }                       
                },
                error:function(){
                    self.setState({     //显示提示消息
                        showMsgBox:true,
                        msgContent:'打开阻断失败！',
                        msgButtonState:true,
                        msgButtonName:'确认',
                    });
                }
            })
        } else {
            self.setState({     //显示提示消息
                showMsgBox:true,
                msgContent:'请选择要阻断的主机！',
                msgButtonState:true,
                msgButtonName:'确认',
            });
        }
    }
    /**
     *  关闭阻断
     */
    stopBlocking(index,type) {
        var self = this;
        self.setSelectedIDs(index,type);
        if(self.selectedIDs.length>0 || self.selectedGroupIDs.length>0) {
            $.ajax({
                url: '/api/blackbox/stop_senior_block/',
                type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
                dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
                data: {                         //表单数据
                    ip: self.selectedIDs?self.selectedIDs.join(','):[],
                    type: type,
                    group_ids: self.selectedGroupIDs?self.selectedGroupIDs.join(','):[],
                },
                cache: false,                   //不会从浏览器缓存中加载请求信息
                traditional: true,          //阻止JQuery深度序列化对象
                success: function (result) {
                    if(result.status){
                        self.setState({     //显示提示消息
                            showMsgBox:true,
                            msgContent:'关闭阻断成功！',
                            msgButtonState:true,
                            msgButtonName:'确认',
                        }); 
                        self.getHostList();
                        self.initialAllCheckbox();
                    } else {
                        self.setState({     //显示提示消息
                            showMsgBox:true,
                            msgContent:'关闭阻断失败！',
                            msgButtonState:true,
                            msgButtonName:'确认',
                        });
                    }                       
                },
                error:function(){
                    self.setState({     //显示提示消息
                        showMsgBox:true,
                        msgContent:'关闭阻断失败！',
                        msgButtonState:true,
                        msgButtonName:'确认',
                    });
                }
            })
        } else {
            self.setState({     //显示提示消息
                showMsgBox:true,
                msgContent:'请选择要关闭阻断的主机！',
                msgButtonState:true,
                msgButtonName:'确认',
            });
        }
    }
    /**
     *  删除主机
     */
    deleteHosts(index) {
        var self = this;
        self.setSelectedIDs(index,1);
        if(self.selectedIDs.length>0) {
            $.ajax({
                url: '/api/blackbox/del_host/',
                type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
                dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
                data: {                         //表单数据
                    ips: self.selectedIDs.join(',')
                },
                cache: false,                   //不会从浏览器缓存中加载请求信息
                traditional: true,          //阻止JQuery深度序列化对象
                success: function (result) {
                    if(result.status){
                        self.setState({     //显示提示消息
                            showMsgBox:true,
                            msgContent:'删除主机成功！',
                            msgButtonState:true,
                            msgButtonName:'确认',
                        }); 
                        self.getHostList();
                        self.initialAllCheckbox();
                    } else {
                        self.setState({     //显示提示消息
                            showMsgBox:true,
                            msgContent:'删除主机失败！',
                            msgButtonState:true,
                            msgButtonName:'确认',
                        });
                    }                       
                },
                error:function(){
                    self.setState({     //显示提示消息
                        showMsgBox:true,
                        msgContent:'删除主机失败！',
                        msgButtonState:true,
                        msgButtonName:'确认',
                    });
                }
            })
        } else {
            self.setState({     //显示提示消息
                showMsgBox:true,
                msgContent:'请选择要删除的主机！',
                msgButtonState:true,
                msgButtonName:'确认',
            });
        }
    }
    /**
     *  删除主机组
     */
    deleteGroups(index) {
        var self = this;
        self.setSelectedIDs(index,2);
        if(self.selectedGroupIDs.length>0) {
            $.ajax({
                url: '/api/blackbox/del_group/',
                type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
                dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
                data: {                         //表单数据
                    id: self.selectedGroupIDs.join(',')
                },
                cache: false,                   //不会从浏览器缓存中加载请求信息
                traditional: true,          //阻止JQuery深度序列化对象
                success: function (result) {
                    if(result.status){
                        self.setState({     //显示提示消息
                            showMsgBox:true,
                            msgContent:'删除主机组成功！',
                            msgButtonState:true,
                            msgButtonName:'确认',
                        }); 
                        self.getGroupList();
                        self.initialAllCheckbox();
                    } else {
                        self.setState({     //显示提示消息
                            showMsgBox:true,
                            msgContent:'删除主机组失败！',
                            msgButtonState:true,
                            msgButtonName:'确认',
                        });
                    }                       
                },
                error:function(){
                    self.setState({     //显示提示消息
                        showMsgBox:true,
                        msgContent:'删除主机组失败！',
                        msgButtonState:true,
                        msgButtonName:'确认',
                    });
                }
            })
        } else {
            self.setState({     //显示提示消息
                showMsgBox:true,
                msgContent:'请选择要删除的主机组！',
                msgButtonState:true,
                msgButtonName:'确认',
            });
        }
    }
    /*====================== 主机列表的操作（排序） ====================== */
  
    /**
     * 按照某一列给表格排序
     * @param {string} sortCol 排序的列名 
     */
    sortTable(sortCol) {
        switch(sortCol){
            case 'hostname':
                this.sortByHostname= (this.sortByHostname==0?1:0);
                this.sortByIP = -1; //重置其他的排序选项
                this.sortByStatus = -1;
                this.sortField = 'hostname-'+this.sortByHostname;
                break;
            case 'ip':
                this.sortByIP = (this.sortByIP==0?1:0);
                this.sortByHostname = -1;   //重置其他的排序选项
                this.sortByStatus = -1;
                this.sortField = 'hostip-'+this.sortByIP;
                break;
            case 'status':
                this.sortByStatus = (this.sortByStatus==0?1:0);
                this.sortByHostname = -1;   //重置其他的排序选项
                this.sortByIP = -1;
                this.sortField = 'status-'+this.sortByStatus;
                break;
            default:
                this.sortField = '';
        }
        this.getHostList();
        this.initialAllCheckbox();
    }

    /*====================== 主机列表的操作（搜索） ====================== */
    /**
     * 搜索范围下拉列表内容改变
     * @param {*} 所选中的内容 
     */
    onChangeRange(item) {
        this.searchRange = item;
        this.currentPage = 1;   //默认回到第一页
        this.getHostList()
        this.initialAllCheckbox();
    }

    /**
     * 搜索输入框内容变化时的监听
     */
    onChangeSearchInput() {
        this.searchItem = $('#searchHostInput').val();
    }   

    /**
     * 点击搜索按钮的监听
     * 按照输入框中的内容搜索主机
     */
    handleSearchHost() {
        //搜索时默认无排序，重置所有的排序选项
        this.sortField='';
        this.sortByHostname = -1;
        this.sortByIP = -1;
        this.sortByStatus = -1;
        this.currentPage = 1;   //默认回到第一页
        this.getHostList();
        this.initialAllCheckbox();
    }

    /**
     * 当搜索主机输入框中有按键事件时的操作
     * @param {*} e 事件
     */
    searchKeyDown(e){
        if(e.keyCode === 13){               //如果按下的键是回车键
            this.handleSearchHost()
        }
    }


    /*====================== 主机组列表的操作（搜索） ====================== */

    /**
     * 搜索输入框内容变化时的监听
     */
    onGroupChangeSearchInput() {
        this.group_searchItem = $('#searchGroupInput').val();
    }   

    /**
     * 点击搜索按钮的监听
     * 按照输入框中的内容搜索主机
     */
    handleGroupSearchHost() {
        //搜索时默认无排序，重置所有的排序选项
        // this.sortField='';
        // this.sortByHostname = -1;
        // this.sortByIP = -1;
        // this.sortByStatus = -1;
        this.group_currentPage = 1;   //默认回到第一页
        this.getGroupList();
        this.initialAllCheckbox();
    }

    /**
     * 当搜索主机输入框中有按键事件时的操作
     * @param {*} e 事件
     */
    searchGroupKeyDown(e){
        if(e.keyCode === 13){               //如果按下的键是回车键
            this.handleGroupSearchHost()
        }
    }

    /*===================================================== 运维登录弹出框 ============================================== */
    /**
     * 点击运维登录的监听
     */
    showMaintainLoginModal(hostname,hostip,description,id) {
        this.hostname = hostname;
        this.hostip = hostip;
        this.description = description;
        this.loginHostID = id;
        this.setState({
            maintainLoginModal: true,
            port:22,
            username: '',
            password:'',
        })
    }

    /**
     * 隐藏运维登录的窗口
     */
    hideMaintainLoginModal(){
        this.setState({
            maintainLoginModal: false,
        })
    }

    onChangePort(e){
        this.setState({
            port: e.target.value
        })
    }
    
    onChangeUsername(e){
        this.setState({
            username: e.target.value
        })
    }

    onChangePassword(e){
        this.setState({
            password: e.target.value
        })
    }

     /**
     * 设置窗口可拖动
     * @param {*} id 要设置可拖动的元素的id
     */
    setDraggable(id) {
        require('./../utils/jquery-ui.min.js'); //在jquery-ui官网自定义的压缩文件，只包含实现draggable功能所需内容。
        $('#' + id).draggable(); //调用jquery-ui的draggable方法，jquery在文件开头被引入。
    }
    
    /**
     * 协议下拉列表的所选项改变时
     * @param {*} item 所选中的项
     */
    onChangeProtocol(item) {

    }

    //清除错误提示内容
    clearTips() {
        $('#submitMsg').text('');
    }

    /**
     * 针对linux系统的运维登录
     * 检查表单是否填写完整
     * 显示对应的提示信息
     * @param {*} id 
     */
    checkForm(id){
        this.clearTips()
        if(this.os!="linux"){
            $("#"+id).text("您的操作系统暂不支持此功能")            
        }else if(!this.state.port){
            $("#"+id).text("请输入端口号")
        }else if(!this.state.username){
            $("#"+id).text("请输入用户名")
        }else if(!this.state.password){
            $("#"+id).text("请输入密码")
        }else if(this.os =="linux"){
            var self = this
            $.ajax({
                url: 'http://127.0.0.1:19200/ssh/',
                type: 'GET',
                dataType: "json",
                data: {
                    user: self.state.username,
                    password:self.state.password,
                    host:self.hostip,
                    port:self.state.port,
                    django_host:window.location.host,
                    host_id:self.loginHostID
                },
                cache: false,
                timeout: 5000,
                success: function (data) {
                    if(data.status=="success"){
                        self.hideMaintainLoginModal()
                    }else{
                        $("#"+id).text(data.msg)                        
                    }
                },
                error:function(data){
                    $("#"+id).text("SSH运维服务繁忙无响应，请确认SSH运维服务是否按照要求进行了安装与设置，网络是否通畅。")                                
                }
            })

        }
    }
    /*===================================================== 运维配置弹出框 ============================================== */
    /**
     * 点击运维配置按钮的监听
     */
    showMaintainSettingModal() {
        this.setState({
            maintainSettingModal: true
        })
    }

    /**
     * 隐藏运维配置的窗口
     */
    hideMaintainSettingModal(){
        this.setState({
            maintainSettingModal: false,
        })
    }

    /**
     * 运维配置弹窗选择运维客户端
     */
    selectApp(){
        var file = $('#maintainSettingModal .input-choose-file')[0].files[0]
        if(file){
            this.setState({
                filename:file.name
            })
        }else{
            this.setState({
                filename:''
            })
        }
    }
    
    onChangeLocalIP(e){
        this.setState({
            localIP: e.target.value
        })
    }

    //清除运维配置窗口的错误提示内容
    clearSettingTips() {
        $('#maintainSettingMsg').text('');
    }

    //保存运维配置
    submitMaintainSettingModal(){
        var self=this
        this.clearSettingTips()
        if(!this.state.localIP){
            $('#maintainSettingMsg').text('请填写当前主机IP地址');                        
        }else if(!isIP(this.state.localIP)){
            $('#maintainSettingMsg').text('请输入格式正确的IP地址');                        
        }else{
            var formdata=new FormData()
            formdata.append('file',$('#maintainSettingModal .input-choose-file')[0].files[0])
            formdata.append("op_type","create")
            formdata.append("host_ip",this.state.localIP)

            $.ajax({
                url: '/api/blackbox/update_op_host/',
                type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
                dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
                contentType: false,
                processData: false,
                data: formdata,
                cache: false,                   //不会从浏览器缓存中加载请求信息
                success: function (result) {
                    self.setState({
                        showMaintainSettingModal:false
                    })      
                },
                error:function(){
                    $('#maintainSettingMsg').text('服务繁忙请稍候');                        
                }
            })            
        }
    }

    /**
     * 获取本地IP
     */
    getLocalIP(){
        var self=this
        var ip_dups = {};
        //compatibility for firefox and chrome
        var RTCPeerConnection = window.RTCPeerConnection
            || window.mozRTCPeerConnection
            || window.webkitRTCPeerConnection;
        //bypass naive webrtc blocking
        if (!RTCPeerConnection) {
            var iframe = document.createElement('iframe');
            //invalidate content script
            iframe.sandbox = 'allow-same-origin';
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            var win = iframe.contentWindow;
            window.RTCPeerConnection = win.RTCPeerConnection;
            window.mozRTCPeerConnection = win.mozRTCPeerConnection;
            window.webkitRTCPeerConnection = win.webkitRTCPeerConnection;
            RTCPeerConnection = window.RTCPeerConnection
                || window.mozRTCPeerConnection
                || window.webkitRTCPeerConnection;
        }
        //minimal requirements for data connection
        var mediaConstraints = {
            optional: [{RtpDataChannels: true}]
        };
        //firefox already has a default stun server in about:config
        //    media.peerconnection.default_iceservers =
        //    [{"url": "stun:stun.services.mozilla.com"}]
        var servers = undefined;
        //add same stun server for chrome
        if(window.webkitRTCPeerConnection)
            servers = {iceServers: [{urls: "stun:stun.services.mozilla.com"}]};
        //construct a new RTCPeerConnection
        var pc = new RTCPeerConnection(servers, mediaConstraints);
        //listen for candidate events
        pc.onicecandidate = function(ice){
            //skip non-candidate events
            if(ice.candidate){
                //match just the IP address
                var ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/
                var ip_addr = ip_regex.exec(ice.candidate.candidate)[1];                
                
                //remove duplicates
                if(ip_dups[ip_addr] === undefined){
                    self.setState({
                        localIP:ip_addr
                    });
                }                    
                ip_dups[ip_addr] = true;
            }
        };
        //create a bogus data channel
        pc.createDataChannel("");
        //create an offer sdp
        pc.createOffer(function(result){
            //trigger the stun server request
            pc.setLocalDescription(result, function(){}, function(){});
        }, function(){});

    }

    /*===================================================== 运维下载 ============================================== */
    /**
     * 控制运维下载的下拉列表的显示与隐藏
     */
    toggleDownloadList(){
        $('.my-dropdown-list#maintenence-download .item-selected').blur()    //禁止输入框获取焦点
        // console.log(this.state.showDownloadListBlock)        
        this.setState({
            showDownloadListBlock:!this.state.showDownloadListBlock
        })
    }
    /**
     * 检测当前操作系统
     * @return windows/linux/other
     */
    detectOS() {
        // var sUserAgent = navigator.userAgent;
        var isWin = (navigator.platform == "Win32") || (navigator.platform == "Windows");
        // var isMac = (navigator.platform == "Mac68K") || (navigator.platform == "MacPPC") || (navigator.platform == "Macintosh") || (navigator.platform == "MacIntel");
        // if (isMac) return "Mac";
        // var isUnix = (navigator.platform == "X11") && !isWin && !isMac;
        // if (isUnix) return "Unix";
        var isLinux = (String(navigator.platform).indexOf("Linux") > -1);
        if (isLinux) return "linux";
        if (isWin) {
            // var isWin2K = sUserAgent.indexOf("Windows NT 5.0") > -1 || sUserAgent.indexOf("Windows 2000") > -1;
            // if (isWin2K) return "Win2000";
            // var isWinXP = sUserAgent.indexOf("Windows NT 5.1") > -1 || sUserAgent.indexOf("Windows XP") > -1;
            // if (isWinXP) return "WinXP";
            // var isWin2003 = sUserAgent.indexOf("Windows NT 5.2") > -1 || sUserAgent.indexOf("Windows 2003") > -1;
            // if (isWin2003) return "Win2003";
            // var isWinVista= sUserAgent.indexOf("Windows NT 6.0") > -1 || sUserAgent.indexOf("Windows Vista") > -1;
            // if (isWinVista) return "WinVista";
            // var isWin7 = sUserAgent.indexOf("Windows NT 6.1") > -1 || sUserAgent.indexOf("Windows 7") > -1;
            // if (isWin7) return "Win7";
            return "windows"
        }
        return "other";
    }

    /*===================================================== 消息弹出框 ============================================== */
    /**
     * 消息弹出框的按钮点击事件的监听
     */
    handleConfirmMsgBox(){
        this.setState({     //隐藏消息提示框
            showMsgBox:false,
        })
    }
    /*===================================================== 显示全部主机或者主机组 ============================================== */
    switchList(index){
        this.setState({
            listGroup: index,
        })
        if (index===1) {
            this.getHostList();
        } else if (index===2) {
            this.getGroupList();
        }

    }
    /*===================================================== 点击查看详情 ============================================== */
     //点击详细信息，通过更改state来控制视图改变
    //点击哪个就设置当前的为选中的
    showHostDetail(host, ip,description, status, id) {
        this.setState({
            listGroup: 3,       //是否展示详情页面
            selectHost: host,        //获取选中的主机别名
            selectIP: ip,            //获取选中的ip
            selectDescription: description, //获取选中的主机的备注
            selectStatus: status,    //获取选中的主机的状态
            selectId: id,    //获取选中的主机的id
        })
    }
    /*===================================================== 点击主机组新建 ============================================== */
    showEditHostModel(operate,id,name,remark){
        this.setState({
            showEditHost:!this.state.showEditHost,
            operateHost:operate,
            operateHostId:id,
            operateHostName:name,
            operateHostRemark:remark,
        })
        this.getGroupList();
    }
    /*===================================================== Render ============================================== */
    render() {    
        var self = this;
        //显示在当前ip的下拉列表中的项
        var searchRange =[{
            name: "全部主机",   //显示在列表中的项
            value: -1      //选中时传递的值
        },{
            name: "保护的主机",
            value: 0
        },{
            name: "未保护的主机",
            value: 1
        }];

        //显示在当前ip的下拉列表中的项
        var loginProtocols =[{
            name:"SSH",        //显示在列表中的项
            value:"SSH"        //选中时传递的值
        }]

        return (
            <section className="" >
                <div className="protectControl-header">
                    <button className="btn-search btn btn-sm btn-primary btn-maintain-setting" onClick={this.showMaintainSettingModal.bind(this)}>运维配置</button>
                    <div className="my-dropdown-list" id="maintenance-download">
                        <div>
                            <div className="select-img"></div>
                            <input
                            className="item-selected"
                            type="text"
                            readOnly
                            value="运维下载"
                            onClick={this.toggleDownloadList.bind(this)}
                            />
                        </div>
                        {/*根据 this.state.showListBlock 控制下拉列表选项框的显示与隐藏;如果列表内容为空则始终不显示下拉选项框*/}
                        <div className={this.state.showDownloadListBlock?"list-block":"hide list-block"}>
                            <ul>
                                <li>
                                    <a href="http://192.168.1.239:8099/api/download/ops-service-win.exe" target="_blank">Windows 运维下载</a>
                                </li>
                                <li>
                                    <a href="http://192.168.1.239:8099/api/download/ops-service-linux" target="_blank">Linux 运维下载</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                { this.state.listGroup == 1 && <div className="protectControl-content list-content">
                    <h2 className="content-title">
                        主机列表
                    </h2> 
                    <div className="btns-group clearfix">
                        <div className="switch-group">
                            <span className="list selected">全部主机</span>
                            <span className="group" onClick={this.switchList.bind(this,2)}>主机组</span>
                        </div>
                        <input id="searchHostInput" type="text" placeholder="搜索别名或IP" className="form-control input-search" 
                                onKeyDown={this.searchKeyDown.bind(this)}
                                onChange={this.onChangeSearchInput.bind(this)}/>
                        <button className="btn-search btn btn-sm btn-primary" onClick={this.handleSearchHost.bind(this)}>
                            <i className="fa fa-search" aria-hidden="true"></i>
                        </button>
                        <button className="btn-select-all btn btn-sm btn-primary" onClick={this.selectTotal.bind(this)}>
                            {/* 选择全部 */}
                            {this.state.sysSelectAllText}
                        </button>
                        { this.state.selectedConnection == 2 ?
                             <div className="btn-group-search">
                                <span>操作：</span>
                                <button className="btn-apply-protection btn btn-sm btn-primary" onClick={this.applyProtection.bind(this,this.sysSelectAll=="0"?1:3,1)}>
                                    {/* 应用保护 */}
                                </button>
                                <button className="btn-pause-protection btn btn-sm btn-default" onClick={this.pauseProtection.bind(this,this.sysSelectAll=="0"?1:3,1)}>
                                    {/* 暂停保护 */}
                                </button>
                                <button className="btn-apply-blocking btn btn-sm btn-default" onClick={this.applyBlocking.bind(this,this.sysSelectAll=="0"?1:3,1)}>
                                    {/* 打开阻断 */}
                                </button>    
                                <button className="btn-stop-blocking btn btn-sm btn-default" onClick={this.stopBlocking.bind(this,this.sysSelectAll=="0"?1:3,1)}>
                                    {/* 关闭阻断 */}
                                </button>
                                <button className="btn-delete btn btn-sm btn-default" onClick={this.deleteHosts.bind(this,this.sysSelectAll=="0"?1:3)}>
                                    {/* 删除主机 */}
                                </button>                                       
                            </div>
                            :  <div className="btn-group-search">
                                    <span>操作：</span>
                                    <button className="btn-apply-protection btn btn-sm btn-primary useless">
                                        {/* 应用保护 */}
                                    </button>
                                    <button className="btn-pause-protection btn btn-sm btn-default useless">
                                        {/* 暂停保护 */}
                                    </button>
                                    <button className="btn-apply-blocking btn btn-sm btn-default useless">
                                        {/* 打开阻断 */}
                                    </button>    
                                    <button className="btn-stop-blocking btn btn-sm btn-default useless">
                                        {/* 关闭阻断 */}
                                    </button>
                                    { this.state.selectedConnection == 1 ?
                                        <button className="btn-delete btn btn-sm btn-default" onClick={this.deleteHosts.bind(this,this.sysSelectAll=="0"?1:3)}>
                                            {/* 删除主机 */}
                                        </button>  
                                        : 
                                        <button className="btn-delete btn btn-sm btn-default useless" >
                                            {/* 删除主机 */}
                                        </button> 
                                    }                                     
                                </div> 
                        }                    
                           

                    </div>                    
                    {/*主机列表的表格*/}
                    <table className="hostlist-table hostaListTable">
                        <thead>
                            <tr>
                                <th className="hostlist-hostname">
                                    <input type="checkbox" id="hostlist-checkbox-all" className="custom-checkbox" ></input>
                                    <label htmlFor="hostlist-checkbox-all" onClick={this.toggleSelectAll.bind(this)}></label>{/*自定义的复选框样式*/}
                                    主机别名
                                    <i className={this.sortByHostname==0?"fa fa-angle-up":"fa fa-angle-down"} 
                                    aria-hidden="true" onClick={this.sortTable.bind(this,'hostname')}></i>
                                </th>
                                <th className="hostlist-hostip">
                                    IP
                                    <i className={this.sortByIP==0?"fa fa-angle-up":"fa fa-angle-down"} 
                                    aria-hidden="true" onClick={this.sortTable.bind(this,'ip')}></i>
                                </th>
                                <th className="hostlist-description">备注</th>
                                <th className="hostlist-status">
                                    安全防护
                                    <i className={this.sortByStatus==0?"fa fa-angle-up":"fa fa-angle-down"} 
                                    aria-hidden="true" onClick={this.sortTable.bind(this,'status')}></i>
                                </th>
                                <th className="hostlist-status">
                                    阻断状态
                                    <i className={this.sortByStatus==0?"fa fa-angle-up":"fa fa-angle-down"} 
                                    aria-hidden="true" onClick={this.sortTable.bind(this,'status')}></i>
                                </th>
                                <th className="hostlist-status">
                                    连接状态
                                    <i className={this.sortByStatus==0?"fa fa-angle-up":"fa fa-angle-down"} 
                                    aria-hidden="true" onClick={this.sortTable.bind(this,'status')}></i>
                                </th>
                                <th className="hostlist-maintenance">操作</th>
                                <th className="hostlist-detail"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.hostlist && this.state.hostlist.map(function(hostDetail,index){
                                return (
                                    <tr className="hostlist-detail" key={index}>
                                        <td className="hostlist-hostname">
                                            <input type="checkbox" id={"hostlist-checkbox-"+hostDetail.id} data-ip={hostDetail.hostip} className="custom-checkbox" onClick={self.checkSelectAll.bind(self,1)}></input>
                                            <label htmlFor={"hostlist-checkbox-"+hostDetail.id}></label>{/*自定义的复选框样式*/}                                            
                                            {hostDetail.hostname}
                                        </td>
                                        <td className="hostlist-hostip">{hostDetail.hostip}</td>
                                        <td className="hostlist-description">{hostDetail.description}</td>
                                        <td className={hostDetail.connection==1?"hostlist-status":"hostlist-status offline"}><i className={hostDetail.status===1?"circle status-no":"circle status-yes"}></i></td>
                                        <td className={hostDetail.connection==1?"hostlist-status":"hostlist-status offline"}><i className={hostDetail.status===2?"circle status-yes":"circle status-no"}></i></td>
                                        <td className={hostDetail.connection==1?"hostlist-status":"hostlist-status offline"}><i className={hostDetail.connection==1?"circle status-yes":"circle status-no"}></i></td>
                                        { hostDetail.connection==1 ?
                                            <td className="hostlist-maintenance"
                                                onClick={self.showMaintainLoginModal.bind(self,hostDetail.hostname,hostDetail.hostip,hostDetail.description,hostDetail.id)}>
                                                {/* 运维登录 */}
                                                <img src={require('../img/icons/table_inline/link.png')} />
                                                
                                            </td>
                                        :
                                            <td className="hostlist-maintenance offline">
                                                {/* 运维登录 */}
                                                <img src={require('../img/icons/table_inline/link_unAv.png')} />
                                            </td>
                                        }
                                        <td className="hostlist-maintenance" 
                                            onClick={() => self.showHostDetail(hostDetail.hostname, hostDetail.hostip,hostDetail.description, hostDetail.status,hostDetail.id)}>
                                            <i className="fa fa-share-square-o" aria-hidden="true"></i>
                                            查看详情 >
                                        </td>
                                    </tr>
                                    )
                                })                                
                            }
                            {
                                ( !this.state.hostlist || !this.state.hostlist.length ) && <tr className="hostlist-detail"><td>当前没有匹配的数据。</td></tr>
                            }                            
                        </tbody>
                    </table>
                    {/*主机列表的页码*/}
                    <div className="pagination-all">
                        <Pagination 
                        prev={true} 
                        next={true} 
                        first={false} 
                        last={false} 
                        ellipsis={true} 
                        boundaryLinks={true} 
                        items={this.pageCount} 
                        maxButtons={7} 
                        activePage={this.currentPage} 
                        onSelect={this.handleSelectPage.bind(this)}/>
                        {/*页码跳转输入框*/}
                        <div className="pageCount">
                            <input 
                            className="pageNum" 
                            id="hostlistPage" 
                            placeholder="输入" 
                            onChange={this.onChangeInputPage.bind(this)}
                            onKeyDown={this.jumpPageKeyDown.bind(this)}
                            />
                            <img 
                            className="searchNum" 
                            onClick={this.handleJumpPage.bind(this)} src='/static/img/skip.svg'/>
                        </div>
                    </div>    
                 </div>  
                }
                { this.state.listGroup == 3 && <div className="protectControl-content detail-content">
                    <h2 className="content-title">
                        <span style={{ cursor: 'pointer' }} onClick={() => this.setState({ selectHost: '', listGroup: 1 })}> 主机列表 ></span> 
                        <span style={{ color: '#fff',marginLeft:5 }}>{this.state.selectIP}</span>
                    </h2>
                    <div className="host-status">
                        <img src={require("../img/icons/scan/nodes.png")} className="status-img" />
                        <div className="host-scan-des">
                            <div>主机信息</div>
                            <div>{this.state.selectIP}</div>
                        </div>
                    </div>
                        <table className="host-detail-table" >
                        <tbody>
                            <tr>
                                <td width="20%">IP</td>
                                <td>{this.state.selectIP}</td>
                            </tr>
                            <tr>
                                <td>主机别名</td>
                                <td>{this.state.selectHost}</td>
                            </tr>
                            <tr>
                                <td>备注</td>
                                <td>{this.state.selectDescription}</td>
                            </tr>
                            <tr>
                                <td>安全保护</td>
                                 { this.state.selectStatus === 1 ?
                                    <td>
                                        <span>保护已停用</span>
                                        <label className="animate-checkbox">
                                            <input type="checkbox" name="" onClick={this.applyProtection.bind(this,2,1)} />
                                            <i></i>
                                        </label>
                                    </td>
                                : 
                                    <td>
                                        <span>保护已启用</span>
                                        <label className="animate-checkbox">
                                            <input type="checkbox" name="" defaultChecked onClick={this.pauseProtection.bind(this,2,1)} />
                                            <i></i>
                                        </label>
                                    </td>
                                }
                            </tr>
                            <tr>
                                <td>阻断</td>
                                { this.state.selectStatus === 2 ?
                                    <td>
                                        <span>阻断已启用</span>
                                        <label className="animate-checkbox">
                                            <input type="checkbox" name="" defaultChecked onClick={this.stopBlocking.bind(this,2)} />
                                            <i></i>
                                        </label>
                                    </td>
                                : 
                                    <td>
                                        <span>阻断已停用</span>
                                        <label className="animate-checkbox">
                                            <input type="checkbox" name="" onClick={this.applyBlocking.bind(this,2)} />
                                            <i></i>
                                        </label>
                                    </td>
                                }
                            </tr>

                        </tbody>
                    </table>

                    <div style={{ marginTop: '20px' }}>
                        <button className=" btn btn-sm btn-default log-in" style={{ marginRight: '20px' }} onClick={self.showMaintainLoginModal.bind(self,self.state.selectHost,self.state.selectIP,self.state.selectDescription,self.state.selectId)}>
                            运维登录
                        </button>
                       
                    </div>
                 </div>  
                 
                }
                { this.state.listGroup == 2 && <div className="protectControl-content group-content">
                    <h2 className="content-title">
                        组列表
                    </h2>                    
                    <div className="btns-group clearfix">
                        <div className="switch-group">
                            <span className="list" onClick={this.switchList.bind(this,1)}>全部主机</span>
                            <span className="group selected">主机组</span>
                        </div>
                        <input id="searchGroupInput" type="text" placeholder="搜索名称或备注" className="form-control input-search" 
                                onKeyDown={this.searchGroupKeyDown.bind(this)}
                                onChange={this.onGroupChangeSearchInput.bind(this)}/>
                        <button className="btn-search btn btn-sm btn-primary" onClick={this.handleGroupSearchHost.bind(this)}>
                            <i className="fa fa-search" aria-hidden="true"></i>
                        </button>    
                        <button className="btn-select-all btn btn-sm btn-primary" onClick={this.selectGroupTotal.bind(this,1)}>
                            {/* 选择全部 */}
                            {this.state.sysGroupSelectAllText}
                        </button>
                        { this.state.selectedGroupConnection == 1 ?
                            <div className="btn-group-search">
                                <span>操作：</span>
                                <button className="btn-apply-protection btn btn-sm btn-primary" onClick={this.applyProtection.bind(this,this.sysGroupSelectAll=="0"?1:2,2)}>
                                    {/* 应用保护 */}
                                </button>
                                <button className="btn-pause-protection btn btn-sm btn-default" onClick={this.pauseProtection.bind(this,this.sysGroupSelectAll=="0"?1:2,2)}>
                                    {/* 暂停保护 */}
                                </button>
                                <button className="btn-apply-blocking btn btn-sm btn-default" onClick={this.applyBlocking.bind(this,this.sysGroupSelectAll=="0"?1:2,2)}>
                                    {/* 打开阻断 */}
                                </button>    
                                <button className="btn-stop-blocking btn btn-sm btn-default" onClick={this.stopBlocking.bind(this,this.sysGroupSelectAll=="0"?1:2,2)}>
                                    {/* 关闭阻断 */}
                                </button>
                                <button className="btn-create btn btn-sm btn-default" onClick={this.showEditHostModel.bind(this,'add',false,'','')}>
                                </button>     
                                <button className="btn-delete btn btn-sm btn-default" onClick={this.deleteGroups.bind(this,this.sysGroupSelectAll=="0"?1:2,2)}>
                                </button>               
                            </div>
                            :
                            <div className="btn-group-search">
                                <span>操作：</span>
                                <button className="btn-apply-protection btn btn-sm btn-primary useless" >
                                    {/* 应用保护 */}
                                </button>
                                <button className="btn-pause-protection btn btn-sm btn-default useless" >
                                    {/* 暂停保护 */}
                                </button>
                                <button className="btn-apply-blocking btn btn-sm btn-default useless" >
                                    {/* 打开阻断 */}
                                </button>    
                                <button className="btn-stop-blocking btn btn-sm btn-default useless" >
                                    {/* 关闭阻断 */}
                                </button>
                                <button className="btn-create btn btn-sm btn-default" onClick={this.showEditHostModel.bind(this,'add',false,'','')}>
                                </button>     
                                <button className="btn-delete btn btn-sm btn-default useless">
                                </button>
                            </div>
                    }
                    </div>                    
                    {/*主机列表的表格*/}
                    <table className="hostlist-table grouplist-table">
                        <thead>
                            <tr>
                                <th className="hostlist-hostname">
                                    <input type="checkbox" id="hostlist-checkbox-all" className="custom-checkbox"></input>
                                    <label htmlFor="hostlist-checkbox-all" onClick={this.toggleSelectAll.bind(this)}></label>{/*自定义的复选框样式*/}
                                    组名称
                                    <i className={this.sortByHostname==0?"fa fa-angle-up":"fa fa-angle-down"} 
                                    aria-hidden="true" onClick={this.sortTable.bind(this,'hostname')}></i>
                                </th>
                                <th className="hostlist-hostip">
                                    创建时间
                                    <i className={this.sortByIP==0?"fa fa-angle-up":"fa fa-angle-down"} 
                                    aria-hidden="true" onClick={this.sortTable.bind(this,'ip')}></i>
                                </th>
                                {/* <th className="hostlist-description">备注</th> */}
                                <th className="hostlist-status">
                                    最后更改时间
                                    <i className={this.sortByStatus==0?"fa fa-angle-up":"fa fa-angle-down"} 
                                    aria-hidden="true" onClick={this.sortTable.bind(this,'status')}></i>
                                </th>
                                <th className="hostlist-status">
                                    备注
                                    <i className={this.sortByStatus==0?"fa fa-angle-up":"fa fa-angle-down"} 
                                    aria-hidden="true" onClick={this.sortTable.bind(this,'status')}></i>
                                </th>
                                <th className="hostlist-maintenance"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.grouplist && this.state.grouplist.map(function(groupDetail,index){
                                return (
                                    <tr className="hostlist-detail grouplist-detail" key={index}>
                                        <td className="hostlist-hostname">
                                            <input type="checkbox" id={"hostlist-checkbox-"+index} data-id={groupDetail.id} className="custom-checkbox" onClick={self.checkSelectAll.bind(self,2)}></input>
                                            <label htmlFor={"hostlist-checkbox-"+index}></label>{/*自定义的复选框样式*/}                                            
                                            {groupDetail.name}
                                        </td>
                                        <td className="hostlist-hostip">{groupDetail.createtime}</td>
                                        {/* <td className="hostlist-description">{hostDetail.description}</td> */}
                                        <td className="">{groupDetail.edittime}</td>
                                        <td className="">{groupDetail.remark}</td>
                                        
                                        <td className="hostlist-maintenance"
                                            onClick={self.showEditHostModel.bind(self,'edit',groupDetail.id,groupDetail.name,groupDetail.remark)}>
                                            <i className="fa fa-share-square-o" aria-hidden="true"></i>
                                            查看详情 >
                                        </td>
                                    </tr>
                                    )
                                })                                
                            }
                            {
                                ( !this.state.grouplist || !this.state.grouplist.length ) && <tr className="hostlist-detail"><td>当前没有匹配的数据。</td></tr>
                            }                            
                        </tbody>
                    </table>
                    {/*主机列表的页码*/}
                    <div className="pagination-all">
                        <Pagination 
                        prev={true} 
                        next={true} 
                        first={false} 
                        last={false} 
                        ellipsis={true} 
                        boundaryLinks={true} 
                        items={this.group_pageCount} 
                        maxButtons={7} 
                        activePage={this.group_currentPage} 
                        onSelect={this.handleGroupSelectPage.bind(this)}/>
                        {/*页码跳转输入框*/}
                        <div className="pageCount">
                            <input 
                            className="pageNum" 
                            id="grouplistPage" 
                            placeholder="输入" 
                            onChange={this.onGroupChangeInputPage.bind(this)}
                            onKeyDown={this.jumpGroupPageKeyDown.bind(this)}
                            />
                            <img 
                            className="searchNum" 
                            onClick={this.handleGroupJumpPage.bind(this)} src='/static/img/skip.svg'/>
                        </div>
                    </div>                    
                 </div>  
                }
                {
                    this.state.showEditHost &&
                    <EditHost
                        showEditHostModel={this.showEditHostModel.bind(this)}
                        operateHost = {this.state.operateHost}
                        sortField = {this.sortField}
                        searchRange = {this.searchRange}
                        operateHostId = {this.state.operateHostId}
                        operateHostName = {this.state.operateHostName}
                        operateHostRemark = {this.state.operateHostRemark}
                        title="编辑主机信息"
                    />
                }
                
                {/*运维配置弹窗*/}
                <Modal
                    id='maintainSettingModal'
                    className="diy-modal"
                    show={this.state.maintainSettingModal}
                    onEntered={this.setDraggable.bind(this, 'maintainSettingModal')}
                    onHide={this.hideMaintainSettingModal.bind(this)}
                    backdrop='static'>
                    <Modal.Header closeButton >
                        <Modal.Title id="header">运维配置</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="row-container">
                            <form>
                                <div>
                                    <div className="inline-container">
                                        <p className="form-label">选择运维配置文件</p>
                                        <input type="file" className="input-choose-file" onChange={this.selectApp.bind(this)} /> 
                                        <button className="btn btn-sm btn-primary btn-choose-file" type="button">选择文件</button>
                                    </div>
                                    <div className="inline-container">
                                        <p className="form-label">当前主机IP</p>
                                        <FormControl type="text" defaultValue={this.state.localIP} onChange={this.onChangeLocalIP.bind(this)}/>
                                    </div>
                                </div>                            
                            </form> 
                            <p className="hint-text">运维配置文件是一个在运维程序安装目录下的 ini 格式的文件。{this.state.filename?"已选中文件： "+this.state.filename:"当前未选择文件。"} </p>
                            <p className="hint-text">请确保您已下载并安装了运维程序。如未下载，请点击页面右上角“运维下载”，根据对应平台下载运维程序。</p>    
                        </div>                    
                    </Modal.Body>
                    <Modal.Footer>
                            <Button className="modalCancelBtn" bsSize="xs" onClick={this.hideMaintainSettingModal.bind(this)}>取消</Button>
                            <Button className="modalSubmitBtn" bsStyle="primary" bsSize="xs" onClick={this.submitMaintainSettingModal.bind(this,"maintainSettingMsg")}>确认</Button>                                                                     
                        <Col sm={12}>
                            <HelpBlock id="maintainSettingMsg"></HelpBlock>
                        </Col>
                    </Modal.Footer>
                </Modal>  
                {/*运维登录弹窗*/}
                <Modal
                    id='maintainLoginModal'
                    className="diy-modal"
                    show={this.state.maintainLoginModal}
                    onEntered={this.setDraggable.bind(this, 'maintainLoginModal')}
                    onHide={this.hideMaintainLoginModal.bind(this)}
                    backdrop='static'>
                    <Modal.Header closeButton >
                        <Modal.Title id="header">运维登录</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="host-info">
                            <p><label>主机别名：</label>{this.hostname}</p>
                            <p><label>IP：</label>{this.hostip}</p>
                            <p><label>备注：</label>{this.description}</p>
                        </div>  
                        <div className="row-container">
                            <form>
                                <div>
                                    <div className="inline-container">
                                        <p className="form-label">协议</p>
                                        <DropdownList
                                            listID="login-protocol"
                                            itemsToSelect={loginProtocols}
                                            itemDefault={{name:"SSH", value:"SSH"}}
                                            onSelect={(item)=> this.onChangeProtocol(item)}
                                            /> 
                                    </div>
                                    <div className="inline-container">
                                        <p className="form-label">端口号</p>
                                        <FormControl type="text" defaultValue={this.state.port} className="input-port" onChange={this.onChangePort.bind(this)}/>
                                    </div>
                                </div>                            
                                <p className="form-label">用户名</p>
                                <FormControl type="text" placeholder="请输入用户名" className="input-username" onChange={this.onChangeUsername.bind(this)}/>
                                <p className="form-label">密码</p>
                                <FormControl type="password" placeholder="请输入密码" className="input-password" onChange={this.onChangePassword.bind(this)}/>
                            </form> 
                            <div className="hint-block">
                                <p>注意事项：首次执行“运维登录”，请点击“保护控制”页面的右上角的“运维下载”，根据对应平台下载运维程序，并执行安装。</p>    
                            </div>                        
                        </div>                    
                    </Modal.Body>
                    <Modal.Footer>
                            <Button className="modalCancelBtn" bsSize="xs" onClick={this.hideMaintainLoginModal.bind(this)}>取消</Button>
                            {
                                this.state.port && this.state.username && this.state.password && this.os=="windows"?
                                    <a className="modalSubmitBtn" 
                                        href={"octa://"+this.state.username+"@"+this.hostip+"&"+this.state.port+"&"+this.state.password+"&"+window.location.host+"&"+ this.loginHostID +"/"} onClick={this.hideMaintainLoginModal.bind(this)} >确认</a>
                                    : 
                                    <Button className="modalSubmitBtn" bsStyle="primary" bsSize="xs" onClick={this.checkForm.bind(this,"submitMsg")}>确认</Button>    
                            }                                                                     
                        <Col sm={12}>
                            <HelpBlock id="submitMsg"></HelpBlock>
                        </Col>
                    </Modal.Footer>
                </Modal>  
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

