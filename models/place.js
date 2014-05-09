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
    spent: {
        type: Number,
        default: 0
    },
    time_start: {
        type: Date,
        default: Date.now
    },
    time_end: {
        type: Date
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
    // check if time_end is null, we calc 0.5 day
    if (this.time_end) {
        this.spent = 1;
    } else {
        this.spent = 0.5;
    }
    this.dateUpdated = Date.now();
    next();
});

mongoose.model('Place', PlaceSchema);