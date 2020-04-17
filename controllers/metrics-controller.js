const interceptor = require('./../interceptors/prom-interceptor');
const router = require('express').Router();

router.get("/", (req, res) => {
    console.log(`${new Date()} I am being scraped....yay....`);
    console.log(`Metrics ${interceptor.registry.metrics()}`);
    res.set("Content-Type", interceptor.registry.contentType);
    res.end(interceptor.registry.metrics());
});

module.exports = router;