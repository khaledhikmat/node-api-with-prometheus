const http = require('http');

// Read arguments - we don't really care about nodeProc and nodeModule
const [nodeProc, nodeModule, host, portNumber, intervalNumber, ...paths] = process.argv;

// Make sure we have defaults
if (!host) {
    host = 'localhost';
} 
if (!portNumber) {
    portNumber = '8800';
}
if (!intervalNumber) {
    intervalNumber = '10';
}

const port = parseInt(portNumber);
const interval = parseInt(intervalNumber);

console.log('Host: ' + host);
console.log('Port: ' + port);
console.log('Interval: ' + interval);
console.log('Paths: ', paths);
console.log('Paths length: ', paths.length);

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

    console.log(`getResponse: ${port}:${path}`);
    var req = http.request(options, res => {
        console.log(`Status code: ${res.statusCode}`);
    });

    req.end();
    setTimeout(getResponse, getRandomInteger(interval) * 1000, path);
} 

if (paths.length > 0) {
    paths.forEach(path => { 
        getResponse(path); 
    });
} else {
    console.log('Paths length is 0!!! Please provide some paths in the command arguments like this:\nnode loader.js localhost 8800 10 / /hello');
}