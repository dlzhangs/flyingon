
//顶级控件接口
flyingon.ITopControl = function (self) {
    
    
    var update_list = [],
        delay;
        
    
    //接口标记
    self['flyingon.ITopControl'] = true;
    
    
    //延时更新
    function update_delay() {
        
        var controls = update_list;
        
        for (var i = controls.length - 1; i >= 0; i--)
        {
            update(controls[i]);
        }
        
        controls.length = 0;
        delay = 0;
    };
    
    
    //更新控件
    function update(control) {
      
        if (control.__update_dirty)
        {
            var dom = control.dom.parentNode,
                width = dom.clientWidth,
                height = dom.clientHeight,
                box = control.boxModel(width, height);

            control.measure(box, width, height, false);
            control.locate(box, 0, 0, width, height);
        }

        if (control.__arrange_dirty)
        {
            control.arrange();
        }
    };
    
    
    //显示
    self.show = function (dom) {

        (dom || document.body).appendChild(this.dom);
        update(this);

        return this;
    };
    
    
    //关闭
    self.close = function () {
        
        var dom = this.dom;
        
        if (this.__arrange_dirty)
        {
            update_list.remove(this);
        }
        
        if (dom && dom.parentNode)
        {
            dom.parentNode.removeChild(dom);
        }
        
        return this;
    };
    

    
    self.update = function (dirty) {
      
        var arrange = this.__arrange_dirty;
        
        if (!dirty)
        {
            this.__update_dirty = true;
        }
        
        this.__arrange_dirty = dirty || 2;

        if (!arrange)
        {
            update_list.push(this);
            delay || (delay = setTimeout(update_delay, 10)); //10毫秒后定时刷新
        }

        return this;
    };
    
    
};