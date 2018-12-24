const http = require('http');
const querystring = require('querystring');

exports.handler = async (event, context, callback) => {
    return new Promise((resolve, reject) => {
        console.log("event ====>", JSON.stringify(event, null, 2));

        const postData = querystring.stringify({
            'msg': 'Hello World!'
        });
        
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
            res.setEncoding('utf8');

            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    if ( body.length != 0 ) {
                        //const result = JSON.parse(body.toString());
                        resolve(body);
                    } 
                } catch(err) {
                    reject(err);
                }
            });

        });

        req.on('timeout', function(){
            req.abort();
            console.log("timeout error")
        });

        req.on('error', (e) => {
            reject(e.message);
        });
        
        req.write(postData);
        req.end();

    }).then((result) => {
        callback(null, result);
    }).catch((err) => {
        callback(err);
    });
};
