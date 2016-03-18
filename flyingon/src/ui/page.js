
$class('Page', flyingon.Panel, function (self, base) {
    
  
    //扩展顶级控件接口
    flyingon.ITopControl(self);
    
    
    self.show = function (dom) {
        
        (dom || document.body).appendChild(this.dom);
        this.refresh(2);
    };
    
    
});