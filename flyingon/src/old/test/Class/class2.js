console.log('class2 executed')
//引入相关js
$include('test1.js');
$include('test2.js');


//演示从引入js的类继承
$namespace('flyingon.test', function (test) {


    $class('Test1', flyingon.Test1, function (base) {


    });


    $class('Test2', flyingon.Test2, function (base) {


    });


});


//console.log('executed class2.js');