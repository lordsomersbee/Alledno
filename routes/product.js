var express = require('express');
var router = express.Router();

var Product = require('../models/Product');

router.get('/', function(req, res) {
	
});

router.get('/:item_id', function(req, res) {
	Product.findById(req.params.item_id, function(err, item) {
		if (err) throw err;

		res.render('item', {
			item: item
		});
	});
});

router.post('/buy/:item_id', function(req, res) {
	Product.findById(req.params.item_id, function(err, item) {
        if (err) throw err;
		
		if(req.body.amount <= item.amount_total) {
			item.amount_ordered = req.body.amount;

			var cart = req.session.cart || [];  
			cart.push(item);
			req.session.cart = cart;

			res.redirect('/users/cart');
		}
		else {
			res.redirect('/product/'+item._id);
		}
	});
});

module.exports = router;