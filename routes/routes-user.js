// dependencies
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    ObjectId = mongoose.Types.ObjectId,
    restify = require('restify'),
    moment = require('moment'),
    validator = require('validator'),
    consts = require(__config_path + "/consts");

module.exports = function(app) {

    /**
     * This method for request update user profile
     *
     * Params:
     *  - token:        token authencate
     *  - fullname:     new user fullname
     *  - password:     new user password
     *
     * Response:
     *  - return 404 NotFoundError      when token param missing
     *  - return 403 NotAuthorizedError when token param is missing or not correct
     *  - return 200 OK                 when change successfully
     */
    function updateUser(req, res, next) {
        // get user model from request
        var user = req.user;
        if (validator.isNull(req.params.fullname) && validator.isNull(req.params.password)) {
            return next(new restify.MissingParameterError('fullname or password cannot be blank'));
        }
        if (!validator.isNull(req.params.fullname)) {
            user.fullname = req.params.fullname;
        }
        if (!validator.isNull(req.params.password)) {
            // when change password, need oldpassword to confirm
            var oldPassword = req.params.oldpassword;
            // check old password not null
            if (validator.isNull(oldPassword)) {
                return next(new restify.MissingParameterError('Change password, old password cannot be blank'));
            }
            // check old password is matched current password
            if (!user.authenticate(oldPassword)) {
                return next(new restify.MissingParameterError('Change password, old password not correct'));
            }
            // change password
            user.password = req.params.password;
        }
        user.save(function(err, data) {
            if (err) console.log(err);
            next.ifError(err);
            // delete row hashed_password
            data.hashed_password = undefined;
            res.send(data);
            next();
        });
    }

    /**
     * This method for request get user api
     *
     * Params:
     *  - token:        token authencate
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
        res.send(req.user);
        next();
    }

    /**
     * This method for register new user api
     *
     * Params:
     *  - email:        user email
     *  - fullname:     user fullname
     *  - password:     user password
     *
     * Response:
     *  - return 409 InternalError  when email, password param missing or not correct format or email exists
     *  - return 201 Created        when register user is successfully
     *
     * @param request
     * @param response
     * @param next method
     */
    function register(req, res, next) {
        // validator
        if (validator.isNull(req.params.fullname)) {
            return next(new restify.MissingParameterError('fullname cannot be blank'));
        } else if (validator.isNull(req.params.email)) {
            return next(new restify.MissingParameterError('email cannot be blank'));
        } else if (validator.isNull(req.params.password)) {
            return next(new restify.MissingParameterError('password cannot be blank'));
        } else if (!validator.isEmail(req.params.email)) {
            return next(new restify.MissingParameterError('email is not correct format'));
        }

        User.findOne({
            email: req.params.email.toLowerCase().trim()
        }, function(err, data) {
            next.ifError(err);
            if (data) {
                return next(new restify.MissingParameterError('email is exists'));
            } else {
                // Create a new user model, fill it up and save it to Mongodb
                var user = new User();
                user.fullname = req.params.fullname;
                user.email = req.params.email;
                user.password = req.params.password;
                user.token = new ObjectId().toString();
                user.save(function(err) {
                    next.ifError(err);
                    // delete row hashed_password
                    user.hashed_password = undefined;
                    // save succesfully, return status code 201 with user json
                    res.send(201, user);
                    next();
                });
            }
        });
    }

    /**
     * This method for login user api.
     *
     * We will check email & password, if it correct, check token. If token exists, return current token
     * If token not exists, generate a new token
     *
     * Method: POST
     *
     * Params:
     *  - email:        user email
     *  - password:     user password
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
        var email = req.params.email;
        var password = req.params.password;

        // validator
        if (validator.isNull(email)) {
            return next(new restify.MissingParameterError('email cannot be blank'));
        } else if (validator.isNull(password)) {
            return next(new restify.MissingParameterError('password cannot be blank'));
        } else if (!validator.isEmail(email)) {
            return next(new restify.MissingParameterError('email is not correct format'));
        }

        // get email and password params and check params exists
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
                            if (data.israel_spent_day === undefined) {
                                data.israel_spent_day = 0;
                            }
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
                                    if (data.israel_spent_day === undefined) {
                                        data.israel_spent_day = 0;
                                    }
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
        var user = req.user;
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
    }

    // setup route for user
    app.get(consts.url_user_get, getUser);
    app.post(consts.url_user_register, register);
    app.post(consts.url_user_login, login);
    app.post(consts.url_user_logout, logout);
    app.put(consts.url_user_update, updateUser);
};