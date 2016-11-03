

$interface('IEditor', function () {
   
    
    
    this.defineProperty('name', '');
    
    
    this.defineProperty('value', '');
    
    
    this.defineProperty('maxlength', 0);
    
    
    this.defineProperty('mask', '');
    
    
    this.defineProperty('placeholder', '');
    
    
    this.defineProperty('readonly', false);
    
    
    this.defineProperty('required', false);
    
    
    this.defineProperty('autocomplete', false);
    
    
    this.focus = function () {
      
        this.dom.focus();
    };
    
    
    this.blur = function () {
    
        this.dom.blur();
    };
    
    
    this.select = function () {
      
        this.dom.select();
    };
    
    
    
});