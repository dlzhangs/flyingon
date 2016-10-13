

//扩展ES6 Set类
window.Set || (window.Set = $class(function () {
    
    
    $constructor(function () {
    
        this.__items = [];
    });
    
    
    function indexOf(items, item) {
    
        var index = 0,
            length = items.length;
        
        if (item === item) //非NaN
        {
            while (index < length)
            {
                if (items[index++] === item)
                {
                    return --index;
                }
            }
        }
        else //NaN
        {
            while (index < length)
            {
                if ((item = items[index++]) === item)
                {
                    return --index;
                }
            }
        }
        
        return -1;
    };
    
    
    this.size = 0;
    
    
    this.has = function (item) {
        
        return indexOf(this.__items, item) >= 0;
    };
    
    
    this.add = function (item) {
        
        var items = this.__items;
        
        if (indexOf(items, item) < 0)
        {
            items.push(item);
            this.size++;
        }
        
        return this;
    };
    
    
    this['delete'] = function (item) {
        
        var items = this.__items,
            index = indexOf(items, item);
        
        if (index >= 0)
        {
            items.splice(index, 1);
            this.size--;
            
            return true;
        }
        
        return false;
    };
    
    
    this.clear = function () {
        
        this.size = this.__items.length = 0;
    };
    
    
    this.keys = this.values = function () {
      
        return this.__items;
    };
    
    
}));


