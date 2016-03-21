$include('flyingon/demo/src/class/class1.js');


//$namespace: 定义或切换名字空间, 注：test参数为flyingon.test的别名
$namespace('flyingon.test', function (test) {

    

    //定义子类 freeoasoft.test.ChildClass 从BaseClass继承 (注:仅在名字空间内才可定义类)
    $class('ChildClass', test.BaseClass, function (self, base) {


        //子类会自动调用父类的构造函数
        $constructor(function (p1, p2, p3) {

            this.p3 = p3;
        });


        //重载实例方法
        self.instance_fn = function () {

            //先调用父类的方法
            base.instance_fn.call(this);

            return 'ChildClass';
        };


    });


   
});
