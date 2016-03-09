/*
* flyingon javascript library v0.0.1
* https://github.com/freeoasoft/flyingon 
* Copyright 2014, yaozhengyang
* licensed under the LGPL Version 3 licenses
*/

Array.prototype.remove || (Array.prototype.remove = function (item) {

    var index = this.indexOf(item);
    
    if (index >= 0)
    {
        this.splice(index, 1);
    }
});


Array.prototype.indexOf || (Array.prototype.indexOf = function (item) {

    for (var i = 0, _ = this.length; i < _; i++)
    {
        if (this[i] === item)
        {
            return i;
        }
    }
    
    return -1;
});


Array.prototype.lastIndexOf || (Array.prototype.lastIndexOf = function (item) {

    for (var i = this.length - 1; i >= 0; i--)
    {
        if (this[i] === item)
        {
            return i;
        }
    }
    
    return -1;
});


Function.prototype.bind || (Function.prototype.bind = function (context) {
    
    var fn = this;

    if (arguments.length > 1)
    {
        var list = [].slice.call(arguments, 1);

        return function () {

            var data = list.slice(0);
            data.push.apply(data, arguments);
            return fn.apply(context, data);
        };
    }

    return function () {

        return fn.apply(context, arguments);
    };
});


//循环处理
flyingon.each = function (values, fn, context) {
    
    if (values)
    {
        context = context || window;
        
        if (typeof values === 'string')
        {
            values = values.match(/\w+/g);
        }
        
        for (var i = 0, _ = values.length; i < _; i++)
        {
            fn.call(context, values[i], i);
        }
    }
};


//检测对象是否一个数组
flyingon.isArray = Array.isArray || (function () {

    var toString = Object.prototype.toString;

    return function (target) {

        return target && toString.call(target) === '[object Array]';
    };

})();



//dom样式扩展
(function (document, flyingon) {
    
    

    var dom = document.documentElement,

        fixed = flyingon.create(null), //css兼容处理

        prefix = 'ms',     //样式前缀

        regex = /^-(\w+)-/, //样式检测

        style,

        cache;



    //获取浏览器样式前缀
    if (cache = window.getComputedStyle)
    {
        style = cache(dom);

        for (var i = style.length - 1; i >= 0; i--)
        {
            if (cache = style[i].match(regex))
            {
                prefix = cache[1];
                break;
            }
        }
    }


    //测试样式
    style = dom.style;

    //转驼峰命名
    regex = /\-(\w)/g;

    //转换css名为驼峰写法
    function fn(_, x) {

        return x.toUpperCase();
    };


    //自动处理样式
    function css_name(name) {

        var key = name.replace(regex, fn);

        if (!(key in style) && 
            !((key = prefix + name.charAt(0).toUpperCase() + name.substring(1)) in style))
        {
            key = '';
        }

        return fixed[name] = {

            name: key
        };
    };


    //获取可用样式名
    //name: 要获取的样式名(css样式名, 以'-'分隔的样式名)
    flyingon.css_name = function (name) {

        return (fixed[name] || css_name(name)).name;
    };


    //设置css样式值
    //dom:      目标dom
    //name:     要获取的样式名(css样式名, 以'-'分隔的样式名)
    //value:    样式值
    flyingon.css_value = function (dom, name, value) {

        var items = fixed[name] || css_name(name),
            cache;

        if (cache = items.setter)
        {
            cache(value, dom);
        }
        else if (cache = items.name)
        {
            dom.style[cache] = value;
        }
    };


    //注册样式兼容处理
    //name:     要处理的样式名(css样式名, 以'-'分隔的样式名)
    //setter:   转换样式值的方法
    flyingon.css_fixed = function (name, setter, style_name) {

        if (name && !css_name(name).name && setter)
        {
            fixed[name] = {

                name: style_name,
                setter: setter
            };
        }
    };


    //处理ie透明度
    flyingon.css_fixed('opacity', function (value, dom) {


    });


    //处理ie允许选中
    flyingon.css_fixed('user-select', (function () {

        function event_false() {

            return false;
        };

        return function (value, dom) {

            if (dom)
            {
                (dom === document.body ? document : dom).onselectstart = value === 'none' ? event_false : null;
            }
        };

    })());
    
    
})(document, flyingon);



//dom事件扩展
(function (window, document, flyingon) {


    var events = flyingon.dom_events = flyingon.create(null), //dom事件集合
        id = 1,
        on = 'addEventListener',
        off = 'removeEventListener',
        prefix = '',
        fixed;


    //以下为通用事件扩展(IE8以下浏览器不支持addEventListener)
    //IE的attachEvent中this为window且执行顺序相反
    if (!window[on])
    {
        on = 'attachEvent',
        off = 'detachEvent',
        prefix = 'on';

        fixed = (function () {

            function preventDefault() {

                this.returnValue = false;
            };

            function stopPropagation() {

                this.cancelBubble = true;
            };

            function stopImmediatePropagation() {

                this.cancelBubble = true;
                this.returnValue = false;
            };

            return function (e) {

                e.target = e.srcElement;
                e.preventDefault = preventDefault;
                e.stopPropagation = stopPropagation;
                e.stopImmediatePropagation = stopImmediatePropagation;

                return e;
            };

        })();
    }


    function trigger(dom, key, e) {

        var list = events[key],
            items,
            fn;

        if (list && (items = list[e.type]))
        {
            if (!e || !e.target)
            {
                e = fixed(e || window.event);
            }

            for (var i = 0, _ = items.length; i < _; i++)
            {
                if ((fn = items[i]) && !fn.disabled)
                {
                    if (fn.call(dom, e) === false && e.returnValue !== false)
                    {
                        e.returnValue = false;
                        e.preventDefault();
                    }

                    if (e.cancelBubble)
                    {
                        return;
                    }
                }
            }
        }
    };


    //只执行一次绑定的事件
    flyingon.dom_once = function (dom, type, fn) {

        function callback() {

            fn.apply(this, arguments);
            flyingon.dom_off(dom, type, callback);
        };

        flyingon.dom_on(dom, type, callback);
    };


    //添加dom事件绑定
    flyingon.dom_on = function (dom, type, fn) {

        var key = dom === window ? 0 : dom['flyingon.id'] || (dom['flyingon.id'] = id++),
            list = events[key] || (events[key] = flyingon.create(null)),
            items = list[type],
            handler;

        if (items)
        {
            items.push(fn);
        }
        else
        {
            items = list[type] = [fn];

            dom[on](prefix + type, handler = items.handler = function (e) {

                trigger(handler.dom, key, e);
            });

            handler.dom = dom;

            //防止IE内存泄露
            list = items = dom = null;
        }
    };

    
    //暂停dom事件处理
    flyingon.dom_suspend = function (dom, type) {
        
        var key = dom === window ? 0 : dom['flyingon.id'],
            items;

        if (key >= 0 && (items = events[key]) && (items = items[type]))
        {
            items.unshift(suspend_fn);
        }
    };
    
    
    //继续dom事件处理
    flyingon.dom_resume = function (dom, type) {
        
        var key = dom === window ? 0 : dom['flyingon.id'],
            items;

        if (key >= 0 && (items = events[key]) && (items = items[type]) && items[0] === suspend_fn)
        {
            items.shift();
        }
    };
    
    
    //挂起函数
    function suspend_fn(e) {
      
        e.stopPropagation(); //有些浏览器不会设置cancelBubble
        e.cancelBubble = true;
    };
    

    //移除dom事件绑定
    flyingon.dom_off = function (dom, type, fn) {

        var key = dom === window ? 0 : dom['flyingon.id'],
            list,
            items;

        if (key >= 0 && (list = events[key]) && (items = list[type]))
        {
            if (fn)
            {
                for (var i = items.length - 1; i >= 0; i--)
                {
                    if (items[i] === fn)
                    {
                        items.splice(i, 1);
                    }
                }

                if (items.length > 0)
                {
                    return;
                }
            }
            else
            {
                items.length = 0;
            }

            dom[off](prefix + type, items.handler);

            items.handler = items.handler.dom = null;
            delete list[type];

            for (var name in list)
            {
                return;
            }

            delete events[key];
        }
    };



})(window, document, flyingon);



//dom测试
flyingon.dom_test = (function () {

    var body = document.body,
        dom = document.createElement('div');

    dom.style.cssText = 'position:absolute;overflow:hidden;top:-10000px;top:-10000px;';
    
    return function (fn, context) {

        if (body)
        {
            if (dom.parentNode !== body)
            {
                body.appendChild(dom);
            }
            
            fn.call(context, dom);
        }
        else
        {
            flyingon.ready(function () {

                (body = document.body).appendChild(dom);
                fn.call(context, dom);
            });
        }
    };

})();


//html文档树加载完毕
flyingon.ready = (function () {

    var list, timer;

    function ready() {

        if (list)
        {
            flyingon.dom_off(document, 'DOMContentLoaded', ready);
            flyingon.dom_off(window, 'load', ready);

            for (var i = 0; i < list.length; i++) //执行过程中可能会加入函数，故不能缓存length
            {
                list[i++].call(list[i]);
            }

            list = null;

            if (timer)
            {
                clearTimeout(timer);
            }
        }
    };

    function check() {

        if (document.readyState === 'complete')
        {
            ready();
        }
        else
        {
            if (!list)
            {
                list = [];

                flyingon.dom_on(document, 'DOMContentLoaded', ready);
                flyingon.dom_on(window, 'load', ready);
            }

            timer = setTimeout(check, 0);
        }
    };

    check();

    return function (fn, context) {

        if (typeof fn === 'function')
        {
            if (list)
            {
                list.push(fn, context);
            }
            else
            {
                fn.call(context);
            }
        }
    };

})();



//拖动基础方法
flyingon.dragmove = function (context, event, begin, move, end, delay) {

    var target = event.dom || event.target,
        x1 = event.clientX,
        y1 = event.clientY,
        left,
        top,
        dom;

    function start(e) {
        
        if (begin)
        {
            e.dom = target;
            dom = begin.call(context, e);
        }
        
        var cache = dom || (dom = target),
            style = dom.style;
        
        if (style.position !== 'absolute')
        {
            style.left = cache.offsetLeft + 'px';
            style.top = cache.offsetTop + 'px';
            
            if (!style.width)
            {
                style.width = cache.offsetWidth + 'px';
            }
            
            if (!style.height)
            {
                style.height = cache.offsetHeight + 'px';
            }
            
            style.position = 'absolute';
        }
        
        left = cache.offsetLeft;
        top = cache.offsetTop;

        flyingon.dom_suspend(target, 'click', true);

        if (target.setCapture)
        {
            target.setCapture();
        }
        
        return dom;
    };
    
    function mousemove(e) {

        var x = e.clientX - x1,
            y = e.clientY - y1;

        if (e.dom = dom || (x < -2 || x > 2 || y < -2 || y > 2) && start(e))
        {
            dom.style.left = (left + x) + 'px';
            dom.style.top = (top + y) + 'px';

            if (move)
            {
                e.distanceX = x;
                e.distanceY = y;
                
                move.call(context, e);
            }

            e.stopPropagation();
            e.preventDefault();
        }
    };

    function mouseup(e) {

        flyingon.dom_off(document, 'mousemove', mousemove);
        flyingon.dom_off(document, 'mouseup', mouseup);

        if (e.dom = dom)
        {
            if (target.setCapture)
            {
                target.releaseCapture();
            }

            setTimeout(function () {

                flyingon.dom_resume(target, 'click', true);

            }, 0);
            
            if (end)
            {
                e.distanceX = e.clientX - x1;
                e.distanceY = e.clientY - y1;
                
                if (end.call(context, e) === false)
                {
                    return;
                }
            }

            if ((target !== dom) && (target = dom.parentNode))
            {
                target.removeChild(dom);
            }
        }
    };
    
    if (delay === false)
    {
        start(event);
    }

    flyingon.dom_on(document, 'mousemove', mousemove);
    flyingon.dom_on(document, 'mouseup', mouseup);
    
    event.stopPropagation();
    event.preventDefault();
};




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
        else if (value && (value = ('' + value).match(regex_sides)))
        {
            values = pixel_sides(value);

            if (values.width >= 0 && values.height >= 0)
            {
                values.cache = true;
                return sides_list[value] = values;
            }

            values = value;
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
            width: value, 
            height: value,
            cache: true
        };
    };
    
    
    function pixel_sides(sides, width) {
        
        var target = {};
        
        switch (sides.length)
        {
            case 1:
                target.left = target.top = target.right = target.bottom = pixel(sides[0], width);
                break;

            case 2:
                target.left = target.right = pixel(sides[1], width);
                target.top = target.bottom = pixel(sides[0], width);
                break;

            case 3:
                target.left = target.right = pixel(sides[1], width);
                target.top = pixel(sides[0], width);
                target.bottom = pixel(sides[2], width);
                break;

            default:
                target.left = pixel(sides[3], width);
                target.top = pixel(sides[0], width);
                target.right = pixel(sides[1], width);
                target.bottom = pixel(sides[2], width);
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
    self.locationProperty('alignX', 'center');

    //控件纵向对齐方式
    //top       顶部对齐
    //middle    纵向居中对齐
    //bottom    底部对齐
    self.locationProperty('alignY', 'middle');

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
     
        set: 'this.__style_change("padding", value > 0 ? value + "px" : value);'
    });
    

    //特殊的定位属性值变更方法
    self.__style_change = function (name, value) {
      
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
    self.measure = function (box, available_width, available_height, less_width_to_default, less_height_to_default) {
        
        var width = box.width, 
            height = box.height;

        //处理宽度
        switch (width)
        {
            case 'default': //默认
                width = this.defaultWidth;
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
                height = this.defaultHeight;
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
    };
    
    
    //测量后处理
    self.onmeasure = function (box, width, height) {
        
    };
        
    
    //定位
    self.locate = function (box, x, y, align_width, align_height) {
        
        var value;

        if (align_width > 0 && (value = align_width - box.margin.width - this.offsetWidth))
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

        if (align_height > 0 && (value = align_height - box.margin.height - this.offsetHeight))
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

        this.onlocate(box, this.offsetLeft = x, this.offsetTop = y);
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
    this.defaultWidth = this.defaultHeight = 200;
    
    
    //布局
    self.defineProperty('layout', null, {
     
        storage: 'this.__layout'
    });
    
    
    self.onlocate = function (box, x, y) {
        
        var layout = this.__layout_,
            border = this.__boxModel.border,
            clientRect = this.clientRect(x + border.left, y + border.top),
            items = this.__allot;
        
        layout.init(this, clientRect, items[0], items[1], items[2]);
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
    self.init = function (container, clientRect, items, start, end) {
        
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
            
            arrange(layout || this, container, clientRect, items, start, end);
        }
    };
    
      
    //内部排列方法
    function arrange(layout, container, clientRect, items, start, end) {

        var sublayouts = layout.__sublayouts_,
            subitems,
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

                cache = subitems.each;
                
                for (var i = start; i <= end; i++)
                {
                    items[i].__location_values = cache && cache(i, items[i], container) || subitems;
                }
            }
        }
        
        //排列
        layout.arrange(container, clientRect, items, start, end, layout.vertical());

        //镜像处理
        if ((cache = layout.mirror()) !== 'none')
        {
            arrange_mirror(clientRect, cache, items, start, end);
        }

        //定位后处理
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
            
            layout.__allot = [items, start, start += length];

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
            
            layout.__allot = [items, end - length, end];

            if (start >= (end -= length))
            {
                return;
            }
            
            i2--;
        }
        
        //记录总的余量
        all = end - start;
        
        //最后排列中间的余量
        while (i1 <= i2)
        {
            length = (layout = sublayouts[i1]).length();
            length = length > 0 ? Math.ceil(length * all) : (end - start);
            
            layout.__allot = [items, start, start += length];

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
    
    
    //水平排列布局
    self.arrange = function (container, clientRect, items, start, end, vertical) {

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
    
    //是否需要处理滚动条
    self.scroll = true;
        
        
    //排列布局
    self.arrange = function (container, clientRect, items, start, end, vertical) {

        var width = clientRect.width,
            height = clientRect.height;
        
        if (vertical)
        {
            var y = clientRect.top,
                bottom = y + height,
                spacingY = this.pixel(this.spacingY(), height);
        
            //如果有竖直滚动条则减去滚动条宽度
            if (this.hscroll === 'visible')
            {
                clientRect.width = (width -= this.vscroll_width);
            }
            
            //先按无滚动条的方式排列
            for (var i = start; i <= end; i++)
            {
                var item = items[i],
                    box = item.boxModel(),
                    margin = box.margin;

                item.measure(box, width, height, false, true);
                item.locate(box, margin.left, y += margin.top, width);
                
                y += item.offsetHeight + margin.bottom + spacingY;

                //出现滚动条后重排
                if (y > bottom && this.vscroll === 'auto')
                {
                    this.vscroll = true;
                    return this.arrange(container, clientRect, items, start, end, true);
                }
            }
            
            this.contentWidth = width;
            this.contentHeight = y + clientRect.bottom;
        }
        else
        {
            var x = clientRect.left,
                right = x + width,
                spacingX = this.pixel(this.spacingX(), width);
        
            //如果有水平滚动条则减去滚动条高度
            if (this.hscroll === true)
            {
                clientRect.height -= (height -= this.hscroll_height);
            }
            
            //禁止出现竖直滚动条
            this.vscroll = false;
            
            //先按无滚动条的方式排列
            for (var i = start; i <= end; i++)
            {
                var item = items[i],
                    box = item.boxModel(),
                    margin = box.margin;

                item.measure(box, width, height, true);
                item.locate(box, x += margin.left, margin.top, 0, height);
                
                x += item.offsetWidth + margin.right + spacingX;

                //出现滚动条后重排
                if (x > right && this.hscroll === 'auto') //超行需调整客户区后重排
                {
                    this.hscroll = true;
                    return this.arrange(container, clientRect, items, start, end);
                }
            }
            
            this.contentWidth = x;
            this.contentHeight = height + clientRect.right;
        }
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
    self.arrange = function (container, clientRect, items, start, end, vertical) {

        var pixel = this.pixel,
            x = clientRect.left,
            y = clientRect.top,
            width = clientRect.width,
            height = clientRect.height,
            right = x + width,
            bottom = y + height,
            spacingX = pixel(this.spacingX(), width),
            spacingY = pixel(this.spacingY(), height),
            size = 0,
            auto,
            value;
               
        if (vertical)
        {
            width = size = pixel(this.lineWidth(), width);
            auto = !width
                    
            //如果有水平滚动条则减去滚动条宽度
            if (this.hscroll === true)
            {
                clientRect.height = (height -= this.hscroll_height);
            }
            
            //禁止竖直滚动条
            this.vscroll = false;
            
            //先按无滚动条的方式排列
            for (var i = start; i <= end; i++)
            {
                var item = items[i],
                    box = item.boxModel(),
                    margin = box.margin;

                item.measure(box, width, 0, auto, true);
                
                value = item.offsetHeight + margin.bottom + spacingY;
                
                //换行
                if (y + value > bottom || y > 0 && item.newline())
                {
                    y = clientRect.top;
                    x += size + spacingX;
                    size = width;
                    
                    //出现滚动条后重排
                    if (x > right && this.hscroll === 'auto')
                    {
                        this.hscroll = true;
                        return this.arrange(container, clientRect, items, start, end, true);
                    }
                }
                
                item.locate(box, x + margin.left, y += margin.top, width);
                y += value;
                
                if (!width && size < (value = item.offsetWidth + margin.width))
                {
                    size = value;
                }
            }
        }
        else
        {
            height = size = pixel(this.lineHeight(), height);
            auto = !height;
            
            //禁止水平滚动条
            this.hscroll = false;
            
            //如果有竖直滚动条则减去滚动条宽度
            if (this.vscroll === true)
            {
                clientRect.width = (width -= this.vscroll_width);
            }
            
            //先按无滚动条的方式排列
            for (var i = start; i <= end; i++)
            {
                var item = items[i],
                    box = item.boxModel(),
                    margin = box.margin;

                item.measure(box, 0, height, true, auto);
                
                value = item.offsetWidth + margin.right + spacingX;
                
                //换行
                if (x + value > right || x > 0 && item.newline())
                {
                    x = clientRect.left;
                    y += size + spacingY;
                    size = height;
                    
                    //出现滚动条后重排
                    if (y > bottom && this.vscroll === 'auto')
                    {
                        this.vscroll = true;
                        return this.arrange(container, clientRect, items, start, end);
                    }
                }
                
                item.locate(box, x += margin.left, y + margin.top, 0, height);
                x += value;
                
                if (!height && size < (value = item.offsetHeight + margin.height))
                {
                    size = value;
                }
            }
        }
    };

});



//三栏布局类
$class('Column3Layout', flyingon.Layout, function (self, base) {

    
    self.type = 'column3';
    

    //拆分布局位置(此值仅对3栏布局(column3)有效)
    //before    前面位置
    //after     后面位置
    //center    中间位置
    self.locationProperty('column3', 'before');
    
    
    //排列布局
    self.arrange = function (container, clientRect, items, start, end, vertical) {

        
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
    self.arrange = function (container, clientRect, items, start, end, vertical) {

        
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
    self.arrange = function (container, clientRect, items, start, end, vertical) {

        
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
    self.arrange = function (container, clientRect, items, start, end, vertical) {

        
    };
    
    
});



//单元格布局类
$class('CellLayout', flyingon.Layout, function (self, base) {


    self.type = 'cell';
    
    
    //排列布局
    self.arrange = function (container, clientRect, items, start, end, vertical) {

        
    };
    
    
});






//控件类
$class('Control', [Object, flyingon.IComponent], function (self) {

    

    //控件集合
    var controls = flyingon.controls = flyingon.create(null),
        id = 1;
    
    

    $constructor(function () {

        //根据dom模板创建关联的dom元素
        controls[(this.dom = this.dom_template.cloneNode(true)).flyingon_id = id++] = this;
    });

    
        
    
    //盒模型大小是否包含边框
    self.box_sizing_border = false;
    

    //创建dom模板(必须在创建类时使用此方法创建dom模板)
    self.createDomTemplate = (function () {

        var host = document.createElement('div');

        return function (html) {

            var name = 'flyingon-Control',
                cache = this.xtype,
                dom,
                style;
            
            host.innerHTML = html;
            
            dom = this.dom_template = host.children[0];
            dom.parentNode.removeChild(dom);
            
            style = dom.style;

            if (cache && name !== (cache = cache.replace('.', '-')))
            {
                name += ' ' + cache;
            }

            dom.className = (cache = dom.className) ? cache + ' ' + name : name;

            style.position = 'absolute';
            style.borderWidth = '0';

            //计算盒模型在不同浏览器中的偏差
            //需等document初始化完毕后才可执行
            flyingon.dom_test(function (div) {

                var dom = this.dom_template.cloneNode(false),
                    style = dom.style;

                style.width = '100px';
                style.padding = '1px';

                div.appendChild(dom);

                //盒模型的宽度是否包含边框
                this.box_sizing_border = dom.offsetWidth === 100;
                div.innerHTML = '';

            }, this);

            return dom;
        };

    })();


    //创建默认dom模板
    self.createDomTemplate('<div></div>');




    //父控件
    self.defineProperty('parent', function () {

        return this.__parent || null;
    });



    //id
    self.defineProperty('id', '', {

        set: 'this.dom.id = value;'
    });



    //指定class名 与html一样
    self.defineProperty('className', '', {

        attributes: 'query',
        set: 'value && (this.dom.className += " " + value);'
    });



    //是否包含指定class
    self.hasClass = function (className) {

        return className ? this.dom.className.indexOf(' ' + className) > 0 : false;
    };


    //添加class
    self.addClass = function (className) {

        if (className)
        {
            this.dom.className += ' ' + className;
        }

        return this;
    };


    //移除class
    self.removeClass = function (className) {

        if (className)
        {
            var dom = this.dom;
            dom.className = dom.className.replace(' ' + className, '');
        }

        return this;
    };


    //切换class 有则移除无则添加
    self.toggleClass = function (className) {

        if (className)
        {
            var dom = this.dom,
                name = dom.className;

            if (name.indexOf(className = ' ' + className) > 0)
            {
                dom.className = name.replace(className, '');
            }
            else
            {
                dom.className += className;
            }
        }

        return this;
    };


    //IE7点击滚动条时修改className会造成滚动条无法拖动,需在改变className后设置focus获取焦点解决此问题
    //IE8以下无Object.defineProperty方法
    flyingon.each('disabled,active,hover,focus,checked', function (name) {

        var key = ' flyingon-' + name,
            focus = name === 'active' ? 'dom.focus();\n' : '';

        this['__state_' + name] = new Function('value', 'var dom = this.dom, has = dom.className.indexOf(' + key + ') > 0;\n'
            + 'if (value)\n'
            + '{\n'
                + 'if (!has)\n'
                + '{\n\t'
                + 'dom.className += ' + key + ';\n'
                + focus
                + '}\n'
            + '}\n'
            + 'else if (has)\n'
            + '{\n'
                + 'dom.className = dom.className.replace(' + key + ', "");\n'
                + focus
            + '}');

    }, self);


    
    //扩展可布局对象接口
    flyingon.ILocatable(self, true);
    
    
        
    self.locationProperty('overflowX', '', {
       
        set: 'this.__style_change("overflowX", value);'
    });
    
    
    self.locationProperty('overflowY', '', {
       
        set: 'this.__style_change("overflowY", value);'
    });
    

    self.__style_change = function (name, value) {
      
        this.dom.style[name] = value;
    };
    

    self.onlocate = function (box, x, y) {
      
        var style = this.dom.style,
            width = this.offsetWidth,
            height = this.offsetHeight,
            border,
            padding;
        
        if (!this.box_sizing_border && box)
        {
            width -= (border = box.border).width + (padding = box.padding).width;
            height -= border.height + padding.height;
        }
        
        style.left = x + 'px';
        style.top = y + 'px';
        style.width = width + 'px';
        style.height = height + 'px';
    };
    
    
    //样式默认属性值
    var style_attributes = {

        group: 'appearance',
        query: true
    };
    
    
    //创建样式
    function style(name, style) {

        name = name.replace(/-(\w)/g, function (_, x) {
        
            return x.toUpperCase();
        });
        
        //定义属性
        var attributes = style_attributes;
        
        attributes.set = style || 'this.dom.style.' + name + ' = value;\n';
        self.defineProperty(name, '', attributes);
    };


    
    //控件层叠顺序
    //number	整数值 
    style('z-index', 0);


    //控件上右下左边框样式
    style('border-style', '');


    //控件上右下左边框颜色
    style('border-color', '');


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
    style('visibility', 'this.dom.style.visibility = value === "hidden" ? "hidden" : "visible";');

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
    
    
    
    //从父控件中移除
    self.remove = function () {
    
        var parent = this.__parent;
        
        if (parent)
        {
            parent.remove(this);
        }
    };
    
    
        
    var arrange_controls = [],
        arrange_timeout;
    
    
    //附加控件至指定的dom
    self.attach = function (dom) {

        if (dom)
        {
            if (this.arrange && !this.__arrange_attach)
            {
                this.__arrange_attach = true;
                
                arrange_controls.push(this);
                
                if (!arrange_timeout)
                {
                    arrange_timeout = setTimeout(arrange_delay, 10); //10毫秒后定时刷新
                }
            }
            
            dom.appendChild(this.dom);
        }
    };
    
    
    //移除附加
    self.detach = function () {
        
        if (this.__arrange_attach)
        {
            var dom = this.dom;

            this.__arrange_attach = false;
            
            arrange_controls.remove(this);

            if (dom && dom.parentNode)
            {
                dom.parentNode.removeChild(dom);
            }
        }
    };
    
    
    //更新排列
    self.update = function () {
        
        var target = this.__parent;
        
        this.__arrange_dirty = 2;
        
        while (target && !target.__arrange_dirty)
        {
            target.__arrange_dirty = 1;
            target = target.__parent;
        }
        
        if (!arrange_timeout)
        {
            arrange_timeout = setTimeout(arrange_delay, 10); //10毫秒后定时刷新
        }
    };
    
    
    function arrange_delay() {
        
        var controls = arrange_controls;
        
        for (var i = controls.length - 1; i >= 0; i--)
        {
            var control = controls[i];
            
            switch (control.__arrange_dirty)
            {
                case 2: //自身需要重新排列
                    arrange_attach(control);
                    break;
                    
                case 1: //子控件需要重新排列
                    control.arrange();
                    break;
            }
        }
        
        arrange_timeout = 0;
    };
    
    
    function arrange_attach(control) {
        
        var dom = control.dom.parentNode;
        
        if (dom)
        {
            var width = dom.clientWidth,
                height = dom.clientHeight,
                box = control.boxModel(width, height);
            
            control.measure(box, width, height, true, true);
            control.locate(box, 0, 0, width, height);
            control.arrange();
        }
    };


});




//容器控件接口
flyingon.IContainerControl = function (self) {



    //接口标记
    self['flyingon.IContainerControl'] = true;
    
    
    //dom元素模板
    self.createDomTemplate('<div><div style="position:relative;margin:0;border:0;padding:0;left:0;top:0;overflow:hidden;"></div></div>');

    

    //当前布局
    self.defineProperty('layout', null, {
     
        set: 'this.__layout = value && typeof value === "object";'
    });
    
    

    //子控件集合
    self.defineProperty('children', function () {

        return this.__children || (this.__children = []);
    });

    
    
    self.__style_change = function (name, value) {
      
        if (name !== 'padding')
        {
            this.dom.style[name] = value;
        }
    };


    //添加子控件
    self.append = function (control) {

        if (control && control.__parent !== this)
        {
            this.__dom_dirty = true;
            
            if (this.__arrange_dirty !== 2)
            {
                this.update();
            }
            
            (this.__children || (this.__children = [])).push(control);
            control.__parent = this;
        }
        
        return this;
    };


    //在指定位置插入子控件
    self.insert = function (index, control) {

        if (control && control.__parent !== this)
        {
            var dom = this.dom,
                children = this.__children || (this.__children = []);
            
            if (index < 0)
            {
                index = 0;
            }
            else if (index > children.length)
            {
                index = children.length;
            }
                     
            if (dom.children.length >= index)
            {
                this.dom.insertBefore(control.dom, dom.children[index] || null);
            }
            else
            {
                this.__dom_dirty = true;
            }
            
            if (this.__arrange_dirty !== 2)
            {
                this.update();
            }
            
            children.splice(index, 0, control);
            control.__parent = this;
        }

        return this;
    };
    
    
    //获取或设置当前控件在父控件中的索引号
    self.indexOf = function (index) {
        
        var parent = this.__parent,
            children;
        
        if (index >= 0)
        {
            if (parent && (children = parent.__children) && children[index] !== this)
            {
                var dom = this.dom,
                    dom_parent = dom.parentNode,
                    i = children.indexOf(this);
                
                if (this.__arrange_dirty !== 2)
                {
                    this.update();
                }
                
                children.splice(i, 1);
                children.splice(index, 0, this);
                
                dom_parent.insertBefore(dom, dom_parent.children[index] || null);
            }
            
            return this;
        }

        return parent ? parent.__children.indexOf(this) : -1;
    };


    //移除子控件或从父控件中移除
    self.remove = function (control) {
            
        var parent, children, index;

        if (control)
        {
            if ((children = this.__children) && (index = children.indexOf(control)) >= 0)
            {
                if (this.__arrange_dirty !== 2)
                {
                    this.update();
                }
                
                if (control.dom.parentNode === this.dom)
                {
                    this.dom.removeChild(control.dom);
                }

                children.splice(index, 1);
                control.__parent = null;
            }
        }
        else if (parent = this.__parent)
        {
            parent.remove(this);
        }

        return this;
    };


    //移除指定位置的子控件
    self.removeAt = function (index) {

        var children, control;

        if ((children = this.__children) && (control = children[index]))
        {       
            if (this.__arrange_dirty !== 2)
            {
                this.update();
            }
            
            if (control.dom.parentNode === this.dom)
            {
                this.dom.removeChild(control.dom);
            }
            
            children.splice(index, 1);
            control.__parent = null;
        }

        return this;
    };


    //清除子控件
    self.clear = function () {
      
        var children = this.__children;
        
        if (children)
        {
            var dom_parent = this.dom.children[0];
            
            for (var i = children.length - 1; i >= 0; i--)
            {
                var control = children[i],
                    dom = control.dom;
                
                control.__parent = null;
                
                if (dom.parentNode === dom_parent)
                {
                    dom_parent.removeChild(dom);
                }
            }
            
            children.length = 0;
        }
        
        return this;
    };
    

    //排列子控件
    self.arrange = function () {

        var children = this.__children,
            length;

        switch (this.__arrange_dirty)
        {
            case 2:
                if (children && children.length > 0)
                {
                    arrange(this, children);
                }
                
                this.__arrange_dirty = 0;
                break;

            case 1:
                if (children && (length = children.length) > 0)
                {
                    for (var i = 0; i < length; i++)
                    {
                        var control = children[i];
                        
                        if (control.__arrange_dirty)
                        {
                            control.arrange();
                        }
                    }
                }
                
                this.__arrange_dirty = 0;
                break;
        }
    };
    
    
    function arrange(self, children) {
        
        var layout = this.__layout;
            
        //初始化dom
        if (self.__dom_dirty)
        {
            var cache = document.createDocumentFragment();

            for (var i = 0, _ = children.length; i < _; i++)
            {
                cache.appendChild(children[i].dom);
            }

            self.dom.children[0].appendChild(cache);
            self.__dom_dirty = false;
        }
        
        if (layout)
        {
            if (layout === true)
            {
                layout = self.__layout = flyingon.findLayout(self.layout());
            }
        }
        else
        {
            layout = flyingon.findLayout(self.layout());
        }
        
        if (layout)
        {
            //获取可见子项
            var items = [],
                item;
            
            for (var i = 0, _ = children.length; i < _; i++)
            {
                if ((item = children[i]).visible())
                {
                    items.push(item);
                }
            }
            
            if (layout.scroll)
            {
                layout.hscroll = self.overflowX() || 'auto';
                layout.vscroll = self.overflowY() || 'auto';
            }
            
            layout.init(self, self.clientRect(), items);
            
            //排列后处理
            self.onarrange(layout);
        }
    };


    //测量自动大小
    self.onmeasure = function (box, auto_width, auto_height) {


    };
    
    
    self.onarrange = function (layout) {
      
        var padding = this.__boxModel.padding,
            style = this.dom.children[0].style;
        
        style.width = (layout.contentWidth + padding.right) + 'px';
        style.height = (layout.contentHeight + padding.bottom) + 'px';
    };

        
    self.serialize = function (writer) {
        
        var children;
        
        base.serialize.call(this, writer);
        
        if (children && children.length)
        {
            writer.write_property('children', children);
        }
    };
    
    
    self.deserialize_list.children = function (reader, values) {
      
        this.__children = reader.read_array(values);
    };


    self.dispose = function () {

        var children = this.__children;

        if (children)
        {
            for (var i = children.length - 1; i >= 0; i--)
            {
                children[i].dispose();
            }
        }

        return base.dispose.call(this);
    };


};


    
$class('Panel', flyingon.Control, function (self, base) {


    
    //扩展接口标记
    flyingon.IContainerControl(self);
    
    

});
    

