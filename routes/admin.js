var express = require('express');
var router = express.Router();
var faker = require('faker')

var User = require('../models/User');
var Product = require('../models/Product');
var Order = require('../models/Order');

router.get('/panel', checkAdmin, function(req, res) {
	User.getUnconfirmedUsers(function(err, users) {
        if (err) throw err;

		res.render('admin', {
			users: users
		});
	});
});

router.get('/confirm_user/:user_id', checkAdmin, function(req, res) {
	User.findById(req.params.user_id, function(err, user) {
		if(err) throw err;
		User.confirmUser(user, function(err) {
			if(err) throw err;
	
			req.flash('success_msg', 'Użutkownik został zweryfikowany');
			res.redirect('/admin/panel');
		});
	});
});

router.get('/dummy_data', checkAdmin, function(req, res) {
    User.remove({}, function(err) {
        if (err) {
            console.log(err)
        } else {
            res.end('success');
        }
    });

    Product.remove({}, function(err) {
        if (err) {
            console.log(err)
        } else {
            res.end('success');
        }
    });

    Order.remove({}, function(err) {
        if (err) {
            console.log(err)
        } else {
            res.end('success');
        }
    });
    
    var newUser = new User({
        username: "qwe",
        email: "qwe@qwe.qwe",
        password: "qwe",
        role: "admin",
        pesel: "123123123"
    });
    User.createUser(newUser, function(err, user){
        if(err) throw err;
    });
    
    for( var i = 0; i < 10; i++) {
        var newUser = new User({
            username: faker.name.firstName(),
            email: faker.internet.email(),
            password: "qwe",
            role: "confirmed",
            pesel: faker.random.number({min:100000000, max:999999999})
        });
    
        // console.log(newUser);
        User.createUser(newUser, function(err, user){
            if(err) throw err;

            for(var j = 0; j < 2; j++) {
                var newProduct = new Product({
                    title: faker.lorem.sentence(3),
                    price: faker.random.number({min:100, max:9999}),
                    amount_total: faker.random.number({min:10, max:100}),
                    amount_ordered: 0,
                    image: "prez.png",
                    description: faker.lorem.paragraph(3),
                    seller: user._id 
                });

                Product.createProduct(newProduct, function(err, product){
                    if(err) throw err;
                });
            }
        });
    }
});

//----------------------------

function checkAdmin(req,res,next){
    if(req.isAuthenticated()){
        if(req.user.role == "admin") {
			next();
		} else {
			req.flash('error_msg', 'Nie masz uprawnień do tych zasobow');
			res.redirect('/users/panel');
		}
    } else {
        res.redirect("/users/login");
    }
}

module.exports = router;