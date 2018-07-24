import React from "react";
export default class TamperLoading extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    };

    render() {
        return (
            <div className="tamperLoadingBox">
                <i className="fa fa-spinner fa-spin fa-4x"></i>
                <div className="ajax-progress-box">
                    <div className="ajax-progress" style={{width:this.props.progressTime+'%'}}></div>
                </div>
            </div>
        )
    }
}