const interceptor = require('./../interceptors/prom-interceptor');
const router = require('express').Router();

// Use middleware to intercept all calls and instrument
router.use(function(req, res, next) {
    interceptor.intercept('configuration', req, res, next);
});

router.get('/setting', function(req, res) {
    return res.send("configuration controller: " + req.url);
});

module.exports = router;