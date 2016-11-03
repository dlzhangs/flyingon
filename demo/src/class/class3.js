//$require('flyingon/demo/src/class/class1.js');
$require('flyingon/demo/src/class/class2.js');


//$namespace: 定义或切换名字空间, 注：test参数为flyingon.test的别名
$namespace('flyingon.test', function (test) {

    
    console.log('test3.js executed!');
    
    
});