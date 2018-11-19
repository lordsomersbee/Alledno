const express = require('express');
const router = express.Router();
const passport = require('passport');

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser((id, done) => {
	User.findById(id, (err, user) => {
		done(err, user);
	});
});

router.get('/logout', (req, res) => {
	if(req.session.cart) {
		req.session.cart.forEach((item) => {
			Product.findById(item._id, (err, itemInDatabase) => {
				Product.increaseAmountOrdered(itemInDatabase, -item.amount_ordered, (err) => {
					if(err) throw err;
				})
			});
		});
	}

	req.logout();
	delete req.session.cart;

	req.flash('success_msg', "Wylogowano");
	res.redirect('../login');
});

router.get('/panel', (req, res) => {
	res.render('panel');
});

router.get('/cart', (req, res) => {
	let sum = 0;
	
	if(req.session.cart) {
		req.session.cart.forEach((item) => {
			sum += item.amount_ordered * item.price;
		});
	}

	res.render('cart', { 
		cart_products: req.session.cart, 
		sum 
	});
});

router.get('/delete_from_cart/:item_id', (req, res) => {
	Product.findById(req.params.item_id, (err, item) => {
		if (err) throw err;

		const pos = req.session.cart.findIndex(i => i._id == item._id);

		if(pos != -1) {
			Product.increaseAmountOrdered(item, -req.session.cart[pos].amount_ordered, (err) => {
				if(err) throw err;

				req.session.cart.splice(pos, 1);
				res.redirect("/auth/cart");
			});
		}
	});
});

router.post('/change_password', (req, res) => {
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	const errors = req.validationErrors();

	if(errors) {
		res.render('panel', {errors});
	} else {
		User.changePassword(req.user, req.body.password, (err) => {
			if(err) throw err;

			req.flash('success_msg', 'Hasło zostało zmienione');
			res.redirect('/auth/panel');
		});
	}
});

router.post('/change_email', (req, res) => {
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();

	const errors = req.validationErrors();

	if(errors) {
		res.render('panel', {errors});
	} else {
		User.changeEmail(req.user, req.body.email, (err) => {
			if(err) throw err;

			req.flash('success_msg', 'Email został zmieniony');
			res.redirect('/auth/panel');
		});
	}
});

router.get('/finalize', (req, res) => {
	ordered_items = [];
	req.session.cart.forEach(function(item) {
		ordered_items.push({
			title: item.title,
			price: item.price,
			amount_ordered: item.amount_ordered,
			seller: item.seller
		})
	})

	const newOrder = new Order({
		items: ordered_items,
		customer: req.user._id
	});

	Order.createOrder(newOrder, (err) => {
		if(err) throw err;

		req.session.payment_mode = true;
		res.redirect('/payment');
	});

});

router.get('/show_orders', (req, res) => {
	Order.find({customer: req.user._id}).
	sort({"date" : -1}).
	exec(function(err, orders) {
		if (err) throw err;

		res.render('show_orders', {orders});
	});
});

router.post('/confirm', (req, res) => {
	req.checkBody('pesel', 'Pesel jest wymagany').notEmpty();
	req.checkBody('pesel', 'Pesel jest błędny').isNumeric();
	req.checkBody('pesel', 'Pesel jest błędny').isLength({min:9, max: 9});

	const errors = req.validationErrors();

	if(errors) {
		res.render('panel', {errors});
	} else {
		User.changePesel(req.user, req.body.pesel, (err) => {
			if(err) throw err;

			req.flash('success_msg', 'Prośba o weryfikacja została wysłana. Administrator podejmie działanie wciągu 24h.');
			res.redirect('/auth/panel');
		});
	}
});

router.post('/buy/:item_id', (req, res) => {
	req.checkBody('amount', 'Ilośc produktu jest wymagana').notEmpty();
	req.checkBody('amount', 'Ilośc musi by liczbą').isDecimal();

	const errors = req.validationErrors();
	if(errors) {
		res.render('index', {errors});
	}
	else {
		Product.findById(req.params.item_id, (err, item) => {
			if (err) throw err;
			
			if(req.body.amount <= item.amount_total - item.amount_ordered) {
				Product.increaseAmountOrdered(item, parseInt(req.body.amount), (err) => {
					if(err) throw err;

					item.amount_ordered = req.body.amount;
					const cart = [];

					if(req.session.cart) {
						cart = req.session.cart;
						const pos = cart.findIndex(i => i._id == item._id);
						
						if(pos == -1) {
							cart.push(item);
						}
						else {
							const buf = parseInt(cart[pos].amount_ordered) + parseInt(item.amount_ordered);
							cart[pos].amount_ordered = buf;
						}
					}
					else {
						cart.push(item);
					}

					req.session.cart = cart;

					res.redirect('/auth/cart');
				});	
			}
			else {
				res.redirect(`/display/${item._id}`);
			}
		});
	}
});

module.exports = router;