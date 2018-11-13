var express = require('express');
var router = express.Router();

var Product = require('../models/Product');

router.get('/', function(req, res){
	Product.getProducts(function(err, products) {
		if (err) throw err;
		
		res.render('index', {
			products: products
		});

		// res.json(products);
	});

	// res.render('index');
});

router.get('/sort/:attr/:mode', function(req, res) {
	console.log((req.params.attr == "asc") ? 1 : -1);
	Product.find({}).sort({"req.params.attr": (req.params.attr == "asc") ? 1 : -1}).exec(function(err, products) { 
		if (err) throw err;
		
		res.render('index', {
			products: products
		});
	});
});

module.exports = router;