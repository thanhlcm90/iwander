var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Place = mongoose.model('Place'),
    moment = require('moment'),
    Factory = require('factory-lady');

Factory.define('user1', User, {
    fullname: 'test1',
    email: 'test1@test.com',
    password: '123456'
});

Factory.define('user2', User, {
    fullname: 'test2',
    email: 'test2@test.com',
    password: '1234567'
});

Factory.define('place1', Place, {
    country_name: 'vietnam',
    lng: 123.123,
    lat: 123.234123,
});
Factory.define('place2', Place, {
    country_name: 'Thailand',
    lng: 123.123,
    lat: 123.234123,
    time: moment('2014-04-01T18:00:00')
});
Factory.define('place3', Place, {
    country_name: 'China',
    lng: 123.123,
    lat: 123.234123,
});
Factory.define('place4', Place, {
    country_name: 'Japan',
    lng: 123.123,
    lat: 123.234123,
});
module.exports = Factory;