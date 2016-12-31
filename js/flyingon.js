/*
* flyingon javascript library v0.0.1.0
* https://github.com/freeoasoft/flyingon
*
* Copyright 2014, yaozhengyang
* licensed under the LGPL Version 3 licenses
*/



//启用严格模式
'use strict';



//基础api扩展
(function (global) {
    


    //定义全局flyingon变量
    var flyingon = global.flyingon || (global.flyingon = {});
    
        
    
    //版本号
    flyingon.version = '1.0.1';
    
    

    //移除指定项
    Array.prototype.remove = function (item) {

        for (var i = 0, l = this.length; i < l; i++)
        {
            if (this[i] === item)
            {
                this.splice(i, 1);
                return true;
            }
        }
    };


    //转换数据为键值对
    Array.prototype.pair = function (value) {

        var target = {};

        for (var i = 0, l = this.length; i < l; i++)
        {
            target[this[i]] = value;
        }

        return target;
    };
    


    //缓存Object.prototype.toString方法
    var toString = Object.prototype.toString;
    
    
    //空函数
    function fn() {}
        
    
    //检测对象是否一个数组
    flyingon.isArray = Array.isArray || function (target) {

        return toString.call(target) === '[object Array]';
    };;
    

    //以指定原型创建对象
    flyingon.create = Object.create || function (prototype) {

        if (prototype)
        {
            fn.prototype = prototype;
            return new fn();
        }

        return {};
    };


    //复制源对象成员至目标对象
    flyingon.extend = function extend(target, source, deep) {

        var index = arguments.length - 1;
            
        target = target || {};
        
        if (arguments[index] === true)
        {
            deep = true;
            index--;
        }

        while (index > 0 && (source = arguments[index--]))
        {
            if (deep)
            {
                for (var name in source)
                {
                    var value = source[name];
                    
                    if (value && typeof value === 'object')
                    {
                        target[name] = extend(target[name], value, true);
                    }
                    else
                    {
                        target[name] = value;
                    }
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
        

    //循环处理
    flyingon.each = function (values, fn, context) {

        if (values)
        {
            context = context || global;

            if (typeof values === 'string')
            {
                values = values.match(/\w+/g);
            }

            for (var i = 0, l = values.length; i < l; i++)
            {
                fn.call(context, values[i], i);
            }
        }
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
                        for (var i = 0, l = value.length; i < l; i++)
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
    
    
    //抛出异常方法
    flyingon.raise = function (type, key) {
    
        throw '[' + type + ']' + key;
    };

    
    
})(typeof global === 'undefined' ? window : global);




//名字空间,类,属性及事件
(function (global, flyingon) {
    

    
    var has = {}.hasOwnProperty,
        
        create = flyingon.create,
        
        extend = flyingon.extend,
    
        anonymous = 1,
        
        namespace_stack = [], //名字空间栈
    
        class_list = flyingon.__class_list || (flyingon.__class_list = create(null)), //已注册类型集合,需防重复加载

        class_stack = [],  //类栈(支持类的内部定义类)
        
        class_data; //当前类定义信息(支持类的内部定义类)


    
    
    //名字空间
    flyingon.namespaceName = 'flyingon';

                
    //注册或获取注册的类型
    flyingon.registryClass = function (xtype, Class) {

        if (Class)
        {
            class_list[xtype || Class.xtype] = Class;
        }
        else
        {
            return xtype ? class_list : class_list[xtype];
        }
    };
    
    
    
    //定义或切换名字空间
    function $namespace(name, callback) {

        var target, items, cache;

        //生成名字空间
        switch (typeof name)
        {
            case 'string':
                if (/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/.test(name))
                {
                    cache = namespace_stack;
                    target = cache.length > 0 ? cache[cache.length - 1] : global;

                    items = name.split('.');

                    for (var i = 0, l = items.length; i < l; i++)
                    {
                        if (!(cache = target[name = items[i]]))
                        {
                            cache = target[name] = create(null);
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
                    flyingon.raise('flyingon', 'namespace_name_error');
                }
                break;
                
            case 'function':
                target = flyingon;
                callback = name;
                break;
                
            default:
                target = name || flyingon;
                break;
        }

        //处理回调
        if (typeof callback === 'function')
        {
            //如果正在动态加载脚本或还有依赖的js没有加载完成则先注册 否则立即执行
            if (!(cache = global.$require) || 
                !(cache = cache.callback) || 
                !cache(load_namespace, [target, callback]))
            {
                load_namespace(target, callback);
            }
        }
        else
        {
            namespace_stack.push($namespace.current = target);
        }
    };
    
    
    //结束当前名字空间
    $namespace.end = function () {
        
        var stack = namespace_stack;
        
        stack.pop();
        $namespace.current = stack[stack.length - 1] || flyingon;
    };


    //执行名字空间函数
    function load_namespace(target, callback) {

        try
        {
            //记录当前名字空间
            namespace_stack.push($namespace.current = target);
            callback.call(target, target, flyingon);
        }
        finally
        {
            $namespace.end();
        }
    };

    
    
    //定义片段方法
    function $fragment(name, fn, property) {
        
        if (typeof name === 'function')
        {
            property = fn;
            fn = name;
            name = null;
        }
        else if (!/^[A-Z][A-Za-z0-9]*$/.test(name))
        {
            flyingon.raise('flyingon', 'fragment_name_error');
        }
        
        var prototype = create(null),
            cache;
        
        if (property)
        {
            prototype.defineProperty = defineProperty;
        }
        
        fn.call(prototype);
        
        fn = function (target) {
          
            if (!target)
            {
                flyingon.raise('flyingon', 'fragment_target_error');
            }
            
            extend_prototype(target, prototype);
        };
      
        fn.prototype = prototype;
   
        if (name)
        {
            cache = $namespace.current || flyingon;
            cache[name] = fn;
            cache = cache.namespaceName + '.' + name;
        }
        else
        {
            cache = 'anonymous-type-' + anonymous++;
        }
        
        //类型标记
        prototype[fn.xtype = cache] = true;
        return fn;
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
            flyingon.raise('flyingon', '$constructor_not_in_class');
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
            flyingon.raise('flyingon', '$static_not_in_class');
        }
    };
    
    

    //定义类方法
    //name:             类名称,省略即创建匿名类型(匿名类型不支持自动反序列化)
    //superclass:       父类, 可传入基类或数组, 当传入数组时第一个子项为父类, 其它为片段, 片段只会复制其原型上的方法
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
        else if (!/^[A-Z][A-Za-z0-9]*$/.test(name))
        {
            flyingon.raise('flyingon', 'class_name_error');
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
                flyingon.raise('flyingon', 'class_fn_error');
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
        prototype = create(base = superclass.prototype || Object.prototype);

        //设置base属性
        prototype.base = base;

        
        //判读是否非支持属性
        if ((cache = base.__defaults) || property === true || (property !== false && cache !== false))
        {
            //生成默认值集合
            prototype.__defaults = create(cache || null);

            //生成属性集合
            prototype.__properties = create(base.__properties || null);
            
            //创建一级类则生成属性事件相关方法
            if (!cache)
            {
                prototype.defineProperty = defineProperty;
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
        
        
        //扩展片段
        if (list && list.length > 1)
        {
            extend_class(prototype, list);
        }
        
    
        //获取当前名字空间
        namespace = $namespace.current || flyingon;

        //xtype
        cache = name ? namespace.namespaceName + '.' + name : 'anonymous-type-' + anonymous++;
        
        //类型标记
        prototype[cache] = true;
        
        
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

     
        //注册类型(匿名类不注册)
        if (name)
        {
            //类名
            Class.typeName = name;

            //类全名
            prototype.xtype = cache;
        
            //输出及注册类
            namespace[name] = class_list[cache] = Class;
        }
        
        
        //类全名
        Class.xtype = cache;
        
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
   

        //初始化类
        if (cache = prototype.__class_init)
        {
            cache.call(prototype, Class, base, prototype);
        }
        

        //返回当前类型
        return Class;
    };

    

    //扩展片段
    function extend_class(prototype, list) {
        
        var target;
        
        for (var i = 1, l = list.length; i < l; i++)
        {
            if (target = list[i])
            {
                extend_prototype(prototype, target.prototype || target);
            }
        }
    };
                        
           
    //扩展原型
    function extend_prototype(prototype, target) {
        
        for (var name in target)
        {
            switch (name)
            {
                case '__defaults': //默认值
                case '__properties': //属性集
                    extend(prototype[name] || (prototype[name] = create(null)), target[name]);
                    break;

                default:
                    prototype[name] = target[name];
                    break;
            }
        }
    };
    
    
    //处理类静态成员
    function class_static(Class, list) {
        
        for (var i = 0, l = list.length; i < l; i++)
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
            fn = (fn = '' + fn).substring(fn.indexOf('(') + 1, fn.indexOf(')'));
            
            Class = ['var items = this.Class.__constructor_list;\n'];

            for (var i = 0; i < length; i++)
            {
                Class.push('items[' + i + '].apply(this, arguments);\n')
            }
            
            Class = new Function(fn, Class.join(''));
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

        if (/\W/.test(name))
        {
            flyingon.raise('flyingon', 'property_name_error').replace('{0}', name);
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
        
        (this.__defaults || (this.__defaults = create(null)))[name] = attributes.defaultValue;
        (this.__properties|| (this.__properties = create(null)))[name] = attributes;

        //如未直接设置函数则创建按需加载属性以提升初始化性能
        this[name] = attributes.fn || function (value, trigger) {

            var target = property_target(this, name),
                fn = attributes.fn || property_fn(this, attributes);

            return (target[name] = fn).apply(this, arguments);
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
    function property_fn(self, attributes) {
        
        var name = attributes.name,
            dataType = attributes.dataType,
            storage = attributes.storage,
            bind = self.__set_bind && attributes.bind !== false,
            oldValue = storage ? storage + ' || this.__defaults.' : '(this.__storage || this.__defaults).',
            data,
            cache;

        //读取值
        data = ['if (value === void 0)\n',
            '{\n\t',
                'return ', oldValue, name, ';\n',
            '}\n\n'];
        
        //数据绑定处理
        bind && data.push('if (typeof value === "string" && value', 
            '1'[0] ? '[0] === "{"' : '.charAt(0) === "{"', 
            ' && this.__set_bind("', name, '", value) !== false)\n',
            '{\n\t',
                  'return this;\n',
            '}\n\n');

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
            data.push('if (value < ', cache, ') value = ', cache, ';\n\n');
        }

        //最大值限定(大于指定值则自动转为指定值)
        if ((cache = attributes.maxValue) != null)
        {
            data.push('if (value > ', cache, ') value = ', cache, ';\n\n');
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
        data.push('var oldValue = ', oldValue, name, ';\n\n',
                  'if (oldValue !== value)\n', 
            '{\n\t');
                  
        if (!storage)
        {
            storage = 'storage.' + name;
            data.push('var storage = this.__storage || (this.__storage = flyingon.create(this.__defaults));\n\n\t');
        }

        //赋值及属性变更通知
        data.push(storage, ' = value;\n\n\t',
            'if (trigger !== false)\n\t',
            '{\n\t\t',
                'if ((trigger = flyingon.onpropertychange) && trigger(this, "', name, '", value, oldValue) === false)\n\t\t',
                '{\n\t\t\t',
                    storage, ' = oldValue;\n\t\t\t',
                    'return this;\n\t\t',
                '}\n\n\t\t',
                'if ((trigger = this.onpropertychange) && trigger.call(this, "', name, '", value, oldValue) === false)\n\t\t',
                '{\n\t\t\t',
                    storage, ' = oldValue;\n\t\t\t',
                    'return this;\n\t\t',
                '}\n\t',
            '}');
        
        //绑定回推数据至数据集
        if (bind)
        {
            data.push('\n\n\t', 'if (bind) this.pushBack("', name, '", value);\n\t');
        }
        
        //自定义值变更结束代码
        if (cache = attributes.set)
        {
            if (typeof cache === 'function')
            {
                cache = '' + cache;
                cache = cache.substring(cache.indexOf('{') + 1, cache.lastIndexOf('}'));
            }
         
            data.push('\n\n\t', cache);
        }
        
        //自定义值设置
        if (cache = self.__defineProperty_set)
        {
            cache.call(self, data, name, attributes);
        }

        //闭合
        data.push('\n}\n\n', 'return this;');
        
        //创建属性函数
        return attributes.fn = new Function('value', 'trigger', 'bind', data.join(''));
    };
        
    
    
    //获取当前存储对象
    function storage(name) {
        
        var storage = this.__storage;
        
        if (name)
        {
            return (storage || this.__defaults)[name];
        }
        
        return storage || (this.__storage = create(this.__defaults));
    };
    
        
    //获取指定名称的值
    function get(name) {
        
        var fn = this[name];
        
        if (fn && typeof fn === 'function')
        {
            return fn.call(this);
        }
        
        return (this.__storage || this.__defaults)[name];
    };
    
    
    //设置指定名称的值
    function set(name, value, trigger) {
        
        var fn = this[name];
        
        if (typeof fn === 'function')
        {
            fn.call(this, value, trigger);
        }
        else
        {
            (this.__storage || (this.__storage = create(this.__defaults)))[name] = value;
        }
        
        return this;
    };
    

    //批量设置属性值
    function sets(values, trigger) {

        var fn;
        
        if (values)
        {
            for (var name in values)
            {
                if (typeof (fn = this[name]) === 'function')
                {
                    fn.call(this, values[name], trigger);
                }
                else
                {
                    (this.__storage || (this.__storage = create(this.__defaults)))[name] = values[name];
                }
            }
        }

        return this;
    };
    
    
    //批量赋属性值
    function assign(values, type) {
        
        var storage = this.__storage || (this.__storage = create(this.__defaults));
        
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
            var events = this.__events || (this.__events = create(null));

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

        if (events = events && events[type])
        {
            events.unshift(suspend_fn);
        }

        return this;
    };

    
    //继续事件处理
    function resume(type) {

        var events = this.__events;

        if ((events = events && events[type]) && events[0] === suspend_fn)
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
            index = 1,
            start,
            target,
            events,
            fn;

        e.target = this;
        
        //初始化自定义参数
        while (start = arguments[index++])
        {
            e[start] = arguments[index++];
        }

        start = target = flyingon;
        
        do
        {
            if ((events = target.__events) && (events = events[type]) && (length = events.length))
            {
                index = 0;
                
                do
                {
                    if ((fn = events[index++]) && !fn.disabled)
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
                while (index < length);
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
            var values = target.__storage = create(this.__defaults);

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
    global.$namespace = $namespace;
    global.$fragment = $fragment;
    global.$class = $class;
    global.$constructor = $constructor;
    global.$static = $static;
    


})(typeof global === 'undefined' ? window : global, flyingon);




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
    this.stopPropagation = function () {

        this.cancelBubble = true;
        
        if (arguments[0] !== false && this.dom_event)
        {
            this.dom_event.stopPropagation();
        }
    };


    //禁止默认事件
    this.preventDefault = function () {

        this.defaultPrevented = true;
        
        if (arguments[0] !== false && this.dom_event)
        {
            this.dom_event.preventDefault();
        }
    };


    //阻止事件冒泡及禁止默认事件
    this.stopImmediatePropagation = function () {

        this.cancelBubble = this.defaultPrevented = true;
        
        if (arguments[0] !== false && this.dom_event)
        {
            this.dom_event.stopImmediatePropagation();
        }
    };

    
    
}, false);




//异步处理类
$class('Async', function () {


    
    //延时
    this.sleep = function (time, done, fail) {
        
        if (done !== false || fail !== false)
        {
            function fn(value) {

                var as = new flyingon.Async();

                setTimeout(function () {

                    as.resolve(value);
                    as = null;

                }, time | 0);

                return as;
            };
            
            done = done !== false ? 1 : 0;
            
            if (fail !== false)
            {
                done += 2;
            }

            return registry(this, false, fn, done);
        }
                            
        return this;
    };
    
       
    //注册成功执行函数或异步通知
    this.done = function (asyn, fn) {

        return registry(this, asyn, fn, 1);
    };


    //注册执行失败函数或异步通知
    this.fail = function (asyn, fn) {

        return registry(this, asyn, fn, 2);
    };
    
    
    //注册执行完毕函数或异步通知
    this.complete = function (asyn, fn) {
        
        return registry(this, asyn, fn, 3);
    };


    //注册回调函数
    function registry(self, asyn, fn, state) {

        if (!fn)
        {
            fn = asyn;
            asyn = false;
        }
        
        if (fn)
        {
            var list = self.__list || (self.__list = []);

            list.push([asyn, fn, state, 0]);

            if (self.__state)
            {
                check_done(self);
            }
        }
        
        return self;
    };
    
    
    //成功执行通知
    this.resolve = function (value) {

        return complete(this, 1, value);
    };


    //失败执行通知
    this.reject = function (error, bubble) {
        
        this.bubble = bubble; //是否向上冒泡
        return complete(this, 2, void 0, error);
    };
    
        
    function complete(self, state, value, error) {
        
        var list = self.__list;
        
        self.__state = state;
        self.__value = value;
        self.__error = error;
        
        check_done(self);

        return self;
    };
        

    //检测是否完结
    function check_done(self) {
      
        var list = self.__list,
            index = 0,
            item,
            as;

        if (list)
        {
            while (item = list[index++])
            {
                //同步阻塞则退出
                if (!item[0] && (index > 1 || item[3]))
                {
                    return;
                }
                
                //异步等待且正在等待异步返回则继续处理下一条
                if (item[3])
                {
                    continue;
                }
                
                //执行
                if (typeof (as = item[1]) === 'function')
                {
                    try
                    {
                        switch (item[2])
                        {
                            case 1:
                                as = self.__state === 1 && as.call(self, self.__value);
                                break;
                                
                            case 2:
                                as = self.__state === 2 && as.call(self, self.__error);
                                break;
                                
                            case 3:
                                as = as.call(self, self.__value, self.__error);
                                break;
                        }
                    }
                    catch (e) //执行出错先移除当前项然后继续错误处理
                    {
                        self.__state = 2;
                        self.__error = e;
                        
                        //清除出错前的所有项
                        list.splice(0, index);
                        index = 0;
                        
                        continue;
                    }
                }
                
                //如果执行结果是异步
                if (as && as['flyingon.Async'] && !as.__state)
                {
                    //标记正在等待异步返回
                    item[3] = 1;
                    (as.__back_list || (as.__back_list = [])).push(list, item, self);
                }
                else
                {
                    list.splice(--index, 1);
                }
            }
            
            if (list.length > 0)
            {
                return;
            }
            
            index = 0;
        }
        
        //回溯检测
        if (list = self.__back_list)
        {
            while (item = list[index++])
            {
                item.remove(list[index++]);
                item = list[index++];
                
                //如果失败且未停止冒泡则向上传递错误信息
                if (self.__error && self.bubble)
                {
                    item.__state = 2;
                    item.__error = self.__error;
                }
                
                check_done(item);
            }
            
            list.length = 0;
            self.__back_list = null;
        }
    };
    

    
    //注册执行进度函数
    this.progress = function (fn) {

        if (typeof fn === 'function')
        {
            (this.__progress || (this.__progress = [])).push(fn);
        }
        
        return this;
    };


    //执行进度通知
    this.notify = function (value) {

        var list = this.__progress;
        
        if (list)
        {
            for (var i = 0, l = list.length; i < l; i++)
            {
                list[i].call(this, value);
            }
        }
        
        return this;
    };
    
    
});

    

//异步延时处理
flyingon.delay = function (delay, fn) {

    var as = new flyingon.Async();

    setTimeout(function () {

        if (typeof fn === 'function')
        {
            fn.call(as);
            fn = null;
        }
        else
        {
            as.resolve();
        }

        as = null;

    }, delay | 0);

    return as;
};





//扩展数组indexOf方法
Array.prototype.indexOf || (Array.prototype.indexOf = function (item) {

    for (var i = 0, l = this.length; i < l; i++)
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



//当不存在JSON对象时扩展json解析器
//使用危险代码检测的方法(无危险代码则使用eval解析)实现json解析
typeof JSON !== 'undefined' || (function () {

    
    function write(writer, value) {
        
        if (value)
        {
            switch (typeof value)
            {
                case 'string':
                    writer.push('"', value.replace(/"/g, '\\"'), '"');
                    break;
                    
                case 'object':
                    (value instanceof Array ? write_array : write_object)(writer, value);
                    break;
                    
                case 'function':
                    writer.push('null');
                    break;
                    
                default:
                    writer.push(value);
                    break;
            }
        }
        else
        {
            writer.push(value !== '' ? '' + value : '""');
        }
    };
    
    
    function write_object(writer, values) {
        
        var value, type, flag;
        
        writer.push('{');
        
        for (var name in values)
        {
            if (value = values[name])
            {
                switch (type = typeof value)
                {
                    case 'string':
                        value = value.replace(/"/g, '\\"');
                        break;
                        
                    case 'function':
                        value = void 0;
                        break;
                }
            }
            else if (value === '')
            {
                value = '""';
            }
                        
            //对象值为undefined或function则不序列化
            if (value === void 0)
            {
                continue;
            }
            
            if (flag)
            {
                writer.push(',');
            }
            else
            {
                flag = true;
            }
            
            writer.push('"', name.replace(/"/g, '\\"'), '":');
            
            if (type !== 'object')
            {
                writer.push(value);
            }
            else
            {
                (value instanceof Array ? write_array : write_object)(writer, value);
            }
        }
        
        writer.push('}');
    };
    
    
    function write_array(writer, values) {
        
        writer.push('[');
        
        for (var i = 0, l = values.length; i < l; i++)
        {
            if (i > 0)
            {
                writer.push(',');
            }
            
            write(writer, values[i]);
        }
        
        writer.push(']');
    };
    
    
    window.JSON = {
        
        parse: function (text) {

            if (typeof text === 'string')
            {
                if (/[a-zA-Z_$]/.test(text.replace(/"(?:\\"|[^"])*?"|null|true|false|\d+[Ee][-+]?\d+/g, '')))
                {
                    flyingon.raise('flyingon', 'json_parse_error');
                }

                return new Function('return ' + text)();
            }

            return text;
        },
        
        stringify: function (value) {
            
            if (value)
            {
                var writer = [];
                write(writer, value);

                return writer.join('');
            }
            
            if (value !== void 0)
            {
                return value !== '' ? '' + value : '""';
            }
        }
    };


})();


//class相关操作功能片段
$fragment('ClassFragment', function () {
   
    
    
    //缓存的名称正则表达式集合
    var names = flyingon.create(null);
    
    
        
    //获取对应正则表达式
    function parse(name) {
        
        return names[name] = new RegExp('(\\s+|^)' + name + '(\\s+|$)', 'gi');
    };
    
    
    function replace(_, x, y) {

        return x && y ? ' ' : '';  
    };
    

    //是否包含指定class
    this.hasClass = function (name) {

        var storage;
        
        if (name && (storage = this.__storage))
        {
            return (names[name] || parse(name)).test(storage.className);
        }
        
        return false;
    };


    //添加class
    this.addClass = function (name) {

        if (name)
        {
            var value = this.__storage;
            
            if (value && (value = value.className))
            {
                name = value + ' ' + name;
            }
            
            this.className(name);
        }

        return this;
    };


    //移除class
    this.removeClass = function (name) {

        var value;
        
        if (name && (value = this.__storage) && (value = value.className))
        {
            this.className(value.replace(names[name] || parse(name), replace));
        }

        return this;
    };


    //切换class 有则移除无则添加
    this.toggleClass = function (name) {

        if (name)
        {
            var value = this.__storage,
                regex;
            
            if (value && 
                (value = value.className) &&
                (regex = names[name] || parse(name)).test(value))
            {
                name = value.replace(regex, replace);
            }
            else if (value)
            {
                name = value + ' ' + name;
            }
            
            this.className(name);
        }

        return this;
    };

    
});



//序列化组件片段
$fragment('SerializeFragment', function () {
    
    
    
    //组件id
    this.defineProperty('id', '');
    
    
    
    //序列化方法
    this.serialize = function (writer) {

        var cache;
        
        if (cache = this.xtype)
        {
            writer.writeProperty('xtype', cache);
        }
        
        if (cache = this.__storage)
        {
            writer.writeProperties(cache);
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
            else
            {
                this.set(name, values[name]);
            }
        }
    };

            
    //设置不序列化xtype属性
    this.deserialize_xtype = true;
    
    
}, true);



//读序列化类
$class('SerializeReader', function () {

    

    var class_list = flyingon.__class_list;
    
    var Array = window.Array;
    
    

    this.deserialize = function (data) {

        if (data)
        {
            if (typeof data === 'string')
            {
                data = JSON.parse(data);
            }

            if (typeof data === 'object')
            {
                data = data instanceof Array ? this.readArray(data) : this.readObject(data);
                this.all = this.callback = null;
            }
        }

        return data;
    };


    this.read = function (data) {

        if (data && typeof data === 'object')
        {
            return data instanceof Array ? this.readArray(data) : this.readObject(data);
        }

        return data;
    };


    this.readArray = function (data) {

        if (data)
        {
            var array = [];

            for (var i = 0, l = data.length; i < l; i++)
            {
                array.push(this.read(data[i]));
            }

            return array;
        }

        return null;
    };


    this.readObject = function (data, type) {

        if (data)
        {
            var target, id;

            if (type)
            {
                if ((target = new type()).deserialize)
                {
                    target.deserialize(this, data);
                    
                    if (id = data.id)
                    {
                        read_reference.call(this, target, id);
                    }
                }
                else
                {
                    this.readProperties(target, data); 
                }
            }
            else if ((type = data.xtype) && (type = class_list[type]))
            {
                (target = new type()).deserialize(this, data);
                
                if (id = data.id)
                {
                    read_reference.call(this, target, id);
                }
            }
            else
            {
                this.readProperties(target = {}, data); 
            }
            
            return target;
        }

        return null;
    };
    
    
    function read_reference(target, id) {
        
        var list = this.callback;
        
        (this.all || (this.all = {}))[id] = target;

        if (list && (list = list[id]))
        {
            for (var i = 0, l = list.length; i < l; i++)
            {
                list[i](target);
            }

            list[id] = target = null;
        }
    };

    
    this.readProperties = function (target, data) {
      
        for (var name in data)
        {
            target[name] = this.read(data[name]);
        }
    };
    
    
    this.readReference = function (name, callback) {
      
        var all = this.all,
            cache;
        
        if (all && (cache = all[name]))
        {
            callback(cache);
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


    
    var Array = window.Array;
    
    var has = {}.hasOwnProperty;

    var id = 1;
    
    
    
    this.serialize = function (value) {

        if (value && typeof value === 'object')
        {
            var data = this.data = [];
            
            if (value instanceof Array)
            {
                this.writeArray(value);
            }
            else
            {
                this.writeObject(value);
            }

            data.pop();
            
            return data.join('');
        }
        
        return '' + value;
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
                    this.data.push('"', value.replace(/"/g, '\\"'), '"', ',');
                    break;
                    
                case 'function':
                    this.data.push('"', ('' + value).replace(/"/g, '\\"'), '"', ',');
                    break;

                default:
                    if (value instanceof Array)
                    {
                        this.writeArray(value);
                    }
                    else
                    {
                        this.writeObject(value);
                    }
                    break;
            }
        }
        else
        {
            this.data.push(null, ',');
        }
    };


    this.writeArray = function (value) {

        var data = this.data,
            length;
        
        if (value != null)
        {
            if ((length = value.length) > 0)
            {
                data.push('[');
                
                for (var i = 0; i < length; i++)
                {
                    this.write(value[i]);
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


    this.writeObject = function (value) {

        var data = this.data;
        
        if (value != null)
        {
            data.push('{');

            if (value.serialize)
            {
                value.serialize(this);
            }
            else
            {
                this.writeProperties(value);
            }

            data.push(data.pop() === ',' ? '}' : '{}', ',');
        }
        else
        {
            data.push(null, ',');
        }
    };


    this.writeProperties = function (values) {

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
    
    
    this.writeProperty = function (name, value) {
      
        if (name)
        {
            this.data.push('"', name, '":');
            this.write(value);
        }
    };
    
    
    this.writeReference = function (name, value) {
        
        if (name && value)
        {
            this.data.push('"', name, '":', value.id() || ('__auto_id_' + id++));
        }
    };

    
        
    this.__class_init = function (Class) {
    
        var writer = Class.instance = new Class();

        Class.serialize = function (value) {

            return writer.serialize(value);
        };
    };
    

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
        
        for (var i = 0, l = this.length; i < l; i++)
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
        
        for (var i = 0, l = this.length; i < l; i++)
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
        
        for (var i = 0, l = data.length; i < l; i++)
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
$fragment('IDataList', function () {
    
    
    
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
    
    

    //默认事件
    var default_event = new flyingon.Event();
    
    
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
                
    

    //是否dataset当前行
    this.isCurrent = function () {
        
        return this.uniqueId === this.dataset.__current_id;
    };
    
    
    
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
    this.set = function (name, value, trigger, source) {
        
        var data, oldValue;
        
        //不允许设置值为undefined
        if (name && value !== void 0 && (data = this.data) && value !== (oldValue = data[name]))
        {
            var dataset = this.dataset, 
                e, 
                key, 
                cache;
            
            if (trigger !== false)
            {
                e = default_event;
                e.type = 'value-changing';
                e.row = this;
                e.name = name;
                e.value = value;
                e.oldValue = oldValue;
                
                if (e && dataset.trigger(e) === false)
                {
                    return this;
                }
                
                if ((cache = e.value) !== value && cache !== void 0)
                {
                    value = cache;
                }
            }
            
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

            if (e)
            {
                e.type = 'value-changed';
                dataset.trigger(e);
            }
            
            //触发变更动作
            dataset.dispatch('change', this, name, source);
        }
        
        return this;
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
$class('DataSet', [Object, flyingon.ISerialize, flyingon.IDataList], function () {
    
    
    
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
            for (var i = 0, l = mapping.length; i < l; i++)
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
                data = {};
            }

            row = new rowType();
            
            row.dataset = dataset;
            
            if (parent)
            {
                row.parent = parent;
            }
            
            row.data = data;
            
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
            id = this.__current_id,
            oldValue = id && keys[id];
        
        if (row === void 0)
        {
            return oldValue || null;
        }
        
        if (oldValue !== row)
        {
            if (this.trigger('current-changing', 'value', row, 'oldValue', oldValue) === false)
            {
                this.__current_id = id;
                return this;
            }
            
            this.__current_id = row && row.uniqueId;
            this.trigger('current-changed', 'value', row, 'oldValue', oldValue);
            
            //触发行移动事件
            this.dispatch('move', row);
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
    
    
    
    //订阅或取消订阅变更动作
    this.subscribe = function (control, cancel) {
        
        if (control && control.receive)
        {
            var list = this.__action_list,
                index;
            
            if (list)
            {
                index = list.indexOf(control);
                
                if (cancel)
                {
                    if (index >= 0)
                    {
                        list.splice(index, 1);
                    }
                }
                else if (index < 0)
                {
                    list.push(control);
                }
            }
            else if (!cancel)
            {
                (this.__action_list = []).push(control);
            }
        }
    };
    
    
    //派发变更动作
    this.dispatch = function (type, row, name, source) {
        
        var list, control, action, flag;
        
        if (type && (list = this.__action_list))
        {
            for (var i = 0, l = list.length; i < l; i++)
            {
                //如果绑定的是当前行
                if ((control = list[i]).subscribeCurrent)
                {
                    //指定行并且不是当前行
                    if (flag || flag === void 0 && (flag = !!row && row.uniqueId !== this.__current_id))
                    {
                        continue;
                    }
                }

                control.receive(this, action || (action = {
                
                    dataset: this,
                    type: type,
                    row: row || this.currentRow(),
                    name: name || null,
                    source: source || null
                }));
            }
        }
    };
    
    
    //绑定数据源
    this.bind = function () {
        
        var row;
        
        if (!this.__current_id && (row = this[0]))
        {
            this.currentRow(row);
        }
        
        this.dispatch('bind');
    };
    
        
});



//可绑定对象片段
$fragment('BindableFragment', function () {
    
    

    //数据集
    this.defineProperty('dataset', null, {
        
        storage: 'this.__dataset',
        bind: false,
        set: 'if (oldValue) oldValue.subscribe(this, true);\n\t' 
            + 'if (value) value.subscribe(this);'
    });
    
    
    //设置属性绑定
    this.__set_bind = function (name, value) {
        
        if (name && value && (value = value.match(/^\{\{\s*([^{}]+)\s*\}\}$/)))
        {
            if (/[\W\s]/.test(value = value[1]))
            {
                var fn = new Function('row', 'with (row.data) { return ' + value + '; }');
                
                fn.text = value;
                value = fn;
            }
            
            (this.__bind_names || (this.__bind_names = {}))[name] = value;
            return true;
        }
        
        return false;
    };

    
    //仅订阅数据集当前行变更动作
    this.subscribeCurrent = true;
    
    
    //接收数据集变更动作处理
    this.receive = function (dataset, action) {
        
        var list;
        
        if (action && action.source !== this && (list = this.__bind_names))
        {
            var row = action.row,
                name = action.name,
                value;
            
            for (var key in list)
            {
                if (typeof (value = list[key]) !== 'function')
                {
                    if (!name || (value === name))
                    {
                        this[key](row && row.get(value), true);
                    }
                }
                else if (!name || value.text.indexOf(name) >= 0)
                {
                    this[key](value(row), true);
                }
            }
        }
    };
    
    
    //回推数据至数据集
    this.pushBack = function (name, value) {
        
        var target, dataset, cache;
        
        if ((target = this.__bind_names) && (name = target[name]) && typeof name === 'string')
        {
            target = this;
            
            while (target)
            {
                if (dataset = target.__dataset)
                {
                    if (cache = dataset.currentRow())
                    {
                        cache.set(name, value, true, this);
                    }

                    return;
                }

                target = target.__parent;
            }
        }
    };

    
    
}, true);

//Dom事件类型
$class('DomEvent', flyingon.Event, function () {
    
    
    $constructor(function (type, event) {
    
        this.type = type;
        this.dom_event = event;
        
    }, true);
    
    
});




//鼠标事件类型
$class('MouseEvent', flyingon.Event, function () {


    $constructor(function (event) {

        //关联的原始事件
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
    unit.in = 96;
    unit.pt = 4 / 3;
    unit.mm = (unit.cm = 96 / 2.54) / 10;
    

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
    
    

    //初始化视框
    this.initViewBox = function (width, height) {

        var storage = this.__storage || this.__defaults;
        
        if (storage && !storage.visible)
        {
            return this.viewBox = null;
        }
        
        var box = this.viewBox || (this.viewBox = {}),
            fn = flyingon.pixel_sides,
            values = this.__location_values,
            value;
        
        box.margin = fn(values && values.margin || storage.margin, width);
        box.border = fn(values && values.border || storage.border, width);
        box.padding = fn(values && values.padding || storage.padding, width);
        
        fn = flyingon.pixel;
        
        switch (value = values && values.width || storage.width)
        {
            case 'default':
                box.offsetWidth = false;
                break;
                
            case 'fill':
                box.offsetWidth = true;
                break;
                
            case 'auto':
                box.offsetWidth = box.autoWidth = true;
                break;
                
            default:
                box.offsetWidth = fn(value, width);
                break;
        }
        
        switch (value = values && values.height || storage.height)
        {
            case 'default':
                box.offsetHeight = false;
                break;
                
            case 'fill':
                box.offsetHeight = true;
                break;
                
            case 'auto':
                box.offsetHeight = box.autoHeight = true;
                break;
                
            default:
                box.offsetHeight = fn(value, height);
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
    //box               控件视框
    //availableWidth    可用宽度 
    //availableHeight   可用高度
    //lessWidth         宽度不足时的宽度 true:默认宽度 正整数:指定宽度 其它:0
    //lessHeight        高度不足时的高度 true:默认高度 正整数:指定高度 其它:0
    //defaultWidth      默认宽度 true:可用宽度 正整数:指定宽度 其它:0
    //defaultHeight     默认高度 true:可用高度 正整数:指定高度 其它:0
    this.measure = function (box, availableWidth, availableHeight, lessWidth, lessHeight, defaultWidth, defaultHeight) {
        
        var minWidth = box.minWidth,
            maxWidth = box.maxWidth,
            minHeight = box.minHeight,
            maxHeight = box.maxHeight,
            width = box.offsetWidth,
            height = box.offsetHeight;

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
        box.offsetWidth = width;
        box.offsetHeight = height;
        
        //测量后处理
        if (this.onmeasure(box) !== false)
        {
            //处理最小及最大宽度
            if (box.offsetWidth !== width)
            {
                if ((width = box.offsetWidth) < minWidth)
                {
                    box.offsetWidth = minWidth;
                }
                else if (maxWidth > 0 && width > maxWidth)
                {
                    box.offsetWidth = maxWidth;
                }
            }

            //处理最小及最大高度
            if (box.offsetHeight !== height)
            {
                if ((height = box.offsetHeight) < minHeight)
                {
                    box.offsetHeight = minHeight;
                }
                else if (maxHeight > 0 && height > maxHeight)
                {
                    box.offsetHeight = maxHeight;
                }
            }
        }
    };
    
        
    //自定义测量处理
    this.onmeasure = function (box) {
        
        return false;
    };
    

    //定位控件
    this.locate = function (box, x, y, alignWidth, alignHeight, container) {
        
        var values = box.margin,
            width = box.offsetWidth,
            height = box.offsetHeight,
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
                    x += values.left;
                    break;
            }
        }
        else
        {
            x += values.left;
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
                    y += values.top;
                    break;
            }
        }
        else
        {
            y += values.top;
        }
        
        box.offsetLeft = x;
        box.offsetTop = y;
        
        if (this.onlocate(box) !== false)
        {
            x = box.offsetLeft;
            y = box.offsetTop;
        }
        
        if (container)
        {
            container.arrangeX = x = x + width + values.right;
            container.arrangeY = y = y + height + values.bottom;

            values = box.padding;
            
            if ((x += values.right) > container.contentWidth)
            {
                container.contentWidth = x;
            }

            if ((y += values.bottom) > container.contentHeight)
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






//容器控件片段
$fragment('ContainerFragment', function () {


           
    //控件默认宽度(width === 'default'时的宽度)
    this.defaultWidth = 300;

    //控件默认高度(height === 'default'时的高度)
    this.defaultHeight = 150;
    
    
    
    //允许添加的子控件类型
    this.childControlType = flyingon.Control;
    

    
    function check_control(self, controls, index) {
        
        var type = self.childControlType,
            length = controls.length,
            list,
            parent,
            control;
        
        while (index < length)
        {
            if ((control = controls[index++]) instanceof type)
            {
                if (parent = control.__parent)
                {
                    parent.remove(control, false);
                }

                control.__parent = self;
                (list || (list = [])).push(control);
            }
            else
            {
                throw $errortext('flyingon', 'children type').replace('{0}', type.xtype);
            }
        }
        
        return list;
    };
    
    
    //添加子控件
    this.append = function (control) {

        var list = check_control(this, arguments, 0),
            children;
        
        if (list)
        {
            children = this.__children || this.children();
            
            if (list[1])
            {
                children.push.apply(children, list);
            }
            else
            {
                children.push(control);
            }
            
            if (this.view)
            {
                this.renderer.append(this, list);
            }
            
            if (this.__arrange_dirty !== 2)
            {
                this.invalidate();
            }
        }
        
        return this;
    };


    //在指定位置插入子控件
    this.insert = function (index, control) {

        var list = check_control(this, arguments, 1),
            children;
        
        if (list)
        {
            children = this.__children || this.children();
            
            if (index < 0)
            {
                if ((index += length) < 0)
                {
                    return 0;
                }
            }

            if (index > length)
            {
                index = length;
            }

            if (list[1])
            {
                children.splice.apply(children, [index, 0].concat(list));
            }
            else
            {
                children.splice(index, 0, control);
            }
            
            if (this.view)
            {
                this.renderer.insert(this, index, list);
            }
            
            if (this.__arrange_dirty !== 2)
            {
                this.invalidate();
            }
        }

        return this;
    };
    
    
    function remove(control, index, dispose) {
    
        control.__parent = null;

        if (this.view)
        {
            this.renderer.remove(this, control, index);
        }

        if (this.__arrange_dirty !== 2)
        {
            this.invalidate();
        }

        if (dispose !== false)
        {
            control.dispose();
        }
    };
    
    
    //移除子控件或从父控件中移除
    this.remove = function (control, dispose) {
            
        var children, index;
        
        if (control && (children = this.__children) && (index = children.indexOf(control)) >= 0)
        {
            children.splice(index, 1);
            remove(control, index, dispose);
        }

        return this;
    };


    //移除指定位置的子控件
    this.removeAt = function (index, dispose) {

        var children, control;

        if ((children = this.__children) && (control = children[index]))
        {       
            children.splice(index, 1);
            remove(control, index, dispose);
        }

        return this;
    };


    //清除子控件
    this.clear = function (dispose) {
      
        var children = this.__children,
            control,
            length;
        
        if (children && (length = children.length) > 0)
        {
            for (var i = length - 1; i >= 0; i--)
            {
                control = children[i];
                control.__parent = null;
                
                if (dispose !== false)
                {
                    control.dispose();
                }
            }
            
            children.length = 0;
            
            if (this.view)
            {
                this.renderer.clear(this);
            }
            
            if (this.__arrange_dirty !== 2)
            {
                this.invalidate();
            }
        }
        
        return this;
    };
    
        

    //测量自动大小
    this.onmeasure = function (box) {
        
        var autoWidth = box.autoWidth,
            autoHeight = box.autoHeight;
        
        if (autoWidth || autoHeight)
        {
            this.arrange();

            if (autoWidth)
            {
                box.offsetWidth = box.contentWidth + box.border.width;
            }

            if (autoHeight)
            {
                box.offsetHeight = box.contentHeight + box.border.height;
            }
        }
        else
        {
            return false;
        }
    };
    
        
    
    //引入排列功能片段
    //设置子控件需要排列标记
    this.__arrange_dirty = 2;
    
    
    //排列子控件
    this.arrange = function () {

        var box = this.viewBox,
            hscroll, 
            vscroll;
        
        if (box)
        {
            //处理自动滚动
            switch (this.overflowX())
            {
                case 'scroll':
                    box.hscroll = true;
                    break;

                case 'auto':
                    hscroll = true;
                    break;
                    
                default:
                    box.hscroll = false;
                    break;
            }

            switch (this.overflowY())
            {
                case 'scroll':
                    box.vscroll = true;
                    break;

                case 'auto':
                    vscroll = true;
                    break;
                    
                default:
                    box.vscroll = false;
                    break;
            }

            //初始化布局
            this.getLayout().init(this, this.__children, hscroll, vscroll);
        }
        
        //排列子项
        this.__arrange_dirty = 0;
    };
    
    
    //获取布局器对象
    this.getLayout = function () {

        var layout = this.__layout;
            
        if (layout)
        {
            if (layout === true)
            {
                layout = this.__layout = flyingon.findLayout(this.layout());
            }
        }
        else
        {
            layout = flyingon.findLayout(this.layout());
        }
        
        return layout;
    };
    
    
    
    //接收数据集变更动作处理
    this.receive = function (dataset, action) {
        
        var children = this.__children,
            control;
        
        if (children)
        {
            //向下派发
            for (var i = 0, l = children.length; i < l; i++)
            {
                if (!(control = children[i]).__dataset)
                {
                    control.receive(dataset, action);
                }
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
            this.__update_dirty = true;
            
            while (parent = target.__parent)
            {
                if (parent.__arrange_dirty)
                {
                    return this;
                }
                
                parent.__arrange_dirty = 1;
            }

            flyingon.__delay_update(target);
        }

        return this;
    };
    
    
    //更新视区
    this.update = function () {
      
        if (this.__arrange_dirty)
        {
            this.arrange();
        }
        
        if (this.__update_dirty)
        {
            this.render();
            this.__update_dirty = false;
        }
    };
    
    
           
    this.serialize = function (writer) {
        
        var children;
        
        this.base.serialize.call(this, writer);
        
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
        this.base.dispose.call(this);
    };


});



$class('Text', flyingon.Control, function (base) {
   
        
    this.defineProperty('text', '', {
        
        set: 'this.dom && (this.dom.innerHTML = value);'
    });
    
    
    this.defineProperty('isHtml', false);
    
});

$class('Panel', flyingon.Control, function () {


        
    this.defaultWidth = this.defaultHeight = 400;
        
    
    
    //引入容器组件片段
    flyingon.ContainerFragment(this);
    
    
    
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
    

//子布局
$class('Sublayout', flyingon.Control, function (base) {
       
    
        
    //子项占比
    this.defineProperty('scale', 0, {
     
        minValue: 0
    });
    
    
    //布局
    this.defineProperty('layout', null, {
     
        set: 'this.__layout = value && typeof value === "object";'
    });
    
    
    //指定默认大小
    this.defaultWidth = this.defaultHeight = 200;
    
        
    
    this.onmeasure = function (box) {

        var layout = this.__layout,
            autoWidth = box.autoWidth,
            autoHeight = box.autoHeight;
        
        if (layout)
        {
            if (layout === true)
            {
                layout = this.__layout = flyingon.findLayout(this.layout());
            }
        }
        else
        {
            layout = flyingon.findLayout(this.layout());
        }
        
        layout.init(this, this.__children, false, false, true);
        
        if (autoWidth || autoHeight)
        {
            if (autoWidth)
            {
                box.offsetWidth = box.contentWidth + box.border.width;
            }

            if (autoHeight)
            {
                box.offsetHeight = box.contentHeight + box.border.height;
            }
        }
        else
        {
            return false;
        }
    };
    
        
    this.onlocate = function (box) {
        
        var items = this.__children,
            x = box.offsetLeft,
            y = box.offsetTop;
        
        //处理定位偏移
        if (items && (x || y))
        {
            for (var i = items.length - 1; i >= 0; i--)
            {
                if ((box = items[i]) && (box = box.viewBox))
                {
                    box.offsetLeft += x;
                    box.offsetTop += y;
                }
            }
        }
        
        return false;
    };
    
    
    //重载方法禁止绘制
    this.update = this.render = this.createPainter = function () {};
    
    
});




//布局基类
$class('Layout', function () {

    

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


    //子项定位属性值
    this.defineProperty('location', null, {

        set: 'this.__location = !!value;'
    });

    
    //分割子布局
    this.defineProperty('partition', null, {
       
        set: 'this.__layouts = !!value;'
    });
    

    //自适应
    this.defineProperty('adaption', null, {

        set: 'this.__adaption = !!value;'
    });

        
        
    //初始化排列
    this.init = function (control, items, hscroll, vscroll, sublayout) {
        
        var box = control.viewBox,
            layout,
            border,
            padding,
            cache;
        
        if (box)
        {
            border = box.border;
            padding = box.padding;

            box.arrangeLeft = box.contentWidth = padding.left;
            box.arrangeTop = box.contentHeight = padding.top;

            box.clientWidth = (cache = box.offsetWidth - border.width - padding.width) > 0 ? cache : 0;
            box.clientHeight = (cache = box.offsetHeight - border.height - padding.height) > 0 ? cache : 0;
            
            //自定义调整排列区域
            if (cache = control.arrangeArea)
            {
                cache.call(control, box);
            }
        }
        else
        {
            return;
        }
        
        if (items && items.length > 0)
        {
            if (layout = this.__adaption)
            {
                if (layout === true)
                {
                    layout = complie(this.adaption(), cache = []);
                    layout = this.__adaption = new Function('width', 'height', layout);
                    layout.values = cache;
                }
                else
                {
                    cache = layout.values;
                }

                var index = layout(box.offsetWidth, box.offsetHeight);

                if ((layout = cache[index]) && !layout['flyingon.Layout'])
                {
                    layout = cache[index] = flyingon.findLayout(layout);
                }
            }

            arrange(layout || this, box, items, hscroll, vscroll, sublayout);
            
            if (hscroll)
            {
                box.hscroll = box.contentWidth > box.arrangeLeft + box.clientWidth;
            }
            
            if (vscroll)
            {
                box.vscroll = box.contentHeight > box.arrangeTop + box.clientHeight;
            }
            
            box.contentWidth += padding.right;
            box.contentHeight += padding.bottom;
            
            return true;
        }
    };
    
      
    //内部排列方法
    function arrange(layout, container, items, hscroll, vscroll, sublayout) {

        var layouts = layout.__layouts,
            location,
            cache;
                            
        //处理子布局(注:子布局不支持镜象,由上层布局统一处理)
        if (layouts)
        {
            if (layouts === true)
            {
                layouts = layout.__layouts = init_layouts(layout.partition());
            }
 
            //分配置子布局子项
            allot_layouts(layouts, items);
            
            //排列
            layout.arrange(container, layouts, hscroll, vscroll);
            
            //清除子项缓存
            for (var i = layouts.length - 1; i >= 0; i--)
            {
                layouts[i].__children = null;
            }
        }
        else
        {
            //处理强制子项值
            if (location = layout.__location)
            {
                if (location === true)
                {
                    location = layout.__location = init_location(layout.location());
                }

                cache = location.condition;

                for (var i = items.length - 1; i >= 0; i--)
                {
                    items[i].__location_values = cache && location[cache(i, items[i])] || location;
                }
            }
            else //清空原有强制子项属性
            {
                for (var i = items.length - 1; i >= 0; i--)
                {
                    items[i].__location_values = null;
                }
            }
            
            //排列
            layout.arrange(container, items, hscroll, vscroll);
        }
        
        //非子布局 镜像处理(注:子布局不支持镜象,由上层布局统一处理)
        if (!sublayout && (cache = layout.mirror()) !== 'none')
        {
            arrange_mirror(container, cache, items);
        }
    };
    
    
    //编译表达式
    function complie(data, values) {

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
    function init_layouts(values) {
        
        var index = values.length;
        
        if (!index)
        {
            values = [values];
            index = 1;
        }
        
        var reader = flyingon.SerializeReader,
            layouts = new Array(values.length),
            fixed = 0,
            weight = 0,
            layout,
            scale,
            cache;
        
        while (cache = values[--index])
        {
            (layout = layouts[index] = new flyingon.Sublayout()).deserialize(reader, cache);
            
            scale = layout.scale();

            if (layout.fixed = cache = scale | 0)
            {
                fixed += cache;
            }
            
            if (layout.weight = cache = scale - cache)
            {
                weight += cache;
            }
        }
        
        layouts.fixed = fixed;
        layouts.weight = weight;
        
        return layouts;
    };
    
    
    //分配子布局子项
    function allot_layouts(layouts, items) {
        
        var margin = items.length - layouts.fixed, //余量
            weight = layouts.weight,
            index = 0;
        
        if (margin < 0)
        {
            margin = 0;
        }
        
        for (var i = 0, l = layouts.length; i < l; i++)
        {
            var layout = layouts[i],
                length = layout.fixed,
                scale = layout.weight,
                value;
            
            if (scale)
            {
                value = margin * scale / weight | 0;
                weight -= scale;
                
                length += value;
                margin -= value;
            }

            layout.__children = items.slice(index, index += length);
        }
    };
    
        
    //初始化子项定位属性值
    function init_location(values) {
        
        var location = flyingon.create(null),
            cache;
        
        for (cache in values)
        {
            location[cache] = values[cache];
        }
        
        if (cache = location.condition)
        {
            var fn = function () {},
                extend = flyingon.extend;
                
            fn.prototype = location;
            
            cache = complie(cache, values = []);
            (location.condition = new Function('index', 'item', cache)).values = values;

            for (var i = values.length - 1; i >= 0; i--)
            {
                location[i] = extend(new fn(), values[i]);
            }
        }
        
        return location;
    };
    
    
    //镜象排列
    function arrange_mirror(container, padding, mirror, items) {

        var padding = container.padding,
            max = Math.max,
            width = max(container.clientWidth, container.contentWidth),
            height = max(container.clientHeight, container.contentHeight),
            length = items.length,
            box;
        
        switch (mirror)
        {
            case 'x':
                for (var i = 0; i < length; i++)
                {
                    if (box = items[i].viewBox)
                    {
                        box.offsetTop = height - box.offsetTop - box.offsetHeight;
                    }
                }
                break;

            case 'y':
                for (var i = 0; i < length; i++)
                {
                    if (box = items[i].viewBox)
                    {
                        box.offsetLeft = width - box.offsetLeft - box.offsetWidth;
                    }
                }
                break;

            case 'center':
                for (var i = 0; i < length; i++)
                {
                    if (box = items[i].viewBox)
                    {
                        box.offsetLeft = width - box.offsetLeft - box.offsetWidth;
                        box.offsetTop = height - box.offsetTop - box.offsetHeight;
                    }
                }
                break;
        }
    };
    

    
    //排列布局
    this.arrange = function (container, items, hscroll, vscroll) {

    };
    
    
    //重排
    this.rearrange = function (container, items, hscroll, vscroll) {
      
        var flag = false;
        
        if (hscroll && (hscroll === 1 || container.contentWidth > container.arrangeLeft + container.clientWidth))
        {
            if ((container.clientHeight -= flyingon.hscroll_height) < 0)
            {
                container.clientHeight = 0;
            }
            
            hscroll = false;
            flag = true;
        }
        
        if (vscroll && (vscroll === 1 || container.contentHeight > container.arrangeTop + container.clientHeight))
        {
            if ((container.clientWidth -= flyingon.vscroll_width) < 0)
            {
                container.clientWidth = 0;
            }
            
            vscroll = false;
            flag = true;
        }
        
        if (flag)
        {
            container.contentWidth = container.arrangeLeft;
            container.contentHeight = container.arrangeTop;
            
            this.arrange(container, items, hscroll, vscroll);
            return true;
        }
    };
    
       
    
    //引入序列化功能片段
    flyingon.SerializeFragment(this);
    
    
    
    //设置不反序列化type属性
    this.deserialize_type = true;
    
            

    this.__class_init = function (Class, base) {

        if (base.__class_init)
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
    this.arrange = function (container, items, hscroll, vscroll) {

        var x = container.arrangeLeft,
            y = container.arrangeTop,
            width = container.clientWidth,
            height = container.clientHeight,
            right = x + width,
            spacingX = flyingon.pixel(this.spacingX(), width),
            control,
            box;
        
        //先按无滚动条的方式排列
        for (var i = 0, l = items.length; i < l; i++)
        {
            if (box = (control = items[i]).initViewBox(width, height))
            {
                control.measure(box, right > x ? right - x : width, height, true);
                control.locate(box, x, y, 0, height, container);
                
                if (hscroll && container.contentWidth > right)
                {
                    return this.rearrange(container, items, 1, false);
                }
                
                x = container.arrangeX + spacingX;
            }
        }
    };
    
    
});



//纵向单列布局类
$class(flyingon.Layout, function (base) {


    this.type = 'vertical-line';
    
        
    //排列布局
    this.arrange = function (container, items, hscroll, vscroll) {

        var x = container.arrangeLeft,
            y = container.arrangeTop,
            width = container.clientWidth,
            height = container.clientHeight,
            bottom = y + height,
            spacingY = flyingon.pixel(this.spacingY(), height),
            control,
            box;
        
        //先按无滚动条的方式排列
        for (var i = 0, l = items.length; i < l; i++)
        {
            if (box = (control = items[i]).initViewBox(width, height))
            {
                control.measure(box, width, bottom > y ? bottom - height : height, 0, true);
                control.locate(box, x, y, width, 0, container);
                
                if (vscroll && container.contentHeight > bottom)
                {
                    return this.rearrange(container, items, false, 1);
                }
                
                y = container.arrangeY + spacingY;
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
    flyingon.locationProperty('newline', false);
    
    
    //排列布局
    this.arrange = function (container, items, hscroll, vscroll) {

        var x = container.arrangeLeft,
            y = container.arrangeTop,
            width = container.clientWidth,
            height = container.clientHeight,
            right = x + width,
            bottom = y + height,
            pixel = flyingon.pixel,
            spacingX = pixel(this.spacingX(), width),
            spacingY = pixel(this.spacingY(), height),
            lineHeight = pixel(this.lineHeight(), height),
            left = x,
            control,
            box;

        for (var i = 0, l = items.length; i < l; i++)
        {
            if (box = (control = items[i]).initViewBox(width, height))
            {
                control.measure(box, right > x ? right - x : width, lineHeight, width);
                
                //处理换行
                if (x > left && (x + box.offsetWidth + box.margin.right > right || control.locationValue('newline')))
                {
                    x = left;
                    y = (lineHeight ? y + lineHeight : container.contentHeight) + spacingY;
                }
                
                control.locate(box, x, y, 0, lineHeight, container);

                //出现滚动条后重排
                if (vscroll && container.contentHeight > bottom)
                {
                    return this.rearrange(container, items, false, 1);
                }
   
                x = container.arrangeX + spacingX;
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
    this.arrange = function (container, items, hscroll, vscroll) {

        var x = container.arrangeLeft,
            y = container.arrangeTop,
            width = container.clientWidth,
            height = container.clientHeight,
            right = x + width,
            bottom = y + height,
            pixel = flyingon.pixel,
            spacingX = pixel(this.spacingX(), width),
            spacingY = pixel(this.spacingY(), height),
            lineWidth = pixel(this.lineWidth(), width),
            top = y,
            control,
            box;

        for (var i = 0, l = items.length; i < l; i++)
        {
            if (box = (control = items[i]).initViewBox(width, height))
            {
                control.measure(box, lineWidth, bottom > y ? bottom - y : height, 0, height);
                
                //处理换行
                if (y > top && (y + box.offsetHeight + box.margin.bottom > bottom || control.locationValue('newline')))
                {
                    x = (lineWidth ? x + lineWidth : container.contentWidth) + spacingX;
                    y = top;
                }
                
                control.locate(box, x, y, lineWidth, 0, container);

                //出现滚动条后重排
                if (hscroll && container.contentWidth > right)
                {
                    return this.rearrange(container, items, 1, false);
                }
   
                y = container.arrangeY + spacingY;
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
    flyingon.locationProperty('dock', 'left');

    
    //排列布局
    this.arrange = function (container, items, hscroll, vscroll) {

        var x = container.arrangeLeft,
            y = container.arrangeTop,
            width = container.clientWidth,
            height = container.clientHeight,
            right = x + width,
            bottom = y + height,
            clientWidth = width,
            clientHeight = height,
            pixel = flyingon.pixel,
            spacingX = pixel(this.spacingX(), width),
            spacingY = pixel(this.spacingY(), height),
            list,
            control,
            box;

        for (var i = 0, l = items.length; i < l; i++)
        {
            if (box = (control = items[i]).initViewBox(clientWidth, clientHeight))
            {
                switch (control.locationValue('dock'))
                {
                    case 'left':
                        control.measure(box, width, height, true, false, false, true);
                        control.locate(box, x, y, 0, height, container);
                        
                        width = right - (x = container.arrangeX + spacingX);
                        break;

                    case 'top':
                        control.measure(box, width, height, false, true, true);
                        control.locate(box, x, y, width, 0, container);
                        
                        height = bottom - (y = container.arrangeY + spacingY);
                        break;

                    case 'right':
                        control.measure(box, width, height, true, false, false, true);
                        control.locate(box, right -= box.offsetWidth - box.margin.width, y, 0, height, container);
                        
                        width = (right -= spacingX) - x;
                        break;

                    case 'bottom':
                        control.measure(box, width, height, true, false, true);
                        control.locate(box, x, bottom -= box.offsetHeight - box.margin.height, width, 0, container);
                        
                        height = (bottom -= spacingY) - y;
                        break;

                    default:
                        (list || (list = [])).push(control, box);
                        continue;
                }
            }
        }
        
        //排列充满项
        if (list)
        {
            for (var i = 0, l = list.length; i < l; i++)
            {
                control = list[i++];
                box = list[i++];
                control.measure(box, width, height, false, false, true, true);
                control.locate(box, x, y, width, height, container);
            }
        }
        
        //检查是否需要重排
        if (hscroll || vscroll)
        {
            this.rearrange(container, items, hscroll, vscroll);
        }
    };
        
    
});



//层叠布局类
$class(flyingon.Layout, function (base) {


    this.type = 'cascade';
    
    
    //排列布局
    this.arrange = function (container, items, hscroll, vscroll) {

        var x = container.arrangeLeft,
            y = container.arrangeTop,
            width = container.clientWidth,
            height = container.clientHeight,
            control,
            box;

        for (var i = 0, l = items.length; i < l; i++)
        {
            if (box = (control = items[i]).initViewBox(width, height))
            {
                control.measure(box, width, height);
                control.locate(box, x, y, width, height, container);
            }
        }
        
        //检查是否需要重排
        if (hscroll || vscroll)
        {
            this.rearrange(container, items, hscroll, vscroll);
        }
    };
    
    
});



//绝对定位布局类
$class(flyingon.Layout, function (base) {


    this.type = 'absolute';
    
    
    //排列布局
    this.arrange = function (container, items, hscroll, vscroll) {

        var x = container.arrangeLeft,
            y = container.arrangeTop,
            width = container.clientWidth,
            height = container.clientHeight,
            fn = flyingon.pixel,
            control,
            box,
            left,
            top;

        for (var i = 0, l = items.length; i < l; i++)
        {
            if (box = (control = items[i]).initViewBox(width, height))
            {
                left = x + fn(control.locationValue('left'), width);
                top = y + fn(control.locationValue('top'), height);
                
                control.measure(box, 0, 0, true, true);
                control.locate(box, left, top, 0, 0, container);
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
            
            for (var i = 0, l = this.length; i < l; i++)
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
flyingon.link = function (href, type, rel) {

    var dom = document.createElement('link');

    dom.href = href;
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






//Ajax类
$class('Ajax', flyingon.Async, function () {

    
    
    //请求的url
    this.url = '';
    
    //指定版本号
    this.version = '';

    //method
    this.method = 'GET';

    //text || json || xml
    this.dataType = 'text';

    //内容类型
    this.contentType = 'application/x-www-form-urlencoded';

    //自定义http头
    this.header = null;
    
    //是否异步
    this.async = true;
        
    //是否支持跨域资源共享(CORS)
    this.CORS = false;
    
    //jsonp回调名称
    this.jsonp = 'jsonp';
    
    //超时时间
    this.timeout = 0;
    

    
    this.send = function (url, options) {

        var list = [], //自定义参数列表
            data, 
            get,
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
            for (var i = 0, l = cache.length; i < l; i++)
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
              
        if ((get = /get|head|options/i.test(this.method)) && data)
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
            cache = get ? jsonp_get : jsonp_post;
        }
        else
        {
            cache = ajax_send;
        }
        
        cache(this, url, list, data);

        return this;
    };

    
    
    //发送ajax请求
    function ajax_send(self, url, list, data) {
    
        var xhr = self.xhr = new XMLHttpRequest(),
            cache;
        
        if (list.start)
        {
            url = url + list.start + list.join('&');
        }
              
        //CORS
        if (self.CORS)
        {
            //withCredentials是XMLHTTPRequest2中独有的
            if ('withCredentials' in xhr)
            {
                xhr.withCredentials = true;
            }
            else if (cache = window.XDomainRequest)
            {
                xhr = new cache();
            }
        }
        
        if ((cache = self.timeout) > 0)
        {
            self.__timer = setTimeout(function () {

                xhr.abort();
                self.fail('timeout');

            }, cache);
        }

        xhr.onreadystatechange = function () {

            ajax_done(self, xhr, url);
        };
        
        xhr.open(self.method, url, self.async);
          
        if (cache = self.header)
        {
            for (var name in cache)
            {
                xhr.setRequestHeader(name, cache[name]);
            }
        }

        xhr.setRequestHeader('Content-Type', self.contentType);

        if (data)
        {
            data = flyingon.encode(data);
            xhr.setRequestHeader('Content-Length', data.length);
        }

        xhr.send(data);
    };
    

    //处理响应结果
    function ajax_done(self, xhr, url) {

        var cache = xhr.readyState;

        if (cache === 4)
        {
            if (cache = self.__timer)
            {
                clearTimeout(cache);
                self.__timer = 0;
                cache = void 0;
            }

            if (xhr.status < 300)
            {
                switch (self.dataType)
                {
                    case 'json':
                        try
                        {
                            self.resolve(JSON.parse(xhr.responseText));
                        }
                        catch (e)
                        {
                            self.reject(e);
                        }
                        break;
                        
                    case 'xml':
                        self.resolve(xhr.responseXML);
                        break;
                        
                    default:
                        self.resolve(xhr.responseText);
                        break;
                }
            }
            else
            {
                self.reject(cache = xhr.statusText);
            }
            
            //结束处理
            ajax_end(self, url, cache);
            
            //清除引用
            self.xhr = self.onreadystatechange = null;
        }
        else
        {
            self.notify(cache);
        }
    };
    
    
    //ajax执行完毕
    function ajax_end(self, url, error) {
        
        var end = flyingon.Ajax.end;
        
        //执行全局ajax执行结束事件
        if (end)
        {
            for (var i = 0, l = end.length; i < l; i++)
            {
                end[i].call(self, url, error);
            }
        }
    };
        
    
    //jsonp_get
    function jsonp_get(self, url, list) {
        
        var target = jsonp_get,
            cache = target.cache || (target.cache = []),
            name = cache.pop() || 'flyingon_callback' + (++target.id || (target.id = 1));
        
        window[name] = function (data) {
        
            self.resolve(data);
            ajax_end(self, url);
        };
        
        list.push(self.jsonp || 'jsonp', '=', name);
        
        if (!self.version)
        {
            list.push('jsonp-version=' + (++target.version || (target.version = 1)));
        }
        
        flyingon.script(url = url + list.start + list.join('&'), function (src, error) {
            
            cache.push(name);

            if (error)
            {
                self.reject(error);
                ajax_end(self, url, error);
            }

            window[name] = void 0;
            this.parentNode.removeChild(this);
            
            self = null;
        });
    };
    
    
    //jsonp_post
    function jsonp_post(self, url, list, data) {
                
        var iframe = jsonp_iframe(),
            flag;
        
        //处理url
        list.push('jsonp=post');
        url = url + list.start + list.join('&');
                    
        function load() {
          
            if (flag)
            {
                //IE67可能需要设置成同源的url才能取值
                this.contentWindow.location = 'about:blank';

                jsonp_end(self, url, this.contentWindow.name);
                jsonp_iframe(this);

                flyingon.dom_off(this, 'load', load);
                self = iframe = list = data = null;
            }
            else
            {
                flag = 1;
                
                //解决IE6在新窗口打开的BUG
                this.contentWindow.name = this.name; 

                //动态生成表单提交数据
                jsonp_form(this, url, data, self.method);
            }
        };
        
        //IE6不能触发onload事件, 如果要兼容ie6, 需要使用attachEvent绑定事件
        flyingon.dom_on(iframe, 'load', load);
        
        iframe.src = 'about:blank';
        document.head.appendChild(iframe);
    };
    
    
    //获取或缓存iframe
    function jsonp_iframe(iframe) {
        
        var cache = jsonp_iframe.cache || (jsonp_iframe.cache = []);
        
        if (iframe)
        {
            cache.push(iframe);
            iframe.parentNode.removeChild(iframe);
        }
        else
        {
            iframe = cache.pop();
            
            if (!iframe)
            {
                iframe = document.createElement('iframe');
                iframe.name = 'jsonp-iframe';
            }
            
            return iframe;
        }
    };
    

    //生成jsonp提交表单
    function jsonp_form(iframe, url, data, method) {
        
        var array = ['<form id="form" enctype="application/x-www-form-urlencoded"'];
        
        array.push(' action="', url, '" method="', 'GET', '">'); //method || 'POST'
        
        for (var name in data)
        {
            array.push('<input type="hidden" name="', name, '"');
            
            if (typeof (name = data[name]) === 'string')
            {
                name = name.replace(/"/g, '\\"');
            }
            
            array.push(' value="', name, '" />');
        }
        
        array.push('</form>', '<script>form.submit();</script>');
        
        iframe.contentWindow.document.write(array.join(''));
    };
    

    //jsonp返回结果处理
    function jsonp_end(self, url, text) {

        try
        {
            self.resolve(JSON.parse(text));
            ajax_end(self, url);
        }
        catch (e)
        {
            self.reject(e);
            ajax_end(self, url, e);
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

    return new flyingon.Ajax().send(url, options);
};


//POST提交
//在IE6时会可能会出错, asp.net服务端可实现IHttpAsyncHandler接口解决些问题 
flyingon.ajaxPost = function (url, options) {

    options = options || {};
    options.method = 'POST';

    return new flyingon.Ajax().send(url, options);
};


//jsonp get提交
flyingon.jsonp = function (url, options) {

    options = options || {};
    options.dataType = 'jsonp';

    return new flyingon.Ajax().send(url, options);
};


//jsonp post提交
//服务器需返回 <script>window.name = 'xxx';</script> 形式的内容且不能超过2M大小
flyingon.jsonpPost = function (url, options) {

    options = options || {};
    options.dataType = 'jsonp';
    options.method = 'POST';

    return new flyingon.Ajax().send(url, options);
};
    



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

            for (var i = 0, l = items.length; i < l; i++)
            {
                if ((fn = items[i]) && !fn.disabled)
                {
                    if (fn.call(this, e) === false && e.returnValue !== false)
                    {
                        e.preventDefault();
                    }

                    if (e.cancelBubble)
                    {
                        break;
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
        
        return this;
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
        
        return this;
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

        var key = name.replace(regex, fn),
            css = name;

        if (!(key in style))
        {
            key = prefix + key.charAt(0).toUpperCase() + key.substring(1);
            
            if (key in style)
            {
                css = '-' + prefix + '-' + name;
            }
            else
            {
                key = css = '';
            }
        }

        return fixed[name] = {

            name: key,
            css: css
        };
    };


    //获取可用样式名
    //name: 要获取的样式名(css样式名, 以'-'分隔的样式名)
    flyingon.css_name = function (name, css) {

        return (fixed[name] || css_name(name))[css ? 'css' : 'name'];
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

    var dom = document.createElement('div');

    dom.style.cssText = 'position:absolute;overflow:hidden;top:-10000px;top:-10000px;';
    
    return function (fn, context) {

        var body = document.body;
        
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

                document.body.appendChild(dom);
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





/**
* 弹出层组件
* 
* 事件:
* open: 打开事件
* autoclosing: 自动关闭前事件(可取消)
* closing: 关闭前事件(可取消)
* closed: 关闭后事件
*/
$class('Popup', function () {



    //弹出层管理器
    var layers = [];

    //Dom事件类
    var Event = flyingon.DomEvent; 



    $constructor(function (dispose) {

        var dom = this.dom = document.createElement('div');

        dom.className = this.defaultClassName;
        dom.style.cssText = 'position:absolute;visibility:hidden;';
        
        this.__dispose = dispose;
    });


    
    
    //默认class名称
    this.defaultClassName = 'flyingon-popup';
    
    
    //指定class名 与html一样
    this.defineProperty('className', '', {

        set: 'this.dom.className = this.defaultClassName + " " + value;'
    });
    

    //引入class片段
    flyingon.ClassFragment(this);
    
    

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



//控件渲染器
$class('Renderer', function () {
    
    
    
    //dom容器
    var dom_host = document.createElement('div');
    
    var text_name = 'textContent';
    
    if (!(text_name in dom_host))
    {
        text_name = 'innerText';
    }
        
    
    
    //宽和高是否不包含边框
    this.__no_border = true;
    
    //宽和高是否不包含内边距
    this.__no_padding = true;
    
    //默认边框宽度
    this.__border_width = 0;
    
    //默认边框高度
    this.__border_height = 0;
    
    //默认内边距宽度
    this.__padding_width = 0;
    
    //默认内边距高度
    this.__padding_height = 0;
        
    
    //视图池最大数量
    this.maxPoolSize = 100;
    
        
    //默认样式文本
    this.cssText = 'position:absolute;overflow:auto;margin:0;';
    
    //默认使用border-box盒模型
    if (flyingon.css_name('box-sizing'))
    {
        this.cssText += flyingon.css_name('box-sizing', true) + ':border-box;';
    }
    
    
    
    //绑定绘制器
    this.bind = function (controlType) {
    
        for (var i = arguments.length - 1; i >= 0; i--)
        {
            if (controlType = arguments[i])
            {
                (controlType.prototype || controlType).renderer = this;
            }
        }
    };
    
    
    //绑定控件类绘制器
    this.bind(flyingon.Control);
    
    
    //创建dom模板
    this.template = function (html, check) {
        
        this.__template_ = [html, check];
    };
    
            
    
    //初始化渲染器,需返回view可视模型对象
    this.init = function (control) {
        
        var view = control.view = this.__view_pool.pop() || this.createView(control), 
            values, 
            cache;
        
        view.flyingon_control = control;

        if ((cache = control.__storage) && (cache = cache.className))
        {
            view.className = view.className + ' ' + cache;
        }
        
        if (values = control.__style_values)
        {
            cache = flyingon.css_value;
            
            for (var name in values)
            {
                cache(view, name, values[name]);
            }
        }
        
        if (values = control.__attribute_values)
        {
            for (name in values)
            {
                if ((cache = values[name]) !== false)
                {
                    view.setAttribute(name, cache);
                }
                else
                {
                    view.removeAttribute(name);
                }
            }
        }
        
        return view;
    };
    
    
    //创建视图
    this.createView = function (control) {
      
        return (this.__template || this.__init_template(control.defaultClassName)).cloneNode(true);
    };
    
            
    //获取绘制器模板
    this.__init_template = function (className, check) {
    
        var template = this.__template_,
            dom;
        
        if (template)
        {
            this.__template_ = void 0;
            
            if (dom = template[0])
            {
                dom_host.innerHTML = dom;
                
                if (dom = dom_host.children[0])
                {
                    dom_host.removeChild(dom);
                }
            }
        }
        
        this.__template = dom = dom || document.createElement('div');
        
        dom.className = (className || 'flyingon-Control') + (dom.className ? ' ' + dom.className : '');
        dom.style.cssText = this.cssText + dom.style.cssText;
        
        //检测盒模型
        (check || template && template[1]) && flyingon.dom_test(function (host) {

            check_box.call(this, host, dom.cloneNode(true));                
            host.innerHTML = '';

        }, this);
            
        return dom;
    };
    
    
    //创建默认模板
    this.__init_template(null, true);
    
    
    //检测盒模型
    function check_box(host, dom) {
        
        var style = dom.style,
            pixel = flyingon.pixel;

        host.appendChild(dom);

        style.width = '100px';
        style.padding = '10px';

        //宽和高是否不包含边框
        if (this.__no_border = dom.offsetWidth !== 100)
        {
            style.padding = '';
            style = dom.currentStyle || window.getComputedStyle(dom);

            //计算默认边框大小
            this.__border_width = pixel(style.borderLeftWidth) + pixel(style.borderRightWidth);
            this.__border_height = pixel(style.borderTopWidth) + pixel(style.borderBottomWidth);

            //计算默认内边距大小
            this.__padding_width = pixel(style.paddingLeft) + pixel(style.paddingRight);
            this.__padding_height = pixel(style.paddingTop) + pixel(style.paddingBottom);
        }
        else
        {
            this.__border_width = this.__border_height = this.__padding_width = this.__padding_height = 0;
        }
    };
    
    
    
    //设置视图class
    this.className = function (control, value) {
        
        this.view.className = value ? control.defaultClassName + ' ' + value : control.defaultClassName;
    };
    
    
    //设置视图样式
    this.style = function (control, name, value) {
        
        flyingon.css_value(control.view, name, value);
    };
    
    
    //设置视图属性
    this.attribute = function (control, name, value) {
        
        if (value !== false)
        {
            control.view.setAttribute(name, value);
        }
        else
        {
            control.view.removeAttribute(name);
        }
    };
    
    
    //设置视图内容
    this.text = function (control, text, isHtml) {
        
        if (isHtml)
        {
            control.view.innerHTML = text;
        }
        else
        {
            control.view[text_name] = text;
        }
    };
    
 
    
    //渲染控件
    this.render = function (control) {
      
        var box = control.viewBox,
            width = box.offsetWidth,
            height = box.offsetHeight,
            style = control.view.style,
            cache;
        
        //宽和高如果不包含边框则减去边框
        if (this.__no_border)
        {
            if ((cache = box.border) && cache.text)
            {
                width -= cache.width;
                height -= cache.height;
            }
            else
            {
                width -= this.__border_width;
                height -= this.__border_height;
            }
            
            //宽和高如果不包含内边距则减去内边距
            if (this.__no_padding)
            {
                if ((cache = box.padding) && cache.text)
                {
                    width -= cache.width;
                    height -= cache.height;
                }
                else
                {
                    width -= this.__padding_width;
                    height -= this.__padding_height;
                }
            }
        }
        
        style.left = box.offsetLeft + 'px';
        style.top = box.offsetTop + 'px';
        style.width = width + 'px';
        style.height = style.lineHeight = height + 'px';
    };
    
    
    
    //回收视图
    this.recycle = function (control) {

        var pool = this.__view_pool,
            view = control.view,
            cache;

        if (cache = view.parentNode)
        {
            cache.removeChild(view);
        }

        if (pool.length >= this.maxPoolSize)
        {
            return;
        }

        cache = this.__template;

        view.flyingon_control = null;
        view.className = cache.className;
        view.style.cssText = cache.style.cssText;

        if (cache = control.__attribute_values)
        {
            for (var name in values)
            {
                if (values[name] !== false)
                {
                    view.removeAttribute(name);
                }
            }
        }

        pool.push(view);
    };
    
    
    
    this.__class_init = function (Class, base) {
        
        //初始化渲染器的模板为null
        this.__template = null;
        
        //视图池
        this.__view_pool = [];
    };
   
    
});






//容器控件渲染器
$class('ContainerRenderer', flyingon.Renderer, function (base) {
    
    
    //临时节点
    var dom_host = document.createDocumentFragment();
    
    
    
    //设置渲染大小时不包含padding
    this.__no_padding = false;
    

    
    //绑定渲染器
    this.bind(flyingon.ContainerFragment, flyingon.Panel);
    
    
    
    //获取控件dom对象
    function to_dom(controls) {
        
        var control;
        
        if (controls[1])
        {
            var dom = dom_host,
                i = 0;

            while (control = controls[i++])
            {
                dom.appendChild(control.view || control.renderer.init(control));
            }
            
            return dom;
        }

        control = controls[0];
        return control.view || control.renderer.init(control);
    };
    
    
    this.append = function (control, children) {
        
        (control.view_body || control.view).appendChild(to_dom(children));
    };
    
    
    this.insert = function (control, index, children) {

        var dom = control.view_body || control.view;
        dom.insertBefore(to_dom(children), dom.children[index] || null);
    };
    
    
    this.remove = function (control, item, index) {
        
        (control.view_body || control.view).removeChild(item.view);
    };
    
    
    this.clear = function (control) {
        
        var parent = this.view_body || this.view,
            dom = parent.lastChild;
        
        while (dom)
        {
            parent.removeChild(dom);
            dom = dom.previousSibling;
        }
    };
    
    
    this.render = function (control) {
        
        var box = control.viewBox;
        
        if (box)
        {
            var dom = control.view_body || control.view,
                style = dom.style,
                hscroll = box.hscroll,
                vscroll = box.vscroll,
                children,
                div;
            
            base.render.call(this, control);
            
            //处理滚动条: 注overflow==='auto'在chrome下在未超出原滚动条时不会消失
            style.overflowX = hscroll ? 'scroll' : 'hidden';
            style.overflowY = vscroll ? 'scroll' : 'hidden';
                
            if (children = control.__children)
            {
                if (!children[0].view)
                {
                    this.append(control, children);
                }

                if (hscroll || vscroll)
                {
                    if ((div = dom.firstChild) && div.__scroll)
                    {
                        style = div.style;
                    }
                    else
                    {
                        dom.insertBefore(dom = document.createElement('div'), div || null);
                        dom.__scroll = true;

                        style = dom.style;
                        style.cssText = "position:absolute;overflow:hidden;margin:0;border:0;padding:0;width:1px;height:1px;visibility:hidden;";
                    }
                    
                    //使用positon:relatvie left,top或margin:bottom,right定位时在IE6,7不正常
                    //style.margin = height + 'px 0 0 ' + width + 'px';
                    style.left = (box.contentWidth - 1) + 'px';
                    style.top = (box.contentHeight - 1) + 'px';
                }

                this.renderChildren(control, children);
            }
        }
    };
    
    
    this.renderChildren = function (control, children) {
        
        for (var i = children.length - 1; i >= 0; i--)
        {
            children[i].update();
        }
    };

    
});




//计算单位换算关系
flyingon.dom_test(function (div) {

    var unit = flyingon.pixel_unit.unit;

    //计算单位换算列表
    div.style.cssText = 'position:absolute;overflow:scroll;border:0;padding:0;left:-10000em;top:-10000in;width:10000ex;height:100px;';

    unit.px = 1;
    unit.ex = div.offsetWidth / 10000;
    unit.em = unit.rem = -div.offsetLeft / 10000;

    unit.pt = (unit.pc = (unit['in'] = -div.offsetTop / 10000) / 6) / 12;
    unit.mm = (unit.cm = unit['in'] / 2.54) / 10;

    div.style.width = '100px';
    div.innerHTML = "<div style='position:relative;width:200px;height:200px;'></div>";

    //竖直滚动条宽度
    flyingon.vscroll_width = div.offsetWidth - div.clientWidth;

    //水平滚动条高度
    flyingon.hscroll_height = div.offsetHeight - div.clientHeight;

    div.innerHTML = '';

});



//宿主容器
(function () {
    
        
    var update_list = [];
    
    var update_delay;
    
    
    //更新
    function update() {
        
        var list = update_list,
            index = 0,
            item;
        
        while (item = list[index++])
        {
            item.update();
        }
        
        list.length = 0;
        
        if (index = update_delay)
        {
            clearTimeout(index);
            update_delay = 0;
        }
    };
    
    
    //延时更新
    flyingon.__delay_update = function (control, delay) {
      
        var list = update_list;
        
        if (control && list.indexOf(control) < 0)
        {
            list.push(control);
            
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
    
    
    
    //按根节点的方式重绘
    function update_root() {
        
        var dom = this.view || this.renderer.init(this),
            left = this.left(),
            top = this.top(),
            width = 0,
            height = 0,
            box;

        dom.style.position = 'relative';

        if (dom = dom.parentNode)
        {
            width = dom.clientWidth;
            height = dom.clientHeight;
        }
        
        box = this.initViewBox(width, height);

        this.measure(box, width, height, false);
        
        if (left)
        {
            left = flyingon.pixel(left);
            width = 0;
        }
        
        if (top)
        {
            top = flyingon.pixel(top);
            height = 0;
        }
        
        this.locate(box, left, top, width, height);
        this.Class.prototype.update.call(this);

        return this;
    };
    
 

    //显示控件至指定的dom
    flyingon.showControl = function (control, host) {

        if (control && !control.__parent && control.update !== update_root)
        {
            var dom = control.view || control.renderer.init(control);

            control.update = update_root;
            
            (host || document.body).appendChild(dom);
            flyingon.__delay_update(control, false);
        }
    };


    //隐藏控件
    flyingon.hideControl = function (control, dispose) {

        var dom;
        
        if (control && control.update === update_root)
        {
            delete control.update;

            if ((dom = control.view) && (parent = dom.parentNode))
            {
                parent.removeChild(dom);
            }

            if (parent = control.__parent)
            {
                parent.remove(control);
            }
            
            if (dispose !== false)
            {
                control.dispose();
            }
        }
    };

          
          
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
   
    var body = document.body;
    
    var on = flyingon.dom_on;
        
    var off = flyingon.dom_off;
        
    var MouseEvent = flyingon.MouseEvent;
        
    var KeyEvent = flyingon.KeyEvent;
    
    
        
    //查找与指定dom关联的控件
    flyingon.findControl = function (dom) {
        
        var control;
        
        while (dom)
        {
            if (control = dom.flyingon_control)
            {
                return control;
            }
            
            dom = dom.parentNode;
        }
    };
    
        
    function mouse_event(e) {
        
        var control = flyingon.findControl(e.target);
        
        if (control)
        {
            control.trigger(new MouseEvent(e));
        }
    };
    
    
    function key_event(e) {
        
        var control = flyingon.findControl(e.target);
        
        if (control)
        {
            control.trigger(new KeyEvent(e.target));
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

    
})();
