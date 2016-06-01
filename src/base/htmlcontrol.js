$class('HtmlControl', flyingon.Control, function (base) {
   
        
    this.defineProperty('text', '', {
        
        set: 'this.dom.innerHTML = value;'
    });
    
});