import React from "react";
export default class TamperLoading extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    };

    componentWillMount() {
    }
    render() {
        return (
            <div className="tamperLoadingBox">
                <i className="fa fa-spinner fa-spin fa-4x"></i>
            </div>
        )
    }
}