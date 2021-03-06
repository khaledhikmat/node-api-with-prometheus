// Read arguments - we don't really care about nodeProc and nodeModule
const [nodeProc, nodeModule, protocol, host, portNumber, intervalNumber, ...paths] = process.argv;

// Make sure we have defaults
if (!protocol) {
    protocol = 'http';
} 
if (!host) {
    host = 'localhost';
} 
if (!portNumber) {
    portNumber = '8800';
}
if (!intervalNumber) {
    intervalNumber = '10';
}

const http = require(protocol);
const port = parseInt(portNumber);
const interval = parseInt(intervalNumber);

console.log('Host: ' + host);
console.log('Port: ' + port);
console.log('Interval: ' + interval);
console.log('Paths: ', paths);
console.log('Paths length: ', paths.length);

// for POST paths, probably pass a file

const getRandomInteger = (max) => {
    return Math.floor(Math.random() * Math.floor(max));
}

const getResponse = (path) => {
    var options = {
        hostname: host,
        port: port,
        path: path,
        method: 'GET'
    }

    //console.log(`getResponse: ${port}:${path}`);
    let request;
    try {
        request = http.request(options, response => {
            console.log(`Status code for ${path} is: ${response.statusCode}`);
            let data = [];

            response.on('data', (fragment) => {
                data.push(fragment);
            });

            response.on('end', () => {
                let body = Buffer.concat(data);
            });

            response.on('error', (error) => {
                console.log(`Response error took place ${error}`);
            });
        });

        if (request) {
            request.on('error', (error) => {
                console.log(`Request error took place ${error}`);
            })
        }
    } catch (e) {
        console.log(`Error took place ${e}`);
    } finally {
        if (request) request.end();
    }

    setTimeout(getResponse, getRandomInteger(interval) * 1000, path);
} 

if (paths.length > 0) {
    paths.forEach(path => { 
        getResponse(path); 
    });
} else {
    console.log('Paths length is 0!!! Please provide some paths in the command arguments like this:\nnode loader.js localhost 8800 10 / /hello');
}