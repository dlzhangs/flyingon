/*

*/
$class("Button", flyingon.Control, function (prototype, base) {




    //创建dom元素模板
    prototype.create_dom_template("input", null, { type: "button" });


    prototype.defaultHeight = 25;

    

    //文字
    prototype.defineProperty("text", "", {

        set_code: "this.dom && (this.dom.value = value);"
    });



});

