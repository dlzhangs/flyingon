
//单位换算
(function (flyingon) {


    var unit = flyingon.create(null), //单位换算列表

        pixel_list = flyingon.create(null), //缓存的单位转换值

        regex_unit = /[a-zA-z]+|%/, //计算尺寸正则表达式

        regex_sides = /[+-]?[\w%.]+/g, //4边解析正则表达式
        
        sides_list = flyingon.create(null), //4边缓存列表
        
        parse = parseFloat;
    
    
    //初始化默认值
    unit.em = unit.rem = 12;
    unit.ex = 6;
    unit.pc = 16;
    unit.px = 1;
    unit.pt = 4 / 3;
    
    unit.mm = (unit.cm = 96 / 2.54) / 10;
    unit['in'] = 96;
    

    //或者或设置象素转换单位
    (flyingon.pixel_unit = function (name, value) {

        if (value === void 0)
        {
            return unit[name];
        }

        if (unit[name] !== value)
        {
            unit[name] = value;

            var list = pixel_list;

            for (var key in list)
            {
                if (key.indexOf(name) > 0)
                {
                    list[key] = void 0;
                }
            }
        }
                
    }).unit = unit;


    //转换css尺寸为像素值
    //注: em与rem相同, 且在初始化时有效
    flyingon.pixel = function (value, size) {

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

        return pixel_list[value] = parse(value) * (unit[cache] || 1) + 0.5 | 0;
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
            return sides_values(value);
        }
        
        if (value && (values = value.match(regex_sides)))
        {
            sides_list[value] = values;

            if (value.indexOf('%') < 0)
            {
                values = pixel_sides(value, values);
                values.cache = true;
                
                return values;
            }
        }
        else
        {
            return sides_values('');
        }

        return pixel_sides(value, values, width);
    };
    
    
    function sides_values(value) {
    
        return sides_list[value] = { 

            cache: true,
            text: value,
            left: value |= 0, 
            top: value, 
            right: value, 
            bottom: value, 
            width: value = value << 1, 
            height: value
        };
    };
    
    
    function pixel_sides(text, sides, width) {
        
        var target = { text: text },
            fn = flyingon.pixel;
        
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




//控件类
//IE7点击滚动条时修改className会造成滚动条无法拖动,需在改变className后设置focus获取焦点解决此问题
$class('Control', function () {

    

    var self = this;
            
     
                
    //向上冒泡对象名
    this.eventBubble = '__parent';
    
        
                
    //控件默认宽度(width === 'default'时的宽度)
    this.defaultWidth = 100;

    //控件默认高度(height === 'default'时的高度)
    this.defaultHeight = 21;
    
    
    
    //当前绘制器
    this.renderer = null;
    
    
    
    //引入可绑定功能片段
    flyingon.BindableFragment(this);
    
    

    //父控件
    this.parent = function () {

        return this.__parent || null;
    };
    
    
    //获取调整控件在父控件中的索引
    this.index = function (index) {
        
        var list, cache;
        
        if ((cache = this.__parent) && (list = cache.__children))
        {
            cache = list.indexOf(this);
        }
        else
        {
            cache = -1;
        }
        
        if (index === void 0)
        {
            return cache;
        }
        
        if (list && index !== cache && cache >= 0 && index >= 0 && index < list.length)
        {
            list.splice(cache, 1);
            list.splice(index, 0, this);
            
            this.invalidate();
        }
    };
    
        
        
    //文本
    this.defineProperty('text', '');
    
    

    
    //指定class名 与html一样
    this.defineProperty('className', '', {

        set: 'this.view && this.renderer.className(this, value);'
    });
    
    
    //引入class片段支持
    flyingon.ClassFragment(this);
    
    
    
    
    //重载定义属性设置处理
    this.__defineProperty_set = function (data, name, attributes) {
      
        var cache;
        
        if (cache = attributes.style)
        {
            if (cache === true)
            {
                cache = name;
            }
            
            if (attributes.style_set)
            {
                data.push('\n\n\t', attributes.style_set);
            }
            
            data.push('\n\n\t',
                '(this.__style_values || (this.__style_values = {}))["', cache, '"] = value;\n\n\t',
                'this.view && this.renderer.style(this, "', cache, '", value);');
        }
        else if (cache = attributes.attribute)
        {
            if (cache === true)
            {
                cache = name;
            }
            
            if (attributes.dataType = 'boolean')
            {
                data.push('\n\n\t', 'if (value) value = "', name, '";');
            }
            
            data.push('\n\n\t',
                '(this.__attribute_values || (this.__attribute_values = {}))["', cache, '"] = value;\n\n\t',
                'this.view && this.renderer.attribute(this, "', cache, '", value);');
        }
        
        if (attributes.invalidate)
        {
            data.push('\n\n\t', 'if (!this.__update_dirty) this.invalidate();');
        }
    };
    


    //定义定位属性
    function location(name, defaultValue, attributes) {
        
        attributes = attributes || {};
        attributes.group = 'location';
        attributes.query = true;
        attributes.invalidate = true;

        self.defineProperty(name, defaultValue, attributes);
    };
    
    
    flyingon.locationProperty = location;
    
    
    //是否可见
    location('visible', true);
        

    //控件横向对齐方式
    //left      左边对齐
    //center    横向居中对齐
    //right     右边对齐
    location('alignX', 'left');

    //控件纵向对齐方式
    //top       顶部对齐
    //middle    纵向居中对齐
    //bottom    底部对齐
    location('alignY', 'top');


    location('left', '');

    location('top', '');

    location('width', 'default');

    location('height', 'default');


    location('minWidth', '');

    location('maxWidth', '');

    location('minHeight', '');

    location('maxHeight', '');


    location('margin', '');

    
        
    //边框宽度
    this.defineProperty('border', '', {

        group: 'layout',
        invalidate: true,
        style: 'border-width',
        style_set: 'if (value > 0) value = value + "px";'
    });

    
    //内边距
    this.defineProperty('padding', '', {

        group: 'layout',
        invalidate: true
    });
    
    
    //水平方向超出内容时显示方式
    this.defineProperty('overflowX', 'auto', {

        group: 'layout',
        invalidate: true,
        style: 'overflow-x'
    });
      
    
    //竖直方向超出内容时显示方式
    this.defineProperty('overflowY', 'auto', {

        group: 'layout',
        invalidate: true,
        style: 'overflow-y'
    });
    
    
    
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
    
    

    //初始化盒子模型
    this.initBoxModel = function (width, height) {

        var storage = this.__storage || this.__defaults;
        
        if (storage && !storage.visible)
        {
            return this.boxModel = null;
        }
        
        var box = this.boxModel || (this.boxModel = {}),
            fn = flyingon.pixel_sides,
            values = this.__location_values,
            value;
        
        box.margin = fn(values && values.margin || storage.margin, width);
        box.border = fn(values && values.border || storage.border, width);
        box.padding = fn(values && values.padding || storage.padding, width);
        
        fn = flyingon.pixel;
        
        box.autoWidth = box.autoHeight = false;
        
        switch (value = values && values.width || storage.width)
        {
            case 'default':
                box.width = false;
                break;
                
            case 'fill':
                box.width = true;
                break;
                
            case 'auto':
                box.width = box.autoWidth = true;
                break;
                
            default:
                box.width = fn(value, width);
                break;
        }
        
        switch (value = values && values.height || storage.height)
        {
            case 'default':
                box.height = false;
                break;
                
            case 'fill':
                box.height = true;
                break;
                
            case 'auto':
                box.height = box.autoHeight = true;
                break;
                
            default:
                box.height = fn(value, height);
                break;
        }
        
        value = fn(values && values.minWidth || storage.minWidth, width);
        box.minWidth = value >= 0 ? value : 0;
        
        value = fn(values && values.maxWidth || storage.maxWidth, width);
        box.maxWidth = value >= box.minWidth ? value : box.minWidth;
        
        value = fn(values && values.minHeight || storage.minHeight, height);
        box.minHeight = value >= 0 ? value : 0;
        
        value = fn(values && values.maxHeight || storage.maxHeight, height);
        box.maxHeight = value >= box.maxHeight ? value : box.minHeight;
        
        box.alignX = values && values.alignX || storage.alignX;
        box.alignY = values && values.alignY || storage.alignY;
        
        return box;
    };
    
    
         
    //测量控件大小
    //availableWidth    可用宽度 
    //availableHeight   可用高度
    //lessWidth         宽度不足时的宽度 true:默认宽度 正整数:指定宽度 其它:0
    //lessHeight        高度不足时的高度 true:默认高度 正整数:指定高度 其它:0
    //defaultWidth      默认宽度 true:可用宽度 正整数:指定宽度 其它:0
    //defaultHeight     默认高度 true:可用高度 正整数:指定高度 其它:0
    this.measure = function (availableWidth, availableHeight, lessWidth, lessHeight, defaultWidth, defaultHeight) {
        
        var box = this.boxModel,
            minWidth = box.minWidth,
            maxWidth = box.maxWidth,
            minHeight = box.minHeight,
            maxHeight = box.maxHeight,
            width = box.width,
            height = box.height;

        //处理宽度
        if (width === false)
        {
            width = defaultWidth || this.defaultWidth;
        }
        
        //充满可用宽度
        if (width === true)
        {
            if ((availableWidth -= box.margin.width) > 0) //有可用空间
            {
                width = availableWidth;
            }
            else if (lessWidth === true) //可用空间不足时使用默认宽度
            {
                width = this.defaultWidth;
            }
            else //无空间
            {
                width = lessWidth || 0;
            }
        }

        //处理高度
        if (height === false)
        {
            height = defaultHeight || this.defaultHeight;
        }
        
        //充满可用高度
        if (height === true)
        {
            if ((availableHeight -= box.margin.height) > 0) //有可用空间
            {
                height = availableHeight;
            }
            else if (lessHeight === true) //可用空间不足时使用默认高度
            {
                height = this.defaultHeight;
            }
            else //无空间
            {
                height = lessHeight || 0;
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
        this.offsetWidth = width;
        this.offsetHeight = height;
        
        //测量后处理
        if (this.onmeasure(box) !== false)
        {
            //处理最小及最大宽度
            if (this.offsetWidth !== width)
            {
                if ((width = this.offsetWidth) < minWidth)
                {
                    this.offsetWidth = minWidth;
                }
                else if (maxWidth > 0 && width > maxWidth)
                {
                    this.offsetWidth = maxWidth;
                }
            }

            //处理最小及最大高度
            if (this.offsetHeight !== height)
            {
                if ((height = this.offsetHeight) < minHeight)
                {
                    this.offsetHeight = minHeight;
                }
                else if (maxHeight > 0 && height > maxHeight)
                {
                    this.offsetHeight = maxHeight;
                }
            }
        }
    };
    
        
    //自定义测量处理
    this.onmeasure = function (box) {
        
        return false;
    };
    

    //定位控件
    this.locate = function (x, y, alignWidth, alignHeight, container) {
        
        var box = this.boxModel,
            margin = box.margin,
            width = this.offsetWidth,
            height = this.offsetHeight,
            value;

        if (alignWidth > 0 && (value = alignWidth - width))
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

        if (alignHeight > 0 && (value = alignHeight - height))
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
        
        this.offsetLeft = x;
        this.offsetTop = y;
        
        if (this.onlocate(box) !== false)
        {
            x = this.offsetLeft;
            y = this.offsetTop;
        }
        
        if (container)
        {
            container.arrangeX = (x += width + margin.right);
            container.arrangeY = (y += height + margin.bottom);

            if (x > container.contentWidth)
            {
                container.contentWidth = x;
            }

            if (y > container.contentHeight)
            {
                container.contentHeight = y;
            }
        }
        
        //标记控件需要更新
        this.__update_dirty = true;
    };
    
    
    //自定义定位处理
    this.onlocate = function (box) {
      
        return false;
    };
    
        
    
    //创建样式
    function style(name) {

        var key = name.replace(/-(\w)/g, function (_, x) {
        
            return x.toUpperCase();
        });
        
        //定义属性
        self.defineProperty(key, '', {

            group: 'appearance',
            style: name
        });
    };
    
    
    //定义样式属性
    flyingon.styleProperty = style;
    


    //控件层叠顺序
    style('z-index');

    
    //控件上右下左边框样式
    style('border-style');


    //控件上右下左边框颜色
    style('border-color');


    //控件上右下左边框圆角
    style('border-radius');


    //阅读方向
    //ltr	    从左到右 
    //rtl	    从右到左 
    style('direction');


    //控件内容横向对齐样式
    //left      左边对齐
    //center    横向居中对齐
    //right     右边对齐
    style('text-align');

    //控件内容纵向对齐样式
    //top       顶部对齐
    //middle    纵向居中对齐
    //bottom    底部对齐
    style('vertical-align');



    //控件可见性
    //visible	默认值 元素是可见的 
    //hidden	元素是不可见的 
    style('visibility');

    //控件透明度
    //number	0(完全透明)到1(完全不透明)之间数值
    style('opacity');

    //控件光标样式
    //url	    需使用的自定义光标的 URL     注释：请在此列表的末端始终定义一种普通的光标, 以防没有由 URL 定义的可用光标 
    //default	默认光标(通常是一个箭头)
    //auto	    默认 浏览器设置的光标 
    //crosshair	光标呈现为十字线 
    //pointer	光标呈现为指示链接的指针(一只手)
    //move	    此光标指示某对象可被移动 
    //e-resize	此光标指示矩形框的边缘可被向右(东)移动 
    //ne-resize	此光标指示矩形框的边缘可被向上及向右移动(北/东) 
    //nw-resize	此光标指示矩形框的边缘可被向上及向左移动(北/西) 
    //n-resize	此光标指示矩形框的边缘可被向上(北)移动 
    //se-resize	此光标指示矩形框的边缘可被向下及向右移动(南/东) 
    //sw-resize	此光标指示矩形框的边缘可被向下及向左移动(南/西) 
    //s-resize	此光标指示矩形框的边缘可被向下移动(南) 
    //w-resize	此光标指示矩形框的边缘可被向左移动(西) 
    //text	    此光标指示文本 
    //wait	    此光标指示程序正忙(通常是一只表或沙漏) 
    //help	    此光标指示可用的帮助(通常是一个问号或一个气球) 
    style('cursor');


    //控件背景颜色
    //color_name	规定颜色值为颜色名称的背景颜色(比如 red)  transparent:透明 
    //hex_number	规定颜色值为十六进制值的背景颜色(比如 #ff0000) 
    //rgb_number	规定颜色值为 rgb 代码的背景颜色(比如 rgb(255,0,0)) 
    style('background-color');

    //控件背景图片
    //string        图像名(空字符串则表示无背景)
    //url('URL')	指向图像的路径
    style('background-image');

    //控件背景重复方式
    //repeat	背景图像将在垂直方向和水平方向重复 
    //repeat-x	背景图像将在水平方向重复 
    //repeat-y	背景图像将在垂直方向重复 
    //no-repeat	背景图像将仅显示一次 
    style('background-repeat');

    //控件背景颜色对齐方式
    //top left
    //top center
    //top right
    //center left
    //center center
    //center right
    //bottom left
    //bottom center
    //bottom right  如果您仅规定了一个关键词, 那么第二个值将是'center'     默认值：0% 0% 
    //x% y%	        第一个值是水平位置, 第二个值是垂直位置     左上角是 0% 0% 右下角是 100% 100%     如果您仅规定了一个值, 另一个值将是 50% 
    //xpos ypos	    第一个值是水平位置, 第二个值是垂直位置     左上角是 0 0 单位是像素 (0px 0px) 或任何其他的 CSS 单位     如果您仅规定了一个值, 另一个值将是50%     您可以混合使用 % 和 position 值 
    style('background-position');


    //控件颜色
    //color_name	规定颜色值为颜色名称的颜色(比如 red) 
    //hex_number	规定颜色值为十六进制值的颜色(比如 #ff0000) 
    //rgb_number	规定颜色值为 rgb 代码的颜色(比如 rgb(255,0,0)) 
    style('color');


    //控件字体样式
    //normal	浏览器显示一个标准的字体样式 
    //italic	浏览器会显示一个斜体的字体样式 
    //oblique	浏览器会显示一个倾斜的字体样式 
    style('font-style');

    //控件字体变体
    //normal	    浏览器会显示一个标准的字体 
    //small-caps	浏览器会显示小型大写字母的字体 
    style('font-variant');

    //控件字体粗细
    //normal	定义标准的字符 
    //bold	    定义粗体字符 
    //bolder	定义更粗的字符 
    //lighter	定义更细的字符 
    //100-900   定义由粗到细的字符 400 等同于 normal, 而 700 等同于 bold 
    style('font-weight');

    //控件字体大小
    style('font-size');

    //控件文字行高
    style('line-height');

    //控件字体族 family-name generic-family  用于某个元素的字体族名称或/及类族名称的一个优先表
    style('font-family');



    //控件文字词间距(以空格为准)
    style('word-spacing');

    //控件文字字间距
    style('letter-spacing');

    //控件文字缩进
    style('text-indent');

    //控件文字装饰
    //none	        默认 定义标准的文本 
    //underline	    定义文本下的一条线 
    //overline	    定义文本上的一条线 
    //line-through	定义穿过文本下的一条线 
    //blink	        定义闪烁的文本 
    style('text-decoration');

    //控件文字溢出处理方式
    //clip	    修剪文本
    //ellipsis	显示省略符号来代表被修剪的文本 	
    //string	使用给定的字符串来代表被修剪的文本 
    style('text-overflow');
    
    
    
        
    this.defineProperty('tabIndex', 0, {
     
        attribute: true
    });
    
    
    this.defineProperty('disabled', false, {
     
        attribute: true
    });
    

    this.defineProperty('readonly', false, {
     
        attribute: true
    });
    
    
    
    //none
    //x
    //y
    //all
    this.defineProperty('resizable', 'none');
    
    
    this.defineProperty('draggable', false);
    
    
    this.defineProperty('droppable', false);

    
           

    //默认设置重绘状态
    this.__update_dirty = true;
    
        
    //使布局无效
    this.invalidate = function () {
        
        if (!this.__update_dirty)
        {
            var parent = this.__parent;

            this.__update_dirty = true;
        
            if (parent)
            {
                parent.invalidate();
            }
            else
            {
                flyingon.__delay_update(this);
            }
        }
        
        return this;
    };
    
        
    
    
    //更新视区
    this.update = function () {
        
        if (this.__update_dirty)
        {
            this.render();
            this.__update_dirty = false;
        }
        
        return this;
    };
    
    
    
    //渲染控件
    this.render = function () {
        
        this.renderer.render(this);
        return this;
    };
    
    
    
    
    //引入序列化片段
    flyingon.SerializeFragment(this);
    
    
    
    //销毁控件    
    this.dispose = function () {
    
        var cache = this.__dataset;
        
        this.__parent = null;
        
        if (cache)
        {
            cache.subscribe(this, true);
        }
        
        if (this.view)
        {
            this.renderer.recycle(this);
        }
        
        if (this.__events)
        {
            this.off();
        }
    };
    
    
    
    //控件类初始化处理
    this.__class_init = function (Class, base) {
     
        var name = Class.xtype;
        
        if (name)
        {
            name = name.replace(/\./g, '-');
            
            if (base = base.defaultClassName)
            {
                 name = base + ' ' + name;
            }
            
            this.defaultClassName = name;
        }
    };

    
});



