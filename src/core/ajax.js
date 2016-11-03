//Ajax类
$class('Ajax', flyingon.Async, function () {

    
    
    //请求的url
    this.url = '';
    
    //指定版本号
    this.version = '';

    //method
    this.method = 'GET';

    //text || json || script || xml
    this.dataType = 'text';

    //内容类型
    this.contentType = 'application/x-www-form-urlencoded';

    //自定义http头
    this.header = null;
    
    //是否异步
    this.async = true;
        
    //是否支持跨域资源共享(CORS)
    this.CORS = false;
    
    //超时时间
    this.timeout = 0;
    

    
    this.send = function (url, options) {

        var list = [], //自定义参数列表
            data, 
            cache;
        
        if (options)
        {
            for (var name in options)
            {
                if (name !== 'data')
                {
                    this[name] = options[name];
                }
                else
                {
                    data = options[name];
                }
            }
        }
        
        //执行发送前全局start事件
        if (cache = flyingon.Ajax.start)
        {
            for (var i = 0, l = cache.length; i < l; i++)
            {
                if (cache[i].call(this, url) === false)
                {
                    return false;
                }
            }
            
            url =  this.url;
        }
        
        if (!(this.url = url))
        {
            return false;
        }
              
        if (data && /get|head|options/i.test(this.method))
        {
            list.push(flyingon.encode(data));
            data = null;
        }
        
        cache = this.dataType === 'jsonp';
        
        if (this.version)
        {
            list.push('ajax-version=', this.version);
        }
                
        if (cache || list.length > 0)
        {
            list.start = url.indexOf('?') >= 0 ? '&' : '?';
        }

        //jsonp
        if (cache)
        {
            cache = data ? jsonp_post : jsonp_get;
        }
        else
        {
            cache = ajax_send;
        }
        
        cache(this, url, list, data);

        return this;
    };

    
    
    //发送ajax请求
    function ajax_send(self, url, list, data) {
    
        var xhr = self.xhr = new XMLHttpRequest(),
            cache;
        
        if (list.start)
        {
            url = url + list.start + list.join('&');
        }
              
        //CORS
        if (self.CORS)
        {
            //withCredentials是XMLHTTPRequest2中独有的
            if ('withCredentials' in xhr)
            {
                xhr.withCredentials = true;
            }
            else if (cache = window.XDomainRequest)
            {
                xhr = new cache();
            }
        }
        
        if ((cache = self.timeout) > 0)
        {
            self.__timer = setTimeout(function () {

                xhr.abort();
                self.fail('timeout');

            }, cache);
        }

        xhr.onreadystatechange = function () {

            ajax_done(self, xhr, url);
        };
        
        xhr.open(self.method, url, self.async);
          
        if (cache = self.header)
        {
            for (var name in cache)
            {
                xhr.setRequestHeader(name, cache[name]);
            }
        }

        xhr.setRequestHeader('Content-Type', self.contentType);

        if (data)
        {
            data = flyingon.encode(data);
            xhr.setRequestHeader('Content-Length', data.length);
        }

        xhr.send(data);
    };
    

    //处理响应结果
    function ajax_done(self, xhr, url) {

        var cache = xhr.readyState;

        if (cache === 4)
        {
            if (cache = self.__timer)
            {
                clearTimeout(cache);
                self.__timer = 0;
                cache = void 0;
            }

            if (xhr.status < 300)
            {
                switch (self.dataType)
                {
                    case 'json':
                        self.resolve(flyingon.parseJSON(xhr.responseText));
                        break;
                        
                    case 'script':
                        flyingon.globalEval(xhr.responseText); //全局执行js避免变量冲突
                        self.resolve(self.url);
                        break;
                        
                    case 'xml':
                        self.resolve(xhr.responseXML);
                        break;
                        
                    default:
                        self.resolve(xhr.responseText);
                        break;
                }
            }
            else
            {
                self.reject(cache = xhr.statusText);
            }
            
            //结束处理
            ajax_end(self, url, cache);
            
            //清除引用
            self.xhr = self.onreadystatechange = null;
        }
        else
        {
            self.notify(cache);
        }
    };
    
    
    //ajax执行完毕
    function ajax_end(self, url, error) {
        
        var end = flyingon.Ajax.end;
        
        //执行全局ajax执行结束事件
        if (end)
        {
            for (var i = 0, l = end.length; i < l; i++)
            {
                end[i].call(self, url, error);
            }
        }
    };
        
    
    //jsonp_get
    function jsonp_get(self, url, list) {
        
        var target = jsonp_get,
            items = target.items || (target.items = []),
            name = items.pop() || 'flyingon_jsonp_get' + (++target.id || (target.id = 1));
        
        window[name] = function (data) {
        
            self.resolve(data);
            ajax_end(self, url);
            
            self = null;
        };
        
        list.push('jsonp=' + name);
        
        if (!self.version)
        {
            list.push('jsonp-version=' + (++target.version || (target.version = 1)));
        }
        
        url = url + list.start + list.join('&');
          
        flyingon.script(url, function (src, error) {
            
            items.push(name);

            if (error)
            {
                self.reject(error);
                ajax_end(self, url, error);

                self = null;
            }

            window[name] = void 0;
            this.parentNode.removeChild(this);
        });
    };
    
    
    //jsonp_post
    function jsonp_post(self, url, list, data) {
                
        var head = document.head,
            target = jsonp_post,
            items = target.items || (target.items = []),
            iframe = items.pop(),
            form = items.pop(),
            window;
        
        if (!iframe)
        {
            iframe = document.createElement('iframe'),
            form = document.createElement('form');

            iframe.id = ++target.id || (target.id = 1);
            iframe.name = 'jsonp_iframe_' + target.id;
            iframe.src = 'about:blank';

            form.name = 'jsonp_form_' + target.id;
            form.target = iframe.name;
        }
        
        head.appendChild(iframe);
        head.appendChild(form);

        //解决IE6在新窗口打开的BUG
        window = iframe.contentWindow;
        window.name = iframe.name; 

        list.push('jsonp=flyingon_jsonp_post' + 1);
        url = url + list.start + list.join('&');
                  
        form.action = url;
        form.method = self.method || 'POST';
        form.enctype = self.enctype || 'application/x-www-form-urlencoded';
        
        for (var name in data)
        {
            var dom = document.createElement('input');

            dom.name = name;
            dom.type = 'hidden';
            dom.value = data[name];

            form.appendChild(dom);
        }
        
        iframe.onload = function (event) {

            var body = window.document.body,
                text = body.textContent || body.innerText || '';
            
            head.removeChild(iframe);
            head.removeChild(form);
            
            items.push(form, iframe);
            
            if (text = text.match(/flyingon_jsonp_post(\([\s\S]+\))/))
            {
                self.resolve(eval(text = text[1]));
            }
            else
            {
                self.fail(text = body.innerHTML);
            }
            
            ajax_end(self, url, text);
            
            body.innerHTML = form.innerHTML = '';
            self = head = iframe = form = window = iframe.onload = null;
        };

        /*
        function fn(event) {

            var body = window.document.body,
                text = body.textContent || body.innerText || '';
            
            if (iframe.attachEvent) //注销事件
            {
                iframe.detachEvent('onload', fn);
            }
            else
            {
                iframe.onload = null;
            }

            head.removeChild(iframe);
            head.removeChild(form);
            
            items.push(form, iframe);
            
            if (text = text.match(/jsonpCallback1(\([\s\S]+\))/))
            {
                self.resolve(eval(text = text[1]));
            }
            else
            {
                self.fail(text = body.innerHTML);
            }
            
            ajax_end(self, url, text);
            
            body.innerHTML = form.innerHTML = '';
            self = head = iframe = form = window = iframe.onload = null;
        };

        //解决IE6不能触发onload事件的bug
        if (iframe.attachEvent) 
        {
            iframe.attachEvent('onload', fn);
        }
        else
        {
            iframe.onload = fn;
        }
        */
        
        form.submit();
    };
        
    

}, false);



//自定义ajax开始提交方法
flyingon.ajaxStart = function (fn) {

    (flyingon.Ajax.start || (flyingon.Ajax.start = [])).push(fn);
};


//自定义ajax执行结束方法
flyingon.ajaxEnd = function (fn) {

    (flyingon.Ajax.end || (flyingon.Ajax.end = [])).push(fn);
};


//ajax提交(默认为GET方式提交)
flyingon.ajax = function (url, options) {

    return new flyingon.Ajax().send(url, options);
};


//POST提交
//在IE6时会可能会出错, asp.net服务端可实现IHttpAsyncHandler接口解决些问题 
flyingon.ajaxPost = function (url, options) {

    options = options || {};
    options.method = 'POST';

    return new flyingon.Ajax().send(url, options);
};


//jsonp get提交
flyingon.jsonp = function (url, options) {

    options = options || {};
    options.dataType = 'jsonp';

    return new flyingon.Ajax().send(url, options);
};


//jsonp get提交
flyingon.jsonpPost = function (url, options) {

    options = options || {};
    options.dataType = 'jsonp';
    options.method = 'POST';
    options.data = { a: 1, b: 2, c: 3 };

    return new flyingon.Ajax().send(url, options);
};
    


