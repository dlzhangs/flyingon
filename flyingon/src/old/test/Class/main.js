
//指定引入资源初始路径
//flyingon.include_path('');


//指定引入资源版本
flyingon.include_version('1.0', {

    'class1.js': '2.0',
    'test.min.js': '2.0'
});


//指定引入资源合并关系
flyingon.include_merge({

    //'class.min.js': ['class1.js', 'class2.js'],
    //'test.min.js': ['test1.js', 'test2.js']
});



//自定义初始化(等待class.js加载完毕才执行)
$require(['class1.js', 'class2.js', 'themes/{theme}.css', 'i18n/{i18n}.js'], function (flyingon) {


    //引入名字空间
    var test = flyingon.test;


    //创建对象
    var obj1 = new test.BaseClass(1, 2);
    var obj2 = new test.ChildClass(1, 2, 3);


    //类型判断
    obj1.constructor === test.BaseClass; //true
    obj2.constructor === test.ChildClass; //true

    //类型检测
    obj2.is(test.BaseClass) === true; //true
    obj2.is(test.ChildClass) === true; //true

    //调用实例方法
    obj1.instance_fn() === 'BaseClass'; //true

    //调用继承的实例方法
    obj2.instance_fn() === 'ChildClass'; //true

    //调用静态方法
    test.BaseClass.static_fn() === 'static'; //true


    
    //获取属性值的三种方法(性能: 方法1 >= 方法2 > 方法3)
    obj2.p_boolean === false;           //方法1: 支持大多数浏览器, 一些比较老的浏览器如IE6,7,8不支持此写法
    obj2.get_p_boolean() === false;     //方法2: 所有浏览器都支持

    //设置值的三种方法(性能: 方法 1>= 方法2 > 方法3)
    obj2.p_boolean = true;        //方法1: 支持大多数浏览器, 一些比较老的浏览器如IE6,7,8不支持此写法
    obj2.set_p_boolean(true);     //方法2: 所有浏览器都支持

    //自动类型转换
    obj2.set_p_boolean('2');    //true;
    obj2.set_p_int(3.2);        //3;
    obj2.set_p_int('3.5');      //3;
    obj2.set_p_int('3int');     //0
    obj2.set_p_string(3.2);     //'3.2'

    obj2.get_p_readOnly();      //返回当前时间
    //obj2.set_p_readOnly();      //会弹出属性'p_readOnly'是只读属性的提醒框


    //注册全局事件(可优先捕获任意对象触发的事件)
    obj1.on('my_event', function (e) {

        //alert('obj1');

        //停止冒泡
        //e.stopPropagation();

    }, true);

    //注册事件(支持事件捕获及冒泡)
    obj2.on('my_event', function (event, data) {

        //alert(event.type + data);
    });
    
    //触发事件
    obj2.trigger('my_event', '+dddddd'); //弹出"my_event+dddddd"

    //注销obj1上的所有my_event全局事件
    obj1.off('my_event', null, true);

    //注销obj3上的所有my_event事件
    obj2.off('my_event');

    //再次触发事件
    obj2.trigger('my_event', '+dddddd'); //不会弹出对话框

});
