

//表格单元格基类
$class('GridCell', function () {
    
    
    this.className = '';
    
    
    this.cssText = '';
    
      

    //渲染
    this.render = function () {
        
    };
    
    
    
    //获取切换只读状态
    this.readonly = function (readonly) {
        
    };
    
    
    //获取或切换禁用状态
    this.disabled = function (disabled) {
        
    };
    
    
    //获取或设置字体颜色
    this.color = function () {
        
    };
    
    
    //获取或设置字体
    this.font = function () {
        
    };
    
    
    //获取或设置背景色
    this.backgroundColor = function (color) {
        
    };
    
    

    var cells;
    
    this.__class_init = function (Class) {

        if (cells)
        {
            if (this.type)
            {
                cells[this.type] = Class;
            }
            else
            {
                throw $translate('flyingon', 'GridCell_type_error');
            }
        }
        else
        {
            Class.all = cells = flyingon.create(null);
        }
    };

    
}, false);





$class(flyingon.GridCell, function (base) {
    
    
    this.type = 'link';
    

    
});



$class(flyingon.GridCell, function (base) {
    
    
    this.type = 'button';
    
    
    
});



$class(flyingon.GridCell, function (base) {
    
    
    this.type = 'text';
    
    
    
});



$class(flyingon.GridCell, function (base) {
    
    
    this.type = 'check';
    
    
    
});



$class(flyingon.GridCell, function (base) {
    
    
    this.type = 'number';
    
    
    
});




$class(flyingon.GridCell, function (base) {
    
    
    this.type = 'date';
    
    
    
});



$class(flyingon.GridCell, function (base) {
    
    
    this.type = 'time';
    
    
    
});



$class(flyingon.GridCell, function (base) {
    
    
    this.type = 'combobox';
    
    
    
});




$class(flyingon.GridCell, function (base) {
    
    
    this.type = 'textbutton';
    
    
    
});

