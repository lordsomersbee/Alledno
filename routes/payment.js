var express = require('express');
var router = express.Router();
var paypal = require('paypal-rest-sdk');

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AfwIxaLcKIZ3N3qYY2l0rbY48A0F9JgEx-V9zHXUkGvMXyOoB_9mpGIbu2SH7zPMifGefL5TTOTy5T69',
    'client_secret': 'EKjMACt8Sc2TA38hWf_MIzkLvYwAB7QbnD5hhHMUnjVzEfjfBCznHMKPXn69w2fXMzOPTf1GGnhC9dEN'
});

router.get('/', checkPaymentMode, function(req, res) {
	var create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/payment/success",
            "cancel_url": "http://localhost:3000/payment/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": []
            },
            "amount": {
                "currency": "USD",
                "total": "23.00"
            },
            "description": "Walk it like i talk it"
        }]
    };

    var sum = 0;
	req.session.cart.forEach(function(item) {
        sum += item.price * item.amount_ordered;
        create_payment_json.transactions[0].item_list.items.push({
            "name": item.title,
            "sku": "0001",
            "price": item.price,
            "currency": "USD",
            "quantity": item.amount_ordered
        });
    });
    create_payment_json.transactions[0].amount.total = sum;
    req.session.sum = sum;
    
    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            payment.links.forEach(function(link){
                if(link.rel === "approval_url") {
                    res.redirect(link.href);
                }
            });
        }
    });
});

router.get("/success", checkPaymentMode, function(req, res){
    var payerID = req.query.PayerID;
    var paymentID = req.query.paymentId;

    var execute_payment_json = {
        "payer_id": payerID,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": req.session.sum
            }
        }]
    };

    paypal.payment.execute(paymentID, execute_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            // console.log("Get Payment Response");
            // console.log(JSON.stringify(payment));
            delete req.session.sum;
            delete req.session.cart;
            delete req.session.payment_mode;
        
            req.flash('success_msg', 'Zamowienie zakończone');
            res.redirect('/');
        }
    });
});

router.get("/cancel", checkPaymentMode, function(req, res){
    delete req.session.payment_mode;

    req.flash('error_msg', 'Zamowienie anulowane');
    res.redirect('/');
});

//----------------------------

function checkPaymentMode(req,res,next){
    if(req.isAuthenticated() && req.session.payment_mode == true){
        next();
    } else {
        req.flash('error_msg', 'Nie tak szybko hackerze. Nie na warcie Martenzytycznego Mściciela!');
        res.redirect('/');
    }
}

module.exports = router;