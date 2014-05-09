// load configurations for each mode, default is development
var env = process.env.NODE_ENV || 'development',
    config = require('./config/config').init(env);

// dependencies
var restify = require('restify'),
    mongoose = require('mongoose/'),
    fs = require('fs');

// Paths global
global.__models_path = config.root + '/models';
global.__config_path = config.root + '/config';
global.__routes_path = config.root + '/routes';

// setup Database
var connectStr = process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    (config.db_prefix + '://' + config.host + ':' + config.db_port + '/' + config.db_database);
console.log(connectStr);
mongoose.connect(connectStr, {
    server: {
        auto_reconnect: true
    }
});
var db = mongoose.connection;

// log event for database 
db.on('opening', function() {
    console.log("reconnecting... %d", mongoose.connection.readyState);
});
db.once('open', function callback() {
    console.log("Database connection opened.");
});
db.on('error', function(err) {
    console.log("DB Connection error %s", err);
});
db.on('reconnected', function() {
    console.log('MongoDB reconnected!');
});
db.on('disconnected', function() {
    console.log('MongoDB disconnected!');
    // mongoose.connect(connectStr, {
    //     server: {
    //         auto_reconnect: true
    //     }
    // });
});

// Bootstrap models
fs.readdirSync(__models_path).forEach(function(file) {
    // ignore .ds_store file in MAC OS
    if (~file.indexOf('.js')) {
        console.log("Loading model " + file);
        require(__models_path + '/' + file);
    }
});

// create server
var app = restify.createServer({
    name: 'restful'
});
app.on('error', function(err) {
    if (err.errno === 'EADDRINUSE') {
        console.log('Port already in use.');
        process.exit(1);
    } else {
        console.log(err);
    }

});


// config server, restify settings
require(__config_path + '/server-restify')(app);

// config router
require('./routes')(app);

// start the app by listening on <port>
var port = process.env.PORT || config.port;
var host = process.env.HOST || config.host;

app.listen(port);
console.log('App started on ' + host + ':' + port);

module.exports = app;