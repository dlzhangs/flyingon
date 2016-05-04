
//布局相关基础方法
(function (flyingon) {


    var pixel_unit = flyingon.create(null), //单位换算列表

        pixel_list = flyingon.create(null), //缓存的单位转换值

        regex_unit = /[a-zA-z]+|%/, //计算尺寸正则表达式

        regex_sides = /[+-]?[\w%.]+/g, //4边解析正则表达式
        
        sides_list = flyingon.create(null), //4边缓存列表
        
        round = Math.round,

        parse = parseFloat,
        
        pixel;
    
    
    //计算单位换算列表
    flyingon.dom_test(function (div) {

        var list = pixel_unit,
            style = div.style;

        //计算单位换算列表
        style.cssText = 'position:absolute;overflow:scroll;border:0;padding:0;left:-10000ex;top:-10000em;width:10000cm;height:10000in;'

        list.px = 1;
        list.ex = -div.offsetLeft / 10000;
        list.em = list.rem = -div.offsetTop / 10000;
        list.cm = (list.cm = div.offsetWidth / 10000) * 10;
        list.pt = (list.pc = (list['in'] = div.offsetHeight / 10000) / 6) / 12;

        style.width = style.height = '100px';
        div.innerHTML = "<div style='position:relative;width:200px;height:200px;'></div>";

        //竖直滚动条宽度
        flyingon.vscroll_width = div.offsetWidth - div.clientWidth;

        //水平滚动条高度
        flyingon.hscroll_height = div.offsetHeight - div.clientHeight;

        div.innerHTML = '';
        
    });


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
        
        var values = sides_list[value];
        
        if (values)
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
            if ((values = pixel_sides(values)).cache)
            {
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

        target.width = target.left + target.right
        target.height = target.top + target.bottom;
        target.cache = !isNaN(target.width, target.height);
            
        return target;
    };
    

})(flyingon);



//可定位对象接口
flyingon.ILocatable = function (self, control) {
   
    
    var ILocatable = flyingon.ILocatable,
        extend_list = ILocatable.__extend_list,
        extend = flyingon.extend,
        pixel = flyingon.pixel,
        pixel_sides = flyingon.pixel_sides;

    
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
            attributes.set = ((set = attributes.set) ? set + '\n\t' : '') 
                + 'if (this.__has_measure) { this.__has_measure = false;this.invalidate(); }';
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
     
        set: 'this.__style_padding(value > 0 ? value + "px" : value);'
    });
    
    
    //设置dom padding方法
    self.__style_padding = function (value) {
    
        this.dom.style.padding = value;
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
      
        var box = this.__boxModel,
            storage = this.__storage || this.__defaults,
            values = this.__location_values,
            fn = pixel,
            value;
        
        if (values)
        {
            if ((value = values.visible) != null ? value : storage.visible)
            {
                if (!box || !box.visible)
                {
                    box = this.__boxModel = { visible: true };
                }
                
                box.alignX = values.alignX || storage.alignX;
                box.alignY = values.alignY || storage.alignY;

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
        else if (storage.visible)
        {
            if (!box || !box.visible)
            {
                box = this.__boxModel = { visible: true };
            }
            
            box.alignX = storage.alignX;
            box.alignY = storage.alignY;
            
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
        
        return this.__boxModel = box_default;
    };
    
    
    //测量大小(不可以手动调用或重载此函数，由布局系统自动调用)
    self.measure = function (
        box, //盒模型
        available_width, //可用宽度 
        available_height, //可用高度
        less_width_to_default, //宽度不足时是否使用默认宽度
        less_height_to_default, //高度不足时是否使用默认高度
        default_width_to_fill, //默认宽度是否转为充满
        default_height_to_fill //默认高度是否转为充满
    ) {
        
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
                width = less_width_to_default = true;
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
                height = less_height_to_default = true;
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
        
        this.__has_measure = true;
    };
    
    
    //测量后处理
    self.onmeasure = function (box, width, height) {
        
    };
    
    
    //定位(不可以手动调用或重载此函数，由布局系统自动调用)
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
                    
                default:
                    x += margin.left;
                    break;
            }
        }
        else
        {
            x += margin.left;
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
                    
                default:
                    y += margin.top;
                    break;
            }
        }
        else
        {
            y += margin.top;
        }

        //定位后处理, 不可以修改位置
        this.onlocate(box, this.offsetLeft = x, this.offsetTop = y);
        
        return {
            
            right: x + this.offsetWidth + margin.right,
            bottom: y + this.offsetHeight + margin.bottom
        };
    };
    
    
    //定位后处理, 不可以修改位置
    self.onlocate = function (box, x, y) {
        
    };
        
    
};



//子布局
$class('Sublayout', [Object, flyingon.Component], function (self) {
       
    
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
    
    
    self.onmeasure = function (box, width, height) {
    
        var layout = this.__layout_,
            items = this.__allot,
            box = this.__boxModel || this.boxModel();

        this.compute_arrange(box.border, box.padding);
        
        layout.init(this, false, false, items[0], items[1], items[2], true);

        if (box.width === 'auto')
        {
            this.offsetWidth = this.contentWidth;
        }
        
        if (box.height === 'auto')
        {
            this.offsetHeight = this.contentHeight;
        }
    };
    
    
    //计算排列空间
    self.compute_arrange = function (border, padding) {

        var width = this.offsetWidth - border.width - padding.width,
            height = this.offsetHeight - border.height - padding.height;

        this.arrangeLeft = border.left + padding.left;
        this.arrangeTop = border.top + padding.top;
        this.arrangeWidth = width >= 0 ? width : 0;
        this.arrangeHeight = height >= 0 ? height : 0;
    };
        
    
    //排列后调整位置
    self.onarrange = function () {
        
        var x = this.offsetLeft,
            y = this.offsetTop,
            items, 
            item, 
            start,
            end;
        
        //处理定位偏移
        if (x && y && (items = this.__allot))
        {
            start = items[1];
            end = items[2];
            items = items[0];
            
            while (start <= end)
            {
                item = items[start++];
                
                item.offsetLeft += x;
                item.offsetTop += y;
            }
            
            this.__allot = null;
        }
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
$class('Layout', [Object, flyingon.Component], function (self) {

    

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

        
    //滚动条大小
    self.hscroll_height = flyingon.hscroll_height;
    
    self.vscroll_width = flyingon.vscroll_width;
    
    
    //计算css单位为象素值方法
    self.pixel = flyingon.pixel;
    
    
    //初始化排列
    self.init = function (container, hscroll, vscroll, items, start, end, sublayout) {
        
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

            //位置调整
            while (cache >= 0)
            {
                sublayouts[cache--].onarrange();
            }
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

            if (start > end)
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
            
            layout.__allot = [items, end - length + 1, end];

            if (start > (end -= length))
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

            if (start > end)
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
    self.arrange = function (container, hscroll, vscroll, items, start, end, vertical) {

    };
    
        
    //排列检测
    self.arrange_check = function (maxWidth, maxHeight, data) {
        
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
    self.arrange = function (container, hscroll, vscroll, items, start, end, vertical) {

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
    self.arrange = function (container, hscroll, vscroll, items, start, end, vertical) {

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
    self.arrange = function (container, hscroll, vscroll, items, start, end, vertical) {

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
$class('CascadeLayout', flyingon.Layout, function (self, base) {


    self.type = 'cascade';
    
    
    //排列布局
    self.arrange = function (container, hscroll, vscroll, items, start, end, vertical) {

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
$class('AbsoluteLayout', flyingon.Layout, function (self, base) {


    self.type = 'absolute';
    
    
    //排列布局
    self.arrange = function (container, hscroll, vscroll, items, start, end, vertical) {

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
    
    
    var parse_list = {},
        regex = /[*%\[\]{}()/!]|[\w.]+|\.{3}/g,
        pixel = flyingon.pixel;
    
    
    function parse(items, token, tokens, index) {
        
        if (token > 0)
        {
            switch (tokens[index])
            {
                case '*':
                    parse_star(items, token);
                    return ++index;
                    
                case '%':
                    parse_percent(items, token);
                    return ++index;
            }
        }
        else if ((token = pixel(token)) > 0)
        {
            items.push({ value: token });
        }
        
        return index;
    };
    
    
    function parse_star(items, token) {
      
        var value = +token || 100,
            item = { value: value, weight: true };
        
        item.weight += value;
        items.push(item);
    };
    
    
    function parse_percent(items, token) {
      
        var value = +token || 100,
            item = { value: value, percent: true };
        
        item.percent += value;
        items.push(item);
    };
    
    
    function parse_loop(items, token, tokens, index) {
        
    };
    
    
    function parse_rows(target, tokens, index) {
      
        var list = parse_rows,
            rows = target.rows = [],
            row;
        
        rows.weight = rows.percent = 0;
        
        while (token = tokens[index++])
        {
            index = (list[token] || parse)(rows, token, tokens, index);
        }
        
        return index;
    };
    
    
    function parse_columns(items, token, tokens, index) {
      
        var list = parse_columns,
            row = items[items.length - 1] || {},
            columns = row.columns = [];
        
        columns.weight = columns.percent = 0;
        
        while (token = tokens[index++])
        {
            if (token !== ']')
            {
                index = (list[token] || parse)(columns, token, tokens, index);
            }
            else
            {
                return index;
            }
        }
        
        return index;
    };
    
    
    function parse_table(items, token, tokens, index) {
      
        while (token = tokens[index++])
        {
            switch (token)
            {
                case '}':
                    return index;
                    
                case '(':
                    break;
                    
                default:
                    break;
            }
        }
        
        return index;
    };
    
    
    parse_rows['*'] = parse_columns['*'] = parse_star;
    
    parse_rows['...'] = parse_columns['...'] = parse_loop;
    
    parse_rows['['] = parse_columns;
    
    parse_columns['{'] = parse_table;
    
    
    return function (text) {
        
        var cache = parse_list[text];
        
        if (!cache)
        {
            parse_rows(cache = {}, text.match(regex), 0);
            cache = cache.rows;
        }
        
        return cache;
    };    
    
    
})();



//网格布局类
$class('GridLayout', flyingon.Layout, function (self, base) {


    var regex = /[*%]|[\w.]+/g;
        
    
    self.type = 'grid';


    //均匀网格布局行数
    //number	整数值 
    //string    自定义行 如:'20px 30% 20* *'表示4行 第一行固定宽度为20px 第2行使用可用空间的30% 第3,4行使用全部剩余空间,第3行占比20/120 第4行占比100/120
    self.arrangeProperty('rows', '3');

    //均匀网格布局列数
    //number	整数值 
    //string    自定义列 如:'20px 30% 20* *'表示4列 第一列固定宽度为20px 第2列使用可用空间的30% 第3,4行使用全部剩余空间,第3行占比20/120 第4行占比100/120
    self.arrangeProperty('columns', '3');
    
    //自动增加循环数 0表示不自动增长
    self.arrangeProperty('increase', 0, {
     
        minValue: 0
    });


    //横跨行数
    //number	整数值(负整数表示横跨至倒数第几列)
    self.locationProperty('rowspan', 0, {
     
        minValue: 0
    });

    //纵跨列数
    //number	整数值(负整数表示横跨至倒数第几列)
    self.locationProperty('colspan', 0, {
     
        minValue: 0
    });

    //间隔网格数
    //number	整数值
    self.locationProperty('spacing', 0, {
     
        minValue: 0
    });


    //排列布局
    self.arrange = function (container, hscroll, vscroll, items, start, end, vertical) {

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
            maxWidth = right,
            maxHeight = bottom,
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
            span1 = 'colspan';
            span2 = 'rowspan';
            
        }
        else
        {
            list1 = rows;
            list2 = columns;
            span1 = 'rowspan';
            span2 = 'colspan';
        }
        
        length1 = list1.length;
        length2 = list2.length;
        
        for (var i = start; i <= end; i++)
        {
            if ((item = items[i]).locationValue('visible'))
            {
                if (cache = item.locationValue('spacing'))
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
$class('TableLayout', flyingon.Layout, function (self, base) {

    
    //布局示例: *[* * *] *[* {(spacingX=50% spacingY=50%)*[* ..2] ..2} *] *[* * *]
    //loop 3 back 2
    var regex = /\w+|[*%\[\]{}()=]|../g;
    
    
    
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
    self.arrangeProperty('table', '*[* * *] *[* * *] *[* * *]', 'last-value');


    //排列布局
    self.arrange = function (container, hscroll, vscroll, items, start, end, vertical) {


    };

        
    function parse(items, tokeys, index) {
        
        
    };



});

