console.log('Loading function');

exports.handler = (event, context, callback) => {
    // // TODO implement
    // const response = {
    //     statusCode: 200,
    //     body: JSON.stringify('Hello from Lambda!')
    // };
    // callback(null, response);
    
    console.log('Received event:', JSON.stringify(event, null, 2));
    console.log('name = ', event.name);
    var name = '';
    if ( 'name' in event ) {
        name = event['name'];
    } else {
        name = 'World';
    }
    
    var greetings = 'Hello ' + name + '! (Node.js Example)';
    console.log(greetings);
    callback(null, greetings);
};
