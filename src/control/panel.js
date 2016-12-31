
$class('Panel', flyingon.Control, function () {


        
    this.defaultWidth = this.defaultHeight = 400;
        
    
    
    //引入容器组件片段
    flyingon.ContainerFragment(this);
    
    
    
    //当前布局
    this.defineProperty('layout', null, {
     
        group: 'locate',
        query: true,
        set: 'this.__layout = value && typeof value === "object";this.invalidate();'
    });
    
    
    //子控件集合
    this.defineProperty('children', function (index) {

        var children = this.__children;
        
        if (index === void 0)
        {
            return children || (this.__children = []);
        }

        return children && children[index];
    });
        
    

});
    