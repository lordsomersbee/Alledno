var mongoose = require('mongoose');

var ProductSchema = mongoose.Schema({
    title: {
        type: String,
        index: true
    },
    price: {
        type: String
    },
    amount_total: {
        type: String
    },
    amount_ordered: {
        type: String
    },
    image: {
        type: String
    },
    description: {
        type: String
    }
});

var Product = module.exports = mongoose.model('Product', ProductSchema);

module.exports.createProduct = function(newProduct, callback){
    newProduct.save(callback);
}

module.exports.getProducts = function(callback){
    Product.find(callback);
}
