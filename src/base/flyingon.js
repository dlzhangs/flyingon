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
    
    return new flyingon.Query(selector, context);
};



//当前版本
flyingon.version = '0.0.1.0';



//复制源对象成员至目标对象
flyingon.extend = function (target, source, deep) {
    
    target = target || {};
    
    if (source)
    {
        for (var name in source)
        {
            var value = source[name];
            target[name] = deep && typeof value === 'object' ? flyingon.extend(target[name], value) : value;
        }
    }
    
    return target;
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
                throw $errortext('flyingon', 'json parse');
            }

            return new Function('return ' + text)();
        }

        return text;
    };

})();


//全局动态执行js, 防止局部执行增加作用域而带来变量冲突的问题
//注1: 这个函数只能放在全局区, 否则IE低版本下作用域会有问题而导致变量冲突
//注2: IE的execScript方法没有返回值, 且在某些版本下可能有问题, 故此处不使用
flyingon.globalEval = function (text) {
    
    return window['eval'].call(window, text);
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



//依赖,名字空间及类
(function (window, document, flyingon) {



    var head = document.getElementsByTagName('head')[0],

        dom = document.createElement('div'), //清除节点用

        ie9 = !-[1,] || document.documentMode === 9, //ie9
        
        base_path = flyingon.absoluteUrl('/'), //网站主路径

        flyingon_path, //flyingon路径, flyingon所在目录或flyingon.js文件所在目录

        include_path, //引入资源起始目录

        include_version = '', //引入资源版本

        include_files = flyingon.create(null), //特殊指定的引入资源版本

        include_map = flyingon.create(null), //引入资源映射

        include_list = flyingon.create(null), //加载资源队列

        include_back = flyingon.create(null), //回溯检测关系

        include_url = flyingon.create(null), //相对url对应绝对url

        include_current = [], //当前加载资源缓

        include_sync, //是否使用同步script模式加载资源
        
        sync_list = [], //同步资源队列
        
        include_ajax = ie9, //是否ajax加载js, IE6789不支持script异步加载, 因为js的执行与加载完毕事件不是一一对应

        include_var = { //引入资源变量
            
            layout: 'default', //当前布局
            skin: 'default', //当前皮肤
            i18n: navigator.language || 'zh-CN'    //当前本地化名称
        },
        
        var_files = {}, //已加载的变量文件集合

        i18n_list = flyingon.create(null), //本地化信息集合
        
        error_type,  //当前错误类型
        
        error_path = '{type}/i18n/{i18n}/error.js', //错误信息路径模板
        
        error_list = flyingon.create(null); //错误信息列表        

    
    
    //实始化起始路径
    flyingon_path = include_path = (function () {
        
        var list = document.scripts,
            regex = /flyingon(?:\/js\/flyingon)?-(?:core|layout|full)(?:\.min)?\.js/;
        
        for (var i = list.length - 1; i >= 0; i--)
        {
            var src = flyingon.absoluteUrl(list[i].src), //注：ie7以下的src不会转成绝对路径
                index = src.search(regex);
            
            if (index >= 0)
            {
                return src.substring(0, index);
            }
        }
        
        return flyingon.absoluteUrl('', true);
        
    })();
    
    
    //是否使用同步script模式加载资源
    flyingon.include_sync = function (value) {
    
        include_sync = !!value;
    };
    
    
    //是否使用ajax模式加载资源
    flyingon.include_ajax = function (value) {
      
        if (value || !ie9) //IE9以下不能设置为不使用ajax加载模式
        {
            include_ajax = !!value;
        }
    };
    

    //指定引入资源起始路径
    flyingon.include_path = function (path) {

        if (path === void 0)
        {
            return include_path;
        }

        if (path && typeof path === 'string')
        {
            if (path.charAt(0) === '/')
            {
                include_path = flyingon.absoluteUrl(path);
            }
            else if (path.indexOf(':/') >= 0)
            {
                include_path = path;
            }
            else
            {
                include_path = flyingon.absoluteUrl(flyingon_path + path);
            }
            
            if (path.charAt(path.length - 1) !== '/')
            {
                include_path += '/';
            }
        }
    };


    //指定引入资源版本号
    flyingon.include_version = function (version, files) {

        if (typeof version === 'string')
        {
            include_version = version;
        }
        else
        {
            files = version;
        }

        if (files)
        {
            for (var name in files)
            {
                include_files[name] = files[name];
            }
        }
    };


    //指定引入资源合并关系
    flyingon.include_merge = function (values) {

        if (values)
        {
            for (var name in values)
            {
                var value = values[name];

                if (typeof value === 'string')
                {
                    include_map[value] = name;
                }
                else
                {
                    for (var i = 0, _ = value.length; i < _; i++)
                    {
                        include_map[value[i]] = name;
                    }
                }
            }
        }
    };
    
    
    //引入js或css资源
    //url: /xxx: 相对网站根目录
    //url: xxx 相对flyingon.js目录
    //url: ./xxx: 相对flyingon.js目录
    //url: ../xxx: 相对flyingon.js的上级目录
    //url: xxx://xxx 绝对路径
    flyingon.$include = window.$include = function (url, css) {

        if (url && typeof url === 'string' && !check_css(url, css))
        {
            var list;

            //如果脚本已处理
            if (include_list[url = to_src(url)] !== true && !(list = include_current)[url])
            {
                list[url] = true;
                list.push(url);
            }
        }
    };


    //require函数
    flyingon.$require = window.$require = function (url, callback, css) {

        if (typeof url === 'function')
        {
            url(flyingon);
            return;
        }
        
        if (typeof callback !== 'function')
        {
            callback = null;
        }
        
        var length;
        
        if (typeof url === 'string')
        {
            if (!check_css(url, css))
            {
                url = [url];
                length = 1;
            }
        }
        else if ((length = url.length) > 0)
        {
            for (var i = 0; i < length; i++)
            {
                if (check_css(url[i], css))
                {
                    url.splice(i, 1);
                    i--;
                    length--;
                }
            }
        }
        else
        {
            url = null;
        }
        
        if (url && length && (url = check_require(url, callback)))
        {
            load_include(url);
        }
        else if (callback)
        {
            callback(flyingon);
        }
    };

    
    
    //检测指定的url是否css文件
    function check_css(url, css) {
        
        if (css === true || (css !== false && url.indexOf(css || '.css') >= 0))
        {
            var include = include_list;
            
            if (!include[url = to_src(url)])
            {
                include[url] = true; //标记css文件已经加载
                create_link(url);
            }
            
            return true;
        }
    };
    

    //转换相对url为绝对src
    function to_src(url) {

        var src = url = include_map[url] || url,
            name,
            index,
            cache;

        //如果已经缓存则直接返回
        if (cache = include_url[src])
        {
            return cache;
        }

        //替换当前语言及主题
        if ((index = url.indexOf('{')) >= 0 && 
            (cache = url.indexOf('}')) > index &&
            (name = url.substring(index + 1, cache)) &&
            ((cache = include_var[name]) || (name = null)))
        {
            src = url.replace('{' + name + '}', cache);
        }

        //添加版本号
        if (cache = include_files[url] || include_version)
        {
            cache = src + (url.indexOf('?') >= 0 ? '&' : '?') + 'include-version=' + cache;
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
            cache = include_path + cache;
        }
        
        //记录多语言及皮肤
        if (name)
        {
            (var_files[name] || (var_files[name] = {}))[cache] = url;
        }

        return include_url[src] = cache;
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
        
        var include = include_list,
            data = [],
            back,
            src;
        
        if (callback)
        {
            back = include_back;
        }
        
        for (var i = 0, length = list.length; i < length; i++)
        {
            src = to_src(list[i]);
            
            if (include[src] !== true && !data[src])
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
    function load_include(list) {

        if (list && list.length > 0)
        {
            list = list.include || list;
            
            //调试模式使用同步script方式加载资源
            if (include_sync)
            {
                registry_sync(list.reverse()); //倒序加入队列
            }
            else if (include_ajax) //使用ajax加载资源
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
                        
        var include = include_list,
            src;
        
        for (var i = 0, length = list.length; i < length; i++)
        {
            if ((src = list[i]) && !include[src])
            {
                //不跨域
                if (src.indexOf(base_path) === 0)
                {
                    include[src] = 1; //1: 待加载js []: js已加载 true: js已完全执行
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
            
            if (include_list[src])
            {
                callback();
            }
            else
            {
                //标记正在加载防止重复执行
                fn.load = true;
            
                include_list[src] = 1; //1: 待加载js []: js已加载 true: js已完全执行

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
        
        var include = include_list,
            src;

        for (var i = 0, _ = list.length; i < _; i++)
        {
            if ((src = list[i]) && !include[src])
            {
                include[src] = 1; //1: 待加载js []: js已加载 true: js已完全执行
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

        var include = include_list,
            list = include_current,
            back = include_back;
        
        //如果资源中包含需引入的资源则继续加载
        if (list && list.length > 0 && check_include(include, back, src, list))
        {
            //标记js已加载但未执行
            include[src] = list;

            //初始化当前引入对象
            include_current = [];

            //继续加载资源
            load_include(list);
        }
        else
        {
            //标记已完全执行
            include[src] = true;
            
            //回溯检测
            check_back(include, back, src);
        }
    };


    //检测引入资源
    function check_include(include, back, src, list) {
        
        var data, item, cache;
        
        for (var i = 0, length = list.length; i < length; i++)
        {
            if ((item = list[i]) && item[0] !== true)
            {
                if (item === src || //自身不能引用自身
                    (cache = include[item]) === true ||
                    (cache && (cache = cache.include) && check_cycle(include, src, cache, 0))) //不能组成循环引用
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
                
                (data || (data = [])).push(item);
                (back[item] || (back[item] = [])).push(src); //设置回溯
            }
        }
        
        if (data)
        {
            list.include = data;
            return true;
        }
     };
    
    
    //检测循环引用
    //注: 循环引用时最后被加载的文件优先执行
    function check_cycle(include, src, list, cycle) {
      
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
                throw $errortext('flyingon', 'include cycle');
            }

            var cache = include[url];

            if (cache && (cache = cache.include) && check_cycle(include, src, cache, cycle))
            {
                return true;
            }
        }
    };
    
    
    //检测是否已加载完毕
    function check_done(include, list) {
        
        var item;
        
        for (var i = 0, _ = list.length; i < _; i++)
        {
            if ((item = list[i])[0] === true)
            {
                item[1].apply(item[2], item[3]);
            }
            else if (include[item] !== true)
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
        list.include = null;
    };


    //回溯检测引入的资源是否已加载完成
    function check_back(include, back, src) {
      
        var list = back[src],
            cache,
            item;
        
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
                else if ((cache = include[item]) && 
                         cache !== true && 
                         cache !== 1 && 
                         check_done(include, cache) !== false)
                {
                    //标记已完成执行
                    include[item] = true;
                    
                    //回溯检测
                    check_back(include, back, item);
                }
            }
        }
    };


    
    //获取或设置引入变量值
    flyingon.include_var = function (name, value, callback, init) {
        
        var list = include_var;
        
        if (!value)
        {
            return list[name];
        }
        
        if (value && list[name] !== value)
        {
            //设置当前变量
            list[name] = value;

            //国际化时先清空缓存
            if (name === 'i18n')
            {
                i18n_list = flyingon.create(null);
                error_list = flyingon.create(null);
            }
            
            init && init();
         
            if (list = var_files[name])
            {
                for (var _ in list) //有引入的变量资源则重新切换引入
                {
                    change_include(list, callback, callback === true);
                    break;
                }
            }
        }
    };
    
    
    //变量皮肤或多语言资源
    function change_include(data, callback, css) {
        
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
            include_list[src] = include_url[cache = data[src]] = false; 

            //重新加载资源
            list.push(cache);
        }
        
        flyingon.$require(list, callback, css);
    };


    //获取或设置当前皮肤
    flyingon.skin = function (name) {

        return flyingon.include_var('skin', name, true);
    };
    
    
    //获取指定key的本地化信息
    flyingon.$i18ntext = window.$i18ntext = function (key) {

        return i18n_list[key] || key;
    };


    //获取或设置当前本地化名称
    (flyingon.i18n = function (name, values) {

        if (name && typeof name === 'object')
        {
            values = name;
            name = null;
        }
        else if (!values || typeof values !== 'object')
        {
            return flyingon.include_var('i18n', name, values);
        }

        extend_i18n(i18n_list, name, values);
        
    }).all = function () { //获取所有本地化信息值

        return i18n_list;
    };

    
    function extend_i18n(target, name, values) {
    
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
    

    //修改错误路径模板, 使用ajax同步加载, 不能跨域 支持变量: {type} {i18n}
    flyingon.error_path = function (path) {
        
        if (path)
        {
            error_path = '' + path;
        }
        else
        {
            return error_path;
        }
    };
    
    
   //定义错误信息
    flyingon.error = function (name, values) {
        
        if (name && typeof name === 'object')
        {
            values = name;
            name = null;
        }
        else if (!values || typeof values !== 'object')
        {
            return;
        }
        
        var type = error_type;
        
        if (type)
        {
            type = error_list[type] || (error_list[type] = flyingon.create(null));
            extend_i18n(type, name, values);
        }
    };
    
    
    //获取错误信息
    flyingon.$errortext = window.$errortext = function (type, key) {
      
        if (type && key)
        {
            var cache = error_list[type];
            
            if (cache)
            {
                return cache[key] || key;
            }
            
            cache = to_src(error_path.replace('{type}', error_type = type));
                
            flyingon.ajax(cache, { dataType: 'script', async: false });

            return (cache = error_list[type]) && cache[key] || key;
        }
    };


    
    
    var regex_namespace = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/, //名称检测

        namespace_stack = [],
        
        namespace_current = flyingon,
        
        regex_class = /^[A-Z][A-Za-z0-9]*$/, //类名正则表式验证

        class_list = flyingon.__class_list = {}, //已注册类型集合

        constructor_list,  //当前构造集合
        
        static_list;  //静态成员集合
        
    
    
    //默认名字空间名
    flyingon.namespace_name = 'flyingon';


    //定义或切换模块
    flyingon.$namespace = window.$namespace = function (name, callback) {

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
                    
                    if (!cache.namespace_name)
                    {
                        cache.namespace_name = target.namespace_name ? target.namespace_name + '.' + name : name;
                    }
                    
                    target = cache;
                }
            }
            else
            {
                throw $errortext('flyingon', 'namespace name');
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
            if ((cache = include_current) && cache.length > 0)
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

        try
        {
            //记录当前名字空间
            namespace_stack.push(namespace_current = target);

            callback.call(target, target, flyingon);
        }
        finally
        {
            namespace_current = namespace_stack.pop() || flyingon;
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



    //开放定义构造函数的方法
    function constructor_fn(fn, replace) {

        if (typeof fn === 'function')
        {
            if ((fn.replace = replace) || !constructor_list)
            {
                constructor_list = [fn];
            }
            else
            {
                constructor_list.push(fn);
            }
        }
    };
    

    //开放定义静态成员的方法
    function static_fn(name, value) {

        (static_list || (static_list = [])).push(name, value);
    };
    

    //定义类方法
    //name:             类型名称,省略即创建匿名类型(匿名类型不支持自动反序列化)
    //superclass:       父类, 可传入基类或数组, 当传入数组时第一个子项为父类, 其它为接口
    //fn:               类代码, 函数, 参数(self:类原型, base:父类原型)
    function Class(name, superclass, fn) {


        var Class, base, prototype, namespace, data, cache;

        
        if (constructor_list || static_list)
        {
            throw $errortext('flyingon', 'class in');
        }
        

        //处理参数
        if (typeof name !== 'string') //不传name则创建匿名类
        {
            fn = superclass;
            superclass = name;
            name = null;
        }
        else if (!regex_class.test(name))
        {
            throw $errortext('flyingon', 'class name');
        }

        if (!fn && (fn = superclass))
        {
            superclass = null;
        }

        if (typeof fn !== 'function')
        {
            throw $errortext('flyingon', 'class fn');
        }

        
        //获取父类原型及创建类原型
        if (superclass && typeof superclass !== 'function')
        {
            data = superclass;
            superclass = superclass[0];
        }
        
        if (superclass)
        {
            if (cache = superclass.__constructor_list)
            {
                constructor_list = cache.slice(0);
            }
        }
        else
        {
            superclass = Object;
        }
        
        prototype = flyingon.create(base = superclass.prototype);

        //初始化原型
        if (base && (cache = base.__prototype_init))
        {
            cache.call(prototype, base, true);
        }
        
        if (data)
        {
            class_superclass(prototype, data);
        }

        //设置base属性
        prototype.base = base;
        
        //定义类型检测方法
        prototype.is = is;

        //定义默认toString方法
        prototype.toString = toString;
        
        //获取当前名字空间
        namespace = namespace_current;

        //xtype
        if (name)
        {
            prototype.xtype = namespace.namespace_name + '.' + name;
        }
        

        try
        {
            //缓存原全局方法
            data = window;
            cache = [data.$constructor, data.$static];
            
            //开放定义构造函数的方法
            data.$constructor = constructor_fn;

            //开放定义静态成员的方法
            data.$static = static_fn;

            //执行扩展
            fn.call(prototype, prototype, base);
        }
        finally
        {
            //回滚全局变量
            data.$constructor = cache[0];
            data.$static = cache[1];
        }
        

        //处理类及构造函数
        if (cache = constructor_list)
        {
            Class = cache.length > 1 || cache[0].superclass ? class_create(cache) : cache[0];
            Class.__constructor_list = cache; 
            
            constructor_list = null;
        }
        else
        {
            Class = function () {};
        }
        
        
        //初始化静态成员
        if (cache = static_list)
        {
            class_static(Class, cache);            
            static_list = null;
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


        if (cache = prototype.__class_init)
        {
            cache.call(prototype, Class, prototype, base);
        }


        //返回当前类型
        return Class;
    };


    //处理类接口
    function class_superclass(prototype, list) {
        
        var target, cache;
        
        for (var i = 1, _ = list.length; i < _; i++)
        {
            if ((target = list[i]) && typeof target === 'function')
            {
                //复制构造函数
                if (cache = target.__constructor_list)
                {
                    if (cache[0].replace || !constructor_list)
                    {
                        constructor_list = cache.slice(0);
                    }
                    else
                    {
                        cache.push.apply(constructor_list, cache);
                    }
                }
                
                //复制成员
                if (target = target.prototype)
                {
                    if (cache = target.__prototype_init)
                    {
                        cache.call(prototype, target);
                    }
                    else
                    {
                        for (cache in target)
                        {
                            prototype[cache] = target[cache];
                        }
                    }
                }
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

    
    //分开赋值解决chrome调试时类名过长的问题
    flyingon.$class = window.$class = Class;

    

})(window, document, flyingon);



//组件基类
$class('Component', function (self) {



    var global_events = flyingon.global_events = flyingon.create(null), //全局事件集合
        
        regex_binding = /"(?:\\"|[^"])*?"|'(?:\\'|[^'])*?'|null|true|false|undefined|\d+\w*|(\w+)|[^'"\w\s]+/g; //绑定表达式解析器 
                    

    
    //初始化原型
    (self.__prototype_init = function (base, superclass) {
        
        var extend = flyingon.extend,
            cache;
        
        if (superclass)
        {
            this.__defaults = flyingon.create(base && base.__defaults || null);
            this.__properties = flyingon.create(base && base.__properties || null);
            
            this.deserialize_list = extend(flyingon.create(null), base && base.deserialize_list);
        }
        else
        {
            cache = [this.__defaults, this.__properties, this.deserialize_list];
            
            for (var name in base)
            {
                this[name] = base[name];
            }
            
            this.__defaults = extend(cache[0] || flyingon.create(null), this.__defaults);
            this.__properties = extend(cache[1] || flyingon.create(null), this.__properties);
            
            this.deserialize_list = extend(cache[2] || flyingon.create(null), this.deserialize_list);
        }
          
    }).call(self, null, true);
    
    
    //定义属性及set_XXX方法
    self.defineProperty = function (name, defaultValue, attributes) {

        if (name.match(/\W/))
        {
            throw $errortext('flyingon', 'property name').replace('{0}', name);
        }

        var cache = attributes,
            storage;

        //初始化attributes
        attributes = { name: name, dataType: 'object' };

        //处理默认值
        if (typeof defaultValue === 'function')
        {
            attributes.fn = defaultValue;
            defaultValue = cache && cache.defaultValue;
        }
        else
        {
            attributes.defaultValue = defaultValue;
        }

        //根据默认值生成数据类型
        if (defaultValue !== void 0)
        {
            this.__defaults[name] = defaultValue;

            if (!cache || !cache.dataType)
            {
                attributes.dataType = typeof defaultValue;
            }
        }

        if (cache)
        {
            switch (typeof cache)
            {
                case 'string':
                    attributes.attributes = cache; 
                    break;

                case 'object':
                    for (var key in cache)
                    {
                        attributes[key] = cache[key];
                    }
                    break;
            }

            if (cache = cache.attributes)
            {
                cache = cache.split(',');

                for (var i = 0, _ = cache.length; i < _; i++)
                {
                    attributes[cache[i]] = true;
                }
            }
        }

        //生成属性元数据
        this.__properties[name] = attributes;

        //直接设置函数
        if (cache = attributes.fn)
        {
            this[name] = cache;
        }
        else //动态生成方法
        {
            if (storage = attributes.storage)
            {
                cache = ['var oldValue = ' + storage + ';\n\n'
                    + 'if (value === void 0)\n{\n\t'
                        + 'return oldValue !== void 0 ? oldValue : this.__defaults["' + name + '"];\n'
                    + '}\n\n'];
            }
            else
            {
                storage = 'storage["' + name + '"]';
                
                cache = ['var storage = this.__storage || (this.__storage = flyingon.create(this.__defaults)), oldValue = ' + storage + ';\n\n'
                    + 'if (value === void 0)\n{\n\t'
                        + 'return oldValue;\n'
                    + '}\n\n'];
            }

            defineProperty(cache, name, attributes, storage);

            cache.push('return this;');

            this[name] = new Function('value', 'trigger', cache.join('')); //创建属性方法
        }

        //扩展至选择器
        if (attributes.query && flyingon.Query)
        {
            flyingon.Query.prototype[name] = new Function('value', 'return this.value("' + name + '", value);');
        }

        return this;
    };


    function defineProperty(writer, name, attributes, storage) {

        var dataType = attributes.dataType,
            cache;

        //基本类型转换(根据默认值的类型自动转换)
        if (dataType !== 'object')
        {
            cache = 'value = ';

            switch (dataType)
            {
                case 'boolean':
                    writer.push('value = !!value;\n\n');
                    break;

                case 'integer':
                    writer.push('value = value >>> 0;\n\n');
                    break;

                case 'number':
                    writer.push('value = (+value || 0);\n\n');
                    break;

                case 'string':
                    writer.push('value = "" + value;\n\n');
                    break;
            }
        }

        //最小值限定(小于指定值则自动转为指定值)
        if ((cache = attributes.minValue) != null)
        {
            writer.push('if (value < ' + cache + ') value = ' + cache + ';\n\n');
        }

        //最大值限定(大于指定值则自动转为指定值)
        if ((cache = attributes.maxValue) != null)
        {
            writer.push('if (value > ' + cache + ') value = ' + cache + ';\n\n');
        }

        //自定义值检测代码
        if (cache = attributes.check)
        {
            if (typeof cache === 'function')
            {
                cache = '' + cache;
                cache = cache.substring(cache.indexOf('{') + 1, cache.lastIndexOf('}'));
            }
            
            writer.push(cache);
            writer.push('\n\n');
        }

        //对比新旧值
        writer.push('if (oldValue !== value)\n{\n\t');

        //赋值
        writer.push(storage + ' = value;\n\n\t');

        //属性变更通知
        writer.push('if (trigger !== false && this.__onpropertychange("' + name + '", value, oldValue) === false)\n\t'
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
         
            writer.push('\n\n\t');
            writer.push(cache);
        }

        //闭合
        writer.push('\n}\n\n');
    };


    //属性值变更方法
    self.__onpropertychange = function (name, value, oldValue) {
    
        var fn, cache;
        
        if ((fn = this.onpropertychange) && fn.call(this, name, value, oldValue) === false)
        {
            return false;
        }
                
        //从源对象同步数据至目标对象
        if (cache = this.__to_bindings)
        {
            this.syncBinding(name, value);
        }
        
        //从目标对象回推数据至源对象
        if ((cache = this.__bindings) && (cache = cache[name]) && cache.twoway)
        {
            cache.source.set(cache.expression || cache.name, value);
        }
    };
    
    
    //组件id
    self.defineProperty('id', '');
    
    
    //获取指定名称的值(数据绑定用)
    self.get = function (name, context) {
        
        var fn = this[name];
        
        if (fn && typeof fn === 'function')
        {
            return fn.call(this);
        }
        
        return this[name];
    };
    
    
    //设置指定名称的值(数据绑定用)
    self.set = function (name, value, context) {
        
        var fn = this[name];
        
        if (fn && typeof fn === 'function')
        {
            fn.call(this, value, false);
        }
        else
        {
            this[name] = value;
        }
    };
    

    //批量设置属性值
    self.sets = function (values, trigger) {

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


    //获取或设置属性默认值
    self.defaultValue = function (name, value) {

        var defaults = this.__defaults;

        if (value === void 0)
        {
            return defaults[name];
        }

        defaults[name] = value;
        return this;
    };


    //获取属性值集合
    self.getProperties = function (filter) {

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
    //global: 是否全局事件
    self.on = function (type, fn, global) {

        if (type && typeof fn === 'function')
        {
            var events = this.__events || (this.__events = flyingon.create(null));

            if (global)
            {
                var cache = '...global.' + type;

                events[cache] = ++events[cache] || 1;

                if (cache = global_events[type])
                {
                    cache.push(fn, this);
                }
                else
                {
                    global_events[type] = [fn, this];
                }
            }
            else
            {
                (events[type] || (events[type] = [])).push(fn);
                
                //注册自定义事件
                if (fn = this['__event_on_' + type])
                {
                    fn.call(this, type);
                }
            }
        }

        return this;
    };

    
    //只执行一次绑定的事件
    self.once = function (type, fn, global) {

        var self = this;

        function callback() {

            fn.apply(self, arguments);
            self.off(type, callback, global);
        };

        this.on(type, callback, global);
    };

    
    //暂停事件处理
    self.suspend = function (type, global) {

        var events;

        if (global) 
        {
            if (events = global_events[type])
            {
                events.unshift(suspend_fn, this);
            }
        }
        else if ((events = this.__events) && (events = events[type]))
        {
            events.unshift(suspend_fn);
        }

        return this;
    };

    
    //继续事件处理
    self.resume = function (type, global) {

        var events;

        if (global)
        {
            if ((events = global_events[type]) && events[0] === suspend_fn)
            {
                events.splice(0, 2);
            }
        }
        else if ((events = this.__events) && (events = events[type]) && events[0] === suspend_fn)
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
    self.off = function (type, fn, global) {

        var events = this.__events,
            items;

        if (events)
        {
            if (!type)
            {
                for (var type in events)
                {
                    if (type.substring(0, 10) === '...global.')
                    {
                        this.off(type.substring(10), null, true);
                    }
                    else
                    {
                        this.off(type);
                    }
                }

                this.__events = null;
            }
            else if (global)
            {
                if ((events = events['...global.' + type]) && (items = global_events[type]))
                {
                    for (var i = items.length - 1; i >= 0; i--)
                    {
                        if (items[i--] === this)
                        {
                            if (!fn || fn === items[i])
                            {
                                items.splice(i, 2);
                                events--;
                            }
                        }
                    }

                    if (!items.length)
                    {
                        global_events[type] = null;
                    }
                }
            }
            else 
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
                if (fn = this['__event_off_' + type])
                {
                    fn.call(this);
                }
            }
        }

        return this;
    };

    
    //分发事件
    self.trigger = function (e) {

        var type = e.type || (e = arguments[0] = new flyingon.Event(e)).type,
            events = global_events[type],
            fn;

        e.target = this;

        //处理全局事件
        if (events)
        {
            for (var i = 0, _ = events.length; i < _; i++)
            {
                if ((fn = events[i++]) && !fn.disabled)
                {
                    if (fn.apply(events[i - 1], arguments) === false)
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

        //冒泡
        var target = this;

        while (target)
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

            target = target.__parent;
        }

        return !e.defaultPrevented;
    };


    
    //序列化方法
    self.serialize = function (writer) {

        var cache;
        
        if (cache = this.xtype)
        {
            writer.write_property('xtype', cache);
        }
        
        if (cache = this.__storage)
        {
            writer.write_properties(cache);
        }
        
        if (cache = this.__bindings)
        {
            writer.write_property('bindings', cache);
        }
    };
    
        
    //反序列化方法
    self.deserialize = function (reader, values) {

        var list = this.deserialize_list,
            fn;
        
        for (var name in values)
        {
            if (fn = list[name])
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
    self.deserialize_list.xtype = true;


            
    self.deserialize_list.bindings = function (reader, values) {

        for (var name in values)
        {
            deserialize_binding(this, reader, name, values[name]);
        }
    };
    
    
    //数据绑定类
    function Binding(target, name, source, expression, twoway) {

        var bindings = target.__bindings || (target.__bindings = {}),
            fields = this.fields = [],
            cache;
        
        this.target = target;
        this.name = name;
        this.source = source;

        //一个目标属性只能绑定一个
        if (cache = bindings[name])
        {
            cache.dispose(); 
        }

        //关联目标绑定
        bindings[name] = this;
        
        if (this.expression = expression)
        {
            //表达式, 只支持简单表达式, 不支持语句
            expression = expression.replace(regex_binding, function (text, name) {

                if (name)
                {
                    if (!fields[name])
                    {
                        fields[name] = true;
                        fields.push(name);
                    }

                    return 'source.get("' + name + '")';
                }

                cache = false; //表达式标记
                return text;
            });

            if (cache === false || !(this.expression = fields[0]))
            {
                twoway = false; //表达式不支持双向绑定
                this.get = new Function('source', 'return ' + expression);
            } 
        }
        else
        {
            (this.fields = {})[expression] = true;
        }

        this.twoway = twoway; //是否支持双向绑定 false:仅单向绑定
        
        if (fields.length)
        {
            (bindings = source.__to_bindings || (source.__to_bindings = [])).push(this);
        }
    };
    
        
    //反序列化数据绑定
    function deserialize_binding(target, reader, name, binding) {
        
        reader.read_reference(binding.source, function (source) {

            target.addBinding(name, source, binding.expression, binding.twoway);
        });
    };
    
    
    //序列化数据绑定
    Binding.prototype.serialize = function (writer) {
        
        writer.write_reference('source', this.source);
        
        if (this.expression)
        {
            writer.write_property('expression', this.expression);
        }
        
        if (this.twoway !== true)
        {
            writer.write_property('twoway', this.twoway);
        }
    };
    
    
    
    //同步数据绑定 从源对象同步数据至目标对象
    self.syncBinding = function (name, value) {
        
        var items = this.__to_bindings,
            item,
            cache;
        
        if (items)
        {
            for (var i = 0, _ = items.length; i < _; i++)
            {
                item = items[i];
                
                if (!name || item.fields[name])
                {
                    if (cache = item.get) //自定义表达式
                    {
                        cache = cache(item.source);
                    }
                    else if (value === void 0) //未指定值则计算
                    {
                        cache = item.source.get(item.expression);
                    }
                    else
                    {
                        cache = value;
                    }
                    
                    item.target.set(item.name, cache);
                }
            }
        }
        
        return this;
    };
    
    
    //添加数据绑定
    self.addBinding = function (name, source, expression, twoway) {
      
        if (name && source)
        {
            new Binding(this, name, source, expression, twoway !== false);
        }
        else
        {
            throw $errortext('flyingon', 'binding name')
        }
    };
    
    
    //移除数据绑定
    self.removeBinding = function (name, source) {
      
        var bindings = this.__bindings,
            binding;
        
        if (bindings && (binding = bindings[name]))
        {
            //解除目标绑定
            delete bindings[name];

            for (name in bindings)
            {
                name = true;
            }

            if (name !== true)
            {
                this.__bindings = null;
            }

            //解除源绑定
            if (source !== false && (bindings = (source = binding.source).__to_bindings))
            {
                for (var i = bindings.length - 1; i >= 0; i--)
                {
                    if (bindings[i] === binding)
                    {
                        bindings.splice(i, 1);
                        break;
                    }
                }

                if (!bindings.length)
                {
                    source.__to_bindings = null;
                }
            }

            binding.source = binding.target = binding.get = null;
        }
    };
    
    
    
    //以当前对象的参照复制生成新对象
    self.clone = function () {

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
    self.dispose = function () {

        var bindings = this.__bindings,
            cache;
        
        if (bindings)
        {
            for (cache in bindings)
            {
                this.removeBinding(cache);
            }
        }
        
        if (bindings = this.__to_bindings)
        {
            for (var i = bindings.length - 1; i >= 0; i--)
            {
                (cache = bindings[i]).target.removeBinding(cache.name, false);
            }
            
            bindings.length = 0;
            this.__to_bindings = null;
        }
        
        if (this.__events)
        {
            this.off();
        }
    };
    

});



//事件基类
$class('Event', function (self) {


    $constructor(function (type) {

        this.type = type;
    });


    //事件类型
    self.type = null;


    //触发事件目标对象
    self.target = null;


    //是否取消冒泡
    self.cancelBubble = false;

    
    //是否阻止默认动作
    self.defaultPrevented = false;


    //阻止事件冒泡
    self.stopPropagation = function () {

        this.cancelBubble = true;
    };


    //禁止默认事件
    self.preventDefault = function () {

        this.defaultPrevented = true;
    };


    //阻止事件冒泡及禁止默认事件
    self.stopImmediatePropagation = function () {

        this.cancelBubble = this.defaultPrevented = true;
    };


});


//读序列化类
$class('SerializeReader', function (self) {


    var class_list = flyingon.__class_list,
        Array = window.Array;
    

    self.deserialize = function (values) {

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


    self.read = function (value) {

        if (value && typeof value === 'object')
        {
            return value instanceof Array ? this.read_array(value) : this.read_object(value);
        }

        return value;
    };


    self.read_array = function (values) {

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


    self.read_object = function (values, type) {

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

    
    self.read_properties = function (target, values) {
      
        for (var name in values)
        {
            target[name] = this.read(values[name]);
        }
    };
    
    
    self.read_reference = function (name, callback) {
      
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
      
    
    self.__class_init = function (Class) {
    
        var reader = Class.instance = new Class();

        Class.deserialize = function (values) {

            return reader.deserialize(values);
        };
    };
    

});


//写序列化类
$class('SerializeWriter', function (self) {


    var Array = window.Array,
        object = Object.prototype;

    
    $static('serialize', function (target) {
    
        return new flyingon.SerializeWriter().serialize(target);
    });
    

    self.serialize = function (target) {

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


    self.write = function (value) {

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


    self.write_array = function (array) {

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


    self.write_object = function (target) {

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


    self.write_properties = function (values) {

        if (values)
        {
            var data = this.data,
                prototype = values.constructor,
                value;
            
            if (prototype && (prototype = prototype.prototype) && prototype === object)
            {
                prototype = null;
            }
            
            for (var name in values)
            {
                value = values[name];
                
                if (!prototype || value !== prototype[name])
                {
                    data.push('"' + name + '":');
                    this.write(value);
                }
            }
        }
    };
    
    
    self.write_property = function (name, value) {
      
        this.data.push('"' + name + '":');
        this.write(value);
    };
    
    
    self.write_reference = function (name, target) {
        
        if (name && target)
        {
            var id = target.id;
            
            if (!id || typeof id === 'function' && !(id = target.id()))
            {
                throw $errortext('serialize id').replace('{0}', target);
            }
            
            this.data.push('"' + name + '":');
            this.write(id);
        }
    };

    
        
    self.__class_init = function (Class) {
    
        var writer = Class.instance = new Class();

        Class.deserialize = function (target) {

            return writer.deserialize(target);
        };
    };
    

});



//异步处理接口
$class('Async', function (self) {



    //注册成功执行函数或成功执行通知
    self.done = function (fn) {

        return registry(this, fn, 1);
    };


    //注册执行失败函数或执行失败通知
    self.fail = function (fn) {

        return registry(this, fn, 2);
    };


    //注册执行结束函数
    self.always = function (fn) {

        return registry(this, fn, 3);
    };


    //注册执行进度函数
    self.progress = function (fn) {

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
    self.resolve = function (value) {

        return this.__change_to(1, arguments);
    };


    //失败执行通知
    self.reject = function (error) {

        return this.__change_to(2, arguments);
    };


    //执行进度通知
    self.notify = function (value) {

        return this.__change_to(8, arguments);
    };


    //切换状态
    //1: done
    //2: fail
    //4: error
    //7: always
    //8: progress
    self.__change_to = function (state, parameters) {

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
$class('Ajax', [Object, flyingon.Async], function (self) {



    var ajax_fn;


    //method
    self.method = 'GET';

    //text/plain || json || script || xml
    self.dataType = 'text/plain';

    //内容类型
    self.contentType = 'application/x-www-form-urlencoded';

    //自定义http头
    self.header = null;

    //是否异步
    self.async = true;

    //请求用户名
    self.user = void 0;

    //请求密码
    self.password = void 0;

    //超时时间
    self.timeout = 0;


    //发送请求
    $constructor(function (url, options) {

        var self = this,
            ajax = this.ajax = new (ajax_fn || ajax_init())(),
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

        ajax.onreadystatechange = function () {

            callback(self, this, url, options);
        };

        if (cache = this.method)
        {
            cache = cache.toUpperCase();
        }
        else
        {
            cache = 'GET';
        }

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

        ajax.open(this.method, url, this.async, this.user, this.password);

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


    function ajax_init() {

        var cache = window.XMLHttpRequest;

        if (cache)
        {
            return ajax_fn = function () { 

                return new cache(); 
            };
        }

        if (cache = window.ActiveXObject)
        {
            var items = ['MSXML2.XMLHTTP.4.0', 'MSXML2.XMLHTTP', 'Microsoft.XMLHTTP'];

            for (var i = 0, _ = items.length; i < _; i++)
            {
                try
                {
                    (ajax_fn = function () { 

                        return new cache(items[i]); 
                    })();

                    return ajax_fn;
                }
                catch (e)
                {
                }
            }
        }

        if (cache = window.createRequest)
        {
            return ajax_fn = cache;
        }
    };


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
                if ((cache = self.dataType).indexOf('json') >= 0)
                {
                    self.resolve(flyingon.parseJSON(ajax.responseText));
                }
                else if (cache.indexOf('script') >= 0)
                {
                    flyingon.globalEval(ajax.responseText); //全局执行js避免变量冲突
                    self.resolve(url);
                }
                else if (cache.indexOf('xml') >= 0)
                {
                    self.resolve(ajax.responseXML);
                }
                else
                {
                    self.resolve(ajax.responseText);
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


});


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


    
