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
(function (flyingon, document) {
    
   
          
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
   
    
    //事件处理
    var events = flyingon.create(null);
    
    var MouseEvent = flyingon.MouseEvent;
        
    var KeyEvent = flyingon.KeyEvent;
    
    var on = flyingon.dom_on;
    
    //鼠标按下事件
    var mousedown = null;
    
    //调整大小参数
    var resizable = 0;
    
    //拖动控件参数
    var draggable = null;
    
    
    //顶级控件
    var controls = flyingon.controls = [];
        
    
    //延迟更新队列
    var update_list = [];
    
    var update_delay;
    
    
    
    //更新
    function update() {
        
        var list = update_list,
            index = 0,
            item;
        
        while (item = list[index++])
        {
            update_root(item);
        }
        
        list.length = 0;
        
        if (index = update_delay)
        {
            clearTimeout(index);
            update_delay = 0;
        }
    };
    
    
    //按根节点的方式重绘
    function update_root(control) {
        
        var dom = control.view || control.renderer.init(control),
            left = control.left(),
            top = control.top(),
            width = 0,
            height = 0;

        dom.style.position = 'relative';

        if (dom = dom.parentNode)
        {
            width = dom.clientWidth;
            height = dom.clientHeight;
        }
        
        control.initBoxModel(width, height);
        control.measure(width, height, false);
        
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
        
        control.locate(left, top, width, height);
        control.update();
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
     

    //显示控件至指定的dom
    flyingon.showControl = function (control, host) {

        if (control && !control.__parent && controls.indexOf(control) < 0)
        {
            var dom = control.view || control.renderer.init(control);

            if (typeof host === 'string')
            {
                host = document.getElementById(host);
            }
            
            controls.push(control);
            
            (host || document.body).appendChild(dom);
            flyingon.__delay_update(control, false);
            
            return true;
        }
    };


    //隐藏控件
    flyingon.hideControl = function (control, dispose) {

        var dom, index;
        
        if (control && (index = controls.indexOf(control)) >= 0)
        {
            controls.splice(index, 1);
            
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
    
    
    
    //通用鼠标事件处理
    function mouse_event(e) {
        
        var control = flyingon.findControl(e.target);
        
        if (control)
        {
            control.trigger(new MouseEvent(e));
        }
    };
    
    
    //通用键盘事件处理
    function key_event(e) {
        
        var control = flyingon.findControl(e.target);
        
        if (control)
        {
            control.trigger(new KeyEvent(e.target));
        }
    };
    
    
    
    function check_resize(control, value, e) {
        
        var dom = control.view,
            rect = dom.getBoundingClientRect(),
            side = 0,
            cursor = '',
            x,
            y;
        
        if (value !== 'x')
        {
            x = e.clientY - rect.top;
            
            if (x >= 0 && x <= 4)
            {
                side = 1;
                cursor = 's';                
            }
            else
            {
                y = control.offsetHeight;
                
                if (x >= y - 4 && x <= y)
                {
                    side = 2;
                    cursor = 'n';
                }
            }
        }
        
        if (value !== 'y')
        {
            x = e.clientX - rect.left;
            
            if (x >= 0 && x <= 4)
            {
                side |= 4;
                cursor += 'e';
            }
            else
            {
                y = control.offsetWidth;
                
                if (x >= y - 4 && x <= y)
                {
                    side |= 8;
                    cursor += 'w';
                }
            }
        }
        
        dom.style.cursor = cursor ? cursor + '-resize' : (control.__storage || control.__defaults).cursor;
        
        return resizable = side;
    };
    
    
    function do_resize(control, data) {
        
        var side = data.side;
        
        if ((side & 1) === 1) //top
        {
            control.height(data.height - data.distanceY);
        }
        else if ((side & 2) === 2) //bottom
        {
            control.height(data.height + data.distanceY);
        }
        
        if ((side & 4) === 4) //left
        {
            control.width(data.width - data.distanceX);
        }
        else if ((side & 8) === 8) //right
        {
            control.width(data.width + data.distanceX);
        }
    };
    
    
    
    function start_drag(control, e) {
        
        var target, cache, rect;
        
        if (control.trigger('dragstart', e = new MouseEvent(e)) !== false)
        {
            var view = control.view,
                dom = view.cloneNode(true),
                style = view.style;
            
            rect = view.getBoundingClientRect();
            
            style.borderStyle = 'dashed';
            style.borderColor = 'red';
            
            style = dom.style;
            style.opacity = 0.2;
            style.left = rect.left + 'px';
            style.top = rect.top + 'px';
            
            document.body.appendChild(dom);
            
            target = {
            
                dom: dom,
                left: rect.left,
                top: rect.top
            };
        }
        else if (!(target = e.draggable))
        {
            return;
        }
        
        //获取拖动容器及偏移位置
        while (cache = control.__parent)
        {
            control = cache;
        }
        
        rect = control.view.getBoundingClientRect();
        
        target.host = control;
        target.offsetX = e.clientX - rect.left;
        target.offsetY = e.clientY - rect.top;
        
        return draggable = target;
    };
    
    
    function do_drag(control, data, e) {
        
        var style = data.dom.style,
            x = data.distanceX,
            y = data.distanceY,
            parent = control.__parent,
            host = data.host,
            target = host.findDropTarget(data.offsetX + x, data.offsetY + y);

        if (parent !== host)
        {
            parent.remove(control);
            host.insert(target[1], control);
        }
        else
        {
            control.index(target[1]);
        }

        style.left = data.left + x + 'px';
        style.top = data.top + y + 'px';

        control.trigger('drag', new MouseEvent(e));
    };
    
    
    function end_drag(control, data, e) {
        
        var dom = data.dom,
            style1 = dom.style,
            style2 = control.view.style,
            parent;

        if (parent = dom.parentNode)
        {
            parent.removeChild(dom);
        }

        style2.borderStyle = style1.borderStyle;
        style2.borderColor = style1.borderColor;

        control.trigger('dragend', new MouseEvent(e))
    };
    
    

    events.mousedown = function (e) {
        
        var control = flyingon.findControl(e.target),
            parent,
            cache;
        
        if (control && control.trigger(mousedown = new MouseEvent(e)) !== false)
        {
            if (cache = resizable)
            {
                resizable = {
                 
                    side: cache,
                    width: control.offsetWidth,
                    height: control.offsetHeight
                }
            }
            else if ((parent = control.__parent) && (control.__storage || control.__defaults).draggable)
            {
                cache = start_drag(control, e);
            }
            
            if (cache && (cache = control.view))
            {
                cache.setCapture && cache.setCapture();

                cache = document.body;
                cache.__ondragstart = cache.ondragstart;
                cache.ondragstart = function () {
                  
                    return false;
                };
            }
        }
    };
    
    
    events.mousemove = function (e) {
        
        var start = mousedown,
            control,
            cache;
        
        if (start && (control = start.target))
        {
            var x = e.clientX - start.clientX,
                y = e.clientY - start.clientY;
                
            if (cache = resizable)
            {
                cache.distanceX = x;
                cache.distanceY = y;
                
                do_resize(control, cache);
            }
            else if (cache = draggable)
            {
                cache.distanceX = x;
                cache.distanceY = y;
                
                do_drag(control, cache, e);
            }
            else
            {
                e = new MouseEvent(e);
                
                e.mousedown = start;
                e.distanceX = x;
                e.distanceY = y;
                
                control.trigger(e);
            }
        }
        else if ((control = flyingon.findControl(e.target)) && control.trigger(new MouseEvent(e)) !== false)
        {
            if ((cache = (control.__storage || control.__defaults).resizable) !== 'none')
            {
                check_resize(control, cache, e);
            }
        }
    };
    
    
    //按下鼠标时弹起处理
    events.mouseup = function (e) {
        
        var start = mousedown,
            control,
            cache;
        
        if (start && (control = start.target))
        {
            if (cache = resizable)
            {
                resizable = 0;
            }
            else if (cache = draggable)
            {
                end_drag(control, cache, e);
                draggable = null;
            }

            e = new MouseEvent(e);

            e.mousedown = start;
            e.distanceX = e.clientX - start.clientX;
            e.distanceY = e.clientY - start.clientY;

            control.trigger(e);

            if (cache = control.view)
            {
                cache.setCapture && cache.releaseCapture();
                cache = document.body;
                
                if (cache.ondragstart = cache.__ondragstart)
                {
                    cache.__ondragstart = null;
                }
            }
            
            mousedown = null;
        }
        else if (control = flyingon.findControl(e.target))
        {
            control.trigger(new MouseEvent(e));
        }
    };
        
            
    events.click = mouse_event;
    
    
    events.dblclick = mouse_event;
    
    
    events.mouseover = mouse_event;
    
    
    events.mouseout = mouse_event;
    
    
    
    events.keydown = key_event;
    
    events.keypress = key_event;
    
    events.keyup = key_event;
        
    
    
    //绑定事件
    for (var name in events)
    {
        on(document, name, events[name]);
    }
    

    
})(flyingon, document);
