import React from "react";          //引入react
import { Tabs, Tab, Pagination, ButtonToolbar, Button } from 'react-bootstrap';　  //引入bootstrap组件
import VirusScan from "./systemCheck/VirusScan";//病毒扫描
import Database from "./Database"               //数据库可信状态
import DatabaseAudit from './DatabaseAudit'    //数据库可信审计
import Schtasks from './systemCheck/Schtasks'  //任务计划管理器
//系统检测
export default class SystemCheck extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectKey: 1
        }
    }
    componentDidMount() {
        //修改页面title
        document.title = '系统检测'
    }


    changeSelectKey = (selectedKey) => {
        this.setState(
            { selectKey: selectedKey }
        )
    }
    //页面渲染
    render() {
        return (
            <section className="home-main systemCheck">
                <div className="sysHeader clearfix">
                    <header>
                        <div className='sysHeader-title'>系统检测</div>
                    </header>




                    <Tabs defaultActiveKey={1} id="tabs" onSelect={this.changeSelectKey}>
                        <Tab eventKey={1} title="病毒扫描">
                            {this.state.selectKey == 1 && <VirusScan />}
                        </Tab>
                        <Tab eventKey={2} title="数据库可信状态">
                            {this.state.selectKey == 2 && <Database />}

                        </Tab>
                        <Tab eventKey={3} title="数据库可信审计">
                            {this.state.selectKey == 3 && <DatabaseAudit />}
                        </Tab>
                        <Tab eventKey={4} title="任务计划管理器">
                            {this.state.selectKey == 4 && <Schtasks />}
                        </Tab>
                  
                    </Tabs>

                </div>
            </section>
        )
    }
}
