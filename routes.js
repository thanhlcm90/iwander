/**
 * Routes module for parsing requests
 */
var fs = require('fs'),
  mongoose = require('mongoose'),
  config = require(__config_path + "/config").get();

module.exports = function(app) {
  /**
   * get static content
   * All GETs to /public return resources (i.e. images)
   *
   *       This is the suggested way with restify, not sure why it doesn't work:
   *          restify.serveStatic({directory: config.root + '/public'});
   *
   * @param path
   * @param request
   * @param response
   */
  app.get(/\/public\/?.*/, function(req, res) {
    var fileStream = fs.createReadStream(config.root + req.url);
    fileStream.pipe(res);
  });

  /**
   * Ping the API server
   * Kind of pointless since the server has to be up to even respond, but demonstrates most basic API
   *
   * @param path
   * @param request
   * @param response
   */
  app.get('/api', function(req, res) {
    res.send({
      'message': 'Success'
    });
  });



  /**
   * Ping the Database server
   * A little more useful than the ping API
   *
   * I looked at header based API versioning, not a fan, but also when I tried this, the atatic resource GETs hang
   *   app.get({path : '/db', version : '1.0.0'}, ...
   *   app.get({path : '/db', version : '2.0.0'}, ...
   *
   * @param path
   * @param request
   * @param response
   */
  app.get('/db', function(req, res) {
    var result = '';
    mongoose.connection.db.executeDbCommand({
      'ping': '1'
    }, function(err, dbres) {
      if (err === null) {
        res.send(dbres);
      } else {
        res.send(err);
      }
    });
  });

  // load all routes
  fs.readdirSync(__routes_path).forEach(function(file) {
    // ignore .ds_store file in MAC OS
    if (~file.indexOf('.js')) {
      console.log("Loading route " + file);
      require(__routes_path + '/' + file)(app);
    }
  });

};