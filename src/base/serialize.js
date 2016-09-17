
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

