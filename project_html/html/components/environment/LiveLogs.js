

import React from "react"　　　　　　//引入react

// 实时展示
export default class LiveLogs extends React.Component {
    constructor(props) {
      super(props); 
      this.state = {liveLogs: null }
    }    

    //获取level类型
    getLevelClass(level) {
        return {
            DEBUG: 'debug',
            INFO: 'info',
            NOTICE: 'notice',
            WARNING: 'warning',
            ERROR: 'error',
            ERR: 'error',
            CRITICAL: 'critical',
            CRIT: 'critical',
            ALERT: 'alert',
            EMERG: 'emerg'
        }[level];
    }

    // 渲染页面
    render() {
        var self = this;
        return (
            <div className="second-left">
                <div className="live-title">
                    实时展示
                </div>
                <div className="logs-container">
                    <div className="logs-head">
                        <div className="head-left">日志</div>
                        <div className="head-right">时间</div>
                    </div>
                    <hr />
                    {
                        this.props.data && this.props.data.map(function (log, index) {
                            return (
                                <section className="logs-center" key={index}>
                                    <div className='content'>
                                        <div className="logs-text">
                                            <div className={self.getLevelClass(log[1]) + " logs-img"}></div>
                                            {log[2]}</div>
                                        <div className="logs-time">{log[0]}</div>
                                    </div>
                                </section>
                            )
                        })
                    }
                </div>
                <br />
            </div>
        )
    }
}