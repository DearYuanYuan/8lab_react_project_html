
import React from "react";
import $ from 'jquery';
import { Pagination } from 'react-bootstrap';
import LoadingText from "../Commonality/LoadingText";
require('../../styles/ClientData.less')
export default class ClientDatag extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            clientData: null,
            isLoading: false,
            isError: false,
            pageIndex: 1,
            pageCount: 10,
            type: "all",
        }

        this.ClientDataList = [      //搜索时可选的类型
            {
                name: '显示所有',         //显示在下拉列表中
                value: 'local'      //选中时传递的值
            }
        ]
    };

    /**
 * 根据目标元素的value值设置参数type
 * 
 * @param {any} e 
 * 
 * @memberof Environment
 */
    handleTypeChange(value) {
        this.setState({ type: value });
    }

    //改变页码
    handleChange(eventKey) {
        this.setState({
            pageIndex: eventKey,

        });
        // this.getClientData(eventKey, this.state.type)
        this.getClientData(eventKey)
    }



    //用户改变input输入框页码
    handleInputValue(e) {
        var re = /^[0-9]+$/;
        var indexCurrent = parseInt($(e.target).val())
        if (!re.test($(e.target).val())) {
            $(e.target).val('')
        }
        if (indexCurrent > this.state.pageCount) {
            $(e.target).val(this.state.pageCount)
        }
        if (indexCurrent <= 0) {
            $(e.target).val('')
        }
        if (e.keyCode == 13 && re.test($(e.target).val())) {    // 分页input回车
            this.getClientData(indexCurrent)
        }
    }

    iconClick(){
        var pageIndex=parseInt($("#serverDataIndex").val());
        if(!pageIndex){
            return
        }
        this.setState({
            pageIndex: pageIndex
        });
        this.getClientData(pageIndex)
    }
    //获取页面渲染数据
    getClientData(pageIndex) {
        this.setState({
            isLoading: true
        })
        var self = this;
        $.ajax({
            url: "/api/tamper_proof/get_client_log/",
            type: "POST",
            dataType: "json",
            data: {
                pagenum: pageIndex,
                pagesize:20,
                username:this.props.tamperUsrName,
                token:this.props.tamperUsrToken,
                is_super:this.props.tamperIsSuper,
                "service_type": "svn"
            },
            success(data) {
                self.setState({
                    pageIndex:pageIndex,
                    clientData: data.content,
                    isLoading: false,
                    isError: false,
                    pageCount :parseInt(Math.ceil(data.total / 20))
                })
            },
            error(data) {
                self.setState({
                    isLoading: false,
                    isError: true,
                })
            }
        })
    }

    componentWillMount() {
        this.getClientData(1)
    }

    render() {

        //通过下拉列表选项要传递的值获取数组中对应的对象。
        //此方法用于下拉列表设置 itemDefault
        // var getItemByValue = function (value, itemList) {
        //     for (var i = 0; i < itemList.length; i++) {
        //         if (itemList[i].value == value) {
        //             return itemList[i]
        //         }
        //     }
        // }

        return (
            this.props.tabKey == 5 &&
            <div className="version-msg-list clientDataList">

              {/* <DropdownList
                    listID="displayTpye"
                    itemsToSelect={this.ClientDataList}
                    onSelect={(value) => this.handleTypeChange(value)}
                    itemDefault={getItemByValue(this.state.type, this.ClientDataList)} />   */} 
                {this.state.isLoading && <LoadingText />}

                {this.state.isError && <div className="ClientError">加载失败！</div>}

                {this.state.clientData && !this.state.isLoading && !this.state.isError &&
                    <div>
                        <table>
                            <thead>
                                <tr>
                                    <th>所属机器</th>
                                    <th>同步时间 </th>
                                    <th>操作类型</th>
                                    <th>源路径</th>
                                    <th>目的路径</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.state.clientData.map(function (item, index) {
                                    var loop= JSON.parse(item._source.message)
                                    return (
                                        <tr key={index}>
                                            <td>{loop.client_address}</td>
                                            <td>{loop.timestamp}</td>
                                            <td>{loop.tamper_type}</td>
                                            <td>{loop.spath}</td>
                                            <td>{loop.root_path}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        <div className="pagination-all">
                            <Pagination
                                prev={true}
                                next={true}
                                first={false}
                                last={false}
                                ellipsis={true}
                                boundaryLinks={true}
                                items={this.state.pageCount}
                                maxButtons={7}
                                activePage={this.state.pageIndex}
                                onSelect={this.handleChange.bind(this)} />
                            <div className="pageCount">
                                <input className="pageNum"  id='serverDataIndex' placeholder="输入"  onChange={this.handleInputValue.bind(this)}  />
                                <img className="searchNum" onClick={() => this.iconClick()} src='/static/img/skip.svg' />
                            </div>
                        </div>
                    </div>
                }
            </div>
        )
    }
}

