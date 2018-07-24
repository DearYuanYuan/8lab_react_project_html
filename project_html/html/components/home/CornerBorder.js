import React from "react"
import Radarchart from "../wafWall/Radarchart";

/**
 * 四角边框共用组件
 */
export default class CornerBorder extends React.Component {
    constructor(props) {
        super(props);
    }
    render(){
        return(
            <div>
                <span className="corner-border corner-left-top">
                </span>
                <span className="corner-border corner-right-top">
                </span>
                <span className="corner-border corner-right-bottom">
                </span>
                <span className="corner-border corner-left-bottom">
                </span>
            </div>
        )
    }
}

