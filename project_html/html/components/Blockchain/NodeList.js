
import React from "react";              //引入react
import BlockStatus from './BlockStatus'
import NodeTable from './NodeTable'
export default class NodeList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {

        }
    }

    render() {
        return (
            <div className='chain-content'>
                <BlockStatus />
                <NodeTable />
            </div>
        )
    }
}
