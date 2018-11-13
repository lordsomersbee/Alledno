var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/User');
var Product = require('../models/Product');
var Order = require('../models/Order');

router.get('/register', function(req, res){
	res.render('register');
});

router.get('/login', function(req, res){
	res.render('login');
});

//Register POST
router.post('/register', function(req, res){
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
			username: req.body.username,
			email: req.body.email,
			password: req.body.password
		});
		
		
		User.createUser(newUser, function(err, user){
			if(err) {
				if(err.errors) {
					if(err.errors.email && err.errors.email.message.includes('to be unique'))
						(errors = errors || []).push({param: 'email', msg: 'Email jest już zajęty', value: ''})
					
					if(err.errors.username && err.errors.username.message.includes('to be unique'))
						(errors = errors || []).push({param: 'username', msg: 'Nazwa użytkownika jest już zajęta', value: ''})

					res.render('register', {
						errors: errors
					});
				}
				else {
					throw err;
				}
			} 
			else {
				req.flash('success_msg', 'You are registered');
				res.redirect('/users/login');
			}
		});
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
	if(req.session.cart) {
		req.session.cart.forEach(function(item) {
			Product.findById(item._id, function(err, itemInDatabase) {
				Product.increaseAmountOrdered(itemInDatabase, -item.amount_ordered, function(err) {
					if(err) throw err;
				})
			});
		});
	}

	req.logout();
	delete req.session.cart;

	req.flash('success_msg', "Wylogowano");
	res.redirect('/users/login');
});

router.get('/panel', checkAuthentication, function(req, res){
	res.render('panel');
});

router.get('/cart', checkAuthentication, function(req, res) {
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

});

router.get('/delete_from_cart/:item_id', checkAuthentication, function(req, res) {
	Product.findById(req.params.item_id, function(err, item) {
		if (err) throw err;

		var pos = req.session.cart.findIndex(i => i._id == item._id);

		if(pos != -1) {
			Product.increaseAmountOrdered(item, -req.session.cart[pos].amount_ordered, function(err) {
				if(err) throw err;

				req.session.cart.splice(pos, 1);
				res.redirect("/users/cart");
			});
		}
		else {
			console.log("err");
		}
	});
});

router.post('/change_password', checkAuthentication, function(req, res) {
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
});

router.post('/change_email', checkAuthentication, function(req, res) {
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
});

router.get('/finalize', checkAuthentication, function(req, res) {
	ordered_items = [];
	req.session.cart.forEach(function(item) {
		ordered_items.push({
			title: item.title,
			price: item.price,
			amount_ordered: item.amount_ordered,
			seller: item.seller
		})
	})

	var newOrder = new Order({
		items: ordered_items,
		customer: req.user._id
	});
	Order.createOrder(newOrder, function(err){
		if(err) throw err;

		req.session.payment_mode = true;
		res.redirect('/payment');
	});

});

router.get('/show_orders', checkAuthentication, function(req, res) {
	Order.find({customer: req.user._id}).
	sort({"date" : -1}).
	exec(function(err, orders) {
		if (err) throw err;

		res.render('show_orders', {
			orders: orders
		});
	});
});

router.post('/confirm', checkAuthentication, function(req, res) {
	req.checkBody('pesel', 'Pesel jest wymagany').notEmpty();
	req.checkBody('pesel', 'Pesel jest błędny').isNumeric();
	req.checkBody('pesel', 'Pesel jest błędny').isLength({min:9, max: 9});

	var errors = req.validationErrors();

	if(errors) {
		res.render('panel', {
			errors: errors
		});
	} else {
		User.changePesel(req.user, req.body.pesel, function(err){
			if(err) throw err;

			req.flash('success_msg', 'Prośba o weryfikacja została wysłana. Administrator podejmie działanie wciągu 24h.');
			res.redirect('/users/panel');
		});
	}
});

//------------

function checkAuthentication(req,res,next){
    if(req.isAuthenticated()){
        next();
    } else {
        res.redirect("/users/login");
    }
}

function checkConfirmation(req,res,next){
    if(req.isAuthenticated()){
        if(req.user.role == "confirmed" || req.user.role == "admin") {
			next();
		} else {
			req.flash('error_msg', 'Musisz byc zweryfikowany aby moc wykonac tą czynnośc');
			res.redirect('/users/panel');
		}
    } else {
        res.redirect("/users/login");
    }
}

module.exports = router;