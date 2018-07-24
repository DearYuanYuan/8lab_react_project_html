import React from "react"                    //引入react

// 可信审计－－列表显示
export default class AllLogs extends React.Component {
    //legend的数据
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
    
    //渲染页面
    render() {
        var self = this;
        return (
            <div className="list-content">
                <div className='logs-details'>
                    <div className="details-text">
                        <div className="">类型</div>
                        <div> 列表项</div>
                    </div>
                    <div className="details-time">时间</div>

                </div>
                {
                    self.props.data.map(function (log, index) {
                        return (
                            <div key={index} className='logs-details'>
                                <div className="details-text">
                                    <div className={self.getLevelClass(log[1])}></div>
                                    <div title={log[2]}> {log[2]}</div>
                                </div>
                                <div className="details-time">{log[0]}</div>
                            </div>
                        )
                    })
                }
            </div>
        )
    }
}