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
    imageUrl: {
        type: String,    // Path to the uploaded image
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', productSchema);
