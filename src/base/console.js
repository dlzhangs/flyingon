
//console兼容扩展
window.console || (window.console = function () {
    
    
    this.log = function (text) {
        
    };
    
    
    this.warn = function (text) {
        
    };
    
    
    this.error = function (text) {
        
    };
    
    return this;
    
    
}.call({}));

