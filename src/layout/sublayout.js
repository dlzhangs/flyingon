
//子布局
$class('Sublayout', flyingon.Control, function (base) {
       
    
        
    //子项占比
    this.defineProperty('scale', 0, {
     
        minValue: 0
    });
    
    
    //布局
    this.defineProperty('layout', null, {
     
        set: 'this.__layout = value && typeof value === "object";'
    });
    
    
    //指定默认大小
    this.defaultWidth = this.defaultHeight = 200;
    
        
    
    this.onmeasure = function (box) {

        var layout = this.__layout,
            autoWidth = box.autoWidth,
            autoHeight = box.autoHeight;
        
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
        
        layout.init(this, this.__children, false, false, true);
        
        if (autoWidth || autoHeight)
        {
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
    
        
    this.onlocate = function (box) {
        
        var items = this.__children,
            x = box.offsetLeft,
            y = box.offsetTop;
        
        //处理定位偏移
        if (items && (x || y))
        {
            for (var i = items.length - 1; i >= 0; i--)
            {
                if ((box = items[i]) && (box = box.viewBox))
                {
                    box.offsetLeft += x;
                    box.offsetTop += y;
                }
            }
        }
        
        return false;
    };
    
    
    //重载方法禁止绘制
    this.update = this.render = this.createPainter = function () {};
    
    
});


