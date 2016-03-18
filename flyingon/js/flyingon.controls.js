/*
* flyingon javascript library v0.0.1
* https://github.com/freeoasoft/flyingon 
* Copyright 2014, yaozhengyang
* licensed under the LGPL Version 3 licenses
*/

/**
* 弹出层组件
* 
* 事件:
* open: 打开事件
* autoclosing: 自动关闭前事件(可取消)
* closing: 关闭前事件(可取消)
* closed: 关闭后事件
*/
$class('PopupLayer', flyingon.IObject, function (self, base) {



    var layers = [], //弹出层管理器

        Event = flyingon.UIEvent; //UI事件类



    $constructor(function (dispose) {

        var dom = this.dom = document.createElement('div');

        dom.className = 'flyingon-Popuplayer';
        dom.style.cssText = 'position:absolute;visibility:hidden;';
        
        this.__dispose = dispose;
    });



    //弹出层宽度
    self.defineProperty('width', '', {

        set: 'this.dom.style.width = value > 0 ? value + "px" : value;'
    });


    //弹出层高度
    self.defineProperty('height', '', {

        set: 'this.dom.style.height = value > 0 ? value + "px" : value;'
    });


    //是否支持多级弹出层
    self.defineProperty('multi', false);


    //鼠标移出弹出层时是否自动关闭
    self.defineProperty('closeLeave', false);


    //鼠标离弹出层越来越远时是否自动关闭
    self.defineProperty('closeAway', false);



    //打开弹出层
    //dom: 参考停靠的dom对象
    //position: 停靠位置 bottom:下面 top:上面 right:右边 left:左边
    //align: 对齐 left|center|right|top|middle|bottom
    //reverse: 空间不足时是否反转方向
    //offset1: 当前方向偏移
    //offset2: 相反方向偏移
    self.open = function (dom, position, align, reverse, offset1, offset2) {

        if (layers.indexOf(this) < 0 && check_open(this) !== false)
        {
            var rect = dom.getBoundingClientRect(),
                div = this.dom,
                width = div.offsetWidth,
                height = div.offsetHeight,
                x,
                y;

            offset1 = (+offset1 || 0) + 2;

            //检测是否需倒转方向
            if (reverse !== false)
            {
                var client = document.documentElement,
                    client_width = window.innerWidth || client.offsetHeight || 0,
                    client_height = window.innerHeight || client.offsetHeight || 0;

                offset2 = (+offset2 || 0) + 2;

                switch (position)
                {
                    case 'left':
                        if (rect.left - offset1 < height && client_width - rect.right - offset2 >= width)
                        {
                            offset1 = offset2;
                            position = 'right';
                        }
                        break;

                    case 'top':
                        if (rect.top - offset1 < height && client_height - rect.bottom - offset2 >= height)
                        {
                            offset1 = offset2;
                            position = 'bottom';
                        }
                        break;

                    case 'right':
                        if (rect.left - offset2 >= width && client_width < rect.right + offset1 + width)
                        {
                            offset1 = offset2;
                            position = 'left';
                        }
                        break;

                    default: 
                        if (rect.top - offset2 >= height && client_height < rect.bottom + offset1 + height)
                        {
                            offset1 = offset2;
                            position = 'top';
                        }
                        break;
                }
            }

            if (position === 'left' || position === 'right')
            {
                x = position === 'left' ? rect.left - width - offset1 : rect.right + offset1;

                switch (align)
                {
                    case 'middle':
                        y = rect.top - (height - dom.offsetHeight >> 1);
                        break;

                    case 'bottom':
                        y = rect.bottom - height;
                        break;

                    default:
                        y = rect.top;
                        break;
                }
            }
            else
            {
                switch (align)
                {
                    case 'center':
                        x = rect.left - (width - dom.offsetWidth >> 1);
                        break;

                    case 'right':
                        x = rect.right - width;
                        break;

                    default:
                        x = rect.left;
                        break;
                }

                y = position === 'top' ? rect.top - height - offset1 : rect.bottom + offset1;
            }

            open(this, x + 'px', y + 'px');
        }

        return false;
    };


    //在指定的位置打开弹出层
    self.openAt = function (left, top) {

        if (layers.indexOf(this) < 0 && check_open(this) !== false)
        {
            if (left > 0 || left < 0)
            {
                left += 'px';
            }
            
            if (top > 0 || top < 0)
            {
                top += 'px';
            }
            
            open(this, left, top);
            return true;
        }

        return false; 
    };


    function check_open(self) {

        var length = layers.length,
            dom;

        if (length > 0)
        {
            if (!self.multi() || !layers[0].multi())
            {
                for (var i = length - 1; i >= 0; i--)
                {
                    if (self.close('auto', null, false) === false)
                    {
                        return false;
                    }
                }
            }
        }
        else //绑定全局事件
        {
            flyingon.dom_on(document, 'mousedown', document_mousedown);
            flyingon.dom_on(document, 'keydown', document_keydown);
        }

        dom = self.dom;
        dom.style.visibility = 'visible';
        document.body.appendChild(dom);

        return true;
    };


    function open(self, left, top) {

        var style = self.dom.style;

        style.left = left;
        style.top = top;

        if (self.closeAway())
        {
            closeAway(self);
        }

        if (self.closeLeave())
        {
            closeLeave(self);
        }

        //添加弹出层
        layers.push(self);
    };


    //处理全局点击事件,点击当前弹出层以外的区域则关闭当前弹出层
    function document_mousedown(e) { 

        var layer = layers[layers.length - 1];

        if (layer) {

            var dom = layer.dom,
                target = e.target;

            while (target) 
            {
                if (target === dom) 
                {
                    return;
                }

                target = target.parentNode;
            }

            //调用关闭弹出层方法, 关闭类型为'auto'
            if (layer.trigger(new Event('autoclosing', e.target)) !== false) 
            {
                layer.close('auto', e);
            }
        }
    };


    //处理全局键盘事件,点击Esc则退出当前窗口
    function document_keydown(e) { 

        var layer;

        if (e.which === 27 && (layer = layers[layers.length - 1]))
        {
            layer.close('cancel', e);
        }
    };


    function closeLeave(self) {

        var dom = self.dom;

        flyingon.dom_on(dom, 'mouseout', self.__dom_mouseout = function (e) {

            if (self === layers[layers.length - 1])
            {
                var rect = dom.getBoundingClientRect(),
                    x = e.clientX,
                    y = e.clientY;

                if (x >= rect.right || y >= rect.bottom || x <= rect.left || y <= rect.top)
                {
                    self.close('auto', e);
                }
            }
        });
    };


    function closeAway(self) {

        var rect = self.dom.getBoundingClientRect(), 
            source;

        flyingon.dom_on(document, 'mousemove', self.__document_mousemove = function (e) {

            if ((!source || self === layers[layers.length - 1]) && 
                (source = check_closeAway(e, rect, source)) === true)
            {
                self.close('auto', e);
            }
        });
    };


    function check_closeAway(e, rect, source) {

        var x = e.clientX,
            y = e.clientY;

        if (source)
        {
            if (rect.left - x > source.x1 + 4 || 
                x - rect.right > source.x2 + 4 || 
                rect.top - y > source.y1 + 4 || 
                y - rect.bottom > source.y2 + 4)
            {
                return true;
            }
        }
        else
        {
            source = Math.max;
            source = {

                x1: source(rect.left - x, 0),
                x2: source(x - rect.right, 0),
                y1: source(rect.top - y, 0),
                y2: source(y - rect.bottom, 0)
            };
        }

        return source;
    };


    //关闭弹出层(弹出多级窗口时只有最后一个可以成功关闭)
    //closeType: 关闭类型 ok, cancel, auto
    self.close = function (closeType, event, off) {

        if (this === layers[layers.length - 1])
        {
            var dom = this.dom,
                e = new Event('closing', event),
                fn;

            e.closeType = closeType || 'ok';

            if (this.trigger(e) === false) 
            {
                return false;
            }

            //注销事件
            if (fn = this.__document_mousemove)
            {
                flyingon.dom_off(document, 'mousemove', fn);
                this.__document_mousemove = null;
            }

            if (fn = this.__dom_mouseout)
            {
                flyingon.dom_off(this.dom, 'mouseout', fn);
                this.__dom_mouseout = null;
            }

            layers.pop();

            dom.parentNode.removeChild(dom);

            //注销全局事件
            if (off !== false && !layers.length)
            { 
                flyingon.dom_off(document, 'mousedown', document_mousedown);
                flyingon.dom_off(document, 'keydown', document_keydown);
            }

            e = new Event('closed', event);
            e.closeType = closeType || 'ok';

            this.trigger(e);
            
            if (this.__dispose)
            {
                this.dispose();
            }
            
            return true;
        }

        return false;
    };
    
    
    self.dispose = function () {
        
        this.dom = null;
        base.dispose.call(this);  
    };


});



$include('flyingon/layout/{layout}.js');

$namespace(function (flyingon) {
   
    
    
    $class('Dialog', flyingon.Panel, function (self, base) {
    
        
        //已打开的窗口集合
        var dialog_list = [];
        
        
        self.createDomTemplate('<div style="position:absolute;border-width:1px;z-index:100;">'
                + '<div class="flyingon-Dialog-head"></div>'
                + '<div class="flyingon-Dialog-body"></div>'
            + '</div>');
        
            
        
        $constructor(function () {
           
            var Control = flyingon.Control,
                self = this,
                head = this.head = new flyingon.Panel(),
                icon = head.icon = new Control(),
                title = head.title = new Control(),
                close = head.close = new Control();
                  
            icon.addClass('flyingon-Dialog-icon').id('icon');
            title.addClass('flyingon-Dialog-title').id('title');
            close.addClass('flyingon-Dialog-close').id('close');
            
            close.on('click', function (e) {
               
                self.close();
            });
            
            head.layout('flyingon-Dialog-head');
            head.children().push(icon, title, close);
            head.__parent = this;
            head.__dom_dirty = true;
            
            this.dom.children[0].appendChild(head.dom);
            
            dragmove(this);
        });
        
        
        self.defaultWidth = 400;
        
        self.defaultHeight = 300;
        
        self.defaultValue('border', 1);
        
        
        //窗口图标        
        self.defineProperty('icon', '', {
           
            set: 'this.__set_icon(value);'
        });
        
        
        //窗口标题
        self.defineProperty('title', '', {
           
            set: 'this.head.title.dom.innerHTML = value;'
        });
        
        
        self.defineProperty('html', '', {
           
            set: 'this.clear();\n\t' + 'this.dom.children[1].innerHTML = value;'
        });
        
        
        //是否可拖动窗口
        self.defineProperty('draggable', true, {
            
            set: 'this.__set_draggable(value);'
        });
        
        
        //是否可调整大小
        self.defineProperty('resizable', true, {
           
            set: 'this.__set_resizable(value);'
        });
        
        
        //是否显示关闭按钮
        self.defineProperty('closable', true, {
           
            set: 'this.head.close.visible(value);'
        });
        
        
        //是否居中显示
        self.defineProperty('center', true);
        
        
        self.__set_icon = function (value) {
                      
            var icon = this.head.icon;
            
            icon.visible(value);
            icon.className = 'flyingon-Control flyingon-Dialog-icon ' + (value || '');
        };
        
        
        self.__set_draggable = function (value) {
          
            var fn = this.__draggable;
            
            if (fn)
            {
                flyingon.dom_off(this.dom.children[0], 'mousedown', fn);
            }
            
            if (value)
            {
                dragmove(this);
            }
        };
        
        
        function dragmove(self) {
            
            flyingon.dom_on(self.dom.children[0], 'mousedown', self.__draggable = function (e) {
                
                //指定被拖动的对象
                e.dom = self.dom;
                flyingon.dragmove(self, e);
            });
        };
        
        
        self.__set_resizable = function (value) {
            
        };
        
        
        //扩展顶级控件接口
        flyingon.ITopControl(self);
        
        
        self.show = function () {
          
            if (dialog_list.indexOf(this) < 0)
            {
                open(this);
            }
            else
            {
                
            }
        };
        
        
        self.showDialog = function () {
          
            if (dialog_list.indexOf(this) < 0)
            {
                open(this, true);
            }
        };
        
        
        function open(self, overlay) {
            
            var body = document.body,
                dom = self.dom;
            
            if (overlay)
            {
                overlay = self.overlay = document.createElement('div');
                overlay.className = 'flyingon-Dialog-overlay';
                overlay.style.zIndex = 100;
                
                body.appendChild(overlay);
            }
            
            body.appendChild(dom);
            
            self.refresh(2);
            
            if (self.center())
            {
                dom.style.left = ((body.clientWidth - dom.offsetWidth) >> 1) + 'px';
                dom.style.top = (((document.documentElement.clientHeight || body.clientHeight) - dom.offsetHeight) >> 1) + 'px';
            }
            
            self.trigger('open');
        };
        
        
        self.arrange = function () {
            
            this.refresh.call(this.head);
            base.arrange.call(this);
        };
        
        
        self.close = function (dispose) {
            
            if (this.trigger(new flyingon.Event('closing')) !== false)
            {
                var body = document.body;
                
                body.removeChild(this.dom);
                
                if (this.overlay)
                {
                    body.removeChild(this.overlay);
                    this.overlay = null;
                }
                
                this.trigger(new flyingon.Event('closed'));
                
                if (dispose)
                {
                    this.dispose();
                }
            }
        };
        
        
        self.dispose = function () {
            
            this.head.dispose();
            this.head = null;
            
            base.dispose.call(this);
        };
        
        
    });
    
    
});

