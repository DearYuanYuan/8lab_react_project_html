import React from "react"
import $ from "jquery";

/*向外暴露开关按钮组件.
----
使用示例:
<ToggleButton 
checkboxID="protectBtn" 
isOn={this.state.isProtectOn} 
handleChange={this.changeProtectState.bind(this)} />
----
属性：
- checkboxID {string}： 此组件中包含的iput[type='checkbox']的id，使用此id获取checkbox节点，进一步获取节点的状态，比如是否选中等。
- isOn {boolean}：按钮开关的状态
- handleChange {function}： 点击按钮时的操作。需要返回一个boolean值，表示是否成功完成操作。成功时按钮开闭状态才会切换。
*/
export default class ToggleButton extends React.Component {
    constructor(props) {
        super(props);
        this.state={
            isOn:this.props.isOn || false, //默认为关闭状态
        }
    }

    /**
     * 组件即将接受新的props时的操作
     * @param  {[type]} nextProps 新的props
     */
    componentWillReceiveProps(nextProps) {
        if(nextProps.isOn != this.props.isOn){  //当父组件改变按钮开关状态时
            this.setState({
                isOn: nextProps.isOn
            })
        }
    }

    /**
     * 开启或关闭按钮时的操作
     */
    onChange(){       
        if(this.props.handleChange()){  //调用父组件的操作
            this.setState({     //改变按钮显示的状态
                isOn: !this.state.isOn
            })
        }     
    }


    render(){
        return (
            <label className="custom-toggle-btn">
                <input id={this.props.checkboxID} type="checkbox" checked={this.state.isOn} onChange={this.onChange.bind(this)}/>
                <span className="slider"></span>
            </label>
        )
    }
}