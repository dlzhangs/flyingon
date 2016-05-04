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
var flyingon = window.flyingon = flyingon || {};



//flyingon核心实现
(function (window, document, flyingon) {



    //当前版本
    flyingon.version = '0.0.1.0';



    //扩展Object.create方法
    Object.create || (Object.create = (function () {

        function fn() { };

        return function (prototype) {

            if (prototype)
            {
                fn.prototype = prototype;
                return new fn();
            }

            return {};
        };

    })());


    //扩展Array.isArray方法
    Array.isArray || (Array.isArray = (function () {

        var toString = Object.prototype.toString;

        return function (target) {

            return target && toString.call(target) === '[object Array]';
        };

    })());


    //转换url为绝对路径
    flyingon.absoluteUrl = (function () {

        var dom = document.createElement('a');

        function fn(url) {

            dom.href = url || '';
            return dom.href;
        };

        return fn('') ? fn : (function () {

            var dom = document.createElement('div'),
                regex = /'/g;

            return function (url) {

                var value = url ? url.replace(regex, '%22') : 'x.html'; //有些浏览器不能正确解析空路径

                dom.innerHTML = '<a href=\'' + value + '\'></a>';
                value = dom.firstChild.href;

                return url ? value : value.substring(0, value.length - 6);
            };

        })();

    })();


    //获取正在执行的脚本文件路径
    flyingon.currentUrl = (function () {

        var cache = {},
            regex = /((?:http|https|file):\/\/.*?\/[^:]+)(?::\d+)?:\d+/;

        function script_url() {

            var scripts = document.scripts;

            for (var i = 0, _ = scripts.length; i < _; i++)
            {
                var dom = scripts[i];

                if (!dom.readyState || dom.readyState === 'interactive')
                {
                    return dom.src || dom.getAttribute('src', 4);
                }
            }
        };

        return function (path) {

            var url;

            try
            {
                cache.fn();
            }
            catch (e)
            {
                if ((url = e.fileName || e.sourceURL || e.stack || e.stacktrace) && (url = url.match(regex)))
                {
                    url = url[1];
                }
            }

            url = url || script_url() || location.href;

            return path ? url.substring(0, url.lastIndexOf('/') + 1) : url;
        };

    })();

    

    //依赖,名字空间及类
    var head = document.head || document.getElementsByTagName('head')[0],

        dom = document.createElement('div'), //清除节点用

        base_path = flyingon.absoluteUrl('/'), //网站主路径

        flyingon_path = flyingon.currentUrl(true), //flyingon.js文件路径

        include_path = flyingon_path, //引入资源起始目录

        include_version = '', //引入资源版本

        include_files = Object.create(null), //特殊指定的引入资源版本

        include_map = Object.create(null), //引入资源映射

        include_url = Object.create(null), //已加载的相对url资源列表

        include_list = [], //加载资源队列

        include_cache = include_list, //加载资源缓存队列

        include_sync = !-[1, ] || document.documentMode === 9 ? [] : false, //是否异步加载js, IE6789使用同步加载, 因为js的执行与onreadystatechange事件可能不一致

        theme_name = 'default', //当前皮肤名

        i18n_name = 'zh-CHS', //当前本地化名称

        i18n_files = Object.create(null), //加载的本地化信息文件集合

        i18n_list = Object.create(null), //本地化信息集合

        namespace_stack = [flyingon], //名字空间栈(处理名字空间嵌套用)

        namespace = flyingon, //当前名字空间

        regex_namespace = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/, //名字空间检测

        regex_class = /^[A-Z][A-Za-z0-9]*$/, //类名正则表式验证

        regex_property = /\W/, //属性名正则表达式验证

        IObject = {}, //IObject接口

        class_list = flyingon.__class_list = {}; //已注册类型集合



    //指定引入资源起始路径
    flyingon.include_path = function (path) {

        if (path === void 0)
        {
            return include_path;
        }

        if (path)
        {
            if (path.charAt(0) === '/')
            {
                include_path = flyingon.absoluteUrl(path);
            }
            else if (path.indexOf('://') > 0)
            {
                include_path = path;
            }
            else
            {
                include_path = flyingon.absoluteUrl(flyingon_path + path);
            }
        }
        else
        {
            include_path = flyingon_path;
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



    //加载引入资源
    function load_include() {

        var include = include_list,
            cache = include_cache,
            sync = include_sync,
            list = [],
            url;

        //抽出未发送过的url请求
        for (var i = 0, _ = cache.length; i < _; i++)
        {
            if (typeof (url = cache[i]) === 'string' && !include[url])
            {
                list.push(url);
            }
        }

        //重置缓存队列
        include_cache = [];

        //ie6789使用同步加载脚本
        if (sync)
        {
            sync.unshift.apply(sync, list);
            script_sync(sync);
        }
        else //异步加载脚本
        {
            for (var i = 0, _ = list.length; i < _; i++)
            {
                include[url = list[i]] = 1; //1: 待加载js  []: js已加载  true: js已完全执行
                create_script(url, script_load);
            }
        }
    };


    //同步执行脚本
    function script_sync(list) {

        if (list.length > 0 && list.load !== false)
        {
            var include = include_list,
                url = list.shift();

            if (include[url])
            {
                script_sync(list);
            }
            else
            {
                list.load = false;
                include[url] = 1; //1: 待加载js  []: js已加载  true: js已完全执行

                create_script(url, function (url) {

                    script_load(url);

                    list.load = true;
                    script_sync(list);
                });
            }
        }
    };


    //创建脚本标签
    function create_script(url, callback) {

        var dom = document.createElement('script');

        if (include_sync)
        {
            dom.onreadystatechange = function () {

                if ('loaded,complete'.indexOf(this.readyState) >= 0)
                {
                    callback(url)
                }
            };
        }
        else
        {
            dom.onload = function () {

                callback(url)
            };
        }

        dom.onerror = function () {

            callback(url)
        };

        //dom.async = false;
        dom.src = url;

        //标记本地化url
        dom.i18n = i18n_files[url];
 
        head.appendChild(dom);

        dom = null;
    };


    //脚本执行完毕
    function script_load(url) {

        var include = include_list,
            cache = include_cache;

        //如果资源中包含需引入的资源则继续加载
        if (cache.length > 0)
        {
            include[url] = cache; //标记js已加载但未完全执行
            load_include();
        }
        else
        {
            //标记已完全执行
            include[url] = true;

            //检测引入资源
            if (check_include(include, null, include))
            {
                include.length = 0;
                include_cache = include; //从头开始处理队列
            }
            else
            {
                //初始化缓存队列
                include_cache = [];
            }
        }
    };


    //检测引入资源队列
    function check_include(list, url, items) {

        var item, cache;

        for (var i = items.index || 0, _ = items.length; i < _; i++)
        {
            if (item = items[i])
            {
                if (item[0] === true) //wait
                {
                    item[1].apply(item[2], item[3]);
                }
                else if (item !== url && (cache = list[item]) !== true) //如果当前url未加载且未进行循环引用
                {
                    if (!cache || cache === 1 || check_include(list, item, cache) === false) //如果待加载或子项未加载则提前终止
                    {
                        if (i > 0)
                        {
                            items.splice(0, i);
                        }

                        return false;
                    }
                }
            }
        }

        if (url)
        {
            list[url] = true; //标记加载完毕
        }

        return true;
    };



    //引入js或css资源
    //url: /xxx:     相对网站根目录
    //url: xxx       相对flyingon.js目录
    //url: ./xxx:    相对flyingon.js目录
    //url: ../xxx:   相对flyingon.js的上级目录
    //url: xxx://xxx 绝对路径
    var $include = flyingon.$include = window.$include = function (url, css) {

        var src, cache;

        if (url && typeof url === 'string')
        {
            //替换当前语言及主题
            if (url.indexOf('{theme}') >= 0)
            {
                url = (src = url).replace('{theme}', theme_name);
            }
            else if (url.indexOf('{i18n}') >= 0)
            {
                url = (src = url).replace('{i18n}', i18n_name);
            }

            if (cache = include_url[url = include_map[url] || url])
            {
                url = cache;
            }
            else
            {
                //添加版本号
                if (cache = include_files[url] || include_version)
                {
                    cache = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'include-version=' + cache;
                }
                else
                {
                    cache = url;
                }

                //获取url绝对路径
                // '/xxx':     相对网站根目录
                // './xxx':    相对flyingon.js文件目录
                // 'xxx':      相对flyingon.js文件目录
                // '../xxx':   相对flyingon.js文件上级目录
                if (cache.charAt(0) === '/')
                {
                    cache = base_path + cache.substring(1);
                }
                else if (cache.indexOf('://') < 0)
                {
                    cache = flyingon.absoluteUrl(include_path + cache);
                }

                include_url[url] = url = cache;
            }

            //如果脚本已加载
            if (cache = include_list[url])
            {
                //如果js正在加载过程中则添加注册js
                if (cache !== true)
                {
                    include_cache.push(url);
                }
            }
            else if (css || (css === void 0 && url.indexOf('.css') > 0))
            {
                cache = document.createElement('link');

                cache.href = url;
                cache.rel = 'stylesheet';
                cache.type = 'text/css';
                cache.theme = src;

                head.appendChild(cache);

                //标记css加载完成
                include_list[url] = true;
            }
            else
            {
                //添加注册js
                include_cache.push(url);

                //注册本地化信息
                if (src)
                {
                    i18n_files[url] = src;
                }
            }
        }
    };


    //require函数
    flyingon.$require = window.$require = function (url, callback) {

        if (typeof url === 'function')
        {
            if (include_cache.length > 0)
            {
                callback = url;
            }
            else
            {
                url(flyingon);
                return;
            }
        }
        else if (typeof url === 'string')
        {
            $include(url);
        }
        else
        {
            for (var i = 0, _ = url.length; i < _; i++)
            {
                $include(url[i]);
            }
        }

        //添加回调
        if (typeof callback === 'function')
        {
            include_cache.push([true, callback, window, [flyingon]]);
        }

        //非模块中则立即引入资源
        if (include_cache === include_list)
        {
            load_include();
        }
    };



    //重新加载url
    function load_url(type) {

        //移除原来的样式节点
        var data = [],
            css = type === 'link',
            name1 = css ? 'theme' : 'i18n',
            name2 = css ? 'href' : null,
            list = document.getElementsByTagName(type),
            item,
            url;

        for (var i = list.length - 1; i >= 0; i--)
        {
            if (url = (item = list[i])[name1] || (name2 && item[name2]))
            {
                data.push(url);
                include_list[item.src || item.href] = null;

                dom.appendChild(item);
                dom.innerHTML = '';
            }
        }

        //重新引入文件
        for (var i = data.length - 1; i >= 0; i--)
        {
            $include(data[i], css);
        }

        load_include();
    };



    //获取指定key的本地化信息
    var $i18ntext = flyingon.$i18ntext = window.$i18ntext = function (key) {

        return i18n_list[key] || key;
    };



    //获取或设置当前本地化名称
    (flyingon.i18n = function (name, values) {

        if (name === void 0)
        {
            return i18n_name;
        }

        if (name && typeof name === 'object')
        {
            values = name;
            name = null;
        }

        if (values)
        {
            var list = i18n_list;

            if (name)
            {
                name += '.';

                for (var key in values)
                {
                    list[name + key] = values[key];
                }
            }
            else
            {
                for (var key in values)
                {
                    list[key] = values[key];
                }
            }
        }
        else if (i18n_name !== (name = name || 'zh-CHS'))
        {
            i18n_name = name;
            load_url('script');
        }

    }).all = function () { //获取所有本地化信息值

        return i18n_list;
    };


    //获取或设置当前皮肤
    flyingon.theme = function (name) {

        if (name === void 0)
        {
            return theme_name;
        }

        if (theme_name !== (name = name || 'default'))
        {
            theme_name = name;
            load_url('link');
        }
    };




    //默认名字空间名
    flyingon.name = 'flyingon';



    //定义或切换模块
    flyingon.$namespace = window.$namespace = function (name, callback) {

        var target, items, cache;

        //生成名字空间
        if (typeof name === 'string')
        {
            if (regex_namespace.test(name))
            {
                cache = namespace_stack.length;
                target = cache > 0 ? namespace_stack[cache - 1] : window;
                items = name.split('.');

                for (var i = 0, _ = items.length; i < _; i++)
                {
                    name = items[i];

                    if (cache = target[name])
                    {
                        target = cache;
                    }
                    else
                    {
                        cache = Object.create(null);
                        cache.name = target.name ? target.name + '.' + name : name;
                        target = target[name] = cache;
                    }
                }
            }
            else
            {
                alert('namespace name can use lowercase letters and numbers and begin with a lowercase letter, add use \'.\' to separated!');
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
            if (include_cache.length > 0)
            {
                include_cache.push([true, load_namespace, window, [target, callback]]);
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
            namespace = target;
            namespace_stack.push(target);

            callback.call(target, target, flyingon);
        }
        finally
        {
            namespace = namespace_stack.pop() || flyingon;
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




    //IObject接口, 所有使用$class定义的类都继承此接口
    (function (flyingon) {



        var global_events = flyingon.global_events = Object.create(null), //全局事件集合
            id = 1,
            last_attributes = {}; //上次使用的属性(如attributes传入'last-value'则使用上次传入的属性)



        //以下为定义属性方法实现
        //注1: 使用此方式定义属性时,以chrome中如果访问带特殊字符的变量(如:this.__name)时性能很差
        //注2: IE需IE9以上才全部支持defineProperty功能, IE8局部支持(仅可扩展dom对象,dom对象又不可以作为其它对象的原型,无法对IE8进行属性模拟)
        function get(name) {

            return function () {

                return this[name];
            };
        };

        function set(name) {

            return function () {

                alert('property \'' + name + '\' is read only!');
            };
        };

        try
        {
            Object.defineProperty(last_attributes, 'fn', {

                get: function () {

                    return true;
                }
            });
        }
        catch (e)
        {
        }

        if (last_attributes.fn)   //判断是否支持以Object.defineProperty方法创建属性
        {
            flyingon.defineProperty = function (target, name, attributes) {

                target['get_' + name] = attributes.get || get(name);
                target['set_' + name] = attributes.set || set(name);

                Object.defineProperty(target, name, attributes);
            };

            last_attributes = null;
        }
        else if (window.__defineGetter__) //判断是否支持以__defineGetter__及__defineSetter__方式创建属性
        {
            flyingon.defineProperty = function (target, name, attributes) {

                target.__defineGetter__(name, target['get_' + name] = attributes.get || get(name));
                target.__defineSetter__(name, target['set_' + name] = attributes.set || set(name));
            };
        }
        else //否则不支持属性,只支持以get_及set_的方式访问属性
        {
            flyingon.defineProperty = function (target, name, attributes) {

                target['get_' + name] = attributes.get || get(name);
                target['set_' + name] = attributes.set || set(name);
            };
        }


        //获取新id
        flyingon.newId = function () {

            return id++;
        };

        //获取当前对象唯一id
        flyingon.defineProperty(this, 'uniqueId', {

            get: function () {

                return this.__uniqueId || (this.__uniqueId = id++);
            }
        });



        //定义setter函数
        this.__define_setter = function (name, dataType, attributes) {

            var fields = attributes.fields,
                data = ['\n'],
                cache;

            //基本类型转换(根据默认值的类型自动转换)
            if (dataType !== 'object')
            {
                cache = 'value = ';

                switch (dataType)
                {
                    case 'boolean':
                        data.push('value = !!value;\n\n');
                        break;

                    case 'int':
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
            if (cache = attributes.check_code)
            {
                data.push(cache);
                data.push('\n\n');
            }

            //定义变量
            if (!fields)
            {
                data.push('var fields = this.__fields || (this.__fields = Object.create(this.__defaults));\n');
                fields = 'fields.' + name;
            }

            //变量
            data.push('var oldValue = ' + fields + ';\n\n');

            //对比新旧值
            data.push('if (oldValue !== value)\n');
            data.push('{\n\t');

            //赋值
            data.push(fields + ' = value;\n\n\t');

            //属性变更通知
            data.push('if (this.onpropertychange && this.onpropertychange("' + name + '", value, oldValue) === false)\n\t'
                + '{\n\t\t'
                    + fields + ' = oldValue;\n\t\t'
                    + 'return false;\n\t'
                + '}\n\n\t');

            //自定义值变更结束代码
            if (cache = attributes.set_code)
            {
                data.push(cache);
                data.push('\n\n\t');
            }

            //如果当前属性支持绑定
            if (attributes.binding)
            {
                data.push('this.__set_binding("' + name + '", value, oldValue);\n\n\t');
            }

            //闭合
            data.push('\n}\n\n');
            data.push('return this;\n');

            //动态创建函数
            return new Function('value', data.join(''));
        };

        //解析属性
        this.__parse_attributes = function (attributes) {

            if (!attributes)
            {
                return last_attributes = {};
            }

            if (attributes === 'last-value')
            {
                return last_attributes || (last_attributes = {});
            }

            var values;

            if (typeof attributes === 'string')
            {
                values = attributes.split('|');
                attributes = {};
            }
            else if (attributes.attributes)
            {
                values = attributes.attributes.split('|');
            }

            if (values)
            {
                for (var i = 0, _ = values.length; i < _; i++)
                {
                    attributes[values[i]] = true;
                }
            }

            return last_attributes = attributes;
        };


        //定义属性及set_XXX方法
        this.defineProperty = function (name, defaultValue, attributes) {

            if (name.match(regex_property))
            {
                throw 'property name is not legal!';
            }

            var dataType, cache;

            attributes = this.__parse_attributes(attributes);

            //根据默认值生成数据类型
            if ((dataType = typeof defaultValue) === 'number' && !('' + defaultValue).indexOf('.'))
            {
                dataType = 'int';
            }
            
            //设置默认值
            if (defaultValue !== void 0)
            {
                this.__defaults[name] = defaultValue;
            }

            //生成属性元数据
            this.__properties[name] = {

                dataType: dataType,
                defaultValue: defaultValue,
                group: attributes.group,
                editor: attributes.editor,
                minValue: attributes.minValue,
                maxValue: attributes.maxValue,
                validator: attributes.validator
            };

            //处理setter
            if (attributes.set === void 0 && !attributes.get)
            {
                attributes.set = this.__define_setter(name, dataType, attributes);
            }

            //处理getter
            if (attributes.get === void 0)
            {
                if (cache = attributes.fields)
                {
                    cache = 'var value = ' + cache + ';\n'
                        + 'return value !== void 0 ? value : this.__defaults.' + name + ';';
                }
                else
                {
                    cache = 'return (this.__fields || (this.__fields = Object.create(this.__defaults))).' + name + ';';
                }

                attributes.get = new Function(cache);
            }

            //创建属性
            flyingon.defineProperty(this, name, attributes);

            //扩展至选择器
            if (attributes.query && flyingon.Query)
            {
                flyingon.Query.prototype[name] = new Function('value', 'return this.value(' + name + ', value);');
            }

            return this;
        };


        //属性值变更回调方法
        this.onpropertychange = null;

        //获取或设置属性默认值
        this.defaultValue = function (name, value) {

            var defaults = this.__defaults;

            if (value === void 0)
            {
                return defaults[name];
            }

            defaults[name] = value;
            return this;
        };

        //批量设置属性值
        this.sets = function (values) {

            var fn;

            for (var name in values)
            {
                if (fn = this['set_' + name])
                {
                    fn.call(this, values[name]);
                }
                else
                {
                    this[name] = values[name];
                }
            }

            return this;
        };


        //获取属性值集合
        this.getProperties = function () {

            return this.__properties;
        };


        //绑定事件处理 注:type不带on
        //global: 是否全局事件
        this.on = function (type, listener, global) {

            if (type && typeof listener === 'function')
            {
                var events = this.__events || (this.__events = Object.create(null));

                if (global)
                {
                    var cache = '...global.' + type;

                    events[cache] = ++events[cache] || 1;

                    if (cache = global_events[type])
                    {
                        cache.push(listener, this);
                    }
                    else
                    {
                        global_events[type] = [listener, this];
                    }
                }
                else
                {
                    (events[type] || (events[type] = [])).push(listener);
                }
            }

            return this;
        };

        //移除事件处理
        this.off = function (type, listener, global) {

            var events = this.__events,
                items;

            if (events)
            {
                if (global)
                {
                    if ((events = events['...global.' + type]) && (items = global_events[type]))
                    {
                        for (var i = items.length - 1; i >= 0; i--)
                        {
                            if (items[i--] === this)
                            {
                                if (!listener || listener === items[i])
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
                else if (listener)
                {
                    if (events = events[type])
                    {
                        for (var i = events.length - 1; i >= 0; i--)
                        {
                            if (events[i] === listener)
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
            }

            return this;
        };

        //移除所有事件处理
        this.off_all = function () {

            var events = this.__events;

            if (events)
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
        };

        //分发事件
        this.trigger = function (e) {

            var type = e.type || (e = arguments[0] = new flyingon.Event(e)).type,
                events = global_events[type];

            e.target = this;

            //处理全局事件
            if (events)
            {
                for (var i = 0, _ = events.length; i < _; i++)
                {
                    if (events[i++].apply(events[i - 1], arguments) === false)
                    {
                        e.defaultPrevented = true;
                    }

                    if (e.cancelBubble)
                    {
                        return !e.defaultPrevented;
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
                        if (events[i].apply(target, arguments) === false)
                        {
                            e.defaultPrevented = true;
                        }

                        if (e.cancelBubble)
                        {
                            return !e.defaultPrevented;
                        }
                    }
                }

                target = target.__parent;
            }

            return !e.defaultPrevented;
        };


        //以当前对象的参照复制生成新对象
        this.clone = function () {

            var data = new this.Class(),
                fields1 = data.__fields,
                fields2 = this.__fields;

            for (var name in fields2)
            {
                fields1[name] = fields2[name];
            }

            return data;
        };


        this.dispose = function () {

            if (this.__events)
            {
                this.off_all();
            }
        };


    }).call(IObject, flyingon);




    //定义类方法
    //name:             类型名称,省略即创建匿名类型(匿名类型不支持自动反序列化)
    //superclass:       父类, 可传入基类或数组, 当传入数组时第一个子项可以为父类, 其它为接口类
    //fn:               类代码, 函数, 参数(prototype:类原型, base:父类, flyingon:系统对象)
    flyingon.$class = window.$class = function (name, superclass, fn) {


        if (namespace_stack.length <= 0)
        {
            alert('class can only be defined in the namespace!');
            return;
        }


        var Class, base, prototype, constructor_list, static_list, property, length, cache,
            global = window,
            $constructor = global.$constructor,
            $static = global.$static,
            $instance = global.$instance;


        //处理参数
        if (typeof name !== 'string') //不传name则创建匿名类
        {
            fn = superclass;
            superclass = name;
            name = null;
        }
        else if (!regex_class.test(name))
        {
            alert('class name can use only letters and numbers and begin with a upper letter!');
            return;
        }

        if (!fn && (fn = superclass))
        {
            superclass = null;
        }

        if (typeof fn !== 'function')
        {
            alert('class fn must be a function!');
            return;
        }


        //如果父类为数组则第一个为父类, 其它则为接口, 接口使用复制型继承, 只能继承原型上的非属性成员
        if (superclass && Array.isArray(superclass))
        {
            cache = superclass;
            superclass = superclass[0];
        }


        //创建原型
        if (superclass)
        {
            base = superclass.prototype;

            if (constructor_list = superclass.__constructor_list)
            {
                constructor_list = constructor_list.slice(0);
            }
        }
        else
        {
            base = IObject;
        }

        prototype = Object.create(base);


        //扩展接口
        if (cache)
        {
            superclass_extend(cache, prototype);
        }


        //默认值
        prototype.__defaults = Object.create(base.__defaults || null);

        //属性值集合
        prototype.__properties = Object.create(base.__properties || null);

        //定义类型检测方法
        prototype.is = is;

        //定义默认toString方法
        prototype.toString = toString;


        try
        {

            //开放定义构造函数的方法
            global.$constructor = function (fn, replace) {

                if (typeof fn === 'function')
                {
                    if ((fn.__constructor_replace = replace) || !constructor_list)  //直接使用构造函数作为类
                    {
                        (Class = fn).__constructor_list = [fn];
                    }
                    else
                    {
                        constructor_list.push(fn);
                    }
                }
            };

            //开放定义静态成员的方法
            global.$static = function (name, value, property) {

                (static_list || (static_list = [])).push(property, name, value);
            };

            //开放定义对象成员的方法
            global.$instance = function (name, value, attributes) {

                if (attributes)
                {
                    prototype.defineProperty(name, value, attributes === true ? null : attributes);
                }
                else
                {
                    prototype[name] = value;
                }
            };


            //执行扩展
            fn.call(prototype, base, flyingon);


            //如果未创建类
            if (!Class)
            {
                if (constructor_list && (length = constructor_list.length))
                {
                    //动态创建类
                    cache = ['Class = function ('];
                    cache.push(constructor_arguments(constructor_list));
                    cache.push(') {\n');

                    if (length === 1)
                    {
                        fn = constructor_list[length - 1];
                        cache.push('fn.apply(this, arguments);\n');
                    }
                    else
                    {
                        cache.push('var list = constructor_list;\n');

                        for (var i = 0; i < length; i++)
                        {
                            cache.push('list[' + i + '].apply(this, arguments);\n');
                        }
                    }

                    cache.push('};');

                    eval(cache.join(''));

                    Class.__constructor_list = constructor_list;
                }
                else
                {
                    Class = function () { };
                }
            }
        }
        finally
        {
            //回滚全局变量
            global.$constructor = $constructor;
            global.$static = $static;
            global.$instance = $instance;
        }


        //初始化静态成员
        if (static_list && (length = static_list.length))
        {
            for (var i = 0; i < length; i++)
            {
                if (static_list[i++])
                {
                    flyingon.defineProperty(Class, static_list[i++], static_list[i]);
                }
                else
                {
                    Class[static_list[i++]] = static_list[i];
                }
            }
        }


        //类原型
        Class.prototype = prototype;

        //所属名字空间
        Class.namespace = cache = namespace;

        //父类
        Class.superclass = superclass;

        //父类原型
        Class.base = base;

        //判断指定的对象是否当前类的实例
        Class.isInstanceOf = isInstanceOf;

        //绑定类型
        prototype.Class = prototype.constructor = Class;

        //注册类型(匿名类不注册)
        if (name)
        {
            //类名
            Class.typeName = name;

            //类全名
            Class.xtype = prototype.xtype = cache.name + '.' + name;

            //输出及注册类
            cache[name] = class_list[prototype.xtype] = Class;
        }


        if (cache = prototype.__class_init)
        {
            cache.call(prototype, Class);
        }


        //返回当前类型
        return Class;
    };


    //扩展接口类
    function superclass_extend(superclass_list, prototype) {

        var item, cache;

        for (var i = 1, _ = superclass_list.length; i < _; i++)
        {
            if (item = superclass_list[i])
            {
                if (cache = item.prototype)
                {
                    for (var name in cache)
                    {
                        prototype[name] = cache[name];
                    }
                }

                if (cache = item.xtype)
                {
                    prototype[cache] = true;
                }
            }
        }
    };


    //获取构造函数参数
    function constructor_arguments(list) {

        var index = list.length - 1,
            fn = list[index--];

        if (index >= 0 && list[index].length > fn.length)
        {
            fn = list[index];
        }

        return fn.length > 0 ? fn.__arguments || (fn.__arguments = (fn = '' + fn).substring(fn.indexOf('(') + 1, fn.indexOf(')'))) : '';
    };


    //检测当前对象是否指定类型
    function is(type) {

        return type && (this instanceof type || ((type = type.xtype) && this[type]));
    };


    //默认toString方法
    function toString() {

        return '[object ' + this.xtype + ']';
    };


    //判断指定对象是否当前类的实例
    function isInstanceOf(target) {

        return target && (target instanceof this || target[this.xtype]);
    };



    //事件类型基类
    $class('Event', function () {


        $constructor(function (type) {

            this.type = type;
        });


        //是否取消冒泡
        this.cancelBubble = false;

        //是否阻止默认动作
        this.defaultPrevented = false;


        //事件类型
        this.type = null;


        //触发事件目标对象
        this.target = null;



        //阻止事件冒泡
        this.stopPropagation = function () {

            this.cancelBubble = true;
        };


        //禁止默认事件
        this.preventDefault = function () {

            this.defaultPrevented = true;
        };


        //阻止事件冒泡及禁止默认事件
        this.stopImmediatePropagation = function () {

            this.cancelBubble = true;
            this.defaultPrevented = true;
        };


    });



    //清空名字空间栈
    namespace_stack.pop();




})(window, document, flyingon);



//dom扩展
(function (flyingon) {


    var events = flyingon.dom_events = Object.create(null), //dom事件集合
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

                e.preventDefault = preventDefault;
                e.stopPropagation = stopPropagation;
                e.stopImmediatePropagation = stopImmediatePropagation;

                return e;
            };

        })();
    }


    function trigger(dom, key, e) {

        var data, items;

        if ((data = events[key]) && (items = data[e.type]))
        {
            if (!(e = e || fixed(window.event)).target)
            {
                e.target = e.srcElement;
            }

            for (var i = 0, _ = items.length; i < _; i++)
            {
                items[i].call(dom, e);
            }
        }
    };


    //只执行一次绑定的事件
    flyingon.once = function (dom, type, fn) {

        function callback() {

            fn.apply(this, arguments);
            flyingon.dom_off(dom, type, callback);
        };

        flyingon.dom_on(dom, type, callback);
    };


    //添加dom事件绑定
    flyingon.on = function (dom, type, fn) {

        var key = dom['flyingon-id'] || (dom['flyingon-id'] = flyingon.newId()),
            data = events[key] || (events[key] = Object.create(null)),
            items = data[type],
            handler;

        if (items)
        {
            items.push(fn);
        }
        else
        {
            items = data[type] = [fn];

            dom[on](prefix + type, handler = items.handler = function (e) {

                trigger(handler.dom, key, e);
            });

            handler.dom = dom;

            //防止IE内存泄露
            data = items = dom = fn = null;
        }
    };


    //移除dom事件绑定
    flyingon.off = function (dom, type, fn) {

        var cache = events,
            key = dom['flyingon-id'],
            data = cache[key],
            items;

        if (data && (items = data[type]))
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
            delete data[type];

            for (var name in data)
            {
                return;
            }

            delete cache[key];
        }
    };


    //清除所有的dom事件
    flyingon.off_all = function () {

        var cache = events,
            data,
            items,
            handler;

        for (var key in cache)
        {
            if (data = cache[key])
            {
                for (var type in data)
                {
                    if ((items = data[type]) && (handler = items.handler))
                    {
                        handler.dom[off](prefix + type, handler);

                        items.length = 0;
                        data[type] = items.handler = items.handler.dom = null;
                    }
                }
            }

            cache[key] = null;
        }

        flyingon.dom_events = events = Object.create(null);
    };



})(flyingon);

