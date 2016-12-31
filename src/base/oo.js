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



