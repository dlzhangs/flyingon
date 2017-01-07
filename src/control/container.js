

//容器控件片段
$fragment('ContainerFragment', function () {


           
    //控件默认宽度(width === 'default'时的宽度)
    this.defaultWidth = 300;

    //控件默认高度(height === 'default'时的高度)
    this.defaultHeight = 150;
    
    
    
    //允许添加的子控件类型
    this.childControlType = flyingon.Control;
    

    
    function check_control(self, controls, index) {
        
        var type = self.childControlType,
            length = controls.length,
            list,
            parent,
            control;
        
        while (index < length)
        {
            if ((control = controls[index++]) instanceof type)
            {
                if (parent = control.__parent)
                {
                    parent.remove(control, false);
                }

                control.__parent = self;
                (list || (list = [])).push(control);
            }
            else
            {
                return false;
            }
        }
        
        return list;
    };
    
    
    //添加子控件
    this.append = function (control) {

        var list, children;
        
        if (list = check_control(this, arguments, 0))
        {
            children = this.__children || this.children();
            
            if (list[1])
            {
                children.push.apply(children, list);
            }
            else
            {
                children.push(control);
            }
            
            if (this.view)
            {
                this.renderer.append(this, list);
            }
            
            if (this.__arrange_dirty !== 2)
            {
                this.invalidate();
            }
            
            return true;
        }
        
        return false;
    };


    //在指定位置插入子控件
    this.insert = function (index, control) {

        var list, children;
        
        if (list = check_control(this, arguments, 1))
        {
            children = this.__children || this.children();
            
            if (index < 0)
            {
                if ((index += length) < 0)
                {
                    return 0;
                }
            }

            if (index > length)
            {
                index = length;
            }

            if (list[1])
            {
                children.splice.apply(children, [index, 0].concat(list));
            }
            else
            {
                children.splice(index, 0, control);
            }
            
            if (this.view)
            {
                this.renderer.insert(this, index, list);
            }
            
            if (this.__arrange_dirty !== 2)
            {
                this.invalidate();
            }
            
            return true;
        }
        
        return false;
    };
    
    
    function remove(control, index, dispose) {
    
        control.__parent = null;

        if (this.view)
        {
            this.renderer.remove(this, control, index);
        }

        if (this.__arrange_dirty !== 2)
        {
            this.invalidate();
        }

        if (dispose !== false)
        {
            control.dispose();
        }
    };
    
    
    //移除子控件或从父控件中移除
    this.remove = function (control, dispose) {
            
        var children, index;
        
        if (control && (children = this.__children) && (index = children.indexOf(control)) >= 0)
        {
            children.splice(index, 1);
            remove(control, index, dispose);
            
            return true;
        }

        return false;
    };


    //移除指定位置的子控件
    this.removeAt = function (index, dispose) {

        var children, control;

        if ((children = this.__children) && (control = children[index]))
        {       
            children.splice(index, 1);
            remove(control, index, dispose);
            
            return true;
        }

        return false;
    };


    //清除子控件
    this.clear = function (dispose) {
      
        var children = this.__children,
            control,
            length;
        
        if (children && (length = children.length) > 0)
        {
            for (var i = length - 1; i >= 0; i--)
            {
                control = children[i];
                control.__parent = null;
                
                if (dispose !== false)
                {
                    control.dispose();
                }
            }
            
            children.length = 0;
            
            if (this.view)
            {
                this.renderer.clear(this);
            }
            
            if (this.__arrange_dirty !== 2)
            {
                this.invalidate();
            }
            
            return true;
        }
    };
    
        

    //测量自动大小
    this.onmeasure = function (box) {
        
        var autoWidth = box.autoWidth,
            autoHeight = box.autoHeight;
        
        if (autoWidth || autoHeight)
        {
            this.arrange();

            if (autoWidth)
            {
                this.offsetWidth = box.contentWidth + box.border.width;
            }

            if (autoHeight)
            {
                this.offsetHeight = box.contentHeight + box.border.height;
            }
        }
        else
        {
            return false;
        }
    };
    
        
    
    //引入排列功能片段
    //设置子控件需要排列标记
    this.__arrange_dirty = 2;
    
    
    //排列子控件
    this.arrange = function () {

        var box = this.boxModel,
            list,
            items,
            item,
            x, 
            y,
            cache;
        
        if (box)
        {
            //处理自动滚动
            switch (this.overflowX())
            {
                case 'scroll':
                    box.hscroll = true;
                    break;

                case 'auto':
                    x = true;
                    break;
                    
                default:
                    box.hscroll = false;
                    break;
            }

            switch (this.overflowY())
            {
                case 'scroll':
                    box.vscroll = true;
                    break;

                case 'auto':
                    y = true;
                    break;
                    
                default:
                    box.vscroll = false;
                    break;
            }

            list = [];
            items = this.__children;

            //筛选出非隐藏控件
            if (items && (length = items.length) > 0)
            {
                for (var i = 0; i < length; i++)
                {
                    (item = items[i]).__index = i;

                    if ((item.__storage || item.__defaults).visible)
                    {
                        list.push(item);
                    }
                }
            }

            //排列
            flyingon.arrange(this, list, x, y);
            
            //计算出可见控件
            if (length = list.length)
            {
                x = this.offsetWidth;
                y = this.offsetHeight;
                
                this.__visible_list = items = [];
                
                for (var i = 0; i < length; i++)
                {
                    item = list[i];
                    
                    if ((cache = item.offsetLeft) < x 
                        && cache + item.offsetWidth > 0
                        && (cache = item.offsetTop) < y
                        && cache + item.offsetHeight > 0)
                    {
                        items.push(item);
                    }
                }
            }
            else
            {
                this.__visible_list = [];
            }
        }
        
        this.__arrange_dirty = 0;
        return this;
    };
    
    
    //查找拖拉放置目标及位置
    this.findDropTarget = function (x, y) {
        
        var list = this.__visible_list,
            item,
            index,
            length;
        
        if (list && (length = list.length) > 0)
        {
            if (!list.__sort)
            {
                list.__sort = true;
                
                //按照高到宽排序
                list.sort(function (a, b) {

                    return (a.offsetTop + a.offsetHeight << 16)
                        + a.offsetLeft + a.offsetWidth
                        - (b.offsetTop + b.offsetHeight << 16)
                        - b.offsetLeft - b.offsetWidth;
                });
            }
            
            if ((item = this.boxModel) && (item = item.border))
            {
                x -= item.left;
                y -= item.top;
            }
            
            index = list[length - 1].__index + 1;
            
            for (var i = 0; i < length; i++)
            {
                item = list[i];
                
                if (item.offsetTop + item.offsetHeight > y &&
                    item.offsetLeft + item.offsetWidth > x)
                {
                    index = item.__index;
                    break;
                }
            }

            if (item.findDropTarget && (item.__storage || item.__defaults).droppable)
            {
                return item.findDropTarget(x - item.offsetLeft, y - item.offsetTop);
            }
            console.log(x, y, index);
            return [this, index];
        }
        
        return [this, 0];
    };
    
    
    //接收数据集变更动作处理
    this.receive = function (dataset, action) {
        
        var children = this.__children,
            control;
        
        if (children)
        {
            //向下派发
            for (var i = 0, l = children.length; i < l; i++)
            {
                if (!(control = children[i]).__dataset)
                {
                    control.receive(dataset, action);
                }
            }
        }
    };
    
    
    
    //使布局无效
    this.invalidate = function () {
        
        var target = this,
            parent;
        
        if (this.__arrange_dirty !== 2)
        {
            this.__arrange_dirty = 2;
            this.__update_dirty = true;
            
            while (parent = target.__parent)
            {
                if (parent.__arrange_dirty)
                {
                    return this;
                }
                
                parent.__arrange_dirty = 1;
            }

            flyingon.__delay_update(target);
        }
        
        return this;
    };
    
    
    //更新视区
    this.update = function () {
      
        if (this.__arrange_dirty)
        {
            this.arrange();
        }
        
        if (this.__update_dirty)
        {
            this.render();
            this.__update_dirty = false;
        }
        
        return this;
    };
    
    
           
    this.serialize = function (writer) {
        
        var children = this.__children;
        
        this.base.serialize.call(this, writer);
        
        if (children && children.length)
        {
            writer.writeProperty('children', children);
        }
        
        return this;
    };
    
    
    this.deserialize_children = function (reader, values) {
      
        this.__children = reader.readArray(values);
        return this;
    };


    this.dispose = function () {

        var children = this.__children;

        if (children)
        {
            for (var i = children.length - 1; i >= 0; i--)
            {
                children[i].dispose();
            }
        }

        this.__dom_scroll = null;
        this.base.dispose.call(this);
    };


});


