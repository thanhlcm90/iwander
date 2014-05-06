/**
 * Authorization middleware module
 */
var restify = require('restify'),
  mongoose = require('mongoose'),
  env = process.env.NODE_ENV || 'development',
  User = mongoose.model('User');

/**
 * This method is check tokken for every api request
 * return 403 NotAuthorizedError when token param is missing or not correct, else next
 *
 * @param request
 * @param response
 * @param next method
 */
exports.checkToken = function(req, res, next) {
  var token = req.params.token;
  if (env !== 'test') console.log("authorization checkToken: " + token);
  if (token && token.length) {
    // Having token, query user with token
    var query = {
      token: token
    };
    User.findOne(query, function(err, user) {
      next.ifError(err);
      if (user === null) {
        // not found, return error NotAuthorized
        next(new restify.NotAuthorizedError("Access restricted."));
      } else {
        // save user to request to another routes need user information
        req.user = user;
        // found, next callback
        next();
      }
    });
  } else {
    // token is null, return error NotAuthorized
    next(new restify.NotAuthorizedError("Access restricted."));
  }
};