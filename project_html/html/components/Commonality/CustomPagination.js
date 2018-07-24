import React from "react"
import $ from "jquery";
import { Pagination, } from 'react-bootstrap';
import DropdownList from "../Commonality/DropdownList";     //下拉列表的组件

/*向外暴露分页组件.
----
使用示例:
<CustomPagination
    from={(this.currentPage-1)*this.state.rowsPerPage}
    to={this.currentPage*this.state.rowsPerPage}
    totalItemsCount={this.state.totalItemsCount}
    totalPagesCount={this.state.pageCount}
    currentPage={this.currentPage}
    onChangeRowsPerPage={(num)=>this.setRowsPerPage(num)}
    onSelectPage={(e)=>this.handleSelectPage(e)}
    onChangePageInput={(e)=>this.onChangeInputPage(e)}
    onPageInputKeyDown={(e)=>this.jumpPageKeyDown(e)}
    onClickJumpButton={()=>this.handleJumpPage()}
    pageNumInputId="logsPage"
    dropdownListId="rowsPerPageList"
/>

参数解释：
- from： 当前页面显示的起始条目在所有数据中的索引，从1开始
- to： 当前页面显示的末尾条目在所有数据中的索引，最大为总条目数
- totalItemsCount： 总条目数
- totalPagesCount： 总页数
- currentPage： 当前页码
- onChangeRowsPerPage： 改变每页显示多少条数时的操作
- onSelectPage： 点击分页器进行翻页时的操作
- onChangePageInput： 编辑页码输入框中的内容时的操作
- onPageInputKeyDown： 在页码输入框中按键时的操作
- onClickJumpButton： 点击跳转按钮时的操作
//可选
- pageNumInputId： 页码输入框的id ，当页面中有多个 CustomPagination 时，需要这个参数
- pageNumInputId： 选择每页最多行数的下拉列表的id ，当页面中有多个 CustomPagination 时，需要这个参数
*/
export default class CustomPagination extends React.Component {
    constructor(props) {
        super(props);
        this.state={
            from:this.props.from || 0,
            to:this.props.to || 0,
            totalItemsCount: this.props.totalItemsCount || 0, 
            totalPagesCount: this.props.totalPagesCount || 0,
            currentPage: this.props.currentPage || 0,
            pageNumInputId: this.props.pageNumInputId || "inputPageNum",
            dropdownListId: this.props.dropdownListId || "rows-per-page-list"
        }
    }

    //当组件将要接收新的props时执行，初始化render时不执行
    componentWillReceiveProps (nextProps) {   
        //如果props发生变化了
        // if(JSON.stringify(this.props.itemsToSelect) != JSON.stringify(nextProps.itemsToSelect) ){
        this.setState({
            from: nextProps.from,
            to: nextProps.to,
            totalItemsCount: nextProps.totalItemsCount, 
            totalPagesCount: nextProps.totalPagesCount,
            currentPage: nextProps.currentPage,
        })                
    }

    render(){
        //此处为了解决在JSX中使用map方法时无法在添加的每个元素中bind事件的问题。
        var rowsPerPageList = [      //控制列表每页显示多少行的下拉列表的选项
            {
                name: '10 项/页',         //显示在下拉列表中
                value: 10      //选中时传递的值
            }, {
                name: '20 项/页',
                value: 20
            }, {
                name: '30 项/页',
                value: 30
            }, {
                name: '40 项/页',
                value: 40
            }, {
                name: '50 项/页',
                value: 50
            }, 
        ]

        return (
            <div className="pagination-all custom-pagination clearfix">
                {/*选择每页显示多少行数据*/}
                <div className="rowsPerPage">
                    <DropdownList
                        listID={this.state.dropdownListId}
                        itemsToSelect={rowsPerPageList}
                        onSelect={(item) => this.props.onChangeRowsPerPage(item)} />
                    <p className='itemsCount'>显示 {this.state.from}-{this.state.to} 项条目，共 {this.state.totalItemsCount} 项条目。</p>
                </div>
                <div className="pagination-right clearfix">
                    <Pagination
                        prev={true}
                        next={true}
                        first={false}
                        last={false}
                        ellipsis={true}
                        boundaryLinks={true}
                        items={this.state.totalPagesCount}
                        maxButtons={7}
                        activePage={this.state.currentPage}
                        onSelect={this.props.onSelectPage.bind(this)} />
                    {/*页码跳转输入框*/}
                    <div className="pageCount">
                        <input
                            className="pageNum"
                            id={this.state.pageNumInputId}
                            placeholder="输入"
                            onChange={this.props.onChangePageInput.bind(this)}
                            onKeyDown={this.props.onPageInputKeyDown.bind(this)}
                        />
                        <span className='totalPages'>/{this.state.totalPagesCount}</span>
                        <input type="button"
                            className="searchNum"
                            onClick={this.props.onClickJumpButton.bind(this)} value="跳转" />
                    </div>
                </div>                            
            </div>
        )
    }
}