import React from "react";
import $ from 'jquery';
import LoadingAction from "../Commonality/LoadingAction";
export default class AddAssets extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectAddAssetsName:false,//选择用户名
            selectAddAssetsType:false,//选择资产类型
            showNameSelectBox:false, //选择用户名下拉选框
            showTypeSelectBox:false,//选择资产类型下拉
            usrId:'',
            usrJob:'',
            assetType:'',
            fileName:'',//上传文件名
            fileSizeAll:0,//上传文件的总大小
            overFlowFileSize:'',//上传文件错误提示
            getUsrList:[]//用户名列表
        }
    };
    /*
     * 点击显示用户下拉框
     * */
    handleShowSelectNameBox(){
        this.setState({
            showNameSelectBox:!this.state.showNameSelectBox,
            showTypeSelectBox:false
        })
    }
    /*
     * 下拉框选择
     * */
    handleSelectContent(items,e){
        var value = $(e.target).text() //用户名
        var txId = $(e.target).attr('title') //用户id
        var txjob = $(e.target).attr('name') //用户职位
        switch(items) {
            case 1:
                this.setState({
                    selectAddAssetsName: value,
                    usrId:txId,
                    usrJob:txjob,
                    showNameSelectBox: false
                })
                $('.addNameBox').val(value);
                break;
            case 2:
                this.setState({
                    selectAddAssetsType: value,
                    assetType:txId,
                    showTypeSelectBox: false
                })
                break;
        }
    }
    /*
     * 资产类型下拉选择
     * */
    handleShowSelectTypeBox(){
        this.setState({
            showNameSelectBox:false,
            showTypeSelectBox:!this.state.showTypeSelectBox,
        })
    }
    /*
     * 输入名字input，键盘事件
     * */
    handleWriteName(e){
        this.setState({
            selectAddAssetsName:$(e.target).val(),
            usrJob:'',
            showNameSelectBox:true,
        })
        var nameList = [];
        this.props.getUsrList.map((list,index)=>{
            nameList.push({
                username:list.username,
                id:list.id,
                department:list.department
            })
        })
        if($(e.target).val()==''){
            this.setState({
                getUsrList:nameList,
            })
        }else{
            // todo 用户名模糊查询
            var len = nameList.length;
            var arr = [];
            var keyWord = $(e.target).val();
            for(var i=0;i<len;i++){
                //如果字符串中不包含目标字符会返回-1
                if(nameList[i].username.indexOf(keyWord)>=0){
                    arr.push(nameList[i]);
                }
            }
            // console.log(arr)
            this.setState({
                getUsrList:arr,
            })
        }
    }
    /*
     * 上传附件
     * */
    handleUploadFile(){
        //暂时只能新增一个文件
        // if($('.storeFileName a').length==0){
        // console.log($('.storeFileName a').length)
        if($('#uploadFileForm .addFileBox')[0].files[0].size/1000>10){
            //当文件大于1M
            this.setState({
                overFlowFileSize:'文件超过10KB，请重新选择'
            })
            //清空所选的文件
            var file = $('#uploadFileForm .addFileBox')
            file.after(file.clone().val(''))
            file.remove()
            // $('.storeFileName a').remove()
        }else{
            this.setState({
                fileName:$('#uploadFileForm .addFileBox')[0].files[0].name,
                fileSizeAll:$('#uploadFileForm .addFileBox')[0].files[0].size,
                overFlowFileSize:'',
            })
            //新增一个文件节点
            // var domA = document.createElement("a");
            // var txt = document.createTextNode($('#uploadFileForm .addFileBox')[0].files[0].name);
            // domA.appendChild(txt);
            // $('.storeFileName').append(domA)
        }
        // }else{
        //     return;
        // }
        //console.log($('#uploadFileForm .addFileBox')[0].files[0].size)
        // console.log(this.state.fileSizeAll/1000)
    }
    handleDeleteUploadFile(){
        //清空所选的文件
        var file = $('#uploadFileForm .addFileBox')
        file.after(file.clone().val(''))
        file.remove()
        // $('.storeFileName a').remove()
        this.setState({
            fileName:'',
            fileSizeAll:0,
            overFlowFileSize:'',
        })
    }
    componentWillMount() {
        //生成用户列表，以匹配模糊查询
        var nameList = [];
        this.props.getUsrList.map((list,index)=>{
            nameList.push({
                username:list.username,
                id:list.id,
                department:list.department
            })
        })
        this.setState({
            getUsrList:nameList,
        })
    }
    componentDidMount(){
    }
    render() {
        return (
            <div className="BackVersionBox">
                <div className="back-version-content" style={{height:'540px',margin:"-270px 0 0 -330px"}}>
                    <h2 className="back-v-title clearfix">新建资产 <i className="close-icon" onClick={this.props.handleCloseAddAssets.bind(this)}>×</i></h2>
                    <div className="addAssetsCover">
                        <div className="addAssetsIpt clearfix">
                            <h3>用户</h3>
                            <input type="text" className="addAssetsIptName addNameBox" placeholder="请指定用户" title={this.state.usrId}
                                // value={this.state.selectAddAssetsName?this.state.selectAddAssetsName:''} readOnly
                                   onKeyUp={this.handleWriteName.bind(this)}/>
                            <a className="selectOne" onClick={this.handleShowSelectNameBox.bind(this)}></a>
                            <h4>{this.state.selectAddAssetsName}<br/>{this.state.usrJob}</h4>
                            <div className="getIptList"
                                 onClick={this.handleSelectContent.bind(this,1)}
                                 style={{display:this.state.showNameSelectBox?'block':'none'}}>
                                {this.state.getUsrList.map(function(data,index){
                                    return(
                                        <p key={index} title={data.id} name={data.department}>{data.username}</p>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="addAssetsIpt clearfix">
                            <h3>资产类型</h3>
                            <input type="text" className="addAssetsIptName addTypeBox" placeholder="请选择资产类型" title={this.state.assetType}
                                   value={this.state.selectAddAssetsType?this.state.selectAddAssetsType:''} readOnly/>
                            <a className="selectOne"  onClick={this.handleShowSelectTypeBox.bind(this)}></a>
                            {/*<h4>腾讯财付通与工商银行合作，以工商银行的黄金产品为基础，结合互联网客户需求，联合推出的在线黄金...</h4>*/}
                            <div className="getIptList"
                                 onClick={this.handleSelectContent.bind(this,2)}
                                 style={{display:this.state.showTypeSelectBox?'block':'none'}}>
                                {this.props.getTypeList.map(function(data,index){
                                    return(
                                        <p key={index} title={data.key}>{data.name}</p>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="addAssetsIpt clearfix">
                            <h3>资产内容</h3>
                            <input type="text" className="addAssetsIptName addNumBox" placeholder="输入"/>
                            <h4>文件内容</h4>
                        </div>
                        <div className="addAssetsIpt clearfix">
                            <h3>附件</h3>
                            <form id= "uploadFileForm" className="clearfix" encType="multipart/form-data" >
                                <p className="storeFileName">
                                    <a>{this.state.fileName}</a>
                                    <span className="removeUploadFile" onClick={this.handleDeleteUploadFile.bind(this)}>×</span></p>
                                <input type="file" className="addAssetsIptName addFileBox" onChange = {this.handleUploadFile.bind(this)}/>
                                <button className="plugAction uploadFileBtn" type="button">上传附件</button>
                                <a className="fileLimit">已上传 {this.state.fileSizeAll/1000} kb <b>只能上传一个文件，最大10KB</b></a>
                            </form>
                            <a className="fileLimit">{this.state.overFlowFileSize}</a>
                        </div>
                    </div>
                    <div className="version-action">
                        <button className="plugAction back-v-btn back-v-btn-back" onClick={this.props.handleCancelAdd.bind(this)}>取消</button>
                        <button className="plugAction back-v-btn back-v-btn-cancel" onClick={this.props.handleConformAdd.bind(this)}>确认</button>
                    </div>
                    <p className="errorMsg">{this.props.conformMsg}</p>
                    {
                        this.props.showActionLoading &&
                        <LoadingAction/>
                    }
                </div>
            </div>
        )
    }
}