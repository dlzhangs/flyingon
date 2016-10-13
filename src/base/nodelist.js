

//dom节点集合
$class('NodeList', Array, function () {
    
        
    this.addClass = function (name) {
      
        name = ' ' + name;
        
        for (var i = 0, _ = this.length; i < _; i++)
        {
            this[i].className += name;
        }
    };
    
    
    this.removeClass = function (name) {
        
        name = ' ' + name;
        
        for (var i = 0, _ = this.length; i < _; i++)
        {
            var dom = this[i];
            dom.className = dom.className.replace(name, '');
        }
    };
    
    
});