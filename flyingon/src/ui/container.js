
//容器控件接口
flyingon.IContainerControl = function (self) {



    //接口标记
    self['flyingon.IContainerControl'] = true;
    
    
    //dom元素模板
    self.createDomTemplate('<div><div style="position:relative;margin:0;border:0;padding:0;left:0;top:0;overflow:hidden;"></div></div>');

    

    //当前布局
    self.defineProperty('layout', null, {
     
        set: 'this.__layout = value && typeof value === "object";'
    });
    
    

    //子控件集合
    self.defineProperty('children', function () {

        return this.__children || (this.__children = []);
    });
    
          
    
    //子控件类型
    self.control_type = flyingon.Control;
    

    //添加子控件
    self.append = function (control) {

        if (control && check_control(this, control))
        {
            this.__dom_dirty = true;
            
            (this.__children || (this.__children = [])).push(control);
            control.__parent = this;
        }
        
        return this;
    };


    //在指定位置插入子控件
    self.insert = function (index, control) {

        if (control && check_control(this, control))
        {
            var dom = this.dom,
                children = this.__children || (this.__children = []);
            
            if (index < 0)
            {
                index = 0;
            }
            else if (index > children.length)
            {
                index = children.length;
            }
                     
            if (dom.children.length >= index)
            {
                this.dom.insertBefore(control.dom, dom.children[index] || null);
            }
            else
            {
                this.__dom_dirty = true;
            }
            
            children.splice(index, 0, control);
            control.__parent = this;
        }

        return this;
    };
    
    
    function check_control(self, control) {
        
        if (control.__parent !== self)
        {
            if (control instanceof self.control_type)
            {
                if (control.__arrange_dirty !== 2)
                {
                    control.update();
                }
            
                return true;
            }
            
            throw $errortext('flyingon', 'children type').replace('{0}', self.control_type.xtype);
        }
    };
    
    
    //获取或设置当前控件在父控件中的索引号
    self.indexOf = function (index) {
        
        var parent = this.__parent,
            children;
        
        if (index >= 0)
        {
            if (parent && (children = parent.__children) && children[index] !== this)
            {
                var dom = this.dom,
                    dom_parent = dom.parentNode,
                    i = children.indexOf(this);
                
                if (this.__arrange_dirty !== 2)
                {
                    this.update();
                }
                
                children.splice(i, 1);
                children.splice(index, 0, this);
                
                dom_parent.insertBefore(dom, dom_parent.children[index] || null);
            }
            
            return this;
        }

        return parent ? parent.__children.indexOf(this) : -1;
    };


    //移除子控件或从父控件中移除
    self.remove = function (control, dispose) {
            
        var children, index;
        
        if (control && (children = this.__children) && (index = children.indexOf(control)) >= 0)
        {
            remove(control, dispose);
            children.splice(index, 1);

            if (this.__arrange_dirty !== 2)
            {
                this.update();
            }
        }

        return this;
    };


    //移除指定位置的子控件
    self.removeAt = function (index, dispose) {

        var children, control;

        if ((children = this.__children) && (control = children[index]))
        {       
            remove(control, dispose);
            children.splice(index, 1);
            
            if (this.__arrange_dirty !== 2)
            {
                this.update();
            }
        }

        return this;
    };


    //清除子控件
    self.clear = function (dispose) {
      
        var children = this.__children,
            length;
        
        if (children && (length = children.length) > 0)
        {
            for (var i = length - 1; i >= 0; i--)
            {
                remove(children[i], dispose);
            }
            
            children.length = 0;
            
            if (this.__arrange_dirty !== 2)
            {
                this.update();
            }
        }
        
        return this;
    };
    
    
    function remove(control, dispose) {
      
        var dom = control.dom,
            parent = dom.parent;
        
        if (parent)
        {
            parent.removeChild(dom);
        }
            
        if (dispose)
        {
            control.dispose();
        }
        else
        {
            control.__parent = null;
        }
    };
    
    
    //测量后处理
    self.onmeasure = function (box, width, height) {
        
        var auto_width = box.width === 'auto',
            auto_height = box.height === 'auto';
        
        if (auto_width || auto_height)
        {
            this.arrange();
            
            if (auto_width)
            {
                this.offsetWidth = this.contentWidth;
            }
            
            if (auto_height)
            {
                this.offsetHeight = this.contentHeight;
            }
        }
    };
    


    //排列子控件
    self.arrange = function (dirty) {

        var children = this.__children,
            length;

        switch (dirty || this.__arrange_dirty)
        {
            case 2:
                if (children && children.length > 0)
                {
                    arrange(this, children);
                }
                break;

            case 1:
                if (children && (length = children.length) > 0)
                {
                    for (var i = 0; i < length; i++)
                    {
                        var control = children[i];
                        
                        if (control.__arrange_dirty)
                        {
                            control.arrange();
                        }
                    }
                }
                break;
        }
        
        this.__arrange_dirty = 0;
    };
    
    
    function arrange(self, children) {
        
        var layout = self.__layout,
            cache;
            
        //初始化dom
        if (self.__dom_dirty)
        {
            cache = document.createDocumentFragment();

            for (var i = 0, _ = children.length; i < _; i++)
            {
                cache.appendChild(children[i].dom);
            }

            self.dom.children[0].appendChild(cache);
            self.__dom_dirty = false;
        }
        
        if (layout)
        {
            if (layout === true)
            {
                layout = self.__layout = flyingon.findLayout(self.layout());
            }
        }
        else
        {
            layout = flyingon.findLayout(self.layout());
        }
        
        if (layout)
        {
            var clientRect = self.clientRect(),
                hscroll,
                vscroll,
                control;

            switch (self.overflowX())
            {
                case 'scroll':
                    clientRect.height -= layout.hscroll_height;
                    break;

                case 'auto':
                    hscroll = true;
                    break;
            }

            switch (self.overflowY())
            {
                case 'scroll':
                    clientRect.width -= layout.vscroll_width;
                    break;

                case 'auto':
                    vscroll = true;
                    break;
            }

            layout.init(self, clientRect, hscroll, vscroll, children);
            
            self.arrange_children(children);
        }
    };
    
    
    //排列子项
    self.arrange_children = function (children) {

        for (var i = 0, _ = children.length; i < _; i++)
        {
            var control = children[i];
            
            if (control.arrange)
            {
                control.arrange();
            }
            
            control.render();
        }
    };
    
    
    //设置渲染大小时不包含padding
    self.__no_padding = true;
    
    
    //padding变更时不同步dom
    self.__style_padding = function (value) {
    
    };
    
    
    self.onarrange = function () {
      
        var box = this.__boxModel,
            width = this.contentWidth,
            height = this.contentHeight,
            style = (this.dom_body || this.dom).children[0].style;
        
        if (box)
        {
            box = box.padding;
            width += box.right;
            height += box.bottom;
        }
        
        style.width = width + 'px';
        style.height = height + 'px';
    };
    
    
    //更新布局
    self.update = function (dirty) {
        
        var parent = this.__parent;
        
        if (!dirty)
        {
            this.__location_dirty = true;
        }
        
        this.__arrange_dirty = +dirty || 2;
        
        if (parent && !parent.__arrange_dirty)
        {
            parent.update(1);
        }
    };

    
    self.serialize = function (writer) {
        
        var children;
        
        base.serialize.call(this, writer);
        
        if (children && children.length)
        {
            writer.write_property('children', children);
        }
    };
    
    
    self.deserialize_list.children = function (reader, values) {
      
        this.__children = reader.read_array(values);
    };


    self.dispose = function () {

        var children = this.__children;

        if (children)
        {
            for (var i = children.length - 1; i >= 0; i--)
            {
                children[i].dispose();
            }
        }

        return base.dispose.call(this);
    };


};
