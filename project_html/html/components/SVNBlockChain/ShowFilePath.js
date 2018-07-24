import React from "react";
import {Pagination} from 'react-bootstrap';
import $ from 'jquery';
export default class ShowFilePath extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentListPageNum:1,//当前页码
            dataListAllPage:1,//总页码
            versionFilePathChangeList:false,//初始化版本历史信息列表
        }
    };
    componentWillMount() {
        let len = this.props.versionFilePathChange.length
        let pageNum = (len % 6 == 0)?len/6:(parseInt(len/6)+1)
        this.setState({
            dataListAllPage:pageNum,//设置页码
            versionFilePathChangeList:this.props.versionFilePathChange.slice(0,6)//截取前6组数据，写入页面
        })
        // console.log(this.props.versionFilePathChange);
        // console.log(this.state.versionFilePathChangeList);       
    }
    /*
    点击页码
    * */
    handleChangePage(eventKey){
        this.setState({
            currentListPageNum:eventKey,
            versionFilePathChangeList:this.props.versionFilePathChange.slice((eventKey-1)*6,eventKey*6) //根据当前页码数，截取根目录版本信息列表的某一页
        })
    }
    //页码输入处理
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
                versionFilePathChangeList:this.props.versionFilePathChange.slice((indexCurrent-1)*6,indexCurrent*6) //根据当前页码数，截取根目录版本信息列表的某一页
            })
            $(e.target).val('') //清空所填写的页码
        }
    }
    /*
     * 点击页码跳转按钮
     * */
    handleJumpPage(){
        var indexCurrent = parseInt($('.versionHistoryPageNum').val())
        this.setState({
            currentListPageNum: indexCurrent,
            versionFilePathChangeList:this.props.versionFilePathChange.slice((indexCurrent-1)*6,indexCurrent*6) //根据当前页码数，截取根目录版本信息列表的某一页
        })
        $('.versionHistoryPageNum').val('') //清空所填写的页码
    }
    render() {
        return (
        <div className="BackVersionBox svn-box" >
            <div className="back-version-content">
                <h2 className="back-v-title clearfix">
                    <i className="fa fa-pencil-square-o svn-box-icon" aria-hidden="true"></i>
                    <span className="svn-box-title">变更文件列表</span>
                    <i className="close-icon svn-close-icon" onClick={this.props.handleCloseFileConform.bind(this)}>×</i>
                </h2>
                {/* <h3 className="pathName">Path : all folders/sample folder/sample subfolder/sample subfolder/</h3> */}
                <div className="box-content left versionFileChangeList">
                    {
                        this.state.versionFilePathChangeList.map((list,index)=>{
                            return(
                                <p key={index}>{list}</p>
                                )
                        })
                    }
                </div>
                {/* <div className="version-action">
                    <button className="plugAction back-v-btn back-v-btn-cancel" onClick={this.props.handleCloseFileConform.bind(this)}>确定</button>
                </div> */}
                <div className="pagination-all">
                    <Pagination prev={true} next={true} first={false} last={false} ellipsis={true} boundaryLinks={true}
                                items={this.state.dataListAllPage}
                                activePage={this.state.currentListPageNum} maxButtons={7}
                                onSelect={this.handleChangePage.bind(this)}
                    />
                    <div className="pageCount">
                        <input className="pageNum versionHistoryPageNum" placeholder="输入"
                               onKeyUp={this.handleEnterPage.bind(this)} onKeyDown={this.handleEnterPage.bind(this)}
                        />
                        <img className="searchNum"　src='/static/img/skip.svg' onClick={this.handleJumpPage.bind(this)}/>
                    </div>
                </div>
            </div>
        </div>
        )
    }
}