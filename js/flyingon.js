/*
* flyingon javascript library v0.0.1.0
* https://github.com/freeoasoft/flyingon
*
* Copyright 2014, yaozhengyang
* licensed under the LGPL Version 3 licenses
*/



//启用严格模式
'use strict';



//根名字空间
var flyingon = flyingon || { version: '1.0.0' };




//扩展数组indexOf方法
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


//扩展数组lastIndexOf方法
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


//扩展函数bind方法
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



//检测对象是否一个数组
flyingon.isArray = Array.isArray || (function (Array, fn) {

    return function (target) {

        return target instanceof Array || fn.call(target) === '[object Array]';
    };

})(Array, Object.prototype.toString);


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


//以指定原型创建对象
flyingon.create = Object.create || (function () {

    function fn() { };

    return function (prototype) {

        if (prototype)
        {
            fn.prototype = prototype;
            return new fn();
        }

        return {};
    };

})();


//复制源对象成员至目标对象
flyingon.extend = function (target, source, deep) {
    
    target = target || {};
    
    if (source)
    {
        if (deep)
        {
            for (var name in source)
            {
                var value = source[name];
                target[name] = value && typeof value === 'object' ? flyingon.extend(target[name], value) : value;
            }
        }
        else
        {
            for (var name in source)
            {
                target[name] = source[name];
            }
        }
    }
    
    return target;
};


//编码对象
flyingon.encode = function (data) {

    if (!data)
    {
        return '';
    }
    
    var list = [],
        encode = encodeURIComponent,
        value,
        cache;

    for (var name in data)
    {
        value = data[name];
        name = encode(name);
        
        if (value === null)
        {
            list.push(name, '=null', '&');
        }
        
        switch (typeof value)
        {
            case 'undefined':
                list.push(name, '=&');
                break;
                
            case 'boolean':
            case 'number':
                list.push(name, '=', value, '&');
                break;
                
            case 'string':
            case 'function':
                list.push(name, '=', encode(cache), '&');
                break;
                
            default:
                if (value instanceof Array)
                {
                    for (var i = 0, _ = value.length; i < _; i++)
                    {
                        if ((cache = value[i]) === void 0)
                        {
                            list.push(name, '=&');
                        }
                        else
                        {
                            list.push(name, '=', encode(cache), '&');
                        }
                    }
                }
                else
                {
                    list.push(name, '=', flyingon.encode(value), '&');
                }
                break;
        }
    }
            
    list.pop();
    return list.join('');
};


//当不存在window.JSON对象时扩展json解析器
//使用危险代码检测的方法(无危险代码则使用eval解析)实现json解析
flyingon.parseJSON = window.JSON && JSON.parse || (function () {

    var regex1 = /[a-zA-Z_$]/,
        regex2 = /"(?:\\"|[^"])*?"|null|true|false|\d+[Ee][-+]?\d+/g;

    return function (text) {

        if (typeof text === 'string')
        {
            if (regex1.test(text.replace(regex2, '')))
            {
                throw $translate('flyingon', 'json_parse_error');
            }

            return new Function('return ' + text)();
        }

        return text;
    };

})();


//全局动态执行js, 防止局部执行增加作用域而带来变量冲突的问题
flyingon.globalEval = function (text) {
    
    if (window.execScript)
    {
        //ie8不支持call, ie9的this必须是window否则会出错
        window.execScript(text);
    }
    else
    {
        window['eval'](text);
    }
};


//转换url为绝对路径
flyingon.absoluteUrl = (function () {

    var dom = document.createElement('a'),
        base = location.href.replace(/[?#][\s\S]*/, ''),
        regex;

    dom.href = '';
    
    if (!dom.href)
    {
        dom = document.createElement('div');
        regex = /"/g;
    }

    return function (url, path) {

        if (url)
        {
            if (regex)
            {
                dom.innerHTML = '<a href="' + url.replace(regex, '%22') + '"></a>';
                url = dom.firstChild.href;
            }
            else
            {
                dom.href = url;
                url = dom.href;
            }
        }
        else
        {
            url = base;
        }

        return path ? url.substring(0, url.lastIndexOf('/') + 1) : url;
    };

})();



//head兼容处理
document.head || (document.head = document.getElementsByTagName('head')[0]);


//是否ie8, ie9及以下版本
flyingon.ie9 = (flyingon.ie8 = !-[1,]) || document.documentMode === 9;
        


//创建脚本标签
flyingon.script = function (src, callback) {

    var dom = document.createElement('script');

    if (flyingon.ie9)
    {
        dom.onreadystatechange = function () {

            if ('loaded,complete'.indexOf(this.readyState) >= 0)
            {
                callback.call(this, src);
                dom = null;
            }
        };
    }
    else
    {
        dom.onload = function () {

            callback.call(this, src);
            dom = null;
        };
    }

    dom.onerror = function (e) {

        callback.call(this, src, e || true);
        dom = null;
    };

    //dom.async = false;
    dom.src = src;

    document.head.appendChild(dom);

    return dom;
};


//创建link标签
flyingon.link = function (src, type, rel) {

    var dom = document.createElement('link');

    dom.href = src;
    dom.type = type || 'text/css';
    dom.rel = rel || 'stylesheet';
    
    document.head.appendChild(dom);
    
    return dom;
};


//动态添加样式表
flyingon.style = function (cssText) {
  
    var dom = document.createElement('style');  
    
    dom.setAttribute('type', 'text/css');  
  
    if (dom.styleSheet) // IE  
    {
        dom.styleSheet.cssText = cssText;  
    }
    else // w3c  
    {
        dom.appendChild(document.createTextNode(cssText));  
    }
  
    document.getElementsByTagName('head')[0].appendChild(dom);
    return dom;
};




//dom事件扩展
(function (window, flyingon) {

    

    var fixed = window.Event && Event.prototype,
        on = 'addEventListener';


    
    //以下为通用事件扩展(IE8以下浏览器不支持addEventListener)
    //IE的attachEvent中this为window且执行顺序相反
    if (!window[on])
    {
        on = false;
    }
    else if (fixed && !fixed.__stopPropagation) //修复w3c标准事件不支持cancelBubble的问题
    {
        fixed.__preventDefault = fixed.preventDefault;
        fixed.__stopPropagation = fixed.stopPropagation;
        fixed.__stopImmediatePropagation = fixed.stopImmediatePropagation;
        
        fixed.preventDefault = preventDefault;
        fixed.stopPropagation = stopPropagation;
        fixed.stopImmediatePropagation = stopImmediatePropagation;
    }
    


    //只执行一次绑定的事件
    flyingon.dom_once = function (dom, type, fn) {

        function callback() {

            fn.apply(this, arguments);
            flyingon.dom_off(dom, type, callback);
        };

        return flyingon.dom_on(dom, type, callback);
    };


    //添加dom事件绑定
    flyingon.dom_on = function (dom, type, fn) {

        if (dom && type && fn)
        {
            var events = dom.__dom_events,
                items;

            if (events)
            {
                if (items = events[type])
                {
                    items.push(fn);
                    return this;
                }
            }
            else
            {
                events = dom.__dom_events = {};
            }

            events[type] = [fn];

            if (on)
            {
                dom[on](type, trigger);
            }
            else
            {
                dom.attachEvent('on' + type, events.trigger || (events.trigger = trigger_fixed(dom)));
            }
        }

        return this;
    };

    
    //暂停dom事件处理
    flyingon.dom_suspend = function (dom, type) {
        
        var items = dom && dom.__dom_events;

        if (items = items && items[type])
        {
            items.unshift(suspend);
        }
    };
    
    
    //继续dom事件处理
    flyingon.dom_resume = function (dom, type) {
        
        var items = dom && dom.__dom_events;

        if ((items = items && items[type]) && items[0] === suspend)
        {
            items.shift();
        }
        
        return this;
    };
    

    //移除dom事件绑定
    flyingon.dom_off = function (dom, type, fn) {

        var events = dom && dom.__dom_events,
            items;

        if (items = events && events[type])
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

            if (on)
            {
                dom.removeEventListener(type, trigger);
            }
            else
            {
                dom.detachEvent('on' + type, events.trigger);
            }

            delete events[type];

            for (type in events)
            {
                return;
            }

            if (fn = events.trigger)
            {
                events.trigger = fn.dom = null;
            }
            
            dom.__dom_events = void 0;
        }
        
        return this;
    };

    
    
    //触发dom事件
    function trigger(e) {

        var items = this.__dom_events,
            fn;

        if (items = items && items[e.type])
        {
            if (!e.target)
            {
                e.target = e.srcElement;
                e.preventDefault = preventDefault;
                e.stopPropagation = stopPropagation;
                e.stopImmediatePropagation = stopImmediatePropagation;
            }

            for (var i = 0, _ = items.length; i < _; i++)
            {
                if ((fn = items[i]) && !fn.disabled)
                {
                    if (fn.call(this, e) === false && e.returnValue !== false)
                    {
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
    
    
    //修复attachEvent的this指向不正确的问题
    function trigger_fixed(dom) {
        
        function fn(e) {
          
            trigger.call(arguments.callee.dom, e || window.event); 
        };
        
        fn.dom = dom;
        
        //防止IE内存泄露
        dom = null;
        
        return fn;
    };


    function preventDefault() {

        this.returnValue = false;
        this.__preventDefault && this.__preventDefault();
    };

    
    function stopPropagation() {

        this.cancelBubble = true;
        this.__stopPropagation && this.__stopPropagation();
    };

    
    function stopImmediatePropagation() {

        this.cancelBubble = true;
        this.returnValue = false;
        this.__stopImmediatePropagation && this.__stopImmediatePropagation();
    };
        
    
    //挂起函数
    function suspend(e) {
      
        e.stopPropagation(); //有些浏览器不会设置cancelBubble
    };
    


})(window, flyingon);




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




//资源加载
(function (window, flyingon) {



    var base_path = flyingon.absoluteUrl('/'), //网站主路径

        flyingon_path, //flyingon路径, flyingon所在目录或flyingon.js文件所在目录

        require_base, //引入资源起始目录

        require_version = '', //引入资源版本

        version_map = flyingon.create(null), //特殊指定的引入资源版本

        path_map = flyingon.create(null), //相对url对应绝对src映射

        require_sync, //是否使用同步script模式加载资源
        
        require_ajax = flyingon.ie9, //是否ajax加载js, IE6789不支持script异步加载, 因为js的执行与加载完毕事件不是一一对应

        require_keys = { //引入资源变量
            
            layout: 'default', //当前布局
            skin: 'default', //当前皮肤
            i18n: navigator.language || 'zh-CN'    //当前本地化名称
        },
        
        require_merge = flyingon.create(null), //引入资源合并关系

        require_all = flyingon.create(null), //所有资源文件集合(含回溯检测关系) 值为数组或true

        require_load = flyingon.create(null), //已加载(发出请求)的资源集合
        
        require_list = [], //当前要加载的资源集合
        
        to_load = 0, //未加载完毕的资源数量
        
        to_done = 0, //待执行完毕的资源数量
        
        sync_list = [], //同步资源队列
        
        change_files = {}, //待切换资源文件集合

        i18n_map = flyingon.create(null), //本地化信息集合
        
        translate_map = flyingon.create(null); //已翻译资源文件集合        

    
                    
    
    //实始化起始路径
    flyingon_path = require_base = (function () {
        
        var list = document.scripts,
            regex = /flyingon(?:-core)?(?:\.min)?\.js/;
        
        for (var i = list.length - 1; i >= 0; i--)
        {
            var src = flyingon.absoluteUrl(list[i].src), //注：ie7以下的src不会转成绝对路径
                index = src.search(regex);
            
            if (index >= 0)
            {
                return src.substring(0, index).replace(/flyingon\/js\/$/, '');
            }
        }
        
        return flyingon.absoluteUrl('', true);
        
    })();
    
    
    
    //引入js或css资源
    //url可为字符串或字符串数组
    //url规则: /xxx: 相对网站根目录
    //url规则: xxx 相对flyingon.js目录
    //url规则: ./xxx: 相对flyingon.js目录
    //url规则: ../xxx: 相对flyingon.js的上级目录
    //url规则: xxx://xxx 绝对路径
    function $require(url, css, callback) {

        if (url)
        {
            var all = require_all,
                items = typeof url === 'string' ? [url] : url,
                src,
                list,
                value;
            
            if (typeof css === 'function')
            {
                callback = css;
                css = null;
            }
            else if (typeof callback !== 'function')
            {
                callback = null;
            }
            
            //有callback则为按需加载, 否则为依赖加载
            list = callback ? [] : require_list;

            for (var i = 0, _ = items.length; i < _; i++)
            {
                if ((url = items[i]) && (value = all[src = $require.path(url)]) !== true)
                {
                    //样式
                    if (css === true || (css !== false && url.indexOf(css || '.css') >= 0))
                    {
                        if (!value)
                        {
                            //标记css文件已经加载
                            all[src] = true; 
                            
                            //创建link标签加载样式
                            flyingon.link(src);
                        }
                    }
                    else if (!list[src])
                    {
                        //去重处理
                        list[src] = true;
                        
                        //添加进资源列表
                        list.push(src);

                        //设置回溯关系
                        (value || (all[src] = [])).push(list);
                    }
                }
            }

            //按需加载
            if (callback)
            {
                //未执行完成则注册回调
                if (list.length > 0)
                {
                    list.callback = [callback, [flyingon]];
                    load_require(list);
                }
                else //已经加载完成则直接执行回调
                {
                    callback(flyingon);
                }
            }
        }
    };

    
    
    //是否使用同步script模式加载资源
    $require.sync = function (value) {
    
        require_sync = !!value;
    };
    
    
    //是否使用ajax模式加载资源 IE9以下不能设置为不使用ajax加载模式
    $require.ajax = function (value) {

        require_ajax = value || flyingon.ie9;
    };
    

    //指定引入资源起始路径
    $require.base = function (path) {

        if (path === void 0)
        {
            return require_base;
        }

        if (path && typeof path === 'string')
        {
            if (path.charAt(0) === '/')
            {
                require_base = flyingon.absoluteUrl(path);
            }
            else if (path.indexOf(':/') >= 0)
            {
                require_base = path;
            }
            else
            {
                require_base = flyingon.absoluteUrl(flyingon_path + path);
            }
            
            if (path.charAt(path.length - 1) !== '/')
            {
                require_base += '/';
            }
        }
    };


    //指定引入资源版本号
    $require.version = flyingon.include_version = function (version, files) {

        if (typeof version === 'string')
        {
            require_version = version;
        }
        else
        {
            files = version;
        }

        if (files)
        {
            for (var name in files)
            {
                version_map[name] = files[name];
            }
        }
    };


    //指定引入资源合并关系
    $require.merge = flyingon.include_merge = function (values) {

        if (values)
        {
            for (var name in values)
            {
                var value = values[name];

                if (typeof value === 'string')
                {
                    require_merge[value] = name;
                }
                else
                {
                    for (var i = 0, _ = value.length; i < _; i++)
                    {
                        require_merge[value[i]] = name;
                    }
                }
            }
        }
    };
    
        
    //转换相对地址为绝对地址
    $require.path = function (url, change) {

        var src = url = require_merge[url] || url,
            name,
            index,
            cache;

        //如果已经缓存则直接返回
        if (cache = path_map[src])
        {
            return cache;
        }

        //替换当前语言及主题
        if ((index = url.indexOf('{')) >= 0 && 
            (cache = url.indexOf('}')) > index &&
            (name = url.substring(index + 1, cache)) &&
            (cache = require_keys[name]))
        {
            src = url.replace('{' + name + '}', cache);
            
            if (cache = path_map[src])
            {
                return cache;
            }
        }
        else
        {
            change = false;
        }

        //添加版本号
        if (cache = version_map[url] || require_version)
        {
            cache = src + (url.indexOf('?') >= 0 ? '&' : '?') + 'require-version=' + cache;
        }
        else
        {
            cache = src;
        }

        //获取url绝对路径
        // '/xxx': 相对网站根目录
        // './xxx': 相对flyingon.js文件目录
        // 'xxx': 相对flyingon.js文件目录
        // '../xxx': 相对flyingon.js文件上级目录
        if (url.charAt(0) === '/')
        {
            cache = base_path + cache.substring(1);
        }
        else if (url.indexOf(':/') < 0)
        {
            cache = require_base + cache;
        }
        
        //记录多语言及皮肤
        if (change !== false)
        {
            (change_files[name] || (change_files[name] = {}))[cache] = url;
        }

        return path_map[src] = cache;
    };
    
    
    //添加回调函数(有依赖时才会添加成功)
    $require.callback = function (fn, values) {
      
        var list = require_list;
        
        if (list && list.length > 0)
        {
            (list.callback || (list.callback = [])).push(fn, values);
            return true;
        }
    };

       
    //加载引入资源
    function load_require(list) {

        //乱序加载测试
        list.sort(function(a, b) { return Math.random() > 0.5 ? -1 : 1; });

        //调试模式使用同步script方式加载资源
        if (require_sync)
        {
            registry_sync(list.reverse()); //倒序加入队列
        }
        else if (require_ajax) //使用ajax加载资源
        {
            script_ajax(list);
        }
        else //异步加载脚本
        {
            script_async(list);
        }
    };

    
    //使用ajax的方式加载资源
    function script_ajax(list) {
                        
        var load = require_load,
            src;

        for (var i = 0, length = list.length; i < length; i++)
        {
            if (!load[src = list[i]])
            {
                //标记已加载
                load[src] = true;
                
                //标记未加载完毕 
                to_load++;
                
                //标记未执行完毕
                to_done++;
                     
                //不跨域
                if (src.indexOf(base_path) === 0)
                {
                    flyingon.ajax(src, { dataType: 'script' }).always(script_load);
                }
                else //跨域使用script同步加载
                {
                    if (++i < length)
                    {
                        list.splice(0, i);

                        //注册同步加载
                        return registry_sync([src, function () {
                            
                            script_ajax(list);
                        }]);
                    }
                    
                    //最后一个则不需要回调
                    return registry_sync([src]);
                }
            }
        }
    };
    
    
    //注册同步资源队列
    function registry_sync(list) {
      
        var sync = sync_list;
        
        sync.push.apply(sync, list);
                
        //如果消息队列没有启用则立即启动
        if (!sync.load)
        {
            script_sync();
        }
    };
    
    
    //同步加载脚本
    function script_sync() {

        var list = sync_list,
            fn = script_sync;
        
        if (!fn.load && list.length > 0)
        {
            var load = require_load,
                src = list.pop(),
                callback = fn;

            if (typeof src === 'function')
            {
                callback = src;
                src = list.pop();
            }
            
            if (load[src])
            {
                callback();
            }
            else
            {
                //标记正在加载防止重复执行
                fn.load = true;
            
                //标记已加载
                load[src] = true;
                
                //标记未加载完毕 
                to_load++;
                
                //标记未执行完毕
                to_done++;

                //创建加载脚本标签
                flyingon.script(src, function (src) {

                    script_load(src);
                    
                    fn.load = false; //标记加载结束
                    callback();
                });
            }
        }
    };
    
        
    //异步加载脚本
    function script_async(list) {
        
        var load = require_load,
            src;
        
        for (var i = 0, _ = list.length; i < _; i++)
        {
            if (!load[src = list[i]])
            {
                //标记已加载
                load[src] = true;
                
                //标记未加载完毕 
                to_load++;
                
                //标记未执行完毕
                to_done++;
                
                //创建加载脚本标签
                flyingon.script(src, script_load);
            }
        }
    };    

    
    //脚本加载完毕后处理
    function script_load(src) {

        var list = require_list;
        
        //标记已加载完毕
        to_load--;

        //如果资源中包含需引入的资源则继续加载
        if (list && list.length > 0)
        {
            //初始化当前引入对象
            require_list = [];

            //设置回溯父url
            list.src = src;

            //继续加载资源
            load_require(list);
        }
        else
        {
            check_back(require_all, src, true);
        }
        
        //如果已加载完毕且未执行完毕说明有循环引用
        if (!to_load && to_done > 0)
        {
            break_cycle(require_all, src);
        }
    };

    
    //回溯检测引入的资源是否已加载完成
    function check_back(all, src, done) {
      
        var list = all[src],
            items,
            parent,
            cache;
        
        for (var i = list.length - 1; i >= 0; i--)
        {
            //标记已加载完成数量并对比总数, 如果不等说明未加载完全
            if ((items = list[i]).length > (++items.done || (items.done = 1)))
            {
                continue;
            }
            
            //执行回调
            if (cache = items.callback)
            {
                for (var j = 0, _ = cache.length; j < _; j++)
                {
                    cache[j++].apply(window, cache[j]);
                }
            }

            list.splice(i, 1);
            
            if (cache = items.src)
            {
                (parent || (parent = [])).push(cache);
            }
        }
               
        //继续向上回溯检测
        if (parent)
        {
            for (var i = 0, _ = parent.length; i < _; i++)
            {
                check_back(all, parent[i]);
            }
        }
        
        //如果没有依赖则标记已完成
        if (done || !list.length || check_null(list))
        {
            //标记已完全执行
            all[src] = true;

            //标记已执行完毕
            to_done--;
        }
    };
    
    
    //检测依赖是否已加载完成
    function check_null(list) {
      
        for (var i = 0, _ = list.length; i < _; i++)
        {
            if (list[i].length > 0)
            {
                return;
            }
        }
        
        return true;
    };
    
    
    //打破循环引用(最后引用的资源最先执行)
    function break_cycle(all, src) {
        
        var list = [],
            items,
            cache;

        for (src in all)
        {
            if (all[src] !== true)
            {
                list.push(src);
            }
        }

        //倒序检查循环
        for (var i = list.length - 1; i >= 0; i--)
        {
            if (items = check_cycle(all, src = list[i], all[src]))
            {
                //执行回调
                if (cache = items.callback)
                {
                    for (var j = 0, _ = cache.length; j < _; j++)
                    {
                        cache[j++].apply(window, cache[j]);
                    }
                    
                    items.src = items.callback = null;
                }

                check_back(all, src, true);
                
                if (to_done <= 0)
                {
                    break;
                }
            }
        }
    };

    
    //检测循环引用
    function check_cycle(all, src, list) {
      
        var keys, items, name, value;
        
        while (list)
        {
            for (var i = list.length - 1; i >= 0; i--)
            {
                if ((name = list[i].src) && (value = all[name]) !== true)
                {
                    if (name === src)
                    {
                        return list[i];
                    }

                    if (!keys || !keys[name])
                    {
                        (keys || (keys = {}))[name] = true;
                        (items || (items = [])).push.apply(items, value);
                    }
                }
            }
            
            list = items;
            items = null;
        }
    };
    
    
    
    //获取或设置资源变量值
    $require.key = function (name, value, callback, set) {
        
        var keys = require_keys;
        
        if (!value)
        {
            return keys[name];
        }
        
        if (value && keys[name] !== value)
        {
            //设置当前变量
            keys[name] = value;

            set && set();
         
            if (keys = change_files[name])
            {
                change_require(keys, name === 'skin', callback);
            }
        }
    };
    
    
    //切换皮肤或多语言资源
    function change_require(data, css, callback) {
        
        var all = require_all,
            load = require_load,
            list = document.getElementsByTagName(css ? 'link' : 'script'),
            cache;

        //删除原dom节点
        for (var i = list.length - 1; i >= 0; i--)
        {
            if ((cache = list[i]) && data[cache.src || cache.href])
            {
                cache.parentNode.removeChild(cache);
            }
        }

        list = [];
        
        for (var src in data)
        {
            if (all[src] === true)
            {
                //移除缓存
                all[src] = false;
                
                if (!css)
                {
                    load[src] = false; 
                }
                
                //重新加载资源
                list.push(data[src]);
            }
        }
        
        $require(list, css, callback || function () {});
    };


    //获取或设置当前皮肤
    flyingon.skin = function (name) {

        return $require.key('skin', name);
    };
    
    
    //获取指定key的本地化信息
    function $i18ntext(key) {

        return i18n_map[key] || key;
    };


    //获取或设置当前本地化名称
    flyingon.i18n = function (name) {

        return $require.key('i18n', name, null, function () {
        
            //国际化时先清空缓存
            i18n_map = flyingon.create(null);
        });
    };

    
    //定义国际化集合
    function $i18nlist(name, values) {
    
        if (typeof name === 'object')
        {
            values = name;
            name = null;
        }
        
        if (!values)
        {
            return i18n_map;
        }
        
        var target = i18n_map;
        
        if (name)
        {
            name += '.';

            for (var key in values)
            {
                target[name + key] = values[key];
            }
        }
        else
        {
            for (name in values)
            {
                target[name] = values[name];
            }
        }
    };
    
    
    //翻译国际化信息
    function $translate(url, name) {
      
        var value;
        
        if (url && name)
        {
            if ((value = i18n_map[name]) !== void 0)
            {
                return value;
            }
            
            flyingon.ajax($require.path($translate[url] || url, false), { 
                
                dataType: 'script', 
                async: false 
            });
            
            return i18n_map[name] || '';
        }
    };
    
    
    //定义翻译flyingon资源路径
    $translate.flyingon = 'flyingon/i18n/{i18n}/message.js';
    
        
    
    //输出外部接口
    //分开赋值解决chrome调试时类名过长的问题
    window.$require = window.$include = $require;
    window.$i18nlist = $i18nlist;
    window.$i18ntext = $i18ntext;
    window.$translate = $translate;

    

})(window, flyingon);


    

//名字空间,类,属性及事件
(function (window, flyingon) {
    


    var has = {}.hasOwnProperty,

        regex_namespace = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/, //名字空间名称检测

        namespace_stack = [], //名字空间栈
    
        require = window.$require && $require.callback, //注册引入资源回调
        
        regex_interface = /^I[A-Z][A-Za-z0-9]*$/,   //接口名正则表式验证
        
        regex_class = /^[A-Z][A-Za-z0-9]*$/, //类名正则表式验证

        class_list = flyingon.__class_list || (flyingon.__class_list = flyingon.create(null)), //已注册类型集合,需防重复加载

        class_stack = [],  //类栈(支持类的内部定义类)
        
        class_data; //当前类定义信息(支持类的内部定义类)
        
                  
    
    //默认名字空间名
    flyingon.namespaceName = 'flyingon';


    //定义或切换名字空间
    function $namespace(name, callback) {

        var target, items, cache;

        //生成名字空间
        if (typeof name === 'string')
        {
            if (regex_namespace.test(name))
            {
                cache = namespace_stack;
                target = cache.length > 0 ? cache[cache.length - 1] : window;

                items = name.split('.');

                for (var i = 0, _ = items.length; i < _; i++)
                {
                    if (!(cache = target[name = items[i]]))
                    {
                        cache = target[name] = flyingon.create(null);
                    }
                    
                    if (!cache.namespaceName)
                    {
                        cache.namespaceName = target.namespaceName ? target.namespaceName + '.' + name : name;
                    }
                    
                    target = cache;
                }
            }
            else
            {
                throw $translate('flyingon', 'namespace_name_error');
            }
        }
        else
        {
            target = flyingon; //默认名称空间
            callback = name;
        }

        //处理回调
        if (typeof callback === 'function')
        {
            //如果正在动态加载脚本或还有依赖的js没有加载完成则先注册 否则立即执行
            if (!(cache = require) || !cache(load_namespace, [target, callback]))
            {
                load_namespace(target, callback);
            }
        }
    };


    //执行名字空间函数
    function load_namespace(target, callback) {

        var stack = namespace_stack;
        
        try
        {
            //记录当前名字空间
            stack.push($namespace.current = target);
            callback.call(target, target, flyingon);
        }
        finally
        {
            stack.pop();
            $namespace.current = stack[stack.length - 1] || flyingon;
        }
    };

    
    
    //定义接口方法
    function $interface(name, fn, property) {
        
        if (!regex_interface.test(name))
        {
            throw $translate('flyingon', 'interface_name_error');
        }
        
        var prototype = flyingon.create(null),
            namespace = $namespace.current || flyingon,
            xtype = namespace.namespaceName + '.' + name;
        
        prototype[xtype] = true;
        
        if (property)
        {
            prototype.defineProperty = defineProperty;
        }
        
        fn.call(prototype);
        
        fn = function (target) {
          
            if (this instanceof fn)
            {
                throw $translate('flyingon', 'interface_can_not_new');
            }
            
            if (!target)
            {
                throw $translate('flyingon', 'interface_target_error');
            }
            
            extend(target, prototype);
        };
        
        fn.xtype = xtype;
        fn.prototype = prototype;
 
        return namespace[name] = fn;
    };
    
    

    //开放定义构造函数的方法
    function $constructor(fn, replace) {
            
        var data = class_data;
            
        if (data)
        {
            if (typeof fn === 'function')
            {
                if ((fn.replace = replace) || !data[0])
                {
                    data[0] = [fn];
                }
                else
                {
                    data[0].push(fn);
                }
            }
        }
        else
        {
            throw $translate('flyingon', '$constructor_not_in_class');
        }
    };
    

    //开放定义静态成员的方法
    function $static(name, value) {

        var data = class_data;
        
        if (data)
        {
            (data[1] || (data[1] = [])).push(name, value);
        }
        else
        {
            throw $translate('flyingon', '$static_not_in_class');
        }
    };
    


    //定义类方法
    //name:             类名称,省略即创建匿名类型(匿名类型不支持自动反序列化)
    //superclass:       父类, 可传入基类或数组, 当传入数组时第一个子项为父类, 其它为接口, 接口只会复制其原型上的方法
    //fn:               类代码, 函数, 参数(base:父类原型, self:当前类原型)
    //property:         是否支持属性, 默认支持, 可以从非属性类继承生成非属性类, 不能从属性类继承生成非属性类
    function $class(name, superclass, fn, property) {


        var data = class_data = [null, null], 
            Class, 
            base, 
            prototype, 
            namespace,
            list,
            cache;

        
        //处理参数
        if (typeof name !== 'string') //不传name则创建匿名类
        {
            property = fn;
            fn = superclass;
            superclass = name;
            name = null;
        }
        else if (!regex_class.test(name))
        {
            throw $translate('flyingon', 'class_name_error');
        }

        if (typeof fn !== 'function')
        {
            if (typeof superclass === 'function')
            {
                property = fn;
                fn = superclass;
                superclass = null;
            }
            else
            {
                throw $translate('flyingon', 'class_fn_error');
            }
        }

                
        //获取父类原型及创建类原型
        if (superclass && typeof superclass !== 'function')
        {
            list = superclass;
            superclass = superclass[0];
        }
        
        
        //处理父类
        if (superclass)
        {
            if (base = superclass.__constructor_list)
            {
                data[0] = base.slice(0);
            }
        }
        else
        {
            superclass = Object;
        }
        
        
        //创建原型
        prototype = flyingon.create(base = superclass.prototype || Object.prototype);

        //设置base属性
        prototype.base = base;

        
        //判读是否非支持属性
        if ((cache = base.__defaults) || property === true || (property !== false && cache !== false))
        {
            //生成默认值集合
            prototype.__defaults = flyingon.create(cache || null);

            //生成属性集合
            prototype.__properties = flyingon.create(base.__properties || null);
            
            //创建一级类则生成属性事件相关方法
            if (!cache)
            {
                prototype.defineProperty = defineProperty;
                prototype.__onpropertychange = onpropertychange;
                prototype.storage = storage;
                prototype.get = get;
                prototype.set = set;
                prototype.sets = sets;
                prototype.assign = assign;
                prototype.defaultValue = defaultValue;
                prototype.properties = properties;
            }
        }
        else
        {
            prototype.__defaults = false; //标记非属性类
        }
        
            
        //创建一级类则生成默认方法
        if (!cache)
        {
            prototype.on = on;
            prototype.once = once;
            prototype.suspend = suspend;
            prototype.resume = resume;
            prototype.off = off;
            prototype.trigger = trigger;
            prototype.clone = clone;
            prototype.is = is;
            prototype.toString = toString;
            prototype.dispose = dispose;
        }
        
        
        //扩展父类接口
        if (list && list.length > 1)
        {
            class_superclass(prototype, list);
        }
        
    
        //获取当前名字空间
        namespace = $namespace.current || flyingon;

        //xtype
        if (name)
        {
            prototype.xtype = namespace.namespaceName + '.' + name;
        }
        
        
        try
        {        
            //进栈
            (list = class_stack).push(data);
            
            //执行扩展
            fn.call(prototype, base, prototype);
        }
        finally
        {
            //出栈
            list.pop();
            
            //回退类定义数据
            class_data = list[list.length - 1];
        }

                
        //处理类及构造函数
        if (list = data[0])
        {
            Class = list.length > 1 || list[0].superclass ? class_create(list) : list[0];
            Class.__constructor_list = list; 
        }
        else
        {
            Class = function () {};
        }
        
        
        //初始化静态成员
        if (list = data[1])
        {
            class_static(Class, list);            
        }


        //类原型
        Class.prototype = prototype;

        //所属名字空间
        Class.namespace = namespace;

        //父类
        Class.superclass = superclass;

        //父类原型
        Class.base = base;

        //绑定类型
        prototype.Class = prototype.constructor = Class;

        //注册类型(匿名类不注册)
        if (cache = prototype.xtype)
        {
            //类名
            Class.typeName = name;

            //类全名
            Class.xtype = cache;
            
            //标记接口
            prototype[cache] = true;

            //输出及注册类
            namespace[name] = class_list[cache] = Class;
        }


        //初始化类
        if (cache = prototype.__class_init)
        {
            cache.call(prototype, Class, base, prototype);
        }
        

        //返回当前类型
        return Class;
    };

    

    //处理类接口
    function class_superclass(prototype, list) {
        
        var target;
        
        for (var i = 1, _ = list.length; i < _; i++)
        {
            if (target = list[i])
            {
                extend(prototype, target.prototype || target);
            }
        }
    };
                        
           
    //扩展原型
    function extend(prototype, target) {
        
        for (var name in target)
        {
            switch (name)
            {
                case '__defaults': //默认值
                case '__properties': //属性集
                    flyingon.extend(prototype[name] || (prototype[name] = flyingon.create(null)), target[name]);
                    break;

                default:
                    prototype[name] = target[name];
                    break;
            }
        }
    };
    
    
    //处理类静态成员
    function class_static(Class, list) {
        
        for (var i = 0, _ = list.length; i < _; i++)
        {
            Class[list[i++]] = list[i];
        }
    };
    

    //创建类
    function class_create(constructor_list) {

        var length = constructor_list.length,
            fn = constructor_list[length - 1],
            Class;

        if (fn.length)
        {
            Class = (Class = '' + fn).substring(Class.indexOf('(') + 1, Class.indexOf(')'));
            Class = ['Class = function (' + Class + ') {\n'];
            
            if (length > 1)
            {
                Class.push('var items = constructor_list;\n');
                
                for (var i = 0; i < length; i++)
                {
                    Class.push('items[' + i + '].apply(this, arguments);\n')
                }
            }
            else
            {
                Class.push('fn.apply(this, arguments);\n')
            }
            
            Class.push('}');
            eval(Class.join(''));
        }
        else
        {
            switch (length)
            {
                case 1:
                    Class = function () {

                        fn.apply(this, arguments);
                    };
                    break;
                    
                case 2:
                    Class = function () {

                        var list = constructor_list;
                        
                        list[0].apply(this, arguments);
                        list[1].apply(this, arguments);
                    };
                    break;
                    
                default:
                    Class = function () {

                        var list = constructor_list,
                            index = 0,
                            fn;

                        while (fn = list[index++])
                        {
                            fn.apply(this, arguments);
                        }
                    };
                    break;
            }
        }
     
        Class.__constructor_list = constructor_list;
        return Class;
    };

    

    
    //检测当前对象是否指定类型
    function is(type) {

        return type && (this instanceof type || ((type = type.xtype) && this[type]));
    };


    //默认toString方法
    function toString() {

        return '[object ' + this.xtype + ']';
    };
    
    
    //定义属性及set_XXX方法
    function defineProperty(name, defaultValue, attributes) {

        if (name.match(/\W/))
        {
            throw $translate('flyingon', 'property_name_error').replace('{0}', name);
        }

        var cache = attributes;

        //初始化attributes并生成属性元数据
        attributes = { name: name };
     
        //处理默认值
        if (typeof defaultValue === 'function')
        {
            attributes.fn = defaultValue;
        }
        else
        {
            attributes.defaultValue = defaultValue;
        }
        
        //根据默认值生成数据类型
        attributes.dataType = typeof attributes.defaultValue;
        
        if (cache && typeof cache === 'object')
        {
            for (var key in cache)
            {
                attributes[key] = cache[key];
            }
        }
        
        (this.__defaults || (this.__defaults = flyingon.create(null)))[name] = attributes.defaultValue;
        (this.__properties|| (this.__properties = flyingon.create(null)))[name] = attributes;

        //如未直接设置函数则创建按需加载属性以提升初始化性能
        this[name] = attributes.fn || function (value, trigger) {

            var target = property_target(this, name),
                fn = attributes.fn || property_fn(attributes);

            return (target[name] = fn).call(this, value, trigger);
        };
    };
    
    
    //获取属性绑定的目标对象
    function property_target(target, name) {
      
        var Class = target.Class;
        
        while (Class)
        {
            if (has.call(target = Class.prototype, name))
            {
                return target;
            }
            
            Class = Class.superclass;
        }
        
        return target;
    };
    
        
    //动态创建属性函数
    function property_fn(attributes) {
        
        var name = attributes.name,
            dataType = attributes.dataType,
            storage, 
            data,
            cache;
        
        if (storage = attributes.storage)
        {
            data = ['var oldValue = ' + storage + ';\n\n'
                + 'if (value === void 0)\n{\n\t'
                    + 'return oldValue !== void 0 ? oldValue : this.__defaults["' + name + '"];\n'
                + '}\n\n'];
        }
        else
        {
            storage = 'storage["' + name + '"]';

            data = ['var storage = this.__storage || (this.__storage = flyingon.create(this.__defaults)), oldValue = ' + storage + ';\n\n'
                + 'if (value === void 0)\n{\n\t'
                    + 'return oldValue;\n'
                + '}\n\n'];
        }

        //基本类型转换(根据默认值的类型自动转换)
        if (dataType !== 'object')
        {
            cache = 'value = ';

            switch (dataType)
            {
                case 'boolean':
                    data.push('value = !!value;\n\n');
                    break;

                case 'integer':
                    data.push('value = value >>> 0;\n\n');
                    break;

                case 'number':
                    data.push('value = (+value || 0);\n\n');
                    break;

                case 'string':
                    data.push('value = "" + value;\n\n');
                    break;
            }
        }

        //最小值限定(小于指定值则自动转为指定值)
        if ((cache = attributes.minValue) != null)
        {
            data.push('if (value < ' + cache + ') value = ' + cache + ';\n\n');
        }

        //最大值限定(大于指定值则自动转为指定值)
        if ((cache = attributes.maxValue) != null)
        {
            data.push('if (value > ' + cache + ') value = ' + cache + ';\n\n');
        }

        //自定义值检测代码
        if (cache = attributes.check)
        {
            if (typeof cache === 'function')
            {
                cache = '' + cache;
                cache = cache.substring(cache.indexOf('{') + 1, cache.lastIndexOf('}'));
            }
            
            data.push(cache);
            data.push('\n\n');
        }

        //对比新旧值
        data.push('if (oldValue !== value)\n{\n\t');

        //赋值
        data.push(storage + ' = value;\n\n\t');

        //属性变更通知
        data.push('if (trigger !== false && this.__onpropertychange("' + name + '", value, oldValue) === false)\n\t'
            + '{\n\t\t'
                + storage + ' = oldValue;\n\t\t'
                + 'return this;\n\t'
            + '}');

        //自定义值变更结束代码
        if (cache = attributes.set)
        {
            if (typeof cache === 'function')
            {
                cache = '' + cache;
                cache = cache.substring(cache.indexOf('{') + 1, cache.lastIndexOf('}'));
            }
         
            data.push('\n\n\t');
            data.push(cache);
        }

        //闭合
        data.push('\n}\n\n');

        data.push('return this;');
        
        //创建属性函数
        return attributes.fn = new Function('value', 'trigger', data.join(''));
    };
        

    //属性值变更方法
    function onpropertychange(name, value, oldValue) {
    
        var fn, cache;
        
        if ((fn = this.onpropertychange) && fn.call(this, name, value, oldValue) === false)
        {
            return false;
        }
    };
    
    
    //获取当前存储对象
    function storage(name) {
        
        var storage = this.__storage || (this.__storage = flyingon.create(this.__defaults));
        return name ? storage[name] : storage;
    };
    
        
    //获取指定名称的值(数据绑定用)
    function get(name, context) {
        
        var fn = this[name];
        
        if (fn && typeof fn === 'function')
        {
            return fn.call(this);
        }
        
        return this[name];
    };
    
    
    //设置指定名称的值(数据绑定用)
    function set(name, value, context) {
        
        var fn = this[name];
        
        if (fn && typeof fn === 'function')
        {
            fn.call(this, value, false);
        }
        else
        {
            this[name] = value;
        }
        
        return this;
    };
    

    //批量设置属性值
    function sets(values, trigger) {

        var fn;
        
        if (values)
        {
            if (trigger !== true)
            {
                trigger = false;
            }

            for (var name in values)
            {
                if ((fn = this[name]) && typeof fn === 'function')
                {
                    fn.call(this, values[name], trigger);
                }
                else
                {
                    this[name] = values[name];
                }
            }
        }

        return this;
    };
    
    
    //批量赋属性值
    function assign(values, type) {
        
        var storage = this.__storage || (this.__storage = flyingon.create(this.__defaults));
        
        if (values)
        {
            type = type || 'xtype';
            
            for (var name in values)
            {
                if (name !== type)
                {
                    storage[name] = values[name];
                }
            }
        }
        
        return this;
    };


    //获取或设置属性默认值
    function defaultValue(name, value) {

        var defaults = this.__defaults;

        if (value === void 0)
        {
            return defaults[name];
        }

        defaults[name] = value;
        return this;
    };


    //获取属性值集合
    function properties(filter) {

        var target = this.__properties,
            data = [],
            item;

        for (var name in target)
        {
            if ((item = target[name]) && (!filter || filter(item)))
            {
                data.push(item);
            }
        }

        return data;
    };

    
    
    //绑定事件处理 注:type不带on
    function on(type, fn, tag) {

        if (type && typeof fn === 'function')
        {
            var events = this.__events || (this.__events = flyingon.create(null));

            if (tag && tag > 0)
            {
                fn.tag = tag;
            }
            
            (events[type] || (events[type] = [])).push(fn);
        }

        return this;
    };

    
    //只执行一次绑定的事件
    function once(type, fn, tag) {

        var self = this;

        function callback() {

            fn.apply(self, arguments);
            self.off(type, callback);
        };

        return this.on(type, callback, tag);
    };

    
    //暂停事件处理
    function suspend(type) {

        var events = this.__events;

        if (events && (events = events[type]))
        {
            events.unshift(suspend_fn);
        }

        return this;
    };

    
    //继续事件处理
    function resume(type) {

        var events = this.__events;

        if (events && (events = events[type]) && events[0] === suspend_fn)
        {
            events.shift();
        }

        return this;
    };

    
    //挂起方法
    function suspend_fn(e) {

        e.cancelBubble = true;
    };

    
    //移除事件处理
    function off(type, fn) {

        var events = this.__events,
            items;

        if (events)
        {
            if (!fn && type > 0) //注销指定tag的事件
            {
                for (var type in events)
                {
                    items = events[type];

                    for (var i = items.length - 1; i >= 0; i--)
                    {
                        if (items[i].tag === type)
                        {
                            items.splice(i, 1);
                        }
                    }

                    if (!items.length)
                    {
                        items[type] = null;
                    }
                }
            }
            else if (type)
            {
                if (fn)
                {
                    if (items = events[type])
                    {
                        for (var i = items.length - 1; i >= 0; i--)
                        {
                            if (items[i] === fn)
                            {
                                items.splice(i, 1);
                            }
                        }

                        if (!items.length)
                        {
                            events[type] = null;
                        }
                    }
                }
                else if (items = events[type])
                {
                    items.length = 0;
                    events[type] = null;
                }
            }
            else
            {
                for (var type in events)
                {
                    this.off(type);
                }

                this.__events = null;
            }
        }

        return this;
    };

    
    //分发事件
    function trigger(e) {

        var type = e.type || (e = new flyingon.Event(e)).type,
            start = flyingon,
            target = start,
            i = 1,
            length = arguments.length,
            events,
            fn;

        e.target = this;
        
        //初始化自定义参数
        while (i < length)
        {
            e[arguments[i++]] = arguments[i++];
        }

        do
        {
            if ((events = target.__events) && (events = events[type]) && (length = events.length))
            {
                i = 0;
                
                do
                {
                    if ((fn = events[i++]) && !fn.disabled)
                    {
                        if (fn.call(target, e) === false)
                        {
                            e.defaultPrevented = true;
                        }

                        if (e.cancelBubble)
                        {
                            return !e.defaultPrevented;
                        }
                    }
                }
                while (i < length);
            }
            
            if (start !== target)
            {
                target = (fn = target.eventBubble) && target[fn];
            }
            else if (start !== this)
            {
                target = this;
            }
        }
        while (target);

        return !e.defaultPrevented;
    };



    //以当前对象的参照复制生成新对象
    function clone() {

        var target = new this.Class(),
            storage = this.__storage;

        if (storage)
        {
            var values = target.__storage = flyingon.create(this.__defaults);

            for (var name in storage)
            {
                values[name] = storage[name];
            }
        }

        return target;
    };
    

    //销毁对象
    function dispose() {

        if (this.__events)
        {
            this.off();
        }
    };
    
    

    //注册或获取注册的类型
    flyingon.registry_class = function (xtype, Class) {

        if (Class)
        {
            class_list[xtype || Class.xtype] = Class;
        }
        else
        {
            return class_list[xtype];
        }
    };
    
    
    
    //生成全局事件方法
    flyingon.on = on;
    flyingon.off = off;
    flyingon.once = once;
    flyingon.suspend = suspend;
    flyingon.resume = resume;
    flyingon.trigger = trigger;
    
    
    //输出外部接口
    //分开赋值解决chrome调试时类名过长的问题
    window.$namespace = $namespace;
    window.$interface = $interface;
    window.$class = $class;
    window.$constructor = $constructor;
    window.$static = $static;
    


})(window, flyingon);




//事件基类
$class('Event', function () {

    
    $constructor(function (type) {

        this.type = type;
    });
    
    
    //事件类型
    this.type = null;


    //触发事件目标对象
    this.target = null;


    //是否取消冒泡
    this.cancelBubble = false;

    
    //是否阻止默认动作
    this.defaultPrevented = false;


    //阻止事件冒泡
    this.stopPropagation = function (dom_event) {

        this.cancelBubble = true;
        
        if (dom_event && (dom_event = this.dom_event))
        {
            dom_event.stopPropagation();
        }
    };


    //禁止默认事件
    this.preventDefault = function (dom_event) {

        this.defaultPrevented = true;
           
        if (dom_event && (dom_event = this.dom_event))
        {
            dom_event.preventDefault();
        }
    };


    //阻止事件冒泡及禁止默认事件
    this.stopImmediatePropagation = function (dom_event) {

        this.cancelBubble = this.defaultPrevented = true;
                   
        if (dom_event && (dom_event = this.dom_event))
        {
            dom_event.stopImmediatePropagation();
        }
    };

    
}, false);




//异步处理接口
$interface('IAsync', function () {



    //注册成功执行函数或成功执行通知
    this.done = function (fn) {

        return registry(this, fn, 1);
    };


    //注册执行失败函数或执行失败通知
    this.fail = function (fn) {

        return registry(this, fn, 2);
    };


    //注册执行结束函数
    this.always = function (fn) {

        return registry(this, fn, 3);
    };


    //注册执行进度函数
    this.progress = function (fn) {

        return registry(this, fn, 8);
    };


    //注册回调函数
    function registry(self, fn, state) {

        if (typeof fn === 'function')
        {
            var data = self.__data || (self.__data = []);

            //如果已执行则立即调用函数
            if ((state & data.state) === data.state)
            {
                fn.apply(self, data.parameters);
            }
            else
            {
                data.push(state, fn);
            }
        }

        return self;
    };


    //成功执行通知
    this.resolve = function (value) {

        return this.__change_to(1, arguments);
    };


    //失败执行通知
    this.reject = function (error) {

        return this.__change_to(2, arguments);
    };


    //执行进度通知
    this.notify = function (value) {

        return this.__change_to(8, arguments);
    };


    //切换状态
    //1: done
    //2: fail
    //4: error
    //7: always
    //8: progress
    this.__change_to = function (state, parameters) {

        var data = this.__data || (this.__data = []),
            index = 0,
            length = data.length;

        data.state = state;
        data.parameters = parameters;

        while (index < length)
        {
            if ((state & data[index++]) === state)
            {
                data[index++].apply(this, parameters);
            }
        }

        return this;
    };


});

    


//Ajax类
$class('Ajax', [Object, flyingon.IAsync], function () {

    
    
    $constructor(function (url, options) {

        var list = [], //自定义参数列表
            data, 
            cache;
        
        if (options)
        {
            for (var name in options)
            {
                if (name !== 'data')
                {
                    this[name] = options[name];
                }
                else
                {
                    data = options[name];
                }
            }
        }
        
        //执行发送前全局start事件
        if (cache = flyingon.Ajax.start)
        {
            for (var i = 0, _ = cache.length; i < _; i++)
            {
                if (cache[i].call(this, url) === false)
                {
                    return false;
                }
            }
            
            url =  this.url;
        }
        
        if (!(this.url = url))
        {
            return false;
        }
              
        if (data && /get|head|options/i.test(this.method))
        {
            list.push(flyingon.encode(data));
            data = null;
        }
        
        cache = this.dataType === 'jsonp';
        
        if (this.version)
        {
            list.push('ajax-version=', this.version);
        }
                
        if (cache || list.length > 0)
        {
            list.start = url.indexOf('?') >= 0 ? '&' : '?';
        }

        //jsonp
        if (cache)
        {
            if (data)
            {
                jsonp_post(this, url, list, data);
            }
            else
            {
                jsonp_get(this, url, list);
            }
        }
        else
        {
            ajax_send(this, url, list, data);
        }
    });

    
    //请求的url
    this.url = '';
    
    //指定版本号
    this.version = '';

    //method
    this.method = 'GET';

    //text || json || script || xml
    this.dataType = 'text';

    //内容类型
    this.contentType = 'application/x-www-form-urlencoded';

    //自定义http头
    this.header = null;
    
    //是否异步
    this.async = true;
        
    //是否支持跨域资源共享(CORS)
    this.CORS = false;
    
    //超时时间
    this.timeout = 0;
    
    
    //发送ajax请求
    function ajax_send(self, url, list, data) {
    
        var ajax = self.ajax = new XMLHttpRequest(),
            cache;
        
        if (list.start)
        {
            url = url + list.start + list.join('&');
        }
              
        //CORS
        if (self.CORS)
        {
            //withCredentials是XMLHTTPRequest2中独有的
            if ('withCredentials' in ajax)
            {
                ajax.withCredentials = true;
            }
            else if (cache = window.XDomainRequest)
            {
                ajax = new cache();
            }
        }
        
        if ((cache = self.timeout) > 0)
        {
            self.__timer = setTimeout(function () {

                ajax.abort();
                self.fail('timeout');

            }, cache);
        }

        ajax.onreadystatechange = function () {

            ajax_done(self, ajax, url);
        };
        
        ajax.open(self.method, url, self.async);
          
        if (cache = self.header)
        {
            for (var name in cache)
            {
                ajax.setRequestHeader(name, cache[name]);
            }
        }

        ajax.setRequestHeader('Content-Type', self.contentType);

        if (data)
        {
            data = flyingon.encode(data);
            ajax.setRequestHeader('Content-Length', data.length);
        }

        ajax.send(data);
    };
    

    //处理响应结果
    function ajax_done(self, ajax, url) {

        var cache = ajax.readyState;

        if (cache === 4)
        {
            if (cache = self.__timer)
            {
                clearTimeout(cache);
                self.__timer = 0;
                cache = void 0;
            }

            if (ajax.status < 300)
            {
                switch (self.dataType)
                {
                    case 'json':
                        self.resolve(flyingon.parseJSON(ajax.responseText));
                        break;
                        
                    case 'script':
                        flyingon.globalEval(ajax.responseText); //全局执行js避免变量冲突
                        self.resolve(self.url);
                        break;
                        
                    case 'xml':
                        self.resolve(ajax.responseXML);
                        break;
                        
                    default:
                        self.resolve(ajax.responseText);
                        break;
                }
            }
            else
            {
                self.reject(cache = ajax.status);
            }
            
            //结束处理
            ajax_end(self, url, cache);
            
            //清除引用
            self.ajax = self.onreadystatechange = null;
        }
        else
        {
            self.notify(ajax, cache);
        }
    };
    
    
    //ajax执行完毕
    function ajax_end(self, url, error) {
        
        var end = flyingon.Ajax.end;
        
        //执行全局ajax执行结束事件
        if (end)
        {
            for (var i = 0, _ = end.length; i < _; i++)
            {
                end[i].call(self, url, error);
            }
        }
    };
        
    
    //jsonp_get
    function jsonp_get(self, url, list) {
        
        var target = jsonp_get,
            items = target.items || (target.items = []),
            name = items.pop() || 'jsonpCallback' + (++target.id || (target.id = 1));
        
        window[name] = function (data) {
        
            self.resolve(data);
            ajax_end(self, url);
            self = null;
        };
        
        list.push('jsonp=' + name);
        
        if (!self.version)
        {
            list.push('jsonp-version=' + (++target.version || (target.version = 1)));
        }
        
        url = url + list.start + list.join('&');
          
        flyingon.script(url, function (src, error) {
            
            items.push(name);

            if (error)
            {
                self.reject(error);
                ajax_end(self, url, error);
                self = null;
            }

            this.parentNode.removeChild(this);
        });
    };
    
    
    //jsonp_post
    function jsonp_post(self, url, list, data) {
                
        var head = document.head,
            target = jsonp_post,
            items = target.items || (target.items = []),
            iframe = items.pop(),
            form = items.pop(),
            window;
        
        if (!iframe)
        {
            iframe = document.createElement('iframe'),
            form = document.createElement('form');

            iframe.id = ++target.id || (target.id = 1);
            iframe.name = 'jsonp_iframe_' + target.id;
            iframe.src = 'about:blank';

            form.name = 'jsonp_form_' + target.id;
            form.target = iframe.name;
        }
        
        head.appendChild(iframe);
        head.appendChild(form);

        //解决IE6在新窗口打开的BUG
        window = iframe.contentWindow;
        window.name = iframe.name; 

        list.push('jsonp=jsonpCallback' + 1);
        url = url + list.start + list.join('&');
                  
        form.action = url;
        form.method = self.method || 'POST';
        form.enctype = self.enctype || 'application/x-www-form-urlencoded';
        
        for (var name in data)
        {
            var dom = document.createElement('input');

            dom.name = name;
            dom.type = 'hidden';
            dom.value = data[name];

            form.appendChild(dom);
        }
        
        iframe.onload = function (event) {

            var body = window.document.body,
                text = body.textContent || body.innerText || '';
            
            head.removeChild(iframe);
            head.removeChild(form);
            
            items.push(form, iframe);
            
            if (text = text.match(/jsonpCallback1(\([\s\S]+\))/))
            {
                self.resolve(eval(text = text[1]));
            }
            else
            {
                self.fail(text = body.innerHTML);
            }
            
            ajax_end(self, url, text);
            
            body.innerHTML = form.innerHTML = '';
            self = head = iframe = form = window = iframe.onload = null;
        };

        /*
        function fn(event) {

            var body = window.document.body,
                text = body.textContent || body.innerText || '';
            
            if (iframe.attachEvent) //注销事件
            {
                iframe.detachEvent('onload', fn);
            }
            else
            {
                iframe.onload = null;
            }

            head.removeChild(iframe);
            head.removeChild(form);
            
            items.push(form, iframe);
            
            if (text = text.match(/jsonpCallback1(\([\s\S]+\))/))
            {
                self.resolve(eval(text = text[1]));
            }
            else
            {
                self.fail(text = body.innerHTML);
            }
            
            ajax_end(self, url, text);
            
            body.innerHTML = form.innerHTML = '';
            self = head = iframe = form = window = iframe.onload = null;
        };

        //解决IE6不能触发onload事件的bug
        if (iframe.attachEvent) 
        {
            iframe.attachEvent('onload', fn);
        }
        else
        {
            iframe.onload = fn;
        }
        */
        
        form.submit();
    };
        


    //自定义ajax开始提交方法
    flyingon.ajaxStart = function (fn) {

        (flyingon.Ajax.start || (flyingon.Ajax.start = [])).push(fn);
    };


    //自定义ajax执行结束方法
    flyingon.ajaxEnd = function (fn) {

        (flyingon.Ajax.end || (flyingon.Ajax.end = [])).push(fn);
    };


    //ajax提交(默认为GET方式提交)
    flyingon.ajax = function (url, options) {

        return new flyingon.Ajax(url, options);
    };


    //POST提交
    //在IE6时会可能会出错, asp.net服务端可实现IHttpAsyncHandler接口解决些问题 
    flyingon.ajaxPost = function (url, options) {

        options = options || {};
        options.method = 'POST';

        return new flyingon.Ajax(url, options);
    };


    //jsonp get提交
    flyingon.jsonp = function (url, options) {

        options = options || {};
        options.dataType = 'jsonp';

        return new flyingon.Ajax(url, options);
    };


    //jsonp get提交
    flyingon.jsonpPost = function (url, options) {

        options = options || {};
        options.dataType = 'jsonp';
        options.method = 'POST';
        options.data = { a: 1, b: 2, c: 3 };

        return new flyingon.Ajax(url, options);
    };
    
    

}, false);



//console兼容扩展
window.console || (window.console = function () {
    
    
    this.log = function (text) {
        
    };
    
    
    this.warn = function (text) {
        
    };
    
    
    this.error = function (text) {
        
    };
    
    return this;
    
    
}.call({}));




//扩展ES6 Set类
window.Set || (window.Set = $class(function () {
    
    
    $constructor(function () {
    
        this.__items = [];
    });
    
    
    function indexOf(items, item) {
    
        var index = 0,
            length = items.length;
        
        if (item === item) //非NaN
        {
            while (index < length)
            {
                if (items[index++] === item)
                {
                    return --index;
                }
            }
        }
        else //NaN
        {
            while (index < length)
            {
                if ((item = items[index++]) === item)
                {
                    return --index;
                }
            }
        }
        
        return -1;
    };
    
    
    this.size = 0;
    
    
    this.has = function (item) {
        
        return indexOf(this.__items, item) >= 0;
    };
    
    
    this.add = function (item) {
        
        var items = this.__items;
        
        if (indexOf(items, item) < 0)
        {
            items.push(item);
            this.size++;
        }
        
        return this;
    };
    
    
    this['delete'] = function (item) {
        
        var items = this.__items,
            index = indexOf(items, item);
        
        if (index >= 0)
        {
            items.splice(index, 1);
            this.size--;
            
            return true;
        }
        
        return false;
    };
    
    
    this.clear = function () {
        
        this.size = this.__items.length = 0;
    };
    
    
    this.keys = this.values = function () {
      
        return this.__items;
    };
    
    
}));





//dom节点集合
$class('NodeList', Array, function () {
    
        
    this.addClass = function (name) {
      
        name = ' ' + name;
        
        for (var i = 0, _ = this.length; i < _; i++)
        {
            this[i].className += name;
        }
    };
    
    
    this.removeClass = function (name) {
        
        name = ' ' + name;
        
        for (var i = 0, _ = this.length; i < _; i++)
        {
            var dom = this[i];
            dom.className = dom.className.replace(name, '');
        }
    };
    
    
});


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
            !((key = prefix + key.charAt(0).toUpperCase() + key.substring(1)) in style))
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



//拖动基础方法
flyingon.dom_drag = function (context, event, begin, move, end, locked, delay) {

    var dom = event.dom || event.target,
        style = dom.style,
        on = flyingon.dom_on,
        off = flyingon.dom_off,
        x0 = dom.offsetLeft,
        y0 = dom.offsetTop,
        x1 = event.clientX,
        y1 = event.clientY,
        distanceX = 0,
        distanceY = 0;

    function start(e) {
        
        if (begin)
        {
            e.dom = dom;
            begin.call(context, e);
        }
        
        flyingon.dom_suspend(dom, 'click', true);
        flyingon.css_value(document.body, 'user-select', 'none');
        
        if (dom.setCapture)
        {
            dom.setCapture();
        }
        
        start = null;
    };
    
    function mousemove(e) {

        var x = e.clientX - x1,
            y = e.clientY - y1;

        if (!start || (x < -2 || x > 2 || y < -2 || y > 2) && start(e))
        {
            if (move)
            {
                e.dom = dom;
                e.distanceX = x;
                e.distanceY = y;
                
                move.call(context, e);
                
                x = e.distanceX;
                y = e.distanceY;
            }
            
            distanceX = x;
            distanceY = y;
            
            if (locked !== true)
            {
                if (locked !== 'x')
                {
                    style.left = (x0 + x) + 'px';
                }

                if (locked !== 'y')
                {
                    style.top = (y0 + y) + 'px';
                }
            }
            
            e.stopImmediatePropagation();
        }
    };

    function mouseup(e) {

        off(document, 'mousemove', mousemove);
        off(document, 'mouseup', mouseup);

        if (!start)
        {
            flyingon.css_value(document.body, 'user-select', '');
            
            if (dom.setCapture)
            {
                dom.releaseCapture();
            }

            setTimeout(resume, 0);
            
            if (end)
            {
                e.dom = dom;
                e.distanceX = distanceX;
                e.distanceY = distanceY;
                
                end.call(context, e);
            }
        }
    };
    
    function resume() {
      
        flyingon.dom_resume(dom, 'click', true);
    };
    
    if (delay === false)
    {
        start(event);
    }

    on(document, 'mousemove', mousemove);
    on(document, 'mouseup', mouseup);
    
    event.stopImmediatePropagation();
};



//对齐到指定的dom
//target: 要对齐的dom对象
//rect: 停靠范围
//location: 停靠位置 bottom:下面 top:上面 right:右边 left:左边
//align: 对齐 left|center|right|top|middle|bottom
//reverse: 空间不足时是否反转方向
//offset1: 当前方向偏移
//offset2: 相反方向偏移
flyingon.dom_align = function (target, rect, location, align, reverse, offset1, offset2) {

    var width = target.offsetWidth,
        height = target.offsetHeight,
        style = target.style,
        x1 = rect.left,
        y1 = rect.top,
        x2 = rect.right,
        y2 = rect.bottom,
        x,
        y;

    offset1 = +offset1 || 0;

    //检测是否需倒转方向
    if (reverse !== false)
    {
        var client = document.documentElement,
            clientWidth = window.innerWidth || client.offsetHeight || 0,
            clientHeight = window.innerHeight || client.offsetHeight || 0;

        reverse = false;
        offset2 = +offset2 || 0;

        switch (location)
        {
            case 'left':
                if (x1 - offset1 < height && clientWidth - x2 - offset2 >= width)
                {
                    offset1 = offset2;
                    location = 'right';
                    reverse = true;
                }
                break;

            case 'top':
                if (y1 - offset1 < height && clientHeight - y2 - offset2 >= height)
                {
                    offset1 = offset2;
                    location = 'bottom';
                    reverse = true;
                }
                break;

            case 'right':
                if (x1 - offset2 >= width && clientWidth < x2 + offset1 + width)
                {
                    offset1 = offset2;
                    location = 'left';
                    reverse = true;
                }
                break;

            default: 
                if (y1 - offset2 >= height && clientHeight < y2 + offset1 + height)
                {
                    offset1 = offset2;
                    location = 'top';
                    reverse = true;
                }
                break;
        }
    }

    if (location === 'left' || location === 'right')
    {
        x = location === 'left' ? x1 - width - offset1 : x2 + offset1;

        switch (align)
        {
            case 'middle':
                y = y1 - (height - target.offsetHeight >> 1);
                break;

            case 'bottom':
                y = y2 - height;
                break;

            default:
                y = y1;
                break;
        }
    }
    else
    {
        switch (align)
        {
            case 'center':
                x = x1 - (width - target.offsetWidth >> 1);
                break;

            case 'right':
                x = x2 - width;
                break;

            default:
                x = x1;
                break;
        }

        y = location === 'top' ? y1 - height - offset1 : y2 + offset1;
    }
    
    style.left = x + 'px';
    style.top = y + 'px';
    
    return reverse;
};




//序列化接口
$interface('ISerialize', function () {
    
        
    
    //序列化方法
    this.serialize = function (writer) {

        var cache;
        
        if (cache = this.xtype)
        {
            writer.write_property('xtype', cache);
        }
        
        if (cache = this.__storage)
        {
            writer.write_properties(cache);
        }
    };
    
        
    //反序列化方法
    this.deserialize = function (reader, values) {

        var fn;
        
        for (var name in values)
        {
            if (fn = this['deserialize_' + name])
            {
                if (fn !== true)
                {
                    fn.call(this, reader, values[name]);
                }
            }
            else if ((fn = this[name]) && typeof fn === 'function')
            {
                fn.call(this, values[name], false);
            }
            else
            {
                this[name] = values[name];
            }
        }
    };

            
    //设置不序列化xtype属性
    this.deserialize_xtype = true;
    
});



//读序列化类
$class('SerializeReader', function () {


    var class_list = flyingon.__class_list,
        Array = window.Array;
    

    this.deserialize = function (values) {

        if (values)
        {
            if (typeof values === 'string')
            {
                values = flyingon.parseJSON(values);
            }

            if (typeof values === 'object')
            {
                this.all = null;
                values = values instanceof Array ? this.read_array(values) : this.read_object(values);
                
                this.callback = null;
            }
        }

        return values;
    };


    this.read = function (value) {

        if (value && typeof value === 'object')
        {
            return value instanceof Array ? this.read_array(value) : this.read_object(value);
        }

        return value;
    };


    this.read_array = function (values) {

        if (values)
        {
            var array = [];

            for (var i = 0, _ = values.length; i < _; i++)
            {
                array.push(this.read(values[i]));
            }

            return array;
        }

        return null;
    };


    this.read_object = function (values, type) {

        if (values)
        {
            var target, id, cache;

            if (type)
            {
                if ((target = new type()).deserialize)
                {
                    target.deserialize(this, values);
                }
                else
                {
                    this.read_properties(target, values); 
                }
            }
            else if ((id = values.xtype) && (target = class_list[id]))
            {
                (target = new target()).deserialize(this, values);
            }
            else
            {
                this.read_properties(target = {}, values); 
            }
            
            if (id = values.id)
            {
                (this.all || (this.all = {}))[id] = target;
                
                if ((cache = this.callback) && (cache = cache[id]))
                {
                    for (var i = cache.length - 1; i >= 0; i--)
                    {
                        cache[i](target);
                    }
                    
                    this.callback[id] = null;
                }
            }

            return target;
        }

        return null;
    };

    
    this.read_properties = function (target, values) {
      
        for (var name in values)
        {
            target[name] = this.read(values[name]);
        }
    };
    
    
    this.read_reference = function (name, callback) {
      
        var all = this.all,
            cache;
        
        if (all && (cache = all[name]))
        {
            callback(cache)
        }
        else if (cache = this.callback)
        {
            (cache[name] || (cache[name] = [])).push(callback);
        }
        else
        {
            (this.callback = {})[name] = [callback];
        }
    };
      
    
    this.__class_init = function (Class) {
    
        var reader = Class.instance = new Class();

        Class.deserialize = function (values) {

            return reader.deserialize(values);
        };
    };
    

});


//写序列化类
$class('SerializeWriter', function () {


    var Array = window.Array,
        has = {}.hasOwnProperty;

    
    $static('serialize', function (target) {
    
        return new flyingon.SerializeWriter().serialize(target);
    });
    

    this.serialize = function (target) {

        if (target && typeof target === 'object')
        {
            var data = this.data = [];
            
            if (target instanceof Array)
            {
                this.write_array(target);
            }
            else
            {
                this.write_object(target);
            }

            data.pop();
            
            return data.join('');
        }
        
        return '' + target;
    };


    this.write = function (value) {

        if (value != null)
        {
            switch (typeof value)
            {
                case 'boolean':
                    this.data.push(value ? true : false, ',');
                    break;

                case 'number':
                    this.data.push(+value || 0, ',');
                    break;

                case 'string':
                case 'function':
                    this.data.push('"' + ('' + value).replace(/\"/g, '\\"') + '"', ',');
                    break;

                default:
                    if (value instanceof Array)
                    {
                        this.write_array(value);
                    }
                    else
                    {
                        this.write_object(value);
                    }
                    break;
            }
        }
        else
        {
            this.data.push(null, ',');
        }
    };


    this.write_array = function (array) {

        var data = this.data;
        
        if (array != null)
        {
            var length = array.length;

            if (length > 0)
            {
                data.push('[');
                
                for (var i = 0; i < length; i++)
                {
                    this.write(array[i]);
                }
                
                data.pop();
                data.push(']', ',');
            }
            else
            {
                data.push('[]', ',');
            }
        }
        else
        {
            data.push(null, ',');
        }
    };


    this.write_object = function (target) {

        var data = this.data;
        
        if (target != null)
        {
            data.push('{');

            if (target.serialize)
            {
                target.serialize(this);
            }
            else
            {
                this.write_properties(target);
            }

            if (data.pop() === ',')
            {
                data.push('}', ',')
            }
            else
            {
                data.push('{}', ',');
            }
        }
        else
        {
            data.push(null, ',');
        }
    };


    this.write_properties = function (values) {

        if (values)
        {
            var data = this.data;
            
            for (var name in values)
            {
                if (has.call(values, name))
                {
                    data.push('"', name, '":');
                    this.write(values[name]);
                }
            }
        }
    };
    
    
    this.write_property = function (name, value) {
      
        this.data.push('"', name, '":');
        this.write(value);
    };
    
    
    this.write_reference = function (name, target) {
        
        if (name && target)
        {
            var id = target.id;
            
            if (!id || typeof id === 'function' && !(id = target.id()))
            {
                throw $errortext('serialize no id').replace('{0}', target);
            }
            
            this.data.push('"', name, '":');
            this.write(id);
        }
    };

    
        
    this.__class_init = function (Class) {
    
        var writer = Class.instance = new Class();

        Class.deserialize = function (target) {

            return writer.deserialize(target);
        };
    };
    

});




//命名的组件集合
flyingon.components = flyingon.create(null);



//组件接口
$interface('IComponent', function () {
  
    
    
    //定义id属性
    this.defineProperty('id', '', {
        
        set: 'if (oldValue) flyingon.components[oldValue] = null;\n'
            + 'if (value) flyingon.components[value] = this;'
    });
    
    
    //扩展序列化接口
    flyingon.ISerialize(this);
    

    //序列化方法
    this.serialize = function (writer) {

        var cache;
        
        if (cache = this.xtype)
        {
            writer.write_property('xtype', cache);
        }
        
        if (cache = this.__storage)
        {
            writer.write_properties(cache);
        }
    };
    
    
    this.dispose = function () {
      
        var cache = this.__storage;
        
        if (cache && cache.id)
        {
            flyingon.components[cache.id] = null;
        }
        
        if (this.__events)
        {
            this.off();
        }
    };
    

         
}, true);




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
    



//子布局
$class('Sublayout', flyingon.Visual, function (base) {
       
    
    
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
$class('Layout', [Object, flyingon.IComponent], function (base, self) {

    

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
            writer.write_properties(cache);
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



//Dom事件类型
$class('DomEvent', flyingon.Event, function () {
    
    
    $constructor(function (type, dom_event) {
    
        this.type = type;
        this.dom_event = dom_event;
        
    }, true);
    
    
});




//鼠标事件类型
$class('MouseEvent', flyingon.Event, function () {


    $constructor(function (event) {

        //关联的原始dom事件
        this.dom_event = event;

        //事件类型
        this.type = event.type;

        //触事件的dom对象
        this.dom = event.target;

        //是否按下ctrl键
        this.ctrlKey = event.ctrlKey;

        //是否按下shift键
        this.shiftKey = event.shiftKey;

        //是否按下alt键
        this.altKey = event.altKey;

        //是否按下meta键
        this.metaKey = event.metaKey;

        //事件触发时间
        this.timeStamp = event.timeStamp;

        //鼠标按键处理
        //IE678 button: 1->4->2 W3C button: 0->1->2
        //本系统统一使用which 左中右 1->2->3
        if (!(this.which = event.which))
        {
            this.which = event.button & 1 ? 1 : (event.button & 2 ? 3 : 2);
        }
        
        //包含滚动距离的偏移位置
        this.pageX = event.pageX;
        this.pageY = event.pageY;

        //不包含滚动距离的偏移位置
        this.clientX = event.clientX;
        this.clientY = event.clientY;

        //相对屏幕左上角的偏移位置
        this.screenX = event.screenX;
        this.screenY = event.screenY;

    }, true);

    
});




//键盘事件类型
$class('KeyEvent', flyingon.Event, function () {


    $constructor(function (event) {

        //关联的原始dom事件
        this.dom_event = event;

        //事件类型
        this.type = event.type;

        //触事件的dom对象
        this.dom = event.target;

        //是否按下ctrl键
        this.ctrlKey = event.ctrlKey;

        //是否按下shift键
        this.shiftKey = event.shiftKey;

        //是否按下alt键
        this.altKey = event.altKey;

        //是否按下meta键
        this.metaKey = event.metaKey;

        //事件触发时间
        this.timeStamp = event.timeStamp;

        //键码
        this.which = event.which || event.charCode || event.keyCode;

    }, true);

    
});




//class相关操作支持接口
flyingon.__class_extend = function (target, default_class) {
   
    

    //指定class名 与html一样
    target.defineProperty('className', '', {

        query: true,
        set: 'this.dom.className = ' + default_class + ' + (value ? value + " " : "");'
    });



    //是否包含指定class
    target.hasClass = function (name) {

        return name ? this.dom.className.indexOf(name + ' ') >= 0 : false;
    };


    //添加class
    target.addClass = function (name) {

        var dom;
        
        if (name && (dom = this.dom).className.indexOf(name += ' ') < 0)
        {
            dom.className += name;
        }

        return this;
    };


    //移除class
    target.removeClass = function (name) {

        if (name)
        {
            var dom = this.dom;
            dom.className = dom.className.replace(name + ' ', '');
        }

        return this;
    };


    //切换class 有则移除无则添加
    target.toggleClass = function (name) {

        if (name)
        {
            var dom = this.dom,
                className = dom.className;

            if (className.indexOf(name += name + ' ') >= 0)
            {
                dom.className = className.replace(name, '');
            }
            else
            {
                dom.className += name;
            }
        }

        return this;
    };

    
};



//控件类
$class('Control', flyingon.Visual, function (base, self) {

    
    //唯一id生成器
    var uniqueId = 1;
    
    
    
    $constructor(function (dom) {

        if (dom)
        {
            dom.className = this.__default_className + dom.className + ' ';
        }
        else
        {
            dom = this.dom_template.cloneNode(true);
        }

        this.uniqueId = uniqueId++;
        (this.dom = dom).control = this;
    });
    
    
            
    //盒模型大小是否包含边框
    this.boxBorder = false;
    
    
    //向上冒泡对象名
    this.eventBubble = '__parent';
    
    

    //创建dom模板(必须在创建类时使用此方法创建dom模板)
    this.createDomTemplate = (function () {

        var host = document.createElement('div');

        return function (html) {

            var name = 'flyingon-Control',
                cache = this.xtype,
                dom;
            
            host.innerHTML = html;
            
            dom = this.dom_template = host.children[0];
            dom.parentNode.removeChild(dom);

            //计算盒模型在不同浏览器中的偏差
            //需等document初始化完毕后才可执行
            flyingon.dom_test(function (div) {

                var dom = this.dom_template.cloneNode(false),
                    style = dom.style;

                style.width = '100px';
                style.padding = '1px';

                div.appendChild(dom);

                //盒模型的宽度是否包含边框
                this.boxBorder = dom.offsetWidth === 100;
                div.innerHTML = '';

            }, this);

            return dom;
        };

    })();
    
    
    
    //默认className
    this.__default_className = 'flyingon-Control ';


    //控件类初始化处理
    this.__class_init = function (Class, base) {
     
        var dom = this.dom_template || this.createDomTemplate('<div></div>'),
            name = 'flyingon-Control ',
            cache;
        
        if (base && dom === base.dom_template)
        {
            dom = this.dom_template = base.dom_template.cloneNode(true);
            dom.className = dom.className.replace(base.__default_className, '');
        }

        if (this !== self && (cache = Class.xtype))
        {
            name += cache.replace(/\./g, '-') + ' ';
        }
        
        if (cache = dom.className)
        {
            name += cache + ' ';
        }
      
        this.__default_className = dom.className = name;
    };

    

    //父控件
    this.defineProperty('parent', function () {

        return this.__parent || null;
    });
    
    
    //获取或设置当前控件在父控件中的索引号
    this.index = function (index) {
        
        var parent = this.__parent,
            children;
        
        if (parent && (children = parent.__children))
        {
            var old_index = children.indexOf(this);

            if (index !== void 0)
            {
                index = check_index(index | 0, 0, children.length);

                if (old_index !== index)
                {
                    children.splice(old_index, 1);
                    children.splice(index, 0, this);
                    
                    if (parent.__dom_content)
                    {
                        (parent.dom_body || parent.dom).insertBefore(this.dom, children[index].dom || null);
                        
                        if (parent.__arrange_dirty !== 2)
                        {
                            parent.invalidate();
                        }
                    }
                }

                return this;
            }

            return old_index;
        }
        
        return this;
    };
    
    
    function check_index(index) {
      
        if (index < 0)
        {
            if ((index += length) < 0)
            {
                return 0;
            }
        }

        return index >= length ? length - 1 : index;
    };



    
    //扩展class相关操作
    flyingon.__class_extend(this, 'this.__default_className');
    
    

    /*
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
    */

    

    //控件层叠顺序
    //number	整数值 
    flyingon.locateProperty('zIndex', 0, {
     
        set: 'this.dom.style.zIndex = value;'
    });

    
    
    function layout(name, defaultValue, set) {
      
        self.defineProperty(name, '', {

            group: 'layout',
            query: true,
            set: set
        });
    };
        
        
    //边框宽度
    layout('border', '0', 'this.dom.style.borderWidth = value > 0 ? value + "px" : value;');

    
    //内边距
    layout('padding', '0', 'if (!this.__no_padding) this.dom.style.padding = value > 0 ? value + "px" : value;');
    
    
    //水平方向超出内容时显示方式
    layout('overflowX', 'auto', '(this.dom_body || this.dom).style.overflowX = value;');
      
    
    //竖直方向超出内容时显示方式
    layout('overflowY', 'auto', '(this.dom_body || this.dom).style.overflowY = value;');
    
    
    
    //创建样式
    function style(name, set) {

        name = name.replace(/-(\w)/g, function (_, x) {
        
            return x.toUpperCase();
        });
        
        //定义属性
        self.defineProperty(name, '', {

            group: 'appearance',
            query: true,
            set: set || 'this.dom.style.' + name + ' = value;\n'
        });
    };

    
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
    
    
    
    /*

    W3C事件规范:

    A: 鼠标事件 mousedown -> mouseup -> click -> mousedown -> mouseup -> click -> dblclick
    注: IE8以下会忽略第二个mousedown和click事件

    1. mousedown 冒泡 鼠标按下时触发
    2. mousemove 冒泡 鼠标在元素内部移动时重复的触发
    3. mouseup 冒泡 释放鼠标按键时触发
    4. click 冒泡 单击鼠标按键或回车键时触发
    5. dblclick 冒泡 双击鼠标按键时触发
    6. mouseover 冒泡 鼠标移入一个元素(包含子元素)的内部时触发
    7. mouseout 冒泡 鼠标移入另一个元素(包含子元素)内部时触发
    8. mouseenter 不冒泡 鼠标移入一个元素(不包含子元素)内部时触发
    9. mouseleave 不冒泡 鼠标移入另一个元素(不包含子元素)内部时触发


    B: 键盘事件

    1. keydown 冒泡 按下键盘上的任意键时触发 如果按住不放会重复触发
    2. keypress 冒泡 按下键盘上的字符键时触发 如果按住不放会重复触发
    3. keyup 冒泡 释放键盘上的按键时触发


    C: 焦点事件

    1. focus 不冒泡 元素获得焦点时触发
    2. blur 不冒泡 元素失去焦点时触发
    3. focusin 冒泡 元素获得焦点时触发
    4. focusout 冒泡 元素失去焦点时触发

    */

    var body = document.body,
    
        on = flyingon.dom_on,
        
        MouseEvent = flyingon.MouseEvent,
        
        KeyEvent = flyingon.KeyEvent;
    
    
    function event_control(e) {
      
        var target = e.target,
            control;
        
        do
        {
            if (control = target.control)
            {
                return control;
            }
        }
        while (target = target.parentNode);
    };
    
    
    function mouse_event(e) {
        
        var control = event_control(e);
        
        if (control)
        {
            control.trigger(new MouseEvent(e));
        }
    };
    
    
    function key_event(e) {
        
        var control = event_control(e);
        
        if (control)
        {
            control.trigger(new KeyEvent(e));
        }
    };
    
        
    on(body, 'mousedown', mouse_event);
    
    on(body, 'mousemove', mouse_event);
    
    on(body, 'mouseup', mouse_event);
    
    on(body, 'click', mouse_event);
    
    on(body, 'dblclick', mouse_event);
    
    on(body, 'mouseover', mouse_event);
    
    on(body, 'mouseout', mouse_event);
    
    on(body, 'mouseenter', mouse_event);
    
    on(body, 'mouseleave', mouse_event);
    
    
    on(body, 'keydown', key_event);
    
    on(body, 'keypress', key_event);
    
    on(body, 'keyup', key_event);
    
    
    /*
    on(body, 'focus', function (e) {
        
    };
    
    on(body, 'blur', function (e) {
        
    };
    
    on(body, 'focusin', function (e) {
        
    };
    
    on(body, 'focusout', function (e) {
        
    };
    */
    
    
    

    var update_list = [],
        update_delay;
        
    
    //更新
    function update() {
        
        var list = update_list,
            index = 0,
            item;
        
        while (item = list[index++])
        {
            item.update();
            item.__update_delay = false;
        }
        
        list.length = 0;
        
        if (index = update_delay)
        {
            clearTimeout(index);
            update_delay = 0;
        }
    };
    
    
    //延时更新
    function delay_update(control, delay) {
      
        if (control && !control.__update_delay)
        {
            control.__update_delay = true;
            update_list.push(control);
            
            if (delay === false)
            {
                update();
            }
            else if (!update_delay)
            {
                update_delay = setTimeout(update, delay || 30); //30毫秒后定时刷新
            }
        }
    };
    
    
    //使布局无效
    this.invalidate = function () {
        
        var target = this,
            parent;
        
        if (this.__arrange_dirty !== 2)
        {
            this.__arrange_dirty = 2;
            
            while (parent = target.__parent)
            {
                if (target.__arrange_dirty)
                {
                    return this;
                }
                
                parent.__arrange_dirty = 1;
            }

            delay_update(target);
        }

        return this;
    };
    
        
    //重绘(默认与渲染dom相同)
    this.update = function () {
        
        if (this.__parent)
        {
            return this.render();
        }
        
        return this.renderByRoot();
    };
    
                    
    //渲染至dom容器
    this.renderTo = function (dom_host) {
        
        var host = dom_host || document.body,
            dom = this.dom;
        
        dom.style.position = 'relative';

        host.appendChild(dom);

        this.__arrange_dirty = 2;
        delay_update(this, false);
        
        return this;
    };
    
    
    //从dom容器中移除
    this.detach = function () {
     
        var dom = this.dom,
            parent = dom.parentNode;

        if (parent)
        {
            parent.removeChild(dom);
        }
        
        if (parent = this.__parent)
        {
            parent.remove(this);
        }
        
        return this;
    };
    

    //按根节点的方式渲染
    this.renderByRoot = function () {
        
        var dom = this.dom,
            layout = flyingon.Layout.prototype,
            left = flyingon.pixel(this.left()),
            top = flyingon.pixel(this.top()),
            width = this.width(),
            height = this.height(),
            arrange,
            margin;

        dom.style.position = 'relative';
        dom.style.width = width > 0 ? width + 'px' : width;
        dom.style.height = height > 0 ? height + 'px' : height;

        width = dom.offsetWidth,
        height = dom.offsetHeight,

        margin = layout.margin(this, arrange = { 

            width: width, 
            height: height 
        });

        layout.measure(this, arrange, margin, width, height, false);
        layout.locate(this, arrange, margin, left, top, width, height);

        this.render();

        this.__update_dirty = false;   

        if (this.__arrange_dirty)
        {
            this.arrange && this.arrange();
            this.__arrange_dirty = 0;
        }
        
        return this;
    };
    
    
    //渲染dom
    this.render = function () {
      
        var style = this.dom.style,
            width = this.offsetWidth,
            height = this.offsetHeight,
            cache;
        
        if (!this.boxBorder)
        {
            if ((cache = this.border()) && cache !== '0')
            {
                cache = flyingon.pixel_sides(cache);
                
                width -= cache.width;
                height -= cache.height;
            }
            
            if (!this.__no_padding && (cache = this.padding()) && cache !== '0')
            {
                cache = flyingon.pixel_sides(cache);
                
                width -= cache.width;
                height -= cache.height;
            }
        }
        
        if (this.__parent)
        {
            style.position = 'absolute';
        }
        
        style.margin = '0';
        style.left = this.offsetLeft + 'px';
        style.top = this.offsetTop + 'px';
        style.width = width + 'px';
        style.height = style.lineHeight = height + 'px';
        
        return this;
    };
        
    
    
    var dispose = this.dispose;
    
    this.dispose = function () {
    
        this.dom = this.dom.control = this.__parent = null;
        dispose.call(this);
    };
    
    
});



$class('HtmlControl', flyingon.Control, function (base) {
   
        
    this.defineProperty('text', '', {
        
        set: 'this.dom.innerHTML = value;'
    });
    
});

//容器控件接口
$interface('IContainerControl', function () {


    
    //子控件类型
    this.control_type = flyingon.Control;
    

    //添加子控件
    this.append = function (control) {

        if (control && check_control(this, control))
        {
            (this.__children || this.children()).push(control);
            control.__parent = this;
            
            if (this.__dom_scroll)
            {
                if (this.__arrange_dirty !== 2)
                {
                    this.invalidate();
                }
                
                (this.dom_body || this.dom).appendChild(control.dom);
            }
        }
        
        return this;
    };


    //在指定位置插入子控件
    this.insert = function (index, control) {

        if (control && check_control(this, control))
        {
            var children = this.__children || this.children();
            
            index = check_index(index | 0, 0, children.length); 
            
            children.splice(index, 0, control);
            control.__parent = this;

            if (this.__dom_scroll)
            {
                if (this.__arrange_dirty !== 2)
                {
                    this.invalidate();
                }
                
                (this.dom_body || this.dom).insertBefore(control.dom, children[index].dom || null);
            }
        }

        return this;
    };
    
    
    //检测控件索引有效值的函数, 负值表示倒数
    function check_index(index, length) {

        if (index < 0)
        {
            if ((index += length) < 0)
            {
                return 0;
            }
        }

        return index > length ? length : index;
    };
    
    
    function check_control(self, control) {
        
        if (control['flyingon.ITopControl'])
        {
            throw $errortext('flyingon', 'top control');
        }
        
        if (control instanceof self.control_type)
        {
            var parent = control.__parent;

            if (parent && parent !== self)
            {
                parent.remove(control, false);
            }
        
            if (control.__arrange_dirty !== 2)
            {
                control.invalidate();
            }

            return true;
        }

        throw $errortext('flyingon', 'children type').replace('{0}', self.control_type.xtype);
    };
    

    //移除子控件或从父控件中移除
    this.remove = function (control, dispose) {
            
        var children, index;
        
        if (control && (children = this.__children) && (index = children.indexOf(control)) >= 0)
        {
            remove(control, index, dispose);
            children.splice(index, 1);

            if (this.__arrange_dirty !== 2)
            {
                this.invalidate();
            }
        }

        return this;
    };


    //移除指定位置的子控件
    this.removeAt = function (index, dispose) {

        var children, control;

        if ((children = this.__children) && (control = children[index]))
        {       
            remove(control, dispose);
            children.splice(index, 1);

            if (this.__arrange_dirty !== 2)
            {
                this.invalidate();
            }
        }

        return this;
    };


    //清除子控件
    this.clear = function (dispose) {
      
        var children = this.__children,
            length;
        
        if (children && (length = children.length) > 0)
        {
            for (var i = length - 1; i >= 0; i--)
            {
                remove(children[i], dispose);
            }
            
            children.length = 0;
            
            if (this.__arrange_dirty !== 2)
            {
                this.invalidate();
            }
        }
        
        return this;
    };
    
    
    function remove(control, dispose) {
      
        var dom = control.dom,
            parent = dom.parent;
        
        if (parent)
        {
            parent.removeChild(dom);
        }
            
        if (dispose)
        {
            control.dispose();
        }
        else
        {
            if (this.__dom_scroll)
            {
                this.dom.removeChild(control.dom);
            }
            
            control.__parent = null;
        }
    };
    
    

    //控件内容大小的dom
    var scroll_dom = document.createElement('div');
    
    scroll_dom.style.cssText = 'position:absolute;overflow:hidden;margin:0;border:0;padding:0;width:1px;height:1px;visibility:hidden;';
    
        
    
    //设置渲染大小时不包含padding
    this.__no_padding = true;
    
        
    //测量自动大小
    this.measure_auto = function (box, auto_width, auto_height) {
        
        this.arrange();

        if (auto_width)
        {
            this.offsetWidth = this.contentWidth + box.border.width;
        }

        if (auto_height)
        {
            this.offsetHeight = this.contentHeight + box.border.height;
        }
    };
    
        
    //设置默认排列标记
    this.__arrange_dirty = 0;
    
    
    //排列子控件
    this.arrange = function (dirty) {

        var children = this.__children,
            length;

        switch (dirty || this.__arrange_dirty)
        {
            case 2:
                if (children && children.length > 0)
                {
                    arrange(this, children);
                }
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
                break;
        }
        
        this.__arrange_dirty = 0;
    };
    
    
    function arrange(self, children) {
        
        var layout = self.__layout,
            style, 
            hscroll, 
            vscroll,
            right,
            bottom,
            cache;
            
        //初始化dom
        if (!self.__dom_scroll)
        {
            cache = document.createDocumentFragment();
            
            cache.appendChild(self.__dom_scroll = scroll_dom.cloneNode(false));

            for (var i = 0, _ = children.length; i < _; i++)
            {
                cache.appendChild(children[i].dom);
            }

            (self.dom_body || self.dom).appendChild(cache);
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
        

        self.arrange_range(cache = { left: 0, top: 0, width: 0, height: 0 });
        
        right = cache.left + cache.width;
        bottom = cache.top + cache.height;

        switch (self.overflowX())
        {
            case 'scroll':
                if ((cache.height -= flyingon.hscroll_height) < 0)
                {
                    cache.height = 0;
                }
                break;

            case 'auto':
                hscroll = true;
                break;
        }

        switch (self.overflowY())
        {
            case 'scroll':
                if ((cache.width -= flyingon.vscroll_width) < 0)
                {
                    cache.width = 0;
                }
                break;

            case 'auto':
                vscroll = true;
                break;
        }

        //初始化布局
        layout.init(cache, self.padding(), hscroll, vscroll, children);

        //处理滚动条: 注overflow==='auto'在chrome下在未超出原滚动条时不会消失
        if (hscroll || vscroll)
        {
            style = (self.dom_body || self.dom).style;

            if (hscroll)
            {
                style.overflowX = right >= cache.maxWidth ? 'hidden' : 'scroll';
            }

            if (vscroll)
            {
                style.overflowY = bottom >= cache.maxHeight ? 'hidden' : 'scroll';
            }
        }

        //使用positon:relatvie left,top或margin:bottom,right定位时在IE6,7不正常
        //style.margin = height + 'px 0 0 ' + width + 'px';
        style = self.__dom_scroll.style;
        style.left = (cache.maxWidth - 1) + 'px';
        style.top = (cache.maxHeight - 1) + 'px';

        //最后渲染
        for (var i = children.length - 1; i >= 0; i--)
        {
            cache = children[i];
            cache.update();
            cache.__update_dirty = false;
        }

        //排列子项
        self.arrange_children(children);
    };
    
    
    //计算排列空间范围
    this.arrange_range = function (arrange) {
      
        var border = this.border(),
            width = this.offsetWidth,
            height = this.offsetHeight;
        
        if (border && border !== '0')
        {
            border = flyingon.pixel_sides(border);
            width -= border.width;
            height -= border.height;
        }
        
        arrange.width = width;
        arrange.height = height;
    };
    
        
    //排列子项
    this.arrange_children = function (children) {

        for (var i = 0, _ = children.length; i < _; i++)
        {
            var control = children[i];
            
            if (control.arrange)
            {
                control.arrange();
            }
        }
    };
    
           
    var serialize = this.serialize,
        dispose = this.dispose;
        
    
    this.serialize = function (writer) {
        
        var children;
        
        serialize.call(this, writer);
        
        if (children && children.length)
        {
            writer.write_property('children', children);
        }
    };
    
    
    this.deserialize_children = function (reader, values) {
      
        this.__children = reader.read_array(values);
    };


    this.dispose = function () {

        var children = this.__children;

        if (children)
        {
            for (var i = children.length - 1; i >= 0; i--)
            {
                children[i].dispose();
            }
        }

        this.__dom_scroll = null;
        dispose.call(this);
    };


});


$class('Panel', [flyingon.Control, flyingon.IContainerControl], function () {


        
    this.defaultWidth = this.defaultHeight = 400;
        
    
    
    //当前布局
    this.defineProperty('layout', null, {
     
        group: 'locate',
        query: true,
        set: 'this.__layout = value && typeof value === "object";this.invalidate();'
    });
    
    
    //子控件集合
    this.defineProperty('children', function (index) {

        var children = this.__children;
        
        if (index === void 0)
        {
            return children || (this.__children = []);
        }

        return children && children[index];
    });
        
    

});
    


//行集合类
$class('RowCollection', function () {
    

    //记录数
    this.length = 0;


    //获取指定行索引的数据行
    this.at = function (index) {
        
        return this[index] || null;
    };
    
    
    //查找数据行
    this.find = function (filter) {
    
        var list = flyingon.RowCollection(),
            index = 0,
            length = this.length,
            row;
        
        for (var i = 0; i < length; i++)
        {
            if ((row = this[i]) && (!filter || filter(row)))
            {
                list[index++] = row;
            }
        }
        
        list.length = index;
        return list;
    };
    
        
    //查找所有下级行
    this.findAll = function (filter) {

        var list = arguments[1] || flyingon.RowCollection(),
            row;
        
        for (var i = 0, _ = this.length; i < _; i++)
        {
            if ((row = this[i]) && (!filter || filter(row)))
            {
                list[list.length++] = row;
            }
            
            if (row.length > 0)
            {
                row.findAll(filter, list);
            }
        }
        
        return list;
    };
    
            
    this.toJSON = function (changed, names) {
        
        var writer = ['['],
            row,
            data,
            tag,
            cache;
        
        if (changed && names)
        {
            if (typeof names === 'string')
            {
                names = names.match(/\w+/g);
            }
            
            names = names && names.length > 0 ? new RegExp('^(' + names.join('|') + ')$', 'i') : null;
        }
        
        for (var i = 0, _ = this.length; i < _; i++)
        {
            if ((row = this[i]) && (data = row.data))
            {
                if (tag)
                {
                    writer.push(',');
                }
                else
                {
                    tag = true;
                }
                
                if (changed && (cache = row.originalData))
                {
                    write_change(writer, data, cache, names, this.tables);
                }
                else
                {
                    write_object(writer, data);
                }
            }
        }
        
        writer.push(']');
        
        return writer.join('');
    };
    
    
    function write_object(writer, data) {
        
        var tag;
        
        writer.push('{');
        
        for (var name in data)
        {
            if (tag)
            {
                writer.push(',');
            }
            else
            {
                tag = true;
            }
            
            writer.push('"', name, '":');
            write_value(writer, data[name]);
        }
        
        writer.push('}');
    };
    
    
    function write_array(writer, data) {
        
        writer.push('[');
        
        for (var i = 0, _ = data.length; i < _; i++)
        {
            if (i > 0)
            {
                writer.push(',');
            }

            write_value(writer, data[i]);
        }
        
        writer.push(']');
    };
    
    
    function write_value(writer, value) {
    
        if (value == null)
        {
            writer.push('null');
            return;
        }

        switch (typeof value)
        {
            case 'string':
                writer.push('"', value.replace(/"/g, '\\"'), '"');
                break;

            case 'object':
                if (value instanceof Array)
                {
                    write_array(writer, value);
                }
                else
                {
                    write_object(writer, value);
                }
                break;

            default:
                writer.push(value);
                break;
        }
    };
    
    
    function write_change(writer, data, originalData, names, tables) {
        
        var value, oldValue;
        
        writer.push('{');
        
        for (var name in data)
        {
            value = data[name];
            oldValue = originalData[name];
            
            if (value !== oldValue || names && names.test(name))
            {
                if (value == null)
                {
                    writer.push('"', name, '":null', ',');
                    continue;
                }
                
                switch (typeof value)
                {
                    case 'string':
                        writer.push('"', name, '":"', value.replace(/"/g, '\\"'), '"', ',');
                        break;

                    case 'object':
                        if (tables && (oldValue = tables[name]))
                        {
                            oldValue = oldValue.toJSON(true);
                            
                            if (oldValue.length > 2)
                            {
                                writer.push('"', name, '":', oldValue, ',');
                            }
                        }
                        else 
                        {
                            writer.push('"', name, '":');
                            
                            if (value instanceof Array)
                            {
                                write_array(writer, value);
                            }
                            else
                            {
                                write_object(writer, value);
                            }
                            
                            writer.push(',');
                        }
                        break;

                    default:
                        writer.push('"', name, '":', value, ',');
                        break;
                }
            }
        }
        
        writer.push(writer.pop() === ',' ? '}' : '{}');
    };
    
    
}, false);



//数据集合接口
$interface('IDataList', function () {
    
    
    
    //删除或增加数据方法
    var splice = [].splice;
    
    
    
    //复制行集合类
    flyingon.extend(this, flyingon.RowCollection.prototype);
    
    
    //加载数据
    this.load = function (list, primaryKey) {
        
        var dataset = this.dataset;
        
        (dataset || this).__load_data(dataset ? this : null, list, primaryKey);        
        return this;
    };
    
    
    //加载树型数据
    this.loadTreeList = function (list, primaryKey, childrenName) {
        
        var dataset = this.dataset;
        
        (dataset || this).__load_data(dataset ? this : null, list, primaryKey, childrenName || 'children');        
        return this;
    };
    
        
    //添加数据行
    this.append = function (row) {
        
        return this.insert(-1, row);
    };
    
    
    //插入数据行
    this.insert = function (index, row) {
        
        if (row && row['flyingon.DataRow'])
        {
            var dataset = this.dataset,
                parent;
                
            if (dataset)
            {
                parent = this;
            }
            else
            {
                dataset = this;
            }
            
            if ((index |= 0) < 0 || index > this.length)
            {
                index = this.length;
            }
            
            if (dataset.trigger('row-adding', 'parent', parent, 'row', row, 'index', index) !== false)
            {
                splice.call(this, index, 0, row);
                
                row.dataset = dataset;
                row.state = 'added';
                
                if (parent)
                {
                    row.parent = parent;
                }
                
                dataset.__changed_rows.push(row);
                dataset.trigger('row-added', 'parent', parent, 'row', row, 'index', index);
            }
        }
        
        return this;
    };
    
    
    //移除指定索引的数据行
    this.removeAt = function (index) {
        
        var row = this[index],
            dataset = this.dataset,
            parent;
                
        if (dataset)
        {
            parent = this;
        }
        else
        {
            dataset = this;
        }
        
        if (row && dataset.trigger('row-removing', 'parent', parent, 'row', row) !== false)
        {
            splice.call(this, index, 1);
            dataset.trigger('row-removed', 'parent', parent, 'row', row);
            
            if (row.state !== 'unchanged')
            {
                row.rejectChange();
            }
            
            row.dataset = row.parent = null;
            
            if (row.uniqueId === dataset.__current_id && (row = this[index] || this[--index]))
            {
                dataset.currentRow(row);
            }
        }
        
        return this;
    };
    
    
    //清除数据行
    this.clear = function () {
        
        var dataset = this.dataset,
            length = this.length,
            row;
        
        if (length > 0)
        {
            for (var i = 0; i < length; i++)
            {
                if (row = this[i])
                {
                    if (row.state !== 'unchanged')
                    {
                        row.rejectChange();
                    }
                    
                    row.dataset = row.parent = null;
                }
            }
            
            splice.call(this, 0, length);
            
            (dataset || this).trigger('clear', 'parent', dataset ? this : null);
        }
        
        return this;
    };
    
    
    //删除指定属性
    this.removeProperty = function (name) {
     
        if (name)
        {
            var row, data;
        
            for (var i = this.length - 1; i >= 0; i--)
            {
                if ((row = this[i]) && (data = row.data))
                {
                    delete data[name];
                    
                    if (data = row.originalData)
                    {
                        delete data[name];
                    }
                    
                    if (row.length > 0)
                    {
                        row.removeProperty(name);
                    }
                }
            }
        }
        
        return this;
    };
    
    
});



//数据行基类
$class('DataRow', [Object, flyingon.IDataList], function () {
    
    
    
    //删除或增加数据方法
    var splice = [].splice;
    
    

    //所属数据集
    this.dataset = null;
    
    //父级行
    this.parent = null;
    
    
    //id
    this.id = null;

    //唯一id
    this.uniqueId = 0;
    
    
    //当前数据
    this.data = null;
    
    
    //原始数据
    this.originalData = null;
    
        
    //数据行状态
    //unchanged     未变更状态
    //added         新增状态
    //changed       已修改状态
    this.state = 'unchanged';
                
    
    
    //获取数据行在数据集中的顺序
    this.index = function (index) {
        
        var dataset = this.dataset,
            list = this.parent || dataset;

        if (list)
        {
            var oldValue = -1,
                i = 0,
                length = list.length;
            
            while (i < length)
            {
                if (list[i] === this)
                {
                    oldValue = i;
                    break;
                }
                
                i++;
            }
            
            if (index === void 0)
            {
                return oldValue;
            }
            
            if ((index |= 0) < 0 || index >= length)
            {
                index = length - 1;
            }
            
            if (index !== oldValue)
            {
                splice.call(list, oldValue, 1);
                splice.call(list, index, 0, this);
                
                (dataset || this).trigger('index-changed', 
                    'row', this, 
                    'value', index, 
                    'oldValue', oldValue);
            }
        }
        
        return this;
    };
    
        
    //获取指定列的值
    this.get = function (name) {
        
        var data;
        
        if (data = name && this.data)
        {
            return data[name];                
        }
    };
    

    //获取指定列的原始值
    this.originalValue = function (name) {

        var data;
        
        if (name && (data = this.originalData || this.data))
        {
            return data[name];
        }
    };
    

    //设置指定列的值
    this.set = function (name, value, trigger, caller) {
        
        var data;
        
        if (name && value !== void 0 && (data = this.data))
        {
            var dataset, oldValue, names, key, cache;
            
            //不允许设置值为undefined
            if (value === (oldValue = data[name]))
            {
                return caller ? void 0 : this;
            }
            
            dataset = this.dataset || this;
            
            if (trigger === false || dataset.trigger('value-changing', 
                'row', this, 
                'name', name, 
                'value', value, 
                'oldValue', oldValue) !== false)
            {
                if (this.state === 'unchanged')
                {
                    cache = {};
                
                    for (key in data)
                    {
                        cache[key] = data[key];
                    }
                    
                    this.originalData = data;
                    this.data = data = cache;
                    this.state = 'changed';
                    
                    dataset.__changed_rows.push(this);
                }
                
                data[name] = value;

                //同步数据至绑定目标
                if (dataset.bindings)
                {
                    dataset.sync(this, name, value, caller);             
                }
                
                if (trigger !== false)
                {
                    dataset.trigger('value-changed', 
                        'row', this, 
                        'name', name, 
                        'value', value, 
                        'oldValue', oldValue);
                }
            }
        }
        
        return caller ? void 0 : this;
    };
    
    
    //回滚指定值
    this.rollback = function (name) {
        
        var data = name && this.originalData;
        
        if (data)
        {
            this.data[name] = data[name];
        }
    };
    
    
    
    //从所属行集中移除当前行
    this.remove = function () {
        
        var parent = this.parent || this.dataset;
        
        if (parent)
        {
            parent.removeAt(this.index());
        }
        
        return this;
    };
    
    
    
    //接收修改
    this.acceptChange = function () {
        
        var dataset = this.dataset;
        
        if (dataset && this.state !== 'unchanged')
        {
            var rows = dataset.__changed_rows;

            for (var i = rows.length - 1; i >= 0; i--)
            {
                if (rows[i] === this)
                {
                    this.originalData = null;
                    this.state = 'unchanged';
                    
                    rows.splice(i, 1);
                    return this;
                }
            }
        }
        
        return this;
    };
    
    
    //拒绝修改
    this.rejectChange = function () {

        var dataset = this.dataset;
        
        if (dataset && this.state !== 'unchanged')
        {
            var rows = dataset.__changed_rows,
                data;

            for (var i = rows.length - 1; i >= 0; i--)
            {
                if (rows[i] === this)
                {
                    if (data = this.originalData)
                    {
                        this.data = data;
                        this.originalData = null;
                        this.state = 'unchanged';
                    }
                    else
                    {
                        splice.call(this.parent || dataset, this.index(), 1);
                    }
                    
                    rows.splice(i, 1);
                    return this;
                }
            }
        }
        
        return this;
    };
    
        
    //获取树级别
    this.level = function () {
     
        var level = 0,
            parent = this;
        
        while (parent = parent.parent)
        {
            level++;
        }
        
        return level;
    };
    
    
    //统计所有子节点的数量
    this.count = function () {
        
        var length = this.length,
            count = length;
        
        if (length > 0)
        {
            for (var i = 0; i < length; i++)
            {
                var row = this[i];
                
                if (row.length > 0)
                {
                    count += row.count();
                }
            }
        }
        
        return count;
    };
    
    
        
}, false);



//数据集
$class('DataSet', [Object, flyingon.IComponent, flyingon.IDataList], function () {
    
    
    
    $constructor(function () {
       
        //id生成器
        this.__new_id = 1;
        
        //uniqueId集合
        this.__keys1 = flyingon.create(null);
        
        //id集合
        this.__keys2 = flyingon.create(null);
        
        //变更的数据行集合
        this.__changed_rows = [];
    });
    
    
    
    //数据行类
    this.rowType = flyingon.DataRow;
    
    
        
    //数据映射关系
    this.defineProperty('mapping', null, {
        
        set: 'this.__mapping = value && this.__init_mapping(value);'
    });
    
    
    this.__init_mapping = function (mapping) {
      
        var list = ['var target = {};'];
        
        if (mapping instanceof Array)
        {
            for (var i = 0, _ = mapping.length; i < _; i++)
            {
                list.push('target["' + mapping[i] + '"] = source[' + i + '];');
            }
        }
        else
        {
            for (var name in mapping)
            {
                list.push('target["' + mapping[name] + '"] = source["' + name + '"];');
            }
        }
        
        if (list.length > 1)
        {
            return new Function('source', list.join('\n'));
        }
    };
    
    
        
    //从二维关系表加载树型数据
    this.loadTreeFromList = function (list, primaryKey, parentKey) {
        
        return this.__load_data(null, list, primaryKey || 'id', parentKey || 'parentId');
    };
    
    
    //加载数据内部方法
    this.__load_data = function (parent, list, primaryKey, parentKey, childrenName) {

        if (list && list.length > 0)
        {
            this.__new_id = load_data(this, 
                parent, 
                list, 
                primaryKey, 
                parentKey, 
                childrenName, 
                this.__new_id++);
            
            this.trigger('load', 'parent', parent);
        }
        
        return this;
    };
    
    
    function load_data(dataset, parent, list, primaryKey, parentKey, childrenName, uniqueId) {
      
        var target = parent || dataset,
            rowType = target.rowType || dataset.rowType,
            mapping = dataset.__mapping,
            keys1 = dataset.__keys1,
            keys2 = dataset.__keys2,
            index = target.length,
            length = list.length,
            data,
            row,
            id;
            
        for (var i = 0; i < length; i++)
        {
            if (data = list[i])
            {
                if (mapping)
                {
                    data = mapping(data);
                }
            }
            else
            {
                continue;
            }

            row = new rowType();
            
            row.dataset = dataset;
            
            if (parent)
            {
                row.parent = parent;
            }
            
            row.data = data || {};
            
            keys1[row.uniqueId = uniqueId++] = row;
            
            if (primaryKey)
            {
                keys2[row.id = data[primaryKey]] = row;
            }
                        
            if (!parentKey)
            {
                target[index++] = row;
                
                if (childrenName && (data = data[childrenName]) && data.length > 0)
                {
                    uniqueId = load_data(dataset, row, data, primaryKey, null, childrenName, uniqueId)
                }
            }
        }

        if (parentKey)
        {
            for (var i = 0; i < length; i++)
            {
                data = list[i];
                row = keys2[data[primaryKey]];
                
                if (parent = keys2[data[parentKey]])
                {
                    row.parent = parent;
                    parent[parent.length++] = row;
                }
                else
                {
                    dataset[index++] = row;
                }
            }
        }

        target.length = index;
        
        return uniqueId;
    };
    

    //创建新数据行
    this.createRow = function (data, primaryKey) {
        
        var row = new this.rowType();
        
        row.dataset = this;
        row.data = data = data || {};
        
        this.__keys1[row.uniqueId = this.__new_id++] = row;
        
        if (primaryKey)
        {
            this.__keys2[row.id = data[primaryKey]] = row;
        }
        
        this.trigger('row-create', 'row', row);
        
        return row;
    };
    
    
    //获取或设置当前行
    this.currentRow = function (row) {
        
        var keys = this.__keys1,
            oldRow = this.__current_id,
            id;
        
        if (row === void 0)
        {
            return keys[oldRow] || null;
        }
        
        if (oldRow !== (id = row && row.uniqueId || row))
        {
            row = id && keys[id];
            oldRow = oldRow && keys[oldRow];
            
            if (this.trigger('current-changing', 'row', row, 'oldRow', oldRow) !== false)
            {
                this.__current_id = id;
                this.trigger('current-changed', 'row', row, 'oldRow', oldRow);
            }
        }
        
        return this;
    };
    
    
    
    //通过id查找数据行
    this.id = function (id) {
        
        return this.__keys2(id) || null;
    };
    
    
    //通过唯一id查找数据行
    this.uniqueId = function (id) {
        
        return this.__keys1[id] || null;
    };
    
        
    //获取变更的数据行
    this.getChanges = function (state) {
    
        var list = new flyingon.RowCollection(),
            rows = this.__changed_rows,
            length = rows.length;
        
        if (length > 0)
        {
            if (state && typeof state === 'string')
            {
                var index = 0,
                    row;

                for (var i = 0; i < length; i++)
                {
                    if ((row = rows[i]) && state.indexOf(row.state) >= 0)
                    {
                        list[index++] = row;
                    }
                }

                list.length = index;
            }
            else
            {
                rows.push.apply(list, rows);
            }
        }
        
        return list;
    };
    
    
    //接收所有修改
    this.acceptChanges = function () {
        
        var rows = this.__changed_rows,
            length = rows.length,
            row;
        
        if (length > 0)
        {
            for (var i = 0; i < length; i++)
            {
                if (row = rows[i])
                {
                    row.originalData = null;
                    row.state = 'unchanged';
                }
            }
            
            rows.length = 0;
        }
        
        return this;
    };
    
    
    //拒绝所有修改
    this.rejectChanges = function () {
        
        var rows = this.__changed_rows,
            length = rows.length,
            row,
            data;
        
        if (length > 0)
        {
            for (var i = length - 1; i >= 0; i--)
            {
                if (row = rows[i])
                {
                    if (data = row.originalData)
                    {
                        row.data = data;
                        row.originalData = null;
                        row.state = 'unchanged';
                    }
                    else
                    {
                        rows.splice.call(row.parent || this, row.index(), 1);
                        row.dataset = row.parent = null;
                    }
                }
            }
            
            rows.length = 0;
        }
        
        return this;
    };
    
    
    //同步数据至绑定目标
    this.sync = function (row, name, value, target) {
        
        
    };
    
        
});




/**
* 弹出层组件
* 
* 事件:
* open: 打开事件
* autoclosing: 自动关闭前事件(可取消)
* closing: 关闭前事件(可取消)
* closed: 关闭后事件
*/
$class('Popup', [Object, flyingon.IComponent], function () {



    var layers = [], //弹出层管理器

        Event = flyingon.DomEvent; //Dom事件类



    $constructor(function (dispose) {

        var dom = this.dom = document.createElement('div');

        dom.className = 'flyingon-Popup ';
        dom.style.cssText = 'position:absolute;visibility:hidden;';
        
        this.__dispose = dispose;
    });



    //扩展class相关操作
    flyingon.__class_extend(this, 'flyingon-Popup ');
    

    //处理全局点击事件,点击当前弹出层以外的区域则关闭当前弹出层
    flyingon.dom_on(document, 'mousedown', function (e) { 

        var layer = layers[layers.length - 1];

        if (layer) {

            var dom = layer.dom,
                target = e.target;

            while (target) 
            {
                if (target === dom) 
                {
                    return;
                }

                target = target.parentNode;
            }

            //调用关闭弹出层方法, 关闭类型为'auto'
            if (layer.trigger(new Event('autoclosing', e.target)) !== false) 
            {
                layer.close('auto', e);
            }
        }
    });
    

    //处理全局键盘事件,点击Esc则退出当前窗口
    flyingon.dom_on(document, 'keydown', function (e) { 

        var layer;

        if (e.which === 27 && (layer = layers[layers.length - 1]))
        {
            layer.close('cancel', e);
        }
    });


    
    //弹出层宽度
    this.defineProperty('width', '', {

        set: 'this.dom.style.width = value > 0 ? value + "px" : value;'
    });


    //弹出层高度
    this.defineProperty('height', '', {

        set: 'this.dom.style.height = value > 0 ? value + "px" : value;'
    });


    //是否支持多级弹出层
    this.defineProperty('multi', false);


    //鼠标移出弹出层时是否自动关闭
    this.defineProperty('closeLeave', false);


    //鼠标离弹出层越来越远时是否自动关闭
    this.defineProperty('closeAway', false);
    
    
    //停靠位置 bottom:下面 top:上面 right:右边 left:左边
    this.defineProperty('location', 'bottom');
    
    
    //对齐 left|center|right|top|middle|bottom
    this.defineProperty('align', 'left');
    
    
    //空间不足时是否反转方向
    this.defineProperty('reverse', true);
    
    
    //当前方向偏移
    this.defineProperty('offset1', 0);
    
    
    //相反方向偏移
    this.defineProperty('offset2', 2);



    //打开弹出层
    //dom: 参考停靠的dom对象
    this.open = function (dom, offsetX, offsetY) {

        if (check_open(this) !== false)
        {
            var target = this.__storage || this.__defaults,
                rect = dom.getBoundingClientRect();
            
            rect = {
                
                left: rect.left + (offsetX | 0),
                top: rect.top + (offsetY | 0),
                right: rect.right,
                bottom: rect.bottom
            };
            
            flyingon.dom_align(this.dom, rect, target.location, target.align, target.reverse, target.offset1, target.offset2);
            open(this);
            
            return true;
        }

        return false;
    };


    //在指定的位置打开弹出层
    this.openAt = function (left, top) {

        if (check_open(this) !== false)
        {
            var style = this.dom.style;

            if (left > 0 || left < 0)
            {
                left += 'px';
            }
            
            if (top > 0 || top < 0)
            {
                top += 'px';
            }
            
            style.left = left;
            style.top = top;
            
            open(this);
            return true;
        }

        return false; 
    };


    function check_open(self) {

        var items = layers,
            length = items.length,
            dom;

        if (length > 0)
        {
            for (var i = 0; i < length; i++)
            {
                if (items[i] === self)
                {
                    return false;
                }
            }
            
            if (!self.multi() || !items[0].multi())
            {
                for (var i = length - 1; i >= 0; i--)
                {
                    if (self.close('auto', null, false) === false)
                    {
                        return false;
                    }
                }
            }
        }

        dom = self.dom;
        dom.style.visibility = 'visible';
        document.body.appendChild(dom);

        return true;
    };


    function open(self) {

        if (self.closeAway())
        {
            closeAway(self);
        }

        if (self.closeLeave())
        {
            closeLeave(self);
        }

        //添加弹出层
        layers.push(self);
        
        //触发打开事件
        self.trigger('open');
    };


    function closeLeave(self) {

        var dom = self.dom;

        flyingon.dom_on(dom, 'mouseout', self.__dom_mouseout = function (e) {

            if (self === layers[layers.length - 1])
            {
                var rect = dom.getBoundingClientRect(),
                    x = e.clientX,
                    y = e.clientY;

                if (x >= rect.right || y >= rect.bottom || x <= rect.left || y <= rect.top)
                {
                    self.close('auto', e);
                }
            }
        });
    };


    function closeAway(self) {

        var rect = self.dom.getBoundingClientRect(), 
            source;

        flyingon.dom_on(document, 'mousemove', self.__document_mousemove = function (e) {

            if ((!source || self === layers[layers.length - 1]) && 
                (source = check_closeAway(e, rect, source)) === true)
            {
                self.close('auto', e);
            }
        });
    };


    function check_closeAway(e, rect, source) {

        var x = e.clientX,
            y = e.clientY;

        if (source)
        {
            if (rect.left - x > source.x1 + 4 || 
                x - rect.right > source.x2 + 4 || 
                rect.top - y > source.y1 + 4 || 
                y - rect.bottom > source.y2 + 4)
            {
                return true;
            }
        }
        else
        {
            source = Math.max;
            source = {

                x1: source(rect.left - x, 0),
                x2: source(x - rect.right, 0),
                y1: source(rect.top - y, 0),
                y2: source(y - rect.bottom, 0)
            };
        }

        return source;
    };


    //关闭弹出层(弹出多级窗口时只有最后一个可以成功关闭)
    //closeType: 关闭类型 ok, cancel, auto
    this.close = function (closeType, event, off) {

        if (this === layers[layers.length - 1])
        {
            var dom = this.dom,
                e = new Event('closing', event),
                fn;

            e.closeType = closeType || 'ok';

            if (this.trigger(e) === false) 
            {
                return false;
            }

            //注销事件
            if (fn = this.__document_mousemove)
            {
                flyingon.dom_off(document, 'mousemove', fn);
                this.__document_mousemove = null;
            }

            if (fn = this.__dom_mouseout)
            {
                flyingon.dom_off(this.dom, 'mouseout', fn);
                this.__dom_mouseout = null;
            }

            layers.pop();

            dom.parentNode.removeChild(dom);

            e = new Event('closed', event);
            e.closeType = closeType || 'ok';

            this.trigger(e);
            
            if (this.__dispose)
            {
                this.dispose();
            }
            
            return true;
        }

        return false;
    };
    
    
    this.dispose = function () {
        
        this.dom = null;
        
        if (this.__events)
        {
            this.off();
        } 
    };


});

