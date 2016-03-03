/// <reference path="../Base/Core.js" />
/// <reference path="Control.js" />


//文本框
$class("TextBox", flyingon.Control, function (Class, prototype, base) {



    $constructor(function () {

        (this.dom_input = this.dom).onchange = this[".dom_onchange"];
    });



    //创建dom元素模板
    prototype.create_dom_template("input", null, { type: "text" });



    //混入编辑控件接口
    flyingon.IEditor(Class, prototype, base);



});





//密码框
$class("Password", flyingon.Control, function (Class, prototype, base) {



    $constructor(function () {

        (this.dom_input = this.dom).onchange = this[".dom_onchange"];
    });



    //创建dom元素模板
    prototype.create_dom_template("input", null, { type: "password" });



    //混入编辑控件接口
    flyingon.IEditor(Class, prototype, base);



});