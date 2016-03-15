//UI事件
$class('UIEvent', [Object, flyingon.Event], function (self) {
   
        
    $constructor(function (type) {

        this.type = type;
    });
    
        
    //阻止dom事件冒泡
    self.dom_stopPropagation = function () {

        var e = this.dom_event;

        if (e)
        {
            e.cancelBubble = true;
        }
    };


    //禁止默认dom事件
    self.dom_preventDefault = function () {

        var e = this.dom_event;

        if (e)
        {
            e.defaultPrevented = true;
        }
    };


    //阻止dom事件冒泡及禁止默认dom事件
    self.dom_stopImmediatePropagation = function () {

        var e = this.dom_event;

        if (e)
        {
            e.cancelBubble = e.defaultPrevented = true;
        }
    };

    
});


//鼠标事件类型
$class("MouseEvent", [Object, flyingon.UIEvent], function () {



    $constructor(function (type, dom_event, pressdown) {

        this.type = type;

        //触事件的dom对象
        this.dom = pressdown ? pressdown.dom : dom_event.target;

        //关联的原始dom事件
        this.dom_event = dom_event;

        //是否按下ctrl键
        this.ctrlKey = dom_event.ctrlKey;

        //是否按下shift键
        this.shiftKey = dom_event.shiftKey;

        //是否按下alt键
        this.altKey = dom_event.altKey;

        //是否按下meta键
        this.metaKey = dom_event.metaKey;

        //事件触发时间
        this.timeStamp = dom_event.timeStamp;

        //鼠标按键处理
        //IE678 button: 1->4->2 W3C button: 0->1->2
        //本系统统一使用which 左中右 1->2->3
        if (!(this.which = dom_event.which))
        {
            this.which = type & 1 ? 1 : (type & 2 ? 3 : 2);
        }
        
        //包含滚动距离的偏移位置
        this.pageX = dom_event.pageX;
        this.pageY = dom_event.pageY;

        //不包含滚动距离的偏移位置
        this.clientX = dom_event.clientX;
        this.clientY = dom_event.clientY;

        //相对屏幕左上角的偏移位置
        this.screenX = dom_event.screenX;
        this.screenY = dom_event.screenY;

        //关联的按下时dom事件
        if (this.pressdown = pressdown)
        {
            //从按下时起鼠标移动距离
            this.distanceX = dom_event.clientX - pressdown.clientX;
            this.distanceY = dom_event.clientY - pressdown.clientY;
        }

    });


});




//键盘事件类型
$class("KeyEvent", [Object, flyingon.UIEvent], function () {



    $constructor(function (type, dom_event) {

        this.type = type;

        //触事件的dom对象
        this.dom = dom_event.target;

        //关联的原始dom事件
        this.dom_event = dom_event;

        //是否按下ctrl键
        this.ctrlKey = dom_event.ctrlKey;

        //是否按下shift键
        this.shiftKey = dom_event.shiftKey;

        //是否按下alt键
        this.altKey = dom_event.altKey;

        //是否按下meta键
        this.metaKey = dom_event.metaKey;

        //事件触发时间
        this.timeStamp = dom_event.timeStamp;

        //键码
        this.which = dom_event.which || event.charCode || event.keyCode;

    });


});


