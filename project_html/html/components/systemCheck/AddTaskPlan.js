
import React from "react";              //引入react
import { Pagination, Modal, Col, Button, Table, Form, FieldGroup, ControlLabel, FormControl, FormGroup, HelpBlock } from 'react-bootstrap';
import { isInt, isIP, isPort, isUrl } from "../../utils/utils";　　　//引入用到的工具函数} 
import MessageBox from "../Commonality/MessageBox"          //消息提示框组件
import DropdownList from "../Commonality/DropdownList";     //下拉列表的组件
export default class AddTaskPlan extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            key: 1,
            showTypeInput: false,　　　//是否显示表格类型切换框
            setType: '主机列表',　　　　//设置任务计划配置的步骤一时显示主机列表还是主机组
            showSetdata: false,　　　//是否显示表格类型切换框
            setdata: '每日',　　　　//设置任务计划配置的步骤一时显示主机列表还是主机组
            performKey: 1,

            items: [],
            dayHour: '',
            dayMin: '',

            weekDay: '',
            weekHour: '',
            weekMin: '',

            monthDay: '',
            monthHour: '',
            monthMin: '',

            groupList: [],
            hostlist: [],

            name:'',
            remark:'',
        }
        this.handleDayHour = this.handleDayHour.bind(this);
        this.handleDayMin = this.handleDayMin.bind(this);
        this.handleWeekday = this.handleWeekday.bind(this);
        this.handleWeekHour = this.handleWeekHour.bind(this);
        this.handleWeekMin = this.handleWeekMin.bind(this);

        this.handleMonthDay = this.handleMonthDay.bind(this);
        this.handleMonthHour = this.handleMonthHour.bind(this);
        this.handleMonthMin = this.handleMonthMin.bind(this);

        this.handleTaskDelete = this.handleTaskDelete.bind(this);
        this.handleSubmitDay = this.handleSubmitDay.bind(this);
    }

    /*====================== 主机列表的操作（应用/暂停保护） ====================== */

    /**
     *检查是否所有的复选框都被选中。
     *如果全被选中，“全选”的复选框也该被选中;否则，取消被选中
     */
    checkSelectAll(who, e) {
        var checkedNum = $(`.${who} .hostlist-detail .hostlist-hostname .custom-checkbox:checked`).length;
        var allcheckedNum = $(`.${who} .hostlist-detail .hostlist-hostname .custom-checkbox`).length;
        //如果当前点击的复选框是已经被选中的，点击之后被选中的复选框个数-1;否则，+1
        checkedNum += $(e.target).siblings('.custom-checkbox:checked').length ? -1 : 1;
        if (checkedNum == allcheckedNum) {
            $(`.${who}>thead .hostlist-hostname .custom-checkbox`).prop('checked', true)
        } else {
            $(`.${who}>thead .hostlist-hostname .custom-checkbox`).prop('checked', false)
        }
    }

    /**
     * 点击“全选”复选框时的操作
     */
    toggleSelectAll(who) {
        $(`.${who} .hostlist-detail .hostlist-hostname input`).prop('checked', !$(`.${who}>thead .hostlist-hostname input`).prop('checked'))
    }

    /**
     * 恢复所有复选框到未选中状态
     */
    initialAllCheckbox() {
        $('.hostlist-hostname input').prop('checked', false);
    }

    handleShowType(e) {
        this.setState({
            showTypeInput: !this.state.showTypeInput,
        })
        e.stopPropagation();
    }
    handleWriteType(e) {
        this.setState({
            showTypeInput: false,
            setType: $(e.target).text()
        })

    }

    /**
     * 每页显示几条内容
     * @param {*} 所选中的内容 
     */
    onChangeRange(item) {
        if (item == -1) {
            $('.stepGrouplist').hide()
            $('.stepHostlist').show();
        }
        if (item == 0) {
            $('.stepGrouplist').show();
            $('.stepHostlist').hide();
        }
    }
    changeTab(i) {
        if (i == 1) {
            $('.task-step').css("background", "url('/static/img/systemCheck/step1.png')")
        }
        if (i == 2) {
            $('.task-step').css("background", "url('/static/img/systemCheck/step2.png')")
        }
        if (i == 3) {
            $('.task-step').css("background", "url('/static/img/systemCheck/step3.png')")
        }
        this.setState({
            key: i
        })
    }

    handleShowType(e) {
        this.setState({
            showSetdata: !this.state.showSetdata,
        })
        e.stopPropagation();
    }

    handleWriteType(e) {
        this.setState({
            setdata: $(e.target).text()
        })
    }

    handleDayHour(e) {
        this.setState({ dayHour: e.target.value });
    }
    handleDayMin(e) {
        this.setState({ dayMin: e.target.value });
    }
    handleWeekday(e) {
        this.setState({ weekDay: e.target.value });
    }
    handleWeekHour(e) {
        this.setState({ weekHour: e.target.value });
    }
    handleWeekMin(e) {
        this.setState({ weekMin: e.target.value });
    }
    handleMonthDay(e) {
        this.setState({ monthDay: e.target.value });
    }
    handleMonthHour(e) {
        this.setState({ monthHour: e.target.value });
    }
    handleMonthMin(e) {
        this.setState({ monthMin: e.target.value });
    }



    handleSubmitDay(e) {
        e.preventDefault();
        console.log(this.state.performKey)
        if (this.state.performKey == 1) {
            if (!this.state.dayHour.length || !this.state.dayMin.length) {
                return;
            }
            var newItem = {
                dayHour: this.state.dayHour,
                dayMin: this.state.dayMin,
                id: Date.now()
            };
            console.log(newItem)
            this.setState(prevState => ({
                items: prevState.items.concat(newItem),
                dayHour: '',
                dayMin: ''
            }));
        }

        if (this.state.performKey == 2) {
            if (!this.state.weekDay.length || !this.state.weekHour.length || !this.state.weekMin.length) {
                return;
            }
            var newItem = {
                weekDay: this.state.weekDay,
                weekHour: this.state.weekHour,
                weekMin: this.state.weekMin,
                id: Date.now()
            };
            this.setState(prevState => ({
                items: prevState.items.concat(newItem),
                weekDay: '',
                weekHour: '',
                weekMin: '',
            }));
        }
        if (this.state.performKey == 3) {
            if (!this.state.monthDay.length || !this.state.monthHour.length || !this.state.monthMin.length) {
                return;
            }
            var newItem = {
                monthDay: this.state.monthDay,
                monthHour: this.state.monthHour,
                monthMin: this.state.monthMin,
                id: Date.now()
            };
            this.setState(prevState => ({
                items: prevState.items.concat(newItem),
                monthDay: '',
                monthHour: '',
                monthMin: '',
            }));
        }

    }



    /*===================================================== 主机列表的操作 ============================================== */
    /**
     * 获取主机列表的数据，更新state
     */
    getHostList() {
        var self = this;
        $.ajax({
            url: '/api/machinelist/show/',
            type: 'POST',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: {                         //表单数据
                page: 1,        //当前时第几页
                condition: '',    //搜索关键字
                sort: '',           //排序方式
                count: 10000,   //每页最多条数
            },
            cache: false,                   //不会从浏览器缓存中加载请求信息
            traditional: true,          //阻止JQuery深度序列化对象
            success: function (result) {
                if (result) {
                    self.setState({
                        hostlist: result.data,
                    })
                }
            },
        })
    }

    getAllGroup() {
        var self = this;
        var data = {
            keyword: '',
            type: 2,
            count: 100000,   //每页最多条数
            num: 1,
        }
        $.ajax({
            url: '/api/machinelist/get_all_group/',
            type: 'post',                   //POST方式时,表单数据作为HTTP消息的实体内容发送给Web服务器
            dataType: 'json',               //GET方式时,表单数据被转换成请求格式作为URL地址的参数进行传递
            data: data,
            success: function (result) {
                if (result.code == 200) {
                    self.setState({     //显示提示消息
                        groupList: result.groups,
                    });
                }
            }
        })
    }
    componentWillMount() {
        if (this.props.type == 'plus') {
            this.setState({
                typeText: '新建'
            })
        }
        if (this.props.type == 'updata') {
            this.setState({
                typeText: '编辑'
            })
        }

        this.getHostList();
        this.getAllGroup();
    }

    onChangeRangeStep2(item) {
        this.setState({
            performKey: item,
            items: []
        })
    }

    handleTaskDelete(id) {
        let items = this.state.items
        items = items.filter(i => i.id !== id)
        this.setState({ items })
    }




    // var self = this;
    // var second_one = $("#second_one").is(':checked');
    // var second_two = $("#second_two").is(':checked');
    // var second_three = $("#second_third").is(':checked');
    // var second_four = $("#second_four").is(':checked');
    // var second_five = $("#second_five").is(':checked');
    // var second_six = $("#second_six").is(':checked');
    // var second_seven = $("#second_seven").is(':checked');
    // var second_eight = $("#second_eight").is(':checked');
    // var second_ninth = $("#second_ninth").is(':checked');
    // var second_ten = $("#second_ten").is(':checked');
    // var third_one = $("#third_one").is(':checked');
    // var third_two = $("#third_two").val();
    // var scanPath = $('.scanPath').val()
    // //打包成json格式
    // var msg = {
    //     host_ip: "127.0.0.1",
    //     config: {
    //         pe: second_one,
    //         elf: second_two,
    //         ole2: second_three,
    //         pdf: second_four,
    //         swf: second_five,
    //         html: second_six,
    //         xmldocs: second_seven,
    //         hwp3: second_eight,
    //         archive: second_ninth,
    //         mail: second_ten,
    //         setup_update: third_one,
    //         per_frequency: third_two,
    //         scanPath: scanPath
    //     }
    // };
    render() {
        var searchRange = [{
            name: "主机列表",   //显示在列表中的项
            value: -1      //选中时传递的值
        }, {
            name: "主机组",
            value: 0
        }];

        var searchRange2 = [{
            name: "每日",   //显示在列表中的项
            value: 1      //选中时传递的值
        }, {
            name: "每周",
            value: 2
        }, {
            name: "每月",
            value: 3
        }];
        return (
            <Modal id="addtaskPlan" show={this.props.show}
                onHide={this.props.hide}>
                <Modal.Header closeButton>
                    <Modal.Title >{this.state.typeText}任务计划配置</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ul className='task-step clearfix'>
                        <li onClick={() => this.changeTab(1)}> </li>
                        <li onClick={() => this.changeTab(2)}> </li>
                        <li onClick={() => this.changeTab(3)}>  </li>
                    </ul>

                    <div className='step-content clearfix'>
                        {this.state.key == 1 &&
                            <div className='active clearfix'>
                                <div className="slcGroup clearfix" >
                                    <DropdownList
                                        listID="step1Drop"
                                        itemsToSelect={searchRange}
                                        itemDefault={searchRange[0]}
                                        onSelect={(item) => this.onChangeRange(item)}
                                    />
                                </div>

                                {/*主机列表的表格*/}
                                <div className='protectControl-content stepHostlist'>
                                    <table className="hostlist-table">
                                        <thead>
                                            <tr>
                                                <th className="hostlist-hostname">
                                                    <input type="checkbox" id="stepHostlist-all" className="custom-checkbox"  ></input>
                                                    <label htmlFor="stepHostlist-all" onClick={this.toggleSelectAll.bind(this, 'stepHostlist')}></label>{/*自定义的复选框样式*/}
                                                    主机别名
                                                </th>
                                                <th className="hostlist-hostip">备注</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {this.state.hostlist && this.state.hostlist.map(function (i, index) {
                                                return (
                                                    <tr className="hostlist-detail" key={index}>
                                                        <td className="hostlist-hostname">
                                                            <input type="checkbox" id={"stepHostlist-" + index} title={i.hostip} className="custom-checkbox"></input>
                                                            <label htmlFor={"stepHostlist-" + index} onClick={this.checkSelectAll.bind(self, 'stepHostlist')}></label>{/*自定义的复选框样式*/}
                                                            {i.hostname}
                                                        </td>
                                                        <td className="hostlist-remark">{i.remark}</td>
                                                    </tr>
                                                )
                                            }.bind(this))
                                            }
                                            {
                                                !this.state.hostlist.length && <tr className="hostlist-detail" style={{ width: '100%', height: '40px', lineHeight: '40px', background: 'transparent', border: 'none', }}><td style={{ paddingLeft: '20px', width: '100%' }}>当前没有匹配的数据。</td></tr>
                                            }
                                        </tbody>
                                    </table>
                                </div>

                                {/*主机列表的表格*/}
                                <div className='protectControl-content stepGrouplist' style={{ display: 'none' }}>
                                    <table className="hostlist-table">
                                        <thead>
                                            <tr>
                                                <th className="hostlist-hostname">
                                                    <input type="checkbox" id="stepGrouplist-all" className="custom-checkbox"  ></input>
                                                    <label htmlFor="stepGrouplist-all" onClick={this.toggleSelectAll.bind(this, 'stepGrouplist')}></label>{/*自定义的复选框样式*/}
                                                    组名称
                                                </th>
                                                <th className="hostlist-hostip">备注</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {this.state.groupList && this.state.groupList.map(function (i, index) {
                                                return (
                                                    <tr className="hostlist-detail" key={index}>
                                                        <td className="hostlist-hostname">
                                                            <input type="checkbox" id={"stepGrouplist-" + index} title={i.hostip} className="custom-checkbox"></input>
                                                            <label htmlFor={"stepGrouplist-" + index} onClick={this.checkSelectAll.bind(self, 'stepGrouplist')}></label>{/*自定义的复选框样式*/}
                                                            {i.name}
                                                        </td>
                                                        <td className="hostlist-remark">{i.remark}</td>
                                                    </tr>
                                                )
                                            }.bind(this))
                                            }
                                            {
                                                !this.state.groupList.length && <tr className="hostlist-detail" style={{ width: '100%', height: '40px', lineHeight: '40px', background: 'transparent', border: 'none', }}><td style={{ paddingLeft: '20px', width: '100%' }}>当前没有匹配的数据。</td></tr>
                                            }
                                        </tbody>
                                    </table>
                                </div>

                                <div className='step-footer'>
                                    <Button className="btn btn-xs btn-primary" onClick={() => this.changeTab(2)} >下一步</Button>
                                    <Button className="btn btn-xs  btn-default" style={{ margin: '0', position: 'absolute', left: '0' }} onClick={this.props.hide} >取消</Button>
                                </div>
                            </div>
                        }

                        {this.state.key == 2 &&
                            <div className='active clearfix'>
                                <div className="slcGroup clearfix" >
                                    <DropdownList
                                        listID="step2Drop"
                                        itemsToSelect={searchRange2}
                                        itemDefault={searchRange2[0]}
                                        onSelect={(item) => this.onChangeRangeStep2(item)}
                                    />
                                </div>

                                <div className='performlist'>
                                    {this.state.performKey == 1 &&
                                        <div className='perfrom-day'>
                                            <div className='perfrom-title'>
                                                当日执行时间

                                                <button onClick={() => $('.perfrom-plus-template1').toggle()} style={{ float: 'right', width: '18px', height: '18px', backgroundColor: '#DAE1E9' }}>
                                                    <i className="fa fa-plus" style={{ color: '#000' }} aria-hidden="true"></i>
                                                </button>
                                            </div>

                                            <div className='perfrom-content'>
                                                <TodoList items={this.state.items} deleteTask={this.handleTaskDelete} performKey={this.state.performKey} />
                                                <form onSubmit={this.handleSubmitDay} className='perfrom-plus-template1'>
                                                    <div className='perform-plus-item'>
                                                        <input
                                                            onChange={this.handleDayHour}
                                                            value={this.state.dayHour}
                                                        />
                                                        <span>时</span>
                                                        <input
                                                            onChange={this.handleDayMin}
                                                            value={this.state.dayMin}
                                                        />
                                                        <span>分</span>
                                                        <button>
                                                            <i className="fa fa-plus" aria-hidden="true"></i>
                                                        </button>
                                                    </div>

                                                </form>
                                            </div>
                                        </div>
                                    }

                                    {this.state.performKey == 2 &&
                                        <div className='perfrom-day'>
                                            <div className='perfrom-title'>
                                                当周执行时间
                                                <button onClick={() => $('.perfrom-plus-template2').toggle()} style={{ float: 'right', width: '18px', height: '18px', backgroundColor: '#DAE1E9' }}>
                                                    <i className="fa fa-plus" style={{ color: '#000' }} aria-hidden="true"></i>
                                                </button>
                                            </div>

                                            <div className='perfrom-content'>
                                                <TodoList items={this.state.items} performKey={this.state.performKey} />
                                                <form onSubmit={this.handleSubmitDay} className='perfrom-plus-template2'>

                                                    <div className='perform-plus-item'>
                                                        <span>周</span>
                                                        <input
                                                            onChange={this.handleWeekday}
                                                            value={this.state.weekDay}
                                                        />
                                                        <input
                                                            onChange={this.handleWeekHour}
                                                            value={this.state.weekHour}
                                                        />
                                                        <span>时</span>
                                                        <input
                                                            onChange={this.handleWeekMin}
                                                            value={this.state.weekMin}
                                                        />
                                                        <span>分</span>
                                                        <button>
                                                            <i className="fa fa-plus" aria-hidden="true"></i>
                                                        </button>
                                                    </div>

                                                </form>
                                            </div>
                                        </div>
                                    }
                                    {this.state.performKey == 3 &&
                                        <div className='perfrom-day'>
                                            <div className='perfrom-title'>
                                                当月执行时间
                                                <button onClick={() => $('.perfrom-plus-template3').toggle()} style={{ float: 'right', width: '18px', height: '18px', backgroundColor: '#DAE1E9' }}>
                                                    <i className="fa fa-plus" style={{ color: '#000' }} aria-hidden="true"></i>
                                                </button>
                                            </div>

                                            <div className='perfrom-content'>
                                                <TodoList items={this.state.items} performKey={this.state.performKey} />
                                                <form onSubmit={this.handleSubmitDay} className='perfrom-plus-template3'>

                                                    <div className='perform-plus-item'>
                                                        <input
                                                            onChange={this.handleMonthDay}
                                                            value={this.state.monthDay}
                                                        />
                                                        <span>日</span>
                                                        <input
                                                            onChange={this.handleMonthHour}
                                                            value={this.state.monthHour}
                                                        />
                                                        <span>时</span>
                                                        <input
                                                            onChange={this.handleMonthMin}
                                                            value={this.state.monthMin}
                                                        />
                                                        <span>分</span>
                                                        <button>
                                                            <i className="fa fa-plus" aria-hidden="true"></i>
                                                        </button>
                                                    </div>

                                                </form>
                                            </div>
                                        </div>
                                    }
                                </div>


                                <div className='step-footer'>
                                    <Button className="btn btn-xs btn-primary" onClick={() => this.changeTab(1)}  >下一步</Button>
                                    <Button className="btn btn-xs  btn-default" onClick={() => this.changeTab(3)} >上一步</Button>
                                    <Button className="btn btn-xs  btn-default" style={{ margin: '0', position: 'absolute', left: '0' }} onClick={this.props.hide} >取消</Button>
                                </div>
                            </div>
                        }

                        {this.state.key == 3 &&
                            <div>
                                <div className='task-file'>
                                    <p>任务名称</p>
                                    <div className='line'>
                                    </div>
                                    <input type="text" className="form-control  task-file-name" value={this.state.name} onChange={(e) => this.setState({ name: e.target.value })} />
                                   
                                    <p>备注</p>
                                    <div className='line'>
                                    </div>
                                    <textarea type="text" className="form-control task-file-remark" value={this.state.remark} onChange={(e) => this.setState({ remark: e.target.value })}/>
                                    <p>不需要扫描的文件格式</p>
                                    <div className='line'>
                                    </div>

                                    <div className="noScanList clearfix">
                                        <div className="noScanList-item">
                                            <input type="checkbox" id="second_one" className="custom-checkbox"></input>
                                            <label htmlFor="second_one"></label>pe
                                        </div>
                                        <div className="noScanList-item">
                                            <input type="checkbox" id="second_two" className="custom-checkbox"></input>
                                            <label htmlFor="second_two"></label>elf
                                     </div>
                                        <div className="noScanList-item">
                                            <input type="checkbox" id="second_three" className="custom-checkbox"></input>
                                            <label htmlFor="second_three"></label>ole2
                                        </div>
                                        <div className="noScanList-item">
                                            <input type="checkbox" id="second_four" className="custom-checkbox"></input>
                                            <label htmlFor="second_four"></label>mail
                                            </div>
                                        <div className="noScanList-item">
                                            <input type="checkbox" id="second_five" className="custom-checkbox"></input>
                                            <label htmlFor="second_five"></label>pdf
                                         </div>
                                        <div className="noScanList-item">
                                            <input type="checkbox" id="second_six" className="custom-checkbox"></input>
                                            <label htmlFor="second_six"></label>swf
                                          </div>
                                        <div className="noScanList-item">
                                            <input type="checkbox" id="second_seven" className="custom-checkbox"></input>
                                            <label htmlFor="second_seven"></label>html
                                        </div>
                                        <div className="noScanList-item">
                                            <input type="checkbox" id="second_eight" className="custom-checkbox"></input>
                                            <label htmlFor="second_eight"></label>xmldocs
                                           </div>
                                        <div className="noScanList-item">
                                            <input type="checkbox" id="second_ninth" className="custom-checkbox"></input>
                                            <label htmlFor="second_ninth"></label>hwp3
                                      </div>
                                        <div className="noScanList-item">
                                            <input type="checkbox" id="second_ten" className="custom-checkbox"></input>
                                            <label htmlFor="second_ten"></label>archive
                                         </div>
                                    </div>
                                    <p>扫描路径设置</p>
                                    <div className='line'>
                                    </div>
                                    <input type="text" className="form-control scanPath" />
                                </div>

                                <div className='step-footer'>
                                    <Button className="btn btn-xs btn-primary" >完成</Button>
                                    <Button className="btn btn-xs  btn-default" onClick={() => this.changeTab(2)}  >上一步</Button>
                                    <Button className="btn btn-xs  btn-default" style={{ margin: '0', position: 'absolute', left: '0' }} onClick={this.props.hide} >取消</Button>
                                </div>
                            </div>
                        }

                    </div>
                </Modal.Body>
            </Modal>
        )
    }
}




class TodoList extends React.Component {
    constructor(props) {
        super(props)
        this.deleteTask = this.deleteTask.bind(this)

    }

    deleteTask(id) {
        this.props.deleteTask(id)
    }

    render() {
        var taskList;
        if (this.props.performKey == 1) {
            taskList = this.props.items.map(item =>
                <div key={item.id} className='perform-plus-item'>
                    <input value={item.dayHour} />

                    <span>时</span>
                    <input value={item.dayMin} />
                    <span>分</span>

                    <button onClick={this.deleteTask.bind(this, item.id)}>
                        <i className="fa fa-trash" aria-hidden="true"></i>
                    </button>
                </div>)
        }
        if (this.props.performKey == 2) {
            taskList = this.props.items.map(item =>
                <div key={item.id} className='perform-plus-item'>
                    <span>周</span>
                    <input value={item.weekDay} />
                    <input value={item.weekHour} />
                    <span>时</span>
                    <input value={item.weekMin} />
                    <span>分</span>

                    <button onClick={this.deleteTask.bind(this, item.id)}>
                        <i className="fa fa-trash" aria-hidden="true"></i>
                    </button>
                </div>
            )
        }
        if (this.props.performKey == 3) {
            taskList = this.props.items.map(item =>
                <div key={item.id} className='perform-plus-item'>
                    <input value={item.monthDay} />
                    <span>日</span>
                    <input value={item.monthHour} />
                    <span>时</span>
                    <input value={item.monthMin} />
                    <span>分</span>

                    <button onClick={this.deleteTask.bind(this, item.id)}>
                        <i className="fa fa-trash" aria-hidden="true"></i>
                    </button>
                </div>
            )
        }

        return (
            <div className='step2Item'>
                {taskList}
            </div>
        );
    }
}