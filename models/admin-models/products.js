const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: [{
            type: String,
            // enum: ['Electronics', 'Clothing', 'Books', 'Toys', 'Home', 'Other']  // predefined categories
        }],
        required: true
    },
    price: {
        type: Number,
        required: true
    },
   
    bvPoints: {
        type: Number,
        required: true
    },
    imageName: {
        type: String,    // Name of picture saved with format, like, ankit.png
        required: true
    },
    imageURL: {
        type: String,    // URL of the uploaded image
        required: true
    },
    description: {
        type: String,
        required: true
    },
    stock: {
        type: Number,
        required: true
    },
    ingredients: {
        type: String,
        required: true
    },
    product_benefits: {
        type: String,
        required: true
    },
    how_to_use: {
        type: String,
        required: true
    },
    disclaimer: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', productSchema);
