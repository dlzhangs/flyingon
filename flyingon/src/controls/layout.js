
//布局相关基础方法
(function (flyingon) {


    var pixel_unit = flyingon.create(null), //单位换算列表

        pixel_list = flyingon.create(null), //缓存的单位转换值

        regex_unit = /[a-zA-z]+|%/, //计算尺寸正则表达式

        regex_sides = /[\w%.]+/g, //4边解析正则表达式
        
        sides_list = flyingon.create(null), //4边缓存列表
        
        round = Math.round,

        parse = parseFloat,
        
        pixel;
    
    
    //计算滚动条大小及单位换算列表
    flyingon.dom_test(function (div) {

        var list = pixel_unit;

        //计算单位换算列表
        div.style.cssText = 'position:absolute;left:-10000ex;top:-100em;width:10000cm;height:1in;'

        list.px = 1;
        list.ex = -div.offsetLeft / 10000;
        list.em = list.rem = -div.offsetTop / 100;
        list.cm = (list.cm = div.offsetWidht / 10000) * 10;
        list.pt = (list.pc = (list['in'] = div.offsetHeight) / 6) / 12;

        div.style.cssText = "position:absolute;overflow:scroll;width:100px;height:100px;border:0;padding:0;top:-100px;";
        div.innerHTML = "<div style='position:relative;width:200px;height:200px;'></div>";

        //竖直滚动条宽度
        this.scroll_width = div.offsetWidth - div.clientWidth;

        //水平滚动条高度
        this.scroll_height = div.offsetHeight - div.clientHeight;

        div.innerHTML = '';

    }, this);


    //或者或设置象素转换单位
    flyingon.pixel_unit = function (name, value) {

        if (value === void 0)
        {
            return pixel_unit[name];
        }

        if (pixel_unit[name] !== value)
        {
            pixel_unit[name] = value;

            var list = pixel_list;

            for (var key in list)
            {
                if (key.indexOf(name) > 0)
                {
                    list[key] = void 0;
                }
            }
        }
    };


    //转换css尺寸为像素值
    //注: em与rem相同, 且在初始化时有效
    flyingon.pixel = pixel = function (value, size) {

        if (value >= 0)
        {
            return value >> 0;
        }

        var cache = pixel_list[value];

        if (cache !== void 0)
        {
            return cache !== true ? cache : round(parse(value) * size / 100);
        }

        if (cache = value.match(regex_unit)) 
        {
            if (cache === '%')
            {
                pixel_list[value] = true;
                return round(parse(value) * size / 100);
            }
            
            cache = cache.toLowerCase();
        }

        return pixel_list[value] = round(parse(value) * (pixel_unit[cache] || 1));
    };
    
    
    //转换4边尺寸为像素值(margin, padding的百分比是以父容器的宽度为参照, border-width不支持百分比)
    flyingon.pixel_sides = function (value, width) {
        
        if (values = sides_list[value])
        {
            //直接取缓存
            if (values.cache)
            {
                return values;
            }
        }
        else if (value && (value = value.match(regex_sides)))
        {
            values = pixel_sides(value);

            if (values[4] >= 0 && values[5] >= 0)
            {
                values.cache = true;
                return sides_list[value] = values;
            }

            values = value;
        }
        else
        {
            return sides_list[value] = [0, 0, 0, 0, 0, 0];
        }

        return pixel_sides(values, width);
    };
    
    
    function pixel_sides(sides, width) {
        
        var array = [0, 0, 0, 0, 0, 0];
        
        switch (cache.length)
        {
            case 1:
                array[0] = array[2] = array[1] = array[3] = pixel(cache[0], width);
                break;

            case 2:
                array[0] = array[2] = pixel(cache[1], width);
                array[1] = array[3] = pixel(cache[0], width);
                break;

            case 3:
                array[0] = array[2] = pixel(cache[1], width);
                array[1] = pixel(cache[0], width);
                array[3] = pixel(cache[2], width);
                break;

            default:
                array[0] = pixel(cache[3], width);
                array[1] = pixel(cache[0], width);
                array[2] = pixel(cache[1], width);
                array[3] = pixel(cache[2], width);
                break;
        }

        array[4] = array[0] + array[2];
        array[5] = array[1] + array[3];
        
        return array;
    };
    

})(flyingon);



//可定位对象接口
flyingon.ILocatable = function (self, control) {
   
    
    var ILocatable = flyingon.ILocatable,
        extend_list = ILocatable.__extend_list,
        extend = flyingon.extend,
        pixel = flyingon.pixel,
        pixel_sides = flyingon.pixel_sides;
    
    
    //记录被扩展的目标
    (ILocatable.__target_list || (ILocatable.__target_list = [])).push(self);
    
    
    //接口标记
    self['flyingon.ILocatable'] = true;

    
    self.locationProperty = function (name, defaultValue, attributes) {
        
        this.defineProperty(name, defaultValue, control && extend({

            group: 'location',
            query: true,
            set: '(this.__parent || this).update(true);'
        
        }, attributes));
    };
    
    
    //控件默认宽度(width === 'default'时的宽度)
    self.defaultWidth = 100;

    //控件默认高度(height === 'default'时的高度)
    self.defaultHeight = 21;


    self.locationProperty('visible', true);
    
    //
    self.locationProperty('overflow', 'visible');
    
    //控件横向对齐方式
    //left      左边对齐
    //center    横向居中对齐
    //right     右边对齐
    self.locationProperty('alignX', 'center');

    //控件纵向对齐方式
    //top       顶部对齐
    //middle    纵向居中对齐
    //bottom    底部对齐
    self.locationProperty('alignY', 'middle');

    //控件横向偏移距离
    //length	规定以具体单位计的值 比如像素 厘米等
    //number%   父控件客户区宽度的百分比
    self.locationProperty('offsetX', '0');

    //控件纵向偏移距离
    //length	规定以具体单位计的值 比如像素 厘米等
    //number%   父控件客户区高度的百分比
    self.locationProperty('offsetY', '0');


    self.locationProperty('left', '0');

    self.locationProperty('top', '0');

    self.locationProperty('width', 'default');

    self.locationProperty('height', 'default');


    self.locationProperty('minWidth', '0');

    self.locationProperty('maxWidth', '0');

    self.locationProperty('minHeight', '0');

    self.locationProperty('maxHeight', '0');


    self.locationProperty('margin', '0');

    self.locationProperty('border', '0', {
    
        set: 'this.dom.style.borderWidth = value;\n\t(this.__parent || this).update(true);'
    });

    self.locationProperty('padding', '0');
    
    
    if (extend_list)
    {
        for (var name in extend_list)
        {
            self.locationProperty.apply(self, extend_list[name]);
        }
    }


    //获取定位属性值
    self.locationValue = function (name) {
      
        var values = this.__location_values,
            value;
        
        if (values && (value = values[name]) != null)
        {
            return value;
        }
        
        return (this.__storage || this.__defaults)[name];
    };
    
    
    
    //获取通用定位属性值集合
    self.locationValues = function (width, height) {
      
        var box = {},
            values = this.__location_values,
            storage = this.__storage || this.__defaults,
            x = pixel,
            y = pixel_sides;
        
        if (values)
        {
            box.visible = values.visible || storage.visible;
            box.overflow = values.overflow || storage.overflow;
            
            box.alignX = values.alignX || storage.alignX;
            box.alignY = values.alignY || storage.alignY;
            
            box.offsetX = x(values.offsetX || storage.offsetX, width);
            box.offsetY = x(values.offsetY || storage.offsetY, height);
            box.left = x(values.left || storage.left, width);
            box.top = x(values.top || storage.top, height);
            
            box.width = values.width || storage.width;
            box.height = values.height || storage.height;
            
            box.minWidth = x(values.minWidth || minWidth.minWidth, width);
            box.maxWidth = x(values.maxWidth || storage.maxWidth, width);
            box.minHeight = x(values.minHeight || storage.minHeight, height);
            box.maxHeight = x(values.maxHeight || storage.maxHeight, height);
            
            //margin, padding的百分比是以父容器的宽度为参照, border-width不支持百分比
            box.margin = y(values.margin || storage.margin, width);
            box.border = y(values.border || storage.border, width);
            box.padding = y(values.padding || storage.padding, width);
        }
        else
        {
            box.visible = storage.visible;
            box.overflow = storage.overflow;
            
            box.alignX = storage.alignX;
            box.alignY = storage.alignY;
            
            box.offsetX = x(storage.offsetX, width);
            box.offsetY = x(storage.offsetY, height);
            box.left = x(storage.left, width);
            box.top = x(storage.top, height);
            
            box.width = storage.width;
            box.height = storage.height;
            
            box.minWidth = x(minWidth.minWidth, width);
            box.maxWidth = x(storage.maxWidth, width);
            box.minHeight = x(storage.minHeight, height);
            box.maxHeight = x(storage.maxHeight, height);
            
            //margin, padding的百分比是以父容器的宽度为参照, border-width不支持百分比
            box.margin = y(storage.margin, width);
            box.border = y(storage.border, width);
            box.padding = y(storage.padding, width);
        }
        
        return box;
    };
    
};



//子布局
$class('Sublayout', [Object, flyingon.IObject], function (self) {
   
    
    
    //子项数
    self.defineProperty('length', 0.0);
    
    
    //扩展可定位对象接口
    flyingon.ILocatable(self);
    
    
    //布局
    self.defineProperty('layout', null, {
     
        storage: 'this.__layout'
    });
    
    
    
    self.serialize = function (writer) {
        
        var cache;
        
        if (cache = this.__storage)
        {
            writer.write_properties('storage', cache);
        }
        
        if (cache = this.__layout)
        {
            writer.write_property('layout', cache);
        }
    };
    
    
    self.deserialize_list.layout = function (reader, values) {
    
        this.__layout_ = (this.__layout = values) && flyingon.findLayout(values, reader);
    };
    
});



//布局基类
$class('Layout', [Object, flyingon.IObject], function (self) {



    var registry_list = flyingon.create(null), //注册的布局列表
        
        layouts = flyingon.create(null), //已定义的布局集合
        
        Array = window.Array;
        

            
    //获取或切换而已或定义布局
    flyingon.layout = function (name, values) {
    
        if (name && values && typeof values !== 'function') //定义布局
        {
            layouts[name] = [values, null];
        }
        
        return flyingon.include_var('layout', name, values); //获取或设置当前布局
    };
    
    
    //获取布局定义
    flyingon.findLayout = function (key, reader) {
      
        if (key)
        {
            switch (typeof key)
            {
                case 'string':
                    if (key = layouts[key])
                    {
                        return key[1] || (key[1] = deserialize_layout(reader, key[0]));
                    }
                    break;
                    
                case 'object':
                    return deserialize_layout(reader, key);
            }
        }
    };
    
    
    function deserialize_layout(reader, values) {
      
        var layout = new (values && registry_list[values.xtype] || flyingon.Layout)();

        layout.deserialize(reader || flyingon.SerializeReader.instance, values);
        return layout;
    };
    
    

    //布局类型
    self.type = null;

    
    //定义排列属性方法
    self.arrangeProperty = self.defineProperty;
    

    //定义定位属性方法
    self.locationProperty = function (name, defaultValue, attributes) {

        var ILocatable = flyingon.ILocatable,
            list = ILocatable.__target_list;
        
        (ILocatable.__extend_list || (ILocatable.__extend_list = {}))[name] = arguments;

        if (list)
        {
            for (var i = list.length - 1; i >= 0; i--)
            {
                list[i].locationProperty(name, defaultValue, attributes);
            }
        }
    };


    //是否竖排
    //true      竖排
    //false     横排
    self.arrangeProperty('vertical', false);

    //镜像布局变换
    //none:     不进行镜像变换
    //x:        沿x轴镜像变换
    //y:        沿y轴镜像变换
    //center:   沿中心镜像变换
    self.arrangeProperty('mirror', 'none');

    //布局间隔宽度
    //length	规定以具体单位计的值 比如像素 厘米等
    //number%   控件客户区宽度的百分比
    self.arrangeProperty('spacingX', '0');

    //布局间隔高度
    //length	规定以具体单位计的值 比如像素 厘米等
    //number%   控件客户区高度的百分比
    self.arrangeProperty('spacingY', '0');

    //内容横向对齐方式
    //left      左边对齐
    //center    横向居中对齐
    //right     右边对齐
    self.arrangeProperty('contentAlignX', 'left');

    //内容纵向对齐方式
    //top       顶部对齐
    //middle    纵向居中对齐
    //bottom    底部对齐
    self.arrangeProperty('contentAlignY', 'top');
    
    
    //子项
    self.arrangeProperty('subitems', null, {

        storage: 'this.__subitems',
        set: 'this.__subitems_ = !!value;'
    });

    
    //子布局
    self.arrangeProperty('sublayouts', null, {
       
        storage: 'this.__sublayouts',
        set: 'this.__sublayouts_ = !!value;'
    });
    

    //自适应布局
    self.arrangeProperty('adaptation', null, {

        storage: 'this.__adaptation',
        set: 'this.__adaptation_ = !!value;'
    });


    
    //初始化排列
    self.init = function (container, clientRect, items, start, end) {
        
        var layout, values, index = items.length;
        
        if (!start || start < 0)
        {
            start = 0;
        }

        if (!end || end >= index)
        {
            end = index - 1;
        }

        if (end >= start)
        {
            if (layout = this.__adaptation_)
            {
                if (layout === true)
                {
                    layout = parse_expression(this.__adaptation, values = []);
                    layout = this.__adaptation_ = new Function('container', 'width', 'height', layout);
                    layout.values = values;
                }
                else
                {
                    values = layout.values;
                }

                index = layout(container, clientRect.width, clientRect.height);

                if ((layout = values[index]) && !layout['flyingon.Layout'])
                {
                    layout = values[index] = flyingon.findLayout(layout);
                }
            }

            (layout || this).__arrange(container, clientRect, items, start, end);
        }
    };
    
      
    //内部排列方法
    self.__arrange = function (container, clientRect, items, start, end) {

        var sublayouts = this.__sublayouts_;
        
        if (sublayouts)
        {
            if (sublayouts === true)
            {
                sublayouts = this.__sublayouts_ = init_sublayouts(this.__sublayouts);
            }
 
            //排列子布局
            this.arrange(container, clientRect, sublayouts, start, end);
            
            //按顺序处理每一个子布局
            arrange_sublayouts(container, sublayouts, items, start, end);
        }
        else
        {
            var subitems = this.__subitems_,
                each;
            
            if (subitems)
            {
                if (subitems === true)
                {
                    subitems = this.__subitems_ = init_subitems(this.__subitems);
                }

                each = subitems.each;
                
                for (var i = start; i <= end; i++)
                {
                    items[i].__location_values = each && each(i, items[i], container) || subitems;
                }
            }

            this.arrange(container, clientRect, items, start, end);
        }
    };
    
    
    //排列布局
    self.arrange = function (container, clientRect, items, start, end) {

    };
    
    
    //翻译布局表达式
    function parse_expression(data, values) {

        var writer = [],
            index = 0,
            name;

        //如果是数组则第一个参数为var或switch, 第二个参数为表达式, 最后一个是布局
        if (data instanceof Array)
        {
            if (data[0] === 'var')
            {
                writer.push('var ' + data[1] + ';\n');
                data = data[2];
            }
            else
            {
                writer.push('switch ("" + (' + data[1] + '))\n{\n');
                data = data[2];
                
                for (name in data)
                {
                    writer.push('case "' + name + '": return ' + index + ';\n');
                    values[index++] = data[name];
                }

                writer.push('}\n');
                return writer.join('');
            }
        }

        for (name in data)
        {
            writer.push('if (' + name + ') return ' + index + ';\n'); 
            values[index++] = data[name];
        }

        return writer.join('');
    };


    //初始化强制子项
    function init_subitems(values) {
        
        var subitems = flyingon.create(null),
            cache;
        
        for (cache in values)
        {
            subitems[cache] = values[cache];
        }
        
        if (cache = subitems.each)
        {
            var fn = function () {},
                extend = flyingon.extend;
                
            fn.prototype = subitems;
            
            cache = parse_expression(cache, values = []);
            (subitems.each = new Function('index', 'item', 'container', cache)).values = values;

            for (var i = values.length - 1; i >= 0; i--)
            {
                values[i] = extend(new fn(), values[i]);
            }
        }
        
        return subitems;
    };
    
    
    //初始化子布局
    function init_sublayouts(values) {
        
        var index = values.length;
        
        if (!index)
        {
            values = [values];
            index = 1;
        }
        
        var reader = flyingon.SerializeReader,
            items = new Array(values.length),
            data;
        
        while (data = values[--index])
        {
            (items[index] = new flyingon.Sublayout()).deserialize(reader, data);
        }
        
        return items;
    };
    
    
    //排列子布局
    function arrange_sublayouts(container, sublayouts, items, start, end) {
        
        var i1 = 0,
            i2 = sublayouts.length - 1,
            all = end - start,
            target,
            length;
        
        //先排列前面部分的子项
        while (i1 <= i2)
        {
            length = (target = sublayouts[i1]).length();
            
            if (length < 0)
            {
                length += all;
            }
            else if (length < 1)
            {
                break;
            }
            
            target.__layout_.init(container, target.clientRect, items, start, start += length);
            
            if (start >= end)
            {
                return;
            }
        }
        
        //再排列后面部分的子项
        while (i2 > i1)
        {
            length = (target = sublayouts[i1]).length();
            
            if (length < 0)
            {
                length += all;
            }
            else if (length < 1)
            {
                break;
            }
            
            target.__layout_.init(container, target.clientRect, items, end - length, end);
            
            if (start >= (end -= length))
            {
                return;
            }
        }
        
        //最后排列中间的余量
        while (i1 <= i2)
        {
            length = Math.ceil((target = sublayouts[i1]).length() * (end - start));
            
            target.__layout_.init(container, target.clientRect, items, start, start += length);
            
            if (start >= end)
            {
                return;
            }
        }
    };
    
    
    
    //序列化方法
    self.serialize = function (writer) {

        var cache;

        writer.write_property('type', this.type);

        if (cache = this.__storage)
        {
            writer.write_properties('storage', cache);
        }
        
        if (cache = this.__subitems)
        {
            writer.write_property('subitems', cache);
        }

        if (cache = this.__sublayouts)
        {
            writer.write_property('sublayouts', cache);
        }
        
        if (cache = this.__adaptation)
        {
            writer.write_property('adaptation', cache);
        }
    };

    
    //设置不反序列化type属性
    self.deserialize_list.type = true;
    
            

    self.__class_init = function (Class) {

        if (self !== this)
        {
            if (this.type)
            {
                registry_list[this.type] = Class;
            }
            else
            {
                throw $errortext('flyingon', 'layout type').replace('{0}', Class.xtype);
            }
        }
    };
        

});



//流式布局类
$class('FlowLayout', flyingon.Layout, function (self, base) {


    self.type = 'flow';

    self.arrangeProperty('layoutWidth', 0);

    self.arrangeProperty('layoutHeight', 0);

    self.locationProperty('newline', false);

});



//单列布局类
$class('LineLayout', flyingon.Layout, function (self, base) {


    self.type = 'line';
    
});



//三栏布局类
$class('Column3Layout', flyingon.Layout, function (self, base) {

    
    self.type = 'column3';
    

    //拆分布局位置(此值仅对3栏布局(column3)有效)
    //before    前面位置
    //after     后面位置
    //center    中间位置
    self.locationProperty('column3', 'before');

});



//停靠布局类
$class('DockLayout', flyingon.Layout, function (self, base) {


    self.type = 'dock';
    
    
    //控件停靠方式(此值仅在当前布局类型为停靠布局(dock)时有效)
    //left:     左停靠
    //top:      顶部停靠
    //right:    右停靠
    //bottom:   底部停靠
    //fill:     充满
    self.locationProperty('dock', 'left');

});



//网格布局类
$class('GridLayout', flyingon.Layout, function (self, base) {


    self.type = 'grid';
    
    
    //均匀网格布局行数(此值仅对网格布局(grid)及单元格布局(cell)有效)
    //number	整数值 
    //string    自定义行 如:'20 30% 20* *'表示4行 第一行固定宽度为20 第2行使用可用空间的30% 第3,4行使用全部剩余空间,第3行占比20/120 第4行占比100/120
    self.arrangeProperty('layoutRows', 3);

    //均匀网格布局列数(此值仅对网格布局(grid)及单元格布局(cell)有效)
    //number	整数值 
    //string    自定义列 如:'20 30% 20* *'表示4列 第一列固定宽度为20 第2列使用可用空间的30% 第3,4行使用全部剩余空间,第3行占比20/120 第4行占比100/120
    self.arrangeProperty('layoutColumns', 3);


    //横跨行数(此值仅在当前布局类型为网格布局(grid)时有效)
    //number	整数值(负整数表示横跨至倒数第几列)
    self.locationProperty('rowSpan', 0);

    //纵跨列数(此值仅在当前布局类型为网格布局(grid)时有效)
    //number	整数值(负整数表示横跨至倒数第几列)
    self.locationProperty('columnSpan', 0);

    //指定列索引(此值仅在当前布局类型为网格布局(grid)时有效)
    //number	整数值(0:不固定 正整数:指定使用第几列 负整数:指定使用倒数第几列)
    self.locationProperty('columnIndex', 0);

    //跳空网格数(此值仅在当前布局类型为网格布局(grid)时有效)
    //number	整数值
    self.locationProperty('spacingCells', 0);

});



//表格布局类
$class('TableLayout', flyingon.Layout, function (self, base) {


    self.type = 'table';
    
    
    //表格布局定义(此值仅对表格布局(table)有效)
    //行列格式: row[column ...] ... row,column可选值: 
    //整数            固定行高或列宽 
    //数字+%          总宽度或高度的百分比 
    //数字+*          剩余空间的百分比, 数字表示权重, 省略时权重默认为100
    //数字+css单位    指定单位的行高或列宽
    //列可嵌套表或表组 表或表组可指定参数
    //参数集: (name1=value1, ...)   多个参数之间用逗号分隔
    //嵌套表: {(参数集) row[column ...] ...} 参数集可省略
    //嵌套表组: <(参数集) { ... } ...> 参数集可省略 多个嵌套表之间用空格分隔
    //示例(九宫格正中内嵌九宫格,留空为父表的一半): '*[* * *] *[* * {(spacingWidth=50% spacingHeight=50%) *[* * *] *[* * *] *[* * *]} *] *[* * *]'
    self.arrangeProperty('layoutTable', '*[* * *] *[* * *] *[* * *]', 'last-value');

});



//单元格布局类
$class('CellLayout', flyingon.Layout, function (self, base) {


    self.type = 'cell';
    
});



