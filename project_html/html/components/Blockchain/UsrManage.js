import React from "react";
import $ from 'jquery';
import {Pagination} from 'react-bootstrap';
import AddNewUsrBox from './AddNewUsr.js';
import AddUsrAsset from './AddUsrAsset.js';
import SettingUsrMsg from './SettingUsrMsg.js';
import LoadingText from "../Commonality/LoadingText";
/* 区块链页面中的列表组件 */
export default class UsrManage extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            usrListDetail:false,//用户列表数据初始化
            showUrsDetail:false,//用户详情（点击某个用户时，获取详情）
            dataListAllPage:1,//总页码数
            currentListPageNum:1,//当前页码
            addNewUsr:false,//增加用户弹窗
            addNewUsrAssetBox:false,//用户新增资产弹窗
            addNewUsrAsset:{name:'',part:'',job:'',id:''},//用户新增资产传入用户参数
            settingUsrBox:false,//设置用户
            conformMsg:'',//AJAX返回信息
            settingUsrMsgList:{ //进入用户信息详情，编辑用户信息时传入的用户信息
                name:'',
                department:'',
                job:'',
                email:'',
                phone:'',
                photo:'',
            },
            settingUsrId:'',//设置用户 传入的id
            showActionLoading:false, //用户新建的时候的ajaxloading效果
            limitAccountLoading:false,//停用启用账户时的loading效果
            limitAccountText:'正在请求...',//停用启用账户时的loading提示
        }
    }
    /*
     * 获取用户列表
     * */
    getUsrList(page,pageSize){
        var self  = this;
        $.ajax({
            url: '/api/chain_user/query_list/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data:{
                page:page,
                pageSize:pageSize
            },
            success: function (data) {
                // console.log(JSON.stringify(data.count))
                var pageNum = data.count%10==0?data.count/10:parseInt(data.count/10)+1
                if(data.code==200){
                    self.setState({
                        usrListDetail:data.list,
                        dataListAllPage:pageNum,
                        currentListPageNum:page
                    })
                }
            }
        })
    }
    /*
     * TODO 点击展示用户详细信息 查询用户详细信息 交易信息暂时无
     * 传入用户user_id
     * */
    handleToggleDetail(user_id){
        // console.log(user_id)
        var self = this;
        $.ajax({
            url: '/api/chain_user/query_detail/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data:{
                user_id:user_id
            },
            success: function (data) {
                // console.log(JSON.stringify(data.user_detail.photo))
                if(data.code==200){
                    self.setState({
                        showUrsDetail:data.user_detail,
                        settingUsrId:user_id,
                        settingUsrMsgList:{
                            name:data.user_detail.username,
                            department:data.user_detail.department,
                            job:data.user_detail.job,
                            email:data.user_detail.email,
                            phone:data.user_detail.phone,
                            photo:data.user_detail.photo || "/static/img/Avatar.png",
                        },
                        usrListDetail:false //移除用户列表
                    })
                }
            }
        })
    }
    /*
     * 点击新建用户
     * */
    handleAddUsrBox(){
        this.setState({
            addNewUsr:true
        })
    }
    /*
     * 点击关闭新建用户
     * */
    handleCloseAddUsrBox(){
        this.setState({
            addNewUsr:false,
            conformMsg:''
        })
    }
    /*
     * 取消新建用户
     * */
    handleCancelAddUsr(){
        this.setState({
            addNewUsr:false,
            conformMsg:''
        })
    }
    /*
     * 确认新建用户
     * */
    handleConformAddUsr(){
        var name = $('input.usrNameAdd').val();
        var email = $('input.usrEmailAdd').val();
        var phone = $('input.usrPhoneAdd').val();
        var part = $('input.usrPartAdd').val();
        var job = $('input.usrJobAdd').val();
        var self = this;
        var re = /^[\u4e00-\u9fa5_a-zA-Z0-9]{2,20}/
        var emailRe = /^[A-Za-z\d]+([-_.][A-Za-z\d]+)*@([A-Za-z\d]+[-.])+[A-Za-z\d]{2,4}$/
        var phoneRe = /^1[3|4|5|7|8][0-9]\d{4,8}$/
        var formData = new FormData();
        formData.append('username',name);
        formData.append('email',email);
        formData.append('phone',phone);
        formData.append('job',job);
        formData.append('department',part);
        formData.append('file',$('#uploadFileForm .uploadImg')[0].files[0]);
        if(name==''){
            this.setState({
                conformMsg:'请输入用户名'
            })
        }
        else if(part==''){
            this.setState({
                conformMsg:'请选择部门'
            })
        }
        else if(job==''){
            this.setState({
                conformMsg:'请选择职位'
            })
        }
        else if(email==''){
            this.setState({
                conformMsg:'请输入邮箱'
            })
        }
        else if(phone==''){
            this.setState({
                conformMsg:'请输入电话'
            })
        }
        else if(!re.test(name)){
            this.setState({
                conformMsg:'用户名规则：请输入2-18位数字字母汉字'
            })
        }
        else if(!emailRe.test(email)){
            this.setState({
                conformMsg:'请输入正确的邮箱'
            })
        }
        else if(!phoneRe.test(phone)){
            this.setState({
                conformMsg:'请输入正确的手机号码'
            })
        }
        else{
            this.setState({
                showActionLoading:true,
            })
            $.ajax({
                url: '/api/chain_user/add/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                contentType: false,
                processData: false,
                data:formData,
                error:function () {
                    self.setState({
                        conformMsg:'新建失败',
                        showActionLoading:false,
                    })
                },
                success: function (data) {
                    //console.log(JSON.stringify(data))
                    if(data.code==200){
                        self.getUsrList() //刷新用户列表
                        self.setState({
                            addNewUsr:false,
                            conformMsg:'',
                            showActionLoading:false,
                        })
                    }else {
                        self.setState({
                            conformMsg:'新建失败',
                            showActionLoading:false,
                        })
                    }
                }
            })
        }
    }
    /*
     *点击用户新建资产
     * */
    handleAddUsrAssets(name,part,job,id,e){
        e.stopPropagation();
        var addNewUsrAsset = {
            name:name,
            part:part,
            job:job,
            id:id
        }
        this.setState({
            addNewUsrAsset:addNewUsrAsset,
            addNewUsrAssetBox:true
        })
    }
    /*
     * 关闭用户新建资产
     * */
    handleCloseAddUsrAssets(e){
        e.stopPropagation();//阻止继承父元素点击事件
        this.setState({
            addNewUsrAssetBox:false,
            conformMsg:''
        })
    }
    /*
     * 取消用户新建资产
     * */
    handleCancelAddUsrAsset(){
        this.setState({
            addNewUsrAssetBox:false,
            conformMsg:''
        })
    }
    /*
     * 确认用户新建资产
     * */
    handleConformUsrAsset(){
        // console.log(this.state.addNewUsrAsset.id)
        // console.log($('input.addNewUsrAssetTypeKey').attr('title'))
        // console.log($('input.addNewUsrAssetNum').val())
        var user_id = this.state.addNewUsrAsset.id; //传入用户id
        var type = $('input.addNewUsrAssetTypeKey').attr('title'); //传入创建资产类型
        var asset = $('input.addNewUsrAssetNum').val() //传入创建资产内容
        var formData = new FormData();
        formData.append('user_id',user_id);
        formData.append('type',type);
        formData.append('asset',asset);
        formData.append('file',$('#uploadFileForm .addFileBox')[0].files[0]);
        var self = this;
        if(type==''){
            self.setState({
                conformMsg:'请选择创建资产类型'
            })
        }
        else if(asset==''&&$('#uploadFileForm .addFileBox')[0].files[0]==undefined){
            self.setState({
                conformMsg:'请选择创建资产内容'
            })
        }
        else{
            self.setState({
                showActionLoading:true,
            })
            $.ajax({
                url: '/api/chain/create/',
                type: 'POST',
                cache: false,
                dataType: 'json',
                contentType: false,
                processData: false,
                data:formData,
                error:function(){
                    self.setState({
                        conformMsg:'创建失败',
                        showActionLoading:false,
                    })
                },
                success: function (data) {
                    // console.log(JSON.stringify(data))
                    if(data.code==200){
                        self.setState({
                            addNewUsrAssetBox:false,
                            conformMsg:'',
                            showActionLoading:false,
                        })
                    }else{
                        self.setState({
                            conformMsg:'创建失败',
                            showActionLoading:false,
                        })
                    }
                }
            })
        }
    }
    /*
     * 点击面包屑回到用户列表
     * */
    handleBackUsrList(){
        this.getUsrList()
        this.setState({
            showUrsDetail:false,
            // usrListDetail:true
        })
    }
    /*
     * 拷贝公匙/私匙
     * 传入公匙/私匙的id
     * */
    handleCopyKey(id){
        var copyItem=document.getElementById(id);
        copyItem.select(); // 选择对象
        document.execCommand("Copy"); // 执行浏览器复制命令
    }
    /*
     * 修改用户
     * */
    handleSettingUsrMsg(){
        this.setState({
            settingUsrBox:true
        })
    }
    /*
     * 关闭修改用户
     * */
    handleCloseSetUsrBox(){
        this.setState({
            settingUsrBox:false,
            conformMsg:''
        })
    }
    /*
     * 取消修改用户
     * */
    handleCancelSetUsr(){
        this.setState({
            settingUsrBox:false,
            conformMsg:''
        })
    }
    /*
     * 确认修改用户
     * */
    handleConformSetUsr(){
        var self  = this;
        var name = $('.usrNameAdd').val();
        var department = $('.usrPartAdd').val();
        var job = $('.usrJobAdd').val();
        var email = $('.usrEmailAdd').val();
        var phone = $('.usrPhoneAdd').val();
        var re = /^[\u4e00-\u9fa5_a-zA-Z0-9]{1,20}/
        var phoneRe = /^((\+86)|(0086)|0)?(13[0-9]|15[012356789]|17[013678]|18[0-9]|14[57])[0-9]{8}$/
        var formData = new FormData();
        formData.append('user_id',this.state.settingUsrId);
        formData.append('user',name);
        formData.append('email',email);
        formData.append('phone',phone);
        formData.append('job',job);
        formData.append('department',department);
        formData.append('file',$('#uploadFileForm .uploadImg')[0].files[0]);
        if(!re.test(department)){
            this.setState({
                conformMsg:'请输入正确的部门'
            })
        }else if(!re.test(job)){
            this.setState({
                conformMsg:'请输入正确的职位'
            })
        }else if(!phoneRe.test(phone)){
            this.setState({
                conformMsg:'请输入正确的手机号码'
            })
        }
        else{
            self.setState({
                showActionLoading:true,
            })
            $.ajax({
                url: '/api/chain_user/modify/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                contentType: false,
                processData: false,
                data:formData,
                success: function (data) {
                    // console.log(JSON.stringify(data))
                    if(data.code==200){
                        self.setState({
                            settingUsrBox:false,
                            showUrsDetail:false,
                            showActionLoading:false,
                        })
                        //重新更新用户列表
                        self.getUsrList(1,10)
                    }else{
                        self.setState({
                            conformMsg:'修改失败',
                            showActionLoading:false,
                        })
                    }
                },
                error:function (data) {
                    self.setState({
                        conformMsg:'修改失败',
                        showActionLoading:false,
                    })
                }
            })
        }
    }
    /*
     * todo 搜索用户
     * */
    handleSearchUsrMsg(page,pageSize){
        var search = $('.searchUsrPutIn').val();
        var self  = this;
        self.setState({
            usrListDetail:false
        })
        $.ajax({
            url: '/api/chain_user/query_list/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data:{
                page:page,
                pageSize:pageSize,
                search:search
            },
            error:function () {
                self.setState({
                    usrListDetail:[],
                    dataListAllPage:pageNum,
                    currentListPageNum:page
                })
            },
            success: function (data) {
                // console.log(JSON.stringify(data.count))
                var pageNum = data.count%10==0?data.count/10:parseInt(data.count/10)+1
                if(data.code==200){
                    self.setState({
                        usrListDetail:data.list,
                        dataListAllPage:pageNum,
                        currentListPageNum:page
                    })
                    $('.searchUsrPutIn').val("")
                }else {
                    self.setState({
                        usrListDetail:[],
                        dataListAllPage:pageNum,
                        currentListPageNum:page
                    })
                }
            }
        })
    }
    /*
     * 页码点击以及翻页
     * */
    handleChangePage(eventKey){
        this.setState({
            currentListPageNum:eventKey,//当前页码
            usrListDetail:false,
        })
        this.getUsrList(eventKey,10);
    }
    /*
     * 页码输入处理
     */
    handleEnterPage(e) {
        var re = /^[0-9]+$/;
        var indexCurrent = parseInt($(e.target).val())
        if (!re.test($(e.target).val())) {
            $(e.target).val('')
        }
        if (indexCurrent > this.state.dataListAllPage) {
            $(e.target).val(this.state.dataListAllPage)
        }
        if (indexCurrent <= 0) {
            $(e.target).val('')
        }
        if (e.keyCode == 13 && re.test($(e.target).val())) {    // 分页input回车
            this.setState({
                usrListDetail:false,
                currentListPageNum:indexCurrent
            })
            this.getUsrList(indexCurrent,10);
        }
    }
    /*
     * 点击页码跳转icon
     * */
    handleJumpPage(){
        var indexCurrent = parseInt($('#pageJumpNum').val());
        this.setState({
            usrListDetail:false,
            currentListPageNum:indexCurrent
        })
        this.getUsrList(indexCurrent,10);
    }
    //^/api/chain_user/switch/
    switchAccount(user_id,is_active,e){
        e.stopPropagation()
        var active
        if(is_active==2||is_active==0){
            active = 1;
        }else{
            active = 2;
        }
        this.setState({
            limitAccountLoading:true,
            limitAccountText:'正在请求...'
        })
        var self = this
        $.ajax({
            url: '/api/chain_user/switch/',
            type: 'POST',
            dataType: 'json',
            data:{
                user_id:user_id,
                is_active:active
            },
            success: function (data) {
                // console.log(JSON.stringify(data))
                if(data.code==200){
                    self.setState({
                        limitAccountLoading:false,
                        limitAccountText:'请求成功'
                    })
                    self.getUsrList(self.state.currentListPageNum,10)
                }else{
                    self.setState({
                        limitAccountText:data.results
                    })
                }
                setTimeout(function(){
                    self.setState({
                        limitAccountLoading:false,
                    })
                },2000)
            },
            error:function (data) {
                self.setState({
                    limitAccountText:'请求失败'
                })
                setTimeout(function(){
                    self.setState({
                        limitAccountLoading:false,
                    })
                },2000)
            }
        })
    }
    componentWillMount(){
        this.getUsrList(1,10)
    }
    componentDidMount(){
    }
    render(){
        return (
            <div style={{display:this.props.tabKey=='3'?'block':'none'}}>
                <h2 className="block-chain-sec-title">
                    <b onClick={this.handleBackUsrList.bind(this)}>用户列表</b>
                    {
                        this.state.showUrsDetail&&
                        <span>
                            <b className="the-select-usr">›  {this.state.showUrsDetail.username}</b>
                            <i className="setting-icon"
                               onClick={this.handleSettingUsrMsg.bind(this)}><img src="/static/img/setting-usr-icon.png" alt=""/>{/*todo 用户设置*/}</i>
                        </span>
                    }
                </h2>
                <div className="datalistTitle" style={{display:this.state.usrListDetail?'block':'none'}}>
                    {
                        this.state.limitAccountLoading &&
                        <div className="loadingAccount">
                            <i className="fa fa-spinner fa-spin fa-4x" style={{color:'#007AE1'}}></i> <br/>
                            <p className="errorMsg">{this.state.limitAccountText}</p>
                        </div>
                    }

                    {/*暂时先注释掉新增用户*/}
                    {/*<button className="addNewDeal plugAction" onClick={this.handleAddUsrBox.bind(this)}>新增用户</button>*/}
                    <div className="searchPlugin deal-search">
                        <input type="text" placeholder="搜索用户" className="searchUsrPutIn"/>
                        <button className="searchGo plugAction" onClick={this.handleSearchUsrMsg.bind(this,1,10)}>搜索</button>
                    </div>
                    <table className="databaseHostList  chainDealTitle" >
                        <thead>
                        <tr>
                            <th>用户</th>
                            <th>部门</th>
                            <th>职位</th>
                            <th>交易笔数</th>
                            <th>停用/启用账户</th>
                        </tr>
                        </thead>
                    </table>
                    {
                        !this.state.usrListDetail &&
                        <LoadingText/>
                    }
                    {
                        this.state.usrListDetail&&this.state.usrListDetail.map(function(data,index){
                            // console.log("/static/"+(data.photo==null)?"img/Avatar.png":data.photo)
                            return (
                                <div className="dataList-content currentDealTab" key = {index}>
                                    <table className="databaseHostList">
                                        <tbody>
                                        <tr onClick={this.handleToggleDetail.bind(this,data.id)}>
                                            <td className="singleTab">
                                                {/*<img src="/static/img/Avatar.png" alt="" className="usr-msg-imgIcon"/>*/}
                                                <img src={(data.photo==null)?"/static/img/Avatar.png":data.photo} alt="" className="usr-msg-imgIcon"/>
                                                {data.username}</td>
                                            <td>{data.department}</td>
                                            <td>{data.job}</td>
                                            <td>{data.tran_count}</td>
                                            <td>
                                                <button className={data.is_active==1?'limitAccount':'limitAccount accountForbidden'}
                                                        onClick={this.switchAccount.bind(this,data.id,data.is_active)}>
                                                    {data.is_active==1?'停用':'启用'}</button></td>
                                            {/*<td className="addNewAsset"*/}
                                                {/*onClick={this.handleAddUsrAssets.bind(this,data.username,data.department,data.job,data.id)}>*/}
                                                {/*<i className="addNewAssetIcon">＋</i>创建资产</td>*/}
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )
                        }.bind(this))
                    }
                    <div className="pagination-all">
                        <Pagination prev={true} next={true} first={false} last={false} ellipsis={true} boundaryLinks={true} items={this.state.dataListAllPage}
                                    activePage={this.state.currentListPageNum} maxButtons={7} onSelect={this.handleChangePage.bind(this)}/>
                        <div className="pageCount">
                            <input className="pageNum"  id = "pageJumpNum" placeholder="输入" onKeyUp={this.handleEnterPage.bind(this)} onKeyDown={this.handleEnterPage.bind(this)}/>
                            <img className="searchNum"　src='/static/img/skip.svg' onClick={this.handleJumpPage.bind(this)}/>
                        </div>
                    </div>
                </div>
                {
                    !this.state.showUrsDetail && !this.state.usrListDetail &&
                    <LoadingText/>
                }
                {
                    this.state.showUrsDetail &&
                    <div className="usrDetail">
                        <div className="usrMsg clearfix usrDetail-msg">
                            <img src={this.state.showUrsDetail.photo==null?"/static/img/Avatar.png":this.state.showUrsDetail.photo} alt="" className="big-img-lt"/>
                            <span className="icon-seeMore"></span>
                            <div className="rightMsg">
                                <h1>{this.state.showUrsDetail.username}</h1>
                                <h3></h3>
                                <div className="msgList clearfix">
                                    <div className="msg-lt">
                                        <p>职位 : <i>{this.state.showUrsDetail.job}</i> </p>
                                        <p>部门 : <i>{this.state.showUrsDetail.department}</i> </p>
                                        {/*<p>当前资产 : <i>{this.state.showUrsDetail.tran_count}</i> </p>*/}
                                    </div>
                                    <div className="msg-rt">
                                        {/*<p>&nbsp;</p>*/}
                                        <p className="msg-email">邮箱 : <i>{this.state.showUrsDetail.email}</i></p>
                                        <p className="msg-phone">电话 : <i>{this.state.showUrsDetail.phone}</i></p>
                                    </div>
                                </div>
                                <div className="usr-key clearfix">
                                    {/*<button className="plugAction btn-create-key">todo 生成密钥</button>*/}
                                    <div className="copy-key">
                                        <input type="text" readOnly value={this.state.showUrsDetail.public_key} id="public_key"/>
                                        <button className="plugAction btn-copy-key"
                                                onClick={this.handleCopyKey.bind(this,'public_key')}>拷贝公钥</button>
                                    </div>
                                    <div className="copy-key">
                                        <input type="text" readOnly value={this.state.showUrsDetail.private_key} id="private_key"/>
                                        <button className="plugAction btn-copy-key"
                                                onClick={this.handleCopyKey.bind(this,'private_key')}>拷贝私钥</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {
                            this.state.showUrsDetail.dealList&&
                            <div className="UsrDealList">
                                <h2 className="block-chain-sec-title">交易记录</h2>
                                <div className="datalistTitle">
                                    <table className="databaseHostList chainDealTitle" >
                                        <thead>
                                        <tr>
                                            <th>业务类型</th>
                                            <th>交易内容</th>
                                            <th>交易时间</th>
                                        </tr>
                                        </thead>
                                    </table>
                                </div>
                                {this.state.showUrsDetail.dealList.map(function (data,index) {
                                    return(
                                        <div className="dataList-content currentDealTab" key = {index}>
                                            <table className="databaseHostList">
                                                <tbody>
                                                <tr>
                                                    <td className="singleTab">{data.type}</td>
                                                    <td>{data.asset}</td>
                                                    <td>{data.time}</td>
                                                </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    )
                                })}
                            </div>
                        }
                    </div>
                }
                {
                    this.state.addNewUsr&&
                    <AddNewUsrBox
                        showActionLoading = {this.state.showActionLoading}
                        handleCloseAddUsrBox = {this.handleCloseAddUsrBox.bind(this)}
                        conformMsg = {this.state.conformMsg}
                        handleCancelAddUsr = {this.handleCancelAddUsr.bind(this)}
                        handleConformAddUsr = {this.handleConformAddUsr.bind(this)}
                    />
                }
                {
                    this.state.addNewUsrAssetBox &&
                    <AddUsrAsset
                        showActionLoading = {this.state.showActionLoading}
                        addNewUsrAsset = {this.state.addNewUsrAsset}
                        handleCloseAddUsrAssets = {this.handleCloseAddUsrAssets.bind(this)}
                        handleCancelAddUsrAsset = {this.handleCancelAddUsrAsset.bind(this)}
                        handleConformUsrAsset = {this.handleConformUsrAsset.bind(this)}
                        conformMsg = {this.state.conformMsg}
                    />
                }
                {
                    this.state.settingUsrBox&&
                    <SettingUsrMsg
                        showActionLoading = {this.state.showActionLoading}
                        settingUsrMsgList = {this.state.settingUsrMsgList}
                        handleCloseSetUsrBox = {this.handleCloseSetUsrBox.bind(this)}
                        handleCancelSetUsr = {this.handleCancelSetUsr.bind(this)}
                        handleConformSetUsr = {this.handleConformSetUsr.bind(this)}
                        conformMsg = {this.state.conformMsg}
                    />
                }
            </div>
        )
    }
}
