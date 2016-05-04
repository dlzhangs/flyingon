//样式相关
namespace(function (flyingon) {


    var dom = document.documentElement,

        fixed = Object.create(null), //css兼容处理

        prefix1 = "-ms-",   //样式前缀

        prefix2 = "ms",     //样式前缀2

        regex = /^-(\w+)-/, //样式检测

        style,

        cache;



    //获取浏览器样式前缀
    if (cache = window.getComputedStyle)
    {
        style = cache(dom);

        for (var i = style.length - 1; i >= 0; i++)
        {
            if (cache = style[i].match(regex))
            {
                prefix1 = "-" + (prefix2 = cache[1]) + "-";
                break;
            }
        }
    }
    

    //测试样式
    style = dom.style;

    //转驼峰命名
    regex = /\-(\w)/g;

    //转换css名为驼峰写法
    function fn(_, x) {

        return x.toUpperCase();
    };


    //自动处理样式
    function auto_fixed(name) {

        var key = name.replace(regex_name, fn);

        if (key in style)
        {
            key1 = name;
        }
        else if ((key2 = (prefix2 + name).replace(regex_name, fn)) in style)
        {
            key1 = prefix1 + name;
        }
        else
        {
            key2 = null;
        }

        return fixed[name] = [key1, key2, null];
    };


    //获取带样式前缀的样式名
    //name:     要获取的样式名(css样式名, 以"-"分隔的样式名)
    flyingon.css_prefix = function (name) {

        return (fixed[name] || auto_fixed(name))[0];
    };


    //设置css样式值
    //dom:      目标dom
    //name:     要获取的样式名(css样式名, 以"-"分隔的样式名)
    //value:    样式值
    flyingon.css_value = function (dom, name, value) {

        var items = fixed[name] || auto_fixed(name),
            cache;

        if (cache = items[2])
        {
            cache(value, dom);
        }
        else if (cache = items[1])
        {
            dom.style[cache] = value;
        }
    };

    
    //注册样式兼容处理
    //name:     要处理的样式名(css样式名, 以"-"分隔的样式名)
    //setter:   转换样式值的方法
    flyingon.css_fixed = function (name, setter, new_name) {

        if (name && !auto_fixed(name)[0] && setter)
        {
            fixed[name] = [name, new_name || null, setter];
        }
    };


    //处理ie透明度
    flyingon.css_fixed("opacity", function (value, dom) {


    });


    //处理ie允许选中
    flyingon.css_fixed("user-select", (function () {

        function event_false() {

            return false;
        };

        return function (value, dom) {

            if (dom)
            {
                (dom === document.body ? document : dom).onselectstart = value === "none" ? event_false : null;
            }
        };

    })());



});