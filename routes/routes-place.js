// dependencies
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Place = mongoose.model('Place'),
    ObjectId = mongoose.Types.ObjectId,
    restify = require('restify'),
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
                timeStart = moment(timeStart).toDate();
            } else {
                return next(new restify.InvalidArgumentError('time_start is not date time'));
            }
        } else {
            return next(new restify.InvalidArgumentError('time_start cannot be blank'));
        }
        if (!validator.isNull(timeEnd) && moment(timeEnd).isValid()) {
            // convert to javascript Date type
            timeEnd = moment(timeEnd).toDate();
        }
        // check validate param country_name
        if (validator.isNull(countryName)) {
            return next(new restify.InvalidArgumentError('country_name cannot be blank'));
        }
        // Set start is 00:00:00 of day
        var start = new Date(timeStart);
        start.setHours(0);
        start.setMinutes(0);
        start.setSeconds(0);
        // set end is 23:59:59 of day
        var end = new Date(timeStart);
        end.setHours(23);
        end.setMinutes(59);
        end.setSeconds(59);

        // condition query is user_id, country_name, and start_time between start and end
        var where = {
            user_id: user._id,
            country_name: countryName,
            time_start: {
                $gte: start,
                $lte: end
            }
        };
        Place.findOne(where, function(err, data) {
            if (err) {
                cb(err);
            } else {
                if (!data) {
                    // not found log, create new log
                    data = new Place();
                    data.user_id = user._id;
                    data.country_name = countryName;
                }
                data.lng = lng;
                data.lat = lat;
                data.time_start = timeStart;
                data.time_end = timeEnd;
                data.save(function(err, data) {
                    next.ifError(err);
                    res.send(200);
                });
            }
        });
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
        var year = new Date().getFullYear();
        if (validator.isNull(countryName)) {
            return next(new restify.InvalidArgumentError('country_name cannot be blank'));
        }

        // init start day, end day of year
        var start = moment(year + '-01-01T00:00:00').toDate();
        var end = moment(year + '-12-31T23:59:59').toDate();
        var where = {
            user_id: user._id,
            country_name: countryName.toLowerCase(),
            time_start: {
                $gte: start,
                $lte: end
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
        var year = new Date().getFullYear();
        // init start day, end day of year
        var startStr = year + '-01-01T00:00:00';
        var endStr = year + '-12-31T23:59:59';
        var zone = moment().zone();
        if (zone < 0) {
            startStr = startStr + '+' + (-zone / 60) + (-zone % 60)
            endStr = endStr + '+' + (-zone / 60) + (-zone % 60)
        } else {
            startStr = startStr + '-' + (zone / 60) + (zone % 60)
            endStr = endStr + '-' + (zone / 60) + (zone % 60)
        }
        console.log(startStr);
        var start = moment(startStr).toDate();
        var end = moment(endStr).toDate();
        console.log(start);
        var where = {
            user_id: user._id,
            time_start: {
                $gte: start,
                $lte: end
            }
        };
        console.log(moment().zone());
        Place.aggregate()
            .match(where)
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

    app.put(consts.url_place_log_time, logTime);
    app.get(consts.url_place_get_date_spent, getDateSpent);
    app.get(consts.url_place_list, list);
};