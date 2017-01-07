
//布局基类
$class('Layout', function () {

    

    //注册的布局列表
    var registry_list = flyingon.create(null); 
    
    //已定义的布局集合
    var layouts = flyingon.create(null); 

    
    
    //布局类型
    this.type = null;

    
    
    //自适应布局条件
    this.defineProperty('condition', '');
    
    
    //布局间隔宽度
    //length	规定以具体单位计的值 比如像素 厘米等
    //number%   控件客户区宽度的百分比
    this.defineProperty('spacingX', '2');

    //布局间隔高度
    //length	规定以具体单位计的值 比如像素 厘米等
    //number%   控件客户区高度的百分比
    this.defineProperty('spacingY', '2');

   
    //镜像布局变换
    //none:     不进行镜像变换
    //x:        沿x轴镜像变换
    //y:        沿y轴镜像变换
    //center:   沿中心镜像变换
    this.defineProperty('mirror', 'none');


    //子项定位属性值
    this.defineProperty('location', null, {

        set: 'this.__location = !!value;'
    });

    
    //分割子布局
    this.defineProperty('sublayouts', null, {
       
        set: 'this.__sublayouts = !!value;'
    });
    
    
            
    //获取或切换而已或定义布局
    flyingon.layout = function (name, values) {
    
        if (name && values && typeof values !== 'function') //定义布局
        {
            layouts[name] = [values, null];
        }
        else
        {
            return $require.key('layout', name, values); //获取或设置当前布局
        }
    };
    
    
    
    //排列容器控件
    flyingon.arrange = function (control, items, hscroll, vscroll, sublayout) {
        
        var box = control.boxModel,
            border = box.border,
            padding = box.padding,
            layout = control.__layout,
            cache;
        
        //获取当前布局对象
        if (!layout && typeof (cache = control.layout) === 'function')
        {
            layout = control.__layout = flyingon.findLayout(cache.call(control));
        }
        
        //数组按自适应布局处理
        if (typeof layout === 'function')
        {
            cache = layout(control.offsetWidth, control.offsetHeight);
            layout = layout[cache] || (layout[cache] = flyingon.findLayout(layout.values[cache]));
        }
        
        //计算排列区域
        box.arrangeLeft = box.contentWidth = padding.left;
        box.arrangeTop = box.contentHeight = padding.top;

        box.clientWidth = (cache = control.offsetWidth - border.width - padding.width) > 0 ? cache : 0;
        box.clientHeight = (cache = control.offsetHeight - border.height - padding.height) > 0 ? cache : 0;

        //自定义调整排列区域
        if (cache = control.arrangeArea)
        {
            cache.call(control, box);
        }
        
        //排列子控件
        if (items && items.length > 0)
        {
            arrange(layout, box, items, hscroll, vscroll, sublayout);
                    
            if (hscroll)
            {
                box.hscroll = box.contentWidth > box.arrangeLeft + box.clientWidth;
            }

            if (vscroll)
            {
                box.vscroll = box.contentHeight > box.arrangeTop + box.clientHeight;
            }
            
            box.contentWidth += padding.right;
            box.contentHeight += padding.bottom;

            //非子布局 镜像处理(注:子布局不支持镜象,由上层布局统一处理)
            if (!sublayout && (cache = layout.mirror()) !== 'none')
            {
                arrange_mirror(box, items, cache);
            }
        }
        else
        {
            box.hscroll = box.vscroll = false;
            box.contentWidth = box.contentHeight = 0;
        }
    };
    
    
                
    //获取布局实例
    flyingon.findLayout = function (key) {
      
        if (key)
        {
            if (typeof key === 'string')
            {
                if (key = layouts[key])
                {
                    return key[1] || (key[1] = deserialize_layout(key[0]));
                }
            }
            else
            {
                return deserialize_layout(key);
            }
        }
  
        return new registry_list['flow']();
    };
    
    
    //反序列化布局实例
    function deserialize_layout(values) {
        
        var layout;
        
        if (values instanceof Array)
        {
            layout = new Function('width', 'height', complie_array(values));
            layout.values = values;
        }
        else
        {
            layout = new (registry_list[values && values.type || 'flow'] || registry_list['flow'])();
            layout.deserialize(flyingon.SerializeReader.instance, values);
        }

        return layout;
    };
    
    
    //编译数组项
    function complie_array(list) {

        var data = [],
            index = -1,
            item,
            key;

        for (var i = 0, l = list.length; i < l; i++)
        {
            if (item = list[i])
            {
                if (key = item.condition)
                {
                    data.push('if (', key, ') return ', i, ';\n'); 
                }
                else
                {
                    index = i;
                }
            }
        }
        
        if (index >= 0)
        {
            data.push('return ', index, ';');
        }

        return data.join('');
    };

          
    //内部排列方法
    function arrange(layout, container, items, hscroll, vscroll) {

        var values = layout.__sublayouts,
            width,
            height,
            fn,
            cache;
                            
        //处理子布局(注:子布局不支持镜象,由上层布局统一处理)
        if (values)
        {
            if (values === true)
            {
                values = layout.__sublayouts = init_sublayouts(layout.sublayouts());
            }
 
            //分配置子布局子项
            allot_sublayouts(values, items);
             
            //先排列子布局
            items = values;
        }
        else if (values = layout.__location) //处理强制子项值
        { 
            if (values === true)
            {
                values = layout.location(); 
                    
                if (values instanceof Array)
                {
                    fn = new Function('item', 'index', 'width', 'height', compile_array(values));
                    fn.values = values;
                    
                    values = fn;
                }
                
                layout.__location = values;
            }

            if (typeof values === 'function')
            {
                fn = values;
                values = fn.values;
                
                width = container.clientWidth;
                height = container.clientHeight;
                
                for (var i = items.length - 1; i >= 0; i--)
                {
                    cache = fn(items[i], i, width, height);
                    items[i].__location_values = cache >= 0 ? values[cache] : cache;
                }
            }
            else
            {
                for (var i = items.length - 1; i >= 0; i--)
                {
                    items[i].__location_values = values;
                }
            }
        }
        else //清空原有强制子项属性
        {
            for (var i = items.length - 1; i >= 0; i--)
            {
                items[i].__location_values = null;
            }
        }
        
        //排列
        layout.arrange(container, items, hscroll, vscroll);
    };
    

    //初始化子布局
    function init_sublayouts(values) {
        
        var index = values.length;
        
        if (!index)
        {
            values = [values];
            index = 1;
        }
        
        var reader = flyingon.SerializeReader,
            layouts = new Array(values.length),
            fixed = 0,
            weight = 0,
            layout,
            scale,
            cache;
        
        while (cache = values[--index])
        {
            (layout = layouts[index] = new flyingon.Sublayout()).deserialize(reader, cache);
            
            if (scale = layout.scale())
            {
                if (layout.fixed = cache = scale | 0)
                {
                    fixed += cache;
                }

                if (layout.weight = cache = scale - cache)
                {
                    weight += cache;
                }
            }
            else
            {
                layout.fixed = 0;
                weight += (layout.weight = 1);
            }
        }
        
        layouts.fixed = fixed;
        layouts.weight = weight;
        
        return layouts;
    };
    
    
    //分配子布局子项
    function allot_sublayouts(layouts, items) {
        
        var margin = items.length - layouts.fixed, //余量
            weight = layouts.weight,
            index = 0;
        
        if (margin < 0)
        {
            margin = 0;
        }
        
        for (var i = 0, l = layouts.length; i < l; i++)
        {
            var layout = layouts[i],
                length = layout.fixed,
                scale = layout.weight,
                value;
            
            if (scale)
            {
                value = margin * scale / weight | 0;
                weight -= scale;
                
                length += value;
                margin -= value;
            }

            layout.__children = items.slice(index, index += length);
        }
    };
        
        
    //镜象排列
    function arrange_mirror(container, items, mirror) {

        var padding = container.padding,
            max = Math.max,
            width = max(container.clientWidth, container.contentWidth),
            height = max(container.clientHeight, container.contentHeight),
            length = items.length,
            control;
        
        switch (mirror)
        {
            case 'x':
                for (var i = 0; i < length; i++)
                {
                    if (control = items[i])
                    {
                        control.offsetTop = height - control.offsetTop - control.offsetHeight;
                    }
                }
                break;

            case 'y':
                for (var i = 0; i < length; i++)
                {
                    if (control = items[i])
                    {
                        control.offsetLeft = width - control.offsetLeft - control.offsetWidth;
                    }
                }
                break;

            case 'center':
                for (var i = 0; i < length; i++)
                {
                    if (control = items[i])
                    {
                        control.offsetLeft = width - control.offsetLeft - control.offsetWidth;
                        control.offsetTop = height - control.offsetTop - control.offsetHeight;
                    }
                }
                break;
        }
    };

    
    
    //排列布局
    this.arrange = function (container, items, hscroll, vscroll) {

    };
    
    
    //重排
    this.rearrange = function (container, items, hscroll, vscroll) {
      
        var flag = false;
        
        if (hscroll && (hscroll === 1 || container.contentWidth > container.arrangeLeft + container.clientWidth))
        {
            if ((container.clientHeight -= flyingon.hscroll_height) < 0)
            {
                container.clientHeight = 0;
            }
            
            hscroll = false;
            flag = true;
        }
        
        if (vscroll && (vscroll === 1 || container.contentHeight > container.arrangeTop + container.clientHeight))
        {
            if ((container.clientWidth -= flyingon.vscroll_width) < 0)
            {
                container.clientWidth = 0;
            }
            
            vscroll = false;
            flag = true;
        }
        
        if (flag)
        {
            container.contentWidth = container.arrangeLeft;
            container.contentHeight = container.arrangeTop;
            
            this.arrange(container, items, hscroll, vscroll);
            return true;
        }
    };
    
       
    
    //引入序列化功能片段
    flyingon.SerializeFragment(this);
    
    
    
    //设置不反序列化type属性
    this.deserialize_type = true;
    
            

    this.__class_init = function (Class, base) {

        if (base.__class_init)
        {
            var type = this.type;
            
            if (type)
            {
                registry_list[type] = Class;
                layouts[type] = [null, new Class()];
            }
            else
            {
                throw $errortext('flyingon', 'layout type').replace('{0}', Class.xtype);
            }
        }
    };
        

});



//单列布局类
$class(flyingon.Layout, function (base) {


    this.type = 'line';
    
        
    //排列布局
    this.arrange = function (container, items, hscroll, vscroll) {

        var x = container.arrangeLeft,
            y = container.arrangeTop,
            width = container.clientWidth,
            height = container.clientHeight,
            right = x + width,
            spacingX = flyingon.pixel(this.spacingX(), width),
            control;
        
        //先按无滚动条的方式排列
        for (var i = 0, l = items.length; i < l; i++)
        {
            control = items[i];
            control.initBoxModel(width, height);
            control.measure(right > x ? right - x : width, height, true);
            control.locate(x, y, 0, height, container);

            if (hscroll && container.contentWidth > right)
            {
                return this.rearrange(container, items, 1, false);
            }

            x = container.arrangeX + spacingX;
        }
    };
    
    
});



//纵向单列布局类
$class(flyingon.Layout, function (base) {


    this.type = 'vertical-line';
    
        
    //排列布局
    this.arrange = function (container, items, hscroll, vscroll) {

        var x = container.arrangeLeft,
            y = container.arrangeTop,
            width = container.clientWidth,
            height = container.clientHeight,
            bottom = y + height,
            spacingY = flyingon.pixel(this.spacingY(), height),
            control;
        
        //先按无滚动条的方式排列
        for (var i = 0, l = items.length; i < l; i++)
        {
            control = items[i];
            control.initBoxModel(width, height);
            control.measure(width, bottom > y ? bottom - height : height, 0, true);
            control.locate(x, y, width, 0, container);

            if (vscroll && container.contentHeight > bottom)
            {
                return this.rearrange(container, items, false, 1);
            }

            y = container.arrangeY + spacingY;
        }
    };
    
    
});



//流式布局类
$class(flyingon.Layout, function (base) {


    this.type = 'flow';


    //行高
    this.defineProperty('lineHeight', 0, {
     
        dataType: 'integer',
        minValue: 0
    });

        
    //控制流式布局是否换行
    flyingon.locationProperty('newline', false);
    
    
    //排列布局
    this.arrange = function (container, items, hscroll, vscroll) {

        var x = container.arrangeLeft,
            y = container.arrangeTop,
            width = container.clientWidth,
            height = container.clientHeight,
            right = x + width,
            bottom = y + height,
            pixel = flyingon.pixel,
            spacingX = pixel(this.spacingX(), width),
            spacingY = pixel(this.spacingY(), height),
            lineHeight = pixel(this.lineHeight(), height),
            left = x,
            control

        for (var i = 0, l = items.length; i < l; i++)
        {
            control = items[i];
            control.initBoxModel(width, height);
            control.measure(right > x ? right - x : width, lineHeight, width);

            //处理换行
            if (x > left && (x + control.offsetWidth + control.boxModel.margin.right > right || 
                control.locationValue('newline')))
            {
                x = left;
                y = (lineHeight ? y + lineHeight : container.contentHeight) + spacingY;
            }

            control.locate(x, y, 0, lineHeight, container);

            //出现滚动条后重排
            if (vscroll && container.contentHeight > bottom)
            {
                return this.rearrange(container, items, false, 1);
            }

            x = container.arrangeX + spacingX;
        }
    };

    
});



//流式布局类
$class(flyingon.Layout, function (base) {


    this.type = 'vertical-flow';


    //行宽
    this.defineProperty('lineWidth', 0, {
     
        dataType: 'integer',
        minValue: 0
    });

    
    
    //排列布局
    this.arrange = function (container, items, hscroll, vscroll) {

        var x = container.arrangeLeft,
            y = container.arrangeTop,
            width = container.clientWidth,
            height = container.clientHeight,
            right = x + width,
            bottom = y + height,
            pixel = flyingon.pixel,
            spacingX = pixel(this.spacingX(), width),
            spacingY = pixel(this.spacingY(), height),
            lineWidth = pixel(this.lineWidth(), width),
            top = y,
            control;

        for (var i = 0, l = items.length; i < l; i++)
        {
            control = items[i];
            control.initBoxModel(width, height);
            control.measure(lineWidth, bottom > y ? bottom - y : height, 0, height);

            //处理换行
            if (y > top && (y + control.offsetHeight + control.boxModel.margin.bottom > bottom || 
                control.locationValue('newline')))
            {
                x = (lineWidth ? x + lineWidth : container.contentWidth) + spacingX;
                y = top;
            }

            control.locate(x, y, lineWidth, 0, container);

            //出现滚动条后重排
            if (hscroll && container.contentWidth > right)
            {
                return this.rearrange(container, items, 1, false);
            }

            y = container.arrangeY + spacingY;
        }
    };

    
});



//停靠布局类
$class(flyingon.Layout, function (base) {


    this.type = 'dock';
    
    
    //控件停靠方式(此值仅在当前布局类型为停靠布局(dock)时有效)
    //left:     左停靠
    //top:      顶部停靠
    //right:    右停靠
    //bottom:   底部停靠
    //fill:     充满
    flyingon.locationProperty('dock', 'left');

    
    //排列布局
    this.arrange = function (container, items, hscroll, vscroll) {

        var x = container.arrangeLeft,
            y = container.arrangeTop,
            width = container.clientWidth,
            height = container.clientHeight,
            right = x + width,
            bottom = y + height,
            clientWidth = width,
            clientHeight = height,
            pixel = flyingon.pixel,
            spacingX = pixel(this.spacingX(), width),
            spacingY = pixel(this.spacingY(), height),
            list,
            control;

        for (var i = 0, l = items.length; i < l; i++)
        {
            control = items[i];
            control.initBoxModel(clientWidth, clientHeight);
            
            switch (control.locationValue('dock'))
            {
                case 'left':
                    control.measure(width, height, true, false, false, true);
                    control.locate(x, y, 0, height, container);

                    width = right - (x = container.arrangeX + spacingX);
                    break;

                case 'top':
                    control.measure(width, height, false, true, true);
                    control.locate(x, y, width, 0, container);

                    height = bottom - (y = container.arrangeY + spacingY);
                    break;

                case 'right':
                    control.measure(width, height, true, false, false, true);
                    
                    right -= control.offsetWidth - control.boxModel.margin.width;
                    control.locate(right, y, 0, height, container);

                    width = (right -= spacingX) - x;
                    break;

                case 'bottom':
                    control.measure(width, height, true, false, true);bottom
                    
                    bottom -= control.offsetHeight - control.boxModel.margin.height;
                    control.locate(x, bottom, width, 0, container);

                    height = (bottom -= spacingY) - y;
                    break;

                default:
                    (list || (list = [])).push(control);
                    continue;
            }
        }
        
        //排列充满项
        if (list)
        {
            for (var i = 0, l = list.length; i < l; i++)
            {
                control.measure(width, height, false, false, true, true);
                control.locate(x, y, width, height, container);
            }
        }
        
        //检查是否需要重排
        if (hscroll || vscroll)
        {
            this.rearrange(container, items, hscroll, vscroll);
        }
    };

    
});



//层叠布局类
$class(flyingon.Layout, function (base) {


    this.type = 'cascade';
    
    
    //排列布局
    this.arrange = function (container, items, hscroll, vscroll) {

        var x = container.arrangeLeft,
            y = container.arrangeTop,
            width = container.clientWidth,
            height = container.clientHeight,
            control;

        for (var i = 0, l = items.length; i < l; i++)
        {
            control = items[i];
            control.initBoxModel(width, height);
            control.measure(width, height);
            control.locate(x, y, width, height, container);
        }
        
        //检查是否需要重排
        if (hscroll || vscroll)
        {
            this.rearrange(container, items, hscroll, vscroll);
        }
    };
    
    
});



//绝对定位布局类
$class(flyingon.Layout, function (base) {


    this.type = 'absolute';
    
    
    //排列布局
    this.arrange = function (container, items, hscroll, vscroll) {

        var x = container.arrangeLeft,
            y = container.arrangeTop,
            width = container.clientWidth,
            height = container.clientHeight,
            fn = flyingon.pixel,
            control,
            left,
            top;

        for (var i = 0, l = items.length; i < l; i++)
        {
            control = items[i];
            control.initBoxModel(width, height);
            
            left = x + fn(control.locationValue('left'), width);
            top = y + fn(control.locationValue('top'), height);

            control.measure(0, 0, true, true);
            control.locate(left, top, 0, 0, container);
        }
    };
    
    
});



//均分布局
$class(flyingon.Layout, function (base) {
    
    
    this.type = 'uniform';
    
    
    //固定大小
    this.defineProperty('size', 20);
    
    
    
    //排列布局
    this.arrange = function (container, items, hscroll, vscroll) {

        var x = container.arrangeLeft,
            y = container.arrangeTop,
            width = container.clientWidth,
            height = container.clientHeight,
            length = items.length,
            size = this.size(),
            weight = length - 1,
            spacing = width - size * length,
            control,
            value;

        for (var i = 0; i < length; i++)
        {
            control = items[i];
            control.initBoxModel(width, height);
            control.measure(size, height, false, false, true, true);
            control.locate(x, y, 0, height, container);
            
            value = spacing / weight | 0;
            
            x += control.offsetWidth + value;
            
            spacing -= value;
            weight--;
        }
    };
    
    
});

