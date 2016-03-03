
//$namespace: 定义或切换名字空间, 注：test参数为flyingon.test的别名
$namespace('flyingon.test', function (test) {

    
    
    //定义基类: freeoasoft.test.BaseClass (注:仅在名字空间内才可定义类)
    $class('BaseClass', flyingon.Component, function (self) {


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
        self.instance_fn = function () {

            return 'BaseClass';
        };


        //定义布尔型属性,默认值为false
        self.defineProperty('p_boolean', false);


        //定义整数型属性,默认值为0
        self.defineProperty('p_int', 0);


        //定义数字型属性,默认值为0
        self.defineProperty('p_float', 0.0);


        //定义字符型属性,默认值为''
        self.defineProperty('p_string', '');


        //定义只读属性
        self.defineProperty('p_readonly', function () {
            
            return new Date();
        });

    });


    
});

