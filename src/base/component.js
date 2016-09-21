
//组件接口
$interface('IComponent', function () {
  
    

    var regex_binding = /"(?:\\"|[^"])*?"|'(?:\\'|[^'])*?'|null|true|false|undefined|\d+\w*|(\w+)|[^'"\w\s]+/g; //绑定表达式解析器 
              
    
    
    //定义id属性
    this.defineProperty('id', '');
    
    
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
        
        if (cache = this.__bindings)
        {
            writer.write_property('bindings', cache);
        }
    };
    

    //属性值变更方法
    this.__onpropertychange = function (name, value, oldValue) {
    
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
    
    
            
    this.deserialize_bindings = function (reader, values) {

        for (var name in values)
        {
            deserialize_binding(this, reader, name, values[name]);
        }
    };
    
    
    //数据绑定类
    function Binding(target, name, source, expression, twoway) {

        var bindings = target.__bindings || (target.__bindings = {}),
            keys = this.keys = [],
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
                    if (!keys[name])
                    {
                        keys[name] = true;
                        keys.push(name);
                    }

                    return 'source.get("' + name + '")';
                }

                cache = false; //表达式标记
                return text;
            });

            if (cache === false || !(this.expression = keys[0]))
            {
                twoway = false; //表达式不支持双向绑定
                this.get = new Function('source', 'return ' + expression);
            } 
        }
        else
        {
            (this.keys = {})[expression] = true;
        }

        this.twoway = twoway; //是否支持双向绑定 false:仅单向绑定
        
        if (keys.length)
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
    this.syncBinding = function (name, value) {
        
        var items = this.__to_bindings,
            item,
            cache;
        
        if (items)
        {
            for (var i = 0, _ = items.length; i < _; i++)
            {
                item = items[i];
                
                if (!name || item.keys[name])
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
    this.addBinding = function (name, source, expression, twoway) {
      
        if (name && source)
        {
            new Binding(this, name, source, expression, twoway !== false);
        }
        else
        {
            throw $errortext('flyingon', 'binding name error')
        }
    };
    
    
    //移除数据绑定
    this.removeBinding = function (name, source) {
      
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
    
        
    //销毁对象
    this.dispose = function () {

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
    
        
}, true);


