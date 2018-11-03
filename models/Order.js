var mongoose = require('mongoose');

var OrderSchema = mongoose.Schema({
    items: [{
        title: String,
        price: Number,
        amount_ordered: Number,
        seller: {
            type: mongoose.Schema.Types.ObjectId, ref: 'User'
        }
    }],
    customer: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'User' 
    },
    date: {
        type: Date
    }
});

var Order = module.exports = mongoose.model('Order', OrderSchema);

module.exports.createOrder = function(newOrder, callback){
    newOrder.date = new Date();
    newOrder.save(callback);
}

module.exports.findOrdersByCustomer = function(customer_id, callback){
    Order.find({customer: customer_id}, callback); 
}
