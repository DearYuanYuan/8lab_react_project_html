// import React from "react";
// import $ from 'jquery';
// import { Button, Collapse, Well } from 'react-bootstrap'
// export default class BackVersionBox extends React.Component {
//     constructor(props) {
//         super(props);
//         this.state = {
//             treeStructure: [],
//             treeStructureName: ''
//         }
//     };

//     componentWillMount() {
//         var self = this;
//         $.ajax({
//             url: '/api/tamper_proof/get_all_host_path/',
//             dataType: "json",
//             type: "POST",
//             success(data) {
//                 for (var key in data[0].result) {
//                     self.setState({
//                         treeStructureName: key
//                     })
//                 }
//                 self.setState({
//                     treeStructure: data[0].result["octa-tamper-proof"],
//                 })

//             }
//         })
//     }

//     checkSingle(e) {
//         if ($(e.target).hasClass('cancel')) {
//             $(e.target).addClass('slector').removeClass('cancel')
//         } else {
//             $(e.target).addClass('cancel').removeClass('slector')
//         }

//     }
//     componentDidMount() {
//     }
//     render() {
      
//         return (
//             <div className='fileDirectory'>
//                 <div className='colFileDir clearfix'>
//                     <div className='showAllFile' onClick={() => this.setState({ open: !this.state.open })} >
//                     </div>
//                     <i className="fa fa-server" aria-hidden="true"></i>
//                     <div className='fileName'>
//                         {this.state.treeStructureName}
//                     </div>
//                 </div>
//                 <Collapse in={this.state.open}>
//                     <div>
//                         <div className='thead clearfix'>
//                             <div>分配</div>
//                             <div>根目录别名</div>
//                             <div>绝对路径</div>
//                             <div>取消保护</div>
//                         </div>
//                         <div className='line'></div>

//                         <div className='tboady'>
//                             {
//                                 this.state.treeStructure.map(function (name, index) {
//                                     return (
//                                         <div key={index} className='rootSingleRow clearfix'>
//                                             <div className='checkSingle cancel' onClick={(e) => this.checkSingle(e)}>&nbsp;</div>
//                                             <div className='rootAlias' title={name}><i className="fa fa-folder fl" aria-hidden="true"></i>{name}</div>
//                                             <div className='absoluteRoot' title={name}>{name}</div>
//                                             <div className='protectStatus'>取消</div>
//                                         </div>
//                                     )
//                                 }.bind(this))
//                             }
//                         </div>
//                     </div>

//                 </Collapse>
//             </div>
//         )
//     }
// }