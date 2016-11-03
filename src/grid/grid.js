

//表格控件
$class('Grid', flyingon.Control, function (base) {


    
    //弹出菜单
    var contextmenu;
    
    //弹出提醒
    var tip; 



    $constructor(function () {

        var self = this,
            dom = this.dom,
            children = dom.children,
            head,
            body,
            hscroll,
            vscroll,
            on = flyingon.dom_on;

        this.dom_back = children[0];
        this.dom_header = head = children[1];
        this.dom_body = body = children[2];
        this.dom_resize = children[3];
        this.dom_end = children[4];
        this.dom_hscroll = hscroll = children[5];
        this.dom_vscroll = vscroll = children[6];
        this.dom_sort = children[7];

        on(head, 'mouseover', function (e) {

            head_mouseover(self, e);
        });

        on(head, 'mousedown', function (e) {

            head_mousedown(self, e);
        });

        on(head, 'click', function (e) {

            head_click(self, e);
        });

        on(head, 'mouseout', function (e) {

            dom_mouseout(self, e, this);
        });

        on(body, 'mouseover', function (e) {

            body_mouseover(self, e);
        });

        on(body, 'mousedown', function (e) {

            body_mousedown(self, e);
        });

        on(body, 'click', function (e) {

            body_click(self, e);
        });

        on(body, 'mouseout', function (e) {

            dom_mouseout(self, e, this);
        });

        on(body, 'keydown', function (e) {

            body_keyup(self, e);
        });

        on(dom, 'mousewheel', function (e) {

            vscroll.scrollTop -= event.wheelDelta || (-event.detail * 40);//鼠标滚轮数据
        });

        on(dom, 'mouseout', function (e) {

            dom_mouseout(self, e, this);
        });

        on(hscroll, 'scroll', function (e) {

            var dom = self.dom_sort;

            head.children[0].style.left = body.children[0].style.left = head.lockedWidth - this.scrollLeft + 'px';

            if (dom.scroll_left >= 0)
            {
                dom.style.left = (dom.offset_left + dom.scroll_left - this.scrollLeft) + 'px';
            }
        });

        on(vscroll, 'scroll', function (e) {

            if (tip)
            {
                tip.close();
            }

            if (self.fullRender()) //全局渲染
            {
                body.children[0].style.top = body.children[1].style.top = -this.scrollTop + 'px';
            }
            else
            {
                self.renderBody();
            }
        });

        if (!tip)
        {
            contextmenu = new flyingon.Popup(false).multi(true).closeAway(true).addClass('flyingon-Grid-contextmenu');
            tip = new flyingon.Popup(false).multi(true).addClass('flyingon-Grid-tip');
        }
    });



    this.createDomTemplate(function () {
        
        var start = '<div class="flyingon-Grid',
            end = '</div>',
            relative = '" style="position:relative;',
            absolute = '" style="position:absolute;',
            style1 = 'overflow:hidden;margin:0;border:0;padding:0;',
            style2 = 'display:none;margin:0;right:0;bottom:0;z-index:1;',
            scroll = '<div style="' + style1 + 'width:1px;height:1px;"></div>',
            width = flyingon.vscroll_width,
            height = flyingon.hscroll_height;
        
        //解决IE7,8点击无法滚动或不出现滚动条的问题
        if (flyingon.ie9)
        {
            width++;
            height++;
        }

        width = 'width:' + width + 'px;';
        height = 'height:' + height + 'px;';       
        
        return new Array(
            
            start, relative, 'overflow:hidden;border-width:1px;">',
                start, '-back"', absolute, 'left:0;top:0;right:0;width:auto;border:0">', end,
                start, '-header"', relative, style1, '">', end,
                start, '-body"', relative, style1, 'outline:none;" tabindex="0">', end,
                start, '-resize"', absolute, style2, 'display:none;height:100%;">', end,
                start, '-end"', absolute, style2, width, height, 'left:auto;top:auto;overflow:scroll;">', end,
                start, '-hscroll', absolute, style2, height, 'width:auto;overflow-x:scroll;overflow-y:hidden;left:0;top:auto;">', scroll, end,
                start, '-vscroll', absolute, style2, width, 'height:auto;overflow-x:hidden;overflow-y:scroll;left:auto;top:0;">', scroll, end,
                start, '-sort"', absolute, style2, '">', end,
            end
            
        ).join('');
        
    }());



    this.defaultValue('border', 1);


    
    //表格列
    this.defineProperty('columns', null, {

        storage: 'this.__columns',
        set: 'this.__init_columns(value);'
    });

    //表格视图
    this.defineProperty('view', null, {

        storage: 'this.__view',
        set: 'this.__init_view(value);'
    });

    //数据集
    this.defineProperty('dataTable', null, {

        storage: 'this.__table',
        set: 'this.__init_table(value, oldValue);'
    });

    //是否只读
    this.defineProperty('readonly', true);

    //前部锁定列数
    this.defineProperty('lockedBefore', 0);

    //列头高
    this.defineProperty('headerHeight', 30);

    //是否自动选择当前行
    this.defineProperty('autoCurrentRow', true);

    //是否自动选择当前列
    this.defineProperty('autoCurrentColumn', false);

    //是否完整渲染(完全渲染时会一次性渲染所有数据)
    this.defineProperty('fullRender', false);

    

    this.__init_columns = function (options) {

        var Class = flyingon.GridColumn,
            list = Class.all,
            columns = [],
            cache;

        if (this.__columns)
        {
            this.__dispose_columns();
        }

        for (var i = 0, _ = options.length; i < _; i++)
        {
            if (cache = options[i])
            {
                var column = new (list[cache.type] || Class)();
                
                column.grid = this;
                column.assign(cache, 'type');
                
                columns.push(column);
            }
        }

        (this.__columns = columns).__init = true;
    };
    

    this.__init_view = function (value) {

        var GridView = flyingon.GridView,
            table = this.__table,
            view = this.__view;

        if (view instanceof GridView)
        {
            view.clear();
            view.grid = null;
        }
        
        view = this.__view = new (GridView.all[value && value.type || value] || GridView)();
        view.grid = this;
        view.assign(value, 'type');
        
        if (table)
        {
            init_view(this, table);
        }

        return view;
    };
    
    
    this.__init_table = function (table, oldValue) {
        
        if (table instanceof flyingon.DataTable)
        {
            var self = this,
                id = this.uniqueId;

            if (oldValue)
            {
                oldValue.off(id);
            }
        
            init_view(self);
                
            table.on('load', function () {
               
                init_view(self);
                
            }, id);
        }
        else
        {
            alert($translate('flyingon', 'type error'));
        }
    };
    
    
    function init_view(self, table) {
      
        var view = self.__view,
            length;
        
        if (view)
        {
            if ((length = view.length) > 0)
            {
                Array.prototype.splice.call(view, 0, view.length);
            }
            
            view.table = table;
            view.length = table.length;
            view.init(table);
        }
    };


    
    //检测列操作
    function check_operate(self, e) {

        var dom = self.dom_header.children[2], //ie7下未渲染时dom为空
            view = self.__view,
            cell;

        if (dom && view && e && (cell = view.eventHeaderCell(e)))
        {
            var style = dom.style,
                index = cell.getAttribute('column-index') | 0,
                column = self.__columns[index],
                storage,
                parent;

            if (column && (storage = column.__storage) && storage.showOperate)
            {
                dom.setAttribute('column-index', index);

                parent = cell.parentNode;
                
                style.display = 'block';
                style.top = (cell.offsetTop + 1) + 'px';
                style.left = (parent.parentNode.offsetLeft + parent.offsetLeft + column.left + 2) + 'px';
            }
            else
            {
                style.display = 'none';
            }
        }
    };


    //显示操作指引
    function show_operate(self, e) {

        var columns = self.__columns,
            dom = e.target,
            index = dom.getAttribute('column-index') | 0;

        if (columns && index >= 0)
        {
            var writer = [],
                menu = contextmenu,
                column,
                storage;

            menu.close('auto');

            for (var i = 0, _ = columns.length; i < _; i++)
            {
                if ((column = columns[i]) && (storage = column.__storage) && storage.showOperate)
                {
                    writer.push('<div class="flyingon-Grid-contextmenuitem">',
                        '<input type="checkbox"', 
                        storage.visible ? ' checked="true"' : '',
                        ' column-index="', i, 
                        '"></input>',
                        column.titleText,
                        '</div>');
                }
            }

            menu.dom.innerHTML = writer.join('');
            menu.open(dom);

            dom = menu.dom;

            flyingon.dom_on(dom, 'click', function (e) {

                hide_column(self, e);
            });

            menu.on('closed', function (e, closeType, event) {

                flyingon.dom_off(dom, 'click');
                check_operate(self, event);
            });
        }
    };


    //隐藏表格列
    function hide_column(self, e) {

        var columns = self.__columns,
            index = e.target.getAttribute('column-index'),
            column,
            cache,
            visible;

        if (index != null && (column = columns[index | 0]) && (column = column.__storage))
        {
            if (column.visible = e.target.checked)
            {
                visible = true;
            }
            else
            {
                //检测不可隐藏所有列
                for (var i = 0, _ = columns.length; i < _; i++)
                {
                    if ((cache = columns[i]) && 
                        (cache = cache.__storage) && 
                        cache.visible && 
                        cache.width > 0 && 
                        cache.showOperate)
                    {
                        visible = true;
                        break;
                    }
                }
            }

            if (visible)
            {
                self.renderHeader();
                self.renderBody();
                self.renderScroll();
            }
            else
            {
                column.visible = true;
                alert('unable to hide all columns!');
            }
        }
    };


    //处理列头鼠标移入事件
    function head_mouseover(self, e) {

        var name = e.target.className;

        if (name && !self.__column_resize && name.indexOf('flyingon-Grid-operate') < 0)
        {
            check_operate(self, e);
        }
    };


    //处理列头鼠标按下事件
    function head_mousedown(self, e) {

        var name = e.target.className;

        if (name && name.indexOf('flyingon-Grid-resize-column') >= 0)
        {
            var dom = e.dom = self.dom_resize,
                style = dom.style,
                target = e.target,
                parent = target.parentNode,
                column = self.__columns[target.getAttribute('column-index') | 0],
                context = {

                    style: style,
                    grid: self,
                    column: column
                };

            style.left = (parent.parentNode.offsetLeft + parent.offsetLeft + column.left + column.__storage.width - 2) + 'px';
            style.display = 'block';

            flyingon.dom_drag(context, e, null, null, resize_end, 'y', false);
        }
    };


    //停止调整列宽
    function resize_end(e) {

        var self = this.grid,
            column = this.column,
            storage = column.__storage,
            style = this.style,
            distanceX = e.distanceX;

        self.__column_resize = false;
        style.display = 'none';

        if (distanceX)
        {
            if (distanceX < -storage.width)
            {
                distanceX = -storage.width;
            }

            storage.width += distanceX;

            self.renderHeader();
            self.renderBody();
            self.renderScroll();

            //调整滚动条位置
            if (distanceX < 0 && (style = self.dom_hscroll.style).display === 'none')
            {
                //设置滚动位置
                style.display = 'block';
                
                self.dom_hscroll.scrollLeft = 0;
                self.dom_header.children[0].style.left = self.dom_body.children[0].style.left = self.dom_header.lockedWidth + 'px';
            }

            if (self.dom_sort.column_index >= column.renderIndex)
            {
                self.dom_sort.style.left = (self.dom_sort.offset_left += distanceX) + 'px';
            }
        }

        this.grid = this.column = this.style = null;
    };


    //处理列头点击事件
    function head_click(self, e) {

        var name = e.target.className,
            view,
            cell,
            column;

        if (name && name.indexOf('flyingon-Grid-operate') >= 0)
        {
            show_operate(self, e);
        }
        else if ((view = self.__view) &&
            (cell = view.eventHeaderCell(e)) &&
            (cell.getAttribute('column-end') == null) &&
            (column = self.__columns[cell.getAttribute('column-index') | 0]))
        {
            var storage = column.__storage,
                dom = self.dom_sort,
                parent = cell.parentNode,
                style = dom.style,
                cache;

            if (storage.sortable && (cache = parent.parentNode))
            {
                view.sort(column, storage.desc = !storage.desc);

                style.display = 'block';

                dom.column_index = column.renderIndex;
                dom.offset_left = cache.offsetLeft + parent.offsetLeft + column.left + cell.offsetWidth - dom.offsetWidth - 2;

                style.top = (cell.offsetTop + ((cell.offsetHeight - dom.offsetHeight) >> 1)) + 'px';
                style.left = dom.offset_left + 'px';

                dom.className = 'flyingon-Grid-sort flyingon-Grid-' + (storage.desc ? 'desc' : 'asc');

                //如果是滚动列则记下滚动条位置以便拖动时调整偏移
                if (parent && (parent = parent.className) && parent.indexOf('flyingon-Grid-scroll') >= 0)
                {
                    dom.scroll_left = self.dom_hscroll.scrollLeft;
                }
                else
                {
                    dom.scroll_left = -1;
                }

                self.renderBody();
            }
            else
            {
                style.display = 'none';
            }
        }
    };


    //处理表格体鼠标移入事件
    function body_mouseover(self, e) {

        var view = self.__view,
            cell,
            text;

        if (tip)
        {
            tip.close();
        }

        try
        {
            //IE8在滚动鼠标分屏加载时会触发系统异常, 可能IE8的渲染与js执行不是同步的
            if (tip && view && (cell = view.eventBodyCell(e)) &&
                self.trigger('cellmouseover', e, cell) !== false &&
                cell.scrollWidth > cell.clientWidth &&
                (text = cell.textContent || cell.innerText))
            {
                tip.dom['textContent' in cell ? 'textContent' : 'innerText'] = text;
                tip.open(cell, 4);
            }
        }
        catch (e)
        {
        }
    };


    //处理表格体鼠标按下事件
    function body_mousedown(self, e) {

        var view, cell, column;

        if ((e.which === 1 || e.button === 1) &&
            (view = self.__view) &&
            (cell = view.eventBodyCell(e)) &&
            (column = self.__columns[cell.getAttribute('column-index') | 0]))
        {
            if (!e.target.getAttribute('no-current') &&
                (!column.__on_cell_mousedown || column.__on_cell_mousedown(e, cell) !== false))
            {
                view.changeCurrent(cell);
            }
        }
    };


    //处理单元格点击事件
    function body_click(self, e) {

        var view = self.__view,
            cell;

        if (view)
        {
            if (e.target.getAttribute('tree-expand'))
            {
                view.__on_collapse(e);
            }
            else if (e.target.getAttribute('tree-collapse'))
            {
                view.__on_expand(e);
            }
            else if (cell = view.eventBodyCell(e))
            {
                self.trigger('cellclick', e, cell);
            }
        }
    };


    //移动表格行
    function change_row(self, view, offset) {

        var row = view.currentRow,
            index = 0;

        if (row)
        {
            index = row.renderIndex + offset;
        }

        if (index < 0)
        {
            index = 0;
        }
        else if (index >= view.length)
        {
            index = view.length - 1;
        }

        if (!row || index !== row.renderIndex)
        {
            self.currentRow(index);
        }
    };


    //移动表格列
    function change_column(self, view, offset) {

        var column = view.currentColumn,
            index = 0;

        if (column)
        {
            index = column.renderIndex + offset;
        }

        if (index < 0)
        {
            index = 0;
        }
        else if (index >= self.__columns.length)
        {
            index = self.__columns.length - 1;
        }

        if (!column || index !== column.renderIndex)
        {
            self.currentColumn(index);
        }
    };


    //处理表格体keyup事件
    function body_keyup(self, e) {

        var view = self.__view;

        if (view)
        {
            switch (e.which || e.keyCode)
            {
                case 37: //向左
                    change_column(self, view, -1);
                    break;

                case 38: //向上
                    change_row(self, view, -1);
                    break;

                case 9: //tab
                case 39: //向右
                    change_column(self, view, 1);
                    break;

                case 40: //向下
                    change_row(self, view, 1);
                    break;
            }
        }
    };


    //移出表格组件范围时的清理
    function dom_mouseout(self, e, dom) {

        if (self.trigger('cellmouseout', e) !== false)
        {
            var rect = dom.getBoundingClientRect(),
                x = e.clientX,
                y = e.clientY;

            if (x <= rect.left || y <= rect.top || x >= rect.right || y >= rect.bottom)
            {
                if (dom === self.dom_header)
                {
                    dom.children[2].style.display = 'none';
                }
            }
        }
    };


    //获取事件触发相关的表格行
    this.eventRow = function (e) {

        var view = this.__view,
            cell;

        if (view && (cell = view.eventBodyCell(e)))
        {
            return view[cell.getAttribute('row-index') | 0];
        }
    };


    //获取事件触发相关的表格列
    this.eventColumn = function (e) {

        var columns = this.__columns,
            view = this.__view,
            cell;

        if (columns && view && (cell = view.eventBodyCell(e) || view.eventHeaderCell(e)))
        {
            return columns[cell.getAttribute('column-index') | 0];
        }
    };


    //查找列
    this.findColumn = function (filter) {
        
        var columns = this.__columns;
        
        if (columns)
        {
            if (!filter)
            {
                return null;
            }
            
            switch (typeof filter)
            {
                case 'number':
                    return columns[filter | 0] || null;

                case 'string':
                    for (var i = columns.length - 1; i >= 0; i--)
                    {
                        if (columns[i].fieldName === filter)
                        {
                            return columns[i];
                        }
                    }
                    break;

                case 'function':
                    for (var i = columns.length - 1; i >= 0; i--)
                    {
                        if (filter(columns[i]))
                        {
                            return columns[i];
                        }
                    }
                    break;
            }
        }
        
        return null;
    };
    
    
    //添加列
    this.addColumn = function (type, options) {
        
        return this.insertColumn(-1, type, options);
    };
    
    
    //插入列
    this.insertColumn = function (index, type, options) {
        
        var columns = this.__columns || (this.__columns = []),
            Class = flyingon.GridColumn,
            column;
        
        if (type instanceof Class)
        {
            column = type;
        }
        else if (type)
        {
            if (typeof type === 'object')
            {
                options = type;
                type = type.type;
            }
                
            column = new (Class.all[type] || Class)();
            column.assign(options);
        }
        else
        {
            column = new Class();
            column.assign('');
        }
        
        if (index < 0 || index >= columns.length)
        {
            columns.push(column);
        }
        else
        {
            columns.splice(index, 0, column);
        }
        
        return this.renderDelay();
    };
    
    
    //移除列
    this.removeColumn = function (index) {
      
        var columns = this.__columns;
        
        if (columns)
        {
            columns.splice(index.renderIndex || (index | 0), 1);
            this.renderDelay();
        }
        
        return this;
    };
    
    
    
    var render_time = 0;
    
    //延迟绘制表格
    this.renderDelay = function (body) {

        var self = this;
        
        if (render_time)
        {
            clearTimeout(render_time);
        }
        
        render_time = setTimeout(function () {
            
            self.render(body);
            
        }, 20);
        
        return this;
    };
    
    
    //重绘表格
    this.render = function (header) {
    
        var date = new Date();

        base.render.call(this);
        
        //先记录下窗口的大小
        this.clientWidth = this.dom.clientWidth;
        this.clientHeight = this.dom.clientHeight;

        if (header !== false)
        {
            this.renderHeader();
        }
        
        this.renderBody(true);
            
        console.log('update:' + (new Date() - date));
        
        return this;
    };
    
    
    //渲染表头
    this.renderHeader = function () {

        var columns = this.__columns;

        if (columns && columns.length > 0)
        {
            var date = new Date();

            var head = this.dom_header,
                style = head.style,
                lockedBefore = this.lockedBefore(), //锁定列
                totalWidth = 0,
                lockedWidth = 0,
                visible1 = 0,
                visible2 = 0,
                column,
                storage,
                width;

            //计算锁定列宽
            for (var i = 0, _ = columns.length; i < _; i++)
            {
                if ((column = columns[i]) && 
                    (storage = column.__storage) && 
                    (storage.visible && (width = storage.width) > 0))
                {
                    if (i < lockedBefore)
                    {
                        visible1++;
                        lockedWidth += width;
                    }
                    else
                    {
                        visible2++;
                    }

                    totalWidth += width;
                }
            }

            head.locked_visible = visible1; //锁定列可见列数
            head.scroll_visible = visible2; //非锁定列的可见列数

            head.lockedBefore = lockedBefore; //锁定列数
            head.lockedWidth = lockedWidth; //锁定列宽
            head.totalWidth = totalWidth; //滚动列宽

            head.headerHeight = this.headerHeight(); //列头高度

            style.display = 'none';

            //设置总宽高
            style.width = head.totalWidth + 'px';
            style.height = this.dom_back.style.height = head.headerHeight + 'px';

            //渲染列头
            head.innerHTML = head.headerHeight > 0 ? render_header(this, columns) : '';

            style.display = 'block';

            console.log('render columns: ' + columns.length + ' columns, time:' + (new Date() - date) + 'ms');
        }

        return this;
    };

    
    function render_header(self, columns) {

        var writer = [],
            head = self.dom_header,
            lockedBefore = head.lockedBefore,
            lockedWidth = head.lockedWidth,
            headerHeight = head.headerHeight,
            style = 'position:absolute;overflow:hidden;margin:0;border:0;padding:0;height:' + headerHeight + 'px;width:';

        writer.push('<div class="flyingon-Grid-scroll" style="', style, head.totalWidth - lockedWidth, 'px;left:', lockedWidth - self.dom_hscroll.scrollLeft, 'px;">');

        render_columns_header(writer, columns, lockedBefore, columns.length, headerHeight);

        writer.push('</div>',
                    '<div class="flyingon-Grid-locked" style="', style, lockedWidth, 'px;left:0;z-index:1;">');

        if (lockedBefore > 0)
        {
            render_columns_header(writer, columns, 0, lockedBefore, headerHeight);
        }

        writer.push('</div>',
                    '<div class="flyingon-Grid-operate" style="position:absolute;display:none;z-index:1;"></div>');

        return writer.join('');
    };


    function render_columns_header(writer, columns, start, end, headerHeight) {

        var left = 0;

        for (var i = start; i < end; i++)
        {
            left += columns[i].renderHeader(writer, columns, i, left, headerHeight);
        }
    };



    //渲染数据
    this.renderBody = function (resize) {

        var table = this.__table,
            view = this.__view || this.__init_view(),
            start = view.findRowIndex(this.dom_vscroll.scrollTop);

        this.dom_body.style.height = (this.clientHeight - this.dom_header.headerHeight) + 'px';

        if (table)
        {
            //启用了延迟分包加载
            if (view.maxDelayRows() > table.length && start > table.length)
            {
                this.trigger('delayload');
            }
            else
            {
                view.render(start);

                if (resize !== false)
                {
                    this.renderScroll();
                }
            }
        }
        
        return this;
    };


    this.__check_scroll = function (width, height) {

        var head= this.dom_header,
            style1 = head.style,
            style2 = this.dom_body.style,
            clientWidth = this.clientWidth,
            clientHeight = this.clientHeight,
            hscroll = 0,
            vscroll = 0;

        if (width > clientWidth)
        {
            hscroll = flyingon.hscroll_height;
        }

        if (height > clientHeight - head.headerHeight - hscroll)
        {
            vscroll = flyingon.vscroll_width;

            if (width > clientWidth - vscroll)
            {
                hscroll = flyingon.hscroll_height;
            }
        }

        return [hscroll, vscroll];
    };


    //渲染滚动条
    this.renderScroll = function () {

        var date = new Date();

        var head = this.dom_header,
            view = this.__view,
            hscroll_style = this.dom_hscroll.style,
            vscroll_style = this.dom_vscroll.style,
            end_style = this.dom_end.style;

            var width = view && view.width || head.totalWidth,
            height = view && view.height || 0,
            scroll = this.__check_scroll(width, height),
            hscroll = scroll[0],
            vscroll = scroll[1];

        if (hscroll > 0)
        {
            hscroll_style.display = 'block';
            this.dom_hscroll.children[0].style.width = width + (vscroll > 0 ? 1 : 0) + 'px';
        }
        else
        {
            hscroll_style.display = 'none';
        }

        if (vscroll > 0)
        {
            vscroll_style.display = 'block';
            vscroll_style.top = head.headerHeight + 'px';
            vscroll_style.bottom = (hscroll > 0 ? hscroll - 2 : 0) + 'px';

            this.dom_vscroll.children[0].style.height = height + (hscroll > 0 ? 1 : 0) + 'px';
        }
        else
        {
            vscroll_style.display = 'none';
        }

        if (hscroll > 0 && vscroll > 0)
        {
            hscroll_style.right = (vscroll - 2) + 'px';

            end_style.display = 'block';
            end_style.width = vscroll + 'px';
            end_style.height = hscroll + 'px';
        }
        else
        {
            end_style.display = 'none';
            hscroll_style.right = '0';
        }

        console.log('render scroll:' + (new Date() - date));

        return this;
    };


    //获取设置或清除选中行
    this.checkedRows = function (rows) {

        var view = this.__view,
            cache = view && view.checkedRows;

        //获取选中行
        if (rows === void 0)
        {
            return cache.values || [];
        }

        var list = new flyingon.NodeList(),
            className = 'flyingon-Grid-row-checked',
            row,
            length;

        //查找选择框的函数
        function find(dom) {

            if (dom && dom.className.indexOf('flyingon-Grid-checked') >= 0)
            {
                return dom.getElementsByTagName('input')[0];
            }
        };

        //清空选中行
        if (view && cache && (length = cache.length) > 0)
        {
            for (var i = 0; i < length; i++)
            {
                if (row = cache[i])
                {
                    row.checked = false;
                    view.findRowCells(row, list);
                }
            }

            list.removeClass(className);
            list.find(find).prop('checked', false);
            list.length = 0;

            cache.clear();
            view.checkedRows = null;
        }

        //设置选中行
        if (view && rows !== null)
        {
            if (!Array.isArray(rows))
            {
                rows = [rows];
            }

            length = rows.length;

            for (var i = 0; i < length; i++)
            {
                if ((row = rows[i]) >= 0)
                {
                    row = this.__view[row];
                }

                if (row)
                {
                    row.checked = true;
                    
                    (cache || (view.checkedRows = new Set())).add(row);
                    view.findRowCells(row, list);
                }
            }

            if (list.length > 0)
            {
                list.addClass(className);
                list.find(find).prop('checked', true);
                list.length = 0;
            }
        }

        return this;
    };


    //获取设置或清除当前行
    this.currentRow = function (row) {

        var view = this.__view,
            cache = view && view.currentRow;

        //不传参数则获取当前行
        if (row === void 0)
        {
            return cache || null;
        }

        if (row !== null)
        {
            if (row >= 0)
            {
                row = view && view[row];
            }
            else if (row < 0)
            {
                row = view && view[view.length + row];
            }
        }

        if (cache !== row)
        {
            var className = 'flyingon-Grid-row-selected';

            if (cache)
            {
                cache.selected = false;

                view.currentRow = null;
                view.findRowCells(cache).removeClass(className);
            }

            if (row)
            {
                row.selected = true;

                view.currentRow = row;
                view.findRowCells(row).addClass(className);
            }
        }

        return this;
    };


    //获取设置或清除当前列
    this.currentColumn = function (column) {

        var view = this.__view,
            cache = view && view.currentColumn,
            columns;

        //不传参数则获取当前行
        if (column === void 0)
        {
            return cache || null;
        }

        if (column !== null && (columns = this.__columns))
        {
            if (column >= 0)
            {
                column = columns[column];
            }
            else if (column < 0)
            {
                column = columns[columns.length + column];
            }
        }

        if (cache !== column)
        {
            var className = 'flyingon-Grid-column-selected';

            if (cache)
            {
                cache.selected = false;

                view.currentColumn = null;
                view.findColumnCells(cache).removeClass(className);
            }

            if (column)
            {
                column.selected = true;

                view.currentColumn = column;
                view.findColumnCells(column).addClass(className);
            }
        }

        return this;
    };


    //滚动到指定行
    this.scrollTo = function (index) {

        var view = this.__view;

        if (view)
        {
            var length = view.length;

            if (index < 0)
            {
                index = length + index;
            }

            if (index >= length)
            {
                index = length - 1;
            }

            this.dom_vscroll.scrollTop = view.rowHeight() * index;
        }

        return this;
    };


    //展开树节点
    this.expand = function (expandLevel) {

        var view = this.__view;

        if (view)
        {
            view.expand();
            this.renderBody(true);
        }

        return this;
    };


    //收拢树节点
    this.collapse = function () {

        var view = this.__view;

        if (view)
        {
            view.collapse(true);
            view.fix_vscroll();

            this.renderBody(true);
        }

        return this;
    };


    //关闭提醒信息
    this.closeTip = function () {

        tip && tip.close();
        return this;
    };


    this.dispose = function () {

        var view = this.__view,
            off = flyingon.dom_off;

            off(this.dom_hscroll);
            off(this.dom_vscroll);
            off(this.dom_header);
            off(this.dom_body);
            off(this.dom);

        if (view)
        {
            if (view.grid)
            {
                view.clear();
                view.grid = null;
            }

            this.__view = null;
        }

        this.__dispose_columns();

        return base.dispose.call(this);
    };


    this.__dispose_columns = function () {

        var columns = this.__columns,
            length;

        if (columns && columns.__init && (length = columns.length) > 0)
        {
            for (var i = 0; i < length; i++)
            {
                columns[i].grid = null;
            }

            columns.length = 0;
            this.__columns = null;
        }
    };


});



