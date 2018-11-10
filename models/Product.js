var mongoose = require('mongoose');

var ProductSchema = mongoose.Schema({
    title: {
        type: String,
        index: true
    },
    price: {
        type: Number
    },
    amount_total: {
        type: Number
    },
    amount_ordered: {
        type: Number
    },
    image: {
        type: String
    },
    description: {
        type: String
    },
    seller: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'User' 
    }
});

var Product = module.exports = mongoose.model('Product', ProductSchema);

module.exports.createProduct = function(newProduct, callback){
    newProduct.save(callback);
}

module.exports.getProducts = function(callback){
    Product.find(callback);
}

module.exports.increaseAmountOrdered = function(product, amount, callback){
    product.amount_ordered += amount;
    product.save(callback);
}

module.exports.getProductsOfUser = function(user_id, callback){
    Product.find({ 'seller': user_id }, callback);
}
