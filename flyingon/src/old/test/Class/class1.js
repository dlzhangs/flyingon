console.log('class1 executed')
//接口,类 定义及继承演示
//$namespace: 定义或切换名字空间, 注：test参数为flyingon.test的别名
$namespace('flyingon.test', function (test) {



    //定义基类: freeoasoft.test.BaseClass (注:仅在名字空间内才可定义类)
    $class('BaseClass', function () {


        //定义构造函数(注:仅在定义类时有效)
        $constructor(function (p1, p2) {

            this.p1 = p1;
            this.p2 = p2;
        });


        //定义静态方法
        $static('static_fn', function () {

            return 'static';
        });


        //定义实例方法
        $instance('instance_fn', function () {

            return 'BaseClass';
        });


        //定义布尔型属性,默认值为false
        $instance('p_boolean', false, true);


        //定义整数型属性,默认值为0
        $instance('p_int', 0, true);


        //定义数字型属性,默认值为0
        $instance('p_float', 0.0, true);


        //定义字符型属性,默认值为''
        $instance('p_string', '', true);


        //定义只读属性
        $instance('p_readOnly', null, {

            get: function () {

                return new Date();
            }
        });

    });



    //定义子类 freeoasoft.test.ChildClass 从BaseClass继承 (注:仅在名字空间内才可定义类)
    $class('ChildClass', test.BaseClass, function (base) {


        //子类会自动调用父类的构造函数
        //Class变量表示当前类型(注:仅在定义类时有效) create为构造函数 其它名称为类静态方法或变量
        $constructor(function (p1, p2, p3) {

            this.p3 = p3;
        });


        //重载实例方法
        $instance('instance_fn', function () {

            //先调用父类的方法
            base.instance_fn.call(this);

            return 'ChildClass';
        });


    });

        
   
});


//console.log('executed class1.js');