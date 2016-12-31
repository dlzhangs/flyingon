//资源加载
(function (window, flyingon) {



    var create = flyingon.create,
    
        base_path = flyingon.absoluteUrl('/'), //网站主路径

        flyingon_path, //flyingon路径, flyingon所在目录或flyingon.js文件所在目录

        require_base, //引入资源起始目录

        require_version = '', //引入资源版本

        version_files = create(null), //特殊指定的引入资源版本

        path_map = create(null), //相对地址对应绝对地址映射关系

        require_sync, //是否使用同步script模式加载资源
        
        require_ajax = flyingon.ie9, //是否ajax加载js, IE6789不支持script异步加载, 因为js的执行与加载完毕事件不是一一对应

        require_keys = { //引入资源变量
            
            layout: 'default', //当前布局
            skin: 'default', //当前皮肤
            i18n: navigator.language || 'zh-CN'    //当前本地化名称
        },
        
        require_merge = create(null), //引入资源合并关系

        require_files = create(null), //所有资源文件集合加载状态 0:未加载 1:已请求 2:已响应 3:已执行

        require_back = create(null), //资源回溯关系
        
        require_wait = 0, //等待加载的请求数
        
        require_list = [], //当前要加载的资源集合
        
        sync_list = [], //同步资源队列
        
        change_files = {}, //待切换资源文件集合

        i18n_map = create(null), //本地化信息集合
        
        translate_map = create(null); //已翻译资源文件集合        

    
                    
    
    //实始化起始路径
    flyingon_path = require_base = (function () {
        
        var list = document.scripts,
            regex = /flyingon(?:-core)?(?:\.min)?\.js/;
        
        for (var i = list.length - 1; i >= 0; i--)
        {
            var path = flyingon.absoluteUrl(list[i].src), //注：ie7以下的src不会转成绝对路径
                index = path.search(regex);
            
            if (index >= 0)
            {
                return path.substring(0, index).replace(/flyingon\/js\/$/, '');
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

        if (!url)
        {
            return;
        }
        
        var files = require_files,
            back = require_back,
            items = typeof url === 'string' ? [url] : url,
            file,
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

        for (var i = 0, l = items.length; i < l; i++)
        {
            if ((url = items[i]) && (value = files[file = $require.path(url)]) !== 3)
            {
                //样式
                if (css === true || (css !== false && url.indexOf(css || '.css') >= 0))
                {
                    if (!value)
                    {
                        //标记css文件已经加载
                        files[file] = 3; 

                        //创建link标签加载样式
                        flyingon.link(file);
                    }
                }
                else if (!list[file])
                {
                    //去重处理
                    list[file] = true;

                    //添加进资源列表
                    list.push(file);
                    
                    //增加待请求数量
                    if (!value && !back[file])
                    {
                        require_wait++;
                    }

                    //设置回溯关系
                    (back[file] || (back[file] = [])).push(list);
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
                load_script(list);
            }
            else //已经加载完成则直接执行回调
            {
                callback(flyingon);
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
    $require.version = function (version, files) {

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
            var target = version_files;
            
            for (var name in files)
            {
                target[name] = files[name];
            }
        }
    };


    //指定引入资源合并关系
    $require.merge = function (values) {

        if (values)
        {
            var target = require_merge,
                value;
            
            for (var name in values)
            {
                if (typeof (value = values[name]) === 'string')
                {
                    target[value] = name;
                }
                else
                {
                    for (var i = 0, l = value.length; i < l; i++)
                    {
                        target[value[i]] = name;
                    }
                }
            }
        }
    };
    
        
    //转换相对地址为绝对地址
    $require.path = function (url, change) {

        var file = url = require_merge[url] || url,
            name,
            index,
            cache;

        //如果已经缓存则直接返回
        if (cache = path_map[file])
        {
            return cache;
        }

        //替换当前语言及主题
        if ((index = url.indexOf('{')) >= 0 && 
            (cache = url.indexOf('}')) > index &&
            (name = url.substring(index + 1, cache)) &&
            (cache = require_keys[name]))
        {
            file = url.replace('{' + name + '}', cache);
            
            if (cache = path_map[file])
            {
                return cache;
            }
        }
        else
        {
            change = false;
        }

        //添加版本号
        if (cache = version_files[url] || require_version)
        {
            cache = file + (url.indexOf('?') >= 0 ? '&' : '?') + 'require-version=' + cache;
        }
        else
        {
            cache = file;
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

        return path_map[file] = cache;
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
    function load_script(list) {

        //乱序加载测试
        //list.sort(function(a, b) { return Math.random() > 0.5 ? -1 : 1; });

        //调试模式使用同步script方式加载资源
        if (require_sync)
        {
            registry_sync(list.reverse()); //倒序加入队列
        }
        else if (require_ajax) //使用ajax加载资源
        {
            load_ajax(list);
        }
        else //异步加载脚本
        {
            load_async(list);
        }
    };

    
    //使用ajax的方式加载资源
    function load_ajax(list) {
                        
        var files = require_files,
            file;

        for (var i = 0, length = list.length; i < length; i++)
        {
            if (!files[file = list[i]])
            {
                //标记已发送请求
                files[file] = 1;
                
                //不跨域
                if (file.indexOf(base_path) === 0)
                {
                    //发出请求
                    flyingon.ajax(file).complete(ajax_done);
                }
                else //跨域使用script同步加载
                {
                    if (++i < length)
                    {
                        list.splice(0, i);

                        //注册同步加载
                        return registry_sync([file, function () {
                            
                            load_ajax(list);
                        }]);
                    }
                    
                    //最后一个则不需要回调
                    return registry_sync([file]);
                }
            }
        }
    };
    
        
    //ajax调用完毕处理
    function ajax_done(text, error) {
        
        if (text)
        {
            flyingon.globalEval(text);
        }
        
        load_done(this.url);
        
        if (error)
        {
            throw error;
        }
    };
    
    
    
    //注册同步资源队列
    function registry_sync(list) {
      
        var sync = sync_list;
        
        sync.push.apply(sync, list);
                
        //如果消息队列没有启用则立即启动
        if (!sync.load)
        {
            load_sync();
        }
    };
    
    
    //同步加载脚本
    function load_sync() {

        var list = sync_list,
            fn = load_sync;
        
        if (!fn.load && list.length > 0)
        {
            var files = require_files,
                file = list.pop(),
                callback = fn;

            if (typeof file === 'function')
            {
                callback = file;
                file = list.pop();
            }
            
            if (files[file])
            {
                callback();
            }
            else
            {
                //标记正在加载防止重复执行
                fn.load = true;
            
                //标记已发送请求
                files[file] = 1;
                
                //创建加载脚本标签
                flyingon.script(file, function (file) {

                    load_done(file);
                    
                    fn.load = false; //标记加载结束
                    callback();
                });
            }
        }
    };
    
        
    //异步加载脚本
    function load_async(list) {
        
        var files = require_files,
            file;
        
        for (var i = 0, l = list.length; i < l; i++)
        {
            if (!files[file = list[i]])
            {
                //标记已发送请求
                files[file] = 1;
                
                //创建加载脚本标签
                flyingon.script(file, load_done);
            }
        }
    };    

    
    //脚本加载完毕后处理
    function load_done(file) {

        var files = require_files,
            back = require_back,
            list = require_list,
            wait = --require_wait; //同步待请求的数量
        
        //移除自身引用
        list.remove(file);
        
        //如果资源中包含需引入的资源则继续加载
        if (list.length > 0)
        {
            //初始化当前引入对象
            require_list = [];
            
            //标记请求已响应未执行
            files[file] = 2;
            
            //设置回溯父地址
            list.file = file;

            //继续加载资源
            load_script(list);
        }
        else
        {
            //标记请求已执行
            files[file] = 3;
            
            //回溯检测
            check_back(files, back, file);
        }
        
        //如果没有待发送的请求则表示有循环引用
        if (!wait)
        {
            check_cycle(files, back);
        }
    };
    
    
    //回溯检测引入的资源是否已加载完成
    function check_back(files, back, file) {
      
        var items = back[file],
            list,
            parent,
            cache;

        //处理完毕则移除回溯关系
        delete back[file];

        if (!items)
        {
            return;
        }
        
        //循环检测
        for (var i = items.length - 1; i >= 0; i--)
        {
            (list = items[i]).remove(file);

            if (list.length > 0)
            {
                continue;
            }

            //移除当前项
            items.splice(i, 1);

            //如果有回溯
            if (cache = list.file)
            {
                //标记请求已执行
                files[cache] = 3;

                //添加回溯
                (parent || (parent = [])).push(cache);
            }
            
            //执行回调
            if (cache = list.callback)
            {
                list.callback = null;
                
                for (var j = 0, l = cache.length; j < l; j++)
                {
                    cache[j++].apply(window, cache[j]);
                }
            }
        }

        //继续向上回溯检测
        if (parent)
        {
            for (var i = 0, l = parent.length; i < l; i++)
            {
                check_back(files, back, parent[i]);
            }
        }
    };
    
    
    //检测循环引用, 如果存在则打破(最先移除最后发起的请求)
    function check_cycle(files, back) {
        
        var names = [],
            file,
            list;
        
        for (file in back)
        {
            names.push(file);
        }
        
        for (var i = names.length - 1; i >= 0; i--)
        {
            if ((list = back[file = names[i]]) && has_cycle(back, list, file))
            {
                //移除循环引用
                for (var j = i; j >= 0; j--)
                {
                    list = back[names[j]];
                    
                    if (!list)
                    {
                        continue;
                    }
                    
                    for (var k = list.length - 1; k >= 0; k--)
                    {
                        if (list[k] && list[k].file === file)
                        {
                            check_back(files, back, file);
                            break;
                        }
                    }
                }
            }
        }
    };
    
    
    //检测是否存在循环引用
    function has_cycle(back, items, file) {
        
        var list, name;
        
        for (var i = items.length - 1; i >= 0; i--)
        {
            if ((list = items[i]) && (name = list.file))
            {
                if (name === file)
                {
                    return true;
                }
                
                if ((list = back[name]) && has_cycle(back, list, file))
                {
                    return true;
                }
            }
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
        
        var files = require_files,
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
        
        for (cache in data)
        {
            if (files[cache] === true)
            {
                //移除缓存
                files[cache] = 0;
                
                //重新加载资源
                list.push(data[cache]);
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
            i18n_map = create(null);
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
    
    
    
    //重写抛出异常方法
    flyingon.raise = function (type, key) {
    
        throw $translate(type, key);
    };
    
        
    
    //输出外部接口
    //分开赋值解决chrome调试时类名过长的问题
    window.$require = $require;
    window.$i18nlist = $i18nlist;
    window.$i18ntext = $i18ntext;
    window.$translate = $translate;

    

})(window, flyingon);


    
