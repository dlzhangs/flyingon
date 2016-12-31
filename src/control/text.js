$class('Text', flyingon.Control, function (base) {
   
        
    this.defineProperty('text', '', {
        
        set: 'this.dom && (this.dom.innerHTML = value);'
    });
    
    
    this.defineProperty('isHtml', false);
    
});