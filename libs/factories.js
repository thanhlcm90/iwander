var mongoose = require('mongoose'),
    User = mongoose.model('User'),
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

module.exports = Factory;