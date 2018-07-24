
import React from "react";              //引入react
import { Button, } from 'react-bootstrap';

export default class BlockStatus extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            chainnodes: 0, // 区块链节点数
            chainheight: 0, // 区块链高度
            chaintradenum: 0, // 区块链峰值交易数
            chaintradenumsum: 0,　// 区块链当日交易笔数
        }
    }
    /**
       * 组件将要加载时的操作
       */
    componentWillMount() {
        var self = this;
        // 区块链节点数
        $.ajax({
            url: '/api/chain/node_count/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function (data) {
                self.setState({
                    chainnodes: data.count
                })
            }
        })
        // 区块链高度
        $.ajax({
            url: '/api/chain/block_count/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function (data) {
                self.setState({
                    chainheight: data.count
                })
            }
        })
        // 区块链峰值交易数
        $.ajax({
            url: '/api/chain/peak_trans_count/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function (data) {
                // console.log(JSON.stringify(data))
                self.setState({
                    chaintradenum: data.count
                })
            }
        })
        // 区块链当日交易笔数
        $.ajax({
            url: '/api/chain/day_trans_count/',
            type: 'POST',
            dataType: 'json',
            cache: false,
            success: function (data) {
                // console.log(JSON.stringify(data))
                self.setState({
                    chaintradenumsum: data.count
                })
            }
        })

    }
    render() {
        return (
            <ul>
                <li className='clearfix'>
                    <img src="/static/img/blockChain/nodes.png" alt="" />
                    <p>当前节点数</p>
                    <h2>{this.state.chainnodes}</h2>
                </li>
                <li className='clearfix'>
                    <img src="/static/img/blockChain/blockheight.png" alt="" />
                    <p>区块高度</p>
                    <h2>{this.state.chainheight}</h2>
                </li>
                <li className='clearfix'>
                    <img src="/static/img/blockChain/tradenumsum.png" alt="" />
                    <p>账号</p>
                    <h2>{this.state.chaintradenumsum}</h2>
                </li>
                <li className='clearfix'>
                    <img src="/static/img/blockChain/tradenum.png" alt="" />
                    <p>峰值交易数</p>
                    <h2>{this.state.chaintradenum}</h2>
                </li>

                <li className='clearfix'>
                    <img src="/static/img/blockChain/tradenumsum.png" alt="" />
                    <p>当日总交易笔数</p>
                    <h2>{this.state.chaintradenumsum}</h2>
                </li>
                <li className='clearfix'>
                    <img src="/static/img/blockChain/tradenumsum.png" alt="" />
                    <p>不可逆交易数</p>
                    <h2>{this.state.chaintradenumsum}</h2>
                </li>
            </ul>
        )
    }
}
