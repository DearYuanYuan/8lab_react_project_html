
import React from "react";
import $ from 'jquery';
import LoadingAction from "../Commonality/LoadingAction";
export default class TransAssets extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectAddAssetsName:false,//选择用户名
            selectAddAssetsType:false,//选择资产类型
            showNameSelectBox:false, //选择用户名下拉选框
            showTypeSelectBox:false,//选择资产类型下拉
            usrJob:'',//选择用户的职位
            transUsrId:'',//选择用户的id
            assetType:'' //资产类型
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
        var job = $(e.target).attr('name') //用户职位
        var idOrType = $(e.target).attr('title') //资产类型或者被转移用户的id
        switch(items) {
            case 1:
                this.setState({
                    selectAddAssetsName: value,
                    usrJob:job,
                    transUsrId:idOrType,
                    showNameSelectBox: false

                })
                break;
            case 2:
                this.setState({
                    selectAddAssetsType: value,
                    assetType:idOrType,
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
            showTypeSelectBox:!this.state.showTypeSelectBox
        })
    }
    /*
     * 输入名字input，键盘事件
     * */
    handleWriteName(){
        // console.log(1)
    }
    componentWillMount() {

    }
    render() {
        return (
            <div className="BackVersionBox">
                <div className="back-version-content" style={{height:'480px',margin:"-240px 0 0 -330px"}}>
                    <h2 className="back-v-title clearfix">资产转移 （资产所有者：<b>{this.props.transUrsName}</b>）<i className="close-icon" onClick={this.props.handleCloseTransAssets.bind(this)}>×</i></h2>
                    <div className="addAssetsCover">
                        <div className="addAssetsIpt clearfix">
                            <h3>转移到目标用户</h3>
                            <input type="text" className="addAssetsIptName transUsrName" placeholder="请指定用户" name={this.state.transUsrId}
                                   value={this.state.selectAddAssetsName?this.state.selectAddAssetsName:''}
                                   onChange={this.handleWriteName.bind(this)}/>
                            <a className="selectOne" onClick={this.handleShowSelectNameBox.bind(this)}></a>
                            <h4>{this.state.selectAddAssetsName} <br/>{this.state.usrJob}</h4>
                            <div className="getIptList"
                                 onClick={this.handleSelectContent.bind(this,1)}
                                 style={{display:this.state.showNameSelectBox?'block':'none'}}>
                                {this.props.getUsrList.map(function(data,index){
                                    return(
                                        <p key={index} title={data.id} name={data.department}>{data.username}</p>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="addAssetsIpt clearfix">
                            <h3>资产类型</h3>
                            <input type="text" className="addAssetsIptName" placeholder="请选择资产类型" title={this.state.assetType}
                                   // value={this.state.selectAddAssetsType?this.state.selectAddAssetsType:''} 资产类型不能选择
                                value={this.props.transUrsType} readOnly
                            />

                            {/*<a className="selectOne"  onClick={this.handleShowSelectTypeBox.bind(this)}></a>*/}
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
                            <input type="text" className="addAssetsIptName" value={this.props.transUrsAsset} readOnly/>
                            <h4>单位</h4>
                        </div>
                        <div className="addAssetsIpt clearfix">
                            <h3>附件</h3>
                            <h4>{this.props.transFileName}</h4>
                        </div>
                    </div>
                    <div className="version-action">
                        <button className="plugAction back-v-btn back-v-btn-back" onClick={this.props.handleCancelTrans.bind(this)}>取消</button>
                        <button className="plugAction back-v-btn back-v-btn-cancel" onClick={this.props.handleConformTrans.bind(this)}>确认</button>
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
