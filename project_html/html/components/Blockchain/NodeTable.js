
import React from "react";              //引入react


export default class NodeTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }

    render() {
        return (
            <div className='nodeTableList'>
                <div className='nodeTableList-header'>
                    <span>节点列表</span>
                    <span className='total'>共．．．．项</span>
                </div>
            </div>
        )
    }
}
