
//文字
(function (flyingon) {



    var text_base = function (prototype, base) {



        //创建dom元素模板
        prototype.create_dom_template("div", null, "<span style='position:relative;margin:0;border:0;padding:0;'></span>");



        prototype.writeHtml = function (data) {

            data.push("<span style='position:relative;margin:0;border:0;padding:0;'></span>");
        };



        prototype.defineProperty("text", "", {

            set_code: "this.dom_span && flyingon.html(this.dom_span, value);",
            change_code: "this['.change_text'](value);"
        });



        prototype.after_measure = function (box) {

            //var style = (this.dom_span || (this.dom_span = this.dom.children[0])).style;

            //switch (this.get_verticalAlign())
            //{
            //    case "top":
            //        style.top = "0";
            //        break;

            //    case "middle":
            //        style.top = ((this.clientHeight - this.dom_span.offsetHeight) >> 1) + "px";
            //        break;

            //    default:
            //        style.top = this.clientHeight - this.dom_span.offsetHeight + "px";
            //        break;
            //}
        };


        //测量自动大小(需返回变化值)
        prototype[".measure_auto"] = function (box) {

            return {

                width: box.auto_width ? this.dom_span.offsetWidth + box.client_width - this.offsetWidth : 0,
                height: box.auto_height ? this.dom_span.offsetHeight + box.client_height - this.offsetHeight : 0
            }
        };


        prototype.deserialize_from_dom = function (dom) {

            this.dom_span && flyingon.html(this.dom_span, this.__fields.text = dom.innerHTML);
        };

    };



    //标签
    $class("Label", flyingon.Control, function (Class, prototype, base) {



        text_base(prototype, base);


        prototype[".change_text"] = function (text) {

            var box = this.__boxModel;

            if (box && this[".parent"])
            {
                if (box.auto_width || box.auto_height)
                {
                    this.__update_dirty = 1
                    this[".parent"].update(true);
                }
                else
                {
                    this.after_measure(box);
                }
            }
        };


    });



    //竖直文字
    $class("VerticalText", flyingon.Control, function (Class, prototype, base) {



        text_base(prototype, base);



        prototype[".change_text"] = function (text) {

            var box = this.__boxModel;

            this.__vertical_text = false;

            if (box && this[".parent"])
            {
                if (box.auto_width || box.auto_height)
                {
                    this.__update_dirty = 1
                    (this[".parent"] || this).update(true);
                }
                else
                {
                    if (text)
                    {
                        this.before_measure(box);
                    }

                    this.after_measure(box);
                }
            }
        };


        prototype.before_measure = function (box) {

            if (this.get_vertical() || this[".parent"].get_vertical()) //当设置为竖排或容器面板为坚排时则竖排文字
            {
                if (!this.__vertical_text)
                {
                    var text = this.__fields.text;

                    if (text)
                    {
                        this.dom_span.innerHTML = text.split("").join("<br>");
                    }

                    this.__vertical_text = true;
                }
            }
            else if (this.__vertical_text)
            {
                this.dom_span.innerHTML = this.__fields.text;
                this.__vertical_text = false;
            }
        };


    });



})(flyingon);