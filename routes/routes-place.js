// dependencies
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Place = mongoose.model('Place'),
    ObjectId = mongoose.Types.ObjectId,
    restify = require('restify'),
    async = require('async'),
    moment = require('moment'),
    validator = require('validator'),
    consts = require(__config_path + "/consts");

module.exports = function(app) {

    /**
     * API request log time for user location.
     *
     * Request params:
     * 	- token: 		user token
     * 	- lng: 			location lng value
     * 	- lat: 			location lat value
     * 	- country_name: country name
     * 	- time_start:	time start in date
     *  - time_end:     time end in date
     *
     * Response:
     *  - return 409 MissingParameterError  when country_name, time_start param missing or not correct format
     *  - return 403 NotAuthorizedError     when token param missing or not correct
     *  - return 200 OK                     when success
     *
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
    function logTime(req, res, next) {
        // get user info from request after check token
        var user = req.user;
        var lng = req.params.lng;
        var lat = req.params.lat;
        var countryName = req.params.country_name;
        var timeStart = req.params.time_start;
        var timeEnd = req.params.time_end;
        // check validate param time
        if (!validator.isNull(timeStart)) {
            if (moment(timeStart).isValid()) {
                // convert to javascript Date type
                timeStart = moment(timeStart);
            } else {
                return next(new restify.InvalidArgumentError('time_start is not date time'));
            }
        } else {
            return next(new restify.InvalidArgumentError('time_start cannot be blank'));
        }
        if (!validator.isNull(timeEnd) && moment(timeEnd).isValid()) {
            // convert to javascript Date type
            timeEnd = moment(timeEnd);
        }
        // check validate param country_name
        if (validator.isNull(countryName)) {
            return next(new restify.InvalidArgumentError('country_name cannot be blank'));
        }
        // Set start is 00:00:00 of day
        var start = timeStart.clone();
        start.hour(0);
        start.minute(0);
        start.second(0);
        // set end is 23:59:59 of day
        var end = timeStart.clone();
        end.hour(23);
        end.minute(59);
        end.second(59);

        // condition query is user_id, country_name, and start_time between start and end
        var where = {
            user_id: user._id,
            country_name: countryName,
            time_start: {
                $gte: start.toDate(),
                $lte: end.toDate()
            }
        };
        Place.findOne(where, function(err, data) {
            if (err) {
                cb(err);
            } else {
                if (!data) {
                    // 
                    data = new Place();
                    data.user_id = user._id;
                    data.country_name = countryName;
                }
                // if exits, save change lng, lat, time_start, time_end
                data.lng = lng;
                data.lat = lat;
                data.time_start = timeStart.toDate();
                if (timeEnd) {
                    data.time_end = timeEnd.toDate();
                }
                data.save(function(err, data) {
                    next.ifError(err);
                    res.send(200, data);
                });
            }
        });
    }

    function logTimeArray(req, res, next) {
        // get user info from request after check token
        var user = req.user;
        var lng = req.params.lng;
        var lat = req.params.lat;
        var countryName = req.params.country_name;
        var timeStart = req.params.time_start;
        var timeEnd = req.params.time_end;
        if (!Array.isArray(lng)) {
            return next(new restify.InvalidArgumentError('lng is not array'));
        }
        if (!Array.isArray(lat)) {
            return next(new restify.InvalidArgumentError('lat is not array'));
        }
        if (!Array.isArray(countryName)) {
            return next(new restify.InvalidArgumentError('country_name is not array'));
        }
        if (!Array.isArray(timeStart)) {
            return next(new restify.InvalidArgumentError('time_start is not array'));
        }
        if (!Array.isArray(timeEnd)) {
            return next(new restify.InvalidArgumentError('time_end is not array'));
        }
        // check array length is same
        if (lng.length !== lat.length ||
            lng.length !== countryName.length ||
            lng.length !== timeStart.length ||
            lng.length !== timeEnd.length) {
            return next(new restify.InvalidArgumentError('array param length is not same'));
        }
        // check validate for each time_start
        var t;
        for (t in timeStart) {
            if (!validator.isNull(t)) {
                if (moment(t).isValid()) {
                    // convert to javascript Date type
                    t = moment(t);
                } else {
                    return next(new restify.InvalidArgumentError('time_start is not date time'));
                }
            } else {
                return next(new restify.InvalidArgumentError('time_start cannot be blank'));
            }
        }
        // check validate for each time_end
        for (t in timeEnd) {
            if (!validator.isNull(t) && moment(t).isValid()) {
                // convert to javascript Date type
                t = moment(t);
            }
        }
        // check validate param country_name
        for (var c in countryName) {
            if (validator.isNull(c)) {
                return next(new restify.InvalidArgumentError('country_name cannot be blank'));
            }
        }
        var i;
        var obj = [];
        for (i = 0; i < lng.length; i++) {
            obj.push({
                lng: lng[i],
                lat: lat[i],
                countryName: countryName[i],
                timeStart: timeStart[i],
                timeEnd: timeEnd[i]
            });
        }
        var iteration = function(item, cb) {
            // Set start is 00:00:00 of day
            var start = item.timeStart.clone();
            start.hour(0);
            start.minute(0);
            start.second(0);
            // set end is 23:59:59 of day
            var end = time.timeStart.clone();
            end.hour(23);
            end.minute(59);
            end.second(59);

            // condition query is user_id, country_name, and start_time between start and end
            var where = {
                user_id: user._id,
                country_name: item.countryName,
                time_start: {
                    $gte: start.toDate(),
                    $lte: end.toDate()
                }
            };
            Place.findOne(where, function(err, data) {
                if (err) {
                    cb(err);
                } else {
                    if (!data) {
                        var whereAggr = {
                            user_id: user._id,
                            country_name: item.countryName
                        };
                        // group and check if missing data
                        Place.aggregate()
                            .match(whereAggr)
                            .group({
                                _id: '$country_name',
                                lastDate: {
                                    $max: '$time_start'
                                }
                            })
                            .exec(function(err, value) {
                                if (value && value.length > 0) {
                                    var st = moment(value[0].lastDate);
                                    st.hour(0);
                                    st.minute(0);
                                    st.second(0);
                                    st.add('days', 1);
                                    while (st.before(start)) {
                                        console.log('save country: ' + item.countryName + 'st: ' + st.toDate());
                                        var newPlace = new Place();
                                        newPlace.user_id = user._id;
                                        newPlace.country_name = item.countryName;
                                        newPlace.lng = item.lng;
                                        newPlace.lat = item.lat;
                                        newPlace.time_start = st.clone().toDate();
                                        if (item.timeEnd) {
                                            newPlace.time_end = item.timeEnd.toDate();
                                        }
                                        newPlace.save();
                                        st.add('days', 1);
                                    }
                                }
                                data = new Place();
                                data.user_id = user._id;
                                data.country_name = item.countryName;
                                data.lng = item.lng;
                                data.lat = item.lat;
                                data.time_start = item.timeStart.toDate();
                                if (item.timeEnd) {
                                    data.time_end = item.timeEnd.toDate();
                                }
                                data.save(cb);
                            });
                    } else {
                        // if exits, save change lng, lat, time_start, time_end
                        data.lng = item.lng;
                        data.lat = item.lat;
                        data.time_start = item.timeStart.toDate();
                        if (item.timeEnd) {
                            data.time_end = item.timeEnd.toDate();
                        }
                        data.save(cb);
                    }
                }
            });
        };
    }


    /**
     * API get day spent of place in this year
     *
     * Request params:
     *  - token:        user token
     *  - country_name: country name
     *
     * Response:
     *  - return 409 MissingParameterError  when country_name param missing
     *  - return 403 NotAuthorizedError     when token param missing or not correct
     *  - return 200 OK                     when success
     *
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
    function getDateSpent(req, res, next) {
        var user = req.user;
        var countryName = req.params.country_name;
        if (validator.isNull(countryName)) {
            return next(new restify.InvalidArgumentError('country_name cannot be blank'));
        }

        // init start day is begin date of year
        var start = moment();
        start.month(0);
        start.date(1);
        start.hour(0);
        start.minute(0);
        start.second(0);

        // init end day is end date of year
        var end = moment();
        end.month(11);
        end.date(31);
        end.hour(23);
        end.minute(59);
        end.second(59);

        var where = {
            user_id: user._id,
            country_name: countryName.toLowerCase(),
            time_start: {
                $gte: start.toDate(),
                $lte: end.toDate()
            }
        };
        Place.aggregate()
            .match(where)
            .group({
                _id: '$country_name',
                spentSum: {
                    $sum: '$spent'
                }
            })
            .exec(function(err, value) {
                next.ifError(err);
                var spent = 0;
                if (value && value.length > 0) {
                    spent = value[0].spentSum;
                }
                res.send(200, {
                    _id: countryName,
                    spent: spent
                });
            });
    }

    /**
     * API get list place with day spent
     *
     * Request params:
     *  - token:        user token
     *
     * Response:
     *  - return 403 NotAuthorizedError     when token param missing or not correct
     *  - return 200 OK                     when success
     *
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
    function list(req, res, next) {
        var user = req.user;
        // init start day is begin date of year
        var start = moment();
        start.month(0);
        start.date(1);
        start.hour(0);
        start.minute(0);
        start.second(0);

        // init end day is end date of year
        var end = moment();
        end.month(11);
        end.date(31);
        end.hour(23);
        end.minute(59);
        end.second(59);
        var where = {
            user_id: user._id,
            time_start: {
                $gte: start.toDate(),
                $lte: end.toDate()
            }
        };
        Place.aggregate()
            .match(where)
            .sort({
                time_start: 1
            })
            .group({
                _id: '$country_name',
                spent: {
                    $sum: '$spent'
                },
                date: {
                    $push: '$time_start'
                }
            })
            .exec(function(err, value) {
                next.ifError(err);
                res.send(200, value);
            });
    }

    function getMissingDate(value) {
        // check if value is array and length must large than 0
        if (value && Array.isArray(value) && value.length > 0) {
            var result = [];
            var v;
            // for each value
            for (v in value) {
                // check if attr date of value is array and length must large than 0
                if (Array.isArray(v.date) && v.date.length > 0) {
                    var i;
                    // for from 1 to length -1
                    for (i = 1; i < v.date.length; i++) {
                        // compare diffirent date from i and i-1
                        var diff = moment(v.date[i].diff(v.date[i - 1], 'days'))
                        console.log(v.date[i] + ' - ' + v.date[i - 1] + ' -> ' + diff);
                    }
                }
            }
        } else {
            return value;
        }
    }

    app.put(consts.url_place_log_time, logTime);
    app.get(consts.url_place_get_date_spent, getDateSpent);
    app.get(consts.url_place_list, list);
};