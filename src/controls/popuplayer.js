
//自动引入样式
$include('flyingon/css/{skin}/flyingon-controls.css', true);


/**
* 弹出层组件
* 
* 事件:
* open: 打开事件
* autoclosing: 自动关闭前事件(可取消)
* closing: 关闭前事件(可取消)
* closed: 关闭后事件
*/
$class('PopupLayer', flyingon.Component, function (base) {



    var layers = [], //弹出层管理器

        Event = flyingon.UIEvent; //UI事件类



    $constructor(function (dispose) {

        var dom = this.dom = document.createElement('div');

        dom.className = 'flyingon-PopupLayer';
        dom.style.cssText = 'position:absolute;visibility:hidden;';
        
        this.__dispose = dispose;
    });



    //弹出层宽度
    this.defineProperty('width', '', {

        set: 'this.dom.style.width = value > 0 ? value + "px" : value;'
    });


    //弹出层高度
    this.defineProperty('height', '', {

        set: 'this.dom.style.height = value > 0 ? value + "px" : value;'
    });


    //是否支持多级弹出层
    this.defineProperty('multi', false);


    //鼠标移出弹出层时是否自动关闭
    this.defineProperty('closeLeave', false);


    //鼠标离弹出层越来越远时是否自动关闭
    this.defineProperty('closeAway', false);
    
    
    //弹出定位方式 值:对象
    //position: 停靠位置 bottom:下面 top:上面 right:右边 left:左边
    //align: 对齐 left|center|right|top|middle|bottom
    //reverse: 空间不足时是否反转方向
    //offset1: 当前方向偏移
    //offset2: 相反方向偏移
    this.defineProperty('location', null);



    //打开弹出层
    //dom: 参考停靠的dom对象
    this.open = function (dom) {

        if (check_open(this) !== false)
        {
            var location = this.location() || {};
            
            flyingon.dom_align(this.dom, dom, location.position, location.align, location.reverse, location.offset1 || 2, location.offset2 || 2);
            open(this);
            
            return true;
        }

        return false;
    };


    //在指定的位置打开弹出层
    this.openAt = function (left, top) {

        if (check_open(this) !== false)
        {
            var style = this.dom.style;

            if (left > 0 || left < 0)
            {
                left += 'px';
            }
            
            if (top > 0 || top < 0)
            {
                top += 'px';
            }
            
            style.left = left;
            style.top = top;
            
            open(this);
            return true;
        }

        return false; 
    };


    function check_open(self) {

        var items = layers,
            length = items.length,
            dom;

        if (length > 0)
        {
            for (var i = 0; i < length; i++)
            {
                if (items[i] === self)
                {
                    return false;
                }
            }
            
            if (!self.multi() || !items[0].multi())
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


    function open(self) {

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
        
        //触发打开事件
        self.trigger('open');
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
    this.close = function (closeType, event, off) {

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
    
    
    this.dispose = function () {
        
        this.dom = null;
        base.dispose.call(this);  
    };


});

