
//单位换算
(function (flyingon) {


    var pixel_unit = flyingon.create(null), //单位换算列表

        pixel_list = flyingon.create(null), //缓存的单位转换值

        regex_unit = /[a-zA-z]+|%/, //计算尺寸正则表达式

        regex_sides = /[+-]?[\w%.]+/g, //4边解析正则表达式
        
        sides_list = flyingon.create(null), //4边缓存列表
        
        parse = parseFloat,
        
        pixel;
    
    
    //计算单位换算列表
    flyingon.dom_test(function (div) {

        var list = pixel_unit;

        //计算单位换算列表
        div.style.cssText = 'position:absolute;overflow:scroll;border:0;padding:0;left:-10000em;top:-10000in;width:10000ex;height:100px;';

        list.px = 1;
        list.ex = div.offsetWidth / 10000;
        list.em = list.rem = -div.offsetLeft / 10000;
        
        list.pt = (list.pc = (list['in'] = -div.offsetTop / 10000) / 6) / 12;
        list.mm = (list.cm = list['in'] / 2.54) / 10;

        div.style.width = '100px';
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
            return cache !== true ? cache : parse(value) * size / 100 + 0.5 | 0;
        }

        if (cache = value.match(regex_unit)) 
        {
            if ((cache = cache[0]) === '%')
            {
                pixel_list[value] = true;
                return parse(value) * size / 100 + 0.5 | 0;
            }
            
            cache = cache.toLowerCase();
        }

        return pixel_list[value] = parse(value) * (pixel_unit[cache] || 1) + 0.5 | 0;
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

        target.width = target.left + target.right;
        target.height = target.top + target.bottom;
        target.cache = (width = target.width + target.height) === width; //非NaN则缓存

        return target;
    };
    

})(flyingon);



//可定位对象接口
$class('ILocatable', [Object, flyingon.Component], function () {
   
    
    var pixel = flyingon.pixel,
        pixel_sides = flyingon.pixel_sides;

    
    this.locationProperty = function (name, defaultValue, attributes) {
        
        attributes = attributes || {};
        attributes.group = 'location';
        attributes.query = true;
        attributes.set = (attributes.set ? attributes.set + '\n\t' : '') 
            + 'if (!this.__update_dirty)\n\t'
            + '{\n\t\t'
                + 'this.__update_dirty = true;\n\t\t'
                + 'this.invalidate();\n\t'
            + '}';

        this.defineProperty(name, defaultValue, attributes);
    };
    
        
    //默认设置重绘状态
    this.__update_dirty = true;
    
    //控件默认宽度(width === 'default'时的宽度)
    this.defaultWidth = 100;

    //控件默认高度(height === 'default'时的高度)
    this.defaultHeight = 21;

    //是否可见
    this.locationProperty('visible', true, {
     
        set: 'this.dom.style.display = value ? "" : "none";'
    });
        
    
    //控件横向对齐方式
    //left      左边对齐
    //center    横向居中对齐
    //right     右边对齐
    this.locationProperty('alignX', 'left');

    //控件纵向对齐方式
    //top       顶部对齐
    //middle    纵向居中对齐
    //bottom    底部对齐
    this.locationProperty('alignY', 'top');


    this.locationProperty('left', '0');

    this.locationProperty('top', '0');

    this.locationProperty('width', 'default');

    this.locationProperty('height', 'default');


    this.locationProperty('minWidth', '0');

    this.locationProperty('maxWidth', '0');

    this.locationProperty('minHeight', '0');

    this.locationProperty('maxHeight', '0');


    this.locationProperty('margin', '0');

    this.locationProperty('border', '0', {
    
        set: 'this.dom.style.borderWidth = value > 0 ? value + "px" : value;\n\t'
    });

    this.locationProperty('padding', '0', {
     
        set: 'this.__style_padding(value > 0 ? value + "px" : value);'
    });
    
    
    //设置dom padding方法
    this.__style_padding = function (value) {
    
        this.dom.style.padding = value;
    };

    
    this.invalidate = function () {};


    //获取定位属性值
    this.locationValue = function (name) {
      
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
    this.boxModel = function (width, height) {
      
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
    this.measure = function (
        box, //盒模型
        available_width, //可用宽度 
        available_height, //可用高度
        less_width_to_default, //宽度不足时是否使用默认宽度
        less_height_to_default, //高度不足时是否使用默认高度
        default_width_to_fill, //默认宽度是否转为充满
        default_height_to_fill //默认高度是否转为充满
    ) {
        
        var width = box.width, 
            height = box.height,
            auto_width,
            auto_height;

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
                width = less_width_to_default = auto_width = true;
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
                height = less_height_to_default = auto_height = true;
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

        //检测宽高范围
        this.__check_size(box, width, height);

        //测量自动大小
        if ((auto_width || auto_height) && this.measure_auto(box, auto_width, auto_height) !== false)
        {
            this.__check_size(box, width, height);
        }
    };
    
    
    //检测宽高范围
    this.__check_size = function (box, width, height) {
      
        //处理最小及最大宽度
        if (width < box.minWidth)
        {
            width = box.minWidth;
        }
        else if (box.maxWidth > 0 && width > box.maxWidth)
        {
            width = box.maxWidth;
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
        
        this.offsetWidth = width;
        this.offsetHeight = height
    };
    
    
    //测量自动大小
    this.measure_auto = function (box, auto_width, auto_height) {
        
        return false;
    };
    
    
    //定位(不可以手动调用或重载此函数，由布局系统自动调用)
    this.locate = function (box, x, y, align_width, align_height) {
        
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

        return {
            
            right: (this.offsetLeft = x) + this.offsetWidth + margin.right,
            bottom: (this.offsetTop = y) + this.offsetHeight + margin.bottom
        };
    };
            
    
});



//容器组件接口
flyingon.IContainer = function () {
    
    
    this.arrange = function () {
        
    };
    
    
    this.arrange_range = function (border, padding) {
      
        var width = this.offsetWidth - border.width - padding.width,
            height = this.offsetHeight - border.height - padding.height;

        this.arrangeLeft = padding.left;
        this.arrangeTop = padding.top;
        this.arrangeWidth = width >= 0 ? width : 0;
        this.arrangeHeight = height >= 0 ? height : 0;
    };
    
    
};
