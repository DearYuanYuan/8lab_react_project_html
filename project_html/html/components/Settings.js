import React from "react"
import $ from "jquery";
import WarningMode from './Settings/WarningMode'
import AdditionalDocuments from './Settings/AdditionalDocuments'
import GeneralSettings from './Settings/GeneralSettings'
import { Tabs, Tab, Pagination, ButtonToolbar, Button } from 'react-bootstrap';　  //引入bootstrap组件



export default class Settings extends React.Component {
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
        document.title = '系统设置'
    }
    render() {
        return (
            <div className="home-main settings">
                <header>
                    <div className='settings-title'>系统设置</div>
                </header>
                <Tabs activeKey={this.state.key} id="tabs" onSelect={(key) => this.handleSelect(key)}>
                    <Tab eventKey={1} title="通用设置">
                        {this.state.key == 1 && <GeneralSettings/>}
                    </Tab>
                    <Tab eventKey={2} title="警告通讯方式">
                        {this.state.key == 2 && <WarningMode/>}
                    </Tab>
                    <Tab eventKey={3} title="登录附加凭证">
                        {this.state.key == 3 && <AdditionalDocuments />}
                    </Tab>
                </Tabs>
            </div>
        )
    }

}