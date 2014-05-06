module.exports = {
    init: function(env) {
        this.singletonRef = this[env];
        return this.singletonRef;
    },
    get: function() {
        return this.singletonRef;
    },
    test: {
        mode: 'test',
        root: require('path').normalize(__dirname + '/..'),
        app: {
            name: 'iWander test mode',
            version: '0.0.1'
        },
        host: 'localhost',
        port: '8082',
        db_prefix: 'mongodb',
        db_port: '27017',
        db_database: 'iwander-test',
        session_timeout: 1200000 // defaults to 20 minutes, in ms (20 * 60 * 1000)
        ,
        ephemeral_cookie: false // if true, session cookie expires when browser closes
    },
    development: {
        mode: 'dev',
        root: require('path').normalize(__dirname + '/..'),
        app: {
            name: 'iWander dev mode',
            version: '0.0.1'
        },
        host: 'localhost',
        port: '8081',
        db_prefix: 'mongodb',
        db_port: '27017',
        db_database: 'iwander-dev',
        session_timeout: 1200000 // defaults to 20 minutes, in ms (20 * 60 * 1000)
        ,
        ephemeral_cookie: false // if true, session cookie expires when browser closes
    },
    production: {
        mode: 'pro',
        root: require('path').normalize(__dirname + '/..'),
        app: {
            name: 'iWander production mode',
            version: '0.0.1'
        },
        host: 'localhost',
        port: '8080',
        db_prefix: 'mongodb',
        db_port: '27017',
        db_database: 'iwander-pro',
        session_timeout: 1200000 // defaults to 20 minutes, in ms (20 * 60 * 1000)
        ,
        ephemeral_cookie: false // if true, session cookie expires when browser closes
    }
}