//flyingon样式相关
namespace(function (flyingon) {


    var variables = Object.create(null),
        css = [],
        regex_check = /function\s*\(/,
        regex_replace = /\/\*.*?\*\/|\/\/\.*?\n/g,
        regex_parse = /([\w-$]+\s*:\s*(^\;\n)+?)\s*[\;\n]|\}|(\S[^\{]*?)\s*\{/g;


    function parse(tokens) {

        var keys = variables,
            selector_list = [],
            selector,
            name,
            value,
            i = 0,
            length = tokens.length;

        while (i < length)
        {
            switch (tokens[i++])
            {
                case ":":
                    name = tokens[i++];
                    value = tokens[i++];

                    if (selector)
                    {
                        value = keys[value] || value;
                    }
                    else
                    {
                        keys[value] = value;
                    }
                    break;

                case "{":
                    if (selector)
                    {
                        selector_list.push(selector);
                    }

                    selector = tokens[i++];
                    break;

                default:
                    selector = selector_list.pop();
                    break;
            }
        }
    };


    //加载fss样式
    this.load = function (text) {

        var tokens = [];

        if (regex_check.test(text)) //压缩后的fss格式
        {
            tokens = new Function(text)();
        }
        else
        {
            text.replace(regex_replace, "").replace(regex_parse, function (_, key, value, selector) {

                if (key)
                {
                    tokens.push(":", key, value);
                }
                else if (selector)
                {
                    tokens.push("{", selector);
                }
                else
                {
                    tokens.push("}")
                }
            });
        }

        parse(tokens);
    };


    //清除样式
    this.clear = function () {

        variables = Object.create(null);
        css = [];
    };





    //定义扩展控件样式
    function defineStyle(styles) {

        //预处理样式集
        if (styles)
        {
            var css_list = {};

            //预处理样式
            for (var selector in styles)
            {
                parse_selector(styles, selector, css_list);
            }

            styles = css_list;
            css_list = [];

            //解析样式(处理引入及合并)
            for (var selector in styles)
            {
                var css_style = selector.indexOf("css:") === 0,
                    cssText = [],
                    style = styles[selector];

                parse_style(style, cssText, css_style);
                cssText = cssText.join("\n");

                if (css_style) //css:开头表示定义标准css样式
                {
                    //解析选择器
                    selector = flyingon.parse_selector(selector.substring(4));

                    if (selector.split_selector) //如果是组合选择器则拆分处理
                    {
                        for (var i = 0, _ = selector.length ; i < _; i++)
                        {
                            css_list.push({

                                css_style: true,
                                cssText: selector[i].toString(true) + "{" + cssText + "}"
                            });
                        }
                    }
                    else
                    {
                        css_list.push({

                            css_style: true,
                            cssText: selector.toString(true) + "{" + cssText + "}"
                        });
                    }
                }
                else
                {
                    //解析选择器
                    selector = flyingon.parse_selector(selector);

                    if (selector.split_selector) //如果是组合选择器则拆分处理
                    {
                        for (var i = 0, _ = selector.length ; i < _; i++)
                        {
                            css_list.push(handle_selector(selector[i], style, cssText));
                        }
                    }
                    else
                    {
                        css_list.push(handle_selector(selector, style, cssText));
                    }
                }
            }

            //存储样式表
            flyingon.styleSheets.push(css_list);

            //处理样式
            cssText = [];

            for (var i = 0, _ = css_list.length; i < _; i++)
            {
                handle_style(css_list[i], cssText);
            }

            //写入样式表
            flyingon.style(cssText.join(""), style_object);
        }
    };


    //预处理样式
    function parse_selector(styles, selector, exports) {

        var style = styles[selector],
            result = {},
            value;

        for (var name in style)
        {
            if ((value = style[name]) || value === 0 || value === false)
            {
                if (typeof value === "object") //嵌套子样式
                {
                    if (name.indexOf("css:") === 0)
                    {
                        name = name.substring(4);

                        if (selector.indexOf("css:") === 0)
                        {
                            selector = "css:" + selector;
                        }
                    }

                    name = selector.replace(/\,/g, " " + name + ",") + name;

                    styles[name] = value;
                    parse_selector(styles, name, exports);
                }
                else if (name in style_split)
                {
                    value = style_split[name](value);

                    for (var key in value)
                    {
                        result[key] = value[key];
                    }
                }
                else
                {
                    result[name] = value;
                }
            }
        }

        for (var name in result)
        {
            exports[selector] = result;
            return;
        }
    };


    //解析样式(处理引入及合并)
    function parse_style(style, cssText, css_style) {

        for (var name in style)
        {
            var value = style[name];

            //类型转换
            switch (style_data_types[name])
            {
                case "boolean": //布尔型
                    value = value && value !== "false" && value !== "0";
                    break;

                case "int":
                    value = +value | 0;
                    break;

                case "number": //小数
                    value = +value || 0;
                    break;
            }

            style[name] = value;

            if (css_style || !(name in style_no_names))
            {
                switch (name) //修改css值
                {
                    case "opacity":
                        if (!(name in style_test))
                        {
                            if (flyingon.browser.MSIE)
                            {
                                cssText.push("filter:alpha(opacity=" + (value * 100) + ");");
                            }
                            else
                            {
                                cssText.push(style_prefix2 + "opacity:" + value + ";");
                            }

                            return;
                        }
                        break;
                }

                cssText.push((original_names[name] || name) + ":" + value + ";");
            }
        }

    };


    //处理选择器
    function handle_selector(selector, style, cssText) {

        var length = selector.length,
            value = selector[length - 1];

        selector.style = style;
        selector.key = selector.join("");
        selector.type = value.token + value.name; //以最后一个节点的 token + name 作为样式类别并缓存样式类别名
        selector.weight = selector_weight(selector);

        //如果控件dom使用css方式关联样式
        if (cssText)
        {
            var values = [];

            for (var i = 0; i < length; i++)
            {
                if (value = selector[i].toString(false))
                {
                    values.push(value);
                }
                else
                {
                    return selector;
                }
            }

            selector.cssText = values.join("") + "{" + cssText + "}"; //复用且保存css
        }
        else
        {
            selector.cssText = ""; //复用但不保存css
        }

        return selector;
    };


    //获取选择器的权重
    /*
    css选择器权重参考
    
    类型选择符的权重为：0001
    类选择符的权重为：0010
    通用选择符的权重为：0000
    子选择符的权重为：0000
    属性选择符的权重为：0010
    伪类选择符的权重为：0010
    伪元素选择符的权重为：0010 (注：本系统不支持伪元素)
    包含选择符的权重为：包含的选择符权重值之和
    内联样式的权重为：1000
    继承的样式的权重为：0000
    */
    function selector_weight(selector) {

        var result = 0;

        for (var i = selector.length - 1; i >= 0; i--)
        {
            var node = selector[i];

            switch (node.token)
            {
                case "": //dom标签
                    result += 1;
                    break;

                case "@": //自定义控件按10权重计, 等同于class
                case ".": //class
                    result += 10;
                    break;

                case "#": //id
                    result += 100;
                    break;
            }

            result += node.length * 10; //伪类或属性
        }

        return selector.weight = result << 16; //左移16个字节以留足中间插入的空间
    };


    //保存样式
    function handle_style(selector, cssText) {

        if (selector.css_style) //如果是css样式直接生成css规则
        {
            if (selector.cssText) //复用且保存css
            {
                cssText.push(selector.cssText);
            }
        }
        else //否则按扩展控件样式处理
        {
            var style = selector.style,
                type = selector.type,
                cache_name,
                cache_type,
                weight;

            registry_types[type] = true; //注册类型

            if (selector.cssText !== void 0)
            {
                if (selector.cssText) //复用且保存css
                {
                    cssText.push(selector.cssText);
                }
            }
            else
            {
                types[0] = false; //不可复用样式
            }

            for (var name in style)
            {
                //当前权重
                weight = selector.weight;

                //需要特殊处理的样式
                if (!(name in style_no_names))
                {
                    style_yes_names[name] = true;
                }

                //注册属性
                if (cache_name = registry_names[name]) //已有属性
                {
                    if (weight in cache_name) //如果已存在权重值则往后叠加
                    {
                        weight = ++cache_name[weight];
                    }
                    else
                    {
                        cache_name[weight] = weight;
                    }

                    cache_type = cache_name[type] || (cache_name[type] = {});
                }
                else
                {
                    cache_name = registry_names[name] = {};
                    cache_name[weight] = weight;

                    cache_type = cache_name[type] = {};
                }

                cache_type[weight] = [selector, style[name], weight];
            }
        }
    };




});