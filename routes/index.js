var express = require('express');
var router = express.Router();

var Product = require('../models/Product');

router.get('/', function(req, res){
	Product.getProducts(function(err, products) {
		if (err) throw err;
		// products.pop();

		res.render('index', {
			products: products
		});
	});

	// res.render('index');
});

module.exports = router;