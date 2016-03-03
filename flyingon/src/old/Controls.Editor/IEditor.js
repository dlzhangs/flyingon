

//编辑控件接口
flyingon.IEditor = function (prototype, base) {


    

    //名称(IE567无法直接修改动态创建input元素的name值)
    prototype.defineProperty("name", "", {

        set_code: "this.dom_input && (this.dom_input.name = value);"
    });


    //值
    prototype.defineProperty("value", "", {

        set_code: "this.dom_input && (this.dom_input.value = value);"
    });


    //是否只读
    prototype.defineProperty("readonly", false, {

        set_code: "this.dom_input && (value ? (this.dom_input.readonly = 'readonly') : this.dom_input.removeAttribute('readonly'));"
    });


    prototype[".stateTo_disabled"] = function (value) {

        base[".stateTo_disabled"].call(this, value);
        this.dom_input.disabled = !value;
    };



    //绑定值变更事件
    prototype[".dom_onchange"] = function (event) {

        var target = this.flyingon;

        if (this.value !== target.value && target.trigger("change") === false)
        {
            this.value = target.value;
        }
    };



};




