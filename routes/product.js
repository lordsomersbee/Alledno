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
	Product.findById(req.params.item_id).
	populate('seller').
	exec(function(err, item) {
		if (err) throw err;

		res.render('item', {
			item: item
		});
	});
});

router.post('/buy/:item_id', upload.none(), function(req, res) {
	Product.findById(req.params.item_id, function(err, item) {
        if (err) throw err;
		
		if(req.body.amount <= item.amount_total - item.amount_ordered) {
			Product.increaseAmountOrdered(item, parseInt(req.body.amount), function(err){
				if(err) throw err;

				item.amount_ordered = req.body.amount;

				if(req.session.cart) {
					var cart = req.session.cart;
					var pos = cart.findIndex(i => i._id == item._id);
					
					if(pos == -1) {
						cart.push(item);
					}
					else {
						var buf = parseInt(cart[pos].amount_ordered) + parseInt(item.amount_ordered);
						cart[pos].amount_ordered = buf;
					}
				}
				else {
					var cart = [];
					cart.push(item);
				}

				req.session.cart = cart;

				res.redirect('/users/cart');
			});	
		}
		else {
			res.redirect('/product/display/'+item._id);
		}
	});
});

router.get('/new_product', checkConfirmation, function(req, res){
	res.render('new_product');
});

router.post('/new_product', checkConfirmation, upload.single('avatar'), function(req, res) {
	req.checkBody('title', 'Tytuł aukcji jest wymagany').notEmpty();
	req.checkBody('price', 'Cena produktu jest wymagana').notEmpty();
	req.checkBody('amount', 'Ilośc produktu jest wymagana').notEmpty();
	req.checkBody('description', 'Opis aukcji jest wymagany').notEmpty();
	// req.checkBody('file', 'Zdjęcie przedmiotu jest wymagane').notEmpty();

	var errors = req.validationErrors();

	if(errors) {
		res.render('new_product', {
			errors: errors
		});
	} else {
		var newProduct = new Product({
			title: req.body.title,
			price: req.body.price,
			amount_total: req.body.amount,
			amount_ordered: 0,
			image: req.file.filename,
			description: req.body.description,
			seller: req.user._id
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