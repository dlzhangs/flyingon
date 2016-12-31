
//表格布局类
$class(flyingon.Layout, function (base) {

        
    //行列格式: row[column ...] ... row,column可选值: 
    //整数            固定行高或列宽 
    //数字+%          总宽度或高度的百分比 
    //数字+*          剩余空间的百分比, 数字表示权重, 省略时权重默认为100
    //数字+css单位    指定单位的行高或列宽
    //列可嵌套表或表组 表或表组可指定参数
    //参数集: <name1=value1 ...>   多个参数之间用逗号分隔
    //嵌套表: {<参数集> row[column ...] ...} 参数集可省略
    //示例(九宫格正中内嵌九宫格,留空为父表的一半): '*[* * *] *[* *{(50% 50%) L*[* * *]^3} *] *[* * *]'
    
    
    var parse_cache = flyingon.create(null),
        
        regex_loop = /L([^L\^]+)\^(\d+)/g,
                
        regex_parse = /[*%.!\w]+|[\[\]{}()]/g,
        
        pixel = flyingon.pixel,
        
        parse = parseFloat;
    
    
    
    this.type = 'table';

    
    //是否按纵向开始拆分
    this.defineProperty('vertical', false);

    
    //头部区域
    this.defineProperty('header', '', {
    
        set: 'this.__header = null;'
    });
    
    
    //内容区域
    this.defineProperty('body', '*[* * *]', {
     
        set: 'this.__body = null;'
    });

    
    //循环内容区域
    this.defineProperty('loop', 3, {
       
        dataType: 'object'
    });
    
    
    //尾部区域
    this.defineProperty('footer', '', {
       
        set: 'this.__footer = null;'
    });


    
    //排列布局
    this.arrange = function (arrange, hscroll, vscroll, items, start, end) {

        var header = this.header(),
            body = this.__body || (this.__body = parse(this.body())),
            loop = this.loop(),
            footer = this.footer(),
            total;
        
        header && (header = this.__header || (this.__header = parse(header)));
        footer && (footer = this.__footer || (this.__footer = parse(footer)));
        
        
    };

        
            
    //单元格类
    var item_type = $class(function () {

        //比例
        this.scale = 0;
        
        //单位
        this.unit = '';
        
        //是否可用
        this.enabled = true;
        
        //子项
        this.items = null;
        
        
        //开始位置
        this.start = 0;
        
        //大小
        this.size = 0;
        
        
        this.clone = function () {
            
            var target = new this.Class();
            
            target.scale = this.scale;
            target.unit = this.unit;
            target.enabled = this.enabled;
            
            if (this.items)
            {
                target.items = this.items.clone();
            }
            
            return target;
        };

    });


    //单元格集合类
    var items_type = $class(Array, function () {

        
        //是否竖直切分
        this.vertical = false;
        
        //水平间距
        this.spacingX = '100%';
        
        //竖直间距
        this.spacingY = '100%';
        
        
        //固定子项大小合计
        this.values = 0;
        
        //余量权重合计
        this.weight = 0;
        
        //百分比合计
        this.percent = 0;
        
        
        //开始位置
        this.start = 0;
        
        //大小
        this.size = 0;
        
        
        this.compute = function (width, height, spacingX, spacingY) {
          
            
        };
        
                
        this.clone = function () {
          
            var target = new this.Class();
            
            target.vertical = this.vertical;
            target.spacingX = this.spacingX;
            target.spacingY = this.spacingY;
            target.values = this.values;
            target.weight = this.weight;
            target.percent = this.percent;
            
            for (var i = 0, l = this.length; i < l; i++)
            {
                target.push(this[i].clone());
            }
            
            return target;
        };

    });
    
    
    function parse(layout, text) {
        
        var items = parse_cache[text],
            tokens;
        
        if (items)
        {
            return items.clone();
        }
        
        items = new items_type();
        tokens = parse_loop(text).match(regex_parse);
        
        if (tokens)
        {
            items.vertical = tokens[0] === '{';
            parse_items(items, tokens, 0, items.vertical ? '}' : ']');
        }

        return parse_cache[text] = items;
    };
    
    
    function parse_loop(text) {
    
        var regex = regex_loop,
            loop;
        
        function fn(_, text, length) {
            
            var items = [];
            
            do
            {
                items.push(text);
            }
            while (--length > 0);
            
            loop = true;
            
            return items.join(' ');
        };
        
        do
        {
            loop = false;
            text = text.replace(regex, fn);
        }
        while (loop);
        
        return text;
    };
    
    
    function parse_items(items, tokens, index, end) {
      
        var item, token;
        
        while (token = tokens[index++])
        {
            switch (token)
            {
                case '[':
                    token = new items_type();
                    token.vertical = true;
                    index = parse_items(item ? (item.items = token) : token, tokens, index, ']');
                    break;

                case '{':
                    token = new items_type();
                    index = parse_items(item ? (item.items = token) : token, tokens, index, '}');
                    break;
                    
                case '(':
                    index = parse_parameters(items, tokens, index);
                    break;

                case end:
                    return index;

                default:
                    item = parse_item(items, token) || item;
                    break;
            }
        }
        
        return index;
    };
    
    
    function parse_item(items, token) {
      
        var item = new item_type(), 
            value;
        
        if (token.indexOf('!') >= 0)
        {
            item.enabled = false;
            token = token.replace('!', '');   
        }
        
        if (token === '*')
        {
            item.scale = 100;
            item.unit = '*';
            items.weight += 100;
        }
        else if ((value = parse(token)) === value) //可转为有效数字
        {
            switch (item.unit = token.replace(value, ''))
            {
                case '*':
                    items.weight += value;
                    break;
                    
                case '%':
                    items.percent += value;
                    break;
                    
                default:
                    value = pixel(token);
                    items.values += value;
                    break;
            }
            
            item.scale = value;
        }
        else
        {
            return;
        }
        
        items.push(item);
        return item;
    };
    
    
    function parse_parameters(items, tokens, index) {
        
        var token, x;
        
        while (token = tokens[index++])
        {
            if (token === ')')
            {
                return index;
            }
            
            if (x !== 0)
            {
                if (token.indexOf('%') < 0)
                {
                    token = pixel(token) | 0;
                }
                
                items.spacingY = token;
                
                if (x)
                {
                    x = 0;
                }
                else
                {
                    items.spacingX = token;
                    x = 1;
                }
            }
        }
    };
    

});



