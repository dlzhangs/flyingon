(function (flyingon) {



    function checked_base(prototype, base, type) {



        $constructor(function () {

            var dom = this.dom.children[0];

            this.dom_label = dom;
            this.dom_text = dom.children[1];

            this[".change_event"](this.dom_input = dom.children[0]);

        });



        //创建dom元素模板
        prototype.create_dom_template("div", null, "<label style='position:relative;padding:2px 0;'><input type='" + type + "'/><span></span></label>");




        //混入编辑控件接口
        flyingon.IEditor(Class, prototype, base);



        //是否只读
        prototype.defineProperty("readOnly", false);


        //是否选中
        prototype.defineProperty("checked", false, {

            set_code: "this.dom_input && (this.dom_input.checked = value);"
        });


        //文字
        prototype.defineProperty("text", "", {

            set_code: "this.dom_text && (this.dom_text.innerHTML = value);"
        });




        //绑定input元素change事件
        prototype[".change_event"] = function (input) {

            //IE7,8在失去焦点时才会触发onchange事件
            if ("onpropertychange" in input)
            {
                input.onpropertychange = dom_change_fix;
            }
            else
            {
                input.onchange = dom_change;
            }
        };


        //IE特殊处理
        function dom_change_fix(event) {

            if ((event || window.event).propertyName === "checked")
            {
                dom_change.call(this, event);
            }
        };



        //值变更方法
        function dom_change(event) {

            var target = this.parentNode.parentNode.flyingon;

            if (this.checked !== target.checked && (target.get_readOnly() || target.trigger("change") === false))
            {
                this.checked = target.checked;
            }
        };



        prototype.arrange = function (width, height) {

            base.arrange.call(this);
            this.dom_label.style.top = ((this.clientHeight - this.dom_label.offsetHeight) >> 1) + "px";
        };


    };





    //复选框
    $class("CheckBox", flyingon.Control, function (Class, prototype, base) {



        //扩展功能
        checked_base(prototype, base, "checkbox");


    });




    //单选框
    $class("RadioButton", flyingon.Control, function (Class, prototype, base) {



        //扩展功能
        checked_base(prototype, base, "radio");


    });




})(flyingon);