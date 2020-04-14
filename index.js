const express = require("express");
const client = require("prom-client");

const app = express();
const port = process.argv[2] ? parseInt(process.argv[2]) : 8800;

// Create app registry
const Registry = client.Registry;
const appRegistry = new Registry();

// Create app metrics
const httpRequestsTotalCounter = new client.Counter ({
    name: "demo_http_requests_total",
    help: "Demo HTTP Total Requests",
    labelNames: ["path", "method"],
    registers: [appRegistry]
});

const httpRequestExceptionsCounter = new client.Counter ({
    name: "demo_http_exceptions",
    help: "Demo HTTP Exceptions",
    labelNames: ["path", "method"],
    registers: [appRegistry]
});

const httpRequestBytesCounter = new client.Counter ({
    name: "demo_http_bytes",
    help: "Demo HTTP Bytes",
    labelNames: ["path", "method"],
    registers: [appRegistry]
});

const httpRequestsGauge = new client.Gauge ({
    name: "demo_http_pending_requests",
    help: "Demo HTTP Pending Requests",
    labelNames: ["path", "method"],
    registers: [appRegistry]
});

const httpLastRequestGauge = new client.Gauge ({
    name: "demo_http_last_request",
    help: "Demo HTTP Last Request",
    labelNames: ["path", "method"],
    registers: [appRegistry]
});

const httpLastRequestDuration = new client.Summary ({
    name: "demo_http_request_duration",
    help: "Demo HTTP Request Duration",
    labelNames: ["path", "method"],
    registers: [appRegistry]
});

// Use middleware for all requests to have an artificial delay between: 100 ms and 2100 ms
//WARNING: This will also delay the metrics API which is probably not desirable
app.use(function(req, res, next) {
    setTimeout(next, Math.floor((Math.random() * 2000) + 100));
});

app.get("/", (req, res) => {
    httpRequestsTotalCounter.labels("/", "GET").inc();
    httpRequestBytesCounter.labels("/", "GET").inc(Math.random() * 100);
    httpRequestsGauge.labels("/", "GET").inc();
    let end = httpLastRequestDuration.labels("/", "GET").startTimer();

    try {
        if (Math.random() < 0.2) {
            throw 'Random failure'
        }
    } catch (e) {
        httpRequestExceptionsCounter.labels("/", "GET").inc();
    }

    // Simulate a delay 
    // setTimeout((function() {
    //     httpRequestsGauge.labels("/", "GET").dec();
    //     httpLastRequestGauge.setToCurrentTime();
    //     end();
    //     res.send("root path");
    // }), Math.floor((Math.random() * 2000) + 100));

    httpRequestsGauge.labels("/", "GET").dec();
    httpLastRequestGauge.setToCurrentTime();
    end();
    return res.send("root path");
});

app.get("/hello", (req, res) => {
    httpRequestsTotalCounter.labels("/hello", "GET").inc();
    httpRequestBytesCounter.labels("/hello", "GET").inc(Math.random() * 100);
    httpRequestsGauge.labels("/hello", "GET").inc();
    let end = httpLastRequestDuration.labels("/hello", "GET").startTimer();

    try {
        if (Math.random() < 0.15) {
            throw 'Random failure'
        }
    } catch (e) {
        httpRequestExceptionsCounter.labels("/hello", "GET").inc();
    }

    // setTimeout((function() {
    //     httpRequestsGauge.labels("/hello", "GET").dec();
    //     httpLastRequestGauge.setToCurrentTime();
    //     end();
    //     res.send("hello path");
    // }), Math.floor((Math.random() * 2000) + 100));

    httpRequestsGauge.labels("/hello", "GET").dec();
    httpLastRequestGauge.setToCurrentTime();
    end();
    return res.send("hello path");
});

app.get("/metrics", (req, res) => {
    console.log(`${new Date()} I am being scraped....yay....`);
    console.log(`Metrics ${appRegistry.metrics()}`);
    res.set("Content-Type", appRegistry.contentType);
    res.end(appRegistry.metrics());
});

app.listen(port, () => console.log(`Running an Express server on ${port}`));
