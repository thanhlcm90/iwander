// dependencies
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Place = mongoose.model('Place'),
    ObjectId = mongoose.Types.ObjectId,
    restify = require('restify'),
    async = require('async'),
    moment = require('moment-timezone'),
    validator = require('validator'),
    consts = require(__config_path + "/consts"),
    israelTimezone = "Asia/Jerusalem";

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
        // get current time and convert it to israel time zone
        var timeStart = req.params.time_start;
        if (!validator.isNull(timeStart)) {
            if (moment(timeStart).isValid()) {
                // convert to javascript Date type
                timeStart = moment(timeStart).tz(israelTimezone);
            } else {
                return next(new restify.InvalidArgumentError('time_start is not date time'));
            }
        } else {
            timeStart = moment().tz(israelTimezone);
        }
        // check validate param country_name
        if (validator.isNull(countryName)) {
            return next(new restify.InvalidArgumentError('country_name cannot be blank'));
        }
        // trim and lower
        countryName = countryName.trim().toLowerCase();
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

        // condition query is user_id, and start_time between start and end
        var where = {
            user_id: user._id,
            time_start: {
                $gte: start.format(),
                $lte: end.format()
            }
        };
        Place.findOne(where, function(err, data) {
            if (err) {
                cb(err);
            } else {
                // data is null, first time to log
                if (!data) {
                    // 
                    data = new Place();
                    data.user_id = user._id;
                    data.country_name = countryName;
                    data.lng = lng;
                    data.lat = lat;
                    data.time_start = timeStart.format();
                    data.save(function(err, data) {
                        next.ifError(err);
                        res.send(200, data);
                    });
                } else {
                    // if exits  save last log
                    data.country_name_last = countryName;
                    data.time_end = timeStart.format();
                    data.save(function(err, data) {
                        next.ifError(err);
                        res.header("Content-Type", "application/json; charset=utf-8");
                        res.send(200, data);
                    });
                }
            }
        });
    }


    /**
     * API get day spent of one place in this year
     *
     * Request params:
     *  - token:        user token
     *  - country_name: country name
     *  - method:       calulate method, enum value, 2 value: 'ita' or 'regular'. Default is 'ita'
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
        countryName = countryName.trim().toLowerCase();

        getListPlace(req, function(err, place) {
            next.ifError(err);
            // create array filter with condition is country name
            place = place.filter(function(item) {
                return item._id === countryName;
            });
            //  get day spent of country
            var spent = 0;
            if (place && place.length > 0) {
                spent = place[0].spent;
            } else if (countryName === 'israel') {
                spent = user.israel_spent_day;
            }
            res.header("Content-Type", "application/json; charset=utf-8");
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
     *  - method:       calulate method, enum value, 2 value: 'ita' or 'regular'. Default is 'ita'
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
        getListPlace(req, function(err, place) {
            next.ifError(err);
            if (place.length === 0 && user.israel_spent_day !== 0) {
                var item = {
                    _id: "israel",
                    spent: user.israel_spent_day,
                    date: []
                }
                place.push(item);
            }
            res.header("Content-Type", "application/json; charset=utf-8");
            res.send(200, place);
        })
    }
    /**
     * Update israel day spent in first time loged into system (after register)
     * @param  {[type]}   req  request
     * @param  {[type]}   res  response
     * @param  {Function} next next
     * @return {[type]}        [description]
     */
    function updateIsraelDay(req, res, next) {
        var user = req.user;
        var israelSpentDay = req.params.israelSpentDay;
        if (!validator.isNumeric(israelSpentDay)) {
            return next(new restify.InvalidArgumentError("spentDay must be a number"));
        }
        user.israel_spent_day = israelSpentDay;
        user.save(function(err, data) {
            if (err) console.log(err);
            next.ifError(err);
            res.send(200);
            next();
        });
    }

    /**
     * Get list place and day spent in current year.
     * Calc day spent using method 1
     *
     * Take for example a person came from Israel on:
     *January 1, and returned on January 4
     *Released on January 7th, returned on January 11
     *Released on Jan 18, returned in 26 - January
     *How to calculate how many days the user spends in Israel?
     *Income tax system (ITA):
     *
     *Counting the day of departure and the day of return in Israel
     *That is -
     *January 1 - Israel (one day)
     *January 2 to 3 - not Israel
     *January 4 to January 7 - Israel (four days)
     *January 8 to 10 - Not Israel
     *January 11 to 18 - Israel (eight days)
     *January 19 to 25 - Not Israel
     *January 26 to 31 - Israel (six days)
     *Total days in Israel (IRS approach) - 1 + 4 + 8 + 6 = 19
     *
     *Standard Method (regular):
     *
     *Count only the day entering Israel but the day is considered a day overseas port.
     *That is -
     *January 1 to 3 - not Israel
     *January 4 to 6 - Israel (three days)
     *January 7 to 10 - Not Israel
     **January 11 to 17 - Israel (seven days)
     *January 18 to 25 - Not Israel
     *January 26 to 31 - Israel (six days)
     *Total days in Israel - 3 + 7 + 6 = 16 days
     *
     * @param  {[type]} req request
     * @param {@function} callback function(err, placeList)
     * @return {[type]}
     */
    function getListPlace(req, callback) {

        var i;
        var user = req.user;
        var year = req.params.year;
        var removeDuplicate = req.params.removeduplicate;
        // init start day is begin date of year
        var start = moment().tz(israelTimezone);
        start.month(0);
        start.date(1);
        start.hour(0);
        start.minute(0);
        start.second(0);

        // init end day is end date of year
        var end = moment().tz(israelTimezone);
        end.month(11);
        end.date(31);
        end.hour(23);
        end.minute(59);
        end.second(59);

        // get all year
        start.year(1);
        end.year(9999);

        // get method two method: ita or regular
        var method = req.params.method;
        if (validator.isNull(method)) {
            // default method is ita
            method = "ita";
        }
        if (method !== "ita" && method !== "regular") {
            return callback(new restify.InvalidArgumentError("unknown method"));
        }

        // we will find all documents in Place collection in current year
        var where = {
            user_id: user._id,
            time_start: {
                $gte: start.format(),
                $lte: end.format()
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
                    debugger;
                    var countryName = value[0].country_name;
                    var lastCountry = value[0].country_name_last;
                    // get first value time, convert it to israel time zone
                    var firstTime = moment(value[0].time_start).tz(israelTimezone);
                    // init result with array null and first time in country
                    result[countryName] = [];
                    if (method === 'ita') {
                        if (countryName === 'israel' && lastCountry !== 'israel')
                            result[countryName].push(firstTime);
                        else if (lastCountry && lastCountry.length) {
                            result[lastCountry] = [];
                            result[lastCountry].push(firstTime);
                        } else
                            result[countryName].push(firstTime);
                    } else {
                        if (lastCountry && lastCountry.length) {
                            result[lastCountry] = [];
                            result[lastCountry].push(firstTime);
                        } else {
                            result[countryName].push(firstTime);
                        }
                    }

                    // remove all duplicate
                    var inc = 1;
                    while (inc < value.length) {
                        var st = moment(value[inc - 1].time_start).tz(israelTimezone);
                        var ed = moment(value[inc].time_start).tz(israelTimezone);
                        var diff = getDiffDay(st, ed);
                        if (diff === 0) {
                            value.splice(inc - 1, 1);
                        }
                        inc++;
                    }

                    // for each value
                    for (i = 1; i < value.length; i++) {
                        // get current time of value i, convert it to israel time zone
                        var currentTime = moment(value[i].time_start).tz(israelTimezone);
                        // get days diff between two date
                        var diff = getDiffDay(firstTime, currentTime);
                        // remove duplicate days
                        if (removeDuplicate === '1' && diff === 0 && result[countryName].length > 0) {
                            // log 2 place or 1 place into 1 date, remove previous
                            result[countryName].splice(-1);
                        }
                        if (diff > 0) {
                            // result hasn't object with key is country name, create one with array null
                            if (!result[value[i].country_name]) {
                                result[value[i].country_name] = [];
                            }
                            // check if diff time between previous time_start and now time_start
                            // diff > 1, add missing date is previous country_name
                            if (diff > 1) {
                                addDateRange(firstTime, currentTime, result[countryName]);
                            }
                            // add current country_name
                            var currentLastCountry = value[i].country_name_last;
                            if (!result[currentLastCountry]) {
                                result[currentLastCountry] = [];
                            }

                            if (method === 'ita') {
                                // case 1: first time: israel, last time: not israel -> ITA: israel (ignore aboard day)
                                if (value[i].country_name === 'israel' && currentLastCountry !== 'israel')
                                    result[value[i].country_name].push(currentTime);
                                // case 2: first time: not israel, calc follow last time if last time not null, else calc follow first time
                                else if (currentLastCountry && currentLastCountry.length)
                                    result[currentLastCountry].push(currentTime);
                                // case 3: support old cast, previous country is israel
                                else if (countryName === 'israel') {
                                    // but previous last country is not israel, consider current is not in israel
                                    if (lastCountry && lastCountry.length)
                                        result[value[i].country_name].push(currentTime);
                                    else
                                    // else previous last country not found or is israel, consider current is in israel
                                        result[countryName].push(currentTime);
                                } else
                                    result[value[i].country_name].push(currentTime);
                            } else {
                                if (currentLastCountry && currentLastCountry.length)
                                    result[currentLastCountry].push(currentTime);
                                else
                                    result[value[i].country_name].push(currentTime);
                            }
                            lastCountry = currentLastCountry;
                            countryName = value[i].country_name;
                            firstTime = currentTime;
                        }
                    }
                }
                // convert object to array
                var validateYear = !validator.isNull(year) && validator.isNumeric(year);
                if (validateYear) {
                    // convert to number
                    year = parseInt(year);
                }
                var places = Object.keys(result);
                var array = [];
                places.forEach(function(place) {
                    var arrayTime = [];
                    for (i = 0; i < result[place].length; i++) {
                        // check year
                        if (validateYear && result[place][i].year() === year) {
                            arrayTime.push(result[place][i].format());
                        } else if (!validateYear) {
                            arrayTime.push(result[place][i].format());
                        }
                    }
                    var daySpent = arrayTime.length;
                    // country is israel, add israelSpentDay in user
                    if (place === 'israel') {
                        if (validateYear && result[place].length > 0) {
                            // check first log year is equal year param, add israelSpentDay
                            if (result[place][0].year() === year) {
                                daySpent += user.israel_spent_day;
                            }
                        } else {
                            daySpent += user.israel_spent_day;
                        }
                    }
                    if (daySpent > 0) {
                        var item = {
                            _id: place,
                            spent: daySpent,
                            date: arrayTime
                        }
                        array.push(item);
                    }
                });
                array.sort(function(a, b) {
                    return a._id.localeCompare(b._id);
                });
                return callback(null, array);
            });
    }

    /**
     * get different days between 2 days
     *
     * @param  {date} start start date time
     * @param  {date} end   end date time
     * @return {int}       return different days
     */
    function getDiffDay(start, end) {
        var st = start.clone();
        st.hour(0);
        st.minute(0);
        st.second(0);
        var ed = end.clone();
        ed.hour(0);
        ed.minute(0);
        ed.second(0);
        return Math.abs(st.diff(ed, 'days'));
    }

    /**
     * add missing day between 2 date to array
     * @param {[type]} start
     * @param {[type]} end
     * @param {[type]} array
     */
    function addDateRange(start, end, array) {
        // add one day to start time
        var st = start.clone();
        st.hour(0);
        st.minute(0);
        st.second(0);
        var ed = end.clone();
        ed.hour(0);
        ed.minute(0);
        ed.second(0);
        st.add('days', 1);
        // check after add one day, day before end times
        while (st.isBefore(ed)) {
            array.push(st.clone());
            st.add('days', 1);
        }
    }

    app.put(consts.url_place_log_time, logTime);
    app.get(consts.url_place_get_date_spent, getDateSpent);
    app.get(consts.url_place_list, list);
    app.put(consts.url_place_update_israel_spent_day, updateIsraelDay);
};