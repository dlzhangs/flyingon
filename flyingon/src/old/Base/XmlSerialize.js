
//xml parse
/*

XH中的js操作dom原属差不多,不过没有getElementById,只有getElementsByTagName

xmlDoc.documentElement.childNodes(0).nodeName,可以得到这个节点的名称
xmlDoc.documentElement.childNodes(0).nodeValue,可以得到这个节点的值
xmlDoc.documentElement.childNodes(0).hasChild,可以判断是否有子节点

可通过使用getElementsByTagName(xPath)的方法对节点进行访问

*/



flyingon.parseXML = window.DOMParser ? function (data) {

    return new type().parseFromString(data, "text/xml").documentElement;

} : function (data) {

    var result = new ActiveXObject("Microsoft.XMLDOM");

    result.async = "false";
    result.loadXML(data);

    return result.documentElement;
};




$class("XmlSerializeReader", function (prototype) {



    var class_list = flyingon.__class_list;



    function parse(node) {

        var type = node.getAttribute("xtype"),
            target,
            items,
            item;

        switch (type || "string")
        {
            case "undefined": //undefined
                return void 0;

            case "null": //null
                return null;

            case "boolean": //boolean
                return node.getAttribute("value") === "1";

            case "number": //number
                return +node.getAttribute("value") || 0;

            case "string": //string
                return node.getAttribute("value") || "";

            case "array": //array
                target = [];
                items = node.childNodes;

                for (var i = 0, _ = items.length; i < _; i++)
                {
                    target.push(parse(items[i]));
                }

                return target;

            default:
                target = type === "object" ? {} : { xtype: type };
                items = node.childNodes;

                for (var i = 0, _ = items.length; i < _; i++)
                {
                    target[(item = items[i]).tagName] = parse(item);
                }

                return target;
        }
    };



    prototype.deserialize = function (data, deserialize_type) {

        if (data)
        {
            if (typeof data === "string")
            {
                data = flyingon.parseXml(data);
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


$class("XmlSerializeWriter", flyingon.SerializeWriter, function (prototype, base) {



    var encode = flyingon.encode_xml;



    prototype.write_null = function (name, value) {

        this[this.length++] = "<" + name + " t=\"" + (value === null ? "n" : "u") + "\"/>";
    };


    prototype.write_bool = function (name, value) {

        this[this.length++] = "<" + name + " t=\"b\" v=\"" + (value ? "1" : "0") + "\"/>";
    };


    prototype.write_number = function (name, value) {

        this[this.length++] = "<" + name + " t=\"d\" v=\"" + (+value || 0) + "\"/>";
    };


    prototype.write_string = function (name, value) {

        this[this.length++] = "<" + name + " t=\"s\" v=\"" + encode("" + value) + "\"/>";
    };


    prototype.write_function = function (name, fn) {

        this[this.length++] = "<" + name + " t=\"f\" v=\"" + encode("" + fn) + "\"/>";
    };


    prototype.write_object = function (name, target) {

        if (target != null)
        {
            this[this.length++] = "<" + (name = name || "xml") + " t=\"" + (target.xtype || "o") + "\">";

            if ("__bindings_fn" in target) //如果是数据绑定源则序列化对象标记
            {
                this[this.length++] = "<__id__ t=\"d\" v=\"" + (target.__id__ || (target.__id__ = this.length)) + "\"/>";
            }

            if ("serialize" in target)
            {
                target.serialize(this);
            }
            else
            {
                this.write_properties(target);
            }

            this[this.length++] = "</" + name + ">";
        }
        else
        {
            this.write_null(name, target);
        }
    };


    prototype.write_array = function (name, array) {

        if (array != null)
        {
            this[this.length++] = "<" + (name || "xml") + " t=\"a\">";

            for (var i = 0, _ = array.length; i < _; i++)
            {
                this.write_value("item", array[i]);
            }

            this[this.length++] = "</" + name + ">";
        }
        else
        {
            this.write_null(name, array);
        }
    };


    prototype.write_bindings = function (bindings) {

        if (bindings)
        {
            this[this.length++] = "<bindings t=\"o\">";

            for (var name in bindings)
            {
                var binding = bindings[name];

                this[this.length++] = "<" + name + " t=\"o\">";

                binding.source && this.write_number("source", binding.source.__id__ || (binding.source.__id__ = this.length));
                binding.expression && this.write_string("expression", binding.expression);
                binding.setter && this.write_string("setter", binding.setter);

                this[this.length++] = "</" + name + ">";
            }

            this[this.length++] = "</bindings>";
        }
    };


    prototype.write_events = function (events) {

        if (events)
        {
            this[this.length++] = "<events t=\"o\">";

            for (var name in events)
            {
                this.write_function(name, events[name]);
            }

            this[this.length++] = "</events>";
        }
    };


});

