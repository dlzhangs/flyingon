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
var flyingon = window.flyingon = function (selector, context) {
    
    return new flyingon.Query().find(selector, context);
};



//当前版本
flyingon.version = '0.0.1.0';



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

    if (data)
    {
        var values = [],
            encode = encodeURIComponent;

        for (var name in data)
        {
            values.push(encode(name) + '=' + encode(data[name]));
        }

        return values.length > 0 ? values.join('&') : encode(data);
    }

    return data;
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
                throw $translate('flyingon', 'json parse error');
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


//待扩展的选择器
flyingon.Query = function () { };




//资源加载及名字空间
(function (window, document, flyingon) {



    var head = document.getElementsByTagName('head')[0],

        dom = document.createElement('div'), //清除节点用

        ie9 = !-[1,] || document.documentMode === 9, //ie9及以下版本
        
        base_path = flyingon.absoluteUrl('/'), //网站主路径

        flyingon_path, //flyingon路径, flyingon所在目录或flyingon.js文件所在目录

        require_path, //引入资源起始目录

        require_version = '', //引入资源版本

        require_files = flyingon.create(null), //特殊指定的引入资源版本

        require_map = flyingon.create(null), //引入资源映射

        require_list = flyingon.create(null), //加载资源队列

        require_back = flyingon.create(null), //回溯检测关系

        require_url = flyingon.create(null), //相对url对应绝对url

        require_current = [], //当前加载资源缓

        require_sync, //是否使用同步script模式加载资源
        
        sync_list = [], //同步资源队列
        
        require_ajax = ie9, //是否ajax加载js, IE6789不支持script异步加载, 因为js的执行与加载完毕事件不是一一对应

        require_keys = { //引入资源变量
            
            layout: 'default', //当前布局
            skin: 'default', //当前皮肤
            i18n: navigator.language || 'zh-CN'    //当前本地化名称
        },
        
        key_files = {}, //已加载的变量文件集合

        i18n_list = flyingon.create(null), //本地化信息集合
        
        translate_list = flyingon.create(null), //翻译资源文件列表        

        regex_namespace = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/, //名字空间名称检测

        namespace_stack = []; //名字空间栈

    
                    
    
    //实始化起始路径
    flyingon_path = require_path = (function () {
        
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
    //url可为字符串路径或路径数组
    //url规则: /xxx: 相对网站根目录
    //url规则: xxx 相对flyingon.js目录
    //url规则: ./xxx: 相对flyingon.js目录
    //url规则: ../xxx: 相对flyingon.js的上级目录
    //url规则: xxx://xxx 绝对路径
    function $require(url, css, callback) {

        if (url)
        {
            var require = require_list,
                current = require_current,
                items = typeof url === 'string' ? [url] : url,
                list;
            
            if (typeof css === 'function')
            {
                callback = css;
                css = null;
            }

            for (var i = 0, _ = items.length; i < _; i++)
            {
                url = items[i];
                
                //样式
                if (css === true || (css !== false && url.indexOf(css || '.css') >= 0))
                {
                    if (!require[url = to_src(url)])
                    {
                        require[url] = true; //标记css文件已经加载
                        create_link(url);
                    }
                }
                else if (callback) //按需加载并执行回调
                {
                    (list || (list = [])).push(url);
                }
                else if (require[url = to_src(url)] !== true && !current[url]) //依赖加载
                {
                    current[url] = true;
                    current.push(url);
                }
            }

            if (list && (list = check_require(list, callback)))
            {
                load_require(list);
            }
            else if (callback)
            {
                callback(flyingon);
            }
        }
    };

    
    
    //是否使用同步script模式加载资源
    $require.sync = function (value) {
    
        require_sync = !!value;
    };
    
    
    //是否使用ajax模式加载资源
    $require.ajax = function (value) {
      
        if (value || !ie9) //IE9以下不能设置为不使用ajax加载模式
        {
            require_ajax = !!value;
        }
    };
    

    //指定引入资源起始路径
    $require.path = function (path) {

        if (path === void 0)
        {
            return require_path;
        }

        if (path && typeof path === 'string')
        {
            if (path.charAt(0) === '/')
            {
                require_path = flyingon.absoluteUrl(path);
            }
            else if (path.indexOf(':/') >= 0)
            {
                require_path = path;
            }
            else
            {
                require_path = flyingon.absoluteUrl(flyingon_path + path);
            }
            
            if (path.charAt(path.length - 1) !== '/')
            {
                require_path += '/';
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
                require_files[name] = files[name];
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
                    require_map[value] = name;
                }
                else
                {
                    for (var i = 0, _ = value.length; i < _; i++)
                    {
                        require_map[value[i]] = name;
                    }
                }
            }
        }
    };
    
    
        
    //转换相对url为绝对src
    function to_src(url, key) {

        var src = url = require_map[url] || url,
            name,
            index,
            cache;

        //如果已经缓存则直接返回
        if (cache = require_url[src])
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
        }
        else
        {
            key = false;
        }

        //添加版本号
        if (cache = require_files[url] || require_version)
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
            cache = require_path + cache;
        }
        
        //记录多语言及皮肤
        if (key !== false)
        {
            (key_files[name] || (key_files[name] = {}))[cache] = url;
        }

        return require_url[src] = cache;
    };


    //创建样式表
    function create_link(src, url) {

        var dom = document.createElement('link');

        dom.href = src;
        dom.rel = 'stylesheet';
        dom.type = 'text/css';

        head.appendChild(dom);

        return true;
    };

    
    //检测按需引入的资源
    function check_require(list, callback) {
        
        var require = require_list,
            data = [],
            back,
            src;
        
        if (callback)
        {
            back = require_back;
        }
        
        for (var i = 0, length = list.length; i < length; i++)
        {
            src = to_src(list[i]);
            
            if (require[src] !== true && !data[src])
            {
                data[src] = true;
                data.push(src);

                if (back)
                {
                    (back[src] || (back[src] = [])).push(callback); //设置回溯
                }
            }
        }
        
        if ((length = data.length) > 0)
        {
            if (callback)
            {
                callback.require = length;
            }
            
            return data;
        }
    };
    
    
    //加载引入资源
    function load_require(list) {

        if (list && list.length > 0)
        {
            list = list.require || list;
            
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
        }
    };

    
    //使用ajax的方式加载资源
    function script_ajax(list) {
                        
        var require = require_list,
            src;
        
        for (var i = 0, length = list.length; i < length; i++)
        {
            if ((src = list[i]) && !require[src])
            {
                //不跨域
                if (src.indexOf(base_path) === 0)
                {
                    require[src] = 1; //1: 待加载js []: js已加载 true: js已完全执行
                    flyingon.ajax(src, { dataType: 'script' }).always(script_load);
                }
                else //跨域使用script同步加载
                {
                    if (++i < length)
                    {
                        list.splice(0, i);

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
            var src = list.pop(),
                callback = script_sync;

            if (typeof src === 'function')
            {
                callback = src;
                src = list.pop();
            }
            
            if (require_list[src])
            {
                callback();
            }
            else
            {
                //标记正在加载防止重复执行
                fn.load = true;
            
                require_list[src] = 1; //1: 待加载js []: js已加载 true: js已完全执行

                create_script(src, function (src) {

                    script_load(src);
                    
                    fn.load = false; //标记加载结束
                    callback();
                });
            }
        }
    };
    
        
    //异步加载脚本
    function script_async(list) {
        
        var require = require_list,
            src;

        for (var i = 0, _ = list.length; i < _; i++)
        {
            if ((src = list[i]) && !require[src])
            {
                require[src] = 1; //1: 待加载js []: js已加载 true: js已完全执行
                create_script(src, script_load);
            }
        }
    };
    

    //创建脚本标签
    function create_script(src, callback) {

        var dom = document.createElement('script');

        if (ie9)
        {
            dom.onreadystatechange = function () {

                if ('loaded,complete'.indexOf(this.readyState) >= 0)
                {
                    callback(src)
                }
            };
        }
        else
        {
            dom.onload = function () {

                callback(src)
            };
        }

        dom.onerror = function () {

            callback(src)
        };

        //dom.async = false;
        dom.src = src;

        head.appendChild(dom);

        dom = null;
    };
    
    
    //脚本执行完毕
    function script_load(src) {

        var require = require_list,
            current = require_current,
            back = require_back;
        
        //如果资源中包含需引入的资源则继续加载
        if (current && current.length > 0 && check_load(require, back, src, current))
        {
            //标记js已加载但未执行
            require[src] = current;

            //初始化当前引入对象
            require_current = [];

            //继续加载资源
            load_require(current);
        }
        else
        {
            //标记已完全执行
            require[src] = true;
            
            //回溯检测
            check_back(require, back, src);
        }
    };


    //检测引入资源
    function check_load(require, back, src, list) {
        
        var items, item, cache;
        
        for (var i = 0, length = list.length; i < length; i++)
        {
            if ((item = list[i]) && item[0] !== true)
            {
                if (item === src || //自身不能引用自身
                    (cache = require[item]) === true ||
                    (cache && (cache = cache.require) && check_cycle(require, src, cache, 0))) //不能组成循环引用
                {
                    //移除当前url及执行最开始的回调函数
                    if (i === 0)
                    {
                        for (var j = 1; j < length; j++)
                        {
                            if ((item = list[j]) && item[0] === true)
                            {
                                item[1].apply(item[2], item[3]);
                            }
                            else
                            {
                                break;
                            }
                        }
                        
                        cache = j - i--;
                        length -= cache;
                        
                        list.splice(0, cache);
                    }
                    else
                    {
                        list.splice(i--, 1);
                        length--;
                    }

                    continue;
                }
                
                (items || (items = [])).push(item);
                (back[item] || (back[item] = [])).push(src); //设置回溯
            }
        }
        
        if (items)
        {
            list.require = items;
            return true;
        }
     };
    
    
    //检测循环引用
    //注: 循环引用时最后被加载的文件优先执行
    function check_cycle(require, src, list, cycle) {
      
        cycle++;

        for (var i = 0, _ = list.length; i < _; i++)
        {
            var url = list[i];
            
            if (url === src)
            {
                return true;
            }

            if (cycle > 10)
            {
                throw $translate('flyingon', 'require cycle');
            }

            var cache = require[url];

            if (cache && (cache = cache.require) && check_cycle(require, src, cache, cycle))
            {
                return true;
            }
        }
    };
    
    
    //检测是否已加载完毕
    function check_done(require, list) {
        
        var item;
        
        for (var i = 0, _ = list.length; i < _; i++)
        {
            if ((item = list[i])[0] === true)
            {
                item[1].apply(item[2], item[3]);
            }
            else if (require[item] !== true)
            {
                if (i > 0)
                {
                    list.splice(0, i);
                }
                
                return false;
            }
        }
        
        //清空数组
        list.length = 0;
        list.require = null;
    };


    //回溯检测引入的资源是否已加载完成
    function check_back(require, back, src) {
      
        var list = back[src],
            item,
            cache;
        
        if (list)
        {
            //删除回溯链
            delete back[src];
            
            for (var i = 0, _ = list.length; i < _; i++)
            {
                if ((item = list[i]).require) //如果是回调函数则直接执行
                {
                    if (!--item.require) //回调函数计数器为0时则执行回调函数
                    {
                        item(flyingon);
                    }
                }
                else if ((cache = require[item]) && 
                         cache !== true && 
                         cache !== 1 && 
                         check_done(require, cache) !== false)
                {
                    //标记已完成执行
                    require[item] = true;
                    
                    //回溯检测
                    check_back(require, back, item);
                }
            }
        }
    };


    
    //获取或设置引入变量值
    $require.key = function (key, value, callback, set) {
        
        var list = require_keys;
        
        if (!value)
        {
            return list[key];
        }
        
        if (value && list[key] !== value)
        {
            //设置当前变量
            list[key] = value;

            set && set();
         
            if (list = key_files[key])
            {
                change_require(list, key === 'skin', callback);
            }
        }
    };
    
    
    //变量皮肤或多语言资源
    function change_require(data, css, callback) {
        
        var list = document.getElementsByTagName(css ? 'link' : 'script'),
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
            //移除缓存
            require_list[src] = require_url[cache = data[src]] = false; 

            //重新加载资源
            list.push(cache);
        }
        
        $require(list, css, callback || function () {});
    };


    //获取或设置当前皮肤
    flyingon.skin = function (name) {

        return $require.key('skin', name);
    };
    
    
    //获取指定key的本地化信息
    function $i18ntext(key) {

        return i18n_list[key] || key;
    };


    //获取或设置当前本地化名称
    flyingon.i18n = function (name) {

        return $require.key('i18n', name, null, function () {
        
            //国际化时先清空缓存
            i18n_list = flyingon.create(null);
            translate_list = flyingon.create(null);
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
            return i18n_list;
        }
        
        var target = i18n_list;
        
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
      
        if (url && name)
        {
            var target = translate_list[url];
            
            if (target)
            {
                return target[name] || name;
            }
            
            flyingon.ajax(to_src($translate[url] || url, false), { 
                
                dataType: 'json', 
                async: false 
                
            }).done(function (data) {
             
                translate_list[url] = target = data;
            });
            
            return target && target[name] || name;
        }
    };
    
    
    //定义翻译flyingon资源路径
    $translate.flyingon = 'flyingon/i18n/{i18n}/message.json';
    
    
    
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
                throw $translate('flyingon', 'namespace name error');
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
            //如果正在动态加载脚本或还有依赖的js没有加载完成则先注册
            if ((cache = require_current) && cache.length > 0)
            {
                cache.push([true, load_namespace, window, [target, callback]]);
            }
            else //否则立即执行
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

    
    
    //输出外部接口
    //分开赋值解决chrome调试时类名过长的问题
    window.$require = window.$include = $require;
    window.$i18nlist = $i18nlist;
    window.$i18ntext = $i18ntext;
    window.$translate = $translate;
    window.$namespace = $namespace;
    

})(window, document, flyingon);


    

//类,属性及事件
(function (window, flyingon) {
    


    var has = {}.hasOwnProperty,
    
        regex_interface = /^I[A-Z][A-Za-z0-9]*$/,   //接口名正则表式验证
        
        regex_class = /^[A-Z][A-Za-z0-9]*$/, //类名正则表式验证

        class_list = flyingon.__class_list = flyingon.create(null), //已注册类型集合

        class_stack = [],  //类栈(支持类的内部定义类)
        
        class_data; //当前类定义信息(支持类的内部定义类)
        
                
    
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
    
    
    
    //定义接口方法
    function $interface(name, fn, property) {
        
        if (!regex_interface.test(name))
        {
            throw $translate('flyingon', 'interface name error');
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
                throw $translate('flyingon', 'interface can not new');
            }
            
            if (!target)
            {
                throw $translate('flyingon', 'interface target error');
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
            throw $translate('flyingon', '$constructor not in class');
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
            throw $translate('flyingon', '$static not in class');
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
            throw $translate('flyingon', 'class name error');
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
                throw $translate('flyingon', 'class fn error');
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
            if (cache === void 0)
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
        if (cache === void 0)
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
            throw $translate('flyingon', 'property name error').replace('{0}', name);
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

        //扩展至选择器
        if (attributes.query)
        {
            flyingon.Query.prototype[name] = function (value) {
                
                return this.value(name, value);
            };
        }
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
    function on(type, fn) {

        if (type && typeof fn === 'function')
        {
            var events = this.__events || (this.__events = flyingon.create(null));

            (events[type] || (events[type] = [])).push(fn);

            //注册自定义事件
            if (fn = this['on_event_' + type])
            {
                fn.call(this, type);
            }
        }

        return this;
    };

    
    //只执行一次绑定的事件
    function once(type, fn) {

        var self = this;

        function callback() {

            fn.apply(self, arguments);
            self.off(type, callback);
        };

        this.on(type, callback);
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
            if (type)
            {
                if (fn)
                {
                    if (events = events[type])
                    {
                        for (var i = events.length - 1; i >= 0; i--)
                        {
                            if (events[i] === fn)
                            {
                                events.splice(i, 1);
                            }
                        }

                        if (!events.length)
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

                //注销自定义事件
                if (fn = this['off_event_' + type])
                {
                    fn.call(this);
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

        var type = e.type || (e = arguments[0] = new flyingon.Event(e)).type,
            start = flyingon,
            target = start,
            events,
            fn;

        e.target = this;

        do
        {
            if ((events = target.__events) && (events = events[type]))
            {
                for (var i = 0, _ = events.length; i < _; i++)
                {
                    if ((fn = events[i]) && !fn.disabled)
                    {
                        if (fn.apply(target, arguments) === false)
                        {
                            e.defaultPrevented = true;
                        }

                        if (e.cancelBubble)
                        {
                            return !e.defaultPrevented;
                        }
                    }
                }
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
    
    
    //生成全局事件方法
    flyingon.on = on;
    flyingon.off = off;
    flyingon.once = once;
    flyingon.suspend = suspend;
    flyingon.resume = resume;
    flyingon.trigger = trigger;
    
    
    //输出外部接口
    //分开赋值解决chrome调试时类名过长的问题
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

    
    this.__class_init = function (Class) {
      
        Class.init = function (type) {
         
            var event = new Class(type),
                i = 1,
                length = arguments.length;
            
            while (i < length)
            {
                event[arguments[i++]] = arguments[i++];
            }
            
            return event;
        };
    };
    
    
}, true);



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


    //发送请求
    $constructor(function (url, options) {

        var self = this,
            ajax = this.ajax = new XMLHttpRequest(),
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
        else
        {
            options = {};
        }
        
        //执行发送前全局start事件
        if (cache = flyingon.Ajax.start)
        {
            for (var i = 0, _ = cache.length; i < _; i++)
            {
                cache[i].call(this, options);
            }
        }

        if ((cache = this.timeout) > 0)
        {
            this.__timer = setTimeout(function () {

                request.abort();
                self.fail('timeout');

            }, cache);
        }

        cache = (cache = this.method) && cache.toUpperCase() || 'GET';

        if (data)
        {
            if (cache === 'GET')
            {
                url += (url.indexOf('?') >= 0 ? '&' : '?') + flyingon.encode(data);
                data = null;
            }
            else if (typeof data === 'object')
            {
                data = flyingon.encode(data);
            }
        }

        //CORS
        if (this.crossDomain)
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
            else
            {
                throw $translate('flyingon', 'ajax no crossDomain');
            }
        }
        
        ajax.open(this.method, url, this.async);
        
        ajax.onreadystatechange = function () {

            callback(self, this, url, options);
        };

        if (cache = this.header)
        {
            for (var name in cache)
            {
                ajax.setRequestHeader(name, cache[name]);
            }
        }

        ajax.setRequestHeader('Content-Type', this.contentType);

        if (data)
        {
            ajax.setRequestHeader('Content-Length', data.length);
        }

        ajax.send(data);
    });


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
    
    //是否支持跨域(CORS)
    this.crossDomain = false;

    //超时时间
    this.timeout = 0;
    
    

    //处理响应结果
    function callback(self, ajax, url, options) {

        var cache = ajax.readyState;

        if (cache === 4)
        {
            if (cache = self.__timer)
            {
                clearTimeout(cache);
                self.__timer = 0;
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
                        self.resolve(ajax.responseText);
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
                self.reject('ajax', ajax);
            }

            //执行全局ajax执行结束事件
            if (cache = flyingon.Ajax.end)
            {
                for (var i = 0, _ = cache.length; i < _; i++)
                {
                    cache[i].call(self, options);
                }
            }
        }
        else
        {
            self.notify(ajax, cache);
        }
    };


}, false);


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


    
