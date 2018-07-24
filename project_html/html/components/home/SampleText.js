import React from "react";    //react


//福州数据库可信指数项
//this.props.text : 数据库可信指数项的文本
//this.props.score : 数据库可信指数项的文本对应分数
export default class SampleText extends React.Component {
    constructor(props) {
        super(props);
    }
    //渲染函数
    render() {
        return (
            <div className="sampleItem" >
                <span> {this.props.text} </span>
                <i></i>
                <span className="itemScore"> {this.props.score}</span>
            </div>
        )
    }
}




