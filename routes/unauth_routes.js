const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const Product = require('../models/Product');
const User = require('../models/User');

router.get('/', (req, res) => {
	Product.getProducts((err, products) => {
		if (err) throw err;
		
		res.render('index', {products});
	});
});

router.get('/display/:item_id', (req, res) => {
	Product.findById(req.params.item_id).
	populate('seller').
	exec((err, item) => {
		if (err) throw err;
		res.render('item', {item});
	});
});

router.post('/login', 
	passport.authenticate('local', {successRedirect: '/', failureRedirect: '/login', failureFlash: true}), 
	(req, res) => {
		res.redirect('/');
});

//Register POST
router.post('/register', (req, res) => {
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	const errors = req.validationErrors();

	if(errors) {
		res.render('register', {errors});
	} else {
		const newUser = new User({
			username: req.body.username,
			email: req.body.email,
			password: req.body.password
		});
		
		User.createUser(newUser, (err, user) => {
			if(err) {
				if(err.errors) {
					if(err.errors.email && err.errors.email.message.includes('to be unique'))
						(errors = errors || []).push({param: 'email', msg: 'Email jest już zajęty', value: ''})
					
					if(err.errors.username && err.errors.username.message.includes('to be unique'))
						(errors = errors || []).push({param: 'username', msg: 'Nazwa użytkownika jest już zajęta', value: ''})

					res.render('register', {errors});
				}
				else {
					throw err;
				}
			} 
			else {
				req.flash('success_msg', 'You are registered');
				res.redirect('/login');
			}
		});
	}
});

router.get('/register', (req, res) => {
	res.render('register');
});

router.get('/login', (req, res) => {
	res.render('login');
});

router.get('/sort/:attr/:mode', (req, res) => {
	console.log((req.params.attr == "asc") ? 1 : -1);
	Product.find({}).sort({"req.params.attr": (req.params.attr == "asc") ? 1 : -1}).exec(function(err, products) { 
		if (err) throw err;
		
		res.render('index', {products});
	});
});

//Login system strategy
passport.use(new LocalStrategy(
	function(username, password, done) {
		User.getUserByUsername(username, (err, user) => {
			if(err) throw err;
			if(!user) {
				return done(null, false, {message: 'Unknown User'});
			}

			User.comparePassword(password, user.password, (err, isMatch) => {
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

module.exports = router;