var mongoose = require('mongoose'),
    restify = require('restify'),
    chai = require('chai'),
    expect = chai.expect,
    should = chai.should(),
    request = require('supertest'),
    async = require('async'),
    app = require('../server'),
    User = mongoose.model('User'),
    consts = require("../config/consts"),
    moment = require('moment'),
    Factory = require('../libs/factories');

var jsonContentType = 'application/json',
    token = '',
    count = 0;

var missingError = new restify.MissingParameterError().statusCode, // 409
    validationError = 500,
    authorizedError = new restify.NotAuthorizedError().statusCode, // 403
    createdStatusCode = 201,
    successStatusCode = 200,
    notFoundError = 404;

describe('Register api post:' + consts.url_user_register, function() {
    describe('Invalid paramters', function() {
        before(function(done) {
            // delete all table user
            async.parallel([

                function(cb) {
                    User.collection.remove(cb);
                }
            ], done);
        });
        it('return ' + validationError + ' statuscode when all params missing', function(done) {
            request(app).post(consts.url_user_register)
                .expect('Content-Type', jsonContentType)
                .expect(validationError)
                .end(done);
        });
        it('return ' + validationError + ' statuscode when email missing', function(done) {
            Factory.build('user1', function(user) {
                request(app).post(consts.url_user_register)
                    .field('fullname', user.fullname)
                    .field('password', user.password)
                    .expect('Content-Type', jsonContentType)
                    .expect(validationError)
                    .end(done);
            });
        });
        it('return ' + validationError + ' statuscode when email format not correct', function(done) {
            Factory.build('user1', function(user) {
                request(app).post(consts.url_user_register)
                    .field('fullname', user.fullname)
                    .field('email', 'test')
                    .field('password', user.password)
                    .expect('Content-Type', jsonContentType)
                    .expect(validationError)
                    .end(done);
            });
        });
        it('return ' + validationError + ' statuscode when password missing', function(done) {
            Factory.build('user1', function(user) {
                request(app).post(consts.url_user_register)
                    .field('fullname', user.fullname)
                    .field('email', user.email)
                    .expect('Content-Type', jsonContentType)
                    .expect(validationError)
                    .end(done);
            });
        });
        it('should not save the user to the database', function(done) {
            User.count(function(err, cnt) {
                count.should.equal(cnt)
                done()
            })
        })
    });
    describe('Valid paramters', function() {
        before(function(done) {
            User.count(function(err, cnt) {
                count = cnt
                done()
            })
        })
        it('return ' + createdStatusCode + ' statusCode when create user success', function(done) {
            Factory.build('user1', function(user) {
                request(app).post(consts.url_user_register)
                    .field('fullname', user.fullname)
                    .field('email', user.email)
                    .field('password', user.password)
                    .expect('Content-Type', jsonContentType)
                    .expect(createdStatusCode)
                    .end(done);
            });
        });
        it('should save the user to the database', function(done) {
            User.count(function(err, cnt) {
                cnt.should.equal(count + 1);
                done()
            })
        })
    });
    describe('register another user invalid email', function() {
        before(function(done) {
            User.count(function(err, cnt) {
                count = cnt
                done()
            })
        })
        it('return ' + validationError + ' statusCode when create user with exists email', function(done) {
            Factory.build('user1', function(user1) {
                Factory.build('user2', function(user2) {
                    request(app).post(consts.url_user_register)
                        .field('fullname', user2.fullname)
                        .field('email', user1.email)
                        .field('password', user2.password)
                        .expect('Content-Type', jsonContentType)
                        .expect(validationError)
                        .end(done);
                });
            });
        });
        it('should not save the user to the database', function(done) {
            User.count(function(err, cnt) {
                count.should.equal(cnt)
                done()
            })
        })
    });
    describe('register another user valid', function() {
        before(function(done) {
            User.count(function(err, cnt) {
                count = cnt
                done()
            })
        })
        it('return ' + createdStatusCode + ' statusCode when create anotjer user with different email', function(done) {
            Factory.build('user2', function(user) {
                request(app).post(consts.url_user_register)
                    .field('fullname', user.fullname)
                    .field('email', user.email)
                    .field('password', user.password)
                    .expect('Content-Type', jsonContentType)
                    .expect(createdStatusCode)
                    .end(done);
            });
        });
        it('should save the user to the database', function(done) {
            User.count(function(err, cnt) {
                cnt.should.equal(count + 1);
                done()
            })
        })
    });
});

describe('Login api post:' + consts.url_user_login, function() {
    describe('Invalid paramters', function() {
        it('return ' + missingError + ' when all params missing', function(done) {
            request(app).post(consts.url_user_login)
                .expect(missingError)
                .end(done);
        });
        it('return ' + missingError + ' when email missing', function(done) {
            Factory.build('user1', function(user) {
                request(app).post(consts.url_user_login)
                    .field('password', user.password)
                    .expect('Content-Type', jsonContentType)
                    .expect(missingError)
                    .end(done);
            });
        });
        it('return ' + missingError + ' when password missing', function(done) {
            Factory.build('user1', function(user) {
                request(app).post(consts.url_user_login)
                    .field('email', user.email)
                    .expect('Content-Type', jsonContentType)
                    .expect(missingError)
                    .end(done);
            });
        });
        it('return ' + authorizedError + ' when email or password not correct', function(done) {
            Factory.build('user1', function(user1) {
                Factory.build('user2', function(user2) {
                    request(app).post(consts.url_user_login)
                        .field('email', user1.email)
                        .field('password', user2.password)
                        .expect('Content-Type', jsonContentType)
                        .expect(authorizedError)
                        .end(done);
                });
            });
        });
    });
    describe('Valid paramters', function() {
        it('return ' + successStatusCode + ' when login success and return token', function(done) {
            Factory.build('user1', function(user) {
                request(app).post(consts.url_user_login)
                    .field('email', user.email)
                    .field('password', user.password)
                    .expect('Content-Type', jsonContentType)
                    .expect(successStatusCode)
                    .end(function(err, res) {
                        if (err) console.log(res.body);
                        res.statusCode.should.equal(successStatusCode);
                        token = res.body.token;
                        should.exist(token);
                        done();
                    });
            });
        });
        it('should save new token to user', function(done) {
            var query = {
                token: token
            };
            User.find(query, function(err, data) {
                should.exist(data);
                done()
            })
        })
        it('return ' + successStatusCode + ' when login again success and return old token', function(done) {
            Factory.build('user1', function(user) {
                request(app).post(consts.url_user_login)
                    .field('email', user.email)
                    .field('password', user.password)
                    .expect('Content-Type', jsonContentType)
                    .expect(successStatusCode)
                    .end(function(err, res) {
                        if (err) console.log(res.body);
                        res.statusCode.should.equal(successStatusCode);
                        var newToken = res.body.token;
                        should.exist(newToken);
                        newToken.should.equal(token);
                        done();
                    });
            });
        });
    });
});

describe('Get user info api get:' + consts.url_user_get, function() {
    describe("Invalid paramters", function() {
        it('return ' + notFoundError + ' when token missing', function(done) {
            request(app).get(consts.url_user_get.replace(':token', ''))
                .expect('Content-Type', jsonContentType)
                .expect(notFoundError)
                .end(done);
        });
        it('return ' + authorizedError + ' when fake token "123ABC" not correct', function(done) {
            request(app).get(consts.url_user_get.replace(':token', "123ABC"))
                .expect('Content-Type', jsonContentType)
                .expect(authorizedError)
                .end(done);
        });
    });
    describe('Valid paramters', function() {
        it('return ' + successStatusCode + ' when token correct', function(done) {
            request(app).get(consts.url_user_get.replace(':token', token))
                .expect('Content-Type', jsonContentType)
                .expect(successStatusCode)
                .end(done);
        });
    });
});

describe('Update user api put:' + consts.url_user_update, function() {
    it('return ' + successStatusCode + ' when update fullname success', function(done) {
        Factory.build('user2', function(user) {
            request(app).put(consts.url_user_update.replace(':token', token))
                .field('fullname', user.fullname)
                .expect('Content-Type', jsonContentType)
                .expect(successStatusCode)
                .end(function(err, res) {
                    if (err) console.log(res.body);
                    expect(res).to.exist;
                    expect(res.statusCode).to.equal(successStatusCode);
                    expect(res.body.fullname).to.equal(user.fullname);
                    done();
                })
        });
    })
    it('return ' + successStatusCode + ' when update password success', function(done) {
        Factory.build('user2', function(user) {
            request(app).put(consts.url_user_update.replace(':token', token))
                .field('password', user.password)
                .expect('Content-Type', jsonContentType)
                .expect(successStatusCode)
                .end(function(err, res) {
                    if (err) console.log(res.body);
                    expect(res).to.exist;
                    expect(res.statusCode).to.equal(successStatusCode);
                    done();
                })
        });
    })
    it('return ' + successStatusCode + ' when update both fullname & password success', function(done) {
        Factory.build('user2', function(user) {
            request(app).put(consts.url_user_update.replace(':token', token))
                .field('fullname', user.fullname)
                .field('password', user.password)
                .expect('Content-Type', jsonContentType)
                .expect(successStatusCode)
                .end(function(err, res) {
                    if (err) console.log(res.body);
                    expect(res).to.exist;
                    expect(res.statusCode).to.equal(successStatusCode);
                    expect(res.body.fullname).to.equal(user.fullname);
                    done();
                })
        });
    })
});

describe('Logout api post:' + consts.url_user_logout, function() {
    describe('Invalid paramters', function() {
        it('return ' + authorizedError + ' when token missing', function(done) {
            request(app).post(consts.url_user_logout)
                .expect('Content-Type', jsonContentType)
                .expect(authorizedError)
                .end(function(err, res) {
                    if (err) console.log(res.body);
                    done();
                });
        });
        it('return ' + authorizedError + ' when fake token "123ABC" not correct', function(done) {
            request(app).post(consts.url_user_logout)
                .field('token', '123ABC')
                .expect('Content-Type', jsonContentType)
                .expect(authorizedError)
                .end(function(err, res) {
                    if (err) console.log(res.body);
                    done();
                });
        });
    });
    describe('Valid paramters', function() {
        it('return ' + successStatusCode + ' when token correct', function(done) {
            request(app).post(consts.url_user_logout)
                .field('token', token)
                .expect(successStatusCode)
                .end(function(err, res) {
                    if (err) console.log(res.body);
                    done();
                });
        });
    });
});