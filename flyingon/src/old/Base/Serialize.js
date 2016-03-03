
$class("SerializeReader", function (prototype) {



    var class_list = flyingon.__class_list;



    prototype.deserialize = function (data, deserialize_type) {

        if (data)
        {
            if (typeof data === "string")
            {
                data = flyingon.parseJSON(data);
            }

            data = this[Array.isArray(data) ? "read_array" : "read_object"](data, deserialize_type);
            this.complete();
        }

        return data;
    };


    //序列化完毕后执行方法(处理绑定关系)
    prototype.complete = function () {

        var source_list = this.__source_list,
            bindings = this.__binding_list,
            length,
            value;

        if (source_list)
        {
            this.__source_list = null;
        }
        else
        {
            source_list = {}
        }

        if (bindings && (length = bindings.length) > 0)
        {
            this.__binding_list = null;

            for (var i = 0; i < length; i++)
            {
                value = bindings[i];
                new flyingon.DataBinding(value.target, value.name).init(source_list[value.source] || null, value.expression, value.setter);
            }
        }
    };




    prototype.read_value = function (value, deserialize_type) {

        if (value && typeof value === "object")
        {
            return this[Array.isArray(value) ? "read_array" : "read_object"](value, deserialize_type);//复制对象(不使用原有对象以防止多重引用)
        }

        return value;
    };


    prototype.read_bool = function (value) {

        return !!value;
    };


    prototype.read_number = function (value) {

        return +value || 0;
    };


    prototype.read_string = function (value) {

        return value == null ? "" : "" + value;
    };


    prototype.read_function = function (value) {

        return typeof value === "function" ? value : eval("(function(){return " + value + "})()");
    };


    prototype.read_object = function (value, deserialize_type) {

        if (value != null)
        {
            var target, cache;

            if (value.xtype && (cache = class_list[value.xtype]))
            {
                target = new cache();
            }
            else
            {
                target = deserialize_type ? new deserialize_type() : {};
            }

            if (cache = value.__id__) //记录绑定源
            {
                (this.__source_list || (this.__source_list = {}))[cache] = target;
            }

            if (target.deserialize)
            {
                target.deserialize(this, value);
            }
            else
            {
                this.read_properties(target, value);
            }

            return target;
        }

        return value;
    };


    prototype.read_properties = function (target, value) {

        var names = Object.getOwnPropertyNames(value),
            name;

        for (var i = 0, _ = names.length; i < _; i++)
        {
            if ((name = names[i]) !== "__id__")
            {
                target[name] = this.read_value(value[name]);
            }
        }
    };


    prototype.read_array = function (value, deserialize_type) {

        if (value != null)
        {
            var result = [];

            for (var i = 0, _ = value.length; i < _; i++)
            {
                result.push(this.read_value(value[i], deserialize_type));
            }

            return result;
        }

        return value;
    };


    prototype.read_bindings = function (target, data) {

        var result = target[".bindings"] = {};

        for (var name in data)
        {
            var value = data[name];

            if (this.__source_list && value.source in this.__source_list) //找到源则直接生成数据绑定
            {
                new flyingon.DataBinding(target, name).init(this.__source_list[value.source], value.expression, value.setter);
            }
            else //否则先记录绑定信息待以后处理
            {
                value.target = target;
                value.name = name;
                (this.__binding_list || (this.__binding_list = [])).push(value);
            }
        }

        return result;
    };


});



$class("SerializeWriter", function (prototype) {



    prototype.length = 0;



    prototype.serialize = function (target) {

        this[Array.isArray(target) ? "write_array" : "write_object"](null, target);
        return this.toString();
    };




    function write_name(name) {

        if (this[this.length - 1] !== "{")
        {
            this[this.length++] = ",";
        }

        this[this.length++] = "\"" + name + "\":";
    };


    prototype.write_value = function (name, value) {

        if (value == null)
        {
            this.write_null(name, value);
        }
        else
        {
            switch (typeof value)
            {
                case "boolean":
                    this.write_bool(name, value);
                    break;

                case "number":
                    this.write_number(name, value);
                    break;

                case "string":
                    this.write_string(name, value);
                    break;

                case "function":
                    this.write_function(name, value);
                    break;

                case "object":
                    switch (typeof value)
                    {
                        case "boolean":
                            this.write_bool(name, value);
                            break;

                        case "number":
                            this.write_number(name, value);
                            break;

                        case "string":
                            this.write_string(name, value);
                            break;

                        default:
                            if (Array.isArray(value))
                            {
                                this.write_array(name, value);
                            }
                            else
                            {
                                this.write_object(name, value);
                            }
                            break;
                    }
                    break;
            }
        }
    };


    prototype.write_null = function (name, value) {

        if (name)
        {
            write_name.call(this, name);
        }

        this[this.length++] = "" + value;
    };


    prototype.write_bool = function (name, value) {

        if (name)
        {
            write_name.call(this, name);
        }

        this[this.length++] = value ? "true" : "false";
    };


    prototype.write_number = function (name, value) {

        if (name)
        {
            write_name.call(this, name);
        }

        this[this.length++] = "" + (+value || 0);
    };


    prototype.write_string = function (name, value) {

        if (name)
        {
            write_name.call(this, name);
        }

        this[this.length++] = "\"" + ("" + value).replace(/\"/g, "\\\"") + "\"";
    };


    prototype.write_function = function (name, fn) {

        if (name)
        {
            write_name.call(this, name);
        }

        this[this.length++] = "" + fn;
    };


    prototype.write_object = function (name, target) {

        if (name)
        {
            write_name.call(this, name);
        }

        if (target != null)
        {
            this[this.length++] = "{";

            name = target.xtype;

            if ("__bindings_fn" in target) //如果是数据绑定源则序列化对象标记
            {
                this[this.length++] = "\"__id__\":" + (target.__id__ || (target.__id__ = this.length));

                if (name)
                {
                    this[this.length++] = ",";
                }
            }

            if (name)
            {
                this[this.length++] = "\"xtype\":\"" + name + "\"";
            }

            if ("serialize" in target)
            {
                target.serialize(this);
            }
            else
            {
                this.write_properties(target);
            }

            this[this.length++] = "}";
        }
        else
        {
            this[this.length++] = "" + target;
        }
    };


    //序列化对象属性(默认不序列化原型的属性)
    prototype.write_properties = function (target, names) {

        var name;

        names = names || Object.getOwnPropertyNames(target);

        for (var i = 0, _ = names.length; i < _; i++)
        {
            this.write_value(name = names[i], target[name]);
        }
    };


    prototype.write_array = function (name, array) {

        if (name)
        {
            write_name.call(this, name);
        }

        if (array != null)
        {
            this[this.length++] = "[";

            for (var i = 0, _ = array.length; i < _; i++)
            {
                if (i > 0)
                {
                    this[this.length++] = ",";
                }

                this.write_value(null, array[i]);
            }

            this[this.length++] = "]";
        }
        else
        {
            this[this.length++] = "" + value;
        }
    };


    prototype.write_bindings = function (bindings) {

        if (bindings)
        {
            write_name.call(this, "bindings");

            this[this.length++] = "{";

            for (var name in bindings)
            {
                var binding = bindings[name];

                write_name.call(this, name);

                this[this.length++] = "{";

                binding.source && this.write_number("source", binding.source.__id__ || (binding.source.__id__ = this.length));
                binding.expression && this.write_string("expression", binding.expression);
                binding.setter && this.write_string("setter", binding.setter);

                this[this.length++] = "}";
            }

            this[this.length++] = "}";
        }
    };


    prototype.write_events = function (events) {

        if (events)
        {
            write_name.call(this, "events");

            this[this.length++] = "{";

            for (var name in events)
            {
                this.write_function(name, events[name]);
            }

            this[this.length++] = "}";
        }
    };



    prototype.toString = function () {

        return [].join.call(this, "");
    };


});



