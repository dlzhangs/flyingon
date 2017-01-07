
//子布局
$class('Sublayout', flyingon.Control, function (base) {
       
    
        
    //子项占比
    this.defineProperty('scale', 0, {
     
        minValue: 0
    });
    
    
    //布局
    this.defineProperty('layout', null, {
     
        set: 'this.__layout = null;'
    });
    
    
    //指定默认大小
    this.defaultWidth = this.defaultHeight = 200;
    
        
    
    this.onmeasure = function (box) {

        var autoWidth = box.autoWidth,
            autoHeight = box.autoHeight;
           
        flyingon.arrange(this, this.__children, false, false, true);
        
        if (autoWidth || autoHeight)
        {
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
    
        
    this.onlocate = function (box) {
        
        var items = this.__children,
            x = this.offsetLeft,
            y = this.offsetTop,
            control;
        
        //处理定位偏移
        if (items && (x || y))
        {
            for (var i = items.length - 1; i >= 0; i--)
            {
                if (control = items[i])
                {
                    control.offsetLeft += x;
                    control.offsetTop += y;
                }
            }
        }
        
        return false;
    };
    
    
    //重载方法禁止绘制
    this.update = this.render = this.createPainter = function () {};
    
    
});


