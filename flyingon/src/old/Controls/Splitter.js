
//分隔条控件
$class("Splitter", flyingon.Control, function (Class, prototype, base) {





    prototype.defaultWidth = prototype.defaultHeight = 4;



    //重载resizable不允许调整大小
    flyingon.defineProperty(prototype, "resizable", function () {

        return "none";
    });




    prototype.measure = function () {

        var target = this[".parent"];

        if (target && (target = target.__layout))
        {
            target[".init_splitter"](this, "fill", "fill", target.vertical);
        }

        return base.measure.apply(this, arguments);
    };



    prototype[".check_drag"] = function (draggable, event) {

        //未按下ctrl键禁止拖动
        return event.ctrlKey ? draggable : null;
    };


    prototype["on.bubble.mousemove"] = function (event) {

        var target, layout, start, index, value;

        if (!event.ctrlKey &&
            (start = event.pressdown) &&
            (index = this.__arrange_index - 1) >= 0 &&
            (target = this[".parent"]) && (layout = target.__layout) &&
            (target = target.__children[index]))
        {
            start = start.start || (start.start = layout[".resize_start"](target, layout.vertical, this));
            value = start.vertical ? event.distanceY : event.distanceX;

            layout[".resize"](target, start, start.reverse ? -value : value);

            event.stopPropagation(false);
        }
    };



});