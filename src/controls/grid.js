
//表格列
$class('GridColumn', function (base, self) {

    
    
    var registry_columns = flyingon.create(null);
    
    
    $static('all', registry_columns);
        
    

    $constructor(function (grid, option) {

        this.grid = grid;

        if (option)
        {
            for (var name in option)
            {
                if (name !== 'columnType')
                {
                    this[name] = option[name];
                }
            }
        }
    });


    //列类型
    this.columnType = null;

    //绑定的字段名
    this.fieldName = '';

    //数据类型
    this.dataType = 'string';

    //多行标题
    this.multiTitle = null;

    //标题
    this.title = '';

    //对齐方式
    this.align = '';

    //left
    this.left = 0;

    //列宽
    this.width = 100;

    //列头class
    this.headerClass = '';

    //单元格class
    this.cellClass = '';

    //是否可见
    this.visible = true;

    //是否选择
    this.selected = false;

    //是否只读
    this.readonly = false;

    //编辑器
    this.editor = null;

    //是否可调整列宽
    this.resizable = true;

    //是否可排序
    this.sortable = true;

    //是否降序排列
    this.desc = false;

    //是否可操作列
    this.showOperate = true;

    //格式化
    this.formatter = null;

    //列渲染索引
    this.renderIndex = -1;



    this.__render_header = function (writer, columns, index, left, headerHeight) {

        var top = 0,
            width = this.width,
            height = headerHeight;

        this.left = left;
        this.renderIndex = index;

        //渲染多行列
        if (this.multiTitle && this.multiTitle.length > 0)
        {
            top = this.__render_multiTitle(writer, columns, headerHeight);
            height -= top;
        }

        if (this.visible)
        {
            if (width > 0 && height > 0)
            {
                this.__render_hcell(writer, this.title, top, width, height);
            }

            if (this.resizable)
            {
                writer.push('<div class="flyingon-Grid-resize-column" style="position:absolute;overflow:hidden;z-index:1;background-color:transparent;width:5px;cursor:col-resize;left:'
                    + (this.left + width - 3)
                    + 'px;height:' + headerHeight
                    + 'px;" column-index="' + index
                    + '"></div>');
            }

            return width;
        }

        return 0;
    };


    this.__render_multiTitle = function (writer, columns, headerHeight) {

        var items = this.multiTitle,
            length = items.length,
            default_height = headerHeight / (length + (this.title != null ? 1 : 0)) >>> 0,
            top = 0;

        for (var i = 0; i < length; i++)
        {
            var item = items[i],
                height = item && item.height > 0 ? item.height : default_height,
                text;

            if (item != null && height > 0 && (text = this.render_multiTitle_text(item)) != null)
            {
                var width = this.visible ? this.width : 0;

                if (item.columnSpan > 1)
                {
                    for (var j = 1, _ = item.columnSpan; j < _; j++)
                    {
                        var column = columns[this.renderIndex + j];

                        if (column && column.visible)
                        {
                            width += column.width;
                        }
                    }
                }

                if (width > 0)
                {
                    this.__render_hcell(writer, text, top, width, height, item);
                }
            }

            top += height;
        }

        return top;
    };


    this.render_multiTitle_text = function (title) {

        return typeof title === 'string' ? title : title.text;
    };


    this.__render_hcell = function (writer, text, top, width, height, multiTitle) {

        var index = this.renderIndex,
            columnSpan = multiTitle && multiTitle.columnSpan || 0;

        writer.push('<div class="flyingon-Grid-hcell '
            + (this.selected ? 'flyingon-Grid-column-selected ' : '')
            + (this.headerClass || '')
            + '" style="position:absolute;overflow:hidden;margin:0;border-left:0;border-top:0;left:'
            + this.left + 'px;top:'
            + top + 'px;width:'
            + width + 'px;height:'
            + height + 'px;line-height:'
            + height + 'px;'
            + (columnSpan > 1 ? 'z-index:1;' : '')
            + '" column-index="' + index + '"'
            + (columnSpan > 1 ? ' column-end="' + (index + columnSpan - 1) + '"' : '')
            + '>');

        writer.push(this.render_hcell(text, multiTitle));

        writer.push('</div>');
    };


    this.render_hcell = function (text, multiTitle) {

        return text || '';
    };



    this.__render_data = function (writer, row) {

        writer.push(this.__render_cell(writer, row) + '</div>');
    };


    this.__render_cell = function (writer, row) {

        var cell = this.render_cell(row),
            className = 'flyingon-Grid-cell',
            width = this.width,
            height = row.height,
            attribute = ' column-index="' + this.renderIndex + '" row-index="' + row.renderIndex + '"',
            zIndex,
            style,
            cache;

        if (cache = this.cellClass)
        {
            className += ' ' + cache;
        }

        if (row.checked)
        {
            className += ' flyingon-Grid-row-checked';
        }

        if (row.selected)
        {
            className += ' flyingon-Grid-row-selected';
        }

        if (this.selected)
        {
            className += ' flyingon-Grid-column-selected';
        }

        if (cell != null)
        {
            if (typeof cell === 'object')
            {
                if (cache = cell.className)
                {
                    className += ' ' + cache;
                }

                if ((cache = cell.rowSpan) > 1)
                {
                    attribute += ' column-end="' + (this.renderIndex + cache - 1) + '"';

                    height *= cache;
                    zIndex = 1;
                }

                if ((cache = cell.columnSpan) > 1)
                {
                    attribute += ' row-end="' + (row.renderIndex + cache - 1) + '"';

                    width = this.__after_width(cache);
                    zIndex = 1;
                }

                if (cache = cell.attribute)
                {
                    attribute += ' ' + cell.attribute;
                }

                style = cell.style;
                cell = cell.text;
            }
        }
        else
        {
            style = 'visibility:hidden;';
        }

        writer.push('<div class="' + className
            + '" style="left:' + this.left
            + 'px;top:' + row.top
            + 'px;width:' + width
            + 'px;height:' + height
            + 'px;line-height:' + height
            + 'px;'
            + (this.align ? 'text-align:' + this.align + ';' : '')
            + (zIndex ? 'z-index:1;' : '')
            + (style || '')
            + '"'
            + attribute + '>');

        return cell || '';
    };


    this.render_cell = function (row) {

        var formatter = this.formatter,
            data = row.data,
            value = data && data[this.fieldName] || '';

        if (typeof formatter === 'function')
        {
            return formatter.call(this, value, row, this);
        }

        return value || '';
    };


    //获取排序函数
    this.sort = function (desc) {

        var name = this.fieldName,
            value1 = desc ? 'row2' : 'row1',
            value2 = desc ? 'row1' : 'row2',
            data;

        if (name)
        {
            value1 += '.data.' + name;
            value2 += '.data.' + name;

            if (this.dataType === 'number')
            {
                data = 'return ' + value1 + ' - ' + value2 + ';';
            }
            else
            {
                data = 'var value1 = ' + value1 + ', value2 = ' + value2 + ';\n'
                    + 'if (value1 == value2) return 0;\n'
                    + 'return value1 > value2 ? 1 : -1;';
            }

            return new Function(['row1', 'row2'], data);
        }
    };


    //获取后面指定列数的总宽度
    this.__after_width = function (length) {

        var columns = this.grid.__columns,
            start = this.renderIndex,
            end = start + length,
            width = 0,
            column;

        for (var i = start; i < end; i++)
        {
            if ((column = columns[i]) && column.visible)
            {
                width += column.width;
            }
        }

        return width;
    };


    this.__class_init = function (Class) {

        if (this !== self)
        {
            if (this.columnType)
            {
                registry_columns[this.columnType] = Class;
            }
            else
            {
                alert((Class.typeName || 'GridColumn') + ' must define "columnType"!');
            }
        }
    };


});



//行编号列
$class('RowNoGridColumn', flyingon.GridColumn, function (base) {


    //列类型
    this.columnType = 'rowno';

    //默认宽度
    this.width = 25;

    //指定单元格class
    this.cellClass = 'flyingon-Grid-rowno';

    //禁止编辑
    this.readonly = true;

    //禁止可调整列宽
    this.resizable = false;

    //禁止列头排序
    this.sortable = false;

    //禁止可操作列
    this.showOperate = false;

    //是否显示行号
    this.rowno = true;



    this.render_cell = function (row) {

        if (this.rowno)
        {
            var formatter = this.formatter,
                value = row.renderIndex + 1;

            if (formatter)
            {
                if (formatter === 'tree')
                {
                    value = row.treeIndex;
                }
                else if (typeof formatter === 'function')
                {
                    value = formatter.call(this, value, row, this);
                }
            }

            return value != null ? value : '';
        }
        else
        {
            return '';
        }
    };


});



//选择列
$class('CheckedGridColumn', flyingon.GridColumn, function (base) {


    //列类型
    this.columnType = 'checked';

    //默认宽度
    this.width = 25;

    //指定单元格class
    this.cellClass = 'flyingon-Grid-checked';

    //是否显示选中所有
    this.all = false;

    //禁止编辑
    this.readonly = true;

    //禁止可调整列宽
    this.resizable = false;

    //禁止列头排序
    this.sortable = false;

    //禁止可操作列
    this.showOperate = false;


    this.render_hcell = function (title, multiTitle) {

        return !multiTitle && this.all ? '<input type="checkbox" class="flyingon-gird-checked-all"></input>' : '';
    };


    this.render_cell = function (row) {

        return '<input type="checkbox"' + (row.checked ? ' checked="checked"' : '') + '></input>';
    };


    this.__on_cell_mousedown = function (e, cell) {

        var grid = this.grid,
            view = grid.__view,
            row;

        if (view && e.target.type === 'checkbox' && (row = view[cell.getAttribute('row-index') >>> 0]))
        {
            var items = view.checkedRows,
                list = view.find_row_cells(row),
                className = 'flyingon-Grid-row-checked';

            if (row.checked = !row.checked)
            {
                (items || (view.checkedRows = new Set())).add(row);
                list.addClass(className);
            }
            else
            {
                items && items['delete'](row);
                list.removeClass(className);
            }

            grid.trigger('checkedchange', row, cell);
            return false;
        }
    };

});



//仿excel的分组树列
$class('GroupGridColumn', flyingon.GridColumn, function (base) {


    //列类型
    this.columnType = 'group';

    //默认宽度(收拢时的宽度)
    this.width = 40;

    //指定单元格class
    this.cellClass = 'flyingon-Grid-grouptree';

    //禁止编辑
    this.readonly = true;

    //禁止可调整列宽
    this.resizable = false;

    //禁止列头排序
    this.sortable = false;

    //禁止可操作列
    this.showOperate = false;

    //最大级别
    this.maxLevel = 0;

    //默认展示级别
    this.expandLevel = 0;

    //是否展开
    this.expanded = false;

    //栏位宽度
    this.itemWidth = 16;

    //栏位高度
    this.itemHeight = 16;

    //是否显示行号
    this.rowno = true;

    //行号宽度
    this.rownoWidth = 40;


    this.render_hcell = function (text, multiTitle) {

        if (multiTitle || !this.expanded)
        {
            return text || '';
        }

        var data = [],
            left = 0,
            width = this.itemWidth,
            html = '<span class="flyingon-Grid-grouptree-level" style="display:inline-block;width:' + width + 'px;left:';

        for (var i = 1, _ = this.maxLevel; i <= _; i++)
        {
            data.push(html + left + 'px;">' + i + '</span>');
            left += width;
        }

        data.push('<span class="flyingon-Grid-groupno-title" style="display:inline-block;width:' + this.rownoWidth + 'px;">' + (text || '') + '</span>');
        return data.join('');
    };


    this.__render_data = function (writer, row) {

        writer.push(this.__render_cell(writer, row));

        if (this.rowno)
        {
            render_rowno.call(this, writer, row);
        }

        writer.push('</div>');
    };


    this.render_cell = function (row) {

        var data = [],
            text1 = '<span class="flyingon-Grid-grouptree-',
            text2 = '" style="display:inline-block;width:' + this.itemWidth + 'px;height:100%;" no-current="true"',
            target = row,
            cache;

        while (cache = target.parent)
        {
            data.unshift(text1 + 'line' + (target.next ? '' : ' flyingon-Grid-grouptree-line-last') + text2 + '></span>');
            target = cache;
        }

        if (row.children)
        {
            cache = row.expanded ? 'expand' : 'collapse';
            data.push(text1 + cache + text2 + ' tree-' + cache + '="true"></span>');
        }
        else
        {
            data.push(text1 + 'leaf' + text2 + '></span>');
        }

        return {
            text: data.join(''),
            attribute: 'no-current="true"'
        };
    };


    function render_rowno(writer, row) {

        var formatter = this.formatter,
            value;

        if (formatter)
        {
            if (formatter === 'tree')
            {
                value = row.treeIndex;
            }
            else if (typeof formatter === 'function')
            {
                value = formatter.call(this, value, row, this);
            }
        }
        else
        {
            value = row.renderIndex + 1;
        }

        if (value !== null)
        {
            var className = 'flyingon-Grid-groupno',
                style = 'display:inline-block;width:' + this.rownoWidth + 'px;',
                attribute = '';

            if (this.expanded)
            {
                className += ' flyingon-Grid-groupno-expand'
            }

            if (typeof value === 'object')
            {
                if (value.className)
                {
                    className += ' ' + value.className;
                }

                if (value.style)
                {
                    style += value.style;
                }

                if (value.attribute)
                {
                    attribute = value.attribute;
                }
            }

            writer.push('<span class="' + className + '" style="' + style + ';"' + attribute + '>');
            writer.push(value);
            writer.push('</span>')
        }
    };


});




//表格行
$class('GridRow', function () {


    $constructor(function (view, data) {

        this.view = view;
        this.data = data;
    });


    //是否选中
    this.checked = false;

    //是否选择
    this.selected = false;

    //行渲染索引
    this.renderIndex = -1;


    //获取行索引
    this.rowIndex = function () {

        if (this.renderIndex >= 0)
        {
            return this.renderIndex;
        }

        var view = this.view;

        for (var i = 0, _ = view.length; i < _; i++)
        {
            if (view[i] === this)
            {
                return i;
            }
        }

        return -1;
    };


});



//树形表格行
$class('TreeGridRow', flyingon.GridRow, function (base) {



    var splice = Array.prototype.splice;



    $constructor(function (view, data, level, childrenName) {

        var items;

        this.view = view;
        this.data = data;
        this.level = level;

        if (childrenName && (items = data[childrenName]))
        {
            var type = view.rowType,
                rows = this.children = [],
                row;

            level++;

            for (var i = 0, _ = items.length; i < _; i++)
            {
                row = new type(view, items[i], level, childrenName);
                row.parent = this;

                if (row.previous = rows[i - 1] || null)
                {
                    row.previous.next = row;
                }

                rows.push(row);
            }
        }

    }, true);



    //父级行
    this.parent = null;

    //前一个节点
    this.previous = null;

    //下一个节点
    this.next = null;

    //树级别
    this.level = 0;

    //是否展开
    this.expanded = false;



    //按级别展开节点
    function expand_level(items, rows, expandLevel) {

        if (expandLevel-- > 0)
        {
            for (var i = 0, _ = rows.length; i < _; i++)
            {
                var row = rows[i],
                    children = row.children;

                row.expanded = true;
                items.push(row);

                if (children && children.length > 0)
                {
                    expand_level(items, children, expandLevel);
                }
            }
        }
        else
        {
            items.push.apply(items, rows);
        }
    };


    //展开节点
    function expand(items, rows) {

        for (var i = 0, _ = rows.length; i < _; i++)
        {
            var row = rows[i],
                children;

            items.push(row);

            if (row.expanded && (children = row.children) && children.length > 0)
            {
                expand(items, children);
            }
        }
    };


    function collapse(self, collapse) {

        var view = self.view,
            index = self.rowIndex() + 1,
            level = self.level,
            length = view.length,
            item;

        self.expanded = false;

        for (var i = index; i < length; i++)
        {
            if (item = view[i])
            {
                if (item.level <= level)
                {
                    length = i - index;
                    break;
                }

                if (collapse)
                {
                    item.expanded = false;
                }

                if (item.renderIndex >= 0)
                {
                    item.renderIndex = -1;
                    view.end--;
                }
            }
        }

        if (length > 0)
        {
            splice.call(view, index, length);
        }
    };


    //那个当前行
    this.expand = function (expandLevel, render) {

        var view = this.view,
            grid = view.grid,
            rows,
            items;

        if ((expandLevel = expandLevel >>> 0) < 0)
        {
            expandLevel = 100;
        }

        if (this.expanded)
        {
            if (expandLevel > 0)
            {
                collapse(this, true);
            }
            else
            {
                return;
            }
        }

        grid.trigger('beforeexpand');

        if ((rows = this.children) && rows.length > 0)
        {
            items = [this.rowIndex() + 1, 0];

            if (expandLevel > 0)
            {
                expand_level(items, rows, expandLevel);
            }
            else
            {
                expand(items, rows);
            }

            splice.apply(view, items);
        }

        this.expanded = true;

        if (render !== false)
        {
            grid.render_data(true);
        }

        grid.trigger('expand');
    };


    //收拢当前行
    this.collapse = function (render) {

        if (this.expanded)
        {
            var grid = this.view.grid;

            collapse(this, false);

            if (render !== false)
            {
                this.view.fix_vscroll();
                grid.render_data(true);
            }

            grid.trigger('collapse');
        }
    };


    //获取节点及子节点总数
    this.count = function () {

        var children = this.children,
            length;

        if (children && (length = children.length) > 0)
        {
            var count = 1;

            for (var i = 0; i < length; i++)
            {
                count += children[i].count();
            }

            return count;
        }

        return 1;
    };


});




//表格视图
$class('GridView', function (base, self) {


    var registry_view = flyingon.create(null),
        push = Array.prototype.push,
        splice = Array.prototype.splice,
        sort = Array.prototype.sort;

    
    $static('all', registry_view);

    $constructor(function (grid, options) {

        this.grid = grid;

        if (options)
        {
            for (var name in options)
            {
                this[name] = options[name];
            }
        }
    });


    //视图类型
    this.viewType = null;

    //行高
    this.rowHeight = 28;

    //延迟加载最大行数
    this.delayMaxRows = 0;

    //表格行数量
    this.length = 0;

    //视图宽度
    this.width = 0;

    //视图高度
    this.height = 0;

    //行类型
    this.rowType = flyingon.GridRow;


    //当前表格行
    this.currentRow = null;

    //当前表格列
    this.currentColumn = null;

    //选中表格行
    this.checkedRows = null;


    //是否启用延迟加载行
    this.delayLoadRows = false;



    //获取默认视图
    this.defaultView = function () {

        return this;
    };


    //初始化视图数据
    this.init = function (data) {

        var type = this.rowType,
            length = this.length = data.length;

        for (var i = 0; i < length; i++)
        {
            this[i] = new type(this, data[i]);
        }
    };


    //延迟加载行
    this.loadRowsDelay = function (start, end) {

        var data = this.data,
            type = this.rowType;

        while (start < end)
        {
            if (!this[start])
            {
                this[start] = new type(this, data[start]);
            }

            start++;
        }
    };


    //批量添加表格行
    this.appendRows = function (data) {

        var length = data && data.length;

        if (length > 0)
        {
            var type = this.rowType,
                start = this.length;

            this.length += length;

            for (var i = 0; i < length; i++)
            {
                this[start + i] = new type(this, data[i]);
            }
        }
    };


    //查找指定位置的表格行
    this.findRowIndex = function (top) {

        return (top / this.rowHeight) >>> 0;
    };


    //排序
    this.sort = function (column, desc) {

        var fn;

        if (column && (fn = column.sort(desc)))
        {
            sort.call(this, fn);
        }
    };


    //渲染视图 //modify by yaozy 2016.01.20
    this.render = function (start, resize) {

        var date = new Date();

        var writer = [],
            grid = this.grid,
            body = grid.dom_body,
            columns = grid.__columns,
            rowHeight = this.rowHeight,
            lockedWidth = columns.lockedWidth,
            lockedBefore = columns.lockedBefore,
            width = columns.totalWidth - lockedWidth,
            height = Math.max(this.delayMaxRows, this.length) * rowHeight,
            scrollTop = grid.dom_vscroll.scrollTop,
            style = 'overflow:hidden;margin:0;border:0;padding:0;',
            style1 = 'position:absolute;' + style + 'height:100%;',
            style2 = 'position:relative;' + style + 'top:' + (-scrollTop) + 'px;height:' + height + 'px;width:';

        //记录视图大小
        this.width = columns.totalWidth;
        this.height = height;

        //如果是全局渲染
        if (grid.fullRender())
        {
            start = 0;
            this.end = this.length;
        }
        else
        {
            if (this.end > 0) //清除原渲染行的渲染索引
            {
                for (var i = this.start, _ = this.end; i < _; i++)
                {
                    this[i].renderIndex = -1;
                }
            }

            this.end = this.__render_end(start, scrollTop, grid.clientHeight - columns.headerHeight, rowHeight);
        }

        //记录渲染的开始及结束行号
        this.start = start;

        //如果启用了延迟加载行
        if (this.delayLoadRows)
        {
            this.loadRowsDelay(start, this.end);
        }

        //触发渲染前事件
        grid.trigger('beforerender');

        writer.view = this;
        writer.columns = columns;

        writer.push('<div class="flyingon-Grid-locked" style="' + style1 + '">');
        writer.push('<div style="' + style2 + lockedWidth + 'px;">');

        if (lockedBefore > 0)
        {
            this.__render_columns(writer, columns, 0, lockedBefore, rowHeight);
        }

        writer.push('</div>');
        writer.push('</div>');

        writer.push('<div class="flyingon-Grid-scroll" style="' + style1 + 'left:' + lockedWidth + 'px;">');
        writer.push('<div style="' + style2 + width + 'px;left:' + (-grid.dom_hscroll.scrollLeft) + 'px;">');

        this.__render_columns(writer, columns, lockedBefore, columns.length, rowHeight);

        writer.push('</div>');
        writer.push('</div>');

        writer.view = writer.columns = null;

        body.style.display = 'none';
        body.innerHTML = writer.join('');

        if (resize)
        {
            body.style.height = height + 'px';
            grid.render_scroll();
        }

        body.style.display = 'block';

        //触发渲染后事件
        grid.trigger('afterrender');

        console.log('render rows: ' + (this.end - start) + ' rows, time:' + (new Date() - date) + 'ms');
    };


    //获取渲染结束行 //add by yaozy 2016.01.20
    this.__render_end = function (start, top, height, rowHeight) {

        height += (top % rowHeight); //处理开始的行偏移避免有时渲染不出最后一行的问题
        return start + Math.min(this.length - start, Math.ceil(height / rowHeight));
    };


    //渲染视图列
    this.__render_columns = function (writer, columns, start, end, rowHeight) {

        var top = this.start * rowHeight;

        for (var i = this.start, _ = this.end; i < _; i++)
        {
            var row = this[i];

            row.top = top;
            row.height = rowHeight;
            row.renderIndex = i;

            this.render_row(writer, row, columns, start, end);

            top += rowHeight;
        }
    };


    //渲染视图行
    this.render_row = function (writer, row, columns, start, end) {

        var column;

        for (var i = start; i < end; i++)
        {
            if ((column = columns[i]) && column.visible && column.width > 0)
            {
                column.__render_data(writer, row);
            }
        }
    };


    //从指定的dom往上查找拥有指定className的dom
    this.find_dom = function (dom, className) {

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
    this.event_hcell = function (e) {

        return this.find_dom(e.target, 'flyingon-Grid-hcell');
    };


    //查找事件触发的单元格
    this.event_cell = function (e) {

        return this.find_dom(e.target, 'flyingon-Grid-cell');
    };


    //查找单元格
    this.find_cell = function (row, column) {

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
    this.find_row_cells = function (row, list) {

        var grid = this.grid,
            start = this.start,
            end = this.end,
            index = row >= 0 ? row : row.renderIndex;

        list = list || new flyingon.NodeList();

        if (index < start || index >= end)
        {
            return list;
        }

        var body = grid.dom_body,
            children = body.children[0].children[0].children,
            step = grid.__columns.locked_visible,
            offset = (index - start) * step;

        for (var i = 0; i < step; i++)
        {
            list.push(children[offset + i]);
        }

        children = body.children[1].children[0].children;
        step = grid.__columns.scroll_visible;
        offset = (index - start) * step;

        for (var i = 0; i < step; i++)
        {
            list.push(children[offset + i]);
        }

        return list;
    };


    //查找指定列索引的单元格
    this.find_column_cells = function (column, list, header, body) {

        var grid = this.grid,
            columns = grid.__columns,
            index = column >= 0 ? column : column.renderIndex,
            lockedBefore = columns.lockedBefore,
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
            children = grid.dom_head.children[index >= lockedBefore ? 1 : 0].children[0].children;
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

            children = grid.dom_body.children[index >= lockedBefore ? 1 : 0].children[0].children;

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
                step = columns.scroll_visible;
            }
            else
            {
                step = columns.locked_visible;
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


    //显示编辑器
    this.showEditor = function (cell, row, column, editor) {

        var grid = this.grid,
            dom = grid.dom_editor,
            left = cell.offsetLeft - 1,
            width = cell.offsetWidth + 1,
            style;

        if (!dom)
        {
            dom = grid.dom_editor = document.createElement('div');
            dom.className = 'flyingon-Grid-editor';
            dom.style.cssText = 'position:absolute;overflow:hidden;padding:0;';
        }

        grid.dom_body.appendChild(dom);

        style = dom.style;

        style.left = left + 'px';
        style.width = width + 'px';
        style.top = (cell.offsetTop - 1) + 'px';
        style.height = style.lineHeight = (cell.offsetHeight + 1) + 'px';

        if (dom.firstChild)
        {
            dom.removeChild(dom.firstChild);
        }

        editor = editor || column.editor || new flyingon.GridEditor();
        dom.appendChild(editor.dom);

        editor.dom.cell = cell;
        editor.init(cell.textContent || cell.innerText, cell);
    };


    //切换当前单元格
    this.__change_current = function (cell) {

        var grid = this.grid,
            //style = grid.dom_body.style,
            row1 = this.currentRow,
            row2 = this[cell.getAttribute('row-index') >>> 0],
            column1 = this.currentColumn,
            column2 = grid.__columns[cell.getAttribute('column-index') >>> 0],
            cache;

        //style.visibility = 'hidden';

        if (column1 !== column2 && grid.autoCurrentColumn())
        {
            cache = 'flyingon-Grid-column-selected';

            if (column1)
            {
                column1.selected = false;
                this.find_column_cells(column1).removeClass(cache);
            }

            column2.selected = true;

            this.currentColumn = column2;
            this.find_column_cells(column2).addClass(cache);
        }

        if (row1 !== row2 && grid.autoCurrentRow())
        {
            cache = 'flyingon-Grid-row-selected';

            if (row1)
            {
                row1.selected = false;
                this.find_row_cells(row1).removeClass(cache);
            }

            row2.selected = true;

            this.currentRow = row2;
            this.find_row_cells(row2).addClass(cache);
        }

        //style.visibility = '';
    };


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


    this.__class_init = function (Class) {

        if (this !== self)
        {
            if (this.viewType)
            {
                registry_view[this.viewType] = Class;
            }
            else
            {
                alert((Class.typeName || 'GridView') + '" must define "viewType"!');
            }
        }
    };


});



//树形表格视图
$class('TreeGridView', flyingon.GridView, function (base) {



    var splice = Array.prototype.splice,
        sort = Array.prototype.sort;


    //渲染成树的字段名
    this.treeFieldName = null;

    //子节点名称
    this.childrenName = 'children';

    //默认展开级别
    this.expandLevel = 0;

    //表格行类型
    this.rowType = flyingon.TreeGridRow;

    //注册的视图类型
    this.viewType = 'TreeGridView';

    //数据转换器
    this.converter = null;



    function convert_table(self, data, converter, childrenName) {

        var rows = [],
            keys = flyingon.create(null),
            id = converter.id || 'id',
            parentId = converter.parentId || 'parentId',
            rootValue = converter.rootValue || 0,
            length = data.length,
            item,
            parent;

        for (var i = 0; i < length; i++)
        {
            keys[(item = data[i])[id]] = item;
            item[childrenName] = null; //清除原有关系防止重复转换 add by yaozy 2016.01.28
        }

        for (var i = 0; i < length; i++)
        {
            id = (item = data[i])[parentId];

            if (id === rootValue || !(parent = keys[id]))
            {
                rows.push(item);
            }
            else
            {
                (parent[childrenName] || (parent[childrenName] = [])).push(item);
            }
        }

        return rows;
    };


    //按级别展开节点
    function expand_level(items, rows, expandLevel) {

        if (expandLevel-- > 0)
        {
            for (var i = 0, _ = rows.length; i < _; i++)
            {
                var row = rows[i],
                    children = row.children;

                row.expanded = true;
                items.push(row);

                if (children && children.length > 0)
                {
                    expand_level(items, children, expandLevel);
                }
            }
        }
        else
        {
            items.push.apply(items, rows);
        }
    };


    this.init = function (data) {

        var converter = this.converter,
            expandLevel = this.expandLevel >>> 0,
            type = this.rowType,
            name = this.childrenName,
            rows,
            row,
            items;

        if (converter)
        {
            if (typeof converter === 'function')
            {
                data = converter(data);
            }
            else if (!converter.type || converter.type === 'table')
            {
                data = convert_table(this, data, converter, this.childrenName);
            }
        }

        rows = new Array(data.length);

        for (var i = 0, _ = data.length; i < _; i++)
        {
            row = rows[i] = new type(this, data[i], 0, name);

            if (row.previous = rows[i - 1] || null)
            {
                row.previous.next = row;
            }
        }

        if (expandLevel)
        {
            if (expandLevel < 0)
            {
                expandLevel = 100;
            }

            items = [];
            expand_level(items, rows, expandLevel);
        }
        else
        {
            items = rows;
        }

        rows.push.apply(this, items);
    };


    //计算树编号
    this.compute_treeIndex = function () {

        var start = this.start,
            end = this.end,
            index = 1,
            row;

        //modified by yaozy 2016.01.28
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
        //end modify

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
                this.compute_treeIndex();
                break;
            }
        }

        base.__render_columns.apply(this, arguments);
    };


    this.render_row = function (writer, row, columns, start, end) {

        var treeFieldName = this.treeFieldName,
            column;

        for (var i = start; i < end; i++)
        {
            if ((column = columns[i]) && column.visible && column.width > 0)
            {
                if (treeFieldName === column.fieldName)
                {
                    render_tree_column(writer, row, column);
                }
                else
                {
                    column.__render_data(writer, row);
                }
            }
        }
    };


    function render_tree_column(writer, row, column) {

        var text = column.__render_cell(writer, row),
            children = row.children,
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

        writer.push('<span class="flyingon-Grid-tree-cell">' + text + '</span></div>');
    };


    //修改竖直滚动条因收拢不足一屏时而造成的位置偏移
    this.fix_vscroll = function () {

        if (this.start > 0)
        {
            var grid = this.grid,
                height = Math.max(this.delayMaxRows, this.length) * this.rowHeight;

            if (!grid.__check_scroll(this.width, height)[1])
            {
                grid.dom_vscroll.scrollTop = 0;
                return true;
            }
        }
    };


    this.__on_expand = function (e) {

        var index = e.target.parentNode.getAttribute('row-index') >>> 0;
        this[index].expand();
    };


    this.__on_collapse = function (e) {

        var index = e.target.parentNode.getAttribute('row-index') >>> 0;
        this[index].collapse();
    };


    this.defaultView = function () {

        var rows = [],
            row;

        for (var i = 0, _ = this.length; i < _; i++)
        {
            if ((row = this[i]) && row.level <= 0)
            {
                rows.push(row);
            }
        }

        return rows;
    };


    this.expand = function (expandLevel) {

        //先收拢
        this.collapse(true);

        //再展开
        for (var i = this.length - 1; i >= 0; i--)
        {
            this[i].expand(expandLevel, false);
        }
    };


    this.collapse = function (collapse) {

        var index = 0,
            length = this.length,
            row;

        for (var i = 0; i < length; i++)
        {
            if (row = this[i])
            {
                if (row.level > 0)
                {
                    if (row.renderIndex >= 0)
                    {
                        row.renderIndex = -1;
                        this.end--;
                    }
                }
                else
                {
                    this[index++] = row;

                    if (collapse)
                    {
                        row.expanded = false;
                    }
                }
            }
        }

        if (length -= index)
        {
            splice.call(this, index, length);
        }
    };


    function expand_sort(items, rows, fn, push) {

        var row, children;

        sort.call(rows, fn);

        for (var i = 0, _ = rows.length; i < _; i++)
        {
            if (row = rows[i])
            {
                if (push)
                {
                    items.push(row);
                }

                if ((children = row.children) && children.length > 0)
                {
                    expand_sort(items, children, fn, push && row.expanded);
                }
            }
        }
    };


    this.sort = function (column, desc) {

        var fn;

        if (column && (fn = column.sort(desc)))
        {
            var items = [0, this.length];

            //先收拢再排序
            this.collapse();

            //排序展开
            expand_sort(items, this, fn, true);

            //用新表格行替换原有表格行
            splice.apply(this, items);
        }
    };


});




//表格控件
$class('Grid', flyingon.Control, function (base) {



    var contextmenu, //弹出菜单
        tip; //弹出提醒



    $constructor(function () {

        var self = this,
            on = flyingon.dom_on,
            dom = this.dom,
            children = dom.children,
            head,
            body,
            hscroll,
            vscroll;

        if (!tip)
        {
            contextmenu = new flyingon.PopupLayer(false).multi(true).closeAway(true);
            contextmenu.dom.className += ' flyingon-Grid-contextmenu';

            tip = new flyingon.PopupLayer(false).multi(true);
            tip.dom.className += ' flyingon-Grid-tip';
        }

        this.dom_head_back = children[0];
        this.dom_head = head = children[1];
        this.dom_body = body = children[2];
        this.dom_resize = children[3];
        this.dom_end = children[4];
        this.dom_hscroll = hscroll = children[5];
        this.dom_vscroll = vscroll = children[6];
        this.dom_sort = children[7];
        this.dom_pager = children[8];

        on(hscroll, 'scroll', function (e) {

            var style1 = head.children[1].children[0].style,
            style2 = body.children[1],
            dom = self.dom_sort;

            style2 = style2 ? style2.children[0].style : style1;
            style1.left = style2.left = -this.scrollLeft + 'px';

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
                var style1 = body.children[0].children[0].style,
                style2 = body.children[1].children[0].style;

                style1.top = style2.top = -this.scrollTop + 'px';
            }
            else
            {
                render_data(self);
            }
        });

        on(head, 'mouseover', function (e) {

            on_head_mouseover(self, e);
        });

        on(head, 'mousedown', function (e) {

            on_head_mousedown(self, e);
        });

        on(head, 'click', function (e) {

            on_head_click(self, e);
        });

        on(head, 'mouseout', function (e) {

            on_mouseout(self, e, this);
        });

        on(body, 'mouseover', function (e) {

            on_body_mouseover(self, e);
        });

        on(body, 'mousedown', function (e) {

            on_body_mousedown(self, e);
        });

        on(body, 'click', function (e) {

            on_body_click(self, e);
        });

        on(body, 'mouseout', function (e) {

            on_mouseout(self, e, this);
        });

        on(body, 'keydown', function (e) {

            on_body_keyup(self, e);
        });

        on(dom, 'mousewheel', function (e) {

            vscroll.scrollTop -= event.wheelDelta || (-event.detail * 40);//鼠标滚轮数据
        });

        on(dom, 'mouseout', function (e) {

            on_mouseout(self, e, this);
        });

    });




    this.createDomTemplate(('<div class="flyingon-Grid" style="position:relative;overflow:hidden;border-width:1px;">'
            + '<div class="flyingon-Grid-header-back" style="position:absolute;left:0;top:0;right:0;width:auto;border-left:0;border-top:0;border-right:0;"></div>'
            + '<div class="flyingon-Grid-header" style="style-1;"></div>'
            + '<div class="flyingon-Grid-body" style="style-1;outline:none;" tabindex="0"></div>'
            + '<div class="flyingon-Grid-resize" style="style-2;z-index:1;display:none;height:100%;"></div>'
            + '<div class="flyingon-Grid-end" style="style-2;z-index:1;width:vscroll_width;height:hscroll_height;left:auto;top:auto;overflow:scroll;"></div>'
            + '<div class="flyingon-Grid-hscroll" style="style-2;overflow-x:scroll;overflow-y:hidden;z-index:1;left:0;top:auto;width:auto;height:hscroll_height;">scroll_length</div>'
            + '<div class="flyingon-Grid-vscroll" style="style-2;overflow-x:hidden;overflow-y:scroll;z-index:1;left:auto;top:0;width:vscroll_width;height:auto;">scroll_length</div>'
            + '<div class="flyingon-Grid-sort" style="position:absolute;display:none;z-index:1;"></div>'
            + '<div class="flyingon-Grid-pager" style="style-2;overflow:hidden;display:none;width:100%;"></div>'
        + '</div>')
        .replace(/style-1/g, 'position:relative;overflow:hidden;margin:0;border:0;padding:0')
        .replace(/style-2/g, 'position:absolute;display:none;margin:0;right:0;bottom:0')
        .replace(/scroll_length/g, '<div style="overflow:hidden;margin:0;border:0;padding:0;width:1px;height:1px;"></div>')
        .replace(/hscroll_height/g, flyingon.hscroll_height + 'px')
        .replace(/vscroll_width/g, flyingon.vscroll_width + 'px'));



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

    //数据源
    this.defineProperty('dataSource', null, {

        storage: 'this.__dataSource',
        set: 'this.__init_dataSource(value);'
    });

    //是否只读
    this.defineProperty('readonly', true); //modified by yaozy 2016.01.20

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

    //分页参数
    //this.defineProperty('pager', null);


    //检测列操作
    function check_operate(self, e) {

        var dom = self.dom_head.children[2],
            style = dom.style,
            view = self.__view,
            cell;

        if (view && e && (cell = view.event_hcell(e)))
        {
            var index = cell.getAttribute('column-index') >>> 0,
                column = self.__columns[index],
                parent = cell.parentNode;

            if (column && column.showOperate)
            {
                dom.setAttribute('column-index', index);

                style.display = 'block';
                style.top = (cell.offsetTop + 1) + 'px';
                style.left = (parent.parentNode.offsetLeft + parent.offsetLeft + column.left + 2) + 'px';
                style = null;
            }
        }

        if (style)
        {
            style.display = 'none';
        }
    };


    //显示操作指引
    function showOperate(self, e) {

        var columns = self.__columns,
            dom = e.target,
            index = dom.getAttribute('column-index') >>> 0;

        if (columns && index >= 0)
        {
            var writer = [],
            menu = contextmenu,
            column;

            menu.close('auto');

            for (var i = 0, _ = columns.length; i < _; i++)
            {
                if ((column = columns[i]).showOperate)
                {
                    writer.push('<div class="flyingon-Grid-contextmenuitem"><input type="checkbox"' + (column.visible ? ' checked="true"' : '') + ' column-index="' + i + '"></input>' + column.title + '</div>')
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

        if (index != null && (column = columns[index >>> 0]))
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
                    if ((cache = columns[i]) && cache.visible && cache.width > 0 && cache.showOperate)
                    {
                        visible = true;
                        break;
                    }
                }
            }

            if (visible)
            {
                self.render_header();
                self.render_data();
                self.render_scroll();
            }
            else
            {
                column.visible = true;
                alert('unable to hide all columns!');
            }
        }
    };


    //处理列头鼠标移入事件
    function on_head_mouseover(self, e) {

        var name = e.target.className;

        if (name && !self.__column_resize && name.indexOf('flyingon-Grid-operate') < 0)
        {
            check_operate(self, e);
        }
    };


    //处理列头鼠标按下事件
    function on_head_mousedown(self, e) {

        var name = e.target.className;

        if (name && name.indexOf('flyingon-Grid-resize-column') >= 0)
        {
            var dom = e.dom = self.dom_resize,
                style = dom.style,
                target = e.target,
                parent = target.parentNode,
                column = self.__columns[target.getAttribute('column-index') >>> 0],
                context = {

                    style: style,
                    grid: self,
                    column: column
                };

            style.left = (parent.parentNode.offsetLeft + parent.offsetLeft + column.left + column.width - 2) + 'px';
            style.display = 'block';

            flyingon.dom_drag(context, e, null, null, resize_end, 'y', false);
        }
    };


    //停止调整列宽
    function resize_end(e) {

        var self = this.grid,
            column = this.column,
            style = this.style,
            distanceX = e.distanceX;

        self.__column_resize = false;
        style.display = 'none';

        if (distanceX)
        {
            if (distanceX < -column.width)
            {
                distanceX = -column.width;
            }

            column.width += distanceX;

            self.render_header();
            self.render_data();
            self.render_scroll();

            //调整滚动条位置
            if (distanceX < 0 && (style = self.dom_hscroll.style).display === 'none')
            {
                //设置滚动位置
                style.display = 'block';
                self.dom_hscroll.scrollLeft = 0;
                style.display = 'none';

                grid.dom_head.children[1].children[0].style.left = '0';
                grid.dom_body.children[1].children[0].style.left = '0';
            }

            if (self.dom_sort.column_index >= column.renderIndex)
            {
                self.dom_sort.style.left = (self.dom_sort.offset_left += distanceX) + 'px';
            }
        }

        this.grid = this.column = this.style = null;
    };


    //处理列头点击事件
    function on_head_click(self, e) {

        var name = e.target.className,
            view,
            cell,
            column;

        if (name && name.indexOf('flyingon-Grid-operate') >= 0)
        {
            showOperate(self, e);
        }
        else if ((view = self.__view) &&
            (cell = view.event_hcell(e)) &&
            (cell.getAttribute('column-end') == null) &&
            (column = self.__columns[cell.getAttribute('column-index') >>> 0]))
        {
            var dom = self.dom_sort,
                parent = cell.parentNode,
                style = dom.style,
                cache;

            if (column.sortable && (cache = parent.parentNode))
            {
                view.sort(column, column.desc = !column.desc);

                style.display = 'block';

                dom.column_index = column.renderIndex;
                dom.offset_left = cache.offsetLeft + parent.offsetLeft + column.left + cell.offsetWidth - dom.offsetWidth - 2;

                style.top = (cell.offsetTop + ((cell.offsetHeight - dom.offsetHeight) >> 1)) + 'px';
                style.left = dom.offset_left + 'px';

                dom.className = 'flyingon-Grid-sort flyingon-Grid-' + (column.desc ? 'desc' : 'asc');

                //如果是滚动列则记下滚动条位置以便拖动时调整偏移
                if (cache && (cache = cache.className) && cache.indexOf('flyingon-Grid-scroll') >= 0)
                {
                    dom.scroll_left = self.dom_hscroll.scrollLeft;
                }
                else
                {
                    dom.scroll_left = -1;
                }

                render_data(self);
            }
            else
            {
                style.display = 'none';
            }
        }
    };


    //处理表格体鼠标移入事件
    function on_body_mouseover(self, e) {

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
            if (tip && view && (cell = view.event_cell(e)) &&
                self.trigger('cellmouseover', e, cell) !== false &&
                cell.scrollWidth > cell.clientWidth &&
                (text = cell.textContent || cell.innerText))
            {
                tip.dom['textContent' in cell ? 'textContent' : 'innerText'] = text;
                tip.open(cell);
            }
        }
        catch (e)
        {
        }
    };


    //处理表格体鼠标按下事件
    function on_body_mousedown(self, e) {

        var view, cell, column;

        if ((e.which === 1 || e.button === 1) &&
            (view = self.__view) &&
            (cell = view.event_cell(e)) &&
            (column = self.__columns[cell.getAttribute('column-index') >>> 0]))
        {
            if (!e.target.getAttribute('no-current') &&
                (!column.__on_cell_mousedown || column.__on_cell_mousedown(e, cell) !== false))
            {
                view.__change_current(cell);
            }

            if (!column.readonly && !self.readonly())
            {
                var row = view[cell.getAttribute('row-index') >>> 0],
                    event = new flyingon.Event('beforeedit');

                if (self.trigger(event, column, row) !== false)
                {
                    view.showEditor(cell, row, column, event.editor);
                }
            }
        }
    };


    //处理单元格点击事件
    function on_body_click(self, e) {

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
            else if (cell = view.event_cell(e))
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
    function on_body_keyup(self, e) {

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
    function on_mouseout(self, e, dom) {

        if (self.trigger('cellmouseout', e) !== false)
        {
            var rect = dom.getBoundingClientRect(),
                x = e.clientX,
                y = e.clientY;

            if (x <= rect.left || y <= rect.top || x >= rect.right || y >= rect.bottom)
            {
                if (dom === self.dom_head)
                {
                    dom.children[2].style.display = 'none';
                }
            }
        }
    };


    //获取事件触发相关的表格行
    this.getEventRow = function (e) {

        var view = this.__view,
            cell;

        if (view && (cell = view.event_cell(e)))
        {
            return view[cell.getAttribute('row-index') >>> 0];
        }
    };


    //获取事件触发相关的表格列
    this.getEventColumn = function (e) {

        var columns = this.__columns,
            view = this.__view,
            cell;

        if (columns && view && (cell = view.event_cell(e) || view.event_hcell(e)))
        {
            return columns[cell.getAttribute('column-index') >>> 0];
        }
    };


    //关闭提醒信息
    this.closeTip = function () {

        tip && tip.close();
        return this;
    };


    //初始化列集合
    this.__init_columns = function (options) {

        var Class = flyingon.GridColumn,
            list = Class.all,
            columns = [],
            columnType,
            cache;

        if (this.__columns)
        {
            this.__dispose_columns();
        }

        for (var i = 0, _ = options.length; i < _; i++)
        {
            if (cache = options[i])
            {
                columns.push(new ((columnType = cache.columnType) && list[columnType] || Class)(this, cache));
            }
        }

        columns.__init = true;

        this.__columns = columns;
    };


    this.update = function () {

        var date = new Date();

        this.render();

        if (this.__columns)
        {
            this.render_header();

            if (this.__dataSource)
            {
                this.render_data(true);
            }
            else
            {
                //先记录下窗口的大小
                this.clientWidth = this.dom.clientWidth;
                this.clientHeight = this.dom.clientHeight;

                this.render_scroll();
            }
        }

        console.log('update:' + (new Date() - date));

        return this;
    };



    //渲染头
    function render_header(self, columns) {

        var writer = [],
            lockedBefore = columns.lockedBefore,
            lockedWidth = columns.lockedWidth,
            totalWidth = columns.totalWidth,
            headerHeight = columns.headerHeight,
            style1 = 'overflow:hidden;margin:0;padding:0;height:' + headerHeight + 'px;width:',
            style2 = 'position:absolute;border:0;' + style1;

        writer.push('<div class="flyingon-Grid-locked" style="' + style2 + lockedWidth + 'px;left:0;">');
        writer.push('<div style="position:relative;border:0;' + style1 + lockedWidth + 'px;">');

        if (lockedBefore > 0)
        {
            render_columns_header(writer, columns, 0, lockedBefore, headerHeight);
        }

        writer.push('</div>');
        writer.push('</div>');

        totalWidth -= lockedWidth;

        writer.push('<div class="flyingon-Grid-scroll" style="' + style2 + totalWidth + 'px;left:' + lockedWidth + 'px;">');
        writer.push('<div style="position:relative;border:0;' + style1 + totalWidth + 'px;left:' + (-self.dom_hscroll.scrollLeft) + 'px;">');

        render_columns_header(writer, columns, lockedBefore, columns.length, headerHeight);

        writer.push('</div>');
        writer.push('</div>');

        writer.push('<div class="flyingon-Grid-operate" style="position:absolute;display:none;z-index:1;"></div>');

        return writer.join('');
    };


    function render_columns_header(writer, columns, start, end, headerHeight) {

        var left = 0;

        for (var i = start; i < end; i++)
        {
            left += columns[i].__render_header(writer, columns, i, left, headerHeight);
        }
    };


    //渲染表头
    this.render_header = function () {

        var columns = this.__columns;

        if (columns && columns.length > 0)
        {
            var date = new Date();

            var head = this.dom_head,
                style = head.style,
                lockedBefore = this.lockedBefore(), //锁定列
                totalWidth = 0,
                lockedWidth = 0,
                visible1 = 0,
                visible2 = 0,
                column,
                width;

            //计算锁定列宽
            for (var i = 0, _ = columns.length; i < _; i++)
            {
                if ((column = columns[i]) && column.visible && column.width > 0)
                {
                    if (i < lockedBefore)
                    {
                        visible1++;
                        lockedWidth += column.width;
                    }
                    else
                    {
                        visible2++;
                    }

                    totalWidth += column.width;
                }
            }

            columns.locked_visible = visible1; //锁定列可见列数
            columns.scroll_visible = visible2; //非锁定列的可见列数

            columns.lockedBefore = lockedBefore;
            columns.lockedWidth = lockedWidth; //锁定列宽
            columns.totalWidth = totalWidth; //滚动列宽

            columns.headerHeight = this.headerHeight(); //列头高度

            style.display = 'none';

            //设置总宽高
            style.width = columns.totalWidth + 'px'; //modified by yaozy 2016.01.20
            style.height = this.dom_head_back.style.height = columns.headerHeight + 'px';

            //渲染列头
            head.innerHTML = columns.headerHeight > 0 ? render_header(this, columns) : '';

            style.display = 'block';

            console.log('render columns: ' + columns.length + ' columns, time:' + (new Date() - date) + 'ms');
        }

        return this;
    };


    //初始化数据源
    this.__init_dataSource = function (data) {

        var view = this.__view,
            columns = this.__columns;

        if (view && view.data && view instanceof flyingon.GridView)
        {
            view.clear();
        }

        if (columns && columns.headerHeight >= 0 && this.dom.parentNode)
        {
            //重置滚动条 add by yaozy 2016.01.28
            if (this.dom_vscroll.scrollTop)
            {
                this.dom_vscroll.scrollTop = 0;
            }
            //end add

            this.render_data(true);
        }
    };


    //初始化视图
    this.__init_view = function (value) {

        var GridView = flyingon.GridView,
            view = this.__view;

        if (view instanceof GridView)
        {
            view.clear();
            view.grid = this.__view = null;
        }

        if (value != null)
        {
            if (typeof value === 'string')
            {
                this.__view = new (GridView.all[value] || GridView)(this);
            }
            else
            {
                this.__view = new (GridView.all[value.viewType] || GridView)(this, value);
            }
        }

        return this;
    };


    function render_data(self, resize) {

        var view = self.__view || (self.__view = new flyingon.GridView(self)),
            columns = self.__columns,
            data = self.__dataSource || [],
            scrollTop = self.dom_vscroll.scrollTop,
            start = view.findRowIndex(scrollTop);

        //先记录下窗口的大小
        self.clientWidth = self.dom.clientWidth;
        self.clientHeight = self.dom.clientHeight;

        self.dom_body.style.height = (self.clientHeight - (columns && columns.headerHeight || 0)) + 'px'; //add by yaozy 2016.01.20

        if (view.data !== data)
        {
            view.data = data;
            view.init(data);
        }

        //启用了延迟分包加载
        if (view.delayMaxRows > data.length && start > data.length)
        {
            self.trigger('delayload', function (rows) {

                if (items && items.length > 0)
                {
                    view.appendRows(rows);
                    view.render(start);

                    if (resize)
                    {
                        //delete by yaozy 2016.01.20
                        self.render_scroll();
                    }
                }
                else if (!view.length)
                {
                    load_empty(self);
                }
            });
        }
        else if (view.length > 0)
        {
            view.render(start);

            if (resize)
            {
                //delete by yaozy 2016.01.20
                self.render_scroll();
            }
        }
        else
        {
            load_empty(self);
        }
    };


    function load_empty(self) {

        if (self.__view)
        {
            self.__view.height = 0;
        }

        self.dom_body.style.height = '0';
        self.render_scroll();

        self.trigger('emptydata');
    };


    //渲染数据
    this.render_data = function (resize) {

        render_data(this, resize);
        return this;
    };



    //检测滚动条
    this.__check_scroll = function (width, height) {

        var style1 = this.dom_head.style,
            style2 = this.dom_body.style,
            clientWidth = this.clientWidth,
            clientHeight = this.clientHeight,
            hscroll = 0,
            vscroll = 0;

        if (width > clientWidth)
        {
            hscroll = flyingon.hscroll_height;
        }

        if (height > clientHeight - this.__columns.headerHeight - hscroll)
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
    this.render_scroll = function () {

        var date = new Date();

        var columns = this.__columns,
            view = this.__view,
            hscroll_style = this.dom_hscroll.style,
            vscroll_style = this.dom_vscroll.style,
            end_style = this.dom_end.style;

            var width = view && view.width || columns.totalWidth,
            height = view && view.height || 0,
            scroll = this.__check_scroll(width, height),
            hscroll = scroll[0],
            vscroll = scroll[1];

        if (hscroll > 0)
        {
            hscroll_style.display = 'block';
            this.dom_hscroll.children[0].style.width = (width + (vscroll > 0 ? 1 : 0)) + 'px';
        }
        else
        {
            hscroll_style.display = 'none';
        }

        if (vscroll > 0)
        {
            vscroll_style.display = 'block';
            vscroll_style.top = (columns && columns.headerHeight || 0) + 'px';
            vscroll_style.bottom = (hscroll > 0 ? hscroll - 2 : 0) + 'px';

            this.dom_vscroll.children[0].style.height = (height + (hscroll > 0 ? 1 : 0)) + 'px';
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


    //获取默认视图
    this.defaultView = function () {

        return this.__view && this.__view.defaultView();
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
                    view.find_row_cells(row, list);
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
                    view.find_row_cells(row, list);
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
                view.find_row_cells(cache).removeClass(className);
            }

            if (row)
            {
                row.selected = true;

                view.currentRow = row;
                view.find_row_cells(row).addClass(className);
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
                view.find_column_cells(cache).removeClass(className);
            }

            if (column)
            {
                column.selected = true;

                view.currentColumn = column;
                view.find_column_cells(column).addClass(className);
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

            this.dom_vscroll.scrollTop = view.rowHeight * index;
        }

        return this;
    };


    //展开树节点
    this.expand = function (expandLevel) {

        var view = this.__view;

        if (view)
        {
            view.expand();
            render_data(this, true);
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

            render_data(this, true);
        }

        return this;
    };


    //销毁列集合
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


    //销毁
    this.dispose = function () {

        var view = this.__view,
            off = flyingon.dom_off;

            off(this.dom_hscroll);
            off(this.dom_vscroll);
            off(this.dom_head);
            off(this.dom_body);
            off(this.dom);

        if (view)
        {
            if (view instanceof flyingon.GridView)
            {
                view.clear();
                view.grid = null;
            }

            this.__view = null;
        }

        this.__dispose_columns();

        return base.dispose.call(this);
    };


});



