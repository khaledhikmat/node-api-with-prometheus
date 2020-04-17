const interceptor = require('./../interceptors/prom-interceptor');
const router = require('express').Router();

// Use middleware to intercept all calls and instrument
router.use(function(req, res, next) {
    interceptor.intercept('hello', req, res, next);
});

router.get('/greeting', function(req, res) {
    return res.send("hello controller: " + req.url);
});

router.get('/buddy', function(req, res) {
    return res.send("hello controller: " + req.url);
});

module.exports = router;