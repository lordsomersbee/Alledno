var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var uniqueValidator = require('mongoose-unique-validator');

var UserSchema = mongoose.Schema({
    username: {
        type: String,
        index: true,
        unique: true
    },
    password: {
        type: String
    },
    email: {
        type: String,
        unique: true
    },
    role: {
        type: String,
        default: "unconfirmed"
    },
    pesel: {
        type: String,
        default: "0"
    }
    // offers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
});

UserSchema.plugin(uniqueValidator);
var User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function(newUser, callback){
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(newUser.password, salt, function(err, hash) {
            newUser.password = hash;
            newUser.save(callback);
        });
    });
}

module.exports.getUserByUsername = function(username, callback){
    var query = {username: username};
    User.findOne(query, callback);
}

module.exports.comparePassword = function(password, hash, callback){
    bcrypt.compare(password, hash, function(err, isMatch) {
        if(err) throw err;
        callback(null, isMatch);
    });
}

module.exports.changeEmail = function(userToSave, newEmail, callback){
    userToSave.email = newEmail;
    userToSave.save(callback);
}

module.exports.changePassword = function(userToSave, newPassword, callback){
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(newPassword, salt, function(err, hash) {
            userToSave.password = hash;
            userToSave.save(callback);
        });
    });
}

module.exports.confirmUser = function(user, callback){
    user.role = "confirmed";
    user.save(callback);
}

module.exports.changePesel = function(user, pesel, callback){
    user.pesel = pesel;
    user.save(callback);
}

module.exports.getUnconfirmedUsers = function(callback){
    var query = {pesel: { $gt: 1 }, role: "unconfirmed"};
    User.find(query, callback);
}