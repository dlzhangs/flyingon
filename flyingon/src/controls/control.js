
//控件类
$class('Control', [Object, flyingon.IComponent], function (self) {

    

    //控件集合
    flyingon.controls = flyingon.create(null);
    
    

    $constructor(function () {

        //根据dom模板创建关联的dom元素
        (this.dom = this.dom_template.cloneNode(false)).flyingon = this;
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
            
            style = dom.style;

            if (cache && name !== cache)
            {
                name += ' ' + cache;
            }

            dom.className = (cache = dom.className) ? cache + ' ' + name : name;

            style.position = 'absolute';
            style.borderWidth = '0';

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


    //创建默认dom模板
    self.createDomTemplate('<div></div>');




    //父控件
    self.defineProperty('parent', function () {

        return this.__parent || null;
    });



    //id
    self.defineProperty('id', '', {

        set: 'this.dom.id = value;'
    });



    //指定class名 与html一样
    self.defineProperty('className', '', {

        attributes: 'query',
        set: 'value && (this.dom.className += " " + value);'
    });



    //是否包含指定class
    self.hasClass = function (className) {

        return className ? this.dom.className.indexOf(' ' + className) > 0 : false;
    };


    //添加class
    self.addClass = function (className) {

        if (className)
        {
            this.dom.className += ' ' + className;
        }

        return this;
    };


    //移除class
    self.removeClass = function (className) {

        if (className)
        {
            var dom = this.dom;
            dom.className = dom.className.replace(' ' + className, '');
        }

        return this;
    };


    //切换class 有则移除无则添加
    self.toggleClass = function (className) {

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


    self.after_locate = function () {
      
        var style = this.dom.style;
        
        style.left = this.offsetLeft + 'px';
        style.top = this.offsetTop + 'px';
        style.width = this.offsetWidth + 'px';
        style.height = this.offsetHeight + 'px';
    };
    
    
    //样式默认属性值
    var style_attributes = {

        group: 'appearance',
        query: true
    };
    
    
    //创建样式
    function style(name, defaultValue, style) {

        name = name.replace(/-(\w)/g, function (_, x) {
        
            return x.toUpperCase();
        });
        
        //定义属性
        var attributes = style_attributes;
        
        attributes.set = style || 'this.dom.style.' + name + ' = value;\n';
        self.defineProperty(name, defaultValue,  attributes);
    };


    //控件层叠顺序
    //number	整数值 
    style('z-index', 0);


    //控件上右下左边框样式
    style('border-style', '');


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
    //collapse	当在表格元素中使用时, 此值可删除一行或一列, 但是它不会影响表格的布局 被行或列占据的空间会留给其他内容使用 如果此值被用在其他的元素上, 会呈现为 'hidden' 
    style('visibility');

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
    
    
    
    //从父控件中移除
    self.remove = function () {
    
        var parent = this.__parent;
        
        if (parent)
        {
            parent.remove(this);
        }
    };
    
    
    //附加控件至指定的dom
    self.attach = function (dom) {

        dom.appendChild(this.dom);
    };
    
    
    //移除附加
    self.detach = function () {
        
        var dom = this.dom,
            parent;
    
        if (dom && (parent = dom.parentNode))
        {
            parent.removeChild(dom);
        }
    };
    
    
        
    var update_controls = [],
        update_timeout;
    
    
    function update_delay() {
        
        clearTimeout(update_timeout);
        update_timeout = 0;
        
        update(update_controls);
    };
    
    
    function update(controls) {
        
        for (var i = controls.length - 1; i >= 0; i++)
        {
            var control = controls[i];
            
            switch (control.__arrange_dirty)
            {
                case 2: //子组件需要排列
                    update(controls.__children);
                    break;
                    
                case 1: //自身需要排列
                    control.arrange();
                    break;
            }
        }
    };
    
    
    self.update = function (type) {
        
        var parent;
        
        if (parent = this.__parent)
        {
            if (!parent.__arrange_dirty)
            {
                parent.update(2);
            }
        }
        else if (!this.__arrange_dirty)
        {
            update_controls.push(this);

            if (!update_timer)
            {
                update_timer = setTimeout(update_delay, 10); //10毫秒后定时刷新
            }
        }
        
        this.__arrange_dirty = +type || 1;
    };


});

