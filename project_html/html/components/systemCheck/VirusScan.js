import React from "react";              //引入react
import $ from "jquery";                   //引入jquery   
import { Modal, Col, Button, Table, Form, FieldGroup, ControlLabel, FormControl, FormGroup, HelpBlock } from 'react-bootstrap';
import { isInt } from "../../utils/utils";　　　//引入用到的工具函数
import MessageBox from "../Commonality/MessageBox"          //消息提示框组件
import DropdownList from "../Commonality/DropdownList";     //下拉列表的组件
import CustomPagination from "../Commonality/CustomPagination.js"
import SystemSetting from "./SystemSetting.js"
import AddServer from "./AddServer.js"
import EditServer from "./EditServer.js"
export default class VirusScan extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hostlist: [],                        //主机列表数据
            groupList: [],

            currentTab: 1,
            // 默认　　１＝＝全部主机
            // 　　　　２＝＝全部主机的查看详情
            // 　　　　３＝＝主机组

            showAddServer: false,                 //新增弹窗默认不显示
            showSetting: false,                   //扫描设置默认不显示
            showEditServer: false,

            // get_port_end: 65535,   //port默认设置
            // get_port_start: 1,      //port默认设置
            // get_ip_start: "127.0.0.1",  //ip默认设置
            // get_ip_end: "127.0.0.5",   //ip默认设置

            //提示框
            showMsgBox: false,                   //不显示消息提示框
            msgContent: '',                      //提示框的提示消息
            msgButtonState: false,               //提示框中的按钮状态
            msgButtonName: "",                   //提示框中的按钮名称

            sysSelectAllText: '选择全部',          //主机列表选择全部按钮
            sysGroupSelectAllText: '选择全部',       //主机组列表选择全部按钮
            groupDetail: false,                    //编辑组详细信息的显示

            totalItemsCount: 0,
            pageCount: 0,　　　　　　　　　　　　　　　 //总页数
            grouptotalItemsCount:0,
            groupPageCount:0,

            outSideGroup: [],                      //组外主机列表
            inSideGroup: [],                       //组内主机列表
            hostOutListSearch: false,//模糊查询搜索组外主机列表
            hostInListSearch: false, //模糊查询搜索组内主机列表
            groupName: '',            //编辑组名称
            groupRemark: '',　　　     //编辑组备注信息
            currentGroupId: '',
            errorMsg: ''

        }

        this.sortByIP = '';         //hostip,-hostip 按照主机Ip排序
        this.sortByHostname = '';   //id -id,       按照主机别名排序
        this.sortByStatus = '';     //is_scan -is_scan 按照是否查杀排序
        this.rowsPerPage = 10;       //列表最多显示行数
        this.grouprowsPerPage=10;
        this.currentPage = 1;       //当前页码，默认为1
        this.group_currentPage = 1;   //当前页码，默认为1
        this.group_pageSize = 10;      //当前页显示的最多的个数
        this.group_search=null;
        this.searchItem = null;     //搜索输入框中的内容
        this.searchRange = '-1';    //搜索操作的范围，下拉列表所选的值   
        this.sysSelectAll = '0';    //０代表当前是未选择状态　　１代表当前是已经选择全部的状态
        this.sysGroupSelectAll = '0' //０代表当前是未选择状态　　１代表当前是已经选择全部的状态
        this.action = '';
        this.hostlistNum = [];
        this.ready_del_arr = [];

    }

    /**
    * 在组件渲染之前执行的操作
    */
    componentWillMount() {
        this.getHostList();
    }

    componentDidMount() {

    }

    /*===================================================== 主机列表的操作 ============================================== */
    /**
     * 获取主机列表的数据，更新state
     */
    getHostList() {
        var self = this;
        $.ajax({
            url: '/api/machinelist/show/',
            type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: {                         //表单数据
                page: self.currentPage,        //当前时第几页
                condition: self.searchItem,    //搜索关键字
                sort: self.sortField,           //排序方式
                count: self.rowsPerPage,   //每页最多条数
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            traditional: true,          //阻止JQuery深度序列化对象
            success: function (result) {
                if (result) {
                    self.initialAllCheckbox(); //恢复所有复选框到未选中状态
                    // self.state.pageCount = result.pages_num
                    self.setState({
                        pageCount: result.pages_num,
                        totalItemsCount: result.pages_num * self.rowsPerPage,
                        hostlist: result.data,
                        currentTab: 1,
                    })
                    // 根据sysSelectAll ０代表当前是未选择状态　　１代表当前是已经选择全部的状态
                    // 如果已经时选中的状态,翻到那一页复选框都是被选中状态
                    if (self.sysSelectAll == '0') {
                        $('.hostaListTable .hostlist-detail .hostlist-hostname .custom-checkbox').prop('checked', false)
                        $('.hostlist-table>thead .hostlist-hostname .custom-checkbox').prop('checked', false)
                    } else if (self.sysSelectAll == '1') {
                        $('.hostaListTable .hostlist-detail .hostlist-hostname .custom-checkbox').prop('checked', true)
                        $('.hostlist-table>thead .hostlist-hostname .custom-checkbox').prop('checked', true)
                    }
                }
            },
        })
    }

    /*====================== 主机列表的操作（分页） ====================== */

    /**
     * 选择页码的监听
     */
    handleSelectPage(eventkey) {
        this.currentPage = eventkey
        this.getHostList();
    }

        /**
     * 选择页码的监听
     */
    handleGroupSelectPage(eventkey) {
        this.group_currentPage = eventkey
        this.getAllGroup();
    }
    /**
     * 点击跳转按钮的监听
     */
    handleJumpPage() {
        this.currentPage = parseInt($('#inputPageNum').val())
        this.getHostList();
    }

       /**
     * 点击跳转按钮的监听
     */
    handleGroupJumpPage() {
        this.currentPage = parseInt($('#groupInputPageNum').val())
        this.getAllGroup();
    }

    /**
     * 跳转输入框的onChange监听
     */
    onChangeInputPage(e) {
        var hostlistPage = e.target.value      //获取输入的页码
        //如果输入的页码不为空,并且如果输入的页码不符合规范(不是正整数，或者大于最大页码)
        if (hostlistPage != "" && (!isInt(hostlistPage) || hostlistPage == 0 || hostlistPage > this.state.pageCount)) {
            $('#inputPageNum').val('');   //清空输入框的内容                       
        }
    }

    /**
     * 跳转输入框的onChange监听
     */
    onChangeGroupInputPage(e) {
        var hostlistPage = e.target.value      //获取输入的页码
        //如果输入的页码不为空,并且如果输入的页码不符合规范(不是正整数，或者大于最大页码)
        if (hostlistPage != "" && (!isInt(hostlistPage) || hostlistPage == 0 || hostlistPage > this.state.pageCount)) {
            $('#groupInputPageNum').val('');   //清空输入框的内容                       
        }
    }

    /**
     * 跳转输入框的按键事件监听
     * @return {[type]} [description]
     */
    jumpPageKeyDown(e) {
        if (e.keyCode === 13) {           //当按下的键是回车键
            this.handleJumpPage()
        }
    }
    /**
     * 跳转输入框的按键事件监听
     * @return {[type]} [description]
     */
    jumpGroupPageKeyDown(e) {
        if (e.keyCode === 13) {           //当按下的键是回车键
            this.handleGroupJumpPage()
        }
    }

    /*====================== 主机列表的操作（应用/暂停保护） ====================== */

    /**
     *检查是否所有的复选框都被选中。
     *如果全被选中，“全选”的复选框也该被选中;否则，取消被选中
     */
    checkSelectAll(who, e) {
        var checked = $(`.${who} .hostlist-detail .hostlist-hostname .custom-checkbox:checked`)
        var allcheckedNum = $(`.${who} .hostlist-detail .hostlist-hostname .custom-checkbox`).length;
        this.addNotAllowed(who, checked.length);
        if (checked.length == allcheckedNum) {
            $(`.${who}>thead .hostlist-hostname .custom-checkbox`).prop('checked', true)
        } else {
            $(`.${who}>thead .hostlist-hostname .custom-checkbox`).prop('checked', false)
        }


    }


    addNotAllowed(who, num) {
        switch (who) {
            case 'hostaListTable':
                this.hostlistNum = [];
                var checked = $(`.hostaListTable .hostlist-detail .hostlist-hostname .custom-checkbox:checked`).parent().parent();
                //遍历被选中的主机中有在线状态才可以操作开始查杀和停止查杀
                for (var i = 0; i < checked.length; i++) {
                    var index = $(checked[i]).index();
                    if (this.state.hostlist[index].status == true) {
                        this.hostlistNum.push(this.state.hostlist[i].hostip)
                    }
                }
                this.hostlistNum.length < 1 ? $(".btn-all-ctl").addClass('not-allowed') : $(".btn-all-ctl").removeClass('not-allowed')
                num < 1 ? $(".btn-all-delete").addClass('not-allowed') : $(".btn-all-delete").removeClass('not-allowed')
                break;
            case 'hostGroupTable':
                num < 1 ? $(".btnGroup-all-ctl").addClass('not-allowed') : $(".btnGroup-all-ctl").removeClass('not-allowed')
                break;
            case 'outsideGroupTable':
                num < 1 ? $('.brdige-right').addClass('not-allowed') : $('.brdige-right').removeClass('not-allowed')
                break;
            case 'insideGroupTable':
                num < 1 ? $('.brdige-left').addClass('not-allowed') : $('.brdige-left').removeClass('not-allowed')
                break;
        }
    }
    /**
     * 点击“全选”复选框时的操作
     */
    toggleSelectAll(who) {
        var allSelect = $(`.${who} .hostlist-detail .hostlist-hostname input`)
        allSelect.prop('checked', !$(`.${who}>thead .hostlist-hostname input`).prop('checked'))
        var checkedNum = $(`.${who} .hostlist-detail .hostlist-hostname .custom-checkbox:checked`).length;
        this.addNotAllowed(who, checkedNum);
    }

    /**
     * 恢复所有复选框到未选中状态
     * 所有的操作添加not-allowed类型改变按钮状态
     */
    initialAllCheckbox() {
        $('.hostlist-hostname input').prop('checked', false);
        $('.brdige-left').addClass('not-allowed')
        $(".btnGroup-all-ctl").addClass('not-allowed')
        $(".btn-all-ctl").addClass('not-allowed')
        $('.brdige-right').addClass('not-allowed')
    }


    /**
     * 显示全部主机的编辑主机信息
     */
    handleEditServer() {
        this.setState({
            currentTab: 1,
            showEditServer: !this.state.showEditServer,
        })
    }

    /**
     * 点击全部主机列表的详细信息后　　(仅支持单条主机删除)
     * 删除单条主机信息
     * @param {any} ip 　要删除的主机ip
     * @memberof VirusScan
     */
    deleteSingle(ip) {
        var self = this;
        $.ajax({
            url: '/api/machinelist/delete/',
            type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: {                         //表单数据
                hostips: ip
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            traditional: true,              //阻止JQuery深度序列化对象
            success: function (result) {
                if (result.code == 200) {
                    self.getHostList();
                } else {
                    self.setState({     //显示提示消息
                        showMsgBox: true,
                        msgContent: result.message,
                        msgButtonState: true,
                        msgButtonName: '确认',
                    });
                }
            }
        })
    }


    /**
     * 删除主机　单项删除和多项删除
     * 
     * @returns 
     * @memberof VirusScan
     */
    deleteServer() {
        var self = this;
        var checkArr = $(".hostaListTable .hostlist-detail > .hostlist-hostname >input:checked");
        //如果没有被选中的直接阻止
        if (checkArr.length == 0) {
            return
        }
        var deleteArr = [];//要删除的主机
        for (var i = 0; i < checkArr.length; i++) {
            deleteArr.push($(checkArr[i]).attr("title"));
        }
        deleteArr = deleteArr.join('#')
        $.ajax({
            url: '/api/machinelist/delete/',
            type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: {                         //表单数据
                hostips: deleteArr,
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            traditional: true,              //阻止JQuery深度序列化对象
            success: function (result) {
                if (result.code == 200) {
                    self.getHostList();
                } else {
                    self.setState({     //显示提示消息
                        showMsgBox: true,
                        msgContent: result.message,
                        msgButtonState: true,
                        msgButtonName: '确认',
                    });
                }
            }
        })
    }

    /*====================== 主机列表的操作（排序） ====================== */

    /**
     * 按照某一列给表格排序
     * @param {string} sortCol 排序的列名 
     */
    sortTable(sortCol) {
        switch (sortCol) {
            case 'hostname':
                this.sortByHostname = (this.sortByHostname == 'id' ? '-id' : 'id');
                this.sortField = this.sortByHostname;
                break;
            case 'ip':
                this.sortByIP = (this.sortByIP == 'hostip' ? '-hostip' : 'hostip');
                this.sortField = this.sortByIP;
                break;
            case 'status':
                this.sortByStatus = (this.sortByStatus == 'is_scan' ? '-is_scan' : 'is_scan');
                this.sortField = this.sortByStatus;
                break;
            default:
                this.sortField = '';
        }
        this.getHostList()

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
    }

    /**
     * 搜索输入框内容变化时的监听
     */
    onChangeSearchInput() {
        this.searchItem = $('#searchVirusScan').val();
    }
    onChangeGroupSearchInput(){
        this.group_search = $('#searchGroup').val();
    }
    /**
     * 点击搜索按钮的监听
     * 按照输入框中的内容搜索主机
     */
    handleSearchHost = (e) => {
        e.preventDefault();
        //搜索时默认无排序，重置所有的排序选项
        this.sortField = '';
        this.sortByHostname = -1;
        this.sortByIP = -1;
        this.sortByStatus = -1;
        this.currentPage = 1;   //默认回到第一页
        this.getHostList();
    }


    handleGroupList(location, e) {
        e.preventDefault();
        switch (location) {
            case 'out':
                //清除另外一个input搜索框，防止主机移动的时候错乱
                $('.in-host-search-ipt').val('')
                //将另外一个列表更新为非模糊查询的总列表
                this.setState({
                    hostInListSearch: false
                })
                //判断当输入关键字，模糊查询，列表更新
                if ($('.out-host-search-ipt').val() !== '') {
                    this.filterSearchItem(this.state.outSideGroup, $('.out-host-search-ipt').val(), location)
                } else {
                    this.setState({
                        hostOutListSearch: false,
                    })
                };
                break;
            case 'in':
                //清除另外一个input搜索框，防止主机移动的时候错乱
                $('.out-host-search-ipt').val('')
                //将另外一个列表更新为非模糊查询的总列表
                this.setState({
                    hostOutListSearch: false
                })
                //判断当输入关键字，模糊查询，列表更新
                if ($('.in-host-search-ipt').val() !== '') {
                    this.filterSearchItem(this.state.inSideGroup, $('.in-host-search-ipt').val(), location)
                } else {
                    this.setState({
                        hostInListSearch: false
                    })
                };
                break;
        }

    }
    /**
     * 新增弹窗显示
     */
    changeAddServer() {
        this.setState({
            showAddServer: !this.state.showAddServer,
        });
    }




    allkilling() {

    }

    allpause() {

    }

    //开始查杀操作   ip:开始查杀的主机Ip
    scan_start(ip) {
        var self = this;
        $.ajax({
            url: '/api/machinelist/scan_start/',
            type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: {                         //表单数据
                hostip: ip
            },
            success: function (result) {
                if (result.code == 200) {
                    self.getHostList();
                } else {
                    self.setState({     //显示提示消息
                        showMsgBox: true,
                        msgContent: result.message,
                        msgButtonState: true,
                        msgButtonName: '确认',
                    });
                }
            }
        })
    }

    //结束查杀操作   ip:结束查杀的主机Ip
    scan_stop(ip) {
        var self = this;
        $.ajax({
            url: '/api/machinelist/scan_stop/',
            type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: {                         //表单数据
                hostip: ip
            },
            success: function (result) {
                if (result.code == 200) {
                    self.getHostList();
                } else {
                    self.setState({     //显示提示消息
                        showMsgBox: true,
                        msgContent: result.message,
                        msgButtonState: true,
                        msgButtonName: '确认',
                    });
                }
            }
        })
    }

    //显示系统设置弹窗
    handleSetting() {
        this.setState({
            showSetting: !this.state.showSetting
        });
    }

    //点击详细信息，通过更改state来控制视图改变
    //点击哪个就设置当前的为选中的
    changeHost(host, ip, status, remark, action, log) {
        this.setState({
            currentTab: 2,       //是否展示详情页面
            selectHost: host,        //获取选中的主机别名
            selectIP: ip,            //获取选中的ip
            selectStatus: status,    //获取选中的主机的在线状态
            selectRemark: remark,    //获取选中的主机的备注
            selectAction: action,    //获取选中的主机的查杀操作
            selectLog: log           //获取选中的主机的日志
        })
    }

    /*===================================================== 消息弹出框 ============================================== */
    /**
     * 消息弹出框的按钮点击事件的监听
     */
    handleConfirmMsgBox() {
        this.setState({     //隐藏消息提示框
            showMsgBox: false,
        })
    }

    /**
     * 切换选择全部主机和全部主机的详情页和主机组
     * 
     * @param {any} index 　
     * @memberof VirusScan
     */
    selectCurrentTab(index) {
        this.setState({
            currentTab: index,
            sysSelectAllText: '选择全部',
            sysGroupSelectAllText: '选择全部',
        })
        if (index == 3) {
            this.getAllGroup()
        }
    }

    getAllGroup() {
        var self = this;
        var data={
            keyword: self.group_search,
            type:2,
            count: self.grouprowsPerPage,   //每页最多条数
            num:self.group_currentPage,
        }
        $.ajax({
            url: '/api/machinelist/get_all_group/',
            type: 'post',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data:data,
            success: function (result) {
                if (result.code == 200) {
                    self.setState({     //显示提示消息
                        groupList: result.groups,
                        groupPageCount: Math.ceil(result.count / self.grouprowsPerPage),
                        grouptotalItemsCount: result.count,
                    });
                }
            }
        })
    }
    // 点击选择全部之后所有页面的checkbox都被勾选
    sysSelect() {
        if (this.state.sysSelectAllText == '选择全部') {
            this.sysSelectAll = '1'
            $(' .hostaListTable .hostlist-detail .hostlist-hostname .custom-checkbox').prop('checked', true)
            $('.hostaListTable>thead .hostlist-hostname .custom-checkbox').prop('checked', true)
            this.setState({
                sysSelectAllText: '取消选择'
            })
        } else if (this.state.sysSelectAllText == '取消选择') {
            this.sysSelectAll = '0'
            $('.hostaListTable .hostlist-detail .hostlist-hostname .custom-checkbox').prop('checked', false)
            $('.hostaListTable>thead .hostlist-hostname .custom-checkbox').prop('checked', false)
            this.setState({
                sysSelectAllText: '选择全部'
            })
        }

        var checkedNum = $('.hostaListTable .hostlist-detail .hostlist-hostname .custom-checkbox:checked').length;
        if (checkedNum < 1) {
            $(".btn-all-ctl").addClass('not-allowed')

        } else {
            $(".btn-all-ctl").removeClass('not-allowed')
        }
    }

    sysGroupSelect() {
        if (this.state.sysGroupSelectAllText == '选择全部') {
            this.sysGroupSelectAll = '1'
            $('.hostGroupTable .hostlist-detail .hostlist-hostname .custom-checkbox').prop('checked', true)
            $('.hostGroupTable>thead .hostlist-hostname .custom-checkbox').prop('checked', true)
            this.setState({
                sysGroupSelectAllText: '取消选择'
            })
        } else if (this.state.sysGroupSelectAllText == '取消选择') {
            this.sysGroupSelectAll = '0'
            $('.hostGroupTable .hostlist-detail .hostlist-hostname .custom-checkbox').prop('checked', false)
            $('.hostGroupTable>thead .hostlist-hostname .custom-checkbox').prop('checked', false)
            this.setState({
                sysGroupSelectAllText: '选择全部'
            })
        }
        var checkedNum = $('.hostaListTable .hostlist-detail .hostlist-hostname .custom-checkbox:checked').length;
        if (checkedNum < 1) {
            $(".btn-all-ctl").addClass('not-allowed')
        } else {
            $(".btn-all-ctl").removeClass('not-allowed')
        }
    }

    //显示编辑主机组详细信息
    handleGroupDetail() {
        this.setState({
            groupDetail: !this.state.groupDetail,
            groupName: '',            //编辑组名称
            groupRemark: '',　　　     //编辑组备注信息
            errorMsg: '',
        })
    }

    /**
     * 设置列表每页最多显示行数
     * @param {int} num 行数 
     */
    setRowsPerPage(num) {
        this.rowsPerPage = num
        this.getHostList()
    }
    /**
     * 设置列表每页最多显示行数
     * @param {int} num 行数 
     */
    setGroupRowsPerPage(num) {
        this.grouprowsPerPage = num
        this.getAllGroup()
    }

    //显示新建主机组弹窗
    //组外的主机列表设置成全部主机列表即可以
    showCreatGroup(action, id) {
        switch (action) {
            case 'plus':
                this.handleGroupDetail()
                this.getOutSideGroup()
                this.action = 'plus';
                break;
            case 'updata':
                this.handleGroupDetail()
                this.getInSideGroup(id)
                this.action = 'updata';
                break;
        }

    }
    handleHostNameSet(e) {
        this.hostNameSet = e.target.value
    }
    handleHostRemarkSet(e) {
        this.hostRemarkSet = e.target.value
    }
    /*
       获取组内主机
       api/blackbox/get_group_detail/
       */
    getInSideGroup(id) {
        var self = this;
        $.ajax({
            url: '/api/machinelist/get_group_detail/',
            type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: { id: id, },              //表单数据
            cache: false,                   //不会从浏览器缓存中加载请求信息
            traditional: true,              //阻止JQuery深度序列化对象
            success: function (result) {
                if (result.code == 200) {
                    var del_arr = [];
                    for (var i = 0; i < result.in_group.length; i++) {
                        del_arr.push(result.in_group[i].hostip)
                    }
                    self.ready_del_arr = del_arr;
                    self.setState({
                        outSideGroup: result.out_group,
                        inSideGroup: result.in_group,
                        groupName: result.name,            //编辑组名称
                        groupRemark: result.remark,　　　     //编辑组备注信息
                        currentGroupId: id
                    })
                } else {
                    self.setState({
                        outSideGroup: [],
                        inSideGroup: [],
                    })
                }
            },
            error: function () {
                self.setState({
                    outSideGroup: [],
                    inSideGroup: [],
                })
            }
        })
    }

    //获取组外主机信息
    getOutSideGroup() {
        var self = this;
        $.ajax({
            url: '/api/machinelist/get_all_host/',
            type: 'get',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            success: function (result) {
                if (result.code == 200) {
                    self.setState({
                        outSideGroup: result.all,
                        inSideGroup: [],
                    })
                }
            },
            error: function () {
                self.setState({
                    outSideGroup: [],
                    inSideGroup: [],
                })
            }
        })
    }



    //编辑好信息后　　api/blackbox/create_group/
    creatGroup() {
        if (!this.state.groupName && this.state.groupName == '') {
            return this.setState({
                errorMsg: '请输入主机组名称'
            })
        }
        if (!this.state.groupRemark && this.state.groupRemark == '') {
            return this.setState({
                errorMsg: '请输入主机组备注'
            })
        }
        if (this.state.inSideGroup.length == 0) {
            return this.setState({
                errorMsg: '请选择主机'
            })
        }
        if (this.action == 'plus') {
            this.addHostGroup()
        }
        if (this.action == 'updata') {
            this.updataHostGroup()
        }

    }

    addHostGroup() {
        var self = this;
        let ipString = '';
        let ipList = this.state.inSideGroup;
        for (let i = 0; i < ipList.length; i++) {
            ipString += ipList[i].hostip + ','
        }
        var data = {
            name: this.state.groupName,
            remark: this.state.groupRemark,
            ips: ipString,
            type: '2',
        }
        $.ajax({
            url: '/api/blackbox/create_group/',
            type: 'post',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: data,
            success: function (result) {
                if (result.status == 200) {
                    self.handleGroupDetail()
                    self.getAllGroup()
                }
                if (result.status == 201) {
                    self.setState({
                        errorMsg: result.message
                    })
                }
            },
            error: function () {
                self.setState({
                    errorMsg: '创建失败'
                })
            }
        })
    }


    updataHostGroup() {
        var self=this
        function diff(arr1, arr2) {
            var newArr = [];
            var arr3 = [];
            for (var i = 0; i < arr1.length; i++) {
                if (arr2.indexOf(arr1[i]) === -1)
                    arr3.push(arr1[i]);
            }
            var arr4 = [];
            for (var j = 0; j < arr2.length; j++) {
                if (arr1.indexOf(arr2[j]) === -1)
                    arr4.push(arr2[j]);
            }
            newArr = arr3.concat(arr4);
            return newArr;
        }

        var inside = [];
        for (var i = 0; i < this.state.inSideGroup.length; i++) {
            inside.push(this.state.inSideGroup[i].hostip)
        }
        var add_ips_arr = diff(this.ready_del_arr, inside);
        let add_ips_str = '';
        for (let j = 0; j < add_ips_arr.length; j++) {
            add_ips_str += add_ips_arr[j] + '#'
        }
        var data = {
            name: this.state.groupName,
            remark: this.state.groupRemark,
            group_id: this.state.currentGroupId,
            add_ips_str: add_ips_str,
            del_ips_str: add_ips_str,
        }
        $.ajax({
            url: '/api/machinelist/update_group/',
            type: 'post',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: data,
            success: function (result) {
                if (result.code == 200) {
                    self.handleGroupDetail()
                    self.getAllGroup()
                }
                if (result.code == 201) {
                    self.setState({
                        errorMsg: result.message
                    })
                }
            },
            error: function () {
                self.setState({
                    errorMsg: '创建失败'
                })
            }
        })
    }
    //移动主机
    /*
    * location
    * in 组内主机移动到组外
    * out 组外主机移动到组内
    * */
    handleMoveHost(location) {
        switch (location) {
            case 'out':
                let moveToOut = {
                    ele: $('.insideGroupTable .hostlist-detail .hostlist-hostname .custom-checkbox:checked'),
                    className: 'selected-host',
                    moveTo: this.state.outSideGroup,
                    moveFrome: this.state.hostInListSearch || this.state.inSideGroup
                }
                this.checkHasClass(moveToOut, 'out')
                //将所有选中的元素取消选中,操作按钮添加not-allowed类名
                this.initialAllCheckbox()
                //移动主机之后将搜索的主机列表切换成所有主机列表
                $('.out-host-search-ipt').val('')
                $('.in-host-search-ipt').val('')
                this.setState({
                    hostOutListSearch: false,
                    hostInListSearch: false
                })
                break;
            case 'in':
                let moveToIn = {
                    ele: $('.outsideGroupTable .hostlist-detail .hostlist-hostname .custom-checkbox:checked'),
                    className: 'selected-host',
                    moveTo: this.state.inSideGroup,
                    moveFrome: this.state.hostOutListSearch || this.state.outSideGroup
                }
                this.checkHasClass(moveToIn, 'in')
                //将所有选中的元素取消选中,操作按钮添加not-allowed类名
                this.initialAllCheckbox()
                //移动主机之后将搜索的主机列表切换成所有主机列表
                $('.out-host-search-ipt').val('')
                $('.in-host-search-ipt').val('')
                this.setState({
                    hostOutListSearch: false,
                    hostInListSearch: false
                })
                break;
        }
    }

    /*
   let ele = moveToIn.ele 判断是都选中的元素
   let className = moveToIn.className 判断是否选中的class
   let moveTo = moveToIn.moveTo 主机移动的目的
   let moveFrome = moveToIn.moveFrome 主机移动的来源
   way ： [in 组内主机移动到组外 ; out 组外主机移动到组内]
  * */
    checkHasClass(moveToIn, way) {
        let ele = moveToIn.ele
        let className = moveToIn.className
        let moveTo = moveToIn.moveTo
        let moveFrome = moveToIn.moveFrome
        //循环，获得判断元素的个数
        let len = $(ele).length;
        //获取主机移动目的列表的数组
        let arr = moveTo;
        //获取主机移动来源列表的数组
        let originalArr = moveFrome;
        //初始化需要移动的主机列表
        let deleteArr = [];
        //循环，获取选中的主机单列
        for (let i = 0; i < len; i++) {
            //判断每一个元素是否包含指定的类名
            //包含次类名，则将这个主机加入到目的主机列表
            arr.push(originalArr[i])
            //同时，将此列主机的编号加入到需要删除的数组中
            deleteArr.push(i)
        }
        //设置主机列表
        /*
        * arr ： 经过循环处理之后的主机移动目的列表的数组
        * originalArr ： 经过循环处理之后的主机移动来源列表的数组
        * deleteArr ： 需要移动的主机列表
        * */
        this.setHostList(arr, originalArr, deleteArr, way)
    }

    /*
       * hostInList ： 经过循环处理之后的主机移动目的列表的数组
       * hostOutList ： 经过循环处理之后的主机移动来源列表的数组
       * deleteArr ： 需要移动的主机列表
       * way ： [in 组内主机移动到组外 ; out 组外主机移动到组内]
       * */
    setHostList(hostInList, hostOutList, deleteArr, way) {
        //初始化一个数组
        let hostOutListArr = []
        /*
        * 处理列表，若是有搜索的列表要做不同的处理
        * _hostOutList：
        * pickOrNot：是否是搜索的列表，
        *            传入的参数为state.hostOutListSearch/state.hostInListSearch
        * */
        function reduceList(_hostOutList, pickOrNot) {
            if (pickOrNot) {
                for (let i = 0; i < deleteArr.length; i++) {
                    var index = deleteArr[i]
                    //当是查询列表时，需要获取原来主机列表需要删除项的下标
                    var num = _hostOutList.indexOf(hostOutList[index])
                    //删除原来主机列表项
                    delete _hostOutList[num]

                }
                //由于数组方法delete，删除之后依旧会存在undefined，所以将删除后的数组循环，放到一个新的数组中
                let num;
                for (num in _hostOutList) {
                    hostOutListArr.push(_hostOutList[num])
                }
            } else {
                //循环，将需要移动的主机从源主机列表删除
                for (let i = 0; i < deleteArr.length; i++) {
                    var index = deleteArr[i]
                    delete hostOutList[index]
                }
                //由于数组方法delete，删除之后依旧会存在undefined，所以将删除后的数组循环，放到一个新的数组中
                let num;
                for (num in hostOutList) {
                    hostOutListArr.push(hostOutList[num])
                }
            }

        }

        switch (way) {
            case 'in':
                //组外列表移动到组内
                let _hostInList = this.state.outSideGroup;
                reduceList(_hostInList, this.state.hostOutListSearch);
                break;
            case 'out':
                //组内列表移动到组外
                let _hostOutList = this.state.inSideGroup;
                reduceList(_hostOutList, this.state.hostInListSearch);
                break;
        }

        //传参，生成主机列表
        this.reSetList(hostInList, hostOutListArr, way)

    }

    /*
    * 设置主机列表
    * hostInList：生成的组内主机
    * hostOutListArr：生成的组外主机
    * way　：组内/组外
    * */
    reSetList(hostInList, hostOutListArr, way) {
        //设置主机列表
        if (way == 'in') {
            this.setState({
                inSideGroup: hostInList,
                outSideGroup: hostOutListArr,
            })
        } else {
            this.setState({
                inSideGroup: hostOutListArr,
                outSideGroup: hostInList
            })

        }
    }

    /*搜索主机
    * hostList：主机列表（组外或者组内）---- this.state.hostOutList
    * searchItem：搜索关键字
    * location：组内或者组外主机
    * */
    filterSearchItem(hostList, searchItem, location) {
        //初始化列表
        let filterList = [];
        //循环，生成ip/name列表
        for (let i = 0; i < hostList.length; i++) {
            //生成数组
            filterList.push(hostList[i].hostip + ' ' + hostList[i].hostname)
        }

        //匹配关键字，并刷新列表
        this.regexpFilter(filterList, searchItem, hostList, location)

    }
    /*匹配关键字，并刷新列表
    * filterList：ip/name列表
    * searchItem：搜索关键字
    * location：组内或者组外主机
    * hostList：主机列表（组外或者组内）---- this.state.hostOutList
    * 正则匹配成功后，列表发生变化，只修改----this.state.hostOutListSearch，原本的主机列表（this.state.hostOutList ）千万不能修改
    * */
    regexpFilter(filterList, searchItem, hostList, location) {
        //初始化关键字过滤列表
        let filterHostList = [];
        //循环，判断搜索关键字是否匹配ip/name项
        for (let i = 0; i < filterList.length; i++) {
            //匹配成功，将列表的第Ｉ项添加到ip/name列表中
            if (filterList[i].indexOf(searchItem) > -1) {
                filterHostList.push(hostList[i])
            }
        }
        //列表更新
        switch (location) {
            case 'out':
                this.setState({
                    hostOutListSearch: filterHostList
                });
                break;
            case 'in':
                this.setState({
                    hostInListSearch: filterHostList
                });
                break;
        }
    }

    render() {
        var self = this;
        var searchRange = [{
            name: "小时",   //显示在列表中的项
            value: -1      //选中时传递的值
        }, {
            name: "分钟",
            value: 0
        }, {
            name: "秒",
            value: 1
        }];
        return (
            <div>
                {this.state.currentTab == 1 &&
                    <div className="protectControl-content">
                        <h2 className="content-title">
                            主机列表
                        </h2>
                        <div className="btns-group clearfix">
                            <div className="btn-group-left">
                                <div className='check-type-host'>
                                    <div className='check-all active'>全部主机</div>
                                    <div className='check-group' onClick={this.selectCurrentTab.bind(this, 3)}>主机组</div>
                                </div>
                                <form onSubmit={this.handleSearchHost}>
                                    <input
                                        id="searchVirusScan"
                                        type="text"
                                        placeholder="搜索主机信息"
                                        className="form-control input-search"
                                        onChange={this.onChangeSearchInput.bind(this)} />
                                    <button className="btn-search  btn btn-icon  btn-icon-blue" onClick={this.handleSearchHost}>
                                        <i className="fa fa-search" aria-hidden="true"></i>
                                    </button>
                                </form>
                                <div className='sys-select-all' onClick={this.sysSelect.bind(this)}> {this.state.sysSelectAllText} </div>
                            </div>

                            <div className="btn-group-search">
                                操作：
                                <button className="btn btn-icon  btn-all-ctl not-allowed" title='开始查杀' onClick={this.allkilling.bind(this)}>
                                    <i className="fa fa-play" aria-hidden="true"></i>
                                </button>
                                <button className="btn btn-icon btn-all-ctl not-allowed" title='暂停查杀' onClick={this.allpause.bind(this)}>
                                    <i className="fa fa-stop" aria-hidden="true"></i>
                                </button>
                                <button className="btn btn-icon big-space" title='添加' onClick={this.changeAddServer.bind(this)}>
                                    <i className="fa fa-plus" aria-hidden="true"></i>
                                </button>
                                <button className=" btn btn-icon btn-all-ctl btn-all-delete not-allowed" title='删除' onClick={this.deleteServer.bind(this)}>
                                    <i className="fa fa-trash" aria-hidden="true"></i>
                                </button>
                                <button className=" btn btn-icon big-space" title='系统设置' onClick={this.handleSetting.bind(this)}>
                                    <i className="fa fa-cog" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>

                        {/*主机列表的表格*/}
                        <table className="hostlist-table hostaListTable">
                            <thead>
                                <tr>
                                    <th className="hostlist-hostname">
                                        <input type="checkbox" id="hostaListTable-all" className="custom-checkbox"   ></input>
                                        <label htmlFor="hostaListTable-all" onClick={this.toggleSelectAll.bind(this, 'hostaListTable')}></label>{/*自定义的复选框样式*/}
                                        主机别名
                                         <i className={this.sortByHostname == 'id' ? "fa fa-angle-up" : "fa fa-angle-down"}
                                            aria-hidden="true" onClick={this.sortTable.bind(this, 'hostname')}></i>
                                    </th>
                                    <th className="hostlist-hostip">
                                        主机 IP
                                         <i className={this.sortByIP == 'hostip' ? "fa fa-angle-up" : "fa fa-angle-down"}
                                            aria-hidden="true" onClick={this.sortTable.bind(this, 'ip')}></i>
                                    </th>
                                    <th className="hostlist-description">
                                        在线状态
                                          <i className={this.sortByStatus == 'is_scan' ? "fa fa-angle-up" : "fa fa-angle-down"}
                                            aria-hidden="true" onClick={this.sortTable.bind(this, 'status')}></i>
                                    </th>
                                    <th className="hostlist-status">
                                        查杀操作
                                    </th>
                                    <th className="hostlist-maintenance">备注信息</th>
                                    <th className="hostlist-details"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.state.hostlist && this.state.hostlist.map(function (i, index) {
                                    return (
                                        <tr className="hostlist-detail" key={index}>
                                            <td className="hostlist-hostname">
                                                <input type="checkbox" id={"hostaListTable-" + index} title={i.hostip} className="custom-checkbox" onClick={this.checkSelectAll.bind(this, 'hostaListTable')}></input>
                                                <label htmlFor={"hostaListTable-" + index}></label>{/*自定义的复选框样式*/}
                                                {i.hostname}
                                            </td>
                                            <td className="hostlist-hostip">{i.hostip}</td>
                                            <td className="hostlist-status"><i className={i.status ? "circle status-yes" : "circle status-no"}></i></td>
                                            {
                                                i.status ?
                                                    i.is_scan ?
                                                        <td className="hostlist-description killing">
                                                            <div className="hostlist-start">
                                                                <div className="hostlist-triangle"></div>
                                                            </div>

                                                            <div className="hostlist-termination " onClick={() => this.scan_stop(i.hostip)}>
                                                                <div className="hostlist-square"></div>
                                                            </div>
                                                            <div className="hostlist-killing">
                                                                <i className="fa fa-spinner fa-spin fa-lg fa-fw"></i>
                                                                查杀中
                                                         </div>
                                                        </td>
                                                        :
                                                        <td className="hostlist-description">
                                                            <div className="hostlist-start" onClick={() => this.scan_start(i.hostip)}>
                                                                <div className="hostlist-triangle"></div>
                                                            </div>
                                                            <div className="hostlist-termination">
                                                                <div className="hostlist-square"></div>
                                                            </div>
                                                        </td>
                                                    :
                                                    <td className="hostlist-description">
                                                        <div className="hostlist-start no-protect">
                                                            <div className="hostlist-triangle"></div>
                                                        </div>
                                                        <div className="hostlist-termination">
                                                            <div className="hostlist-square"></div>
                                                        </div>
                                                    </td>
                                            }
                                            <td className="hostlist-remark">{i.remark}</td>
                                            <th className="hostlist-details" onClick={() => this.changeHost(i.hostname, i.hostip, i.status, i.remark, i.is_scan, i.scan_log)}>详细信息 > </th>
                                        </tr>
                                    )
                                }.bind(this))
                                }

                                {
                                    !this.state.hostlist.length && <tr className="hostlist-detail" style={{ width: '100%', height: '70px', lineHeight: '70px', background: 'transparent', border: 'none', }}><td style={{ paddingLeft: '40px' }}>当前没有匹配的数据。</td></tr>
                                }
                            </tbody>
                        </table>
                        <CustomPagination
                            from={(this.currentPage - 1) * this.rowsPerPage}
                            to={(this.currentPage - 1) * this.rowsPerPage + this.state.hostlist.length}
                            totalItemsCount={this.state.totalItemsCount}
                            totalPagesCount={this.state.pageCount}
                            currentPage={this.currentPage}
                            onChangeRowsPerPage={(num) => this.setRowsPerPage(num)}
                            onSelectPage={(e) => this.handleSelectPage(e)}
                            onChangePageInput={(e) => this.onChangeInputPage(e)}
                            onPageInputKeyDown={(e) => this.jumpPageKeyDown(e)}
                            onClickJumpButton={() => this.handleJumpPage()}
                        />
                    </div>
                }

                {this.state.currentTab == 2 &&
                    <div className="protectControl-content details-host">
                        <h2 className="content-title">
                            <span style={{ cursor: 'pointer' }} onClick={() => this.setState({ selectHost: '', currentTab: 1 })}> 主机列表 ></span> <span style={{ color: '#fff' }}>{this.state.selectHost}</span>
                        </h2>
                        {this.state.selectStatus ?
                            this.state.selectAction ?
                                <div className="host-status">
                                    <img src="/static/img/systemCheck/checking.gif" className="status-img" />
                                    <div className="host-scan-des">
                                        <div>正在扫描中… </div>
                                        <div>过程将持续一段时间，可点击“终止”取消扫描。</div>
                                    </div>
                                    <button className="btn btn-sm btn-default termination-scan" onClick={() => this.scan_stop(this.state.selectIP)} >终止扫描</button>
                                </div>
                                :
                                <div className="host-status">
                                    <img src="/static/img/systemCheck/protected.png" className="status-img" />
                                    <div className="host-scan-des">
                                        <div>受到保护 </div>
                                        <div>您可以点击右侧按钮，开始扫描本机。</div>
                                    </div>
                                    <button className="btn btn-sm btn-primary termination-scan" onClick={() => this.scan_start(this.state.selectIP)} >开始扫描</button>
                                </div>
                            :
                            <div className="host-status">
                                <img src="/static/img/systemCheck/unprotected.png" className="status-img" />
                                <div className="host-scan-des">
                                    <div>不受保护 </div>
                                    <div>系统未受保护，无法进行扫描。可联系管理员解决。</div>
                                </div>
                                <button className="btn termination-scan" style={{ cursor: "not-allowed", background: "#444851", color: "#8C8C8C" }} >开始扫描</button>
                            </div>
                        }

                        <table className="host-detail-table" >
                            <thead>
                                <tr>
                                    <th>主机标签</th>
                                    <th>主机 IP</th>
                                    <th>在线状态</th>
                                    <th>备注</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{this.state.selectHost}</td>
                                    <td>{this.state.selectIP}</td>
                                    <td>{this.state.selectStatus}</td>
                                    <td>{this.state.selectRemark}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div style={{ marginTop: '20px' }}>
                            <button className=" btn btn-sm btn-default" style={{ marginRight: '20px' }} onClick={this.handleEditServer.bind(this)}>
                                编辑信息
                            </button>
                            <button className="btn btn-sm btn-default" onClick={this.deleteSingle.bind(this, this.state.selectIP)}>
                                删除主机
                             </button>
                        </div>

                        <div className="killing-log">
                            <div className="killing-log-title">查杀日志</div>
                            <pre>{`"${this.state.selectLog}"`} </pre>
                        </div>
                    </div>

                }

                {this.state.currentTab == 3 &&
                    <div className="protectControl-content">
                        <h2 className="content-title">
                            组列表
                        </h2>
                        <div className="btns-group clearfix">
                            <div className="btn-group-left">
                                <div className='check-type-host'>
                                    <div className='check-all' onClick={this.selectCurrentTab.bind(this, 1)}>全部主机</div>
                                    <div className='check-group active'>主机组</div>
                                </div>
                                <form onSubmit={this.handleSearchHost}>
                                    <input
                                        id="searchGroup"
                                        type="text"
                                        placeholder="搜索主机组"
                                        className="form-control input-search"
                                        onChange={this.onChangeGroupSearchInput.bind(this)} />

                                    <button className="btn-search  btn btn-icon  btn-icon-blue" onClick={this.handleSearchHost}>
                                        <i className="fa fa-search" aria-hidden="true"></i>
                                    </button>
                                </form>
                                <div className='sys-select-all' onClick={this.sysGroupSelect.bind(this)} >{this.state.sysGroupSelectAllText}</div>
                            </div>
                            <div className="btn-group-search">
                                操作：
                               {/* <button className="btn-apply-protection btn btn-icon btnGroup-all-ctl not-allowed">
                                </button>
                                <button className="btn-pause-protection btn btn-icon btnGroup-all-ctl not-allowed">
                                </button>
                                <button className="btn-apply-blocking btn btn-icon btnGroup-all-ctl not-allowed">
                                </button>
                                <button className="btn-stop-blocking btn btn-icon btnGroup-all-ctl not-allowed">
                                </button>
                                */}
                                <button className="btn btn-icon big-space" onClick={() => this.showCreatGroup('plus')}>
                                    <i className="fa fa-plus" aria-hidden="true"></i>
                                </button>
                                <button className="btn btn-icon btnGroup-all-ctl not-allowed">
                                    <i className="fa fa-trash" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>

                        {/*主机列表的表格*/}
                        <table className="hostlist-table  hostGroupTable">
                            <thead>
                                <tr>
                                    <th className="hostlist-hostname">
                                        <input type="checkbox" id="hostGroupTable-all" className="custom-checkbox"  ></input>
                                        <label htmlFor="hostGroupTable-all" onClick={this.toggleSelectAll.bind(this, 'hostGroupTable')}></label>{/*自定义的复选框样式*/}
                                        组名称
                                        <i className={this.sortByHostname == 'id' ? "fa fa-angle-up" : "fa fa-angle-down"}
                                            aria-hidden="true" ></i>
                                    </th>
                                    <th className="hostlist-hostip">
                                        创建时间
                                        <i className={this.sortByIP == 'hostip' ? "fa fa-angle-up" : "fa fa-angle-down"}
                                            aria-hidden="true" ></i>
                                    </th>
                                    <th className="hostlist-description">
                                        最后更改时间
                                         <i className={this.sortByStatus == 'is_scan' ? "fa fa-angle-up" : "fa fa-angle-down"}
                                            aria-hidden="true" ></i>
                                    </th>
                                    <th className="hostlist-status">
                                        备注
                                   </th>
                                    <th className="hostlist-details"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.state.groupList && this.state.groupList.map(function (i, index) {
                                    return (
                                        <tr className="hostlist-detail" key={index}>
                                            <td className="hostlist-hostname">
                                                <input type="checkbox" id={"hostGroupTable-" + index} title={i.name} className="custom-checkbox" onClick={this.checkSelectAll.bind(this, 'hostGroupTable')}></input>
                                                <label htmlFor={"hostGroupTable-" + index}></label>{/*自定义的复选框样式*/}
                                                {i.name}
                                            </td>
                                            <td className="">{i.createtime}</td>
                                            <td className="">{i.edittime}</td>
                                            <td className="">{i.remark}</td>
                                            <th className="hostlist-details" onClick={() => this.showCreatGroup('updata', i.id)}>详细信息 > </th>
                                        </tr>
                                    )
                                }.bind(this))
                                }
                                {
                                    !this.state.hostlist.length && <tr className="hostlist-detail" style={{ width: '100%', height: '70px', lineHeight: '70px', background: 'transparent', border: 'none', }}><td style={{ paddingLeft: '40px' }}>当前没有匹配的数据。</td></tr>
                                }
                            </tbody>
                        </table>
                        <CustomPagination
                            from={(this.group_currentPage - 1) * this.grouprowsPerPage}
                            to={(this.group_currentPage - 1) * this.grouprowsPerPage + this.state.groupList.length}
                            totalItemsCount={this.state.grouptotalItemsCount}
                            totalPagesCount={this.state.groupPageCount}
                            currentPage={this.group_currentPage}
                            onChangeRowsPerPage={(num) => this.setGroupRowsPerPage(num)}
                            onSelectPage={(e) => this.handleGroupSelectPage(e)}
                            onChangePageInput={(e) => this.onChangeGroupInputPage(e)}
                            onPageInputKeyDown={(e) => this.jumpGroupPageKeyDown(e)}
                            onClickJumpButton={() => this.handleGroupJumpPage()}
                            pageNumInputId='groupInputPageNum'
                        />
                    </div>
                }

                {/*-------------------------------------------编辑组信息的的显示弹窗--------------------------*/}

                {this.state.groupDetail &&
                    <Modal id="groupDetail" bsSize="lg" aria-labelledby="contained-modal-title-sm" show={this.state.groupDetail}
                        onHide={() => this.handleGroupDetail()}>
                        <Modal.Header closeButton>
                            <Modal.Title >编辑主机组信息</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <label>主机组名称
                                 <input placeholder='主机组名称' type='text' className='form-control' value={this.state.groupName} onChange={(e) => this.setState({ groupName: e.target.value })} />
                            </label>
                            <label>备注信息
                                 <input placeholder='备注信息' type='text' className='form-control' value={this.state.groupRemark} onChange={(e) => this.setState({ groupRemark: e.target.value })} />
                            </label>
                            <div className='line'></div>
                            <div className='group-host clearfix'>
                                <div className='outside-group'>
                                    <div>组外的主机</div>
                                    <form className='clearfix'>
                                        <input placeholder='搜索 IP 或别名' className='out-host-search-ipt' type='text' />
                                        <button className="btn-search  btn btn-icon  btn-icon-blue" onClick={this.handleGroupList.bind(this, 'out')}>
                                            <i className="fa fa-search" aria-hidden="true"></i>
                                        </button>
                                    </form>

                                    {/*主机列表的表格*/}
                                    <div className='group-table'>
                                        <table className="hostlist-table outsideGroupTable">
                                            <thead>
                                                <tr>
                                                    <th className="hostlist-hostname">
                                                        <input type="checkbox" id="utsideGroupTable-all" className="custom-checkbox"   ></input>
                                                        <label htmlFor="utsideGroupTable-all" onClick={this.toggleSelectAll.bind(this, 'outsideGroupTable')}></label>{/*自定义的复选框样式*/}
                                                        主机别名
                                                    </th>
                                                    <th className="hostlist-hostip">
                                                        主机 IP
                                                    </th>
                                                    <th className="hostlist-maintenance">备注信息</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(this.state.hostOutListSearch || this.state.outSideGroup).map(function (i, index) {
                                                    return (
                                                        <tr className="hostlist-detail" key={index}>
                                                            <td className="hostlist-hostname">
                                                                <input type="checkbox" id={"utsideGroupTable-" + index} title={i.hostip} className="custom-checkbox" onClick={this.checkSelectAll.bind(this, 'outsideGroupTable')}></input>
                                                                <label htmlFor={"utsideGroupTable-" + index}></label>{/*自定义的复选框样式*/}
                                                                {i.hostname}
                                                            </td>
                                                            <td className="hostlist-hostip">{i.hostip}</td>
                                                            <td className="hostlist-remark">{i.remark}</td>
                                                        </tr>
                                                    )
                                                }.bind(this))}

                                                {
                                                    !this.state.hostlist.length && <tr className="hostlist-detail" style={{ width: '100%', height: '70px', lineHeight: '70px', background: 'transparent', border: 'none', }}><td style={{ paddingLeft: '40px' }}>当前没有匹配的数据。</td></tr>
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className='brdige'>
                                    <div>
                                        <Button className='brdige-right btn btn-icon btn-icon-blue not-allowed' onClick={this.handleMoveHost.bind(this, 'in')} ><i className="fa fa fa-arrow-right" aria-hidden="true"></i></Button>
                                        <Button className='brdige-left btn btn-icon btn-icon-red not-allowed' onClick={this.handleMoveHost.bind(this, 'out')}> <i className="fa fa fa-arrow-left" aria-hidden="true"></i></Button>
                                    </div>
                                </div>

                                <div className='inside-group'>
                                    <div>组内的主机</div>
                                    <form className='clearfix'>
                                        <input placeholder='搜索 IP 或别名' className='in-host-search-ipt' type='text' />
                                        <button className="btn-search  btn btn-icon  btn-icon-blue" onClick={this.handleGroupList.bind(this, 'in')}>
                                            <i className="fa fa-search" aria-hidden="true"></i>
                                        </button>
                                    </form>

                                    {/*主机列表的表格*/}
                                    <div className='group-table'>
                                        <table className="hostlist-table insideGroupTable">
                                            <thead>
                                                <tr>
                                                    <th className="hostlist-hostname">
                                                        <input type="checkbox" id="insideGroupTable-all" className="custom-checkbox"  ></input>
                                                        <label htmlFor="insideGroupTable-all" onClick={this.toggleSelectAll.bind(this, 'insideGroupTable')}></label>{/*自定义的复选框样式*/}
                                                        主机别名
                                                    </th>
                                                    <th className="hostlist-hostip">
                                                        主机 IP
                                                    </th>
                                                    <th className="hostlist-maintenance">备注信息</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(this.state.hostInListSearch || this.state.inSideGroup).map(function (i, index) {
                                                    return (
                                                        <tr className="hostlist-detail" key={index}>
                                                            <td className="hostlist-hostname">
                                                                <input type="checkbox" id={"insideGroupTable-" + index} title={i.hostip} className="custom-checkbox" onClick={this.checkSelectAll.bind(this, 'insideGroupTable')}></input>
                                                                <label htmlFor={"insideGroupTable-" + index} ></label>{/*自定义的复选框样式*/}
                                                                {i.hostname}
                                                            </td>
                                                            <td className="hostlist-hostip">{i.hostip}</td>
                                                            <td className="hostlist-remark">{i.remark}</td>
                                                        </tr>
                                                    )
                                                }.bind(this))
                                                }
                                                {
                                                    !this.state.hostlist.length && <tr className="hostlist-detail" style={{ width: '100%', height: '70px', lineHeight: '70px', background: 'transparent', border: 'none', }}><tr style={{ paddingLeft: '40px', background: 'transparent' }}>当前没有匹配的数据。</tr></tr>
                                                }
                                            </tbody>
                                        </table>
                                    </div>

                                </div>
                            </div>
                            <p className="errorMsg">{this.state.errorMsg}</p>

                        </Modal.Body>
                        <Modal.Footer>
                            <Button className="btn btn-xs btn-default" onClick={this.handleGroupDetail.bind(this)}>取消</Button>
                            <Button className="btn btn-xs btn-primary" onClick={this.creatGroup.bind(this)}>确认</Button>
                        </Modal.Footer>
                    </Modal>

                }

                {/*--------------------------------------------编辑主机弹窗---------------------------------*/}
                {this.state.showEditServer &&
                    <EditServer
                        show={this.state.showEditServer}
                        hide={() => this.handleEditServer()}
                        ip={this.state.selectIP}
                        tag={this.state.selectHost}
                        remark={this.state.selectRemark}
                        getHostList={() => this.getHostList()}
                    />
                }

                {/*--------------------------------------------新增主机弹窗---------------------------------*/}
                {this.state.showAddServer &&
                    <AddServer
                        show={this.state.showAddServer}
                        hide={() => this.changeAddServer()}
                        getHostList={() => this.getHostList()}

                    />
                }
                {/*--------------------------------------------新增主机弹窗---------------------------------*/}

                {/*--------------------------------------------扫描设置弹窗---------------------------------*/}
                {this.state.showSetting &&
                    <SystemSetting
                        show={this.state.showSetting}
                        hide={() => this.handleSetting()}
                    />
                }
                {/*--------------------------------------------扫描设置弹窗---------------------------------*/}

                {/*消息提示框*/}
                <MessageBox
                    showMsgBox={this.state.showMsgBox}
                    msgContent={this.state.msgContent}
                    msgButtonState={this.state.msgButtonState}
                    msgButtonName={this.state.msgButtonName}
                    handleConfirmMsgBox={this.handleConfirmMsgBox.bind(this)}
                />
            </div>
        )
    }

}

