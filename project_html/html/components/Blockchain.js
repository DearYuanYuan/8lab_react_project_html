import React from "react";
import $ from 'jquery';
import BlockchainChart from './Blockchain/BlockchainChart'
import BlockchainList from './Blockchain/BlockchainList'
import CurrentDeal from './Blockchain/CurrentDeal'
import UsrManage from './Blockchain/UsrManage'
import BlockStatus from './Blockchain/BlockStatus'
import NodeList from './Blockchain/NodeList'
/*区块链的页面*/
export default class Blockchain extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectChain: false,

            tabKey: 1,

        }
    };

    /**
     * 
     */
    handleSelectChain(e) {
        // console.log($(e.target).index())
        this.setState({
            selectChain: $(e.target).index()
        })
    }
    handleToggleTab(index) {
        this.setState({
            tabKey: index
        })
    }


    componentDidMount() {
        //修改页面title
        document.title = '区块链存证'
    }
    render() {
        return (
            <div className="tamper databaseCover">
                <div className="topPluginAction blockChainHead">
                    <h2>区块链存证</h2>
                    <ul className="tab-tamper clearfix">
                        <li className={this.state.tabKey == 1 ? "tab-active" : ""} onClick={this.handleToggleTab.bind(this, 1)}>区块链状态</li>
                       {/*<li className={this.state.tabKey == 2 ? "tab-active" : ""} onClick={this.handleToggleTab.bind(this, 2)}>节点列表</li> */} 
                        <li className={this.state.tabKey == 3 ? "tab-active" : ""} onClick={this.handleToggleTab.bind(this, 3)}>当前交易</li>
                        <li className={this.state.tabKey == 4 ? "tab-active" : ""} onClick={this.handleToggleTab.bind(this, 4)}>用户管理</li>
                    </ul>
                    {/**
                     * 区块链搜索功能暂时无

                     */}

                </div>
                {
                    this.state.tabKey == 1 &&
                    <div className="blockChain-status">
                        <div className="chain-content">
                            <BlockStatus />
                        </div>
                        <div className="database-content" style={{ marginTop: '0px' }}>
                            <ul className="clearfix databaseListUl">
                                <li className={this.state.selectChain == '0' ? "databaseList base-select" : "databaseList"} onClick={this.handleSelectChain.bind(this)}>拓扑图</li>
                                <li className={this.state.selectChain == '1' ? "databaseList base-select" : "databaseList"} onClick={this.handleSelectChain.bind(this)}>节点列表</li>
                            </ul>
                            {
                                this.state.selectChain == 0 &&
                                <BlockchainChart selectChain={this.state.selectChain} />
                            }
                            {
                                this.state.selectChain == 1 &&
                                <BlockchainList selectChain={this.state.selectChain} />
                            }


                        </div>
                    </div>
                }
                { /*this.state.tabKey == 2 &&
                        <NodeList tabKey={this.state.tabKey}  />

                */}

                {
                    this.state.tabKey == 3 &&
                    <div className="currentDeal-content clearfix">
                        <CurrentDeal tabKey={this.state.tabKey} getUsrList={this.state.getUsrList} />
                    </div>

                }
                {
                    this.state.tabKey == 4 &&
                    <div className="currentDeal-content clearfix">
                        <UsrManage tabKey={this.state.tabKey} />
                    </div>
                }



            </div>
        )
    }
}