
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
        var list = [].slice.call(arguments, 1),
            push = list.push;

        return function () {

            var data = list.slice(0);
            
            if (arguments.length > 0)
            {
                push.apply(data, arguments);
            }
            
            return fn.apply(context || this, data);
        };
    }

    return function () {

        return fn.apply(context || this, arguments);
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

