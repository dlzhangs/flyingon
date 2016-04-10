

//控件类
$class('Control', [Object, flyingon.Component], function (self) {

    

    $constructor(function () {

        //根据dom模板创建关联的dom元素
        (this.dom = this.dom_template.cloneNode(true)).control = this;
    });

    
        
    
    //盒模型大小是否包含边框
    self.box_sizing_border = false;
    

    //创建dom模板(必须在创建类时使用此方法创建dom模板)
    self.createDomTemplate = (function () {

        var host = document.createElement('div');

        return function (html) {

            var name = 'flyingon-Control',
                cache = this.xtype,
                dom,
                style;
            
            host.innerHTML = html;
            
            dom = this.dom_template = host.children[0];
            dom.parentNode.removeChild(dom);
            
            if (cache && name !== (cache = cache.replace(/\./g, '-')))
            {
                name += ' ' + cache;
            }
            
            if (cache = dom.className)
            {
                name += ' ' + cache;
            }

            this.__default_class = dom.className = name + ' ';

            style = dom.style;
            style.position = 'absolute';
            style.borderWidth = '0';
            style.margin = '0';

            //计算盒模型在不同浏览器中的偏差
            //需等document初始化完毕后才可执行
            flyingon.dom_test(function (div) {

                var dom = this.dom_template.cloneNode(false),
                    style = dom.style;

                style.width = '100px';
                style.padding = '1px';

                div.appendChild(dom);

                //盒模型的宽度是否包含边框
                this.box_sizing_border = dom.offsetWidth === 100;
                div.innerHTML = '';

            }, this);

            return dom;
        };

    })();


    //控件类初始化处理
    self.__class_init = function (Class, self, base) {
     
        var dom = this.dom_template;
        
        if (dom)
        {
            if (base && dom === base.dom_template)
            {
                var name1 = base.xtype.replace(/\./g, '-'),
                    name2 = self.xtype.replace(/\./g, '-');
                
                dom = this.dom_template = base.dom_template.cloneNode(true);
                
                if (name1 === 'flyingon-Control')
                {
                    dom.className += name2 + ' ';
                }
                else
                {
                    dom.className = dom.className.replace(name1, name2);
                }
            }
        }
        else
        {
            this.createDomTemplate('<div style="border-style:solid;"></div>');
        }
    };




    //父控件
    self.defineProperty('parent', function () {

        return this.__parent || null;
    });
    
    
    //获取或设置当前控件在父控件中的索引号
    self.index = function (index) {
        
        var parent = this.__parent,
            children;
        
        if (parent && (children = parent.__children))
        {
            var old_index = children.indexOf(this);

            if (index !== void 0)
            {
                index = check_index(index | 0, 0, children.length);

                if (old_index !== index)
                {
                    children.splice(old_index, 1);
                    children.splice(index, 0, this);
                    
                    if (parent.__dom_content)
                    {
                        (parent.dom_body || parent.dom).insertBefore(this.dom, children[index].dom || null);
                        
                        if (parent.__arrange_dirty !== 2)
                        {
                            parent.update();
                        }
                    }
                }

                return this;
            }

            return old_index;
        }
        
        return this;
    };
    
    
    function check_index(index) {
      
        if (index < 0)
        {
            if ((index += length) < 0)
            {
                return 0;
            }
        }

        return index >= length ? length - 1 : index;
    };



    //id
    self.defineProperty('id', '', {

        set: 'this.dom.id = value;'
    });



    //指定class名 与html一样
    self.defineProperty('className', '', {

        attributes: 'query',
        set: 'this.dom.className = this.__default_class + (value ? value + " " : "");'
    });



    //是否包含指定class
    self.hasClass = function (name) {

        return name ? this.dom.className.indexOf(name + ' ') >= 0 : false;
    };


    //添加class
    self.addClass = function (name) {

        if (name)
        {
            this.dom.className += name + ' ';
        }

        return this;
    };


    //移除class
    self.removeClass = function (name) {

        if (name)
        {
            var dom = this.dom;
            dom.className = dom.className.replace(name + ' ', '');
        }

        return this;
    };


    //切换class 有则移除无则添加
    self.toggleClass = function (name) {

        if (name)
        {
            var dom = this.dom,
                className = dom.className;

            if (className.indexOf(name = name + ' ') >= 0)
            {
                dom.className = className.replace(name, '');
            }
            else
            {
                dom.className += name;
            }
        }

        return this;
    };


    //IE7点击滚动条时修改className会造成滚动条无法拖动,需在改变className后设置focus获取焦点解决此问题
    //IE8以下无Object.defineProperty方法
    flyingon.each('disabled,active,hover,focus,checked', function (name) {

        var key = ' flyingon-' + name,
            focus = name === 'active' ? 'dom.focus();\n' : '';

        this['__state_' + name] = new Function('value', 'var dom = this.dom, has = dom.className.indexOf(' + key + ') > 0;\n'
            + 'if (value)\n'
            + '{\n'
                + 'if (!has)\n'
                + '{\n\t'
                + 'dom.className += ' + key + ';\n'
                + focus
                + '}\n'
            + '}\n'
            + 'else if (has)\n'
            + '{\n'
                + 'dom.className = dom.className.replace(' + key + ', "");\n'
                + focus
            + '}');

    }, self);


    
    //扩展可布局对象接口
    flyingon.ILocatable(self, true);
    
    
        
    self.locationProperty('overflowX', '', {
       
        set: '(this.dom_body || this.dom).style.overflowX = value;'
    });
    
    
    self.locationProperty('overflowY', '', {
       
        set: '(this.dom_body || this.dom).style.overflowY = value;'
    });
    
    

    //渲染dom的大小及位置
    self.render = function () {
      
        var style = this.dom.style,
            width = this.offsetWidth,
            height = this.offsetHeight,
            box,
            border,
            padding;
        
        if (!this.box_sizing_border && (box = this.__boxModel))
        {
            border = box.border;
            width -= border.width;
            height -= border.height;
            
            if (!this.__no_padding)
            {
                padding = box.padding;
                width -= padding.width;
                height -= padding.height;
            }
        }
        
        style.left = this.offsetLeft + 'px';
        style.top = this.offsetTop + 'px';
        style.width = width + 'px';
        style.height = height + 'px';
    };
        
    
    //样式默认属性值
    var style_attributes = {

        group: 'appearance',
        query: true
    };
    
    
    //创建样式
    function style(name, style) {

        name = name.replace(/-(\w)/g, function (_, x) {
        
            return x.toUpperCase();
        });
        
        //定义属性
        var attributes = style_attributes;
        
        attributes.set = style || 'this.dom.style.' + name + ' = value;\n';
        self.defineProperty(name, '', attributes);
    };


    
    //控件层叠顺序
    //number	整数值 
    style('z-index', 0);


    //控件上右下左边框样式
    style('border-style');


    //控件上右下左边框颜色
    style('border-color', '');


    //控件上右下左边框圆角
    style('border-radius');


    //阅读方向
    //ltr	    从左到右 
    //rtl	    从右到左 
    style('direction');


    //控件内容横向对齐样式
    //left      左边对齐
    //center    横向居中对齐
    //right     右边对齐
    style('text-align');

    //控件内容纵向对齐样式
    //top       顶部对齐
    //middle    纵向居中对齐
    //bottom    底部对齐
    style('vertical-align');



    //控件可见性
    //visible	默认值 元素是可见的 
    //hidden	元素是不可见的 
    style('visibility', 'this.dom.style.visibility = value === "hidden" ? "hidden" : "visible";');

    //控件透明度
    //number	0(完全透明)到1(完全不透明)之间数值
    style('opacity');

    //控件光标样式
    //url	    需使用的自定义光标的 URL     注释：请在此列表的末端始终定义一种普通的光标, 以防没有由 URL 定义的可用光标 
    //default	默认光标(通常是一个箭头)
    //auto	    默认 浏览器设置的光标 
    //crosshair	光标呈现为十字线 
    //pointer	光标呈现为指示链接的指针(一只手)
    //move	    此光标指示某对象可被移动 
    //e-resize	此光标指示矩形框的边缘可被向右(东)移动 
    //ne-resize	此光标指示矩形框的边缘可被向上及向右移动(北/东) 
    //nw-resize	此光标指示矩形框的边缘可被向上及向左移动(北/西) 
    //n-resize	此光标指示矩形框的边缘可被向上(北)移动 
    //se-resize	此光标指示矩形框的边缘可被向下及向右移动(南/东) 
    //sw-resize	此光标指示矩形框的边缘可被向下及向左移动(南/西) 
    //s-resize	此光标指示矩形框的边缘可被向下移动(南) 
    //w-resize	此光标指示矩形框的边缘可被向左移动(西) 
    //text	    此光标指示文本 
    //wait	    此光标指示程序正忙(通常是一只表或沙漏) 
    //help	    此光标指示可用的帮助(通常是一个问号或一个气球) 
    style('cursor');


    //控件背景颜色
    //color_name	规定颜色值为颜色名称的背景颜色(比如 red)  transparent:透明 
    //hex_number	规定颜色值为十六进制值的背景颜色(比如 #ff0000) 
    //rgb_number	规定颜色值为 rgb 代码的背景颜色(比如 rgb(255,0,0)) 
    style('background-color');

    //控件背景图片
    //string        图像名(空字符串则表示无背景)
    //url('URL')	指向图像的路径
    style('background-image');

    //控件背景重复方式
    //repeat	背景图像将在垂直方向和水平方向重复 
    //repeat-x	背景图像将在水平方向重复 
    //repeat-y	背景图像将在垂直方向重复 
    //no-repeat	背景图像将仅显示一次 
    style('background-repeat');

    //控件背景颜色对齐方式
    //top left
    //top center
    //top right
    //center left
    //center center
    //center right
    //bottom left
    //bottom center
    //bottom right  如果您仅规定了一个关键词, 那么第二个值将是'center'     默认值：0% 0% 
    //x% y%	        第一个值是水平位置, 第二个值是垂直位置     左上角是 0% 0% 右下角是 100% 100%     如果您仅规定了一个值, 另一个值将是 50% 
    //xpos ypos	    第一个值是水平位置, 第二个值是垂直位置     左上角是 0 0 单位是像素 (0px 0px) 或任何其他的 CSS 单位     如果您仅规定了一个值, 另一个值将是50%     您可以混合使用 % 和 position 值 
    style('background-position');


    //控件颜色
    //color_name	规定颜色值为颜色名称的颜色(比如 red) 
    //hex_number	规定颜色值为十六进制值的颜色(比如 #ff0000) 
    //rgb_number	规定颜色值为 rgb 代码的颜色(比如 rgb(255,0,0)) 
    style('color');


    //控件字体样式
    //normal	浏览器显示一个标准的字体样式 
    //italic	浏览器会显示一个斜体的字体样式 
    //oblique	浏览器会显示一个倾斜的字体样式 
    style('font-style');

    //控件字体变体
    //normal	    浏览器会显示一个标准的字体 
    //small-caps	浏览器会显示小型大写字母的字体 
    style('font-variant');

    //控件字体粗细
    //normal	定义标准的字符 
    //bold	    定义粗体字符 
    //bolder	定义更粗的字符 
    //lighter	定义更细的字符 
    //100-900   定义由粗到细的字符 400 等同于 normal, 而 700 等同于 bold 
    style('font-weight');

    //控件字体大小
    style('font-size');

    //控件文字行高
    style('line-height');

    //控件字体族 family-name generic-family  用于某个元素的字体族名称或/及类族名称的一个优先表
    style('font-family');



    //控件文字词间距(以空格为准)
    style('word-spacing');

    //控件文字字间距
    style('letter-spacing');

    //控件文字缩进
    style('text-indent');

    //控件文字装饰
    //none	        默认 定义标准的文本 
    //underline	    定义文本下的一条线 
    //overline	    定义文本上的一条线 
    //line-through	定义穿过文本下的一条线 
    //blink	        定义闪烁的文本 
    style('text-decoration');

    //控件文字溢出处理方式
    //clip	    修剪文本
    //ellipsis	显示省略符号来代表被修剪的文本 	
    //string	使用给定的字符串来代表被修剪的文本 
    style('text-overflow');
    
    
    
    /*

    W3C事件规范:

    A: 鼠标事件 mousedown -> mouseup -> click -> mousedown -> mouseup -> click -> dblclick
    注: IE8以下会忽略第二个mousedown和click事件

    1. mousedown 冒泡 鼠标按下时触发
    2. mousemove 冒泡 鼠标在元素内部移动时重复的触发
    3. mouseup 冒泡 释放鼠标按键时触发
    4. click 冒泡 单击鼠标按键或回车键时触发
    5. dblclick 冒泡 双击鼠标按键时触发
    6. mouseover 冒泡 鼠标移入一个元素(包含子元素)的内部时触发
    7. mouseout 冒泡 鼠标移入另一个元素(包含子元素)内部时触发
    8. mouseenter 不冒泡 鼠标移入一个元素(不包含子元素)内部时触发
    9. mouseleave 不冒泡 鼠标移入另一个元素(不包含子元素)内部时触发


    B: 键盘事件

    1. keydown 冒泡 按下键盘上的任意键时触发 如果按住不放会重复触发
    2. keypress 冒泡 按下键盘上的字符键时触发 如果按住不放会重复触发
    3. keyup 冒泡 释放键盘上的按键时触发


    C: 焦点事件

    1. focus 不冒泡 元素获得焦点时触发
    2. blur 不冒泡 元素失去焦点时触发
    3. focusin 冒泡 元素获得焦点时触发
    4. focusout 冒泡 元素失去焦点时触发

    */

    var body = document.body,
    
        on = flyingon.dom_on,
        
        MouseEvent = flyingon.MouseEvent,
        
        KeyEvent = flyingon.KeyEvent;
    
    
    function event_control(e) {
      
        var target = e.target,
            control;
        
        do
        {
            if (control = target.control)
            {
                return control;
            }
        }
        while (target = target.parentNode);
    };
    
    
    function mouse_event(e) {
        
        var control = event_control(e);
        
        if (control)
        {
            control.trigger(new MouseEvent(e));
        }
    };
    
    
    function key_event(e) {
        
        var control = event_control(e);
        
        if (control)
        {
            control.trigger(new KeyEvent(e));
        }
    };
    
        
    on(body, 'mousedown', mouse_event);
    
    on(body, 'mousemove', mouse_event);
    
    on(body, 'mouseup', mouse_event);
    
    on(body, 'click', mouse_event);
    
    on(body, 'dblclick', mouse_event);
    
    on(body, 'mouseover', mouse_event);
    
    on(body, 'mouseout', mouse_event);
    
    on(body, 'mouseenter', mouse_event);
    
    on(body, 'mouseleave', mouse_event);
    
    
    on(body, 'keydown', key_event);
    
    on(body, 'keypress', key_event);
    
    on(body, 'keyup', key_event);
    
    
    /*
    on(body, 'focus', function (e) {
        
    };
    
    on(body, 'blur', function (e) {
        
    };
    
    on(body, 'focusin', function (e) {
        
    };
    
    on(body, 'focusout', function (e) {
        
    };
    */
    
    
    self.__event_on_scroll = function () {
        
    };
    
    
    self.__event_off_scroll = function () {
        
    };
    
    
    var update_list = [],
        delay;
        
    
    //延时更新
    function update_delay() {
        
        var list = update_list;
        
        for (var i = list.length - 1; i >= 0; i--)
        {
            list[i].refresh();
        }
        
        list.length = 0;
        delay = 0;
    };
    
    
    //更新
    function update(dirty) {
      
        if (!dirty)
        {
            this.__location_dirty = true;
        }
        
        this.__arrange_dirty = dirty || 2;

        if (!this.__update_dirty)
        {
            this.__update_dirty = true;
            
            update_list.push(this);
            delay || (delay = setTimeout(update_delay, 10)); //10毫秒后定时刷新
        }

        return this;
    };
    
    
    //刷新控件
    self.refresh = function (dirty) {
      
        var dom = this.dom;
        
        if (dom && (dom = dom.parentNode))
        {
            if (this.__location_dirty)
            {
                var width = dom.clientWidth,
                    height = dom.clientHeight,
                    box = this.boxModel(width, height);

                this.measure(box, width, height, false);
                this.locate(box, box.left, box.top, width, height);
                this.render();
            }

            if ((dirty || this.__arrange_dirty) && this.arrange)
            {
                this.arrange(dirty);
            }
            
            this.__update_dirty = false;
        }
    };
    
        
    //更新布局
    self.update = function () {
        
        var parent = this.__parent;
        
        this.__location_dirty = true;
        
        if (parent && !parent.__arrange_dirty)
        {
            parent.update(2);
        }
    };
    
    
    //附加控件至dom容器
    self.attach = function (dom_host) {
        
        if (this.update !== update)
        {
            var dom = this.dom;
            
            dom.style.position = 'relative';
            dom_host.appendChild(dom);
            
            this.update = update;
            this.refresh(2);
        }
    };
    
    
    //从dom容器中移除
    self.detach = function () {
        
        if (this.update === update)
        {
            var dom = this.dom;
            
            dom.parentNode.removeChild(dom);
            delete this.update;  
        }
    };
    
 
        
    self.dispose = function () {
    
        this.dom = this.dom.control = this.__parent = null;
        return base.dispose.call(this);
    };
    

});

