
//鼠标事件类型
$class("MouseEvent", flyingon.Event, function (Class, prototype, base) {



    $constructor(Class = function (type, dom_event, pressdown) {

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

        //鼠标按键 左:1 中:2 右:3
        this.which = pressdown ? pressdown.which : dom_event.which;

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

    }, 2);



    //禁止或开启单击事件
    prototype.disable_click = function (disable) {

        flyingon.__disable_click = disable !== false;
    };


    //禁止或开启双击事件
    prototype.disable_dbclick = function (disable) {

        flyingon.__disable_dbclick = disable !== false;
    };


    //当前事件触发时的dom是否从属于指定的dom
    prototype.in_dom = function (dom) {

        var target = this.dom;

        while (target)
        {
            if (target === dom)
            {
                return true;
            }

            target = target.parentNode;
        }

        return false;
    };


});




//拖拉事件类型
$class("DragEvent", flyingon.MouseEvent, function (Class, prototype, base) {


    //拖动目标控件
    prototype.dragTarget = null;

    //拖动控件集合
    prototype.dragTargets = null;

    //接收目标
    prototype.dropTarget = null;


    //拖动目标x偏移
    prototype.offsetLeft = 0;

    //拖动目标y偏移
    prototype.offsetTop = 0;


});




////触摸事件类型
//$class("TouchEvent", flyingon.Event, function (Class, prototype, base) {



//    $constructor(Class = function (type, dom_event, pressdown) {


//        this.type = type;

//        //关联的原始dom事件
//        this.dom_event = dom_event;

//        //关联的按下时dom事件
//        this.pressdown = pressdown;

//        //唯一标识触摸会话(touch session)中的当前手指        
//        this.identifier = dom_event.identifier;

//        //位于屏幕上的所有手指的列表
//        this.touches = dom_event.touches;

//        //位于当前DOM元素上手指的列表
//        this.targetTouches = dom_event.targetTouches;

//        //涉及当前事件手指的列表
//        this.changedTouches = dom_event.changedTouches;

//        //是否按下ctrl键
//        this.ctrlKey = dom_event.ctrlKey;

//        //是否按下shift键
//        this.shiftKey = dom_event.shiftKey;

//        //是否按下alt键
//        this.altKey = dom_event.altKey;

//        //是否按下meta键
//        this.metaKey = dom_event.metaKey;

//        //事件触发时间
//        this.timeStamp = dom_event.timeStamp;

//    }, 2);


//});




//键盘事件类型
$class("KeyEvent", flyingon.Event, function (Class, prototype, base) {



    $constructor(Class = function (type, dom_event) {

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
        this.which = dom_event.which;

    }, 2);


});


