import React from "react";              //引入react


/*可信审计－ＭＬ显示*/
export default class MlTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            mllist: []
        }
    }

    // 页面渲染
    render() {
        return (
            <div className="table">
                <div className="thead">
                    <div className="ml-index">序号</div>
                    <div className="ml-pcr">PCR</div>
                    <div className="ml-template-hash">模板哈希</div>
                    <div className="ml-type">类型</div>
                    <div className="ml-filedata-num">文件（数据）哈希</div>
                    <div className="ml-filename-hint">文件路径</div>
                </div>
                <div className="tbody">
                    {this.props.mllist &&
                        this.props.mllist.map((ml, index) => {
                            return (
                                <div className="tr" key={ml.id}>
                                    <div className="ml-index">{index + 1}</div>
                                    <div className="ml-pcr">{ml.pcr}</div>
                                    <div className="ml-template-hash" title={ml.templatehash}>
                                        {ml.templatehash}
                                    </div>
                                    <div className="ml-type">{ml.tmptype}</div>
                                    <div className="ml-filedata-num" title={ml.filedata}>
                                        {ml.filedata}

                                    </div>
                                    <div className="ml-filename-hint filerouter" title={ml.filerouter}>
                                        {ml.filerouter}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        );
    }
}

