import React from "react"                    //引入react
import $ from 'jquery'
// 可信审计－－列表显示
export default class EditHost extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            hostOutList:[],
            hostInList:[],
            OutHostAllSelect:false,
            InHostAllSelect:false,
            searchItemOut:'',//组外主机搜索关键字
            errorMsg:'',
            hostOutListSearch:false,//模糊查询搜索组外主机列表
            hostInListSearch:false,//模糊查询搜索组内主机列表
        }
        this.hostNameSet = false;
        this.hostRemarkSet = false;

    }
    //选择主机(包括全选和单选)
    handelSelectHost(location,e){
        switch (location){
            case 'out' :
                this.setState({
                    OutHostAllSelect:!this.state.OutHostAllSelect,
                })
                if(!this.state.OutHostAllSelect){
                    $(e.target).addClass('selected-host')
                    $('.left-host-out .list-body td span.host-checkbox').addClass('selected-host')
                }else{
                    $(e.target).removeClass('selected-host')
                    $('.left-host-out .list-body td span.host-checkbox').removeClass('selected-host')
                }
                break;
            case 'in' :
                this.setState({
                    InHostAllSelect:!this.state.InHostAllSelect,
                })
                if(!this.state.InHostAllSelect){
                    $(e.target).addClass('selected-host')
                    $('.right-host-in .list-body td span.host-checkbox').addClass('selected-host')
                }else{
                    $(e.target).removeClass('selected-host')
                    $('.right-host-in .list-body td span.host-checkbox').removeClass('selected-host')
                }
                break;
            case 'outSingle':
                $(e.target).toggleClass('selected-host')
                if(!$(e.target).hasClass('selected-host')){
                    this.setState({
                        OutHostAllSelect:false,
                    })
                    $('.left-host-out .list-head td span.host-checkbox').removeClass('selected-host')
                }
                break;
            case 'inSingle' :
                $(e.target).toggleClass('selected-host')
                if(!$(e.target).hasClass('selected-host')){
                    this.setState({
                        InHostAllSelect:false
                    })
                    $('.right-host-in .list-head td span.host-checkbox').removeClass('selected-host')
                }
                break;
        }
    }

    //移动主机
    /*
     * location
     * in 组内主机移动到组外
     * out 组外主机移动到组内
     * */
    handleMoveHost(location){
        switch (location){
            case 'out' :
                //移动主机之后将搜索的主机列表切换成所有主机列表
                $('.out-host-search-ipt').val('')
                $('.in-host-search-ipt').val('')
                this.setState({
                    hostOutListSearch : false,
                    hostInListSearch : false
                })
                let moveToOut = {
                    ele : $('.right-host-in .list-body td span'),
                    className : 'selected-host' ,
                    moveTo : this.state.hostOutList,
                    moveFrome : this.state.hostInListSearch || this.state.hostInList　//若有搜索查询列表则传入查询列表
                }
                this.checkHasClass(moveToOut,'out')
                //将所有选中的元素取消选中
                $('.selectHost table td span').removeClass('selected-host')

                break;
            case 'in' :
                //移动主机之后将搜索的主机列表切换成所有主机列表
                $('.out-host-search-ipt').val('')
                $('.in-host-search-ipt').val('')
                this.setState({
                    hostOutListSearch : false,
                    hostInListSearch : false
                })

                let moveToIn = {
                    ele : $('.left-host-out .list-body td span'),
                    className : 'selected-host' ,
                    moveTo : this.state.hostInList,
                    moveFrome : this.state.hostOutListSearch || this.state.hostOutList,　//若有搜索查询列表则传入查询列表
                }
                this.checkHasClass(moveToIn,'in')
                //将所有选中的元素取消选中
                $('.selectHost table td span').removeClass('selected-host')


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
    checkHasClass(moveToIn,way){
        let ele = moveToIn.ele
        let className = moveToIn.className
        let moveTo = moveToIn.moveTo
        let moveFrome = moveToIn.moveFrome
        //循环，获得判断元素的个数
        let len = $(ele).length;
        //获取主机移动目的列表的数组
        let arr = moveTo;
        //获取主机移动来源列表的数组
        let originalArr = moveFrome ;
        //初始化需要移动的主机列表
        let deleteArr = [] ;
        //循环，获取选中的主机单列
        for(let i = 0 ; i < len ; i++){
            //判断每一个元素是否包含指定的类名
            if($(ele).eq(i).hasClass(className)){
                //包含次类名，则将这个主机加入到目的主机列表
                arr.push(originalArr[i])
                //同时，将此列主机的编号加入到需要删除的数组中
                deleteArr.push(i)
            }
        }
        //设置主机列表
        /*
         * arr ： 经过循环处理之后的主机移动目的列表的数组
         * originalArr ： 经过循环处理之后的主机移动来源列表的数组
         * deleteArr ： 需要移动的主机列表
         * */
        this.setHostList(arr,originalArr,deleteArr,way)
    }
    /*
     * hostInList ： 经过循环处理之后的主机移动目的列表的数组
     * hostOutList ： 经过循环处理之后的主机移动来源列表的数组
     * deleteArr ： 需要移动的主机列表
     * way ： [in 组内主机移动到组外 ; out 组外主机移动到组内]
     * */
    setHostList(hostInList,hostOutList,deleteArr,way){
        //初始化一个数组
        let hostOutListArr = []
        /*
         * 处理列表，若是有搜索的列表要做不同的处理
         * _hostOutList：
         * pickOrNot：是否是搜索的列表，
         *            传入的参数为state.hostOutListSearch/state.hostInListSearch
         * */
        function reduceList(_hostOutList,pickOrNot) {
            if(pickOrNot){
                for(let i = 0 ; i < deleteArr.length ; i++){
                    var index = deleteArr[i]
                    //当是查询列表时，需要获取原来主机列表需要删除项的下标
                    var num = _hostOutList.indexOf(hostOutList[index])
                    //删除原来主机列表项
                    delete _hostOutList[num]

                }
                //由于数组方法delete，删除之后依旧会存在undefined，所以将删除后的数组循环，放到一个新的数组中
                let num ;
                for(num in _hostOutList){
                    hostOutListArr.push(_hostOutList[num])
                }
            }else{
                //循环，将需要移动的主机从源主机列表删除
                for(let i = 0 ; i < deleteArr.length ; i++){
                    var index = deleteArr[i]
                    delete hostOutList[index]
                }
                //由于数组方法delete，删除之后依旧会存在undefined，所以将删除后的数组循环，放到一个新的数组中
                let num ;
                for(num in hostOutList){
                    hostOutListArr.push(hostOutList[num])
                }
            }

        }

        switch (way){
            case 'in' :
                //组外列表移动到组内
                let _hostInList = this.state.hostOutList;
                reduceList(_hostInList,this.state.hostOutListSearch);
                break;
            case 'out' :
                //组内列表移动到组外
                let _hostOutList = this.state.hostInList;
                reduceList(_hostOutList,this.state.hostInListSearch);
                break;
        }

        //传参，生成主机列表
        this.reSetList(hostInList,hostOutListArr,way)

    }
    /*
     * 设置主机列表
     * hostInList：生成的组内主机
     * hostOutListArr：生成的组外主机
     * way　：组内/组外
     * */
    reSetList(hostInList,hostOutListArr,way){
        //设置主机列表
        if(way=='in'){
            this.setState({
                hostInList:hostInList,
                hostOutList:hostOutListArr,
            })
        }else{
            this.setState({
                hostInList:hostOutListArr,
                hostOutList:hostInList
            })

        }
    }

    /*
     当新增主机组时，获取全部主机为组外主机，组内主机为空
     获取全部主机
     api/blackbox/get_hosts/
     field : sortField = null;  //get_host接口所需的field参数。‘hostname-0’ 表示按照按照主机别名升序;‘hostname-1’ 表示按照按照主机别名降序。
     condition : searchItem = null; //搜索输入框中的内容
     type : searchRange = '-1';    //搜索操作的范围，下拉列表所选的值
     */
    getOutHostList(){
        var self = this;
        $.ajax({
            url: '/api/blackbox/get_hosts/',
            type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: {                         //表单数据
                page_num: 1,
                page_size:10000000 ,
                condition: self.state.searchItemOut,
                field: self.props.sortField,
                type: self.props.searchRange,
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            traditional: true,          //阻止JQuery深度序列化对象
            success: function(result){
                if(result.data){
                    self.setState({
                        hostOutList: result.data,
                        hostInList:[],
                    })
                }else{
                    self.setState({
                        hostOutList: [],
                        hostInList:[],
                    })
                }
            },
            error: function(){
                self.setState({
                    hostOutList: [],
                    hostInList:[],
                })
            }

        })
    }
    /*
     获取组内主机
     api/blackbox/get_group_detail/
     */
    getInHostList(){
        var self = this;
        $.ajax({
            url: '/api/blackbox/get_group_detail/',
            type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: {                         //表单数据
                id:self.props.operateHostId, //组id
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            traditional: true,          //阻止JQuery深度序列化对象
            success: function(result){
                if(result.status==200){
                    self.setState({
                        hostOutList: result.out_group,
                        hostInList:result.in_group,
                    })
                }else{
                    self.setState({
                        hostOutList: [],
                        hostInList:[],
                    })
                }
            },
            error: function(){
                self.setState({
                    hostOutList: [],
                    hostInList:[],
                })
            }

        })
    }
    /*
     * 新增主机
     *
     *
     * */
    addHostOperate(){
        let ipString = '';
        let ipList = this.state.hostInList;
        for(let i = 0 ;i < ipList.length ; i ++ ){
            ipString += ipList[i].hostip + ','
        }
        var self = this;
        $.ajax({
            url: '/api/blackbox/create_group/',
            type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: {                         //表单数据
                name:self.hostNameSet,
                remark:self.hostRemarkSet,
                ips:ipString,
                type:1,
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            traditional: true,          //阻止JQuery深度序列化对象
            success: function(result){
                if(result.status==200){
                    self.setState({
                        errorMsg:'',
                    })
                    //关闭弹框
                    self.props.showEditHostModel()
                }else{
                    self.setState({
                        errorMsg:result.message
                    })
                }
            },
            error: function(){
                self.setState({
                    errorMsg:'服务器繁忙，请稍后重试'
                })
            }

        })
    }
    handleHostNameSet(e){
        this.hostNameSet = e.target.value
    }
    handleHostRemarkSet(e){
        this.hostRemarkSet = e.target.value
    }
    /*
     * 编辑主机
     *
     * */
    updateHostOperate(){
        let ipString = '';
        let ipList = this.state.hostInList;
        for(let i = 0 ;i < ipList.length ; i ++ ){
            ipString += ipList[i].hostip + ','
        }
        var self = this;
        $.ajax({
            url: '/api/blackbox/update_group/',
            type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: {                         //表单数据
                id:self.props.operateHostId, //组id
                name:self.hostNameSet || self.props.operateHostName,
                remark:self.hostRemarkSet || self.props.operateHostRemark,
                ips:ipString,
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            traditional: true,          //阻止JQuery深度序列化对象
            success: function(result){
                if(result.status==200){
                    self.setState({
                        errorMsg:''
                    })
                    //关闭弹框
                    self.props.showEditHostModel()
                }else{
                    self.setState({
                        errorMsg:result.message
                    })
                }
            },
            error: function(){
                self.setState({
                    errorMsg:'服务器繁忙，请稍后重试'
                })
            }

        })
        //    operateHostName:name,
        //     operateHostRemark:remark,
    }
    /*
     * 确认新增或者删除主机
     * name	组名称
     * remark	组备注
     * ips	组内主机ip
     * */
    confirmOperateHost(){
        if(this.props.operateHost=='add'){
            if(!this.hostNameSet && this.hostNameSet == ''){
                this.setState({
                    errorMsg: '请输入主机组名称'
                })
            }else if(!this.hostRemarkSet && this.hostRemarkSet == ''){
                this.setState({
                    errorMsg: '请输入主机组备注'
                })
            }else if(this.state.hostInList.length==0){
                this.setState({
                    errorMsg:'请选择主机'
                })
            }else{
                this.addHostOperate();
            }

        }else if(this.props.operateHost=='edit'){
            if(!this.hostNameSet && this.hostNameSet == '' && this.props.operateHostName == ''){
                this.setState({
                    errorMsg: '请输入主机组名称'
                })
            }else if(!this.hostRemarkSet && this.hostRemarkSet == '' && this.props.operateHostRemark == ''){
                this.setState({
                    errorMsg: '请输入主机组备注'
                })
            }else if(this.state.hostInList.length==0){
                this.setState({
                    errorMsg:'请选择主机'
                })
            }else{
                this.updateHostOperate();
            }

        }
    }

    /*搜索主机
     * hostList：主机列表（组外或者组内）---- this.state.hostOutList
     * searchItem：搜索关键字
     * location：组内或者组外主机
     * */
    filterSearchItem(hostList,searchItem,location){
        //初始化列表
        let filterList = [];
        //循环，生成ip/name列表
        for(let i = 0 ; i < hostList.length ; i++ ){
            //生成数组
            filterList.push(hostList[i].hostip+' '+hostList[i].hostname)
        }

        //匹配关键字，并刷新列表
        this.regexpFilter(filterList,searchItem,hostList,location)

    }
    /*匹配关键字，并刷新列表
     * filterList：ip/name列表
     * searchItem：搜索关键字
     * location：组内或者组外主机
     * hostList：主机列表（组外或者组内）---- this.state.hostOutList
     * 正则匹配成功后，列表发生变化，只修改----this.state.hostOutListSearch，原本的主机列表（this.state.hostOutList ）千万不能修改
     * */
    regexpFilter(filterList,searchItem,hostList,location){
        //初始化关键字过滤列表
        let filterHostList = [];
        //循环，判断搜索关键字是否匹配ip/name项
        for(let i = 0 ; i < filterList.length ; i++ ){
            //匹配成功，将列表的第Ｉ项添加到ip/name列表中
            if(filterList[i].indexOf(searchItem) > -1){
                filterHostList.push(hostList[i])
            }
        }

        //列表更新
        switch (location){
            case 'out' :
                this.setState({
                    hostOutListSearch : filterHostList
                });
                break;
            case 'in' :
                this.setState({
                    hostInListSearch : filterHostList
                });
                break;
        }

    }

    /*搜索主机*/
    handleSearchHost(location){

        switch (location){
            case 'out' :
                //清除另外一个input搜索框，防止主机移动的时候错乱
                $('.in-host-search-ipt').val('')
                //将另外一个列表更新为非模糊查询的总列表
                this.setState({
                    hostInListSearch : false
                })
                //判断当输入关键字，模糊查询，列表更新
                if($('.out-host-search-ipt').val()!==''){
                    this.filterSearchItem(this.state.hostOutList,$('.out-host-search-ipt').val(),location)
                }else{
                    this.setState({
                        hostOutListSearch : false,
                    })
                };
                break;
            case 'in' :
                //清除另外一个input搜索框，防止主机移动的时候错乱
                $('.out-host-search-ipt').val('')
                //将另外一个列表更新为非模糊查询的总列表
                this.setState({
                    hostOutListSearch : false
                })
                //判断当输入关键字，模糊查询，列表更新
                if($('.in-host-search-ipt').val()!==''){
                    this.filterSearchItem(this.state.hostInList,$('.in-host-search-ipt').val(),location)
                }else{
                    this.setState({
                        hostInListSearch : false
                    })
                };
                break;
        }


    }

    componentWillMount(){

    }
    componentDidMount(){
        if(this.props.operateHost=='add'){
            this.getOutHostList();
        }else if(this.props.operateHost=='edit'){
            this.getInHostList();
        }
    }
    render() {
        return (
            <div className="editHostBox">
                <div className="editHost">
                    <h1>编辑主机组信息<i className="fa fa-times" aria-hidden="true" onClick={this.props.showEditHostModel.bind(this)}></i></h1>
                    <h2 className="lines"></h2>
                    <h3>主机组名称</h3>
                    <input type="text" placeholder="请输入主机名称" onChange={(e)=>this.handleHostNameSet(e)} defaultValue = {this.props.operateHostName}/>
                    <h3>备注信息</h3>
                    <input type="text" placeholder="请输入主机备注信息" onChange={(e)=>this.handleHostRemarkSet(e)} defaultValue = {this.props.operateHostRemark}/>
                    <div className="selectHost clearfix">
                        <h2 className="lines"></h2>
                        <div className="left-host-out">
                            <h4>组外主机</h4>
                            <div>
                                <input type="text" className="host-search-ipt out-host-search-ipt" placeholder="搜索IP或者别名" onChange={this.handleSearchHost.bind(this,'out')}/>
                                <button className="host-search-btn" onClick={this.handleSearchHost.bind(this,'out')}>
                                    <i className="fa fa-search" ></i>
                                </button>
                            </div>
                            <div className="hostList-tab">
                                <div className="list-head">
                                    <table>
                                        <tbody>
                                        <tr>
                                            <td> <span className="host-checkbox" onClick={this.handelSelectHost.bind(this,'out')}> </span>IP</td>
                                            <td>主机别名</td>
                                            <td>备注</td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="list-body">
                                    <table>
                                        <tbody>
                                        {
                                            (this.state.hostOutListSearch || this.state.hostOutList).map((list,index)=>{
                                                return(

                                                    <tr key={index}>
                                                        <td> <span className="host-checkbox" onClick={this.handelSelectHost.bind(this,'outSingle')}> </span> {list.hostip}</td>
                                                        <td>{list.hostname}</td>
                                                        <td>{list.description}</td>
                                                    </tr>

                                                )
                                            })
                                        }
                                        </tbody>
                                    </table>
                                </div>

                            </div>
                        </div>
                        <div className="center-button">
                            <button className="host-getIn" onClick={this.handleMoveHost.bind(this,'in')}>
                                <i className="fa fa-arrow-right"></i>
                            </button>
                            <button className="host-getOut" onClick={this.handleMoveHost.bind(this,'out')}>
                                <i className="fa fa-arrow-left"></i>
                            </button>

                        </div>
                        <div className="right-host-in">
                            <h4>组内主机</h4>
                            <div>
                                <input type="text" className="host-search-ipt in-host-search-ipt" placeholder="搜索IP或者别名" onChange={this.handleSearchHost.bind(this,'in')}/>
                                <button className="host-search-btn" onClick={this.handleSearchHost.bind(this,'in')}>
                                    <i className="fa fa-search"></i>
                                </button>
                            </div>
                            <div className="hostList-tab">
                                <div className="list-head">
                                    <table>
                                        <tbody>
                                        <tr>
                                            <td> <span className="host-checkbox" onClick={this.handelSelectHost.bind(this,'in')}> </span>IP</td>
                                            <td>主机别名</td>
                                            <td>备注</td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="list-body">
                                    <table>
                                        <tbody>
                                        {
                                            (this.state.hostInListSearch || this.state.hostInList).map((list,index)=>{
                                                return(

                                                    <tr key={index}>
                                                        <td> <span className="host-checkbox" onClick={this.handelSelectHost.bind(this,'inSingle')}> </span> {list.hostip}</td>
                                                        <td>{list.hostname}</td>
                                                        <td>{list.description}</td>
                                                    </tr>

                                                )
                                            })
                                        }
                                        </tbody>
                                    </table>
                                </div>

                            </div>
                        </div>
                    </div>
                    <p className="errorMsg">{this.state.errorMsg}</p>
                    <div className="edit-confirm-btn">
                        <button className="edit-cancel" onClick={this.props.showEditHostModel.bind(this)}>取消</button>
                        <button className="edit-confirm" onClick={this.confirmOperateHost.bind(this)}>确认</button>
                    </div>
                </div>
            </div>
        )
    }
}