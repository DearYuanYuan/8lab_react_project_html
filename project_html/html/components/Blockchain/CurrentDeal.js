import React from "react";
import $ from 'jquery';
import {Pagination} from 'react-bootstrap';
import AddAssets from './AddAssets.js'
import TransAssets from './TransAssets.js'
import LoadingText from "../Commonality/LoadingText";
/* 区块链页面中的列表组件 */
export default class CurrentDeal extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            chainListDetail:[],//区块链列表数据初始化
            dataListAllPage:1,//总页码数
            currentListPageNum:1,//当前页码
            dealDetailList:false,//单个列表点击展示区块链交易过程
            addAssetsBox:false, //新增资产弹框
            transAssetsBox:false,//资产转移弹框
            transUrsId:'',//资产拥有者id
            transUrsName:'', //资产拥有者name
            transUrsType:'',//资产转移类型
            transUrsAsset:'',//资产转移的内容
            transFileName:'',//资产转移的文件
            addUrsId:'',//创建资产拥有者id
            addUrsName:'', //创建资产拥有者name
            addUrsType:'',//创建资产转移类型
            conformMsg:'',//新建或者转移资产确认时，后台返回结果
            getUsrList:[],//用户列表
            getTypeList:[],//资产类型列表
            showActionLoading:false, //资产转移、新建的时候的ajaxloading效果

        }
    }

    /*
    * 获取资产类型列表
    * */
    getAssetsType(){
        var self  = this;
        $.ajax({
            url: '/api/chain/query_tran_types/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function (data) {
                //console.log(JSON.stringify(data))
                if(data.code==200){
                    self.setState({
                        getTypeList:data.results
                    })
                }
            }
        })
    }
    /*
     * 获取用户列表
     * */
    getUsrLists(){
        var self  = this;
        $.ajax({
            url: '/api/chain_user/query_all/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function (data) {
                //console.log(JSON.stringify(data.list))
                if(data.code==200){
                    self.setState({
                        getUsrList:data.list
                    })
                }
            }
        })
    }
    loadChainDeal(pageNum,pageSize){
        var self  = this;
        $.ajax({
            url: '/api/chain/trans_lists/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data:{
                page:pageNum,
                page_size:pageSize
            },
            success: function (data) {
                // console.log(JSON.stringify(data.data))
                var pages = parseInt(data.count/10)+((data.count%10)!=0?1:0)
                if(data.code==200){
                    self.setState({
                        dealDetailList:data.data,
                        dataListAllPage:pages
                    })
                    $('#pageJumpNum').val('') //清空页码
                }else {
                    self.setState({
                        dealDetailList:[],
                        dataListAllPage:0
                    })
                    $('#pageJumpNum').val('') //清空页码
                }
            }
        })
    }

    /*
    * 点击显示交易过程
    * */
    handleToggleDetail(index,id){
        if($('.currentDealTab').eq(index).find('div.currentDealCover').css('display')=='none'){
            var self  = this;
            $.ajax({
                url: '/api/chain/trans_detail/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                data:{
                    asset_id:id
                },
                success: function (data) {
                    var historyList=self.state.dealDetailList;
                    if(data.code==200){
                        historyList[index].detail = data.detail
                        self.setState({
                            dealDetailList:historyList
                        })
                    }else{
                        historyList[index].detail = []
                        self.setState({
                            dealDetailList:historyList
                        })
                    }

                },
                error:function () {
                    var historyList = self.state.dealDetailList;
                    historyList[index].detail = []
                    self.setState({
                        dealDetailList:historyList
                    })
                }
            })
        }

        $('.currentDealTab').eq(index).find('div.currentDealCover').slideToggle(200);

    }
    /*
    * 点击显示交易人的信息卡片
    * */
    handleShowMoreMsg(index,eq){
        var self = $('.currentDealTab').eq(index)
        self.find('div.currentDeal').eq(eq).find('div.usrMsg').slideToggle(200)

        self.siblings('div.currentDealTab').find('div.currentDeal').find('div.usrMsg').hide(200)
        self.find('div.currentDeal').eq(eq).siblings('div.currentDeal').find('div.usrMsg').hide(200)
        // find('div.usrMsg').hide(200)
    }
    /*
    * 点击展示个人详细信息的时候做处理，防止点击信息卡片，信息卡片消失
    * */
    handleBuble(e){
        e.stopPropagation();
    }
    /*
    * 页码点击以及翻页
    * */
    handleChangePage(eventKey){
        this.setState({
            currentListPageNum:eventKey,//当前页码
            dealDetailList:false,
        })
        this.loadChainDeal(eventKey,10);
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
                currentListPageNum:indexCurrent,
                dealDetailList:false,
            })
            this.loadChainDeal(indexCurrent,10);
            $(e.target).val('')
        }
    }
    /*
    * 点击页码跳转icon
    * */
    handleJumpPage(){
        var indexCurrent = parseInt($('#pageJumpNum').val());
        this.setState({
            currentListPageNum:indexCurrent,
            dealDetailList:false,
        })
        this.loadChainDeal(indexCurrent,10);
    }
    /*
    * 点击资产转移
    * txId:资产拥有者id
    * txName:资产拥有者的姓名
    * txType：资产转移类型
    * asset：资产转移asset
    *
    * 传参：asset：资产，file：附件，Type：资产转移类型
    * */
    handelTransDeal(asset,file,type,e){
        e.stopPropagation() //阻止父元素点击事件
        // console.log(file)
        var txId = $(e.target).parent('li').attr('title')

        var txName = $(e.target).parent('li').attr('name')
        // console.log(txName)
        this.setState({
            transAssetsBox:true,
            transUrsId:txId,
            transUrsName:txName,
            transUrsAsset:asset,
            transUrsType:type,
            transFileName:file, //附件
        })
    }
    /*
    * 关闭资产转移弹框
    * */
    handleCloseTransAssets(){
        this.setState({
            transAssetsBox:false,
            conformMsg:''
        })
    }
    /*
    * 取消资产转移
    * */
    handleCancelTrans(){
        this.setState({
            transAssetsBox:false,
            conformMsg:''
        })
    }
    /*
    * 确认资产转移
    * 传入资产转移id（拥有者的id:this.state.transUrsId
    * 传入被转移者的id: $('.transUsrName').attr('name')
    * */
    handleConformTrans(){
        //传入资产转移id（拥有者的id）this.state.transUrsId
        //console.log(this.state.transUrsId)
        //传入被转移者的id
        var transId = $('.transUsrName').attr('name');
        //console.log(transId)
        var self = this;
        self.setState({
            showActionLoading:true,
        })
        $.ajax({
            url: '/api/chain/transfer/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data:{
                tx_id:self.state.transUrsId, //传入资产转移id（拥有者的id）
                next_user_id:transId //传入被转移者的id
            },
            error:function(){
                self.setState({
                    conformMsg:'转移失败',
                    showActionLoading:false,
                })
            },
            success: function (data) {
                //console.log(JSON.stringify(data))
                if(data.code==200){
                    self.setState({
                        transAssetsBox:false,
                        showActionLoading:false,
                    })
                    self.loadChainDeal(1,10);//重新渲染交易列表
                }else{
                    self.setState({
                        conformMsg:'转移失败',
                        showActionLoading:false,
                    })
                }
            }
        })

    }
    /*
    * 新增资产
    * */
    handleAddAssets(){
        //获取用户列表
        this.getUsrLists();
        //console.log(this.state.getUsrList)
        this.setState({
            addAssetsBox:true
        })
    }
    /*
    * 关闭新增资产弹框
    * */
    handleCloseAddAssets(){
        this.setState({
            addAssetsBox:false,
            conformMsg:''
        })
    }
    /*
    * 取消新增资产
    * */
    handleCancelAdd(){
        this.setState({
            addAssetsBox:false,
            conformMsg:''
        })
    }
    /*
    * 确认新增资产
    * */
    handleConformAdd(){
        var txId = $('.addNameBox').attr('title')
        var txType = $('.addTypeBox').attr('title')
        var asset = $('.addNumBox').val()
        var formData = new FormData();
        formData.append('user_id',txId);
        formData.append('type',txType);
        formData.append('asset',asset);
        formData.append('file',$('#uploadFileForm .addFileBox')[0].files[0]);
        // console.log($('#uploadFileForm .addFileBox')[0].files[0]==undefined)
        if(txId==''){
            this.setState({
                conformMsg:'请选择用户'
            })
        }else if(txType==''){
            this.setState({
                conformMsg:'请选择资产类型'
            })
        }else if(asset==''&&$('#uploadFileForm .addFileBox')[0].files[0]==undefined){
            this.setState({
                conformMsg:'请输入资产内容'
            })
        }else{
            var self  = this;
            self.setState({
                showActionLoading:true,
            })
            $.ajax({
                url: '/api/chain/create/',
                type: 'POST',
                dataType: 'json',
                cache: false,
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
                    // console.log(data)
                    if(data.code==200){
                        self.setState({
                            // getUsrList:data.list,
                            addAssetsBox:false,
                            conformMsg:'',
                            showActionLoading:false,
                        })
                        self.loadChainDeal(1,10);//重新渲染交易列表
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
    * todo 下载附件
    * */
    handleDownLoadFile(assetId,e){
        e.stopPropagation()
        // var self = this;
        $.ajax({
            url: '/api/chain/down_tran_att/',
            type: 'GET',
            cache: false,
            dataType: 'json',
            data:{
                asset_id:assetId, //传入资产id
            },
            error:function(){

            },
            success: function (data) {
                if(data.code==200){
                    var link = document.createElement('a'); //创建事件对象
                    link.setAttribute('href', data.url);
                    link.setAttribute("download", '');
                    var event = document.createEvent("MouseEvents"); //初始化事件对象
                    event.initMouseEvent("click", true, true, document.defaultView, 0, 0, 0, 0, 0, false, false, false, false, 0, null); //触发事件
                    link.dispatchEvent(event);
                }
            }
        })
    }

    /*
    * todo 搜索交易或用户
    * */
    handleSearchListOrUsr(){

    }
    componentWillMount(){
        this.loadChainDeal(1,10);
        //获取用户列表
        this.getUsrLists();
        //获取资产类型列表
        this.getAssetsType()
    }
    componentDidMount(){
        // console.log(this.state.dealDetailList)
    }
    render(){
        return (
            <div style={{display:this.props.tabKey=='2'?'block':'none'}}>
                <h2 className="block-chain-sec-title">当前交易</h2>
                <div className="datalistTitle">
                    {/*暂时先注释掉新建资产*/}
                    {/*<button className="addNewDeal plugAction" onClick={this.handleAddAssets.bind(this)}>新增资产</button>*/}
                    {/*<div className="searchPlugin deal-search">*/}
                        {/*<input type="text" placeholder="todo 搜索交易或用户"/>*/}

                        {/*<button className="searchGo plugAction" onClick={this.handleSearchListOrUsr.bind(this)}>搜索</button>*/}
                    {/*</div>*/}
                    <table className="databaseHostList chainDealTitle" >
                    <thead>
                    <tr>
                        {/*<th>区块高度</th>*/}
                        {/*<th>交易哈希值</th>*/}
                        <th>业务类型</th>
                        {/*<th>交易类型</th>*/}
                        {/*<th>交易发起方</th>*/}
                        <th>证实状态</th>
                        <th>交易内容</th>
                        <th>交易时间</th>
                        <th>附件</th>
                    </tr>
                    </thead>
                    </table>
                </div>
                {
                    !this.state.dealDetailList &&
                    <LoadingText/>
                }
                {
                    this.state.dealDetailList && this.state.dealDetailList.map(function(data,index){
                        return (
                            <div className="dataList-content currentDealTab" key = {index}>
                                <table className="databaseHostList" >
                                    <tbody>
                                    {
                                        data.confirm_status == 0 &&
                                        <tr>
                                            <td className="assets-not-Confirm">
                                                <p><b>
                                                    <i className="fa fa-spinner fa-spin"
                                                       style={{color:'#fff',margin:'0 8px',cursor:'pointer'}}></i>资产正在证实请稍后</b></p>
                                                <p>后台有资产正在证实，稍后您可通过刷新页面查看证实情况。</p>
                                            </td>
                                        </tr>

                                    }
                                    {
                                        data.confirm_status != 0 &&
                                        <tr onClick={this.handleToggleDetail.bind(this,index,data.id)}>
                                            <td>{data.type}</td>
                                            <td>
                                                {
                                                    data.confirm_status == 1&&
                                                    <b>
                                                        <i className="fa fa-check-circle"
                                                           style={{color:'#007ae1',margin:'0 8px',cursor:'pointer'}}></i>证实成功</b>
                                                }
                                                {
                                                    data.confirm_status == 2&&
                                                    <b>
                                                        <i className="fa fa-times-circle"
                                                           style={{color:'#CB4B4B',margin:'0 8px',cursor:'pointer'}}></i>证实失败</b>
                                                }
                                            </td>
                                            <td>{data.asset}</td>
                                            <td>{data.time}</td>
                                            <td>
                                                <p>{data.filename}
                                                    {
                                                        data.filename!='' &&

                                                        <i className="fa fa-download" style={{color:'#007ae1',margin:'0 0 0 8px',cursor:'pointer'}}
                                                           onClick={this.handleDownLoadFile.bind(this,data.id)}
                                                        ></i>

                                                    }
                                                </p></td>
                                        </tr>
                                    }

                                    </tbody>
                                </table>
                                <div className="showDatabaseHostList currentDealCover clearfix" >
                                {
                                    !data.detail &&
                                    <LoadingText/>
                                }

                                <div className="leftDealDetail">
                                    <ul>
                                        <li>
                                            <h4 className="detailTitle">资产内容</h4>
                                            <p className="detailContent">{data.asset}</p>
                                        </li>
                                        <li>
                                            <h4 className="detailTitle">附件</h4>
                                            <p className="detailContent">{data.filename}
                                                {
                                                    data.filename!='' &&

                                                    <i className="fa fa-download" style={{color:'#007ae1',margin:'0 0 0 8px',cursor:'pointer'}}
                                                       onClick={this.handleDownLoadFile.bind(this,data.id)}
                                                    ></i>

                                                } </p>
                                        </li>
                                        <li>
                                            <h4 className="detailTitle">证实状态</h4>
                                            <p className="detailContent">
                                                {
                                                    data.confirm_status == 1&&
                                                    <b>
                                                        <i className="fa fa-check-circle"
                                                           style={{color:'#007ae1',margin:'0 8px',cursor:'pointer'}}></i>证实成功</b>
                                                }
                                                {
                                                    data.confirm_status == 2&&
                                                    <b>
                                                        <i className="fa fa-times-circle"
                                                           style={{color:'#CB4B4B',margin:'0 8px',cursor:'pointer'}}></i>证实失败</b>
                                                }
                                            </p>
                                        </li>
                                    </ul>


                                </div>

                                {
                                    data.detail && data.detail.map(function (list, eq) {
                                        var len = data.detail.length-1;
                                        return (
                                            <div className="currentDeal clearfix" key={eq}>
                                                <div className="rightDealDetail" onClick={this.handleShowMoreMsg.bind(this,index,eq)}>
                                                    <ul className="clearfix">
                                                        <li className={(eq==0)?"dealStatus lastDealStatus":"dealStatus "}><i></i></li>
                                                        <li>
                                                            <img src={(list.photo==null)?"/static/img/Avatar.png":list.photo} alt=""/>
                                                        </li>
                                                        <li>用户：{list.username}{/*<span className="dealDetails"></span>*/}</li>
                                                        <li>职位：{list.job}</li>
                                                        <li>部门：{list.department}</li>
                                                        {/*<li>附件：{data.filename}</li>*/}
                                                        {/*<li>交易份额：88.6</li>*/}
                                                        {/*<li>节点：127.0.0.1</li>*/}
                                                        {/*<li className={(eq==0)?"trans-deal activity":'trans-deal'}*/}
                                                            {/*title = {list.tx_id}*/}
                                                            {/*name = {list.username}*/}
                                                            {/*onClick={(eq==0)?this.handelTransDeal.bind(this,data.asset,data.filename,data.type):false}*/}
                                                            {/*><i>→</i>转移该资产</li>*/}
                                                        <li className={(eq==0)?"dealStatus lastDealStatus right-line":"dealStatus right-line"}><i></i></li>
                                                    </ul>
                                                    <div className="usrMsg clearfix" onClick={this.handleBuble.bind(this)}>
                                                        <img src={(list.photo==null)?"/static/img/Avatar.png":list.photo} alt="" className="big-img-lt"/>
                                                        <span className="icon-seeMore"></span>
                                                        <div className="rightMsg">
                                                            <h1>{list.username}</h1>.
                                                            <h2>Identification</h2>
                                                            <h3></h3>

                                                            <div className="msgList clearfix">
                                                                <div className="msg-lt">
                                                                    <p>职位 : <i>{list.job}</i> </p>
                                                                    <p>部门 : <i>{list.department}</i> </p>
                                                                    <p>状态 : <b className={list.is_active==0?'limit':''}></b><i>{list.is_active==0?'已停用':'已启用'}</i> </p>
                                                                </div>
                                                                <div className="msg-rt">
                                                                    {/*<p>&nbsp;</p>*/}
                                                                    <p className="msg-email">邮箱 : <i>{list.email}</i></p>
                                                                    <p className="msg-phone">电话 : <i>{list.phone}</i></p>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="showDealWay clearfix" style={{display:(len==eq)?'none':'block'}}>
                                                    <i className={eq%2==0?"dealWayLine line-lt":"dealWayLine line-rt"}></i>
                                                    <p><i>{list.time}</i>通过：{data.type}</p>
                                                </div>

                                            </div>
                                        )
                                    }.bind(this))
                                }
                                </div>

                            </div>
                        )
                    }.bind(this))
                }
                {/*{新增资产}*/
                    this.state.addAssetsBox &&
                    <AddAssets
                        showActionLoading = {this.state.showActionLoading}
                        handleCloseAddAssets = {this.handleCloseAddAssets.bind(this)}
                        handleCancelAdd = {this.handleCancelAdd.bind(this)}
                        handleConformAdd = {this.handleConformAdd.bind(this)}
                        getUsrList = {this.state.getUsrList} //传入用户列表
                        getTypeList = {this.state.getTypeList} //传入资产类型
                        conformMsg = {this.state.conformMsg}
                    />
                }
                {/*{资产转移}*/
                    this.state.transAssetsBox&&
                    <TransAssets
                        showActionLoading = {this.state.showActionLoading}
                        handleCloseTransAssets = {this.handleCloseTransAssets.bind(this)}
                        handleCancelTrans = {this.handleCancelTrans.bind(this)}
                        handleConformTrans = {this.handleConformTrans.bind(this)}
                        transUrsId = {this.state.transUrsId} //传入资产转移id（拥有者的id）
                        transUrsName = {this.state.transUrsName} //传入资产转移的name（拥有者的name）
                        transUrsType = {this.state.transUrsType}
                        getUsrList = {this.state.getUsrList}  //传入用户列表
                        getTypeList = {this.state.getTypeList} //传入资产类型
                        transUrsAsset = {this.state.transUrsAsset} //传入资产转移的内容
                        conformMsg = {this.state.conformMsg}
                        transFileName = {this.state.transFileName}
                    />
                }
                <div className="pagination-all">
                    <Pagination prev={true} next={true} first={false} last={false} ellipsis={true} boundaryLinks={true} items={this.state.dataListAllPage}
                    activePage={this.state.currentListPageNum} maxButtons={7} onSelect={this.handleChangePage.bind(this)}/>
                    <div className="pageCount">
                        <input className="pageNum"  id = "pageJumpNum"placeholder="输入" onKeyUp={this.handleEnterPage.bind(this)} onKeyDown={this.handleEnterPage.bind(this)}/>
                        <img className="searchNum"　src='/static/img/skip.svg' onClick={this.handleJumpPage.bind(this)}/>
                    </div>
                </div>
            </div>
        )
    }
}





