import React from "react";
import $ from 'jquery';
import DatabaseRelate from'./database/DatabaseRelate'
import HostList from'./database/HostList'
import AddDatabase from'./database/AddDatabase.js'

/* 数据库管理页面 */
export default class Database extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectDatabase:false,//database列表拓扑图切换
            showAddDBbox:false,//增加数据库弹框
            addTipsMsg:'',//增加数据库事件提示信息
            currentIP:'数据库',
            databaseSerachList:false,//搜索数据库返回列表
            showLoadingAction:false,
            }
        };
    componentDidMount(){
        //修改页面title
        document.title = '数据库管理'
    }
    handleSelectLi(state){
        //database列表拓扑图切换
        this.setState({
            selectDatabase:state //设置tab切换，state为传入的参数 true/false
        });
    }
    //添加数据库名称失去焦点
    handleCheckName(e){
        var dbName = $(e.target).val()
        var re = /^[0-9A-Za-z_]{3,18}$/;

        // console.log(re.test(dbName))
        if(!re.test(dbName)){
            this.setState({
                addTipsMsg:'数据库名称为长度3~18的字符、数字和下划线'
            })
        }else{
            this.setState({
                addTipsMsg:''
            })
        }
        
    }
    // 添加数据库
    handleAddDB(){
        this.setState({
            showAddDBbox:true
        })
    }
    //  取消新增数据库
    handleCancleAdd(){
        this.setState({
            showAddDBbox:false,
            addTipsMsg:''
        })
        $('.addDatabaseName').val('')
        $('.addDatabaseType').val('')
        $('.addDatabaseIp').val('')
        $('.addDatabasePort').val('')
        $('.addDatabaseUser').val('')
        $('.addDatabasePwd').val('')

    }
    //确定增加数据库
    handleAddDbMore(){
        if($('.addDatabaseName').val()==''){
            this.setState({
                addTipsMsg:'请输入数据库名称'
            })
            $('.addDatabaseName').focus();
        }else if($('.addDatabaseType').val()==''){
            this.setState({
                addTipsMsg:'请输入数据库类型'
            })
            $('.addDatabaseType').focus();
        }else if($('.addDatabaseIp').val()==''){
            this.setState({
                addTipsMsg:'请输入IP'
            })
            $('.addDatabaseIp').focus();
        }else if($('.addDatabasePort').val()==''){
            this.setState({
                addTipsMsg:'请输入端口号'
            })
            $('.addDatabasePort').focus();
        }else if($('.addDatabaseUser').val()==''){
            this.setState({
                addTipsMsg:'请输入数据库用户名'
            })
            $('.addDatabaseUser').focus();
        }else if($('.addDatabasePwd').val()==''){
            this.setState({
                addTipsMsg:'请输入数据库密码'
            })
            $('.addDatabasePwd').focus();
        }else{
            var self = this;
            self.setState({
                showLoadingAction:true,
            })
            $.ajax({
                url: '/api/createDB/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                data: {
                    dbname: $('.addDatabaseName').val(),
                    type: $('.addDatabaseType').val(),
                    ip: $('.addDatabaseIp').val(),
                    port: $('.addDatabasePort').val()||'',
                    username: $('.addDatabaseUser').val(),
                    password: $('.addDatabasePwd').val(),
                },
                error: function () {//错误执行方法
                    self.setState({
                        addTipsMsg:'创建失败,请检查您所填写的信息!',
                        showLoadingAction:false,
                    })
                },
                success: function (data) {//成功执行方法
                    self.setState({
                        addTipsMsg:data[0].message||'',
                        showLoadingAction:false,
                    })
                    // console.log(JSON.stringify(data))
                    if(data[1].code=="200"){
                        self.setState({
                            showAddDBbox:false,
                            addTipsMsg:'',
                            showLoadingAction:false,
                        })
                        window.location.reload()
                    }
                }
            });

        }
        
    }
   onChangeIP(newIP) {
        this.setState({                        
            currentIP: newIP
        });                                  
    } 
    // 搜索数据库
    handleSerachDatabase(){
        this.setState({
            selectDatabase:true //点击搜索，主机列表tab显示，拓扑图隐藏
        })
        var searchMsg = $('.searchDatabaseIpt').val()
        if(searchMsg==''){
            this.setState({
                databaseSerachList:null //搜索为空，设置为null
            })
        }else{
            let self = this;
             $.ajax({
                url: '/api/searchDb/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                data: {
                    ip_dbname: searchMsg
                },
                error: function () {//错误执行方法
                },
                success: function (data) {
                    // console.log(JSON.stringify(data))
                    self.setState({
                        databaseSerachList:data[0] //暂时为[]，等数据
                    })
                }
             })
            
        }
        // 点击后，隔100ms等html加载，然后绘制cavans
        setTimeout(function() {
            var radialIndicator = window.radialIndicator;
            var len = $('.dataList-content .roundPercent').length;
            // console.log(len)
            for (var i = 0; i < len; i++) {
                var list = $('.dataList-content .roundPercent')[i]
                $(list).html('')
                radialIndicator(
                    $(list),
                    { initValue: $(list).parent().find('span').html() }
                )
            }
        }, 500);
        
    }
    /*
    * 按下enter键，搜索数据库
    * */
    handleEnterSerach(e){
        if(e.keyCode==13){
            this.handleSerachDatabase()
        }

    }
    render() {
        //显示在当前ip的下拉列表中的项
        // var itemsIP =[{name:'数据库',value:'数据库'},
        //               {name:'主机',value:'主机'}
        //              ]
                // name:ip,        //显示在列表中的项
                // value:ip        //选中时传递的值

        return (
            <div  style={{background:'#202129',minHeight:'800px'}}>
                <div style={{background:'#2E323C',padding:'24px'}} >
                    <button className="plugAction databaseBtnAdd" id="" onClick={this.handleAddDB.bind(this)}>添加</button>
                    
                    <div className="searchPlugin">
                            {/*
                            <DropdownList
                            listID="shenjiIP-list"
                            itemsToSelect={itemsIP}
                            onSelect={(item)=> this.onChangeIP(item)}
                            />
                            */}
                        <input type="text" placeholder="搜索数据库" className="searchDatabaseIpt" onKeyUp={this.handleEnterSerach.bind(this)}/>
                        <button className="searchGo plugAction" onClick={this.handleSerachDatabase.bind(this)}>搜索</button>
                    </div>
               </div>
               <div className="database-content" style={{margin:'24px 0'}}>
                    <ul className="clearfix databaseListUl"  style={{zIndex:'1'}} >
                        <li className={!this.state.selectDatabase?"databaseList base-select":"databaseList"} onClick={this.handleSelectLi.bind(this,false)}>拓扑图</li>
                        <li className={this.state.selectDatabase?"databaseList base-select":"databaseList"} onClick={this.handleSelectLi.bind(this,true)}>主机列表</li>
                    </ul>
                   {
                       !this.state.selectDatabase &&
                       <DatabaseRelate
                           selectDatabase={this.state.selectDatabase}
                       />
                   }
                   {
                       this.state.selectDatabase &&
                       <HostList
                           selectDatabase={this.state.selectDatabase}
                           databaseSerachList={this.state.databaseSerachList}
                       />
                   }

                    <AddDatabase 
                        showAddDBbox = {this.state.showAddDBbox}
                        showLoadingAction = {this.state.showLoadingAction}
                        // 取消添加
                        handleCancleAdd = {this.handleCancleAdd.bind(this)}
                        // 确定时的提示信息
                        addTipsMsg = {this.state.addTipsMsg}
                        // 确定添加
                        handleAddDbMore = {this.handleAddDbMore.bind(this)}
                        handleCheckName = {this.handleCheckName.bind(this)}
                    />
               </div>
               {/* 3D地图 ---start*/}
               {/* <DMapModal /> */}
                {/* 3D地图 ---end*/}
            </div>
        )
    }
}

