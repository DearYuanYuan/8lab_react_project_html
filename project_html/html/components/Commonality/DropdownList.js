import React from "react"
import $ from "jquery";

/*向外暴露下拉列表组件.
----
使用示例:
<DropdownList
listID="id"
itemsToSelect={this.searchTypes}
onSelect={(value) => this.selectItem(value)}
itemDefault={this.searchTypes[1]} />
----
listID 为本组件最外层div的id
----
itemsToSelect 一个数组，表示可供选择的内容。
数组中每个元素为一个对象。
-name 属性:显示在下拉列表中的名称
-value 属性：选中时所传递的值
例如：[{name:'主机名',value:'clientname'},{name:'文件哈希',value:'filedata'},...]
----
onSelect 是父组件传递给 DropdownList 组件的一个方法。
参数为选中的值。
在父组件所传递的方法（示例中的 selectItem 方法）中使用参数进行下一步操作。
----
itemDefault 为默认选中的值所对应的对象。
如不设定则为列表中第一个。
*/
export default class DropdownList extends React.Component {
    constructor(props) {
        super(props);
        this.state={
            itemsToSelect:this.props.itemsToSelect,     //列表
            activeItem:this.props.itemDefault || this.props.itemsToSelect[0],     //当前选中的内容
            showListBlock:false,    //是否显示下拉列表的选项
        }
    }

    //组件加载之后的操作
    componentDidMount() {
        var self = this
        //设置整个页面的点击事件的监听器
        //使得点击下拉列表以外的区域时，下拉列表自动折叠
        $(document).bind('click',function(e){
            if(self.state.showListBlock){ //如果下拉列表已经展开
                var event = e || window.event; //浏览器兼容性 
                var elem = event.target || event.srcElement; 
                while (elem) { //循环判断至跟节点，防止点击的是div子元素 
                    if (elem.id && elem.id==self.props.listID){  //如果点击的是下拉列表区域，退出循环
                        return; 
                    } 
                    elem = elem.parentNode; 
                } 
                self.setState({ //折叠下拉列表
                    showListBlock:false
                })
            }            
        }); 
    }
    
    //当组件将要接收新的props时执行，初始化render时不执行
    componentWillReceiveProps (nextProps) {   
        //如果props发生变化了
        if(JSON.stringify(this.props.itemsToSelect) != JSON.stringify(nextProps.itemsToSelect) ){
            this.setState({
                itemsToSelect:nextProps.itemsToSelect,      //列表
            }) 
        } 
        if(JSON.stringify(this.props.itemDefault) != JSON.stringify(nextProps.itemDefault)){
            this.setState({
                activeItem: nextProps.itemDefault || nextProps.itemsToSelect[0]       //当前选中的内容,不指定则默认为第一项
            })                   
            //如果父组件传的itemDefault值发生变化（可能不是因为控制下拉列表发生的变化），则调用父组件对应的方法，将新的值传递给父组件。
            this.props.onSelect(nextProps.itemDefault.value)   //调用父组件的onSelect方法,并把所选中的值传过去  
        }               
    }

    //改变下拉列表的状态，即显示或隐藏
    changeListState(){
        $('.my-dropdown-list .item-selected').blur()    //禁止输入框获取焦点
        $('.select-img i').toggleClass('fa-angle-down').toggleClass('fa-angle-up')
        this.setState({
            showListBlock:!this.state.showListBlock
        })
    }

    //选择某个选项时的操作
    selectItem(item){
        this.setState({
            activeItem: item            
        })
        this.changeListState() //隐藏下拉选项框 
        this.props.onSelect(item.value)   //调用父组件的onSelect方法,并把所选中的值传过去  
    }


    render(){
        //此处为了解决在JSX中使用map方法时无法在添加的每个元素中bind事件的问题。
        var self = this
        var listToShow = this.state.itemsToSelect && this.state.itemsToSelect.map(function(item,index){
            return (
                <li 
                key={'select-item-'+index}
                className={JSON.stringify(item)==JSON.stringify(self.state.activeItem)?'active':''}
                onClick={self.selectItem.bind(self,item)}
                >
                    <span>{item.name}</span>
                </li>
            )}
        );

        return (
        <div className="my-dropdown-list" id={this.props.listID}>
            <div>
                <div className="select-img" onClick={this.changeListState.bind(this)}><i className="fas fa-angle-down"></i></div>
                <input
                className="item-selected" 
                type="text" 
                readOnly
                value={this.state.activeItem && this.state.activeItem.name} 
                onClick={this.changeListState.bind(this)}
                />
            </div>
            {/*根据 this.state.showListBlock 控制下拉列表选项框的显示与隐藏;如果列表内容为空则始终不显示下拉选项框*/}
            <div className={(this.state.showListBlock && listToShow.length>0)?"list-block":"hide list-block"}>
                <ul>
                    {listToShow}
                </ul>
            </div>
        </div>
        )
    }
}