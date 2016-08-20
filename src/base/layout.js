
//子布局
$class('Sublayout', flyingon.ILocatable, function (base) {
       
    
    //内边距
    this.defineProperty('padding', '0');

    
    //子项占比
    this.defineProperty('scale', 0, {
     
        minValue: 0
    });
    
    
    //布局
    this.defineProperty('layout', null, {
     
        storage: 'this.__layout'
    });
    
    
    //指定默认大小
    this.defaultWidth = this.defaultHeight = 200;
    
        
    
    this.measure = function (autoWidth, autoHeight) {

        var items = this.__items,
            arrange = {
             
                left: 0,
                top: 0,
                width: this.offsetWidth,
                height: this.offsetHeight
            };
        
        this.__layout_.init(arrange, this.padding(), false, false, items[0], items[1], items[2], true);
        
        if (autoWidth)
        {
            this.offsetWidth = arrange.maxWidth;
        }

        if (autoHeight)
        {
            this.offsetHeight = arrange.maxHeight;
        }
    };
    
        
    this.locate = function () {
        
        var items = this.__items,
            x = this.offsetLeft,
            y = this.offsetTop;
        
        //处理定位偏移
        if (items && (x || y))
        {
            var start = items[1],
                end = items[2],
                item;
            
            items = items[0];
            
            while (start <= end)
            {
                if (item = items[start++])
                {
                    item.offsetLeft += x;
                    item.offsetTop += y;
                }
            }
        }
        
        return false;
    };
    
        
    this.serialize = function (writer) {
        
        var cache;
        
        if (cache = this.__storage)
        {
            writer.write_properties('storage', cache);
        }
        
        if (cache = this.__layout)
        {
            writer.write_property('layout', cache);
        }
    };
    
    
    this.deserialize_layout = function (reader, values) {
    
        this.__layout_ = (this.__layout = values) && flyingon.findLayout(values, reader);
    };
    
    
});



//布局基类
$class('Layout', flyingon.Component, function (base, self) {

    

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
            return flyingon.include_var('layout', name, values); //获取或设置当前布局
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


    //子项
    this.defineProperty('subitems', null, {

        storage: 'this.__subitems',
        set: 'this.__subitems_ = !!value;'
    });

    
    //子布局
    this.defineProperty('sublayouts', null, {
       
        storage: 'this.__sublayouts',
        set: 'this.__sublayouts_ = !!value;'
    });
    

    //自适应布局
    this.defineProperty('adaptation', null, {

        storage: 'this.__adaptation',
        set: 'this.__adaptation_ = !!value;'
    });

        
        
    //初始化排列
    this.init = function (arrange, padding, hscroll, vscroll, items, start, end, sublayout) {
        
        var index = items.length;
        
        if (start === void 0 || start < 0)
        {
            start = 0;
        }
        
        if (end === void 0 || end >= index)
        {
            end = index - 1;
        }

        if (end >= start)
        {
            var layout = this.__adaptation_,
                values;
            
            if (layout)
            {
                if (layout === true)
                {
                    layout = parse_expression(this.__adaptation, values = []);
                    layout = this.__adaptation_ = new Function('width', 'height', layout);
                    layout.values = values;
                }
                else
                {
                    values = layout.values;
                }

                index = layout(arrange.width, arrange.height);

                if ((layout = values[index]) && !layout['flyingon.Layout'])
                {
                    layout = values[index] = flyingon.findLayout(layout);
                }
            }

            arrange_items(layout || this, arrange, padding, hscroll, vscroll, items, start, end, sublayout);
            
            return true;
        }
    };
    
      
    //内部排列方法
    function arrange_items(layout, arrange, padding, hscroll, vscroll, items, start, end, sublayout) {

        var sublayouts = layout.__sublayouts_,
            subitems,
            values,
            cache;
                
        //初始化排列参数
        if (padding)
        {
            if (padding === '0')
            {
                padding = null;
            }
            else
            {
                padding = pixel_sides(padding);
                
                arrange.left += padding.left;
                arrange.top += padding.top;
                arrange.width -= padding.width;
                arrange.height -= padding.height;
            }
        }
        
        arrange.right = arrange.left + arrange.width;
        arrange.bottom = arrange.top + arrange.height;
        arrange.maxWidth = arrange.left;
        arrange.maxHeight = arrange.top;
        
        arrange.spacingX = pixel(layout.spacingX());
        arrange.spacingY = pixel(layout.spacingY());
        
                
        //处理子布局(注:子布局不支持镜象,由上层布局统一处理)
        if (sublayouts)
        {
            if (sublayouts === true)
            {
                sublayouts = layout.__sublayouts_ = init_sublayouts(layout.__sublayouts);
            }
 
            //分配置子布局子项
            allot_sublayouts(sublayouts, items, start, end);
            
            //最后布局索引
            cache = sublayouts.length - 1;
            
            //排列
            layout.arrange(arrange, hscroll, vscroll, sublayouts, 0, cache);
        }
        else
        {
            //处理强制子项值
            if (subitems = layout.__subitems_)
            {
                if (subitems === true)
                {
                    subitems = layout.__subitems_ = init_subitems(layout.__subitems);
                }

                if (cache = subitems.each)
                {
                    values = cache.values;
                }

                for (i = start; i <= end; i++)
                {
                    items[i].__location_values = cache && values[cache(i - start, items[i])] || subitems;
                }
            }
            else if (items[0].__location_values) //清空原有强制子项属性
            {
                for (i = start; i <= end; i++)
                {
                    items[i].__location_values = null;
                }
            }
            
            //排列
            layout.arrange(arrange, hscroll, vscroll, items, start, end);
        }
        
        //非子布局
        if (!sublayout)
        {
            //处理内容区大小
            if (padding)
            {
                arrange.maxWidth += padding.right;
                arrange.maxHeight += padding.bottom;
            }
            
            //镜像处理(注:子布局不支持镜象,由上层布局统一处理)
            if ((cache = layout.mirror()) !== 'none')
            {
                arrange_mirror(arrange, padding, cache, items, start, end);
            }
        }
    };
    
    
    //翻译布局表达式
    function parse_expression(data, values) {

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
    function init_sublayouts(values) {
        
        var index = values.length;
        
        if (!index)
        {
            values = [values];
            index = 1;
        }
        
        var reader = flyingon.SerializeReader,
            sublayouts = new Array(values.length),
            fixed = 0,
            weight = 0,
            layout,
            cache;
        
        while (cache = values[--index])
        {
            (layout = sublayouts[index] = new flyingon.Sublayout()).deserialize(reader, cache);
            
            if ((cache = layout.scale()) > 1)
            {
                fixed += cache | 0;
            }
            else
            {
                weight += cache;
            }
        }
        
        sublayouts.fixed = fixed;
        sublayouts.weight = weight;
        
        return sublayouts;
    };
    
    
    //分配子布局子项
    function allot_sublayouts(sublayouts, items, start, end) {
        
        var all = end - start + 1 - sublayouts.fixed,
            weight = sublayouts.weight;
        
        if (all < 0)
        {
            all = 0;
        }
        
        for (var i = 0, _ = sublayouts.length; i < _; i++)
        {
            var layout = sublayouts[i],
                scale = layout.scale(),
                length = scale;
            
            if (scale < 1)
            {
                length = scale > 0 ? all * scale / weight | 0 : all;
                
                weight -= scale;
                all -= length;
            }

            layout.__items = [items, start, (start += length) - 1];
        }
    };
    
        
    //初始化强制子项
    function init_subitems(values) {
        
        var subitems = flyingon.create(null),
            cache;
        
        for (cache in values)
        {
            subitems[cache] = values[cache];
        }
        
        if (cache = subitems.each)
        {
            var fn = function () {},
                extend = flyingon.extend;
                
            fn.prototype = subitems;
            
            cache = parse_expression(cache, values = []);
            (subitems.each = new Function('index', 'item', cache)).values = values;

            for (var i = values.length - 1; i >= 0; i--)
            {
                values[i] = extend(new fn(), values[i]);
            }
        }
        
        return subitems;
    };
    
    
    //镜象排列
    function arrange_mirror(arrange, padding, mirror, items, start, end) {

        var max = Math.max,
            width = max(arrange.right + (padding && padding.right || 0), arrange.maxWidth),
            height = max(arrange.bottom + (padding && padding.bottom || 0), arrange.maxHeight),
            item;
        
        switch (mirror)
        {
            case 'x':
                for (var i = start; i <= end; i++)
                {
                    (item = items[i]).offsetTop = height - item.offsetTop - item.offsetHeight;
                }
                break;

            case 'y':
                for (var i = start; i <= end; i++)
                {
                    (item = items[i]).offsetLeft = width - item.offsetLeft - item.offsetWidth;
                }
                break;

            case 'center':
                for (var i = start; i <= end; i++)
                {
                    item = items[i];
                    item.offsetLeft = width - item.offsetLeft - item.offsetWidth;
                    item.offsetTop = height - item.offsetTop - item.offsetHeight;
                }
                break;
        }
    };
    

    
    //排列布局
    this.arrange = function (arrange, hscroll, vscroll, items, start, end) {

    };
    
    
    //重排
    this.rearrange = function (arrange, hscroll, vscroll, items, start, end) {
      
        var rearrange = false;
        
        if (hscroll && (hscroll === 1 || arrange.maxWidth > arrange.right))
        {
            arrange.height -= flyingon.hscroll_height;
            hscroll = false;
            rearrange = true;
        }
        
        if (vscroll && (vscroll === 1 || arrange.maxHeight > arrange.bottom))
        {
            arrange.width -= flyingon.vscroll_width;
            vscroll = false;
            rearrange = true;
        }
        
        if (rearrange)
        {
            arrange.right = arrange.left + arrange.width;
            arrange.bottom = arrange.top + arrange.height;
            arrange.maxWidth = arrange.left;
            arrange.maxHeight = arrange.top;

            this.arrange(arrange, hscroll, vscroll, items, start, end);
            return true;
        }
    };
    
    
    
    //获取控件margin值, 如果控件不可见则返回null
    this.margin = function (control, arrange) {
        
        var storage = control.__storage,
            value;
        
        if (storage && !storage.visible)
        {
            return null;
        }
        
        value = control.__location_values;
        value = value && (value = value.margin) || (storage || control.__defaults).margin;
        
        return pixel_sides(value, arrange.width);
    };
    
        
    //测量控件大小
    //control           要测量的控件
    //arrange           排列参数
    //margin            外边距
    //available_width   可用宽度 
    //available_height  可用高度
    //less_width        宽度不足时的宽度 true:默认宽度 正整数:指定宽度 其它:0
    //less_height       高度不足时的高度 true:默认高度 正整数:指定高度 其它:0
    //defaultWidth      默认宽度 true:可用宽度 正整数:指定宽度 其它:0
    //defaultHeight     默认高度 true:可用高度 正整数:指定高度 其它:0
    this.measure = function (control, arrange, margin, available_width, available_height, less_width, less_height, defaultWidth, defaultHeight) {
        
        var storage = control.__storage || control.__defaults,
            values = control.__location_values,
            fn = pixel,
            arrange_width = arrange.width,
            arrange_height = arrange.height,
            width,
            height,
            minWidth,
            maxWidth,
            minHeight,
            maxHeight,
            autoWidth,
            autoHeight;

        minWidth = fn((values && values.minWidth) || storage.minWidth, arrange_width);
        maxWidth = fn((values && values.maxWidth) || storage.maxWidth, arrange_width);
        minHeight = fn((values && values.minHeight) || storage.minHeight, arrange_height);
        maxHeight = fn((values && values.maxHeight) || storage.maxHeight, arrange_height);

        //校验最小宽度
        if (minWidth < 0)
        {
            minWidth = 0;
        }

        //校验最大宽度
        if (maxWidth < minWidth)
        {
            maxWidth = minWidth;
        }

        //校验最小高度
        if (minHeight < 0)
        {
            minHeight = 0;
        }

        //检验最大高度
        if (maxHeight < minHeight)
        {
            maxHeight = minHeight;
        }
        
        //处理宽度
        switch (width = (values && values.width) || storage.width)
        {
            case 'default': //默认
                width = defaultWidth || control.defaultWidth;
                break;

            case 'fill': //充满可用区域
                width = true;
                break;

            case 'auto': //根据内容自动调整大小
                width = autoWidth = true;
                break;
                
            default:
                width = pixel(width, arrange_width);
                break;
        }
        
        //充满可用宽度
        if (width === true)
        {
            if ((available_width -= margin.width) > 0) //有可用空间
            {
                width = available_width;
            }
            else if (less_width === true) //可用空间不足时使用默认宽度
            {
                width = control.defaultWidth;
            }
            else //无空间
            {
                width = less_width || 0;
            }
        }

        //处理高度
        switch (height = (values && values.height) || storage.height)
        {
            case 'default': //自动
                height = defaultHeight || control.defaultHeight;
                break;

            case 'fill': //充满可用区域
                height = true;
                break;

            case 'auto': //根据内容自动调整大小
                height = autoHeight = true;
                break;

            default:  //其它值
                height = pixel(height, arrange_height);
                break;
        }
        
        //充满可用高度
        if (height === true)
        {
            if ((available_height -= margin.height) > 0) //有可用空间
            {
                height = available_height;
            }
            else if (less_height === true) //可用空间不足时使用默认高度
            {
                height = control.defaultHeight;
            }
            else //无空间
            {
                height = less_height || 0;
            }
        }

        //处理最小及最大宽度
        if (width < minWidth)
        {
            width = minWidth;
        }
        else if (maxWidth > 0 && width > maxWidth)
        {
            width = maxWidth;
        }
        
        //处理最小及最大高度
        if (height < minHeight)
        {
            height = minHeight;
        }
        else if (maxHeight > 0 && height > maxHeight)
        {
            height = maxHeight;
        }
        
        //设置大小
        control.offsetWidth = width;
        control.offsetHeight = height;
        
        //测量后处理
        if (control.measure(autoWidth, autoHeight) !== false)
        {
            //处理最小及最大宽度
            if (control.offsetWidth !== width)
            {
                if ((width = control.offsetWidth) < minWidth)
                {
                    control.offsetWidth = minWidth;
                }
                else if (maxWidth > 0 && width > maxWidth)
                {
                    control.offsetWidth = maxWidth;
                }
            }

            //处理最小及最大高度
            if (control.offsetHeight !== height)
            {
                if ((height = control.offsetHeight) < minHeight)
                {
                    control.offsetHeight = minHeight;
                }
                else if (maxHeight > 0 && height > maxHeight)
                {
                    control.offsetHeight = maxHeight;
                }
            }
        }
    };
    
    
    //定位控件
    this.locate = function (control, arrange, margin, x, y, align_width, align_height) {
        
        var width = control.offsetWidth,
            height = control.offsetHeight,
            value;

        if (align_width > 0 && (value = align_width - width))
        {
            switch (control.locationValue('alignX'))
            {
                case 'center':
                    x += value >> 1;
                    break;

                case 'right':
                    x += value;
                    break;
                    
                default:
                    x += margin.left;
                    break;
            }
        }
        else
        {
            x += margin.left;
        }

        if (align_height > 0 && (value = align_height - height))
        {
            switch (control.locationValue('alignY'))
            {
                case 'middle':
                    y += value >> 1;
                    break;

                case 'bottom':
                    y += value;
                    break;
                    
                default:
                    y += margin.top;
                    break;
            }
        }
        else
        {
            y += margin.top;
        }
        
        control.offsetLeft = x;
        control.offsetTop = y;
        
        if (control.locate() !== false)
        {
            x = control.offsetLeft;
            y = control.offsetTop;
        }
        
        arrange.x = x = x + width + margin.right;
        arrange.y = y = y + height + margin.bottom;
        
        if (x > arrange.maxWidth)
        {
            arrange.maxWidth = x;
        }
        
        if (y > arrange.maxHeight)
        {
            arrange.maxHeight = y;
        }
    };
    
    
    
    //序列化方法
    this.serialize = function (writer) {

        var cache;

        writer.write_property('type', this.type);

        if (cache = this.__storage)
        {
            writer.write_properties('storage', cache);
        }
        
        if (cache = this.__subitems)
        {
            writer.write_property('subitems', cache);
        }

        if (cache = this.__sublayouts)
        {
            writer.write_property('sublayouts', cache);
        }
        
        if (cache = this.__adaptation)
        {
            writer.write_property('adaptation', cache);
        }
    };

    
    //设置不反序列化type属性
    this.deserialize_type = true;
    
            

    this.__class_init = function (Class) {

        if (self !== this)
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
    this.arrange = function (arrange, hscroll, vscroll, items, start, end) {

        var x = arrange.left,
            y = arrange.top,
            width = arrange.width,
            height = arrange.height,
            right = x + width,
            spacingX = arrange.spacingX,
            control,
            margin;
        
        //先按无滚动条的方式排列
        for (var i = start; i <= end; i++)
        {
            if (margin = this.margin(control = items[i], arrange))
            {
                this.measure(control, arrange, margin, right > x ? right - x : width, height, true);
                this.locate(control, arrange, margin, x, y, 0, height);
                
                if (hscroll && arrange.maxWidth > right)
                {
                    return this.rearrange(arrange, 1, false, items, start, end);
                }
                
                x = arrange.x + spacingX;
            }
        }
    };
    
    
});



//纵向单列布局类
$class(flyingon.Layout, function (base) {


    this.type = 'vertical-line';
    
        
    //排列布局
    this.arrange = function (arrange, hscroll, vscroll, items, start, end) {

        var x = arrange.left,
            y = arrange.top,
            width = arrange.width,
            height = arrange.height,
            bottom = y + height,
            spacingY = arrange.spacingY,
            control,
            margin;
        
        //先按无滚动条的方式排列
        for (var i = start; i <= end; i++)
        {
            if (margin = this.margin(control = items[i], arrange))
            {
                this.measure(control, arrange, margin, width, bottom > y ? bottom - height : height, 0, true);
                this.locate(control, arrange, margin, x, y, width, 0);
                
                if (vscroll && arrange.maxHeight > bottom)
                {
                    return this.rearrange(arrange, false, 1, items, start, end);
                }
                
                y = arrange.y + spacingY;
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
    flyingon.locateProperty('newline', false);
    
    
    //排列布局
    this.arrange = function (arrange, hscroll, vscroll, items, start, end) {

        var x = arrange.left,
            y = arrange.top,
            width = arrange.width,
            height = arrange.height,
            right = x + width,
            bottom = y + height,
            spacingX = arrange.spacingX,
            spacingY = arrange.spacingY,
            lineHeight = flyingon.pixel(this.lineHeight(), height),
            left = x,
            control,
            margin;

        for (var i = start; i <= end; i++)
        {
            if (margin = this.margin(control = items[i], arrange))
            {
                this.measure(control, arrange, margin, right > x ? right - x : width, lineHeight, width);
                
                //处理换行
                if (x > left && (x + control.offsetWidth + margin.right > right || control.locationValue('newline')))
                {
                    x = left;
                    y = (lineHeight ? y + lineHeight : arrange.maxHeight) + spacingY;
                }
                
                this.locate(control, arrange, margin, x, y, 0, lineHeight);

                //出现滚动条后重排
                if (vscroll && arrange.maxHeight > bottom)
                {
                    return this.rearrange(arrange, false, 1, items, start, end);
                }
   
                x = arrange.x + spacingX;
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
    this.arrange = function (arrange, hscroll, vscroll, items, start, end) {

        var x = arrange.left,
            y = arrange.top,
            width = arrange.width,
            height = arrange.height,
            right = x + width,
            bottom = y + height,
            spacingX = arrange.spacingX,
            spacingY = arrange.spacingY,
            lineWidth = flyingon.pixel(this.lineWidth(), width),
            top = y,
            control,
            margin;

        for (var i = start; i <= end; i++)
        {
            if (margin = this.margin(control = items[i], arrange))
            {
                this.measure(control, arrange, margin, lineWidth, bottom > y ? bottom - y : height, 0, height);
                
                //处理换行
                if (y > top && (y + control.offsetHeight + margin.bottom > bottom || control.locationValue('newline')))
                {
                    x = (lineWidth ? x + lineWidth : arrange.maxWidth) + spacingX;
                    y = top;
                }
                
                this.locate(control, arrange, margin, x, y, lineWidth, 0);

                //出现滚动条后重排
                if (hscroll && arrange.maxWidth > right)
                {
                    return this.rearrange(arrange, 1, false, items, start, end);
                }
   
                y = arrange.y + spacingY;
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
    flyingon.locateProperty('dock', 'left');

    
    //排列布局
    this.arrange = function (arrange, hscroll, vscroll, items, start, end) {

        var x = arrange.left,
            y = arrange.top,
            width = arrange.width,
            height = arrange.height,
            right = x + width,
            bottom = y + height,
            spacingX = arrange.spacingX,
            spacingY = arrange.spacingY,
            list,
            control,
            margin;

        for (var i = start; i <= end; i++)
        {
            if (margin = this.margin(control = items[i], arrange))
            {
                switch (control.locationValue('dock'))
                {
                    case 'left':
                        this.measure(control, arrange, margin, width, height, true, false, false, true);
                        this.locate(control, arrange, margin, x, y, 0, height);
                        
                        width = right - (x = arrange.x + spacingX);
                        break;

                    case 'top':
                        this.measure(control, arrange, margin, width, height, false, true, true);
                        this.locate(control, arrange, margin, x, y, width, 0);
                        
                        height = bottom - (y = arrange.y + spacingY);
                        break;

                    case 'right':
                        this.measure(control, arrange, margin, width, height, true, false, false, true);
                        this.locate(control, arrange, margin, right - control.offsetWidth - margin.width, y, 0, height);
                        
                        width = (right = control.offsetLeft - margin.left - spacingX) - x;
                        break;

                    case 'bottom':
                        this.measure(control, arrange, margin, width, height, true, false, true);
                        this.locate(control, arrange, margin, x, bottom - control.offsetHeight - margin.height, width, 0);
                        
                        height = (bottom = control.offsetTop - margin.top - spacingY) - y;
                        break;

                    default:
                        (list || (list = [])).push(control, margin);
                        continue;
                }
            }
        }
        
        //排列充满项
        if (list)
        {
            for (var i = 0, _ = list.length; i < _; i++)
            {
                this.measure(control = list[i++], arrange, margin = list[i], width, height, false, false, true, true);
                this.locate(control, arrange, margin, x, y, width, height);
            }
        }
        
        //检查是否需要重排
        if (hscroll || vscroll)
        {
            this.rearrange(arrange, hscroll, vscroll, items, start, end);
        }
    };
        
    
});



//层叠布局类
$class(flyingon.Layout, function (base) {


    this.type = 'cascade';
    
    
    //排列布局
    this.arrange = function (arrange, hscroll, vscroll, items, start, end) {

        var x = arrange.left,
            y = arrange.top,
            width = arrange.width,
            height = arrange.height,
            control,
            margin;

        for (var i = start; i <= end; i++)
        {
            if (margin = this.margin(control = items[i], arrange))
            {
                this.measure(control, arrange, margin, width, height);
                this.locate(control, arrange, margin, x, y, width, height);
            }
        }
        
        //检查是否需要重排
        if (hscroll || vscroll)
        {
            this.rearrange(arrange, hscroll, vscroll, items, start, end);
        }
    };
    
    
});



//绝对定位布局类
$class(flyingon.Layout, function (base) {


    this.type = 'absolute';
    
    
    //排列布局
    this.arrange = function (arrange, hscroll, vscroll, items, start, end) {

        var x = arrange.left,
            y = arrange.top,
            control,
            margin;

        for (var i = start; i <= end; i++)
        {
            if (margin = this.margin(control = items[i], arrange))
            {
                this.measure(control, arrange, margin, 0, 0, true, true);
                this.locate(control, arrange, margin, x + control.locationValue('left'), y + control.locationValue('top'));
            }
        }
    };
    
    
});



//表格布局类
$class(flyingon.Layout, function (base) {

        
    //行列格式: row[column ...] ... row,column可选值: 
    //整数            固定行高或列宽 
    //数字+%          总宽度或高度的百分比 
    //数字+*          剩余空间的百分比, 数字表示权重, 省略时权重默认为100
    //数字+css单位    指定单位的行高或列宽
    //列可嵌套表或表组 表或表组可指定参数
    //参数集: <name1=value1 ...>   多个参数之间用逗号分隔
    //嵌套表: {<参数集> row[column ...] ...} 参数集可省略
    //示例(九宫格正中内嵌九宫格,留空为父表的一半): '*[* * *] *[* *{(50% 50%) L*[* * *]^3} *] *[* * *]'
    
    
    var parse_cache = flyingon.create(null),
        
        regex_loop = /L([^L\^]+)\^(\d+)/g,
                
        regex_parse = /[*%.!\w]+|[\[\]{}()]/g,
        
        pixel = flyingon.pixel,
        
        parse = parseFloat;
    
    
    
    this.type = 'table';

    
    //是否按纵向开始拆分
    this.defineProperty('vertical', false);

    
    //头部区域
    this.defineProperty('header', '', {
    
        set: 'this.__header = null;'
    });
    
    
    //内容区域
    this.defineProperty('body', '*[* * *]', {
     
        set: 'this.__body = null;'
    });

    
    //循环内容区域
    this.defineProperty('loop', 3, {
       
        dataType: 'object'
    });
    
    
    //尾部区域
    this.defineProperty('footer', '', {
       
        set: 'this.__footer = null;'
    });


    
    //排列布局
    this.arrange = function (arrange, hscroll, vscroll, items, start, end) {

        var header = this.header(),
            body = this.__body || (this.__body = parse(this.body())),
            loop = this.loop(),
            footer = this.footer(),
            total;
        
        header && (header = this.__header || (this.__header = parse(header)));
        footer && (footer = this.__footer || (this.__footer = parse(footer)));
        
        
    };

        
            
    //单元格类
    var item_type = $class(function () {

        //比例
        this.scale = 0;
        
        //单位
        this.unit = '';
        
        //是否可用
        this.enabled = true;
        
        //子项
        this.items = null;
        
        
        //开始位置
        this.start = 0;
        
        //大小
        this.size = 0;
        
        
        this.clone = function () {
            
            var target = new this.Class();
            
            target.scale = this.scale;
            target.unit = this.unit;
            target.enabled = this.enabled;
            
            if (this.items)
            {
                target.items = this.items.clone();
            }
            
            return target;
        };

    });


    //单元格集合类
    var items_type = $class(Array, function () {

        
        //是否竖直切分
        this.vertical = false;
        
        //水平间距
        this.spacingX = '100%';
        
        //竖直间距
        this.spacingY = '100%';
        
        
        //固定子项大小合计
        this.values = 0;
        
        //余量权重合计
        this.weight = 0;
        
        //百分比合计
        this.percent = 0;
        
        
        //开始位置
        this.start = 0;
        
        //大小
        this.size = 0;
        
        
        this.compute = function (width, height, spacingX, spacingY) {
          
            
        };
        
                
        this.clone = function () {
          
            var target = new this.Class();
            
            target.vertical = this.vertical;
            target.spacingX = this.spacingX;
            target.spacingY = this.spacingY;
            target.values = this.values;
            target.weight = this.weight;
            target.percent = this.percent;
            
            for (var i = 0, _ = this.length; i < _; i++)
            {
                target.push(this[i].clone());
            }
            
            return target;
        };

    });
    
    
    function parse(layout, text) {
        
        var items = parse_cache[text],
            tokens;
        
        if (items)
        {
            return items.clone();
        }
        
        items = new items_type();
        tokens = parse_loop(text).match(regex_parse);
        
        if (tokens)
        {
            items.vertical = tokens[0] === '{';
            parse_items(items, tokens, 0, items.vertical ? '}' : ']');
        }

        return parse_cache[text] = items;
    };
    
    
    function parse_loop(text) {
    
        var regex = regex_loop,
            loop;
        
        function fn(_, text, length) {
            
            var items = [];
            
            do
            {
                items.push(text);
            }
            while (--length > 0);
            
            loop = true;
            
            return items.join(' ');
        };
        
        do
        {
            loop = false;
            text = text.replace(regex, fn);
        }
        while (loop);
        
        return text;
    };
    
    
    function parse_items(items, tokens, index, end) {
      
        var item, token;
        
        while (token = tokens[index++])
        {
            switch (token)
            {
                case '[':
                    token = new items_type();
                    token.vertical = true;
                    index = parse_items(item ? (item.items = token) : token, tokens, index, ']');
                    break;

                case '{':
                    token = new items_type();
                    index = parse_items(item ? (item.items = token) : token, tokens, index, '}');
                    break;
                    
                case '(':
                    index = parse_parameters(items, tokens, index);
                    break;

                case end:
                    return index;

                default:
                    item = parse_item(items, token) || item;
                    break;
            }
        }
        
        return index;
    };
    
    
    function parse_item(items, token) {
      
        var item = new item_type(), 
            value;
        
        if (token.indexOf('!') >= 0)
        {
            item.enabled = false;
            token = token.replace('!', '');   
        }
        
        if (token === '*')
        {
            item.scale = 100;
            item.unit = '*';
            items.weight += 100;
        }
        else if ((value = parse(token)) === value) //可转为有效数字
        {
            switch (item.unit = token.replace(value, ''))
            {
                case '*':
                    items.weight += value;
                    break;
                    
                case '%':
                    items.percent += value;
                    break;
                    
                default:
                    value = pixel(token);
                    items.values += value;
                    break;
            }
            
            item.scale = value;
        }
        else
        {
            return;
        }
        
        items.push(item);
        return item;
    };
    
    
    function parse_parameters(items, tokens, index) {
        
        var token, x;
        
        while (token = tokens[index++])
        {
            if (token === ')')
            {
                return index;
            }
            
            if (x !== 0)
            {
                if (token.indexOf('%') < 0)
                {
                    token = pixel(token) | 0;
                }
                
                items.spacingY = token;
                
                if (x)
                {
                    x = 0;
                }
                else
                {
                    items.spacingX = token;
                    x = 1;
                }
            }
        }
    };
    

});

