var mongoose = require('mongoose'),
    ObjectId = mongoose.Types.ObjectId,
    restify = require('restify'),
    chai = require('chai'),
    expect = chai.expect,
    should = chai.should(),
    request = require('supertest'),
    async = require('async'),
    app = require('../server'),
    User = mongoose.model('User'),
    Place = mongoose.model('Place'),
    consts = require("../config/consts"),
    moment = require('moment'),
    Factory = require('../libs/factories');

var jsonContentType = 'application/json',
    token = '',
    count = 0;

var validationError = new restify.MissingParameterError().statusCode, // 409
    authorizedError = new restify.NotAuthorizedError().statusCode, // 403
    createdStatusCode = 201,
    successStatusCode = 200,
    notFoundError = 404;

describe('Log time api put:' + consts.url_place_log_time, function() {
    describe('Invalid parammeters', function() {
        before(function(done) {
            // clear place, user, init one user and get token
            async.series([

                function(cb) {
                    Place.collection.remove(cb);
                },
                function(cb) {
                    User.collection.remove(cb);
                },
                function(cb) {
                    Factory.create('user1', function(user) {
                        token = new ObjectId().toString();
                        user.token = token;
                        user.save(cb);
                    });
                }
            ], done);
        });
        it('return ' + authorizedError + ' when token param missing', function(done) {
            request(app).put(consts.url_place_log_time)
                .expect('Content-Type', jsonContentType)
                .expect(authorizedError)
                .end(done);
        });
        it('return ' + authorizedError + ' when fake token "123" not correct', function(done) {
            request(app).put(consts.url_place_log_time)
                .field("token", "123")
                .expect('Content-Type', jsonContentType)
                .expect(authorizedError)
                .end(done);
        });
        it('return ' + validationError + ' when country_name param missing', function(done) {
            Factory.build('place1', function(place) {
                request(app).put(consts.url_place_log_time)
                    .field("token", token)
                    .field("lng", place.lng)
                    .field("lat", place.lat)
                    .field("time", "2014-01-01T06:00:00")
                    .expect('Content-Type', jsonContentType)
                    .expect(validationError)
                    .end(done);
            });
        });
        it('should not save place to database', function(done) {
            Place.count(function(err, cnt) {
                cnt.should.equal(0);
                done();
            });
        });
    });

    describe('Valid parammeters', function() {
        it('return ' + successStatusCode + ' when log vietnam time_start 2014-01-01T06:00:00, time_end 2014-01-01T18:00:00 success', function(done) {
            Factory.build('place1', function(place) {
                request(app).put(consts.url_place_log_time)
                    .field("token", token)
                    .field("country_name", place.country_name)
                    .field("lng", place.lng)
                    .field("lat", place.lat)
                    .field("time_start", "2014-01-01T06:00:00")
                    .expect(successStatusCode)
                    .end(function(err, res) {
                        if (err) console.log(res.body);
                        res.statusCode.should.equal(successStatusCode);
                        done();
                    });
            });
        });
        it('should count 1 place to database and data would correct', function(done) {
            async.series([

                function(cb) {
                    // count 1 item
                    Place.count(function(err, cnt) {
                        cnt.should.equal(1);
                        cb();
                    });
                },
                function(cb) {
                    // check spent equal 1, time_start, time_end must correct
                    var where = {
                        country_name: 'vietnam'
                    };
                    Place.findOne(where, function(err, data) {
                        data.spent.should.equal(1);
                        cb();
                    });
                },
            ], done);
        });

        it('return ' + successStatusCode + ' when log vietnam again time_start 2014-01-01T08:00:00, time_end 2014-01-01T18:00:00 success', function(done) {
            Factory.build('place1', function(place) {
                request(app).put(consts.url_place_log_time)
                    .field("token", token)
                    .field("country_name", place.country_name)
                    .field("lng", place.lng)
                    .field("lat", place.lat)
                    .field("time_start", "2014-01-01T08:00:00")
                    .expect(successStatusCode)
                    .end(function(err, res) {
                        if (err) console.log(res.body);
                        res.statusCode.should.equal(successStatusCode);
                        done();
                    });
            });
        });
        it('return ' + successStatusCode + ' when log israel time_start 2014-01-01T06:00:00 success', function(done) {
            Factory.build('place2', function(place) {
                request(app).put(consts.url_place_log_time)
                    .field("token", token)
                    .field("country_name", place.country_name)
                    .field("lng", place.lng)
                    .field("lat", place.lat)
                    .field("time_start", "2014-01-02T06:00:00")
                    .expect(successStatusCode)
                    .end(function(err, res) {
                        if (err) console.log(res.body);
                        res.statusCode.should.equal(successStatusCode);
                        done();
                    });
            });
        });

        it('should count 2 place to database and data would correct', function(done) {
            async.series([

                function(cb) {
                    // count 2 item
                    Place.count(function(err, cnt) {
                        cnt.should.equal(2);
                        cb();
                    });
                },
                function(cb) {
                    // check spent equal 0.5, time_start must correct, time_end must null
                    var where = {
                        country_name: 'israel'
                    };
                    Place.findOne(where, function(err, data) {
                        data.spent.should.equal(1);
                        cb();
                    });
                },
            ], done);
        });
    });
});


describe('Get day spent api get:' + consts.url_place_get_date_spent, function() {
    describe('Invalid parammeters', function() {
        it('return ' + authorizedError + ' when token param missing', function(done) {
            request(app).get(consts.url_place_get_date_spent.replace(':country_name', 'vietnam'))
                .expect('Content-Type', jsonContentType)
                .expect(authorizedError)
                .end(done);
        });
        it('return ' + authorizedError + ' when fake token "123" not correct', function(done) {
            request(app).get(consts.url_place_get_date_spent.replace(':country_name', 'vietnam') + "?token=123")
                .expect('Content-Type', jsonContentType)
                .expect(authorizedError)
                .end(done);
        });
        it('return ' + validationError + ' when country_name params missing', function(done) {
            request(app).get(consts.url_place_get_date_spent.replace(':country_name', '') + "?token=" + token)
                .expect('Content-Type', jsonContentType)
                .expect(validationError)
                .end(done);
        });
    });
    describe('Valid parammeters', function() {
        before(function(done) {
            Place.remove(done);
        });
        it('return ' + successStatusCode + ' when log vietnam', function(done) {
            async.each([1, 3, 7], function(item, cb) {
                Factory.build('place1', function(place) {
                    request(app).put(consts.url_place_log_time)
                        .field("token", token)
                        .field("country_name", place.country_name)
                        .field("lng", place.lng)
                        .field("lat", place.lat)
                        .field("time_start", '2014-01-0' + item + 'T06:00:00+0000')
                        .expect(successStatusCode)
                        .end(function(err, res) {
                            if (err) console.log(res.body);
                            res.statusCode.should.equal(successStatusCode);
                            cb();
                        });
                });
            }, done);
        });

        it('return ' + successStatusCode + ' when log israel', function(done) {
            async.each([4, 11, 26], function(item, cb) {
                Factory.build('place2', function(place) {
                    request(app).put(consts.url_place_log_time)
                        .field("token", token)
                        .field("country_name", place.country_name)
                        .field("lng", place.lng)
                        .field("lat", place.lat)
                        .field("time_start", '2014-01-' + (item < 10 ? '0' + item : item) + 'T06:00:00+0000')
                        .expect(successStatusCode)
                        .end(function(err, res) {
                            if (err) console.log(res.body);
                            res.statusCode.should.equal(successStatusCode);
                            cb();
                        });
                });
            }, done);
        });

        it('return ' + successStatusCode + ' when log china', function(done) {
            async.each([18, 20, 22], function(item, cb) {
                Factory.build('place3', function(place) {
                    request(app).put(consts.url_place_log_time)
                        .field("token", token)
                        .field("country_name", place.country_name)
                        .field("lng", place.lng)
                        .field("lat", place.lat)
                        .field("time_start", '2014-01-' + item + 'T06:00:00+0000')
                        .expect(successStatusCode)
                        .end(function(err, res) {
                            if (err) console.log(res.body);
                            res.statusCode.should.equal(successStatusCode);
                            cb();
                        });
                });
            }, done);
        });
        it('return ' + successStatusCode + ' and spent = 5 when get spent day of vietnam using ITA method', function(done) {
            request(app).get(consts.url_place_get_date_spent.replace(':country_name', 'vietnam') + "?token=" + token)
                .expect('Content-Type', jsonContentType)
                .expect(successStatusCode)
                .end(function(err, res) {
                    res.statusCode.should.equal(successStatusCode);
                    res.body.spent.should.equal(5);
                    done();
                });
        });
        it('return ' + successStatusCode + ' and spent = 7 when get spent day of vietnam using REGULAR method', function(done) {
            request(app).get(consts.url_place_get_date_spent.replace(':country_name', 'vietnam') + "?token=" + token + "&method=regular")
                .expect('Content-Type', jsonContentType)
                .expect(successStatusCode)
                .end(function(err, res) {
                    res.statusCode.should.equal(successStatusCode);
                    res.body.spent.should.equal(7);
                    done();
                });
        });

        it('return ' + successStatusCode + ' and spent = 14 when get spent day of israel using ITA method', function(done) {
            request(app).get(consts.url_place_get_date_spent.replace(':country_name', 'israel') + "?token=" + token)
                .expect('Content-Type', jsonContentType)
                .expect(successStatusCode)
                .end(function(err, res) {
                    res.statusCode.should.equal(successStatusCode);
                    res.body.spent.should.equal(14);
                    done();
                });
        });
        it('return ' + successStatusCode + ' and spent = 11 when get spent day of israel using REGULAR method', function(done) {
            request(app).get(consts.url_place_get_date_spent.replace(':country_name', 'israel') + "?token=" + token + "&method=regular")
                .expect('Content-Type', jsonContentType)
                .expect(successStatusCode)
                .end(function(err, res) {
                    res.statusCode.should.equal(successStatusCode);
                    res.body.spent.should.equal(11);
                    done();
                });
        });

        it('return ' + successStatusCode + ' and spent = 7 when get spent day of china using ITA method', function(done) {
            request(app).get(consts.url_place_get_date_spent.replace(':country_name', 'china') + "?token=" + token)
                .expect('Content-Type', jsonContentType)
                .expect(successStatusCode)
                .end(function(err, res) {
                    res.statusCode.should.equal(successStatusCode);
                    res.body.spent.should.equal(7);
                    done();
                });
        });
        it('return ' + successStatusCode + ' and spent = 8 when get spent day of china using REGULAR method', function(done) {
            request(app).get(consts.url_place_get_date_spent.replace(':country_name', 'china') + "?token=" + token + "&method=regular")
                .expect('Content-Type', jsonContentType)
                .expect(successStatusCode)
                .end(function(err, res) {
                    res.statusCode.should.equal(successStatusCode);
                    res.body.spent.should.equal(8);
                    done();
                });
        });
    });
});

describe('Get list place and day spent', function() {
    describe('Invalid parammeters', function() {
        it('return ' + authorizedError + ' when token param missing', function(done) {
            request(app).get(consts.url_place_list)
                .expect('Content-Type', jsonContentType)
                .expect(authorizedError)
                .end(done);
        });
        it('return ' + authorizedError + ' when fake token "123" not correct', function(done) {
            request(app).get(consts.url_place_list + "?token=123")
                .expect('Content-Type', jsonContentType)
                .expect(authorizedError)
                .end(done);
        });
    });
    describe('Valid parammeters', function() {
        it('return ' + successStatusCode + ' and have 3 item (vietnam-5, israel-14, china-7) when get list place with day spent using ITA method', function(done) {
            request(app).get(consts.url_place_list + "?token=" + token)
                .expect('Content-Type', jsonContentType)
                .expect(successStatusCode)
                .end(function(err, res) {
                    res.statusCode.should.equal(successStatusCode);
                    res.body.length.should.equal(3);
                    res.body[0]._id.should.equal('vietnam');
                    res.body[0].spent.should.equal(5);
                    res.body[1]._id.should.equal('israel');
                    res.body[1].spent.should.equal(14);
                    res.body[2]._id.should.equal('china');
                    res.body[2].spent.should.equal(7);
                    done();
                });
        });
    });
    describe('Valid parammeters', function() {
        it('return ' + successStatusCode + ' and have 3 item (vietnam-7, israel-11, china-8) when get list place with day spent using REGULAR method', function(done) {
            request(app).get(consts.url_place_list + "?token=" + token + "&method=regular")
                .expect('Content-Type', jsonContentType)
                .expect(successStatusCode)
                .end(function(err, res) {
                    res.statusCode.should.equal(successStatusCode);
                    res.body.length.should.equal(3);
                    res.body[0]._id.should.equal('vietnam');
                    res.body[0].spent.should.equal(7);
                    res.body[1]._id.should.equal('israel');
                    res.body[1].spent.should.equal(11);
                    res.body[2]._id.should.equal('china');
                    res.body[2].spent.should.equal(8);
                    done();
                });
        });
    });
});