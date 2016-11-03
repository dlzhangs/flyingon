

//表格列基类
$class('GridColumn', function () {

    
    
    //更新表格头
    var update_header = { set: 'this.grid.renderDelay();' };
    
    //更新数据
    var update_body = { set: 'this.grid.renderDelay(false);' };
    
    
    
    //列类型
    this.type = '';

    
    //绑定的字段名
    this.defineProperty('fieldName', '', update_body);

    //数据类型
    this.defineProperty('dataType', 'string', update_body);

    //标题 值为数组则为多行标题
    this.defineProperty('title', '', update_header); 

    //对齐方式
    this.defineProperty('align', '', update_header);

    //列宽(水平绘制时有效)
    this.defineProperty('width', 100, {
     
        set: 'this.grid.renderDelay();'
    });
    
    //列高(竖直绘制时有效)
    this.defineProperty('height', '100', {
     
        set: 'this.grid.renderDelay();'
    });

    //单元格class
    this.defineProperty('cellClass', '', update_header);

    //是否可见
    this.defineProperty('visible', true, update_header);

    //是否只读
    this.defineProperty('readonly', false, update_body);

    //是否可调整列宽
    this.defineProperty('resizable', true, update_header);

    //是否可排序
    this.defineProperty('sortable', true, update_header);

    //是否降序排列
    this.defineProperty('desc', false, update_header);

    //是否可操作列
    this.defineProperty('showOperate', true, update_header);

    //格式化
    this.defineProperty('formatter', null, update_header);

    
    //left
    this.left = 0;

    //列索引
    this.index = -1;

    //是否选择
    this.selected = false;



    //渲染列头
    this.renderHeader = function (writer, columns, index, left, headerHeight) {

        var storage = this.__storage,
            title = storage.title || '',
            top = 0,
            width = storage.width,
            height = headerHeight;

        this.left = left;
        this.renderIndex = index;

        //渲染多行列
        if (typeof title !== 'string' && title.length > 1)
        {
            top = render_multi(this, title, writer, columns, headerHeight);
            height -= top;
            title = title[title.length - 1];
        }

        if (storage.visible)
        {
            if (width > 0 && height > 0)
            {
                title = this.titleText = this.headerText(title && title.text || title);
                render_header(this, writer, title, top, width, height);
            }

            if (storage.resizable)
            {
                writer.push('<div class="flyingon-Grid-resize-column" style="position:absolute;overflow:hidden;z-index:1;background-color:transparent;width:5px;cursor:col-resize;left:',
                    this.left + width - 3,
                    'px;height:' + headerHeight,
                    'px;" column-index="' + index,
                    '"></div>');
            }

            return width;
        }

        return 0;
    };

    
    //渲染多行列
    function render_multi(target, list, writer, columns, headerHeight) {

        var top = 0,
            length = list.length,
            size = headerHeight / (length--) | 0,
            storage,
            item,
            column,
            text,
            width,
            height,
            columnSpan;
        
        for (var i = 0; i < length; i++)
        {
            if ((item = list[i]) != null)
            {
                if (typeof item === 'string')
                {
                    text = item;
                    height = size;
                }
                else
                {
                    text = item.text;
                    height = item.height || size;
                }
                
                if (text != null)
                {
                    storage = target.__storage;
                    width = storage.visible ? storage.width : 0;

                    if ((columnSpan = item.columnSpan) > 1)
                    {
                        for (var j = 1; j < columnSpan; j++)
                        {
                            if ((column = columns[target.renderIndex + j]) && 
                                (storage = column.__storage) && storage.visible)
                            {
                                width += storage.width;
                            }
                        }
                    }

                    if (width > 0 && height > 0)
                    {
                        text = target.headerText(text, item);
                        render_header(target, writer, text, top, width, height, columnSpan);
                    }
                }
            }

            top += height;
        }

        return top;
    };


    function render_header(target, writer, text, top, width, height, columnSpan) {

        var storage = target.__storage,
            index = target.renderIndex;

        writer.push('<div class="flyingon-Grid-hcell ',
            storage.selected ? 'flyingon-Grid-column-selected ' : '',
            '" style="position:absolute;overflow:hidden;margin:0;border-left:0;border-top:0;left:',
            target.left, 'px;top:',
            top, 'px;width:',
            width, 'px;height:',
            height, 'px;line-height:',
            height, 'px;',
            '" column-index="', index + '"',
            columnSpan > 1 ? ' column-end="' + (index + columnSpan - 1) + '"' : '',
            '>',
            text,
            '</div>');
    };


    //获取列头内容
    this.headerText = function (text, multi) {

        return text || '';
    };


    //渲染列内容
    this.renderBody = function (writer, columns, row, fn, end) {

        var cell = this.renderCell(row),
            text = typeof cell === 'string' ? cell : cell && cell.text;
        
        renderBody(this, writer, columns, cell, row);
        
        if (fn)
        {
            fn(writer, this, row, text);
        }
        else if (text)
        {
            writer.push(text);
        }
        
        if (end !== false)
        {
            writer.push('</div>');
        }
    };


    function renderBody(target, writer, columns, cell, row) {

        var storage = target.__storage,
            className = 'flyingon-Grid-cell',
            width = storage.width,
            height = row.height,
            attribute = ' column-index="' + target.renderIndex + '" row-index="' + row.renderIndex + '"',
            zIndex,
            style,
            cache;

        if (cache = storage.cellClass)
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

        if (storage.selected)
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
                    attribute += ' column-end="' + (target.renderIndex + cache - 1) + '"';

                    height *= cache;
                    zIndex = 1;
                }

                if ((cache = cell.columnSpan) > 1)
                {
                    attribute += ' row-end="' + (row.renderIndex + cache - 1) + '"';

                    width = target.columnWidth(columns, cache);
                    zIndex = 1;
                }

                if (cache = cell.attribute)
                {
                    attribute += ' ' + cell.attribute;
                }

                style = cell.style;
            }
        }
        else
        {
            style = 'visibility:hidden;';
        }

        writer.push('<div class="', className,
            '" style="left:', target.left,
            'px;top:', row.top,
            'px;width:', width,
            'px;height:', height,
            'px;line-height:', height,
            'px;',
            (cache = storage.align) ? 'text-align:' + cache + ';' : '',
            zIndex ? 'z-index:1;' : '',
            style || '',
            '"',
            attribute, 
            '>');
    };


    //渲染单元格
    this.renderCell = function (row) {

        var storage = this.__storage,
            formatter = storage.formatter,
            value = row.dataRow.get(storage.fieldName) || '';

        if (typeof formatter === 'function')
        {
            return formatter.call(this, value, row, this);
        }

        return value || '';
    };


    //获取排序函数
    this.sort = function (desc) {

        var storage = this.__storage,
            name = storage.fieldName,
            value1 = desc ? 'row2' : 'row1',
            value2 = desc ? 'row1' : 'row2',
            data;

        if (name)
        {
            value1 += '.data.' + name;
            value2 += '.data.' + name;

            if (storage.dataType === 'number')
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


    //获取指定列后指定行数的总宽度
    this.columnWidth = function (columns, length) {

        var start = this.renderIndex,
            end = start + length,
            width = 0,
            column,
            storage;

        for (var i = start; i < end; i++)
        {
            if ((column = columns[i]) && (storage = column.__storage) && storage.visible)
            {
                width += storage.width;
            }
        }

        return width;
    };

    

    var columns;
    
    this.__class_init = function (Class) {

        if (columns)
        {
            if (this.type)
            {
                columns[this.type] = Class;
            }
            else
            {
                throw $translate('flyingon', 'GridColumn_type_error');
            }
        }
        else
        {
            Class.all = columns = flyingon.create(null);
        }
    };

    

});



//行编号列
$class(flyingon.GridColumn, function (base) {


    //列类型
    this.type = 'rowno';

    
    //默认宽度
    this.defaultValue('width', 25);

    //指定单元格class
    this.defaultValue('cellClass', 'flyingon-Grid-rowno');

    //禁止编辑
    this.defaultValue('readonly', true);

    //禁止可调整列宽
    this.defaultValue('resizable', false);

    //禁止列头排序
    this.defaultValue('sortable', false);

    //禁止可操作列
    this.defaultValue('showOperate', false);

                      
    //是否显示行号
    this.defineProperty('rowno', true);



    this.renderCell = function (row) {

        var storage = this.__storage;
        
        if (storage.rowno)
        {
            var formatter = storage.formatter,
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

        return '';
    };


});



//选择列
$class(flyingon.GridColumn, function (base) {


    //列类型
    this.type = 'checked';

    
    //默认宽度
    this.defaultValue('width', 25);

    //禁止编辑
    this.defaultValue('readonly', true);

    //禁止可调整列宽
    this.defaultValue('resizable', false);

    //禁止列头排序
    this.defaultValue('sortable', false);

    //禁止可操作列
    this.defaultValue('showOperate', false);

    //指定单元格class
    this.defaultValue('cellClass', 'flyingon-Grid-checked');

    
    //是否显示选中所有
    this.defineProperty('all', false);


    this.headerText = function (title, multi) {

        return !multi && this.__storage.all ? '<input type="checkbox" class="flyingon-gird-checked-all"></input>' : '';
    };


    this.renderCell = function (row) {

        return '<input type="checkbox"' + (row.checked ? ' checked="checked"' : '') + '></input>';
    };


    this.__on_cell_mousedown = function (e, cell) {

        var grid = this.grid,
            view = grid.__view,
            row;

        if (view && e.target.type === 'checkbox' && (row = view[cell.getAttribute('row-index') | 0]))
        {
            var items = view.checkedRows,
                list = view.findRowCells(row),
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
$class(flyingon.GridColumn, function (base) {


    //列类型
    this.type = 'group';

    
    //默认宽度(收拢时的宽度)
    this.defaultValue('width', 40);

    //指定单元格class
    this.defaultValue('cellClass', 'flyingon-Grid-grouptree');

    //禁止编辑
    this.defaultValue('readonly', true);

    //禁止可调整列宽
    this.defaultValue('resizable', false);

    //禁止列头排序
    this.defaultValue('sortable', false);

    //禁止可操作列
    this.defaultValue('showOperate', false);

                      
    //最大级别
    this.defineProperty('maxLevel', 0);

    //默认展示级别
    this.defineProperty('expandLevel', 0);

    //是否展开
    this.defineProperty('expanded', false);

    //栏位宽度
    this.defineProperty('itemWidth', 16);

    //栏位高度
    this.defineProperty('itemHeight', 16);

    //是否显示行号
    this.defineProperty('rowno', true);

    //行号宽度
    this.defineProperty('rownoWidth', 40);


    this.headerText = function (text, multi) {

        var storage = this.__storage;
        
        if (multi || !storage.expanded)
        {
            return text || '';
        }

        var data = [],
            left = 0,
            width = storage.itemWidth,
            html = '<span class="flyingon-Grid-grouptree-level" style="display:inline-block;width:' + width + 'px;left:';

        for (var i = 1, _ = storage.maxLevel; i <= _; i++)
        {
            data.push(html, left, 'px;">', i, '</span>');
            left += width;
        }

        data.push('<span class="flyingon-Grid-groupno-title" style="display:inline-block;width:', 
            storage.rownoWidth, 
            'px;">', 
            text || '', 
            '</span>');
        
        return data.join('');
    };


    this.renderBody = function (writer, columns, row, fn, end) {

        base.renderBody.call(this, writer, columns, row, fn, false);

        if (this.rowno)
        {
            writer.length--;
            render_rowno.call(this, writer, row);
        }
                    
        if (end !== false)
        {
            writer.push('</div>');
        }
    };


    this.renderCell = function (row) {

        var data = [],
            text1 = '<span class="flyingon-Grid-grouptree-',
            text2 = '" style="display:inline-block;width:' + this.__storage.itemWidth + 'px;height:100%;" no-current="true"',
            target = row,
            cache;

        while (cache = target.parent)
        {
            data.unshift(text1, 
                'line', 
                ' flyingon-Grid-grouptree-line-last',
                text2,
                '></span>');
            
            target = cache;
        }

        if (row.children)
        {
            cache = row.expanded ? 'expand' : 'collapse';
            data.push(text1, cache, text2, ' tree-', cache, '="true"></span>');
        }
        else
        {
            data.push(text1, 'leaf', text2, '></span>');
        }

        return {
            
            text: data.join(''),
            attribute: 'no-current="true"'
        };
    };


    function render_rowno(writer, row) {

        var storage = this.__storage,
            formatter = storage.formatter,
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
                style = 'display:inline-block;width:' + storage.rownoWidth + 'px;',
                attribute = '';

            if (storage.expanded)
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

            writer.push('<span class="', className,
                '" style="', style, ';"',
                attribute, '>',
                value,
                '</span>');
        }
    };


});

