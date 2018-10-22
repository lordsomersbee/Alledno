var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

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
        type: String
    }
    // offers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
});

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