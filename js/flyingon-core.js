/*
* flyingon javascript library v0.0.1.0
* https://github.com/freeoasoft/flyingon
*
* Copyright 2014, yaozhengyang
* licensed under the LGPL Version 3 licenses
*/



//启用严格模式
'use strict';



//定义全局flyingon变量
var flyingon = flyingon || (flyingon = {

    version: '1.0.0',
    namespaceName: 'flyingon'
});



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
                target[name] = value && typeof value === 'object' ? extend(target[name], value) : value;
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


//检测对象是否一个数组
flyingon.isArray = Array.isArray || (function (fn) {

    return function (target) {

        return fn.call(target) === '[object Array]';
    };

})(Object.prototype.toString);


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


//当不存在JSON对象时扩展json解析器
//使用危险代码检测的方法(无危险代码则使用eval解析)实现json解析
flyingon.parseJSON = typeof JSON !== 'undefined' && JSON.parse || (function () {

    var regex1 = /[a-zA-Z_$]/,
        regex2 = /"(?:\\"|[^"])*?"|null|true|false|\d+[Ee][-+]?\d+/g;

    return function (text) {

        if (typeof text === 'string')
        {
            if (regex1.test(text.replace(regex2, '')))
            {
                flyingon.raise('flyingon', 'json_parse_error');
            }

            return new Function('return ' + text)();
        }

        return text;
    };

})();



//名字空间,类,属性及事件
(function (global, flyingon) {
    

    
    var has = {}.hasOwnProperty,
        
        create = flyingon.create,
        
        extend = flyingon.extend,
    
        regex_namespace = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/, //名字空间名称检测

        namespace_stack = [], //名字空间栈
    
        regex_interface = /^I[A-Z][A-Za-z0-9]*$/,   //接口名正则表式验证
        
        regex_class = /^[A-Z][A-Za-z0-9]*$/, //类名正则表式验证

        class_list = flyingon.__class_list, //已注册类型集合,需防重复加载

        class_stack = [],  //类栈(支持类的内部定义类)
        
        class_data; //当前类定义信息(支持类的内部定义类)



    
    //处理重复加载问题且输出flyingon全局变量
    if (global.flyingon)
    {
        flyingon = extend(global.flyingon, flyingon);
    }
    else
    {
        global.flyingon = flyingon;
    }
    
    
    //防止重复加载
    if (!class_list)
    {
        flyingon.__class_list = class_list = create(null);
    }
    
    

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
    
    
    
    //抛出异常方法
    flyingon.raise = function (type, key) {
    
        throw '[' + type + ']' + key;
    };
    
            
    
    //定义或切换名字空间
    function $namespace(name, callback) {

        var target, items, cache;

        //生成名字空间
        if (typeof name === 'string')
        {
            if (regex_namespace.test(name))
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
            if (!(cache = global.$require) || 
                !(cache = cache.callback) || 
                !cache(load_namespace, [target, callback]))
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
            flyingon.raise('flyingon', 'interface_name_error');
        }
        
        var prototype = create(null),
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
                flyingon.raise('flyingon', 'interface_can_not_new');
            }
            
            if (!target)
            {
                flyingon.raise('flyingon', 'interface_target_error');
            }
            
            extend_prototype(target, prototype);
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
        
        var storage = this.__storage || (this.__storage = create(this.__defaults));
        return name ? storage[name] : storage;
    };
    
        
    //获取指定名称的值(数据绑定用)
    function get(name, context) {
        
        var fn = this[name];
        
        if (fn && typeof fn === 'function')
        {
            return fn.call(this);
        }
        
        return (this.__storage || this.__defaults)[name];
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
            (this.__storage || (this.__storage = create(this.__defaults)))[name] = value;
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
    global.$interface = $interface;
    global.$class = $class;
    global.$constructor = $constructor;
    global.$static = $static;
    


})(typeof global !== 'undefined' ? global : this, flyingon);




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
    };


    //禁止默认事件
    this.preventDefault = function () {

        this.defaultPrevented = true;
    };


    //阻止事件冒泡及禁止默认事件
    this.stopImmediatePropagation = function () {

        this.cancelBubble = this.defaultPrevented = true;
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
    

    
    this.send = function (url, options) {

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
            cache = data ? jsonp_post : jsonp_get;
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
                        self.resolve(flyingon.parseJSON(xhr.responseText));
                        break;
                        
                    case 'script':
                        flyingon.globalEval(xhr.responseText); //全局执行js避免变量冲突
                        self.resolve(self.url);
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
            items = target.items || (target.items = []),
            name = items.pop() || 'flyingon_jsonp_get' + (++target.id || (target.id = 1));
        
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

            window[name] = void 0;
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

        list.push('jsonp=flyingon_jsonp_post' + 1);
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
            
            if (text = text.match(/flyingon_jsonp_post(\([\s\S]+\))/))
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


//jsonp get提交
flyingon.jsonpPost = function (url, options) {

    options = options || {};
    options.dataType = 'jsonp';
    options.method = 'POST';
    options.data = { a: 1, b: 2, c: 3 };

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

        require_files = window.require_files = create(null), //所有资源文件集合加载状态 0:未加载 1:已请求 2:已响应 3:已执行

        require_back = window.require_back = create(null), //资源回溯关系
        
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
                    flyingon.ajax(file, {
                        
                        dataType: 'script'
                        
                    }).done(load_done).fail(function () {

                        load_done(this.url);
                    });
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
                list.file = null;
                
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

        //处理完毕则移除回溯关系
        if (!items.length)
        {
            delete back[file];
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


    
