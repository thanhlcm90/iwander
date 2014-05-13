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

        getListPlace(req, function(err, place) {
            next.ifError(err);
            place = place.filter(function(item) {
                return item._id === countryName;
            });
            var spent = 0;
            if (place && place.length > 0) {
                spent = place[0].spent;
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
        getListPlace(req, function(err, place) {
            next.ifError(err);
            res.send(200, place);
        })
    }

    /**
     * [getListPlace description]
     * @param  {[type]} req request
     * @param {@function} callback function(err, placeList)
     * @return {[type]}
     */
    function getListPlace(req, callback) {

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
        // we will find all documents in Place collection in current year
        var where = {
            user_id: user._id,
            time_start: {
                $gte: start.toDate(),
                $lte: end.toDate()
            }
        };
        // find and sort by time_start (asc)
        Place.find()
            .where(where)
            .sort({
                time_start: 1
            })
            .exec(function(err, value) {
                if (err) return callback(err);
                // check if value is array and length must large than 0
                var result = {};
                if (value && Array.isArray(value) && value.length > 0) {
                    var i;
                    var countryName = value[0].country_name;
                    var firstTime = value[0].time_start;
                    result[countryName] = [];
                    // first log country is not israel, we consider have 1 day in israel
                    if (countryName.toLowerCase() !== 'israel') {
                        result['israel'] = [];
                        result['israel'].push(firstTime);
                    } else {
                        result[countryName].push(firstTime);
                    }
                    // for each value
                    for (i = 1; i < value.length; i++) {
                        // get days diff between two date
                        var diff = Math.abs(moment(firstTime).diff(value[i].time_start, 'days'));
                        // check if result has object with key is country name
                        if (!result[value[i].country_name]) {
                            result[value[i].country_name] = [];
                        }
                        // check if diff time between previous time_start and now time_start
                        // diff > 1, add missing date is previous country_name
                        if (diff > 1) {
                            addDateRange(firstTime, value[i].time_start, result[countryName]);
                        }
                        // add current country_name
                        // check if previous country is israel, then push previous country
                        if (countryName.toLowerCase() === 'israel') {
                            result[countryName].push(value[i].time_start);
                        } else {
                            // push current country
                            result[value[i].country_name].push(value[i].time_start);
                        }
                        countryName = value[i].country_name;
                        firstTime = value[i].time_start;
                    }
                }
                // convert object to array
                var places = Object.keys(result);
                var array = [];
                places.forEach(function(place) {
                    var item = {
                        _id: place,
                        spent: result[place].length,
                        date: result[place]
                    }
                    array.push(item);
                });
                return callback(null, array);
            });
    }

    /**
     * add missing day between 2 date to array
     * @param {[type]} start
     * @param {[type]} end
     * @param {[type]} array
     */
    function addDateRange(start, end, array) {
        var st = moment(start).add('days', 1);
        while (st.isBefore(end)) {
            array.push(st.clone().toDate());
            st.add('days', 1);
        }
    }

    app.put(consts.url_place_log_time, logTime);
    app.get(consts.url_place_get_date_spent, getDateSpent);
    app.get(consts.url_place_list, list);
};