$class('HtmlControl', flyingon.Control, function (self, base) {
   
        
    self.defineProperty('text', '', {
        
        set: 'this.dom.innerHTML = value;'
    });
    
});