
//Dom事件类型
$class('DomEvent', flyingon.Event, function () {
    
    
    $constructor(function (type, event) {
    
        this.type = type;
        this.dom_event = event;
        
    }, true);
    
    
});




//鼠标事件类型
$class('MouseEvent', flyingon.Event, function () {


    $constructor(function (event) {

        //关联的原始事件
        this.dom_event = event;

        //事件类型
        this.type = event.type;

        //触事件的dom对象
        this.dom = event.target;

        //是否按下ctrl键
        this.ctrlKey = event.ctrlKey;

        //是否按下shift键
        this.shiftKey = event.shiftKey;

        //是否按下alt键
        this.altKey = event.altKey;

        //是否按下meta键
        this.metaKey = event.metaKey;

        //事件触发时间
        this.timeStamp = event.timeStamp;

        //鼠标按键处理
        //IE678 button: 1->4->2 W3C button: 0->1->2
        //本系统统一使用which 左中右 1->2->3
        if (!(this.which = event.which))
        {
            this.which = event.button & 1 ? 1 : (event.button & 2 ? 3 : 2);
        }
        
        //包含滚动距离的偏移位置
        this.pageX = event.pageX;
        this.pageY = event.pageY;

        //不包含滚动距离的偏移位置
        this.clientX = event.clientX;
        this.clientY = event.clientY;

        //相对屏幕左上角的偏移位置
        this.screenX = event.screenX;
        this.screenY = event.screenY;

    }, true);

    
});




//键盘事件类型
$class('KeyEvent', flyingon.Event, function () {


    $constructor(function (event) {

        //关联的原始dom事件
        this.dom_event = event;

        //事件类型
        this.type = event.type;

        //触事件的dom对象
        this.dom = event.target;

        //是否按下ctrl键
        this.ctrlKey = event.ctrlKey;

        //是否按下shift键
        this.shiftKey = event.shiftKey;

        //是否按下alt键
        this.altKey = event.altKey;

        //是否按下meta键
        this.metaKey = event.metaKey;

        //事件触发时间
        this.timeStamp = event.timeStamp;

        //键码
        this.which = event.which || event.charCode || event.keyCode;

    }, true);

    
});


