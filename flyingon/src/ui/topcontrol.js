
//顶级控件接口
flyingon.ITopControl = function (self) {
    
    
    var update_list = [],
        delay;
        
    
    //接口标记
    self['flyingon.ITopControl'] = true;
    
    
    //延时更新
    function update_delay() {
        
        var list = update_list;
        
        for (var i = list.length - 1; i >= 0; i--)
        {
            list[i].refresh();
        }
        
        list.length = 0;
        delay = 0;
    };
    
    
    //刷新控件
    self.refresh = function (dirty) {
      
        var dom = this.dom;
        
        if (dom && (dom = dom.parentNode))
        {
            if (this.__update_dirty)
            {
                var style = this.dom.style,
                    width = dom.clientWidth,
                    height = dom.clientHeight,
                    box = this.boxModel(width, height);

                this.measure(box, width, height, false);
                this.locate(box, 0, 0, width, height);
                this.render();
                
                style.position = 'relative';
                style.left = this.left();
                style.top = this.top();
            }

            if (dirty || this.__arrange_dirty)
            {
                this.arrange(dirty);
            }
        }
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