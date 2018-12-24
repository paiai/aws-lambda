const http = require('http');
const querystring = require('querystring');

exports.handler = async (event, context, callback) => {
    //console.log("event ====>", JSON.stringify(event, null, 2));

    const postData = querystring.stringify(
        // {"msg": "Hello World!"}              // => Parse Error
        //'{"msg": "Hello World!"}'             // => OK
        "{\"msg\": \"Hello World!\"}"           // => OK
    );
    
    const options = {
        hostname: 'leesu.woobi.co.kr',
        path: '/test/http_request.php',
        port: 80,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }, 
        timeout: 2000,
    };

    const req = http.request(options, (res) => {
        console.log('statusCode:', res.statusCode);
        console.log('headers:', res.headers);

        res.setEncoding('utf8');

        let body = '';
        res.on('data', (chunk) => {
            body += chunk;
        });
        res.on('end', () => {
            try {
                if ( body.length != 0 ) {
                    //const result = JSON.parse(body.toString());
                    callback(null, body);
                } 
            } catch(err) {
                callback(err);
            }
        });
    });

    req.on('timeout', function(){
        req.abort();
        callback("timeout error");
    });

    req.on('error', (e) => {
        callback(e.message);
    });
    
    req.write(postData);
    req.end();
};
