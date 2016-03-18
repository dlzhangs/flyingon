
$include('flyingon/layout/{layout}.js');

$namespace(function (flyingon) {
   
    
    
    $class('Dialog', flyingon.Panel, function (self, base) {
    
        
        //已打开的窗口集合
        var dialog_list = [];
        
                    
        $constructor(function () {
           
            var Control = flyingon.Control,
                self = this,
                head = this.head = new flyingon.Panel(),
                icon = head.icon = new Control(),
                title = head.title = new Control(),
                close = head.close = new Control();
                  
            icon.addClass('flyingon-Dialog-icon').id('icon');
            title.addClass('flyingon-Dialog-title').id('title');
            close.addClass('flyingon-Dialog-close').id('close');
            
            close.on('click', function (e) {
               
                self.close();
            });
            
            head.addClass('flyingon-Dialog-head')
                .zIndex(100)
                .layout('flyingon-Dialog-head')
                .children().push(icon, title, close);
            
            head.__parent = this;
            head.__dom_dirty = true;
        });
        
        
        self.defaultWidth = 400;
        
        self.defaultHeight = 300;
        
        self.defaultValue('border', 1);
        
        
        //窗口图标        
        self.defineProperty('icon', '', {
           
            set: 'this.__set_icon(value);'
        });
        
        
        //窗口标题
        self.defineProperty('title', '', {
           
            set: 'this.head.title.dom.innerHTML = value;'
        });
        
        
        self.defineProperty('html', '', {
           
            set: 'this.clear();\n\t' + 'this.dom.children[1].innerHTML = value;'
        });
        
        
        //是否可拖动窗口
        self.defineProperty('draggable', true);
        
        
        //是否可调整大小
        self.defineProperty('resizable', true);
        
        
        //是否显示关闭按钮
        self.defineProperty('closable', true, {
           
            set: 'this.head.close.visible(value);'
        });
        
        
        //是否居中显示
        self.defineProperty('center', true);
        
        
        self.__set_icon = function (value) {
                      
            var icon = this.head.icon;
            
            icon.visible(value);
            icon.className = 'flyingon-Control flyingon-Dialog-icon ' + (value || '');
        };
        
        
        
        //扩展顶级控件接口
        flyingon.ITopControl(self);
        
        
        self.show = function () {
          
            if (dialog_list.indexOf(this) < 0)
            {
                open(this);
            }
            else
            {
                
            }
        };
        
        
        self.showDialog = function () {
          
            if (dialog_list.indexOf(this) < 0)
            {
                open(this, true);
            }
        };
        
        
        function open(self, overlay) {
            
            var body = document.body,
                dom = self.dom;
            
            self.draggable() && self.head.on('mousedown', self.__draggable = function (e) {
                
                //指定被拖动的对象
                e.dom = self.dom;
                flyingon.dragmove(self, e);
            });
            
            if (overlay)
            {
                overlay = self.overlay = document.createElement('div');
                overlay.className = 'flyingon-Dialog-overlay';
                overlay.style.zIndex = 100;
                
                body.appendChild(overlay);
            }
                        
            body.appendChild(dom);
            
            self.refresh(2);
            
            if (self.center())
            {
                dom.style.left = ((body.clientWidth - dom.offsetWidth) >> 1) + 'px';
                dom.style.top = (((document.documentElement.clientHeight || body.clientHeight) - dom.offsetHeight) >> 1) + 'px';
            }
            
            self.trigger('open');
        };
        
        
        self.clientRect = function () {
            
            var clientRect = base.clientRect.call(this);
            
            return clientRect;
        };
        
        
        self.arrange = function () {
            
            this.refresh.call(this.head);
            base.arrange.call(this);
        };
        
        
        self.close = function (dispose) {
            
            if (this.trigger(new flyingon.Event('closing')) !== false)
            {
                var body = document.body,
                    cache;
                
                if (cache = this.__draggable)
                {
                    this.head.off('mousedown', cache);
                }
                
                body.removeChild(this.dom);
                
                if (this.overlay)
                {
                    body.removeChild(this.overlay);
                    this.overlay = null;
                }
                
                this.trigger(new flyingon.Event('closed'));
                
                if (dispose)
                {
                    this.dispose();
                }
            }
        };
        
        
        self.dispose = function () {
            
            this.head.dispose();
            this.head = null;
            
            base.dispose.call(this);
        };
        
        
    });
    
    
});