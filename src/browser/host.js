//计算单位换算关系
flyingon.dom_test(function (div) {

    var unit = flyingon.pixel_unit.unit;

    //计算单位换算列表
    div.style.cssText = 'position:absolute;overflow:scroll;border:0;padding:0;left:-10000em;top:-10000in;width:10000ex;height:100px;';

    unit.px = 1;
    unit.ex = div.offsetWidth / 10000;
    unit.em = unit.rem = -div.offsetLeft / 10000;

    unit.pt = (unit.pc = (unit['in'] = -div.offsetTop / 10000) / 6) / 12;
    unit.mm = (unit.cm = unit['in'] / 2.54) / 10;

    div.style.width = '100px';
    div.innerHTML = "<div style='position:relative;width:200px;height:200px;'></div>";

    //竖直滚动条宽度
    flyingon.vscroll_width = div.offsetWidth - div.clientWidth;

    //水平滚动条高度
    flyingon.hscroll_height = div.offsetHeight - div.clientHeight;

    div.innerHTML = '';

});



//宿主容器
(function () {
    
        
    var update_list = [];
    
    var update_delay;
    
    
    //更新
    function update() {
        
        var list = update_list,
            index = 0,
            item;
        
        while (item = list[index++])
        {
            item.update();
        }
        
        list.length = 0;
        
        if (index = update_delay)
        {
            clearTimeout(index);
            update_delay = 0;
        }
    };
    
    
    //延时更新
    flyingon.__delay_update = function (control, delay) {
      
        var list = update_list;
        
        if (control && list.indexOf(control) < 0)
        {
            list.push(control);
            
            if (delay === false)
            {
                update();
            }
            else if (!update_delay)
            {
                update_delay = setTimeout(update, delay || 30); //30毫秒后定时刷新
            }
        }
    };
    
    
    
    //按根节点的方式重绘
    function update_root() {
        
        var dom = this.view || this.renderer.init(this),
            left = this.left(),
            top = this.top(),
            width = 0,
            height = 0,
            box;

        dom.style.position = 'relative';

        if (dom = dom.parentNode)
        {
            width = dom.clientWidth;
            height = dom.clientHeight;
        }
        
        box = this.initViewBox(width, height);

        this.measure(box, width, height, false);
        
        if (left)
        {
            left = flyingon.pixel(left);
            width = 0;
        }
        
        if (top)
        {
            top = flyingon.pixel(top);
            height = 0;
        }
        
        this.locate(box, left, top, width, height);
        this.Class.prototype.update.call(this);

        return this;
    };
    
 

    //显示控件至指定的dom
    flyingon.showControl = function (control, host) {

        if (control && !control.__parent && control.update !== update_root)
        {
            var dom = control.view || control.renderer.init(control);

            control.update = update_root;
            
            (host || document.body).appendChild(dom);
            flyingon.__delay_update(control, false);
        }
    };


    //隐藏控件
    flyingon.hideControl = function (control, dispose) {

        var dom;
        
        if (control && control.update === update_root)
        {
            delete control.update;

            if ((dom = control.view) && (parent = dom.parentNode))
            {
                parent.removeChild(dom);
            }

            if (parent = control.__parent)
            {
                parent.remove(control);
            }
            
            if (dispose !== false)
            {
                control.dispose();
            }
        }
    };

          
          
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
   
    var body = document.body;
    
    var on = flyingon.dom_on;
        
    var off = flyingon.dom_off;
        
    var MouseEvent = flyingon.MouseEvent;
        
    var KeyEvent = flyingon.KeyEvent;
    
    
        
    //查找与指定dom关联的控件
    flyingon.findControl = function (dom) {
        
        var control;
        
        while (dom)
        {
            if (control = dom.flyingon_control)
            {
                return control;
            }
            
            dom = dom.parentNode;
        }
    };
    
        
    function mouse_event(e) {
        
        var control = flyingon.findControl(e.target);
        
        if (control)
        {
            control.trigger(new MouseEvent(e));
        }
    };
    
    
    function key_event(e) {
        
        var control = flyingon.findControl(e.target);
        
        if (control)
        {
            control.trigger(new KeyEvent(e.target));
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

    
})();
