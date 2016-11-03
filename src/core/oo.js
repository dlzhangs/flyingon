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



