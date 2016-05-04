

//Ajax及异步提交
namespace(function (flyingon) {




    //最低支持IE7
    window.XMLHttpRequest || flyingon.ready(function () {

        var div = document.createElement("div");

        div.style.cssText = "position:absolute;z-index:1000;background-color:white;left:0;top:0;width:100%;height:200px";
        div.innerHTML = "您的浏览器版本太低,请升级浏览器!";

        document.body.appendChild(div);
    });




    //Deffered
    $class("Deffered", function (prototype) {



        //fn是一个函数,会以当前实例作为this调用这个函数, 函数内需要调用this.resolve或this.reject改变执行状态
        $constructor(function () {

            this[".data"] = [];

        });


        //异步执行下一个函数
        prototype.next = function (fn, parameters) {

            if (typeof fn === "function")
            {
                var target = new flyingon.Deffered(),
                    data = this[".data"];

                //如果状态为done或fail则直接执行
                if (data.state < 8 && !data.abort)
                {
                    fn.apply(target, parameters);
                }
                else //否则注册待执行
                {
                    data.next = [fn, target, parameters];
                }

                return target;
            }

            return this;
        };


        //注册成功执行函数或成功执行通知
        prototype.done = function (fn) {

            return registry(this, fn, 1);
        };


        //注册执行失败函数或执行失败通知
        prototype.fail = function (fn) {

            return registry(this, fn, 2);
        };


        //注册异常处理函数
        prototype.exception = function (fn) {

            return registry(this, fn, 4);
        };


        //注册执行结束函数
        prototype.always = function (fn) {

            return registry(this, fn, 7);
        };


        //注册执行进度函数
        prototype.progress = function (fn) {

            return registry(this, fn, 8);
        };


        //注册回调函数
        function registry(target, fn, state) {

            if (typeof fn === "function")
            {
                var data = target[".data"];

                data.abort = false;
                data.push(state, fn);

                //如果已执行则立即调用函数
                if ((state & data.state) === data.state)
                {
                    fn.apply(target, data.parameters);
                }
            }

            return target;
        };


        //成功执行通知
        prototype.resolve = function (value) {

            return this[".stateTo"](1, arguments);
        };


        //失败执行通知
        prototype.reject = function (error) {

            return this[".stateTo"](2, arguments);
        };


        //抛出异常
        prototype.raise = function (exception) {

            return this[".stateTo"](4, arguments);
        };


        //执行进度通知
        prototype.notify = function (value) {

            return this[".stateTo"](8, arguments);
        };


        //切换状态
        //undefined: 初始状态
        //1: done
        //2: fail
        //4: exception
        //7: always
        //8: progress
        prototype[".stateTo"] = function (state, parameters) {

            var data = this[".data"];

            data.state = state;
            data.parameters = parameters;

            return this[".execute"](data);
        };


        //执行回调函数
        prototype[".execute"] = function (data) {

            var index = data.index || 0,
                length = data.length;

            while (index < length)
            {
                if ((data.state & data[index++]) === data.state)
                {
                    data[index++].apply(this, data.parameters);
                }
            }

            data.index = index;

            //异常或进度状态不执行后述动作
            if (data.state < 8 && !data.abort)
            {
                if (data.next)
                {
                    data.next[0].apply(data.next[1], data.next[2]);
                    data.next = null;
                }

                if (data.ajax)
                {
                    data.ajax[0].send.apply(data.ajax[0], data.ajax[1]);
                    data.ajax = null;
                }
            }

            return this;
        };


        //停止冒泡执行
        prototype.stopPropagation = function () {

            this[".data"].abort = true;
        };



        //deffered函数
        flyingon.deffered = function (fn, parameters, delay) {

            return new flyingon.Deffered(fn, parameters, delay);
        };


        //function async(callback) {

        //    var img = new Image();

        //    img.onerror = callback;
        //    img.src = "data:image/png,foo";
        //};


        //async(function () {

        //    console.log("async");
        //});

    });




    //ajax全局设置
    var ajax_options = {

        error: function (exception) {

            alert(exception);
        }
    };



    //自定义ajax开始提交方法
    flyingon.ajaxStart = function (fn) {

        ajax_options.start = fn;
    };


    //自定义ajax执行结束方法
    flyingon.ajaxEnd = function (fn) {

        ajax_options.end = fn;
    };


    //自定义ajax执行错误方法
    flyingon.ajax_error = function (fn) {

        ajax_options.error = fn;
    };


    //抛出异常
    function raise(exception) {

        this[".stateTo"](4, arguments);

        if (ajax_options.error)
        {
            ajax_options.error.call(this, exception);
        }

        return this;
    };


    //注册ajax或执行ajax
    function registry_ajax(data, target, parameters) {

        var data = this[".data"];

        if (data.state < 8 && !data.abort)
        {
            target.send.apply(target, parameters);
        }
        else
        {
            data.ajax = [target, arguments];
        }
    };



    //Ajax类
    //不兼容IE6及以下版本
    var ajax_type = $class(flyingon.Deffered, function (prototype, base) {



        //method
        prototype.method = "GET";

        //"text/plain" || "json" || "script" || "xml"
        prototype.dataType = "text/plain";

        //内容类型
        prototype.contentType = "application/x-www-form-urlencoded";

        //自定义http头
        prototype.header = null;

        //是否异步
        prototype.async = true;

        //请求用户名
        prototype.user = void 0;

        //请求密码
        prototype.password = void 0;

        //超时时间
        prototype.timeout = 0;



        //重载抛出异常方法
        prototype.raise = raise;


        //发送请求
        prototype.send = function (url, data, options) {

            var request = this.request = new XMLHttpRequest(), //取消兼容IE6
                target = this,
                post;

            if (options)
            {
                for (var name in options)
                {
                    this[name] = options;
                }
            }

            if (this.timeout > 0)
            {
                this.__timer = setTimeout(function () {

                    request.abort();
                    target.fail("timeout");

                }, this.timeout);
            }

            request.onreadystatechange = function () {

                response(target, this);
            };

            switch (this.method)
            {
                case "POST":
                case "post":
                case "PUT":
                case "put":
                    post = true;
                    break;

                default:
                    if (data)
                    {
                        url = flyingon.encodeURL(url, data);
                        data = null;
                    }
                    break;
            }

            request.open(this.method, url, this.async, this.user, this.password);

            if (this.header)
            {
                for (var name in this.header)
                {
                    request.setRequestHeader(name, this.header[name]);
                }
            }

            if (post)
            {
                request.setRequestHeader("Content-Type", this.contentType);

                if (data && typeof data === "object")
                {
                    data = flyingon.encode(data);
                    request.setRequestHeader("Content-Length", data.length);
                }
            }

            //执行发送前全局start事件
            if (ajax_options.start)
            {
                ajax_options.start.call(this, request);
            }

            request.send(data);

            return this;
        };


        //处理响应结果
        function response(target, request) {

            if (request.readyState === 4)
            {
                if (target.__timer)
                {
                    clearTimeout(target.__timer);
                    delete target.__timer;
                }

                if (request.status < 300)
                {
                    try
                    {
                        switch (target.dataType)
                        {
                            case "json":
                            case "text/json":
                                target.resolve(flyingon.parseJSON(request.responseText));
                                break;

                            case "script":
                            case "javascript":
                            case "text/script":
                            case "text/javascript":
                                target.resolve(eval(request.responseText));
                                break;

                            case "xml":
                            case "text/xml":
                                target.resolve(request.responseXML);
                                break;

                            default:
                                target.resolve(request.responseText);
                                break;
                        }
                    }
                    catch (error)
                    {
                        target.raise(error.message || error);
                    }
                }
                else
                {
                    target.raise(request.status);
                }

                //执行全局ajax执行结束事件
                if (ajax_options.end)
                {
                    ajax_options.end.call(target, request);
                }
            }
            else
            {
                target.progress(request.progress++ || (request.progress = 1));
            }
        };



        //ajax提交(默认为GET方式提交)
        flyingon.ajax = function (url, data, options) {

            return new ajax_type().send(url, data, options);
        };


        //POST提交
        //在IE6时会可能会出错, asp.net服务端可实现IHttpAsyncHandler接口解决些问题 
        flyingon.ajaxPost = function (url, data, options) {

            var target = new ajax_type();
            target.method = "POST";
            return target.send(url, data, options);
        };


        //给Deffered添加ajax方法
        base.ajax = function (url, data, options) {

            return registry_ajax.call(this, new ajax_type(), arguments);
        };


        //给Deffered添加ajax_post方法
        base.ajaxPost = function (url, data, options) {

            var target = new ajax_type();

            target.method = "POST";
            return registry_ajax.call(this, target, arguments);
        };



    });




    //按jsonp的方式获取json数据
    var jsonp_type = $class(flyingon.Deffered, function (prototype, base) {



        var head = document.head || document.getElementsByTagName("head")[0],
            items = [], //缓存池
            id = 0;


        prototype.send = function (url, data, callback_name) {

            var self = this,
                dom = items.pop(),
                name;

            if (dom)
            {
                name = dom.callback_name;
            }
            else
            {
                dom = document.createElement("script");
                dom.callback_name = "callback" + (++id);
            }

            (data || (data = {}))[callback_name || "jsonp"] = "flyingon.jsonp." + name;

            dom.type = "text/javascript";
            dom.src = flyingon.encodeURL(url, data);

            dom.onerror = function (error) {

                self.raise(error);
            };

            jsonp[name] = function (data) {

                self.resolve(data);
            };

            dom.onload = dom.onreadystatechange = function () {

                if (!state || state === "loaded" || state === "complete")
                {
                    dom.onload = dom.onreadystatechange = dom.onerror = null;

                    if (!self[".data"].state)
                    {
                        self.raise("error");
                    }

                    head.removeChild(dom);
                    items.push(dom);
                }
            };

            head.appendChild(dom);

            return this;
        };


        //jsonp
        var jsonp = flyingon.jsonp = function (url, data, callback_name) {

            return new jsonp_type().send(url, data, callback_name);
        };


        //给Deffered添加ajax_jsonp方法
        base.jsonp = function (url, data, callback_name) {

            return registry_ajax.call(this, new jsonp_type(), arguments);
        };


    });




});


