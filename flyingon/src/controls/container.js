/*

$class('IContainerControl', function (self) {




    //是否需要重新排列子控件
    self.__arrange_dirty = true;


    //是否需要重新处理子dom
    self.__dom_dirty = true;




    //dom元素模板
    self.create_dom_template('<div><div style="position:relative;margin:0;border:0;padding:0;left:0;top:0;overflow:hidden;"></div></div>');



    self.defineProperty('layout', '');
    
    

    //子控件集合
    self.defineProperty('children', function () {

        return this.__children || (this.__children = new flyingon.ControlCollection(this));
    });



    //添加子控件
    self.appendChild = function (item) {

        var children = this.__children || this.children();

        children.append.apply(children, arguments);

        return this;
    };


    //在指定位置插入子控件
    self.insertChild = function (index, item) {

        var children = this.__children || this.children();

        children.insert.apply(children, arguments);

        return this;
    };


    //移除子控件
    self.removeChild = function (item) {

        var children;

        if (children = this.__children)
        {
            children.remove.call(children, item);
        }

        return this;
    };


    //移除指定位置的子控件
    self.removeAt = function (index, length) {

        var children;

        if (children = this.__children)
        {
            children.removeAt.call(children, index, length);
        }

        return this;
    };



    //渲染控件
    self.render = function () {

        switch (this.__update_dirty)
        {
            case 1:
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
    self.render_children = function () {

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
    self.__layout = flyingon.layouts.column3;


    //测量自动大小(需返回width及height的变化量)
    self.__measure_auto = function (box) {

        var dom = this.dom_children.parentNode,
            style = this.__compute_style,
            value = style.fontSize; //记录原来的字体大小

        this.__measure_client(box); //计算客户区大小

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
    self.arrange = function (width, height) {

        this.__layout.arrange(this, width, height);
    };





    //隐藏dom暂存器
    var hide_dom = document.createDocumentFragment();


    //隐藏子项
    self.hide = function (item) {

        if (item.dom.parentNode !== hide_dom)
        {
            hide_dom.appendChild(item.dom);

            item.__visible = false;
            this.__dom_dirty = true;
        }
    };


    //隐藏指定索引后的子项
    self.hide_after = function (items, index) {

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



    self.dispose = function () {

        var children = this.__children;

        if (children)
        {
            for (var i = 0, _ = children.length; i < _; i++)
            {
                children[i].dispose();
            }
        }

        return base.dispose.call(this);
    };


});

*/