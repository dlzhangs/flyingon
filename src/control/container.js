

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
                throw $errortext('flyingon', 'children type').replace('{0}', type.xtype);
            }
        }
        
        return list;
    };
    
    
    //添加子控件
    this.append = function (control) {

        var list = check_control(this, arguments, 0),
            children;
        
        if (list)
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
        }
        
        return this;
    };


    //在指定位置插入子控件
    this.insert = function (index, control) {

        var list = check_control(this, arguments, 1),
            children;
        
        if (list)
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
        }

        return this;
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
        }

        return this;
    };


    //移除指定位置的子控件
    this.removeAt = function (index, dispose) {

        var children, control;

        if ((children = this.__children) && (control = children[index]))
        {       
            children.splice(index, 1);
            remove(control, index, dispose);
        }

        return this;
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
        }
        
        return this;
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
                box.offsetWidth = box.contentWidth + box.border.width;
            }

            if (autoHeight)
            {
                box.offsetHeight = box.contentHeight + box.border.height;
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

        var box = this.viewBox,
            hscroll, 
            vscroll;
        
        if (box)
        {
            //处理自动滚动
            switch (this.overflowX())
            {
                case 'scroll':
                    box.hscroll = true;
                    break;

                case 'auto':
                    hscroll = true;
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
                    vscroll = true;
                    break;
                    
                default:
                    box.vscroll = false;
                    break;
            }

            //初始化布局
            this.getLayout().init(this, this.__children, hscroll, vscroll);
        }
        
        //排列子项
        this.__arrange_dirty = 0;
    };
    
    
    //获取布局器对象
    this.getLayout = function () {

        var layout = this.__layout;
            
        if (layout)
        {
            if (layout === true)
            {
                layout = this.__layout = flyingon.findLayout(this.layout());
            }
        }
        else
        {
            layout = flyingon.findLayout(this.layout());
        }
        
        return layout;
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
    };
    
    
           
    this.serialize = function (writer) {
        
        var children;
        
        this.base.serialize.call(this, writer);
        
        if (children && children.length)
        {
            writer.write_property('children', children);
        }
    };
    
    
    this.deserialize_children = function (reader, values) {
      
        this.__children = reader.read_array(values);
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


