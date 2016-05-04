/*

*/
$class("Fieldset", flyingon.Panel, function (Class, prototype, base) {




    $constructor(function () {

        this.dom_legend = this.dom.children[0];
        this.dom_children = this.dom.children[1];

        this.children = this.__children = new flyingon.ControlCollection(this);
    });



    //设置默认大小
    prototype.defaultWidth = prototype.defaultHeight = 400;



    //创建dom元素模板
    prototype.create_dom_template("fieldset", null, "<legend></legend><div style='position:relative;margin:0;border:0;padding:0;left:0;top:0;overflow:hidden;'></div>");



    //修改默认值
    prototype.defaultValue("paddingLeft", 2);


    //标题
    prototype.defineProperty("legend", "", {

        set_code: "this.dom_legend && (this.dom_legend.innerHTML = value);"
    });



});

