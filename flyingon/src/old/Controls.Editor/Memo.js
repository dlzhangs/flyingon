/// <reference path="../Base/Core.js" />
/// <reference path="Control.js" />


/*

*/
$class("Memo", flyingon.Control, function (Class, prototype, base) {



    $constructor(function () {

        (this.dom_input = this.dom).onchange = this[".dom_onchange"];
    });



    //修改默认宽高
    prototype.defaultWidth = 400;
    prototype.defaultHeight = 100;


    //创建dom元素模板
    prototype.create_dom_template("textarea", "resize:none;");




    //混入编辑控件接口
    flyingon.IEditor(Class, prototype, base);



});

