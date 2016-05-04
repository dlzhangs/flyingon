

//控件类
$class('Control', [null, flyingon.IComponent], function () {



    var self = this;



    $constructor(function () {

        //根据dom模板创建关联的dom元素
        (this.dom = this.dom_template.cloneNode(false)).flyingon = this;
    });


    
    //父控件
    flyingon.defineProperty(this, 'parent', {

        get: function () {

            return this.__parent || null;
        }
    });
           
    

    //id
    this.defineProperty('id', '', {

        set_code: 'this.dom.id = value;'
    });



    //指定class名 与html一样
    this.defineProperty('className', '', {

        attributes: 'query',
        set_code: 'value && (this.dom.className += " " + value);'
    });

                
                      
    //是否包含指定class
    this.hasClass = function (className) {

        return className ? this.dom.className.indexOf(' ' + className) > 0 : false;
    };


    //添加class
    this.addClass = function (className) {

        if (className)
        {
            this.dom.className += ' ' + className;
        }
            
        return this;
    };


    //移除class
    this.removeClass = function (className) {

        if (className)
        {
            var dom = this.dom;
            dom.className = dom.className.replace(' ' + className, '');
        }
            
        return this;
    };


    //切换class 有则移除无则添加
    this.toggleClass = function (className) {

        if (className)
        {
            var dom = this.dom,
                name = dom.className;

            if (name.indexOf(className = ' ' + className) > 0)
            {
                dom.className = name.replace(className, '');
            }
            else
            {
                dom.className += className;
            }
        }

        return this;
    };


    //IE7点击滚动条时修改className会造成滚动条无法拖动,需在改变className后设置focus获取焦点解决此问题
    //IE8以下无Object.defineProperty方法
    'disabled,active,hover,focus,checked'.replace(/\w+/g, function (name) {

        var key = ' flyingon-' + name,
            focus = name === 'active' ? 'dom.focus();\n' : '';
            
        self['__state_' + name] = new Function('value', 'var dom = this.dom, has = dom.className.indexOf("' + key + '") > 0;\n'
            + 'if (value)\n'
            + '{\n'
                + 'if (!has)\n'
                + '{\n\t'
                + 'dom.className += "' + key + '";\n'
                + focus
                + '}\n'
            + '}\n'
            + 'else if (has)\n'
            + '{\n'
                + 'dom.className = dom.className.replace("' + key + '", "");\n'
                + focus
            + '}');
    });
        
    

    this.defineProperty('layout', null, {

    });


       
    

    //渲染
    (function (flyingon) {



        //边框区大小(含边框及滚动条)
        prototype.offsetLeft = 0;    //相对父控件客户区偏移
        prototype.offsetTop = 0;     //相对父控件客户区偏移
        prototype.offsetWidth = 0;
        prototype.offsetHeight = 0;


        //客户区大小(不含内边距及滚动条)
        prototype.clientLeft = 0;     //相对控件左上角偏移
        prototype.clientTop = 0;      //相对控件左上角偏移
        prototype.clientWidth = 0;
        prototype.clientHeight = 0;


        //内容区大小(实际内容大小及开始渲染位置)
        prototype.contentWidth = 0;
        prototype.contentHeight = 0;


        //上次滚动位置
        prototype.__scrollLeft = prototype.__scrollTop = prototype.__scrollLeft_last = prototype.__scrollLeft_last = 0;


        //是否需要更新控件 0:不需要 1:需要更新 2:有子控件需要更新
        prototype.__update_dirty = 1;




        //鼠标提示信息
        prototype.defineProperty('title', '', {

            set_code: 'this.dom.title = value;'
        });



        //水平滚动条位置
        prototype.defineProperty('scrollLeft',

            function () {

                return this.__scrollLeft;
            },

            function (value) {

                (this.dom_children && this.dom_children.parentNode || this.dom).scollLeft = value;
            });


        //竖直滚动条位置
        prototype.defineProperty('scrollTop',

            function () {

                return this.__scrollTop;
            },

            function (value) {

                (this.dom_children && this.dom_children.parentNode || this.dom).scrollTop = value;
            });




        //计算大小
        var compute_dom1 = document.createElement('div'),

            compute_dom2 = document.createElement('div'),

            compute_style1 = prototype.__compute_style = compute_dom1.style,

            compute_style2 = compute_dom2.style,

            cssText = 'position:absolute;left:0;top:0;height:0;overflow:hidden;visibility:hidden;',

            regex_compute = /[\d\.]+|\S+/g;


        compute_style1.cssText = cssText + 'width:1000px;';
        compute_style2.cssText = cssText + 'width:0;';

        compute_dom1.appendChild(compute_dom2);

        flyingon.ready(function () {

            document.body.appendChild(compute_dom1);
        });



        //计算css单位值为实际大小
        prototype.compute_size = function (value, vertical) {

            if (value && value !== '0px')
            {
                value = value.match(regex_compute);

                switch (value[1])
                {
                    case 'px':
                        return value[0] | 0;

                    case '%':
                        return (value[0] * (vertical ? this.clientHeight : this.clientWidth) / 100) | 0;

                    default:
                        compute_style2.left = value;
                        return compute_dom2.offsetLeft;
                }
            }

            return 0;
        };



        var compute111 = (function () {

            var div = document.createElement('div'),
                style = 'visibility:hidden;overflow:hidden;margin:0;border:0;padding:0;',
                array = [],
                host;

            div.style.cssText = 'position:absolute;width:0;height:0;' + style;

            array.push('<div style=\'position:relative;' + style + '\'>');

            style = 'position:absolute;' + style;

            for (var i = 0; i < 10; i++)
            {
                array.push('<div style=\'' + style + '\'></div>');
            }

            array.push('</div>');

            div.innerHTML = array.join('');

            host = div.children[0];

            flyingon.ready(function () {

                document.body.appendChild(div);
            });

            return function (container) {

                var parent = this['.parent'],
                    box = this.__boxModel,
                    dom = div,
                    style = dom.style;

                if (box)
                {
                    box.auto_width = box.auto_height = false;
                }
                else
                {
                    box = this.__boxModel = {};
                }

                style.width = (parent && parent.offsetWidth || 0) + 'px';
                style.height = (parent && parent.offsetHeight || 0) + 'px';

                var fontSize = this.get_fontSize(),
                    dom_0 = dom.children[0],
                    dom_1 = dom.children[1],
                    dom_2 = dom.children[2],
                    dom_3 = dom.children[3],
                    dom_4 = dom.children[4],
                    style_0 = dom_0.style,
                    style_1 = dom_1.style,
                    style_2 = dom_2.style,
                    style_3 = dom_3.style,
                    style_4 = dom_4.style;

                style_0.left = this.get_marginLeft();
                style_0.top = this.get_marginTop();
                style_1.left = this.get_marginRight();
                style_1.top = this.get_marginBottom();

                style_0.width = this.get_borderLeft();
                style_0.height = this.get_borderTop();
                style_1.width = this.get_borderRight();
                style_1.height = this.get_borderBottom();

                style_2.width = this.get_paddingLeft();
                style_2.height = this.get_paddingTop();
                style_3.width = this.get_paddingRight();
                style_3.height = this.get_paddingBottom();

                style_2.left = this.get_left();
                style_2.top = this.get_top();
                style_3.left = this.get_offsetX();
                style_3.top = this.get_offsetY();

                style_4.left = this.get_minWidth();
                style_4.top = this.get_minHeight();
                style_4.width = this.get_maxWidth();
                style_4.height = this.get_maxHeight();

                //如果是容器控件
                if (container)
                {

                }

                box.margin_width = (box.marginLeft = dom_0.offsetLeft) + (box.marginRight = dom_1.offsetLeft);
                box.margin_height = (box.marginTop = dom_0.offsetTop) + (box.marginBottom = dom_1.offsetTop);

                box.border_width = (box.borderLeft = dom_0.offsetWidth) + (box.borderRight = dom_1.offsetWidth);
                box.border_height = (box.borderTop = dom_0.offsetHeight) + (box.borderBottom = dom_1.offsetHeight);

                box.padding_width = (box.paddingLeft = dom_0.offsetWidth) + (box.paddingRight = dom_1.offsetWidth);
                box.padding_height = (box.paddingTop = dom_0.offsetHeight) + (box.paddingBottom = dom_1.offsetHeight);

                box.client_width = box.border_width + box.padding_width;
                box.client_height = box.border_height + box.padding_height;

                box.left = dom_2.offsetLeft;
                box.top = dom_2.offsetTop;
                box.offsetX = dom_3.offsetLeft;
                box.offsetY = dom_3.offsetTop;

                box.minWidth = dom_4.offsetLeft;
                box.maxWidth = dom_4.offsetWidth;

                box.minHeight = dom_4.offsetTop;
                box.maxHeight = dom_4.offsetHeight;

                //如果是容器控件
                if (container)
                {

                }

            };

        })();




        //测量大小
        //usable_width              可用宽度 整数值
        //usable_height             可用高度 整数值
        //defaultWidth_to_fill      当宽度为auto时是否充满可用空间 true|false
        //defaultHeight_to_fill     当高度为auto时是否充满可用空间 true|false
        //less_width_to_default     当宽度不足时是否使用默认宽度 true|false
        //less_height_to_default    当高度不足时是否使用默认高度 true|false
        //use_usable_width          直接使用usable_width作为控件宽度
        //use_usable_height         直接使用use_usable_height作为控件高度
        //返回最大占用宽度及高度
        prototype.measure = function (usable_width, usable_height, defaultWidth_to_fill, defaultHeight_to_fill, less_width_to_default, less_height_to_default, use_usable_width, use_usable_height) {


            var box = this.__boxModel,
                fn = this.compute_size,
                dom = this.dom,
                dom_children = this.dom_children, //复合控件容器
                style = dom.style,
                width,
                height,
                value;

            if (box)
            {
                box.auto_width = box.auto_height = false;
            }
            else
            {
                box = this.__boxModel = {}
            }

            //计算盒模型
            box.margin_width = (box.marginLeft = fn(this.get_marginLeft())) + (box.marginRight = fn(this.get_marginRight()));
            box.margin_height = (box.marginTop = fn(this.get_marginTop(), true)) + (box.marginBottom = fn(this.get_marginBottom(), true));

            box.border_width = (box.borderLeft = dom.clientLeft) + (box.borderRight = fn(this.get_borderRightWidth()));
            box.border_height = (box.borderTop = dom.clientTop) + (box.borderBottom = fn(this.get_borderBottomWidth()));

            box.padding_width = (box.paddingLeft = fn(this.get_paddingLeft())) + (box.paddingRight = fn(this.get_paddingRight()));
            box.padding_height = (box.paddingTop = fn(this.get_paddingTop(), true)) + (box.paddingBottom = fn(this.get_paddingBottom(), true));

            box.client_width = box.border_width + box.padding_width;
            box.client_height = box.border_height + box.padding_height;

            box.minWidth = fn(this.get_minWidth());
            box.maxWidth = fn(this.get_maxWidth());

            box.minHeight = fn(this.get_minHeight(), true);
            box.maxHeight = fn(this.get_maxHeight(), true);

            box.offsetX = fn(this.get_offsetX());
            box.offsetY = fn(this.get_offsetY(), true);


            //处理宽度
            if (use_usable_width) //直接使用指定宽度
            {
                width = usable_width >= 0 ? usable_width : 0;
            }
            else
            {
                switch (value = this.get_width())
                {
                    case 'default': //默认
                        if (defaultWidth_to_fill)
                        {
                            value = true;
                        }
                        else
                        {
                            width = this.defaultWidth;
                        }
                        break;

                    case 'fill': //充满可用区域
                        value = true;
                        break;

                    case 'auto': //根据内容自动调整大小
                        box.auto_width = value = less_width_to_default = true;
                        break;

                    default:  //其它值
                        width = value && value.charAt(value.length - 1) === '%' ? (this['.parent'].clientWidth * parseFloat(value) / 100 | 0) : fn(value);
                        break;
                }

                //充满可用宽度
                if (value === true)
                {
                    if ((usable_width -= box.margin_width) > 0) //有可用空间
                    {
                        width = usable_width;
                    }
                    else if (less_width_to_default) //可用空间不足时使用默认宽度
                    {
                        width = this.defaultWidth;
                    }
                    else //无空间
                    {
                        width = 0;
                    }
                }

                //处理最小及最大宽度
                if (width < box.minWidth)
                {
                    width = box.minWidth;
                }
                else if (width > box.maxWidth && box.maxWidth > 0)
                {
                    width = box.maxWidth;
                }
            }


            //处理高度
            if (use_usable_height) //直接使用指定高度
            {
                height = usable_height >= 0 ? usable_height : 0;
            }
            else
            {
                switch (value = this.get_height())
                {
                    case 'default': //自动
                        if (defaultHeight_to_fill)
                        {
                            value = true;
                        }
                        else
                        {
                            height = this.defaultHeight;
                        }
                        break;

                    case 'fill': //充满可用区域
                        value = true;
                        break;

                    case 'auto': //根据内容自动调整大小
                        box.auto_height = value = less_height_to_default = true;
                        break;

                    default:  //其它值
                        height = value && value.charAt(value.length - 1) === '%' ? (this['.parent'].clientHeight * parseFloat(value) / 100 | 0) : fn(value);
                        break;
                }

                //充满可用高度
                if (value === true)
                {
                    if ((usable_height -= box.margin_height) > 0) //有可用空间
                    {
                        height = usable_height;
                    }
                    else if (less_height_to_default) //可用空间不足时使用默认高度
                    {
                        height = this.defaultHeight;
                    }
                    else //无空间
                    {
                        height = 0;
                    }
                }

                //处理最小及最大宽度
                if (height < box.minHeight)
                {
                    height = box.minHeight;
                }
                else if (height > box.maxHeight && box.maxHeight > 0)
                {
                    height = box.maxHeight;
                }
            }


            //宽度或高度等于0隐藏dom 否则可能因最小宽度或高度或边框等无法隐藏控件
            style.visibility = width > 0 && height > 0 && this.__visibility !== 'hidden' ? 'visible' : 'hidden';


            //复合控件不设置padding, 通过布局调整内容区的大小来模拟padding, 否则有些浏览器滚动条的宽高不包含paddingRight或paddingBottom
            if (!dom_children)
            {
                style.paddingLeft = box.paddingLeft + 'px';
                style.paddingTop = box.paddingTop + 'px';
                style.paddingRight = box.paddingRight + 'px';
                style.paddingBottom = box.paddingBottom + 'px';
            }


            //设置大小
            this.offsetWidth = width;
            this.offsetHeight = height;


            //盒模型大小不包含边框则计算client大小
            if (!this.box_border_sizing)
            {
                width -= box.border_width;
                height -= box.border_height;

                if (!dom_children) //非复合控件内容区需减去padding
                {
                    width -= box.padding_width;
                    height -= box.padding_height;
                }

                if (width < 0)
                {
                    width = 0;
                }

                if (height < 0)
                {
                    height = 0;
                }
            }


            //设置dom大小
            style.width = width + 'px';
            style.height = height + 'px';


            //测量前处理(可在重载方法中返回变化量调整大小)
            if (this.before_measure && (value = this.before_measure(box)))
            {
                resize_change.call(this, style, box, width, height, value);
            }


            //处理自动大小 measure.auto需返回width及height的变化量
            if ((box.auto_width || box.auto_height) && (value = this['.measure_auto'](box)))
            {
                resize_change.call(this, style, box, width, height, value);
            }


            //计算客户区大小
            this['.measure_client'](box);


            //测量后处理(尽量在重载方法中不要改变控件大小)
            if (this.after_measure)
            {
                this.after_measure(box);
            }


            //返回占用空间
            return {

                width: this.offsetWidth + box.margin_width,
                height: this.offsetHeight + box.margin_height
            };
        };


        //重设置大小
        function resize_change(style, box, width, height, change) {

            var value;

            if (value = +change.width)
            {
                this.offsetWidth += value;

                if (this.offsetWidth < box.minWidth)
                {
                    value += box.minWidth - this.offsetWidth;
                    this.offsetWidth = box.minWidth;
                }
                else if (box.maxWidth > 0 && this.offsetWidth > box.maxWidth)
                {
                    value += box.maxWidth - this.offsetWidth;
                    this.offsetWidth = box.maxWidth;
                }

                style.width = width + value + 'px';
            }

            if (value = +change.height)
            {
                this.offsetHeight += value;

                if (this.offsetHeight < box.minHeight)
                {
                    value += box.minHeight - this.offsetHeight;
                    this.offsetHeight = box.minHeight;
                }
                else if (box.maxHeight > 0 && this.offsetHeight > box.maxHeight)
                {
                    value += box.maxHeight - this.offsetHeight;
                    this.offsetHeight = box.maxHeight;
                }

                style.height = height + value + 'px';
            }
        };


        //测量自动大小(需返回变化值)
        prototype['.measure_auto'] = function (box, change) {

            var children = this.dom.children,
                x = 0,
                y = 0,
                item,
                cache;

            for (var i = 0, _ = children.length; i < _; i++)
            {
                item = children[i];

                if ((cache = item.offsetLeft + item.offsetWidth) > x)
                {
                    x = cache;
                }

                if ((cache = item.offsetTop + item.offsetHeight) > x)
                {
                    y = cache;
                }
            }

            if (box.auto_width)
            {
                change.width = x + box.client_width - this.offsetWidth;
            }

            if (box.auto_height)
            {
                change.height = y + box.client_height - this.offsetHeight;
            }
        };


        //测量客户区大小
        prototype['.measure_client'] = function (box) {

            var dom = this.dom,
                dom_children = this.dom_children,
                x,
                y,
                width,
                height;

            x = box.borderLeft + box.paddingLeft;
            y = box.borderTop + box.paddingTop;

            if (dom_children && (dom_children = dom_children.parentNode)) //有子控件(注: 如果子控件容器的父dom不允许设置边框)
            {
                width = dom_children.offsetWidth - box.padding_width;
                height = dom_children.offsetHeight - box.padding_height;

                if (dom_children === dom)
                {
                    width -= box.border_width;
                    height -= box.border_height;
                }
                else
                {
                    do
                    {
                        x += dom_children.offsetLeft + dom_children.clientLeft;
                        y += dom_children.offsetTop + dom_children.clientTop;

                    } while ((dom_children = dom_children.parentNode) && dom_children !== dom)
                }
            }
            else
            {
                width = this.offsetWidth - box.border_width - box.padding_width;
                height = this.offsetHeight - box.border_height - box.padding_height;
            }

            this.clientLeft = x;
            this.clientTop = y;
            this.clientWidth = width > 0 ? width : 0;
            this.clientHeight = height > 0 ? height : 0;
        };


        //设置控件位置(需先调用measure才可调用此方法)
        //x             起始x坐标
        //y             起始y坐标
        //align_width   对齐宽度 大于0则按此宽度分派空间并对齐
        //align_height  对齐高度 大于0则按此高度分派空间并对齐
        //返回控件最大占位坐标
        prototype.locate = function (x, y, align_width, align_height) {

            var parent = this['.parent'],
                box = this.__boxModel,
                style = this.dom.style,
                value;

            if (align_width > 0 && (value = align_width - box.margin_width - this.offsetWidth))
            {
                switch (this.get_alignX())
                {
                    case 'center':
                        x += value >> 1;
                        break;

                    case 'right':
                        x += value;
                        break;
                }
            }

            if (align_height > 0 && (value = align_height - box.margin_height - this.offsetHeight))
            {
                switch (this.get_alignY())
                {
                    case 'middle':
                        y += value >> 1;
                        break;

                    case 'bottom':
                        y += value;
                        break;
                }
            }

            style.left = (x += box.offsetX + box.marginLeft) + 'px';
            style.top = (y += box.offsetY + box.marginTop) + 'px';

            //返回最大占位
            return {

                x: (this.offsetLeft = x) + this.offsetWidth + box.marginRight,
                y: (this.offsetTop = y) + this.offsetHeight + box.marginBottom
            };
        };



        //刷新控件
        prototype.update = function (arrange, update_now) {

            if (arrange)
            {
                this.__arrange_dirty = true;
            }

            if (this.__boxModel && this.__update_dirty !== 1)
            {
                var parent = this;

                this.__update_dirty = 1; //标记需要更新

                while ((parent = parent['.parent']) && !parent.__update_dirty)
                {
                    parent.__update_dirty = 1; //标记子控件需要更新
                }

                (this.__ownerWindow || this.get_ownerWindow())['.registry_update'](this, update_now);
            }
        };


        //渲染控件
        prototype.render = function () {

            if (this.__update_dirty === 1)
            {
                flyingon['.compute_css'](this);
            }
        };




        //检测拖动
        prototype['.check_drag'] = function (draggable, event) {

            return draggable;
        };


        //检测调整大小
        prototype['.check_resize'] = function (resizable, event) {

            var offset = flyingon.offset(this.dom, event.clientX, event.clientY),
                style = this.dom.style,
                width = this.offsetWidth,
                height = this.offsetHeight,
                result;

            if (resizable !== 'vertical')
            {
                if (offset.x >= 0 && offset.x < 4)
                {
                    result = { left: true, cursor: 'w-resize' };
                }
                else if (offset.x <= width && offset.x > width - 4)
                {
                    result = { right: true, cursor: 'e-resize' };
                }
            }

            if (resizable !== 'horizontal')
            {
                if (offset.y >= 0 && offset.y < 4)
                {
                    if (result)
                    {
                        result.cursor = result.left ? 'nw-resize' : 'ne-resize';
                        result.top = true;
                    }
                    else
                    {
                        result = { top: true, cursor: 'n-resize' };
                    }
                }
                else if (offset.y <= height && offset.y > height - 4)
                {
                    if (result)
                    {
                        result.cursor = result.left ? 'sw-resize' : 'se-resize';
                        result.bottom = true;
                    }
                    else
                    {
                        result = { bottom: true, cursor: 's-resize' };
                    }
                }
            }

            return result;
        };



        //调整大小
        prototype['.resize'] = function (side, event, pressdown) {

            var x = event.clientX - pressdown.clientX,
                y = event.clientY - pressdown.clientY;

            if (side.left)
            {
                x = resize_value(this, pressdown, 'width', -x, true);
                resize_value(this, pressdown, 'left', x);
            }
            else if (side.right)
            {
                resize_value(this, pressdown, 'width', x, true);
            }

            if (side.top)
            {
                y = resize_value(this, pressdown, 'height', -y, true);
                resize_value(this, pressdown, 'top', y);
            }
            else if (side.bottom)
            {
                resize_value(this, pressdown, 'height', y, true)
            }

            event.stopPropagation(false);
        };



        //保持原单位的大小调整
        var regex_resize = /[a-zA-Z%*]+/,  //

            scale_keys = {

                px: 1,
                fill: 1,
                auto: 1,
                'default': 1,
                '*': 1
            },

            resize_names = { //默认位置大小名称对应关系

                left: 'offsetLeft',
                top: 'offsetTop',
                width: 'offsetWidth',
                height: 'offsetHeight'
            };



        //获取开始调整数据
        function resize_start(target, pressdown, name) {

            var start = pressdown[name] = target['.get_unit_scale'](target['get_' + name](), target[resize_names[name]]);

            start.reverse = target.__arrange_mirror !== 'none';
            return start;
        };


        //调整控件位置及大小
        function resize_value(target, pressdown, name, change, resize) {

            var start = pressdown[name] || resize_start(target, pressdown, name),
                value = start.value + (start.scale === 1 ? change : ((change * start.scale * 100) | 0) / 100);

            if (resize)
            {
                if ((value = target['.adjust_size'](value, change, name === 'height')) > 0)
                {
                    target['set_' + name](value + start.unit);
                }

                return start.value - value;
            }

            target['set_' + name](value + start.unit);
        };


        //调整大小
        prototype['.adjust_size'] = function (size, change, vertical) {

            return size > 0 ? size : 0;
        };




        //获取1像素转换为目标单位的换算比例
        //default,fill,auto,*按px单位处理
        prototype['.get_unit_scale'] = function (value, px) {

            var unit = value.match(regex_resize);

            if (!unit || scale_keys[unit = unit[0]])
            {
                return { value: px, unit: 'px', scale: 1 };
            }

            return {

                unit: unit,
                value: (value = parseFloat(value) || 0),
                scale: (value / px) || 1
            };
        };





    })(flyingon);





    //获取事件控件(非附加控件)
    prototype['.get_event_control'] = function () {

        var target = this,
            parent = this;

        while (parent = parent['.parent'])
        {
            if (!target.__additions)
            {
                target = parent;
            }
        }

        return target;
    };





    //其它属性
    (function (flyingon) {



        //快捷键(按下alt+accesskey)
        prototype.defineProperty('accesskey', null);


        //是否可用
        prototype.defineProperty('enabled', true, {

            set_code: 'this['.stateTo_disabled'](!value);'
        });




    //调整大小方式
    //none          无法调整控件的大小
    //both	        可调整控件的高度和宽度
    //horizontal    可调整控件的宽度
    //vertical      可调整控件的高度
    prototype.defineProperty('resizable', 'none');


    //拖动方式
    //none          不可拖动控件
    //both	        可自由拖动控件
    //horizontal    可水平拖动控件
    //vertical	    可水平拖动控件
    prototype.defineProperty('draggable', 'none');


    //是否可接受拖放
    prototype.defineProperty('droppable', false);


    //自定义数据
    prototype.defineProperty('tag', null);


})(flyingon);





//杂项
(function (flyingon) {



    //按css选择器规范查找控件或子控件
    prototype.query = function (selector) {

        return new flyingon.Query(selector, this);
    };


    //设置当前控件为焦点控件
    //注:需此控件focusable为true时才可设为焦点控件
    prototype.focus = function (event) {

        this.dom.focus();
        return this;
    };


    //此控件失去焦点
    prototype.blur = function (event) {

        this.dom.blur();
        return this;
    };



    //开始初始化
    prototype.beginInit = function () {

        flyingon.__initializing = true;
        return this;
    };


    //结束初始化
    prototype.endInit = function () {

        flyingon.__initializing = false;
        return this;
    };



    //销毁
    prototype.dispose = function () {

        var cache = this.__bindings;

        if (cache)
        {
            for (var name in cache)
            {
                cache[name].dispose();
            }
        }

        flyingon.distroy(cache);

        return this;
    };



})(flyingon);





//dom操作
(function (flyingon) {



    //setAttributes在IE6/7下的处理
    //var attributes_fix = {

    //    tabindex: 'tabIndex',
    //    readonly: 'readOnly',
    //    'for': 'htmlFor',
    //    'class': 'className',
    //    maxlength: 'maxLength',
    //    cellspacing: 'cellSpacing',
    //    cellpadding: 'cellPadding',
    //    rowspan: 'rowSpan',
    //    colspan: 'colSpan',
    //    usemap: 'useMap',
    //    frameborder: 'frameBorder',
    //    contenteditable: 'contentEditable'
    //};



    //创建dom模板(必须在创建类时使用此方法创建dom模板)
    prototype.create_dom_template = function (tagName, cssText, attributes) {

        //创建dom模板
        var dom = this.dom_template = document.createElement(tagName);

        //处理className
        dom.className = initialize_class.call(this, Class) + dom.className;

        //处理属性
        if (attributes)
        {
            if (attributes.constructor === String)
            {
                dom.innerHTML = attributes;
            }
            else
            {
                for (var name in attributes)
                {
                    if (name === 'innerHTML')
                    {
                        dom.innerHTML = attributes[name];
                    }
                    else
                    {
                        dom.setAttribute(name, attributes[name]);
                    }
                }
            }
        }

        if (flyingon.browser_WebKit)
        {
            dom.setAttribute('style', 'position:absolute;' + (cssText || '')); //此方法创建的样式在chrome,safari中性能要好些
        }
        else
        {
            dom.style.cssText = 'position:absolute;' + (cssText || '');
        }

        //计算盒模型在不同浏览器中的偏差
        //需等document初始化完毕后才可执行
        flyingon.ready(function () {

            var dom = document.createElement(tagName = tagName || 'div');

            if (attributes && attributes.type)
            {
                dom.type = attributes.type;
            }

            dom.style.cssText = 'position:absolute;width:100px;height:0;padding:1px;visibility:hidden;';

            document.body.appendChild(dom);

            //盒模型的宽度是否包含边框
            this.box_border_sizing = dom.offsetWidth === 100;

            flyingon.distroy(dom); //销毁dom

        }, this);

        return dom;
    };


    //初始化class相关属性
    function initialize_class(Class) {

        if (this.xtype && this.xtype !== 'flyingon.Control')
        {
            return this.__className0 = 'flyingon-Control ' + (Class.css_className = this.css_className = this.xtype.replace(/\./g, '-')) + ' ';
        }

        //匿名类
        Class.css_className = this.css_className = 'flyingon-Control';
        return this.__className0 = 'flyingon-Control ';
    };


    //创建默认dom模板
    prototype.create_dom_template('div');



    //类初始化方法
    prototype['.class.init'] = function (Class, prototype) {

        //处理className
        if (!Class.css_className)
        {
            (prototype.dom_template = this.dom_template.cloneNode(true)).className = initialize_class.call(prototype, Class);
        }
    };




})(flyingon);




});
