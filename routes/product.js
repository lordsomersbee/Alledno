var express = require('express');
var router = express.Router();
var multer  = require('multer')
var path = require('path');

const storage = multer.diskStorage({
	destination: function(req, file, callback) {
		callback(null, './public/img');
	},
	filename: function(req, file, callback) {
		callback(null, req.user.username + Date.now() + path.extname(file.originalname));
	}
});
var upload = multer({storage: storage});

var Product = require('../models/Product');

router.get('/display/:item_id', function(req, res) {
	Product.findById(req.params.item_id, function(err, item) {
		if (err) throw err;

		res.render('item', {
			item: item
		});
	});
});

router.post('/buy/:item_id', upload.none(), function(req, res) {
	Product.findById(req.params.item_id, function(err, item) {
        if (err) throw err;
		
		if(req.body.amount >= item.amount_total) {
			item.amount_ordered = req.body.amount;

			var cart = req.session.cart || [];  
			cart.push(item);
			req.session.cart = cart;

			res.redirect('/users/cart');
		}
		else {
			res.redirect('/product/display/'+item._id);
		}
	});
});

router.get('/new_product', function(req, res){
	res.render('new_product');
});

router.post('/new_product', upload.single('avatar'), function(req, res) {
	var title = req.body.title;
	var price = req.body.price;
	var amount = req.body.amount;
	var description = req.body.description;	

	var errors = req.validationErrors();

	if(errors) {
		res.render('new_product', {
			errors: errors
		});
	} else {
		var newProduct = new Product({
			title: title,
			price: price,
			amount_total: amount,
			amount_ordered: 0,
			image: req.file.filename,
			description: description
		});

		// console.log(newProduct);

		Product.createProduct(newProduct, function(err, product){
			if(err) throw err;
			// console.log(newUser);
		});

		req.flash('success_msg', 'Wystawiono oferte');

		res.redirect('/');
	}
});

module.exports = router;