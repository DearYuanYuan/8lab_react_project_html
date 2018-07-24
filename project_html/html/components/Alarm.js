import React from "react"
import $ from "jquery";

import { Tabs, Tab, Pagination, ButtonToolbar, Button } from 'react-bootstrap';　  //引入bootstrap组件
import  AlarmList from './alarm/alarmList';


export default class Alarm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            key: 1
        }
    }
    handleSelect(key) {
        this.setState({ key });
    }
    componentDidMount() {
        //修改页面title
        document.title = '系统历史警告'
    }
    render() {
        return (
            <div className="home-main settings alarm">
                <header>
                    <div className='settings-title'>系统历史警告</div>
                </header>
                <Tabs activeKey={this.state.key} id="tabs" onSelect={(key) => this.handleSelect(key)}>
                    <Tab eventKey={1} title="警告列表">
                        {this.state.key == 1 && <AlarmList />}
                    </Tab>
                </Tabs>
            </div>
        )
    }

}