var mongoose = require('mongoose');

var OrderSchema = mongoose.Schema({
    items: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'Product'
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
