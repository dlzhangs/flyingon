
//可绑定对象片段
$fragment('BindableFragment', function () {
    
    

    //数据集
    this.defineProperty('dataset', null, {
        
        storage: 'this.__dataset',
        bind: false,
        set: 'if (oldValue) oldValue.subscribe(this, true);\n\t' 
            + 'if (value) value.subscribe(this);'
    });
    
    
    //设置属性绑定
    this.__set_bind = function (name, value) {
        
        if (name && value && (value = value.match(/^\{\{\s*([^{}]+)\s*\}\}$/)))
        {
            if (/[\W\s]/.test(value = value[1]))
            {
                var fn = new Function('row', 'with (row.data) { return ' + value + '; }');
                
                fn.text = value;
                value = fn;
            }
            
            (this.__bind_names || (this.__bind_names = {}))[name] = value;
            return true;
        }
        
        return false;
    };

    
    //仅订阅数据集当前行变更动作
    this.subscribeCurrent = true;
    
    
    //接收数据集变更动作处理
    this.receive = function (dataset, action) {
        
        var list;
        
        if (action && action.source !== this && (list = this.__bind_names))
        {
            var row = action.row,
                name = action.name,
                value;
            
            for (var key in list)
            {
                if (typeof (value = list[key]) !== 'function')
                {
                    if (!name || (value === name))
                    {
                        this[key](row && row.get(value), true);
                    }
                }
                else if (!name || value.text.indexOf(name) >= 0)
                {
                    this[key](value(row), true);
                }
            }
        }
    };
    
    
    //回推数据至数据集
    this.pushBack = function (name, value) {
        
        var target, dataset, cache;
        
        if ((target = this.__bind_names) && (name = target[name]) && typeof name === 'string')
        {
            target = this;
            
            while (target)
            {
                if (dataset = target.__dataset)
                {
                    if (cache = dataset.currentRow())
                    {
                        cache.set(name, value, true, this);
                    }

                    return;
                }

                target = target.__parent;
            }
        }
    };

    
    
}, true);