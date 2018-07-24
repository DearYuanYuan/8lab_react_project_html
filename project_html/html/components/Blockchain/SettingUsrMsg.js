import React from "react";
import $ from 'jquery';
import LoadingAction from "../Commonality/LoadingAction";
export default class SettingUsrMsg extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            usrPartAdd:false,//选择的部门
            usrJobAdd:false, //选择的职位
            getJobList:['rd','pm','qa','fe'],//职位列表
            getPartList:['dev','ui','pm'], //部门列表
            showPartSelectBox:false, //选择部门下拉菜单
            showJobSelectBox:false,//选择职位下拉菜单
            imgSize:0,//上传的头像大小
            overFlowFileSize:'',
            imgSrc:false,
        }
    };
  /*
   * 点击出现下拉选框
   * */
    handleShowSelectJobBox(index){
        switch(index){
            case 1:
                this.setState({
                    showPartSelectBox:!this.state.showPartSelectBox,
                    showJobSelectBox:false
                })
                break;
            case 2:
                this.setState({
                    showJobSelectBox:!this.state.showJobSelectBox,
                    showPartSelectBox:false
                })
                break;
        }
    }
  /*
   * 下拉选框选择
   * */
    handleSelectContent(index,e){
        //console.log($(e.target).text())
        var value = $(e.target).text()
        switch(index){
            case 1:
                this.setState({
                    showPartSelectBox:false,
                    usrPartAdd:value
                })
                break;
            case 2:
                this.setState({
                    showJobSelectBox:false,
                    usrJobAdd:value
                })
                break;
        }
    }
  /*
   * 上传头像
   * */
    handleUploadImg(){
        var file = $('#uploadFileForm .uploadImg')[0].files[0]
        if(file.size/1024/1024>10){
            //当文件大于10M
            this.setState({
                overFlowFileSize:'文件超过10M，请重新选择'
            })
            //清空所选的文件
            var fileUp = $('#uploadFileForm .uploadImg')
            fileUp.after(fileUp.clone().val(''))
            fileUp.remove()
        }else{
            var reader = new FileReader();
            //读取文件src
            reader.onload = function(e){
                var self = this;
                self.setState({
                    overFlowFileSize:'',
                    imgSize:file.size,
                    imgSrc:e.target.result
                })
            }.bind(this)
            reader.readAsDataURL(file);
        }
    }
    componentWillMount() {
        // console.log(this.props.settingUsrMsgList)
    }
    render() {
        return (
            <div className="BackVersionBox">
              <div className="back-version-content"  style={{height:'540px',margin:"-270px 0 0 -330px"}}>
                <h2 className="back-v-title clearfix">编辑用户<i className="close-icon" onClick={this.props.handleCloseSetUsrBox.bind(this)}>×</i></h2>
                <div className="addAssetsCover clearfix">
                  <div className="left-img-upload version-action addAssetsIpt clearfix">
                    <div className="imgCover">
                      <img src={this.state.imgSrc||this.props.settingUsrMsgList.photo} alt="" id="setUsrPhoto"/>
                    </div>
                    <form id= "uploadFileForm" className="clearfix" encType="multipart/form-data" >
                      <input type="file" className="addAssetsIptName addFileBox uploadImg"
                             accept='image/jpg,image/jpeg,image/png,image/svg'
                             onChange={this.handleUploadImg.bind(this)}/>
                      <button className="plugAction back-v-btn" type="button" >上传头像</button>
                      <p className="fileLimit">已上传 {this.state.imgSize/1000} kb <br/><b>头像最大不超过100KB</b></p>
                    </form>
                    <a className="fileLimit">{this.state.overFlowFileSize}</a>
                      {/*<button className="plugAction back-v-btn">上传头像</button>*/}
                  </div>
                  <div className="right-msg-upload clearfix">
                    <div className="addAssetsIpt clearfix add-usr-name">
                      <h3>用户名</h3>
                      <input type="text" className="addAssetsIptName usrNameAdd" defaultValue={this.props.settingUsrMsgList.name} readOnly/>
                    </div>
                    <div className="addAssetsIpt clearfix add-usr-other">
                      <h3>部门</h3>
                        <input type="text" className="addAssetsIptName usrPartAdd"
                               defaultValue={this.props.settingUsrMsgList.department} />
                      {/*<input type="text" className="addAssetsIptName usrPartAdd"*/}
                             {/*defaultValue={!this.state.usrPartAdd?this.props.settingUsrMsgList.department:this.state.usrPartAdd} />*/}
                      {/*<a className="selectOne addUsrSelect-one"  onClick={this.handleShowSelectJobBox.bind(this,1)}></a>*/}
                      {/*<div className="getIptList addUsrIptList"*/}
                           {/*onClick={this.handleSelectContent.bind(this,1)}*/}
                           {/*style={{display:this.state.showPartSelectBox?'block':'none'}}>*/}
                          {/*{this.state.getPartList.map(function(data,index){*/}
                              {/*return(*/}
                                  {/*<p key={index}>{data}</p>*/}
                              {/*)*/}
                          {/*})}*/}
                      {/*</div>*/}
                    </div>
                    <div className="addAssetsIpt clearfix add-usr-other">
                      <h3>职位</h3>
                        <input type="text" className="addAssetsIptName usrJobAdd"
                               defaultValue={this.props.settingUsrMsgList.job}/>
                      {/*<input type="text" className="addAssetsIptName usrJobAdd"*/}
                             {/*defaultValue={!this.state.usrJobAdd?this.props.settingUsrMsgList.job:this.state.usrJobAdd}/>*/}
                      {/*<a className="selectOne addUsrSelect-one"  onClick={this.handleShowSelectJobBox.bind(this,2)}></a>*/}
                      {/*<div className="getIptList addUsrIptList"*/}
                           {/*onClick={this.handleSelectContent.bind(this,2)}*/}
                           {/*style={{display:this.state.showJobSelectBox?'block':'none'}}>*/}
                          {/*{this.state.getJobList.map(function(data,index){*/}
                              {/*return(*/}
                                  {/*<p key={index}>{data}</p>*/}
                              {/*)*/}
                          {/*})}*/}
                      {/*</div>*/}
                    </div>
                    <div className="addAssetsIpt clearfix add-usr-other">
                      <h3>邮箱</h3>
                      <input type="text" className="addAssetsIptName usrEmailAdd" defaultValue={this.props.settingUsrMsgList.email}/>
                    </div>
                    <div className="addAssetsIpt clearfix add-usr-other">
                      <h3>联系电话</h3>
                      <input type="text" className="addAssetsIptName usrPhoneAdd" defaultValue={this.props.settingUsrMsgList.phone}/>
                    </div>
                  </div>
                </div>
                <div className="version-action">
                  <button className="plugAction back-v-btn back-v-btn-back" onClick={this.props.handleCancelSetUsr.bind(this)}>取消</button>
                  <button className="plugAction back-v-btn back-v-btn-cancel" onClick={this.props.handleConformSetUsr.bind(this)}>确认</button>
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