

$class('GridRow', function () {

    
    $constructor(function (view, uniqueId) {
      
        this.view = view;
        this.uniqueId = uniqueId;
    });
    
    
    //所属视图
    this.view = null;
    
    //数据行唯一id
    this.uniqueId = null;
                 
    //父表格行
    this.parent = null;


    //子表格行数量
    this.length = 0;
    
    
    //是否选择
    this.selected = false;
    
    //是否勾选
    this.checked = false;
    
    
    //是否展开
    this.expanded = false;
    
    
    
    //获取指定索引的单元格
    this.at = function (index) {
        
    };
    
    
    //获取指定列名的值
    this.get = function (name) {
        
    };
    
    
    //设置指定列名的值
    this.set = function (name, value) {
        
    };
        
    
    
}, false);

