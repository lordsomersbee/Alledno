const express = require('express');
const router = express.Router();
const multer  = require('multer')
const path = require('path');

const storage = multer.diskStorage({
	destination: (req, file, callback) => {
		callback(null, './public/img');
	},
	filename: (req, file, callback) => {
		// callback(null, req.user.username + Date.now() + path.extname(file.originalname));
		callback(null, `${req.user.username}${Date.now()}${path.extname(file.originalname)}`);
	}
});

const upload = multer({storage});

const Product = require('../models/Product');

router.get('/new_product', (req, res) => {
	res.render('new_product');
});

router.post('/new_product', upload.single('avatar'), (req, res) => {
	req.checkBody('title', 'Tytuł aukcji jest wymagany').notEmpty();
	req.checkBody('price', 'Cena produktu jest wymagana').notEmpty();
	req.checkBody('price', 'Cena musi by liczbą').isDecimal();
	req.checkBody('amount', 'Ilośc produktu jest wymagana').notEmpty();
	req.checkBody('amount', 'Ilośc musi by liczbą').isDecimal();
	req.checkBody('description', 'Opis aukcji jest wymagany').notEmpty();
	
	const errors = req.validationErrors();
	if(typeof req.file !== 'undefined'){
		if(!req.file.filename.includes('.png') && !req.file.filename.includes('.jpg') && !req.file.filename.includes('.jpeg')) {
			(errors = errors || []).push({param: 'file', msg: 'Zły format pliku', value: ''})
		}
	}
	else {
		(errors = errors || []).push({param: 'file', msg: 'Zdjęcie jest wymagane', value: ''})
	}

	if(errors) {
		res.render('new_product', {errors});
	} else {
		const newProduct = new Product({
			title: req.body.title,
			price: req.body.price,
			amount_total: req.body.amount,
			amount_ordered: 0,
			image: req.file.filename,
			description: req.body.description,
			seller: req.user._id
		});

		Product.createProduct(newProduct, (err, product) => {
			if(err) throw err;
		});

		req.flash('success_msg', 'Wystawiono oferte');
		res.redirect('/');
	}
});

router.get('/show_offers', (req, res) => {
	Product.getProductsOfUser(req.user._id, (err, offers) => {
		if (err) throw err;

		res.render('show_offers', {offers});
	});
});

router.get('/edit_offer/:offer_id', (req, res) => {
	Product.findById(req.params.offer_id, (err, product) => {
		if (err) throw err;

		if(product.seller != req.user._id) {
			req.flash('error_msg', 'Nie możesz edytowac tej oferty');
			res.redirect('/');
		} 
		else {

		}
	});
});

router.get('/delete_offer/:offer_id', async (req, res) => {
	try {
		await Product.deleteOne({_id: req.params.offer_id})
	} 
	catch(err) {throw err};

	req.flash('error_msg', 'Usunięto ofertę');
	res.redirect('/confirmed/show_offers');
});

module.exports = router;