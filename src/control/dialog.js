//自动引入样式
$require('flyingon/css/{skin}/flyingon-controls.css', true);



$class('Dialog', flyingon.Panel, function (base) {


    //已打开的窗口集合
    var dialog_list = [],
        show = this.show;

    
    
    $constructor(function () {

        
    });


    
    this.createDomTemplate('<div></div>');
    
    

    this.defaultWidth = 400;

    this.defaultHeight = 300;

    this.defaultValue('border', 1);
    
    this.defaultValue('padding', 2);


    //窗口图标        
    this.defineProperty('icon', '', {

        set: 'this.__set_icon(value);'
    });


    //窗口标题
    this.defineProperty('title', '', {

        set: 'this.head.title.dom.innerHTML = value;'
    });


    this.defineProperty('html', '', {

        set: 'this.clear();\n\t' + 'this.dom.children[1].innerHTML = value;'
    });


    //是否可拖动窗口
    this.defineProperty('draggable', true);


    //是否可调整大小
    this.defineProperty('resizable', true);


    //是否显示关闭按钮
    this.defineProperty('closable', true, {

        set: 'this.head.close.visible(value);'
    });


    //是否居中显示
    this.defineProperty('center', true);


    this.__set_icon = function (value) {

        var icon = this.head.icon;

        icon.visible(value);
        icon.className = 'flyingon-Control flyingon-Dialog-icon ' + (value || '');
    };




    this.show = function () {

        if (dialog_list.indexOf(this) < 0)
        {
            open(this);
        }
        else
        {

        }
    };


    this.showDialog = function () {

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


    this.clientRect = function () {

        var clientRect = base.clientRect.call(this);

        return clientRect;
    };


    this.arrange = function () {

        this.refresh.call(this.head);
        base.arrange.call(this);
    };


    this.close = function (dispose) {

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


    this.dispose = function () {

        this.head.dispose();
        this.head = null;

        base.dispose.call(this);
    };


});

    