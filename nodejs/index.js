const args = process.argv;

// $ node index.js funcBasic.js
var lambdaFile = '';
if ( args.length == 3 ) {   
    lambdaFile = './' + args[2];
} else {
    lambdaFile = './defaultNode8.js';
}
lambdaFile = lambdaFile.replace('.\\', './').replace('././', './');

var lambdaFunction = require(lambdaFile);
var functionHandler = 'handler';

var event = {};
var context = {};
function callback(error, data) {
    if (data) console.log("callback data : " , data);
    if (error) console.log("callback error : ", error);
}

lambdaResult = lambdaFunction[functionHandler](event, context, callback);
console.log(lambdaResult)