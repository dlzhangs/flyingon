
//容器控件接口
flyingon.IContainerControl = function (self) {



    //接口标记
    self['flyingon.IContainerControl'] = true;
    
    
    //dom元素模板
    self.createDomTemplate('<div><div style="position:relative;margin:0;border:0;padding:0;left:0;top:0;overflow:hidden;"></div></div>');

    

    //当前布局
    self.defineProperty('layout', null);
    
    

    //子控件集合
    self.defineProperty('children', function () {

        return this.__children || (this.__children = []);
    });


    //未处理的dom数量
    self.__dom_append = 0;
    

    //添加子控件
    self.append = function (control) {

        if (control && control.__parent !== this)
        {
            control.__parent = this;
            this.__dom_append++;
            
            (this.__children || (this.__children = [])).push(control);
        }
        
        return this;
    };


    //在指定位置插入子控件
    self.insert = function (index, control) {

        if (control && control.__parent !== this)
        {
            control.__parent = this;
            
            if (this.__dom_append)
            {
                this.__dom_append++;
            }
            else
            {
                this.dom.insertBefore(control.dom, this.dom.children[index] || null);
            }
            
            (this.__children || (this.__children = [])).splice(index, 0, control);
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
                control.__parent = null;

                if (control.dom.parentNode === this.dom)
                {
                    this.dom.removeChild(control.dom);
                }

                children.splice(index, 1);
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
            control.__parent = null;
            
            if (control.dom.parentNode === this.dom)
            {
                this.dom.removeChild(control.dom);
            }
            
            children.splice(index, 1);
        }

        return this;
    };


    //清除子控件
    self.clear = function () {
      
        var children = this.__children;
        
        if (children)
        {
            var dom_parent = this.dom;
            
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

        var children = this.__children;

        if (children && children.length > 0)
        {
            //初始化dom
            if (this.__dom_dirty)
            {
                        cache = document.createDocumentFragment();

                        for (var i = 0, _ = items.length; i < _; i++)
                        {
                            cache.appendChild(items[i].dom);
                        }

                        this.dom_children.appendChild(cache);
                        this.__dom_dirty = false;
            }

        }
    };


    //测量自动大小
    self.measure_auto = function (box, auto_width, auto_height) {


    };


    //排列子控件
    self.arrange = function () {

        this.__layout.arrange(this, width, height);
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
