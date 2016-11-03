

//表格视图
$class('GridView', function () {

    
    var DataRow = flyingon.GridRow;
    
    var splice = [].splice;
    var sort = [].sort;

    
    
    //视图类型
    this.type = '';
    
    
    //行高
    this.defineProperty('rowHeight', 28);

    //延迟加载最大行数
    this.defineProperty('maxDelayRows', 0);

    
    //表格行数量
    this.length = 0;
    

    //视图宽度
    this.width = 0;

    //视图高度
    this.height = 0;
    
    
    //当前行索引
    this.rowIndex = 0;
    
    //当前列索引
    this.columnIndex = 0;
    
    
    //选中的表格行
    this.checkRows = null;
    
    
    
    this.init = function (table) {
      
    };
    
    
    //获取指定索引的表格行
    this.at = function (index) {
        
        var row = this[index];
        
        if (row)
        {
            return row;
        }
        
        if (row = this.table[index])
        {
            return this[index] = new DataRow(this, row);
        }
        
        return null;
    };
    
    
    //查找指定位置的表格行
    this.findRowIndex = function (top) {

        return top / this.rowHeight() | 0;
    };


    //排序
    this.sort = function (column, desc) {

        var fn;

        if (column && (fn = column.sort(desc)))
        {
            sort.call(this, fn);
        }
    };


    //渲染
    this.render = function (start, resize) {

        var date = new Date();

        var writer = [],
            grid = this.grid,
            columns = grid.__columns,
            table = this.table,
            head = grid.dom_header,
            body = grid.dom_body,
            storage = this.__storage,
            rowHeight = storage.rowHeight,
            lockedWidth = head.lockedWidth,
            lockedBefore = head.lockedBefore,
            width = head.totalWidth - lockedWidth,
            height = Math.max(storage.maxDelayRows, this.length) * rowHeight,
            scrollTop = grid.dom_vscroll.scrollTop,
            style = 'position:absolute;overflow:hidden;margin:0;border:0;padding:0;top:' + -scrollTop + 'px;height:' + height + 'px;width:';

        //记录视图大小
        this.width = head.totalWidth;
        this.height = height;

        //如果是全局渲染
        if (grid.fullRender())
        {
            start = 0;
            this.end = this.length;
        }
        else
        {
            this.end = this.__render_end(start, scrollTop, grid.clientHeight - head.headerHeight, rowHeight);
        }

        //记录渲染的开始及结束行号
        this.start = start;

        //触发渲染前事件
        grid.trigger('beforerender');

        writer.view = this;
        writer.columns = columns;
        
        writer.push('<div class="flyingon-Grid-scroll" style="', style, width, 'px;left:', lockedWidth - grid.dom_hscroll.scrollLeft, 'px;">');

        this.__render_columns(writer, columns, lockedBefore, columns.length, rowHeight);
        
        writer.push('</div>',
                    '<div class="flyingon-Grid-locked" style="', style, lockedWidth, 'px;z-index:1;">');

        if (lockedBefore > 0)
        {
            this.__render_columns(writer, columns, 0, lockedBefore, rowHeight);
        }

        writer.push('</div>');

        writer.view = writer.columns = null;

        body.style.display = 'none';
        body.innerHTML = writer.join('');

        if (resize)
        {
            body.style.height = height + 'px';
            grid.renderScroll();
        }

        body.style.display = 'block';

        //触发渲染后事件
        grid.trigger('afterrender');

        console.log('render rows: ' + (this.end - start) + ' rows, time:' + (new Date() - date) + 'ms');
    };


    this.__render_end = function (start, top, height, rowHeight) {

        height += (top % rowHeight); //处理开始的行偏移避免有时渲染不出最后一行的问题
        return start + Math.min(this.length - start, Math.ceil(height / rowHeight));
    };


    this.__render_columns = function (writer, columns, start, end, rowHeight) {

        var top = this.start * rowHeight;

        for (var i = this.start, _ = this.end; i < _; i++)
        {
            var row = this[i] || this.at(i);

            row.top = top;
            row.height = rowHeight;
            row.renderIndex = i;

            this.renderRow(writer, row, columns, start, end);

            top += rowHeight;
        }
    };


    //渲染行
    this.renderRow = function (writer, row, columns, start, end) {

        var column, storage;

        for (var i = start; i < end; i++)
        {
            if ((column = columns[i]) && 
                (storage = column.__storage) && 
                storage.visible && 
                storage.width > 0)
            {
                column.renderBody(writer, columns, row);
            }
        }
    };


    //从指定的dom往上查找拥有指定className的dom
    this.findDom = function (dom, className) {

        var name;

        while (dom && dom.nodeType === 1)
        {
            if ((name = dom.className) && name.indexOf(className) >= 0)
            {
                return dom;
            }

            dom = dom.parentNode;
        }
    };


    //查找事件触发的列头单元格
    this.eventHeaderCell = function (event) {

        return this.findDom(event.target, 'flyingon-Grid-hcell');
    };


    //查找事件触发的单元格
    this.eventBodyCell = function (event) {

        return this.findDom(event.target, 'flyingon-Grid-cell');
    };


    //查找单元格
    this.findCell = function (row, column) {

        var list = this.find_row.cells(row),
            index = '' + (column >= 0 ? column : column.renderIndex);

        for (var i = 0, _ = list.length; i < _; i++)
        {
            if (list[i].getAttribute('column-index') === index)
            {
                return list[i];
            }
        }
    };


    //查找指定行索引的单元格
    this.findRowCells = function (row, list) {

        var grid = this.grid,
            start = this.start,
            end = this.end,
            index = row >= 0 ? row : row.renderIndex;

        list = list || new flyingon.NodeList();

        if (index < start || index >= end)
        {
            return list;
        }

        var head = grid.dom_header,
            body = grid.dom_body,
            children = body.children[1].children,
            step = head.locked_visible,
            offset = (index - start) * step;

        for (var i = 0; i < step; i++)
        {
            list.push(children[offset + i]);
        }

        children = body.children[0].children;
        step = head.scroll_visible;
        offset = (index - start) * step;

        for (var i = 0; i < step; i++)
        {
            list.push(children[offset + i]);
        }

        return list;
    };


    //查找指定列索引的单元格
    this.findColumnCells = function (column, list, header, body) {

        var grid = this.grid,
            columns = this.columns,
            head = grid.dom_header,
            index = column >= 0 ? column : column.renderIndex,
            lockedBefore = head.lockedBefore,
            children,
            item,
            cache;

        list = list || new flyingon.NodeList();

        if (!(cache = columns[index]) || !cache.visible || cache.width <= 0)
        {
            return list;
        }

        if (header !== false)
        {
            children = grid.dom_header.children[index >= lockedBefore ? 0 : 1].children;
            cache = '' + index;

            for (var i = 0, _ = children.length; i < _; i++)
            {
                item = children[i];

                if (item.getAttribute('column-index') === cache &&
                    item.className.indexOf('flyingon-Grid-hcell') >= 0)
                {
                    list.push(item);
                }
            }
        }

        if (body !== false)
        {
            var start = index,
                step;

            children = grid.dom_body.children[index >= lockedBefore ? 0 : 1].children;

            for (var i = index - 1; i >= 0; i--)
            {
                if (!(item = columns[i]).visible || item.width <= 0)
                {
                    start--;
                }
            }

            if (index >= lockedBefore)
            {
                start -= lockedBefore;
                step = head.scroll_visible;
            }
            else
            {
                step = head.locked_visible;
            }

            cache = children.length;

            while (start < cache)
            {
                list.push(children[start]);
                start += step;
            }
        }

        return list;
    };


    //切换当前单元格
    this.changeCurrent = function (cell) {

        var grid = this.grid,
            //style = grid.dom_body.style,
            row1 = this.currentRow,
            row2 = this[cell.getAttribute('row-index') | 0],
            column1 = this.currentColumn,
            column2 = grid.__columns[cell.getAttribute('column-index') | 0],
            cache;

        //style.visibility = 'hidden';

        if (column1 !== column2 && grid.autoCurrentColumn())
        {
            cache = 'flyingon-Grid-column-selected';

            if (column1)
            {
                column1.selected = false;
                this.findColumnCells(column1).removeClass(cache);
            }

            column2.selected = true;

            this.currentColumn = column2;
            this.findColumnCells(column2).addClass(cache);
        }

        if (row1 !== row2 && grid.autoCurrentRow())
        {
            cache = 'flyingon-Grid-row-selected';

            if (row1)
            {
                row1.selected = false;
                this.findRowCells(row1).removeClass(cache);
            }

            row2.selected = true;

            this.currentRow = row2;
            this.findRowCells(row2).addClass(cache);
        }

        //style.visibility = '';
    };


    //清除数据行
    this.clear = function () {

        var length = this.length,
            cache;

        if (length > 0)
        {
            for (var i = 0; i < length; i++)
            {
                if (cache = this[i])
                {
                    this[i] = cache.grid = cache.data = null;
                }
            }

            splice.call(this, 0, length);

            this.length = this.start = this.end = 0;

            if (cache = this.checkedRows)
            {
                cache.length = 0;
                this.checkedRows = null;
            }
        }

        this.currentRow = this.currentColumn = null;
    };


    
    var views;
    
    this.__class_init = function (Class) {

        if (views)
        {
            if (this.type)
            {
                views[this.type] = Class;
            }
            else
            {
                throw $translate('flyingon', 'GridView_type_error');
            }
        }
        else
        {
            Class.all = views = flyingon.create(null);
        }
    };


});



//树形表格视图
$class('TreeGridView', flyingon.GridView, function (base) {



    var splice = [].splice;
    var sort = [].sort;

    
    //注册的视图类型
    this.type = 'tree';

    
    //表格行类型
    this.rowType = flyingon.TreeGridRow;
    


    //计算树编号
    this.computeTreeIndex = function () {

        var start = this.start,
            end = this.end,
            index = 1,
            row;

        for (var i = 0; i < start; i++)
        {
            if (row = this[i])
            {
                if (row.expanded || !row.children)
                {
                    index++;
                }
                else
                {
                    index += row.count();
                }
            }
        }

        while (start < end)
        {
            if (row = this[start++])
            {
                row.treeIndex = index;

                if (row.expanded || !row.children)
                {
                    index++;
                }
                else
                {
                    index += row.count();
                }
            }
        }
    };


    this.__render_columns = function (writer, columns, start, end, rowHeight) {

        for (var i = 0, _ = columns.length; i < _; i++)
        {
            if (columns[i].formatter === 'tree')
            {
                this.computeTreeIndex();
                break;
            }
        }

        base.__render_columns.apply(this, arguments);
    };


    this.renderRow = function (writer, row, columns, start, end) {

        var treeFieldName = this.treeFieldName(),
            column,
            storage;

        for (var i = start; i < end; i++)
        {
            if ((column = columns[i]) && 
                (storage = column.__storage) && 
                storage.visible && 
                storage.width > 0)
            {
                column.renderBody(writer, columns, row, treeFieldName === storage.fieldName ? render_tree : null);
            }
        }
    };


    function render_tree(writer, column, row, text) {

        var children = row.children,
            cache = row.level;
        
        cache = (children ? 0 : 1) + (cache > 0 ? cache : 0);

        if (cache > 0)
        {
            writer.push('<span class="flyingon-Grid-tree-space" style="width:' + (cache * 16) + 'px;"></span>');
        }

        if (children)
        {
            cache = row.expanded ? 'expand' : 'collapse';
            writer.push('<span class="flyingon-Grid-tree-' + cache + '" tree-' + cache + '="true" no-current="true"></span>');
        }

        if (cache = column.iconClass)
        {
            if (typeof cache === 'function')
            {
                cache = cache.call(column, row.data, row, column) || '';
            }

            if (cache)
            {
                writer.push('<span class="flyingon-Grid-tree-icon ' + cache + '"></span>');
            }
        }

        writer.push('<span class="flyingon-Grid-tree-cell">' + (text || '') + '</span>');
    };


    //修改竖直滚动条因收拢不足一屏时而造成的位置偏移
    this.fix_vscroll = function () {

        if (this.start > 0)
        {
            var grid = this.grid,
                storage = this.__storage,
                height = Math.max(storage.maxDelayRows, this.length) * storage.rowHeight;

            if (!grid.__check_scroll(this.width, height)[1])
            {
                grid.dom_vscroll.scrollTop = 0;
                return true;
            }
        }
    };


});



//分组视图
$class('GroupGridView', flyingon.GridView, function (base) {
    
    
    this.type = 'group';
    
});


