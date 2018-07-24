import React from "react";
import $ from 'jquery';
import LoadingAction from "../Commonality/LoadingAction";
export default class AddUsrAsset extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            getTypeList:[],//资产类型列表
            showTypeSelectBox:false,
            selectAddAssetsType:'',//资产类型
            selectAddAssetsTypeKey:'',//资产类型key（后台使用）
            fileName:'',//上传文件名
            fileSizeAll:0,//上传文件的总大小
            overFlowFileSize:'',//上传文件错误提示
        }
    };
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
     * 点击显示下拉选框
     * */
    handleShowSelectTypeBox(){
        this.setState({
            showTypeSelectBox:!this.state.showTypeSelectBox
        })
    }
    /*
     * 下拉选框选择
     * */
    handleSelectContent(e){
        var type = $(e.target).text();
        var key = $(e.target).attr('title');
        this.setState({
            selectAddAssetsType:type,
            showTypeSelectBox:false,
            selectAddAssetsTypeKey:key
        })
    }
    /*
     * 上传附件
     * */
    handleUploadFile(){
        //暂时只能新增一个文件
        // if($('.storeFileName a').length==0){
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
                overFlowFileSize:''
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
        // console.log($('#uploadFileForm .addFileBox')[0].files[0].size)
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
            overFlowFileSize:''
        })
    }
    componentWillMount() {
        this.getAssetsType() //获取资产类型列表
    }
    render() {
        return (
            <div className="BackVersionBox">
                <div className="back-version-content" style={{height:'540px',margin:"-270px 0 0 -330px"}}>
                    <h2 className="back-v-title clearfix">新建资产 <i className="close-icon" onClick={this.props.handleCloseAddUsrAssets.bind(this)}>×</i></h2>
                    <div className="addAssetsCover">
                        <div className="addAssetsIpt clearfix">
                            <h3>用户</h3>
                            <input type="text" className="addAssetsIptName" readOnly
                                   value={this.props.addNewUsrAsset.name}/>
                            <h4>{this.props.addNewUsrAsset.part} <br/>{this.props.addNewUsrAsset.job}</h4>
                        </div>
                        <div className="addAssetsIpt clearfix">
                            <h3>资产类型</h3>
                            <input type="text" className="addAssetsIptName addNewUsrAssetTypeKey" placeholder="请选择资产类型" title={this.state.selectAddAssetsTypeKey}
                                   value={this.state.selectAddAssetsType} readOnly
                            />
                            <a className="selectOne"  onClick={this.handleShowSelectTypeBox.bind(this)}></a>
                            <div className="getIptList"
                                 onClick={this.handleSelectContent.bind(this)}
                                 style={{display:this.state.showTypeSelectBox?'block':'none'}}>
                                {this.state.getTypeList.map(function(data,index){
                                    return(
                                        <p key={index} title={data.key}>{data.name}</p>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="addAssetsIpt clearfix">
                            <h3>资产内容</h3>
                            <input type="text" className="addAssetsIptName addNewUsrAssetNum" placeholder="输入"/>
                            <h4>文件内容</h4>
                        </div>
                        <div className="addAssetsIpt clearfix">
                            <h3>附件</h3>
                            <form id= "uploadFileForm" encType="multipart/form-data">
                                <p className="storeFileName">
                                    <a>{this.state.fileName}</a>
                                    <span className="removeUploadFile" onClick={this.handleDeleteUploadFile.bind(this)}>×</span></p>
                                <input type="file" className="addAssetsIptName addFileBox" placeholder="0.0" onChange = {this.handleUploadFile.bind(this)}/>
                                <button className="plugAction uploadFileBtn" type="button">上传附件</button>
                                <a className="fileLimit">已上传 {this.state.fileSizeAll/1000} kb <b>只能上传一个文件，最大10KB</b></a>
                            </form>
                            <a className="fileLimit">{this.state.overFlowFileSize}</a>
                        </div>
                    </div>
                    <div className="version-action">
                        <button className="plugAction back-v-btn back-v-btn-back" onClick={this.props.handleCancelAddUsrAsset.bind(this)}>取消</button>
                        <button className="plugAction back-v-btn back-v-btn-cancel" onClick={this.props.handleConformUsrAsset.bind(this)}>确认</button>
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