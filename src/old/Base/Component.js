


//可序列化接口
flyingon.ISerializable = function () {


    //自定义序列化
    this.serialize = function (writer) {

        writer.write_properties(this);
    };


    //自定义反序列化
    this.deserialize = function (reader, data) {

        reader.read_properties(this, data);
    };

};





//组件接口
flyingon.IComponent = function (prototype) {




    var uniqueId = flyingon.uniqueId;




    //id
    prototype.defineProperty("id", "");



    prototype[".define.setter.after"] = function (data, attributes) {

        //数据绑定
        data.push("\n\n\t"
            + "if (this.__bindings_fn && name in this.__bindings_fn)\n\t"
            + "{\n\t\t"
                + "flyingon.binding(this, name);\n\t"
            + "}");

        //控件刷新
        if (attributes.layout) //需要重新布局
        {
            data.push("\n\n\t");
            data.push("this.__update_dirty = 1;\n\t");
            data.push("this.__arrange_dirty = true;\n\t");
            data.push("(this['.parent'] || this).update(true);");
        }
        else if (attributes.arrange) //是否需要重新排列
        {
            data.push("\n\n\t");
            data.push("this.update(true);");
        }
        else if (attributes.update)
        {
            data.push("\n\n\t");
            data.push("this.update();");
        }
    };



    //绑定数据
    prototype.binding = function (name) {

        flyingon.binding(this, name);
    };


    //设置绑定
    prototype.setBinding = function (name, source, expression, setter) {

        if (name)
        {
            new flyingon.DataBinding(this, name).init(source, expression || name, setter);
        }
        else
        {
            throw new flyingon.Exception("\"name\" not allow null!");
        }

        return this;
    };


    //清除绑定
    prototype.clearBinding = function (name) {

        var bindings = this[".bindings"];

        if (bindings)
        {
            if (name)
            {
                if (name in bindings)
                {
                    bindings[name].dispose();
                }
            }
            else
            {
                for (var name in bindings)
                {
                    bindings[name].dispose();
                }
            }
        }

        return this;
    };



    //记录IProperty的序列化及反序列化方法
    var serialize = prototype.serialize,
        deserialize = prototype.deserialize;


    //自定义序列化
    prototype.serialize = function (writer) {

        serialize.call(this, writer);

        //序列化绑定
        if (this[".bindings"])
        {
            writer.write_bindings(this[".bindings"]);
        }

        //序列化事件
        if (this[".events"])
        {
            writer.write_events(this[".events"]);
        }

        return this;
    };


    //自定义反序列化
    prototype.deserialize = function (reader, data) {

        deserialize.call(this, reader, data);

        //同步绑定源
        if (this.__binding_source)
        {
            flyingon.binding(this);
        }

        return this;
    };


    //反序列化绑定
    prototype.deserialize_bindings = function (reader, name, value) {

        reader.read_bindings(this, value);
    };


    //反序列化事件
    prototype.deserialize_events = function (reader, name, value) {

        if (this[".events"] = value)
        {
            for (var name in value)
            {
                this.on(name, value[name]);
            }
        }
    };



    //销毁
    prototype.dispose = function () {

        var bindings = this[".bindings"];

        if (bindings)
        {
            for (var name in bindings)
            {
                bindings[name].dispose();
            }
        }

        return this;
    };


};




//集合类接口
flyingon.ICollection = function (prototype) {



    //引入数组的方法
    var push, splice, slice;


    //子项数
    prototype.length = 0;


    //引入数组方法
    (function (Array) {


        push = Array.push;

        splice = Array.splice;

        slice = Array.slice;

        prototype.indexOf = Array.indexOf;

        prototype.lastIndexOf = Array.lastIndexOf;


    })(Array.prototype);



    //修改子项索引
    prototype.change_index = function (old_index, new_index) {

        var item;

        if (old_index !== new_index && (item = this[old_index]))
        {
            splice.call(this, old_index, 1);

            if (new_index > this.length)
            {
                new_index = this.length;
            }

            splice.call(this, new_index, 0, item);
        }
    };


    //添加子项
    prototype.append = function (item) {

        if (arguments.length > 0 && this[".append"].apply(this, arguments) !== false)
        {
            push.apply(this, arguments);
        }
    };


    //在指定位置插入子项
    prototype.insert = function (index, item) {

        var length = arguments.length;

        if (length > 1)
        {
            if (index < 0)
            {
                index = 0;
            }
            else if (index >= this.length)
            {
                index = this.length;
            }

            if (this[".insert"].apply(this, arguments) !== false)
            {
                if (length === 2)
                {
                    splice.call(this, index, 0, item);
                }
                else
                {
                    for (var i = 1; i < length; i++)
                    {
                        splice.call(this, index++, 0, arguments[i]);
                    }
                }
            }
        }
    };


    //移除指定子项
    prototype.remove = function (item) {

        var index;

        if ((index = this.indexOf(item)) >= 0 && this[".remove"](item) !== false)
        {
            splice.call(this, index, 1);
        }
    };


    //移除指定位置的子项
    prototype.removeAt = function (index, length) {

        if (this.length > index)
        {
            if (!(length > 0))
            {
                length = this.length - index;
            }

            if (this[".removeAt"](index, length) !== false)
            {
                splice.call(this, index, length);
            }
        }
    };


    //清除
    prototype.clear = function () {

        var length = this.length;

        if (length > 0 && this[".clear"]() !== false)
        {
            splice.call(this, 0, length);
        }
    };



    //默认处理
    prototype[".append"] = prototype[".insert"] = prototype[".remove"] = prototype[".removeAt"] = prototype[".clear"] = function () {

        if (this.change)
        {
            this.change.apply(this, arguments);
        }
    };


};


