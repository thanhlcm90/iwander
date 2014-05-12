var restify = require('restify'),
    mongoose = require('mongoose'),
    env = process.env.NODE_ENV || 'development',
    config = require('./config').get(),
    auth = require(__config_path + "/authorization"),
    moment = require('moment'),
    consts = require(__config_path + "/consts");
var toobusy;

/*
 * hook for every request, show log api request url
 */
function hookRequest(req, res, next) {
    if (env !== 'test') console.log(moment().format() + ': api request ' + req.method + ":" + req.url);
    if (req.url.indexOf(consts.url_user_register) === 0 || req.url.indexOf(consts.url_user_login) === 0) {
        next();
    } else {
        auth.checkToken(req, res, next);
    }
}
/*
 * hook for every request with Busy, show log api request url
 */
function hookRequestWithBusy(req, res, next) {
    console.log("Loading toobusy");
    // check if computer too busy
    if (toobusy()) {
        res.send(503, "I'm busy right now, sorry.");
    } else {
        hookRequest(req, res, next);
    }
}

module.exports = function(app, sessionKey) {
    if (config.mode === 'dev') {
        var longjohn = require("longjohn");
        longjohn.async_trace_limit = 5; // defaults to 10
        longjohn.empty_frame = 'ASYNC CALLBACK';
    }

    app.use(restify.queryParser());
    app.use(restify.gzipResponse());
    app.use(restify.bodyParser());

    var os = require('os');
    console.log("os: " + os.platform() + ", " + os.release());
    // having issues on WIndows with nodegyp and toobusy, Windows SDK solution works on some platforms
    // https://github.com/TooTallNate/node-gyp/#installation
    if (os.platform().indexOf('win') === 0) {
        toobusy = require('toobusy');
        app.use(hookRequestWithBusy);
    } else {
        app.use(hookRequest);
    }
    // handle uncaught exception, return status code 500
    app.on('uncaughtException', function(req, res, route, err) {
        // log it
        console.error(err.stack);

        // respond with 500 "Internal Server Error".
        res.send(500, "Server has error, please contact Administrator");
    });
};