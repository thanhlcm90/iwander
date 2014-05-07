// dependencies
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    ObjectId = mongoose.Types.ObjectId,
    restify = require('restify'),
    moment = require('moment'),
    utils = require('../libs/utils'),
    consts = require(__config_path + "/consts");

module.exports = function(app) {

    /**
     * This method for request update user profile
     *
     * Response:
     *  - return 404 NotFoundError      when token param missing
     *  - return 403 NotAuthorizedError when token param is missing or not correct
     *  - return 200 OK                 when change successfully
     */
    function updateUser(req, res, next) {
        var token = req.params.token;
        var query = {
            token: token
        };
        User.findOne(query, function(err, data) {
            next.ifError(err);
            if (utils.checkNotNull(req.params.fullname)) {
                data.fullname = req.params.fullname;
            }
            if (utils.checkNotNull(req.params.password)) {
                data.password = req.params.password;
            }
            data.save(function(err, data) {
                if (err) console.log(err);
                next.ifError(err);
                res.send(data);
                next();
            });
        });
    }

    /**
     * This method for request get user api
     *
     * Response:
     *  - return 404 NotFoundError      when token param missing
     *  - return 403 NotAuthorizedError when token param is missing or not correct
     *  - return 200 and User data json when token param is correct and get user data successfully
     *
     * @param request
     * @param response
     * @param next method
     */
    function getUser(req, res, next) {
        var token = req.params.token;
        var query = {
            token: token
        };
        User.findOne(query, consts.user_column_query, function(err, data) {
            next.ifError(err);
            res.send(data);
            next();
        });
    }

    /**
     * This method for register new user api
     *
     * Response:
     *  - return 500 InternalError  when email, password param missing or not correct format
     *  - return 500 InternalError  when register with exist email
     *  - return 201 Created        when register user is successfully
     *
     * @param request
     * @param response
     * @param next method
     */
    function register(req, res, next) {
        // Create a new user model, fill it up and save it to Mongodb
        var user = new User();
        user.fullname = req.params.fullname;
        user.email = req.params.email;
        user.password = req.params.password;
        user.save(function(err) {
            next.ifError(err);
            // delete row hashed_password
            user.hashed_password = undefined;
            // save succesfully, return status code 201 with user json
            res.send(201, user);
            next();
        });
    }

    /**
     * This method for login user api.
     *
     * We will check email & password, if it correct, check token. If token exists, return current token
     * If token not exists, generate a new token
     *
     * Response:
     *  - return 409 MissingParameterError  when email, password param missing or not correct format
     *  - return 403 NotAuthorizedError     when password not correct with email
     *  - return 200 OK                     when success
     *
     * @param request
     * @param response
     * @param next method
     */
    function login(req, res, next) {
        // get email and password params and check params exists
        var email = req.params.email;
        var password = req.params.password;
        if (email && password && email.length && password.length) {
            // query user with email
            var query = {
                email: email
            };
            User.findOne(query, '+hashed_password', function(err, data) {
                if (!err) { // query successfully
                    if (data === null) { // not found user
                        return next(new restify.NotAuthorizedError("email doesn't exists"));
                    } else { // found user
                        if (!data.authenticate(password)) { // check password is correct?
                            return next(new restify.NotAuthorizedError("password isn't correct"));
                        } else {
                            // email, password are correct, check token
                            var token = data.token;
                            if (token && token.length) { // token exists
                                // delete row hashed_password
                                data.hashed_password = undefined;
                                // return status code 200 with current token
                                res.send(200, data);
                            } else {
                                // generate new token (mongo ObjectId)
                                token = new ObjectId().toString();
                                data.token = token;
                                // save new token
                                data.save(function(err) {
                                    if (!err) {
                                        // delete row hashed_password
                                        data.hashed_password = undefined;
                                        // save successfully, return status code 200 with new token
                                        res.send(200, data);
                                        return next();
                                    } else {
                                        return next(err);
                                    }
                                });
                            }
                        }
                    }
                } else {
                    var errObj = err;
                    if (err.err) {
                        errObj = err.err;
                    }
                    return next(new restify.InternalError(errObj));
                }
            });
        } else {
            return next(new restify.MissingParameterError("email param or password param is missing."));
        }
    }

    /**
     * This method for logout user api
     *
     * We will check user id, if exists, reset user token
     *
     * Response:
     *  - return 403 NotAuthorizedError when token param is missing or not correct
     *  - return 200 OK                 when token param is correct and get user data successfully
     *
     * @param request
     * @param response
     * @param next method
     */
    function logout(req, res, next) {
        var token = req.params.token;
        var query = {
            token: token
        };
        User.findOne(query, function(err, user) {
            if (!err && user !== null) {
                // found, reset user token and save
                user.token = null;
                user.save(function(err) {
                    if (!err) {
                        // saving successfully, send status code 200
                        res.send(200);
                        return next();
                    } else {
                        return next(err);
                    }
                });
            } else {
                return next(new restify.NotAuthorizedError("Access restricted."));
            }
        });
    }

    // setup route for user
    app.get(consts.url_user_get, getUser);
    app.post(consts.url_user_register, register);
    app.post(consts.url_user_login, login);
    app.post(consts.url_user_logout, logout);
    app.put(consts.url_user_update, updateUser);
};