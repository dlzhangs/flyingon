
//容器控件接口
flyingon.IContainerControl = function (self, base) {



    //接口标记
    self['flyingon.IContainerControl'] = true;
    
        

    //当前布局
    self.defineProperty('layout', null, {
     
        set: 'this.__layout = value && typeof value === "object";this.invalidate();'
    });
    
    

    //子控件集合
    self.defineProperty('children', function (index) {

        var children = this.__children;
        
        if (index === void 0)
        {
            return children || (this.__children = []);
        }

        return children && children[index];
    });
        
    
    
    //子控件类型
    self.control_type = flyingon.Control;
    

    //添加子控件
    self.append = function (control) {

        if (control && check_control(this, control))
        {
            (this.__children || this.children()).push(control);
            control.__parent = this;
            
            if (this.__dom_content)
            {
                if (this.__arrange_dirty !== 2)
                {
                    this.invalidate();
                }
                
                (this.dom_body || this.dom).appendChild(control.dom);
            }
        }
        
        return this;
    };


    //在指定位置插入子控件
    self.insert = function (index, control) {

        if (control && check_control(this, control))
        {
            var children = this.__children || this.children();
            
            index = check_index(index | 0, 0, children.length); 
            
            children.splice(index, 0, control);
            control.__parent = this;

            if (this.__dom_content)
            {
                if (this.__arrange_dirty !== 2)
                {
                    this.invalidate();
                }
                
                (this.dom_body || this.dom).insertBefore(control.dom, children[index].dom || null);
            }
        }

        return this;
    };
    
    
    //检测控件索引有效值的函数, 负值表示倒数
    function check_index(index, length) {

        if (index < 0)
        {
            if ((index += length) < 0)
            {
                return 0;
            }
        }

        return index > length ? length : index;
    };
    
    
    function check_control(self, control) {
        
        if (control['flyingon.ITopControl'])
        {
            throw $errortext('flyingon', 'top control');
        }
        
        if (control instanceof self.control_type)
        {
            var parent = control.__parent;

            if (parent && parent !== self)
            {
                parent.remove(control, false);
            }
        
            if (control.__arrange_dirty !== 2)
            {
                control.invalidate();
            }

            return true;
        }

        throw $errortext('flyingon', 'children type').replace('{0}', self.control_type.xtype);
    };
    

    //移除子控件或从父控件中移除
    self.remove = function (control, dispose) {
            
        var children, index;
        
        if (control && (children = this.__children) && (index = children.indexOf(control)) >= 0)
        {
            remove(control, index, dispose);
            children.splice(index, 1);

            if (this.__arrange_dirty !== 2)
            {
                this.invalidate();
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
                this.invalidate();
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
                this.invalidate();
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
            if (this.__dom_content)
            {
                this.dom.removeChild(control.dom);
            }
            
            control.__parent = null;
        }
    };
    
    

    //控件内容大小的dom
    var content_dom = document.createElement('div');
    
    content_dom.style.cssText = 'position:absolute;overflow:hidden;margin:0;border:0;padding:0;width:1px;height:1px;visibility:hidden;';
    
    
    //扩展容器组件接口
    flyingon.IContainer(self);
    
    
    //设置渲染大小时不包含padding
    self.__no_padding = true;
    
    
    //padding变更时不同步dom
    self.__style_padding = function (value) {
    
    };
    
    
    //测量自动大小
    self.measure_auto = function (box, auto_width, auto_height) {
        
        this.arrange();

        if (auto_width)
        {
            this.offsetWidth = this.contentWidth + box.border.width;
        }

        if (auto_height)
        {
            this.offsetHeight = this.contentHeight + box.border.height;
        }
    };
    
        
    //设置默认排列标记
    self.__arrange_dirty = 0;
    
    
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
        if (!self.__dom_content)
        {
            cache = document.createDocumentFragment();
            
            cache.appendChild(self.__dom_content = content_dom.cloneNode(false));

            for (var i = 0, _ = children.length; i < _; i++)
            {
                cache.appendChild(children[i].dom);
            }

            (self.dom_body || self.dom).appendChild(cache);
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
        
        var style, hscroll, vscroll;

        cache = self.__boxModel || self.boxModel();

        self.arrange_range(cache.border, cache = cache.padding);

        switch (self.overflowX())
        {
            case 'scroll':
                if ((self.arrangeHeight -= layout.hscroll_height) < 0)
                {
                    self.arrangeHeight = 0;
                }
                break;

            case 'auto':
                hscroll = true;
                break;
        }

        switch (self.overflowY())
        {
            case 'scroll':
                if ((self.arrangeWidth -= layout.vscroll_width) < 0)
                {
                    self.arrangeWidth = 0;
                }
                break;

            case 'auto':
                vscroll = true;
                break;
        }

        //初始化布局
        layout.init(self, hscroll, vscroll, children);

        //处理滚动条: 注overflow==='auto'在chrome下在未超出原滚动条时不会消失
        if (hscroll || vscroll)
        {
            style = (self.dom_body || self.dom).style;

            if (hscroll)
            {
                hscroll = cache.left + self.arrangeWidth + cache.right >= self.contentWidth;
                style.overflowX = hscroll ? 'hidden' : 'scroll';
            }

            if (vscroll)
            {
                vscroll = cache.top + self.arrangeHeight + cache.bottom >= self.contentHeight;
                style.overflowY = vscroll ? 'hidden' : 'scroll';
            }
        }

        //使用positon:relatvie left,top或margin:bottom,right定位时在IE6,7不正常
        //style.margin = height + 'px 0 0 ' + width + 'px';
        style = self.__dom_content.style;
        style.left = (self.contentWidth - 1) + 'px';
        style.top = (self.contentHeight - 1) + 'px';

        //最后渲染
        for (var i = children.length - 1; i >= 0; i--)
        {
            cache = children[i];
            cache.update();
            cache.__update_dirty = false;
        }

        //排列子项
        self.arrange_children(children);
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

        this.__dom_content = null;
        base.dispose.call(this);
    };


};
