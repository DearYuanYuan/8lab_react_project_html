import React from "react";
import $ from 'jquery';
import RootFileVersionHistory from './RootFileVersionHistory.js'
import DeleteFile from './DeleteFile.js'
import RenameFile from './RenameFile.js'
import MoveFile from './MoveFile.js'
import NewFile from "./NewFile";
import UploadFile from "./UploadFile";
import LoadingText from "../Commonality/LoadingText";
export default class FileManage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            clientListShow:false, //显示可访问的主机
            clientNameFile:'您可访问的主机',
            clientList:[],//主机列表
            rootFileListShow:false, //显示可访问的某个主机下的根目录
            rootFileList:[],//某个主机下的根目录列表
            filePathListShow:false,//显示目录文件夹或者目录文件
            filePathList:[],//显示目录文件夹或者目录文件的详细信息
            versionHistoryBox:false,//查看根目录下历史版本
            versionHistoryMsg:{
                name:'',path:'',data:[]
            },//版本历史信息传入参数
            DeleteFileBox:false,//删除文件或者文件夹
            RenameFileBox:false,//重命名文件或文件夹
            MoveFileBox:false,//移动文件或文件夹
            NewFileBox:false,//新建文件夹
            UploadFileBox:false,//上传文件
            fileSelectStatus:false,//有无文件或文件夹被选中
            operationPath:'',//全局上传文件和新建文件夹的操作路径
            operationRootName:'',//全局进入的主机
            selectFileOptions:[],//页面删除、重命名、移动操作所选择的项
            deleteList:[], //删除的文件path列表
            uploadFileName:'请选择您要上传的文件',//上传的文件名和路径
            renameFileNewName:'',//重命名之后的文件名
            renameFileName:'',//重命名的文件名
            renameFilePath:'',//重命名操作文件的路径
            renameFileNewPath:'',//重命名操作文件之后要拼接的路径
            renameFileType:'',//重命名操作文件type是tree或者blob
            globalRootName:'',//设置进入的根目录（在新建、删除、移动、重命名之后，传入参数更新根目录下的文件）
            globalRootPath:'',//设置进入的根目录路径 （在新建、删除、移动、重命名之后，传入参数更新根目录下的文件）
            fileTree:[],//文件夹tree
            getDataOrNot:false,
            tamperLoadingBox:false,//ajax请求时，结果未返回时，显示loading效果
            uploadFileSizeOut:'', //上传文件大小限制
            fileActionError:'',//文件增删改操作错误提示信息
        }
    };
    /*
    * 获取主机列表
    * */
    getHostList(){
        var self = this;
        $.ajax({
            url: '/api/tamper_proof/get_user_host_detail/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data:{
                username:this.props.tamperUsrName,
                is_super:this.props.tamperIsSuper,
                token:this.props.tamperUsrToken,
                "service_type": "svn"
            },
            error:function () {
                self.setState({
                    clientList:[],
                    clientListShow:true, //主机列表显示
                    rootFileListShow:false, //根目录列表隐藏
                    filePathListShow:false, //非根目录隐藏
                })
            },
            success: function (data) {
                //console.log(JSON.stringify(data))
                if(data[0].status=='FAILURE'){
                    self.setState({
                        clientList:[],
                        clientListShow:true, //主机列表显示
                        rootFileListShow:false, //根目录列表隐藏
                        filePathListShow:false, //非根目录隐藏
                    })
                }else {
                    self.setState({
                        clientList:data[0].result,
                        clientListShow:true, //主机列表显示
                        rootFileListShow:false, //根目录列表隐藏
                        filePathListShow:false, //非根目录隐藏
                    })
                }

            }
        })
    }
    /*
    * 获取主机下的根目录列表
    * 传入用户名、主机名
    * */
    getHostRootList(hostName){
        var self = this;
        $.ajax({
            url: '/api/tamper_proof/get_user_rootpath_list/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data:{
                username: this.props.tamperUsrName,
                host_name: hostName,
                token:this.props.tamperUsrToken,
                "service_type": "svn"
            },
            error:function () {
                self.setState({
                    rootFileList:[],
                    operationRootName:hostName,//局上传文件和新建文件夹的主机名
                    clientListShow:false, //主机列表隐藏
                    rootFileListShow:true, //根目录列表显示
                    filePathListShow:false, //非根目录隐藏
                })
            },
            success: function (data) {
                //console.log(JSON.stringify(data))
                if(data[0].status=='FAILURE'){
                    self.setState({
                        rootFileList:[],
                        operationRootName:hostName,//局上传文件和新建文件夹的主机名
                        clientListShow:false, //主机列表隐藏
                        rootFileListShow:true, //根目录列表显示
                        filePathListShow:false, //非根目录隐藏
                    })
                }else{
                    self.setState({
                        rootFileList:data[0].result,
                        operationRootName:hostName,//局上传文件和新建文件夹的主机名
                        clientListShow:false, //主机列表隐藏
                        rootFileListShow:true, //根目录列表显示
                        filePathListShow:false, //非根目录隐藏
                    })
                }


            }
        })
    }
    /*
    * 获取的根根目录树形结构，要做写处理才能被前端使用
    * data：获取的目录数据
    * dataArrayList：最后生成的前端可以使用的数据，默认传入的是[]
    * */
    reduxData(data,dataArrayList){
        //把文件夹名取出来，放入_items
        let _items=[];
        let _item;
        for(_item in data){
            _items.push(_item)
        }
        //把文件名下的数据取出来，放入_dataArr
        let _dataArr=[];
        for(let i =0;i<_items.length;i++){
            let _param = _items[i]
            _dataArr.push(data[_param])
        }
        //将文件名和文件下面的数据组成一个新的对象，放入_dataArrayList构成新的数组
        for(let i=0;i<_dataArr.length;i++){
            let _dataArrList = _dataArr[i];
            _dataArrList.name=_items[i]
            dataArrayList.push(_dataArrList)
        }
        return dataArrayList //返回处理好的数据
        // console.log( JSON.stringify(_dataArrayList))
    }
    /*
    * 获取根目录的树形结构 todo：后台数据暂时是写死的
    * 传入主机名 'host_name': 'octa-tamper-proof',
      传入路径  'root_path': '/home/finger/8lab.test'
    * */
    getOtherFileList(name,path,cname){
        // var name = name; //主机名
        // var path = path; //路径
        // var cname = cname //文件夹名
        var self = this;
        // console.log(this.state.globalRootPath)
        $.ajax({
            url: '/api/tamper_proof/get_root_path_tree/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data:{
                host_name: name,
                root_path: path,
                token:this.props.tamperUsrToken,
                "service_type": "svn"
            },
            success: function (data) {
                var _data;
                if(data[0].result[path]==undefined){
                    _data={} //无数据时，设置为空
                }else{
                    _data = data[0].result[path].nodes //获取需要处理的树形结构
                }
                // var _data = {
                //     "test": {
                //         "type": "tree",
                //         "path": "/home/finger/8lab.test2/octa_bdb_api/test",
                //         "time": "2017-08-29 19:49:18",
                //         "nodes": {}
                //     },
                //     "test111": {
                //         "type": "tree",
                //         "path": "/home/finger/8lab.test2/octa_bdb_api/test111",
                //         "time": "2017-08-29 19:58:15",
                //         "nodes": {}
                //     }
                // }
                // console.log(JSON.stringify(data[0].result[cname]))
                //todo 处理根目录树形结构  暂时先这样
                let _dataArrayList =[]; //为最后生成的可以使用的数组格式的数据
                self.reduxData(_data,_dataArrayList) //处理数据
                //更改state，循环写入html
                self.setState({
                    filePathList:_dataArrayList,
                    operationPath:path,//设置操作全局新建上传文件的路径
                    clientListShow:false, //主机列表隐藏
                    rootFileListShow:false, //根目录列表隐藏
                    filePathListShow:true, //非根目录显示
                    globalRootName:cname,//设置进入的根目录（在新建、删除、移动、重命名之后，传入参数更新根目录下的文件）
                    globalRootPath:path,//设置进入的根目录路径（在新建、删除、移动、重命名之后，传入参数更新根目录下的文件）
                });

            }
        })
    }
    /*
     * 点击某个主机
     * 显示某个主机下根目录文件
     * name:文件夹名
     * */
    handleShowFile(name){
        this.setState({
            clientNameFile:'主机列表',
            clientListShow:false, //主机列表显示
            rootFileListShow:false, //根目录列表隐藏
            filePathListShow:false, //非根目录隐藏
        })
        this.getHostRootList(name);
        //在新增一个路径之前，把前面路径的蓝色背景样式去掉
        $('.file-manage-title a').css({
            background:'#444851'
        })
        //新增一个路径节点
        var domA = document.createElement("a");
        var txt = document.createTextNode(name);
        domA.appendChild(txt);
        domA.setAttribute("title",'根目录');
        $('.file-manage-title').append("<b> › </b>").append(domA)
    }
    /*
    * 点击某个根目录 todo：后台数据暂时写死，只有最后一个/home/finger/8lab.test是可以点击的
    * 显示根目录下的目录或者文件
    * name:主机名
    * cname:文件夹名
    * path；路径
    * */
    handleShowRootFilePath(name,path,cname){
        this.setState({
            clientListShow:false, //主机列表显示
            rootFileListShow:false, //根目录列表隐藏
            filePathListShow:false, //非根目录隐藏
        })
        // console.log(name)
        this.getOtherFileList(name,path,cname)
        //在新增一个路径之前，把前面路径的蓝色背景样式去掉
        $('.file-manage-title a').css({
            background:'#444851'
        })
        //新增一个路径节点
        var domA = document.createElement("a");
        var txt = document.createTextNode(cname);
        domA.appendChild(txt);
        domA.setAttribute("title", 'treeAll');
        domA.dataset.path = path;
        domA.setAttribute("name", cname);
        $('.file-manage-title').append("<b> › </b>").append(domA)
    }
    /*
    * ajax获取根目录下的历史版本
    * */
    ajaxGetVersionHistory(name,path){
        // console.log(name+';'+path)
        var self = this;
        $.ajax({
            url: '/api/tamper_proof/get_version_info/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data:{
                'host_name': name,
                'root_path': path,
                token:this.props.tamperUsrToken,
                "service_type": "svn"
            },
            success: function (data) {
                // console.log(data[0].result)
                self.setState({
                    versionHistoryBox:true,
                    versionHistoryMsg:{
                        name:name,
                        path:path,
                        data:data[0].result, //获取第一页列表
                    },
                })
            }
        })
    }
    /*
    * 看根目录下的历史版本
    * */
    handleShowHistory(name,path,e){
        e.stopPropagation()//阻止继承父元素点击事件
        this.ajaxGetVersionHistory(name,path) //ajax获取根目录历史版本
    }
    /*
    * 回滚版本
    * token:token
     username:trust
     host_name:octa-tamper-proof
     root_path:/home/finger/8lab.test
     org_version_tx_id:65d046b3189cbb923d263922ff0c45d6d95c49e834b6448268ea9c3a0669ad9b
    * */
    backThisVersion(token,username,hostname,rootpath,tx_id){
        // console.log(token,username,hostname,rootpath,tx_id)
        var self = this;
        self.setState({
            tamperLoadingBox:true,
        })
        $.ajax({
            url: '/api/tamper_proof/rollback_version/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data:{
                token:this.props.tamperUsrToken,
                username:this.props.tamperUsrName,
                host_name:hostname,
                root_path:rootpath,
                org_version_tx_id:tx_id,
                "service_type": "svn"
            },
            success: function (data) {
                // console.log(JSON.stringify(data))
                self.setState({
                    versionHistoryBox:false, //隐藏弹框
                    tamperLoadingBox:false,
                })
            },
            error:function(){
                self.setState({
                    tamperLoadingBox:false,
                })
            }
        })
    }
    /*
    * 关闭根目录下查看历史版本
    * */
    handleCloseVersionHistory(){
        this.setState({
            versionHistoryBox:false
        })
    }
    /*
     *显示非根目录文件
     * name:文件夹名
     * data：文件夹下的树形结构数据
     * path：文件夹路径
     * */
    handleShowOtherFilePath(data,name,path){
        //只要所选的文件夹发生变化，就清除选择框样式，并重置生成this.state.selectFileOptions
        // console.log(path)
        $('td.selectFileBtn a').removeClass('onSelect')
        this.getUsrOperationList()
        // console.log(JSON.stringify(data))
        let _dataArrayList =[]; //为最后生成的可以使用的数组格式的数据
        this.reduxData(data,_dataArrayList) //处理数据
        //更改state，循环写入html
        this.setState({
            filePathList:_dataArrayList,
            operationPath:path,//设置全局新建文件和上传文件的路径
        });
        //在新增一个路径之前，把前面路径的蓝色背景样式去掉
        $('.file-manage-title a').css({
            background:'#444851'
        })
        //新增一个路径节点
        var domA = document.createElement("a");
        var txt = document.createTextNode(name);
        domA.appendChild(txt);
        domA.setAttribute("title", JSON.stringify(_dataArrayList));
        $('.file-manage-title').append("<b> › </b>").append(domA)
    }
    /*
    * 根目录文件夹下的选择框
    * 传入参数：
    * */
    handleSelectFile(e){
        e.stopPropagation();
        $(e.target).toggleClass('onSelect')
        this.getUsrOperationList() //每点击一次选择框，都要更新所选择的option,并生成新的this.state.selectFileOptions
    }
    /*
    * 根目录文件夹下的选择框---全选操作
    * */
    handleSelectAllOption(e){
        if($(e.target).is('.onSelect')){
            $(e.target).removeClass('onSelect')
            $('td.selectFileBtn a').removeClass('onSelect')
        }else{
            $(e.target).addClass('onSelect')
            $('td.selectFileBtn a').addClass('onSelect')
        }
        //每点击一次选择框，都要做处理，生成新的this.state.selectFileOptions
        this.getUsrOperationList()
    }
    /*
    * 每点击一次选择框，都要做下列处理,生成新的this.state.selectFileOptions
    * */
    getUsrOperationList(){
        let len = this.state.filePathList.length
        let ele = $('td.selectFileBtn a');
        let fileName = [];
        for(var i = 0;i<len;i++){
            //只要有一个处于选择状态，就把选中的加到数组中
            if($(ele[i]).is('.onSelect')){
                this.setState({
                    fileSelectStatus:true,
                })
                let obj = {
                    path:$(ele[i]).attr('title'),
                    type:$(ele[i]).html(),
                }
                fileName.push(obj)
            }else{
                //只要有一个没有选项没有被选中，就把全选按钮取消
                $('th.selectFileBtn a').removeClass('onSelect')
            }
        }
        //当选择的option为空
        if(fileName.length==0){
            this.setState({
                fileSelectStatus:false
            })
        }
        //将选择的选项存入state，在其他删除等操作时把state传到后台
        this.setState({
            selectFileOptions:fileName,
            deleteList:fileName
        })
        // console.log(fileName);
    }
    /*
    * todo 删除文件
    * */
    handleDeleteFile(){
        this.setState({
            DeleteFileBox:true,
            fileActionError:'',
        })
    }
    /*
    * 取消删除
    * */
    handleCancelDelete(){
        this.setState({
            DeleteFileBox:false
        })
    }
    /*
    * 确认删除
    * */
    handleConformDelete(){
        this.delOptionConform(); //删除，向后台传值
        //打印看下选中的options
        //console.log(this.state.selectFileOptions);
    }
    /*
    * 删除ajax，确认删除，发起请求
    * */
    delOptionConform(){
        let uploadData = {
            token:'token',
            username:this.props.tamperUsrName,
            host_name:this.state.operationRootName,
            root_path:this.state.globalRootPath,
            operations:{
                operation:'del',
                object_list:this.state.selectFileOptions
            },
            remark:'del'
        }
        var self = this;
        self.setState({
            tamperLoadingBox:true,
        })
        $.ajax({
            url: '/api/tamper_proof/operations/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data:{
                "service_type": "svn",
                token:this.props.tamperUsrToken,
                data:JSON.stringify(uploadData)
            },
            success: function (data) {
                // console.log(JSON.stringify(data))
                self.setState({
                    DeleteFileBox:false,
                    tamperLoadingBox:false,
                })
                //删除成功，则所选的文件夹发生变化，就清除选择框样式，并重置生成的数组
                $('td.selectFileBtn a').removeClass('onSelect')
                $('th.selectFileBtn a').removeClass('onSelect')
                //生成this.state.selectFileOptions
                self.getUsrOperationList();

                //重新回到当前根目录下，并删除当前选中节点之后的所有兄弟节点
                $('.file-manage-title a').eq(2).css({
                    background:'#007AE1'
                }).nextAll().remove()
                //当操作成功时，重新发起请求，更新列表
                self.getOtherFileList(self.state.operationRootName,self.state.globalRootPath,self.state.globalRootName)

            },
            error:function(){
                //todo 删除失败
                self.setState({
                    DeleteFileBox:false,
                    tamperLoadingBox:false,
                    fileActionError:'删除失败',
                })
            }
        })
    }
    /*
    × todo 移动文件或文件夹
    * */
    handleMoveFile(){
        this.setState({
            fileActionError:'',
        })
        // console.log(this.state.globalRootPath)
        /*获取主机根目录下的树形结构*/
        let self = this;
        $.ajax({
            url: '/api/tamper_proof/get_current_version_folder_tree/' ,
            type: 'POST',
            data:{
                'host_name': this.state.operationRootName,
                'root_path': this.state.globalRootPath,
                token:this.props.tamperUsrToken,
                "service_type": "svn"
            },
            cache: false,
            success: function (data) {
                // console.log(JSON.parse(data)[0].result)
                var treeMsg = JSON.parse(data)[0].result;
                treeMsg.map((list)=>{
                    list.isParent = true
                })
                self.setState({
                    fileTree:treeMsg,
                    MoveFileBox:true,
                })

            },
            error: function (data) {
                // alert(data);
                console.log(data);
            }
        });
    }
    /*
    * 取消移动文件或文件夹
    * */
    handleCancelMove(){
        this.setState({
            MoveFileBox:false
        })
    }
    /*
    * 确认移动文件或文件夹
    * */
    handleConformMove(path){

        var selectOption = this.state.selectFileOptions //获取所选择的列表
        // console.log(JSON.stringify(selectOption))
        if(selectOption[0].path == path){
            //当移动的路径与原路径相同时
            this.setState({
                fileActionError:'移动路径与原路径相同！'
            })
            return;
        }else{
            selectOption.map((option,index)=>{
                var getNameArr = option.path.split('/')
                var getName = getNameArr[getNameArr.length-1]

                option.spath = option.path;
                option.dpath = path+'/'+getName;

                delete option.path
            })
            let movData = {
                token:'token',
                username:this.props.tamperUsrName,
                host_name:this.state.operationRootName,
                root_path:this.state.globalRootPath,
                operations:{
                    operation:'mov',
                    object_list:selectOption
                },
                remark:'mov'
            }
            var self = this;
            self.setState({
                tamperLoadingBox:true,
            })
            $.ajax({
                url: '/api/tamper_proof/operations/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                data:{
                    "service_type": "svn",
                    token:this.props.tamperUsrToken,
                    data:JSON.stringify(movData)
                },
                success: function (data) {
                    // console.log(JSON.stringify(data))
                    self.setState({
                        MoveFileBox:false,
                        tamperLoadingBox:false,
                    })
                    //删除成功，则所选的文件夹发生变化，就清除选择框样式，并重置生成的数组
                    $('td.selectFileBtn a').removeClass('onSelect')
                    $('th.selectFileBtn a').removeClass('onSelect')
                    //生成this.state.selectFileOptions
                    self.getUsrOperationList();

                    //重新回到当前根目录下，并删除当前选中节点之后的所有兄弟节点
                    $('.file-manage-title a').eq(2).css({
                        background:'#007AE1'
                    }).nextAll().remove()
                    //当操作成功时，重新发起请求，更新列表
                    self.getOtherFileList(self.state.operationRootName,self.state.globalRootPath,self.state.globalRootName)

                },
                error:function(){
                    // todo 删除失败
                    self.setState({
                        tamperLoadingBox:false,
                        fileActionError:'移动失败'
                    })
                }
            })
        }


    }
    /*
     × todo 重命名文件或文件夹
     * */
    handleRenameFile(type,name,path,e){
        e.stopPropagation()
        //将文件夹或者文件名值为空
        var newPath = path.split('/')
        newPath.pop()

        this.setState({
            RenameFileBox:true,
            renameFilePath:path,
            renameFileNewPath:newPath.join('/'),
            renameFileNewName:name,
            renameFileName:name,
            renameFileType:type,
            fileActionError:''
        })
    }
    /*
    * 重命名输入：
    * */
    handleNewFileName(e){
        this.setState({
            renameFileNewName:$(e.target).val()
        })
        // console.log($(e.target).val())
    }
    /*
    * 取消重命名
    * */
    handleCancelRename(){
        this.setState({
            RenameFileBox:false
        })
    }
    /*
    * 确认重命名 render刷新页面
    * */
    handleConformRename(){
        // console.log(this.state.renameFileNewPath + this.state.renameFileNewName)
        let re = /^[0-9A-Za-z_.]{1,20}$/;
        if($('.newFileName').val()=='' || !re.test(this.state.renameFileNewName)){
            this.setState({
                fileActionError:'请检查文件名'
            })
            return;
        }else{
            let Data = {
                token:'token',
                username:this.props.tamperUsrName,
                host_name:this.state.operationRootName,
                root_path:this.state.globalRootPath,
                operations:{
                    operation:'mov',
                    object_list:[
                        {
                            spath:this.state.renameFilePath,//重命名之前的路径
                            dpath:this.state.renameFileNewPath +'/'+ this.state.renameFileNewName,//生成文件夹路径
                            type:this.state.renameFileType,//tree
                        }
                    ]
                },
                remark:'new'
            }
            var self = this;
            self.setState({
                tamperLoadingBox:true,
            })
            $.ajax({
                url: '/api/tamper_proof/operations/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                data:{
                    "service_type": "svn",
                    token:this.props.tamperUsrToken,
                    data:JSON.stringify(Data)
                },
                success: function (data) {
                    //console.log(JSON.stringify(data))
                    self.setState({
                        RenameFileBox:false,
                        tamperLoadingBox:false,
                    })
                    //重新回到当前根目录下，并删除当前选中节点之后的所有兄弟节点
                    $('.file-manage-title a').eq(2).css({
                        background:'#007AE1'
                    }).nextAll().remove()
                    //当操作成功时，重新发起请求，更新列表
                    self.getOtherFileList(self.state.operationRootName,self.state.globalRootPath,self.state.globalRootName)

                },
                error:function () {
                    //todo 重命名失败
                    self.setState({
                        tamperLoadingBox:false,
                        fileActionError:'重命名失败'
                    })
                }
            })
        }

    }
    /*
    * 新建文件夹ajax请求
     * 传入参数（与删除、上传、移动、重命名相同）
     * token：'token'
     * username：'trust'
     * host_name：this.state.globalRootName:主机名
     * root_path: this.state.globalRootPath：操作路径
     * operations{
     *   operation:''  操作类型
     *   object_list:[
     *       {
     *           path:'' //路径
     *           type:'' //tree
     *           content:'' //内容
     *       }
     *   ]
     * }
    * */
    ajaxNewFile(name){

        let uploadData = {
            token:'token',
            username:this.props.tamperUsrName,
            host_name:this.state.operationRootName,
            root_path:this.state.globalRootPath,
            operations:{
                operation:'new',
                object_list:[
                    {
                       path:this.state.operationPath + '/' + name,//生成文件夹路径
                       type:'tree',//tree
                       content:'',//内容
                    }
                ]
            },
            remark:'new'
        }

        var self = this;
        self.setState({
            tamperLoadingBox:true,
        })
        $.ajax({
            url: '/api/tamper_proof/operations/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            data:{
                "service_type": "svn",
                token:this.props.tamperUsrToken,
                data:JSON.stringify(uploadData)
            },
            success: function (data) {
                // console.log(JSON.stringify(data))
                self.setState({
                    NewFileBox:false,
                    tamperLoadingBox:false,
                })

                //当操作成功时，重新发起请求，更新列表
                self.getOtherFileList(self.state.operationRootName,self.state.globalRootPath,self.state.globalRootName)
                //重新回到当前根目录下，并删除当前选中节点之后的所有兄弟节点
                $('.file-manage-title a').eq(2).css({
                    background:'#007AE1'
                }).nextAll().remove()

            },
            error:function () {
                // todo 新建文件夹失败
                self.setState({
                    tamperLoadingBox:false,
                    fileActionError:'新建失败'
                })
            }
        })
        // console.log(JSON.stringify(uploadData))
    }
    /*
    * todo 新建文件夹
    * */
    handleNewFile(){
        this.setState({
            NewFileBox:true,
            fileActionError:''
        })
    }
    /*
    * 取消新建文件夹
    * */
    handleCancelNew(){
        this.setState({
            NewFileBox:false,
        })
    }
    /*
    * 确认新建文件夹 新建文件夹之后要重新render当前文件夹
    * */
    handleConformNew(){
        let newName = $('.newFileName').val();
        let re = /^[0-9A-Za-z_]{1,20}$/;
        if(!re.test(newName)){
            this.setState({
                fileActionError:'请检查文件名'
            })
            return;
        }else{
            this.ajaxNewFile(newName) //发起新建请求
        }
    }
    /*
    * todo 上传文件
    */
    handleUploadFile(){
        var uploadFileName = $( "#uploadForm input" ).val() //获取上传的文件名和路径
        // console.log(uploadFileName)
        if(uploadFileName==''){
            this.setState({
                uploadFileSizeOut:'请选择要上传的文件'
            })
        }else{
            this.setState({
                uploadFileSizeOut:''
            })
        }
        this.setState({
            UploadFileBox:true,
            fileActionError:'',
            uploadFileName:uploadFileName==''?this.state.uploadFileName:uploadFileName //判断是否选择文件
        })
    }
    /*
    * 取消上传文件
    */
    handleCancelUpload(){
        this.setState({
            UploadFileBox:false,
            uploadFileSizeOut:'',
        })
    }
    /*
    * 确认上传文件 页面需要刷新
    *
    */
    handleConformUpload(){

        this.setState({
            tamperLoadingBox:true,
            uploadFileSizeOut:''
        })
        if($( "#uploadForm input" ).val()==''){
            this.setState({
                tamperLoadingBox:false,
                uploadFileSizeOut:'请选择要上传的文件'
            })
        }else if($("#uploadForm input")[0].files[0].size/1000>1024){
            this.setState({
                tamperLoadingBox:false,
                uploadFileSizeOut:'文件超过1M，请重新选择文件'
            })
            //清空所选的文件
            var file = $("#uploadForm input")
            file.after(file.clone().val(''))
            file.remove()
            return;
        }else{
            var val = $( "#uploadForm input" ).val().split('\\')//获取上传的文件路径
            var name = val[val.length-1] //获取上传文件名
            var formData = new FormData();
            var self = this;
            formData.append('service_type','svn'),
            formData.append('token',this.props.tamperUsrToken)
            formData.append('username',this.props.tamperUsrName)
            formData.append('host_name',this.state.operationRootName)
            formData.append('root_path',this.state.globalRootPath)
            formData.append('operation','new')
            formData.append('path',this.state.operationPath + '/' + name)
            formData.append('type','blob')
            formData.append('content',$("#uploadForm input")[0].files[0]) //上传的文件
            formData.append('remark','new')
            formData.append('isUpload',true)
            $.ajax({
                url: '/api/tamper_proof/operations/' ,
                type: 'POST',
                data:formData,
                cache: false,
                contentType: false,
                processData: false,
                success: function (returndata) {
                    self.setState({
                        UploadFileBox:false,
                        tamperLoadingBox:false,
                        uploadFileSizeOut:''
                    })
                    //重新回到当前根目录下，并删除当前选中节点之后的所有兄弟节点
                    $('.file-manage-title a').eq(2).css({
                        background:'#007AE1'
                    }).nextAll().remove()
                    //当操作成功时，重新发起请求，更新列表
                    self.getOtherFileList(self.state.operationRootName,self.state.globalRootPath,self.state.globalRootName)

                    //清空所选的文件
                    var file = $("#uploadForm input")
                    file.after(file.clone().val(''))
                    file.remove()

                },
                error: function (returndata) {
                    // todo 上传文件失败
                    self.setState({
                        tamperLoadingBox:false,
                        uploadFileSizeOut:'上传失败'
                    })
                }
            });

        }


    }

    /*
    * todo 停用/启用根目录
    * data:{
     'host_name': this.state.operationRootName,
     'root_path': rootPath,
     token:this.props.tamperUsrToken,
     username:this.props.tamperUsrName,
     },
    * */
    handleAccountLimit(status,index,rootPath,e){
        $('.limitAccount').eq(index).animate({
            opacity:0.5
        })
        $('.limitAccount').eq(index).attr('disabled','disabled')
        e.stopPropagation()
        var self = this
        if(status=='protected'){
            $.ajax({
                url: '/api/tamper_proof/stop_user_root_path/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                data:{
                    "service_type": "svn",
                    'host_name': this.state.operationRootName,
                    'root_path': rootPath,
                    token:this.props.tamperUsrToken,
                    username:this.props.tamperUsrName,
                },
                success: function (data) {
                    // console.log(JSON.stringify(data))
                    // console.log(self.state.operationRootName)
                    $('.limitAccount').eq(index).removeAttr("disabled");
                    $('.limitAccount').eq(index).animate({
                        opacity:1
                    })
                    self.getHostRootList(self.state.operationRootName);//请求根目录
                },
                error: function () {

                }
            })
        }else{
            $.ajax({
                url: '/api/tamper_proof/start_root_path_protect/',
                type: 'POST',
                dataType: 'json',
                cache: false,
                data:{
                    "service_type": "svn",
                    'host_name': this.state.operationRootName,
                    'root_path': rootPath,
                    token:this.props.tamperUsrToken,
                    username:this.props.tamperUsrName,
                },
                success: function (data) {
                    // console.log(JSON.stringify(data))
                    $('.limitAccount').eq(index).removeAttr("disabled");
                    $('.limitAccount').eq(index).animate({
                        opacity:1
                    })
                    self.getHostRootList(self.state.operationRootName);//请求根目录
                },
                error: function () {

                }
            })
        }
    }
    componentWillMount() {
        this.getHostList(); //页面加载获取主机列表
    }
    componentDidMount(){
        /*
        * 给每一个路径添加点击事件
        * 点击后，改变当前文件路径的样式
        * 并发起请求，回到点击所在的路径
        * */
        $('.file-manage-title').on('click','a',(e)=>{
            //只要所选的文件夹发生变化，就清除选择框样式，并重置this.state.selectFileOptions
            $('td.selectFileBtn a').removeClass('onSelect')
            this.getUsrOperationList()
            $(e.target).css({
                background:'#007AE1'
            })
            $(e.target).siblings('a').css({
                background:'#444851'
            })

            //得到点击tab的title，根据title的不同，请求对应的文件目录

            let getVal = $(e.target).attr('title')
            if(getVal=='主机列表'){
                //处理显示loading效果
                this.setState({
                    clientListShow:false, //主机列表显示
                    rootFileListShow:false, //根目录列表隐藏
                    filePathListShow:false, //非根目录隐藏
                })
                this.getHostList(); //页面加载获取主机列表
            }else if(getVal=='根目录'){
                //处理显示loading效果
                this.setState({
                    clientListShow:false, //主机列表显示
                    rootFileListShow:false, //根目录列表隐藏
                    filePathListShow:false, //非根目录隐藏
                })
                let name = $(e.target).html();
                this.getHostRootList(name);//请求根目录
            }else if(getVal=='treeAll'){
                //处理显示loading效果
                this.setState({
                    clientListShow:false, //主机列表显示
                    rootFileListShow:false, //根目录列表隐藏
                    filePathListShow:false, //非根目录隐藏
                })
                let name = $(e.target).attr('name')
                let path = $(e.target).attr('data-path')
                this.getOtherFileList(this.state.operationRootName,path,name) //页面加载根目录
            }else{
                let backPath = this.state.operationPath.split('/')
                backPath = backPath[backPath.length-1]
                // console.log(backName)
                // console.log(this.state.operationPath.replace('/'+backPath,''))
                //此情况为某个主机根目录下文件列表点击时触发函数
                let data = $(e.target).attr('title');
                //更改state，循环写入html7
                this.setState({
                    filePathList:JSON.parse(data),//序列化string成为array
                    clientListShow:false, //主机列表隐藏
                    operationPath:this.state.operationPath.replace('/'+backPath,''), //更新新建重命名操作的路径
                    rootFileListShow:false //根目录列表隐藏
                });
            }
            //删除当前选中节点之后的所有兄弟节点
            $(e.target).nextAll().remove()
        })
    }
    render() {
        return (
            this.props.tabKey == 2 &&
            <div>
                {/* <div className="tamper-list-li">  文件管理 </div> */}
                {
                    /*只有进入根目录下的文件夹时，才出现新建、上传、删除、移动等文件操作*/
                    // this.state.filePathListShow&&
                    // <div>
                    //     {
                    //         /*无文件夹或文件被选中*/
                    //         !this.state.fileSelectStatus&&
                    //         <h3 className="fileChangeOption">
                    //             <button className="plugAction showHistoryVersion" onClick={this.handleNewFile.bind(this)}>新建文件夹</button>
                    //             <form id= "uploadForm" encType="multipart/form-data">
                    //                 <input className="plugAction showHistoryVersion" type="file"/>
                    //                 <button type="button" className="plugAction showHistoryVersion" onClick={this.handleUploadFile.bind(this)}>上传</button>
                    //             </form>
                    //         </h3>
                    //     }
                    //     {
                    //         /*有文件或文件夹被选中*/
                    //         this.state.fileSelectStatus&&
                    //         <h3 className="fileChangeOption">
                    //             <button className="plugAction showHistoryVersion" onClick={this.handleMoveFile.bind(this)}>移动</button>
                    //             <button className="plugAction showHistoryVersion" onClick={this.handleDeleteFile.bind(this)}>删除</button>
                    //         </h3>
                    //     }
                    // </div>
                }
                <div className="version-msg-list">
                    <h4 className="file-manage-title"><a title="主机列表">{this.state.clientNameFile}</a></h4>
                    <div className="datalistTitle">
                        {
                            !this.state.clientListShow && !this.state.rootFileListShow && !this.state.filePathListShow&&
                            // !this.state.clientListShow &&
                            <LoadingText/>
                        }
                        <table className="databaseHostList fileMange-tab">
                            <thead>
                                {this.state.clientListShow&&
                                    <tr>
                                        <th>主机标签</th>
                                        <th>IP</th>
                                        <th>备注</th>
                                    </tr>
                                }
                                {this.state.rootFileListShow&&
                                    <tr>
                                        <th>根目录标签</th>
                                        <th>启用/停用根目录</th>
                                        <th>根目录路径</th>
                                        <th>最后修改时间</th>
                                        <th>ip</th>
                                        <th>备注</th>
                                        <th>查看历史版本</th>
                                    </tr>
                                }
                                {this.state.filePathListShow&&
                                    <tr>
                                        {/* <th className="selectFileBtn"><a onClick={this.handleSelectAllOption.bind(this)}></a></th> */}
                                        <th>文件名称</th>
                                        <th>最后修改时间</th>
                                        <th>大小</th>
                                        <th>类型</th>
                                        {/* <th>重命名</th> */}
                                    </tr>
                                }
                            </thead>
                            <tbody>
                            {
                                this.state.clientListShow&&this.state.clientList.map(function(data,index){
                                    return(
                                        <tr key={index}  onClick={this.handleShowFile.bind(this,data.protect_host_name)}>
                                            <td className="singleTab"><i className="iconfont icon-db_icon file-icon"></i>{data.protect_host_name}</td>
                                            <td>{data.protect_host_addr}</td>
                                            <td>{data.remark}</td>
                                        </tr>
                                    )
                                }.bind(this))
                            }
                            {
                                this.state.rootFileListShow&&this.state.rootFileList.map(function(data,index){
                                    return(
                                        <tr key={index}  onClick={this.handleShowRootFilePath.bind(this,data.protect_host_name,data.protect_root_path,data.protect_path_mark)}>
                                            <td className="singleTab"><i className="iconfont icon-db_icon file-icon"></i>{data.protect_path_mark}</td>
                                            <td>
                                                <button className={data.status=='protected'?'limitAccount':'limitAccount accountForbidden'}
                                                        onClick={this.handleAccountLimit.bind(this,data.status,index,data.protect_root_path)}>{data.status=='protected'?'停用':'启用'}</button></td>
                                            <td>{data.protect_root_path}</td>
                                            <td>{data.timestamp}</td>
                                            <td>{data.protect_host_addr}</td>
                                            <td>{data.remark}</td>
                                            <td>
                                                <button className="plugAction showHistoryVersion"
                                                        onClick={this.handleShowHistory.bind(this,data.protect_host_name,data.protect_root_path)}>
                                                查看历史版本</button></td>
                                        </tr>
                                    )
                                }.bind(this))
                            }

                            {
                                this.state.filePathListShow&&this.state.filePathList.map(function (data, index) {
                                    {/*
                                    *
                                    * 点击事件---需要判断是不是文件夹（data.type=tree）
                                    * 需要传入子节点data.nodes
                                    * 文件夹名data.name*/}
                                    return(
                                        <tr key={index} onClick={data.nodes?this.handleShowOtherFilePath.bind(this,data.nodes,data.name,data.path):false}>
                                            {/* <td className="singleTab selectFileBtn">
                                                <a onClick={this.handleSelectFile.bind(this)} title={data.path}>{data.type}</a></td> */}
                                            <td style={{background: "none"}}> 
                                                <i className="iconfont icon-db_icon file-icon" style={{display:data.type=='tree'?'inline':'none'}}></i>
                                                {data.name}</td>
                                            <td>{data.time}</td>
                                            <td>{data.size}</td>
                                            <td>{data.type}</td>
                                            {/* <td><button className="plugAction showHistoryVersion" onClick={this.handleRenameFile.bind(this,data.type,data.name,data.path)}>重命名</button></td> */}
                                        </tr>
                                    )
                                }.bind(this))
                            }
                            </tbody>
                        </table>
                    </div>
                </div>
                {
                    /*版本历史*/
                    this.state.versionHistoryBox&&
                    <RootFileVersionHistory
                        tamperLoadingBox = {this.state.tamperLoadingBox}
                        versionHistoryMsg = {this.state.versionHistoryMsg}
                        handleCloseVersionHistory = {this.handleCloseVersionHistory.bind(this)}
                        versionHistoryBox={this.state.versionHistoryBox}
                        backThisVersion = {this.backThisVersion.bind(this)}
                    />
                }
                {
                    /*删除文件或文件夹*/
                    this.state.DeleteFileBox&&
                    <DeleteFile
                        fileActionError = {this.state.fileActionError}
                        tamperLoadingBox = {this.state.tamperLoadingBox}
                        deleteList = {this.state.deleteList}
                        handleCancelDelete={this.handleCancelDelete.bind(this)}
                        handleConformDelete={this.handleConformDelete.bind(this)}
                    />
                }
                {
                    /*重命名文件或文件夹*/
                    this.state.RenameFileBox&&
                    <RenameFile
                        fileActionError = {this.state.fileActionError}
                        tamperLoadingBox = {this.state.tamperLoadingBox}
                        renameFileNewName = {this.state.renameFileNewName}
                        renameFilePath = {this.state.renameFilePath}
                        handleNewFileName = {this.handleNewFileName.bind(this)}
                        handleCancelRename = {this.handleCancelRename.bind(this)}
                        handleConformRename = {this.handleConformRename.bind(this)}
                    />
                }
                {
                    /*移动文件或文件夹
                    * */
                    this.state.MoveFileBox&&
                    <MoveFile
                        fileActionError = {this.state.fileActionError}
                        tamperLoadingBox = {this.state.tamperLoadingBox}
                        fileTree = {this.state.fileTree}
                        handleCancelMove = {this.handleCancelMove.bind(this)}
                        handleConformMove = {this.handleConformMove.bind(this)}
                    />
                }
                {
                    /*新建文件夹*/
                    this.state.NewFileBox&&
                    <NewFile
                        fileActionError = {this.state.fileActionError}
                        tamperLoadingBox = {this.state.tamperLoadingBox}
                        operationPath = {this.state.operationPath}
                        handleCancelNew = {this.handleCancelNew.bind(this)}
                        handleConformNew = {this.handleConformNew.bind(this)}
                    />
                }
                {
                    /*上传文件*/
                    this.state.UploadFileBox&&
                    <UploadFile
                        fileActionError = {this.state.fileActionError}
                        uploadFileSizeOut = {this.state.uploadFileSizeOut}
                        tamperLoadingBox = {this.state.tamperLoadingBox}
                        uploadFileName = {this.state.uploadFileName}
                        handleCancelUpload = {this.handleCancelUpload.bind(this)}
                        handleConformUpload = {this.handleConformUpload.bind(this)}
                    />

                }
            </div>
        )
    }
}