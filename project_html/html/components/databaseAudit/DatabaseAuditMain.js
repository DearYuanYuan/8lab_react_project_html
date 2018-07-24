/**
 * 数据库审计标签页的主体部分
 */
import React from "react";
import PieChart from "./PieChart"; //饼状图展示
import PieChart2 from "./PieChart2"; //饼状图展示
import PieChart3 from "./PieChart3"; //饼状图展示
import BarChart from "./BarChart"; //柱状图表展示
import BarChart2 from "./BarChart2"; //柱状图表展示
import DatabaseAuditLogs from "./DatabaseAuditLogs"; //审计日志展示

/*数据库审计标签页的主体部分*/
export default class DatabaseAuditMain extends React.Component {


    constructor(props) {
        super(props);
        this.state = {
            onetrue: true
        }
    }

    render() {

        return (
            <main className="dbAudit-main">
                <div className="charts-row clearfix">
                    <div className="chart-container chart-1">
                        {this.state.onetrue && <PieChart />}
                    </div>
                    <div className="chart-container chart-2">
                        <BarChart />
                    </div>
                </div>
                <div className="charts-row-2 clearfix">
                    <div className="chart-container chart-3">
                        <BarChart2 />
                    </div>
                    <div className="charts-col">
                        <div className="chart-container chart-4">
                            <PieChart2 />
                        </div>
                        <div className="chart-container chart-5">
                            <PieChart3 />
                        </div>
                    </div>
                </div>
                {/*审计日志模块*/}
                <div className="logs-container">
                    <DatabaseAuditLogs
                        searchByKeyword={this.props.searchByKeyword}
                        logsDetailList={this.props.logsDetailList}
                        pageCount={this.props.pageCount}
                        currentPage={this.props.currentPage}
                        handleSelectLogsPage={this.props.handleSelectLogsPage}
                        handleJumpPage={this.props.handleJumpPage}
                        exportLogs={this.props.exportLogs}
                        rowsPerPage={this.props.rowsPerPage}
                        totalLogsCount={this.props.totalLogsCount}
                        setRowsPerPage={this.props.setRowsPerPage}
                    />
                </div>
            </main>
        )
    }
}