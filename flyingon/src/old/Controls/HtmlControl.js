
//Html控件
$class("HtmlControl", flyingon.Control, function (Class, prototype, base) {




    prototype.defineProperty("html", "", {

        set_code: "this.dom && flyingon.html(this.dom, value);"
    });



    prototype.appendChild = function (dom) {

        this.dom.appendChild(dom);
        return this;
    };


    prototype.insertBefore = function (dom, target) {

        this.dom.insertBefore(dom, target);
        return this;
    };


    prototype.removeChild = function (dom) {

        this.dom.removeChild(dom);
        return this;
    };



    prototype.deserialize_from_dom = function (dom) {

        flyingon.html(this.dom, this.__fields.html = dom.innerHTML);
    };


});