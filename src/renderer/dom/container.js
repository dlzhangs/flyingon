

//容器控件渲染器
$class('ContainerRenderer', flyingon.Renderer, function (base) {
    
    
    //临时节点
    var dom_host = document.createDocumentFragment();
    
    
    
    //设置渲染大小时不包含padding
    this.__no_padding = false;
    

    
    //绑定渲染器
    this.bind(flyingon.ContainerFragment, flyingon.Panel);
    
    
    
    //获取控件dom对象
    function to_dom(controls) {
        
        var control;
        
        if (controls[1])
        {
            var dom = dom_host,
                i = 0;

            while (control = controls[i++])
            {
                dom.appendChild(control.view || control.renderer.init(control));
            }
            
            return dom;
        }

        control = controls[0];
        return control.view || control.renderer.init(control);
    };
    
    
    this.append = function (control, children) {
        
        (control.view_body || control.view).appendChild(to_dom(children));
    };
    
    
    this.insert = function (control, index, children) {

        var dom = control.view_body || control.view;
        dom.insertBefore(to_dom(children), dom.children[index] || null);
    };
    
    
    this.remove = function (control, item, index) {
        
        (control.view_body || control.view).removeChild(item.view);
    };
    
    
    this.clear = function (control) {
        
        var parent = this.view_body || this.view,
            dom = parent.lastChild;
        
        while (dom)
        {
            parent.removeChild(dom);
            dom = dom.previousSibling;
        }
    };
    
    
    this.render = function (control) {
        
        var box = control.boxModel;
        
        if (box)
        {
            var dom = control.view_body || control.view,
                style = dom.style,
                hscroll = box.hscroll,
                vscroll = box.vscroll,
                children,
                div;
            
            base.render.call(this, control);
            
            //处理滚动条: 注overflow==='auto'在chrome下在未超出原滚动条时不会消失
            style.overflowX = hscroll ? 'scroll' : 'hidden';
            style.overflowY = vscroll ? 'scroll' : 'hidden';
                
            if (children = control.__children)
            {
                if (!children[0].view)
                {
                    this.append(control, children);
                }

                if (hscroll || vscroll)
                {
                    if ((div = dom.firstChild) && div.__scroll)
                    {
                        style = div.style;
                    }
                    else
                    {
                        dom.insertBefore(dom = document.createElement('div'), div || null);
                        dom.__scroll = true;

                        style = dom.style;
                        style.cssText = "position:absolute;overflow:hidden;margin:0;border:0;padding:0;width:1px;height:1px;visibility:hidden;";
                    }
                    
                    //使用positon:relatvie left,top或margin:bottom,right定位时在IE6,7不正常
                    //style.margin = height + 'px 0 0 ' + width + 'px';
                    style.left = (box.contentWidth - 1) + 'px';
                    style.top = (box.contentHeight - 1) + 'px';
                }

                this.renderChildren(control, children);
            }
        }
    };
    
    
    this.renderChildren = function (control, children) {
        
        for (var i = children.length - 1; i >= 0; i--)
        {
            children[i].update();
        }
    };

    
});



