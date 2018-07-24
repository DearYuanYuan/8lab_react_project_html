import React from "react";
import $ from 'jquery';
import { isInt, isIP, isPort, isUrl } from "../../utils/utils";　　　//引入用到的工具函数
import LoadingText from "../Commonality/LoadingText";
import EditDatabase from "./EditDatabase.js";
import RemoveDB from "./RemoveDB.js";
import CustomPagination from "../Commonality/CustomPagination.js"

export default class HostList extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            databaseData:false,//数据库list
            dataListAllPage:0,//当前list总页码数
            currentListPageNum:1,//当前list页码数
            editShow:false,//编辑数据库
            editDataName:'',//编辑数据库名称
            editDataIp:'',//编辑ip
            editDataType:'',//编辑数据库类型
            editDataPort:'',//编辑端口号
            editTipsMsg:'',//编辑数据库错误提示信息
            removeDBname:'',//删除数据库名称
            removeDBpid:null,//删除数据库的序号
            removeDBid:null,//删除数据库的序号
            removeDBIp:'',//删除数据库的ip
            removeDBPort:'',//删除数据库的端口号
            removeDBType:'',//删除数据库的类型
            removeDB:false,//删除数据库弹框
            removeDBMsg:'',//删除数据库弹框信息提示
            showActionLoading:false,

            rowsPerPage: 10,    //列表每页显示条数
            totalItemsCount: 0,  //数据总条数
        }
    }

    /**
     * 
     * @param {*} ele 
     */
    onLoad(ele) {
        // 生成数据库列表圆形占比图
        var radialIndicator = window.radialIndicator;
        var len = $(ele).length;
        // console.log(len)
        for (var i = 0; i < len; i++) {
            var list = $(ele)[i]
            // 清除之前操作生成的cavans
            $(list).html('')
            radialIndicator(
                $(list),
                { initValue: $(list).parent().find('span').html() }
            )
        }
    }
    
    /**
     * 获取数据库列表信息,发送ajax请求
     * @param {*} page 
     * @param {*} size 
     */
    getDataTest(page, size) {
        var self = this;
        $.ajax({
            url: '/api/getDBHostList/',
            type: 'POST',
            dataType: 'json',
            data: {
                page: page,
                size: size
            },
            cache: false,
            success: function (data) {//成功执行方法
                self.setState({
                    databaseData: data[0],
                    dataListAllPage: data[1],
                    totalItemsCount: data[1] * self.state.rowsPerPage
                });
                //绘制cavans,内存,cpu等百分比
                self.onLoad($('.dataList-content .roundPercent'));
                //    console.log(JSON.stringify(data))
            }
        });
    }
    
    /**
     * 分页点击
     * @param {*} pageIndex 页码
     */
    handleChangePage(pageIndex) {
        this.setState({
            currentListPageNum: pageIndex,
            databaseData:false,
        })
        this.getDataTest(pageIndex, this.state.rowsPerPage);
    }
    
    /**
     * 点击切换数据库列表显示
     * @param {*} index 
     */
    handleShowSQL(index) {
        $('.dataList-content').eq(index).find('div.showDatabaseHostList').slideToggle(500)
    }

    /**
     * 跳转输入框的onChange监听
     */
    onChangeInputPage(e) {
        var hostlistPage = e.target.value      //获取输入的页码
        //如果输入的页码不为空,并且如果输入的页码不符合规范(不是正整数，或者大于最大页码)
        if (hostlistPage != "" && (!isInt(hostlistPage) || hostlistPage == 0 || hostlistPage > this.state.dataListAllPage)) {
            $('#inputPageNum').val('');   //清空输入框的内容                       
        }
    }

    /**
     * 页码输入框的按键监听
     * @param {*} e 
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
                currentListPageNum: indexCurrent,
                databaseData:false,
            })
            this.getDataTest(indexCurrent, this.state.rowsPerPage);
            $(e.target).val('')
        }
    }
    
    /**
     * 跳转按钮点击的事件监听 
     */
    handleBtnJump(){
        //分页跳转按钮
        var indexCurrent = parseInt($('#inputPageNum').val())
        if($('#inputPageNum').val() !=''){
            this.setState({
                currentListPageNum:indexCurrent,
                databaseData:false,
            })
            this.getDataTest(indexCurrent,this.state.rowsPerPage); 
            $('#inputPageNum').val('')
        }else{
            return;           
        }        
    }
    
    /**
     * 编辑数据库
     * @param {*} index 
     * @param {*} list 
     * @param {*} name 名称
     * @param {*} type 类型
     * @param {*} ip IP
     * @param {*} port 端口号
     */
    handleUpdatabase(index, list, name, type, ip, port) {
        // console.log(name+';'+type+';'+ip+';'+port)
        this.setState({
            editShow: true,
            editDataName: name,
            editDataIp: ip,
            editDataType: type,
            editDataPort: port
        })
    }

    /**
     * 删除数据库
     * @param {*} index 
     * @param {*} list 
     * @param {*} name 名称
     * @param {*} type 类型
     * @param {*} ip IP
     * @param {*} port 端口号
     */
    handleDelbase(index, list, name, type, ip, port) {
        // console.log(index + ';' + list + ';' + name + ';' + type + ';' + ip + ';' + port)
        this.setState({
            removeDBpid: index,
            removeDBid: list,
            removeDB: true, //删除数据库弹框
            removeDBname: name, //删除数据库名称
            removeDBIp: ip,
            removeDBPort: port,
            removeDBType:type,
            removeDBMsg: '', //删除数据库弹框信息提示
        })
    }

    /**
     * 取消删除数据库时的操作
     */
    handleCancalDel(){
        this.setState({
            removeDB:false,//删除数据库弹框
            // removeDBMsg:'删除成功',//删除数据库弹框信息提示
        })
    }

    /**
     * 确认删除数据库时的操作
     */
    handleConformRemove(){
        // 确认删除数据库，触发函数
        if($('.delDatabaseUser').val()==''){
            this.setState({
                removeDBMsg:'请输入用户名',//删除数据库弹框信息提示
            })
        }else if($('.delDatabasePwd').val()==''){
            this.setState({
                removeDBMsg:'请输入密码',//删除数据库弹框信息提示
            })
        }else{
            // 用户名和密码不为空
            var self = this;
            self.setState({
                showActionLoading:true,
            })
            $.ajax({
                url: '/api/deleteDB/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                data: {
                    ip:this.state.removeDBIp,
                    port:this.state.removeDBPort,
                    dbname:this.state.removeDBname,
                    type:this.state.removeDBType,
                    username:$('.delDatabaseUser').val(),
                    password:$('.delDatabasePwd').val()
                },
                error:function () {
                    self.setState({
                        removeDBMsg:'删除失败',//删除数据库弹框信息提示
                        showActionLoading:false,
                    })
                },
                success: function (data) {//成功执行方法 
                    if(data[0].code=='200'){
                        self.state.databaseData[self.state.removeDBpid].databases.splice(self.state.removeDBid,1)
                        self.setState({
                            removeDBMsg:data[0].message,//删除数据库弹框信息提示
                            removeDB:false,//删除数据库弹框
                            showActionLoading:false,
                        })
                        //删除成功重新加载页面
                        window.location.reload()
                    }else{
                        self.setState({
                            removeDBMsg:data[0].message,//删除数据库弹框信息提示
                            showActionLoading:false,
                        })
                    }
                    // 清空input
                    $('.delDatabaseUser').val('')
                    $('.delDatabasePwd').val('')
                }
            });            
        }        
    }

    /**
     * 取消编辑时的操作
     */
    handleCancalEdit() {
        // 取消编辑
        this.setState({
            editShow: false,
            editTipsMsg: ''
        })
        // 清除填写的数据库信息
        $('.editDatabaseName').val('')
        $('.editDatabaseUser').val('')
        $('.editDatabasePwd').val('')
    }
    
    /**
     * 编辑数据库
     */
    handleConformEdit() {
        // 当用户名密码和要更改的数据库名不为空时，发送ajax请求
        if ($('.editDatabaseName').val() == '') {
            this.setState({
                editTipsMsg: '请输入更改的数据库名称!'
            })
        } else if ($('.editDatabaseUser').val() == '') {
            this.setState({
                editTipsMsg: '请输入数据库用户名!'
            })
        } else if ($('.editDatabasePwd').val() == '') {
            this.setState({
                editTipsMsg: '请输入数据库密码!'
            })
        } else {
            var self = this;
            self.setState({
                showActionLoading:true,
            })
            // 发送ajax请求
            $.ajax({
                url: '/api/updateDB/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                data: {
                    dbname: this.state.editDataName,
                    newDBname: $('.editDatabaseName').val(),
                    type: this.state.editDataType,
                    ip: this.state.editDataIp,
                    port: this.state.editDataPort,
                    username: $('.editDatabaseUser').val(),
                    curPassword: $('.editDatabasePwd').val(),
                    newPassword: ''
                },
                error: function () {
                    self.setState({
                        // editShow:false,
                        editTipsMsg: '修改失败,请检查网络连接',
                        showActionLoading:false,
                    })
                },
                success: function (data) {
                    if (data[1].code == '200') {
                        self.setState({
                            editDataName: $('.editDatabaseName').val(),
                            editShow: false,
                            editTipsMsg: '',
                            showActionLoading:false,
                        });
                        // 清除填写的数据库信息
                        $('.editDatabaseName').val('')
                        $('.editDatabaseUser').val('')
                        $('.editDatabasePwd').val('')
                        window.location.reload()
                    } else {
                        self.setState({
                            editTipsMsg: '修改失败',
                            showActionLoading:false,
                        });
                    }
                }
            })
        }
    }
    /**
     * 组件将要加载时的操作
     */
    componentWillMount() {
        // 页面加载,显示主机列表
       this.getDataTest(1,this.state.rowsPerPage);  
    }
    componentDidMount(){

    }

    /**
     * 设置列表每页最多显示行数
     * @param {int} num 行数 
     */
    setRowsPerPage(num) {
        this.setState({
            rowsPerPage: num
        })
       this.getDataTest(1,num);  
    }

    render(){
        return (
            <div style={{opacity:this.props.selectDatabase?'1':'0'}} className={this.props.selectDatabase?'':'tabDatabaseDetail'}>

                <div className="datalistTitle">
                    <table className="databaseHostList">
                    <thead>
                    <tr>
                        <th>主机IP</th>
                        <th>标签</th>
                        <th>运行时间</th>
                        <th>内存占用</th>
                        <th>CPU占用</th>
                        <th>连接数</th>
                        <th>流入</th>
                        <th>流出</th>
                    </tr>
                    </thead>
                    </table>
                </div>
                {
                    !(this.props.databaseSerachList || this.state.databaseData) &&
                    <LoadingText/>

                }
                {
                    (this.props.databaseSerachList||this.state.databaseData) &&
                    (this.props.databaseSerachList||this.state.databaseData).map(function(data,index){
                        return (
                             <div className="dataList-content" key = {index} >
                                <table className="databaseHostList"  onClick = {this.handleShowSQL.bind(this,index)}>
                                <tbody>
                                    <tr>
                                        <td>{data.host_ip}</td>
                                        <td>{data.host_name}</td>
                                        <td>{data.runtime}</td>
                                        <td><span className="percentMsg">{parseInt(data.mem_pct*100)}</span>
                                            <div className="roundPercent"></div>
                                        </td>
                                        <td><span className="percentMsg">{parseInt(data.cpu_pct*100)}</span>
                                            <div className="roundPercent"></div>
                                        </td>
                                        <td><span className="percentMsg">{parseInt(data.connections*100)}</span>
                                            <div className="roundPercent"></div>
                                        </td>
                                        <td>{data.received} KB</td>
                                        <td>{data.sent} KB</td>
                                    </tr>
                                </tbody>
                                </table>
                                <div className="showDatabaseHostList" style={{display:this.props.databaseSerachList?'block':"none"}}>
                                            <table className="baseHostList">
                                                <thead>
                                                <tr>
                                                    <th>数据库标签</th>
                                                    <th>类型</th>
                                                    <th>IP端口号</th>
                                                    <th>容量</th>
                                                    <th>操作</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                {
                                    data.databases.map(function(baselist,list){
                                        return (
                                         
                                                    <tr key={list}>
                                                        <td>{baselist.dbname}</td>
                                                        <td>{baselist.dbtype}</td>
                                                        <td>{baselist.dbport}</td>
                                                        <td>{baselist.dbsize}</td>
                                                        <td >
                                                            <button className="plugAction databaseBtnDel" id="" onClick={this.handleUpdatabase.bind(this,index,list,this.state.editDataName||baselist.dbname,baselist.dbtype,baselist.hostip,baselist.dbport)}>编辑</button>
                                                            <button className="plugAction databaseBtnDel" id="" onClick={this.handleDelbase.bind(this,index,list,this.state.editDataName||baselist.dbname,baselist.dbtype,baselist.hostip,baselist.dbport)}>删除</button>
                                                        </td>
                                                    </tr>
                                                
                                        )
                                    }.bind(this))
                                }
                                        </tbody>
                                    </table>
                                </div>
                             </div>
                        )
                    }.bind(this))
                }
                {/*
                    分页现在有点问题:点击页码,cavans将重绘制,其实不需要绘制
                */}
               <CustomPagination
                    from={(this.state.currentListPageNum-1)*this.state.rowsPerPage}
                    to={(this.state.currentListPageNum-1)*this.state.rowsPerPage + (this.props.databaseSerachList && this.props.databaseSerachList.length || this.state.databaseData.length)}
                    totalItemsCount={this.state.totalItemsCount}
                    totalPagesCount={this.state.dataListAllPage}
                    currentPage={this.state.currentListPageNum}
                    onChangeRowsPerPage={(num)=>this.setRowsPerPage(num)}
                    onSelectPage={(e)=>this.handleChangePage(e)}
                    onChangePageInput={(e)=>this.onChangeInputPage(e)}
                    onPageInputKeyDown={(e)=>this.handleEnterPage(e)}
                    onClickJumpButton={()=>this.handleBtnJump()}
                />
                {
                    this.state.editShow &&
                    <EditDatabase
                        showActionLoading = {this.state.showActionLoading}
                        editShow = {this.state.editShow}
                        editDataName = {this.state.editDataName}
                        editTipsMsg = {this.state.editTipsMsg}
                        handleCancalEdit = {this.handleCancalEdit.bind(this)}
                        handleConformEdit = {this.handleConformEdit.bind(this)}
                    />
                }

                {
                    this.state.removeDB &&
                    <RemoveDB
                        showActionLoading = {this.state.showActionLoading}
                        removeDBname = {this.state.removeDBname}
                        removeDB = {this.state.removeDB}
                        removeDBMsg = {this.state.removeDBMsg}
                        handleCancalDel = {this.handleCancalDel.bind(this)}
                        handleConformRemove = {this.handleConformRemove.bind(this)}
                    />
                }

            </div>
        )
    }
}

//  删除数据库




