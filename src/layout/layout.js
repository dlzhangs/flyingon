
//布局基类
$class('Layout', function () {

    

    var registry_list = flyingon.create(null), //注册的布局列表
        
        layouts = flyingon.create(null), //已定义的布局集合

        pixel = flyingon.pixel,
        
        pixel_sides = flyingon.pixel_sides;
    
    
            
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
    
    
    //获取布局定义
    flyingon.findLayout = function (key, reader) {
      
        if (typeof (key = key || 'flow') === 'string')
        {
            key = layouts[key] || layouts.flow;
            return key[1] || (key[1] = deserialize_layout(reader, key[0]));
        }
        
        return deserialize_layout(reader, key);
    };
    
    
    function deserialize_layout(reader, values) {
      
        var layout = new (values && registry_list[values.type] || registry_list.flow)();

        layout.deserialize(reader || flyingon.SerializeReader.instance, values);
        return layout;
    };
    
    

    //布局类型
    this.type = null;

    
    
    //布局间隔宽度
    //length	规定以具体单位计的值 比如像素 厘米等
    //number%   控件客户区宽度的百分比
    this.defineProperty('spacingX', '0');

    //布局间隔高度
    //length	规定以具体单位计的值 比如像素 厘米等
    //number%   控件客户区高度的百分比
    this.defineProperty('spacingY', '0');

   
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
    this.defineProperty('partition', null, {
       
        set: 'this.__layouts = !!value;'
    });
    

    //自适应
    this.defineProperty('adaption', null, {

        set: 'this.__adaption = !!value;'
    });

        
        
    //初始化排列
    this.init = function (control, items, hscroll, vscroll, sublayout) {
        
        var box = control.viewBox,
            layout,
            border,
            padding,
            cache;
        
        if (box)
        {
            border = box.border;
            padding = box.padding;

            box.arrangeLeft = box.contentWidth = padding.left;
            box.arrangeTop = box.contentHeight = padding.top;

            box.clientWidth = (cache = box.offsetWidth - border.width - padding.width) > 0 ? cache : 0;
            box.clientHeight = (cache = box.offsetHeight - border.height - padding.height) > 0 ? cache : 0;
            
            //自定义调整排列区域
            if (cache = control.arrangeArea)
            {
                cache.call(control, box);
            }
        }
        else
        {
            return;
        }
        
        if (items && items.length > 0)
        {
            if (layout = this.__adaption)
            {
                if (layout === true)
                {
                    layout = complie(this.adaption(), cache = []);
                    layout = this.__adaption = new Function('width', 'height', layout);
                    layout.values = cache;
                }
                else
                {
                    cache = layout.values;
                }

                var index = layout(box.offsetWidth, box.offsetHeight);

                if ((layout = cache[index]) && !layout['flyingon.Layout'])
                {
                    layout = cache[index] = flyingon.findLayout(layout);
                }
            }

            arrange(layout || this, box, items, hscroll, vscroll, sublayout);
            
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
            
            return true;
        }
    };
    
      
    //内部排列方法
    function arrange(layout, container, items, hscroll, vscroll, sublayout) {

        var layouts = layout.__layouts,
            location,
            cache;
                            
        //处理子布局(注:子布局不支持镜象,由上层布局统一处理)
        if (layouts)
        {
            if (layouts === true)
            {
                layouts = layout.__layouts = init_layouts(layout.partition());
            }
 
            //分配置子布局子项
            allot_layouts(layouts, items);
            
            //排列
            layout.arrange(container, layouts, hscroll, vscroll);
            
            //清除子项缓存
            for (var i = layouts.length - 1; i >= 0; i--)
            {
                layouts[i].__children = null;
            }
        }
        else
        {
            //处理强制子项值
            if (location = layout.__location)
            {
                if (location === true)
                {
                    location = layout.__location = init_location(layout.location());
                }

                cache = location.condition;

                for (var i = items.length - 1; i >= 0; i--)
                {
                    items[i].__location_values = cache && location[cache(i, items[i])] || location;
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
        }
        
        //非子布局 镜像处理(注:子布局不支持镜象,由上层布局统一处理)
        if (!sublayout && (cache = layout.mirror()) !== 'none')
        {
            arrange_mirror(container, cache, items);
        }
    };
    
    
    //编译表达式
    function complie(data, values) {

        var writer = [],
            index = 0,
            name;

        //如果是数组则第一个参数为var或switch, 第二个参数为表达式, 最后一个是布局
        if (name = data['switch'])
        {
            writer.push('switch ("" + (' + name + '))\n{\n');

            for (name in data)
            {
                if (name !== 'switch')
                {
                    writer.push('case "' + name + '": return ' + index + ';\n');
                    values[index++] = data[name];
                }
            }

            writer.push('}\n');
        }
        else
        {
            for (name in data)
            {
                writer.push('if (' + name + ') return ' + index + ';\n'); 
                values[index++] = data[name];
            }
        }

        return writer.join('');
    };

    
    //初始化子布局
    function init_layouts(values) {
        
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
            
            scale = layout.scale();

            if (layout.fixed = cache = scale | 0)
            {
                fixed += cache;
            }
            
            if (layout.weight = cache = scale - cache)
            {
                weight += cache;
            }
        }
        
        layouts.fixed = fixed;
        layouts.weight = weight;
        
        return layouts;
    };
    
    
    //分配子布局子项
    function allot_layouts(layouts, items) {
        
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
    
        
    //初始化子项定位属性值
    function init_location(values) {
        
        var location = flyingon.create(null),
            cache;
        
        for (cache in values)
        {
            location[cache] = values[cache];
        }
        
        if (cache = location.condition)
        {
            var fn = function () {},
                extend = flyingon.extend;
                
            fn.prototype = location;
            
            cache = complie(cache, values = []);
            (location.condition = new Function('index', 'item', cache)).values = values;

            for (var i = values.length - 1; i >= 0; i--)
            {
                location[i] = extend(new fn(), values[i]);
            }
        }
        
        return location;
    };
    
    
    //镜象排列
    function arrange_mirror(container, padding, mirror, items) {

        var padding = container.padding,
            max = Math.max,
            width = max(container.clientWidth, container.contentWidth),
            height = max(container.clientHeight, container.contentHeight),
            length = items.length,
            box;
        
        switch (mirror)
        {
            case 'x':
                for (var i = 0; i < length; i++)
                {
                    if (box = items[i].viewBox)
                    {
                        box.offsetTop = height - box.offsetTop - box.offsetHeight;
                    }
                }
                break;

            case 'y':
                for (var i = 0; i < length; i++)
                {
                    if (box = items[i].viewBox)
                    {
                        box.offsetLeft = width - box.offsetLeft - box.offsetWidth;
                    }
                }
                break;

            case 'center':
                for (var i = 0; i < length; i++)
                {
                    if (box = items[i].viewBox)
                    {
                        box.offsetLeft = width - box.offsetLeft - box.offsetWidth;
                        box.offsetTop = height - box.offsetTop - box.offsetHeight;
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
                layouts[type] = [{ type: type, spacingX: 2, spacingY: 2 }, null];
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
            control,
            box;
        
        //先按无滚动条的方式排列
        for (var i = 0, l = items.length; i < l; i++)
        {
            if (box = (control = items[i]).initViewBox(width, height))
            {
                control.measure(box, right > x ? right - x : width, height, true);
                control.locate(box, x, y, 0, height, container);
                
                if (hscroll && container.contentWidth > right)
                {
                    return this.rearrange(container, items, 1, false);
                }
                
                x = container.arrangeX + spacingX;
            }
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
            control,
            box;
        
        //先按无滚动条的方式排列
        for (var i = 0, l = items.length; i < l; i++)
        {
            if (box = (control = items[i]).initViewBox(width, height))
            {
                control.measure(box, width, bottom > y ? bottom - height : height, 0, true);
                control.locate(box, x, y, width, 0, container);
                
                if (vscroll && container.contentHeight > bottom)
                {
                    return this.rearrange(container, items, false, 1);
                }
                
                y = container.arrangeY + spacingY;
            }
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
            control,
            box;

        for (var i = 0, l = items.length; i < l; i++)
        {
            if (box = (control = items[i]).initViewBox(width, height))
            {
                control.measure(box, right > x ? right - x : width, lineHeight, width);
                
                //处理换行
                if (x > left && (x + box.offsetWidth + box.margin.right > right || control.locationValue('newline')))
                {
                    x = left;
                    y = (lineHeight ? y + lineHeight : container.contentHeight) + spacingY;
                }
                
                control.locate(box, x, y, 0, lineHeight, container);

                //出现滚动条后重排
                if (vscroll && container.contentHeight > bottom)
                {
                    return this.rearrange(container, items, false, 1);
                }
   
                x = container.arrangeX + spacingX;
            }
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
            control,
            box;

        for (var i = 0, l = items.length; i < l; i++)
        {
            if (box = (control = items[i]).initViewBox(width, height))
            {
                control.measure(box, lineWidth, bottom > y ? bottom - y : height, 0, height);
                
                //处理换行
                if (y > top && (y + box.offsetHeight + box.margin.bottom > bottom || control.locationValue('newline')))
                {
                    x = (lineWidth ? x + lineWidth : container.contentWidth) + spacingX;
                    y = top;
                }
                
                control.locate(box, x, y, lineWidth, 0, container);

                //出现滚动条后重排
                if (hscroll && container.contentWidth > right)
                {
                    return this.rearrange(container, items, 1, false);
                }
   
                y = container.arrangeY + spacingY;
            }
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
            control,
            box;

        for (var i = 0, l = items.length; i < l; i++)
        {
            if (box = (control = items[i]).initViewBox(clientWidth, clientHeight))
            {
                switch (control.locationValue('dock'))
                {
                    case 'left':
                        control.measure(box, width, height, true, false, false, true);
                        control.locate(box, x, y, 0, height, container);
                        
                        width = right - (x = container.arrangeX + spacingX);
                        break;

                    case 'top':
                        control.measure(box, width, height, false, true, true);
                        control.locate(box, x, y, width, 0, container);
                        
                        height = bottom - (y = container.arrangeY + spacingY);
                        break;

                    case 'right':
                        control.measure(box, width, height, true, false, false, true);
                        control.locate(box, right -= box.offsetWidth - box.margin.width, y, 0, height, container);
                        
                        width = (right -= spacingX) - x;
                        break;

                    case 'bottom':
                        control.measure(box, width, height, true, false, true);
                        control.locate(box, x, bottom -= box.offsetHeight - box.margin.height, width, 0, container);
                        
                        height = (bottom -= spacingY) - y;
                        break;

                    default:
                        (list || (list = [])).push(control, box);
                        continue;
                }
            }
        }
        
        //排列充满项
        if (list)
        {
            for (var i = 0, l = list.length; i < l; i++)
            {
                control = list[i++];
                box = list[i++];
                control.measure(box, width, height, false, false, true, true);
                control.locate(box, x, y, width, height, container);
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
            control,
            box;

        for (var i = 0, l = items.length; i < l; i++)
        {
            if (box = (control = items[i]).initViewBox(width, height))
            {
                control.measure(box, width, height);
                control.locate(box, x, y, width, height, container);
            }
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
            box,
            left,
            top;

        for (var i = 0, l = items.length; i < l; i++)
        {
            if (box = (control = items[i]).initViewBox(width, height))
            {
                left = x + fn(control.locationValue('left'), width);
                top = y + fn(control.locationValue('top'), height);
                
                control.measure(box, 0, 0, true, true);
                control.locate(box, left, top, 0, 0, container);
            }
        }
    };
    
    
});

