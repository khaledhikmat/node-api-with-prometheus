const client = require("prom-client");

// Create app registry
const Registry = client.Registry;
const appRegistry = new Registry();

// Create app metrics
const httpRequestsTotalCounter = new client.Counter ({
    name: "demo_http_requests_total",
    help: "Demo HTTP Total Requests",
    labelNames: ["controller", "path", "method"],
    registers: [appRegistry]
});

const httpRequestExceptionsCounter = new client.Counter ({
    name: "demo_http_exceptions",
    help: "Demo HTTP Exceptions",
    labelNames: ["controller", "path", "method"],
    registers: [appRegistry]
});

const httpRequestBytesCounter = new client.Counter ({
    name: "demo_http_bytes",
    help: "Demo HTTP Bytes",
    labelNames: ["controller", "path", "method"],
    registers: [appRegistry]
});

const httpRequestsGauge = new client.Gauge ({
    name: "demo_http_pending_requests",
    help: "Demo HTTP Pending Requests",
    labelNames: ["controller", "path", "method"],
    registers: [appRegistry]
});

const httpLastRequestGauge = new client.Gauge ({
    name: "demo_http_last_request",
    help: "Demo HTTP Last Request",
    labelNames: ["controller", "path", "method"],
    registers: [appRegistry]
});

const httpLastRequestDuration = new client.Summary ({
    name: "demo_http_request_duration",
    help: "Demo HTTP Request Duration",
    labelNames: ["controller", "path", "method"],
    registers: [appRegistry]
});

function intercept (controller, req, res, next) {
    // console.log({
    //     controller: controller,
    //     headers: req.headers,
    //     url: req.url,
    //     method: req.method,
    //     query: req.query,
    //     params: req.params,
    //     body: req.body
    // });

    httpRequestsTotalCounter.labels(controller, req.url, req.method).inc();
    httpRequestBytesCounter.labels(controller, req.url, req.method).inc(Math.random() * 100);
    httpRequestsGauge.labels(controller, req.url, req.method).inc();
    let end = httpLastRequestDuration.labels(controller, req.url, req.method).startTimer();

    try {
        if (Math.random() < 0.2) {
            throw 'Random failure'
        }
        
        next();
    } catch (e) {
        httpRequestExceptionsCounter.labels(controller, req.url, req.method).inc();
    }

    httpRequestsGauge.labels(controller, req.url, req.method).dec();
    httpLastRequestGauge.labels(controller, req.url, req.method).setToCurrentTime();
    end();
}

module.exports.registry = appRegistry;
module.exports.intercept = intercept;
