var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;;

var User = require('../models/User');

router.get('/register', function(req, res){
	res.render('register');
});

router.get('/login', function(req, res){
	res.render('login');
});

//Register POST
router.post('/register', function(req, res){
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;	

	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

	if(errors) {
		res.render('register', {
			errors: errors
		});
	} else {
		var newUser = new User({
			username: username,
			email: email,
			password: password
		});

		User.createUser(newUser, function(err, user){
			if(err) throw err;
			// console.log(newUser);
		});

		req.flash('success_msg', 'You are registered');

		res.redirect('/users/login');
	}
});

//Login system strategy
passport.use(new LocalStrategy(
	function(username, password, done) {
		User.getUserByUsername(username, function(err, user){
			if(err) throw err;
			if(!user) {
				return done(null, false, {message: 'Unknown User'});
			}

			User.comparePassword(password, user.password, function(err, isMatch){
				if(err) throw err;
				if(isMatch) {
					return done(null, user);
				} else {
					return done(null, false, {message: 'Invalid password'});
				}
			});
		})
	}
));

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
		done(err, user);
	});
});

router.post('/login', 
	passport.authenticate('local', {successRedirect: '/', failureRedirect: '/users/login', failureFlash: true}), 
	function(req, res) {
		res.redirect('/');
});

router.get('/logout', function(req, res){
	req.logout();
	delete req.session.cart;

	req.flash('success_msg', "Wylogowano");
	res.redirect('/users/login');
});

router.get('/panel', function(req, res){
	if(req.isAuthenticated()){
		res.render('panel');
	} else {
		res.redirect('/users/login');
	}
});

router.get('/cart', function(req, res) {
	if(req.isAuthenticated()){
		if(req.session.cart) {
			var sum = 0;
			req.session.cart.forEach(function(item) {
				sum += item.amount_ordered * item.price;
			});
		}

		res.render('cart', {
			cart_products: req.session.cart,
			sum: sum
		});
	} else {
		res.redirect('/users/login');
	}
});

router.post('/change_password', function(req, res) {
	if(req.isAuthenticated()){
		req.checkBody('password', 'Password is required').notEmpty();
		req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

		var errors = req.validationErrors();

		if(errors) {
			res.render('panel', {
				errors: errors
			});
		} else {
			User.changePassword(req.user, req.body.password, function(err){
				if(err) throw err;

				req.flash('success_msg', 'Hasło zostało zmienione');
				res.redirect('/users/panel');
			});
		}

	} else {
		res.redirect('/users/login');
	}
});

router.post('/change_email', function(req, res) {
	if(req.isAuthenticated()){
		req.checkBody('email', 'Email is required').notEmpty();
		req.checkBody('email', 'Email is not valid').isEmail();

		var errors = req.validationErrors();

		if(errors) {
			res.render('panel', {
				errors: errors
			});
		} else {
			User.changeEmail(req.user, req.body.email, function(err){
				if(err) throw err;

				req.flash('success_msg', 'Email został zmieniony');
				res.redirect('/users/panel');
			});
		}

	} else {
		res.redirect('/users/login');
	}
});

module.exports = router;