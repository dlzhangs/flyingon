
//子布局
$class('Sublayout', flyingon.ILocatable, function (base) {
       
    
    //扩展容器组件接口
    flyingon.IContainer.call(this);
    
    
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
    
    
    this.measure = function (box) {
    
        base.measure.apply(this, arguments);
        
        this.arrange_range(box.border, box.padding);
        this.arrange();
        
        if (box.width === 'auto')
        {
            this.offsetWidth = this.contentWidth + box.border.width;
        }

        if (box.height === 'auto')
        {
            this.offsetHeight = this.contentHeight + box.border.height;
        }
    };
    
    
    this.arrange = function () {
      
        var items = this.__items;
        this.__layout_.init(this, false, false, items[0], items[1], items[2], true);
    };
    
        
    this.locate = function () {
        
        var cache = base.locate.apply(this, arguments),
            x = this.offsetLeft,
            y = this.offsetTop,
            items, 
            item, 
            start,
            end;
        
        //处理定位偏移
        if (x && y && (items = this.__items))
        {
            start = items[1];
            end = items[2];
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
        
        return cache;
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
        
        Array = window.Array;
        
    
            
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
      
        var layout = new (values && registry_list[values.type] || flyingon.FlowLayout)();

        layout.deserialize(reader || flyingon.SerializeReader.instance, values);
        return layout;
    };
    
    

    //布局类型
    this.type = null;

    
    //定义排列属性方法
    this.arrangeProperty = this.defineProperty;
    

    //定义定位属性方法
    this.locationProperty = function (name, defaultValue, attributes) {

        flyingon.ILocatable.prototype.locationProperty(name, defaultValue, attributes);
    };
    

    
    //是否竖排
    //true      竖排
    //false     横排
    this.arrangeProperty('vertical', false);

    //镜像布局变换
    //none:     不进行镜像变换
    //x:        沿x轴镜像变换
    //y:        沿y轴镜像变换
    //center:   沿中心镜像变换
    this.arrangeProperty('mirror', 'none');

    //布局间隔宽度
    //length	规定以具体单位计的值 比如像素 厘米等
    //number%   控件客户区宽度的百分比
    this.arrangeProperty('spacingX', '0');

    //布局间隔高度
    //length	规定以具体单位计的值 比如像素 厘米等
    //number%   控件客户区高度的百分比
    this.arrangeProperty('spacingY', '0');


    //子项
    this.arrangeProperty('subitems', null, {

        storage: 'this.__subitems',
        set: 'this.__subitems_ = !!value;'
    });

    
    //子布局
    this.arrangeProperty('sublayouts', null, {
       
        storage: 'this.__sublayouts',
        set: 'this.__sublayouts_ = !!value;'
    });
    

    //自适应布局
    this.arrangeProperty('adaptation', null, {

        storage: 'this.__adaptation',
        set: 'this.__adaptation_ = !!value;'
    });

        
    //滚动条大小
    this.hscroll_height = flyingon.hscroll_height;
    
    this.vscroll_width = flyingon.vscroll_width;
    
    
    //计算css单位为象素值方法
    this.pixel = flyingon.pixel;
    
    
    //初始化排列
    this.init = function (container, hscroll, vscroll, items, start, end, sublayout) {
        
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
                    layout = this.__adaptation_ = new Function('container', 'width', 'height', layout);
                    layout.values = values;
                }
                else
                {
                    values = layout.values;
                }

                index = layout(container, container.arrangeWidth, container.arrangeHeight);

                if ((layout = values[index]) && !layout['flyingon.Layout'])
                {
                    layout = values[index] = flyingon.findLayout(layout);
                }
            }

            arrange(layout || this, container, hscroll, vscroll, items, start, end);
        }
    };
    
      
    //内部排列方法
    function arrange(layout, container, hscroll, vscroll, items, start, end, sublayout) {

        var sublayouts = layout.__sublayouts_,
            subitems,
            values,
            cache;
        
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
            layout.arrange(container, hscroll, vscroll, sublayouts, 0, cache, layout.vertical());
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
                    items[i].__location_values = cache && values[cache(i, items[i], container)] || subitems;
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
            layout.arrange(container, hscroll, vscroll, items, start, end, layout.vertical());
        }
        
        //非子布局
        if (!sublayout)
        {
            //处理内容区大小
            if ((cache = container.__boxModel) && (cache = cache.padding))
            {
                container.contentWidth += cache.right;
                container.contentHeight += cache.bottom;
            }
        
            //镜像处理(注:子布局不支持镜象,由上层布局统一处理)
            if ((cache = layout.mirror()) !== 'none')
            {
                arrange_mirror(container, cache, items, start, end);
            }
        }
    };
    
    
    //翻译布局表达式
    function parse_expression(data, values) {

        var writer = [],
            index = 0,
            name;

        //如果是数组则第一个参数为var或switch, 第二个参数为表达式, 最后一个是布局
        if (data instanceof Array)
        {
            if (data[0] === 'var')
            {
                writer.push('var ' + data[1] + ';\n');
                data = data[2];
            }
            else
            {
                writer.push('switch ("" + (' + data[1] + '))\n{\n');
                data = data[2];
                
                for (name in data)
                {
                    writer.push('case "' + name + '": return ' + index + ';\n');
                    values[index++] = data[name];
                }

                writer.push('}\n');
                return writer.join('');
            }
        }

        for (name in data)
        {
            writer.push('if (' + name + ') return ' + index + ';\n'); 
            values[index++] = data[name];
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
            (subitems.each = new Function('index', 'item', 'container', cache)).values = values;

            for (var i = values.length - 1; i >= 0; i--)
            {
                values[i] = extend(new fn(), values[i]);
            }
        }
        
        return subitems;
    };
    
    
    //镜象排列
    function arrange_mirror(container, mirror, items, start, end) {

        var max = Math.max,
            box = container.__boxModel,
            padding = box && box.padding,
            width = max(container.arrangeWidth + (padding && padding.width || 0), container.contentWidth),
            height = max(container.arrangeHeight + (padding && padding.height || 0), container.contentHeight),
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
    this.arrange = function (container, hscroll, vscroll, items, start, end, vertical) {

    };
    
        
    //排列检测
    this.arrange_check = function (maxWidth, maxHeight, data) {
        
        var container = data[0],
            arrange;
        
        //如果超出范围则重排
        if (data[1] && maxWidth > container.arrangeLeft + container.arrangeWidth)
        {
            container.arrangeHeight -= this.hscroll_height;

            data[1] = false;
            arrange = true;
        }
        
        if (data[2] && maxHeight > container.arrangeTop + container.arrangeHeight)
        {
            container.arrangeWidth -= this.vscroll_width;
            
            data[2] = false;
            arrange = true;
        }
        
        if (arrange === true)
        {
            this.arrange.apply(this, data);
        }
        else
        {
            container.contentWidth = maxWidth;
            container.contentHeight = maxHeight;
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
$class('LineLayout', flyingon.Layout, function (base) {


    this.type = 'line';
    
        
    //排列布局
    this.arrange = function (container, hscroll, vscroll, items, start, end, vertical) {

        var x = container.arrangeLeft,
            y = container.arrangeTop,
            width = container.arrangeWidth,
            height = container.arrangeHeight,
            right = 0,
            bottom = 0,
            spacingX,
            spacingY,
            item,
            box,
            cache;
        
        if (vertical)
        {
            bottom = y + height;
            spacingY = this.pixel(this.spacingY(), height);
            
            //先按无滚动条的方式排列
            for (var i = start; i <= end; i++)
            {
                if ((box = (item = items[i]).boxModel(width, height)).visible)
                {
                    item.measure(box, width, bottom > y ? bottom - y : height, false, true);

                    cache = item.locate(box, x, y, width);

                    if (right < cache.right)
                    {
                        right = cache.right;
                    }
                    
                    y = cache.bottom + spacingY;

                    //出现滚动条后重排
                    if (vscroll && y > bottom)
                    {
                        container.arrangeWidth -= this.vscroll_width;
       
                        this.arrange(container, false, false, items, start, end, true);
                        return;
                    }
                }
            }
            
            bottom = y - spacingY;
        }
        else
        {
            right = x + width;
            spacingX = this.pixel(this.spacingX(), width);
                    
            //先按无滚动条的方式排列
            for (var i = start; i <= end; i++)
            {
                if ((box = (item = items[i]).boxModel(width, height)).visible)
                {
                    item.measure(box, right > x ? right - x : width, height, true);
                    
                    cache = item.locate(box, x, y, 0, height);

                    x = cache.right + spacingX;

                    //出现滚动条后重排
                    if (hscroll && x > right) //超行需调整客户区后重排
                    {
                        container.arrangeHeight -= this.hscroll_height;
  
                        this.arrange(container, false, false, items, start, end);
                        return;
                    }
                    
                    if (bottom < cache.bottom)
                    {
                        bottom = cache.bottom;
                    }
                }
            }
            
            right = x - spacingX;
        }
              
        //设置内容区大小
        container.contentWidth = right;
        container.contentHeight = bottom;
    };
    
    
});



//流式布局类
$class('FlowLayout', flyingon.Layout, function (base) {


    this.type = 'flow';


    //是否需要处理滚动条
    this.scroll = true;
    
    
    //竖直布局行宽
    this.arrangeProperty('lineWidth', 0, {
     
        dataType: 'integer',
        minValue: 0
    });

    
    //水平布局行高
    this.arrangeProperty('lineHeight', 0, {
     
        dataType: 'integer',
        minValue: 0
    });

    
    this.locationProperty('newline', false);
        
    
    //排列布局
    this.arrange = function (container, hscroll, vscroll, items, start, end, vertical) {

        var pixel = this.pixel,
            x = container.arrangeLeft,
            y = container.arrangeTop,
            arrangeWidth = container.arrangeWidth,
            arrangeHeight = container.arrangeHeight,
            width = arrangeWidth,
            height = arrangeHeight,
            right = x + width,
            bottom = y + height,
            spacingX = pixel(this.spacingX(), width),
            spacingY = pixel(this.spacingY(), height),
            maxWidth = 0,
            maxHeight = 0,
            line,
            auto,
            item,
            box,
            margin,
            cache;
               
        if (vertical)
        {
            auto = !(line = pixel(this.lineWidth(), width));
            width = 0;
            
            //先按无滚动条的方式排列
            for (var i = start; i <= end; i++)
            {
                if ((box = (item = items[i]).boxModel(arrangeWidth, arrangeHeight)).visible)
                {
                    margin = box.margin;
                    item.measure(box, line, bottom > y ? bottom - y : height, auto, true);

                    //换行
                    if (y + item.offsetHeight + margin.height > bottom || y > 0 && item.locationValue('newline'))
                    {
                        y = container.arrangeTop;
                        x += (line || width) + spacingX;
                        width = 0;
                    }
                    
                    cache = item.locate(box, x, y, line, 0);

                    if (maxHeight < (y = cache.bottom))
                    {
                        maxHeight = y;
                    }
                    
                    y += spacingY;
                    
                    if (maxWidth < (cache = cache.right))
                    {
                        maxWidth = cache;
                        
                        //出现滚动条后重排
                        if (hscroll && maxWidth > right)
                        {
                            container.arrangeHeight -= this.hscroll_height;

                            this.arrange(container, false, false, items, start, end, true, true);
                            return;
                        }
                    }
                    
                    if (auto && width < (cache = item.offsetWidth + margin.width))
                    {
                        width = cache;
                    }
                }
            }
        }
        else
        {
            auto = !(line = pixel(this.lineHeight(), height));
            height = 0;
            
            //先按无滚动条的方式排列
            for (var i = start; i <= end; i++)
            {
                if ((box = (item = items[i]).boxModel(arrangeWidth, arrangeHeight)).visible)
                {
                    margin = box.margin;
                    item.measure(box, right > x ? right - x : width, line, true, auto);

                    //换行
                    if (x + item.offsetWidth + margin.width > right || x > 0 && item.locationValue('newline'))
                    {
                        x = container.arrangeLeft;
                        y += (line || height) + spacingY;
                        height = 0;
                    }
                    
                    cache = item.locate(box, x, y, 0, line);

                    if (maxWidth < (x = cache.right))
                    {
                        maxWidth = x;
                    }
                                        
                    x += spacingX;
                    
                    if (maxHeight < (cache = cache.bottom))
                    {
                        maxHeight = cache;
                        
                        //出现滚动条后重排
                        if (vscroll && cache > bottom)
                        {
                            container.arrangeWidth -= this.vscroll_width;

                            this.arrange(container, false, false, items, start, end, false, true);
                            return;
                        }
                    }
                    
                    if (auto && height < (cache = item.offsetHeight + margin.height))
                    {
                        height = cache;
                    }
                }
            }
        }
        
        container.contentWidth = maxWidth;
        container.contentHeight = maxHeight;
    };

    
});



//停靠布局类
$class('DockLayout', flyingon.Layout, function (base) {


    this.type = 'dock';
    
    
    //控件停靠方式(此值仅在当前布局类型为停靠布局(dock)时有效)
    //left:     左停靠
    //top:      顶部停靠
    //right:    右停靠
    //bottom:   底部停靠
    //fill:     充满
    this.locationProperty('dock', 'left');

    
    //排列布局
    this.arrange = function (container, hscroll, vscroll, items, start, end, vertical) {

        var pixel = this.pixel,
            x = container.arrangeLeft,
            y = container.arrangeTop,
            arrangeWidth = container.arrangeWidth,
            arrangeHeight = container.arrangeHeight,
            width = arrangeWidth,
            height = arrangeHeight,
            right = x + width,
            bottom = y + height,
            spacingX = pixel(this.spacingX(), width),
            spacingY = pixel(this.spacingY(), height),
            maxWidth = 0,
            maxHeight = 0,
            list,
            item,
            box,
            margin,
            cache;

        for (var i = start; i <= end; i++)
        {
            if ((box = (item = items[i]).boxModel(arrangeWidth, arrangeHeight)).visible)
            {
                margin = box.margin;

                switch (item.locationValue('dock'))
                {
                    case 'left':
                        item.measure(box, width, height, true, false, false, true);
                        cache = item.locate(box, x, y, 0, height);
                        width = right - (x = cache.right + spacingX);
                        break;

                    case 'top':
                        item.measure(box, width, height, false, true, true);
                        cache = item.locate(box, x, y, width, 0);
                        height = bottom - (y = cache.bottom + spacingY);
                        break;

                    case 'right':
                        item.measure(box, width, height, true, false, false, true);
                        cache = item.locate(box, right - item.offsetWidth - margin.width, y, 0, height);
                        width = (right = item.offsetLeft - margin.left - spacingX) - x;
                        break;

                    case 'bottom':
                        item.measure(box, width, height, true, false, true);
                        cache = item.locate(box, x, bottom - item.offsetHeight - margin.height, width, 0);
                        height = (bottom = item.offsetTop - margin.top - spacingY) - y;
                        break;

                    default:
                        (list || (list = [])).push(item, box);
                        continue;
                }
                
                if (maxWidth < cache.right)
                {
                    maxWidth = cache.right;
                }
                
                if (maxHeight < cache.bottom)
                {
                    maxHeight = cache.bottom;
                }
            }
        }
        
        //排列充满项
        if (list)
        {
            for (var i = 0, _ = list.length; i < _; i++)
            {
                (item = list[i++]).measure(box = list[i], width, height, false, false, true, true);
                
                cache = item.locate(box, x, y, width, height);
                
                if (maxWidth < cache.right)
                {
                    maxWidth = cache.right;
                }
                
                if (maxHeight < cache.bottom)
                {
                    maxHeight = cache.bottom;
                }
            }
        }
        
        //检查是否需要重排
        this.arrange_check(maxWidth, maxHeight, arguments);
    };
        
    
});



//层叠布局类
$class('CascadeLayout', flyingon.Layout, function (base) {


    this.type = 'cascade';
    
    
    //排列布局
    this.arrange = function (container, hscroll, vscroll, items, start, end, vertical) {

        var x = container.arrangeLeft,
            y = container.arrangeTop,
            width = container.arrangeWidth,
            height = container.arrangeHeight,
            maxWidth = 0,
            maxHeight = 0;

        for (var i = start; i <= end; i++)
        {
            if ((box = (item = items[i]).boxModel(width, height)).visible)
            {
                item.measure(box, width, height);
                cache = item.locate(box, x, y, width, height);
                
                if (maxWidth < cache.right)
                {
                    maxWidth = cache.right;
                }
                
                if (maxHeight < cache.bottom)
                {
                    maxHeight = cache.bottom;
                }
            }
        }
        
        //检查是否需要重排
        this.arrange_check(maxWidth, maxHeight, arguments);
    };
    
    
});



//绝对定位布局类
$class('AbsoluteLayout', flyingon.Layout, function (base) {


    this.type = 'absolute';
    
    
    //排列布局
    this.arrange = function (container, hscroll, vscroll, items, start, end, vertical) {

        var x = container.arrangeLeft,
            y = container.arrangeTop,
            width = container.arrangeWidth,
            height = container.arrangeHeight,
            maxWidth = 0,
            maxHeight = 0;

        for (var i = start; i <= end; i++)
        {
            if ((box = (item = items[i]).boxModel(width, height)).visible)
            {
                item.measure(box, 0, 0, true, true);
                cache = item.locate(box, x + item.locationValue('left'), y + item.locationValue('top'));
                
                if (maxWidth < cache.right)
                {
                    maxWidth = cache.right;
                }
                
                if (maxHeight < cache.bottom)
                {
                    maxHeight = cache.bottom;
                }
            }
        }
        
        container.contentWidth = maxWidth;
        container.contentHeight = maxHeight;
    };
    
    
});



//布局解析器
flyingon.Layout.parse = (function () {
    
    
    function Item() {};
    
    
    var fn = Item.prototype,
        
        parse_cache = {},
        
        regex_parse = /[*%.!\w]+|[\[\]{}<>=]/g,
        
        regex_loop = /\(([^()]+)\)\s*x(\d+)/g,
                
        parse = parseFloat;
    
            
    fn.enabled = true;

    fn.clone = function () {

        var item = new Item(),
            cache;

        item.value = this.value;
        item.unit = this.unit;

        if (!item.enabled)
        {
            item.enabled = false;
        }

        if (cache = this.table)
        {
            item.table = clone_items(cache);
        }

        if (cache = this.items)
        {
            item.items = clone_items(cache);
        }

        return item;
    };
        
    
    function clone_items(items) {
        
        var list = [],
            cache;
        
        for (var i = 0, _ = items.length; i < _; i++)
        {
            list.push(items[i].clone());
        }
        
        if (cache = items.parameters)
        {
            list.parameters = flyingon.extend({}, cache);
        }
        
        return list;
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
        
        while ((token = tokens[index++]) !== void 0)
        {
            switch (token)
            {
                case '[':
                    index = parse_items(item ? (item.items = []) : [], tokens, index, ']');
                    break;

                case '{':
                    index = parse_items(item ? (item.table = []) : [], tokens, index, '}');
                    break;
                    
                case '<':
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
    
    
    function parse_parameters(items, tokens, index) {
        
        var token;
        
        while ((token = tokens[index++]) !== void 0)
        {
            switch (token)
            {
                case '=':
                    if (token = tokens[index - 2])
                    {
                        (items.parameters || (items.parameters = {}))[token] = tokens[index++];
                    }
                    break;
                    
                case '>':
                    return index;
            }
        }
    };
    
    
    function parse_item(items, token) {
      
        var item = new Item(), 
            value;
        
        if (token.indexOf('!') >= 0)
        {
            item.enabled = false;
            token = token.replace('!', '');   
        }
        
        if (token === '*')
        {
            item.value = 100;
            item.unit = '*';
        }
        else if ((value = parse(token)) === value)
        {
            item.value = value;
            item.unit = token.replace(value, '');
        }
        else
        {
            return;
        }
        
        items.push(item);
        return item;
    };
      
    
    return function (text) {
        
        var items = parse_cache[text];
        
        if (items)
        {
            return clone_items(items);
        }
        
        parse_items(items = [], parse_loop(text).match(regex_parse), 0, ']');
        return parse_cache[text] = items;
    };
    
    
})();



//网格布局类
$class('GridLayout', flyingon.Layout, function (base) {


    var regex = /[*%]|[\w.]+/g;
        
    
    this.type = 'grid';


    //均匀网格布局行数
    //number	整数值 
    //string    自定义行 如:'20px 30% 20* *'表示4行 第一行固定宽度为20px 第2行使用可用空间的30% 第3,4行使用全部剩余空间,第3行占比20/120 第4行占比100/120
    this.arrangeProperty('rows', '3');

    //均匀网格布局列数
    //number	整数值 
    //string    自定义列 如:'20px 30% 20* *'表示4列 第一列固定宽度为20px 第2列使用可用空间的30% 第3,4行使用全部剩余空间,第3行占比20/120 第4行占比100/120
    this.arrangeProperty('columns', '3');
    
    //自动增加循环数 0表示不自动增长
    this.arrangeProperty('increase', 0, {
     
        dataType: 'integer',
        minValue: 0
    });


    //横跨行数
    //number	整数值(负整数表示横跨至倒数第几列)
    this.locationProperty('rowSpan', 0, {
     
        dataType: 'integer',
        minValue: 0
    });

    //纵跨列数
    //number	整数值(负整数表示横跨至倒数第几列)
    this.locationProperty('colSpan', 0, {
     
        dataType: 'integer',
        minValue: 0
    });

    //间隔网格数
    //number	整数值
    this.locationProperty('spaces', 0, {
     
        dataType: 'integer',
        minValue: 0
    });


    //排列布局
    this.arrange = function (container, hscroll, vscroll, items, start, end, vertical) {

        var rows = this.__rows || (this.__rows = parse(this.rows() || '3')),
            columns = this.__columns || (this.__columns = parse(this.columns() || '3')),
            increase = this.increase(),
            cache = this.pixel,
            children = container.children(),
            excludes = {},
            x = container.arrangeLeft,
            y = container.arrangeTop,
            width = container.arrangeWidth,
            height = container.arrangeHeight,
            right = x + width,
            bottom = y + height,
            maxWidth = 0,
            maxHeight = 0,
            list1,
            list2,
            length1,
            length2,
            span1,
            span2,
            span,
            item,
            index;
        
        compute(columns, x, width, cache(this.spacingX(), width));
        compute(rows, y, height, cache(this.spacingY(), height));
        
        if (vertical)
        {
            list1 = columns;
            list2 = rows;
            span1 = 'colSpan';
            span2 = 'rowSpan';
            
        }
        else
        {
            list1 = rows;
            list2 = columns;
            span1 = 'rowSpan';
            span2 = 'colSpan';
        }
        
        length1 = list1.length;
        length2 = list2.length;
        
        for (var i = start; i <= end; i++)
        {
            if ((item = items[i]).locationValue('visible'))
            {
                if (cache = item.locationValue('spaces'))
                {
                    list2.index += cache;
                }
                
                if (span = item.locationValue(span2))
                {
                    span = check_span(span, length2);
                }
                
                //查找匹配的网格索引
                if ((index = find(list1, list2, increase, span, excludes)) < 0)
                {
                    break;
                }

                //处理跨列
                if (span)
                {
                    cache = list2[index + span];
                    
                    x = list2[index].start;
                    width = cache.start + cache.size - x;
                }
                else
                {
                    cache = list2[index];

                    x = cache.start;
                    width = cache.size;
                }
                
                //处理跨行
                if (cache = item.locationValue(span1))
                {
                    span = span_excludes(list1, index, cache, span, increase, excludes);
                    
                    index = list1.index;
                    cache = list1[index + span];
                    
                    y = list1[index].start;
                    height = cache.start + cache.size - y;
                }
                else
                {
                    cache = list1[list1.index];
                    
                    y = cache.start;
                    height = cache.size;
                }
                
                var box = item.boxModel(width, height);
                
                item.measure(box, width, height, false, false, true, true);
                cache = item.locate(box, x, y, width, height);
                
                if (maxWidth < cache.right)
                {
                    maxWidth = cache.right;
                }
                
                if (maxHeight < cache.bottom)
                {
                    maxHeight = cache.bottom;
                }
            }
        }
        
        //检查是否需要重排
        this.arrange_check(maxWidth, maxHeight, arguments);
    };
    
    
    //解析表达式
    //'3': 固定3栏
    //'100px 20* * 100px': 4栏，前后两栏100px, 第二栏占余量的20/120 第三栏占余量的100/120
    function parse(text) {
      
        var list = [],
            index;
        
        list.value = 0;
        
        if (text >= 0)
        {
            index = +text || 3;
            
            for (var i = 0; i < index; i++)
            {
                list.push({ value: 100, type: 1 });
            }
            
            list.weight = index * 100;
        }
        else
        {
            var pixel = flyingon.pixel,
                tokens = text.match(regex),
                token,
                item;

            list.weight = index = 0;

            while (token = tokens[index++])
            {
                switch (token)
                {
                    case '*':
                        list.push(item = { value: 100, type: 1 });
                        list.weight += 100;
                        break;

                    case '%': //%前必须为数字,否则忽略
                        break;

                    default:
                        if (token > 0)
                        {
                            switch (tokens[index])
                            {
                                case '*':
                                    list.push(item = { value: +token, type: 1 });
                                    list.weight += item.value;
                                    index++;
                                    break;

                                case '%':
                                    list.push(item = { value: +token, type: 2 });
                                    list.percent = true;
                                    index++;
                                    break;
                            }
                        }
                        else
                        {
                            token = pixel(token);
                            
                            list.push(item = { value: token, type: 0, size: token });
                            list.value += item.value;
                        }
                        break;
                }
            }
        }
        
        return list;
    };
    
    
    //计算尺寸
    function compute(list, start, size, spacing) {
        
        var weight = list.weight,
            value = 0,
            length = list.length,
            item;
        
        if (list.percent)
        {
            for (var i = 0; i < length; i++)
            {
                if ((item = list[i]).type === 2)
                {
                    value += (item.size = (item.value * size / 100) >> 0);
                }
            }
        }

        if (weight)
        {
            if ((value = size - list.value - value - (length - 1) * spacing) < 0)
            {
                value = 0;
            }
            
            for (var i = 0; i < length; i++)
            {
                if ((item = list[i]).type === 1)
                {
                    value -= (item.size = (item.value * value / weight) >> 0);
                    weight -= item.value;
                }
            }
        }
        
        for (var i = 0; i < length; i++)
        {
            (item = list[i]).start = start;
            start += item.size + spacing;
        }
        
        //初始化当前索引
        list.index = 0;
        list.spacing = spacing;
        list.start = start;
    };
    
        
    function check_span(span, length) {
        
        if (span < 0)
        {
            return (span += length) < 0 ? 0 : span;
        }

        return span >= length ? length - 1 : span;
    };
    
    
    function span_excludes(list, index, span1, span2, increase, excludes) {
        
        var start = list.index,
            length = list.length;
        
        for (var i = 1; i <= span1; i++)
        {
            var y = start + i;
            
            if (y >= length)
            {
                if (increase)
                {
                    auto_increase(list, increase);
                }
                else
                {
                    return i - 1;
                }
            }
            
            var cache = excludes[y] || (excludes[y] = {});
            
            for (var j = 0; j <= span2; j++)
            {
                cache[index + j] = true;
            }
        }
        
        return span1;
    };

    
    function find(list1, list2, increase, span, excludes) {
      
        var index = list2.index,
            length = list2.length,
            cache = excludes[list1.index];
        
        //处理跨列
        if (span) 
        {
            if (index + span >= length || (index = find_span(index, span, length, cache)) < 0)
            {
                index = length;
            }
            else
            {
                list2.index = index + span + 1;
                return index;
            }
        }
        else
        {
            while (length > index)
            {
                if (cache && cache[index]) //被占用则继续查找下一个
                {
                    index++;
                }
                else
                {
                    list2.index = index + 1;
                    return index;
                }
            }
        }
        
        //可换行则继续处理
        if (++list1.index < list1.length)
        {
            list2.index = index - length;
            return find.apply(this, arguments);
        }
        
        //可自动增长则自动增长后继续处理
        if (increase)
        {
            list2.index = index - length;
            auto_increase(list1, increase);
            
            return find.apply(this, arguments);
        }

        return -1;
    };
        
        
    function auto_increase(list, increase) {
        
        var start = list.start,
            length = list.length,
            spacing = list.spacing,
            items = list.slice(-increase),
            item,
            cache;

        for (var i = 0, _ = items.length; i < _; i++)
        {
            cache = items[i];
            
            item = { value: cache.value, type: cache.type, size: cache.size };
            item.start = start;
            list.push(item);
            
            start += item.size + spacing;
        }

        list.start = start;  
    };
    
    
    function find_span(index, span, length, excludes) {

        var i = 0;
        
        while (index < length)
        {
            if (excludes && excludes[index])
            {
                i = 0;
            }
            else if (++i > span)
            {
                return index - span;
            }
            
            index++;
        }
        
        return -1;
    };
    
    
});



//表格布局类
$class('TableLayout', flyingon.Layout, function (base) {

    
    this.type = 'table';


    //行列格式: row[column ...] ... row,column可选值: 
    //整数            固定行高或列宽 
    //数字+%          总宽度或高度的百分比 
    //数字+*          剩余空间的百分比, 数字表示权重, 省略时权重默认为100
    //数字+css单位    指定单位的行高或列宽
    //列可嵌套表或表组 表或表组可指定参数
    //参数集: <name1=value1 ...>   多个参数之间用逗号分隔
    //嵌套表: {<参数集> row[column ...] ...} 参数集可省略
    //示例(九宫格正中内嵌九宫格,留空为父表的一半): '*[* * *] *[* * {<spacingX=50% spacingY=50%> *[* * *] *[* * *] *[* * *]} *] *[* * *]'
    
    
    
    this.arrangeProperty('header', '', {
    
        set: 'this.__header = null;'
    });
    
    
    //内容区表格行定义
    this.arrangeProperty('body', '*[* * *] *[* * *] *[* * *]', {
     
        set: 'this.__body = null;'
    });
    
    
    //自动增长行数
    this.arrangeProperty('increase', '', {
       
        set: 'this.__increase = null;'
    });
    
    
    //尾部优先排列行数
    this.arrangeProperty('footer', '', {
       
        set: 'this.__footer = null;'
    });


    
    //排列布局
    this.arrange = function (container, hscroll, vscroll, items, start, end, vertical) {

        var table = this.__table || (this.__table = flyingon.Layout.parse(this.table())),
            increase = this.increase(),
            tails = this.tails(),
            total;
        
        if (increase > 0 && (total = check_increase(table, end - start + 1)) > 0)
        {
            auto_increase(table = table.slice(0), total);
        }
    };

        
    function check_increase(table, total) {
        
        for (var i = table.length - 1; i >= 0; i--)
        {
            var row = table[i],
                items = row.items,
                length = 0;
            
            for (var j = items.length - 1; j >= 0; j--)
            {
                var item = items[j];
                
                if (item.enabled)
                {
                    if (item.table)
                    {
                        length -= check_increase(item.table, increase, tails, 0);
                    }
                    else
                    {
                        length++;
                    }
                }
            }
            
            total -= length;
        }
        
        return total;
    };
    
    
    function auto_increase(table, increase, tails, total) {
        
        var start = table.length - increase - tails,
            end = start + increase;
        
        if (start < 0)
        {
            start = 0;
        }
        
        
    };


});

