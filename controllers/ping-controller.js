const interceptor = require('./../interceptors/prom-interceptor');
const router = require('express').Router();

// Use middleware to intercept all calls and instrument
router.use(function(req, res, next) {
    interceptor.intercept('ping', req, res, next);
});

router.get('/', function(req, res) {
    return res.send("ping controller: " + req.url);
});

module.exports = router;