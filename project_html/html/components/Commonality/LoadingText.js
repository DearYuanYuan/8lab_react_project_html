
import React from "react"                            //引入react

// 向外暴露Loading模块
export  default  class LoadingText  extends  React.Component{

    constructor(props){
        super(props);
    }

    render(){
        return(
            <div className="loadingText" style={{width:'100%'}}>
                <i className="fa fa-spinner fa-spin fa-4x" style={{color:'#007AE1'}}></i>
            </div>

        )
    }
}