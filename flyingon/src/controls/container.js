
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



    //添加子控件
    self.append = function (control) {

        if (control && control.__parent !== this)
        {
            this.__dom_dirty = true;
            
            if (this.__arrange_dirty !== 2)
            {
                this.registry_arrange();
            }
            
            (this.__children || (this.__children = [])).push(control);
            control.__parent = this;
        }
        
        return this;
    };


    //在指定位置插入子控件
    self.insert = function (index, control) {

        if (control && control.__parent !== this)
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
            
            if (this.__arrange_dirty !== 2)
            {
                this.registry_arrange();
            }
            
            children.splice(index, 0, control);
            control.__parent = this;
        }

        return this;
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
                    this.registry_arrange();
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
    self.remove = function (control) {
            
        var parent, children, index;

        if (control)
        {
            if ((children = this.__children) && (index = children.indexOf(control)) >= 0)
            {
                if (this.__arrange_dirty !== 2)
                {
                    this.registry_arrange();
                }
                
                if (control.dom.parentNode === this.dom)
                {
                    this.dom.removeChild(control.dom);
                }

                children.splice(index, 1);
                control.__parent = null;
            }
        }
        else if (parent = this.__parent)
        {
            parent.remove(this);
        }

        return this;
    };


    //移除指定位置的子控件
    self.removeAt = function (index) {

        var children, control;

        if ((children = this.__children) && (control = children[index]))
        {       
            if (this.__arrange_dirty !== 2)
            {
                this.registry_arrange();
            }
            
            if (control.dom.parentNode === this.dom)
            {
                this.dom.removeChild(control.dom);
            }
            
            children.splice(index, 1);
            control.__parent = null;
        }

        return this;
    };


    //清除子控件
    self.clear = function () {
      
        var children = this.__children;
        
        if (children)
        {
            var dom_parent = this.dom.children[0];
            
            for (var i = children.length - 1; i >= 0; i--)
            {
                var control = children[i],
                    dom = control.dom;
                
                control.__parent = null;
                
                if (dom.parentNode === dom_parent)
                {
                    dom_parent.removeChild(dom);
                }
            }
            
            children.length = 0;
        }
        
        return this;
    };
    

    //排列子控件
    self.arrange = function () {

        var children = this.__children,
            length;

        switch (this.__arrange_dirty)
        {
            case 2:
                if (children && children.length > 0)
                {
                    arrange(this, children);
                }
                
                this.__arrange_dirty = 0;
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
                
                this.__arrange_dirty = 0;
                break;
        }
    };
    
    
    function arrange(self, children) {
        
        var layout = this.__layout;
            
        //初始化dom
        if (self.__dom_dirty)
        {
            var cache = document.createDocumentFragment();

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
            layout.init(self, self.clientRect, children);
        }
    };


    //测量自动大小
    self.measure_auto = function (box, auto_width, auto_height) {


    };

    
    self.after_locate = function () {
      
        var dom = this.dom,
            style = dom.style;
        
        style.left = this.offsetLeft + 'px';
        style.top = this.offsetTop + 'px';

        if (this.box_sizing_border)
        {
            style.width = this.offsetWidth + 'px';
            style.height = this.offsetHeight + 'px';
        }
        else
        {
            var clientRect = this.clientRect;
            
            style.width = clientRect.width + 'px';
            style.height = clientRect.height + 'px';
        }
        
        style = dom.children[0].style;
        style.width = this.clientRect.width + 'px';
        style.height = this.clientRect.height + 'px';
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
