import React from "react"
import $ from "jquery";
import {Col, Row, Panel, Button, Media, Modal} from 'react-bootstrap';   //引入 react-bootstrap中的组件

/*插件页面*/
export default class Plugin extends React.Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.handleClickAll = this.handleClickAll.bind(this);
        this.state = {
            showModal: false, /* 用于控制弹出页 */
            showMap:false,
            imgSelect:false
            // world:false,
            // china:true,
        }
    }

    /**
     * 控制弹出页 
     */
    changeModal() {
        this.setState({
            showModal: !this.state.showModal
        });
    }

    /**
     * 列表中左侧复选框被点击时的操作
     * @param {*} event 事件
     */
    handleClick(event){
        if($(event.target).is('.plugLeftSelected')){    //如果当前点击的项已经被选中
            $(event.target).removeClass('plugLeftSelected')     //清除被选中的状态
             this.setState({
                imgSelect: false
            });
            $('.plugSelectAll').removeClass('plugLeftSelected') //取消‘全选’
        }else{  //如果当前点击的项未被选中
            $(event.target).addClass('plugLeftSelected')
        }
    }

    /**
     * 点击‘全选’复选框时的操作
     */
    handleClickAll(){
        this.setState({
            imgSelect: !this.state.imgSelect
        });
        if(!this.state.imgSelect){
            $('.plugLeftSelect').addClass('plugLeftSelected')
        }else{
            $('.plugLeftSelect').removeClass('plugLeftSelected')
        }
        
    }

    /**
     * 组件已经加载时的操作
     */
    componentDidMount(){
        //修改页面title
        document.title = '插件管理'
        var self=this
        $('.puglin-close-set').click(function(){
            // $(this).toggleClass('puglin-open-set')
            self.changeModal()
        })
    }

    render() {
        return (
            <div className="home-main">
                {/*<DMapModal  showMap={this.state.showMap}/>
                <br/>
                <hr/>
                <Row className="plugRow">
                    
                    <Col sm={6}>
                        <Col sm={4}   className="imgmargin"  >
                            <img      src="/static/img/kexinfenxi.png"  alt="Image"/>
                            <span style={{"position":"absolute","top":"120px", "left":"50px"}}>可信分析插件</span>
                        </Col>
                        <Col sm={4}   className="imgmargin">
                            <img       src="/static/img/kexinshujuku.png" alt="Image"/>
                            <span style={{"position":"absolute","top":"120px", "left":"50px"}}>数据库控制插件</span>
                        </Col>
                    </Col>
                </Row>
                <br/>
                <hr/>
                */}
                <Row className="plugRow pluginContainer">
                    <div className="topPluginAction">
                        <h2>插件管理</h2>
                        <button className="btnColor btn btn-default plugAction" id="removeAll" onClick={this.changeModal.bind(this)}>安装</button>
                        <button className="btnColor btn btn-default plugAction" id="installAll" onClick={this.changeModal.bind(this)}>卸载</button>
                        <div className="searchPlugin">
                            <input type="text" placeholder="请输入您需要查找的插件"/>
                            <button className="searchGo plugAction" onClick={this.changeModal.bind(this)}>搜索</button>
                        </div>
                    </div>
                    <div className="pluginContent clearfix">
                    <Col sm={12} style={{   border: "1px solid #444851", borderRadius: "4px"}}>
                        <Panel className="panel panelTitle">
                            <Media>
                                <Media.Left>
                                    <div className="select-this"> 
                                         {/* <button  onClick={this.handleClickAll} id="" className="plugLeftSelect plugSelectAll"></button> */}
                                         <button onClick={this.changeModal.bind(this)} id="" className="plugLeftSelect plugSelectAll"></button>
                                    </div>                                   
                                </Media.Left>
                                <Media.Body>
                                    <Row className="plugRow">
                                        <Col sm={6} >
                                            <p  className="pluginfont" style={{textAlign:"left"}}>插件名称</p>
                                        </Col> 
                                        <Col sm={2}>
                                            <p  className="pluginfont">
                                                大小
                                            </p>
                                        </Col>
                                        <Col sm={2}  className="">
                                            <p  className="pluginfont">
                                                激活
                                            </p>
                                        </Col>
                                        <Col sm={2}>
                                            <p  className="pluginfont">安装或卸载</p>
                                        </Col>
                                    </Row>
                                </Media.Body>
                            </Media>
                        </Panel>
                        <Panel className="panel panelodd">
                            <Media>
                                <Media.Left>
                                    <div className="select-this"> 
                                         {/* <button  onClick={this.handleClick}   id="" className="plugLeftSelect" ></button> */}
                                         <button  onClick={this.changeModal.bind(this)}   id="" className="plugLeftSelect" ></button>                                         
                                    </div> 
                                    <img   src="/static/img/plugins/defence.png" alt="可信防护" />
                                </Media.Left>
                                <Media.Body>
                                    <Media.Heading>
                                        <Row className="plugRow">
                                            <Col sm={6}>
                                                <p>可信防护</p>
                                            </Col>
                                        </Row>
                                    </Media.Heading>
                                    <Row className="plugRow">
                                        <Col sm={6} >
                                            <p className="plugFont">具备基于可信计算的主机防护功能，实现对用户关键系统非白名单恶意程序的加载、篡改行为发现。能防止APT、未知木马等
                                            恶意程序的长期潜伏渗透与突发性攻击发现。</p>
                                        </Col>
                                        <Col sm={2}>
                                            <p  className="pluginfont plugFont">34.8M</p>
                                        </Col>
                                        <Col sm={2}  className="btnPst">

                                             <img className="puglin-close-set" src="/static/img/plugins/switch_off.png"></img>
                                        </Col>
                                        <Col sm={2} className="btnUninstall">
                                            <button className="plugAction uninstallPlugin" onClick={this.changeModal.bind(this)}>安装</button>
                                        </Col>
                                    </Row>
                                </Media.Body>
                            </Media>
                        </Panel>
                        <Panel className="panel paneleven">
                            <Media>
                                <Media.Left>
                                    <div className="select-this"> 
                                         {/* <button  onClick={this.handleClick}   id="" className="plugLeftSelect"></button> */}
                                         <button onClick={this.changeModal.bind(this)}  id="" className="plugLeftSelect"></button>
                                    </div> 
                                    <img   src="/static/img/plugins/globle.png" alt="全球态势感知" />
                                </Media.Left>
                                <Media.Body>
                                    <Media.Heading>
                                        <Row className="plugRow">
                                            <Col sm={6}>
                                                <p>全球态势感知</p>
                                            </Col>
                                        </Row>
                                    </Media.Heading>
                                    <Row className="plugRow">
                                        <Col sm={6} >
                                            <p className="plugFont">为用户提供全球安全态势感知功能，对于用户当前系统相关联的网络环境进行安全态势预报和感知，方便安全策略决策。对于
                                            用户关键系统的攻击提供2D/3D追溯，精确到物理街道级定位。</p>
                                        </Col>
                                        <Col sm={2}>
                                            <p  className="pluginfont plugFont">23.6M</p>
                                        </Col>
                                        <Col sm={2}  className="btnPst">

                                             <img className="puglin-close-set" src="/static/img/plugins/switch_off.png"></img>
                                        </Col>
                                        <Col sm={2} className="btnUninstall">
                                            <button className="plugAction uninstallPlugin" onClick={this.changeModal.bind(this)}>安装</button>
                                        </Col>
                                    </Row>
                                </Media.Body>
                            </Media>
                        </Panel>
                        <Panel className="panel panelodd">
                            <Media>
                                <Media.Left>
                                    <div className="select-this"> 
                                         {/* <button  onClick={this.handleClick}   id="" className="plugLeftSelect"></button> */}
                                         <button onClick={this.changeModal.bind(this)}  id="" className="plugLeftSelect"></button>
                                    </div> 
                                    <img   src="/static/img/plugins/blockchain.png" alt="区块链服务" />
                                </Media.Left>
                                <Media.Body>
                                    <Media.Heading>
                                        <Row className="plugRow">
                                            <Col sm={6}>
                                                <p>区块链服务</p>
                                            </Col>
                                        </Row>
                                    </Media.Heading>
                                    <Row className="plugRow">
                                        <Col sm={6} >
                                            <p className="plugFont">为用户提供基于区块链的安全服务，包括可利用区块链进行存证、防篡改、代码仓库管理。能保证用户不会因为误操作或者黑客攻击
                                            对关键数据造成无法挽救的数据破坏。</p>
                                        </Col>
                                        <Col sm={2}>
                                            <p  className="pluginfont plugFont">33.5M</p>
                                        </Col>
                                        <Col sm={2}  className="btnPst">

                                             <img className="puglin-close-set" src="/static/img/plugins/switch_off.png"></img>
                                        </Col>
                                        <Col sm={2} className="btnUninstall">
                                            <button className="plugAction uninstallPlugin" onClick={this.changeModal.bind(this)}>安装</button>
                                        </Col>
                                    </Row>
                                </Media.Body>
                            </Media>
                        </Panel>
                        <Panel className="panel paneleven">
                            <Media>
                                <Media.Left>
                                    <div className="select-this"> 
                                         {/* <button  onClick={this.handleClick}   id="" className="plugLeftSelect"></button> */}
                                         <button onClick={this.changeModal.bind(this)}  id="" className="plugLeftSelect"></button>
                                    </div> 
                                    <img   src="/static/img/plugins/honeypot.png" alt="蜜罐网" />
                                </Media.Left>
                                <Media.Body>
                                    <Media.Heading>
                                        <Row className="plugRow">
                                            <Col sm={6}>
                                                <p>蜜罐网</p>
                                            </Col>
                                        </Row>
                                    </Media.Heading>
                                    <Row className="plugRow">
                                        <Col sm={6} >
                                            <p className="plugFont">为用户提供智能蜜网的服务，能实现在用户关键系统的被攻击路径上设置对应的智能蜜罐网陷阱，一旦有黑客想对用户
                                            关键系统进行攻击或者渗透，触碰到蜜罐网的陷阱后会立刻被发现。</p>
                                        </Col>
                                        <Col sm={2}>
                                            <p  className="pluginfont plugFont">58M</p>
                                        </Col>
                                        <Col sm={2}  className="btnPst">

                                             <img className="puglin-close-set" src="/static/img/plugins/switch_off.png"></img>
                                        </Col>
                                        <Col sm={2} className="btnUninstall">
                                            <button className="plugAction uninstallPlugin" onClick={this.changeModal.bind(this)}>安装</button>
                                        </Col>
                                    </Row>
                                </Media.Body>
                            </Media>
                        </Panel>
                         <Panel className="panel panelodd">
                            <Media>
                                <Media.Left>
                                    <div className="select-this"> 
                                         {/* <button  onClick={this.handleClick}   id="" className="plugLeftSelect"></button> */}
                                         <button onClick={this.changeModal.bind(this)}  id="" className="plugLeftSelect"></button>
                                    </div> 
                                    <img   src="/static/img/plugins/datacenter.png" alt="信息中心" />
                                </Media.Left>
                                <Media.Body>
                                    <Media.Heading>
                                        <Row className="plugRow">
                                            <Col sm={6}>
                                                <p>信息中心</p>
                                            </Col>
                                        </Row>
                                    </Media.Heading>
                                    <Row className="plugRow">
                                        <Col sm={6} >
                                            <p className="plugFont">为用户提供基于大数据平台的日志分析和统计功能，方便用户对海量系统日志信息进行安全分析，并能根据自己的要求进行
                                            监控系统的DIY。对于系统中关键安全日志信息进行快速索引查询等功能。</p>
                                        </Col>
                                        <Col sm={2}>
                                            <p  className="pluginfont plugFont">88.2M</p>
                                        </Col>
                                        <Col sm={2}  className="btnPst">

                                        <img className="puglin-close-set" src="/static/img/plugins/switch_off.png"></img>
                                        </Col>
                                        <Col sm={2} className="btnUninstall">
                                            <button className="plugAction uninstallPlugin" onClick={this.changeModal.bind(this)}>安装</button>
                                        </Col>
                                    </Row>
                                </Media.Body>
                            </Media>
                        </Panel>
                        <Panel className="panel paneleven">
                            <Media>
                                <Media.Left>
                                    <div className="select-this"> 
                                         {/* <button  onClick={this.handleClick}   id="" className="plugLeftSelect"></button> */}
                                         <button onClick={this.changeModal.bind(this)}  id="" className="plugLeftSelect"></button>
                                    </div> 
                                    <img   src="/static/img/plugins/firewall.png" alt="防火墙" />
                                </Media.Left>
                                <Media.Body>
                                    <Media.Heading>
                                        <Row className="plugRow">
                                            <Col sm={6}>
                                                <p>防火墙</p>
                                            </Col>
                                        </Row>
                                    </Media.Heading>
                                    <Row className="plugRow">
                                        <Col sm={6} >
                                            <p className="plugFont">为用户的关键系统提供传统基础安全防护功能，为用户关键系统提供IPS\IDS\WAF防火墙，能对常规已知的黑客攻击手段起到
                                            90%以上的防护效果。</p>
                                        </Col>
                                        <Col sm={2}>
                                            <p  className="pluginfont plugFont">45M</p>
                                        </Col>
                                        <Col sm={2}  className="btnPst">

                                         <img className="puglin-close-set" src="/static/img/plugins/switch_off.png"></img>
                                        </Col>
                                        <Col sm={2} className="btnUninstall">
                                            <button className="plugAction uninstallPlugin" onClick={this.changeModal.bind(this)}>安装</button>
                                        </Col>
                                    </Row>
                                </Media.Body>
                            </Media>
                        </Panel>
                    </Col>
                    </div>
                </Row>
                <Modal bsSize="small" aria-labelledby="contained-modal-title-sm" show={this.state.showModal}
                       onHide={this.changeModal.bind(this)}>
                    <Modal.Header closeButton>
                        <Modal.Title id="contained-modal-title-sm">温馨提示</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>试用版不支持插件控制，如需专业服务，请联系info@8lab.cn。</p>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button className="btn btn-xs btn-primary" onClick={this.changeModal.bind(this)}>确认</Button>
                    </Modal.Footer>
                </Modal> 
            </div>
        )
    }
}






