
//控件渲染器
$class('Renderer', function () {
    
    
    
    //dom容器
    var dom_host = document.createElement('div');
    
    var text_name = 'textContent';
    
    if (!(text_name in dom_host))
    {
        text_name = 'innerText';
    }
        
    
    
    //宽和高是否不包含边框
    this.__no_border = true;
    
    //宽和高是否不包含内边距
    this.__no_padding = true;
    
    //默认边框宽度
    this.__border_width = 0;
    
    //默认边框高度
    this.__border_height = 0;
    
    //默认内边距宽度
    this.__padding_width = 0;
    
    //默认内边距高度
    this.__padding_height = 0;
        
    
    //视图池最大数量
    this.maxPoolSize = 100;
    
        
    //默认样式文本
    this.cssText = 'position:absolute;overflow:auto;margin:0;';
    
    //默认使用border-box盒模型
    if (flyingon.css_name('box-sizing'))
    {
        this.cssText += flyingon.css_name('box-sizing', true) + ':border-box;';
    }
    
    
    
    //绑定绘制器
    this.bind = function (controlType) {
    
        for (var i = arguments.length - 1; i >= 0; i--)
        {
            if (controlType = arguments[i])
            {
                (controlType.prototype || controlType).renderer = this;
            }
        }
    };
    
    
    //绑定控件类绘制器
    this.bind(flyingon.Control);
    
    
    //创建dom模板
    this.template = function (html, check) {
        
        this.__template_ = [html, check];
    };
    
            
    
    //初始化渲染器,需返回view可视模型对象
    this.init = function (control) {
        
        var view = control.view = this.__view_pool.pop() || this.createView(control), 
            values, 
            cache;
        
        view.flyingon_control = control;

        if ((cache = control.__storage) && (cache = cache.className))
        {
            view.className = view.className + ' ' + cache;
        }
        
        if (values = control.__style_values)
        {
            cache = flyingon.css_value;
            
            for (var name in values)
            {
                cache(view, name, values[name]);
            }
        }
        
        if (values = control.__attribute_values)
        {
            for (name in values)
            {
                if ((cache = values[name]) !== false)
                {
                    view.setAttribute(name, cache);
                }
                else
                {
                    view.removeAttribute(name);
                }
            }
        }
        
        return view;
    };
    
    
    //创建视图
    this.createView = function (control) {
      
        return (this.__template || this.__init_template(control.defaultClassName)).cloneNode(true);
    };
    
            
    //获取绘制器模板
    this.__init_template = function (className, check) {
    
        var template = this.__template_,
            dom;
        
        if (template)
        {
            this.__template_ = void 0;
            
            if (dom = template[0])
            {
                dom_host.innerHTML = dom;
                
                if (dom = dom_host.children[0])
                {
                    dom_host.removeChild(dom);
                }
            }
        }
        
        this.__template = dom = dom || document.createElement('div');
        
        dom.className = (className || 'flyingon-Control') + (dom.className ? ' ' + dom.className : '');
        dom.style.cssText = this.cssText + dom.style.cssText;
        
        //检测盒模型
        (check || template && template[1]) && flyingon.dom_test(function (host) {

            check_box.call(this, host, dom.cloneNode(true));                
            host.innerHTML = '';

        }, this);
            
        return dom;
    };
    
    
    //创建默认模板
    this.__init_template(null, true);
    
    
    //检测盒模型
    function check_box(host, dom) {
        
        var style = dom.style,
            pixel = flyingon.pixel;

        host.appendChild(dom);

        style.width = '100px';
        style.padding = '10px';

        //宽和高是否不包含边框
        if (this.__no_border = dom.offsetWidth !== 100)
        {
            style.padding = '';
            style = dom.currentStyle || window.getComputedStyle(dom);

            //计算默认边框大小
            this.__border_width = pixel(style.borderLeftWidth) + pixel(style.borderRightWidth);
            this.__border_height = pixel(style.borderTopWidth) + pixel(style.borderBottomWidth);

            //计算默认内边距大小
            this.__padding_width = pixel(style.paddingLeft) + pixel(style.paddingRight);
            this.__padding_height = pixel(style.paddingTop) + pixel(style.paddingBottom);
        }
        else
        {
            this.__border_width = this.__border_height = this.__padding_width = this.__padding_height = 0;
        }
    };
    
    
    
    //设置视图class
    this.className = function (control, value) {
        
        this.view.className = value ? control.defaultClassName + ' ' + value : control.defaultClassName;
    };
    
    
    //设置视图样式
    this.style = function (control, name, value) {
        
        flyingon.css_value(control.view, name, value);
    };
    
    
    //设置视图属性
    this.attribute = function (control, name, value) {
        
        if (value !== false)
        {
            control.view.setAttribute(name, value);
        }
        else
        {
            control.view.removeAttribute(name);
        }
    };
    
    
    //设置视图内容
    this.text = function (control, text, isHtml) {
        
        if (isHtml)
        {
            control.view.innerHTML = text;
        }
        else
        {
            control.view[text_name] = text;
        }
    };
    
 
    
    //渲染控件
    this.render = function (control) {
      
        var box = control.viewBox,
            width = box.offsetWidth,
            height = box.offsetHeight,
            style = control.view.style,
            cache;
        
        //宽和高如果不包含边框则减去边框
        if (this.__no_border)
        {
            if ((cache = box.border) && cache.text)
            {
                width -= cache.width;
                height -= cache.height;
            }
            else
            {
                width -= this.__border_width;
                height -= this.__border_height;
            }
            
            //宽和高如果不包含内边距则减去内边距
            if (this.__no_padding)
            {
                if ((cache = box.padding) && cache.text)
                {
                    width -= cache.width;
                    height -= cache.height;
                }
                else
                {
                    width -= this.__padding_width;
                    height -= this.__padding_height;
                }
            }
        }
        
        style.left = box.offsetLeft + 'px';
        style.top = box.offsetTop + 'px';
        style.width = width + 'px';
        style.height = style.lineHeight = height + 'px';
    };
    
    
    
    //回收视图
    this.recycle = function (control) {

        var pool = this.__view_pool,
            view = control.view,
            cache;

        if (cache = view.parentNode)
        {
            cache.removeChild(view);
        }

        if (pool.length >= this.maxPoolSize)
        {
            return;
        }

        cache = this.__template;

        view.flyingon_control = null;
        view.className = cache.className;
        view.style.cssText = cache.style.cssText;

        if (cache = control.__attribute_values)
        {
            for (var name in values)
            {
                if (values[name] !== false)
                {
                    view.removeAttribute(name);
                }
            }
        }

        pool.push(view);
    };
    
    
    
    this.__class_init = function (Class, base) {
        
        //初始化渲染器的模板为null
        this.__template = null;
        
        //视图池
        this.__view_pool = [];
    };
   
    
});



