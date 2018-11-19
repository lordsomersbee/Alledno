var express = require('express');
var router = express.Router();
var faker = require('faker');

var User = require('../models/User');
var Product = require('../models/Product');
var Order = require('../models/Order');

router.get('/panel', (req, res) => {
    User.getUnconfirmedUsers((err, users) => {
        if (err) throw err;

        res.render('admin', {users});
    });
});

router.get('/confirm_user/:user_id', (req, res) => {
    User.findById(req.params.user_id, (err, user) => {
        if (err) throw err;
        User.confirmUser(user, (err) => {
            if (err) throw err;

            req.flash('success_msg', 'Użutkownik został zweryfikowany');
            res.redirect('/admin/panel');
        });
    });
});

router.get('/dummy_data', (req, res) => {
    User.remove({}, (err) => {
        if (err) console.log(err)
    });

    Product.remove({}, (err) => {
        if (err) console.log(err)
    });

    Order.remove({}, (err) => {
        if (err) console.log(err)
    });

    const newUser = new User({
        username: "qwe",
        email: "qwe@qwe.qwe",
        password: "qwe",
        role: "admin",
        pesel: "123123123"
    });
    User.createUser(newUser, (err, user) => {
        if (err) throw err;
    });

    for (const i = 0; i < 10; i++) {
        const newUser = new User({
            username: faker.name.firstName(),
            email: faker.internet.email(),
            password: "qwe",
            role: "confirmed",
            pesel: faker.random.number({ min: 100000000, max: 999999999 })
        });

        User.createUser(newUser, (err, user) => {
            if (err) throw err;

            for (const j = 0; j < 2; j++) {
                const newProduct = new Product({
                    title: faker.lorem.sentence(3),
                    price: faker.random.number({ min: 100, max: 9999 }),
                    amount_total: faker.random.number({ min: 10, max: 100 }),
                    amount_ordered: 0,
                    image: "prez.png",
                    description: faker.lorem.paragraph(3),
                    seller: user._id
                });

                Product.createProduct(newProduct, (err, product) => {
                    if (err) throw err;
                });
            }
        });
    }
});

module.exports = router;