
//class相关操作功能片段
$fragment('ClassFragment', function () {
   
    
    
    //缓存的名称正则表达式集合
    var names = flyingon.create(null);
    
    
        
    //获取对应正则表达式
    function parse(name) {
        
        return names[name] = new RegExp('(\\s+|^)' + name + '(\\s+|$)', 'gi');
    };
    
    
    function replace(_, x, y) {

        return x && y ? ' ' : '';  
    };
    

    //是否包含指定class
    this.hasClass = function (name) {

        var storage;
        
        if (name && (storage = this.__storage))
        {
            return (names[name] || parse(name)).test(storage.className);
        }
        
        return false;
    };


    //添加class
    this.addClass = function (name) {

        if (name)
        {
            var value = this.__storage;
            
            if (value && (value = value.className))
            {
                name = value + ' ' + name;
            }
            
            this.className(name);
        }

        return this;
    };


    //移除class
    this.removeClass = function (name) {

        var value;
        
        if (name && (value = this.__storage) && (value = value.className))
        {
            this.className(value.replace(names[name] || parse(name), replace));
        }

        return this;
    };


    //切换class 有则移除无则添加
    this.toggleClass = function (name) {

        if (name)
        {
            var value = this.__storage,
                regex;
            
            if (value && 
                (value = value.className) &&
                (regex = names[name] || parse(name)).test(value))
            {
                name = value.replace(regex, replace);
            }
            else if (value)
            {
                name = value + ' ' + name;
            }
            
            this.className(name);
        }

        return this;
    };

    
});

