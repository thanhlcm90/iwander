/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    moment = require('moment'),
    restify = require('restify');

/**
 * Place Schema
 */
var PlaceSchema = new Schema({
    user_id: {
        type: ObjectId,
        ref: 'User'
    },
    lng: {
        type: Number,
        default: 0
    },
    lat: {
        type: Number,
        default: 0
    },
    country_name: {
        type: String,
        trim: true,
        lowercase: true
    },
    country_name_last: {
        type: String,
        trim: true,
        lowercase: true
    },
    spent: {
        type: Number,
        default: 1
    },
    time_start: {
        type: String
    },
    time_end: {
        type: String
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },
    dateUpdated: {
        type: Date,
        default: Date.now
    }
});

/**
 * Validations
 */
var validatePresenceOf = function(value) {
    return value && value.length;
};

PlaceSchema.path('user_id').validate(function(user_id) {
    return !!user_id;
}, 'User Id cannot be blank');
PlaceSchema.path('country_name').validate(function(countryName) {
    return validatePresenceOf(countryName);
}, 'Country name cannot be blank');

/**
 * Pre-save hook
 */
PlaceSchema.pre('save', function(next) {
    this.dateUpdated = Date.now();
    next();
});

mongoose.model('Place', PlaceSchema);