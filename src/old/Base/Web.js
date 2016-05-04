
//前端基础扩展
namespace(function (flyingon) {



    //扩展Object.keys方法
    Object.keys || (Object.keys = function (target) {

        var keys = [];

        if (target)
        {
            for (var name in target)
            {
                keys.push(name);
            }
        }

        return keys;

    });


    //扩展Object.getOwnPropertyNames方法
    Object.getOwnPropertyNames || (Object.getOwnPropertyNames = function (target) {

        if (target)
        {
            var names = [],
                hasOwnProperty = target.hasOwnProperty;

            for (var name in target)
            {
                if (!hasOwnProperty || target.hasOwnProperty(name)) //IE67怪异模式下不支持hasOwnProperty
                {
                    names.push(name);
                }
            }

            return names;
        }

        return [];

    });



    //检测对象是否数组
    Array.isArray || (Array.isArray = (function () {

        var toString = Object.prototype.toString;

        return function (target) {

            return toString.call(target) === "[object Array]";
        };

    }()));



    //获取本地唯一id
    flyingon.uniqueId = (function () {

        function fn() {

            return fn[".id"]++;
        };

        fn[".id"] = 1;

        return fn;

    })();



    //编码对象
    flyingon.encode = function (data) {

        if (data)
        {
            var values = [],
                encode = encodeURIComponent;

            for (var name in data)
            {
                values.push(encode(name) + "=" + encode((data[name].toString())));
            }

            return values.length > 0 ? values.join("&") : "" + data;
        }

        return data;
    };


    //url编码
    flyingon.encodeURL = function (url, data) {

        return url && data ? (url.indexOf("?") >= 0 ? "&" : "?") + flyingon.encode(data) : url;
    };



    //当不存在window.JSON对象时扩展json解析器
    //使用危险代码检测的方法(无危险代码则使用eval解析)实现json解析
    flyingon.parseJSON = window.JSON && JSON.parse || (function () {

        var regex1 = /[a-zA-Z_$]/,
            regex2 = /\"(?:\\\"|[^"])*\"|\'(?:\\\'|[^'])*\'|null|true|false|\d+[eE][-+]?\d+/g

        return function (text) {

            if (typeof text === "string")
            {
                if (regex1.test(text.replace(regex2, "")))
                {
                    throw new flyingon.Exception("json error!");
                }

                return new Function("return " + text)();
            }
        };

    })();


});





//html文档树加载完毕
flyingon.ready = (function () {

    var list;

    function ready() {

        if (list)
        {
            flyingon.off(document, "DOMContentLoaded", ready);
            flyingon.off(window, "load", ready);

            for (var i = 0; i < list.length; i++) //执行过程中可能会加入函数，故不能缓存length
            {
                list[i]();
            }

            list = null;
        }
    };

    function check() {

        if (document.readyState === "complete")
        {
            ready();
        }
        else
        {
            setTimeout(check, 0);
        }
    };

    if (document.readyState !== "complete")
    {
        list = [];

        flyingon.on(document, "DOMContentLoaded", ready);
        flyingon.on(window, "load", ready);

        setTimeout(check, 0);
    }

    return function (fn) {

        if (typeof fn === "function")
        {
            if (list)
            {
                list.push(fn);
            }
            else
            {
                fn();
            }
        }
    };

})();




//浏览器相关扩展
//browser.name         当前浏览器名称
//browser.MSIE         当前浏览器是否IE浏览器
//browser.Chrome       当前浏览器是否Chrome浏览器
//browser.Firefox      当前浏览器是否Firefox浏览器
//browser.Safari       当前浏览器是否Safari浏览器
//browser.Opera        当前浏览器是否Opera浏览器
//browser.WebKit       当前浏览器是否WebKit内核浏览器
namespace(function (flyingon) {



    var head = document.head || document.getElementsByTagName("head")[0],
        div = document.createElement("div");



    //浏览器
    //browser.name         当前浏览器名称
    //browser.MSIE         当前浏览器是否IE浏览器
    //browser.Chrome       当前浏览器是否Chrome浏览器
    //browser.Firefox      当前浏览器是否Firefox浏览器
    //browser.Safari       当前浏览器是否Safari浏览器
    //browser.Opera        当前浏览器是否Opera浏览器
    //browser.WebKit       当前浏览器是否WebKit内核浏览器
    flyingon.browser = (function () {

        var browser = Object.create(null),
            names = ["MSIE", "Chrome", "Firefox", "Safari", "Opera"],
            value = navigator.userAgent,
            cache;

        if (cache = value.match(new RegExp(names.join("|"))))
        {
            browser.name = cache = cache[0];

            for (var i = 0; i < names.length; i++)
            {
                browser[names[i]] = names[i] === cache;
            }
        }
        else
        {
            browser.name = "other"; //其它浏览器
        }

        //是否WebKit内核浏览器
        browser.WebKit = !!value.match(/WebKit/);

        //获取浏览器视口对象 标准兼容模式视口为documentElement对象
        if (document.compatMode === "CSS1Compat")
        {
            browser.view = document.documentElement;
        }
        else
        {
            flyingon.ready(function () {

                browser.view = document.body;
            });
        }

        return browser;

    })();



    //动态创建脚本或样式标签
    try
    {
        //测试浏览器支持, IE会报错
        document.createElement("script").appendChild(document.createTextNode(""));

        //动态创建脚本标签
        flyingon.script = function (text, after) {

            var dom = document.createElement("script");

            dom.type = "text/javascript";
            dom.appendChild(document.createTextNode(text));

            head.appendChild(dom);
            return dom;
        };

        //动态创建样式标签
        flyingon.style = function (text) {

            var dom = document.createElement("style");

            dom.type = "text/css";
            dom.appendChild(document.createTextNode(text));

            head.appendChild(dom);
            return dom;
        };
    }
    catch (_)
    {
        //动态创建脚本标签
        flyingon.script = function (text, after) {

            var dom = document.createElement("script");

            dom.type = "text/javascript";
            dom.text = text;

            head.appendChild(dom);
            return dom;
        };

        //动态创建样式标签
        flyingon.style = function (text) {

            var dom = document.createElement("style");

            dom.type = "text/css";
            dom.styleSheet.cssText = text;

            head.appendChild(dom);
            return dom;
        };
    }



    //引入样式文件
    flyingon.link = function (url) {

        var dom = document.createElement("link");

        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = url;

        head.appendChild(dom);
        return dom;
    };



    //获取指定dom的大小
    //扩展不支持getBoundingClientRect获取视口坐标偏移实现
    //注1: 优先使用getBoundingClientRect来获取元素相对位置,支持此方法的浏览器有:IE5.5+、Firefox 3.5+、Chrome 4+、Safari 4.0+、Opara 10.10+
    //注2: 此方法不是准确获取元素的相对位置的方法,因为某些浏览器的html元素有2px的边框
    //注3: 此方法是为获取鼠标位置相对当前元素的偏移作准备,无须处理html元素边框,鼠标client坐标减去此方法结果正好准确得到鼠标位置相对元素的偏移
    var offset_fn = div.getBoundingClientRect ? null : function (dom) {

        //返回元素在浏览器当前视口的相对偏移(对某些浏览取值可能不够准确)
        //问题1: 某些浏览器的边框处理不够准确(有时不需要加边框)
        //问题2: 在table或iframe中offsetParent取值可能不准确
        var x = 0,
            y = 0;

        while (dom)
        {
            x += dom.offsetLeft;
            y += dom.offsetTop;

            if (dom = dom.offsetParent)
            {
                x += dom.clientLeft;
                y += dom.clientTop;
            }
        }

        return {

            left: x - (dom = flyingon.browser.view).scrollLeft,
            top: y - dom.scrollTop
        };
    };


    //获取指定dom相对指定视口坐标的偏移
    flyingon.offset = function (dom, x, y) {

        var offset = offset_fn ? offset_fn(dom) : dom.getBoundingClientRect();

        return x === void 0 ? offset : {

            x: x - offset.left,
            y: y - offset.top
        };
    };



    //dom文本内容属性名
    var textContent_name = "textContent" in div ? "textContent" : "innerText";


    //设置dom的html内容
    flyingon.html = function (dom, html) {

        if (html && html.indexOf('<') >= 0)
        {
            dom.innerHTML = html;
        }
        else
        {
            dom[textContent_name] = html;
        }
    };


    //设置dom的text内容
    flyingon.text = function (dom, text) {

        dom[textContent_name] = text;
    };



    //销毁dom节点
    //注:IE6/7/8使用removeChild方法无法回收内存及清空parentNode
    flyingon.distroy = function (dom) {

        if (dom)
        {
            if (dom.parentNode)
            {
                div.appendChild(dom);
            }

            div.innerHTML = "";
        }
    };


});



