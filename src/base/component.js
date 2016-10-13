

//命名的组件集合
flyingon.components = flyingon.create(null);



//组件接口
$interface('IComponent', function () {
  
    
    
    //定义id属性
    this.defineProperty('id', '', {
        
        set: 'if (oldValue) flyingon.components[oldValue] = null;\n'
            + 'if (value) flyingon.components[value] = this;'
    });
    
    
    //扩展序列化接口
    flyingon.ISerialize(this);
    

    //序列化方法
    this.serialize = function (writer) {

        var cache;
        
        if (cache = this.xtype)
        {
            writer.write_property('xtype', cache);
        }
        
        if (cache = this.__storage)
        {
            writer.write_properties(cache);
        }
    };
    
    
    this.dispose = function () {
      
        var cache = this.__storage;
        
        if (cache && cache.id)
        {
            flyingon.components[cache.id] = null;
        }
        
        if (this.__events)
        {
            this.off();
        }
    };
    

         
}, true);


