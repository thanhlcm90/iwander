/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    crypto = require('crypto'),
    restify = require('restify');

/**
 * User Schema
 */
var UserSchema = new Schema({
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true
    },
    fullname: {
        type: String,
        trim: true
    },
    hashed_password: {
        type: String,
        trim: true,
        select: false
    },
    token: {
        type: String,
        trim: true
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
 * Virtuals
 */
UserSchema
    .virtual('password')
    .set(function(password) {
        this._password = password;
        this.hashed_password = this.encryptPassword(password);
    })
    .get(function() {
        return this._password;
    });

/**
 * Validations
 */
var validatePresenceOf = function(value) {
    return value && value.length;
};
UserSchema.path('email').required(true, 'Email cannot be blank');
UserSchema.path('hashed_password').required(true, 'Password cannot be blank');

/**
 * Pre-save hook
 */
UserSchema.pre('save', function(next) {
    if (this.email.indexOf('@') <= 0) {
        return next(new restify.InternalError('Email address must be valid'));
    }
    if (!validatePresenceOf(this.username)) {
        this.username = this.email;
    }
    this.dateUpdated = Date.now();
    next();
});

/**
 * Methods
 */

UserSchema.methods = {

    /**
     * Authenticate - check if the passwords are the same
     *
     * @param {String} plainText
     * @return {Boolean}
     * @api private
     */
    authenticate: function(plainText) {
        return this.encryptPassword(plainText) === this.hashed_password;
    },

    /**
     * Encrypt password
     *
     * @param {String} password
     * @return {String}
     * @api private
     */
    encryptPassword: function(password) {
        if (!password) return ''
        return crypto.createHmac('sha1', this._id.toString()).update(password).digest('hex'); // using the ObjectId as the salt
    }
}

mongoose.model('User', UserSchema)