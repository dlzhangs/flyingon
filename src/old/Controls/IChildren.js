
//子控件接口
//注: 需包含名为dom_children的dom对象作为子控件父dom
flyingon.IChildren = function (prototype, base) {



    

    //是否需要重新排列子控件
    prototype.__arrange_dirty = true;


    //是否需要重新处理子dom
    prototype.__dom_dirty = true;




    //dom元素模板
    prototype.create_dom_template("div", null, "<div style='position:relative;margin:0;border:0;padding:0;left:0;top:0;overflow:hidden;'></div>");




    //子控件集合
    flyingon.defineProperty(prototype, "children", function () {

        return this.__children || (this.__children = new flyingon.ControlCollection(this));
    });




    //添加子控件
    prototype.appendChild = function (item) {

        var children = this.__children || this.get_children();

        children.append.apply(children, arguments);

        return this;
    };


    //在指定位置插入子控件
    prototype.insertChild = function (index, item) {

        var children = this.__children || this.get_children();

        children.insert.apply(children, arguments);

        return this;
    };


    //移除子控件
    prototype.removeChild = function (item) {

        var children;

        if (children = this.__children)
        {
            children.remove.call(children, item);
        }

        return this;
    };


    //移除指定位置的子控件
    prototype.removeAt = function (index, length) {

        var children;

        if (children = this.__children)
        {
            children.removeAt.call(children, index, length);
        }

        return this;
    };



    //渲染控件
    prototype.render = function () {

        switch (this.__update_dirty)
        {
            case 1:
                flyingon[".compute_css"](this);
                render_children.call(this);
                break;

            case 2:
                render_children.call(this);
                break;
        }
    };


    //渲染子控件
    function render_children() {

        var items = this.__children;

        if (items && items.length > 0)
        {
            var width = this.clientWidth,
                height = this.clientHeight,
                cache;

            //重排
            if (this.__arrange_dirty || this.__arrange_width !== width || this.__arrange_height !== height)
            {
                if (width > 0 && height > 0)
                {
                    //处理子dom
                    if (this.__dom_dirty)
                    {
                        cache = document.createDocumentFragment();

                        for (var i = 0, _ = items.length; i < _; i++)
                        {
                            cache.appendChild(items[i].dom);
                        }

                        this.dom_children.appendChild(cache);
                        this.__dom_dirty = false;
                    }

                    this.arrange(width, height);
                    this.__arrange_dirty = false;
                }

                this.__arrange_width = width;
                this.__arrange_height = height;
            }

            //渲染子控件
            this.render_children();
        }

        this.__update_dirty = 0;
    };



    //渲染子控件
    prototype.render_children = function () {

        var items = this.__children,
            length;

        if (items && (length = items.length) > 0)
        {
            for (var i = 0; i < length; i++)
            {
                items[i].render();
            }
        }
    };



    //当前布局类型
    prototype.__layout = flyingon.layouts["column3"];


    //测量自动大小(需返回width及height的变化量)
    prototype[".measure_auto"] = function (box) {

        var dom = this.dom_children.parentNode,
            style = this.__compute_style,
            value = style.fontSize; //记录原来的字体大小

        this[".measure_client"](box); //计算客户区大小

        this.render();

        if (style.fontSize !== value)
        {
            style.fontSize = value;
        }

        return {

            width: box.auto_width ? this.contentWidth - this.clientWidth : 0,
            height: box.auto_height ? this.contentHeight - this.clientHeight : 0
        };
    };


    //排列子控件
    prototype.arrange = function (width, height) {

        this.__layout[".arrange"](this, width, height);
    };





    //隐藏dom暂存器
    var hide_dom = document.createDocumentFragment();


    //隐藏子项
    prototype[".hide"] = function (item) {

        if (item.dom.parentNode !== hide_dom)
        {
            hide_dom.appendChild(item.dom);

            item.__visible = false;
            this.__dom_dirty = true;
        }
    };


    //隐藏指定索引后的子项
    prototype[".hide_after"] = function (items, index) {

        var item;

        for (var i = index, _ = items.length; i < _; i++)
        {
            if ((item = items[i]).dom !== hide_dom)
            {
                hide_dom.appendChild(item.dom);

                item.__visible = false;
                this.__dom_dirty = true;
            }
        }
    };




    //复制生成新控件
    prototype.copy = function () {

        var result = base.copy.call(this),
            items = this.__children,
            length;

        if (items && (length = items.length) > 0)
        {
            var children = result.get_children();

            for (var i = 0; i < length; i++)
            {
                children.append(items[i].copy());
            }
        }

        return result;
    };



    //自定义序列化
    prototype.serialize = function (writer) {

        var children = this.__children;

        base.serialize.call(this, writer);

        if (children && children.length > 0)
        {
            writer.write_array("children", children);
        }
    };


    prototype.deserialize_children = function (reader, name, value) {

        if (value)
        {
            var children = this.get_children(),
                type = this.deserialize_xtype;

            for (var i = 0, _ = value.length; i < _; i++)
            {
                children.append(reader.read_object(value[i], type));
            }
        }
    };


    prototype.deserialize_from_dom = function (dom, dom_wrapper) {

        var children = dom.children,
            cache = document.createDocumentFragment(),
            type = this.deserialize_xtype,
            item;

        for (var i = 0, _ = children.length; i < _; i++)
        {
            this.appendChild(item = dom_wrapper(children[i], type));
            cache.appendChild(item.dom);
        }

        this.dom_children.appendChild(cache);
        this.__dom_dirty = false;
    };



    prototype.dispose = function () {

        var children = this.__children;

        if (children)
        {
            for (var i = 0, _ = children.length; i < _; i++)
            {
                children[i].dispose();
            }
        }

        base.dispose.call(this);
    };



};

