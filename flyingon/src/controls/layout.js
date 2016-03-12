
//布局相关基础方法
(function (flyingon) {


    var pixel_unit = flyingon.create(null), //单位换算列表

        pixel_list = flyingon.create(null), //缓存的单位转换值

        regex_unit = /[a-zA-z]+|%/, //计算尺寸正则表达式

        regex_sides = /[\w%.]+/g, //4边解析正则表达式
        
        sides_list = flyingon.create(null), //4边缓存列表
        
        round = Math.round,

        parse = parseFloat,
        
        pixel;
    
    
    //计算单位换算列表
    flyingon.dom_test(function (div) {

        var list = pixel_unit;

        //计算单位换算列表
        div.style.cssText = 'position:absolute;left:-10000ex;top:-100em;width:10000cm;height:1in;'

        list.px = 1;
        list.ex = -div.offsetLeft / 10000;
        list.em = list.rem = -div.offsetTop / 100;
        list.cm = (list.cm = div.offsetWidht / 10000) * 10;
        list.pt = (list.pc = (list['in'] = div.offsetHeight) / 6) / 12;

        div.innerHTML = '';

    }, this);


    //或者或设置象素转换单位
    flyingon.pixel_unit = function (name, value) {

        if (value === void 0)
        {
            return pixel_unit[name];
        }

        if (pixel_unit[name] !== value)
        {
            pixel_unit[name] = value;

            var list = pixel_list;

            for (var key in list)
            {
                if (key.indexOf(name) > 0)
                {
                    list[key] = void 0;
                }
            }
        }
    };


    //转换css尺寸为像素值
    //注: em与rem相同, 且在初始化时有效
    flyingon.pixel = pixel = function (value, size) {

        if (value >= 0)
        {
            return value >> 0;
        }

        var cache = pixel_list[value];

        if (cache !== void 0)
        {
            return cache !== true ? cache : round(parse(value) * size / 100);
        }

        if (cache = value.match(regex_unit)) 
        {
            if ((cache = cache[0]) === '%')
            {
                pixel_list[value] = true;
                return round(parse(value) * size / 100);
            }
            
            cache = cache.toLowerCase();
        }

        return pixel_list[value] = round(parse(value) * (pixel_unit[cache] || 1));
    };
    
    
    //转换4边尺寸为像素值(margin, padding的百分比是以父容器的宽度为参照, border-width不支持百分比)
    flyingon.pixel_sides = function (value, width) {
        
        if (values = sides_list[value])
        {
            //直接取缓存
            if (values.cache)
            {
                return values;
            }
        }
        else if (value >= 0)
        {
            return sides_list[value] = sides_values(value | 0);
        }
        else if (value && (values = ('' + value).match(regex_sides)))
        {
            values = pixel_sides(values);

            if (values.width >= 0 && values.height >= 0)
            {
                values.cache = true;
                return sides_list[value] = values;
            }
        }
        else
        {
            return sides_list[value] = sides_values(0);
        }

        return pixel_sides(values, width);
    };
    
    
    function sides_values(value) {
    
        return { 
                
            left: value, 
            top: value, 
            right: value, 
            bottom: value, 
            width: value = value << 1, 
            height: value,
            cache: true
        };
    };
    
    
    function pixel_sides(sides, width) {
        
        var target = {},
            fn = pixel;
        
        switch (sides.length)
        {
            case 1:
                target.left = target.top = target.right = target.bottom = fn(sides[0], width);
                break;

            case 2:
                target.left = target.right = fn(sides[1], width);
                target.top = target.bottom = fn(sides[0], width);
                break;

            case 3:
                target.left = target.right = fn(sides[1], width);
                target.top = fn(sides[0], width);
                target.bottom = fn(sides[2], width);
                break;

            default:
                target.left = fn(sides[3], width);
                target.top = fn(sides[0], width);
                target.right = fn(sides[1], width);
                target.bottom = fn(sides[2], width);
                break;
        }

        target.width = target.left + target.right;
        target.height = target.top + target.bottom;
        
        return target;
    };
    

})(flyingon);



//可定位对象接口
flyingon.ILocatable = function (self, control) {
   
    
    var ILocatable = flyingon.ILocatable,
        extend_list = ILocatable.__extend_list,
        extend = flyingon.extend,
        pixel = flyingon.pixel,
        pixel_sides = flyingon.pixel_sides,
        location_attributes = 'var target = this.__parent || this.__arrange_attach && this;\n\t'
            + 'if (target && target.__arrange_dirty !== 2)\n\t'
            + '{\n\t\t'
                + 'target.update();\n\t'
            + '}';;

    
    //记录被扩展的目标
    (ILocatable.__target_list || (ILocatable.__target_list = [])).push(self);
    
    
    //接口标记
    self['flyingon.ILocatable'] = true;

    
    self.locationProperty = function (name, defaultValue, attributes) {
        
        var set;
            
        if (control)
        {
            attributes = attributes || {};
            attributes.group = 'location';
            attributes.query = true;
            attributes.set = ((set = attributes.set) ? set + '\n\t' : '') + location_attributes;
        }
        
        this.defineProperty(name, defaultValue, attributes);
    };
    
    
    //控件默认宽度(width === 'default'时的宽度)
    self.defaultWidth = 100;

    //控件默认高度(height === 'default'时的高度)
    self.defaultHeight = 21;

    //是否可见
    self.locationProperty('visible', true, {
     
        set: 'this.dom.style.display = value ? "" : "none";'
    });
        
    
    //控件横向对齐方式
    //left      左边对齐
    //center    横向居中对齐
    //right     右边对齐
    self.locationProperty('alignX', 'left');

    //控件纵向对齐方式
    //top       顶部对齐
    //middle    纵向居中对齐
    //bottom    底部对齐
    self.locationProperty('alignY', 'top');

    //控件横向偏移距离
    //length	规定以具体单位计的值 比如像素 厘米等
    //number%   父控件客户区宽度的百分比
    self.locationProperty('offsetX', '0');

    //控件纵向偏移距离
    //length	规定以具体单位计的值 比如像素 厘米等
    //number%   父控件客户区高度的百分比
    self.locationProperty('offsetY', '0');


    self.locationProperty('left', '0');

    self.locationProperty('top', '0');

    self.locationProperty('width', 'default');

    self.locationProperty('height', 'default');


    self.locationProperty('minWidth', '0');

    self.locationProperty('maxWidth', '0');

    self.locationProperty('minHeight', '0');

    self.locationProperty('maxHeight', '0');


    self.locationProperty('margin', '0');

    self.locationProperty('border', '0', {
    
        set: 'this.dom.style.borderWidth = value > 0 ? value + "px" : value;\n\t'
    });

    self.locationProperty('padding', '0', {
     
        set: 'this.__change_style("padding", value > 0 ? value + "px" : value);'
    });
    

    //特殊的定位属性值变更方法
    self.__change_style = function (name, value) {
      
    };

    
    if (extend_list)
    {
        for (var name in extend_list)
        {
            self.locationProperty.apply(self, extend_list[name]);
        }
    }


    //获取定位属性值
    self.locationValue = function (name) {
      
        var values = this.__location_values,
            value;
        
        if (values && (value = values[name]) != null)
        {
            return value;
        }
        
        return (this.__storage || this.__defaults)[name];
    };
    
    
    //默认盒模型
    var box_default = {
        
        visible: false,
        alignX: 'center',
        alignY: 'middle',
        offsetX: 0,
        offsetY: 0, 
        left: 0,
        top: 0,
        width: 'default',
        height: 'default',
        minWidth: 0,
        maxWidth: 0,
        minHeight: 0,
        maxHeight: 0
    };
    
    box_default.margin = box_default.border = box_default.padding = {
            
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0
    };
    
    
    //获取盒模型
    self.boxModel = function (width, height) {
      
        var box = this.__boxModel || (this.__boxModel = {}),
            storage = this.__storage || this.__defaults,
            values = this.__location_values,
            fn = pixel,
            value;
        
        if (values)
        {
            if (box.visible = (value = values.visible) != null ? value : storage.visible)
            {
                box.alignX = values.alignX || storage.alignX;
                box.alignY = values.alignY || storage.alignY;

                box.offsetX = fn((value = values.offsetX) != null ? value : storage.offsetX, width);
                box.offsetY = fn((value = values.offsetY) != null ? value : storage.offsetY, height);

                box.left = fn((value = values.left) != null ? value : storage.left, width);
                box.top = fn((value = values.top) != null ? value : storage.top, height);

                box.width = (value = values.width) != null ? value : storage.width;
                box.height = (value = values.height) != null ? value : storage.height;

                box.minWidth = fn((value = values.minWidth) != null ? value : storage.minWidth, width);
                box.maxWidth = fn((value = values.maxWidth) != null ? value : storage.maxWidth, width);
                box.minHeight = fn((value = values.minHeight) != null ? value : storage.minHeight, height);
                box.maxHeight = fn((value = values.maxHeight) != null ? value : storage.maxHeight, height);

                fn = pixel_sides;

                //margin, padding的百分比是以父容器的宽度为参照, border-width不支持百分比
                box.margin = fn((value = values.margin) != null ? value : storage.margin, width);
                box.border = fn((value = values.border) != null ? value : storage.border, width);
                box.padding = fn((value = values.padding) != null ? value : storage.padding, width);
                
                return box;
            }
        }
        else if (box.visible = storage.visible)
        {
            box.alignX = storage.alignX;
            box.alignY = storage.alignY;
            
            box.offsetX = fn(storage.offsetX, width);
            box.offsetY = fn(storage.offsetY, height);
            box.left = fn(storage.left, width);
            box.top = fn(storage.top, height);
            
            box.width = storage.width;
            box.height = storage.height;
            
            box.minWidth = fn(storage.minWidth, width);
            box.maxWidth = fn(storage.maxWidth, width);
            box.minHeight = fn(storage.minHeight, height);
            box.maxHeight = fn(storage.maxHeight, height);
            
            fn = pixel_sides;
            
            //margin, padding的百分比是以父容器的宽度为参照, border-width不支持百分比
            box.margin = fn(storage.margin, width);
            box.border = fn(storage.border, width);
            box.padding = fn(storage.padding, width);
            
            return box;
        }
        
        return box_default;
    };
    
    
    //测量大小
    self.measure = function (box, 
        available_width, 
        available_height, 
        less_width_to_default, 
        less_height_to_default, 
        default_width_to_fill,
        default_height_to_fill) {
        
        var width = box.width, 
            height = box.height;

        //处理宽度
        switch (width)
        {
            case 'default': //默认
                width = default_width_to_fill ? true : this.defaultWidth;
                break;

            case 'fill': //充满可用区域
                width = true;
                break;

            case 'auto': //根据内容自动调整大小
                if (this.__rearrange) //重排时直接使用内容宽度
                {
                    width = this.contentWidth;
                }
                else 
                {
                    width = less_width_to_default = true;
                }
                break;
                
            default:
                width = pixel(width, available_width);
                break;
        }

        //充满可用宽度
        if (width === true)
        {
            if ((available_width -= box.margin.width) > 0) //有可用空间
            {
                width = available_width;
            }
            else if (less_width_to_default) //可用空间不足时使用默认宽度
            {
                width = this.defaultWidth;
            }
            else //无空间
            {
                width = 0;
            }
        }

        //处理最小及最大宽度
        if (width < box.minWidth)
        {
            width = box.minWidth;
        }
        else if (box.maxWidth > 0 && width > box.maxWidth)
        {
            width = box.maxWidth;
        }

        //处理高度
        switch (height)
        {
            case 'default': //自动
                height = default_height_to_fill ? true : this.defaultHeight;
                break;

            case 'fill': //充满可用区域
                height = true;
                break;

            case 'auto': //根据内容自动调整大小
                if (this.__rearrange)  //重排时直接使用内容高度
                {
                    height = this.contentHeight;
                }
                else
                {
                    height = less_height_to_default = true;
                }
                break;

            default:  //其它值
                height = pixel(height, available_height);
                break;
        }

        //充满可用高度
        if (height === true)
        {
            if ((available_height -= box.margin.height) > 0) //有可用空间
            {
                height = available_height;
            }
            else if (less_height_to_default) //可用空间不足时使用默认高度
            {
                height = this.defaultHeight;
            }
            else //无空间
            {
                height = 0;
            }
        }

        //处理最小及最大宽度
        if (height < box.minHeight)
        {
            height = box.minHeight;
        }
        else if (box.maxHeight > 0 && height > box.maxHeight)
        {
            height = box.maxHeight;
        }

        this.onmeasure(box, this.offsetWidth = width, this.offsetHeight = height);
    };
    
    
    //测量后处理
    self.onmeasure = function (box, width, height) {
        
    };
        
    
    //定位
    self.locate = function (box, x, y, align_width, align_height) {
        
        var margin = box.margin,
            value;

        if (align_width > 0 && (value = align_width - margin.width - this.offsetWidth))
        {
            switch (box.alignX)
            {
                case 'center':
                    x += value >> 1;
                    break;

                case 'right':
                    x += value;
                    break;
            }
        }

        if (align_height > 0 && (value = align_height - margin.height - this.offsetHeight))
        {
            switch (box.alignY)
            {
                case 'middle':
                    y += value >> 1;
                    break;

                case 'bottom':
                    y += value;
                    break;
            }
        }

        //此处不直接设置位置, 某些地方可能需要对比变化(比如Sublayout)
        if (this.onlocate(box, x, y))
        {
            x = this.offsetLeft;
            y = this.offsetTop;
        }
        else
        {
            this.offsetLeft = x;
            this.offsetTop = y;
        }
        
        return {
            
            right: x + this.offsetWidth + margin.right,
            bottom: y + this.offsetHeight + margin.bottom
        };
    };
    
    
    //定位后处理
    self.onlocate = function (box, x, y) {
        
    };
    
    
    self.clientRect = function (left, top) {
        
        var box = this.__boxModel || this.boxModel(),
            border = box.border,
            padding = box.padding,
            value;

        return {
          
            left: (left || 0) + padding.left,
            top: (top || 0) + padding.top,
            right: padding.right,
            bottom: padding.bottom,
            width: (value = this.offsetWidth - border.width - padding.width) >= 0 ? value : 0,
            height: (value = this.offsetHeight - border.height - padding.height) >= 0 ? value : 0
        };
    };
    
    
};



//子布局
$class('Sublayout', [Object, flyingon.IObject], function (self) {
       
    
    //子项数
    self.defineProperty('length', 0, {
     
        dataType: 'number'
    });
    
    
    //扩展可定位对象接口
    flyingon.ILocatable(self);
    
    
    //指定默认大小
    self.defaultWidth = self.defaultHeight = 200;
    
    
    //布局
    self.defineProperty('layout', null, {
     
        storage: 'this.__layout'
    });
    
    
    self.onlocate = function (box, x, y) {
        
        var items = this.__allot;
        
        //定位时直接排列子项
        if (items)
        {
            var layout = this.__layout_,
                border = this.__boxModel.border,
                clientRect = this.clientRect(x + border.left, y + border.top);

            layout.init(this, clientRect, false, false, items[0], items[1], items[2]);
            
            this.offsetWidth = this.contentWidth - x;
            this.offsetHeight = this.contentHeight - y;
            
            this.__allot_cache = items;
            this.__allot = null;
        }
        else if (items = this.__allot_cache)
        {
            x -= this.offsetLeft;
            y -= this.offsetTop;
            
            if (x || y)
            {
                var index = items[1],
                    item;
                
                items = items[0];
                
                while (item = items[index++])
                {
                    item.offsetLeft += x;
                    item.offsetTop += y;
                }
            }
        }
    };
    
    
    self.onarrange = function (layout) {
        
        
    };
   
    
    self.serialize = function (writer) {
        
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
    
    
    self.deserialize_list.layout = function (reader, values) {
    
        this.__layout_ = (this.__layout = values) && flyingon.findLayout(values, reader);
    };
    
    
});



//布局基类
$class('Layout', [Object, flyingon.IObject], function (self) {

    

    var registry_list = flyingon.create(null), //注册的布局列表
        
        layouts = flyingon.create(null), //已定义的布局集合
        
        Array = window.Array;
        
    
            
    //获取或切换而已或定义布局
    flyingon.layout = function (name, values) {
    
        if (name && values && typeof values !== 'function') //定义布局
        {
            layouts[name] = [values, null];
        }
        
        return flyingon.include_var('layout', name, values); //获取或设置当前布局
    };
    
    
    //获取布局定义
    flyingon.findLayout = function (key, reader) {
      
        if (key)
        {
            switch (typeof key)
            {
                case 'string':
                    if (key = layouts[key])
                    {
                        return key[1] || (key[1] = deserialize_layout(reader, key[0]));
                    }
                    break;
                    
                case 'object':
                    return deserialize_layout(reader, key);
            }
        }
    };
    
    
    function deserialize_layout(reader, values) {
      
        var layout = new (values && registry_list[values.type] || flyingon.FlowLayout)();

        layout.deserialize(reader || flyingon.SerializeReader.instance, values);
        return layout;
    };
    
    

    //布局类型
    self.type = null;

    
    //定义排列属性方法
    self.arrangeProperty = self.defineProperty;
    

    //定义定位属性方法
    self.locationProperty = function (name, defaultValue, attributes) {

        var ILocatable = flyingon.ILocatable,
            list = ILocatable.__target_list;
        
        (ILocatable.__extend_list || (ILocatable.__extend_list = {}))[name] = arguments;

        if (list)
        {
            for (var i = list.length - 1; i >= 0; i--)
            {
                list[i].locationProperty(name, defaultValue, attributes);
            }
        }
    };
    
        
    
    //是否竖排
    //true      竖排
    //false     横排
    self.arrangeProperty('vertical', false);

    //镜像布局变换
    //none:     不进行镜像变换
    //x:        沿x轴镜像变换
    //y:        沿y轴镜像变换
    //center:   沿中心镜像变换
    self.arrangeProperty('mirror', 'none');

    //布局间隔宽度
    //length	规定以具体单位计的值 比如像素 厘米等
    //number%   控件客户区宽度的百分比
    self.arrangeProperty('spacingX', '0');

    //布局间隔高度
    //length	规定以具体单位计的值 比如像素 厘米等
    //number%   控件客户区高度的百分比
    self.arrangeProperty('spacingY', '0');

    //内容横向对齐方式
    //left      左边对齐
    //center    横向居中对齐
    //right     右边对齐
    self.arrangeProperty('contentAlignX', 'left');

    //内容纵向对齐方式
    //top       顶部对齐
    //middle    纵向居中对齐
    //bottom    底部对齐
    self.arrangeProperty('contentAlignY', 'top');
    
    
    //子项
    self.arrangeProperty('subitems', null, {

        storage: 'this.__subitems',
        set: 'this.__subitems_ = !!value;'
    });

    
    //子布局
    self.arrangeProperty('sublayouts', null, {
       
        storage: 'this.__sublayouts',
        set: 'this.__sublayouts_ = !!value;'
    });
    

    //自适应布局
    self.arrangeProperty('adaptation', null, {

        storage: 'this.__adaptation',
        set: 'this.__adaptation_ = !!value;'
    });

        
    //计算滚动条大小
    flyingon.dom_test(function (div) {

        div.style.cssText = "position:absolute;overflow:scroll;width:100px;height:100px;border:0;padding:0;top:-100px;";
        div.innerHTML = "<div style='position:relative;width:200px;height:200px;'></div>";

        //竖直滚动条宽度
        this.vscroll_width = div.offsetWidth - div.clientWidth;

        //水平滚动条高度
        this.hscroll_height = div.offsetHeight - div.clientHeight;

        div.innerHTML = '';

    }, self);
    
    
    //计算css单位为象素值方法
    self.pixel = flyingon.pixel;
    
    
    //初始化排列
    self.init = function (container, clientRect, hscroll, vscroll, items, start, end) {
        
        var index = items.length;
        
        if (!(start >= 0))
        {
            start = 0;
        }
        
        if (!end || end >= index)
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

                index = layout(container, clientRect.width, clientRect.height);

                if ((layout = values[index]) && !layout['flyingon.Layout'])
                {
                    layout = values[index] = flyingon.findLayout(layout);
                }
            }

            arrange(layout || this, container, clientRect, hscroll, vscroll, items, start, end);
        }
    };
    
      
    //内部排列方法
    function arrange(layout, container, clientRect, hscroll, vscroll, items, start, end) {

        var sublayouts = layout.__sublayouts_,
            subitems,
            values,
            cache;
        
        //处理子布局
        if (sublayouts)
        {
            if (sublayouts === true)
            {
                sublayouts = layout.__sublayouts_ = init_sublayouts(layout.__sublayouts);
            }
 
            //分配置子布局子项
            allot_sublayouts(sublayouts, items, start, end);
            
            items = sublayouts;
            start = 0;
            end = items.length - 1;
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

                for (var i = start; i <= end; i++)
                {
                    items[i].__location_values = cache && values[cache(i, items[i], container)] || subitems;
                }
            }
        }
                
        //排列
        layout.arrange(container, clientRect, hscroll, vscroll, items, start, end, layout.vertical());

        //镜像处理
        if ((cache = layout.mirror()) !== 'none')
        {
            arrange_mirror(clientRect, cache, items, start, end);
        }
        
        //排列后处理
        container.onarrange(layout);
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
            items = new Array(values.length),
            data;
        
        while (data = values[--index])
        {
            (items[index] = new flyingon.Sublayout()).deserialize(reader, data);
        }
        
        return items;
    };
    
    
    //分配子布局子项
    function allot_sublayouts(sublayouts, items, start, end) {
        
        var i1 = 0,
            i2 = sublayouts.length - 1,
            all = end - start,
            layout,
            length;
        
        //先排列前面部分的子项
        while (i1 <= i2)
        {
            length = (layout = sublayouts[i1]).length();
            
            if (length < 0)
            {
                length += all;
            }
            else if (length < 1)
            {
                break;
            }
            
            layout.__allot = [items, start, (start += length) - 1];

            if (start >= end)
            {
                return;
            }
            
            i1++;
        }
        
        //再排列后面部分的子项
        while (i2 > i1)
        {
            length = (layout = sublayouts[i2]).length();
            
            if (length < 0)
            {
                length += all;
            }
            else if (length < 1)
            {
                break;
            }
            
            layout.__allot = [items, end - length, end - 1];

            if (start >= (end -= length))
            {
                return;
            }
            
            i2--;
        }
        
        //记录总的余量
        all = end - start + 1;
        
        //最后排列中间的余量
        while (i1 <= i2)
        {
            length = (layout = sublayouts[i1]).length();
            length = length > 0 ? (length * all) | 0 : (end - start + 1);
            
            layout.__allot = [items, start, (start += length) - 1];

            if (start >= end)
            {
                return;
            }
            
            i1++;
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
    function arrange_mirror(clientRect, mirror, items, start, end) {

        var width = clientRect.width, 
            height = clientRect.height, 
            item;

        switch (mirror)
        {
            case "x":
                for (var i = start; i <= end; i++)
                {
                    (item = items[i]).offsetTop = height - item.offsetTop - item.offsetHeight;
                }
                break;

            case "y":
                for (var i = start; i <= end; i++)
                {
                    (item = items[i]).offsetLeft = width - item.offsetLeft - item.offsetWidth;
                }
                break;

            case "center":
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
    self.arrange = function (container, clientRect, hscroll, vscroll, items, start, end, vertical) {

    };
    
    
    //重排布局
    self.rearrange = function (container, clientRect, items, start, end, vertical) {
        
        //标记重排状态
        for (var i = start; i <= end; i++)
        {
            items[i].__rearrange = true;
        }
        
        this.arrange(container, clientRect, false, false, items, start, end, vertical);
        
        //退出生排状态
        for (var i = start; i <= end; i++)
        {
            items[i].__rearrange = false;
        }
    };
    
    
    //排列检测
    self.arrange_check = function (maxWidth, maxHeight, data) {
        
        var clientRect = data[1],
            arrange;
        
        //如果超出范围则重排
        if (data[2] && maxWidth > clientRect.left + clientRect.width)
        {
            clientRect.height -= this.hscroll_height;
            arrange = true;
        }
        
        if (data[3] && maxHeight > clientRect.top + clientRect.height)
        {
            clientRect.width -= this.vscroll_width;
            arrange = true;
        }
        
        if (arrange === true)
        {
            this.rearrange(data[0], clientRect, data[4], data[5], data[6], data[7]);
        }
        else
        {
            container.contentWidth = maxWidth;
            container.contentHeight = maxHeight;
        }
    };
    
    
    //序列化方法
    self.serialize = function (writer) {

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
    self.deserialize_list.type = true;
    
            

    self.__class_init = function (Class) {

        if (self !== this)
        {
            if (this.type)
            {
                registry_list[this.type] = Class;
            }
            else
            {
                throw $errortext('flyingon', 'layout type').replace('{0}', Class.xtype);
            }
        }
    };
        

});



//单列布局类
$class('LineLayout', flyingon.Layout, function (self, base) {


    self.type = 'line';
    
        
    //排列布局
    self.arrange = function (container, clientRect, hscroll, vscroll, items, start, end, vertical) {

        var x = clientRect.left,
            y = clientRect.top,
            width = clientRect.width,
            height = clientRect.height,
            right = 0,
            bottom = 0,
            spacingX,
            spacingY,
            item,
            box,
            margin,
            cache;
        
        if (vertical)
        {
            bottom = y + height;
            spacingY = this.pixel(this.spacingY(), height);
            
            //先按无滚动条的方式排列
            for (var i = start; i <= end; i++)
            {
                if ((box = (item = items[i]).boxModel()).visible)
                {
                    margin = box.margin;
                    
                    item.measure(box, width, height, false, true);

                    cache = item.locate(box, x + margin.left, y += margin.top, width);

                    if (right < cache.right)
                    {
                        right = cache.right;
                    }
                    
                    y = cache.bottom + spacingY;

                    //出现滚动条后重排
                    if (vscroll && y > bottom)
                    {
                        clientRect.width -= this.vscroll_width;
                        
                        this.arrange(container, clientRect, false, false, items, start, end, true);
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
                if ((box = (item = items[i]).boxModel()).visible)
                {
                    margin = box.margin;
                    
                    item.measure(box, width, height, true);
                    
                    cache = item.locate(box, x += margin.left, y + margin.top, 0, height);

                    x = cache.right + spacingX;

                    //出现滚动条后重排
                    if (hscroll && x > right) //超行需调整客户区后重排
                    {
                        clientRect.height -= this.hscroll_height;

                        this.rearrange(container, clientRect, items, start, end);
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
        container.contentWidth = right + clientRect.right;
        container.contentHeight = bottom + clientRect.bottom;
    };
    
    
});



//流式布局类
$class('FlowLayout', flyingon.Layout, function (self, base) {


    self.type = 'flow';


    //是否需要处理滚动条
    self.scroll = true;
    
    
    //竖直布局行宽
    self.arrangeProperty('lineWidth', 0, {
     
        minValue: 0
    });

    
    //水平布局行高
    self.arrangeProperty('lineHeight', 0, {
     
        minValue: 0
    });

    
    self.locationProperty('newline', false);
        
    
    //排列布局
    self.arrange = function (container, clientRect, hscroll, vscroll, items, start, end, vertical) {

        var pixel = this.pixel,
            x = clientRect.left,
            y = clientRect.top,
            width = clientRect.width,
            height = clientRect.height,
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
                if ((box = (item = items[i]).boxModel()).visible)
                {
                    margin = box.margin;
                    
                    item.measure(box, line, 0, auto, true);

                    //换行
                    if (y + item.offsetHeight + margin.height > bottom || y > 0 && item.locationValue('newline'))
                    {
                        y = clientRect.top;
                        x += (line || width) + spacingX;
                        width = 0;
                    }
                    
                    cache = item.locate(box, x + margin.left, y += margin.top, line, 0);

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
                            clientRect.height -= this.hscroll_height;

                            this.rearrange(container, clientRect, items, start, end, true);
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
                if ((box = (item = items[i]).boxModel()).visible)
                {
                    margin = box.margin;
                    
                    item.measure(box, 0, line, true, auto);

                    //换行
                    if (x + item.offsetWidth + margin.width > right || x > 0 && item.locationValue('newline'))
                    {
                        x = clientRect.left;
                        y += (line || height) + spacingY;
                        height = 0;
                    }
                    
                    cache = item.locate(box, x += margin.left, y + margin.top, 0, line);

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
                            clientRect.width -= this.vscroll_width;

                            this.rearrange(container, clientRect, items, start, end);
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
        
        container.contentWidth = maxWidth + clientRect.right;
        container.contentHeight = maxHeight + clientRect.bottom;
    };

    
});



//停靠布局类
$class('DockLayout', flyingon.Layout, function (self, base) {


    self.type = 'dock';
    
    
    //控件停靠方式(此值仅在当前布局类型为停靠布局(dock)时有效)
    //left:     左停靠
    //top:      顶部停靠
    //right:    右停靠
    //bottom:   底部停靠
    //fill:     充满
    self.locationProperty('dock', 'left');

    
    //排列布局
    self.arrange = function (container, clientRect, hscroll, vscroll, items, start, end, vertical) {

        var pixel = this.pixel,
            x = clientRect.left,
            y = clientRect.top,
            width = clientRect.width,
            height = clientRect.height,
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
            if ((box = (item = items[i]).boxModel()).visible)
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
                        item.measure(box, width, height, false, true, true, false);
                        cache = item.locate(box, x, y, width, 0);
                        height = bottom - (y = cache.bottom + spacingY);
                        break;

                    case 'right':
                        item.measure(box, width, height, true, false, false, true);
                        cache = item.locate(box, right -= item.offsetWidth + margin.width, y, 0, height);
                        width = (right = item.offsetLeft - spacingX) - x;
                        break;

                    case 'bottom':
                        item.measure(box, width, height, true, false, true, false);
                        cache = item.locate(box, x, bottom -= item.offsetHeight + margin.height, width, 0);
                        height = (bottom = item.offsetTop - spacingY) - y;
                        break;

                    default:
                        (list || (list = [])).push(item, box, margin);
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
            for (i = 0, _ = list.length; i < _; i++)
            {
                item = list[i++];
                box = list[i++];
                margin = list[i];

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
        
    
});



//网格布局类
$class('GridLayout', flyingon.Layout, function (self, base) {


    self.type = 'grid';
    
    
    //均匀网格布局行数(此值仅对网格布局(grid)及单元格布局(cell)有效)
    //number	整数值 
    //string    自定义行 如:'20 30% 20* *'表示4行 第一行固定宽度为20 第2行使用可用空间的30% 第3,4行使用全部剩余空间,第3行占比20/120 第4行占比100/120
    self.arrangeProperty('layoutRows', 3);

    //均匀网格布局列数(此值仅对网格布局(grid)及单元格布局(cell)有效)
    //number	整数值 
    //string    自定义列 如:'20 30% 20* *'表示4列 第一列固定宽度为20 第2列使用可用空间的30% 第3,4行使用全部剩余空间,第3行占比20/120 第4行占比100/120
    self.arrangeProperty('layoutColumns', 3);


    //横跨行数(此值仅在当前布局类型为网格布局(grid)时有效)
    //number	整数值(负整数表示横跨至倒数第几列)
    self.locationProperty('rowSpan', 0);

    //纵跨列数(此值仅在当前布局类型为网格布局(grid)时有效)
    //number	整数值(负整数表示横跨至倒数第几列)
    self.locationProperty('columnSpan', 0);

    //指定列索引(此值仅在当前布局类型为网格布局(grid)时有效)
    //number	整数值(0:不固定 正整数:指定使用第几列 负整数:指定使用倒数第几列)
    self.locationProperty('columnIndex', 0);

    //跳空网格数(此值仅在当前布局类型为网格布局(grid)时有效)
    //number	整数值
    self.locationProperty('spacingCells', 0);

    
    //排列布局
    self.arrange = function (container, clientRect, hscroll, vscroll, items, start, end, vertical) {

        
    };
    
    
});



//表格布局类
$class('TableLayout', flyingon.Layout, function (self, base) {


    self.type = 'table';
    
    
    //表格布局定义(此值仅对表格布局(table)有效)
    //行列格式: row[column ...] ... row,column可选值: 
    //整数            固定行高或列宽 
    //数字+%          总宽度或高度的百分比 
    //数字+*          剩余空间的百分比, 数字表示权重, 省略时权重默认为100
    //数字+css单位    指定单位的行高或列宽
    //列可嵌套表或表组 表或表组可指定参数
    //参数集: (name1=value1, ...)   多个参数之间用逗号分隔
    //嵌套表: {(参数集) row[column ...] ...} 参数集可省略
    //嵌套表组: <(参数集) { ... } ...> 参数集可省略 多个嵌套表之间用空格分隔
    //示例(九宫格正中内嵌九宫格,留空为父表的一半): '*[* * *] *[* * {(spacingWidth=50% spacingHeight=50%) *[* * *] *[* * *] *[* * *]} *] *[* * *]'
    self.arrangeProperty('layoutTable', '*[* * *] *[* * *] *[* * *]', 'last-value');

    
    //排列布局
    self.arrange = function (container, clientRect, hscroll, vscroll, items, start, end, vertical) {

        
    };
    
    
});



//层叠布局类
$class('CascadeLayout', flyingon.Layout, function (self, base) {


    self.type = 'cascade';
    
    
    //排列布局
    self.arrange = function (container, clientRect, hscroll, vscroll, items, start, end, vertical) {

        var x = clientRect.left,
            y = clientRect.top,
            width = clientRect.width,
            height = clientRect.height,
            maxWidth = 0,
            maxHeight = 0;

        for (var i = start; i <= end; i++)
        {
            if ((box = (item = items[i]).boxModel()).visible)
            {
                margin = box.margin;
                
                item.measure(box, width, height);
                cache = item.locate(box, x + margin.left, y + margin.top, width, height);
                
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
$class('AbsoluteLayout', flyingon.Layout, function (self, base) {


    self.type = 'absolute';
    
    
    //排列布局
    self.arrange = function (container, clientRect, hscroll, vscroll, items, start, end, vertical) {

        var x = clientRect.left,
            y = clientRect.top,
            maxWidth = 0,
            maxHeight = 0;

        for (var i = start; i <= end; i++)
        {
            if ((box = (item = items[i]).boxModel()).visible)
            {
                item.measure(box, 0, 0, true, true);
                cache = item.locate(box, item.locationValue('left'), item.locationValue('top'));
                
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



