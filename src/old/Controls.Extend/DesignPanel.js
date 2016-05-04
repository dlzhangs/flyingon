
$class("DesignPanel", flyingon.Panel, function (Class, prototype, base) {




    var defaults1 = flyingon.Control.prototype.__defaults,
        defaults2 = flyingon.Panel.prototype.__defaults,

        dom_selected = document.createElement("div"),

        selected_x = 0,
        selected_y = 0;


    dom_selected.style.cssText = "position:absolute;background-color:yellow;border:1px solid blue;filter:alpha(opacity=50);-moz-opacity:0.5;-khtml-opacity:0.5;opacity:0.5;z-index:1000;";


    //this.defaultValue("resizable", "none");

    prototype.defaultValue("draggable", "none");



    prototype["on.capture.mouseover"] = function (event) {

        defaults1.resizable = "both";
        defaults1.draggable = "both";
        defaults2.droppable = true;
    };


    prototype["on.capture.mouseout"] = function (event) {

        defaults1.resizable = "none";
        defaults1.draggable = "none";
        defaults2.droppable = false;
    };


    prototype["on.capture.mousedown"] = function (event) {

        document.title = "mousedown " + event.target.xtype;
    };


    prototype["on.bubble.mousedown"] = function (event) {

        var box = this.__boxModel,
            offset = flyingon.offset(this.dom, event.clientX - box.borderLeft, event.clientY - box.borderTop),
            style = dom_selected.style;

        style.left = (selected_x = offset.x + this.__scrollLeft) + "px";
        style.top = (selected_y = offset.y + this.__scrollTop) + "px";
        style.width = "0";
        style.height = "0";

        this.dom.appendChild(dom_selected);

    };


    prototype["on.bubble.mousemove"] = function (event) {

        if (event.pressdown)
        {
            var style = dom_selected.style,
                cache = event.distanceX;

            style.left = (cache > 0 ? selected_x : selected_x + cache) + "px";
            style.width = (cache > 0 ? cache : -cache) + "px";

            cache = event.distanceY;

            style.top = (cache > 0 ? selected_y : selected_y + cache) + "px";
            style.height = (cache > 0 ? cache : -cache) + "px";
        }
    };


    prototype["on.bubble.mouseup"] = function (event) {

        this.dom.removeChild(dom_selected);
    };



});