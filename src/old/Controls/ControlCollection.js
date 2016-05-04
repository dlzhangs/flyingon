
//控件集合接口
flyingon.IControlCollection = function (prototype, type) {



    var splice = Array.prototype.splice;



    $constructor(function (owner) {

        this.owner = owner;

    });



    //扩展集合接口
    flyingon.ICollection(prototype);



    //添加子项
    prototype[".append"] = function () {

        for (var i = 0, _ = arguments.length; i < _; i++)
        {
            validate(this, arguments[i]);
        }


    };


    //在指定位置插入子项
    prototype[".insert"] = function (index, item) {

        for (var i = 1, _ = arguments.length; i < _; i++)
        {
            validate(this, item = arguments[i]);
        }

    };


    //移除指定子项
    prototype[".remove"] = function (item) {

        var owner = this.owner;

        remove_item(owner, item);
        owner.update(true);
    };


    //移除指定位置的子项
    prototype[".removeAt"] = function (index, length) {

        var owner = this.owner;

        for (var i = 0; i < length; i++)
        {
            remove_item(owner, this[index + i]);
        }

        owner.update(true);
    };


    //清除
    prototype[".clear"] = function () {

        var owner = this.owner;

        for (var i = 0, _ = this.length; i < _; i++)
        {
            remove_item(owner, this[i]);
        }

        owner.update(true);
    };


    //添加进集合时进行验证
    function validate(target, item) {

        if (item instanceof type)
        {
            var owner = target.owner,
                oldValue = item[".parent"];

            if (oldValue) //从原有父控件中删除
            {
                if (oldValue !== owner)
                {
                    item.remove();
                }
                else
                {
                    splice.call(target, target.indexOf(item), 1);
                }
            }

            //添加上下级关系
            item[".parent"] = owner;
            item.__ownerWindow = owner.__ownerWindow;

            //非初始化状态则触发事件
            if (item.__initializing)
            {
                item.__initializing = false;
            }
            else
            {
                item.trigger(new flyingon.PropertyChangeEvent("parent", owner, oldValue));
                owner.update(true);
            }

            return true;
        }

        throw new flyingon.Exception("只能添加" + type.xtype + "类型的子控件!");
    };


    //移除子项
    function remove_item(parent, item) {

        var dom = item.dom;

        item[".parent"] = null;

        if (dom && dom.parentNode)
        {
            dom.parentNode.removeChild(dom); //IE无法清除dom.parentNode对象,存在内存泄漏
            clear_cache(item); //清除缓存
        }

        //非初始化状态则触发事件
        if (!item.__initializing)
        {
            item.trigger(new flyingon.PropertyChangeEvent("parent", null, parent));
        }
    };


    //清除控件缓存
    function clear_cache(item) {

        //清空缓存及重置样式
        item.__ownerWindow = item["y.on.all"] = item.__arrange_index = item.__css_types = null;
        item.__update_dirty = 1;

        if ((item = item.__children) && item.length > 0)
        {
            for (var i = 0, _ = item.length; i < _; i++)
            {
                clear_cache(item[i]);
            }
        }
    };


};



//控件集合
$class("ControlCollection", function (prototype) {



    //扩展控件集合接口
    flyingon.IControlCollection(prototype, flyingon.Control);


});

