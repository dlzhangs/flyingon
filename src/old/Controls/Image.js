/// <reference path="../Base/Core.js" />
/// <reference path="Control.js" />


/*

*/
$class("Image", flyingon.Control, function (Class, prototype, base) {



    $constructor(function () {

        this.dom.load = this[".load_image"];
    });



    //设置默认大小
    prototype.defaultHeight = 100;

    prototype.defaultValue("width", "auto");

    prototype.defaultValue("height", "auto");


    //创建模板
    prototype.create_dom_template("img");



    //图片路径
    //变量
    //@theme        当前主题目录 
    //@language     当前语言目录
    prototype.defineProperty("src", "", {

        set_code: "this.dom && (this.dom.src = value ? value.replace('@theme', flyingon.settings.theme).replace('@language', flyingon.settings.language) : '');"
    });


    //未能正常加载图片时的提醒文字
    prototype.defineProperty("alt", "", {

        set_code: "this.dom && (this.dom.alt = value);"
    });



    prototype[".load_image"] = function () {

    };



});