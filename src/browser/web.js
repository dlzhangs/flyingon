
//全局动态执行js, 防止局部执行增加作用域而带来变量冲突的问题
flyingon.globalEval = function (text) {

    if (window.execScript)
    {
        //ie8不支持call, ie9的this必须是window否则会出错
        window.execScript(text);
    }
    else
    {
        window['eval'](text);
    }
};


//转换url为绝对路径
flyingon.absoluteUrl = (function () {

    var dom = document.createElement('a'),
        base = location.href.replace(/[?#][\s\S]*/, ''),
        regex;

    dom.href = '';

    if (!dom.href)
    {
        dom = document.createElement('div');
        regex = /"/g;
    }

    return function (url, path) {

        if (url)
        {
            if (regex)
            {
                dom.innerHTML = '<a href="' + url.replace(regex, '%22') + '"></a>';
                url = dom.firstChild.href;
            }
            else
            {
                dom.href = url;
                url = dom.href;
            }
        }
        else
        {
            url = base;
        }

        return path ? url.substring(0, url.lastIndexOf('/') + 1) : url;
    };

})();



//head兼容处理
document.head || (document.head = document.getElementsByTagName('head')[0]);


//是否ie8, ie9及以下版本
flyingon.ie9 = (flyingon.ie8 = !-[1,]) || document.documentMode === 9;



//创建脚本标签
flyingon.script = function (src, callback) {

    var dom = document.createElement('script');

    if (flyingon.ie9)
    {
        dom.onreadystatechange = function () {

            if ('loaded,complete'.indexOf(this.readyState) >= 0)
            {
                callback.call(this, src);
                dom = null;
            }
        };
    }
    else
    {
        dom.onload = function () {

            callback.call(this, src);
            dom = null;
        };
    }

    dom.onerror = function (e) {

        callback.call(this, src, e || true);
        dom = null;
    };

    //dom.async = false;
    dom.src = src;

    document.head.appendChild(dom);

    return dom;
};


//创建link标签
flyingon.link = function (href, type, rel) {

    var dom = document.createElement('link');

    dom.href = href;
    dom.type = type || 'text/css';
    dom.rel = rel || 'stylesheet';

    document.head.appendChild(dom);

    return dom;
};


//动态添加样式表
flyingon.style = function (cssText) {

    var dom = document.createElement('style');  

    dom.setAttribute('type', 'text/css');  

    if (dom.styleSheet) // IE  
    {
        dom.styleSheet.cssText = cssText;  
    }
    else // w3c  
    {
        dom.appendChild(document.createTextNode(cssText));  
    }

    document.getElementsByTagName('head')[0].appendChild(dom);
    return dom;
};





