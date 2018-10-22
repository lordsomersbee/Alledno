var mongoose = require('mongoose');

var OrderSchema = mongoose.Schema({
    items: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'Product'
    }],
    customer: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'User' 
    }
});

var Order = module.exports = mongoose.model('Order', OrderSchema);

module.exports.createOrder = function(newOrder, callback){
    newOrder.save(callback);
}

module.exports.getOrders = function(callback){
    Order.find(callback);
}
