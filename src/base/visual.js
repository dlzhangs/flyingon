
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




//可视组件基类
$class('Visual', [Object, flyingon.IComponent], function () {
   
    
        
    this.locateProperty = function (name, defaultValue, attributes) {
        
        attributes = attributes || {};
        attributes.group = 'locate';
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
    
    
    //默认位置及大小
    this.offsetLeft = this.offsetTop = this.offsetWidth = this.offsetHeight = 0;
        
    
    //控件默认宽度(width === 'default'时的宽度)
    this.defaultWidth = 100;

    //控件默认高度(height === 'default'时的高度)
    this.defaultHeight = 21;

    //是否可见
    this.locateProperty('visible', true, {
     
        set: 'this.dom && this.dom.style.display = value ? "" : "none";'
    });
        

    //控件横向对齐方式
    //left      左边对齐
    //center    横向居中对齐
    //right     右边对齐
    this.locateProperty('alignX', 'left');

    //控件纵向对齐方式
    //top       顶部对齐
    //middle    纵向居中对齐
    //bottom    底部对齐
    this.locateProperty('alignY', 'top');


    this.locateProperty('left', '0');

    this.locateProperty('top', '0');

    this.locateProperty('width', 'default');

    this.locateProperty('height', 'default');


    this.locateProperty('minWidth', '0');

    this.locateProperty('maxWidth', '0');

    this.locateProperty('minHeight', '0');

    this.locateProperty('maxHeight', '0');


    this.locateProperty('margin', '0');


    
    //使布局失效
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
    
    
    
    //测量处理
    this.measure = function (autoWidth, autoHeight) {
        
        return false;
    };
    
    
    this.locate = function () {
      
        return false;
    };
    
    
    
});



//定义定位属性方法
flyingon.locateProperty = function (name, defaultValue, attributes) {

    flyingon.Visual.prototype.locateProperty(name, defaultValue, attributes);
};
    

