const express = require("express");

const app = express();
const port = process.argv[2] ? parseInt(process.argv[2]) : 8800;

// Use middleware for all requests to have an artificial delay between: 100 ms and 2100 ms
//WARNING: This will also delay the metrics API (which might not be desirable)
app.use(function(req, res, next) {
    setTimeout(next, Math.floor((Math.random() * 2000) + 100));
});

// Bootstrap controllers to handle routes
app.use('/hello', require('./controllers/hello-controller'));
app.use('/configuration', require('./controllers/configuration-controller'));
app.use('/ping', require('./controllers/ping-controller'));
app.use('/metrics', require('./controllers/metrics-controller'));

// Start the server
app.listen(port, () => console.log(`Running an Express server on ${port}`));
