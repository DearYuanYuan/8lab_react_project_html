
import React from "react"                            //引入react



// 向外暴露Loading模块
export  default  class Loading  extends  React.Component{

    constructor(props){
        super(props);
    }


    render(){
        return(
            <section className="spinner">
                <div className="spinner-container container1">
                    <div className="circle1">&nbsp;</div>
                    <div className="circle2">&nbsp;</div>
                    <div className="circle3">&nbsp;</div>
                    <div className="circle4">&nbsp;</div>
                </div>
                <div className="spinner-container container2">
                    <div className="circle1">&nbsp;</div>
                    <div className="circle2">&nbsp;</div>
                    <div className="circle3">&nbsp;</div>
                    <div className="circle4">&nbsp;</div>
                </div>
                <div className="spinner-container container3">
                    <div className="circle1">&nbsp;</div>
                    <div className="circle2">&nbsp;</div>
                    <div className="circle3">&nbsp;</div>
                    <div className="circle4">&nbsp;</div>
                </div>
            </section>
        )
    }
}